"""
MCP Tools for Strands Agent
Provides MCP tool definitions as parameters for agent invocation
"""

def get_mcp_tools():
    """Get MCP tools definition for Strands Agent"""
    return {
        "tools": [
            {
                "toolSpec": {
                    "name": "search_aws_documentation",
                    "description": "Search AWS documentation for specific topics",
                    "inputSchema": {
                        "json": {
                            "type": "object",
                            "properties": {
                                "search_phrase": {
                                    "type": "string",
                                    "description": "Search phrase for AWS documentation"
                                },
                                "limit": {
                                    "type": "integer",
                                    "description": "Maximum number of results",
                                    "default": 5
                                }
                            },
                            "required": ["search_phrase"]
                        }
                    }
                }
            },
            {
                "toolSpec": {
                    "name": "read_aws_documentation",
                    "description": "Read specific AWS documentation page",
                    "inputSchema": {
                        "json": {
                            "type": "object",
                            "properties": {
                                "url": {
                                    "type": "string",
                                    "description": "URL of AWS documentation page to read"
                                }
                            },
                            "required": ["url"]
                        }
                    }
                }
            }
        ]
    }

def handle_tool_use(tool_name, tool_input):
    """Handle MCP tool invocation"""
    import subprocess
    import json
    
    if tool_name == "search_aws_documentation":
        result = subprocess.run([
            'mcp', 'call', 'awslabs.aws-documentation-mcp-server', 'search_documentation',
            '--args', json.dumps(tool_input)
        ], capture_output=True, text=True, timeout=30)
        
        return json.loads(result.stdout) if result.returncode == 0 else {"error": result.stderr}
    
    elif tool_name == "read_aws_documentation":
        result = subprocess.run([
            'mcp', 'call', 'awslabs.aws-documentation-mcp-server', 'read_documentation', 
            '--args', json.dumps(tool_input)
        ], capture_output=True, text=True, timeout=30)
        
        return json.loads(result.stdout) if result.returncode == 0 else {"error": result.stderr}
    
    return {"error": f"Unknown tool: {tool_name}"}
