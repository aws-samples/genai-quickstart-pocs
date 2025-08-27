"""
Command-line interface for EMR Knowledge Base utilities
"""
import argparse
import boto3
import logging
import sys
from typing import Dict

from .data_loader import (
    download_emr_knowledge_base_data,
    process_and_upload_data,
    create_glue_database,
    setup_redshift_external_schema
)
from .permissions import (
    setup_database_permissions,
    grant_current_user_permissions
)
from .exceptions import EMRKBError

# Set up logging
logger = logging.getLogger("emr_kb")
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)


def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='EMR Knowledge Base Setup')

    # Core parameters
    parser.add_argument('--region', help='AWS region (auto-detected if not provided)')
    parser.add_argument('--env', default='dev', help='Environment name (default: dev)')
    parser.add_argument('--profile', help='AWS profile name')

    # Data management
    parser.add_argument('--data-dir', default='bedrock-kb-data', help='JSON files directory')
    parser.add_argument('--no-download', action='store_true', help='Skip downloading fresh EMR data')
    parser.add_argument('--ssm-document', default='AWSSupport-DiagnoseEMRLogsWithAthena', help='SSM document name')
    parser.add_argument('--s3-prefix', default='emr-kb-data', help='S3 prefix')
    parser.add_argument('--force-recreate', action='store_true', help='Drop and recreate tables')

    # Database parameters
    parser.add_argument('--database-name', default='dev', help='Redshift database name')
    parser.add_argument('--setup-db-user', action='store_true', help='Set up database user for Bedrock KB')

    return parser.parse_args()


def get_stack_outputs(stack_name: str, session) -> Dict[str, str]:
    """Get CloudFormation stack outputs"""
    cf = session.client('cloudformation')

    try:
        response = cf.describe_stacks(StackName=stack_name)

        outputs = {}
        for stack in response['Stacks']:
            for output in stack.get('Outputs', []):
                outputs[output['OutputKey']] = output['OutputValue']

        return outputs
    except Exception as e:
        logger.error(f"Error getting stack outputs: {e}")
        return {}


def main():
    """Main entry point"""
    args = parse_arguments()

    # Set up AWS session
    session_kwargs = {}
    if args.profile:
        session_kwargs["profile_name"] = args.profile
    if args.region:
        session_kwargs["region_name"] = args.region

    session = boto3.Session(**session_kwargs)
    region = args.region or session.region_name

    # Get stack names
    data_stack_name = f"EmrKb-DataStack-{args.env}"
    redshift_stack_name = f"EmrKb-RedshiftStack-{args.env}"
    bedrock_stack_name = f"EmrKb-BedrockStack-{args.env}"

    logger.info("EMR Knowledge Base Setup")
    logger.info(f"Region: {region}")
    logger.info(f"Environment: {args.env}")

    # Get stack outputs
    data_outputs = get_stack_outputs(data_stack_name, session)
    redshift_outputs = get_stack_outputs(redshift_stack_name, session)
    bedrock_outputs = get_stack_outputs(bedrock_stack_name, session)

    if not data_outputs:
        logger.error(f"Could not get outputs from data stack: {data_stack_name}")
        return 1

    if not redshift_outputs:
        logger.error(f"Could not get outputs from Redshift stack: {redshift_stack_name}")
        return 1

    if args.setup_db_user and not bedrock_outputs:
        logger.error(f"Could not get outputs from Bedrock stack: {bedrock_stack_name}")
        return 1

    # Extract required values
    s3_bucket = data_outputs.get('S3BucketName')
    glue_database = data_outputs.get('GlueDatabaseName')
    redshift_role_arn = redshift_outputs.get('RedshiftServerlessRoleArn')
    workgroup_name = redshift_outputs.get('RedshiftServerlessWorkgroupName')

    if not all([s3_bucket, glue_database, redshift_role_arn, workgroup_name]):
        logger.error("Missing required stack outputs")
        return 1

    logger.info(f"S3 Bucket: {s3_bucket}")
    logger.info(f"Glue Database: {glue_database}")
    logger.info(f"Redshift Role: {redshift_role_arn}")
    logger.info(f"Redshift Workgroup: {workgroup_name}")

    # Set up AWS clients
    s3_client = session.client('s3')
    glue_client = session.client('glue')

    try:
        # Download data unless --no-download is specified
        if not args.no_download:
            if not download_emr_knowledge_base_data(region, args.ssm_document, args.data_dir):
                logger.error("Failed to download data")
                return 1

        # Create Glue database if it doesn't exist
        try:
            glue_client.get_database(Name=glue_database)
            logger.info(f"Glue database exists: {glue_database}")
        except Exception:
            logger.warning(f"Glue database not found, creating: {glue_database}")
            if not create_glue_database(glue_client, glue_database):
                return 1

        # Process and upload data
        if not process_and_upload_data(
            args.data_dir, s3_client, s3_bucket, args.s3_prefix,
            glue_client, glue_database, args.force_recreate
        ):
            logger.error("Failed to process and upload data")
            return 1

        # Set up Redshift external schema
        redshift_database = args.database_name
        if not setup_redshift_external_schema(
            workgroup_name, redshift_database, glue_database, redshift_role_arn, region
        ):
            logger.warning("Failed to set up Redshift external schema")

        # Grant permissions to current user
        grant_current_user_permissions(
            workgroup_name, redshift_database, glue_database, region
        )

        # Set up database user for Bedrock KB if requested
        if args.setup_db_user:
            bedrock_kb_role_arn = bedrock_outputs.get('BedrockKBRoleArn')
            if not bedrock_kb_role_arn:
                logger.error("Bedrock KB role ARN not found in stack outputs")
                return 1

            # Extract role name from ARN
            bedrock_kb_role_name = bedrock_kb_role_arn.split('/')[-1]
            logger.info(f"Bedrock KB Role: {bedrock_kb_role_name}")

            # Set up database user and permissions
            if not setup_database_permissions(
                workgroup_name, redshift_database, bedrock_kb_role_name, region
            ):
                logger.warning("Failed to set up database user for Bedrock KB")
                return 1

            logger.info("Database user set up for Bedrock KB role")

        # Get Knowledge Base ID if available
        kb_id = bedrock_outputs.get('BedrockKnowledgeBaseId') if bedrock_outputs else None

        logger.info("Setup completed successfully!")
        logger.info(f"Glue Database: {glue_database}")
        logger.info("Tables: known_issues")

        if kb_id:
            logger.info(f"Knowledge Base ID: {kb_id}")

        return 0
    except EMRKBError as e:
        logger.error(f"Error: {e}")
        return 1
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
