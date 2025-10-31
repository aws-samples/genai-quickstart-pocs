# Amazon Bedrock Knowledge Base Search with InlineAgent

This documentation demonstrates how to use MCP server to search the Amazon Bedrock Knowledge Bases to retrieve information from your company's data sources.

## Features

- Discover available knowledge bases and their data sources
- Query knowledge bases using natural language
- Rerank results for improved relevance
- Filter queries by specific data sources
- Retrieve information from documents, websites, and databases

## Setup

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
   - Make sure the profile has permissions to access Amazon Bedrock Knowledge Bases.
   - To use reranking, the service role attached to the Knowledge Bases must have access to the reranking models. Then, you can specify to use reranking in the input_text in `main.py` or change the default value of reranking field to `True` in `server.py`.

3. Run the example.

   ```bash
   python main.py
   ```

   If desired, you can change the query from `input_text` parameter.

## Tools

Tool: `QueryKnowledgeBases`

- Query an Amazon Bedrock Knowledge Base using natural language.

| Parameters           | Description                                                                          |
| -------------------- | ------------------------------------------------------------------------------------ |
| query                | A natural language query to search the knowledge base with                           |
| knowledge_base_id    | The ID of the knowledge base to query                                                |
| reranking            | Optional. Whether to rerank the results for better relevance. Default: False         |
| reranking_model_name | Optional. The reranking model to use, either "COHERE" or "AMAZON". Default: "AMAZON" |
| data_source_ids      | Optional. The list of data source IDs to filter by. Default: None                    |

## Example Queries

- "What knowledge bases are available?"
- "Find information about AWS Lambda functions in the documentation knowledge base"
- "Search for pricing details in the product information knowledge base"
- "Look up best practices for building serverless applications"
- "Find examples of integrating Amazon Bedrock with other AWS services"
