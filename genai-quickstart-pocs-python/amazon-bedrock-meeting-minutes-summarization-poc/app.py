
'''
This sample, non-production-ready code is used as sample genai assistant.
(c) 2021 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.  
This AWS Content is provided subject to the terms of the AWS Customer Agreement available at  
http://aws.amazon.com/agreement or other written agreement between Customer and either
Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.
@Author : Abhijit Rajeshirke
'''


import streamlit as st
import boto3
from botocore.config import Config
from io import StringIO
import re
from transcribe_util import Transcribe
from s3_util import S3
from llm import BedrockModelHandler

S3_BUCKET_NAME = "rajeabh-transcribe-test"

SUPPORTED_MODLES = ['anthropic.claude-3-sonnet','anthropic.claude-v2',]
SUPPORTED_TASKS = ['Summarize','NotesAction']
AUDIO_EXTENSIONS = ["wav","m4a","mp4"]
TEXT_EXTENSIONS = ["txt"]



def process_file():
    """
    Process uploaded file and generate the summary and update the text area of streamlit app.
    :return: None
    """
    result = ""
    if st.session_state.file_input is not None:
        __session = boto3.session.Session()
        transcribe = Transcribe(__session)
        #Remove speical characters from file
        file_name, file_extension = get_file_extention(st.session_state.file_input.name)
        st.session_state["file_name_out"] = "{}_summary.txt".format(file_name)
        if file_name is not None:
           # check if extensions are part of auido extensions 
            if file_extension.lower() in AUDIO_EXTENSIONS:
                job_name = transcribe.get_job_name(file_name)
                 # check if transcirption already present 
                if job_name in transcribe.get_transcribe_jobs_list():
                    # if transcription already present get the transcription text
                    transcript_text = transcribe.get_transcribe_text(job_name)
                    if transcript_text is not None:
                        if transcript_text !="":
                            result = BedrockModelHandler(__session, selected_model, str(transcript_text), option).get_response()   
                        else:
                            result ="ERROR : Meeting audio/video file does not produce any transcript. Please verify file "
                    else:
                        result = "ERROR : in Transcription job "
                else:
                    # if transcription is not present upload file on S3 bucket and get the URI
                    bytes_data = st.session_state.file_input.getvalue()
                    s3 = S3(__session, S3_BUCKET_NAME)
                    # Temporarily upload file on S3 bucket
                    file_uri = s3.upload_media_file_on_s3(bytes_data, job_name, file_extension)
                    if file_uri is not None:
                        transcribe.transcribe_file(job_name, file_uri, file_extension)
                        transcript_text = transcribe.get_transcribe_text(job_name)
                        if transcript_text is not None : 
                            if transcript_text !="":
                                result = BedrockModelHandler(__session, selected_model, str(transcript_text), option).get_response()   
                                s3.delete_media_file_from_s3(job_name, file_extension)
                            else:
                                result ="ERROR : Meeting audio/video file does not produce any transcript. Please verify file "
                        else:
                            result = "ERROR : in Transcription job "   

                            # Delete uploaded file on S3 bucket
                            
            elif file_extension.lower() in TEXT_EXTENSIONS:
                stringio = StringIO(st.session_state.file_input.getvalue().decode("utf-8"))
                string_data = stringio.read()
                result = BedrockModelHandler(__session, selected_model, str(string_data), option).get_response()      
            else:
                result = "Error : Invalid file format {}".format(file_extension)

    st.session_state["result"] = result

# STREAMLIT APP ==============================================================================

st.set_page_config(layout="wide")
st.title(f""":rainbow[Amazon Bedrock Meeting Minutes Summarization]""")
selected_model = st.selectbox('Select Model', SUPPORTED_MODLES)
option = st.selectbox('Select Task',SUPPORTED_TASKS)
uploaded_file = st.file_uploader("Upload Meeting Recording", key='file_input' ,on_change=process_file)


st.divider()
st.title("Meeting Summary")
if "result" not in st.session_state:
    st.session_state["result"] = ""
if "file_name_out" not in st.session_state:
    st.session_state["file_name_out"] = ""
notes = st.text_area(":blue[]",value = st.session_state["result"], key ="notes_summary" ,height=300)
st.download_button(label="Download Summary", data=notes, file_name=st.session_state["file_name_out"])
st.divider()
st.write("Meeting recordings are supported in the following formats: .mp4, .wav, .m4a, .txt") 
#==============================================================================

def get_file_extention(file_name):
    """
    Remove special characters from filename
    Speical character file can't be uploaded on S3 bucket.
    :param file: file_name.
    :param file_name: File Name or Job Name.
    :param file_name: Extenstion of file.
    :return: tuple(file_name, file_extension).
    """
    new_file_name = None
    file_extension = None
    try:
        extension_index = file_name.rindex('.')
        file_extension = file_name[extension_index+1:len(file_name)]
        new_file_name = file_name[0:extension_index]
        new_file_name = re.sub('[^A-Za-z0-9]+', '_', new_file_name)
    except ValueError:
        pass

    return new_file_name, file_extension









