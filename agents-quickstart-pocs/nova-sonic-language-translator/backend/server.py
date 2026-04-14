"""
WebSocket Server for  Translator

This server handles WebSocket connections from the frontend and manages
Nova 2 Sonic translation sessions.
"""

import asyncio
import base64
import json
import uuid
import traceback
from typing import Dict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from config import SERVER_HOST, SERVER_PORT, CORS_ORIGIN
from nova_sonic_client import NovaSonicTranslator

app = FastAPI(title=" Translator")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ORIGIN, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active sessions
sessions: Dict[str, dict] = {}


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket client connected")
    
    session_id = None
    lo_translator = None
    customer_translator = None
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            event_type = message.get('type')
            print(f"Received event: {event_type}")
            
            if event_type == 'session:start':
                try:
                    # Create new session
                    session_id = str(uuid.uuid4())
                    lo_id = message.get('loId', 'lo-001')
                    customer_language = message.get('customerLanguage', 'es')
                    
                    print(f"Starting session {session_id}")
                    print(f"LO ID: {lo_id}, Customer Language: {customer_language}")
                    
                    # Create translator for LO (English → Spanish)
                    # LO speaks English, output goes to customer in Spanish
                    lo_translator = NovaSonicTranslator(
                        source_language='en',
                        target_language=customer_language,
                        on_audio_output=lambda audio: asyncio.create_task(
                            send_audio(websocket, session_id, 'customer', audio)
                        ),
                        on_transcript=lambda text, role: asyncio.create_task(
                            send_transcript(websocket, session_id, 'lo' if role == 'user' else 'lo_translated', text)
                        ),
                        on_error=lambda e: asyncio.create_task(
                            send_error(websocket, session_id, str(e))
                        ),
                        on_metrics=lambda metrics: asyncio.create_task(
                            send_metrics(websocket, session_id, metrics, 'lo')
                        )
                    )
                    
                    # Create translator for Customer (Spanish → English)
                    # Customer speaks Spanish, output goes to LO in English
                    customer_translator = NovaSonicTranslator(
                        source_language=customer_language,
                        target_language='en',
                        on_audio_output=lambda audio: asyncio.create_task(
                            send_audio(websocket, session_id, 'lo', audio)
                        ),
                        on_transcript=lambda text, role: asyncio.create_task(
                            send_transcript(websocket, session_id, 'customer' if role == 'user' else 'customer_translated', text)
                        ),
                        on_error=lambda e: asyncio.create_task(
                            send_error(websocket, session_id, str(e))
                        ),
                        on_metrics=lambda metrics: asyncio.create_task(
                            send_metrics(websocket, session_id, metrics, 'customer')
                        )
                    )
                    
                    print("Created translators, starting sessions...")
                    
                    # Start LO session (English → Spanish)
                    await lo_translator.start_session()
                    await lo_translator.start_audio_input()
                    print("LO translator ready (EN → ES)")
                    
                    # Start Customer session (Spanish → English)
                    await customer_translator.start_session()
                    await customer_translator.start_audio_input()
                    print("Customer translator ready (ES → EN)")
                    
                    sessions[session_id] = {
                        'lo_translator': lo_translator,
                        'customer_translator': customer_translator,
                        'status': 'active'
                    }
                    
                    await websocket.send_json({
                        'type': 'session:started',
                        'sessionId': session_id
                    })
                    
                    print(f"Session {session_id} started successfully (bidirectional)")
                    
                except Exception as e:
                    print(f"Error starting session: {e}")
                    traceback.print_exc()
                    await websocket.send_json({
                        'type': 'error',
                        'message': f"Failed to start session: {str(e)}"
                    })
            
            elif event_type == 'audio:stream:lo':
                # Audio from Loan Officer
                if session_id and lo_translator:
                    try:
                        audio_data = message.get('audioData', '')
                        audio_bytes = base64.b64decode(audio_data)
                        print(f"Received LO audio: {len(audio_bytes)} bytes")
                        await lo_translator.send_audio_chunk(audio_bytes)
                    except Exception as e:
                        print(f"Error sending audio: {e}")
                else:
                    print(f"Cannot send audio - session_id: {session_id}, lo_translator: {lo_translator is not None}")
            
            elif event_type == 'audio:stream:customer':
                # Audio from Customer (Spanish)
                if session_id and customer_translator:
                    try:
                        audio_data = message.get('audioData', '')
                        audio_bytes = base64.b64decode(audio_data)
                        print(f"Received Customer audio: {len(audio_bytes)} bytes")
                        await customer_translator.send_audio_chunk(audio_bytes)
                    except Exception as e:
                        print(f"Error sending customer audio: {e}")
                else:
                    print(f"Cannot send customer audio - session_id: {session_id}, customer_translator: {customer_translator is not None}")
            
            elif event_type == 'session:pause':
                if session_id and session_id in sessions:
                    sessions[session_id]['status'] = 'paused'
                    await websocket.send_json({
                        'type': 'session:status',
                        'sessionId': session_id,
                        'status': 'paused'
                    })
            
            elif event_type == 'session:resume':
                if session_id and session_id in sessions:
                    sessions[session_id]['status'] = 'active'
                    await websocket.send_json({
                        'type': 'session:status',
                        'sessionId': session_id,
                        'status': 'active'
                    })
            
            elif event_type == 'session:end':
                if session_id:
                    await end_session(session_id, lo_translator, customer_translator)
                    await websocket.send_json({
                        'type': 'session:ended',
                        'sessionId': session_id
                    })
                    session_id = None
                    lo_translator = None
                    customer_translator = None
    
    except WebSocketDisconnect:
        print("WebSocket client disconnected")
        if session_id:
            await end_session(session_id, lo_translator, customer_translator)
    
    except Exception as e:
        print(f"WebSocket error: {e}")
        traceback.print_exc()
        if session_id:
            await end_session(session_id, lo_translator, customer_translator)


