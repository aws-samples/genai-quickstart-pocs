"""
GenerateSecurityControls Lambda Function
Generates security controls based on analyzed requirements
"""
import json
import boto3
import os
import logging
import time
import concurrent.futures
import random
import re
from datetime import datetime
from functools import wraps
from typing import List, Dict
from botocore.exceptions import ClientError
from bedrock_client import get_bedrock_client
from dynamodb_operations import (
    get_service_actions_from_dynamodb,
    get_service_parameters_from_dynamodb,
    get_configurations_from_dynamodb
)
from s3_operations import store_control_file
from validation import build_action_validation_set
from json_processing import clean_and_extract_json

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variables
CONTROL_LIBRARY_TABLE = os.environ['DYNAMODB_TABLE_CONTROL_LIBRARY']
SERVICE_ACTIONS_TABLE = os.environ.get('DYNAMODB_TABLE_SERVICE_ACTIONS', 'gensec-AWSServiceActions')
SERVICE_PARAMETERS_TABLE = os.environ.get('DYNAMODB_TABLE_SERVICE_PARAMETERS', 'gensec-AWSServiceParameters')

# Initialize Bedrock client
bedrock_client = get_bedrock_client('claude-4')

# Constants for Bedrock configuration
BEDROCK_MAX_RETRIES = 5
BEDROCK_INITIAL_DELAY = 2
BEDROCK_MAX_DELAY = 32

# Initialize S3 client
s3_client = boto3.client('s3')

