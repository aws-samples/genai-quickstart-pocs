# GenAI Quick Start PoCs

This repository contains sample code demonstrating various use cases leveraging Amazon Bedrock and Generative AI using Amazon Bedrock SDK for .NET. Each sample is a separate page within a Visual Studio Solutions, and includes a basic Blazor frontend to help users quickly set up a proof of concept.

##### Authors: Pratip Bagchi

1. **Amazon-Bedrock-Converse-API-POC:**   
   This is sample code demonstrating the use of the Amazon Bedrock Converse API to create conversational applications that send and receive messages to and from an Amazon Bedrock model   

    ![Alt text](images/Bedrock-Converse-dot-net.gif "Amazon Bedrock Converse API")

# **Goal of this Repo:**

The goal of this repo is to provide users the ability to use Converse API that provides a consistent interface that works with all models that support messages. This allows you to write code once and use it with different models. Should a model have unique inference parameters, you can also pass those unique parameters to the model.

To know more about converse API please visit this [AWS Documentation](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_Converse.html)

When a user interacts with the GenAI app, the flow is as follows:

1. The user makes a request to the GenAI app (Chat.razor).
2. The user can use their own questions or any predefined questions from the example (Examples.razor)
3. The user can select the model from the dropdown to start interacting with the chat interface (Chat.razor)
4. The app issues a ConverseRequest to the Amazon Bedrock based on the user request. (Chat.razor)
5. The app responses back to the user based on the responses from the selected model (Answer.razor)
5. The user can now change the model and ask the same or different question without changing any codes (Chat.razor)


# How to use this Repo:

## Prerequisites

- Amazon Bedrock Access and CLI Credentials (Please ensure your AWS CLI Profile has access to Amazon Bedrock!)
- .NET 8.0
- Visual Studio installed on your machine
- Additional prerequisites specific to each sample (e.g., RDS Database, Amazon Kendra index, etc.)
- Configure the necessary environment variables (e.g., AWS credentials, database connections, etc.).
- Access to models to interact with. Please follow this [AWS Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html) to get access to the model.
- Run Blazor app

## Step 1:

The first step of utilizing this repo is performing a git clone of the repository and navigate to genai-quickstart-pocs-dot-net\Genai.Quickstart.Pocs\Amazon.Bedrock.Converse.Api.Poc folder. Please open the Amazon.Bedrock.Converse.Api.sln file to get started. 
You will be using "Amazon.Bedrock.Converse.Api.Poc.csproj" project for this POC. 

```
git clone https://github.com/aws-samples/genai-quickstart-pocs.git
```

## Step 2:

Now that we have successfully cloned the repo, opened the Visual Studio Solutions and installed the necessary dependencies, it is time for us to create Amazon Bedrock Knowledge base.


## Step 3

1. Build the Amazon.Bedrock.Converse.Api.sln solution
3. Run the project by clicking the "Run witout Debugging button"


## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.