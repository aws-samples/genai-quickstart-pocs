import json
import boto3
import base64
from botocore.exceptions import ClientError

"""
PDF Content Retrieval Lambda Function

This function retrieves PDF documents from S3 buckets and returns them as base64-encoded content
for preview in the web application. It handles CORS headers for cross-origin requests.

Input:
- bucket: S3 bucket name
- key: S3 object key (PDF file path)

Output:
- pdf_content: Base64-encoded PDF content
- content_type: MIME type (application/pdf)
- bucket: Source bucket name
- key: Source object key
"""

def lambda_handler(event, context):
    try:
        # Parse request parameters from body or direct event
        if 'body' in event and event['body']:
            body = json.loads(event['body'])
            bucket_name = body.get('bucket')
            object_key = body.get('key')
        else:
            bucket_name = event.get('bucket')
            object_key = event.get('key')
        
        # Validate required parameters
        if not bucket_name or not object_key:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                },
                'body': json.dumps({'error': 'Missing bucket or key parameter'})
            }
        
        # Initialize S3 client
        s3_client = boto3.client('s3')
        
        # Retrieve PDF object from S3
        response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
        pdf_content = response['Body'].read()
        
        # Convert PDF content to base64 for web display
        pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'pdf_content': pdf_base64,
                'content_type': 'application/pdf',
                'bucket': bucket_name,
                'key': object_key
            })
        }
        
    except ClientError as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            },
            'body': json.dumps({
                'error': f'S3 Error: {str(e)}'
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            },
            'body': json.dumps({
                'error': f'Error: {str(e)}'
            })
        }