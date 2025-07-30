import boto3
from typing import Dict, Any, List
import time
import json
import argparse
import signal
import sys
import os
from pathlib import Path
from dataclasses import dataclass
import concurrent.futures
from dotenv import load_dotenv

# Import SageMaker Core SDK
from sagemaker_core.main.resources import AutoMLJob
from sagemaker_core.main.shapes import (
    AutoMLJobConfig,
    AutoMLJobObjective,
    AutoMLDataSource,
    AutoMLS3DataSource,
    AutoMLChannel,
    AutoMLOutputDataConfig,
    AutoMLJobCompletionCriteria,
)

"""Unified model trainer for benchmark and custom models using SageMaker Core SDK"""

"""
Usage Instructions:

1. Benchmark Models:
   # Train baseline model (5 basic attributes)
   python model_trainer.py --model-type baseline

   # Train bronze model (10 total attributes)
   python model_trainer.py --model-type bronze

   # Train silver model (15 total attributes)
   python model_trainer.py --model-type silver

   # Train gold model (20 total attributes)
   python model_trainer.py --model-type gold

2. Custom Models:
   # Train custom model with specific premium attributes
   python model_trainer.py --model-type custom --custom-attributes credit_history property job

3. Parameters:
   --model-type: Required. One of: baseline, bronze, silver, gold, custom
   --custom-attributes: Required for custom models. List of premium attributes
   --max-candidates: Optional. Number of model candidates to evaluate
   --max-runtime-per-job: Optional. Max runtime per training job in seconds
   --max-total-runtime: Optional. Max total runtime in seconds
   --objective-metric: Optional. Metric to optimize for (default: AUC)

4. Examples:
   # Quick benchmark comparison
   python model_trainer.py --model-type bronze
   python model_trainer.py --model-type silver
   python model_trainer.py --model-type gold

   # Custom model with specific attributes
   python model_trainer.py --model-type custom \
     --custom-attributes credit_history checking_account_status savings_account_status

5. Output:
   - Organized results in model_results/{model_type}/ directory
   - Saves model metrics and complete results separately
   - Easy reference for comparison analysis
"""


# Load environment variables
load_dotenv()


# Feature definitions
BASIC_ATTRIBUTES = ["age", "duration_months", "credit_amount", "installment_rate", "employment_status"]

PREMIUM_ATTRIBUTES = [
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
]

# Simple math: 5, 10, 15, 20 attributes
BRONZE_PREMIUM = PREMIUM_ATTRIBUTES[:5]  # First 5 premium attributes (total: 10)
SILVER_PREMIUM = PREMIUM_ATTRIBUTES[:10]  # First 10 premium attributes (total: 15)
GOLD_PREMIUM = PREMIUM_ATTRIBUTES  # All 15 premium attributes (total: 20)

ALL_ATTRIBUTES = BASIC_ATTRIBUTES + PREMIUM_ATTRIBUTES


@dataclass
class ModelConfig:
    """Configuration for model training with optimized defaults"""

    model_type: str  # 'baseline', 'bronze', 'silver', 'gold', 'enhanced', or 'custom'
    max_candidates: int = 1  # Optimized: Single candidate for speed
    max_runtime_per_job: int = 300  # Optimized: 5 minutes per job
    max_total_runtime: int = 600  # Optimized: 10 minutes total
    objective_metric: str = "AUC"
    problem_type: str = "BinaryClassification"
    custom_attributes: List[str] = None  # For custom attribute selection

    @property
    def attributes(self) -> List[str]:
        """Get attributes based on model type"""
        if self.custom_attributes:  # Custom attributes override
            return BASIC_ATTRIBUTES + self.custom_attributes
        elif self.model_type == "baseline":
            return BASIC_ATTRIBUTES
        elif self.model_type == "bronze":
            return BASIC_ATTRIBUTES + BRONZE_PREMIUM
        elif self.model_type == "silver":
            return BASIC_ATTRIBUTES + SILVER_PREMIUM
        elif self.model_type == "gold":
            return BASIC_ATTRIBUTES + GOLD_PREMIUM
        elif self.model_type == "custom":
            if not self.custom_attributes:
                raise ValueError("Custom model type requires custom_attributes to be specified")
            return BASIC_ATTRIBUTES + self.custom_attributes
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")

    @property
    def dataset_name(self) -> str:
        """Get dataset filename based on model type"""
        # Use enhanced dataset for all premium attribute models
        if self.model_type in ["bronze", "silver", "gold", "custom"]:
            return "enhanced_train.csv"
        return f"{self.model_type}_train.csv"

    @property
    def test_dataset_name(self) -> str:
        """Get test dataset filename based on model type"""
        # Use enhanced test dataset for all premium attribute models
        if self.model_type in ["bronze", "silver", "gold", "custom"]:
            return "enhanced_test.csv"
        return f"{self.model_type}_test.csv"


