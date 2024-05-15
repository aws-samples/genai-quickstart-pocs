import tomllib
import botocore
import boto3
import time
import botocore.exceptions
import requests
import json
import streamlit as st
import time
from langchain.text_splitter import (
    CharacterTextSplitter,
)  # using for text splitter only
from thefuzz import fuzz
import pandas as pd
from opensearchpy import OpenSearch
from opensearchpy import RequestsHttpConnection, OpenSearch, AWSV4SignerAuth

# read the environment configuration
with open("environment.toml", "rb") as f:
    env_config = tomllib.load(f)

# configure the AWS profile used to access AWS resources
if "aws_profile_name" in env_config and len(env_config["aws_profile_name"]) > 0:
    session = boto3.Session(profile_name=env_config["aws_profile_name"])
else:
    session = boto3.Session()

# configure AWS SDK Clients
config = botocore.config.Config(connect_timeout=300, read_timeout=300)
bedrock = session.client("bedrock-runtime", env_config["bedrock_region"], config=config)
s3 = session.client("s3")


def upload_to_s3(file, file_name):
    """
    Upload a file to an S3 bucket.
    :param file: The file to upload.
    :param file_name: The name to give the file on S3.
    :return: The object key of the uploaded file.
    """
    bucket = env_config[
        "s3_bucket"
    ]  # Add your bucket name here (prototyping purposes only)
    object_key = file_name.strip()

    # Upload the file to S3
    s3.upload_fileobj(file, bucket, object_key)

    # Return the S3 key of the uploaded object
    return object_key


def validate_s3_object(object_name):
    """
    Check if an S3 object exists.
    :param object_name: The S3 object key.
    :return: True if the object exists, False otherwise.
    """
    try:
        # Strip the 's3://' prefix and the bucket name from the S3 object key
        if object_name.startswith("s3://"):
            object_name = object_name[5:]
        bucket_name = env_config["s3_bucket"]
        if object_name.startswith(bucket_name + "/"):
            object_name = object_name[len(bucket_name) + 1 :]
        s3.head_object(Bucket=env_config["s3_bucket"], Key=object_name)
        return True
    except botocore.exceptions.ClientError as e:
        return False


# returns the hardcoded CloudFront name if you want to serve video's directly via CloudFront - otherwise you can built the video's s3 uri and use an S3 bucket directly
def get_cloudfront_name(object_name):
    """
    Get the CloudFront name for an S3 object.
    :param object_name: The S3 object key.
    :return: The url for the CloudFront distribution with the given object name.
    """
    return f"https://{env_config['cloudfront_hostname']}/{object_name}"


# transcription job - returns full transcript and subtitled (aka timestamped) transcript
def transcribe_file(object_name):
    """
    Starts the transcription job for the given object.
    :param object_name: The S3 object key.
    :return: The full transcript and subtitled transcript.
    """
    # configure Transcribe client
    transcribe_client = session.client("transcribe")

    # The full S3 URI for the object
    file_uri = f"s3://{env_config['s3_bucket']}/{object_name}"
    # The name of the transcribe job
    job_name = object_name + time.strftime("%Y%m%d-%H%M%S")

    full_transcript = ""

    # Start the transcription job
    transcribe_client.start_transcription_job(
        TranscriptionJobName=job_name,
        Media={"MediaFileUri": file_uri},
        LanguageCode="en-US",
        Subtitles={"Formats": ["srt"], "OutputStartIndex": 0},
    )
    # the transcription job can take an extended amount of time
    # we will poll the job details up to 60 times to see if it has completed
    max_tries = 60
    while max_tries > 0:
        max_tries -= 1
        job = transcribe_client.get_transcription_job(TranscriptionJobName=job_name)
        job_status = job["TranscriptionJob"]["TranscriptionJobStatus"]
        if job_status in ["COMPLETED", "FAILED"]:
            # Print the current status of the job to the console
            print(f"Job {job_name} is {job_status}.")
            if job_status == "COMPLETED":
                print(
                    f"Download the transcript from\n"
                    f"\t{job['TranscriptionJob']['Transcript']['TranscriptFileUri']}."
                )

                # Get the results of the transcribe job
                job_result = requests.get(
                    job["TranscriptionJob"]["Transcript"]["TranscriptFileUri"]
                ).json()

                # get the full transcript from the transcribe job results
                full_transcript = job_result["results"]["transcripts"][0]["transcript"]

                # get the URL for the subtitles in the transcription job
                sub_url = job["TranscriptionJob"]["Subtitles"]["SubtitleFileUris"][0]
                # get the srt subtitles from the subtitles URL
                transcript_response = requests.get(sub_url)
                # decode the subtitles from bytes to string
                full_subtitles = transcript_response.content.decode()

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


