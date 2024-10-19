import streamlit as st
from idp.bedrock_utils import chat_with_bedrock, chat_with_multimodal, encode_image_to_base64
from idp.s3_utils import list_files_in_s3

# Streamlit app title
st.title(f""":rainbow[Document Q&A with Amazon Bedrock]""")
st.write("Select an option below to ask questions about the document using the enriched text output or with Amazon Bedrock's multimodal capabilities:")

# Ensure messages are stored in the session state
if "messages" not in st.session_state:
    st.session_state.messages = []

# Provide options to user for Q&A method
option = st.radio(
    "Choose Q&A method:",
    ('Ask questions about the document using contents from output/enriched_output.txt file', 
     'Ask questions about the document using multimodal model')
)

# Clear messages on screen if selectedoption changes
if st.session_state.messages and st.session_state.option != option:
    st.session_state.messages = []

# Store current option in session state
st.session_state.option = option

# If user selected multimodal option, then list files from the S3 bucket above the chat history
if option == 'Ask questions about the document using multimodal model':
    # List files in S3 and allow user to select one
    files = list_files_in_s3()
    selected_file = st.selectbox("Select an image from S3 to process:", files)
    if selected_file:
         encoded_image = encode_image_to_base64(selected_file)

# Display the messages stored in session state 
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# If user selected text option, then answer questions from the local file
if option == 'Ask questions about the document using contents from output/enriched_output.txt file':
    # Read the enriched document text from file
    with open("output/enriched_output.txt", "r", encoding="utf-8") as file:
        file_text = file.read()
    # Display chat input for user question
    if question := st.chat_input("Ask a question about the document..."):
        # Show the user's message
        with st.chat_message("user"):
            st.markdown(question)
        # Store the user message in session state
        st.session_state.messages.append({"role": "user", "content": question})
        # Generate the response from Bedrock
        with st.chat_message("assistant"):
            message_placeholder = st.empty()
            with st.spinner("Determining the best possible answer..."):
                combined_prompt = f"\nDocument:\n{file_text}\n\nQuestion:\n{question}"
                answer = chat_with_bedrock(combined_prompt)
                message_placeholder.markdown(answer)  # Display the response
        # Store the assistant's response in session state
        st.session_state.messages.append({"role": "assistant", "content": answer})

# If user selected multimodal option, then answer questions from the S3 bucket
elif option == 'Ask questions about the document using multimodal model':
    # Display chat input for user question
    if question := st.chat_input("Ask a question about the document..."):
        # Show the user's message
        with st.chat_message("user"):
            st.markdown(question)
        # Store the user message in session state
        st.session_state.messages.append({"role": "user", "content": question})
        # Generate the response from Bedrock
        with st.chat_message("assistant"):
            message_placeholder = st.empty()  # Placeholder for response
            with st.spinner("Determining the best possible answer..."):
                prompt = f"Question:\n{question}"
                answer = chat_with_multimodal(encoded_image, prompt)
                message_placeholder.markdown(answer)  # Display the response
        # Store the assistant's response in session state
        st.session_state.messages.append({"role": "assistant", "content": answer})
