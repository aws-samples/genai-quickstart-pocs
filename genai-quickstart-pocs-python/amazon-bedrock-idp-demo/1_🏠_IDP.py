import os
import uuid
import tempfile
from io import BytesIO
import streamlit as st
from PIL import Image, ImageDraw
import boto3
from botocore.exceptions import ClientError
from PyPDF2 import PdfReader
import pdf2image
import json
import time
import pandas as pd
from urllib.parse import urlparse
import re
import numpy as np
from utils.helper_function import invoke_blueprint_recommendation_async,wait_for_completion,get_blueprint_recommendation
from utils.utils_streamlitApp import *
from dotenv import load_dotenv

load_dotenv()

# Constants
# Get config from environment variables
S3_BUCKET = os.environ.get("BUCKET_NAME")
BEDROCK_REGION = os.environ.get("region_name")
ACCOUNT_ID = os.environ.get("account_id")

image_path = "./assets/Banner_1.jpg"
site_icon=Image.open("./assets/IDP_Icon2.png")

st.set_page_config(layout="wide",page_icon=site_icon)

supported_listo_of_models = ['amazon.nova-pro-v1:0','amazon.nova-lite-v1:0','anthropic.claude-v2:1',
                             'anthropic.claude-3-sonnet-20240229-v1:0','anthropic.claude-3-haiku-20240307-v1:0',
                             'anthropic.claude-3-5-haiku-20241022-v1:0','anthropic.claude-3-5-sonnet-20241022-v2:0',
                             'cohere.command-text-v14','deepseek.r1-v1:0']

standard_output_config =  {
  "document": {
    "extraction": {
      "granularity": {"types": ["DOCUMENT","PAGE", "ELEMENT","LINE","WORD"]},
      "boundingBox": {"state": "ENABLED"}
    },
    "generativeField": {"state": "ENABLED"},
    "outputFormat": {
      "textFormat": {"types": ["PLAIN_TEXT", "MARKDOWN", "HTML", "CSV"]},
      "additionalFileFormat": {"state": "ENABLED"}
    }
  },
  "image": {
    "extraction": {
      "category": {
        "state": "ENABLED",
        "types": ["CONTENT_MODERATION","TEXT_DETECTION"]
      },
      "boundingBox": {"state": "ENABLED"}
    },
    "generativeField": {
      "state": "ENABLED",
      "types": ["IMAGE_SUMMARY","IAB"]
    }
  },
  "video": {
    "extraction": {
      "category": {
        "state": "ENABLED",
        "types": ['TEXT_DETECTION','TRANSCRIPT','LOGOS']
      },
      "boundingBox": {"state": "ENABLED"}
    },
    "generativeField": {
      "state": "ENABLED",
      "types": ['VIDEO_SUMMARY','CHAPTER_SUMMARY','IAB']
    }
  },
  "audio": {
    "extraction": {
      "category": {
        "state": "ENABLED",
        "types": ["AUDIO_CONTENT_MODERATION", "TOPIC_CONTENT_MODERATION", "TRANSCRIPT"]
      }
    },
    "generativeField": {
      "state": "ENABLED",
      "types": ['AUDIO_SUMMARY','TOPIC_SUMMARY','IAB']
    }
  }
}


# Initialize AWS clients
s3_client = boto3.client('s3')
bedrock_client = boto3.client('bedrock', region_name=BEDROCK_REGION)
bedrock_runtime = boto3.client('bedrock-runtime', region_name=BEDROCK_REGION)
bda_client = boto3.client('bedrock-data-automation')
bda_runtime_client = boto3.client('bedrock-data-automation-runtime')

# Initialize session state
if 'uploaded_file' not in st.session_state:
    st.session_state.uploaded_file = None
if 'file_key' not in st.session_state:
    st.session_state.file_key = None
if 'processing_job_id' not in st.session_state:
    st.session_state.processing_job_id = None
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []
if 'selected_llm' not in st.session_state:
    st.session_state.selected_llm = "anthropic.claude-v2"
if 'document_results' not in st.session_state:
    st.session_state.document_results = {}
if 'chat_messages' not in st.session_state:
    st.session_state.chat_messages = []
if 'fields' not in st.session_state:
    st.session_state.fields = []
if 'blueprint_arn' not in st.session_state:
    st.session_state.blueprint_arn = None
if 'creation_started' not in st.session_state:
    st.session_state.creation_started = False
if 'custom_config_flag' not in st.session_state:
    st.session_state.custom_config_flag = False
if 'batch_results' not in st.session_state:
    st.session_state.batch_results = None


def reset_application():
    """Reset all session state variables to their initial values"""
    st.session_state.uploaded_file = None
    st.session_state.file_key = None
    st.session_state.processing_job_id = None
    st.session_state.chat_history = []
    st.session_state.selected_llm = "anthropic.claude-v2"
    st.session_state.document_results = {}
    st.session_state.chat_messages = []
    st.rerun()


def display_file_preview(file, file_type):
    if file_type == "application/pdf":
        try:
            images = pdf2image.convert_from_bytes(file.read())
            file.seek(0)  # Reset file pointer after reading
            for i, image in enumerate(images):
                st.image(image, caption=f"Page {i+1}", use_container_width=True)
        except Exception as e:
            st.error(f"Error displaying PDF: {e}")
    elif file_type.startswith("image/"):
        try:
            image = Image.open(file)
            st.image(image, caption="Uploaded Image", use_container_width=True)
            file.seek(0)
        except Exception as e:
            st.error(f"Error displaying image: {e}")
    else:
        st.warning(f"Preview not available for {file_type} files")


# Utility Functions
def upload_to_s3(file, bucket, key):
    try:
        s3_client.upload_fileobj(file, bucket, key)
        return True
    except ClientError as e:
        st.error(f"Error uploading to S3: {e}")
        return False

def upload_multiple_to_s3(files, bucket, prefix="bda/input/"):
    uploaded_files = []
    progress_bar = st.progress(0)
    status_text = st.empty()
    
    for i, file in enumerate(files):
        file_key = f"{prefix}{file.name}"
        try:
            file.seek(0)
            s3_client.upload_fileobj(file, bucket, file_key)
            uploaded_files.append(f"s3://{bucket}/{file_key}")
            status_text.text(f"Uploaded {i+1}/{len(files)}: {file.name}")
            progress_bar.progress((i+1)/len(files))
        except Exception as e:
            st.error(f"Failed to upload {file.name}: {str(e)}")
    
    return uploaded_files

def display_data_section(data, title):
    """Display a data section with multiple viewing options"""
    st.subheader(title)
    
    if not data:
        st.warning("No data available")
        return
    
    # Create tabs for different views
    tab1, tab2, tab3 = st.tabs(["Table View", "Tree View", "Raw JSON"])
    
    with tab1:
        if isinstance(data, list):
            df = pd.DataFrame(data)
            st.dataframe(df)
        elif isinstance(data, dict):
            if all(isinstance(v, (str, int, float, bool)) for v in data.values()):
                st.table(pd.DataFrame([data]))
            else:
                for k, v in data.items():
                    with st.expander(k):
                        if isinstance(v, (list, dict)):
                            st.dataframe(pd.DataFrame(v if isinstance(v, list) else [v]))
                        else:
                            st.write(v)
    
    with tab2:
        st.json(data, expanded=False)  # Compact tree view
    
    with tab3:
        st.json(data)  # Full raw JSON



def parse_s3_uri(s3_uri):
    if not s3_uri.startswith('s3://'):
        raise ValueError("Invalid S3 URI")
    path_parts = s3_uri[5:].split('/', 1)
    bucket = path_parts[0]
    key = path_parts[1] if len(path_parts) > 1 else ""
    return bucket, key


def start_processing_job(project_arn, output_type, custom_blueprint=None):
    """
    Start a processing job within an existing Data Automation project
    """
    try:
        params = {
            "outputType": output_type
        }
        
        response = bedrock_client.start_data_automation_job(
            projectArn=project_arn,
            jobName=f"job-{uuid.uuid4().hex[:8]}",
            processingConfiguration=params
        )
        
        return response['jobId']
    except ClientError as e:
        st.error(f"Error starting processing job: {e}")
        return None
    

def get_s3_json_content(s3_uri):
    try:
        bucket, key = parse_s3_uri(s3_uri)
        response = s3_client.get_object(Bucket=bucket, Key=key)
        content = response['Body'].read().decode('utf-8')
        return json.loads(content)
    except Exception as e:
        st.error(f"Error accessing S3 content: {str(e)}")
        return None

