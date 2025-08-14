import json
import boto3
from botocore.exceptions import ClientError

"""
S3 Operations Lambda Function

This function handles S3 bucket and object operations for the PDF to Web Form application.
It supports two main operations:
1. List all S3 buckets (when no bucket_names provided)
2. List PDF objects in specific buckets (when bucket_names provided)

Input:
- bucket_names (optional): Array of bucket names to list PDF objects from

Output:
- buckets: List of all S3 bucket names (when listing buckets)
- pdf_objects: Dictionary mapping bucket names to their PDF objects (when listing objects)
"""

def lambda_handler(event, context):
    # Initialize S3 client
    s3_client = boto3.client('s3')
    
    try:
        # Parse request parameters from body or direct event
        if 'body' in event and event['body']:
            body = json.loads(event['body'])
            bucket_names = body.get('bucket_names', [])
        else:
            bucket_names = event.get('bucket_names', [])
        
        if not bucket_names:
            # Operation 1: List all available S3 buckets
            response = s3_client.list_buckets()
            buckets = [bucket['Name'] for bucket in response['Buckets']]
            
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                },
                'body': json.dumps({
                    'buckets': buckets
                })
            }
        else:
            # Operation 2: List PDF objects from specified buckets
            pdf_objects = {}
            
            for bucket_name in bucket_names:
                try:
                    # List all objects in the bucket
                    response = s3_client.list_objects_v2(Bucket=bucket_name)
                    
                    if 'Contents' in response:
                        # Filter for PDF files only
                        pdfs = [obj['Key'] for obj in response['Contents'] 
                               if obj['Key'].lower().endswith('.pdf')]
                        pdf_objects[bucket_name] = pdfs
                    else:
                        # No objects found in bucket
                        pdf_objects[bucket_name] = []
                        
                except ClientError as e:
                    # Handle bucket access errors
                    pdf_objects[bucket_name] = f"Error: {str(e)}"
            
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                },
                'body': json.dumps({
                    'pdf_objects': pdf_objects
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
                'error': str(e)
            })
        }