async def send_audio(websocket: WebSocket, session_id: str, speaker: str, audio_bytes: bytes):
    """Send audio output to the client."""
    try:
        print(f"Sending audio to frontend: {len(audio_bytes)} bytes for {speaker}")
        await websocket.send_json({
            'type': 'audio:stream',
            'sessionId': session_id,
            'speaker': speaker,
            'audioData': base64.b64encode(audio_bytes).decode('utf-8')
        })
        print(f"Audio sent successfully")
    except Exception as e:
        print(f"Error sending audio: {e}")
        traceback.print_exc()


async def send_transcript(websocket: WebSocket, session_id: str, speaker: str, text: str):
    """Send transcript update to the client."""
    try:
        print(f"Sending transcript to frontend: [{speaker}] {text}")
        await websocket.send_json({
            'type': 'transcript:update',
            'sessionId': session_id,
            'speaker': speaker,
            'text': text,
            'isFinal': True
        })
        print(f"Transcript sent successfully")
    except Exception as e:
        print(f"Error sending transcript: {e}")
        traceback.print_exc()


async def send_error(websocket: WebSocket, session_id: str, message: str):
    """Send error to the client."""
    try:
        await websocket.send_json({
            'type': 'error',
            'sessionId': session_id,
            'message': message
        })
    except Exception as e:
        print(f"Error sending error: {e}")


async def send_metrics(websocket: WebSocket, session_id: str, metrics, source: str = 'lo'):
    """Send metrics update to the client."""
    try:
        metrics_dict = metrics.to_dict()
        metrics_dict['source'] = source
        await websocket.send_json({
            'type': 'metrics:update',
            'sessionId': session_id,
            'metrics': metrics_dict
        })
    except Exception as e:
        print(f"Error sending metrics: {e}")


async def end_session(session_id: str, lo_translator, customer_translator):
    """End a translation session."""
    print(f"Ending session {session_id}")
    
    try:
        if lo_translator:
            await lo_translator.end_audio_input()
            await lo_translator.end_session()
        
        if customer_translator:
            await customer_translator.end_audio_input()
            await customer_translator.end_session()
        
        if session_id in sessions:
            del sessions[session_id]
    
    except Exception as e:
        print(f"Error ending session: {e}")
        traceback.print_exc()


if __name__ == "__main__":
    print(f"Starting  Translator server on {SERVER_HOST}:{SERVER_PORT}")
    uvicorn.run(app, host=SERVER_HOST, port=SERVER_PORT)
