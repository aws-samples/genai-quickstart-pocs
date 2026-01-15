"""
Service Name Resolver
Resolves human-readable service names to AWS service IDs
"""

import json
import logging
from typing import Optional, Dict, List, Tuple
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)


class ServiceNameResolver:
    """Resolves human-readable service names to AWS service IDs"""
    
    def __init__(self, service_mappings: Dict):
        """
        Initialize the resolver with service mappings
        
        Args:
            service_mappings: Dictionary of service mappings from service-mappings.json
        """
        self.service_mappings = service_mappings
        self._build_alias_index()
    
    def _build_alias_index(self):
        """Build an index of aliases to service IDs for fast lookup"""
        self.alias_to_service_id = {}
        
        for service_id, config in self.service_mappings.items():
            # Add the service ID itself (lowercase)
            self.alias_to_service_id[service_id.lower()] = service_id
            
            # Add all aliases (deduplicate first)
            aliases = config.get('aliases', [])
            unique_aliases = list(set(aliases))  # Remove duplicates
            
            for alias in unique_aliases:
                alias_lower = alias.lower()
                if alias_lower not in self.alias_to_service_id:
                    self.alias_to_service_id[alias_lower] = service_id
                else:
                    # Only warn if it's a real conflict (different services)
                    existing_service = self.alias_to_service_id[alias_lower]
                    if existing_service != service_id:
                        logger.warning(
                            f"Alias conflict: '{alias}' maps to both "
                            f"'{existing_service}' and '{service_id}'"
                        )
        
        logger.info(f"Built alias index with {len(self.alias_to_service_id)} entries")
    
    def resolve(self, service_name: str) -> Optional[str]:
        """
        Resolve a service name to a service ID
        
        Args:
            service_name: Human-readable service name or service ID
            
        Returns:
            Service ID if found, None otherwise
        """
        if not service_name:
            return None
        
        # Normalize input
        normalized = service_name.strip().lower()
        
        # Direct lookup
        if normalized in self.alias_to_service_id:
            service_id = self.alias_to_service_id[normalized]
            logger.info(f"Resolved '{service_name}' to '{service_id}'")
            return service_id
        
        # Try fuzzy matching
        fuzzy_match = self._fuzzy_match(normalized)
        if fuzzy_match:
            service_id, confidence = fuzzy_match
            if confidence > 0.8:  # High confidence threshold
                logger.info(
                    f"Fuzzy matched '{service_name}' to '{service_id}' "
                    f"(confidence: {confidence:.2f})"
                )
                return service_id
            else:
                logger.warning(
                    f"Low confidence fuzzy match for '{service_name}': "
                    f"'{service_id}' (confidence: {confidence:.2f})"
                )
        
        logger.warning(f"Could not resolve service name: '{service_name}'")
        return None
    
    def _fuzzy_match(self, service_name: str) -> Optional[Tuple[str, float]]:
        """
        Perform fuzzy matching to find the closest service
        
        Args:
            service_name: Normalized service name
            
        Returns:
            Tuple of (service_id, confidence) or None
        """
        best_match = None
        best_score = 0.0
        
        for alias, service_id in self.alias_to_service_id.items():
            # Calculate similarity
            score = SequenceMatcher(None, service_name, alias).ratio()
            
            if score > best_score:
                best_score = score
                best_match = service_id
        
        if best_match and best_score > 0.6:  # Minimum threshold
            return (best_match, best_score)
        
        return None
    
    def get_suggestions(self, service_name: str, limit: int = 5) -> List[Tuple[str, str, float]]:
        """
        Get suggestions for a service name
        
        Args:
            service_name: Service name to find suggestions for
            limit: Maximum number of suggestions
            
        Returns:
            List of tuples (service_id, alias, confidence)
        """
        normalized = service_name.strip().lower()
        suggestions = []
        
        for alias, service_id in self.alias_to_service_id.items():
            score = SequenceMatcher(None, normalized, alias).ratio()
            if score > 0.4:  # Lower threshold for suggestions
                suggestions.append((service_id, alias, score))
        
        # Sort by confidence and return top matches
        suggestions.sort(key=lambda x: x[2], reverse=True)
        return suggestions[:limit]
    
    def validate_service_id(self, service_id: str) -> bool:
        """
        Validate if a service ID exists in the mappings
        
        Args:
            service_id: Service ID to validate
            
        Returns:
            True if valid, False otherwise
        """
        return service_id.lower() in self.service_mappings
    
    def get_service_info(self, service_id: str) -> Optional[Dict]:
        """
        Get full service information
        
        Args:
            service_id: Service ID
            
        Returns:
            Service configuration dictionary or None
        """
        return self.service_mappings.get(service_id.lower())
    
    def format_error_message(self, service_name: str) -> str:
        """
        Format a helpful error message with suggestions
        
        Args:
            service_name: Invalid service name
            
        Returns:
            Formatted error message with suggestions
        """
        suggestions = self.get_suggestions(service_name, limit=3)
        
        message = f"Service '{service_name}' not found."
        
        if suggestions:
            message += "\n\nDid you mean one of these?"
            for service_id, alias, confidence in suggestions:
                message += f"\n  - {alias} (service ID: {service_id})"
        else:
            message += "\n\nPlease check the service name and try again."
        
        return message


def create_resolver_from_s3(s3_client, bucket: str, key: str = 'configuration/service-mappings.json') -> ServiceNameResolver:
    """
    Create a resolver by loading service mappings from S3
    
    Args:
        s3_client: Boto3 S3 client
        bucket: S3 bucket name
        key: S3 object key
        
    Returns:
        ServiceNameResolver instance
    """
    try:
        response = s3_client.get_object(Bucket=bucket, Key=key)
        mappings_data = json.loads(response['Body'].read().decode('utf-8'))
        
        # Extract services section
        services = mappings_data.get('services', mappings_data)
        
        return ServiceNameResolver(services)
    except Exception as e:
        logger.error(f"Error loading service mappings from S3: {str(e)}")
        raise


def create_resolver_from_file(file_path: str) -> ServiceNameResolver:
    """
    Create a resolver by loading service mappings from a file
    
    Args:
        file_path: Path to service-mappings.json file
        
    Returns:
        ServiceNameResolver instance
    """
    try:
        with open(file_path, 'r') as f:
            mappings_data = json.load(f)
        
        # Extract services section
        services = mappings_data.get('services', mappings_data)
        
        return ServiceNameResolver(services)
    except Exception as e:
        logger.error(f"Error loading service mappings from file: {str(e)}")
        raise
