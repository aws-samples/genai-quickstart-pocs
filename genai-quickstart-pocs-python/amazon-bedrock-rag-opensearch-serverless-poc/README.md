# Amazon Bedrock RAG with OpenSearch Serverless POC

## Overview of Solution

This is sample code demonstrating the use of Amazon Bedrock and Generative AI to create custom embeddings stored in Amazon OpenSearch Serverless with the ability ask questions against the stored documents. The application is constructed with a RAG based architecture where users can ask questions against the indexed embeddings within OpenSearch Serverless.

![A gif of a screen recording show casing the Amazon Bedrock RAG with OpenSearch Serverless POC functionality](images/demo.gif)


## Goal of this POC
The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to take natural language questions, and answer questions against embedded and indexed documents in Amazon OpenSearch Serverless Vector Search.
This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.

The architecture & flow of the POC is as follows:
![POC Architecture & Flow](images/architecture.png 'POC Architecture')


When a user interacts with the POC, the flow is as follows:

1. The user makes a request to the GenAI app (`app.py`)

1. The app issues a k-nearest-neighbors search query to the Amazon OpenSearch Serverless Vector Search index based on the user request. (`query_against_opensearch.py`)

1. The index returns search results with excerpts of relevant documents from the ingested data. (`query_against_opensearch.py`)

1. The app sends the user request and along with the data retrieved from the Amazon OpenSearch Serverless Vector Search index as context in the LLM prompt. (`query_against_opensearch.py`)

1. The LLM returns a succinct response to the user request based on the retrieved data. (`query_against_opensearch.py`)

1. The response from the LLM is sent back to the user. (`app.py`)




# How to use this Repo:

## Prerequisites:

1. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed and configured with access to Amazon Bedrock.

