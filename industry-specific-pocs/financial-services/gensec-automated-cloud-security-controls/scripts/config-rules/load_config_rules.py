#!/usr/bin/env python3
"""
Load AWS Config Managed Rules from documentation to DynamoDB
"""

import boto3
import json
import os
import re
import requests
from bs4 import BeautifulSoup
from typing import List, Dict
from datetime import datetime

# Configuration
TABLE_NAME = 'gensec-AWSConfigManagedRules'
REGION = 'us-east-1'

def extract_services_from_resource_types(resource_types: List[str]) -> List[str]:
    """Extract AWS service names from resource types"""
    services = set()
    
    for rt in resource_types:
        if '::' in rt and rt.startswith('AWS::'):
            # Extract service from AWS::ServiceName::ResourceType
            parts = rt.split('::')
            if len(parts) >= 2:
                service_name = parts[1].lower()
                services.add(service_name)
    
    return list(services) if services else ['global']

def extract_service_from_rule_name(rule_name: str) -> str:
    """Extract AWS service name from Config rule name using patterns"""
    # Extract first part before dash as service name
    parts = rule_name.split('-')
    if len(parts) > 1:
        return parts[0]
    return 'global'

def extract_rule_details(rule_name: str) -> Dict:
    """Extract detailed information from individual rule documentation page"""
    url = f"https://docs.aws.amazon.com/config/latest/developerguide/{rule_name}.html"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            return {}
            
        soup = BeautifulSoup(response.content, 'html.parser')
        
        details = {
            'documentation_url': url,
            'type': 'MANAGED',
            'parameters': [],
            'resource_types': []
        }
        
        # Extract description from first paragraph
        first_p = soup.find('p')
        if first_p:
            details['description'] = first_p.get_text().strip()[:500]  # Limit length
        
        # Extract resource types - look for the pattern after "Resource Types:"
        resource_types = re.findall(r'AWS::[A-Za-z0-9]+::[A-Za-z0-9]+', soup.get_text())
        if resource_types:
            details['resource_types'] = list(set(resource_types))  # Remove duplicates
        
        # Extract parameters
        params_section = soup.find(string=re.compile(r'Parameters?:'))
        if params_section:
            params_parent = params_section.parent
            if params_parent:
                # Look for parameter definitions in the following content
                dl_elem = params_parent.find_next('dl')
                if dl_elem:
                    param_terms = dl_elem.find_all('dt')
                    param_descs = dl_elem.find_all('dd')
                    
                    for i, term in enumerate(param_terms):
                        if 'Type:' not in term.get_text() and 'Default:' not in term.get_text():
                            param_name = term.get_text().strip()
                            param_desc = param_descs[i].get_text().strip() if i < len(param_descs) else ""
                            
                            details['parameters'].append({
                                'name': param_name,
                                'description': param_desc[:200]  # Limit length
                            })
        
        return details
        
    except Exception as e:
        print(f"Error extracting details for {rule_name}: {str(e)}")
        return {}

def extract_rules_from_documentation():
    """Extract AWS Config managed rules from documentation"""
    url = "https://docs.aws.amazon.com/config/latest/developerguide/managed-rules-by-aws-config.html"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        rule_names = set()
        
        # Extract rules from documentation elements
        elements = soup.find_all(['code', 'pre', 'tt', 'td', 'th', 'li'])
        for element in elements:
            text = element.get_text()
            matches = re.findall(r'\b([a-z][a-z0-9]*(?:-[a-z0-9]+)+)\b', text.lower())
            for match in matches:
                if (5 <= len(match) <= 80 and 
                    match.count('-') >= 1 and
                    not match.startswith('-') and
                    not match.endswith('-')):
                    rule_names.add(match)
        
        # Filter to valid AWS Config rules
        valid_rules = []
        for rule in rule_names:
            if (any(rule.endswith(suffix) for suffix in ['-check', '-enabled', '-required', '-prohibited', '-tagged', '-encrypted', '-compliance', '-validation', '-configured', '-disabled']) or
                rule in ['instances-in-vpc', 'restricted-ssh', 'restricted-common-ports', 'access-keys-rotated'] or
                re.match(r'^[a-z]+[0-9]*-[a-z0-9-]+$', rule)):
                valid_rules.append(rule)
        
        print(f"Documentation scraping found {len(valid_rules)} rules")
        return sorted(valid_rules)
        
    except Exception as e:
        print(f"Error extracting from documentation: {str(e)}")
        return []

def get_fallback_rules() -> List[str]:
    """Load fallback rules from baseline file (read-only)"""
    fallback_file = os.path.join(os.path.dirname(__file__), 'aws_config_manage_rules_baseline.json')
    try:
        with open(fallback_file, 'r') as f:
            rules = json.load(f)
        print(f"Loaded {len(rules)} rules from baseline file")
        return rules
    except Exception as e:
        print(f"Error loading baseline file: {str(e)}")
        return []

