import json
import base64
import boto3
import io
from PIL import Image
from PyPDF2 import PdfReader
import fitz  # PyMuPDF
from pdf2image import convert_from_bytes
from typing import Dict, List, Any
import logging
import re

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_bedrock_client():
    """Initialize and return the Bedrock client"""
    try:
        return boto3.client('bedrock-runtime', region_name='us-west-2')
    except Exception as e:
        logger.error(f"Failed to initialize Bedrock client: {str(e)}")
        raise

class PDFDocument:
    def __init__(self, file_bytes):
        try:
            self.pdf_reader = PdfReader(io.BytesIO(file_bytes), strict=False)
            self.pages = []
            for page_num in range(len(self.pdf_reader.pages)):
                try:
                    page = self.pdf_reader.pages[page_num]
                    self.pages.append({
                        "text": self._extract_text(page),
                        "images": self._extract_images(page)
                    })
                except Exception as e:
                    logger.warning(f"Error processing page {page_num}: {str(e)}")
                    self.pages.append({
                        "text": "",
                        "images": []
                    })
        except Exception as e:
            logger.error(f"Error initializing PDF document: {str(e)}")
            raise

    def _extract_text(self, page) -> str:
        try:
            text = page.extract_text()
            return text if text else ""
        except Exception as e:
            logger.warning(f"Failed to extract text from page: {str(e)}")
            return ""

    def _extract_images(self, page) -> List:
        try:
            return page.images if hasattr(page, 'images') else []
        except Exception as e:
            logger.warning(f"Failed to extract images from page: {str(e)}")
            return []

    def image_content_block(self, pdf_image) -> Dict:
        try:
            image_bytes = pdf_image.data
            image = Image.open(io.BytesIO(image_bytes))
            
            buffered = io.BytesIO()
            image.convert('RGB').save(buffered, format="JPEG", quality=85)
            img_str = base64.b64encode(buffered.getvalue()).decode()
            
            return {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": img_str
                }
            }
        except Exception as e:
            logger.error(f"Error processing image: {str(e)}")
            return None

    def text_content_block(self, text: str) -> Dict:
        return {
            "type": "text",
            "text": text if text else ""
        }

    def get_content_blocks(self) -> List[Dict]:
        content = []
        current_text = ""

        try:
            for page_num, p in enumerate(self.pages):
                page_images = p['images']
                page_text = p['text']
                
                if page_text:
                    current_text += f"PAGE {page_num+1}\n\n{page_text}\n"
                
                if len(page_images) > 0:
                    if current_text:
                        content.append(self.text_content_block(current_text))
                        current_text = ""
                    for image in page_images:
                        image_block = self.image_content_block(image)
                        if image_block:
                            content.append(image_block)

            if current_text:
                content.append(self.text_content_block(current_text))

            if not content:
                raise ValueError("No content could be extracted from the PDF")

            return content
        except Exception as e:
            logger.error(f"Error getting content blocks: {str(e)}")
            raise

