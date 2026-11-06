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
from decimal import Decimal
from typing import Any, Callable, Dict, Iterable, List, Optional, TypeVar

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
    return boto3.client('bedrock-runtime', config=client_config(read_timeout))


def client_config(read_timeout: int = 300) -> Config:
    """Return the boto3 config for Bedrock clients.

    botocore's own retries are turned off: :func:`call_with_retry` retries
    throttling and transient errors with exponential backoff and logs each
    retry, so throttling shows up in the Lambda logs.
    """
    return Config(
        read_timeout=read_timeout,
        connect_timeout=60,
        retries={'total_max_attempts': 1, 'mode': 'standard'},
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
    item_attributes: Optional[Dict[str, Any]] = None,
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
        item_attributes: Optional top-level attributes to store on the job,
            such as ``original_filename``.
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
        if item_attributes:
            item.update(item_attributes)
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


# ---------------------------------------------------------------------------
# Helpers for the API Gateway Lambda handlers
# ---------------------------------------------------------------------------

# File names written by the upload API contain only these characters.
SAFE_FILE_NAME = re.compile(r'^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$')


def is_safe_file_name(name: Any) -> bool:
    """Return True if ``name`` is a plain file name the pipeline produces.

    Rejects path separators, ``..``, percent-encoding, control characters
    and anything else outside ``[A-Za-z0-9._-]``.
    """
    return (isinstance(name, str) and bool(SAFE_FILE_NAME.match(name))
            and '..' not in name)


def validate_download_key(path: Any) -> str:
    """Map a ``/download/{proxy+}`` path to an allowed S3 key.

    Accepted forms are ``<stage-prefix>/<file name>`` for one of the five
    pipeline prefixes, and a bare ``<file name>``, which refers to
    ``final_responses/``. Anything else, including ``..`` segments,
    absolute paths, backslashes and percent-encoded (or double-encoded)
    characters, is rejected.

    Args:
        path: The ``proxy`` path parameter from API Gateway.

    Returns:
        The S3 key to read.

    Raises:
        ValueError: If the path is not an allowed download.
    """
    if not isinstance(path, str) or not path:
        raise ValueError('A file path is required')
    # File names never need escaping, so any remaining '%' means the path
    # was encoded more than once to slip something past this check.
    if '%' in path or '\\' in path or any(ord(ch) < 32 for ch in path):
        raise ValueError('Invalid file path')

    parts = path.split('/')
    if len(parts) == 1:
        prefix, file_name = FINAL_PREFIX, parts[0]
    elif len(parts) == 2:
        prefix, file_name = parts[0] + '/', parts[1]
    else:
        raise ValueError('Invalid file path')

    if prefix not in PIPELINE_PREFIXES or not is_safe_file_name(file_name):
        raise ValueError('Invalid file path')
    return prefix + file_name


def get_bucket_name() -> str:
    """Return the pipeline bucket name from the ``BUCKET_NAME`` variable."""
    bucket = os.environ.get('BUCKET_NAME', '').strip()
    if not bucket:
        raise RuntimeError('BUCKET_NAME environment variable is not set')
    return bucket


def regional_s3_client() -> Any:
    """Create an S3 client for generating browser-facing presigned URLs.

    Uses the Regional virtual-hosted endpoint and SigV4 so that the URLs
    work from a browser in every Region without a redirect.
    """
    region = os.environ.get('AWS_REGION') or boto3.Session().region_name
    return boto3.client(
        's3',
        region_name=region,
        endpoint_url=f'https://s3.{region}.amazonaws.com',
        config=Config(signature_version='s3v4',
                      s3={'addressing_style': 'virtual'}),
    )


def cors_headers(methods: str = 'GET,OPTIONS') -> Dict[str, str]:
    """Return CORS headers that allow only the web app's origin.

    The origin comes from ``ALLOWED_ORIGIN`` (the CloudFront URL). If it is
    not set, no ``Access-Control-Allow-Origin`` header is sent and browsers
    block cross-origin reads.
    """
    headers = {
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': methods,
        'Vary': 'Origin',
    }
    origin = os.environ.get('ALLOWED_ORIGIN', '').strip()
    if origin:
        headers['Access-Control-Allow-Origin'] = origin
    return headers


def _json_default(value: Any) -> Any:
    """Serialise DynamoDB ``Decimal`` values."""
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(
            value)
    raise TypeError(f'{type(value).__name__} is not JSON serialisable')


def json_response(
    status_code: int, body: Any, methods: str = 'GET,OPTIONS'
) -> Dict[str, Any]:
    """Build an API Gateway proxy response with a JSON body."""
    return {
        'statusCode': status_code,
        'headers': {**cors_headers(methods),
                    'Content-Type': 'application/json'},
        'body': json.dumps(body, default=_json_default),
    }


# ---------------------------------------------------------------------------
# Compliance decisions
# ---------------------------------------------------------------------------

APPROVE = 'approve'
REDACT = 'redact'
REJECT = 'reject'
WITHHOLD = 'withhold'
WITHHELD_ANSWER = ('This response is being finalized and will be provided '
                   'separately after an internal compliance review.')


def normalize_recommendation(review: Any) -> str:
    """Reduce a compliance review to approve, redact, reject or withhold.

    Fails closed: anything that is not a clear decision (a missing or
    malformed review, an unknown or ambiguous recommendation) becomes
    ``withhold``, which keeps the answer out of the client document. An
    "approve" that also reports PII or privileged data becomes "redact".

    Args:
        review: The ``compliance_review`` object produced by the model.

    Returns:
        One of :data:`APPROVE`, :data:`REDACT`, :data:`REJECT` or
        :data:`WITHHOLD`.
    """
    if not isinstance(review, dict):
        return WITHHOLD
    text = str(review.get('recommendation', '')).lower()
    decisions = {APPROVE, REDACT, REJECT}

    def named(fragment: str) -> List[str]:
        return [w for w in re.findall(r'[a-z]+', fragment) if w in decisions]

    # The decision is normally the head of the value ("approve: because
    # ..."); the explanation after it may mention other decisions.
    found = named(re.split(r'[:\-\u2013\u2014.(]', text, maxsplit=1)[0])
    if not found:
        found = named(text)
    # "approve/redact/reject" (the prompt's template echoed back), "approve
    # or redact", or no decision at all is not a clear decision.
    if not found or len(set(found)) > 1:
        return WITHHOLD
    decision = found[0]
    flagged = any(
        str(review.get(field, '')).strip().lower() in ('yes', 'true')
        for field in ('has_pii', 'has_privileged_data')
    )
    if decision == APPROVE and flagged:
        return REDACT
    return decision


def item_recommendation(item: Dict[str, Any]) -> str:
    """Return the effective compliance decision for a reviewed answer."""
    if item.get('compliance_status') != 'reviewed':
        return WITHHOLD
    return normalize_recommendation(item.get('compliance_review'))


def withheld_details(withheld: List[Any]) -> Dict[str, Any]:
    """Build the status details that report withheld answers.

    Args:
        withheld: IDs of the questions whose answers were withheld.

    Returns:
        Stage attributes ``withheld_count``, ``withheld_questions`` and, if
        any answer was withheld, a human-readable ``warning``.
    """
    details: Dict[str, Any] = {
        'withheld_count': len(withheld),
        'withheld_questions': list(withheld),
    }
    if withheld:
        details['warning'] = (
            f'{len(withheld)} answer(s) could not be compliance reviewed '
            'and were withheld from the client document. Review them '
            'manually: ' + ', '.join(f'Q{qid}' for qid in withheld)
        )
    return details
