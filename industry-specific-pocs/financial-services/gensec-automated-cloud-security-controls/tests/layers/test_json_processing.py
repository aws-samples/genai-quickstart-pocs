#!/usr/bin/env python3
"""
Unit tests for json_processing.py markdown conversion
"""

import unittest
import json
import sys
import os

# Add the validation layer to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../layers/validation-layer/python'))

from json_processing import convert_json_to_markdown

class TestMarkdownConversion(unittest.TestCase):
    
    def setUp(self):
        """Set up test data"""
        self.simple_data = {
            "serviceName": "TEST",
            "description": "A test service"
        }
        
        self.nested_data = {
            "serviceName": "SAGEMAKER",
            "dataProtection": {
                "encryption": {
                    "atRest": {
                        "supported": True,
                        "methods": ["AWS KMS", "AWS Managed CMK"]
                    }
                }
            },
            "accessControls": {
                "bestPractices": [
                    "Use IAM roles",
                    "Implement least privilege"
                ]
            }
        }
        
        # Load real test data
        self.load_real_test_data()
    
    def load_real_test_data(self):
        """Load real test data from output files"""
        try:
            # Load SageMaker service profile
            with open('tests/output/SageMaker/service-profiles/profile.json', 'r') as f:
                self.sagemaker_profile = json.load(f)
            
            # Load SageMaker business use cases (table scenario)
            with open('tests/output/SageMaker/iam-models/business_use_cases.json', 'r') as f:
                self.business_use_cases = json.load(f)
        except FileNotFoundError:
            self.sagemaker_profile = None
            self.business_use_cases = None
    
    def test_simple_conversion(self):
        """Test basic markdown conversion"""
        result = convert_json_to_markdown(self.simple_data, "Test Service")
        
        self.assertIn("# Test Service", result)
        self.assertIn("## Service Name", result)  # Updated for camelCase
        self.assertIn("TEST", result)
        self.assertIn("## Description", result)
        self.assertIn("A test service", result)
    
    def test_nested_structure(self):
        """Test nested dictionary formatting"""
        result = convert_json_to_markdown(self.nested_data, "Nested Test")
        
        # Check main sections (updated for camelCase)
        self.assertIn("## Data Protection", result)
        self.assertIn("## Access Controls", result)
        
        # Check nested formatting
        self.assertIn("**Encryption**:", result)
        self.assertIn("**At Rest**:", result)  # Updated for camelCase
        self.assertIn("**Supported**: True", result)
        
        # Check list formatting
        self.assertIn("- AWS KMS", result)
        self.assertIn("- Use IAM roles", result)
    
    def test_line_breaks(self):
        """Test proper line breaks between sections"""
        result = convert_json_to_markdown(self.nested_data, "Line Break Test")
        
        # Check that there are line breaks between dictionary items
        lines = result.split('\n')
        
        # Find encryption section and check spacing
        encryption_idx = None
        for i, line in enumerate(lines):
            if "**Encryption**:" in line:
                encryption_idx = i
                break
        
        self.assertIsNotNone(encryption_idx)
        
        # Should have proper spacing in nested structures (updated for camelCase)
        self.assertTrue(any("**At Rest**:" in line for line in lines))
    
    def test_empty_list(self):
        """Test handling of empty lists"""
        data = {"emptyList": []}
        result = convert_json_to_markdown(data, "Empty Test")
        
        self.assertIn("*None*", result)
    
    def test_camel_case_conversion(self):
        """Test camelCase to Title Case conversion"""
        from json_processing import camel_to_title
        
        # Test various camelCase scenarios
        self.assertEqual(camel_to_title("serviceName"), "Service Name")
        self.assertEqual(camel_to_title("dataProtection"), "Data Protection")
        self.assertEqual(camel_to_title("accessControls"), "Access Controls")
        self.assertEqual(camel_to_title("iamSupport"), "Iam Support")
        self.assertEqual(camel_to_title("bestPractices"), "Best Practices")
        self.assertEqual(camel_to_title("atRest"), "At Rest")
        self.assertEqual(camel_to_title("inTransit"), "In Transit")
        self.assertEqual(camel_to_title("vpcSupport"), "Vpc Support")
        
        # Test edge cases
        self.assertEqual(camel_to_title("API"), "API")
        self.assertEqual(camel_to_title("HTTPSEndpoint"), "HTTPS Endpoint")
        self.assertEqual(camel_to_title("simple"), "Simple")
    
    def test_camel_case_in_markdown(self):
        """Test that camelCase keys are properly formatted in markdown"""
        data = {
            "serviceName": "TEST",
            "dataProtection": {
                "atRest": True,
                "inTransit": False
            },
            "accessControls": {
                "bestPractices": ["Use IAM", "Least privilege"]
            }
        }
        
        result = convert_json_to_markdown(data, "CamelCase Test")
        
        # Check that camelCase is converted to Title Case
        self.assertIn("## Service Name", result)
        self.assertIn("## Data Protection", result)
        self.assertIn("## Access Controls", result)
        self.assertIn("**At Rest**: True", result)
        self.assertIn("**In Transit**: False", result)
        self.assertIn("**Best Practices**:", result)
    
    def test_sagemaker_profile_conversion(self):
        """Test real SageMaker service profile conversion"""
        if self.sagemaker_profile is None:
            self.skipTest("SageMaker profile data not available")
        
        result = convert_json_to_markdown(self.sagemaker_profile, "SAGEMAKER Service Profile")
        
        # Check main sections exist (updated for camelCase)
        self.assertIn("# SAGEMAKER Service Profile", result)
        self.assertIn("## Service Name", result)
        self.assertIn("## Data Protection", result)
        self.assertIn("## Network Controls", result)
        
        # Check nested structure formatting (updated for camelCase)
        self.assertIn("**Data Handling**:", result)
        self.assertIn("**Encryption**:", result)
        self.assertIn("**At Rest**:", result)
        
        # Check list formatting
        self.assertIn("- AWS KMS", result)
        self.assertIn("- VPC Isolation", result)
    
    def test_business_use_cases_table_scenario(self):
        """Test business use cases with complex list of objects (table scenario)"""
        if self.business_use_cases is None:
            self.skipTest("Business use cases data not available")
        
        result = convert_json_to_markdown(self.business_use_cases, "Business Use Cases")
        
        # Check main sections (updated for camelCase)
        self.assertIn("# Business Use Cases", result)
        self.assertIn("## Purpose", result)
        self.assertIn("## Use_Cases", result)  # Note: underscore preserved in JSON key
        self.assertIn("## Constraints", result)
        
        # Check that use_cases list is formatted properly (updated for camelCase)
        self.assertIn("**Item 1**:", result)
        self.assertIn("**Identity_Type**: TF Service Account", result)  # Note: underscore preserved
        self.assertIn("**Persona**: Terraform Automation", result)
        
        # Check activities list formatting
        self.assertIn("- Provision SageMaker domains", result)
        
        # Check IAM permissions list (updated for camelCase)
        self.assertIn("- sagemaker:CreateDomain", result)
        
        # Check constraints list
        self.assertIn("- SageMaker notebook instances have limits", result)
    
    def test_complex_nested_objects_in_list(self):
        """Test handling of complex objects within lists"""
        data = {
            "items": [
                {
                    "name": "Item 1",
                    "config": {
                        "enabled": True,
                        "options": ["opt1", "opt2"]
                    }
                },
                {
                    "name": "Item 2", 
                    "config": {
                        "enabled": False,
                        "options": ["opt3"]
                    }
                }
            ]
        }
        
        result = convert_json_to_markdown(data, "Complex List Test")
        
        # Check item formatting
        self.assertIn("**Item 1**:", result)
        self.assertIn("**Item 2**:", result)
        self.assertIn("**Name**: Item 1", result)
        self.assertIn("**Config**:", result)
        self.assertIn("**Enabled**: True", result)
        self.assertIn("- opt1", result)
    
    def test_camel_case_conversion(self):
        """Test camelCase to Title Case conversion"""
        from json_processing import camel_to_title
        
        # Test various camelCase scenarios
        self.assertEqual(camel_to_title("serviceName"), "Service Name")
        self.assertEqual(camel_to_title("dataProtection"), "Data Protection")
        self.assertEqual(camel_to_title("accessControls"), "Access Controls")
        self.assertEqual(camel_to_title("iamSupport"), "Iam Support")
        self.assertEqual(camel_to_title("bestPractices"), "Best Practices")
        self.assertEqual(camel_to_title("atRest"), "At Rest")
        self.assertEqual(camel_to_title("inTransit"), "In Transit")
        self.assertEqual(camel_to_title("vpcSupport"), "Vpc Support")
        
        # Test edge cases
        self.assertEqual(camel_to_title("API"), "API")
        self.assertEqual(camel_to_title("HTTPSEndpoint"), "HTTPS Endpoint")
        self.assertEqual(camel_to_title("simple"), "Simple")
    
    def test_camel_case_in_markdown(self):
        """Test that camelCase keys are properly formatted in markdown"""
        data = {
            "serviceName": "TEST",
            "dataProtection": {
                "atRest": True,
                "inTransit": False
            },
            "accessControls": {
                "bestPractices": ["Use IAM", "Least privilege"]
            }
        }
        
        result = convert_json_to_markdown(data, "CamelCase Test")
        
        # Check that camelCase is converted to Title Case
        self.assertIn("## Service Name", result)
        self.assertIn("## Data Protection", result)
        self.assertIn("## Access Controls", result)
        self.assertIn("**At Rest**: True", result)
        self.assertIn("**In Transit**: False", result)
        self.assertIn("**Best Practices**:", result)

if __name__ == '__main__':
    unittest.main()
