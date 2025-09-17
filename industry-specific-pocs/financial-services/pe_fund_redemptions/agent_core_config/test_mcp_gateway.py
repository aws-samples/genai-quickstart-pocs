#!/usr/bin/env python3
"""
Test MCP Gateway
Tests the deployed MCP gateway and Lambda targets
"""

from strands import Agent
import logging
from strands.models import BedrockModel
from strands.tools.mcp.mcp_client import MCPClient
from mcp.client.streamable_http import streamablehttp_client 
import os
import requests
import json
import boto3

def main():
    # Check for AWS credentials
    if not os.environ.get('AWS_PROFILE') and not os.environ.get('AWS_ACCESS_KEY_ID'):
        print("❌ AWS credentials not found!")
        print("Please set AWS_PROFILE environment variable:")
        print("   AWS_PROFILE=your-profile-name uv run test_mcp_gateway.py")
        return

    try:
        secrets_client = boto3.client('secretsmanager', region_name='us-east-1')
        sec_valu = secrets_client.get_secret_value(SecretId='pe_mcp_auth')
        client_info = json.loads(sec_valu['SecretString'])['client_info']
        CLIENT_ID = client_info['client_id']
        CLIENT_SECRET = client_info['client_secret']
        TOKEN_URL = client_info['token_endpoint']
        gateway_url = json.loads(sec_valu['SecretString'])['gateway_url']
    except Exception as e:
        print(f"❌ Error getting gateway configuration: {e}")
        print("Please run gateway_deploy.py first")
        return

    def fetch_access_token(client_id, client_secret, token_url):
        response = requests.post(
            token_url,
            data="grant_type=client_credentials&client_id={client_id}&client_secret={client_secret}".format(client_id=client_id, client_secret=client_secret),
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        return response.json()['access_token']

    def create_streamable_http_transport(mcp_url: str, access_token: str):
        return streamablehttp_client(mcp_url, headers={"Authorization": f"Bearer {access_token}"})

    def get_full_tools_list(client):
        """
        List tools w/ support for pagination
        """
        more_tools = True
        tools = []
        pagination_token = None
        while more_tools:
            tmp_tools = client.list_tools_sync(pagination_token=pagination_token)
            tools.extend(tmp_tools)
            if tmp_tools.pagination_token is None:
                more_tools = False
            else:
                more_tools = True 
                pagination_token = tmp_tools.pagination_token
        return tools

    def run_agent(mcp_url: str, access_token: str):
        bedrockmodel = BedrockModel(
            inference_profile_id="us.amazon.nova-premier-v1:0",
            temperature=0.7,
            streaming=True,
        )
         
        mcp_client = MCPClient(lambda: create_streamable_http_transport(mcp_url, access_token))
         
        with mcp_client:
            tools = get_full_tools_list(mcp_client)
            print(f"Found the following tools: {[tool.tool_name for tool in tools]}")
            
            if not tools:
                print("❌ No tools found! Check Lambda target configuration")
                return
                
            agent = Agent(model=bedrockmodel, tools=tools)
            
            print("\n🎉 MCP Gateway test successful!")
            print("Available tools:", [tool.tool_name for tool in tools])
            
            while True:
                user_input = input("\nThis is an interactive Strands Agent with MCP tools. Ask me something. When you're finished, say exit or quit: ")
                if user_input.lower() in ["exit", "quit", "bye"]:
                    print("Goodbye!")
                    break
                print("\nThinking...\n")
                agent(user_input)

    run_agent(gateway_url, fetch_access_token(CLIENT_ID, CLIENT_SECRET, TOKEN_URL))

if __name__ == "__main__":
    main()
