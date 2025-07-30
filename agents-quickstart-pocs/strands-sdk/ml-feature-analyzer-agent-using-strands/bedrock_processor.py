"""Bedrock processor for handling AI analysis operations"""

from typing import Dict, Any
from feature_analyzer.agents import MLAnalysisOrchestrator
from feature_analyzer.tools import train_model, compare_models
from config import ANALYSIS_TYPES
from utils import get_bedrock_client, sanitize_input


class BedrockProcessor:
    """Service for handling Bedrock AI operations"""

    def __init__(self):
        self.orchestrator = None
        self.tools = [train_model, compare_models]
        self.bedrock_client = get_bedrock_client()

    def initialize_orchestrator(self):
        """Initialize the ML Analysis Orchestrator"""
        if not self.orchestrator:
            self.orchestrator = MLAnalysisOrchestrator()
            self.orchestrator.create_orchestrator_agent(self.tools)
        return self.orchestrator

    def run_analysis(self, analysis_type: str) -> Dict[str, Any]:
        """Run analysis using the orchestrator"""
        if not self.orchestrator:
            self.initialize_orchestrator()

        result = self.orchestrator.orchestrate_analysis(analysis_type)
        return result

    def process_chat_message(self, message: str, analysis_type: str = "chat") -> str:
        """Process chat message through the orchestrator"""
        if not self.orchestrator:
            self.initialize_orchestrator()

        # Sanitize input message
        clean_message = sanitize_input(message)

        # Determine if this is actual training vs just asking about training
        is_actual_training = analysis_type == "custom_training" and (
            "•" in clean_message
            or (
                "," in clean_message
                and any(
                    attr in clean_message.lower()
                    for attr in [
                        "savings_account_status",
                        "personal_status_sex",
                        "other_debtors",
                        "present_residence_since",
                        "property",
                        "other_installment_plans",
                    ]
                )
            )
        )

        if is_actual_training:
            result = self.orchestrator.orchestrate_analysis("custom_training", user_query=clean_message)
        else:
            result = self.orchestrator.orchestrate_analysis("chat", user_query=clean_message)

        return result.get("response", "No response generated")

    def get_analysis_types(self) -> Dict[str, str]:
        """Get available analysis types"""
        return ANALYSIS_TYPES
