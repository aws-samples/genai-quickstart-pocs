import boto3
import json
from loguru import logger
from typing import Dict, Tuple, Optional
from .models import ImageTemplate

class ParameterExtractor:
    def __init__(self):
        self.bedrock = boto3.client('bedrock-runtime')

    async def extract_parameters(self, prompt: str, template: ImageTemplate) -> Tuple[Dict, Optional[Dict]]:
        logger.debug(f"extract_parameters: Analyzing prompt: {prompt[:50]}...")
        system_content = f"""
        Given this prompt: {prompt}
        Extract parameters for image generation based on these requirements: {template.parameters}
        The goal is to extract enough data that an image can generate without needing to ask the user for more information. Only if there's no way to complete the request without more parameters should you return missing parameters.
        Parameters should be simple string or number values, not complex objects. If a parameter requires multiple values, it should be split into multiple parameters.
        Return JSON with:
        - found_parameters: dict of parameter values found in prompt {{param: {{type: str, value: any}}}}
        - missing_parameters: dict of required parameters not found in prompt that would be needed to properly generate the image. If all parameters are found, return an empty dict.
        """
        
        response = self.bedrock.converse(
            modelId='amazon.nova-pro-v1:0',
            messages=[{'role': 'user', 'content': [{'text': prompt}]}],
            system=[{'text': system_content}],
            inferenceConfig={'maxTokens': 1000, 'temperature': 0.2}
        )
        
        response_text = response['output']['message']['content'][0]['text']
        if '```json' in response_text:
            start_idx = response_text.find('```json') + 7
            end_idx = response_text.find('```', start_idx)
            response_text = response_text[start_idx:end_idx]
        logger.debug(f"extract_parameters: Response: {response_text}...")
        result = json.loads(response_text)
        return result['found_parameters'], result['missing_parameters']
    
    async def map_parameter_values(self, prompt: str, template: ImageTemplate, params) -> Dict:
        logger.debug(f"map_parameter_values: Mapping parameter values for prompt: {prompt[:50]}...")
        system_content = f"""
        Given this prompt: 
        <user_prompt>
        {prompt}
        </user_prompt>
        Map the parameter values found in the prompt to the template requirements: 
        <template_parameters_to_map>
        {params}
        </template_parameters_to_map>
        Return JSON with:
        - mapped_parameters: dict of parameters, with their key and value extracted from the original prompt, mapped to the template requirements e.g. {{param: {{type: str, value: any}}}}
        """
        
        response = self.bedrock.converse(
            modelId='amazon.nova-pro-v1:0',
            messages=[{'role': 'user', 'content': [{'text': prompt}]}],
            system=[{'text': system_content}],
            inferenceConfig={'maxTokens': 1000, 'temperature': 0.2}
        )
        
        response_text = response['output']['message']['content'][0]['text']
        if '```json' in response_text:
            start_idx = response_text.find('```json') + 7
            end_idx = response_text.find('```', start_idx)
            response_text = response_text[start_idx:end_idx]
        logger.debug(f"map_parameter_values: Response: {response_text}...")
        return json.loads(response_text)['mapped_parameters']


    async def generate_description(self, prompt: str, template: ImageTemplate, missing_params: Optional[Dict]) -> str:
        logger.debug(f"generate_description: Creating description for prompt: {prompt[:50]}...")
        system_content = f"""
        Create a brief description of:
        1. What will be generated based on: {prompt}
        2. What parameters were found
        3. What parameters are missing (if any): {missing_params}
        
        
        Do not attempt to render an image or visual within the description
        Keep it concise and user-friendly.
        """
        
        response = self.bedrock.converse(
            modelId='amazon.nova-pro-v1:0',
            messages=[{'role': 'user', 'content': [{'text': prompt}]}],
            system=[{'text': system_content}],
            inferenceConfig={'maxTokens': 1000, 'temperature': 0.7}
        )
        
        return response['output']['message']['content'][0]['text']