"""
Query processing utilities.
"""
import re
import streamlit as st
import pandas as pd
from cachetools import TTLCache
from .snowflake_connector import get_detailed_schema_info
from .bedrock_client import invoke_bedrock_model
from ..config.settings import SCHEMA_CACHE_TTL, SCHEMA_CACHE_SIZE, DEFAULT_MODEL_ID

# Cache for schema information
schema_cache = TTLCache(maxsize=SCHEMA_CACHE_SIZE, ttl=SCHEMA_CACHE_TTL)


def generate_schema_context(database, schema):
    """
    Generate a natural language description of the schema.
    
    Args:
        database (str): Database name.
        schema (str): Schema name.
        
    Returns:
        str: Natural language description of the schema.
    """
    schema_info = get_detailed_schema_info(database, schema)
    
    context = f"Database '{database}' with schema '{schema}' contains the following structure:\n\n"
    
    for table, columns in schema_info.items():
        context += f"Table '{table}' contains:\n"
        for col_name, col_info in columns.items():
            context += f"- Column '{col_name}' of type {col_info['data_type']}"
            
            # Add sample values if available
            if col_info['sample_values']:
                context += f" (example values: {', '.join(col_info['sample_values'])})"
            
            # Add column comment if available
            if col_info['comment']:
                context += f" - {col_info['comment']}"
                
            context += "\n"
        context += "\n"
    
    return context


def get_cached_schema_context(database, schema):
    """
    Get schema context with caching.
    
    Args:
        database (str): Database name.
        schema (str): Schema name.
        
    Returns:
        str: Natural language description of the schema.
    """
    cache_key = f"{database}_{schema}"
    if cache_key not in schema_cache:
        schema_cache[cache_key] = generate_schema_context(database, schema)
    return schema_cache[cache_key]


def extract_sql_from_response(response_json):
    """
    Extract SQL queries from the Bedrock response.
    
    Args:
        response_json (dict): The Bedrock response.
        
    Returns:
        list: List of SQL queries.
    """
    try:
        # Extract SQL text from response
        if isinstance(response_json, dict):
            content = response_json.get("output", {}).get("message", {}).get("content", [])
            if isinstance(content, list) and content:
                sql_text = content[0].get("text", "").strip()
            else:
                raise ValueError("Empty or invalid Bedrock response content.")
        elif isinstance(response_json, list):
            sql_text = response_json[0].strip()
        else:
            raise ValueError("Unexpected response structure.")

        # Remove Markdown formatting
        if sql_text.startswith("```sql"):
            sql_text = sql_text[6:].strip()
        if sql_text.endswith("```"):
            sql_text = sql_text[:-3].strip()
            
        # Fix Snowflake syntax: replace single quotes with double quotes for identifiers
        sql_text = re.sub(r"'([^']*)'\\.'([^']*)'", r'"\\1"."\\2"', sql_text)
        sql_text = re.sub(r"'([^']*)'", r'"\\1"', sql_text)
        
        # Handle common NLP queries for table listings
        if re.search(r"show\\s+tables", sql_text, re.IGNORECASE):
            return ["SHOW TABLES"]
        
        # Handle common NLP queries for record previews
        preview_match = re.search(r"(top|first)\\s+(\\d+)", sql_text, re.IGNORECASE)
        if preview_match and "select" in sql_text.lower():
            limit_num = preview_match.group(2)
            if "limit" not in sql_text.lower():
                sql_text = f"{sql_text} LIMIT {limit_num}"

        # Fix "SHOW TABLES" query syntax
        sql_text = re.sub(r"SHOW TABLES IN DATABASE (\\S+)\\.(\\S+);?", r"SHOW TABLES IN SCHEMA \\1.\\2;", sql_text)

        # Split multiple SQL queries
        sql_queries = [query.strip() for query in sql_text.split(";") if query.strip()]
        return sql_queries

    except Exception as e:
        st.error(f"Error extracting SQL queries: {e}")
        return []


