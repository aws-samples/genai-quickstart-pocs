# Stock Data Processing Agent

This agent analyzes stock market data, performs technical analysis, and generates trading signals. It combines financial data analysis with news sentiment to provide comprehensive market insights and visualizations.

This agent uses:

- 📊 **Financial Datasets**: For stock market data
- 📁 **Filesystem**: For storing results and trading signals
- 👨‍💻 **Code Interpreter**: For technical analysis and strategy backtesting

## Features

- Retrieves and analyzes recent stock price movements
- Gathers and analyzes market news and sentiment
- Calculates technical indicators (Moving Averages, Volatility)
- Creates visualization dashboards
- Generates forecasts and trading signals
- Produces comprehensive analysis reports

## Prerequisites

Before running this agent, you must have completed the [setup to use the inline agent](../../mcp_servers) as well as the setup for following MCP servers:

- [financial-datasets](../../mcp_servers/financial-datasets)
- [filesystem](../../mcp_servers/filesystem)

## Usage

1. Activate virtual environment from project's root directory.

   ```bash
   # On macOS and Linux.
   source .venv/bin/activate
   ```

   ```bash
   # On Windows.
   .venv\Scripts\activate
   ```

2. Create a `.env` file in this directory.

   - Refer to the `.env.example` for a reference on what variables need to be set.

3. Run the example.

   ```bash
   python main.py
   ```

The agent is pre-configured to analyze AAPL stock's 30-day performance, including news sentiment analysis, moving average and volatility visualizations, and weekly forecasts. You can change the query by modifying `input_text` variable in `main.py` to analyze different stocks, timeframes, or technical indicators.

All output will be saved to the `output/{session_uuid}/` directory.

## Customization

You can modify the agent's behavior by editing:

- `main.py`: To change the agent's instructions, the foundation model used, or the default query
- `config.py`: To adjust configuration settings for the MCPs
