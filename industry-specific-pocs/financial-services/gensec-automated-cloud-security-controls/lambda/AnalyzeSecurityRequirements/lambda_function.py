"""
AnalyzeSecurityRequirements Lambda Function
Analyzes security requirements and generates recommendations using Bedrock AI
"""
import json
import boto3
import os
import logging
from datetime import datetime
from bedrock_client import get_bedrock_client
from dynamodb_operations import (
    get_service_actions_from_dynamodb,
    get_service_parameters_from_dynamodb,
    store_control_library,
    update_service_tracking
)
from json_processing import clean_and_extract_json
from validation import validate_input
from typing import List, Dict, Optional, Any

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variables
CONTROL_LIBRARY_TABLE = os.environ['DYNAMODB_TABLE_CONTROL_LIBRARY']
SERVICE_TRACKING_TABLE = os.environ['DYNAMODB_TABLE_SERVICE_TRACKING']
SERVICE_ACTIONS_TABLE = os.environ.get('DYNAMODB_TABLE_SERVICE_ACTIONS', 'gensec-AWSServiceActions')
SERVICE_PARAMETERS_TABLE = os.environ.get('DYNAMODB_TABLE_SERVICE_PARAMETERS', 'gensec-AWSServiceParameters')
CONFIG_MANAGED_RULES_TABLE = os.environ.get('DYNAMODB_TABLE_CONFIG_MANAGED_RULES', 'gensec-AWSConfigManagedRules')

# Initialize Bedrock client
bedrock_client = get_bedrock_client('claude-4')

