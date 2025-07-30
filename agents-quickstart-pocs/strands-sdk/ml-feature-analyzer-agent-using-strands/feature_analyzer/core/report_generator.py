"""AI-powered report generator using Amazon Bedrock and Claude 3.5 Sonnet"""

import json
import time
import boto3
from pathlib import Path

from .model_comparator import ModelComparator


class ReportGenerator:
    """AI-powered report generation using Amazon Bedrock"""

    def __init__(self, results_dir: str = None, region: str = "us-east-1"):
        self.comparator = ModelComparator(results_dir)
        self.region = region
        self.bedrock_client = boto3.client("bedrock-runtime", region_name=region)
        self.model_id = "anthropic.claude-3-haiku-20240307-v1:0"

    def generate_technical_report(self) -> dict:
        """Generate report"""

        print("🎯 Running Report Generation")
        print("=" * 60)

        # Get raw model comparison data
        print("\n📊 Phase 1: Loading Model Performance Data")
        model_analysis = self.comparator.compare_all_tiers()

        # Generate report
        print("\n🤖 Phase 2: Generating AI Report with Claude 3.5 Sonnet")
        ai_report = self._generate_ai_report(model_analysis)

        # Combine data and AI analysis
        complete_analysis = {
            "raw_model_analysis": model_analysis,
            "ai_generated_report": ai_report,
            "generation_timestamp": time.time(),
            "model_used": self.model_id,
        }

        return complete_analysis

    def _generate_ai_report(self, model_analysis: dict) -> dict:
        """Generate report using Bedrock LLM"""

        # Prepare data for AI analysis
        analysis_data = self._prepare_analysis_data(model_analysis)

        # Create prompt for technical report
        prompt = self._create_technical_report_prompt(analysis_data)

        # Call Bedrock API
        response = self.bedrock_client.invoke_model(
            modelId=self.model_id,
            body=json.dumps(
                {
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 4000,
                    "temperature": 0.1,
                    "messages": [{"role": "user", "content": prompt}],
                }
            ),
        )

        # Parse response
        response_body = json.loads(response["body"].read())
        ai_content = response_body["content"][0]["text"]

        return {
            "report_content": ai_content,
            "model_used": self.model_id,
            "prompt_tokens": len(prompt.split()),
            "response_tokens": len(ai_content.split()),
        }

    def _prepare_analysis_data(self, model_analysis: dict) -> dict:
        """Prepare clean data structure for AI analysis"""

        # Sanitize input data to prevent XSS
        sanitized_analysis = self._sanitize_data(model_analysis)

        # Extract key metrics for each tier
        tiers_data = {}
        baseline = sanitized_analysis["baseline_model"]

        tiers_data["baseline"] = {
            "attributes": baseline["attributes"],
            "metrics": baseline["metrics"],
        }

        for tier, comparison in sanitized_analysis["tier_comparisons"].items():
            tier_model = comparison["models"]["comparison"]
            improvements = comparison["improvements"]

            tiers_data[tier] = {
                "attributes": tier_model["attributes"],
                "metrics": tier_model["metrics"],
                "improvements": {
                    "accuracy": improvements["accuracy"]["relative_percent"],
                    "precision": improvements["precision"]["relative_percent"],
                    "recall": improvements["recall"]["relative_percent"],
                    "auc": improvements["auc"]["relative_percent"],
                },
                "additional_attributes": comparison["attribute_impact"]["additional_attributes"],
            }

        return {
            "tiers": tiers_data,
            "best_tier": sanitized_analysis["summary"]["best_performing_tier"]["tier"],
            "progression": sanitized_analysis["progression_analysis"]["attribute_progression"],
        }

    def _sanitize_data(self, data):
        """Recursively sanitize data to prevent XSS"""
        import html

        if isinstance(data, dict):
            return {k: self._sanitize_data(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._sanitize_data(item) for item in data]
        elif isinstance(data, str):
            return html.escape(data)
        else:
            return data

    def _create_technical_report_prompt(self, data: dict) -> str:
        """Create prompt for technical report generation"""

        # Sanitize data to prevent XSS
        sanitized_data = self._sanitize_data(data)

        # Convert sanitized data to safe JSON string
        safe_data_json = json.dumps(sanitized_data, indent=2)

        prompt_start = "You are a senior ML engineer analyzing model performance across models built "
        prompt_start += "using different attributes. Generate an executive summary report based on the following data:"

        return f"""{prompt_start}

MODEL PERFORMANCE DATA:
{safe_data_json}

Generate a report with the following structure:

# 🎯 ATTRIBUTE PERFORMANCE ANALYSIS REPORT

## 📈 EXECUTIVE SUMMARY
- Provide a headline about the overall improvement
- Highlight the best performing tier and key metrics

## 🏆 TIER-BY-TIER PERFORMANCE ANALYSIS
For each tier (baseline, bronze, silver, gold, custom):
- Show attribute count and key metrics (accuracy, precision, recall, AUC)
- Calculate and display percentage improvements from baseline
- Highlight the most significant improvements

FORMATTING REQUIREMENTS:
- Use emojis and clear section headers
- Include specific numbers and percentages
- Make it technical but accessible
- Focus on actionable insights
- Keep sections concise but comprehensive

Generate the report now:"""

    def print_ai_report(self, analysis: dict):
        """Print the AI-generated report"""

        import html

        ai_report = analysis["ai_generated_report"]

        # Sanitize all output to prevent XSS
        safe_model_id = html.escape(str(self.model_id))
        safe_report_content = html.escape(str(ai_report["report_content"]))

        print(f"\n🤖 Generated by {safe_model_id}")
        print(f"📊 Tokens: {ai_report.get('prompt_tokens', 0)} prompt + {ai_report.get('response_tokens', 0)} response")
        print("\n" + "=" * 80)
        print(safe_report_content)
        print("=" * 80)

    def save_report(self, analysis: dict, filename: str = None) -> str:
        """Save AI-generated report"""

        # Create analysis_results directory if it doesn't exist
        results_dir = Path("analysis_results")
        if not results_dir.exists():
            # Try to find analysis_results in safe parent directories only
            current_dir = Path.cwd()
            safe_parents = [current_dir, current_dir.parent, current_dir.parent.parent]

            for parent in safe_parents:
                try:
                    # Validate parent is within reasonable bounds
                    if not parent.resolve().is_relative_to(Path.home().resolve()):
                        continue

                    potential_dir = parent / "analysis_results"
                    # Validate the potential directory is safe
                    if potential_dir.exists() and potential_dir.resolve().is_relative_to(parent.resolve()):
                        results_dir = potential_dir
                        break
                except (OSError, ValueError):
                    # Skip invalid paths
                    continue
            else:
                # Create in current directory if not found
                results_dir.mkdir(exist_ok=True)

        if filename is None:
            timestamp = int(time.time())
            safe_filename = f"ai_technical_report_{timestamp}.json"
        else:
            # Sanitize filename to prevent path traversal
            import re

            if not isinstance(filename, str):
                raise ValueError("Filename must be a string")

            # Remove path separators and dangerous characters
            safe_filename = re.sub(r'[/\\:*?"<>|]', "_", filename.strip())
            # Remove path traversal sequences
            safe_filename = safe_filename.replace("..", "_")
            # Ensure filename is not empty after sanitization
            if not safe_filename or safe_filename.isspace():
                timestamp = int(time.time())
                safe_filename = f"ai_technical_report_{timestamp}.json"

        filename = results_dir / safe_filename

        # Validate the resolved path is within results_dir
        try:
            if not filename.resolve().is_relative_to(results_dir.resolve()):
                raise ValueError("Invalid file path")
        except (OSError, ValueError):
            timestamp = int(time.time())
            filename = results_dir / f"ai_technical_report_{timestamp}.json"

        # Save both raw data and AI report
        with open(filename, "w") as f:
            # Sanitize analysis data to prevent path traversal in saved content
            sanitized_analysis = self._sanitize_data(analysis)
            json.dump(sanitized_analysis, f, indent=2, default=str)

        # Also save just the report content as markdown
        report_md = filename.with_suffix(".md")

        # Validate markdown file path is also within results_dir
        try:
            if not report_md.resolve().is_relative_to(results_dir.resolve()):
                # Create safe markdown filename if validation fails
                safe_md_name = filename.stem + ".md"
                report_md = results_dir / safe_md_name
        except (OSError, ValueError):
            # Create safe markdown filename if validation fails
            safe_md_name = filename.stem + ".md"
            report_md = results_dir / safe_md_name

        with open(report_md, "w") as f:
            import html

            ai_report = analysis["ai_generated_report"]
            f.write("# AI Technical Report\n\n")
            # Sanitize all data before writing to file
            safe_model_used = html.escape(str(analysis["model_used"]))
            safe_timestamp = html.escape(str(time.ctime(analysis["generation_timestamp"])))
            safe_report_content = html.escape(ai_report["report_content"])

            f.write(f"Generated by: {safe_model_used}\n")
            f.write(f"Timestamp: {safe_timestamp}\n\n")
            f.write("---\n\n")
            f.write(safe_report_content)

        # Return only the filename, not the full path, to prevent path disclosure
        return filename.name
