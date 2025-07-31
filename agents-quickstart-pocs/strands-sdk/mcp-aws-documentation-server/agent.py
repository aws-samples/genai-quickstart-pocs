from mcp import stdio_client, StdioServerParameters
from strands import Agent
from strands.tools.mcp import MCPClient
from strands.models.bedrock import BedrockModel
import asyncio
import platform
import subprocess
import shutil
import signal
import threading
import time

def _get_uvx_command():
    """Get the appropriate uvx command for the current platform."""
    system = platform.system().lower()
    
    if system == "windows":
        # On Windows, try to find uvx in PATH
        if shutil.which("uvx"):
            return "uvx"
        # If not found, try with .exe extension
        elif shutil.which("uvx.exe"):
            return "uvx.exe"
        else:
            raise RuntimeError("uvx not found. Please install uv and uvx first.")
    else:
        # On macOS/Linux, use uvx directly
        return "uvx"

# Synchronous function to query AWS documentation using the agent
# Returns the full response as a string (or AgentResult)
def query_aws_docs(query_string: str, timeout_seconds=60):
    """Query AWS documentation with timeout protection."""
    
    def run_agent():
        try:
            # Create an MCP client that launches the AWS Documentation MCP Server
            stdio_mcp_client = MCPClient(lambda: stdio_client(
                StdioServerParameters(
                    command=_get_uvx_command(), 
                    args=["awslabs.aws-documentation-mcp-server@latest"]
                )))
            # Use a synchronous context manager for MCPClient
            with stdio_mcp_client:
                tools = stdio_mcp_client.list_tools_sync()
                # Create agent with Claude Haiku model
                model = BedrockModel(model="anthropic.claude-3-haiku-20240307-v1:0")
                agent = Agent(tools=tools, model=model)
                return agent(query_string)
        except Exception as e:
            return f"Error in agent execution: {str(e)}"
    
    # Run the agent in a separate thread with timeout
    result = [None]
    exception = [None]
    
    def target():
        try:
            result[0] = run_agent()
        except Exception as e:
            exception[0] = e
    
    thread = threading.Thread(target=target)
    thread.daemon = True
    thread.start()
    thread.join(timeout=timeout_seconds)
    
    if thread.is_alive():
        return f"Request timed out after {timeout_seconds} seconds. The agent may be stuck in a loop."
    
    if exception[0]:
        return f"Error: {exception[0]}"
    
    return result[0]

# Simple test function for basic queries
def query_aws_docs_simple(query_string: str):
    """Simple version that just returns a basic response for testing."""
    try:
        # Create an MCP client that launches the AWS Documentation MCP Server
        stdio_mcp_client = MCPClient(lambda: stdio_client(
            StdioServerParameters(
                command=_get_uvx_command(), 
                args=["awslabs.aws-documentation-mcp-server@latest"]
            )))
        # Use a synchronous context manager for MCPClient
        with stdio_mcp_client:
            tools = stdio_mcp_client.list_tools_sync()
            # Create agent with Claude Haiku model
            model = BedrockModel(model="anthropic.claude-3-haiku-20240307-v1:0")
            agent = Agent(tools=tools, model=model)
            result = agent(query_string)
            
            # Extract text content
            if hasattr(result, 'text'):
                return result.text
            elif hasattr(result, 'content'):
                return result.content
            else:
                return str(result)
    except Exception as e:
        return f"Error: {str(e)}"

# Internal generator to stream agent results as strings (if supported)
def _stream_agent_chunks(query_string: str):
    # Create an MCP client for the AWS Documentation MCP Server
    stdio_mcp_client = MCPClient(lambda: stdio_client(
        StdioServerParameters(
            command=_get_uvx_command(),
            args=["awslabs.aws-documentation-mcp-server@latest"]
        )
    ))
    # Use a synchronous context manager for MCPClient
    with stdio_mcp_client:
        tools = stdio_mcp_client.list_tools_sync()
        # Create agent with Claude Haiku model
        model = BedrockModel(model="anthropic.claude-3-haiku-20240307-v1:0")
        agent = Agent(tools=tools, model=model)
        # If the agent supports streaming, yield each chunk as a string
        if hasattr(agent, 'stream'):
            for chunk in agent.stream(query_string):
                # Extract string content from chunk (AgentResult or similar)
                if hasattr(chunk, 'text'):
                    yield chunk.text
                elif hasattr(chunk, 'content'):
                    yield chunk.content
                else:
                    yield str(chunk)
        else:
            # Fallback: yield the full result as a string
            result = agent(query_string)
            if hasattr(result, 'text'):
                yield result.text
            elif hasattr(result, 'content'):
                yield result.content
            else:
                yield str(result)

# Async generator to stream agent results in a non-blocking way for the UI
async def query_aws_docs_streaming(query_string: str):
    loop = asyncio.get_event_loop()
    # Run the blocking streaming generator in a thread executor
    for chunk in await loop.run_in_executor(None, lambda: list(_stream_agent_chunks(query_string))):
        yield chunk

# Synchronous streaming function for Streamlit compatibility
def query_aws_docs_streaming_sync(query_string: str):
    """Synchronous version of streaming for Streamlit compatibility."""
    for chunk in _stream_agent_chunks(query_string):
        yield chunk

if __name__ == "__main__":
    # Example CLI usage: print the result of a sample query
    response = query_aws_docs("look up documentation on S3 bucket naming rule. cite your sources")
    print(response)
        
