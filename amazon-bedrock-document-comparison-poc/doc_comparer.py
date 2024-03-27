import boto3
import json
import os
import botocore.config
from pypdf import PdfReader
from dotenv import load_dotenv
import yaml
from langchain.prompts.few_shot import FewShotPromptTemplate
from langchain.prompts.prompt import PromptTemplate
from langchain.embeddings.huggingface import HuggingFaceEmbeddings
from langchain.prompts.example_selector.semantic_similarity import (
    SemanticSimilarityExampleSelector,
)
from langchain.vectorstores import Chroma

# loading environment variables
load_dotenv()
# configure Bedrock client
boto3.setup_default_session(profile_name=os.getenv('profile_name'))
config = botocore.config.Config(connect_timeout=120, read_timeout=120)
bedrock = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock-runtime.us-east-1.amazonaws.com',
                       config=config)


def llm_compare(prompt_data) -> str:
    """
    This function uses a large language model to create a list of differences between each uploaded document.
    :param prompt_data: This is the final prompt that contains semantically similar prompts, along with the two documents the user is asking to compare.
    :return: A string containing a list of the differences between the two PDF documents the user uploaded.
    """
    # setting the key parameters to invoke Amazon Bedrock
    body = json.dumps({"prompt": prompt_data,
                       "max_tokens_to_sample": 8191,
                       "temperature": 0,
                       "top_k": 250,
                       "top_p": 0.5,
                       "stop_sequences": []
                       })
    # the specific Amazon Bedrock model we are using
    modelId = 'anthropic.claude-v2'
    # type of data that should be expected upon invocation
    accept = 'application/json'
    contentType = 'application/json'
    # the invocation of bedrock, with all the parameters you have configured
    response = bedrock.invoke_model(body=body,
                                    modelId=modelId,
                                    accept=accept,
                                    contentType=contentType)
    # gathering the response from bedrock, and parsing to get specifically the answer
    response_body = json.loads(response.get('body').read())
    answer = response_body.get('completion')
    # returning the final list of differences between uploaded documents
    return answer


def load_samples():
    """
    Load the generic document comparison examples for few-shot prompting.
    :return: The generic document comparison examples from the sample_prompts/sample_prompt_data.yaml file
    """
    # initializing the generic_samples variable, where we will store our samples once they are read in
    generic_samples = None
    # opening and reading the sample prompts file
    with open("sample_prompts/sample_prompt_data.yaml", "r") as stream:
        # storing the sample files in the generic samples variable we initialized
        generic_samples = yaml.safe_load(stream)
    # returning the string containing all the sample prompts
    return generic_samples


def prompt_finder(question):
    """
    This function performs a semantic search based on the users question against all the sample prompts stored in the
    sample_prompts/sample_prompt_data.yaml file. It finds the three most relevant prompts and formats them into a single prompt
    along with the users question.
    :param question: This is the question that is passed in through the streamlit frontend from the user.
    :return: This function returns a final prompt that contains three semantically similar prompts, the chat history if
    there is any and the users question all formatted in a single prompt ready to be passed into Amazon Bedrock.
    """
    # loading the sample prompts from sample_prompts/sample_prompt_data.yaml
    examples = load_samples()
    # instantiating the hugging face embeddings model to be used to produce embeddings of user queries and prompts
    local_embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    # The example selector loads the examples, creates the embeddings, stores them in Chroma (vector store) and a
    # semantic search is performed to see the similarity between the question and prompts, it returns the 3 most similar
    # prompts as defined by k
    example_selector = SemanticSimilarityExampleSelector.from_examples(
        # This is the list of examples available to select from.
        examples,
        # This is the embedding class used to produce embeddings which are used to measure semantic similarity.
        local_embeddings,
        # This is the VectorStore class that is used to store the embeddings and do a similarity search over.
        Chroma,
        # This is the number of examples to produce.
        # TODO: Can change this number to determine how many prompts you want to retrieve
        k=3
    )
    # This is formatting the prompts that are retrieved from the sample_prompts/sample_prompt_data.yaml file
    example_prompt = PromptTemplate(input_variables=["prompt", "assistant"],
                                    template="\n\nHuman: {prompt} \n\nAssistant: "
                                             "{assistant}")
    # This is orchestrating the example selector (finding similar prompts to the question), and example_prompt (formatting
    # the retrieved prompts, and the users request with both uploaded documents to do the comparison on
    prompt = FewShotPromptTemplate(
        example_selector=example_selector,
        example_prompt=example_prompt,
        suffix="{input}",
        input_variables=["input"]
    )
    # This is calling the prompt method and passing in the users question to create the final multi-shot prompt,
    # with the semantically similar prompts
    question_with_prompt = prompt.format(input=question)
    # TODO: If you want to see the semantically selected prompts, print them into the console:
    # print(question_with_prompt)
    # we return the finalized prompt, ready to be passed into Amazon Bedrock to generate a response
    return llm_compare(question_with_prompt)


def doc_compare(uploaded_file_1, uploaded_file_2) -> str:
    """
    This function is invoked from the front-end when the user uploads two documents, this function takes those documents
    formats them into a string, and then formats them into a prompt that will later be used to find semantically similar prompts
    and generate a list of changes found between both uploaded documents.
    :param uploaded_file_1: The first PDF that was uplaoded in the front end.
    :param uploaded_file_2: The second PDF that was uploaded in the front end.
    :return: The final list of changes between both uploaded_file_1 and uploaded_file_2.
    """
    # using PyPDF PdfReader to read in the first PDF file as text
    document_1 = PdfReader(uploaded_file_1)
    # using PyPDF PdfReader to read in the second PDF file as text
    document_2 = PdfReader(uploaded_file_2)
    # creating an empty string for us to append all the text extracted from the first PDF
    doc_1_text = ""
    # creating an empty string for us to append all the text extracted from the second PDF
    doc_2_text = ""
    # a simple for loop to iterate through all pages of both PDFs we uploaded
    for (page_1, page_2) in zip(document_1.pages, document_2.pages):
        # as we loop through each page, we extract the text from the page and append it to the "text" string for both
        # documents
        doc_1_text += page_1.extract_text() + "\n"
        doc_2_text += page_2.extract_text() + "\n"
    # we create the initial basic prompt, that will be passed into the prompt finder function to find the most
    # semantically similar prompts to leverage a few shot prompting technique.
    prompt = f"""\n\nHuman: Please thoroughly analyze and compare Document A and Document B, highlighting the 
    location of every single change. Provide a detailed report that includes the textual alterations, deletions, 
    insertions, and any other modifications between the two documents. Ensure that the report not only lists the 
    changes but also pinpoints where each change occurs in both documents.

            Document A: {doc_1_text}

            Document B: {doc_2_text}

            \n\nAssistant:"""
    # all the changes that have been found across both documents formatted into a string
    changes = prompt_finder(prompt)
    # returning the list of all changes that were found across both documents, to be presented on the front end
    return changes
