#!/usr/bin/env python3

import sys
import os
sys.path.append('lambda/AWSServiceDocumentationManager')

# Mock environment variables
os.environ['DOCUMENTATION_BUCKET'] = 'test-bucket'
os.environ['DYNAMODB_TABLE_SERVICE_ACTIONS'] = 'test-actions'
os.environ['DYNAMODB_TABLE_SERVICE_PARAMETERS'] = 'test-parameters'
os.environ['DYNAMODB_TABLE_SERVICE_INVENTORY'] = 'test-inventory'

from lambda_function import AWSServiceDocumentationCollector
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)

def test_service_actions(service_id):
    """Test action collection for a service"""
    print(f"\n=== Testing Actions Collection for {service_id} ===")
    
    # Mock the AWS clients to avoid actual calls
    collector = AWSServiceDocumentationCollector()
    collector.dynamodb = None
    collector.s3 = None
    
    actions = collector.collect_service_actions(service_id)
    
    print(f"Found {len(actions)} actions")
    if actions:
        print("Sample actions:")
        for action in actions[:5]:  # Show first 5
            print(f"  - {action['action_name']}: {action['description'][:100]}...")
    
    return len(actions) > 0

def test_service_parameters(service_id):
    """Test parameter collection for a service"""
    print(f"\n=== Testing Parameters Collection for {service_id} ===")
    
    collector = AWSServiceDocumentationCollector()
    collector.dynamodb = None
    collector.s3 = None
    
    parameters = collector.collect_service_parameters(service_id)
    
    print(f"Found {len(parameters)} parameters")
    if parameters:
        print("Sample parameters:")
        for param in parameters[:5]:  # Show first 5
            print(f"  - {param['parameter_name']}: {param.get('description', 'No description')[:100]}...")
    
    return len(parameters) > 0

if __name__ == "__main__":
    services_to_test = ['sns', 'ec2', 's3', 'lambda']
    
    results = {}
    
    for service in services_to_test:
        print(f"\n{'='*60}")
        print(f"TESTING SERVICE: {service.upper()}")
        print(f"{'='*60}")
        
        actions_success = test_service_actions(service)
        parameters_success = test_service_parameters(service)
        
        results[service] = {
            'actions': actions_success,
            'parameters': parameters_success
        }
    
    # Summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    
    for service, result in results.items():
        actions_status = "✓" if result['actions'] else "✗"
        params_status = "✓" if result['parameters'] else "✗"
        print(f"{service.upper():10} | Actions: {actions_status} | Parameters: {params_status}")
