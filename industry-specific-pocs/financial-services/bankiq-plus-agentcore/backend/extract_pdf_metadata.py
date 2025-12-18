#!/usr/bin/env python3
"""
Extract bank name, document type, and year from SEC filing PDFs
"""
import sys
import json
import base64
import re
from io import BytesIO
from PyPDF2 import PdfReader

def extract_metadata(pdf_base64, filename):
    """
    Extract bank name, form type, and year from first page of PDF
    """
    try:
        # Decode base64 to bytes
        pdf_bytes = base64.b64decode(pdf_base64)
        pdf_file = BytesIO(pdf_bytes)
        
        # Read PDF
        reader = PdfReader(pdf_file)
        
        # Extract text from first 3-5 pages (cover page might not have the info)
        combined_text = ""
        pages_to_check = min(5, len(reader.pages))
        for i in range(pages_to_check):
            combined_text += reader.pages[i].extract_text() + "\n\n"
        
        # Debug: Write to a debug file
        import sys
        try:
            with open('/tmp/pdf_debug.txt', 'w') as f:
                f.write(f"Filename: {filename}\n")
                f.write(f"Total pages: {len(reader.pages)}\n")
                f.write(f"First 3000 chars from first {pages_to_check} pages:\n{combined_text[:3000]}\n")
        except:
            pass
        
        # Also try to get metadata
        metadata = reader.metadata if reader.metadata else {}
        
        # Extract bank name from combined text
        bank_name = extract_bank_name(combined_text, filename)
        print(f"DEBUG: Extracted bank name: {bank_name}", file=sys.stderr)
        
        # Extract form type (10-K, 10-Q, etc.)
        form_type = extract_form_type(combined_text, filename)
        
        # Extract year
        year = extract_year(combined_text, filename)
        
        return {
            'success': True,
            'bank_name': bank_name,
            'form_type': form_type,
            'year': year,
            'filename': filename,
            'pages': len(reader.pages)
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'filename': filename
        }

def extract_bank_name(text, filename):
    """
    Extract bank/company name from PDF text
    Common patterns in SEC filings:
    - Company name appears in first few lines
    - Often in ALL CAPS
    - May include "CORPORATION", "BANK", "FINANCIAL", etc.
    """
    lines = text.split('\n')[:50]  # Check first 50 lines
    
    # Pattern 0: Cover page format - "Annual Report\nCompany Name\nYear"
    # Sometimes the company name is split across lines, so we need to combine them
    for i, line in enumerate(lines):
        if 'annual report' in line.lower():
            # Look at the next few lines and combine them if they look like a company name
            company_parts = []
            for j in range(i + 1, min(i + 5, len(lines))):
                part = lines[j].strip()
                # Stop if we hit a year or empty line
                if not part or part.isdigit() or (len(part) == 4 and part.startswith('20')):
                    break
                # Add this part if it contains company keywords or is short (likely part of name)
                if any(kw in part.upper() for kw in ['CORPORATION', 'BANK', 'FINANCIAL', 'CORP', 'INC', 'COMPANY', '&', 'GROUP']):
                    company_parts.append(part)
                elif len(part) < 30 and not any(x in part.lower() for x in ['letter', 'chairman', 'officer', 'dear', 'stockholder']):
                    company_parts.append(part)
                else:
                    break
            
            if company_parts:
                # Combine the parts
                full_name = ' '.join(company_parts)
                # Verify it has company keywords
                if any(kw in full_name.upper() for kw in ['CORPORATION', 'BANK', 'FINANCIAL', 'CORP', 'INC', 'COMPANY', '&']):
                    return full_name
    
    # Pattern 1: Look for "(Exact name of registrant as specified in its charter)"
    # This is the most reliable pattern in SEC filings
    for i, line in enumerate(lines):
        if 'exact name of registrant' in line.lower() or 'name of registrant' in line.lower():
            # The company name is usually 1-3 lines above this
            for j in range(max(0, i-3), i):
                candidate = lines[j].strip()
                # Must be substantial length and contain bank-related keywords
                if len(candidate) > 10 and not any(x in candidate.upper() for x in 
                    ['FORM 10', 'SECURITIES', 'COMMISSION', 'WASHINGTON', 'UNITED STATES', 'PAGE', 'FOR THE', 'FISCAL YEAR']):
                    # Check if it has bank-related keywords or is all caps (company names are usually all caps)
                    if any(kw in candidate.upper() for kw in ['CORPORATION', 'BANK', 'FINANCIAL', 'CORP', 'INC', 'COMPANY', '&']) or candidate.isupper():
                        return candidate
    
    # Pattern 2: Look for lines with CORPORATION, BANK, FINANCIAL, etc.
    bank_keywords = ['CORPORATION', 'BANK', 'FINANCIAL', 'BANCORP', 'BANCSHARES', 
                     'CORP', 'INC', 'COMPANY', 'GROUP', 'HOLDING']
    
    candidates = []
    for line in lines:
        line = line.strip()
        # Skip very short lines or lines with too many special chars
        if len(line) < 10 or line.count('•') > 2:
            continue
            
        # Check if line contains bank keywords
        upper_line = line.upper()
        for keyword in bank_keywords:
            if keyword in upper_line:
                # Clean up the name
                name = line.strip()
                # Remove common prefixes
                name = re.sub(r'^(UNITED STATES|U\.S\.|US)\s+', '', name, flags=re.IGNORECASE)
                # Skip if it contains SEC-related terms
                if any(x in name.upper() for x in ['SECURITIES', 'COMMISSION', 'FORM 10', 'WASHINGTON', 'PAGE']):
                    continue
                # Skip if it's just the keyword alone
                if name.upper().strip() in bank_keywords:
                    continue
                candidates.append(name)
                break
    
    # Return the longest candidate (usually the full name)
    if candidates:
        return max(candidates, key=len)
    
    # Pattern 3: Look for specific SEC filing patterns
    # "WEBSTER FINANCIAL CORPORATION" or similar
    for line in lines:
        if len(line.strip()) > 15 and line.strip().isupper():
            # Check if it's not a header/footer
            if not any(x in line.upper() for x in ['FORM 10', 'PAGE', 'TABLE OF CONTENTS', 'SECURITIES', 'COMMISSION', 'WASHINGTON']):
                return line.strip()
    
    # Fallback: Try to extract from filename
    if 'webster' in filename.lower():
        return 'Webster Financial Corporation'
    elif 'jpmorgan' in filename.lower() or 'jpm' in filename.lower():
        return 'JPMorgan Chase & Co.'
    elif 'bofa' in filename.lower() or 'bank-of-america' in filename.lower():
        return 'Bank of America Corporation'
    elif 'wells' in filename.lower():
        return 'Wells Fargo & Company'
    elif 'citi' in filename.lower():
        return 'Citigroup Inc.'
    elif 'usbank' in filename.lower() or 'us-bank' in filename.lower():
        return 'U.S. Bancorp'
    
    return 'Unknown Bank'

