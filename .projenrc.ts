import { typescript } from 'projen';
import { NodePackageManager } from 'projen/lib/javascript';
import { READMEComponent } from './projenrc/projects/core-readme-component';
import { DotNetQuickStartPOCs } from './projenrc/projects/dot-net-quickstart-pocs';
import { POCReadmeDetails } from './projenrc/projects/resources/types';
import { StreamlitQuickStartPOC } from './projenrc/projects/streamlit-quickstart-poc';

/**
 * Base project for repo
 */
const project = new typescript.TypeScriptProject({
  authorName: 'AWS',
  jest: false,
  packageManager: NodePackageManager.NPM,
  defaultReleaseBranch: 'main',
  name: 'genai-quickstart-pocs',
  projenrcTs: true,
  github: false,
  deps: ['nunjucks'],
  devDeps: ['@types/nunjucks'],
  gitignore: [
    '**/.DS_Store',
    '**/__pycache__/',
    '.env/',
    'venv',
    'output/',
    'genai-quickstart-pocs-python/amazon-bedrock-alt-text-generator/files/',
    'genai-quickstart-pocs-python/amazon-bedrock-image-guardrails-poc/generated-images/',
    'temp/',
    'cdk.out',
  ],
  tsconfig: {
    compilerOptions: {
      rootDir: '.',
      sourceRoot: '.',
    },
    include: [
      'genai-quickstart-pocs-python/**/*',
      'projenrc/**/*',
    ],
  },
});

const pythonPocs: Array<StreamlitQuickStartPOC> = [];

/**
 * Python POCs
 */

pythonPocs.push(
  new StreamlitQuickStartPOC({
    parentProject: project,
    pocName: 'Amazon Bedrock Alt Text Generator',
    pocPackageName: 'amazon-bedrock-alt-text-generator',
    additionalDeps: [
      'langchain@^0.2',
      'langchain-community@^0.2',
      'langchain-aws',
      'pypdf',
      'pillow',
      'pymupdf',
      'reportlab',
    ],
    pocDescription:
    'This POC demonstrates how to use the Amazon Bedrock Alt Text Generator to generate alt text for images in PDF documents.',
    readme: {
      fileWalkthrough: {
        includeDefaults: true,
        files: [
          {
            name: 'pdf_image_alt_text_generator/generator.py',
            description:
            'The is the logic that extracts the data from PDF and calls the Bedrock Model for inference',
          },
          {
            name: 'pdf_image_alt_text_generator/download_results.py',
            description:
            'generates a PDF with all images and their alt text results, as well as input/output token usage, calculated in a table.',
          },
        ],
      },
    },
  }),
);

