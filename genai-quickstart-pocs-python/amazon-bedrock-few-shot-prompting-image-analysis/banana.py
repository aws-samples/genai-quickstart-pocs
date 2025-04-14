import os
import boto3
import botocore
import streamlit as st
import base64
from PIL import Image
import io
import json
#Setup Bedrock client
config = botocore.config.Config(connect_timeout=300, read_timeout=300)
bedrock = boto3.client('bedrock-runtime' , 'us-east-1', config = config)
#s3 client
s3 = boto3.client('s3')

    
    
    

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

def image_to_text(image_name, file_type):
    #open file and convert to base64
    open_image = Image.open(image_name)
    image_bytes = io.BytesIO()
    open_image.save(image_bytes, format='PNG')
    image_bytes = image_bytes.getvalue()
    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
   
    open_image_static = Image.open(os.path.join(os.path.dirname(__file__), 'images/banana-full-shelves.jpg'))
    image_bytes_static = io.BytesIO()
    open_image_static.save(image_bytes_static, format='PNG')
    image_bytes_static = image_bytes_static.getvalue()
    image_base64_static = base64.b64encode(image_bytes_static).decode('utf-8')
    
    open_image_static2 = Image.open(os.path.join(os.path.dirname(__file__), 'images/banana-full-shelves.jpg'))
    image_bytes_static2 = io.BytesIO()
    open_image_static2.save(image_bytes_static2, format='PNG')
    image_bytes_static2 = image_bytes_static2.getvalue()
    image_base64_static2 = base64.b64encode(image_bytes_static2).decode('utf-8')
    
    open_image_static3 = Image.open(os.path.join(os.path.dirname(__file__), 'images/banana-near-empty-shelves.jpg'))
    image_bytes_static3 = io.BytesIO()
    open_image_static3.save(image_bytes_static3, format='PNG')
    image_bytes_static3 = image_bytes_static3.getvalue()
    image_base64_static3 = base64.b64encode(image_bytes_static3).decode('utf-8')
    
    #setup prompt
    user_prompt="""
You are a grocery store manager assistant. Analyze the provided image of the store's banana shelves and provide the following details as accurately as you can:


    -Classify the stock level of the Banana Shelves (Fully_stocked, stock_gaps, Nearly_empty) with the goal of identifying if the shelves need to be restocked. If you classify the shelves as stock_gaps, suggest that the shelves need to be restocked or replenished soon. If you calssify the shelves as Nearly_empty, recommend restocking or replenishing the shelves as soon as possible.
    
    -Are there any items present in the image that are not bananas in the banana shelves and should be removed from the banana shelves. If yes, describe what anomalous item is present if possible
    
You are specifically checking for the banana shelves. Any other items that is not a banana including other produce items should be considered anomalous
    
    
Think through each step and your observations and write them down in <scratchpad> xml tags

Return your classification of the fullness of the banana shelves in <banana_shelf_fullness> xml tags

Return your description of any anomalous items that should not be in the banana shelves in <strange_item> xml tags
"""
    prompt = {
        "anthropic_version":"bedrock-2023-05-31",
        "max_tokens":1000,
        "temperature":0.5,
        "system":user_prompt,
        "messages":[
            {
                "role":"user",
                "content":[
                {
                    "type":"image",
                    "source":{
                        "type":"base64",
                        "media_type":file_type,
                        "data": image_base64_static
                    }
                },
                ]
            },
            {
        "role": 'assistant',
        "content": [
            {"type": "text", "text": """<scratchpad> 
Observations: - The shelves are stocked with bunches of bananas - There are multiple rows of shelves, each filled with bunches of bananas, The shelves seems to be filled with Banana bunches with almost no gaps - I don not see any items other than bananas on these shelves 
Analysis:
Given how densely packed the shelves are with banana bunches, with minimal empty spaces, I would classify the fullness of the banana shelves as Fully_stocked.
There do not appear to be any anomalous items or items that are not bananas present on these shelves. 
</scratchpad> 
<banana_shelf_fullness>Fully_stocked</banana_shelf_fullness>
<strange_item>No anomalous items observed</strange_item>"""
            }
        ]
    },
    {
                "role":"user",
                "content":[
                {
                    "type":"image",
                    "source":{
                        "type":"base64",
                        "media_type":file_type,
                        "data": image_base64_static2
                    }
                },
                ]
            },
            {
        "role": 'assistant',
        "content": [
            {"type": "text", "text": """<scratchpad> 
Observations: - The image shows multiple shelves stocked with bunches of bananas - The shelves appear to be stocked with bananas, with only a few gaps where bunches are missing - I don't see any items other than bananas on these shelves
Analysis:
Given how the shelves are filled with banana bunches, with some empty spaces, I would classify the fullness of the banana shelves as stock_gaps. Based on the nearly full shelves, I would suggest that the banana shelves need to be restocked or replenished soon to ensure a steady supply of fresh bananas for customers.
There do not appear to be any anomalous items or items that are not bananas present on these shelves. 
</scratchpad> 
<banana_shelf_fullness>stock_gaps</banana_shelf_fullness>
<strange_item>No anomalous items observed</strange_item>"""
            }
        ]
    },
    {
                "role":"user",
                "content":[
                {
                    "type":"image",
                    "source":{
                        "type":"base64",
                        "media_type":file_type,
                        "data": image_base64_static3
                    }
                },
                ]
            },
            {
        "role": 'assistant',
        "content": [
            {"type": "text", "text": """<scratchpad> 
Observations: - The shelves appear to be nearly empty, with only a few bunches of bananas remaining - There are empty spaces on the shelves where bananas should be stocked
Analysis:
Given there are a lot of empty spaces on the shelves where bananas should be stocked, I would classify the fullness of the banana shelves as Nearly_Empty. Based on the nearly empty state of the banana shelves, I would recommend restocking or replenishing the shelves with new banana bunches as soon as possible to maintain adequate stock levels
There do not appear to be any anomalous items or items that are not bananas present on these shelves. 
</scratchpad> 
<banana_shelf_fullness>Nearly_Empty</banana_shelf_fullness>
<strange_item>No anomalous items observed</strange_item>"""
            }
        ]
    },
    {
                "role":"user",
                "content":[
                {
                    "type":"image",
                    "source":{
                        "type":"base64",
                        "media_type":file_type,
                        "data": image_base64
                    }
                },
                # {
                #     "type":"text",
                #     "text": user_prompt
                # }
                ]
            }  
        ]
    }
    json_prompt = json.dumps(prompt)
    response = bedrock.invoke_model(body=json_prompt, modelId="anthropic.claude-3-sonnet-20240229-v1:0", accept="application/json", contentType="application/json")
    print("---------Response------------")
    print(response)
    print("---------END Response------------")
    response_body = json.loads(response.get('body').read())
    print("---------Response Body------------")
    print(response_body)
    print("---------END Response Body------------")
    llmOutput=response_body['content'][0]['text']
    return llmOutput








