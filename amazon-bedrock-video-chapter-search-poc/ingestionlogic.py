import tomllib
import botocore
import boto3
import time
import botocore.exceptions
import requests
import json
import streamlit as st
import time
from langchain.text_splitter import CharacterTextSplitter #using for text splitter only
from thefuzz import fuzz
import pandas as pd
from opensearchpy import OpenSearch
from opensearchpy import RequestsHttpConnection, OpenSearch, AWSV4SignerAuth

with open("environment.toml", "rb") as f:
    env_config = tomllib.load(f)

if 'aws_profile_name' in env_config and len(env_config['aws_profile_name']) > 0:
    session = boto3.Session(profile_name=env_config['aws_profile_name'])
else:
    session = boto3.Session()


config = botocore.config.Config(connect_timeout=300, read_timeout=300)
bedrock = session.client('bedrock-runtime' , env_config["bedrock_region"], config = config)
s3 =session.client('s3')


#upload video to s3 (return object_key name)
def upload_to_s3(file, file_name):
    bucket=env_config['s3_bucket'] #Add your bucket name here (prototyping purposes only)
    object_key = file_name.strip()

    
    response = s3.upload_fileobj(file, bucket, object_key)
    print(response)

    return object_key

def validate_s3_object(object_name):
    try:
         # Strip the 's3://' prefix and the bucket name from the S3 object key
        if object_name.startswith('s3://'):
            object_name = object_name[5:]
        bucket_name = env_config['s3_bucket']
        if object_name.startswith(bucket_name + '/'):
            object_name = object_name[len(bucket_name) + 1:]
        s3.head_object(Bucket=env_config['s3_bucket'], Key=object_name)
        return True
    except botocore.exceptions.ClientError as e:
        return False

#returns the hardcoded CloudFront name if you want to serve video's directly via CloudFront - otherwise you can built the video's s3 uri and use an S3 bucket directly
def get_cloudfront_name(object_name):
    cf_url=f"https://{env_config['cloudfront_hostname']}/{object_name}" #Add your CloudFront Origin here
    return cf_url


#transcription job - returns full transcript and subtitled (aka timestamped) transcript
def transcribe_file(object_name): 

    transcribe_client = session.client('transcribe')

    file_uri= f"s3://{env_config['s3_bucket']}/{object_name}"
    job_name=object_name+time.strftime("%Y%m%d-%H%M%S")
    full_transcript=""

    transcribe_client.start_transcription_job(
        TranscriptionJobName=job_name,
        Media={'MediaFileUri': file_uri},
        #MediaFormat='wav',
        LanguageCode='en-US',
                Subtitles = {
            'Formats': [
                'srt'
            ],
            'OutputStartIndex': 0 
       }
    )

    max_tries = 60
    while max_tries > 0:
        max_tries -= 1
        job = transcribe_client.get_transcription_job(TranscriptionJobName=job_name)
        job_status = job['TranscriptionJob']['TranscriptionJobStatus']
        if job_status in ['COMPLETED', 'FAILED']:
            print(f"Job {job_name} is {job_status}.")
            if job_status == 'COMPLETED':
                print(
                    f"Download the transcript from\n"
                    f"\t{job['TranscriptionJob']['Transcript']['TranscriptFileUri']}.")
                
                job_result = requests.get(
                    job['TranscriptionJob']['Transcript']['TranscriptFileUri']).json()
                full_transcript=job_result['results']['transcripts'][0]['transcript']

                #testing
                print("______________________")
                print(job)

                sub_url=job['TranscriptionJob']['Subtitles']['SubtitleFileUris'][0]

                print(sub_url)

                #sub_url=job['Subtitles']['SubtitleFileUris'][0]

                transcript_response = requests.get(sub_url)
                full_subtitles=transcript_response.content.decode()

                print("----Full Transcript ----")
                print(full_transcript)
                print("----Full Transcript ----")

                print("----Full Subtitles ----")
                print(full_subtitles)
                print("----End Subtitles ----")

                return full_transcript, full_subtitles
            break
        else:
            print(f"Waiting for {job_name}. Current status is {job_status}.")
        time.sleep(10)


