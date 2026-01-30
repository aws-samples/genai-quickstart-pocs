"""
Redshift connector for the GenAI Sales Analyst application.
"""
import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_redshift_connection():
    """
    Get a connection to Redshift.
    
    Returns:
        Redshift connection object
    """
    # Get credentials from environment variables
    host = os.getenv('REDSHIFT_HOST')
    if not host or host == 'NOT_SET':
        raise Exception("Redshift host not configured yet. Please wait for setup to complete.")
        
    port = os.getenv('REDSHIFT_PORT', '5439')
    database = os.getenv('REDSHIFT_DATABASE', 'sales_analyst')
    user = os.getenv('REDSHIFT_USER', 'admin')
    password = os.getenv('REDSHIFT_PASSWORD', 'Awsuser123$')
    
    # For localhost connections (SSM tunnel), force IPv4
    if host == 'localhost':
        host = '127.0.0.1'
    
    # Connect to Redshift with timeout
    conn = psycopg2.connect(
        host=host,
        port=port,
        database=database,
        user=user,
        password=password,
        connect_timeout=30  # Increased timeout for tunnel connections
    )
    
    return conn

def execute_query(query):
    """
    Execute a SQL query on Redshift.
    
    Args:
        query: SQL query to execute
        
    Returns:
        List of dictionaries with query results
    """
    conn = get_redshift_connection()
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
    conn = get_redshift_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT datname FROM pg_database WHERE datistemplate = false")
        results = cursor.fetchall()
        return [row[0] for row in results]
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
    conn = get_redshift_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT schema_name FROM information_schema.schemata")
        results = cursor.fetchall()
        return [row[0] for row in results]
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
    conn = get_redshift_connection()
    try:
        cursor = conn.cursor()
        # Use parameterized query to prevent SQL injection
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = %s", (schema,))
        results = cursor.fetchall()
        return [row[0] for row in results]
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
    
    conn = get_redshift_connection()
    try:
        cursor = conn.cursor()
        
        # Get column information using information_schema
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = %s AND table_name = %s
            ORDER BY ordinal_position
        """, (schema, table))
        results = cursor.fetchall()
        
        # Create DataFrame
        if results:
            df = pd.DataFrame(results, columns=['column_name', 'data_type', 'is_nullable', 'column_default'])
            df['description'] = ''
            df['table_name'] = table
        else:
            df = pd.DataFrame()
        
        return df
    finally:
        conn.close()