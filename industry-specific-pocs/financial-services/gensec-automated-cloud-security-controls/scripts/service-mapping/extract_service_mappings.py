#!/usr/bin/env python3
"""
Script to extract AWS service mappings from CloudFormation documentation.
This script scrapes the AWS CloudFormation Template Reference page to build
a comprehensive service mapping file.
"""

import requests
from bs4 import BeautifulSoup
import json
import re
from urllib.parse import urljoin, urlparse
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CloudFormationServiceExtractor:
    def __init__(self):
        self.base_url = "https://docs.aws.amazon.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'AWS-Service-Mapping-Extractor/1.0'
        })
        
    def extract_services_from_main_page(self):
        """Extract all AWS services and their resource types from the main CloudFormation reference page"""
        url = "https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-template-resource-type-ref.html"
        
        logger.info(f"Fetching main CloudFormation reference page: {url}")
        
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Use the existing full page extraction method
            services = self._extract_services_from_full_page(soup)
            
            logger.info(f"Total services extracted: {len(services)}")
            return services
            
        except Exception as e:
            logger.error(f"Error extracting services: {str(e)}")
            return {}
    
    def _process_resource_links(self, resource_links):
        """Process resource links to extract services"""
        services = {}
        for link in resource_links:
            resource_type = self._extract_resource_type_from_url(link['href'])
            if resource_type:
                service_id = resource_type.split('::')[1].lower()
                if service_id not in services:
                    services[service_id] = []
                services[service_id].append(resource_type)
        return services
    
    def _extract_from_page_content(self, soup):
        """Alternative method to extract services from page content"""
        return self._extract_services_from_full_page(soup)
    
    def _extract_service_name(self, text):
        """Extract service name from heading text"""
        # Remove common prefixes and clean up
        text = text.strip()
        
        # Handle AWS:: prefixed services
        if text.startswith('AWS::'):
            parts = text.split('::')
            if len(parts) >= 2:
                return parts[1]
        
        # Handle other patterns
        service_patterns = [
            r'^([A-Z][a-zA-Z0-9]+)\s+resource',
            r'^([A-Z][a-zA-Z0-9]+)\s+types',
            r'^([A-Z][a-zA-Z0-9]+)$'
        ]
        
        for pattern in service_patterns:
            match = re.match(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).lower()
        
        return None
    
    def _extract_resource_types_for_service(self, section):
        """Extract resource types following a service section"""
        resource_types = []
        
        # Look for lists or tables following this section
        current = section.find_next_sibling()
        
        while current and current.name not in ['h1', 'h2', 'h3']:
            if current.name in ['ul', 'ol']:
                # Extract from list
                for li in current.find_all('li'):
                    link = li.find('a')
                    if link:
                        href = link.get('href', '')
                        resource_type = self._extract_resource_type_from_url(href)
                        if resource_type:
                            resource_types.append(resource_type)
            
            elif current.name == 'table':
                # Extract from table
                for row in current.find_all('tr'):
                    for cell in row.find_all(['td', 'th']):
                        link = cell.find('a')
                        if link:
                            href = link.get('href', '')
                            resource_type = self._extract_resource_type_from_url(href)
                            if resource_type:
                                resource_types.append(resource_type)
            
            current = current.find_next_sibling()
        
        return list(set(resource_types))  # Remove duplicates
    
    def _extract_resource_type_from_url(self, url):
        """Extract resource type from CloudFormation documentation URL"""
        # Pattern: aws-resource-service-resourcetype.html
        pattern = r'aws-resource-([a-z0-9]+)-([a-z0-9]+)\.html'
        match = re.search(pattern, url.lower())
        
        if match:
            service = match.group(1)
            resource = match.group(2)
            return f"{service}-{resource}"
        
        return None
    
    def _extract_services_from_full_page(self, soup):
        """Extract services by parsing service-level links"""
        services = {}
        
        # Find all links that could be CloudFormation service documentation
        all_links = soup.find_all('a', href=True)
        logger.info(f"Found {len(all_links)} total links on page")
        
        for link in all_links:
            href = link.get('href', '')
            text = link.get_text().strip()
            
            # Look for service-level pages like ./AWS_ServiceName.html
            if href.startswith('./AWS_') and href.endswith('.html'):
                # Extract service name from filename
                service_file = href.replace('./', '').replace('.html', '')
                if service_file.startswith('AWS_'):
                    service_name = service_file[4:].lower()  # Remove 'AWS_' prefix
                    
                    logger.info(f"Found service: {service_name} from {href}")
                    
                    services[service_name] = {
                        'service_id': service_name,
                        'resource_types': [],
                        'cloudformation_prefix': f"AWS::{service_file[4:]}::",
                        'documentation_urls': [urljoin(self.base_url, href)],
                        'service_page': href
                    }
        
        # Add services that don't have CloudFormation resources but have IAM actions
        services_without_cf = {
            'q': {
                'service_id': 'q',
                'resource_types': [],
                'cloudformation_prefix': 'AWS::Q::',
                'documentation_urls': [],
                'service_page': None,
                'has_iam_actions': True,
                'has_cloudformation_resources': False
            },
            'amazonq': {
                'service_id': 'amazonq',
                'resource_types': [],
                'cloudformation_prefix': 'AWS::Q::',
                'documentation_urls': [],
                'service_page': None,
                'has_iam_actions': True,
                'has_cloudformation_resources': False
            },
            'qbusiness': {
                'service_id': 'qbusiness',
                'resource_types': ['qbusiness-application', 'qbusiness-dataaccessor', 'qbusiness-datasource', 'qbusiness-index', 'qbusiness-permission', 'qbusiness-plugin', 'qbusiness-retriever', 'qbusiness-webexperience'],
                'cloudformation_prefix': 'AWS::QBusiness::',
                'documentation_urls': [],
                'service_page': None,
                'has_iam_actions': True,
                'has_cloudformation_resources': True
            }
        }
        
        # Add services without CloudFormation resources
        for service_id, service_data in services_without_cf.items():
            if service_id not in services:
                services[service_id] = service_data
                logger.info(f"Added service without CloudFormation resources: {service_id}")
        
        logger.info(f"Extracted {len(services)} services from page content")
        return services
    
    def _get_documentation_urls(self, resource_types):
        """Generate documentation URLs for resource types"""
        urls = []
        for resource_type in resource_types:
            url = f"{self.base_url}/AWSCloudFormation/latest/UserGuide/aws-resource-{resource_type}.html"
            urls.append(url)
        return urls
    
    def enhance_service_mappings(self, services):
        """Enhance service mappings with additional metadata"""
        enhanced_services = {}
        
        for service_id, service_data in services.items():
            enhanced_services[service_id] = {
                **service_data,
                'iam_service_name': self._get_iam_service_name(service_id),
                'service_authorization_url': self._get_service_authorization_url(service_id),
                'common_actions': self._get_common_actions(service_id),
                'has_iam_actions': service_data.get('has_iam_actions', True),
                'has_cloudformation_resources': service_data.get('has_cloudformation_resources', len(service_data.get('resource_types', [])) > 0),
                'last_updated': time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())
            }
        
        return enhanced_services
    
    def _get_iam_service_name(self, service_id):
        """Map CloudFormation service ID to IAM service name"""
        # Common mappings where CloudFormation and IAM service names differ
        iam_mappings = {
            'apigateway': 'apigateway',
            'apigatewayv2': 'apigateway',
            'applicationautoscaling': 'application-autoscaling',
            'autoscaling': 'autoscaling',
            'cloudformation': 'cloudformation',
            'cloudfront': 'cloudfront',
            'cloudtrail': 'cloudtrail',
            'cloudwatch': 'cloudwatch',
            'dynamodb': 'dynamodb',
            'ec2': 'ec2',
            'ecs': 'ecs',
            'eks': 'eks',
            'elasticloadbalancing': 'elasticloadbalancing',
            'elasticloadbalancingv2': 'elasticloadbalancing',
            'iam': 'iam',
            'lambda': 'lambda',
            'logs': 'logs',
            'rds': 'rds',
            's3': 's3',
            'sns': 'sns',
            'sqs': 'sqs',
            'stepfunctions': 'states'
        }
        
        return iam_mappings.get(service_id, service_id)
    
    def _get_service_authorization_url(self, service_id):
        """Generate service authorization documentation URL"""
        iam_service = self._get_iam_service_name(service_id)
        
        # Handle special cases with explicit URLs
        special_cases = {
            'amazonq': ["https://docs.aws.amazon.com/service-authorization/latest/reference/list_amazonq.html"],
            'q': ["https://docs.aws.amazon.com/service-authorization/latest/reference/list_amazonq.html"],
            'qbusiness': ["https://docs.aws.amazon.com/service-authorization/latest/reference/list_amazonqbusiness.html"],
            'accessanalyzer': ["https://docs.aws.amazon.com/service-authorization/latest/reference/list_awsiamaccessanalyzer.html"],
            'acm': ["https://docs.aws.amazon.com/service-authorization/latest/reference/list_awscertificatemanager.html"],
            'apigateway': ["https://docs.aws.amazon.com/service-authorization/latest/reference/list_amazonapigateway.html"],
            'autoscaling': ["https://docs.aws.amazon.com/service-authorization/latest/reference/list_amazonec2autoscaling.html"],
            'elasticloadbalancing': ["https://docs.aws.amazon.com/service-authorization/latest/reference/list_elasticloadbalancing.html"],
            'elasticloadbalancingv2': ["https://docs.aws.amazon.com/service-authorization/latest/reference/list_elasticloadbalancingv2.html"],
            'stepfunctions': ["https://docs.aws.amazon.com/service-authorization/latest/reference/list_awsstepfunctions.html"]
        }
        
        if service_id in special_cases:
            return special_cases[service_id]
        
        # Standard patterns
        patterns = [
            f"https://docs.aws.amazon.com/service-authorization/latest/reference/list_amazon{iam_service}.html",
            f"https://docs.aws.amazon.com/service-authorization/latest/reference/list_{iam_service}.html",
            f"https://docs.aws.amazon.com/service-authorization/latest/reference/list_aws{iam_service}.html"
        ]
        
        return patterns
    
    def _get_common_actions(self, service_id):
        """Get common actions for a service"""
        common_actions = {
            'dynamodb': ['CreateTable', 'DeleteTable', 'DescribeTable', 'PutItem', 'GetItem', 'UpdateItem', 'DeleteItem'],
            'lambda': ['CreateFunction', 'DeleteFunction', 'InvokeFunction', 'UpdateFunctionCode', 'GetFunction'],
            's3': ['CreateBucket', 'DeleteBucket', 'GetObject', 'PutObject', 'DeleteObject', 'ListBucket'],
            'ec2': ['RunInstances', 'TerminateInstances', 'DescribeInstances', 'CreateVpc', 'DeleteVpc'],
            'iam': ['CreateRole', 'DeleteRole', 'AttachRolePolicy', 'DetachRolePolicy', 'CreatePolicy'],
            'sns': ['CreateTopic', 'DeleteTopic', 'Publish', 'Subscribe', 'Unsubscribe'],
            'sqs': ['CreateQueue', 'DeleteQueue', 'SendMessage', 'ReceiveMessage', 'DeleteMessage']
        }
        
        return common_actions.get(service_id, [])

