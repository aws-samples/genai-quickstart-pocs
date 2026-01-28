"""
GenerateIaCTemplate Lambda Function
Generates Infrastructure as Code templates based on security controls
"""
import json
import boto3
import os
import logging
import re
import yaml
from datetime import datetime
from bedrock_client import get_bedrock_client
from dynamodb_operations import (
    get_service_parameters_from_dynamodb,
    get_configurations_from_dynamodb
)
from s3_operations import store_output_in_s3
from validation import validate_input

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variables
CONTROL_LIBRARY_TABLE = os.environ['DYNAMODB_TABLE_CONTROL_LIBRARY']
SERVICE_PARAMETERS_TABLE = os.environ.get('DYNAMODB_TABLE_SERVICE_PARAMETERS', 'gensec-AWSServiceParameters')

# Initialize Bedrock client
bedrock_client = get_bedrock_client('claude-4')

def generate_iac_template(input_data):
    """Generate IaC templates with parameter validation"""
    try:
        # Validate input
        if not validate_input(input_data):
            raise ValueError("Invalid input data")
            
        # Extract service documentation
        service_documentation = input_data.get('serviceDocumentation', {})
        if not isinstance(service_documentation, dict):
            raise ValueError("Invalid service documentation format")
        
        # Get service_id for DynamoDB queries
        service_id = input_data.get('serviceId')
        if not service_id:
            raise ValueError("serviceId is required")
        
        # Normalize service_id to lowercase for DynamoDB queries
        service_id_normalized = service_id.lower()
        logger.info(f"Processing service_id: {service_id} (normalized: {service_id_normalized})")
        
        # Query DynamoDB for validated parameters
        validated_parameters = get_service_parameters_from_dynamodb(service_id_normalized, SERVICE_PARAMETERS_TABLE)
        
        if not validated_parameters:
            logger.warning("No valid parameters found in service documentation")
        
        # Get configurations
        configurations = get_configurations_from_dynamodb(
            input_data.get('requestId'),
            service_id_normalized,
            CONTROL_LIBRARY_TABLE
        )
        
        if not configurations:
            raise ValueError("No configurations found in DynamoDB")
        
        generated_templates = []
        
        for service_name, configs in configurations.items():
            logger.info(f"Generating IAC Template for service name ({service_name}, configs ({configs}))")
            # Create enhanced prompt with parameter validation
            prompt = create_iac_prompt_with_validation(
                service_name, 
                configs,
                validated_parameters
            )
            
            # Generate templates
            response = bedrock_client.invoke(prompt)
            if not response:
                logger.warning(f"No response from Bedrock for service: {service_name}")
                continue
                
            # Extract and validate templates
            templates = extract_template_content(response)
            if not templates:
                logger.warning(f"No valid templates extracted for service: {service_name}")
                continue
                
            # Process templates for both string and dictionary formats
            logger.info(f"Processing templates - type: {type(templates)}")
            
            for template_type in ['terraform', 'cloudformation']:
                template_code = None
                template_data = None
                
                logger.info(f"Processing template_type: {template_type}")

                if isinstance(templates, dict) and template_type in templates:
                    logger.info(f"Found {template_type} in templates dict")
                    template_obj = templates[template_type]
                    
                    if isinstance(template_obj, dict) and 'code' in template_obj:
                        logger.info(f"Found {template_type} with code structure")
                        template_code = template_obj['code']
                        template_data = template_obj
                    else:
                        logger.info(f"Using {template_type} object directly as code")
                        template_code = template_obj
                        template_data = template_obj
                else:
                    logger.info(f"No {template_type} found in templates")
                
                logger.info(f"template code ({template_code}), template data ({template_data})")

                # Validate and store if template found
                if template_code and template_data:
                    is_valid, invalid_params = validate_iac_parameters(
                        template_code,
                        validated_parameters,
                        service_name
                    )
                    
                    if is_valid:
                        try:
                            # Use normalized service_id for S3 paths
                            output_key = store_output_in_s3(
                                f'{service_id_normalized}/iac-templates/{template_type}',
                                template_data,
                                os.environ['S3_OUTPUT_BUCKET']
                            )
                            
                            generated_templates.append({
                                "type": template_type.capitalize(),
                                "service": service_name,
                                "location": output_key
                            })
                        except Exception as s3_error:
                            logger.error(f"Failed to store {template_type} template in S3: {str(s3_error)}")
                            raise Exception(f"S3 storage failed for {template_type} template: {str(s3_error)}")
                    else:
                        logger.error(f"Invalid parameters in {template_type} template for {service_name}: {invalid_params}")
                        raise Exception(f"Template validation failed for {template_type}: Invalid parameters {invalid_params}")
                else:
                    logger.error(f"Failed to extract {template_type} template for {service_name}")
                    
        if not generated_templates:
            raise Exception("No valid templates were generated - all templates failed validation or extraction")
            
        return {
            'statusCode': 200,
            'message': f"Generated {len(generated_templates)} validated templates",
            'templates': generated_templates
        }
        
    except ValueError as ve:
        logger.error(f"Validation error: {str(ve)}")
        raise ve  # Re-raise to fail Step Functions execution
    except Exception as e:
        logger.error(f"Error generating IaC templates: {str(e)}")
        raise e  # Re-raise to fail Step Functions execution

