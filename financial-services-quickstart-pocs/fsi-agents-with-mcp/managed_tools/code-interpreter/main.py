import asyncio
import datetime

from InlineAgent.agent import InlineAgent


async def main():
    # Get current date
    current_date = datetime.datetime.now().strftime("%Y-%m-%d")

    # Create the InlineAgent with just the Code Interpreter
    response = await InlineAgent(
        foundation_model="us.anthropic.claude-3-5-sonnet-20241022-v2:0",
        instruction=f"""You are a helpful coding assistant that can write and execute Python code.

Today's date is: {current_date}

You have access to a code interpreter that can execute Python code. Use it to:
- Create data visualizations
- Perform data analysis
- Solve mathematical problems
- Generate example code
- Test algorithms
- Process and transform data

When using the code interpreter:
- Write clear, well-commented code
- Handle errors gracefully
- Display results visually when appropriate
- Explain your approach before coding
""",
        agent_name="code_interpreter_assistant",
        action_groups=[
            {
                "name": "CodeInterpreter",
                "builtin_tools": {
                    "parentActionGroupSignature": "AMAZON.CodeInterpreter"
                },
            },
        ],
    ).invoke(
        input_text="Create a visualization showing the Fibonacci sequence up to the 20th number. Include a scatter plot and a line chart on the same figure with different colors. Add proper labels and a title."
    )

    return response


if __name__ == "__main__":
    asyncio.run(main())
