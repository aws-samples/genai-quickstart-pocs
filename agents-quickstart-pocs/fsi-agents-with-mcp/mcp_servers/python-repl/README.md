# Python REPL MCP Server

> **EXPERIMENTAL: This MCP server is experimental and carries significant risks since it executes Python code locally on your machine. Use with extreme caution in controlled environments only.**

This documentation demonstrates how to use MCP server to execute Python code, install packages, and maintain state across multiple executions through a Python REPL (Read-Eval-Print Loop) interface.

## Features

- Run arbitrary Python code and get the output
- Variables and imports persist between executions in the same session
- Install Python packages using `uv` (a faster alternative to pip)
- List variables, reset the session when needed for session management

## Setup

1. Activate virtual environment from project's root directory.

   ```bash
   # On macOS and Linux.
   source .venv/bin/activate
   ```

   ```bash
   # On Windows.
   .venv\Scripts\activate
   ```

2. Run the example.
   ```bash
   python main.py
   ```

## Tools

Tool: `execute_python`

Executes Python code in a persistent environment. Code runs in a session where variables and imports persist between executions. Returns the output of the code execution, any error messages, or the result of the last expression if there's no output.

| Parameters | Description                                                    |
| ---------- | -------------------------------------------------------------- |
| code       | Python code to execute                                         |
| reset      | Optional. If true, resets the session and clears all variables |

Tool: `list_variables`

Lists all variables currently defined in the session. Provides visibility into the current state of the Python environment.

Tool: `install_package`

Installs a Python package using uv. Allows adding new packages to the Python environment for use in subsequent code executions.

| Parameters | Description                              |
| ---------- | ---------------------------------------- |
| package    | Package name to install (e.g., 'pandas') |

## Example Queries

- "Show me an example of using pandas to process the data in Python dictionary."
- "Create a sample code that executes binary search and list of all variable names."
- "Can you create an ARIMA model and forecast on synthetic financial data?"
- "How can I get started with scikit-learn for training classification model?"