1. [Python](https://www.python.org/downloads/) v3.11 or greater. The POC runs on python. 


1. Access to create and configure Amazon OpenSearch Serverless collections


## Steps
1. Clone the repository to your local machine.

    ```
    git clone https://github.com/aws-samples/genai-quickstart-pocs.git
    ```
    
    The file structure of this POC is broken into these files
    
    * `requirements.txt` - all the requirements needed to get the sample application up and running.
    * `app.py` - The streamlit frontend
    
    
    * `docs_to_openSearch.py` - the logic needed to take a PDF document stored on your local machine, creating the embeddings and storing it in your OpenSearch Index.
    
    * `query_against_opensearch.py` - The logic of the application, including the Amazon OpenSearch Serverless Vector Search calls and Amazon Bedrock API invocations.
    
    

1. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```zsh
    cd genai-quickstart-pocs-python/amazon-bedrock-rag-opensearch-serverless-poc
    ```

1. Configure the python virtual environment, activate it & install project dependencies. *Note: each POC has it's own dependencies & dependency management.*
    ```zsh
    python -m venv .env
    source .env/bin/activate
    pip install -r requirements.txt
    ```

1. Create the Amazon OpenSearch Serverless Vector Search collection.

                To create our Amazon OpenSearch Vector Search Collection we will:

                1. Go to the Amazon OpenSearch Service homepage within the AWS console and on the left-hand side we will select &quot;Collections&quot; under the &quot;Serverless&quot; drop down ![Alt text](images/Amazon_OpenSearch_Homepage.png &quot;Amazon OpenSearch Serverless Homepage&quot;)
                2. We will then click on &quot;Create collection&quot; ![Alt text](images/create_collection.png &quot;Amazon OpenSearch Create Collection&quot;)
                3. On the &quot;Configure collection settings&quot; page, we will need to input a &quot;Collection name&quot;, select the &quot;Collection type&quot;: &quot;Vector search&quot;, in the &quot;Security&quot; section select the option &quot;Standard create&quot;, and select your preferred &quot;Encryption&quot; settings: ![Alt text](images/Configure_collection_settings_part_1.png &quot;Amazon OpenSearch Serverless Collection Settings Part-1&quot;)
                4. On the same &quot;Configure collection settings&quot; page, at the bottom we will select our &quot;Network access settings&quot; either &quot;Public&quot; or &quot;VPC&quot;, and give access to the OpenSearch Endpoint and/or OpenSearch Dashboards and select next ![Alt text](images/configure_collection_settings_part_2.png &quot;Amazon OpenSearch Create Collection Part 2&quot;)
                5. On the &quot;Configure data access&quot; page we must input a &quot;Rule name&quot;, add the user for which you have CLI credentials for, and for the sake of the POC Grant all permissions and select Next ![Alt text](images/configure_data_access.png &quot;Amazon OpenSearch Configure Data Access&quot;)
                6. We will then enter an access policy name and select Next ![Alt text](images/access_policy_definition.png &quot;Amazon OpenSearch Configure Data Access Part 2&quot;)
                7. We will confirm all of our configuration items, and press Submit ![Alt text](images/collection_create_confirm.png &quot;Amazon OpenSearch Collection Confirm&quot;)
                8. As soon as the collection is created, you will want to **BE SURE TO NOTE DOWN THE OPENSEARCH ENDPOINT** ![Alt text](images/OpenSearch-endpoint.png &quot;Amazon OpenSearch Endpoint&quot;)


1. With our Amazon OpenSearch Serverless Vector Search collection created, we now must create our Vector Index. As soon as this is created we will begin indexing our PDF document.

                1. Within the OpenSearch Serverless Collection we just created, we will select &quot;Create vector index&quot; ![Alt text](images/create_vector_index.png &quot;Create Vector Index&quot;)
                2. We will then input a Vector Index Name, Vector Field Name, Dimensions and distance metric... **BE SURE TO NOTE DOWN THE VECTOR INDEX NAME AND VECTOR FIELD NAME**. The Dimensions field is expecting an integer, in our case since we are using the &#39;amazon.titan-embed-text-v1&#39; embeddings model, the dimension size will be 1536. If you plan on using a different embeddings model you will need to change this value to represent the output vector size of that specific model. Then Select &quot;Create&quot; ![Alt text](images/create_vector_index_name.png &quot;Create Vector Index Details&quot;) ![Alt text](images/vector_field.png &quot;Create Vector Index Details&quot;)
                3. **_OPTIONAL:_** If you want to add meta-data to your documents that you plan on indexing, you must specify those fields in this vector index configuration. If you plan on adding meta-data you will need to reconfigure some of the code in the docs_to_openSearch.py file ![Alt text](images/metadata.png &quot;Add Meta-Data&quot;)


1. create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:

    ```zsh
    profile_name=<AWS_CLI_PROFILE_NAME>
opensearch_host=<AMAZON_OPENSEARCH_HOST> example->abcdefghijklmnop1234.us-east-1.aoss.amazonaws.com
vector_index_name=<vector_index_name>
vector_field_name=<vector_field_name>
    ```


1. Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure line 12 in the query_against_openSearch.py file to change the region:

    ```zsh
    bedrock = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock.us-east-1.amazonaws.com')
    ```


1. After you create your .env file, it is time to create the embeddings for a sample PDF document of your choosing.
All you will need to do, is specify the path to that PDF document in line 42 of the docs_to_openSearch.py file.
Optionally you can also try different values for the document chunk size in line 47 - line 51 of the same docs_to_openSearch.py file.
As soon as you are satisfied with the configuration, you can simply run the file while in the root of the repo with the command below. 

**_Depending on the size of your document this process can range from seconds to hours_**


    ```zsh
    python3 docs_to_openSearch.py
    ```


1. Start the POC from your terminal
    ```zsh
    streamlit run app.py
    ```
This should start the POC and open a browser window to the application. 

## How-To Guide
For a details how-to guide for using this poc, visit [HOWTO.md](HOWTO.md)