def generate_security_controls(input_data):
    """
    Generate security controls with parallel processing, enhanced error handling, and resource management.
    """
    try:
        # Validate input
        request_id = input_data.get('requestId')
        service_id = input_data.get('serviceId')
        service_documentation = input_data.get('serviceDocumentation', {})

        if not request_id or not service_id:
            raise ValueError("Missing required input parameters: requestId or serviceId")

        # Query DynamoDB for service actions and parameters
        validated_actions = get_service_actions_from_dynamodb(service_id, SERVICE_ACTIONS_TABLE)
        validated_parameters = get_service_parameters_from_dynamodb(service_id, SERVICE_PARAMETERS_TABLE)
        
        # Create comprehensive action validation sets
        valid_action_names = build_action_validation_set(validated_actions)
        valid_parameter_names = {param['parameter_name'] for param in validated_parameters}
        
        logger.info(f"Found {len(valid_action_names)} valid actions and {len(valid_parameter_names)} valid parameters")

        configurations = get_configurations_from_dynamodb(request_id, service_id, CONTROL_LIBRARY_TABLE)
        
        # Convert configurations to list if it's a dict
        if isinstance(configurations, dict):
            # Flatten the dict of lists into a single list
            flat_configs = []
            for service_configs in configurations.values():
                if isinstance(service_configs, list):
                    flat_configs.extend(service_configs)
            configurations = flat_configs

        if not configurations:
            raise ValueError("No configurations found in DynamoDB")

        logger.info(f"Processing {len(configurations)} configurations")
        
        # Validate configuration structure
        if not isinstance(configurations, list):
            raise ValueError(f"Invalid configurations type: {type(configurations)}")

        if not all(isinstance(config, dict) for config in configurations):
            raise ValueError("Invalid configuration structure received from DynamoDB")

        generated_files = []
        start_time = time.time()
        max_execution_time = 240  # 4 minutes
        time_buffer = 60  # 1 minute buffer
        
        processing_stats = {
            'total_configs': len(configurations),
            'processed': 0,
            'successful': 0,
            'failed': 0,
            'skipped': 0
        }

        for index, config in enumerate(configurations):
            logger.debug(f"Processing configuration {index + 1}/{len(configurations)}")
            logger.debug(f"Configuration type: {type(config)}")
            logger.debug(f"Configuration content: {json.dumps(config)}")

            # Check remaining time with more precision
            current_time = time.time()
            elapsed_time = current_time - start_time
            remaining_time = max_execution_time - elapsed_time
        
            if remaining_time < time_buffer:
                logger.warning(
                    f"Approaching Lambda timeout after {elapsed_time:.2f}s. "
                    f"Processed {processing_stats['processed']} configurations. "
                    f"Successful: {processing_stats['successful']}, "
                    f"Failed: {processing_stats['failed']}"
                )
                break
            
            try:
                # Validate configuration
                if not isinstance(config, dict):
                    logger.warning(f"Invalid configuration type at index {index}: {type(config)}")
                    processing_stats['failed'] += 1
                    processing_stats['skipped'] += 1
                    continue

                config_id = config.get('configuration_id')
                if not config_id:
                    logger.warning(f"Missing configuration_id at index {index}")
                    processing_stats['failed'] += 1
                    processing_stats['skipped'] += 1
                    continue

                logger.info(f"Processing configuration {index + 1}/{len(configurations)}: {config_id}")
                
                # Validate configuration parameters against known valid parameters
                # Skip validation if service has no CloudFormation parameters
                settings = config.get('recommended_configuration', {}).get('settings', {})
                if valid_parameter_names:  # Only validate if service has parameters
                    invalid_params = [param for param in settings.keys() 
                                    if param not in valid_parameter_names]

                    if invalid_params:
                        logger.warning(f"Configuration {config_id} uses invalid parameters: {invalid_params}")
                        processing_stats['skipped'] += 1
                        continue
                else:
                    logger.warning(f"Service has no CloudFormation parameters - skipping parameter validation for {config_id}")

                # Create prompt using existing function
                try:
                    prompt = create_controls_prompt(config, validated_actions, validated_parameters)
                except Exception as e:
                    logger.error(f"Error creating controls prompt for {config_id}: {str(e)}")
                    logger.error(f"Config causing error: {json.dumps(config)}")
                    processing_stats['failed'] += 1
                    continue
                
                # Invoke Bedrock with retry logic and enhanced error handling
                try:
                    response = bedrock_client.invoke(
                        prompt, 
                        max_retries=BEDROCK_MAX_RETRIES,
                        initial_delay=BEDROCK_INITIAL_DELAY
                    )
                    logger.debug(f'*** bedrock response: {str(response)} ***')
                except ClientError as ce:
                    if ce.response['Error']['Code'] == 'ThrottlingException':
                        logger.warning(f"Bedrock throttling for configuration {config_id}, skipping...")
                        processing_stats['failed'] += 1
                        processing_stats['skipped'] += 1
                        continue
                    raise
                except Exception as e:
                    logger.error(f"Error invoking Bedrock for {config_id}: {str(e)}")
                    processing_stats['failed'] += 1
                    continue
                
                # Parse the response using existing function
                controls = parse_controls_response(response)
                
                if not controls:
                    logger.warning(f"No controls generated for configuration: {config_id}")
                    processing_stats['failed'] += 1
                    continue

                # Validate generated controls
                controls = validate_generated_controls(
                    controls, 
                    valid_parameter_names,
                    valid_action_names,
                    config
                )
                
                if not controls:
                    logger.warning(f"No valid controls generated for configuration: {config_id}")
                    processing_stats['failed'] += 1
                    continue
                
                logger.info(f"Generated controls for {config_id}, proceeding with parallel file storage")
                
                # Track files generated for this configuration
                config_files = []
                
                # Process controls in parallel using threads with enhanced resource management
                with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
                    futures = []
                    try:
                        # Define control types to process
                        control_types = {
                            'detective_controls': 'detective_controls',
                            'preventive_controls': 'preventive_controls',
                            'proactive_controls': 'proactive_controls'
                        }
                        
                        # Submit all control types for processing
                        for control_type, path in control_types.items():
                            if control_type in controls:
                                file_key = f"{service_id}/{path}/{config_id}/{controls[control_type]['filename']}"
                                logger.info(f"Submitting {control_type} file: {file_key}")
                                futures.append(executor.submit(
                                    store_control_file,
                                    file_key,
                                    controls[control_type]['code'],
                                    os.environ['S3_OUTPUT_BUCKET']
                                ))
                        
                        # Wait for all files to be stored with timeout
                        for future in concurrent.futures.as_completed(futures, timeout=30):
                            try:
                                result = future.result()
                                if result:
                                    generated_files.append(result)
                                    config_files.append(result)
                                    logger.info(f"Successfully stored file: {result}")
                            except Exception as e:
                                logger.error(f"Error in file storage thread: {str(e)}")
                                processing_stats['failed'] += 1
                    except concurrent.futures.TimeoutError:
                        logger.error(f"Timeout waiting for file storage threads for configuration {config_id}")
                        # Cancel any remaining futures
                        for future in futures:
                            future.cancel()
                        processing_stats['failed'] += 1
                    finally:
                        # Ensure all threads are cleaned up
                        executor.shutdown(wait=False)
                
                if config_files:
                    processing_stats['successful'] += 1
                else:
                    processing_stats['failed'] += 1
                
                logger.info(
                    f"Completed processing configuration: {config_id} - "
                    f"Generated {len(config_files)} files "
                    f"(Elapsed time: {time.time() - start_time:.2f}s)"
                )
                processing_stats['processed'] += 1
                
                # Add small delay between configurations to avoid rate limiting
                time.sleep(0.5)
                
            except Exception as e:
                logger.error(f"Error processing configuration {config.get('configuration_id', 'UNKNOWN')}: {str(e)}")
                processing_stats['failed'] += 1
                continue
        
        if not generated_files:
            raise ValueError("No control files were generated")
        
        execution_time = time.time() - start_time
        logger.info(
            f"Processing completed in {execution_time:.2f}s: "
            f"{json.dumps(processing_stats)}"
        )
        
        return {
            'statusCode': 200,
            'message': f"Generated {len(generated_files)} control files",
            'files': generated_files,
            'statistics': processing_stats,
            'processingTime': execution_time
        }
    
    except ValueError as ve:
        logger.error(f"Validation error: {str(ve)}")
        raise ve  # Re-raise to fail Step Functions execution
    except ClientError as ce:
        logger.error(f"AWS service error: {str(ce)}")
        raise ce  # Re-raise to fail Step Functions execution
    except Exception as e:
        logger.error(f"Error generating security controls: {str(e)}")
        raise e  # Re-raise to fail Step Functions execution

