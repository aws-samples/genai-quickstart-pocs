# Amazon Bedrock & Amazon DynamoDB Sales Analyst POC (Text to NoSQL)
**Authors: Shashi Makkapati, Senthil Kamala Rathinam, Jacob Scheatzle**

## Overview of Solution

This is sample code demonstrating the use of Amazon Bedrock and Generative AI to create an intelligent sales data analyst that uses natural language questions to query NoSQL data stores, specifically Amazon DynamoDB. This example leverages the complete Northwind sample database with realistic sales scenarios containing customers, orders, and order details, optimized for DynamoDB's document-based architecture.

**Please Note: This POC showcases how to build intelligent query interfaces for DynamoDB using natural language processing and AI-powered query generation with PartiQL support.**

![Sales Analyst Demo](images/demo.gif)

## Goal of this POC
The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to ask natural language questions about sales performance, customer behavior, and business metrics. These questions are automatically transformed into optimized PartiQL queries and native DynamoDB operations against DynamoDB tables. This repo includes smart table routing, denormalized data optimization, and intelligent context retrieval for NoSQL databases.

The architecture & flow of the POC is as follows:
![POC Architecture & Flow](images/architecture.png 'POC Architecture')

When a user interacts with the POC, the flow is as follows:

1. **Natural Language Query**: The user makes a request through the Streamlit interface, asking a natural language question about sales data in DynamoDB (`app.py`)

2. **Smart Query Routing**: The natural language question is analyzed by an intelligent router that determines the optimal DynamoDB table and query strategy (`src/models/smart_table_router.py`)

3. **Context Retrieval**: The system performs semantic search using FAISS vector store to retrieve relevant database schema information and table structures (`src/vector_store/faiss_manager.py`)

4. **Intelligent Query Generation**: The system generates optimized PartiQL queries or native DynamoDB operations based on the query type and table structure (`src/graph/simple_workflow.py`)

5. **DynamoDB Query Execution**: The query is executed against DynamoDB tables using PartiQL or native operations for optimal performance (`src/utils/dynamodb_connector.py`)

6. **Result Processing**: Retrieved data is processed and aggregated based on query requirements, with support for complex analytical operations (`src/graph/simple_workflow.py`) 

7. **Intelligent Analysis**: The processed results are passed to Amazon Bedrock for comprehensive business analysis and insight generation (`src/graph/simple_workflow.py`)

8. **Natural Language Response**: The system returns detailed insights, performance metrics, and business recommendations through the Streamlit frontend (`app.py`)

# How to use this Repo:

## Prerequisites:

1. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed and configured with access to Amazon Bedrock, DynamoDB, and IAM.

