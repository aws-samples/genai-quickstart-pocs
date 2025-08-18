"""Data pipeline for German Credit dataset processing and feature segmentation"""

import pandas as pd
import boto3
from io import StringIO
import urllib.request
import os
from typing import Optional, Dict
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Feature definitions based on German Credit Dataset documentation
FEATURE_NAMES = [
    "checking_account_status",  # A11, A12, A13, A14
    "duration_months",  # numerical
    "credit_history",  # A30, A31, A32, A33, A34
    "purpose",  # A40, A41, A42, A43, A44, A45, A46, A47, A48, A49, A410
    "credit_amount",  # numerical
    "savings_account_status",  # A61, A62, A63, A64, A65
    "employment_status",  # A71, A72, A73, A74, A75
    "installment_rate",  # numerical (percentage of disposable income)
    "personal_status_sex",  # A91, A92, A93, A94, A95
    "other_debtors",  # A101, A102, A103
    "present_residence_since",  # numerical (years)
    "property",  # A121, A122, A123, A124
    "age",  # numerical
    "other_installment_plans",  # A141, A142, A143
    "housing",  # A151, A152, A153
    "existing_credits_count",  # numerical
    "job",  # A171, A172, A173, A174
    "dependents_count",  # numerical
    "telephone",  # A191, A192
    "foreign_worker",  # A201, A202
    "target",  # 1 = good credit, 2 = bad credit
]

# Basic attributes (demographic and loan basics)
BASIC_ATTRIBUTES = ["age", "duration_months", "credit_amount", "installment_rate", "employment_status"]

# Premium attributes (behavioral, financial, verification data)
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
    "purpose",  # Added purpose as premium attribute
]


