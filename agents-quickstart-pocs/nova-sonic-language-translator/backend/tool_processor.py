"""
Tool Processor for Nova Sonic Tool Calling

This module implements the ToolProcessor class that handles asynchronous tool
execution for Nova Sonic, enabling intelligent acronym translation decisions.
"""

import asyncio
import uuid
import logging
from typing import Dict, Any

from acronym_dictionary import ACRONYM_DICTIONARY

logger = logging.getLogger(__name__)


class ToolProcessor:
    """
    Asynchronous tool processor for handling Nova Sonic tool calls.
    
    Manages tool execution without blocking the translation stream, supporting
    concurrent tool calls and maintaining task state.
    """
    
    def __init__(self):
        """Initialize the tool processor with acronym dictionary."""
        # Initialize empty tasks dictionary for tracking active tool executions
        self.tasks: Dict[str, asyncio.Task] = {}
        
        # Load acronym dictionary into memory
        self.acronym_dictionary = ACRONYM_DICTIONARY
        
        # Set up logging for tool operations
        logger.info(f"ToolProcessor initialized with {len(self.acronym_dictionary)} acronyms")
        logger.debug(f"Loaded acronyms: {[entry['term'] for entry in self.acronym_dictionary]}")
    
    def _should_translate_acronym(self, acronym: str) -> Dict[str, Any]:
        """
        Determine if an acronym should be translated.
        
        Performs case-insensitive lookup in the acronym dictionary and returns
        structured information about the term.
        
        Args:
            acronym: The acronym to check
            
        Returns:
            Dictionary with term info and translation recommendation:
            {
                "success": bool,
                "term": str,
                "full_name": str,
                "definition": str,
                "should_translate": bool,
                "error": None or str
            }
        """
        # Perform case-insensitive lookup
        acronym_upper = acronym.upper()
        
        for entry in self.acronym_dictionary:
            if entry['term'].upper() == acronym_upper:
                # Found in dictionary - return full information
                logger.info(f"Acronym '{acronym}' found in dictionary: {entry['full_name']}")
                return {
                    "success": True,
                    "term": entry['term'],
                    "full_name": entry['full_name'],
                    "definition": entry['definition'],
                    "should_translate": False,  # Preserve known financial acronyms
                    "error": None
                }
        
        # Not found - return default "preserve acronym" response
        logger.warning(f"Acronym '{acronym}' not found in dictionary, preserving as-is")
        return {
            "success": True,
            "term": acronym,
            "full_name": "",
            "definition": "",
            "should_translate": False,  # Default to preserving unknown acronyms
            "error": None
        }
    
    async def _run_tool(self, tool_name: str, tool_content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Internal method to execute the tool logic.
        
        Routes tool calls to appropriate handler methods with error handling.
        
        Args:
            tool_name: Name of the tool to execute
            tool_content: Tool parameters
            
        Returns:
            Tool result dictionary
        """
        try:
            # Route to appropriate tool handler
            if tool_name == "should_translate_acronym":
                # Extract acronym parameter
                acronym = tool_content.get("acronym", "")
                
                if not acronym:
                    logger.error("Missing 'acronym' parameter in tool call")
                    return {
                        "success": False,
                        "term": "",
                        "full_name": "",
                        "definition": "",
                        "should_translate": False,
                        "error": "Missing required parameter: acronym"
                    }
                
                # Execute the acronym lookup
                return self._should_translate_acronym(acronym)
            
            else:
                # Unknown tool name
                logger.error(f"Unknown tool name: {tool_name}")
                return {
                    "success": False,
                    "term": "",
                    "full_name": "",
                    "definition": "",
                    "should_translate": False,
                    "error": f"Unknown tool: {tool_name}"
                }
        
        except Exception as e:
            # Catch any unexpected errors
            logger.error(f"Error executing tool '{tool_name}': {e}", exc_info=True)
            return {
                "success": False,
                "term": "",
                "full_name": "",
                "definition": "",
                "should_translate": False,
                "error": f"Tool execution error: {str(e)}"
            }
    
    async def process_tool_async(self, tool_name: str, tool_content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a tool call asynchronously.
        
        Creates an async task for tool execution, tracks it, and ensures cleanup
        after completion. Supports concurrent tool execution.
        
        Args:
            tool_name: Name of the tool to execute
            tool_content: Tool parameters and context
            
        Returns:
            Tool execution result as dictionary
        """
        # Generate unique task_id for this tool call
        task_id = str(uuid.uuid4())
        
        logger.info(f"Processing tool call: {tool_name} (task_id: {task_id})")
        logger.debug(f"Tool parameters: {tool_content}")
        
        try:
            # Create asyncio task for tool execution
            task = asyncio.create_task(self._run_tool(tool_name, tool_content))
            
            # Store task in tasks dictionary
            self.tasks[task_id] = task
            logger.debug(f"Task {task_id} created, active tasks: {len(self.tasks)}")
            
            # Await task completion and get result
            result = await task
            
            logger.info(f"Tool call completed: {tool_name} (task_id: {task_id})")
            logger.debug(f"Tool result: {result}")
            
            return result
        
        finally:
            # Remove completed task from tasks dictionary (cleanup)
            if task_id in self.tasks:
                del self.tasks[task_id]
                logger.debug(f"Task {task_id} cleaned up, remaining tasks: {len(self.tasks)}")
