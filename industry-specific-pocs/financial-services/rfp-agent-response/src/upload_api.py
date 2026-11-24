# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
"""API: ``POST /upload`` - authorize an RFP upload.

The browser sends the file name and size. This function validates them and
returns a presigned S3 POST that the browser uses to upload the file
directly to ``uploaded_rfp_requests/``. The presigned policy pins the object
key and content type and sets a ``content-length-range``, so S3 itself
rejects files over the limit. Uploading directly to S3 also avoids the
6 MB Lambda and 10 MB API Gateway payload limits.
"""

import json
import logging
import os
import re
from datetime import datetime, timezone
from typing import Any, Dict

import common

logger = logging.getLogger()
logger.setLevel(logging.INFO)

DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024
DEFAULT_URL_TTL_SECONDS = 300
CONTENT_TYPES = {'pdf': 'application/pdf', 'txt': 'text/plain'}
MAX_BASE_NAME_LENGTH = 80
METHODS = 'POST,OPTIONS'


class UploadRejected(ValueError):
    """An upload request that fails validation."""

    def __init__(self, message: str, status_code: int = 400) -> None:
        """Store the message and the HTTP status code to return."""
        super().__init__(message)
        self.status_code = status_code


def max_upload_bytes() -> int:
    """Return the configured upload size limit in bytes."""
    return int(os.environ.get('MAX_UPLOAD_BYTES', DEFAULT_MAX_UPLOAD_BYTES))


def sanitize_base_name(name: str) -> str:
    """Reduce a file name (without extension) to ``[A-Za-z0-9._-]``."""
    base = re.sub(r'[^A-Za-z0-9._-]+', '_', name)
    base = re.sub(r'\.{2,}', '.', base).strip('._-')
    return base[:MAX_BASE_NAME_LENGTH].rstrip('._-') or 'rfp'


def validate_upload_request(body: Any, max_bytes: int) -> Dict[str, Any]:
    """Validate the requested file name and size.

    Args:
        body: Parsed JSON request body.
        max_bytes: Largest allowed file size.

    Returns:
        A dict with ``original_name``, ``base_name``, ``extension``,
        ``size`` and ``content_type``.

    Raises:
        UploadRejected: If the request is invalid or the file is too large.
    """
    if not isinstance(body, dict):
        raise UploadRejected('Request body must be a JSON object')

    file_name = body.get('fileName')
    if not isinstance(file_name, str) or not file_name.strip():
        raise UploadRejected('fileName is required')
    file_name = file_name.strip().replace('\\', '/').split('/')[-1]
    stem, dot, extension = file_name.rpartition('.')
    extension = extension.lower()
    if not dot or extension not in CONTENT_TYPES:
        raise UploadRejected('Only .txt and .pdf files are supported')

    size = body.get('fileSize')
    if isinstance(size, bool) or not isinstance(size, int):
        raise UploadRejected('fileSize must be an integer number of bytes')
    if size < 1:
        raise UploadRejected('The file is empty')
    if size > max_bytes:
        raise UploadRejected(
            f'File too large. Maximum size is {max_bytes // (1024 * 1024)} MB',
            status_code=413,
        )

    return {
        'original_name': file_name[:200],
        'base_name': sanitize_base_name(stem),
        'extension': extension,
        'size': size,
        'content_type': CONTENT_TYPES[extension],
    }


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Return a presigned POST for one RFP upload."""
    if event.get('httpMethod') == 'OPTIONS':
        return common.json_response(200, {}, METHODS)
    try:
        try:
            body = json.loads(event.get('body') or '{}')
        except json.JSONDecodeError:
            raise UploadRejected('Request body must be valid JSON')
        limit = max_upload_bytes()
        request = validate_upload_request(body, limit)
    except UploadRejected as error:
        return common.json_response(error.status_code, {'error': str(error)},
                                    METHODS)

    try:
        timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
        stored_name = (f"{request['base_name']}_{timestamp}."
                       f"{request['extension']}")
        key = common.UPLOAD_PREFIX + stored_name
        metadata_name = f"{request['base_name']}.{request['extension']}"
        expires_in = int(os.environ.get('UPLOAD_URL_TTL_SECONDS',
                                        DEFAULT_URL_TTL_SECONDS))

        post = common.regional_s3_client().generate_presigned_post(
            Bucket=common.get_bucket_name(),
            Key=key,
            Fields={
                'Content-Type': request['content_type'],
                'x-amz-meta-original-filename': metadata_name,
            },
            Conditions=[
                {'Content-Type': request['content_type']},
                {'x-amz-meta-original-filename': metadata_name},
                ['content-length-range', 1, limit],
            ],
            ExpiresIn=expires_in,
        )
        common.update_processing_status(
            stored_name, 'uploaded', 'processing',
            item_attributes={'original_filename': request['original_name']},
        )
        logger.info('Issued upload URL for %s (%d bytes)', key,
                    request['size'])
        return common.json_response(200, {
            'message': 'Upload authorized',
            'uploadUrl': post['url'],
            'fields': post['fields'],
            'original_filename': request['original_name'],
            'timestamped_filename': stored_name,
            'maxBytes': limit,
            'expiresIn': expires_in,
        }, METHODS)
    except Exception:
        logger.exception('Could not authorize upload')
        return common.json_response(500, {'error': 'Internal server error'},
                                    METHODS)
