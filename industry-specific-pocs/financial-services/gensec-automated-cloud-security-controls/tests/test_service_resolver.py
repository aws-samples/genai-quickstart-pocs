#!/usr/bin/env python3
"""
Test script for Service Name Resolver
Validates that service name resolution works correctly
"""

import sys
import os
import json

# Add the common layer to the path (before building)
layer_path = os.path.join(os.path.dirname(__file__), '..', 'layers', 'common-layer', 'python')
if os.path.exists(layer_path):
    sys.path.insert(0, layer_path)

# Try to import from layer, if not available, load directly from source
try:
    from service_name_resolver import ServiceNameResolver
except ImportError:
    # Load the module directly from source (before layer is built)
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        "service_name_resolver",
        os.path.join(os.path.dirname(__file__), '..', 'layers', 'common-layer', 'python', 'service_name_resolver.py')
    )
    service_name_resolver = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(service_name_resolver)
    ServiceNameResolver = service_name_resolver.ServiceNameResolver


def load_service_mappings():
    """Load service mappings from config file"""
    config_path = os.path.join(
        os.path.dirname(__file__),
        '..',
        'config-example',
        'service-mappings.json'
    )
    
    with open(config_path, 'r') as f:
        data = json.load(f)
    
    return data.get('services', {})


def test_resolver():
    """Test the service name resolver"""
    print("=" * 80)
    print("SERVICE NAME RESOLVER TEST")
    print("=" * 80)
    
    # Load mappings
    print("\n1. Loading service mappings...")
    mappings = load_service_mappings()
    print(f"   ✓ Loaded {len(mappings)} services")
    
    # Create resolver
    print("\n2. Creating resolver...")
    resolver = ServiceNameResolver(mappings)
    print(f"   ✓ Built alias index with {len(resolver.alias_to_service_id)} entries")
    
    # Test cases
    test_cases = [
        # Load Balancer tests (the main issue)
        ("Gateway Load Balancer", "elasticloadbalancingv2", "Human-readable name"),
        ("Application Load Balancer", "elasticloadbalancingv2", "Human-readable name"),
        ("Network Load Balancer", "elasticloadbalancingv2", "Human-readable name"),
        ("ALB", "elasticloadbalancingv2", "Common abbreviation"),
        ("NLB", "elasticloadbalancingv2", "Common abbreviation"),
        ("GWLB", "elasticloadbalancingv2", "Common abbreviation"),
        ("ELBv2", "elasticloadbalancingv2", "Technical abbreviation"),
        ("elasticloadbalancingv2", "elasticloadbalancingv2", "Exact service ID"),
        
        # Other common services
        ("SNS", "sns", "Service ID"),
        ("SQS", "sqs", "Service ID"),
        ("EC2", "ec2", "Service ID"),
        ("Bedrock", "bedrock", "Human-readable name"),
        ("Amazon Bedrock", "bedrock", "Full service name"),
        ("Lambda", "lambda", "Human-readable name"),
        ("AWS Lambda", "lambda", "Full service name"),
        ("DynamoDB", "dynamodb", "Human-readable name"),
        ("Amazon DynamoDB", "dynamodb", "Full service name"),
        
        # Edge cases
        ("s3", "s3", "Lowercase service ID"),
        ("S3", "s3", "Uppercase service ID"),
        ("Simple Storage Service", "s3", "Full service name"),
        
        # Fuzzy matching tests
        ("Gateway Loadbalancer", "elasticloadbalancingv2", "Typo - missing space"),
        ("ApplicationLoadBalancer", "elasticloadbalancingv2", "No spaces"),
        
        # Invalid service
        ("InvalidService123", None, "Invalid service name"),
    ]
    
    print("\n3. Running test cases...")
    print("-" * 80)
    
    passed = 0
    failed = 0
    
    for service_name, expected_id, description in test_cases:
        result = resolver.resolve(service_name)
        
        if result == expected_id:
            status = "✓ PASS"
            passed += 1
        else:
            status = "✗ FAIL"
            failed += 1
        
        print(f"{status} | '{service_name}' → '{result}' (expected: '{expected_id}')")
        print(f"       {description}")
        
        # Show suggestions for failed cases
        if result != expected_id and expected_id is None:
            suggestions = resolver.get_suggestions(service_name, limit=3)
            if suggestions:
                print(f"       Suggestions:")
                for sid, alias, conf in suggestions:
                    print(f"         - {alias} (service ID: {sid}, confidence: {conf:.2f})")
        
        print()
    
    # Summary
    print("-" * 80)
    print(f"\nTest Results: {passed} passed, {failed} failed out of {len(test_cases)} tests")
    
    if failed == 0:
        print("✓ All tests passed!")
        return 0
    else:
        print(f"✗ {failed} test(s) failed")
        return 1


def test_error_messages():
    """Test error message formatting"""
    print("\n" + "=" * 80)
    print("ERROR MESSAGE TEST")
    print("=" * 80)
    
    mappings = load_service_mappings()
    resolver = ServiceNameResolver(mappings)
    
    invalid_names = [
        "Gateway Load Balancer Service",
        "AWS Gateway LB",
        "LoadBalancer",
    ]
    
    for name in invalid_names:
        print(f"\nInvalid service: '{name}'")
        print("-" * 80)
        error_msg = resolver.format_error_message(name)
        print(error_msg)
        print()


def main():
    """Main test function"""
    try:
        # Run resolver tests
        exit_code = test_resolver()
        
        # Run error message tests
        test_error_messages()
        
        return exit_code
        
    except Exception as e:
        print(f"\n✗ Error running tests: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
