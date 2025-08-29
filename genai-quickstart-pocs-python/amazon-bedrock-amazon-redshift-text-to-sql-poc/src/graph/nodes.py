"""
Individual node definitions for LangGraph workflows.
"""
from typing import Dict, Any, List
import json
from datetime import datetime


class WorkflowNodes:
    """
    Node implementations for LangGraph workflows.
    """
    
    def __init__(self, bedrock_helper, vector_store, monitor):
        """
        Initialize workflow nodes with required components.
        
        Args:
            bedrock_helper: Client for Amazon Bedrock API
            vector_store: Vector store for similarity search
            monitor: Monitoring client
        """
        self.bedrock = bedrock_helper
        self.vector_store = vector_store
        self.monitor = monitor
    
    def understand_query(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Understand and classify the user query.
        
        Args:
            state: Current workflow state
            
        Returns:
            Updated workflow state
        """
        query = state['query']
        
        prompt = f"""Analyze this query and classify it:
        Query: {query}
        Determine:
        1. Query type (analysis/sql/metadata)
        2. Required data sources
        3. Time frame mentioned
        Return as JSON."""
        
        response = self.bedrock.invoke_model(prompt)
        analysis = json.loads(response)
        
        return {
            **state,
            "query_analysis": analysis
        }
    
    def retrieve_context(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Retrieve relevant context from vector store.
        
        Args:
            state: Current workflow state
            
        Returns:
            Updated workflow state with relevant context
        """
        query = state['query']
        similar_docs = self.vector_store.similarity_search(query, k=3)
        
        return {
            **state,
            "relevant_context": similar_docs
        }
    
    def generate_sql(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate SQL if needed based on query analysis.
        
        Args:
            state: Current workflow state
            
        Returns:
            Updated workflow state with generated SQL
        """
        if state['query_analysis']['type'] != 'sql':
            return state
            
        prompt = f"""Given:
        Query: {state['query']}
        Context: {state['relevant_context']}
        Generate SQL query."""
        
        sql = self.bedrock.invoke_model(prompt)
        
        return {
            **state,
            "generated_sql": sql
        }
    
    def analyze_data(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform data analysis based on the query and context.
        
        Args:
            state: Current workflow state
            
        Returns:
            Updated workflow state with analysis results
        """
        context = state['relevant_context']
        query = state['query']
        
        prompt = f"""Analyze:
        Question: {query}
        Context: {context}
        Provide detailed analysis."""
        
        analysis = self.bedrock.invoke_model(prompt)
        
        return {
            **state,
            "analysis": analysis
        }
    
    def format_response(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format the final response based on workflow results.
        
        Args:
            state: Current workflow state
            
        Returns:
            Updated workflow state with formatted response
        """
        if 'generated_sql' in state:
            response = f"""Analysis includes SQL query:
            {state['generated_sql']}
            
            Analysis:
            {state['analysis']}"""
        else:
            response = state['analysis']
            
        # Log to monitoring
        self.monitor.log_interaction(
            prompt=state['query'],
            response=response,
            metadata={
                "workflow_type": "analysis",
                "query_analysis": state['query_analysis']
            }
        )
        
        return {
            **state,
            "final_response": response
        }