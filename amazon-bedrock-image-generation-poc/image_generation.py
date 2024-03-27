import boto3
import json
import botocore.config
import io, base64
from PIL import Image
import os
from dotenv import load_dotenv
# loading in environment variables
load_dotenv()
# configuring the Bedrock client with your CLI profile name, and region
boto3.setup_default_session(profile_name=os.getenv("profile_name"))
config = botocore.config.Config(connect_timeout=120, read_timeout=120)
bedrock = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock-runtime.us-east-1.amazonaws.com',
                       config=config)


def image_generator(question):
    """
    This function takes in the user input requesting an image, invokes the LLM through Amazon Bedrock to generate
    an image to be displayed on the front end.
    :param question: This is the user request that contains text input describing the user's requested image.
    :return: The path to the saved image, stored in the root of this repository to be displayed on the front end.
    """
    # the parameters that will be passed into the invocation of the Bedrock Model
    body = json.dumps({"text_prompts": [{"text": question}],
                       "cfg_scale": 20,
                       "seed": 0,
                       "steps": 150,
                       })
    # Specifying the specific model we want to use with Amazon Bedrock
    modelId = 'stability.stable-diffusion-xl-v0'
    # Specifying the data type that we are passing into Amazon Bedrock for the invocation
    accept = 'application/json'
    contentType = 'application/json'

    # The invocation of Amazon Bedrock, with the parameters we specified above
    response = bedrock.invoke_model(body=body,
                                    modelId=modelId,
                                    accept=accept,
                                    contentType=contentType)
    # Gathering the response from Bedrock, and reading the body
    response_body = json.loads(response.get('body').read())
    # from the response, we are parsing out the base64 encoding of the generated image
    base64_str = response_body['artifacts'][0]['base64']
    # decoding the base64, so we can prepare to display it on the front end
    img = Image.open(io.BytesIO(base64.decodebytes(bytes(base64_str, "utf-8"))))
    # saving the generated image locally, and specifying the path to which the generated image was saved
    img.save('my-image.jpeg')
    # returning the path of the saved image, so that it can be displayed on the frontend of the streamlit app
    return 'my-image.jpeg'
