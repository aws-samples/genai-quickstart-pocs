# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
"""API: list final responses and download pipeline files.

Routes:

* ``GET /downloads`` - list the files under ``final_responses/``.
* ``GET /download/{proxy+}`` - return one file from a pipeline prefix.
"""

import json
import logging
from typing import Any, Dict, Optional

import boto3
from botocore.exceptions import ClientError

import common

logger = logging.getLogger()
logger.setLevel(logging.INFO)

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}


def _response(status: int, body: Any,
              headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """Build an API Gateway proxy response."""
    return {
        'statusCode': status,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json',
                    **(headers or {})},
        'body': body if isinstance(body, str) else json.dumps(body),
    }


def _bucket_name(context: Any) -> str:
    """Return the upload bucket name for this account and Region."""
    account = context.invoked_function_arn.split(':')[4]
    return f'terminal-upload-{account}-{boto3.Session().region_name}'


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Route ``/downloads`` and ``/download/{proxy+}`` requests."""
    try:
        method = event.get('httpMethod')
        path = event.get('path', '')
        if method == 'OPTIONS':
            return _response(200, '')
        if method != 'GET':
            return _response(405, {'error': 'Method not allowed'})

        s3_client = boto3.client('s3')
        bucket = _bucket_name(context)
        if path == '/downloads':
            return _response(200, list_final_responses(s3_client, bucket))
        if path.startswith('/download/'):
            proxy = (event.get('pathParameters') or {}).get('proxy')
            if proxy is None:
                proxy = path[len('/download/'):]
            return download_file(s3_client, bucket, proxy)
        return _response(404, {'error': 'Not found'})
    except Exception:
        logger.exception('Download API error')
        return _response(500, {'error': 'Internal server error'})


def list_final_responses(s3_client: Any, bucket: str) -> list:
    """List final response files, most recent first."""
    files = [
        {
            'name': obj['Key'][len(common.FINAL_PREFIX):],
            'lastModified': obj['LastModified'].isoformat(),
            'size': obj['Size'],
        }
        for obj in common.iter_objects(s3_client, bucket, common.FINAL_PREFIX)
        if not obj['Key'].endswith('/')
    ]
    files.sort(key=lambda item: item['lastModified'], reverse=True)
    return files


def download_file(s3_client: Any, bucket: str, proxy: str) -> Dict[str, Any]:
    """Return a file from one of the pipeline prefixes."""
    try:
        key = common.validate_download_key(proxy)
    except ValueError as error:
        return _response(400, {'error': str(error)})

    file_name = key.split('/')[-1]
    try:
        content = s3_client.get_object(Bucket=bucket, Key=key)['Body'].read()
    except ClientError as error:
        if error.response.get('Error', {}).get('Code') in ('NoSuchKey',
                                                           '404'):
            return _response(404, {'error': 'File not found'})
        raise

    content_type = 'application/octet-stream'
    if file_name.endswith('.json'):
        content_type = 'application/json'
    elif file_name.endswith('.txt'):
        content_type = 'text/plain'
    return _response(
        200,
        content.decode('utf-8'),
        {
            'Content-Type': content_type,
            'Content-Disposition': f'attachment; filename="{file_name}"',
        },
    )
