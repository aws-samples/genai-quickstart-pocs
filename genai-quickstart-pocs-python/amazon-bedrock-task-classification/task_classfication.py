import boto3
import json
import botocore.config
import os
from dotenv import load_dotenv

load_dotenv()

boto3.setup_default_session(profile_name=os.getenv('profile_name'))

config = botocore.config.Config(connect_timeout=120, read_timeout=120)

bedrock = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url = 'https://bedrock-runtime.us-east-1.amazonaws.com', config=config)

task_classfication_prompt = """
Classify the task given to you to invoke the most appropriate next step to process this task.

Inputs:
You will be provided a user generated text consist of a task information. It will belong to 1 of the 3 work flows, determine which one it is. Reply with only the task name.
The 3 Work flows are:

1. Retrieve data from a SQL database:  
If the task input is in this category, reply: 'SQL data retrieval.' 
This task will require you to fetch some data from a database (doesn't exist but pretend that it does). Assume that you have all the credentials, information, and workflow for this database. Reply with some fictitious data. 

2. Draft and send an email: 
If the task input is in this category, reply: 'Send an email.'
This task will require you to draft a new email to specified recipient or reply to en existing email thread. Write this draft in a formal and professional tone

3. Gather documentation: 
If the task input is in this category, reply: 'Gather documentation.'
This task will require you to search up some documentation that solves the problem description that comes with the task input. You will have to search up results and find the most relevant information for the question at hand.

Requirements: 
- You are going to reply with 2 items, wrap the first item in <class> </class>, and the second item in <extra> </extra>:
1. Determine the approriate workflow the task description belongs to, reply only with the task name. 
2. Format your response for the task inputted
"""

# helper function
def parse_xml(xml, tag):
    start_tag = f"<{tag}>"
    end_tag = f"</{tag}>"

    start_index = xml.find(start_tag)
    if start_index == -1:
        return ""
    
    end_index = xml.find(end_tag)
    if end_index == -1:
        return ""

    value = xml[start_index+len(start_tag):end_index]
    return value

def llm_task_classification(question):
    modelID = 'anthropic.claude-3-haiku-20240307-v1:0'
    accept= 'application/json'
    contentType = 'application/json'

    native_request = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 512,
        "temperature": 0.0,
        "system": task_classfication_prompt,
        "max_tokens": 500,
        "messages": [
            {
                "role": "user",
                "content": [{"type": "text", "text": question }],
            }
        ],
    }

    request = json.dumps(native_request)

    response = bedrock.invoke_model(
        body=request,
        modelId = modelID,
        accept = accept,
        contentType = contentType
    )

    model_response = json.loads(response["body"].read())
    response_text = model_response["content"][0]['text']

    class_tag = parse_xml(response_text,"class")
    extra_content = parse_xml(response_text,"extra")


    if response_text:
        return class_tag, extra_content
