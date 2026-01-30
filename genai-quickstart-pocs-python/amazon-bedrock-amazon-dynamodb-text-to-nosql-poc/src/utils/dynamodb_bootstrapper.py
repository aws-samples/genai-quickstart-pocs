"""
DynamoDB bootstrapper for the GenAI Sales Analyst application.
"""
import os
import pandas as pd
import streamlit as st
from decimal import Decimal
from src.utils.dynamodb_connector import (
    create_table, 
    batch_write_items, 
    get_available_tables,
    delete_table,
    get_table_info
)

# Table definitions for Northwind data
NORTHWIND_TABLES = {
    'northwind_customers': {
        'key_schema': [
            {'AttributeName': 'customerid', 'KeyType': 'HASH'}
        ],
        'attribute_definitions': [
            {'AttributeName': 'customerid', 'AttributeType': 'S'}
        ]
    },
    'northwind_products': {
        'key_schema': [
            {'AttributeName': 'productid', 'KeyType': 'HASH'}
        ],
        'attribute_definitions': [
            {'AttributeName': 'productid', 'AttributeType': 'N'}
        ]
    },
    'northwind_orders': {
        'key_schema': [
            {'AttributeName': 'orderid', 'KeyType': 'HASH'}
        ],
        'attribute_definitions': [
            {'AttributeName': 'orderid', 'AttributeType': 'N'}
        ]
    },
    'northwind_order_details': {
        'key_schema': [
            {'AttributeName': 'orderid', 'KeyType': 'HASH'},
            {'AttributeName': 'productid', 'KeyType': 'RANGE'}
        ],
        'attribute_definitions': [
            {'AttributeName': 'orderid', 'AttributeType': 'N'},
            {'AttributeName': 'productid', 'AttributeType': 'N'}
        ]
    },
    'northwind_categories': {
        'key_schema': [
            {'AttributeName': 'categoryid', 'KeyType': 'HASH'}
        ],
        'attribute_definitions': [
            {'AttributeName': 'categoryid', 'AttributeType': 'N'}
        ]
    },
    'northwind_suppliers': {
        'key_schema': [
            {'AttributeName': 'supplierid', 'KeyType': 'HASH'}
        ],
        'attribute_definitions': [
            {'AttributeName': 'supplierid', 'AttributeType': 'N'}
        ]
    },
    'northwind_employees': {
        'key_schema': [
            {'AttributeName': 'employeeid', 'KeyType': 'HASH'}
        ],
        'attribute_definitions': [
            {'AttributeName': 'employeeid', 'AttributeType': 'N'}
        ]
    },
    'northwind_shippers': {
        'key_schema': [
            {'AttributeName': 'shipperid', 'KeyType': 'HASH'}
        ],
        'attribute_definitions': [
            {'AttributeName': 'shipperid', 'AttributeType': 'N'}
        ]
    }
}

def check_northwind_exists():
    """Check if Northwind tables exist in DynamoDB with data."""
    try:
        existing_tables = get_available_tables()
        northwind_tables = list(NORTHWIND_TABLES.keys())
        
        # Check if all required tables exist
        for table_name in northwind_tables:
            if table_name not in existing_tables:
                return False
        
        # Check if tables have data (quick check on customers table)
        from src.utils.dynamodb_connector import execute_query
        try:
            customer_data = execute_query({'operation': 'scan', 'table_name': 'northwind_customers'})
            return customer_data and len(customer_data) > 5  # Should have more than sample data
        except Exception:
            return False
            
    except Exception as e:
        return False

def load_northwind_data():
    """Load complete Northwind data from GitHub."""
    from src.utils.github_data_loader import download_northwind_from_github, normalize_column_names
    
    # Download complete dataset
    raw_data = download_northwind_from_github()
    
    processed_data = {}
    
    for table_name, df in raw_data.items():
        # Normalize column names
        df = normalize_column_names(df, table_name)
        
        # Convert DataFrame to list of dictionaries
        records = df.to_dict('records')
        
        # Convert numeric fields to Decimal for DynamoDB
        for record in records:
            for key, value in record.items():
                if pd.isna(value):
                    record[key] = None
                elif isinstance(value, (int, float)) and not isinstance(value, bool):
                    record[key] = Decimal(str(value))
                elif isinstance(value, str):
                    record[key] = value.strip()
        
        processed_data[table_name] = records
        print(f"Processed {len(records)} {table_name} records")
    
    return processed_data

def bootstrap_northwind(show_progress=False):
    """Bootstrap Northwind database in DynamoDB."""
    if show_progress:
        st.info("🔄 Bootstrapping Northwind database in DynamoDB...")
        progress_bar = st.progress(0)
    
    try:
        # Get existing tables
        existing_tables = get_available_tables()
        
        # Delete existing Northwind tables if they exist
        for table_name in NORTHWIND_TABLES.keys():
            if table_name in existing_tables:
                if show_progress:
                    progress_bar.progress(0.1, text=f"Deleting existing table {table_name}...")
                delete_table(table_name)
        
        if show_progress:
            progress_bar.progress(0.2, text="Creating tables...")
        
        # Create tables in parallel
        import concurrent.futures
        
        def create_single_table(item):
            table_name, table_config = item
            return create_table(
                table_name,
                table_config['key_schema'],
                table_config['attribute_definitions']
            )
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            results = list(executor.map(create_single_table, NORTHWIND_TABLES.items()))
        
        if not all(results):
            if show_progress:
                st.error("❌ Failed to create some tables")
            return False
        
        if show_progress:
            progress_bar.progress(0.6, text="Loading sample data...")
        
        # Load complete Northwind data
        sample_data = load_northwind_data()
        
        for table_name, items in sample_data.items():
            if items:  # Only load if there are items
                # Use the prefixed table name
                prefixed_name = f"northwind_{table_name}"
                success = batch_write_items(prefixed_name, items)
                if not success:
                    if show_progress:
                        st.error(f"❌ Failed to load data into {prefixed_name}")
                    return False
                print(f"Loaded {len(items)} items into {prefixed_name}")
        
        if show_progress:
            progress_bar.progress(1.0, text="Completed!")
            st.success("✅ Northwind database successfully bootstrapped in DynamoDB.")
        
        return True
        
    except Exception as e:
        if show_progress:
            st.error(f"❌ Error bootstrapping Northwind database: {str(e)}")
        print(f"Error bootstrapping Northwind: {str(e)}")
        return False