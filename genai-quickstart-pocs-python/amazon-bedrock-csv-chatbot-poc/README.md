# Amazon Bedrock CSV Chatbot POC

## Overview of Solution

This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement a chatbot is able to converse with the user based on CSV data provided by the user. The application is constructed with a simple streamlit frontend where users can upload large CSV files and get them analyzed or start chatbot interactions.

![A gif of a screen recording show casing the Amazon Bedrock CSV Chatbot POC functionality](images/demo.gif)


## Goal of this POC
The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to answer questions a user might have on the CSV data provided. 

This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.

The architecture & flow of the POC is as follows:
![POC Architecture & Flow](images/architecture.png 'POC Architecture')


When a user interacts with the POC, the flow is as follows:

1. The user uploads a CSV file to the streamlit app. (`app.py`)

1. The streamlit app, takes the CSV file and chunks the document efficient data processing(`csv_data_insights.py`)

1. Once the data is passed into Amazon Bedrock and the user asks the chatbot a question, it creates a response to the user&#39;s question (`csv_data_insights.py`).

1. After the response is generated, it is presented on the streamlit app (`app.py`)




# How to use this Repo:

## Prerequisites:

1. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed and configured with access to Amazon Bedrock.

1. [Python](https://www.python.org/downloads/) v3.11 or greater. The POC runs on python. 



## Steps
1. Clone the repository to your local machine.

    ```
    git clone https://github.com/aws-samples/genai-quickstart-pocs.git
    ```
    
    The file structure of this POC is broken into these files
    
    * `requirements.txt` - all the requirements needed to get the sample application up and running.
    * `app.py` - The streamlit frontend
    
    
    * `csv_data_insights.py` - Houses the logic of the application and Amazon Bedrock API invocations.
    
    

1. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```zsh
    cd genai-quickstart-pocs-python/amazon-bedrock-csv-chatbot-poc
    ```

1. Configure the python virtual environment, activate it & install project dependencies. *Note: each POC has it's own dependencies & dependency management.*
    ```zsh
    python -m venv .env
    source .env/bin/activate
    pip install -r requirements.txt
    ```

1. reate a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain

    ```zsh
    profile_name=<AWS_CLI_PROFILE_NAME>
        save_folder=<PATH_TO_ROOT_OF_THIS_REPO>
    ```


1. Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure line 10 in the `csv_data_insights.py` file to set your region:

    ```zsh
    bedrock = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock.us-east-1.amazonaws.com')
    ```


1. Since this repository is configured to leverage Claude 3, the prompt payload is structured in a different format. If you wanted to leverage other Amazon Bedrock models you can replace the line 143 in the `csv_data_insights.py` file to look like:

    ```zsh
    response = bedrock.invoke_model(body=json_prompt, modelId="anthropic.claude-3-sonnet-20240229-v1:0", accept="application/json", contentType="application/json")
    ```


1. Start the POC from your terminal
    ```zsh
    streamlit run app.py
    ```
This should start the POC and open a browser window to the application. 

## How-To Guide
For a details how-to guide for using this poc, visit [HOWTO.md](HOWTO.md)

