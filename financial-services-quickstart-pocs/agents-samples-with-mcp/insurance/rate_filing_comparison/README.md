# Insurance Rate Filing Comparison Agent

This agent analyzes and compares insurance rate filings by leveraging Amazon Bedrock Knowledge Bases. It produces detailed markdown reports comparing different rate filings based on user queries, helping identify key differences in premium changes, coverage modifications, and market impacts.

This agent uses:

- 🔍 **Bedrock KB Search**: For searching and retrieving rate filing documents
- 📁 **Filesystem**: For saving generated comparison reports

The agent works with rate filing documents from `sample-documents` directory indexed in Amazon Bedrock Knowledge Bases.

## Features

- Searches knowledge bases containing insurance rate filings
- Analyzes and compares rate filings from different insurers
- Identifies key differences in premium changes and coverage modifications
- Examines potential market impacts and regulatory compliance
- Generates comprehensive markdown reports with detailed analysis
- Provides recommendations for stakeholders

## Prerequisites

Before running this agent, you must have completed the [setup to use the inline agent](../../mcp_servers) as well as the setup for following MCP servers:

- [bedrock-kb-search](../../mcp_servers/bedrock-kb-search)
- [filesystem](../../mcp_servers/filesystem)

## Usage

1. Index the documents and metadata files from `sample-documents` into the Amazon Bedrock Knowledge Bases. Make a note of Knowledge Base ID.

2. Activate virtual environment from project's root directory.

   ```bash
   # On macOS and Linux.
   source .venv/bin/activate
   ```

   ```bash
   # On Windows.
   .venv\Scripts\activate
   ```

3. Create a `.env` file in this directory.

   - Refer to the `.env.example` for a reference on what variables need to be set.

4. Run the example.

   ```bash
   python main.py
   ```

The agent is pre-configured to analyze and compare insurance rate filings from two carriers, examining premium changes, coverage modifications, market impacts, and regulatory compliance. You can change the query by modifying `input_text` variable in `main.py` to focus on specific carriers, regions, or time periods.

All output will be saved to the `output/{session_uuid}/` directory.

## Customization

You can modify the agent's behavior by editing:

- `main.py`: To change the agent's instructions, the foundation model used, or the default query
- `config.py`: To adjust configuration settings for the MCPs