class GermanCreditDataPipeline:
    """Handles German Credit dataset loading, preprocessing, and dataset creation for SageMaker AutoML"""

    def __init__(self, s3_bucket: Optional[str] = None):
        self.s3_bucket = s3_bucket

        # Configure AWS session with environment variables
        aws_profile = os.getenv("AWS_PROFILE")
        aws_region = os.getenv("AWS_REGION", "us-east-1")

        if aws_profile:
            boto3.setup_default_session(profile_name=aws_profile)

        self.s3_client = boto3.client("s3", region_name=aws_region) if s3_bucket else None
        self.raw_data = None
        self.processed_data = None

    def download_dataset(self, data_path: str = "data/german.data") -> str:
        """Download German Credit Dataset from UCI repository if not exists"""

        # Create data directory if it doesn't exist
        os.makedirs(os.path.dirname(data_path), exist_ok=True)

        if not os.path.exists(data_path):
            print("📥 Downloading German Credit Dataset from UCI repository...")
            url = "https://archive.ics.uci.edu/ml/machine-learning-databases/statlog/german/german.data"

            try:
                urllib.request.urlretrieve(url, data_path)
                print(f"✅ Dataset downloaded to: {data_path}")
            except Exception as e:
                print(f"❌ Failed to download dataset: {e}")
                print(
                    "Please manually download from: "
                    "https://archive.ics.uci.edu/ml/machine-learning-databases/statlog/german/german.data"
                )
                raise
        else:
            print(f"📊 Using existing dataset: {data_path}")

        return data_path

    def load_german_credit_data(self, data_path: str = "data/german.data") -> pd.DataFrame:
        """Load and parse German Credit Dataset"""

        print("📊 Loading German Credit Dataset...")

        # Download dataset if it doesn't exist
        data_path = self.download_dataset(data_path)

        # Read the space-separated data file
        df = pd.read_csv(data_path, sep=" ", header=None, names=FEATURE_NAMES)

        print(f"✅ Dataset loaded: {len(df)} records, {len(df.columns)} features")
        print(f"📋 Features: {list(df.columns)}")

        # Convert target to binary (1=good credit, 2=bad credit -> 0=bad, 1=good)
        df["target"] = (df["target"] == 1).astype(int)

        self.raw_data = df
        return df

    def preprocess_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Preprocess the dataset for ML training"""

        print("🔄 Preprocessing dataset...")

        processed_df = df.copy()

        # Handle categorical variables - convert to numeric codes for now
        # In a production system, you'd want proper encoding
        categorical_columns = processed_df.select_dtypes(include=["object"]).columns

        for col in categorical_columns:
            if col != "target":
                # Convert categorical codes (A11, A12, etc.) to numeric
                processed_df[col] = pd.Categorical(processed_df[col]).codes

        # Ensure all numeric columns are properly typed
        numeric_columns = [
            "duration_months",
            "credit_amount",
            "installment_rate",
            "present_residence_since",
            "age",
            "existing_credits_count",
            "dependents_count",
        ]

        for col in numeric_columns:
            processed_df[col] = pd.to_numeric(processed_df[col], errors="coerce")

        # Remove any rows with missing values
        processed_df = processed_df.dropna()

        print(f"✅ Preprocessing complete: {len(processed_df)} records retained")

        self.processed_data = processed_df
        return processed_df

    def create_baseline_dataset(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create dataset with only basic demographic attributes"""

        baseline_features = BASIC_ATTRIBUTES + ["target"]
        baseline_df = df[baseline_features].copy()

        print("📊 Baseline dataset created:")
        print(f"   • Records: {len(baseline_df)}")
        print(f"   • Features: {len(BASIC_ATTRIBUTES)} basic attributes")
        print(f"   • Attributes: {', '.join(BASIC_ATTRIBUTES)}")

        return baseline_df

    def create_enhanced_dataset(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create dataset with all attributes (basic + premium)"""

        all_features = BASIC_ATTRIBUTES + PREMIUM_ATTRIBUTES + ["target"]
        enhanced_df = df[all_features].copy()

        print("🚀 Enhanced dataset created:")
        print(f"   • Records: {len(enhanced_df)}")
        print(f"   • Features: {len(BASIC_ATTRIBUTES + PREMIUM_ATTRIBUTES)} total attributes")
        print(f"   • Basic: {len(BASIC_ATTRIBUTES)} attributes")
        print(f"   • Premium: {len(PREMIUM_ATTRIBUTES)} attributes")

        return enhanced_df

    def upload_to_s3(self, df: pd.DataFrame, key: str) -> str:
        """Upload dataset to S3 for SageMaker training"""

        if not self.s3_bucket or not self.s3_client:
            raise ValueError("S3 bucket and client must be configured")

        # Convert DataFrame to CSV
        csv_buffer = StringIO()
        df.to_csv(csv_buffer, index=False)

        # Upload to S3
        self.s3_client.put_object(Bucket=self.s3_bucket, Key=key, Body=csv_buffer.getvalue())

        s3_path = f"s3://{self.s3_bucket}/{key}"
        print(f"✅ Dataset uploaded to: {s3_path}")

        return s3_path

    def save_datasets(self, baseline_df: pd.DataFrame, enhanced_df: pd.DataFrame):
        """Save training datasets locally and upload to S3 if configured"""

        # Create processed directory
        os.makedirs("data/processed", exist_ok=True)

        # Save locally
        datasets = {"data/processed/baseline_train.csv": baseline_df, "data/processed/enhanced_train.csv": enhanced_df}

        for filepath, dataset in datasets.items():
            dataset.to_csv(filepath, index=False)
            print(f"💾 Saved: {filepath} ({len(dataset)} records)")

        # Upload to S3 if configured
        if self.s3_bucket and self.s3_client:
            print("📤 Uploading datasets to S3...")
            self.upload_to_s3(baseline_df, "datasets/baseline_train.csv")
            self.upload_to_s3(enhanced_df, "datasets/enhanced_train.csv")

    def get_dataset_summary(self) -> Dict:
        """Generate summary statistics for the dataset"""

        if self.processed_data is None:
            raise ValueError("Must load and preprocess data first")

        df = self.processed_data

        summary = {
            "total_records": len(df),
            "total_features": len(df.columns) - 1,  # Exclude target
            "basic_features": len(BASIC_ATTRIBUTES),
            "premium_features": len(PREMIUM_ATTRIBUTES),
            "good_credit_ratio": df["target"].mean(),
            "bad_credit_ratio": 1 - df["target"].mean(),
            "feature_breakdown": {"basic": BASIC_ATTRIBUTES, "premium": PREMIUM_ATTRIBUTES},
        }

        return summary


def main():
    """Process German Credit dataset for ML training"""

    print("🎯 German Credit Dataset Processing Pipeline")
    print("=" * 50)

    # Get S3 bucket from CloudFormation stack
    try:
        # Configure AWS session with environment variables
        aws_profile = os.getenv("AWS_PROFILE")
        aws_region = os.getenv("AWS_REGION", "us-east-1")

        if aws_profile:
            boto3.setup_default_session(profile_name=aws_profile)

        cfn_client = boto3.client("cloudformation", region_name=aws_region)
        response = cfn_client.describe_stacks(StackName="MLFeatureAnalyzerStack")
        outputs = {o["OutputKey"]: o["OutputValue"] for o in response["Stacks"][0]["Outputs"]}
        s3_bucket = outputs["DataBucketName"]
        print(f"📦 Using S3 bucket: {s3_bucket}")
    except Exception as e:
        print(f"⚠️ Could not get S3 bucket from CloudFormation: {e}")
        s3_bucket = None

    # Initialize pipeline with S3 bucket for upload
    pipeline = GermanCreditDataPipeline(s3_bucket=s3_bucket)

    # Load and preprocess data (auto-downloads if needed)
    raw_df = pipeline.load_german_credit_data()
    processed_df = pipeline.preprocess_data(raw_df)

    # Create datasets for model training
    baseline_df = pipeline.create_baseline_dataset(processed_df)
    enhanced_df = pipeline.create_enhanced_dataset(processed_df)

    # Save datasets (SageMaker AutoML handles train/test splitting)
    pipeline.save_datasets(baseline_df, enhanced_df)

    # Print summary
    summary = pipeline.get_dataset_summary()
    print("\n📊 Dataset Summary:")
    print(f"   • Total Records: {summary['total_records']}")
    print(f"   • Basic Features: {summary['basic_features']}")
    print(f"   • Premium Features: {summary['premium_features']}")
    print(f"   • Good Credit Ratio: {summary['good_credit_ratio']:.3f}")
    print(f"   • Bad Credit Ratio: {summary['bad_credit_ratio']:.3f}")

    print("\n✅ Data pipeline processing complete!")
    print("💡 Note: SageMaker AutoML will handle train/validation splitting automatically")


if __name__ == "__main__":
    main()
