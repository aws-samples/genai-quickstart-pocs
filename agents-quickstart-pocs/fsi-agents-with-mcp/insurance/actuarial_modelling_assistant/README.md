# Actuarial Modeling Assistant

This agent performs comprehensive actuarial analysis on insurance datasets using advanced statistical modeling and data analysis techniques. It processes multiple insurance-related CSV files to generate insights, predictive models, and detailed reports for actuarial decision-making.

This agent uses:

- 🐍 **Python REPL**: For data analysis, statistical modeling, and visualization
- 📁 **Filesystem**: For file operations and data management

The agent works with the following sample datasets located in the `sample-actuarial-data` directory:

- **insurance_policies.csv**: Policy information
- **insurance_claims.csv**: Claims data
- **insurance_risk_factors.csv**: Risk factors
- **insurance_payments.csv**: Payment history
- **insurance_reserve_adjustments.csv**: Reserve adjustments

## Features

- Performs exploratory data analysis on insurance datasets
- Analyzes claim frequency and severity across products and regions
- Builds predictive models for claim probability
- Calculates loss ratios and identifies profitable segments
- Analyzes claim reserves adequacy and adjustment patterns
- Examines payment patterns and default risks
- Generates comprehensive reports with visualizations
- Creates data-driven recommendations

## Prerequisites

Before running this agent, you must have completed the [setup to use the inline agent](../../mcp_servers) as well as the setup for following MCP servers:

- [python-repl](../../mcp_servers/python-repl)
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

2. Run the example.

   ```bash
   python main.py
   ```

The agent is pre-configured to perform a comprehensive actuarial analysis including data exploration, claim analysis, loss ratio calculations, reserve adequacy assessment, and predictive modeling on sample dataset. You can change the query by modifying `input_text` variable in `main.py` to focus on specific aspects of the analysis or different metrics.

All output will be saved to the `output/{session_uuid}/` directory.

## Customization

You can modify the agent's behavior by editing:

- `main.py`: To change the agent's instructions, the foundation model used, or the default query
- `config.py`: To adjust configuration settings for the MCPs
