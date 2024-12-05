import boto3
from botocore.exceptions import ClientError
import os
from dotenv import load_dotenv

load_dotenv()

def create_tables(dynamodb=None):
    if not dynamodb:
        dynamodb = boto3.client('dynamodb',
                              endpoint_url=os.getenv('DYNAMODB_ENDPOINT'),
                              region_name=os.getenv('AWS_REGION'))
    
    tables = {
        'technical_image_generation_templates': {
            'AttributeDefinitions': [
                {'AttributeName': 'id', 'AttributeType': 'S'}
            ],
            'KeySchema': [
                {'AttributeName': 'id', 'KeyType': 'HASH'}
            ]
        },
        'technical_image_generation_functions': {
            'AttributeDefinitions': [
                {'AttributeName': 'id', 'AttributeType': 'S'}
            ],
            'KeySchema': [
                {'AttributeName': 'id', 'KeyType': 'HASH'}
            ]
        }
    }

    for table_name, table_config in tables.items():
        try:
            print(f"Creating table: {table_name}")
            table_config.update({
                'TableName': table_name,
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            })
            table = dynamodb.create_table(**table_config)
            print(f"Table Status: {table['TableDescription']['TableStatus']}")
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceInUseException':
                print(f"Table {table_name} already exists")
            else:
                print(f"Error creating table {table_name}:")
                print(e)

if __name__ == '__main__':
    create_tables()