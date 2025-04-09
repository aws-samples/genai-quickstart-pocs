#This is a simple demo of taking the stock Nova Sonic demonstrator and adding tools and an agent flow to it.
#Adapted from the Nova Sonic started project.  

import datetime
import pytz
import os
import sys
import asyncio
import base64
import json
import uuid
import dateutil


# Add the parent directory to sys.path to make hotel_reservation_system importable
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from hotel_reservation_system.hotel_test_data_generator import HotelTestDataGenerator
from hotel_reservation_system.hotel_test_data_generator import RoomType

# Initialize hotel system with test data
hotel_system = HotelTestDataGenerator()
hotel_system.generate_future_reservations(num_guests=10)
import warnings
import pyaudio
import pytz
import queue
import datetime
import time
import inspect
from aws_sdk_bedrock_runtime.client import BedrockRuntimeClient, InvokeModelWithBidirectionalStreamOperationInput
from aws_sdk_bedrock_runtime.models import InvokeModelWithBidirectionalStreamInputChunk, BidirectionalInputPayloadPart
from aws_sdk_bedrock_runtime.config import Config, HTTPAuthSchemeResolver, SigV4AuthScheme
from smithy_aws_core.credentials_resolvers.environment import EnvironmentCredentialsResolver


# Suppress warnings
warnings.filterwarnings("ignore")

# Audio configuration
INPUT_SAMPLE_RATE = 16000
OUTPUT_SAMPLE_RATE = 24000
CHANNELS = 1
FORMAT = pyaudio.paInt16
CHUNK_SIZE = 1024  # Number of frames per buffer

# Debug mode flag
DEBUG = False

