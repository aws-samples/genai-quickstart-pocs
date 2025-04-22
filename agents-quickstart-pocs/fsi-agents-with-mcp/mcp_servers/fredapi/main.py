import datetime

from InlineAgent.tools import MCPStdio
from InlineAgent.action_group import ActionGroup
from InlineAgent.agent import InlineAgent
from InlineAgent import AgentAppConfig

# Import the configuration
from config import config

# Load the Bedrock configuration
bedrock_config = AgentAppConfig()

# Get current date
current_date = datetime.datetime.now().strftime("%Y-%m-%d")


async def main():
    # Create and start the MCP client using parameters from config
    fred_api_client = await MCPStdio.create(server_params=config.get_server_params())

    try:
        # Create the action group with the FRED API tools
        fred_api_action_group = ActionGroup(
            name="FREDApiActionGroup",
            mcp_clients=[fred_api_client],
        )

        # Start the agent with the FRED API action group
        await InlineAgent(
            foundation_model="us.anthropic.claude-3-5-sonnet-20241022-v2:0",
            instruction=f"""You are an economic data analyst assistant that can help with retrieving and analyzing economic data from the Federal Reserve Economic Data (FRED).

Today's date is: {current_date}

You have access to the following FRED data tools:

1. get_series_observations(series_id, start_date=None, end_date=None)
   - Retrieves observations (data points) for a FRED economic data series
   - series_id: The FRED series identifier (e.g., GDP, UNRATE, CPIAUCSL)
   - start_date/end_date: Optional date filters in YYYY-MM-DD format

2. search_series(query, search_type="full_text", limit=10)
   - Searches for economic data series by keywords
   - query: Keywords to search for
   - search_type: "full_text" (default), "series_id", or "title"
   - limit: Maximum number of results to return

3. get_category_children(category_id)
   - Gets the child categories for a specified FRED category
   - category_id: The FRED category ID (0 is the root category)

4. get_category_series(category_id)
   - Lists all series under a specific FRED category
   - category_id: The FRED category ID

5. get_release_dates(release_id)
   - Gets all release dates for a given FRED release ID
   - release_id: The FRED release ID

6. get_releases()
   - Lists all economic data releases available in FRED

When analyzing economic data:
- Provide context on what the indicators measure
- Compare trends over time or between related indicators
- Consider seasonal adjustments when present
- Explain the implications of changes in economic data
- Identify significant events or policy changes that might affect the data
""",
            agent_name="economic_analyst",
            action_groups=[fred_api_action_group],
        ).invoke(
            input_text="Can you look up the latest unemployment rate (UNRATE) and inflation data (CPIAUCSL) and explain what these indicators tell us about the current economic situation?"
        )

    finally:
        # Clean up the MCP client
        await fred_api_client.cleanup()


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
