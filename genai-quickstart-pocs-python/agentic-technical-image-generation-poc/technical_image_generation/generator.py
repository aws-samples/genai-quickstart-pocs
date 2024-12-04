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

    def run_image_generation(self, request: ImageRequest, template: ImageTemplate, parameter_values: Dict[str,Dict[str,str]], previous_code: str = None, code_exception: Exception = None, retry_count = 0) -> str:
        logger.debug("Generate image")
        logger.trace(f"generate_image", {
            'request': request,
            'template': template
        })
        
        function_id = self._get_function_id(request, template)
        function_code = self.storage.get_function(function_id)
        
        if not function_code and not code_exception:
            logger.debug("No existing function found. Generating new function code.")
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
            logger.trace("Existing function code data", function_code)
            code = function_code['code']

        # libraries = self._import_required_libraries(template.required_libraries)
        exec_globals = {**globals()}
        local_vars = {}
        logger.trace("Loading in function code", code)
        exec(code, exec_globals, local_vars)
        logger.trace("Function code loaded, extracting function for execution")
        generate_func = local_vars['generate_image']
        logger.trace(f"Function and Parameters\n{function_code}\n{request.parameters}")
        try:
            logger.trace("Executing function")
            result = generate_func(parameter_values)
            logger.trace("Function executed", result)
            return self._encode_result(result)
        except Exception as e:
            logger.error("Error executing function", e, request.parameters)
            return self.run_image_generation(request, template, parameter_values, previous_code=code, code_exception=e, retry_count=retry_count)
    
    def _get_function_id(self, request: ImageRequest, template: ImageTemplate) -> str:
        key_components = [
            template.id,
            str(sorted(template.parameters.items())),
        ]
        return hashlib.md5(''.join(key_components).encode()).hexdigest()
    
    
    def _generate_function_code(self, request: ImageRequest, template: ImageTemplate, parameter_values: Dict[str,Dict[str,str]], previous_code: str = None, code_exception: str = None, retry_count = 0) -> str:
        logger.debug("Beginning to generate function code")
        logger.trace("Retry count", retry_count)
        if retry_count > 3:
            raise Exception("Failed to generate code after multiple retries")
        logger.trace(f"_generate_function_code: Generating code",{ "prompt": request.prompt, "template": template, "parameter_values": parameter_values, "previous_code": previous_code, "code_exception": code_exception})
        system_content = f"""
        Create a Python function that generates the requested visualization.
        The function should:
        1. Be named 'generate_image'
        2. Take a 'params' argument
            - The parameter types are defined here:
            <request_param_definitons>
            {template.parameters}
            </request_param_definitions>
            - The parameter values are provided here:
            <request_param_values>
            {parameter_values}
            </request_param_values>
            - The generated code should properly extract the value of the parameter from the param object.
            - If the param is `size`, the value should be extracted as `size = params['size']['value']`
            - All parameters in the request_param_definitons should be extracted from the params object and used within the code. Do not exclude any parameters.
            - Parameters should NEVER be hardcoded in the code.
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

            You should review the previous code, understand the cause of the exception. 
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
        
        Return only the python code for the function. 
        If you are provided a previous_code and code_exception, ensure the newly generated code resolves the exception.
        All parameters MUST be extracted from the params object and used within the code. Do not exclude any parameters defined in request_param_definitons. 
        """
        logger.trace("Generate function code model prompt", system_content)
        
        response = self.bedrock.converse(
            # modelId='anthropic.claude-3-5-sonnet-20240620-v1:0',
            modelId='amazon.nova-lite-v1:0',
            messages=[{'role': 'user', 'content': [{'text': system_content}]}],
        )
        logger.trace("Response from model", response)
        
        response_text = response['output']['message']['content'][0]['text']
        if '```python' in response_text:
            start_idx = response_text.find('```python') + 9
            end_idx = response_text.find('```', start_idx)
            response_text = response_text[start_idx:end_idx]
        logger.trace("Generated code", response_text)
        return response_text.strip()
    
    def _encode_result(self, result) -> str:
        logger.trace(f"_encode_result: Encoding generated image; type: {type(result)}")
        buf = BytesIO()
        if isinstance(result, plt.Figure):
            logger.trace('saving figure as svg to buffer')
            result.savefig(buf, format='svg')
            buf.seek(0)
        elif isinstance(result, Image.Image):
            logger.trace('saving image as png to buffer')
            result.save(buf, format='PNG')
        else:
            logger.trace('saving else as png to buffer')
            result.save(buf, format='PNG')
        
        encoded_image = base64.b64encode(buf.getvalue()).decode()
        return encoded_image, "image/png" if not isinstance(result, plt.Figure) else "image/svg+xml"
    
    def improve_image(self, original_code: str, feedback) -> str:
        logger.debug("Improve Image")
        logger.trace(f"Improve Image", original_code, feedback)
        
        system_content = f"""
        Improve this image generation function based on user feedback.
        Original function:
        {original_code}
        
        User feedback: {feedback}
        
        Return only the improved Python code and nothing else.
        """
        logger.trace(f"Improve Image system content", system_content)
        response = self.bedrock.converse(
            modelId='amazon.nova-micro-v1:0',
            messages=[{'role': 'user', 'content': [{'text': system_content}]}],
            inferenceConfig={'maxTokens': 1000, 'temperature': 0.2}
        )
        logger.trace(f"Improve Image response", response)
        
        response_text = response['output']['message']['content'][0]['text']
        if '```python' in response_text:
            start_idx = response_text.find('```python') + 9
            end_idx = response_text.find('```', start_idx)
            response_text = response_text[start_idx:end_idx]
        
        logger.trace(f"Improve Image response text", response_text.strip())
        return response_text.strip()