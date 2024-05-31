# GenAI Quick Start PoCs

This repository contains sample code demonstrating various use cases leveraging Amazon Bedrock and Generative AI using Amazon Bedrock SDK for .NET. Each sample is a separate page within a Visual Studio Solutions, and includes a basic Blazor frontend to help users quickly set up a proof of concept.

##### Authors: Pratip Bagchi

1. **Amazon-Bedrock-Document-Generator:**
   This sample demonstrates using Amazon Bedrock and Generative AI to perform document generation based on a document template and user-provided details.

    ![Alt text](images/text-generation.png "document generator")
 
2. **Amazon-Bedrock-Knowledgebases-RAG-POC:** 
    This sample implements a RAG-based architecture with Amazon Bedrock Knowledge Bases, allowing users to ask questions against documents stored in an Amazon Bedrock Knowledge Base using Amazon Bedrock.

    ![Alt text](images/rag-with-kb.png "RAG with KB")

3. **Amazon-Bedrock-Kendra-RAG-POC:** 
    This sample implements a RAG-based architecture with Amazon Kendra, allowing users to ask questions against documents stored in a Kendra index and allowing users to do q&a using Amazon Bedrock models.

    ![Alt text](images/rag-with-kendra.png "RAG with Kendra")



Detailed instructions for each sample are provided in their respective directories.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.