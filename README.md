# GenAI Quick Start PoCs

This repository contains sample code demonstrating various use cases leveraging Amazon Bedrock and Generative AI. Each sample is a separate project with its own directory, and includes a basic Streamlit frontend to help users quickly set up a proof of concept.

##### Authors: Brian Maguire, Dom Bavaro, Ryan Doty, Sudeesh Sasidharan, Tarik Makota

## Sample Proof of Concepts

1. **Amazon-Bedrock-Summarization-Long-Document-POC:**
   This sample demonstrates using Amazon Bedrock and Generative AI to implement a long document summarization use case. Users can upload large PDF documents, which are chunked and summarized using Amazon Bedrock.
   ![Alt text](amazon-bedrock-summarization-long-document-poc/images/demo.gif)
2. **Amazon-Bedrock-RAG-OpenSearchServerless-POC:**
   This sample demonstrates creating custom embeddings stored in Amazon OpenSearch Serverless, and answering questions against the indexed embeddings using a Retrieval-Augmented Generation (RAG) architecture with Amazon Bedrock.
   ![Alt text](amazon-bedrock-rag-opensearch-serverless-poc/images/demo.gif)
3. **Amazon-Bedrock-RAG-Kendra-POC:**
   This sample implements a RAG-based architecture with Amazon Kendra, allowing users to ask questions against documents stored in an Amazon Kendra index using Amazon Bedrock.
   ![Alt text](amazon-bedrock-rag-kendra-poc/images/demo.gif)
4. **Amazon-Bedrock-Image-Generation-POC:**
   This sample demonstrates using Amazon Bedrock and Generative AI to generate images based on text input requests.
   ![Alt text](amazon-bedrock-image-generation-poc/images/demo.gif)
5. **Amazon-Bedrock-GenAI-Dynamic-Prompting-Explained-POC:**
   This sample provides a hands-on explanation of how dynamic prompting works in relation to Generative AI, using Amazon Bedrock.
   ![Alt text](amazon-bedrock-genai-dynamic-prompting-explained-poc/images/demo.gif)
6. **Amazon-Bedrock-Document-Generator:**
   This sample demonstrates using Amazon Bedrock and Generative AI to perform document generation based on a document template and user-provided details.
   ![Alt text](amazon-bedrock-document-generator-poc/images/demo.gif)
7. **Amazon-Bedrock-Document-Comparison-POC:**
   This sample allows users to upload two PDF documents and get a list of all changes between them using Amazon Bedrock and Generative AI.
   ![Alt text](amazon-bedrock-document-comparison-poc/images/demo.gif)
8. **Amazon-Bedrock-Claude3-Multi-Modal-Sample:**
   This sample showcases the multi-modal capabilities of Amazon Bedrock (specifically Anthropic Claude 3), allowing users to input text questions, images, or both to get comprehensive descriptions or answers.
   ![Alt text](amazon-bedrock-claude3-multi-modal-poc/images/demo.gif)
9. **Amazon-Bedrock-Chat-POC:**
   This sample provides a ChatGPT alternative using Amazon Bedrock and Generative AI, allowing users to ask zero-shot questions and receive responses.
   ![Alt text](amazon-bedrock-chat-poc/images/demo.gif)
10. **Amazon-Bedrock-Amazon-Redshift-POC:**
    This sample demonstrates using Amazon Bedrock and Generative AI to ask natural language questions and transform them into SQL queries against Amazon Redshift databases.
    ![Alt text](amazon-bedrock-amazon-redshift-poc/images/demo.gif)
11. **Amazon-Bedrock-Amazon-RDS-POC:**
    This sample allows users to ask natural language questions and transform them into SQL queries against Amazon RDS databases using Amazon Bedrock and Generative AI.
    ![Alt text](amazon-bedrock-amazon-rds-poc/images/demo.gif)
12. **Amazon-Bedrock-Amazon-Athena-POC:**
    This sample demonstrates using Amazon Bedrock and Generative AI to ask natural language questions and transform them into SQL queries against Amazon Athena databases.
    ![Alt text](amazon-bedrock-amazon-athena-poc/images/demo.gif)
