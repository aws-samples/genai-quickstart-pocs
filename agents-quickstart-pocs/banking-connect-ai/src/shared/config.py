"""Configuration management for the application"""
import os


class Config:
    """Application configuration"""
    
    # AWS Configuration
    AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
    AWS_ACCOUNT_ID = os.getenv('AWS_ACCOUNT_ID', '')
    
    # DynamoDB Configuration
    DYNAMODB_ENDPOINT = os.getenv('DYNAMODB_ENDPOINT', None)  # None uses AWS default
    CUSTOMERS_TABLE = os.getenv('CUSTOMERS_TABLE', 'betterbank-customers')
    ACCOUNTS_TABLE = os.getenv('ACCOUNTS_TABLE', 'betterbank-accounts')
    CARDS_TABLE = os.getenv('CARDS_TABLE', 'betterbank-cards')
    CARD_REQUESTS_TABLE = os.getenv('CARD_REQUESTS_TABLE', 'betterbank-card-requests')
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')


# Singleton instance
config = Config()
