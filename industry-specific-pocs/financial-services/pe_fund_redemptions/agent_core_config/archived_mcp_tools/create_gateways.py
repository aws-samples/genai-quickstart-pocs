# Create Gateway, save details, and create targets
import boto3
import json
from bedrock_agentcore_starter_toolkit.operations.gateway.client import GatewayClient
import logging

# setup the client
client = GatewayClient(region_name="us-east-1")
client.logger.setLevel(logging.DEBUG)

# create cognito authorizer
cognito_response = client.create_oauth_authorizer_with_cognito("PE_DB_Auth")


# create the gateway.
gateway = client.create_mcp_gateway(
    name='PE-DB-Gateway', # the name of the Gateway - if you don't set one, one will be generated.
    role_arn=None, # the role arn that the Gateway will use - if you don't set one, one will be created.
    authorizer_config=cognito_response["authorizer_config"], # the OAuth authorizer details for authorizing callers to your Gateway (MCP only supports OAuth).
    enable_semantic_search=True, # enable semantic search.
)

# save to secrets manager
secrets_client = boto3.client('secretsmanager', region_name='us-east-1')

secrets_client.create_secret(
    Name='pe_mcp_auth',
    SecretString=json.dumps({
        "authorizer_config": cognito_response["authorizer_config"],
        "client_info": cognito_response["client_info"],
        "gateway_id": gateway['gatewayId'],
        "gateway_url": gateway['gatewayUrl'],
    })
)




# Load database query payload from JSON file
with open('database-query-payload.json', 'r') as f:
    qd_payload = json.load(f)


# create a lambda target.
lambda_target = client.create_mcp_gateway_target(
    gateway=gateway, 
    name='query-database', 
    target_type="lambda",
    target_payload=qd_payload,
    credentials=None, 
)

# Load database query payload from JSON file
with open('/Users/tonytrev/Documents/SA/AB3/strands-agentcore-react/agent_core_config/fund-documents-payload.json', 'r') as f:
    fd_payload = json.load(f)


# create a lambda target.
lambda_target = client.create_mcp_gateway_target(
    gateway=gateway, 
    name='pull-fund-document', 
    target_type="lambda",
    target_payload=fd_payload,
    credentials=None, 
)

