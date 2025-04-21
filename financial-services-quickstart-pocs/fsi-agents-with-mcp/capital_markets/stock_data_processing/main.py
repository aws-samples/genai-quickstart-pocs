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
filesystem_client = None
financial_datasets_client = None


# Signal handler for graceful shutdown
def signal_handler(sig, frame):
    print("\nExiting gracefully...")
    # We'll exit directly as cleanup happens in the main function
    sys.exit(0)


async def main():
    global filesystem_client, financial_datasets_client

    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Get today's date for reference
    today = datetime.datetime.now()
    today_str = today.strftime("%Y-%m-%d")

    # Create MCP clients for different services
    filesystem_client = await MCPStdio.create(server_params=config.filesystem_params)
    financial_datasets_client = await MCPStdio.create(
        server_params=config.financial_datasets_params
    )

    # Ensure output directory exists
    output_dir = os.path.join(os.getcwd(), "output", session_uuid)
    os.makedirs(output_dir, exist_ok=True)
    print(f"Created output directory: {output_dir}")

    try:
        # Create action groups for the different tools
        filesystem_action_group = ActionGroup(
            name="FileSystemActionGroup",
            mcp_clients=[filesystem_client],
        )

        financial_datasets_action_group = ActionGroup(
            name="FinancialDatasetsActionGroup",
            mcp_clients=[financial_datasets_client],
        )

        code_interpreter_action_group = ActionGroup(
            name="CodeInterpreter",
            builtin_tools={"parentActionGroupSignature": "AMAZON.CodeInterpreter"},
        )

        # Create and invoke the agent with all action groups
        await InlineAgent(
            foundation_model="us.anthropic.claude-3-5-sonnet-20241022-v2:0",
            instruction=f"""You are an expert financial analyst with comprehensive knowledge of financial markets, stock analysis, and investment strategies. Your role is to provide detailed analysis and insights on stocks and financial markets using a combination of data retrieval, visualization, and expert interpretation.

Use the financial datasets to get the latest news and stock data for a given stock. Then use the code interpreter to analyze the data and provide a detailed analysis of the stock. 
After you've done your analysis create a Report and save it as a markdown file call analysis.md using the filesystem action group save it to the output directory in the session uuid folder. The older you want to save it to should look like output/uuid/where-you-want-to-save-analysis.md

Guidelines for Code Interpreter:
- Code interpreter cannot use external data sources or seaborn.
- So when you get data from the financial datasets, you need to manually create the dataframe and do the analysis.(i.e create the dataframe from the data returned from the financial datasets)
- Code interpreter does its path differently than the filesystem action group. For code interpreter use $BASE_PATH$/your_file_name.png. Just know that the $BASE_PATH$ is the output directory in the session uuid folder.
ex. prices = [100, 200, 300] <- You need to manually create the dataframe from the data returned from the financial datasets
    dates = ['2021-01-01', '2021-01-02', '2021-01-03'] <- You need to manually create the dataframe from the data returned from the financial datasets

The following is something you should not do:

<do_not_do>
# Create lists for our data                                                                                                                                                                                                 
 dates = []                                                                                                                                                                                                                  
 closes = []                                                                                                                                                                                                                 
 volumes = []                                                                                                                                                                                                                
                                                                                                                                                                                                                             
 # Process the stock data                                                                                                                                                                                                    
 for item in _last_result:                                                                                                                                                                                                   
     dates.append(datetime.strptime(item['time'].split('T')[0], '%Y-%m-%d'))                                                                                                                                                 
     closes.append(item['close'])                                                                                                                                                                                            
     volumes.append(item['volume'])                                                                                                                                                                                          
                                                                                                                                                                                                                             
 # Create DataFrame                                                                                                                                                                                                          
 df = pd.DataFrame()                                                                                                                                                                                                         
 </do_not_do>

    Before you write the code, you need to think about how to create the dataframe from the data returned from the financial datasets.

It will fail if you try to use seaborn or if you don't manually create the dataframe from the data returned from the financial datasets.
Today's date: {today_str}
Session UUID: {session_uuid}
""",
            agent_name="financial_analyst",
            action_groups=[
                filesystem_action_group,
                financial_datasets_action_group,
                code_interpreter_action_group,
            ],
        ).invoke(
            input_text="How has AAPL stock changed in the past 30 days what are they saying the news about it, and how does it forecast for the next week? Can you help build me visuals for Moving average and volatility? Build me a report on it.",
            session_id=session_uuid,  # Explicitly passing our UUID as the session_id
        )

    finally:
        # Skip cleanup entirely to avoid asyncio issues - let Python's process exit handle it
        # The clients will be closed when the process exits
        print("Execution completed. Output files saved to:")
        print(f"/projects/output/{session_uuid}/")
        print(f"Local path: {output_dir}")

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
