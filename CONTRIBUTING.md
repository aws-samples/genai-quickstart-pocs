# Contributing to GenAI QuickStart POCs

Thank you for your interest in contributing to GenAI QuickStart POCs! This repository contains proof-of-concept applications showcasing generative AI capabilities using various AWS services like Amazon Bedrock. Your contributions help expand the collection of examples and improve the quality of existing ones.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment Setup](#development-environment-setup)
- [Repository Structure](#repository-structure)
- [Contribution Workflow](#contribution-workflow)
  - [Creating Issues](#creating-issues)
  - [Pull Request Process](#pull-request-process)
- [Development Guidelines](#development-guidelines)
  - [Python POCs](#python-pocs)
  - [.NET POCs](#net-pocs)
- [Documentation Standards](#documentation-standards)
- [Security Guidelines](#security-guidelines)
- [Licensing](#licensing)
- [Communication Channels](#communication-channels)

## Code of Conduct

This project has adopted the [Amazon Open Source Code of Conduct](https://aws.github.io/code-of-conduct). By participating, you are expected to adhere to these guidelines. Please report unacceptable behavior to [opensource-codeofconduct@amazon.com](mailto:opensource-codeofconduct@amazon.com).

## Getting Started

1. **Fork the repository**: Start by forking the repository to your GitHub account.
2. **Clone your fork**: Clone your fork to your local development environment.
   ```bash
   git clone https://github.com/YOUR-USERNAME/genai-quickstart-pocs.git
   cd genai-quickstart-pocs
   ```
3. **Set up upstream**: Add the original repository as an upstream remote.
   ```bash
   git remote add upstream https://github.com/aws-samples/genai-quickstart-pocs.git
   ```
4. **Install dependencies**: Follow the development environment setup below.

## Development Environment Setup

### Prerequisites

- Python 3.9+
- .NET 6.0+ (for .NET POCs)
- AWS CLI configured with appropriate credentials
- Docker (optional, for containerized development)

### Initial Setup

Install project dependencies according to your POC's requirements:

```bash
# For Python projects
pip install -r requirements.txt

# For .NET projects
dotnet restore
```

## Repository Structure

The repository is organized into the following main directories:

- `genai-quickstart-pocs-python/`: Contains Python-based POCs
- `genai-quickstart-pocs-dot-net/`: Contains .NET-based POCs
- `agents-quickstart-pocs/`: Contains agent-based POCs

Each POC should be self-contained within its own directory and include:
- Source code
- README.md with setup and usage instructions
- Architecture diagram (in the `images/` subdirectory)
- Demo screenshots/GIFs (in the `images/` subdirectory)
- Requirements file (e.g., `requirements.txt` for Python)

## Contribution Workflow

### Creating Issues

Before starting work on a new feature or bug fix, please check if there is an existing issue. If not, create a new issue describing:

- For bug reports: What happened, what you expected to happen, steps to reproduce, environment details
- For feature requests: Clear description of the feature, rationale, and potential implementation approach

### Pull Request Process

1. **Create a branch**: Create a new branch from the `main` branch for your contribution.
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**: Implement your feature or bug fix, following the development guidelines below.

3. **Write tests**: Ensure your code is well tested.

4. **Run checks locally**: Make sure all tests and linting checks pass.
   ```bash
   # For Python POCs
   python -m pytest
   flake8 .
   
   # For .NET POCs
   dotnet test
   ```

5. **Update documentation**: Update relevant documentation, including the POC's README.md.

6. **Commit your changes**: Use clear and concise commit messages.
   ```bash
   git commit -am "Add feature: brief description of your changes"
   ```

7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Submit a pull request**: From your fork to the main repository's `main` branch.

9. **Code review**: Address any feedback from reviewers.

## Development Guidelines

### Python POCs

1. **Creating a new POC**:
   - Create a new directory under `genai-quickstart-pocs-python/` with a descriptive name
   - Follow the structure of existing POCs as a template
   - Ensure your POC follows AWS best practices

2. **POC Structure**:
   - `app.py`: Main entry point for the Streamlit application (frontend)
   - Separate backend logic files (e.g., `bedrock_processor.py`, `knowledge_base.py`, etc.) for AWS service integration
   - **Important**: Always separate frontend Streamlit code from backend business logic and AWS API calls
   - The backend modules should handle:
     - Amazon Bedrock API calls
     - Knowledge base integration
     - Data processing logic 
     - Authentication and configuration
   - `requirements.txt`: List of dependencies
   - `README.md`: Documentation for your POC
   - `HOWTO.md`: Step-by-step instructions for users
   - `images/`: Directory for architecture diagrams and demo assets
   - Additional Python modules for your specific logic

3. **Coding Standards**:
   - Follow PEP 8 style guide
   - Include docstrings for modules, classes, and functions
   - Use type hints where appropriate
   - Keep functions focused and modular

4. **Required Artifacts**:
   - `images/demo.gif`: A screen recording of the POC in action
   - `images/architecture.png`: AWS architecture diagram for the POC

### .NET POCs

1. **Creating a new POC**:
   - Create your POC in the `genai-quickstart-pocs-dot-net/` directory
   - Follow the structure of existing .NET POCs
   - Update the main README to include your new POC

2. **POC Structure**:
   - Follow standard .NET project structure
   - Include a detailed README.md
   - Provide architecture diagrams and demos in an `images/` directory

3. **Coding Standards**:
   - Follow Microsoft's C# coding conventions
   - Use meaningful names for variables, methods, and classes
   - Include XML documentation comments for public APIs
   - Implement appropriate error handling

## Documentation Standards

All POCs should include:

1. **README.md** with:
   - Clear title and concise description
   - Architecture diagram and explanation
   - Prerequisites and dependencies
   - Setup instructions
   - Usage examples
   - Screenshots or GIFs demonstrating the POC

2. **HOWTO.md** with step-by-step instructions for:
   - Setting up required AWS resources
   - Configuring the application
   - Running the application
   - Cleaning up resources

3. **Code documentation**:
   - Well-commented code
   - DocStrings for Python or XML documentation for .NET
   - Inline explanations for complex logic

## Security Guidelines

1. **Never commit credentials** or sensitive information to the repository.
2. Use AWS IAM best practices with least privilege principles.
3. If you discover a security vulnerability, please report it privately by following the [AWS vulnerability reporting process](http://aws.amazon.com/security/vulnerability-reporting/).
4. Do not create public GitHub issues for security concerns.

## Licensing

By contributing to this project, you agree that your contributions will be licensed under the project's [LICENSE](LICENSE) file. All contributed code must be original or clearly identified if licensed from another source.

## Communication Channels

For questions or discussions that don't fit into GitHub issues:
- Open a GitHub Discussion in the repository
- Contact the maintainers through contact information provided in the README

---

Thank you for contributing to GenAI QuickStart POCs! Your efforts help developers explore and implement generative AI solutions more effectively.