#Invoke Bedrock LLM - Returns JSON Array of Topics, Summaries, and Starting Sentences 
def create_topics(transcription, title):


     ##Setup Prompt
    prompt_data = f"""
You will be provided a video transcript
Using the transcript, identify and respond with all the main sections of the video. 
The sections should be able to be understood by a human without the need to view the other sections.
You can have as little as one section, if necessary, to ensure sections have enough relevant content.
This should include introduction and conclusion sections, if relevant sections are found in the transcription.
The sections should be in order and capture all the contents of the video.
For every section identified, create a short Section Title and a detailed 
section summary that summarizes the ENTIRE context of the section and is clear what the subject of the video chapter is.
Provide the first sentence from the video_transcription that begins the section.
This sentence should mark the start of the section you have identified and should mark the transition into the section
Return the Section Titles,  Summaries, and beginning sentence in a valid JSON array.
Text that contains quotation marks (") should use string escapes (\\").
The JSON will be read by python code.

Video Title:
<title>
{title}
</title>

Here is the provided video transcript
<video_transcription>
{transcription}
</video_transcription>

Use the following format as a guide for your output
<output_format>
[
    {{"Title": "(Short Section Title)", "Summary":  "(Summary of Topic)", "Starting_Sentence":  "(Sentence that starts the Section)"}},
    {{"Title": "(Short Section Title)", "Summary":  "(Summary of Topic)", "Starting_Sentence":  "(Sentence that starts the Section)"}}
]
<output_format>


Please return the JSON formatted response for each identified section response in <response> XML Tags without any new lines.
"""

    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 10000,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type":"text",
                        "text":prompt_data
                    }
                ]
            }
        ],
        "top_k":250,
        "top_p":0.5,
    }) 
    
    #Run Inference
    modelId = "anthropic.claude-3-haiku-20240307-v1:0"  # change this to use a different version from the model provider if you want to switch 
    accept = "application/json"
    contentType = "application/json"

    response = bedrock.invoke_model(body=body, modelId=modelId, accept=accept, contentType=contentType)
    response_body = json.loads(response.get('body').read())
    response_content = response_body['content']
    response_text = ""
    for content in response_content:
        response_text += content['text']

    
    result = parse_xml(response_text, 'response')
    # make sure the json objects parsed are in an array
    return json.loads(result)


#Manipulate context
def split_transcript(subtitles):
    text_splitter = CharacterTextSplitter(
        separator="\n\n",
        chunk_size=500, #Testing with hard coded 500
        chunk_overlap=100,
        length_function=len,
        is_separator_regex=False,
    )

    parts = text_splitter.create_documents([subtitles])
    
    return parts


#Get Starting TimeStamps
def starting_time(subtitles, sentence, previous_timestamp):

    #Get starting time for all sections
    #Depending on use case, you may want to hardcode the first section to 00:00:00
    if len(previous_timestamp) < 1:
        previous_timestamp = "00:00:00,000"

      ##Setup Prompt
    prompt_data = f"""
Return the earliest "Start timestamp" associated with the <focus_sentence> from the provided <subtitles> 
The associated sentence you return the timestamps from should be the closest possible match in the provided <focus_sentence>
and should be after the timestamp of {previous_timestamp} in the <subtitles>.
Timestamp output should be in (hh:mm:ss,msms) format.


<focus_sentence>
{sentence}
<\focus_sentence>

Use the format_info as a guide to interpret the subtitles format:
<format_info>
(Section number - indicated the Section number or paragraph number - dont return this as a timestamp value)
("Start timestamp" of sentence in hh:mm:ss,msms format)  --> ("End timestamp" stamp in hh:mm:ss,msms format)
(Sentence associated with the above timestamp)
<\format_info>

<subtitles>
{subtitles}
<\subtitles>

Return the earliest Start timestamp for the associated sentence in hh:mm:ss,msms format in <start_time> xml tags

"""
    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 5000,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type":"text",
                        "text":prompt_data
                    }
                ]
            }
        ],
        "top_k":250,
        "top_p":0.5,
    }) 
    
    #Run Inference
    modelId = "anthropic.claude-3-haiku-20240307-v1:0"  # change this to use a different version from the model provider if you want to switch 
    accept = "application/json"
    contentType = "application/json"


    response = bedrock.invoke_model(body=body, modelId=modelId, accept=accept, contentType=contentType)
    response_body = json.loads(response.get('body').read())
    response_content = response_body['content']
    response_text = ""
    for content in response_content:
        response_text += content['text']

    
    start_time = parse_xml(response_text, 'start_time')
    #end=parse_xml(llmOutput, "end")
    #thoughts = parse_xml(llmOutput, "thoughts")
    return start_time


