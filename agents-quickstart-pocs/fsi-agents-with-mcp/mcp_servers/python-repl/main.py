import uuid
import asyncio
import signal
import sys

from InlineAgent.tools import MCPStdio
from InlineAgent.action_group import ActionGroup
from InlineAgent.agent import InlineAgent
from InlineAgent import AgentAppConfig

# Import the configuration
from config import config

# Load the Bedrock configuration
bedrock_config = AgentAppConfig()

# Generate a UUID for this session
session_uuid = str(uuid.uuid4())
print(f"Using session UUID: {session_uuid}")

# Global client for cleanup in signal handler
python_repl_client = None


# Signal handler for graceful shutdown
def signal_handler(sig, frame):
    print("\nExiting gracefully...")
    # We'll exit directly as cleanup happens in the main function
    sys.exit(0)


async def main():
    global python_repl_client

    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Create the MCP client for Python REPL
    python_repl_client = await MCPStdio.create(server_params=config.server_params)

    try:
        # Create action group for the Python REPL tool
        python_repl_action_group = ActionGroup(
            name="PythonReplActionGroup",
            mcp_clients=[python_repl_client],
        )

        # Demonstrate Python REPL usage
        await InlineAgent(
            foundation_model="us.anthropic.claude-3-5-sonnet-20241022-v2:0",
            instruction=f"""You are an expert Python coding assistant. You help users write, execute, and debug Python code. 

You have access to a Python REPL (Read-Eval-Print Loop) through the following tools:

1. execute_python - Run Python code and return the output
   - Code will persist between executions in the same session
   - Variables remain available for subsequent commands
   
2. list_variables - Show all variables currently defined in the session

3. install_package - Install Python packages using uv
   - Use this to install any required libraries before using them
   - Package is automatically imported after installation

When writing code:
- Ensure your code is correct, efficient, and follows best practices
- When appropriate, explain your code and approach
- If a user's code has errors, help debug and fix the issues
- Suggest improvements or optimizations when relevant

For data analysis and visualization tasks:
- Recommend appropriate libraries (pandas, matplotlib, etc.)
- Help install any necessary packages
- Guide users through analyzing and visualizing their data

When helping users learn Python:
- Explain concepts clearly with examples
- Break down complex topics into manageable pieces
- Provide context for why certain approaches are recommended

Session UUID: {session_uuid}
""",
            agent_name="python_repl_assistant",
            action_groups=[python_repl_action_group],
        ).invoke(
            input_text=f"I'm a Python beginner. Can you show me how to work with this Python REPL? Maybe start with a simple example and then something more advanced with data visualization."
        )

    finally:
        if python_repl_client:
            await python_repl_client.cleanup()
        print("Execution completed.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nExecution interrupted by user.")
    except Exception as e:
        print(f"Error during execution: {e}")
