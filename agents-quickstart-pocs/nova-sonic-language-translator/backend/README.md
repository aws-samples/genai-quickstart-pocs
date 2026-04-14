# Python Backend - Nova Sonic Integration

Real-time speech-to-speech translation using Amazon Nova Sonic 2.

## Setup

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Servers

### Single-User Mode (server.py)
```bash
python server.py  # Port 3001
```
One browser with speaker toggle (LO/Customer).

### 2-Party Mode (two_party_server_fastapi.py)
```bash
python two_party_server_fastapi.py  # Port 8082
```
Two separate browsers, each with their own role.

## AWS Credentials

Configure via `~/.aws/credentials` or environment variables:
```bash
export AWS_ACCESS_KEY_ID=xxx
export AWS_SECRET_ACCESS_KEY=xxx
export AWS_REGION=us-east-1
```

## Files

| File | Description |
|------|-------------|
| `nova_sonic_client.py` | Nova Sonic bidirectional streaming client |
| `server.py` | WebSocket server (single-user mode) |
| `two_party_server_fastapi.py` | WebSocket server (2-party mode) |
| `config.py` | Configuration loader |
