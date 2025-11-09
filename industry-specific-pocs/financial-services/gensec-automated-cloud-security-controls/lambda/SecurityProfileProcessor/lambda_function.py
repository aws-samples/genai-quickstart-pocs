import json
import boto3
import os
import logging
from botocore.exceptions import ClientError

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
sfn_client = boto3.client('stepfunctions')

# Environment variables
STATE_MACHINE_ARN = os.environ['STATE_MACHINE_ARN']

def lambda_handler(event, context):
    """
    Enhanced Lambda handler with better error handling
    """
    try:
        # Process S3 event
        bucket_name, file_key = parse_s3_event(event)
        logger.info(f"Processing file: {file_key} from bucket: {bucket_name}")
        
        try:
            # Read and validate the uploaded file
            file_content = read_s3_file(bucket_name, file_key)
            
            # Process content
            file_type, data = process_file_content(file_content, file_key)
            
            # Check for required files
            if file_type == 'security_profile':
                security_profile = data
                service_request = check_for_service_request(bucket_name)
                logger.info('Security profile loaded')
            elif file_type == 'service_request':
                service_request = data
                security_profile = check_for_security_profile(bucket_name)
                logger.info('Service request loaded')
                
            # Trigger Step Functions if both files exist
            if security_profile and service_request:
                trigger_step_functions(security_profile, service_request)
                logger.info("Successfully triggered Step Functions execution")
            else:
                logger.info("Waiting for the other file to be uploaded")
            
            return {
                'statusCode': 200,
                'body': json.dumps('Processing completed successfully')
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {str(e)}")
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Invalid JSON format',
                    'details': str(e)
                })
            }
            
    except Exception as e:
        logger.error(f"Error in lambda execution: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'details': str(e)
            })
        }

def parse_s3_event(event):
    """
    Parse the S3 event to extract bucket name and file key.
    """
    try:
        logger.info(f"Parsing S3 event: {json.dumps(event)}")
        
        if not event.get('Records'):
            logger.error("No Records found in event")
            raise ValueError("Invalid S3 event structure")
            
        record = event['Records'][0]
        
        if not record.get('s3'):
            logger.error("No s3 data found in record")
            raise ValueError("Invalid S3 event structure")
            
        bucket_name = record['s3']['bucket']['name']
        file_key = record['s3']['object']['key']
        
        logger.info(f"Successfully parsed S3 event - Bucket: {bucket_name}, Key: {file_key}")
        
        return bucket_name, file_key
        
    except KeyError as e:
        logger.error(f"Error parsing S3 event: {str(e)}")
        raise ValueError("Invalid S3 event structure")
    except Exception as e:
        logger.error(f"Unexpected error parsing S3 event: {str(e)}")
        raise

def check_for_security_profile(bucket):
    """
    Check if a security profile file exists in the bucket.
    """
    try:
        response = s3_client.list_objects_v2(
            Bucket=bucket,
            Prefix='security-profile/'
        )
        for obj in response.get('Contents', []):
            if obj['Key'].endswith('.json'):
                return read_s3_file(bucket, obj['Key'])
    except ClientError as e:
        logger.error(f"Error checking for security profile: {str(e)}")
    return None

def check_for_service_request(bucket):
    """
    Check if a service request file exists in the bucket.
    """
    try:
        response = s3_client.list_objects_v2(
            Bucket=bucket,
            Prefix='service-request/'
        )
        for obj in response.get('Contents', []):
            if obj['Key'].endswith('.json'):
                return read_s3_file(bucket, obj['Key'])
    except ClientError as e:
        logger.error(f"Error checking for service request: {str(e)}")
    return None

def trigger_step_functions(security_profile, service_request):
    """
    Trigger the Step Functions state machine with the combined input.
    """
    input_data = {
        'securityProfile': security_profile,
        'serviceRequest': service_request
    }
    
    try:
        response = sfn_client.start_execution(
            stateMachineArn=STATE_MACHINE_ARN,
            input=json.dumps(input_data)
        )
        logger.info(f"Step Functions execution started: {response['executionArn']}")
    except ClientError as e:
        logger.error(f"Error starting Step Functions execution: {str(e)}")
        raise

def clean_json_content(content):
    """
    Clean and validate JSON content
    """
    try:
        # Remove BOM if present
        if content.startswith('\ufeff'):
            content = content.replace('\ufeff', '')
            
        # Remove any leading/trailing whitespace
        content = content.strip()
        
        # Handle potential comments (if any)
        lines = content.split('\n')
        cleaned_lines = []
        
        for line in lines:
            # Remove inline comments
            if '//' in line:
                line = line.split('//')[0]
            # Remove whitespace
            line = line.strip()
            # Skip empty lines
            if line:
                cleaned_lines.append(line)
                
        content = '\n'.join(cleaned_lines)
        
        # Ensure content starts with { and ends with }
        if not (content.startswith('{') and content.endswith('}')):
            raise ValueError("Invalid JSON structure")
            
        # Remove trailing commas
        content = content.replace(',}', '}')
        content = content.replace(',\n}', '\n}')
        
        return content
        
    except Exception as e:
        logger.error(f"Error cleaning JSON content: {str(e)}")
        raise

def read_s3_file(bucket, key):
    """
    Enhanced S3 file reading with content validation
    """
    try:
        # Get the object from S3
        response = s3_client.get_object(Bucket=bucket, Key=key)
        file_content = response['Body'].read().decode('utf-8')
        
        # Log the first part of the content for debugging
        logger.debug(f"Raw file content (first 500 chars): {file_content[:500]}")
        
        # Clean the content
        cleaned_content = clean_json_content(file_content)
        
        try:
            # Parse the JSON content
            parsed_content = json.loads(cleaned_content)
            return parsed_content
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {str(e)}")
            logger.error(f"Error location - Line: {e.lineno}, Column: {e.colno}, Char: {e.pos}")
            logger.error(f"Problematic content around error: {cleaned_content[max(0, e.pos-50):min(len(cleaned_content), e.pos+50)]}")
            raise
            
    except ClientError as e:
        logger.error(f"Error reading from S3: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error reading file: {str(e)}")
        raise

def validate_file_content(content, file_type):
    """
    Validate the structure of the file content
    """
    try:
        if not isinstance(content, dict):
            raise ValueError(f"Invalid content structure for {file_type}")
            
        if file_type == 'security_profile':
            required_fields = [
                'profile_id',
                'security_requirements',
                'compliance_requirements'
            ]
        elif file_type == 'service_request':
            required_fields = [
                'requestId',
                'serviceId',
                'services'
            ]
        else:
            raise ValueError(f"Unknown file type: {file_type}")
            
        missing_fields = [field for field in required_fields if field not in content]
        if missing_fields:
            raise ValueError(f"Missing required fields in {file_type}: {missing_fields}")
            
        return True
        
    except Exception as e:
        logger.error(f"Validation error: {str(e)}")
        return False

def process_file_content(content, file_key):
    """
    Enhanced file content processing with validation
    """
    try:
        # Determine file type
        if 'security-profile' in file_key:
            file_type = 'security_profile'
        elif 'service-request' in file_key:
            file_type = 'service_request'
        else:
            raise ValueError(f"Unknown file type: {file_key}")
            
        # Validate content
        if not validate_file_content(content, file_type):
            raise ValueError(f"Invalid {file_type} content structure")
            
        logger.info(f"Successfully processed {file_type} content")
        return file_type, content
        
    except Exception as e:
        logger.error(f"Error processing file content: {str(e)}")
        raise