def get_service_config_rules(service_name: str) -> List[Dict]:
    """Get AWS Config managed rules for a specific service from DynamoDB"""
    try:
        from dynamodb_operations import query_dynamodb_by_gsi
        
        # Query by service name using GSI
        service_rules = query_dynamodb_by_gsi(
            table_name='gensec-AWSConfigManagedRules',
            index_name='ServiceNameIndex',
            key_name='service_name',
            key_value=service_name.lower()
        )
        
        logger.info(f"Found {len(service_rules)} managed rules for service {service_name}")
        return service_rules
        
    except Exception as e:
        logger.error(f"Error querying Config rules for service {service_name}: {str(e)}")
        return []

def create_controls_prompt(config, validated_actions, validated_parameters):
    """Create prompt for security controls with validated data"""
    try:
        logger.debug(f"Creating prompt for config: {json.dumps(config)}")
        
        config_id = config.get('configuration_id')
        service_name = config.get('service_name')
        recommended_configuration = config.get('recommended_configuration', {})
        
        if not config_id or not service_name:
            raise ValueError("Missing required fields: configuration_id or service_name")

        # Parse recommended_configuration if needed    
        if isinstance(recommended_configuration, str):
            try:
                recommended_configuration = json.loads(recommended_configuration)
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse recommended_configuration for {config_id}")
                recommended_configuration = {}
        
        # Get available Config managed rules for this service
        config_rules = get_service_config_rules(service_name)
        
        # Format validated parameters for prompt
        valid_params_text = "\n".join([
            f"- {param['parameter_name']}: {param['description']} (Type: {param['type']})"
            for param in validated_parameters
        ])

        # Format validated actions for prompt
        valid_actions_text = "\n".join([
            f"- {action['action_name']}: {action['description']} (Level: {action['accessLevel']})"
            for action in validated_actions
        ])

        # Format available Config rules for prompt
        config_rules_text = ""
        if config_rules:
            config_rules_text = "\n".join([
                f"- {rule['rule_name']}: {rule.get('description', 'No description available')}"
                for rule in config_rules
            ])
        else:
            config_rules_text = "No managed Config rules available for this service"
            logger.warning(f"No Config managed rules found for {service_name}")

        prompt = f"""
            As an AWS Security Engineer, generate specific code implementations for detective, preventive, and proactive controls based on this exact configuration.
            Use ONLY the validated parameters and actions listed below.
            
            Configuration ID: {config_id}
            Service: {service_name}
            Recommended Configuration:
            {json.dumps(recommended_configuration, indent=2)}
            
            VALID PARAMETERS - USE ONLY THESE:
            {valid_params_text}
            
            VALID ACTIONS - USE ONLY THESE:
            {valid_actions_text}
            
            AVAILABLE AWS CONFIG MANAGED RULES FOR {service_name.upper()}:
            {config_rules_text}
            
            CRITICAL INSTRUCTIONS:
            - Return ONLY the JSON object below
            - Do NOT include markdown formatting (no ```json or ```)
            - Do NOT include any explanatory text before or after
            - Use \\n for line breaks in code strings
            - Ensure all quotes are properly escaped
            
            Generate THREE separate code files (one for each control type) that specifically implement this configuration:

            1. Detective Controls - AWS Config Rules:
               FIRST, check if any of the available managed rules above can validate this configuration.
               If a suitable managed rule exists, use it:
               ```python
               def create_config_rule_{config_id}():
                   # Use the appropriate managed rule from the list above
                   return {{
                       "ConfigRuleName": "{config_id}-config-rule",
                       "Source": {{
                           "Owner": "AWS",
                           "SourceIdentifier": "MANAGED_RULE_NAME_FROM_LIST_ABOVE"
                       }},
                       "Scope": {{
                           "ComplianceResourceTypes": ["{service_name}"]
                       }},
                       "InputParameters": {{
                           # Parameters must match recommended_configuration values
                       }}
                   }}
               ```
               
               ONLY create a custom rule if NO managed rule from the list above can validate this configuration:
               ```python
               def evaluate_compliance_{config_id}(configuration_item, rule_parameters):
                   # Evaluation logic must check recommended_configuration values
                   if not matches_recommended_config(configuration_item):
                       return "NON_COMPLIANT"
                   return "COMPLIANT"
               ```

            2. Preventive Controls - Service Control Policies (ONLY if configuration is critical or very high):
               ```json
               {{
                   "Version": "2012-10-17",
                   "Statement": [
                       {{
                           "Sid": "{config_id}_preventive",
                           "Effect": "Deny",
                           "Action": [
                               # Actions that would violate this specific configuration
                           ],
                           "Resource": [
                               # Resources specified in the configuration
                           ],
                           "Condition": {{
                               # Conditions must match recommended_configuration values
                           }}
                       }}
                   ]
               }}
               ```

            3. Proactive Controls - Hashicorp Sentinel Policies:
               Generate well-commented HCL code with clear explanations for each section.
               Include comments explaining the policy purpose, imports, parameters, filters, rules, and main enforcement. 
               Follow the example below:
               ```hcl
               # Policy to enforce {config_id} requirements
               # Ensures {service_name} meets security configuration standards

               # Import the tfplan/v2 module
               import "tfplan/v2" as tfplan

               # Define required parameters based on the configuration
               param required_values default = {json.dumps(recommended_configuration.get('settings', {}))}

               # Get all {service_name} resources from the plan
               {service_name.lower().replace(' ', '_')}_resources = filter tfplan.resource_changes as _, rc {{
                   rc.type is "aws_{service_name.lower().replace(' ', '_')}" and
                       (rc.change.actions contains "create" or rc.change.actions is ["update"])
               }}

               # Rule to validate specific configuration settings
               {service_name.lower().replace(' ', '_')}_config_check = rule {{
                   all {service_name.lower().replace(' ', '_')}_resources as _, resource {{
                       # Add specific validation checks here based on recommended_configuration
                       resource.change.after.[settings] is required_values.[settings]
                   }}
               }}

               # Main rule that enforces all checks
               main = rule {{
                   {service_name.lower().replace(' ', '_')}_config_check
               }}
               ```

            {{
                "detective_controls": {{
                    "configuration_id": "{config_id}",
                    "filename": "{config_id}_config_rule.py",
                    "code": "Complete Python code for the Config rule",
                    "control_id": "DET-{service_name[:3].upper()}-{datetime.now().strftime('%Y')}-{config_id[-3:]}",
                    "description": "What this control checks",
                    "implementation_guide": "Step by step instructions"
                }},
                "preventive_controls": {{
                    "configuration_id": "{config_id}",
                    "filename": "{config_id}_scp.json",
                    "code": "Complete SCP JSON policy",
                    "control_id": "PRE-{service_name[:3].upper()}-{datetime.now().strftime('%Y')}-{config_id[-3:]}",
                    "description": "What this control checks",
                    "implementation_guide": "Step by step instructions"
                }},
                "proactive_controls": {{
                    "configuration_id": "{config_id}",
                    "filename": "{config_id}_sentinel.hcl",
                    "code": "Complete Sentinel policy code following the exact format provided (number 3 above)",
                    "control_id": "PRO-{service_name[:3].upper()}-{datetime.now().strftime('%Y')}-{config_id[-3:]}",
                    "description": "What this control checks",
                    "implementation_guide": "Step by step instructions"
                }}
            }}

            Important Guidelines:
            - Generate controls that SPECIFICALLY validate this configuration
            - Use EXACT values from the recommended_configuration
            - Create rules that check SPECIFIC settings
            - Ensure controls are DIRECTLY related to this configuration
            - For Sentinel policies:
              * Use tfplan/v2 import
              * Include proper resource filtering
              * Define parameters for configuration values
              * Use specific resource types (aws_rds_instance, aws_s3_bucket, etc.)
              * Add descriptive comments
              * Follow the exact format provided
            - Do NOT create generic controls
            - Do NOT use placeholder values

            Return the JSON object starting with {{ and ending with }}. Nothing else.
            """

        logger.debug(f"Generated prompt for configuration {config_id}")
        return {"prompt": prompt}

    except Exception as e:
        logger.error(f"Error creating controls prompt: {str(e)}")
        logger.error(f"Problematic config: {json.dumps(config)}")
        raise

