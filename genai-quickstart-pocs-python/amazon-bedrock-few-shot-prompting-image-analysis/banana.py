import os                  # Import operating system module for file/path operations
import boto3              # Import AWS SDK for Python to interact with AWS services
import botocore           # Import core functionality for boto3
import streamlit as st    # Import Streamlit for creating web applications
import base64            # Import base64 for encoding/decoding data
from PIL import Image    # Import Python Imaging Library for image processing
import io                # Import input/output module for handling byte streams
import json             # Import JSON module for handling JSON data

#Setup Bedrock client
config = botocore.config.Config(connect_timeout=300, read_timeout=300)    # Configure timeout settings for AWS API calls
bedrock = boto3.client('bedrock-runtime' , 'us-east-1', config = config)  # Initialize Amazon Bedrock client in us-east-1 region

#s3 client
s3 = boto3.client('s3')   # Initialize Amazon S3 client for bucket operations

def parse_xml(xml, tag):                                  # Define function to parse XML and extract tag content
    start_tag = f"<{tag}>"                               # Create opening tag string with provided tag name
    end_tag = f"</{tag}>"                                # Create closing tag string with provided tag name
  
    start_index = xml.find(start_tag)                    # Find the position where start tag begins
    if start_index == -1:                                # If start tag not found (-1)
        return ""                                         # Return empty string

    end_index = xml.find(end_tag)                        # Find the position where end tag begins
    if end_index == -1:                                  # If end tag not found (-1)
        return ""                                         # Return empty string

    value = xml[start_index+len(start_tag):end_index]    # Extract content between start and end tags
    return value                                         # Return the extracted content