#parse xml
def parse_xml(xml, tag):
    temp=xml.split(">")
    
    tag_to_extract="</"+tag

    for line in temp:
        if tag_to_extract in line:
            parsed_value=line.replace(tag_to_extract, "")
            return parsed_value


#Calculate seconds for timestamps in hh:mm:ss,msms format
def time_math_seconds(timecode):
    print(timecode)
    times=timecode.split(":")
    hour=int(times[0])*60
    minute=int(times[1])*60
    seconds_temp=times[2].split(",")
    seconds = int(seconds_temp[0])

    
    suffix = hour+minute+seconds
    return suffix

def time_math_from_seconds(seconds):
    """
    Converts an integer representing seconds to a string formatted as "hh:mm:ss".
    
    Args:
        seconds (int): The number of seconds to convert.
        
    Returns:
        str: The time formatted as "hh:mm:ss".
    """
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"



def fuzzy_search(topic_sentence, parts, num_sections, total_sections): #basically removing the fist and last section of the split docuemnt unless its the first or last topic. Intro's and conclusions (particualrly names) are throwing off the fuzzy score

    segments = parts.copy()
    
    partial_ratio_score=0
    partial_ratio_item = ""


    if total_sections < 3: #handle small video's but not removing stuff
        for item in segments:
            x = fuzz.partial_ratio(topic_sentence, item.page_content)
            print(x)
            if x > partial_ratio_score:
                partial_ratio_score = x
                partial_ratio_item = item.page_content
                print("new x! with score of " + str(partial_ratio_score))

        print(partial_ratio_item)
        return(partial_ratio_item)

    elif num_sections < 3: # if its the first 2 sections section, remove the last part of index
        last = (len(parts)) -1
        segments.pop(last)
        print(len(segments))

        for item in segments:
            x = fuzz.partial_ratio(topic_sentence, item.page_content)
            print(x)
            if x > partial_ratio_score:
                partial_ratio_score = x
                partial_ratio_item = item.page_content
                print("new x! with score of " + str(partial_ratio_score))

        print(partial_ratio_item)
        return(partial_ratio_item)

    elif num_sections == total_sections: # if its the last section, remove the first part of index
        first=0
        segments.pop(first)

        for item in segments:
            x = fuzz.partial_ratio(topic_sentence, item.page_content)
            print(x)
            if x >= partial_ratio_score:
                partial_ratio_score = x
                partial_ratio_item = item.page_content
                print("new x! with score of " + str(partial_ratio_score))
                
        print(partial_ratio_item)
        return(partial_ratio_item)        

    else: # Anywhere else, remove the first and last parts
        first=0
        last = (len(parts)) -1
        segments.pop(last)
        segments.pop(first)

        for item in segments:
            x = fuzz.partial_ratio(topic_sentence, item.page_content)
            print(x)
            if x >= partial_ratio_score:
                partial_ratio_score = x
                partial_ratio_item = item.page_content
                print("new x! with score of " + str(partial_ratio_score))
                
        print(partial_ratio_item)
        return(partial_ratio_item)        




#method for adding new row into final dataframe output   
def add_row(df, new_row_data):
    # Creating a DataFrame from the new row data
    new_row_df = pd.DataFrame([new_row_data], columns=df.columns)
    # Concatenating the existing DataFrame with the new row DataFrame
    df = pd.concat([df, new_row_df], ignore_index=True)
    return df


