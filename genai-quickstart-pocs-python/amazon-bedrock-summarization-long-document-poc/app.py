import streamlit as st
from pathlib import Path
import os
from doc_summarizer import Chunk_and_Summarize
import time
from dotenv import load_dotenv

# load environment variables
load_dotenv()
# title of the streamlit app
st.title(f""":rainbow[Long Document Summarization with Amazon Bedrock]""")

# default container that houses the document upload field
with st.container():
    # header that is shown on the web UI
    st.header('Single File Upload')
    # the file upload field, the specific ui element that allows you to upload the file
    File = st.file_uploader('Upload a file', type=["pdf"], key="new")
    # when a file is uploaded it saves the file to the directory, creates a path, and invokes the
    # Chunk_and_Summarize Function
    if File is not None:
        # determine the path to temporarily save the PDF file that was uploaded
        save_folder = os.getenv("save_folder")
        # create a posix path of save_folder and the file name
        save_path = Path(save_folder, File.name)
        # write the uploaded PDF to the save_folder you specified
        with open(save_path, mode='wb') as w:
            w.write(File.getvalue())
        # once the save path exists...
        if save_path.exists():
            # write a success message saying the file has been successfully saved
            st.success(f'File {File.name} is successfully saved!')
            # creates a timer to time the length of the summarization task and starts the timer
            start = time.time()
            # running the summarization task, and outputting the results to the front end
            st.write(Chunk_and_Summarize(save_path))
            # ending the timer
            end = time.time()
            # using the timer, we calculate the minutes and seconds it took to perform the summarization task
            seconds = int(((end - start) % 60))
            minutes = int((end - start) // 60)
            # string to highlight the amount of time taken to complete the summarization task
            total_time = f"""Time taken to generate a summary:
            Minutes: {minutes} Seconds: {round(seconds, 2)}"""
            # sidebar is created to display the total time taken to complete the summarization task
            with st.sidebar:
                st.header(total_time)
            # removing the PDF that was temporarily saved to perform the summarization task
            os.remove(save_path)
