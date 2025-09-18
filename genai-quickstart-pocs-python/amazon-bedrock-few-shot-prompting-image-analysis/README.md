# **Amazon-Bedrock-Few-Shot-Prompting-Image-Analysis**
This is a sample code demonstrating the use of Amazon Bedrock and Multi-Modal Generative AI models from Anthropic with image based few-shot prompting to implement an image analysis use case. 
The application is constructed with a simple streamlit frontend where users can upload a jpeg or png image and get analysis of the image.

![a screen capture of the demo in action](images/demo.gif)

# **Goal of this Repo:**
The goal of this repo is to provide users with the ability to provide a solution for grocery stores managers to analyze images with Generative AI and receive relevant notifications. This can be integrated into applications like alarm dashboards, notification services, object detection and more. This repo comes with a basic streamlit front-end to help users stand up a proof of concept and experiment with image analysis use-cases quickly.

The architecture and flow of the sample application will be:
![Alt text](images/architecture.png "POC Architecture")

When a user interacts with the GenAI app, the flow is as follows:

1.	The user uploads an image for bedrock model to analyze.
2.	The streamlit app, takes the image input, and invokes Amazon Bedrock to generate a description.
3.	Amazon Bedrock returns the analysis description and displays it on the streamlit app.


# How to use this Repo:

## Prerequisites:

1. Amazon Bedrock Access and CLI Credentials. Ensure that the proper FM model access is provided in the Amazon Bedrock console
2. Ensure Python 3.10 installed on your machine, it is the most stable version of Python for the packages we will be using, it can be downloaded [here](https://www.python.org/downloads/release/python-3911/).

## Step 1:

The first step of utilizing this repo is performing a git clone of the repository.

```
git clone https://github.com/aws-samples/genai-quickstart-pocs.git
```
After cloning the repo onto your local machine, open it up in your favorite code editor. The file structure of this repo is broken into 2 key files, the banana.py file, and the requirements.txt. The banana.py file houses the frontend application (a streamlit app) and the logic of the application, including the Amazon Bedrock API invocations to generate descriptions of an image. The requirements.txt file contains all necessary dependencies for this sample application to work.


## Step 2:

Set up a python virtual environment in the root directory of the repository and ensure that you are using Python 3.10. This can be done by running the following commands:

```
pip install virtualenv
python3.10 -m venv venv
```

The virtual environment will be extremely useful when you begin installing the requirements. If you need more clarification on the creation of the virtual environment please refer to this [blog](https://www.freecodecamp.org/news/how-to-setup-virtual-environments-in-python/).
After the virtual environment is created, ensure that it is activated, following the activation steps of the virtual environment tool you are using. Likely:

```
cd venv
cd bin
source activate
cd ../../
```

After your virtual environment has been created and activated, you can install all the requirements found in the requirements.txt file by running this command in the root of this repos directory in your terminal:

```
pip install -r requirements.txt
```

## Step 3:

Now that the requirements have been successfully installed in your virtual environment we can begin configuring environment variables.
You will first need to create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:

```
profile_name=<AWS_CLI_PROFILE_NAME>
```

Please ensure that your AWS CLI Profile has access to Amazon Bedrock!

Depending on the region and model that you are planning to use with Amazon Bedrock (please note that only a few models can analyze images), you may need to reconfigure model paramaters in the image_analysis file. You might also choose to customize your prompts if this POC is for an industry-specific use-case analyzing a specific type of image:

```python
brclient = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock-runtime.us-east-1.amazonaws.com',config=config)

#model params
model_id = "anthropic.claude-3-sonnet-20240229-v1:0"
```
You may also choose to customize the system prompt to align with a specific use-case, or to get specific responses back about your images.

```python
system_prompt = "You are an expert in image analysis and classification. The question will be contained within the <question></question> tags. Before answering, think step by step in <thinking> tags as you analyze every part of the image. Provide your answer within the <answer></answer> tags. Incude a JSON structured response describing image attributes contained within the <json></json> tags. Always add line breaks between each section of your response"
```

## Step 4:

As soon as you have successfully cloned the repo, created a virtual environment, activated it, installed the requirements.txt, and created a .env file, your application should be ready to go.
To start up the application with its basic frontend you simply need to run the following command in your terminal while in the root of the repositories' directory:

```
streamlit run app.py
```
As soon as the application is up and running in your browser of choice you can begin analyzing JPEG or PNG images!