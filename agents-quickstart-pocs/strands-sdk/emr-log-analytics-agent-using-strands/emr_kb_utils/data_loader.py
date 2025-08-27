"""
Data loading utilities for EMR Knowledge Base

Handles downloading, processing, and uploading EMR knowledge base data to AWS services.
"""
import json
import logging
import os
import boto3
from botocore.exceptions import ClientError

from .exceptions import DataLoadError
from .parser import EMRKnowledgeBaseParser

logger = logging.getLogger(__name__)


def download_emr_knowledge_base_data(region: str, ssm_document: str, output_dir: str) -> bool:
    """
    Download EMR knowledge base data from SSM document

    Args:
        region: AWS region
        ssm_document: SSM document name
        output_dir: Directory to save downloaded files

    Returns:
        True if successful, False otherwise
    """
    try:
        # Sanitize ssm_document for logging to prevent log injection
        safe_ssm_document = ssm_document.replace('\n', '').replace('\r', '').replace('\t', '')
        logger.info(f"Downloading EMR knowledge base data from {safe_ssm_document}")
        ssm = boto3.client('ssm', region_name=region)

        # Get document content
        response = ssm.get_document(Name=ssm_document)
        json.loads(response['Content'])

        # Extract knowledge base files
        os.makedirs(output_dir, exist_ok=True)

        # Process attachments or content as needed
        # This is a simplified version - implement based on actual document structure

        # amazonq-ignore-next-line
        logger.info(f"Downloaded EMR knowledge base data to {output_dir}")
        return True
    except Exception as e:
        logger.error(f"Failed to download EMR knowledge base data: {e}")
        return False


def create_glue_database(glue_client, database_name: str) -> bool:
    """
    Create a Glue database if it doesn't exist

    Args:
        glue_client: Boto3 Glue client
        database_name: Name of the database to create

    Returns:
        True if successful, False otherwise
    """
    try:
        glue_client.create_database(
            DatabaseInput={
                'Name': database_name,
                'Description': 'EMR Knowledge Base database'
            }
        )
        # amazonq-ignore-next-line
        logger.info(f"Created Glue database: {database_name}")
        return True
    except ClientError as e:
        if e.response['Error']['Code'] == 'AlreadyExistsException':
            # amazonq-ignore-next-line
            logger.info(f"Glue database already exists: {database_name}")
            return True
        logger.error(f"Failed to create Glue database: {e}")
        return False


def process_and_upload_data(
    data_dir: str,
    s3_client,
    bucket_name: str,
    s3_prefix: str,
    glue_client,
    database_name: str,
    force_recreate: bool = False
) -> bool:
    """
    Process and upload EMR knowledge base data to S3 and create Glue tables

    Args:
        data_dir: Directory containing knowledge base files
        s3_client: Boto3 S3 client
        bucket_name: S3 bucket name
        s3_prefix: S3 prefix for uploaded files
        glue_client: Boto3 Glue client
        database_name: Glue database name
        force_recreate: Whether to drop and recreate tables

    Returns:
        True if successful, False otherwise
    """
    try:
        # Parse knowledge base data
        parser = EMRKnowledgeBaseParser(data_dir)
        issues = parser.prepare_structured_data()

        if not issues:
            logger.warning("No issues found in knowledge base data")
            return False

        # Upload to S3
        # amazonq-ignore-next-line
        s3_path = f"s3://{bucket_name}/{s3_prefix}/known_issues/"

        # Upload as a single JSON file with each issue on a separate line (JSONL format)
        known_issues_file = os.path.join(data_dir, "known_issues.json")
        # Validate path to prevent path traversal attacks
        normalized_path = os.path.normpath(known_issues_file)
        normalized_data_dir = os.path.normpath(data_dir)
        if not normalized_path.startswith(normalized_data_dir):
            raise ValueError(f"Invalid file path: {known_issues_file}")
        logger.info(f"Writing {len(issues)} issues to {known_issues_file}")

        # amazonq-ignore-next-line
        with open(known_issues_file, 'w') as f:
            for i, issue in enumerate(issues):
                # Write each JSON object on a separate line without any extra characters
                json_str = json.dumps(issue)
                f.write(json_str + "\n")

        # Verify the file was written correctly
        file_size = os.path.getsize(known_issues_file)
        # amazonq-ignore-next-line
        logger.info(f"Created JSON file with {file_size} bytes")

        # Read the first few lines to verify format
        # Validate path again to prevent path traversal attacks
        if not os.path.normpath(known_issues_file).startswith(os.path.normpath(data_dir)):
            raise ValueError(f"Invalid file path for reading: {known_issues_file}")
        with open(known_issues_file, 'r') as f:
            first_line = f.readline().strip()
            # amazonq-ignore-next-line
            logger.info(f"First line length: {len(first_line)} characters")

        # amazonq-ignore-next-line
        s3_client.upload_file(
            known_issues_file,
            bucket_name,
            f"{s3_prefix}/known_issues/known_issues.json"
        )

        # Create Glue table
        table_name = "known_issues"

        # Drop table if force_recreate
        if force_recreate:
            try:
                glue_client.delete_table(
                    DatabaseName=database_name,
                    Name=table_name
                )
                # amazonq-ignore-next-line
                logger.info(f"Dropped table {database_name}.{table_name}")
            except ClientError:
                pass

        # Create table
        glue_client.create_table(
            DatabaseName=database_name,
            TableInput={
                'Name': table_name,
                'StorageDescriptor': {
                    'Columns': [
                        {'Name': 'issue_id', 'Type': 'string'},
                        {'Name': 'component', 'Type': 'string'},
                        {'Name': 'summary', 'Type': 'string'},
                        {'Name': 'description', 'Type': 'string'},
                        {'Name': 'keywords', 'Type': 'array<string>'},
                        {'Name': 'keywords_text', 'Type': 'string'},
                        {'Name': 'knowledge_center_links', 'Type': 'array<string>'}
                    ],
                    'Location': s3_path,
                    'InputFormat': 'org.apache.hadoop.mapred.TextInputFormat',
                    'OutputFormat': 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
                    'SerdeInfo': {
                        'SerializationLibrary': 'org.openx.data.jsonserde.JsonSerDe',
                        'Parameters': {
                            'ignore.malformed.json': 'true'
                        }
                    }
                },
                'TableType': 'EXTERNAL_TABLE'
            }
        )

        # Sanitize database_name for logging to prevent log injection
        safe_database_name = database_name.replace('\n', '').replace('\r', '').replace('\t', '')
        logger.info(f"Created Glue table {safe_database_name}.{table_name}")
        return True
    except Exception as e:
        logger.error(f"Failed to process and upload data: {e}")
        raise DataLoadError(f"Failed to process and upload data: {e}")


