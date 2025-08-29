"""
Prompt template management for the GenAI Sales Analyst application.
"""
import yaml
from typing import Dict, List, Any


class PromptTemplate:
    """
    Manages prompt templates for the application.
    """
    
    def __init__(self, prompt_file: str = "src/prompts/prompts.yaml"):
        """
        Initialize the prompt template manager.
        
        Args:
            prompt_file: Path to the YAML file containing prompt templates
        """
        with open(prompt_file, 'r') as f:
            self.prompts = yaml.safe_load(f)
    
    def get_analysis_prompt(self, question: str, context: List[Dict[str, Any]]) -> str:
        """
        Get the analysis prompt with the question and context.
        
        Args:
            question: User's question
            context: Relevant context information
            
        Returns:
            Formatted prompt string
        """
        base_prompt = self.prompts['analysis']
        context_str = "\n".join([f"- {c['text']}" for c in context])
        return base_prompt.format(
            question=question,
            context=context_str
        )
    
    def get_sql_prompt(self, question: str, context: List[Dict[str, Any]]) -> str:
        """
        Get the SQL generation prompt with the question and context.
        
        Args:
            question: User's question
            context: Relevant context information
            
        Returns:
            Formatted prompt string
        """
        base_prompt = self.prompts['sql_generation']
        context_str = "\n".join([f"- {c['text']}" for c in context])
        return base_prompt.format(
            question=question,
            context=context_str
        )