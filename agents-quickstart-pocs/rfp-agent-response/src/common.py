# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
"""Shared helpers for the RFP response Lambda functions.

Every Lambda function in this sample is packaged from the same ``src/``
directory, so the processing stages and the web API handlers import their
common constants, Amazon Bedrock helpers, and DynamoDB status tracking from
this module instead of carrying private copies.
"""

import json
import logging
import os
import re
import time
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Iterable, Optional, TypeVar

import boto3
from botocore.config import Config
from botocore.exceptions import (
    ClientError,
    ConnectTimeoutError,
    EndpointConnectionError,
    ReadTimeoutError,
)

logger = logging.getLogger(__name__)

# S3 prefixes for each pipeline stage. Each stage is triggered by an S3
# event notification on the previous stage's prefix.
UPLOAD_PREFIX = 'uploaded_rfp_requests/'
QUESTIONS_PREFIX = 'formatted_questions/'
RESPONSES_PREFIX = 'completed_responses/'
COMPLIANCE_PREFIX = 'compliance_reviewed/'
FINAL_PREFIX = 'final_responses/'
PIPELINE_PREFIXES = (
    UPLOAD_PREFIX,
    QUESTIONS_PREFIX,
    RESPONSES_PREFIX,
    COMPLIANCE_PREFIX,
    FINAL_PREFIX,
)

# Processing stages, in pipeline order, as stored in the status table.
STAGES = (
    'uploaded',
    'questions_extracted',
    'questions_answered',
    'compliance_reviewed',
    'final_document',
)

# S3 user metadata key that carries the uploaded file name (for example
# ``rfp_20260101_120000.pdf``) from one stage's output to the next stage.
SOURCE_FILE_METADATA_KEY = 'source-file'

DEFAULT_TABLE_NAME = 'rfp-processing-status'
ANTHROPIC_VERSION = 'bedrock-2023-05-31'

RETRYABLE_ERROR_CODES = frozenset({
    'ThrottlingException',
    'TooManyRequestsException',
    'ServiceUnavailableException',
    'ModelNotReadyException',
    'InternalServerException',
})

T = TypeVar('T')


def utc_now_iso() -> str:
    """Return the current UTC time as an ISO 8601 string."""
    return datetime.now(timezone.utc).isoformat()


def get_model_id() -> str:
    """Return the Bedrock model or inference profile ID to invoke.

    The ID comes from the ``BEDROCK_MODEL_ID`` environment variable, which
    the CloudFormation template sets from its ``BedrockModelId`` parameter.
    """
    model_id = os.environ.get('BEDROCK_MODEL_ID', '').strip()
    if not model_id:
        raise RuntimeError('BEDROCK_MODEL_ID environment variable is not set')
    return model_id


def bedrock_runtime_client(read_timeout: int = 300) -> Any:
    """Create a Bedrock Runtime client with a timeout suited to long drafts.

    Args:
        read_timeout: Socket read timeout in seconds.

    Returns:
        A ``bedrock-runtime`` boto3 client.
    """
    return boto3.client(
        'bedrock-runtime',
        config=Config(
            read_timeout=read_timeout,
            connect_timeout=60,
            retries={'max_attempts': 3, 'mode': 'standard'},
        ),
    )


def is_retryable(error: BaseException) -> bool:
    """Return True if ``error`` is a transient Bedrock or network failure."""
    if isinstance(error, ClientError):
        code = error.response.get('Error', {}).get('Code', '')
        return code in RETRYABLE_ERROR_CODES
    return isinstance(
        error, (ReadTimeoutError, ConnectTimeoutError, EndpointConnectionError)
    )


def call_with_retry(
    func: Callable[[], T],
    max_attempts: int = 5,
    base_delay: float = 5.0,
    sleep: Callable[[float], None] = time.sleep,
) -> T:
    """Call ``func`` and retry transient failures with exponential backoff.

    Args:
        func: Zero-argument callable to invoke.
        max_attempts: Total number of attempts before giving up.
        base_delay: Delay in seconds before the first retry; doubles each
            time.
        sleep: Sleep function, injectable for tests.

    Returns:
        Whatever ``func`` returns.

    Raises:
        The last exception raised by ``func`` once retries are exhausted, or
        immediately for errors that are not retryable.
    """
    for attempt in range(max_attempts):
        try:
            return func()
        except Exception as error:
            if not is_retryable(error) or attempt == max_attempts - 1:
                raise
            delay = base_delay * (2 ** attempt)
            logger.warning(
                'Retryable error on attempt %d/%d (%s); retrying in %.0fs',
                attempt + 1, max_attempts, error, delay,
            )
            sleep(delay)
    raise RuntimeError('call_with_retry exhausted without a result')


class ModelResponseError(RuntimeError):
    """Raised when the model returns no usable text."""


def invoke_claude(
    client: Any,
    prompt: str,
    max_tokens: int,
    max_attempts: int = 5,
) -> str:
    """Send a single-turn prompt to Claude on Amazon Bedrock.

    The request deliberately sends no sampling parameters (``temperature``,
    ``top_p``, ``top_k``): current Claude models reject them.

    Args:
        client: A ``bedrock-runtime`` boto3 client.
        prompt: The user message.
        max_tokens: Output token limit, including any thinking tokens.
        max_attempts: Attempts for throttling and other transient errors.

    Returns:
        The concatenated text blocks of the response.

    Raises:
        ModelResponseError: If the model refuses or returns no text.
    """
    body = json.dumps({
        'anthropic_version': ANTHROPIC_VERSION,
        'max_tokens': max_tokens,
        'messages': [{'role': 'user', 'content': prompt}],
    })

    def _invoke() -> Dict[str, Any]:
        response = client.invoke_model(
            modelId=get_model_id(),
            body=body,
            contentType='application/json',
            accept='application/json',
        )
        return json.loads(response['body'].read())

    payload = call_with_retry(_invoke, max_attempts=max_attempts)
    stop_reason = payload.get('stop_reason')
    if stop_reason == 'refusal':
        raise ModelResponseError('The model declined to answer the request')
    if stop_reason == 'max_tokens':
        logger.warning('Model output was truncated at max_tokens=%d',
                       max_tokens)

    # Newer models can return thinking blocks before the answer, so keep
    # only the text blocks instead of assuming content[0] is text.
    text = ''.join(
        block.get('text', '')
        for block in payload.get('content', [])
        if block.get('type') == 'text'
    ).strip()
    if not text:
        raise ModelResponseError('The model returned an empty response')
    return text


