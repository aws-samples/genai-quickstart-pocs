# Amazon-Bedrock-Document-Generator

This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement a document generation use case. The application is constructed with a simple streamlit frontend where users can provide details and create a document in the exact format that the you specify.

![Alt text](images/demo.gif)

# **Goal of this Repo:**

The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to perform document generation based on a document template and details inputted by the user.
This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.

The architecture and flow of the sample application will be:

![Alt text](images/architecture.png "POC Architecture")

When a user interacts with the GenAI app, the flow is as follows:

1. The user inserts document details that they would like included in the generated document within the streamlit app. (app.py).
2. The streamlit app, takes the document details, and invokes Amazon Bedrock to generate sample document that matches the document structure stated in the prompt containing the inserted document details (doc_generator.py).
3. Amazon Bedrock generates a first draft of the sample document and presents it to the frontend (app.py).
4. The user inserts refinement details highlighting areas where they would like to add refinements to the previously generated document (app.py).
5. The streamlit app takes the refinement details, passes it to Amazon Bedrock along with the document prompt, and the original draft of the document to begin creating the refined version (doc_generator.py).
6. Amazon Bedrock is used to generate the refined version of the document based on the user defined refinements and presents it on the frontend (app.py).

# How to use this Repo:

## Prerequisites:

1. Amazon Bedrock Access and CLI Credentials.
2. Ensure Python 3.10 installed on your machine, it is the most stable version of Python for the packages we will be using, it can be downloaded [here](https://www.python.org/downloads/release/python-3911/).

## Step 1:

The first step of utilizing this repo is performing a git clone of the repository.

```
git clone https://github.com/aws-samples/genai-quickstart-pocs.git
```

After cloning the repo onto your local machine, open it up in your favorite code editor. The file structure of this repo is broken into 3 key files,
the app.py file, the doc_generator.py file, and the requirements.txt. The app.py file houses the frontend application (a streamlit app).
The doc_generator.py file houses the logic of the application, including the prompt formatting logic and Amazon Bedrock API invocations.
The requirements.txt file contains all necessary dependencies for this sample application to work.

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

Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure line 12 in the document_generator.py file to set the appropriate region:

```
bedrock = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock-runtime.us-east-1.amazonaws.com')
```

Since this repository is configured to leverage Claude 3, the prompt payload is structured in a different format. If you wanted to leverage other Amazon Bedrock models you can replace the invoke_llm() function in the document_generator.py to look like:

```python
def invoke_llm(bedrock, user_input, doc_template) -> str:
    """
    Creates the initial version of the document based on the details provided by the user.
    :param bedrock: The Amazon Bedrock client that will be used to orchestrate the LLM.
    :param user_input: The details the user is providing to generate the first draft of the document.
    :param doc_template: The document template that the output of the LLM should conform to, to help format and structure
     it more accordingly
    :return: The initial document formatted according to the document template that you pass in with the details provided
    by the user on the front end.
    """

    # Setup Prompt - This prompt passes in the document template and the user input to generate the first draft of the
    # document the user is looking to create
    prompt_data = f"""

Human:

Generate a document based on the user input and the instructions and format provided in the Document Template below  
The tehcnical document should be human readable, well formatted, and broken into the relveant sections.
Response should be in valid Markdown syntax 
###

<Document_Template>
{doc_template}
</Document_Template>
###
<User_Input>
{user_input}
</User_Input>
###

Assistant: Here is a draft based on the provided user input and template

"""
    # Add the prompt to the body to be passed to the Bedrock API along with parameters
    body = json.dumps({"prompt": prompt_data,
                       "max_tokens_to_sample": 5000,
                       "temperature": .2,
                       "stop_sequences": []
                       })
    # configure the modelID of the model you are trying to use
    modelId = "anthropic.claude-v2"  # change this to use a different version from the model provider if you want to switch
    accept = "application/json"
    contentType = "application/json"
    # Call the Bedrock API, and invoke the LLM Model of your choice
    response = bedrock.invoke_model(
        body=body, modelId=modelId, accept=accept, contentType=contentType
    )
    # Parse the Response and store it in the llmOutput variable
    response_body = json.loads(response.get('body').read())
    llmOutput = response_body.get('completion')
    # Return the LLM response
    return llmOutput
```
You can also change the invoke_llm_refine() function within the document_generator.py file to look like:

```python
def invoke_llm_refine(bedrock, user_feedback, previous_version, doc_template) -> str:
    """
    This function is specifically focused on refining the document created by invoke_llm, and refining it based on the feedback
    the user is passing in through the frontend.
    :param bedrock: The Amazon Bedrock client that will be used to orchestrate the LLM.
    :param user_feedback: The feedback the user provides through the frontend that contains the addition/changes they would like
    to be made against the original document that was created.
    :param previous_version: This is the original document that was created by the invoke_llm function call.
    :param doc_template: The document template that the output of the LLM should conform to, to help format and structure
     it more accordingly.
    :return: The final version of the document that contains the refinements of the original document specified by the user.
    """
    # Setup Prompt - This prompt passes in the document template and the user feedback, and the previous version to generate the refined draft of the
    # document the user is looking to create.
    prompt_data = f"""

Human:

Refine and Adjust the provided document based on the user feedback and following structure and format guidelines in the Document Template
Response should be in valid Markdown syntax 

###
<document_to_be_refined>
{previous_version}
</document_to_be_refined>

<User_feedback>
{user_feedback}
</User_feedback>

<Document_Template>
{doc_template}
</Document_Template>
###

Assistant: Here is a modified draft press release based on the provided user feedback

"""
    # Add the prompt to the body to be passed to the Bedrock API along with parameters
    body = json.dumps({"prompt": prompt_data,
                       "max_tokens_to_sample": 5000,
                       "temperature": .2,
                       "stop_sequences": []
                       })
    # configure the modelID of the model you are trying to use
    modelId = "anthropic.claude-v2"  # change this to use a different version from the model provider if you want to switch
    accept = "application/json"
    contentType = "application/json"
    # Call the Bedrock API, and invoke the LLM Model of your choice
    response = bedrock.invoke_model(
        body=body, modelId=modelId, accept=accept, contentType=contentType
    )
    # Parse the Response and store it in the llmOutput variable
    response_body = json.loads(response.get('body').read())
    llmOutput = response_body.get('completion')
    # Return the LLM response
    return llmOutput
```
You can then change the modelId variable to the model of your choice.

## Step 4:

As soon as you have successfully cloned the repo, created a virtual environment, activated it, installed the requirements.txt, and created a .env file, your application should be ready to go.
To start up the application with its basic frontend you simply need to run the following command in your terminal while in the root of the repositories' directory:

```
streamlit run app.py
```

As soon as the application is up and running in your browser of choice you can begin generating documents based on your specific formatting and details, while also being able to add refinements along the way.