def create_data_automation_project(project_name=None,blueprint_arn_list=None):
    """
    Create a Bedrock Data Automation project
    """
    if not project_name:
        project_name = f"doc-process-{uuid.uuid4().hex[:8]}"
    
    try:
        if st.session_state.custom_config_flag and blueprint_arn_list: # Custom Output Option is selected
            response = bda_client.create_data_automation_project(
                projectName=project_name,
                projectDescription="project to get our extended standard output",
                projectStage='LIVE',
                standardOutputConfiguration = standard_output_config,
                customOutputConfiguration = {
                    'blueprints': blueprint_arn_list
                    
                },
                overrideConfiguration={
                    'document': {
                        'splitter': {
                            'state': 'ENABLED'
                        }
                    }
                },
                tags=[
                    {
                        'key': 'created_by',
                        'value': 'streamlit_app'
                    },
                ]
            )
        else:
            response = bda_client.create_data_automation_project(
                projectName=project_name,
                projectDescription="project to get our extended standard output",
                projectStage='LIVE',
                standardOutputConfiguration = standard_output_config,
                tags=[
                    {
                        'key': 'created_by',
                        'value': 'streamlit_app'
                    },
                ]
            )
        

        return response['projectArn']
    except ClientError as e:
        st.error(f"Error creating Data Automation project: {e}")
        return None

def invoke_data_automation_async(project_arn, input_config, output_config):
    """
    Invoke a Bedrock Data Automation job asynchronously
    """
    print("Invoking Data Automation Job")
    #print("Project ARN - {}".format(project_arn))
    #print("Input Config - {}".format(input_config))
    #print("Output Config - {}".format(output_config))
    bda_s3_output_location = f's3://{S3_BUCKET}/bda/output'
    try:
        response = bda_runtime_client.invoke_data_automation_async(
            #projectArn=project_arn,
            inputConfiguration=input_config,
            outputConfiguration= {
                's3Uri': bda_s3_output_location
            },
            #processingConfig=processing_config,
            #clientRequestToken=str(uuid.uuid4()),  # Ensures idempotency
            dataAutomationConfiguration = {
                    'dataAutomationProjectArn': project_arn,
                    'stage': 'LIVE'
                },
            dataAutomationProfileArn=f"arn:aws:bedrock:{BEDROCK_REGION}:{ACCOUNT_ID}:data-automation-profile/us.data-automation-v1"            
        )
        return response['invocationArn']
    except ClientError as e:
        st.error(f"Error invoking Data Automation job: {e}")
        return None


# Function to wait for BDA Invocation Aync Job to complete
def wait_for_job_to_complete(invocationArn):
    get_status_response = bda_runtime_client.get_data_automation_status(
         invocationArn=invocationArn)
    status = get_status_response['status']
    job_id = invocationArn.split('/')[-1]
    max_iterations = 60
    iteration_count = 0
    while status not in ['Success', 'ServiceError', 'ClientError']:
        print(f'Waiting for Job to Complete. Current status is {status}')
        time.sleep(10)
        iteration_count += 1
        if iteration_count >= max_iterations:
            print(f"Maximum number of iterations ({max_iterations}) reached. Breaking the loop.")
            break
        get_status_response = bda_runtime_client.get_data_automation_status(
         invocationArn=invocationArn)
        status = get_status_response['status']
    if iteration_count >= max_iterations:
        raise Exception("Job did not complete within the expected time frame.")
    else:
        print(f"Invocation Job with id {job_id} completed. Status is {status}")

    #return get_status_response
    return get_status_response['status'], get_status_response.get('statusMessage', '')


def get_data_automation_status(invocation_arn, job_id):
    """
    Check the status of a Bedrock Data Automation job
    """
    try:
        response = bda_runtime_client.get_data_automation_status(
            invocationArn=invocation_arn
            #jobId=job_id
        )
        return response['status'], response.get('statusMessage', '')
    except ClientError as e:
        st.error(f"Error checking job status: {e}")
        return "FAILED", str(e)


def get_data_automation_results(project_arn, job_id):
    """
    Retrieve the results of a completed Data Automation job
    """
    try:
        response = bedrock_client.get_data_automation_results(
            projectArn=project_arn,
            jobId=job_id
        )
        
        # Download results from S3
        output_uri = response['outputS3Uri']
        bucket, key = parse_s3_uri(output_uri)
        
        with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
            s3_client.download_fileobj(bucket, key, tmp_file)
            tmp_file.seek(0)
            content = tmp_file.read().decode('utf-8')
        
        return json.loads(content)
    except ClientError as e:
        st.error(f"Error getting results: {e}")
        return None
    
def create_batch_job(project_arn, input_uris, output_prefix):
    """Create a batch processing job for multiple files"""
    job_arns = []
    progress_text = "Batch upload in progress. Please wait."
    progress_bar = st.progress(0,text=progress_text)
    
    status_text = st.empty()

    for i,input_uri in enumerate(input_uris):
        try:
            status_text.text(f"Creating job {i+1}/{len(input_uris)}: {os.path.basename(input_uri)}")

            response = bda_runtime_client.invoke_data_automation_async(
                inputConfiguration={"s3Uri": input_uri},
                outputConfiguration={"s3Uri": output_prefix},
                dataAutomationConfiguration={
                    "dataAutomationProjectArn": project_arn,
                    "stage": "LIVE"
                },
                dataAutomationProfileArn=f"arn:aws:bedrock:{BEDROCK_REGION}:{ACCOUNT_ID}:data-automation-profile/us.data-automation-v1"
            )
            job_arns.append(response['invocationArn'])
            #progress_bar.progress((i+1)/len(input_uris))

            status_text.text(f"Created job {i+1}/{len(input_uris)}")
            progress_bar.progress((i+1)/len(input_uris),text=progress_text)
        except ClientError as e:
            st.error(f"Error creating batch job: {e}")
    return job_arns
        

    

def aggregate_results(output_prefix):
    """Combine results from multiple processed files"""
    all_results = []
    
    try:
        # List all result files in the output prefix
        prefix = output_prefix.replace(f"s3://{S3_BUCKET}/", "")
        objects = s3_client.list_objects_v2(Bucket=S3_BUCKET, Prefix=prefix)
        
        for obj in objects.get('Contents', []):
            if obj['Key'].endswith('.json'):
                # Download and parse each result file
                response = s3_client.get_object(Bucket=S3_BUCKET, Key=obj['Key'])
                content = response['Body'].read().decode('utf-8')
                result = json.loads(content)
                
                # Extract document name from S3 key
                doc_name = os.path.basename(obj['Key']).split('_results')[0]
                
                # Transform to grid format
                is_custom = 'matched_blueprint' in result
                grid_data = transform_to_grid(result, is_custom, doc_name)
                all_results.extend(grid_data)
                
    except Exception as e:
        st.error(f"Error aggregating results: {str(e)}")
    
    return all_results


def monitor_data_automation_job(invocation_arn, job_id):
    status = "InProgress"
    progress_bar = st.progress(0)
    status_placeholder = st.empty()
    max_iterations = 60
    iteration_count = 0
    
    while status not in ['Success', 'ServiceError', 'ClientError']:
        time.sleep(10)
        iteration_count += 1
        if iteration_count >= max_iterations:
            break
        
        get_status_response = bda_runtime_client.get_data_automation_status(
            invocationArn=invocation_arn
        )
        status = get_status_response['status']
        status_placeholder.markdown(f"**Status:** {status}")
        progress_bar.progress(min(iteration_count/max_iterations, 0.95))
    
    progress_bar.progress(1.0)
    return status, "", get_status_response

def fetch_blueprint_recommendation(input_uri):
    """Get recommended blueprint for a document"""
    try:
        payload = {
            "inputDataConfiguration":{
                "s3Uri":f'{input_uri}'
            },
            "dataAutomationProfileArn":f"arn:aws:bedrock:{BEDROCK_REGION}:{ACCOUNT_ID}:data-automation-profile/us.data-automation-v1"
        }
        response = invoke_blueprint_recommendation_async(bda_client,BEDROCK_REGION, json.dumps(payload))
       

        return response['jobId']
    except ClientError as e:
        st.error(f"Error getting blueprint recommendation: {e}")
        return None
    

