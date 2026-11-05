# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
"""Stage 3: review each answer for PII and privileged information.

Triggered by S3 ``ObjectCreated`` events under ``completed_responses/``.
Asks Claude on Amazon Bedrock to classify every answer and writes the
results to ``compliance_reviewed/<name>_compliance_reviewed.json``.
"""

import json
import logging
import time
from typing import Any, Dict, List
from urllib.parse import unquote_plus

import boto3

import common

logger = logging.getLogger()
logger.setLevel(logging.INFO)

STAGE = 'compliance_reviewed'
SUFFIX = '_responses.json'
MAX_OUTPUT_TOKENS = 4000
DELAY_BETWEEN_REVIEWS = 5

REVIEW_PROMPT = """Review the following text for PII (Personally \
Identifiable Information) and privileged/confidential data that should not be \
shared with third parties.

Text to review:
{answer}

Analyze for:
1. PII (names, addresses, phone numbers, email addresses, SSNs, etc.)
2. Privileged data (internal processes, confidential business information, \
proprietary details)
3. Financial data that should be restricted
4. Any other sensitive information

Return your analysis in JSON format:
{{
  "has_pii": "yes/no",
  "has_privileged_data": "yes/no",
  "issues_found": ["list of specific issues found"],
  "recommendation": "approve/redact/reject with explanation"
}}"""


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle an S3 event for a newly written responses file."""
    record = event['Records'][0]
    bucket = record['s3']['bucket']['name']
    key = unquote_plus(record['s3']['object']['key'])
    base_name = common.strip_suffix(key.split('/')[-1], SUFFIX)
    logger.info('Reviewing responses in s3://%s/%s', bucket, key)

    s3_client = boto3.client('s3')
    source_file = f'{base_name}.txt'
    try:
        obj = s3_client.get_object(Bucket=bucket, Key=key)
        source_file = common.resolve_source_file(
            s3_client, bucket, obj.get('Metadata'), base_name
        )
        common.update_processing_status(source_file, STAGE, 'processing')
        responses = json.loads(obj['Body'].read().decode('utf-8'))

        reviewed = review_responses(common.bedrock_runtime_client(), responses)

        output_key = (f'{common.COMPLIANCE_PREFIX}{base_name}'
                      '_compliance_reviewed.json')
        s3_client.put_object(
            Bucket=bucket,
            Key=output_key,
            Body=json.dumps(reviewed, indent=2),
            ContentType='application/json',
            Metadata={common.SOURCE_FILE_METADATA_KEY: source_file},
        )
        logger.info('Saved compliance review to %s', output_key)
        common.update_processing_status(source_file, STAGE, 'completed')
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Compliance reviewed {len(reviewed)} responses',
                'output_file': output_key,
            }),
        }
    except Exception as error:
        logger.exception('Compliance review failed for %s', key)
        common.update_processing_status(
            source_file, STAGE, 'error', str(error)
        )
        return {'statusCode': 500, 'body': json.dumps({'error': str(error)})}


def review_responses(
    bedrock_client: Any,
    responses: List[Dict[str, Any]],
    delay: float = DELAY_BETWEEN_REVIEWS,
) -> List[Dict[str, Any]]:
    """Attach a compliance review to every response item.

    Args:
        bedrock_client: A ``bedrock-runtime`` boto3 client.
        responses: Items produced by the question processor.
        delay: Seconds to wait between model calls.

    Returns:
        The response items with ``compliance_review`` and
        ``compliance_status`` fields added.
    """
    reviewed = []
    for index, item in enumerate(responses, 1):
        logger.info('Reviewing response %d/%d', index, len(responses))
        try:
            review = review_answer(bedrock_client, item['answer'])
            reviewed.append({
                **item,
                'compliance_review': review,
                'compliance_status': 'reviewed',
            })
        except Exception as error:
            logger.exception('Error reviewing response %d', index)
            reviewed.append({
                **item,
                'compliance_review': {
                    'has_pii': 'unknown',
                    'has_privileged_data': 'unknown',
                    'issues_found': [],
                    'recommendation': 'Manual review required due to error',
                },
                'compliance_status': 'error',
                'compliance_error': str(error),
            })
        if index < len(responses) and delay:
            time.sleep(delay)
    return reviewed


def review_answer(bedrock_client: Any, answer: str) -> Dict[str, Any]:
    """Ask Claude to classify one answer for PII and privileged data."""
    output = common.invoke_claude(
        bedrock_client,
        REVIEW_PROMPT.format(answer=answer),
        max_tokens=MAX_OUTPUT_TOKENS,
    )
    try:
        review = common.extract_json(output)
    except ValueError:
        logger.warning('Could not parse compliance review: %s', output[:200])
        return {
            'has_pii': 'unknown',
            'has_privileged_data': 'unknown',
            'issues_found': ['Unable to parse compliance review response'],
            'recommendation': 'manual review required - parsing error',
        }
    if not isinstance(review, dict):
        raise ValueError('Expected a JSON object from the compliance review')
    return review