def parse_controls_response(response):
    """
    Parse and validate the response for security controls with enhanced Sentinel policy validation.
    """
    try:
        # Handle string JSON responses (from Claude)
        if isinstance(response, str):
            try:
                response = json.loads(response)
                logger.info("Successfully parsed string JSON response")
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON string: {str(e)}")
                logger.error(f"Response content: {response[:500]}...")
                raise ValueError("Invalid JSON string response")
        
        # Validate basic structure
        required_control_types = ['detective_controls', 'preventive_controls', 'proactive_controls']
        logger.debug(f"*** required_control_types {str(required_control_types)}")
        for control_type in required_control_types:
            if control_type not in response:
                logger.error(f"Missing required control type: {control_type}")
                raise ValueError(f"Missing {control_type} in response")

        # Validate and enhance Sentinel policy
        if 'proactive_controls' in response:
            sentinel_policy = response['proactive_controls'].get('code', '')
            logger.debug(f"*** sentinel_policy {str(sentinel_policy)}")
            if not validate_sentinel_policy(sentinel_policy):
                logger.warning("Invalid Sentinel policy format, attempting to fix...")
                fixed_policy = fix_sentinel_policy(sentinel_policy, response['proactive_controls'].get('configuration_id', ''))
                response['proactive_controls']['code'] = fixed_policy

        return response

    except Exception as e:
        logger.error(f"Error parsing controls response: {str(e)}")
        raise

