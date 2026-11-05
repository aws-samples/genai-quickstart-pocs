# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
"""API: ``GET /status?fileName=<name>`` - processing status of one RFP.

Reads the job's status record from DynamoDB and adds a download link for
every completed stage. If there is no record (for example, after the table
was cleared), the status is inferred from which stage outputs exist in S3.
"""

import logging
import re
from typing import Any, Dict, List, Optional

from botocore.exceptions import ClientError

import common

logger = logging.getLogger()
logger.setLevel(logging.INFO)

STAGE_DESCRIPTIONS = {
    'uploaded': 'File uploaded successfully',
    'questions_extracted': 'Questions extracted from RFP',
    'questions_answered': 'Questions answered using knowledge base',
    'compliance_reviewed': 'Responses reviewed for compliance',
    'final_document': 'Final RFP response document created',
}


def stage_outputs(file_name: str) -> Dict[str, Dict[str, Any]]:
    """Return the S3 output of each stage for an uploaded file.

    Args:
        file_name: Uploaded file name, for example ``rfp_20260101_120000.pdf``.

    Returns:
        For each stage, the ``key`` of its main output, a ``download_name``
        and any ``additional`` ``(key, download_name)`` outputs.
    """
    base = file_name.rsplit('.', 1)[0]
    return {
        'uploaded': {
            'key': common.UPLOAD_PREFIX + file_name,
            'download_name': 'Original RFP',
        },
        'questions_extracted': {
            'key': f'{common.QUESTIONS_PREFIX}{base}_questions.json',
            'download_name': 'Extracted Questions',
        },
        'questions_answered': {
            'key': f'{common.RESPONSES_PREFIX}{base}_responses.json',
            'download_name': 'Initial Responses',
        },
        'compliance_reviewed': {
            'key': f'{common.COMPLIANCE_PREFIX}{base}'
                   '_compliance_reviewed.json',
            'download_name': 'Compliance Reviewed',
        },
        'final_document': {
            'key': f'{common.FINAL_PREFIX}{base}_RFP_Response.txt',
            'download_name': 'RFP Email',
            'additional': [
                (f'{common.FINAL_PREFIX}{base}_final.json',
                 'Fully Drafted Responses'),
            ],
        },
    }


def download_link(key: str) -> str:
    """Return the API path that downloads an S3 key."""
    return f'/download/{key}'


def add_download_links(status: Dict[str, Any], file_name: str) -> None:
    """Add download links to the completed stages of a status record."""
    outputs = stage_outputs(file_name)
    for stage in status.get('stages', []):
        output = outputs.get(stage.get('name'))
        if stage.get('status') != 'completed' or not output:
            continue
        stage['download_link'] = download_link(output['key'])
        stage['download_name'] = output['download_name']
        stage['additional_downloads'] = [
            {'download_link': download_link(key), 'download_name': name}
            for key, name in output.get('additional', [])
        ]


def display_name(file_name: str) -> str:
    """Strip the upload timestamp from a stored file name."""
    return re.sub(r'_\d{8}_\d{6}(\.[A-Za-z0-9]+)$', r'\1', file_name)


def status_from_s3(
    s3_client: Any, bucket: str, file_name: str
) -> Dict[str, Any]:
    """Infer a job's status from the stage outputs that exist in S3."""
    outputs = stage_outputs(file_name)
    exists = {
        name: common.object_exists(s3_client, bucket, output['key'])
        for name, output in outputs.items()
    }
    # If any later stage produced output, the upload itself succeeded.
    if any(exists.values()):
        exists['uploaded'] = True

    original = display_name(file_name)
    try:
        head = s3_client.head_object(Bucket=bucket,
                                     Key=outputs['uploaded']['key'])
        original = head.get('Metadata', {}).get('original-filename', original)
    except ClientError:
        pass

    timestamp = common.utc_now_iso()
    stages: List[Dict[str, Any]] = []
    current = 'uploaded'
    for name in common.STAGES:
        stage = {
            'name': name,
            'description': STAGE_DESCRIPTIONS[name],
            'status': 'completed' if exists[name] else 'pending',
            'timestamp': timestamp if exists[name] else None,
        }
        if exists[name]:
            current = name
            stage['additional_downloads'] = [
                {'download_link': download_link(key), 'download_name': label}
                for key, label in outputs[name].get('additional', [])
                if common.object_exists(s3_client, bucket, key)
            ]
        stages.append(stage)

    status = {
        'file_name': file_name,
        'original_filename': original,
        'current_stage': current,
        'stages': stages,
        'overall_status': ('completed' if exists['final_document']
                           else 'processing'),
        'last_updated': timestamp,
    }
    add_download_links(status, file_name)
    return status


def get_status(
    file_name: str, table: Any = None, s3_client: Any = None,
    bucket: Optional[str] = None,
) -> Dict[str, Any]:
    """Return the status of one job from DynamoDB, falling back to S3."""
    table = table if table is not None else common.get_status_table()
    item = table.get_item(Key={'file_name': file_name}).get('Item')
    if item:
        item.setdefault('stages', [])
        item.setdefault('original_filename', display_name(file_name))
        add_download_links(item, file_name)
        # Surface stage warnings, such as answers withheld by the
        # compliance review, at the top level for the UI.
        item['warnings'] = [stage['warning'] for stage in item['stages']
                            if stage.get('warning')]
        return item
    return status_from_s3(
        s3_client or common.regional_s3_client(),
        bucket or common.get_bucket_name(),
        file_name,
    )


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle ``GET /status?fileName=<name>``."""
    if event.get('httpMethod') == 'OPTIONS':
        return common.json_response(200, {})
    file_name = (event.get('queryStringParameters') or {}).get('fileName')
    if not file_name:
        return common.json_response(
            400, {'error': 'fileName parameter required'})
    if not common.is_safe_file_name(file_name):
        return common.json_response(400, {'error': 'Invalid fileName'})
    try:
        return common.json_response(200, get_status(file_name))
    except Exception:
        logger.exception('Could not read status for %s', file_name)
        return common.json_response(500, {'error': 'Internal server error'})
