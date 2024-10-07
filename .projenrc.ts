import { typescript } from 'projen';
import { StreamlitQuickStartPOC } from './projenrc/projects/streamlit-quickstart-poc';

/**
 * Base project for repo
 */
const project = new typescript.TypeScriptProject({
  defaultReleaseBranch: 'main',
  name: 'genai-quickstart-pocs',
  projenrcTs: true,
  deps: [
    'projen',
    'nunjucks',
  ],
  devDeps: [
    '@types/nunjucks',
  ],
});
project.synth();

/**
 * Python POCs
 */

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Alt Text Generator',
  pocPackageName: 'amazon-bedrock-alt-text-generator',
  additionalDeps: ['langchain@^0.2', 'langchain-community@^0.2', 'langchain-aws', 'pypdf', 'pillow', 'pymupdf', 'reportlab'],
  pocDescription: 'This POC demonstrates how to use the Amazon Bedrock Alt Text Generator to generate alt text for images in PDF documents.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Amazon Athena POC',
  pocPackageName: 'amazon-bedrock-amazon-athena-poc',
  additionalDeps: ['python-dotenv', 'langchain@^0.1', 'langchain-community', 'langchain-experimental'],
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to use natural language questions to query relational data stores, specifically Amazon Athena. This example leverages the MOMA Open Source Database: https://github.com/MuseumofModernArt/collection.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock & Amazon RDS POC',
  pocPackageName: 'amazon-bedrock-amazon-rds-poc',
  additionalDeps: ['langchain@^0.1', 'langchain-community', 'langchain-experimental'],
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to use natural language questions to query relational data stores, specifically Amazon RDS. This example leverages the MOMA Open Source Database: https://github.com/MuseumofModernArt/collection.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock & Amazon Redshift POC',
  pocPackageName: 'amazon-bedrock-amazon-redshift-poc',
  additionalDeps: ['langchain@^0.1', 'langchain-community', 'langchain-experimental'],
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to use natural language questions to query relational data stores, specifically Amazon Redshift. This example leverages the MOMA Open Source Database: https://github.com/MuseumofModernArt/collection.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Asynchronous Invocation POC',
  pocPackageName: 'amazon-bedrock-asynchronous-invocation-poc',
  additionalDeps: ['langchain@^0.1', 'langchain-community', 'langchain-experimental'],
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to perform asynchronous invocations of large language models. The application is constructed with a simple streamlit frontend where users can input zero shot requests directly against the LLM of their choice, leveraging asynchronous invocations, to invoke 3 models simultaneously to reduce overall latency.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Chat POC',
  pocPackageName: 'amazon-bedrock-chat-poc',
  additionalDeps: ['langchain@^0.1', 'langchain-community', 'langchain-experimental'],
});

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Claude 3 Image Analysis POC',
  pocPackageName: 'amazon-bedrock-claude3-image-analysis-poc',
  additionalDeps: ['langchain@^0.1', 'langchain-community', 'langchain-experimental'],
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Multi-Modal Generative AI models from Anthropic to implement an image analysis use case. The application is constructed with a simple streamlit frontend where users can upload a 1 page jpeg, png or PDF and get a description of the image.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Claude 3 Long Form Output POC',
  pocPackageName: 'amazon-bedrock-claude3-long-form-output-poc',
  additionalDeps: ['botocore', 'pypdf'],
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to translate text from a source to target language.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Claude 3 Multi-Modal POC',
  pocPackageName: 'amazon-bedrock-claude3-multi-modal-poc',
  additionalDeps: ['pillow'],
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Anthropic Claude 3 to satisfy multi-modal use cases. The application is constructed with a simple streamlit frontend where users can input zero shot requests to satisfy a broad range of use cases, including image to text multi-modal style use cases.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Claude 3 Streaming Response POC',
  pocPackageName: 'amazon-bedrock-claude3-streaming-response-poc',
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement streaming responses. The application is constructed with a simple streamlit frontend where users can input zero shot requests directly against the LLM of their choice, leveraging a streaming response technique.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Converse API POC',
  pocPackageName: 'amazon-bedrock-converse-api-poc',
  pocDescription: 'This is sample code demonstrating the use of the Amazon Bedrock Converse API to help with conversation oriented use cases that require context preservation. The application is constructed with a simple streamlit frontend where users can input zero shot requests to Claude 3, with the Amazon Bedrock Converse API in place to allow users to ask context aware questions.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Converse Stream API POC',
  pocPackageName: 'amazon-bedrock-converse-stream-api-poc',
  pocDescription: 'This is sample code demonstrating the use of the Amazon Bedrock ConverseStream API to help with conversation oriented use cases that require context preservation. The application is constructed with a simple streamlit frontend where users can input zero shot requests to Claude 3, with the Amazon Bedrock ConverseConverseStream API in place to allow users to ask context aware questions and stream the response back.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock CSV Chatbot POC',
  pocPackageName: 'amazon-bedrock-csv-chatbot-poc',
  additionalDeps: ['pandas'],
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement a chatbot is able to converse with the user based on CSV data provided by the user. The application is constructed with a simple streamlit frontend where users can upload large CSV files and get them analyzed or start chatbot interactions.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Document Comparison POC',
  pocPackageName: 'amazon-bedrock-document-comparison-poc',
  additionalDeps: ['langchain@^0.1', 'langchain-community', 'langchain-experimental', 'pypdf'],
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement a document comparison use case. The application is constructed with a simple streamlit frontend where users can upload 2 versions of a document and get all changes between documents listed.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Aamazon Bedrock Document Generator POC',
  pocPackageName: 'amazon-bedrock-document-generator-poc',
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement a document generation use case. The application is constructed with a simple streamlit frontend where users can provide details and create a document in the exact format that the you specify.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock GenAI Dynamic Prompt Explained POC',
  pocPackageName: 'amazon-bedrock-genai-dynamic-prompting-explained-poc',
  additionalDeps: ['langchain@^0.1', 'langchain-community', 'langchain-experimental'],
  pocDescription: 'This is sample code that can be used to provide a hands on explanation as to how Dynamic Prompting works in relation to Gen AI. The application is constructed with a simple streamlit frontend where users can ask questions against a Amazon Bedrock supported LLM and get a deeper understanding of how few-shot and dynamic prompting works.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Guardrails POC',
  pocPackageName: 'amazon-bedrock-guardrails-poc',
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock Guardrails to help prevent prompt-injection attacks and prevent unintended responses from the LLM. The application is constructed with a simple streamlit frontend where users can input zero shot requests to Claude 3, with Amazon Bedrock Guardrails in place to prevent malicious prompts and responses.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Image Generation POC',
  pocPackageName: 'amazon-bedrock-image-generation-poc',
  additionalDeps: ['pillow'],
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement an image generation use case. The application is constructed with a simple streamlit frontend where users can input text requests to generate images based on the text input.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Knowledgebases RAG POC',
  pocPackageName: 'amazon-bedrock-knowledgebases-rag-poc',
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to create vector embeddings for your data sources using Amazon Bedrock Knowledge bases with the ability ask questions against the stored documents. The application is constructed with a RAG based architecture where users can ask questions against the Knowledge bases.',
});

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock LangChain RAG POC',
  pocPackageName: 'amazon-bedrock-langchain-rag-poc',
  additionalDeps: ['langchain@^0.1', 'langchain-community', 'langchain-experimental', 'python-dotenv'],
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Generative AI using Langchain as orchestrator with the ability ask questions against the stored documents. This sample uses Knowledge bases as to retrieve the stored documents, however you can extend or update this sample to retrieve your stored documents from any Vector DB.',
});

