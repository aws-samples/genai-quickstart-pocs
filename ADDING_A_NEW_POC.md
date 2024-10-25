# Adding a new POC to the GenAI-QuickStart-POCs repo.

The following guidance is applicable to **python** POCs only. If you are developing a .NET POC, development is via Visual Studio. For .NET, please follow design patterns currently present in `genai-quickstart-pocs-dot-net/Genai.Quickstart.Pocs`.

## Using Projen to manage Python Projects.

As the GenAI-QuickStart POCs repo has grown, the maintainers group has decided to introduce **Projen** to define a project structure for POCS and allow new POCs to be added programmatically, ensuring consistent developer & user expierences, consistent documentation & ease of long-term manangement of the repository.

To learn more about Projen, visit [https://projen.io/docs/introduction/](https://projen.io/docs/introduction/)

## Synthesizing the base POC

- Navigate to `.projenrc.ts` in the root of the repository. This file contains the definitons of all python projects.
- Following the pattern of existing repositories, define the new streamlit POC. The definion allows for details to be provided that will be added to the README template. This includes details such as additional prerequisites, POC goal, file walkthrough, extra steps the user needs to follow to run the POC, and more.
  A new POC at it's most basic would look like this:
  ``typescript
    new StreamlitQuickStartPOC({
    parentProject: project,
    pocName: 'Amazon Bedrock Video Chapter Creator POC',
    pocPackageName: 'amazon-bedrock-video-chapter-creator-poc',
    additionalDeps: ['langchain@^0.1', 'pandas', 'opensearch-py', 'thefuzz'],
    pocDescription: 'This is sample code demonstrating the use of Amazon Transcribe, Amazon OpenSearch Serverless, Amazon Bedrock and Generative AI, to a implement video chapter generator and video search sample. The application is constructed with a simple streamlit frontend where users can upload a video that will be stored, transcribed and have searchable chapters generated. Additionally, if you have videos already uploaded to S3 and have subtitles for the video already created in `.srt` format, you can skip transcribing and jump straight into generating chapters.\n\nThe sample also includes a second UI that allows the user to ask about a topic. This will search the video chapters from the videos you\'ve provided and provide a video, set to a specific chapter, that was the closest match to the inquiry.',
    });
    ``
  This is a basic definition. To add more information to the `README` file, add the `readme` property as defined in `StreamlitQuickStartPOCProps` in `projenrc/projects/streamlit-quickstart-poc.ts`.

- Once you've defined the POC, open your terminal. Navigate the terminal so the directory is the root of this repository. Execute the following command:
  ```shell
  npx projen
  ```
  If prompted to install `projen` proceed to install it.
- After the command execution completes, you will see a new folder and contents added to `genai-quickstart-pocs-python`. Open this folder to see the base POC added. The POC is now ready to be developed.

## Developing the POC

Generally speaking, developing the POC should be no different with or without projen.
The following are the exceptions you should note:

- **If you need to add python dependencies**: `projen` is responsible for managing the python dependencies and generates the `requirements.txt` file. Do not modify the `requirements.txt`. To add dependencies, locate the POC in the `.projenrc.ts` file and add `additionalDeps`, which is a string array. You can just add the dependency as a string to the array or you can additionally include the version number, like `langchain@^0.2`. After you've updated the dependencies, re-run `npx projen` to refresh dependencies. Return your terminal to the POC directory and follow the README guidance for installing the dependencies.

- Developing the README file: `projen` automates the creation of the `README` file. If you want to add details to the README, it is recommend to define them in the `.projenrc.ts` file. This allows projen to keep README files consistent. That being said, once a README file is generated in a POC, it will NOT be overwritten by `projen`. If you add more details to `.projenrc.ts`, you can delete the README in the POC directory to have it regenerated on the next `npx projen`.

- README walkthrough GIF & architecture image:
