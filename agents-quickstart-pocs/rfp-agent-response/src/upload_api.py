import json
import boto3
import base64
from datetime import datetime

def lambda_handler(event, context):
    """API Gateway Lambda function to handle file uploads"""
    
    try:
        # Parse the request body
        body = json.loads(event['body'])
        original_file_name = body['fileName']
        file_content = body['fileContent']
        
        print(f"Processing upload for file: {original_file_name}")
        print(f"File content length: {len(file_content) if file_content else 0}")
        
        # Validate file type
        if not (original_file_name.endswith('.txt') or original_file_name.endswith('.pdf')):
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST'
                },
                'body': json.dumps({'error': 'Only .txt and .pdf files are supported'})
            }
        
        # Create timestamped filename for better tracking
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        # Extract base name and extension
        name_parts = original_file_name.rsplit('.', 1)
        base_name = name_parts[0]
        file_extension = name_parts[1] if len(name_parts) > 1 else 'txt'
        timestamped_file_name = f"{base_name}_{timestamp}.{file_extension}"
        
        # Upload to S3 with timestamped filename
        s3_client = boto3.client('s3')
        bucket_name = 'terminal-upload-' + context.invoked_function_arn.split(':')[4] + '-' + boto3.Session().region_name
        s3_key = f'uploaded_rfp_requests/{timestamped_file_name}'
        
        # Determine content type based on file extension
        content_type = 'application/pdf' if file_extension.lower() == 'pdf' else 'text/plain'
        
        # For PDF files, decode base64 content
        if file_extension.lower() == 'pdf':
            try:
                file_body = base64.b64decode(file_content)
                print(f"Successfully decoded PDF, size: {len(file_body)} bytes")
            except Exception as decode_error:
                print(f"Base64 decode error: {str(decode_error)}")
                raise Exception(f"Failed to decode PDF file: {str(decode_error)}")
        else:
            file_body = file_content
        
        try:
            s3_client.put_object(
                Bucket=bucket_name,
                Key=s3_key,
                Body=file_body,
                ContentType=content_type,
                Metadata={
                    'original-filename': original_file_name,
                    'upload-timestamp': timestamp
                }
            )
            print(f"Successfully uploaded to S3: {s3_key}")
        except Exception as s3_error:
            print(f"S3 upload error: {str(s3_error)}")
            raise Exception(f"Failed to upload file to S3: {str(s3_error)}")
        
        # Initialize status tracking with timestamped filename
        update_processing_status(timestamped_file_name, 'uploaded', 'completed')
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST'
            },
            'body': json.dumps({
                'message': 'File uploaded successfully',
                'original_filename': original_file_name,
                'timestamped_filename': timestamped_file_name,
                'timestamp': timestamp
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST'
            },
            'body': json.dumps({'error': str(e)})
        }

def update_processing_status(file_name, stage_name, status='completed', error_message=None):
    """Helper function to update processing status in DynamoDB"""
    try:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table('rfp-processing-status')
        
        timestamp = datetime.utcnow().isoformat()
        
        # Get current status or create new
        try:
            response = table.get_item(Key={'file_name': file_name})
            if 'Item' in response:
                status_data = response['Item']
            else:
                status_data = {
                    'file_name': file_name,
                    'stages': [],
                    'overall_status': 'processing',
                    'created_at': timestamp
                }
        except:
            status_data = {
                'file_name': file_name,
                'stages': [],
                'overall_status': 'processing',
                'created_at': timestamp
            }
        
        # Update the specific stage
        stages = status_data.get('stages', [])
        stage_found = False
        
        for stage in stages:
            if stage['name'] == stage_name:
                stage['status'] = status
                stage['timestamp'] = timestamp
                if error_message:
                    stage['error'] = error_message
                stage_found = True
                break
        
        if not stage_found:
            new_stage = {
                'name': stage_name,
                'status': status,
                'timestamp': timestamp
            }
            if error_message:
                new_stage['error'] = error_message
            stages.append(new_stage)
        
        status_data['stages'] = stages
        status_data['current_stage'] = stage_name
        status_data['last_updated'] = timestamp
        
        # Update overall status
        if status == 'error':
            status_data['overall_status'] = 'error'
        elif stage_name == 'final_document' and status == 'completed':
            status_data['overall_status'] = 'completed'
        else:
            status_data['overall_status'] = 'processing'
        
        # Save to DynamoDB
        table.put_item(Item=status_data)
        
    except Exception as e:
        print(f"Error updating status: {str(e)}")