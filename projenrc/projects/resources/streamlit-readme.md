# {{ pocTitle }}

## Overview of Solution

{{ pocOverview }}

![A gif of a screen recording show casing the {{ pocTitle }} functionality](images/demo.gif)

{% if pocGoal %}
## Goal of this POC
{{pocGoal.overview}}
{% if pocGoal.architectureImage %}
The architecture & flow of the POC is as follows:
![POC Architecture & Flow](images/architecture.png 'POC Architecture')
{% endif %}
{% if pocGoal.flowSteps %}
When a user interacts with the POC, the flow is as follows:
{% for step in pocGoal.flowSteps %}
1. {{step}}
{% endfor %}
{% endif %}
{% endif %}

# How to use this Repo:

## Prerequisites:

1. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed and configured with access to Amazon Bedrock.

1. [Python](https://www.python.org/downloads/) v3.11 or greater. The POC runs on python. 

{% for prereq in additionalPrerequisits %}
1. {{prereq | safe}}
{% endfor %}

## Steps
1. Clone the repository to your local machine.

    ```
    git clone https://github.com/aws-samples/genai-quickstart-pocs.git
    ```
    {% if fileWalkthrough %}
    The file structure of this POC is broken into these files
    {% if fileWalkthrough != false %}
    * `requirements.txt` - all the requirements needed to get the sample application up and running.
    * `app.py` - The streamlit frontend
    {% endif %}
    {% for pocFile in fileWalkthrough.files %}
    * `{{pocFile.name}}` - {{pocFile.description}}
    {% endfor %}
    {% endif %}

1. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```zsh
    cd {{pocPath}}
    ```

1. Configure the python virtual environment, activate it & install project dependencies. *Note: each POC has it's own dependencies & dependency management.*
    ```zsh
    python -m venv .env
    source .env/bin/activate
    pip install -r requirements.txt
    ```
{% for step in extraSteps %}
1. {{ step.instructions }}
{% if step.command %}
    ```zsh
    {{ step.command | safe }}
    ```
{% endif %}
{% endfor %}
1. Start the POC from your terminal
    ```zsh
    streamlit run app.py
    ```
This should start the POC and open a browser window to the application. 

## How-To Guide
For a details how-to guide for using this poc, visit [HOWTO.md](HOWTO.md)