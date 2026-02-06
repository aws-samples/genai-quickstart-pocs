"""Script to create DynamoDB tables"""
import json
import boto3
from botocore.exceptions import ClientError
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from src.shared.config import config


def create_tables():
    """Create all DynamoDB tables"""
    
    # Initialize DynamoDB client
    dynamodb_kwargs = {'region_name': config.AWS_REGION}
    if config.DYNAMODB_ENDPOINT:
        dynamodb_kwargs['endpoint_url'] = config.DYNAMODB_ENDPOINT
    
    dynamodb = boto3.client('dynamodb', **dynamodb_kwargs)
    
    # Load table definitions
    with open('config/dynamodb_tables.json', 'r', encoding='utf-8') as f:
        table_config = json.load(f)
    
    created_tables = []
    existing_tables = []
    
    for table_def in table_config['tables']:
        table_name = table_def['TableName']
        
        try:
            # Check if table exists
            dynamodb.describe_table(TableName=table_name)
            existing_tables.append(table_name)
            print(f"✓ Table '{table_name}' already exists")
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                # Table doesn't exist, create it
                try:
                    dynamodb.create_table(**table_def)
                    created_tables.append(table_name)
                    print(f"✓ Created table '{table_name}'")
                except ClientError as create_error:
                    print(f"✗ Error creating table '{table_name}': {create_error}")
                    raise
            else:
                print(f"✗ Error checking table '{table_name}': {e}")
                raise
    
    print(f"\nSummary:")
    print(f"  Created: {len(created_tables)} tables")
    print(f"  Existing: {len(existing_tables)} tables")
    
    if created_tables:
        print(f"\nWaiting for tables to become active...")
        waiter = dynamodb.get_waiter('table_exists')
        for table_name in created_tables:
            waiter.wait(TableName=table_name)
        print("✓ All tables are active")
    
    return created_tables, existing_tables


if __name__ == '__main__':
    print("Creating DynamoDB tables...\n")
    create_tables()
    print("\n✓ Done!")
