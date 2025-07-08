"""
Configuration settings for the MCP Helpdesk Assistant
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ServiceNow MCP Server Configuration
SERVICENOW_MCP_CONFIG = {
    "command": "path_to_mcp_server\\.venv\\Scripts\\python.exe",
    "args": ["-m", "servicenow_mcp.cli"],
    "env": {
        "SERVICENOW_INSTANCE_URL": os.getenv("SERVICENOW_INSTANCE_URL", "servicenow_url_here"),
        "SERVICENOW_USERNAME": os.getenv("SERVICENOW_USERNAME", "servicenow_username"),
        "SERVICENOW_PASSWORD": os.getenv("SERVICENOW_PASSWORD", "servicenow_password"),
        "SERVICENOW_AUTH_TYPE": os.getenv("SERVICENOW_AUTH_TYPE", "basic")
    }
}

# AWS Configuration for Bedrock
AWS_CONFIG = {
    "region": os.getenv("AWS_DEFAULT_REGION", "us-west-2"),
    "access_key_id": os.getenv("AWS_ACCESS_KEY_ID"),
    "secret_access_key": os.getenv("AWS_SECRET_ACCESS_KEY")
}

# Agent Configuration (for reference only - not used in Agent constructor)
AGENT_CONFIG = {
    "max_tokens": int(os.getenv("STRANDS_MAX_TOKENS", "32000")),
    "budget_tokens": int(os.getenv("STRANDS_BUDGET_TOKENS", "2048")),
    "model_id": os.getenv("STRANDS_MODEL_ID", "us.anthropic.claude-sonnet-4-20250514-v1:0")
}

# ServiceNow Default Values
SERVICENOW_DEFAULTS = {
    "default_assignment_group": "IT Infrastructure",
    "default_category": "Email/Communication",
    "default_priority": "High",
    "default_impact": "High",
    "default_urgency": "High"
}

# Chatbot Configuration
CHATBOT_CONFIG = {
    "max_conversation_history": 10,
    "auto_save_conversations": True,
    "enable_voice_input": False,
    "default_response_timeout": 30
} 