# Function that takes image name and file type as parameters to convert image to text
def image_to_text(image_name, file_type):

    #open file and convert to base64
    open_image = Image.open(image_name)                      # Opens the input image file using PIL Image
    image_bytes = io.BytesIO()                              # Creates a bytes buffer to store image data
    open_image.save(image_bytes, format='PNG')              # Saves the image to the bytes buffer in PNG format
    image_bytes = image_bytes.getvalue()                    # Gets the byte value from the buffer
    image_base64 = base64.b64encode(image_bytes).decode('utf-8')  # Encodes image bytes to base64 string
   
    # Load and process first static banana shelf image (full shelves)
    open_image_static = Image.open(os.path.join(os.path.dirname(__file__), 'images/banana-full-shelves.jpg'))  # Opens static image from images folder
    image_bytes_static = io.BytesIO()                       # Creates bytes buffer for static image
    open_image_static.save(image_bytes_static, format='PNG')  # Saves static image to buffer
    image_bytes_static = image_bytes_static.getvalue()      # Gets byte value from static image buffer
    image_base64_static = base64.b64encode(image_bytes_static).decode('utf-8')  # Encodes static image to base64
    
    # Load and process second static banana shelf image (also full shelves)
    open_image_static2 = Image.open(os.path.join(os.path.dirname(__file__), 'images/banana-full-shelves.jpg'))  # Opens second static image
    image_bytes_static2 = io.BytesIO()                     # Creates buffer for second static image
    open_image_static2.save(image_bytes_static2, format='PNG')  # Saves second static image to buffer
    image_bytes_static2 = image_bytes_static2.getvalue()   # Gets bytes from second static image buffer
    image_base64_static2 = base64.b64encode(image_bytes_static2).decode('utf-8')  # Encodes second static image to base64
    
    # Load and process third static banana shelf image (near empty shelves)
    open_image_static3 = Image.open(os.path.join(os.path.dirname(__file__), 'images/banana-near-empty-shelves.jpg'))  # Opens third static image
    image_bytes_static3 = io.BytesIO()                     # Creates buffer for third static image
    open_image_static3.save(image_bytes_static3, format='PNG')  # Saves third static image to buffer
    image_bytes_static3 = image_bytes_static3.getvalue()   # Gets bytes from third static image buffer
    image_base64_static3 = base64.b64encode(image_bytes_static3).decode('utf-8')  # Encodes third static image to base64    
    
    
    # Define the prompt text that will be sent to the model
    user_prompt="""
You are a grocery store manager assistant. Analyze the provided image of the store's banana shelves and provide the following details as accurately as you can:


    -Classify the stock level of the Banana Shelves (Fully_stocked, stock_gaps, Nearly_empty) with the goal of identifying if the shelves need to be restocked. If you classify the shelves as stock_gaps, suggest that the shelves need to be restocked or replenished soon. If you calssify the shelves as Nearly_empty, recommend restocking or replenishing the shelves as soon as possible.
    
    -Are there any items present in the image that are not bananas in the banana shelves and should be removed from the banana shelves. If yes, describe what anomalous item is present if possible
    
You are specifically checking for the banana shelves. Any other items that is not a banana including other produce items should be considered anomalous
    
    
Think through each step and your observations and write them down in <scratchpad> xml tags

Return your classification of the fullness of the banana shelves in <banana_shelf_fullness> xml tags

Return your description of any anomalous items that should not be in the banana shelves in <strange_item> xml tags
"""
    # Create the prompt dictionary with model parameters and messages
    prompt = {
        "anthropic_version":"bedrock-2023-05-31",    # Specify the model version
        "max_tokens":1000,                           # Set maximum response length
        "temperature":0.5,                           # Set temperature for response randomness
        "system":user_prompt,                        # Set the system prompt
        "messages":[                                 # Array of message exchanges
            {
                "role":"user",                       # First user message
                "content":[                          # Content array
                {
                    "type":"image",                  # Specify content type as image
                    "source":{                       # Image source details
                        "type":"base64",             # Image format is base64
                        "media_type":file_type,      # Media type from parameter
                        "data": image_base64_static  # First static image data
                    }
                },
                ]
            },
            {
        "role": 'assistant',                         # First assistant response
        "content": [                                 # Content array
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
                "role":"user",                       # Second user message
                "content":[                          # Content array
                {
                    "type":"image",                  # Specify content type as image
                    "source":{                       # Image source details
                        "type":"base64",             # Image format is base64
                        "media_type":file_type,      # Media type from parameter
                        "data": image_base64_static2 # Second static image data
                    }
                },
                ]
            },
            {
        "role": 'assistant',                         # Second assistant response
        "content": [                                 # Content array
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
                "role":"user",                       # Third user message
                "content":[                          # Content array
                {
                    "type":"image",                  # Specify content type as image
                    "source":{                       # Image source details
                        "type":"base64",             # Image format is base64
                        "media_type":file_type,      # Media type from parameter
                        "data": image_base64_static3 # Third static image data
                    }
                },
                ]
            },
            {
        "role": 'assistant',                         # Third assistant response
        "content": [                                 # Content array
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
                "role":"user",                       # Final user message
                "content":[                          # Content array
                {
                    "type":"image",                  # Specify content type as image
                    "source":{                       # Image source details
                        "type":"base64",             # Image format is base64
                        "media_type":file_type,      # Media type from parameter
                        "data": image_base64         # Input image data
                    }
                },
                # Commented out text prompt
                # {
                #     "type":"text",
                #     "text": user_prompt
                # }
                ]
            }  
        ]
    }
    # Convert prompt dictionary to JSON string
    json_prompt = json.dumps(prompt)
    # Call Bedrock model with the JSON prompt
    response = bedrock.invoke_model(body=json_prompt, modelId="anthropic.claude-3-sonnet-20240229-v1:0", accept="application/json", contentType="application/json")
    # Print raw response for debugging
    print("---------Response------------")
    print(response)
    print("---------END Response------------")
    # Parse response body from JSON
    response_body = json.loads(response.get('body').read())
    # Print response body for debugging
    print("---------Response Body------------")
    print(response_body)
    print("---------END Response Body------------")
    # Extract and return the model's text output
    llmOutput=response_body['content'][0]['text']
    return llmOutput








