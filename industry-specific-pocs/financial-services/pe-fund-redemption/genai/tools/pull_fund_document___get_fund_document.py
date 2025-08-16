import boto3
import json
from typing import Any

TOOL_SPEC = {
    "name": "pull_fund_document___get_fund_document",
    "description": "Get the full text document for a specific fund and investor class",
    "inputSchema": {
        "json": {
            "type": "object",
            "properties": {
                "fund_name": {
                    "type": "string",
                    "description": "Fund identifier (e.g., FUND001, FUND015)"
                },
                "investor_class": {
                    "type": "string",
                    "description": "Investor class type: ClassA, ClassB, or Institutional"
                }
            },
            "required": ["fund_name", "investor_class"]
        }
    }
}

def pull_fund_document___get_fund_document(tool, **kwargs: Any):
    tool_use_id = tool["toolUseId"]
    tool_input = tool["input"]
    
    fund_name = tool_input.get("fund_name", "")
    investor_class = tool_input.get("investor_class", "ClassA")
    
    if not fund_name:
        return {
            "toolUseId": tool_use_id,
            "status": "error",
            "content": [{"text": "fund_name is required"}]
        }
    
    try:
        s3_client = boto3.client('s3', region_name='us-east-1')
        s3_key = f"fund_documents/{fund_name}_{investor_class}.txt"
        bucket = "tonytrev-ab2"
        
        response = s3_client.get_object(Bucket=bucket, Key=s3_key)
        document_content = response['Body'].read().decode('utf-8')
        
        result = {
            'fund_name': fund_name,
            'investor_class': investor_class,
            'document': document_content
        }
        
        return {
            "toolUseId": tool_use_id,
            "status": "success",
            "content": [{"text": json.dumps(result, indent=2)}]
        }
        
    except s3_client.exceptions.NoSuchKey:
        return {
            "toolUseId": tool_use_id,
            "status": "error",
            "content": [{"text": f"Document not found: {s3_key}"}]
        }
    except Exception as e:
        return {
            "toolUseId": tool_use_id,
            "status": "error",
            "content": [{"text": f"Error: {str(e)}"}]
        }