def check_blueprint_recommendation(job_id):
    """Check recommendation results"""
    try:

        status_response = wait_for_completion(
            client=None,
            get_status_function=get_blueprint_recommendation,
            status_kwargs={
                'bda_client': bda_client,
                'job_id': job_id,
                'region_name': BEDROCK_REGION,
                'credentials': boto3.Session().get_credentials().get_frozen_credentials(),
            },
            completion_states=['Completed'],
            error_states=['ClientError', 'ServiceError'],
            status_path_in_response='status',
            max_iterations=15,
            delay=30
        )

        blueprint_recommendation = next((result for result in status_response['results'] if result['type'] == 'BLUEPRINT_RECOMMENDATION'),None)
        recommended_blueprint_info = blueprint_recommendation['blueprintRecommendation']
        return recommended_blueprint_info['matchedBlueprint']['blueprintArn']

        
    except ClientError as e:
        st.error(f"Error checking recommendation: {e}")
        return None
    
def check_job_status(job_id):
    try:
        response = bedrock_client.get_document_processing_job(jobId=job_id)
        return response['status']
    except ClientError as e:
        st.error(f"Error checking job status: {e}")
        return "FAILED"

def get_processed_results(job_id):
    try:
        response = bedrock_client.get_document_processing_job(jobId=job_id)
        output_uri = response['outputS3Uri']
        
        # Extract the key from the S3 URI
        key = output_uri.replace(f"s3://{S3_BUCKET}/", "")
        
        # Download the result
        with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
            s3_client.download_fileobj(S3_BUCKET, key, tmp_file)
            tmp_file.seek(0)
            content = tmp_file.read().decode('utf-8')
        
        return json.loads(content)
    except ClientError as e:
        st.error(f"Error getting results: {e}")
        return None


def clear_chat_history():
    # Clear chat button with confirmation          
    st.session_state.chat_messages = []
    st.rerun()
    

def query_llm(prompt, context=None):
    """
    Enhanced LLM query function using Bedrock Converse API with:
    1. Proper message sequence starting with user message
    2. Streaming support
    3. Conversation history integration
    4. Response metadata tracking
    """
    try:
        model_id = st.session_state.selected_llm
        
        # Prepare conversation history - MUST start with user message
        messages = []
        
        # Add document context as first user message if provided
        if context:
            messages.append({
                "role": "user",  # Must be user role for first message
                "content": [{"text": f"Document context:\n{context}"}]
            })
        
        # Add previous conversation history (last 3 exchanges to avoid token limit)
        if "chat_messages" in st.session_state:

            #for msg in st.session_state.chat_messages[-6:]:  # Keep last 3 back-and-forths
            for msg in reversed(st.session_state.chat_messages):  # Keep last 3 back-and-forths
                # Skip any system messages (not allowed in Converse API)
                if msg["role"] in ["user", "assistant"]:
                    messages.append({
                        "role": msg["role"],
                        "content": [{"text": msg["content"]}]
                    })
        
        # Add current user prompt (will always be user role)
        messages.append({
            "role": "user",
            "content": [{"text": prompt}]
        })
        
        # Configuration for the conversation
        config = {
            "temperature": 0.5,
            "topP": 0.9,
            "maxTokens": 2048
        }
        
        # System prompt must be properly formatted
        system_prompt = [{"text": "You are a helpful document analysis assistant. Provide accurate answers based on the given context."}]
        
        # Initialize response container and metrics
        response_container = st.empty()
        full_response = ""
        usage_metrics = {}
        
        # Check if streaming is available for this model
        if "claude" in model_id.lower():  # Claude models support streaming
            try:
                response = bedrock_runtime.converse_stream(
                    modelId=model_id,
                    messages=messages,
                    system=system_prompt,
                    inferenceConfig=config
                )

                # Process streaming response
                for chunk in response["stream"]:

                    if "contentBlockDelta" in chunk:
                        text = chunk["contentBlockDelta"]["delta"]["text"]
                        full_response += text
                        response_container.markdown(full_response + "▌")
                    
                    if "metadata" in chunk:
                        usage_metrics = {
                            'input_tokens': chunk['metadata']['usage']['inputTokens'],
                            'output_tokens': chunk['metadata']['usage']['outputTokens'],
                            'total_tokens': chunk['metadata']['usage']['totalTokens']
                        }
                
                # Remove the cursor and display final response
                #####response_container.markdown(full_response) - Removed by Anand
                
            except bedrock_runtime.exceptions.ValidationException as e:
                st.error(f"Invalid message sequence: {e}")
                return None
                
        else:
            # Fallback to regular converse for non-streaming models
            try:
                response = bedrock_runtime.converse(
                    modelId=model_id,
                    messages=messages,
                    system=system_prompt,
                    inferenceConfig=config
                )
                
                if response.get('output'):
                    full_response = response['output']['message']['content'][0]['text']
                    ######response_container.markdown(full_response)
                
                if response.get('usage'):
                    usage_metrics = {
                        'input_tokens': response['usage']['inputTokens'],
                        'output_tokens': response['usage']['outputTokens'],
                        'total_tokens': response['usage']['totalTokens']
                    }
                    
            except bedrock_runtime.exceptions.ValidationException as e:
                st.error(f"Invalid message sequence: {e}")
                return None
        
        # Display usage metrics in sidebar
        if usage_metrics:
            with st.sidebar.expander("🔍 API Usage Metrics"):
                cols = st.columns(3)
                cols[0].metric("Input Tokens", usage_metrics.get('input_tokens', 0))
                cols[1].metric("Output Tokens", usage_metrics.get('output_tokens', 0))
                cols[2].metric("Total Tokens", usage_metrics.get('total_tokens', 0))
                st.caption(f"Model: {model_id}")
                st.caption(f"Last query: {prompt[:50]}...")
        
        return full_response if full_response else "No response generated"
    
    except ClientError as e:
        st.error(f"Error querying LLM: {e}")
        return None
    except Exception as e:
        st.error(f"Unexpected error: {e}")
        return None


with st.sidebar:
    st.header("Application Controls")
    if st.button("🔄 Reset Application", help="Clear all data and start fresh"):
        reset_application()





def extract_structured_context(document_data):

    """
    Extract and format relevant context from processed document data
    """
    context_parts = []
    
    def extract_text_content(data):
        """ Recursively extract content with key='text' """
        if isinstance(data, dict):
            for k, v in data['document']['representation'].items():
                # check if this is a key-pair with key='text'
                if k == "text":
                    return v # Extract the context for Key="text"

                # Otherwise recursively process dictionary values
                text_parts = []
                for value in data.values():
                    extracted = extract_text_content(value)
                    if extracted:
                        text_parts.append(extracted)

                return "\n".join(text_parts) if text_parts else None
            
        else:
            # Process each item in the list
            text_parts = []
            for item in data:
                extracted = extract_text_content(item)
                if extracted:
                    text_parts.append(extracted)
            return "\n".join(text_parts) if text_parts else None
        
    # Extract all text content
    text_content = extract_text_content(document_data)

    if text_content:
        context_parts.append(text_content)
    
    return "\n".join(context_parts) if context_parts else "No context found"

def generate_contextual_response(user_query,context_data):
    """
    Generate a response based on the processed document content
    """
    # Get the processed document results from session state
    #document_data = st.session_state.get('document_results', {})
    
    if not context_data:
        return "No document data available. Please process a document first."
    
    try:
        # Prepare context from document results
        #context = extract_structured_context(document_data)
        
        # Create the prompt for the LLM
        prompt = f"""
        You are a helpful assistant analyzing processed document data. When referencing the text from the document, pls use this format:
        [REFERENCE]: "exact text from the document"

        The user has asked: {user_query}
        
        Here is the document context:
        {context_data}
        
        Please provide:
        1. A concise, accurate answer based on the document
        2. Relevant excerpts or data points that support your answer
        3. If the information isn't available, clearly state that
        
        Format your response with clear section headings.
        """
        
        # Call Bedrock LLM
        response = query_llm(prompt)
        
        return response if response else "Sorry, I couldn't generate a response."
    
    except Exception as e:
        st.error(f"Error generating response: {e}")
        return "An error occurred while processing your request."

## Functions meant for Tab2
def create_blueprint(client, blueprint_name, description, schema_content):
    try:
        response = client.create_blueprint(
            blueprintName=blueprint_name,
            type='DOCUMENT',
            blueprintStage='LIVE',
            schema=json.dumps(schema_content))
        return response['blueprint']['blueprintArn']
    except Exception as e:
        st.error(f"Error creating blueprint: {str(e)}")
        return None

def blueprint_exists(client, blueprint_name):
    try:
        response = client.list_blueprints()
        return any(bp['blueprintName'] == blueprint_name for bp in response.get('blueprints', []))
    except Exception as e:
        st.error(f"Error checking for existing blueprints: {str(e)}")
        return False

