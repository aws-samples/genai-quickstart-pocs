import matplotlib.pyplot as plt
import numpy as np
import base64
import boto3
import json
from loguru import logger
import hashlib
from io import BytesIO
from typing import Dict, List, Optional
from .models import ImageRequest, ImageTemplate
from .storage import DynamoDBStorage
from PIL import Image, ImageDraw, ImageFont
import ast
import io

class ImageGenerator:
    def __init__(self):
        self.storage = DynamoDBStorage()
        self.bedrock = boto3.client('bedrock-runtime')

    def generate_image(self, request: ImageRequest, template: ImageTemplate, parameter_values: Dict[str,Dict[str,str]], previous_code: str = None, code_exception: Exception = None, retry_count = 0) -> str:
        logger.debug(f"generate_image: Processing request: {request.prompt[:50]}...")
        logger.debug(f"generate_image: Template: {template}")
        logger.debug(f"generate_image: Request parameters: {request.parameters}")
        
        function_id = self._get_function_id(request, template)
        function_code = self.storage.get_function(function_id)
        
        if not function_code and not code_exception:
            logger.debug("No existing function found, generating new one")
            code = self._generate_function_code(request, template, parameter_values)
            self.storage.store_function(function_id, code, {
                'template_id': template.id,
                'prompt': request.prompt,
                'parameters': template.parameters
            })
        elif code_exception:
            retry_count += 1
            logger.debug("Existing function found, but previous execution failed")
            code = self._generate_function_code(request, template, parameter_values, previous_code, code_exception, retry_count)
            self.storage.store_function(function_id, code, {
                'template_id': template.id,
                'prompt': request.prompt,
                'parameters': template.parameters
            })
        else:
            logger.debug("Using existing function")
            logger.debug(function_code)
            code = function_code['code']

        # libraries = self._import_required_libraries(template.required_libraries)
        exec_globals = {**globals()}
        local_vars = {}
        logger.debug(f"generate_image: Loading in function code: {code}")
        exec(code, exec_globals, local_vars)
        logger.debug(f"generate_image: Function code loaded, extracting function for execution")
        generate_func = local_vars['generate_image']
        logger.debug(f"generate_image: Retrieve function: {generate_func}")
        logger.debug(f"generate_image: Executing function with parameters: {request.parameters}")
        try:
            result = generate_func(request.parameters)
            return self._encode_result(result)
        except Exception as e:
            logger.error(f"generate_image: Error executing function: {e}")
            return self.generate_image(request, template, parameter_values, previous_code=code, code_exception=e, retry_count=retry_count)
    
    def _get_function_id(self, request: ImageRequest, template: ImageTemplate) -> str:
        key_components = [
            template.id,
            str(sorted(template.parameters.items())),
        ]
        return hashlib.md5(''.join(key_components).encode()).hexdigest()
    
    def _import_required_libraries(self, libraries: List[str]) -> Dict:
        logger.debug(f"_import_required_libraries: Importing {libraries}")
        imports = {}
        for lib in libraries:
            if '.' in lib:
                module, alias = lib.split(' as ') if ' as ' in lib else (lib, lib.split('.')[-1])
                imports[alias] = __import__(module, fromlist=[alias])
            else:
                imports[lib] = __import__(lib)
        return imports
    
    def _generate_function_code(self, request: ImageRequest, template: ImageTemplate, parameter_values: Dict[str,Dict[str,str]], previous_code: str = None, code_exception: str = None, retry_count = 0) -> str:
        if retry_count > 3:
            raise Exception("Failed to generate code after multiple retries")
        logger.debug(f"_generate_function_code: Generating code for: {request.prompt[:50]}...")
        system_content = f"""
        Create a Python function that generates the requested visualization.
        The function should:
        1. Be named 'generate_image'
        2. Take a 'params' argument containing: 
            <request_param_definitons>{template.parameters}</request_param_definitions>
            <request_param_values>{parameter_values}</request_param_values>
            Make sure to properly parse the parameter value from the parameter dict for each parameter.
            For example, if you have a parameter 'size', you should parse it as 'size = params['size']['value']'.
        3. The function should end with RETURN of a matplotlib figure or PIL image object. Do not display the image.
        4. The code should only have the one function to execute and no other code to execute outside the defined generate_image function.
        5. The function should be able to execute successfully, using the provided parameters, without raising an exception.
        6. Use `loguru` as the logger. Add debug logging throughout the function code to better understand the execution flow and identify faults better.
        7. Figures should be a minimum of 500x500 pixels, but can be more if needed. 
        
        The user requested an image based on this input:
        <user_request_input>
        {request.prompt}
        </user_request_input>

        If the image complexity is beyond the ability of basic python code, you can use Amazon Bedrock with the Nova Canvas Model to generate the complete image.
        The modelId is 'amazon.nova-canvas-v1:0'.
        If you use the Bedrock model, there should only be a single "prompt" parameter, which is the text prompt for the image.

        If you use the Bedrock model, the request body should look like this example:
        {{
            "modelId": "amazon.nova-canvas-v1:0",
            "contentType": "application/json",
            "accept": "application/json",
            "body": "{{\"textToImageParams\":{{\"text\":\"this is where you place your input text\"}},\"taskType\":\"TEXT_IMAGE\",\"imageGenerationConfig\":{{\"cfgScale\":8,\"seed\":42,\"quality\":\"standard\",\"width\":1024,\"height\":1024,\"numberOfImages\":3}}}}"
        }}"""
        if previous_code:
            system_content += f"""
            Here's the previous attempt at generating code for the image. 
            The previous_code is BAD code that fails to execute. 
            You need to generate code that will work and not raise an exception.
            <previous_code>
            {previous_code}
            </previous_code>
            """
        if code_exception:
            system_content += f"""
            Here's the exception that was raised when the previous code was executed.
            Review the exeception, think about the cause of the exception and generate new code that will not raise an exception.
            <code_exception>
            {code_exception}
            </code_exception>
            """
        system_content += f"""
        
        Return only the python code for the function. If you are provided a previous_code and code_exception, ensure the newly generated code resolves the exception.
        """

        # logger.debug(f"_generate_function_code: Model Prompt - {system_content}")
        
        response = self.bedrock.converse(
            modelId='anthropic.claude-3-5-sonnet-20240620-v1:0',
            messages=[{'role': 'user', 'content': [{'text': system_content}]}],
            # inferenceConfig={'maxTokens': 1000, 'temperature': 0.2}
        )
        
        response_text = response['output']['message']['content'][0]['text']
        if '```python' in response_text:
            start_idx = response_text.find('```python') + 9
            end_idx = response_text.find('```', start_idx)
            response_text = response_text[start_idx:end_idx]
            
        return response_text.strip()
    
    def _encode_result(self, result) -> str:
        logger.debug(f"_encode_result: Encoding generated image; type: {type(result)}")
        buf = BytesIO()
        if isinstance(result, plt.Figure):
            logger.debug('saving figure as svg to buffer')
            result.savefig(buf, format='svg')
            buf.seek(0)
        elif isinstance(result, Image.Image):
            logger.debug('saving image as png to buffer')
            result.save(buf, format='PNG')
        else:
            logger.debug('saving else as png to buffer')
            result.save(buf, format='PNG')
        
        encoded_image = base64.b64encode(buf.getvalue()).decode()
        return encoded_image, "image/png" if not isinstance(result, plt.Figure) else "image/svg+xml"
    
    def improve_image(self, function_id: str, original_code: str, feedback: str) -> str:
        logger.debug(f"improve_image: Processing feedback: {feedback[:50]}...")
        
        system_content = f"""
        Improve this image generation function based on user feedback.
        Original function:
        {original_code}
        
        User feedback: {feedback}
        
        Return only the improved Python code and nothing else.
        """
        
        response = self.bedrock.converse(
            modelId='amazon.nova-pro-v1:0',
            messages=[{'role': 'user', 'content': [{'text': system_content}]}],
            inferenceConfig={'maxTokens': 1000, 'temperature': 0.2}
        )
        
        response_text = response['output']['message']['content'][0]['text']
        if '```python' in response_text:
            start_idx = response_text.find('```python') + 9
            end_idx = response_text.find('```', start_idx)
            response_text = response_text[start_idx:end_idx]
            
        return response_text.strip()