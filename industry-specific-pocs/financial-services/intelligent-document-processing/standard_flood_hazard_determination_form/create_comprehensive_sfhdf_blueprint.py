"""
SFHDF Blueprint Creator - Comprehensive Version
"""
import boto3
import json
import os
import sys
from botocore.exceptions import ClientError, NoCredentialsError
from dotenv import load_dotenv

# Load environment variables from .env file in same directory
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
   load_dotenv(env_path)
           

# Get region from environment variable
AWS_REGION = os.environ.get("AWS_REGION")
PROJECT_NAME = os.environ.get("PROJECT_NAME")
S3_BUCKET = os.environ.get("S3_BUCKET")
BLUEPRINT_NAME = "Standard-Flood-Hazard-Determination-Form" # Configuration - hardcoded for simplicity


def validate_environment():
    """Validate environment configuration"""
    print("Validating environment...")
    
    # Check required environment variables
    missing_vars = []
    if not os.environ.get("AWS_REGION"):
        missing_vars.append("AWS_REGION")
    if not os.environ.get("PROJECT_NAME"):
        missing_vars.append("PROJECT_NAME")
    if not os.environ.get("S3_BUCKET"):
        missing_vars.append("S3_BUCKET")
    
    if missing_vars:
        print(f"Missing environment variables: {', '.join(missing_vars)}")
        print("\nConfigure environment variables or add to .env file: {env_path}")
        return False
    
    # Test AWS access first (works with IAM roles or existing credentials)
    try:
        sts_client = boto3.client('sts')
        account_id = sts_client.get_caller_identity()['Account']
        print(f"Environment valid - Account: {account_id}")
        return True
    except NoCredentialsError:
        print("No AWS credentials found")
        print(f"\nAdd to .env file: {env_path}")
        print("  AWS_ACCESS_KEY_ID=your-access-key-id")
        print("  AWS_SECRET_ACCESS_KEY=your-secret-access-key")
        return False
    except Exception as e:
        print(f"AWS credentials error: {e}")
        print("\nCheck your AWS credentials and permissions")
        return False

