"""
Car Insurance Claim Agent Demo using Amazon Nova Sonic model
"""

import datetime
import pytz
import os
import sys
import asyncio
import base64
import json
import uuid
import dateutil
import warnings
import pyaudio
import queue
import time
import inspect
from aws_sdk_bedrock_runtime.client import BedrockRuntimeClient, InvokeModelWithBidirectionalStreamOperationInput
from aws_sdk_bedrock_runtime.models import InvokeModelWithBidirectionalStreamInputChunk, BidirectionalInputPayloadPart
from aws_sdk_bedrock_runtime.config import Config, HTTPAuthSchemeResolver, SigV4AuthScheme
from smithy_aws_core.credentials_resolvers.environment import EnvironmentCredentialsResolver

# Add the current directory to sys.path to make insurance_claim_system importable
sys.path.append(os.path.dirname(__file__))

from insurance_claim_system.claim_system import InsuranceClaimSystem, AccidentType, VehicleDamageLevel, Vehicle, AccidentDetails
from insurance_claim_system.pdf_generator import ClaimFormPDFGenerator

# Initialize insurance system with test data
insurance_system = InsuranceClaimSystem()
pdf_generator = ClaimFormPDFGenerator()

# Suppress warnings
warnings.filterwarnings("ignore")

# Audio configuration - ensures real-time low lateincy voice interaction between user and agent
# maintains good audio quality for both speech recognition and synthesis
INPUT_SAMPLE_RATE = 16000 
OUTPUT_SAMPLE_RATE = 24000
CHANNELS = 1 #mon audio
FORMAT = pyaudio.paInt16
CHUNK_SIZE = 1024

# Debug mode flag
DEBUG = False

def debug_print(message):
    """Print only if debug mode is enabled"""
    if DEBUG:
        functionName = inspect.stack()[1].function
        if functionName == 'time_it' or functionName == 'time_it_async':
            functionName = inspect.stack()[2].function
        print('{:%Y-%m-%d %H:%M:%S.%f}'.format(datetime.datetime.now())[:-3] + ' ' + functionName + ' ' + message)

def time_it(label, methodToRun):
    start_time = time.perf_counter()
    result = methodToRun()
    end_time = time.perf_counter()
    debug_print(f"Execution time for {label}: {end_time - start_time:.4f} seconds")
    return result

async def time_it_async(label, methodToRun):
    start_time = time.perf_counter()
    result = await methodToRun()
    end_time = time.perf_counter()
    debug_print(f"Execution time for {label}: {end_time - start_time:.4f} seconds")
    return result

