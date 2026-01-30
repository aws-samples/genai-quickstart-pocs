import streamlit as st  # Import the Streamlit library for building web apps
from extract_pdf_to_json import pdf_processing  # Import the pdf_processing function from the extract_pdf_to_json module

# Setup Streamlit
st.set_page_config(page_title="Extraction", page_icon=":tada", layout="wide")  # Set the page configuration for the Streamlit app
st.title(f":rainbow[Extract Financial KPI's from Earnings Report]")  # Display the title of the app
# Create a container for the file uploader and button
with st.container():
    st.write("---")  # Add a horizontal line separator
    uploaded_file = st.file_uploader('Upload a .pdf file', type="pdf")  # Create a file uploader for PDF files
    st.write("---")  # Add another horizontal line separator

go = st.button("Go!")  # Create a button labeled "Go!"

# Check if the "Go!" button is clicked
if go:
    st.balloons()  # Display balloons animation
    pdf_processing(uploaded_file)  # Call the pdf_processing function with the uploaded file
