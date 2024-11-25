# Amazon Bedrock LangChain RAG POC

## Overview of Solution

This is sample code demonstrating the use of Amazon Bedrock and Generative AI using Langchain as orchestrator with the ability ask questions against the stored documents. This sample uses Knowledge bases as to retrieve the stored documents, however you can extend or update this sample to retrieve your stored documents from any Vector DB.

![A gif of a screen recording show casing the Amazon Bedrock LangChain RAG POC functionality](images/demo.gif)


## Goal of this POC
The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI using Langchain as orchestrator to create RAG based applications.
This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.

The architecture & flow of the POC is as follows:
![POC Architecture & Flow](images/architecture.png 'POC Architecture')


When a user interacts with the POC, the flow is as follows:

1. The user makes a request to the GenAI app (`app.py`)

1. The app issues a get contexts query to the Amazon Bedrock Knowledge bases using Langchain based on the user request. (`query_with_langchain.py`)

1. The knowledge bases returns search results related to the relevant documents from the ingested data. (`query_with_langchain.py`)

1. The app sends the user request and along with the data retrieved from the Amazon Bedrock Knowlegebases as context in the LLM prompt to a LLM available within Bedrock using Langchain. (`query_with_langchain.py`)

1. The LLM returns a succinct response to the user request based on the retrieved data. (`query_with_langchain.py`)

1. The response from the LLM is sent back to the user. (`app.py`)




# How to use this Repo:

## Prerequisites:

1. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed and configured with access to Amazon Bedrock.

1. [Python](https://www.python.org/downloads/) v3.11 or greater. The POC runs on python. 



## Steps
1. Clone the repository to your local machine.

    ```
    git clone https://github.com/aws-samples/genai-quickstart-pocs.git
    ```
    

1. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```zsh
    cd genai-quickstart-pocs-python/amazon-bedrock-langchain-rag-poc
    ```

1. Configure the python virtual environment, activate it & install project dependencies. *Note: each POC has it's own dependencies & dependency management.*
    ```zsh
    python -m venv .env
    source .env/bin/activate
    pip install -r requirements.txt
    ```

1. Now that we have successfully cloned the repo, created and activated the virtual environment and installed the necessary dependencies, it is time for us to create Amazon Bedrock Knowledge base.

To create our Amazon Bedrock Knowledge base we will:

1. Go to the Amazon Bedrock Service homepage within the AWS console and on the left-hand side we will select &quot;Knowledge bases&quot; under the &quot;Orchestration&quot; drop down ![Alt text](images/amazon_bedrock_homepage.png &quot;Amazon Bedrock Homepage&quot;)

2. We will then click on &quot;Create knowledge base&quot; ![Alt text](images/knowledgeBase_homepage.png &quot;Amazon Bedrock Create Knowledge base&quot;)

3. In the Knowledge base details section, you can optionally change the default name and provide a description for your knowledge base.In the IAM permissions section, choose an AWS Identity and Access Management (IAM) role that provides Amazon Bedrock permission to access other AWS services. You can let Amazon Bedrock create the service role or choose a custom role that you have created. Optionally, add tags to your knowledge base. Select Next. ![Alt text](images/kb_first_page.png &quot;Knowledge base details&quot;)

4. On the Set up data source page, provide the information for the data source to use for the knowledge base: Optionally, change the default Data source name. Provide the S3 URI of the object containing the files for the data source that you prepared. Select Next. ![Alt text](images/kb_datasource_page.png &quot;Set up Data Source&quot;)

5. In the Embeddings model section, choose a supported embeddings model to convert your data into vector embeddings for the knowledge base. In the Vector database section, choose Quick create a new vector store and select Next ![Alt text](images/kb_vectordb_page.png &quot;Select Embeddings Model&quot;)

6. On the Review and create page, check the configuration and details of your knowledge base. Choose Edit in any section that you need to modify. When you are satisfied, select Create knowledge base.


1. create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:

    ```zsh
    profile_name=<AWS_CLI_PROFILE_NAME>
knowledge_base_id=<Knowledge Base Id of the the Knowledge Base we created in the previous step>
llm_model = < LLM model that you want to use for the POC, either "amazon-titan" or "anthropic-claude >
    ```


1. Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure line 19 and 20 in the query_with_langchain.py file to change the region:

    ```zsh
    bedrock = boto3.client('bedrock-runtime', 'us-east-1')
bedrock_agent_runtime = boto3.client('bedrock-agent-runtime','us-east-1')
    ```


1. Since this repository is configured to leverage Amazon Titan or Anthropic Claude 3 models, the prompt payload is structured in formats required for the invocation of these two models. 
If you wanted to leverage other Amazon Bedrock models, you can update `query_with_langchain.py` code. 
For example if you to call Amazon Titan Lite instead of Amazon Titan Express, you can update call_titan funciton in `query_with_langchain.py` to look like the code below.

You can then change the model_id param value to the other available models from Amazon Titan.

This repository is configured to leverage Knowledge bases. 
If you want to use other Vector DBs that are not supported in Amazon Bedrock Knowledge Bases, or want to directly retreive contexts from Vector DB using langchain, you can refere to [this Langchain documentation](https://python.langchain.com/docs/modules/data_connection/retrievers/vectorstore/).


    ```zsh
    def call_titan(query, retriever):
    """
    This function is used to call Amazon Titan Express LLM model using Langchain.
    :param query: Contains the Question asked by the user
    :param retriever: Contains the  contexts retrieved from the Amazon Bedrock Knowledge base
    :return: Response recieved from LLM for the input user query
    """

    # Setting Model kwargs
    model_kwargs = {
        "maxTokenCount": 4096,
        "stopSequences": [],
        "temperature": 0,
        "topP": 1,
    }

    # Setting LLM method from the Language Bedrock library
    llm = Bedrock(
        client=bedrock, model_id="amazon.titan-text-lite-v1", model_kwargs={} #updating the model_id param to to Amazon Titan Lite
    )

    # Invoke Amazon Titan using the Langchain llm method
    qa = RetrievalQA.from_chain_type(
        llm=llm, retriever=retriever, return_source_documents=True
    )

    answer = qa(query)

    # Returning the response
    return answer       
    ```


1. Start the POC from your terminal
    ```zsh
    streamlit run app.py
    ```
This should start the POC and open a browser window to the application. 

## How-To Guide
For a details how-to guide for using this poc, visit [HOWTO.md](HOWTO.md)

