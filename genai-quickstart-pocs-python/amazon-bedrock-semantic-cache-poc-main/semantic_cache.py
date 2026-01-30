import streamlit as st
import datetime
import time
import json
from typing import Dict, List, Optional
from utils import BEDROCK_CLIENT, OPENSEARCH_CLIENT, OPENSEARCH_INDEX

# Initialize similarity threshold in session state
if 'similarity_threshold' not in st.session_state:
    st.session_state.similarity_threshold = 0.7

# Get embeddings for given text using Amazon Bedrock
def get_embedding(text: str) -> List[float]:

    body = json.dumps({"inputText": text})
    response = BEDROCK_CLIENT.invoke_model(
        body=body,
        modelId=st.session_state.embeddingmodel['modelId'],
        accept="application/json",
        contentType="application/json"
    )
    response_body = json.loads(response.get("body").read())
    return response_body.get("embedding")

# Create OpenSearch index with appropriate mappings
def create_index() -> None:

    # Define the index mapping
    index_mapping = {
        "settings": {
            "index": {"knn": True, "knn.algo_param.ef_search": 512}
        },
        "mappings": {
            "properties": {
                "query_vectors": {
                    "type": "knn_vector",
                    "dimension": 1024,
                    "method": {
                        "engine":"faiss",
                        "space_type": "l2",
                        "name": "hnsw",
                        "parameters":{"ef_construction": 512, "m":16}
                    }
                },
                "query": {"type": "text"},
                "response": {"type": "text"},
                "create_date": {"type": "date"},
                "ttl": {"type": "integer"}
            }
        }
    }

    OPENSEARCH_CLIENT.indices.create(index=OPENSEARCH_INDEX, body=index_mapping)

# Save query and response to OpenSearch index
def save_response(query: str, response: str) -> Dict:

    if not OPENSEARCH_CLIENT.indices.exists(index=OPENSEARCH_INDEX):
        create_index()
        time.sleep(10) # Wait for index creation

    vectors = get_embedding(query)
    index_body = {
        "query": query,
        "query_vectors": vectors,
        "response": response,
        "create_date": datetime.datetime.now().isoformat(),
        "ttl": 3600  # Time to live in seconds
    }

    cache_response = OPENSEARCH_CLIENT.index(
        index=OPENSEARCH_INDEX,
        body=index_body,
        refresh=False,
    )
    return cache_response

# Perform k-NN search in OpenSearch index.
def get_knn_results(user_vectors: List[float]) -> Optional[Dict]:

    query = {
        "size": 1,
        "query": {"knn": {"query_vectors": {"vector": user_vectors, "k": 3}}},
        "_source": False,
        "fields": ["query", "response", "create_date", "ttl"],
    }

    response = OPENSEARCH_CLIENT.search(body=query, index=OPENSEARCH_INDEX,)

    # Log similarity scores
    # print("Scores for all hits:")
    # for hit in response['hits']['hits']:
    #     print(f"Document ID: {hit['_id']}, Score: {hit['_score']}")

    filtered_hits = [
        hit for hit in response['hits']['hits']
        if hit['_score'] > st.session_state.similarity_threshold
    ]

    if filtered_hits:
        top_hit = filtered_hits[0]
        return {
            'query': top_hit['fields']['query'][0],
            'response': top_hit['fields']['response'][0],
            'create_date': top_hit['fields']['create_date'][0],
            'ttl': top_hit['fields']['ttl'][0],
            'score': top_hit['_score']
        }
    return None

# Query the cache for a similar question
def query_cache(query: str) -> Optional[str]:

    if OPENSEARCH_CLIENT.indices.exists(index=OPENSEARCH_INDEX):
        query_embeddings = get_embedding(query)
        result = get_knn_results(query_embeddings)
        if result:
            # print(f"Query: {result['query']}")
            # print(f"Response: {result['response']}")
            # print(f"Create Date: {result['create_date']}")
            # print(f"TTL: {result['ttl']}")
            # print(f"Score: {result['score']}")
            return result['response']
    return None

# Retrieve all entries from the cache
def view_cache() -> List[Dict]:

    if OPENSEARCH_CLIENT.indices.exists(index=OPENSEARCH_INDEX):
        query = {
            "size": 15,  # Adjust this value based on how many entries you want to display
            "query": {"match_all": {}},
            "_source": ["query", "response", "create_date", "ttl"],
        }

        response = OPENSEARCH_CLIENT.search(body=query, index=OPENSEARCH_INDEX,)
        return [hit['_source'] for hit in response['hits']['hits']]
    return None

# Clear the entire cache by deleting and recreating the index
def clear_cache() -> None:

    if OPENSEARCH_CLIENT.indices.exists(index=OPENSEARCH_INDEX):
        OPENSEARCH_CLIENT.indices.delete(index=OPENSEARCH_INDEX)
        create_index()
        st.success("Cache Cleared!")

