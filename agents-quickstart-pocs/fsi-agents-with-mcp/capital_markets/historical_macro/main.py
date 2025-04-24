import os
import uuid
import datetime
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

# Generate a UUID for this session to ensure consistent file paths
session_uuid = str(uuid.uuid4())
print(f"Using session UUID: {session_uuid}")

# Global clients for cleanup in signal handlers
fredapi_client = None
perplexity_search_client = None


# Signal handler for graceful shutdown
def signal_handler(sig, frame):
    print("\nExiting gracefully...")
    # We'll exit directly as cleanup happens in the main function
    sys.exit(0)


async def main():
    global fredapi_client, perplexity_search_client

    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Get today's date for reference
    today = datetime.datetime.now()
    today_str = today.strftime("%Y-%m-%d")

    # Create MCP clients for different services
    fredapi_client = await MCPStdio.create(server_params=config.fredapi_params)
    perplexity_search_client = await MCPStdio.create(
        server_params=config.perplexity_search_params
    )

    try:
        # Create action groups for the different tools
        fredapi_action_group = ActionGroup(
            name="FredApiActionGroup",
            mcp_clients=[fredapi_client],
        )

        perplexity_search_action_group = ActionGroup(
            name="PerplexitySearchActionGroup",
            mcp_clients=[perplexity_search_client],
        )

        # Create and invoke the agent with all action groups
        await InlineAgent(
            foundation_model="us.anthropic.claude-3-5-sonnet-20241022-v2:0",
            instruction=f"""You are an expert macroeconomic analyst with deep knowledge of historical economic cycles, monetary policy, fiscal policy, and global economic trends. Your role is to identify historical time periods that share similarities with the current macroeconomic environment and explain the key factors that make these periods comparable.

Use the FRED API to obtain macroeconomic data and indicators, and use Perplexity Search to gather information about current and historical economic conditions. 

Guidelines for your analysis:
1. Consider key economic indicators such as inflation rates, unemployment, GDP growth, interest rates, government debt levels, and monetary policy stances.
2. Look for patterns across different economic cycles and crises.
3. Provide insights into potential future developments based on historical precedents.
4. When analyzing data, focus on providing clear insights and narrative explanation rather than complex statistical analysis.

When using FRED API:
- Retrieve data for standard economic indicators like GDP, inflation (CPI), unemployment, interest rates (federal funds rate), etc.
- Compare current readings with historical data to identify similar patterns.
- Focus on important similarities and differences between time periods.

When using Perplexity Search:
- Research current economic conditions and expert opinions.
- Find information about historical economic periods that appear similar to current conditions.
- Look for analysis from economists about historical parallels to today's economy.

Don't summarize the data, I want a detailed analysis and a strong narrative. 

Today's date: {today_str}
Session UUID: {session_uuid}
""",
            agent_name="macro_historian",
            action_groups=[fredapi_action_group, perplexity_search_action_group],
        ).invoke(
            input_text="What time periods in History are most similar to the macro climate as we see now?",
            session_id=session_uuid,  # Explicitly passing our UUID as the session_id
        )

    finally:
        # Skip cleanup entirely to avoid asyncio issues - let Python's process exit handle it
        print("Execution completed.")

        # Exit immediately to avoid asyncio cancellation errors
        os._exit(0)  # Using os._exit instead of sys.exit to avoid cleanup issues


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nExecution interrupted by user.")
        os._exit(0)  # Force immediate exit
    except Exception as e:
        print(f"Error during execution: {e}")
        os._exit(1)  # Force immediate exit with error code
