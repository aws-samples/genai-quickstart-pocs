import streamlit as st
from pathlib import Path
import os
import image_analysis as helper
import time

save_folder="./images"

# title of the streamlit app
st.title(f""":rainbow[Image Analysis with Amazon Bedrock]""")

# default container that houses the document upload field
with st.container():
    # header that is shown on the web UI
    st.header('Single File Upload')
    # the file upload field, the specific ui element that allows you to upload the file
    File = st.file_uploader('Upload a file', type=["jpeg"], key="new")
    # when a file is uploaded it saves the file to the directory, creates a path, and invokes the
    # analyze image function
    if File is not None:
        # determine the path to temporarily save the PDF file that was uploaded
        #save_folder = os.getenv("save_folder")
        save_folder = save_folder
        # create a posix path of save_folder and the file name
        save_path = Path(save_folder, File.name)
        # write the uploaded PDF to the save_folder you specified
        with open(save_path, mode='wb') as w:
            w.write(File.getvalue())
        # once the save path exists...
        if save_path.exists():
            # write a success message saying the file has been successfully saved
            st.success(f'File {File.name} is successfully saved!')
            st.balloons()
            # creates a timer to time the length of the  task and starts the timer
            #start = time.time()
            # running the task, and outputting the results to the front end
            st.write(helper.analyze_image(save_path))
            # removing the image that was temporarily saved to perform the  task
            os.remove(save_path)