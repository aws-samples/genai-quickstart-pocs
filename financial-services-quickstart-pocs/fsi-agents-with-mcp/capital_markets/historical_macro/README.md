# Historical Macro Comparison Agent

This agent analyzes current macroeconomic conditions and identifies historical time periods with similar characteristics. It uses FRED API data and Perplexity Search to gather information and perform comparative analysis.

This agent uses:

- 📈 **FRED API**: For economic data retrieval
- 🔎 **Perplexity Search**: For historical context and market research

## Features

- Retrieves and analyzes macroeconomic data
- Gathers context and additional information from Internet
- Provides narrative analysis of similarities between current and historical economic conditions

## Prerequisites

Before running this agent, you must have completed the [setup to use the inline agent](../../mcp_servers) as well as the setup for following MCP servers:

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

The agent is pre-configured to identify and analyze historical periods with macroeconomic conditions similar to the present, providing comparative analysis of key indicators and market environments. You can change the query by modifying `input_text` variable in `main.py` to analyze different economic indicators or time periods.

All output will be saved to the `output/{session_uuid}/` directory.

## Customization

You can modify the agent's behavior by editing:

- `main.py`: To change the agent's instructions, the foundation model used, or the default query
- `config.py`: To adjust configuration settings for the MCPs