def get_blueprint_details(client, blueprint_arn):
    try:
        response = client.get_blueprint(blueprintArn=blueprint_arn)

        return {
            'blueprintArn': response['blueprint']['blueprintArn'],
            'blueprintName': response['blueprint']['blueprintName'],
            'blueprintStage': response['blueprint']['blueprintStage'],
            'creationTime': response['blueprint']['creationTime'],
            'type': response['blueprint']['creationTime']
        }
    except Exception as e:
        st.error(f"Error getting blueprint details: {str(e)}")
        return None

### Functions defined for Bounding box visualization
def extract_bounding_boxes(document_data):
    #print(document_data)
    """Extract all bounding box information from processed document results"""
    bounding_boxes = []

    if 'elements' in document_data:

        for element in document_data['elements']:

            if "locations" in element and "representation" in element:

                for location in element["locations"]:
                    if 'bounding_box' in location:
                        bounding_boxes.append({
                            'box': location['bounding_box'],
                            'text': element["representation"].get('text', ''),
                            'page': element.get('pageNumber', 1)
                        })
    return bounding_boxes


# function to visualize bounding boxes on document pages:
def visualize_bounding_boxes(page_image, boxes, page_number):
    """Draw bounding boxes on a document page image"""
   
    draw = ImageDraw.Draw(page_image)
    for box in boxes:
        if box['page'] == page_number:
            # Convert normalized coordinates to pixel coordinates
            width, height = page_image.size
            points = [
                (box['box']['left'] * width, box['box']['top'] * height),
                (box['box']['left'] * width + box['box']['width'] * width, 
                 box['box']['top'] * height + box['box']['height'] * height)
            ]
            draw.rectangle(points, outline="red", width=3)
            # Add text label near the box
            draw.text(
                (points[0][0], points[0][1] - 15),
                box['text'][:30] + "..." if len(box['text']) > 30 else box['text'],
                fill="red"
            )
    return page_image


def draw_bounding_boxes(image, boxes, page_number=1):
    """Draw bounding boxes on an image with proper coordinate handling"""
    try:
        # Convert to RGB if needed (for PNG/JPG compatibility)
        if image.mode != 'RGB':
            image = image.convert('RGB')
            
        draw = ImageDraw.Draw(image)
        
        for box in boxes:
            if box.get('page', 1) == page_number:
                # Get bounding box coordinates
                left = box['box']['left'] * image.width
                top = box['box']['top'] * image.height
                width = box['box']['width'] * image.width
                height = box['box']['height'] * image.height
                
                # Define rectangle coordinates
                rect = [
                    (left, top),
                    (left + width, top + height)
                ]
                
                # Draw rectangle
                draw.rectangle(rect, outline="red", width=3)
                
                # Optional: Add text label
                text = box.get('text', '')[:20] + "..." if len(box.get('text', '')) > 20 else box.get('text', '')
                draw.text((left, top - 15), text, fill="red")
                
        return image
    except Exception as e:
        st.error(f"Error drawing boxes: {str(e)}")
        return image

def display_annotated_document(uploaded_file, relevant_boxes):
    """Display document with bounding boxes in Streamlit"""
    try:
        if uploaded_file.type == "application/pdf":
            images = pdf2image.convert_from_bytes(
                uploaded_file.read(),
                dpi=300,  # Higher resolution for better clarity
                fmt='jpeg'
            )
            uploaded_file.seek(0)  # Reset file pointer
            
            for i, image in enumerate(images):
                page_num = i + 1
                page_boxes = [b for b in relevant_boxes if b.get('page', 1) == page_num]
                
                if page_boxes:
                    annotated_img = draw_bounding_boxes(image, page_boxes, page_num)
                    st.image(annotated_img, caption=f"Page {page_num}", use_container_width=True)
        
        elif uploaded_file.type.startswith("image/"):
            image = Image.open(uploaded_file)
            annotated_img = draw_bounding_boxes(image, relevant_boxes)
            st.image(annotated_img, caption="Annotated Document", use_container_width=True)
            uploaded_file.seek(0)
            
    except Exception as e:
        st.error(f"Document display error: {str(e)}")



def transform_to_grid(data, is_custom_output=False, document_name=None):
    """
    Enhanced to include both parent fields and leaf nodes with confidence scores
    - Preserves hierarchical relationships
    - Includes parent fields in output
    - Properly associates confidence scores with leaf nodes
    """
    grid_data = []

    def extract_fields(field_path, inference_data, explain_data):
        """Recursively extract fields with hierarchy preservation"""
        results = []
        
        if isinstance(inference_data, dict):
            # Add parent field entry (without confidence if it's a container)
            parent_entry = {
                'field_path': field_path,
                'value': str(inference_data) if field_path else None,
                'confidence': None,
                'is_parent': True
            }
            if field_path:  # Don't add root container
                results.append(parent_entry)
            
            # Process child fields
            for field_name, field_value in inference_data.items():
                new_path = f"{field_path}.{field_name}" if field_path else field_name
                exp_data = explain_data.get(field_name, {}) if isinstance(explain_data, dict) else {}
                
                if isinstance(field_value, dict):
                    # Nested field - recurse
                    results.extend(extract_fields(new_path, field_value, exp_data))
                else:
                    # Leaf node - get confidence
                    conf = None
                    if isinstance(exp_data, dict):
                        conf = exp_data.get('confidence', exp_data.get('confidence_score'))
                    elif isinstance(exp_data, (int, float)):
                        conf = exp_data
                    
                    results.append({
                        'field_path': new_path,
                        'value': field_value,
                        'confidence': conf * 100 if conf is not None else None,
                        'is_parent': False
                    })
        
        elif isinstance(inference_data, list):
            # Handle lists with index tracking
            exp_list = explain_data if isinstance(explain_data, list) else []
            for i, (item, exp_item) in enumerate(zip(inference_data, exp_list)):
                new_path = f"{field_path}[{i}]" if field_path else f"[{i}]"
                results.extend(extract_fields(new_path, item, exp_item))
        
        return results

    if is_custom_output and isinstance(data, dict) and 'matched_blueprint' in data:
        blueprint_name = data['matched_blueprint']['name']
        inference_result = data['inference_result']
        #explainability = data['explainability_info']
        explainability = data.get('explainability_info', [{}])[0]

        base_record = {
            'document_name': document_name,
            'blueprint': blueprint_name,
            'processing_type': 'Custom Blueprint'
        }

        # Process all fields while preserving hierarchy
        field_results = extract_fields('', inference_result, explainability)
        
        for result in field_results:
            record = base_record.copy()
            record.update(result)
            grid_data.append(record)
    
    elif not is_custom_output:
        # Standard output processing (unchanged)
        def extract_elements(data):
            elements = []
            if isinstance(data, dict):
                if 'elements' in data:
                    for element in data['elements']:
                        if 'representation' in element and 'text' in element['representation']:
                            elements.append({
                                'document_name': document_name,
                                'text': element['representation']['text'],
                                'page': element.get('pageNumber', 1),
                                'type': element.get('type', 'UNKNOWN'),
                                'processing_type': 'Standard Output'
                            })
                for value in data.values():
                    elements.extend(extract_elements(value))
            elif isinstance(data, list):
                for item in data:
                    elements.extend(extract_elements(item))
            return elements
        
        grid_data = extract_elements(data)
    
    return grid_data

def transform_and_display(data, is_custom_output=False, document_name=None):
    #print(data)
    """
    Final solution that:
    1. Properly extracts nested fields with confidence scores
    2. Includes parent fields in hierarchy
    3. Handles Streamlit Arrow serialization
    4. Provides clean visual display
    """
    # First transform the data
    grid_data = []
    
    def extract_fields(field_path, inference_data, explain_data):
        results = []
        
        if isinstance(inference_data, dict):
            # Add parent field entry
            if field_path:  # Skip root container
                results.append({
                    'field_path': field_path,
                    'value': "(container)",
                    'confidence': None,
                    'is_parent': True
                })
            
            # Process children
            for field_name, field_value in inference_data.items():
                new_path = f"{field_path}.{field_name}" if field_path else field_name
                exp_data = explain_data.get(field_name, {}) if isinstance(explain_data, dict) else {}
                
                if isinstance(field_value, dict):
                    results.extend(extract_fields(new_path, field_value, exp_data))
                else:
                    conf = None
                    if isinstance(exp_data, dict):
                        conf = exp_data.get('confidence', exp_data.get('confidence_score'))
                    elif isinstance(exp_data, (int, float)):
                        conf = exp_data
                    
                    results.append({
                        'field_path': new_path,
                        'value': field_value,
                        'confidence': conf * 100 if conf is not None else None,
                        'is_parent': False
                    })
        
        elif isinstance(inference_data, list):
            exp_list = explain_data if isinstance(explain_data, list) else []
            for i, (item, exp_item) in enumerate(zip(inference_data, exp_list)):
                new_path = f"{field_path}[{i}]" if field_path else f"[{i}]"
                results.extend(extract_fields(new_path, item, exp_item))
        
        return results

    if is_custom_output and isinstance(data, dict) and 'matched_blueprint' in data:
        blueprint_name = data['matched_blueprint'].get('name', '')
        inference_result = data.get('inference_result', {})
        explainability = data.get('explainability_info', [{}])[0]
        

        field_results = extract_fields('', inference_result, explainability)
        grid_data = [{
            'document_name': document_name,
            'blueprint': blueprint_name,
            **result
        } for result in field_results]

    return grid_data



