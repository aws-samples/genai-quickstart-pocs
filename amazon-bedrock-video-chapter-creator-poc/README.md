# Amazon-Bedrock-Video-Chapter-Creator-POC

This is sample code demonstrating the use of Amazon Transcribe, Amazon OpenSearch Serverless, Amazon Bedrock and Generative AI, to a implement video chapter generator and video search sample. The application is constructed with a simple streamlit frontend where users can upload a video that will be stored, transcribed and have searchable chapters generated. Additionally, if you have videos already uploaded to S3 and have subtitles for the video already created in `.srt` format, you can skip transcribing and jump straight into generating chapters.

The sample also includes a second UI that allows the user to ask about a topic. This will search the video chapters from the videos you've provided and provide a video, set to a specific chapter, that was the closest match to the inquiry.

![Amazon Bedrock Video Chapter Creator POC Demo](images/demo.gif)

# **Goal of this Repo:**

The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to create video chapters and searching those chapters. 
This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.

The architecture and flow of the sample application will be:

![Alt text](ingest-transcribe-query-workflow.png "POC Architecture")

When a user interacts with the app, the flow is as follows:

1. The user uploads a video file or provides an uploaded file s3 oject to the streamlit app. 
2. The streamlit app, takes the video, transcribes it and uses the transcription to determine spots that make sense as chapters.
3. Each chapter is then sent to the LLM to locate a good spot to start the chapter that gives some context as to the content amd doesn't drop the user into the middle of the content.
4. The chapters are then returned to the user, who can then save the chapters to the OpenSearch Collection. 

On the search side:
1. The user asks an inquiry via the streamlit app.
2. The query is passed the the LLM with the OpenSearch collection as a source.
3. The OpenSearch collection provides the chapter, which is then returned with the video to set the user to the correct spot in the video. 

# How to use this Repo:

## Prerequisites:

1. Ensure Python 3.11 installed on your machine, it is the most stable version of Python for the packages we will be using, it can be downloaded [here](https://www.python.org/downloads/release/python-3911/).
2. An OpenSearch Serverless Collection. You can learn how to create one [here](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless-vector-search.html).
*The Easy Create instructions on the document are suitable for this*
Within the Collection, a Vector Index is needed, with a Vector Field called `vectorfield` with an Engine value of `mmslib`, Dimensions of `1536`. The remaining options can be left with their default values.

    Note the endpoint for the collection and the name of the index as you will need to use this later. 
3. An Amazon S3-Backed CloudFront Distribution. Videos will be uploaded to this S3 bucket and users will access videos through the CloudFront distribution. You can learn how to deploy the CloudFront an S3 bucket configuration [here](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/GettingStarted.SimpleDistribution.html). 

    Note the hostname of the CloudFront Distribution and the S3 Bucket name and region - you will need this later. 
4. Amazon Bedrock Access and CLI Credentials. Ensure that the proper FM model access is provided in the Amazon Bedrock console, as well as access to the resources mentioned in previous prerequisites

## Step 1:

The first step of utilizing this repo is performing a git clone of the repository.

```
git clone https://github.com/aws-samples/genai-quickstart-pocs.git
```

After cloning the repo onto your local machine, open it up in your favorite code editor. 


## Step 2:

Set up a python virtual environment in the root directory of the repository and ensure that you are using Python 3.11. This can be done by running the following commands (The commands assume you are starting in the root folder of the repository):

```
cd amazon-bedrock-video-chapter-creator-poc/
pip install virtualenv
python3.11 -m venv venv
```

The virtual environment will be extremely useful when you begin installing the requirements. If you need more clarification on the creation of the virtual environment please refer to this [blog](https://www.freecodecamp.org/news/how-to-setup-virtual-environments-in-python/).
After the virtual environment is created, ensure that it is activated, following the activation steps of the virtual environment tool you are using. Likely:

```
source venv/bin/activate
```

After your virtual environment has been created and activated, you can install all the requirements found in the requirements.txt file by running this command in the root of this repos directory in your terminal:

```
pip install -r requirements.txt
```

## Step 3:
 
Now that the requirements have been successfully installed in your virtual environment we can begin configuring environment variables.

Open the `environment.toml` file and fill in the properties with your resources

## Step 4:

As soon as you have successfully cloned the repo, created a virtual environment, activated it, installed the requirements.txt, and setup your environment.toml, your application should be ready to go.
To start up the application with its basic frontend you simply need to run the following command in your terminal:

**Running the UI**
```
streamlit run app.py
```

# POC Environment
This section will walk you through the various files that exist in this POC directory.

* `app.py` - This the main application that generates the UI through streamlit. (See above).
* `videochapterlogic.py` - This is the logic that the UI connects to. The functions perform the logic and API calls to the AWS service endpoints like Amazon Transcribe, Amazon Bedrock, etc. `app.py` imports `videochapterlogic` functions.
* `environment.toml` - This is the file that contains the configurations specific to your AWS environment like the S3 Bucket or OpenSearch Collection endpoint. The values in this file are required in order for the application to function.
* `.streamlit/config.toml` - The streamlit configuration file with paremters set to override the default configuration. Generally you won't need to adjust this unless you want to further customize the streamlit app. 
* `requirements.txt` - The python packages required for the app to function. You will reference this during setup (see above).