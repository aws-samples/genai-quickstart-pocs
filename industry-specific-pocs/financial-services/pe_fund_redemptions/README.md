## **Introduction**

This POC demonstrates how to enhance the [Strands AgentCore React starter template](https://github.com/altanalytics/strands-agentcore-react) with custom tools and capabilities for a specific finance use case. 

**Key Enhancements Demonstrated:**
- Custom tools in [Strands-Agents](https://strandsagents.com/latest/)
- AgentCore Gateway integration with MCP (Model Context Protocol)
- Knowledge base integration for document analysis
- Dual tool architecture (local + Lambda-based MCP tools)

# Private Equity Fund Redemption AI Assistant

This is a proof-of-concept agentic AI system that revolutionizes Private Equity fund redemption analysis by automating the complex process of investment eligibility verification and redemption request processing.

**🚀 Live Demo**: [https://pe.tonytrev.people.aws.dev/](https://pe.tonytrev.people.aws.dev/)  
*Note: For security, only Amazon employees can create accounts*

**Note:** In this implementation, the data will be stored to an S3 document storage (sample data provided in `/data` folder). 


## Steps to Create

### **1. Create the Amplify App**

The skeleton of this app with full steps can be found [here](https://github.com/altanalytics/strands-agentcore-react/tree/main).

Once you have pushed this repo to a hosted repository: 

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/home) in us-east-1
2. Click "Deploy an App" or "Create New App" if you already have apps
3. Select your remote git repository to link Amplify to git
4. Choose the branch you want to deploy (e.g., `main`)
5. Click Next and then in Advanced Settings, add two environment variables:
  - `AGENTCORE_RUNTIME_ARN` = `arn:aws:bedrock-agentcore:us-east-1:123456789012:runtime/strands_agent_xyz` 
    * You will get the real one after step 5, but use this placeholder for now before deployment
  - `NOTIFICATION_EMAIL` = `your-email@example.com`
6. Once you deploy your application
7. You can login to your app throught he URL, but your Agent will not work
8. Activate the Amazon Bedrock Nova models (Micro, Pro, Premium) in your AWS account (region us-east-1)
9. *You must also enable the Claude Sonnet 4 model - even though we are invoking Nova-Micro - Strands needs the claude model to be enabled to work (this could change in later versions of `strands-agents`*

*Pay close attention to the environment variables - these have to be set before you deploy*

### **2. Build and Test Your agent and Docker container**

```bash
cd genai

# Install uv if needed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Test locally - IMPORTANT: Set environment variable for Strands compatibility
export AWS_PROFILE=your-profile-name
export AWS_REGION=us-east-1

uv run uvicorn agent:app --host 0.0.0.0 --port 8080

# Test endpoint
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is artificial intelligence?"}'
```



```bash
# Setup Docker buildx (make sure Docker desktop is running)
cd genai
docker buildx create --use

# Build image
docker buildx build --platform linux/arm64 -t my-agent:arm64 --load .

# Test locally with credentials
docker run --platform linux/arm64 -p 8080:8080 \
  -e AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
  -e AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
  -e AWS_SESSION_TOKEN="$AWS_SESSION_TOKEN" \
  -e AWS_REGION="$AWS_REGION" \
  my-agent:arm64

# OR Test with credentials file based on a profile
aws configure export-credentials --profile your-profile-name --format env-no-export > docker.env
echo "AWS_REGION=us-east-1" >> docker.env
docker run --platform linux/arm64 -p 8080:8080 \
  --env-file docker.env my-agent:arm64

# Use same test command as above but with input paramters
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{
      "prompt": "Tell me a story",
      "model": "us.amazon.nova-pro-v1:0",
      "personality": "You are a storyteller who speaks in the style of Shakespeare."
  }'
```

### **3. Build and Push Docker Image**
```bash

# Set your AWS account ID as a variable
AWS_PROFILE=your-profile-name
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text --profile $AWS_PROFILE)

# Create ECR repository - only run this one time
aws ecr create-repository --repository-name my-strands-agent --region us-east-1 --profile $AWS_PROFILE


# Login to ECR using the variable
aws ecr get-login-password --region us-east-1 --profile $AWS_PROFILE | docker login --username AWS --password-stdin $AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com 

# Push to ECR using the variable
docker buildx build --platform linux/arm64 -t $AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/my-strands-agent:latest --push .
```

### **4. Deploy Agent Runtime**
```bash
# Deploy to Bedrock Agent Core
# *** MAKE SURE THE AMPLIFY APP HAS BEEN DEPLOYED AND THE bedrock-agent-core-role OR THIS WILL FAIL
uv run agent_deploy.py

# You can update your existing agent (don't forget to rebuild and push your docker container)
uv run agent_update.py

```

The command above will output "Agent Runtime ARN". You will need this value for the next set of steps. 

### **5. Update Environment Variables**

First update the environment variables in Amplify

1. Go into the AWS UI Console
2. Go to Amplify > App > Hosting > Environment Variables
3. Update the AGENTCORE_RUNTIME_ARN (set up above) with the new runtime

Next configure env variables lovally.  
1. Open the .env.example file in the top folder
2. Update the ARN with the new ARN and save as .env (not as .env.example!!)


### **6. Test Agent**
```bash
# Test your deployed agent
uv run agent_invoke.py
```

## **Creating MCP Server**

If you have made it this far, it is now time to add an additional optional feature. Configuring your tools to run as a unified MCP service. To do this, we setup a single Lambda function that handles all data operations and is available as a standalone tool for other Agents to use.

**New Two-Tool Architecture**: We've moved from a single unified tool to two specialized MCP services - one for fund documents and one for data operations - providing cleaner separation of concerns.

Lets get Started...

### **1. Create a Knowledge Base**

Log into the AWS console. Head to Bedrock > Knowledge Bases. 
* Create a Knowledge Base using Vector Store
* Select Fund Document Folder from your S3 bucket
* Use Titan Embedding model v2
* Select S3 vectors
* Select only the fund_documents folder and not the database folder

Once the Knowledge Base is created (don't forget to sync it) update `genai/tools/knowledge_base___retrieve_documents.py` with your knowledge base id.

### **2. Deploy MCP Services**

Follow the instructions in the MCP configuration README:

```bash
# Navigate to genai directory for uv commands
cd genai

# Deploy Lambda functions (auto-discovers S3 bucket)
uv run ../agent_core_config/deploy_lambdas.py

# Create MCP Gateway with two targets
uv run ../agent_core_config/gateway_deploy.py
# OR
uv run ../agent_core_config/gateway_update.py

# Test the deployment
uv run ../agent_core_config/test_mcp_gateway.py
```

For detailed instructions, see: `agent_core_config/README.md`

### **3. Update Agent with Knowledge Base**

Once the Knowledge Base and MCP services are deployed, update your agent:

```bash
uv run agent_update.py
```

After this, you should be able to log into your website (check amplify for URL).

* You will get an email saying you have a new sign-up (must have amazon.com domain)
* You will have three agents to choose from: Analyst, PE Fund Redemption, or MCP PE Fund Redemption

Enjoy!

_______

# An overview of the app business use case and technical setup

## Business Use Case

### The Problem
Private Equity fund redemption reviews are traditionally time-intensive manual processes requiring deep expertise:
- **Hours per analysis**: Each redemption request requires identifying a specific investment to redeem and then an extensive review of the fund document, investor eligibility, fund eligibility and specific investment eligibility. 
- **High volume**: Fund managers typically process 30+ redemption requests monthly across diverse fund portfolios
- **Complex compliance matrix**: Multiple variables must be cross-referenced:
  - **Investor class tiers** (ClassA, ClassB, Institutional) with different terms and restrictions
  - **Holding period requirements** (30-39+ months minimum depending on fund and class)
  - **Redemption windows** (quarterly gates with specific notice periods: 45-105 days)
  - **Fee structures** (early/mid/late redemption fees: 0-3% based on timing)
  - **Volume restrictions** (minimum redemption percentages, annual caps, quarterly gates)
  - **Market conditions** (stress deferrals, valuation thresholds)
- **Multi-source data reconciliation**: Investment records, fund documents, investor profiles, and historical redemption patterns
- **Human error risk**: Manual cross-referencing of complex rules increases oversight probability

### The Solution
This AI-powered system transforms redemption analysis from hours to minutes by:
- **Intelligent investment discovery**: Guides users to identify investments eligible for redemption
- **Document-driven analysis**: Retrieves and processes actual fund documents with redemption criteria
- **Automated eligibility verification**: AI agent analyzes fund documents and applies redemption rules contextually
- **Structured decision support**: Provides detailed reasoning and recommendations for redemption requests

### Value Proposition
- **Time savings**: Reduces analysis time from hours to minutes per request
- **Accuracy improvement**: Eliminates human error through systematic rule application
- **Scalability**: Handles high-volume redemption processing efficiently
- **Compliance assurance**: Ensures all fund document requirements are properly evaluated

## Technical Architecture

### System Overview
This application combines a modern React frontend with an AI-powered backend leveraging the latest LLM models on Amazon Bedrock and hosted on AgentCore (still in preview).

### Architecture Components

#### **Frontend Layer**
- **React Application**: Modern, responsive chat interface for user interactions
- **AWS Amplify Hosting**: Scalable web hosting with CI/CD integration
- **Cognito Authentication**: Secure user authentication with email/password
- **Real-time Streaming**: Live AI response streaming for enhanced user experience

#### **AI Agent Layer**
- **Amazon Bedrock AgentCore**: Orchestrates AI agent runtime and tool execution
- **Strands Agent Framework**: Provides structured agent configuration and conversation management
- **User Model Selection**: For flexibility
- **Dual Tool Architecture**: This POC demonstrates the use of both local tools and MCP-based Lambda tools to show the latest capabilities of Bedrock and [Strands-Agents](https://strandsagents.com/latest/)

#### **Data & Integration Layer**
- **S3 Document Storage**: Houses fund documents with redemption rules and criteria
- **S3 CSV Data**: Stores structured fund, investment, and investor data as CSV files
- **Lambda Functions**: Serverless compute for unified data operations
- **MCP Gateway**: Model Context Protocol integration for external tool connectivity
- **Knowledge Base**: Bedrock knowledge base for semantic search across fund documents

### Tool Ecosystem

#### **Local Agent Tools**
Embedded directly in the AI agent for fast execution:
- `pull_fund_document`: Retrieves fund documents from S3 storage
- `pull_s3_data___get_investors`: Accesses investor data from S3 CSV files
- `pull_s3_data___get_investments`: Filters and searches investment records from S3
- `pull_s3_data___get_fund_mapping`: Manages fund information and classifications from S3
- `pull_s3_data___get_redemption_requests`: Tracks redemption request history from S3
- `knowledge_base___retrieve_documents`: Semantic search across all fund documents (analyst only)

#### **MCP-Based Tools**
Deployed as Lambda functions and accessed via AgentCore Gateway to demonstrate new MCP capabilities:
- **Fund Document Service**: `fund_document_service` tool for retrieving fund documents from S3
- **Data Service**: `data_service` tool with operation parameters for CSV data queries
- **Operations Available**: `get_investors`, `get_investments`, `get_fund_mapping`, `get_redemption_requests`
- **S3-Based**: Reads from S3 document storage and CSV data files
- **Clean Interface**: Simplified two-tool approach for better agent understanding

This dual approach showcases both traditional embedded tools and the new Model Context Protocol (MCP) integration capabilities of AgentCore, providing flexibility in tool deployment and execution patterns.

## Project Foundation

This project is built upon the [Strands AgentCore React](https://github.com/altanalytics/strands-agentcore-react) starter template, enhanced with:
- Custom PE-specific AI agent personalities and prompts
- Comprehensive tool ecosystem for fund data access
- Advanced redemption analysis workflows
- Production-ready AWS infrastructure integration
- Sample data for demonstration purposes


## Agent Personalities

### **PE Manager** (`pe`)
Specialized for redemption processing with:
- Mandatory fund document retrieval for all redemption requests
- S3-first approach for structured data queries
- Contextual rule application from fund documents
- Detailed recommendation generation with supporting evidence

### **MCP PE Manager** (`mcp`)
Same functionality as PE Manager but using MCP Gateway services:
- Two MCP tools: `fund_document_service` and `data_service`
- All data operations through MCP gateway
- Demonstrates Model Context Protocol capabilities

### **Analyst** (`analyst`)
Enhanced with additional capabilities for:
- Comprehensive fund performance analysis
- Knowledge base access to all fund documents
- Statistical analysis and reporting
- Broad fund portfolio insights

## Data Architecture

### **Database Schema**
The system operates on a comprehensive relational database with four core tables containing test PE fund data:

#### **Investments Table** (191K+ records)
- `investment_id`, `fund_id`, `investor_class`, `investor_id`, `call_date`, `investment_amount`
- Tracks individual capital calls and commitments across 30+ funds
- Links investors to specific funds with class-based terms

#### **Investors Table** (8K+ records)  
- `investor_id`, `investor_name`, `estimated_net_worth`, `phone_number`, `email`
- Comprehensive investor profiles with wealth classifications
- Supports investor class eligibility determination

#### **Fund Mapping Table** (90+ fund/class combinations)
- Complete fund metadata including redemption terms, fee structures, and processing parameters
- Links fund documents to specific investor classes with detailed redemption criteria

#### **Redemption Requests Table** (1K+ historical records)
- Complete audit trail of redemption decisions, processing dates, and outcomes
- Tracks approval/rejection reasons and holding period calculations


### **Document Structure**
- **Fund Documents**: S3-stored documents with redemption rules for each fund/investor class combination
- **Investor Class Variants**: ClassA (retail), ClassB (accredited), Institutional-specific terms and restrictions
- **Structured Format**: Consistent document formatting optimized for AI processing and rule extraction

## Deployment Infrastructure

### **AWS Services Used**
- **Amplify**: Frontend hosting and CI/CD
- **Amazon Bedrock**: Access to the latest LLM Models
- **Strands-Agents**: Open source framework for building AI Agents
- **Bedrock AgentCore**: AI agent runtime and orchestration
- **Lambda**: Serverless compute for tools and APIs
- **S3**: Document storage, CSV data storage, and session management
- **Cognito**: User authentication and authorization
- **CloudWatch**: Logging and monitoring
- **SNS**: User notification system

### **Security & Compliance**
- IAM role-based access control
- Encrypted data storage (S3)
- Secure API endpoints with AWS IAM authentication
- Audit trails for all redemption decisions

## Example Workflow

### **Typical Redemption Analysis Process**

1. **Investor Discovery**
   - User: "I need to process a redemption for Susan"
   - System: Returns list of all investors named Susan with IDs and details

2. **Investor Selection & Fund Discovery**
   - User: Selects specific Susan (e.g., "Susan Johnson, ID: CA_1234")
   - System: Queries database and returns list of all funds Susan has invested in

3. **Fund Selection & Document Analysis**
   - User: Selects target fund (e.g., "Strategic Growth Fund 1")
   - System: Automatically retrieves fund document for Susan's investor class
   - System: Displays Susan's specific investments in that fund

4. **Investment Analysis & Redemption Eligibility**
   - User: Selects specific investment to redeem
   - System: Cross-references investment data with fund document rules
   - System: Analyzes holding periods, notice requirements, fees, and restrictions
   - System: Provides detailed eligibility assessment with supporting reasons

5. **Redemption Processing**
   - If eligible: System asks "Would you like to process this redemption request?"
   - If ineligible: System explains specific reasons and requirements not met
   - User: Confirms to initiate redemption or requests alternative analysis

This guided workflow ensures comprehensive analysis while maintaining audit trails and regulatory compliance.

## Contributing

This POC demonstrates the transformative potential of AI in Private Equity operations. The modular architecture supports easy extension for additional fund management use cases and integration with existing PE systems.

For technical questions or enhancement requests, please refer to the individual component documentation in the respective directories.
