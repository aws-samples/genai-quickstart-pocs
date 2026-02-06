"""Business logic for card operations"""
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import uuid
from .repositories import CardRepository, AccountRepository, CardRequestRepository
from .auth import AuthService
from .exceptions import NotFoundError, ValidationError


class CardOperationsService:
    """Service for card management operations"""
    
    def __init__(
        self,
        card_repo: Optional[CardRepository] = None,
        account_repo: Optional[AccountRepository] = None,
        card_request_repo: Optional[CardRequestRepository] = None,
        auth_service: Optional[AuthService] = None
    ):
        self.card_repo = card_repo or CardRepository()
        self.account_repo = account_repo or AccountRepository()
        self.card_request_repo = card_request_repo or CardRequestRepository()
        self.auth_service = auth_service or AuthService()
    
    def lock_card(self, customer_id: str, card_id: str) -> Dict[str, Any]:
        """
        Lock a debit card to prevent transactions.
        
        Args:
            customer_id: The authenticated customer ID
            card_id: The card ID to lock
            
        Returns:
            Response with success status and card details
            
        Raises:
            NotFoundError: If card doesn't exist
            AuthorizationError: If card doesn't belong to customer
        """
        # Authenticate customer
        self.auth_service.authenticate_customer(customer_id)
        
        # Get the card
        card = self.card_repo.get_card(card_id)
        if not card:
            raise NotFoundError("The requested resource was not found.")
        
        # Verify ownership
        self.auth_service.verify_card_ownership(customer_id, card_id)
        
        # Update card status to locked (idempotent - already locked is OK)
        updated_at = datetime.utcnow().isoformat()
        updated_card = self.card_repo.update_card_status(card_id, 'locked', updated_at)
        
        return {
            'success': True,
            'message': 'Card successfully locked',
            'card': {
                'card_id': updated_card['card_id'],
                'status': updated_card['status'],
                'last_four': updated_card['last_four'],
                'account_id': updated_card['account_id']
            }
        }
    
    def unlock_card(self, customer_id: str, card_id: str) -> Dict[str, Any]:
        """
        Unlock a debit card to restore transaction capability.
        
        Args:
            customer_id: The authenticated customer ID
            card_id: The card ID to unlock
            
        Returns:
            Response with success status and card details
            
        Raises:
            NotFoundError: If card doesn't exist
            AuthorizationError: If card doesn't belong to customer
        """
        # Authenticate customer
        self.auth_service.authenticate_customer(customer_id)
        
        # Get the card
        card = self.card_repo.get_card(card_id)
        if not card:
            raise NotFoundError("The requested resource was not found.")
        
        # Verify ownership
        self.auth_service.verify_card_ownership(customer_id, card_id)
        
        # Update card status to active (idempotent - already active is OK)
        updated_at = datetime.utcnow().isoformat()
        updated_card = self.card_repo.update_card_status(card_id, 'active', updated_at)
        
        return {
            'success': True,
            'message': 'Card successfully unlocked',
            'card': {
                'card_id': updated_card['card_id'],
                'status': updated_card['status'],
                'last_four': updated_card['last_four'],
                'account_id': updated_card['account_id']
            }
        }
    
    def request_new_card(
        self,
        customer_id: str,
        account_id: str,
        reason: Optional[str] = None,
        delivery_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Request a replacement debit card.
        
        Args:
            customer_id: The authenticated customer ID
            account_id: The account ID for the new card
            reason: Optional reason for replacement
            delivery_address: Optional delivery address
            
        Returns:
            Response with success status and request details
            
        Raises:
            NotFoundError: If account doesn't exist
            AuthorizationError: If account doesn't belong to customer
        """
        # Authenticate customer
        self.auth_service.authenticate_customer(customer_id)
        
        # Get the account
        account = self.account_repo.get_account(account_id)
        if not account:
            raise NotFoundError("The requested resource was not found.")
        
        # Verify ownership
        self.auth_service.verify_account_ownership(customer_id, account_id)
        
        # Generate request ID and estimated delivery date
        request_id = f"REQ{uuid.uuid4().hex[:8].upper()}"
        estimated_delivery = (datetime.utcnow() + timedelta(days=7)).isoformat()
        created_at = datetime.utcnow().isoformat()
        
        # Create card replacement request
        request_data = {
            'request_id': request_id,
            'customer_id': customer_id,
            'account_id': account_id,
            'reason': reason or '',
            'delivery_address': delivery_address or '',
            'estimated_delivery': estimated_delivery,
            'status': 'pending',
            'created_at': created_at,
            'updated_at': created_at
        }
        
        self.card_request_repo.create_request(request_data)
        
        return {
            'success': True,
            'message': 'Card replacement request successfully created',
            'request': {
                'request_id': request_id,
                'account_id': account_id,
                'estimated_delivery': estimated_delivery,
                'status': 'pending'
            }
        }