def create_iac_prompt_with_validation(service_name, configurations, validated_parameters):
    """Create IaC prompt with parameter validation"""
    try:
        # Format valid parameters for prompt
        valid_params_text = "\n".join([
            f"- {param['parameter_name']}: {param['description']} (Type: {param['type']})"
            for param in validated_parameters
        ])
        
        prompt = f"""Generate Infrastructure as Code templates for {service_name}.
        Use ONLY these validated parameters:
        {valid_params_text}
        
        Service: {service_name}
        Configurations: {json.dumps(configurations, indent=2)}
        
        CRITICAL INSTRUCTIONS:
        - Return ONLY the JSON object below
        - Do NOT include markdown formatting (no ```json or ```)
        - Do NOT include any explanatory text before or after
        - Use \\n for line breaks in code strings
        - Ensure all quotes are properly escaped
        
        Important:
        1. Use ONLY the validated parameters listed above
        2. Do NOT include any parameters not in the list
        3. Ensure all parameter types match the documented types
        4. Include proper error handling for parameters

        {{
            "terraform": {{
                "filename": "template.tf",
                "code": "Complete Terraform template"
            }},
            "cloudformation": {{
                "filename": "template.yaml",
                "code": "Complete CloudFormation template"
            }}
        }}

        Return the JSON object starting with {{ and ending with }}. Nothing else."""
        # 5. Provide ONLY the requested content. Do NOT include any introductory text like "Here are the..." or trailing summaries. Start directly with the content.
        return {"prompt": prompt}
        
    except Exception as e:
        logger.error(f"Error creating IaC prompt: {str(e)}")
        raise e

