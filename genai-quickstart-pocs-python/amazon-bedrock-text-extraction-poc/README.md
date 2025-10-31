# Amazon Bedrock Text Extraction POC

## Overview of Solution

This is sample code demonstrating the use of Amazon Bedrock and Generative AI to extract text from a document. The application is constructed with a simple streamlit frontend where users leverage Bedrock Agents to extract and summarize key information from a document like a financial earnings report. 

![A gif of a screen recording show casing the Amazon Bedrock Text Extraction POC functionality](images/demo.gif)


## Goal of this POC
The goal of this repo is to provide users with a simple text extraction POC. The example document leveraged is an Amazon Earnings Report and the Agents will extract key information: Report Title, Report Publishing Date, Company Focus, Earnings Per Share (EPS), Net Income, Free Cash Flow, Brief Summary of Report, and a Key Quote from Leadership. This is just one example of text extraction and the prompts can be altered depending on the type of document and information you would like extracted. 

The architecture & flow of the POC is as follows:
![POC Architecture & Flow](images/architecture.png 'POC Architecture')


When a user interacts with the POC, the flow is as follows:

1. The user uploads a document to be summarized, in this example we use an earnings report in PDF format into the streamlit app. (app.py).

1. The streamlit app, takes the PDF and passes it into Amazon Bedrock. If you upload another document make sure to update your prompts with what you want extracted/summarized! (extract_pdf_to_json.py).

1. A Bedrock Agent extracts key information and returns it to the user in valid JSON format. (extract_pdf_to_json.py).




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
    
    
    * `extract_pdf_to_json.py` - The logic required to invoke Amazon Bedrock and parse the response (extract_pdf_to_json.py).
    
    * `AMZN-Q1-2024-Earnings-Release.pdf` - contains an example earnings report the user will upload.
    
    

1. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```zsh
    cd genai-quickstart-pocs-python/amazon-bedrock-text-extraction-poc
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


1. Start the POC from your terminal
    ```zsh
    streamlit run app.py
    ```
This should start the POC and open a browser window to the application. 

## How-To Guide
For a details how-to guide for using this poc, visit [HOWTO.md](HOWTO.md)