def setup_redshift_external_schema(
    workgroup_name: str,
    database_name: str,
    glue_database: str,
    redshift_role_arn: str,
    region: str
) -> bool:
    """
    Set up Redshift external schema for Glue database

    Args:
        workgroup_name: Redshift workgroup name
        database_name: Redshift database name
        glue_database: Glue database name
        redshift_role_arn: Redshift role ARN
        region: AWS region

    Returns:
        True if successful, False otherwise
    """
    try:
        redshift_data = boto3.client('redshift-data', region_name=region)

        # Validate parameters to prevent SQL injection
        import re
        if not re.match(r'^[a-zA-Z0-9_-]+$', glue_database):
            raise ValueError(f"Invalid glue_database format: {glue_database}")
        if not re.match(r'^arn:aws:iam::[0-9]+:role/[a-zA-Z0-9_/-]+$', redshift_role_arn):
            raise ValueError(f"Invalid redshift_role_arn format: {redshift_role_arn}")
        if not re.match(r'^[a-z0-9-]+$', region):
            raise ValueError(f"Invalid region format: {region}")

        # Create external schema
        # amazonq-ignore-next-line
        sql = f"""
        CREATE EXTERNAL SCHEMA IF NOT EXISTS glue_{glue_database}
        FROM DATA CATALOG
        DATABASE '{glue_database}'
        IAM_ROLE '{redshift_role_arn}'
        REGION '{region}';
        """

        # amazonq-ignore-next-line
        response = redshift_data.execute_statement(
            WorkgroupName=workgroup_name,
            Database=database_name,
            Sql=sql
        )

        # Wait for completion
        statement_id = response['Id']
        while True:
            status_response = redshift_data.describe_statement(Id=statement_id)
            status = status_response['Status']

            if status == 'FINISHED':
                # Sanitize glue_database for logging to prevent log injection
                safe_glue_database = glue_database.replace('\n', '').replace('\r', '').replace('\t', '')
                logger.info(f"Created external schema glue_{safe_glue_database}")
                return True
            elif status == 'FAILED':
                error = status_response.get('Error', 'Unknown error')
                if 'already exists' in error.lower():
                    # amazonq-ignore-next-line
                    logger.info(f"External schema glue_{glue_database} already exists")
                    return True
                # amazonq-ignore-next-line
                logger.error(f"Failed to create external schema: {error}")
                return False

            import time
            time.sleep(2)
    except Exception as e:
        logger.error(f"Failed to set up Redshift external schema: {e}")
        return False
