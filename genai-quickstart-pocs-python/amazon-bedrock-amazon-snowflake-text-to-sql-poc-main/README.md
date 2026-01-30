# Amazon Bedrock & Snowflake Sales Analyst POC (Text to SQL)
**Authors: Shashi Makkapati, Senthil Kamala Rathinam, Jacob Scheatzle**

## Overview of Solution

This is sample code demonstrating the use of Amazon Bedrock and Generative AI to create an intelligent sales data analyst that uses natural language questions to query relational data stores, specifically Snowflake. This example leverages the complete Northwind sample database with realistic sales scenarios containing customers, orders, and order details.

![Sales Analyst Demo](images/demo.gif)

## Goal of this POC
The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to ask natural language questions about sales performance, customer behavior, and business metrics. These questions are automatically transformed into optimized SQL queries against a Snowflake database. This repo includes intelligent context retrieval using FAISS vector store, LangGraph workflow orchestration, and comprehensive monitoring capabilities.

The architecture & flow of the POC is as follows:
![POC Architecture & Flow](images/architecture.png 'POC Architecture')

When a user interacts with the POC, the flow is as follows:

1. **Natural Language Query**: The user makes a request through the Streamlit interface, asking a natural language question about sales data in Snowflake (`app.py`)

2. **Query Understanding**: The natural language question is passed to Amazon Bedrock for intent analysis and query classification (`src/graph/workflow.py`)

3. **Context Retrieval**: The system performs semantic search using FAISS vector store to retrieve relevant database schema information and table relationships (`src/vector_store/faiss_manager.py`)

4. **Intelligent SQL Generation**: Amazon Bedrock generates optimized SQL queries using the retrieved context, ensuring proper table joins and data type handling (`src/graph/workflow.py`)

5. **Secure Query Execution**: The SQL query is executed against the Snowflake database through secure connection (`src/utils/snowflake_connector.py`)

6. **Result Analysis**: The retrieved data is passed back to Amazon Bedrock for intelligent analysis and insight generation (`src/graph/workflow.py`)

7. **Natural Language Response**: The system returns comprehensive insights and explanations to the user through the Streamlit frontend (`app.py`)

# How to use this Repo:

## Prerequisites:

1. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed and configured with access to Amazon Bedrock.