def analyze_security_requirements(input_data):
    """
    Analyze security requirements with validated service data and generate recommendations.
    
    Args:
        input_data (dict): Contains security profile, service request, and service documentation
        
    Returns:
        dict: Analysis results with status code and recommendations or error details
        
    Raises:
        ValueError: If required inputs are missing or ir invalid
    """
    try:
        logger.info(f"Starting security requirements analysis")
        logger.debug(f"Received input data: {json.dumps(input_data)}")
        
        # Extract and validate input data with detailed logging
        security_profile = input_data.get('securityProfile')
        if not security_profile:
            logger.error("Missing securityProfile in input data")
            raise ValueError("securityProfile is required")
            
        service_request = input_data.get('serviceRequest')
        if not service_request:
            logger.error("Missing serviceRequest in input data")
            raise ValueError("serviceRequest is required")
            
        service_documentation = input_data.get('serviceDocumentation')
        if not service_documentation:
            logger.error("Missing serviceDocumentation in input data")
            raise ValueError("serviceDocumentation is required")
            
        # Log the structure of service_documentation
        logger.info(f"Service documentation keys: {list(service_documentation.keys())}")

        # Extract validated data with logging
        service_doc_body = service_documentation.get('body', {})
        if not service_doc_body:
            logger.error("Missing body in service documentation")
            raise ValueError("Service documentation body is required")
            
        logger.info(f"Service documentation body keys: {list(service_doc_body.keys())}")
        
        # Get service_id for DynamoDB queries
        service_id = service_request.get('serviceId')
        if not service_id:
            raise ValueError("serviceId is required")
        
        logger.info(f"Processing service_id: {service_id}")
        
        # Query DynamoDB for service actions and parameters
        validated_actions = get_service_actions_from_dynamodb(service_id, SERVICE_ACTIONS_TABLE)
        validated_parameters = get_service_parameters_from_dynamodb(service_id, SERVICE_PARAMETERS_TABLE)
        
        logger.info(f"Found {len(validated_parameters)} parameters and {len(validated_actions)} actions for {service_id}")

        if not validated_parameters and not validated_actions:
            logger.error(f"No validated parameters or actions found for service_id: {service_id}")
            logger.info(f"Available tables: Actions={SERVICE_ACTIONS_TABLE}, Parameters={SERVICE_PARAMETERS_TABLE}")
            raise ValueError(f"No validated parameters or actions available for service {service_id}")
        
        # Log what we have available
        if not validated_actions:
            logger.warning(f"No actions available for {service_request.get('serviceId', 'unknown service')}, proceeding with parameters only")
        if not validated_parameters:
            logger.warning(f"No parameters available for {service_request.get('serviceId', 'unknown service')}, proceeding with actions only")

        # Create enhanced prompt with validation
        try:
            prompt = create_analysis_prompt_with_validation(
                security_profile=security_profile,
                service_request=service_request,
                validated_actions=validated_actions,
                validated_parameters=validated_parameters
            )
        except Exception as e:
            logger.error(f"Error creating analysis prompt: {str(e)}")
            raise ValueError(f"Failed to create analysis prompt: {str(e)}")

        # Get Bedrock response with pagination
        try:
            logger.info("Invoking Bedrock for analysis")
            full_response = invoke_bedrock_agent_with_pagination(prompt)
            
            if not full_response:
                raise ValueError("No valid response from Bedrock")
                
            logger.debug(f"Bedrock response: {json.dumps(full_response)}")
        except Exception as e:
            logger.error(f"Error invoking Bedrock: {str(e)}")
            raise ValueError(f"Failed to get response from Bedrock: {str(e)}")

        # Verify the response has the expected structure
        if not isinstance(full_response, dict) or 'recommendations' not in full_response:
            logger.error("Invalid response format from Bedrock")
            logger.error(f"Response: {json.dumps(full_response)}")
            raise ValueError("Invalid response format: missing recommendations")
            
        recommendations = full_response.get('recommendations', [])
        if not recommendations:
            logger.error("No recommendations found in Bedrock response")
            raise ValueError("No recommendations found in response")

        logger.info(f"Received {len(recommendations)} recommendations from Bedrock")

        # Validate recommendations against known valid parameters
        validated_recommendations = []
        for idx, rec in enumerate(recommendations):
            try:
                logger.debug(f"Processing recommendation {idx + 1}: {json.dumps(rec)}")
                
                settings = rec.get('recommended_configuration', {}).get('settings', {})
                valid_settings = {}
                
                # Validate each parameter in the recommendation
                for param_name, param_value in settings.items():
                    if param_name in [p.get('parameter_name') for p in validated_parameters]:
                        valid_settings[param_name] = param_value
                        logger.debug(f"Valid parameter found: {param_name}")
                    else:
                        logger.warning(f"Invalid parameter '{param_name}' in recommendation {idx + 1}")
                
                # Include recommendation if it has valid settings OR if service has no parameters
                if valid_settings or not validated_parameters:
                    if valid_settings:
                        rec['recommended_configuration']['settings'] = valid_settings
                    elif not validated_parameters:
                        logger.warning(f"Service has no CloudFormation parameters - accepting recommendation {idx + 1} without parameter validation")
                    validated_recommendations.append(rec)
                    logger.info(f"Validated recommendation {idx + 1} with {len(valid_settings)} valid settings")
                else:
                    logger.warning(f"Skipping recommendation {idx + 1} as it contains no valid parameters")
                    
            except Exception as e:
                logger.error(f"Error processing recommendation {idx + 1}: {str(e)}")
                continue

        if not validated_recommendations:
            logger.error("No valid recommendations after parameter validation")
            logger.error(f"Original recommendations: {json.dumps(recommendations)}")
            logger.error(f"Validated parameters: {json.dumps(validated_parameters)}")
            raise ValueError("No valid recommendations after parameter validation")

        logger.info(f"Successfully validated {len(validated_recommendations)} recommendations")

        # Store validated recommendations
        try:
            store_control_library(validated_recommendations, service_request, CONTROL_LIBRARY_TABLE)
            update_service_tracking(service_request, SERVICE_TRACKING_TABLE)
            logger.info("Successfully stored recommendations and updated tracking")
        except Exception as e:
            logger.error(f"Error storing recommendations: {str(e)}")
            # Continue execution even if storage fails
            
        # Prepare successful response
        response = {
            'statusCode': 200,
            'analyzedRequirements': validated_recommendations,
            'metadata': {
                'totalRecommendations': len(validated_recommendations),
                'validatedParameters': len(validated_parameters),
                'validatedActions': len(validated_actions),
                'timestamp': datetime.utcnow().isoformat()
            }
        }
        
        logger.info("Successfully completed security requirements analysis")
        return response
        
    except ValueError as ve:
        logger.error(f"Validation error: {str(ve)}")
        raise ve  # Re-raise to fail Step Functions execution
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise e  # Re-raise to fail Step Functions execution

