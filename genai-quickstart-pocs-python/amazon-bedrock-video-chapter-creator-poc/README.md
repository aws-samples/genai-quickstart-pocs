# Amazon Bedrock Video Chapter Creator POC

## Overview of Solution

This is sample code demonstrating the use of Amazon Transcribe, Amazon OpenSearch Serverless, Amazon Bedrock and Generative AI, to a implement video chapter generator and video search sample.
    The application is constructed with a simple streamlit frontend where users can upload a video that will be stored, transcribed and have searchable chapters generated. Additionally, if you have videos already uploaded to S3 and have subtitles for the video already created in `.srt` format, you can skip transcribing and jump straight into generating chapters.


    The sample also includes a second UI that allows the user to ask about a topic. This will search the video chapters from the videos you&#39;ve provided and provide a video, set to a specific chapter, that was the closest match to the inquiry.

![A gif of a screen recording show casing the Amazon Bedrock Video Chapter Creator POC functionality](images/demo.gif)


## Goal of this POC
The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to create video chapters and searching those chapters. 
      	This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.
      	The application is constructed with a simple streamlit frontend where users can upload a video that will be stored, transcribed and have searchable chapters generated. Additionally, if you have videos already uploaded to S3 and have subtitles for the video already created in `.srt` format, you can skip transcribing and jump straight into generating chapters.
      		The sample also includes a second UI that allows the user to ask about a topic. This will search the video chapters from the videos you&#39;ve provided and provide a video, set to a specific chapter, that was the closest match to the inquiry.


The architecture & flow of the POC is as follows:
![POC Architecture & Flow](images/architecture.png 'POC Architecture')


When a user interacts with the POC, the flow is as follows:

1.    1. The user uploads a video file or provides an uploaded file s3 oject to the streamlit app. 
            2. The streamlit app, takes the video, transcribes it and uses the transcription to determine spots that make sense as chapters.
            3. Each chapter is then sent to the LLM to locate a good spot to start the chapter that gives some context as to the content amd doesn&#39;t drop the user into the middle of the content.
            4. The chapters are then returned to the user, who can then save the chapters to the OpenSearch Collection. 

1. On the search side:
            1. The user asks an inquiry via the streamlit app.
            2. The query is passed the the LLM with the OpenSearch collection as a source.
            3. The OpenSearch collection provides the chapter, which is then returned with the video to set the user to the correct spot in the video. 




# How to use this Repo:

## Prerequisites:

1. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed and configured with access to Amazon Bedrock.

1. [Python](https://www.python.org/downloads/) v3.11 or greater. The POC runs on python. 


1. An OpenSearch Serverless Collection. You can learn how to create one [here](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless-vector-search.html).
*The Easy Create instructions on the document are suitable for this*
Within the Collection, a Vector Index is needed, with a Vector Field called `vectors` with an Engine value of `mmslib`, Dimensions of `1536`. The remaining options can be left with their default values.

1. An Amazon S3-Backed CloudFront Distribution. Videos will be uploaded to this S3 bucket and users will access videos through the CloudFront distribution. You can learn how to deploy the CloudFront an S3 bucket configuration [here](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/GettingStarted.SimpleDistribution.html). 


## Steps
1. Clone the repository to your local machine.

    ```
    git clone https://github.com/aws-samples/genai-quickstart-pocs.git
    ```
    
    The file structure of this POC is broken into these files
    
    * `requirements.txt` - all the requirements needed to get the sample application up and running.
    * `app.py` - The streamlit frontend
    
    
    * `videochapterlogic.py` - This is the logic that the UI connects to. The functions perform the logic and API calls to the AWS service endpoints like Amazon Transcribe, Amazon Bedrock, etc. `app.py` imports `videochapterlogic` functions.
    
    * `environment.toml` - This is the file that contains the configurations specific to your AWS environment like the S3 Bucket or OpenSearch Collection endpoint. The values in this file are required in order for the application to function.
    
    * `.streamlit/config.toml` - The streamlit configuration file with paremters set to override the default configuration. Generally you won&#39;t need to adjust this unless you want to further customize the streamlit app. 
    
    

1. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```zsh
    cd genai-quickstart-pocs-python/amazon-bedrock-video-chapter-creator-poc
    ```

1. Configure the python virtual environment, activate it & install project dependencies. *Note: each POC has it's own dependencies & dependency management.*
    ```zsh
    python -m venv .env
    source .env/bin/activate
    pip install -r requirements.txt
    ```

1. Now that the requirements have been successfully installed in your virtual environment we can begin configuring environment variables.

Open the `environment.toml` file and fill in the properties with your resources


1. Start the POC from your terminal
    ```zsh
    streamlit run app.py
    ```
This should start the POC and open a browser window to the application. 

## How-To Guide
For a details how-to guide for using this poc, visit [HOWTO.md](HOWTO.md)

