#!/usr/bin/env python3
"""
Simple Strands Calculator Agent

This example demonstrates how to create a basic Strands agent that uses
the calculator tool from the strands-agents-tools library.

Cross-platform compatible (Windows, macOS, Linux).
"""

from strands import Agent
from strands_tools.calculator import calculator

def main():
    """
    Create and demonstrate a simple calculator agent.
    """
    # Create a Strands agent with calculator tool
    agent = Agent(
        name="Calculator Agent",
        description="A calculator agent that can perform mathematical operations.",
        tools=[calculator],
        system_prompt="You are a helpful calculator assistant. You can perform various mathematical operations including basic arithmetic, trigonometry, logarithms, and more. Always show your work and explain the steps when performing calculations."
    )
    
    # Consistent interactive testing banner
    print("🧪 Interactive Testing (Local Strands Agent)")
    print("=" * 60)
    print("This will test the agent locally using the Strands runtime.")
    print("Type 'quit' to exit testing.")
    print()
    
    while True:
        try:
            # Get user input (consistent prompt)
            user_input = input("Enter a calculation to test: ").strip()
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("Goodbye! 👋")
                break
            
            if not user_input:
                continue
            
            # Consistent UX formatting
            print(f"\n🤔 Testing: {user_input}")
            print("-" * 40)
            print("Processing your request via Local Strands Agent...")

            # Get response from agent
            response = agent(user_input)

            # Attempt to extract just the final answer for consistency
            try:
                import re
                result_text = str(response)
                # Remove markdown code blocks and bold markers
                result_text = re.sub(r"```.*?```", "", result_text, flags=re.DOTALL)
                result_text = re.sub(r"\*\*(.*?)\*\*", r"\1", result_text)
                result_text = re.sub(r"\s+", " ", result_text).strip()

                answer_match = re.search(r"Answer:\s*(.+)", result_text, re.IGNORECASE)
                if answer_match:
                    clean_answer = answer_match.group(1).strip()
                    print(f"🎯 Answer: {clean_answer}")
                else:
                    print("📝 Response:")
                    print(result_text)
            except Exception:
                print("📝 Response:")
                print(response)

            print("-" * 40)
            print()
            
        except KeyboardInterrupt:
            print("\n\nGoodbye! 👋")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")
            print()

if __name__ == "__main__":
    main() 