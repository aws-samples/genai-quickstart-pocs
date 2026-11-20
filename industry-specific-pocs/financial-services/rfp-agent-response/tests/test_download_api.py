# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
"""Tests for download path validation and the download API."""

import json
from urllib.parse import parse_qs, urlparse

import pytest

import common
import download_api
from conftest import BUCKET

ALLOWED = [
    ('final_responses/rfp_RFP_Response.txt',
     'final_responses/rfp_RFP_Response.txt'),
    ('rfp_final.json', 'final_responses/rfp_final.json'),
    ('uploaded_rfp_requests/rfp_20260101_120000.pdf',
     'uploaded_rfp_requests/rfp_20260101_120000.pdf'),
    ('formatted_questions/rfp_questions.json',
     'formatted_questions/rfp_questions.json'),
    ('completed_responses/rfp_responses.json',
     'completed_responses/rfp_responses.json'),
    ('compliance_reviewed/rfp_compliance_reviewed.json',
     'compliance_reviewed/rfp_compliance_reviewed.json'),
]

REJECTED = [
    None,
    '',
    '..',
    '../secret.txt',
    'final_responses/../uploaded_rfp_requests/x.pdf',
    'final_responses/..',
    'final_responses/.hidden',
    '/final_responses/x.txt',
    'final_responses/',
    'final_responses/a/b.txt',
    'other_prefix/x.txt',
    'final_responses\\x.txt',
    '%2e%2e/secret.txt',
    'final_responses/%2e%2e%2fsecret.txt',
    'final_responses/%252e%252e%252fsecret.txt',
    '..%2fsecret.txt',
    'final_responses/x%00.txt',
    'final_responses/x\x00.txt',
    'final_responses/a b.txt',
]


@pytest.mark.parametrize('path,key', ALLOWED)
def test_allowed_paths(path, key):
    assert common.validate_download_key(path) == key


@pytest.mark.parametrize('path', REJECTED)
def test_rejected_paths(path):
    with pytest.raises(ValueError):
        common.validate_download_key(path)


def _event(proxy=None, resource='/download/{proxy+}', method='GET'):
    return {
        'httpMethod': method,
        'resource': resource,
        'path': '/download/' + (proxy or ''),
        'pathParameters': {'proxy': proxy} if proxy is not None else None,
    }


@pytest.mark.parametrize('path', ['../x.txt', '%2e%2e/x.txt', 'secrets/x'])
def test_handler_rejects_traversal_with_400(aws, path):
    response = download_api.lambda_handler(_event(path), None)
    assert response['statusCode'] == 400


def test_handler_returns_404_for_missing_file(aws):
    response = download_api.lambda_handler(
        _event('final_responses/missing.txt'), None)
    assert response['statusCode'] == 404


def test_handler_returns_presigned_url(aws):
    key = 'final_responses/rfp_RFP_Response.txt'
    aws['s3'].put_object(Bucket=BUCKET, Key=key, Body=b'hello')

    response = download_api.lambda_handler(_event(key), None)

    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    url = urlparse(body['url'])
    assert url.hostname == f'{BUCKET}.s3.us-east-1.amazonaws.com'
    assert url.path == '/' + key
    query = parse_qs(url.query)
    assert query['X-Amz-Expires'] == ['300']
    assert 'attachment' in query['response-content-disposition'][0]
    assert response['headers']['Access-Control-Allow-Origin'] == (
        'https://d111111abcdef8.cloudfront.net')


def test_downloads_lists_final_responses_only(aws):
    aws['s3'].put_object(Bucket=BUCKET, Key='final_responses/a_final.json',
                         Body=b'{}')
    aws['s3'].put_object(Bucket=BUCKET,
                         Key='uploaded_rfp_requests/a_20260101_120000.txt',
                         Body=b'x')
    response = download_api.lambda_handler(
        _event(resource='/downloads'), None)
    names = [item['name'] for item in json.loads(response['body'])]
    assert names == ['a_final.json']
