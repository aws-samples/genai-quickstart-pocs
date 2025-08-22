"""
Shared agent configuration for the GenAI application.
This module provides a centralized way to configure and create agents
to avoid code duplication between CLI and other components.
"""

import os
import boto3
from strands import Agent
from strands.models import BedrockModel
from strands.agent.conversation_manager import SlidingWindowConversationManager
from strands.session.s3_session_manager import S3SessionManager
from strands_tools import shell, editor, python_repl, calculator, retrieve
import tools.pull_fund_document___get_fund_document as pull_fund_document
import tools.pull_s3_data___get_investors as pull_s3_investors
import tools.pull_s3_data___get_investments as pull_s3_investments
import tools.pull_s3_data___get_fund_mapping as pull_s3_fund_mapping
import tools.pull_s3_data___get_redemption_requests as pull_s3_redemption_requests
import tools.knowledge_base___retrieve_documents as knowledge_base_retrieve

def load_prompt(filename):
    """Load prompt from markdown file and append appropriate rules"""
    prompt_path = os.path.join(os.path.dirname(__file__), 'prompts', filename)
    
    # Determine which rules file to use
    if filename == 'mcp_prompt.md':
        rules_path = os.path.join(os.path.dirname(__file__), 'prompts', 'mcp_rules.md')
    else:
        rules_path = os.path.join(os.path.dirname(__file__), 'prompts', 'rules.md')
    
    with open(prompt_path, 'r') as f:
        prompt = f.read().strip()
    
    with open(rules_path, 'r') as f:
        rules = f.read().strip()
    
    return f"{prompt}\n\n{rules}"

def create_strands_agent(model = 'us.amazon.nova-micro-v1:0',
                         personality = 'basic',
                         session_id = None,
                         s3_bucket = None,
                         s3_prefix = None):
    """
    Create and return a configured Strands agent instance.
    
    Model Examples:
    - us.amazon.nova-micro-v1:0
    - us.amazon.nova-premier-v1:0
    - us.amazon.nova-pro-v1:0
    - us.anthropic.claude-sonnet-4-20250514-v1:0
    
    Args:
        model (str): The Bedrock model ID to use
        personality (str): Either 'basic' for default prompt or custom system prompt
        session_id (str): Session ID for S3 session management
        s3_bucket (str): S3 bucket for session storage
        s3_prefix (str): S3 prefix for session storage
        
    Returns:
        Agent: Configured agent ready for use
    """
    
    # Configure the Bedrock model
    bedrock_model = BedrockModel(
        inference_profile_id=model,
        max_tokens=5000,
        temperature=0.7,
        top_p=0.8,
    )

    # Configure conversation management for production
    conversation_manager = SlidingWindowConversationManager(
        window_size=10,  # Limit history size
    )

    # Set personality based on input with predefined options
    predefined_personalities = {
        'analyst': load_prompt('analyst_prompt.md'),
        'pe': load_prompt('pe_prompt.md'),
        'mcp': load_prompt('mcp_prompt.md'),  # New MCP-specific prompt for unified data service
    }
    
    print(f"Received personality parameter: '{personality}'")
    
    if personality in predefined_personalities:
        system_prompt = predefined_personalities[personality]
        print(f"Using predefined personality: {system_prompt}")
    else:
        # Treat as custom system prompt
        system_prompt = personality
        print(f"Using custom personality: {system_prompt}")

    # Create session manager based on whether S3 parameters are provided
    session_manager = None
    if session_id and s3_bucket and s3_prefix:
        print(f"Creating S3SessionManager - Session: {session_id}, Bucket: {s3_bucket}, Prefix: {s3_prefix}")
        
        # Create boto3 session for better credential handling
        boto_session = boto3.Session(region_name="us-east-1")
        
        session_manager = S3SessionManager(
            session_id=session_id,
            bucket=s3_bucket,
            prefix=s3_prefix,
            boto_session=boto_session,
            region_name="us-east-1"
        )
    else:
        print("Using default SlidingWindowConversationManager (no S3 session persistence)")

    # Create and return the agent
    tools_list = [pull_fund_document, pull_s3_fund_mapping, pull_s3_investments, pull_s3_investors, pull_s3_redemption_requests]
    
    # Add knowledge base tool for analyst personality
    if personality == 'analyst':
        tools_list.append(knowledge_base_retrieve)
    
    strands_agent = Agent(
        model=bedrock_model,
        system_prompt=system_prompt,
        conversation_manager=conversation_manager,
        session_manager=session_manager,  # Add session manager
        tools=tools_list
    )
    
    return strands_agent
