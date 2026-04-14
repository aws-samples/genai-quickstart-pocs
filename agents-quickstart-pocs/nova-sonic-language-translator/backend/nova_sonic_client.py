"""
Nova 2 Sonic Client for Speech-to-Speech Translation

This module implements the bidirectional streaming API for Amazon Nova 2 Sonic
to enable real-time speech translation between English and Spanish.
Uses aws_sdk_bedrock_runtime for proper async bidirectional streaming.
"""

import asyncio
import base64
import json
import uuid
import time
import traceback
import logging

from typing import Callable, Optional
from dataclasses import dataclass, field

from aws_sdk_bedrock_runtime.client import BedrockRuntimeClient, InvokeModelWithBidirectionalStreamOperationInput
from aws_sdk_bedrock_runtime.models import InvokeModelWithBidirectionalStreamInputChunk, BidirectionalInputPayloadPart
from aws_sdk_bedrock_runtime.config import Config, HTTPAuthSchemeResolver, SigV4AuthScheme
from smithy_aws_core.identity import EnvironmentCredentialsResolver

from config import AWS_REGION, NOVA_SONIC_MODEL_ID, INPUT_SAMPLE_RATE, OUTPUT_SAMPLE_RATE
from tool_processor import ToolProcessor

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)
@dataclass
class SessionMetrics:
    """Metrics for a translation session."""
    session_start_time: float = 0.0
    audio_chunks_received: int = 0
    audio_bytes_received: int = 0
    audio_chunks_sent: int = 0
    audio_bytes_sent: int = 0
    transcriptions_count: int = 0
    translations_count: int = 0
    latencies: list = field(default_factory=list)
    last_audio_input_time: float = 0.0
    
    def get_average_latency(self) -> float:
        if not self.latencies:
            return 0.0
        return sum(self.latencies) / len(self.latencies)
    
    def get_session_duration(self) -> float:
        if self.session_start_time == 0:
            return 0.0
        return time.time() - self.session_start_time
    
    def to_dict(self) -> dict:
        return {
            'sessionDuration': round(self.get_session_duration(), 2),
            'audioChunksReceived': self.audio_chunks_received,
            'audioBytesReceived': self.audio_bytes_received,
            'audioChunksSent': self.audio_chunks_sent,
            'audioBytesSent': self.audio_bytes_sent,
            'transcriptionsCount': self.transcriptions_count,
            'translationsCount': self.translations_count,
            'averageLatency': round(self.get_average_latency() * 1000, 2),  # ms
            'lastLatency': round(self.latencies[-1] * 1000, 2) if self.latencies else 0,  # ms
        }


