# Amazon Bedrock Streaming Response POC

## Overview of Solution

This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement streaming responses. The application is constructed with a simple streamlit frontend where users can input zero shot requests directly against the LLM of their choice, leveraging a streaming response technique.

![A gif of a screen recording show casing the Amazon Bedrock Streaming Response POC functionality](images/demo.gif)


## Goal of this POC
The goal of this repo is to provide users the ability to use Amazon Bedrock leveraging its streaming response capabilities.
This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.

The architecture & flow of the POC is as follows:
![POC Architecture & Flow](images/architecture.png 'POC Architecture')


When a user interacts with the POC, the flow is as follows:

1. The user inserts a text question into to the streamlit app. (app.py).

1. The streamlit app, takes the text and passes it into Amazon Bedrock. (invoke_llm_with_streaming.py).

1. A natural language response is streamed to the end user, answering a question in general. (app.py).




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
    
    
    * `invoke_llm_with_streaming.py` - The logic required to invoke Amazon Bedrock and stream the response back to the frontend application (app.py).
    
    

1. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```zsh
    cd genai-quickstart-pocs-python/amazon-bedrock-streaming-response-poc
    ```

1. Configure the python virtual environment, activate it & install project dependencies. *Note: each POC has it's own dependencies & dependency management.*
    ```zsh
    python -m venv .env
    source .env/bin/activate
    pip install -r requirements.txt
    ```

1.  create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:

    ```zsh
    profile_name=<AWS_CLI_PROFILE_NAME>
    ```


1. Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure line 15 &amp; 39 in the invoke_llm_with_streaming.py file:

    ```zsh
    bedrock = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock-runtime.us-east-1.amazonaws.com')
        
        modelId = 'anthropic.claude-v2'
    ```


1. Start the POC from your terminal
    ```zsh
    streamlit run app.py
    ```
This should start the POC and open a browser window to the application. 

## How-To Guide
For a details how-to guide for using this poc, visit [HOWTO.md](HOWTO.md)