def generate_sql_query(nl_query, db_name, schema_name, model_id=DEFAULT_MODEL_ID):
    """
    Generate SQL query from natural language query.
    
    Args:
        nl_query (str): Natural language query.
        db_name (str): Database name.
        schema_name (str): Schema name.
        model_id (str, optional): The model ID to use. Defaults to DEFAULT_MODEL_ID.
        
    Returns:
        list: List of SQL queries.
    """
    schema_context = get_cached_schema_context(db_name, schema_name)
    schema_context = schema_context[:5000] if len(schema_context) > 5000 else schema_context

    message_content = (
        f"You are an expert SQL generator for Snowflake.\n"
        f"Schema Information:\n{schema_context}\n\n"
        f"Query: {nl_query}\n\n"
        f"Generate a valid SQL query. Respond with only the query."
    )

    result = invoke_bedrock_model(message_content, model_id)
    
    if result:
        sql_query = extract_sql_from_response(result)
        if not sql_query:
            st.warning("No valid query generated. Using fallback query.")
            sql_query = fallback_sql_query(nl_query)
        return sql_query
    else:
        return fallback_sql_query(nl_query)


def fallback_sql_query(nl_query):
    """
    Generate fallback SQL query for common cases.
    
    Args:
        nl_query (str): Natural language query.
        
    Returns:
        list: List of SQL queries.
    """
    # Simplified fallback logic for common cases
    if "list tables" in nl_query.lower():
        return ["SHOW TABLES;"]
    elif "sample records" in nl_query.lower():
        return ["SELECT * FROM <replace_with_table_name> LIMIT 5;"]
    elif "highest number of sales orders" in nl_query.lower():
        return ["""
        SELECT N.N_NAME, COUNT(O.O_ORDERKEY) AS ORDER_COUNT
        FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.NATION N
        JOIN SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.CUSTOMER C ON N.N_NATIONKEY = C.C_NATIONKEY
        JOIN SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.ORDERS O ON C.C_CUSTKEY = O.O_CUSTKEY
        GROUP BY N.N_NAME
        ORDER BY ORDER_COUNT DESC
        LIMIT 1;
        """]
    else:
        return []


def find_relevant_tables(schema_info, topic):
    """
    Find tables relevant to a specific topic based on table and column names.
    
    Args:
        schema_info (dict): Schema information.
        topic (str): Topic to search for.
        
    Returns:
        list: List of relevant table names.
    """
    relevant_tables = []
    topic_keywords = set(topic.lower().split())
    
    for table_name, columns in schema_info.items():
        # Check table name
        if any(keyword in table_name.lower() for keyword in topic_keywords):
            relevant_tables.append(table_name)
            continue
            
        # Check column names and comments
        for col_name, col_info in columns.items():
            if any(keyword in col_name.lower() for keyword in topic_keywords):
                relevant_tables.append(table_name)
                break
            if col_info['comment'] and any(keyword in col_info['comment'].lower() for keyword in topic_keywords):
                relevant_tables.append(table_name)
                break
    
    return list(set(relevant_tables))


