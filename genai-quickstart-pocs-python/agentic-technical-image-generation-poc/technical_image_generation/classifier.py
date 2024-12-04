import boto3
import json
import uuid
from typing import Tuple, Dict, Any, List
from loguru import logger
from .models import ImageTemplate
from .storage import DynamoDBStorage
from PIL import Image

class ImageClassifier:
    def __init__(self, storage: DynamoDBStorage):
        self.storage = storage
        self.bedrock = boto3.client('bedrock-runtime')

    async def classify_request(self, prompt: str) -> ImageTemplate:
        logger.debug(f"classify_request: Processing prompt: {prompt[:50]}...")
        templates = self.storage.get_templates()
        
        if not templates:
            template = await self._generate_template(prompt)
            self.storage.create_template(template)
            return template
            
        return await self._find_or_create_template(prompt, templates)

    async def _bedrock_chat(self, system_content: str, prompt: str) -> Dict:
        logger.debug(f"_bedrock_chat: System content: {system_content[:50]}...")
        response = self.bedrock.converse(
            modelId='amazon.nova-pro-v1:0',
            messages=[{'role': 'user', 'content': [{'text': prompt}]}],
            system=[{'text': system_content}],
            inferenceConfig={'maxTokens': 1000, 'temperature': 0.7, 'topP': 0.9}
        )
        
        response_text = response['output']['message']['content'][0]['text']
        if '```json' in response_text:
            start_idx = response_text.find('```json') + 7
            end_idx = response_text.find('```', start_idx)
            response_text = response_text[start_idx:end_idx]
        logger.debug(f"_bedrock_chat: Response: {response_text}...")            
        return json.loads(response_text)

    async def _generate_template(self, prompt: str) -> ImageTemplate:
        logger.debug(f"_generate_template: Creating template for: {prompt[:50]}...")
        system_content = """Create a technical image template based on the prompt.
        Return JSON with:
        - name: template name
        - description: detailed description of the template
        - parameters: dict of parameters with their types and if required. Parameter types supported: str. Numbers should be parsed from str.
        - examples: list of example prompts that fit this template


        Only output the JSON and nothing else.
        """
        
        data = await self._bedrock_chat(system_content, prompt)
        return ImageTemplate(id=str(uuid.uuid4()), **data)

    async def _find_or_create_template(self, prompt: str, templates: list) -> ImageTemplate:
        logger.debug(f"_find_or_create_template: Analyzing prompt: {prompt[:50]}...")
        examples = [
            {"text": ex, "template": t.name, "id": t.id}
            for t in templates
            for ex in t.examples
        ]
        
        system_content = f"""Given the following examples, determine if the prompt fits an existing template.
        Return JSON with:
        - matches_existing: boolean
        - template_id: existing template id if matches_existing is true, null if false

        <examples>
         {examples}
        </examples>
        
        Return only the JSON output and nothing else."""
        
        result = await self._bedrock_chat(system_content, prompt)
        
        if result['matches_existing']:
            return next(t for t in templates if t.id == result['template_id'])
        return await self._generate_template(prompt)