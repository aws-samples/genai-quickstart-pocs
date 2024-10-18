import boto3

# Initialize Comprehend client
comprehend_client = boto3.client('comprehend')

# Function to detect entities using Amazon Comprehend
def detect_entities(text):
    """
    This function invokes the Comprehend client to detect built-in, default entities
    :param prompt: The text from the enriched output fil
    :return: The default entities
    """
    # Call detect_entities function to detect the default, built-in entities from Comprehend
    response = comprehend_client.detect_entities(
        Text=text,
        # Choose the language code
        LanguageCode='en'
    )
    return response['Entities']
