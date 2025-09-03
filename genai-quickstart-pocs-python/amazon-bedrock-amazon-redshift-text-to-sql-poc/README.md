# Amazon Bedrock & Amazon Redshift Sales Analyst POC (Text to SQL)
**Authors: Shashi Makkapati, Senthil Kamala Rathinam, Jacob Scheatzle**

## Overview of Solution

This is sample code demonstrating the use of Amazon Bedrock and Generative AI to create an intelligent sales data analyst that uses natural language questions to query relational data stores, specifically Amazon Redshift. This example leverages the complete Northwind sample database with realistic sales scenarios containing customers, orders, and order details.

**Please Note: If you don&#39;t want to build this from scratch, Amazon Redshift now supports GenAI capabilities natively, more information on that can be found [here](https://aws.amazon.com/blogs/aws/amazon-redshift-adds-new-ai-capabilities-to-boost-efficiency-and-productivity/).**

![Sales Analyst Demo](images/demo.gif)

## Goal of this POC
The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to ask natural language questions about sales performance, customer behavior, and business metrics. These questions are automatically transformed into optimized SQL queries against a private Amazon Redshift cluster. This repo is designed to work with automatically provisioned Amazon Redshift clusters and includes complete infrastructure automation, security hardening, and intelligent context retrieval.

The architecture & flow of the POC is as follows:
![POC Architecture & Flow](images/architecture.png 'POC Architecture')


When a user interacts with the POC, the flow is as follows:

1. **Natural Language Query**: The user makes a request through the Streamlit interface, asking a natural language question about sales data in Amazon Redshift (`app.py`)

2. **Query Understanding**: The natural language question is passed to Amazon Bedrock  for intent analysis and query classification (`src/graph/workflow.py` - `understand_query()`)

3. **Context Retrieval**: The system performs semantic search using FAISS vector store to retrieve relevant database schema information and table relationships (`src/graph/workflow.py` - `retrieve_context()`)

4. **Intelligent SQL Generation**: Amazon Bedrock generates optimized SQL queries using the retrieved context, ensuring proper table joins and data type handling (`src/graph/workflow.py` - `generate_sql()`)

5. **Secure Query Execution**: The SQL query is executed against the private Redshift cluster through a secure SSM tunnel via the EC2 bastion host (`src/utils/redshift_connector.py`)

6. **Result Analysis**: The retrieved data is passed back to Amazon Bedrock for intelligent analysis and insight generation (`src/graph/workflow.py` - `analyze_results()`)

7. **Natural Language Response**: The system returns comprehensive insights and explanations to the user through the Streamlit frontend (`app.py`)

# How to use this Repo:

## Prerequisites:

1. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed and configured with access to Amazon Bedrock, EC2, Redshift, and IAM.

