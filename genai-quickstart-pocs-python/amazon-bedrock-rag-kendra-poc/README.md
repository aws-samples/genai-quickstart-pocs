# Amazon Bedrock RAG with Kendra POC

## Overview of Solution

This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement a RAG based architecture with Amazon Kendra. The application is constructed with a simple streamlit frontend where users can ask questions against documents stored in Amazon Kendra.

![A gif of a screen recording show casing the Amazon Bedrock RAG with Kendra POC functionality](images/demo.gif)


## Goal of this POC
The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to take natural language questions, and answer questions against indexed documents in Amazon Kendra.
This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.

The architecture & flow of the POC is as follows:
![POC Architecture & Flow](images/architecture.png 'POC Architecture')


When a user interacts with the POC, the flow is as follows:

1. The user makes a request to the GenAI app (`app.py`).

1. The app issues a search query to the Amazon Kendra index based on the user request. (`kendra_bedrock_query.py`)

1. The index returns search results with excerpts of relevant documents from the ingested data. (`kendra_bedrock_query.py`)

1. The app sends the user request and along with the data retrieved from the index as context in the LLM prompt. (`kendra_bedrock_query.py`)

1. The LLM returns a succinct response to the user request based on the retrieved data. (`kendra_bedrock_query.py`)

1. The response from the LLM is sent back to the user. (app.py)




# How to use this Repo:

## Prerequisites:

1. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed and configured with access to Amazon Bedrock.

1. [Python](https://www.python.org/downloads/) v3.11 or greater. The POC runs on python. 


1. Access to create and configure Amazon Kendra Indexes


## Steps
1. Clone the repository to your local machine.

    ```
    git clone https://github.com/aws-samples/genai-quickstart-pocs.git
    ```
    
    The file structure of this POC is broken into these files
    
    * `requirements.txt` - all the requirements needed to get the sample application up and running.
    * `app.py` - The streamlit frontend
    
    
    * `kendra_bedrock_query` - The logic of the application, including the Kendra Retrieve API calls and Amazon Bedrock API invocations.
    
    

1. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```zsh
    cd genai-quickstart-pocs-python/amazon-bedrock-rag-kendra-poc
    ```

1. Configure the python virtual environment, activate it & install project dependencies. *Note: each POC has it's own dependencies & dependency management.*
    ```zsh
    python -m venv .env
    source .env/bin/activate
    pip install -r requirements.txt
    ```

1. **Create your Amazon Kendra Index (if you don&#39;t already have one)**
        		1. Go to Amazon Kendra in your AWS Console and click on &quot;Create an Index&quot; ![Alt text](images/Amazon_kendra_homepage.png &quot;Kendra Homepage&quot;)
        		2. Fill out the &quot;Specify Index details&quot; page, and provide Kendra a role that can access CloudWatch Logs. ![Alt text](images/kendra_specify_index_details.png &quot;Kendra Specify Details Page&quot;)
        		3. Fill out the &quot;Configure Access Control&quot; page ![Alt text](images/kendra_access_control.png &quot;Kendra Access Control&quot;)
        		4. Select the appropriate provisioning editions and create ![Alt text](images/specify_provisioning_kendra.png &quot;Kendra Edition Selection&quot;)
        		5. You can find your Kendra Index ID in the console as seen in the screenshot: ![Alt text](images/kendra_screen_shot.png &quot;Kendra Index&quot;)


1. Create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:

    ```zsh
    profile_name=<aws_cli_profile_name>
kendra_index=<kendra_index_ID>
    ```


1. Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure line 11 in the kendra_bedrock_query.py file to change the region:

    ```zsh
    bedrock = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock.us-east-1.amazonaws.com')
    ```


1. Time to sync a data source within Kendra. As seen in the screenshot below, you can configure the specific datasource that you would like to sync. For more information
on data sources feel free to refer to this [documentation](https://docs.aws.amazon.com/kendra/latest/dg/hiw-data-source.html).

![Alt text](images/kendra_data_source.png &quot;Kendra Data Source&quot;)

**_If you don&#39;t have your own sample data, or sample data source you can leverage the sample datasource within Amazon Kendra data sources as shown below:_**

    		1. On the data sources tab, click on the add dataset option as seen in the image: ![Alt text](images/sample_data_sources.png &quot;Kendra Sample Data Source&quot;)
    		2. Then define the data sources attributes such as the data source name and click add data source: ![Alt text](images/sample_data_source_configuration.png &quot;Kendra Sample Data Source Config&quot;)
    		3. This will automatically create the data source and triggers a sync. You will now be able to ask questions against Sample AWS Documentation that covers Kendra, EC2, S3 and Lambda in your front end application.



1. Start the POC from your terminal
    ```zsh
    streamlit run app.py
    ```
This should start the POC and open a browser window to the application. 

## How-To Guide
For a details how-to guide for using this poc, visit [HOWTO.md](HOWTO.md)

