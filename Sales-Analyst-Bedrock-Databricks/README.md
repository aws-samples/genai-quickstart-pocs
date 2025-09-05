# Amazon Bedrock & Databricks Sales Analyst POC (Text to SQL)

## Overview of Solution

This is sample code demonstrating the use of Amazon Bedrock and Generative AI to create an intelligent sales data analyst that uses natural language questions to query relational data stores, specifically Databricks. This example leverages the complete Northwind sample database with realistic sales scenarios containing customers, orders, and order details.

![Sales Analyst Demo](images/demo.gif)

## Goal of this POC
The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to ask natural language questions about sales performance, customer behavior, and business metrics. These questions are automatically transformed into optimized SQL queries against a Databricks workspace. This repo includes intelligent context retrieval using FAISS vector store, LangGraph workflow orchestration, and complete Databricks automation.

The architecture & flow of the POC is as follows:
![POC Architecture & Flow](images/architecture.png 'POC Architecture')

When a user interacts with the POC, the flow is as follows:

1. **Natural Language Query**: The user makes a request through the Streamlit interface, asking a natural language question about sales data in Databricks (`app.py`)

2. **Query Understanding**: The natural language question is passed to Amazon Bedrock for intent analysis and query classification (`src/graph/workflow.py`)

3. **Context Retrieval**: The system performs semantic search using FAISS vector store to retrieve relevant database schema information and table relationships (`src/vector_store/faiss_manager.py`)

4. **Intelligent SQL Generation**: Amazon Bedrock generates optimized SQL queries using the retrieved context, ensuring proper table joins and data type handling (`src/graph/workflow.py`)

5. **Secure Query Execution**: The SQL query is executed against the Databricks workspace through secure REST API connection (`src/utils/databricks_rest_connector.py`)

6. **Result Analysis**: The retrieved data is passed back to Amazon Bedrock for intelligent analysis and insight generation (`src/graph/workflow.py`)

7. **Natural Language Response**: The system returns comprehensive insights and explanations to the user through the Streamlit frontend (`app.py`)

# How to use this Repo:

## Prerequisites:

1. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed and configured with access to Amazon Bedrock.

