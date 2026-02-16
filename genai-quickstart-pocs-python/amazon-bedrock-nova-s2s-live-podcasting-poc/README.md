# Amazon Bedrock Nova S2S Live Podcasting POC

## Overview of Solution

This proof-of-concept demonstrates how to use [Amazon Nova Sonic](https://docs.aws.amazon.com/nova/latest/userguide/speech.html) on [Amazon Bedrock](https://aws.amazon.com/bedrock/) to generate a live AI-powered podcast conversation. Two AI hosts — Matthew and Tiffany — engage in a multi-turn spoken dialogue about any topic you provide, with real-time audio and text streamed through a web interface.

The application uses the [Amazon Bedrock bidirectional streaming API](https://docs.aws.amazon.com/nova/latest/userguide/speech-bidirection.html) (`InvokeModelWithBidirectionalStream`) to send prompts and receive both text and audio responses from Amazon Nova Sonic. A Flask web server orchestrates the conversation, alternating between two AI speakers with distinct voices. Unlike other POCs in this repository that use Streamlit, this sample uses Flask with Server-Sent Events (SSE) to support real-time bidirectional audio streaming, which requires persistent connections that Streamlit does not natively support.

![Amazon Bedrock Nova S2S Live Podcasting POC](images/demo.png)

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
├── templates/
│   └── live_podcast.html       # Web UI
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

## License

This library is licensed under the MIT-0 License. See the [LICENSE](LICENSE) file.
