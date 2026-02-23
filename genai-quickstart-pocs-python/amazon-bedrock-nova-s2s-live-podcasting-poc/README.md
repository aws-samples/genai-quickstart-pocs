# Amazon Bedrock Nova S2S Live Podcasting POC

> **⚠️ Important:** This is sample/demo code intended for educational and prototyping purposes. It requires additional security hardening, testing, and validation before any production use. Use at your own risk.

## Overview of Solution

This proof-of-concept demonstrates how to use [Amazon Nova Sonic](https://docs.aws.amazon.com/nova/latest/userguide/speech.html) on [Amazon Bedrock](https://aws.amazon.com/bedrock/) to generate a live AI-powered podcast conversation. Two AI hosts — Matthew and Tiffany — engage in a multi-turn spoken dialogue about any topic you provide, with real-time audio and text streamed through a web interface.

The application uses the [Amazon Bedrock bidirectional streaming API](https://docs.aws.amazon.com/nova/latest/userguide/speech-bidirection.html) (`InvokeModelWithBidirectionalStream`) to send prompts and receive both text and audio responses from Amazon Nova Sonic. A Flask web server orchestrates the conversation, alternating between two AI speakers with distinct voices. Unlike other POCs in this repository that use Streamlit, this sample uses Flask with Server-Sent Events (SSE) to support real-time bidirectional audio streaming, which requires persistent connections that Streamlit does not natively support.

## Architecture

```
┌──────────┐     POST /generate      ┌──────────────┐    Bidirectional     ┌─────────────────┐
│  Browser  │ ◄──── SSE stream ────► │  Flask Server │ ◄── streaming ────► │ Amazon Bedrock   │
│  (Web UI) │                        │  (Python)     │                     │ (Nova Sonic)     │
└──────────┘                         └──────────────┘                     └─────────────────┘
```

### Features

- Dual AI hosts (Matthew and Tiffany) with distinct Nova Sonic voices
- Real-time audio generation and server-side playback
- Server-Sent Events (SSE) for live transcript streaming to the browser
- Web-based UI for topic input and conversation display
- Standalone CLI mode with text, audio, and mixed interaction options

## Prerequisites

- [Python](https://www.python.org/downloads/) 3.8 or later
- [AWS account](https://aws.amazon.com/free/) with [Amazon Bedrock model access](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html) enabled for **Amazon Nova Sonic** (`amazon.nova-2-sonic-v1:0`) in `us-east-1`
- AWS credentials configured (via environment variables, AWS CLI, or IAM role)
- macOS for server-side audio playback (uses `afplay`)

## Setup

1. Clone the repository and navigate to this POC:

    ```bash
    git clone https://github.com/aws-samples/genai-quickstart-pocs.git
    cd genai-quickstart-pocs/genai-quickstart-pocs-python/amazon-bedrock-nova-s2s-live-podcasting-poc
    ```

2. Create a virtual environment and install dependencies:

    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    ```

3. Configure AWS credentials using one of the following methods:

    **Option A — Environment file (recommended for local development):**

    ```bash
    cp .env.example .env
    # Edit .env and add your AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION
    ```

    **Option B — AWS CLI:**

    ```bash
    aws configure
    ```

    **Option C — IAM role (recommended for production):**

    Attach an IAM role with `bedrock:InvokeModelWithResponseStream` permission for `arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-2-sonic-v1:0`.

## Usage

### Web interface (podcast mode)

```bash
python3 live_podcast_simple.py
```

Open http://localhost:5002 in your browser, enter a topic, and click **Start Live Podcast**.

### CLI mode (interactive chat)

```bash
# Interactive mode selector
python3 nova_sonic_client.py

# Or specify a mode directly
python3 nova_sonic_client.py --mode text    # Text-only chat
python3 nova_sonic_client.py --mode audio   # Voice chat (requires microphone)
python3 nova_sonic_client.py --mode mixed   # Voice + text simultaneously
```

## Project Structure

```
├── live_podcast_simple.py      # Flask web application (podcast generator)
├── nova_sonic_client.py        # Amazon Bedrock streaming client and CLI chat
├── guardrails.py               # Topic validation and PII output filtering
├── templates/
│   └── live_podcast.html       # Web UI
├── test_prompt_guardrails.py   # Tests for prompt-level guardrails
├── test_extended_guardrails.py # Tests for topic validation and PII filtering
├── requirements.txt            # Python dependencies
├── .env.example                # Example environment variables
├── run_podcast.sh              # Helper script to start the server
├── CONTRIBUTING.md             # Contribution guidelines
├── LICENSE                     # MIT-0 License
└── README.md
```

## Configuration

| Parameter | Default | File | Description |
|-----------|---------|------|-------------|
| Rounds | 10 | `live_podcast_simple.py` | Number of conversation exchanges |
| Voices | `matthew`, `tiffany` | `live_podcast_simple.py` | Amazon Nova Sonic voice IDs |
| Port | 5002 | `live_podcast_simple.py` | Flask server port |
| `maxTokens` | 1024 | `nova_sonic_client.py` | Maximum response tokens |
| `topP` | 0.9 | `nova_sonic_client.py` | Nucleus sampling threshold |
| `temperature` | 0.7 | `nova_sonic_client.py` | Sampling temperature |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `AWS credentials not found` | Verify `.env` file exists with valid credentials, or run `aws configure` |
| `Stream initialization failed` | Confirm Amazon Nova Sonic is enabled in your [Amazon Bedrock console](https://console.aws.amazon.com/bedrock/) for `us-east-1` |
| Audio not playing | Server-side playback requires macOS (`/usr/bin/afplay`). Adapt for other platforms. |
| Timeout or empty responses | Check network connectivity and [Amazon Bedrock service health](https://health.aws.amazon.com/health/status) |

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

- Never commit `.env` files or credentials to version control
- Use IAM roles with least-privilege permissions in production
- Flask debug mode is disabled by default; enable only for local development via `FLASK_DEBUG=true`

### Guardrails

This application includes multiple layers of guardrails to keep conversations on-topic and prevent PII exposure:

| Layer | Mechanism | File |
|-------|-----------|------|
| System prompt | Scopes all conversation to AWS services; prohibits PII generation; redirects off-topic questions | `nova_sonic_client.py` |
| Per-turn prompts | Reinforces AWS focus and PII prevention on every speaker turn | `live_podcast_simple.py` |
| Topic validation | Rejects topics that don't contain AWS-related keywords (60+ terms) | `guardrails.py` |
| Output filtering | Scrubs emails, phone numbers, AWS account IDs, and access keys from model responses before streaming | `guardrails.py` |

Run the guardrail tests:

```bash
python3 -m pytest test_prompt_guardrails.py test_extended_guardrails.py -v
```

## Known Limitations

- **Demo-only guardrails** — Topic validation uses keyword matching and output filtering uses regex-based PII scrubbing. These are not substitutes for [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html), which should be evaluated for production workloads.
- **AWS-scoped topics only** — The topic validation gate restricts conversations to AWS services and cloud computing. Non-AWS topics are rejected at the API level.
- **PyAudio is demo-only** — PyAudio is used for local audio I/O in CLI mode. It requires system-level dependencies (`portaudio`) and is not suitable for production deployments. Replace with a production audio pipeline for real workloads.
- **macOS audio playback** — Server-side audio playback uses `/usr/bin/afplay`, which is macOS-specific. Other platforms will need an alternative playback mechanism.
- **No authentication** — The Flask web server has no authentication or authorization. Add appropriate access controls before exposing to users.
- **Single-threaded Flask** — The development server is not designed for concurrent users. Use a production WSGI server (e.g., Gunicorn) behind a load balancer for multi-user scenarios.
- **No persistent storage** — Conversation transcripts are streamed and not stored. Add logging or storage if audit trails are needed.
- **Prompt-based content control** — The model is instructed via prompts to stay on topic and avoid PII, but LLMs can still produce unexpected outputs. The regex output filter is a safety net, not a guarantee.

## License

This library is licensed under the MIT-0 License. See the [LICENSE](LICENSE) file.
