import os
import streamlit as st
import boto3
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get the bucket name from the .env file
bucket_name = os.getenv("save_folder")

# Initialize the S3 and Textract client
s3 = boto3.client('s3')
textract_client = boto3.client('textract')

# Streamlit app title
st.title(f""":rainbow[Analyze Document with Amazon Textract]""")

def list_files_in_s3(bucket):
    """
    This function is used to list the document objects from the S3 bucket that a user can select before sending to Textract
    :param bucket: S3 bucket name
    :return: List of objects in the S3 bucket
    """
    try:
        response = s3.list_objects_v2(Bucket=bucket)
        # Check if there are objects in bucket
        if 'Contents' in response:
            return [obj['Key'] for obj in response['Contents']]
        else:
            return []
    except Exception as e:
        st.error(f"An error occurred while listing files: {e}")
        return []

# Invoke function to list document objects
files = list_files_in_s3(bucket_name)

# Select object with Streamlit
selected_file = st.selectbox("Select a document from S3 to process:", files)

# If user has selected file, then begin Textract job
if selected_file:
    st.write(f"Selected file: {selected_file}") 
    if st.button("Extract raw text and key-value pairs", type='primary'):
        with st.spinner("Processing document..."):

            # Start Textract job to extract the data
            def start_textract_job(bucket, document_key):
                response = textract_client.start_document_analysis(
                    DocumentLocation={'S3Object': {'Bucket': bucket, 'Name': document_key}},
                    FeatureTypes=["TABLES", "FORMS"]
                )
                return response['JobId']

            # Get Textract job results
            def get_textract_job_results(job_id):
                response = textract_client.get_document_analysis(JobId=job_id)
                return response

            job_id = start_textract_job(bucket_name, selected_file)

            # Poll Textract job status
            status = ""
            while status != "SUCCEEDED":
                response = textract_client.get_document_analysis(JobId=job_id)
                status = response['JobStatus']

            # Display results
            if status == "SUCCEEDED":
                textract_response = get_textract_job_results(job_id)

                # Extract raw text from Textract response
                raw_text = ""
                blocks = textract_response['Blocks']
                # For each raw text block, add to the raw_text string with a new line
                for block in blocks:
                    if block['BlockType'] == 'LINE':
                        raw_text += block['Text'] + "\n"
                
                # Save the raw text to a local .txt file
                with open("extracted_text.txt", "w", encoding="utf-8") as f:
                    f.write(raw_text)
                # Display success message
                st.success("Raw text has been saved to 'extracted_text.txt'.")

                # Analyze document for key-value pairs
                def analyze_document_with_textract(s3_key):
                    response = textract_client.analyze_document(
                        Document={
                            'S3Object': {
                                'Bucket': bucket_name,
                                'Name': s3_key
                            }
                        },
                        FeatureTypes=["FORMS"]
                    )
                    return response

                # Extract key-value pairs after analysis
                def extract_key_value_pairs(response):
                    key_value_pairs = {}
                    
                    # For each block in the response, extract the key, value, and confidence score
                    for block in response['Blocks']:
                        if block['BlockType'] == 'KEY_VALUE_SET':
                            if 'KEY' in block['EntityTypes']:
                                key = ''
                                value = ''
                                confidence = None
                                
                                # Extract key
                                for relationship in block.get('Relationships', []):
                                    if relationship['Type'] == 'CHILD':
                                        for child_id in relationship['Ids']:
                                            child_block = next(b for b in response['Blocks'] if b['Id'] == child_id)
                                            if child_block['BlockType'] == 'WORD':
                                                key += child_block['Text'] + ' '
                                            elif child_block['BlockType'] == 'SELECTION_ELEMENT':
                                                if child_block['SelectionStatus'] == 'SELECTED':
                                                    key += child_block['Text'] + ' '

                                key = key.strip()
                                
                                # Extract value and confidence score
                                for relationship in block.get('Relationships', []):
                                    if relationship['Type'] == 'VALUE':
                                        for value_id in relationship['Ids']:
                                            value_block = next(b for b in response['Blocks'] if b['Id'] == value_id)
                                            confidence = value_block.get('Confidence', None)
                                            for val_relationship in value_block.get('Relationships', []):
                                                if val_relationship['Type'] == 'CHILD':
                                                    for val_child_id in val_relationship['Ids']:
                                                        val_child_block = next(b for b in response['Blocks'] if b['Id'] == val_child_id)
                                                        if val_child_block['BlockType'] == 'WORD':
                                                            value += val_child_block['Text'] + ' '
                                                        elif val_child_block['BlockType'] == 'SELECTION_ELEMENT':
                                                            if val_child_block['SelectionStatus'] == 'SELECTED':
                                                                value += 'X '
                                
                                value = value.strip()
                                
                                # Check for specific values such as gender or values to denote selection (ex. "X")
                                if value in ["M", "F", "X"]:  
                                    key_value_pairs[key] = {"Value": value, "Confidence": confidence}
                                # Only add if value is not empty
                                elif value:
                                    key_value_pairs[key] = {"Value": value, "Confidence": confidence}

                    return key_value_pairs

                # Invoke analysis function, passing in the selected file from S3
                response = analyze_document_with_textract(selected_file)

                # Extract key-value pairs from the Textract response
                key_value_pairs = extract_key_value_pairs(response)

                # Save the key-value pairs with confidence to 'key_value.txt'
                with open("key_value.txt", "w", encoding="utf-8") as kv_file:
                    for key, value_info in key_value_pairs.items():
                        kv_file.write(f"Key: {key}, Value: {value_info['Value']}, Confidence: {value_info['Confidence']:.2f}%\n")
                # Display success message
                st.success("Key-value pairs have been saved to 'key_value.txt'.")

                # Display the results together
                st.subheader("Results:")
                st.subheader("Raw Text Extraction:")
                st.text_area("Raw Text", raw_text, height=200)

                # Display the extracted key-value pairs
                if key_value_pairs:
                    st.subheader("Key-Value Extraction:")
                    for key, value_info in key_value_pairs.items():
                        st.write(f"**Key:** {key}, **Value:** {value_info['Value']}, **Confidence:** {value_info['Confidence']:.2f}%")
                else:
                    st.write("No key-value pairs found.")
