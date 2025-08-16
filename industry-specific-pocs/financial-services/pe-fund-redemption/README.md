## **Introduction**

This POC demonstrates how to enhance the [Strands AgentCore React starter template](https://github.com/altanalytics/strands-agentcore-react) with custom tools and capabilities for a specific finance use case. 

**Key Enhancements Demonstrated:**
- Custom tools in [Strands-Agents](https://strandsagents.com/latest/)
- AgentCore Gateway integration with MCP (Model Context Protocol)
- Knowledge base integration for document analysis
- Dual tool architecture (local + Lambda-based tools)

**Note:** This is a complete implementation requiring Aurora database and S3 document storage (sample data provided in `/data` folder).

# Private Equity Fund Redemption AI Assistant

This is a proof-of-concept agentic AI system that revolutionizes Private Equity fund redemption analysis by automating the complex process of investment eligibility verification and redemption request processing.

**🚀 Live Demo**: [https://pe.tonytrev.people.aws.dev/](https://pe.tonytrev.people.aws.dev/)  
*Note: For security, only Amazon employees can create accounts*

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
- **Aurora Database**: Stores structured fund, investment, and investor data
- **S3 Document Storage**: Houses fund documents with redemption rules and criteria
- **Lambda Functions**: Serverless compute for database queries and document retrieval
- **MCP Gateway**: Model Context Protocol integration for external tool connectivity

### Tool Ecosystem

#### **Local Agent Tools**
Embedded directly in the AI agent for fast execution:
- `pull_fund_document`: Retrieves fund documents from S3 storage
- `query_database`: Accesses Aurora database for investment and investor data
- `get_investments`: Filters and searches investment records
- `get_investors`: Manages investor information and classifications
- `get_redemption_requests`: Tracks redemption request history

#### **MCP-Based Tools**
Deployed as Lambda functions and accessed via AgentCore Gateway to demonstrate new MCP capabilities:
- **Database Query Service**: Serverless SQL query
- **Fund Document Service**: Document retrieval and processing from S3 with error handling
- **Advanced Analytics**: Complex redemption rule evaluation and cross-validation

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
- Database-first approach for structured data queries
- Contextual rule application from fund documents
- Detailed recommendation generation with supporting evidence

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
- **Aurora**: Managed database for structured data
- **S3**: Document storage and session management
- **Cognito**: User authentication and authorization
- **CloudWatch**: Logging and monitoring
- **SNS**: User notification system

### **Security & Compliance**
- IAM role-based access control
- Encrypted data storage (S3, Aurora)
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
