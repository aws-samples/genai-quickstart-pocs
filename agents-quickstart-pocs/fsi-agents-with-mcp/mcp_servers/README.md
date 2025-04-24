# Model Context Protocol (MCP) with InlineAgent

This documentation provides guidance on how to initially set up the environment and walks through the project architecture.

This project uses an [Inline Amazon Bedrock agent](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-create-inline.html) to dynamically invoke an agent to perform specific tasks without pre-defining agent capabilities each time.

## Prerequisites

- Amazon Bedrock Access and CLI Credentials
- Python 3.11+ installed on your system
- Docker engine running on your system

## Setup

1. Ensure you have Python 3.11 or higher installed in your system.

```bash
# Check your Python version.
python --version
```

2. Install [uv](https://github.com/astral-sh/uv), a Python package and project manager, if not already installed. Ensure that they are added to your PATH.

```bash
# On macOS and Linux.
curl -LsSf https://astral.sh/uv/install.sh | sh
```

```bash
# On Windows.
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

You can confirm the installation with `uv --version`.

3. Create a virtual environment for project.

```bash
uv venv
```

This will create a virutal environment called `.venv` in the project's root directory.

4. Activate the virtual environment.

```bash
# On macOS and Linux.
source .venv/bin/activate
```

```bash
# On Windows.
.venv\Scripts\activate
```

5. Install the required packages.

```bash
cd agents-quickstart-pocs/fsi-agents-with-mcp/src/InlineAgent
uv pip install -e .
```

6. Set up each Model Context Protocol (MCP) server under each directory.

```bash
# Review the README.md and main.py to set up the MCP server and learn how it works.
cd mcp_servers/python-repl

# Repeat for other MCP servers.
```

Explore the `README.md` for each MCP server to understand additional steps specific to the MCP server, such as generating API keys or pulling Docker images. Additionally, you can review the `main.py` to understand each MCP server and how it can be used.

> 💡 Understanding these individual MCPs will make it easier to comprehend the more complex industry specific examples, which typically use multiple MCPs together.

## Project Architecture

Each directory of MCP server will include the following files:

- `config.py` - Contains all MCP server configuration and environment variable handling.

- `main.py` - Inline agent setup and execution.

To test each MCP server with your own query, you can navigate to `main.py` and change the `input_text` with your desired query.

Each directory of MCP server may include additional files such as:

- `server.py` - The MCP server implementation to perform specific tasks.

- `.env.example` - Example file that shows proper `.env` file setup.
