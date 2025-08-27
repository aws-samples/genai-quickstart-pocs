from aws_cdk import (
    Stack,
    aws_iam as iam,
    aws_s3 as s3,
    CfnOutput,
    RemovalPolicy,
)
from constructs import Construct
from cdklabs.generative_ai_cdk_constructs.bedrock import (
    KnowledgeBase,
    KnowledgeBaseProps,
    SqlKnowledgeBaseConfiguration,
    RedshiftConfiguration,
    RedshiftQueryEngineConfiguration,
    ServerlessConfiguration,
    AuthConfiguration,
    QueryGenerationConfiguration,
    AwsDataCatalogConfiguration,
    StorageConfiguration,
)


class CdkEmrKbStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create S3 bucket for storing data
        bucket = s3.Bucket(
            self, "EmrKbBucket",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            enforce_ssl=True,
        )

        # Create IAM role for Bedrock Knowledge Base
        self.bedrock_kb_role = iam.Role(
            self, "BedrockKbRole",
            assumed_by=iam.ServicePrincipal("bedrock.amazonaws.com"),
            description="Role for Bedrock Knowledge Base to access Redshift Serverless and Glue",
        )

        # Add policies to the role
        self.bedrock_kb_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "redshift-data:GetStatementResult",
                    "redshift-data:DescribeStatement",
                    "redshift-data:CancelStatement",
                    "redshift-data:ExecuteStatement",
                ],
                resources=["*"],
            )
        )

        self.bedrock_kb_role.add_to_policy(
            iam.PolicyStatement(
                actions=["redshift-serverless:GetCredentials"],
                resources=["*"],  # In production, scope this to specific workgroup ARN
            )
        )

        self.bedrock_kb_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "glue:GetDatabases",
                    "glue:GetDatabase",
                    "glue:GetTables",
                    "glue:GetTable",
                    "glue:GetPartitions",
                    "glue:GetPartition",
                    "glue:SearchTables",
                ],
                resources=["*"],
            )
        )

        self.bedrock_kb_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "bedrock:GenerateQuery",
                    "bedrock:RetrieveAndGenerate",
                    "bedrock:Retrieve",
                    "bedrock:InvokeModel",
                ],
                resources=["*"],
            )
        )

        self.bedrock_kb_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "sqlworkbench:GetSqlRecommendations",
                    "sqlworkbench:PutSqlGenerationContext",
                    "sqlworkbench:GetSqlGenerationContext",
                    "sqlworkbench:DeleteSqlGenerationContext",
                ],
                resources=["*"],
            )
        )

        self.bedrock_kb_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "s3:ListBucket",
                    "s3:GetObject",
                ],
                resources=[
                    bucket.bucket_arn,
                    f"{bucket.bucket_arn}/*",
                ],
            )
        )

        self.bedrock_kb_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                resources=["arn:aws:logs:*:*:log-group:/aws/bedrock/*"],
            )
        )

        # Define Knowledge Base name and description
        kb_name = "EMR-SQL-KB"
        kb_description = "SQL knowledge base for EMR troubleshooting"
        glue_database = "emr_kb"

        # Create SQL Knowledge Base with Redshift Serverless configuration
        # Note: You need to replace the workgroup_arn with your actual Redshift Serverless workgroup ARN
        # This can be passed as a parameter or retrieved from SSM Parameter Store
        workgroup_arn = "arn:aws:redshift-serverless:${AWS::Region}:${AWS::AccountId}:workgroup/YOUR_WORKGROUP_ID"

        # Create Knowledge Base with SQL configuration
        knowledge_base = KnowledgeBase(
            self, "BedrockKnowledgeBase",
            knowledge_base_props=KnowledgeBaseProps(
                name=kb_name,
                description=kb_description,
                role_arn=self.bedrock_kb_role.role_arn,
                knowledge_base_configuration=SqlKnowledgeBaseConfiguration(
                    redshift_configuration=RedshiftConfiguration(
                        query_engine_configuration=RedshiftQueryEngineConfiguration(
                            serverless_configuration=ServerlessConfiguration(
                                workgroup_arn=workgroup_arn,
                                auth_configuration=AuthConfiguration(
                                    auth_type="IAM"
                                )
                            )
                        ),
                        query_generation_configuration=QueryGenerationConfiguration(
                            execution_timeout_seconds=60,
                            generation_context={
                                "curatedQueries": []
                            }
                        ),
                        storage_configurations=[
                            StorageConfiguration(
                                aws_data_catalog_configuration=AwsDataCatalogConfiguration(
                                    table_names=[
                                        f"{glue_database}.known_issues",
                                        f"{glue_database}.error_patterns"
                                    ]
                                )
                            )
                        ]
                    )
                )
            )
        )

        # Output the Knowledge Base ID and other important resources
        CfnOutput(
            self, "KnowledgeBaseId",
            value=knowledge_base.knowledge_base_id,
            description="Bedrock Knowledge Base ID"
        )

        CfnOutput(
            self, "S3Bucket",
            value=bucket.bucket_name,
            description="S3 Bucket for EMR KB data"
        )

        CfnOutput(
            self, "BedrockKbRoleArn",
            value=self.bedrock_kb_role.role_arn,
            description="IAM Role ARN for Bedrock Knowledge Base"
        )
