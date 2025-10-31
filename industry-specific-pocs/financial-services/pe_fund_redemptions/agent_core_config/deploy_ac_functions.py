#!/usr/bin/env python3
import boto3
import json
import zipfile
import io

def create_lambda_zip_from_code(code):
    """Create a zip file in memory with just the Python code"""
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
        zipf.writestr('handler.py', code)
    
    zip_buffer.seek(0)
    return zip_buffer.read()

def read_handler_code(function_dir):
    """Read the handler.py file as text"""
    with open(f"../../agent_core_config/{function_dir}/handler.py", 'r') as f:
        return f.read()

def create_execution_role(iam_client):
    """Create Lambda execution role if it doesn't exist"""
    role_name = 'lambda-execution-role'
    
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }
        ]
    }
    
    try:
        response = iam_client.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps(trust_policy),
            Description='Lambda execution role for custom functions'
        )
        
        # Attach basic execution policy
        iam_client.attach_role_policy(
            RoleName=role_name,
            PolicyArn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        )
        
        print(f"✅ Created IAM role: {role_name}")
        return response['Role']['Arn']
        
    except iam_client.exceptions.EntityAlreadyExistsException:
        response = iam_client.get_role(RoleName=role_name)
        return response['Role']['Arn']

def deploy_lambda_function(lambda_client, function_name, code, env_vars, role_arn, timeout=120):
    """Deploy Lambda function with code as zip"""
    
    try:
        # Check if function exists
        lambda_client.get_function(FunctionName=function_name)
        print(f"⚠️  Function {function_name} already exists. Skipping creation.")
        return None
        
    except lambda_client.exceptions.ResourceNotFoundException:
        # Create zip from code
        zip_content = create_lambda_zip_from_code(code)
        
        # Create new function
        response = lambda_client.create_function(
            FunctionName=function_name,
            Runtime='python3.11',
            Role=role_arn,
            Handler='handler.lambda_handler',
            Code={'ZipFile': zip_content},
            Timeout=timeout,
            Environment={'Variables': env_vars}
        )
        
        print(f"✅ Created new function: {function_name}")
        print(f"   ARN: {response['FunctionArn']}")
        return response['FunctionArn']

def main():
    lambda_client = boto3.client('lambda', region_name='us-east-1')
    iam_client = boto3.client('iam', region_name='us-east-1')
    
    # Create execution role
    role_arn = create_execution_role(iam_client)
    
    # Deploy database-query function
    print("\nDeploying database-query function...")
    code = read_handler_code('database-query')
    db_arn = deploy_lambda_function(
        lambda_client,
        'database-query',
        code,
        {'MYSQL_LAMBDA_FUNCTION': 'MSSqlConnect'},
        role_arn
    )
    
    # Deploy fund-documents function
    print("\nDeploying fund-documents function...")
    code = read_handler_code('fund-documents')
    fund_arn = deploy_lambda_function(
        lambda_client,
        'fund-documents',
        code,
        {'S3_BUCKET': 'tonytrev-ab2'},
        role_arn
    )
    
    print("\n🎉 Deployment complete!")
    
    if db_arn:
        print(f"\nDatabase Query ARN: {db_arn}")
    if fund_arn:
        print(f"Fund Documents ARN: {fund_arn}")

if __name__ == "__main__":
    main()
