"""CDK Stack for Connect Assistant Update Session Data Lambda"""
from aws_cdk import (
    Stack,
    aws_lambda as lambda_,
    aws_iam as iam,
    CfnOutput,
    Duration,
    Tags
)
from constructs import Construct


class SessionLambdaStack(Stack):
    """
    Deploys the ConnectAssistantUpdateSessionData Lambda function.
    This Lambda updates Amazon Connect Wisdom (Q Connect) session data
    with customer information during contact flows.
    """

    def __init__(self, scope: Construct, construct_id: str, env_name: str, 
                 connect_instance_id: str, ai_assistant_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.env_name = env_name
        self.connect_instance_id = connect_instance_id
        self.ai_assistant_id = ai_assistant_id

        # Create IAM role for Lambda
        self.lambda_role = self._create_lambda_role()

        # Create Lambda function
        self.session_lambda = self._create_session_lambda()

        # Add tags
        self._add_tags()

        # Create outputs
        self._create_outputs()

    def _create_lambda_role(self) -> iam.Role:
        """Create IAM role for the session Lambda function"""
        role = iam.Role(
            self,
            "LambdaExecutionRole",
            role_name=f"connect-session-lambda-role-{self.env_name}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Execution role for Connect Assistant Update Session Data Lambda",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        # Allow Connect DescribeContact
        role.add_to_policy(
            iam.PolicyStatement(
                sid="ConnectDescribeContactPolicy",
                effect=iam.Effect.ALLOW,
                actions=["connect:DescribeContact"],
                resources=[
                    f"arn:aws:connect:{self.region}:{self.account}:instance/{self.connect_instance_id}/contact/*"
                ]
            )
        )

        # Allow Wisdom (Q Connect) UpdateSessionData
        role.add_to_policy(
            iam.PolicyStatement(
                sid="WisdomUpdateSessionDataPolicy",
                effect=iam.Effect.ALLOW,
                actions=["wisdom:UpdateSessionData"],
                resources=[
                    f"arn:aws:wisdom:{self.region}:{self.account}:session/{self.ai_assistant_id}/*"
                ]
            )
        )

        return role

    def _create_session_lambda(self) -> lambda_.Function:
        """Create the session update Lambda function"""
        
        # Read the Lambda code
        with open("src/session_lambda/index.js", "r", encoding="utf-8") as f:
            lambda_code = f.read()

        return lambda_.Function(
            self,
            "SessionLambda",
            function_name=f"ConnectAssistantUpdateSessionData-{self.env_name}",
            runtime=lambda_.Runtime.NODEJS_20_X,
            handler="index.handler",
            code=lambda_.Code.from_inline(lambda_code),
            role=self.lambda_role,
            timeout=Duration.seconds(30),
            memory_size=128,
            description="Updates Amazon Connect Wisdom session data with customer information",
            environment={
                "AI_ASSISTANT_ID": self.ai_assistant_id,
                "CONNECT_INSTANCE_ID": self.connect_instance_id
            }
        )

    def _add_tags(self):
        """Add tags to all resources"""
        Tags.of(self).add("Environment", self.env_name)
        Tags.of(self).add("Project", "betterbank-jeanie")
        Tags.of(self).add("ManagedBy", "CDK")
        Tags.of(self).add("Component", "Connect-Session")

    def _create_outputs(self):
        """Create CloudFormation outputs"""
        CfnOutput(
            self,
            "LambdaFunctionArn",
            value=self.session_lambda.function_arn,
            description="ARN of the Lambda function",
            export_name=f"SessionStack-LambdaArn-{self.env_name}"
        )

        CfnOutput(
            self,
            "LambdaFunctionName",
            value=self.session_lambda.function_name,
            description="Name of the Lambda function",
            export_name=f"SessionStack-LambdaName-{self.env_name}"
        )

        CfnOutput(
            self,
            "LambdaExecutionRoleArn",
            value=self.lambda_role.role_arn,
            description="ARN of the Lambda execution role",
            export_name=f"SessionStack-RoleArn-{self.env_name}"
        )
