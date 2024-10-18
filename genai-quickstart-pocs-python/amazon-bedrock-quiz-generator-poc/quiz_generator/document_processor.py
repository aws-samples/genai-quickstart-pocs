import os
import logging
from langchain_core.documents import Document
from langchain_community.document_loaders import (
    PyPDFLoader,
    Docx2txtLoader,
    CSVLoader,
    UnstructuredMarkdownLoader,
    TextLoader,
)
from langchain_community.document_loaders.image import UnstructuredImageLoader
from uuid import uuid4



temp_storage_path = os.path.join(os.path.dirname(__file__), "../temp")

def load_documents_and_images(uploaded_files: list) -> list[Document]:
    """
    Loads documents and images from the specified file paths.

    Returns:
        LoadedDocuments: An instance of LoadedDocuments containing the loaded documents and images.
    """
    print("Loading documents")
    documents = []
    for file in uploaded_files:
        print(f"Processing file {file.name}")
        uploaded_file_name = file.name
        file_path = persist_document_file(file.getvalue())
        if uploaded_file_name.endswith(".pdf"):
            docs = load_pdf_document(file_path)
            documents.extend(docs)
        elif uploaded_file_name.endswith(".docx") or uploaded_file_name.endswith(".doc"):
            docs = load_docx_document(file_path)
            documents.extend(docs)
        elif uploaded_file_name.endswith(".csv"):
            docs = load_csv_document(file_path)
            documents.extend(docs)
        elif uploaded_file_name.endswith(".md"):
            docs = load_markdown_document(file_path)
            documents.extend(docs)
        # elif uploaded_file_name.endswith(".jpg") or uploaded_file_name.endswith(".png"):
        #     docs = load_image(file_path)
        #     documents.extend(docs)
        # elif uploaded_file_name.endswith(".txt"):
        #     docs = load_text_document(file_path)
        #     documents.extend(docs)
    print(f"Loaded {len(documents)} documents")
    print(documents)
    return documents


def persist_document_file(file_bytes) -> str:
    """
    Persists the uploaded file to disk and returns the file path.
    """
    file_name = str(uuid4())
    file_path = os.path.join(temp_storage_path, file_name)
    with open(file_path, "wb") as f:
        f.write(file_bytes)
    return file_path


def load_pdf_document(file_path: str) -> list[Document]:
    """
    Loads the text content from a PDF document.

    Args:
        file_path (str): The file path of the PDF document.

    Returns:
        list[Document]: A list of Document objects containing the extracted text content.
    """
    print(f"Loading text from PDF {file_path}")
    loader = PyPDFLoader(file_path)
    docs = loader.load()
    return docs


def load_docx_document(docx_file_path: str):
    """
    Loads text data from a DOCX file
    """
    print(f"Loading text from DOC/DOCX {docx_file_path}")
    loader = Docx2txtLoader(docx_file_path)
    docs = loader.load()
    return docs


def load_csv_document(csv_file_path: str):
    """
    Loads text data from a CSV file
    """
    print(f"Loading text from CSV {csv_file_path}")
    loader = CSVLoader(csv_file_path)
    docs = loader.load()
    return docs


def load_markdown_document(markdown_file_path: str):
    """
    Loads text data from a Markdown file
    """
    print(f"Loading text from Markdown {markdown_file_path}")
    loader = UnstructuredMarkdownLoader(markdown_file_path)
    docs = loader.load()
    return docs


def load_text_document(text_file_path: str):
    """
    Loads text data from a text file
    """
    print(f"Loading text from Text {text_file_path}")
    loader = TextLoader(text_file_path)
    docs = loader.load()
    return docs

def load_image(image_file_path: str):
    """
    Loads image data from an image file
    """
    print(f"Loading image {image_file_path}")
    loader = UnstructuredImageLoader(image_file_path)
    docs = loader.load()
    return docs
