import datetime

from InlineAgent.tools import MCPStdio
from InlineAgent.action_group import ActionGroup
from InlineAgent.agent import InlineAgent
from InlineAgent import AgentAppConfig

# Import the configuration
from config import config

# Load the Bedrock configuration
bedrock_config = AgentAppConfig()

# Get current date
current_date = datetime.datetime.now().strftime("%Y-%m-%d")


async def main():
    # Create and start the MCP client using parameters from config
    bedrock_kb_client = await MCPStdio.create(server_params=config.get_server_params())

    try:
        # Create the action group with the Bedrock KB search tools
        bedrock_kb_action_group = ActionGroup(
            name="BedrockKnowledgeBaseActionGroup",
            mcp_clients=[bedrock_kb_client],
        )

        # Start the agent with the Bedrock KB action group
        await InlineAgent(
            foundation_model="us.anthropic.claude-3-5-sonnet-20241022-v2:0",
            instruction=f"""You are a knowledge base query assistant that can search Amazon Bedrock Knowledge Bases to retrieve information for users.

Today's date is: {current_date}

You have access to the following knowledge base tools:

1. QueryKnowledgeBases(query, knowledge_base_id, reranking=True, reranking_model_name="AMAZON", data_source_ids=None)
   - query: A natural language query to search the knowledge base
   - knowledge_base_id: The ID of the knowledge base to query
   - reranking: Whether to rerank results for better relevance (default: True)
   - reranking_model_name: The reranking model to use (default: "AMAZON")
   - data_source_ids: Optional list of data source IDs to filter by

When searching knowledge bases:
- Use clear, specific queries for best results
- Make multiple focused queries instead of one complex query
- Extract and combine information from multiple results
- Consider source reliability and relevance scores
- Try different queries if results aren't relevant

You have access to the following Knowledge Bases with ID: {config.kb_id}.
""",
            agent_name="knowledge_base_assistant",
            action_groups=[bedrock_kb_action_group],
        ).invoke(input_text="Can you tell how Insurance Company is doing rating?")

    finally:
        # Clean up the MCP client
        await bedrock_kb_client.cleanup()


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
