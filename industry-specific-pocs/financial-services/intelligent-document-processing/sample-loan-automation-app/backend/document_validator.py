"""
Document Validator V3 - Elegant and concise implementation
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
from config import DOCUMENT_TYPES

class DocumentValidatorV3:
    
    PROCESSED_STATUSES = [
        'Extraction Complete',
        'Extraction Complete but Manual Review required', 
    ]
    
    def validate_all_document_types(self, loan_app: Dict[str, Any]) -> Dict[str, Any]:
        """Validate all document types and return results"""
        results = {}
        applicant_info = loan_app.get('applicant', {})
        
        for doc_type, doc_config in DOCUMENT_TYPES.items():
            files = self._find_files(loan_app, doc_type)
            file_info = [{'file_name': f['file_name'], 'file_status': f['status']} for f in files] if files else []
            results[doc_type] = {
                'display_name': doc_config['name'],
                'files': file_info,
                'validation_status': self._validate_files(files, applicant_info, doc_type) if files else []
            }
        
        return results
    
    def _find_files(self, loan_app: Dict[str, Any], doc_type: str) -> List[Dict[str, Any]]:
        """Find all processed files for a document type"""
        return [
            file_data for file_data in loan_app.get('files', [])
            if (file_data.get('status') in self.PROCESSED_STATUSES and 
                file_data.get('doc_type') == doc_type)
        ]
    
    def _validate_files(self, files: List[Dict[str, Any]], applicant_info: Dict[str, Any], doc_type: str) -> List[str]:
        """Validate files based on document type"""
        validators = {
            'driver_license': self._validate_driver_license,
            'w2_form': self._validate_w2_form,
            'payslip': self._validate_payslip,
            'bank_statement': self._validate_bank_statement
        }
        
        validator = validators.get(doc_type, self._validate_driver_license)
        return validator(files, applicant_info)
    
    def _validate_driver_license(self, files: List[Dict[str, Any]], applicant_info: Dict[str, Any]) -> List[str]:
        """Validate driver license with name check only"""
        results = []
        app_name = self._format_name(applicant_info.get('first_name', ''), applicant_info.get('last_name', ''))
        
        for file_data in files:
            filename = file_data['file_name']
            data = self._parse_data(file_data)
            
            if not data:
                results.append(f'❌ Could not parse {filename}')
                continue
            
            inference = data.get('inference_result', {})
            
            # Name validation - extract and format name directly
            name_details = inference.get('NAME_DETAILS', {})
            doc_first = name_details.get('FIRST_NAME', '')
            doc_last = name_details.get('LAST_NAME', '')
            doc_name = self._format_name(doc_first, doc_last)
            
            if doc_name and doc_name != "No name found":
                results.append(
                    f'✅ Name matches: {doc_name} ({filename})' if self._names_match(doc_name, app_name)
                    else f'❌ Name mismatch: {app_name} ≠ {doc_name} ({filename})'
                )
            
            # Expiry date validation
            expiry_result = self._validate_expiry_date(inference, filename)
            if expiry_result:
                results.append(expiry_result)
            # DOB validation (Expand as needed)
        return results
    
    def _validate_w2_form(self, files: List[Dict[str, Any]], applicant_info: Dict[str, Any]) -> List[str]:
        """Validate W2 form with name and SSN checks"""
        results = []
        app_name = self._format_name(applicant_info.get('first_name', ''), applicant_info.get('last_name', ''))
        app_ssn = applicant_info.get('ssn', '')
        
        for file_data in files:
            filename = file_data['file_name']
            data = self._parse_data(file_data)
            
            if not data:
                results.append(f'❌ Could not parse {filename}')
                continue
            
            inference = data.get('inference_result', {})
            
            # Name validation - extract and format name directly
            employee_general_info = inference.get('employee_general_info', {})
            doc_first = employee_general_info.get('first_name', '')
            doc_last = employee_general_info.get('employee_last_name', '')
            doc_name = self._format_name(doc_first, doc_last)
            
            if doc_name and doc_name != "No name found":
                results.append(
                    f'✅ Name matches: {doc_name} ({filename})' if self._names_match(doc_name, app_name)
                    else f'❌ Name mismatch: {app_name} ≠ {doc_name} ({filename})'
                )
            
            # SSN validation
            ssn_result = self._validate_ssn(inference, app_ssn, filename)
            if ssn_result:
                results.append(ssn_result)
        
        return results
    
    def _validate_payslip(self, files: List[Dict[str, Any]], applicant_info: Dict[str, Any]) -> List[str]:
        """Validate payslip files"""
        results = []
        app_name = self._format_name(applicant_info.get('first_name', ''), applicant_info.get('last_name', ''))
        
        for file_data in files:
            filename = file_data['file_name']
            data = self._parse_data(file_data)
            
            if not data:
                results.append(f'❌ Could not parse {filename}')
                continue
            
            inference = data.get('inference_result', {})
            
            # Employee name validation
            employee_name = inference.get('EmployeeName', {})
            if employee_name:
                doc_name = self._format_name(
                    employee_name.get('FirstName', ''),
                    employee_name.get('LastName', '')
                )
                results.append(
                    f'✅ Employee: {doc_name} ({filename})' if self._names_match(doc_name, app_name)
                    else f'❌ Name mismatch: {app_name} ≠ {doc_name} ({filename})'
                )
            
            # Pay period info
            pay_end = inference.get('PayPeriodEndDate', '')
            if pay_end:
                pay_start = inference.get('PayPeriodStartDate', '')
                pay_date = inference.get('PayDate', '')
                
                # Format dates to readable format
                formatted_start = self._format_date_readable(pay_start) if pay_start else ''
                formatted_end = self._format_date_readable(pay_end)
                formatted_pay_date = self._format_date_readable(pay_date) if pay_date else ''
                
                results.append(f'📅 Pay period: {formatted_start} to {formatted_end} (Pay: {formatted_pay_date}) ({filename})')
        
        return results
    
    def _validate_bank_statement(self, files: List[Dict[str, Any]], applicant_info: Dict[str, Any]) -> List[str]:
        """Validate bank statement files"""
        results = []
        app_name = self._format_name(applicant_info.get('first_name', ''), applicant_info.get('last_name', ''))
        
        for file_data in files:
            filename = file_data['file_name']
            data = self._parse_data(file_data)
            
            if not data:
                results.append(f'❌ Could not parse {filename}')
                continue
            
            inference = data.get('inference_result', {})
            
            # Account holder validation
            holder_name = inference.get('account_holder_name', '').strip()
            if holder_name:
                match_found, matched_name = self._names_match_any(app_name, holder_name)
                if match_found:
                    results.append(f'✅ Account holder: {matched_name} ({filename})')
                else:
                    results.append(f'❌ Name mismatch: {app_name} ≠ {holder_name} ({filename})')
            
            # Statement period
            stmt_end = inference.get('statement_end_date', '')
            if stmt_end:
                stmt_start = inference.get('statement_start_date', '')
                
                # Format dates to readable format
                formatted_start = self._format_date_readable(stmt_start) if stmt_start else ''
                formatted_end = self._format_date_readable(stmt_end)
                
                results.append(f'📅 Statement: {formatted_start} to {formatted_end} ({filename})')
        
        return results
    
    
    def _validate_ssn(self, inference: Dict[str, Any], app_ssn: str, filename: str) -> Optional[str]:
        """Validate SSN from inference data using last 4 digits matching"""
        # Check multiple possible SSN locations
        ssn_sources = [
            inference.get('ssn', ''),
            inference.get('employee_general_info', {}).get('ssn', '')
        ]
        
        for doc_ssn_raw in ssn_sources:
            if doc_ssn_raw:
                doc_ssn = self._format_ssn(doc_ssn_raw)
                app_ssn_formatted = self._format_ssn(app_ssn)
                
                
                # Extract digits from both SSNs
                app_digits = ''.join(filter(str.isdigit, app_ssn))
                doc_digits = ''.join(filter(str.isdigit, doc_ssn_raw))
                
                # Validate SSN lengths
                if len(app_digits) < 9:
                    return f'❌ Invalid application SSN: {app_ssn_formatted} (less than 9 digits) ({filename})'
                
                if len(doc_digits) < 4:
                    return f'❌ Invalid document SSN: {doc_ssn} (less than 4 digits) ({filename})'
                
                # Get last 4 digits for comparison (before truncating)
                app_last4 = app_digits[-4:] if len(app_digits) >= 4 else app_digits
                doc_last4 = doc_digits[-4:] if len(doc_digits) >= 4 else doc_digits
                
                # Take first 9 digits if more than 9 for exact comparison
                if len(app_digits) > 9:
                    app_digits = app_digits[:9]
                if len(doc_digits) > 9:
                    doc_digits = doc_digits[:9]
                
                # Mask SSN for display (show last 4 digits)
                app_masked = f"***-**-{app_last4}"
                doc_masked = f"***-**-{doc_last4}"
                
                # Check for exact match (full 9 digits)
                if len(doc_digits) == 9 and app_digits == doc_digits:
                    return f'✅ SSN matches exactly: {app_masked} ({filename})'
                
                # Check for last 4 digits match
                elif app_last4 == doc_last4:
                    return f'⚠️ SSN partial match (last 4 digits): {app_masked} ≈ {doc_masked} ({filename})'
                
                # No match
                else:
                    return f'❌ SSN no match: {app_masked} ≠ {doc_masked} ({filename})'
        
        return f'⚠️ SSN not found in document ({filename})'
    
    def _format_date_readable(self, date_str: str) -> str:
        """Format date from YYYY-MM-DD or MM/DD/YYYY to readable format like 'Jul 7, 2008'"""
        if not date_str:
            return ''
        
        try:
            from datetime import datetime
            # Try YYYY-MM-DD format first
            try:
                date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            except ValueError:
                # Try MM/DD/YYYY format
                date_obj = datetime.strptime(date_str, '%m/%d/%Y')
            
            return date_obj.strftime('%b %d, %Y')  # Jul 7, 2008 format
        except ValueError:
            return date_str  # Return original if can't parse
    
    def _validate_expiry_date(self, inference: Dict[str, Any], filename: str) -> Optional[str]:
        """Validate expiry date from driver license"""
        expiry_date = inference.get('EXPIRATION_DATE', '')
        
        if not expiry_date:
            return f'⚠️ Expiry date not found in {filename}'
        
        try:
            # Parse expiry date and check if expired
            from datetime import datetime
            expiry = datetime.strptime(expiry_date, '%Y-%m-%d')
            today = datetime.now()
            
            formatted_expiry = self._format_date_readable(expiry_date)
            
            if expiry < today:
                return f'❌ License expired: {formatted_expiry} ({filename})'
            else:
                return f'✅ License valid until: {formatted_expiry} ({filename})'
        except:
            formatted_expiry = self._format_date_readable(expiry_date)
            return f'⚠️ Invalid expiry date format: {formatted_expiry} ({filename})'
    
    # Utility methods
    def _parse_data(self, file_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Parse extracted data from file"""
        try:
            data = file_data.get('extracted_data', '{}')
            if isinstance(data, str):
                # Try JSON parsing first for security
                try:
                    import json
                    return json.loads(data)
                except json.JSONDecodeError:
                    # Fallback to ast.literal_eval for Python literals
                    import ast
                    return ast.literal_eval(data)  # nosec B307 - using ast.literal_eval instead of eval
            else:
                return data
        except:
            return None
    
    def _format_name(self, first: str, last: str) -> str:
        """Format name properly"""
        first, last = first.strip().title(), last.strip().title()
        if first and last:
            return f"{first} {last}"
        return first or last or "No name found"
    
    def _names_match(self, name1: str, name2: str) -> bool:
        """Compare names case-insensitively, handling middle initials and variations"""
        if not name1 or not name2:
            return False
        
        # Normalize names: lowercase, remove extra spaces
        norm1 = ' '.join(name1.lower().split())
        norm2 = ' '.join(name2.lower().split())
        
        # Direct match
        if norm1 == norm2:
            return True
        
        # Check if one name is contained in the other (handles middle initials)
        # Split into words for comparison
        words1 = norm1.split()
        words2 = norm2.split()
        
        # Check if all words from shorter name are in longer name
        if len(words1) <= len(words2):
            # Check if all words from name1 are in name2
            return all(word in words2 for word in words1)
        else:
            # Check if all words from name2 are in name1
            return all(word in words1 for word in words2)
    
    def _names_match_any(self, app_name: str, doc_names: str) -> tuple[bool, str]:
        """Check if application name matches any of the names in document (comma-separated)
        
        Returns:
            tuple: (match_found, matched_name)
        """
        if not app_name or not doc_names:
            return False, ""
        
        # Split document names by comma and clean them
        doc_name_list = [name.strip() for name in doc_names.split(',')]
        
        # Check if any document name matches the application name
        for doc_name in doc_name_list:
            if self._names_match(app_name, doc_name):
                return True, doc_name
        
        return False, doc_names
    
    def _format_ssn(self, ssn: str) -> str:
        """Format SSN to XXX-XX-XXXX"""
        digits = ''.join(filter(str.isdigit, ssn))
        if len(digits) >= 9:
            # Take first 9 digits if more than 9
            digits = digits[:9]
            return f"{digits[:3]}-{digits[3:5]}-{digits[5:]}"
        return ssn
    
    def _ssn_match(self, ssn1: str, ssn2: str) -> bool:
        """Compare SSNs - supports exact match and last 4 digits match"""
        if not ssn1 or not ssn2:
            return False
        
        # Extract digits
        clean1 = ''.join(filter(str.isdigit, ssn1))
        clean2 = ''.join(filter(str.isdigit, ssn2))
        
        # Normalize to 9 digits for exact comparison
        if len(clean1) > 9:
            clean1 = clean1[:9]
        if len(clean2) > 9:
            clean2 = clean2[:9]
        
        # Check for exact match (both must be 9 digits)
        if len(clean1) == 9 and len(clean2) == 9:
            return clean1 == clean2
        
        # Check for last 4 digits match (if both have at least 4 digits)
        if len(clean1) >= 4 and len(clean2) >= 4:
            return clean1[-4:] == clean2[-4:]
        
        return False
    
    def _ssn_match_type(self, ssn1: str, ssn2: str) -> str:
        """Determine the type of SSN match: 'exact', 'partial', or 'none'"""
        if not ssn1 or not ssn2:
            return 'none'
        
        # Extract digits
        clean1 = ''.join(filter(str.isdigit, ssn1))
        clean2 = ''.join(filter(str.isdigit, ssn2))
        
        # Get last 4 digits for partial comparison (before truncating)
        last4_1 = clean1[-4:] if len(clean1) >= 4 else clean1
        last4_2 = clean2[-4:] if len(clean2) >= 4 else clean2
        
        # Normalize to 9 digits for exact comparison
        if len(clean1) > 9:
            clean1 = clean1[:9]
        if len(clean2) > 9:
            clean2 = clean2[:9]
        
        # Check for exact match (both must be 9 digits)
        if len(clean1) == 9 and len(clean2) == 9 and clean1 == clean2:
            return 'exact'
        
        # Check for last 4 digits match (if both have at least 4 digits)
        if len(last4_1) >= 4 and len(last4_2) >= 4 and last4_1 == last4_2:
            return 'partial'
        
        return 'none'