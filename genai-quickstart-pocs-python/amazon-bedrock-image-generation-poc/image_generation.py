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


def image_generator(question, modelId='amazon.nova-canvas-v1:0', condition_image=None):
    """
    Generate image from text and return image bytes
    :param question: Text input describing requested image
    :param condition_image: Optional image to condition the generation
    :return: Image bytes that can be displayed directly
    """
    if modelId == "stability.sd3-large-v1:0":
        model_region = 'us-west-2'
        request_body = {
            "prompt": question,
            "mode": "text-to-image",
            "aspect_ratio": "1:1",
            "output_format": "jpeg",
        }
        if condition_image:
            request_body["image"] = condition_image
            request_body["mode"] = "image-to-image"
            request_body["strength"] = 0.5
            del request_body["aspect_ratio"]
        body = json.dumps(request_body)
    else:
        model_region = 'us-east-1'
        request_body = {
            "taskType": "TEXT_IMAGE",
            "textToImageParams": {
                "text": question
            },
            "imageGenerationConfig": {
                "cfgScale": 8,
                "quality": "standard",
                "width": 1280,
                "height": 720,
                "numberOfImages": 1
            }
        }
        
        if condition_image:
            request_body["textToImageParams"].update({
                "conditionImage": condition_image,
                "controlMode": "CANNY_EDGE",
                "controlStrength": 0.8
            })
            
        body = json.dumps(request_body)

    bedrock = boto3.client('bedrock-runtime', model_region, config=config)
    response = bedrock.invoke_model(
        body=body,
        modelId=modelId,
        accept='application/json',
        contentType='application/json'
    )
    
    response_body = json.loads(response.get('body').read())
    base64_str = response_body['images'][0]
    image_bytes = base64.b64decode(base64_str)
    return image_bytes
