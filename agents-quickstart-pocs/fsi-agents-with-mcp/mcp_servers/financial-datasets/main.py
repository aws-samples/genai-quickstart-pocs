from InlineAgent.tools import MCPStdio
from InlineAgent.action_group import ActionGroup
from InlineAgent.agent import InlineAgent
from InlineAgent import AgentAppConfig

# Import the configuration
from config import config

# Load the Bedrock configuration
bedrock_config = AgentAppConfig()


async def main():
    # Create and start the MCP client using parameters from config
    financial_datasets_client = await MCPStdio.create(
        server_params=config.get_server_params()
    )

    try:
        # Create the action group with the financial datasets tools
        financial_datasets_action_group = ActionGroup(
            name="FinancialDatasetsActionGroup",
            mcp_clients=[financial_datasets_client],
        )

        # Start the agent with the financial datasets action group
        await InlineAgent(
            foundation_model="us.anthropic.claude-3-5-sonnet-20241022-v2:0",
            instruction="""You are a financial analyst assistant that can help with retrieving and analyzing financial data.

You have access to the following financial data tools:

1. get_income_statements(ticker, period="annual", limit=4)
   - Retrieves income statements for a company
   - ticker: Stock symbol (e.g., AAPL, MSFT)
   - period: "annual", "quarterly", or "ttm" (trailing twelve months)
   - limit: Number of statements to return

2. get_balance_sheets(ticker, period="annual", limit=4)
   - Retrieves balance sheets for a company
   - Same parameters as get_income_statements

3. get_cash_flow_statements(ticker, period="annual", limit=4)
   - Retrieves cash flow statements for a company
   - Same parameters as get_income_statements

4. get_current_stock_price(ticker)
   - Gets the current/latest price for a stock

5. get_historical_stock_prices(ticker, start_date, end_date, interval="day", interval_multiplier=1)
   - Gets historical prices for a specified date range
   - start_date/end_date: Format YYYY-MM-DD
   - interval: "minute", "hour", "day", "week", "month"
   - interval_multiplier: Integer to multiply the interval

6. get_company_news(ticker)
   - Retrieves recent news for a company

7. get_available_crypto_tickers()
   - Lists all available cryptocurrency tickers

8. get_crypto_prices(ticker, start_date, end_date, interval="day", interval_multiplier=1)
   - Gets historical cryptocurrency prices
   - Similar parameters to get_historical_stock_prices

9. get_current_crypto_price(ticker)
   - Gets the current/latest price for a cryptocurrency

When analyzing financial data:
- Compare key metrics across periods to identify trends
- Consider both absolute values and growth rates
- Provide context about industry standards when relevant
- Highlight significant changes or anomalies
- Use simple language to explain complex financial concepts
""",
            agent_name="financial_analyst",
            action_groups=[financial_datasets_action_group],
        ).invoke(
            input_text="Can you provide a financial analysis of Apple (AAPL) by looking at their income statements and current stock price? Include both raw data and your analysis."
        )

    finally:
        # Clean up the MCP client
        await financial_datasets_client.cleanup()


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
