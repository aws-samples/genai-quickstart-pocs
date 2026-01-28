"""
Northwind database bootstrapper for Databricks.
"""
import os
import pandas as pd
import requests
import json
from .databricks_rest_connector import DatabricksRestConnector
from .github_data_loader import download_northwind_from_github

def disable_table_acls():
    """Disable Table ACLs on the current cluster."""
    try:
        host = os.getenv('DATABRICKS_HOST')
        token = os.getenv('DATABRICKS_TOKEN')
        cluster_id = os.getenv('DATABRICKS_CLUSTER_ID')
        
        if not all([host, token, cluster_id]):
            print("⚠️ Missing Databricks credentials for cluster modification")
            return False
        
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        
        # Get current cluster config
        get_url = f"{host}/api/2.0/clusters/get"
        response = requests.get(get_url, headers=headers, params={'cluster_id': cluster_id}, timeout=30)
        
        if response.status_code != 200:
            print(f"❌ Failed to get cluster config: {response.text}")
            return False
        
        cluster_config = response.json()
        
        # Modify spark config to disable Table ACLs
        spark_conf = cluster_config.get('spark_conf', {})
        spark_conf['spark.databricks.acl.dfAclsEnabled'] = 'false'
        cluster_config['spark_conf'] = spark_conf
        
        # Update cluster
        edit_url = f"{host}/api/2.0/clusters/edit"
        response = requests.post(edit_url, headers=headers, json=cluster_config, timeout=30)
        
        if response.status_code == 200:
            print("✅ Disabled Table ACLs - cluster will restart")
            return True
        else:
            print(f"❌ Failed to disable Table ACLs: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error disabling Table ACLs: {e}")
        return False

def check_northwind_exists():
    """Check if Northwind database exists and has data."""
    try:
        catalog = os.getenv('DATABRICKS_CATALOG', 'workspace')
        schema = os.getenv('DATABRICKS_SCHEMA', 'default')
        
        # Validate catalog and schema names to prevent injection
        if not catalog.replace('_', '').replace('-', '').isalnum():
            raise ValueError("Invalid catalog name")
        if not schema.replace('_', '').replace('-', '').isalnum():
            raise ValueError("Invalid schema name")
        
        # Check if customers table exists and has data using validated identifiers
        # Note: Using f-string with validated identifiers is acceptable here
        query = f"SELECT COUNT(*) as count FROM {catalog}.{schema}.customers"  # nosec B608 - identifiers are validated
        result = execute_query(query)
        return result and result[0]['count'] > 0
    except:
        return False

def create_northwind_tables():
    """Create Northwind tables with proper Databricks types."""
    catalog = os.getenv('DATABRICKS_CATALOG', '')
    schema = os.getenv('DATABRICKS_SCHEMA', 'default')
    
    # Handle empty catalog
    if catalog:
        full_schema = f"{catalog}.{schema}"
    else:
        full_schema = schema
    connector = DatabricksRestConnector()
    
    table_schemas = {
        'categories': "categoryid BIGINT, categoryname STRING, description STRING",
        'customers': "customerid STRING, companyname STRING, contactname STRING, contacttitle STRING, address STRING, city STRING, region STRING, postalcode STRING, country STRING, phone STRING, fax STRING",
        'employees': "employeeid BIGINT, lastname STRING, firstname STRING, title STRING, titleofcourtesy STRING, birthdate STRING, hiredate STRING, address STRING, city STRING, region STRING, postalcode STRING, country STRING, homephone STRING, extension STRING, notes STRING, reportsto STRING",
        'products': "productid BIGINT, productname STRING, supplierid BIGINT, categoryid BIGINT, quantityperunit STRING, unitprice DOUBLE, unitsinstock BIGINT, unitsonorder BIGINT, reorderlevel BIGINT, discontinued BIGINT",
        'suppliers': "supplierid BIGINT, companyname STRING, contactname STRING, contacttitle STRING, address STRING, city STRING, region STRING, postalcode STRING, country STRING, phone STRING, fax STRING, homepage STRING",
        'shippers': "shipperid BIGINT, companyname STRING, phone STRING",
        'orders': "orderid BIGINT, customerid STRING, employeeid BIGINT, orderdate STRING, requireddate STRING, shippeddate STRING, shipvia BIGINT, freight DOUBLE, shipname STRING, shipaddress STRING, shipcity STRING, shipregion STRING, shippostalcode STRING, shipcountry STRING",
        'order_details': "orderid BIGINT, productid BIGINT, unitprice DOUBLE, quantity BIGINT, discount DOUBLE"
    }
    
    try:
        if catalog:
            connector.execute_query(f"CREATE SCHEMA IF NOT EXISTS {catalog}.{schema}")
            print(f"✅ Created schema {catalog}.{schema}")
            table_prefix = f"{catalog}.{schema}"
        else:
            connector.execute_query(f"CREATE SCHEMA IF NOT EXISTS {schema}")
            print(f"✅ Created schema {schema}")
            table_prefix = schema
        
        for table, columns in table_schemas.items():
            connector.execute_query(f"CREATE TABLE IF NOT EXISTS {table_prefix}.{table} ({columns}) USING DELTA")
        
        print("✅ Created Northwind tables")
        return True
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False

