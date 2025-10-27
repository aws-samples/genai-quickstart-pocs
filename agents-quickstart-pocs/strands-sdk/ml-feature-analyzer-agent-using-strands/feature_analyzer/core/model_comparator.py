"""Model comparison engine for benchmark tier analysis"""

import json
import os
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass


@dataclass
class ModelResult:
    """Container for model results and metrics"""

    model_type: str
    attributes_count: int
    metrics: Dict[str, float]
    job_name: str
    training_time: float
    attributes_used: List[str]


class ModelComparator:
    """Compare performance across all model tiers"""

    def __init__(self, results_dir: str = None):
        import re

        if results_dir:
            # Strict validation - only allow safe directory names
            if not isinstance(results_dir, str) or not re.match(r"^[a-zA-Z0-9_-]+$", results_dir):
                self.results_dir = self._get_project_root() / "model_results"
            else:
                # Create path within project root only
                self.results_dir = self._get_project_root() / results_dir
        else:
            self.results_dir = self._get_project_root() / "model_results"

        # Ensure directory exists
        self.results_dir.mkdir(exist_ok=True)
        self.model_tiers = ["baseline", "bronze", "silver", "gold", "custom"]

    def _get_project_root(self) -> Path:
        """Get the project root directory (ml-feature-analyzer-agent)"""
        current_path = Path(__file__).resolve()

        # Walk up the directory tree to find the project root
        for parent in current_path.parents:
            if parent.name == "ml-feature-analyzer-agent":
                return parent

        # Fallback to current working directory if not found
        return Path.cwd()

    def load_model_results(self, model_type: str) -> Optional[ModelResult]:
        """Load the most recent results for a model type with fallback to samples"""

        # Strict validation - only allow expected model tiers
        if model_type not in self.model_tiers:
            return None

        # Try live results first
        model_dir = self.results_dir / model_type
        if model_dir.exists():
            result = self._load_from_directory(model_dir, model_type)
            if result:
                return result

        # Fallback to sample results
        sample_dir = self.results_dir / "samples" / model_type
        if sample_dir.exists():
            return self._load_from_directory(sample_dir, model_type)

        return None

    def _load_from_directory(self, model_dir: Path, model_type: str) -> Optional[ModelResult]:
        """Load model results from a specific directory"""
        import re

        # Find most recent metrics file with safe glob pattern
        try:
            metrics_files = list(model_dir.glob("metrics_*.json"))
            if not metrics_files:
                return None

            latest_metrics = max(metrics_files, key=os.path.getctime)

            # Extract timestamp safely with strict validation
            filename_parts = latest_metrics.stem.split("_")
            if len(filename_parts) < 2:
                return None

            timestamp = filename_parts[1]
            # Strict validation - only numeric timestamps allowed
            if not re.match(r"^[0-9]{10,}$", timestamp):
                return None

            # Secure path construction with validated timestamp
            results_file = model_dir / f"results_{timestamp}.json"

            # Load metrics
            # amazonq-ignore-next-line
            with open(latest_metrics, "r") as f:
                metrics_data = json.load(f)

            # Load results if available
            results_data = {}
            if results_file.exists():
                # amazonq-ignore-next-line
                with open(results_file, "r") as f:
                    results_data = json.load(f)

            return ModelResult(
                model_type=model_type,
                attributes_count=len(metrics_data.get("attributes_used", [])),
                metrics=metrics_data["metrics"],
                job_name=metrics_data["job_name"],
                training_time=results_data.get("training_time", 0),
                attributes_used=metrics_data.get("attributes_used", []),
            )

        except Exception as e:
            print(f"⚠️ Error loading {model_type} results: {e}")
            return None

    def compare_two_models(self, model1: ModelResult, model2: ModelResult) -> Dict[str, Any]:
        """Compare two models and calculate improvements"""

        comparison = {
            "models": {
                "baseline": {
                    "type": model1.model_type,
                    "attributes": model1.attributes_count,
                    "metrics": model1.metrics,
                },
                "comparison": {
                    "type": model2.model_type,
                    "attributes": model2.attributes_count,
                    "metrics": model2.metrics,
                },
            },
            "improvements": {},
            "attribute_impact": {
                "additional_attributes": model2.attributes_count - model1.attributes_count,
                "improvement_per_attribute": {},
            },
        }

        # Calculate improvements for available metrics (focus on AUC)
        for metric in model1.metrics.keys():
            if metric in model2.metrics:
                baseline_value = model1.metrics[metric]
                comparison_value = model2.metrics[metric]

                absolute_improvement = comparison_value - baseline_value
                relative_improvement = (absolute_improvement / baseline_value) * 100 if baseline_value > 0 else 0

                comparison["improvements"][metric] = {
                    "absolute": absolute_improvement,
                    "relative_percent": relative_improvement,
                    "baseline": baseline_value,
                    "comparison": comparison_value,
                }

                # Calculate improvement per additional attribute
                additional_attrs = comparison["attribute_impact"]["additional_attributes"]
                if additional_attrs > 0:
                    comparison["attribute_impact"]["improvement_per_attribute"][metric] = (
                        relative_improvement / additional_attrs
                    )

        return comparison

    def compare_all_tiers(self) -> Dict[str, Any]:
        """Compare all model tiers against baseline"""

        print("📊 Loading model results for tier comparison...")

        # Load all model results
        model_results = {}
        for tier in self.model_tiers:
            result = self.load_model_results(tier)
            if result:
                model_results[tier] = result
                print(
                    f"✅ Loaded {tier}: {result.attributes_count} attributes, AUC: {result.metrics.get('auc', 0):.3f}"
                )
            else:
                print(f"⚠️ No results found for {tier} model")

        if "baseline" not in model_results:
            raise ValueError("Baseline model results required for comparison")

        baseline = model_results["baseline"]

        # Compare each tier against baseline
        tier_comparisons = {}
        for tier in ["bronze", "silver", "gold", "custom"]:
            if tier in model_results:
                tier_comparisons[tier] = self.compare_two_models(baseline, model_results[tier])

        # Create comprehensive analysis
        analysis = {
            "baseline_model": {
                "type": baseline.model_type,
                "attributes": baseline.attributes_count,
                "metrics": baseline.metrics,
            },
            "tier_comparisons": tier_comparisons,
            "progression_analysis": self._analyze_progression(model_results),
            "summary": self._generate_summary(model_results, tier_comparisons),
        }

        return analysis

    def _analyze_progression(self, model_results: Dict[str, ModelResult]) -> Dict[str, Any]:
        """Analyze the progression across tiers"""

        progression = {"attribute_progression": [], "performance_progression": {}, "efficiency_analysis": {}}

        # Attribute progression
        for tier in self.model_tiers:
            if tier in model_results:
                progression["attribute_progression"].append(
                    {
                        "tier": tier,
                        "attributes": model_results[tier].attributes_count,
                        "auc": model_results[tier].metrics.get("auc", 0),
                    }
                )

        # Performance progression for available metrics
        all_metrics = set()
        for tier_result in model_results.values():
            all_metrics.update(tier_result.metrics.keys())

        for metric in all_metrics:
            progression["performance_progression"][metric] = []
            for tier in self.model_tiers:
                if tier in model_results and metric in model_results[tier].metrics:
                    progression["performance_progression"][metric].append(
                        {
                            "tier": tier,
                            "value": model_results[tier].metrics[metric],
                            "attributes": model_results[tier].attributes_count,
                        }
                    )

        # Efficiency analysis (improvement per additional attribute)
        if len(model_results) > 1:
            baseline_auc = model_results["baseline"].metrics.get("auc", 0)
            baseline_attrs = model_results["baseline"].attributes_count

            for tier in ["bronze", "silver", "gold"]:
                if tier in model_results:
                    tier_auc = model_results[tier].metrics.get("auc", 0)
                    tier_attrs = model_results[tier].attributes_count

                    additional_attrs = tier_attrs - baseline_attrs
                    auc_improvement = tier_auc - baseline_auc

                    if additional_attrs > 0:
                        efficiency = (auc_improvement / additional_attrs) * 100
                        progression["efficiency_analysis"][tier] = {
                            "efficiency_score": efficiency,
                            "additional_attributes": additional_attrs,
                            "auc_improvement": auc_improvement,
                        }

        return progression

    def _generate_summary(
        self, model_results: Dict[str, ModelResult], tier_comparisons: Dict[str, Any]
    ) -> Dict[str, Any]:
        # Find best performing tier
        best_tier = "baseline"
        best_auc = model_results["baseline"].metrics.get("auc", 0)

        for tier in ["bronze", "silver", "gold"]:
            if tier in model_results:
                tier_auc = model_results[tier].metrics.get("auc", 0)
                if tier_auc > best_auc:
                    best_auc = tier_auc
                    best_tier = tier

        # Calculate total improvement
        baseline_auc = model_results["baseline"].metrics.get("auc", 0)
        total_improvement = ((best_auc - baseline_auc) / baseline_auc) * 100 if baseline_auc > 0 else 0

        return {
            "best_performing_tier": {"tier": best_tier, "auc": best_auc, "auc_improvement_percent": total_improvement},
            "total_tiers_analyzed": len(model_results),
            "baseline_auc": baseline_auc,
        }
