import matplotlib.pyplot as plt
import numpy as np
import base64
import boto3
import json
import hashlib
from io import BytesIO
from typing import Dict, List, Optional
from .models import ImageRequest, ImageTemplate
from .storage import DynamoDBStorage

class ImageGenerator:
    def __init__(self):
        self.storage = DynamoDBStorage()
        self.bedrock = boto3.client('bedrock-runtime')

    def generate_image(self, request: ImageRequest, template: ImageTemplate) -> str:
        print(f"generate_image: Processing request: {request.prompt[:50]}...")
        
        function_id = self._get_function_id(request, template)
        function_code = self.storage.get_function(function_id)
        
        if not function_code:
            print("No existing function found, generating new one")
            code = self._generate_function_code(request, template)
            self.storage.store_function(function_id, code, {
                'template_id': template.id,
                'prompt': request.prompt,
                'parameters': template.parameters
            })
        else:
            print("Using existing function")
            print(function_code)
            code = function_code['code']

        libraries = self._import_required_libraries(template.required_libraries)
        exec_globals = {**globals(), **libraries}
        local_vars = {}
        
        exec(code, exec_globals, local_vars)
        generate_func = local_vars['generate_image']
        
        result = generate_func(request.parameters or {})
        return self._encode_result(result)
    
    def _get_function_id(self, request: ImageRequest, template: ImageTemplate) -> str:
        key_components = [
            template.id,
            str(sorted(template.parameters.items())),
            str(sorted(template.required_libraries))
        ]
        return hashlib.md5(''.join(key_components).encode()).hexdigest()
    
    def _import_required_libraries(self, libraries: List[str]) -> Dict:
        print(f"_import_required_libraries: Importing {libraries}")
        imports = {}
        for lib in libraries:
            if '.' in lib:
                module, alias = lib.split(' as ') if ' as ' in lib else (lib, lib.split('.')[-1])
                imports[alias] = __import__(module, fromlist=[alias])
            else:
                imports[lib] = __import__(lib)
        return imports
    
    def _generate_function_code(self, request: ImageRequest, template: ImageTemplate) -> str:
        print(f"_generate_function_code: Generating code for: {request.prompt[:50]}...")
        system_content = f"""
        Create a Python function that generates the requested visualization.
        Use only these libraries: {', '.join(template.required_libraries)}
        The function should:
        1. Be named 'generate_image'
        2. Take a 'params' argument containing: {template.parameters}
        3. Return a matplotlib figure or PIL Image
        4. If there's not a programmatic way to generate an image, use Amazon Bedrock Titan Image Generator with boto3
        
        User request: {request.prompt}

        Only output the python code and nothing else.
        """
        
        response = self.bedrock.converse(
            modelId='anthropic.claude-3-sonnet-20240229-v1:0',
            messages=[{'role': 'user', 'content': [{'text': system_content}]}],
            inferenceConfig={'maxTokens': 1000, 'temperature': 0.2}
        )
        
        response_text = response['output']['message']['content'][0]['text']
        if '```python' in response_text:
            start_idx = response_text.find('```python') + 9
            end_idx = response_text.find('```', start_idx)
            response_text = response_text[start_idx:end_idx]
            
        return response_text.strip()
    
    def _encode_result(self, result) -> str:
        print("_encode_result: Encoding generated image")
        buf = BytesIO()
        if isinstance(result, plt.Figure):
            result.savefig(buf, format='svg')
            plt.close(result)
        else:
            result.save(buf, format='PNG')
        
        return base64.b64encode(buf.getvalue()).decode()
    
    def improve_image(self, function_id: str, original_code: str, feedback: str) -> str:
        print(f"improve_image: Processing feedback: {feedback[:50]}...")
        
        system_content = f"""
        Improve this image generation function based on user feedback.
        Original function:
        {original_code}
        
        User feedback: {feedback}
        
        Return only the improved Python code and nothing else.
        """
        
        response = self.bedrock.converse(
            modelId='anthropic.claude-3-sonnet-20240229-v1:0',
            messages=[{'role': 'user', 'content': [{'text': system_content}]}],
            inferenceConfig={'maxTokens': 1000, 'temperature': 0.2}
        )
        
        response_text = response['output']['message']['content'][0]['text']
        if '```python' in response_text:
            start_idx = response_text.find('```python') + 9
            end_idx = response_text.find('```', start_idx)
            response_text = response_text[start_idx:end_idx]
            
        return response_text.strip()