#Persisting docuemnts into Opensearch
def persist_doc(doc):
    #Setup Opensearch connectionand clinet
    host = env_config['opensearch_endpoint'] #use Opensearch Serverless host here
    region = env_config['opensearch_region'] #use Opensearch Serverless region here
    service = 'aoss'
    credentials = session.get_credentials() #Use enviroment credentials
    auth = AWSV4SignerAuth(credentials, region, service) 

    oss_client = OpenSearch(
        hosts = [{'host': host, 'port': 443}],
        http_auth = auth,
        use_ssl = True,
        verify_certs = True,
        connection_class = RequestsHttpConnection,
        pool_maxsize = 20
    )

    tempdf = pd.DataFrame(doc)

    for row in tempdf.iterrows():
        #title = row['Title']
        #summary = row['Summary']
        #start_time = row['Start Time']
        #video_link = row['Video Link']

        st.write(row[1])

        title = row[1]['Title']
        summary = row[1]['Summary']

        start_time_temp = row[1]['Start Time']
        start_time = time_math_seconds(start_time_temp.strip())

        video_source = row[1]['Video Link']

        #Get Embeddings - returns vectorized value of input string
        vectors = get_embeddings(bedrock, summary)
        #Index document
        response = index_doc(oss_client, vectors, title, summary, video_source, start_time)

        print(response)

        st.write("saved")

    return "Done"
        




#Index document
def index_doc(client, vectors, title,summary,video_source, source_seconds):
    indexDocument={
        'vectors': vectors,
        'Title': title,
        'Summary': summary,
        'StartTimeSeconds' : source_seconds,
        'VideoSource': video_source
        }

    response = client.index(
        index = env_config["opensearch_index"], #Use your index 
        body = indexDocument,
    #    id = '1', commenting out for now
        refresh = False
    )
    return response


#Get Embeddings - returns vectorized value of input string
def get_embeddings(bedrock, text):
    body_text = json.dumps({"inputText": text})
    modelId = 'amazon.titan-embed-text-v1'
    accept = 'application/json'
    contentType='application/json'

    response = bedrock.invoke_model(body=body_text, modelId=modelId, accept=accept, contentType=contentType)
    response_body = json.loads(response.get('body').read())
    embedding = response_body.get('embedding')

    return embedding

def srt_to_transcript(srt_text):
    """
    Converts .srt subtitle text to a plain text transcript.
    
    Args:
        srt_text (str): The .srt formatted text
        
    Returns:
        str: The plain text transcript.
    """
    transcript = ""
    lines = srt_text.split("\n")

    # Iterate through the lines in the .srt file
    i = 0
    while i < len(lines):
        # Skip the line with the section number
        if lines[i].strip().isdigit():
            i += 2
        
        
        # Get the subtitle text
        subtitle_text = ""
        while i < len(lines) and lines[i].strip():
            subtitle_text += lines[i].strip() + " "
            i += 1
        
        # Add the subtitle text to the transcript
        if subtitle_text.strip():
            transcript += " " + subtitle_text.strip()
        
        # Skip the empty line
        if i < len(lines) and not lines[i].strip():
            i += 1
    
    return transcript.strip()


def get_s3_object_text(s3_key):
    """
    Retrieves the text contents of an S3 object given the object key.
    
    Args:
        s3_key (str): The key of the S3 object, including the 's3://' prefix and the bucket name.
        
    Returns:
        str: The text contents of the S3 object.
    """
    
    # Strip the 's3://' prefix and the bucket name from the S3 object key
    if s3_key.startswith('s3://'):
        s3_key = s3_key[5:]
    bucket_name = env_config['s3_bucket']
    if s3_key.startswith(bucket_name + '/'):
        s3_key = s3_key[len(bucket_name) + 1:]
    
    # Get the S3 object
    obj = s3.get_object(Bucket=env_config['s3_bucket'], Key=s3_key)
    
    # Read the object's contents
    object_text = obj['Body'].read().decode('utf-8')
    
    return object_text



def get_cloudfront_url_for_s3_key(s3_key):
    """
    Generates a CloudFront URL for the given S3 object key.
    
    Args:
        s3_key (str): The key of the S3 object, including the 's3://' prefix.
        env_config (dict): A dictionary containing the CloudFront hostname.
        
    Returns:
        str: The CloudFront URL for the S3 object.
    """
    # Strip the 's3://' prefix from the S3 object key
    if s3_key.startswith('s3://'):
        s3_key = s3_key[5:]
    bucket_name = env_config['s3_bucket']
    # Strip the bucket name from the S3 object key
    if s3_key.startswith(bucket_name + '/'):
        s3_key = s3_key[len(bucket_name) + 1:]
    
    # Get the CloudFront distribution domain name from the environment configuration
    cloudfront_domain = env_config['cloudfront_hostname']
    
    # Construct the CloudFront URL
    cloudfront_url = f"https://{cloudfront_domain}/{s3_key}"
    
    return cloudfront_url
