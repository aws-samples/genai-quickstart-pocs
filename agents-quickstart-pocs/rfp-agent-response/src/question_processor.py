import boto3
import json
import time
from urllib.parse import unquote_plus
from datetime import datetime

def lambda_handler(event, context):
    """Lambda function triggered when JSON files are added to formatted_questions folder"""
    
    s3_client = boto3.client('s3')
    kb_client = boto3.client('bedrock-agent-runtime')
    
    try:
        # Get S3 event details
        record = event['Records'][0]
        bucket_name = record['s3']['bucket']['name']
        file_key = unquote_plus(record['s3']['object']['key'])
        
        print(f"Processing JSON file: {file_key} from bucket: {bucket_name}")
        
        # Extract filename for status tracking - preserve original extension
        json_filename = file_key.split('/')[-1]  # e.g., "document_questions.json"
        base_name = json_filename.replace('_questions.json', '')  # e.g., "document"
        
        # Determine original file extension by checking if PDF exists in S3
        try:
            # Try PDF first
            s3_client.head_object(Bucket=bucket_name, Key=f'uploaded_rfp_requests/{base_name}.pdf')
            base_filename = f'{base_name}.pdf'
        except:
            # Fallback to txt
            base_filename = f'{base_name}.txt'
        
        update_processing_status(base_filename, 'questions_answered', 'processing')
        
        # Download JSON file content from S3
        response = s3_client.get_object(Bucket=bucket_name, Key=file_key)
        json_content = response['Body'].read().decode('utf-8')
        questions = json.loads(json_content)
        
        print(f"Found {len(questions)} questions to answer")
        
        # Answer each question using Bedrock knowledge base
        responses = []
        for i, question in enumerate(questions, 1):
            print(f"Answering question {i}: {question[:50]}...")
            
            try:
                # Query Bedrock knowledge base with retry logic
                answer = query_knowledge_base_with_retry(kb_client, question)
                
                response_item = {
                    "question_id": i,
                    "question": question,
                    "answer": answer,
                    "status": "answered"
                }
            except Exception as e:
                print(f"Error answering question {i}: {str(e)}")
                response_item = {
                    "question_id": i,
                    "question": question,
                    "answer": "Unable to retrieve answer from knowledge base after retries",
                    "status": "error",
                    "error": str(e)
                }
            
            responses.append(response_item)
            
            # Add delay between questions to avoid throttling
            if i < len(questions):
                time.sleep(5)
        
        # Save completed responses to S3
        base_filename_for_s3 = file_key.split('/')[-1].replace('_questions.json', '')
        output_key = f'completed_responses/{base_filename_for_s3}_responses.json'
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=output_key,
            Body=json.dumps(responses, indent=2),
            ContentType='application/json'
        )
        
        print(f"Saved completed responses to: {output_key}")
        
        # Update status to completed - use the same filename format as initial status update
        update_processing_status(base_filename, 'questions_answered', 'completed')
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Answered {len(questions)} questions',
                'output_file': output_key
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        # Update status to error if we have the filename
        try:
            if 'file_key' in locals():
                json_filename = file_key.split('/')[-1]
                base_name = json_filename.replace('_questions.json', '')
                try:
                    s3_client.head_object(Bucket=bucket_name, Key=f'uploaded_rfp_requests/{base_name}.pdf')
                    base_filename = f'{base_name}.pdf'
                except:
                    base_filename = f'{base_name}.txt'
            else:
                base_filename = 'unknown'
            update_processing_status(base_filename, 'questions_answered', 'error', str(e))
        except:
            pass
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def query_knowledge_base_with_retry(kb_client, question, max_retries=5):
    """Query Bedrock knowledge base with exponential backoff retry logic"""
    
    import os
    
    # Get Knowledge Base ID from environment variable
    knowledge_base_id = os.environ.get('KNOWLEDGE_BASE_ID')
    if not knowledge_base_id:
        error_msg = "Knowledge Base ID not configured! Please ensure KNOWLEDGE_BASE_ID environment variable is set."
        print(error_msg)
        raise ValueError(error_msg)
    
    for attempt in range(max_retries):
        try:
            response = kb_client.retrieve_and_generate(
                input={'text': question},
                retrieveAndGenerateConfiguration={
                    'type': 'KNOWLEDGE_BASE',
                    'knowledgeBaseConfiguration': {
                        'knowledgeBaseId': knowledge_base_id,
                        'modelArn': 'us.anthropic.claude-sonnet-4-20250514-v1:0'
                    }
                }
            )
            
            return response['output']['text']
            
        except Exception as e:
            if 'ThrottlingException' in str(e) and attempt < max_retries - 1:
                wait_time = (2 ** attempt) * 5  # Exponential backoff: 10, 20, 40, 80 seconds
                print(f"Throttled on attempt {attempt + 1}, waiting {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                print(f"Error querying knowledge base: {str(e)}")
                raise e

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