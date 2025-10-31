import logging
import os
from typing import Dict
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader

logger = logging.getLogger(__name__)

temp_storage_path = os.path.join(os.path.dirname(__file__), "../temp")


def load_documents(
    files: list[Dict],
    write_callback=None,
):
    """
    Process and extracts data from uploaded files for use with RAG
    """
    try:
        logger.info("Loading documents")
        if write_callback:
            write_callback("Loading provided documents")
        loaded_documents = []
        # Write bytes to file
        for file in files:
            if write_callback:
                write_callback(f"Processing file: {file['file_name']}")
            file_path = os.path.join(temp_storage_path, file["file_name"])
            with open(file_path, "wb") as f:
                f.write(file["file_bytes"])
            if file["file_name"].endswith(".pdf"):
                document_data = extract_pdf_document(file_path)
                loaded_documents.append(document_data is not None)
            elif file["file_name"].endswith(".doc") or file["file_name"].endswith(
                ".docx"
            ):
                document_data = extract_docx_document(file_path)
                loaded_documents.append(document_data is not None)
            os.remove(file_path)
        return loaded_documents
    except Exception as e:
        logger.error(f"Error loading documents: {e}")
        return []


def extract_pdf_document(pdf_file_path: str):
    """
    Extracts text data from a PDF file
    """
    logger.info(f"Extracting text from PDF {pdf_file_path}")
    loader = PyPDFLoader(pdf_file_path)
    docs = loader.load()
    return docs


def extract_docx_document(docx_file_path: str):
    """
    Extracts text data from a DOCX file
    """
    logger.info(f"Extracting text from DOC/DOCX {docx_file_path}")
    loader = Docx2txtLoader(docx_file_path)
    docs = loader.load()
    return docs
