# server.py
from mcp.server.fastmcp import FastMCP
import yfinance as yf
import pandas as pd
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
import numpy as np
import os


# Initialize FastMCP server
mcp = FastMCP("Yahoo Finance")


@mcp.tool()
def get_stock_info(ticker: str) -> Dict[str, Any]:
    """
    Get comprehensive company information for a stock ticker.

    Args:
        ticker: The stock ticker symbol (e.g., AAPL, MSFT, TSLA)

    Returns:
        Dictionary containing company information including sector, industry,
        market cap, and many other data points.
    """
    stock = yf.Ticker(ticker)
    return stock.info


@mcp.tool()
def get_stock_price(ticker: str) -> Dict[str, float]:
    """
    Get the latest available stock price data.

    Args:
        ticker: The stock ticker symbol (e.g., AAPL, MSFT, TSLA)

    Returns:
        Dictionary with current price, open, high, low, and previous close.
    """
    stock = yf.Ticker(ticker)
    history = stock.history(period="1d")

    if history.empty:
        return {"error": "No price data available"}

    latest = history.iloc[-1]

    return {
        "current": round(latest["Close"], 2),
        "open": round(latest["Open"], 2),
        "high": round(latest["High"], 2),
        "low": round(latest["Low"], 2),
        "volume": int(latest["Volume"]),
        "timestamp": str(history.index[-1]),
    }