2. [Python](https://www.python.org/downloads/) v3.11 or greater. The POC runs on Python.

3. Snowflake account with appropriate permissions to create databases and tables.

4. AWS account with permissions to access Amazon Bedrock services.

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
    git clone https://github.com/AWS-Samples-GenAI-FSI/Sales-Analyst-Bedrock-Snowflake.git
    
    ```
    
    The file structure of this POC is organized as follows:
    
    * `requirements.txt` - All dependencies needed for the application
    * `app.py` - Main Streamlit application with UI components
    * `setup.py` - Setup script for dependencies
    * `src/bedrock/bedrock_helper.py` - Amazon Bedrock client wrapper
    * `src/graph/workflow.py` - LangGraph workflow orchestration
    * `src/vector_store/faiss_manager.py` - FAISS vector store for semantic search
    * `src/utils/snowflake_connector.py` - Snowflake database connection management
    * `src/utils/helpers.py` - Utility functions
    * `src/utils/setup_utils.py` - Setup utilities
    * `src/prompts/prompt_template.py` - Prompt management
    * `src/prompts/prompts.yaml` - Structured prompts
    * `src/monitoring/langfuse_monitor.py` - LangFuse monitoring integration

3. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```bash
    cd Sales-Analyst-Bedrock-Snowflake
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

6. Configure your credentials by editing the `.env` file and replacing the dummy values with your actual credentials:

    ```bash
    # AWS Configuration (Required)
    AWS_REGION=us-east-1
    AWS_ACCESS_KEY_ID=your_access_key_here
    AWS_SECRET_ACCESS_KEY=your_secret_key_here

    # Snowflake Configuration (Required)
    SNOWFLAKE_USER=your_username
    SNOWFLAKE_PASSWORD=your_password
    SNOWFLAKE_ACCOUNT=your_account_identifier
    SNOWFLAKE_WAREHOUSE=your_warehouse
    SNOWFLAKE_ROLE=your_role
    ```

7. Start the application from your terminal:
    ```bash
    streamlit run app.py
    ```

8. **Automatic Setup**: On first run, the application will automatically:
   - Connect to your Snowflake account
   - Check if Northwind sample database exists
   - Download Northwind sample data if needed
   - Create `SALES_ANALYST` database and `NORTHWIND` schema
   - Load complete sample dataset (8 tables with sales data)
   - Build vector store with schema metadata
   - This process takes approximately 2-3 minutes

9. **Start Analyzing**: Once setup is complete, you can ask natural language questions like:
   - "What are the top 5 customers by order value?"
   - "Show me the schema of the CUSTOMERS table"
   - "Count the number of orders by country"
   - "What's the distribution of order priorities?"
   - "What's the average order value by customer?"
   - "Which products are most popular?"

## Architecture Highlights

- **Zero Configuration**: Automatic database setup and sample data loading
- **Context-Aware AI**: Semantic search for intelligent SQL generation using FAISS
- **Multi-Step AI Pipeline**: Query understanding → Context retrieval → SQL generation → Analysis
- **Workflow Orchestration**: LangGraph-powered structured analysis workflow
- **Performance Monitoring**: LangFuse integration for AI interaction tracking
- **Extensible Design**: Modular architecture for easy customization

### Built with:

- Amazon Bedrock: AI/ML models for natural language processing
- Snowflake: Cloud data warehouse for fast analytics
- FAISS: Vector database for semantic search
- Streamlit: Web interface
- LangGraph: Workflow orchestration
- LangFuse: AI monitoring and observability

### Database Structure
After setup, you'll have access to:
- **CUSTOMERS** - Customer information
- **ORDERS** - Order headers
- **ORDER_DETAILS** - Order line items
- **PRODUCTS** - Product catalog
- **CATEGORIES** - Product categories
- **SUPPLIERS** - Supplier information
- **EMPLOYEES** - Employee data
- **SHIPPERS** - Shipping companies

## AI-Powered Workflow
The application uses **LangGraph** and **Amazon Bedrock** to create an intelligent analysis workflow:

1. 🧠 **Understand Query**: AI analyzes your natural language question
2. 🔍 **Retrieve Context**: Finds relevant table/column metadata using FAISS vector search
3. 💻 **Generate SQL**: Creates optimized SQL query using context
4. ⚡ **Execute Query**: Runs SQL against your Snowflake database
5. 📊 **Analyze Results**: Provides business insights and explanations

### Key Features
- **Natural Language to SQL**: No SQL knowledge required
- **Intelligent Context**: Understands your database schema automatically
- **Error Recovery**: Handles and recovers from query errors
- **Performance Monitoring**: Tracks AI interactions with LangFuse
- **Persistent Caching**: Speeds up repeated queries

## Monitoring (Optional)

**LangFuse Integration** provides:
- 📊 AI interaction tracking
- 🔄 Workflow step monitoring  
- 🚨 Error logging and analysis
- ⚡ Performance metrics

To enable, update your credentials in the connector file or set environment variables.

## Troubleshooting
### Common Issues
- **"Connection failed" errors**:
    - Verify your Snowflake credentials are correct
    - Check your account identifier format
    - Ensure your user has appropriate permissions
    - If still connecting to old account, clear cached environment variables:
      ```bash
      unset SNOWFLAKE_ACCOUNT SNOWFLAKE_USER SNOWFLAKE_PASSWORD
      ```
      Then restart the app

- **"Setup fails" or timeouts**:
    - Check your Snowflake warehouse is running
    - Verify network connectivity to Snowflake
    - Ensure sufficient compute resources

- **"Credentials not found"**:
    - Make sure you updated the `.env` file with your actual credentials
    - Make sure `.env` file is in the same directory as `app.py`
    - Verify no extra spaces in your credential values
    - Check that you saved the `.env` file after editing

- **"App won't start"**:
    - Ensure Python 3.11+ is installed: `python --version`
    - Install requirements: `pip install -r requirements.txt`
    - Try: `python -m streamlit run app.py`

- **"AWS Bedrock access denied"**:
    - Verify your AWS credentials are configured
    - Check your IAM permissions for Bedrock access
    - Ensure you're in a supported AWS region

### Getting Help
- Check Snowflake query history for detailed error messages
- Review AWS CloudWatch logs for Bedrock API calls
- Ensure your Snowflake account has no usage limits blocking queries

## How-To Guide
For detailed usage instructions and advanced configuration, visit the application's help section within the Streamlit interface.
