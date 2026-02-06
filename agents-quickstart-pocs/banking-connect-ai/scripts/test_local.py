"""Local testing script for card operations"""
import json
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.lambda_handler.handler import lambda_handler


def test_lock_card():
    """Test lock card operation"""
    print("\n=== Testing Lock Card ===")
    
    event = {
        'httpMethod': 'POST',
        'path': '/v1/cards/lock',
        'body': json.dumps({
            'customer_id': 'CUST001',
            'card_id': 'CARD001'
        })
    }
    
    response = lambda_handler(event, None)
    print(f"Status Code: {response['statusCode']}")
    print(f"Response: {json.dumps(json.loads(response['body']), indent=2)}")
    
    return response['statusCode'] == 200


def test_unlock_card():
    """Test unlock card operation"""
    print("\n=== Testing Unlock Card ===")
    
    event = {
        'httpMethod': 'POST',
        'path': '/v1/cards/unlock',
        'body': json.dumps({
            'customer_id': 'CUST001',
            'card_id': 'CARD001'
        })
    }
    
    response = lambda_handler(event, None)
    print(f"Status Code: {response['statusCode']}")
    print(f"Response: {json.dumps(json.loads(response['body']), indent=2)}")
    
    return response['statusCode'] == 200


def test_request_new_card():
    """Test request new card operation"""
    print("\n=== Testing Request New Card ===")
    
    event = {
        'httpMethod': 'POST',
        'path': '/v1/cards/request-new',
        'body': json.dumps({
            'customer_id': 'CUST001',
            'account_id': 'ACC001',
            'reason': 'Lost card',
            'delivery_address': '123 Main St, Cincinnati, OH 45202'
        })
    }
    
    response = lambda_handler(event, None)
    print(f"Status Code: {response['statusCode']}")
    print(f"Response: {json.dumps(json.loads(response['body']), indent=2)}")
    
    return response['statusCode'] == 200


def test_unauthorized_access():
    """Test unauthorized access (wrong customer)"""
    print("\n=== Testing Unauthorized Access ===")
    
    event = {
        'httpMethod': 'POST',
        'path': '/v1/cards/lock',
        'body': json.dumps({
            'customer_id': 'CUST002',  # Wrong customer
            'card_id': 'CARD001'  # Belongs to CUST001
        })
    }
    
    response = lambda_handler(event, None)
    print(f"Status Code: {response['statusCode']}")
    print(f"Response: {json.dumps(json.loads(response['body']), indent=2)}")
    
    return response['statusCode'] == 403


def test_card_not_found():
    """Test card not found error"""
    print("\n=== Testing Card Not Found ===")
    
    event = {
        'httpMethod': 'POST',
        'path': '/v1/cards/lock',
        'body': json.dumps({
            'customer_id': 'CUST001',
            'card_id': 'CARD999'  # Doesn't exist
        })
    }
    
    response = lambda_handler(event, None)
    print(f"Status Code: {response['statusCode']}")
    print(f"Response: {json.dumps(json.loads(response['body']), indent=2)}")
    
    return response['statusCode'] == 404


if __name__ == '__main__':
    print("=" * 60)
    print("Local Testing for Card Operations API")
    print("=" * 60)
    print("\nNote: Make sure DynamoDB tables are created and seeded!")
    print("Run: python scripts/create_tables.py")
    print("Run: python scripts/seed_data.py")
    
    results = []
    
    # Run tests
    results.append(("Lock Card", test_lock_card()))
    results.append(("Unlock Card", test_unlock_card()))
    results.append(("Request New Card", test_request_new_card()))
    results.append(("Unauthorized Access", test_unauthorized_access()))
    results.append(("Card Not Found", test_card_not_found()))
    
    # Print summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{test_name}: {status}")
    
    all_passed = all(result[1] for result in results)
    print("\n" + ("✓ All tests passed!" if all_passed else "✗ Some tests failed"))
