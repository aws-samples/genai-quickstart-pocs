#!/usr/bin/env python3
"""Python bridge to invoke AgentCore CLI"""
import json
import sys
import subprocess  # nosec B404 - subprocess needed for system commands
import uuid

def invoke_agent(prompt, session_id=None):
    """Invoke AgentCore agent with prompt"""
    try:
        # Generate valid session ID (33+ chars required)
        if not session_id or len(session_id) < 33:
            session_id = str(uuid.uuid4())
        
        # Call agentcore CLI
        cmd = ['agentcore', 'invoke', json.dumps({'prompt': prompt})]
        cmd.extend(['--session-id', session_id])
        
        result = subprocess.run(  # nosec B603 - subprocess needed for system commands
            cmd,
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode != 0:
            raise Exception(f"AgentCore failed: {result.stderr}")
        
        # Parse response
        output_text = result.stdout.strip()
        response_start = output_text.find('Response:')
        
        if response_start == -1:
            raise Exception("No Response found in output")
        
        response_json_str = output_text[response_start + len('Response:'):].strip()
        response_json_str = response_json_str.replace('\n', ' ')
        
        try:
            response_data = json.loads(response_json_str)
            
            # Extract text from response structure
            # AgentCore returns: {"role": "assistant", "content": [{"text": "..."}]}
            if isinstance(response_data, dict):
                if 'content' in response_data:
                    content = response_data['content']
                    if isinstance(content, list) and len(content) > 0:
                        text = content[0].get('text', '')
                        return {
                            'output': text,
                            'sessionId': session_id
                        }
                elif 'result' in response_data:
                    result_data = response_data['result']
                    if isinstance(result_data, dict) and 'content' in result_data:
                        content = result_data['content']
                        if isinstance(content, list) and len(content) > 0:
                            text = content[0].get('text', '')
                            return {
                                'output': text,
                                'sessionId': session_id
                            }
            
            # Fallback: return raw response
            return {
                'output': response_json_str,
                'sessionId': session_id
            }
        except json.JSONDecodeError:
            # If JSON parsing fails, return as text
            return {
                'output': response_json_str,
                'sessionId': session_id
            }
            
    except subprocess.TimeoutExpired:
        return {
            'output': 'Request timed out. Please try again.',
            'sessionId': session_id or str(uuid.uuid4())
        }
    except Exception as e:
        return {
            'output': f'Error: {str(e)}',
            'sessionId': session_id or str(uuid.uuid4())
        }

if __name__ == '__main__':
    try:
        data = json.loads(sys.stdin.read())
        result = invoke_agent(data['prompt'], data.get('sessionId'))
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({
            'output': f'Bridge error: {str(e)}',
            'sessionId': str(uuid.uuid4())
        }))
