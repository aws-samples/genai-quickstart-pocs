import streamlit as st
import os
from prompt_finder_and_invoke_llm import prompt_finder
from chat_history_prompt_generator import chat_history
from live_transcription import main
from dotenv import load_dotenv
import boto3
import botocore.config

# loading in environment variables
load_dotenv()

# configuring our CLI profile name
boto3.setup_default_session(profile_name=os.getenv('profile_name'))
# increasing the timeout period when invoking bedrock
config = botocore.config.Config(connect_timeout=120, read_timeout=120)
# instantiating the Polly client
polly = boto3.client('polly', region_name='us-east-1')
# instantiating the Transcribe client
transcribe = boto3.client('transcribe', region_name='us-east-1')

# Title displayed on the streamlit web app
st.title(f""":rainbow[Bedrock Speech-to-Text Chat]""")

# configuring values for session state
if "messages" not in st.session_state:
    st.session_state.messages = []
    open("chat_history.txt", "w").close()
# writing the message that is stored in session state
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        
# creating empty transcript string for streamed input to be added to
transcript = ""
response_placeholder = st.empty()
# use st.audio play audio from Polly response
def play_audio(audio_data):
    st.audio(audio_data, format='audio/mp3', start_time=0, autoplay=True)
# add language selection and transcription button to sidebar
with st.sidebar:
    # call main function from live_transcription.py and start audio transcription job
    def processing():
        with st.spinner(':ear: Bedrock is listening...'):
            global transcript
            transcript = main("en-US")
        return "Transcription ended!"
    # check if live transcription is running
    if 'run' not in st.session_state:
        st.session_state.run = False
        st.session_state.result = None
    # set button state to true if in running state
    def run():
        st.session_state.run = True
    # reset button states to enable user to start new conversation
    def clear():
        global response_placeholder
        response_placeholder = st.empty()
        st.session_state.result = None
    # instructions for using microphone button and submitting prompt
    upper = st.container()
    upper.write(':studio_microphone: Click to start a conversation session. After 3 seconds of silence, your question will be sent to Bedrock.')
    st.button('Start Conversation', type="primary", on_click=run, disabled=st.session_state.run)
    result_area = st.empty()
    # if button is clicked, call processing() and put button in disabled state
    if st.session_state.run:
        result_area.empty()
        st.session_state.result = processing()
        st.session_state.run = False
    # once transcription ends, enable reset button to clear states
    if st.session_state.result == "Transcription Ended!":
        result_container = result_area.container()
        result_container.write(st.session_state.result)
        result_container.button('Ask New Question', on_click=clear)
# evaluating if transcript string is finalized and determining if question has been input
if transcript:
    # with the user icon, write the question to the front end
    with st.chat_message("user"):
        st.markdown(transcript)
        # adding some special effects from the UI perspective
        st.balloons()
    # append the question and the role (user) as a message to the session state
    st.session_state.messages.append({"role": "user", 
                                      "content": transcript})
    # respond as the assistant with the answer
    with st.chat_message("assistant"):
        # making sure there are no messages present when generating the answer
        message_placeholder = st.empty()
        # putting a spinning icon to show that the query is in progress
        with st.spinner("Determining the best possible answer!") as status:
            # passing the question into the kendra search function, which later invokes the llm
            answer = prompt_finder(transcript)
            # writing the answer to the front end
            message_placeholder.markdown(f"{answer}")
    # appending the results to the session state
    st.session_state.messages.append({"role": "assistant", "content": answer})
    # invoke Polly by passing in transcript and returning audio response
    response = polly.synthesize_speech(Text=answer, OutputFormat='mp3', VoiceId='Danielle', Engine="neural")
    response_audio = response['AudioStream'].read()
    # create an empty placeholder for the audio player
    response_placeholder = st.empty()
    # display audio player
    response_placeholder.audio(response_audio, format='audio/mp3', start_time=0, autoplay=True)
    # invoking that chat_history function in the chat_history_prompt_generator.py file to format past questions and
    # answers and dynamically add them to future prompt
    chat_history(st.session_state)
