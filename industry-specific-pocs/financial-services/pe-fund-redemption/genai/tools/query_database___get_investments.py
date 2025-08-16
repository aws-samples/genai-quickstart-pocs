import boto3
import json
from typing import Any

lambda_client = boto3.client('lambda', region_name='us-east-1')

TOOL_SPEC = {
    "name": "query_database___get_investments",
    "description": "Get investment records with optional filtering by field and value",
    "inputSchema": {
        "json": {
            "type": "object",
            "properties": {
                "field": {
                    "type": "string",
                    "description": "Column name to filter by (e.g., investor_id, fund_id, investment_amount)"
                },
                "value": {
                    "type": "string",
                    "description": "Value to search for (partial match)"
                }
            },
            "required": []
        }
    }
}

def query_database___get_investments(tool, **kwargs: Any):
    tool_use_id = tool["toolUseId"]
    tool_input = tool["input"]
    
    field = tool_input.get("field")
    value = tool_input.get("value")
    
    query = "SELECT * FROM investments"
    if field and value:
        query += f" WHERE {field} LIKE '%{value}%'"
    
    try:
        response = lambda_client.invoke(
            FunctionName='MSSqlConnect',
            InvocationType='RequestResponse',
            Payload=json.dumps({'query': query})
        )
        
        result = json.loads(response['Payload'].read())
        return {
            "toolUseId": tool_use_id,
            "status": "success",
            "content": [{"text": json.dumps(result, indent=2)}]
        }
    except Exception as e:
        return {
            "toolUseId": tool_use_id,
            "status": "error",
            "content": [{"text": str(e)}]
        }
