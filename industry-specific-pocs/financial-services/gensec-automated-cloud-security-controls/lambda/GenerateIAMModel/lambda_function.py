"""
GenerateIAMModel Lambda Function
Generates IAM models with validated actions for AWS services
"""
import json
import boto3
import os
import logging
from datetime import datetime
from bedrock_client import get_bedrock_client
from dynamodb_operations import get_service_actions_from_dynamodb
from s3_operations import store_output_in_s3
from validation import (
    build_action_validation_set,
    validate_input
)
from json_processing import extract_json_from_content, convert_json_to_markdown

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variables
SERVICE_ACTIONS_TABLE = os.environ.get('DYNAMODB_TABLE_SERVICE_ACTIONS', 'gensec-AWSServiceActions')
OUTPUT_BUCKET = os.environ.get('S3_OUTPUT_BUCKET', os.environ.get('S3_DOCUMENTATION_BUCKET'))

# Initialize Bedrock client
bedrock_client = get_bedrock_client('claude-4')

# Initialize S3 client
s3_client = boto3.client('s3')

def generate_iam_model(input_data):
    """Generate IAM model with validated actions for a specific AWS service"""
    try:
        logger.info("Starting IAM model generation with action validation")
        
        # Extract required input data
        service_id = input_data.get('serviceId')
        if not service_id:
            raise ValueError("serviceId is required in input")
            
        # Query DynamoDB for validated actions
        validated_actions = get_service_actions_from_dynamodb(service_id, SERVICE_ACTIONS_TABLE)
        if not validated_actions:
            raise ValueError("No validated actions found in service documentation")
            
        # Limit actions to prevent Bedrock timeouts (max 30 actions per request)
        # MAX_ACTIONS = 30
        # if len(validated_actions) > MAX_ACTIONS:
        #     logger.warning(f"Too many actions ({len(validated_actions)}), limiting to {MAX_ACTIONS} to prevent timeout")
        #     validated_actions = validated_actions[:MAX_ACTIONS]
            
        logger.info(f"Processing {len(validated_actions)} validated actions for service {service_id}")
        
        # Create comprehensive action validation sets
        valid_action_names = build_action_validation_set(validated_actions)

        logger.debug(f'valid_action_names (sample): {list(valid_action_names)[:10]}')

        valid_action_details = {
            action['action_name']: {
                'description': action['description'],
                'accessLevel': action['accessLevel']
            } for action in validated_actions
        }
            
        # Map service ID to full name
        service_name = get_service_full_name(service_id)
        logger.info(f"Generating validated IAM model for service: {service_name}")
        
        # Create enhanced prompt with validated actions
        prompt = create_iam_model_prompt_with_validation(
            service_name,
            validated_actions
        )
        
        # Invoke Bedrock with validation prompt
        logger.info("Calling Bedrock with validated action prompt")
        
        response = bedrock_client.invoke(prompt)
        
        if not response:
            raise ValueError("Failed to generate IAM model")
        
        # Parse and validate the Bedrock response
        iam_model_json = extract_json_from_content(response)
        if not iam_model_json:
            raise ValueError("Failed to extract valid JSON from Bedrock response")
            
        # Validate generated IAM model actions
        validated_model = validate_iam_model_actions(
            iam_model_json,
            valid_action_names,
            valid_action_details
        )
        
        if not validated_model:
            raise ValueError("No valid actions found in generated IAM model")
            
        logger.info(f"Successfully validated IAM model for {service_name}")
        
        # Generate markdown version with validated content
        markdown_content = convert_iam_model_to_markdown(validated_model)
        
        # Store both JSON and markdown versions
        store_iam_model_outputs(service_id, validated_model, markdown_content)
        
        # Create business use cases prompt
        business_prompt = create_bedrock_prompt(service_name, validated_actions)
        
        # Invoke Bedrock with business use cases prompt
        logger.info("Calling Bedrock with business use cases prompt")
        
        business_response = bedrock_client.invoke(business_prompt)
        
        if not business_response:
            raise ValueError("Failed to generate business use cases")
        
        # Parse business use cases response
        business_json = extract_json_from_content(business_response)
        if not business_json:
            raise ValueError("Failed to extract valid JSON from business use cases response")
            
        logger.info(f"Successfully generated business use cases for {service_name}")
        
        # Store business use cases
        business_markdown = convert_json_to_markdown(business_json, f"{service_name} Business Use Cases")
        store_business_use_cases(service_id, business_json, business_markdown)
        
        return {
            "statusCode": 200,
            "body": {
                "serviceId": service_id,
                "serviceName": service_name,
                "outputs": {
                    "json": f"{service_id}/iam-models/iam_model.json",
                    "markdown": f"{service_id}/iam-models/iam_model.md",
                    "business_use_cases": f"{service_id}/iam-models/business_use_cases.json",
                    "business_use_cases_md": f"{service_id}/iam-models/business_use_cases.md"
                },
                "statistics": {
                    "total_actions": len(validated_model['actions']),
                    "validated_actions": len([a for a in validated_model['actions'] 
                                            if a['action_name'] in [act['action_name'] for act in validated_actions]])
                }
            }
        }
        
    except ValueError as ve:
        logger.error(f"Validation error in IAM model generation: {str(ve)}")
        raise ve  # Re-raise to fail Step Functions execution
    except Exception as e:
        logger.error(f"Error generating IAM model: {str(e)}")
        raise e  # Re-raise to fail Step Functions execution

