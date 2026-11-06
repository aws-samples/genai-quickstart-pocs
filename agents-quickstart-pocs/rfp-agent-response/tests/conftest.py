# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
"""Shared fixtures for the Lambda unit tests.

Tests never call AWS: S3 and DynamoDB are mocked with moto, and Bedrock
calls go through ``botocore.stub.Stubber``.
"""

import io
import json
import sys
from pathlib import Path
from typing import Any, Dict, List

import boto3
import pytest
from botocore.config import Config
from botocore.response import StreamingBody
from botocore.stub import Stubber
from moto import mock_aws

SRC = Path(__file__).resolve().parent.parent / 'src'
sys.path.insert(0, str(SRC))

REGION = 'us-east-1'
BUCKET = 'terminal-upload-123456789012-us-east-1'
TABLE = 'rfp-processing-status'
MODEL_ID = 'us.anthropic.claude-haiku-5-5'


@pytest.fixture(autouse=True)
def aws_environment(monkeypatch):
    """Use fake credentials and the sample's environment variables."""
    for name, value in {
        'AWS_ACCESS_KEY_ID': 'testing',
        'AWS_SECRET_ACCESS_KEY': 'testing',
        'AWS_SESSION_TOKEN': 'testing',
        'AWS_DEFAULT_REGION': REGION,
        'AWS_REGION': REGION,
        'BUCKET_NAME': BUCKET,
        'TABLE_NAME': TABLE,
        'BEDROCK_MODEL_ID': MODEL_ID,
        'KNOWLEDGE_BASE_ID': 'ABC123DEF4',
        'BEDROCK_INFERENCE_PROFILE_ARN': (
            f'arn:aws:bedrock:{REGION}:123456789012:'
            f'inference-profile/{MODEL_ID}'),
        'ALLOWED_ORIGIN': 'https://d111111abcdef8.cloudfront.net',
    }.items():
        monkeypatch.setenv(name, value)
    monkeypatch.delenv('AWS_PROFILE', raising=False)


@pytest.fixture(autouse=True)
def no_sleep(monkeypatch):
    """Make retry back-off instant."""
    import common
    monkeypatch.setattr(common.time, 'sleep', lambda seconds: None)


@pytest.fixture
def aws():
    """Mock S3 and DynamoDB, with the pipeline bucket and status table."""
    with mock_aws():
        s3 = boto3.client('s3', region_name=REGION)
        s3.create_bucket(Bucket=BUCKET)
        dynamodb = boto3.resource('dynamodb', region_name=REGION)
        dynamodb.create_table(
            TableName=TABLE,
            KeySchema=[{'AttributeName': 'file_name', 'KeyType': 'HASH'}],
            AttributeDefinitions=[
                {'AttributeName': 'file_name', 'AttributeType': 'S'}],
            BillingMode='PAY_PER_REQUEST',
        )
        yield {'s3': s3, 'table': dynamodb.Table(TABLE)}


class StubbedBedrock:
    """A ``bedrock-runtime`` client whose responses are queued in advance."""

    def __init__(self) -> None:
        """Create the client and activate the stubber."""
        self.client = boto3.client(
            'bedrock-runtime', region_name=REGION,
            config=Config(retries={'total_max_attempts': 1}),
        )
        self.stubber = Stubber(self.client)
        self.stubber.activate()
        self.prompts: List[str] = []
        self.client.meta.events.register(
            'before-parameter-build.bedrock-runtime.InvokeModel', self._record)

    def _record(self, params: Dict[str, Any], **kwargs: Any) -> None:
        """Remember the prompt of every InvokeModel call."""
        body = json.loads(params['body'])
        self.prompts.append(body['messages'][0]['content'])

    def reply(self, text: str, stop_reason: str = 'end_turn',
              thinking: bool = True) -> None:
        """Queue a successful response, optionally with a thinking block."""
        content = []
        if thinking:
            content.append({'type': 'thinking', 'thinking': ''})
        content.append({'type': 'text', 'text': text})
        payload = json.dumps({
            'content': content, 'stop_reason': stop_reason,
        }).encode('utf-8')
        self.stubber.add_response('invoke_model', {
            'body': StreamingBody(io.BytesIO(payload), len(payload)),
            'contentType': 'application/json',
        })

    def fail(self, code: str = 'ValidationException',
             status: int = 400) -> None:
        """Queue an error response."""
        self.stubber.add_client_error('invoke_model', service_error_code=code,
                                      http_status_code=status)


@pytest.fixture
def bedrock():
    """A stubbed Bedrock Runtime client."""
    stub = StubbedBedrock()
    yield stub
    stub.stubber.deactivate()


@pytest.fixture
def use_bedrock(monkeypatch, bedrock):
    """Make the Lambda code use the stubbed Bedrock client."""
    import common
    monkeypatch.setattr(common, 'bedrock_runtime_client',
                        lambda read_timeout=300: bedrock.client)
    return bedrock


def s3_event(key: str, bucket: str = BUCKET) -> Dict[str, Any]:
    """Build a minimal S3 ObjectCreated event."""
    return {'Records': [{'s3': {'bucket': {'name': bucket},
                                'object': {'key': key}}}]}


def make_pdf(text: str) -> bytes:
    """Build a one-page PDF that contains ``text``."""
    stream = f'BT /F1 12 Tf 72 720 Td ({text}) Tj ET'.encode('latin-1')
    objects = [
        b'<< /Type /Catalog /Pages 2 0 R >>',
        b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        (b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] '
         b'/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>'),
        (b'<< /Length ' + str(len(stream)).encode() + b' >>\nstream\n'
         + stream + b'\nendstream'),
        b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ]
    output = io.BytesIO()
    output.write(b'%PDF-1.4\n')
    offsets = []
    for number, body in enumerate(objects, 1):
        offsets.append(output.tell())
        output.write(f'{number} 0 obj\n'.encode() + body + b'\nendobj\n')
    xref = output.tell()
    output.write(f'xref\n0 {len(objects) + 1}\n'.encode())
    output.write(b'0000000000 65535 f \n')
    for offset in offsets:
        output.write(f'{offset:010d} 00000 n \n'.encode())
    output.write(
        f'trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n'
        f'startxref\n{xref}\n%%EOF\n'.encode())
    return output.getvalue()