2. [Python](https://www.python.org/downloads/) v3.8 or greater. The POC runs on Python.

3. AWS account with permissions to create DynamoDB tables, IAM roles, and access Amazon Bedrock.

4. **Note**: This project uses DynamoDB which is serverless and requires no infrastructure provisioning. The application automatically creates and manages DynamoDB tables as needed.

## Steps

1. Install Git (Optional step):
    ```bash  
    # Amazon Linux / CentOS / RHEL:
    sudo yum install -y git
    # Ubuntu / Debian:
    sudo apt-get install -y git
    # Mac/Windows: Git is usually pre-installed
    ```

2. Clone the repository to your local machine.

    ```bash
    git clone https://github.com/aws-samples/amazon-bedrock-amazon-dynamodb-text-to-nosql-poc.git
    
    ```
    
    The file structure of this POC is organized as follows:
    
    * `requirements.txt` - All dependencies needed for the application
    * `app.py` - Main Streamlit application with UI components
    * `src/bedrock/bedrock_helper.py` - Amazon Bedrock client wrapper
    * `src/graph/simple_workflow.py` - Streamlined AI workflow for DynamoDB operations
    * `src/models/smart_table_router.py` - Intelligent query routing for optimal table selection
    * `src/vector_store/faiss_manager.py` - FAISS vector store for semantic search
    * `src/utils/dynamodb_connector.py` - DynamoDB connection and query execution
    * `src/utils/dynamodb_bootstrapper.py` - Automatic DynamoDB table creation
    * `src/utils/denormalized_bootstrapper.py` - Sales transaction data optimization
    * `src/utils/northwind_denormalizer.py` - Northwind data transformation for NoSQL
    * `src/utils/github_data_loader.py` - Sample data loading from GitHub
    * `cleanup.py` - DynamoDB table cleanup script

3. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```bash
    cd amazon-bedrock-amazon-dynamodb-text-to-nosql-poc
    ```

4. Configure the Python virtual environment, activate it:
    ```bash
    python -m venv .venv
    source .venv/bin/activate  # On Windows: .venv\Scripts\activate
    ```

5. Install project dependencies:
    ```bash
    pip install -r requirements.txt
    ```

6. Create a .env file in the POC root folder and configure it with your AWS credentials.:

    ```bash
    # AWS Configuration (Required)
    AWS_REGION=us-east-1
    AWS_ACCESS_KEY_ID=your_access_key_here
    AWS_SECRET_ACCESS_KEY=your_secret_key_here
    ```

8. If you are running this POC application from an Amazon EC2 instance, follow the below steps to configure the Security Group. This allows you to view the streamlit application from your local laptop. 

    - Go to EC2 Console → Security Groups
    - Edit your EC2's security group
    - Add inbound rule: Port 8501, Source: Your IP (or 0.0.0.0/0 for public access)

9. Start the application from your terminal:
    ```bash
    streamlit run app.py
    ```

10. **Automatic Setup**: On first run, the application will automatically:
    - Create DynamoDB tables (customers, products, orders, order_details)
    - Load the complete Northwind sales dataset
    - Create optimized denormalized sales_transactions table
    - Build vector store with schema metadata
    - This process takes approximately 2-3 minutes

11. **Start Analyzing**: Once setup is complete, you can ask natural language questions like:
    - "What are the top 5 customers by order value?"
    - "Show me customers from Germany"
    - "Which products generate the most revenue?"
    - "Which suppliers provide the most products?"
    - "Which employees process the most orders?"
    - "Show me a customer with customerid = 'LAMAI'"

## Cleanup

To remove all created DynamoDB tables and clean up resources:

```bash
python cleanup.py
```

This will automatically remove all created DynamoDB tables and associated data.

## Architecture Highlights

- **Serverless Architecture**: No infrastructure to manage with DynamoDB
- **Smart Query Routing**: Automatically selects optimal tables and query strategies
- **Multi-Table Support**: Handles both normalized and denormalized data structures
- **PartiQL Integration**: Uses SQL-like syntax for DynamoDB queries
- **Context-Aware AI**: Semantic search for intelligent query generation

### Built with:

- **Amazon Bedrock**: AI/ML models for natural language processing and analysis
- **Amazon DynamoDB**: Serverless NoSQL database for fast, scalable data access
- **PartiQL**: SQL-compatible query language for DynamoDB
- **FAISS**: Vector database for semantic search and context retrieval
- **Streamlit**: Interactive web interface
- **Python**: Core application logic and AWS SDK integration

### Data Architecture:
- **Normalized Tables**: `northwind_customers`, `northwind_products`, `northwind_orders`, `northwind_order_details`
- **Denormalized Table**: `sales_transactions` (optimized for analytics)
- **Smart Routing**: Automatically selects best table based on query type
- **Dual Query Support**: PartiQL for complex queries, native operations for simple lookups

## Troubleshooting

### Common Issues

- **"Permission denied" errors**:
    - Verify your IAM user has DynamoDB and Bedrock permissions
    - Check your Access Key ID and Secret Access Key are correct
    - Ensure your AWS region supports Amazon Bedrock

- **"Setup fails" or timeouts**:
    - Check your internet connection for GitHub data loading
    - Verify DynamoDB service limits in your AWS account
    - Try a different AWS region in .env (us-west-2, eu-west-1)

- **"Credentials not found"**:
    - Make sure you copied .env.example to .env: `cp .env.example .env`
    - Make sure .env file is in the same directory as app.py
    - Verify no extra spaces in your credential values
    - Check that you saved the .env file after editing

- **"App won't start"**:
    - Ensure Python 3.8+ is installed: `python --version`
    - Install requirements: `pip install -r requirements.txt`
    - Try: `python -m streamlit run app.py`

- **"DynamoDB connection failed"**:
    - Verify your AWS credentials have DynamoDB access
    - Check if your region supports DynamoDB (most regions do)
    - Ensure no firewall blocking AWS API calls

- **"Bedrock access denied"**:
    - Verify Amazon Bedrock is available in your region
    - Check if you have enabled model access in Bedrock console
    - Ensure your IAM user has bedrock:InvokeModel permissions

- **"Query returns no results"**:
    - Check if data loading completed successfully
    - Verify table names in DynamoDB console
    - Try simpler queries first (e.g., "show me customers")

### Getting Help
- Check DynamoDB console for table status and item counts
- Review AWS costs in Billing console (DynamoDB is pay-per-use)
- Verify Bedrock model access in the Bedrock console
- Check CloudWatch logs for detailed error messages


This POC demonstrates how to build intelligent, AI-powered interfaces for NoSQL databases using Amazon Bedrock and DynamoDB, providing natural language access to complex business data with enterprise-grade performance and security.
