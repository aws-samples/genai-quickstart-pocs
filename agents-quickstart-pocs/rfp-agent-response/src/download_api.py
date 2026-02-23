import json
import boto3
from urllib.parse import unquote

def lambda_handler(event, context):
    """API Gateway Lambda function to handle file downloads"""
    
    try:
        path = event['path']
        method = event['httpMethod']
        
        s3_client = boto3.client('s3')
        bucket_name = 'terminal-upload-' + context.invoked_function_arn.split(':')[4] + '-' + boto3.Session().region_name
        
        if method == 'GET' and path == '/downloads':
            # List files in final_responses folder
            response = s3_client.list_objects_v2(
                Bucket=bucket_name,
                Prefix='final_responses/'
            )
            
            files = []
            if 'Contents' in response:
                files = [
                    {
                        'name': obj['Key'].replace('final_responses/', ''),
                        'lastModified': obj['LastModified'].isoformat(),
                        'size': obj['Size']
                    }
                    for obj in response['Contents'] 
                    if not obj['Key'].endswith('/')
                ]
                # Sort by last modified date, most recent first
                files.sort(key=lambda x: x['lastModified'], reverse=True)
            
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps(files)
            }
            
        elif method == 'GET' and path.startswith('/download/'):
            # Download specific file - handle both old format and new folder-based format
            file_path = unquote(path.replace('/download/', ''))
            
            # Check if it's the new format with folder path
            if '/' in file_path:
                s3_key = file_path  # Already includes folder path
                filename = file_path.split('/')[-1]  # Extract just the filename for download
            else:
                # Legacy format - assume final_responses folder
                filename = file_path
                s3_key = f'final_responses/{filename}'
            
            try:
                response = s3_client.get_object(Bucket=bucket_name, Key=s3_key)
                file_content = response['Body'].read()
                
                # Determine content type based on file extension
                content_type = 'application/octet-stream'
                if filename.endswith('.json'):
                    content_type = 'application/json'
                elif filename.endswith('.txt'):
                    content_type = 'text/plain'
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
                        'Content-Type': content_type,
                        'Content-Disposition': f'attachment; filename="{filename}"'
                    },
                    'body': file_content.decode('utf-8'),
                    'isBase64Encoded': False
                }
            except s3_client.exceptions.NoSuchKey:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    },
                    'body': json.dumps({'error': 'File not found'})
                }
        
        elif method == 'OPTIONS':
            # Handle CORS preflight requests
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Max-Age': '86400'
                },
                'body': ''
            }
        
        return {
            'statusCode': 404,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps({'error': 'Not found'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }