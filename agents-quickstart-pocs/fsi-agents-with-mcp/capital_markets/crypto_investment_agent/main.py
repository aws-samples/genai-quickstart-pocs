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
financial_datasets_client = None
fredapi_client = None
perplexity_search_client = None


# Signal handler for graceful shutdown
def signal_handler(sig, frame):
    print("\nExiting gracefully...")
    # We'll exit directly as cleanup happens in the main function
    sys.exit(0)


async def main():
    global financial_datasets_client, fredapi_client, perplexity_search_client

    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Get today's date for reference
    today = datetime.datetime.now()
    today_str = today.strftime("%Y-%m-%d")

    # Calculate dates for typical analysis periods
    one_year_ago = (today - datetime.timedelta(days=365)).strftime("%Y-%m-%d")
    six_months_ago = (today - datetime.timedelta(days=182)).strftime("%Y-%m-%d")
    three_months_ago = (today - datetime.timedelta(days=91)).strftime("%Y-%m-%d")
    one_month_ago = (today - datetime.timedelta(days=30)).strftime("%Y-%m-%d")

    # Create MCP clients for different services
    financial_datasets_client = await MCPStdio.create(
        server_params=config.financial_datasets_params
    )
    fredapi_client = await MCPStdio.create(server_params=config.fredapi_params)
    perplexity_search_client = await MCPStdio.create(
        server_params=config.perplexity_search_params
    )

    # Ensure output directory exists for code interpreter outputs
    output_dir = os.path.join(os.getcwd(), "output", session_uuid)
    os.makedirs(output_dir, exist_ok=True)
    print(f"Created output directory: {output_dir}")

    try:
        # Create action groups for the different tools
        financial_datasets_action_group = ActionGroup(
            name="FinancialDatasetsActionGroup",
            mcp_clients=[financial_datasets_client],
        )

        fredapi_action_group = ActionGroup(
            name="FredApiActionGroup",
            mcp_clients=[fredapi_client],
        )

        perplexity_search_action_group = ActionGroup(
            name="PerplexitySearchActionGroup",
            mcp_clients=[perplexity_search_client],
        )

        # Code Interpreter is a built-in tool, not an MCP
        code_interpreter_action_group = ActionGroup(
            name="CodeInterpreter",
            builtin_tools={"parentActionGroupSignature": "AMAZON.CodeInterpreter"},
        )

        # Define the code example separately to avoid f-string nesting issues
        code_example = """
# Manually create arrays with the data you received from Financial Datasets
dates = ['2023-01-01', '2023-01-02', '2023-01-03']
prices = [30000, 31000, 29500]
volumes = [5000, 5200, 4800]

# Now create a DataFrame
import pandas as pd
from datetime import datetime

# Convert string dates to datetime objects
datetime_dates = [datetime.strptime(date, '%Y-%m-%d') for date in dates]

# Create the DataFrame
btc_data = pd.DataFrame({
    'date': datetime_dates,
    'price': prices,
    'volume': volumes
})

# Now you can analyze and visualize this data
"""

        # Create and invoke the agent with all action groups
        await InlineAgent(
            foundation_model="us.anthropic.claude-3-5-sonnet-20241022-v2:0",
            instruction=f"""You are an expert cryptocurrency investment analyst with deep knowledge of crypto markets, blockchain technology, macroeconomic factors, and investment risk modeling. Your role is to analyze cryptocurrency investment opportunities, assess risks, and build investment models.

You have access to the following tools:
1. Financial Datasets - Use this to get historical and current cryptocurrency price data
2. FRED API - Use this to analyze macroeconomic indicators that might impact crypto markets
3. Perplexity Search - Use this to research current crypto market news and trends
4. Code Interpreter - Use this to create investment models, simulate risk scenarios, and visualize data

When a user asks about a cryptocurrency investment, you should:
1. Research the cryptocurrency using financial datasets to get price history
2. Use perplexity search to gather news and analyst opinions about the cryptocurrency
3. Use FRED API to understand relevant macroeconomic factors that could impact the crypto market
4. Use code interpreter to:
   - Create visualizations of price trends
   - Model the potential performance of a $100,000 investment
   - Calculate key metrics like volatility, max drawdown, risk-adjusted returns
   - Run various risk scenarios to show best/worst case outcomes

Guidelines for using Financial Datasets:
- Use get_available_cryptos() to see what cryptocurrencies are available
- Use get_historical_crypto_prices(ticker, start_date, end_date) to get historical price data
- Remember that crypto tickers need "CRYPTO:" prefix (e.g., "CRYPTO:BTC")

Guidelines for using FRED API:
- Focus on key economic indicators like inflation, interest rates, money supply that affect crypto
- Look for correlations between economic events and crypto market movements

Guidelines for using Perplexity Search:
- Search for recent regulatory news that could impact the cryptocurrency
- Look for information about technological developments or adoption milestones
- Search for expert market analyses and price predictions

Guidelines for Code Interpreter:
- CRITICAL: Code interpreter CANNOT access data from other tools directly. You must manually read the data from other tools and manually type in key values.
- When creating visualizations, use $BASE_PATH$/filename.png for the output path

IMPORTANT: When using Code Interpreter with data from Financial Datasets:
1. First call the Financial Datasets tool to get data
2. Read the response carefully 
3. In Code Interpreter, manually type in the values from the API response as literal values
4. DO NOT try to parse or access the original API response - it's not available to Code Interpreter

For example, if the Financial Datasets tool returns price data like:
[Example response]
BTC prices:
2023-01-01: $30,000, volume: 5000
2023-01-02: $31,000, volume: 5200
2023-01-03: $29,500, volume: 4800
[End of example]

You must use Code Interpreter like this:

{code_example}

If you do not follow these instructions, the code interpreter will not work.

Focus on creating clear visualizations for:
- Historical price and volume trends
- Volatility analysis
- Risk/return scenarios for a $100,000 investment
- Performance comparison to traditional assets if relevant

Today's date: {today_str}
One year ago: {one_year_ago}
Six months ago: {six_months_ago}
Three months ago: {three_months_ago}
One month ago: {one_month_ago}
Session UUID: {session_uuid}
""",
            agent_name="crypto_investment_analyst",
            action_groups=[
                financial_datasets_action_group,
                fredapi_action_group,
                perplexity_search_action_group,
                code_interpreter_action_group,
            ],
        ).invoke(
            input_text="I'm considering investing $100,000 in Bitcoin (BTC) and Ethereum (ETH) with a time horizon of 2 years. Just give me the data for the last 30 days. Can you analyze the potential risks and returns, how it correlates to the macro environment, and suggest an allocation between these two assets, and show me what different market scenarios might look like for this investment?",
            session_id=session_uuid,  # Explicitly passing our UUID as the session_id
        )

    finally:
        # Skip cleanup entirely to avoid asyncio issues - let Python's process exit handle it
        print("Execution completed. Output files saved to:")
        print(f"/projects/output/{session_uuid}/")
        print(f"Local path: {output_dir}")

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