class ModelTrainer:
    """Unified trainer for both baseline and enhanced models using SageMaker Core SDK"""

    def __init__(self, config: ModelConfig):
        self.config = config

        # Get infrastructure configuration from CloudFormation outputs
        # Configure AWS session with environment variables
        aws_profile = os.getenv("AWS_PROFILE")
        aws_region = os.getenv("AWS_REGION", "us-east-1")

        if aws_profile:
            boto3.setup_default_session(profile_name=aws_profile)

        self.region = aws_region
        self.boto_session = boto3.Session(region_name=self.region)

        # Get stack outputs
        cfn_client = self.boto_session.client("cloudformation")
        try:
            response = cfn_client.describe_stacks(StackName="MLFeatureAnalyzerStack")
            outputs = {o["OutputKey"]: o["OutputValue"] for o in response["Stacks"][0]["Outputs"]}

            self.bucket_name = outputs["DataBucketName"]
            self.role_arn = outputs["SageMakerRoleArn"]

        except Exception as e:
            raise RuntimeError(f"Failed to get CloudFormation outputs. Ensure CDK stack is deployed: {e}")

        self.sagemaker_client = self.boto_session.client("sagemaker")

        print("🔧 Initialized ModelTrainer")
        print(f"   • Model Type: {self.config.model_type.upper()}")
        print(f"   • Attributes: {len(self.config.attributes)} ({', '.join(self.config.attributes[:3])}...)")
        print(f"   • S3 Bucket: {self.bucket_name}")
        print(f"   • Region: {self.region}")
        print("   • SDK: SageMaker Core")

    def _show_job_summary(self, job_name: str):
        """Show final summary of completed AutoML job"""

        try:
            job_response = self.sagemaker_client.describe_auto_ml_job(AutoMLJobName=job_name)

            print("\n📋 JOB COMPLETION SUMMARY")
            print("=" * 50)
            print(f"Job Name: {job_name}")
            print(f"Status: {job_response['AutoMLJobStatus']}")
            print(f"Duration: {job_response['CreationTime']} to {job_response.get('EndTime', 'N/A')}")

            # Show best candidate if available
            if "BestCandidate" in job_response:
                best = job_response["BestCandidate"]
                print("\n🏆 Best Candidate:")
                print(f"   Name: {best.get('CandidateName', 'Unknown')}")
                print(f"   Status: {best.get('CandidateStatus', 'Unknown')}")

                if "FinalAutoMLJobObjectiveMetric" in best:
                    metric = best["FinalAutoMLJobObjectiveMetric"]
                    print(f"   {metric.get('MetricName', 'Metric')}: {metric.get('Value', 0):.4f}")

            # Show total candidates
            try:
                candidates_response = self.sagemaker_client.list_candidates_for_auto_ml_job(AutoMLJobName=job_name)
                total_candidates = len(candidates_response.get("Candidates", []))
                print(f"\n📊 Total Candidates Evaluated: {total_candidates}")

                # Show all candidate performance
                for i, candidate in enumerate(candidates_response.get("Candidates", [])[:5]):  # Show top 5
                    name = candidate.get("CandidateName", f"Candidate-{i + 1}")
                    status = candidate.get("CandidateStatus", "Unknown")

                    if "FinalAutoMLJobObjectiveMetric" in candidate:
                        metric = candidate["FinalAutoMLJobObjectiveMetric"]
                        metric_value = metric.get("Value", 0)
                        print(f"   {i + 1}. {name[-20:]:20} - {status:10} - {metric_value:.4f}")
                    else:
                        print(f"   {i + 1}. {name[-20:]:20} - {status}")

            except (KeyError, ValueError, TypeError):
                # Expected errors from candidates API
                pass
            except Exception as e:
                print(f"⚠️ Unexpected error listing candidates: {type(e).__name__}: {str(e)}")

            print("=" * 50)

        except (KeyError, ValueError, TypeError) as e:
            print(f"⚠️ Job summary data error: {type(e).__name__}: {str(e)}")
        except Exception as e:
            print(f"⚠️ Unexpected error generating job summary: {type(e).__name__}: {str(e)}")

    def _track_job_progress(self, job_name: str):
        """Track AutoML job progress with underlying job monitoring"""

        # Set up interrupt handler (only works in main thread)
        def signal_handler(sig, frame):
            print("\n⚠️ Progress tracking interrupted by user")
            print(f"📝 Job {job_name} is still running in AWS")
            print(f"💡 Check status with: aws sagemaker describe-auto-ml-job --auto-ml-job-name {job_name}")
            sys.exit(0)

        try:
            signal.signal(signal.SIGINT, signal_handler)
        except ValueError:
            # Signal handling only works in main thread, skip if in thread context
            print("⚠️ Running in thread context - signal handling disabled")

        last_status = None
        last_secondary_status = None
        candidate_count = 0
        last_training_count = 0
        last_processing_count = 0
        start_time = time.time()

        print(f"🔍 Starting progress tracking for job: {job_name}")
        print("💡 Press Ctrl+C to stop tracking (job will continue running)")
        print("=" * 60)

        while True:
            try:
                # Get main job status
                job_response = self.sagemaker_client.describe_auto_ml_job(AutoMLJobName=job_name)
                status = job_response["AutoMLJobStatus"]
                secondary_status = job_response.get("AutoMLJobSecondaryStatus", "")

                # Print status updates
                if status != last_status or secondary_status != last_secondary_status:
                    elapsed = int(time.time() - start_time)
                    print(f"📊 [{elapsed:03d}s] Status: {status}")
                    if secondary_status:
                        print(f"    Secondary: {secondary_status}")
                    last_status = status
                    last_secondary_status = secondary_status

                # Check for completion
                if status in ["Completed", "Failed", "Stopped"]:
                    final_time = int(time.time() - start_time)
                    print(f"✅ Job {status.lower()} after {final_time} seconds")
                    break

                # Get candidates progress
                try:
                    candidates_response = self.sagemaker_client.list_candidates_for_auto_ml_job(AutoMLJobName=job_name)
                    current_candidates = len(candidates_response.get("Candidates", []))

                    if current_candidates > candidate_count:
                        candidate_count = current_candidates
                        print(f"🎯 Candidates completed: {candidate_count}")

                        # Show latest candidate details
                        if candidates_response.get("Candidates"):
                            latest = candidates_response["Candidates"][-1]
                            name = latest.get("CandidateName", "Unknown")
                            cand_status = latest.get("CandidateStatus", "Unknown")

                            # Get candidate metrics if available
                            if "FinalAutoMLJobObjectiveMetric" in latest:
                                metric = latest["FinalAutoMLJobObjectiveMetric"]
                                metric_name = metric.get("MetricName", "Unknown")
                                metric_value = metric.get("Value", 0)
                                print(f"   • Latest: {name} - {cand_status}")
                                print(f"     {metric_name}: {metric_value:.4f}")
                            else:
                                print(f"   • Latest: {name} - {cand_status}")

                except (KeyError, ValueError, TypeError):
                    # Candidates might not be available yet
                    if candidate_count == 0:
                        print("⏳ Waiting for candidates to start...")
                except Exception as e:
                    print(f"⚠️ Unexpected error accessing candidates: {type(e).__name__}: {str(e)}")

                # Get related jobs count with enhanced details
                try:
                    creation_time = job_response["CreationTime"]

                    # Count training jobs
                    training_jobs = self.sagemaker_client.list_training_jobs(
                        CreationTimeAfter=creation_time, NameContains=job_name[:20], MaxResults=50  # Partial match
                    )
                    training_count = len(training_jobs.get("TrainingJobSummaries", []))

                    # Count processing jobs
                    processing_jobs = self.sagemaker_client.list_processing_jobs(
                        CreationTimeAfter=creation_time, NameContains=job_name[:20], MaxResults=50
                    )
                    processing_count = len(processing_jobs.get("ProcessingJobSummaries", []))

                    # Count transform jobs
                    transform_jobs = self.sagemaker_client.list_transform_jobs(
                        CreationTimeAfter=creation_time, NameContains=job_name[:20], MaxResults=50
                    )
                    transform_count = len(transform_jobs.get("TransformJobSummaries", []))

                    # Show job counts if they changed
                    if training_count != last_training_count or processing_count != last_processing_count:

                        print(
                            "🔧 Active jobs: "
                            f"{training_count} training, "
                            f"{processing_count} processing, "
                            f"{transform_count} transform"
                        )

                        # Show running job details
                        running_training = [
                            j
                            for j in training_jobs.get("TrainingJobSummaries", [])
                            if j["TrainingJobStatus"] == "InProgress"
                        ]
                        if running_training:
                            job_name_short = running_training[0]["TrainingJobName"][-20:]
                            print(f"   🏃 Running: ...{job_name_short}")

                        last_training_count = training_count
                        last_processing_count = processing_count

                except (KeyError, ValueError, TypeError):
                    # Expected errors from job listing API
                    pass
                except Exception as e:
                    print(f"⚠️ Unexpected error listing jobs: {type(e).__name__}: {str(e)}")

                # Show progress indicator
                elapsed = int(time.time() - start_time)
                if elapsed % 60 == 0 and elapsed > 0:  # Every minute
                    print(f"⏱️  Elapsed: {elapsed // 60} minutes")

                time.sleep(30)  # Check every 30 seconds

            except (KeyError, ValueError, TypeError) as e:
                print(f"⚠️ Progress tracking data error: {type(e).__name__}: {str(e)}")
                time.sleep(30)
            except Exception as e:
                print(f"⚠️ Unexpected progress tracking error: {type(e).__name__}: {str(e)}")
                time.sleep(30)

    def train_model(self) -> str:
        """Train model using SageMaker Core SDK (with progress tracking)"""
        job_name = self.start_job_async()
        self.wait_for_completion(job_name)
        return job_name

    def wait_for_automl_slot(self):
        """Wait for AutoML job slot to be available"""
        while True:
            try:
                response = self.sagemaker_client.list_auto_ml_jobs(StatusEquals="InProgress", MaxResults=10)
                running_jobs = len(response.get("AutoMLJobSummaries", []))

                if running_jobs == 0:
                    print("✅ AutoML slot available")
                    break
                else:
                    print(f"⏳ Waiting for {running_jobs} running AutoML job(s) to complete...")
                    time.sleep(120)  # Wait 2 minutes

            except Exception as e:
                print(f"⚠️ Error checking AutoML jobs: {e}")
                time.sleep(60)

    def start_job_async(self) -> str:
        """Start AutoML job without waiting for completion"""

        # Wait for AutoML slot to be available
        self.wait_for_automl_slot()

        # S3 paths
        training_data_s3_path = f"s3://{self.bucket_name}/datasets/{self.config.dataset_name}"
        output_path = f"s3://{self.bucket_name}/models/{self.config.model_type}/"

        print(f"🔄 Starting {self.config.model_type} model training with SageMaker Core...")
        print(f"📊 Training data: {training_data_s3_path}")
        print(f"📋 Using {len(self.config.attributes)} attributes")
        print("⚡ Optimizations: 1 candidate, ENSEMBLING mode")
        print(f"⏱️  Time limits: {self.config.max_runtime_per_job}s per job, {self.config.max_total_runtime}s total")

        # Generate unique job name
        timestamp = int(time.time())
        job_name = f"{self.config.model_type}-credit-model-{timestamp}"

        # Create completion criteria with optimizations
        completion_criteria = AutoMLJobCompletionCriteria(
            max_candidates=self.config.max_candidates,
            max_runtime_per_training_job_in_seconds=self.config.max_runtime_per_job,
        )

        # Create optimized AutoML job configuration
        automl_job_config = AutoMLJobConfig(completion_criteria=completion_criteria, mode="ENSEMBLING")

        # Retry logic for resource limits
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Create AutoML job with explicit session and region
                automl_job = AutoMLJob.create(
                    auto_ml_job_name=job_name,
                    input_data_config=[
                        AutoMLChannel(
                            data_source=AutoMLDataSource(
                                s3_data_source=AutoMLS3DataSource(s3_data_type="S3Prefix", s3_uri=training_data_s3_path)
                            ),
                            target_attribute_name="target",
                        )
                    ],
                    output_data_config=AutoMLOutputDataConfig(s3_output_path=output_path),
                    auto_ml_job_config=automl_job_config,
                    role_arn=self.role_arn,
                    problem_type=self.config.problem_type,
                    auto_ml_job_objective=AutoMLJobObjective(metric_name=self.config.objective_metric),
                    session=self.boto_session,
                    region=self.region,
                )

                print("🚀 Started AutoML job: {job_name}")
                print("📊 Job created successfully - continuing to next model")

                # Store job details
                self.job_name = job_name
                self.automl_job = automl_job

                return job_name

            except Exception as e:
                if "ResourceLimitExceeded" in str(e) and attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 180  # 3, 6, 9 minutes
                    print(f"⏳ Resource limit hit, waiting {wait_time // 60} minutes before retry...")
                    time.sleep(wait_time)
                else:
                    raise

    def wait_for_completion(self, job_name: str):
        """Wait for job completion with progress tracking"""
        print(f"⏳ Tracking job progress: {job_name}")
        self._track_job_progress(job_name)
        self._show_job_summary(job_name)
        print(f"✅ {self.config.model_type.capitalize()} model training completed successfully!")

    def get_job_status(self, job_name: str) -> Dict[str, Any]:
        """Get status of AutoML job"""

        try:
            response = self.sagemaker_client.describe_auto_ml_job(AutoMLJobName=job_name)

            status_info = {
                "job_name": job_name,
                "job_status": response["AutoMLJobStatus"],
                "job_secondary_status": response.get("AutoMLJobSecondaryStatus", "N/A"),
                "creation_time": response["CreationTime"],
                "end_time": response.get("EndTime"),
                "failure_reason": response.get("FailureReason"),
                "best_candidate": response.get("BestCandidate"),
            }

            return status_info

        except (KeyError, ValueError, TypeError) as e:
            print(f"❌ Job status data error: {type(e).__name__}: {str(e)}")
            return {"error": f"Data error: {str(e)}"}
        except Exception as e:
            print(f"❌ Unexpected error getting job status: {type(e).__name__}: {str(e)}")
            return {"error": f"Unexpected error: {str(e)}"}

    def evaluate_model(self, job_name: str) -> Dict[str, float]:
        """Extract metrics from AutoML job"""

        print(f"📊 Extracting {self.config.model_type} model metrics from AutoML job...")

        try:
            # Get AutoML job details
            job_response = self.sagemaker_client.describe_auto_ml_job(AutoMLJobName=job_name)

            # Get best candidate metrics
            best_candidate = job_response.get("BestCandidate")
            if not best_candidate:
                raise RuntimeError("No best candidate found in AutoML job. Job may not have completed successfully.")

            print(f"🏆 Best candidate: {best_candidate.get('CandidateName', 'Unknown')}")

            # Extract metrics from best candidate
            metrics = {}

            # Primary objective metric (AUC)
            objective_metric = best_candidate.get("FinalAutoMLJobObjectiveMetric", {})
            if objective_metric:
                metrics["auc"] = objective_metric.get("Value", 0.0)
                print(f"   • AUC (Primary): {metrics['auc']:.3f}")

            # Try to get validation metrics if available
            try:
                # Get candidates list for more detailed metrics
                candidates_response = self.sagemaker_client.list_candidates_for_auto_ml_job(
                    AutoMLJobName=job_name, CandidateNameEquals=best_candidate.get("CandidateName")
                )

                if candidates_response.get("Candidates"):
                    candidate_details = candidates_response["Candidates"][0]

                    # Extract additional metrics if available
                    inference_containers = candidate_details.get("InferenceContainers", [])
                    if inference_containers:
                        # Model metrics are sometimes in container environment
                        container = inference_containers[0]
                        environment = container.get("Environment", {})

                        # Parse metrics from environment if available
                        for key, value in environment.items():
                            if "accuracy" in key.lower():
                                try:
                                    metrics["accuracy"] = float(value)
                                except (ValueError, TypeError):
                                    pass
                            elif "precision" in key.lower():
                                try:
                                    metrics["precision"] = float(value)
                                except (ValueError, TypeError):
                                    pass
                            elif "recall" in key.lower():
                                try:
                                    metrics["recall"] = float(value)
                                except (ValueError, TypeError):
                                    pass
                            elif "f1" in key.lower():
                                try:
                                    metrics["f1"] = float(value)
                                except (ValueError, TypeError):
                                    pass

            except Exception as e:
                print(f"⚠️ Could not extract detailed metrics: {e}")

            # Only keep AUC - remove any estimated metrics
            if "auc" in metrics:
                # Keep only the real AUC from SageMaker
                metrics = {"auc": metrics["auc"]}
            else:
                raise RuntimeError("AUC metric not found in AutoML job results")

            # Fail if no metrics extracted
            if not metrics:
                raise RuntimeError(
                    "No metrics found in AutoML job. Job may be incomplete or best candidate unavailable."
                )

            print(f"📊 {self.config.model_type.capitalize()} Model Performance:")
            print(f"   AUC: {metrics['auc']:.3f}")

            return metrics

        except Exception as e:
            print(f"❌ Real metrics extraction failed: {str(e)}")
            raise RuntimeError(f"Failed to extract metrics from AutoML job {job_name}: {str(e)}")

    def save_results(self, job_name: str, metrics: Dict[str, float]):
        """Save model results in organized directory structure"""

        # Create organized directory structure
        results_dir = Path("model_results") / self.config.model_type
        results_dir.mkdir(parents=True, exist_ok=True)

        # Determine premium attributes used
        premium_attrs = [attr for attr in self.config.attributes if attr not in BASIC_ATTRIBUTES]

        results = {
            "model_type": self.config.model_type,
            "sdk_used": "SageMaker Core",
            "configuration": {
                "max_candidates": self.config.max_candidates,
                "max_runtime_per_job": self.config.max_runtime_per_job,
                "max_total_runtime": self.config.max_total_runtime,
                "objective_metric": self.config.objective_metric,
                "problem_type": self.config.problem_type,
            },
            "attributes": {
                "basic": BASIC_ATTRIBUTES,
                "premium": premium_attrs,
                "all_used": self.config.attributes,
                "basic_count": len(BASIC_ATTRIBUTES),
                "premium_count": len(premium_attrs),
                "total_count": len(self.config.attributes),
            },
            "job_name": job_name,
            "metrics": metrics,
            "training_time": time.time(),
            "infrastructure": {"bucket": self.bucket_name, "role": self.role_arn, "region": self.region},
        }

        # Add custom attributes info for custom models
        if self.config.model_type == "custom" and self.config.custom_attributes:
            results["custom_attributes"] = self.config.custom_attributes

        # Save results and metrics in organized directories
        timestamp = int(time.time())
        results_file = results_dir / f"results_{timestamp}.json"
        metrics_file = results_dir / f"metrics_{timestamp}.json"

        with open(results_file, "w") as f:
            json.dump(results, f, indent=2)

        with open(metrics_file, "w") as f:
            json.dump(
                {
                    "metrics": {"auc": metrics["auc"]},
                    "job_name": job_name,
                    "model_type": self.config.model_type,
                    "attributes_used": self.config.attributes,
                    "extraction_method": "sagemaker_automl",
                    "note": "Only AUC from SageMaker AutoML - no estimated metrics",
                },
                f,
                indent=2,
            )

        print(f"💾 Results saved to: {results_file}")
        print(f"💾 Metrics saved to: {metrics_file}")
        return str(results_file)


