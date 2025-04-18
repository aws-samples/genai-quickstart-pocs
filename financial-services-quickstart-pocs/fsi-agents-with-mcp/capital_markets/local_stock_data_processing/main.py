import os
import uuid
import datetime
import asyncio
import signal
import sys

from InlineAgent.tools import MCPStdio
from InlineAgent.action_group import ActionGroup
from InlineAgent.agent import InlineAgent
from InlineAgent import AgentAppConfig

# Import the configuration
from config import config

# Load the Bedrock configuration
bedrock_config = AgentAppConfig()

# Generate a UUID for this session to ensure consistent file paths
session_uuid = str(uuid.uuid4())
print(f"Using session UUID: {session_uuid}")

# Global clients for cleanup in signal handlers
yahoo_finance_client = None
python_repl_client = None

# Get workspace root directory (2 levels up from current file)
WORKSPACE_ROOT = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
OUTPUT_BASE = os.path.join(WORKSPACE_ROOT, "output")


# Signal handler for graceful shutdown
def signal_handler(sig, frame):
    print("\nExiting gracefully...")
    sys.exit(0)


async def main():
    global yahoo_finance_client, python_repl_client

    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Get today's date for reference
    today = datetime.datetime.now()
    today_str = today.strftime("%Y-%m-%d")

    # Create MCP clients
    yahoo_finance_client = await MCPStdio.create(
        server_params=config.yahoo_finance_params
    )
    python_repl_client = await MCPStdio.create(server_params=config.python_repl_params)

    # Create output directory structure
    session_dir = os.path.join(OUTPUT_BASE, session_uuid)
    data_dir = os.path.join(session_dir, "data")
    processed_dir = os.path.join(session_dir, "processed")
    plots_dir = os.path.join(session_dir, "plots")
    reports_dir = os.path.join(session_dir, "reports")

    # Create all directories
    for directory in [data_dir, processed_dir, plots_dir, reports_dir]:
        os.makedirs(directory, exist_ok=True)
    print(f"Created output directories in: {session_dir}")

    try:
        # Create action groups
        yahoo_finance_action_group = ActionGroup(
            name="YahooFinanceActionGroup",
            mcp_clients=[yahoo_finance_client],
        )

        python_repl_action_group = ActionGroup(
            name="PythonReplActionGroup",
            mcp_clients=[python_repl_client],
        )

        # Start the agent with both action groups
        await InlineAgent(
            foundation_model="us.anthropic.claude-3-5-sonnet-20241022-v2:0",
            instruction=f"""You are a financial data analyst assistant that can help with retrieving and analyzing stock market data.

Today's date is: {today_str}
Session UUID: {session_uuid}

Output Directories:
- Data: {data_dir}
- Processed: {processed_dir}
- Plots: {plots_dir}
- Reports: {reports_dir}

You have access to the following tools:

Yahoo Finance Tools:
1. save_historical_data(ticker, output_dir, period="1mo", interval="1d", filename_prefix=None)
   - Save historical price data to CSV
   - Returns path to saved file

2. save_financials(ticker, output_dir, quarterly=False, filename_prefix=None)
   - Save income statement, balance sheet, and cash flow statements
   - Returns paths to saved files

3. save_options_chain(ticker, output_dir, filename_prefix=None)
   - Save options chain data (calls and puts) for nearest expiration
   - Returns paths to saved files

4. save_holders_data(ticker, output_dir, filename_prefix=None)
   - Save institutional and mutual fund holders data
   - Returns paths to saved files

Python REPL Environment:
The Python REPL has access to:
- pandas for data manipulation
- numpy for numerical computations
- matplotlib for visualization
- datetime for date handling
- scikit-learn for machine learning
- statsmodels for time series analysis

When using the Python REPL:
- Use the provided directory paths for all file operations
- Load CSV files using pandas
- Save processed results to the processed directory
- Save plots to the plots directory
- Save reports to the reports directory
- Save trained models to the processed directory

Workflow:
1. Save Data:
   - Use Yahoo Finance save tools to store data in the data directory
   - Get 5 years of historical data for better model training
   - Files will include timestamps in names
   - CSV format for easy loading

2. Process Data:
   - Load CSVs into pandas DataFrames
   - Calculate key metrics:
     * Returns (daily, cumulative)
     * Moving averages (20-day, 50-day)
     * Volatility measures (rolling std, ATR)
     * Volume analysis
     * Technical indicators (RSI, MACD, Bollinger Bands)
   - Feature engineering:
     * Price momentum indicators
     * Volatility indicators
     * Volume indicators
     * Trend indicators
   - Save processed data to the processed directory

3. Model Building:
   - Prepare features and target:
     * Target: Next day's closing price
     * Features: Technical indicators, price/volume metrics
   - Split data:
     * Training: All data except last 30 days
     * Testing: Last 30 days
   - Train multiple models:
     * Linear models (Ridge, Lasso)
     * Tree-based models (Random Forest, XGBoost if available)
     * Time series models (ARIMA, SARIMA)
   - Validate models:
     * Cross-validation on training data
     * Performance metrics (RMSE, MAE, R²)
     * Feature importance analysis
   - Save trained models and validation results

4. Generate Visualizations:
   - Price Analysis:
     * Price trends with moving averages
     * Volume analysis
     * Returns distribution
   - Technical Analysis:
     * All technical indicators
     * Feature importance plots
   - Model Performance:
     * Predicted vs actual prices
     * Error distribution
     * Feature importance
   - Save all plots to the plots directory

5. Create Reports:
   - Generate comprehensive markdown report including:
     * Data summary and preprocessing steps
     * Feature engineering details
     * Model selection and parameters
     * Training process and validation results
     * Test set performance
     * Key findings and recommendations
     * Future price predictions
     * Risk factors and limitations
   - Save to the reports directory

Remember to:
- Use the provided directory paths
- Include timestamps in filenames
- Save intermediate results
- Document analysis steps
- Handle errors gracefully
- Save model artifacts for future use
""",
            agent_name="stock_data_analyst",
            action_groups=[yahoo_finance_action_group, python_repl_action_group],
        ).invoke(
            input_text="""Please analyze NVDA stock with the following steps:
1. Save 5 years of historical daily data for model training
2. Save quarterly financials and institutional holders for additional context
3. Process and analyze the historical data:
   - Calculate all technical indicators and features
   - Prepare data for modeling (train/test split with last 30 days as test)
4. Build and evaluate prediction models:
   - Train multiple models (linear, tree-based, time series)
   - Validate on training data
   - Test on last 30 days
   - Compare model performance
5. Create visualizations:
   - Technical analysis plots
   - Model performance plots
   - Prediction vs actual comparison
6. Generate a comprehensive report including:
   - Data analysis
   - Model performance
   - Predictions for next few days from the best model
   - Confidence intervals
Save all outputs to the session directory.""",
            session_id=session_uuid,
        )

    finally:
        print("\nExecution completed. Output files saved to:")
        print(f"Session directory: {session_dir}")
        print(f"- Data: {data_dir}")
        print(f"- Processed: {processed_dir}")
        print(f"- Plots: {plots_dir}")
        print(f"- Reports: {reports_dir}")
        os._exit(0)  # Force immediate exit to avoid cleanup issues


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nExecution interrupted by user.")
        os._exit(0)
    except Exception as e:
        print(f"Error during execution: {e}")
        os._exit(1)
