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

logger = logging.getLogger()
dynamodb = boto3.client('dynamodb')

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
                'serviceId': {'S': service_request.get('serviceId', 'UNKNOWN')}
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
        
        item = {
            'requestId': {'S': service_request.get('requestId', 'UNKNOWN')},
            'serviceId': {'S': service_request.get('serviceId', 'UNKNOWN')},
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
