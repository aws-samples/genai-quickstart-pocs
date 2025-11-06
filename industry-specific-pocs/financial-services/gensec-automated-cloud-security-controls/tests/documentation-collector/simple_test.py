#!/usr/bin/env python3

import requests
from bs4 import BeautifulSoup
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger()

def test_url_patterns(service_id):
    """Test different URL patterns for a service"""
    service_id_lower = service_id.lower()
    
    url_patterns = [
        f"https://docs.aws.amazon.com/service-authorization/latest/reference/list_amazon{service_id_lower}.html",
        f"https://docs.aws.amazon.com/service-authorization/latest/reference/list_{service_id_lower}.html",
        f"https://docs.aws.amazon.com/service-authorization/latest/reference/list_aws{service_id_lower}.html"
    ]
    
    print(f"\n=== Testing URL patterns for {service_id} ===")
    
    for url in url_patterns:
        try:
            response = requests.get(url, timeout=10)
            print(f"  {url} -> HTTP {response.status_code}")
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                tables = soup.find_all('table')
                
                actions_found = 0
                for table in tables:
                    thead = table.find('thead')
                    if thead:
                        headers = [th.text.strip().lower() for th in thead.find_all('th')]
                        if 'actions' in headers:
                            tbody = table.find('tbody') or table
                            rows = tbody.find_all('tr')
                            actions_found = len(rows) - (1 if not thead else 0)
                            break
                
                print(f"    -> Found {actions_found} actions in table")
                return True, actions_found
                
        except Exception as e:
            print(f"  {url} -> ERROR: {str(e)}")
    
    return False, 0

def test_cloudformation_urls(service_id):
    """Test CloudFormation documentation URLs"""
    service_mappings = {
        'dynamodb': ['dynamodb-table'],
        'ec2': ['ec2-instance', 'ec2-vpc'],
        'sns': ['sns-topic'],
        's3': ['s3-bucket']
    }
    
    resource_types = service_mappings.get(service_id.lower(), [service_id.lower()])
    
    print(f"\n=== Testing CloudFormation URLs for {service_id} ===")
    
    total_params = 0
    for resource_type in resource_types:
        url = f"https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-{resource_type}.html"
        
        try:
            response = requests.get(url, timeout=10)
            print(f"  {url} -> HTTP {response.status_code}")
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Look for Properties sections
                properties_found = False
                for heading in soup.find_all(['h1', 'h2', 'h3']):
                    if 'properties' in heading.text.lower():
                        properties_found = True
                        break
                
                print(f"    -> Properties section found: {properties_found}")
                if properties_found:
                    total_params += 1
                    
        except Exception as e:
            print(f"  {url} -> ERROR: {str(e)}")
    
    return total_params > 0

if __name__ == "__main__":
    services = ['sns', 'ec2', 's3', 'lambda']
    
    results = {}
    
    for service in services:
        print(f"\n{'='*60}")
        print(f"TESTING: {service.upper()}")
        print(f"{'='*60}")
        
        actions_success, action_count = test_url_patterns(service)
        params_success = test_cloudformation_urls(service)
        
        results[service] = {
            'actions_success': actions_success,
            'action_count': action_count,
            'params_success': params_success
        }
    
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    
    for service, result in results.items():
        actions_status = f"✓ ({result['action_count']})" if result['actions_success'] else "✗"
        params_status = "✓" if result['params_success'] else "✗"
        print(f"{service.upper():8} | Actions: {actions_status:10} | Parameters: {params_status}")
