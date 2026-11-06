# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
"""Tests that the compliance and drafting stages fail closed."""

import json

import pytest

import common
import compliance_agent
import drafting_agent
from conftest import BUCKET, s3_event

APPROVED = json.dumps({'has_pii': 'no', 'has_privileged_data': 'no',
                       'issues_found': [], 'recommendation': 'approve'})


def _response(question_id, answer):
    return {'question_id': question_id, 'question': f'Q{question_id}?',
            'answer': answer, 'status': 'answered'}


@pytest.mark.parametrize('review,expected', [
    ({'recommendation': 'approve', 'has_pii': 'no'}, common.APPROVE),
    ({'recommendation': 'Approve - no issues'}, common.APPROVE),
    ({'recommendation': 'redact with explanation'}, common.REDACT),
    ({'recommendation': 'REJECT'}, common.REJECT),
    ({'recommendation': 'approve', 'has_pii': 'yes'}, common.REDACT),
    ({'recommendation': 'approve/redact/reject with explanation'},
     common.WITHHOLD),
    ({'recommendation': 'manual review required'}, common.WITHHOLD),
    # Seen in live testing: the explanation mentions another decision.
    ({'recommendation': 'approve: no PII and no financial data that should '
                        'be redacted'}, common.APPROVE),
    ({'recommendation': 'redact: includes internal pricing; do not approve '
                        'as is'}, common.REDACT),
    ({'recommendation': 'approve or redact'}, common.WITHHOLD),
    ({'recommendation': 'redact', 'explanation': 'internal pricing'},
     common.REDACT),
    ({}, common.WITHHOLD),
    (None, common.WITHHOLD),
    ('approve', common.WITHHOLD),
])
def test_normalize_recommendation(review, expected):
    assert common.normalize_recommendation(review) == expected


def test_bedrock_error_withholds_the_answer(bedrock):
    bedrock.fail('ValidationException')
    reviewed = compliance_agent.review_responses(
        bedrock.client, [_response(1, 'SSN 123-45-6789')], delay=0)
    assert reviewed[0]['compliance_status'] == 'withheld'
    assert reviewed[0]['compliance_decision'] == common.WITHHOLD
    assert 'compliance_error' in reviewed[0]


def test_unparseable_review_withholds_the_answer(bedrock):
    bedrock.reply('I cannot produce JSON for this.')
    reviewed = compliance_agent.review_responses(
        bedrock.client, [_response(1, 'answer')], delay=0)
    assert reviewed[0]['compliance_status'] == 'withheld'


def test_ambiguous_review_withholds_the_answer(bedrock):
    bedrock.reply(json.dumps({'recommendation': 'approve or redact'}))
    reviewed = compliance_agent.review_responses(
        bedrock.client, [_response(1, 'answer')], delay=0)
    assert reviewed[0]['compliance_status'] == 'withheld'


def test_clear_review_is_kept(bedrock):
    bedrock.reply(APPROVED)
    reviewed = compliance_agent.review_responses(
        bedrock.client, [_response(1, 'answer')], delay=0)
    assert reviewed[0]['compliance_status'] == 'reviewed'
    assert reviewed[0]['compliance_decision'] == common.APPROVE


def test_compliance_handler_reports_withheld_answers(aws, use_bedrock):
    key = 'completed_responses/rfp_20260101_120000_responses.json'
    aws['s3'].put_object(
        Bucket=BUCKET, Key=key,
        Body=json.dumps([_response(1, 'ok'), _response(2, 'secret')]),
        Metadata={common.SOURCE_FILE_METADATA_KEY:
                  'rfp_20260101_120000.txt'})
    use_bedrock.reply(APPROVED)
    use_bedrock.fail('ValidationException')

    assert compliance_agent.lambda_handler(s3_event(key), None)[
        'statusCode'] == 200

    item = aws['table'].get_item(
        Key={'file_name': 'rfp_20260101_120000.txt'})['Item']
    stage = item['stages'][-1]
    assert stage['name'] == 'compliance_reviewed'
    assert stage['withheld_count'] == 1
    assert stage['withheld_questions'] == [2]
    assert 'Q2' in stage['warning']


def _reviewed(question_id, answer, status, recommendation):
    return {**_response(question_id, answer),
            'compliance_status': status,
            'compliance_review': {'recommendation': recommendation,
                                  'has_pii': 'no', 'issues_found': []}}


def test_withheld_answers_never_reach_the_model_or_document(bedrock):
    items = [
        _reviewed(1, 'public answer', 'reviewed', 'approve'),
        _reviewed(2, 'TOP-SECRET-ANSWER', 'withheld', 'withhold'),
        # Written by an older version of the compliance agent.
        _reviewed(3, 'LEGACY-ERROR-ANSWER', 'error',
                  'Manual review required due to error'),
    ]
    bedrock.reply('Drafted 1')
    drafts = drafting_agent.draft_individual_responses(
        bedrock.client, items, delay=0)
    bedrock.reply('Document')
    drafting_agent.create_rfp_document(bedrock.client, items)

    assert drafts == {'1': 'Drafted 1', '2': common.WITHHELD_ANSWER,
                      '3': common.WITHHELD_ANSWER}
    assert len(bedrock.prompts) == 2
    for prompt in bedrock.prompts:
        assert 'TOP-SECRET-ANSWER' not in prompt
        assert 'LEGACY-ERROR-ANSWER' not in prompt
    assert common.WITHHELD_ANSWER in bedrock.prompts[1]


def test_drafting_failure_does_not_publish_unredacted_answer(bedrock):
    items = [
        _reviewed(1, 'approved answer', 'reviewed', 'approve'),
        _reviewed(2, 'CONTAINS-PII', 'reviewed', 'redact'),
        _reviewed(3, 'CONFIDENTIAL', 'reviewed', 'reject'),
    ]
    for _ in items:
        bedrock.fail('ValidationException')
    drafts = drafting_agent.draft_individual_responses(
        bedrock.client, items, delay=0)
    assert drafts == {'1': 'approved answer', '2': common.WITHHELD_ANSWER,
                      '3': common.WITHHELD_ANSWER}

    structured = drafting_agent.build_structured_output(
        'rfp', items, 'doc', {}, 'reasoning')
    analysis = {q['question_id']: q for q in structured['question_analysis']}
    assert analysis[2]['drafted_answer'] == common.WITHHELD_ANSWER
    assert analysis[3]['drafted_answer'] == common.WITHHELD_ANSWER
