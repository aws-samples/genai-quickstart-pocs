import os
from dotenv import load_dotenv
import yaml
import boto3
import json
import time
import pymysql


# Loading environment variables
load_dotenv()

# Configure AWS Bedrock client
bedrock_client = boto3.client(
    service_name="bedrock-runtime",
    region_name=os.getenv('region_name'),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    aws_session_token=os.getenv("AWS_SESSION_TOKEN") # Comment this line if you are not using temporary session token
)

# Define Bedrock Model
MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0"

# Executing the SQL database chain with the users question
def get_sql_query(question):
    """
    This function collects all necessary information to generate the SQL Query 
    a natural language question in and returning a generated SQL query.
    :param question: The question the user passes in from the frontend
    :return: The generated SQL query for RDS
    """
    
    prompt_data = """
        <Instructions>
            You are an expert SQL query generator for AWS Aurora MySQL. Your task is to generate precise SQL queries from natural language questions using the provided database schema.
            Key Requirements:
                1. Generate syntactically correct AWS Aurora MySQL queries to answer the question in <question> tag
                2. Use only columns that exist in the schema
                3. Select specific and relevant columns instead of using SELECT *
                4. use only the column names that you can see in the schema description. 
                5. Properly qualify column names with table names when needed
                6. Ensure table joins are properly constructed when needed
                7. Return only the SQL query without any explanations or additional comments
                8. Use appropriate aggregation functions (COUNT, SUM, AVG, etc.) when needed
                9. Handle string comparisons case-insensitively using LOWER() function
            
            Schema Guidelines:
                - Reference only tables and columns defined in the <database_schema> tags
                - Pay attention to data types and constraints
                - Use appropriate SQL functions based on column types
                - Consider NULL handling where appropriate
                - Use JOIN operations when combining data from different tables 

            Output Format:
                - Return only the SQL query
                - Use proper SQL formatting with clear indentation
                - Include table aliases for better readability
                - End queries with semicolon           
            
        </Instructions>

        <database_schema>
            CREATE TABLE artists
                (
                    artist_id integer NOT NULL,
                    full_name character varying(200),
                    nationality character varying(50),
                    gender character varying(25),
                    birth_year integer,
                    death_year integer,
                    CONSTRAINT artists_pk PRIMARY KEY (artist_id)
                )        
        
            CREATE TABLE artworks
                (
                    artwork_id integer NOT NULL,
                    title character varying(500),
                    artist_id integer NOT NULL,
                    date integer,
                    medium character varying(250),
                    dimensions text,
                    acquisition_date text,
                    credit text,
                    catalogue character varying(250),
                    department character varying(250),
                    classification character varying(250),
                    object_number text,
                    diameter_cm text,
                    circumference_cm text,
                    height_cm text,
                    length_cm text,
                    width_cm text,
                    depth_cm text,
                    weight_kg text,
                    durations integer,
                    CONSTRAINT artworks_pk PRIMARY KEY (artwork_id)
                )
        </database_schema>
        <examples>
            Example 1:
            Q: "How many artists are there where nationality is French?"
            A: "SELECT COUNT(artist_id) as french_artists_count FROM artists WHERE nationality = 'French';"

            Example 2:
            Q: "How many artist names start with 'A'?"
            A: "SELECT COUNT(artist_id) as count_artists FROM artists WHERE LOWER(full_name) LIKE 'a%';"

            Example 3:
            Q: "List all artworks and their artists from the 19th century"
            A:
            SELECT a.full_name as artist_name, aw.title as artwork_title, aw.date as creation_date
            FROM artworks aw
            JOIN artists a ON a.artist_id = aw.artist_id
            WHERE aw.date BETWEEN 1800 AND 1899
            ORDER BY aw.date;
        </examples>

        <question>
            {input_question}
        </question>
        """
    
    # formatting the prompt template to add context and user query
    formatted_prompt_data = prompt_data.format(input_question=question)

    # Configuring the model parameters, preparing for inference
    # TODO: TUNE THESE PARAMETERS TO OPTIMIZE FOR YOUR USE CASE
    prompt = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "temperature": 0.5,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": formatted_prompt_data
                    }
                ]
            }
        ]
    }
    # formatting the prompt as a json string
    json_prompt = json.dumps(prompt)    

    # invoking Claude 3.5, passing in our prompt
    response = bedrock_client.invoke_model(body=json_prompt, modelId=MODEL_ID,
                                    accept="application/json", contentType="application/json")
    # getting the response from Claude3 and parsing it to return to the end user
    response_body = json.loads(response.get('body').read())
    # the final string returned to the end user
    answer = response_body['content'][0]['text']

    return answer

def get_rds_answer(question, query):

    """
    This function collects all necessary information to generate the SQL Query and get an answer generated, taking
    a natural language question in and returning an answer and generated SQL query.
    :param question: The question the user passes in from the frontend
    :param query: The generated SQL query from the get_sql_answer function
    :return: The final answer in natural langauge along with the generated SQL query.
    """

    rds_query_answer = execute_rds_query(query)
    
    prompt_data = """
        <Instructions>
            Based on the original <question>, your task is to convert SQL query results in <answer> into clear, concise human-readable answers.
            Requirements:
                1. Transform the data from <answer> into natural language that directly addresses the <question>
                2. Present numerical results with appropriate formatting and units
                3. Structure multiple items using:
                    - Bullet points for lists
                    - Tables for complex data
                    - Clear hierarchical organization when needed
                4. Keep the answer focused only on information present in the results.
                5. Maintain factual accuracy without interpretation or speculation
                6. Use clear, professional language 
            <question>
                {input_question}
            </question>
            <answer>
                {rds}
            </answer>
            return the final answer in natural language and only this, no additional comments
        </Instructions>
        """
    
    # formatting the prompt template to add context and user query
    formatted_prompt_data = prompt_data.format(input_question=question, rds=rds_query_answer)

    prompt = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "temperature": 0.5,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": formatted_prompt_data
                    }
                ]
            }
        ]
    }
    # formatting the prompt as a json string
    json_prompt = json.dumps(prompt)    

    # invoking Claude3, passing in our prompt
    response = bedrock_client.invoke_model(body=json_prompt, modelId=MODEL_ID,
                                    accept="application/json", contentType="application/json")
    # getting the response from Claude3.5 and parsing it to return to the end user
    response_body = json.loads(response.get('body').read())
    
    # the final string returned to the end user
    answer = response_body['content'][0]['text']

    return answer
    

def execute_rds_query(query):
    """
    This function is used to run the Amazon RDS query 
    :return: Answer from rds query
    """         
    rds_username = os.getenv('rds_username')
    rds_password = os.getenv('rds_password')
    rds_endpoint = os.getenv('rds_endpoint')
    rds_port = int(os.getenv('rds_port'))
    rds_db_name = os.getenv('rds_db_name')
    
    try:
        connection = pymysql.connect(
            host=rds_endpoint,
            port=rds_port,
            user=rds_username,
            password=rds_password,
            database=rds_db_name
        )
        with connection.cursor() as cursor:
            cursor.execute(query)
            results = cursor.fetchall()
            
            # If it's a SELECT query
            if cursor.description:
                columns = [col[0] for col in cursor.description]
                return [dict(zip(columns, row)) for row in results]
            
            # If it's an INSERT/UPDATE/DELETE
            connection.commit()
            return {"affected_rows": cursor.rowcount}
            
    except Exception as e:
        print(f"Error: {str(e)}")
        raise
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()
            
    results = execute_rds_query(query)
    print (results)
    return results

