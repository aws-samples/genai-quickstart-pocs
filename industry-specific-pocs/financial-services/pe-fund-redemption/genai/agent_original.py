from bedrock_agentcore import BedrockAgentCoreApp
from agent_config import create_strands_agent

app = BedrockAgentCoreApp()

@app.entrypoint
async def agent_invocation(payload):
    user_message = payload.get("prompt", "No prompt found in input...")
    model_selected = payload.get("model", "us.amazon.nova-micro-v1:0")
    model_persona = payload.get("personality", "basic")
    print(f'Model parameters {model_selected}, {model_persona}')
    agent = create_strands_agent(model=model_selected, personality=model_persona)
    # tell UI to reset
    yield {"type": "start"}

    try:
        async for event in agent.stream_async(user_message):
            txt = event.get("data")
            if isinstance(txt, str) and txt:
                # UI will JSON.parse(e.data) and route by type
                yield {"type": "token", "text": txt}
    except Exception as e:
        # optional: surface errors to UI
        yield {"type": "error", "message": str(e)}

    # done marker for UI to stop spinners, etc.
    yield {"type": "done"}

if __name__ == "__main__":
    app.run()
