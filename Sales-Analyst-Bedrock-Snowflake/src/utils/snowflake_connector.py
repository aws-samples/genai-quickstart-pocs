"""
Snowflake connector for the GenAI Sales Analyst application.
"""
import os
import snowflake.connector
from dotenv import load_dotenv

# Load environment variables (override existing ones)
load_dotenv(override=True)

def get_snowflake_connection():
    """
    Get a connection to Snowflake.
    
    Returns:
        Snowflake connection object
    """
    # Get credentials from environment variables or update these placeholders
    user = os.getenv('SNOWFLAKE_USER', '<insert username here>')
    password = os.getenv('SNOWFLAKE_PASSWORD', '<insert password here>')
    account = os.getenv('SNOWFLAKE_ACCOUNT', '<insert account identifier here>')
    warehouse = os.getenv('SNOWFLAKE_WAREHOUSE', 'COMPUTE_WH')
    role = os.getenv('SNOWFLAKE_ROLE', 'ACCOUNTADMIN')
    

    
    # Connect to Snowflake
    conn = snowflake.connector.connect(
        user=user,
        password=password,
        account=account,
        warehouse=warehouse,
        role=role
    )
    
    return conn

def execute_query(query):
    """
    Execute a SQL query on Snowflake.
    
    Args:
        query: SQL query to execute
        
    Returns:
        List of dictionaries with query results
    """
    conn = get_snowflake_connection()
    try:
        cursor = conn.cursor()
        
        # Split the query into multiple statements if needed
        statements = query.split(';')
        statements = [stmt.strip() for stmt in statements if stmt.strip()]
        
        # Execute all statements except the last one without fetching results
        for stmt in statements[:-1]:
            cursor.execute(stmt)
        
        # Execute the last statement and fetch results
        if statements:
            cursor.execute(statements[-1])
            results = cursor.fetchall()
            
            # Convert to list of dictionaries
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            return [dict(zip(columns, row)) for row in results]
        return []
    finally:
        conn.close()

def get_available_databases():
    """
    Get a list of available databases.
    
    Returns:
        List of database names
    """
    conn = get_snowflake_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SHOW DATABASES")
        results = cursor.fetchall()
        return [row[1] for row in results]  # Column 1 contains the database name
    finally:
        conn.close()

def get_available_schemas(database):
    """
    Get a list of available schemas in a database.
    
    Args:
        database: Database name
        
    Returns:
        List of schema names
    """
    conn = get_snowflake_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(f"SHOW SCHEMAS IN DATABASE {database}")
        results = cursor.fetchall()
        return [row[1] for row in results]  # Column 1 contains the schema name
    finally:
        conn.close()

def get_available_tables(database, schema):
    """
    Get a list of available tables in a schema.
    
    Args:
        database: Database name
        schema: Schema name
        
    Returns:
        List of table names
    """
    conn = get_snowflake_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(f"SHOW TABLES IN {database}.{schema}")
        results = cursor.fetchall()
        return [row[1] for row in results]  # Column 1 contains the table name
    finally:
        conn.close()

def get_table_columns(database, schema, table):
    """
    Get a list of columns in a table.
    
    Args:
        database: Database name
        schema: Schema name
        table: Table name
        
    Returns:
        DataFrame with column information
    """
    import pandas as pd
    
    conn = get_snowflake_connection()
    try:
        cursor = conn.cursor()
        
        # Use the database and schema
        if database:
            cursor.execute(f"USE DATABASE {database}")
        if schema:
            cursor.execute(f"USE SCHEMA {schema}")
        
        # Get column information
        cursor.execute(f"DESCRIBE TABLE {table}")
        results = cursor.fetchall()
        
        # Create DataFrame - handle variable number of columns from DESCRIBE TABLE
        if results:
            # Get actual number of columns returned
            num_cols = len(results[0]) if results else 0
            if num_cols >= 11:
                columns = ['name', 'type', 'kind', 'null', 'default', 'primary_key', 'unique_key', 'check', 'expression', 'comment', 'policy_name']
                if num_cols > 11:
                    # Add extra columns if they exist
                    for i in range(11, num_cols):
                        columns.append(f'extra_col_{i}')
            else:
                # Fallback for fewer columns
                columns = [f'col_{i}' for i in range(num_cols)]
                columns[0] = 'name'
                columns[1] = 'type' if num_cols > 1 else 'name'
            
            df = pd.DataFrame(results, columns=columns)
        else:
            df = pd.DataFrame()
        
        # Rename columns to match expected format
        rename_dict = {}
        if 'name' in df.columns:
            rename_dict['name'] = 'column_name'
        if 'type' in df.columns:
            rename_dict['type'] = 'data_type'
        if 'comment' in df.columns:
            rename_dict['comment'] = 'description'
        
        if rename_dict:
            df = df.rename(columns=rename_dict)
        
        # Ensure required columns exist
        if 'column_name' not in df.columns and len(df.columns) > 0:
            df['column_name'] = df.iloc[:, 0]
        if 'data_type' not in df.columns and len(df.columns) > 1:
            df['data_type'] = df.iloc[:, 1]
        if 'description' not in df.columns:
            df['description'] = ''
        
        # Add table name
        if not df.empty:
            df['table_name'] = table
        
        return df
    finally:
        conn.close()