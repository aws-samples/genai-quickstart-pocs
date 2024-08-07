# Amazon-Bedrock-Claude3-Long-Form-Output-POC

This is sample code demonstrating the use of Amazon Bedrock and Generative AI to translate text from a source to target language.

![Alt text](images/demo.gif)

# **Goal of this Repo:**

The goal of this repository is to provide users with the ability to use Amazon Bedrock to generate long form content. This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.

The architecture and flow of the sample application will be:

![Alt text](images/architecture.png "POC Architecture")

When a user interacts with the translation app they can choose from 3 interfaces (pages), the flow is as follows for each of the pages:

Text:
1. The user either selects the default prompt or inputs a prompt.
2. The application constructs the appropriate prompt and sends it to Amazon Bedrock.
3. The appliction recieves and sends the text to Amazon Bedrock for analysis of accuracy and fluency.
4. The generated text and analysis is displayed on the frontend application.

File:
1. The user uploads a text/pdf file and selects the processing type (eg: Tranlsation).
2. The application constructs the appropriate prompt for the processing and sends it to Amazon Bedrock.
3. The generated text from the document is displayed on the frontend application.

# How to use this Repo:

## Prerequisites:

1. Amazon Bedrock Access and CLI Credentials. Ensure that the proper FM model access is provided in the Amazon Bedrock console
2. Ensure Python 3.10 installed on your machine, it is the most stable version of Python for the packages we will be using, it can be downloaded [here](https://www.python.org/downloads/release/python-3100/).

## Step 1:

The first step of utilizing this repo is performing a git clone of the repository.

```
git clone https://github.com/aws-samples/genai-quickstart-pocs.git
```

After cloning the repo onto your local machine, open it up in your favorite code editor.The file structure of this repo is broken into 5 key files,
the Text.py file, the amazon_bedrock_trnaslation.py file, the Chat.py file, the File.py file, and the requirements.txt file. The Text.py, Chat.py, and File.py files house the frontend application (streamlit app) for their corresponding interface.
The amazon_bedrock_translation.py file contains methods which govern the interaction with Amazon Bedrock.
Last, the requirements.txt
file has all the requirements needed to get the sample application up and running.

## Step 2:

Set up a python virtual environment in the root directory of the repository and ensure that you are using Python 3.9. This can be done by running the following commands:

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

Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure line 23 in the prompt_finder_and_invoke_llm.py file to set the appropriate region:

```
bedrock = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock-runtime.us-east-1.amazonaws.com')
```

Since this repository is configured to leverage Claude 3, the prompt payload is structured in a different format. If you wanted to leverage other Amazon Bedrock models you can replace the modelId variable to the model of your choice and refer to the Bedrock console for the response format

## Step 4:

As soon as you have successfully cloned the repo, created a virtual environment, activated it, installed the requirements.txt, and created a .env file, your application should be ready to go.
To start up the application with its basic frontend you simply need to run the following command in your terminal while in the root of the repositories' directory:

```
streamlit run app.py
```

Once the application is up and running in your browser, you can begin translating text, chats, or files.
