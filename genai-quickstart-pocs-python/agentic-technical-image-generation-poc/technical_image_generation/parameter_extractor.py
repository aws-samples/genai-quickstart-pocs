import boto3
import json
from loguru import logger
from typing import Dict, Tuple, Optional
from .models import ImageTemplate

class ParameterExtractor:
    def __init__(self):
        self.bedrock = boto3.client('bedrock-runtime')

    async def extract_parameters(self, prompt: str, template: ImageTemplate) -> Tuple[Dict, Optional[Dict]]:
        logger.debug("Extracting parameters")
        logger.trace(f"extract_parameters: Prompt", prompt)
        system_content = f"""
        You are responsible for understanding a user's request and extracting the necessary parameters from the prompt to generate an image.
        <user_prompt>
        {prompt}
        </user_prompt>
        The template has the following parameters.
        <template_parameters>
        {template.parameters}
        </template_parameters>

        Extract as many parameters as possible from user_prompt and map them to the template requirements. These are the "found_parameters".
        Identify which parameters from the template are missing in the prompt. These are the "missing_parameters".
        The goal is to extract enough data that an image can generate without needing to ask the user for more information. 
        Only if there's no way to complete the request without more parameters should you return missing parameters.
        Parameters should be simple string, number, or a list of string or numbers. No other data type is acceptable. 
        Parameters can be optional or required, regardless of if the user has provided them. 
        Parameters that are not required should have a default value.
        A parameter can either be one of the "found_parameters" or one of the "missing_parameters". It cannot be both.
        
        
        Return JSON with:
        - found_parameters
        - missing_parameters

        <example_response>
        {{
            "found_parameters": {{
                "paramOne": {{
                    "type": "str",
                    "required": true,
                }},
                "paramTwo": {{
                    "type": "list
                    "required": false,
                    "default": ["default1", "default2"]
                }}
            }},
            "missing_parameters": {{
                "paramThree": {{
                    "type": "number",
                    "required": true
                }}
            }}
        }}
        """
        
        response = self.bedrock.converse(
            modelId='amazon.nova-pro-v1:0',
            messages=[{'role': 'user', 'content': [{'text': prompt}]}],
            system=[{'text': system_content}],
        )
        
        response_text = response['output']['message']['content'][0]['text']
        if '```json' in response_text:
            start_idx = response_text.find('```json') + 7
            end_idx = response_text.find('```', start_idx)
            response_text = response_text[start_idx:end_idx]
        logger.trace("Response", response_text)
        result = json.loads(response_text)
        return result['found_parameters'], result['missing_parameters']
    
    async def map_parameter_values(self, prompt: str, template: ImageTemplate, params) -> Dict:
        logger.debug("Mapping parameter values")
        logger.trace("Mapping parameter values for prompt", prompt)
        system_content = f"""
        Given this prompt: 
        <user_prompt>
        {prompt}
        </user_prompt>
        Map the parameter values found in the prompt to the template requirements: 
        <template_parameters_to_map>
        {params}
        </template_parameters_to_map>
        Parameter data types:
        <template_parameters>
        {template.parameters}
        </template_parameters>
        Return JSON with:
        - mapped_parameters: dict of parameters, with their key and value extracted from the original prompt, mapped to the template requirements e.g. {{param: {{type: str, value: any}}}}

        Any parameters that are not explicitly provided in the prompt should be excluded. The system will prompt the user to provide these missing parameters later.

        """
        logger.trace(f"System content", system_content)
        response = self.bedrock.converse(
            modelId='amazon.nova-pro-v1:0',
            messages=[{'role': 'user', 'content': [{'text': prompt}]}],
            system=[{'text': system_content}],
            inferenceConfig={'maxTokens': 1000, 'temperature': 0.2}
        )
        logger.trace(f"Model response", response)  
        response_text = response['output']['message']['content'][0]['text']
        if '```json' in response_text:
            start_idx = response_text.find('```json') + 7
            end_idx = response_text.find('```', start_idx)
            response_text = response_text[start_idx:end_idx]
        logger.trace("Response Text", response_text)
        return json.loads(response_text)['mapped_parameters']


    async def generate_description(self, prompt: str, template: ImageTemplate, missing_params: Optional[Dict]) -> str:
        logger.debug("Generating description")
        logger.trace(f"generate_description: Creating description for prompt", prompt)
        system_content = f"""
        Create a brief description of:
        1. What will be generated based on: 
        <user_prompt>
        {prompt}
        </user_prompt>
        2. What parameters were found
        <found_params>
        {template.parameters}
        </found_params>
        3. What parameters can the user provide to imrove the image. Only parameters listed in <additional_parameters> should be mentioned.: 
        <additional_parameters>
        {missing_params}
        </additional_parameters>
        
        
        Do not attempt to render an image or visual within the description
        Keep it concise and user-friendly.
        """
        logger.trace("generate_description: System content", system_content)
        response = self.bedrock.converse(
            modelId='amazon.nova-pro-v1:0',
            messages=[{'role': 'user', 'content': [{'text': prompt}]}],
            system=[{'text': system_content}],
        )
        logger.trace(f"generate_description: Response", response)
        
        return response['output']['message']['content'][0]['text']