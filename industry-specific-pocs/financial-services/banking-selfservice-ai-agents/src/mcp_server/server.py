"""MCP Server for Bank Card Operations"""
import json
import sys
import os
from typing import Any

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from mcp.server import Server
from mcp.types import Tool, TextContent
from src.lambda_handler.handler import lambda_handler


# Initialize MCP server
app = Server("bank-card-operations")


@app.list_tools()
async def handle_list_tools() -> list[Tool]:
    """List available card operation tools"""
    return [
        Tool(
            name="lock_card",
            description=(
                "Lock a customer's debit card to prevent transactions. "
                "Use this when a customer reports their card as lost, stolen, "
                "or suspects fraudulent activity. The card can be unlocked later."
            ),
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
        ),
        Tool(
            name="unlock_card",
            description=(
                "Unlock a customer's debit card to restore transaction capability. "
                "Use this when a customer has found their card or resolved the "
                "security concern that caused them to lock it."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "customer_id": {
                        "type": "string",
                        "description": "Unique identifier for the customer (e.g., CUST001)"
                    },
                    "card_id": {
                        "type": "string",
                        "description": "Unique identifier for the card to unlock (e.g., CARD001)"
                    }
                },
                "required": ["customer_id", "card_id"]
            }
        ),
        Tool(
            name="request_new_card",
            description=(
                "Request a replacement debit card for a customer. "
                "Use this when a customer's card is damaged, permanently lost, "
                "stolen, or expired. A new card will be mailed to the customer."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "customer_id": {
                        "type": "string",
                        "description": "Unique identifier for the customer (e.g., CUST001)"
                    },
                    "account_id": {
                        "type": "string",
                        "description": "Unique identifier for the account (e.g., ACC001)"
                    },
                    "reason": {
                        "type": "string",
                        "description": "Optional reason for requesting a new card (e.g., 'Lost card', 'Damaged')"
                    },
                    "delivery_address": {
                        "type": "string",
                        "description": "Optional delivery address if different from address on file"
                    }
                },
                "required": ["customer_id", "account_id"]
            }
        )
    ]


@app.call_tool()
async def handle_call_tool(name: str, arguments: Any) -> list[TextContent]:
    """Handle tool calls by invoking Lambda function"""
    
    # Map tool names to API paths
    tool_to_path = {
        "lock_card": "/v1/cards/lock",
        "unlock_card": "/v1/cards/unlock",
        "request_new_card": "/v1/cards/request-new"
    }
    
    if name not in tool_to_path:
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
    
    # Create Lambda event (simulating API Gateway)
    event = {
        "httpMethod": "POST",
        "path": tool_to_path[name],
        "body": json.dumps(arguments)
    }
    
    try:
        # Call Lambda handler
        response = lambda_handler(event, None)
        
        # Parse response
        status_code = response.get("statusCode", 500)
        body = json.loads(response.get("body", "{}"))
        
        # Format response for AI agent
        if status_code == 200:
            return [TextContent(
                type="text",
                text=json.dumps(body, indent=2)
            )]
        else:
            # Error response
            return [TextContent(
                type="text",
                text=json.dumps({
                    "success": False,
                    "error": body.get("error", {
                        "code": "UNKNOWN_ERROR",
                        "message": "An error occurred"
                    })
                }, indent=2)
            )]
    
    except Exception as e:
        # Handle unexpected errors
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
