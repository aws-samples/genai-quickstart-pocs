"""
Permission management utilities for EMR Knowledge Base

Handles setting up database permissions for Bedrock Knowledge Base.
"""
import json
import logging
import time
import boto3
from botocore.exceptions import ClientError
from typing import Optional, Tuple


logger = logging.getLogger(__name__)


def get_redshift_credentials(namespace_name: str, region: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Get Redshift admin credentials from Secrets Manager

    Args:
        namespace_name: Redshift namespace name
        region: AWS region

    Returns:
        Tuple of (username, password, secret_arn)
    """
    # Sanitize namespace_name for logging to prevent log injection
    safe_namespace_name = namespace_name.replace('\n', '').replace('\r', '').replace('\t', '')
    logger.info(f"Getting Redshift credentials for namespace: {safe_namespace_name}")

    try:
        # Try the exact pattern first
        # amazonq-ignore-next-line
        secret_name = f"redshift!{namespace_name}-admin"
        secretsmanager = boto3.client('secretsmanager', region_name=region)

        try:
            # Try to get the secret directly
            secret_response = secretsmanager.describe_secret(SecretId=secret_name)
            secret_arn = secret_response['ARN']

            secret = secretsmanager.get_secret_value(SecretId=secret_name)
            credentials = json.loads(secret['SecretString'])

            username = credentials.get('username')
            password = credentials.get('password')

            if username and password:
                logger.info(f"Retrieved admin credentials for user: {username}")
                return username, password, secret_arn
        except ClientError:
            # Fall back to searching by filters
            response = secretsmanager.list_secrets(
                Filters=[{'Key': 'name', 'Values': ['redshift']}]
            )

            for secret_info in response.get('SecretList', []):
                if namespace_name in secret_info['Name']:
                    secret_arn = secret_info['ARN']

                    secret = secretsmanager.get_secret_value(SecretId=secret_arn)
                    credentials = json.loads(secret['SecretString'])

                    username = credentials.get('username')
                    password = credentials.get('password')

                    if username and password:
                        logger.info(f"Retrieved admin credentials for user: {username}")
                        return username, password, secret_arn

        logger.warning("No matching Redshift credentials found")
        return None, None, None
    except Exception as e:
        logger.error(f"Error getting Redshift credentials: {e}")
        return None, None, None


def execute_redshift_statement(
    redshift_data,
    workgroup_name: str,
    database_name: str,
    sql: str,
    secret_arn: Optional[str] = None
) -> bool:
    """
    Execute a Redshift SQL statement

    Args:
        redshift_data: Boto3 Redshift Data API client
        workgroup_name: Redshift workgroup name
        database_name: Redshift database name
        sql: SQL statement to execute
        secret_arn: Secret ARN for authentication

    Returns:
        True if successful, False otherwise
    """
    try:
        # Execute SQL
        kwargs = {
            'WorkgroupName': workgroup_name,
            'Database': database_name,
            'Sql': sql
        }

        if secret_arn:
            kwargs['SecretArn'] = secret_arn

        response = redshift_data.execute_statement(**kwargs)

        # Wait for completion
        statement_id = response['Id']
        while True:
            status_response = redshift_data.describe_statement(Id=statement_id)
            status = status_response['Status']

            if status == 'FINISHED':
                return True
            elif status == 'FAILED':
                error = status_response.get('Error', 'Unknown error')
                # Check for common errors that can be ignored
                if ('already exists' in error.lower() or
                        'permission denied' in error.lower() and 'awsdatacatalog' in error.lower()):
                    # amazonq-ignore-next-line
                    logger.warning(f"Non-critical error: {error}")
                    return True
                # amazonq-ignore-next-line
                logger.error(f"SQL execution failed: {error}")
                return False

            time.sleep(2)
    except Exception as e:
        logger.error(f"Error executing Redshift statement: {e}")
        return False


def setup_database_permissions(
    workgroup_name: str,
    database_name: str,
    iam_role_name: str,
    region: str
) -> bool:
    """
    Set up database permissions for Bedrock KB role

    Args:
        workgroup_name: Redshift workgroup name
        database_name: Redshift database name
        iam_role_name: IAM role name for Bedrock KB
        region: AWS region

    Returns:
        True if successful, False otherwise
    """
    # Sanitize iam_role_name for logging to prevent log injection
    safe_iam_role_name = iam_role_name.replace('\n', '').replace('\r', '').replace('\t', '')
    logger.info(f"Setting up database permissions for IAM role: {safe_iam_role_name}")

    # Get admin credentials
    namespace_name = workgroup_name.replace('workgroup', 'namespace')
    username, password, secret_arn = get_redshift_credentials(namespace_name, region)

    # Create Redshift Data API client
    redshift_data = boto3.client('redshift-data', region_name=region)

    # Create database user for IAM role
    # amazonq-ignore-next-line
    db_user_name = f"IAMR:{iam_role_name}"

    # SQL to create user and grant permissions
    # amazonq-ignore-next-line
    setup_sql = f"""
    CREATE USER "{db_user_name}" PASSWORD DISABLE;
    GRANT USAGE ON DATABASE awsdatacatalog TO "{db_user_name}";
    """

    # Execute SQL
    success = execute_redshift_statement(
        redshift_data,
        workgroup_name,
        database_name,
        setup_sql,
        secret_arn
    )

    if success:
        # Sanitize iam_role_name for logging to prevent log injection
        safe_iam_role_name = iam_role_name.replace('\n', '').replace('\r', '').replace('\t', '')
        logger.info(f"Database permissions configured for {safe_iam_role_name}")
        return True
    else:
        # Sanitize iam_role_name for logging to prevent log injection
        safe_iam_role_name = iam_role_name.replace('\n', '').replace('\r', '').replace('\t', '')
        logger.error(f"Failed to set up database permissions for {safe_iam_role_name}")
        return False


def grant_current_user_permissions(
    workgroup_name: str,
    database_name: str,
    glue_database: str,
    region: str
) -> bool:
    """
    Grant permissions to the current user

    Args:
        workgroup_name: Redshift workgroup name
        database_name: Redshift database name
        glue_database: Glue database name
        region: AWS region

    Returns:
        True if successful, False otherwise
    """
    logger.info("Granting permissions to current user")

    # Get admin credentials
    namespace_name = workgroup_name.replace('workgroup', 'namespace')
    username, password, secret_arn = get_redshift_credentials(namespace_name, region)

    if not secret_arn:
        logger.warning("Admin credentials not available, skipping user permissions")
        return False

    # Get current user identity
    try:
        sts_client = boto3.client('sts', region_name=region)
        caller_identity = sts_client.get_caller_identity()
        current_user_arn = caller_identity['Arn']

        # Extract role name for assumed roles
        if 'assumed-role' in current_user_arn:
            role_parts = current_user_arn.split('/')
            if len(role_parts) >= 2:
                current_user_iam = f"IAMR:{role_parts[1]}"
            else:
                current_user_iam = "IAMR:AWSReservedSSO_AWSAdministratorAccess_de3a1b093293de09"
        else:
            current_user_iam = "IAMR:AWSReservedSSO_AWSAdministratorAccess_de3a1b093293de09"

        logger.info(f"Current user IAM identity: {current_user_iam}")

        # Create Redshift Data API client
        redshift_data = boto3.client('redshift-data', region_name=region)

        # SQL statements
        create_user_sql = f'CREATE USER "{current_user_iam}" PASSWORD DISABLE;'

        # amazonq-ignore-next-line
        grant_schema_sql = f"""
        GRANT USAGE ON SCHEMA glue_{glue_database} TO "{current_user_iam}";
        GRANT SELECT ON ALL TABLES IN SCHEMA glue_{glue_database} TO "{current_user_iam}";
        """

        grant_db_sql = f'GRANT USAGE ON DATABASE awsdatacatalog TO "{current_user_iam}";'

        # Execute SQL statements
        for sql, description in [
            (create_user_sql, "Creating user"),
            (grant_schema_sql, "Granting schema permissions"),
            (grant_db_sql, "Granting database permissions")
        ]:
            # amazonq-ignore-next-line
            logger.info(f"{description}...")
            success = execute_redshift_statement(
                redshift_data,
                workgroup_name,
                database_name,
                sql,
                secret_arn
            )
            if not success:
                # amazonq-ignore-next-line
                logger.warning(f"Failed: {description}")

        return True
    except Exception as e:
        logger.error(f"Error granting permissions to current user: {e}")
        return False
