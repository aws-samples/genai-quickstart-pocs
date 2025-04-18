from datetime import datetime

from InlineAgent.tools import MCPStdio
from InlineAgent.action_group import ActionGroup
from InlineAgent.agent import InlineAgent
from InlineAgent import AgentAppConfig

# Import the configuration
from config import Config

# Initialize config
config = Config()

# Load the Bedrock configuration
bedrock_config = AgentAppConfig()

# Get current date
current_date = datetime.now().strftime("%Y-%m-%d")


async def main():
    # Create and start the MCP client using parameters from config
    yahoo_finance_client = await MCPStdio.create(
        server_params=config.get_server_params()
    )

    try:
        # Create the action group with the Yahoo Finance tools
        yahoo_finance_action_group = ActionGroup(
            name="YahooFinanceActionGroup",
            mcp_clients=[yahoo_finance_client],
        )

        # Start the agent with the Yahoo Finance action group
        await InlineAgent(
            foundation_model="us.anthropic.claude-3-5-sonnet-20241022-v2:0",
            instruction=f"""You are a financial analyst assistant that can help with retrieving and analyzing financial data from Yahoo Finance.

Today's date is: {current_date}

You have access to the following Yahoo Finance tools:

1. get_stock_info(ticker)
   - Get comprehensive company information for a stock ticker
   - ticker: Stock symbol (e.g., AAPL, MSFT)

2. get_stock_price(ticker)
   - Get the latest available stock price data
   - Returns current price, open, high, low, and volume

3. get_historical_data(ticker, period="1mo", interval="1d", start_date=None, end_date=None)
   - Get historical price data for a ticker
   - period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
   - interval: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo

4. search_tickers(query)
   - Search for ticker symbols based on a company name or keyword

5. get_financials(ticker, quarterly=False)
   - Get financial statements for a company
   - quarterly: If True, returns quarterly statements instead of annual

6. get_analyst_recommendations(ticker)
   - Get analyst recommendations for a stock

7. get_options_data(ticker, date=None)
   - Get options chain data for a stock

8. get_major_holders(ticker)
   - Get major holders information for a stock

9. compare_stocks(tickers, metric="price", period="1mo")
   - Compare multiple stocks based on a specified metric

When analyzing financial data:
- Compare key metrics across periods to identify trends
- Consider both absolute values and growth rates
- Provide context about industry standards when relevant
- Highlight significant changes or anomalies
- Use simple language to explain complex financial concepts
""",
            agent_name="yahoo_finance_analyst",
            action_groups=[yahoo_finance_action_group],
        ).invoke(
            input_text="Can you provide a financial analysis of Apple (AAPL) by looking at their current stock price and recent performance? Include both raw data and your analysis."
        )

    finally:
        # Clean up the MCP client
        await yahoo_finance_client.cleanup()


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
