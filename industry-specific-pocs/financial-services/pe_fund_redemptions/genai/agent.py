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
    
    # Create agent with S3 session management
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
                
            # Extract and yield citations from tool result events
            if "message" in event and event["message"].get("role") == "user":
                content = event["message"].get("content", [])
                for item in content:
                    if "toolResult" in item:
                        tool_result = item["toolResult"]
                        if tool_result.get("status") == "success":
                            # Extract citations from tool result content
                            result_content = tool_result.get("content", [])
                            for result_item in result_content:
                                if "text" in result_item:
                                    text_content = result_item["text"]
                                    # Look for Source: lines and extract them
                                    if "**Source:**" in text_content:
                                        # Extract individual sources
                                        sources = []
                                        lines = text_content.split('\n')
                                        for line in lines:
                                            if line.strip().startswith('**Source:**'):
                                                source_url = line.replace('**Source:**', '').strip()
                                                if source_url:
                                                    sources.append(source_url)
                                        
                                        # Yield each source as a separate citation
                                        for i, source in enumerate(sources):
                                            yield {
                                                "type": "citation",
                                                "toolUseId": tool_result.get("toolUseId"),
                                                "source": source,
                                                "index": i + 1
                                            }
    except Exception as e:
        # optional: surface errors to UI
        yield {"type": "error", "message": str(e)}

    # done marker for UI to stop spinners, etc.
    yield {"type": "done"}

if __name__ == "__main__":
    app.run()
