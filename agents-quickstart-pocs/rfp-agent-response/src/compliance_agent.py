import boto3
import json
import time
from urllib.parse import unquote_plus
from datetime import datetime

def lambda_handler(event, context):
    """Lambda function triggered when JSON files are added to completed_responses folder"""
    
    s3_client = boto3.client('s3')
    bedrock = boto3.client('bedrock-runtime')
    
    try:
        # Get S3 event details
        record = event['Records'][0]
        bucket_name = record['s3']['bucket']['name']
        file_key = unquote_plus(record['s3']['object']['key'])
        
        print(f"Processing compliance review for: {file_key} from bucket: {bucket_name}")
        
        # Extract filename for status tracking - preserve original extension
        json_filename = file_key.split('/')[-1]  # e.g., "document_responses.json"
        base_name = json_filename.replace('_responses.json', '')  # e.g., "document"
        
        # Determine original file extension by checking if PDF exists in S3
        try:
            # Try PDF first
            s3_client.head_object(Bucket=bucket_name, Key=f'uploaded_rfp_requests/{base_name}.pdf')
            base_filename = f'{base_name}.pdf'
        except:
            # Fallback to txt
            base_filename = f'{base_name}.txt'
        
        update_processing_status(base_filename, 'compliance_reviewed', 'processing')
        
        # Download JSON file content from S3
        response = s3_client.get_object(Bucket=bucket_name, Key=file_key)
        json_content = response['Body'].read().decode('utf-8')
        responses = json.loads(json_content)
        
        print(f"Found {len(responses)} responses to review for compliance")
        
        # Review each response for PII and privileged data
        reviewed_responses = []
        for i, response_item in enumerate(responses, 1):
            print(f"Reviewing response {i} for compliance...")
            
            try:
                # Review answer for PII and privileged data with retry logic
                compliance_review = review_for_compliance_with_retry(bedrock, response_item['answer'])
                
                reviewed_item = {
                    **response_item,  # Keep original fields
                    "compliance_review": compliance_review,
                    "compliance_status": "reviewed"
                }
            except Exception as e:
                print(f"Error reviewing response {i}: {str(e)}")
                reviewed_item = {
                    **response_item,
                    "compliance_review": {
                        "has_pii": "unknown",
                        "has_privileged_data": "unknown",
                        "issues_found": [],
                        "recommendation": "Manual review required due to error"
                    },
                    "compliance_status": "error",
                    "compliance_error": str(e)
                }
            
            reviewed_responses.append(reviewed_item)
            
            # Add delay between reviews to avoid throttling
            if i < len(responses):
                time.sleep(5)
        
        # Save compliance-reviewed responses to S3
        base_filename_for_s3 = file_key.split('/')[-1].replace('_responses.json', '')
        output_key = f'compliance_reviewed/{base_filename_for_s3}_compliance_reviewed.json'
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=output_key,
            Body=json.dumps(reviewed_responses, indent=2),
            ContentType='application/json'
        )
        
        print(f"Saved compliance-reviewed responses to: {output_key}")
        
        # Update status to completed - use the same filename format as initial status update
        update_processing_status(base_filename, 'compliance_reviewed', 'completed')
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Compliance reviewed {len(responses)} responses',
                'output_file': output_key
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        # Update status to error if we have the filename
        try:
            if 'file_key' in locals():
                json_filename = file_key.split('/')[-1]
                base_name = json_filename.replace('_responses.json', '')
                try:
                    s3_client.head_object(Bucket=bucket_name, Key=f'uploaded_rfp_requests/{base_name}.pdf')
                    base_filename = f'{base_name}.pdf'
                except:
                    base_filename = f'{base_name}.txt'
            else:
                base_filename = 'unknown'
            update_processing_status(base_filename, 'compliance_reviewed', 'error', str(e))
        except:
            pass
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def review_for_compliance_with_retry(bedrock, answer_text, max_retries=5):
    """Review answer text for PII and privileged data with exponential backoff retry logic"""
    for attempt in range(max_retries):
        try:
            prompt = f"""Review the following text for PII (Personally Identifiable Information) and privileged/confidential data that should not be shared with third parties. 

Text to review:
{answer_text}

Analyze for:
1. PII (names, addresses, phone numbers, email addresses, SSNs, etc.)
2. Privileged data (internal processes, confidential business information, proprietary details)
3. Financial data that should be restricted
4. Any other sensitive information

Return your analysis in JSON format:
{{
  "has_pii": "yes/no",
  "has_privileged_data": "yes/no", 
  "issues_found": ["list of specific issues found"],
  "recommendation": "approve/redact/reject with explanation"
}}"""

            body = json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 2000,
                "messages": [{"role": "user", "content": prompt}]
            })
            
            response = bedrock.invoke_model(
                modelId='us.anthropic.claude-sonnet-4-20250514-v1:0',
                body=body
            )
            
            response_body = json.loads(response['body'].read())
            content = response_body['content'][0]['text'].strip()
            
            print(f"Bedrock response content: {content[:200]}...")  # Log first 200 chars
            
            if not content:
                raise Exception("Empty response from Bedrock")
            
            # Try to extract JSON from the response
            try:
                # Look for JSON content between ```json and ``` or just parse directly
                if '```json' in content:
                    json_start = content.find('```json') + 7
                    json_end = content.find('```', json_start)
                    json_content = content[json_start:json_end].strip()
                elif '{' in content and '}' in content:
                    # Find the JSON object in the response
                    json_start = content.find('{')
                    json_end = content.rfind('}') + 1
                    json_content = content[json_start:json_end]
                else:
                    json_content = content
                
                compliance_result = json.loads(json_content)
                return compliance_result
                
            except json.JSONDecodeError as json_error:
                print(f"JSON parsing error: {json_error}")
                print(f"Content that failed to parse: {content}")
                # Return a fallback result
                return {
                    "has_pii": "unknown",
                    "has_privileged_data": "unknown",
                    "issues_found": ["Unable to parse compliance review response"],
                    "recommendation": "manual review required - parsing error"
                }
            
        except Exception as e:
            if 'ThrottlingException' in str(e) and attempt < max_retries - 1:
                wait_time = (2 ** attempt) * 5  # Exponential backoff: 10, 20, 40, 80 seconds
                print(f"Throttled on attempt {attempt + 1}, waiting {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                print(f"Error with Bedrock compliance review: {str(e)}")
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