"""
Redshift connector with IAM role authentication.
"""
import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables (for Redshift connection details only)
load_dotenv()

def get_redshift_connection():
    """
    Get a connection to Redshift using database credentials.
    
    Returns:
        Redshift connection object
    """
    # Get Redshift connection details from environment variables
    host = os.getenv('REDSHIFT_HOST', 'localhost')
    port = os.getenv('REDSHIFT_PORT', '5439')
    database = os.getenv('REDSHIFT_DATABASE', 'sales_analyst')
    user = os.getenv('REDSHIFT_USER', 'admin')
    password = os.getenv('REDSHIFT_PASSWORD')
    
    if not password:
        raise ValueError("REDSHIFT_PASSWORD must be set in .env file")
    
    # For localhost connections (SSM tunnel), force IPv4
    if host == 'localhost':
        host = '127.0.0.1'
    
    # SSL configuration
    ssl_mode = os.getenv('REDSHIFT_SSL_MODE', 'require')
    
    # Connect to Redshift with timeout and SSL
    conn = psycopg2.connect(
        host=host,
        port=port,
        database=database,
        user=user,
        password=password,
        connect_timeout=30,
        sslmode=ssl_mode
    )
    
    return conn

def execute_query(query):
    """
    Execute a SQL query on Redshift.
    
    Args:
        query: SQL query to execute
        
    Returns:
        Query results
    """
    conn = get_redshift_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(query)
        results = cursor.fetchall()
        return results
    except Exception as e:
        print(f"Error executing query: {str(e)}")
        raise
    finally:
        cursor.close()
        conn.close()

def get_available_databases():
    """
    Get list of available databases.
    
    Returns:
        List of database names
    """
    try:
        conn = get_redshift_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT datname FROM pg_database WHERE datistemplate = false")
        databases = [row[0] for row in cursor.fetchall()]
        
        conn.close()
        return databases
    except Exception as e:
        print(f"Error getting databases: {str(e)}")
        return []

def get_available_schemas():
    """
    Get list of available schemas.
    
    Returns:
        List of schema names
    """
    try:
        conn = get_redshift_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
            ORDER BY schema_name
        """)
        schemas = [row[0] for row in cursor.fetchall()]
        
        conn.close()
        return schemas
    except Exception as e:
        print(f"Error getting schemas: {str(e)}")
        return []

def get_available_tables(schema_name=None):
    """
    Get list of available tables.
    
    Args:
        schema_name: Optional schema name to filter tables
        
    Returns:
        List of table names or dict of schema->tables
    """
    try:
        conn = get_redshift_connection()
        cursor = conn.cursor()
        
        if schema_name:
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = %s AND table_type = 'BASE TABLE'
                ORDER BY table_name
            """, (schema_name,))
            tables = [row[0] for row in cursor.fetchall()]
        else:
            cursor.execute("""
                SELECT table_schema, table_name 
                FROM information_schema.tables 
                WHERE table_schema NOT IN ('information_schema', 'pg_catalog') 
                AND table_type = 'BASE TABLE'
                ORDER BY table_schema, table_name
            """)
            results = cursor.fetchall()
            tables = {}
            for schema, table in results:
                if schema not in tables:
                    tables[schema] = []
                tables[schema].append(table)
        
        conn.close()
        return tables
    except Exception as e:
        print(f"Error getting tables: {str(e)}")
        return [] if schema_name else {}

def get_table_columns(schema_name, table_name):
    """
    Get columns for a specific table.
    
    Args:
        schema_name: Schema name
        table_name: Table name
        
    Returns:
        List of column information
    """
    try:
        conn = get_redshift_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = %s AND table_name = %s
            ORDER BY ordinal_position
        """, (schema_name, table_name))
        
        columns = []
        for row in cursor.fetchall():
            columns.append({
                'name': row[0],
                'type': row[1],
                'nullable': row[2] == 'YES',
                'default': row[3]
            })
        
        conn.close()
        return columns
    except Exception as e:
        print(f"Error getting table columns: {str(e)}")
        return []

def test_connection():
    """
    Test the Redshift connection.
    
    Returns:
        Boolean indicating success
    """
    try:
        conn = get_redshift_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        conn.close()
        return result[0] == 1
    except Exception as e:
        print(f"Connection test failed: {str(e)}")
        return False
