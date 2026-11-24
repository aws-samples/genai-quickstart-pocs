# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
"""Tests for stage 1, the RFP question extractor."""

import json

import pytest

import common
import rfp_question_extractor as extractor
from conftest import BUCKET, MODEL_ID, make_pdf, s3_event


def test_extract_text_from_pdf_uses_pypdf():
    pdf = make_pdf('The vendor must support single sign-on.')
    assert 'single sign-on' in extractor.extract_text('rfp.pdf', pdf)


def test_extract_text_from_pdf_without_text_fails():
    with pytest.raises(ValueError):
        extractor.extract_text_from_pdf(make_pdf(''))


def test_extract_text_decodes_text_files():
    assert extractor.extract_text('rfp.txt', 'Café'.encode()) == 'Café'


def test_extract_questions_parses_fenced_json(bedrock):
    bedrock.reply('Here you go:\n```json\n["What is X?", " ", "How Y?"]\n```')
    questions = extractor.extract_questions(bedrock.client, 'RFP text')
    assert questions == ['What is X?', 'How Y?']
    assert 'RFP text' in bedrock.prompts[0]


def test_invoke_sends_configured_model_and_no_sampling_params(bedrock):
    seen = {}

    def capture(params, **kwargs):
        seen.update(params)

    bedrock.client.meta.events.register(
        'before-parameter-build.bedrock-runtime.InvokeModel', capture)
    bedrock.reply('["Q?"]')
    extractor.extract_questions(bedrock.client, 'text')
    body = json.loads(seen['body'])
    assert seen['modelId'] == MODEL_ID
    assert 'temperature' not in body
    assert body['anthropic_version'] == common.ANTHROPIC_VERSION


def test_extract_questions_rejects_non_list(bedrock):
    bedrock.reply('{"questions": "none"}')
    with pytest.raises(ValueError):
        extractor.extract_questions(bedrock.client, 'text')


def test_handler_writes_questions_and_status(aws, use_bedrock):
    key = 'uploaded_rfp_requests/rfp_20260101_120000.txt'
    aws['s3'].put_object(Bucket=BUCKET, Key=key, Body=b'Vendors must do X.')
    use_bedrock.reply('["How do you do X?"]')

    result = extractor.lambda_handler(s3_event(key), None)

    assert result['statusCode'] == 200
    obj = aws['s3'].get_object(
        Bucket=BUCKET, Key='formatted_questions/rfp_20260101_120000'
        '_questions.json')
    assert json.loads(obj['Body'].read()) == ['How do you do X?']
    assert obj['Metadata'][common.SOURCE_FILE_METADATA_KEY] == (
        'rfp_20260101_120000.txt')
    item = aws['table'].get_item(
        Key={'file_name': 'rfp_20260101_120000.txt'})['Item']
    stages = {stage['name']: stage['status'] for stage in item['stages']}
    assert stages == {'uploaded': 'completed',
                      'questions_extracted': 'completed'}


def test_handler_reports_error_when_no_questions(aws, use_bedrock):
    key = 'uploaded_rfp_requests/empty_20260101_120000.txt'
    aws['s3'].put_object(Bucket=BUCKET, Key=key, Body=b'Nothing here.')
    use_bedrock.reply('[]')

    result = extractor.lambda_handler(s3_event(key), None)

    assert result['statusCode'] == 500
    item = aws['table'].get_item(
        Key={'file_name': 'empty_20260101_120000.txt'})['Item']
    assert item['overall_status'] == 'error'


def test_retryable_errors_are_retried(bedrock):
    bedrock.fail('ThrottlingException', 429)
    bedrock.reply('["Q?"]')
    assert extractor.extract_questions(bedrock.client, 'text') == ['Q?']


def test_refusal_is_an_error(bedrock):
    bedrock.reply('', stop_reason='refusal')
    with pytest.raises(common.ModelResponseError):
        extractor.extract_questions(bedrock.client, 'text')
