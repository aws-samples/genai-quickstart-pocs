"""
GenerateServiceProfile Lambda Function
Generates service profiles using validated AWS service documentation
"""
import json
import boto3
import os
import logging
from datetime import datetime
from bedrock_client import get_bedrock_client
from dynamodb_operations import (
    get_service_actions_from_dynamodb,
    get_service_parameters_from_dynamodb
)
from s3_operations import store_output_in_s3
from validation import validate_input
from json_processing import extract_json_from_content, convert_json_to_markdown

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variables
SERVICE_ACTIONS_TABLE = os.environ.get('DYNAMODB_TABLE_SERVICE_ACTIONS', 'gensec-AWSServiceActions')
SERVICE_PARAMETERS_TABLE = os.environ.get('DYNAMODB_TABLE_SERVICE_PARAMETERS', 'gensec-AWSServiceParameters')
OUTPUT_BUCKET = os.environ.get('S3_OUTPUT_BUCKET', os.environ.get('S3_DOCUMENTATION_BUCKET'))

# Initialize Bedrock client
bedrock_client = get_bedrock_client('claude-4')

# Initialize S3 client
s3_client = boto3.client('s3')

def generate_service_profile(input_data):
    """Generate service profile using validated AWS service documentation"""
    try:
        logger.info("Starting service profile generation with validation")
        
        # Extract required input data
        service_id = input_data.get('serviceId')
        if not service_id:
            raise ValueError("serviceId is required in input")
            
        # Query DynamoDB for validated parameters and actions
        validated_parameters = get_service_parameters_from_dynamodb(service_id, SERVICE_PARAMETERS_TABLE)
        validated_actions = get_service_actions_from_dynamodb(service_id, SERVICE_ACTIONS_TABLE)
        
        if not validated_parameters and not validated_actions:
            raise ValueError("No validated service documentation found")
            
        # Create validation sets for quick lookup
        valid_param_details = {
            param['parameter_name']: {
                'description': param['description'],
                'type': param['type']
            } for param in validated_parameters
        }
        
        valid_action_details = {
            action['action_name']: {
                'description': action['description'],
                'accessLevel': action['accessLevel']
            } for action in validated_actions
        }
        
        # Map service ID to full name
        service_name = get_service_full_name(service_id)
        logger.info(f"Generating validated profile for service: {service_name}")
        
        # Create enhanced prompt with validated information
        prompt = create_service_profile_prompt_with_validation(
            service_name,
            validated_parameters,
            validated_actions
        )
        
        # Generate profile using Bedrock
        logger.info("Calling Bedrock with validated service information")
        response = bedrock_client.invoke(prompt)
        
        if not response:
            raise ValueError("Failed to generate service profile")
            
        # Parse and validate the profile
        profile_json = extract_json_from_content(response)
        if not profile_json:
            raise ValueError("Failed to extract valid JSON from response")
            
        # Validate generated profile against service documentation
        validated_profile = validate_service_profile_content(
            profile_json,
            valid_param_details,
            valid_action_details
        )
        
        if not validated_profile:
            raise ValueError("Failed to validate service profile content")
            
        # Generate markdown with validated content
        markdown_content = convert_json_to_markdown(validated_profile, f"{service_name} Service Profile")
        
        # Store validated outputs
        store_validated_profile_outputs(service_id, validated_profile, markdown_content)
        
        return {
            "statusCode": 200,
            "body": {
                "serviceId": service_id,
                "serviceName": service_name,
                "outputs": {
                    "json": f"{service_id}/service-profiles/profile.json",
                    "markdown": f"{service_id}/service-profiles/profile.md"
                },
                "validation": {
                    "parameters_validated": len(validated_parameters),
                    "actions_validated": len(validated_actions),
                    "validation_timestamp": datetime.utcnow().isoformat()
                }
            }
        }
        
    except ValueError as ve:
        logger.error(f"Validation error: {str(ve)}")
        raise ve  # Re-raise to fail Step Functions execution
    except Exception as e:
        logger.error(f"Error generating service profile: {str(e)}")
        raise e  # Re-raise to fail Step Functions execution

