# Amazon Transcribe Streaming SDK in Python example used as reference:
# https://github.com/awslabs/amazon-transcribe-streaming-sdk/blob/develop/examples/simple_mic.py

import streamlit as st
import asyncio
import sounddevice as sd
from threading import Thread, Timer

# importing TranscribeStreamingClient from Amazon Transcribe for live audio transcription
from amazon_transcribe.client import TranscribeStreamingClient
from amazon_transcribe.handlers import TranscriptResultStreamHandler
from amazon_transcribe.model import TranscriptEvent

# Initialize empty transcript and timestamp to check if user stops talking
transcript = ""
last_transcript_time = None

# event handler for transcription coming from microphone
class MyEventHandler(TranscriptResultStreamHandler):
    async def handle_transcript_event(self, transcript_event: TranscriptEvent):
        global transcript, last_transcript_time
        results = transcript_event.transcript.results
        # iterate through words being transcribed
        for result in results:
            for alt in result.alternatives:
                # reset 3 second time check
                last_transcript_time = asyncio.get_event_loop().time()
                # if the word is partial (i.e. not a completed word as user speaks), skip
                if result.is_partial:
                    continue
                # else, word is completed and can be added to full sentence
                else:
                    transcript += ' ' + alt.transcript
                    # print finalized sentence to terminal for user to see
                    print("Transcription:" + transcript +"\n")

# asynchronous generator for microphone stream
async def mic_stream():
    # this function wraps the raw input stream from the microphone forwarding
    # the blocks to an asyncio.Queue.
    loop = asyncio.get_event_loop()
    input_queue = asyncio.Queue()

    # Callback function for audio input
    def callback(indata, frame_count, time_info, status):
        loop.call_soon_threadsafe(input_queue.put_nowait, (bytes(indata), status))

    # Be sure to use the correct parameters for the audio stream that matches
    # the audio formats described for the source language you'll be using:
    # https://docs.aws.amazon.com/transcribe/latest/dg/streaming.html
    stream = sd.RawInputStream(
        channels=1,
        samplerate=48000,
        callback=callback,
        blocksize=1024 * 2,
        dtype="int16",
    )
    # initiate the audio stream and asynchronously yield the audio chunks
    # as they become available.
    with stream:
        while True:
            indata, status = await input_queue.get()
            yield indata, status

 # This connects the raw audio chunks generator coming from the microphone
 # and passes them along to the transcription stream.
async def write_chunks(stream):
    async for chunk, status in mic_stream():
        await stream.input_stream.send_audio_event(audio_chunk=chunk)
    await stream.input_stream.end_stream()

# function to start transcription and connect to chosen AWS region
async def basic_transcribe(language_code):
    client = TranscribeStreamingClient(region="us-east-1")
    # start transcription to generate our async stream
    stream = await client.start_stream_transcription(
        language_code=language_code,
        media_sample_rate_hz=48000,
        media_encoding="pcm",
    )
    # instantiate our handler and start processing events
    handler = MyEventHandler(stream.output_stream)
    await asyncio.gather(write_chunks(stream), handler.handle_events())

# global variable for event loop
global_loop = None

# function to start transcription process
def start_transcribe(language_code):
    global global_loop, last_transcript_time, transcript
    transcript = ""
    # create new event loop with thread
    global_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(global_loop)
    last_transcript_time = global_loop.time()
    # run loop until user stops talking 
    try:
        global_loop.run_until_complete(basic_transcribe(language_code))
    except RuntimeError as e:
        if "Event loop stopped before Future completed" not in str(e):
            raise

# function to terminate thread
def stop_transcribe():
    global global_loop
    global_loop.call_soon_threadsafe(global_loop.stop)

# function to stop transcription after silence is detected
def stop_transcribe_after_silence():
    timer = Timer(0.1, stop_transcribe)
    timer.start()

# function to monitor transcription progress
def monitor_transcription():
    global last_transcript_time
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    # while transcript is coming in, continue to stream audio
    # else, if after 3 seconds of silence, terminate thread and transcription job
    while True:
        current_time = loop.time()
        if last_transcript_time and current_time - last_transcript_time > 3:
            stop_transcribe_after_silence()
            break
        loop.run_until_complete(asyncio.sleep(1))

# main function to start transcription process
def main(language_code):
    global last_transcript_time
    # start transcription in a separate thread
    transcribe_thread = Thread(target=start_transcribe, args=(language_code,))
    transcribe_thread.start()
    # Start monitoring transcription progress in a separate thread
    monitor_thread = Thread(target=monitor_transcription)
    monitor_thread.start()
    # inform user about transcription start
    print('Transcription started!\n')
    # wait for transcription and monitoring threads to finish
    transcribe_thread.join()
    monitor_thread.join()
    print('Transcription finished\n')
    # return finalized transcript to app.py for Bedrock invocation
    return transcript
