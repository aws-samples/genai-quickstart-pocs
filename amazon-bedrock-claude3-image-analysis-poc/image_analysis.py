import boto3
import base64
import os
import json
import botocore.config
from langchain_core.output_parsers import StrOutputParser
from langchain_community.chat_models import BedrockChat
from dotenv import load_dotenv

from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)

load_dotenv()

# configuring our CLI profile name
boto3.setup_default_session(profile_name=os.getenv('profile_name'))
# increasing the timeout period when invoking bedrock
config = botocore.config.Config(connect_timeout=120, read_timeout=120)
brclient = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock-runtime.us-east-1.amazonaws.com',config=config)

#model params
model_id = "anthropic.claude-3-sonnet-20240229-v1:0"
max_tokens = 5000
temperature = 0
top_p = 1

def convert_image_to_base64(image):
  # image encoding logic
    with open(image, "rb") as image_file:
            image_data = image_file.read()
    base64_image = base64.b64encode(image_data).decode("utf-8")
    return base64_image

def analyze_image(image):
  
  model_kwargs = {
    "max_tokens": max_tokens,  
    "temperature": temperature,
    "top_p": top_p,
  }

  model = BedrockChat(
    client=brclient,
    model_id=model_id,
    model_kwargs=model_kwargs
  )

  img_base64 = convert_image_to_base64(image)

# System prompt
  system_prompt = "You are an expert in image analysis and classification. The question will be contained within the <question></question> tags. Before answering, think step by step in <thinking> tags as you analyze every part of the image. Provide your answer within the <answer></answer> tags. Incude a JSON structured response describing image attributes contained within the <json></json> tags. Always add line breaks between each section of your response"

  human_prompt = [{
    "type": "image_url",
    "image_url": {"url": f"data:image/jpeg;base64,{img_base64}"} 
  }, {
    "type": "text",
    "text": "{question}"
  }]

  system_message_template = SystemMessagePromptTemplate.from_template(system_prompt)

  human_message_template = HumanMessagePromptTemplate.from_template(human_prompt)

  prompt = ChatPromptTemplate.from_messages([system_message_template, human_message_template])
  
  chain = prompt | model | StrOutputParser()
  print(chain)

  response = chain.invoke({"question": "<question>Can you do analyze this image in detail?</question>"})

  return response