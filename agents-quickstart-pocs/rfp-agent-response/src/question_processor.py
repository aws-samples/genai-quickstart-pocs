# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
"""Stage 2: answer each extracted question from the Bedrock knowledge base.

Triggered by S3 ``ObjectCreated`` events under ``formatted_questions/``.
Calls ``RetrieveAndGenerate`` once per question and writes the answers to
``completed_responses/<name>_responses.json``.
"""

import json
import logging
import os
import time
from typing import Any, Dict, List
from urllib.parse import unquote_plus

import boto3

import common

logger = logging.getLogger()
logger.setLevel(logging.INFO)

STAGE = 'questions_answered'
SUFFIX = '_questions.json'
# Pause between knowledge base calls to stay under default request quotas.
DELAY_BETWEEN_QUESTIONS = 5


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle an S3 event for a newly written questions file."""
    record = event['Records'][0]
    bucket = record['s3']['bucket']['name']
    key = unquote_plus(record['s3']['object']['key'])
    base_name = common.strip_suffix(key.split('/')[-1], SUFFIX)
    logger.info('Answering questions in s3://%s/%s', bucket, key)

    s3_client = boto3.client('s3')
    source_file = f'{base_name}.txt'
    try:
        obj = s3_client.get_object(Bucket=bucket, Key=key)
        source_file = common.resolve_source_file(
            s3_client, bucket, obj.get('Metadata'), base_name
        )
        common.update_processing_status(source_file, STAGE, 'processing')
        questions = json.loads(obj['Body'].read().decode('utf-8'))

        responses = answer_questions(
            boto3.client('bedrock-agent-runtime'),
            questions,
            knowledge_base_id=_required_env('KNOWLEDGE_BASE_ID'),
            model_arn=_required_env('BEDROCK_INFERENCE_PROFILE_ARN'),
        )

        output_key = f'{common.RESPONSES_PREFIX}{base_name}_responses.json'
        s3_client.put_object(
            Bucket=bucket,
            Key=output_key,
            Body=json.dumps(responses, indent=2),
            ContentType='application/json',
            Metadata={common.SOURCE_FILE_METADATA_KEY: source_file},
        )
        logger.info('Saved %d responses to %s', len(responses), output_key)
        common.update_processing_status(source_file, STAGE, 'completed')
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Answered {len(questions)} questions',
                'output_file': output_key,
            }),
        }
    except Exception as error:
        logger.exception('Answering questions failed for %s', key)
        common.update_processing_status(
            source_file, STAGE, 'error', str(error)
        )
        return {'statusCode': 500, 'body': json.dumps({'error': str(error)})}


def _required_env(name: str) -> str:
    """Return environment variable ``name`` or raise a clear error."""
    value = os.environ.get(name, '').strip()
    if not value:
        raise RuntimeError(f'{name} environment variable is not set')
    return value


def answer_questions(
    kb_client: Any,
    questions: List[str],
    knowledge_base_id: str,
    model_arn: str,
    delay: float = DELAY_BETWEEN_QUESTIONS,
) -> List[Dict[str, Any]]:
    """Answer each question, recording per-question failures.

    Args:
        kb_client: A ``bedrock-agent-runtime`` boto3 client.
        questions: Questions to answer.
        knowledge_base_id: Bedrock knowledge base ID.
        model_arn: Inference profile ARN used to generate answers.
        delay: Seconds to wait between questions.

    Returns:
        One response item per question.
    """
    responses = []
    for index, question in enumerate(questions, 1):
        logger.info('Answering question %d/%d', index, len(questions))
        try:
            answer = query_knowledge_base(
                kb_client, question, knowledge_base_id, model_arn
            )
            item = {
                'question_id': index,
                'question': question,
                'answer': answer,
                'status': 'answered',
            }
        except Exception as error:
            logger.exception('Error answering question %d', index)
            item = {
                'question_id': index,
                'question': question,
                'answer': ('Unable to retrieve answer from knowledge base '
                           'after retries'),
                'status': 'error',
                'error': str(error),
            }
        responses.append(item)
        if index < len(questions) and delay:
            time.sleep(delay)
    return responses


def query_knowledge_base(
    kb_client: Any,
    question: str,
    knowledge_base_id: str,
    model_arn: str,
) -> str:
    """Retrieve context for ``question`` and generate an answer.

    ``RetrieveAndGenerate`` needs the full ARN of the inference profile,
    not just its ID.
    """
    response = common.call_with_retry(
        lambda: kb_client.retrieve_and_generate(
            input={'text': question},
            retrieveAndGenerateConfiguration={
                'type': 'KNOWLEDGE_BASE',
                'knowledgeBaseConfiguration': {
                    'knowledgeBaseId': knowledge_base_id,
                    'modelArn': model_arn,
                },
            },
        )
    )
    return response['output']['text']
