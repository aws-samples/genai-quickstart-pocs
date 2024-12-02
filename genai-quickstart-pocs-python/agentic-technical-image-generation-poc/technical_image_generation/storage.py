import boto3
from typing import List
from .models import ImageTemplate

class DynamoDBStorage:
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb')
        self.templates_table = self.dynamodb.Table('technical_image_generation_templates')
        self.functions_table = self.dynamodb.Table('technical_image_generation_functions')

    def create_template(self, template: ImageTemplate) -> None:
        self.templates_table.put_item(Item={
            'id': template.id,
            'name': template.name,
            'description': template.description,
            'required_libraries': template.required_libraries,
            'parameters': template.parameters,
            'examples': template.examples or []
        })

    def get_templates(self) -> List[ImageTemplate]:
        response = self.templates_table.scan()
        return [ImageTemplate(
            id=item['id'],
            name=item['name'],
            description=item['description'],
            required_libraries=item['required_libraries'],
            parameters=item['parameters'],
            examples=item.get('examples', [])
        ) for item in response.get('Items', [])]

    def update_template(self, template: ImageTemplate) -> None:
        self.templates_table.update_item(
            Key={'id': template.id},
            UpdateExpression='SET #name = :name, description = :desc, required_libraries = :libs, parameters = :params, examples = :ex',
            ExpressionAttributeNames={'#name': 'name'},
            ExpressionAttributeValues={
                ':name': template.name,
                ':desc': template.description,
                ':libs': template.required_libraries,
                ':params': template.parameters,
                ':ex': template.examples or []
            }
        )

    def delete_template(self, template_id: str) -> None:
        self.templates_table.delete_item(Key={'id': template_id})

    def store_function(self, function_id: str, code: str, metadata: dict) -> None:
        self.functions_table.put_item(Item={
            'id': function_id,
            'code': code,
            'metadata': metadata
        })

    def get_function(self, function_id: str) -> dict:
        response = self.functions_table.get_item(Key={'id': function_id})
        return response.get('Item')