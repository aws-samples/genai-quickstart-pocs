#!/usr/bin/env python3
"""CDK App for Lambda-based MCP deployment with VPC connectivity"""
import os
import aws_cdk as cdk
from mcp_stack import MCPStack

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

# Note: Session Lambda is deployed separately via CloudFormation template
# See docs/PREREQUISITES.md for instructions on deploying assistant-update-session-data-lambda-customer.yaml

app.synth()
