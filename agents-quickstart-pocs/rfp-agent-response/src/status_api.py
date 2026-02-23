import json
import boto3
from datetime import datetime

def lambda_handler(event, context):
    """API Gateway Lambda function to check RFP processing status"""
    
    try:
        # Get file name from query parameters
        query_params = event.get('queryStringParameters') or {}
        file_name = query_params.get('fileName')
        if not file_name:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'GET'
                },
                'body': json.dumps({'error': 'fileName parameter required'})
            }
        
        # Check status in DynamoDB
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table('rfp-processing-status')
        
        try:
            response = table.get_item(Key={'file_name': file_name})
            if 'Item' in response:
                status_data = response['Item']
                # Add download links to completed stages from DynamoDB data
                status_data = add_download_links_to_status(status_data, file_name)
            else:
                # If not in DynamoDB, check S3 folders to determine status
                status_data = check_s3_status(file_name, context)
        except Exception as e:
            # Fallback to S3 checking if DynamoDB fails
            status_data = check_s3_status(file_name, context)
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET'
            },
            'body': json.dumps(status_data)
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

def add_download_links_to_status(status_data, file_name):
    """Add download links to existing status data from DynamoDB"""
    # Extract base name from file (works for both .txt and .pdf)
    base_name = file_name.rsplit('.', 1)[0] if '.' in file_name else file_name
    
    # Define stage configurations with download info
    stage_configs = {
        'uploaded': {
            'folder': 'uploaded_rfp_requests',
            'file_pattern': file_name,
            'download_name': 'Original RFP'
        },
        'questions_extracted': {
            'folder': 'formatted_questions',
            'file_pattern': f'{base_name}_questions.json',
            'download_name': 'Extracted Questions'
        },
        'questions_answered': {
            'folder': 'completed_responses',
            'file_pattern': f'{base_name}_responses.json',
            'download_name': 'Initial Responses'
        },
        'compliance_reviewed': {
            'folder': 'compliance_reviewed',
            'file_pattern': f'{base_name}_compliance_reviewed.json',
            'download_name': 'Compliance Reviewed'
        },
        'final_document': {
            'folder': 'final_responses',
            'file_pattern': f'{base_name}_RFP_Response.txt',
            'download_name': 'RFP Email',
            'additional_downloads': [
                {
                    'folder': 'final_responses',
                    'file_pattern': f'{base_name}_final.json',
                    'download_name': 'Fully Drafted Responses'
                }
            ]
        }
    }
    
    # Add download links to completed stages
    if 'stages' in status_data:
        for stage in status_data['stages']:
            stage_name = stage.get('name')
            if stage.get('status') == 'completed' and stage_name in stage_configs:
                config = stage_configs[stage_name]
                stage['download_link'] = f"/download/{config['folder']}/{config['file_pattern']}"
                stage['download_name'] = config['download_name']
                
                # Add additional downloads if they exist
                if 'additional_downloads' in config:
                    stage['additional_downloads'] = []
                    for additional in config['additional_downloads']:
                        stage['additional_downloads'].append({
                            'download_link': f"/download/{additional['folder']}/{additional['file_pattern']}",
                            'download_name': additional['download_name']
                        })
    
    return status_data

