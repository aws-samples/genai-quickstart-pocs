# Amazon-Bedrock-Guardrails-POC

This is sample code demonstrating the use of the Amazon Bedrock Converse API to help with conversation oriented use cases that require context preservation. The application is constructed with a simple streamlit frontend where users can input zero shot requests to Claude 3, with the Amazon Bedrock Converse API in place to allow users to ask context aware questions.

![Alt text](images/demo.gif)
# **Goal of this Repo:**

The goal of this repo is to provide users the ability to use the Amazon Bedrock Converse API to demonstrate its ability to facilitate conversational GenAI use cases that require context awareness.
This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.

The architecture and flow of the sample application will be:

![Alt text](images/architecture.png "POC Architecture")

When a user interacts with the GenAI app, the flow is as follows:

1. The user inserts a text question into to the streamlit app. (app.py).
2. The streamlit app, takes the text inserted by the user and is passed into an Amazon Bedrock Model using the Converse API. The users question is answered, and both the question and answer are stored. (invoke_model_conversation_api.py).
3. The answer to the user's question is returned to the front-end application, and allows users to ask follow up questions as the Converse API help preserve context throughout the users conversation (app.py).

# How to use this Repo:

## Prerequisites:

1. Amazon Bedrock Access and CLI Credentials.
2. Create an Amazon Bedrock Guardrail, information on how to do that can be found [here](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-create.html) 
2. Ensure Python 3.10 installed on your machine, it is the most stable version of Python for the packages we will be using, it can be downloaded [here](https://www.python.org/downloads/release/python-3100/).

## Step 1:

The first step of utilizing this repo is performing a git clone of the repository.

```
git clone https://github.com/aws-samples/genai-quickstart-pocs.git
```

After cloning the repo onto your local machine, open it up in your favorite code editor. The file structure of this repo is broken into 3 key files,
the app.py file, the invoke_model_conversation_api.py file, and the requirements.txt. The app.py file houses the frontend application (a streamlit app). The
invoke_model_conversation_api.py file houses the logic of the application, including the Amazon Bedrock Converse API invocation.
The requirements.txt file contains all necessary dependencies for this sample application to work.

## Step 2:

Set up a python virtual environment in the root of this specific POCs directory and ensure that you are using Python 3.10. This can be done by running the following commands:

```
pip install virtualenv
python3.10 -m venv venv
```

The virtual environment will be extremely useful when you begin installing the requirements. If you need more clarification on the creation of the virtual environment please refer to this [blog](https://www.freecodecamp.org/news/how-to-setup-virtual-environments-in-python/).
After the virtual environment is created, ensure that it is activated, following the activation steps of the virtual environment tool you are using. Likely:

```
source venv/bin/activate
```

After your virtual environment has been created and activated, you can install all the requirements found in the requirements.txt file by running this command in the root of this specific POCs directory in your terminal:

```
pip install -r requirements.txt
```

## Step 3:

Now that the requirements have been successfully installed in your virtual environment we can begin configuring environment variables.
You will first need to create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:

```
profile_name=<CLI_profile_name>
```

Please ensure that your AWS CLI Profile has access to Amazon Bedrock!

## Step 4:

As soon as you have successfully cloned the repo, created a virtual environment, activated it, installed the requirements.txt, and created a .env file, your application should be ready to go.
To start up the application with its basic frontend you simply need to run the following command in your terminal while in the root of the repositories' directory:

```
streamlit run app.py
```

As soon as the application is up and running in your browser of choice you can begin asking text questions and generating natural language responses having the Amazon Bedrock Converse API manage conversation history and context awareness.