class BedrockStreamManager:
    """Manages bidirectional streaming with AWS Bedrock using asyncio"""
    # wrapper definitions
    # Start session starts conversation sessions between app to nova
    START_SESSION_EVENT = '''{
        "event": {
            "sessionStart": {
            "inferenceConfiguration": {
                "maxTokens": 1024,
                "topP": 0.95,
                "temperature": 0.7,
                "stopSequences": [],
                "additionalModelRequestFields": {
                    "turnDetection": {
                        "type": "server_vad",
                        "threshold": 0.8,
                        "prefix_padding_ms": 500,
                        "silence_duration_ms": 1500
                    }
                }
                }
            }
        }
    }'''

    # Start content block fromo app to nova, wraps around audio
    CONTENT_START_EVENT = '''{
        "event": {
            "contentStart": {
            "promptName": "%s",
            "contentName": "%s",
            "type": "AUDIO",
            "interactive": true,
            "role": "USER",
            "audioInputConfiguration": {
                "mediaType": "audio/lpcm",
                "sampleRateHertz": 16000,
                "sampleSizeBits": 16,
                "channelCount": 1,
                "audioType": "SPEECH",
                "encoding": "base64"
                }
            }
        }
    }'''

    # Sends audio data to nova sonic
    AUDIO_EVENT_TEMPLATE = '''{
        "event": {
            "audioInput": {
            "promptName": "%s",
            "contentName": "%s",
            "content": "%s"
            }
        }
    }'''

    # Starts content block from app to nova, wraps around text
    TEXT_CONTENT_START_EVENT = '''{
        "event": {
            "contentStart": {
            "promptName": "%s",
            "contentName": "%s",
            "type": "TEXT",
            "role": "%s",
            "interactive": true,
                "textInputConfiguration": {
                    "mediaType": "text/plain"
                }
            }
        }
    }'''

    # Sends text block to nova sonic
    TEXT_INPUT_EVENT = '''{
        "event": {
            "textInput": {
            "promptName": "%s",
            "contentName": "%s",
            "content": "%s"
            }
        }
    }'''

    # Starts content block from app to nova, wraps around dynamic tool
    TOOL_CONTENT_START_EVENT = '''{
        "event": {
            "contentStart": {
                "promptName": "%s",
                "contentName": "%s",
                "interactive": false,
                "type": "TOOL",
                "role": "TOOL",
                "toolResultInputConfiguration": {
                    "toolUseId": "%s",
                    "type": "TEXT",
                    "textInputConfiguration": {
                        "mediaType": "text/plain"
                    }
                }
            }
        }
    }'''

    # Shared end block for content from app to nova
    CONTENT_END_EVENT = '''{
        "event": {
            "contentEnd": {
            "promptName": "%s",
            "contentName": "%s"
            }
        }
    }'''

    # Ends the session 
    PROMPT_END_EVENT = '''{
        "event": {
            "promptEnd": {
            "promptName": "%s"
            }
        }
    }'''

    #End session ends conversation between app to nova
    SESSION_END_EVENT = '''{
        "event": {
            "sessionEnd": {}
        }
    }'''
    
    def start_prompt(self):
        """Create a promptStart event with insurance claim tools"""
        get_default_tool_schema = json.dumps({
            "type": "object",
            "properties": {},
            "required": []
        })



        #Schema for all obtainable variables
        create_claim_schema = json.dumps({
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
                "policyholder_name": {
                    "type": "string",
                    "description": "Full name of the policy holder (First Last)"
                },
                "policy_id": {
                    "type": "string",
                    "description": "The policy ID of the policy holder"
                },
                "policyholder_phone": {
                    "type": "string",
                    "description": "Contact phone number of the policy holder"
                },
                "policyholder_email": {
                    "type": "string",
                    "description": "Email address of the policy holder"
                },
                "policyholder_address": {
                    "type": "string",
                    "description": "Home address of the policy holder (Street, City, State, ZIP)"
                },
                "vehicle_make": {
                    "type": "string",
                    "description": "Make of the vehicle (e.g., Toyota, Honda, Ford)"
                },
                "vehicle_model": {
                    "type": "string",
                    "description": "Model of the vehicle (e.g., Camry, Civic, F-150)"
                },
                "vehicle_year": {
                    "type": "integer",
                    "description": "Year of the vehicle"
                },
                "vehicle_color": {
                    "type": "string",
                    "description": "Color of the vehicle"
                },
                "vehicle_vin": {
                    "type": "string",
                    "description": "17-digit Vehicle Identification Number (VIN)"
                },
                "license_plate": {
                    "type": "string",
                    "description": "License plate number of the vehicle"
                },
                "vehicle_mileage": {
                    "type": "string",
                    "description": "Current mileage of the vehicle"
                },
                "accident_date": {
                    "type": "string",
                    "description": "Date of the accident in YYYY-MM-DD format"
                },
                "accident_time": {
                    "type": "string",
                    "description": "Time of the accident (e.g., '2:30 PM', '14:30')"
                },
                "accident_location": {
                    "type": "string",
                    "description": "Location where the accident occurred (street address or intersection, city/state)"
                },
                "accident_description": {
                    "type": "string",
                    "description": "Detailed description of how the accident happened"
                },
                "accident_type": {
                    "type": "string",
                    "description": "Type of accident: Collision, Theft, Vandalism, Weather Damage, or Other"
                },
                "weather_conditions": {
                    "type": "string",
                    "description": "Weather conditions at time of accident: Clear, Rain, Snow, Ice, Fog, or Other"
                },
                "damage_level": {
                    "type": "string",
                    "description": "Level of damage: Minor, Moderate, Severe, or Total Loss"
                },
                "estimated_cost": {
                    "type": "number",
                    "description": "Estimated repair cost if known"
                },
                "police_report_filed": {
                    "type": "string",
                    "description": "Was a police report filed? (Yes/No)"
                },
                "police_report_number": {
                    "type": "string",
                    "description": "Police report number if available"
                },
                "police_officer_name": {
                    "type": "string",
                    "description": "Name of the police officer"
                },
                "police_badge_number": {
                    "type": "string",
                    "description": "Badge number of the police officer"
                },
                "police_department": {
                    "type": "string",
                    "description": "Name of the police department"
                },
                "other_party_info": {
                    "type": "string",
                    "description": "Information about other parties involved (name, insurance, policy, license, phone)"
                },
                "witnesses": {
                    "type": "string",
                    "description": "Witness information (names, phone numbers, statements)"
                }
            },
            "required": ["policyholder_name", "policy_id", "policyholder_phone", "vehicle_make", "vehicle_model", "vehicle_year", "vehicle_color", "license_plate", "accident_date", "accident_time", "accident_location", "accident_description", "accident_type", "damage_level"]
        })

        prompt_start_event = {
            "event": {
                "promptStart": {
                    "promptName": self.prompt_name,
                    "textOutputConfiguration": {
                        "mediaType": "text/plain"
                    },
                    "audioOutputConfiguration": {
                        "mediaType": "audio/lpcm",
                        "sampleRateHertz": 24000,
                        "sampleSizeBits": 16,
                        "channelCount": 1,
                        "voiceId": "matthew",
                        "encoding": "base64",
                        "audioType": "SPEECH"
                    },
                    "toolUseOutputConfiguration": {
                        "mediaType": "application/json"
                    },
                    "toolConfiguration": {
                        "tools": [
                            {
                                "toolSpec": {
                                    "name": "getDateTool",
                                    "description": "get information about the current date",
                                    "inputSchema": {
                                        "json": get_default_tool_schema
                                    }
                                }
                            },
                            {
                                "toolSpec": {
                                    "name": "getTimeTool",
                                    "description": "get information about the current time",
                                    "inputSchema": {
                                        "json": get_default_tool_schema
                                    }
                                }
                            },
                            {
                                "toolSpec": {
                                    "name": "createInsuranceClaim",
                                    "description": "create a new insurance claim with all the collected information and generate a PDF",
                                    "inputSchema": {
                                        "json": create_claim_schema
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        }
        
        return json.dumps(prompt_start_event)
    
    # Creates tool result event to send execution results back to NS after tool has been called and processed
    # returns results not notification
    def tool_result_event(self, content_name, content, role):
        """Create a tool result event"""
        if isinstance(content, dict):
            content_json_string = json.dumps(content)
        else:
            content_json_string = content
            
        tool_result_event = {
            "event": {
                "toolResult": {
                    "promptName": self.prompt_name,
                    "contentName": content_name,
                    "content": content_json_string,
                    "role": "TOOL"
                }
            }
        }
        return json.dumps(tool_result_event)
   
    def __init__(self, model_id='amazon.nova-sonic-v1:0', region='us-east-1'):
        """Initialize the stream manager."""
        print("Welcome to the Car Insurance Claim Filing System")
        print("I'm your AI insurance agent and I'll help you file a claim for your vehicle.")
        print("Please speak clearly and I'll guide you through the process.")
        print("")
        print("Your call with the insurance agent will start as soon as you speak.")
        print("")

        # No predefined policy holder - will collect information during conversation
        self.current_policy_holder = None
        self.model_id = model_id
        self.region = region
        
        # Replace RxPy subjects with asyncio queues
        # Without these we can't have advanced bot interaction
        self.audio_input_queue = asyncio.Queue()
        self.audio_output_queue = asyncio.Queue()
        self.output_queue = asyncio.Queue()
        
        self.response_task = None
        self.stream_response = None
        self.is_active = False
        self.barge_in = False
        self.bedrock_client = None
        
        # Audio playback components
        self.audio_player = None
        
        # Text response components
        self.display_assistant_text = False
        self.role = None

        # Session information
        self.prompt_name = str(uuid.uuid4())
        self.content_name = str(uuid.uuid4())
        self.audio_content_name = str(uuid.uuid4())
        self.toolUseContent = ""
        self.toolUseId = ""
        self.toolName = ""

    def _initialize_client(self):
        """Initialize the Bedrock client."""
        config = Config(
            endpoint_uri=f"https://bedrock-runtime.{self.region}.amazonaws.com",
            region=self.region,
            aws_credentials_identity_resolver=EnvironmentCredentialsResolver(),
            http_auth_scheme_resolver=HTTPAuthSchemeResolver(),
            http_auth_schemes={"aws.auth#sigv4": SigV4AuthScheme()}
        )
        self.bedrock_client = BedrockRuntimeClient(config=config)
    
    #initialize the bidirectional stream w/ bedrock
    async def initialize_stream(self):
        """Initialize the bidirectional stream with Bedrock."""
        if not self.bedrock_client:
            self._initialize_client()
        
        try:
            self.stream_response = await time_it_async("invoke_model_with_bidirectional_stream", 
                lambda: self.bedrock_client.invoke_model_with_bidirectional_stream(
                    InvokeModelWithBidirectionalStreamOperationInput(model_id=self.model_id)))
            self.is_active = True

            default_system_prompt = """
            You are a friendly and professional car insurance claims agent named Albert Johnson working for SecureAuto Insurance. 
            You will engage in a spoken dialog to help customers file insurance claims for vehicle accidents.
            
            Introduce yourself and ask how you can help them today. Be empathetic as customers may be stressed after an accident.
            Make sure you get the current date so that you can assume current year if the customer only gives a partial date.
            Keep your responses short, generally two or three sentences for chatty scenarios.
            
            IMPORTANT: When customers speak numbers, letters, or codes (like license plates, policy numbers, VINs, phone numbers), convert spoken words to proper format. For example: 'VT One Oh Four' becomes 'VT104', 'Five Five Five One Two Three Four' becomes '5551234', 'Two Thousand Twenty Four' becomes '2024'.
            
            IMPORTANT: If a customer provides multiple pieces of information in one response, acknowledge all the information they provided and remember it. Do not ask for information you already have. For example, if they say 'I drive a 2020 red Honda Civic with plate ABC123', acknowledge that you now have the make, model, year, color, and license plate, and skip those questions.
            
            You MUST systematically collect ALL of the following information by asking specific questions for each field. Do not skip any fields, but do not ask for information already provided:
            
            1. POLICYHOLDER INFORMATION (ask for each separately):
               - What is your full name?
               - What is your policy number?
               - What is your contact phone number?
               - What is your email address?
               - What is your home address including street, city, state, and ZIP code?
            
            2. VEHICLE INFORMATION (ask for each separately):
               - What is the make of your vehicle?
               - What is the model?
               - What year is your vehicle?
               - What color is your vehicle?
               - What is your license plate number?
               - What is the VIN (17-digit vehicle identification number)?
               - What is the current mileage on your vehicle?
            
            3. INCIDENT DETAILS (ask for each separately):
               - What date did the accident occur? (convert response to MM/DD/YYYY format)
               - What time did the accident happen? (convert response to HH:MM AM/PM format)
               - Where exactly did the accident occur? (street address or intersection, city, state)
               - What type of incident was this? (Collision, Theft, Vandalism, Weather Damage, or Other)
               - What were the weather conditions at the time?
               - Please describe in detail what happened during the accident and how severe the damage is
            
            4. OTHER PARTIES INVOLVED (ask if applicable):
               - Were there other drivers involved?
               - If yes, what is the other driver name?
               - What is their insurance company?
               - What is their policy number?
               - What is their license number?
               - What is their contact phone number?
            
            5. POLICE REPORT (ask each question):
               - Was a police report filed?
               - If yes, what is the police report number?
               - What is the name of the police officer?
               - What is the officer badge number?
               - What police department handled the report?
            
            6. WITNESSES (ask if applicable):
               - Were there any witnesses to the accident?
               - If yes, what are their names and phone numbers?
               - What did they witness?
                        
            Ask for ONE piece of information at a time, but if the customer provides multiple pieces of information in their response, acknowledge what you received and move on to the next missing piece. Wait for the customer response before moving to the next question. Be systematic and thorough, but efficient - do not ask for information you already have. Once you have collected ALL required information, use the createInsuranceClaim tool to file the claim and generate a PDF.
            At the end, tell the users you can find the claim on the website or app, not the actual file location.`
            
            """.replace('\n', ' ')

            debug_print("System prompt is: {}".format(default_system_prompt))

            # Send initialization events to NS
            prompt_event = self.start_prompt()
            text_content_start = self.TEXT_CONTENT_START_EVENT % (self.prompt_name, self.content_name, "SYSTEM")
            text_content = self.TEXT_INPUT_EVENT % (self.prompt_name, self.content_name, default_system_prompt)
            text_content_end = self.CONTENT_END_EVENT % (self.prompt_name, self.content_name)
            
            init_events = [self.START_SESSION_EVENT, prompt_event, text_content_start, text_content, text_content_end]
            
            for event in init_events:
                await self.send_raw_event(event)
                await asyncio.sleep(0.1)
            
            # Start listening for responses
            self.response_task = asyncio.create_task(self._process_responses())
            
            # Start processing audio input
            asyncio.create_task(self._process_audio_input())
            
            await asyncio.sleep(0.1)
            
            debug_print("Stream initialized successfully")
            return self
        except Exception as e:
            self.is_active = False
            print(f"Failed to initialize stream: {str(e)}")
            raise
    
    #sends the raw event JSON, safety check
    async def send_raw_event(self, event_json):
        """Send a raw event JSON to the Bedrock stream."""
        if not self.stream_response or not self.is_active:
            debug_print("Stream not initialized or closed")
            return
       
        event = InvokeModelWithBidirectionalStreamInputChunk(
            value=BidirectionalInputPayloadPart(bytes_=event_json.encode('utf-8'))
        )
        
        try:
            await self.stream_response.input_stream.send(event)
            if DEBUG:
                if len(event_json) > 200:
                    event_type = list(json.loads(event_json).get("event", {}).keys())
                    if "audioInput" in event_type:
                        event_type.remove("audioInput")
                    if len(event_type) > 0:
                        debug_print(f"Sent event type: {event_type}")
                else:
                    debug_print(f"Sent event: {event_json}")
        except Exception as e:
            debug_print(f"Error sending event: {str(e)}")
            if DEBUG:
                import traceback
                traceback.print_exc()
    
    # Sends wrapper start
    async def send_audio_content_start_event(self):
        """Send a content start event to the Bedrock stream."""
        content_start_event = self.CONTENT_START_EVENT % (self.prompt_name, self.audio_content_name)
        await self.send_raw_event(content_start_event)
    
    # sends mic data every 64 ms to be processed in queue
    async def _process_audio_input(self):
        """Process audio input from the queue and send to Bedrock."""
        while self.is_active:
            try:
                data = await self.audio_input_queue.get()
                
                audio_bytes = data.get('audio_bytes')
                if not audio_bytes:
                    debug_print("No audio bytes received")
                    continue
                
                blob = base64.b64encode(audio_bytes)
                audio_event = self.AUDIO_EVENT_TEMPLATE % (
                    self.prompt_name, 
                    self.audio_content_name, 
                    blob.decode('utf-8')
                )
                
                await self.send_raw_event(audio_event)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                debug_print(f"Error processing audio: {e}")
                if DEBUG:
                    import traceback
                    traceback.print_exc()
    
    # puts data in queue
    def add_audio_chunk(self, audio_bytes):
        """Add an audio chunk to the queue."""
        self.audio_input_queue.put_nowait({
            'audio_bytes': audio_bytes,
            'prompt_name': self.prompt_name,
            'content_name': self.audio_content_name
        })
    
    # tells NS that the user has finished speaking
    async def send_audio_content_end_event(self):
        """Send a content end event to the Bedrock stream."""
        if not self.is_active:
            debug_print("Stream is not active")
            return
        
        content_end_event = self.CONTENT_END_EVENT % (self.prompt_name, self.audio_content_name)
        await self.send_raw_event(content_end_event)
        debug_print("Audio ended")
    
    # sends the end tool wrapper start
    async def send_tool_start_event(self, content_name):
        """Send a tool content start event to the Bedrock stream."""
        content_start_event = self.TOOL_CONTENT_START_EVENT % (self.prompt_name, content_name, self.toolUseId)
        debug_print(f"Sending tool start event: {content_start_event}")  
        await self.send_raw_event(content_start_event)

    # sends the tool execution result
    async def send_tool_result_event(self, content_name, tool_result):
        """Send a tool content event to the Bedrock stream."""
        tool_result_event = self.tool_result_event(content_name=content_name, content=tool_result, role="TOOL")
        debug_print(f"Sending tool result event: {tool_result_event}")
        await self.send_raw_event(tool_result_event)
    
    #closes the tool content event
    async def send_tool_content_end_event(self, content_name):
        """Send a tool content end event to the Bedrock stream."""
        tool_content_end_event = self.CONTENT_END_EVENT % (self.prompt_name, content_name)
        debug_print(f"Sending tool content event: {tool_content_end_event}")
        await self.send_raw_event(tool_content_end_event)
    
    # closes the current prompt (not the session!)
    async def send_prompt_end_event(self):
        """Close the stream and clean up resources."""
        if not self.is_active:
            debug_print("Stream is not active")
            return
        
        prompt_end_event = self.PROMPT_END_EVENT % (self.prompt_name)
        await self.send_raw_event(prompt_end_event)
        debug_print("Prompt ended")

    # closes the session    
    async def send_session_end_event(self):
        """Send a session end event to the Bedrock stream."""
        if not self.is_active:
            debug_print("Stream is not active")
            return

        await self.send_raw_event(self.SESSION_END_EVENT)
        self.is_active = False
        debug_print("Session ended")
    
    async def _process_responses(self):
        """
        Background task that continuously processes incoming responses from Nova Sonic.
        This is the "central nervous system" that handles all AI responses including:
        - Text responses (conversation)
        - Audio responses (AI voice)
        - Tool calls (when AI wants to execute functions)
        - Content flow control (start/end markers)
        """
        try:            
            # Main response processing loop - runs until session ends
            while self.is_active:
                try:
                    # Wait for and receive the next response from Nova Sonic
                    # This is a network operation that may have latency
                    output = await self.stream_response.await_output()
                    result = await output[1].receive()
                    
                    # Check if we actually received data
                    if result.value and result.value.bytes_:
                        try:
                            # Convert raw bytes to UTF-8 string, then parse as JSON
                            response_data = result.value.bytes_.decode('utf-8')
                            json_data = json.loads(response_data)
                            
                            # All Nova Sonic responses are wrapped in an "event" structure
                            # Handle different types of events based on their content
                            if 'event' in json_data:
                                
                                # CONTENT START EVENT - Nova Sonic is beginning to send content
                                if 'contentStart' in json_data['event']:
                                    debug_print("Content start detected")
                                    content_start = json_data['event']['contentStart']
                                    
                                    # Check for speculative generation (early/preview content)
                                    if 'additionalModelFields' in content_start:
                                        try:
                                            additional_fields = json.loads(content_start['additionalModelFields'])
                                            if additional_fields.get('generationStage') == 'SPECULATIVE':
                                                debug_print("Speculative content detected")
                                                # Enable text display for speculative content
                                                self.display_assistant_text = True
                                            else:
                                                # Disable text display for non-speculative content
                                                self.display_assistant_text = False
                                        except json.JSONDecodeError:
                                            debug_print("Error parsing additionalModelFields")
                                
                                # TEXT OUTPUT EVENT - Nova Sonic is sending text (conversation or transcription)
                                elif 'textOutput' in json_data['event']:
                                    text_content = json_data['event']['textOutput']['content']
                                    role = json_data['event']['textOutput']['role']
                                    
                                    # Check for barge-in signal (user interrupting AI)
                                    if '{ "interrupted" : true }' in text_content:
                                        if DEBUG:
                                            print("Barge-in detected. Stopping audio output.")
                                        # Set flag to stop AI audio playback immediately
                                        self.barge_in = True

                                    # Display text based on role and display settings
                                    if (role == "ASSISTANT" and self.display_assistant_text):
                                        # Show what the AI agent is saying
                                        print(f"Agent: {text_content}")
                                    elif (role == "USER"):
                                        # Show transcribed user speech (speech-to-text result)
                                        print(f"Customer: {text_content}")

                                # AUDIO OUTPUT EVENT - Nova Sonic is sending voice audio
                                elif 'audioOutput' in json_data['event']:
                                    # Extract base64-encoded audio content
                                    audio_content = json_data['event']['audioOutput']['content']
                                    # Decode from base64 to raw audio bytes
                                    audio_bytes = base64.b64decode(audio_content)
                                    # Queue audio for playback through speakers
                                    await self.audio_output_queue.put(audio_bytes)
                                
                                # TOOL USE EVENT - Nova Sonic wants to call a function/tool
                                #DETECTION
                                elif 'toolUse' in json_data['event']:
                                    # Store tool call information for processing
                                    self.toolUseContent = json_data['event']['toolUse']
                                    self.toolName = json_data['event']['toolUse']['toolName']
                                    self.toolUseId = json_data['event']['toolUse']['toolUseId']
                                    debug_print(f"Tool use detected: {self.toolName}, ID: {self.toolUseId}")
                                
                                # CONTENT END FOR TOOL - Nova Sonic finished requesting a tool
                                #EXECUTION
                                elif 'contentEnd' in json_data['event'] and json_data['event'].get('contentEnd', {}).get('type') == 'TOOL':
                                    debug_print("Processing tool use and sending result")
                                    
                                    # Execute the requested tool (e.g., create insurance claim)
                                    toolResult = await self.processToolUse(self.toolName, self.toolUseContent)
                                    
                                    # Create unique identifier for this tool result content block
                                    toolContent = str(uuid.uuid4())
                                    
                                    # Send complete tool result content block to Nova Sonic
                                    # 1. Start tool content block
                                    await self.send_tool_start_event(toolContent)
                                    # 2. Send actual tool execution results  
                                    await self.send_tool_result_event(toolContent, toolResult)
                                    # 3. End tool content block
                                    await self.send_tool_content_end_event(toolContent)
                            
                            # Queue the processed response for any other components that need it
                            await self.output_queue.put(json_data)
                            
                        except json.JSONDecodeError:
                            # Handle malformed JSON by storing raw data
                            await self.output_queue.put({"raw_data": response_data})
                
                except StopAsyncIteration:
                    # Stream has ended normally - break out of main loop
                    break
                except Exception as e:
                    # Handle specific validation errors vs general errors
                    if "ValidationException" in str(e):
                        error_message = str(e)
                        print(f"Validation error: {error_message}")
                    else:
                        print(f"Error receiving response: {e}")
                    break
                    
        except Exception as e:
            # Top-level error handling for the entire response processing task
            print(f"Response processing error: {e}")
        finally:
            # Ensure session is marked as inactive when this task ends
            # This prevents other components from trying to use a closed session
            self.is_active = False

    #tool implementations
    async def processToolUse(self, toolName, toolUseContent):
        """Process tool use for insurance claim system"""
        tool = toolName.lower()
        debug_print(f"Tool Use Content: {toolUseContent}")

        if tool == "gettimetool":
            this_timezone = pytz.timezone("America/New_York")
            pst_time = datetime.datetime.now(this_timezone)
            return {
                "timezone": str(this_timezone),
                "formattedTime": pst_time.strftime("%I:%M %p")
            }
        
        elif tool == "getdatetool":
            this_timezone = pytz.timezone("America/New_York")
            this_date = datetime.datetime.now(this_timezone)
            
            return {
                "date": this_date.strftime("%Y-%m-%d"),
                "year": this_date.year,
                "month": this_date.month,
                "day": this_date.day,
                "dayOfWeek": this_date.strftime("%A").upper(),
                "timezone": str(this_timezone)
            }
            

        elif tool == "createinsuranceclaim":
            print("Creating insurance claim!")
            print("toolUseContent: {}, type:{}".format(toolUseContent, type(toolUseContent)))
            
            try:
                from insurance_claim_system.claim_system import PolicyHolder
                tool_content = json.loads(toolUseContent.get("content"))
                
                # Create a new policy holder dynamically from the collected information
                policy_holder = PolicyHolder(
                    name=tool_content.get("policyholder_name"),
                    policy_id=tool_content.get("policy_id"),
                    phone=tool_content.get("policyholder_phone"),
                    email=tool_content.get("policyholder_email", ""),
                    address=tool_content.get("policyholder_address", "")
                )
                
                # Create vehicle object
                vehicle = Vehicle(
                    make=tool_content.get("vehicle_make"),
                    model=tool_content.get("vehicle_model"),
                    year=int(tool_content.get("vehicle_year")),
                    color=tool_content.get("vehicle_color"),
                    license_plate=tool_content.get("license_plate"),
                    vin=tool_content.get("vehicle_vin", "")
                )
                
                # Parse accident date
                accident_date = dateutil.parser.parse(tool_content.get("accident_date"))
                
                # Create accident details
                accident_details = AccidentDetails(
                    accident_date=accident_date,
                    accident_time=tool_content.get("accident_time"),
                    location=tool_content.get("accident_location"),
                    description=tool_content.get("accident_description"),
                    accident_type=AccidentType.fromString(tool_content.get("accident_type")),
                    police_report_number=tool_content.get("police_report_number", ""),
                    other_party_info=tool_content.get("other_party_info", ""),
                    witnesses=tool_content.get("witnesses", "")
                )
                
                # Get damage level
                damage_level = VehicleDamageLevel.fromString(tool_content.get("damage_level"))
                
                # Create the claim directly without looking up existing policy holders
                claim = insurance_system.create_claim(
                    policy_holder=policy_holder,
                    vehicle=vehicle,
                    accident_details=accident_details,
                    damage_level=damage_level,
                    estimated_cost=float(tool_content.get("estimated_cost", 0))
                )
                
                # Generate PDF
                pdf_path = pdf_generator.generate_claim_pdf(claim)
                
                print(f"Insurance claim created successfully!")
                print(f"Claim ID: {claim.claim_id}")
                print(f"PDF generated: {pdf_path}")
                
                return {
                    "claim_id": claim.claim_id,
                    "status": "SUCCESS",
                    "message": f"Your insurance claim has been successfully filed. Claim ID: {claim.claim_id}. A PDF copy has been generated for your records.",
                    "pdf_path": pdf_path
                }
                
            except Exception as e:
                print(f"Error creating claim: {str(e)}")
                return {"message": f"Error creating claim: {str(e)}"}
        
        return {"message": "No tool found to accomplish the task, please ask for clarification"}
    
    #closes stream
    async def close(self):
        """Close the stream properly."""
        if not self.is_active:
            return
       
        self.is_active = False
        if self.response_task and not self.response_task.done():
            self.response_task.cancel()

        await self.send_audio_content_end_event()
        await self.send_prompt_end_event()
        await self.send_session_end_event()

        if self.stream_response:
            await self.stream_response.input_stream.close()

class AudioStreamer:
    """
    Handles real-time bidirectional audio streaming for voice conversations.
    
    This class manages the critical audio pipeline that enables natural conversation:
    - Captures microphone input continuously (user speech)
    - Streams audio to Nova Sonic in real-time  
    - Receives and plays AI voice responses
    - Handles barge-in (user interrupting AI)
    - Maintains low latency for natural conversation flow
    
    Uses PyAudio for hardware interface and asyncio for concurrent operations.
    """
    
    def __init__(self, stream_manager):
        """
        Initialize the audio streaming system with separate input/output streams.
        
        Args:
            stream_manager: BedrockStreamManager instance for communication with Nova Sonic
        """
        # Reference to the stream manager for sending audio data to Nova Sonic
        self.stream_manager = stream_manager
        
        # Flag to control streaming state - enables clean start/stop
        self.is_streaming = False
        
        # Get the current asyncio event loop for scheduling audio processing
        # This is needed to bridge PyAudio callbacks (synchronous) with asyncio (asynchronous)
        self.loop = asyncio.get_event_loop()

        # Initialize PyAudio - the Python interface to PortAudio for cross-platform audio I/O
        debug_print("AudioStreamer Initializing PyAudio...")
        self.p = time_it("AudioStreamerInitPyAudio", pyaudio.PyAudio)
        debug_print("AudioStreamer PyAudio initialized")

        # Create INPUT stream for capturing microphone audio
        # This stream continuously captures user speech and feeds it to Nova Sonic
        debug_print("Opening input audio stream...")
        self.input_stream = time_it("AudioStreamerOpenAudio", lambda: self.p.open(
            format=FORMAT,                    # 16-bit signed integers (pyaudio.paInt16)
            channels=CHANNELS,                # Mono audio (1 channel)
            rate=INPUT_SAMPLE_RATE,           # 16kHz sampling rate (optimal for speech recognition)
            input=True,                       # This is an input stream (microphone)
            frames_per_buffer=CHUNK_SIZE,     # Process 1024 samples at a time (64ms chunks at 16kHz)
            stream_callback=self.input_callback  # Callback function called for each audio chunk
        ))
        debug_print("input audio stream opened")

        # Create OUTPUT stream for playing AI voice responses
        # This stream plays Nova Sonic's voice responses through speakers/headphones
        debug_print("Opening output audio stream...")
        self.output_stream = time_it("AudioStreamerOpenAudio", lambda: self.p.open(
            format=FORMAT,                    # 16-bit signed integers
            channels=CHANNELS,                # Mono audio  
            rate=OUTPUT_SAMPLE_RATE,          # 24kHz sampling rate (higher quality for AI voice)
            output=True,                      # This is an output stream (speakers)
            frames_per_buffer=CHUNK_SIZE      # Write 1024 samples at a time
            # No callback - we'll write data directly when available
        ))
        debug_print("output audio stream opened")

    # handles theaudio from the microphone hardware
    def input_callback(self, in_data, frame_count, time_info, status):

        # Only process audio if we're actively streaming and have valid data
        if self.is_streaming and in_data:
            # Bridge from PyAudio's synchronous callback to asyncio's asynchronous world
            # Schedule the audio processing coroutine to run in the main asyncio event loop
            asyncio.run_coroutine_threadsafe(
                self.process_input_audio(in_data),  # Async function to handle the audio
                self.loop                           # The event loop to schedule it in
            )
        
        # Return continuation signal - tells PyAudio to keep the stream running
        return (None, pyaudio.paContinue)

    # actually queues the ic data to NS, is a bridge from audiostreamer to bedrock stream
    async def process_input_audio(self, audio_data):

        try:
            # Queue the audio data for the background sender task
            # add_audio_chunk() is non-blocking and just adds to an asyncio.Queue
            self.stream_manager.add_audio_chunk(audio_data)
        except Exception as e:
            # Only log errors if we're still supposed to be streaming
            # Prevents error spam during shutdown
            if self.is_streaming:
                print(f"Error processing input audio: {e}")
    
    #actually outpus the AI voice
    async def play_output_audio(self):
    
        # Main audio playback loop - runs until streaming stops
        while self.is_streaming:
            try:
                # BARGE-IN HANDLING: Check if user is interrupting AI speech
                if self.stream_manager.barge_in:
                    # User started speaking while AI was talking - stop AI immediately
                    # Clear all queued AI audio to prevent delayed/overlapping speech
                    while not self.stream_manager.audio_output_queue.empty():
                        try:
                            # Remove and discard queued audio chunks
                            self.stream_manager.audio_output_queue.get_nowait()
                        except asyncio.QueueEmpty:
                            # Queue is empty - we've cleared everything
                            break
                    
                    # Reset the barge-in flag and pause briefly before resuming
                    self.stream_manager.barge_in = False
                    await asyncio.sleep(0.05)  # 50ms pause for clean audio transition
                    continue
                
                # Wait for new audio data from Nova Sonic (with timeout to check barge-in regularly)
                audio_data = await asyncio.wait_for(
                    self.stream_manager.audio_output_queue.get(),
                    timeout=0.1  # 100ms timeout - check for barge-in 10 times per second
                )
                
                # If we got valid audio data and we're still streaming, play it
                if audio_data and self.is_streaming:
                    # CHUNKED PLAYBACK: Write audio in small chunks to maintain responsiveness
                    # This prevents blocking other async tasks during audio playback
                    chunk_size = CHUNK_SIZE  # 1024 samples = ~43ms at 24kHz
                    
                    # Split the received audio into smaller chunks for gradual playback
                    for i in range(0, len(audio_data), chunk_size):
                        # Check if streaming was stopped during playback
                        if not self.is_streaming:
                            break
                        
                        # Calculate chunk boundaries (handle partial chunks at the end)
                        end = min(i + chunk_size, len(audio_data))
                        chunk = audio_data[i:end]
                        
                        # THREAD BRIDGE: PyAudio's write() is blocking and synchronous
                        # Use run_in_executor to run it in a thread pool without blocking asyncio
                        def write_chunk(data):
                            return self.output_stream.write(data)
                        
                        # Execute the blocking write operation in a background thread
                        await asyncio.get_event_loop().run_in_executor(None, write_chunk, chunk)
                        
                        # Yield control briefly to allow other async tasks to run
                        # This maintains the real-time nature of the conversation
                        await asyncio.sleep(0.001)  # 1ms yield
                    
            except asyncio.TimeoutError:
                # No audio data available within timeout - this is normal
                # Continue looping to check for new audio or barge-in
                continue
            except Exception as e:
                # Handle unexpected errors during audio playback
                if self.is_streaming:
                    print(f"Error playing output audio: {str(e)}")
                    import traceback
                    traceback.print_exc()
                # Brief pause before retrying to avoid rapid error loops
                await asyncio.sleep(0.05)
    
    # initiates audio streaming session at the hardware level
    async def start_streaming(self):
        """
        Start the full-duplex audio streaming session.
        
        This method initiates both microphone capture and speaker output,
        establishes the audio content block with Nova Sonic, and waits
        for user input to end the session.
        
        The streaming continues until the user presses Enter, enabling
        natural voice conversation with the AI agent.
        """
        # Prevent multiple simultaneous streaming sessions
        if self.is_streaming:
            return
        
        # User-friendly status messages
        print("Starting audio streaming. Speak into your microphone...")
        print("Press Enter to stop streaming...")
        
        # PROTOCOL INITIALIZATION: Tell Nova Sonic we're starting audio input
        # This sends the audio content start event to establish the audio content block
        await time_it_async("send_audio_content_start_event", 
                           lambda: self.stream_manager.send_audio_content_start_event())
        
        # Enable streaming flag - this activates audio processing
        self.is_streaming = True
        
        # MICROPHONE ACTIVATION: Start capturing audio if not already active
        if not self.input_stream.is_active():
            self.input_stream.start_stream()  # Begin calling input_callback() for each chunk
        
        # BACKGROUND TASK: Start the audio playback task for AI voice responses
        self.output_task = asyncio.create_task(self.play_output_audio())
        
        # BLOCKING WAIT: Wait for user to press Enter to end the conversation
        # This runs in a background thread to avoid blocking the asyncio event loop
        await asyncio.get_event_loop().run_in_executor(None, input)
        
        # USER INITIATED STOP: Once Enter is pressed, gracefully stop streaming
        await self.stop_streaming()
    
    async def stop_streaming(self):
        """
        Gracefully stop audio streaming and clean up all resources.
        
        This method ensures proper shutdown of all audio components:
        - Stops microphone capture
        - Cancels background tasks
        - Closes audio streams
        - Ends the Nova Sonic session
        
        Called automatically when user presses Enter or when an error occurs.
        """
        # Prevent multiple stop attempts
        if not self.is_streaming:
            return
            
        # DISABLE STREAMING: Stop all audio processing immediately
        self.is_streaming = False

        # TASK CLEANUP: Cancel any running background tasks
        tasks = []
        
        # Check if input processing task exists and is still running
        if hasattr(self, 'input_task') and not self.input_task.done():
            tasks.append(self.input_task)
        
        # Check if output playback task exists and is still running    
        if hasattr(self, 'output_task') and not self.output_task.done():
            tasks.append(self.output_task)
        
        # Cancel all identified tasks
        for task in tasks:
            task.cancel()
            
        # Wait for all tasks to complete cancellation (ignore cancellation exceptions)
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
        
        # AUDIO STREAM CLEANUP: Properly close PyAudio streams
        
        # Stop and close microphone input stream
        if self.input_stream:
            if self.input_stream.is_active():
                self.input_stream.stop_stream()  # Stop capturing audio
            self.input_stream.close()            # Release microphone resources
            
        # Stop and close speaker output stream    
        if self.output_stream:
            if self.output_stream.is_active():
                self.output_stream.stop_stream()  # Stop audio playback
            self.output_stream.close()            # Release speaker resources
            
        # Terminate PyAudio system
        if self.p:
            self.p.terminate()  # Clean up PyAudio resources
        
        # PROTOCOL CLEANUP: Properly close the Nova Sonic session
        # This sends end events and closes the streaming connection
        await self.stream_manager.close()


async def main(debug=False):
    """Main function to run the application."""
    global DEBUG
    DEBUG = debug

    # Create stream manager
    stream_manager = BedrockStreamManager(model_id='amazon.nova-sonic-v1:0', region='us-east-1')

    # Create audio streamer
    audio_streamer = AudioStreamer(stream_manager)

    # Initialize the stream
    await time_it_async("initialize_stream", stream_manager.initialize_stream)

    try:
        # This will run until the user presses Enter
        await audio_streamer.start_streaming()
        
    except KeyboardInterrupt:
        print("Interrupted by user")
    finally:
        # Clean up
        await audio_streamer.stop_streaming()
        

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Car Insurance Claim Agent Demo')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    args = parser.parse_args()
    
    # Set your AWS credentials here or use environment variables
    # os.environ['AWS_ACCESS_KEY_ID'] = "AWS_ACCESS_KEY_ID"
    # os.environ['AWS_SECRET_ACCESS_KEY'] = "AWS_SECRET_ACCESS_KEY"
    # os.environ['AWS_DEFAULT_REGION'] = "us-east-1"

    # Run the main function
    try:
        asyncio.run(main(debug=args.debug))
    except Exception as e:
        print(f"Application error: {e}")
        if args.debug:
            import traceback
            traceback.print_exc()
