import streamlit as st
from quiz_generator.document_processor import load_documents_and_images
from quiz_generator.generator import generate_quiz_questions, generate_quiz_title
from quiz_generator.html_generator import render_quiz


st.title("Welcome to the Quiz Generator")
st.write(
    "Select how many questions you want generated and upload one or more documents you'd like to use for the quiz."
)
num_questions = st.number_input(
    "Number of Questions",
    min_value=1,
    max_value=100,
    value=25,
    step=5,
    key="num_questions",
)
st.file_uploader(
    "Upload one or more files to create quiz questions.",
    type=["md", "txt", "pdf", "doc", "docx", "csv", "png", "jpeg", "jpg"],
    accept_multiple_files=True,
    key="uploaded_files",
)
if st.button("Generate Quiz"):
    with st.spinner("Generating quiz..."):
        documents, images = load_documents_and_images(st.session_state.uploaded_files)
        quiz_questions = generate_quiz_questions(documents, images, num_questions)
        quiz_title = generate_quiz_title(documents, images)
        quiz_download = render_quiz(quiz_questions, quiz_title)
        st.download_button("Download Quiz", quiz_download, file_name="quiz.html")
