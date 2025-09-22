import uuid
import os
import boto3
import json
import time
import re
import requests
from botocore.exceptions import ClientError
import logging
from typing import Dict, List
from datetime import datetime, timedelta
from pathlib import Path
from sec_api import QueryApi, RenderApi

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(message)s'))
    logger.addHandler(handler)
    logger.propagate = False

iam_client = boto3.client("iam")
sts_client = boto3.client('sts')
boto3_session = boto3.session.Session()
region_name = boto3_session.region_name
account_id = sts_client.get_caller_identity()['Account']

SEC_API_KEY='unset'


# Headers for direct SEC requests
headers = {
    'User-Agent': "Sample Company Name sample@email.com",
    'Accept-Encoding': 'gzip, deflate',
    'Host': 'www.sec.gov'
}

# Base URLs
sec_base_url = "https://www.sec.gov"
edgar_search_url = "https://www.sec.gov/cgi-bin/browse-edgar"

### FUNCTIONS TO CREATE S3 VECTOR KNOWLEDGE BASE ### 
def create_s3_bucket(bucket_name, region=None):
    """
    Create an S3 bucket
    
    Args:
        bucket_name: Name of the bucket to create
        region: AWS region where the bucket will be created
        
    Returns:
        bool: True if bucket was created, False otherwise
    """
    try:
        s3_client = boto3.client('s3', region_name=region if region else 'us-east-1')
        
        # For us-east-1, no LocationConstraint should be provided
        if region is None or region == 'us-east-1':
            response = s3_client.create_bucket(Bucket=bucket_name)
        else:
            response = s3_client.create_bucket(
                Bucket=bucket_name,
                CreateBucketConfiguration={
                    'LocationConstraint': region
                }
            )
            
        logger.info(f"✅ S3 bucket '{bucket_name}' created successfully")
        return True
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', 'Unknown')
        error_message = e.response.get('Error', {}).get('Message', 'Unknown error')
        logger.info(f"❌ Error creating bucket '{bucket_name}': {error_code} - {error_message}")
        return False

def generate_short_code():
    # Create a random UUID
    random_uuid = uuid.uuid4()
    
    # Convert to string and take the first 4 characters
    short_code = str(random_uuid)[:4]
    
    return short_code

def empty_and_delete_bucket(bucket_name):
    """
    Empty and delete an S3 bucket, including all objects and versions
    """
    s3 = boto3.resource('s3')
    bucket = s3.Bucket(bucket_name)
    
    # Delete all objects
    bucket.objects.all().delete()
    
    # Delete all object versions if versioning is enabled
    bucket_versioning = boto3.client('s3').get_bucket_versioning(Bucket=bucket_name)
    if 'Status' in bucket_versioning and bucket_versioning['Status'] == 'Enabled':
        bucket.object_versions.all().delete()
    
    # Now delete the empty bucket
    boto3.client('s3').delete_bucket(Bucket=bucket_name)
    logger.info(f"Bucket {bucket_name} has been emptied and deleted.")

