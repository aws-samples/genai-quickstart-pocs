"""Configuration settings for ML Feature Analyzer"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Application configuration
APP_TITLE = os.getenv("APP_TITLE", "ML Feature Analyzer")
BEDROCK_MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-sonnet-20240229-v1:0")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# Model tier definitions
MODEL_INFO = {
    "baseline": {
        "name": "Baseline Model",
        "color": "#FF6B6B",
        "icon": "📊",
        "description": "Basic demographics model",
        "attributes": ["age", "duration_months", "credit_amount", "installment_rate", "employment_status"],
    },
    "bronze": {
        "name": "Bronze Model",
        "color": "#CD7F32",
        "icon": "🥉",
        "description": "Enhanced with credit history",
        "attributes": [
            "age",
            "duration_months",
            "credit_amount",
            "installment_rate",
            "employment_status",
            "checking_account_status",
            "credit_history",
            "savings_account_status",
            "personal_status_sex",
            "other_debtors",
        ],
    },
    "silver": {
        "name": "Silver Model",
        "color": "#C0C0C0",
        "icon": "🥈",
        "description": "Advanced risk indicators",
        "attributes": [
            "age",
            "duration_months",
            "credit_amount",
            "installment_rate",
            "employment_status",
            "checking_account_status",
            "credit_history",
            "savings_account_status",
            "personal_status_sex",
            "other_debtors",
            "present_residence_since",
            "property",
            "other_installment_plans",
            "housing",
            "existing_credits_count",
        ],
    },
    "gold": {
        "name": "Gold Model",
        "color": "#FFD700",
        "icon": "🥇",
        "description": "Premium feature set",
        "attributes": [
            "age",
            "duration_months",
            "credit_amount",
            "installment_rate",
            "employment_status",
            "checking_account_status",
            "credit_history",
            "savings_account_status",
            "personal_status_sex",
            "other_debtors",
            "present_residence_since",
            "property",
            "other_installment_plans",
            "housing",
            "existing_credits_count",
            "job",
            "dependents_count",
            "telephone",
            "foreign_worker",
            "purpose",
        ],
    },
}

# Path configurations
MODEL_RESULTS_PATHS = [Path("model_results"), Path("/Users/omaraws/Repo/ml-feature-analyzer-agent/model_results")]

# Valid model types for security
VALID_MODEL_TYPES = {"baseline", "bronze", "silver", "gold"}

# Analysis types
ANALYSIS_TYPES = {
    "model_comparison": "Compare model performance across tiers",
    "custom_training": "Train custom model with selected attributes",
    "chat": "General chat interaction",
}
