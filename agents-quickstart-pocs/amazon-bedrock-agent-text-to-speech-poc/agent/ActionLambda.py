# Required imports for AWS services, file operations, and error handling
import json
import boto3
import base64
import time
import os
from botocore.exceptions import ClientError

# AWS Configuration - Update these values with your actual AWS resources
AWS_REGION = '<AWS REGION>'  # AWS region where resources are deployed
S3_BUCKET_NAME = "<S3 BUCKET NAME>"  # S3 bucket for storing synthesized speech audio files
S3_OUTPUT_FOLDER = 'output/'  # Subfolder within the S3 bucket for organized file storage

# Initialize AWS service clients
polly_client = boto3.client('polly', region_name=AWS_REGION)  # Amazon Polly for text-to-speech
s3_client = boto3.client('s3', region_name=AWS_REGION)  # Amazon S3 for file storage
bucket_name = S3_BUCKET_NAME  # Reference to the S3 bucket name 

def lambda_handler(event, context):
    """
    Main Lambda handler function that processes Bedrock Agent requests.
    Routes requests to appropriate functions based on API path.
    
    Args:
        event: Contains request data from Bedrock Agent including parameters and API path
        context: Lambda runtime context (unused in this function)
    
    Returns:
        dict: Formatted response for Bedrock Agent with action results
    """
    print(event)  # Log the incoming event for debugging
  
    # Mock company data for demonstration purposes
    # In production, this would typically come from a database or external API
    company_data = [
        #Technology Industry
        {"companyId": 1, "companyName": "TechStashNova Inc.", "industrySector": "Technology", "revenue": 10000, "expenses": 3000, "profit": 7000, "employees": 10},
        {"companyId": 2, "companyName": "QuantumPirateLeap Technologies", "industrySector": "Technology", "revenue": 20000, "expenses": 4000, "profit": 16000, "employees": 10},
        {"companyId": 3, "companyName": "CyberCipherSecure IT", "industrySector": "Technology", "revenue": 30000, "expenses": 5000, "profit": 25000, "employees": 10},
        {"companyId": 4, "companyName": "DigitalMyricalDreams Gaming", "industrySector": "Technology", "revenue": 40000, "expenses": 6000, "profit": 34000, "employees": 10},
        {"companyId": 5, "companyName": "NanoMedNoLand Pharmaceuticals", "industrySector": "Technology", "revenue": 50000, "expenses": 7000, "profit": 43000, "employees": 10},
        {"companyId": 6, "companyName": "RoboSuperBombTech Industries", "industrySector": "Technology", "revenue": 60000, "expenses": 8000, "profit": 52000, "employees": 12},
        {"companyId": 7, "companyName": "FuturePastNet Solutions", "industrySector": "Technology",  "revenue": 60000, "expenses": 9000, "profit": 51000, "employees": 10},
        {"companyId": 8, "companyName": "InnovativeCreativeAI Corp", "industrySector": "Technology", "revenue": 65000, "expenses": 10000, "profit": 55000, "employees": 15},
        {"companyId": 9, "companyName": "EcoLeekoTech Energy", "industrySector": "Technology", "revenue": 70000, "expenses": 11000, "profit": 59000, "employees": 10},
        {"companyId": 10, "companyName": "TechyWealthHealth Systems", "industrySector": "Technology", "revenue": 80000, "expenses": 12000, "profit": 68000, "employees": 10},
    
        #Real Estate Industry
        {"companyId": 11, "companyName": "LuxuryToNiceLiving Real Estate", "industrySector": "Real Estate", "revenue": 90000, "expenses": 13000, "profit": 77000, "employees": 10},
        {"companyId": 12, "companyName": "UrbanTurbanDevelopers Inc.", "industrySector": "Real Estate", "revenue": 100000, "expenses": 14000, "profit": 86000, "employees": 10},
        {"companyId": 13, "companyName": "SkyLowHigh Towers", "industrySector": "Real Estate", "revenue": 110000, "expenses": 15000, "profit": 95000, "employees": 18},
        {"companyId": 14, "companyName": "GreenBrownSpace Properties", "industrySector": "Real Estate", "revenue": 120000, "expenses": 16000, "profit": 104000, "employees": 10},
        {"companyId": 15, "companyName": "ModernFutureHomes Ltd.", "industrySector": "Real Estate", "revenue": 130000, "expenses": 17000, "profit": 113000, "employees": 10},
        {"companyId": 16, "companyName": "CityCountycape Estates", "industrySector": "Real Estate", "revenue": 140000, "expenses": 18000, "profit": 122000, "employees": 10},
        {"companyId": 17, "companyName": "CoastalFocalRealty Group", "industrySector": "Real Estate", "revenue": 150000, "expenses": 19000, "profit": 131000, "employees": 10},
        {"companyId": 18, "companyName": "InnovativeModernLiving Spaces", "industrySector": "Real Estate", "revenue": 160000, "expenses": 20000, "profit": 140000, "employees": 10},
        {"companyId": 19, "companyName": "GlobalRegional Properties Alliance", "industrySector": "Real Estate", "revenue": 170000, "expenses": 21000, "profit": 149000, "employees": 11},
        {"companyId": 20, "companyName": "NextGenPast Residences", "industrySector": "Real Estate", "revenue": 180000, "expenses": 22000, "profit": 158000, "employees": 260}
    ]
    
  
    def get_named_parameter(event, name):
        """
        Extract a named parameter from the event's parameters array.
        Used for URL path parameters.
        
        Args:
            event: The Lambda event object
            name: The parameter name to search for
        
        Returns:
            str: The value of the named parameter
        """
        return next(item for item in event['parameters'] if item['name'] == name)['value']
    
    def get_named_property(event, name):
        """
        Extract a named property from the event's request body.
        Used for JSON payload properties.
        
        Args:
            event: The Lambda event object
            name: The property name to search for
        
        Returns:
            str or None: The value of the named property, or None if not found
        """
        properties = event['requestBody']['content']['application/json']['properties']
        return next((item['value'] for item in properties if item['name'] == name), None)
 
    def companyResearch(event):
        """
        Search for company information based on company name.
        Performs case-insensitive matching against the mock data.
        
        Args:
            event: The Lambda event containing the company name parameter
        
        Returns:
            dict or None: Company information if found, None otherwise
        """
        # Extract company name from parameters and convert to lowercase for case-insensitive search
        companyName = get_named_parameter(event, 'name').lower()
        print("Searching for company: ", companyName)
        
        # Search through mock company data for matching name
        for company_info in company_data:
            if company_info["companyName"].lower() == companyName:
                return company_info

        # Return None if no matching company is found
        return None
    
    def synthesizeSpeech(event):
        """
        Convert text to speech using Amazon Polly and store the audio file in S3.
        Generates a presigned URL for accessing the audio file.
        
        Args:
            event: The Lambda event containing the text to synthesize
        
        Returns:
            dict: Contains presigned URL and filename on success, or error message on failure
        """
        # Extract text from the request body properties
        text = get_named_property(event, 'Text')
        print("Text to synthesize: ", text)

        try:
            # Use Amazon Polly to convert text to speech
            response = polly_client.synthesize_speech(
                Text=text,
                OutputFormat='mp3',  # Audio format for the output
                VoiceId='Joanna'     # Voice selection (can be customized)
            )

            # Generate a unique filename using current timestamp
            file_name = f"audio_{int(time.time())}.mp3"
            s3_key = S3_OUTPUT_FOLDER + file_name 
            print("S3 key for audio file: ", s3_key)

            # Save the audio stream to Lambda's temporary directory
            temp_file_path = f"/tmp/{file_name}"
            with open(temp_file_path, 'wb') as file:
                file.write(response['AudioStream'].read())

            # Upload the audio file to S3 for persistent storage
            s3_client.upload_file(temp_file_path, S3_BUCKET_NAME, s3_key)
            
            # Optional: Clean up temporary file (commented out for debugging)
            # os.remove(temp_file_path)

            # Generate a presigned URL for secure, temporary access to the audio file
            presigned_url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': bucket_name, 'Key': s3_key},
                ExpiresIn=3600  # URL expires in 1 hour for security
            )

            # Return success response with URL and filename
            return {
                'presignedUrl': presigned_url,
                'fileName': file_name
            }

        except ClientError as e:
            # Handle AWS service errors and return error information
            print(f"Error in speech synthesis: {e}")
            return {
                'error': str(e)
            }

    # Main request routing logic
    result = ''  # Initialize result variable
    response_code = 200  # Default to success status code
    action_group = event['actionGroup']  # Extract action group from event
    api_path = event['apiPath']  # Extract API path to determine which function to call
    
    print("Processing API path: ", api_path)
    
    # Route the request to the appropriate handler function based on API path
    if api_path == '/companyResearch':
        result = companyResearch(event)
    elif api_path == '/synthesizeSpeech':
        result = synthesizeSpeech(event)
    else:
        # Handle unrecognized API paths with 404 error
        response_code = 404
        result = f"Unrecognized api path: {action_group}::{api_path}"
        
    # Format the response body according to Bedrock Agent expectations
    response_body = {
        'application/json': {
            'body': result
        }
    }
        
    # Construct the action response with all required fields
    action_response = {
        'actionGroup': event['actionGroup'],
        'apiPath': event['apiPath'],
        'httpMethod': event['httpMethod'],
        'httpStatusCode': response_code,
        'responseBody': response_body
    }

    # Final API response formatted for Bedrock Agent
    api_response = {'messageVersion': '1.0', 'response': action_response}
    return api_response
