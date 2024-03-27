# Amazon Bedrock Samples
## Authors:Brian Maguire, Dom Bavaro, Ryan Doty, Sudeesh Sasidharan, Tarik Makota

This repository contains sample code demonstrating various use cases leveraging Amazon Bedrock and Generative AI. Each sample is a separate project with its own directory, and includes a basic Streamlit frontend to help users quickly set up a proof of concept.

## Samples

1. **Amazon-Bedrock-Summarization-Long-Document-POC**
   This sample demonstrates using Amazon Bedrock and Generative AI to implement a long document summarization use case. Users can upload large PDF documents, which are chunked and summarized using Amazon Bedrock.

2. **Amazon-Bedrock-RAG-OpenSearchServerless-POC**
   This sample demonstrates creating custom embeddings stored in Amazon OpenSearch Serverless, and answering questions against the indexed embeddings using a Retrieval-Augmented Generation (RAG) architecture with Amazon Bedrock.

3. **Amazon-Bedrock-RAG-Kendra-POC**
   This sample implements a RAG-based architecture with Amazon Kendra, allowing users to ask questions against documents stored in an Amazon Kendra index using Amazon Bedrock.

4. **Amazon-Bedrock-Image-Generation-POC**
   This sample demonstrates using Amazon Bedrock and Generative AI to generate images based on text input requests.

5. **Amazon-Bedrock-GenAI-Dynamic-Prompting-Explained-POC**
   This sample provides a hands-on explanation of how dynamic prompting works in relation to Generative AI, using Amazon Bedrock.

6. **Amazon-Bedrock-Document-Generator**
   This sample demonstrates using Amazon Bedrock and Generative AI to perform document generation based on a document template and user-provided details.

7. **Amazon-Bedrock-Document-Comparison-POC**
   This sample allows users to upload two PDF documents and get a list of all changes between them using Amazon Bedrock and Generative AI.

8. **Amazon-Bedrock-Claude3-Multi-Modal-Sample**
   This sample showcases the multi-modal capabilities of Amazon Bedrock (specifically Anthropic Claude 3), allowing users to input text questions, images, or both to get comprehensive descriptions or answers.

9. **Amazon-Bedrock-Chat-POC**
   This sample provides a ChatGPT alternative using Amazon Bedrock and Generative AI, allowing users to ask zero-shot questions and receive responses.

10. **Amazon-Bedrock-Amazon-Redshift-POC**
    This sample demonstrates using Amazon Bedrock and Generative AI to ask natural language questions and transform them into SQL queries against Amazon Redshift databases.

11. **Amazon-Bedrock-Amazon-RDS-POC**
    This sample allows users to ask natural language questions and transform them into SQL queries against Amazon RDS databases using Amazon Bedrock and Generative AI.

12. **Amazon-Bedrock-Amazon-Athena-POC**
    This sample demonstrates using Amazon Bedrock and Generative AI to ask natural language questions and transform them into SQL queries against Amazon Athena databases.

## Prerequisites

- Amazon Bedrock Access and CLI Credentials
- Python 3.9 or 3.10 installed on your machine
- Additional prerequisites specific to each sample (e.g., Snowflake account, Amazon Kendra index, etc.)

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
