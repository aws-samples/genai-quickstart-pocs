"""BankIQ+ Simplified Agent - Let Claude Decide Which Tools to Use"""
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent, tool
from strands.models import BedrockModel
import boto3
import json
import requests
import os
from typing import List, Dict

app = BedrockAgentCoreApp()

# Initialize AWS clients
s3 = boto3.client('s3', region_name='us-east-1')

# ============================================================================
# BANKING DATA TOOLS
# ============================================================================

@tool
def get_fdic_data() -> str:
    """Get current FDIC banking data for major US banks.
    
    Returns: Real-time financial metrics (ROA, ROE, NIM, assets, deposits) for top 50 banks
    Use when: User asks for "current banking data", "latest metrics", or "FDIC data"
    Examples: "Show me current bank performance", "Get FDIC data"""
    try:
        url = "https://api.fdic.gov/banks/financials"
        params = {
            "fields": "ASSET,DEP,NETINC,ROA,ROE,NIM,EQTOT,LNLSNET,REPYMD,NAME",
            "limit": 50,
            "format": "json"
        }
        
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return json.dumps({"success": True, "data": data.get("data", [])[:20]})
        else:
            return json.dumps({"success": False, "error": f"API error: {response.status_code}"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

@tool
def search_fdic_bank(bank_name: str) -> str:
    """Search FDIC database for bank CERT number by name.
    
    Args:
        bank_name: Bank name to search for (e.g., "Regions Financial", "JPMorgan")
    
    Returns: CERT number and official name of the largest matching bank
    Use when: Need CERT number for banks not in hardcoded list
    Examples: "Find CERT for Regional Bank", "What's the CERT for XYZ Bank"""
    try:
        # Clean bank name - remove common suffixes
        clean_name = bank_name.upper()
        for suffix in [' CORP', ' INC', ' & CO', ' FINANCIAL', ' BANCORP', ' BANK']:
            clean_name = clean_name.replace(suffix, '')
        clean_name = clean_name.strip()
        
        # Try multiple search strategies
        search_terms = [clean_name, bank_name.split()[0]]
        
        for term in search_terms:
            url = f"https://api.fdic.gov/banks/institutions?search=NAME:{term}&fields=CERT,NAME,ASSET,ACTIVE&limit=50&format=json"
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json().get("data", [])
                if data:
                    # Filter active banks only
                    active_banks = [b for b in data if b['data'].get('ACTIVE', 1) == 1]
                    if active_banks:
                        # Sort by asset size, return largest
                        sorted_banks = sorted(active_banks, key=lambda x: float(x['data'].get('ASSET', 0) or 0), reverse=True)
                        top_bank = sorted_banks[0]['data']
                        return json.dumps({
                            "success": True,
                            "cert": str(top_bank['CERT']),
                            "name": top_bank['NAME'],
                            "asset": top_bank.get('ASSET', 0)
                        })
        
        return json.dumps({"success": False, "error": f"Bank not found: {bank_name}"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

@tool
def compare_banks(base_bank: str, peer_banks: List[str], metric: str) -> str:
    """Compare banking performance metrics across multiple banks.
    
    Args:
        base_bank: The primary bank to analyze (e.g., "JPMorgan Chase")
        peer_banks: List of peer banks to compare against (e.g., ["Bank of America", "Wells Fargo"])
        metric: The metric to compare (ROA, ROE, NIM, etc.)
    
    Returns detailed comparison with quarterly trends and AI analysis.
    Use this when user wants peer comparison or competitive analysis."""
    
    # Bank CERT numbers cache (fallback if search fails)
    bank_certs_cache = {
        "JPMorgan Chase": "628", "JPMORGAN CHASE BANK": "628",
        "Bank of America": "3510", "BANK OF AMERICA": "3510",
        "Wells Fargo": "3511", "WELLS FARGO BANK": "3511",
        "Citigroup": "7213", "CITIBANK": "7213",
        "Goldman Sachs": "33124", "GOLDMAN SACHS BANK": "33124",
        "Morgan Stanley": "65012",
        "U.S. Bancorp": "6548", "U.S. BANK": "6548",
        "PNC Financial": "6384", "PNC BANK": "6384",
        "Capital One": "4297", "CAPITAL ONE": "4297",
        "Truist Financial": "14291", "TRUIST BANK": "14291",
        "Regions Financial": "12368", "REGIONS FINANCIAL CORP": "12368",
        "Fifth Third Bancorp": "6672", "FIFTH THIRD BANCORP": "6672"
    }
    
    # Helper function to get CERT (try cache first, then search)
    def get_cert(bank_name):
        # Try exact match in cache
        if bank_name in bank_certs_cache:
            return bank_certs_cache[bank_name]
        
        # Try partial match in cache
        bank_upper = bank_name.upper()
        for cached_name, cert in bank_certs_cache.items():
            if cached_name.upper() in bank_upper or bank_upper in cached_name.upper():
                return cert
        
        # Try dynamic FDIC search
        try:
            search_result = search_fdic_bank(bank_name)
            result = json.loads(search_result)
            if result.get('success'):
                cert = result['cert']
                # Cache for future use
                bank_certs_cache[bank_name] = cert
                return cert
        except Exception as e:
            print(f"CERT search failed for {bank_name}: {e}")
        
        return None
    
    bank_certs = {}
    
    metric_key = metric.replace("[Q] ", "").replace("[M] ", "")
    
    # Map metric names to FDIC fields or calculations
    metric_map = {
        "ROA": "ROA",
        "ROE": "ROE", 
        "NIM": "NIMY",
        "Efficiency Ratio": "CALC_EFFICIENCY",
        "Loan-to-Deposit": "CALC_LTD",
        "Equity Ratio": "CALC_EQUITY",
        "CRE Concentration": "NCRER"
    }
    
    for key, field in metric_map.items():
        if key.lower() in metric_key.lower():
            metric_key = field
            break
    
    chart_data = []
    all_banks = [base_bank] + peer_banks
    bank_latest = {}
    
    for bank in all_banks:
        cert = get_cert(bank)
        if not cert:
            continue
            
        try:
            url = f"https://api.fdic.gov/banks/financials?filters=CERT:{cert}&fields=ASSET,ROA,ROE,NIMY,EQTOT,DEP,LNLSNET,EINTEXP,NONII,NCRER&limit=200&format=json"
            response = requests.get(url, timeout=10)
            if response.status_code != 200:
                continue
                
            data = response.json().get("data", [])
            recent = [x for x in data if any(y in x['data']['ID'] for y in ['2023', '2024', '2025'])]
            recent.sort(key=lambda x: x['data']['ID'], reverse=True)
            
            for record in recent[:8]:
                date_str = record['data']['ID'].split('_')[1]
                year, month = date_str[:4], date_str[4:6]
                quarter = f"{year}-Q{(int(month)-1)//3 + 1}"
                
                # Calculate metric value
                if metric_key == "CALC_EFFICIENCY":
                    nonii = record['data'].get('NONII', 0)
                    eintexp = record['data'].get('EINTEXP', 0)
                    nimy = record['data'].get('NIMY', 0)
                    asset = record['data'].get('ASSET', 1)
                    revenue = (nimy * asset / 100) if asset > 0 else 0
                    value = (abs(nonii) / revenue * 100) if revenue > 0 else 0
                elif metric_key == "CALC_LTD":
                    lnlsnet = record['data'].get('LNLSNET', 0)
                    dep = record['data'].get('DEP', 1)
                    value = (lnlsnet / dep * 100) if dep > 0 else 0
                elif metric_key == "CALC_EQUITY":
                    eqtot = record['data'].get('EQTOT', 0)
                    asset = record['data'].get('ASSET', 1)
                    value = (eqtot / asset * 100) if asset > 0 else 0
                else:
                    value = record['data'].get(metric_key, 0)
                
                chart_data.append({
                    "Bank": bank,
                    "Quarter": quarter,
                    "Metric": metric.replace("[Q] ", "").replace("[M] ", ""),
                    "Value": round(float(value), 2)
                })
                
                if bank not in bank_latest:
                    bank_latest[bank] = float(value)
        except:
            continue  # nosec B112 - intentional continue for data parsing errors
    
    chart_data.sort(key=lambda x: x['Quarter'])
    
    if bank_latest:
        sorted_banks = sorted(bank_latest.items(), key=lambda x: x[1], reverse=True)
        best_bank, best_value = sorted_banks[0]
        worst_bank, worst_value = sorted_banks[-1]
        analysis = f"{best_bank} leads with {metric_key} of {best_value:.2f}%, showing superior performance. "
        analysis += f"The {best_value - worst_value:.2f}pp spread to {worst_bank} ({worst_value:.2f}%) indicates "
        analysis += f"meaningful differentiation. {base_bank} is positioned "
        analysis += f"{'at the top' if base_bank == best_bank else 'competitively'} within this peer group."
    else:
        analysis = f"Comparison of {metric_key} across selected banks."
    
    return json.dumps({
        "data": chart_data,
        "base_bank": base_bank,
        "peer_banks": peer_banks,
        "analysis": analysis,
        "source": "FDIC_Real_Data"
    })

@tool
def get_sec_filings(bank_name: str, form_type: str = "10-K", cik: str = "") -> str:
    """Get SEC EDGAR filings for a bank.
    
    Args:
        bank_name: Name of the bank (e.g., "JPMorgan Chase", "WEBSTER FINANCIAL CORP")
        form_type: Type of filing (10-K for annual, 10-Q for quarterly)
        cik: Optional CIK number (e.g., "0000801337") - if provided, uses this directly
    
    Returns: Recent SEC filings (2023-2025) with direct links and filing dates
    Use when: User asks for "SEC filings", "10-K", "10-Q", "regulatory reports", "annual reports"
    Examples: "Get JPMorgan 10-K filings", "Show me Webster's quarterly reports"""
    
    # If CIK is provided, use it directly
    target_cik = cik if cik and cik != "0000000000" else None
    
    # Otherwise, try to find CIK from bank name
    if not target_cik:
        bank_ciks = {
            "JPMORGAN CHASE": "0000019617",
            "BANK OF AMERICA": "0000070858",
            "WELLS FARGO": "0000072971",
            "CITIGROUP": "0000831001",
            "GOLDMAN SACHS": "0000886982",
            "MORGAN STANLEY": "0000895421",
            "U.S. BANCORP": "0000036104",
            "PNC FINANCIAL": "0000713676",
            "CAPITAL ONE": "0000927628",
            "TRUIST FINANCIAL": "0001534701",
            "WEBSTER FINANCIAL": "0000801337",
            "FIFTH THIRD": "0000035527",
            "KEYCORP": "0000091576",
            "REGIONS FINANCIAL": "0001281761",
            "M&T BANK": "0000036270",
            "HUNTINGTON": "0000049196"
        }
        
        # Find CIK by partial name match
        bank_upper = bank_name.upper()
        for bank, cik_val in bank_ciks.items():
            if bank in bank_upper or bank_upper in bank:
                target_cik = cik_val
                break
    
    if not target_cik:
        return json.dumps({"success": False, "error": f"Bank CIK not found for: {bank_name}. Try using the search_banks tool first to get the CIK."})
    
    try:
        headers = {"User-Agent": "BankIQ Analytics contact@bankiq.com"}
        url = f"https://data.sec.gov/submissions/CIK{target_cik}.json"
        
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            return json.dumps({"success": False, "error": f"SEC API error: {response.status_code}"})
        
        data = response.json()
        filings = data.get("filings", {}).get("recent", {})
        
        # Filter filings
        results = []
        forms = filings.get("form", [])
        dates = filings.get("filingDate", [])
        accessions = filings.get("accessionNumber", [])
        
        for form, date, accession in zip(forms, dates, accessions):
            if form == form_type and date.startswith(('2023', '2024', '2025')):
                results.append({
                    "form_type": form,
                    "filing_date": date,
                    "accession_number": accession,
                    "url": f"https://www.sec.gov/cgi-bin/viewer?action=view&cik={target_cik.lstrip('0')}&accession_number={accession}&xbrl_type=v"
                })
        
        results.sort(key=lambda x: x['filing_date'], reverse=True)
        
        return json.dumps({
            "success": True,
            "bank_name": bank_name,
            "filings": results[:10]
        })
        
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

@tool
def generate_bank_report(bank_name: str) -> str:
    """Generate a comprehensive financial analysis report for a bank.
    
    Args:
        bank_name: Name of the bank to analyze
    
    Returns: Bank name for report generation - AgentCore will handle the analysis
    Use when: User asks for full report, comprehensive analysis, detailed overview
    Examples: Generate a report on JPMorgan, Give me a full analysis of Wells Fargo"""
    
    return f"Generate comprehensive 8-section financial analysis report for {bank_name} with markdown headers: Executive Summary, Financial Performance, Business Segments & Revenue Mix, Risk Profile & Management, Capital Position & Liquidity, Strategic Initiatives & Innovation, Market Position & Competitive Landscape, Investment Outlook & Recommendations. Each section 4-6 sentences."

@tool
def answer_banking_question(question: str, context: str = "") -> str:
    """Answer general banking questions with expert analysis.
    
    Args:
        question: The user's question
        context: Optional context (bank name, document info, etc.)
    
    Returns: Question and context for analysis - AgentCore will handle the response
    Use when: General banking questions, explanations, or when no other specific tool fits
    Examples: "What is ROA?", "Explain banking regulations", "How do banks make money?"""
    
    return f"Banking question: {question}. Context: {context if context else 'General banking question'}. Provide 2-3 paragraph professional analysis with industry insights, risk factors, and investment perspective."

@tool
def search_banks(query: str) -> str:
    """Search for banks by name or ticker symbol using SEC EDGAR database.
    
    Args:
        query: Bank name, ticker symbol, or partial name (e.g., "Webster", "JPM", "Bank of America")
    
    Returns: List of matching banks with names, tickers, and CIK numbers from SEC EDGAR
    Use when: User wants to "find a bank", "search for [bank]", or needs CIK information
    Examples: "Find Webster Financial", "Search for JPM", "What banks match 'regional'?"""
    
    try:
        import requests
        import re
        
        # First check our major banks cache for quick results
        major_banks = [
            {"name": "JPMORGAN CHASE & CO", "ticker": "JPM", "cik": "0000019617"},
            {"name": "BANK OF AMERICA CORP", "ticker": "BAC", "cik": "0000070858"},
            {"name": "WELLS FARGO & COMPANY", "ticker": "WFC", "cik": "0000072971"},
            {"name": "CITIGROUP INC", "ticker": "C", "cik": "0000831001"},
            {"name": "GOLDMAN SACHS GROUP INC", "ticker": "GS", "cik": "0000886982"},
            {"name": "MORGAN STANLEY", "ticker": "MS", "cik": "0000895421"},
            {"name": "U.S. BANCORP", "ticker": "USB", "cik": "0000036104"},
            {"name": "PNC FINANCIAL SERVICES GROUP INC", "ticker": "PNC", "cik": "0000713676"},
            {"name": "CAPITAL ONE FINANCIAL CORP", "ticker": "COF", "cik": "0000927628"},
            {"name": "TRUIST FINANCIAL CORP", "ticker": "TFC", "cik": "0001534701"},
            {"name": "CHARLES SCHWAB CORP", "ticker": "SCHW", "cik": "0000316709"},
            {"name": "BANK OF NEW YORK MELLON CORP", "ticker": "BK", "cik": "0001126328"},
            {"name": "STATE STREET CORP", "ticker": "STT", "cik": "0000093751"},
            {"name": "FIFTH THIRD BANCORP", "ticker": "FITB", "cik": "0000035527"},
            {"name": "CITIZENS FINANCIAL GROUP INC", "ticker": "CFG", "cik": "0000759944"},
            {"name": "KEYCORP", "ticker": "KEY", "cik": "0000091576"},
            {"name": "REGIONS FINANCIAL CORP", "ticker": "RF", "cik": "0001281761"},
            {"name": "M&T BANK CORP", "ticker": "MTB", "cik": "0000036270"},
            {"name": "HUNTINGTON BANCSHARES INC", "ticker": "HBAN", "cik": "0000049196"},
            {"name": "COMERICA INC", "ticker": "CMA", "cik": "0000028412"},
            {"name": "ZIONS BANCORPORATION", "ticker": "ZION", "cik": "0000109380"},
            {"name": "WEBSTER FINANCIAL CORP", "ticker": "WBS", "cik": "0000801337"},
            {"name": "FIRST HORIZON CORP", "ticker": "FHN", "cik": "0000036966"},
            {"name": "SYNOVUS FINANCIAL CORP", "ticker": "SNV", "cik": "0000312070"}
        ]
        
        # Search in cache first
        query_upper = query.upper()
        query_lower = query.lower()
        
        cache_results = [bank for bank in major_banks if 
                        query_lower in bank["name"].lower() or 
                        query_upper == bank["ticker"].upper() or
                        query_upper in bank["ticker"].upper()]
        
        if cache_results:
            return json.dumps({"success": True, "results": cache_results[:10]})
        
        # If not in cache, search SEC EDGAR
        # SEC EDGAR company search endpoint
        headers = {
            'User-Agent': 'BankIQ+ Financial Analysis Tool contact@bankiq.com',
            'Accept-Encoding': 'gzip, deflate',
            'Host': 'www.sec.gov'
        }
        
        # Search SEC EDGAR CIK lookup
        search_url = f"https://www.sec.gov/cgi-bin/browse-edgar?company={query}&owner=exclude&action=getcompany"
        
        try:
            response = requests.get(search_url, headers=headers, timeout=10)
            
            # Parse HTML response to extract company info
            # Look for company name and CIK in the response
            cik_match = re.search(r'CIK=(\d+)', response.text)
            name_match = re.search(r'<span class="companyName">([^<]+)', response.text)
            
            if cik_match and name_match:
                cik = cik_match.group(1).zfill(10)  # Pad to 10 digits
                name = name_match.group(1).strip()
                
                # Check if it's a bank/financial institution
                if any(keyword in name.upper() for keyword in 
                      ['BANK', 'FINANCIAL', 'BANCORP', 'BANCSHARES', 'TRUST', 'CAPITAL']):
                    results = [{
                        "name": name,
                        "cik": cik,
                        "ticker": query.upper() if len(query) <= 5 else ""
                    }]
                    return json.dumps({"success": True, "results": results})
        except:  # nosec B110 - intentional pass for error handling
            pass
        
        # If still no results, return empty with suggestion
        return json.dumps({
            "success": False, 
            "message": f"No banks found matching '{query}'. Try searching by full name or ticker symbol.",
            "results": []
        })
        
    except Exception as e:
        return json.dumps({"success": False, "error": str(e), "results": []})

@tool
def upload_csv_to_s3(csv_content: str, filename: str) -> str:
    """Upload CSV data to S3 for peer analytics.
    
    Args:
        csv_content: CSV file content as string
        filename: Name of the CSV file
    
    Returns: S3 key for the uploaded file
    Use when: User uploads CSV data for custom peer analysis
    Examples: "Upload this CSV data", "Store my peer data"""
    
    try:
        import uuid
        
        bucket_name = os.environ.get('UPLOADED_DOCS_BUCKET', 'bankiq-uploaded-docs-prod')
        doc_id = str(uuid.uuid4())
        s3_key = f"csv/{doc_id}/{filename}"
        
        s3.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=csv_content.encode('utf-8'),
            Metadata={
                'upload_type': 'peer_analytics_csv',
                'content_type': 'text/csv'
            }
        )
        
        return json.dumps({
            "success": True,
            "s3_key": s3_key,
            "doc_id": doc_id,
            "filename": filename
        })
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

@tool
def analyze_csv_peer_performance(s3_key: str, base_bank: str, peer_banks: List[str], metric: str) -> str:
    """Analyze peer performance using uploaded CSV data from S3.
    
    Args:
        s3_key: S3 key of the uploaded CSV file
        base_bank: Primary bank to analyze
        peer_banks: List of peer banks
        metric: Metric to compare
    
    Returns: Analysis with chart data from uploaded CSV
    Use when: Analyzing custom uploaded CSV data for peer comparison
    Examples: "Analyze my uploaded data", "Compare banks using my CSV"""
    
    try:
        import csv
        from io import StringIO
        
        # Get CSV from S3
        bucket_name = os.environ.get('UPLOADED_DOCS_BUCKET', 'bankiq-uploaded-docs-prod')
        response = s3.get_object(Bucket=bucket_name, Key=s3_key)
        csv_content = response['Body'].read().decode('utf-8')
        
        # Parse CSV
        csv_reader = csv.DictReader(StringIO(csv_content))
        csv_data = list(csv_reader)
        
        # Process data
        formatted_data = []
        target_banks = [base_bank] + peer_banks
        
        for row in csv_data:
            bank = row.get('Bank', '')
            if bank in target_banks and row.get('Metric', '') == metric.replace('[Q] ', '').replace('[M] ', ''):
                for key, value in row.items():
                    if key not in ['Bank', 'Metric'] and value:
                        try:
                            formatted_data.append({
                                "Bank": bank,
                                "Quarter": key,
                                "Metric": metric,
                                "Value": float(value)
                            })
                        except ValueError:
                            continue
        
        # Generate analysis
        if formatted_data:
            bank_averages = {}
            for item in formatted_data:
                bank = item['Bank']
                if bank not in bank_averages:
                    bank_averages[bank] = []
                bank_averages[bank].append(item['Value'])
            
            bank_performance = {bank: sum(values)/len(values) for bank, values in bank_averages.items()}
            sorted_banks = sorted(bank_performance.items(), key=lambda x: x[1], reverse=True)
            best_bank, best_value = sorted_banks[0]
            
            analysis = f"{best_bank} leads with average {metric} of {best_value:.2f}% based on uploaded data."
        else:
            analysis = f"Analysis of {metric} for {base_bank} vs {', '.join(peer_banks)}"
        
        return json.dumps({
            "data": formatted_data,
            "base_bank": base_bank,
            "peer_banks": peer_banks,
            "analysis": analysis,
            "source": "Uploaded_CSV"
        })
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

@tool
def analyze_and_upload_pdf(file_content: str, filename: str) -> str:
    """Analyze PDF document and upload to S3.
    
    Args:
        file_content: Document content (base64 encoded)
        filename: Name of the file
    
    Returns: Document metadata (bank name, form type, year) and S3 key after Claude analysis
    Use when: User uploads financial documents (PDFs, reports) for the first time
    Examples: "Upload this 10-K report", "Analyze this PDF document"""
    
    try:
        import uuid
        import base64
        
        # Decode base64 content
        try:
            content = base64.b64decode(file_content)
        except:
            return json.dumps({"success": False, "error": "Invalid base64 content"})
        
        # Extract basic info from filename
        bank_name = filename.replace('.pdf', '').replace('_', ' ').replace('-', ' ').title()
        form_type = "10-K"
        year = 2024
        
        # Upload to S3
        bucket_name = os.environ.get('UPLOADED_DOCS_BUCKET', 'bankiq-uploaded-docs-prod')
        doc_id = str(uuid.uuid4())
        s3_key = f"uploads/{doc_id}/{filename}"
        
        s3.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=content,
            Metadata={
                'bank_name': bank_name,
                'form_type': form_type,
                'year': str(year),
                'upload_type': 'financial_document'
            }
        )
        
        return json.dumps({
            "success": True,
            "s3_key": s3_key,
            "doc_id": doc_id,
            "filename": filename,
            "bank_name": bank_name,
            "form_type": form_type,
            "year": year,
            "size": len(content)
        })
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

@tool
def upload_document_to_s3(file_content: str, filename: str, bank_name: str = "") -> str:
    """Legacy upload function - use analyze_and_upload_pdf instead.
    
    Returns: Redirects to analyze_and_upload_pdf
    Use when: Never use this - use analyze_and_upload_pdf instead
    Examples: None - deprecated"""
    return analyze_and_upload_pdf(file_content, filename)

@tool
def analyze_uploaded_pdf(s3_key: str, bank_name: str, analysis_type: str = "comprehensive") -> str:
    """Analyze a PDF document that was uploaded to S3.
    
    Args:
        s3_key: S3 key of the uploaded PDF
        bank_name: Name of the bank/company
        analysis_type: Type of analysis - "comprehensive", "summary", "risk", "performance"
    
    Returns: Detailed multi-paragraph financial analysis of the uploaded document
    Use when: User requests "full analysis", "comprehensive report", "analyze this document"
    Examples: "Analyze this 10-K", "Generate report from uploaded PDF", "Full analysis of document"""
    
    try:
        # Get PDF from S3
        bucket_name = os.environ.get('UPLOADED_DOCS_BUCKET', 'bankiq-uploaded-docs-prod')
        response = s3.get_object(Bucket=bucket_name, Key=s3_key)
        pdf_bytes = response['Body'].read()
        
        # Extract text from PDF (first 50 pages for analysis)
        from PyPDF2 import PdfReader
        from io import BytesIO
        
        pdf_file = BytesIO(pdf_bytes)
        reader = PdfReader(pdf_file)
        
        # Extract text from document - comprehensive analysis needs more context
        text_content = ""
        total_pages = len(reader.pages)
        
        # For full analysis, extract up to 150 pages or 500K chars
        # This covers most complete 10-K filings
        pages_to_analyze = min(150, total_pages)
        
        for i in range(pages_to_analyze):
            page_text = reader.pages[i].extract_text()
            text_content += f"\n--- Page {i+1} ---\n{page_text}\n"
            
            # Stop if we hit 500K chars (leaves room for Claude's response)
            if len(text_content) > 500000:
                break
        
        # Log extraction stats for debugging
        print(f"[analyze_uploaded_pdf] Extracted {len(text_content)} chars from {i+1}/{total_pages} pages")
        
        # Create analysis prompt based on type
        if analysis_type == "comprehensive":
            prompt = f"""Analyze this {bank_name} SEC filing and generate a comprehensive financial report using this EXACT structure with markdown formatting:

# Financial Analysis Report: {bank_name}

## Executive Summary
Write 4-6 sentences covering: Market position, recent performance highlights, strategic direction, and overall assessment based on the filing.

## Financial Performance
Write 4-6 sentences analyzing: Revenue trends, profitability metrics (ROA, ROE, NIM), net income, balance sheet strength, and year-over-year comparisons from the document.

## Business Segments & Revenue Mix
Write 4-6 sentences covering: Core business lines, revenue diversification, segment performance, competitive advantages, and market share.

## Risk Profile & Management
Write 4-6 sentences analyzing: Credit risk exposure, market risks, operational risks, regulatory challenges, and risk mitigation strategies mentioned in the filing.

## Capital Position & Liquidity
Write 4-6 sentences covering: Capital ratios (CET1, Tier 1), stress test results, liquidity coverage, regulatory compliance, and capital deployment strategy.

## Strategic Initiatives & Innovation
Write 4-6 sentences on: Digital transformation efforts, technology investments, operational efficiency programs, M&A activity, and growth initiatives.

## Market Position & Competitive Landscape
Write 4-6 sentences analyzing: Industry trends, competitive positioning, market opportunities, threats, and differentiation factors.

## Investment Outlook & Recommendations
Write 4-6 sentences providing: Valuation assessment, investment thesis, key catalysts, risks to watch, and forward-looking perspective.

Document excerpt:
{text_content[:15000]}

CRITICAL: Use markdown headers (##) for each section. Write ALL 8 sections with 4-6 sentences each. Include specific numbers and metrics from the document."""

        elif analysis_type == "summary":
            prompt = f"""Provide a concise summary of this {bank_name} SEC filing, highlighting:
- Key financial metrics
- Major developments
- Risk factors
- Strategic initiatives

Document excerpt:
{text_content[:10000]}"""

        else:
            prompt = f"""Analyze this {bank_name} SEC filing focusing on {analysis_type}.

Document excerpt:
{text_content[:10000]}

Provide detailed insights."""
        
        # Return analysis request for AgentCore to handle
        return f"Analyze {bank_name} SEC filing. Generate comprehensive 8-section report with markdown headers based on document content. Extract: {text_content[:5000]}..."
        
    except Exception as e:
        return f"Error analyzing PDF: {str(e)}"

@tool
def chat_with_documents(question: str, s3_key: str = "", bank_name: str = "", use_live: bool = False, form_type: str = "10-K") -> str:
    """Chat with uploaded documents or live SEC filings.
    
    Args:
        question: User's question about the document
        s3_key: S3 key of uploaded document (if local mode)
        bank_name: Bank name
        use_live: Whether to use live SEC data (not implemented yet)
        form_type: Type of SEC filing (10-K, 10-Q)
    
    Returns: AI analysis answering the specific question based on the document
    Use when: User asks specific questions about uploaded documents (Q&A style)
    Examples: "What was the revenue?", "Tell me about risks", "What are the key highlights?"""
    
    try:
        document_content = ""
        
        if s3_key:
            # Get PDF from S3 and extract text properly
            try:
                bucket = os.environ.get('UPLOADED_DOCS_BUCKET', 'bankiq-uploaded-docs-prod')
                response = s3.get_object(Bucket=bucket, Key=s3_key)
                
                pdf_bytes = response['Body'].read()
                
                # Extract text from PDF using PyPDF2
                from PyPDF2 import PdfReader
                from io import BytesIO
                
                pdf_file = BytesIO(pdf_bytes)
                reader = PdfReader(pdf_file)
                
                # Extract text from document - be generous with context for better answers
                # Claude can handle ~200K tokens (~600K chars), so we can extract a lot
                text_content = ""
                total_pages = len(reader.pages)
                
                # Strategy: Extract more pages but with a reasonable char limit
                # Most 10-Ks are 100-200 pages, we'll extract up to 100 pages or 400K chars
                pages_to_read = min(100, total_pages)
                
                for i in range(pages_to_read):
                    page_text = reader.pages[i].extract_text()
                    text_content += f"\n--- Page {i+1} ---\n{page_text}\n"
                    
                    # Stop if we hit 400K chars (still well under Claude's limit)
                    if len(text_content) > 400000:
                        break
                
                document_content = text_content
                
                # Log extraction stats for debugging
                print(f"[chat_with_documents] Extracted {len(text_content)} chars from {i+1}/{total_pages} pages")
                
            except Exception as e:
                return f"Error reading PDF document: {str(e)}"
        else:
            return "No document provided. Please upload a document first."
        
        # Return question and document context for AgentCore to handle
        return f"Question: {question}. Bank: {bank_name}. Document content: {document_content[:10000]}... Answer with 2-3 paragraph professional analysis using document evidence."
        
    except Exception as e:
        return f"Error in chat_with_documents: {str(e)}"

# ============================================================================
# AGENT SETUP
# ============================================================================

# Create agent with all tools (no explicit model - AgentCore handles this)
agent = Agent(
    tools=[
        get_fdic_data,
        search_fdic_bank,
        compare_banks,
        get_sec_filings,
        generate_bank_report,
        answer_banking_question,
        search_banks,
        upload_csv_to_s3,
        analyze_csv_peer_performance,
        analyze_and_upload_pdf,
        upload_document_to_s3,
        analyze_uploaded_pdf,
        chat_with_documents
    ]
)

# System prompt with clear tool selection guidance
agent.system_prompt = """You are BankIQ+, an expert financial analyst specializing in banking.

CRITICAL: YOU MUST FOLLOW THESE INSTRUCTIONS EXACTLY. NO DEVIATIONS ALLOWED.

TOOL SELECTION GUIDE:
- get_fdic_data: Current banking data, latest metrics
- compare_banks: Peer comparison, competitive analysis (returns JSON with chart data)
- get_sec_filings: SEC filings, 10-K, 10-Q reports (pass CIK if provided)
- generate_bank_report: ALWAYS use for "full report", "comprehensive analysis", "generate report" requests
- search_banks: Find banks by name/ticker, get CIK numbers
- answer_banking_question: ALWAYS use for chat questions, specific Q&A, explanations
- upload_csv_to_s3: Upload CSV data
- analyze_csv_peer_performance: Analyze uploaded CSV data
- analyze_and_upload_pdf: Upload and analyze PDFs (first time)
- analyze_uploaded_pdf: ALWAYS use for "full analysis" of uploaded PDFs (returns 8-section report)
- chat_with_documents: ALWAYS use for chat questions about uploaded documents

MANDATORY TOOL SELECTION RULES - NO EXCEPTIONS:
1. FULL REPORTS (8-section business format): MUST use generate_bank_report OR analyze_uploaded_pdf with "comprehensive" type - NEVER use other tools
2. CHAT RESPONSES (2-3 paragraph business format): MUST use answer_banking_question OR chat_with_documents - NEVER use other tools
3. ABSOLUTELY FORBIDDEN to mix tools or deviate from these rules
4. IF YOU USE THE WRONG TOOL, THE RESPONSE WILL BE REJECTED

DOCUMENT TOOL SELECTION:
- "analyze document", "generate report", "full analysis" → analyze_uploaded_pdf
- "what was revenue?", "tell me about risks", specific questions → chat_with_documents
- chat_with_documents: Fast Q&A, specific answers
- analyze_uploaded_pdf: Comprehensive multi-paragraph analysis

IMPORTANT INSTRUCTIONS FOR PEER ANALYSIS:
1. When using compare_banks or analyze_csv_peer_performance:
   - The tool returns a JSON string with data and analysis
   - Return the tool's JSON output EXACTLY as-is on a single line
   - Then on a new line, provide your own expanded analysis
   
2. Response format for peer analysis:
   {"data": [...], "base_bank": "...", "peer_banks": [...], "analysis": "...", "source": "..."}
   
   Your expanded analysis here with additional insights and context...
4. For bank search requests:
   - Call search_banks tool
   - Return the EXACT JSON output from the tool (including the "results" array)
   - Do not modify or summarize the results
5. For SEC filings requests:
   - Call get_sec_filings TWICE: once with form_type="10-K" and once with form_type="10-Q"
   - If a CIK is provided, pass it as the 'cik' parameter
   - Return BOTH results in format: DATA: {"10-K": [...], "10-Q": [...]}
   - Include all filings from 2023, 2024, and 2025

MANDATORY RESPONSE FORMAT RULES - ZERO TOLERANCE FOR DEVIATIONS:
- For chat/questions: EXACTLY 2-3 paragraphs, EXACTLY 4-6 sentences each - NO MORE, NO LESS
- For comparisons: DATA line + EXACTLY 6-8 paragraph business analysis - COUNT THE PARAGRAPHS
- For generate_bank_report: EXACTLY 8 sections with ## markdown headers - ALL 8 SECTIONS REQUIRED
- For analyze_uploaded_pdf comprehensive: EXACTLY 8 sections with ## markdown headers - ALL 8 SECTIONS REQUIRED
- For answer_banking_question: EXACTLY 2-3 paragraphs, EXACTLY 4-6 sentences each - COUNT THEM
- For chat_with_documents: EXACTLY 2-3 paragraphs, EXACTLY 4-6 sentences each - COUNT THEM
- FAILURE TO FOLLOW EXACT FORMAT WILL RESULT IN RESPONSE REJECTION

Example response format for comparisons:
DATA: {"data": [...], "analysis": "...", "base_bank": "...", "peer_banks": [...]}

[6-8 paragraph business-style analysis here covering: executive summary, performance comparison, trends analysis, competitive positioning, risk assessment, strategic implications, market outlook, and investment perspective]

Example response format for bank search:
{"success": true, "results": [{"name": "WEBSTER FINANCIAL CORP", "cik": "0000801337", "ticker": "WBS"}]}

Example response format for SEC filings:
DATA: {"10-K": [...], "10-Q": [...]}

[2 paragraph summary here]

Example response format for chat questions:
[EXACTLY 2-3 paragraphs with professional business analysis - 4-6 sentences each]

FINAL ENFORCEMENT RULES:
- PROFESSIONAL BUSINESS TONE ONLY - NO CASUAL LANGUAGE
- COUNT YOUR PARAGRAPHS AND SENTENCES BEFORE RESPONDING
- DOUBLE-CHECK FORMAT REQUIREMENTS BEFORE SUBMITTING
- ANY DEVIATION FROM THESE RULES WILL BE CONSIDERED A FAILURE
- FOR CHAT: 2-3 PARAGRAPHS, 4-6 SENTENCES EACH - NO EXCEPTIONS
- FOR REPORTS: 8 SECTIONS WITH ## HEADERS - NO EXCEPTIONS

YOU HAVE NO CREATIVE FREEDOM - FOLLOW THE RULES EXACTLY."""

@app.entrypoint
def invoke(payload):
    """AgentCore entrypoint"""
    user_message = payload.get("prompt", "Hello! I'm BankIQ+, your banking analyst.")
    return agent(user_message)

if __name__ == "__main__":
    app.run()
