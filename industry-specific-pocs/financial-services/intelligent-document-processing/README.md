# [Intelligent Document Processing](https://aws.amazon.com/ai/generative-ai/use-cases/document-processing/)

## Overview

This POC collection demonstrates rapid document workflow automation using [Amazon Bedrock Data Automation](https://docs.aws.amazon.com/bedrock/latest/userguide/bda.html). Each document type lives in its own subdirectory as a complete, self-contained automation that deploys independently.

**Key Benefits:**
- **Self-Contained**: Complete implementation, dependencies, and configuration per document type
- **Rapid Deployment**: From setup to processing in minutes
- **Dual Interface**: Web UI for interactive use, CLI for automation
- **Easy Expansion**: Add new document types using the same proven framework

Each document automation follows a simple pattern: automated AWS resource setup → document upload → intelligent extraction → structured output with confidence scores.

## Technology Stack

**Primary Technology:**
- **Amazon Bedrock Data Automation**: Core GenAI document processing engine
- **[Streamlit](https://streamlit.io/)**: Web interface for user interaction
- **[Python](https://www.python.org/)**: Backend processing and automation
- **[Amazon S3](https://aws.amazon.com/s3/)**: Document storage and processing
- **[Boto3](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)**: AWS SDK for Python

## Available Document Automations

### 1. Standard Flood Hazard Determination Form (SFHDF)
**Directory**: [standard_flood_hazard_determination_form/](./standard_flood_hazard_determination_form/)  
**Documentation**: [HOWTO.md](./standard_flood_hazard_determination_form/HOWTO.md)  


## Amazon Bedrock Data Automation: Core Concepts

Amazon Bedrock Data Automation (BDA) is a cloud service that extracts insights from unstructured content using generative AI. It transforms documents, images, video, and audio into structured formats, enabling developers to build applications and automate complex workflows with greater speed and accuracy. These POCs focuses on Document processing.

### Output Types

**[Standard Output](https://docs.aws.amazon.com/bedrock/latest/userguide/bda-output-documents.html)** Standard output is pre-defined extraction managed by Bedrock.  If you pass a document to the BDA API with no established blueprint or project it returns the default standard output for that file type. Standard output can be modified using projects, which store configuration information for each data type. BDA always provides a standard output response even if it's alongside a custom output response.

**[Custom Output](https://docs.aws.amazon.com/bedrock/latest/userguide/bda-custom-output-idp.html)** is available for documents, audio, and images, allowing you to define exactly what information you want to extract using blueprints. A blueprint consists of a list of expected fields that represent specific pieces of information needed for your use case. You can create your own blueprints tailored to your requirements or select predefined blueprints from the BDA blueprint catalog. This approach is the primary focus of these POC implementations as it provides precision extraction for business-specific needs.

### Key Components

**[Blueprints](https://docs.aws.amazon.com/bedrock/latest/userguide/bda-blueprint-info.html)** are structured field definitions that specify exactly what information to extract from documents. They act as templates that guide the extraction process for custom output, ensuring consistent and accurate data retrieval across similar document types.

**[Projects](https://docs.aws.amazon.com/bedrock/latest/userguide/bda-projects.html)** are BDA resources that allow you to modify and organize output configurations. Each project can contain standard output configurations for documents, images, video, and audio, as well as custom output blueprints for documents, audio, and images. Projects are referenced in the InvokeDataAutomationAsync API call to instruct BDA on how to process files, enabling consistent processing across different document types and use cases.

**InvokeDataAutomationAsync API** serves as the primary processing endpoint that executes document analysis. It utilizes project configurations to deliver targeted extraction results based on your specified requirements and blueprints.


## Contributors

* Ramesh Eega 