def create_or_update_blueprint(bda_client):
    """Create or update SFHDF blueprint with W2/1040-style grouping"""

    # Schema configuration with flat structure 
    schema_config = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "description": "Standard Flood Hazard Determination Form (SFHDF) - Structured Extraction Schema",
        "class": "sfhdf_document",
        "type": "object",
        "properties": {
            # Form Header Group (
            "omb_control_number": {
                "type": "string",
                "inferenceType": "explicit",
                "instruction": "Extract OMB Control Number from top right header (format: XXXX-XXXX)"
            },
            "form_expiration_date": {
                "type": "string",
                "inferenceType": "explicit",
                "instruction": "Extract form expiration date from top right header"
            },
            
            # Section I - Loan Information Group
            "lender_entity_name": {
                "type": "string",
                "inferenceType": "inferred",
                "instruction": "Extract lender/servicer name from Section I Box 1"
            },
            "lender_street_address": {
                "type": "string",
                "inferenceType": "inferred",
                "instruction": "Extract lender street address from Section I Box 1"
            },
            "lender_city_state_zip": {
                "type": "string",
                "inferenceType": "inferred",
                "instruction": "Extract lender city, state, zip from Section I Box 1"
            },
            "property_street_address": {
                "type": "string",
                "inferenceType": "inferred",
                "instruction": "Extract property street address from Section I Box 2"
            },
            "property_city_state_zip": {
                "type": "string",
                "inferenceType": "inferred",
                "instruction": "Extract property city, state, zip from Section I Box 2"
            },
            "borrower_full_name": {
                "type": "string",
                "inferenceType": "inferred",
                "instruction": "Extract borrower name from Section I Box 2"
            },
            "lender_servicer_id": {
                "type": "string",
                "inferenceType": "explicit",
                "instruction": "Extract lender/servicer ID from Section I Box 3"
            },
            "loan_reference_id": {
                "type": "string",
                "inferenceType": "explicit",
                "instruction": "Extract loan reference ID from Section I Box 4"
            },
            "required_flood_insurance_amount": {
                "type": "string",
                "inferenceType": "inferred",
                "instruction": "Extract required flood insurance amount from Section I Box 5"
            },
            
            # Section II-A - NFIP Community Jurisdiction Group
            "nfip_community_designation": {
                "type": "string",
                "inferenceType": "inferred",
                "instruction": "Extract NFIP community name from Section II-A Box 1"
            },
            "nfip_county_designation": {
                "type": "string",
                "inferenceType": "inferred",
                "instruction": "Extract county name from Section II-A Box 2"
            },
            "nfip_state_code": {
                "type": "string",
                "inferenceType": "explicit",
                "instruction": "Extract two-digit state code from Section II-A Box 3"
            },
            "nfip_community_id": {
                "type": "string",
                "inferenceType": "explicit",
                "instruction": "Extract 6-digit NFIP community number from Section II-A Box 4"
            },
            
            # Section II-B - NFIP Map Data Group
            "nfip_map_panel_number": {
                "type": "string",
                "inferenceType": "explicit",
                "instruction": "Extract 11-digit NFIP map number from Section II-B Box 1"
            },
            "nfip_map_effective_date": {
                "type": "string",
                "inferenceType": "explicit",
                "instruction": "Extract NFIP map effective/revised date from Section II-B Box 2"
            },
            "lomc_indicator": {
                "type": "boolean",
                "inferenceType": "explicit",
                "instruction": "Return true if YES is selected for Letter of Map Change in Section II-B Box 3"
            },
            "lomc_date": {
                "type": "string",
                "inferenceType": "explicit",
                "instruction": "Extract LOMC date from Section II-B Box 3 if YES is selected, otherwise return empty string"
            },
            "lomc_case_number": {
                "type": "string",
                "inferenceType": "inferred",
                "instruction": "Extract LOMC case number from Section II-B Box 3 if YES is selected, otherwise return empty string"
            },
            "designated_flood_zone": {
                "type": "string",
                "inferenceType": "inferred",
                "instruction": "Extract flood zone designation from Section II-B Box 4"
            },
            "no_nfip_map_indicator": {
                "type": "boolean",
                "inferenceType": "explicit",
                "instruction": "Return true if No NFIP Map box is selected in Section II-B Box 5"
            },
            
            # Section II-C - Federal Flood Insurance Availability Group
            "federal_insurance_available": {
                "type": "boolean",
                "inferenceType": "explicit",
                "instruction": "Return true if Federal flood insurance available box is selected in Section II-C"
            },
            "regular_program_status": {
                "type": "boolean",
                "inferenceType": "explicit",
                "instruction": "Return true if Regular Program box is selected in Section II-C"
            },
            "emergency_program_status": {
                "type": "boolean",
                "inferenceType": "explicit",
                "instruction": "Return true if Emergency Program box is selected in Section II-C"
            },
            "federal_insurance_not_available": {
                "type": "boolean",
                "inferenceType": "explicit",
                "instruction": "Return true if Federal flood insurance not available box is selected in Section II-C"
            },
            "cbra_opa_indicator": {
                "type": "boolean",
                "inferenceType": "explicit",
                "instruction": "Return true if CBRA/OPA box is selected in Section II-C"
            },
            "cbra_opa_designation_date": {
                "type": "string",
                "inferenceType": "inferred",
                "instruction": "Extract CBRA/OPA designation date if CBRA/OPA box is selected, otherwise return empty string"
            },
            
            # Section II-D - Final Determination Group
            "sfha_determination_result": {
                "type": "string",
                "inferenceType": "inferred",
                "instruction": "Extract YES/NO determination from Section II-D Special Flood Hazard Area question"
            },
            
            # Section II-E - Additional Comments Group
            "determination_comments": {
                "type": "string",
                "inferenceType": "inferred",
                "instruction": "Extract optional comments from Section II-E, return empty string if no comments"
            },
            
            # Section II-F - Preparer Information Group 
            "preparer_company_name": {
                "type": "string",
                "inferenceType": "inferred",
                "instruction": "Extract preparer company name from Section II-F"
            },
            "preparer_division_name": {
                "type": "string",
                "inferenceType": "inferred",
                "instruction": "Extract preparer division name from Section II-F, return empty string if not present"
            },
            "preparer_street_address": {
                "type": "string",
                "inferenceType": "inferred",
                "instruction": "Extract preparer street address from Section II-F, return empty string if not present"
            },
            "preparer_city_state_zip": {
                "type": "string",
                "inferenceType": "inferred",
                "instruction": "Extract preparer city, state, zip from Section II-F"
            },
            "preparer_contact_phone": {
                "type": "string",
                "inferenceType": "inferred",
                "instruction": "Extract preparer contact phone from Section II-F"
            },
            "report_generation_timestamp": {
                "type": "string",
                "inferenceType": "explicit",
                "instruction": "Extract date of determination from Section II-F"
            },
            "flood_certificate_id": {
                "type": "string",
                "inferenceType": "inferred",
                "instruction": "Extract flood certificate ID from Section II-F, return empty string if not present"
            },
            "life_of_loan_status": {
                "type": "string",
                "inferenceType": "inferred",
                "instruction": "Extract life of loan status from Section II-F, return empty string if not present"
            },
            
            # Form Footer Group 
            "fema_form_number": {
                "type": "string",
                "inferenceType": "inferred",
                "instruction": "Extract FEMA form number from bottom left of form"
            },
            "document_reference_id": {
                "type": "string",
                "inferenceType": "inferred",
                "instruction": "Extract document reference ID if present, return empty string if not present"
            }
        }
    }

    try:
            # Check if blueprint exists
            list_blueprints_response = bda_client.list_blueprints(blueprintStageFilter='ALL')
            blueprint = next((bp for bp in list_blueprints_response['blueprints']
                                if 'blueprintName' in bp and bp['blueprintName'] == BLUEPRINT_NAME), None)

            if not blueprint:
                print(f"Creating blueprint: {BLUEPRINT_NAME}")
                response = bda_client.create_blueprint(
                    blueprintName=BLUEPRINT_NAME,
                    type='DOCUMENT',
                    blueprintStage='LIVE',
                    schema=json.dumps(schema_config)
                )
            else:
                print(f"Updating blueprint: {BLUEPRINT_NAME}")
                response = bda_client.update_blueprint(
                    blueprintArn=blueprint['blueprintArn'],
                    blueprintStage='LIVE',
                    schema=json.dumps(schema_config)
                )

            blueprint_arn = response['blueprint']['blueprintArn']
            print(f"Blueprint ARN: {blueprint_arn}")
            return blueprint_arn
        
    except Exception as e:
        print(f"Error creating/updating blueprint: {e}")
        print("Unable to create or update blueprint. Check your AWS permissions and try again.")
        raise        


