import boto3
import json

from dotenv import load_dotenv
import os

from langchain_community.retrievers import AmazonKnowledgeBasesRetriever
from langchain.chains import RetrievalQA
from langchain_community.llms import Bedrock
from langchain_community.chat_models import BedrockChat


# loading in variables from .env file
load_dotenv()

# instantiating the Bedrock client, and passing in the CLI profile
boto3.setup_default_session(profile_name=os.getenv("profile_name"))
bedrock = boto3.client("bedrock-runtime", "us-east-1")
bedrock_agent_runtime = boto3.client("bedrock-agent-runtime", "us-east-1")

# getting the knowledge base id from the env variable
knowledge_base_id = os.getenv("knowledge_base_id")
# Models to use
llm_model = os.getenv("llm_model")  # either "amazon-titan" or "anthropic-claude"


def get_contexts(query, kbId, numberOfResults=5):
    """
    This function takes a query, knowledge base id, and number of results as input, and returns the contexts for the query.
    It uses Langchain to call the Amazon Knowledge bases using retriever module in langchain.
    :param query: This is the natural language query that is passed in through the app.py file.
    :param kbId: This is the knowledge base id that is gathered from the .env file.
    :param numberOfResults: This is the number of results that are returned from the knowledge base.
    :return: The contexts for the query.
    """
    # getting the contexts for the query from the knowledge base using the langchain retriever
    retriever = AmazonKnowledgeBasesRetriever(
        credentials_profile_name=os.getenv("profile_name"),
        knowledge_base_id=kbId,
        retrieval_config={"vectorSearchConfiguration": {"numberOfResults": numberOfResults}},
    )

    #  creating a list to store the contexts
    retriever.get_relevant_documents(query=query)
    # return the list of contexts retrieved from the knowledge base
    return retriever


def call_titan(query, retriever):
    """
    This function is used to call Amazon Titan Express LLM model using Langchain.
    :param query: Contains the Question asked by the user
    :param retriever: Contains the  contexts retrieved from the Amazon Bedrock Knowledge base
    :return: Response recieved from LLM for the input user query
    """

    # Setting Model kwargs
    model_kwargs = {
        "maxTokenCount": 4096,
        "stopSequences": [],
        "temperature": 0,
        "topP": 1,
    }

    # Setting LLM method from the Language Bedrock library
    llm = Bedrock(
        client=bedrock, model_id="amazon.titan-text-express-v1", model_kwargs=model_kwargs
    )

    # Invoke Amazon Titan using the Langchain llm method
    qa = RetrievalQA.from_chain_type(
        llm=llm, retriever=retriever, return_source_documents=True
    )

    answer = qa(query)

    # Returning the response
    return answer


def call_claude(query, retriever):
    """
    This function is used to call Anthropic Claude LLM model using Langchain.
    :param query: Contains the Question asked by the user
    :param retriever: Contains the  contexts retrieved from the Amazon Bedrock Knowledge base
    :return: Response recieved from LLM for the input user query
    """

    # Setting Model kwargs
    model_kwargs = {
        "max_tokens": 2048,
        "temperature": 0.0,
        "top_k": 250,
        "top_p": 1,
        "stop_sequences": ["\n\nHuman"],
    }

    # Setting LLM method from the Language BedrockChat library
    llm = BedrockChat(
        client=bedrock,
        model_id="anthropic.claude-3-haiku-20240307-v1:0",
        model_kwargs=model_kwargs,
    )

    # Invoke Claude using the Langchain llm method
    qa = RetrievalQA.from_chain_type(
        llm=llm, retriever=retriever, return_source_documents=True
    )

    answer = qa(query)

    # Returning the response
    return answer


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

    # call the call_claude or call_titan module depending on the llm model environment variable
    if llm_model == "anthropic-claude":
        answer = call_claude(userQuery, userContexts)
    elif llm_model == "amazon-titan":
        answer = call_titan(userQuery, userContexts)

    # returning the final string to the end user
    if "result" in answer:
        return answer["result"]
    else:
        return "no response from model"
