"""
MCP Client Service for AWS Documentation integration
"""

import platform
from mcp import stdio_client, StdioServerParameters
from strands import Agent
from strands.tools.mcp import MCPClient
from strands.agent.conversation_manager import SlidingWindowConversationManager
from .prompt_loader import PromptLoader


class MCPClientService:
    """Service for managing MCP client connections and AWS documentation queries"""

    def __init__(self):
        self.mcp_client = None
        self.agent = None
        self.prompt_loader = PromptLoader()
        self._initialized = False
        self.verification_logs = []

    async def initialize(self):
        """Initialize the MCP client with AWS Documentation server"""
        try:
            self.verification_logs.append("🔧 Initializing MCP client...")

            # Determine command based on platform
            if platform.system() == "Windows":
                stdio_mcp_client = MCPClient(lambda: stdio_client(
                    StdioServerParameters(
                        command="uvx",
                        args=["--from", "awslabs.aws-documentation-mcp-server@latest",
                              "awslabs.aws-documentation-mcp-server.exe"]
                    )
                ))
            else:
                stdio_mcp_client = MCPClient(lambda: stdio_client(
                    StdioServerParameters(
                        command="uvx",
                        args=["awslabs.aws-documentation-mcp-server@latest"]
                    )
                ))

            self.mcp_client = stdio_mcp_client
            self.mcp_client.__enter__()

            tools = self.mcp_client.list_tools_sync()
            self.verification_logs.append(f"📋 Retrieved {len(tools)} tools from AWS Documentation MCP server")

            conversation_manager = SlidingWindowConversationManager(
                window_size=20,
                should_truncate_results=True
            )

            self.agent = Agent(
                model="anthropic.claude-3-sonnet-20240229-v1:0",
                tools=tools,
                system_prompt=self.prompt_loader.get_prompt('mcp_system_prompt'),
                conversation_manager=conversation_manager
            )

            self._initialized = True
            self.verification_logs.append("✅ MCP client initialized successfully")

        except Exception as e:
            self.verification_logs.append(f"❌ Failed to initialize MCP client: {str(e)}")
            self._initialized = False

    def create_mcp_agent_tool(self):
        """Create MCP agent as a tool for the orchestrator"""
        def mcp_agent_tool(query: str) -> str:
            """Query AWS Documentation via MCP for general guidance"""
            if not self._initialized or not self.agent:
                return "MCP Documentation not available"

            try:
                mcp_response = str(self.agent(query))
                # Sanitize response for XSS prevention - escape HTML entities
                import html
                safe_response = html.escape(mcp_response, quote=True)
                return f"AWS Documentation: {safe_response}"
            except Exception as e:
                # Sanitize exception message for XSS prevention
                import html
                safe_error = html.escape(str(e), quote=True)
                return f"MCP Documentation Error: {safe_error}"

        mcp_agent_tool.__name__ = "query_aws_documentation"
        mcp_agent_tool.__doc__ = "Query official AWS documentation for general EMR guidance"
        return mcp_agent_tool

    async def cleanup(self):
        """Clean up MCP client resources"""
        if self.mcp_client and self._initialized:
            try:
                self.mcp_client.__exit__(None, None, None)
                self.verification_logs.append("✅ MCP client connection closed")
            except Exception as e:
                self.verification_logs.append(f"⚠️ Error closing MCP client: {e}")

    @property
    def is_initialized(self):
        return self._initialized
