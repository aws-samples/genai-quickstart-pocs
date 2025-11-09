"""
MCP Tools Integration for AWS Documentation MCP Server
Provides tools for structured AWS service documentation access
"""
import json
import logging
import subprocess
import os
from typing import Dict, List, Any, Optional

logger = logging.getLogger()

class MCPDocumentationClient:
    """Client for AWS Documentation MCP Server"""
    
    def __init__(self):
        self.server_path = os.environ.get('MCP_SERVER_PATH', 'uvx')
        self.server_args = ['awslabs.aws-documentation-mcp-server@latest']
        
    def get_service_documentation(self, service_name: str) -> Optional[Dict[str, Any]]:
        """Get comprehensive documentation for an AWS service using search"""
        try:
            logger.info(f"Searching MCP documentation for service: {service_name}")
            
            # Use search_documentation to find service docs
            search_query = f"{service_name} service documentation"
            return self.search_documentation(search_query, 10)
            
        except Exception as e:
            logger.error(f"Error fetching MCP documentation for {service_name}: {str(e)}")
            return None
    
    def search_documentation(self, query: str, service: Optional[str] = None) -> Optional[List[Dict[str, Any]]]:
        """Search AWS documentation using MCP server"""
        try:
            logger.info(f"Searching MCP documentation with query: {query}")
            
            # Prepare MCP request
            mcp_request = {
                "jsonrpc": "2.0",
                "id": 2,
                "method": "tools/call",
                "params": {
                    "name": "search_documentation",
                    "arguments": {
                        "search_phrase": query,
                        "limit": 10
                    }
                }
            }
            
            # Execute MCP server call
            result = self._execute_mcp_call(mcp_request)
            
            if result and 'content' in result:
                logger.info(f"Successfully searched MCP documentation for query: {query}")
                return result['content']
            
            return None
            
        except Exception as e:
            logger.error(f"Error searching MCP documentation: {str(e)}")
            return None
    
    def get_service_actions(self, service_name: str) -> Optional[List[Dict[str, Any]]]:
        """Get IAM actions for a service using MCP"""
        try:
            # Use search to find IAM actions
            search_query = f"{service_name} IAM actions permissions"
            results = self.search_documentation(search_query)
            
            if results:
                # Extract actions from search results
                actions = []
                for result in results:
                    if 'actions' in result.get('content', '').lower():
                        actions.append(result)
                
                return actions
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting MCP service actions for {service_name}: {str(e)}")
            return None
    
    def get_service_parameters(self, service_name: str) -> Optional[List[Dict[str, Any]]]:
        """Get CloudFormation parameters for a service using MCP"""
        try:
            # Use search to find CloudFormation parameters
            search_query = f"{service_name} CloudFormation properties parameters"
            results = self.search_documentation(search_query)
            
            if results:
                # Extract parameters from search results
                parameters = []
                for result in results:
                    content = result.get('content', '').lower()
                    if any(keyword in content for keyword in ['properties', 'parameters', 'cloudformation']):
                        parameters.append(result)
                
                return parameters
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting MCP service parameters for {service_name}: {str(e)}")
            return None
    
    def _execute_mcp_call(self, request: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Execute MCP server call via subprocess"""
        try:
            # Convert request to JSON string
            request_json = json.dumps(request)
            
            # Execute MCP server
            process = subprocess.Popen(
                [self.server_path] + self.server_args,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Send request and get response
            stdout, stderr = process.communicate(input=request_json, timeout=30)
            
            if process.returncode == 0:
                # Parse JSON response
                response = json.loads(stdout)
                
                if 'result' in response:
                    return response['result']
                elif 'error' in response:
                    logger.error(f"MCP server error: {response['error']}")
                    return None
            else:
                logger.error(f"MCP server failed with return code {process.returncode}: {stderr}")
                return None
            
        except subprocess.TimeoutExpired:
            logger.error("MCP server call timed out")
            process.kill()
            return None
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse MCP server response: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Error executing MCP server call: {str(e)}")
            return None

def get_mcp_tools() -> Dict[str, Any]:
    """Get MCP tools configuration for Bedrock Agent"""
    return {
        "toolChoice": {
            "auto": {}
        },
        "tools": [
            {
                "toolSpec": {
                    "name": "get_aws_service_documentation",
                    "description": "Get comprehensive AWS service documentation including IAM actions, CloudFormation properties, and service capabilities",
                    "inputSchema": {
                        "json": {
                            "type": "object",
                            "properties": {
                                "service_name": {
                                    "type": "string",
                                    "description": "AWS service name (e.g., 's3', 'lambda', 'dynamodb')"
                                }
                            },
                            "required": ["service_name"]
                        }
                    }
                }
            },
            {
                "toolSpec": {
                    "name": "search_aws_documentation",
                    "description": "Search AWS documentation for specific topics, configurations, or best practices",
                    "inputSchema": {
                        "json": {
                            "type": "object",
                            "properties": {
                                "query": {
                                    "type": "string",
                                    "description": "Search query for AWS documentation"
                                },
                                "service": {
                                    "type": "string",
                                    "description": "Optional: Limit search to specific AWS service"
                                }
                            },
                            "required": ["query"]
                        }
                    }
                }
            }
        ]
    }

# Global MCP client instance
_mcp_client = None

def get_mcp_client() -> MCPDocumentationClient:
    """Get singleton MCP client instance"""
    global _mcp_client
    if _mcp_client is None:
        _mcp_client = MCPDocumentationClient()
    return _mcp_client