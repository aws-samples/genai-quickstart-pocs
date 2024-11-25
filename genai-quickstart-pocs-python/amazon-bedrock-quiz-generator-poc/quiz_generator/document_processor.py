import os
from langchain_core.documents import Document
from langchain_community.document_loaders import (
    PyPDFLoader,
    Docx2txtLoader,
    CSVLoader,
    UnstructuredMarkdownLoader,
    TextLoader,
)
from langchain_community.document_loaders import AmazonTextractPDFLoader

from uuid import uuid4
import base64


temp_storage_path = os.path.join(os.path.dirname(__file__), "../temp")


def load_documents_and_images(uploaded_files: list) -> {list[Document], list[str]}:
    """
    Loads documents and images from the specified file paths.

    Returns:
        LoadedDocuments: An instance of LoadedDocuments containing the loaded documents and images.
    """
    print("Loading documents & images")
    documents = []
    images = []
    for file in uploaded_files:
        print(f"Processing file {file.name}")
        uploaded_file_name = file.name
        file_path = persist_document_file(file.getvalue(), uploaded_file_name)
        if uploaded_file_name.endswith(".pdf"):
            docs = load_pdf_document(file_path)
            documents.extend(docs)
        elif uploaded_file_name.endswith(".docx") or uploaded_file_name.endswith(
            ".doc"
        ):
            docs = load_docx_document(file_path)
            documents.extend(docs)
        elif uploaded_file_name.endswith(".csv"):
            docs = load_csv_document(file_path)
            documents.extend(docs)
        elif uploaded_file_name.endswith(".md"):
            docs = load_markdown_document(file_path)
            documents.extend(docs)
        elif (
            uploaded_file_name.endswith(".jpg")
            or uploaded_file_name.endswith(".jpeg")
            or uploaded_file_name.endswith(".png")
        ):
            docs = load_image(file_path)
            documents.extend(docs)
        elif uploaded_file_name.endswith(".txt"):
            docs = load_text_document(file_path)
            documents.extend(docs)
        delete_file(file_path)
    print(f"Loaded {len(documents)} documents")
    return documents, images


def persist_document_file(file_bytes, uploaded_file_name) -> str:
    """
    Persists the uploaded file to disk and returns the file path.
    """
    file_name = str(uuid4())
    file_path = os.path.join(
        temp_storage_path, f"{file_name}.{uploaded_file_name.split('.')[-1]}"
    )
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
    if len(docs) > 25:
        raise ValueError(
            "PDF document contains too many pages to generate a Quiz without advanced chunking techniques. Try a smaller set of text."
        )
    return docs


def load_docx_document(docx_file_path: str):
    """
    Loads text data from a DOCX file
    """
    print(f"Loading text from DOC/DOCX {docx_file_path}")
    loader = Docx2txtLoader(docx_file_path)
    docs = loader.load()
    if len(docs) > 25:
        raise ValueError(
            "DOC/DOCX document contains too many pages to generate a Quiz without advanced chunking techniques. Try a smaller set of text."
        )
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


def load_image(image_path: str):
    """
    Loads an image from bytes
    """
    loader = AmazonTextractPDFLoader(image_path)
    return loader.load()

def delete_file(filepath):
    """
    Deletes the file and all empty parent directories up to /temp/
    
    Args:
        filepath: Path to file to delete
        
    Example:
        For path 'ABC/temp/dir1/file.pdf':
        - Deletes file.pdf
        - Removes dir1 if empty
        - Stops at temp directory
    """
    if not os.path.exists(filepath):
        return
        
    # Delete the file first
    os.remove(filepath)
    
    # Get directory containing the file
    current_dir = os.path.dirname(filepath)
    
    # Keep deleting parent dirs until we hit 'temp' or root
    while current_dir and os.path.basename(current_dir) != 'temp':
        try:
            os.rmdir(current_dir)  # Only removes if empty
            current_dir = os.path.dirname(current_dir)
        except OSError:
            # Directory not empty or other error, stop here
            break