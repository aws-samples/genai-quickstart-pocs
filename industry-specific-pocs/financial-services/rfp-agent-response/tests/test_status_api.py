# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
"""Tests for the status API."""

import json

import pytest

import common
import status_api
from conftest import BUCKET


def _event(file_name):
    return {'httpMethod': 'GET',
            'queryStringParameters': {'fileName': file_name}}


@pytest.mark.parametrize('name', ['', '../x.txt', 'a/b.txt', '<script>.txt'])
def test_invalid_file_names_are_rejected(aws, name):
    assert status_api.lambda_handler(_event(name), None)['statusCode'] == 400


def test_status_record_gets_download_links_and_warnings(aws):
    common.update_processing_status('rfp_20260101_120000.pdf', 'uploaded',
                                    table=aws['table'])
    common.update_processing_status(
        'rfp_20260101_120000.pdf', 'compliance_reviewed',
        details=common.withheld_details([4]), table=aws['table'])

    response = status_api.lambda_handler(
        _event('rfp_20260101_120000.pdf'), None)

    body = json.loads(response['body'])
    assert body['stages'][0]['download_link'] == (
        '/download/uploaded_rfp_requests/rfp_20260101_120000.pdf')
    assert body['stages'][1]['withheld_count'] == 1
    assert body['warnings'] and 'Q4' in body['warnings'][0]


def test_status_falls_back_to_s3(aws):
    aws['s3'].put_object(Bucket=BUCKET,
                         Key='formatted_questions/rfp_questions.json',
                         Body=b'[]')
    body = json.loads(status_api.lambda_handler(
        _event('rfp.txt'), None)['body'])
    states = {stage['name']: stage['status'] for stage in body['stages']}
    assert states['uploaded'] == 'completed'
    assert states['questions_extracted'] == 'completed'
    assert states['final_document'] == 'pending'
    assert body['overall_status'] == 'processing'