# Invoke Bedrock LLM - Returns JSON Array of Topics, Summaries, and Starting Sentences
def create_topics(transcription, title):
    """
    Create topics from the given video transcript.
    :param transcription: The video transcript.
    :return: The topics, summaries, and starting sentences.
    """

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

    # create the body of the Bedrock request
    body = json.dumps(
        {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 10000,
            "messages": [
                {"role": "user", "content": [{"type": "text", "text": prompt_data}]}
            ],
            "top_k": 250,
            "top_p": 0.5,
        }
    )

    # Define which Bedrock model to use
    modelId = "anthropic.claude-3-haiku-20240307-v1:0"
    # set the accepted output and input content types
    accept = "application/json"
    contentType = "application/json"

    # Invoke the bedrock model and get the response
    response = bedrock.invoke_model(
        body=body, modelId=modelId, accept=accept, contentType=contentType
    )
    # parse the response body from the response
    response_body = json.loads(response.get("body").read())
    # get the content from the response body
    response_content = response_body["content"]

    # loop through the content and get the text from each object
    # Add the text to the response_text string
    response_text = ""
    for content in response_content:
        response_text += content["text"]

    # We asked the LLM to put the response in an xml <response> tag
    # This helps us easily extract it by parsing the <response> xml tag
    result = parse_xml(response_text, "response")

    # make sure the json objects parsed are in an array
    return json.loads(result)


# Manipulate context
def split_transcript(subtitles):
    """
    Split the provided subtitles into chunks
    :param subtitles: The subtitles to split.
    :return: The split subtitles chunks
    """

    # Create a CharacterTextSplitter object
    text_splitter = CharacterTextSplitter(
        separator="\n\n",
        chunk_size=500,  # Testing with hard coded 500
        chunk_overlap=100,
        length_function=len,
        is_separator_regex=False,
    )

    # Split the subtitles into chunks
    parts = text_splitter.create_documents([subtitles])
    return parts


# Get Starting TimeStamps
def starting_time(subtitles, sentence, previous_timestamp):
    """
    Get the starting timestamp for the given sentence
    :param subtitles: The subtitles to search
    :param sentence: The sentence to search for
    :param previous_timestamp: The previous timestamp
    :return: The starting timestamp
    """
    # Get starting time for all sections
    # Depending on use case, you may want to hardcode the first section to 00:00:00
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
    # create the body of the Bedrock request
    body = json.dumps(
        {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "messages": [
                {"role": "user", "content": [{"type": "text", "text": prompt_data}]}
            ],
            "top_k": 250,
            "top_p": 0.5,
        }
    )

    # Define which Bedrock model to use
    modelId = "anthropic.claude-3-haiku-20240307-v1:0"  # change this to use a different version from the model provider if you want to switch
    # set the accepted output and input content types
    accept = "application/json"
    contentType = "application/json"

    # Invoke the bedrock model and get the response
    response = bedrock.invoke_model(
        body=body, modelId=modelId, accept=accept, contentType=contentType
    )

    response_body = json.loads(response.get("body").read())
    response_content = response_body["content"]
    # loop through the content and get the text from each object
    # Add the text to the response_text string
    response_text = ""
    for content in response_content:
        response_text += content["text"]

    # We asked the LLM to put the response in an xml <start_time> tag
    # This helps us easily extract it by parsing the <start_time> xml tag
    start_time = parse_xml(response_text, "start_time")

    # return the video chapter's start time
    return start_time


def parse_xml(xml, tag):
    """
    Parse the given XML string and extract the value of the given tag.

    Args:
        xml (str): The XML string to parse.
        tag (str): The tag to extract the value from.

    Returns:
        str: The value of the tag in the XML string.
    """
    temp = xml.split(">")

    tag_to_extract = "</" + tag

    for line in temp:
        if tag_to_extract in line:
            parsed_value = line.replace(tag_to_extract, "")
            return parsed_value


