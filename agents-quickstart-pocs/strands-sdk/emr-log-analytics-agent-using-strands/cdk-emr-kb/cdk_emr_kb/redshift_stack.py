from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_redshiftserverless as redshift_serverless,
    aws_s3 as s3,
    CfnOutput,
)
from constructs import Construct
from typing import Optional


class RedshiftStack(Stack):
    """
    Redshift Serverless stack for EMR Knowledge Base infrastructure.
    Creates a Redshift Serverless namespace and workgroup with proper configuration.
    """

    def __init__(self,
                 scope: Construct,
                 construct_id: str,
                 vpc: ec2.Vpc,
                 security_group: ec2.SecurityGroup,
                 config: dict,
                 s3_bucket: Optional[s3.Bucket] = None,
                 **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Extract Redshift configuration
        redshift_config = config.get("redshift", {})
        namespace_name = redshift_config.get("namespaceName", "emr-kb-namespace")
        workgroup_name = redshift_config.get("workgroupName", "emr-kb-workgroup")
        database_name = redshift_config.get("databaseName", "dev")
        base_capacity = redshift_config.get("baseCapacity", 8)

        # Store the S3 bucket reference
        self.s3_bucket = s3_bucket

        # Create IAM role for Redshift Serverless
        self.role = self._create_redshift_role()

        # Create Redshift Serverless namespace
        self.namespace = redshift_serverless.CfnNamespace(
            self, "RedshiftServerlessNamespace",
            namespace_name=namespace_name,
            # Let AWS manage the admin password
            admin_username="admin",
            manage_admin_password=True,
            db_name=database_name,
            iam_roles=[self.role.role_arn],
            log_exports=["userlog", "connectionlog", "useractivitylog"],
            tags=[{"key": "Purpose", "value": "EMRKnowledgeBase"}]
        )

        # Create Redshift Serverless workgroup
        self.workgroup = redshift_serverless.CfnWorkgroup(
            self, "RedshiftServerlessWorkgroup",
            workgroup_name=workgroup_name,
            namespace_name=namespace_name,
            base_capacity=base_capacity,
            enhanced_vpc_routing=True,
            publicly_accessible=False,
            security_group_ids=[security_group.security_group_id],
            subnet_ids=[subnet.subnet_id for subnet in vpc.private_subnets],
            config_parameters=[
                {"parameterKey": "enable_user_activity_logging", "parameterValue": "true"},
                {"parameterKey": "max_query_execution_time", "parameterValue": "14400"}
            ],
            tags=[{"key": "Purpose", "value": "EMRKnowledgeBase"}]
        )

        # Add dependency to ensure namespace is created before workgroup
        self.workgroup.add_depends_on(self.namespace)

        # Create outputs
        self._create_outputs()

    def _create_redshift_role(self) -> iam.Role:
        """Create IAM role for Redshift Serverless with necessary policies."""
        role = iam.Role(
            self, "RedshiftServerlessRole",
            assumed_by=iam.CompositePrincipal(
                iam.ServicePrincipal("redshift.amazonaws.com"),
                iam.ServicePrincipal("redshift-serverless.amazonaws.com")
            ),
            description="Role for Redshift Serverless to access S3 and other AWS services",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonS3ReadOnlyAccess")
            ]
        )

        # Add CloudWatch Logs policy
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogStreams"
                ],
                resources=[
                    f"arn:aws:logs:{self.region}:{self.account}:log-group:/aws/redshift-serverless/*",
                    f"arn:aws:logs:{self.region}:{self.account}:log-group:/aws/redshift-serverless/*:log-stream:*"
                ]
            )
        )

        # Add Glue policy for data catalog access
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "glue:CreateDatabase",
                    "glue:DeleteDatabase",
                    "glue:GetDatabase",
                    "glue:GetDatabases",
                    "glue:UpdateDatabase",
                    "glue:CreateTable",
                    "glue:DeleteTable",
                    "glue:BatchDeleteTable",
                    "glue:UpdateTable",
                    "glue:GetTable",
                    "glue:GetTables",
                    "glue:BatchCreatePartition",
                    "glue:CreatePartition",
                    "glue:DeletePartition",
                    "glue:BatchDeletePartition",
                    "glue:UpdatePartition",
                    "glue:GetPartition",
                    "glue:GetPartitions",
                    "glue:BatchGetPartition"
                ],
                resources=[
                    f"arn:aws:glue:{self.region}:{self.account}:catalog",
                    f"arn:aws:glue:{self.region}:{self.account}:database/*",
                    f"arn:aws:glue:{self.region}:{self.account}:table/*/*"
                ]
            )
        )

        # Add Lake Formation policy for data access
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "lakeformation:GetDataAccess"
                ],
                resources=["*"]
            )
        )

        # Add S3 write access if a bucket is provided
        if self.s3_bucket:
            role.add_to_policy(
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:GetObject",
                        "s3:GetObjectVersion",
                        "s3:ListBucket",
                        "s3:ListBucketVersions",
                        "s3:PutObject",
                        "s3:DeleteObject"
                    ],
                    resources=[
                        self.s3_bucket.bucket_arn,
                        f"{self.s3_bucket.bucket_arn}/*"
                    ]
                )
            )

        # Create a custom policy for Redshift Spectrum
        spectrum_policy = iam.ManagedPolicy(
            self, "RedshiftSpectrumPolicy",
            description="Policy for Redshift Spectrum to access Glue Data Catalog",
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
                        f"arn:aws:glue:{self.region}:{self.account}:database/*",
                        f"arn:aws:glue:{self.region}:{self.account}:table/*/*"
                    ]
                ),
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:GetObject",
                        "s3:ListBucket"
                    ],
                    resources=["*"]
                )
            ]
        )

        # Attach the custom policy to the role
        role.add_managed_policy(spectrum_policy)

        return role

    def _create_outputs(self) -> None:
        """Create CloudFormation outputs."""
        CfnOutput(
            self, "RedshiftServerlessNamespaceName",
            value=self.namespace.namespace_name,
            description="Name of the Redshift Serverless namespace",
            export_name=f"{self.stack_name}-NamespaceName"
        )

        CfnOutput(
            self, "RedshiftServerlessWorkgroupName",
            value=self.workgroup.workgroup_name,
            description="Name of the Redshift Serverless workgroup",
            export_name=f"{self.stack_name}-WorkgroupName"
        )

        # Use ref instead of attr_ properties
        CfnOutput(
            self, "RedshiftServerlessWorkgroupRef",
            value=self.workgroup.ref,
            description="Reference for the Redshift Serverless workgroup",
            export_name=f"{self.stack_name}-WorkgroupRef"
        )

        CfnOutput(
            self, "RedshiftServerlessRoleArn",
            value=self.role.role_arn,
            description="ARN of the Redshift Serverless IAM Role",
            export_name=f"{self.stack_name}-RedshiftServerlessRoleArn"
        )
