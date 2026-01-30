import boto3
import json
import time
import botocore.config
import io, base64
import traceback
from PIL import Image
import os
from dotenv import load_dotenv
# loading in environment variables
load_dotenv()
# configuring the Bedrock client with your CLI profile name, and region
boto3.setup_default_session(profile_name=os.getenv("profile_name"))
guardrail_identifier = os.getenv("guardrail_identifier")
guardrail_version = os.getenv("guardrail_version")
config = botocore.config.Config(connect_timeout=120, read_timeout=120)
bedrock = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock-runtime.us-east-1.amazonaws.com',
                       config=config)
modelId = "anthropic.claude-3-sonnet-20240229-v1:0"
def invoke_guardrails(text):
    """
    This function is used to invoke the Claude3 odel, while leveraging Amazon Bedrock Guardrails.
    :param text: This is the text that the user inserts on the frontend.
    :return: A natural language response to the question that the user inserted on the frontend.
    """
    # the system prompt is used as a default prompt, and is always passed into to the model
    # TODO: Edit the system prompt based on your specific use case
    system_prompt = """Answer briefly to the user provided question."""
    # this is the formatted prompt that contains both the system_prompt along with the text prompt that was inserted by the user.
    prompt = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 500,
        "temperature": 0.7,
        "system": system_prompt,
        "messages": [
            {
                "role": "user",
                "content": [
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
    try:
        response = bedrock.invoke_model(body=json_prompt, modelId=modelId,
                                    guardrailIdentifier=guardrail_identifier, guardrailVersion=guardrail_version, accept="application/json",
                                    contentType="application/json")
        response_body = json.loads(response.get('body').read())
        print(response_body)
        # the final string returned to the end user
        llm_output = response_body['content'][0]['text']
        # returning the final string to the end user    
        # getting the response from Claude3 and parsing it to return to the end user, if the response is blocked by the Guardrail,
        # then the Guardrail blocking message will be returned to the end user.
        return llm_output
    except Exception as error:
        print(error)
        return error
    # invoking Claude3, with Amazon Bedrock Guardrails passing in our prompt
    

def image_generator(question):
    """
    This function takes in the user input requesting an image, invokes the LLM through Amazon Bedrock to generate
    an image to be displayed on the front end.
    :param question: This is the user request that contains text input describing the user's requested image.
    :return: The path to the saved image, stored in the root of this repository to be displayed on the front end.
    """
    # the parameters that will be passed into the invocation of the Bedrock Model
    clip_guidance_preset = "FAST_GREEN" # (e.g. FAST_BLUE FAST_GREEN NONE SIMPLE SLOW SLOWER SLOWEST)
    sampler = "K_DPMPP_2S_ANCESTRAL" # (e.g. DDIM, DDPM, K_DPMPP_SDE, K_DPMPP_2M, K_DPMPP_2S_ANCESTRAL, K_DPM_2, K_DPM_2_ANCESTRAL, K_EULER, K_EULER_ANCESTRAL, K_HEUN, K_LMS)
    width = 768
    style_preset = "photographic"
    body = json.dumps({"text_prompts": ([{"text": question, "weight": 1.0}]),
                       "cfg_scale":7,
                       "seed":22,
                       "steps":40,
                       "style_preset":style_preset,
                       "sampler":sampler,
                       "clip_guidance_preset":clip_guidance_preset,
                       "width":width,
                       })
    # Specifying the specific model we want to use with Amazon Bedrock
    modelId = 'stability.stable-diffusion-xl-v1'
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
    #img.save('my-image.jpeg')
    ts=time.time()
    imagename='./generated-images/my-image'+str(ts)+'.jpeg'
    img.save(imagename)
    # returning the path of the saved image, so that it can be displayed on the frontend of the streamlit app
    
    return imagename