"""CDK stack definition for ML Feature Analyzer Agent infrastructure"""

from aws_cdk import Stack, aws_s3 as s3, aws_iam as iam, RemovalPolicy, CfnOutput
from constructs import Construct


class MLFeatureAnalyzerStack(Stack):
    """CDK stack for ML Feature Analyzer Agent infrastructure"""

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # S3 bucket for datasets and model artifacts
        self.data_bucket = s3.Bucket(
            self,
            "FeatureAnalyzerDataBucket",
            bucket_name=f"ml-feature-analyzer-{self.account}-{self.region}",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            versioned=True,
            public_read_access=False,
            enforce_ssl=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        )

        # IAM role for SageMaker Autopilot jobs
        self.sagemaker_role = iam.Role(
            self,
            "SageMakerFeatureAnalyzerRole",
            assumed_by=iam.ServicePrincipal("sagemaker.amazonaws.com"),
            role_name=f"MLFeatureAnalyzer-SageMaker-{self.region}",
            managed_policies=[iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSageMakerFullAccess")],
        )

        # IAM role for Bedrock GenAI analysis
        self.bedrock_role = iam.Role(
            self,
            "BedrockFeatureAnalyzerRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            role_name=f"MLFeatureAnalyzer-Bedrock-{self.region}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ],
        )

        # Grant S3 access to SageMaker role
        self.data_bucket.grant_read_write(self.sagemaker_role)

        # Grant Bedrock access for GenAI analysis
        self.bedrock_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
                resources=[
                    f"arn:aws:bedrock:{self.region}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0",
                    f"arn:aws:bedrock:{self.region}::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
                ],
            )
        )

        # Grant S3 read access to Bedrock role for analysis
        self.data_bucket.grant_read(self.bedrock_role)

        # CloudFormation Outputs
        CfnOutput(
            self,
            "DataBucketName",
            value=self.data_bucket.bucket_name,
            description="S3 bucket for ML Feature Analyzer datasets and models",
        )

        CfnOutput(
            self,
            "SageMakerRoleArn",
            value=self.sagemaker_role.role_arn,
            description="IAM role ARN for SageMaker Autopilot jobs",
        )

        CfnOutput(
            self,
            "BedrockRoleArn",
            value=self.bedrock_role.role_arn,
            description="IAM role ARN for Bedrock GenAI analysis",
        )

        # Store outputs as instance variables for easy access
        self.bucket_name = self.data_bucket.bucket_name
        self.sagemaker_role_arn = self.sagemaker_role.role_arn
        self.bedrock_role_arn = self.bedrock_role.role_arn
