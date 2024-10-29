# Amazon Bedrock &amp; Amazon RDS POC

## Overview of Solution

This is sample code demonstrating the use of Amazon Bedrock and Generative AI to use natural language questions to query relational data stores, specifically Amazon RDS. This example leverages the MOMA Open Source Database: https://github.com/MuseumofModernArt/collection.

![A gif of a screen recording show casing the Amazon Bedrock &amp; Amazon RDS POC functionality](images/demo.gif)


## Goal of this POC
The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to take natural language questions, and transform them into relational database queries against Amazon RDS Databases. This repo is designed to work with
Amazon RDS Postgres, but can be configured to work with other database engine types.
This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.

The architecture & flow of the POC is as follows:
![POC Architecture & Flow](images/architecture.png 'POC Architecture')


When a user interacts with the POC, the flow is as follows:

1. The user makes a request, asking a natural language question based on the data in Amazon RDS to the GenAI app (app.py).

1. This natural language question is passed into Amazon Bedrock, which takes the natural language question and creates a SQL query (amazonRDS_bedrock_query.py).

1. The created SQL query is then executed against your Amazon RDS database to begin retrieving the data (amazonRDS_bedrock_query.py).

1. The data is retrieved from your Amazon RDS Database and is passed back into Amazon Bedrock, to generate a natural language answer based on the retrieved data (amazonRDS_bedrock_query.py).

1. The LLM returns a natural language response to the user through the streamlit frontend based on the retrieved data (app.py).




# How to use this Repo:

## Prerequisites:

1. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed and configured with access to Amazon Bedrock.

1. [Python](https://www.python.org/downloads/) v3.11 or greater. The POC runs on python. 


1. Access to Amazon RDS and the ability to create an Amazon RDS database and tables.

1. Please note that this project leverages the [langchain-experimental](https://pypi.org/project/langchain-experimental/) package which has known vulnerabilities.


## Steps
1. Clone the repository to your local machine.

    ```
    git clone https://github.com/aws-samples/genai-quickstart-pocs.git
    ```
    
    The file structure of this POC is broken into these files
    
    * `requirements.txt` - all the requirements needed to get the sample application up and running.
    * `app.py` - The streamlit frontend
    
    
    * `amazonRDS_bedrock_query.py` - contains connectors into your Amazon RDS database and the interaction
    
    * `moma_examples.yaml` - contains several samples prompts that will be used to implement a few-shot prompting technique.
    
    

1. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```zsh
    cd genai-quickstart-pocs-python/amazon-bedrock-amazon-rds-poc
    ```

1. Configure the python virtual environment, activate it & install project dependencies. *Note: each POC has it's own dependencies & dependency management.*
    ```zsh
    python -m venv .env
    source .env/bin/activate
    pip install -r requirements.txt
    ```

1. Create a .env file in the root folder of this POC. Within the .env file you just created you will need to configure the .env to contain:

    ```zsh
    profile_name=<aws_cli_profile_name>	rds_username=<rds_database_username>	rds_password=<rds_database_password>	rds_endpoint=<rds_database_endpoint>	rds_port=<rds_port>
	rds_db_name=<rds_database_name>

    ```


1. If you would like to use this repo with the sample data, you will need to upload the two sample data files found in the sample data directory as two individual tables to your Amazon RDS Postgres Database.

If you preferred to use your own database/tables in your Amazon RDS instance, I would highly recommend reviewing the moma_examples.yaml file in the SampleData directory to see how prompts are constructed for this sample application and spend the time creating 5 - 10 prompts that resemble your dataset more closely.


1. Start the POC from your terminal
    ```zsh
    streamlit run app.py
    ```
This should start the POC and open a browser window to the application. 

## How-To Guide
For a details how-to guide for using this poc, visit [HOWTO.md](HOWTO.md)

