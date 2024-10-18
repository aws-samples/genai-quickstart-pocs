import streamlit as st
from quiz_generator.document_processor import load_documents_and_images
from quiz_generator.generator import generate_quiz_questions


st.title('Hello!')
st.file_uploader("Upload one or more files to create quiz questions.", type=["md", "txt","pdf", "doc","docx","csv"], accept_multiple_files=True, key="uploaded_files")
if st.button("Generate Quiz"):
    with st.spinner("Generating quiz..."):
        documents = load_documents_and_images(st.session_state.uploaded_files)
        quiz_questions = generate_quiz_questions(documents)
        st.json(quiz_questions.model_dump())