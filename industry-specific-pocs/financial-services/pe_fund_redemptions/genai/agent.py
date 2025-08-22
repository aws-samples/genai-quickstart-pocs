import os
from bedrock_agentcore import BedrockAgentCoreApp
from agent_config import create_strands_agent

app = BedrockAgentCoreApp()

def abbreviate_model(model_id):
    """Convert full model ID to abbreviated form for S3 prefix"""
    model_abbreviations = {
        'us.amazon.nova-micro-v1:0': 'nova-micro',
        'us.amazon.nova-pro-v1:0': 'nova-pro', 
        'us.amazon.nova-premier-v1:0': 'nova-premier',
        'us.anthropic.claude-3-5-haiku-20241022-v1:0': 'haiku-3-5',
        'us.anthropic.claude-sonnet-4-20250514-v1:0': 'sonnet-4'
    }
    return model_abbreviations.get(model_id, 'unknown-model')

@app.entrypoint
async def agent_invocation(payload):
    user_message = payload.get("prompt", "No prompt found in input...")
    model_selected = payload.get("model", "us.amazon.nova-micro-v1:0")
    model_persona = payload.get("personality", "basic")
    session_id = payload.get("session_id", "default-session")
    s3_session_bucket = payload.get("s3sessionbucket", "")
    fund_documents_bucket = payload.get("fund_documents_bucket", "")
    knowledge_base_id = payload.get("knowledge_base_id", "")
    
    # Set environment variables if provided
    if fund_documents_bucket:
        os.environ['FUND_DOCUMENTS_BUCKET'] = fund_documents_bucket
        print(f'Set FUND_DOCUMENTS_BUCKET to: {fund_documents_bucket}')
    
    if knowledge_base_id:
        os.environ['KNOWLEDGE_BASE_ID'] = knowledge_base_id
        print(f'Set KNOWLEDGE_BASE_ID to: {knowledge_base_id}')
    
    print(f'Request - Model: {model_selected}, Personality: {model_persona}, Session: {session_id}, S3 Bucket: {s3_session_bucket}, Fund Bucket: {fund_documents_bucket}, KB ID: {knowledge_base_id}')
    
    # Split session ID on hyphen to get username and session
    if '-' in session_id:
        username, actual_session_id = session_id.split('-', 1)  # Split only on first hyphen
        model_abbrev = abbreviate_model(model_selected)
        s3_prefix = f"{username}/{model_abbrev}"  # username/model format
        print(f'Split session - Username: {username}, Session ID: {actual_session_id}, Model: {model_selected} -> {model_abbrev}, S3 Prefix: {s3_prefix}')
    else:
        # Fallback if no hyphen found
        actual_session_id = session_id
        model_abbrev = abbreviate_model(model_selected)
        s3_prefix = f"default/{model_abbrev}"  # default/model format
        print(f'No hyphen in session ID, using default prefix: {s3_prefix}')

    # Handle MCP vs Local personality with completely different flows
    if model_persona == 'mcp':
        print("🔧 MCP personality selected - setting up MCP connection")
        try:
            import boto3
            import json
            import requests
            from strands.tools.mcp.mcp_client import MCPClient
            from mcp.client.streamable_http import streamablehttp_client
            
            # Get MCP credentials from Secrets Manager
            secrets_client = boto3.client('secretsmanager', region_name='us-east-1')
            sec_valu = secrets_client.get_secret_value(SecretId='pe_mcp_auth')
            secret_data = json.loads(sec_valu['SecretString'])
            
            client_info = secret_data['client_info']
            gateway_url = secret_data['gateway_url']
            
            print(f"🔧 Got MCP Gateway URL: {gateway_url}")
            
            # Get access token
            response = requests.post(
                client_info['token_endpoint'],
                data=f"grant_type=client_credentials&client_id={client_info['client_id']}&client_secret={client_info['client_secret']}",
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            access_token = response.json()['access_token']
            print("🔧 Got MCP access token")
            
            # Create MCP transport and client
            transport = streamablehttp_client(gateway_url, headers={"Authorization": f"Bearer {access_token}"})
            mcp_client = MCPClient(lambda: transport)
            print("🔧 Created MCP client")
            
            # tell UI to reset
            yield {"type": "start"}

            # MCP Agent Flow - entire lifecycle within MCP context (like CLI)
            with mcp_client:
                print("🔧 Inside MCP client context")
                
                # Get tools (same as CLI)
                tools = []
                more_tools = True
                pagination_token = None
                while more_tools:
                    tmp_tools = mcp_client.list_tools_sync(pagination_token=pagination_token)
                    tools.extend(tmp_tools)
                    if tmp_tools.pagination_token is None:
                        more_tools = False
                    else:
                        pagination_token = tmp_tools.pagination_token
                
                print(f"🔧 Found {len(tools)} MCP tools: {[tool.tool_name for tool in tools]}")
                
                # Create agent with MCP tools (same as CLI)
                agent = create_strands_agent(
                    model=model_selected, 
                    personality=model_persona,
                    session_id=actual_session_id,
                    s3_bucket=s3_session_bucket,
                    s3_prefix=s3_prefix,
                    tools=tools
                )
                
                print("🔧 Created MCP agent, starting streaming")
                
                # Stream response within MCP context
                try:
                    async for event in agent.stream_async(user_message):
                        # Yield text data events
                        txt = event.get("data")
                        if isinstance(txt, str) and txt:
                            yield {"type": "token", "text": txt}
                            
                except Exception as e:
                    # optional: surface errors to UI
                    yield {"type": "error", "message": str(e)}

                # done marker for UI to stop spinners, etc.
                yield {"type": "done"}
                
        except Exception as e:
            print(f"❌ Failed to setup MCP: {e}")
            yield {"type": "error", "message": f"MCP setup failed: {str(e)}"}
            yield {"type": "done"}
            
    else:
        # Local Agent Flow - original logic
        print("🔧 Creating agent with local tools")
        agent = create_strands_agent(
            model=model_selected, 
            personality=model_persona,
            session_id=actual_session_id,
            s3_bucket=s3_session_bucket,
            s3_prefix=s3_prefix
        )
        
        # tell UI to reset
        yield {"type": "start"}

        try:
            async for event in agent.stream_async(user_message):
                # Yield text data events
                txt = event.get("data")
                if isinstance(txt, str) and txt:
                    yield {"type": "token", "text": txt}
                    
        except Exception as e:
            # optional: surface errors to UI
            yield {"type": "error", "message": str(e)}

        # done marker for UI to stop spinners, etc.
        yield {"type": "done"}

if __name__ == "__main__":
    app.run()