def create_iam_model_prompt_with_validation(service_name, validated_actions):
    """Create enhanced prompt with validated actions"""
    try:
        # Create a concise list of just action names to avoid token limit
        action_names = [action['action_name'] for action in validated_actions]
        actions_list = ", ".join(action_names)
        
        logger.info(f"Creating IAM model prompt for {service_name} with {len(action_names)} actions")
        
        return {
            "prompt": f"""Generate an IAM model for AWS {service_name} using ONLY these {len(action_names)} validated actions:

{actions_list}

CRITICAL INSTRUCTIONS:
- Return ONLY the JSON object below
- Do NOT include markdown formatting (no ```json or ```)
- Do NOT include any explanatory text before or after
- Use \\n for line breaks in code strings
- Ensure all quotes are properly escaped

{{
    "serviceName": "{service_name.upper()}",
    "servicePrefix": "{service_name.lower()}",
    "actions": [
        {{
            "action_name": "ActionName",
            "description": "Grants permission to [action description]",
            "accessLevel": "Read|Write|List|Tagging|Permissions Management",
            "recommendedRestrictions": {{
                "scpRestricted": false,
                "developerRestricted": false,
                "authorizedRoles": ["Admin", "{service_name}Manager"]
            }}
        }}
    ]
}}

Include ALL {len(action_names)} actions from the list above.

Return the JSON object starting with {{ and ending with }}. Nothing else."""
        }
        
    except Exception as e:
        logger.error(f"Error creating IAM model prompt: {str(e)}")
        raise e

# temp function to be evaluated
def create_bedrock_prompt(service_name, validated_actions):
    """Create intelligent prompt for Bedrock with validated actions"""
    
    service_display = service_name.replace('-', ' ').title()
    actions_list = ", ".join([action['action_name'] for action in validated_actions])
    
    return f"""
You are an AWS IAM expert. Generate comprehensive, business-ready IAM use cases for {service_display} using ONLY these validated actions:

{actions_list}

Generate a JSON response with this exact structure:
{{
    "purpose": "Business purpose of using {service_display} (2-3 sentences)",
    "scope": "High-level implementation scope and success criteria (2-3 sentences)",
    "use_cases": [
        {{
            "identity_type": "TF Service Account",
            "persona": "Terraform Automation",
            "activities": ["List 4-5 specific {service_display} infrastructure automation activities"],
            "iam_permissions": ["List specific IAM permissions from the documentation with proper resource scoping"],
            "notes": "Implementation notes and considerations"
        }},
        {{
            "identity_type": "Application Service Account", 
            "persona": "{service_display} Application",
            "activities": ["List 4-5 specific {service_display} application activities"],
            "iam_permissions": ["List specific IAM permissions for application access with resource scoping"],
            "notes": "Application-specific considerations"
        }},
        {{
            "identity_type": "Application Service Account",
            "persona": "{service_display} Power User", 
            "activities": ["List 4-5 advanced {service_display} power user activities"],
            "iam_permissions": ["List extended IAM permissions for power users"],
            "notes": "Power user considerations"
        }},
        {{
            "identity_type": "Human",
            "persona": "Operations Team",
            "activities": ["List 4-5 operational {service_display} monitoring/troubleshooting activities"],
            "iam_permissions": ["List operational IAM permissions (read-only focus)"],
            "notes": "Operational considerations"
        }},
        {{
            "identity_type": "Human", 
            "persona": "Developer",
            "activities": ["List 4-5 development {service_display} activities"],
            "iam_permissions": ["List development IAM permissions (limited scope)"],
            "notes": "Development considerations"
        }},
        {{
            "identity_type": "Human",
            "persona": "{service_display} Administrator", 
            "activities": ["List 4-5 administrative {service_display} activities"],
            "iam_permissions": ["List administrative IAM permissions"],
            "notes": "Administrative considerations"
        }}
    ],
    "constraints": [
        "List 4-6 realistic service-specific limits, quotas, and considerations from AWS documentation"
    ]
}}

CRITICAL Requirements:
1. Use ONLY the {len(validated_actions)} validated {service_display} IAM actions listed above
2. Include proper resource ARN patterns where applicable (e.g., arn:aws:{service_name}:region:account:resource/*)
3. Base all activities on actual {service_display} capabilities from the action list
4. Include realistic business use cases that organizations actually implement
5. Provide specific, actionable IAM permissions with proper resource-level scoping
6. Return ONLY valid JSON, no additional text or explanations
7. Use the exact IAM action names from the validated actions list
"""

