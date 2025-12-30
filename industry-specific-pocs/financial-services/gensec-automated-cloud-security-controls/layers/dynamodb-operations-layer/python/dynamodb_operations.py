"""
DynamoDB Operations Layer
Common functions for DynamoDB operations across Lambda functions
"""
import json
import boto3
import logging
from datetime import datetime
import uuid
from botocore.exceptions import ClientError
from service_name_resolver import create_resolver_from_s3

logger = logging.getLogger()
dynamodb = boto3.client('dynamodb')
s3_client = boto3.client('s3')

# Global cache for service resolver and mappings
_service_resolver = None
_service_mappings = None

def get_service_resolver_and_mappings(input_bucket):
    """
    Get or create the service name resolver and mappings
    
    Args:
        input_bucket: S3 bucket containing service-mappings.json
        
    Returns:
        tuple: (service_resolver, service_mappings)
    """
    global _service_resolver, _service_mappings
    if _service_resolver is None or _service_mappings is None:
        try:
            _service_resolver = create_resolver_from_s3(
                s3_client,
                input_bucket,
                'configuration/service-mappings.json'
            )
            
            # Also load the raw service mappings for parent service detection
            response = s3_client.get_object(
                Bucket=input_bucket,
                Key='configuration/service-mappings.json'
            )
            mappings_data = json.loads(response['Body'].read().decode('utf-8'))
            _service_mappings = mappings_data.get('services', mappings_data)
            
            logger.info("Service resolver and mappings initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize service resolver: {str(e)}")
            # Continue without resolver - will use service IDs as-is
    return _service_resolver, _service_mappings

def get_service_actions_from_dynamodb(service_id, service_actions_table):
    """Query service actions from DynamoDB"""
    try:
        logger.info(f"Querying actions for service_id: {service_id}")
        response = dynamodb.query(
            TableName=service_actions_table,
            KeyConditionExpression='service_id = :sid',
            ExpressionAttributeValues={
                ':sid': {'S': service_id}
            }
        )
        
        actions = []
        for item in response.get('Items', []):
            action = {
                'action_name': item.get('action_name', {}).get('S', ''),
                'service_action': item.get('service_action', {}).get('S', ''),
                'description': item.get('description', {}).get('S', ''),
                'accessLevel': item.get('accessLevel', {}).get('S', '')
            }
            actions.append(action)
            
        logger.info(f"Retrieved {len(actions)} actions for service {service_id}")
        return actions
        
    except Exception as e:
        logger.error(f"Error querying service actions: {str(e)}")
        return []

def get_service_parameters_from_dynamodb(service_id, service_parameters_table):
    """Query service parameters from DynamoDB"""
    try:
        logger.info(f"Querying parameters for service_id: {service_id}")
        response = dynamodb.query(
            TableName=service_parameters_table,
            KeyConditionExpression='service_id = :sid',
            ExpressionAttributeValues={
                ':sid': {'S': service_id}
            }
        )
        
        parameters = []
        for item in response.get('Items', []):
            param = {
                'parameter_name': item.get('parameter_name', {}).get('S', ''),
                'description': item.get('description', {}).get('S', ''),
                'type': item.get('type', {}).get('S', ''),
                'resource_type': item.get('resource_type', {}).get('S', '')
            }
            parameters.append(param)
        
        logger.info(f"Retrieved {len(parameters)} parameters for service {service_id}")
        return parameters
        
    except Exception as e:
        logger.error(f"Error querying service parameters: {str(e)}")
        return []

