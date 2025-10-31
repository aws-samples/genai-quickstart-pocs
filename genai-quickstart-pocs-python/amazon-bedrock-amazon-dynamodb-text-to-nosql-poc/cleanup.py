#!/usr/bin/env python3

"""
Clean up all AWS infrastructure for sales analyst app (DynamoDB version).
"""
import boto3
import os
import warnings
from dotenv import load_dotenv

# Suppress SSL warnings
warnings.filterwarnings('ignore', message='Unverified HTTPS request')
load_dotenv()

def cleanup_dynamodb():
    """Delete all Northwind DynamoDB tables."""
    dynamodb = boto3.client(
        'dynamodb', 
        region_name=os.getenv('AWS_REGION', 'us-east-1'),
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )
    
    sales_tables = [
        'sales_transactions',
        # Old tables
        'northwind_customers', 'northwind_products', 'northwind_orders', 'northwind_order_details', 
        'northwind_categories', 'northwind_suppliers', 'northwind_employees', 'northwind_shippers',
        'customers', 'products', 'orders', 'order_details', 'categories', 'suppliers', 'employees', 'shippers'
    ]
    
    deleted_count = 0
    try:
        # Get all tables
        response = dynamodb.list_tables()
        existing_tables = response.get('TableNames', [])
        
        # Delete sales analyst tables
        for table_name in sales_tables:
            if table_name in existing_tables:
                try:
                    dynamodb.delete_table(TableName=table_name)
                    print(f"✅ Deleted DynamoDB table: {table_name}")
                    deleted_count += 1
                except Exception as e:
                    print(f"⚠️ Error deleting table {table_name}: {e}")
    except Exception as e:
        print(f"⚠️ DynamoDB cleanup: {e}")
    
    return deleted_count

def cleanup_local():
    """Clean up local files."""
    files_to_remove = [
        'metadata_cache.pkl',
        'local_northwind.db'
    ]
    
    for file in files_to_remove:
        if os.path.exists(file):
            os.remove(file)
            print(f"✅ Removed {file}")

def main():
    print("🧹 Starting cleanup of sales analyst DynamoDB infrastructure...")
    
    cleanup_local()
    dynamodb_count = cleanup_dynamodb()
    
    if dynamodb_count == 0:
        print("\n💭 Nothing to clean up - no sales analyst DynamoDB tables found.")
    else:
        print(f"\n✅ Cleanup complete! Removed {dynamodb_count} DynamoDB tables.")
        print("Run: streamlit run app.py")

if __name__ == "__main__":
    main()