def extract_template_content(response_body):
    """
    Enhanced response content extraction with multiple strategies
    """
    try:
        logger.info("Attempting to extract template content")
        logger.debug(f'response_body type: {type(response_body)}')

        # If response_body is a string, try to parse as JSON
        if isinstance(response_body, str):
            logger.info("Response is string, attempting JSON parse")
            logger.info(f"First 500 chars of response: {response_body[:500]}")
            try:
                parsed_json = json.loads(response_body)
                logger.info(f'parsed json: {parsed_json}')
                if isinstance(parsed_json, dict) and all(k in parsed_json for k in ['terraform', 'cloudformation']):
                    logger.info("Successfully parsed JSON templates from string")
                    return parsed_json
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse JSON from string: {e}")
                logger.warning(f"Error at position {e.pos}: '{response_body[max(0, e.pos-10):e.pos+10]}'")
                # Try to fix malformed JSON structure using safer string manipulation
                try:
                    import ast
                    # Replace the malformed JSON structure with proper Python dict syntax
                    fixed_response = response_body.replace('": "', '": """').replace('"\n    }', '"""\n    }').replace('"\n}', '"""\n}')
                    # Use ast.literal_eval for safer evaluation of Python literals
                    parsed_dict = ast.literal_eval(fixed_response)  # nosec B307 - using ast.literal_eval instead of eval
                    if isinstance(parsed_dict, dict) and all(k in parsed_dict for k in ['terraform', 'cloudformation']):
                        logger.info("Successfully parsed using ast.literal_eval with triple quotes")
                        return parsed_dict
                except Exception as e2:
                    logger.warning(f"Failed to parse with ast.literal_eval: {e2}")
                    # Last resort: try manual JSON repair
                    try:
                        # Simple JSON repair for common issues
                        repaired = response_body.replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
                        parsed_dict = json.loads(repaired)
                        return parsed_dict
                    except Exception as e3:
                        logger.warning(f"Failed to repair JSON: {e3}")
                return None

        # If response_body is dict, check for Bedrock response format
        elif isinstance(response_body, dict):
            # Check for content[0].text format (Bedrock response)
            if 'content' in response_body:
                content = response_body['content']
                if isinstance(content, list) and len(content) > 0:
                    first_content = content[0]
                    if isinstance(first_content, dict) and 'text' in first_content:
                        text_content = first_content['text']
                        logger.info(f"Found text content, parsing as JSON (length: {len(text_content)})")
                        try:
                            parsed_json = json.loads(text_content)
                            if isinstance(parsed_json, dict) and all(k in parsed_json for k in ['terraform', 'cloudformation']):
                                logger.info("Successfully parsed JSON templates from Bedrock response")
                                return parsed_json
                        except json.JSONDecodeError as e:
                            logger.warning(f"Failed to parse JSON from text content: {e}")
            
            # Check if it's already a template dict
            elif all(k in response_body for k in ['terraform', 'cloudformation']):
                logger.info("Response is already template dict")
                return response_body

        logger.warning("No valid templates found in response")
        return None

    except Exception as e:
        logger.error(f"Error extracting template content: {str(e)}")
        return None

def validate_iac_parameters(template_content, valid_parameters, service_name):
    """Validate IaC template parameters against AWS service documentation"""
    try:
        logger.info(f"Validating IaC parameters for {service_name}")
        
        # Create set of valid parameter names for quick lookup
        valid_param_set = {param['parameter_name'] for param in valid_parameters}
        
        # Extract parameters from template
        if isinstance(template_content, str):
            # For Terraform
            if '.tf' in template_content:
                params = re.findall(r'variable\s+"([^"]+)"', template_content)
                # For Terraform, normalize both sets by removing underscores and converting to lowercase
                normalized_valid_params = {p.replace('_', '').lower() for p in valid_param_set}
                invalid_params = [p for p in params if p.replace('_', '').lower() not in normalized_valid_params]
            # For CloudFormation
            else:
                try:
                    template_dict = yaml.safe_load(template_content)
                    params = list(template_dict.get('Parameters', {}).keys())
                    # For CloudFormation, use exact matching
                    invalid_params = [p for p in params if p not in valid_param_set]
                except:
                    params = []
                    invalid_params = []
        else:
            params = []
            invalid_params = []
            
        # Check parameters
        if invalid_params:
            logger.warning(f"Invalid parameters found in template: {invalid_params}")
            return False, invalid_params
            
        return True, []
        
    except Exception as e:
        logger.error(f"Error validating IaC parameters: {str(e)}")
        return False, []

def validate_input(input_data):
    """Validate the input parameters"""
    try:
        if not input_data or not isinstance(input_data, dict):
            return False
        required_fields = ['requestId', 'serviceId']
        return all(input_data.get(field) for field in required_fields)
    except Exception as e:
        logger.error(f"Error validating input: {str(e)}")
        return False

def lambda_handler(event, context):
    """Lambda handler for generating IaC templates"""
    try:
        logger.info("Starting GenerateIaCTemplate Lambda")
        
        result = generate_iac_template(event)
        
        logger.info("Successfully completed IaC template generation")
        return result
        
    except Exception as e:
        logger.error(f"Error in GenerateIaCTemplate: {str(e)}")
        raise
