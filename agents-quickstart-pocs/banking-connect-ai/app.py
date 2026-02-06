#!/usr/bin/env python3
"""CDK App for Lambda-based MCP deployment with VPC connectivity"""
import os
import aws_cdk as cdk
from mcp_stack import MCPStack
from session_lambda_stack import SessionLambdaStack

app = cdk.App()

# Get environment from context or use default
env_name = app.node.try_get_context("environment") or "dev"

# Environment configuration
env_config = cdk.Environment(
    account=os.getenv('CDK_DEFAULT_ACCOUNT'),
    region=os.getenv('CDK_DEFAULT_REGION')
)

# Create Lambda MCP stack (fully private, bank-compliant)
MCPStack(
    app,
    f"betterbank-mcp-lambda-{env_name}",
    env_name=env_name,
    env=env_config,
    description=f"BetterBank MCP Lambda functions for AgentCore Gateway ({env_name})"
)

# Create Session Lambda stack (Connect Assistant session data)
# Note: connect_instance_id and ai_assistant_id can be updated later via CDK context or environment variables
connect_instance_id = app.node.try_get_context("connect_instance_id") or os.getenv("CONNECT_INSTANCE_ID", "PLACEHOLDER")
ai_assistant_id = app.node.try_get_context("ai_assistant_id") or os.getenv("AI_ASSISTANT_ID", "PLACEHOLDER")

SessionLambdaStack(
    app,
    f"betterbank-session-lambda-{env_name}",
    env_name=env_name,
    connect_instance_id=connect_instance_id,
    ai_assistant_id=ai_assistant_id,
    env=env_config,
    description=f"BetterBank Connect Assistant Update Session Data Lambda ({env_name})"
)

app.synth()
