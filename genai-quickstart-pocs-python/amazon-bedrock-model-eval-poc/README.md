# Amazon Bedrock Model Evaluation Data Prep Tool

## Overview of Solution

This is sample code aimed to accelerate customers aiming to leverage [Amazon Bedrock Model Evaluator](https://docs.aws.amazon.com/bedrock/latest/userguide/model-evaluation.html) with custom prompt data. This Proof-of-Concept (POC) enables users to provide a CSV containing data that should be used with Amazon Bedrock Model Evaluator. The user then maps the CSV columns to the appropriate fields depending on which type of Model Evaluation being executed. This will generate one or more `.jsonl` formatted files, ready for use with Amazon Bedrock Model Evaluator.

![A gif of a screen recording show casing the Amazon Bedrock Model Evaluation Data Prep Tool functionality](images/demo.gif)


## Goal of this POC
The goal of this POC is to help customers understand how to transform data from CSV format to an Amazon Bedrock Model Evaluation dataset.


When a user interacts with the POC, the flow is as follows:

1. Run the POC (see &quot;How to use this Repo&quot;)

1. Upload CSV of data to use with Model Evaluator

1. Select the type of Model Evaluation being performed

1. Map CSV columns to expected fields specific to the prompt type selected

1. Download generated `.jsonl` file(s)

1. Upload the generated `.jsonl` files to an Amazon S3 bucket that Amazon Bedrock Model Evalutor can access

1. Execute Model Evaluation using custom prompts pointing to the newly uploaded prompt dataset. If you have more than 1,000 prompts, multiple files will have been generated. You can only execute model evaluation on a maximum of 1,000 records. 




# How to use this Repo:

## Prerequisites:

1. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed and configured with access to Amazon Bedrock.

1. [Python](https://www.python.org/downloads/) v3.11 or greater. The POC runs on python. 


1. Ensure you have access to an Amazon S3 bucket where you can upload generated data. Amazon Bedrock Model Evaluator will also need access to read and write to this bucket during Model Evaluation. 


## Steps
1. Clone the repository to your local machine.

    ```
    git clone https://github.com/aws-samples/genai-quickstart-pocs.git
    ```
    
    The file structure of this POC is broken into these files
    
    * `requirements.txt` - all the requirements needed to get the sample application up and running.
    * `app.py` - The streamlit frontend
    
    
    * `logic.py` - the logic that processes the data from the front-end
    
    

1. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```zsh
    cd genai-quickstart-pocs-python/amazon-bedrock-model-eval-poc
    ```

1. Configure the python virtual environment, activate it & install project dependencies. *Note: each POC has it's own dependencies & dependency management.*
    ```zsh
    python -m venv .env
    source .env/bin/activate
    pip install -r requirements.txt
    ```

1. Start the POC from your terminal
    ```zsh
    streamlit run app.py
    ```
This should start the POC and open a browser window to the application. 

## How-To Guide
For a details how-to guide for using this poc, visit [HOWTO.md](HOWTO.md)

