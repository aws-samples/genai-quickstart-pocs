from aws_cdk import (
    Stack,
    aws_iam as iam,
    aws_s3 as s3,
    CfnOutput,
    aws_bedrock as bedrock,
)
from constructs import Construct

# Import generative-ai-cdk-constructs

# Import custom constructs
from cdk_emr_kb.constructs.lake_formation_permissions import LakeFormationPermissions


class BedrockStack(Stack):
    """
    Bedrock Knowledge Base stack for EMR Knowledge Base infrastructure.
    Creates a Bedrock Knowledge Base with SQL configuration.
    """

    def __init__(self, scope: Construct, construct_id: str, workgroup_arn: str,
                 glue_database: str, s3_bucket: s3.Bucket, config: dict, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Extract Bedrock configuration
        bedrock_config = config.get("bedrock", {})
        kb_name = bedrock_config.get("kbName", "EMR-SQL-KB")
        kb_description = bedrock_config.get("kbDescription", "SQL knowledge base for EMR troubleshooting")
        model_id = bedrock_config.get("modelId", "anthropic.claude-3-sonnet-20240229-v1:0")

        # Create IAM roles for Bedrock
        self.bedrock_kb_role = self._create_bedrock_kb_role(workgroup_arn, glue_database, s3_bucket)
        self.bedrock_agent_role = self._create_bedrock_agent_role()

        # Create Bedrock Knowledge Base
        self.knowledge_base = self._create_knowledge_base(
            kb_name,
            kb_description,
            model_id,
            workgroup_arn,
            glue_database,
            s3_bucket
        )

        # Configure Lake Formation permissions
        self.lake_formation_permissions = LakeFormationPermissions(
            self, "LakeFormationPermissions",
            database_name=glue_database,
            principal_arn=self.bedrock_kb_role.role_arn
        )

        # Add dependency to ensure role is created before permissions are granted
        self.lake_formation_permissions.node.add_dependency(self.bedrock_kb_role)

        # Create outputs
        self._create_outputs()

    def _create_bedrock_kb_role(self, workgroup_arn: str, glue_database: str, s3_bucket: s3.Bucket) -> iam.Role:
        """Create IAM role for Bedrock Knowledge Base."""
        role = iam.Role(
            self, "BedrockKBRole",
            assumed_by=iam.ServicePrincipal("bedrock.amazonaws.com"),
            description="Role for Bedrock Knowledge Base to access Redshift, Glue, and S3"
        )

        # Add Redshift policy
        redshift_policy = iam.ManagedPolicy(
            self, "BedrockRedshiftPolicy",
            description="Policy for Bedrock to access Redshift Serverless",
            statements=[
                # Workgroup-specific permissions
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "redshift-serverless:GetCredentials",
                        "redshift-serverless:DescribeWorkgroup",
                        "redshift-data:ExecuteStatement",
                    ],
                    resources=[
                        workgroup_arn,
                        f"arn:aws:redshift-serverless:{self.region}:{self.account}:namespace/*"
                    ]
                ),
                # Redshift Data API permissions that need to be allowed on all resources
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "redshift-data:GetStatementResult",
                        "redshift-data:DescribeStatement",
                        "redshift-data:CancelStatement"
                    ],
                    resources=["*"],
                    conditions={
                        "StringEquals": {
                            "redshift-data:statement-owner-iam-userid": "${aws:userid}"
                        }
                    }
                ),
                # Additional Redshift Data API permissions
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "redshift-data:ListSchemas",
                        "redshift-data:ListTables",
                        "redshift-data:DescribeTable"
                    ],
                    resources=["*"]
                )
            ]
        )

        # Add Glue policy
        glue_policy = iam.ManagedPolicy(
            self, "BedrockGluePolicy",
            description="Policy for Bedrock to access Glue Data Catalog",
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "glue:GetDatabase",
                        "glue:GetDatabases",
                        "glue:GetTable",
                        "glue:GetTables",
                        "glue:GetPartition",
                        "glue:GetPartitions",
                        "glue:BatchGetPartition"
                    ],
                    resources=[
                        f"arn:aws:glue:{self.region}:{self.account}:catalog",
                        f"arn:aws:glue:{self.region}:{self.account}:database/{glue_database}",
                        f"arn:aws:glue:{self.region}:{self.account}:table/{glue_database}/*"
                    ]
                ),
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "lakeformation:GetDataAccess"
                    ],
                    resources=["*"]
                )
            ]
        )

        # Add S3 policy
        s3_policy = iam.ManagedPolicy(
            self, "BedrockS3Policy",
            description="Policy for Bedrock to access S3",
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:GetObject",
                        "s3:ListBucket",
                        "s3:PutObject"
                    ],
                    resources=[
                        s3_bucket.bucket_arn,
                        f"{s3_bucket.bucket_arn}/*"
                    ]
                )
            ]
        )

        # Add Bedrock API permissions
        bedrock_api_policy = iam.ManagedPolicy(
            self, "BedrockAPIPolicy",
            description="Policy for Bedrock Knowledge Base to access Bedrock APIs",
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "bedrock:GenerateQuery",
                        "bedrock:RetrieveAndGenerate",
                        "bedrock:Retrieve",
                        "bedrock:InvokeModel"
                    ],
                    resources=["*"]
                )
            ]
        )

        # Add SQL Workbench policy
        sql_workbench_policy = iam.ManagedPolicy(
            self, "SqlWorkbenchPolicy",
            description="Policy for Bedrock to access SQL Workbench",
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "sqlworkbench:GetSqlRecommendations",
                        "sqlworkbench:PutSqlGenerationContext",
                        "sqlworkbench:GetSqlGenerationContext",
                        "sqlworkbench:DeleteSqlGenerationContext"
                    ],
                    resources=["*"]
                )
            ]
        )

        # Add CloudWatch Logs policy
        logs_policy = iam.ManagedPolicy(
            self, "BedrockLogsPolicy",
            description="Policy for Bedrock to write logs",
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        "logs:DescribeLogStreams"
                    ],
                    resources=[
                        f"arn:aws:logs:{self.region}:{self.account}:log-group:/aws/bedrock/*"
                    ]
                )
            ]
        )

        # SQL Workbench permissions are handled by the managed policy

        # Attach policies to role
        role.add_managed_policy(redshift_policy)
        role.add_managed_policy(glue_policy)
        role.add_managed_policy(s3_policy)
        role.add_managed_policy(bedrock_api_policy)
        role.add_managed_policy(sql_workbench_policy)
        role.add_managed_policy(logs_policy)

        return role

    def _create_bedrock_agent_role(self) -> iam.Role:
        """Create IAM role for Bedrock Agent."""
        role = iam.Role(
            self, "BedrockAgentRole",
            assumed_by=iam.ServicePrincipal("bedrock.amazonaws.com"),
            description="Role for Bedrock Agent to access Knowledge Base"
        )

        # Add Bedrock policy
        bedrock_policy = iam.ManagedPolicy(
            self, "BedrockAgentBedrockPolicy",
            description="Policy for Bedrock Agent to access Bedrock services",
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "bedrock:InvokeModel",
                        "bedrock:Retrieve",
                        "bedrock:RetrieveAndGenerate"
                    ],
                    resources=["*"]
                )
            ]
        )

        # Add CloudWatch Logs policy
        logs_policy = iam.ManagedPolicy(
            self, "BedrockAgentLogsPolicy",
            description="Policy for Bedrock Agent to write logs",
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        "logs:DescribeLogStreams"
                    ],
                    resources=[
                        f"arn:aws:logs:{self.region}:{self.account}:log-group:/aws/bedrock/*"
                    ]
                )
            ]
        )

        # Attach policies to role
        role.add_managed_policy(bedrock_policy)
        role.add_managed_policy(logs_policy)

        return role

    def _create_knowledge_base(self, kb_name: str, kb_description: str, model_id: str,
                               workgroup_arn: str, glue_database: str, s3_bucket: s3.Bucket):
        """Create Bedrock Knowledge Base with SQL configuration using L1 constructs."""
        # Create SQL Knowledge Base with Redshift Serverless configuration using L1 constructs
        knowledge_base = bedrock.CfnKnowledgeBase(
            self, "BedrockKnowledgeBase",
            name=kb_name,
            description=kb_description,
            role_arn=self.bedrock_kb_role.role_arn,
            knowledge_base_configuration={
                "type": "SQL",
                "sqlKnowledgeBaseConfiguration": {
                    "type": "REDSHIFT",
                    "redshiftConfiguration": {
                        "queryEngineConfiguration": {
                            "type": "SERVERLESS",
                            "serverlessConfiguration": {
                                "workgroupArn": workgroup_arn,
                                "authConfiguration": {
                                    "type": "IAM"
                                }
                            }
                        },
                        "queryGenerationConfiguration": {
                            "executionTimeoutSeconds": 60,
                            "generationContext": {
                                "curatedQueries": []
                            }
                        },
                        "storageConfigurations": [{
                            "type": "AWS_DATA_CATALOG",
                            "awsDataCatalogConfiguration": {
                                "tableNames": [
                                    f"{glue_database}.known_issues",
                                    f"{glue_database}.error_patterns"
                                ]
                            }
                        }]
                    }
                }
            }
        )

        # Add properties to make the knowledge base compatible with the rest of the code
        knowledge_base.knowledge_base_id = knowledge_base.attr_knowledge_base_id
        knowledge_base.knowledge_base_arn = knowledge_base.attr_knowledge_base_arn

        return knowledge_base

    def _create_outputs(self) -> None:
        """Create CloudFormation outputs."""
        CfnOutput(
            self, "BedrockKnowledgeBaseId",
            value=self.knowledge_base.knowledge_base_id,
            description="ID of the Bedrock Knowledge Base",
            export_name=f"{self.stack_name}-KnowledgeBaseId"
        )

        CfnOutput(
            self, "BedrockKnowledgeBaseArn",
            value=self.knowledge_base.knowledge_base_arn,
            description="ARN of the Bedrock Knowledge Base",
            export_name=f"{self.stack_name}-KnowledgeBaseArn"
        )

        CfnOutput(
            self, "BedrockKBRoleArn",
            value=self.bedrock_kb_role.role_arn,
            description="ARN of the Bedrock Knowledge Base Role",
            export_name=f"{self.stack_name}-BedrockKBRoleArn"
        )

        CfnOutput(
            self, "BedrockAgentRoleArn",
            value=self.bedrock_agent_role.role_arn,
            description="ARN of the Bedrock Agent Role",
            export_name=f"{self.stack_name}-BedrockAgentRoleArn"
        )
