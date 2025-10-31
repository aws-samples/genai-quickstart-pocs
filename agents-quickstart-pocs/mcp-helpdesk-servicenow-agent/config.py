"""
Configuration settings for the ServiceNow instance and Bedrock model
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ServiceNow MCP Server Configuration
SERVICENOW_MCP_CONFIG = {
    "command": "C:\\workspace\\agents\\mcp-servers\\servicenow\\servicenow-mcp\\.venv\\Scripts\\python.exe",
    "args": ["-m", "servicenow_mcp.cli"],
    "env": {

       "SERVICENOW_INSTANCE_URL": "https://dev311549.service-now.com",
       "SERVICENOW_USERNAME": "admin",
       "SERVICENOW_PASSWORD": "W7^^tZ6PskZi",
       "SERVICENOW_AUTH_TYPE": "basic"

     
    }
}

# AWS region and model configuration for Bedrock
AWS_CONFIG = {
    "region": "us-west-2",
    "model_id": "us.anthropic.claude-3-7-sonnet-20250219-v1:0"
}

# Chatbot Configuration
CHATBOT_CONFIG = {
    "max_conversation_history": 10,
    "auto_save_conversations": True,
    "enable_voice_input": False,
    "default_response_timeout": 30
} 