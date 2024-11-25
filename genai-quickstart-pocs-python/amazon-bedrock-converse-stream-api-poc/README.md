# Amazon Bedrock Converse Stream API POC

## Overview of Solution

This is sample code demonstrating the use of the Amazon Bedrock ConverseStream API to help with conversation oriented use cases that require context preservation. The application is constructed with a simple streamlit frontend where users can input zero shot requests to Claude 3, with the Amazon Bedrock ConverseConverseStream API in place to allow users to ask context aware questions and stream the response back.

![A gif of a screen recording show casing the Amazon Bedrock Converse Stream API POC functionality](images/demo.gif)


## Goal of this POC
The goal of this repo is to provide users the ability to use the Amazon Bedrock ConverseStream API to demonstrate its ability to facilitate conversational GenAI use cases that require context awareness and streaming responses. 
 This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.

The architecture & flow of the POC is as follows:
![POC Architecture & Flow](images/architecture.png 'POC Architecture')


When a user interacts with the POC, the flow is as follows:

1. The user inserts a text question into to the streamlit app. (`app.py`)

1. The streamlit app, takes the text inserted by the user and is passed into an Amazon Bedrock Model using the Converse API. The users question is answered, and both the question and answer are stored. (`invoke_model_conversation_api.py`)

1. The answer to the user&#39;s question is returned to the front-end application, and allows users to ask follow up questions as the Converse API help preserve context throughout the users conversation (`app.py`)




# How to use this Repo:

## Prerequisites:

1. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed and configured with access to Amazon Bedrock.

1. [Python](https://www.python.org/downloads/) v3.11 or greater. The POC runs on python. 


1. Create an Amazon Bedrock Guardrail, information on how to do that can be found [here](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-create.html)


## Steps
1. Clone the repository to your local machine.

    ```
    git clone https://github.com/aws-samples/genai-quickstart-pocs.git
    ```
    
    The file structure of this POC is broken into these files
    
    * `requirements.txt` - all the requirements needed to get the sample application up and running.
    * `app.py` - The streamlit frontend
    
    
    * `invoke_model_converse_stream_api.py` - Houses the logic of the application, including the Amazon Bedrock Converse API invocation.
    
    

1. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```zsh
    cd genai-quickstart-pocs-python/amazon-bedrock-converse-stream-api-poc
    ```

1. Configure the python virtual environment, activate it & install project dependencies. *Note: each POC has it's own dependencies & dependency management.*
    ```zsh
    python -m venv .env
    source .env/bin/activate
    pip install -r requirements.txt
    ```

1. create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:

    ```zsh
    profile_name=<CLI_profile_name>
    ```


1. Start the POC from your terminal
    ```zsh
    streamlit run app.py
    ```
This should start the POC and open a browser window to the application. 

## How-To Guide
For a details how-to guide for using this poc, visit [HOWTO.md](HOWTO.md)

