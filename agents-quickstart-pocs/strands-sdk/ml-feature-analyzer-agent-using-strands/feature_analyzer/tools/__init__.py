"""Strands SDK tools for ML Feature Analysis"""

from .ml_tools import MLAnalysisTools

# Create instance and export methods
_ml_tools = MLAnalysisTools()
compare_models = _ml_tools.compare_models
train_model = _ml_tools.train_model

__all__ = ["compare_models", "train_model"]
