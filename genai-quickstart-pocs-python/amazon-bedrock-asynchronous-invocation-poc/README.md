# Amazon Bedrock Asynchronous Invocation POC

## Overview of Solution

This is sample code demonstrating the use of Amazon Bedrock and Generative AI to perform asynchronous invocations of large language models. The application is constructed with a simple streamlit frontend where users can input zero shot requests directly against the LLM of their choice, leveraging asynchronous invocations, to invoke 3 models simultaneously to reduce overall latency.

![A gif of a screen recording show casing the Amazon Bedrock Asynchronous Invocation POC functionality](images/demo.gif)


## Goal of this POC
The goal of this repo is to provide users the ability to use Amazon Bedrock and Generative AI to perform asynchronous invocations of large language models. The application is constructed with a simple streamlit frontend where users can input zero shot requests directly against the LLM of their choice, leveraging asynchronous invocations, to invoke 3 models simultaneously to reduce overall latency.

The architecture & flow of the POC is as follows:
![POC Architecture & Flow](images/architecture.png 'POC Architecture')


When a user interacts with the POC, the flow is as follows:

1. The user makes a request, asking a natural language question based on the data in Amazon RDS to the GenAI app (app.py).

1. This natural language question is passed into Amazon Bedrock, which takes the natural language question and creates a SQL query (amazonRDS_bedrock_query.py).

1. The created SQL query is then executed against your Amazon RDS database to begin retrieving the data (amazonRDS_bedrock_query.py).

1. The data is retrieved from your Amazon RDS Database and is passed back into Amazon Bedrock, to generate a natural language answer based on the retrieved data (amazonRDS_bedrock_query.py).

1. The LLM returns a natural language response to the user through the streamlit frontend based on the retrieved data (app.py).




# How to use this Repo:

## Prerequisites:

1. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed and configured with access to Amazon Bedrock.

1. [Python](https://www.python.org/downloads/) v3.11 or greater. The POC runs on python. 



## Steps
1. Clone the repository to your local machine.

    ```
    git clone https://github.com/aws-samples/genai-quickstart-pocs.git
    ```
    
    The file structure of this POC is broken into these files
    
    * `requirements.txt` - all the requirements needed to get the sample application up and running.
    * `app.py` - The streamlit frontend
    
    
    * `app.py` - contains the streamlit frontend and the interaction with Amazon Bedrock
    
    * `amazon_bedrock_query.py` - contains connectors into your Amazon Bedrock LLMs and the interaction
    
    

1. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```zsh
    cd genai-quickstart-pocs-python/amazon-bedrock-asynchronous-invocation-poc
    ```

1. Configure the python virtual environment, activate it & install project dependencies. *Note: each POC has it's own dependencies & dependency management.*
    ```zsh
    python -m venv .env
    source .env/bin/activate
    pip install -r requirements.txt
    ```

1. Create a .env file in the root folder of this POC. Within the .env file you just created you will need to configure the .env to contain:

    ```zsh
    profile_name=<aws_cli_profile_name>region_name=us-east-1
    ```


1. Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure line 86 in the asynchronous_invocation.py file. Currently, this application is only suited to use Anthropic models:

    ```zsh
    async def orchestrator(question, modelID1="anthropic.claude-3-sonnet-20240229-v1:0", modelID2="anthropic.claude-3-haiku-20240307-v1:0", modelID3='anthropic.claude-v2:1'):
    result = await asyncio.gather(main(question, modelID1), main(question, modelID2), main(question, modelID3))
    print(result)
    return result
    ```


1. Start the POC from your terminal
    ```zsh
    streamlit run app.py
    ```
This should start the POC and open a browser window to the application. 

## How-To Guide
For a details how-to guide for using this poc, visit [HOWTO.md](HOWTO.md)

