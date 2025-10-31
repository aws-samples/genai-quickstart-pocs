# Hotel reservation system implementation using Amazon Nova Sonic model

## Overview of Solution

This Python implementation demonstrates real-time audio streaming integration with AWS Bedrock's Nova Sonic  model. It enables natural conversational interactions, featuring a specific demonstration for a hotel reservation agent use case. The sample also demonstrates toolUse integration with the Amazon Nova Sonic model for creating reservations, modifying reservations and cancellation of reservation.

## Goal of this Implementation

This demo is a simple simulation of a hotel reservation agent that is able to look up the guest information.  User selects a persona for the interaction. The agent will greet you by name of the selected persona and ask how they could help. This is not a complete implementation, asking questions unrelated to the list below may not give proper results.

-You can ask the agent for the following information related to your reservation:
-- Do I have any reservations?
-- I would like to modify that reservation.  
-- I would like to cancel that reservation.
-- Are there rooms available in {city} for {check in date} to {check out date}, where city is one of ["New York", "Los Angeles", "Chicago", "Miami", "Las Vegas"]
-- I would like to make a reservation for {city} for the next 3 days. ( Will ask you what type of room, and correctly do the date math)

When a user interacts with the system:

   - User speaks into their microphone, which captures audio input
   - Audio is streamed to Amazon Nova Sonic model
   - Model processes the audio and generates appropriate responses
   - System plays back audio responses through speakers
   - Transcripts are displayed in the console interface

During the conversation:
   - Your speech will be transcribed and shown as "User: [transcript]"
   - The Nova Sonic's responses will be shown as "Assistant: [response]"
   - Audio responses will be played through your speakers
   - you can barge in on the response, so make sure to wear a headset rather than open speakers for you test or the system hear's itself and barges in.

 To end the conversation:
   - Press Enter at any time
   - The script will properly close the connection and exit

## How to use this Repository:

### Prerequisites:

1. [Python 3.12](https://www.python.org/downloads/)
2. [AWS Account](https://aws.amazon.com/) with Bedrock access
3. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) configured
4. Working microphone and speakers
5. [IAM permissions] 

### Steps

1. Clone the repository to your local machine.

    ```
    git clone https://github.com/aws-samples/genai-quickstart-pocs.git
    ```
    
    The file structure of this POC is broken into these files

    * `requirements.txt` - all the requirements needed to get the sample application up and running.
    * `nova_s2s_tool_use_hotel.py` - The streamlit frontend
    *  `hotel_reservation_system` python code that simulates hotel reservation system with APIs for creating reservation, modifcation and cancellation 

2. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```zsh
    cd genai-quickstart-pocs-python/amazon-bedrock-nova-sonic-poc
    ```

3. Configure the python virtual environment, activate it & install project dependencies. *Note: each POC has it's own dependencies & dependency management.*
    ```zsh
    python -m venv .env
    source .env/bin/activate
    pip install -r requirements.txt
    ```

4. Configure AWS credentials:
```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"
```
5. Make sure you have headpones on
The system allows for barge in, so if your mic can hear your speakers it may barge in on itself.

6. Run the application:
```bash
python reservation_agent_demo.py
# Or with debug mode
python reservation_agent_demo.py --debug
```

## Known Limitation
> **Warning:** Use a headset for testing, as a known issue with PyAudio affects its handling of echo. You may experience unexpected interruptions if running the samples with open speakers.

## How-To Guide

For detailed instructions on using this implementation, including troubleshooting and customization options, visit [HOWTO.md](HOWTO.md)