def create_bedrock_execution_role(unique_id, region_name, bucket_name, vector_store_name,vector_index_name, account_id):            
        """
        Create Knowledge Base Execution IAM Role and its required policies.
        If role and/or policies already exist, retrieve them
        Returns:
            IAM role
        """

        foundation_model_policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "bedrock:InvokeModel",
                    ],
                    "Resource": [
                        f"arn:aws:bedrock:{region_name}::foundation-model/amazon.titan-embed-text-v2:0",
                        f"arn:aws:bedrock:{region_name}::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
                        f"arn:aws:bedrock:{region_name}::foundation-model/cohere.rerank-v3-5:0"             
                    ]
                }
            ]
        }

        s3_policy_document = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:ListBucket",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": [
                            f"arn:aws:s3:::{bucket_name}",
                            f"arn:aws:s3:::{bucket_name}/*"
                        ]
                    }
                ]
            }

        cw_log_policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        "logs:DescribeLogStreams"
                    ],
                    "Resource": "arn:aws:logs:*:*:log-group:/aws/bedrock/invokemodel:*"
                }
            ]
        }

        s3_vector_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3vectors:*"
                    ],
                    "Resource": f"arn:aws:s3vectors:{region_name}:{account_id}:bucket/{vector_store_name}/index/{vector_index_name}"
                }
            ]
        }

        assume_role_policy_document = {
        "Version": "2012-10-17",
        
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "bedrock.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
            ]
        }

        # combine all policies into one list from policy documents
        policies = [
            (f"foundation-model-policy_{unique_id}", foundation_model_policy_document, 'Policy for accessing foundation model'),
            (f"cloudwatch-logs-policy_{unique_id}", cw_log_policy_document, 'Policy for writing logs to CloudWatch Logs'),
            (f"s3-bucket_{unique_id}", s3_policy_document, 'Policy for s3 buckets'),
            (f"s3vector_{unique_id}", s3_vector_policy, 'Policy for s3 Vector')]
        
            
        # create bedrock execution role
        bedrock_kb_execution_role = iam_client.create_role(
            RoleName=f"kb_execution_role_s3_vector_{unique_id}",
            AssumeRolePolicyDocument=json.dumps(assume_role_policy_document),
            Description='Amazon Bedrock Knowledge Base Execution Role',
            MaxSessionDuration=3600
        )

        # create and attach the policies to the bedrock execution role
        for policy_name, policy_document, description in policies:
            policy = iam_client.create_policy(
                PolicyName=policy_name,
                PolicyDocument=json.dumps(policy_document),
                Description=description,
            )
            iam_client.attach_role_policy(
                RoleName=bedrock_kb_execution_role["Role"]["RoleName"],
                PolicyArn=policy["Policy"]["Arn"]
            )

        return bedrock_kb_execution_role
    
def create_vector_bucket(vector_bucket_name, s3vectors):
    """Create an S3 Vector bucket and return its ARN"""
    try:
        # Create the vector bucket
        s3vectors.create_vector_bucket(vectorBucketName=vector_bucket_name)
        logger.info(f"✅ Vector bucket '{vector_bucket_name}' created successfully")
        
        # Get the vector bucket details
        response = s3vectors.get_vector_bucket(vectorBucketName=vector_bucket_name)
        bucket_info = response.get("vectorBucket", {})
        vector_store_arn = bucket_info.get("vectorBucketArn")
        
        if not vector_store_arn:
            raise ValueError("Vector bucket ARN not found in response")
            
        logger.info(f"Vector bucket ARN: {vector_store_arn}")
        return vector_store_arn
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', 'Unknown')
        error_message = e.response.get('Error', {}).get('Message', 'Unknown error')
        logger.info(f"❌ Error creating vector bucket: {error_code} - {error_message}")
        raise

def create_and_get_index_arn(s3vectors_client, vector_store_name, vector_index_name, vector_dimension):
    """
    Create a vector index in the specified vector store and return its ARN
    
    Args:
        s3vectors_client: Boto3 client for S3 Vectors
        vector_store_name: Name of the vector store
        vector_index_name: Name for the new index
        vector_dimension: Dimension of the vectors (e.g., 1024 for Titan Embed)
        
    Returns:
        str: ARN of the created index
    """
    # Define index configuration
    index_config = {
        "vectorBucketName": vector_store_name,
        "indexName": vector_index_name,
        "dimension": vector_dimension,
        "distanceMetric": "cosine",  # Using cosine similarity as our metric
        "dataType": "float32",       # Standard for most embedding models
        "metadataConfiguration": {
            "nonFilterableMetadataKeys": ["AMAZON_BEDROCK_TEXT","AMAZON_BEDROCK_METADATA"]# Text content won't be used for filtering
        }
    }
    
    try:
        # Create the index
        s3vectors_client.create_index(**index_config)
        logger.info(f"✅ Vector index '{vector_index_name}' created successfully")

        # Get the index ARN
        response = s3vectors_client.list_indexes(vectorBucketName=vector_store_name)
        index_arn = response.get("indexes", [{}])[0].get("indexArn")
        
        if not index_arn:
            raise ValueError("Index ARN not found in response")
            
        logger.info(f"Vector index ARN: {index_arn}")
        return index_arn

    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', 'Unknown')
        error_message = e.response.get('Error', {}).get('Message', 'Unknown error')
        logger.info(f"❌ Failed to create or retrieve index: {error_code} - {error_message}")
        raise