def store_rules_in_dynamodb(rules: List[Dict]) -> bool:
    """Store rules in DynamoDB table"""
    try:
        dynamodb = boto3.client('dynamodb', region_name=REGION)
        
        # Clear existing rules
        response = dynamodb.scan(TableName=TABLE_NAME, ProjectionExpression='rule_name, service_name')
        for item in response.get('Items', []):
            dynamodb.delete_item(
                TableName=TABLE_NAME,
                Key={
                    'rule_name': item['rule_name'],
                    'service_name': item['service_name']
                }
            )
        
        # Store new rules
        for rule in rules:
            dynamodb.put_item(TableName=TABLE_NAME, Item=rule)
        
        print(f"Successfully stored {len(rules)} rules in DynamoDB")
        return True
        
    except Exception as e:
        print(f"Error storing rules in DynamoDB: {str(e)}")
        return False

def main():
    print(f"Loading AWS Config managed rules to {TABLE_NAME}...")
    
    # Try to get rules from documentation
    rule_names = extract_rules_from_documentation()
    
    if not rule_names:
        print("Documentation extraction failed, using baseline file...")
        rule_names = get_fallback_rules()
    
    if not rule_names:
        print("❌ No rules found from any source")
        return
    
    # Convert to DynamoDB format with enhanced schema
    rules = []
    service_counts = {}
    
    print(f"Extracting detailed information for {len(rule_names)} rules...")
    
    for i, rule_name in enumerate(rule_names):
        if i % 10 == 0:
            print(f"Processing rule {i+1}/{len(rule_names)}: {rule_name}")
            
        # Extract detailed information first
        details = extract_rule_details(rule_name)
        
        # Extract services from resource types (primary method)
        services_from_resources = extract_services_from_resource_types(details.get('resource_types', []))
        
        # Fallback to rule name if no resource types found
        if not services_from_resources or services_from_resources == ['global']:
            fallback_service = extract_service_from_rule_name(rule_name)
            services_from_resources = [fallback_service]
        
        # Create separate entry for each service
        for service_name in services_from_resources:
            service_counts[service_name] = service_counts.get(service_name, 0) + 1
            
            # Create rule record for this specific service
            rule_record = {
                'rule_name': {'S': rule_name},
                'service_name': {'S': service_name},  # Individual service for GSI
                'type': {'S': details.get('type', 'MANAGED')},
                'description': {'S': details.get('description', f'AWS Config managed rule for {service_name}')},
                'documentation_url': {'S': details.get('documentation_url', f'https://docs.aws.amazon.com/config/latest/developerguide/{rule_name}.html')},
                'last_updated': {'S': datetime.utcnow().isoformat()}
            }
            
            # Add all services this rule supports (for reference)
            rule_record['services'] = {'SS': services_from_resources}
            
            # Add parameters if available
            if details.get('parameters'):
                params_list = []
                for param in details['parameters']:
                    params_list.append({'M': {
                        'name': {'S': param['name']},
                        'description': {'S': param['description']}
                    }})
                if params_list:
                    rule_record['parameters'] = {'L': params_list}
            
            rules.append(rule_record)
    
    if rules:
        print(f"\nService distribution:")
        for service, count in sorted(service_counts.items()):
            print(f"  {service}: {count} rules")
        
        # Generate JSON file with datetime
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        json_filename = f"aws_config_rules_{timestamp}.json"
        
        # Convert DynamoDB format to regular JSON for readability
        json_data = []
        for rule in rules:
            json_rule = {}
            for key, value in rule.items():
                if isinstance(value, dict):
                    if 'S' in value:
                        json_rule[key] = value['S']
                    elif 'SS' in value:
                        json_rule[key] = value['SS']
                    elif 'L' in value:
                        json_rule[key] = [item['M'] for item in value['L']]
                    elif 'M' in value:
                        json_rule[key] = value['M']
                else:
                    json_rule[key] = value
            json_data.append(json_rule)
        
        # Save to JSON file
        with open(json_filename, 'w') as f:
            json.dump({
                'metadata': {
                    'generated_at': datetime.utcnow().isoformat(),
                    'total_rules': len(set(rule['rule_name']['S'] for rule in rules)),
                    'total_entries': len(rules),
                    'service_distribution': service_counts
                },
                'rules': json_data
            }, f, indent=2)
        
        print(f"\n✅ JSON file generated: {json_filename}")
        
        if store_rules_in_dynamodb(rules):
            print(f"\n✅ Successfully loaded {len(rules)} AWS Config managed rules")
        else:
            print(f"\n❌ Failed to store rules in DynamoDB")
    else:
        print("❌ No valid rules to store")

if __name__ == '__main__':
    main()
