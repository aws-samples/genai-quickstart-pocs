# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
"""Stage 1: extract vendor-facing questions from an uploaded RFP.

Triggered by S3 ``ObjectCreated`` events under ``uploaded_rfp_requests/``.
Reads the PDF or text file, asks Claude on Amazon Bedrock to turn every
requirement into a question, and writes the questions as a JSON array to
``formatted_questions/<name>_questions.json``.
"""

import io
import json
import logging
from typing import Any, Dict, List
from urllib.parse import unquote_plus

import boto3
import pypdf

import common

logger = logging.getLogger()
logger.setLevel(logging.INFO)

STAGE = 'questions_extracted'
MAX_OUTPUT_TOKENS = 16000

EXTRACTION_PROMPT = """Extract all questions and requirements from this RFP \
document that vendors need to respond to. Convert requirement statements into \
questions. For example:
- "The system must provide X" becomes "What X capabilities does your system \
provide?"
- "Vendors must demonstrate Y" becomes "How do you demonstrate Y?"
- "Describe your approach to Z" stays as "Describe your approach to Z"

Return only a JSON array of questions, with each question as a separate \
string. Focus on technical requirements, functional requirements, \
implementation details, pricing, experience, and any other areas where vendor \
responses are needed.

RFP Content:
{content}

Return format: ["Question 1?", "Question 2?", ...]"""


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle an S3 event for a newly uploaded RFP file."""
    record = event['Records'][0]
    bucket = record['s3']['bucket']['name']
    key = unquote_plus(record['s3']['object']['key'])
    file_name = key.split('/')[-1]
    logger.info('Extracting questions from s3://%s/%s', bucket, key)

    # The browser uploads straight to S3, so the upload is only confirmed
    # once this function is triggered.
    common.update_processing_status(file_name, 'uploaded', 'completed')
    common.update_processing_status(file_name, STAGE, 'processing')
    try:
        s3_client = boto3.client('s3')
        body = s3_client.get_object(Bucket=bucket, Key=key)['Body'].read()
        text = extract_text(file_name, body)

        questions = extract_questions(
            common.bedrock_runtime_client(), text
        )
        if not questions:
            raise ValueError('No questions were found in the RFP document')

        stem = file_name.rsplit('.', 1)[0]
        output_key = f'{common.QUESTIONS_PREFIX}{stem}_questions.json'
        s3_client.put_object(
            Bucket=bucket,
            Key=output_key,
            Body=json.dumps(questions, indent=2),
            ContentType='application/json',
            Metadata={common.SOURCE_FILE_METADATA_KEY: file_name},
        )
        logger.info('Wrote %d questions to %s', len(questions), output_key)
        common.update_processing_status(file_name, STAGE, 'completed')
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Processed {len(questions)} questions',
                'json_file': output_key,
            }),
        }
    except Exception as error:
        logger.exception('Question extraction failed for %s', key)
        common.update_processing_status(file_name, STAGE, 'error', str(error))
        return {'statusCode': 500, 'body': json.dumps({'error': str(error)})}


def extract_text(file_name: str, content: bytes) -> str:
    """Return the text of an uploaded RFP.

    Args:
        file_name: Uploaded file name; ``.pdf`` files are parsed as PDF.
        content: Raw file bytes.

    Returns:
        The document text.

    Raises:
        ValueError: If a PDF contains no extractable text.
    """
    if file_name.lower().endswith('.pdf'):
        return extract_text_from_pdf(content)
    return content.decode('utf-8', errors='replace')


def extract_text_from_pdf(pdf_content: bytes) -> str:
    """Extract the text of every page of a PDF.

    Raises:
        ValueError: If no text can be extracted, for example from a scanned
            PDF without a text layer.
    """
    reader = pypdf.PdfReader(io.BytesIO(pdf_content))
    pages = [page.extract_text() or '' for page in reader.pages]
    logger.info('Read %d PDF pages', len(pages))
    text = '\n'.join(pages).strip()
    if not text:
        raise ValueError('No text could be extracted from the PDF')
    return text


def extract_questions(bedrock_client: Any, text: str) -> List[str]:
    """Ask Claude to list the questions an RFP expects vendors to answer.

    Args:
        bedrock_client: A ``bedrock-runtime`` boto3 client.
        text: RFP document text.

    Returns:
        Non-empty question strings, in document order.
    """
    output = common.invoke_claude(
        bedrock_client,
        EXTRACTION_PROMPT.format(content=text),
        max_tokens=MAX_OUTPUT_TOKENS,
    )
    parsed = common.extract_json(output)
    if not isinstance(parsed, list):
        raise ValueError('Expected a JSON array of questions')
    return [str(item).strip() for item in parsed if str(item).strip()]
