import os
import boto3
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get the bucket name from the .env file
bucket_name = os.getenv("save_folder")

# Initialize the S3 client
s3 = boto3.client('s3')

def upload_to_s3(uploaded_file):
    """
    This function is used to upload the selected document to S3
    :param selected_file: document file name
    """
    # Upload the file to the S3 bucket
    s3.upload_fileobj(
        uploaded_file,
        bucket_name,
        uploaded_file.name,
    )

def list_files_in_s3():
    """
    This function is used to list the document objects from the S3 bucket that a user can select before sending to Textract
    :param bucket: S3 bucket name
    :return: List of objects in the S3 bucket
    """
    response = s3.list_objects_v2(Bucket=bucket_name)
        # Check if there are objects in bucket
    if 'Contents' in response:
        return [obj['Key'] for obj in response['Contents']]
    else:
        return []


