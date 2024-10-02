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

