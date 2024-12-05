import boto3
from typing import List
from .models import ImageTemplate
from loguru import logger
import os

class DynamoDBStorage:
    def __init__(self):
        self.dynamodb = boto3.resource("dynamodb")
        self.templates_table = self.dynamodb.Table(
            os.environ.get("TEMPLATES_TABLE")
        )
        self.functions_table = self.dynamodb.Table(
            os.environ.get("FUNCTIONS_TABLE")
        )

    def create_template(self, template: ImageTemplate) -> None:
        logger.debug("Creating template")
        logger.trace("Create template details", template)
        self.templates_table.put_item(
            Item={
                "id": template.id,
                "name": template.name,
                "description": template.description,
                "parameters": template.parameters,
                "examples": template.examples or [],
            }
        )

    def get_templates(self) -> List[ImageTemplate]:
        logger.debug("Retrieving templates")
        response = self.templates_table.scan()
        logger.trace("Template scan response", response)
        return [
            ImageTemplate(
                id=item["id"],
                name=item["name"],
                description=item["description"],
                parameters=item["parameters"],
                examples=item.get("examples", []),
            )
            for item in response.get("Items", [])
        ]

    def update_template(self, template: ImageTemplate) -> None:
        logger.debug(f"Updating template", template)
        self.templates_table.update_item(
            Key={"id": template.id},
            UpdateExpression="SET #name = :name, description = :desc, parameters = :params, examples = :ex",
            ExpressionAttributeNames={"#name": "name"},
            ExpressionAttributeValues={
                ":name": template.name,
                ":desc": template.description,
                ":params": template.parameters,
                ":ex": template.examples or [],
            },
        )

    def delete_template(self, template_id: str) -> None:
        logger.debug("Deleting template", template_id)
        self.templates_table.delete_item(Key={"id": template_id})

    def store_function(self, function_id: str, code: str, metadata: dict) -> None:
        logger.debug("Storing function", function_id)
        logger.trace("Function details", function_id, code, metadata)
        self.functions_table.put_item(
            Item={"id": function_id, "code": code, "metadata": metadata}
        )

    def get_function(self, function_id: str) -> dict:
        logger.debug("Retrieving function", function_id)
        response = self.functions_table.get_item(Key={"id": function_id})
        return response.get("Item")
