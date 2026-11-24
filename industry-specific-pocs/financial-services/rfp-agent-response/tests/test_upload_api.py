# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
"""Tests for the upload API's validation and presigned POST."""

import base64
import json

import pytest

import upload_api
from conftest import BUCKET

MB = 1024 * 1024


def _event(body):
    return {'httpMethod': 'POST', 'body': json.dumps(body)}


def test_accepts_file_at_the_limit():
    request = upload_api.validate_upload_request(
        {'fileName': 'rfp.pdf', 'fileSize': 10 * MB}, 10 * MB)
    assert request['content_type'] == 'application/pdf'


@pytest.mark.parametrize('size', [10 * MB + 1, 50 * MB])
def test_rejects_files_over_the_limit_with_413(size):
    with pytest.raises(upload_api.UploadRejected) as error:
        upload_api.validate_upload_request(
            {'fileName': 'rfp.pdf', 'fileSize': size}, 10 * MB)
    assert error.value.status_code == 413


@pytest.mark.parametrize('body', [
    {'fileName': 'rfp.exe', 'fileSize': 10},
    {'fileName': 'rfp', 'fileSize': 10},
    {'fileName': '', 'fileSize': 10},
    {'fileName': 'rfp.pdf', 'fileSize': 0},
    {'fileName': 'rfp.pdf', 'fileSize': '10'},
    {'fileName': 'rfp.pdf', 'fileSize': True},
    {'fileName': 'rfp.pdf'},
    ['not', 'an', 'object'],
])
def test_rejects_invalid_requests(body):
    with pytest.raises(upload_api.UploadRejected) as error:
        upload_api.validate_upload_request(body, 10 * MB)
    assert error.value.status_code == 400


@pytest.mark.parametrize('name,expected', [
    ('My RFP (v2)', 'My_RFP_v2'),
    ('../../etc/passwd', 'etc_passwd'),
    ('...', 'rfp'),
    ('a' * 200, 'a' * 80),
])
def test_sanitize_base_name(name, expected):
    assert upload_api.sanitize_base_name(name) == expected


def test_handler_rejects_oversized_upload(aws):
    response = upload_api.lambda_handler(
        _event({'fileName': 'big.pdf', 'fileSize': 10 * MB + 1}), None)
    assert response['statusCode'] == 413


def test_handler_rejects_invalid_json(aws):
    response = upload_api.lambda_handler(
        {'httpMethod': 'POST', 'body': '{not json'}, None)
    assert response['statusCode'] == 400


def test_handler_returns_size_limited_presigned_post(aws, monkeypatch):
    monkeypatch.setenv('MAX_UPLOAD_BYTES', str(5 * MB))
    response = upload_api.lambda_handler(
        _event({'fileName': 'Bank RFP.PDF', 'fileSize': 1234}), None)

    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    stored = body['timestamped_filename']
    assert stored.startswith('Bank_RFP_') and stored.endswith('.pdf')
    assert body['uploadUrl'] == f'https://{BUCKET}.s3.us-east-1.amazonaws.com/'

    fields = body['fields']
    assert fields['key'] == f'uploaded_rfp_requests/{stored}'
    policy = json.loads(base64.b64decode(fields['policy']))
    conditions = policy['conditions']
    assert ['content-length-range', 1, 5 * MB] in conditions
    assert {'Content-Type': 'application/pdf'} in conditions
    assert {'key': f'uploaded_rfp_requests/{stored}'} in conditions

    item = aws['table'].get_item(Key={'file_name': stored})['Item']
    assert item['original_filename'] == 'Bank RFP.PDF'
    assert item['stages'][0]['name'] == 'uploaded'