def create_knowledge_base(kb_name, bedrock, roleArn, vector_store_name, vector_index_name):
    # Wait for IAM role propagation
    logger.info("Waiting for IAM role propagation (60 seconds)...")
    time.sleep(60)  # Wait for all policies and resources to be fully propagated

    # Create the Knowledge Base
    create_kb_response = bedrock.create_knowledge_base(
        name=kb_name,
        description='Amazon Bedrock Knowledge Bases with S3 Vector Store',
        roleArn=roleArn,
        knowledgeBaseConfiguration={
            'type': 'VECTOR',
            'vectorKnowledgeBaseConfiguration': {
                # Specify the embedding model to use
                'embeddingModelArn': f'arn:aws:bedrock:{region_name}::foundation-model/amazon.titan-embed-text-v2:0',
                'embeddingModelConfiguration': {
                    'bedrockEmbeddingModelConfiguration': {
                        'dimensions': 1024,  # Should match the vector_dimension we defined earlier
                        'embeddingDataType': 'FLOAT32'
                    }
                },
            },
        },
        storageConfiguration={
            'type': 'S3_VECTORS',
            's3VectorsConfiguration': {
                'indexArn': f'arn:aws:s3vectors:{region_name}:{account_id}:bucket/{vector_store_name}/index/{vector_index_name}',
            },
        }
    )

    knowledge_base_id = create_kb_response["knowledgeBase"]["knowledgeBaseId"]
    logger.info(f"Knowledge base ID: {knowledge_base_id}")

    logger.info(f"\nWaiting for knowledge base {knowledge_base_id} to finish creating...")

    # Poll for KB creation status
    status = "CREATING"
    start_time = time.time()

    while status == "CREATING":
        # Get current status
        response = bedrock.get_knowledge_base(
            knowledgeBaseId=knowledge_base_id
        )
        
        status = response['knowledgeBase']['status']
        elapsed_time = int(time.time() - start_time)
        
        logger.info(f"Current status: {status} (elapsed time: {elapsed_time}s)")
        
        if status == "CREATING":
            logger.info("Still creating, checking again in 30 seconds...")
            time.sleep(30)
        else:
            break

    logger.info(f"\n✅ Knowledge base creation completed with status: {status}")

    return knowledge_base_id

def create_s3_data_source(bedrock, knowledge_base_id, bucket_name ):
    # Create the data source
    data_source_response = bedrock.create_data_source(
        knowledgeBaseId=knowledge_base_id,
        name='AmazonS3DataSource',
        description='Amazon S3 Data Source',
        dataDeletionPolicy='DELETE',  # When data source is deleted, also delete the data
        dataSourceConfiguration={
            'type': 'S3',
            's3Configuration': {
                'bucketArn': f'arn:aws:s3:::{bucket_name}',
            },
        },
        vectorIngestionConfiguration={
            'chunkingConfiguration': {
                'chunkingStrategy': 'FIXED_SIZE',  # Split documents into chunks of fixed size
                'fixedSizeChunkingConfiguration': {
                    "maxTokens": 300,           # Maximum tokens per chunk
                    "overlapPercentage": 20     # Overlap between chunks to maintain context
                }
            }
        }
    )

    # Extract the data source ID
    datasource_id = data_source_response["dataSource"]["dataSourceId"]
    logger.info(f"✅ Data source created with ID: {datasource_id}")
    return datasource_id
    

