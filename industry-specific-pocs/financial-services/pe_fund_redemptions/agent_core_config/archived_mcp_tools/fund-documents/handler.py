import json
import boto3
import os

s3_client = boto3.client('s3')

def lambda_handler(event, context):
    # Extract tool name from context
    tool_name = context.client_context.custom.get('bedrockAgentCoreToolName', 'unknown')
    
    if 'get_fund_document' not in tool_name:
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Unknown tool'})
        }
    
    # Get fund name from event
    fund_name = event.get('fund_name', '')
    investor_class = event.get('investor_class', 'ClassA')  # Default to ClassA
    
    if not fund_name:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'fund_name is required'})
        }
    
    try:
        # Construct S3 key
        s3_key = f"fund_documents/{fund_name}_{investor_class}.txt"
        bucket = os.environ.get('S3_BUCKET', 'tonytrev-ab2')
        
        # Get document from S3
        response = s3_client.get_object(Bucket=bucket, Key=s3_key)
        document_content = response['Body'].read().decode('utf-8')
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'fund_name': fund_name,
                'investor_class': investor_class,
                'document': document_content
            })
        }
        
    except s3_client.exceptions.NoSuchKey:
        return {
            'statusCode': 404,
            'body': json.dumps({'error': f'Document not found: {s3_key}'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
