# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
"""API: list final responses and download pipeline files.

Routes (both require a Cognito ID token, checked by API Gateway):

* ``GET /downloads`` - list the files under ``final_responses/``.
* ``GET /download/{proxy+}`` - return a short-lived presigned S3 URL for one
  file under one of the five pipeline prefixes.

Returning a presigned URL instead of the file body lets the browser fetch
files of any size or type (including the original PDF), without exceeding
the Lambda response size limit.
"""

import logging
import os
from typing import Any, Dict, List

from botocore.exceptions import ClientError

import common

logger = logging.getLogger()
logger.setLevel(logging.INFO)

DEFAULT_URL_TTL_SECONDS = 300


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Route ``/downloads`` and ``/download/{proxy+}`` requests."""
    method = event.get('httpMethod')
    if method == 'OPTIONS':
        return common.json_response(200, {})
    if method != 'GET':
        return common.json_response(405, {'error': 'Method not allowed'})

    try:
        s3_client = common.regional_s3_client()
        bucket = common.get_bucket_name()
        resource = event.get('resource') or event.get('path', '')
        if resource == '/downloads':
            return common.json_response(
                200, list_final_responses(s3_client, bucket)
            )
        if resource.startswith('/download/'):
            proxy = (event.get('pathParameters') or {}).get('proxy')
            return download_url(s3_client, bucket, proxy)
        return common.json_response(404, {'error': 'Not found'})
    except Exception:
        logger.exception('Download API error')
        return common.json_response(500, {'error': 'Internal server error'})


def list_final_responses(s3_client: Any, bucket: str) -> List[Dict[str, Any]]:
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


def download_url(s3_client: Any, bucket: str, proxy: Any) -> Dict[str, Any]:
    """Return a presigned GET URL for an allowed pipeline file.

    Args:
        s3_client: S3 client used to check the object and sign the URL.
        bucket: Pipeline bucket name.
        proxy: The ``{proxy+}`` path parameter.

    Returns:
        400 for a disallowed path, 404 if the file does not exist, otherwise
        200 with ``url``, ``fileName`` and ``expiresIn``.
    """
    try:
        key = common.validate_download_key(proxy)
    except ValueError as error:
        return common.json_response(400, {'error': str(error)})

    file_name = key.split('/')[-1]
    try:
        s3_client.head_object(Bucket=bucket, Key=key)
    except ClientError as error:
        code = error.response.get('Error', {}).get('Code', '')
        # Without s3:ListBucket on the prefix, S3 reports a missing object
        # as 403 rather than 404.
        if code in ('404', 'NoSuchKey', 'NotFound', '403', 'AccessDenied'):
            return common.json_response(404, {'error': 'File not found'})
        raise

    expires_in = int(os.environ.get('DOWNLOAD_URL_TTL_SECONDS',
                                    DEFAULT_URL_TTL_SECONDS))
    url = s3_client.generate_presigned_url(
        'get_object',
        Params={
            'Bucket': bucket,
            'Key': key,
            'ResponseContentDisposition':
                f'attachment; filename="{file_name}"',
        },
        ExpiresIn=expires_in,
    )
    return common.json_response(200, {
        'url': url,
        'fileName': file_name,
        'expiresIn': expires_in,
    })