def process_job_metadata(metadata_uri):
    """Main processing function for job metadata"""
    with st.spinner(f"Loading job metadata from {metadata_uri}..."):
        metadata = get_s3_json_content(metadata_uri)
    
    if not metadata:
        st.error("Failed to load metadata")
        return
    
    # Display job overview
    st.success(f"✅ Successfully processed job {metadata.get('job_id', '')}")
    col1, col2, col3 = st.columns(3)
    col1.metric("Job Status", metadata.get('job_status', 'N/A'))
    col2.metric("Modality", metadata.get('semantic_modality', 'N/A'))
    col3.metric("Assets", len(metadata.get('output_metadata', [])))
    
    # Process each asset
    for asset in metadata.get('output_metadata', []):
        st.divider()
        asset_id = asset.get('asset_id', '')
        st.subheader(f"Asset {asset_id}")
        
        # Display input file info
        input_path = asset.get('asset_input_path', {})
        st.caption(f"Input: s3://{input_path.get('s3_bucket', '')}/{input_path.get('s3_key', '')}")
        
        # Process each segment
        for segment in asset.get('segment_metadata', []):
            # Standard Output
            std_output_uri = segment.get('standard_output_path')
            if std_output_uri:
                with st.spinner(f"Loading standard output from {std_output_uri}"):
                    std_output = get_s3_json_content(std_output_uri)
                    
                    # Add grid view tab
                    tab1, tab2 = st.tabs(["Structured View", "Grid View"])
                    
                    with tab1:
                        display_data_section(std_output, "Standard Output")
                    
                    with tab2:
                        grid_data = transform_to_grid(std_output, False)
                        if grid_data:
                            st.dataframe(pd.DataFrame(grid_data))
                        else:
                            st.warning("No grid data available")
                    
                    # Save this in session state
                    st.session_state.document_results = std_output
            
            # Custom Output (if available and matched)
            custom_output_uri = segment.get('custom_output_path')
            if custom_output_uri and segment.get('custom_output_status') == "MATCH":
                with st.spinner(f"Loading custom output from {custom_output_uri}"):
                    custom_output = get_s3_json_content(custom_output_uri)
                    
                    # Add grid view tab for custom output
                    tab1, tab2 = st.tabs(["Structured View", "Grid View"])
                    
                    with tab1:
                        display_data_section(custom_output, "Custom Output")
                    
                    with tab2:
                        document_name = os.path.basename(asset.get('asset_input_path', {}).get('s3_key', 'unknown'))
                        grid_data = transform_to_grid(custom_output, True, document_name)
                        
                        #print("Custom Output - {}".format(custom_output))
                        
                        if grid_data:
                            df = pd.DataFrame(grid_data)
                            
                            # Reorder columns: document info first, then fields, then confidence scores
                            cols_order = ['document_name', 'blueprint']
                            field_columns = [col for col in df.columns 
                                            if col not in cols_order 
                                            and not col.endswith('_confidence')]
                            confidence_columns = [col for col in df.columns if col.endswith('_confidence')]
                            
                            df = df[cols_order + field_columns + confidence_columns]
                            
                            # Configure the dataframe display
                            st.dataframe(
                                df,
                                use_container_width=True,
                                hide_index=True,
                                column_config={
                                    "document_name": st.column_config.TextColumn(
                                        "Document",
                                        help="Source document name",
                                        width="medium"
                                    ),
                                    "blueprint": st.column_config.TextColumn(
                                        "Blueprint",
                                        help="Custom blueprint used",
                                        width="small"
                                    ),
                                    **{
                                        col: st.column_config.NumberColumn(
                                            f"{col.replace('_confidence','')} Confidence",
                                            help=f"Confidence score for {col.replace('_confidence','')}",
                                            format="%.2f",
                                            min_value=0,
                                            max_value=1,
                                            width="small"
                                        )
                                        for col in confidence_columns
                                    }
                                }
                            )
                            
                            # Add visual indicators for confidence scores
                            st.markdown("**Confidence Score Legend:**")
                            col1, col2, col3 = st.columns(3)
                            col1.metric("High Confidence", "", delta="≥ 0.9", delta_color="normal")
                            col2.metric("Medium Confidence", "", delta="0.6 - 0.89", delta_color="off")
                            col3.metric("Low Confidence", "", delta="≤ 0.59", delta_color="inverse")
                            
                            # Add download button
                            csv = df.to_csv(index=False).encode('utf-8')
                            st.download_button(
                                label="Download as CSV",
                                data=csv,
                                file_name=f"{document_name}_extracted_data.csv",
                                mime="text/csv"
                            )
                        else:
                            st.warning("No blueprint-defined fields found in the custom output")

                    ####
            elif custom_output_uri:
                st.warning(f"Custom output available but status is {segment.get('custom_output_status', 'UNKNOWN')}")



