"""Class-based ML Tools for Feature Analyzer"""

import sys
from pathlib import Path
from strands import tool

# Add root directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))


class MLAnalysisTools:
    """Class containing all ML analysis tools"""

    def __init__(self):
        pass

    @tool
    def compare_models(self, comparison_type: str = "all_tiers") -> str:
        """
        Compare performance across all available model tiers including custom models.

        Args:
            comparison_type: Currently unused - always performs all_tiers comparison

        Returns:
            Formatted comparison of baseline vs bronze/silver/gold/custom models with
            AUC scores, improvements, and best performer identification
        """
        try:
            import html
            import re
            from feature_analyzer.core.model_comparator import ModelComparator

            # Validate and sanitize input to prevent XSS
            if not isinstance(comparison_type, str):
                return "❌ Invalid comparison type"

            # Only allow alphanumeric characters and underscores
            clean_comparison_type = re.sub(r"[^a-zA-Z0-9_]", "", str(comparison_type).strip())
            if not clean_comparison_type:
                return "❌ Invalid comparison type"

            comparator = ModelComparator()
            analysis = comparator.compare_all_tiers()

            baseline = analysis["baseline_model"]
            comparisons = analysis["tier_comparisons"]
            best_tier = analysis["summary"]["best_performing_tier"]

            response_text = f"""## Model Performance Data

**Baseline Model:**
• AUC: {baseline['metrics']['auc']:.3f}
• Attributes: {baseline['attributes']} (basic demographic data)

**Premium Tier Performance:"""

            for tier, comp in comparisons.items():
                improvement = comp["improvements"].get("auc", {}).get("relative_percent", 0)
                additional_attrs = comp["attribute_impact"]["additional_attributes"]
                auc_value = comp["models"]["comparison"]["metrics"]["auc"]

                response_text += (
                    f"\n• **{tier.title()} Tier**: "
                    f"AUC {auc_value:.3f} "
                    f"(+{improvement:.1f}% improvement, "
                    f"+{additional_attrs} premium attributes)"
                )

            response_text += (
                f"\n\n**Best Performer:** {best_tier['tier'].title()} tier - "
                f"{best_tier['auc']:.3f} AUC "
                f"({best_tier['auc_improvement_percent']:.1f}% total improvement)"
            )

            return response_text

        except Exception as e:
            safe_error = html.escape(str(e))
            return f"❌ Error in model comparison: {safe_error}"

    @tool
    def train_model(self, model_type: str, attributes: str = "") -> str:
        """
        Train ML model with specified configuration.

        Args:
            model_type: Type of model to train (baseline, bronze, silver, gold, custom)
            attributes: Comma-separated list of attributes (required for custom models)

        Returns:
            Training results and model performance
        """
        try:
            import html
            import re

            # Import from root level ml module
            from ml.model_trainer import ModelTrainer, create_model_config

            # Validate and sanitize inputs
            if not isinstance(model_type, str) or not model_type.strip():
                return "❌ Invalid model type"

            # Only allow alphanumeric and underscore for model_type
            clean_model_type = re.sub(r"[^a-zA-Z0-9_]", "", str(model_type).strip())
            if not clean_model_type:
                return "❌ Invalid model type"

            # Sanitize attributes input
            clean_attributes = ""
            if attributes:
                clean_attributes = re.sub(r'[<>"\'\/]', "", str(attributes).strip())

            if clean_model_type == "custom" and clean_attributes:
                # Parse and validate custom attributes
                attr_list = []
                for attr in clean_attributes.split(","):
                    clean_attr = re.sub(r"[^a-zA-Z0-9_]", "", attr.strip())
                    if clean_attr:
                        attr_list.append(clean_attr)

                if not attr_list:
                    return "❌ No valid attributes provided"

                # Create custom model config
                config = create_model_config("custom", custom_attributes=attr_list)
                trainer = ModelTrainer(config)

                # Start training in background thread, return immediately
                import threading
                import time

                timestamp = int(time.time())
                job_name = f"custom-credit-model-{timestamp}"

                # Start training in background
                def start_training():
                    try:
                        actual_job_name = trainer.train_model()  # Full training workflow
                        metrics = trainer.evaluate_model(actual_job_name)
                        trainer.save_results(actual_job_name, metrics)
                        print(f"✅ Custom model training completed: {actual_job_name}")
                    except Exception as e:
                        print(f"Background training failed: {e}")

                threading.Thread(target=start_training, daemon=True).start()

                return f"""🔧 Custom model training started!

**Model Type**: CUSTOM
**Total Attributes**: {len(config.attributes)}

**Baseline Attributes (5)**: age, duration_months, credit_amount, installment_rate, employment_status

**Premium Attributes ({len(attr_list)})**: {', '.join([html.escape(attr) for attr in attr_list])}

**Job Name**: {html.escape(str(job_name))}
**Status**: Training in progress (10-20 minutes)

Once custom model training completes, run the analysis again to compare the new custom model
results with the benchmark tiers.

**TRAINING_STARTED**"""

            else:
                # Train predefined tier
                config = create_model_config(clean_model_type)
                trainer = ModelTrainer(config)

                job_name = trainer.train_model()
                metrics = trainer.evaluate_model(job_name)
                results_file = trainer.save_results(job_name, metrics)

                # Sanitize all output values
                safe_model_type = html.escape(clean_model_type.upper())
                safe_job_name = html.escape(str(job_name))
                safe_results_file = html.escape(str(results_file))

                return f"""✅ {safe_model_type} model training completed!

**Model Type**: {safe_model_type}
**Attributes**: {len(config.attributes)} total
**Performance**: AUC {metrics.get('auc', 0):.3f}
**Job Name**: {safe_job_name}
**Results**: {safe_results_file}"""

        except Exception as e:
            safe_error = html.escape(str(e))
            return f"❌ Model training failed: {safe_error}"
