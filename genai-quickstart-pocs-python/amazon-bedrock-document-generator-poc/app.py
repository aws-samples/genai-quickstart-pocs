import streamlit as st
from document_generator import generate_doc, refine_doc

# Title displayed on the Streamlit Web App
st.set_page_config(page_title="Document Generator", page_icon=":tada", layout="wide")

# Header and Subheader dsiplayed in the Web App
with st.container():
    # setting the header of the application
    st.header("Press Release Document Generation Assistant")
    # adding some spacing between headers
    st.subheader("")
    # setting the larger description of the application
    st.title("Add details about the document you want to create")

# Setup
with st.container():
    # configuring the first section to input the details you want the document to be generated based on
    st.write("---")
    st.write("")
    # the actual user input box where users can input the details for their document
    user_input = st.text_area("Document Details")

# Saving LLM response as variable
temp_llm_response = ""

# Create Buttons and start document generation workflow upon "Submit"
result = st.button("Generate Document")
# if a result is created by the LLM...
if result:
    # save the response as the llm_response
    llm_response = generate_doc(user_input)
    # write the LLM response to the front end so the user can see the first iteration
    st.markdown(llm_response)
    # store the LLM response as the temporary llm response as this will be used to refine later
    temp_llm_response = llm_response
# add a line of spacing in the front end app
st.write("---")

# Create Buttons and start the document refine workflow upon "Submit"
user_refine = st.text_area("Add adjustments and recommendations")
# configuring the second button to perform document refinement
result2 = st.button("Refine the Document")
# if the second "refine the document" button is clicked..
if result2:
    # call the refine document method, pass in the previously generated document along with the users input on what to refine
    llm_refine_response = refine_doc(temp_llm_response, user_refine)
    # write the refined response to the front end
    st.markdown(llm_refine_response)
