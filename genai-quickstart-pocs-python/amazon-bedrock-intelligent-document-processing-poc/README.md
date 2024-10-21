# Amazon Bedrock Intelligent Document Processing (IDP) POC

## Overview of Solution

This is sample code demonstrating the use of Amazon Bedrock and Generative AI incorporated into an Intelligent Document Processing (IDP) pipeline using user-uploaded documents. The application is constructed with a simple streamlit frontend where users can upload various document formats and perform different IDP actions such as text extraction, document summarization and classification, entity recognition, and Q&amp;A to satisfy a broad range of use cases.

![A gif of a screen recording show casing the Amazon Bedrock Intelligent Document Processing (IDP) POC functionality](images/demo.gif)


## Goal of this POC
The goal of this repo is to provide users the ability to use various Amazon AI services utilized in an IDP pipeline combined with Amazon Bedrock to improve performance, complete tasks faster, and limit human review. This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.

The architecture & flow of the POC is as follows:
![POC Architecture & Flow](images/architecture.png 'POC Architecture')


When a user interacts with the POC, the flow is as follows:

1. The user selects and uploads a document to the streamlit frontend (upload_doc_to_s3.py).

1. The document is uploaded to an Amazon S3 bucket (upload_doc_to_s3.py, s3_utils.py)

1. The raw text and key-value pairs are extracted from the document using Amazon Textract (extract_text_with_textract.py, textract_utils.py)

1. The extracted key-value pairs are grammatically corrected using Amazon Bedrock, where the enriched output is saved to the local directory (enrich_doc_with_bedrock.py, bedrock_utils.py)

1. The enriched output is then analyzed by Amazon Comprehend to detect entities such as people, organizations, locations, and more (entity_recognition_with_comprehend.py, comprehend_utils.py).

1. The enriched output is then passed to Amazon Bedrock for document classification, summarization, and Q&amp;A tasks. Bedrock’s multimodal capabilities can also be compared at each these stages by analyzing the document as is (classify_doc_with_bedrock.py, summarize_doc_with_bedrock.py, doc_qa_with_bedrock.py, bedrock_utils.py




# How to use this Repo:

## Prerequisites:

1. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed and configured with access to Amazon Bedrock.

1. [Python](https://www.python.org/downloads/) v3.11 or greater. The POC runs on python. 


1. Access to Amazon Textract and Amazon Comprehend via the AWS CLI

1. An Amazon S3 bucket with permissions to upload and list objects. This is required to upload your document. Please note the name of the bucket, you will need this.


## Steps
1. Clone the repository to your local machine.

    ```
    git clone https://github.com/aws-samples/genai-quickstart-pocs.git
    ```
    
    The file structure of this POC is broken into these files
    
    * `requirements.txt` - all the requirements needed to get the sample application up and running.
    * `app.py` - The streamlit frontend
    
    
    * `pages/welcome.py` - The welcome page providing an overview of the Intelligent Document Processing (IDP) stages.
    
    * `pages/upload_doc_to_s3.py` - The streamlit page that houses the logic to select a document or file to upload.
    
    * `pages/extract_text_with_textract.py` - The streamlit page that houses the logic to invoke Textract to extract the raw text and key-value pairs from the document.
    
    * `pages/enrich_doc_with_bedrock.py` - The streamlit page that houses the logic to read the key-value pair text file (output/key_value.txt) and invoke Bedrock to enrich the document by correcting any grammar mistakes or incorrect text extractions from the Textract job. The enriched result is saved as a local text file (output/enriched_output.txt).
    
    * `pages/entity_recognition_with_comprehend.py` - The streamlit page that houses the logic to invoke Comprehend to perform entitiy recognition on the contents in the enriched output file (output/enriched_output.txt).
    
    * `pages/classify_doc_with_bedrock.py` - The streamlit page that houses the logic to provide the user the option to classify the document from a select category of classes using either Bedrock&#39;s text or multimodal capabilities. A user can choose to have Bedrock read the enriched output file (output/enriched_output.txt) or read the file stored in S3 as an image to classify the document.
    
    * `pages/summarize_doc_with_bedrock.py` - The streamlit page that houses the logic to provide the user the option to summarize the document using either Bedrock&#39;s text or multimodal capabilities. A user can choose to have Bedrock read the enriched output file (output/enriched_output.txt) or read the file stored in S3 as an image to summarize the document.
    
    * `pages/doc_qa_with_bedrock.py` - The streamlit page that houses the logic to provide the user the option to ask questions about the document using either Bedrock&#39;s text or multimodal capabilities. A user can choose to have Bedrock read the enriched output file (output/enriched_output.txt) or read the file stored in S3 as an image to answer user queries regarding the document&#39;s contents.
    
    * `idp/bedrock_utils.py` - The file containing the logic for document enrichment, classification, summarization, and question-answering by interacting with Amazon Bedrock. These interactions are performed by sending a structured prompt containing the relevant text or image data to the Bedrock model via API calls. The prompt includes instructions for the model, such as correcting grammar, classifying documents into predefined categories, or summarizing content, and the model&#39;s responses are parsed and returned as usable output.
    
    * `idp/comprehend_utils.py` - The file containing the logic to invoke Amazon Comprehend, which will perform entity recognition using the default pre-trained model to detect entities such as names, dates, organizations, etc.
    
    * `idp/s3_utils.py` - The file containing the logic to upload a file to S3 and list any current documents stored in the selected bucket.
    
    * `idp/textract_utils.py` - The file containing the logic to start a Textract job that analyzes the document and extracts the raw text and key-value pairs from the document, saving both as local text files (extracted_text.txt and key_value.txt) to the &quot;output&quot; folder.
    
    

1. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```zsh
    cd genai-quickstart-pocs-python/amazon-bedrock-intelligent-document-processing-poc
    ```

1. Configure the python virtual environment, activate it & install project dependencies. *Note: each POC has it's own dependencies & dependency management.*
    ```zsh
    python -m venv .env
    source .env/bin/activate
    pip install -r requirements.txt
    ```

1. Now that the requirements have been successfully installed in your virtual environment we can begin configuring environment variables. You will first need to create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain your AWS profile, along with the name of your S3 bucket for uploaded documents, as shown below:

    ```zsh
    
        profile_name=<AWS_CLI_PROFILE_NAME>
        save_folder=<YOUR_S3_BUCKET_NAME>
    ```


1. Since this repository is configured to leverage Claude 3.5 Sonnet, the prompt payload is structured in a different format compared to previous models and other model providers. If you wanted to leverage other Amazon Bedrock models you can change the Bedrock invocation function in each file, modifying the body parameters using this guide depending on the model ID.
Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure each file that utilizes Bedrock set to the appropriate region. Each of these files are configured as shown below:

    ```zsh
    
        client = boto3.client("bedrock-runtime", region_name="us-west-2")
        model_id = "anthropic.claude-3-5-sonnet-20240620-v1:0"
    ```


1. Start the POC from your terminal
    ```zsh
    streamlit run app.py
    ```
This should start the POC and open a browser window to the application. 

## How-To Guide
For a details how-to guide for using this poc, visit [HOWTO.md](HOWTO.md)