# Contributing Guidelines

Thank you for your interest in contributing to our project. Whether it's a bug report, new feature, correction, or additional
documentation, we greatly value feedback and contributions from our community.

Please read through this document before submitting any issues or pull requests to ensure we have all the necessary
information to effectively respond to your bug report or contribution.

## Reporting Bugs/Feature Requests

We welcome you to use the GitHub issue tracker to report bugs or suggest features.

When filing an issue, please check existing open, or recently closed, issues to make sure somebody else hasn't already
reported the issue. Please try to include as much information as you can. Details like these are incredibly useful:

- A reproducible test case or series of steps
- The version of our code being used
- Any modifications you've made relevant to the bug
- Anything unusual about your environment or deployment

## Contributing via Pull Requests

Contributions via pull requests are much appreciated. Before sending us a pull request, please ensure that:

1. You are working against the latest source on the _main_ branch.
2. You check existing open, and recently merged, pull requests to make sure someone else hasn't addressed the problem already.
3. You open an issue to discuss any significant work - we would hate for your time to be wasted.

To send us a pull request, please:

1. Fork the repository.
2. Modify the source; please focus on the specific change you are contributing. If you also reformat all the code, it will be hard for us to focus on your change.
3. Ensure local tests pass.
4. Commit to your fork using clear commit messages.
5. Send us a pull request, answering any default questions in the pull request interface.
6. Pay attention to any automated CI failures reported in the pull request, and stay involved in the conversation.

GitHub provides additional document on [forking a repository](https://help.github.com/articles/fork-a-repo/) and
[creating a pull request](https://help.github.com/articles/creating-a-pull-request/).

## Development Guidelines for Python & .NET POCs
The GenAI QuickStart POCs is managed using [Projen](https://projen.io/) to help ensure a consistent user experience and developer experience. By leveraging Projen, POCs are able to be created in a repeatable manner that ensures both functionliaty and documentation maintains consistency. To add a new POC, you will need to follow the guidance below.

### Adding a new Python POC
1. In the root of your project, run `npm install`
1. Navigate to `.projenrc.ts` in the root of the repo.
1. At the end of the Python POC definitons, create a new `StreamlitQuickStartPOC` definition that matches your POC needs.
    An example of a basic POC definiton:
    ```typescript
    dotNetPOCs.addPoc({
        pocName: 'Amazon Bedrock Document Generator POC',
        pocDescription: 'This is sample code demonstrating the use of Amazon Bedrock and Generative AI to create content for documents.',
        imagePath: 'genai-quickstart-pocs-dot-net/Genai.Quickstart.Pocs/Amazon.Bedrock.Converse.Api.Poc/images/Bedrock-Converse-dot-net.gif',
        architectureImage: true,
     });
    ```
1. Define additional README details within the declaration. See [streamlit-quickstart-poc.ts](projenrc/projects/streamlit-quickstart-poc.ts) and review `StreamlitQuickStartPOCProps` for details on all the property values you can provide.
1. Once you have completed your definiton, in your terminal, run 
    ```shell
    npx projen
    ```
    This will generate the base POC with the configurations you provided.
1. Complete your POC development in the generated POC folder, updating `app.py` and adding your custom logic modules.
1. Ensure the following files are created:
    * `images/demo.gif` - A gif with a screen recording of the POC.
    * `images/architecture.png` - a PNG image of the AWS Architecture used for the POC.
1. If you make any updates to the `.projenrc.ts` file, rerun:
    ```
    npx projen
    ```
   This will regenerate README files.

### Adding a new .NET POC
1. .NET POCs are less structured in how their are maintained and contributed to. Create the POC in the  `genai-quickstart-pocs-dot-net/`.
1. Once the POC is complete, Define .NET POC in the `.projenrc.ts`, which adds the .NET POC definition to the main README doc.
1. In your terminal, run
    ```
    npx projen
    ```
    This will regenerate the README and the new POC should be added.

## Finding contributions to work on

Looking at the existing issues is a great way to find something to contribute on. As our projects, by default, use the default GitHub issue labels (enhancement/bug/duplicate/help wanted/invalid/question/wontfix), looking at any 'help wanted' issues is a great place to start.

## Code of Conduct

This project has adopted the [Amazon Open Source Code of Conduct](https://aws.github.io/code-of-conduct).
For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq) or contact
opensource-codeofconduct@amazon.com with any additional questions or comments.

## Security issue notifications

If you discover a potential security issue in this project we ask that you notify AWS/Amazon Security via our [vulnerability reporting page](http://aws.amazon.com/security/vulnerability-reporting/). Please do **not** create a public github issue.

## Licensing

See the [LICENSE](LICENSE) file for our project's licensing. We will ask you to confirm the licensing of your contribution.
