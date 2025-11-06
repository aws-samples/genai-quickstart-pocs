"""
Validation Layer
Common validation functions across Lambda functions
"""
import json
import logging
import re

logger = logging.getLogger()

def build_action_validation_set(validated_actions):
    """Build comprehensive action validation set with both prefixed and non-prefixed actions"""
    valid_action_names = set()
    for action in validated_actions:
        if action.get('service_action'):
            valid_action_names.add(action['service_action'])
        if action.get('action_name'):
            valid_action_names.add(action['action_name'])
    return valid_action_names

def validate_configuration(config):
    """Validate the configuration structure from DynamoDB"""
    try:
        required_fields = {
            'configuration_id': 'S',
            'service_name': 'S',
            'security_domain': 'S'
        }
        
        for field, attr_type in required_fields.items():
            if not config.get(field, {}).get(attr_type):
                logger.warning(f"Missing required field or invalid type: {field}")
                return False
        return True
    except Exception as e:
        logger.error(f"Error validating configuration: {str(e)}")
        return False

def validate_input(input_data):
    """Validate the input parameters"""
    try:
        required_fields = ['requestId', 'serviceId']
        return all(input_data.get(field) for field in required_fields)
    except Exception as e:
        logger.error(f"Error validating input: {str(e)}")
        return False

def validate_recommendations(recommendations, valid_parameter_names, valid_action_names):
    """Validate recommendations against known valid actions and parameters"""
    validated_recommendations = []
    
    for rec in recommendations:
        settings = rec.get('recommended_configuration', {}).get('settings', {})
        invalid_params = [param for param in settings.keys() if param not in valid_parameter_names]
        
        if invalid_params:
            logger.warning(f"Skipping recommendation with invalid parameters: {invalid_params}")
            continue
            
        # Check SCP actions if priority is VERY HIGH
        if rec.get('configuration_priority') == 'VERY HIGH':
            scp = rec.get('preventive_control', {}).get('details', {}).get('scp_policy', {})
            actions = scp.get('Action', [])
            if isinstance(actions, str):
                actions = [actions]
                
            invalid_actions = [action for action in actions if action not in valid_action_names]
            if invalid_actions:
                logger.warning(f"Skipping recommendation with invalid SCP actions: {invalid_actions}")
                continue
        
        validated_recommendations.append(rec)
        logger.info(f"Validated recommendation: {rec['configuration_id']}")
    
    return validated_recommendations

def validate_generated_controls(controls, valid_parameter_names, valid_action_names, original_config):
    """Validate generated controls against valid parameters and actions"""
    try:
        if not isinstance(controls, dict):
            logger.error("Invalid controls format")
            return None

        for control_type, control in controls.items():
            if control_type == 'detective_controls':
                if not validate_control_parameters(control.get('code', ''), 
                                                valid_parameter_names, 
                                                original_config):
                    logger.warning(f"Invalid parameters in detective control")
                    return None
                    
            elif control_type == 'preventive_controls':
                if not validate_control_actions(control.get('code', ''), 
                                             valid_action_names):
                    logger.warning(f"Invalid actions in preventive control")
                    return None
                    
            elif control_type == 'proactive_controls':
                if not validate_control_parameters(control.get('code', ''), 
                                                valid_parameter_names, 
                                                original_config):
                    logger.warning(f"Invalid parameters in proactive control")
                    return None

        return controls

    except Exception as e:
        logger.error(f"Error validating controls: {str(e)}")
        return None

def validate_control_structure(control, control_type):
    """Validate the structure of a specific control type"""
    required_fields = {
        'configuration_id': str,
        'filename': str,
        'code': str,
        'control_id': str,
        'description': str,
        'implementation_guide': str
    }

    for field, field_type in required_fields.items():
        if field not in control:
            logger.error(f"Missing required field '{field}' in {control_type}")
            return False
        if not isinstance(control[field], field_type):
            logger.error(f"Invalid type for field '{field}' in {control_type}")
            return False

    return True

def validate_control_parameters(control_code, valid_parameters, config):
    """Validate control code only uses valid parameters"""
    try:
        config_params = config.get('recommended_configuration', {}).get('settings', {}).keys()
        
        for param in valid_parameters:
            if param in control_code and param not in config_params:
                logger.warning(f"Control uses invalid parameter: {param}")
                return False
        return True
    except Exception as e:
        logger.error(f"Error validating control parameters: {str(e)}")
        return False

def validate_control_actions(control_code, valid_actions):
    """Validate control code only uses valid actions"""
    try:
        if isinstance(control_code, str):
            try:
                control_json = json.loads(control_code)
                actions = control_json.get('Statement', [{}])[0].get('Action', [])
                if isinstance(actions, str):
                    actions = [actions]
                
                for action in actions:
                    if action not in valid_actions:
                        logger.warning(f"Control uses invalid action: {action}")
                        return False
                return True
            except json.JSONDecodeError:
                logger.error("Invalid JSON in control code")
                return False
        return False
    except Exception as e:
        logger.error(f"Error validating control actions: {str(e)}")
        return False

