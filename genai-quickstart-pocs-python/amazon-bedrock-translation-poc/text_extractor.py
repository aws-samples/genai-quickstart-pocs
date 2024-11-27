import PyPDF2
from docx import Document

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
            pdf_reader = PyPDF2.PdfReader(file)
            
            # Iterate through each page
            for page in pdf_reader.pages:
                # Extract text from the page and append to array
                text_by_page.append(page.extract_text())
                
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