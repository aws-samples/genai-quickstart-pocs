# Python Backend - Nova Sonic Integration

Real-time speech-to-speech translation using Amazon Nova 2.5 Sonic.

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

## Network Binding

Both servers bind to `127.0.0.1` by default, so they accept connections only
from the machine they run on. The bind address comes from `SERVER_HOST`
(see `config.py` and `.env.example`):

```bash
# Default: loopback only
python two_party_server_fastapi.py

# Opt in to another address, for example inside a container
SERVER_HOST=0.0.0.0 python two_party_server_fastapi.py
```

If you run the backend in a container, set `SERVER_HOST=0.0.0.0` inside the
container and publish the port to loopback on the host
(`docker run -p 127.0.0.1:8082:8082 ...`), not to all interfaces. These servers
have no authentication, so do not expose them on a public or shared network.

> `HOST` is no longer read by `two_party_server_fastapi.py`; use `SERVER_HOST`.

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
