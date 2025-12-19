"""
Northwind database bootstrapper for the GenAI Sales Analyst application.
"""
import os
import requests
import pandas as pd
import tempfile
import sqlite3
import streamlit as st
import traceback
import psycopg2
from .redshift_connector_iam import get_redshift_connection

DATABASE_NAME = "SALES_ANALYST"
NORTHWIND_SCHEMA = "NORTHWIND"
NORTHWIND_TABLES = ["CUSTOMERS", "PRODUCTS", "ORDERS", "ORDER_DETAILS", "CATEGORIES", "SUPPLIERS", "EMPLOYEES", "SHIPPERS"]
NORTHWIND_DATA_URL = "https://github.com/lerocha/chinook-database/raw/master/ChinookDatabase/DataSources/Chinook_Sqlite.sqlite"

def check_northwind_exists():
    """Check if Northwind schema and tables exist in Redshift."""
    try:
        # Use get_redshift_connection for consistency
        conn = get_redshift_connection()
        
        cursor = conn.cursor()
        
        # Check if schema exists
        cursor.execute(f"SELECT schema_name FROM information_schema.schemata WHERE schema_name = '{NORTHWIND_SCHEMA.lower()}'")
        result = cursor.fetchall()
        if not result:
            print(f"Schema {NORTHWIND_SCHEMA} does not exist")
            return False
            
        # Check if tables exist
        for table in NORTHWIND_TABLES:
            cursor.execute(f"SELECT table_name FROM information_schema.tables WHERE table_schema = '{NORTHWIND_SCHEMA.lower()}' AND table_name = '{table.lower()}'")
            result = cursor.fetchall()
            if not result:
                print(f"Table {NORTHWIND_SCHEMA}.{table} does not exist")
                return False
                
        # Check if data exists (sample count from ORDERS table)
        cursor.execute(f"SELECT COUNT(*) FROM {NORTHWIND_SCHEMA.lower()}.orders")
        result = cursor.fetchone()
        if not result or result[0] < 1:
            print(f"No data in {NORTHWIND_SCHEMA}.ORDERS")
            return False
            
        return True
    except Exception as e:
        print(f"Error checking if Northwind exists: {str(e)}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

# Rest of the file remains unchanged
def create_northwind_schema():
    """Create Northwind schema in Redshift."""
    try:
        conn = get_redshift_connection()
        cursor = conn.cursor()
        
        # Check if schema already exists
        cursor.execute("""
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name = 'northwind'
        """)
        exists = cursor.fetchone()
        
        if exists:
            print(f"Schema {NORTHWIND_SCHEMA} already exists")
            conn.close()
            return True
        
        # Create schema
        cursor.execute(f"CREATE SCHEMA IF NOT EXISTS {NORTHWIND_SCHEMA.lower()}")
        conn.commit()
        print(f"Created schema {NORTHWIND_SCHEMA}")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error creating schema: {str(e)}")
        traceback.print_exc()
        # Try to close connection
        try:
            if 'cursor' in locals():
                cursor.close()
            if 'conn' in locals():
                conn.close()
        except:
            pass
        return False

def download_northwind_data():
    """Use sample Northwind data - instant local setup."""
    try:
        # Create sample data directly - no download needed
        temp_dir = tempfile.mkdtemp()
        sqlite_path = os.path.join(temp_dir, "northwind.db")
        
        print("✅ Creating sample Northwind data locally...")
        create_sample_northwind_data(sqlite_path)
        return sqlite_path
        
    except Exception as e:
        print(f"Error using bundled data: {str(e)}")
        return download_northwind_data_fallback()

def download_northwind_data_fallback():
    """Fallback download method if bundled file fails."""
    try:
        temp_dir = tempfile.mkdtemp()
        sqlite_path = os.path.join(temp_dir, "northwind.db")
        
        print(f"Downloading from GitHub...")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # Try multiple URLs
        urls = [
            "https://github.com/jpwhite3/northwind-SQLite3/raw/master/northwind.db",
            NORTHWIND_DATA_URL,
            "https://raw.githubusercontent.com/jpwhite3/northwind-SQLite3/master/northwind.db"
        ]
        
        for url in urls:
            try:
                response = requests.get(url, headers=headers, stream=True, timeout=30)
                if response.status_code == 200:
                    with open(sqlite_path, 'wb') as f:
                        for chunk in response.iter_content(chunk_size=8192):
                            f.write(chunk)
                    
                    # Verify it's a valid SQLite database
                    try:
                        test_conn = sqlite3.connect(sqlite_path)
                        test_cursor = test_conn.cursor()
                        test_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1")
                        test_cursor.fetchone()
                        test_conn.close()
                        print(f"Downloaded valid SQLite from: {url}")
                        return sqlite_path
                    except sqlite3.DatabaseError:
                        continue
            except Exception as e:
                print(f"Failed to download from {url}: {e}")
                continue
        
        # If all downloads failed, create sample data
        print("All downloads failed, creating sample Northwind data")
        create_sample_northwind_data(sqlite_path)
        return sqlite_path
        
    except Exception as e:
        print(f"Error creating sample data: {str(e)}")
        traceback.print_exc()
        return None

def create_sample_northwind_data(sqlite_path):
    """Create a sample Northwind database with basic data."""
    conn = sqlite3.connect(sqlite_path)
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute('''
    CREATE TABLE Customers (
        CustomerID TEXT PRIMARY KEY,
        CompanyName TEXT,
        ContactName TEXT,
        ContactTitle TEXT,
        Address TEXT,
        City TEXT,
        Region TEXT,
        PostalCode TEXT,
        Country TEXT,
        Phone TEXT,
        Fax TEXT
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE Products (
        ProductID INTEGER PRIMARY KEY,
        ProductName TEXT,
        SupplierID INTEGER,
        CategoryID INTEGER,
        QuantityPerUnit TEXT,
        UnitPrice REAL,
        UnitsInStock INTEGER,
        UnitsOnOrder INTEGER,
        ReorderLevel INTEGER,
        Discontinued INTEGER
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE Orders (
        OrderID INTEGER PRIMARY KEY,
        CustomerID TEXT,
        EmployeeID INTEGER,
        OrderDate TEXT,
        RequiredDate TEXT,
        ShippedDate TEXT,
        ShipVia INTEGER,
        Freight REAL,
        ShipName TEXT,
        ShipAddress TEXT,
        ShipCity TEXT,
        ShipRegion TEXT,
        ShipPostalCode TEXT,
        ShipCountry TEXT
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE Order_Details (
        OrderID INTEGER,
        ProductID INTEGER,
        UnitPrice REAL,
        Quantity INTEGER,
        Discount REAL,
        PRIMARY KEY (OrderID, ProductID)
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE Categories (
        CategoryID INTEGER PRIMARY KEY,
        CategoryName TEXT,
        Description TEXT
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE Suppliers (
        SupplierID INTEGER PRIMARY KEY,
        CompanyName TEXT,
        ContactName TEXT,
        ContactTitle TEXT,
        Address TEXT,
        City TEXT,
        Region TEXT,
        PostalCode TEXT,
        Country TEXT,
        Phone TEXT,
        Fax TEXT,
        HomePage TEXT
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE Employees (
        EmployeeID INTEGER PRIMARY KEY,
        LastName TEXT,
        FirstName TEXT,
        Title TEXT,
        TitleOfCourtesy TEXT,
        BirthDate TEXT,
        HireDate TEXT,
        Address TEXT,
        City TEXT,
        Region TEXT,
        PostalCode TEXT,
        Country TEXT,
        HomePhone TEXT,
        Extension TEXT,
        Notes TEXT,
        ReportsTo INTEGER
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE Shippers (
        ShipperID INTEGER PRIMARY KEY,
        CompanyName TEXT,
        Phone TEXT
    )
    ''')
    
    # Add sample data
    # Customers
    customers = [
        ('ALFKI', 'Alfreds Futterkiste', 'Maria Anders', 'Sales Representative', 'Obere Str. 57', 'Berlin', None, '12209', 'Germany', '030-0074321', '030-0076545'),
        ('ANATR', 'Ana Trujillo Emparedados y helados', 'Ana Trujillo', 'Owner', 'Avda. de la Constitución 2222', 'México D.F.', None, '05021', 'Mexico', '(5) 555-4729', '(5) 555-3745'),
        ('ANTON', 'Antonio Moreno Taquería', 'Antonio Moreno', 'Owner', 'Mataderos 2312', 'México D.F.', None, '05023', 'Mexico', '(5) 555-3932', None)
    ]
    cursor.executemany('INSERT INTO Customers VALUES (?,?,?,?,?,?,?,?,?,?,?)', customers)
    
    # Products
    products = [
        (1, 'Chai', 1, 1, '10 boxes x 20 bags', 18.0, 39, 0, 10, 0),
        (2, 'Chang', 1, 1, '24 - 12 oz bottles', 19.0, 17, 40, 25, 0),
        (3, 'Aniseed Syrup', 1, 2, '12 - 550 ml bottles', 10.0, 13, 70, 25, 0)
    ]
    cursor.executemany('INSERT INTO Products VALUES (?,?,?,?,?,?,?,?,?,?)', products)
    
    # Orders - using existing customer IDs
    orders = [
        (10248, 'ALFKI', 5, '1996-07-04', '1996-08-01', '1996-07-16', 3, 32.38, 'Alfreds Futterkiste', 'Obere Str. 57', 'Berlin', None, '12209', 'Germany'),
        (10249, 'ANATR', 6, '1996-07-05', '1996-08-16', '1996-07-10', 1, 11.61, 'Ana Trujillo Emparedados', 'Avda. de la Constitución 2222', 'México D.F.', None, '05021', 'Mexico'),
        (10250, 'ANTON', 4, '1996-07-08', '1996-08-05', '1996-07-12', 2, 65.83, 'Antonio Moreno Taquería', 'Mataderos 2312', 'México D.F.', None, '05023', 'Mexico'),
        (10251, 'ALFKI', 3, '1996-07-09', '1996-08-06', '1996-07-15', 1, 41.34, 'Alfreds Futterkiste', 'Obere Str. 57', 'Berlin', None, '12209', 'Germany'),
        (10252, 'ANATR', 4, '1996-07-10', '1996-08-07', '1996-07-11', 2, 51.30, 'Ana Trujillo Emparedados', 'Avda. de la Constitución 2222', 'México D.F.', None, '05021', 'Mexico')
    ]
    cursor.executemany('INSERT INTO Orders VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', orders)
    
    # Order Details - matching the orders above
    order_details = [
        (10248, 1, 14.0, 12, 0),
        (10248, 2, 9.8, 10, 0),
        (10249, 1, 18.6, 9, 0),
        (10249, 2, 42.4, 40, 0),
        (10250, 1, 7.7, 10, 0),
        (10250, 3, 42.4, 35, 0.15),
        (10251, 2, 16.8, 15, 0.15),
        (10251, 3, 25.0, 8, 0),
        (10252, 1, 14.0, 20, 0.1),
        (10252, 3, 10.0, 5, 0)
    ]
    cursor.executemany('INSERT INTO Order_Details VALUES (?,?,?,?,?)', order_details)
    
    # Categories
    categories = [
        (1, 'Beverages', 'Soft drinks coffees teas beers and ales'),
        (2, 'Condiments', 'Sweet and savory sauces relishes spreads and seasonings'),
        (3, 'Confections', 'Desserts candies and sweet breads')
    ]
    cursor.executemany('INSERT INTO Categories VALUES (?,?,?)', categories)
    
    # Suppliers
    suppliers = [
        (1, 'Exotic Liquids', 'Charlotte Cooper', 'Purchasing Manager', '49 Gilbert St.', 'London', None, 'EC1 4SD', 'UK', '(171) 555-2222', None, None),
        (2, 'New Orleans Cajun Delights', 'Shelley Burke', 'Order Administrator', 'P.O. Box 78934', 'New Orleans', 'LA', '70117', 'USA', '(100) 555-4822', None, None),
        (3, 'Grandma Kellys Homestead', 'Regina Murphy', 'Sales Representative', '707 Oxford Rd.', 'Ann Arbor', 'MI', '48104', 'USA', '(313) 555-5735', '(313) 555-3349', None)
    ]
    cursor.executemany('INSERT INTO Suppliers VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', suppliers)
    
    # Employees
    employees = [
        (1, 'Davolio', 'Nancy', 'Sales Representative', 'Ms.', '1968-12-08', '1992-05-01', '507 - 20th Ave. E. Apt. 2A', 'Seattle', 'WA', '98122', 'USA', '(206) 555-9857', '5467', 'Education includes a BA in psychology from Colorado State University.', 2),
        (2, 'Fuller', 'Andrew', 'Vice President Sales', 'Dr.', '1952-02-19', '1992-08-14', '908 W. Capital Way', 'Tacoma', 'WA', '98401', 'USA', '(206) 555-9482', '3457', 'Andrew received his BTS commercial and a Ph.D. in international marketing from the University of Dallas.', None),
        (3, 'Leverling', 'Janet', 'Sales Representative', 'Ms.', '1963-08-30', '1992-04-01', '722 Moss Bay Blvd.', 'Kirkland', 'WA', '98033', 'USA', '(206) 555-3412', '3355', 'Janet has a BS degree in chemistry from Boston College.', 2)
    ]
    cursor.executemany('INSERT INTO Employees VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', employees)
    
    # Shippers
    shippers = [
        (1, 'Speedy Express', '(503) 555-9831'),
        (2, 'United Package', '(503) 555-3199'),
        (3, 'Federal Shipping', '(503) 555-9931')
    ]
    cursor.executemany('INSERT INTO Shippers VALUES (?,?,?)', shippers)
    
    conn.commit()
    conn.close()

def extract_data_from_sqlite(sqlite_path):
    """Extract data from SQLite database into pandas DataFrames."""
    try:
        conn = sqlite3.connect(sqlite_path)
        
        # Dictionary to hold all tables' data
        tables_data = {}
        
        # Get all tables
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        
        print(f"Found tables in SQLite: {tables}")
        
        # Extract data from each table
        for table in tables:
            print(f"Extracting data from {table}")
            tables_data[table] = pd.read_sql_query(f"SELECT * FROM {table}", conn)
        
        conn.close()
        return tables_data
    except Exception as e:
        print(f"Error extracting data: {str(e)}")
        traceback.print_exc()
        return {}

def get_create_table_ddl(table_name, df):
    """Generate CREATE TABLE DDL from pandas DataFrame."""
    try:
        # Map pandas dtypes to Redshift data types
        dtype_map = {
            'int64': 'INTEGER',
            'float64': 'FLOAT',
            'object': 'VARCHAR(255)',
            'datetime64[ns]': 'TIMESTAMP',
            'bool': 'BOOLEAN'
        }
        
        columns = []
        for col, dtype in df.dtypes.items():
            sf_type = dtype_map.get(str(dtype), 'VARCHAR(255)')
            columns.append(f'"{col}" {sf_type}')
        
        ddl = f"CREATE TABLE {NORTHWIND_SCHEMA.lower()}.{table_name.lower()} (\n"
        ddl += ",\n".join(columns)
        ddl += "\n)"
        
        return ddl
    except Exception as e:
        print(f"Error generating DDL for {table_name}: {str(e)}")
        return None

def load_data_to_redshift_direct(tables_data):
    """Load DataFrame data directly into Redshift tables."""
    conn = get_redshift_connection()
    
    try:
        cursor = conn.cursor()
        
        # Create schema first in this connection
        cursor.execute(f"CREATE SCHEMA IF NOT EXISTS {NORTHWIND_SCHEMA.lower()}")
        conn.commit()
        print(f"Ensured schema {NORTHWIND_SCHEMA.lower()} exists")
        
        for table_name, df in tables_data.items():
            print(f"Creating table {table_name.lower()}")
            
            # Drop table if exists
            drop_sql = f"DROP TABLE IF EXISTS {NORTHWIND_SCHEMA.lower()}.{table_name.lower()}"
            cursor.execute(drop_sql)
            
            # Create table with proper column types
            create_table_sql = get_create_table_ddl_from_df(table_name.lower(), df)
            if not create_table_sql:
                print(f"Skipping table {table_name} due to DDL generation error")
                continue
                
            cursor.execute(create_table_sql)
            conn.commit()
            
            # Load data using direct INSERT statements
            print(f"Loading data into {table_name.lower()}")
            
            if len(df) > 0:
                # Convert DataFrame to list of tuples, handling NaN properly
                data_tuples = []
                for _, row in df.iterrows():
                    row_tuple = tuple(None if pd.isna(val) else val for val in row)
                    data_tuples.append(row_tuple)
                
                # Create INSERT statement
                placeholders = ','.join(['%s'] * len(df.columns))
                columns = ','.join([f'{col}' for col in df.columns])
                insert_sql = f"INSERT INTO {NORTHWIND_SCHEMA.lower()}.{table_name.lower()} ({columns}) VALUES ({placeholders})"
                
                # Execute batch insert
                cursor.executemany(insert_sql, data_tuples)
                conn.commit()
                print(f"Inserted {len(data_tuples)} rows into {table_name.lower()}")
            else:
                print(f"No data to insert for {table_name.lower()}")
        return True
    except Exception as e:
        print(f"Error loading data to Redshift: {str(e)}")
        traceback.print_exc()
        return False
    finally:
        conn.close()

def get_create_table_ddl_from_df(table_name, df):
    """Generate CREATE TABLE DDL from pandas DataFrame."""
    try:
        columns = []
        for col in df.columns:
            # Determine column type based on data
            if df[col].dtype == 'int64':
                col_type = 'INTEGER'
            elif df[col].dtype == 'float64':
                col_type = 'FLOAT'
            elif df[col].dtype == 'bool':
                col_type = 'BOOLEAN'
            else:
                # Check max length for text columns
                max_len = df[col].astype(str).str.len().max() if len(df) > 0 else 255
                if max_len > 1000:
                    col_type = 'TEXT'
                elif max_len > 255:
                    col_type = 'VARCHAR(1000)'
                else:
                    col_type = 'VARCHAR(500)'  # Increased default size
            
            columns.append(f'{col} {col_type}')
        
        ddl = f"CREATE TABLE {NORTHWIND_SCHEMA.lower()}.{table_name} (\n"
        ddl += ",\n".join(columns)
        ddl += "\n)"
        
        return ddl
    except Exception as e:
        print(f"Error generating DDL for {table_name}: {str(e)}")
        return None

def load_data_to_redshift(tables_data):
    """Load data into Redshift tables (legacy SQLite method)."""
    conn = get_redshift_connection()
    
    try:
        cursor = conn.cursor()
        
        # Create schema first in this connection
        cursor.execute(f"CREATE SCHEMA IF NOT EXISTS {NORTHWIND_SCHEMA.lower()}")
        conn.commit()
        print(f"Ensured schema {NORTHWIND_SCHEMA.lower()} exists")
        
        for table_name, df in tables_data.items():
            # Skip sqlite_sequence table
            if table_name.lower() == 'sqlite_sequence':
                continue
                
            print(f"Creating table {table_name.lower()}")
            
            # Drop table if exists
            drop_sql = f"DROP TABLE IF EXISTS {NORTHWIND_SCHEMA.lower()}.{table_name.lower()}"
            cursor.execute(drop_sql)
            
            # Create table
            create_table_sql = get_create_table_ddl(table_name.upper(), df)
            if not create_table_sql:
                print(f"Skipping table {table_name} due to DDL generation error")
                continue
                
            cursor.execute(create_table_sql)
            conn.commit()
            
            # Load data using direct INSERT statements
            print(f"Loading data into {table_name.upper()}")
            
            # Convert DataFrame to list of tuples, handling NaN properly
            data_tuples = []
            for _, row in df.iterrows():
                row_tuple = tuple(None if pd.isna(val) else val for val in row)
                data_tuples.append(row_tuple)
            
            # Create INSERT statement
            placeholders = ','.join(['%s'] * len(df.columns))
            columns = ','.join([f'"{col}"' for col in df.columns])
            insert_sql = f"INSERT INTO {NORTHWIND_SCHEMA.lower()}.{table_name.lower()} ({columns}) VALUES ({placeholders})"
            
            # Execute batch insert
            cursor.executemany(insert_sql, data_tuples)
            conn.commit()
            print(f"Inserted {len(data_tuples)} rows into {table_name.lower()}")
        return True
    except Exception as e:
        print(f"Error loading data to Redshift: {str(e)}")
        traceback.print_exc()
        return False
    finally:
        conn.close()

def bootstrap_northwind(show_progress=False):
    """Bootstrap Northwind database in Redshift with complete GitHub data."""
    if show_progress:
        st.info("🔄 Bootstrapping Northwind database with complete dataset...")
        progress_bar = st.progress(0)
    
    try:
        # Create schema
        schema_result = create_northwind_schema()
        if not schema_result:
            if show_progress:
                st.error("❌ Failed to create Northwind schema.")
            return False
            
        if show_progress:
            progress_bar.progress(0.1, text="Created schema...")
        
        # Download complete dataset from GitHub
        if show_progress:
            progress_bar.progress(0.2, text="Downloading complete dataset from GitHub...")
        
        from .github_data_loader import download_northwind_from_github, normalize_column_names
        tables_data = download_northwind_from_github()
        
        if not tables_data:
            if show_progress:
                st.error("❌ Failed to download data from GitHub.")
            return False
        
        # Normalize column names and prepare for Redshift
        if show_progress:
            progress_bar.progress(0.4, text="Processing data...")
        
        normalized_data = {}
        for table_name, df in tables_data.items():
            normalized_df = normalize_column_names(df, table_name)
            normalized_data[table_name] = normalized_df
            print(f"Processed {table_name}: {len(normalized_df)} rows")
        
        # Load data to Redshift
        if show_progress:
            progress_bar.progress(0.6, text="Loading data to Redshift...")
        load_result = load_data_to_redshift_direct(normalized_data)
        if not load_result:
            if show_progress:
                st.error("❌ Failed to load data to Redshift.")
            return False
        
        if show_progress:
            progress_bar.progress(1.0, text="Completed!")
            st.success("✅ Northwind database successfully bootstrapped with complete dataset.")
        return True
    except Exception as e:
        if show_progress:
            st.error(f"❌ Error bootstrapping Northwind database: {str(e)}")
        print(f"Error bootstrapping Northwind: {str(e)}")
        traceback.print_exc()
        return False