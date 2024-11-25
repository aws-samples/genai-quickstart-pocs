# Amazon Bedrock Claude 3 Image Analysis POC

## Overview of Solution

This is sample code demonstrating the use of Amazon Bedrock and Multi-Modal Generative AI models from Anthropic to implement an image analysis use case. The application is constructed with a simple streamlit frontend where users can upload a 1 page jpeg, png or PDF and get a description of the image.

![A gif of a screen recording show casing the Amazon Bedrock Claude 3 Image Analysis POC functionality](images/demo.gif)


## Goal of this POC
The goal of this repo is to provide users with the ability to analyze images with Generative AI. This can be integrated into applications like image classification, reverse image lookup, object detection and more. This repo comes iwth a basic streamlit front-end to help users stand up a proof of concept and experiment with image analysis use-cases quickly.

The architecture & flow of the POC is as follows:
![POC Architecture & Flow](images/architecture.png 'POC Architecture')


When a user interacts with the POC, the flow is as follows:

1. The user uploads an image for bedrock model to analyze. (`app.py`).

1. The streamlit app, takes the image input, and invokes Amazon Bedrock to generate a description (`analyze_images.py`).

1. The image created by Amazon Bedrock is returned and displayed on the streamlit app (`app.py`).




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
    
    
    * `analyze_images.py` - house the logic of the application, including the semantic search against the prompt repository and prompt formatting logic and the Amazon Bedrock API invocations.
    
    

1. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```zsh
    cd genai-quickstart-pocs-python/amazon-bedrock-claude3-image-analysis-poc
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


1. Depending on the region and model that you are planning to use with Amazon Bedrock (please note that only a few models can analyze images), you may need to reconfigure model paramaters in the image_analysis file. You might also choose to customize your prompts if this POC is for an industry-specific use-case analyzing a specific type of image:

    ```zsh
    brclient = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock-runtime.us-east-1.amazonaws.com',config=config)

#model params
model_id = "anthropic.claude-3-sonnet-20240229-v1:0"
    ```


1. You may also choose to customize the system prompt to align with a pecific use-case, or to get specific responses back about your images. 

    ```zsh
    system_prompt = "You are an expert in image analysis and classification. The question will be contained within the <question></question> tags. Before answering, think step by step in <thinking> tags as you analyze every part of the image. Provide your answer within the <answer></answer> tags. Incude a JSON structured response describing image attributes contained within the <json></json> tags. Always add line breaks between each section of your response"
    ```


1. Start the POC from your terminal
    ```zsh
    streamlit run app.py
    ```
This should start the POC and open a browser window to the application. 

## How-To Guide
For a details how-to guide for using this poc, visit [HOWTO.md](HOWTO.md)

