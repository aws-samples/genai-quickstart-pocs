"""
SQL generation model using Amazon Bedrock.
"""
import streamlit as st
from ..utils.bedrock_client import invoke_bedrock_model
from ..utils.query_processor import get_cached_schema_context, extract_sql_from_response
from ..config.settings import DEFAULT_MODEL_ID


class SQLGenerator:
    """
    SQL Generator class using Amazon Bedrock.
    """
    
    def __init__(self, model_id=DEFAULT_MODEL_ID):
        """
        Initialize the SQL Generator.
        
        Args:
            model_id (str, optional): The model ID to use. Defaults to DEFAULT_MODEL_ID.
        """
        self.model_id = model_id
    
    def generate_sql(self, nl_query, database, schema):
        """
        Generate SQL from natural language query.
        
        Args:
            nl_query (str): Natural language query.
            database (str): Database name.
            schema (str): Schema name.
            
        Returns:
            list: List of SQL queries.
        """
        schema_context = get_cached_schema_context(database, schema)
        schema_context = schema_context[:5000] if len(schema_context) > 5000 else schema_context

        message_content = (
            f"You are an expert SQL generator for Redshift.\n"
            f"Schema Information:\n{schema_context}\n\n"
            f"Query: {nl_query}\n\n"
            f"Generate a valid SQL query. Respond with only the query."
        )

        result = invoke_bedrock_model(message_content, self.model_id)
        
        if result:
            sql_queries = extract_sql_from_response(result)
            if not sql_queries:
                st.warning("No valid query generated. Using fallback query.")
                sql_queries = self._fallback_sql_query(nl_query)
            return sql_queries
        else:
            return self._fallback_sql_query(nl_query)
    
    def _fallback_sql_query(self, nl_query):
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
            FROM REDSHIFT_SAMPLE_DATA.TPCH_SF1.NATION N
            JOIN REDSHIFT_SAMPLE_DATA.TPCH_SF1.CUSTOMER C ON N.N_NATIONKEY = C.C_NATIONKEY
            JOIN REDSHIFT_SAMPLE_DATA.TPCH_SF1.ORDERS O ON C.C_CUSTKEY = O.O_CUSTKEY
            GROUP BY N.N_NAME
            ORDER BY ORDER_COUNT DESC
            LIMIT 1;
            """]
        else:
            return []