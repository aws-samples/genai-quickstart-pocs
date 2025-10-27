"""Utility functions for AWS service clients and common operations"""

import os
import boto3
import streamlit as st
from typing import List, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


# AWS service client management with caching
@st.cache_resource
def get_bedrock_client():
    """Get cached Bedrock runtime client"""
    profile_name = os.getenv("AWS_PROFILE")
    if profile_name:
        boto3.setup_default_session(profile_name=profile_name)
    return boto3.client("bedrock-runtime", region_name=get_aws_region())


@st.cache_resource
def get_bedrock_standalone_client():
    """Get cached Bedrock client for model discovery"""
    profile_name = os.getenv("AWS_PROFILE")
    if profile_name:
        boto3.setup_default_session(profile_name=profile_name)
    return boto3.client("bedrock", region_name=get_aws_region())


@st.cache_resource
def get_sagemaker_client():
    """Get cached SageMaker client"""
    profile_name = os.getenv("AWS_PROFILE")
    if profile_name:
        boto3.setup_default_session(profile_name=profile_name)
    return boto3.client("sagemaker", region_name=get_aws_region())


# Model discovery with caching
@st.cache_data
def get_foundation_models() -> List[Dict[str, Any]]:
    """Get available Bedrock foundation models (cached)"""
    client = get_bedrock_standalone_client()
    response = client.list_foundation_models(byOutputModality="TEXT", byInferenceType="ON_DEMAND")
    return response["modelSummaries"]


@st.cache_data
def get_anthropic_models() -> List[Dict[str, Any]]:
    """Get Anthropic models specifically (cached)"""
    all_models = get_foundation_models()
    return [model for model in all_models if model["modelId"].startswith("anthropic.")]


# Configuration helpers
def get_aws_region() -> str:
    """Get AWS region from environment or default"""
    return os.getenv("AWS_REGION", "us-east-1")


def sanitize_input(text: str) -> str:
    """Basic input sanitization"""
    import html
    import re

    if not isinstance(text, str):
        return ""
    # Remove potentially dangerous characters
    clean_text = re.sub(r'[<>"\'/]', "", text.strip())
    return html.escape(clean_text)
