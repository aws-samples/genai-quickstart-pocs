"""
FAISS vector store manager for the GenAI Sales Analyst (DynamoDB) application.

Keeps schema descriptions and their Amazon Titan embeddings in an in-memory
FAISS index so the workflow can retrieve relevant context for a question.
"""
from typing import Any, Dict, List, Optional

import faiss
import numpy as np

# amazon.titan-embed-text-v1, used by BedrockHelper.get_embeddings, returns 1536 dimensions.
DEFAULT_DIMENSION = 1536


class FAISSManager:
    """
    Manages an in-memory FAISS vector store.

    app.py reads and writes ``bedrock_client``, ``index``, ``texts`` and
    ``metadata`` directly, so they are kept as plain attributes.
    """

    def __init__(self, bedrock_client, dimension: int = DEFAULT_DIMENSION):
        """
        Args:
            bedrock_client: BedrockHelper used to compute embeddings
            dimension: Dimension of the embedding vectors
        """
        self.bedrock_client = bedrock_client
        self.dimension = dimension
        self.index = faiss.IndexFlatL2(dimension)
        self.texts: List[str] = []
        self.metadata: List[Dict[str, Any]] = []

    def add_texts(self, texts: List[str], metadatas: Optional[List[Dict[str, Any]]] = None):
        """
        Embed texts and add them to the index.

        Args:
            texts: Text strings to add
            metadatas: Optional metadata dictionaries, one per text
        """
        if not texts:
            return
        if metadatas is None:
            metadatas = [{} for _ in texts]
        if len(metadatas) != len(texts):
            raise ValueError("metadatas must have one entry per text")

        embeddings = [self.bedrock_client.get_embeddings(text) for text in texts]
        self.index.add(np.array(embeddings, dtype="float32").reshape(len(texts), -1))
        self.texts.extend(texts)
        self.metadata.extend(metadatas)

    def similarity_search(self, query: str, k: int = 4) -> List[Dict[str, Any]]:
        """
        Return up to ``k`` stored texts closest to the query.

        Args:
            query: Query text
            k: Number of results to return

        Returns:
            Dictionaries with ``text``, ``metadata`` and ``distance``
        """
        k = min(k, len(self.texts))
        if k <= 0:
            return []

        query_array = np.array([self.bedrock_client.get_embeddings(query)], dtype="float32")
        distances, indices = self.index.search(query_array, k)

        results = []
        for distance, idx in zip(distances[0], indices[0]):
            if 0 <= idx < len(self.texts):
                results.append({
                    "text": self.texts[idx],
                    "metadata": self.metadata[idx],
                    "distance": float(distance),
                })
        return results