def extract_form_type(text, filename):
    """
    Extract SEC form type (10-K, 10-Q, 8-K, etc.)
    """
    # Look for "FORM 10-K" or "10-K" in first page
    patterns = [
        r'FORM\s+(10-K|10-Q|8-K|20-F)',
        r'\b(10-K|10-Q|8-K|20-F)\b',
        r'ANNUAL REPORT.*10-K',
        r'QUARTERLY REPORT.*10-Q'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            form = match.group(1) if match.lastindex else match.group(0)
            # Normalize to uppercase
            if '10-K' in form.upper():
                return '10-K'
            elif '10-Q' in form.upper():
                return '10-Q'
            elif '8-K' in form.upper():
                return '8-K'
            elif '20-F' in form.upper():
                return '20-F'
    
    # Check filename
    if '10-k' in filename.lower() or '10k' in filename.lower():
        return '10-K'
    elif '10-q' in filename.lower() or '10q' in filename.lower():
        return '10-Q'
    elif 'annual' in filename.lower() or 'ar' in filename.lower():
        return '10-K'
    elif 'quarterly' in filename.lower():
        return '10-Q'
    
    return '10-K'  # Default to annual report

def extract_year(text, filename):
    """
    Extract fiscal year from PDF
    """
    # Look for year patterns in first page
    # Common patterns: "For the fiscal year ended December 31, 2024"
    #                  "Year Ended December 31, 2024"
    #                  "2024 Annual Report"
    
    patterns = [
        r'fiscal year ended.*?(\d{4})',
        r'year ended.*?(\d{4})',
        r'for the.*?year.*?(\d{4})',
        r'december 31,?\s*(\d{4})',
        r'(\d{4})\s+annual report',
        r'annual report.*?(\d{4})',
        r'\b(20\d{2})\b'  # Any year 2000-2099
    ]
    
    years_found = []
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            year = int(match.group(1))
            if 2020 <= year <= 2025:  # Reasonable range
                years_found.append(year)
    
    # Return most recent year found
    if years_found:
        return max(years_found)
    
    # Check filename
    filename_years = re.findall(r'20\d{2}', filename)
    if filename_years:
        return int(filename_years[-1])  # Take last year in filename
    
    # Default to current year
    from datetime import datetime
    return datetime.now().year

if __name__ == '__main__':
    # Read input from stdin
    input_data = json.loads(sys.stdin.read())
    
    pdf_content = input_data.get('pdf_content')
    filename = input_data.get('filename', 'unknown.pdf')
    
    if not pdf_content:
        print(json.dumps({'success': False, 'error': 'No PDF content provided'}))
        sys.exit(1)
    
    result = extract_metadata(pdf_content, filename)
    print(json.dumps(result))
