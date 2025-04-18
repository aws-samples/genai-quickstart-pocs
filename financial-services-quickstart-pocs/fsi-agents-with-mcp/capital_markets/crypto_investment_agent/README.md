# Crypto Investment Analysis Agent

This agent analyzes cryptocurrency investment opportunities, assesses risks, and builds investment models. It combines cryptocurrency market data, macroeconomic indicators, market research, and quantitative modeling to provide comprehensive investment analysis.

This agent uses:

- **📊 Financial Datasets**: For cryptocurrency price data
- **📈 FRED API**: For macroeconomic indicators
- **🔎 Perplexity Search**: For market news and sentiment
- **👨‍💻 Code Interpreter**: For investment modeling, risk analysis, and data visualization

## Features

- Retrieves historical and current cryptocurrency price data
- Analyzes macroeconomic indicators that might impact crypto markets
- Gathers news and analyst opinions about cryptocurrencies
- Creates investment models and simulates risk scenarios
- Visualizes price trends and investment performance metrics
- Calculates key risk metrics like volatility, drawdown, and risk-adjusted returns

## Prerequisites

Before running this agent, you must have completed the [setup to use the inline agent](../../mcp_servers) as well as the setup for following MCP servers:

- [financial-datasets](../../mcp_servers/financial-datasets)
- [fredapi](../../mcp_servers/fredapi)
- [perplexity-search](../../mcp_servers/perplexity-search)

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

The agent is pre-configured to analyze a $100,000 investment in Bitcoin (BTC) and Ethereum (ETH) with a 2-year time horizon. You can change the query by modifying `input_text` variable in `main.py` to analyze different cryptocurrencies or investment scenarios.

All output will be saved to the `output/{session_uuid}/` directory.

## Customization

You can modify the agent's behavior by editing:

- `main.py`: To change the agent's instructions, the foundation model used, or the default query
- `config.py`: To adjust configuration settings for the MCPs
