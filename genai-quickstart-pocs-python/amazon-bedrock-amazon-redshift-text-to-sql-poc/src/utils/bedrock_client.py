"""
Amazon Bedrock client utilities.
"""
import boto3
import json
import streamlit as st
from ..config.settings import AWS_REGION, DEFAULT_MODEL_ID


def initialize_bedrock_clients():
    """
    Initialize Amazon Bedrock clients.
    
    Returns:
        tuple: (bedrock_client, bedrock_runtime_client)
    """
    try:
        bedrock_client = boto3.client("bedrock", region_name=AWS_REGION)
        bedrock_runtime_client = boto3.client("bedrock-runtime", region_name=AWS_REGION)
        return bedrock_client, bedrock_runtime_client
    except Exception as e:
        st.error(f"Error initializing Bedrock clients: {e}")
        return None, None


def get_available_models():
    """
    Fetch available models from Amazon Bedrock.
    
    Returns:
        list: List of available model IDs.
    """
    bedrock_client, _ = initialize_bedrock_clients()
    try:
        response = bedrock_client.list_foundation_models()
        models = [model["modelId"] for model in response["modelSummaries"]]
        return models
    except Exception as e:
        st.error(f"Error fetching models from Bedrock: {e}")
        return [DEFAULT_MODEL_ID]


def invoke_bedrock_model(prompt, model_id=DEFAULT_MODEL_ID):
    """
    Invoke Amazon Bedrock model with a prompt.
    
    Args:
        prompt (str): The prompt to send to the model.
        model_id (str, optional): The model ID to use. Defaults to DEFAULT_MODEL_ID.
        
    Returns:
        dict: The model response.
    """
    _, bedrock_runtime_client = initialize_bedrock_clients()
    
    payload = {
        "messages": [{"role": "user", "content": [{"text": prompt}]}]
    }

    try:
        response = bedrock_runtime_client.invoke_model(
            body=json.dumps(payload),
            modelId=model_id,
            contentType="application/json",
            accept="application/json",
        )
        result = json.loads(response["body"].read().decode("utf-8"))
        return result
    except Exception as e:
        st.error(f"Error invoking Bedrock model: {e}")
        return None


def suggest_chart_from_bedrock(df, model_id=DEFAULT_MODEL_ID):
    """
    Use Amazon Bedrock to suggest a chart type based on the data.
    
    Args:
        df (pandas.DataFrame): The DataFrame to analyze.
        model_id (str, optional): The model ID to use. Defaults to DEFAULT_MODEL_ID.
        
    Returns:
        str: The suggested chart type.
    """
    if df.empty or len(df.columns) < 2:
        return None  # Skip if the dataframe is empty or has fewer than 2 columns

    # Prepare a summary of the DataFrame for Bedrock
    column_summary = [
        {
            "column_name": col,
            "data_type": str(df[col].dtype),
            "unique_values": df[col].nunique()
        }
        for col in df.columns
    ]

    # Convert column summary into a properly formatted string
    column_summary_str = json.dumps(column_summary, indent=2)

    # Prepare the prompt
    prompt = (
        f"Based on the following data schema and sample:\n\n"
        f"{column_summary_str}\n\n"
        "Suggest a suitable chart type (e.g., bar, line, scatter) and columns to use for visualization. "
        "Respond with 'none' if the data is not suitable for plotting."
    )

    result = invoke_bedrock_model(prompt, model_id)
    
    if result:
        content = result.get("output", {}).get("message", {}).get("content", [])
        if isinstance(content, list) and content:
            suggestion = content[0].get("text", "").lower()
            return suggestion
    
    return "none"