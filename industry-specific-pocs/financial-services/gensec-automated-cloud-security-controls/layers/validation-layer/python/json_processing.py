import json
import re
import logging

logger = logging.getLogger()

def camel_to_title(text):
    """Convert camelCase to Title Case with spaces"""
    # Insert space before uppercase letters that follow lowercase letters
    text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)
    # Handle sequences of uppercase letters followed by lowercase
    text = re.sub(r'([A-Z]+)([A-Z][a-z])', r'\1 \2', text)
    return text.title()

def convert_json_to_markdown(json_data, title="Document"):
    """Convert JSON to markdown with proper formatting for nested structures"""
    try:
        md = f"# {title}\n\n"
        
        for key, value in json_data.items():
            if key.startswith('_'):
                # Handle metadata sections
                md += f"## {camel_to_title(key[1:])}\n\n"
            else:
                md += f"## {camel_to_title(key)}\n\n"
            
            md += _format_value(value, 0)
            md += "\n"
        
        return md
        
    except Exception as e:
        return f"# Error\n\nFailed to convert JSON to markdown: {str(e)}\n"

def _format_value(value, indent_level=0):
    """Recursively format values with proper indentation"""
    indent = "  " * indent_level
    
    if isinstance(value, dict):
        result = ""
        dict_items = list(value.items())
        for i, (k, v) in enumerate(dict_items):
            result += f"{indent}**{camel_to_title(k)}**: "
            if isinstance(v, (dict, list)):
                result += "\n"
                result += _format_value(v, indent_level + 1)
                # Add line break after nested structures
                if i < len(dict_items) - 1:
                    result += "\n"
            else:
                result += f"{v}\n"
                # Add line break between dictionary items (except last one)
                if i < len(dict_items) - 1:
                    result += "\n"
        return result
    
    elif isinstance(value, list):
        if not value:
            return f"{indent}*None*\n"
        
        # Check if all items are simple strings/numbers
        if all(isinstance(item, (str, int, float, bool)) for item in value):
            result = ""
            for item in value:
                result += f"{indent}- {item}\n"
            return result
        
        # Check if this is a list of objects that should be a table
        elif all(isinstance(item, dict) for item in value) and len(value) > 1:
            # Get all unique keys from all objects
            all_keys = []
            for item in value:
                for k in item.keys():
                    if k not in all_keys:
                        all_keys.append(k)
            
            # Create table if keys are reasonable for table format
            if len(all_keys) <= 6:  # Reasonable number of columns
                result = ""
                
                # Create table header
                result += f"{indent}| " + " | ".join(camel_to_title(k) for k in all_keys) + " |\n"
                result += f"{indent}| " + " | ".join("---" for _ in all_keys) + " |\n"
                
                # Create table rows
                for item in value:
                    row = []
                    for k in all_keys:
                        cell_value = item.get(k, "")
                        if isinstance(cell_value, list):
                            # Join list items with <br> for table cells
                            cell_value = "<br>".join(str(v) for v in cell_value[:3])  # Limit to first 3 items
                            if len(item.get(k, [])) > 3:
                                cell_value += "<br>..."
                        elif isinstance(cell_value, dict):
                            cell_value = json.dumps(cell_value, separators=(',', ':'))
                        row.append(str(cell_value).replace('\n', ' ').replace('|', '\\|'))
                    result += f"{indent}| " + " | ".join(row) + " |\n"
                result += "\n"
                return result
        
        # Complex list items (not suitable for table)
        result = ""
        for i, item in enumerate(value):
            if isinstance(item, dict):
                result += f"{indent}**Item {i+1}**:\n"
                result += _format_value(item, indent_level + 1)
            else:
                result += f"{indent}- {item}\n"
        return result
    
    else:
        return f"{indent}{value}\n"

def clean_json_text(text):
    """Clean and prepare JSON text for parsing"""
    try:
        text = text.strip()
        
        # Remove any incomplete parts
        last_brace = text.rfind('}')
        if last_brace > 0:
            text = text[:last_brace+1]
        
        # Remove any trailing commas before closing braces
        text = re.sub(r',(\s*})', r'\1', text)
        
        return text
    except Exception as e:
        logger.error(f"Error cleaning JSON text: {str(e)}")
        raise

