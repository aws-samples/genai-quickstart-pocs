import streamlit as st
import boto3
import time
import os
import tempfile
from botocore.exceptions import ClientError

# AWS Configuration
AWS_REGION = 'us-east-2'
S3_BUCKET_NAME = 'amazon-bedrock-agent-text-to-speech-poc-workfolder' #replace with project S3 folder
S3_OUTPUT_FOLDER = 'output/'  # Subfolder in the S3 bucket

# Initialize AWS clients
polly_client = boto3.client('polly',                       
                            region_name=AWS_REGION)

s3_client = boto3.client('s3', 
                         region_name=AWS_REGION)

def generate_and_upload_audio(text, filename):
    try:
        # Generate audio using Polly
        response = polly_client.synthesize_speech(
            Text=text,
            OutputFormat='mp3',
            VoiceId='Joanna'  # You can change the voice as needed
        )

        # Create full path in temp directory
        temp_dir = tempfile.gettempdir()
        filepath = os.path.join(temp_dir, filename)
        
        # Save the audio stream to a file
        with open(filepath, 'wb') as file:
            file.write(response['AudioStream'].read())

        # Upload file to S3 in the output folder
        s3_key = S3_OUTPUT_FOLDER + filename
        s3_client.upload_file(filepath, S3_BUCKET_NAME, s3_key)
        
        # Remove the local file after uploading
        os.remove(filepath)
        
        return True, s3_key
    except ClientError as e:
        st.error(f"Error: {e}")
        return False, None

def check_file_exists_in_s3(s3_key):
    try:
        s3_client.head_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
        return True
    except ClientError:
        return False

def generate_presigned_URL(s3_key):
     # Generate a presigned URL for the S3 object
    try:
        url = s3_client.generate_presigned_url('get_object',
                                                Params={'Bucket': S3_BUCKET_NAME,
                                                        'Key': s3_key},
                                                ExpiresIn=3600)
        return url
    except ClientError as e:
        st.error(f"Error generating presigned URL: {e}")

