"""
Edge definitions for LangGraph workflows.
"""
from typing import Dict, Any, Callable


class WorkflowEdges:
    """
    Edge definitions for LangGraph workflows.
    """
    
    @staticmethod
    def route_to_sql(state: Dict[str, Any]) -> str:
        """
        Conditional edge router based on query type.
        
        Args:
            state: Current workflow state
            
        Returns:
            Name of the next node to execute
        """
        return (
            'generate_sql' 
            if state['query_analysis']['type'] == 'sql' 
            else 'analyze_data'
        )
    
    @staticmethod
    def get_conditional_edges() -> Dict[str, Dict[str, str]]:
        """
        Get conditional edge definitions.
        
        Returns:
            Dictionary of conditional edge definitions
        """
        return {
            'retrieve_context': {
                'condition': WorkflowEdges.route_to_sql,
                'edges': {
                    'generate_sql': 'analyze_data',
                    'analyze_data': 'format_response'
                }
            }
        }
    
    @staticmethod
    def get_direct_edges() -> Dict[str, str]:
        """
        Get direct edge definitions.
        
        Returns:
            Dictionary of direct edge definitions
        """
        return {
            'understand_query': 'retrieve_context',
            'analyze_data': 'format_response'
        }