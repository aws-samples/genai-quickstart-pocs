# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
"""Tests for stage 2, the knowledge base question processor."""

import json

import boto3
import pytest
from botocore.config import Config
from botocore.stub import Stubber

import common
import question_processor
from conftest import BUCKET, REGION, s3_event

KEY = 'formatted_questions/rfp_20260101_120000_questions.json'
SOURCE = 'rfp_20260101_120000.txt'
PROFILE_ARN = ('arn:aws:bedrock:us-east-1:123456789012:'
               'inference-profile/us.anthropic.claude-haiku-5-5')


@pytest.fixture
def kb(monkeypatch):
    """A stubbed bedrock-agent-runtime client used by the handler."""
    client = boto3.client('bedrock-agent-runtime', region_name=REGION,
                          config=Config(retries={'total_max_attempts': 1}))
    stubber = Stubber(client)
    stubber.activate()
    real_client = boto3.client
    monkeypatch.setattr(
        question_processor.boto3, 'client',
        lambda name, *a, **k: client if name == 'bedrock-agent-runtime'
        else real_client(name, *a, **k))
    yield stubber
    stubber.deactivate()


def _answer(text):
    return {'output': {'text': text}, 'sessionId': 'session'}


def _put_questions(aws, questions):
    aws['s3'].put_object(Bucket=BUCKET, Key=KEY, Body=json.dumps(questions),
                         Metadata={common.SOURCE_FILE_METADATA_KEY: SOURCE})


def _stage(aws):
    item = aws['table'].get_item(Key={'file_name': SOURCE})['Item']
    return next(s for s in item['stages'] if s['name'] == 'questions_answered')


def test_answers_use_the_inference_profile_arn(aws, kb):
    _put_questions(aws, ['What is X?'])
    kb.add_response('retrieve_and_generate', _answer('X is great.'), {
        'input': {'text': 'What is X?'},
        'retrieveAndGenerateConfiguration': {
            'type': 'KNOWLEDGE_BASE',
            'knowledgeBaseConfiguration': {
                'knowledgeBaseId': 'ABC123DEF4',
                'modelArn': PROFILE_ARN,
                'orchestrationConfiguration': {'promptTemplate': {
                    'textPromptTemplate':
                        question_processor.ORCHESTRATION_PROMPT}},
                'generationConfiguration': {'promptTemplate': {
                    'textPromptTemplate':
                        question_processor.GENERATION_PROMPT}},
            },
        },
    })
    assert question_processor.lambda_handler(s3_event(KEY), None)[
        'statusCode'] == 200
    assert _stage(aws)['status'] == 'completed'


def test_partial_failures_are_reported(aws, kb):
    _put_questions(aws, ['Q1?', 'Q2?'])
    kb.add_response('retrieve_and_generate', _answer('A1'))
    kb.add_client_error('retrieve_and_generate', 'AccessDeniedException')
    assert question_processor.lambda_handler(s3_event(KEY), None)[
        'statusCode'] == 200
    stage = _stage(aws)
    assert stage['failed_questions'] == [2]
    assert 'Q2' in stage['warning']


def test_stage_fails_when_no_question_can_be_answered(aws, kb):
    _put_questions(aws, ['Q1?', 'Q2?'])
    kb.add_client_error('retrieve_and_generate', 'AccessDeniedException')
    kb.add_client_error('retrieve_and_generate', 'AccessDeniedException')

    result = question_processor.lambda_handler(s3_event(KEY), None)

    assert result['statusCode'] == 500
    assert _stage(aws)['status'] == 'error'
    # Nothing is written, so the compliance stage is never triggered.
    listed = aws['s3'].list_objects_v2(Bucket=BUCKET,
                                       Prefix=common.RESPONSES_PREFIX)
    assert listed.get('KeyCount', 0) == 0


def test_prompt_templates_have_required_placeholders():
    for placeholder in ('$conversation_history$',
                        '$output_format_instructions$'):
        assert placeholder in question_processor.ORCHESTRATION_PROMPT
    assert '$search_results$' in question_processor.GENERATION_PROMPT