def invoke_bedrock_agent_with_pagination(prompt, max_pages=3):
    """
    Invoke Bedrock with pagination support for very large responses.
    """
    try:
        full_response = ""
        current_prompt = prompt["prompt"] if isinstance(prompt, dict) else prompt
        
        for page in range(max_pages):
            logger.info(f"Invoking Bedrock for page {page + 1}/{max_pages}")
            try:
                # Create proper prompt format
                formatted_prompt = {
                    "prompt": current_prompt
                }
                
                response = bedrock_client.invoke(current_prompt)
                
                if response:
                    if isinstance(response, str):
                        full_response = response
                    else:
                        full_response = json.dumps(response)
                    
                    if "To be continued" not in full_response:
                        logger.info("Response complete, ending pagination")
                        break
                    
                    logger.info("Response incomplete, continuing to next page")
                    current_prompt = "Continue from where you left off:"
                else:
                    logger.warning(f"No valid response received for page {page + 1}")
                    break
                    
            except Exception as e:
                logger.error(f"Error during pagination (page {page + 1}): {str(e)}")
                break
        
        if not full_response:
            return None
            
        try:
            if isinstance(full_response, str):
                return json.loads(full_response)
            return full_response
        except json.JSONDecodeError as je:
            logger.error(f"Failed to parse response as JSON: {str(je)}")
            return None
            
    except Exception as e:
        logger.error(f"Error in pagination: {str(e)}")
        return None

def get_service_specific_rules(service_name: str) -> List[str]:
    """
    Returns AWS Config managed rules specific to a service from DynamoDB
    
    Args:
        service_name (str): AWS service name
        
    Returns:
        List[str]: List of AWS Config managed rules specific to the service
    """
    try:
        from dynamodb_operations import query_dynamodb_by_gsi
        
        # Query by service name using GSI
        service_rules = query_dynamodb_by_gsi(
            table_name=CONFIG_MANAGED_RULES_TABLE,
            index_name='ServiceNameIndex',
            key_name='service_name',
            key_value=service_name.lower()
        )
        
        rule_names = [item['rule_name'] for item in service_rules]
        logger.info(f"Found {len(rule_names)} managed rules for service {service_name}")
        return rule_names
        
    except Exception as e:
        logger.error(f"Error querying service-specific rules: {str(e)}")
        return []

