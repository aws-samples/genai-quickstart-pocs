"""
Two-Party WebSocket Server for  Translator (FastAPI version)

This server enables two browser windows to join the same call:
- Browser 1: Loan Officer (English speaker)
- Browser 2: Customer (Spanish speaker)

Each participant's speech is translated and sent to the other participant.
"""

import asyncio
import json
import logging
import os
import uuid
import base64

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
import uvicorn

from nova_sonic_client import NovaSonicTranslator
from config import is_supported_language, DEFAULT_LANGUAGE

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Two-Party Translation Server")

# Active calls
active_calls = {}


class TwoPartyCall:
    """Manages a 2-party translation call between LO (English) and Customer (Spanish)."""
    
    def __init__(self, call_id: str):
        self.call_id = call_id
        self.participants = {}  # ws -> participant_info
        self.forward_tasks = {}  # ws -> asyncio.Task
        logger.info(f"Created call: {call_id}")
    
    async def add_participant(self, ws: WebSocket, user_id: str, target_language: str):
        """Add participant to call with target language only (source auto-detected)."""
        if len(self.participants) >= 2:
            raise Exception("Call already has 2 participants")
        
        # Validate target language
        if not is_supported_language(target_language):
            logger.warning(f"Invalid target language: {target_language}, using default")
            target_language = DEFAULT_LANGUAGE
        
        logger.info(f"Adding {user_id} with target language: {target_language} to call {self.call_id}")
        
        # Create Nova Sonic translator with auto-detection
        # NOTE: This translator processes audio FROM the other participant and translates
        # it into this participant's target_language. So the translated output should be
        # sent back to THIS participant (the translator's owner).
        translator = NovaSonicTranslator(
            source_language='auto',  # Always auto-detect
            target_language=target_language,
            on_audio_output=lambda audio, ws=ws: asyncio.create_task(
                self._queue_audio_for_same(ws, audio)  # Send translated audio to THIS participant (the listener)
            ),
            on_transcript=lambda text, role, ws=ws, user_id=user_id: asyncio.create_task(
                self._queue_transcript(ws, user_id, text, role)
            ),
            on_language_detected=lambda lang, ws=ws: asyncio.create_task(
                self._notify_language_detected(ws, lang)
            ),
            on_error=lambda e: logger.error(f"Nova error for {user_id}: {e}")
        )
        
        # Start Nova session
        await translator.start_session()
        await translator.start_audio_input()
        
        # Store participant
        self.participants[ws] = {
            'user_id': user_id,
            'target_language': target_language,
            'translator': translator,
            'audio_queue': asyncio.Queue(),
            'text_queue': asyncio.Queue()
        }
        
        # Start forwarding task
        self.forward_tasks[ws] = asyncio.create_task(self._forward_responses(ws))
        
        logger.info(f"✓ {user_id} joined call {self.call_id}: auto → {target_language}")
        return len(self.participants)
    
    async def _notify_language_detected(self, ws: WebSocket, language: str):
        """Send language detection notification to frontend."""
        participant = self.participants.get(ws)
        if participant:
            await participant['text_queue'].put({
                'type': 'language_detected',
                'language': language
            })
            logger.info(f"Notified {participant['user_id']} of detected language: {language}")
    
    async def _queue_audio_for_same(self, owner_ws, audio_bytes: bytes):
        """Queue translated audio to be sent back to the same participant who spoke."""
        # Check for interruption signal
        if audio_bytes == b'__INTERRUPTED__':
            logger.info("🛑 Received interruption signal - clearing audio queue")
            participant = self.participants.get(owner_ws)
            if participant:
                # Clear the queue
                while not participant['audio_queue'].empty():
                    try:
                        participant['audio_queue'].get_nowait()
                    except asyncio.QueueEmpty:
                        break
                
                # Send interruption signal to frontend
                await participant['text_queue'].put({
                    'type': 'interrupted',
                    'message': 'clear_audio_queue'
                })
                logger.info(f"🛑 Sent interruption signal to {participant['user_id']}")
            return
        
        participant = self.participants.get(owner_ws)
        if not participant:
            logger.warning("Participant not found")
            return
        
        user_id = participant['user_id']
        
        # Queue audio for the same participant (translation of their own speech)
        await participant['audio_queue'].put(audio_bytes)
        logger.info(f"🔊 Queued {len(audio_bytes)} bytes translated audio for {user_id}")
    
    async def _queue_audio_for_other(self, sender_ws, audio_bytes: bytes):
        """Queue audio to be sent to the other participant."""
        # Check for interruption signal
        if audio_bytes == b'__INTERRUPTED__':
            logger.info("🛑 Received interruption signal - clearing audio queues")
            
            # Clear audio queues for all participants
            for ws, participant in self.participants.items():
                if ws != sender_ws:
                    # Clear the queue
                    while not participant['audio_queue'].empty():
                        try:
                            participant['audio_queue'].get_nowait()
                        except asyncio.QueueEmpty:
                            break
                    
                    # Send interruption signal to frontend
                    await participant['text_queue'].put({
                        'type': 'interrupted',
                        'message': 'clear_audio_queue'
                    })
                    logger.info(f"🛑 Sent interruption signal to {participant['user_id']}")
            return
        
        sender = self.participants.get(sender_ws)
        if not sender:
            logger.warning("Sender not found in participants")
            return
        
        sender_id = sender['user_id']
        queued_count = 0
        
        # Debug: Log total participants
        logger.info(f"🔊 Audio from {sender_id}, total participants: {len(self.participants)}")
        
        for ws, participant in self.participants.items():
            if ws != sender_ws:
                await participant['audio_queue'].put(audio_bytes)
                queued_count += 1
                logger.info(f"🔊 Queued {len(audio_bytes)} bytes audio from {sender_id} for {participant['user_id']}")
        
        if queued_count == 0:
            logger.warning(f"⚠️ No other participant to send audio to (only {sender_id} in call)")
    
    async def _queue_transcript(self, translator_owner_ws, owner_user_id: str, text: str, role: str):
        """Queue transcript to be sent to participants.
        
        The translator_owner_ws is the participant whose translator produced this output.
        Since each participant's translator processes the OTHER person's audio:
        - role='user' (original speech) → from the OTHER participant (the speaker)
        - role='assistant' (translation) → translated into the translator owner's language
        """
        owner = self.participants.get(translator_owner_ws)
        if not owner:
            return
        
        # Determine the actual speaker for role='user'
        if role == 'user':
            # The original speech is from the OTHER participant (not the translator owner)
            speaker_user_id = owner_user_id  # default fallback
            speaker_language = 'auto'
            for ws, participant in self.participants.items():
                if ws != translator_owner_ws:
                    speaker_user_id = participant['user_id']
                    # Use detected language from the other participant's perspective
                    translator = owner.get('translator')
                    detected = translator.detected_language if translator and translator.detected_language else None
                    speaker_language = detected if detected else 'auto'
                    break
            
            transcript_data = {
                'type': 'transcript',
                'userId': speaker_user_id,
                'text': text,
                'role': role,
                'language': speaker_language
            }
        else:
            # role='assistant' — this is the translation, attributed to the translator owner
            transcript_data = {
                'type': 'transcript',
                'userId': owner_user_id,
                'text': text,
                'role': role,
                'language': owner.get('target_language', 'en-US')
            }
        
        # Send to all participants
        for ws, participant in self.participants.items():
            await participant['text_queue'].put(transcript_data)
    
    async def _forward_responses(self, ws: WebSocket):
        """Forward queued responses to WebSocket."""
        participant = self.participants.get(ws)
        if not participant:
            return
        
        user_id = participant['user_id']
        logger.info(f"Started forward task for {user_id}")
        
        try:
            while True:
                # Check audio queue
                try:
                    audio_bytes = await asyncio.wait_for(
                        participant['audio_queue'].get(),
                        timeout=0.05
                    )
                    audio_msg = json.dumps({
                        'type': 'audio',
                        'audioData': base64.b64encode(audio_bytes).decode('utf-8')
                    })
                    await ws.send_text(audio_msg)
                    logger.info(f"✅ Sent {len(audio_bytes)} bytes audio to {user_id}")
                except asyncio.TimeoutError:
                    pass
                
                # Check text queue
                try:
                    text_data = await asyncio.wait_for(
                        participant['text_queue'].get(),
                        timeout=0.05
                    )
                    await ws.send_text(json.dumps(text_data))
                    logger.info(f"📝 Sent transcript to {user_id}: {text_data.get('text', '')[:50]}")
                except asyncio.TimeoutError:
                    pass
                
                await asyncio.sleep(0.01)
        
        except asyncio.CancelledError:
            logger.info(f"Forward task cancelled for {user_id}")
        except Exception as e:
            logger.error(f"Error forwarding to {user_id}: {e}")
    
    async def process_audio(self, ws: WebSocket, audio_base64: str):
        """Process audio from participant by sending it to the OTHER participant's translator.
        
        This is the key routing logic: Speaker A's audio needs to be translated into
        Speaker B's target language, so it must be processed by Speaker B's translator.
        """
        sender = self.participants.get(ws)
        if not sender:
            return
        
        audio_bytes = base64.b64decode(audio_base64)
        
        # Send audio to the OTHER participant's translator
        # Speaker A's speech → Speaker B's translator (which translates to Speaker B's target language)
        for other_ws, other_participant in self.participants.items():
            if other_ws != ws:
                await other_participant['translator'].send_audio_chunk(audio_bytes)
    
    async def remove_participant(self, ws: WebSocket):
        """Remove participant from call."""
        participant = self.participants.get(ws)
        if participant:
            user_id = participant['user_id']
            logger.info(f"Removing {user_id} from call {self.call_id}")
            
            # Cancel forward task
            if ws in self.forward_tasks:
                self.forward_tasks[ws].cancel()
                del self.forward_tasks[ws]
            
            # Close translator
            await participant['translator'].end_session()
            del self.participants[ws]
            
            # Notify remaining participant
            for other_ws in self.participants:
                try:
                    await other_ws.send_text(json.dumps({
                        'type': 'participant_left',
                        'userId': user_id
                    }))
                except:
                    pass
    
    def is_empty(self):
        return len(self.participants) == 0
    
    def get_participant_count(self):
        return len(self.participants)


