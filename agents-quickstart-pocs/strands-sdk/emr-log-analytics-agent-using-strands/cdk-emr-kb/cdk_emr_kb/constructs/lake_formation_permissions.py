from aws_cdk import (
    aws_iam as iam,
    aws_lambda as lambda_,
    custom_resources as cr,
    CustomResource,
    Duration,
    Stack,
)
from constructs import Construct
from typing import List, Optional


class LakeFormationPermissions(Construct):
    """
    Custom construct for setting up Lake Formation permissions.
    """

    def __init__(self, scope: Construct, id: str, database_name: str,
                 principal_arn: str, tables: Optional[List[str]] = None) -> None:
        """
        Initialize Lake Formation permissions construct.

        Args:
            scope: CDK construct scope
            id: Construct ID
            database_name: Glue database name
            principal_arn: ARN of the principal to grant permissions to
            tables: List of table names to grant permissions to (default: all tables)
        """
        super().__init__(scope, id)

        # Create Lambda function for Lake Formation permissions
        self.lambda_function = self._create_lambda_function()

        # Create custom resource provider
        provider = cr.Provider(
            self, "LakeFormationPermissionsProvider",
            on_event_handler=self.lambda_function
            # Removed log_retention parameter as it's no longer supported in this version
        )

        # Create custom resource
        self.custom_resource = CustomResource(
            self, "LakeFormationPermissionsResource",
            service_token=provider.service_token,
            properties={
                "DatabaseName": database_name,
                "PrincipalArn": principal_arn,
                "Tables": tables or [],
                "AllTables": tables is None,
                "Timestamp": Stack.of(self).stack_id  # Force update on each deployment
            }
        )

    def _create_lambda_function(self) -> lambda_.Function:
        """Create Lambda function for Lake Formation permissions."""
        # Create IAM role for Lambda
        role = iam.Role(
            self, "LakeFormationPermissionsLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        # Add Lake Formation permissions
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "lakeformation:GrantPermissions",
                    "lakeformation:RevokePermissions",
                    "lakeformation:ListPermissions"
                ],
                resources=["*"]
            )
        )

        # Add Glue permissions
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "glue:GetDatabase",
                    "glue:GetDatabases",
                    "glue:GetTable",
                    "glue:GetTables",
                    "glue:SearchTables"
                ],
                resources=["*"]
            )
        )

        # Create Lambda function
        # amazonq-ignore-next-line
        function = lambda_.Function(
            self, "LakeFormationPermissionsLambda",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_inline(self._get_lambda_code()),
            timeout=Duration.minutes(5),
            role=role,
            description="Lambda function for setting up Lake Formation permissions"
        )

        return function

    def _get_lambda_code(self) -> str:
        """Get Lambda function code for Lake Formation permissions."""
        return '''
import boto3
import logging
import time
import cfnresponse

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize clients
lakeformation = boto3.client('lakeformation')
glue = boto3.client('glue')

def handler(event, context):
    # Lambda function handler for Lake Formation permissions
    logger.info(f"Received event: {event}")

    # Extract properties
    properties = event.get('ResourceProperties', {})
    database_name = properties.get('DatabaseName')
    principal_arn = properties.get('PrincipalArn')
    tables = properties.get('Tables', [])
    all_tables = properties.get('AllTables', False)

    # Validate input parameters
    if not database_name or not principal_arn:
        logger.error("Missing required properties: DatabaseName or PrincipalArn")
        cfnresponse.send(event, context, cfnresponse.FAILED, {
            'Message': "Missing required properties: DatabaseName or PrincipalArn"
        })
        return
    
    # Validate database name format (alphanumeric, underscores, hyphens only)
    import re
    if not re.match(r'^[a-zA-Z0-9_-]+$', database_name):
        logger.error(f"Invalid database name format: {database_name}")
        cfnresponse.send(event, context, cfnresponse.FAILED, {
            'Message': f"Invalid database name format: {database_name}"
        })
        return
    
    # Validate principal ARN format
    if not re.match(r'^arn:aws:[a-zA-Z0-9-]+:[a-zA-Z0-9-]*:[0-9]*:[a-zA-Z0-9/_-]+$', principal_arn):
        logger.error(f"Invalid principal ARN format: {principal_arn}")
        cfnresponse.send(event, context, cfnresponse.FAILED, {
            'Message': f"Invalid principal ARN format: {principal_arn}"
        })
        return
    
    # Validate table names format
    for table in tables:
        if not re.match(r'^[a-zA-Z0-9_-]+$', table):
            logger.error(f"Invalid table name format: {table}")
            cfnresponse.send(event, context, cfnresponse.FAILED, {
                'Message': f"Invalid table name format: {table}"
            })
            return

    try:
        if event['RequestType'] == 'Create' or event['RequestType'] == 'Update':
            # Grant database permissions
            grant_database_permissions(database_name, principal_arn)

            # Grant table permissions
            if all_tables:
                # Get all tables in the database
                response = glue.get_tables(DatabaseName=database_name)
                tables = [table['Name'] for table in response.get('TableList', [])]

                # If no tables found, log a warning
                if not tables:
                    logger.warning(f"No tables found in database {database_name}")

            # Grant permissions to each table
            for table in tables:
                grant_table_permissions(database_name, table, principal_arn)

            logger.info(f"Successfully granted Lake Formation permissions for {principal_arn} on database {database_name}")
            cfnresponse.send(event, context, cfnresponse.SUCCESS, {
                'Message': f"Successfully granted Lake Formation permissions for {principal_arn} on database {database_name}"
            })

        elif event['RequestType'] == 'Delete':
            # Revoke database permissions
            revoke_database_permissions(database_name, principal_arn)

            # Revoke table permissions
            if all_tables:
                # Get all tables in the database
                response = glue.get_tables(DatabaseName=database_name)
                tables = [table['Name'] for table in response.get('TableList', [])]

            # Revoke permissions from each table
            for table in tables:
                revoke_table_permissions(database_name, table, principal_arn)

            logger.info(f"Successfully revoked Lake Formation permissions for {principal_arn} on database {database_name}")
            cfnresponse.send(event, context, cfnresponse.SUCCESS, {
                'Message': f"Successfully revoked Lake Formation permissions for {principal_arn} on database {database_name}"
            })

        else:
            logger.warning(f"Unsupported request type: {event['RequestType']}")
            cfnresponse.send(event, context, cfnresponse.SUCCESS, {
                'Message': f"Unsupported request type: {event['RequestType']}"
            })

    except Exception as e:
        logger.error(f"Error: {str(e)}")
        cfnresponse.send(event, context, cfnresponse.FAILED, {
            'Message': f"Error: {str(e)}"
        })

def grant_database_permissions(database_name, principal_arn):
    # Grant Lake Formation permissions on a database
    logger.info(f"Granting database permissions for {principal_arn} on {database_name}")

    # Grant database permissions
    lakeformation.grant_permissions(
        Principal={
            'DataLakePrincipalIdentifier': principal_arn
        },
        Resource={
            'Database': {
                'Name': database_name
            }
        },
        Permissions=['DESCRIBE', 'CREATE_TABLE'],
        PermissionsWithGrantOption=[]
    )

def grant_table_permissions(database_name, table_name, principal_arn):
    # Grant Lake Formation permissions on a table
    logger.info(f"Granting table permissions for {principal_arn} on {database_name}.{table_name}")

    # Grant table permissions
    lakeformation.grant_permissions(
        Principal={
            'DataLakePrincipalIdentifier': principal_arn
        },
        Resource={
            'Table': {
                'DatabaseName': database_name,
                'Name': table_name
            }
        },
        Permissions=['SELECT', 'DESCRIBE'],
        PermissionsWithGrantOption=[]
    )

def revoke_database_permissions(database_name, principal_arn):
    # Revoke Lake Formation permissions on a database
    logger.info(f"Revoking database permissions for {principal_arn} on {database_name}")

    try:
        # Revoke database permissions
        lakeformation.revoke_permissions(
            Principal={
                'DataLakePrincipalIdentifier': principal_arn
            },
            Resource={
                'Database': {
                    'Name': database_name
                }
            },
            Permissions=['DESCRIBE', 'CREATE_TABLE'],
            PermissionsWithGrantOption=[]
        )
    except Exception as e:
        logger.warning(f"Error revoking database permissions: {str(e)}")

def revoke_table_permissions(database_name, table_name, principal_arn):
    # Revoke Lake Formation permissions on a table
    logger.info(f"Revoking table permissions for {principal_arn} on {database_name}.{table_name}")

    try:
        # Revoke table permissions
        lakeformation.revoke_permissions(
            Principal={
                'DataLakePrincipalIdentifier': principal_arn
            },
            Resource={
                'Table': {
                    'DatabaseName': database_name,
                    'Name': table_name
                }
            },
            Permissions=['SELECT', 'DESCRIBE'],
            PermissionsWithGrantOption=[]
        )
    except Exception as e:
        logger.warning(f"Error revoking table permissions: {str(e)}")
'''
