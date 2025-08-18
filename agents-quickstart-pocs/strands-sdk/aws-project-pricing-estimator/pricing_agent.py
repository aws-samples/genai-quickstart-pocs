"""
pricing_agent.py
----------------
Defines the PricingAgentWithMCP class, which wraps a Strands agent and manages
integration with the AWS Pricing MCP server. Handles automatic server startup,
connection, and provides methods for querying pricing data.

Key Features:
- Automatic MCP server process management
- Async connection and session handling
- Example usage in __main__

Usage:
- Used by streamlit_chatbot.py and test_agent.py
- Requires: mcp_config.py for server configuration
"""

from strands import Agent
import asyncio
import subprocess
import time
import os
import platform
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp_config import get_mcp_server_path, get_mcp_server_args, get_mcp_server_cwd, get_mcp_environment

class PricingAgentWithMCP:
    """
    Strands agent with MCP client integration for AWS pricing.
    Manages the lifecycle of the MCP server and provides methods to query pricing data.
    """
    
    def __init__(self):
        """
        Initialize the agent and prepare for MCP integration.
        Sets up the Strands agent and placeholders for MCP session and server process.
        """
        self.agent = Agent()
        self.mcp_session = None
        self.mcp_server_process = None
    
    def is_mcp_server_running(self):
        """
        Check if the MCP server process is already running.
        Returns:
            bool: True if running, False otherwise.
        """
        try:
            system = platform.system()
            
            if system == "Windows":
                # Use tasklist on Windows
                result = subprocess.run(
                    ["tasklist", "/FI", "IMAGENAME eq python.exe", "/FO", "CSV"],
                    capture_output=True,
                    text=True
                )
                # Check if any python process contains our server module
                if result.returncode == 0:
                    return "awslabs.aws-pricing-mcp-server" in result.stdout
                return False
            else:
                # Use pgrep on Unix-like systems (macOS, Linux)
                result = subprocess.run(
                    ["pgrep", "-f", "awslabs.aws-pricing-mcp-server"],
                    capture_output=True,
                    text=True
                )
                return result.returncode == 0
        except Exception:
            return False
    
    def start_mcp_server(self):
        """
        Start the MCP server as a subprocess if not already running.
        Returns:
            bool: True if started successfully or already running, False otherwise.
        """
        if self.is_mcp_server_running():
            print("MCP server is already running")
            return True
        try:
            print("Starting MCP server...")
            server_cwd = get_mcp_server_cwd()
            server_env = get_mcp_environment()
            # Launch the MCP server process
            self.mcp_server_process = subprocess.Popen(
                [get_mcp_server_path()] + get_mcp_server_args(),
                cwd=server_cwd,
                env=server_env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            # Wait briefly to allow the server to start
            time.sleep(2)
            # Check if the process is still running
            if self.mcp_server_process.poll() is None:
                print("MCP server started successfully")
                return True
            else:
                print("Failed to start MCP server")
                return False
        except Exception as e:
            print(f"Error starting MCP server: {e}")
            return False
    
    async def ensure_mcp_connection(self):
        """
        Ensure the MCP server is running and establish a client session.
        Returns:
            bool: True if connected, False otherwise.
        """
        if self.mcp_session:
            return True
        # Start server if not running
        if not self.is_mcp_server_running():
            if not self.start_mcp_server():
                return False
        # Connect to the server
        return await self.connect_to_mcp_server()
    
    async def connect_to_mcp_server(self):
        """
        Connect to the AWS pricing MCP server using stdio.
        Returns:
            ClientSession or None: The MCP client session if successful, else None.
        """
        try:
            server_params = StdioServerParameters(
                command=get_mcp_server_path(),
                args=get_mcp_server_args(),
                cwd=get_mcp_server_cwd(),
                env=get_mcp_environment()
            )
            # Create and start the client session
            async with stdio_client(server_params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    # List available resources and tools for debugging
                    resources = await session.list_resources()
                    print(f"Available MCP resources: {resources}")
                    tools = await session.list_tools()
                    print(f"Available MCP tools: {tools}")
                    self.mcp_session = session
                    return session
        except Exception as e:
            print(f"Failed to connect to MCP server: {e}")
            print("Make sure the aws-pricing-mcp-server is installed and accessible")
            return None
    
    async def get_pricing_data(self, service_name: str = None, region: str = None):
        """
        Query the MCP server for AWS pricing data.
        Args:
            service_name (str, optional): AWS service name (e.g., 'ec2').
            region (str, optional): AWS region (e.g., 'us-east-1').
        Returns:
            Any: Pricing data from the MCP server, or None on failure.
        """
        if not await self.ensure_mcp_connection():
            print("MCP connection not available")
            return None
        try:
            # Example: Call a tool to get pricing for a specific service
            if service_name:
                result = await self.mcp_session.call_tool("get-aws-pricing", {
                    "service": service_name,
                    "region": region or "us-east-1"
                })
                return result
            else:
                # Get all available pricing data
                result = await self.mcp_session.read_resource("aws-pricing-data")
                return result
        except Exception as e:
            print(f"Error getting pricing data: {e}")
            return None
    
    def ask(self, question: str):
        """
        Ask the Strands agent a question (fallback if MCP is not used).
        Args:
            question (str): The user's question.
        Returns:
            Any: The agent's response.
        """
        return self.agent(question)
    
    def __del__(self):
        """
        Cleanup: terminate the MCP server process if it was started by this agent.
        """
        if self.mcp_server_process:
            try:
                self.mcp_server_process.terminate()
                self.mcp_server_process.wait(timeout=5)
            except:
                pass

async def main():
    """Main function to demonstrate MCP integration"""
    # Create the pricing agent
    pricing_agent = PricingAgentWithMCP()
    
    # The agent will automatically handle MCP server startup and connection
    print("Initializing agent with automatic MCP server management...")
    
    # Test MCP connection
    if await pricing_agent.ensure_mcp_connection():
        print("Successfully connected to MCP server!")
        
        # Example: Get pricing data for EC2
        print("\nGetting EC2 pricing data...")
        ec2_pricing = await pricing_agent.get_pricing_data("ec2", "us-east-1")
        if ec2_pricing:
            print(f"EC2 Pricing: {ec2_pricing}")
        
        # Example: Ask the agent a question
        print("\nAsking agent about AWS pricing...")
        response = pricing_agent.ask("What are the main factors that affect AWS pricing?")
        print(f"Agent Response: {response}")
    else:
        print("Failed to connect to MCP server. Running agent without MCP...")
        response = pricing_agent.ask("What are the main factors that affect AWS pricing?")
        print(f"Agent Response: {response}")

if __name__ == "__main__":
    # Run the async main function
    asyncio.run(main()) 