# Calculate seconds for timestamps in hh:mm:ss,msms format
def time_math_seconds(timecode):
    """
    Converts a string formatted as "hh:mm:ss, msms" to an integer representing seconds.

    Args:
        timecode (str): The timecode to convert.

    Returns:
        int: The number of seconds represented by the timecode.
    """
    times = timecode.split(":")
    hour = int(times[0]) * 60
    minute = int(times[1]) * 60
    seconds_temp = times[2].split(",")
    seconds = int(seconds_temp[0])

    suffix = hour + minute + seconds
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


def fuzzy_search(
    topic_sentence, parts, num_sections, total_sections
):  # basically removing the fist and last section of the split docuemnt unless its the first or last topic. Intro's and conclusions (particualrly names) are throwing off the fuzzy score
    """
    Perform a fuzzy search on the provided parts of the transcript to find the closest match to the provided topic sentence.

    Args:
        topic_sentence (str): The topic sentence to search for.
        parts (list): The parts of the transcript to search.
        num_sections (int): The number of sections in the transcript.
        total_sections (int): The total number of sections in the transcript.

    Returns:
        str: The closest match to the topic sentence.
    """
    segments = parts.copy()

    partial_ratio_score = 0
    partial_ratio_item = ""

    # handle small video's but not removing stuff
    if total_sections < 3:
        for item in segments:
            x = fuzz.partial_ratio(topic_sentence, item.page_content)
            if x > partial_ratio_score:
                partial_ratio_score = x
                partial_ratio_item = item.page_content
                print("new x! with score of " + str(partial_ratio_score))

        return partial_ratio_item

    # if its the first 2 sections section, remove the last part of index
    elif num_sections < 3:
        last = (len(parts)) - 1
        segments.pop(last)
        for item in segments:
            x = fuzz.partial_ratio(topic_sentence, item.page_content)
            if x > partial_ratio_score:
                partial_ratio_score = x
                partial_ratio_item = item.page_content

        return partial_ratio_item

    # if its the last section, remove the first part of index
    elif num_sections == total_sections:
        first = 0
        segments.pop(first)

        for item in segments:
            x = fuzz.partial_ratio(topic_sentence, item.page_content)
            print(x)
            if x >= partial_ratio_score:
                partial_ratio_score = x
                partial_ratio_item = item.page_content
                print("new x! with score of " + str(partial_ratio_score))

        print(partial_ratio_item)
        return partial_ratio_item

    # Anywhere else, remove the first and last parts
    else:  
        first = 0
        last = (len(parts)) - 1
        segments.pop(last)
        segments.pop(first)

        for item in segments:
            x = fuzz.partial_ratio(topic_sentence, item.page_content)
            if x >= partial_ratio_score:
                partial_ratio_score = x
                partial_ratio_item = item.page_content

        return partial_ratio_item


def add_row(df, new_row_data):
    """
    Adds a new row to the given DataFrame with the provided data.

    Args:
        df (DataFrame): The DataFrame to add the new row to.
        new_row_data (dict): The data for the new row.

    Returns:
        DataFrame: The DataFrame with the new row added.
    """

    # Creating a DataFrame from the new row data
    new_row_df = pd.DataFrame([new_row_data], columns=df.columns)
    # Concatenating the existing DataFrame with the new row DataFrame
    df = pd.concat([df, new_row_df], ignore_index=True)
    return df


def save_doc():
    """
    Saves the video chapters stored in the session data frame to the database.
    If no chapters are stored, a warning message is displayed.
    If the chapters are saved successfully, a success message is displayed.

    Args:

    Returns:

    """
    if "df" not in st.session_state:
        st.write("No Data To Save")
    else:
        with st.status("Processing Request", expanded=False, state="running") as status:
            status.write("Saving video chapters...")
            persist_doc(st.session_state.df)
        st.status("Video Chapters saved!", expanded=False, state="complete")
        st.warning(
            "Video chapters may take up to 30 seconds before user inquiries will be able to locate the video chapters.",
            icon="⚠️",
        )