def create_analysis_prompt_with_validation(security_profile: dict, 
                                           service_request: dict, 
                                           validated_actions: list, 
                                           validated_parameters: list) -> dict:
    """
    Create enhanced prompt for security analysis using validated parameters and actions.
    
    Args:
        security_profile (dict): Security profile containing requirements and controls
        service_request (dict): Service request details
        validated_actions (list): List of validated AWS service actions
        validated_parameters (list): List of validated AWS service parameters
        
    Returns:
        dict: Formatted prompt for Bedrock with validation constraints
        
    Raises:
        ValueError: If required inputs are missing or invalid
    """
    try:
        # Input validation - allow empty lists but not None values
        if security_profile is None or service_request is None or validated_actions is None or validated_parameters is None:
            raise ValueError("All input parameters are required")
            
        # Extract service name
        services = service_request.get('services', [])
        if not services:
            logger.warning("No services found in service_request")
            service_name = service_request.get('serviceId', 'Unknown Service')
        else:
            service_name = services[0].get('serviceName', 'Unknown Service')
            
        logger.info(f"Processing service: {service_name}")
        
        # Get service-specific AWS Config managed rules
        service_rules = get_service_specific_rules(service_name)
        
        # Format validated parameters and actions
        valid_params_text = "\n".join([
            f"- {param.get('parameter_name')}: {param.get('description')} (Type: {param.get('type')})"
            for param in validated_parameters
            if param.get('parameter_name') and param.get('description')
        ])
        
        valid_actions_text = "\n".join([
            f"- {action.get('action_name')}: {action.get('description')} (Access Level: {action.get('access_level')})"
            for action in validated_actions
            if action.get('action_name') and action.get('description')
        ])
        
        # Format managed rules text
        service_rules_text = "\n".join([f"- {rule}" for rule in service_rules])
        
        # Extract security requirements
        security_requirements = security_profile.get('security_requirements', {})
        
        prompt = {
            "prompt": f"""Generate security configuration recommendations for {service_name} based on AWS best practices and security requirements.

VERIFIED AWS CONFIG MANAGED RULES - USE ONLY THESE:
{service_rules_text}

VALID PARAMETERS - USE ONLY THESE:
{valid_params_text}

VALID ACTIONS - USE ONLY THESE:
{valid_actions_text}

SECURITY REQUIREMENTS TO ADDRESS:
{json.dumps(security_requirements, indent=2)}

Service Request Context:
{json.dumps(service_request, indent=2)}

Full Security Profile Context:
{json.dumps(security_profile, indent=2)}

CRITICAL INSTRUCTIONS:
1. Use ONLY the verified AWS Config managed rules listed above.
2. If suggesting a custom rule (when no managed rule exists):
   - Clearly label it as "CUSTOM:"
   - Explain why a custom rule is needed
   - Provide detailed implementation guidance
3. Focus on service-specific security configurations that directly address requirements
4. Use ONLY the validated parameters and actions provided
5. Map recommendations to specific security requirements
6. Include relevant compliance mappings (NIST, PCI, ISO)
7. DO NOT suggest non-existent managed rules
8. DO NOT use parameters or actions not in the validated lists
9. Return ONLY the JSON object below
10. Do NOT include markdown formatting (no ```json or ```)
11. Do NOT include any explanatory text before or after
12. Use \\n for line breaks in code strings
13. Ensure all quotes are properly escaped

Return recommendations in this EXACT format:
{{
    "recommendations": [
        {{
            "configuration_id": "CONF-{service_name.split()[0].upper()}-2025-001",
            "configuration_short_name": "Clear, specific name",
            "configuration_rationale": {{
                "requirement": "How this addresses security requirements",
                "impact_if_not_implemented": "Specific security impact"
            }},
            "configuration_priority": "VERY HIGH|HIGH|MEDIUM|LOW",
            "service_name": "{service_name}",
            "security_domain": "Access Control|Data Protection|Network Security|etc",
            "consolidated_requirements": "Requirements addressed by this configuration",
            "threat_vector": ["Specific threats mitigated"],
            "recommended_configuration": {{
                "settings": {{
                    # ONLY use validated parameters here
                }}
            }},
            "configuration_AWS_URL": "AWS documentation URL",
            "detective_control": {{
                "details": {{
                    "managed_config_rule": "VERIFIED-MANAGED-RULE or CUSTOM:description",
                    "security_hub_control": "SecurityHub control ID",
                    "compliance_mapping": {{
                        "nist_800_53": "Control ID",
                        "pci_dss": "Requirement ID",
                        "iso_27001": "Control ID"
                    }}
                }}
            }},
            "preventive_control": {{
                "details": {{
                    "scp_policy": {{
                        # Only for VERY HIGH priority, using validated actions
                    }}
                }}
            }},
            "proactive_control": {{
                "details": {{
                    "sentinel_policy": "Specific Sentinel policy"
                }}
            }}
        }}
    ]
}}

VALIDATION RULES:
1. Each setting must use exact parameter names from validated list
2. Each action must exist in validated actions list
3. Detective controls must use verified managed rules or be labeled as custom
4. Every recommendation must map to specific security requirements
5. Parameter values must match their documented types
6. URLs must point to valid AWS documentation
7. Each recommendation should focus on one specific configuration

8. Settings in recommended_configuration MUST match validated parameter names
9. Actions in preventive controls MUST come from the validated actions list

Example of valid parameter usage:
If you have a validated parameter "BucketVersioning":
- DO: "settings": {{"BucketVersioning": "Enabled"}}
- DON'T: "settings": {{"versioning": true}} or any variation not matching the exact parameter name

Remember: The goal is to create parameter-driven recommendations that map to security requirements, not the other way around.
"""
# Final Validation:
# Before returning recommendations, verify that:
# 1. Each setting uses exact parameter names from the validated list
# 2. All actions referenced exist in the validated actions list
# 3. Every recommendation addresses specific security requirements
# 4. Parameter values match their documented types
# 5. URLs point to relevant AWS documentation
# 6. Each recommendation focuses on one specific parameter configurationRemember: Return ONLY the JSON object - no additional text or markdown formatting.
        }
        
        logger.info("Successfully created analysis prompt with validated rules and parameters")
        return prompt
        
    except Exception as e:
        logger.error(f"Error creating analysis prompt: {str(e)}", exc_info=True)
        raise ValueError(f"Failed to create analysis prompt: {str(e)}")

def lambda_handler(event, context):
    """Lambda handler for analyzing security requirements"""
    try:
        logger.info("Starting AnalyzeSecurityRequirements Lambda")
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Analyze requirements directly (the analyze_security_requirements function has its own validation)
        result = analyze_security_requirements(event)
        
        logger.info("Successfully completed security requirements analysis")
        return result
        
    except Exception as e:
        logger.error(f"Error in AnalyzeSecurityRequirements: {str(e)}")
        raise
