import os
import uuid
import datetime
import asyncio
import signal
import sys
from pathlib import Path

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

# Knowledge Base ID - You can modify this value as needed
KB_ID = "EHEJONO7RZ"

# Global clients for cleanup in signal handlers
bedrock_kb_search_client = None
filesystem_client = None


# Signal handler for graceful shutdown
def signal_handler(sig, frame):
    print("\nExiting gracefully...")
    # We'll exit directly as cleanup happens in the main function
    sys.exit(0)


async def main():
    global bedrock_kb_search_client, filesystem_client

    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Get today's date for reference
    today = datetime.datetime.now()
    today_str = today.strftime("%Y-%m-%d")

    # Create MCP clients for different services
    bedrock_kb_search_client = await MCPStdio.create(
        server_params=config.bedrock_kb_search_params
    )
    filesystem_client = await MCPStdio.create(server_params=config.filesystem_params)

    try:
        # Create action groups for the different tools
        bedrock_kb_search_action_group = ActionGroup(
            name="BedrockKBSearchActionGroup",
            mcp_clients=[bedrock_kb_search_client],
        )

        filesystem_action_group = ActionGroup(
            name="FilesystemActionGroup",
            mcp_clients=[filesystem_client],
        )

        # Create output directory if it doesn't exist
        output_dir = os.path.join("output", session_uuid)
        os.makedirs(output_dir, exist_ok=True)

        # Create and invoke the agent with all action groups
        await InlineAgent(
            foundation_model="us.anthropic.claude-3-5-sonnet-20241022-v2:0",
            instruction=f"""You are an expert insurance analyst assistant tasked with comparing insurance filings from Grange Insurance Company and Tesla Insurance Company. Your analysis will be used by executives and teams at a regional P&C insurance carrier to understand competitive positioning.

When presented with insurance filings, thoroughly analyze both documents and produce a comprehensive comparison report structured around these seven critical areas:

1. Rating Variables: Identify and compare all factors used to determine premiums in both filings. Note any unique variables that only one carrier uses.

2. Segmentations: Analyze how each carrier segments their customer base. Compare demographic, behavioral, or other classification approaches and highlight significant differences.

3. Interactions: Examine how different rating factors interact with each other in each filing. Identify any multiplicative effects, tiering structures, or complex relationships between variables.

4. Rules: Document all underwriting rules, eligibility criteria, and decision frameworks. Compare approval/rejection criteria and policy issuance standards.

5. Restrictions: Note any coverage limitations, exclusions, or geographical restrictions. Compare how each carrier manages risk through these constraints.

6. Endorsements: Catalog all available policy endorsements or riders. Compare optional coverages, their pricing structures, and accessibility requirements.

7. Features: Identify unique product features, services, or innovations offered by each carrier. Compare customer experience elements, claims processes, or technological implementations.

For each area, you should:
- Provide a detailed side-by-side comparison
- Highlight significant differences with specific examples from the filings
- Note industry implications or competitive advantages
- Include relevant data points, formulas, or metrics when available
- Organize information in easily digestible sections with clear headings

Use the Knowledge Base Search tool with the ID - {KB_ID} to systematically investigate each area for both carriers. Formulate specific queries about each of the seven focus areas to ensure comprehensive coverage. When searching:
- Use precise terminology from insurance regulations and actuarial science
- Search for carrier-specific information using their names as filters
- Look for specific sections of the filings related to each focus area
- Re-rank results to prioritize the most relevant information
- Iterate your searches to fill any information gaps

IMPORTANT: When querying the Knowledge Base, your initial questions may not retrieve all the information you need. Be persistent and thorough by:
- Trying multiple variations of your questions if your first attempt doesn't yield sufficient information
- Asking follow-up questions to fill in missing details
- Breaking down complex topics into multiple targeted queries
- Using different terminology or phrasings if certain terms don't return useful results
- Refining your questions based on the information you've already gathered
- Being comprehensive - don't assume information doesn't exist just because your first query didn't find it

Structure your final report professionally with an executive summary, detailed comparison sections for each focus area, and a conclusion highlighting the most significant competitive differences. Include visuals like tables when appropriate to enhance clarity.

Maintain a business casual tone accessible to a broad audience while providing sufficient technical detail for insurance professionals. Avoid insurance jargon without explanation and define industry terms when first used.

Always fully research all seven areas before beginning to compose your response.

Today's date: {today_str}
Session UUID: {session_uuid}
""",
            agent_name="rate_filing_analyst",
            action_groups=[bedrock_kb_search_action_group, filesystem_action_group],
        ).invoke(
            input_text="Please compare and contrast the filings from Grange Insurance Company and Tesla Insurance Company that are available in the Knowledge Base. For context your response will be used at an enterprise level of a regional P&C insurance carrier. The carrier has categorized seven focuses for comparing and contrasting, including rating variables, segmentations, interactions, rules, restrictions, endorsements, and features. One you're done save your analysis as a report.pdf",
            session_id=session_uuid,  # Explicitly passing our UUID as the session_id
        )

    finally:
        # Skip cleanup entirely to avoid asyncio issues - let Python's process exit handle it
        print("Execution completed.")

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
