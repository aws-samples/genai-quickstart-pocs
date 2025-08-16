# pe_kb_search.py

from strands_tools.retrieve import retrieve
from typing import Any

# 1. Tool Specification
TOOL_SPEC = {
    "name": "pe_kb_search",
    "description": "Search the PE fund knowledge base for fund documents, terms, conditions, and analysis.",
    "inputSchema": {
        "json": {
            "type": "object",
            "properties": {
                "text": {
                    "type": "string",
                    "description": "The query to search for in the PE fund knowledge base"
                },
                "numberOfResults": {
                    "type": "integer",
                    "description": "The maximum number of results to return. Default is 5.",
                    "default": 5
                },
                "score": {
                    "type": "number",
                    "description": "Minimum relevance score threshold (0.0-1.0). Default is 0.4.",
                    "default": 0.4
                }
            },
            "required": ["text"]
        }
    }
}

# 2. Tool Function
def pe_kb_search(tool, **kwargs: Any):
    """
    Search the PE fund knowledge base with pre-configured settings.
    
    This is a wrapper around the retrieve tool that automatically uses
    the correct knowledge base ID and region for PE fund data.
    
    Args:
        tool: Tool object containing toolUseId and input parameters
        **kwargs: Additional keyword arguments
        
    Returns:
        dict: Structured response from the knowledge base search
    """
    # Extract the original input
    tool_input = tool["input"]
    
    # Add the pre-configured knowledge base settings
    enhanced_input = {
        **tool_input,
        "knowledgeBaseId": "ODIEVPX1J5",
        "region": "us-east-1"
    }
    
    # Create a new tool object with the enhanced input
    enhanced_tool = {
        **tool,
        "input": enhanced_input
    }
    
    # Call the original retrieve function with our pre-configured settings
    return retrieve(enhanced_tool, **kwargs)
