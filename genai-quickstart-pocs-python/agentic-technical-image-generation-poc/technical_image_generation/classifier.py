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
        self.bedrock = boto3.client("bedrock-runtime")

    async def classify_request(self, prompt: str) -> ImageTemplate:
        logger.debug("Classifying request into template")
        logger.trace("Processing prompt", prompt)
        templates = self.storage.get_templates()
        if not templates:
            logger.trace("No templates found, generating new template")
            template = await self._generate_template(prompt)
            self.storage.create_template(template)
            return template

        return await self._find_or_create_template(prompt, templates)

    async def _bedrock_chat(self, system_content: str, prompt: str) -> Dict:
        logger.trace(
            "Bedrock chat input data",
            system_content,
            prompt,
        )
        response = self.bedrock.converse(
            modelId="amazon.nova-pro-v1:0",
            messages=[{"role": "user", "content": [{"text": prompt}]}],
            system=[{"text": system_content}],
            inferenceConfig={"maxTokens": 1000, "temperature": 0.7, "topP": 0.9},
        )

        response_text = response["output"]["message"]["content"][0]["text"]
        if "```json" in response_text:
            start_idx = response_text.find("```json") + 7
            end_idx = response_text.find("```", start_idx)
            response_text = response_text[start_idx:end_idx]
        logger.trace("Extraced model response", response_text)
        return json.loads(response_text)

    async def _generate_template(self, prompt: str) -> ImageTemplate:
        logger.debug("Generating new template")
        system_content = """
        You are responsible from creating a reusable template for generating technical images that based on the user's prompt.
        The template will be reused in future requests to generate images.
        You should create a name, description, list of parmeters and examples for the template.

        Parameters should be simple string, number, or a list of string or numbers. No other data type is acceptable. 

        Return JSON with:
        - name: template name
        - description: detailed description of the template
        - parameters: dict of parameters with their types and if required. Parameter types supported: string, number, string array, number array.
        - examples: list of example prompts that fit this template

        User provided data should not be stored in the template as the template will be reused for multiple requests with different data values.

        <example_response>
        {{
            "name": "Template Name",
            "description": "Template description",
            "parameters": {{
                "paramOne": {{
                    "type": "str",
                }},
                "paramTwo": {{
                    "type": "list"
                }}
            }},
            "examples": ["Example prompt 1", "Example prompt 2"]
        }}

        Only output the JSON and nothing else.
        """
        logger.trace("Prompt data", prompt, system_content)
        data = await self._bedrock_chat(system_content, prompt)
        return ImageTemplate(id=str(uuid.uuid4()), **data)

    async def _find_or_create_template(
        self, prompt: str, templates: list
    ) -> ImageTemplate:
        logger.debug("Finding or creating template")
        logger.trace("Template finding input data", prompt, templates)
        data_mapped_templates = [
            {"text": ex, "template": t.name, "id": t.id}
            for t in templates
            for ex in t.examples
        ]

        system_content = f"""Given the following list of templates, determine if the prompt fits an existing template.
    
        <templates>
         {data_mapped_templates}
        </templates>

        If there's a similar template, but some parameters may be missing, select the template. The system will prompt for the missing parameters.
        
        Return JSON with:
        - matches_existing: boolean
        - template_id: existing template id if matches_existing is true, null if false
        
        Return only the JSON output and nothing else."""

        logger.trace(
            "Template finding generated data",
            system_content,
            data_mapped_templates,
            prompt,
        )
        result = await self._bedrock_chat(system_content, prompt)
        logger.trace("Template finding result", result)

        if result["matches_existing"]:
            logger.debug("Template found", result["template_id"])
            return next(t for t in templates if t.id == result["template_id"])
        logger.debug("Template not found, generating new template")
        new_template = await self._generate_template(prompt)
        self.storage.create_template(new_template)
        logger.trace("New template created", new_template)
        return new_template
