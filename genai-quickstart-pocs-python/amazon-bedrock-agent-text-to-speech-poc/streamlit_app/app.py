import invoke_agent as agenthelper
import tts as audio
import time
import streamlit as st
import json
import pandas as pd
import re
from PIL import Image, ImageOps, ImageDraw

# Streamlit page configuration
st.set_page_config(page_title="Anycompany Agentic Text to Speech Platform", page_icon=":robot_face:", layout="wide")

# Function to crop image into a circle
def crop_to_circle(image):
    mask = Image.new('L', image.size, 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse((0, 0) + image.size, fill=255)
    result = ImageOps.fit(image, mask.size, centering=(0.5, 0.5))
    result.putalpha(mask)
    return result

# Function to extract URL from response
def extract_url(text):
    url_pattern = r'<url>(.*?)</url>'
    match = re.search(url_pattern, text)
    return match.group(1) if match else None

# Title
st.title(":rainbow[Anycompany Agentic Text to Speech Platform]")

# Display a text box for input
prompt = st.text_input("Please enter your query?", max_chars=2000)
prompt = prompt.strip()

# Display a primary button for submission
submit_button = st.button("Submit", type="primary")

# Display a button to end the session
end_session_button = st.button("End Session")

# Session State Management
if 'history' not in st.session_state:
    st.session_state['history'] = []

# Function to parse and format response
def format_response(response_body):
    try:
        # Try to load the response as JSON
        data = json.loads(response_body)
        # If it's a list, convert it to a DataFrame for better visualization
        if isinstance(data, list):
            return pd.DataFrame(data)
        else:
            return response_body
    except json.JSONDecodeError:
        # If response is not JSON, return as is
        return response_body

# Handling user input and responses
if submit_button and prompt:
    event = {
        "sessionId": "MYSESSION",
        "question": prompt
    }
    response = agenthelper.lambda_handler(event, None)
    
    try:
        # Parse the JSON string
        if response and 'body' in response and response['body']:
            response_data = json.loads(response['body'])
        else:
            print("Invalid or empty response received")
    except json.JSONDecodeError as e:
        print("JSON decoding error:", e)
        response_data = None 
    
    try:
        # Extract the response
        all_data = format_response(response_data['response'])
        the_response = response_data['trace_data']
    except:
        all_data = "..." 
        the_response = "Apologies, but an error occurred. Please rerun the application" 

    # Use formatted_response as needed
    st.session_state['history'].append({"question": prompt, "answer": the_response})

if end_session_button:
    st.session_state['history'].append({"question": "Session Ended", "answer": "Thank you for using AnyCompany Support Agent!"})
    event = {
        "sessionId": "MYSESSION",
        "question": "placeholder to end session",
        "endSession": True
    }
    agenthelper.lambda_handler(event, None)
    st.session_state['history'].clear()

# Display conversation history
st.write("## Conversation History")

# Load images outside the loop to optimize performance
human_image = Image.open('imgs/human.png')
robot_image = Image.open('imgs/robot.png')
circular_human_image = crop_to_circle(human_image)
circular_robot_image = crop_to_circle(robot_image)

for index, chat in enumerate(reversed(st.session_state['history'])):
    chat_value = chat["answer"]

    # Creating columns for Question
    col1_q, col2_q, col3_q = st.columns([2, 10, 4])
    with col1_q:
        st.image(circular_human_image, width=125)
    with col2_q:
        # Generate a unique key for each question text area
        st.text_area(label="Question", value=chat["question"], height=68, key=f"question_{index}", disabled=True, label_visibility="collapsed")

    # Creating columns for Answer
    col1_a, col2_a, col3_a = st.columns([2, 10, 4])
    if isinstance(chat_value, pd.DataFrame):
        with col1_a:
            st.image(circular_robot_image, width=100)
        with col2_a:
            # Generate a unique key for each answer dataframe
            st.dataframe(chat_value, key=f"answer_df_{index}")

    else:
        with col1_a:
            st.image(circular_robot_image, width=125)
        with col2_a:
            # Generate a unique key for each answer text area
            st.text_area(label="Answer", value=chat_value, height=300, key=f"answer_{index}", label_visibility="collapsed")
        with col3_a:
            # Check if response contains a URL
            extracted_url = extract_url(chat_value)
            if extracted_url:
                st.audio(extracted_url, format='audio/mp3')
            else:
                if st.button("Generate Audio", key=index):
                    if chat_value:
                        filename = f"audio_{int(time.time())}.mp3"
                        
                        with st.spinner("Generating and uploading audio file..."):
                            success, s3_key = audio.generate_and_upload_audio(chat_value, filename)
                        
                        if success: 
                            st.success("Audio file is ready!")
                            st.balloons()
                            
                            # Generate a presigned URL for the S3 object
                            url = audio.generate_presigned_URL(s3_key)

                            # Display audio player
                            st.audio(url, format='audio/mp3')

                        else:
                            st.error("Failed to generate or upload audio file.")
                    else:
                        st.warning("There is no valid response.")


# Example Prompts Section
st.write("## Test KB, Action Group, History Prompt")
# Creating a list of prompts for the specific task
task_prompts = [
    {"Prompt": "What's the financial status of United Airline?"},
    {"Prompt":"what's the financial status of LuxuryToNiceLiving Real Estate? Create an audio file based on the result."},
    {"Prompt":"What are the key regulatory requirements for financial reporting compliance in the real estate industry?"},
    {"Prompt":"What are the current data privacy standards for companies handling sensitive customer information in the financial services sector? Generate audio response for hands-free and multitasking purposes."},
]
# Displaying the task prompt as a table
st.table(task_prompts)
