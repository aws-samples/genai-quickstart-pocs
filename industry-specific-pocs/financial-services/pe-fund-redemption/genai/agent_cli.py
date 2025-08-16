#!/usr/bin/env python3
import asyncio, io, re, contextlib
from agent_config import create_strands_agent

GREEN = "\033[92m"; RESET = "\033[0m"
OPEN = re.compile(r"<\s*thinking\s*>", re.I)
CLOSE = re.compile(r"<\s*/\s*thinking\s*>", re.I)

def colorize_thinking(s: str) -> str:
    return CLOSE.sub(RESET, OPEN.sub(GREEN, s)) + RESET

async def main():
    agent = create_strands_agent()
    print("🤖 Strands CLI Chatbot - Type 'quit' to exit\n" + "-"*50)
    while True:
        try:
            u = input("\nYou: ").strip()
            if u.lower() in {"quit","exit","q"}: print("Goodbye! 👋"); break
            if not u: continue
            print("\nBot: ", end="", flush=True)

            # Silence any internal prints from the SDK during invoke_async
            out_buf, err_buf = io.StringIO(), io.StringIO()
            with contextlib.redirect_stdout(out_buf), contextlib.redirect_stderr(err_buf):
                resp = await agent.invoke_async(u)

            print(colorize_thinking(str(resp)))
        except KeyboardInterrupt:
            print("\n\nGoodbye! 👋"); break
        except Exception as e:
            print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