def extract_json(text: str) -> Any:
    """Parse a JSON value from model output.

    Handles bare JSON, JSON in a fenced code block, and JSON surrounded by
    prose.

    Args:
        text: Raw model output.

    Returns:
        The parsed JSON value.

    Raises:
        ValueError: If no JSON value can be parsed.
    """
    candidate = text.strip()
    fenced = re.search(r'```(?:json)?\s*(.*?)```', candidate, re.DOTALL)
    if fenced:
        candidate = fenced.group(1).strip()
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        pass
    for opener, closer in (('[', ']'), ('{', '}')):
        start = candidate.find(opener)
        end = candidate.rfind(closer)
        if start != -1 and end > start:
            try:
                return json.loads(candidate[start:end + 1])
            except json.JSONDecodeError:
                continue
    raise ValueError('Model output did not contain valid JSON')


def strip_suffix(name: str, suffix: str) -> str:
    """Return ``name`` without ``suffix`` if it ends with it."""
    return name[:-len(suffix)] if suffix and name.endswith(suffix) else name


def object_exists(s3_client: Any, bucket: str, key: str) -> bool:
    """Return True if ``key`` exists in ``bucket``.

    A missing object returns False. Any other error, such as access denied,
    is raised so that misconfiguration is not mistaken for "not found".
    """
    try:
        s3_client.head_object(Bucket=bucket, Key=key)
        return True
    except ClientError as error:
        code = error.response.get('Error', {}).get('Code', '')
        if code in ('404', 'NoSuchKey', 'NotFound'):
            return False
        raise


def resolve_source_file(
    s3_client: Any,
    bucket: str,
    metadata: Optional[Dict[str, str]],
    base_name: str,
) -> str:
    """Work out the uploaded file name that a pipeline artifact came from.

    Each stage copies the original file name into its output's S3 metadata.
    For artifacts written without that metadata, fall back to probing the
    upload prefix for a ``.pdf`` and then a ``.txt`` file.

    Args:
        s3_client: An S3 boto3 client.
        bucket: Bucket that holds the pipeline artifacts.
        metadata: S3 user metadata of the triggering object.
        base_name: File name without stage suffix or extension.

    Returns:
        The uploaded file name, for example ``rfp_20260101_120000.pdf``.
    """
    source = (metadata or {}).get(SOURCE_FILE_METADATA_KEY)
    if source:
        return source
    for extension in ('pdf', 'txt'):
        candidate = f'{base_name}.{extension}'
        try:
            if object_exists(s3_client, bucket, UPLOAD_PREFIX + candidate):
                return candidate
        except ClientError:
            logger.warning('Could not check for %s', candidate)
    return f'{base_name}.txt'


def get_status_table() -> Any:
    """Return the DynamoDB table that tracks processing status."""
    table_name = os.environ.get('TABLE_NAME', DEFAULT_TABLE_NAME)
    return boto3.resource('dynamodb').Table(table_name)


def update_processing_status(
    file_name: str,
    stage_name: str,
    status: str = 'completed',
    error_message: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    table: Any = None,
) -> None:
    """Record the status of one pipeline stage for an uploaded file.

    Status tracking is best effort: failures are logged and never stop the
    pipeline.

    Args:
        file_name: Uploaded file name, the table's partition key.
        stage_name: One of :data:`STAGES`.
        status: ``processing``, ``completed`` or ``error``.
        error_message: Optional error text to store on the stage.
        details: Optional extra attributes to store on the stage.
        table: DynamoDB Table resource; defaults to :func:`get_status_table`.
    """
    try:
        table = table if table is not None else get_status_table()
        timestamp = utc_now_iso()
        item = table.get_item(Key={'file_name': file_name}).get('Item') or {
            'file_name': file_name,
            'stages': [],
            'created_at': timestamp,
        }

        stages = item.get('stages', [])
        stage = next((s for s in stages if s.get('name') == stage_name), None)
        if stage is None:
            stage = {'name': stage_name}
            stages.append(stage)
        stage['status'] = status
        stage['timestamp'] = timestamp
        if error_message:
            stage['error'] = error_message
        else:
            stage.pop('error', None)
        if details:
            stage.update(details)

        item['stages'] = stages
        item['current_stage'] = stage_name
        item['last_updated'] = timestamp
        if status == 'error':
            item['overall_status'] = 'error'
        elif stage_name == STAGES[-1] and status == 'completed':
            item['overall_status'] = 'completed'
        else:
            item['overall_status'] = 'processing'

        table.put_item(Item=item)
    except Exception:  # status tracking must never break work
        logger.exception('Error updating status for %s', file_name)


def iter_objects(s3_client: Any, bucket: str, prefix: str) -> Iterable[dict]:
    """Yield every object under ``prefix``, following pagination."""
    paginator = s3_client.get_paginator('list_objects_v2')
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        yield from page.get('Contents', [])