13. **Amazon-Bedrock-Streaming-Response-POC:** 
    This sample illustrates the utilization of Amazon Bedrock and Generative AI to implement streaming responses. The application is designed with a straightforward Streamlit frontend, enabling users to input zero-shot requests directly against the Large Language Model (LLM) of their choice, utilizing a streaming response technique with majority of Amazon Bedrock models.
    ![Alt text](amazon-bedrock-streaming-response-poc/images/demo.gif)
14. **Amazon-Bedrock-Claude3-Streaming-Response-POC:** 
    This sample illustrates the utilization of Amazon Bedrock and Generative AI to implement streaming responses. The application is designed with a straightforward Streamlit frontend, enabling users to input zero-shot requests directly against Claude 3, utilizing a streaming response technique while leveraging the Anthropic Messages API structure.
    ![Alt text](amazon-bedrock-claude3-streaming-response-poc/images/demo.gif)
15. **Amazon-Bedrock-Knowledgebases-RAG-POC:** 
    This sample implements a RAG-based architecture with Amazon Bedrock Knowledge Bases, allowing users to ask questions against documents stored in an Amazon Bedrock Knowledge Base using Amazon Bedrock.
    ![Alt text](amazon-bedrock-knowledgebases-rag-poc/images/demo.gif)
16. **Amazon-Bedrock-Langchain-RAG-POC:** 
    This sample implements a RAG-based architecture with Amazon Bedrock Knowledge Bases using Langchain to help orchestrate the retrieval of information from the knowledge base. This allows users to ask questions against documents stored in an Amazon Bedrock Knowledge Base using Amazon Bedrock, and Langchain as an orchestrator.
    ![Alt text](amazon-bedrock-langchain-rag-poc/images/demo.gif)
17. **Amazon-Bedrock-Asynchronous-Invocation-POC:** 
    This sample implements asynchronous invocations with Amazon Bedrock allowing users to make multiple simultaneous calls to Bedrock models to decrease overall latency. This allows users to ask questions against 3+ models simultaneously, demonstrating the decrease in latency by doing it asynchronously vs sequentially.
    ![Alt text](amazon-bedrock-asynchronous-invocation-poc/images/demo.gif)
18. **Amazon-Bedrock-Model-Playground-POC:** 
    This sample implements an Amazon Bedrock Gen AI Model playground that allows users to select any LLM offered by Amazon Bedrock and ask zero shot questions directly against it. This provides business users the ability to experiment with different Amazon Bedrock LLMs without having access to the AWS console.
    ![Alt text](amazon-bedrock-model-playground-poc/images/demo.gif)
19. **Amazon-Bedrock-Claude3-Image-Analysis-POC:** 
    This sample implements an image analysis app that uses Amazon Bedrock and Claude3 to collect data from an image and return as JSON. This provides users the ability to quickly experiment with image analysis use-cases and customize the JSON response to the needs of their image analysis use-case.
    ![Alt text](amazon-bedrock-claude3-image-analysis-poc/images/demo.gif)
20. **Amazon-Bedrock-Guardrails-POC**
    This sample implements Amazon Bedrock Guardrails to demonstrate how you can leverage guardrails to prevent malicious prompts and repsonse from your generative AI applications built with Amazon Bedrock.
    ![Alt text](amazon-bedrock-guardrails-poc/images/demo.gif)

## Prerequisites

- Amazon Bedrock Access and CLI Credentials
- Python 3.10 installed on your machine
- Additional prerequisites specific to each sample (e.g., RDS Database, Amazon Kendra index, etc.)

## Getting Started

1. Clone the repository.
2. Navigate to the desired sample directory.
3. Set up a Python virtual environment and install the required dependencies.
4. Configure the necessary environment variables (e.g., AWS credentials, database connections, etc.).
5. Run the Streamlit application using the provided command.

Detailed instructions for each sample are provided in their respective directories.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
