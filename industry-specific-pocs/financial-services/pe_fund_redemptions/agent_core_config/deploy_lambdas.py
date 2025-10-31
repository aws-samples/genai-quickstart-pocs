#!/usr/bin/env python3
import boto3
import json
import zipfile
import io
import os
import time

def get_fund_documents_bucket():
    """Dynamically discover the fund documents bucket name"""
    s3_client = boto3.client('s3', region_name='us-east-1')
    
    try:
        # List all buckets
        response = s3_client.list_buckets()
        
        # Look for bucket with our naming pattern: pe-fund-documents-{account}-{region}
        for bucket in response['Buckets']:
            bucket_name = bucket['Name']
            if bucket_name.startswith('pe-fund-documents-') and 'us-east-1' in bucket_name:
                # Verify it has the expected structure
                try:
                    objects = s3_client.list_objects_v2(Bucket=bucket_name, Prefix='fund_documents/', MaxKeys=1)
                    if 'Contents' in objects:
                        print(f"✅ Found fund documents bucket: {bucket_name}")
                        return bucket_name
                except Exception:
                    continue
        
        # If no bucket found with fund_documents, look for any pe-fund-documents bucket
        for bucket in response['Buckets']:
            bucket_name = bucket['Name']
            if bucket_name.startswith('pe-fund-documents-'):
                print(f"⚠️  Found PE bucket (no fund_documents yet): {bucket_name}")
                return bucket_name
        
        print("❌ No PE fund documents bucket found. Please deploy CDK first.")
        return None
        
    except Exception as e:
        print(f"❌ Error discovering bucket: {e}")
        return None

def create_lambda_zip_from_code(code):
    """Create a zip file in memory with just the Python code"""
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
        zipf.writestr('handler.py', code)
    
    zip_buffer.seek(0)
    return zip_buffer.read()

def read_handler_code(function_dir):
    """Read the handler.py file as text"""
    # Handle both running from genai directory and agent_core_config directory
    import os
    
    # Try relative to current directory first
    handler_path = f"{function_dir}/handler.py"
    if not os.path.exists(handler_path):
        # Try relative to agent_core_config directory (when run from genai)
        handler_path = f"../agent_core_config/{function_dir}/handler.py"
    
    with open(handler_path, 'r') as f:
        return f.read()

def wait_for_role_propagation(iam_client, role_arn, max_wait=60):
    """Wait for IAM role to propagate and be assumable by Lambda"""
    print(f"⏳ Waiting for IAM role to propagate...")
    
    for i in range(max_wait):
        try:
            # Try to get the role to ensure it exists
            role_name = role_arn.split('/')[-1]
            iam_client.get_role(RoleName=role_name)
            
            # Wait a bit more for propagation
            if i < 10:  # Wait at least 10 seconds
                time.sleep(1)
                continue
            else:
                print(f"✅ Role propagated after {i+1} seconds")
                return True
                
        except Exception as e:
            if i >= max_wait - 1:
                print(f"❌ Role propagation timeout: {e}")
                return False
            time.sleep(1)
    
    return True

def create_execution_role(iam_client, bucket_name):
    """Create Lambda execution role if it doesn't exist"""
    role_name = 'pe-lambda-execution-role'
    
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
            Description='Lambda execution role for PE data service'
        )
        
        role_arn = response['Role']['Arn']
        role_created = True
        
        # Attach basic execution policy
        iam_client.attach_role_policy(
            RoleName=role_name,
            PolicyArn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        )
        
        # Add S3 permissions for the specific bucket
        s3_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::{bucket_name}",
                        f"arn:aws:s3:::{bucket_name}/*"
                    ]
                }
            ]
        }
        
        iam_client.put_role_policy(
            RoleName=role_name,
            PolicyName='S3AccessPolicy',
            PolicyDocument=json.dumps(s3_policy)
        )
        
        print(f"✅ Created IAM role: {role_name}")
        print(f"   S3 permissions for: {bucket_name}")
        
    except iam_client.exceptions.EntityAlreadyExistsException:
        # Update existing role with new bucket permissions
        s3_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::{bucket_name}",
                        f"arn:aws:s3:::{bucket_name}/*"
                    ]
                }
            ]
        }
        
        iam_client.put_role_policy(
            RoleName=role_name,
            PolicyName='S3AccessPolicy',
            PolicyDocument=json.dumps(s3_policy)
        )
        
        response = iam_client.get_role(RoleName=role_name)
        role_arn = response['Role']['Arn']
        role_created = False
        
        print(f"✅ Updated IAM role: {role_name}")
        print(f"   S3 permissions for: {bucket_name}")
    
    # Wait for role propagation if it was just created
    if role_created:
        wait_for_role_propagation(iam_client, role_arn)
    
    return role_arn

