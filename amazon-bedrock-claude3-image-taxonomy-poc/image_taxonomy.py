import boto3
import base64
import os
from langchain_core.output_parsers import StrOutputParser
from langchain_community.chat_models import BedrockChat

from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)

os.environ["AWS_PROFILE"] = "trevx"

# Params 
max_tokens = 5000
temperature = 0
top_p = 1
model_id = "anthropic.claude-3-sonnet-20240229-v1:0"

brclient = boto3.client(
    service_name="bedrock-runtime",
    region_name="us-east-1",
)


def convert_image_to_base64(image):
  # image encoding logic
    with open(image, "rb") as image_file:
            image_data = image_file.read()
    base64_image = base64.b64encode(image_data).decode("utf-8")
    return base64_image

def get_taxonomy(image):
  
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

# Update industry with the industry expertise needed to best understand the images
  industry = "Real Estate"

# System prompt
  system_prompt = f"""You are an expert in {industry}. The question will be contained within the <question></question> tags. Before answering, think step by step in <thinking> tags and analyze every part of the image. Provide your answer within the <answer></answer> tags. Incude a taxonomic analysis in the response contained within the <taxonomy></taxonomy> tags. Use the following example as a reference for the taxonomic analysis:

<taxonomy>
Category: Home
Type: Multi-Family
Subtype: Condominium
Floors: Two Stories
Landscaping: Large back yard with tall pine trees and garden
Matertials:
- Siding: Wood
- Roof: Shingles
- Foundation: Masonry
Features
- Swimming Pool
- Back Yard
- Garage
- Basement
- Attic
</taxonomy>
"""

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

  response = chain.invoke({"question": "<question>Can you do a taxonomic analysis for this image?</question>"})

  return response

#print(get_taxonomy("house.jpeg"))