2. [Python](https://www.python.org/downloads/) v3.8 or greater. The POC runs on Python.

3. Databricks account with appropriate permissions to create workspaces and warehouses.

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
    git clone https://github.com/AWS-Samples-GenAI-FSI/Sales-Analyst-Bedrock-Databricks.git
    
    ```
    
    The file structure of this POC is organized as follows:
    
    * `requirements.txt` - All dependencies needed for the application
    * `app.py` - Main Streamlit application with UI components
    * `src/bedrock/bedrock_helper.py` - Amazon Bedrock client wrapper
    * `src/graph/workflow.py` - LangGraph workflow orchestration
    * `src/vector_store/faiss_manager.py` - FAISS vector store for semantic search
    * `src/utils/databricks_rest_connector.py` - Databricks REST API connection management
    * `src/utils/github_data_loader.py` - Automated data download from GitHub
    * `src/utils/northwind_bootstrapper.py` - Automatic sample data loading
    * `src/utils/databricks_workspace_manager.py` - Databricks workspace automation
    * `src/monitoring/langfuse_monitor.py` - LangFuse monitoring integration

3. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```bash
    cd Sales-Analyst-Bedrock-Databricks
    ```

4. Configure the Python virtual environment, activate it:
    ```bash
    python -m venv .venv
    source .venv/bin/activate  # On Windows: .venv\\Scripts\\activate
    ```

5. Install project dependencies:
    ```bash
    pip install -r requirements.txt
    ```

6. **Get your Databricks credentials:**

    **Workspace URL:**
    - Copy the URL from your browser when logged into Databricks
    - Format: `https://dbc-xxxxxxxx-xxxx.cloud.databricks.com`
    
    **Personal Access Token:**
    - In Databricks, click your profile icon (top right)
    - Go to "User Settings"
    - Click "Developer" → "Access Tokens"
    - Click "Generate New Token"
    - Give it a name like "Sales Analyst App"
    - Set expiration (or leave blank for no expiration)
    - Click "Generate" and **copy the token immediately** (you can't see it again!)

7. Configure your credentials by editing the `.env` file:

    ```bash
    # AWS Configuration (Required)
    AWS_REGION=us-east-1
    AWS_ACCESS_KEY_ID=your_access_key_here
    AWS_SECRET_ACCESS_KEY=your_secret_key_here

    # Databricks Configuration (Required)
    DATABRICKS_HOST=https://dbc-xxxxxxxx-xxxx.cloud.databricks.com
    DATABRICKS_TOKEN=your_databricks_token_here
    DATABRICKS_CLUSTER_ID=auto_created  # Optional: see step 8
    DATABRICKS_CATALOG=workspace
    DATABRICKS_SCHEMA=northwind
    ```

8. **Get your Databricks warehouse ID (Optional):**
    - Go to "SQL Warehouses" in your Databricks workspace
    - Click on "Serverless Starter Warehouse" (default warehouse)
    - Copy the warehouse ID from the connection details tab
    - Update `DATABRICKS_CLUSTER_ID` in `.env` with this ID
    - Or leave as `auto_created` - the app will find it automatically

9. Start the application from your terminal:
    ```bash
    streamlit run app.py
    ```

10. **Automatic Setup**: On first run, the application will automatically:
   - Create Databricks workspace (if needed)
   - Launch serverless SQL warehouse with optimized configuration
   - Download complete Northwind dataset from GitHub (91 customers, 830 orders, 2155 order details)
   - Load data with proper relationships and foreign keys
   - Initialize AI components and vector store
   - This process takes approximately 5-8 minutes

11. **Start Analyzing**: Once setup is complete, you can ask natural language questions like:
   - "What are the top 5 customers by order value?"
   - "Which customers haven't placed orders recently?"
   - "Show me customer distribution by country"
   - "What's the average order value by customer?"
   - "Which products are most popular?"
   - "Show me sales trends by month"

## Architecture Highlights

- **Complete Databricks Automation**: Automatically creates workspace, serverless warehouse, and schema
- **Context-Aware AI**: Semantic search for intelligent SQL generation using FAISS
- **Multi-Step AI Pipeline**: Query understanding → Context retrieval → SQL generation → Analysis
- **Workflow Orchestration**: LangGraph-powered structured analysis workflow
- **GitHub Data Integration**: Automatically downloads complete Northwind dataset from GitHub
- **Zero Configuration**: Just add AWS credentials and run!

### Built with:

- Amazon Bedrock: AI/ML models for natural language processing
- Databricks: Unified analytics platform with Delta Lake
- FAISS: Vector database for semantic search
- Streamlit: Web interface
- LangGraph: Workflow orchestration
- LangFuse: AI monitoring and observability

### Database Structure
After setup, you'll have access to:
- **customers** (91 records) - Customer information and demographics
- **orders** (830 records) - Order headers with dates and shipping
- **order_details** (2,155 records) - Individual line items with quantities and prices
- **products** (77 records) - Product catalog with categories and pricing
- **categories** (8 records) - Product categories and descriptions
- **suppliers** (29 records) - Supplier information and contacts
- **employees** (9 records) - Employee data and territories
- **shippers** (3 records) - Shipping company information

## AI-Powered Workflow
The application uses **LangGraph** and **Amazon Bedrock** to create an intelligent analysis workflow:

1. 🧠 **Understand Query**: AI analyzes your natural language question
2. 🔍 **Retrieve Context**: Finds relevant table/column metadata using FAISS vector search
3. 💻 **Generate SQL**: Creates optimized SQL query using context
4. ⚡ **Execute Query**: Runs SQL against your Databricks workspace
5. 📊 **Analyze Results**: Provides business insights and explanations

### Key Features
- **Natural Language to SQL**: No SQL knowledge required
- **Intelligent Context**: Understands your database schema automatically
- **Error Recovery**: Handles and recovers from query errors
- **Performance Monitoring**: Tracks AI interactions with LangFuse
- **Delta Lake Integration**: ACID transactions and time travel capabilities

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
    - Verify your Databricks credentials are correct
    - Check your workspace URL format
    - Ensure your token has appropriate permissions
    - Test connection: `curl -H "Authorization: Bearer $DATABRICKS_TOKEN" "$DATABRICKS_HOST/api/2.0/clusters/list"`

- **"Setup fails" or timeouts**:
    - Check your Databricks workspace is accessible
    - Verify network connectivity to Databricks
    - Ensure sufficient compute resources
    - Check GitHub connectivity: `curl -I https://raw.githubusercontent.com/jpwhite3/northwind-SQLite3/master/csv/customers.csv`

- **"Credentials not found"**:
    - Make sure you updated the `.env` file with your actual credentials
    - Make sure `.env` file is in the same directory as `app.py`
    - Verify no extra spaces in your credential values
    - Check that you saved the `.env` file after editing

- **"App won't start"**:
    - Ensure Python 3.8+ is installed: `python --version`
    - Install requirements: `pip install -r requirements.txt`
    - Try: `python -m streamlit run app.py`

- **"AWS Bedrock access denied"**:
    - Verify your AWS credentials are configured
    - Check your IAM permissions for Bedrock access
    - Ensure you're in a supported AWS region

- **"SQL Generation Problems"**:
    - Ensure schema information is loaded in vector store
    - Check that table names match Databricks catalog structure
    - Verify column names and data types

### Getting Help
- Check Databricks query history for detailed error messages
- Review AWS CloudWatch logs for Bedrock API calls
- Enable debug logging: `logging.basicConfig(level=logging.DEBUG)`
- Ensure your Databricks workspace has no usage limits

## Cost Management

### Databricks Costs
- **Serverless Warehouse**: ~$0.70/hour when active
- **Auto-stop**: Configurable idle timeout (default: 10 minutes)
- **Community Edition**: Free tier available

### AWS Costs
- **Bedrock API**: Pay-per-request pricing
- **Typical Usage**: $1-5/day for development

### Cost Optimization Tips
- Use Community Edition for learning/testing
- Configure auto-stop for warehouses
- Monitor Bedrock API usage
- Use smaller warehouse sizes for development

## Cleanup

**To avoid ongoing costs, clean up demo resources when done:**

```bash
python3 cleanup.py
```

**This will remove:**
- All Northwind tables and schema
- Custom warehouse (if created)
- Local cache files
- Preserves default "Serverless Starter Warehouse"

## How-To Guide
For detailed usage instructions and advanced configuration, visit the application's help section within the Streamlit interface.