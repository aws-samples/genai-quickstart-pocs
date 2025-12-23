## Customization

You can modify the following parameters in the scripts:

- `SAMPLE_RATE`: Audio sample rate (default: 16000 Hz for input, 24000 Hz for output)
- `CHANNELS`: Number of audio channels (default: 1)
- `CHUNK_SIZE`: Audio buffer size (varies by implementation)

You can also customize the system prompt by modifying the `default_system_prompt` variable in the `initialize_stream` method.

## Troubleshooting

1. **Audio Input Issues**
   - Ensure your microphone is properly connected and selected as the default input device
   - Try increasing the chunk size if you experience audio stuttering
   - If you encounter issues with PyAudio installation:

      **On macOS:**
      ```bash
      brew install portaudio
      ```

      **On Ubuntu/Debian:**

      ```bash
      sudo apt-get install portaudio19-dev
      ```

      **On Windows:** 

      ```bash
      # Install PyAudio binary directly using pip
      pip install pipwin
      pipwin install pyaudio
      ```

      Alternatively, Windows users can download pre-compiled PyAudio wheels from:
      https://www.lfd.uci.edu/~gohlke/pythonlibs/#pyaudio
      ```bash
      # Example for Python 3.12, 64-bit Windows
      pip install PyAudio‑0.2.11‑cp312‑cp312‑win_amd64.whl
      ```

2. **Audio Output Issues**
   - Verify your speakers are working and not muted
   - Check that the audio output device is properly selected

3. **AWS Connection Issues**
   - Verify your AWS credentials are correctly configured as environment variables
   - Ensure you have access to the AWS Bedrock service
   - Check your internet connection

4. **Debug Mode**
   - Run with the `--debug` flag to see detailed logs
   - This can help identify issues with the connection or audio processing

## Data Flow

```
User Speech → PyAudio → Amazon Nova Sonic Model → Audio Output
     ↑                                                      ↓
     └──────────────────────────────────────────────────────┘
                          Conversation
```

For tool use implementation, the flow extends to:

```
User Speech → PyAudio → Amazon Nova Sonic Model → Tool Execution → Audio Output
     ↑                                                                      ↓
     └──────────────────────────────────────────────────────────────────────┘
                                  Conversation