# HTTP Health Check Endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for ALB."""
    return JSONResponse(
        content={
            "status": "healthy",
            "active_calls": len(active_calls),
            "service": "two-party-translation"
        },
        status_code=200
    )


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service info."""
    return {
        "service": "Two-Party Translation Server",
        "version": "1.0.0",
        "websocket_endpoint": "/ws",
        "health_endpoint": "/health"
    }


# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Handle WebSocket connections."""
    await websocket.accept()
    current_call_id = None
    
    try:
        while True:
            message = await websocket.receive_text()
            
            try:
                data = json.loads(message)
                msg_type = data.get('type')
                
                # Handle join request
                if msg_type == 'join':
                    call_id = data.get('callId', str(uuid.uuid4())[:8])
                    user_id = data.get('userId', 'anonymous')
                    target_language = data.get('targetLanguage', DEFAULT_LANGUAGE)
                    
                    # Get or create call
                    if call_id not in active_calls:
                        active_calls[call_id] = TwoPartyCall(call_id)
                    
                    try:
                        count = await active_calls[call_id].add_participant(
                            websocket, user_id, target_language
                        )
                        current_call_id = call_id
                        
                        await websocket.send_text(json.dumps({
                            'type': 'joined',
                            'callId': call_id,
                            'userId': user_id,
                            'targetLanguage': target_language,
                            'participantCount': count
                        }))
                        
                        logger.info(f"✅ {user_id} joined call {call_id} ({count}/2 participants)")
                    
                    except Exception as e:
                        await websocket.send_text(json.dumps({
                            'type': 'error',
                            'message': str(e)
                        }))
                
                # Handle audio input
                elif msg_type == 'audio':
                    if current_call_id and current_call_id in active_calls:
                        audio_data = data.get('audioData', '')
                        await active_calls[current_call_id].process_audio(websocket, audio_data)
                
                # Handle leave
                elif msg_type == 'leave':
                    if current_call_id and current_call_id in active_calls:
                        await active_calls[current_call_id].remove_participant(websocket)
                        if active_calls[current_call_id].is_empty():
                            del active_calls[current_call_id]
                        current_call_id = None
            
            except json.JSONDecodeError:
                logger.error("Invalid JSON received")
            except Exception as e:
                logger.error(f"Error processing message: {e}")
    
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    finally:
        # Cleanup on disconnect
        if current_call_id and current_call_id in active_calls:
            await active_calls[current_call_id].remove_participant(websocket)
            if active_calls[current_call_id].is_empty():
                del active_calls[current_call_id]
                logger.info(f"Call {current_call_id} ended (empty)")


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("TWO_PARTY_PORT", "8082"))
    
    logger.info(f"🚀 Two-Party Translation Server starting at http://{host}:{port}")
    logger.info(f"   WebSocket: ws://{host}:{port}/ws")
    logger.info(f"   Health Check: http://{host}:{port}/health")
    logger.info(f"   English ↔ Spanish real-time translation")
    
    uvicorn.run(app, host=host, port=port)
