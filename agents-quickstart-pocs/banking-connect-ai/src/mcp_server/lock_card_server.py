#!/usr/bin/env python3
"""MCP Server for lock_card - AgentCore Runtime"""
import json
import boto3
import os
import logging
from mcp.server import Server
from mcp.types import Tool, TextContent
from typing import Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize AWS clients
lambda_client = boto3.client('lambda', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
CARD_OPS_FUNCTION = os.environ.get('CARD_OPS_FUNCTION_NAME', 'betterbank-card-operations-dev')

# Initialize MCP server
app = Server("lock_card")


@app.list_tools()
async def handle_list_tools() -> list[Tool]:
    """List available tools"""
    return [
        Tool(
            name="lock_card",
            description="Lock a customer's debit card to prevent transactions. Use this when a customer reports their card as lost, stolen, or suspects fraudulent activity. The card can be unlocked later.",
            inputSchema={
                "type": "object",
                "properties": {
                    "customer_id": {
                        "type": "string",
                        "description": "Unique identifier for the customer (e.g., CUST001)"
                    },
                    "card_id": {
                        "type": "string",
                        "description": "Unique identifier for the card to lock (e.g., CARD001)"
                    }
                },
                "required": ["customer_id", "card_id"]
            }
        )
    ]


@app.call_tool()
async def handle_call_tool(name: str, arguments: Any) -> list[TextContent]:
    """Handle tool call by invoking Lambda function"""
    
    if name != "lock_card":
        return [TextContent(
            type="text",
            text=json.dumps({
                "success": False,
                "error": {
                    "code": "INVALID_TOOL",
                    "message": f"Unknown tool: {name}"
                }
            })
        )]
    
    # Create Lambda event
    event = {
        "httpMethod": "POST",
        "path": "/v1/cards/lock",
        "body": json.dumps(arguments)
    }
    
    try:
        # Invoke Lambda
        response = lambda_client.invoke(
            FunctionName=CARD_OPS_FUNCTION,
            InvocationType='RequestResponse',
            Payload=json.dumps(event)
        )
        
        # Parse response
        payload = json.loads(response['Payload'].read())
        status_code = payload.get('statusCode', 500)
        body = json.loads(payload.get('body', '{}'))
        
        if status_code == 200:
            return [TextContent(
                type="text",
                text=json.dumps(body, indent=2)
            )]
        else:
            return [TextContent(
                type="text",
                text=json.dumps({
                    "success": False,
                    "error": body.get("error", {"code": "UNKNOWN_ERROR", "message": "An error occurred"})
                }, indent=2)
            )]
    
    except Exception as e:
        logger.error(f"Error invoking Lambda: {str(e)}", exc_info=True)
        return [TextContent(
            type="text",
            text=json.dumps({
                "success": False,
                "error": {
                    "code": "SERVICE_ERROR",
                    "message": f"Service error: {str(e)}"
                }
            }, indent=2)
        )]


def main():
    """Run the MCP server"""
    import asyncio
    from mcp.server.stdio import stdio_server
    
    async def run():
        async with stdio_server() as (read_stream, write_stream):
            await app.run(
                read_stream,
                write_stream,
                app.create_initialization_options()
            )
    
    asyncio.run(run())


if __name__ == "__main__":
    main()
