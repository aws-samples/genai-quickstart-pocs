"""
ServiceNow Chatbot Agent

This module provides the main chatbot agent that handles user queries
and uses ServiceNow MCP tools to manage incidents.
"""

import json
from typing import Dict, List, Any, Optional
from datetime import datetime
from strands import Agent, tool
from strands_tools import swarm, file_write
from config import CHATBOT_CONFIG
from mcp import StdioServerParameters, stdio_client
from strands.tools.mcp import MCPClient
from config import SERVICENOW_MCP_CONFIG
from config import AWS_CONFIG

class ServiceNowChatbot:
    """Main chatbot agent for ServiceNow incident management"""
    
    def __init__(self):
        self.conversation_history = []
        self.agent = None
        self.mcp_client = None
        self.tools = []
        self.initialize_agent()
    
    def initialize_agent(self):
        """Initialize the chatbot agent with tools and system prompt"""
        try:
            # Connect to ServiceNow MCP server and discover tools
            self.mcp_client = MCPClient(
                lambda: stdio_client(
                    StdioServerParameters(
                        command=SERVICENOW_MCP_CONFIG["command"],
                        args=SERVICENOW_MCP_CONFIG["args"],
                        env=SERVICENOW_MCP_CONFIG["env"]
                    )
                )
            )
            
            # Start the MCP client session
            self.mcp_client.__enter__()
            
            # Discover all available ServiceNow MCP tools
            self.tools = self.mcp_client.list_tools_sync()
            print(f"Discovered {len(self.tools)} ServiceNow MCP tools")
            
            # Create the main agent.
            self.agent = Agent(
                model=AWS_CONFIG["model_id"],
                system_prompt="""You are a ServiceNow Helpdesk Assistant, an AI-powered chatbot designed to help users 
                manage IT incidents and service requests. You have access to ServiceNow through MCP tools and can 
                perform various incident management tasks.
                
                Your capabilities include:
                1. **Creating Incidents**: Create new incidents with proper categorization, priority, and assignment
                2. **Searching Incidents**: Find existing incidents based on various criteria
                3. **Updating Incidents**: Modify incident details, status, and assignments
                4. **Getting Incident Details**: Retrieve comprehensive information about specific incidents
                5. **Searching Knowledge Base**: Find solutions and knowledge articles for common issues
                6. **Trend Analysis**: Analyze recent incidents for patterns and insights
                
                **Guidelines for responses:**
                - Always be helpful, professional, and concise
                - Ask clarifying questions when needed
                - Provide step-by-step guidance when appropriate
                - Use the available tools to perform actions
                - Explain what you're doing and why
                - Offer to help with follow-up tasks
                
                **Common user requests you can handle:**
                - "Create an incident for [description]"
                - "Search for incidents related to [topic]"
                - "Update incident [number] with [changes]"
                - "Show me details for incident [number]"
                - "Find solutions for [problem]"
                - "What are the recent trends in incidents?"
                - "Help me resolve [specific issue]"
                
                Use the available tools to perform actions and provide helpful responses to users.
                """,
                tools=self.tools + [file_write]
            )
        except Exception as e:
            print(f"Error initializing agent: {str(e)}")
    
    def process_message(self, user_message: str) -> str:
        """
        Process a user message and return a response
        
        Args:
            user_message: The user's input message
            
        Returns:
            Bot response
        """
        try:
            # Add message to conversation history
            self.conversation_history.append({
                "role": "user",
                "content": user_message,
                "timestamp": datetime.now().isoformat()
            })
            
            # Limit conversation history
            if len(self.conversation_history) > CHATBOT_CONFIG["max_conversation_history"] * 2:
                self.conversation_history = self.conversation_history[-CHATBOT_CONFIG["max_conversation_history"] * 2:]
            
            # Prepare context with conversation history
            context = self._prepare_context(user_message)
            
            # Get response from agent
            if self.agent:
                response = str(self.agent(context))
            else:
                response = "I apologize, but I'm having trouble connecting to my tools. Please try again later."
            
            # Add response to conversation history
            self.conversation_history.append({
                "role": "assistant",
                "content": response,
                "timestamp": datetime.now().isoformat()
            })
            
            return response
            
        except Exception as e:
            error_response = f"I encountered an error while processing your request: {str(e)}. Please try again."
            return error_response
    
    def _prepare_context(self, user_message: str) -> str:
        """
        Prepare context for the agent including conversation history and available tools
        
        Args:
            user_message: Current user message
            
        Returns:
            Formatted context string
        """
        # Build context with recent conversation history
        context_parts = [
            "You are a ServiceNow Helpdesk Assistant. Here's the current conversation context:",
            ""
        ]
        
        # Add recent conversation history (last 4 exchanges)
        recent_history = self.conversation_history[-8:] if len(self.conversation_history) > 8 else self.conversation_history
        for msg in recent_history:
            role = "User" if msg["role"] == "user" else "Assistant"
            context_parts.append(f"{role}: {msg['content']}")
        
        context_parts.extend([
            "",
            "Available ServiceNow Tools:",
            "- create_incident(short_description, description, category, priority, assignment_group)",
            "- search_incidents(query, limit)",
            "- update_incident(incident_id, updates)",
            "- get_incident(incident_id)",
            "- search_knowledge(query, limit)",
            "- list_recent_incidents(days, limit)",
            "",
            "Current user message:",
            user_message,
            "",
            "Please respond to the user's request using the available tools when appropriate."
        ])
        
        return "\n".join(context_parts)
    
    def get_conversation_history(self) -> List[Dict[str, Any]]:
        """Get the conversation history"""
        return self.conversation_history.copy()
    
    def clear_conversation_history(self):
        """Clear the conversation history"""
        self.conversation_history = []
    
    def save_conversation(self, filename: str = None) -> str:
        """
        Save the current conversation to a file
        
        Args:
            filename: Optional filename, will generate one if not provided
            
        Returns:
            Saved filename
        """
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"conversation_{timestamp}.json"
        
        try:
            conversation_data = {
                "timestamp": datetime.now().isoformat(),
                "conversation": self.conversation_history
            }
            
            with open(filename, 'w') as f:
                json.dump(conversation_data, f, indent=2)
            
            return filename
        except Exception as e:
            return f"Error saving conversation: {str(e)}"
    
    def analyze_trends(self) -> str:
        """
        Analyze recent incident trends
        
        Returns:
            Trend analysis report
        """
        try:
            # For now, return a message indicating this feature needs to be implemented
            # with the new MCP approach
            return "Trend analysis feature is being updated to work with the new MCP implementation. Please use the agent's tools directly for incident analysis."
            
        except Exception as e:
            return f"Error analyzing trends: {str(e)}"
    
    def cleanup(self):
        """Cleanup resources"""
        try:
            if self.mcp_client:
                self.mcp_client.__exit__(None, None, None)
        except:  # nosec B110 - intentional pass for cleanup operations
            pass


# Global instance
chatbot = ServiceNowChatbot() 