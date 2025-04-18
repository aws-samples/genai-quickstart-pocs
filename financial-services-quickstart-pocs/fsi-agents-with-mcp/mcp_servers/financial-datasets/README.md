# Financial Datasets MCP Server with InlineAgent

This documentation demonstrates how to use MCP server to retrieve and analyze financial data for stocks and cryptocurrencies through a financial datasets API.

## Features

- Retrieve company financial statements (income, balance sheet, cash flow)
- Get current and historical stock prices
- Access company news
- Retrieve cryptocurrency pricing data
- Perform financial analysis with AI assistance

## Setup

1. Activate virtual environment from project's root directory.

   ```bash
   # On macOS and Linux.
   source .venv/bin/activate
   ```

   ```bash
   # On Windows.
   .venv\Scripts\activate
   ```

2. Get a financial datasets API key.

   - Visit https://www.financialdatasets.ai/
   - Create an account.
   - Create an API key.

3. Create a `.env` file in this directory.

   - Refer to the `.env.example` for a reference on what variables need to be set.

4. Run the example.
   ```bash
   python main.py
   ```

## Tools

Tool: `get_income_statements`

Retrieves income statements for a company. Provides detailed financial performance data including revenue, expenses, and profits.

| Parameters | Description                                                                                                       |
| ---------- | ----------------------------------------------------------------------------------------------------------------- |
| ticker     | Stock symbol (e.g., AMZN)                                                                                         |
| period     | Optional. Time period for statements: "annual", "quarterly", or "ttm" (trailing twelve months). Default: "annual" |
| limit      | Optional. Number of statements to return. Default: 4                                                              |

Tool: `get_balance_sheets`

Retrieves balance sheets for a company. Shows the company's assets, liabilities, and shareholders' equity at specific points in time.

| Parameters | Description                                                                                                       |
| ---------- | ----------------------------------------------------------------------------------------------------------------- |
| ticker     | Stock symbol (e.g., AMZN)                                                                                         |
| period     | Optional. Time period for statements: "annual", "quarterly", or "ttm" (trailing twelve months). Default: "annual" |
| limit      | Optional. Number of statements to return. Default: 4                                                              |

Tool: `get_cash_flow_statements`

Retrieves cash flow statements for a company. Shows how changes in balance sheet accounts and income affect cash and cash equivalents.

| Parameters | Description                                                                                                       |
| ---------- | ----------------------------------------------------------------------------------------------------------------- |
| ticker     | Stock symbol (e.g., AMZN)                                                                                         |
| period     | Optional. Time period for statements: "annual", "quarterly", or "ttm" (trailing twelve months). Default: "annual" |
| limit      | Optional. Number of statements to return. Default: 4                                                              |

Tool: `get_current_stock_price`

Gets the current/latest price for a stock.

| Parameters | Description               |
| ---------- | ------------------------- |
| ticker     | Stock symbol (e.g., AMZN) |

Tool: `get_historical_stock_prices`

Gets historical prices for a specified date range. Useful for analyzing price trends and performing technical analysis.

| Parameters          | Description                                                                       |
| ------------------- | --------------------------------------------------------------------------------- |
| ticker              | Stock symbol (e.g., AMZN)                                                         |
| start_date          | Start date in YYYY-MM-DD format                                                   |
| end_date            | End date in YYYY-MM-DD format                                                     |
| interval            | Optional. Time interval: "minute", "hour", "day", "week", "month". Default: "day" |
| interval_multiplier | Optional. Integer to multiply the interval. Default: 1                            |

Tool: `get_company_news`

Retrieves recent news articles and updates about a company.

| Parameters | Description               |
| ---------- | ------------------------- |
| ticker     | Stock symbol (e.g., AMZN) |

Tool: `get_available_crypto_tickers`

Lists all available cryptocurrency tickers that can be used with other cryptocurrency tools.

Tool: `get_crypto_prices`

Gets historical cryptocurrency prices for a specified date range.

| Parameters          | Description                                                                       |
| ------------------- | --------------------------------------------------------------------------------- |
| ticker              | Cryptocurrency symbol (e.g., BTC, ETH)                                            |
| start_date          | Start date in YYYY-MM-DD format                                                   |
| end_date            | End date in YYYY-MM-DD format                                                     |
| interval            | Optional. Time interval: "minute", "hour", "day", "week", "month". Default: "day" |
| interval_multiplier | Optional. Integer to multiply the interval. Default: 1                            |

Tool: `get_current_crypto_price`

Gets the current/latest price for a cryptocurrency.

| Parameters | Description                            |
| ---------- | -------------------------------------- |
| ticker     | Cryptocurrency symbol (e.g., BTC, ETH) |

## Example Queries

### Stock Analysis

- "Analyze Apple's (AAPL) financial performance over the past 3 years"
- "Compare Microsoft (MSFT) and Google (GOOGL) income statements"
- "Show me the current stock price and recent news for Tesla (TSLA)"
- "Calculate key financial ratios for Amazon (AMZN) based on their latest balance sheet"

### Cryptocurrency Analysis

- "What cryptocurrencies are available for analysis?"
- "Show Bitcoin's (BTC) price trend over the past month"
- "Compare Ethereum (ETH) and Cardano (ADA) price performance year-to-date"
- "What is the current price of Dogecoin (DOGE)?"
