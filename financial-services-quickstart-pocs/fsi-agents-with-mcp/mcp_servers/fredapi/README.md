# FRED API (Federal Reserve Economic Data) with InlineAgent

This documentation demonstrates how to use MCP server to retrieve and analyze economic data from the Federal Reserve Bank of St. Louis through the FRED API.

## Features

- Access economic data series from the Federal Reserve
- Search for data series by keywords
- Browse categories of economic indicators
- Retrieve observation data for specific indicators
- Analyze economic trends and indicators
- Access information about data releases

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

2. Get a free FRED API key:

   - Visit https://fred.stlouisfed.org/docs/api/api_key.html
   - Create an account.
   - Request an API key.

3. Create a `.env` file in this directory.

   - Refer to the `.env.example` for a reference on what variables need to be set.

4. Run the example.
   ```bash
   python main.py
   ```

## Tools

Tool: `get_series_observations`

Retrieves observations (data points) for a FRED economic data series. Provides access to historical values of economic indicators, allowing for trend analysis and economic research.

| Parameters | Description                                              |
| ---------- | -------------------------------------------------------- |
| series_id  | The FRED series identifier (e.g., GDP, UNRATE, CPIAUCSL) |
| start_date | Optional. Start date in YYYY-MM-DD format                |
| end_date   | Optional. End date in YYYY-MM-DD format                  |

Tool: `search_series`

Searches for economic data series by keywords. Helps discover relevant economic indicators and their series IDs.

| Parameters  | Description                                                              |
| ----------- | ------------------------------------------------------------------------ |
| query       | Keywords to search for                                                   |
| search_type | Optional. Type of search: "full_text" (default), "series_id", or "title" |
| limit       | Optional. Maximum number of results to return. Default: 10               |

Tool: `get_category_children`

Gets the child categories for a specified FRED category. Useful for exploring the hierarchical organization of economic data.

| Parameters  | Description                                   |
| ----------- | --------------------------------------------- |
| category_id | The FRED category ID (0 is the root category) |

Tool: `get_category_series`

Lists all series under a specific FRED category. Useful for discovering all available indicators within a particular economic domain.

| Parameters  | Description          |
| ----------- | -------------------- |
| category_id | The FRED category ID |

Tool: `get_release_dates`

Gets all release dates for a given FRED release ID. Useful for tracking when economic data is updated.

| Parameters | Description         |
| ---------- | ------------------- |
| release_id | The FRED release ID |

Tool: `get_releases`

Lists all economic data releases available in FRED. Provides an overview of available data releases and their schedules.

## Example Queries

### Economic Indicators

- "Look up the latest unemployment rate (UNRATE) and analyze the trend"
- "What is the current inflation rate? Use the CPIAUCSL series"
- "Compare GDP growth (GDP) and the S&P 500 (SP500) over the last 5 years"
- "Show me the Federal Funds Rate (FEDFUNDS) changes since 2020"

### Data Discovery

- "Search for economic series related to housing market"
- "What categories of economic data are available in FRED?"
- "List all series in the 'Money, Banking, & Finance' category"
- "When was the latest GDP data released?"

#### Common Economic Series IDs

- **UNRATE** - Unemployment Rate
- **CPIAUCSL** - Consumer Price Index for All Urban Consumers: All Items
- **GDP** - Gross Domestic Product
- **FEDFUNDS** - Federal Funds Effective Rate
- **MORTGAGE30US** - 30-Year Fixed Rate Mortgage Average
- **SP500** - S&P 500
- **DJIA** - Dow Jones Industrial Average
- **M2** - M2 Money Stock
- **NPPTTL** - Total Nonfarm Payrolls
- **HOUST** - Housing Starts
