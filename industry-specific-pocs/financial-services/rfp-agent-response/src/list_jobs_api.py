# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
"""API: ``GET /list-jobs`` - list uploaded RFP files, newest first."""

import logging
from typing import Any, Dict, List

import common

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def list_jobs(s3_client: Any, bucket: str) -> List[str]:
    """Return uploaded file names, most recently uploaded first."""
    objects = [
        obj for obj in common.iter_objects(s3_client, bucket,
                                           common.UPLOAD_PREFIX)
        if obj['Key'] != common.UPLOAD_PREFIX
    ]
    objects.sort(key=lambda obj: obj['LastModified'], reverse=True)
    return [obj['Key'][len(common.UPLOAD_PREFIX):] for obj in objects]


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """List every RFP processing job."""
    if event.get('httpMethod') == 'OPTIONS':
        return common.json_response(200, {})
    try:
        return common.json_response(200, list_jobs(
            common.regional_s3_client(), common.get_bucket_name()
        ))
    except Exception:
        logger.exception('Could not list jobs')
        return common.json_response(500, {'error': 'Internal server error'})
