"""Model service for handling ML model operations"""

import json
import os
import re
import streamlit as st
from pathlib import Path
from typing import Optional, Dict, Any
from config import VALID_MODEL_TYPES
from utils import sanitize_input


class ModelService:
    """Service for handling model-related operations"""

    def __init__(self):
        pass

    def _load_live_results(self, model_type: str) -> Optional[Dict[str, Any]]:
        """Try to load real training results"""
        try:
            # Validate and sanitize model_type to prevent path traversal
            if not isinstance(model_type, str) or not model_type.strip():
                return None

            # Only allow alphanumeric characters and underscores
            if not re.match(r"^[a-zA-Z0-9_]+$", model_type):
                return None

            # Sanitize and validate model_type
            clean_model_type = sanitize_input(model_type)
            if clean_model_type not in VALID_MODEL_TYPES:
                return None

            # Check live results directory only (not samples)
            results_dir = Path("model_results") / clean_model_type
            if results_dir.exists():
                metrics_files = list(results_dir.glob("metrics_*.json"))
                if metrics_files:
                    latest_metrics = max(metrics_files, key=os.path.getctime)
                    with open(latest_metrics, "r") as f:
                        return json.load(f)
            return None
        except BaseException:
            return None

    def _load_sample_results(self, model_type: str) -> Optional[Dict[str, Any]]:
        """Load pre-generated sample results"""
        try:
            # Validate and sanitize model_type
            if not isinstance(model_type, str) or not model_type.strip():
                return None

            if not re.match(r"^[a-zA-Z0-9_]+$", model_type):
                return None

            clean_model_type = sanitize_input(model_type)
            if clean_model_type not in VALID_MODEL_TYPES:
                return None

            # Load from samples directory
            sample_dir = Path("model_results/samples") / clean_model_type
            if sample_dir.exists():
                metrics_files = list(sample_dir.glob("metrics_*.json"))
                if metrics_files:
                    latest_metrics = max(metrics_files, key=os.path.getctime)
                    with open(latest_metrics, "r") as f:
                        return json.load(f)
            return None
        except BaseException:
            return None

    @st.cache_data
    def load_model_metrics(_self, model_type: str) -> Optional[Dict[str, Any]]:
        """Load model metrics with fallback to sample data"""
        # Try live results first
        live_results = _self._load_live_results(model_type)
        if live_results:
            live_results["source"] = "live"
            return live_results

        # Fallback to sample results
        sample_results = _self._load_sample_results(model_type)
        if sample_results:
            sample_results["source"] = "sample"
            return sample_results

        return None

    def get_model_status(self, model_type: str) -> Dict[str, Any]:
        """Get model training status and performance with fallback to sample data"""
        metrics = self.load_model_metrics(model_type)

        if metrics:
            source = metrics.get("source", "unknown")
            return {
                "trained": True,
                "auc": metrics["metrics"]["auc"],
                "source": source,
                "status": "✅ Live Results" if source == "live" else "📊 Sample Data",
                "status_color": "green" if source == "live" else "blue",
                "job_name": metrics.get("job_name"),
                "training_time": metrics.get("training_time"),
            }
        else:
            return {"trained": False, "auc": 0, "source": "none", "status": "❌ Not Found", "status_color": "red"}
