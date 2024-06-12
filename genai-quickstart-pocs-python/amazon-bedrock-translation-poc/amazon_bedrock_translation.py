import streamlit as st
import boto3
import botocore
import json

#################
# Initial Setup #
#################

# Initialize boto3 clients
session = boto3.Session()
config = botocore.config.Config(connect_timeout=300, read_timeout=300)
bedrock = session.client('bedrock')
bedrock_runtime = session.client('bedrock-runtime','us-east-1',config = config)
translate = session.client('translate')


#################
# Methods #
#################

#parse xml helper method
def parse_xml(xml, tag):
    temp=xml.split(">")
    
    tag_to_extract="</"+tag

    for line in temp:
        if tag_to_extract in line:
            parsed_value=line.replace(tag_to_extract, "")
            return parsed_value

# Returns a list of languages supported by Amazon and caches the data
@st.cache_data
def lst_langs():
    return translate.list_languages()['Languages']

# Lists all Bedrock models
@st.cache_data
def lst_models():
    return bedrock.list_foundation_models(
        byProvider='Anthropic',
        byOutputModality='TEXT',
        byInferenceType='ON_DEMAND'
    )['modelSummaries']

# Translates input text from the source language to the target language using Bedrock
def transl_txt_bedrock(input_txt, src_lang, tgt_lang, model_id):
    
    ##Setup Prompt
    prompt = f"""    
        Human:
        Task: Translate the given text from the source language to the target language.

        Source language: {src_lang}
        Target language: {tgt_lang}
        
        Text to translate: {input_txt}
        
        Translation steps:
        1. Identify the source and target languages
        2. Understand the meaning of the input text in the source language
        3. Convert the text into the target language while preserving the original meaning
        4. Review the translation for accuracy, fluency, and context

        Only output the translated text
        
        <translated_text>
        </translated_text>

        Assistant:
    """

    body=json.dumps(
        {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 10000,
            "temperature":0,
            "top_k":250,
            "top_p":0.5,
            "stop_sequences":[],
            "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                ],
            }
        ],
        }  
    )  

    #Run Inference
    modelId = model_id  # change this to use a different version from the model provider if you want to switch 
    accept = "application/json"
    contentType = "application/json"

    response = bedrock_runtime.invoke_model(body=body, modelId=modelId, accept=accept, contentType=contentType)
    response_body = json.loads(response.get('body').read())
    llmOutput = response_body.get("content")[0]["text"]

    return llmOutput

#Translates chat messages to the target language using Bedrock"""
def transl_chat_bedrock(input_txt, tgt_lang, model_id):
    

    ##Setup Prompt
    prompt = f"""    
        Human:
        Task: Respond to the given text in the target language.

        Target language: {tgt_lang}
        
        Text to respond to: {input_txt}
        
        Steps:
        1. Carefully read and understand the meaning of the input text in the source language.
        2. Formulate a thoughtful and contextually appropriate response in the target language.
        3. Review the response to ensure it is accurate, fluent, and captures the intended meaning.

        Only output the response in the target language
        
        <response>
        </response>

        Assistant:
    """

    body=json.dumps(
        {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 10000,
            "temperature":0,
            "top_k":250,
            "top_p":0.5,
            "stop_sequences":[],
            "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                ],
            }
        ],
        }  
    )  

    #Run Inference
    modelId = model_id  # change this to use a different version from the model provider if you want to switch 
    accept = "application/json"
    contentType = "application/json"

    response = bedrock_runtime.invoke_model(body=body, modelId=modelId, accept=accept, contentType=contentType)
    response_body = json.loads(response.get('body').read())
    llmOutput = response_body.get("content")[0]["text"]
    print("bedrock" + llmOutput)
    return llmOutput

# Analyzes the quality of the translation
def analyze_responses(input_txt, bedrock_txt, model_id):

    ##Setup Prompt
    prompt = f"""    
        Human:
        Role: You are a professional translator tasked with reviewing and analyzing translated text.
        
        Original text: {input_txt}
        Bedrock Translated text: {bedrock_txt}
        
        Review process:
        1. Read the original text to understand the context and meaning
        2. Review the bedrock translated text for accuracy, fluency, and adherence to the original context
        3. Evaluate the quality of the translation

        Ensure your analysis and response is in English

        <analysis>
        </analysis>
        
        Assistant:
    """

    body=json.dumps(
        {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 10000,
            "temperature":0,
            "top_k":250,
            "top_p":0.5,
            "stop_sequences":[],
            "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                ],
            }
        ],
        }  
    )  

    #Run Inference
    modelId = model_id  # change this to use a different version from the model provider if you want to switch 
    accept = "application/json"
    contentType = "application/json"

    response = bedrock_runtime.invoke_model(body=body, modelId=modelId, accept=accept, contentType=contentType)
    response_body = json.loads(response.get('body').read())
    llmOutput = response_body.get("content")[0]["text"]
    
    return llmOutput