import tomllib
import boto3
import json
import botocore
import streamlit as st
from opensearchpy import OpenSearch
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth

with open("environment.toml", "rb") as f:
    env_config = tomllib.load(f)

if 'aws_profile_name' in env_config and len(env_config['aws_profile_name']) > 0:
    session = boto3.Session(profile_name=env_config['aws_profile_name'])
else:
    session = boto3.Session()

config = botocore.config.Config(connect_timeout=300, read_timeout=300)
bedrock = session.client('bedrock-runtime' , env_config["bedrock_region"], config = config)
s3 =session.client('s3')


#Headers
with st.container():
    st.header("Training Video Search")
    st.subheader("")
    st.title("Ask Questions and I will link you to the relevant time of a video")

#
with st.container():
    st.write("---")
    st.write("Search for Video Content")
    userQuery = st.text_input("Ask a Question")



# Get Embeddings
def get_embedding(bedrock, userQuery):

    body = json.dumps({"inputText": userQuery})
    modelId = 'amazon.titan-embed-text-v1'
    accept = 'application/json'
    contentType = 'application/json'
    response = bedrock.invoke_model(body=body, modelId=modelId, accept=accept, contentType=contentType)
    response_body = json.loads(response.get('body').read())
    embedding = response_body.get('embedding')

    return embedding

#invoke the LLM
def invoke_llm(bedrock, userQuery, summary):


    prompt_data = f"""
Human: 

You are an AI assistant that will help people find relevant video sections
You will be provided a Video Section summary, use this to describe how the video might help them based on their question
Only use information provided with the context, dont make any assumptions
Format your response to be human readable 
Answer in friendly but concise manner with no preamble

<user_question>
{userQuery}
</user_question>

<video_summary>
{summary}
</video_summary>

Assistant:
"""


    body = json.dumps({"prompt": prompt_data,
                 "max_tokens_to_sample":1000,
                 "temperature":0,
                 "top_k":250,
                 "top_p":0.5,
                 "stop_sequences":[]
                  }) 
    
    #Run Inference
    modelId = "anthropic.claude-instant-v1"  # change this to use a different version from the model provider if you want to switch 
    accept = "application/json"
    contentType = "application/json"

    response = bedrock.invoke_model(
        body=body, modelId=modelId, accept=accept, contentType=contentType
    )
    response_body = json.loads(response.get('body').read())

    llmOutput=response_body.get('completion')

    print(llmOutput)

    return llmOutput


#Get KNN Results
def get_knn_results(client, userVectors):

    query = {
        "size": 1,
        "query": {
            "knn": {
                "vectors": {
                    "vector": userVectors, "k": 3
                }
            }
        },
        "_source": False,
        "fields": ["Title", "Summary", "StartTimeSeconds", "VideoSource"],
    }


    response = client.search(
        body=query,
        index=env_config["opensearch_index"],
    )

    print(response)

    title = response['hits']['hits'][0]['fields']['Title'][0]
    summary = response['hits']['hits'][0]['fields']['Summary'][0]
    videolink = response['hits']['hits'][0]['fields']['VideoSource'][0]
    timestamp = response['hits']['hits'][0]['fields']['StartTimeSeconds'][0]


    return title, summary, videolink, timestamp

def do_it(userQuery):

     #OpenSearch CLient
    host = env_config["opensearch_endpoint"]
    region = env_config["opensearch_region"]
    service = 'aoss'
    credentials = session.get_credentials()
    auth = AWSV4SignerAuth(credentials, region, service)

    client = OpenSearch(
        hosts = [{'host': host, 'port': 443}],
        http_auth = auth,
        use_ssl = True,
        verify_certs = True, #Chaging to False for troubleshooting
        connection_class = RequestsHttpConnection,
        pool_maxsize = 20
    )

    embedding = get_embedding(bedrock, userQuery)
    results = get_knn_results(client, embedding)

    title = results[0]
    summary = results[1]
    videolink = results[2]
    timestamp = results[3]

    #Answer Question
    response =invoke_llm(bedrock, userQuery, summary)
    print(response)
    st.write(response)

    #play video
    st.video(videolink, format="video/mp4", start_time=int(timestamp))

    #response = invoke_llm(bedrock, userQuery, content)
    return response


#Streamlit again
result=st.button("ASK!")
if result:
    response = do_it(userQuery)