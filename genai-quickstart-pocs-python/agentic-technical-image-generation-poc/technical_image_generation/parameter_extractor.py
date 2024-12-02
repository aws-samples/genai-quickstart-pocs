import boto3
import json
from typing import Dict, Tuple, Optional
from .models import ImageTemplate

class ParameterExtractor:
    def __init__(self):
        self.bedrock = boto3.client('bedrock-runtime')

    async def extract_parameters(self, prompt: str, template: ImageTemplate) -> Tuple[Dict, Optional[Dict]]:
        print(f"extract_parameters: Analyzing prompt: {prompt[:50]}...")
        system_content = f"""
        Given this prompt: {prompt}
        Extract parameters for image generation based on these requirements: {template.parameters}
        Return JSON with:
        - found_parameters: dict of parameter values found in prompt
        - missing_parameters: dict of required parameters not found in prompt (null if all found)
        """
        
        response = self.bedrock.converse(
            modelId='anthropic.claude-3-sonnet-20240229-v1:0',
            messages=[{'role': 'user', 'content': [{'text': prompt}]}],
            system=[{'text': system_content}],
            inferenceConfig={'maxTokens': 1000, 'temperature': 0.2}
        )
        
        response_text = response['output']['message']['content'][0]['text']
        if '```json' in response_text:
            start_idx = response_text.find('```json') + 7
            end_idx = response_text.find('```', start_idx)
            response_text = response_text[start_idx:end_idx]
            
        result = json.loads(response_text)
        return result['found_parameters'], result['missing_parameters']

    async def generate_description(self, prompt: str, template: ImageTemplate, missing_params: Optional[Dict]) -> str:
        print(f"generate_description: Creating description for prompt: {prompt[:50]}...")
        system_content = f"""
        Create a brief description of:
        1. What will be generated based on: {prompt}
        2. What parameters were found
        3. What parameters are missing (if any): {missing_params}
        
        
        Do not attempt to render an image or visual within the description
        Keep it concise and user-friendly.
        """
        
        response = self.bedrock.converse(
            modelId='anthropic.claude-3-sonnet-20240229-v1:0',
            messages=[{'role': 'user', 'content': [{'text': prompt}]}],
            system=[{'text': system_content}],
            inferenceConfig={'maxTokens': 1000, 'temperature': 0.7}
        )
        
        return response['output']['message']['content'][0]['text']