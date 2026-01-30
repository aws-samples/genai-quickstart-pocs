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
    max_value=1000,
    value=25,
    step=5,
    key="num_questions",
)
st.caption("*It's recommended the number of questions be relative to the amount of content uploaded. For example, a 1-page document with 150 questions may not be ideal.*")
st.file_uploader(
    "Upload one or more files to create quiz questions.",
    type=["md", "txt", "pdf", "doc", "docx", "csv", "png", "jpeg", "jpg"],
    accept_multiple_files=True,
    key="uploaded_files",
)

def process_large_document():
    """Process large document with progress tracking"""
    status_text = st.empty()
    
    def update_status(message: str):
        status_text.text(message)
    
    documents, images = load_documents_and_images(st.session_state.uploaded_files)
    update_status("Documents loaded, starting quiz generation...")
    
    quiz_questions = generate_quiz_questions(
        documents, 
        images, 
        num_questions, 
        status_callback=update_status
    )
    
    update_status("Generating quiz title...")
    quiz_title = generate_quiz_title(quiz_questions)
    
    update_status("Quiz generation complete!")
    return quiz_questions, quiz_title

if st.button("Generate Quiz"):
    with st.spinner("Generating quiz..."):
        quiz_questions, quiz_title = process_large_document()
        st.success("Quiz generated successfully!")
        quiz_download = render_quiz(quiz_questions, quiz_title)
        st.download_button("Download Quiz", quiz_download, file_name="quiz.html")
