import boto3
import json
import time
import sys
import os
import argparse
from urllib.parse import urlparse
from botocore.exceptions import ClientError
from dotenv import load_dotenv

# Load environment variables from .env file in same directory
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)

# AWS Configuration
AWS_REGION = os.environ.get("AWS_REGION")
PROJECT_NAME = os.environ.get("PROJECT_NAME")
S3_BUCKET = os.environ.get("S3_BUCKET")

# Initialize AWS clients
bda_client = boto3.client('bedrock-data-automation', region_name=AWS_REGION)
bda_runtime_client = boto3.client('bedrock-data-automation-runtime', region_name=AWS_REGION)
s3_client = boto3.client('s3', region_name=AWS_REGION)

# Get account ID and construct profile ARN
sts_client = boto3.client('sts')
account_id = sts_client.get_caller_identity()['Account']
BDA_PROFILE_ARN = f'arn:aws:bedrock:{AWS_REGION}:{account_id}:data-automation-profile/us.data-automation-v1'

def find_project_arn_by_name(project_name):
    """Find project ARN by name"""
    try:
        response = bda_client.list_data_automation_projects()
        for project in response['projects']:
            if project['projectName'] == project_name:
                return project['projectArn']
        return None
    except Exception as e:
        print(f"Error finding project '{project_name}': {e}")
        return None



def upload_file_to_s3(local_file_path, s3_bucket, s3_key):
    """Upload a local file to S3"""
    try:
        print(f"Uploading {local_file_path} to S3...")
        s3_client.upload_file(local_file_path, s3_bucket, s3_key)
        print("Upload successful")
        return True
    except Exception as e:
        print(f"Upload failed: {e}")
        return False

def parse_s3_uri(s3_uri):
    """Parse S3 URI to get bucket and key"""
    parsed_uri = urlparse(s3_uri)
    return parsed_uri.netloc, parsed_uri.path.lstrip('/')

def invoke_data_automation_async(project_arn, s3_input_uri, s3_output_prefix):
    """Invoke BDA job asynchronously"""
    try:
        response = bda_runtime_client.invoke_data_automation_async(
            inputConfiguration={'s3Uri': s3_input_uri},
            outputConfiguration={'s3Uri': f"s3://{S3_BUCKET}/{s3_output_prefix}"},
            dataAutomationConfiguration={
                'dataAutomationProjectArn': project_arn,
                'stage': 'LIVE'
            },
            dataAutomationProfileArn=BDA_PROFILE_ARN
        )
        return response['invocationArn']
    except Exception as e:
        print(f"Failed to invoke BDA job: {e}")
        return None

def wait_for_job_to_complete(invocation_arn):
    """Wait for BDA job to complete"""
    print("Waiting for job completion...")
    max_iterations = 60
    
    for i in range(max_iterations):
        try:
            response = bda_runtime_client.get_data_automation_status(invocationArn=invocation_arn)
            status = response['status']
            
            print(f"Status: {status} (iteration {i+1}/{max_iterations})")
            
            if status in ['Success', 'ServiceError', 'ClientError']:
                print(f"Job completed: {status}")
                return response
            elif status == 'InProgress':
                print("Job still running...")
                time.sleep(10)
            else:
                print(f"Unknown status: {status}")
                time.sleep(10)
        except Exception as e:
            print(f"Error checking status: {e}")
            time.sleep(10)
    
    print("Job timeout")
    return None

def get_data_automation_results(project_arn, job_id):
    """Get results from completed BDA job"""
    try:
        # Get status to find output URI
        status_response = bda_runtime_client.get_data_automation_status(
            invocationArn=f"arn:aws:bedrock:{AWS_REGION}:{account_id}:data-automation-invocation/{job_id}"
        )
        
        # Download metadata from S3
        output_uri = status_response['outputConfiguration']['s3Uri']
        bucket, key = parse_s3_uri(output_uri)
        
        result_obj = s3_client.get_object(Bucket=bucket, Key=key)
        metadata_content = result_obj['Body'].read().decode('utf-8')
        metadata = json.loads(metadata_content)
        
        # Extract custom output path from metadata
        custom_output_path = metadata['output_metadata'][0]['segment_metadata'][0]['custom_output_path']
        
        # Download actual extracted data
        custom_bucket, custom_key = parse_s3_uri(custom_output_path)
        custom_result_obj = s3_client.get_object(Bucket=custom_bucket, Key=custom_key)
        custom_content = custom_result_obj['Body'].read().decode('utf-8')
        
        return json.loads(custom_content)
    except Exception as e:
        print(f"Error getting results: {e}")
        raise

