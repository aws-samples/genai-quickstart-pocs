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

# Import the configuration (will be created later)
from config import config

# Load the Bedrock configuration
bedrock_config = AgentAppConfig()

# Generate a UUID for this session to ensure consistent file paths
session_uuid = str(uuid.uuid4())
print(f"Using session UUID: {session_uuid}")

# Global clients for cleanup in signal handlers
python_repl_client = None


# Signal handler for graceful shutdown
def signal_handler(sig, frame):
    print("\nExiting gracefully...")
    # We'll exit directly as cleanup happens in the main function
    sys.exit(0)


async def main():
    global python_repl_client

    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Get today's date for reference
    today = datetime.datetime.now()
    today_str = today.strftime("%Y-%m-%d")

    # Get the project root directory (two levels up from script)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(current_dir))

    # Create output directory if it doesn't exist - using absolute path based on project root
    output_dir = os.path.join(project_root, "output", session_uuid)
    os.makedirs(output_dir, exist_ok=True)
    print(f"Created output directory: {output_dir}")

    # Create MCP clients
    python_repl_client = await MCPStdio.create(server_params=config.python_repl_params)

    try:
        # Create action group for the Python REPL tool
        python_repl_action_group = ActionGroup(
            name="PythonReplActionGroup",
            mcp_clients=[python_repl_client],
        )

        # Define the path for the sample actuarial data - using a dynamic path
        data_path = os.path.join(current_dir, "sample-actuarial-data")

        print(f"Using data path: {data_path}")
        print(f"Project root: {project_root}")
        print(f"Output directory: {output_dir}")

        # Create and invoke the agent with the Python REPL action group
        await InlineAgent(
            foundation_model="us.anthropic.claude-3-5-sonnet-20241022-v2:0",
            instruction=f"""You are an expert insurance actuary assistant that specializes in data analysis, statistical modeling, and actuarial science. You will analyze insurance data using Python to develop insights, identify trends, and create actuarial models.

You have access to a Python REPL (Read-Eval-Print Loop) environment that lets you execute Python code for data analysis and modeling.

The insurance datasets are located at this path:
"{data_path}"

The CSV files available are:
- insurance_policies.csv
- insurance_claims.csv
- insurance_risk_factors.csv
- insurance_payments.csv
- insurance_reserve_adjustments.csv

Use pandas to read the files, for example:
```python
import pandas as pd
import os

# Define the base data directory
data_dir = "{data_path}"

# Read the policy data
policies_df = pd.read_csv(os.path.join(data_dir, "insurance_policies.csv"))

# View the first few rows
print(policies_df.head())
```
There's also a DATADEFINITION.md file in the same directory that contains detailed information about the data structure.

PACKAGE INSTALLATION INSTRUCTIONS:
For required Python packages, install them using these commands:
```python
# Install pandas for data manipulation
import subprocess  # nosec B404 - subprocess needed for system commands
subprocess.run(['pip', 'install', 'pandas'])

# Install matplotlib for visualizations
subprocess.run(['pip', 'install', 'matplotlib'])

# Install scikit-learn for machine learning and modeling
subprocess.run(['pip', 'install', '-U', 'scikit-learn'])

# Install numpy for numerical computing
subprocess.run(['pip', 'install', 'numpy'])
```

VISUALIZATION REQUIREMENTS:
For all visualizations, use matplotlib directly and NOT seaborn. The environment has compatibility issues with seaborn, so stick strictly to matplotlib for all plotting needs. For example:

```python
# DO use matplotlib
import matplotlib.pyplot as plt
plt.figure(figsize=(10, 6))
plt.bar(data['category'], data['value'])
plt.title('Analysis by Category')

# Important: Use absolute path to save files to ensure they go to the correct location
plt.savefig('{output_dir}/category_analysis.png')

# DON'T use seaborn
# import seaborn as sns  # Don't use this
```

Your task is to perform advanced actuarial modeling and analysis on this data. You should:

1. Start by exploring and understanding the data
2. Perform data cleaning and preprocessing as necessary
3. Conduct thorough exploratory data analysis with visualizations
4. Develop predictive models for claim frequency, claim severity, or risk assessment
5. Calculate key actuarial metrics such as loss ratios, reserves adequacy, and risk profiles
6. Generate visualizations that effectively communicate your findings
7. Create a comprehensive report summarizing your analysis and insights

IMPORTANT: When creating plots, visualizations or reports, save the outputs to this absolute path:
{output_dir}/

# Example for saving files:
```python
# Save a plot to the output directory
plt.savefig('{output_dir}/analysis_plot.png')

# Save a DataFrame to CSV in the output directory
df.to_csv('{output_dir}/analysis_results.csv', index=False)

# Write a report to the output directory
with open('{output_dir}/report.md', 'w') as f:
    f.write("# Actuarial Analysis Report\\n\\n...")
```

Today's date: {today_str}
Session UUID: {session_uuid}
""",
            agent_name="actuarial_modeling_assistant",
            action_groups=[python_repl_action_group],
        ).invoke(
            input_text=f"""Please perform a comprehensive actuarial analysis on the insurance data. Include the following components:

1. Load and explore all datasets to understand their structure and relationships
2. Perform exploratory data analysis with appropriate visualizations
3. Analyze claim frequency and severity across different product types and regions
4. Build a predictive model for claim probability based on risk factors
5. Calculate loss ratios by product type and identify profitable/unprofitable segments
6. Analyze the adequacy of claim reserves and identify any patterns in reserve adjustments
7. Examine payment patterns and identify potential default risks
8. Create a comprehensive report with your findings and recommendations, generate visualizations for each section

Please save all visualizations and the final report to this absolute output directory: 
{output_dir}

IMPORTANT: 
- Use pandas to read the CSV files directly using the provided data path
- Do NOT use seaborn for visualizations. Use matplotlib directly for all plots and charts.
- For scikit-learn, use the command: pip install -U scikit-learn
- Make sure to use absolute paths when saving files to ensure they go to the correct output directory
- These are nonpersistent REPL sessions, so save all your files and dataframes to the output directory
""",
            session_id=session_uuid,
        )

    finally:
        # Skip cleanup entirely to avoid asyncio issues
        print("Execution completed. Output files saved to:")
        print(f"{output_dir}")

        # Exit immediately to avoid asyncio cancellation errors
        os._exit(0)  # Using os._exit instead of sys.exit to avoid cleanup issues


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nExecution interrupted by user.")
        os._exit(0)  # Force immediate exit
    except Exception as e:
        print(f"Error during execution: {e}")
        os._exit(1)  # Force immediate exit with error code
