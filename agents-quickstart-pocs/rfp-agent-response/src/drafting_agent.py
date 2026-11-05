# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
"""Stage 4: draft the client-ready RFP response.

Triggered by S3 ``ObjectCreated`` events under ``compliance_reviewed/``.
Writes two files to ``final_responses/``:

* ``<name>_RFP_Response.txt`` - the response document for the client.
* ``<name>_final.json`` - per-question drafts and compliance reasoning.
"""

import json
import logging
import time
from typing import Any, Dict, List, Optional
from urllib.parse import unquote_plus

import boto3

import common

logger = logging.getLogger()
logger.setLevel(logging.INFO)

STAGE = 'final_document'
SUFFIX = '_compliance_reviewed.json'
# RFPs with more questions than this are drafted in chunks and combined.
CHUNK_THRESHOLD = 50
CHUNK_SIZE = 25
DELAY_BETWEEN_DRAFTS = 2
DOCUMENT_MAX_TOKENS = 16000
ANSWER_MAX_TOKENS = 4000
REASONING_MAX_TOKENS = 6000

ACTION_DESCRIPTIONS = {
    'approve': 'Response approved and enhanced professionally',
    'redact': 'Sensitive information removed or generalized',
    'reject': 'Information withheld due to confidentiality requirements',
}

APPROVE_PROMPT = """Enhance this RFP response to be more professional and \
client-ready while keeping all the original information:

QUESTION: {question}
ORIGINAL ANSWER: {answer}

Make it more polished, professional, and suitable for a client-facing RFP \
response. Maintain all factual content but improve the language, structure, \
and presentation."""

REDACT_PROMPT = """Revise this RFP response by removing or generalizing \
sensitive information while maintaining a professional, helpful response:

QUESTION: {question}
ORIGINAL ANSWER: {answer}
ISSUES TO ADDRESS: {issues}

Create a professional response that addresses the question without including \
sensitive details. Generalize specific information where needed and maintain \
a helpful tone."""

REJECT_PROMPT = """Create a polite, professional response explaining that \
this information cannot be shared due to confidentiality requirements:

QUESTION: {question}
ORIGINAL ANSWER: {answer}
ISSUES: {issues}

Provide a courteous explanation of why this information cannot be disclosed \
while maintaining professionalism."""

DEFAULT_PROMPT = """Create a professional RFP response for this question:

QUESTION: {question}
ORIGINAL ANSWER: {answer}

Make it professional and client-ready."""

DOCUMENT_PROMPT = """Create a comprehensive, professional RFP response \
document that is ready to send to a prospective client. This should be a \
complete, well-formatted document that addresses all questions \
professionally.

RFP QUESTIONS AND ANSWERS:
{qa_content}

INSTRUCTIONS:
1. Create a complete RFP response document with proper business formatting
2. Include a professional header and introduction
3. For each question, provide a polished, client-ready response
4. Follow compliance recommendations:
   - "approve": Enhance the response professionally
   - "redact": Remove or generalize sensitive information
   - "reject": Provide polite explanation that information cannot be shared
5. Use formal business language throughout
6. Structure with clear sections and numbering
7. Include a professional closing
8. Remove any internal references or confidential details
9. Make it ready for direct client delivery

Create a complete RFP response document:"""

COMBINE_PROMPT = """Combine these RFP response sections into a single, \
cohesive professional document. Remove any duplicate headers or \
introductions, ensure consistent formatting, and create smooth transitions \
between sections.

SECTIONS TO COMBINE:
{sections}

Create a single, well-formatted RFP response document with:
1. One professional header and introduction
2. All {total} questions and responses in logical order
3. Consistent formatting throughout
4. One professional closing
5. Remove any section breaks or chunk indicators

Final combined RFP response document:"""

