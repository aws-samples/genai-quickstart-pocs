#!/usr/bin/env python3

import boto3
import sys
import os
from botocore.exceptions import ClientError

def delete_s3_service_outputs(service_name, bucket_name):
    """Delete S3 objects for the service"""
    s3 = boto3.client('s3')
    
    try:
        # List objects with service prefix
        response = s3.list_objects_v2(
            Bucket=bucket_name,
            Prefix=f'{service_name}/'
        )
        
        if 'Contents' in response:
            objects = [{'Key': obj['Key']} for obj in response['Contents']]
            s3.delete_objects(
                Bucket=bucket_name,
                Delete={'Objects': objects}
            )
            print(f"Deleted {len(objects)} S3 objects for {service_name}")
        else:
            print(f"No S3 objects found for {service_name}")
            
    except ClientError as e:
        print(f"Error deleting S3 objects: {e}")

def delete_dynamodb_service_items(service_name, table_names):
    """Delete DynamoDB items for the service"""
    dynamodb = boto3.resource('dynamodb')
    
    for table_name in table_names:
        try:
            table = dynamodb.Table(table_name)
            deleted_count = 0
            
            # Try service_name first, then service_id
            for key_name in ['service_name', 'service_id']:
                try:
                    response = table.scan(
                        FilterExpression='#sn = :service',
                        ExpressionAttributeNames={'#sn': key_name},
                        ExpressionAttributeValues={':service': service_name}
                    )
                    
                    # Get table key schema to determine proper delete key
                    key_schema = table.key_schema
                    partition_key = next(k['AttributeName'] for k in key_schema if k['KeyType'] == 'HASH')
                    sort_key = next((k['AttributeName'] for k in key_schema if k['KeyType'] == 'RANGE'), None)
                    
                    # Delete items
                    with table.batch_writer() as batch:
                        for item in response['Items']:
                            delete_key = {partition_key: item[partition_key]}
                            if sort_key:
                                delete_key[sort_key] = item[sort_key]
                            batch.delete_item(Key=delete_key)
                            deleted_count += 1
                    
                    if deleted_count > 0:
                        print(f"Deleted {deleted_count} items from {table_name}")
                        break
                        
                except ClientError as e:
                    if 'ValidationException' in str(e):
                        continue  # Try next key name
                    raise
            
            if deleted_count == 0:
                print(f"No items found in {table_name} for {service_name}")
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                print(f"Table {table_name} not found, skipping")
            else:
                print(f"Error deleting from {table_name}: {e}")

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 cleanup_service.py <SERVICE_NAME>")
        sys.exit(1)
    
    service_name = sys.argv[1]
    
    # Get account and region
    sts = boto3.client('sts')
    account = sts.get_caller_identity()['Account']
    region = boto3.Session().region_name or 'us-east-1'
    
    # S3 bucket
    output_bucket = f"gensec-security-config-outputs-{account}-{region}"
    
    # DynamoDB tables
    tables = [
        'gensec-AWSServiceActions',
        'gensec-AWSServiceParameters', 
        'gensec-AWSServiceInventory',
        'gensec-AWSServiceResources',
        'gensec-SecurityControlLibrary',
        'gensec-ServiceRequestTracking',
        'gensec-ServiceProfileLibrary'
    ]
    
    print(f"Cleaning up service: {service_name}")
    
    # Delete S3 outputs
    delete_s3_service_outputs(service_name, output_bucket)
    
    # Delete DynamoDB items
    delete_dynamodb_service_items(service_name, tables)
    
    # Delete local test outputs
    local_output_path = f"tests/output/{service_name}"
    if os.path.exists(local_output_path):
        import shutil
        shutil.rmtree(local_output_path)
        print(f"Deleted local output directory: {local_output_path}")
    
    print(f"Cleanup complete for {service_name}")

if __name__ == "__main__":
    main()
