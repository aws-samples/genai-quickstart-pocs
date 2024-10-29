# Amazon Bedrock Claude 3 Long Form Output POC

## Overview of Solution

This is sample code demonstrating the use of Amazon Bedrock and Generative AI to translate text from a source to target language.

![A gif of a screen recording show casing the Amazon Bedrock Claude 3 Long Form Output POC functionality](images/demo.gif)


## Goal of this POC
The goal of this repository is to provide users with the ability to use Amazon Bedrock to generate long form content. This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.

The architecture & flow of the POC is as follows:
![POC Architecture & Flow](images/architecture.png 'POC Architecture')


When a user interacts with the POC, the flow is as follows:

1. The user either selects the default prompt or inputs a prompt.

1. The application constructs the appropriate prompt and sends it to Amazon Bedrock.

1. The appliction recieves and sends the text to Amazon Bedrock for analysis of accuracy and fluency.

1. The generated text and analysis is displayed on the frontend application.




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
    
    
    * `BedrockProcessor.py` - The logic for interacting with the Amazon Bedrock service.
    
    

1. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```zsh
    cd genai-quickstart-pocs-python/amazon-bedrock-claude3-long-form-output-poc
    ```

1. Configure the python virtual environment, activate it & install project dependencies. *Note: each POC has it's own dependencies & dependency management.*
    ```zsh
    python -m venv .env
    source .env/bin/activate
    pip install -r requirements.txt
    ```

1. Create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:

    ```zsh
    profile_name=<AWS_CLI_PROFILE_NAME>
    ```


1. Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure line 23 in the prompt_finder_and_invoke_llm.py file to set the appropriate region:

    ```zsh
    bedrock = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock-runtime.us-east-1.amazonaws.com')
    ```


1. Start the POC from your terminal
    ```zsh
    streamlit run app.py
    ```
This should start the POC and open a browser window to the application. 

## How-To Guide
For a details how-to guide for using this poc, visit [HOWTO.md](HOWTO.md)

