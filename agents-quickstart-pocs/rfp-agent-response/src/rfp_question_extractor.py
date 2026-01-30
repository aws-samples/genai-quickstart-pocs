import boto3
import json
from urllib.parse import unquote_plus
from datetime import datetime
import PyPDF2
import io

def lambda_handler(event, context):
    """Lambda function to process RFP files and extract questions to JSON"""
    
    print(f"Lambda invoked with event: {json.dumps(event)}")
    
    # Test PyPDF2 import
    try:
        print(f"PyPDF2 version: {PyPDF2.__version__}")
    except Exception as e:
        print(f"PyPDF2 import issue: {str(e)}")
    
    s3_client = boto3.client('s3')
    bedrock = boto3.client('bedrock-runtime')
    
    try:
        # Get S3 event details
        record = event['Records'][0]
        bucket_name = record['s3']['bucket']['name']
        file_key = unquote_plus(record['s3']['object']['key'])
        
        print(f"Processing file: {file_key} from bucket: {bucket_name}")
        
        # Extract filename for status tracking
        base_filename = file_key.split('/')[-1]
        print(f"Base filename: {base_filename}")
        
        # Check if this is a PDF file
        is_pdf = file_key.lower().endswith('.pdf')
        print(f"Is PDF file: {is_pdf}")
        
        update_processing_status(base_filename, 'questions_extracted', 'processing')
        
        # Download and process file content from S3
        print("Downloading file from S3...")
        response = s3_client.get_object(Bucket=bucket_name, Key=file_key)
        file_content = response['Body'].read()
        print(f"Downloaded {len(file_content)} bytes")
        
        # Extract text based on file type
        if file_key.lower().endswith('.pdf'):
            print("Processing as PDF file...")
            content = extract_text_from_pdf(file_content)
            print(f"Extracted {len(content)} characters from PDF")
        else:
            print("Processing as text file...")
            # Assume text file
            content = file_content.decode('utf-8')
            print(f"Read {len(content)} characters from text file")
        
        # Extract questions using Bedrock
        print("Calling Bedrock to extract questions...")
        questions = extract_questions_with_bedrock(bedrock, content)
        print(f"Bedrock returned {len(questions) if questions else 0} questions")
        
        if not questions:
            print("No questions found")
            return {'statusCode': 200, 'body': 'No questions found'}
        
        # Save as JSON to S3 in formatted_questions folder
        # Extract just the filename from the full path (remove uploaded_rfp_requests/ prefix)
        base_filename = file_key.split('/')[-1]  # Get just the filename
        # Remove file extension and add _questions.json
        name_without_ext = base_filename.rsplit('.', 1)[0] if '.' in base_filename else base_filename
        output_filename = f"{name_without_ext}_questions.json"
        json_key = f'formatted_questions/{output_filename}'
        s3_client.put_object(
            Bucket=bucket_name,
            Key=json_key,
            Body=json.dumps(questions, indent=2),
            ContentType='application/json'
        )
        
        print(f"Created JSON with {len(questions)} questions: {json_key}")
        
        # Update status to completed
        update_processing_status(base_filename, 'questions_extracted', 'completed')
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Processed {len(questions)} questions',
                'json_file': json_key
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        # Update status to error if we have the filename
        try:
            base_filename = file_key.split('/')[-1] if 'file_key' in locals() else 'unknown'
            update_processing_status(base_filename, 'questions_extracted', 'error', str(e))
        except:
            pass
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def extract_text_from_pdf(pdf_content):
    """Extract text content from PDF bytes"""
    try:
        print("Creating PDF reader...")
        pdf_file = io.BytesIO(pdf_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        print(f"PDF has {len(pdf_reader.pages)} pages")
        
        text_content = ""
        for i, page in enumerate(pdf_reader.pages):
            print(f"Processing page {i+1}...")
            page_text = page.extract_text()
            text_content += page_text + "\n"
            print(f"Page {i+1} extracted {len(page_text)} characters")
        
        final_text = text_content.strip()
        print(f"Total extracted text length: {len(final_text)}")
        
        if len(final_text) == 0:
            raise Exception("No text could be extracted from PDF")
            
        return final_text
    except Exception as e:
        print(f"Error extracting text from PDF: {str(e)}")
        print(f"PDF content type: {type(pdf_content)}")
        print(f"PDF content length: {len(pdf_content) if pdf_content else 0}")
        raise Exception(f"Failed to extract text from PDF: {str(e)}")

def extract_questions_with_bedrock(bedrock, text_content):
    """Use Bedrock to extract questions from RFP text"""
    try:
        prompt = f"""Extract all questions and requirements from this RFP document that vendors need to respond to. Convert requirement statements into questions. For example:
- "The system must provide X" becomes "What X capabilities does your system provide?"
- "Vendors must demonstrate Y" becomes "How do you demonstrate Y?"
- "Describe your approach to Z" stays as "Describe your approach to Z"

Return only a JSON array of questions, with each question as a separate string. Focus on technical requirements, functional requirements, implementation details, pricing, experience, and any other areas where vendor responses are needed.

RFP Content:
{text_content}

Return format: ["Question 1?", "Question 2?", ...]"""

        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4000,
            "messages": [{"role": "user", "content": prompt}]
        })
        
        response = bedrock.invoke_model(
            modelId='us.anthropic.claude-sonnet-4-20250514-v1:0',
            body=body
        )
        
        response_body = json.loads(response['body'].read())
        content = response_body['content'][0]['text']
        
        # Handle JSON wrapped in markdown code blocks
        if '```json' in content:
            # Extract JSON from markdown code block
            json_start = content.find('```json') + 7
            json_end = content.find('```', json_start)
            json_content = content[json_start:json_end].strip()
        elif content.strip().startswith('[') and content.strip().endswith(']'):
            # Direct JSON array
            json_content = content.strip()
        else:
            # Try to find JSON array in the content
            import re
            json_match = re.search(r'\[.*\]', content, re.DOTALL)
            if json_match:
                json_content = json_match.group(0)
            else:
                json_content = content.strip()
        
        # Parse JSON response
        questions = json.loads(json_content)
        return questions
        
    except Exception as e:
        print(f"Error with Bedrock: {str(e)}")
        return []

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

