import json
import boto3
from botocore.exceptions import ClientError

"""
Alternative Document Fields Extraction Lambda Function

This function uses AWS Bedrock Data Automation to extract form fields from PDF documents.
It's an alternative to the main metadata extraction approach used in the application.

Note: This function is not currently used in the main application (App.js) but is kept
for potential future use or as an alternative implementation.

Features:
- Uses Bedrock Data Automation service
- Extracts structured field data from PDFs
- Asynchronous processing with job tracking
- Returns field names and job IDs

Input:
- S3 event structure with bucket and object key

Output:
- field_names: Array of extracted field names
- job_id: Bedrock Data Automation job identifier
"""

def lambda_handler(event, context):
    # Initialize Bedrock Data Automation client
    bedrock_agent = boto3.client('bedrock-data-automation')
    
    try:
        # Parse S3 event structure from request body or direct event
        if 'body' in event and event['body']:
            body = json.loads(event['body'])
            bucket = body['Records'][0]['s3']['bucket']['name']
            key = body['Records'][0]['s3']['object']['key']
        else:
            bucket = event['Records'][0]['s3']['bucket']['name']
            key = event['Records'][0]['s3']['object']['key']
        
        # Bedrock Data Automation project ARN (pre-configured)
        project_arn = 'arn:aws:bedrock:us-east-1:905418369822:data-automation-project/5f408970390c'
        
        # Invoke Bedrock Data Automation for document field extraction
        job_response = bedrock_agent.invoke_data_automation_async(
            projectArn=project_arn,
            inputConfiguration={
                'document': {
                    's3Uri': f's3://{bucket}/{key}'
                }
            },
            outputConfiguration={
                's3Uri': f's3://{bucket}/output/'
            }
        )
        
        # Process extraction results to get field names
        field_names = []
        if 'extractionResults' in job_response:
            for result in job_response['extractionResults']:
                if 'document' in result and 'content' in result['document']:
                    content = result['document']['content']
                    # Extract field names from document content
                    if isinstance(content, dict) and 'fields' in content:
                        field_names = list(content['fields'].keys())
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            },
            'body': json.dumps({
                'field_names': field_names,
                'job_id': job_response.get('invocationArn', '')
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
                'error': str(e),
                'field_names': []
            })
        }