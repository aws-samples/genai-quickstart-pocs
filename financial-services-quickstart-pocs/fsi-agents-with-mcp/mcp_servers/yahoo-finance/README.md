# Yahoo Finance MCP Server with InlineAgent

This documentation demonstrates how to use MCP server to retrieve and analyze financial data for stocks through Yahoo Finance, including price data, financial statements, and more.

## Features

- Retrieve real-time and historical stock price data
- Access company financial statements and information
- Get analyst recommendations and major holders data
- Search for ticker symbols
- Compare multiple stocks
- Access options data
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

2. Run the example.
   ```bash
   python main.py
   ```

## Tools

Tool: `get_stock_info`

Get comprehensive company information for a stock ticker, including company profile, sector, industry, and key statistics.

| Parameters | Description               |
| ---------- | ------------------------- |
| ticker     | Stock symbol (e.g., AMZN) |

Tool: `get_stock_price`

Get the latest available stock price data, including current price, open, high, low, and volume.

| Parameters | Description               |
| ---------- | ------------------------- |
| ticker     | Stock symbol (e.g., AMZN) |

Tool: `get_historical_data`

Get historical price data for a ticker with flexible time period and interval options.

| Parameters | Description                                                                         |
| ---------- | ----------------------------------------------------------------------------------- |
| ticker     | Stock symbol (e.g., AMZN)                                                           |
| period     | Optional. Time range (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)             |
| interval   | Optional. Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo) |
| start_date | Optional. Start date for custom range                                               |
| end_date   | Optional. End date for custom range                                                 |

Tool: `search_tickers`

Search for ticker symbols based on a company name or keyword.

| Parameters | Description                           |
| ---------- | ------------------------------------- |
| query      | Search term (company name or keyword) |

Tool: `get_financials`

Get financial statements for a company, including income statement, balance sheet, and cash flow statement.

| Parameters | Description                                                       |
| ---------- | ----------------------------------------------------------------- |
| ticker     | Stock symbol (e.g., AMZN)                                         |
| quarterly  | Optional. If True, returns quarterly statements instead of annual |

Tool: `get_analyst_recommendations`

Get analyst recommendations for a stock, including buy/sell ratings and price targets.

| Parameters | Description               |
| ---------- | ------------------------- |
| ticker     | Stock symbol (e.g., AMZN) |

Tool: `get_options_data`

Get options chain data for a stock, including calls and puts at various strike prices.

| Parameters | Description                                 |
| ---------- | ------------------------------------------- |
| ticker     | Stock symbol (e.g., AMZN)                   |
| date       | Optional. Specific expiration date to query |

Tool: `get_major_holders`

Get major holders information for a stock, including institutional and insider ownership.

| Parameters | Description               |
| ---------- | ------------------------- |
| ticker     | Stock symbol (e.g., AMZN) |

Tool: `compare_stocks`

Compare multiple stocks based on a specified metric over a given time period.

| Parameters | Description                                                   |
| ---------- | ------------------------------------------------------------- |
| tickers    | List of stock symbols to compare                              |
| metric     | Optional. Metric to compare ("price", etc.). Default: "price" |
| period     | Optional. Time period for comparison. Default: "1mo"          |

## Example Queries

### Stock Analysis

- "What's the current price and trading volume for Tesla (TSLA)?"
- "Show me Apple's (AAPL) historical stock performance over the past year"
- "Compare the performance of Microsoft (MSFT) and Google (GOOGL)"
- "Get the latest analyst recommendations for Amazon (AMZN)"
- "Who are the major holders of Netflix (NFLX) stock?"

### Financial Analysis

- "Analyze Microsoft's (MSFT) quarterly financial statements"
- "Show me the options chain for Apple (AAPL)"
- "Search for companies in the electric vehicle industry"
- "Compare the market cap of major tech companies"
- "Get detailed company information for Tesla (TSLA)"
