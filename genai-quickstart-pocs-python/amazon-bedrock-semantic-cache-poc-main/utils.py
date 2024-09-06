import os
from typing import Any
import boto3
from dotenv import load_dotenv
import streamlit as st
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth

# Load environment variables
load_dotenv()

# Lists all Bedrock Text models
@st.cache_data
def lst_text_models():

    # Models with a system prompt supported by the Amazon Bedrock Converse API as of 8/29
    allowed_models = {
        'ai21.jamba-instruct-v1:0',  # AI21 Jamba-Instruct
        'anthropic.claude-v2',       # Anthropic Claude 2
        'anthropic.claude-v2:1',     # Anthropic Claude 2.1
        'anthropic.claude-3-sonnet-20240229-v1:0',  # Anthropic Claude 3 Sonnet
        'anthropic.claude-3-5-sonnet-20240620-v1:0',  # Anthropic Claude 3.5 Sonnet
        'anthropic.claude-3-haiku-20240307-v1:0',   # Anthropic Claude 3 Haiku
        'anthropic.claude-3-opus-20240229-v1:0',    # Anthropic Claude 3 Opus
        'cohere.command-r-v1:0',     # Cohere Command R
        'cohere.command-r-plus-v1:0',  # Cohere Command R+
        'meta.llama2-13b-chat-v1',   # Meta Llama 2 (13B)
        'meta.llama2-70b-chat-v1',   # Meta Llama 2 (70B)
        'meta.llama3-8b-instruct-v1:0',  # Meta Llama 3 (8B)
        'meta.llama3-70b-instruct-v1:0',  # Meta Llama 3 (70B)
        'meta.llama3-1-8b-instruct-v1:0',  # Meta Llama 3.1 (8B)
        'meta.llama3-1-70b-instruct-v1:0',  # Meta Llama 3.1 (70B)
        'meta.llama3-1-405b-instruct-v1:0',  # Meta Llama 3.1 (405B)
        'mistral.mistral-large-2402-v1:0',  # Mistral Large
        'mistral.mistral-large-2407-v1:0',  # Mistral Large 2 (24.07)
        'mistral.mistral-small-2402-v1:0'  # Mistral Small
    }
    
    all_models = BEDROCK_STANDALONE_CLIENT.list_foundation_models(
        byOutputModality='TEXT',
        byInferenceType='ON_DEMAND'
    )['modelSummaries']
    
    return [model for model in all_models if model['modelId'] in allowed_models]

# Lists all Bedrock Embedding models
@st.cache_data
def lst_embedding_models():
    
    # Models supported by Amazon Bedrock Knowledge Bases as of 8/29
    allowed_models = {
        'amazon.titan-embed-text-v1',
        'amazon.titan-embed-text-v2:0',
        'cohere.embed-english-v3',
        'cohere.embed-multilingual-v3'
    }
    all_models = BEDROCK_STANDALONE_CLIENT.list_foundation_models(
        byOutputModality='EMBEDDING',
        byInferenceType='ON_DEMAND'
    )['modelSummaries']

    return [model for model in all_models if model['modelId'] in allowed_models]

# Create and return a Bedrock client
def get_bedrock_client(service: str = 'bedrock') -> Any:

    boto3.setup_default_session(profile_name=os.getenv('PROFILE_NAME'))
    return boto3.client(service, region_name=os.getenv('AWS_REGION', 'us-east-1'))

# Create and return a Bedrock client
def get_bedrock_runtime_client(service: str = 'bedrock-runtime') -> Any:

    boto3.setup_default_session(profile_name=os.getenv('PROFILE_NAME'))
    return boto3.client(service, region_name=os.getenv('AWS_REGION', 'us-east-1'))

# Create and return an OpenSearch client
def get_opensearch_client() -> OpenSearch:

    host = os.getenv('OPENSEARCH_HOST')
    region = os.getenv('AWS_REGION', 'us-east-1')
    service = 'aoss'
    credentials = boto3.Session().get_credentials()
    auth = AWSV4SignerAuth(credentials, region, service)

    return OpenSearch(
        hosts=[{"host": host, "port": 443}],
        http_auth=auth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection,
        pool_maxsize=20,
    )

# Initialize clients and constants
BEDROCK_STANDALONE_CLIENT = get_bedrock_client()
BEDROCK_CLIENT = get_bedrock_runtime_client()
BEDROCK_AGENT_CLIENT = get_bedrock_client('bedrock-agent-runtime')
OPENSEARCH_CLIENT = get_opensearch_client()
OPENSEARCH_INDEX = os.getenv('OPENSEARCH_INDEX')
KNOWLEDGE_BASE_ID = os.getenv('KNOWLEDGE_BASE_ID')