def create_or_update_project(bda_client, blueprint_arn):
    """Create or update BDA project with blueprint"""
    try:
        # Check if project exists
        list_project_response = bda_client.list_data_automation_projects(projectStageFilter='LIVE')
        project = next((p for p in list_project_response['projects']
                       if p['projectName'] == PROJECT_NAME), None)
    
        # Project configuration
        standard_output_configuration = {
                'document': {
                    'extraction': {
                    'granularity': {'types': ['DOCUMENT']},
                    'boundingBox': {'state': 'ENABLED'}
                },
                'generativeField': {'state': 'ENABLED'},
                'outputFormat': {
                    'textFormat': {'types': ['PLAIN_TEXT']},
                    'additionalFileFormat': {'state': 'DISABLED'}
                }
            }
        }

        custom_output_configuration = {
            'blueprints': [{'blueprintArn': blueprint_arn}]
        }
        
        if not project:
            print(f"Creating project: {PROJECT_NAME}")
            response = bda_client.create_data_automation_project(
                projectName=PROJECT_NAME,
                projectDescription='SFHDF processing project with structured grouping',
                projectStage='LIVE',
                standardOutputConfiguration=standard_output_configuration,
                customOutputConfiguration=custom_output_configuration
            )
        else:
            print(f"Updating project: {PROJECT_NAME}")
            response = bda_client.update_data_automation_project(
                projectArn=project['projectArn'],
                standardOutputConfiguration=standard_output_configuration,
                customOutputConfiguration=custom_output_configuration
            )
        
        project_arn = response['projectArn']
        print(f"Project ARN: {project_arn}")
        return project_arn
            
    except Exception as e:
        print(f"Error creating/updating project: {e}")
        print("Unable to create or update project. Check your AWS permissions and try again.")
        raise

def main():
    """Main function"""
    print("SFHDF Blueprint and Project Setup (W2/1040-style Grouping)")
    print("="*60)
    
    # Validate environment first
    if not validate_environment():
        sys.exit(1)
    
    # Initialize AWS clients after validation
    bda_client = boto3.client('bedrock-data-automation', region_name=AWS_REGION)
    sts_client = boto3.client('sts')
    account_id = sts_client.get_caller_identity()['Account']
    
    try:
        # Create blueprint
        blueprint_arn = create_or_update_blueprint(bda_client)
        
        # Create project
        project_arn = create_or_update_project(bda_client, blueprint_arn)
        
        print("\nSetup completed successfully!")
        print(f"Blueprint: {BLUEPRINT_NAME}")
        print(f"Project: {PROJECT_NAME}")
        print("Schema uses W2/1040-style grouped structure for better organization")
        
    except Exception as e:
        print(f"Setup failed: {e}")
        print("Unable to complete setup. Check your AWS permissions and configuration.")
        sys.exit(1)

if __name__ == "__main__":
    main()