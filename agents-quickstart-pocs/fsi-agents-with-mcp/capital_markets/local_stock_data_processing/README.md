# Local Stock Data Processing Agent

This agent performs comprehensive stock analysis by processing historical data, building predictive models, and generating detailed reports. It combines financial data analysis, machine learning, and visualization to provide actionable insights.

This agent uses:

- 📈 **Yahoo Finance**: For retrieving comprehensive financial data
- 🐍 **Python REPL**: For data analysis, modeling, and visualization

## Features

- Downloads and processes historical stock data
- Retrieves company financials and institutional holdings
- Calculates technical indicators and features
- Builds and evaluates multiple prediction models
- Creates visualization dashboards
- Generates comprehensive analysis reports

## Prerequisites

Before running this agent, you must have completed the [setup to use the inline agent](../../mcp_servers) as well as the setup for following MCP servers:

- [yahoo-finance](../../mcp_servers/yahoo-finance)
- [python-repl](../../mcp_servers/python-repl)

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

2. Run the example.

   ```bash
   python main.py
   ```

The agent is pre-configured to analyze NVDA stock using 5 years of historical data, building multiple prediction models (linear, tree-based, time series), and generating comprehensive reports with technical analysis and future predictions. You can change the query by modifying `input_text` variable in `main.py` to analyze different stocks or investment scenarios.

All output will be saved to the `output/{session_uuid}/` directory.

## Customization

You can modify the agent's behavior by editing:

- `main.py`: To change the agent's instructions, the foundation model used, or the default query
- `config.py`: To adjust configuration settings for the MCPs
