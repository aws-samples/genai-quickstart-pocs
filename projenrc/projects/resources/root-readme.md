# GenAI Quick Start PoCs

This repository contains sample code demonstrating various use cases leveraging Amazon Bedrock and Generative AI. Each sample is a separate project with its own directory, and includes a basic Streamlit frontend to help users quickly set up a proof of concept.

##### Authors: Brian Maguire, Dom Bavaro, Ryan Doty, Sudeesh Sasidharan, Tarik Makota, Addie Rudy

## Sample Proof of Concepts - Python

{% if pocs.pythonPocs %}
{% for pythonPoc in pocs.pythonPocs %}
1. **{{ pythonPoc.pocName }}**
    {{pythonPoc.pocDescription}}
    {% if pythonPoc.architectureImage %}
    ![Screen Recording of {{pythonPoc.pocName}}]({{pythonPoc.imagePath}})
    {% endif %}
{% endfor %}
{% endif %}

## Sample Proof of Concepts - .NET

{% if pocs.dotNetPocs %}
{% for dotNetPocs in pocs.dotNetPocs %}
1. **{{ dotNetPocs.pocName }}**
    {{dotNetPocs.pocDescription}}
    {% if dotNetPocs.architectureImage %}
    ![Screen Recording of {{dotNetPocs.pocName}}]({{dotNetPocs.imagePath}})
    {% endif %}
{% endfor %}
{% endif %}


## Prerequisites - Python

- Amazon Bedrock Access and CLI Credentials
- Python 3.10 installed on your machine
- Additional prerequisites specific to each sample (e.g., RDS Database, Amazon Kendra index, etc.)

## Prerequisites - .NET

- Amazon Bedrock Access and CLI Credentials (Please ensure your AWS CLI Profile has access to Amazon Bedrock!)
- .NET 8.0
- Visual Studio installed on your machine
- Additional prerequisites specific to each sample (e.g., RDS Database, Amazon Kendra index, etc.)
- Configure the necessary environment variables (e.g., AWS credentials, database connections, etc.).
- Access to Claude 3 haiku model. Please follow this [AWS Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html) to get access to the model.
- Run Blazor app

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