def validate_iac_parameters(template_content, valid_parameters, service_name):
    """Validate IaC template parameters against AWS service documentation"""
    try:
        logger.info(f"Validating IaC parameters for {service_name}")
        
        valid_param_set = {param['parameter_name'] for param in valid_parameters}
        
        if isinstance(template_content, str):
            if '.tf' in template_content:
                params = re.findall(r'variable\s+"([^"]+)"', template_content)
                normalized_valid_params = {p.replace('_', '').lower() for p in valid_param_set}
                invalid_params = [p for p in params if p.replace('_', '').lower() not in normalized_valid_params]
            else:
                try:
                    import yaml
                    template_dict = yaml.safe_load(template_content)
                    params = list(template_dict.get('Parameters', {}).keys())
                    invalid_params = [p for p in params if p not in valid_param_set]
                except:
                    params = []
                    invalid_params = []
        else:
            params = []
            invalid_params = []
            
        if invalid_params:
            logger.warning(f"Invalid parameters found in template: {invalid_params}")
            return False, invalid_params
            
        return True, []
        
    except Exception as e:
        logger.error(f"Error validating IaC parameters: {str(e)}")
        return False, []

def validate_iam_model_actions(model, valid_action_names, valid_action_details):
    """Validate IAM model actions against documented AWS actions"""
    try:
        if not isinstance(model, dict) or 'actions' not in model:
            logger.error("Invalid IAM model structure")
            return None
            
        validated_actions = []
        
        for action in model['actions']:
            action_name = action.get('action_name')
            
            if action_name not in valid_action_details:
                logger.warning(f"Skipping invalid action: {action_name}")
                continue
                
            valid_details = valid_action_details[action_name]
            action['description'] = valid_details['description']
            action['accessLevel'] = valid_details['accessLevel']
            
            validated_actions.append(action)
            
        if not validated_actions:
            logger.error("No valid actions found after validation")
            return None
            
        validated_model = {
            "serviceName": model['serviceName'],
            "servicePrefix": model['servicePrefix'],
            "actions": validated_actions
        }
        
        logger.info(f"Successfully validated {len(validated_actions)} actions")
        return validated_model
        
    except Exception as e:
        logger.error(f"Error validating IAM model actions: {str(e)}")
        return None

def validate_service_profile_content(profile, valid_param_details, valid_action_details):
    """Validate service profile content against documented capabilities"""
    try:
        if not isinstance(profile, dict):
            logger.error("Invalid profile structure")
            return None
            
        # Validate encryption capabilities
        encryption = profile.get('dataProtection', {}).get('encryption', {})
        if encryption:
            encryption_params = [p for p in valid_param_details.keys() 
                              if 'encrypt' in p.lower() or 'kms' in p.lower()]
            encryption['atRest']['supported'] = bool(encryption_params)
            
        # Validate network capabilities
        network = profile.get('networkControls', {})
        if network:
            vpc_params = [p for p in valid_param_details.keys() 
                        if 'vpc' in p.lower()]
            network['vpcSupport'] = bool(vpc_params)
            
        # Validate IAM capabilities
        access_controls = profile.get('accessControls', {}).get('iamSupport', {})
        if access_controls:
            iam_actions = [a for a in valid_action_details.keys() 
                         if any(role in a.lower() for role in ['role', 'policy', 'permission'])]
            access_controls['serviceRoles'] = list(set(
                role for action in iam_actions 
                for role in extract_roles_from_action(action)
            ))
            
        # Validate logging capabilities
        logging_config = profile.get('managementOps', {}).get('logging', {})
        if logging_config:
            logging_config['cloudwatchSupport'] = any('cloudwatch' in p.lower() 
                                             for p in valid_param_details.keys())
            logging_config['cloudtrailSupport'] = any('cloudtrail' in p.lower() 
                                             for p in valid_param_details.keys())
            
        # Add validation metadata
        from datetime import datetime
        profile['_metadata'] = {
            "validation_timestamp": datetime.utcnow().isoformat(),
            "validated_parameters": len(valid_param_details),
            "validated_actions": len(valid_action_details)
        }
        
        logger.info("Successfully validated service profile content")
        return profile
        
    except Exception as e:
        logger.error(f"Error validating service profile: {str(e)}")
        return None

def extract_roles_from_action(action_name):
    """Extract role names from IAM action names"""
    roles = []
    if 'role' in action_name.lower():
        role_parts = action_name.split(':')
        if len(role_parts) > 1:
            roles.append(role_parts[1])
    return roles
