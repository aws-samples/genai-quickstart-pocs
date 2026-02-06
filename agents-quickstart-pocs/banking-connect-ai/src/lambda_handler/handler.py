"""AWS Lambda handler for card operations"""
import json
import logging
from typing import Dict, Any
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from shared.card_operations import CardOperationsService
from shared.exceptions import (
    AuthenticationError,
    AuthorizationError,
    ValidationError,
    NotFoundError,
    ServiceError,
    AppException
)

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)


def create_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """Create a Lambda proxy integration response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        'body': json.dumps(body)
    }


def create_error_response(error: Exception) -> Dict[str, Any]:
    """Create an error response based on exception type"""
    
    if isinstance(error, AuthenticationError):
        return create_response(401, {
            'success': False,
            'error': {
                'code': error.code,
                'message': error.message
            }
        })
    
    elif isinstance(error, AuthorizationError):
        return create_response(403, {
            'success': False,
            'error': {
                'code': error.code,
                'message': error.message
            }
        })
    
    elif isinstance(error, ValidationError):
        return create_response(400, {
            'success': False,
            'error': {
                'code': error.code,
                'message': error.message,
                'details': error.details
            }
        })
    
    elif isinstance(error, NotFoundError):
        return create_response(404, {
            'success': False,
            'error': {
                'code': error.code,
                'message': error.message
            }
        })
    
    elif isinstance(error, ServiceError):
        return create_response(503, {
            'success': False,
            'error': {
                'code': error.code,
                'message': error.message
            }
        })
    
    else:
        # Generic error
        logger.error(f"Unexpected error: {str(error)}", exc_info=True)
        return create_response(500, {
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': 'An unexpected error occurred'
            }
        })


def validate_request_body(body: Dict[str, Any], required_fields: list) -> None:
    """Validate that required fields are present in request body"""
    missing_fields = [field for field in required_fields if field not in body or not body[field]]
    
    if missing_fields:
        raise ValidationError(
            f"Invalid request parameters: missing required fields",
            details={'missing_fields': missing_fields}
        )


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for card operations.
    Routes requests to appropriate operation based on path.
    """
    
    try:
        # Log the incoming request
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Parse request body
        try:
            body = json.loads(event.get('body', '{}'))
        except json.JSONDecodeError:
            raise ValidationError("Invalid JSON in request body")
        
        # Get the operation from the path
        path = event.get('path', '')
        http_method = event.get('httpMethod', '')
        
        # Only handle POST requests
        if http_method != 'POST':
            raise ValidationError(f"Method {http_method} not allowed")
        
        # Initialize card operations service
        card_service = CardOperationsService()
        
        # Route to appropriate operation
        if path.endswith('/cards/lock'):
            return handle_lock_card(body, card_service)
        
        elif path.endswith('/cards/unlock'):
            return handle_unlock_card(body, card_service)
        
        elif path.endswith('/cards/request-new'):
            return handle_request_new_card(body, card_service)
        
        else:
            raise ValidationError(f"Unknown operation: {path}")
    
    except AppException as e:
        return create_error_response(e)
    
    except Exception as e:
        return create_error_response(e)


def handle_lock_card(body: Dict[str, Any], card_service: CardOperationsService) -> Dict[str, Any]:
    """Handle lock card operation"""
    
    # Validate required fields
    validate_request_body(body, ['customer_id', 'card_id'])
    
    # Extract parameters
    customer_id = body['customer_id']
    card_id = body['card_id']
    
    # Log operation
    logger.info(f"Locking card {card_id} for customer {customer_id}")
    
    # Execute operation
    result = card_service.lock_card(customer_id, card_id)
    
    # Log success
    logger.info(f"Successfully locked card {card_id}")
    
    return create_response(200, result)


def handle_unlock_card(body: Dict[str, Any], card_service: CardOperationsService) -> Dict[str, Any]:
    """Handle unlock card operation"""
    
    # Validate required fields
    validate_request_body(body, ['customer_id', 'card_id'])
    
    # Extract parameters
    customer_id = body['customer_id']
    card_id = body['card_id']
    
    # Log operation
    logger.info(f"Unlocking card {card_id} for customer {customer_id}")
    
    # Execute operation
    result = card_service.unlock_card(customer_id, card_id)
    
    # Log success
    logger.info(f"Successfully unlocked card {card_id}")
    
    return create_response(200, result)


def handle_request_new_card(body: Dict[str, Any], card_service: CardOperationsService) -> Dict[str, Any]:
    """Handle request new card operation"""
    
    # Validate required fields
    validate_request_body(body, ['customer_id', 'account_id'])
    
    # Extract parameters
    customer_id = body['customer_id']
    account_id = body['account_id']
    reason = body.get('reason')
    delivery_address = body.get('delivery_address')
    
    # Log operation
    logger.info(f"Requesting new card for account {account_id}, customer {customer_id}")
    
    # Execute operation
    result = card_service.request_new_card(
        customer_id=customer_id,
        account_id=account_id,
        reason=reason,
        delivery_address=delivery_address
    )
    
    # Log success
    logger.info(f"Successfully created card request {result['request']['request_id']}")
    
    return create_response(200, result)
