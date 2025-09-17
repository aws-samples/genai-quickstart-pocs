import boto3
import json
import os
from typing import Any

# Hardcoded configuration - update this if you create a new knowledge base
KNOWLEDGE_BASE_ID = "W1Q58MF2A7"
RETRIEVAL_CONFIG = {
    "vectorSearchConfiguration": {
        "numberOfResults": 10,
        "overrideSearchType": "SEMANTIC"
    }
}

TOOL_SPEC = {
    "name": "knowledge_base___retrieve_documents",
    "description": "Retrieve relevant documents from the knowledge base using semantic search. Best for finding information across all fund documents.",
    "inputSchema": {
        "json": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query to find relevant documents (e.g., 'redemption fees for ClassA investors')"
                },
                "max_results": {
                    "type": "integer",
                    "description": "Maximum number of results to return (default: 10, max: 20)",
                    "minimum": 1,
                    "maximum": 20
                }
            },
            "required": ["query"]
        }
    }
}

def knowledge_base___retrieve_documents(tool, **kwargs: Any):
    tool_use_id = tool["toolUseId"]
    tool_input = tool["input"]
    
    query = tool_input.get("query", "")
    max_results = tool_input.get("max_results", 10)
    
    if not query:
        return {
            "toolUseId": tool_use_id,
            "status": "error",
            "content": [{"text": "Query is required for knowledge base search"}]
        }
    
    if not KNOWLEDGE_BASE_ID or KNOWLEDGE_BASE_ID == "YOUR_KNOWLEDGE_BASE_ID_HERE":
        return {
            "toolUseId": tool_use_id,
            "status": "error",
            "content": [{"text": "Knowledge Base ID not configured. Please update KNOWLEDGE_BASE_ID in kb_config.py"}]
        }
    
    try:
        # Create Bedrock Agent Runtime client
        bedrock_agent_client = boto3.client('bedrock-agent-runtime', region_name='us-east-1')
        
        # Prepare retrieval configuration with custom max results
        retrieval_config = RETRIEVAL_CONFIG.copy()
        retrieval_config["vectorSearchConfiguration"]["numberOfResults"] = min(max_results, 20)
        
        # Call the retrieve API
        response = bedrock_agent_client.retrieve(
            knowledgeBaseId=KNOWLEDGE_BASE_ID,
            retrievalQuery={'text': query},
            retrievalConfiguration=retrieval_config
        )
        
        # Process the results
        results = []
        retrieval_results = response.get('retrievalResults', [])
        
        for result in retrieval_results:
            # Extract content, score, and location information
            content = result.get('content', {}).get('text', 'No content available')
            score = result.get('score', 0.0)
            
            # Extract location information
            location_info = result.get('location', {})
            location_type = location_info.get('type', 'UNKNOWN')
            
            # Format location based on type
            if location_type == 'S3':
                s3_location = location_info.get('s3Location', {})
                source = f"s3://{s3_location.get('uri', 'unknown')}"
            else:
                source = f"{location_type}: {location_info.get('uri', 'unknown location')}"
            
            results.append({
                'content': content,
                'relevance_score': round(score, 4),
                'source': source
            })
        
        # Format the response
        if not results:
            formatted_response = f"No relevant documents found for query: '{query}'"
        else:
            formatted_response = f"Found {len(results)} relevant documents for query: '{query}'\n\n"
            
            for i, result in enumerate(results, 1):
                formatted_response += f"**Result {i}** (Relevance: {result['relevance_score']})\n"
                formatted_response += f"**Source:** {result['source']}\n"
                formatted_response += f"**Content:**\n{result['content']}\n"
                formatted_response += "-" * 80 + "\n\n"
        
        return {
            "toolUseId": tool_use_id,
            "status": "success",
            "content": [{"text": formatted_response}]
        }
        
    except bedrock_agent_client.exceptions.ResourceNotFoundException:
        return {
            "toolUseId": tool_use_id,
            "status": "error",
            "content": [{"text": f"Knowledge Base not found: {KNOWLEDGE_BASE_ID}. Please check the knowledge base ID in kb_config.py"}]
        }
    except bedrock_agent_client.exceptions.AccessDeniedException:
        return {
            "toolUseId": tool_use_id,
            "status": "error",
            "content": [{"text": "Access denied to knowledge base. Please check your AWS permissions for bedrock-agent-runtime:Retrieve"}]
        }
    except Exception as e:
        return {
            "toolUseId": tool_use_id,
            "status": "error",
            "content": [{"text": f"Knowledge base retrieval error: {str(e)}"}]
        }
