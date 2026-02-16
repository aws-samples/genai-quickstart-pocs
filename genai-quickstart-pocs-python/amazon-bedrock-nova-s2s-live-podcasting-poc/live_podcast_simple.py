#!/usr/bin/env python3
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
"""Simple Live Podcast - One Speaker at a Time"""
import os
import asyncio
import json
import base64
import subprocess  # nosec B404 - needed for audio playback via afplay
import tempfile
import wave
import uuid
from flask import Flask, render_template, request, jsonify, Response
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from nova_sonic_client import BedrockStreamManager, SilentAudioStreamer

app = Flask(__name__)

# Load AWS credentials from environment variables
# Set these in your .env file or export them in your shell
# See .env.example for the required variables
if not os.getenv('AWS_ACCESS_KEY_ID'):
    print(" WARNING: AWS credentials not found in environment variables!")
    print("   Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION")
    print("   You can copy .env.example to .env and fill in your credentials")
    
os.environ.setdefault('AWS_REGION', 'us-east-1')

@app.route('/')
def index():
    return render_template('live_podcast.html')

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    topic = data.get('topic', '')
    
    if not topic:
        return jsonify({'error': 'Topic is required'}), 400
    
    if len(topic) > 500:
        return jsonify({'error': 'Topic must be 500 characters or fewer'}), 400
    
    def event_stream():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        audio_proc = None  # Track current audio playback process
        
        try:
            previous_matthew = ""
            previous_tiffany = ""
            
            for i in range(10):
                # Determine speaker
                if i % 2 == 0:
                    speaker = "Matthew"
                    voice = "matthew"
                    if i == 0:
                        prompt = (
                            f"You are Matthew, the charismatic host of a popular tech podcast. "
                            f"Welcome your guest Tiffany and introduce today's topic: {topic}. "
                            f"Be warm, enthusiastic, and set the stage for an engaging conversation. 2-3 sentences."
                        )
                    elif i == 8:
                        prompt = (
                            f"You are Matthew, the podcast host. Tiffany just said: {previous_tiffany}. "
                            f"This is the final exchange. Wrap up the conversation about {topic} with a memorable takeaway "
                            f"and thank Tiffany for joining. 2-3 sentences."
                        )
                    else:
                        prompt = (
                            f"You are Matthew, the podcast host. Tiffany just said: {previous_tiffany}. "
                            f"React naturally to what she said, then ask a thoughtful follow-up question about {topic}. "
                            f"Be conversational and curious. Do not re-introduce the topic or welcome Tiffany again. 1-2 sentences."
                        )
                else:
                    speaker = "Tiffany"
                    voice = "tiffany"
                    if i == 1:
                        prompt = (
                            f"You are Tiffany, a knowledgeable and articulate expert guest on a podcast. "
                            f"Matthew just introduced the topic: {previous_matthew}. "
                            f"Thank him for having you and share your initial perspective on {topic}. "
                            f"Be insightful and engaging. 2-3 sentences."
                        )
                    else:
                        prompt = (
                            f"You are Tiffany, an expert guest on a podcast. Matthew just said: {previous_matthew}. "
                            f"Respond naturally with your expertise on {topic}. Share a specific insight, example, or "
                            f"interesting angle. Be conversational and informative. Do not thank Matthew or re-introduce "
                            f"yourself — the conversation is already underway. 2-3 sentences."
                        )
                
                print(f"\n🎙️ {speaker}'s turn...")
                
                # Create NEW manager for this turn only
                manager = BedrockStreamManager(model_id='amazon.nova-2-sonic-v1:0', region='us-east-1')
                manager.START_PROMPT_EVENT = manager.START_PROMPT_EVENT.replace('"matthew"', f'"{voice}"')
                
                # Initialize
                loop.run_until_complete(manager.initialize_stream())
                
                # Start silent audio streaming (keeps connection alive, but we handle playback manually)
                async def send_silent_audio():
                    # Send audio content start
                    await manager.send_audio_content_start_event()
                    # Send silent audio chunks to keep connection alive
                    silent_chunk = b'\x00' * (512 * 2)  # Silent 16-bit PCM
                    for _ in range(5):  # Send a few silent chunks
                        manager.add_audio_chunk(silent_chunk)
                        await asyncio.sleep(0.01)
                
                loop.run_until_complete(send_silent_audio())
                
                # Simple and reliable: Track unique content only
                seen_text_chunks = set()
                seen_audio_hashes = set()
                unique_text = []
                unique_audio = []
                audio_count = 0
                
                def capture(event):
                    nonlocal audio_count
                    if 'event' in event:
                        # Capture only unique text
                        if 'textOutput' in event['event']:
                            text = event['event']['textOutput']['content']
                            if text and '{ "interrupted" : true }' not in text:
                                if text not in seen_text_chunks:
                                    seen_text_chunks.add(text)
                                    unique_text.append(text)
                                    print(f"  📝 Text chunk #{len(unique_text)}: {text[:30]}...")
                        
                        # Capture only unique audio (by hash)
                        if 'audioOutput' in event['event']:
                            audio = event['event']['audioOutput']['content']
                            audio_hash = hash(audio)
                            audio_count += 1
                            if audio_hash not in seen_audio_hashes:
                                seen_audio_hashes.add(audio_hash)
                                unique_audio.append(audio)
                                print(f"  🔊 Audio chunk #{len(unique_audio)} (total received: {audio_count})")
                            else:
                                print(f"  🔄 Skipped duplicate audio (total received: {audio_count})")
                
                manager.output_subject.subscribe(on_next=capture)
                
                # Send prompt
                loop.run_until_complete(manager.send_text_with_new_content_name(prompt))
                
                # Wait with smart detection - check if content has stopped arriving
                last_chunk_count = 0
                stable_count = 0
                for check in range(60):  # Check every 0.25 seconds for up to 15 seconds
                    loop.run_until_complete(asyncio.sleep(0.25))
                    current_count = len(unique_audio) + len(unique_text)
                    
                    if current_count > 0 and current_count == last_chunk_count:
                        stable_count += 1
                        if stable_count >= 4:  # No new chunks for 1 second after content started
                            print(f"  ✅ Content stable after {(check + 1) * 0.25:.1f}s, proceeding...")
                            break
                    else:
                        stable_count = 0
                        last_chunk_count = current_count
                
                # Use all unique text (deduplication works for text)
                text_parts = unique_text
                
                # Use all unique audio (hash deduplication should handle duplicates)
                audio_chunks = unique_audio
                
                print(f"  📊 Final: {len(text_parts)} text chunks, {len(audio_chunks)} audio chunks")
                
                # Process response
                if text_parts:
                    bot_response = ''.join(text_parts).strip()
                else:
                    bot_response = f"{speaker} thinking..."
                
                # Update context
                if speaker == "Matthew":
                    previous_matthew = bot_response
                else:
                    previous_tiffany = bot_response
                
                print(f"💬 {speaker}: {bot_response}")
                
                # Play audio in background (non-blocking)
                if audio_chunks:
                    try:
                        # Wait for previous audio to finish before playing next
                        if audio_proc is not None:
                            audio_proc.wait()
                            audio_proc = None

                        audio_bytes = b''.join([base64.b64decode(chunk) for chunk in audio_chunks])
                        print(f"  🎵 Playing {len(audio_bytes):,} bytes ({len(audio_chunks)} chunks)")
                        
                        fd, temp_path = tempfile.mkstemp(suffix='.wav')
                        os.close(fd)
                        with wave.open(temp_path, 'wb') as wav_file:
                            wav_file.setnchannels(1)
                            wav_file.setsampwidth(2)
                            wav_file.setframerate(24000)
                            wav_file.writeframes(audio_bytes)
                        
                        afplay_path = '/usr/bin/afplay'
                        audio_proc = subprocess.Popen(  # nosec B603
                            [afplay_path, temp_path],
                            stdout=subprocess.DEVNULL,
                            stderr=subprocess.DEVNULL)
                        print(f"Audio playing")
                        
                    except Exception as e:
                        print(f" Audio error: {e}")
                
                # Cleanup this turn's manager
                try:
                    loop.run_until_complete(manager.close())
                except Exception as cleanup_error:
                    print(f"⚠️  Cleanup warning: {cleanup_error}")
                
                # Stream to client
                yield f"data: {json.dumps({'turn': i + 1, 'speaker': speaker, 'text': bot_response})}\n\n"
            
            yield "data: {\"done\": true}\n\n"
            
        except Exception as e:
            print(f" Error: {e}")
            import traceback
            traceback.print_exc()
            yield f"data: {json.dumps({'error': 'An internal error occurred. Check server logs for details.'})}\n\n"
        finally:
            loop.close()
    
    return Response(event_stream(), mimetype='text/event-stream')

if __name__ == '__main__':
    print("Nova S2S Live Podcasting")
    print("Open: http://localhost:5002")
    app.run(debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true', port=5002, threaded=True)
