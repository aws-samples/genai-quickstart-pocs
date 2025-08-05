from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_glue as glue,
    aws_iam as iam,
    CfnOutput,
    RemovalPolicy,
    Duration,
    Tags,
)
from constructs import Construct


class DataStack(Stack):
    """
    Data stack for EMR Knowledge Base infrastructure.
    Creates S3 bucket and Glue database for data storage.
    """

    def __init__(self, scope: Construct, construct_id: str, config: dict, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Extract configuration
        glue_config = config.get("glue", {})
        database_name = glue_config.get("databaseName", "emr_kb")

        # Create S3 bucket for data storage
        self.bucket = self._create_s3_bucket()

        # Create Glue database
        self.database = self._create_glue_database(database_name)

        # Create IAM role for Glue
        self.glue_role = self._create_glue_role()

        # Create outputs
        self._create_outputs()

    def _create_s3_bucket(self) -> s3.Bucket:
        """Create S3 bucket with proper configuration."""
        bucket = s3.Bucket(
            self, "EmrKbDataBucket",
            bucket_name=f"{self.stack_name.lower()}-data-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=False,
            enforce_ssl=True
        )

        # Add tags to the bucket
        Tags.of(bucket).add("Purpose", "EMRDataLoading")
        Tags.of(bucket).add("Stack", self.stack_name)

        return bucket

    def _create_glue_database(self, database_name: str) -> glue.CfnDatabase:
        """Create Glue database."""
        database = glue.CfnDatabase(
            self, "EmrKbGlueDatabase",
            catalog_id=self.account,
            database_input=glue.CfnDatabase.DatabaseInputProperty(
                name=database_name,
                description="Glue database for EMR Knowledge Base",
                location_uri=f"s3://{self.bucket.bucket_name}/glue-catalog/",
                parameters={
                    "classification": "emr-kb",
                    "purpose": "EMR Knowledge Base"
                }
            )
        )

        # Create a custom resource to set up database permissions
        # This is a placeholder for Lake Formation permissions that will be implemented in Task 6

        return database

    def _create_glue_role(self) -> iam.Role:
        """Create IAM role for Glue with necessary permissions."""
        role = iam.Role(
            self, "GlueServiceRole",
            assumed_by=iam.ServicePrincipal("glue.amazonaws.com"),
            description="Role for AWS Glue to access S3 and other AWS services",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSGlueServiceRole")
            ]
        )

        # Add S3 access policy
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:ListBucket"
                ],
                resources=[
                    self.bucket.bucket_arn,
                    f"{self.bucket.bucket_arn}/*"
                ]
            )
        )

        # Add CloudWatch Logs policy
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                resources=[
                    f"arn:aws:logs:{self.region}:{self.account}:log-group:/aws-glue/*"
                ]
            )
        )

        return role

    def _create_outputs(self) -> None:
        """Create CloudFormation outputs."""
        CfnOutput(
            self, "S3BucketName",
            value=self.bucket.bucket_name,
            description="S3 bucket for data loading",
            export_name=f"{self.stack_name}-S3BucketName"
        )

        CfnOutput(
            self, "S3BucketArn",
            value=self.bucket.bucket_arn,
            description="ARN of the S3 bucket for data loading",
            export_name=f"{self.stack_name}-S3BucketArn"
        )

        CfnOutput(
            self, "GlueDatabaseName",
            value=self.database.database_input.name,
            description="Glue database name",
            export_name=f"{self.stack_name}-GlueDatabaseName"
        )

        CfnOutput(
            self, "GlueRoleArn",
            value=self.glue_role.role_arn,
            description="ARN of the Glue service role",
            export_name=f"{self.stack_name}-GlueRoleArn"
        )
