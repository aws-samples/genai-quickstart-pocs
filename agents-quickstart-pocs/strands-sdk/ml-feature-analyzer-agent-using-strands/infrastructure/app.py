#!/usr/bin/env python3
"""CDK app for ML Feature Analyzer Agent infrastructure"""

import aws_cdk as cdk
import os
from dotenv import load_dotenv
from ml_stack import MLFeatureAnalyzerStack

# Load environment variables from .env file
load_dotenv()

app = cdk.App()

# Environment configuration from .env file with fallback to AWS CLI
env = cdk.Environment(
    account=app.account, region=os.getenv("AWS_REGION", app.region)  # Use .env first, fallback to CLI
)

# Create the main stack
MLFeatureAnalyzerStack(
    app,
    "MLFeatureAnalyzerStack",
    env=env,
    description="ML Feature Analyzer Agent using SageMaker Autopilot and GenAI for attribute value demonstration",
)

app.synth()