def create_model_config(model_type: str, custom_attributes: List[str] = None, **kwargs) -> ModelConfig:
    """Create model configuration with optimized defaults for faster training"""

    if model_type == "baseline":
        defaults = {
            "max_candidates": 1,  # Optimized: Single candidate for speed
            "max_runtime_per_job": 180,  # Optimized: 3 minutes per job
            "max_total_runtime": 360,  # Optimized: 6 minutes total
        }
    elif model_type in ["bronze", "silver", "gold", "custom"]:
        defaults = {
            "max_candidates": 1,  # Optimized: Single candidate for speed
            "max_runtime_per_job": 180,  # Optimized: 3 minutes per job
            "max_total_runtime": 360,  # Optimized: 6 minutes total for premium models
        }
    else:
        raise ValueError(f"Unknown model type: {model_type}")

    # Override defaults with provided kwargs
    defaults.update(kwargs)

    return ModelConfig(model_type=model_type, custom_attributes=custom_attributes, **defaults)


def main():
    """Main function with command line interface"""

    parser = argparse.ArgumentParser(description="Unified ML Model Trainer")
    parser.add_argument(
        "--model-type",
        choices=["baseline", "bronze", "silver", "gold", "custom", "all"],
        required=True,
        help='Type of model to train (use "all" to train all benchmark models)',
    )
    parser.add_argument("--custom-attributes", nargs="+", help="Custom premium attributes for custom model type")
    parser.add_argument("--max-candidates", type=int, help="Maximum number of candidates to evaluate")
    parser.add_argument("--max-runtime-per-job", type=int, help="Maximum runtime per training job (seconds)")
    parser.add_argument("--max-total-runtime", type=int, help="Maximum total runtime (seconds)")
    parser.add_argument("--objective-metric", default="AUC", help="Objective metric for optimization")

    args = parser.parse_args()

    print("🎯 ML Feature Analyzer - Unified Model Training")
    print("=" * 60)
    print("ℹ️  Note: Model training typically takes 10-15 minutes per model")
    print("")

    try:
        if args.model_type == "all":
            # Train all models sequentially with async monitoring
            model_types = ["baseline", "bronze", "silver", "gold"]
            print(f"🎯 Training models sequentially with async monitoring: {', '.join(model_types)}")
            print("⏰ Expected total completion time: ~25-30 minutes (sequential start, parallel monitoring)")
            print("ℹ️  AWS AutoML limit: 1 concurrent job per region (with job cleanup checks)")

            config_kwargs = {
                k: v for k, v in vars(args).items() if v is not None and k not in ["model_type", "custom_attributes"]
            }

            job_info = []

            # Phase 1: Start jobs sequentially with delays
            for i, model_type in enumerate(model_types):
                print(f"\n🔄 Starting {model_type} model...")

                config = create_model_config(model_type, **config_kwargs)
                trainer = ModelTrainer(config)

                # Start job (don't wait for completion)
                job_name = trainer.start_job_async()
                job_info.append(
                    {"model_type": model_type, "job_name": job_name, "trainer": trainer, "start_time": time.time()}
                )

                # Wait before starting next job (AWS limit: 1 concurrent AutoML job)
                if i < len(model_types) - 1:
                    print("⏳ Waiting 3 minutes before starting next job...")
                    time.sleep(180)  # 3 minutes - ensures previous job fully started

            # Phase 2: Monitor all jobs in parallel
            print(f"\n👀 Monitoring {len(job_info)} jobs in parallel...")

            def monitor_and_save(info):
                """Monitor single job until completion and save results"""
                job_name = info["job_name"]
                trainer = info["trainer"]
                model_type = info["model_type"]

                # Wait for completion
                trainer.wait_for_completion(job_name)

                # Extract metrics and save
                metrics = trainer.evaluate_model(job_name)
                trainer.save_results(job_name, metrics)

                return (model_type, metrics)

            with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
                # Submit monitoring tasks
                monitor_futures = [executor.submit(monitor_and_save, info) for info in job_info]

                # Wait for all to complete
                results = []
                for future in concurrent.futures.as_completed(monitor_futures):
                    model_type, metrics = future.result()
                    results.append((model_type, metrics))
                    print(f"✅ {model_type} completed: AUC {metrics['auc']:.3f}")

            # Summary
            print("\n🎯 ALL MODELS COMPLETED!")
            for model_type, metrics in sorted(results):
                print(f"{model_type.upper():>8}: AUC {metrics['auc']:.3f}")
            return

        # Single model training (existing logic)
        config_kwargs = {
            k: v for k, v in vars(args).items() if v is not None and k not in ["model_type", "custom_attributes"]
        }
        config = create_model_config(args.model_type, custom_attributes=args.custom_attributes, **config_kwargs)

        # Initialize trainer
        trainer = ModelTrainer(config)

        # Train model
        print(f"\n🔄 Phase 1: Training {config.model_type.capitalize()} Model")
        print("⏰ Expected completion time: 10-15 minutes")
        job_name = trainer.train_model()

        # Evaluate model
        print(f"\n📊 Phase 2: Evaluating {config.model_type.capitalize()} Model")
        metrics = trainer.evaluate_model(job_name)

        # Save results
        print("\n💾 Phase 3: Saving Results")
        results_file = trainer.save_results(job_name, metrics)

        print(f"\n✅ {config.model_type.capitalize()} model training completed successfully!")
        print(f"📋 Results saved to: {results_file}")

        # Summary
        premium_attrs = [attr for attr in config.attributes if attr not in BASIC_ATTRIBUTES]
        print(f"\n📊 {config.model_type.upper()} MODEL SUMMARY:")
        print("   • SDK: SageMaker Core")
        print(f"   • Attributes: {len(config.attributes)} total")
        print(f"     - Basic: {len(BASIC_ATTRIBUTES)} attributes")
        if premium_attrs:
            print(f"     - Premium: {len(premium_attrs)} attributes ({', '.join(premium_attrs[:3])}...)")
        if config.model_type == "custom" and config.custom_attributes:
            print(f"     - Custom selection: {', '.join(config.custom_attributes)}")
        print(f"   • AUC: {metrics['auc']:.3f}")
        print(f"   • Results saved in: model_results/{config.model_type}/")

    except Exception as e:
        print(f"\n❌ Model training failed: {str(e)}")
        import traceback

        traceback.print_exc()
        raise


if __name__ == "__main__":
    main()
