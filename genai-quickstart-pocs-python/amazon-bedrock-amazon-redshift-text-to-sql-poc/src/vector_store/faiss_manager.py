"""
FAISS vector store manager for the GenAI Sales Analyst application.
"""
import faiss
import numpy as np
import pickle
import boto3
from datetime import datetime
from typing import List, Dict, Any, Optional


class FAISSManager:
    """
    Manages FAISS vector store operations.
    """
    
    def __init__(self, bedrock_client, s3_bucket: Optional[str] = None, dimension: int = 1536):
        """
        Initialize the FAISS manager.
        
        Args:
            bedrock_client: Client for Amazon Bedrock API
            s3_bucket: S3 bucket name for storing indices
            dimension: Dimension of the embedding vectors
        """
        self.bedrock_client = bedrock_client
        self.s3_bucket = None  # S3 functionality disabled
        self.index = faiss.IndexFlatL2(dimension)
        self.texts = []
        self.metadata = []
    
    def add_texts(self, texts: List[str], metadatas: Optional[List[Dict[str, Any]]] = None):
        """
        Add texts and their embeddings to the vector store.
        
        Args:
            texts: List of text strings to add
            metadatas: Optional list of metadata dictionaries
        """
        if metadatas is None:
            metadatas = [{} for _ in texts]
        
        embeddings = []
        for text in texts:
            embedding = self.bedrock_client.get_embeddings(text)
            embeddings.append(embedding)
        
        embeddings_array = np.array(embeddings).astype('float32')
        self.index.add(embeddings_array)
        self.texts.extend(texts)
        self.metadata.extend(metadatas)
    
    def similarity_search(self, query: str, k: int = 4) -> List[Dict[str, Any]]:
        """
        Search for similar texts based on the query.
        
        Args:
            query: Query text
            k: Number of results to return
            
        Returns:
            List of dictionaries containing text, metadata, and distance
        """
        # Handle empty index
        if len(self.texts) == 0:
            return []
            
        try:
            # Get query embedding
            query_embedding = self.bedrock_client.get_embeddings(query)
            query_array = np.array([query_embedding]).astype('float32')
            
            # Limit k to the number of items in the index
            k = min(k, len(self.texts))
            if k == 0:
                return []
                
            # Search
            distances, indices = self.index.search(query_array, k)
            
            results = []
            for i, idx in enumerate(indices[0]):
                if idx < len(self.texts) and idx >= 0:
                    results.append({
                        'text': self.texts[idx],
                        'metadata': self.metadata[idx],
                        'distance': float(distances[0][i])
                    })
            return results
        except Exception as e:
            print(f"Error in similarity search: {str(e)}")
            # Return empty results on error
            return []
    
    def save_index(self) -> str:
        """
        Save the index and data to S3.
        
        Returns:
            Message indicating where the index was saved
        """
        if not self.s3_bucket:
            return "No S3 bucket specified, index not saved"
            
        import os
        s3 = boto3.client('s3')
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        index_bytes = faiss.serialize_index(self.index)
        index_key = f'vector_store/index_{timestamp}.faiss'
        s3.put_object(Bucket=self.s3_bucket, Key=index_key, Body=index_bytes)
        
        data = {'texts': self.texts, 'metadata': self.metadata}
        data_key = f'vector_store/data_{timestamp}.pkl'
        s3.put_object(Bucket=self.s3_bucket, Key=data_key, Body=pickle.dumps(data))
        
        return f"Index saved: {index_key}, Data saved: {data_key}"
    
    def load_index(self, index_key: str, data_key: str):
        """
        Load the index and data from S3.
        
        Args:
            index_key: S3 key for the index file
            data_key: S3 key for the data file
        """
        if not self.s3_bucket:
            raise ValueError("No S3 bucket specified")
            
        s3 = boto3.client('s3')
        
        index_response = s3.get_object(Bucket=self.s3_bucket, Key=index_key)
        index_bytes = index_response['Body'].read()
        self.index = faiss.deserialize_index(index_bytes)
        
        data_response = s3.get_object(Bucket=self.s3_bucket, Key=data_key)
        data = pickle.loads(data_response['Body'].read())
        self.texts = data['texts']
        self.metadata = data['metadata']