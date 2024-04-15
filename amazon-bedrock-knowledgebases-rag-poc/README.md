# Amazon-Bedrock-RAG-KnowledgeBases-POC

This is sample code demonstrating the use of Amazon Bedrock and Generative AI to create vector embeddings for your data sources using Amazon Bedrock Knowledge bases with the ability ask questions against the stored documents. The application is constructed with a RAG based architecture where users can ask questions against the Knowledge bases.

![Alt text](images/demo.gif)
# **Goal of this Repo:**

The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to take natural language questions, and answer questions against Amazon Bedrock Knowledge bases.
This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.

The architecture and flow of the sample application will be:

![Alt text](images/architecture_diagram.png "POC Architecture")

When a user interacts with the GenAI app, the flow is as follows:

1. The user makes a request to the GenAI app (app.py).
2. The app issues a get contexts query to the Amazon Bedrock Knowledge bases based on the user request. (query_against_knowledgeBases.py)
3. The knowledge bases returns search results related to the relevant documents from the ingested data. (query_against_knowledgeBases.py)
4. The app sends the user request and along with the data retrieved from the Amazon Bedrock Knowlegebases as context in the LLM prompt. (query_against_knowledgeBases.py)
5. The LLM returns a succinct response to the user request based on the retrieved data. (query_against_knowledgeBases.py)
6. The response from the LLM is sent back to the user. (app.py)

# How to use this Repo:

## Prerequisites:

1. Amazon Bedrock Access and CLI Credentials.
2. Appropriate permissions to configure Amazon Bedrock Knowledge bases.
3. Ensure Python 3.9 installed on your machine, it is the most stable version of Python for the packages we will be using, it can be downloaded [here](https://www.python.org/downloads/release/python-3911/).

## Step 1:

The first step of utilizing this repo is performing a git clone of the repository.

```
git clone https://github.com/aws-samples/genai-quickstart-pocs.git
```

After cloning the repo onto your local machine, open it up in your favorite code editor.The file structure of this repo is broken into 3 key files,
the app.py file, the query_against_knowledgebases.py file and the requirements.txt.
The app.py file houses the frontend application (a streamlit app).
The query_against_knowledgeBases.py file houses the logic for taking a user question and letting the LLM generate a response, this includes both the Knowledge bases get contexts calls and Amazon Bedrock LLM API invocation.
The requirements.txt file contains all necessary dependencies for this sample application to work.

## Step 2:

Set up a python virtual environment in the root directory of the repository and ensure that you are using Python 3.9. This can be done by running the following commands:

```
pip install virtualenv
python3.9 -m venv venv
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

Now that we have successfully cloned the repo, created and activated the virtual environment and installed the necessary dependencies, it is time for us to create Amazon Bedrock Knowledge base.

To create our Amazon Bedrock Knowledge base we will:

1. Go to the Amazon Bedrock Service homepage within the AWS console and on the left-hand side we will select "Knowledge bases" under the "Orchestration" drop down ![Alt text](images/amazon_bedrock_homepage.png "Amazon Bedrock Homepage")

2. We will then click on "Create knowledge base" ![Alt text](images/knowledgeBase_homepage.png "Amazon Bedrock Create Knowledge base")

3. In the Knowledge base details section, you can optionally change the default name and provide a description for your knowledge base.In the IAM permissions section, choose an AWS Identity and Access Management (IAM) role that provides Amazon Bedrock permission to access other AWS services. You can let Amazon Bedrock create the service role or choose a custom role that you have created. Optionally, add tags to your knowledge base. Select Next. ![Alt text](images/kb_first_page.png "Knowledge base details")

4. On the Set up data source page, provide the information for the data source to use for the knowledge base: Optionally, change the default Data source name. Provide the S3 URI of the object containing the files for the data source that you prepared. Select Next. ![Alt text](images/kb_datasource_page.png "Set up Data Source")

5. In the Embeddings model section, choose a supported embeddings model to convert your data into vector embeddings for the knowledge base. In the Vector database section, choose Quick create a new vector store and select Next ![Alt text](images/kb_vectordb_page.png "Select Embeddings Model")

6. On the Review and create page, check the configuration and details of your knowledge base. Choose Edit in any section that you need to modify. When you are satisfied, select Create knowledge base.


## Step 4:

Now that the requirements have been successfully installed in your virtual environment, your Bedrock Knowledge base is created, we can now begin configuring environment variables.
You will first need to create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:

```
profile_name=<AWS_CLI_PROFILE_NAME>
knowledge_base_id=<Knowledge Base Id of the the Knowledge Base we created in the previous step>
```

Please ensure that your AWS CLI Profile has access to Amazon Bedrock!

Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure line 13 and 14 in the query_against_knowledgeBases.py file to change the region:

```
bedrock = boto3.client('bedrock-runtime', 'us-east-1')
bedrock_agent_runtime = boto3.client('bedrock-agent-runtime','us-east-1')
```
Since this repository is configured to leverage Claude 3, the prompt payload is structured in a different format. If you wanted to leverage other Amazon Bedrock models you can replace the answer_query() function in the query_against_knowledgeBases.py to look like:

```python
def answer_query(user_input):
    """
    This function takes the user question, queries Amazon Bedrock KnowledgeBases for that question,
    and gets context for the question.
    Once it has the context, it calls the LLM for the response
    :param user_input: This is the natural language question that is passed in through the app.py file.
    :return: The answer to your question from the LLM based on the context from the Knowledge Bases.
    """
    # Setting primary variables, of the user input
    userQuery = user_input
    # getting the contexts for the user input from Bedrock knowledge bases
    userContexts = get_contexts(userQuery, knowledge_base_id)

    # Configuring the Prompt for the LLM
    # TODO: EDIT THIS PROMPT TO OPTIMIZE FOR YOUR USE CASE
    prompt_data = f"""\n\nHuman: You are an AI assistant that will help people answer questions they have about [YOUR TOPIC]. Answer the provided question to the best of your ability using the information provided in the Context. 
    Summarize the answer and provide sources to where the relevant information can be found. 
    Include this at the end of the response.
    Provide information based on the context provided.
    Format the output in human readable format - use paragraphs and bullet lists when applicable
    Answer in detail with no preamble
    If you are unable to answer accurately, please say so.
    Please mention the sources of where the answers came from by referring to page numbers, specific books and chapters!

    Question: {userQuery}

    Here is the text you should use as context: {userContexts}

    \n\nAssistant:

    """
    # Configuring the model parameters, preparing for inference
    # TODO: TUNE THESE PARAMETERS TO OPTIMIZE FOR YOUR USE CASE
    prompt = {"prompt": prompt_data,
                       "max_tokens_to_sample": 4096,
                       "temperature": 0.5,
                       "top_k": 250,
                       "top_p": 0.5,
                       "stop_sequences": []
                       }
    
    # formatting the prompt as a json string
    json_prompt = json.dumps(prompt)    

    # Configuring the specific model you are using
    modelId = "anthropic.claude-v2:1"  # change this to use a different version from the model provider
    
    # invoking Claude2, passing in our prompt
    response = bedrock.invoke_model(body=json_prompt, modelId=modelId,
                                    accept="application/json", contentType="application/json")
                                    
    # getting the response from Claude2 and parsing it to return to the end user
    response_body = json.loads(response.get('body').read())
    
    # the final string returned to the end user
    answer = response_body.get('completion')
    
    # returning the final string to the end user
    return answer
```

You can then change the modelId variable to the model of your choice.


## Step 7:

As soon as you have successfully configured the environment variables and the required code changes, your application should be ready to go.
To start up the application with its basic frontend you simply need to run the following command in your terminal while in the root of the repositories' directory:

```
streamlit run app.py
```

As soon as the application is up and running in your browser of choice you can begin asking natural language questions against the data sources that you configured with Knowledge bases.