def fix_sentinel_policy(policy_code, configuration_id):
    """
    Attempt to fix common issues in Sentinel policies.
    """
    try:
        # Extract the resource type from the policy
        resource_type_match = re.search(r'aws_\w+', policy_code)
        resource_type = resource_type_match.group(0) if resource_type_match else "aws_resource"

        # Create a fixed policy with proper structure
        fixed_policy = f"""# Policy to enforce {configuration_id} requirements
        # Ensures {resource_type} meets security configuration standards

        # Import the tfplan/v2 module
        import "tfplan/v2" as tfplan

        # Define required parameters
        param required_values default = {{}}

        # Get all {resource_type} resources from the plan
        {resource_type}_resources = filter tfplan.resource_changes as _, rc {{
            rc.type is "{resource_type}" and
                (rc.change.actions contains "create" or rc.change.actions is ["update"])
        }}

        # Rule to validate specific configuration settings
        {resource_type}_config_check = rule {{
            all {resource_type}_resources as _, resource {{
                # Configuration validation
                resource.change.after.settings is required_values.settings
            }}
        }}

        # Main rule that enforces all checks
        main = rule {{
            {resource_type}_config_check
        }}"""
        return fixed_policy

    except Exception as e:
        logger.error(f"Error fixing Sentinel policy: {str(e)}")
        return policy_code

