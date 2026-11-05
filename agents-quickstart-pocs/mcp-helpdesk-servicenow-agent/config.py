"""
Configuration settings for the ServiceNow instance and Bedrock model

ServiceNow settings come from environment variables, or from a .env file
loaded by python-dotenv. See .env.example and the "Configure the ServiceNow
MCP server" section of README.md. Nothing instance-specific is hard-coded here.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Settings the ServiceNow MCP server needs. All are required; there are no
# defaults because each one is specific to your machine or instance.
SERVICENOW_REQUIRED_SETTINGS = {
    "SERVICENOW_MCP_COMMAND": "path to the Python interpreter of your servicenow-mcp install",
    "SERVICENOW_INSTANCE_URL": "your instance URL, e.g. https://your-instance.service-now.com",
    "SERVICENOW_USERNAME": "the ServiceNow user the agent acts as",
    "SERVICENOW_PASSWORD": "that user's password",
}


def get_servicenow_mcp_config():
    """Build the ServiceNow MCP server launch config from the environment.

    Raises:
        RuntimeError: if any required setting is missing, naming each one.
    """
    missing = [name for name in SERVICENOW_REQUIRED_SETTINGS if not os.getenv(name)]
    if missing:
        details = "\n".join(
            f"  {name}: {SERVICENOW_REQUIRED_SETTINGS[name]}" for name in missing
        )
        raise RuntimeError(
            "Missing required ServiceNow settings:\n"
            f"{details}\n"
            "Set them as environment variables, or copy .env.example to .env "
            "in this directory and fill them in."
        )

    return {
        "command": os.environ["SERVICENOW_MCP_COMMAND"],
        "args": ["-m", "servicenow_mcp.cli"],
        "env": {
            "SERVICENOW_INSTANCE_URL": os.environ["SERVICENOW_INSTANCE_URL"],
            "SERVICENOW_USERNAME": os.environ["SERVICENOW_USERNAME"],
            "SERVICENOW_PASSWORD": os.environ["SERVICENOW_PASSWORD"],
            "SERVICENOW_AUTH_TYPE": os.getenv("SERVICENOW_AUTH_TYPE", "basic"),
        },
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
