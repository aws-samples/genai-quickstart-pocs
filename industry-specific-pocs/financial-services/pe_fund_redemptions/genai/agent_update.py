import boto3
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
parent_dir = Path(__file__).parent.parent
env_path = parent_dir / '.env'
load_dotenv(env_path)

# Get environment variables
agent_runtime_arn = os.getenv('AGENTCORE_RUNTIME_ARN')
if not agent_runtime_arn:
    raise ValueError("AGENTCORE_RUNTIME_ARN not found in environment variables")

# Extract agent runtime ID from ARN
# ARN format: arn:aws:bedrock-agentcore:region:account:agent-runtime/id
agent_runtime_id = agent_runtime_arn.split('/')[-1]

print(f"🔄 Updating Agent Runtime ID: {agent_runtime_id}")
print(f"📋 Agent Runtime ARN: {agent_runtime_arn}")

# Create boto3 session
session = boto3.Session()
client = session.client('bedrock-agentcore-control', region_name="us-east-1")

# Get Account ID
sts_client = session.client("sts")
identity = sts_client.get_caller_identity()
account_id = identity["Account"]
print(f"🏢 Account ID: {account_id}")

try:
    # Update the agent runtime with new container image
    print("🚀 Updating agent runtime...")
    
    response = client.update_agent_runtime(
        agentRuntimeId=agent_runtime_id,
        agentRuntimeArtifact={
            'containerConfiguration': {
                'containerUri': f"{account_id}.dkr.ecr.us-east-1.amazonaws.com/my-strands-agent:latest"
            }
        },
        networkConfiguration={"networkMode": "PUBLIC"},
        roleArn=f'arn:aws:iam::{account_id}:role/bedrock-agent-core-role'
    )
    
    print("✅ Agent Runtime updated successfully!")
    print(f"📋 Agent Runtime ARN: {response['agentRuntimeArn']}")
    print(f"📊 Status: {response['status']}")
    print(f"🕐 Last Modified: {response.get('lastModifiedTime', 'N/A')}")
    
    if response['status'] == 'UPDATING':
        print("⏳ Agent runtime is updating. This may take a few minutes.")
        print("💡 You can check the status using the AWS console or describe_agent_runtime API.")
    
except Exception as e:
    print(f"❌ Error updating agent runtime: {e}")
    print("Make sure:")
    print("1. AGENTCORE_RUNTIME_ARN is set correctly in .env")
    print("2. Your agent runtime exists and is accessible")
    print("3. You have the correct permissions to update agent runtimes")
    print("4. The container image exists in ECR")
