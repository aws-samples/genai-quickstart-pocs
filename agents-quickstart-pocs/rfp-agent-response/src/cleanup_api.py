import json
import boto3
import os
from botocore.exceptions import ClientError

def lambda_handler(event, context):
    """
    Lambda function to clean up S3 bucket and DynamoDB table for demo resets.
    Removes all files from S3 while preserving folder structure, and clears all DynamoDB items.
    """
    
    # CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
    }
    
    # Handle preflight OPTIONS request
    if event['httpMethod'] == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'CORS preflight'})
        }
    
    # Only allow POST requests
    if event['httpMethod'] != 'POST':
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        confirmation = body.get('confirmation', '')
        
        # Require confirmation to prevent accidental cleanup
        if confirmation != 'CLEANUP_DEMO_DATA':
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Invalid confirmation. Please provide confirmation: "CLEANUP_DEMO_DATA"'
                })
            }
        
        # Initialize AWS clients
        s3_client = boto3.client('s3')
        dynamodb = boto3.resource('dynamodb')
        
        # Get environment variables
        region = os.environ.get('AWS_REGION', 'us-east-1')
        account_id = boto3.client('sts').get_caller_identity()['Account']
        
        # Construct resource names
        bucket_name = f'terminal-upload-{account_id}-{region}'
        table_name = 'rfp-processing-status'
        
        cleanup_results = {
            's3_files_deleted': 0,
            'dynamodb_items_deleted': 0,
            'errors': []
        }
        
        # Clean up S3 bucket
        try:
            # List all objects in the bucket
            paginator = s3_client.get_paginator('list_objects_v2')
            pages = paginator.paginate(Bucket=bucket_name)
            
            objects_to_delete = []
            for page in pages:
                if 'Contents' in page:
                    for obj in page['Contents']:
                        objects_to_delete.append({'Key': obj['Key']})
            
            # Delete objects in batches (S3 allows up to 1000 objects per delete request)
            if objects_to_delete:
                for i in range(0, len(objects_to_delete), 1000):
                    batch = objects_to_delete[i:i+1000]
                    response = s3_client.delete_objects(
                        Bucket=bucket_name,
                        Delete={'Objects': batch}
                    )
                    
                    # Count successful deletions
                    if 'Deleted' in response:
                        cleanup_results['s3_files_deleted'] += len(response['Deleted'])
                    
                    # Track any errors
                    if 'Errors' in response:
                        for error in response['Errors']:
                            cleanup_results['errors'].append(f"S3 delete error: {error['Key']} - {error['Message']}")
            
        except ClientError as e:
            cleanup_results['errors'].append(f"S3 cleanup error: {str(e)}")
        
        # Clean up DynamoDB table
        try:
            table = dynamodb.Table(table_name)
            
            # Scan the table to get all items
            response = table.scan()
            items = response['Items']
            
            # Handle pagination if there are more items
            while 'LastEvaluatedKey' in response:
                response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                items.extend(response['Items'])
            
            # Delete items in batches
            with table.batch_writer() as batch:
                for item in items:
                    # Use the primary key to delete the item
                    batch.delete_item(Key={'file_name': item['file_name']})
                    cleanup_results['dynamodb_items_deleted'] += 1
                    
        except ClientError as e:
            cleanup_results['errors'].append(f"DynamoDB cleanup error: {str(e)}")
        
        # Prepare response
        if cleanup_results['errors']:
            status_code = 207  # Multi-status (partial success)
            message = 'Cleanup completed with some errors'
        else:
            status_code = 200
            message = 'Cleanup completed successfully'
        
        return {
            'statusCode': status_code,
            'headers': headers,
            'body': json.dumps({
                'message': message,
                'results': cleanup_results
            })
        }
        
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Invalid JSON in request body'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': 'Internal server error',
                'details': str(e)
            })
        }