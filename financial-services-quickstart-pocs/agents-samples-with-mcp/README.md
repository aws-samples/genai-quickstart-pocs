# Amazon Bedrock Agents FSI Examples with Model Context Protocol (MCP)

<div align="center">
Examples of Amazon Bedrock Agents for the Financial Services Industry (FSI)
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
  [![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=flat&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
</div>

## 📋 Table of Contents

- [Introduction](#-introduction)
  - [What is Amazon Bedrock Agent?](#what-is-amazon-bedrock-agent)
  - [What is Inline Agent?](#what-is-inline-agent)
  - [What is Model Context Protocol (MCP)?](#what-is-model-context-protocol-mcp)
  - [What is Managed Tool?](#what-is-managed-tool)
- [MCP Servers](#-mcp-servers)
- [Managed Tools](#️-managed-tools)
- [Industry Examples](#-industry-examples)
  - [Insurance](#-insurance)
  - [Capital Markets](#-capital-markets)
- [Setup](#-setup)
- [Prerequisites](#-prerequisites)

## Introduction

This directory is a collection of tools and MCP server implementations that Amazon Bedrock Agents can interact with. It also contains industry specific agent examples that cover various use cases across FSI domain. These resources aim to accelerate the development of Bedrock Agents for the FSI domain and enable users to quickly gain hands-on experience, empowering users to build custom MCP servers and agents tailored to their specific tasks.

### What is Amazon Bedrock Agent?

Agents refer to a system that can intelligently perform tasks. For AI Agents, it uses the ReAct (Reasoning and Acting) framework so agents can design its multi-step workflow and use the available tools as needed to accomplish the goal set by user.

With [Amazon Bedrock Agents](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html), building an agent is straightforward and fast, with setup in just a few steps. As a user, you don't have to provision capacity, manage infrastructure, or write custom code. Amazon Bedrock manages prompt engineering, memory, monitoring, encryption, user permissions, and API invocation.

### What is Inline Agent?

This project uses an [Inline Amazon Bedrock agent](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-create-inline.html) so you can dynamically invoke an agent to perform specific tasks without having to pre-define the agent capabilities each time. This provides you the flexibility to rapidly experiment with different foundation models, instructions, action groups (in the form of tools or MCP servers), guardrails, and knowledge bases just by changing the parameters at runtime.

### What is Model Context Protocol (MCP)?

[Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) is an open protocol that standardizes how applications provide context to the foundation models. MCP allows developers to use a single protocol to give models access to a wide range of data sources, so the model can provide contextually relevant and up-to-date responses to the users. In addition, developers can leverage a growing list of community-built integrations that models can directly plug into instead of having to create custom integrations for each individual data source.

### What is Managed Tool?

Tools are a way of extending the capabilities of a foundation Model. Through tools, models can interact with external systems, perform computations, and take actions in the real world.

Managed tools are the tools that are pre-built within Amazon Bedrock Agents, so you can simply enable them as needed for each agent.

## 🔌 MCP Servers

The [`mcp_servers`](./mcp_servers) directory contains various MCP servers:

- 🔍 [`bedrock-kb-search`](./mcp_servers/bedrock-kb-search): Integration to Amazon Bedrock Knowledge Bases to retrieve relevant data from indexed documents
- 🐍 [`python-repl`](./mcp_servers/python-repl): Integration to Python REPL environment for executing code in a persistent environment
- 📁 [`filesystem`](./mcp_servers/filesystem): Integration to user's File system for reading and writing files
- 🔎 [`perplexity-search`](./mcp_servers/perplexity-search): Integration to Perplexity Search service for web information retrieval
- 📈 [`yahoo-finance`](./mcp_servers/yahoo-finance): Integration to Yahoo Finance for real-time stock data, financial statements, analyst recommendations, and market analysis
- 📊 [`financial-datasets`](./mcp_servers/financial-datasets): Integration to financial market data for stocks, cryptocurrencies, and other instruments
- 📈 [`fredapi`](./mcp_servers/fredapi): Integration to Federal Reserve Economic Data for economic indicators

> 💡 Understanding these individual MCPs will make it easier to comprehend the more complex industry specific examples, which typically use multiple MCPs together.

## 🛠️ Managed Tools

The [`managed_tools`](./managed_tools) directory contains managed tools for Amazon Bedrock Agents:

- 👨‍💻 [`code-interpreter`](./managed_tools/code-interpreter): Code Interpreter to generate, run, and troubleshoot code in a secure test environment to achieve user provided tasks

## 🏢 Industry Examples

### 🏥 Insurance

The [`insurance`](./insurance) directory contains insurance industry specific examples:

<details>

<summary><h4>📋 Actuarial Modelling Assistant</h4></summary>

**What it does**: Analyzes insurance datasets to identify trends, model risks, and generate actuarial insights.

**MCPs used**:

- 🐍 **Python REPL**: For data analysis, statistical modeling, and visualization
- 📁 **Filesystem**: For writing actuarial reports to output directory

**Key features**:

- Exploratory data analysis on policy, claims, and risk data
- Statistical modeling for claim frequency and severity
- Loss ratio and reserve adequacy calculations
- Actuarial visualization and report generation

</details>

<details>

<summary><h4>📝 Rate Filing Comparison</h4></summary>

**What it does**: Compares insurance rate filings from different insurers to identify differences and market trends.

**MCPs used**:

- 🔍 **Bedrock KB Search**: For retrieving rate filing documents from knowledge bases
- 📁 **Filesystem**: For writing comparison reports to output directory

**Key features**:

- Knowledge base search of insurance rate filings
- Detailed comparison of premium changes
- Coverage modification analysis
- Markdown report generation

</details>

### 💹 Capital Markets

The [`capital_markets`](./capital_markets) directory includes capital markets specific examples:

<details>

<summary><h4>💰 Crypto Investment Agent</h4></summary>

**What it does**: Analyzes cryptocurrency investment opportunities and provides investment recommendations.

**MCPs used**:

- 📊 **Financial Datasets**: For cryptocurrency price data
- 📈 **FRED API**: For macroeconomic indicators
- 🔎 **Perplexity Search**: For market news and sentiment

**Managed tools used**:

- 👨‍💻 **Code Interpreter**: For investment modeling, risk analysis, and data visualization

**Key features**:

- Historical cryptocurrency price analysis
- Macroeconomic impact assessment
- Risk modeling and scenario simulation
- Investment allocation recommendations

</details>

<details>

<summary><h4>📉 Stock Data Processing</h4></summary>

**What it does**: Processes stock market data to identify technical patterns and develop trading strategies.

**MCPs used**:

- 📊 **Financial Datasets**: For stock market data
- 📁 **Filesystem**: For storing results and trading signals

**Managed tools used**:

- 👨‍💻 **Code Interpreter**: For technical analysis and strategy backtesting

**Key features**:

- Technical indicator calculation
- Trading pattern identification
- Strategy backtesting and optimization
- Performance visualization

</details>

<details>

<summary><h4>📊 Local Stock Data Processing</h4></summary>

**What it does**: Performs advanced stock analysis and price predictions with data analysis and machine learning models.

**MCPs used**:

- 📈 **Yahoo Finance**: For retrieving comprehensive financial data
- 🐍 **Python REPL**: For data analysis, modeling, and visualization

**Key features**:

- Historical price data collection and organization
- Price prediction using data analysis and machine learning models
- Interactive visualization and charting
- Comprehensive markdown reporting with insights

</details>

<details>

<summary><h4>📊 Historical Macro</h4></summary>

**What it does**: Identifies historical periods with macroeconomic conditions similar to the present.

**MCPs used**:

- 📈 **FRED API**: For economic data retrieval
- 🔎 **Perplexity Search**: For historical context and market research

**Key features**:

- Economic indicator comparison
- Historical parallel identification
- Similarity scoring and ranking
- Forward-looking insights based on historical patterns

</details>

## 🚀 Setup

To get started, follow the instructions from [`mcp_servers`](./mcp_servers) directory to configure each MCP server. Once you have set up and tested the MCP servers, you can move on to test the industry specific examples, and also build your own agents from available tools and MCP servers if desired.

## ✅ Prerequisites

- Amazon Bedrock Access and CLI Credentials
- Python 3.11+ installed on your system
- Docker engine running on your system
