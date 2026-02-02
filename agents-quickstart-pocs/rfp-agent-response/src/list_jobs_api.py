import json
import boto3
from datetime import datetime

def lambda_handler(event, context):
    """API Gateway Lambda function to list all RFP processing jobs"""
    
    try:
        # Get S3 client and bucket name
        s3_client = boto3.client('s3')
        bucket_name = 'terminal-upload-' + context.invoked_function_arn.split(':')[4] + '-' + boto3.Session().region_name
        
        # List all files in the uploaded_rfp_requests folder
        response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix='uploaded_rfp_requests/'
        )
        
        job_files = []
        if 'Contents' in response:
            for obj in response['Contents']:
                # Extract filename from the key (remove folder prefix)
                file_name = obj['Key'].replace('uploaded_rfp_requests/', '')
                if file_name:  # Skip empty strings (folder itself)
                    job_files.append(file_name)
        
        # Sort by last modified (newest first)
        job_files.sort(reverse=True)
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET'
            },
            'body': json.dumps(job_files)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET'
            },
            'body': json.dumps({'error': str(e)})
        }