REASONING_PROMPT = """Analyze the compliance decisions made for this RFP \
response and provide detailed reasoning about what was included, excluded, \
or modified.

COMPLIANCE REVIEW SUMMARY:
{summary}

Provide a comprehensive analysis explaining:
1. Overall compliance approach taken
2. What information was approved for inclusion and why
3. What information was redacted or generalized and the reasoning
4. What information was completely excluded and why
5. Risk mitigation strategies applied
6. Summary of how the final document balances transparency with data \
protection

Create a detailed compliance reasoning report:"""


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle an S3 event for a newly written compliance review file."""
    record = event['Records'][0]
    bucket = record['s3']['bucket']['name']
    key = unquote_plus(record['s3']['object']['key'])
    base_name = common.strip_suffix(key.split('/')[-1], SUFFIX)
    logger.info('Drafting final response for s3://%s/%s', bucket, key)

    s3_client = boto3.client('s3')
    source_file = f'{base_name}.txt'
    try:
        obj = s3_client.get_object(Bucket=bucket, Key=key)
        source_file = common.resolve_source_file(
            s3_client, bucket, obj.get('Metadata'), base_name
        )
        common.update_processing_status(source_file, STAGE, 'processing')
        items = json.loads(obj['Body'].read().decode('utf-8'))
    except Exception as error:
        logger.exception('Could not load %s', key)
        common.update_processing_status(
            source_file, STAGE, 'error', str(error)
        )
        return {'statusCode': 500, 'body': json.dumps({'error': str(error)})}

    metadata = {common.SOURCE_FILE_METADATA_KEY: source_file}
    bedrock_client = common.bedrock_runtime_client()
    try:
        document = create_rfp_document(bedrock_client, items)
        drafts = draft_individual_responses(bedrock_client, items)
        reasoning = generate_compliance_reasoning(bedrock_client, items)

        text_key = f'{common.FINAL_PREFIX}{base_name}_RFP_Response.txt'
        s3_client.put_object(
            Bucket=bucket, Key=text_key, Body=document,
            ContentType='text/plain; charset=utf-8', Metadata=metadata,
        )
        json_key = f'{common.FINAL_PREFIX}{base_name}_final.json'
        structured = build_structured_output(
            base_name, items, document, drafts, reasoning,
            request_id=getattr(context, 'aws_request_id', None),
        )
        s3_client.put_object(
            Bucket=bucket, Key=json_key,
            Body=json.dumps(structured, indent=2),
            ContentType='application/json', Metadata=metadata,
        )
        logger.info('Saved %s and %s', text_key, json_key)
        common.update_processing_status(source_file, STAGE, 'completed')
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': (f'Created RFP response with {len(items)} '
                            'questions'),
                'client_document': text_key,
                'structured_data': json_key,
            }),
        }
    except Exception as error:
        logger.exception('Drafting failed for %s', key)
        error_key = f'{common.FINAL_PREFIX}{base_name}_ERROR.txt'
        s3_client.put_object(
            Bucket=bucket, Key=error_key,
            Body=('RFP RESPONSE DOCUMENT - ERROR\n\n'
                  'There was an error generating the RFP response.\n'
                  f'Error: {error}\n'),
            ContentType='text/plain; charset=utf-8', Metadata=metadata,
        )
        common.update_processing_status(
            source_file, STAGE, 'error', str(error)
        )
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(error),
                                'error_document': error_key}),
        }


def get_recommendation(item: Dict[str, Any]) -> str:
    """Return the compliance recommendation recorded for an item."""
    return item.get('compliance_review', {}).get('recommendation', 'approve')


def get_action_description(recommendation: str) -> str:
    """Return a human-readable description of the compliance action."""
    return ACTION_DESCRIPTIONS.get(recommendation,
                                   'Standard processing applied')


def build_structured_output(
    base_name: str,
    items: List[Dict[str, Any]],
    document: str,
    drafts: Dict[str, str],
    reasoning: str,
    request_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Assemble the ``_final.json`` document."""
    analysis = []
    for item in items:
        review = item.get('compliance_review', {})
        recommendation = get_recommendation(item)
        analysis.append({
            'question_id': item['question_id'],
            'question': item['question'],
            'original_answer': item['answer'],
            'drafted_answer': drafts.get(str(item['question_id']),
                                         item['answer']),
            'compliance_status': recommendation,
            'has_pii': review.get('has_pii', 'no'),
            'has_privileged_data': review.get('has_privileged_data', 'no'),
            'issues_found': review.get('issues_found', []),
            'action_taken': get_action_description(recommendation),
        })
    return {
        'rfp_name': base_name,
        'total_questions': len(items),
        'document_content': document,
        'compliance_reasoning': reasoning,
        'question_analysis': analysis,
        'processing_timestamp': common.utc_now_iso(),
        'request_id': request_id,
        'status': 'complete',
    }


def _issues_text(item: Dict[str, Any], default: str) -> str:
    """Return the compliance issues for an item as a comma-separated list."""
    issues = item.get('compliance_review', {}).get('issues_found', [])
    return ', '.join(str(issue) for issue in issues) if issues else default