def save_results_to_file(results, original_filename):
    """Save results to file"""
    base_name = os.path.splitext(os.path.basename(original_filename))[0]
    output_filename = f"sfhdf_results/{base_name}_extracted.json"
    
    os.makedirs('sfhdf_results', exist_ok=True)
    with open(output_filename, 'w') as f:
        json.dump(results, f, indent=2)
    
    return output_filename

def load_config():
    """Load field descriptions and sections from config file"""
    config_path = os.path.join(os.path.dirname(__file__), 'sfhdf_config.json')
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading config: {e}")
        return {"field_descriptions": {}, "sections": {}}

def display_results(extracted_data):
    """Display extracted results organized by sections"""
    config = load_config()
    field_descriptions = config.get('field_descriptions', {})
    sections = config.get('sections', {})
    
    print("\n" + "="*60)
    print("SFHDF EXTRACTION RESULTS")
    print("="*60)
    
    for section_name, fields in sections.items():
        print(f"\n📋 {section_name}:")
        for field in fields:
            value = extracted_data.get(field, '')
            description = field_descriptions.get(field, field)
            print(f"  {description}: {value}")



def extract_sfhdf_fields(local_file_path):
    """Extract fields from SFHDF document"""
    print("SFHDF Field Extraction")
    print("="*30)
    
    # Upload file to S3
    s3_key = f"sfhdf/uploaded/{os.path.basename(local_file_path)}"
    if not upload_file_to_s3(local_file_path, S3_BUCKET, s3_key):
        return None
    
    # Get project ARN
    project_arn = find_project_arn_by_name(PROJECT_NAME)
    if not project_arn:
        print(f"Project '{PROJECT_NAME}' not found")
        return None
    
    # Process document
    s3_input_uri = f"s3://{S3_BUCKET}/{s3_key}"
    s3_output_prefix = f"sfhdf/output/sfhdf-extraction-{int(time.time())}"
    
    invocation_arn = invoke_data_automation_async(project_arn, s3_input_uri, s3_output_prefix)
    if not invocation_arn:
        return None
    
    # Wait for completion
    status_response = wait_for_job_to_complete(invocation_arn)
    if not status_response:
        return None
    
    # Get results
    job_id = invocation_arn.split('/')[-1]
    try:
        results = get_data_automation_results(project_arn, job_id)
        
        # Save raw results directly
        output_file = save_results_to_file(results, local_file_path)
        print(f"Save raw results to: {output_file}")
        
        # Extract field values directly from inference_result
        extracted_data = results['inference_result']
        
        # Display results
        display_results(extracted_data)
        
        return extracted_data
    except Exception as e:
        print(f"Failed to get results: {e}")
        raise

def validate_configuration():
    """Validate configuration"""
    if not S3_BUCKET:
        print("S3_BUCKET is required")
        return False
    
    project_arn = find_project_arn_by_name(PROJECT_NAME)
    if not project_arn:
        print(f"Project '{PROJECT_NAME}' not found")
        return False
    
    return True

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Extract fields from SFHDF')
    parser.add_argument('--file', '-f', type=str, required=True, help='Path to SFHDF file')
    args = parser.parse_args()
    
    if not os.path.exists(args.file):
        print(f"File '{args.file}' not found")
        sys.exit(1)
    
    if not validate_configuration():
        sys.exit(1)
    
    result = extract_sfhdf_fields(args.file)
    
    if result:
        print("Field extraction completed successfully!")
    else:
        print("Field extraction failed!")
        sys.exit(1)

if __name__ == "__main__":
    main() 