new StreamlitQuickStartPOC({
  pocName: 'Amazonb Bedrock Meeting Minutes Summarization POC',
  pocPackageName: 'amazon-bedrock-meeting-minutes-summarization-poc',
  additionalDeps: ['requests'],
  pocDescription: 'This application demonstrates using Amazon Bedrock and Amazon Transcribe to summarize meeting recordings. The streamlit frontend allows users to upload audio, video, or text files of meeting recording. Amazon Transcribe generates a transcript of recording and sent it Amazon Bedrock for summarization of the key discussion points. Users can then download the  generated summarized meeting notes.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Model Customization',
  pocPackageName: 'amazon-bedrock-model-customization',
  skipApp: true,
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Model Evaluation Data Prep Tool',
  pocPackageName: 'amazon-bedrock-model-eval-poc',
  additionalDeps: ['bs4', 'pandas'],
  pocDescription: 'This is sample code aimed to accelerate customers aiming to leverage [Amazon Bedrock Model Evaluator](https://docs.aws.amazon.com/bedrock/latest/userguide/model-evaluation.html) with custom prompt data. This Proof-of-Concept (POC) enables users to provide a CSV containing data that should be used with Amazon Bedrock Model Evaluator. The user then maps the CSV columns to the appropriate fields depending on which type of Model Evaluation being executed. This will generate one or more `.jsonl` formatted files, ready for use with Amazon Bedrock Model Evaluator.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Model Playground POC',
  pocPackageName: 'amazon-bedrock-model-playground-poc',
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement a Gen AI model playground. The application is constructed with a simple streamlit frontend where users can input zero shot requests and select any LLM offered by Amazon Bedrock.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock RAG with Kendra POC',
  pocPackageName: 'amazon-bedrock-rag-kendra-poc',
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement a RAG based architecture with Amazon Kendra. The application is constructed with a simple streamlit frontend where users can ask questions against documents stored in Amazon Kendra.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock RAG with OpenSearch Serverless POC',
  pocPackageName: 'amazon-bedrock-rag-opensearch-serverless-poc',
  additionalDeps: ['opensearch-py', 'langchain@^0.1', 'langchain-community', 'langchain-experimental'],
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to create custom embeddings stored in Amazon OpenSearch Serverless with the ability ask questions against the stored documents. The application is constructed with a RAG based architecture where users can ask questions against the indexed embeddings within OpenSearch Serverless.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Semantic Cache POC',
  pocPackageName: 'amazon-bedrock-semantic-cache-poc-main',
  additionalDeps: ['opensearch-py'],
  pocDescription: 'This project demonstrates a Retrieval-Augmented Generation (RAG) system using Amazon Bedrock for knowledge retrieval and OpenSearch for semantic caching. It provides a Streamlit-based user interface for asking questions about data stored in Amazon Knowledge Bases.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Speech to Text POC',
  pocPackageName: 'amazon-bedrock-speech-to-text-chat-poc',
  additionalDeps: ['sounddevice', 'amazon-transcribe', 'langchain@^0.1', 'langchain-community', 'langchain-experimental'],
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement a ChatGPT alternative using speech-to-text prompts. The application is constructed with a simple streamlit frontend where users can provide zero shot requests using their computer’s microphone and listen to responses to satisfy a broad range of use cases.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Streaming Response POC',
  pocPackageName: 'amazon-bedrock-streaming-response-poc',
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement streaming responses. The application is constructed with a simple streamlit frontend where users can input zero shot requests directly against the LLM of their choice, leveraging a streaming response technique.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Summarization of Long Documents POC',
  pocPackageName: 'amazon-bedrock-summarization-long-document-poc',
  additionalDeps: ['langchain@^0.1', 'langchain-community', 'langchain-experimental', 'pypdf'],
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement a long document summarization use case. The application is constructed with a simple streamlit frontend where users can upload large documents and get them summarized.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Task Classification POC',
  pocPackageName: 'amazon-bedrock-task-classification',
  pocDescription: 'This sample code demonstrates how to use Amazon Bedrock and Generative AI to implement a task classification bot. The application is constructed with a simple streamlit frontend where users can input a task and get the correct classification which then trigger appropriate downstream workflows to process the task inputted. ',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Text Extraction POC',
  pocPackageName: 'amazon-bedrock-text-extraction-poc',
  additionalDeps: ['pdfplumber'],
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to extract text from a document. The application is constructed with a simple streamlit frontend where users leverage Bedrock Agents to extract and summarize key information from a document like a financial earnings report. ',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Translation POC',
  pocPackageName: 'amazon-bedrock-translation-poc',
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to translate text from a source to target language.',
}).synth();

new StreamlitQuickStartPOC({
  pocName: 'Amazon Bedrock Video Chapter Creator POC',
  pocPackageName: 'amazon-bedrock-video-chapter-creator-poc',
  additionalDeps: ['langchain@^0.1', 'pandas', 'opensearch-py', 'thefuzz'],
  pocDescription: 'This is sample code demonstrating the use of Amazon Transcribe, Amazon OpenSearch Serverless, Amazon Bedrock and Generative AI, to a implement video chapter generator and video search sample. The application is constructed with a simple streamlit frontend where users can upload a video that will be stored, transcribed and have searchable chapters generated. Additionally, if you have videos already uploaded to S3 and have subtitles for the video already created in `.srt` format, you can skip transcribing and jump straight into generating chapters.\n\nThe sample also includes a second UI that allows the user to ask about a topic. This will search the video chapters from the videos you\'ve provided and provide a video, set to a specific chapter, that was the closest match to the inquiry.',
}).synth();