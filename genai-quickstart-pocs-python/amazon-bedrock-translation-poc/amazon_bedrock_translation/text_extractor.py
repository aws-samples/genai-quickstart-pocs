import pypdf
from docx import Document

def extract_text(file_path):
    """
    Extract text from a file based on its extension
    
    Args:
        file_path (str): Path to the file
        
    Returns:
        list or str: Extracted text content
    """
    file_extension = file_path.lower().split('.')[-1]
    
    if file_extension == 'pdf':
        return extract_text_from_pdf(file_path)
    elif file_extension == 'docx':
        return extract_text_from_docx(file_path)
    elif file_extension == 'txt':
        return extract_text_from_txt(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_extension}")

def extract_text_from_pdf(pdf_path):
    """
    Extract text from a PDF file, returning an array with text content of each page
    
    Args:
        pdf_path (str): Path to the PDF file
        
    Returns:
        list: Array of strings, where each string contains the text of one page
    """
    text_by_page = []
    
    try:
        # Open the PDF file in binary mode
        with open(pdf_path, 'rb') as file:
            # Create a PDF reader object
            pdf_reader = pypdf.PdfReader(file)
            
            # Iterate through each page
            for page in pdf_reader.pages:
                # Extract text from the page, trim whitespace, and append to array
                text = page.extract_text().strip()
                if text:  # Only append if text is not empty
                    text_by_page.append(text)
                
        return text_by_page
    
    except Exception as e:
        print(f"Error extracting text from PDF: {str(e)}")
        return []

def extract_text_from_docx(docx_path):
    """
    Extract text from a Word document, returning an array with text content of each page
    
    Args:
        docx_path (str): Path to the Word document
        
    Returns:
        list: Array of strings, where each string contains the text of one page
    """
    try:
        text_by_page = []
        
        doc = Document(docx_path)
        current_page = []
        
        for para in doc.paragraphs:
            if len(para.text.strip()) > 0:
                current_page.append(para.text)
            if len(''.join(current_page)) > 3000:  # Approximate page break
                text_by_page.append('\n'.join(current_page))
                current_page = []
                
        if current_page:
            text_by_page.append('\n'.join(current_page))
            
        return text_by_page
        
    except Exception as e:
        print(f"Error extracting text from Word document: {str(e)}")
        return []

def extract_text_from_txt(txt_file):
    """
    Extract text from a text file
    
    Args:
        txt_file (FileStorage): The text file to extract text from
    
    Returns:
        """
    with open(txt_file, 'r') as file:
        return file.read()