@mcp.tool()
def get_historical_data(
    ticker: str,
    period: str = "1mo",
    interval: str = "1d",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Get historical price data for a ticker.

    Args:
        ticker: The stock ticker symbol (e.g., AAPL)
        period: Data period to download (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
        interval: Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
        start_date: Start date in YYYY-MM-DD format (optional, overrides period if specified)
        end_date: End date in YYYY-MM-DD format (optional)

    Returns:
        Dictionary containing historical price data
    """
    stock = yf.Ticker(ticker)

    # If start_date is provided, use that instead of period
    if start_date:
        history = stock.history(start=start_date, end=end_date, interval=interval)
    else:
        history = stock.history(period=period, interval=interval)

    if history.empty:
        return {"error": "No historical data available"}

    # Convert the DataFrame to a dictionary format
    result = []
    for date, row in history.iterrows():
        entry = {
            "date": str(date),
            "open": round(row["Open"], 2),
            "high": round(row["High"], 2),
            "low": round(row["Low"], 2),
            "close": round(row["Close"], 2),
            "volume": int(row["Volume"]),
        }

        # Include dividends and splits if they exist and are non-zero
        if "Dividends" in row and row["Dividends"] > 0:
            entry["dividends"] = round(row["Dividends"], 4)

        if "Stock Splits" in row and row["Stock Splits"] > 0:
            entry["stock_splits"] = row["Stock Splits"]

        result.append(entry)

    return {
        "data": result,
        "ticker": ticker,
        "period": period if not start_date else f"{start_date} to {end_date}",
        "interval": interval,
        "record_count": len(result),
    }


@mcp.tool()
def search_tickers(query: str) -> List[Dict[str, str]]:
    """
    Search for ticker symbols based on a company name or keyword.

    Args:
        query: Search term to find matching tickers

    Returns:
        List of dictionaries containing ticker symbols and company names
    """
    search_result = yf.Tickers(query).tickers

    if not search_result:
        return [{"error": "No tickers found"}]

    results = []
    for ticker, ticker_obj in search_result.items():
        try:
            info = ticker_obj.info
            results.append(
                {
                    "symbol": ticker,
                    "name": info.get("shortName", "N/A"),
                    "exchange": info.get("exchange", "N/A"),
                    "quoteType": info.get("quoteType", "N/A"),
                }
            )
        except:
            # Skip tickers that return errors
            continue  # nosec B112 - intentional continue for error handling

    return results


@mcp.tool()
def get_financials(ticker: str, quarterly: bool = False) -> Dict[str, Any]:
    """
    Get financial statements for a company.

    Args:
        ticker: The stock ticker symbol (e.g., AAPL)
        quarterly: If True, returns quarterly statements instead of annual

    Returns:
        Dictionary with income statement, balance sheet, and cash flow data
    """
    stock = yf.Ticker(ticker)

    if quarterly:
        income_stmt = stock.quarterly_income_stmt
        balance_sheet = stock.quarterly_balance_sheet
        cash_flow = stock.quarterly_cash_flow
    else:
        income_stmt = stock.income_stmt
        balance_sheet = stock.balance_sheet
        cash_flow = stock.cash_flow

    # Convert DataFrames to dictionaries
    financials = {
        "income_statement": _dataframe_to_dict(income_stmt),
        "balance_sheet": _dataframe_to_dict(balance_sheet),
        "cash_flow": _dataframe_to_dict(cash_flow),
    }

    return financials


@mcp.tool()
def get_analyst_recommendations(ticker: str) -> List[Dict[str, Any]]:
    """
    Get analyst recommendations for a stock.

    Args:
        ticker: The stock ticker symbol (e.g., AAPL)

    Returns:
        List of dictionaries with analyst recommendations
    """
    stock = yf.Ticker(ticker)
    recommendations = stock.recommendations

    if recommendations is None or recommendations.empty:
        return [{"error": "No analyst recommendations available"}]

    return _dataframe_to_dict(recommendations)


@mcp.tool()
def get_options_data(
    ticker: str, date: Optional[str] = None
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Get options chain data for a stock.

    Args:
        ticker: The stock ticker symbol (e.g., AAPL)
        date: Options expiration date in YYYY-MM-DD format (optional)

    Returns:
        Dictionary containing calls and puts data
    """
    stock = yf.Ticker(ticker)

    # Get available expiration dates
    expirations = stock.options

    if not expirations:
        return {"error": "No options data available for this ticker"}

    # Use first expiration date if none provided
    if date is None:
        date = expirations[0]
    elif date not in expirations:
        return {
            "error": f"Invalid expiration date. Available dates: {', '.join(expirations)}"
        }

    # Get options chain for the specified date
    options = stock.option_chain(date)

    return {
        "expiration_date": date,
        "calls": _dataframe_to_dict(options.calls),
        "puts": _dataframe_to_dict(options.puts),
    }


@mcp.tool()
def get_major_holders(ticker: str) -> Dict[str, Any]:
    """
    Get the major holders for a stock.

    Args:
        ticker: The stock ticker symbol (e.g., AAPL)

    Returns:
        Dictionary with institutional and mutual fund holders
    """
    stock = yf.Ticker(ticker)

    # Get holders info
    major_holders = stock.major_holders
    institutional_holders = stock.institutional_holders
    mutualfund_holders = stock.mutualfund_holders

    result = {
        "major_holders": (
            _dataframe_to_dict(major_holders) if major_holders is not None else None
        ),
        "institutional_holders": (
            _dataframe_to_dict(institutional_holders)
            if institutional_holders is not None
            else None
        ),
        "mutualfund_holders": (
            _dataframe_to_dict(mutualfund_holders)
            if mutualfund_holders is not None
            else None
        ),
    }

    return result


@mcp.tool()
def compare_stocks(
    tickers: List[str], metric: str = "price", period: str = "1mo"
) -> Dict[str, Any]:
    """
    Compare multiple stocks based on a specified metric.

    Args:
        tickers: List of stock ticker symbols (e.g., ["AAPL", "MSFT", "GOOG"])
        metric: Comparison metric (price, returns, volume, pe_ratio, market_cap)
        period: Time period for comparison (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)

    Returns:
        Dictionary with comparison data
    """
    valid_metrics = ["price", "returns", "volume", "pe_ratio", "market_cap"]
    if metric not in valid_metrics:
        return {"error": f"Invalid metric. Choose from: {', '.join(valid_metrics)}"}

    result = {"tickers": tickers, "metric": metric, "period": period, "data": {}}

    if metric == "price":
        # Get historical prices
        data = yf.download(
            tickers=tickers, period=period, interval="1d", group_by="ticker"
        )

        for ticker in tickers:
            if len(tickers) == 1:
                ticker_data = data["Close"]
            else:
                ticker_data = data[ticker]["Close"]

            result["data"][ticker] = {
                "values": list(ticker_data.dropna().values.round(2)),
                "dates": [str(date) for date in ticker_data.dropna().index],
                "start": ticker_data.dropna().iloc[0].round(2),
                "end": ticker_data.dropna().iloc[-1].round(2),
                "change": round(
                    (ticker_data.dropna().iloc[-1] / ticker_data.dropna().iloc[0] - 1)
                    * 100,
                    2,
                ),
            }

    elif metric == "returns":
        # Get returns data
        data = yf.download(
            tickers=tickers, period=period, interval="1d", group_by="ticker"
        )

        for ticker in tickers:
            if len(tickers) == 1:
                ticker_data = data["Close"]
            else:
                ticker_data = data[ticker]["Close"]

            returns = ticker_data.pct_change().dropna() * 100

            result["data"][ticker] = {
                "values": list(returns.values.round(2)),
                "dates": [str(date) for date in returns.index],
                "avg_daily_return": round(returns.mean(), 2),
                "total_return": round(
                    (ticker_data.iloc[-1] / ticker_data.iloc[0] - 1) * 100, 2
                ),
            }

    elif metric in ["pe_ratio", "market_cap"]:
        # Get fundamental data
        for ticker in tickers:
            stock = yf.Ticker(ticker)
            info = stock.info

            if metric == "pe_ratio":
                result["data"][ticker] = info.get("trailingPE", None)
            elif metric == "market_cap":
                result["data"][ticker] = info.get("marketCap", None)

    return result


@mcp.resource("yahoo://{ticker}/info")
def get_ticker_info_resource(ticker: str) -> str:
    """Get basic information about a stock as a resource."""
    stock = yf.Ticker(ticker)
    info = stock.info

    # Extract the most relevant information
    summary = {
        "Name": info.get("shortName", "N/A"),
        "Symbol": ticker,
        "Industry": info.get("industry", "N/A"),
        "Sector": info.get("sector", "N/A"),
        "Market Cap": info.get("marketCap", "N/A"),
        "Price": info.get("currentPrice", "N/A"),
        "Forward P/E": info.get("forwardPE", "N/A"),
        "Dividend Yield": info.get("dividendYield", "N/A"),
        "52 Week High": info.get("fiftyTwoWeekHigh", "N/A"),
        "52 Week Low": info.get("fiftyTwoWeekLow", "N/A"),
        "Business Summary": info.get("longBusinessSummary", "N/A"),
    }

    # Format as a text report
    report = f"# {summary['Name']} ({summary['Symbol']})\n\n"
    report += f"**Sector:** {summary['Sector']}\n"
    report += f"**Industry:** {summary['Industry']}\n"
    report += f"**Market Cap:** ${summary['Market Cap']:,}\n\n"
    report += f"**Current Price:** ${summary['Price']}\n"
    report += f"**Forward P/E:** {summary['Forward P/E']}\n"
    report += f"**Dividend Yield:** {summary['Dividend Yield']}\n"
    report += (
        f"**52 Week Range:** ${summary['52 Week Low']} - ${summary['52 Week High']}\n\n"
    )
    report += f"## Business Summary\n\n{summary['Business Summary']}\n"

    return report


@mcp.resource("yahoo://{ticker}/historical/{period}")
def get_ticker_historical_resource(ticker: str, period: str = "1mo") -> str:
    """Get historical price data as a resource."""
    stock = yf.Ticker(ticker)
    history = stock.history(period=period)

    if history.empty:
        return "No historical data available for this ticker."

    # Calculate some statistics
    start_price = history["Close"].iloc[0]
    end_price = history["Close"].iloc[-1]
    change = end_price - start_price
    pct_change = (change / start_price) * 100
    high = history["High"].max()
    low = history["Low"].min()

    # Format as a text report
    report = f"# Historical Data for {ticker} (Period: {period})\n\n"
    report += f"**Start Price:** ${start_price:.2f}\n"
    report += f"**End Price:** ${end_price:.2f}\n"
    report += f"**Change:** ${change:.2f} ({pct_change:.2f}%)\n"
    report += f"**Highest:** ${high:.2f}\n"
    report += f"**Lowest:** ${low:.2f}\n\n"

    # Add the most recent data points
    report += "## Recent Prices\n\n"
    report += "| Date | Open | High | Low | Close | Volume |\n"
    report += "|------|------|------|-----|-------|--------|\n"

    for date, row in history.tail(10).iterrows():
        date_str = date.strftime("%Y-%m-%d")
        report += f"| {date_str} | ${row['Open']:.2f} | ${row['High']:.2f} | ${row['Low']:.2f} | ${row['Close']:.2f} | {row['Volume']:,} |\n"

    return report


@mcp.prompt()
def analyze_stock(ticker: str) -> str:
    """Generate a prompt for analyzing a stock."""
    return f"""
Please analyze the stock {ticker} comprehensively, including:

1. Basic company information and business model
2. Recent financial performance and key metrics
3. Industry positioning and competitive landscape
4. Recent news and events affecting the stock
5. Technical analysis of price trends
6. Overall assessment of strengths, weaknesses, opportunities, and threats
7. Potential catalysts that could affect future performance

Based on this analysis, provide your outlook for the stock in the short term (3-6 months) and long term (1-3 years).
"""


@mcp.prompt()
def compare_investment(tickers: List[str]) -> str:
    """Generate a prompt for comparing multiple stocks as investment options."""
    tickers_str = ", ".join(tickers)
    return f"""
Please compare the following stocks as investment options: {tickers_str}

For each stock, analyze:
1. Business model and market position
2. Financial health and growth prospects
3. Valuation metrics and relative value
4. Risk factors

Then rank these stocks as investment opportunities based on:
- Short-term growth potential (next 12 months)
- Long-term growth potential (3-5 years)
- Risk-adjusted returns
- Income potential (dividends)

Conclude with a recommendation on which stock(s) would be the best investment based on different investor profiles (growth-focused, income-focused, risk-averse).
"""


@mcp.tool()
def save_historical_data(
    ticker: str,
    output_dir: str,
    period: str = "1mo",
    interval: str = "1d",
    filename_prefix: str = None,
) -> str:
    """
    Save historical price data to a CSV file.

    Args:
        ticker: The stock ticker symbol (e.g., AAPL)
        output_dir: Directory where to save the CSV file
        period: Data period (1d,5d,1mo,3mo,6mo,1y,2y,5y,10y,ytd,max)
        interval: Data interval (1m,2m,5m,15m,30m,60m,90m,1h,1d,5d,1wk,1mo,3mo)
        filename_prefix: Optional prefix for the filename

    Returns:
        Path to the saved CSV file
    """
    stock = yf.Ticker(ticker)
    history = stock.history(period=period, interval=interval)

    if history.empty:
        raise ValueError("No data available")

    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    prefix = f"{filename_prefix}_" if filename_prefix else ""
    filename = f"{prefix}{ticker}_historical_{timestamp}.csv"
    filepath = os.path.join(output_dir, filename)

    history.to_csv(filepath)
    return filepath


@mcp.tool()
def save_financials(
    ticker: str, output_dir: str, quarterly: bool = False, filename_prefix: str = None
) -> Dict[str, str]:
    """
    Save financial statements to CSV files.

    Args:
        ticker: The stock ticker symbol (e.g., AAPL)
        output_dir: Directory where to save the CSV files
        quarterly: If True, saves quarterly statements instead of annual
        filename_prefix: Optional prefix for the filenames

    Returns:
        Dictionary mapping statement type to file path
    """
    stock = yf.Ticker(ticker)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    prefix = f"{filename_prefix}_" if filename_prefix else ""
    period = "quarterly" if quarterly else "annual"

    os.makedirs(output_dir, exist_ok=True)
    paths = {}

    # Save Income Statement
    if quarterly:
        df = stock.quarterly_income_stmt
    else:
        df = stock.income_stmt
    if not df.empty:
        filename = f"{prefix}{ticker}_income_stmt_{period}_{timestamp}.csv"
        filepath = os.path.join(output_dir, filename)
        df.to_csv(filepath)
        paths["income_statement"] = filepath

    # Save Balance Sheet
    if quarterly:
        df = stock.quarterly_balance_sheet
    else:
        df = stock.balance_sheet
    if not df.empty:
        filename = f"{prefix}{ticker}_balance_sheet_{period}_{timestamp}.csv"
        filepath = os.path.join(output_dir, filename)
        df.to_csv(filepath)
        paths["balance_sheet"] = filepath

    # Save Cash Flow
    if quarterly:
        df = stock.quarterly_cash_flow
    else:
        df = stock.cash_flow
    if not df.empty:
        filename = f"{prefix}{ticker}_cash_flow_{period}_{timestamp}.csv"
        filepath = os.path.join(output_dir, filename)
        df.to_csv(filepath)
        paths["cash_flow"] = filepath

    return paths


@mcp.tool()
def save_options_chain(
    ticker: str, output_dir: str, filename_prefix: str = None
) -> Dict[str, str]:
    """
    Save options chain data to CSV files.

    Args:
        ticker: The stock ticker symbol (e.g., AAPL)
        output_dir: Directory where to save the CSV files
        filename_prefix: Optional prefix for the filenames

    Returns:
        Dictionary mapping option type to file path
    """
    stock = yf.Ticker(ticker)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    prefix = f"{filename_prefix}_" if filename_prefix else ""

    os.makedirs(output_dir, exist_ok=True)

    # Get available expiration dates
    expirations = stock.options
    if not expirations:
        raise ValueError("No options data available")

    # Use first expiration date
    exp_date = expirations[0]

    # Get options chain
    options = stock.option_chain(exp_date)
    paths = {}

    # Save calls
    filename = f"{prefix}{ticker}_options_calls_{exp_date}_{timestamp}.csv"
    filepath = os.path.join(output_dir, filename)
    options.calls.to_csv(filepath)
    paths["calls"] = filepath

    # Save puts
    filename = f"{prefix}{ticker}_options_puts_{exp_date}_{timestamp}.csv"
    filepath = os.path.join(output_dir, filename)
    options.puts.to_csv(filepath)
    paths["puts"] = filepath

    return paths


@mcp.tool()
def save_holders_data(
    ticker: str, output_dir: str, filename_prefix: str = None
) -> Dict[str, str]:
    """
    Save institutional and mutual fund holders data to CSV files.

    Args:
        ticker: The stock ticker symbol (e.g., AAPL)
        output_dir: Directory where to save the CSV files
        filename_prefix: Optional prefix for the filenames

    Returns:
        Dictionary mapping holder type to file path
    """
    stock = yf.Ticker(ticker)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    prefix = f"{filename_prefix}_" if filename_prefix else ""

    os.makedirs(output_dir, exist_ok=True)
    paths = {}

    # Save major holders
    if stock.major_holders is not None:
        filename = f"{prefix}{ticker}_major_holders_{timestamp}.csv"
        filepath = os.path.join(output_dir, filename)
        stock.major_holders.to_csv(filepath)
        paths["major_holders"] = filepath

    # Save institutional holders
    if stock.institutional_holders is not None:
        filename = f"{prefix}{ticker}_institutional_holders_{timestamp}.csv"
        filepath = os.path.join(output_dir, filename)
        stock.institutional_holders.to_csv(filepath)
        paths["institutional_holders"] = filepath

    # Save mutual fund holders
    if stock.mutualfund_holders is not None:
        filename = f"{prefix}{ticker}_mutualfund_holders_{timestamp}.csv"
        filepath = os.path.join(output_dir, filename)
        stock.mutualfund_holders.to_csv(filepath)
        paths["mutualfund_holders"] = filepath

    return paths


# Helper function to convert a DataFrame to a list of dictionaries
def _dataframe_to_dict(df) -> Union[List[Dict[str, Any]], Dict[str, Dict[str, Any]]]:
    """Convert a DataFrame to a serializable format."""
    if df is None or df.empty:
        return []

    if isinstance(df.index, pd.DatetimeIndex):
        # Convert DatetimeIndex to strings
        result = {}
        for column in df.columns:
            result[column] = {}
            for date, value in df[column].items():
                # Handle NaN values
                if pd.isna(value):
                    result[column][str(date.date())] = None
                # Handle different data types
                elif isinstance(value, (float, np.float64)):
                    result[column][str(date.date())] = float(value)
                elif isinstance(value, (int, np.int64)):
                    result[column][str(date.date())] = int(value)
                else:
                    result[column][str(date.date())] = str(value)
        return result
    else:
        # Convert to a list of dictionaries
        result = []
        for index, row in df.iterrows():
            row_dict = {}
            for column, value in row.items():
                # Handle NaN values
                if pd.isna(value):
                    row_dict[column] = None
                # Handle different data types
                elif isinstance(value, (float, np.float64)):
                    row_dict[column] = float(value)
                elif isinstance(value, (int, np.int64)):
                    row_dict[column] = int(value)
                else:
                    row_dict[column] = str(value)

            # Add the index as a column
            if isinstance(index, tuple):
                # Handle MultiIndex
                for i, idx_name in enumerate(df.index.names):
                    if idx_name:
                        row_dict[idx_name] = index[i]
                    else:
                        row_dict[f"index_{i}"] = index[i]
            else:
                if df.index.name:
                    row_dict[df.index.name] = index
                else:
                    row_dict["index"] = index

            result.append(row_dict)
        return result


if __name__ == "__main__":
    # Run the MCP server
    mcp.run()