def persist_doc(doc):
    """
    Persists the provided document into the OpenSearch Collection.

    Args:
        doc (dict): The document to persist.

    Returns:
        str: A message indicating the success or failure of the operation.
    """
    # Opensearch Serverless host
    host = env_config["opensearch_endpoint"]  
    # Opensearch Serverless region
    region = env_config["opensearch_region"]  
    # Opensearch Serverless service - Needed for signing credentials
    service = "aoss" 
    # Get the credentials for the current session
    credentials = session.get_credentials()  
    # Create the AWSV4SignerAuth object
    auth = AWSV4SignerAuth(credentials, region, service)

    # Create the OpenSearch client
    oss_client = OpenSearch(
        hosts=[{"host": host, "port": 443}],
        http_auth=auth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection,
        pool_maxsize=20,
    )

    # Create a DataFrame from the document
    tempdf = pd.DataFrame(doc)

    for row in tempdf.iterrows():

        # Write the data frame information to UI
        st.write(row[1])
        # Set the details to variable
        title = row[1]["Title"]
        summary = row[1]["Summary"]
        start_time_temp = row[1]["Start Time"]
        video_source = row[1]["Video Link"]
        # convert the time from seconds
        start_time = time_math_seconds(start_time_temp.strip())

        # Get Embeddings - returns vectorized value of input string
        vectors = get_embedding(bedrock, summary)
        # Index document
        response = index_doc(
            oss_client, vectors, title, summary, video_source, start_time
        )

        print(response)

        st.write("saved")

    return "Done"


# Index document
def index_doc(client, vectors, title, summary, video_source, source_seconds):
    """
    Indexes a document into the OpenSearch Collection.

    Args:
        client (OpenSearch): The OpenSearch client.
        vectors (list): The list of vectors to index.
        title (str): The title of the document.
        summary (str): The summary of the document.
        video_source (str): The video source of the document.
        source_seconds (int): The source seconds of the document.

    Returns:
        dict: The response from the OpenSearch client.
    """
    indexDocument = {
        "vectors": vectors,
        "Title": title,
        "Summary": summary,
        "StartTimeSeconds": source_seconds,
        "VideoSource": video_source,
    }

    response = client.index(
        index=env_config["opensearch_index"],  # Use your index
        body=indexDocument,
        #    id = '1', commenting out for now
        refresh=False,
    )
    return response


# Get Embeddings - returns vectorized value of input string
def get_embedding(bedrock, text):
    """
    Returns the embedding of the provided text.

    Args:
        bedrock (Bedrock): The Bedrock client.
        text (str): The text to get the embedding for.

    Returns:
        list: The embedding of the text.
    """

    body_text = json.dumps({"inputText": text})
    # Set the modelId and accept and contentType
    modelId = "amazon.titan-embed-text-v1"
    accept = "application/json"
    contentType = "application/json"

    # Invoke the model
    response = bedrock.invoke_model(
        body=body_text, modelId=modelId, accept=accept, contentType=contentType
    )
    response_body = json.loads(response.get("body").read())
    embedding = response_body.get("embedding")
    # return the embedding
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
    if s3_key.startswith("s3://"):
        s3_key = s3_key[5:]
    bucket_name = env_config["s3_bucket"]
    if s3_key.startswith(bucket_name + "/"):
        s3_key = s3_key[len(bucket_name) + 1 :]

    # Get the S3 object
    obj = s3.get_object(Bucket=env_config["s3_bucket"], Key=s3_key)

    # Read the object's contents
    object_text = obj["Body"].read().decode("utf-8")

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
    if s3_key.startswith("s3://"):
        s3_key = s3_key[5:]
    bucket_name = env_config["s3_bucket"]
    # Strip the bucket name from the S3 object key
    if s3_key.startswith(bucket_name + "/"):
        s3_key = s3_key[len(bucket_name) + 1 :]

    # Get the CloudFront distribution domain name from the environment configuration
    cloudfront_domain = env_config["cloudfront_hostname"]

    # Construct the CloudFront URL
    cloudfront_url = f"https://{cloudfront_domain}/{s3_key}"

    return cloudfront_url


def submit_user_query(userQuery):

    embedding = get_embedding(bedrock, userQuery)
    results = get_knn_results(embedding)

    title = results[0]
    summary = results[1]
    videolink = results[2]
    timestamp = results[3]

    # Answer Question
    response = invoke_llm_with_user_query(bedrock, userQuery, summary)
    print(response)
    st.write(response)

    # play video
    st.video(videolink, format="video/mp4", start_time=int(timestamp))
    st.balloons()
    return response


