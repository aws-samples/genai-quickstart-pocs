"""
Helper functions for the GenAI Sales Analyst application.
"""
import pandas as pd
from typing import Dict, Any, List
import os
from dotenv import load_dotenv


def load_environment():
    """
    Load environment variables from .env file.
    """
    load_dotenv()
    
    return {
        'aws_region': os.getenv('AWS_REGION', 'us-east-1'),
        's3_bucket': os.getenv('S3_BUCKET'),
        'langfuse_public_key': os.getenv('LANGFUSE_PUBLIC_KEY'),
        'langfuse_secret_key': os.getenv('LANGFUSE_SECRET_KEY')
    }


def process_uploaded_data(df: pd.DataFrame, vector_store):
    """
    Process and store uploaded data in vector store.
    
    Args:
        df: DataFrame with metadata
        vector_store: Vector store instance
        
    Returns:
        Result message from saving the index
    """
    texts = []
    metadatas = []
    
    for _, row in df.iterrows():
        text = f"{row['column_name']}: {row['description']}"
        texts.append(text)
        metadatas.append(row.to_dict())
    
    vector_store.add_texts(texts, metadatas)
    save_result = vector_store.save_index()
    
    return save_result