2. [Python](https://www.python.org/downloads/) v3.11 or greater. The POC runs on Python.


4. AWS account with permissions to create Redshift clusters, EC2 instances, VPCs, and IAM roles.

5. **Note**: This project uses robust security with private infrastructure and no public endpoints. Ensure you're running the application on your native operating system (Windows/macOS/Linux) rather than WSL2, as the SSM tunnel functionality works more reliably on native systems.

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
    git clone https://github.com/aws-samples/amazon-bedrock-amazon-redshift-text-to-sql-poc.git
    
    ```
    
    The file structure of this POC is organized as follows:
    
    * `requirements.txt` - All dependencies needed for the application
    * `app.py` - Main Streamlit application with UI components
    * `src/bedrock/bedrock_helper.py` - Amazon Bedrock client wrapper
    * `src/graph/workflow.py` - LangGraph-inspired AI workflow orchestration
    * `src/vector_store/faiss_manager.py` - FAISS vector store for semantic search
    * `src/utils/redshift_cluster_manager.py` - Automatic AWS infrastructure provisioning
    * `src/utils/redshift_connector.py` - Secure database connection management
    * `src/utils/northwind_bootstrapper.py` - Automatic sample data loading
    * `src/config/settings.py` - Application configuration
    * `cleanup.py` - AWS resource cleanup script

3. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```bash
    cd amazon-bedrock-amazon-redshift-text-to-sql-poc
    ```

4. Configure the Python virtual environment, activate it:
    ```bash
    python -m venv .venv
    source .venv/bin/activate  # On Windows: .venv\Scripts\activate
    ```

5. Install project dependencies. This automatically detects your platform and installs the right dependencies:

    Amazon Linux 2023: Installs SQLite libraries + FAISS fixes

    Ubuntu: Installs build tools + dependencies
    
    Mac/Windows: Uses standard pip install

    ```bash
    python3 setup.py
    ```

6. Create a `.env` file in the root folder. Replace the placeholders with your actual AWS credentials and save the file:

    ```bash
    # AWS Configuration (Required)
    AWS_REGION=us-east-1
    AWS_ACCESS_KEY_ID=your_access_key_here
    AWS_SECRET_ACCESS_KEY=your_secret_key_here

    # Redshift Configuration (Auto-managed - only override if needed)
    REDSHIFT_HOST=localhost
    REDSHIFT_PORT=5439
    REDSHIFT_DATABASE=sales_analyst
    REDSHIFT_USER=admin
    REDSHIFT_PASSWORD=Awsuser123$
    ```

7. If you are running this POC application from an Amazon EC2 instance, follow the below steps to configure the Security Group. This allows you to view the streamlit application from your local laptop. 

    - Go to EC2 Console → Security Groups
    - Edit your EC2's security group
    - Add inbound rule: Port 8501, Source: Your IP (or 0.0.0.0/0 for public access)

8. Start the application from your terminal:
    ```bash
    streamlit run app.py
    ```

9. **Automatic Setup**: On first run, the application will automatically:
   - Create AWS infrastructure (Redshift cluster, EC2 bastion, VPC, security groups)
   - Establish secure SSM tunnel connection
   - Load the complete Northwind sales dataset
   - Build vector store with schema metadata
   - This process takes approximately 5-10 minutes

10. **Start Analyzing**: Once setup is complete, you can ask natural language questions like:
   - "What are the top 5 customers by order value?"
   - "Show me monthly sales trends for 1997"
   - "Which products have the highest profit margins?"
   - "What countries generate the most revenue?"


## Cleanup

To avoid ongoing AWS charges, run the cleanup script when finished:

```bash
python cleanup.py
```

This will automatically remove all created AWS resources including the Redshift cluster, EC2 instance, and associated infrastructure.

## Architecture Highlights

- **Zero Configuration**: Complete infrastructure automation
- **Context-Aware AI**: Semantic search for intelligent SQL generation
- **Multi-Step AI Pipeline**: Query understanding → Context retrieval → SQL generation → Analysis
- **Enterprise Security**: Private networking with secure tunnels
- **Extensible Design**: Modular architecture for easy customization


### Built with:

- Amazon Bedrock: AI/ML models for natural language processing
- Amazon Redshift: Private data warehouse for fast analytics
- EC2 + SSM: Bastion host with Session Manager tunnel
- FAISS: Vector database for semantic search
- Streamlit: Web interface
- LangGraph: Workflow orchestration

### Security Architecture:
- Your Computer → SSM Tunnel → EC2 Bastion → Private Redshift Cluster
(localhost:5439)    (AWS Session Manager)    (No public access)


## Troubleshooting
### Common Issues
- **"Permission denied" errors**:
    - Verify your IAM user has all required policies attached
    - Check your Access Key ID and Secret Access Key are correct

- **"Setup fails" or timeouts**:
    - Run python cleanup.py first
    - Try a different AWS region in .env (us-west-2, eu-west-1)
    - Ensure you have sufficient AWS service limits
    - Wait for bastion host SSM agent to come online (can take 2-3 minutes)

- **"Credentials not found"**:

    - Make sure you copied .env.example to .env: cp .env.example .env
    - Make sure .env file is in the same directory as app.py
    - Verify no extra spaces in your credential values
    - Check that you saved the .env file after editing

- **"App won't start**:
    - Ensure Python 3.8+ is installed: python --version
    - Install requirements: pip install -r requirements.txt
    - Try: python -m streamlit run app.py

- **""Connection failed" or "SSM tunnel failed"**:
    - The app uses a private Redshift cluster with bastion host for security
    - Connection goes through localhost:5439 via SSM tunnel
    - If connection fails, wait 2-3 minutes for SSM agent to initialize

- **"Session Manager plugin issues**:

    - The setup script automatically installs the Session Manager plugin
    - If installation fails, the app will show manual installation instructions
    - Plugin is required for secure SSM tunneling to private Redshift cluster

### Getting Help
- Check AWS CloudFormation console for detailed error messages
- Review AWS costs in Billing console
- Ensure your AWS account has no service limits blocking resource creation


## How-To Guide
For detailed usage instructions and advanced configuration, visit [HOWTO.md](HOWTO.md)