def get_analysis_prompt(doc_type: str) -> str:
    base_prompt = """Analyze this document and extract information with confidence scores. 
    Provide scores between 0 (lowest) and 1 (highest) for each extracted field.
    Focus on key information needed for financial institution verification.\n\n"""
    
    if doc_type == "ID Document":
        return base_prompt + """{
            "document_analysis": {
                "document_type": {"value": "specify type (driver's license/passport/passport card)", "confidence": 0.0},
                "issuing_authority": {"value": "authority name", "confidence": 0.0},
                "verification_status": {"value": "VERIFIED/NEEDS_VERIFICATION/UNVERIFIED", "confidence": 0.0}
            },
            "extracted_info": {
                "id_type": {"value": "driver's license/passport/passport card", "confidence": 0.0},
                "full_name": {"value": "full name as shown", "confidence": 0.0},
                "date_of_birth": {"value": "DOB", "confidence": 0.0},
                "document_number": {"value": "ID number", "confidence": 0.0},
                "issue_date": {"value": "date issued", "confidence": 0.0},
                "expiration_date": {"value": "expiration date", "confidence": 0.0},
                "address": {"value": "address if shown", "confidence": 0.0}
            }
        }"""
    elif "Bank Statement" in doc_type:
        return base_prompt + """{
            "document_analysis": {
                "issuing_authority": {"value": "bank name", "confidence": 0.0},
                "verification_status": {"value": "VERIFIED/NEEDS_VERIFICATION/UNVERIFIED", "confidence": 0.0}
            },
            "extracted_info": {
                "account_holder": {"value": "full name", "confidence": 0.0},
                "bank_name": {"value": "name of bank", "confidence": 0.0},
                "account_number": {"value": "last 4 digits only", "confidence": 0.0},
                "statement_period": {"value": "period covered", "confidence": 0.0},
                "address": {"value": "account holder's address", "confidence": 0.0}
            }
        }"""
    elif "Utility Bill" in doc_type:
        return base_prompt + """{
            "document_analysis": {
                "issuing_authority": {"value": "utility company", "confidence": 0.0},
                "verification_status": {"value": "VERIFIED/NEEDS_VERIFICATION/UNVERIFIED", "confidence": 0.0}
            },
            "extracted_info": {
                "utility_type": {"value": "type of utility", "confidence": 0.0},
                "utility_provider": {"value": "provider name", "confidence": 0.0},
                "customer_name": {"value": "full name", "confidence": 0.0},
                "service_address": {"value": "service address", "confidence": 0.0},
                "account_number": {"value": "account number", "confidence": 0.0},
                "bill_date": {"value": "date of bill", "confidence": 0.0}
            }
        }"""
    elif "Employment Verification" in doc_type:
        return base_prompt + """{
            "document_analysis": {
                "issuing_authority": {"value": "company name", "confidence": 0.0},
                "verification_status": {"value": "VERIFIED/NEEDS_VERIFICATION/UNVERIFIED", "confidence": 0.0}
            },
            "extracted_info": {
                "employee_info": {
                    "name": {"value": "employee full name", "confidence": 0.0},
                    "address": {"value": "employee address", "confidence": 0.0}
                },
                "company_info": {
                    "name": {"value": "company name", "confidence": 0.0},
                    "address": {"value": "company address", "confidence": 0.0}
                },
                "employment_details": {
                    "position": {"value": "job title", "confidence": 0.0},
                    "start_date": {"value": "employment start date", "confidence": 0.0},
                    "employment_status": {"value": "employment status", "confidence": 0.0}
                },
                "verification_details": {
                    "issue_date": {"value": "letter issue date", "confidence": 0.0},
                    "issuer_name": {"value": "name of person issuing letter", "confidence": 0.0},
                    "issuer_title": {"value": "title of person issuing letter", "confidence": 0.0},
                    "contact_info": {"value": "verification contact information", "confidence": 0.0}
                }
            }
        }"""
    elif "Pay Stub" in doc_type:
        return base_prompt + """{
            "document_analysis": {
                "issuing_authority": {"value": "company name", "confidence": 0.0},
                "verification_status": {"value": "VERIFIED/NEEDS_VERIFICATION/UNVERIFIED", "confidence": 0.0}
            },
            "extracted_info": {
                "employee_info": {
                    "name": {"value": "employee full name", "confidence": 0.0},
                    "id": {"value": "employee ID if shown", "confidence": 0.0},
                    "address": {"value": "employee address if shown", "confidence": 0.0}
                },
                "company_info": {
                    "name": {"value": "company name", "confidence": 0.0},
                    "address": {"value": "company address", "confidence": 0.0},
                    "ein": {"value": "employer identification number if shown", "confidence": 0.0}
                },
                "pay_period": {
                    "start_date": {"value": "period start date", "confidence": 0.0},
                    "end_date": {"value": "period end date", "confidence": 0.0},
                    "pay_date": {"value": "date paid", "confidence": 0.0}
                },
                "earnings": {
                    "gross_pay": {"value": "gross pay amount", "confidence": 0.0},
                    "net_pay": {"value": "net pay amount", "confidence": 0.0},
                    "ytd_gross": {"value": "year-to-date gross", "confidence": 0.0},
                    "ytd_net": {"value": "year-to-date net", "confidence": 0.0},
                    "regular_hours": {"value": "regular hours worked", "confidence": 0.0},
                    "regular_rate": {"value": "regular pay rate", "confidence": 0.0},
                    "overtime_hours": {"value": "overtime hours if any", "confidence": 0.0},
                    "overtime_rate": {"value": "overtime rate if any", "confidence": 0.0}
                },
                "deductions": {
                    "federal_tax": {"value": "federal tax withheld", "confidence": 0.0},
                    "state_tax": {"value": "state tax withheld", "confidence": 0.0},
                    "social_security": {"value": "social security withheld", "confidence": 0.0},
                    "medicare": {"value": "medicare withheld", "confidence": 0.0},
                    "other": {"value": "other deductions", "confidence": 0.0}
                }
            }
        }"""

