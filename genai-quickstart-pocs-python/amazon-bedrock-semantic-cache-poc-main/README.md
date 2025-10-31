# Amazon Bedrock Semantic Cache POC

## Overview of Solution

This project demonstrates a Retrieval-Augmented Generation (RAG) system using Amazon Bedrock for knowledge retrieval and OpenSearch for semantic caching. It provides a Streamlit-based user interface for asking questions about data stored in Amazon Knowledge Bases.

![A gif of a screen recording show casing the Amazon Bedrock Semantic Cache POC functionality](images/demo.gif)


## Goal of this POC
The primary goal of this repository is to showcase an efficient and scalable question-answering system that combines the power of Large Language Models (LLMs) with a knowledge base and semantic caching.
      The approach aims to:
      1. Provide fast and accurate answers to user queries
      2. Reduce the load on the LLM and knowledge base by utilizing a semantic cache
      3. Reduce the cost of the system by limiting calls to the LLM
      4. Demonstrate the integration of Amazon Bedrock and OpenSearch for semantic caching purposes

The architecture & flow of the POC is as follows:
![POC Architecture & Flow](images/architecture.png 'POC Architecture')


When a user interacts with the POC, the flow is as follows:

1. Load documents and crawl websites to add data into knowledge base

1. User submits a question through the Streamlit UI

1. The system checks the semantic cache (OpenSearch) for similar previous queries

1. If a cache hit occurs, the stored answer is returned immediately

1. If no cache hit, the system queries the Amazon Bedrock Knowledge Base for relevant context

1. The retrieved context and user question are sent to an LLM (Claude 3) for answer generation

1. The new question-answer pair is stored in the semantic cache

1. The answer is displayed to the user in the Streamlit interface




# How to use this Repo:

## Prerequisites:

1. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed and configured with access to Amazon Bedrock.

1. [Python](https://www.python.org/downloads/) v3.11 or greater. The POC runs on python. 


1. A Amazon Bedrock Knowledge Base with Amazon OpenSearch as the Vector Store. Instructions can be found [here](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-create.html).


## Steps
1. Clone the repository to your local machine.

    ```
    git clone https://github.com/aws-samples/genai-quickstart-pocs.git
    ```
    
    The file structure of this POC is broken into these files
    
    * `requirements.txt` - all the requirements needed to get the sample application up and running.
    * `app.py` - The streamlit frontend
    
    
    * `knowledge_base.py` - Functions for interacting with Amazon Bedrock Knowledge Base
    
    * `semantic_cache.py` - Functions for semantic caching using OpenSearch
    
    * `utils.py` - Utility functions and shared configurations
    
    

1. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```zsh
    cd genai-quickstart-pocs-python/amazon-bedrock-semantic-cache-poc-main
    ```

1. Configure the python virtual environment, activate it & install project dependencies. *Note: each POC has it's own dependencies & dependency management.*
    ```zsh
    python -m venv .env
    source .env/bin/activate
    pip install -r requirements.txt
    ```

1. Create a `.env` file in the project root with the following variables:

    ```zsh
    PROFILE_NAME=your_aws_profile_name
AWS_REGION=your_aws_region
OPENSEARCH_HOST=your_opensearch_host
OPENSEARCH_INDEX=your_opensearch_index (Note: Specify a name like semantic-cache-index. This will be a seperate index than your knowledge base which will be created by the application)
KNOWLEDGE_BASE_ID=your_knowledge_base_id
    ```


1. Update OpenSearch permissions to allow access from the CLI and to grant delete actions

        a. Navigate to OpenSearch Serverless Collections

        ![Alt text](image/os-permissions-1.png)

        b. Select your Collection

        ![Alt text](image/os-permissions-2.png)

        c. Click on Data Access Control

        ![Alt text](image/os-permissions-3.png)

        d. Select Edit

        ![Alt text](image/os-permissions-4.png)

        e. Add your CLI user as a principal  

        ![Alt text](image/os-permissions-5.png)

        f. Grant Delete Collection Items on the collection and Delete Index on the index and click Save

        ![Alt text](image/os-permissions-6.png)


1. Start the POC from your terminal
    ```zsh
    streamlit run app.py
    ```
This should start the POC and open a browser window to the application. 

## How-To Guide
For a details how-to guide for using this poc, visit [HOWTO.md](HOWTO.md)

## Considerations

Other vector db&#39;s can be used to implement semantic caching. Here a a few helpful links to explore:

1. [Semantic Caching with MemoryDB](https://aws.amazon.com/blogs/database/improve-speed-and-reduce-cost-for-generative-ai-workloads-with-a-persistent-semantic-cache-in-amazon-memorydb/)
2. [Semantic Caching with LangChain](https://python.langchain.com/v0.2/docs/integrations/llm_caching/)

Please note that only specific models can be used with Amazon Bedrock Knowledge Bases and with the Amazon Bedrock Converse API.
1. Amazon Bedrock Converse API - Supported [models](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html) and model features
2. Amazon Bedrock Knowledge Bases - Supported [models](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-supported.html) by action