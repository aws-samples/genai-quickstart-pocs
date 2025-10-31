# Aamazon Bedrock Document Generator POC

## Overview of Solution

This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement a document generation use case. The application is constructed with a simple streamlit frontend where users can provide details and create a document in the exact format that the you specify.

![A gif of a screen recording show casing the Aamazon Bedrock Document Generator POC functionality](images/demo.gif)


## Goal of this POC
The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to perform document generation based on a document template and details inputted by the user.

This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.

The architecture & flow of the POC is as follows:
![POC Architecture & Flow](images/architecture.png 'POC Architecture')


When a user interacts with the POC, the flow is as follows:

1. The user inserts document details that they would like included in the generated document within the streamlit app. (`app.py`)

1. The streamlit app, takes the document details, and invokes Amazon Bedrock to generate sample document that matches the document structure stated in the prompt containing the inserted document details (`doc_generator.py`)

1. Amazon Bedrock generates a first draft of the sample document and presents it to the frontend (`app.py`)

1. The user inserts refinement details highlighting areas where they would like to add refinements to the previously generated document (`app.py`)

1. The streamlit app takes the refinement details, passes it to Amazon Bedrock along with the document prompt, and the original draft of the document to begin creating the refined version (`doc_generator.py`)

1. Amazon Bedrock is used to generate the refined version of the document based on the user defined refinements and presents it on the frontend (`app.py`)




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
    cd genai-quickstart-pocs-python/amazon-bedrock-document-generator-poc
    ```

1. Configure the python virtual environment, activate it & install project dependencies. *Note: each POC has it's own dependencies & dependency management.*
    ```zsh
    python -m venv .env
    source .env/bin/activate
    pip install -r requirements.txt
    ```

1. create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:

    ```zsh
    profile_name=<AWS_CLI_PROFILE_NAME>
    ```


1. Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure line 12 in the document_generator.py file to set the appropriate region:

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