def get_configurations_from_dynamodb(request_id, service_id, control_library_table):
    """Fetch and group configurations from DynamoDB by service name"""
    try:
        logger.info(f"Fetching configurations for requestId: {request_id}, serviceId: {service_id}")
        
        response = dynamodb.scan(
            TableName=control_library_table,
            FilterExpression='requestId = :rid AND serviceId = :sid',
            ExpressionAttributeValues={
                ':rid': {'S': request_id},
                ':sid': {'S': service_id}
            }
        )
        
        items = response.get('Items', [])
        
        # Handle pagination if needed
        while 'LastEvaluatedKey' in response:
            response = dynamodb.scan(
                TableName=control_library_table,
                FilterExpression='requestId = :rid AND serviceId = :sid',
                ExpressionAttributeValues={
                    ':rid': {'S': request_id},
                    ':sid': {'S': service_id}
                },
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            items.extend(response.get('Items', []))

        if not items:
            logger.warning(f"No configurations found for requestId: {request_id}, serviceId: {service_id}")
            return {}

        # Group configurations by service name
        configurations_by_service = {}
        for item in items:
            parsed_item = parse_dynamodb_item(item)
            service_name = parsed_item.get('service_name')
            if service_name:
                if service_name not in configurations_by_service:
                    configurations_by_service[service_name] = []
                configurations_by_service[service_name].append(parsed_item)

        logger.info(f"Found {len(items)} configurations for {len(configurations_by_service)} services")
        return configurations_by_service

    except ClientError as e:
        logger.error(f"DynamoDB error: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error fetching configurations from DynamoDB: {str(e)}")
        raise

def parse_dynamodb_item(item):
    """Parse DynamoDB item and convert to python dict"""
    try:
        if not isinstance(item, dict):
            logger.warning(f"Expected dict, got {type(item)}")
            return item

        parsed_item = {}
        for key, value in item.items():
            try:
                if not isinstance(value, dict):
                    logger.warning(f"Unexpected value type for key {key}: {type(value)}")
                    parsed_item[key] = value
                    continue

                if 'S' in value:
                    parsed_item[key] = value['S']
                elif 'N' in value:
                    parsed_item[key] = float(value['N'])
                elif 'BOOL' in value:
                    parsed_item[key] = value['BOOL']
                elif 'SS' in value:
                    parsed_item[key] = value['SS']
                elif 'M' in value:
                    parsed_item[key] = parse_dynamodb_item(value['M'])
                elif 'L' in value:
                    parsed_item[key] = [parse_dynamodb_item(i) if isinstance(i, dict) else i for i in value['L']]
                elif all(k in ['name', 'description'] for k in value.keys()):
                    # Handle Map type that's not wrapped in 'M'
                    parsed_item[key] = parse_dynamodb_item(value)
                else:
                    logger.warning(f"Unhandled DynamoDB type for key {key}: {list(value.keys())}")
                    parsed_item[key] = value

            except Exception as e:
                logger.error(f"Error parsing key {key}: {str(e)}")
                parsed_item[key] = value

        # Parse JSON strings if needed
        if 'recommended_configuration' in parsed_item:
            try:
                if isinstance(parsed_item['recommended_configuration'], str):
                    parsed_item['recommended_configuration'] = json.loads(parsed_item['recommended_configuration'])
            except json.JSONDecodeError:
                logger.warning(f"Could not parse recommended_configuration JSON for item: {parsed_item.get('configuration_id')}")

        return parsed_item

    except Exception as e:
        logger.error(f"Error parsing DynamoDB item: {str(e)}")
        raise

def store_control_library(analyzed_requirements, service_request, control_library_table):
    """Store analyzed requirements in DynamoDB control library"""
    try:
        timestamp = datetime.utcnow().isoformat()
        batch_id = str(uuid.uuid4())
        
        # Normalize service_id to lowercase for consistency
        service_id = service_request.get('serviceId', 'UNKNOWN')
        service_id_normalized = service_id.lower() if service_id != 'UNKNOWN' else service_id
        
        for recommendation in analyzed_requirements:
            preventive_control = recommendation['preventive_control']
            if recommendation.get('configuration_priority') != 'VERY HIGH':
                preventive_control = {
                    "details": {
                        "note": "SCP not required - priority level below VERY HIGH"
                    }
                }

            item = {
                'configuration_id': {'S': recommendation['configuration_id']},
                'configuration_short_name': {'S': recommendation['configuration_short_name']},
                'configuration_rationale': {'S': json.dumps(recommendation['configuration_rationale'])},
                'configuration_priority': {'S': recommendation['configuration_priority']},
                'service_name': {'S': recommendation['service_name']},
                'security_domain': {'S': recommendation['security_domain']},
                'consolidated_requirements': {'S': recommendation['consolidated_requirements']},
                'threat_vector': {'S': json.dumps(recommendation['threat_vector'])},
                'recommended_configuration': {'S': json.dumps(recommendation['recommended_configuration'])},
                'configuration_AWS_URL': {'S': recommendation['configuration_AWS_URL']},
                'detective_control': {'S': json.dumps(recommendation['detective_control'])},
                'preventive_control': {'S': json.dumps(preventive_control)},
                'proactive_control': {'S': json.dumps(recommendation['proactive_control'])},
                'timestamp': {'S': timestamp},
                'batch_id': {'S': batch_id},
                'requestId': {'S': service_request.get('requestId', 'UNKNOWN')},
                'serviceId': {'S': service_id_normalized}  # Store normalized lowercase service_id
            }
            
            dynamodb.put_item(
                TableName=control_library_table,
                Item=item
            )
        
        logger.info(f"Stored {len(analyzed_requirements)} recommendations in DynamoDB")
        return batch_id
        
    except Exception as e:
        logger.error(f"Error storing in DynamoDB: {str(e)}")
        raise

def query_dynamodb_by_gsi(table_name, index_name, key_name, key_value):
    """Query DynamoDB table using Global Secondary Index"""
    try:
        logger.info(f"Querying {table_name} using GSI {index_name} for {key_name}={key_value}")
        
        response = dynamodb.query(
            TableName=table_name,
            IndexName=index_name,
            KeyConditionExpression=f'{key_name} = :key_value',
            ExpressionAttributeValues={
                ':key_value': {'S': key_value}
            }
        )
        
        items = []
        for item in response.get('Items', []):
            parsed_item = parse_dynamodb_item(item)
            items.append(parsed_item)
        
        logger.info(f"Retrieved {len(items)} items from {table_name}")
        return items
        
    except Exception as e:
        logger.error(f"Error querying {table_name} by GSI: {str(e)}")
        return []

def update_service_tracking(service_request, service_tracking_table):
    """Update service tracking information in DynamoDB"""
    try:
        timestamp = datetime.utcnow().isoformat()
        services = service_request.get('services', [])
        service_name = services[0].get('serviceName', 'UNKNOWN') if services else 'UNKNOWN'
        
        # Normalize service_id to lowercase for consistency
        service_id = service_request.get('serviceId', 'UNKNOWN')
        service_id_normalized = service_id.lower() if service_id != 'UNKNOWN' else service_id
        
        item = {
            'requestId': {'S': service_request.get('requestId', 'UNKNOWN')},
            'serviceId': {'S': service_id_normalized},  # Store normalized lowercase service_id
            'service_name': {'S': service_name},
            'timestamp': {'S': timestamp},
            'status': {'S': 'ANALYZED'},
            'services': {'S': json.dumps(services)}
        }
        
        dynamodb.put_item(
            TableName=service_tracking_table,
            Item=item
        )
        logger.info(f"Successfully updated service tracking for request ID: {service_request.get('requestId', 'UNKNOWN')}")
        
    except Exception as e:
        logger.error(f"Error updating service tracking: {str(e)}")
        raise

def _filter_actions_by_patterns(actions, filter_patterns=None, exclude_patterns=None):
    """
    Filter actions based on action_filter_patterns and action_exclude_patterns.
    
    Args:
        actions: List of action dictionaries
        filter_patterns: List of patterns to include (if provided, only matching actions are kept)
        exclude_patterns: List of patterns to exclude (matching actions are removed)
        
    Returns:
        list: Filtered actions
    """
    if not actions:
        return []
    
    filtered_actions = actions.copy()
    
    # Apply include patterns (if specified, only keep matching actions)
    if filter_patterns:
        included_actions = []
        for action in filtered_actions:
            action_name = action.get('action_name', '')
            if any(pattern in action_name for pattern in filter_patterns):
                included_actions.append(action)
        filtered_actions = included_actions
    
    # Apply exclude patterns (remove matching actions)
    if exclude_patterns:
        excluded_actions = []
        for action in filtered_actions:
            action_name = action.get('action_name', '')
            if not any(pattern in action_name for pattern in exclude_patterns):
                excluded_actions.append(action)
        filtered_actions = excluded_actions
    
    return filtered_actions

def get_service_actions_with_parent_support(service_id, service_actions_table, input_bucket):
    """
    Get service actions, handling parent services by aggregating sub-service data
    
    Args:
        service_id: The service ID (could be parent or regular service)
        service_actions_table: DynamoDB table name for service actions
        input_bucket: S3 bucket containing service-mappings.json
        
    Returns:
        list: validated_actions
    """
    service_resolver, service_mappings = get_service_resolver_and_mappings(input_bucket)
    
    # Normalize service_id
    service_id_normalized = service_id.lower()
    
    # Check if this is a parent service
    service_config = service_mappings.get(service_id_normalized, {}) if service_mappings else {}
    is_parent = service_config.get('is_parent_service', False)
    
    if is_parent:
        # Parent service - aggregate data from sub-services
        sub_services = service_config.get('sub_services', [])
        logger.info(f"Parent service '{service_id}' detected with sub-services: {sub_services}")
        
        all_actions = []
        
        for sub_service_id in sub_services:
            logger.info(f"Querying actions for sub-service: {sub_service_id}")
            
            # Get actions for this sub-service
            sub_actions = get_service_actions_from_dynamodb(sub_service_id.lower(), service_actions_table)
            
            logger.info(f"Sub-service {sub_service_id}: {len(sub_actions)} actions")
            
            # Add service context to actions
            for action in sub_actions:
                action['source_service'] = sub_service_id
                
            all_actions.extend(sub_actions)
        
        # If no actions found in sub-services, try fallback to parent service with filtering
        if not all_actions:
            logger.warning(f"No actions found in sub-services for '{service_id}', trying fallback to parent service")
            
            # Get the IAM service name for the parent service
            iam_service_name = service_config.get('iam_service_name', service_id_normalized)
            logger.info(f"Fallback: Querying parent service with iam_service_name: {iam_service_name}")
            
            # Query parent service actions
            parent_actions = get_service_actions_from_dynamodb(iam_service_name, service_actions_table)
            logger.info(f"Parent service {iam_service_name}: {len(parent_actions)} total actions")
            
            if parent_actions:
                # Filter actions for each sub-service based on action_filter_patterns
                for sub_service_id in sub_services:
                    sub_service_config = service_mappings.get(sub_service_id, {})
                    filter_patterns = sub_service_config.get('action_filter_patterns', [])
                    exclude_patterns = sub_service_config.get('action_exclude_patterns', [])
                    
                    if filter_patterns or exclude_patterns:
                        filtered_actions = _filter_actions_by_patterns(
                            parent_actions, filter_patterns, exclude_patterns
                        )
                        
                        # Add service context to filtered actions
                        for action in filtered_actions:
                            action['source_service'] = sub_service_id
                            
                        all_actions.extend(filtered_actions)
                        logger.info(f"Fallback filtered {len(filtered_actions)} actions for {sub_service_id}")
                    else:
                        logger.warning(f"No filter patterns defined for sub-service {sub_service_id}")
            else:
                logger.error(f"No actions found even in parent service {iam_service_name}")
        
        logger.info(f"Parent service '{service_id}' total: {len(all_actions)} actions")
        return all_actions
    
    else:
        # Regular service - query directly
        logger.info(f"Querying actions for service_id: {service_id_normalized}")
        validated_actions = get_service_actions_from_dynamodb(service_id_normalized, service_actions_table)
        
        logger.info(f"Retrieved {len(validated_actions)} actions for service {service_id_normalized}")
        
        return validated_actions

def get_service_data_with_parent_support(service_id, service_actions_table, service_parameters_table, input_bucket):
    """
    Get service actions and parameters, handling parent services by aggregating sub-service data
    
    Args:
        service_id: The service ID (could be parent or regular service)
        service_actions_table: DynamoDB table name for service actions
        service_parameters_table: DynamoDB table name for service parameters
        input_bucket: S3 bucket containing service-mappings.json
        
    Returns:
        tuple: (validated_actions, validated_parameters)
    """
    service_resolver, service_mappings = get_service_resolver_and_mappings(input_bucket)
    
    # Normalize service_id
    service_id_normalized = service_id.lower()
    
    # Check if this is a parent service
    service_config = service_mappings.get(service_id_normalized, {}) if service_mappings else {}
    is_parent = service_config.get('is_parent_service', False)
    
    if is_parent:
        # Parent service - aggregate data from sub-services
        sub_services = service_config.get('sub_services', [])
        logger.info(f"Parent service '{service_id}' detected with sub-services: {sub_services}")
        
        all_actions = []
        all_parameters = []
        
        for sub_service_id in sub_services:
            logger.info(f"Querying data for sub-service: {sub_service_id}")
            
            # Get actions and parameters for this sub-service
            sub_actions = get_service_actions_from_dynamodb(sub_service_id.lower(), service_actions_table)
            sub_parameters = get_service_parameters_from_dynamodb(sub_service_id.lower(), service_parameters_table)
            
            logger.info(f"Sub-service {sub_service_id}: {len(sub_actions)} actions, {len(sub_parameters)} parameters")
            
            # Add service context to actions and parameters
            for action in sub_actions:
                action['source_service'] = sub_service_id
            for param in sub_parameters:
                param['source_service'] = sub_service_id
                
            all_actions.extend(sub_actions)
            all_parameters.extend(sub_parameters)
        
        logger.info(f"Parent service '{service_id}' total: {len(all_actions)} actions, {len(all_parameters)} parameters")
        
        # If no actions found in sub-services, try fallback to parent service with filtering
        if not all_actions:
            logger.warning(f"No actions found in sub-services for '{service_id}', trying fallback to parent service")
            
            # Get the IAM service name for the parent service
            iam_service_name = service_config.get('iam_service_name', service_id_normalized)
            logger.info(f"Fallback: Querying parent service with iam_service_name: {iam_service_name}")
            
            # Query parent service actions
            parent_actions = get_service_actions_from_dynamodb(iam_service_name, service_actions_table)
            logger.info(f"Parent service {iam_service_name}: {len(parent_actions)} total actions")
            
            if parent_actions:
                # Filter actions for each sub-service based on action_filter_patterns
                for sub_service_id in sub_services:
                    sub_service_config = service_mappings.get(sub_service_id, {})
                    filter_patterns = sub_service_config.get('action_filter_patterns', [])
                    exclude_patterns = sub_service_config.get('action_exclude_patterns', [])
                    
                    if filter_patterns or exclude_patterns:
                        filtered_actions = _filter_actions_by_patterns(
                            parent_actions, filter_patterns, exclude_patterns
                        )
                        
                        # Add service context to filtered actions
                        for action in filtered_actions:
                            action['source_service'] = sub_service_id
                            
                        all_actions.extend(filtered_actions)
                        logger.info(f"Fallback filtered {len(filtered_actions)} actions for {sub_service_id}")
                    else:
                        logger.warning(f"No filter patterns defined for sub-service {sub_service_id}")
            else:
                logger.error(f"No actions found even in parent service {iam_service_name}")
        
        logger.info(f"Parent service '{service_id}' final total: {len(all_actions)} actions, {len(all_parameters)} parameters")
        return all_actions, all_parameters
    
    else:
        # Regular service - query directly
        logger.info(f"Querying data for service_id: {service_id_normalized}")
        validated_actions = get_service_actions_from_dynamodb(service_id_normalized, service_actions_table)
        validated_parameters = get_service_parameters_from_dynamodb(service_id_normalized, service_parameters_table)
        
        logger.info(f"Retrieved {len(validated_actions)} actions, {len(validated_parameters)} parameters for service {service_id_normalized}")
        
        return validated_actions, validated_parameters