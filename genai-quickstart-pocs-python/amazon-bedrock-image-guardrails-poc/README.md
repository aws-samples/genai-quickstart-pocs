# Amazon Bedrock Image Generation with Guardrails

## Overview of Solution

This sample code demonstrates using Amazon Bedrock Guardrails to prevent Stability Diffusion LLM from generating harmful, obscene, or violent images. The application features a streamlit frontend where users input zero-shot requests to Claude 3. Amazon Bedrock Guardrails determine whether to proceed with generating images using the Stability Diffusion model.

![A gif of a screen recording show casing the Amazon Bedrock Image Generation with Guardrails functionality](images/demo.gif)


## Goal of this POC
The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to create images based on text input requests with security guardrails.
This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.

The architecture & flow of the POC is as follows:
![POC Architecture & Flow](images/architecture.png 'POC Architecture')


When a user interacts with the POC, the flow is as follows:

1. The user inserts a text question into to the streamlit app. (app.py).

1. The streamlit app, takes the text inserted by the user and is passed to Claude LLM with Guardrail id to check for prompt which is acceptable. If the prompt is detected as malicious or triggers the guardrail, a response (Blocked Messaging statement on Bedrock Guardrails) will be returned to the end user saying the request is blocked with a message &quot;Inappropriate prompt!!&quot; (image_generation_guardrails.py).

1. If the prompt does not trigger the guardrail, it is passedto the model Stability diffusion model to generate images.




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
    
    
    * `invoke_model_with_guardrails.py` - the logic of the application, including the Amazon Bedrock Guardrail and Amazon Bedrock API invocations.
    
    

1. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```zsh
    cd genai-quickstart-pocs-python/amazon-bedrock-image-guardrails-poc
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
region_name=<REGION>
guardrail_identifier=<Guardrail_Identifier>
guardrail_version=<Guardrail_Version> (this is just a number i.e. 1,2,3 etc...)
    ```


1. Start the POC from your terminal
    ```zsh
    streamlit run app.py
    ```
This should start the POC and open a browser window to the application. 

## How-To Guide
For a details how-to guide for using this poc, visit [HOWTO.md](HOWTO.md)