def create_service_profile_prompt_with_validation(service_name, validated_parameters, validated_actions):
    """Create enhanced prompt with validated service information"""
    try:
        # Format validated parameters and actions
        param_capabilities = "\n".join([
            f"- {param['parameter_name']}: {param['description']} (Type: {param['type']})"
            for param in validated_parameters
        ])
        
        action_capabilities = "\n".join([
            f"- {action['action_name']}: {action['description']} (Level: {action['accessLevel']})"
            for action in validated_actions
        ])
        # 5. Provide ONLY the requested content. Do NOT include any introductory text like "Here are the..." or trailing summaries. Start directly with the content.
        return {
            "prompt": f"""Generate a comprehensive service profile for AWS {service_name} based on these validated capabilities:

            Validated Parameters:
            {param_capabilities}

            Validated Actions:
            {action_capabilities}

            CRITICAL INSTRUCTIONS:
            - Return ONLY the JSON object below
            - Do NOT include markdown formatting (no ```json or ```)
            - Do NOT include any explanatory text before or after
            - Use \\n for line breaks in code strings
            - Ensure all quotes are properly escaped

            IMPORTANT:
            1. Base the profile ONLY on these validated capabilities
            2. Do NOT include capabilities not supported by the parameters/actions
            3. Ensure all features mentioned are backed by documented parameters or actions
            4. Be precise about supported functionality

            {{
                "serviceName": "{service_name}",
                "serviceDescription": {{
                    "overview": "description based on validated capabilities",
                    "serviceType": "type of service",
                    "documentation": "AWS documentation link"
                }},
                "dataProtection": {{
                    "dataHandling": {{
                        "processesCustomerData": true/false,
                        "storesCustomerData": true/false,
                        "explanation": "based on validated parameters"
                    }},
                    "encryption": {{
                        "atRest": {{
                            "supported": true/false,
                            "methods": ["only validated encryption methods"],
                            "details": "based on validated parameters"
                        }},
                        "inTransit": {{
                            "supported": true/false,
                            "methods": ["only validated protocols"],
                            "details": "based on validated parameters"
                        }}
                    }}
                }},
                "networkControls": {{
                    "endpoints": ["only validated endpoints"],
                    "vpcSupport": true/false,
                    "publicExposure": {{
                        "required": true/false,
                        "details": "based on validated configuration options"
                    }}
                }},
                "accessControls": {{
                    "iamSupport": {{
                        "serviceRoles": ["only validated roles"],
                        "managedPolicies": ["only validated policies"]
                    }},
                    "bestPractices": ["based on validated parameters and actions"]
                }},
                "isolationControls": ["only validated isolation features"],
                "managementOps": {{
                    "logging": {{
                        "cloudwatchSupport": true/false,
                        "cloudtrailSupport": true/false,
                        "details": "based on validated logging capabilities"
                    }},
                    "monitoring": {{
                        "metrics": ["only validated metrics"],
                        "details": "based on validated monitoring capabilities"
                    }}
                }},
                "compliance": {{
                    "certifications": ["relevant certifications"],
                    "details": "compliance details based on validated features"
                }}
            }}

            Return the JSON object starting with {{ and ending with }}. Nothing else."""
        }
    except Exception as e:
        logger.error(f"Error creating service profile prompt: {str(e)}")
        raise e