def check_s3_status(file_name, context):
    """Check processing status by examining S3 folders"""
    s3_client = boto3.client('s3')
    bucket_name = 'terminal-upload-' + context.invoked_function_arn.split(':')[4] + '-' + boto3.Session().region_name
    # Extract base name from file (works for both .txt and .pdf)
    base_name = file_name.rsplit('.', 1)[0] if '.' in file_name else file_name
    
    # Try to get original filename from S3 metadata
    original_filename = file_name
    try:
        response = s3_client.head_object(
            Bucket=bucket_name,
            Key=f'uploaded_rfp_requests/{file_name}'
        )
        metadata = response.get('Metadata', {})
        original_filename = metadata.get('original-filename', file_name)
    except:
        # If we can't get metadata, extract from timestamped filename
        import re
        match = re.match(r'(.+)_\d{8}_\d{6}\.txt', file_name)
        if match:
            original_filename = f"{match.group(1)}.txt"
    
    stages = [
        {
            'name': 'uploaded',
            'description': 'File uploaded successfully',
            'folder': 'uploaded_rfp_requests',
            'file_pattern': file_name,
            'download_name': 'Original RFP'
        },
        {
            'name': 'questions_extracted',
            'description': 'Questions extracted from RFP',
            'folder': 'formatted_questions',
            'file_pattern': f'{base_name}_questions.json',
            'download_name': 'Extracted Questions'
        },
        {
            'name': 'questions_answered',
            'description': 'Questions answered using knowledge base',
            'folder': 'completed_responses',
            'file_pattern': f'{base_name}_responses.json',
            'download_name': 'Initial Responses'
        },
        {
            'name': 'compliance_reviewed',
            'description': 'Responses reviewed for compliance',
            'folder': 'compliance_reviewed',
            'file_pattern': f'{base_name}_compliance_reviewed.json',
            'download_name': 'Compliance Reviewed'
        },
        {
            'name': 'final_document',
            'description': 'Final RFP response document created',
            'folder': 'final_responses',
            'file_pattern': f'{base_name}_RFP_Response.txt',
            'download_name': 'RFP Email',
            'additional_downloads': [
                {
                    'folder': 'final_responses',
                    'file_pattern': f'{base_name}_final.json',
                    'download_name': 'Fully Drafted Responses'
                }
            ]
        }
    ]
    
    status_data = {
        'file_name': file_name,
        'original_filename': original_filename,
        'current_stage': 'uploaded',
        'stages': [],
        'overall_status': 'processing',
        'last_updated': datetime.utcnow().isoformat()
    }
    
    for stage in stages:
        try:
            # Special handling for uploaded stage - if downstream stages exist, assume upload was successful
            if stage['name'] == 'uploaded':
                # Check if any downstream files exist to infer upload success
                downstream_exists = False
                downstream_files = [
                    f'formatted_questions/{base_name}_questions.json',
                    f'completed_responses/{base_name}_responses.json',
                    f'compliance_reviewed/{base_name}_compliance_reviewed.json',
                    f'final_responses/{base_name}_RFP_Response.txt'
                ]
                
                for downstream_file in downstream_files:
                    try:
                        s3_client.head_object(Bucket=bucket_name, Key=downstream_file)
                        downstream_exists = True
                        break
                    except:
                        continue
                
                # If downstream files exist, assume upload was successful even if we can't find the original
                if downstream_exists:
                    stage_status = {
                        'name': stage['name'],
                        'description': stage['description'],
                        'status': 'completed',
                        'timestamp': datetime.utcnow().isoformat(),
                        'download_link': f"/download/{stage['folder']}/{stage['file_pattern']}",
                        'download_name': stage['download_name']
                    }
                    status_data['current_stage'] = stage['name']
                else:
                    # Try to check the actual uploaded file
                    s3_client.head_object(
                        Bucket=bucket_name,
                        Key=f"{stage['folder']}/{stage['file_pattern']}"
                    )
                    stage_status = {
                        'name': stage['name'],
                        'description': stage['description'],
                        'status': 'completed',
                        'timestamp': datetime.utcnow().isoformat(),
                        'download_link': f"/download/{stage['folder']}/{stage['file_pattern']}",
                        'download_name': stage['download_name']
                    }
                    status_data['current_stage'] = stage['name']
            else:
                # Normal handling for other stages
                s3_client.head_object(
                    Bucket=bucket_name,
                    Key=f"{stage['folder']}/{stage['file_pattern']}"
                )
                # File exists
                stage_status = {
                    'name': stage['name'],
                    'description': stage['description'],
                    'status': 'completed',
                    'timestamp': datetime.utcnow().isoformat(),
                    'download_link': f"/download/{stage['folder']}/{stage['file_pattern']}",
                    'download_name': stage['download_name']
                }
                
                # Add additional downloads if they exist
                if 'additional_downloads' in stage:
                    stage_status['additional_downloads'] = []
                    for additional in stage['additional_downloads']:
                        # Check if the additional file exists
                        try:
                            s3_client.head_object(
                                Bucket=bucket_name,
                                Key=f"{additional['folder']}/{additional['file_pattern']}"
                            )
                            stage_status['additional_downloads'].append({
                                'download_link': f"/download/{additional['folder']}/{additional['file_pattern']}",
                                'download_name': additional['download_name']
                            })
                        except:
                            # Additional file doesn't exist, skip it
                            pass
                status_data['current_stage'] = stage['name']
                
        except s3_client.exceptions.NoSuchKey:
            # File doesn't exist yet
            stage_status = {
                'name': stage['name'],
                'description': stage['description'],
                'status': 'pending',
                'timestamp': None
            }
        except Exception as e:
            # For uploaded stage, if we have downstream files, don't show as error
            if stage['name'] == 'uploaded':
                # Check if any downstream files exist
                downstream_exists = False
                downstream_files = [
                    f'formatted_questions/{base_name}_questions.json',
                    f'completed_responses/{base_name}_responses.json',
                    f'compliance_reviewed/{base_name}_compliance_reviewed.json',
                    f'final_responses/{base_name}_RFP_Response.txt'
                ]
                
                for downstream_file in downstream_files:
                    try:
                        s3_client.head_object(Bucket=bucket_name, Key=downstream_file)
                        downstream_exists = True
                        break
                    except:
                        continue
                
                if downstream_exists:
                    # Downstream files exist, so upload must have been successful
                    stage_status = {
                        'name': stage['name'],
                        'description': stage['description'],
                        'status': 'completed',
                        'timestamp': datetime.utcnow().isoformat(),
                        'download_link': f"/download/{stage['folder']}/{stage['file_pattern']}",
                        'download_name': stage['download_name']
                    }
                    status_data['current_stage'] = stage['name']
                else:
                    # No downstream files, show the actual error
                    stage_status = {
                        'name': stage['name'],
                        'description': stage['description'],
                        'status': 'error',
                        'timestamp': datetime.utcnow().isoformat(),
                        'error': str(e)
                    }
            else:
                # For other stages, show the error normally
                stage_status = {
                    'name': stage['name'],
                    'description': stage['description'],
                    'status': 'error',
                    'timestamp': datetime.utcnow().isoformat(),
                    'error': str(e)
                }
        
        status_data['stages'].append(stage_status)
    
    # Determine overall status
    if status_data['current_stage'] == 'final_document':
        status_data['overall_status'] = 'completed'
    elif any(stage['status'] == 'error' for stage in status_data['stages']):
        status_data['overall_status'] = 'error'
    else:
        status_data['overall_status'] = 'processing'
    
    return status_data

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