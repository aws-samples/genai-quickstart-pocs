# Amazon Bedrock &amp; Amazon Redshift POC

## Overview of Solution

This is sample code demonstrating the use of Amazon Bedrock and Generative AI to use natural language questions to query relational data stores, specifically Amazon Redshift. This example leverages the MOMA Open Source Database: https://github.com/MuseumofModernArt/collection.

 	**Please Note: If you don&#39;t want to build this from scratch, Amazon Redshift now supports GenAI capabilities natively, more information on that can be found [here](https://aws.amazon.com/blogs/aws/amazon-redshift-adds-new-ai-capabilities-to-boost-efficiency-and-productivity/).**

![A gif of a screen recording show casing the Amazon Bedrock &amp; Amazon Redshift POC functionality](images/demo.gif)


## Goal of this POC
The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to take natural language questions, and transform them into relational database queries against Amazon Redshift Databases. This repo is designed to work with Amazon Redshift Provisioned Clusters. This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.

The architecture & flow of the POC is as follows:
![POC Architecture & Flow](images/architecture.png 'POC Architecture')


When a user interacts with the POC, the flow is as follows:

1. The user makes a request, asking a natural language question based on the data in Amazon Redshift to the GenAI app (`app.py`)

1. This natural language question is passed into Amazon Bedrock, which takes the natural language question and creates a SQL query (`amazon_redshift_bedrock_query.py`)

1. The created SQL query is then executed against your Amazon Redshift cluster to begin retrieving the data (`amazon_redshift_bedrock_query.py`).

1. The data is retrieved from your Amazon Redshift Database and is passed back into Amazon Bedrock, to generate a natural language answer based on the retrieved data (`amazon_redshift_bedrock_query.py`).

1. The LLM returns a natural language response to the user through the streamlit frontend based on the retrieved data (`app.py`).




# How to use this Repo:

## Prerequisites:

1. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed and configured with access to Amazon Bedrock.

1. [Python](https://www.python.org/downloads/) v3.11 or greater. The POC runs on python. 


1. Access to Amazon Redshift and the ability to create an Amazon Redshift cluster and tables.

1. Please note that this project leverages the [langchain-experimental](https://pypi.org/project/langchain-experimental/) package which has known vulnerabilities.


## Steps
1. Clone the repository to your local machine.

    ```
    git clone https://github.com/aws-samples/genai-quickstart-pocs.git
    ```
    
    The file structure of this POC is broken into these files
    
    * `requirements.txt` - all the requirements needed to get the sample application up and running.
    * `app.py` - The streamlit frontend
    
    
    * `amazon_redshift_bedrock_query.py` - contains connectors into your Amazon Redshift database and the interaction
    
    * `moma_examples.yaml` - contains several samples prompts that will be used to implement a few-shot prompting technique.
    
    

1. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```zsh
    cd genai-quickstart-pocs-python/amazon-bedrock-amazon-redshift-poc
    ```

1. Configure the python virtual environment, activate it & install project dependencies. *Note: each POC has it's own dependencies & dependency management.*
    ```zsh
    python -m venv .env
    source .env/bin/activate
    pip install -r requirements.txt
    ```

1. Create a .env file in the root folder of this POC. Within the .env file you just created you will need to configure the .env to contain:

    ```zsh
    profile_name=<aws_cli_profile_name>	redshift_host=<REDSHIFT_HOST_URL>  example -> redshift-cluster-1.abcdefghijk123.us-east-1.redshift.amazonaws.com	redshift_username=<redshift_database_username>	redshift_password=<redshift_database_password>	redshift_endpoint=<redshift_database_endpoint>	redshift_port=<redshift_port>
	redshift_db_name=<redshift_database_name>

    ```


1. Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure lines 19-25 in the amazon_redshift_bedrock_query.py file:

    ```zsh
    llm = Bedrock(
    credentials_profile_name=os.getenv("profile_name"),
    model_id="amazon.titan-text-express-v1",
    endpoint_url="https://bedrock-runtime.us-east-1.amazonaws.com",
    region_name="us-east-1",
    verbose=True
)
    ```


1. If you would like to use this repo with the sample data, you will need to upload the two sample data files found in the sample data directory as two individual tables to your Amazon Redshift Database.

If you preferred to use your own database/tables in your Amazon Redshift instance, I would highly recommend reviewing the moma_examples.yaml file in the SampleData directory to see how prompts are constructed for this sample application and spend the time creating 5 - 10 prompts that resemble your dataset more closely.


1. Start the POC from your terminal
    ```zsh
    streamlit run app.py
    ```
This should start the POC and open a browser window to the application. 

## How-To Guide
For a details how-to guide for using this poc, visit [HOWTO.md](HOWTO.md)