pythonPocs.push(
  new StreamlitQuickStartPOC({
    parentProject: project,
    pocName: 'Amazon Bedrock Amazon Athena POC',
    pocPackageName: 'amazon-bedrock-amazon-athena-poc',
    readme: {
      additionalPrerequisits: [
        'Access to Amazon Athena and the ability to create an Amazon Athena database and tables.',
      ],
      pocGoal: {
        overview:
        'The goal of this POC is to provide users with the abilitity to use Amazon Bedrock and generative AI to take natural language questions and transform them into relational database querties against Amazon Athena.\n' +
        'The POC comes with a basic frontend to help users stand up a proof-of-concept in just a few minutes.',
        architectureImage: true,
        flowSteps: [
          'The user makes a request, asking a natural language question based on the database available in Amazon Athena to the GenAI app (app.py).',
          'This natural language question is passed into Amazon Bedrock, which takes the natural language question and creates a SQL query (amazon_athena_bedrock_query.py).',
          'The created SQL query is then executed against your Amazon Athena database to begin retrieving the data (amazon_athena_bedrock_query.py).',
          'The data is retrieved from your Amazon Athena Database and is passed back into Amazon Bedrock, to generate a natural language answer based on the retrieved data (amazon_athena_bedrock_query.py).',
          'The LLM returns a natural language response to the user through the streamlit frontend based on the retrieved data (app.py).',
        ],
      },
      fileWalkthrough: {
        files: [
          {
            name: 'amazon_athena_bedrock_query.py',
            description:
            'contains connectors into your Amazon Athena database and the interaction',
          },
          {
            name: 'moma_examples.yaml',
            description:
            'contains several samples prompts that will be used to implement a few-shot prompting technique.',
          },
        ],
      },
      extraSteps: [
        {
          instructions:
          'Create a .env file in the root folder of this POC. Within the .env file you just created you will need to configure the .env to contain:',
          command: `profile_name=<AWS_CLI_PROFILE_NAME>
  \taws_access_key_id=<AWS_ACCESS_KEY_ID>
  \taws_secret_access_key=<AWS_SECRET_ACCESS_KEY>
  \tregion_name=<AWS_REGION>
  \tdatabase_name=<ATHENA_DATABASE_NAME>
  \ts3_staging_dir=<S3_STAGING_DIRECTORY_BUCKET_PATH>  example -> s3://sample-bucket/`,
        },
        {
          instructions: `If you would like to use this repo with the sample data, you will need to upload the two sample data files found in the sample data directory as two individual tables to your Amazon Athena Database.

If you preferred to use your own database/tables in your Amazon Athena database, I would highly recommend reviewing the moma_examples.yaml file in the SampleData directory to see how prompts are constructed for this sample application and spend the time creating 5 - 10 prompts that resemble your dataset more closely.`,
        },
      ],
    },
    additionalDeps: [
      'python-dotenv',
    ],
    pocDescription:
    'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to use natural language questions to query relational data stores, specifically Amazon Athena. This example leverages the MOMA Open Source Database: https://github.com/MuseumofModernArt/collection.',
  }));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock & Amazon RDS POC',
  pocPackageName: 'amazon-bedrock-amazon-rds-poc',
  additionalDeps: [
    'langchain@^0.1',
    'langchain-community',
    'langchain-experimental',
  ],
  pocDescription:
    'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to use natural language questions to query relational data stores, specifically Amazon RDS. This example leverages the MOMA Open Source Database: https://github.com/MuseumofModernArt/collection.',
  readme: {
    pocGoal: {
      overview:
        'The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to take natural language questions, and transform them into relational database queries against Amazon RDS Databases. This repo is designed to work with\n' +
        'Amazon RDS Postgres, but can be configured to work with other database engine types.\n' +
        'This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.',
      architectureImage: true,
      flowSteps: [
        'The user makes a request, asking a natural language question based on the data in Amazon RDS to the GenAI app (app.py).',
        'This natural language question is passed into Amazon Bedrock, which takes the natural language question and creates a SQL query (amazonRDS_bedrock_query.py).',
        'The created SQL query is then executed against your Amazon RDS database to begin retrieving the data (amazonRDS_bedrock_query.py).',
        'The data is retrieved from your Amazon RDS Database and is passed back into Amazon Bedrock, to generate a natural language answer based on the retrieved data (amazonRDS_bedrock_query.py).',
        'The LLM returns a natural language response to the user through the streamlit frontend based on the retrieved data (app.py).',
      ],
    },
    additionalPrerequisits: [
      'Access to Amazon RDS and the ability to create an Amazon RDS database and tables.',
      'Please note that this project leverages the [langchain-experimental](https://pypi.org/project/langchain-experimental/) package which has known vulnerabilities.',
    ],
    fileWalkthrough: {
      files: [
        {
          name: 'amazonRDS_bedrock_query.py',
          description:
            'contains connectors into your Amazon RDS database and the interaction',
        },
        {
          name: 'moma_examples.yaml',
          description:
            'contains several samples prompts that will be used to implement a few-shot prompting technique.',
        },
      ],
    },
    extraSteps: [
      {
        instructions:
          'Create a .env file in the root folder of this POC. Within the .env file you just created you will need to configure the .env to contain:',
        command:
          'profile_name=<aws_cli_profile_name>' +
          '\trds_username=<rds_database_username>' +
          '\trds_password=<rds_database_password>' +
          '\trds_endpoint=<rds_database_endpoint>' +
          '\trds_port=<rds_port>\n' +
          '\trds_db_name=<rds_database_name>\n',
      },
      {
        instructions: `If you would like to use this repo with the sample data, you will need to upload the two sample data files found in the sample data directory as two individual tables to your Amazon RDS Postgres Database.

If you preferred to use your own database/tables in your Amazon RDS instance, I would highly recommend reviewing the moma_examples.yaml file in the SampleData directory to see how prompts are constructed for this sample application and spend the time creating 5 - 10 prompts that resemble your dataset more closely.`,
      },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock & Amazon Redshift POC',
  pocPackageName: 'amazon-bedrock-amazon-redshift-poc',
  additionalDeps: [
    'langchain@^0.1',
    'langchain-community',
    'langchain-experimental',
  ],
  pocDescription:
    "This is sample code demonstrating the use of Amazon Bedrock and Generative AI to use natural language questions to query relational data stores, specifically Amazon Redshift. This example leverages the MOMA Open Source Database: https://github.com/MuseumofModernArt/collection.\n\n \t**Please Note: If you don't want to build this from scratch, Amazon Redshift now supports GenAI capabilities natively, more information on that can be found [here](https://aws.amazon.com/blogs/aws/amazon-redshift-adds-new-ai-capabilities-to-boost-efficiency-and-productivity/).**",
  readme: {
    pocGoal: {
      architectureImage: true,
      overview:
        'The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to take natural language questions, and transform them into relational database queries against Amazon Redshift Databases. This repo is designed to work with Amazon Redshift Provisioned Clusters. This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.',
      flowSteps: [
        'The user makes a request, asking a natural language question based on the data in Amazon Redshift to the GenAI app (`app.py`)',
        'This natural language question is passed into Amazon Bedrock, which takes the natural language question and creates a SQL query (`amazon_redshift_bedrock_query.py`)',
        'The created SQL query is then executed against your Amazon Redshift cluster to begin retrieving the data (`amazon_redshift_bedrock_query.py`).',
        'The data is retrieved from your Amazon Redshift Database and is passed back into Amazon Bedrock, to generate a natural language answer based on the retrieved data (`amazon_redshift_bedrock_query.py`).',
        'The LLM returns a natural language response to the user through the streamlit frontend based on the retrieved data (`app.py`).',
      ],
    },
    additionalPrerequisits: [
      'Access to Amazon Redshift and the ability to create an Amazon Redshift cluster and tables.',
      'Please note that this project leverages the [langchain-experimental](https://pypi.org/project/langchain-experimental/) package which has known vulnerabilities.',
    ],
    fileWalkthrough: {
      files: [
        {
          name: 'amazon_redshift_bedrock_query.py',
          description:
            'contains connectors into your Amazon Redshift database and the interaction',
        },
        {
          name: 'moma_examples.yaml',
          description:
            'contains several samples prompts that will be used to implement a few-shot prompting technique.',
        },
      ],
    },
    extraSteps: [
      {
        instructions:
          'Create a .env file in the root folder of this POC. Within the .env file you just created you will need to configure the .env to contain:',
        command:
          'profile_name=<aws_cli_profile_name>' +
          '\tredshift_host=<REDSHIFT_HOST_URL>  example -> redshift-cluster-1.abcdefghijk123.us-east-1.redshift.amazonaws.com' +
          '\tredshift_username=<redshift_database_username>' +
          '\tredshift_password=<redshift_database_password>' +
          '\tredshift_endpoint=<redshift_database_endpoint>' +
          '\tredshift_port=<redshift_port>\n' +
          '\tredshift_db_name=<redshift_database_name>\n',
      },
      {
        instructions:
          'Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure lines 19-25 in the amazon_redshift_bedrock_query.py file:',
        command: `llm = Bedrock(
    credentials_profile_name=os.getenv("profile_name"),
    model_id="amazon.titan-text-express-v1",
    endpoint_url="https://bedrock-runtime.us-east-1.amazonaws.com",
    region_name="us-east-1",
    verbose=True
)`,
      },
      {
        instructions: `If you would like to use this repo with the sample data, you will need to upload the two sample data files found in the sample data directory as two individual tables to your Amazon Redshift Database.

If you preferred to use your own database/tables in your Amazon Redshift instance, I would highly recommend reviewing the moma_examples.yaml file in the SampleData directory to see how prompts are constructed for this sample application and spend the time creating 5 - 10 prompts that resemble your dataset more closely.`,
      },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Asynchronous Invocation POC',
  pocPackageName: 'amazon-bedrock-asynchronous-invocation-poc',
  additionalDeps: [
    'langchain@^0.1',
    'langchain-community',
    'langchain-experimental',
  ],
  pocDescription:
    'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to perform asynchronous invocations of large language models. The application is constructed with a simple streamlit frontend where users can input zero shot requests directly against the LLM of their choice, leveraging asynchronous invocations, to invoke 3 models simultaneously to reduce overall latency.',
  readme: {
    pocGoal: {
      overview:
        'The goal of this repo is to provide users the ability to use Amazon Bedrock and Generative AI to perform asynchronous invocations of large language models. The application is constructed with a simple streamlit frontend where users can input zero shot requests directly against the LLM of their choice, leveraging asynchronous invocations, to invoke 3 models simultaneously to reduce overall latency.',
      architectureImage: true,
      flowSteps: [
        'The user makes a request, asking a natural language question based on the data in Amazon RDS to the GenAI app (app.py).',
        'This natural language question is passed into Amazon Bedrock, which takes the natural language question and creates a SQL query (amazonRDS_bedrock_query.py).',
        'The created SQL query is then executed against your Amazon RDS database to begin retrieving the data (amazonRDS_bedrock_query.py).',
        'The data is retrieved from your Amazon RDS Database and is passed back into Amazon Bedrock, to generate a natural language answer based on the retrieved data (amazonRDS_bedrock_query.py).',
        'The LLM returns a natural language response to the user through the streamlit frontend based on the retrieved data (app.py).',
      ],
    },
    fileWalkthrough: {
      includeDefaults: false,
      files: [
        {
          name: 'app.py',
          description:
            'contains the streamlit frontend and the interaction with Amazon Bedrock',
        },
        {
          name: 'amazon_bedrock_query.py',
          description:
            'contains connectors into your Amazon Bedrock LLMs and the interaction',
        },
      ],
    },
    extraSteps: [
      {
        instructions:
          'Create a .env file in the root folder of this POC. Within the .env file you just created you will need to configure the .env to contain:',
        command:
          'profile_name=<aws_cli_profile_name>' + 'region_name=us-east-1',
      },
      {
        instructions:
          'Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure line 86 in the asynchronous_invocation.py file. Currently, this application is only suited to use Anthropic models:',
        command: `async def orchestrator(question, modelID1="anthropic.claude-3-sonnet-20240229-v1:0", modelID2="anthropic.claude-3-haiku-20240307-v1:0", modelID3='anthropic.claude-v2:1'):
    result = await asyncio.gather(main(question, modelID1), main(question, modelID2), main(question, modelID3))
    print(result)
    return result`,
      },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Chat POC',
  pocPackageName: 'amazon-bedrock-chat-poc',
  additionalDeps: [
    'langchain@^0.1',
    'langchain-community',
    'langchain-experimental',
  ],
  readme: {
    pocGoal: {
      architectureImage: true,
      overview:
        'The goal of this repo is to provide users the ability to use Amazon Bedrock in a similar fashion to ChatGPT. This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.',
      flowSteps: [
        'The user makes a "zero-shot" request to the streamlit frontend (`app.py`)',
        'The application returns the 3 most semantically similar prompts, and creates a final prompt that contains the 3 returned prompts along with users query (few-shot prompting) (`prompt_finder_and_invoke_llm.py`).',
        'The final prompt is passed into Amazon Bedrock to generate an answer to the users question (`prompt_finder_and_invoke_llm.py`).',
        'The final answer is generated by Amazon Bedrock and displayed on the frontend application (`app.py`)',
      ],
    },
    fileWalkthrough: {
      includeDefaults: true,
      files: [
        {
          name: 'prompt_finder_and_invoke_llm.py',
          description:
            'houses the logic of the application, including the semantic search against the prompt repository and prompt formatting logic and the Amazon Bedrock API invocations.',
        },
        {
          name: 'chat_history_prompt_generator.py',
          description:
            'houses the logic required to preserve session state and to dynamically inject the conversation history into prompts to allow for follow-up questions and conversation summary.',
        },
      ],
    },
    extraSteps: [
      {
        instructions:
          'Create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:',
        command: 'profile_name=<AWS_CLI_PROFILE_NAME>',
      },
      {
        instructions:
          'Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure line 23 in the prompt_finder_and_invoke_llm.py file to set the appropriate region:',
        command:
          "bedrock = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock-runtime.us-east-1.amazonaws.com')",
      },
      {
        instructions:
          'Since this repository is configured to leverage Claude 3, the prompt payload is structured in a different format. If you wanted to leverage other Amazon Bedrock models you can replace the llm_answer_generator() function in the prompt_finder_and_invoke_llm.py to look like:',
        command: `def llm_answer_generator(question_with_prompt):
    """
    This function is used to invoke Amazon Bedrock using the finalized prompt that was created by the prompt_finder(question)
    function.
    :param question_with_prompt: This is the finalized prompt that includes semantically similar prompts, chat history,
    and the users question all in a proper multi-shot format.
    :return: The final answer to the users question.
    """
    # body of data with parameters that is passed into the bedrock invoke model request
    # TODO: TUNE THESE PARAMETERS AS YOU SEE FIT
    body = json.dumps({"prompt": question_with_prompt,
                       "max_tokens_to_sample": 8191,
                       "temperature": 0,
                       "top_k": 250,
                       "top_p": 0.5,
                       "stop_sequences": []
                       })
    # configure model specifics such as specific model
    modelId = 'anthropic.claude-v2'
    accept = 'application/json'
    contentType = 'application/json'
    # Invoking the bedrock model with your specifications
    response = bedrock.invoke_model(body=body,
                                    modelId=modelId,
                                    accept=accept,
                                    contentType=contentType)
    # the body of the response that was generated
    response_body = json.loads(response.get('body').read())
    # retrieving the specific completion field, where you answer will be
    answer = response_body.get('completion')
    # returning the answer as a final result, which ultimately gets returned to the end user
    return answer`,
      },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Claude 3 Image Analysis POC',
  pocPackageName: 'amazon-bedrock-claude3-image-analysis-poc',
  additionalDeps: [
    'langchain@^0.1',
    'langchain-community',
    'langchain-experimental',
  ],
  pocDescription:
    'This is sample code demonstrating the use of Amazon Bedrock and Multi-Modal Generative AI models from Anthropic to implement an image analysis use case. The application is constructed with a simple streamlit frontend where users can upload a 1 page jpeg, png or PDF and get a description of the image.',
  readme: {
    pocGoal: {
      architectureImage: true,
      overview:
        'The goal of this repo is to provide users with the ability to analyze images with Generative AI. This can be integrated into applications like image classification, reverse image lookup, object detection and more. This repo comes iwth a basic streamlit front-end to help users stand up a proof of concept and experiment with image analysis use-cases quickly.',
      flowSteps: [
        'The user uploads an image for bedrock model to analyze. (`app.py`).',
        'The streamlit app, takes the image input, and invokes Amazon Bedrock to generate a description (`analyze_images.py`).',
        'The image created by Amazon Bedrock is returned and displayed on the streamlit app (`app.py`).',
      ],
    },
    fileWalkthrough: {
      includeDefaults: true,
      files: [
        {
          name: 'analyze_images.py',
          description:
            'house the logic of the application, including the semantic search against the prompt repository and prompt formatting logic and the Amazon Bedrock API invocations.',
        },
      ],
    },
    extraSteps: [
      {
        instructions:
          'Create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:',
        command: 'profile_name=<AWS_CLI_PROFILE_NAME>',
      },
      {
        instructions:
          'Depending on the region and model that you are planning to use with Amazon Bedrock (please note that only a few models can analyze images), you may need to reconfigure model paramaters in the image_analysis file. You might also choose to customize your prompts if this POC is for an industry-specific use-case analyzing a specific type of image:',
        command: `brclient = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock-runtime.us-east-1.amazonaws.com',config=config)

#model params
model_id = "anthropic.claude-3-sonnet-20240229-v1:0"`,
      }, {
        instructions: 'You may also choose to customize the system prompt to align with a pecific use-case, or to get specific responses back about your images. ',
        command: 'system_prompt = "You are an expert in image analysis and classification. The question will be contained within the <question></question> tags. Before answering, think step by step in <thinking> tags as you analyze every part of the image. Provide your answer within the <answer></answer> tags. Incude a JSON structured response describing image attributes contained within the <json></json> tags. Always add line breaks between each section of your response"',
      },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Claude 3 Long Form Output POC',
  pocPackageName: 'amazon-bedrock-claude3-long-form-output-poc',
  additionalDeps: ['botocore', 'pypdf'],
  pocDescription:
    'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to translate text from a source to target language.',
  readme: {
    pocGoal: {
      overview: 'The goal of this repository is to provide users with the ability to use Amazon Bedrock to generate long form content. This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.',
      architectureImage: true,
      flowSteps: [
        'The user either selects the default prompt or inputs a prompt.',
        'The application constructs the appropriate prompt and sends it to Amazon Bedrock.',
        'The appliction recieves and sends the text to Amazon Bedrock for analysis of accuracy and fluency.',
        'The generated text and analysis is displayed on the frontend application.',
      ],
    },
    fileWalkthrough: {
      includeDefaults: true,
      files: [
        {
          name: 'BedrockProcessor.py',
          description: 'The logic for interacting with the Amazon Bedrock service.',
        },
      ],
    },
    extraSteps: [
      { instructions: 'Create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:', command: 'profile_name=<AWS_CLI_PROFILE_NAME>' },
      { instructions: 'Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure line 23 in the prompt_finder_and_invoke_llm.py file to set the appropriate region:', command: 'bedrock = boto3.client(\'bedrock-runtime\', \'us-east-1\', endpoint_url=\'https://bedrock-runtime.us-east-1.amazonaws.com\')' },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Claude 3 Multi-Modal POC',
  pocPackageName: 'amazon-bedrock-claude3-multi-modal-poc',
  additionalDeps: ['pillow'],
  pocDescription:
    'This is sample code demonstrating the use of Amazon Bedrock and Anthropic Claude 3 to satisfy multi-modal use cases. The application is constructed with a simple streamlit frontend where users can input zero shot requests to satisfy a broad range of use cases, including image to text multi-modal style use cases.',
  readme: {
    pocGoal: {
      overview: 'The goal of this repo is to provide users the ability to use Amazon Bedrock (specifically Claude3) and generative AI to leverage its multi-modal capabilities, allowing users to insert text questions, images, or both to get a comprehensive description/or answer based on the image and/or question that was passed in. \n This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.',
      architectureImage: true,
      flowSteps: [
        'The user uploads an image file to the streamlit app, with or without a text question. (`app.py`)',
        'The user inserts a text question into to the streamlit app, with or without an image. (`app.py`)',
        'The streamlit app, takes the image file and/or text and saves it. The image and/or text is passed into Amazon Bedrock (Anthropic Claude 3). (`llm_multi_modal_invoke.py`)',
        'A natural language response is returned to the end user, either describing the image, answering a question about the image, or answering a question in general. (`app.py`)',
      ],
    },
    fileWalkthrough: {
      includeDefaults: true,
      files: [
        { name: 'llm_multi_modal_invoke.py', description: 'Houses the logic of the application, including the image encoding and Amazon Bedrock API invocations' },
      ],
    },
    extraSteps: [
      {
        instructions: 'Create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:',
        command: `profile_name=<AWS_CLI_PROFILE_NAME>
save_folder=<PATH_TO_ROOT_OF_THIS_REPO>`,
      },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Claude 3 Streaming Response POC',
  pocPackageName: 'amazon-bedrock-claude3-streaming-response-poc',
  pocDescription:
    'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement streaming responses. The application is constructed with a simple streamlit frontend where users can input zero shot requests directly against the LLM of their choice, leveraging a streaming response technique.',
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Converse API POC',
  pocPackageName: 'amazon-bedrock-converse-api-poc',
  pocDescription:
    'This is sample code demonstrating the use of the Amazon Bedrock Converse API to help with conversation oriented use cases that require context preservation. The application is constructed with a simple streamlit frontend where users can input zero shot requests to Claude 3, with the Amazon Bedrock Converse API in place to allow users to ask context aware questions.',
  readme: {
    pocGoal: {
      overview: 'The goal of this repo is to provide users the ability to use Amazon Bedrock leveraging its streaming response capabilities. This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.',
      architectureImage: true,
      flowSteps: [
        'The user inserts a text question into to the streamlit app. (`app.py`)',
        'The streamlit app, takes the text and passes it into Amazon Bedrock. (`invoke_llm_with_streaming.py`)',
        'A natural language response is streamed to the end user, answering a question in general. (`app.py`)',
      ],
    },
    fileWalkthrough: {
      files: [
        {
          name: 'invoke_llm_with_streaming.py',
          description: 'Houses the invocation of Amazon Bedrock with a streaming response, and the basic prompt formatting logic.',
        },
      ],
    },
    extraSteps: [
      {
        instructions: 'Create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:',
        command: 'profile_name=<AWS_CLI_PROFILE_NAME>',
      },
      {
        instructions: 'Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure line 15 in the invoke_llm_with_streaming.py file to set the region or line 51 to change to another Claude 3 model such as Haiku:',
        command: `bedrock = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock-runtime.us-east-1.amazonaws.com')

response = bedrock.invoke_model_with_response_stream(body=json_prompt, modelId="anthropic.claude-3-sonnet-20240229-v1:0",
                                 accept="application/json", contentType="application/json")`,
      },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Converse Stream API POC',
  pocPackageName: 'amazon-bedrock-converse-stream-api-poc',
  pocDescription:
    'This is sample code demonstrating the use of the Amazon Bedrock ConverseStream API to help with conversation oriented use cases that require context preservation. The application is constructed with a simple streamlit frontend where users can input zero shot requests to Claude 3, with the Amazon Bedrock ConverseConverseStream API in place to allow users to ask context aware questions and stream the response back.',
  readme: {
    pocGoal: {
      overview: 'The goal of this repo is to provide users the ability to use the Amazon Bedrock ConverseStream API to demonstrate its ability to facilitate conversational GenAI use cases that require context awareness and streaming responses. \n This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.',
      architectureImage: true,
      flowSteps: [
        'The user inserts a text question into to the streamlit app. (`app.py`)',
        'The streamlit app, takes the text inserted by the user and is passed into an Amazon Bedrock Model using the Converse API. The users question is answered, and both the question and answer are stored. (`invoke_model_conversation_api.py`)',
        'The answer to the user\'s question is returned to the front-end application, and allows users to ask follow up questions as the Converse API help preserve context throughout the users conversation (`app.py`)',
      ],
    },
    additionalPrerequisits: [
      'Create an Amazon Bedrock Guardrail, information on how to do that can be found [here](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-create.html)',
    ],
    fileWalkthrough: {
      includeDefaults: true,
      files: [
        {
          name: 'invoke_model_converse_stream_api.py',
          description: 'Houses the logic of the application, including the Amazon Bedrock Converse API invocation.',
        },
      ],
    },
    extraSteps: [
      {
        instructions: 'create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:',
        command: 'profile_name=<CLI_profile_name>',
      },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock CSV Chatbot POC',
  pocPackageName: 'amazon-bedrock-csv-chatbot-poc',
  additionalDeps: ['pandas'],
  pocDescription:
    'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement a chatbot is able to converse with the user based on CSV data provided by the user. The application is constructed with a simple streamlit frontend where users can upload large CSV files and get them analyzed or start chatbot interactions.',
  readme: {
    pocGoal: {
      overview: 'The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to answer questions a user might have on the CSV data provided. \n\nThis repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.',
      architectureImage: true,
      flowSteps: [
        'The user uploads a CSV file to the streamlit app. (`app.py`)',
        'The streamlit app, takes the CSV file and chunks the document efficient data processing(`csv_data_insights.py`)',
        'Once the data is passed into Amazon Bedrock and the user asks the chatbot a question, it creates a response to the user\'s question (`csv_data_insights.py`).',
        'After the response is generated, it is presented on the streamlit app (`app.py`)',
      ],
    },
    fileWalkthrough: {
      includeDefaults: true,
      files: [
        {
          name: 'csv_data_insights.py',
          description: 'Houses the logic of the application and Amazon Bedrock API invocations.',
        },
      ],
    },
    extraSteps: [
      {
        instructions: 'reate a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain',
        command: `profile_name=<AWS_CLI_PROFILE_NAME>
        save_folder=<PATH_TO_ROOT_OF_THIS_REPO>`,
      },
      {
        instructions: 'Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure line 10 in the `csv_data_insights.py` file to set your region:',
        command: 'bedrock = boto3.client(\'bedrock-runtime\', \'us-east-1\', endpoint_url=\'https://bedrock.us-east-1.amazonaws.com\')',
      },
      {
        instructions: 'Since this repository is configured to leverage Claude 3, the prompt payload is structured in a different format. If you wanted to leverage other Amazon Bedrock models you can replace the line 143 in the `csv_data_insights.py` file to look like:',
        command: 'response = bedrock.invoke_model(body=json_prompt, modelId="anthropic.claude-3-sonnet-20240229-v1:0", accept="application/json", contentType="application/json")',
      },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Document Comparison POC',
  pocPackageName: 'amazon-bedrock-document-comparison-poc',
  additionalDeps: [
    'langchain@^0.1',
    'langchain-community',
    'langchain-experimental',
    'pypdf',
  ],
  pocDescription:
    'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement a document comparison use case. The application is constructed with a simple streamlit frontend where users can upload 2 versions of a document and get all changes between documents listed.',
  readme: {
    pocGoal: {
      overview: `The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to perform document comparison between two uploaded PDFs.
This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.`,
      architectureImage: true,
      flowSteps: [
        'The user uploads two PDF files to the streamlit app. (`app.py`)',
        'The streamlit app, takes the two PDF documents, saves it, and formats it into a prompt with semantically similar examples (`doc_comparer.py`)',
        'The finalized few shot prompt containing both uploaded documents is passed into Amazon Bedrock, which generates a list of all differences between the two uploaded documents and returns the final list to the front end (`doc_comparer.py`)',
      ],
    },
    fileWalkthrough: {
      includeDefaults: true,
      files: [{
        name: 'doc_comparer.py',
        description: 'Houses the logic of the application, including the prompt formatting logic and Amazon Bedrock API invocations.',
      }],
    },
    extraSteps: [
      {
        instructions: 'reate a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:',
        command: `profile_name=<AWS_CLI_PROFILE_NAME>
        save_folder=<PATH_TO_ROOT_OF_THIS_REPO>`,
      },
      {
        instructions: 'Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure line 20 in the doc_comparer.py file to set the appropriate region:',
        command: 'bedrock = boto3.client(\'bedrock-runtime\', \'us-east-1\', endpoint_url=\'https://bedrock.us-east-1.amazonaws.com\')',
      },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Aamazon Bedrock Document Generator POC',
  pocPackageName: 'amazon-bedrock-document-generator-poc',
  pocDescription:
    'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement a document generation use case. The application is constructed with a simple streamlit frontend where users can provide details and create a document in the exact format that the you specify.',
  readme: {
    pocGoal: {
      overview: 'The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to perform document generation based on a document template and details inputted by the user.\n\nThis repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.',
      architectureImage: true,
      flowSteps: [
        'The user inserts document details that they would like included in the generated document within the streamlit app. (`app.py`)',
        'The streamlit app, takes the document details, and invokes Amazon Bedrock to generate sample document that matches the document structure stated in the prompt containing the inserted document details (`doc_generator.py`)',
        'Amazon Bedrock generates a first draft of the sample document and presents it to the frontend (`app.py`)',
        'The user inserts refinement details highlighting areas where they would like to add refinements to the previously generated document (`app.py`)',
        'The streamlit app takes the refinement details, passes it to Amazon Bedrock along with the document prompt, and the original draft of the document to begin creating the refined version (`doc_generator.py`)',
        'Amazon Bedrock is used to generate the refined version of the document based on the user defined refinements and presents it on the frontend (`app.py`)',
      ],
    },
    extraSteps: [
      {
        instructions: 'create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:',
        command: 'profile_name=<AWS_CLI_PROFILE_NAME>',
      },
      {
        instructions: 'Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure line 12 in the document_generator.py file to set the appropriate region:',
        command: 'bedrock = boto3.client(\'bedrock-runtime\', \'us-east-1\', endpoint_url=\'https://bedrock-runtime.us-east-1.amazonaws.com\')',
      },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock GenAI Dynamic Prompt Explained POC',
  pocPackageName: 'amazon-bedrock-genai-dynamic-prompting-explained-poc',
  additionalDeps: [
    'langchain@^0.1',
    'langchain-community',
    'langchain-experimental',
  ],
  pocDescription:
    'This is sample code that can be used to provide a hands on explanation as to how Dynamic Prompting works in relation to Gen AI. The application is constructed with a simple streamlit frontend where users can ask questions against a Amazon Bedrock supported LLM and get a deeper understanding of how few-shot and dynamic prompting works.',
  readme: {
    pocGoal: {
      overview: `The goal of this repo is to provide users the ability to use Amazon Bedrock in a similar fashion to ChatGPT, in this case
the application has a strong focus on demonstrating on how prompts are dynamically selected based on the user inputted question.
This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.`,
      architectureImage: true,
      flowSteps: [
        'The user makes a "zero-shot" request to the streamlit frontend. (app.py`)',
        'The application performs a semantic search of the users query against the 1200+ prompts. (`prompt_finder_and_invoke_llm.py`)',
        'The application returns the 3 most semantically similar prompts, and creates a final prompt that contains the 3 returned prompts along with users query (few-shot prompting) (`prompt_finder_and_invoke_llm.py`)',
        'The final prompt is passed into Amazon Bedrock to generate an answer to the users question (`prompt_finder_and_invoke_llm.py`)',
        'The final answer is generated by Amazon Bedrock and displayed on the frontend application along with 3 most semantically similar prompts (`app.py`)',
      ],
    },
    fileWalkthrough: {
      includeDefaults: true,
      files: [
        {
          name: 'prompt_finder_and_invoke_llm.py',
          description: 'Houses the logic of the application, including the prompt formatting logic and Amazon Bedrock API invocations.',
        },
      ],
    },
    extraSteps: [
      {
        instructions: 'create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:',
        command: 'profile_name=<AWS_CLI_PROFILE_NAME>',
      },
      {
        instructions: 'Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure line 12 in the prompt_finder_and_invoke_llm.py file to set the appropriate region:',
        command: 'bedrock = boto3.client(\'bedrock-runtime\', \'us-east-1\', endpoint_url=\'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\')',
      },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Guardrails POC',
  pocPackageName: 'amazon-bedrock-guardrails-poc',
  pocDescription:
    'This is sample code demonstrating the use of Amazon Bedrock Guardrails to help prevent prompt-injection attacks and prevent unintended responses from the LLM. The application is constructed with a simple streamlit frontend where users can input zero shot requests to Claude 3, with Amazon Bedrock Guardrails in place to prevent malicious prompts and responses.',
  readme: {
    pocGoal: {
      overview: `The goal of this repo is to provide users the ability to use Amazon Bedrock Guardrails to demonstrate its ability to prevent malicious prompts and responses.
This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.`,
      architectureImage: true,
      flowSteps: [
        'The user inserts a text question into to the streamlit app. (`app.py`)',
        'The streamlit app, takes the text inserted by the user and is passed into an Amazon Bedrock Guardrail to check for prompt injection. If the prompt is detected as malicious or triggers the guardrail a response will be returned to the end user saying the request is blocked (`invoke_model_with_guardrails.py`)',
        'If the prompt does not trigger the guardrail it is passed into the bedrock model the user has specified (`invoke_model_with_guardrails.py`)',
        'A response is returned by the Amazon Bedrock Model of choice and is passed into the Amazon Bedrock Guardrail (`invoke_model_with_guardrails.py`). If the response is detected as malicious or triggers the guardrail a response will be returned to the end user saying the request is blocked (`invoke_model_with_guardrails.py`)',
        'If the response does not trigger a guardrail, a natural language response is returned to the end user answering the initial text question inserted by the end user (`app.py`)',
      ],
    },
    fileWalkthrough: {
      includeDefaults: true,
      files: [
        {
          name: 'invoke_model_with_guardrails.py',
          description: 'Houses the logic of the application, including the prompt formatting logic and Amazon Bedrock API invocations.',
        },
      ],
    },
    extraSteps: [
      {
        instructions: 'create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:',
        command: `profile_name=<AWS_CLI_PROFILE_NAME>
        region_name=<REGION>
guardrail_identifier=<Guardrail_Identifier>
guardrail_version=<Guardrail_Version> (this is just a number i.e. 1,2,3 etc...)`,
      },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Image Generation POC',
  pocPackageName: 'amazon-bedrock-image-generation-poc',
  additionalDeps: ['pillow'],
  pocDescription:
    'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement an image generation use case. The application is constructed with a simple streamlit frontend where users can input text requests to generate images based on the text input.',
  readme: {
    pocGoal: {
      overview: `The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to create images based on text input requests.
This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.`,
      architectureImage: true,
      flowSteps: [
        'The user inputs a text request asking to generate an image. (`app.py`)',
        'The streamlit app, takes the text input, and invokes Amazon Bedrock to generate an image (`image_generation.py`)',
        'The image created by Amazon Bedrock is returned and displayed on the streamlit app (`app.py`)',
      ],
    },
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Knowledgebases RAG POC',
  pocPackageName: 'amazon-bedrock-knowledgebases-rag-poc',
  pocDescription:
    'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to create vector embeddings for your data sources using Amazon Bedrock Knowledge bases with the ability ask questions against the stored documents. The application is constructed with a RAG based architecture where users can ask questions against the Knowledge bases.',
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock LangChain RAG POC',
  pocPackageName: 'amazon-bedrock-langchain-rag-poc',
  additionalDeps: [
    'langchain@^0.1',
    'langchain-community',
    'langchain-experimental',
    'python-dotenv',
  ],
  pocDescription:
    'This is sample code demonstrating the use of Amazon Bedrock and Generative AI using Langchain as orchestrator with the ability ask questions against the stored documents. This sample uses Knowledge bases as to retrieve the stored documents, however you can extend or update this sample to retrieve your stored documents from any Vector DB.',
  readme: {
    pocGoal: {
      overview: `The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI using Langchain as orchestrator to create RAG based applications.
This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.`,
      architectureImage: true,
      flowSteps: [
        'The user makes a request to the GenAI app (`app.py`)',
        'The app issues a get contexts query to the Amazon Bedrock Knowledge bases using Langchain based on the user request. (`query_with_langchain.py`)',
        'The knowledge bases returns search results related to the relevant documents from the ingested data. (`query_with_langchain.py`)',
        'The app sends the user request and along with the data retrieved from the Amazon Bedrock Knowlegebases as context in the LLM prompt to a LLM available within Bedrock using Langchain. (`query_with_langchain.py`)',
        'The LLM returns a succinct response to the user request based on the retrieved data. (`query_with_langchain.py`)',
        'The response from the LLM is sent back to the user. (`app.py`)',
      ],
    },
    extraSteps: [
      {
        instructions: `Now that we have successfully cloned the repo, created and activated the virtual environment and installed the necessary dependencies, it is time for us to create Amazon Bedrock Knowledge base.

To create our Amazon Bedrock Knowledge base we will:

1. Go to the Amazon Bedrock Service homepage within the AWS console and on the left-hand side we will select "Knowledge bases" under the "Orchestration" drop down ![Alt text](images/amazon_bedrock_homepage.png "Amazon Bedrock Homepage")

2. We will then click on "Create knowledge base" ![Alt text](images/knowledgeBase_homepage.png "Amazon Bedrock Create Knowledge base")

3. In the Knowledge base details section, you can optionally change the default name and provide a description for your knowledge base.In the IAM permissions section, choose an AWS Identity and Access Management (IAM) role that provides Amazon Bedrock permission to access other AWS services. You can let Amazon Bedrock create the service role or choose a custom role that you have created. Optionally, add tags to your knowledge base. Select Next. ![Alt text](images/kb_first_page.png "Knowledge base details")

4. On the Set up data source page, provide the information for the data source to use for the knowledge base: Optionally, change the default Data source name. Provide the S3 URI of the object containing the files for the data source that you prepared. Select Next. ![Alt text](images/kb_datasource_page.png "Set up Data Source")

5. In the Embeddings model section, choose a supported embeddings model to convert your data into vector embeddings for the knowledge base. In the Vector database section, choose Quick create a new vector store and select Next ![Alt text](images/kb_vectordb_page.png "Select Embeddings Model")

6. On the Review and create page, check the configuration and details of your knowledge base. Choose Edit in any section that you need to modify. When you are satisfied, select Create knowledge base.`,
      },
      {
        instructions: 'create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:',
        command: `profile_name=<AWS_CLI_PROFILE_NAME>
knowledge_base_id=<Knowledge Base Id of the the Knowledge Base we created in the previous step>
llm_model = < LLM model that you want to use for the POC, either "amazon-titan" or "anthropic-claude >`,
      },
      {
        instructions: 'Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure line 19 and 20 in the query_with_langchain.py file to change the region:',
        command: `bedrock = boto3.client('bedrock-runtime', 'us-east-1')
bedrock_agent_runtime = boto3.client('bedrock-agent-runtime','us-east-1')`,
      },
      {
        instructions: `Since this repository is configured to leverage Amazon Titan or Anthropic Claude 3 models, the prompt payload is structured in formats required for the invocation of these two models. 
If you wanted to leverage other Amazon Bedrock models, you can update \`query_with_langchain.py\` code. 
For example if you to call Amazon Titan Lite instead of Amazon Titan Express, you can update call_titan funciton in \`query_with_langchain.py\` to look like the code below.\n
You can then change the model_id param value to the other available models from Amazon Titan.

This repository is configured to leverage Knowledge bases. 
If you want to use other Vector DBs that are not supported in Amazon Bedrock Knowledge Bases, or want to directly retreive contexts from Vector DB using langchain, you can refere to [this Langchain documentation](https://python.langchain.com/docs/modules/data_connection/retrievers/vectorstore/).
`,
        command: `def call_titan(query, retriever):
    """
    This function is used to call Amazon Titan Express LLM model using Langchain.
    :param query: Contains the Question asked by the user
    :param retriever: Contains the  contexts retrieved from the Amazon Bedrock Knowledge base
    :return: Response recieved from LLM for the input user query
    """

    # Setting Model kwargs
    model_kwargs = {
        "maxTokenCount": 4096,
        "stopSequences": [],
        "temperature": 0,
        "topP": 1,
    }

    # Setting LLM method from the Language Bedrock library
    llm = Bedrock(
        client=bedrock, model_id="amazon.titan-text-lite-v1", model_kwargs={} #updating the model_id param to to Amazon Titan Lite
    )

    # Invoke Amazon Titan using the Langchain llm method
    qa = RetrievalQA.from_chain_type(
        llm=llm, retriever=retriever, return_source_documents=True
    )

    answer = qa(query)

    # Returning the response
    return answer       `,
      },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Meeting Minutes Summarization POC',
  pocPackageName: 'amazon-bedrock-meeting-minutes-summarization-poc',
  additionalDeps: ['requests'],
  pocDescription:
    'This application demonstrates using Amazon Bedrock and Amazon Transcribe to summarize meeting recordings. The streamlit frontend allows users to upload audio, video, or text files of meeting recording. Amazon Transcribe generates a transcript of recording and sent it Amazon Bedrock for summarization of the key discussion points. Users can then download the  generated summarized meeting notes.',
  readme: {
    pocGoal: {
      overview: `The goal of this repo is to provide users the ability to use Amazon Bedrock and Amazon Transcribe to create Meeting minutes from audio ,video recordings. If audio 
It show case the capablitiy to upload Audio, Video of meeting recording and create summary of meeting.`,
      architectureImage: true,
      flowSteps: [
        'The user uploads a meeting recording video or audio or .txt file using Upload File button.',
        'Meeting recording is already present in Amazon Transcribe Job History Transcription text is retrieved from Job History',
        'If Meeting recording is not present in Amazon Transcribe Job history, recording file is temporary upload on S3 and Sent to Amazon Transcribe Job to generate transcription text ',
        'Transcription text is sent to Amazon Bedrock LLM for summarization',
        'Summarization notes are updated in streamlit app',
        'User can download the meeting notes',
      ],
    },
    additionalPrerequisits: [
      'Access to Amazon Transcribe via your CLI Credentials',
      'Access to S3 Bucket with put,get,delete object permissions via your CLI credentials and accessible by Transcribe',
    ],
    extraSteps: [
      {
        instructions: `Configure S3 Bucket required for temporary uploading the file

Update the S3 Bucket name with your bucket name in **line 21**

**app.py** :`,
        command: 'S3_BUCKET_NAME = "<YOUR BUCKET NAME>"',
      },
    ],
    fileWalkthrough: {
      includeDefaults: true,
      files: [{
        name: 'llm.py',
        description: 'This file has the logic to interact with LLM using Amazon Bedrock API. ',
      }, {
        name: 'transcribe_util.py',
        description: 'This is the file that contains the logic to interact with Amazon Transcribe like starting Transcribe Job, getting Transcription job history, getting transcription text.',
      }, {
        name: 's3_util.py',
        description: 'This is the file that contains the logic to interact with S3 bucket.',
      }],
    },
  },
}));


// Not actually a streamlit poc, so manually defined README
pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Model Customization',
  pocPackageName: 'amazon-bedrock-model-customization',
  pocDescription: 'This sample leverages Jupyter Notebooks to demonstrate how to customize bedrock models.',
  excludeFromReadmeManagement: true,
  readme: {
    pocGoal: {
      flowSteps: [],
      overview: '',
      architectureImage: false,
    },
  },
  skipApp: true,
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Model Evaluation Data Prep Tool',
  pocPackageName: 'amazon-bedrock-model-eval-poc',
  additionalDeps: ['bs4', 'pandas'],
  pocDescription:
    'This is sample code aimed to accelerate customers aiming to leverage [Amazon Bedrock Model Evaluator](https://docs.aws.amazon.com/bedrock/latest/userguide/model-evaluation.html) with custom prompt data. This Proof-of-Concept (POC) enables users to provide a CSV containing data that should be used with Amazon Bedrock Model Evaluator. The user then maps the CSV columns to the appropriate fields depending on which type of Model Evaluation being executed. This will generate one or more `.jsonl` formatted files, ready for use with Amazon Bedrock Model Evaluator.',
  readme: {
    pocGoal: {
      overview: 'The goal of this POC is to help customers understand how to transform data from CSV format to an Amazon Bedrock Model Evaluation dataset.',
      architectureImage: false,
      flowSteps: [
        'Run the POC (see "How to use this Repo")',
        'Upload CSV of data to use with Model Evaluator',
        'Select the type of Model Evaluation being performed',
        'Map CSV columns to expected fields specific to the prompt type selected',
        'Download generated `.jsonl` file(s)',
        'Upload the generated `.jsonl` files to an Amazon S3 bucket that Amazon Bedrock Model Evalutor can access',
        'Execute Model Evaluation using custom prompts pointing to the newly uploaded prompt dataset. If you have more than 1,000 prompts, multiple files will have been generated. You can only execute model evaluation on a maximum of 1,000 records. ',
      ],
    },
    additionalPrerequisits: [
      'Ensure you have access to an Amazon S3 bucket where you can upload generated data. Amazon Bedrock Model Evaluator will also need access to read and write to this bucket during Model Evaluation. ',
    ],
    fileWalkthrough: {
      includeDefaults: true,
      files: [{
        name: 'logic.py',
        description: 'the logic that processes the data from the front-end',
      }],
    },
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Model Playground POC',
  pocPackageName: 'amazon-bedrock-model-playground-poc',
  pocDescription:
    'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement a Gen AI model playground. The application is constructed with a simple streamlit frontend where users can input zero shot requests and select any LLM offered by Amazon Bedrock.',
  readme: {
    pocGoal: {
      overview: `The goal of this repo is to provide users the ability to use Amazon Bedrock and select any of the available Amazon Bedrock LLMs to ask zero shot requests.
This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.`,
      architectureImage: true,
      flowSteps: [
        'The user selects the Amazon Bedrock Model they want to use and makes a "zero-shot" request to the streamlit frontend. (`app.py`).',
        'The application takes the question and the model chosen and routes it to the appropriate model (`model_invoker.py`). All specific model invocations are stored in (model_selector.py).',
        'The final answer is generated by the Amazon Bedrock Model chosen and displayed on the frontend application (`app.py`).',
      ],
    },
    fileWalkthrough: {
      includeDefaults: true,
      files: [{
        name: 'model_invoker.py',
        description: 'This file has the logic to interact with LLM using Amazon Bedrock API. ',
      }, {
        name: 'model_selector.py',
        description: 'This is the file that contains the logic to map the model selected by the user to the appropriate Amazon Bedrock Model.',
      }],
    },
    extraSteps: [
      {
        instructions: 'reate a .env file in the root of this POC specific directory within this repo. Within the .env file you just created you will need to configure the .env to contain:',
        command: `profile_name=<AWS_CLI_PROFILE_NAME>
region_name=us-east-1 (region of choice)`,
      },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock RAG with Kendra POC',
  pocPackageName: 'amazon-bedrock-rag-kendra-poc',
  pocDescription:
    'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement a RAG based architecture with Amazon Kendra. The application is constructed with a simple streamlit frontend where users can ask questions against documents stored in Amazon Kendra.',
  readme: {
    pocGoal: {
      overview: `The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to take natural language questions, and answer questions against indexed documents in Amazon Kendra.
This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.`,
      architectureImage: true,
      flowSteps: [
        'The user makes a request to the GenAI app (`app.py`).',
        'The app issues a search query to the Amazon Kendra index based on the user request. (`kendra_bedrock_query.py`)',
        'The index returns search results with excerpts of relevant documents from the ingested data. (`kendra_bedrock_query.py`)',
        'The app sends the user request and along with the data retrieved from the index as context in the LLM prompt. (`kendra_bedrock_query.py`)',
        'The LLM returns a succinct response to the user request based on the retrieved data. (`kendra_bedrock_query.py`)',
        'The response from the LLM is sent back to the user. (app.py)',
      ],
    },
    additionalPrerequisits: [
      'Access to create and configure Amazon Kendra Indexes',
    ],
    fileWalkthrough: {
      includeDefaults: true,
      files: [{
        name: 'kendra_bedrock_query',
        description: 'The logic of the application, including the Kendra Retrieve API calls and Amazon Bedrock API invocations.',
      }],
    },
    extraSteps: [
      {
        instructions: `**Create your Amazon Kendra Index (if you don't already have one)**
        \t\t1. Go to Amazon Kendra in your AWS Console and click on "Create an Index" ![Alt text](images/Amazon_kendra_homepage.png "Kendra Homepage")
        \t\t2. Fill out the "Specify Index details" page, and provide Kendra a role that can access CloudWatch Logs. ![Alt text](images/kendra_specify_index_details.png "Kendra Specify Details Page")
        \t\t3. Fill out the "Configure Access Control" page ![Alt text](images/kendra_access_control.png "Kendra Access Control")
        \t\t4. Select the appropriate provisioning editions and create ![Alt text](images/specify_provisioning_kendra.png "Kendra Edition Selection")
        \t\t5. You can find your Kendra Index ID in the console as seen in the screenshot: ![Alt text](images/kendra_screen_shot.png "Kendra Index")`,
      },
      {
        instructions: 'Create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:',
        command: `profile_name=<aws_cli_profile_name>
kendra_index=<kendra_index_ID>`,
      },
      {
        instructions: 'Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure line 11 in the kendra_bedrock_query.py file to change the region:',
        command: 'bedrock = boto3.client(\'bedrock-runtime\', \'us-east-1\', endpoint_url=\'https://bedrock.us-east-1.amazonaws.com\')',
      },
      {
        instructions: `Time to sync a data source within Kendra. As seen in the screenshot below, you can configure the specific datasource that you would like to sync. For more information
on data sources feel free to refer to this [documentation](https://docs.aws.amazon.com/kendra/latest/dg/hiw-data-source.html).

![Alt text](images/kendra_data_source.png "Kendra Data Source")

**_If you don't have your own sample data, or sample data source you can leverage the sample datasource within Amazon Kendra data sources as shown below:_**

    \t\t1. On the data sources tab, click on the add dataset option as seen in the image: ![Alt text](images/sample_data_sources.png "Kendra Sample Data Source")
    \t\t2. Then define the data sources attributes such as the data source name and click add data source: ![Alt text](images/sample_data_source_configuration.png "Kendra Sample Data Source Config")
    \t\t3. This will automatically create the data source and triggers a sync. You will now be able to ask questions against Sample AWS Documentation that covers Kendra, EC2, S3 and Lambda in your front end application.
`,
      },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock RAG with OpenSearch Serverless POC',
  pocPackageName: 'amazon-bedrock-rag-opensearch-serverless-poc',
  additionalDeps: [
    'opensearch-py',
    'langchain@^0.1',
    'langchain-community',
    'langchain-experimental',
  ],
  pocDescription:
    'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to create custom embeddings stored in Amazon OpenSearch Serverless with the ability ask questions against the stored documents. The application is constructed with a RAG based architecture where users can ask questions against the indexed embeddings within OpenSearch Serverless.',
  readme: {
    pocGoal: {
      overview: `The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to take natural language questions, and answer questions against embedded and indexed documents in Amazon OpenSearch Serverless Vector Search.
This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.`,
      architectureImage: true,
      flowSteps: [
        'The user makes a request to the GenAI app (`app.py`)',
        'The app issues a k-nearest-neighbors search query to the Amazon OpenSearch Serverless Vector Search index based on the user request. (`query_against_opensearch.py`)',
        'The index returns search results with excerpts of relevant documents from the ingested data. (`query_against_opensearch.py`)',
        'The app sends the user request and along with the data retrieved from the Amazon OpenSearch Serverless Vector Search index as context in the LLM prompt. (`query_against_opensearch.py`)',
        'The LLM returns a succinct response to the user request based on the retrieved data. (`query_against_opensearch.py`)',
        'The response from the LLM is sent back to the user. (`app.py`)',
      ],
    },
    additionalPrerequisits: [
      'Access to create and configure Amazon OpenSearch Serverless collections',
    ],
    fileWalkthrough: {
      includeDefaults: true,
      files: [{
        name: 'docs_to_openSearch.py',
        description: 'the logic needed to take a PDF document stored on your local machine, creating the embeddings and storing it in your OpenSearch Index.',
      }, {
        name: 'query_against_opensearch.py',
        description: 'The logic of the application, including the Amazon OpenSearch Serverless Vector Search calls and Amazon Bedrock API invocations.',
      }],
    },
    extraSteps: [
      {
        instructions: `Create the Amazon OpenSearch Serverless Vector Search collection.

                To create our Amazon OpenSearch Vector Search Collection we will:

                1. Go to the Amazon OpenSearch Service homepage within the AWS console and on the left-hand side we will select "Collections" under the "Serverless" drop down ![Alt text](images/Amazon_OpenSearch_Homepage.png "Amazon OpenSearch Serverless Homepage")
                2. We will then click on "Create collection" ![Alt text](images/create_collection.png "Amazon OpenSearch Create Collection")
                3. On the "Configure collection settings" page, we will need to input a "Collection name", select the "Collection type": "Vector search", in the "Security" section select the option "Standard create", and select your preferred "Encryption" settings: ![Alt text](images/Configure_collection_settings_part_1.png "Amazon OpenSearch Serverless Collection Settings Part-1")
                4. On the same "Configure collection settings" page, at the bottom we will select our "Network access settings" either "Public" or "VPC", and give access to the OpenSearch Endpoint and/or OpenSearch Dashboards and select next ![Alt text](images/configure_collection_settings_part_2.png "Amazon OpenSearch Create Collection Part 2")
                5. On the "Configure data access" page we must input a "Rule name", add the user for which you have CLI credentials for, and for the sake of the POC Grant all permissions and select Next ![Alt text](images/configure_data_access.png "Amazon OpenSearch Configure Data Access")
                6. We will then enter an access policy name and select Next ![Alt text](images/access_policy_definition.png "Amazon OpenSearch Configure Data Access Part 2")
                7. We will confirm all of our configuration items, and press Submit ![Alt text](images/collection_create_confirm.png "Amazon OpenSearch Collection Confirm")
                8. As soon as the collection is created, you will want to **BE SURE TO NOTE DOWN THE OPENSEARCH ENDPOINT** ![Alt text](images/OpenSearch-endpoint.png "Amazon OpenSearch Endpoint")`,
      }, {
        instructions: `With our Amazon OpenSearch Serverless Vector Search collection created, we now must create our Vector Index. As soon as this is created we will begin indexing our PDF document.

                1. Within the OpenSearch Serverless Collection we just created, we will select "Create vector index" ![Alt text](images/create_vector_index.png "Create Vector Index")
                2. We will then input a Vector Index Name, Vector Field Name, Dimensions and distance metric... **BE SURE TO NOTE DOWN THE VECTOR INDEX NAME AND VECTOR FIELD NAME**. The Dimensions field is expecting an integer, in our case since we are using the 'amazon.titan-embed-text-v1' embeddings model, the dimension size will be 1536. If you plan on using a different embeddings model you will need to change this value to represent the output vector size of that specific model. Then Select "Create" ![Alt text](images/create_vector_index_name.png "Create Vector Index Details") ![Alt text](images/vector_field.png "Create Vector Index Details")
                3. **_OPTIONAL:_** If you want to add meta-data to your documents that you plan on indexing, you must specify those fields in this vector index configuration. If you plan on adding meta-data you will need to reconfigure some of the code in the docs_to_openSearch.py file ![Alt text](images/metadata.png "Add Meta-Data")`,
      }, {
        instructions: 'create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:',
        command: `profile_name=<AWS_CLI_PROFILE_NAME>
opensearch_host=<AMAZON_OPENSEARCH_HOST> example->abcdefghijklmnop1234.us-east-1.aoss.amazonaws.com
vector_index_name=<vector_index_name>
vector_field_name=<vector_field_name>`,
      }, {
        instructions: 'Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure line 12 in the query_against_openSearch.py file to change the region:',
        command: 'bedrock = boto3.client(\'bedrock-runtime\', \'us-east-1\', endpoint_url=\'https://bedrock.us-east-1.amazonaws.com\')',
      }, {
        instructions: `After you create your .env file, it is time to create the embeddings for a sample PDF document of your choosing.
All you will need to do, is specify the path to that PDF document in line 42 of the docs_to_openSearch.py file.
Optionally you can also try different values for the document chunk size in line 47 - line 51 of the same docs_to_openSearch.py file.
As soon as you are satisfied with the configuration, you can simply run the file while in the root of the repo with the command below. \n
**_Depending on the size of your document this process can range from seconds to hours_**\n`,
        command: 'python3 docs_to_openSearch.py',
      },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Semantic Cache POC',
  pocPackageName: 'amazon-bedrock-semantic-cache-poc-main',
  additionalDeps: ['opensearch-py'],
  pocDescription:
    'This project demonstrates a Retrieval-Augmented Generation (RAG) system using Amazon Bedrock for knowledge retrieval and OpenSearch for semantic caching. It provides a Streamlit-based user interface for asking questions about data stored in Amazon Knowledge Bases.',
  readme: {
    pocGoal: {
      overview: `The primary goal of this repository is to showcase an efficient and scalable question-answering system that combines the power of Large Language Models (LLMs) with a knowledge base and semantic caching.
      The approach aims to:
      1. Provide fast and accurate answers to user queries
      2. Reduce the load on the LLM and knowledge base by utilizing a semantic cache
      3. Reduce the cost of the system by limiting calls to the LLM
      4. Demonstrate the integration of Amazon Bedrock and OpenSearch for semantic caching purposes`,
      architectureImage: true,
      flowSteps: [
        'Load documents and crawl websites to add data into knowledge base',
        'User submits a question through the Streamlit UI',
        'The system checks the semantic cache (OpenSearch) for similar previous queries',
        'If a cache hit occurs, the stored answer is returned immediately',
        'If no cache hit, the system queries the Amazon Bedrock Knowledge Base for relevant context',
        'The retrieved context and user question are sent to an LLM (Claude 3) for answer generation',
        'The new question-answer pair is stored in the semantic cache',
        'The answer is displayed to the user in the Streamlit interface',
      ],
    },
    fileWalkthrough: {
      includeDefaults: true,
      files: [{
        name: 'knowledge_base.py',
        description: 'Functions for interacting with Amazon Bedrock Knowledge Base',
      }, {
        name: 'semantic_cache.py',
        description: 'Functions for semantic caching using OpenSearch',
      }, {
        name: 'utils.py',
        description: 'Utility functions and shared configurations',
      }],
    },
    additionalPrerequisits: [
      'A Amazon Bedrock Knowledge Base with Amazon OpenSearch as the Vector Store. Instructions can be found [here](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-create.html).',
    ],
    extraSteps: [
      {
        instructions: 'Create a `.env` file in the project root with the following variables:',
        command: `PROFILE_NAME=your_aws_profile_name
AWS_REGION=your_aws_region
OPENSEARCH_HOST=your_opensearch_host
OPENSEARCH_INDEX=your_opensearch_index (Note: Specify a name like semantic-cache-index. This will be a seperate index than your knowledge base which will be created by the application)
KNOWLEDGE_BASE_ID=your_knowledge_base_id`,
      },
      {
        instructions: `Update OpenSearch permissions to allow access from the CLI and to grant delete actions

        a. Navigate to OpenSearch Serverless Collections

        ![Alt text](image/os-permissions-1.png)

        b. Select your Collection

        ![Alt text](image/os-permissions-2.png)

        c. Click on Data Access Control

        ![Alt text](image/os-permissions-3.png)

        d. Select Edit

        ![Alt text](image/os-permissions-4.png)

        e. Add your CLI user as a principal  

        ![Alt text](image/os-permissions-5.png)

        f. Grant Delete Collection Items on the collection and Delete Index on the index and click Save

        ![Alt text](image/os-permissions-6.png)`,
      },
    ],
    finalText: `## Considerations

Other vector db's can be used to implement semantic caching. Here a a few helpful links to explore:

1. [Semantic Caching with MemoryDB](https://aws.amazon.com/blogs/database/improve-speed-and-reduce-cost-for-generative-ai-workloads-with-a-persistent-semantic-cache-in-amazon-memorydb/)
2. [Semantic Caching with LangChain](https://python.langchain.com/v0.2/docs/integrations/llm_caching/)

Please note that only specific models can be used with Amazon Bedrock Knowledge Bases and with the Amazon Bedrock Converse API.
1. Amazon Bedrock Converse API - Supported [models](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html) and model features
2. Amazon Bedrock Knowledge Bases - Supported [models](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-supported.html) by action`,
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Speech to Text POC',
  pocPackageName: 'amazon-bedrock-speech-to-text-chat-poc',
  additionalDeps: [
    'sounddevice',
    'amazon-transcribe',
    'langchain@^0.1',
    'langchain-community',
    'langchain-experimental',
  ],
  pocDescription:
    'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement a ChatGPT alternative using speech-to-text prompts. The application is constructed with a simple streamlit frontend where users can provide zero shot requests using their computer’s microphone and listen to responses to satisfy a broad range of use cases.',
  readme: {
    pocGoal: {
      overview: 'The goal of this repo is to provide users the ability to use Amazon Bedrock in a similar fashion to ChatGPT by invoking the model using their speech rather than typing. This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.',
      architectureImage: true,
      flowSteps: [
        'The user makes a "zero-shot" request to the streamlit frontend (app.py) by speaking into their computer’s microphone.',
        'The live audio is streamed to Amazon Transcribe (live_transcription.py)',
        'The transcribed text is streamed back to the streamlit frontend (app.py) once the user has finished speaking.',
        'The application performs a semantic search of the users query against the 1200+ prompts. (prompt_finder_and_invoke_llm.py).',
        'The application returns the 3 most semantically similar prompts, and creates a final prompt that contains the 3 returned prompts along with users query (few-shot prompting) (prompt_finder_and_invoke_llm.py).',
        'The final prompt is passed into Amazon Bedrock to generate an answer to the user’s question (prompt_finder_and_invoke_llm.py).',
        'The final answer is generated by Amazon Bedrock and displayed on the frontend application (app.py).',
        'The final answer is passed to Amazon Polly to convert the text to natural sounding speech (app.py)',
        'The audio file is returned and played through the frontend application (app.py)',
      ],
    },
    fileWalkthrough: {
      includeDefaults: true,
      files: [{
        name: 'chat_history_prompt_generator.py',
        description: 'logic required to preserve session state and to dynamically inject the conversation history into prompts to allow for follow-up questions and conversation summary.',
      }, {
        name: 'live_transcription.py',
        description: 'logic required to create an audio stream from the users microphone, send the audio chunks to Amazon Transcribe, and generate a text transcript. The requirements.txt file contains all necessary dependencies for this sample application to work.',
      }, {
        name: 'prompt_finder_and_invoke_llm.py',
        description: 'logic of the application, including the semantic search against the prompt repository and prompt formatting logic and the Amazon Bedrock API invocations.',
      }],
    },
    extraSteps: [
      {
        instructions: ' create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:',
        command: 'profile_name=<AWS_CLI_PROFILE_NAME>',
      }, {
        instructions: 'Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure line 23 in the prompt_finder_and_invoke_llm.py file to set the appropriate region:',
        command: 'bedrock = boto3.client(\'bedrock-runtime\', \'us-east-1\', endpoint_url=\'https://bedrock-runtime.us-east-1.amazonaws.com\')',
      },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Streaming Response POC',
  pocPackageName: 'amazon-bedrock-streaming-response-poc',
  pocDescription:
    'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement streaming responses. The application is constructed with a simple streamlit frontend where users can input zero shot requests directly against the LLM of their choice, leveraging a streaming response technique.',
  readme: {
    pocGoal: {
      overview: `The goal of this repo is to provide users the ability to use Amazon Bedrock leveraging its streaming response capabilities.
This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.`,
      architectureImage: true,
      flowSteps: [
        'The user inserts a text question into to the streamlit app. (app.py).',
        'The streamlit app, takes the text and passes it into Amazon Bedrock. (invoke_llm_with_streaming.py).',
        'A natural language response is streamed to the end user, answering a question in general. (app.py).',
      ],
    },
    fileWalkthrough: {
      includeDefaults: true,
      files: [{
        name: 'invoke_llm_with_streaming.py',
        description: 'The logic required to invoke Amazon Bedrock and stream the response back to the frontend application (app.py).',
      }],
    },
    extraSteps: [
      {
        instructions: ' create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:',
        command: 'profile_name=<AWS_CLI_PROFILE_NAME>',
      }, {
        instructions: 'Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure line 15 & 39 in the invoke_llm_with_streaming.py file:',
        command: `bedrock = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock-runtime.us-east-1.amazonaws.com')
        
        modelId = 'anthropic.claude-v2'`,
      },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Summarization of Long Documents POC',
  pocPackageName: 'amazon-bedrock-summarization-long-document-poc',
  additionalDeps: [
    'langchain@^0.1',
    'langchain-community',
    'langchain-experimental',
    'pypdf',
  ],
  pocDescription:
    'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement a long document summarization use case. The application is constructed with a simple streamlit frontend where users can upload large documents and get them summarized.',
  readme: {
    pocGoal: {
      overview: `The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to create summaries of large PDF files with chunking logic.
This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.`,
      architectureImage: true,
      flowSteps: [
        'The user uploads a PDF file to the streamlit app. (app.py).',
        'The streamlit app, takes the PDF document, saves it, and chunks the document (doc_summarizer.py).',
        'Each chunk of the document is passed into Amazon Bedrock, which summarizes each chunk, and then performs a summarization of all chunks (doc_summarizer.py).',
        'After the final summarization is completed, the final summary is presented on the streamlit app (app.py).',
      ],
    },
    fileWalkthrough: {
      includeDefaults: true,
      files: [{
        name: 'doc_summarizer.py',
        description: 'The logic required to chunk the document, invoke Amazon Bedrock, and perform the final summarization (doc_summarizer.py).',
      }],
    },
    extraSteps: [
      {
        instructions: 'Create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:',
        command: `profile_name=<AWS_CLI_PROFILE_NAME>
save_folder=<PATH_TO_ROOT_OF_THIS_REPO>`,
      },
      {
        instructions: 'Depending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure in the doc_summarizer.py file:',
        command: 'bedrock = boto3.client(\'bedrock-runtime\', \'us-east-1\', endpoint_url=\'https://bedrock.us-east-1.amazonaws.com\'',
      },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Task Classification POC',
  pocPackageName: 'amazon-bedrock-task-classification',
  pocDescription:
    'This sample code demonstrates how to use Amazon Bedrock and Generative AI to implement a task classification bot. The application is constructed with a simple streamlit frontend where users can input a task and get the correct classification which then trigger appropriate downstream workflows to process the task inputted. ',
  readme: {
    pocGoal: {
      overview: `The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to classify a task, and thus the ability to auto trigger downstream workflows that are designed to process these tasks.
This repo comes with a basic front end to help users stand up a proof of concept in just a few minutes.`,
      architectureImage: true,
      flowSteps: [
        'The user input task with relevant details into the streamlit app (app.py).',
        'The streamlit app, takes the task with description and pass it along to a helper file (task_classification.py).',
        'This helper file calls the Bedrock API and wraps the user prompt with a system prompt, parsing user\'s input and add further requirements.',
        `Amazon Bedrock responses to the user's task in 2 items.
      * What class the task belongs to 
      * Model's further processing of task details (to then be pass on to appropriate downstream processes)`,
        'The application parse the two items from the model outputs to perform next steps (task_classification.py).',
        'A visual confirmation on streamlit app (pop up modal) to ensure the correct class is assigned to the task inputted (app.py). ',
      ],
    },
    fileWalkthrough: {
      includeDefaults: true,
      files: [{
        name: 'task_classification.py',
        description: 'The logic required to invoke Amazon Bedrock and parse the response',
      }],
    },
    extraSteps: [
      {
        instructions: 'Create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:',
        command: 'profile_name=<AWS_CLI_PROFILE_NAME',
      },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Text Extraction POC',
  pocPackageName: 'amazon-bedrock-text-extraction-poc',
  additionalDeps: ['pdfplumber'],
  pocDescription:
    'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to extract text from a document. The application is constructed with a simple streamlit frontend where users leverage Bedrock Agents to extract and summarize key information from a document like a financial earnings report. ',
  readme: {
    pocGoal: {
      overview: 'The goal of this repo is to provide users with a simple text extraction POC. The example document leveraged is an Amazon Earnings Report and the Agents will extract key information: Report Title, Report Publishing Date, Company Focus, Earnings Per Share (EPS), Net Income, Free Cash Flow, Brief Summary of Report, and a Key Quote from Leadership. This is just one example of text extraction and the prompts can be altered depending on the type of document and information you would like extracted. ',
      architectureImage: true,
      flowSteps: [
        'The user uploads a document to be summarized, in this example we use an earnings report in PDF format into the streamlit app. (app.py).',
        'The streamlit app, takes the PDF and passes it into Amazon Bedrock. If you upload another document make sure to update your prompts with what you want extracted/summarized! (extract_pdf_to_json.py).',
        'A Bedrock Agent extracts key information and returns it to the user in valid JSON format. (extract_pdf_to_json.py).',
      ],
    },
    fileWalkthrough: {
      includeDefaults: true,
      files: [{
        name: 'extract_pdf_to_json.py',
        description: 'The logic required to invoke Amazon Bedrock and parse the response (extract_pdf_to_json.py).',
      }, {
        name: 'AMZN-Q1-2024-Earnings-Release.pdf',
        description: 'contains an example earnings report the user will upload.',
      }],
    },
    extraSteps: [
      {
        instructions: 'Create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:',
        command: 'profile_name=<AWS_CLI_PROFILE_NAME>',
      },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Translation POC',
  pocPackageName: 'amazon-bedrock-translation-poc',
  pocDescription:
    'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to translate text from a source to target language. Additionally, this demo also includes an Amazon Translate usecase.',
  additionalDeps: ['pypdf', 'python-docx', 'PyMuPDF'],
  readme: {
    pocGoal: {
      overview: 'The goal of this repository is to provide users with the ability to use Amazon Bedrock to perform translations. This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.',
      architectureImage: true,
      flowSteps: [
        `Text:
            1. The user inputs text and selects the source and target language.
            2. The application constructs the appropriate prompt for translation and sends it to Amazon Bedrock.
            3. The appliction recieves and sends the translated text to Amazon Bedrock for analysis of accuracy and fluency.
            4. The translated text and analysis is displayed on the frontend application.`,
        `Chat:
            1. The user inputs text and selects the target language.
            2. The application constructs the appropriate prompt for translation and sends it to Amazon Bedrock.
            3. The translated response is displayed on the frontend application.`,
        `File:
            1. The user uploads a text file and selects the target language.
            2. The application constructs the appropriate prompt for translation and sends it to Amazon Bedrock.
            3. The translated text from the document is displayed on the frontend application.`,
        `PDF:
            1. The user uploads a PDF file and selects the source and target language.
            2. The application extracts the text from the PDF in small chunks chunks based on the text location.
            3. The application rapidly sends the chunks to Amazon Translate for translation. Because there is a high volume of small requests, Amazon Translate can more efficiently handle the requests.
            4. The application constructs a new PDF by redacting the original text and placing the translated text in the same location (with auto size scaling to handle different length than original text).
            5. The user can download the formatted, translated PDF.`,
      ],
    },
    fileWalkthrough: {
      includeDefaults: false,
      files: [{
        name: 'streamlit_pages/Text.py',
        description: 'Frontend for Text Translate',
      }, {
        name: 'streamlit_pages/Chat.py',
        description: 'Frontend for Chat Translate',
      }, {
        name: 'streamlit_pages/File.py',
        description: 'Frontend for File Translate',
      }, {
        name: 'streamlit_pages/PDF.py',
        description: 'Frontend for PDF Translate',
      }, {
        name: 'amazon_bedrock_translation/translate.py',
        description: 'Logic required to invoke Amazon Bedrock and parse the response',
      }, {
        name: 'amazon_bedrock_translation/text_extractor.py',
        description: 'Logic required to extract text from a file',
      }, {
        name: 'amazon_bedrock_translation/file_manager.py',
        description: 'Logic required to manage file uploads and downloads',
      }, {
        name: 'amazon_translate_translation/pdf_translator.py',
        description: 'Logic required to translate PDFs with Amazon Translate',
      }],
    },
    extraSteps: [
      {
        instructions: 'Create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:',
        command: 'profile_name=<AWS_CLI_PROFILE_NAME>',
      },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Video Chapter Creator POC',
  pocPackageName: 'amazon-bedrock-video-chapter-creator-poc',
  additionalDeps: ['langchain@^0.1', 'pandas', 'opensearch-py', 'thefuzz'],
  pocDescription:
    `This is sample code demonstrating the use of Amazon Transcribe, Amazon OpenSearch Serverless, Amazon Bedrock and Generative AI, to a implement video chapter generator and video search sample.
    The application is constructed with a simple streamlit frontend where users can upload a video that will be stored, transcribed and have searchable chapters generated. Additionally, if you have videos already uploaded to S3 and have subtitles for the video already created in \`.srt\` format, you can skip transcribing and jump straight into generating chapters.\n\n
    The sample also includes a second UI that allows the user to ask about a topic. This will search the video chapters from the videos you've provided and provide a video, set to a specific chapter, that was the closest match to the inquiry.`,
  readme: {
    pocGoal: {
      overview: `The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to create video chapters and searching those chapters. 
      \tThis repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.
      \tThe application is constructed with a simple streamlit frontend where users can upload a video that will be stored, transcribed and have searchable chapters generated. Additionally, if you have videos already uploaded to S3 and have subtitles for the video already created in \`.srt\` format, you can skip transcribing and jump straight into generating chapters.
      \t\tThe sample also includes a second UI that allows the user to ask about a topic. This will search the video chapters from the videos you've provided and provide a video, set to a specific chapter, that was the closest match to the inquiry.
`,
      architectureImage: true,
      flowSteps: [
        `   1. The user uploads a video file or provides an uploaded file s3 oject to the streamlit app. 
            2. The streamlit app, takes the video, transcribes it and uses the transcription to determine spots that make sense as chapters.
            3. Each chapter is then sent to the LLM to locate a good spot to start the chapter that gives some context as to the content amd doesn't drop the user into the middle of the content.
            4. The chapters are then returned to the user, who can then save the chapters to the OpenSearch Collection. `,

        `On the search side:
            1. The user asks an inquiry via the streamlit app.
            2. The query is passed the the LLM with the OpenSearch collection as a source.
            3. The OpenSearch collection provides the chapter, which is then returned with the video to set the user to the correct spot in the video. `,
      ],
    },
    additionalPrerequisits: [
      `An OpenSearch Serverless Collection. You can learn how to create one [here](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless-vector-search.html).
*The Easy Create instructions on the document are suitable for this*
Within the Collection, a Vector Index is needed, with a Vector Field called \`vectors\` with an Engine value of \`mmslib\`, Dimensions of \`1536\`. The remaining options can be left with their default values.`,
      'An Amazon S3-Backed CloudFront Distribution. Videos will be uploaded to this S3 bucket and users will access videos through the CloudFront distribution. You can learn how to deploy the CloudFront an S3 bucket configuration [here](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/GettingStarted.SimpleDistribution.html). ',
    ],
    fileWalkthrough: {
      includeDefaults: true,
      files: [{
        name: 'videochapterlogic.py',
        description: 'This is the logic that the UI connects to. The functions perform the logic and API calls to the AWS service endpoints like Amazon Transcribe, Amazon Bedrock, etc. `app.py` imports `videochapterlogic` functions.',
      }, {
        name: 'environment.toml',
        description: 'This is the file that contains the configurations specific to your AWS environment like the S3 Bucket or OpenSearch Collection endpoint. The values in this file are required in order for the application to function.',
      }, {
        name: '.streamlit/config.toml',
        description: 'The streamlit configuration file with paremters set to override the default configuration. Generally you won\'t need to adjust this unless you want to further customize the streamlit app. ',
      }],
    },
    extraSteps: [
      {
        instructions: `Now that the requirements have been successfully installed in your virtual environment we can begin configuring environment variables.

Open the \`environment.toml\` file and fill in the properties with your resources`,
      },
    ],
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock PowerPoint Generator',
  pocPackageName: 'amazon-bedrock-powerpoint-generator-poc',
  additionalDeps: [
    'langchain@^0.3',
    'langchain-aws',
    'langchain-community',
    'python-pptx',
    'uuid',
    'wikipedia',
    'pypdf',
    'docx2txt',
  ],
  pocDescription:
    'This is sample code demonstrates the use of Amazon Bedrock and Generative AI to implement a PowerPoint generator. The application is constructed with a simple streamlit frontend where users can input a topic and get a PowerPoint generated based on the topic. Using Generative AI, the solution creates relevant Wikipedia queries to perform in-depth research on the presentation content.',
  readme: {
    pocGoal: {
      architectureImage: false,
      overview:
        'The goal of this POC is to showcase leveraging Generative AI for to create both the content for a presentation and also the background research queries to support the content generation.',
    },
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Intelligent Document Processing (IDP) POC',
  pocPackageName: 'amazon-bedrock-intelligent-document-processing-poc',
  pocDescription:
    'This is sample code demonstrating the use of Amazon Bedrock and Generative AI incorporated into an Intelligent Document Processing (IDP) pipeline using user-uploaded documents. The application is constructed with a simple streamlit frontend where users can upload various document formats and perform different IDP actions such as text extraction, document summarization and classification, entity recognition, and Q&A to satisfy a broad range of use cases.',
  readme: {
    pocGoal: {
      architectureImage: true,
      overview:
        'The goal of this repo is to provide users the ability to use various Amazon AI services utilized in an IDP pipeline combined with Amazon Bedrock to improve performance, complete tasks faster, and limit human review. This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.',
      flowSteps: [
        'The user selects and uploads a document to the streamlit frontend (upload_doc_to_s3.py).',
        'The document is uploaded to an Amazon S3 bucket (upload_doc_to_s3.py, s3_utils.py)',
        'The raw text and key-value pairs are extracted from the document using Amazon Textract (extract_text_with_textract.py, textract_utils.py)',
        'The extracted key-value pairs are grammatically corrected using Amazon Bedrock, where the enriched output is saved to the local directory (enrich_doc_with_bedrock.py, bedrock_utils.py)',
        'The enriched output is then analyzed by Amazon Comprehend to detect entities such as people, organizations, locations, and more (entity_recognition_with_comprehend.py, comprehend_utils.py).',
        'The enriched output is then passed to Amazon Bedrock for document classification, summarization, and Q&A tasks. Bedrock’s multimodal capabilities can also be compared at each these stages by analyzing the document as is (classify_doc_with_bedrock.py, summarize_doc_with_bedrock.py, doc_qa_with_bedrock.py, bedrock_utils.py',
      ],
    },
    additionalPrerequisits: [
      'Access to Amazon Textract and Amazon Comprehend via the AWS CLI',
      'An Amazon S3 bucket with permissions to upload and list objects. This is required to upload your document. Please note the name of the bucket, you will need this.',
    ],
    extraSteps: [
      {
        instructions:
          'Now that the requirements have been successfully installed in your virtual environment we can begin configuring environment variables. You will first need to create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain your AWS profile, along with the name of your S3 bucket for uploaded documents, as shown below:',
        command: `
        profile_name=<AWS_CLI_PROFILE_NAME>
        save_folder=<YOUR_S3_BUCKET_NAME>`,
      },
      {
        instructions:
          'Since this repository is configured to leverage Claude 3.5 Sonnet, the prompt payload is structured in a different format compared to previous models and other model providers. If you wanted to leverage other Amazon Bedrock models you can change the Bedrock invocation function in each file, modifying the body parameters using this guide depending on the model ID.\nDepending on the region and model that you are planning to use Amazon Bedrock in, you may need to reconfigure each file that utilizes Bedrock set to the appropriate region. Each of these files are configured as shown below:',
        command: `
        client = boto3.client("bedrock-runtime", region_name="us-west-2")
        model_id = "anthropic.claude-3-5-sonnet-20240620-v1:0"`,
      },
    ],
    fileWalkthrough: {
      includeDefaults: true,
      files: [
        {
          name: 'pages/welcome.py',
          description:
            'The welcome page providing an overview of the Intelligent Document Processing (IDP) stages.',
        },
        {
          name: 'pages/upload_doc_to_s3.py',
          description:
            'The streamlit page that houses the logic to select a document or file to upload.',
        },
        {
          name: 'pages/extract_text_with_textract.py',
          description:
            'The streamlit page that houses the logic to invoke Textract to extract the raw text and key-value pairs from the document.',
        },
        {
          name: 'pages/enrich_doc_with_bedrock.py',
          description:
            'The streamlit page that houses the logic to read the key-value pair text file (output/key_value.txt) and invoke Bedrock to enrich the document by correcting any grammar mistakes or incorrect text extractions from the Textract job. The enriched result is saved as a local text file (output/enriched_output.txt).',
        },
        {
          name: 'pages/entity_recognition_with_comprehend.py',
          description:
            'The streamlit page that houses the logic to invoke Comprehend to perform entitiy recognition on the contents in the enriched output file (output/enriched_output.txt).',
        },
        {
          name: 'pages/classify_doc_with_bedrock.py',
          description:
            "The streamlit page that houses the logic to provide the user the option to classify the document from a select category of classes using either Bedrock's text or multimodal capabilities. A user can choose to have Bedrock read the enriched output file (output/enriched_output.txt) or read the file stored in S3 as an image to classify the document.",
        },
        {
          name: 'pages/summarize_doc_with_bedrock.py',
          description:
            "The streamlit page that houses the logic to provide the user the option to summarize the document using either Bedrock's text or multimodal capabilities. A user can choose to have Bedrock read the enriched output file (output/enriched_output.txt) or read the file stored in S3 as an image to summarize the document.",
        },
        {
          name: 'pages/doc_qa_with_bedrock.py',
          description:
            "The streamlit page that houses the logic to provide the user the option to ask questions about the document using either Bedrock's text or multimodal capabilities. A user can choose to have Bedrock read the enriched output file (output/enriched_output.txt) or read the file stored in S3 as an image to answer user queries regarding the document's contents.",
        },
        {
          name: 'idp/bedrock_utils.py',
          description:
            "The file containing the logic for document enrichment, classification, summarization, and question-answering by interacting with Amazon Bedrock. These interactions are performed by sending a structured prompt containing the relevant text or image data to the Bedrock model via API calls. The prompt includes instructions for the model, such as correcting grammar, classifying documents into predefined categories, or summarizing content, and the model's responses are parsed and returned as usable output.",
        },
        {
          name: 'idp/comprehend_utils.py',
          description:
            'The file containing the logic to invoke Amazon Comprehend, which will perform entity recognition using the default pre-trained model to detect entities such as names, dates, organizations, etc.',
        },
        {
          name: 'idp/s3_utils.py',
          description:
            'The file containing the logic to upload a file to S3 and list any current documents stored in the selected bucket.',
        },
        {
          name: 'idp/textract_utils.py',
          description:
            'The file containing the logic to start a Textract job that analyzes the document and extracts the raw text and key-value pairs from the document, saving both as local text files (extracted_text.txt and key_value.txt) to the "output" folder.',
        },
      ],
    },
  },
}));

pythonPocs.push(new StreamlitQuickStartPOC({
  parentProject: project,
  pocName: 'Amazon Bedrock Image Generation with Guardrails',
  pocPackageName: 'amazon-bedrock-image-guardrails-poc',
  pocDescription: 'This sample code demonstrates using Amazon Bedrock Guardrails to prevent Stability Diffusion LLM from generating harmful, obscene, or violent images. The application features a streamlit frontend where users input zero-shot requests to Claude 3. Amazon Bedrock Guardrails determine whether to proceed with generating images using the Stability Diffusion model.',
  readme: {
    pocGoal: {
      overview: `The goal of this repo is to provide users the ability to use Amazon Bedrock and generative AI to create images based on text input requests with security guardrails.
This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.`,
      architectureImage: true,
      flowSteps: [
        'The user inserts a text question into to the streamlit app. (app.py).',
        'The streamlit app, takes the text inserted by the user and is passed to Claude LLM with Guardrail id to check for prompt which is acceptable. If the prompt is detected as malicious or triggers the guardrail, a response (Blocked Messaging statement on Bedrock Guardrails) will be returned to the end user saying the request is blocked with a message "Inappropriate prompt!!" (image_generation_guardrails.py).',
        'If the prompt does not trigger the guardrail, it is passedto the model Stability diffusion model to generate images.',
      ],
    },
    additionalPrerequisits: [
      'Create an Amazon Bedrock Guardrail, information on how to do that can be found [here](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-create.html) ',
    ],
    fileWalkthrough: {
      includeDefaults: true,
      files: [{
        name: 'invoke_model_with_guardrails.py',
        description: 'the logic of the application, including the Amazon Bedrock Guardrail and Amazon Bedrock API invocations.',
      }],
    },
    extraSteps: [{
      instructions: 'create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:',
      command: `profile_name=<CLI_profile_name>
region_name=<REGION>
guardrail_identifier=<Guardrail_Identifier>
guardrail_version=<Guardrail_Version> (this is just a number i.e. 1,2,3 etc...)`,
    }],
  },
}));

const pythonPocReadmeDetails: Array<POCReadmeDetails> = [];
pythonPocs.sort((a, b) => a.pocProps.pocPackageName.localeCompare(b.pocProps.pocPackageName));
for (const poc of pythonPocs) {
  pythonPocReadmeDetails.push(poc.readmeDetails);
  poc.synth();
}


/** END OF PYTHON POCS */

/**
 * .NET POCs START
 */

const dotNetPOCs = new DotNetQuickStartPOCs();

dotNetPOCs.addPoc({
  pocName: 'Amazon Bedrock Converse API POC',
  pocDescription: 'This repository contains sample code demonstrating various use cases leveraging Amazon Bedrock and Generative AI using Amazon Bedrock SDK for .NET. Each sample is a separate page within a Visual Studio Solutions, and includes a basic Blazor frontend to help users quickly set up a proof of concept.',
  imagePath: 'genai-quickstart-pocs-dot-net/Genai.Quickstart.Pocs/Amazon.Bedrock.Converse.Api.Poc/images/Bedrock-Converse-dot-net.gif',
  architectureImage: true,
});

dotNetPOCs.addPoc({
  pocName: 'Amazon Bedrock Document Generator POC',
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to create content for documents.',
  imagePath: 'genai-quickstart-pocs-dot-net/Genai.Quickstart.Pocs/Amazon.Bedrock.Converse.Api.Poc/images/Bedrock-Converse-dot-net.gif',
  architectureImage: true,
});

dotNetPOCs.addPoc({
  pocName: 'Amazon Bedrock Guardrail POC',
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock Guardrails to help prevent prompt-injection attacks and prevent unintended responses from the LLM. The application is constructed with a simple ASP.NET Blazor frontend where users can input zero shot requests to Claude 3, with Amazon Bedrock Guardrails in place to prevent malicious prompts and responses.',
  imagePath: 'genai-quickstart-pocs-dot-net/Genai.Quickstart.Pocs/Amazon.Bedrock.Guardrail.Poc/images/bedrock-guardrail-poc.gif',
  architectureImage: true,
});

dotNetPOCs.addPoc({
  pocName: 'Amazon Bedrock Knowledgebases RAG POC',
  pocDescription: 'This repository contains sample code demonstrating various use cases leveraging Amazon Bedrock and Generative AI. Each sample is a separate project with its own directory, and includes a basic Streamlit frontend to help users quickly set up a proof of concept.',
  imagePath: 'genai-quickstart-pocs-dot-net/Genai.Quickstart.Pocs/Amazon.Bedrock.Knowledgebases.Rag.Poc/images/02-rag-with-kb.png',
  architectureImage: true,
});

dotNetPOCs.addPoc({
  pocName: 'Amazon Bedrock RAG Kendra POC',
  pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to implement a RAG based architecture with Amazon Kendra.using Amazon Bedrock SDK for .NET. The application is constructed with a simple blazor front-end where users can ask questions against documents stored in Amazon Kendra.',
  imagePath: 'genai-quickstart-pocs-dot-net/Genai.Quickstart.Pocs/Amazon.Bedrock.Rag.Kendra.Poc/images/demo.png',
  architectureImage: true,
});

/**
 * End .NET POCs
 */

new READMEComponent(project, 'RootREADME', pythonPocReadmeDetails, dotNetPOCs.dotNetPocs).synthesize();

project.synth();