def deploy_lambda_function(lambda_client, function_name, code, env_vars, role_arn, timeout=120):
    """Deploy Lambda function with code as zip"""
    
    try:
        # Check if function exists
        lambda_client.get_function(FunctionName=function_name)
        print(f"⚠️  Function {function_name} already exists. Updating code...")
        
        # Update existing function
        zip_content = create_lambda_zip_from_code(code)
        lambda_client.update_function_code(
            FunctionName=function_name,
            ZipFile=zip_content
        )
        
        # Update environment variables
        lambda_client.update_function_configuration(
            FunctionName=function_name,
            Environment={'Variables': env_vars},
            Timeout=timeout
        )
        
        response = lambda_client.get_function(FunctionName=function_name)
        print(f"✅ Updated function: {function_name}")
        return response['Configuration']['FunctionArn']
        
    except lambda_client.exceptions.ResourceNotFoundException:
        # Create zip from code
        zip_content = create_lambda_zip_from_code(code)
        
        # Retry logic for role assumption issues
        max_retries = 3
        for attempt in range(max_retries):
            try:
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
                
            except lambda_client.exceptions.InvalidParameterValueException as e:
                if "cannot be assumed by Lambda" in str(e) and attempt < max_retries - 1:
                    print(f"⏳ Role not ready yet, waiting 10 seconds... (attempt {attempt + 1}/{max_retries})")
                    time.sleep(10)
                    continue
                else:
                    raise e

def update_payload_file(bucket_name):
    """Update the payload JSON file with the discovered bucket name"""
    payload_file = 'pe-data-service-payload.json'
    
    try:
        with open(payload_file, 'r') as f:
            payload = json.load(f)
        
        # Update the bucket name in environment variables
        payload['environment_variables']['FUND_DOCUMENTS_BUCKET'] = bucket_name
        
        # Update S3 resources in IAM policies
        for policy in payload.get('iam_policies', []):
            if 'resources' in policy:
                policy['resources'] = [
                    f"arn:aws:s3:::{bucket_name}",
                    f"arn:aws:s3:::{bucket_name}/*"
                ]
        
        with open(payload_file, 'w') as f:
            json.dump(payload, f, indent=2)
        
        print(f"✅ Updated {payload_file} with bucket: {bucket_name}")
        
    except Exception as e:
        print(f"⚠️  Could not update {payload_file}: {e}")

def main():
    lambda_client = boto3.client('lambda', region_name='us-east-1')
    iam_client = boto3.client('iam', region_name='us-east-1')
    
    print("🔍 Discovering fund documents bucket...")
    bucket_name = get_fund_documents_bucket()
    
    if not bucket_name:
        print("\n❌ Could not find fund documents bucket.")
        print("Please ensure:")
        print("1. CDK has been deployed successfully")
        print("2. S3 bucket exists with pattern: pe-fund-documents-{account}-{region}")
        print("3. You have S3 list permissions")
        return
    
    # Update payload file with discovered bucket
    update_payload_file(bucket_name)
    
    # Create execution role with bucket-specific permissions
    role_arn = create_execution_role(iam_client, bucket_name)
    
    # Deploy both Lambda functions
    print(f"\n🚀 Deploying fund-document-service function...")
    doc_code = read_handler_code('fund-document-service')
    doc_arn = deploy_lambda_function(
        lambda_client,
        'fund-document-service',
        doc_code,
        {'FUND_DOCUMENTS_BUCKET': bucket_name},
        role_arn,
        timeout=120
    )
    
    print(f"\n🚀 Deploying data-service function...")
    data_code = read_handler_code('pe-data-service')
    data_arn = deploy_lambda_function(
        lambda_client,
        'data-service',
        data_code,
        {'FUND_DOCUMENTS_BUCKET': bucket_name},
        role_arn,
        timeout=120
    )
    
    print("\n🎉 Deployment complete!")
    
    if doc_arn and data_arn:
        print(f"\nFund Document Service ARN: {doc_arn}")
        print(f"Data Service ARN: {data_arn}")
        print(f"Bucket configured: {bucket_name}")
        print("\n📝 Next steps:")
        print("1. Run create_gateways.py to set up the MCP gateway")
        print("2. Test with test_mcp_gateway.py")

if __name__ == "__main__":
    main()