def main():
    """Main function to extract and save service mappings"""
    extractor = CloudFormationServiceExtractor()
    
    logger.info("Starting AWS service mapping extraction...")
    
    # Extract services from CloudFormation documentation
    services = extractor.extract_services_from_main_page()
    
    if not services:
        logger.error("No services extracted. Exiting.")
        return
    
    # Enhance with additional metadata
    enhanced_services = extractor.enhance_service_mappings(services)
    
    # Create output structure matching config-example format
    output_structure = {
        "metadata": {
            "version": "1.0.0",
            "description": "AWS Service mappings for CloudFormation resource types and IAM service authorization",
            "last_updated": time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime()),
            "total_services": len(enhanced_services),
            "usage": "This file maps AWS service IDs to their CloudFormation resource types and IAM service names for documentation collection"
        },
        "services": enhanced_services
    }
    
    # Save to file
    output_file = '/Users/roficas/aws-infrastructure-reverse-engineering/scripts/aws_service_mappings.json'
    
    with open(output_file, 'w') as f:
        json.dump(output_structure, f, indent=2, sort_keys=True)
    
    logger.info(f"Service mappings saved to: {output_file}")
    logger.info(f"Total services: {len(enhanced_services)}")
    
    # Print summary
    print("\n=== EXTRACTION SUMMARY ===")
    print(f"Total services extracted: {len(enhanced_services)}")
    print("\nServices found:")
    for service_id, data in sorted(enhanced_services.items()):
        print(f"  {service_id}: {len(data['resource_types'])} resource types")
    
    print(f"\nOutput saved to: {output_file}")

if __name__ == "__main__":
    main()
