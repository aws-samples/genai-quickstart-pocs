import boto3
import os
import json
import botocore.config
from dotenv import load_dotenv

# loading environment variables
load_dotenv()
# configure Bedrock client
boto3.setup_default_session(profile_name=os.getenv("profile_name"))
config = botocore.config.Config(connect_timeout=120, read_timeout=120)
bedrock = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock-runtime.us-east-1.amazonaws.com',
                       config=config)

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

def generate_doc(user_input) -> str:
    """
    This function is responsible for orchestrating the call to the invoke_llm function that creates the first version
    of the document.
    :param user_input: The details the user is expecting to be contained in the document.
    :return: The first draft of the document the user is trying to create based on the details provided.
    """
    # TODO: EDIT THIS DOCUMENT TEMPLATE TO CONFORM TO THE DOCUMENT FORMAT YOU ARE TRYING TO CREATE
    doc_template = """
    (Press release Style Headline -should be in bold)
    	(Subheader Title: A one sentence summary)
    (LOCATION) - (DATE) - (First paragraph: summary of the service/product/feature "launch")
    (Second Paragraph: The second paragraph explains the opportunity or problem that needs to be solved)
    (The third paragraph gives the approach or the solution.)
    (The fourth paragraph quotes an Internal leader.)
    (The fifth paragraph describes the customer experience - how users will discover and use what you propose)
    (The sixth paragraph includes a specific, believable, human-sounding customer testimonial.)
    (The seventh paragraph directs the reader where to go to get started)
    #

    Customer FAQ's 
    [This section will consist of questions and answers relevant to customers and user]
    1. [Question]
    	A: [Answer to Question]
    2. [Question]
    	A: [Answer to Question]
    …
    X. [Question]
    	A: [Answer to Question]

    StakeHolder FAQ's 
    [This section will consist of questions and answers relevant to customers and user]
    1. [Question - Should be professional and concise]
    	A: [Answer to Question - should be professional and relevant]
    2. [Question]
    	A: [Answer to Question]
    …
    X. [Question]
    	A: [Answer to Question]

    Appendices
    [If you used specific data points or references in the section describing your approach, include more complete data set as an appendix. Add relevant well sourced data points and studies]
    Appendix A: (Studies, statistics and Supporting evidence reference material directly relevant to your Press Release - should be detailed, relevant and well sourced)

    Appendix B: (Studies, statistics and Supporting evidence reference material directly relevant to your Press Release - should be detailed, relevant and well sourced)
    …
    Appendix X: (Studies, statistics and Supporting evidence reference material directly relevant to your Press Release - should be detailed, relevant and well sourced)
    """
    # call the invoke_llm function to generate the first draft of the document the user is trying to create
    llmOutput = invoke_llm(bedrock, user_input, doc_template)
    # return the first draft of the document created by the invoke_llm function
    return llmOutput

def refine_doc(llm_output, user_refine) -> str:
    """
    This function is specifically responsible for orchestrating the function calls to the invoke_llm_refine to create
    the refined version of the document created.
    :param llm_output: This variable contains the first draft created by the invoke_llm function which is a document created
    according to the details passed in by the user.
    :param user_refine: This is the feedback passed in by the user on the frontend containing the refinements they expect
    to be implemented in the refined version of the document.
    :return: The final version of the document that includes the refinements that the user specified.
    """
    # TODO: EDIT THIS DOCUMENT TEMPLATE TO CONFORM TO THE DOCUMENT FORMAT YOU ARE TRYING TO CREATE
    doc_template = """
        (Press release Style Headline -should be in bold)
        	(Subheader Title: A one sentence summary)
        (LOCATION) - (DATE) - (First paragraph: summary of the service/product/feature "launch")
        (Second Paragraph: The second paragraph explains the opportunity or problem that needs to be solved)
        (The third paragraph gives the approach or the solution.)
        (The fourth paragraph quotes an Internal leader.)
        (The fifth paragraph describes the customer experience - how users will discover and use what you propose)
        (The sixth paragraph includes a specific, believable, human-sounding customer testimonial.)
        (The seventh paragraph directs the reader where to go to get started)
        #

        Customer FAQ's 
        [This section will consist of questions and answers relevant to customers and user]
        1. [Question]
        	A: [Answer to Question]
        2. [Question]
        	A: [Answer to Question]
        …
        X. [Question]
        	A: [Answer to Question]

        StakeHolder FAQ's 
        [This section will consist of questions and answers relevant to customers and user]
        1. [Question - Should be professional and concise]
        	A: [Answer to Question - should be professional and relevant]
        2. [Question]
        	A: [Answer to Question]
        …
        X. [Question]
        	A: [Answer to Question]

        Appendices
        [If you used specific data points or references in the section describing your approach, include more complete data set as an appendix. Add relevant well sourced data points and studies]
        Appendix A: (Studies, statistics and Supporting evidence reference material directly relevant to your Press Release - should be detailed, relevant and well sourced)

        Appendix B: (Studies, statistics and Supporting evidence reference material directly relevant to your Press Release - should be detailed, relevant and well sourced)
        …
        Appendix X: (Studies, statistics and Supporting evidence reference material directly relevant to your Press Release - should be detailed, relevant and well sourced)
        """
    # call the invoke_llm_refine function to generate the refined draft of the document that the user is trying to create
    llmOutput = invoke_llm_refine(bedrock,user_refine, llm_output, doc_template)
    # return the refined version of the document create by the invoke_llm_refine function
    return llmOutput