def generate_data_summary(database, schema, topic, limit=1000):
    """
    Generate a comprehensive data summary for a specific topic.
    
    Args:
        database (str): Database name.
        schema (str): Schema name.
        topic (str): Topic to summarize.
        limit (int, optional): Maximum number of records to analyze. Defaults to 1000.
        
    Returns:
        str: Data summary.
    """
    from .snowflake_connector import get_detailed_schema_info, analyze_table_relationships, connect_to_snowflake
    
    try:
        # Get schema information
        schema_info = get_detailed_schema_info(database, schema)
        
        # Only try to get relationships if not using sample data
        if not database.startswith('SNOWFLAKE_SAMPLE'):
            relationships = analyze_table_relationships(database, schema)
        else:
            relationships = {}
            
        relevant_tables = find_relevant_tables(schema_info, topic)

        if not relevant_tables:
            return f"No relevant tables found for topic: {topic}"
        
        summaries = []
        conn = connect_to_snowflake()
        cursor = conn.cursor()
        
        for table_name in relevant_tables:
            columns = schema_info[table_name]
            # Identify key metrics columns (numeric types)
            metric_columns = [col for col, info in columns.items() 
                            if info['data_type'].upper() in ('NUMBER', 'FLOAT', 'INTEGER', 'DECIMAL')]
            
            # Identify categorical columns
            categorical_columns = [col for col, info in columns.items() 
                                if info['data_type'].upper() in ('VARCHAR', 'STRING', 'CHAR')]
            
            # Validate database, schema, and table names to prevent injection
            if not database.replace('_', '').replace('-', '').isalnum():
                raise ValueError(f"Invalid database name: {database}")
            if not schema.replace('_', '').replace('-', '').isalnum():
                raise ValueError(f"Invalid schema name: {schema}")
            if not table_name.replace('_', '').replace('-', '').isalnum():
                raise ValueError(f"Invalid table name: {table_name}")
            
            # Validate column names
            validated_categorical_columns = []
            for col in categorical_columns[:5]:
                if not str(col).replace('_', '').replace('-', '').isalnum():
                    continue  # Skip invalid column names
                validated_categorical_columns.append(col)
            
            validated_metric_columns = []
            for col in metric_columns[:5]:
                if not str(col).replace('_', '').replace('-', '').isalnum():
                    continue  # Skip invalid column names
                validated_metric_columns.append(col)
            
            # Generate summary query with validated names
            # Note: Using f-string with validated database, schema, table, and column names
            summary_query = f"""
            SELECT 
                COUNT(*) as total_records
                {', ' + ', '.join(f'COUNT(DISTINCT {col}) as unique_{col}' for col in validated_categorical_columns) if validated_categorical_columns else ''}
                {', ' + ', '.join(f'AVG({col}) as avg_{col}, MAX({col}) as max_{col}, MIN({col}) as min_{col}' 
                          for col in validated_metric_columns) if validated_metric_columns else ''}
            FROM {database}.{schema}.{table_name}
            """  # nosec B608 - all identifiers are validated
            
            # Get sample records with validated names
            # Note: Using f-string with validated database, schema, and table names
            sample_query = f"""
            SELECT *
            FROM {database}.{schema}.{table_name}
            LIMIT 5
            """  # nosec B608 - all identifiers are validated
            
            try:
                # Execute summary query
                cursor.execute(summary_query)
                summary_results = cursor.fetchone()
                
                # Execute sample query
                cursor.execute(sample_query)
                sample_results = cursor.fetchall()
                sample_columns = [desc[0] for desc in cursor.description]
                
                # Format summary
                table_summary = f"\n=== Summary for {table_name} ===\n"
                table_summary += f"Total Records: {summary_results[0]}\n"
                
                # Add categorical summaries
                col_index = 1
                for col in categorical_columns[:5]:
                    if col_index < len(summary_results):
                        table_summary += f"Unique {col}: {summary_results[col_index]}\n"
                        col_index += 1
                
                # Add metric summaries
                for col in metric_columns[:5]:
                    if col_index + 2 < len(summary_results):
                        avg_val = summary_results[col_index]
                        max_val = summary_results[col_index + 1]
                        min_val = summary_results[col_index + 2]
                        table_summary += f"{col} - Avg: {avg_val:.2f}, Max: {max_val}, Min: {min_val}\n"
                        col_index += 3
                
                # Add sample records
                table_summary += "\nSample Records:\n"
                sample_df = pd.DataFrame(sample_results, columns=sample_columns)
                table_summary += sample_df.to_string()
                
                summaries.append(table_summary)
                
            except Exception as e:
                st.error(f"Error generating summary for {table_name}: {e}")
                continue
        
        return "\n\n".join(summaries)
        
    except Exception as e:
        st.error(f"Error generating data summary: {e}")
        return f"Error generating summary: {str(e)}"


def handle_user_query(nl_query, db_name, schema_name, model_id=DEFAULT_MODEL_ID):
    """
    Handle both SQL queries and summary requests.
    
    Args:
        nl_query (str): Natural language query.
        db_name (str): Database name.
        schema_name (str): Schema name.
        model_id (str, optional): The model ID to use. Defaults to DEFAULT_MODEL_ID.
        
    Returns:
        tuple: (sql_query, summary)
    """
    if any(keyword in nl_query.lower() for keyword in ['summarize', 'summary', 'overview', 'analyze']):
        # Extract the topic from the query
        topic = nl_query.lower().replace('summarize', '').replace('summary', '').replace('overview', '').replace('analyze', '').strip()
        summary = generate_data_summary(db_name, schema_name, topic)
        return None, summary  # Return (sql_query, summary)
    else:
        # Generate SQL query as before
        sql_query = generate_sql_query(nl_query, db_name, schema_name, model_id)
        return sql_query, None  # Return (sql_query, summary)