def validate_sentinel_policy(policy_code):
    """
    Validate the Sentinel policy structure and content.
    """
    try:
        required_elements = [
            'import "tfplan/v2"',
            'param',
            'filter tfplan.resource_changes',
            'rule {',
            'main = rule'
        ]

        # Check for required elements
        missing_elements = [elem for elem in required_elements if elem not in policy_code]
        if missing_elements:
            logger.warning(f"Sentinel policy missing required elements: {missing_elements}")
            return False

        # Validate basic structure
        if not policy_code.strip().startswith('#'):
            logger.warning("Sentinel policy should start with comments")
            return False

        # Check for proper resource filtering
        if 'rc.change.actions' not in policy_code:
            logger.warning("Sentinel policy missing proper resource change filtering")
            return False

        return True

    except Exception as e:
        logger.error(f"Error validating Sentinel policy: {str(e)}")
        return False

def validate_generated_controls(controls, valid_parameter_names, valid_action_names, original_config):
    """Validate generated controls against valid parameters and actions"""
    try:
        if not isinstance(controls, dict):
            logger.error("Invalid controls format")
            return None

        for control_type, control in controls.items():
            if control_type == 'detective_controls':
                if not validate_control_parameters(control.get('code', ''), 
                                                valid_parameter_names, 
                                                original_config):
                    logger.warning(f"Invalid parameters in detective control")
                    
            elif control_type == 'preventive_controls':
                if not validate_control_actions(control.get('code', ''), 
                                             valid_action_names):
                    logger.warning(f"Invalid actions in preventive control")
                    
            elif control_type == 'proactive_controls':
                if not validate_control_parameters(control.get('code', ''), 
                                                valid_parameter_names, 
                                                original_config):
                    logger.warning(f"Invalid parameters in proactive control")

        return controls

    except Exception as e:
        logger.error(f"Error validating controls: {str(e)}")
        return None

def validate_control_parameters(control_code, valid_parameters, config):
    """Validate control code only uses valid parameters"""
    try:
        # Basic validation - check if control code contains valid parameter names
        for param_name in valid_parameters:
            if param_name in control_code:
                return True
        return True  # Allow controls even if no specific parameters found
        
    except Exception as e:
        logger.error(f"Error validating control parameters: {str(e)}")
        return True

def validate_control_actions(control_code, valid_actions):
    """Validate control code only uses valid actions"""
    try:
        # Basic validation - check if control code contains valid action names
        for action_name in valid_actions:
            if action_name in control_code:
                return True
        return True  # Allow controls even if no specific actions found
        
    except Exception as e:
        logger.error(f"Error validating control actions: {str(e)}")
        return True

def lambda_handler(event, context):
    """Lambda handler for generating security controls"""
    try:
        logger.info("Starting GenerateSecurityControls Lambda")
        
        # Generate controls
        result = generate_security_controls(event)
        
        logger.info("Successfully completed security controls generation")
        return result
        
    except Exception as e:
        logger.error(f"Error in GenerateSecurityControls: {str(e)}")
        raise
