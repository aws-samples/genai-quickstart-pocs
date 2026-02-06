"""Authentication and authorization services"""
from typing import Optional, Dict, Any
from .repositories import CustomerRepository, AccountRepository, CardRepository
from .exceptions import AuthenticationError, AuthorizationError


class AuthService:
    """Service for authentication and authorization"""
    
    def __init__(
        self,
        customer_repo: Optional[CustomerRepository] = None,
        account_repo: Optional[AccountRepository] = None,
        card_repo: Optional[CardRepository] = None
    ):
        self.customer_repo = customer_repo or CustomerRepository()
        self.account_repo = account_repo or AccountRepository()
        self.card_repo = card_repo or CardRepository()
    
    def authenticate_customer(self, customer_id: str) -> Dict[str, Any]:
        """
        Authenticate a customer by validating their ID exists in the database.
        
        Args:
            customer_id: The customer ID to authenticate
            
        Returns:
            Customer data if authentication succeeds
            
        Raises:
            AuthenticationError: If customer ID is invalid or not found
        """
        if not customer_id:
            raise AuthenticationError("Customer ID is required")
        
        customer = self.customer_repo.get_customer(customer_id)
        
        if not customer:
            raise AuthenticationError("Authentication failed. Please verify your credentials.")
        
        return customer
    
    def verify_card_ownership(self, customer_id: str, card_id: str) -> bool:
        """
        Verify that a card belongs to the authenticated customer.
        
        Args:
            customer_id: The authenticated customer ID
            card_id: The card ID to verify
            
        Returns:
            True if the card belongs to the customer
            
        Raises:
            AuthorizationError: If the card doesn't belong to the customer
        """
        # Get the card
        card = self.card_repo.get_card(card_id)
        
        if not card:
            return False
        
        # Get the account associated with the card
        account = self.account_repo.get_account(card['account_id'])
        
        if not account:
            return False
        
        # Check if the account belongs to the customer
        if account['customer_id'] != customer_id:
            raise AuthorizationError(
                "You are not authorized to perform this operation on the specified resource."
            )
        
        return True
    
    def verify_account_ownership(self, customer_id: str, account_id: str) -> bool:
        """
        Verify that an account belongs to the authenticated customer.
        
        Args:
            customer_id: The authenticated customer ID
            account_id: The account ID to verify
            
        Returns:
            True if the account belongs to the customer
            
        Raises:
            AuthorizationError: If the account doesn't belong to the customer
        """
        # Get the account
        account = self.account_repo.get_account(account_id)
        
        if not account:
            return False
        
        # Check if the account belongs to the customer
        if account['customer_id'] != customer_id:
            raise AuthorizationError(
                "You are not authorized to perform this operation on the specified resource."
            )
        
        return True
