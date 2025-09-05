"""
LangFuse monitoring integration for the GenAI Sales Analyst application.
"""
import uuid
from typing import Dict, Any, Optional, List
import os


class LangfuseMonitor:
    """
    Manages LangFuse monitoring integration.
    """
    
    def __init__(self, public_key: str, secret_key: str, host: str = None):
        """
        Initialize the LangFuse monitor.
        
        Args:
            public_key: LangFuse public API key
            secret_key: LangFuse secret API key
            host: Optional LangFuse host URL
        """
        try:
            # Import langfuse
            from langfuse import Langfuse
            
            # Initialize Langfuse client
            langfuse_args = {
                "public_key": public_key,
                "secret_key": secret_key
            }
            
            # Add host if provided
            if host:
                langfuse_args["host"] = host
                
            self.client = Langfuse(**langfuse_args)
            self.enabled = True
            print("LangFuse monitoring enabled")
        except ImportError:
            print("Langfuse package not installed. Monitoring will be disabled.")
            self.enabled = False
        except Exception as e:
            print(f"Error initializing LangFuse: {str(e)}")
            self.enabled = False
    
    def log_interaction(self, 
                       prompt: str, 
                       response: str, 
                       metadata: Dict[str, Any],
                       trace_id: Optional[str] = None) -> Optional[str]:
        """
        Log an interaction to LangFuse.
        
        Args:
            prompt: The prompt sent to the model
            response: The response from the model
            metadata: Additional metadata about the interaction
            trace_id: Optional trace ID to link related interactions (ignored in v3)
            
        Returns:
            Trace ID or None if monitoring is disabled
        """
        if not self.enabled:
            return None
            
        try:
            # Create a generation using context manager with completion included directly
            with self.client.start_as_current_generation(
                name=metadata.get("step_name", "model_call"),
                model=metadata.get("model_id", "anthropic.claude-3-sonnet"),
                prompt=prompt,
                completion=response,  # Include completion directly
                metadata=metadata
            ):
                pass  # No need to call end() since completion is included
            
            # Ensure data is sent
            self.client.flush()
            
            # Get the current trace ID
            current_trace_id = self.client.get_current_trace_id()
            return current_trace_id
        except Exception as e:
            print(f"Error logging to LangFuse: {str(e)}")
            return None
    
    def log_workflow(self, 
                    workflow_name: str, 
                    steps: List[Dict[str, Any]], 
                    metadata: Dict[str, Any]) -> Optional[str]:
        """
        Log a complete workflow execution to LangFuse.
        
        Args:
            workflow_name: Name of the workflow
            steps: List of workflow steps with their details
            metadata: Additional metadata about the workflow
            
        Returns:
            Trace ID or None if monitoring is disabled
        """
        if not self.enabled:
            return None
            
        try:
            # Create a main workflow span
            with self.client.start_as_current_span(
                name=workflow_name,
                metadata=metadata
            ):
                # Log each step as a span
                for step in steps:
                    with self.client.start_as_current_span(
                        name=step.get("name", "unknown_step"),
                        metadata=step.get("metadata", {})
                    ):
                        # Span is automatically ended when the context manager exits
                        pass
            
            # Ensure data is sent
            self.client.flush()
            
            # Get the current trace ID
            current_trace_id = self.client.get_current_trace_id()
            return current_trace_id
        except Exception as e:
            print(f"Error logging workflow to LangFuse: {str(e)}")
            return None
    
    def log_error(self, error_message: str, metadata: Dict[str, Any] = None) -> None:
        """
        Log an error to LangFuse.
        
        Args:
            error_message: Error message
            metadata: Additional metadata about the error
        """
        if not self.enabled:
            return
            
        try:
            if metadata is None:
                metadata = {}
                
            # Create an error span
            with self.client.start_as_current_span(
                name="error",
                metadata={
                    **metadata,
                    "error_message": error_message,
                    "level": "error"
                }
            ):
                # Span is automatically ended when the context manager exits
                pass
            
            # Create a score for the error
            trace_id = self.client.get_current_trace_id()
            if trace_id:
                self.client.create_score(
                    name="error",
                    value=0,  # 0 indicates failure
                    trace_id=trace_id
                )
            
            # Ensure data is sent
            self.client.flush()
        except Exception as e:
            print(f"Error logging error to LangFuse: {str(e)}")
            return