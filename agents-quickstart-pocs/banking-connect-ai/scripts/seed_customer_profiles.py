#!/usr/bin/env python3
"""
Script to create Amazon Connect Customer Profiles.

These profiles are used by Connect to identify callers by phone number
and pass customer data to the AI agent.

Usage:
    python scripts/seed_customer_profiles.py --domain-name <your-domain>

Prerequisites:
    - Amazon Connect Customer Profiles domain must be created
    - AWS credentials with customer-profiles:PutProfile permission
"""

import boto3
import argparse
from datetime import datetime


def create_customer_profiles(domain_name: str, region: str = 'us-east-1'):
    """Create customer profiles in Amazon Connect Customer Profiles."""
    
    client = boto3.client('customer-profiles', region_name=region)
    
    # Test customers - these should match your DynamoDB data
    # The AccountNumber field is used as customer_id in the AI agent
    profiles = [
        {
            'FirstName': 'John',
            'LastName': 'Doe',
            'PhoneNumber': '+15550101',
            'EmailAddress': 'john.doe@example.com',
            'AccountNumber': 'CUST001'  # This becomes customer_id
        },
        {
            'FirstName': 'Jane',
            'LastName': 'Smith',
            'PhoneNumber': '+15550102',  # Update this to your test phone
            'EmailAddress': 'jane.smith@example.com',
            'AccountNumber': 'CUST002'  # This becomes customer_id
        },
        {
            'FirstName': 'Bob',
            'LastName': 'Johnson',
            'PhoneNumber': '+15550103',
            'EmailAddress': 'bob.johnson@example.com',
            'AccountNumber': 'CUST003'  # This becomes customer_id
        }
    ]
    
    print(f"Creating customer profiles in domain: {domain_name}")
    print(f"Region: {region}\n")
    
    created = 0
    for profile in profiles:
        try:
            response = client.put_profile(
                DomainName=domain_name,
                FirstName=profile['FirstName'],
                LastName=profile['LastName'],
                PhoneNumber=profile['PhoneNumber'],
                EmailAddress=profile['EmailAddress'],
                AccountNumber=profile['AccountNumber']
            )
            
            profile_id = response.get('ProfileId', 'unknown')
            print(f"✓ Created profile: {profile['FirstName']} {profile['LastName']}")
            print(f"  Phone: {profile['PhoneNumber']}")
            print(f"  AccountNumber (customer_id): {profile['AccountNumber']}")
            print(f"  ProfileId: {profile_id}\n")
            created += 1
            
        except client.exceptions.BadRequestException as e:
            print(f"✗ Failed to create {profile['FirstName']} {profile['LastName']}: {e}")
        except Exception as e:
            print(f"✗ Error: {e}")
    
    print(f"\n{'='*50}")
    print(f"Created {created}/{len(profiles)} customer profiles")
    print(f"{'='*50}")
    
    if created > 0:
        print("\nNext steps:")
        print("1. Update the phone numbers to match your test phones")
        print("2. The AccountNumber field will be passed as customer_id to the AI agent")
        print("3. Make sure your Connect flow uses 'Get Customer Profile' block")


def list_domains(region: str = 'us-east-1'):
    """List available Customer Profiles domains."""
    client = boto3.client('customer-profiles', region_name=region)
    
    try:
        response = client.list_domains()
        domains = response.get('Items', [])
        
        if not domains:
            print("No Customer Profiles domains found.")
            print("Create one in Amazon Connect console first.")
            return
        
        print("Available Customer Profiles domains:")
        for domain in domains:
            print(f"  - {domain['DomainName']}")
        
    except Exception as e:
        print(f"Error listing domains: {e}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Create Amazon Connect Customer Profiles'
    )
    parser.add_argument(
        '--domain-name', '-d',
        help='Customer Profiles domain name (e.g., amazon-connect-yourinstance)'
    )
    parser.add_argument(
        '--region', '-r',
        default='us-east-1',
        help='AWS region (default: us-east-1)'
    )
    parser.add_argument(
        '--list-domains',
        action='store_true',
        help='List available Customer Profiles domains'
    )
    
    args = parser.parse_args()
    
    if args.list_domains:
        list_domains(args.region)
    elif args.domain_name:
        create_customer_profiles(args.domain_name, args.region)
    else:
        print("Usage:")
        print("  List domains:    python seed_customer_profiles.py --list-domains")
        print("  Create profiles: python seed_customer_profiles.py --domain-name <domain>")
        print("\nExample:")
        print("  python seed_customer_profiles.py -d amazon-connect-betterbank")
