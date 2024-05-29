import streamlit as st
from pathlib import Path
import os
from doc_comparer import doc_compare
from dotenv import load_dotenv

# load environment variables
load_dotenv()
# title of the streamlit app
st.title(f""":rainbow[Long Document Summarization with Amazon Bedrock]""")

# default container that houses the document upload field
with st.container():
    # header that is shown on the web UI
    st.header('Single File Upload')
    # the first file upload field, the specific ui element that allows you to upload file 1
    File1 = st.file_uploader('Upload File 1', type=["pdf"], key="doc_1")
    # the second file upload field, the specific ui element that allows you to upload file 2
    File2 = st.file_uploader('Upload File 2', type=["pdf"], key="doc_2")
    # when both files are uploaded it saves the files to the directory, creates a path, and invokes the
    # doc_compare Function
    if File1 and File2 is not None:
        # determine the path to temporarily save the PDF file that was uploaded
        save_folder = os.getenv('save_folder')
        # create a posix path of save_folder and the first file name
        save_path_1 = Path(save_folder, File1.name)
        # create a posix path of save_folder and the second file name
        save_path_2 = Path(save_folder, File2.name)
        # write the first uploaded PDF to the save_folder you specified
        with open(save_path_1, mode='wb') as w:
            w.write(File1.getvalue())
        # write the second uploaded PDF to the save_folder you specified
        with open(save_path_2, mode='wb') as w:
            w.write(File2.getvalue())
        # once the save path exists for both documents you are trying to compare...
        if save_path_1.exists() and save_path_2.exists():
            # write a success message saying the first file has been successfully saved
            st.success(f'File {File1.name} is successfully saved!')
            # write a success message saying the second file has been successfully saved
            st.success(f'File {File2.name} is successfully saved!')
            # running the document comparison task, and outputting the results to the front end
            st.write(doc_compare(save_path_1, save_path_2))
            # removing the first PDF that was temporarily saved to perform the comparison task
            os.remove(save_path_1)
            # removing the second PDF that was temporarily saved to perform the comparison task
            os.remove(save_path_2)