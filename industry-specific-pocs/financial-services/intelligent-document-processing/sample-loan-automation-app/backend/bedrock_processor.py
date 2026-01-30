"""
AWS Bedrock Data Automation Processor for Loan Application Document Verification v3
Handles document processing using AWS Bedrock Data Automation (BDA)
"""

import boto3
import hashlib
import time
import os
from datetime import datetime
from typing import Optional, Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
from config import DOCUMENT_TYPES, S3_BUCKET, AWS_REGION, BLUEPRINTS


class BedrockProcessor:
    """Handles document processing using AWS Bedrock Data Automation"""
    
    def __init__(self, loan_id: str):
        """Initialize Bedrock processor with loan ID"""
        self.loan_id = loan_id
        self.aws_region = AWS_REGION
        self.s3_bucket = S3_BUCKET
        self.current_blueprint = None
        
        # Lazy-loaded AWS clients
        self._s3_client = None
        self._bda_client = None
        self._bda_admin = None
        self._sts_client = None
        self._data_project_arn = None
        self._account_id = None
    
    @property
    def s3_client(self):
        """Lazy-loaded S3 client"""
        if self._s3_client is None:
            self._s3_client = boto3.client('s3', region_name=self.aws_region)
        return self._s3_client
    
    @property
    def bda_client(self):
        """Lazy-loaded BDA runtime client"""
        if self._bda_client is None:
            self._bda_client = boto3.client('bedrock-data-automation-runtime', region_name=self.aws_region)
        return self._bda_client
    
    @property
    def bda_admin(self):
        """Lazy-loaded BDA admin client"""
        if self._bda_admin is None:
            try:
                self._bda_admin = boto3.client('bedrock-data-automation', region_name=self.aws_region)
            except Exception as e:
                raise RuntimeError(f"Failed to create BDA admin client: {str(e)}")
        return self._bda_admin
    
    @property
    def data_project_arn(self):
        """Lazy-loaded project ARN"""
        if self._data_project_arn is None:
            self._data_project_arn = self._get_project_arn()
        return self._data_project_arn
    
    @property
    def account_id(self):
        """Lazy-loaded account ID"""
        if self._account_id is None:
            # Try to extract from existing ARN first (more efficient)
            if hasattr(self, '_data_project_arn') and self._data_project_arn:
                self._account_id = self._data_project_arn.split(':')[4]
            else:
                # Fallback to STS call
                self._account_id = self.sts_client.get_caller_identity()['Account']
        return self._account_id
    
    @property
    def sts_client(self):
        """Lazy-loaded STS client"""
        if self._sts_client is None:
            try:
                self._sts_client = boto3.client('sts', region_name=self.aws_region)
            except Exception as e:
                raise RuntimeError(f"Failed to create STS client: {str(e)}")
        return self._sts_client
    
    def _create_project(self, project_name: str) -> str:
        """Create BDA project with public blueprints"""
        try:
            standard_output_configuration = {
                'document': {
                    'extraction': {
                        'granularity': {'types': ['DOCUMENT', 'PAGE']},
                        'boundingBox': {'state': 'DISABLED'}
                    },
                    'generativeField': {'state': 'DISABLED'},
                    'outputFormat': {
                        'textFormat': {'types': ['MARKDOWN']},
                        'additionalFileFormat': {'state': 'DISABLED'}
                    }
                }
            }
            
            custom_output_configuration = {
                'blueprints': [{'blueprintArn': arn} for arn in BLUEPRINTS.values()]
            }
            
            response = self.bda_admin.create_data_automation_project(
                projectName=project_name,
                projectDescription='Residential Loan Application processing project',
                projectStage='LIVE',
                standardOutputConfiguration=standard_output_configuration,
                customOutputConfiguration=custom_output_configuration
            )
            
            project_arn = response['projectArn']
            return project_arn
            
        except Exception as e:
            print(f"❌ Failed to create BDA project '{project_name}': {str(e)}")
            raise RuntimeError(f"BDA project creation failed: {str(e)}")
    
    def _get_project_arn(self) -> str:
        """Get or create BDA project ARN.
        
        Searches for existing project by name, creates new one if not found.
        
        Returns:
            str: BDA project ARN
            
        Raises:
            RuntimeError: If project lookup or creation fails
        """
        try:
            project_name = os.environ.get('PROJECT_NAME', 'residential-loan-app')
            
            response = self.bda_admin.list_data_automation_projects(projectStageFilter='LIVE')
            projects = response.get('projects', [])
            
            # Search for project by name
            for project in projects:
                current_project_name = project.get('projectName', '')
                if project_name in current_project_name:
                    project_arn = project['projectArn']
                    print(f"✅ Found matching project ARN: {project_arn}")
                    return project_arn
            
            # Project not found, create it
            return self._create_project(project_name)
                
        except Exception as e:
            print(f"❌ Failed to get BDA project ARN: {str(e)}")
            raise RuntimeError(f"BDA project lookup failed: {str(e)}")
    

    def upload_document_to_s3(self, file_object, doc_type: str) -> str:
        """Upload document to S3 and create loan_app entry"""
        import streamlit as st
        
        try:
            # 1. Generate unique name: IMG_0346_20241201_143022_123456.jpeg
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            name_parts = file_object.name.rsplit('.', 1)
            if len(name_parts) == 2:
                base_name, extension = name_parts
                unique_filename = f"{base_name}_{timestamp}.{extension}"
            else:
                unique_filename = f"{file_object.name}_{timestamp}"
            
            
            # 2. Upload to S3 using unique filename as key
            s3_key = f"{self.loan_id}/{doc_type}/{unique_filename}/input/{file_object.name}"
            file_object.seek(0)
            self.s3_client.upload_fileobj(file_object, self.s3_bucket, s3_key)
            
            
            # 3. Create entry in loan_app directly here
            # Access the central loan application data structure (see app.py for documentation)
            loan_app = st.session_state.loan_application
            loan_app['files'].append({
                'file_unique_name': unique_filename,
                'file_name': file_object.name,
                'doc_type': doc_type,
                'status': 'Uploaded to S3',
                'invocation_arn': None,
                's3_input_uri': f"s3://{self.s3_bucket}/{s3_key}",
                's3_output_uri': f"s3://{self.s3_bucket}/{self.loan_id}/{doc_type}/{unique_filename}/output",
                'processing_results': None,
                'extracted_data': None,
                'error_message': None
            })
            
            
            # 4. Return the unique filename
            return unique_filename
            
        except Exception as e:
            print(f"❌ Failed to upload document to S3: {str(e)}")
            raise RuntimeError(f"Document upload failed: {str(e)}")
    
    def invoke_extraction(self, file_data: dict) -> dict:
        """Invoke AWS Bedrock Data Automation for single file.
        
        Args:
            file_data: Dictionary containing:
                - file_unique_name: Unique filename identifier
                - s3_input_uri: S3 URI where file is stored
                - s3_output_uri: S3 URI where results should be written
        
        Returns:
            Dictionary containing:
                - file_unique_name: Original filename identifier
                - invocation_arn: AWS Bedrock invocation ARN (if successful)
                - status: 'Created' or 'Error'
                - error_message: Error details (if status is 'Error')
        """
        try:
            payload = {
                "inputConfiguration": {
                    "s3Uri": file_data['s3_input_uri']
                },
                "outputConfiguration": {
                    "s3Uri": file_data['s3_output_uri']
                },
                "dataAutomationConfiguration": {
                    "dataAutomationProjectArn": self.data_project_arn,
                },
                "dataAutomationProfileArn": f"arn:aws:bedrock:{self.aws_region}:{self.account_id}:data-automation-profile/us.data-automation-v1",
                "notificationConfiguration": {
                    "eventBridgeConfiguration": {"eventBridgeEnabled": False } # we don'r use event bridge for this POC but remcomanded for production applications
                }
            }
            
            response = self.bda_client.invoke_data_automation_async(**payload)
            invocation_arn = response['invocationArn']
            
            return {
                'file_unique_name': file_data['file_unique_name'],
                'invocation_arn': invocation_arn,
                'status': 'Created' if invocation_arn else 'Error',
                'error_message': None if invocation_arn else 'No invocation ARN returned from Bedrock'
            }
        except Exception as e:
            return {
                'file_unique_name': file_data['file_unique_name'],
                'invocation_arn': None,
                'status': 'Error',
                'error_message': str(e)
            }
    
    def invoke_extractions(self, files_data_list: list) -> list:
        """Invoke AWS Bedrock Data Automation asynchronously for multiple files in parallel.
        
        Args:
            files_data_list: List of file data dictionaries, each containing:
                - file_unique_name: Unique filename identifier
                - s3_input_uri: S3 URI where file is stored
                - s3_output_uri: S3 URI where results should be written
        
        Returns:
            List of result dictionaries in same order as input, each containing:
                - file_unique_name: Original filename identifier
                - invocation_arn: AWS Bedrock invocation ARN (if successful)
                - status: 'Created' or 'Error'
                - error_message: Error details (if status is 'Error')
        """
        # Use ThreadPoolExecutor for parallel invocations
        with ThreadPoolExecutor(max_workers=min(len(files_data_list), 5)) as executor:
            # Submit all invocation tasks with index to maintain order
            future_to_index = {executor.submit(self.invoke_extraction, file_data): i 
                             for i, file_data in enumerate(files_data_list)}
            
            # Collect results maintaining original order
            results = [None] * len(files_data_list)
            for future in as_completed(future_to_index):
                index = future_to_index[future]
                results[index] = future.result()
        
        return results
    
    def check_status(self, invocation_arn: str) -> dict:
        """Check status of AWS Bedrock Data Automation invocation.
        
        Args:
            invocation_arn: AWS Bedrock invocation ARN to check
        
        Returns:
            Dictionary containing AWS response with status information,
            or error dictionary with 'status', 'errorType', 'errorMessage' keys
        """
        try:
            response = self.bda_client.get_data_automation_status(invocationArn=invocation_arn)
            return response
        except Exception as e:
            return {
                'status': 'ClientError',
                'errorType': type(e).__name__,
                'errorMessage': str(e)
            }
    
    def check_statuses(self, invocation_arns_list: list) -> dict:
        """Check status of multiple AWS Bedrock invocations in parallel.
        
        Args:
            invocation_arns_list: List of AWS Bedrock invocation ARNs to check
        
        Returns:
            Dictionary mapping invocation ARN to status response dictionary
        """
        status_results = {}
        
        # Use ThreadPoolExecutor for parallel API calls
        with ThreadPoolExecutor(max_workers=min(len(invocation_arns_list), 10)) as executor:
            # Submit all status check tasks
            future_to_arn = {executor.submit(self.check_status, arn): arn 
                           for arn in invocation_arns_list}
            
            # Collect results as they complete
            for future in as_completed(future_to_arn):
                arn = future_to_arn[future]
                status_data = future.result()
                status_results[arn] = status_data
        
        return status_results
    
    def get_result(self, invocation_arn: str, output_uri: str) -> Optional[dict]:
        """Get result for single invocation - returns extracted_data"""
        original_output_s3_uri = output_uri
        try:
            # Use the original output URI with trailing slash
            uri_parts = original_output_s3_uri.split('//')[1].split('/', 1)
            bucket_name = uri_parts[0]
            prefix = uri_parts[1] + '/' if len(uri_parts) > 1 else '/'
            
            response = self.s3_client.list_objects_v2(Bucket=bucket_name, Prefix=prefix)
            
            for obj in response.get('Contents', []):
                if 'custom_output' in obj['Key'] and obj['Key'].endswith('result.json'):
                    file_content = self.s3_client.get_object(
                        Bucket=bucket_name, 
                        Key=obj['Key']
                    )['Body'].read().decode('utf-8')
                    
                    import json
                    json_content = json.loads(file_content)
                    
                    return {
                        "matched_blueprint": json_content.get("matched_blueprint"),
                        "document_class": json_content.get("document_class"),
                        "inference_result": json_content.get("inference_result"),
                        "explainability_info": json_content.get("explainability_info", {}),
                        "confidence": json_content.get("confidence", 95)
                    }
            return None
        except Exception as e:
            return None