### FUNCTIONS TO POPULATE S3 VECTOR KNOWLEDGE BASE WITH 10-K DOCUMENTS ### 
def download_filing(url: str, filing: Dict, symbol: str) -> str:
    """Download filing using sec-api render API"""

    render_api = RenderApi(api_key=SEC_API_KEY)

    try:
        # Use render API to get the HTML content
        html_content = render_api.get_filing(url)
        
        # Create filename and directory
        year = filing['periodOfReport'][:4]
        filename = f"{symbol}_{year}_{filing['periodOfReport']}_10K.html"
        
        local_dir = Path('./temp_10k') / year / symbol
        local_dir.mkdir(parents=True, exist_ok=True)
        local_file_path = local_dir / filename
        
        # Save to file
        with open(local_file_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        logger.info(f"Downloaded: {local_file_path}")
        return str(local_file_path)
        
    except Exception as e:
        logger.error(f"Error downloading filing {filing['accessionNo']}: {e}")
        return None

def upload_to_s3(s3_bucket, local_file_path: str, symbol: str, year: str) -> bool:
    """
    Upload file to S3 with organized structure
    
    Args:
        local_file_path: Path to local file
        symbol: Company symbol
        year: Filing year
        
    Returns:
        True if successful, False otherwise
    """

    s3_client = boto3.client('s3')

    try:
        filename = Path(local_file_path).name
        s3_key = f"10k-reports/{year}/{symbol}/{filename}"
        
        logger.info(f"Uploading to S3: s3://{s3_bucket}/{s3_key}")
        
        s3_client.upload_file(
            local_file_path,
            s3_bucket,
            s3_key,
            ExtraArgs={
                'ContentType': 'text/html',
                'Metadata': {
                    'company-symbol': symbol,
                    'filing-year': year,
                    'document-type': '10K'
                }
            }
        )
        
        logger.info(f"Successfully uploaded: {s3_key}")
        return True
        
    except Exception as e:
        logger.error(f"Error uploading {local_file_path} to S3: {e}")
        return False

def cleanup_local_file(file_path: str):
    """Remove local file after successful upload"""
    try:
        os.remove(file_path)
        logger.debug(f"Cleaned up local file: {file_path}")
    except Exception as e:
        logger.warning(f"Could not clean up {file_path}: {e}")

def process_company(bucket_name, symbol: str, years_back: int = 5) -> Dict:
    """
    Process all 10K filings for a single company
    
    Args:
        symbol: Company stock symbol
        years_back: Number of years to look back
        
    Returns:
        Dictionary with processing results
    """
    logger.info(f"Processing company: {symbol}")

    results = {
        'symbol': symbol,
        'total_filings': 0,
        'downloaded': 0,
        'uploaded': 0,
        'errors': []
    }
    
    # Get 10K filings
    filings = get_filings(symbol)
    
    results['total_filings'] = len(filings)
    
    logger.info(f"Processing {len(filings)} {symbol} filings...")

    if not filings:
        error_msg = f"No 10K filings found for {symbol}"
        logger.warning(error_msg)
        results['errors'].append(error_msg)
        return results
    
    # Process each filing
    for filing in filings:
        logger.info(f"Downloding filings")
        try:
            print(f"Filing type: {type(filing)}, Filing value: {filing}")
            url = filing['linkToFilingDetails']
            # Download filing
            logger.info(f"Downloading filing {url}")
            local_file_path = download_filing(url, filing, symbol)
            if local_file_path:
                results['downloaded'] += 1
                
                # Upload to S3
                year = filing['periodOfReport'][:4]
                if upload_to_s3(bucket_name, local_file_path, symbol, year):
                    results['uploaded'] += 1
                    # Clean up local file after successful upload
                    #cleanup_local_file(local_file_path)
                else:
                    results['errors'].append(f"Failed to upload {local_file_path}")
            else:
                results['errors'].append(f"Failed to download filing {filing['accessionNo']}")
                
        except Exception as e:
            error_msg = f"Error processing filing {filing['accessionNo']}: {e}"
            logger.error(error_msg)
            results['errors'].append(error_msg)
    
    return results

def get_filings(symbol: str, years_back: int = 5) -> Dict:
    """
    Process all 10K filings for a single company
    
    Args:
        symbol: Company stock symbol
        years_back: Number of years to look back
        
    Returns:
        Dictionary with processing results
    """
    logger.info(f"Processing company: {symbol}")
    
    # Initialize SEC API client (get free API key from sec-api.io)
    query_api = QueryApi(api_key=SEC_API_KEY)
    
    results = {
        'symbol': symbol,
        'total_filings': 0,
        'downloaded': 0,
        'uploaded': 0,
        'errors': []
    }

    query = {
        "query": { "query_string": { 
            "query": f"formType:\"10-K\" AND ticker:{symbol}", # only 10-Ks
        }},
        "from": "0", # start returning matches from position null, i.e. the first matching filing 
        "size": f"{years_back}"  # return last 
    }

    response = query_api.get_filings(query)
    print(json.dumps(response["filings"][0], indent=2))
    results['total_filings'] = len(response["filings"])
    return response["filings"]

def process_companies(bucket_name, symbols: List[str], api_key: str,  years_back: int = 5) -> Dict:
    """
    Process multiple companies
    
    Args:
        symbols: List of company symbols
        years_back: Number of years to look back
        
    Returns:
        Dictionary with overall results
    """
    global SEC_API_KEY 
    
    logger.info(f"🏁 Starting processing of {len(symbols)} companies")
    logger.info(f"\n📊 Processing {len(symbols)} companies for 10K reports...")
    
    SEC_API_KEY = api_key

    overall_results = {
        'companies_processed': 0,
        'total_filings_found': 0,
        'total_downloaded': 0,
        'total_uploaded': 0,
        'company_results': {},
        'start_time': datetime.now().isoformat(),
        'end_time': None
    }
    
    for i, symbol in enumerate(symbols, 1):
        try:
            logger.info(f"\n[{i}/{len(symbols)}] Processing {symbol}...")
            results = process_company(bucket_name, symbol, years_back)
            overall_results['company_results'][symbol] = results
            overall_results['companies_processed'] += 1
            overall_results['total_filings_found'] += results['total_filings']
            overall_results['total_downloaded'] += results['downloaded']
            overall_results['total_uploaded'] += results['uploaded']
            
            # Progress update
            success_rate = f"{results['uploaded']}/{results['total_filings']}" if results['total_filings'] > 0 else "0/0"
            logger.info(f"✅ {symbol}: {success_rate} reports uploaded to S3")
            
            if results['errors']:
                logger.info(f"⚠️  {symbol}: {len(results['errors'])} errors occurred")
            
            # Rate limiting between companies
            time.sleep(1)
            
        except Exception as e:
            error_msg = f"Error processing company {symbol}: {e}"
            logger.error(error_msg)
            logger.info(f"❌ {symbol}: Processing failed - {e}")
            overall_results['company_results'][symbol] = {
                'symbol': symbol,
                'total_filings': 0,
                'downloaded': 0,
                'uploaded': 0,
                'errors': [error_msg]
            }
    
    overall_results['end_time'] = datetime.now().isoformat()
    
    # Save results to file
    with open('download_results.json', 'w') as f:
        json.dump(overall_results, f, indent=2)
    
    return overall_results

def upload_companies(bucket_name: str, preloaded_path: str = "./preloaded_10k") -> Dict:
    """
    Upload preloaded 10K documents to S3
    
    Args:
        bucket_name: S3 bucket name
        preloaded_path: Path to preloaded 10k documents
        
    Returns:
        Dictionary with upload results
    """
    logger.info(f"🚀 Starting upload of preloaded 10K documents from {preloaded_path}")
    
    results = {
        'companies_processed': 0,
        'total_uploaded': 0,
        'company_results': {},
        'start_time': datetime.now().isoformat(),
        'end_time': None
    }
    
    preloaded_dir = Path(preloaded_path)
    
    for year_dir in preloaded_dir.iterdir():
        if not year_dir.is_dir():
            continue
            
        year = year_dir.name
        
        for company_dir in year_dir.iterdir():
            if not company_dir.is_dir():
                continue
                
            symbol = company_dir.name
            
            if symbol not in results['company_results']:
                results['company_results'][symbol] = {'uploaded': 0}
            
            for file_path in company_dir.glob("*.html"):
                if upload_to_s3(bucket_name, str(file_path), symbol, year):
                    results['total_uploaded'] += 1
                    results['company_results'][symbol]['uploaded'] += 1
                    
            if symbol not in [k for k in results['company_results'].keys() if results['company_results'][k]['uploaded'] == 0]:
                results['companies_processed'] += 1
    
    results['end_time'] = datetime.now().isoformat()
    
    logger.info(f"✅ Upload complete! {results['companies_processed']} companies, {results['total_uploaded']} files uploaded")
    
    return results