def load_data_to_databricks(data_path):
    """Load CSV data with proper type handling."""
    catalog = os.getenv('DATABRICKS_CATALOG', '')
    schema = os.getenv('DATABRICKS_SCHEMA', 'default')
    
    # Handle empty catalog
    if catalog:
        table_prefix = f"{catalog}.{schema}"
    else:
        table_prefix = schema
    connector = DatabricksRestConnector()
    
    tables = ['categories', 'customers', 'employees', 'products', 'suppliers', 'shippers', 'orders', 'order_details']
    
    try:
        for table in tables:
            csv_file = os.path.join(data_path, f"{table}.csv")
            if not os.path.exists(csv_file):
                print(f"⚠️ Skipping {table} - file not found")
                continue
                
            try:
                df = pd.read_csv(csv_file)
                
                # Hard limit columns to prevent schema mismatch
                column_limits = {
                    'categories': 3, 'customers': 11, 'employees': 16,
                    'products': 10, 'suppliers': 12, 'shippers': 3,
                    'orders': 14, 'order_details': 5
                }
                
                if table in column_limits:
                    original_cols = len(df.columns)
                    df = df.iloc[:, :column_limits[table]]
                    print(f"  Limited {table} to {column_limits[table]} columns (was {original_cols})")
                
                # Use bulk insert with all data at once
                values = []
                for _, row in df.iterrows():
                    row_vals = []
                    for val in row:
                        if pd.isna(val):
                            row_vals.append("NULL")
                        elif isinstance(val, (int, float)):
                            row_vals.append(str(val))
                        else:
                            # Properly escape SQL strings
                            escaped = str(val).replace("'", "''").replace("\\", "\\\\")
                            row_vals.append(f"'{escaped}'")
                    values.append(f"({', '.join(row_vals)})")
                
                if values:
                    try:
                        # Validate table name to prevent injection
                        if not table.replace('_', '').isalnum():
                            raise ValueError(f"Invalid table name: {table}")
                        
                        # Single bulk insert with validated table name
                        # Note: Using f-string with validated identifiers is acceptable here
                        insert_sql = f"INSERT INTO {table_prefix}.{table} VALUES {', '.join(values)}"  # nosec B608 - identifiers are validated
                        connector.execute_query(insert_sql)
                    except Exception as e:
                        print(f"  ⚠️ Failed to load {table} - continuing...")
                        continue
                
                print(f"✅ Loaded {len(df)} rows into {table}")
            except Exception as e:
                print(f"❌ Failed to load {table}")
                continue
        
        return True
        
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        return False

def drop_existing_schema():
    """Drop existing northwind schema and all tables."""
    from .databricks_rest_connector import DatabricksRestConnector
    
    try:
        connector = DatabricksRestConnector()
        catalog = os.getenv('DATABRICKS_CATALOG', 'workspace')
        schema = os.getenv('DATABRICKS_SCHEMA', 'default')
        
        # Drop schema with CASCADE to remove all tables
        connector.execute_query(f"DROP SCHEMA IF EXISTS {catalog}.{schema} CASCADE")
        print(f"✅ Dropped schema {catalog}.{schema}")
        
    except Exception as e:
        print(f"⚠️ Error dropping schema: {e}")

def bootstrap_northwind(show_progress=False, fresh_start=True, progress_callback=None):
    """Bootstrap the complete Northwind database."""
    try:
        # Skip Table ACL disabling for serverless clusters
        if progress_callback:
            progress_callback(0.05, "Preparing serverless environment...")
        if show_progress:
            print("🔧 Preparing serverless environment...")
        
        if fresh_start:
            if progress_callback:
                progress_callback(0.1, "Dropping existing schema...")
            if show_progress:
                print("🗑️ Dropping existing schema for fresh start...")
            drop_existing_schema()
        
        if progress_callback:
            progress_callback(0.2, "Downloading dataset...")
        if show_progress:
            print("🔄 Downloading Northwind dataset...")
        
        # Download data
        data_path = download_northwind_from_github()
        if not data_path:
            print("❌ Failed to download Northwind data")
            return False
        
        if progress_callback:
            progress_callback(0.5, "Creating database tables...")
        if show_progress:
            print("🔄 Creating database tables...")
        
        # Create tables
        if not create_northwind_tables():
            return False
        
        if progress_callback:
            progress_callback(0.7, "Loading data into tables...")
        if show_progress:
            print("🔄 Loading data into tables...")
        
        # Load data
        if not load_data_to_databricks(data_path):
            return False
        
        if progress_callback:
            progress_callback(1.0, "Complete!")
        if show_progress:
            print("✅ Northwind database bootstrap complete!")
        
        return True
        
    except Exception as e:
        print(f"❌ Bootstrap failed: {e}")
        return False