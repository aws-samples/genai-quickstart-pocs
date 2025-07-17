#  Enterprise IT Helpdesk ServiceNow Assistant

## 📚 Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Usage](#usage)
- [Available Tools](#available-tools)
- [Sample Prompts](#sample-prompts)
- [Resources](#resources)




## Overview

MCP ServiceNow Helpdesk Assistant is an AI-powered chatbot for ServiceNow incident management, built with [Strands Agents](https://strandsagents.com/) and the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction). It connects directly to a ServiceNow MCP server, dynamically discovers all available tools, and passes them to a Strands Agent for natural language ITSM support.



## Key Features
- **Dynamic tool discovery**: All available ServiceNow MCP tools are discovered at runtime—no manual wrappers needed.
- **Direct MCP integration**: No dependency on legacy wrappers or custom tool code.
- **Perform incident managemnt, change managemnt,knowlegebase management with natural language prompts.**
- **Modern Streamlit UI**: User-friendly chat interface for ITSM operations.
- **LLM integration**: Works with Bedrock or other 3rd party LLMs.
- **Easy extensibility**: Add new ServiceNow tools to the MCP server and they become available instantly. Incorporates Strands's `swarm` tool for multi-agent collaboration.
- **Query ServiceNow records and tables**: Use natural language to retrieve any record or table in ServiceNow.
- **Create, update, and delete ServiceNow records**: Perform full CRUD operations on ServiceNow data.
- **Natural language interface for all MCP tools**: Any tool exposed by the MCP server is available to the agent via natural language queries.




## Project Structure

```
.
├── chatbot_app.py         # Streamlit web interface
├── chatbot_agent.py       # Main chatbot agent logic and tool calling (MCP-based)
├── config.py              # Configuration settings for MCP server and model credentials
├── requirements.txt       # Python dependencies
├── main.py                # CLI entry point

```



## Prerequisites

- **Python 3.8+** installed on your system ([Download Python](https://www.python.org/downloads/))
- **Git** for cloning the repository ([Download Git](https://git-scm.com/downloads))
- Access to a **ServiceNow instance** (with credentials)
- Access to a **ServiceNow MCP server** ([servicenow-mcp GitHub](https://github.com/echelon-ai-labs/servicenow-mcp))
-  An API key or credentials for your preferred LLM provider (e.g., AWS Bedrock)



## Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd <your-repo-directory>
   ```
2. **Setup Python VENV and install dependencies:**

   ```bash
   python -m venv venv
   source venv/bin/activate # On Windows: .venv\Scripts\activate

   pip install -r requirements.txt

   ```
3. **Configure credentials:**

   There are two  paths for setting up credentials to use this project:

   i. Use `aws configure`  
   ii. Manually set static credentials using environment variables: 

   ```bash
   export AWS_ACCESS_KEY_ID="<YOUR ACCESS KEY HERE>"
   export AWS_SECRET_ACCESS_KEY="<YOUR SECRET KEY HERE>"

    ```


4. **Instal  the ServiceNow MCP server:**
   - See [echelon-ai-labs/servicenow-mcp](https://github.com/echelon-ai-labs/servicenow-mcp) for setup instructions.
   - Skip the Setup #3  under installation of this repository if you are using below config file within your application to start the MCP server.
   
5. **Configure  ServiceNow MCP server with your application :**

Edit `config.py` with your ServiceNow MCP server details.  
If you install the servicenow‑mcp server at `C:/my-mcp-servers`, then your command should look like this:

```powershell
"C:\\my-mcp-servers\\servicenow-mcp\\.venv\\Scripts\\python.exe"

```

```python
SERVICENOW_MCP_CONFIG = {
    "command": "path_to_servicenow_mcp_server\\.venv\\Scripts\\python.exe",
    "args": ["-m", "servicenow_mcp.cli"],
    "env": {
        "SERVICENOW_INSTANCE_URL": "https://your-instance.service-now.com",
        "SERVICENOW_USERNAME": "your-username",
        "SERVICENOW_PASSWORD": "your-password",
        "SERVICENOW_AUTH_TYPE": "basic"
    }
}
```

## Usage

Run the Streamlit app:
```bash
streamlit run chatbot_app.py
```

Chat with the agent about incidents,change management, knowlegebase management or IT support.



## Available Tools


**Incident Management Tools**

- **create_incident** — Create a new incident in ServiceNow  
- **update_incident** — Update an existing incident in ServiceNow  
- **add_comment** — Add a comment to an incident in ServiceNow  
- **resolve_incident** — Resolve an incident in ServiceNow  
- **list_incidents** — List incidents from ServiceNow  

**Change Management Tools**

- **create_change_request** — Create a new change request in ServiceNow  
- **update_change_request** — Update an existing change request  
- **list_change_requests** — List change requests with filtering options  
- **get_change_request_details** — Get detailed information about a specific change request  
- **add_change_task** — Add a task to a change request  
- **submit_change_for_approval** — Submit a change request for approval  
- **approve_change** — Approve a change request  
- **reject_change** — Reject a change request  

**Service Catalog Tools**

- **list_catalog_items** — List service catalog items from ServiceNow  
- **get_catalog_item** — Get a specific service catalog item from ServiceNow  
- **list_catalog_categories** — List service catalog categories from ServiceNow  
- **create_catalog_category** — Create a new service catalog category in ServiceNow  
- **update_catalog_category** — Update an existing service catalog category in ServiceNow  
- **move_catalog_items** — Move catalog items between categories in ServiceNow  
- **create_catalog_item_variable** — Create a new variable (form field) for a catalog item  
- **list_catalog_item_variables** — List all variables for a catalog item  
- **update_catalog_item_variable** — Update an existing variable for a catalog item  
- **list_catalogs** — List service catalogs from ServiceNow  

**Knowledge Base Management Tools**

- **create_knowledge_base** — Create a new knowledge base in ServiceNow  
- **list_knowledge_bases** — List knowledge bases with filtering options  
- **create_category** — Create a new category in a knowledge base  
- **create_article** — Create a new knowledge article in ServiceNow  
- **update_article** — Update an existing knowledge article in ServiceNow  
- **publish_article** — Publish a knowledge article in ServiceNow  
- **list_articles** — List knowledge articles with filtering options  
- **get_article** — Get a specific knowledge article by ID  



## Sample Prompts

Here are some example prompts you can use with the MCP ServiceNow Helpdesk Assistant:

- "Create an incident for email system down."
- "Search for incidents related to VPN."
- "Update incident INC0012345 status to resolved."
- "Find solutions for password reset."
- "List all open incidents assigned to the Network team."
- "Show me the details for incident INC0012345."
- "Create a high priority incident for server outage."
- "Search knowledge base for VPN troubleshooting."
- "create a new article in knowledge bases about how to how to avoid Phishing attacks"
- "Create a new change request for next Tuesday to patch all window production servers with security patch KB33333"



## Resources

- [Strands Agents SDK](https://pypi.org/project/strands-agents/)
- [strands-agents-tools](https://pypi.org/project/strands-agents-tools/)
- [ServiceNow MCP server](https://github.com/echelon-ai-labs/servicenow-mcp) 
- [Streamlit] (https://streamlit.io/)

## Quick Demo

[![Watch the demo](https://img.youtube.com/vi/5wd0stFDuOE/0.jpg)](https://www.youtube.com/watch?v=5wd0stFDuOE)

<p align="center">**Built by hdhanoa** </p>