class NovaSonicTranslator:
    """
    Nova 2 Sonic client for real-time speech-to-speech translation.
    """
    
    def __init__(
        self,
        source_language: str = 'auto',
        target_language: str = 'en-US',
        on_audio_output: Optional[Callable[[bytes], None]] = None,
        on_transcript: Optional[Callable[[str, str], None]] = None,
        on_error: Optional[Callable[[Exception], None]] = None,
        on_metrics: Optional[Callable[['SessionMetrics'], None]] = None,
        on_language_detected: Optional[Callable[[str], None]] = None,
        tools_enabled: bool = True
        ):
        self.source_language = source_language
        self.target_language = target_language
        self.on_audio_output = on_audio_output
        self.on_transcript = on_transcript
        self.on_error = on_error
        self.on_metrics = on_metrics
        self.on_language_detected = on_language_detected
        self.detected_language = None
        self.barge_in = False
        
        # Tool calling support
        self.tools_enabled = tools_enabled
        self.tool_processor = None
        if self.tools_enabled:
            try:
                self.tool_processor = ToolProcessor()
                logger.info("ToolProcessor initialized successfully")
            except Exception as e:
                logger.critical(f"Failed to initialize ToolProcessor: {e}", exc_info=True)
                self.tools_enabled = False
        
        self.model_id = NOVA_SONIC_MODEL_ID
        self.region = AWS_REGION
        self.client = None
        self.stream = None
        self.is_active = False
        self.response_task = None
        
        # Unique identifiers for this session
        self.prompt_name = str(uuid.uuid4())
        self.content_name = str(uuid.uuid4())
        self.audio_content_name = str(uuid.uuid4())
        
        # Audio queue for output
        self.audio_queue = asyncio.Queue()
        
        # Current role for transcript attribution
        self.role = 'USER'
        self.display_assistant_text = False
        
        # Pending tool call info (stored until contentEnd)
        self.pending_tool_name = None
        self.pending_tool_use_id = None
        self.pending_tool_input = None
        
        # Session metrics
        self.metrics = SessionMetrics()
        
        logger.info(f"NovaSonicTranslator initialized: {self.source_language} -> {self.target_language}")
        logger.info(f"Model ID: {self.model_id}, Region: {self.region}")
        logger.info(f"Tools enabled: {self.tools_enabled}")
    
    def _initialize_client(self):
        """Initialize the Bedrock Runtime client."""
        logger.info("Initializing Bedrock Runtime client...")
        try:
            # Use EnvironmentCredentialsResolver which supports:
            # 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
            # 2. Container credentials (ECS_CONTAINER_CREDENTIALS_RELATIVE_URI)
            # 3. Instance metadata service (for EC2/App Runner IAM roles)
            config = Config(
                endpoint_uri=f"https://bedrock-runtime.{self.region}.amazonaws.com",
                region=self.region,
                aws_credentials_identity_resolver=EnvironmentCredentialsResolver(),
                auth_scheme_resolver=HTTPAuthSchemeResolver(),
                auth_schemes={"aws.auth#sigv4": SigV4AuthScheme(service="bedrock")}
            )
            self.client = BedrockRuntimeClient(config=config)
            logger.info("Bedrock Runtime client initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing client: {e}", exc_info=True)
            raise
    
    def _get_voice_id(self) -> str:
        """
        Get voice ID for target language.
        Uses language-specific voice for non-English targets to give Nova Sonic
        a strong signal about the output language. Falls back to polyglot for English.
        """
        from config import get_voice_id
        
        # For non-English targets, use the language-specific voice
        # (e.g., 'pedro' for es-US) so Nova Sonic outputs in that language
        if not self.target_language.startswith('en'):
            return get_voice_id(self.target_language)
        
        # For English targets, use polyglot voice
        return get_voice_id(self.target_language)
    
    def _build_system_prompt(self) -> str:
        """
        Build language-agnostic system prompt.
        Instructs to detect any language and translate to target only.
        """
        from config import get_language_config
        
        target_lang_name = get_language_config(self.target_language)['name']
        
        # CRITICAL: Must explicitly instruct to respond in target language
        prompt = f"""You are a TRANSLATION MACHINE. You are NOT a conversational AI assistant.

YOUR ONLY JOB: Translate spoken words into {target_lang_name}.

CRITICAL LANGUAGE RULE:
Please respond exclusively in {target_lang_name}. If you have a question or suggestion, ask it in {target_lang_name}. I want to ensure that our communication remains in {target_lang_name}.

CRITICAL NUMBER HANDLING RULE:
When you hear numbers spoken (one, two, three, hundred, thousand, etc.), you MUST preserve them as DIGITS in your translation.
- Input: "one hundred" → Output: "100" (NOT "cien" or "cent")
- Input: "twenty-five" → Output: "25" (NOT "veinticinco" or "vingt-cinq")
- Input: "three thousand" → Output: "3000" (NOT "tres mil" or "trois mille")
- Input: "I have 5 apples" → Output: "Tengo 5 manzanas" (keep the digit 5)
ALWAYS use digits (0-9) for numbers, NEVER translate numbers into words.

CRITICAL CONTENT MODERATION RULES:
1. If you detect profanity, hate speech, threats, or highly inappropriate content, DO NOT translate it
2. Instead, respond in {target_lang_name} with: "[Content filtered - inappropriate language detected]"
3. For borderline cases (mild profanity in casual context), use your judgment but err on the side of caution
4. NEVER refuse to translate professional, medical, legal, or educational content even if sensitive
5. Context matters: medical terms, anatomical language, and professional discussions should be translated normally

CRITICAL RULES - FOLLOW EXACTLY:
1. When you hear speech in ANY language, translate it word-for-word into {target_lang_name}
2. NEVER respond to questions - translate the question itself
3. NEVER answer requests - translate the request itself  
4. NEVER engage in conversation - only translate
5. NEVER say things like "I can only translate" or "Please provide text" - just translate what you hear
6. ALWAYS speak your output in {target_lang_name}
7. ALWAYS preserve numbers as digits, never as words
8. FILTER inappropriate content as described above

EXAMPLES OF CORRECT BEHAVIOR:
- Input (English): "I need 100 dollars"
- CORRECT Output ({target_lang_name}): [Translation with "100" as digits, e.g., "Necesito 100 dólares"]
- WRONG Output: "Necesito cien dólares"

- Input (German): "Wie geht es Ihnen?"
- CORRECT Output ({target_lang_name}): [Translation of "How are you?" spoken in {target_lang_name}]
- WRONG Output: "I can only translate text that you provide"

- Input (English): "What is your name?"
- CORRECT Output ({target_lang_name}): [Translation of "What is your name?" spoken in {target_lang_name}]
- WRONG Output: "My name is..."

- Input (French): "J'ai 25 ans"
- CORRECT Output ({target_lang_name}): [Translation with "25" as digits, e.g., "I am 25 years old"]
- WRONG Output: "I am twenty-five years old"

- Input (English): "[Highly offensive content]"
- CORRECT Output ({target_lang_name}): "[Content filtered - inappropriate language detected]"
- WRONG Output: [Translation of offensive content]

YOU ARE A PIPE: Speech in any language → {target_lang_name} translation spoken in {target_lang_name}
NEVER break character. NEVER respond conversationally. ONLY translate. ALWAYS speak in {target_lang_name}. ALWAYS use digits for numbers. FILTER inappropriate content."""
        
        # Add tool instructions if enabled
        if self.tools_enabled:
            tool_instructions = """

CRITICAL ACRONYM HANDLING RULES:
When you encounter financial or mortgage terms (PMI, ARM, LTV, DTI, APR, HELOC, FHA, VA, Jumbo Loan, etc.):

1. STOP and call should_translate_acronym tool with the term
2. WAIT for the tool response
3. Follow the tool's decision EXACTLY:
   - If should_translate = FALSE: Keep the EXACT English term in your Spanish translation
   - If should_translate = TRUE: Translate the term to Spanish

EXAMPLES:
- Input: "Do you have a jumbo loan?"
- Tool says: should_translate=false for "jumbo loan"
- CORRECT output: "¿Tienes un jumbo loan?" (keep "jumbo loan" in English)
- WRONG output: "¿Tienes un préstamo jumbo?" (do NOT translate it)

- Input: "What's your DTI?"
- Tool says: should_translate=false for "DTI"
- CORRECT output: "¿Cuál es tu DTI?" (keep "DTI" in English)
- WRONG output: "¿Cuál es tu relación deuda-ingreso?" (do NOT translate it)

The tool tells you whether to preserve the English term or translate it. ALWAYS follow the tool's decision."""
            
            prompt += tool_instructions
        
        return prompt
    
    async def send_event(self, event_json: str):
        """Send an event to the bidirectional stream."""
        if not self.stream:
            logger.warning("Stream not initialized")
            return
        
        try:
            event = InvokeModelWithBidirectionalStreamInputChunk(
                value=BidirectionalInputPayloadPart(bytes_=event_json.encode('utf-8'))
            )
            await self.stream.input_stream.send(event)
        except Exception as e:
            logger.error(f"Error sending event: {e}", exc_info=True)
    
    async def start_session(self):
        """Start a new Nova Sonic session."""
        logger.info("Starting Nova Sonic session...")
        
        # Initialize metrics
        self.metrics = SessionMetrics()
        self.metrics.session_start_time = time.time()
        
        if not self.client:
            self._initialize_client()
        
        try:
            logger.info(f"Invoking bidirectional stream with model: {self.model_id}")
            
            # Initialize the stream
            self.stream = await self.client.invoke_model_with_bidirectional_stream(
                InvokeModelWithBidirectionalStreamOperationInput(model_id=self.model_id)
            )
            self.is_active = True
            logger.info("Bidirectional stream initialized")
            
            # Send session start event with voice activity detection (Radisys approach)
            logger.info("Sending session start event...")
            session_start = json.dumps({
                "event": {
                    "sessionStart": {
                        "inferenceConfiguration": {
                            "maxTokens": 1024,
                            "topP": 0.9,
                            "temperature": 0.7
                        },
                        "turnDetectionConfiguration": {
                            "type": "VOICE_ACTIVITY",
                            "silenceThresholdMilliseconds": 500,
                            "prefixPaddingMilliseconds": 100,
                            "silenceDurationMilliseconds": 300
                        }
                    }
                }
            })
            await self.send_event(session_start)
            logger.info("Session start event sent (VOICE_ACTIVITY mode)")
            
            # Send prompt start event
            logger.info("Sending prompt start event...")
            logger.info(f"🎤 Configuring audio output: voice={self._get_voice_id()}, language={self.target_language}")
            
            # Build prompt start with optional tool configuration
            prompt_start_config = {
                "promptName": self.prompt_name,
                "textOutputConfiguration": {
                    "mediaType": "text/plain"
                },
                "audioOutputConfiguration": {
                    "mediaType": "audio/lpcm",
                    "sampleRateHertz": OUTPUT_SAMPLE_RATE,
                    "sampleSizeBits": 16,
                    "channelCount": 1,
                    "voiceId": self._get_voice_id(),
                    "encoding": "base64",
                    "audioType": "SPEECH"
                }
            }
            
            # Add tool configuration if tools are enabled
            if self.tools_enabled and self.tool_processor:
                logger.info("🔧 Adding tool configuration to prompt start...")
                
                # Define the input schema as a JSON string (not a dict!)
                acronym_schema = json.dumps({
                    "type": "object",
                    "properties": {
                        "acronym": {
                            "type": "string",
                            "description": "The acronym to check (e.g., PMI, ARM, LTV)"
                        }
                    },
                    "required": ["acronym"]
                })
                
                prompt_start_config["toolConfiguration"] = {
                    "tools": [
                        {
                            "toolSpec": {
                                "name": "should_translate_acronym",
                                "description": "Determines whether a financial or mortgage acronym should be translated or preserved in its original form",
                                "inputSchema": {
                                    "json": acronym_schema  # JSON string, not dict!
                                }
                            }
                        }
                    ]
                }
                logger.info("✅ Tool configuration added to prompt start")
            
            prompt_start = json.dumps({
                "event": {
                    "promptStart": prompt_start_config
                }
            })
            
            # Log the actual configuration being sent
            logger.info(f"📤 Sending promptStart with audioOutputConfiguration: {json.dumps(prompt_start_config['audioOutputConfiguration'], indent=2)}")
            
            await self.send_event(prompt_start)
            logger.info("Prompt start event sent")
            
            # Send system prompt content start
            logger.info("Sending system prompt...")
            text_content_start = json.dumps({
                "event": {
                    "contentStart": {
                        "promptName": self.prompt_name,
                        "contentName": self.content_name,
                        "type": "TEXT",
                        "interactive": False,
                        "role": "SYSTEM",
                        "textInputConfiguration": {
                            "mediaType": "text/plain"
                        }
                    }
                }
            })
            await self.send_event(text_content_start)
            
            # Send system prompt text
            system_prompt = self._build_system_prompt()
            logger.info(f"📝 System prompt (first 200 chars): {system_prompt[:200]}...")
            text_input = json.dumps({
                "event": {
                    "textInput": {
                        "promptName": self.prompt_name,
                        "contentName": self.content_name,
                        "content": system_prompt
                    }
                }
            })
            await self.send_event(text_input)
            
            # End system prompt content
            text_content_end = json.dumps({
                "event": {
                    "contentEnd": {
                        "promptName": self.prompt_name,
                        "contentName": self.content_name
                    }
                }
            })
            await self.send_event(text_content_end)
            print("System prompt sent")
            
            # Start processing responses in background
            self.response_task = asyncio.create_task(self._process_responses())
            
            logger.info(f"Nova Sonic session started: {self.prompt_name}")
            
        except Exception as e:
            print(f"Error starting Nova Sonic session: {e}")
            traceback.print_exc()
            raise
    
    async def start_audio_input(self):
        """Start the audio input stream."""
        print("Starting audio input...")
        try:
            audio_content_start = json.dumps({
                "event": {
                    "contentStart": {
                        "promptName": self.prompt_name,
                        "contentName": self.audio_content_name,
                        "type": "AUDIO",
                        "interactive": True,
                        "role": "USER",
                        "audioInputConfiguration": {
                            "mediaType": "audio/lpcm",
                            "sampleRateHertz": INPUT_SAMPLE_RATE,
                            "sampleSizeBits": 16,
                            "channelCount": 1,
                            "audioType": "SPEECH",
                            "encoding": "base64"
                        }
                    }
                }
            })
            await self.send_event(audio_content_start)
            print("Audio input started")
        except Exception as e:
            print(f"Error starting audio input: {e}")
            traceback.print_exc()
    
    async def send_audio_chunk(self, audio_bytes: bytes):
        """Send an audio chunk to Nova Sonic."""
        if not self.is_active:
            return
        
        try:
            # Track metrics
            self.metrics.audio_chunks_received += 1
            self.metrics.audio_bytes_received += len(audio_bytes)
            self.metrics.last_audio_input_time = time.time()
            
            blob = base64.b64encode(audio_bytes).decode('utf-8')
            audio_event = json.dumps({
                "event": {
                    "audioInput": {
                        "promptName": self.prompt_name,
                        "contentName": self.audio_content_name,
                        "content": blob
                    }
                }
            })
            await self.send_event(audio_event)
        except Exception as e:
            print(f"Error sending audio chunk: {e}")
    
    async def end_audio_input(self):
        """End the audio input stream."""
        print("Ending audio input...")
        try:
            audio_content_end = json.dumps({
                "event": {
                    "contentEnd": {
                        "promptName": self.prompt_name,
                        "contentName": self.audio_content_name
                    }
                }
            })
            await self.send_event(audio_content_end)
            print("Audio input ended")
        except Exception as e:
            print(f"Error ending audio input: {e}")
    
    async def end_session(self):
        """End the Nova Sonic session."""
        if not self.is_active:
            return
        
        print("Ending Nova Sonic session...")
        self.is_active = False
        
        try:
            # Send prompt end
            prompt_end = json.dumps({
                "event": {
                    "promptEnd": {
                        "promptName": self.prompt_name
                    }
                }
            })
            await self.send_event(prompt_end)
            
            # Send session end
            session_end = json.dumps({
                "event": {
                    "sessionEnd": {}
                }
            })
            await self.send_event(session_end)
            
            # Close the stream
            if self.stream:
                await self.stream.input_stream.close()
            
            # Cancel response task
            if self.response_task and not self.response_task.done():
                self.response_task.cancel()
            
            print(f"Nova Sonic session ended: {self.prompt_name}")
        except Exception as e:
            print(f"Error ending session: {e}")
            traceback.print_exc()
    
    async def _process_responses(self):
        """Process responses from Nova Sonic."""
        print("Starting response processor...")
        try:
            while self.is_active:
                output = await self.stream.await_output()
                result = await output[1].receive()
                
                if result.value and result.value.bytes_:
                    response_data = result.value.bytes_.decode('utf-8')
                    json_data = json.loads(response_data)
                    
                    if 'event' in json_data:
                        # logger.info(f"Received event: {json_data}")  # Commented out verbose logging
                        await self._handle_event(json_data['event'])
        
        except asyncio.CancelledError:
            print("Response processor cancelled")
        except Exception as e:
            print(f"Error processing responses: {e}")
            traceback.print_exc()
            if self.on_error:
                self.on_error(e)
    
    async def _handle_tool_call(self, tool_name: str, tool_input: dict, tool_use_id: str):
        """
        Handle incoming tool call requests from Nova Sonic.
        
        Args:
            tool_name: Name of the tool to execute
            tool_input: Tool input parameters
            tool_use_id: Unique identifier for the tool call
        """
        try:
            logger.info(f"🔧 TOOL CALL RECEIVED: {tool_name}")
            logger.info(f"🔧 Tool Use ID: {tool_use_id}")
            logger.info(f"🔧 Tool Input: {tool_input}")
            
            # Call tool processor
            if self.tool_processor:
                result = await self.tool_processor.process_tool_async(tool_name, tool_input)
                
                logger.info(f"✅ TOOL EXECUTION COMPLETED: {tool_name}")
                logger.info(f"✅ Tool Result: {result}")
                
                # Send result back to Nova Sonic
                await self._send_tool_result(tool_use_id, result)
            else:
                logger.error("❌ Tool call received but tool_processor is not initialized")
                # Send error response
                error_result = {
                    "success": False,
                    "error": "Tool processor not available"
                }
                await self._send_tool_result(tool_use_id, error_result)
        
        except Exception as e:
            logger.error(f"Error handling tool call: {e}", exc_info=True)
            # Send error response
            try:
                error_result = {
                    "success": False,
                    "error": f"Tool execution error: {str(e)}"
                }
                await self._send_tool_result(tool_use_id, error_result)
            except Exception as send_error:
                logger.error(f"Failed to send error response: {send_error}", exc_info=True)
    
    async def _send_tool_result(self, tool_use_id: str, result: dict):
        """
        Send tool execution result back to Nova Sonic using the correct 3-event sequence.
        
        Args:
            tool_use_id: Unique identifier for the tool call
            result: Tool execution result
        """
        try:
            # Generate a unique content name for this tool result
            content_name = str(uuid.uuid4())
            
            logger.info(f"Sending tool result for toolUseId: {tool_use_id}")
            
            # 1. Send tool content start event
            tool_content_start = json.dumps({
                "event": {
                    "contentStart": {
                        "promptName": self.prompt_name,
                        "contentName": content_name,
                        "interactive": False,
                        "type": "TOOL",
                        "role": "TOOL",
                        "toolResultInputConfiguration": {
                            "toolUseId": tool_use_id,
                            "type": "TEXT",
                            "textInputConfiguration": {
                                "mediaType": "text/plain"
                            }
                        }
                    }
                }
            })
            await self.send_event(tool_content_start)
            logger.debug(f"Sent tool content start")
            
            # 2. Send tool result event
            # Convert result to JSON string if it's a dict
            if isinstance(result, dict):
                result_content = json.dumps(result)
            else:
                result_content = result
                
            tool_result_event = json.dumps({
                "event": {
                    "toolResult": {
                        "promptName": self.prompt_name,
                        "contentName": content_name,
                        "content": result_content
                    }
                }
            })
            await self.send_event(tool_result_event)
            logger.debug(f"Sent tool result: {result_content}")
            
            # 3. Send tool content end event
            tool_content_end = json.dumps({
                "event": {
                    "contentEnd": {
                        "promptName": self.prompt_name,
                        "contentName": content_name
                    }
                }
            })
            await self.send_event(tool_content_end)
            logger.debug(f"Sent tool content end")
            
            logger.info(f"Tool result sent successfully for toolUseId: {tool_use_id}")
        
        except Exception as e:
            logger.error(f"Error sending tool result: {e}", exc_info=True)
            raise
    
    async def _handle_event(self, event: dict):
        """Handle a single event from Nova Sonic."""
        # Handle tool call requests - store tool info but don't process yet
        if 'toolUse' in event:
            logger.info(f"🔧 TOOL USE EVENT DETECTED in _handle_event")
            logger.info(f"🔧 Raw toolUse event: {event['toolUse']}")  # Log the raw event
            
            tool_use = event['toolUse']
            # Try both 'toolName' and 'name' field names
            self.pending_tool_name = tool_use.get('toolName', tool_use.get('name', ''))
            self.pending_tool_use_id = tool_use.get('toolUseId', '')
            
            # The input is in the 'content' field as a JSON string, not 'input'!
            content = tool_use.get('content', '{}')
            try:
                self.pending_tool_input = json.loads(content) if isinstance(content, str) else content
            except json.JSONDecodeError:
                logger.error(f"Failed to parse tool content: {content}")
                self.pending_tool_input = {}
            
            logger.info(f"🔧 Tool stored: {self.pending_tool_name} (ID: {self.pending_tool_use_id})")
            logger.info(f"🔧 Tool input: {self.pending_tool_input}")
        
        # Handle content end - check for interruption and process tools
        elif 'contentEnd' in event:
            content_end = event['contentEnd']
            
            # Handle barge-in interruption
            if content_end.get('stopReason') == 'INTERRUPTED':
                logger.info("🛑 BARGE-IN DETECTED - User interrupted assistant")
                
                # Clear local audio queue
                while not self.audio_queue.empty():
                    try:
                        self.audio_queue.get_nowait()
                    except asyncio.QueueEmpty:
                        break
                
                # Notify frontend to clear audio queue
                if self.on_audio_output:
                    self.on_audio_output(b'__INTERRUPTED__')
            
            # Process tool if it's a TOOL type
            if content_end.get('type') == 'TOOL':
                logger.info(f"🔧 TOOL CONTENT END - Processing tool now")
                if hasattr(self, 'pending_tool_name') and self.pending_tool_name:
                    await self._handle_tool_call(
                        self.pending_tool_name,
                        self.pending_tool_input,
                        self.pending_tool_use_id
                    )
                    # Clear pending tool info
                    self.pending_tool_name = None
                    self.pending_tool_use_id = None
                    self.pending_tool_input = None
        
        # Handle content start - track role and detect language
        elif 'contentStart' in event:
            content_start = event['contentStart']
            self.role = content_start.get('role', 'USER')
            
            # Check for language detection in USER role
            if self.role == 'USER' and 'additionalModelFields' in content_start:
                try:
                    from config import is_supported_language, DEFAULT_LANGUAGE
                    
                    additional_fields = content_start['additionalModelFields']
                    # Parse if string, use directly if dict
                    if isinstance(additional_fields, str):
                        additional_fields = json.loads(additional_fields)
                    
                    detected = additional_fields.get('detectedLanguage')
                    
                    # Update source language if in auto mode
                    if detected and self.source_language == 'auto':
                        if is_supported_language(detected):
                            self.detected_language = detected
                            self.source_language = detected
                            logger.info(f"Language detected: {detected}")
                            
                            # Trigger callback
                            if self.on_language_detected:
                                self.on_language_detected(detected)
                        else:
                            logger.warning(f"Unsupported language detected: {detected}, using fallback")
                            self.detected_language = DEFAULT_LANGUAGE
                            self.source_language = DEFAULT_LANGUAGE
                except Exception as e:
                    logger.error(f"Error parsing language detection: {e}")
            
            # Check for speculative content
            if 'additionalModelFields' in content_start:
                try:
                    additional_fields = content_start['additionalModelFields']
                    if isinstance(additional_fields, str):
                        additional_fields = json.loads(additional_fields)
                    if additional_fields.get('generationStage') == 'SPECULATIVE':
                        self.display_assistant_text = True
                    else:
                        self.display_assistant_text = False
                except:
                    self.display_assistant_text = False
        
        # Handle text output (transcript)
        elif 'textOutput' in event:
            text = event['textOutput']['content']
            
            # Log the raw text output from Nova Sonic
            logger.info(f"📝 TEXT OUTPUT (role={self.role}): {text}")
            
            # Clean up any unwanted prefixes or embedded "translation:" from the output
            if self.role == 'ASSISTANT':
                import re
                # Remove "translation:" anywhere in the text (case-insensitive)
                text = re.sub(r'\s*translation:\s*', ' ', text, flags=re.IGNORECASE).strip()
                text = re.sub(r'\s*traducción:\s*', ' ', text, flags=re.IGNORECASE).strip()
                # Remove duplicate text patterns like "hello translation: hello"
                # If the text repeats itself after "translation:", keep only the first part
                words = text.split()
                if len(words) > 2:
                    mid = len(words) // 2
                    first_half = ' '.join(words[:mid]).lower()
                    second_half = ' '.join(words[mid:]).lower()
                    if first_half == second_half:
                        text = ' '.join(words[:mid])
            
            if self.role == 'ASSISTANT' and self.display_assistant_text:
                logger.info(f"🗣️ ASSISTANT OUTPUT (cleaned): {text}")
                self.metrics.translations_count += 1
                
                # Calculate latency from last audio input to translation output
                if self.metrics.last_audio_input_time > 0:
                    latency = time.time() - self.metrics.last_audio_input_time
                    self.metrics.latencies.append(latency)
                
                if self.on_transcript:
                    self.on_transcript(text, 'assistant')
                    
                # Send metrics update
                if self.on_metrics:
                    self.on_metrics(self.metrics)
                    
            elif self.role == 'USER':
                print(f"User (original): {text}")
                self.metrics.transcriptions_count += 1
                
                if self.on_transcript:
                    self.on_transcript(text, 'user')
                    
                # Send metrics update
                if self.on_metrics:
                    self.on_metrics(self.metrics)
        
        # Handle audio output
        elif 'audioOutput' in event:
            audio_content = event['audioOutput']['content']
            audio_bytes = base64.b64decode(audio_content)
            
            # Track output metrics
            self.metrics.audio_chunks_sent += 1
            self.metrics.audio_bytes_sent += len(audio_bytes)
            
            # Commented out verbose audio logging
            # print(f"Audio output received: {len(audio_bytes)} bytes")
            
            if self.on_audio_output:
                self.on_audio_output(audio_bytes)
            
            await self.audio_queue.put(audio_bytes)
