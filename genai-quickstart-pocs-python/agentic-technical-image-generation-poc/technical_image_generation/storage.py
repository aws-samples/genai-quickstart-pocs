import boto3
from typing import List
from .models import ImageTemplate
from loguru import logger

class DynamoDBStorage:
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb')
        self.templates_table = self.dynamodb.Table('technical_image_generation_templates')
        self.functions_table = self.dynamodb.Table('technical_image_generation_functions')

    def create_template(self, template: ImageTemplate) -> None:
        logger.debug(f"create_template: Creating template: {template.name}")
        self.templates_table.put_item(Item={
            'id': template.id,
            'name': template.name,
            'description': template.description,
            'parameters': template.parameters,
            'examples': template.examples or []
        })

    def get_templates(self) -> List[ImageTemplate]:
        logger.debug("get_templates: Retrieving templates...")
        response = self.templates_table.scan()
        return [ImageTemplate(
            id=item['id'],
            name=item['name'],
            description=item['description'],
            parameters=item['parameters'],
            examples=item.get('examples', [])
        ) for item in response.get('Items', [])]

    def update_template(self, template: ImageTemplate) -> None:
        logger.debug(f"update_template: Updating template: {template.name}")
        self.templates_table.update_item(
            Key={'id': template.id},
            UpdateExpression='SET #name = :name, description = :desc, parameters = :params, examples = :ex',
            ExpressionAttributeNames={'#name': 'name'},
            ExpressionAttributeValues={
                ':name': template.name,
                ':desc': template.description,
                ':params': template.parameters,
                ':ex': template.examples or []
            }
        )

    def delete_template(self, template_id: str) -> None:
        logger.debug(f"delete_template: Deleting template: {template_id}")
        self.templates_table.delete_item(Key={'id': template_id})

    def store_function(self, function_id: str, code: str, metadata: dict) -> None:
        logger.debug(f"store_function: Storing function: {function_id}")
        self.functions_table.put_item(Item={
            'id': function_id,
            'code': code,
            'metadata': metadata
        })

    def get_function(self, function_id: str) -> dict:
        logger.debug(f"get_function: Retrieving function: {function_id}")
        response = self.functions_table.get_item(Key={'id': function_id})
        return response.get('Item')