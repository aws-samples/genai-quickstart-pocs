import boto3
from botocore.config import Config
import json
import time
from urllib.parse import unquote_plus
from datetime import datetime

def lambda_handler(event, context):
    """Lambda function triggered when JSON files are added to compliance_reviewed folder"""
    
    s3_client = boto3.client('s3')
    # Configure Bedrock client with longer timeout for large RFP responses
    bedrock = boto3.client(
        'bedrock-runtime',
        config=Config(
            read_timeout=300,  # 5 minutes
            connect_timeout=60,
            retries={'max_attempts': 3}
        )
    )
    
    try:
        # Get S3 event details
        record = event['Records'][0]
        bucket_name = record['s3']['bucket']['name']
        file_key = unquote_plus(record['s3']['object']['key'])
        
        print(f"Processing drafting for: {file_key} from bucket: {bucket_name}")
        
        # Extract filename for status tracking - preserve original extension
        json_filename = file_key.split('/')[-1]  # e.g., "document_compliance_reviewed.json"
        base_name = json_filename.replace('_compliance_reviewed.json', '')  # e.g., "document"
        
        # Determine original file extension by checking if PDF exists in S3
        try:
            # Try PDF first
            s3_client.head_object(Bucket=bucket_name, Key=f'uploaded_rfp_requests/{base_name}.pdf')
            base_filename = f'{base_name}.pdf'
        except:
            # Fallback to txt
            base_filename = f'{base_name}.txt'
        
        update_processing_status(base_filename, 'final_document', 'processing')
        
        # Download JSON file content from S3
        response = s3_client.get_object(Bucket=bucket_name, Key=file_key)
        json_content = response['Body'].read().decode('utf-8')
        compliance_reviewed_responses = json.loads(json_content)
        
        print(f"Found {len(compliance_reviewed_responses)} responses to draft professionally")
        
        # Create a comprehensive professional RFP response document
        try:
            professional_document = create_comprehensive_rfp_response_with_retry(
                bedrock, 
                compliance_reviewed_responses
            )
            
            # Generate individual drafted answers with compliance applied
            drafted_responses = generate_individual_drafted_responses_with_retry(
                bedrock,
                compliance_reviewed_responses
            )
            
            # Save as both text document and JSON for different use cases
            base_filename_for_s3 = file_key.split('/')[-1].replace('_compliance_reviewed.json', '')
            
            # Save client-ready text document
            text_output_key = f'final_responses/{base_filename_for_s3}_RFP_Response.txt'
            s3_client.put_object(
                Bucket=bucket_name,
                Key=text_output_key,
                Body=professional_document,
                ContentType='text/plain'
            )
            
            # Generate compliance reasoning summary
            compliance_reasoning = generate_compliance_reasoning_with_retry(
                bedrock,
                compliance_reviewed_responses
            )
            
            # Also save structured data for reference
            json_output_key = f'final_responses/{base_filename_for_s3}_final.json'
            structured_data = {
                "rfp_name": base_filename_for_s3,
                "total_questions": len(compliance_reviewed_responses),
                "document_content": professional_document,
                "compliance_reasoning": compliance_reasoning,
                "question_analysis": [
                    {
                        "question_id": item['question_id'],
                        "question": item['question'],
                        "original_answer": item['answer'],
                        "drafted_answer": drafted_responses.get(str(item['question_id']), item['answer']),
                        "compliance_status": item.get('compliance_review', {}).get('recommendation', 'approve'),
                        "has_pii": item.get('compliance_review', {}).get('has_pii', 'no'),
                        "has_privileged_data": item.get('compliance_review', {}).get('has_privileged_data', 'no'),
                        "issues_found": item.get('compliance_review', {}).get('issues_found', []),
                        "action_taken": get_action_description(item.get('compliance_review', {}).get('recommendation', 'approve'))
                    }
                    for item in compliance_reviewed_responses
                ],
                "processing_timestamp": context.aws_request_id,
                "status": "complete"
            }
            
            s3_client.put_object(
                Bucket=bucket_name,
                Key=json_output_key,
                Body=json.dumps(structured_data, indent=2),
                ContentType='application/json'
            )
            
            print(f"Saved client-ready document to: {text_output_key}")
            print(f"Saved structured data to: {json_output_key}")
            
            # Update status to completed - use the same filename format as initial status update
            update_processing_status(base_filename, 'final_document', 'completed')
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': f'Created comprehensive RFP response with {len(compliance_reviewed_responses)} questions',
                    'client_document': text_output_key,
                    'structured_data': json_output_key
                })
            }
            
        except Exception as e:
            print(f"Error creating comprehensive document: {str(e)}")
            # Fallback to error document
            base_filename_for_s3 = file_key.split('/')[-1].replace('_compliance_reviewed.json', '')
            error_output_key = f'final_responses/{base_filename_for_s3}_ERROR.txt'
            
            error_document = f"""RFP RESPONSE DOCUMENT - ERROR

We apologize, but there was an error generating the comprehensive RFP response.
Error: {str(e)}

Please contact our team for manual assistance with this RFP.
"""
            
            s3_client.put_object(
                Bucket=bucket_name,
                Key=error_output_key,
                Body=error_document,
                ContentType='text/plain'
            )
            
            # Update status to error - use the same filename format as initial status update
            update_processing_status(base_filename, 'final_document', 'error', str(e))
            
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'error': str(e),
                    'error_document': error_output_key
                })
            }
        

        
    except Exception as e:
        print(f"Error: {str(e)}")
        # Update status to error if we have the filename
        try:
            if 'file_key' in locals():
                json_filename = file_key.split('/')[-1]
                base_name = json_filename.replace('_compliance_reviewed.json', '')
                try:
                    s3_client.head_object(Bucket=bucket_name, Key=f'uploaded_rfp_requests/{base_name}.pdf')
                    base_filename = f'{base_name}.pdf'
                except:
                    base_filename = f'{base_name}.txt'
            else:
                base_filename = 'unknown'
            update_processing_status(base_filename, 'final_document', 'error', str(e))
        except:
            pass
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def get_action_description(recommendation):
    """Get human-readable description of compliance action taken"""
    actions = {
        'approve': 'Response approved and enhanced professionally',
        'redact': 'Sensitive information removed or generalized',
        'reject': 'Information withheld due to confidentiality requirements'
    }
    return actions.get(recommendation, 'Standard processing applied')