def extract_json_from_text(text):
    """Extract JSON from text content with improved parsing, handling markdown formatting"""
    try:
        text = text.strip()
        logger.info(f"Cleaning and parsing text: {text[:100]}...")
        
        # Strategy 1: Direct JSON parsing
        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            pass
        
        # Strategy 2: Extract from markdown blocks
        if '```json' in text or '```' in text:
            blocks = text.split('```')
            for block in blocks:
                block = block.strip()
                if block.startswith('json'):
                    block = block[4:].strip()
                try:
                    parsed = json.loads(block)
                    if isinstance(parsed, dict):
                        return parsed
                except json.JSONDecodeError:
                    continue
                    
        # Strategy 3: Find JSON object
        start_idx = text.find('{')
        end_idx = text.rfind('}')
        if start_idx >= 0 and end_idx > start_idx:
            try:
                json_str = text[start_idx:end_idx + 1]
                parsed = json.loads(json_str)
                if isinstance(parsed, dict):
                    return parsed
            except json.JSONDecodeError:
                pass

        logger.warning(f"No valid JSON found in content: {text[:200]}...")
        return None

    except Exception as e:
        logger.error(f"Error parsing content: {str(e)}")
        return None

def extract_json_from_content(content):
    """Extract JSON from content with improved parsing logic"""
    try:
        # If content is already a dict or list, return it
        if isinstance(content, (dict, list)):
            return content

        # If content is a string, try to parse it
        if isinstance(content, str):
            # Try direct JSON parsing first
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                pass

            # Look for JSON in markdown blocks
            if '```json' in content:
                json_blocks = content.split('```json')
                for block in json_blocks[1:]:
                    try:
                        json_str = block.split('```')[0].strip()
                        return json.loads(json_str)
                    except json.JSONDecodeError:
                        continue

            # Try to find JSON object
            start_idx = content.find('{')
            end_idx = content.rfind('}')
            if start_idx >= 0 and end_idx > start_idx:
                try:
                    json_str = content[start_idx:end_idx + 1]
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    pass

            # Try to find JSON array
            start_idx = content.find('[')
            end_idx = content.rfind(']')
            if start_idx >= 0 and end_idx > start_idx:
                try:
                    json_str = content[start_idx:end_idx + 1]
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    pass

        # If content is a list of items, try to extract JSON from each item
        if isinstance(content, list):
            for item in content:
                if isinstance(item, dict) and 'text' in item:
                    result = extract_json_from_content(item['text'])
                    if result:
                        return result

        logger.error(f"No valid JSON found in content: {str(content)[:200]}...")
        raise ValueError("No valid JSON found in content")

    except Exception as e:
        logger.error(f"Error in extract_json_from_content: {str(e)}")
        raise

def clean_and_extract_json(text):
    """Clean markdown formatting and extract JSON content"""
    try:
        # Remove markdown formatting
        if '```json' in text:
            parts = text.split('```json')
            if len(parts) > 1:
                json_content = parts[1].split('```')[0].strip()
                try:
                    parsed_json = json.loads(json_content)
                    logger.info("Successfully parsed JSON from markdown block")
                    return parsed_json
                except json.JSONDecodeError:
                    logger.warning("Failed to parse JSON from markdown block")

        # Try to find JSON object
        start_idx = text.find('{')
        end_idx = text.rfind('}')
        if start_idx >= 0 and end_idx > start_idx:
            try:
                json_str = text[start_idx:end_idx + 1]
                parsed_json = json.loads(json_str)
                logger.info("Successfully parsed JSON object")
                return parsed_json
            except json.JSONDecodeError:
                logger.warning("Failed to parse JSON object")

        # Try to parse the entire text as JSON
        try:
            parsed_json = json.loads(text)
            logger.info("Successfully parsed entire text as JSON")
            return parsed_json
        except json.JSONDecodeError:
            logger.warning("Failed to parse entire text as JSON")

        logger.error(f"No valid JSON found in content: {text[:200]}...")
        return None

    except Exception as e:
        logger.error(f"Error cleaning and extracting JSON: {str(e)}")
        return None
