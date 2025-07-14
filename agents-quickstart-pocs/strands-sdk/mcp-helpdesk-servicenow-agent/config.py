"""
Configuration settings for the MCP ServiceNow Helpdesk Assistant
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ServiceNow MCP Server Configuration
SERVICENOW_MCP_CONFIG = {
    "command": "path_to_mcp_server\\servicenow-mcp\\.venv\\Scripts\\python.exe",
    "args": ["-m", "servicenow_mcp.cli"],
    "env": {
        "SERVICENOW_INSTANCE_URL": os.getenv("SERVICENOW_INSTANCE_URL", ""),
        "SERVICENOW_USERNAME": os.getenv("SERVICENOW_USERNAME", ""),
        "SERVICENOW_PASSWORD": os.getenv("SERVICENOW_PASSWORD", ""),
        "SERVICENOW_AUTH_TYPE": os.getenv("SERVICENOW_AUTH_TYPE", "basic")
    }
}

# AWS Configuration for Bedrock
AWS_CONFIG = {
    "region": os.getenv("AWS_DEFAULT_REGION", "us-west-2"),
    "access_key_id": os.getenv("AWS_ACCESS_KEY_ID"),
    "secret_access_key": os.getenv("AWS_SECRET_ACCESS_KEY"),
    "model_id": os.getenv("STRANDS_MODEL_ID", "us.anthropic.claude-3-7-sonnet-20250219-v1:0")
}

# Chatbot Configuration
CHATBOT_CONFIG = {
    "max_conversation_history": 10,
    "auto_save_conversations": True,
    "enable_voice_input": False,
    "default_response_timeout": 30
} 