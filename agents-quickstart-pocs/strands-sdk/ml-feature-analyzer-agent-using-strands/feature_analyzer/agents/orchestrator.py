"""
ML Analysis Orchestrator Service for coordinating analysis workflows
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any
from strands import Agent

# Import configuration for environment-based model selection
import sys
from pathlib import Path
from config import BEDROCK_MODEL_ID

sys.path.append(str(Path(__file__).parent.parent.parent))


class MLAnalysisOrchestrator:
    """Service for orchestrating ML analysis workflows between different tools"""

    def __init__(self):
        self.agent = None
        self.verification_logs = []
        # Define authorized analysis types
        self.authorized_analysis_types = {"model_comparison", "custom_training", "chat"}

    def create_orchestrator_agent(self, tools: List):
        """Create the orchestrator agent with ML analysis tools"""
        # Simple agent setup for conversation and custom training
        from feature_analyzer.tools.ml_tools import MLAnalysisTools

        ml_tools = MLAnalysisTools()

        self.agent = Agent(
            model=BEDROCK_MODEL_ID,
            tools=[ml_tools.compare_models, ml_tools.train_model],
            system_prompt=self._get_system_prompt(),
        )

        return self.agent

    def orchestrate_analysis(self, analysis_type: str, **kwargs) -> Dict[str, Any]:
        """Unified orchestration method for all ML analysis flows"""

        # Validate authorization for analysis type
        if not self._is_authorized_analysis_type(analysis_type):
            raise ValueError(f"Unauthorized analysis type: {analysis_type}")

        if analysis_type == "model_comparison":
            return self._run_model_comparison(**kwargs)
        elif analysis_type == "custom_training":
            return self._handle_custom_training(**kwargs)
        elif analysis_type == "chat":
            return self._handle_chat(**kwargs)
        else:
            raise ValueError(f"Unknown analysis type: {analysis_type}")

    async def orchestrate_analysis_async(self, analysis_type: str, **kwargs):
        """Async orchestration for streaming responses"""

        # Validate authorization for analysis type
        if not self._is_authorized_analysis_type(analysis_type):
            yield f"Error: Unauthorized analysis type: {analysis_type}"
            return

        if analysis_type == "custom_training":
            async for update in self._handle_custom_training_async(kwargs.get("user_query", "")):
                yield update
        else:
            # Fallback to sync for non-streaming types
            result = self.orchestrate_analysis(analysis_type, **kwargs)
            yield result["response"]

    def _run_model_comparison(self, **kwargs) -> Dict[str, Any]:
        """Execute model comparison analysis using agent with Bedrock"""
        self.verification_logs.append("🔍 Running model comparison analysis...")

        prompt = """
        Use the compare_models tool to get model performance data.
        Then provide business analysis using this EXACT structure:

## Key Performance Insights
[Analyze EACH tier individually. If Bronze/Silver/Gold have identical AUC scores,
highlight that Bronze achieves the same performance as higher tiers. Focus on the
specific tier that provides the best value.]

## Recommendations
[Recommend the LOWEST-COST tier that achieves maximum performance. If Bronze =
Silver = Gold performance, recommend Bronze tier specifically.]

## Next Steps
Do you have any questions about this analysis?

Would you like help training a custom model with specific attributes you select?"""

        # Use agent to call tool and analyze results with Bedrock
        response = str(self.agent(prompt))

        if not response or response.strip() == "":
            response = "Analysis failed - agent did not return results."

        return self._build_response(response=response, analysis_type="model_comparison", success=True)

    def _handle_custom_training(self, user_query: str = "", **kwargs) -> Dict[str, Any]:
        """Handle interactive custom model training"""
        self.verification_logs.append("🔧 Handling custom model training...")

        # Interactive prompt for attribute selection
        prompt = f"""User request: "{user_query}"

If they need attribute options, show available premium attributes in a clear list.
If they specified attributes, use train_model tool.

