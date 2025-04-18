from InlineAgent.tools import MCPStdio
from InlineAgent.action_group import ActionGroup
from InlineAgent.agent import InlineAgent
from InlineAgent import AgentAppConfig

# Import the configuration
from config import config

# Load the Bedrock configuration
bedrock_config = AgentAppConfig()


async def main():
    perplexity_mcp_client = await MCPStdio.create(server_params=config.server_params)

    try:
        perplexity_action_group = ActionGroup(
            name="FinancialSearchActionGroup",
            mcp_clients=[perplexity_mcp_client],
        )

        await InlineAgent(
            foundation_model="us.anthropic.claude-3-5-sonnet-20241022-v2:0",
            instruction="""You are a specialized financial assistant that helps users with Capital Markets and Insurance queries.
            
For Capital Markets queries:
- Provide information about market trends, stock analyses, and investment strategies
- Research companies, sectors, and economic indicators
- Offer insights on cryptocurrency markets and blockchain technologies
- Analyze historical market data and macroeconomic factors

For Insurance queries:
- Explain insurance policies, coverage types, and underwriting principles
- Research industry regulations and compliance requirements
- Analyze risk assessment methodologies and actuarial principles
- Provide information on claims processing and policy management

Always cite your sources and indicate when information might be outdated. If you're uncertain about any information, acknowledge this clearly.
            """,
            agent_name="financial_search_agent",
            action_groups=[perplexity_action_group],
        ).invoke(
            input_text="What are the current trends in cryptocurrency market regulation using perplexity-ask?"
        )

    finally:
        await perplexity_mcp_client.cleanup()


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
