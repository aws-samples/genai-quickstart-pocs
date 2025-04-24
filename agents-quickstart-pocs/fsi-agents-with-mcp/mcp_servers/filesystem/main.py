import uuid

from InlineAgent.tools import MCPStdio
from InlineAgent.action_group import ActionGroup
from InlineAgent.agent import InlineAgent
from InlineAgent import AgentAppConfig

# Import the configuration
from config import config

# Load the Bedrock configuration
bedrock_config = AgentAppConfig()

# Generate a UUID for this session
session_uuid = str(uuid.uuid4())


async def main():
    filesystem_mcp_client = await MCPStdio.create(server_params=config.server_params)

    try:
        filesystem_action_group = ActionGroup(
            name="FileSystemActionGroup",
            mcp_clients=[filesystem_mcp_client],
        )

        # Demonstrate file operations
        await InlineAgent(
            foundation_model="us.anthropic.claude-3-5-sonnet-20241022-v2:0",
            instruction=f"""You are an assistant that helps with filesystem operations. You have access to the following capabilities:

1. Read File (read_file)
   - Read complete contents of a file with UTF-8 encoding
   - Usage: Provide the file path

2. Read Multiple Files (read_multiple_files)
   - Read several files simultaneously
   - Failed reads won't stop the entire operation
   - Usage: Provide an array of file paths

3. Write File (write_file)
   - Create new files or overwrite existing ones
   - Exercise caution when overwriting files
   - Usage: Provide the file path and content

4. Edit File (edit_file)
   - Make selective edits using pattern matching
   - Features include line-based matching, whitespace normalization, and indentation preservation
   - Usage: Provide file path, edit operations, and optionally use dry run mode

5. Create Directory (create_directory)
   - Create new directories, including parent directories if needed
   - Usage: Provide the directory path

6. List Directory (list_directory)
   - Show directory contents with file/directory indicators
   - Usage: Provide the directory path

7. Move File (move_file)
   - Move or rename files and directories
   - Usage: Provide source and destination paths

8. Search Files (search_files)
   - Find files/directories recursively with pattern matching
   - Usage: Provide starting directory and search pattern

9. Get File Info (get_file_info)
   - Retrieve file metadata (size, timestamps, type, permissions)
   - Usage: Provide the file path

10. List Allowed Directories (list_allowed_directories)
    - Show all accessible directories
    - No input required

For all operations, use absolute paths within the /projects directory structure.

IMPORTANT GUIDELINES:
1. Always write your output files to the /projects/output directory
2. For each file or directory you create, use this session's UUID as part of the path: {session_uuid}
3. For example: "/projects/output/{session_uuid}/your_filename.txt"
4. This ensures each run creates files in a unique location
5. This path structure matches the code interpreter output directory

When creating content:
- Be specific and practical
- Structure content appropriately for the file type
- Ensure proper formatting and organization
""",
            agent_name="filesystem_agent",
            action_groups=[filesystem_action_group],
        ).invoke(
            input_text=f"Can you write a python script to calculate PI, and save it to pi.py'."
        )

    finally:
        await filesystem_mcp_client.cleanup()


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