Be concise and helpful."""

        # Use agent for custom training since it needs conversational context
        try:
            response = str(self.agent(prompt))

            if not response or response.strip() == "":
                response = (
                    "I can help you train a custom model. Please specify which premium attributes you'd like to use."
                )
        except Exception as e:
            response = f"Error: {str(e)}"

        return self._build_response(response=response, analysis_type="custom_training", success=True)

    async def _handle_custom_training_async(self, user_query: str = ""):
        """Handle custom training with real-time streaming updates"""
        prompt = f"""User request: "{user_query}"

If they need attribute options, show available premium attributes in a clear list.
If they specified attributes, use train_model tool.

Be concise and helpful."""

        async for event in self.agent.stream_async(prompt):
            if "current_tool_use" in event:
                tool_info = event["current_tool_use"]
                yield f"🔧 Executing: {tool_info.get('name', 'Unknown Tool')}"
                if tool_info.get("input"):
                    yield f"📋 Parameters: {tool_info['input']}"
            elif "data" in event:
                yield event["data"]
            elif "result" in event:
                # Final result - yield the response content
                yield event["result"].message["content"][0]["text"]

    def _handle_chat(self, user_query: str = "", **kwargs) -> Dict[str, Any]:
        """Handle conversational follow-up questions"""
        self.verification_logs.append("💬 Handling chat interaction...")

        # Use agent for conversational responses
        try:
            response = str(self.agent(user_query))

            if not response or response.strip() == "":
                response = "I'm here to help with your ML analysis questions. Could you please rephrase your question?"
        except Exception as e:
            response = f"Error: {str(e)}"

        return self._build_response(response=response, analysis_type="chat", success=True)

    def _get_system_prompt(self) -> str:
        """Get system prompt for ML analysis orchestrator"""
        return """You are an ML analysis expert for German Credit Dataset analysis. Be concise and use clear formatting.

IMPORTANT: Only use tools when explicitly needed:
- Use compare_models tool ONLY when asked to compare model performance
- Use train_model tool ONLY when user provides a concrete list of attributes to train with
(e.g. "train with credit_history, purpose")
- DO NOT call tools when just providing information or attribute lists

When users ask for available attributes, provide this EXACT list of 15 premium attributes:

**Premium Attributes Available:**
• checking_account_status - Status of existing checking account
• credit_history - Credit payment history
• purpose - Loan purpose (car, furniture, etc.)
• savings_account_status - Savings account balance level
• personal_status_sex - Personal status and gender
• other_debtors - Other debtors/guarantors
• present_residence_since - Years at current residence
• property - Property ownership status
• other_installment_plans - Other installment plans
• housing - Housing situation (rent/own/free)
• existing_credits_count - Number of existing credits
• job - Employment category
• dependents_count - Number of dependents
• telephone - Telephone registration status
• foreign_worker - Foreign worker status

**Note:**
The 5 baseline attributes (age, duration_months, credit_amount, installment_rate, employment_status) always included.

For custom training:
- Only use train_model when user gives you a specific list of attributes.
- For guidance requests, just provide recommendations without training.
- Always end training responses with: "PLEASE NOTE: Training a model will take 10-20 minutes"
For model analysis: Use compare_models tool only when requested.
For questions: Give helpful, brief answers without calling tools.

Always focus on business value and ROI. Use bullet points and clear sections."""

    def _is_authorized_analysis_type(self, analysis_type: str) -> bool:
        """Check if analysis type is authorized"""
        if not isinstance(analysis_type, str):
            return False
        return analysis_type in self.authorized_analysis_types

    def _build_response(
        self, response: str, analysis_type: str, success: bool = True, **kwargs
    ) -> Dict[str, Any]:
        """Build standardized response structure"""
        return {
            "success": success,
            "response": response,
            "analysis_type": analysis_type,
            "session_id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "verification_logs": self.verification_logs.copy(),
            **kwargs,
        }
