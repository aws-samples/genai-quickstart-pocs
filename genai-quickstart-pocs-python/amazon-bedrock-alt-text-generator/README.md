# PDF Image Alt Text Generator

## Overview of Solution

The PDF Image Alt Text Generator is a solution designed to extract, analyze, and generate alternative text for images within PDF documents. This solution leverages AWS services and various Python libraries to provide a high-performance and scalable way to enhance PDF accessibility.

![Alt text](images/demo.gif)


# How to use this Repo:

## Prerequisites:

1. Amazon Bedrock Access and CLI Credentials. Ensure the AWS credentials have access to execute Amazon Bedrock Model Evaluation. 
2. Ensure Python 3.11 installed on your machine, it is the most stable version of Python for the packages we will be using, it can be downloaded [here](https://www.python.org/downloads/release/python-3911/).

## Step 1:

The first step of utilizing this repo is performing a git clone of the repository.

```
git clone https://github.com/aws-samples/genai-quickstart-pocs.git
```
After cloning the repo onto your local machine, open the repo in your favorite code editor. Navigate to this POC folder within the repo. 

The POC consists of two files: 
* `app.py` is the frontend application that is run using streamlit
* `pdf_image_alt_text_generator/generator.py` is the logic that extracts the data from PDF and calls the Bedrock Model for inference
* `pdf_image_alt_text_generator/download_results.py` generates a PDF with all images and their alt text results, as well as input/output token usage, calculated in a table.

## Step 2:

Set up a python virtual environment in the directory of the POC and ensure that you are using Python 3.11. This can be done by running the following commands: (make sure you've set your working directory in terminal to the POC directory)

```zsh
pip install virtualenv
python3.11 -m venv venv
```
The virtual environment will be extremely useful when you begin installing the requirements. If you need more clarification on the creation of the virtual environment please refer to this [blog](https://www.freecodecamp.org/news/how-to-setup-virtual-environments-in-python/).
After the virtual environment is created, ensure that it is activated, following the activation steps of the virtual environment tool you are using. Likely:
```zsh
source venv/bin/activate
```

After your virtual environment has been created and activated, you can install all the requirements found in the requirements.txt file by running this command in the root of this repos directory in your terminal:

```zsh
pip install -r requirements.txt
```

## Step 4:
Your machine should now be configured to run the POC. To start the POC, execute the following from the command line (from the POC directory, with the virtual environment activated):

```zsh
streamlit run app.py
```
This should start the POC and open a browser window to the application. Follow the instructions in the application to generate prompt data.