def build_answer_prompt(item: Dict[str, Any]) -> str:
    """Build the per-question drafting prompt for an item's recommendation."""
    recommendation = get_recommendation(item)
    fields = {'question': item['question'], 'answer': item['answer']}
    if recommendation == 'approve':
        return APPROVE_PROMPT.format(**fields)
    if recommendation == 'redact':
        return REDACT_PROMPT.format(
            issues=_issues_text(item, 'sensitive information'), **fields
        )
    if recommendation == 'reject':
        return REJECT_PROMPT.format(
            issues=_issues_text(item, 'confidential information'), **fields
        )
    return DEFAULT_PROMPT.format(**fields)


def draft_individual_responses(
    bedrock_client: Any,
    items: List[Dict[str, Any]],
    delay: float = DELAY_BETWEEN_DRAFTS,
) -> Dict[str, str]:
    """Draft a client-ready answer for every question.

    Returns:
        Drafted answers keyed by question ID (as a string).
    """
    drafts = {}
    for item in items:
        question_id = str(item['question_id'])
        logger.info('Drafting question %s (%s)', question_id,
                    get_recommendation(item))
        try:
            drafts[question_id] = common.invoke_claude(
                bedrock_client, build_answer_prompt(item),
                max_tokens=ANSWER_MAX_TOKENS,
            )
        except Exception:
            logger.exception('Error drafting question %s', question_id)
            drafts[question_id] = item['answer']
        if delay:
            time.sleep(delay)
    return drafts


def generate_compliance_reasoning(
    bedrock_client: Any, items: List[Dict[str, Any]]
) -> str:
    """Summarise the compliance decisions made across all answers."""
    summary = ''
    for item in items:
        review = item.get('compliance_review', {})
        summary += (
            f"\nQuestion {item['question_id']}: {item['question'][:100]}...\n"
            f"Recommendation: {get_recommendation(item)}\n"
            f"PII Found: {review.get('has_pii', 'no')}\n"
            f"Privileged Data: {review.get('has_privileged_data', 'no')}\n"
            f"Issues: {_issues_text(item, '')}\n---"
        )
    try:
        return common.invoke_claude(
            bedrock_client, REASONING_PROMPT.format(summary=summary),
            max_tokens=REASONING_MAX_TOKENS,
        )
    except Exception as error:
        logger.exception('Error generating compliance reasoning')
        return f'Unable to generate compliance reasoning due to error: {error}'


def create_rfp_document(
    bedrock_client: Any, items: List[Dict[str, Any]]
) -> str:
    """Create the full response document, chunking large RFPs."""
    if len(items) <= CHUNK_THRESHOLD:
        return create_document_section(bedrock_client, items)

    chunks = [items[i:i + CHUNK_SIZE]
              for i in range(0, len(items), CHUNK_SIZE)]
    logger.info('Drafting %d questions in %d chunks', len(items), len(chunks))
    sections = [create_document_section(bedrock_client, chunk)
                for chunk in chunks]
    return combine_sections(bedrock_client, sections, len(items))


def create_document_section(
    bedrock_client: Any, items: List[Dict[str, Any]]
) -> str:
    """Draft the response document for a set of questions."""
    qa_content = ''
    for item in items:
        qa_content += (
            f"\n\nQUESTION {item['question_id']}: {item['question']}\n"
            f"ORIGINAL ANSWER: {item['answer']}\n"
            f"COMPLIANCE STATUS: {get_recommendation(item)}\n"
            f"ISSUES: {_issues_text(item, 'None')}\n---"
        )
    return common.invoke_claude(
        bedrock_client, DOCUMENT_PROMPT.format(qa_content=qa_content),
        max_tokens=DOCUMENT_MAX_TOKENS,
    )


def combine_sections(
    bedrock_client: Any, sections: List[str], total: int
) -> str:
    """Merge chunked document sections into one document."""
    try:
        return common.invoke_claude(
            bedrock_client,
            COMBINE_PROMPT.format(sections='\n\n'.join(sections),
                                  total=total),
            max_tokens=DOCUMENT_MAX_TOKENS,
        )
    except Exception:
        logger.exception('Error combining document sections')
        return ('RFP RESPONSE DOCUMENT\n\n'
                f'This document contains responses to {total} questions.\n\n'
                + '\n\n'.join(sections)
                + '\n\nThank you for your consideration.')
