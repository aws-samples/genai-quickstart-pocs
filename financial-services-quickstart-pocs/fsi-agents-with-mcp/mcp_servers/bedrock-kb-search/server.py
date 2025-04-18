# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
# with the License. A copy of the License is located at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
# OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
# and limitations under the License.
"""awslabs Bedrock Knowledge Base Retrieval MCP Server."""

import argparse
import json
import os
import sys
from knowledgebases.clients import (
    get_bedrock_agent_client,
    get_bedrock_agent_runtime_client,
)
from knowledgebases.runtime import (
    query_knowledge_base,
)
from loguru import logger
from mcp.server.fastmcp import FastMCP
from pydantic import Field
from typing import List, Literal, Optional


logger.remove(0)
logger.add(sys.stderr, level="INFO")


global kb_runtime_client
global kb_agent_mgmt_client

try:
    kb_runtime_client = get_bedrock_agent_runtime_client(
        region_name=os.getenv("AWS_REGION"),
        profile_name=os.getenv("AWS_PROFILE"),
    )
    kb_agent_mgmt_client = get_bedrock_agent_client(
        region_name=os.getenv("AWS_REGION"),
        profile_name=os.getenv("AWS_PROFILE"),
    )
except Exception as e:
    logger.error(f"Error getting bedrock agent client: {e}")
    raise e


mcp = FastMCP(
    "awslabs.bedrock-kb-retrieval-mcp-server",
    instructions="""
    The AWS Labs Bedrock Knowledge Bases Retrieval MCP Server provides access to Amazon Bedrock Knowledge Bases for retrieving relevant information through natural language queries.

    ## Usage Workflow:
    1. Use the QueryKnowledgeBases tool to search specific knowledge bases with your natural language queries
    2. You can make multiple calls to QueryKnowledgeBases with different queries or targeting different knowledge bases

    ## Important Notes:
    - Knowledge bases contain structured data from various data sources (documents, websites, databases)
    - Each knowledge base has a unique ID that must be used when querying
    - You can filter by specific data sources within a knowledge base using data_source_ids
    - Always verify that the knowledge base ID exists in the resource response before querying
    """,
    dependencies=["boto3"],
)


@mcp.tool(name="QueryKnowledgeBases")
async def query_knowledge_bases_tool(
    query: str = Field(
        ..., description="A natural language query to search the knowledge base with"
    ),
    knowledge_base_id: str = Field(
        ...,
        description="The knowledge base ID to query.",
    ),
    reranking: bool = Field(
        False,
        description="Whether to rerank the results. Useful for improving relevance and sorting.",
    ),
    reranking_model_name: Literal["COHERE", "AMAZON"] = Field(
        "AMAZON",
        description="The name of the reranking model to use. Options: 'COHERE', 'AMAZON'",
    ),
    data_source_ids: Optional[List[str]] = Field(
        None,
        description="The data source IDs to filter the knowledge base by.",
    ),
) -> str:
    """Query Amazon Bedrock Knowledge Bases with natural language.

    Response format: JSON documents with content, location, and relevance score.

    Best practices:
    - Use clear, specific queries for best results
    - Make multiple focused queries instead of one complex query
    - Extract and combine information from multiple results
    - Consider source reliability and relevance scores
    - Try different queries if results aren't relevant
    """
    return await query_knowledge_base(
        query=query,
        knowledge_base_id=knowledge_base_id,
        kb_agent_client=kb_runtime_client,
        number_of_results=10,  # Hardcoded to 10 results
        reranking=reranking,
        reranking_model_name=reranking_model_name,
        data_source_ids=data_source_ids,
    )


def main():
    """Run the MCP server with CLI argument support."""
    parser = argparse.ArgumentParser(
        description="A Model Context Protocol (MCP) server"
    )
    parser.add_argument("--sse", action="store_true", help="Use SSE transport")
    parser.add_argument(
        "--port", type=int, default=8888, help="Port to run the server on"
    )

    args = parser.parse_args()

    # Run server with appropriate transport
    if args.sse:
        mcp.settings.port = args.port
        mcp.run(transport="sse")
    else:
        mcp.run()


if __name__ == "__main__":
    main()
