# Amazonb Bedrock Meeting Minutes Summarization POC

## Overview of Solution

This application demonstrates using Amazon Bedrock and Amazon Transcribe to summarize meeting recordings. The streamlit frontend allows users to upload audio, video, or text files of meeting recording. Amazon Transcribe generates a transcript of recording and sent it Amazon Bedrock for summarization of the key discussion points. Users can then download the  generated summarized meeting notes.

![A gif of a screen recording show casing the Amazonb Bedrock Meeting Minutes Summarization POC functionality](images/demo.gif)


## Goal of this POC
The goal of this repo is to provide users the ability to use Amazon Bedrock and Amazon Transcribe to create Meeting minutes from audio ,video recordings. If audio 
It show case the capablitiy to upload Audio, Video of meeting recording and create summary of meeting.

The architecture & flow of the POC is as follows:
![POC Architecture & Flow](images/architecture.png 'POC Architecture')


When a user interacts with the POC, the flow is as follows:

1. The user uploads a meeting recording video or audio or .txt file using Upload File button.

1. Meeting recording is already present in Amazon Transcribe Job History Transcription text is retrieved from Job History

1. If Meeting recording is not present in Amazon Transcribe Job history, recording file is temporary upload on S3 and Sent to Amazon Transcribe Job to generate transcription text 

1. Transcription text is sent to Amazon Bedrock LLM for summarization

1. Summarization notes are updated in streamlit app

1. User can download the meeting notes




# How to use this Repo:

## Prerequisites:

1. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed and configured with access to Amazon Bedrock.

1. [Python](https://www.python.org/downloads/) v3.11 or greater. The POC runs on python. 


1. Access to Amazon Transcribe via your CLI Credentials

1. Access to S3 Bucket with put,get,delete object permissions via your CLI credentials and accessible by Transcribe


## Steps
1. Clone the repository to your local machine.

    ```
    git clone https://github.com/aws-samples/genai-quickstart-pocs.git
    ```
    
    The file structure of this POC is broken into these files
    
    * `requirements.txt` - all the requirements needed to get the sample application up and running.
    * `app.py` - The streamlit frontend
    
    
    * `llm.py` - This file has the logic to interact with LLM using Amazon Bedrock API. 
    
    * `transcribe_util.py` - This is the file that contains the logic to interact with Amazon Transcribe like starting Transcribe Job, getting Transcription job history, getting transcription text.
    
    * `s3_util.py` - This is the file that contains the logic to interact with S3 bucket.
    
    

1. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```zsh
    cd genai-quickstart-pocs-python/amazon-bedrock-meeting-minutes-summarization-poc
    ```

1. Configure the python virtual environment, activate it & install project dependencies. *Note: each POC has it's own dependencies & dependency management.*
    ```zsh
    python -m venv .env
    source .env/bin/activate
    pip install -r requirements.txt
    ```

1. Configure S3 Bucket required for temporary uploading the file

Update the S3 Bucket name with your bucket name in **line 21**

**app.py** :

    ```zsh
    S3_BUCKET_NAME = "<YOUR BUCKET NAME>"
    ```


1. Start the POC from your terminal
    ```zsh
    streamlit run app.py
    ```
This should start the POC and open a browser window to the application. 

## How-To Guide
For a details how-to guide for using this poc, visit [HOWTO.md](HOWTO.md)

