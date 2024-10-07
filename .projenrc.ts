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
});