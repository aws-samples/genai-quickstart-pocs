# MCP Enterprise IT Helpdesk ServiceNow Assistant

## 📚 Table of Contents
- [Overview](#overview)
- [What are Strands Agents?](#what-are-strands-agents)
- [Key Features](#key-features)
- [MCP Server Requirement](#mcp-server-requirement)
- [Dependencies](#dependencies)
- [Configuration](#configuration)
- [Setup](#setup)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Sample Prompts](#sample-prompts)


---

## Overview

MCP ServiceNow Helpdesk Assistant is an AI-powered chatbot for ServiceNow incident management, built with [Strands Agents](https://strandsagents.com/) and the Model Context Protocol (MCP). It connects directly to a ServiceNow MCP server, dynamically discovers all available tools, and passes them to a Strands Agent for natural language ITSM support.

---

## What are Strands Agents?

[Strands Agents](https://strandsagents.com/) is an open-source, model-driven framework for building intelligent, autonomous agents. It allows developers to:
- Integrate large language models (LLMs) with external tools and APIs
- Orchestrate complex workflows and multi-step reasoning
- Build agents that can plan, reason, and act autonomously
- Support multi-agent collaboration and advanced tool use

Strands Agents provides a simple, code-first interface for connecting LLMs to real-world actions, making it ideal for enterprise automation and AI-driven assistants.

---

## Key Features
- **Dynamic tool discovery**: All available ServiceNow MCP tools are discovered at runtime—no manual wrappers needed.
- **Direct MCP integration**: No dependency on legacy wrappers or custom tool code.
- **Modern Streamlit UI**: User-friendly chat interface for ITSM operations.
- **LLM integration**: Works with Bedrock or other 3rd party LLMs.
- **Easy extensibility**: Add new ServiceNow tools to the MCP server and they become available instantly. Incorporates Strands's `swarm` tool for multi-agent collaboration.
- **Query ServiceNow records and tables**: Use natural language to retrieve any record or table in ServiceNow.
- **Create, update, and delete ServiceNow records**: Perform full CRUD operations on ServiceNow data.
- **Access and query the ServiceNow Service Catalog**: Search, request, and manage catalog items and requests.
- **Analyze and optimize the ServiceNow Service Catalog**: Get insights and recommendations for catalog improvements.
- **Natural language interface for all MCP tools**: Any tool exposed by the MCP server is available to the agent via natural language queries.


---

## MCP Server Requirement

This project requires a running ServiceNow MCP server. We recommend using the open-source MCP server from [echelon-ai-labs/servicenow-mcp](https://github.com/echelon-ai-labs/servicenow-mcp).

---

## Dependencies

- Python 3.8+
- [Strands Agents SDK](https://pypi.org/project/strands-agents/)
- [strands-agents-tools](https://pypi.org/project/strands-agents-tools/)
- [ServiceNow MCP server](https://github.com/echelon-ai-labs/servicenow-mcp) 
- Streamlit

Install dependencies:
```bash
pip install -r requirements.txt
```

**requirements.txt** should include:
```
strands-agents>=0.1.1
strands-agents-tools>=0.1.1
streamlit
```

---

## Configuration

Edit `config.py` with your ServiceNow MCP server details:
```python
SERVICENOW_MCP_CONFIG = {
    "command": "path/to/servicenow-mcp/python.exe",
    "args": ["-m", "servicenow_mcp.cli"],
    "env": {
        "SERVICENOW_INSTANCE_URL": "https://your-instance.service-now.com",
        "SERVICENOW_USERNAME": "your-username",
        "SERVICENOW_PASSWORD": "your-password",
        "SERVICENOW_AUTH_TYPE": "basic"
    }
}
```

---

## Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd <your-repo-directory>
   ```
2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Configure your MCP server connection:**
   - Edit `config.py` as shown above.
4. **Start the ServiceNow MCP server:**
   - See [echelon-ai-labs/servicenow-mcp](https://github.com/echelon-ai-labs/servicenow-mcp) for setup instructions.

---

## Usage

Run the Streamlit app:
```bash
streamlit run chatbot_app.py
```

Chat with the agent about incidents, latest trends, or IT support.

---

## Sample Prompts

Here are some example prompts you can use with the MCP ServiceNow Helpdesk Assistant:

- "Create an incident for email system down."
- "Search for incidents related to VPN."
- "Update incident INC0012345 status to resolved."
- "Show me trends from last week."
- "Find solutions for password reset."
- "List all open incidents assigned to the Network team."
- "Show me the details for incident INC0012345."
- "Create a high priority incident for server outage."
- "Search knowledge base for VPN troubleshooting."
- "What are the recent trends in incidents?"


---

## Project Structure

```
.
├── chatbot_app.py         # Streamlit web interface
├── chatbot_agent.py       # Main chatbot agent (MCP-based)
├── config.py              # Configuration settings
├── requirements.txt       # Python dependencies
├── main.py                # CLI entry point
├── env                    # Environment variables
```


**Built with ❤️ by hdhanoa** 