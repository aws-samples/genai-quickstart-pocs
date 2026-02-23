"""Data access layer for DynamoDB operations"""
import boto3
from typing import Optional, List, Dict, Any
from botocore.exceptions import ClientError
from .config import config


class DynamoDBClient:
    """Base DynamoDB client wrapper"""
    
    def __init__(self):
        dynamodb_kwargs = {'region_name': config.AWS_REGION}
        if config.DYNAMODB_ENDPOINT:
            dynamodb_kwargs['endpoint_url'] = config.DYNAMODB_ENDPOINT
        
        self.dynamodb = boto3.resource('dynamodb', **dynamodb_kwargs)
    
    def get_table(self, table_name: str):
        """Get a DynamoDB table resource"""
        return self.dynamodb.Table(table_name)


class CustomerRepository:
    """Repository for customer operations"""
    
    def __init__(self, dynamodb_client: Optional[DynamoDBClient] = None):
        self.client = dynamodb_client or DynamoDBClient()
        self.table = self.client.get_table(config.CUSTOMERS_TABLE)
    
    def get_customer(self, customer_id: str) -> Optional[Dict[str, Any]]:
        """Get a customer by ID"""
        try:
            response = self.table.get_item(Key={'customer_id': customer_id})
            return response.get('Item')
        except ClientError as e:
            raise Exception(f"Error getting customer: {e}")
    
    def create_customer(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new customer"""
        try:
            self.table.put_item(Item=customer_data)
            return customer_data
        except ClientError as e:
            raise Exception(f"Error creating customer: {e}")


class AccountRepository:
    """Repository for account operations"""
    
    def __init__(self, dynamodb_client: Optional[DynamoDBClient] = None):
        self.client = dynamodb_client or DynamoDBClient()
        self.table = self.client.get_table(config.ACCOUNTS_TABLE)
    
    def get_account(self, account_id: str) -> Optional[Dict[str, Any]]:
        """Get an account by ID"""
        try:
            response = self.table.get_item(Key={'account_id': account_id})
            return response.get('Item')
        except ClientError as e:
            raise Exception(f"Error getting account: {e}")
    
    def get_accounts_by_customer(self, customer_id: str) -> List[Dict[str, Any]]:
        """Get all accounts for a customer"""
        try:
            response = self.table.query(
                IndexName='customer_id-index',
                KeyConditionExpression='customer_id = :customer_id',
                ExpressionAttributeValues={':customer_id': customer_id}
            )
            return response.get('Items', [])
        except ClientError as e:
            raise Exception(f"Error getting accounts by customer: {e}")
    
    def create_account(self, account_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new account"""
        try:
            self.table.put_item(Item=account_data)
            return account_data
        except ClientError as e:
            raise Exception(f"Error creating account: {e}")


class CardRepository:
    """Repository for card operations"""
    
    def __init__(self, dynamodb_client: Optional[DynamoDBClient] = None):
        self.client = dynamodb_client or DynamoDBClient()
        self.table = self.client.get_table(config.CARDS_TABLE)
    
    def get_card(self, card_id: str) -> Optional[Dict[str, Any]]:
        """Get a card by ID"""
        try:
            response = self.table.get_item(Key={'card_id': card_id})
            return response.get('Item')
        except ClientError as e:
            raise Exception(f"Error getting card: {e}")
    
    def get_cards_by_account(self, account_id: str) -> List[Dict[str, Any]]:
        """Get all cards for an account"""
        try:
            response = self.table.query(
                IndexName='account_id-index',
                KeyConditionExpression='account_id = :account_id',
                ExpressionAttributeValues={':account_id': account_id}
            )
            return response.get('Items', [])
        except ClientError as e:
            raise Exception(f"Error getting cards by account: {e}")
    
    def update_card_status(self, card_id: str, status: str, updated_at: str) -> Dict[str, Any]:
        """Update card status (active, locked, etc.)"""
        try:
            response = self.table.update_item(
                Key={'card_id': card_id},
                UpdateExpression='SET #status = :status, updated_at = :updated_at',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': status,
                    ':updated_at': updated_at
                },
                ReturnValues='ALL_NEW'
            )
            return response.get('Attributes', {})
        except ClientError as e:
            raise Exception(f"Error updating card status: {e}")
    
    def create_card(self, card_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new card"""
        try:
            self.table.put_item(Item=card_data)
            return card_data
        except ClientError as e:
            raise Exception(f"Error creating card: {e}")


class CardRequestRepository:
    """Repository for card replacement request operations"""
    
    def __init__(self, dynamodb_client: Optional[DynamoDBClient] = None):
        self.client = dynamodb_client or DynamoDBClient()
        self.table = self.client.get_table(config.CARD_REQUESTS_TABLE)
    
    def create_request(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new card replacement request"""
        try:
            self.table.put_item(Item=request_data)
            return request_data
        except ClientError as e:
            raise Exception(f"Error creating card request: {e}")
    
    def get_request(self, request_id: str) -> Optional[Dict[str, Any]]:
        """Get a card request by ID"""
        try:
            response = self.table.get_item(Key={'request_id': request_id})
            return response.get('Item')
        except ClientError as e:
            raise Exception(f"Error getting card request: {e}")
    
    def get_requests_by_customer(self, customer_id: str) -> List[Dict[str, Any]]:
        """Get all card requests for a customer"""
        try:
            response = self.table.query(
                IndexName='customer_id-index',
                KeyConditionExpression='customer_id = :customer_id',
                ExpressionAttributeValues={':customer_id': customer_id}
            )
            return response.get('Items', [])
        except ClientError as e:
            raise Exception(f"Error getting card requests by customer: {e}")