def validate_service_profile_content(profile, valid_param_details, valid_action_details):
    """Validate service profile content against documented capabilities"""
    try:
        if not isinstance(profile, dict):
            logger.error("Invalid profile structure")
            return None
            
        # Validate encryption capabilities
        encryption = profile.get('dataProtection', {}).get('encryption', {})
        if encryption:
            # Validate encryption parameters
            encryption_params = [p for p in valid_param_details.keys() 
                              if 'encrypt' in p.lower() or 'kms' in p.lower()]
            encryption['atRest']['supported'] = bool(encryption_params)
            
        # Validate network capabilities
        network = profile.get('networkControls', {})
        if network:
            # Validate VPC support
            vpc_params = [p for p in valid_param_details.keys() 
                        if 'vpc' in p.lower()]
            network['vpcSupport'] = bool(vpc_params)
            
        # Validate IAM capabilities
        access_controls = profile.get('accessControls', {}).get('iamSupport', {})
        if access_controls:
            # Get IAM-related actions
            iam_actions = [a for a in valid_action_details.keys() 
                         if any(role in a.lower() for role in ['role', 'policy', 'permission'])]
            access_controls['serviceRoles'] = list(set(
                role for action in iam_actions 
                for role in extract_roles_from_action(action)
            ))
            
        # Validate logging capabilities
        logging = profile.get('managementOps', {}).get('logging', {})
        if logging:
            # Check CloudWatch/CloudTrail parameters
            logging['cloudwatchSupport'] = any('cloudwatch' in p.lower() 
                                             for p in valid_param_details.keys())
            logging['cloudtrailSupport'] = any('cloudtrail' in p.lower() 
                                             for p in valid_param_details.keys())
            
        # Add validation metadata
        profile['_metadata'] = {
            "validation_timestamp": datetime.utcnow().isoformat(),
            "validated_parameters": len(valid_param_details),
            "validated_actions": len(valid_action_details)
        }
        
        logger.info("Successfully validated service profile content")
        return profile
        
    except Exception as e:
        logger.error(f"Error validating service profile: {str(e)}")
        return None

def extract_roles_from_action(action_name):
    """Extract role names from IAM action names"""
    roles = []
    if 'role' in action_name.lower():
        role_parts = action_name.split(':')
        if len(role_parts) > 1:
            roles.append(role_parts[1])
    return roles

def store_validated_profile_outputs(service_id, profile_json, markdown_content):
    """Store validated service profile with metadata"""

    logger.debug(f'json: {profile_json}')
    logger.debug(f'markdown: {markdown_content}')

    try:
        # Add validation timestamp
        profile_json['_metadata']['storage_timestamp'] = datetime.utcnow().isoformat()
        
        # Store JSON version
        s3_client.put_object(
            Bucket=OUTPUT_BUCKET,
            Key=f"{service_id}/service-profiles/profile.json",
            Body=json.dumps(profile_json, indent=2),
            ContentType='application/json',
            Metadata={
                "validated": "true",
                "validation_date": profile_json['_metadata']['validation_timestamp']
            }
        )
        
        # Store markdown version
        s3_client.put_object(
            Bucket=OUTPUT_BUCKET,
            Key=f"{service_id}/service-profiles/profile.md",
            Body=markdown_content,
            ContentType='text/markdown'
        )
        
        logger.info(f"Stored validated service profile for service: {service_id}")
        
    except Exception as e:
        logger.error(f"Error storing validated profile outputs: {str(e)}")
        raise

def get_service_full_name(service_id):
    """Map service ID to full name"""
    service_names = {
        'sqs': 'Amazon Simple Queue Service',
        's3': 'Amazon Simple Storage Service',
        'ec2': 'Amazon Elastic Compute Cloud',
        'rds': 'Amazon Relational Database Service',
        'lambda': 'AWS Lambda',
        'dynamodb': 'Amazon DynamoDB'
    }
    return service_names.get(service_id, service_id.upper())

def lambda_handler(event, context):
    """Lambda handler for generating service profiles"""
    try:
        logger.info("Starting GenerateServiceProfile Lambda")
        
        result = generate_service_profile(event)
        
        logger.info("Successfully completed service profile generation")
        return result
        
    except Exception as e:
        logger.error(f"Error in GenerateServiceProfile: {str(e)}")
        raise