def validate_iam_model_actions(model, valid_action_names, valid_action_details):
    """Validate IAM model actions against documented AWS actions"""
    try:

        if not isinstance(model, dict) or 'actions' not in model:
            logger.error("Invalid IAM model structure")
            return None
            
        validated_actions = []
        
        for action in model['actions']:
            action_name = action.get('action_name')
            
            # Only validate against action_name (without prefix) to avoid duplicates
            if action_name not in valid_action_details:
                logger.warning(f"Skipping invalid action: {action_name}")
                continue
                
            # Validate action details
            valid_details = valid_action_details[action_name]
            
            # Ensure description and access level match documented values
            action['description'] = valid_details['description']
            action['accessLevel'] = valid_details['accessLevel']
            
            # Add validated action
            validated_actions.append(action)
            
        if not validated_actions:
            logger.error("No valid actions found after validation")
            return None
            
        # Create validated model
        validated_model = {
            "serviceName": model['serviceName'],
            "servicePrefix": model['servicePrefix'],
            "actions": validated_actions
        }
        
        logger.info(f"Successfully validated {len(validated_actions)} actions")
        return validated_model
        
    except Exception as e:
        logger.error(f"Error validating IAM model actions: {str(e)}")
        return None

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

def convert_iam_model_to_markdown(iam_model_json):
    """Convert IAM model JSON to markdown format"""
    try:
        service_name = iam_model_json.get('serviceName', 'Unknown Service')
        md = f"# IAM Model: {service_name}\n\n"
        
        # Service Overview
        md += "## Service Overview\n\n"
        md += f"**Service Name:** {service_name}\n"
        md += f"**Service Prefix:** {iam_model_json.get('servicePrefix', 'N/A')}\n\n"
        
        # Actions
        if 'actions' in iam_model_json:
            md += "## IAM Actions\n\n"
            
            # Group actions by access level
            actions_by_level = {}
            for action in iam_model_json['actions']:
                level = action.get('accessLevel', 'Unknown')
                if level not in actions_by_level:
                    actions_by_level[level] = []
                actions_by_level[level].append(action)
            
            for level, actions in actions_by_level.items():
                md += f"### {level} Actions\n\n"
                for action in actions:
                    md += f"#### {action.get('action_name', 'Unknown Action')}\n\n"
                    md += f"**Description:** {action.get('description', 'N/A')}\n\n"
                    
                    if 'recommendedRestrictions' in action:
                        restrictions = action['recommendedRestrictions']
                        md += "**Recommended Restrictions:**\n"
                        md += f"- SCP Restricted: {restrictions.get('scpRestricted', 'N/A')}\n"
                        md += f"- Developer Restricted: {restrictions.get('developerRestricted', 'N/A')}\n"
                        if 'authorizedRoles' in restrictions:
                            md += f"- Authorized Roles: {', '.join(restrictions['authorizedRoles'])}\n"
                        md += "\n"
        
        return md
        
    except Exception as e:
        logger.error(f"Error converting IAM model to markdown: {str(e)}")
        return f"# Error generating markdown\n\nError: {str(e)}\n"

def store_iam_model_outputs(service_id, iam_model_json, markdown_content):
    """Store both JSON and markdown outputs of IAM model in S3"""
    try:
        # Store JSON version
        s3_client.put_object(
            Bucket=OUTPUT_BUCKET,
            Key=f"{service_id}/iam-models/iam_model.json",
            Body=json.dumps(iam_model_json, indent=2),
            ContentType='application/json'
        )
        
        # Store markdown version
        s3_client.put_object(
            Bucket=OUTPUT_BUCKET,
            Key=f"{service_id}/iam-models/iam_model.md",
            Body=markdown_content,
            ContentType='text/markdown'
        )
        
        logger.info(f"Stored IAM model outputs for service: {service_id}")
        
    except Exception as e:
        logger.error(f"Error storing IAM model outputs: {str(e)}")
        raise

def store_business_use_cases(service_id, business_json, business_markdown):
    """Store business use cases JSON and markdown in S3"""
    try:
        # Store JSON
        s3_client.put_object(
            Bucket=OUTPUT_BUCKET,
            Key=f"{service_id}/iam-models/business_use_cases.json",
            Body=json.dumps(business_json, indent=2),
            ContentType='application/json'
        )
        
        # Store markdown
        s3_client.put_object(
            Bucket=OUTPUT_BUCKET,
            Key=f"{service_id}/iam-models/business_use_cases.md",
            Body=business_markdown,
            ContentType='text/markdown'
        )
        
        logger.info(f"Stored business use cases for service: {service_id}")
        
    except Exception as e:
        logger.error(f"Error storing business use cases: {str(e)}")
        raise

def lambda_handler(event, context):
    """Lambda handler for generating IAM models"""
    try:
        logger.info("Starting GenerateIAMModel Lambda")
        
        result = generate_iam_model(event)
        
        logger.info("Successfully completed IAM model generation")
        return result
        
    except Exception as e:
        logger.error(f"Error in GenerateIAMModel: {str(e)}")
        raise
