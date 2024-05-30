import streamlit as st
from pathlib import Path
import os
import time
from dotenv import load_dotenv
from csv_data_insights import chat_with_csv, csv_to_text_analysis, parse_xml


# load environment variables
load_dotenv()
# title of the streamlit app
st.title(f""":rainbow[Amazon Bedrock: CSV Data Insights]""")

# default container that houses the document upload field
with st.container():
    # header that is shown on the web UI
    st.header('Single File Upload')
    # the file upload field, the specific ui element that allows you to upload the file
    File = st.file_uploader('Upload a CSV file', type=["csv"], key="new")
    # when a file is uploaded it saves the file to the directory, creates a path, and invokes the
    # chat_with_csv function
    if File is not None:
        # determine the path to temporarily save the CSV file that was uploaded
        save_folder = os.getenv("save_folder")
        # create a posix path of save_folder and the file name
        save_path = Path(save_folder, File.name)
        # write the uploaded CSV to the save_folder you specified
        with open(save_path, mode='wb') as w:
            w.write(File.getvalue())
        # once the save path exists...
        if save_path.exists():
            # read in the csv and write a success message saying the file has been successfully saved
            st.success(f'File {File.name} is successfully saved!')
            st.write(File.name)
            csv_data = File.read()

            #Ask for the subject so that it can be passed into to prompt when invoking model
            csv_subject = st.text_input("What is the subject of your csv file (provide 1-2 word answer if applicable)")

            # Button to analyze CSV data
            analyze_button = st.button("Analyze CSV")
            if analyze_button:
                # Convert CSV data to text format
                results = csv_to_text_analysis(csv_data, csv_subject)
                # Extract description and insights from the text
                description = parse_xml(results, "description")
                insights = parse_xml(results, "insights")

                # Display description and insights
                st.write(f"Description: {description}")       
                st.write(f"Insights:")
                st.write(insights)
            
            # Text input for user questions
            user_question = st.text_input("Ask a question about the CSV data")
            if user_question:
                # Generate an answer for the user's question using a chatbot
                response = chat_with_csv(csv_data, user_question, csv_subject)
                # Extract the answer from the response
                output = response[0]['text']
                # Replace underscores with spaces for better readability
                output = output.replace('_', '')
                # Display the answer
                st.write(output)

            # removing the CSV that was temporarily saved
            os.remove(save_path)