def generate_individual_drafted_responses_with_retry(bedrock, compliance_reviewed_responses, max_retries=5):
    """Generate individual drafted responses for each question with compliance applied"""
    drafted_responses = {}
    
    for item in compliance_reviewed_responses:
        question_id = str(item['question_id'])
        question = item['question']
        original_answer = item['answer']
        compliance_review = item.get('compliance_review', {})
        recommendation = compliance_review.get('recommendation', 'approve')
        issues_found = compliance_review.get('issues_found', [])
        
        print(f"Drafting individual response for question {question_id} with recommendation: {recommendation}")
        
        for attempt in range(max_retries):
            try:
                if recommendation == 'approve':
                    prompt = f"""Enhance this RFP response to be more professional and client-ready while keeping all the original information:

QUESTION: {question}
ORIGINAL ANSWER: {original_answer}

Make it more polished, professional, and suitable for a client-facing RFP response. Maintain all factual content but improve the language, structure, and presentation."""

                elif recommendation == 'redact':
                    issues_text = ', '.join(issues_found) if issues_found else 'sensitive information'
                    prompt = f"""Revise this RFP response by removing or generalizing sensitive information while maintaining a professional, helpful response:

QUESTION: {question}
ORIGINAL ANSWER: {original_answer}
ISSUES TO ADDRESS: {issues_text}

Create a professional response that addresses the question without including sensitive details. Generalize specific information where needed and maintain a helpful tone."""

                elif recommendation == 'reject':
                    prompt = f"""Create a polite, professional response explaining that this information cannot be shared due to confidentiality requirements:

QUESTION: {question}
ORIGINAL ANSWER: {original_answer}
ISSUES: {', '.join(issues_found) if issues_found else 'confidential information'}

Provide a courteous explanation of why this information cannot be disclosed while maintaining professionalism."""

                else:
                    # Fallback for unknown recommendations
                    prompt = f"""Create a professional RFP response for this question:

QUESTION: {question}
ORIGINAL ANSWER: {original_answer}

Make it professional and client-ready."""

                body = json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 1500,
                    "temperature": 0.3,
                    "messages": [{"role": "user", "content": prompt}]
                })
                
                response = bedrock.invoke_model(
                    modelId='us.anthropic.claude-sonnet-4-20250514-v1:0',
                    body=body
                )
                
                response_body = json.loads(response['body'].read())
                drafted_answer = response_body['content'][0]['text'].strip()
                
                if drafted_answer:
                    drafted_responses[question_id] = drafted_answer
                    break
                else:
                    raise Exception("Empty response from Bedrock")
                    
            except Exception as e:
                error_str = str(e)
                if ('ThrottlingException' in error_str or 'timeout' in error_str.lower() or 'ReadTimeoutError' in error_str) and attempt < max_retries - 1:
                    wait_time = (2 ** attempt) * 3
                    print(f"Retryable error drafting question {question_id} on attempt {attempt + 1}: {error_str[:100]}... waiting {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    print(f"Error drafting response for question {question_id}: {str(e)}")
                    # Fallback to original answer
                    drafted_responses[question_id] = original_answer
                    break
        
        # Small delay between questions to avoid throttling
        time.sleep(2)
    
    return drafted_responses

def generate_compliance_reasoning_with_retry(bedrock, compliance_reviewed_responses, max_retries=5):
    """Generate detailed reasoning about compliance decisions with retry logic"""
    for attempt in range(max_retries):
        try:
            # Prepare compliance summary for analysis
            compliance_summary = ""
            for item in compliance_reviewed_responses:
                compliance_review = item.get('compliance_review', {})
                compliance_summary += f"""\nQuestion {item['question_id']}: {item['question'][:100]}...
Recommendation: {compliance_review.get('recommendation', 'approve')}
PII Found: {compliance_review.get('has_pii', 'no')}
Privileged Data: {compliance_review.get('has_privileged_data', 'no')}
Issues: {', '.join(compliance_review.get('issues_found', []))}
---"""
            
            prompt = f"""Analyze the compliance decisions made for this RFP response and provide detailed reasoning about what was included, excluded, or modified.

COMPLIANCE REVIEW SUMMARY:
{compliance_summary}

Provide a comprehensive analysis explaining:
1. Overall compliance approach taken
2. What information was approved for inclusion and why
3. What information was redacted or generalized and the reasoning
4. What information was completely excluded and why
5. Risk mitigation strategies applied
6. Summary of how the final document balances transparency with data protection

Create a detailed compliance reasoning report:"""

            body = json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 3000,
                "messages": [{"role": "user", "content": prompt}]
            })
            
            response = bedrock.invoke_model(
                modelId='us.anthropic.claude-sonnet-4-20250514-v1:0',
                body=body
            )
            
            response_body = json.loads(response['body'].read())
            content = response_body['content'][0]['text'].strip()
            
            if not content:
                return "Unable to generate compliance reasoning due to empty response"
            
            return content
            
        except Exception as e:
            error_str = str(e)
            if ('ThrottlingException' in error_str or 'timeout' in error_str.lower() or 'ReadTimeoutError' in error_str) and attempt < max_retries - 1:
                wait_time = (2 ** attempt) * 5
                print(f"Retryable error generating compliance reasoning on attempt {attempt + 1}: {error_str[:100]}... waiting {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                print(f"Error generating compliance reasoning: {str(e)}")
                return f"Unable to generate compliance reasoning due to error: {str(e)}"

def create_comprehensive_rfp_response_with_retry(bedrock, compliance_reviewed_responses, max_retries=5):
    """Create comprehensive RFP response document with chunking for large RFPs"""
    
    # If RFP is very large (>50 questions), process in chunks
    if len(compliance_reviewed_responses) > 50:
        return create_chunked_rfp_response(bedrock, compliance_reviewed_responses, max_retries)
    
    return create_single_rfp_response(bedrock, compliance_reviewed_responses, max_retries)

def create_chunked_rfp_response(bedrock, compliance_reviewed_responses, max_retries=5):
    """Handle large RFPs by processing in chunks and combining"""
    chunk_size = 25  # Process 25 questions at a time
    chunks = [compliance_reviewed_responses[i:i + chunk_size] 
              for i in range(0, len(compliance_reviewed_responses), chunk_size)]
    
    print(f"Processing large RFP in {len(chunks)} chunks of up to {chunk_size} questions each")
    
    chunk_responses = []
    for i, chunk in enumerate(chunks):
        print(f"Processing chunk {i+1}/{len(chunks)} with {len(chunk)} questions")
        chunk_response = create_single_rfp_response(bedrock, chunk, max_retries, chunk_number=i+1)
        chunk_responses.append(chunk_response)
    
    # Combine all chunks into final document
    return combine_rfp_chunks(bedrock, chunk_responses, len(compliance_reviewed_responses), max_retries)

def combine_rfp_chunks(bedrock, chunk_responses, total_questions, max_retries=5):
    """Combine multiple RFP response chunks into a cohesive document"""
    for attempt in range(max_retries):
        try:
            combined_content = "\n\n".join(chunk_responses)
            
            prompt = f"""Combine these RFP response sections into a single, cohesive professional document. 
Remove any duplicate headers or introductions, ensure consistent formatting, and create smooth transitions between sections.

SECTIONS TO COMBINE:
{combined_content}

Create a single, well-formatted RFP response document with:
1. One professional header and introduction
2. All {total_questions} questions and responses in logical order
3. Consistent formatting throughout
4. One professional closing
5. Remove any section breaks or chunk indicators

Final combined RFP response document:"""

            body = json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 8000,
                "temperature": 0.3,
                "messages": [{"role": "user", "content": prompt}]
            })
            
            response = bedrock.invoke_model(
                modelId='us.anthropic.claude-sonnet-4-20250514-v1:0',
                body=body
            )
            
            response_body = json.loads(response['body'].read())
            content = response_body['content'][0]['text'].strip()
            
            if not content:
                raise Exception("Empty response from Bedrock when combining chunks")
            
            return content
            
        except Exception as e:
            error_str = str(e)
            if ('ThrottlingException' in error_str or 'timeout' in error_str.lower() or 'ReadTimeoutError' in error_str) and attempt < max_retries - 1:
                wait_time = (2 ** attempt) * 5
                print(f"Retryable error combining chunks on attempt {attempt + 1}: {error_str[:100]}... waiting {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                print(f"Error combining RFP chunks: {str(e)}")
                # Fallback: return chunks with basic formatting
                return f"""RFP RESPONSE DOCUMENT

This document contains responses to {total_questions} questions.

{chr(10).join(chunk_responses)}

Thank you for your consideration."""

def create_single_rfp_response(bedrock, compliance_reviewed_responses, max_retries=5, chunk_number=None):
    """Create RFP response document with exponential backoff retry logic"""
    chunk_info = f" (Chunk {chunk_number})" if chunk_number else ""
    print(f"Creating RFP response{chunk_info} for {len(compliance_reviewed_responses)} questions")
    
    for attempt in range(max_retries):
        try:
            # Prepare all questions and answers for comprehensive processing
            qa_content = ""
            for item in compliance_reviewed_responses:
                compliance_review = item.get('compliance_review', {})
                compliance_action = compliance_review.get('recommendation', 'approve')
                issues_found = compliance_review.get('issues_found', [])
                
                qa_content += f"""\n\nQUESTION {item['question_id']}: {item['question']}
ORIGINAL ANSWER: {item['answer']}
COMPLIANCE STATUS: {compliance_action}
ISSUES: {', '.join(issues_found) if issues_found else 'None'}
---"""
            
            prompt = f"""Create a comprehensive, professional RFP response document that is ready to send to a prospective client. This should be a complete, well-formatted document that addresses all questions professionally.

RFP QUESTIONS AND ANSWERS:
{qa_content}

INSTRUCTIONS:
1. Create a complete RFP response document with proper business formatting
2. Include a professional header and introduction
3. For each question, provide a polished, client-ready response
4. Follow compliance recommendations:
   - "approve": Enhance the response professionally
   - "redact": Remove or generalize sensitive information
   - "reject": Provide polite explanation that information cannot be shared
5. Use formal business language throughout
6. Structure with clear sections and numbering
7. Include a professional closing
8. Remove any internal references or confidential details
9. Make it ready for direct client delivery

Create a complete RFP response document:"""

            body = json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 8000,
                "temperature": 0.3,  # More consistent responses
                "messages": [{"role": "user", "content": prompt}]
            })
            
            response = bedrock.invoke_model(
                modelId='us.anthropic.claude-sonnet-4-20250514-v1:0',
                body=body
            )
            
            response_body = json.loads(response['body'].read())
            content = response_body['content'][0]['text'].strip()
            
            print(f"Bedrock comprehensive response: {content[:200]}...")  # Log first 200 chars
            
            if not content:
                raise Exception("Empty response from Bedrock")
            
            return content
            
        except Exception as e:
            error_str = str(e)
            if ('ThrottlingException' in error_str or 'timeout' in error_str.lower() or 'ReadTimeoutError' in error_str) and attempt < max_retries - 1:
                wait_time = (2 ** attempt) * 5  # Exponential backoff: 5, 10, 20, 40 seconds
                print(f"Retryable error on attempt {attempt + 1}: {error_str[:100]}... waiting {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                print(f"Error with Bedrock comprehensive drafting: {str(e)}")
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