import os
import json
import boto3
from datetime import datetime

rds_client = boto3.client('rds-data')
database_name = os.environ.get('database_name')
db_resource_arn = os.environ.get('db_resource_arn')
db_credentials_secrets_arn = os.environ.get('db_credentials_secrets_arn')

def get_tables():
    sql = "select * from information_schema.tables where table_name not like 'pg_%' and table_schema <> 'information_schema'"
    print(f"Attempting to run SQL: {sql}")
    tables = execute_statement(sql)
    return tables
    
def get_tables_information(t: list[str]):
    sql = "select table_name, column_name, ordinal_position, is_nullable, data_type from information_schema.columns where table_name not like 'pg_%' and table_schema <> 'information_schema'"
    print(f"Attempting to run SQL: {sql}")
    tables_information = execute_statement(sql)
    return tables_information

def execute_statement(sql):
    print(">>>>> EXECUTE_SQL_STATEMENT: Attempting to run SQL: " + sql)
    response = rds_client.execute_statement(
        secretArn=db_credentials_secrets_arn,
        database=database_name,
        resourceArn=db_resource_arn,
        sql=sql
        )
    return response


# MAIN LAMBDA FUNCTION ENTRY POINT
def lambda_handler(event, context):
    agent = event['agent']
    actionGroup = event['actionGroup']
    function = event['function']
    parameters = event.get('parameters', [])
    
    print(f"Received request to call {function} with params: {parameters}")

    # Set a default ERROR message in case the correct function could not be determined
    responseBody =  {"TEXT": {"body": "ERROR: No function found to run".format(function)}}
    
    # Figure out what tables are in the database
    if function == "get_tables":
        tables = get_tables()
        responseBody = {"TEXT": {"body": f"<tables_list>{tables}</tables_list>"}}
    
    # Get definition of the tables - column names help to create the query SQL
    elif function == "get_tables_information":
        tables = None
        for param in parameters:
            if param["name"] == "tables_list":
                tables = param["value"]
        if not tables:
            raise Exception("Missing mandatory parameter: tables_list")
        print(tables)    
        table_information = get_tables_information(tables)
        responseBody = {"TEXT": {"body": f"<tables_information>{table_information}</tables_information>"}}
    
    
    # Business data queries
    else:
        for param in parameters:
            if param["name"] == 'sql_statement':
                sql = param["value"]
                # Remove newline characters
                sql = sql.replace("\n", " ")
                print(f"Running agent provided SQL: {sql}")
                results = execute_statement(sql)
                responseBody = {"TEXT": {"body": f"<results>{results}</results>"}}
        if not sql:
            raise Exception("Missing SQL statement")
        
    action_response = {
        'actionGroup': actionGroup,
        'function': function,
        'functionResponse': {
            'responseBody': responseBody
        }
    }

    function_response = {
        "response": action_response,
        "messageVersion": event["messageVersion"],
    }

    print("Response: {}".format(action_response))
    return function_response
