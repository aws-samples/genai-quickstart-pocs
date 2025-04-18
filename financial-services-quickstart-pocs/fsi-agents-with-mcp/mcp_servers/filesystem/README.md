# Filesystem Operations with InlineAgent

This documentation demonstrates how to use MCP server to perform a wide range of file and directory operations on your local filesystem. Note that all actions are performed only in the mounted directory of `/projects` within this repository.

## Features

- Complete file management capabilities
- Secure access limited to specific mounted directories
- Advanced file editing with pattern matching
- Detailed file metadata and search functionality
- UUID-based output paths for unique file organization

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

2. Ensure you have Docker installed and running on your system

   ```bash
   docker ps  # Should return the list of running containers
   ```

3. Pull the [required Docker image](https://hub.docker.com/r/mcp/filesystem).

   ```bash
   docker pull mcp/filesystem
   ```

4. Run the example.
   ```bash
   python main.py
   ```

## Tools

Tool: `create_directory`

Create a new directory or ensure a directory exists.

| Parameters | Description                                    |
| ---------- | ---------------------------------------------- |
| path       | The path where the directory should be created |

Tool: `directory_tree`

Get a recursive tree view of files and directories as a JSON structure.

| Parameters | Description                             |
| ---------- | --------------------------------------- |
| path       | The path to get the directory tree from |

Tool: `edit_file`

Make line-based edits to a text file.

| Parameters | Description                                           |
| ---------- | ----------------------------------------------------- |
| edits      | Array of edit operations to perform                   |
| path       | The path of the file to edit                          |
| dryRun     | Optional. Preview changes using git-style diff format |

Tool: `get_file_info`

Retrieve detailed metadata about a file or directory.

| Parameters | Description                                                |
| ---------- | ---------------------------------------------------------- |
| path       | The path of the file or directory to get information about |

Tool: `list_allowed_directories`

Returns the list of directories that this server is allowed to access.

Tool: `list_directory`

Get a detailed listing of all files and directories in a specified path.

| Parameters | Description                    |
| ---------- | ------------------------------ |
| path       | The path to list contents from |

Tool: `move_file`

Move or rename files and directories.

| Parameters  | Description                                                      |
| ----------- | ---------------------------------------------------------------- |
| source      | The source path of the file or directory                         |
| destination | The destination path where the file or directory should be moved |

Tool: `read_file`

Read the complete contents of a file from the file system.

| Parameters | Description                  |
| ---------- | ---------------------------- |
| path       | The path of the file to read |

Tool: `read_multiple_files`

Read the contents of multiple files simultaneously.

| Parameters | Description                 |
| ---------- | --------------------------- |
| paths      | Array of file paths to read |

Tool: `search_files`

Recursively search for files and directories matching a pattern.

| Parameters      | Description                                            |
| --------------- | ------------------------------------------------------ |
| path            | The starting path to search from                       |
| pattern         | The pattern to match against file and directory names  |
| excludePatterns | Optional. Array of patterns to exclude from the search |

Tool: `write_file`

Create a new file or completely overwrite an existing file with new content.

| Parameters | Description                               |
| ---------- | ----------------------------------------- |
| path       | The path where the file should be written |
| content    | The content to write to the file          |

## Example Queries

- "Can you write a python script named `calculator.py` that implements functions for a simple calculator?"
- "Can you summarize what's in the `content.txt` file?"
- "Search through all files in the directory and tell me which file stores configuration."
- "Please create a backup directory and copy all .json files into it."
- "Can you analyze the size and last modified dates of all log files in the logs directory?"