# Main App
def main():
    display_banner(
        banner_path=image_path,
        caption="Intelligent Document Processing - Powered by Bedrock Data Automation"
    )
    contact_sidebar()
    
    tab1, tab2, tab3, tab4 = st.tabs(["Single Doc", "Custom Blueprints", "Chat with Document", "Batch Processing"])
    ###
    with tab1:
        st.header("Document Processing")
        
        # File upload section
        uploaded_file = st.file_uploader(
            "Upload a document (PDF, JPG, PNG)", 
            type=['pdf', 'jpg', 'jpeg', 'png']
        )
        
        if uploaded_file:
            st.session_state.uploaded_file = uploaded_file
            file_type = uploaded_file.type
            
            # Display file preview
            st.subheader("File Preview")
            display_file_preview(uploaded_file, file_type)
            
            # Save to S3 option
            st.subheader("Storage Options")
            save_to_s3 = st.checkbox("Save to S3 for future processing", value=True)
            
            if save_to_s3:
                # Generate unique S3 key
                file_ext = os.path.splitext(uploaded_file.name)[1]
                st.session_state.file_key = f"bda/input/{uploaded_file.name}"
                
                if st.button("Upload to S3"):
                    if upload_to_s3(uploaded_file, S3_BUCKET, st.session_state.file_key):
                        st.success(f"File uploaded to S3: {st.session_state.file_key}")
            
            # Processing options
            st.subheader("Processing Options")
            output_type = st.radio(
                "Select output type:",
                ("STANDARD", "CUSTOM"),
                horizontal=True
            )
            
            custom_blueprint = None
            custom_blueprint_configuration = []
            if output_type == "CUSTOM":
                try:
                    response = bda_client.list_blueprints()
                    custom_blueprints = [
                        bp for bp in response.get('blueprints', [])
                        if bp['blueprintName'].startswith('Custom_')
                    ]

                    if not custom_blueprints:
                        st.warning("No custom blueprints found. Please create one in the 'Custom Blueprints' tab firrst.")
                    
                    else:
                        # create a list of blueprint name from the dropdown
                        blueprint_options = [bp['blueprintName'] for bp in custom_blueprints]
                        selected_blueprint_name = st.selectbox(
                            "select a blueprint:",
                            options = blueprint_options
                        )

                        # get the arn of the selected blueprint
                        selected_bluprint = next(
                            bp for bp in custom_blueprints if bp['blueprintName'] == selected_blueprint_name
                        )

                        if selected_bluprint:
                            custom_blueprint_configuration = [{
                                'blueprintArn': selected_bluprint['blueprintArn']
                            }]
                            st.session_state.custom_config_flag = True
                except Exception as e:
                    st.error(f"Failed to fetch blueprint: {str(e)}")

            else:
                st.session_state.custom_config_flag  = False
            
            # Process document button
            if st.button("Process Document"):
                if not st.session_state.uploaded_file:
                    st.warning("Please upload a file first")
                else:
                    # If not saved to S3, upload temporarily
                    if not st.session_state.file_key:
                        temp_key = f"temp/{uuid.uuid4().hex}{os.path.splitext(uploaded_file.name)[1]}"
                        if upload_to_s3(uploaded_file, S3_BUCKET, temp_key):
                            st.session_state.file_key = temp_key
                        else:
                            st.error("Failed to upload file for processing")
                    
                    # Create S3 paths
                    s3_input_path = f"s3://{S3_BUCKET}/bda/input/{uploaded_file.name}"
                    s3_output_prefix = f"s3://{S3_BUCKET}/bda/outputs/"                        

                    # Prepare processing configuration
                    processing_config = {
                        "outputType": output_type
                    }

                    project_arn = create_data_automation_project(
                                project_name=f"doc-process-{uuid.uuid4().hex[:8]}",
                                blueprint_arn_list = custom_blueprint_configuration if st.session_state.custom_config_flag else None
                            )
                    print(f"Created Data Automation project: {project_arn}")
                    if project_arn:

                        invcation_arn = invoke_data_automation_async(
                                    project_arn=project_arn,
                                    input_config={"s3Uri": s3_input_path},
                                    output_config={"s3Uri": s3_output_prefix},
                                )

                        # Start the processing job

                        if invcation_arn:
                            st.success(f"Kicked off Data Automation Asynchronous job: {invcation_arn}")
                            job_id = invcation_arn.split('/')[-1]
                            # Monitor the Job
                            status, message,get_status_response = monitor_data_automation_job(invcation_arn, job_id)

                            metadata_uri = get_status_response['outputConfiguration']['s3Uri']
                            # Process the JOb Metadata File and Display the data
                            process_job_metadata(metadata_uri)

                            


    with tab2:
        st.header("Manage Custom Blueprints")
        # Create new blueprint
        st.subheader("Create New Blueprint")
        ####
        # Blueprint Configuration Form at the TOP
        with st.expander("Blueprint Configuration", expanded=True):
            with st.form("blueprint_config_form"):
                blueprint_name = st.text_input("Blueprint Name*", "Custom_MySimpleBlueprint")
                if not blueprint_name.startswith("Custom_"):
                    blueprint_name = "Custom_" + blueprint_name
                description = st.text_area("Description", "A blueprint created with the simple form")
                st.form_submit_button("Save Configuration")

        # Field entry form BELOW configuration
        with st.expander("Add Fields to Blueprint", expanded=True):
            with st.form("field_form"):
                col1, col2, col3 = st.columns([2, 1, 3])
                with col1:
                    field_name = st.text_input("Field Name*", placeholder="e.g., patient_name", key="field_name")
                with col2:
                    field_type = st.selectbox("Field Type*", ["string", "number", "boolean"], key="field_type")
                with col3:
                    inference_type = st.selectbox("Inference Type*", ["explicit", "inferred"], key="inference_type")
                
                instruction = st.text_input("Instruction*", 
                                        placeholder="e.g., The patient's full name",
                                        key="instruction")
                
                if st.form_submit_button("Add Field"):
                    if field_name and instruction:
                        st.session_state.fields.append({
                            "name": field_name,
                            "type": field_type,
                            "inference_type": inference_type,
                            "instruction": instruction
                        })
                        st.success("Field added!")
                    else:
                        st.error("Please fill all required fields (*)")

        # Display current fields
        if st.session_state.fields:
            st.subheader("Current Fields")
            for i, field in enumerate(st.session_state.fields):
                cols = st.columns([2, 1, 1, 4, 1])
                cols[0].write(field['name'])
                cols[1].write(field['type'])
                cols[2].write(field['inference_type'])
                cols[3].write(field['instruction'])
                if cols[4].button("❌", key=f"del_{i}"):
                    st.session_state.fields.pop(i)
                    st.rerun()

        # Create Blueprint button at the BOTTOM
        st.divider()
        if st.button("Create Blueprint and JSON File", type="primary"):
            if not blueprint_name or not st.session_state.fields:
                st.error("Please add at least one field and provide a blueprint name")
            else:
                # Build the JSON schema
                schema = {
                        "$schema": "http://json-schema.org/draft-07/schema#",
                        "class": blueprint_name,
                        "description": description,
                        "properties": {},
                    }
                
                for field in st.session_state.fields:
                    schema["properties"][field['name']] = {
                        "type": field['type'],
                        "inferenceType": field['inference_type'],
                        "instruction": field['instruction']
                    }
                

                
                # Save the schema to session state
                st.session_state.schema_content = schema
                
                if blueprint_exists(bda_client, blueprint_name):
                    st.error(f"Blueprint '{blueprint_name}' already exists. Please choose a different name.")
                else:
                    # Create blueprint
                    blueprint_arn = create_blueprint(
                        bda_client,
                        blueprint_name,
                        description,
                        schema
                    )
                    
                    if blueprint_arn:
                        st.session_state.blueprint_arn = blueprint_arn
                        st.session_state.creation_started = True
                        st.session_state.blueprint_name = blueprint_name
                        st.success("Blueprint created successfully!")
                    else:
                        st.error("Failed to create blueprint")

        # Display results
        if st.session_state.get('schema_content'):
            st.divider()
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.subheader("Generated JSON Schema")
                st.json(st.session_state.schema_content)
                
                # Download JSON button
                json_str = json.dumps(st.session_state.schema_content, indent=2)
                st.download_button(
                    label="Download JSON Schema",
                    data=json_str,
                    file_name=f"{blueprint_name}_schema.json",
                    mime="application/json"
                )
            
            with col2:
                if st.session_state.creation_started and st.session_state.blueprint_arn:
                    st.subheader("Blueprint Details")
                    details = get_blueprint_details(bda_client, st.session_state.blueprint_arn)
                    
                    if details:
                        st.json({
                            "Blueprint ARN": details['blueprintArn'],
                            "Name": details['blueprintName'],
                            "Stage": details['blueprintStage'],
                            "Creation Time": details['creationTime'].strftime("%Y-%m-%d %H:%M:%S"),
                            "Type": details['type']
                        })
                    else:
                        st.error("Could not retrieve blueprint details")

        #####
    with tab3:
        #initialize_state_vrariables()
        st.header("Chat with Document")
        # Check if we have processed results
        if not st.session_state.get('document_results'):
            st.warning("Please process a document first in the Document Processing tab")
        else:
            # --- Enhanced Model Selection Section ---
            col1, col2 = st.columns([1,2])

            with col1:
                # Model Provider selection
                model_provider = st.selectbox(
                    "**Model Provider**",
                    options=[
                        {"label": "Anthropic", "value": "Anthropic"},
                        {"label": "Amazon", "value": "Amazon"}, 
                        {"label": "Cohere", "value": "Cohere"},
                        {"label": "DeepSeek", "value": "Deepseek"}
                    ],
                    format_func=lambda x: x["label"],
                    index=0,
                    key="model_provider"
                )
                provider_value = model_provider["value"]  # Get the actual value

                # Workflow Overview
                with st.expander("🔍 :blue[How This Works]", expanded=True):
                    st.markdown("""
                    **1. :red[Upload]**  
                        ➔ PDF/Image/Text documents  
                    
                    **2. :red[Process]**  
                        ➔ Bedrock Data Automation extracts:  
                            • Text content  
                            • Structured data  
                            • Document metadata  
                    
                    **3. :red[Analyze]**  
                        ➔ Ask natural language questions  
                        ➔ Get AI-powered insights  
                    """)
                
                # Current Document Status
                if 'document_results' in st.session_state:
                    with st.expander("📄 :blue[Document Metrics]"):
                        meta = st.session_state.document_results.get('metadata', {})
                        cols = st.columns(2)
                        cols[0].metric("Pages", meta.get('page_count', 'N/A'))
                        cols[1].metric("Assets", len(meta.get('assets', [])))
                        st.caption(f"Processed: {time.strftime('%Y-%m-%d %H:%M')}")
                
                # Quick Tips
                with st.expander("💡 :blue[Pro Tips]"):
                    st.markdown("""
                    - For tables: "Extract all financial data"  
                    - For dates: "Find important deadlines"  
                    - For summaries: "Key points in bullet points"  
                    - Compare: "How does this differ from [doc]?"
                    """)
                
                with st.expander("⚙️ :blue[Technical Specs]"):
                    st.markdown("""
                    - **AWS Services Used**:  
                        - Amazon Bedrock 
                        - S3 Storage  
                        - Bedrock Data Automation  
                    
                    - **Supported Models**:  
                        - Claude 3 Family  
                        - Amazon Nova  
                        - Cohere Command
                        - DeepSeek
                                
                    
                    - **Max Document Size**: 50MB
                    """)           


            with col2:
                # Model selection based on provider
                #available_models = list_available_llms()
                available_models = supported_listo_of_models
                #print("Available Models - {}".format(available_models))
                if provider_value.lower() == "amazon":
                    filtered_models = [
                        m for m in available_models 
                        if provider_value.lower() in m.lower() and 'nova' in m.lower()
                    ]
                elif provider_value.lower() == "anthropic":
                    filtered_models = [
                        m for m in available_models
                        if provider_value.lower() in m.lower() and 'claude-3' in m.lower()
                    ]
                elif provider_value.lower() == "cohere":
                    filtered_models = [
                        m for m in available_models
                        if provider_value.lower() in m.lower() and 'cohere' in m.lower()
                    ]
                else:
                    filtered_models = [
                        m for m in available_models
                        if provider_value.lower() in m.lower() and 'deepseek' in m.lower()
                    ]


                model_info = {
                    "anthropic.claude-3-5-sonnet-20241022-v2:0": "Most capable Claude model",
                    "anthropic.claude-v2:1": "features double the context window, plus improvements across reliability, hallucination rates, and evidence-based accuracy in long document and RAG contexts",
                    "deepseek.r1-v1:0": "state-of-the-art reasoning model, optimized for general reasoning tasks",
                    "anthropic.claude-3-haiku-20240307-v1:0": "Anthropic's fastest, most compact model for near-instant responsiveness",
                    "cohere.command-text-v14": "Cohere's flagship text generation model.",
                    "amazon.nova-lite-v1:0": "multimodal understanding foundation model",
                    "amazon.nova-pro-v1:0": "Nova Pro is a multimodal understanding foundation model. It is multilingual and can reason over text, images and videos"
                }
                
                selected_model = st.selectbox(
                    "**Model ID**",
                    options=filtered_models,
                    #format_func=lambda x: f"{x} ({model_info.get(x, 'No description available')}",
                    index=0,
                    key="model_id_select"
                )

                if 'deepseek' in selected_model or "claude-3" in selected_model:
                    selected_model = "us."+ selected_model
                
                st.session_state.selected_llm = selected_model

                # Add model capabilities inforamtion
                with st.expander("ℹ️ Model Capabilities"):
                    st.markdown(f"""
                    **Selected Model:** `{selected_model}`  
                    **Best For:** {model_info.get(selected_model, "General document analysis")}
                    
                    | Capability       | Support Level |
                    |-----------------|---------------|
                    | Document Q&A    | ⭐⭐⭐⭐⭐       |
                    | Text Generation | ⭐⭐⭐⭐        |
                    | Summarization   | ⭐⭐⭐⭐⭐       |
                    | Data Extraction | ⭐⭐⭐         |
                    """)

                # --- Chat Interface ---
                st.divider()
                st.subheader("Chat Interface")

                # Clear chat button with confirmation          
                if st.button("🗑️ Clear Chat History", help="Start a new conversation"):
                    clear_chat_history()
            
                # Display chat messages
                for message in st.session_state.chat_messages:
                    avatar = "🕵️" if message["role"] == "assistant" else "👤"
                    with st.chat_message(message["role"],avatar=avatar):
                        st.markdown(message["content"])

                
                # Chat input with prompt suggestions
                if prompt := st.chat_input("Ask about the document..."):
                    # Add user message to chat history

                    st.session_state.chat_messages.append({"role": "user", "content": prompt})

                    
                    # Display user message
                    with st.chat_message("user",avatar="👤"):
                        st.markdown(prompt)
                    
                    # Prepare context from document results
                    context = extract_structured_context(st.session_state.document_results)

                    # Generate assistant response
                    with st.chat_message("assistant", avatar="🕵️"):
                        with st.spinner(f"Analyzing with {selected_model}..."):
                            response = generate_contextual_response(prompt,context)

                    #### New 
                    if response and st.session_state.uploaded_file:
                        st.markdown(response)
                        st.session_state.chat_history.append({"role": "assistant", "content": response})

                        # Improved text extraction from response - focuses on quoted text first
                        mentioned_texts = []
                        
                        # 1. First try to find quoted text (most likely direct references)
                        quoted_text = re.findall(r'"([^"]+)"', response)
                        if quoted_text:
                            mentioned_texts.extend(quoted_text)
                        
                        # 2. If no quotes, look for text after colons (but be more selective)
                        if not mentioned_texts:
                            for line in response.split('\n'):
                                if ':' in line and len(line.split(':')) > 1:
                                    text_part = line.split(':')[1].strip()
                                    # Only take substantial text that's likely a reference
                                    if len(text_part) > 10 and not text_part.endswith(('.', '!', '?')):
                                        mentioned_texts.append(text_part)
                                        break  # Just take the first good match
                        
                        # 3. If still nothing, look for key phrases
                        if not mentioned_texts:
                            key_phrases = ["refers to", "mentions", "according to", "states:"]
                            for phrase in key_phrases:
                                if phrase in response.lower():
                                    # Get the text after the key phrase
                                    start_idx = response.lower().find(phrase) + len(phrase)
                                    end_idx = min(start_idx + 50, len(response))  # Limit length
                                    context_text = response[start_idx:end_idx].strip()
                                    mentioned_texts.append(context_text.split('.')[0])  # Take up to first period
                                    break
                        
                        #print("Extracted mentioned texts:", mentioned_texts)
                        if mentioned_texts:
                            highlighted_response = response.replace(
                                mentioned_texts[0],
                                f"**{mentioned_texts[0]}**"
                            )
                            #st.markdown(highlighted_response, unsafe_allow_html=True)
                        
                        # Get all bounding boxes from document
                        all_boxes = extract_bounding_boxes(st.session_state.document_results)
                        
                        # Find boxes that match the mentioned text
                        relevant_boxes = []
                        if mentioned_texts:
                            # Use the first (most relevant) mentioned text
                            target_text = mentioned_texts[0].lower()
                            
                            # Clean the target text for better matching
                            target_text = re.sub(r'[^a-zA-Z0-9\s]', '', target_text).strip()
                            #print("Target text is - {}".format(target_text))
                            
                            # Find boxes containing this text
                            for box in all_boxes:
                                box_text = box.get('text', '').lower()
                                box_text = re.sub(r'[^a-zA-Z0-9\s]', '', box_text).strip()
                                
                                # More precise matching - require at least 5 consecutive matching words
                                target_words = target_text.split()
                                box_words = box_text.split()
                                
                                # Check if any sequence of words matches
                                match_found = False
                                for i in range(len(box_words) - len(target_words) + 1):

                                    if box_words[i:i+len(target_words)] == target_words:
                                        match_found = True
                                        break
                                
                                if match_found:
                                    relevant_boxes.append(box)
                                    break  # Only show first match per page
                        
                        print("Relevant boxes found:", len(relevant_boxes))
                        
                        if relevant_boxes:
                            with st.expander("🔍 View Document References"):
                                st.caption(f"Reference found on page {relevant_boxes[0].get('page',1)}")
                                display_annotated_document(st.session_state.uploaded_file, relevant_boxes)
                    #####

                        
                    else:
                        st.error("Failed to get response from LLM")    
    ###
    with tab4:
        st.header("📦 Batch Document Processing")
        
        uploaded_files = st.file_uploader(
            "Select documents (PDF/Images)",
            type=['pdf', 'jpg', 'jpeg', 'png'],
            accept_multiple_files=True
        )
        
        custom_bucket = st.text_input("Custom S3 Bucket", value="")
        ###
        # Section 2: Processing Configuration
        with st.expander("⚙️ Processing Configuration", expanded=True):
            output_type = st.radio(
                "Output Type:",
                ("STANDARD", "CUSTOM"),
                horizontal=True
            )
            
            custom_blueprint = None
            if output_type == "CUSTOM":
                try:
                    response = bda_client.list_blueprints()
                    custom_blueprints = [bp for bp in response.get('blueprints', []) if bp['blueprintName'].startswith('Custom_')]
                    
                    if custom_blueprints:
                        selected_blueprint = st.selectbox(
                            "Select Blueprint:",
                            options=[bp['blueprintName'] for bp in custom_blueprints]
                        )
                        custom_blueprint = next(bp for bp in custom_blueprints if bp['blueprintName'] == selected_blueprint)
                    else:
                        st.warning("No custom blueprints available")
                except Exception as e:
                    st.error(f"Error loading blueprints: {str(e)}")

        ###
        
        if st.button("🚀 Start Batch Processing", type="primary"):
            if not uploaded_files:
                st.warning("Please upload files first")
            else:
                with st.status("Processing...", expanded=True) as status:
                    # Upload files
                    target_bucket = custom_bucket if custom_bucket else S3_BUCKET
                    input_uris = upload_multiple_to_s3(uploaded_files, target_bucket)
                    
                    # Create project
                    project_arn = create_data_automation_project(
                        project_name=f"batch-{uuid.uuid4().hex[:8]}" # ,
                    )
                    output_prefix = f"s3://{target_bucket}/bda/output/batch/"
                    all_results = []
                    
                    for i, input_uri in enumerate(input_uris):
                        try:
                            # Get blueprint recommendation
                            payload = {
                                        "inputDataConfiguration":{
                                            "s3Uri":f'{input_uri}'
                                        },
                                        "dataAutomationProfileArn":f"arn:aws:bedrock:{BEDROCK_REGION}:{ACCOUNT_ID}:data-automation-profile/us.data-automation-v1"
                                    }
                            response = invoke_blueprint_recommendation_async(bda_client,BEDROCK_REGION, json.dumps(payload))
                            job_id = response['jobId']
                            status_response = wait_for_completion(
                                            client=None,
                                            get_status_function=get_blueprint_recommendation,
                                            status_kwargs={
                                                'bda_client': bda_client,
                                                'job_id': job_id,
                                                'region_name': BEDROCK_REGION,
                                                'credentials': boto3.Session().get_credentials().get_frozen_credentials(),
                                            },
                                            completion_states=['Completed'],
                                            error_states=['ClientError', 'ServiceError'],
                                            status_path_in_response='status',
                                            max_iterations=15,
                                            delay=30
                                )
                            blueprint_recommendation = next((result for result in status_response['results'] if result['type'] == 'BLUEPRINT_RECOMMENDATION'),None)
                            recommended_blueprint_info = blueprint_recommendation['blueprintRecommendation']
                            blueprint_arn = recommended_blueprint_info['matchedBlueprint']['blueprintArn']
                            print(blueprint_arn)

                            
                            # Process with recommended blueprint if found
                            if blueprint_arn:
                                print("Found Recommended Blueprint")
                                response = bda_runtime_client.invoke_data_automation_async(
                                    inputConfiguration={"s3Uri": input_uri},
                                    outputConfiguration={"s3Uri": f"{output_prefix}custom_{i}_"},
                                    dataAutomationProfileArn=f"arn:aws:bedrock:{BEDROCK_REGION}:{ACCOUNT_ID}:data-automation-profile/us.data-automation-v1",
                                    blueprints=[{
                                        "blueprintArn": blueprint_arn,
                                    }]
                                )
                                
                                # Monitor job
                                job_arn = response['invocationArn']
                                final_status, _, response = monitor_data_automation_job(job_arn, job_arn.split('/')[-1])
                                #print(response['outputConfiguration']['s3Uri'])
                                if final_status == "Success":
                                    metadata = get_s3_json_content(response['outputConfiguration']['s3Uri'])
                                    #print(metadata)
                                    if metadata and metadata.get('output_metadata'):
                                        for asset in metadata['output_metadata']:
                                            for segment in asset.get('segment_metadata', []):
                                                if segment.get('custom_output_status') == "MATCH":
                                                    result_uri = segment.get('custom_output_path')
                                                    if result_uri:
                                                        processed_content = get_s3_json_content(result_uri)
                                                        #print(processed_content)
                                                        if processed_content:
                                                            grid_data = transform_and_display(
                                                                    processed_content,
                                                                    is_custom_output=True,
                                                                    document_name=os.path.basename(input_uri)
                                                                )
                                                            print(grid_data)
                                                            all_results.extend(grid_data)
                                                            continue
                            
                            else:
                                # Standard processing fallback
                                response = bda_runtime_client.invoke_data_automation_async(
                                    inputConfiguration={"s3Uri": input_uri},
                                    outputConfiguration={"s3Uri": f"{output_prefix}standard_{i}_"},
                                    dataAutomationConfiguration={
                                        "dataAutomationProjectArn": project_arn,
                                        "stage": "LIVE"
                                    },
                                    dataAutomationProfileArn=f"arn:aws:bedrock:{BEDROCK_REGION}:{ACCOUNT_ID}:data-automation-profile/us.data-automation-v1"
                                )
                                
                                # Monitor job
                                job_arn = response['invocationArn']
                                final_status, _, response = monitor_data_automation_job(job_arn, job_arn.split('/')[-1])
                                
                                if final_status == "Success":
                                    metadata = get_s3_json_content(response['outputConfiguration']['s3Uri'])
                                    if metadata and metadata.get('output_metadata'):
                                        for asset in metadata['output_metadata']:
                                            for segment in asset.get('segment_metadata', []):
                                                result_uri = segment.get('standard_output_path')
                                                if result_uri:
                                                    processed_content = get_s3_json_content(result_uri)
                                                    if processed_content:
                                                        grid_data = transform_and_display(
                                                                    processed_content,
                                                                    is_custom_output=True,
                                                                    document_name=os.path.basename(input_uri)
                                                            )                                                        
                                                        
                                                        all_results.extend(grid_data)
                        
                        except Exception as e:
                            st.error(f"Failed to process {input_uri}: {str(e)}")
                    
                    if all_results:
                        st.session_state.batch_results = all_results
                        st.success(f"Processed {len(all_results)} records from {len(uploaded_files)} files")
                    else:
                        st.error("No results could be extracted")
        
        if 'batch_results' in st.session_state and st.session_state.batch_results:
            st.divider()
            st.subheader("📊 Extracted Data Results")
            df = pd.DataFrame(st.session_state.batch_results)
            df['value'] = df['value'].astype(str)
            df['confidence'] = pd.to_numeric(df['confidence'], errors='coerce')
            df['is_parent'] = df['is_parent'].astype(bool)            
            
            # Separate confidence scores
            confidence_cols = [col for col in df.columns if col.lower() == 'confidence']
            field_cols = [col for col in df.columns if not col.endswith('_confidence') and 
                         col not in ['document_name', 'blueprint']]
            
            # Create tabs
            tab1, tab2 = st.tabs(["Field Values", "Confidence Scores"])
            
            with tab1:
                #cols_to_show = ['document_name', 'processing_type'] + field_cols
                cols_to_show = ['document_name'] + field_cols
                if 'blueprint' in df.columns:
                    cols_to_show.insert(2, 'blueprint')
                
                st.dataframe(
                    df[cols_to_show],
                    use_container_width=True,
                    hide_index=True,
                    column_config={
                        "document_name": st.column_config.TextColumn("Document", width="medium"),
                        #"processing_type": st.column_config.TextColumn("Processing Type", width="small"),
                        "blueprint": st.column_config.TextColumn("Blueprint", width="medium")
                    }
                )
            
            with tab2:
                if confidence_cols:
                    confidence_df = df[['document_name'] + confidence_cols]
                    confidence_df = confidence_df.rename(columns={
                        col: col.replace('_confidence', '') for col in confidence_cols
                    })
                    ####
                    st.dataframe(
                              df,
                              column_config={
                                 "field_path": st.column_config.TextColumn(
                                    "Field Path",
                                    help="Full path to the field",
                                    width="medium"
                                 ),
                                 "value": st.column_config.TextColumn(
                                    "Value",
                                    width="large"
                                 ),
                                 "confidence": st.column_config.ProgressColumn(
                                    "Confidence",
                                    format="%.0f%%",
                                    min_value=0,
                                    max_value=100,
                                    width="medium"
                                 ),
                                 "is_parent": None  # Hide this column
                              },
                              hide_index=True,
                              use_container_width=True,
                              height=min(600, 35 * len(df))  # Reasonable default height
                           )                     
                                        
                    
                    st.bar_chart(confidence_df.drop(columns=['document_name']).mean())
                else:
                    st.warning("No confidence scores available")
            
            st.download_button(
                label="📥 Download All Results",
                data=df.to_csv(index=False).encode('utf-8'),
                file_name="extracted_data_results.csv",
                mime="text/csv"
            )

if __name__ == "__main__":
    main()