def process_document(bedrock_client, uploaded_file, doc_type: str) -> Dict:
    """Process a document for authentication and information extraction"""
    try:
        if not uploaded_file:
            logger.error("No file uploaded")
            return {
                "document_name": "No file",
                "full_analysis": {"error": "No file uploaded"}
            }

        file_bytes = uploaded_file.getvalue()
        file_size = len(file_bytes)
        logger.info(f"Processing {doc_type} - File size: {file_size} bytes")

        if file_size > 5_000_000:  # 5MB limit
            logger.warning("File size too large")
            raise ValueError("File size too large. Please upload a smaller file.")

        # Special handling for utility bills and pay stubs
        if doc_type in ["Pay Stub", "Utility Bill"]:
            try:
                if uploaded_file.type == 'application/pdf':
                    logger.info(f"Converting {doc_type} PDF to image")
                    try:
                        # First attempt with PyMuPDF
                        pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
                        first_page = pdf_document[0]
                        zoom = 2  # Increase zoom for higher resolution
                        mat = fitz.Matrix(zoom, zoom)
                        pix = first_page.get_pixmap(matrix=mat)
                        img_data = pix.tobytes("png")
                        image = Image.open(io.BytesIO(img_data))
                        logger.info("Successfully converted PDF to image using PyMuPDF")
                    except Exception as e:
                        logger.warning(f"PyMuPDF conversion failed: {str(e)}, trying pdf2image")
                        # Fallback to pdf2image
                        images = convert_from_bytes(file_bytes, dpi=200)
                        image = images[0]
                        logger.info("Successfully converted PDF to image using pdf2image")
                else:
                    image = Image.open(io.BytesIO(file_bytes))
                    logger.info(f"Processing {doc_type} as direct image")

                # Process the image
                buffered = io.BytesIO()
                image = image.convert('RGB')
                
                # Resize if needed while maintaining quality
                max_size = (2000, 2000)
                if image.size[0] > max_size[0] or image.size[1] > max_size[1]:
                    image.thumbnail(max_size, Image.Resampling.LANCZOS)
                
                image.save(buffered, format="PNG", optimize=True)
                img_str = base64.b64encode(buffered.getvalue()).decode()
                
                content_blocks = [{
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": img_str
                    }
                }]
                logger.info(f"Successfully created content blocks for {doc_type}")

            except Exception as e:
                logger.error(f"{doc_type} processing error: {str(e)}")
                raise ValueError(f"Error processing {doc_type}: {str(e)}")

        else:
            # Standard processing for other document types
            if uploaded_file.type == 'application/pdf':
                try:
                    pdf_doc = PDFDocument(file_bytes)
                    content_blocks = pdf_doc.get_content_blocks()
                    logger.info("Successfully processed PDF document")
                except Exception as e:
                    logger.error(f"PDF processing error: {str(e)}")
                    raise ValueError(f"Error processing PDF: {str(e)}")
            else:
                try:
                    image = Image.open(io.BytesIO(file_bytes))
                    buffered = io.BytesIO()
                    image.convert('RGB').save(buffered, format="JPEG", quality=85)
                    img_str = base64.b64encode(buffered.getvalue()).decode()
                    
                    content_blocks = [{
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": img_str
                        }
                    }]
                    logger.info("Successfully processed image document")
                except Exception as e:
                    logger.error(f"Image processing error: {str(e)}")
                    raise ValueError(f"Error processing image: {str(e)}")

        # Add analysis prompt
        prompt = get_analysis_prompt(doc_type)
        content_blocks.insert(0, {
            "type": "text",
            "text": prompt
        })

        # Create the message
        messages = [{
            "role": "user",
            "content": content_blocks
        }]

        # Create the request body
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "messages": messages,
            "temperature": 0.2
        }

        logger.info(f"Sending request to Bedrock for {doc_type}")

        try:
            # Call Bedrock's InvokeModel API
            response = bedrock_client.invoke_model(
                modelId="anthropic.claude-3-sonnet-20240229-v1:0",
                body=json.dumps(body)
            )

            # Parse the response
            response_body = json.loads(response['body'].read())
            response_text = response_body['content'][0]['text']
            
            logger.debug(f"Raw response from Claude: {response_text}")
            print("Raw response from Claude:", response_text)

            try:
                # Find the JSON part in the response
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                if json_start != -1 and json_end > json_start:
                    json_str = response_text[json_start:json_end]
                    analysis = json.loads(json_str)
                else:
                    raise ValueError("No JSON found in response")

                if not analysis or not analysis.get("extracted_info"):
                    raise ValueError("No information extracted from the document")
                
                logger.info("Successfully extracted information from response")
                logger.debug(f"Extracted analysis: {json.dumps(analysis, indent=2)}")
                
            except Exception as e:
                logger.error(f"JSON parsing error: {str(e)}")
                logger.error(f"Raw response: {response_text}")
                raise ValueError(f"Error parsing response: {str(e)}")

            return {
                "document_name": uploaded_file.name,
                "full_analysis": analysis
            }

        except Exception as e:
            logger.error(f"API or parsing error: {str(e)}")
            raise ValueError(f"Error processing document with API: {str(e)}")

    except Exception as e:
        logger.error(f"Error processing document: {str(e)}")
        return {
            "document_name": uploaded_file.name if uploaded_file else "Unknown",
            "full_analysis": {"error": str(e)}
        }