import base64
import io
import json
from multiprocessing.pool import ThreadPool
import os
import shutil

import boto3
import datasets
from datasets import load_dataset
import json_repair
from langchain_community.chat_models.bedrock import BedrockChat
from langchain_community.embeddings import BedrockEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.messages import HumanMessage
from PIL import Image
import requests

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-west-2")
BEDROCK_IMAGE_MODEL_ID = "amazon.titan-embed-image-v1"

BEDROCK_LLM_MODEL_ID="anthropic.claude-3-5-sonnet-20241022-v2:0"
STORAGE_PATH = "./storage"

class ImageService:
    def __init__(self):
        # Storage paths
        self.storage_path = STORAGE_PATH
        self.image_path = STORAGE_PATH + "/image"
        self.vector_store_path = STORAGE_PATH + "/vector_store"
        self.pool = ThreadPool(processes=4)

        # Initialize storage and embeddings
        self._setup_storage()

        self.bedrock_client = boto3.client(
            "bedrock-runtime",
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )

        self.multimodal_embeddings = self._initialize_embeddings(self.bedrock_client, BEDROCK_IMAGE_MODEL_ID)

        model_kwargs = {
            "max_tokens": 2048,
            "temperature": 0.0,
            "top_k": 250,
            "top_p": 1
        }

        self.llm_chat = BedrockChat(
            model_id=BEDROCK_LLM_MODEL_ID,
            client=self.bedrock_client,
            model_kwargs=model_kwargs,
        )

        self.vector_store = self._load_vector_store()

    def _setup_storage(self):
        """Create necessary storage directories and clean existing files"""
        if os.path.exists(self.storage_path):
            shutil.rmtree(self.storage_path)
        os.makedirs(self.storage_path, exist_ok=True)
        os.makedirs(self.vector_store_path, exist_ok=True)
        os.makedirs(self.image_path, exist_ok=True)

    def _initialize_embeddings(self, bedrock_client, model_id):
        """Initialize AWS Bedrock client and get embeddings"""

        return BedrockEmbeddings(
            client=bedrock_client,
            model_id=model_id
        )

    def _load_vector_store(self) -> FAISS:
        """Load existing FAISS vector store if available"""
        try:
            if os.path.exists(self.vector_store_path) and os.listdir(self.vector_store_path):
                print(f"Loading existing vector store from {self.vector_store_path}")
                return FAISS.load_local(
                    folder_path=self.vector_store_path,
                    embeddings=self.multimodal_embeddings,
                    allow_dangerous_deserialization=True,
                )
            else:
                print("No existing vector store found")
                return None
        except Exception as e:
            print(f"Error loading vector store: {str(e)}")
            return None

    def _prepare_image(self, image):
        """Prepare image for embedding by resizing and converting to base64"""

        # Resize image if needed (using same max dimensions as ImageService)
        MAX_WIDTH = 1024
        MAX_HEIGHT = 1024
        image.thumbnail((MAX_WIDTH, MAX_HEIGHT), Image.LANCZOS)
        image = image.convert("RGB")

        # Convert to base64
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=85, optimize=True)
        img_str = base64.b64encode(buffer.getvalue()).decode("utf-8")

        return img_str

    def _process_embedding_task(self, task):
        """Process a single table task"""
        try:
            image = task["image"]
            if (isinstance(image, str) and (image.startswith('http://') or image.startswith('https://'))):
                image = Image.open(requests.get(image, stream=True).raw)
            # Save the image locally
            idx = task["metadata"]["index"]
            image_path = f"{self.image_path}/image_{idx}.jpg"
            image.save(image_path)
            task["metadata"]["source"] = image_path
            img_str = self._prepare_image(image)
            embedding = self._get_image_embedding(task["text"], img_str)
            return {
                "embedding": embedding,
                "metadata": task["metadata"]
            }
        except Exception as e:
            print(f"Error processing embedding: {str(e)}")
            return None

    def process_dataset(self, dataset_name: str, image_field_name: str, num_images: int = None):
        """Process images from a HuggingFace dataset"""
        split = f"train[0:{num_images}]"
        # Load dataset
        dataset = load_dataset(dataset_name, split=split)

        tasks = []

        # Process each image in the dataset
        for idx, item in enumerate(dataset):
            # Get image and metadata
            image = item[image_field_name]
            metadata = {key: value for key, value in item.items() if key != image_field_name}

            # Create task
            tasks.append({
                "text": str(metadata),  # Convert metadata to string for context
                "image": image,
                "metadata": {
                    "type": "dataset_image",
                    "index": idx,
                    "format": "jpg",
                    "description": str(metadata),
                    **metadata  # Include original metadata
                }
            })

        # Process tasks asynchronously
        async_results = [self.pool.apply_async(self._process_embedding_task, (task,)) 
                        for task in tasks]

        # Collect results
        results = [result.get() for result in async_results]
        results = [r for r in results if r is not None]  # Filter out None results

        # Create vector store
        if results:
            texts = [meta["metadata"]["description"] for meta in results]
            embeddings = [r["embedding"] for r in results]
            metadata = [r["metadata"] for r in results]

            self.vector_store = FAISS.from_embeddings(
                text_embeddings=list(zip(texts, embeddings)),
                embedding=self.multimodal_embeddings,
                metadatas=metadata
            )

            self.vector_store.save_local(self.vector_store_path)

    def _get_image_embedding(self, context, img_str):
        # Generate embedding using Bedrock
        body = {"inputText": context}
        if img_str :
            body['inputImage'] = img_str
        response = self.bedrock_client.invoke_model(
                    modelId=BEDROCK_IMAGE_MODEL_ID,
                    body=json.dumps(body),
                    contentType="application/json",
                    accept="application/json",
        )

        embedding = json.loads(response.get("body").read()).get("embedding")
        return embedding

    def vector_store_ready(self): 
        return self.vector_store is not None

    def query(self, query: str, image_data: str = None, k: int = 10):
        """Search the vector store and return relevant documents with image analysis"""
        if not self.vector_store:
            raise ValueError("No documents have been processed yet")

        # Process query image if provided
        query_image_str = None
        if image_data:
            query_image = Image.open(io.BytesIO(image_data))
            query_image_str = self._prepare_image(query_image)

        # Get embedding and search for similar images
        query_embedding = self._get_image_embedding(query, query_image_str)
        results = self.vector_store.similarity_search_by_vector(query_embedding, k=k)

        context_images = []
        contexts = []

        for idx, doc in enumerate(results):
            image = Image.open(doc.metadata['source'])
            img_str = self._prepare_image(image)
            context_images.append(img_str)

            contexts.append({
                "content": doc.metadata['description'],
                "source": doc.metadata['source'],
                "metadata": doc.metadata
            })

        # Construct prompt with images
        messages = [
            HumanMessage(
                content=[
                    {
                        "type": "text",
                        "text": """You are an image search assistant. Please analyze these images and find the most relevant ones for the user's query.
                
                        Instructions:
                        1. Carefully examine each image
                        2. Consider the user's query and any reference image if provided
                        3. Select and explain the top 3-5 most relevant matches
                        4. Return your response in the following JSON format:
                        {{
                            "analysis": "Your overall analysis of the search results",
                            "top_matches": [
                                {{
                                    "image_number": 1,
                                    "explanation": "Why this image matches the query"
                                }}
                            ]
                        }}
                        
                        User Query: """ + query,
                    }
                ]
            )
        ]

        # Add query image if provided
        if query_image_str:
            messages[0].content.extend(
                [
                    {"type": "text", "text": "\nReference Image Provided by User:"},
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": query_image_str,
                        },
                    },
                ]
            )
        messages[0].content.append({
            "type": "text",
            "text": "\nSearch Results to Analyze:"
        })

        for idx, img_str in enumerate(context_images):
            messages[0].content.extend(
                [
                    {
                        "type": "text",
                        "text": f"\nImage {idx + 1} Metadata: {contexts[idx]['content']}",
                    },
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": img_str,
                        },
                    },
                ]
            )
        response = self.llm_chat.invoke(messages)

        analysis_result = json_repair.loads(response.content)

        # Extract image numbers from the top matches
        top_indices = [match["image_number"] - 1 for match in analysis_result["top_matches"]]
        top_contexts = [contexts[i] for i in top_indices if i < len(contexts)]

        return {
            "answer": analysis_result["analysis"],
            "matches": analysis_result["top_matches"],
            "all_results": contexts,
            "top_matches": top_contexts
        }
