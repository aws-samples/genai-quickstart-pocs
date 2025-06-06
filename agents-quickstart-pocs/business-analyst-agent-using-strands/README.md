# Business Analysis Agent with Strands Tools

<div align="center">
Intelligent Business Analysis powered by Strands Agent Framework

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Strands](https://img.shields.io/badge/Strands-Agent-brightgreen)](https://strands.ai/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
</div>

## 📋 Table of Contents

- [Business Analysis Agent with Strands Tools](#business-analysis-agent-with-strands-tools)
- [📋 Table of Contents](#-table-of-contents)
- [Introduction](#introduction)
    - [What are Strands Agents?](#what-are-strands-agents)
    - [Key Features](#key-features)
    - [Why Strands Agents?](#why-strands-agents)
- [🔧 Strands Tools](#-strands-tools)
- [🏗️ Architecture](#-architecture)
- [🚀 Setup](#-setup)
- [🐳 Docker Setup](#-docker-setup)
- [✅ Prerequisites](#-prerequisites)
    - [Simple Strands Implementation](#simple-strands-implementation)

# Introduction
Welcome to Strands Agents - a comprehensive framework for building intelligent, autonomous agents in Python. Think of Strands Agents as a Swiss Army knife for AI development: just as a multi-tool combines essential tools in one portable package, Strands Agents provides a curated collection of pre-built tools and utilities that work seamlessly together to create powerful AI solutions.

### What are Strands Agents?
Strands Agents is a Python-based framework designed to help engineers rapidly develop and deploy AI agents that can interact with various systems, process information, and execute complex workflows. Much like how a conductor orchestrates different sections of an orchestra to create harmonious music, Strands Agents coordinates multiple AI capabilities - from file operations to web interactions - enabling your agents to perform sophisticated tasks autonomously.

### Key Features
The framework includes the optional strands-agents-tools package, which provides an extensive toolkit for common agent operations:

- **RAG & Memory Systems**: Like giving your agent a filing cabinet with perfect recall, these tools enable semantic data retrieval and persistent memory through Amazon Bedrock Knowledge Bases and Mem0 integration
- **File & System Operations**: Your agent can read, write, and edit files as naturally as a human developer, with built-in support for environment management and shell command execution
- **Code Interpretation**: A built-in Python REPL allows your agent to write and execute code on the fly - imagine having a junior developer that never sleeps
- **Web & Network Capabilities**: From making API calls to Slack integration, your agent can interact with external services like a skilled API engineer
- **Multi-modal Processing**: Handle images, generate AI art, create videos, and even synthesize speech - turning your agent into a multimedia powerhouse
- **AWS Integration**: Native support for AWS services, making cloud-based solutions as accessible as local operations
- **Agent Orchestration**: Advanced features for creating agent networks, managing workflows, and coordinating complex multi-agent systems - think of it as building a team of specialized AI workers

### Why Strands Agents?
In the world of AI engineering, building agents often feels like assembling a complex machine from scratch. Strands Agents changes this paradigm by providing production-ready components that snap together like LEGO blocks. Whether you're building a simple automation tool or a sophisticated multi-agent system, Strands Agents provides the foundation and flexibility to transform customer requirements into working solutions efficiently.
The framework is open-source and actively maintained, with the codebase available on GitHub for those who want to contribute or customize the tools for their specific needs.

### 🔧 Strands Tools

The Strands Agent leverages these [built-in tools](https://strandsagents.com/latest/user-guide/concepts/tools/example-tools-package/) for comprehensive business analysis:

- [file_read](https://github.com/strands-agents/tools/blob/main/src/strands_tools/file_read.py)
- [python_repl](https://github.com/strands-agents/tools/blob/main/src/strands_tools/python_repl.py)

This Strands agent also leverages a [custom-built tool](https://strandsagents.com/latest/user-guide/concepts/tools/python-tools/).

- [display_visualization](./tools.py) 

## 🏗️ Architecture

```
┌─────────────────────┐
│   User Interface    │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  Strands Agent      │<----> Model Provider
│  (Orchestration)    │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│   Strands Tools     │
├─────────────────────┤
│ • file_read         │
│ • display_visual    │
│ • python_repl       │
└─────────────────────┘
           │
┌──────────▼──────────┐
│   Data Sources      │
├─────────────────────┤
│ • Files (CSV)       │
└─────────────────────┘
```

## 🚀 Setup

To get started with the Business Analysis Agent:

1. **Change directory to the repository**:
   ```bash
   cd business-analyst-agent-using-strands
   ```

2. **Setup Python VENV and install dependencies**:
   ```bash
   python -m venv venv
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```

3. **Configure credentials**:
- There are three paths for setting up credentials to use this project:
- i. Use `aws configure`
- ii. Manually set static credentials using environment variables
```bash 
  export AWS_ACCESS_KEY_ID="<YOUR ACCESS KEY HERE>"
  export AWS_SECRET_ACCESS_KEY="<YOUR SECRET KEY HERE>"
```
- iii. The last example being with `aws configure sso` if your organization supports logging in using AWS IAM Identity Center.

4. **Run the Streamlit App**:
   ```bash
   streamlit run app.py
   ```

## 🐳 Docker Setup

You can run this application in a Docker container for better isolation and portability. Follow these steps:

1. **Build the Docker image**:

- From the root of this repository, run:
   ```bash
   docker build -t business-analyst-agent .
   ```

2. **Run the container**:
   ```bash
   docker run -p 8501:8501 \
     -e AWS_ACCESS_KEY_ID="<YOUR ACCESS KEY HERE>" \
     -e AWS_SECRET_ACCESS_KEY="<YOUR SECRET KEY HERE>" \
     business-analyst-agent
   ```

   If using AWS SSO:
   ```bash
   docker run -p 8501:8501 \
     -v ~/.aws:/root/.aws \
     business-analyst-agent
   ```

3. **Access the application**:
   Open your browser and navigate to `http://localhost:8501`

Note: The container exposes port 8501 for the Streamlit interface. Make sure this port is available on your host machine.


## ✅ Prerequisites

- **Python 3.12+** installed on your system
- **Docker** (optional, for containerized deployment)
- **Business data sources** (CSV data sources found in the sample_data folder)

### Simple Strands Implementation

```python
from strands import Agent

# Initialize client
agent = Agent(
  system_prompt="Some system prompt",
  tools = [list_of_tools],
  model=someModelConfig
)

# Run analysis
response = agent("Your prompt goes here.")
)
```

---

<div align="center">
Built with ❤️ by the @a-ferg
</div>