def find_video_start_times(topics, subtitle_doc, video_object_name):
    """
    Finds the starting time of each topic in the video.

    Args:
        topics (list): A list of dictionaries containing the topic information.
        subtitle_doc (str): The subtitle document as a string.
        video_object_name (str): The name of the video object in S3.

    Returns:
        list: A list of starting times for each topic.
    """
    if "df" not in st.session_state:
        df = pd.DataFrame(columns=["Title", "Summary", "Start Time", "Video Link"])
    else:
        df = st.session_state.df
    num_sections = 1
    previous_timestamp = ""
    cf_name = get_cloudfront_name(
        video_object_name
    )  # To avoid setting my AWS S3 Bucket to public, i want to serve my data via Cloudfront - this will get the Object's URI from CLoudfront

    for key in topics:
        title = key["Title"]
        description = key["Summary"]
        topic_sentence = key["Starting_Sentence"]

        # Fuzzy Partial Ratio Score as Search mechanism
        fuzzy_results = fuzzy_search(
            topic_sentence, subtitle_doc, num_sections, len(topics)
        )
        start_time_fuzzy = starting_time(
            fuzzy_results, topic_sentence, previous_timestamp
        )
        previous_timestamp = start_time_fuzzy

        # yt_suffix_fuzzy = time_math(start_time_fuzzy)
        video_time = time_math_seconds(start_time_fuzzy.strip())

        # write data into dataframe
        new_row_data = {
            "Title": title,
            "Summary": description,
            "Start Time": start_time_fuzzy,
            "Video Link": cf_name,
        }
        df = add_row(df, new_row_data)

        # play video at timestamp

        st.write(title + ": ")
        st.video(cf_name, format="video/mp4", start_time=video_time)

        num_sections += 1

        # End of Loop
        st.write(df)
        st.session_state.df = df


def invoke_llm_with_user_query(bedrock, user_query, summary):
    prompt_data = f"""
    You are an AI assistant that will help people find relevant video sections
    You will be provided a Video Section summary, use this to describe how the video might help them based on their question
    Only use information provided with the context, dont make any assumptions
    Format your response to be human readable 
    Answer in friendly but concise manner with no preamble

    <user_question>
    {user_query}
    </user_question>

    <video_summary>
    {summary}
    </video_summary>

    ouput the response inside a <response> tag.
    """
    body = json.dumps(
        {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "messages": [
                {"role": "user", "content": [{"type": "text", "text": prompt_data}]}
            ],
            "top_k": 250,
            "top_p": 0.5,
        }
    )

    # Run Inference
    modelId = "anthropic.claude-3-haiku-20240307-v1:0"  # change this to use a different version from the model provider if you want to switch
    accept = "application/json"
    contentType = "application/json"

    response = bedrock.invoke_model(
        body=body, modelId=modelId, accept=accept, contentType=contentType
    )
    response_body = json.loads(response.get("body").read())
    response_content = response_body["content"]
    response_text = ""
    for content in response_content:
        response_text += content["text"]

    result = parse_xml(response_text, "response")
    # make sure the json objects parsed are in an array
    return result


# Get KNN Results
def get_knn_results(userVectors):
    # OpenSearch CLient
    host = env_config["opensearch_endpoint"]
    region = env_config["opensearch_region"]
    service = "aoss"
    credentials = session.get_credentials()
    auth = AWSV4SignerAuth(credentials, region, service)

    client = OpenSearch(
        hosts=[{"host": host, "port": 443}],
        http_auth=auth,
        use_ssl=True,
        verify_certs=True,  # Chaging to False for troubleshooting
        connection_class=RequestsHttpConnection,
        pool_maxsize=20,
    )

    query = {
        "size": 1,
        "query": {"knn": {"vectors": {"vector": userVectors, "k": 3}}},
        "_source": False,
        "fields": ["Title", "Summary", "StartTimeSeconds", "VideoSource"],
    }

    response = client.search(
        body=query,
        index=env_config["opensearch_index"],
    )

    print(response)

    title = response["hits"]["hits"][0]["fields"]["Title"][0]
    summary = response["hits"]["hits"][0]["fields"]["Summary"][0]
    videolink = response["hits"]["hits"][0]["fields"]["VideoSource"][0]
    timestamp = response["hits"]["hits"][0]["fields"]["StartTimeSeconds"][0]

    return title, summary, videolink, timestamp
