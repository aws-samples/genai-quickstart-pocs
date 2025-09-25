#!/usr/bin/env python3
"""
Gateway Update - Update Existing MCP Gateway
Updates Lambda targets on existing gateway
Use this for ongoing updates after initial deployment
"""

import boto3
import json
import os
from bedrock_agentcore_starter_toolkit.operations.gateway.client import GatewayClient
import logging

def get_lambda_arns():
    """Dynamically discover both Lambda ARNs"""
    lambda_client = boto3.client('lambda', region_name='us-east-1')
    
    arns = {}
    functions = ['fund-document-service', 'data-service']
    
    for func_name in functions:
        try:
            response = lambda_client.get_function(FunctionName=func_name)
            arns[func_name] = response['Configuration']['FunctionArn']
            print(f"✅ Found {func_name}: {arns[func_name]}")
        except lambda_client.exceptions.ResourceNotFoundException:
            print(f"❌ Lambda function '{func_name}' not found!")
            print("Please run deploy_lambdas.py first")
            return None
    
    return arns

def get_existing_gateway_config():
    """Get existing gateway configuration from Secrets Manager"""
    secrets_client = boto3.client('secretsmanager', region_name='us-east-1')
    
    try:
        sec_value = secrets_client.get_secret_value(SecretId='pe_mcp_auth')
        return json.loads(sec_value['SecretString'])
    except secrets_client.exceptions.ResourceNotFoundException:
        print("❌ No existing gateway found!")
        print("Please run gateway_deploy.py first")
        return None

def main():
    # Check for AWS credentials
    if not os.environ.get('AWS_PROFILE') and not os.environ.get('AWS_ACCESS_KEY_ID'):
        print("❌ AWS credentials not found!")
        print("Please set AWS_PROFILE environment variable:")
        print("   AWS_PROFILE=your-profile-name uv run gateway_update.py")
        return

    # Get existing gateway configuration
    gateway_config = get_existing_gateway_config()
    if not gateway_config:
        return
    
    # Get current Lambda ARN
    lambda_arn = get_lambda_arn()
    if not lambda_arn:
        return
    
    print(f"✅ Found existing gateway: {gateway_config['gateway_id']}")
    print(f"✅ Found Lambda function: {lambda_arn}")
    
    # Setup the client
    client = GatewayClient(region_name="us-east-1")
    client.logger.setLevel(logging.INFO)
    
    # Prepare gateway object for target operations
    gateway = {
        'gatewayId': gateway_config['gateway_id'],
        'gatewayUrl': gateway_config['gateway_url']
    }
    
    print("🔧 Updating Lambda target...")
    
    # Create/Update Lambda target with simplified MCP tool schema
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
        # Try to create the target (will fail if exists)
        lambda_target = client.create_mcp_gateway_target(
            gateway=gateway,
            name='pe-data-service',
            target_type="lambda",
            target_payload=target_payload,
            credentials=None,
        )
        print("✅ Created new Lambda target: pe-data-service")
        
    except Exception as e:
        if "already exists" in str(e).lower() or "conflict" in str(e).lower():
            print("⚠️  Lambda target 'pe-data-service' already exists")
            print("Note: MCP Gateway targets cannot be updated, only recreated")
            print("If you need to change the Lambda ARN, delete and recreate the gateway")
        else:
            print(f"❌ Error with Lambda target: {e}")
            return
    
    print(f"\n🎉 Gateway update complete!")
    print(f"Gateway ID: {gateway_config['gateway_id']}")
    print(f"Gateway URL: {gateway_config['gateway_url']}")
    print(f"Lambda ARN: {lambda_arn}")
    print(f"\n📝 Next steps:")
    print("1. Test with: AWS_PROFILE=your-profile uv run test_mcp_gateway.py")

if __name__ == "__main__":
    main()
