# Real-Time Speech Translation Demo

**⚠️ NON-PRODUCTION USE ONLY - This is a proof-of-concept demonstration**

Real-time bidirectional speech-to-speech translation powered by Amazon Nova Sonic 2, enabling communication between speakers of different languages.

## Overview

This PoC demonstrates AI-powered real-time translation for communication scenarios:
- **Participant 1 (Any Language)** ↔ **AI Translator** ↔ **Participant 2 (Any Language)**
- Speech-to-speech translation with <500ms latency
- Support for multiple languages including English, Spanish, French, German, Italian, Portuguese, and Hindi
- Live transcription display

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  Browser 1      │     │  Browser 2      │
│  (Participant)  │     │  (Participant)  │
│  Any Language   │     │  Any Language   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │ WebSocket
                     ▼
         ┌───────────────────────┐
         │  Python Backend       │
         │  (FastAPI + WS)       │
         │  Port 8082            │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Amazon Nova Sonic 2  │
         │  (Amazon Bedrock)     │
         │  Bidirectional Stream │
         └───────────────────────┘
```

## Tech Stack

- **Backend**: Python 3.11+ with FastAPI, WebSockets, aws-sdk-bedrock-runtime
- **Frontend**: React 18 + Vite + Tailwind CSS (main app) + Standalone HTML (2-party demo)
- **AI Model**: Amazon Nova Sonic 2 (`amazon.nova-2-sonic-v1:0`)
- **Cloud**: Amazon Bedrock (us-east-1)

## Supported Languages

The system supports real-time translation between the following languages:

- English (US, UK, Australia, India)
- Spanish (US)
- French
- Italian
- German
- Portuguese (Brazil)
- Hindi

Participants can select any supported language, and the system will automatically translate between them in real-time.

## Prerequisites

- Python 3.11+
- Node.js 20+
- AWS Account with Bedrock access enabled for Nova Sonic
- AWS credentials configured (`~/.aws/credentials` or environment variables)

## Quick Start

### 1. Clone and Install

```bash
# Install Node.js dependencies (for frontend)
npm install

# Setup Python backend
cd packages/backend-python
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure AWS Credentials

Ensure AWS credentials are available via one of:
- `~/.aws/credentials` file with `[default]` profile
- Environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`

### 3. Run the Application

**Terminal 1 - Python Backend (2-Party Server):**
```bash
cd packages/backend-python
source venv/bin/activate
python two_party_server.py
# Server starts on ws://localhost:8082
```

**Terminal 2 - Frontend:**
```bash
npm run dev --workspace=packages/frontend
# Opens http://localhost:5173
```

### 4. Test 2-Party Translation

1. Open `http://localhost:5173/` in **two browser windows**
2. In both windows, enter the same **Session ID** (e.g., "demo-123")
3. Window 1: Select your preferred language (e.g., English)
4. Window 2: Select a different language (e.g., Spanish)
5. Click **"Connect to Session"** in both
6. Start speaking - each participant hears the other in their selected language!

## Project Structure

```
├── packages/
│   ├── backend-python/          # Python backend (ACTIVE)
│   │   ├── nova_sonic_client.py # Nova Sonic integration
│   │   ├── server.py            # Single-user WebSocket server
│   │   ├── two_party_server.py  # 2-party call server
│   │   └── requirements.txt
│   └── frontend/
│       ├── src/                  # 2-party demo application
├── package.json                  # Monorepo root
└── README.md
```

## Available Servers

| Server | Port | Description |
|--------|------|-------------|
| `server.py` | 3001 | Single-user mode with speaker toggle |
| `two_party_server.py` | 8082 | 2-party mode (recommended for demo) |
| Frontend (Vite) | 5173 | React app + static HTML demo |

## Features

- ✅ Real-time speech-to-speech translation
- ✅ Multi-language support (10+ language variants)
- ✅ Automatic language detection
- ✅ 2-party communication (separate browser windows)
- ✅ Live transcription display
- ✅ Session metrics (latency, audio stats)
- ✅ Low-latency endpointing

## Troubleshooting

**"Connection failed" error:**
- Ensure Python backend is running on correct port
- Check AWS credentials are configured

**No audio playback:**
- Click anywhere on the page first (browser autoplay policy)
- Check browser microphone permissions

**High latency:**
- Ensure you're in `us-east-1` region
- Check network connectivity to AWS

## Important Notes

- **This is a demonstration/proof-of-concept only**
- **Not intended for production use**
- **No warranty or support provided**
- **Use at your own risk**

## License

MIT - Internal use only
