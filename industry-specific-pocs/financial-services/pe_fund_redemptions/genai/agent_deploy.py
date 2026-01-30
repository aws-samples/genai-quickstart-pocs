import boto3

session = boto3.Session()
client = session.client('bedrock-agentcore-control', region_name="us-east-1")

# Get Account ID
sts_client = session.client("sts")
identity = sts_client.get_caller_identity()
account_id = identity["Account"]
print(f"Account ID: {account_id}")

response = client.create_agent_runtime(
    agentRuntimeName='strands_agent',
    agentRuntimeArtifact={
        'containerConfiguration': {
            'containerUri': f"{account_id}.dkr.ecr.us-east-1.amazonaws.com/my-strands-agent:latest"
        }
    },
    networkConfiguration={"networkMode": "PUBLIC"},
    roleArn=f'arn:aws:iam::{account_id}:role/bedrock-agent-core-role'
)

print(f"Agent Runtime created successfully!")
print(f"Agent Runtime ARN: {response['agentRuntimeArn']}")
print(f"Status: {response['status']}")