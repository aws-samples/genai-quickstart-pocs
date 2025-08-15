###################################################################################################################################################
# Sample code, software libraries, command line tools, proofs of concept, templates, or other related technology are provided as AWS Content      #
# or Third-Party Content under the AWS Customer Agreement, or the relevant written agreement between you and AWS (whichever applies). You should  # 
# not use this AWS Content or Third-Party Content in your production accounts, or on production or other critical data. You are responsible for   #
# testing, securing, and optimizing the AWS Content or Third-Party Content, such as sample code, as appropriate for production grade use based on #  
# your specific quality control practices and standards. Deploying AWS Content or Third-Party Content may incur AWS charges for creating or using # 
# AWS chargeable resources, such as running Amazon EC2 instances or using Amazon S3 storage.                                                      #
###################################################################################################################################################

import boto3
import botocore
import json
import logging
from botocore.exceptions import ClientError
import os
from urllib.parse import unquote_plus

# Set constants
LOCAL = os.getenv("LOCAL", "N")
TOPIC_ARN = os.getenv("TOPIC_ARN")
TOPIC_ROLE_ARN = os.getenv("TOPIC_ROLE_ARN")
OUT_BUCKET = os.getenv("OUT_BUCKET")

# Set logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.info("boto3 version: " + boto3.__version__)
logger.info("botocore version: " + botocore.__version__) 

# Clients
textract = boto3.client('textract')

def textractDocument(bucket, key):
    try:
        response = textract.start_document_text_detection(
                    DocumentLocation={
                        'S3Object': {
                            'Bucket': bucket, 
                            'Name': key
                        }
                    },
                    NotificationChannel={
                        'RoleArn': TOPIC_ROLE_ARN,
                        'SNSTopicArn': TOPIC_ARN
                    },
                    OutputConfig={
                        'S3Bucket': OUT_BUCKET,
                    }
                )
        logger.info("Textract JobId " + response['JobId'])

    except botocore.exceptions.ClientError as e:
        error_code = e.response['Error']['Code']
        error_msg = e.response['Error']['Message']
        logger.error(f"Textracts API error: {error_code} - {error_msg}")
        raise Exception(f"Textract processing failed: {error_code} - {error_msg}")
    except Exception as e:
        logger.error(f"Error invoking Textract: {str(e)}")
        raise

def lambda_handler(event, context):
    logger.info(event)
    logger.debug("Topic ARN: " + TOPIC_ARN)
    logger.debug("Topic role: " + TOPIC_ROLE_ARN)

    bucket = event['Records'][0]['s3']['bucket']['name']
    key = unquote_plus(event['Records'][0]['s3']['object']['key'])

    try: 
        response = textractDocument(bucket, key)
    
        logger.info("Textract processing completed successfully")

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
    
# Local testing event payload and handler invocation, Set for local testing
if LOCAL == "Y":
    import sys
    
    # Create file handler
    file_handler = logging.FileHandler('lambda_errors.log')
    file_handler.setLevel(LOG_LEVEL)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    
    # Add handler to logger
    logger.addHandler(file_handler)

    event = {} # Add event for local testing
    lambda_handler(event, None)