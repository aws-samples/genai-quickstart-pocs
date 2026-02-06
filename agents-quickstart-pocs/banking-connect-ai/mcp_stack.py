"""CDK Stack for Lambda-based MCP targets with VPC connectivity"""
from aws_cdk import (
    Stack,
    aws_lambda as lambda_,
    aws_iam as iam,
    aws_ec2 as ec2,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    CfnOutput,
    Duration,
    Tags,
    RemovalPolicy
)
from constructs import Construct
import json


class MCPStack(Stack):
    """
    Creates Lambda functions that act as MCP servers for AgentCore Gateway.
    Each Lambda implements the MCP protocol and calls the existing card operations Lambda.
    """

    def __init__(self, scope: Construct, construct_id: str, env_name: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.env_name = env_name

        # Create VPC for Lambda functions (optional - can use existing)
        self.vpc = self._create_vpc()

        # Create VPC Gateway Endpoint for DynamoDB (keeps traffic private)
        self.dynamodb_endpoint = self._create_dynamodb_endpoint()

        # Create VPC Gateway Endpoint for S3 (keeps traffic private)
        self.s3_endpoint = self._create_s3_endpoint()

        # Create DynamoDB tables
        self.customers_table = self._create_customers_table()
        self.accounts_table = self._create_accounts_table()
        self.cards_table = self._create_cards_table()
        self.card_requests_table = self._create_card_requests_table()

        # Create S3 bucket for knowledge base
        self.knowledge_base_bucket = self._create_knowledge_base_bucket()

        # Create Card Operations Lambda (the backend Lambda that MCP Lambdas call)
        self.card_operations_lambda = self._create_card_operations_lambda()

        # Create IAM role for MCP Lambda functions
        self.mcp_lambda_role = self._create_mcp_lambda_role()

        # Create Lambda functions for each MCP tool
        self.lock_card_lambda = self._create_lock_card_lambda()
        self.unlock_card_lambda = self._create_unlock_card_lambda()
        self.request_new_card_lambda = self._create_request_new_card_lambda()

        # Create IAM role for AgentCore Gateway
        self.gateway_role = self._create_gateway_role()

        # Grant Gateway permission to invoke Lambda functions
        self._grant_gateway_permissions()

        # Add tags
        self._add_tags()

        # Create outputs
        self._create_outputs()

    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with private subnets"""
        vpc = ec2.Vpc(
            self,
            "MCPVPC",
            vpc_name=f"betterbank-mcp-lambda-vpc-{self.env_name}",
            max_azs=2,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        return vpc

    def _create_dynamodb_endpoint(self) -> ec2.GatewayVpcEndpoint:
        """Create VPC Gateway Endpoint for DynamoDB to keep traffic private"""
        endpoint = ec2.GatewayVpcEndpoint(
            self,
            "DynamoDBEndpoint",
            vpc=self.vpc,
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB,
            subnets=[ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)]
        )
        
        return endpoint

    def _create_s3_endpoint(self) -> ec2.GatewayVpcEndpoint:
        """Create VPC Gateway Endpoint for S3 to keep traffic private"""
        endpoint = ec2.GatewayVpcEndpoint(
            self,
            "S3Endpoint",
            vpc=self.vpc,
            service=ec2.GatewayVpcEndpointAwsService.S3,
            subnets=[ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)]
        )
        
        return endpoint

    def _create_customers_table(self) -> dynamodb.Table:
        """Create DynamoDB table for customers"""
        table = dynamodb.Table(
            self,
            "CustomersTable",
            table_name=f"betterbank-customers-{self.env_name}",
            partition_key=dynamodb.Attribute(
                name="customer_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,  # Change to RETAIN for production
            point_in_time_recovery=True
        )
        
        return table

    def _create_accounts_table(self) -> dynamodb.Table:
        """Create DynamoDB table for accounts with customer_id GSI"""
        table = dynamodb.Table(
            self,
            "AccountsTable",
            table_name=f"betterbank-accounts-{self.env_name}",
            partition_key=dynamodb.Attribute(
                name="account_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,  # Change to RETAIN for production
            point_in_time_recovery=True
        )
        
        # Add GSI for customer_id
        table.add_global_secondary_index(
            index_name="customer_id-index",
            partition_key=dynamodb.Attribute(
                name="customer_id",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL
        )
        
        return table

    def _create_cards_table(self) -> dynamodb.Table:
        """Create DynamoDB table for cards with account_id GSI"""
        table = dynamodb.Table(
            self,
            "CardsTable",
            table_name=f"betterbank-cards-{self.env_name}",
            partition_key=dynamodb.Attribute(
                name="card_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,  # Change to RETAIN for production
            point_in_time_recovery=True
        )
        
        # Add GSI for account_id
        table.add_global_secondary_index(
            index_name="account_id-index",
            partition_key=dynamodb.Attribute(
                name="account_id",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL
        )
        
        return table

    def _create_card_requests_table(self) -> dynamodb.Table:
        """Create DynamoDB table for card requests with customer_id GSI"""
        table = dynamodb.Table(
            self,
            "CardRequestsTable",
            table_name=f"betterbank-card-requests-{self.env_name}",
            partition_key=dynamodb.Attribute(
                name="request_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,  # Change to RETAIN for production
            point_in_time_recovery=True
        )
        
        # Add GSI for customer_id
        table.add_global_secondary_index(
            index_name="customer_id-index",
            partition_key=dynamodb.Attribute(
                name="customer_id",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL
        )
        
        return table

    def _create_knowledge_base_bucket(self) -> s3.Bucket:
        """Create S3 bucket for knowledge base documents"""
        bucket = s3.Bucket(
            self,
            "KnowledgeBaseBucket",
            bucket_name=f"betterbank-knowledge-base-{self.env_name}-{self.account}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            removal_policy=RemovalPolicy.RETAIN,  # Keep data on stack deletion
            auto_delete_objects=False,  # Don't auto-delete for safety
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    noncurrent_version_expiration=Duration.days(90),
                    enabled=True
                )
            ]
        )
        
        return bucket

    def _create_card_operations_lambda(self) -> lambda_.Function:
        """Create the Card Operations Lambda that handles actual business logic"""
        
        # Create IAM role for Card Operations Lambda
        card_ops_role = iam.Role(
            self,
            "CardOpsLambdaRole",
            role_name=f"betterbank-card-ops-lambda-role-{self.env_name}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="IAM role for Card Operations Lambda",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole")
            ]
        )
        
        # Grant DynamoDB permissions to all tables
        self.customers_table.grant_read_write_data(card_ops_role)
        self.accounts_table.grant_read_write_data(card_ops_role)
        self.cards_table.grant_read_write_data(card_ops_role)
        self.card_requests_table.grant_read_write_data(card_ops_role)
        
        # Create Lambda function
        card_ops_lambda = lambda_.Function(
            self,
            "CardOperationsLambda",
            function_name=f"betterbank-card-operations-{self.env_name}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="lambda_handler.handler.lambda_handler",
            code=lambda_.Code.from_asset("src"),
            role=card_ops_role,
            timeout=Duration.seconds(30),
            memory_size=512,
            environment={
                "CUSTOMERS_TABLE": self.customers_table.table_name,
                "ACCOUNTS_TABLE": self.accounts_table.table_name,
                "CARDS_TABLE": self.cards_table.table_name,
                "CARD_REQUESTS_TABLE": self.card_requests_table.table_name,
                "ENVIRONMENT": self.env_name
            },
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)
        )
        
        return card_ops_lambda

    def _create_mcp_lambda_role(self) -> iam.Role:
        """Create IAM role for MCP Lambda functions"""
        role = iam.Role(
            self,
            "MCPLambdaRole",
            role_name=f"betterbank-mcp-lambda-role-{self.env_name}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="IAM role for MCP Lambda functions",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole")
            ]
        )

        # Allow invoking the card operations Lambda
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["lambda:InvokeFunction"],
                resources=[self.card_operations_lambda.function_arn]
            )
        )

        return role

    def _get_mcp_lambda_code(self, tool_name: str, lambda_path: str, description: str, input_schema: dict) -> str:
        """Generate MCP Lambda function code"""
        import json as json_module
        schema_str = json_module.dumps(input_schema)
        
        return f'''import json
import boto3
import os

lambda_client = boto3.client('lambda')
CARD_OPS_FUNCTION = os.environ.get('CARD_OPS_FUNCTION_NAME', 'betterbank-card-operations-{self.env_name}')

def lambda_handler(event, context):
    """
    MCP Lambda handler for {tool_name}
    Implements MCP protocol and forwards to card operations Lambda
    """
    
    # Parse MCP request
    try:
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', event)
        
        method = body.get('method')
        params = body.get('params', {{}})
        request_id = body.get('id')
        
        # Handle tools/list
        if method == 'tools/list':
            return {{
                'statusCode': 200,
                'body': json.dumps({{
                    'jsonrpc': '2.0',
                    'result': {{
                        'tools': [{{
                            'name': '{tool_name}',
                            'description': '{description}',
                            'inputSchema': {schema_str}
                        }}]
                    }},
                    'id': request_id
                }})
            }}
        
        # Handle tools/call
        elif method == 'tools/call':
            tool_name = params.get('name')
            arguments = params.get('arguments', {{}})
            
            if tool_name != '{tool_name}':
                return {{
                    'statusCode': 400,
                    'body': json.dumps({{
                        'jsonrpc': '2.0',
                        'error': {{
                            'code': -32602,
                            'message': f'Unknown tool: {{tool_name}}'
                        }},
                        'id': request_id
                    }})
                }}
            
            # Invoke card operations Lambda
            card_ops_event = {{
                'httpMethod': 'POST',
                'path': '{lambda_path}',
                'body': json.dumps(arguments)
            }}
            
            response = lambda_client.invoke(
                FunctionName=CARD_OPS_FUNCTION,
                InvocationType='RequestResponse',
                Payload=json.dumps(card_ops_event)
            )
            
            payload = json.loads(response['Payload'].read())
            status_code = payload.get('statusCode', 500)
            result_body = json.loads(payload.get('body', '{{}}'))
            
            if status_code == 200:
                return {{
                    'statusCode': 200,
                    'body': json.dumps({{
                        'jsonrpc': '2.0',
                        'result': result_body,
                        'id': request_id
                    }})
                }}
            else:
                return {{
                    'statusCode': status_code,
                    'body': json.dumps({{
                        'jsonrpc': '2.0',
                        'error': {{
                            'code': status_code,
                            'message': result_body.get('error', {{}}).get('message', 'Unknown error')
                        }},
                        'id': request_id
                    }})
                }}
        
        else:
            return {{
                'statusCode': 400,
                'body': json.dumps({{
                    'jsonrpc': '2.0',
                    'error': {{
                        'code': -32601,
                        'message': f'Method not found: {{method}}'
                    }},
                    'id': request_id
                }})
            }}
    
    except Exception as e:
        return {{
            'statusCode': 500,
            'body': json.dumps({{
                'jsonrpc': '2.0',
                'error': {{
                    'code': -32603,
                    'message': f'Internal error: {{str(e)}}'
                }},
                'id': request_id if 'request_id' in locals() else None
            }})
        }}
'''

    def _create_lock_card_lambda(self) -> lambda_.Function:
        """Create Lambda function for lock_card MCP tool"""
        return lambda_.Function(
            self,
            "LockCardMCP",
            function_name=f"betterbank-mcp-lock-card-{self.env_name}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.lambda_handler",
            code=lambda_.Code.from_inline(self._get_mcp_lambda_code(
                tool_name="lock_card",
                lambda_path="/v1/cards/lock",
                description="Lock a customer's debit card to prevent transactions",
                input_schema={
                    "type": "object",
                    "properties": {
                        "customer_id": {"type": "string", "description": "Customer ID"},
                        "card_id": {"type": "string", "description": "Card ID to lock"}
                    },
                    "required": ["customer_id", "card_id"]
                }
            )),
            role=self.mcp_lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "CARD_OPS_FUNCTION_NAME": self.card_operations_lambda.function_name
            },
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)
        )

    def _create_unlock_card_lambda(self) -> lambda_.Function:
        """Create Lambda function for unlock_card MCP tool"""
        return lambda_.Function(
            self,
            "UnlockCardMCP",
            function_name=f"betterbank-mcp-unlock-card-{self.env_name}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.lambda_handler",
            code=lambda_.Code.from_inline(self._get_mcp_lambda_code(
                tool_name="unlock_card",
                lambda_path="/v1/cards/unlock",
                description="Unlock a customer's debit card to restore transactions",
                input_schema={
                    "type": "object",
                    "properties": {
                        "customer_id": {"type": "string", "description": "Customer ID"},
                        "card_id": {"type": "string", "description": "Card ID to unlock"}
                    },
                    "required": ["customer_id", "card_id"]
                }
            )),
            role=self.mcp_lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "CARD_OPS_FUNCTION_NAME": self.card_operations_lambda.function_name
            },
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)
        )

    def _create_request_new_card_lambda(self) -> lambda_.Function:
        """Create Lambda function for request_new_card MCP tool"""
        return lambda_.Function(
            self,
            "RequestNewCardMCP",
            function_name=f"betterbank-mcp-request-new-card-{self.env_name}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.lambda_handler",
            code=lambda_.Code.from_inline(self._get_mcp_lambda_code(
                tool_name="request_new_card",
                lambda_path="/v1/cards/request-new",
                description="Request a replacement debit card",
                input_schema={
                    "type": "object",
                    "properties": {
                        "customer_id": {"type": "string", "description": "Customer ID"},
                        "account_id": {"type": "string", "description": "Account ID"},
                        "reason": {"type": "string", "description": "Reason for replacement"},
                        "delivery_address": {"type": "string", "description": "Delivery address"}
                    },
                    "required": ["customer_id", "account_id"]
                }
            )),
            role=self.mcp_lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "CARD_OPS_FUNCTION_NAME": self.card_operations_lambda.function_name
            },
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)
        )

    def _create_gateway_role(self) -> iam.Role:
        """Create IAM role for AgentCore Gateway"""
        role = iam.Role(
            self,
            "GatewayRole",
            role_name=f"betterbank-gateway-role-{self.env_name}",
            assumed_by=iam.ServicePrincipal("bedrock-agentcore.amazonaws.com"),
            description="IAM role for AgentCore Gateway to invoke MCP Lambda functions"
        )

        # Allow invoking all MCP Lambda functions
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["lambda:InvokeFunction"],
                resources=[
                    self.lock_card_lambda.function_arn,
                    self.unlock_card_lambda.function_arn,
                    self.request_new_card_lambda.function_arn
                ]
            )
        )

        return role

    def _grant_gateway_permissions(self):
        """Grant AgentCore Gateway permission to invoke Lambda functions"""
        
        # Grant permission for lock_card Lambda
        self.lock_card_lambda.add_permission(
            "AllowAgentCoreGateway",
            principal=iam.ServicePrincipal("bedrock-agentcore.amazonaws.com"),
            action="lambda:InvokeFunction",
            source_arn=f"arn:aws:bedrock-agentcore:{self.region}:{self.account}:gateway/*"
        )

        # Grant permission for unlock_card Lambda
        self.unlock_card_lambda.add_permission(
            "AllowAgentCoreGateway",
            principal=iam.ServicePrincipal("bedrock-agentcore.amazonaws.com"),
            action="lambda:InvokeFunction",
            source_arn=f"arn:aws:bedrock-agentcore:{self.region}:{self.account}:gateway/*"
        )

        # Grant permission for request_new_card Lambda
        self.request_new_card_lambda.add_permission(
            "AllowAgentCoreGateway",
            principal=iam.ServicePrincipal("bedrock-agentcore.amazonaws.com"),
            action="lambda:InvokeFunction",
            source_arn=f"arn:aws:bedrock-agentcore:{self.region}:{self.account}:gateway/*"
        )

    def _add_tags(self):
        """Add tags to all resources"""
        Tags.of(self).add("Environment", self.env_name)
        Tags.of(self).add("Project", "betterbank-jeanie")
        Tags.of(self).add("ManagedBy", "CDK")

    def _create_outputs(self):
        """Create CloudFormation outputs"""
        CfnOutput(
            self,
            "GatewayRoleArn",
            value=self.gateway_role.role_arn,
            description="*** USE THIS as Gateway execution role ARN ***"
        )

        CfnOutput(
            self,
            "CardOperationsLambdaArn",
            value=self.card_operations_lambda.function_arn,
            description="Card Operations Lambda ARN (backend Lambda)"
        )

        CfnOutput(
            self,
            "LockCardLambdaArn",
            value=self.lock_card_lambda.function_arn,
            description="Lambda ARN for lock_card target"
        )

        CfnOutput(
            self,
            "UnlockCardLambdaArn",
            value=self.unlock_card_lambda.function_arn,
            description="Lambda ARN for unlock_card target"
        )

        CfnOutput(
            self,
            "RequestNewCardLambdaArn",
            value=self.request_new_card_lambda.function_arn,
            description="Lambda ARN for request_new_card target"
        )

        CfnOutput(
            self,
            "CustomersTableName",
            value=self.customers_table.table_name,
            description="DynamoDB Customers table name"
        )

        CfnOutput(
            self,
            "AccountsTableName",
            value=self.accounts_table.table_name,
            description="DynamoDB Accounts table name"
        )

        CfnOutput(
            self,
            "CardsTableName",
            value=self.cards_table.table_name,
            description="DynamoDB Cards table name"
        )

        CfnOutput(
            self,
            "CardRequestsTableName",
            value=self.card_requests_table.table_name,
            description="DynamoDB Card Requests table name"
        )

        CfnOutput(
            self,
            "KnowledgeBaseBucketName",
            value=self.knowledge_base_bucket.bucket_name,
            description="S3 bucket for knowledge base documents"
        )

        CfnOutput(
            self,
            "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID for MCP Lambda functions"
        )

        CfnOutput(
            self,
            "DynamoDBEndpointId",
            value=self.dynamodb_endpoint.vpc_endpoint_id,
            description="DynamoDB VPC Gateway Endpoint ID (keeps DynamoDB traffic private)"
        )

        CfnOutput(
            self,
            "S3EndpointId",
            value=self.s3_endpoint.vpc_endpoint_id,
            description="S3 VPC Gateway Endpoint ID (keeps S3 traffic private)"
        )
