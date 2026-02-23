"""Script to seed AWS DynamoDB tables with mock data"""
import boto3
from datetime import datetime
from decimal import Decimal
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


def get_stack_outputs(stack_name, region='us-east-1'):
    """Get CloudFormation stack outputs"""
    cf = boto3.client('cloudformation', region_name=region)
    
    try:
        response = cf.describe_stacks(StackName=stack_name)
        outputs = response['Stacks'][0]['Outputs']
        
        return {
            output['OutputKey']: output['OutputValue']
            for output in outputs
        }
    except Exception as e:
        print(f"Error getting stack outputs: {e}")
        print(f"Make sure stack '{stack_name}' exists in region '{region}'")
        sys.exit(1)


def seed_data(table_names, region='us-east-1'):
    """Seed tables with mock customer, account, and card data"""
    
    # Initialize DynamoDB resource
    dynamodb = boto3.resource('dynamodb', region_name=region)
    
    # Get table references
    customers_table = dynamodb.Table(table_names['CustomersTableName'])
    accounts_table = dynamodb.Table(table_names['AccountsTableName'])
    cards_table = dynamodb.Table(table_names['CardsTableName'])
    
    now = datetime.utcnow().isoformat()
    
    # Mock Customers
    customers = [
        {
            'customer_id': 'CUST001',
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john.doe@example.com',
            'phone': '+1-555-0101',
            'created_at': now,
            'updated_at': now
        },
        {
            'customer_id': 'CUST002',
            'first_name': 'Jane',
            'last_name': 'Smith',
            'email': 'jane.smith@example.com',
            'phone': '+1-555-0102',
            'created_at': now,
            'updated_at': now
        },
        {
            'customer_id': 'CUST003',
            'first_name': 'Bob',
            'last_name': 'Johnson',
            'email': 'bob.johnson@example.com',
            'phone': '+1-555-0103',
            'created_at': now,
            'updated_at': now
        }
    ]
    
    # Mock Accounts
    accounts = [
        {
            'account_id': 'ACC001',
            'customer_id': 'CUST001',
            'account_type': 'checking',
            'routing_number': '042000013',
            'account_number': '1234567890',
            'balance': Decimal('5000.00'),
            'status': 'active',
            'created_at': now,
            'updated_at': now
        },
        {
            'account_id': 'ACC002',
            'customer_id': 'CUST001',
            'account_type': 'savings',
            'routing_number': '042000014',
            'account_number': '1234567891',
            'balance': Decimal('10000.00'),
            'status': 'active',
            'created_at': now,
            'updated_at': now
        },
        {
            'account_id': 'ACC003',
            'customer_id': 'CUST002',
            'account_type': 'checking',
            'routing_number': '042000015',
            'account_number': '2234567890',
            'balance': Decimal('3000.00'),
            'status': 'active',
            'created_at': now,
            'updated_at': now
        },
        {
            'account_id': 'ACC004',
            'customer_id': 'CUST002',
            'account_type': 'savings',
            'routing_number': '042000016',
            'account_number': '2234567891',
            'balance': Decimal('15000.00'),
            'status': 'active',
            'created_at': now,
            'updated_at': now
        },
        {
            'account_id': 'ACC005',
            'customer_id': 'CUST003',
            'account_type': 'checking',
            'routing_number': '042000017',
            'account_number': '3234567890',
            'balance': Decimal('7500.00'),
            'status': 'active',
            'created_at': now,
            'updated_at': now
        }
    ]
    
    # Mock Cards
    cards = [
        {
            'card_id': 'CARD001',
            'account_id': 'ACC001',
            'card_number': '************1234',
            'last_four': '1234',
            'card_type': 'debit',
            'status': 'active',
            'expiration_date': '12/26',
            'created_at': now,
            'updated_at': now
        },
        {
            'card_id': 'CARD002',
            'account_id': 'ACC002',
            'card_number': '************5678',
            'last_four': '5678',
            'card_type': 'debit',
            'status': 'active',
            'expiration_date': '12/26',
            'created_at': now,
            'updated_at': now
        },
        {
            'card_id': 'CARD003',
            'account_id': 'ACC003',
            'card_number': '************9012',
            'last_four': '9012',
            'card_type': 'debit',
            'status': 'locked',
            'expiration_date': '12/26',
            'created_at': now,
            'updated_at': now
        },
        {
            'card_id': 'CARD004',
            'account_id': 'ACC004',
            'card_number': '************3456',
            'last_four': '3456',
            'card_type': 'debit',
            'status': 'active',
            'expiration_date': '12/26',
            'created_at': now,
            'updated_at': now
        },
        {
            'card_id': 'CARD005',
            'account_id': 'ACC005',
            'card_number': '************7890',
            'last_four': '7890',
            'card_type': 'debit',
            'status': 'active',
            'expiration_date': '12/26',
            'created_at': now,
            'updated_at': now
        }
    ]
    
    # Insert customers
    print("Seeding customers...")
    for customer in customers:
        customers_table.put_item(Item=customer)
        print(f"  ✓ Created customer {customer['customer_id']}: {customer['first_name']} {customer['last_name']}")
    
    # Insert accounts
    print("\nSeeding accounts...")
    for account in accounts:
        accounts_table.put_item(Item=account)
        print(f"  ✓ Created account {account['account_id']} ({account['account_type']}) for customer {account['customer_id']}")
    
    # Insert cards
    print("\nSeeding cards...")
    for card in cards:
        cards_table.put_item(Item=card)
        print(f"  ✓ Created card {card['card_id']} (ending in {card['last_four']}, status: {card['status']}) for account {card['account_id']}")
    
    print(f"\n✓ Seeded {len(customers)} customers, {len(accounts)} accounts, and {len(cards)} cards")


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Seed AWS DynamoDB tables with mock data')
    parser.add_argument('--stack-name', default='betterbank-mcp-lambda-dev',
                       help='CloudFormation stack name')
    parser.add_argument('--region', default='us-east-1',
                       help='AWS region')
    
    args = parser.parse_args()
    
    print(f"Getting table names from stack: {args.stack_name}")
    print(f"Region: {args.region}\n")
    
    outputs = get_stack_outputs(args.stack_name, args.region)
    
    print("Seeding AWS DynamoDB tables with mock data...\n")
    seed_data(outputs, args.region)
    print("\n✓ Done!")
