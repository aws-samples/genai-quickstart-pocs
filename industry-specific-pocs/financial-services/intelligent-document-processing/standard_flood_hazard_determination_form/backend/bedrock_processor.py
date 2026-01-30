"""
Backend module for Amazon Bedrock Data Automation processing.
Handles AWS API calls and business logic separate from Streamlit frontend.

This module follows the contributing standards from the sample repository
while reusing the same logic as extract_sfhdf_fields.py for consistency.
"""

import boto3
import os
import time
import json
import sys
from typing import Optional, Dict, Any
from botocore.exceptions import ClientError, NoCredentialsError
from dotenv import load_dotenv
from urllib.parse import urlparse

# Load environment variables from .env file in same directory ONLY
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if os.path.exists(env_path):
    load_dotenv(env_path, override=True)  # Override any existing env vars
    print(f"✅ Loaded environment from: {env_path}")
else:
    print(f"Create .env file at: {env_path}")
    print("Please read howto.md for setup instructions")
    # Don't raise error - let the app handle missing .env gracefully

class BedrockProcessor:
    """Handles Amazon Bedrock Data Automation processing operations.
    
    This class follows the contributing standards while reusing the same logic
    as extract_sfhdf_fields.py for consistency and maintainability.
    """
    
    def __init__(self):
        """Initialize AWS clients and configuration."""
        # AWS Configuration - same as extract_sfhdf_fields.py
        self.aws_region = os.environ.get("AWS_REGION")
        self.s3_bucket = os.environ.get("S3_BUCKET")
        self.project_name = os.environ.get("PROJECT_NAME")
        
        # Initialize AWS clients - same as extract_sfhdf_fields.py
        self.bda_client = boto3.client('bedrock-data-automation', region_name=self.aws_region)
        self.bda_runtime_client = boto3.client('bedrock-data-automation-runtime', region_name=self.aws_region)
        self.s3_client = boto3.client('s3', region_name=self.aws_region)
        
        # Get account ID and construct profile ARN - same as extract_sfhdf_fields.py
        sts_client = boto3.client('sts')
        account_id = sts_client.get_caller_identity()['Account']
        self.bda_profile_arn = f'arn:aws:bedrock:{self.aws_region}:{account_id}:data-automation-profile/us.data-automation-v1'
    
    def validate_config(self) -> None:
        """Validate required configuration - same logic as extract_sfhdf_fields.py."""
        if not self.s3_bucket:
            raise ValueError("S3_BUCKET environment variable is required")
        if not self.aws_region:
            raise ValueError("AWS_REGION environment variable is required")
    
    def find_project_arn_by_name(self, project_name: str) -> Optional[str]:
        """Find project ARN by name - same logic as extract_sfhdf_fields.py."""
        try:
            response = self.bda_client.list_data_automation_projects()
            for project in response['projects']:
                if project['projectName'] == project_name:
                    return project['projectArn']
            return None
        except Exception as e:
            print(f"Error finding project '{project_name}': {e}")
            return None
    
    def get_project_arn(self) -> Optional[str]:
        """Get project ARN - same logic as extract_sfhdf_fields.py."""
        return self.find_project_arn_by_name(self.project_name)
    
    def validate_configuration(self) -> bool:
        """Validate configuration - same logic as extract_sfhdf_fields.py."""
        if not self.s3_bucket:
            print("S3_BUCKET is required")
            return False
        
        project_arn = self.find_project_arn_by_name(self.project_name)
        if not project_arn:
            print(f"Project '{self.project_name}' not found")
            return False
        
        return True
    
    def setup_blueprint_and_project(self) -> bool:
        """Setup blueprint and project if they don't exist - same logic as app.py."""
        try:
            print("🔧 Setting up blueprint and project...")
            
            # Check if blueprint creation script exists
            script_path = os.path.join(os.path.dirname(__file__), '..', 'create_comprehensive_sfhdf_blueprint.py')
            
            if not os.path.exists(script_path):
                print(f"❌ Blueprint creation script not found: {script_path}")
                return False
            
            print(f"📜 Running blueprint creation script: {script_path}")
            
            # Run the blueprint creation script - same logic as app.py
            import subprocess  # nosec B404 - subprocess needed for system commands
            result = subprocess.run([  # nosec B603 - subprocess needed for system commands
                sys.executable, script_path
            ], capture_output=True, text=True, cwd=os.path.dirname(script_path))
            
            if result.returncode == 0:
                print("✅ Blueprint creation script completed successfully")
                print(f"📤 Script output: {result.stdout}")
                
                # Wait a moment for AWS to propagate changes
                import time
                time.sleep(5)
                
                # Verify setup was successful
                project_arn = self.get_project_arn()
                
                if project_arn:
                    print(f"✅ Verification successful:")
                    print(f"   Project ARN: {project_arn}")
                    return True
                else:
                    print("❌ Verification failed - project not found after setup")
                    return False
            else:
                print(f"❌ Blueprint creation script failed:")
                print(f"   Return code: {result.returncode}")
                print(f"   Error output: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Error setting up blueprint and project: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def upload_file_to_s3(self, file_path: str, bucket: str, key: str) -> bool:
        """Upload file to S3 - same logic as extract_sfhdf_fields.py."""
        try:
            print(f"Uploading {file_path} to S3...")
            self.s3_client.upload_file(file_path, bucket, key)
            print("Upload successful")
            return True
        except Exception as e:
            print(f"Upload failed: {e}")
            return False
    
    def parse_s3_uri(self, s3_uri: str) -> tuple:
        """Parse S3 URI to get bucket and key - same logic as extract_sfhdf_fields.py."""
        parsed_uri = urlparse(s3_uri)
        return parsed_uri.netloc, parsed_uri.path.lstrip('/')
    
    def invoke_data_automation_async(self, project_arn: str, s3_input_uri: str, s3_output_prefix: str) -> Optional[str]:
        """Invoke BDA job asynchronously - same logic as extract_sfhdf_fields.py."""
        try:
            response = self.bda_runtime_client.invoke_data_automation_async(
                inputConfiguration={'s3Uri': s3_input_uri},
                outputConfiguration={'s3Uri': f"s3://{self.s3_bucket}/{s3_output_prefix}"},
                dataAutomationConfiguration={
                    'dataAutomationProjectArn': project_arn,
                    'stage': 'LIVE'
                },
                dataAutomationProfileArn=self.bda_profile_arn
            )
            return response['invocationArn']
        except Exception as e:
            print(f"Failed to invoke BDA job: {e}")
            return None
    
    def wait_for_job_to_complete(self, invocation_arn: str, progress_bar=None, status_text=None) -> Optional[Dict[str, Any]]:
        """Wait for BDA job to complete with status updates - same logic as extract_sfhdf_fields.py."""
        print("Waiting for job completion...")
        max_iterations = 24  # Changed to 24 iterations as requested
        
        for i in range(max_iterations):
            try:
                response = self.bda_runtime_client.get_data_automation_status(invocationArn=invocation_arn)
                status = response['status']
                
                # Update progress bar and status text - start from 0% and progress through iterations
                if progress_bar:
                    # Progress from 0% to 90% over 24 iterations
                    progress_value = (i + 1) * 0.9 / max_iterations
                    progress_bar.progress(progress_value)
                if status_text:
                    status_text.text(f"🔄 Job Status: {status} ({i+1}/{max_iterations})")
                
                print(f"Status: {status} (iteration {i+1}/{max_iterations})")
                
                if status in ['Success', 'ServiceError', 'ClientError']:
                    print(f"Job completed: {status}")
                    if progress_bar:
                        progress_bar.progress(0.95)
                    if status_text:
                        status_text.text(f"✅ Job completed: {status}")
                    return response
                elif status == 'InProgress':
                    print("Job still running...")
                    # 5 second sleep between status checks
                    time.sleep(5)  # Changed to 5 seconds as requested
                    # Force UI update every few iterations
                    if i % 3 == 0:
                        import streamlit as st
                        st.empty()  # Force UI refresh
                else:
                    print(f"Unknown status: {status}")
                    time.sleep(5)  # Changed to 5 seconds as requested
            except Exception as e:
                print(f"Error checking status: {e}")
                return None
        
        print("Job timed out")
        if status_text:
            status_text.text("❌ Job timed out")
        return None
    
    def get_data_automation_results(self, project_arn: str, job_id: str) -> Optional[Dict[str, Any]]:
        """Get data automation results - same logic as extract_sfhdf_fields.py."""
        try:
            # Get account ID for ARN construction
            sts_client = boto3.client('sts')
            account_id = sts_client.get_caller_identity()['Account']
            
            status_response = self.bda_runtime_client.get_data_automation_status(
                invocationArn=f"arn:aws:bedrock:{self.aws_region}:{account_id}:data-automation-invocation/{job_id}"
            )
            output_uri = status_response['outputConfiguration']['s3Uri']
            bucket, key = self.parse_s3_uri(output_uri)
            result_obj = self.s3_client.get_object(Bucket=bucket, Key=key)
            metadata_content = result_obj['Body'].read().decode('utf-8')
            print(f"Downloaded metadata content length: {len(metadata_content)}")
            if not metadata_content.strip():
                raise ValueError("Empty metadata content from S3")
            metadata = json.loads(metadata_content)
            
            custom_output_path = metadata['output_metadata'][0]['segment_metadata'][0]['custom_output_path']
            print(f"Found custom output path: {custom_output_path}")
            custom_bucket, custom_key = self.parse_s3_uri(custom_output_path)
            custom_result_obj = self.s3_client.get_object(Bucket=custom_bucket, Key=custom_key)
            custom_content = custom_result_obj['Body'].read().decode('utf-8')
            print(f"Downloaded custom content length: {len(custom_content)}")
            return json.loads(custom_content)
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON results: {e}")
            print("This usually means the BDA job output is empty or malformed")
            raise
        except Exception as e:
            print(f"Error getting results: {e}")
            raise
    
    def process_document(self, file_path: str) -> Optional[Dict[str, Any]]:
        """Process document - same logic as extract_sfhdf_fields.py."""
        print("SFHDF Field Extraction")
        print("="*30)
        
        # Upload file to S3
        s3_key = f"sfhdf/uploaded/{os.path.basename(file_path)}"
        if not self.upload_file_to_s3(file_path, self.s3_bucket, s3_key):
            return None
        
        # Get project ARN
        project_arn = self.find_project_arn_by_name(self.project_name)
        if not project_arn:
            print(f"Project '{self.project_name}' not found")
            return None
        
        # Process document
        s3_input_uri = f"s3://{self.s3_bucket}/{s3_key}"
        s3_output_prefix = f"sfhdf/output/sfhdf-extraction-{int(time.time())}"
        
        invocation_arn = self.invoke_data_automation_async(project_arn, s3_input_uri, s3_output_prefix)
        if not invocation_arn:
            return None
        
        # Wait for completion
        status_response = self.wait_for_job_to_complete(invocation_arn)
        if not status_response:
            return None
        
        # Get results
        job_id = invocation_arn.split('/')[-1]
        try:
            results = self.get_data_automation_results(project_arn, job_id)
            
            # Handle different result structures
            if 'inference_result' in results:
                extracted_data = results['inference_result']
            elif 'matched_blueprint' in results:
                extracted_data = results['matched_blueprint']
            else:
                # Use the entire results if no specific structure found
                extracted_data = results
            
            if not extracted_data:
                raise ValueError("No extracted data found in results")
            
            return extracted_data
        except Exception as e:
            print(f"Failed to get results: {e}")
            raise
    
    def process_document_with_status(self, file_path: str, progress_bar=None, status_text=None) -> Optional[Dict[str, Any]]:
        """Process document with status updates for Streamlit UI - same logic as extract_sfhdf_fields.py."""
        print("SFHDF Field Extraction")
        print("="*30)
        
        # Upload file to S3
        s3_key = f"sfhdf/uploaded/{os.path.basename(file_path)}"
        if status_text:
            status_text.text("🔄 Uploading file to S3...")
        if progress_bar:
            progress_bar.progress(0.1)
        
        if not self.upload_file_to_s3(file_path, self.s3_bucket, s3_key):
            if status_text:
                status_text.text("❌ Failed to upload file to S3")
            return None
        
        # Get project ARN
        if status_text:
            status_text.text("🔍 Getting project information...")
        if progress_bar:
            progress_bar.progress(0.2)
        
        project_arn = self.find_project_arn_by_name(self.project_name)
        if not project_arn:
            if status_text:
                status_text.text("❌ Project not found")
            print(f"Project '{self.project_name}' not found")
            return None
        
        # Process document
        s3_input_uri = f"s3://{self.s3_bucket}/{s3_key}"
        s3_output_prefix = f"sfhdf/output/sfhdf-extraction-{int(time.time())}"
        
        if status_text:
            status_text.text("🚀 Starting document processing...")
        if progress_bar:
            progress_bar.progress(0.3)
        
        invocation_arn = self.invoke_data_automation_async(project_arn, s3_input_uri, s3_output_prefix)
        if not invocation_arn:
            if status_text:
                status_text.text("❌ Failed to start processing")
            return None
        
        # Wait for completion with status updates
        if status_text:
            status_text.text("⏳ Processing document...")
        if progress_bar:
            progress_bar.progress(0.4)
        
        status_response = self.wait_for_job_to_complete(invocation_arn, progress_bar, status_text)
        if not status_response:
            return None
        
        # Get results - same logic as extract_sfhdf_fields.py
        if status_text:
            status_text.text("📥 Retrieving results...")
        if progress_bar:
            progress_bar.progress(0.95)
        
        job_id = invocation_arn.split('/')[-1]
        try:
            results = self.get_data_automation_results(project_arn, job_id)
            
            if status_text:
                status_text.text("✅ Processing completed!")
            if progress_bar:
                progress_bar.progress(1.0)
            
            # Same logic as extract_sfhdf_fields.py - extract inference_result
            extracted_data = results['inference_result']
            
            # Return both extracted data and full results for confidence
            return {
                'inference_result': extracted_data,
                'explainability_info': results.get('explainability_info', [{}])
            }
            
        except Exception as e:
            print(f"Failed to get results: {e}")
            import traceback
            traceback.print_exc()
            if status_text:
                status_text.text("❌ Failed to retrieve results")
            raise 