def debug_print(message):
    """Print only if debug mode is enabled"""
    if DEBUG:
        functionName = inspect.stack()[1].function
        if  functionName == 'time_it' or functionName == 'time_it_async':
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
    
    # Event templates
    START_SESSION_EVENT = '''{
        "event": {
            "sessionStart": {
            "inferenceConfiguration": {
                "maxTokens": 1024,
                "topP": 0.95,
                "temperature": 0.7
                }
            }
        }
    }'''

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

    AUDIO_EVENT_TEMPLATE = '''{
        "event": {
            "audioInput": {
            "promptName": "%s",
            "contentName": "%s",
            "content": "%s"
            }
        }
    }'''

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

    TEXT_INPUT_EVENT = '''{
        "event": {
            "textInput": {
            "promptName": "%s",
            "contentName": "%s",
            "content": "%s"
            }
        }
    }'''

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

    CONTENT_END_EVENT = '''{
        "event": {
            "contentEnd": {
            "promptName": "%s",
            "contentName": "%s"
            }
        }
    }'''

    PROMPT_END_EVENT = '''{
        "event": {
            "promptEnd": {
            "promptName": "%s"
            }
        }
    }'''

    SESSION_END_EVENT = '''{
        "event": {
            "sessionEnd": {}
        }
    }'''
    
    def start_prompt(self):
        """Create a promptStart event"""
        get_default_tool_schema = json.dumps({
            "type": "object",
            "properties": {},
            "required": []
        })

        get_guest_details_schema = json.dumps({
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
                "phone": {
                    "type": "string",
                    "description": "The phone number of the guest calling in"
                }
            },
            "required": ["phone"]
        })

        get_reservations_schema = json.dumps({
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
                "guest_id": {
                    "type": "string",
                    "description": "The guest_id of the guest that was retrived by looking the guest up by phone number",
                }
            },
            "required": ["guest_id"]
        })

        modify_reservation_schema = json.dumps({
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
                "reservation_id": {
                    "type": "string",
                    "description": "The guid reservation_id of a specific guest reservation",
                },
                "new_check_in_date": {
                    "type": "datetime",
                    "description": "The new check in date if the guest needs to change the check in date of the reservation. Set time portion to 12:00:00",
                    "format": "ISO Format example:2025-04-01T12:00:00.000000+00:00"
                },
                "new_check_out_date": {
                    "type": "datetime",
                    "description": "The new check out date if the guest needs to change the check out date of the reservation.",
                    "format": "ISO Format example:2025-04-01T12:00:00.000000+00:00"
                }
            },
            "required": ["reservation_id"]
        })

        check_room_availability_schema = json.dumps({
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "name of a city, verify there is a hotel in this city by listing out the available hotels.",
                },
                "check_in_date": {
                    "type": "datetime",
                    "description": "The new check in date if the guest needs to change the check in date of the reservation.",
                    "format": "ISO Format example:2025-04-01T12:00:00.000000+00:00"
                },
                "check_out_date": {
                    "type": "datetime",
                    "description": "The new check out date if the guest needs to change the check out date of the reservation.",\
                    "format": "ISO Format example:2025-04-01T12:00:00.000000+00:00"
                },
                "room_type": {
                    "type": "RoomType",
                    "description": "Type of room the guest would like to reserve. ",
                    "default": None
                }
            },
            "required": ["city","check_in_date","check_out_date"]
        })

        create_reservation_schema = json.dumps({
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
                "guest_id": {
                    "type": "string",
                    "description": "The guid guest_id of the guest",
                },
                "check_in_date": {
                    "type": "datetime",
                    "description": "The new check in date if the guest needs to change the check in date of the reservation. Set time portion to 12:00:00",
                    "format": "ISO Format example:2025-04-01T12:00:00.000000+00:00"
                },
                "check_out_date": {
                    "type": "datetime",
                    "description": "The new check out date if the guest needs to change the check out date of the reservation.",
                    "format": "ISO Format example:2025-04-01T12:00:00.000000+00:00"
                },
                "room_type": {
                    "type": "string",
                    "description": "Type of room the guest would like to reserve. Values are one of [Standard, Deluxe, Suite, Presidential]",
                    "default": "Standard"
                },
                "city": {
                    "type": "string",
                    "description": "City for the reservation"
                }
            },
            "required": ["guest_id, city, room_type, check_in_date, check_out_date"]
        })

        cancel_reservation_schema = json.dumps({
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
                "reservation_id": {
                    "type": "string",
                    "description": "The guid reservation_id of a specific guest reservation",
                }
            },
            "required": ["reservation_id"]
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
                                    "name": "getGuestDetails",
                                    "description": "get information about the guest calling in, using the phone number as lookup",
                                    "inputSchema": {
                                        "json": get_guest_details_schema
                                    }
                                }
                            },
                            {
                                "toolSpec": {
                                    "name": "getGuestReservations",
                                    "description": "get reservations for a guest using the guest_id",
                                    "inputSchema": {
                                        "json": get_reservations_schema
                                    }
                                }
                            },
                            {
                                "toolSpec": {
                                    "name": "modifyGuestReservation",
                                    "description": "modify the dates of an existing reservation using the reservation_id of a specific guest reservation. must change at least one of the dates associated with the reservation",
                                    "inputSchema": {
                                        "json": modify_reservation_schema
                                    }
                                }
                            },
                            {
                                "toolSpec": {
                                    "name": "cancelGuestReservation",
                                    "description": "cancel an existing reservation using the reservation_id of a specific guest reservation",
                                    "inputSchema": {
                                        "json": cancel_reservation_schema
                                    }
                                }
                            },
                            {
                                "toolSpec": {
                                    "name": "listAvailableHotels",
                                    "description": "list all available hotels, the output will give you the name of the hotel and city it is in",
                                    "inputSchema": {
                                        "json": get_default_tool_schema
                                    }
                                }
                            },
                            {
                                "toolSpec": {
                                    "name": "createGuestReservation",
                                    "description": "Create a new reservation for the guest",
                                    "inputSchema": {
                                        "json": create_reservation_schema
                                    }
                                }
                            },
                            {
                                "toolSpec": {
                                    "name": "listAvailableRooms",
                                    "description": "Given a hotel city, a check in date, a check out date, and an optional room type, this will list out any rooms that are availble.",
                                    "inputSchema": {
                                        "json": check_room_availability_schema
                                    }
                                }
                            }

                        ]
                    }
                }
            }
        }
        
        return json.dumps(prompt_start_event)
    
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

        """
        The following is initial setup for a simulated call.  The hotel system generated several guests
        """
        print("These are the known guests for this simulation, please choose one by entering corresponding number")

        guest_list = list(hotel_system.get_all_guests().values())
        for i in range(1, len(guest_list)):
            print("{}> {}".format(i, guest_list[i].name))

        choice = input("?>")
        self.whoami = guest_list[int(choice)]
        print("You have chosen {} {}".format(self.whoami.name, self.whoami.phone))
        print("this guest current has the following reservation:")
        #Assuming only one now.. //TODO make this list aware
        reservation = hotel_system.get_guest_reservations(self.whoami.guest_id)[0]

        print("hotel: {}\nroom_type:{}\ndate:{}\nprice:{}".format(reservation.hotel_name, 
                                                   reservation.room.room_type,
                                                   reservation.check_in,
                                                   reservation.total_cost ))
        

        print("")
        print("Your call with the representative will start as soon as you say.")
        print("")
        print("Answer the phone")
        print("")


        """Initialize the stream manager."""
        self.model_id = model_id
        self.region = region
        
        # Replace RxPy subjects with asyncio queues
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
    
    async def initialize_stream(self):
        """Initialize the bidirectional stream with Bedrock."""
        if not self.bedrock_client:
            self._initialize_client()
        
        try:
            self.stream_response = await time_it_async("invoke_model_with_bidirectional_stream", lambda : self.bedrock_client.invoke_model_with_bidirectional_stream( InvokeModelWithBidirectionalStreamOperationInput(model_id=self.model_id)))
            self.is_active = True

            #Multi line for convenience, but it doesn't like newlines, so be sure 
            #to replace with spaces as a last step.
            default_system_prompt = """
            You are a friendly hotel reservations assistant named Adam Smith answering the phone for AnyCompany Hotels. You will engage in a spoken dialog exchanging the transcripts of a natural real-time conversation.
            Address the guest by name, thank them for calling AnyCompany Hotels, and if they have an existing reservation ask them if they are calling about that reservation.
            Make sure you get the current date so that you can assume current year if the guest only gives a partial date.
            Keep your responses short, generally two or three sentences for chatty scenarios.  
            When responding to the guest, make sure to only give back information that the guest would care about.
            When prompted with 'Answer the phone', assume you are answering a new call from a guest at phone number {}, introduce your self as Adam Smith, 
            Retrieve the name of the guest using the phone number and available tools.
            """.format(self.whoami.phone).replace('\n', ' ')


            print("System prompt is: {}".format(default_system_prompt))

            # Send initialization events
            prompt_event = self.start_prompt()
            text_content_start = self.TEXT_CONTENT_START_EVENT % (self.prompt_name, self.content_name, "SYSTEM")
            text_content = self.TEXT_INPUT_EVENT % (self.prompt_name, self.content_name, default_system_prompt)
            text_content_end = self.CONTENT_END_EVENT % (self.prompt_name, self.content_name)
            
            init_events = [self.START_SESSION_EVENT, prompt_event, text_content_start, text_content, text_content_end]
            
            for event in init_events:
                await self.send_raw_event(event)
                # Small delay between init events
                await asyncio.sleep(0.1)
            
            # Start listening for responses
            self.response_task = asyncio.create_task(self._process_responses())
            
            # Start processing audio input
            asyncio.create_task(self._process_audio_input())
            
            # Wait a bit to ensure everything is set up
            await asyncio.sleep(0.1)
            
            debug_print("Stream initialized successfully")
            return self
        except Exception as e:
            self.is_active = False
            print(f"Failed to initialize stream: {str(e)}")
            raise
    
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
            # For debugging large events, you might want to log just the type
            if DEBUG:
                if len(event_json) > 200:
                    event_type = list(json.loads(event_json).get("event", {}).keys())
                    if "audioInput" in event_type:
                        #TODO: These are so noisy.. need a different level of debug for them.
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
    
    async def send_audio_content_start_event(self):
        """Send a content start event to the Bedrock stream."""
        content_start_event = self.CONTENT_START_EVENT % (self.prompt_name, self.audio_content_name)
        await self.send_raw_event(content_start_event)
    
    async def _process_audio_input(self):
        """Process audio input from the queue and send to Bedrock."""
        while self.is_active:
            try:
                # Get audio data from the queue
                data = await self.audio_input_queue.get()
                
                audio_bytes = data.get('audio_bytes')
                if not audio_bytes:
                    debug_print("No audio bytes received")
                    continue
                
                # Base64 encode the audio data
                blob = base64.b64encode(audio_bytes)
                audio_event = self.AUDIO_EVENT_TEMPLATE % (
                    self.prompt_name, 
                    self.audio_content_name, 
                    blob.decode('utf-8')
                )
                
                # Send the event
                await self.send_raw_event(audio_event)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                debug_print(f"Error processing audio: {e}")
                if DEBUG:
                    import traceback
                    traceback.print_exc()
    
    def add_audio_chunk(self, audio_bytes):
        """Add an audio chunk to the queue."""
        self.audio_input_queue.put_nowait({
            'audio_bytes': audio_bytes,
            'prompt_name': self.prompt_name,
            'content_name': self.audio_content_name
        })
    
    async def send_audio_content_end_event(self):
        """Send a content end event to the Bedrock stream."""
        if not self.is_active:
            debug_print("Stream is not active")
            return
        
        content_end_event = self.CONTENT_END_EVENT % (self.prompt_name, self.audio_content_name)
        await self.send_raw_event(content_end_event)
        debug_print("Audio ended")
    
    async def send_tool_start_event(self, content_name):
        """Send a tool content start event to the Bedrock stream."""
        content_start_event = self.TOOL_CONTENT_START_EVENT % (self.prompt_name, content_name, self.toolUseId)
        debug_print(f"Sending tool start event: {content_start_event}")  
        await self.send_raw_event(content_start_event)

    async def send_tool_result_event(self, content_name, tool_result):
        """Send a tool content event to the Bedrock stream."""
        # Use the actual tool result from processToolUse
        tool_result_event = self.tool_result_event(content_name=content_name, content=tool_result, role="TOOL")
        debug_print(f"Sending tool result event: {tool_result_event}")
        await self.send_raw_event(tool_result_event)
    
    async def send_tool_content_end_event(self, content_name):
        """Send a tool content end event to the Bedrock stream."""
        tool_content_end_event = self.CONTENT_END_EVENT % (self.prompt_name, content_name)
        debug_print(f"Sending tool content event: {tool_content_end_event}")
        await self.send_raw_event(tool_content_end_event)
    
    async def send_prompt_end_event(self):
        """Close the stream and clean up resources."""
        if not self.is_active:
            debug_print("Stream is not active")
            return
        
        prompt_end_event = self.PROMPT_END_EVENT % (self.prompt_name)
        await self.send_raw_event(prompt_end_event)
        debug_print("Prompt ended")
        
    async def send_session_end_event(self):
        """Send a session end event to the Bedrock stream."""
        if not self.is_active:
            debug_print("Stream is not active")
            return

        await self.send_raw_event(self.SESSION_END_EVENT)
        self.is_active = False
        debug_print("Session ended")
    
    async def _process_responses(self):
        """Process incoming responses from Bedrock."""
        try:            
            while self.is_active:
                try:
                    output = await self.stream_response.await_output()
                    result = await output[1].receive()
                    if result.value and result.value.bytes_:
                        try:
                            response_data = result.value.bytes_.decode('utf-8')
                            json_data = json.loads(response_data)
                            
                            # Handle different response types
                            if 'event' in json_data:
                                if 'contentStart' in json_data['event']:
                                    debug_print("Content start detected")
                                    content_start = json_data['event']['contentStart']
                                    # set role
                                    # self.role = content_start['role']
                                    # Check for speculative content
                                    if 'additionalModelFields' in content_start:
                                        try:
                                            additional_fields = json.loads(content_start['additionalModelFields'])
                                            if additional_fields.get('generationStage') == 'SPECULATIVE':
                                                debug_print("Speculative content detected")
                                                self.display_assistant_text = True
                                            else:
                                                self.display_assistant_text = False
                                        except json.JSONDecodeError:
                                            debug_print("Error parsing additionalModelFields")
                                elif 'textOutput' in json_data['event']:
                                    text_content = json_data['event']['textOutput']['content']
                                    role = json_data['event']['textOutput']['role']
                                    # Check if there is a barge-in
                                    if '{ "interrupted" : true }' in text_content:
                                        if DEBUG:
                                            print("Barge-in detected. Stopping audio output.")
                                        self.barge_in = True

                                    if (role == "ASSISTANT" and self.display_assistant_text):
                                        print(f"Assistant: {text_content}")
                                    elif (role == "USER"):
                                        print(f"User: {text_content}")

                                elif 'audioOutput' in json_data['event']:
                                    audio_content = json_data['event']['audioOutput']['content']
                                    audio_bytes = base64.b64decode(audio_content)
                                    await self.audio_output_queue.put(audio_bytes)
                                elif 'toolUse' in json_data['event']:
                                    self.toolUseContent = json_data['event']['toolUse']
                                    self.toolName = json_data['event']['toolUse']['toolName']
                                    self.toolUseId = json_data['event']['toolUse']['toolUseId']
                                    debug_print(f"Tool use detected: {self.toolName}, ID: {self.toolUseId}")
                                elif 'contentEnd' in json_data['event'] and json_data['event'].get('contentEnd', {}).get('type') == 'TOOL':
                                    debug_print("Processing tool use and sending result")
                                    toolResult = await self.processToolUse(self.toolName, self.toolUseContent)
                                    toolContent = str(uuid.uuid4())
                                    await self.send_tool_start_event(toolContent)
                                    await self.send_tool_result_event(toolContent, toolResult)
                                    await self.send_tool_content_end_event(toolContent)
                            
                            # Put the response in the output queue for other components
                            await self.output_queue.put(json_data)
                        except json.JSONDecodeError:
                            await self.output_queue.put({"raw_data": response_data})
                except StopAsyncIteration:
                    # Stream has ended
                    break
                except Exception as e:
                   # Handle ValidationException properly
                    if "ValidationException" in str(e):
                        error_message = str(e)
                        print(f"Validation error: {error_message}")
                    else:
                        print(f"Error receiving response: {e}")
                    break
                    
        except Exception as e:
            print(f"Response processing error: {e}")
        finally:
            self.is_active = False

    async def processToolUse(self, toolName, toolUseContent):
        """Return the tool result"""

        #NOTE: toolName is convereted to lower case here, keep in mind as you add below.
        tool = toolName.lower()
        debug_print(f"Tool Use Content: {toolUseContent}")

        if tool == "gettimetool":
            this_timezone = pytz.timezone("America/New_York")
            pst_time = datetime.datetime.now(this_timezone)
            return {
                "timezone": str(this_timezone),
                "formattedTime": pst_time.strftime("%I:%M %p")  # Format as hour:minute AM/PM
            }
        
        elif tool == "getdatetool":
            # Get current date in PST timezone
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
        elif tool == "getguestdetails":
            #Get phone number from context
            #content has {"phone":5555551238} 
            phone = json.loads(toolUseContent.get("content")).get("phone", 0)
            print("In getguestdetails!")
            print("toolUseContent: {}, type:{}".format(toolUseContent, type(toolUseContent) ))
            #print("phone: {} type:{}".format(phone, type(phone)))

            user_info = hotel_system.search_by_phone(phone)
            print("Returning JSON version {}".format(user_info.toJSON()))
            return user_info.toJSON()
        
        elif tool == "getguestreservations":
            #Get reservations for this guest
            print("In getguestreservations!")
            print("toolUseContent: {}, type:{}".format(toolUseContent, type(toolUseContent) ))
            guest_id = json.loads(toolUseContent.get("content")).get("guest_id", "")
            reservations = hotel_system.get_guest_reservations(guest_id)
            if reservations:
                print("Found {} Reservations!".format(len(reservations)))
            reservationlist_json = [reservation.toJSON() for reservation in reservations]
            return({"reservations": reservationlist_json})
        
        
        elif tool == "cancelguestreservation":
            print("In cancelguestreservations!")
            print("toolUseContent: {}, type:{}".format(toolUseContent, type(toolUseContent) ))
            reservation_id = json.loads(toolUseContent.get("content")).get("reservation_id", "")

            cancelled = hotel_system.cancel_reservation(reservation_id=reservation_id)
            if cancelled:
                return {"message": "Reservation successfully cancelled"}
            else:
                return {"message": "Reservation could not be cancelled"}


        elif tool == "modifyguestreservation":
            print("In ModifyGuestReservation!")
            print("toolUseContent: {}, type:{}".format(toolUseContent, type(toolUseContent) ))
            toolContent = json.loads(toolUseContent.get("content"))
            new_check_in_date = None
            new_check_out_date = None
            have_changed_date = False
            #Date looks like this "new_check_out_date":"2025-06-10T16:04:12.830149"
            if "reservation_id" not in toolContent:
                return {"message": "reservation_id is needed to look up and modify a reservation"}
            if "new_check_in_date" in toolContent:
                new_check_in_date = dateutil.parser.parse(toolContent["new_check_in_date"])
                have_changed_date = True
            if "new_check_out_date" in toolContent:
                new_check_out_date = dateutil.parser.parse(toolContent["new_check_out_date"])
                have_changed_date = True

            if not have_changed_date:
                return {"message": "to change a reserveration you must change at least one of the dates for the reservation"}
            
            #print(f"Calling modify_reservation check_in:{new_check_in_date} check_out:{new_check_out_date}")
            reservation = hotel_system.modify_reservation(toolContent["reservation_id"],new_check_in=new_check_in_date, new_check_out=new_check_out_date)
            print(f"Reservation Updated: {reservation.toJSON()}")

            return reservation.toJSON()
        
        elif tool == "listavailablerooms":
            print("In ListAvailableRooms!")
            print("toolUseContent: {}, type:{}".format(toolUseContent, type(toolUseContent) ))
            toolContent = json.loads(toolUseContent.get("content"))
            city = None
            check_in_date = None
            check_out_date = None
            room_type = None
            #Date looks like this which should be iso"check_out_date":"2025-06-06T12:00:00"
            if "city" in toolContent:
                city = toolContent["city"]
            else:
                return {"message": "city is needed to find availability. Please ask for a valid city and try again"}
            if "check_in_date" in toolContent:
                check_in_date = dateutil.parser.isoparse(toolContent["check_in_date"])
            else:
                return {"message": "a starting check in date is needed to find availability. Please ask for a valid check in and try again"}
            if "check_out_date" in toolContent:
                check_out_date = dateutil.parser.isoparse(toolContent["check_out_date"])
            else:
                return {"message": "an ending check out date is needed to find availability. Please ask for a valid check out date and try again"}
            if "room_type" in toolContent:
                room_type = toolContent["room_type"]

            #print(f"Calling get room availability city:{city} room_type:{room_type} check_in:{check_in_date} check_out:{check_out_date}")
            available_rooms =  hotel_system.get_available_rooms_by_city_and_date(city=city,room_type=room_type,check_in=check_in_date, check_out=check_out_date)
            # print("Back from get rooms! {}".format(roomlist))
            roomlist_json = [room.toJSON() for room in available_rooms]
            return({"rooms": roomlist_json  })
        
        elif tool == "createguestreservation":
            print("In createGuestReservation!")
            print("toolUseContent: {}, type:{}".format(toolUseContent, type(toolUseContent) ))
            toolContent = json.loads(toolUseContent.get("content"))
            guest_id = toolContent.get("guest_id", None)
            city = toolContent.get("city", None)
            room_type = toolContent.get("room_type", None)
            check_in_date = toolContent.get("check_in_date", None)
            check_out_date = toolContent.get("check_out_date", None)
            
            #Date looks like this which should be iso"check_out_date":"2025-06-06T12:00:00"
            if not guest_id:
                return {"message": "guest_id is needed to create a reservation"}
            if not city:
                return {"message": "guest_id is needed to create a reservation"}
            if room_type:
                room_type = RoomType.fromString(room_type)
            else:
                return {"message": "room type is neeed to create a reservation"}
            if check_in_date:
                check_in_date = dateutil.parser.parse(check_in_date)
            else:
                return {"message": "Please get the check in date from the guest"}
            if check_out_date:
                check_out_date = dateutil.parser.parse(check_out_date)
            else:
                return {"message": "Please get the check in date from the guest"}

            #Need to get a guest object
            guest = hotel_system.get_guest(guest_id=guest_id)
            reservation = hotel_system.create_reservation(guest=guest, city=city, room_type=room_type,check_in=check_in_date, check_out=check_out_date)
            
            print(f"Reservation Created: {reservation.toJSON()}")
            return {"reservation": reservation.toJSON(),
                    "message": "When describing the reservation to the guest, only mention the items the guest needs to know, such as the city, check in date, check out date, room type, and rate."}
         

        
        return {"message":"No tool found to accomplish the task, ask for clarification from the guest"}
        
    
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
    """Handles continuous microphone input and audio output using separate streams."""
    
    def __init__(self, stream_manager):
        self.stream_manager = stream_manager
        self.is_streaming = False
        self.loop = asyncio.get_event_loop()

        # Initialize PyAudio
        debug_print("AudioStreamer Initializing PyAudio...")
        self.p = time_it("AudioStreamerInitPyAudio", pyaudio.PyAudio)
        debug_print("AudioStreamer PyAudio initialized")

        # Initialize separate streams for input and output
        # Input stream with callback for microphone
        debug_print("Opening input audio stream...")
        self.input_stream = time_it("AudioStreamerOpenAudio", lambda  : self.p.open(
            format=FORMAT,
            channels=CHANNELS,
            rate=INPUT_SAMPLE_RATE,
            input=True,
            frames_per_buffer=CHUNK_SIZE,
            stream_callback=self.input_callback
        ))
        debug_print("input audio stream opened")

        # Output stream for direct writing (no callback)
        debug_print("Opening output audio stream...")
        self.output_stream = time_it("AudioStreamerOpenAudio", lambda  : self.p.open(
            format=FORMAT,
            channels=CHANNELS,
            rate=OUTPUT_SAMPLE_RATE,
            output=True,
            frames_per_buffer=CHUNK_SIZE
        ))

        debug_print("output audio stream opened")

    def input_callback(self, in_data, frame_count, time_info, status):
        """Callback function that schedules audio processing in the asyncio event loop"""
        if self.is_streaming and in_data:
            # Schedule the task in the event loop
            asyncio.run_coroutine_threadsafe(
                self.process_input_audio(in_data), 
                self.loop
            )
        return (None, pyaudio.paContinue)

    async def process_input_audio(self, audio_data):
        """Process a single audio chunk directly"""
        try:
            # Send audio to Bedrock immediately
            self.stream_manager.add_audio_chunk(audio_data)
        except Exception as e:
            if self.is_streaming:
                print(f"Error processing input audio: {e}")
    
    async def play_output_audio(self):
        """Play audio responses from Nova Sonic"""
        while self.is_streaming:
            try:
                # Check for barge-in flag
                if self.stream_manager.barge_in:
                    # Clear the audio queue
                    while not self.stream_manager.audio_output_queue.empty():
                        try:
                            self.stream_manager.audio_output_queue.get_nowait()
                        except asyncio.QueueEmpty:
                            break
                    self.stream_manager.barge_in = False
                    # Small sleep after clearing
                    await asyncio.sleep(0.05)
                    continue
                
                # Get audio data from the stream manager's queue
                audio_data = await asyncio.wait_for(
                    self.stream_manager.audio_output_queue.get(),
                    timeout=0.1
                )
                
                if audio_data and self.is_streaming:
                    # Write directly to the output stream in smaller chunks
                    chunk_size = CHUNK_SIZE  # Use the same chunk size as the stream
                    
                    # Write the audio data in chunks to avoid blocking too long
                    for i in range(0, len(audio_data), chunk_size):
                        if not self.is_streaming:
                            break
                        
                        end = min(i + chunk_size, len(audio_data))
                        chunk = audio_data[i:end]
                        
                        # Create a new function that captures the chunk by value
                        def write_chunk(data):
                            return self.output_stream.write(data)
                        
                        # Pass the chunk to the function
                        await asyncio.get_event_loop().run_in_executor(None, write_chunk, chunk)
                        
                        # Brief yield to allow other tasks to run
                        await asyncio.sleep(0.001)
                    
            except asyncio.TimeoutError:
                # No data available within timeout, just continue
                continue
            except Exception as e:
                if self.is_streaming:
                    print(f"Error playing output audio: {str(e)}")
                    import traceback
                    traceback.print_exc()
                await asyncio.sleep(0.05)
    
    async def start_streaming(self):
        """Start streaming audio."""
        if self.is_streaming:
            return
        
        print("Starting audio streaming. Speak into your microphone...")
        print("Press Enter to stop streaming...")
        
        # Send audio content start event
        await time_it_async("send_audio_content_start_event", lambda : self.stream_manager.send_audio_content_start_event())
        
        self.is_streaming = True
        
        # Start the input stream if not already started
        if not self.input_stream.is_active():
            self.input_stream.start_stream()
        
        # Start processing tasks
        #self.input_task = asyncio.create_task(self.process_input_audio())
        self.output_task = asyncio.create_task(self.play_output_audio())
        
        # Wait for user to press Enter to stop
        await asyncio.get_event_loop().run_in_executor(None, input)
        
        # Once input() returns, stop streaming
        await self.stop_streaming()
    
    async def stop_streaming(self):
        """Stop streaming audio."""
        if not self.is_streaming:
            return
            
        self.is_streaming = False

        # Cancel the tasks
        tasks = []
        if hasattr(self, 'input_task') and not self.input_task.done():
            tasks.append(self.input_task)
        if hasattr(self, 'output_task') and not self.output_task.done():
            tasks.append(self.output_task)
        for task in tasks:
            task.cancel()
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
        # Stop and close the streams
        if self.input_stream:
            if self.input_stream.is_active():
                self.input_stream.stop_stream()
            self.input_stream.close()
        if self.output_stream:
            if self.output_stream.is_active():
                self.output_stream.stop_stream()
            self.output_stream.close()
        if self.p:
            self.p.terminate()
        
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
    
    parser = argparse.ArgumentParser(description='Nova Sonic Python Streaming')
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
