#!/usr/bin/env python3
"""
Gateway Deploy - Initial MCP Gateway Setup
Creates Cognito resources, MCP gateway, and initial Lambda target
Run this ONCE for initial setup
"""

import boto3
import json
import os
from bedrock_agentcore_starter_toolkit.operations.gateway.client import GatewayClient
import logging

def get_lambda_arn():
    """Dynamically discover the pe-data-service Lambda ARN"""
    lambda_client = boto3.client('lambda', region_name='us-east-1')
    
    try:
        response = lambda_client.get_function(FunctionName='pe-data-service')
        return response['Configuration']['FunctionArn']
    except lambda_client.exceptions.ResourceNotFoundException:
        print("❌ Lambda function 'pe-data-service' not found!")
        print("Please run deploy_lambdas.py first")
        return None

def main():
    # Check for AWS credentials
    if not os.environ.get('AWS_PROFILE') and not os.environ.get('AWS_ACCESS_KEY_ID'):
        print("❌ AWS credentials not found!")
        print("Please set AWS_PROFILE environment variable:")
        print("   AWS_PROFILE=your-profile-name uv run gateway_deploy.py")
        return

    # Check if gateway already exists
    secrets_client = boto3.client('secretsmanager', region_name='us-east-1')
    
    try:
        secrets_client.get_secret_value(SecretId='pe_mcp_auth')
        print("⚠️  MCP Gateway already exists!")
        print("Use gateway_update.py to update existing gateway")
        print("Or delete the 'pe_mcp_auth' secret to start fresh")
        return
    except secrets_client.exceptions.ResourceNotFoundException:
        pass  # Good, no existing gateway
    
    # Get Lambda ARN
    lambda_arn = get_lambda_arn()
    if not lambda_arn:
        return
    
    print(f"✅ Found Lambda function: {lambda_arn}")
    
    # Setup the client
    client = GatewayClient(region_name="us-east-1")
    client.logger.setLevel(logging.INFO)
    
    print("🔧 Creating Cognito resources...")
    
    # Create cognito authorizer
    cognito_response = client.create_oauth_authorizer_with_cognito("PE_Data_Auth")
    
    print("🔧 Creating MCP Gateway...")
    
    # Create the gateway
    gateway = client.create_mcp_gateway(
        name='PE-Data-Gateway',
        role_arn=None,  # Let it create the role
        authorizer_config=cognito_response["authorizer_config"],
        enable_semantic_search=True,
    )
    
    print("🔧 Saving configuration to Secrets Manager...")
    
    # Save to secrets manager
    secrets_client.create_secret(
        Name='pe_mcp_auth',
        SecretString=json.dumps({
            "authorizer_config": cognito_response["authorizer_config"],
            "client_info": cognito_response["client_info"],
            "gateway_id": gateway['gatewayId'],
            "gateway_url": gateway['gatewayUrl'],
        })
    )
    
    print("🔧 Creating Lambda target...")
    
    # Create Lambda target with simplified MCP tool schema
    target_payload = {
        "lambdaArn": lambda_arn,
        "toolSchema": {
            "inlinePayload": [
                {
                    "name": "pe_data_service",
                    "description": "Unified PE data service for all fund, investor, and document operations",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "operation": {
                                "type": "string",
                                "description": "The data operation to perform: get_investors, get_investments, get_fund_mapping, get_redemption_requests, or get_fund_document"
                            },
                            "filters": {
                                "type": "object",
                                "description": "Filters to apply (varies by operation)",
                                "properties": {
                                    "investor_id": {"type": "string"},
                                    "fund_id": {"type": "string"},
                                    "fund_name": {"type": "string"},
                                    "investor_class": {"type": "string"},
                                    "investor_name": {"type": "string"},
                                    "status": {"type": "string"},
                                    "min_amount": {"type": "number"},
                                    "max_amount": {"type": "number"},
                                    "min_net_worth": {"type": "number"},
                                    "max_net_worth": {"type": "number"},
                                    "start_date": {"type": "string"},
                                    "end_date": {"type": "string"},
                                    "limit": {"type": "integer"}
                                }
                            }
                        },
                        "required": ["operation"]
                    }
                }
            ]
        }
    }
    
    try:
        lambda_target = client.create_mcp_gateway_target(
            gateway=gateway,
            name='pe-data-service',
            target_type="lambda",
            target_payload=target_payload,
            credentials=None,
        )
        print("✅ Created Lambda target: pe-data-service")
        
    except Exception as e:
        print(f"⚠️  Error creating Lambda target: {e}")
        print("You can create it later with gateway_update.py")
    
    print(f"\n🎉 Gateway deployment complete!")
    print(f"Gateway ID: {gateway['gatewayId']}")
    print(f"Gateway URL: {gateway['gatewayUrl']}")
    print(f"Lambda ARN: {lambda_arn}")
    print(f"\n📝 Next steps:")
    print("1. Test with: AWS_PROFILE=your-profile uv run test_mcp_gateway.py")
    print("2. Use gateway_update.py for future updates")

if __name__ == "__main__":
    main()
