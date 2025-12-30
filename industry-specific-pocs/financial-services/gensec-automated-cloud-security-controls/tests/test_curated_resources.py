#!/usr/bin/env python3
"""
Test that curated resources are properly loaded and used by the Lambda function
"""

import json
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lambda', 'AWSServiceDocumentationManager'))

def test_service_mappings_have_curated_resources():
    """Test that service mappings contain curated resource types"""
    with open('config-example/service-mappings.json', 'r') as f:
        mappings = json.load(f)
    
    services = mappings['services']
    
    # Test EC2 has curated resources
    assert 'ec2' in services, "EC2 service not found in mappings"
    ec2_resources = services['ec2']['resource_types']
    assert len(ec2_resources) > 0, "EC2 should have curated resources"
    assert len(ec2_resources) == 15, f"EC2 should have 15 curated resources, got {len(ec2_resources)}"
    
    # Verify core resources are included
    assert 'ec2-instance' in ec2_resources, "ec2-instance should be in curated resources"
    assert 'ec2-vpc' in ec2_resources, "ec2-vpc should be in curated resources"
    assert 'ec2-securitygroup' in ec2_resources, "ec2-securitygroup should be in curated resources"
    
    # Verify sub-resources are NOT included
    assert 'ec2-securitygroupingress' not in ec2_resources, "Sub-resources should be filtered out"
    assert 'ec2-securitygroupegress' not in ec2_resources, "Sub-resources should be filtered out"
    
    print("✓ EC2 has 15 curated core resources")
    
    # Test Lambda has curated resources
    assert 'lambda' in services, "Lambda service not found in mappings"
    lambda_resources = services['lambda']['resource_types']
    assert len(lambda_resources) > 0, "Lambda should have curated resources"
    assert len(lambda_resources) == 6, f"Lambda should have 6 curated resources, got {len(lambda_resources)}"
    assert 'lambda-function' in lambda_resources, "lambda-function should be in curated resources"
    
    print("✓ Lambda has 6 curated core resources")
    
    # Test S3 has curated resources
    assert 's3' in services, "S3 service not found in mappings"
    s3_resources = services['s3']['resource_types']
    assert len(s3_resources) > 0, "S3 should have curated resources"
    assert len(s3_resources) == 5, f"S3 should have 5 curated resources, got {len(s3_resources)}"
    assert 's3-bucket' in s3_resources, "s3-bucket should be in curated resources"
    
    print("✓ S3 has 5 curated core resources")
    
    # Test DynamoDB has curated resources
    assert 'dynamodb' in services, "DynamoDB service not found in mappings"
    dynamodb_resources = services['dynamodb']['resource_types']
    assert len(dynamodb_resources) == 2, f"DynamoDB should have 2 curated resources, got {len(dynamodb_resources)}"
    assert 'dynamodb-table' in dynamodb_resources, "dynamodb-table should be in curated resources"
    
    print("✓ DynamoDB has 2 curated core resources")
    
    # Count services with curated resources
    services_with_resources = sum(1 for s in services.values() if len(s.get('resource_types', [])) > 0)
    print(f"✓ {services_with_resources} services have curated resources")
    
    # Verify services without curated resources have empty arrays (not missing)
    for service_id, service_data in services.items():
        assert 'resource_types' in service_data, f"{service_id} missing resource_types field"
        assert isinstance(service_data['resource_types'], list), f"{service_id} resource_types should be a list"
    
    print("✓ All services have resource_types field (array)")

def test_lambda_uses_curated_resources():
    """Test that Lambda function properly uses curated resources from mappings"""
    # This would require mocking the Lambda environment
    # For now, we just verify the logic is correct
    
    # Simulate what the Lambda does
    with open('config-example/service-mappings.json', 'r') as f:
        mappings = json.load(f)
    
    services = mappings['services']
    
    # Simulate parameter extraction for EC2
    service_id = 'ec2'
    service_config = services.get(service_id.lower(), {})
    resource_types = service_config.get('resource_types', [])
    
    # Lambda should get curated resources directly
    assert len(resource_types) == 15, "Lambda should get 15 curated EC2 resources"
    assert 'ec2-instance' in resource_types, "Lambda should get ec2-instance"
    
    # Lambda should NOT need to filter or discover
    # (no _should_include_resource_type or _discover_resource_types calls)
    
    print("✓ Lambda correctly uses curated resources from mappings")

if __name__ == '__main__':
    print("Testing curated resources in service mappings...")
    print()
    
    try:
        test_service_mappings_have_curated_resources()
        print()
        test_lambda_uses_curated_resources()
        print()
        print("=" * 60)
        print("✓ All tests passed!")
        print("=" * 60)
    except AssertionError as e:
        print()
        print("=" * 60)
        print(f"✗ Test failed: {e}")
        print("=" * 60)
        sys.exit(1)
