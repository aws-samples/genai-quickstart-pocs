import boto3
import json
from dotenv import load_dotenv
import os
import base64
import io
from PIL import Image

# loading in variables from .env file
load_dotenv()

# instantiating the Bedrock client, and passing in the CLI profile
boto3.setup_default_session(profile_name=os.getenv("profile_name"))
bedrock = boto3.client('bedrock-runtime', 'us-west-2', endpoint_url='https://bedrock-runtime.us-west-2.amazonaws.com')


def image_base64_encoder(image_name):
    """
    This function takes in a string that represent the path to the image that has been uploaded by the user and the function
    is used to encode the image to base64. The base64 string is then returned.
    :param image_name: This is the path to the image file that the user has uploaded.
    :return: A base64 string of the image that was uploaded.
    """
    # opening the image file that was uploaded by the user
    open_image = Image.open(image_name)
    # creating a BytesIO object to store the image in memory
    image_bytes = io.BytesIO()
    # saving the image to the BytesIO object
    open_image.save(image_bytes, format=open_image.format)
    # converting the BytesIO object to a base64 string and returning it
    image_bytes = image_bytes.getvalue()
    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
    # getting the appropriate file type as claude 3 expects the file type to be presented
    file_type = f"image/{open_image.format.lower()}"
    # returning both the formatted file type string, along with the base64 encoded image
    return file_type, image_base64


def analyze_image(image_name, text) -> str:
    """
    This function is used to perform an image to text llm invocation against Claude 3. The prompts are configured so that a JSON object is returned by default.
    :param image_name: This is the path to the image file that the user has uploaded.
    :param text: This is the example JSON the user may have optionally provided
    :return: A JSON response giving a detailed analysis of the image that was uploaded or answering a specific
    question that the user asked along with the image.
    """
    # invoking the image_base64_encoder function to encode the image to base64 and get the file type string
    file_type, image_base64 = image_base64_encoder(image_name)
    # the system prompt is used as a default prompt, and is always passed into to the model
    # TODO: Edit the system prompt based on your specific use case
    system_prompt = """Describe every detail you can about this image, be extremely thorough and detail even the most minute aspects of the image. 
    
    If a more specific question is presented by the user, make sure to prioritize that answer.
    """
    # checking if the user inserted any text along with the image, if not, we set text to a default since claude expects
    # text in the text block of the prompt.
    if text == "":
        text = "Use the system prompt"
    # this is the primary prompt passed into Claude3 with the system prompt, user uploaded image in base64 and any
    # text the user inserted
    prompt = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1000,
        "temperature": 0.5,
        "system": system_prompt,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": file_type,
                            "data": image_base64
                        }
                    },
                    {
                        "type": "text",
                        "text": text
                    }
                ]
            }
        ]
    }
    # formatting the prompt as a json string
    json_prompt = json.dumps(prompt)
    # invoking Claude3, passing in our prompt
    response = bedrock.invoke_model(body=json_prompt, modelId="anthropic.claude-3-sonnet-20240229-v1:0",
                                    accept="application/json", contentType="application/json")
    # getting the response from Claude3 and parsing it to return to the end user
    response_body = json.loads(response.get('body').read())
    # the final string returned to the end user
    llm_output = response_body['content'][0]['text']
    # returning the final string to the end user
    return json.loads(llm_output)