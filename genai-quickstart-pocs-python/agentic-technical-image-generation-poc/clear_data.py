import boto3
from botocore.exceptions import ClientError

def delete_all_items():
    # Initialize DynamoDB client
    dynamodb = boto3.client('dynamodb')
    
    # Tables to clean
    tables = ['technical_image_generation_functions','technical_image_generation_templates']
    
    # Confirmation prompt
    confirm = input(f"Are you sure you want to delete all items from these tables: {tables}? (yes/no): ")
    if confirm.lower() != 'yes':
        print("Operation cancelled")
        return
    
    for table_name in tables:
        try:
            print(f"Deleting all items from table: {table_name}")
            
            # Get table resource
            dynamodb_resource = boto3.resource('dynamodb')
            table = dynamodb_resource.Table(table_name)
            
            # Scan and delete all items
            scan = table.scan()
            with table.batch_writer() as batch:
                for item in scan['Items']:
                    batch.delete_item(
                        Key={
                            'id': item['id']
                        }
                    )
            
            print(f"Successfully deleted all items from {table_name}")
            
        except ClientError as e:
            print(f"Error deleting items from table {table_name}:")
            print(e)

if __name__ == '__main__':
    delete_all_items()