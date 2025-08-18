# Amazon Bedrock EMR Log Analytics Chatbot POC

## Overview of Solution

This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement an EMR log analytics chatbot. The application is constructed with a Streamlit frontend where users can upload EMR log files, analyze EMR cluster logs, or ask questions about EMR issues to get AI-powered troubleshooting assistance.

![A gif of a screen recording for EMR Log Analytics Chatbot](images/demo.gif)

## Goal of this POC

The goal of this repo is to provide users the ability to analyze EMR logs and get troubleshooting recommendations using Amazon Bedrock. This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.


![POC Architecture & Flow](images/architecture.png 'POC Architecture')


When a user interacts with the POC, the flow is as follows:

1. The user uploads EMR log files or provides an EMR cluster ID to analyze using Streamlit UI
2. Logs are processed and queried against known EMR issues using Athena and a results table is created.
3. The agent orchestrates multiple tools including Bedrock Knowledge Bases and AWS Documentation MCP server
4. The agent calls Bedrock with included context from tools and results table to generate key findings and recommendations
5. Users can ask follow-up questions for additional troubleshooting guidance


The sample demonstrates how to combine capabilities from AWS Analytics Services such as Amazon Athena with GenAI capabilities. 

![EMR Analyzer](images/emr_analyzer.png 'EMR Analyzer')

Since EMR logs can be hundreds of terabytes or larger in size, Athena is used to query EMR logs and generate a results table of matches against known issues. Once a results table is created, the Agent is able to use the Bedrock Knowledge Base to query a structured table containing recommendations for known issues and relevant Amazon Knowledge Center (KC) articles with further guidance. 

The recommendations and KC articles have been created and curated by AWS Support based on their experience helping customers troubleshoot issues. This POC builds upon an AWS Systems Manager Automation Runbook developed to help customers troubleshoot EMR issues and extends the functionality with GenAI capabilities. [AWSSupport-DiagnoseEMRLogsWithAthena](https://docs.aws.amazon.com/systems-manager-automation-runbooks/latest/userguide/automation-awssupport-diagnoseemrlogswithathena.html)

## Prerequisites

- AWS CLI 
- AWS CDK
- Python 3.9+
- Access to Amazon Bedrock (Claude 3 models)
- EMR Knowledge Base deployed (see CDK setup)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd amazon-bedrock-emr-log-analytics-chatbot-poc
```

### 2. Set Up Python Environment

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your specific values:

```bash
# AWS Configuration
AWS_DEFAULT_REGION=us-east-1
AWS_PROFILE=default

# Amazon Bedrock Configuration
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0

```

### 4. Deploy Infrastructure

Deploy the EMR Knowledge Base:

```bash
cd cdk-emr-kb
cdk bootstrap
cdk deploy --all
```

### 5. Set Up Knowledge Base Data

After CDK deployment, populate the knowledge base with EMR troubleshooting data:

```bash
cd ..
python setup_kb.py
```

### 6. Configure Knowledge Base (Optional)

Add curated queries and table descriptions to improve query generation:

```bash
cd cdk-emr-kb
python scripts/configure_kb.py --env dev
```

### 7. Run the Application

```bash
cd ..
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
streamlit run app.py
```

## Usage

The application provides three analysis modes:

### 1. Ask a Question
- Enter questions about EMR errors or issues
- Get AI-powered responses with AWS documentation links
- Example: "How to resolve java.lang.OutOfMemoryError in EMR?"

### 2. Upload Log Files
- Upload EMR log files (application.log, container.log, etc.)
- Files are automatically uploaded to S3 and analyzed with Athena
- Same comprehensive analysis as cluster mode
- Try sample logs for demonstration

### 3. Analyze EMR Cluster
- Enter an EMR cluster ID to analyze its logs
- Comprehensive Athena-based analysis
- Detailed findings and recommendations

## Configuration Options

### Region Selection
- Configure default region in `.env` file
- Override via sidebar dropdown in the UI

### Model Selection
Choose from available Bedrock models:
- Claude 3 Sonnet
- Claude 3 Haiku
- Titan Text Express

## Project Structure

```
amazon-bedrock-emr-log-analytics-chatbot-poc/
├── app.py                        # Main Streamlit application
├── emr_analytics/                # Core application modules
│   ├── agent.py                  # Main EMR Analysis Agent
│   ├── analysis_handlers.py      # Analysis mode handlers
│   ├── components.py             # UI components
│   ├── emr_analyzer.py           # EMR log analysis service
│   ├── knowledge_base.py         # Bedrock KB service
│   ├── log_processor.py          # Log processor service
│   ├── mcp_client.py             # AWS Documentation MCP client
│   ├── orchestrator.py           # Agent orchestration service
│   └── prompt_loader.py          # Prompt management
├── prompts/                      # System prompts
├── cdk-emr-kb/                   # CDK infrastructure code
│   ├── cdk_emr_kb/               # CDK constructs and stacks
│   ├── config/                   # CDK configuration files
│   │   ├── default.json          # Default configuration
│   │   └── config.md             # Configuration documentation
│   ├── scripts/                  # CDK utility scripts
│   │   └── configure_kb.py       # Knowledge Base configuration
│   ├── app.py                    # CDK application entry point
│   └── cdk.json                  # CDK configuration
├── emr_kb_utils/                 # Knowledge base setup utilities
├── bedrock-kb-data/              # Knowledge base data files
├── setup_kb.py                   # Knowledge base data setup script
├── requirements.txt              # All dependencies (app + CDK)
├── .env.example                  # Environment template
└── README.md                     # This file
```

## Features

### GenAI Powered Analysis
- **Orchestrated Agent**: Combines multiple AI tools for analysis
- **Knowledge Base Integration**: Queries curated EMR troubleshooting knowledge
- **AWS Documentation**: Real-time access to official AWS documentation

### Multiple Analysis Modes
- **Question Mode**: Direct Q&A about EMR issues
- **Upload Mode**: Analyze your own log files
- **Cluster Mode**: Connect to live EMR clusters for analysis

### Advanced Features
- **Progress Tracking**: Real-time progress indicators
- **Error Handling**: Graceful error handling with detailed messages
- **Verification Logs**: Detailed logs of AI agent operations

## Troubleshooting

### Common Issues

1. **Region Mismatch**: Ensure your EMR cluster and configuration use the same AWS region
2. **Knowledge Base Access**: Verify your AWS credentials have access to the Bedrock Knowledge Base
3. **MCP Server**: The AWS Documentation MCP server requires `uvx` to be installed


## Cleanup

To remove all AWS resources created by this POC:

```bash
cd cdk-emr-kb
cdk destroy --all
```
