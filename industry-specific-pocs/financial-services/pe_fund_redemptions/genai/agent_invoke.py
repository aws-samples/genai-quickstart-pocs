import boto3
import os
import secrets
import string
import json
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
parent_dir = Path(__file__).parent.parent
env_path = parent_dir / '.env'
load_dotenv(env_path)



def generate_session_id():
    """Generate exactly 33 character random session ID"""
    characters = string.ascii_letters + string.digits  # a-z, A-Z, 0-9
    return ''.join(secrets.choice(characters) for _ in range(33))

# Get environment variables
agent_runtime_arn = os.getenv('AGENTCORE_RUNTIME_ARN')
if not agent_runtime_arn:
    raise ValueError("AGENTCORE_RUNTIME_ARN not found in environment variables")

# Generate session ID
session_id = generate_session_id()
print(f"Generated Session ID: {session_id}")

# Create boto3 session
session = boto3.Session()
client = session.client('bedrock-agentcore', region_name="us-east-1")

# Test prompt
payload = json.dumps({
    "prompt": "Can you help me process a redemption for Susan?",
    "model": "us.amazon.nova-pro-v1:0",
    "personality": "pe"
    #"personality": "Pretened you are an old school sports broadcaster talking about the game as a life long fan of the winning team."
})

try:
    # Invoke the agent runtime
    print(f"🤖 Invoking agent with prompt: '{payload}'")
    print(f"📋 Agent Runtime ARN: {agent_runtime_arn}")
    print(f"🔑 Session ID: {session_id}")
    print()
    
    response = client.invoke_agent_runtime(
        agentRuntimeArn=agent_runtime_arn,
        runtimeSessionId=session_id,
        payload=payload,
        qualifier='DEFAULT'
    )
    
    print("✅ Agent invoked successfully!")
    print("📤 Response:")
    
    # Handle streaming response with proper SSE parsing
    stream = response['response']
    full_response = ""
    
    for chunk in stream.iter_lines():
        if chunk:
            chunk_str = chunk.decode('utf-8')
            
            # Parse SSE events - handle concatenated data: events
            if 'data: ' in chunk_str:
                # Split by 'data: ' and process each JSON event
                data_parts = chunk_str.split('data: ')
                
                for part in data_parts:
                    if not part.strip():
                        continue
                        
                    # Clean up the JSON part
                    json_part = part.split('\n')[0].strip()
                    if not json_part:
                        continue
                        
                    try:
                        event_data = json.loads(json_part)
                        
                        if event_data.get('type') == 'token' and event_data.get('text'):
                            text = event_data['text']
                            full_response += text
                            print(text, end='', flush=True)
                        elif event_data.get('type') == 'start':
                            print("🚀 Agent started...", flush=True)
                        elif event_data.get('type') == 'done':
                            print("\n✨ Agent finished!", flush=True)
                        elif event_data.get('type') == 'error':
                            print(f"\n❌ Agent error: {event_data.get('message', 'Unknown error')}", flush=True)
                            
                    except json.JSONDecodeError:
                        # Skip malformed JSON
                        continue
            else:
                # Handle non-SSE content
                print(chunk_str, end='', flush=True)
    
    print(f"\n\n🎉 Invocation complete!")
    print(f"📝 Full response length: {len(full_response)} characters")
    
except Exception as e:
    print(f"❌ Error invoking agent: {e}")
    print("Make sure:")
    print("1. AGENTCORE_RUNTIME_ARN is set correctly in .env")
    print("2. Your agent runtime is in ACTIVE status")
    print("3. You have the correct permissions")