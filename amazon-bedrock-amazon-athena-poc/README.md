# Amazon-Bedrock-Amazon-Athena-POC

This is sample code demonstrating the use of Amazon Bedrock and Generative AI to use natural language questions to query relational data stores, specifically Amazon Athena. This example leverages the MOMA Open Source Database: https://github.com/MuseumofModernArt/collection.

![Alt text](images/demo.gif)
# **Goal of this Repo:**

The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to take natural language questions, and transform them into relational database queries against Amazon Athena.
This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.

The architecture and flow of the sample application will be:

![Alt text](images/architecture.png "POC Architecture")

When a user interacts with the GenAI app, the flow is as follows:

1. The user makes a request, asking a natural language question based on the database available in Amazon Athena to the GenAI app (app.py).
2. This natural language question is passed into Amazon Bedrock, which takes the natural language question and creates a SQL query (amazon_athena_bedrock_query.py).
3. The created SQL query is then executed against your Amazon Athena database to begin retrieving the data (amazon_athena_bedrock_query.py).
4. The data is retrieved from your Amazon Athena Database and is passed back into Amazon Bedrock, to generate a natural language answer based on the retrieved data (amazon_athena_bedrock_query.py).
5. The LLM returns a natural language response to the user through the streamlit frontend based on the retrieved data (app.py).

# How to use this Repo:

## Prerequisites:

1. Amazon Bedrock Access and CLI Credentials.
2. Amazon Athena Access and the ability to create a Amazon Athena database and tables.
3. Ensure Python 3.10 installed on your machine, it is the most stable version of Python for the packages we will be using, it can be downloaded [here](https://www.python.org/downloads/release/python-3100/).
4. Please note that this project leverages the [langchain-experimental](https://pypi.org/project/langchain-experimental/) package which has known vulnerabilities.

## Step 1:

The first step of utilizing this repo is performing a git clone of the repository.

```
git clone https://github.com/aws-samples/genai-quickstart-pocs.git
```

After cloning the repo onto your local machine, open it up in your favorite code editor.The file structure of this repo is broken into 4 key files,
the app.py file, the amazon_athena_bedrock_query.py file, the moma_examples.yaml file, and the requirements.txt. The app.py file houses the frontend application (streamlit app).
The amazon_athena_bedrock_query.py file contains connectors into your Amazon Athena database and the interaction with Amazon Bedrock through LangChains SQLDatabaseChain.
The moma_examples.yaml file contains several samples prompts that will be used to implement a few-shot prompting technique. Last, the requirements.txt
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

Now that all the requirements have been successfully installed in your virtual environment we can begin configuring environment variables.
You will first need to create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:

```
profile_name=<AWS_CLI_PROFILE_NAME>
aws_access_key_id=<AWS_ACCESS_KEY_ID>
aws_secret_access_key=<AWS_SECRET_ACCESS_KEY>
region_name=<AWS_REGION>
database_name=<ATHENA_DATABASE_NAME>
s3_staging_dir=<S3_STAGING_DIRECTORY_BUCKET_PATH>  example -> s3://sample-bucket/
```

Please ensure that your AWS CLI Profile has access to Amazon Bedrock!

Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure lines 19-25 in the amazon_athena_bedrock_query.py file:

```
llm = Bedrock(
    credentials_profile_name=os.getenv("profile_name"),
    model_id="amazon.titan-text-express-v1",
    endpoint_url="https://bedrock-runtime.us-east-1.amazonaws.com",
    region_name="us-east-1",
    verbose=True
)
```

# Step 4

If you would like to use this repo with the sample data, you will need to upload the two sample data files found in the sample data directory as two individual tables to your Amazon Athena Database.

If you preferred to use your own database/tables in your Amazon Athena database, I would highly recommend reviewing the moma_examples.yaml file in the SampleData directory to see how prompts are constructed for this sample application and spend the time creating 5 - 10 prompts that resemble your dataset more closely.

# Step 5

At this point the application should be ready to go. To start up the application with its basic frontend you simply need to run the following command in your terminal while in the root of the repositories' directory:

```
streamlit run app.py
```

As soon as the application is up and running in your browser of choice you can begin asking natural language questions against your Amazon Athena Database.
