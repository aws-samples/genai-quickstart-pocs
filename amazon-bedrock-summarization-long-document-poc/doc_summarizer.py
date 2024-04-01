import boto3
import json
import os
import botocore.config
from dotenv import load_dotenv
from langchain.text_splitter import CharacterTextSplitter, RecursiveCharacterTextSplitter
from pypdf import PdfReader

# loading environment variables
load_dotenv()
# configure Bedrock client
boto3.setup_default_session(profile_name=os.getenv("profile_name"))
config = botocore.config.Config(connect_timeout=120, read_timeout=120)
bedrock = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock-runtime.us-east-1.amazonaws.com',
                       config=config)

def summarizer(prompt_data) -> str:
    """
    This function creates the summary of each individual chunk as well as the final summary.
    :param prompt_data: This is the prompt along with the respective chunk of text, at the end it contains all summary chunks combined.
    :return: A summary of the respective chunk of data passed in or the final summary that is a summary of all summary chunks.
    """
    # setting the key parameters to invoke Amazon Bedrock
    # body of data with parameters that is passed into the bedrock invoke model request
    # TODO: TUNE THESE PARAMETERS AS YOU SEE FIT
    prompt = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1000,
        "temperature": 0.5,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt_data
                    }
                ]
            }
        ]
    }
    # formatting the prompt as a json string
    json_prompt = json.dumps(prompt)
    # invoking Claude3, passing in our prompt
    # anthropic.claude-3-haiku-20240307-v1:0
    # anthropic.claude-3-sonnet-20240229-v1:0
    response = bedrock.invoke_model(body=json_prompt, modelId="anthropic.claude-3-haiku-20240307-v1:0",
                                    accept="application/json", contentType="application/json")
    # getting the response from Claude3 and parsing it to return to the end user
    response_body = json.loads(response.get('body').read())
    # the final string returned to the end user
    answer = response_body['content'][0]['text']
    # returning the final string to the end user
    return answer


def Chunk_and_Summarize(uploaded_file) -> str:
    """
    This function takes in the path to the file that was just uploaded through the streamlit app.
    :param uploaded_file: This is a file path, that should point to the newly uploaded file that is temporarily stored
    within the directory of this application.
    :return: This returns the final summary of the PDF document that was initially passed in by the user through the
    streamlit app.
    """
    # using PyPDF PdfReader to read in the PDF file as text
    reader = PdfReader(uploaded_file)
    # creating an empty string for us to append all the text extracted from the PDF
    text = ""
    # a simple for loop to iterate through all pages of the PDF we uploaded
    for page in reader.pages:
        # as we loop through each page, we extract the text from the page and append it to the "text" string
        text += page.extract_text() + "\n"
    # creating the text splitter, we are specifically using the the recursive text splitter from langchain:
    # https://python.langchain.com/docs/modules/data_connection/document_transformers/text_splitters/recursive_text_splitter
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100,
        length_function=len,
        add_start_index=True
    )
    # using the text splitter to split the entire string of text that contains all the text content of our PDF
    texts = text_splitter.create_documents([text])
    # Creating an empty summary string, as this is where we will append the summary of each chunk
    summary = ""
    # looping through each chunk of text we created, passing that into our prompt and generating a summary of that chunk
    for index, chunk in enumerate(texts):
        # gathering the text content of that specific chunk
        chunk_content = chunk.page_content
        # creating the prompt that will be passed into Bedrock with the text content of the chunk
        prompt = f"""\n\nHuman: Provide a detailed summary for the chunk of text provided to you:
        Text: {chunk_content}
        \n\nAssistant:"""
        # passing the prompt into the summarizer function to generate the summary of that chunk, and appending it to
        # the summary string
        summary += summarizer(prompt)
        # printing out the number of tokens contained in each chunk to provide a status update
        print(f"\n\nChunk: {index + 1}")
        print("-------------------------------------------------------------------------------------------------------")
    # after we have generated the summaries of each chunk of text, and appended them to the single summary string,
    # we pass it into the final summary prompt
    final_summary_prompt = f"""\n\nHuman: You will be given a set of summaries from a document. Create a cohesive 
    summary from the provided individual summaries. The summary should very detailed. 
    Summaries: {summary}
            \n\nAssistant:"""
    # generating the final summary of all the summaries we have previously generated.
    return summarizer(final_summary_prompt)

