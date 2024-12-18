# Amazon Bedrock Translation POC

## Overview of Solution

This is sample code demonstrating the use of Amazon Bedrock and Generative AI to translate text from a source to target language. Additionally, this demo also includes an Amazon Translate usecase.

![A gif of a screen recording show casing the Amazon Bedrock Translation POC functionality](images/demo.gif)


## Goal of this POC
The goal of this repository is to provide users with the ability to use Amazon Bedrock to perform translations. This repo comes with a basic frontend to help users stand up a proof of concept in just a few minutes.

The architecture & flow of the POC is as follows:
![POC Architecture & Flow](images/architecture.png 'POC Architecture')


When a user interacts with the POC, the flow is as follows:

1. Text:
            1. The user inputs text and selects the source and target language.
            2. The application constructs the appropriate prompt for translation and sends it to Amazon Bedrock.
            3. The appliction recieves and sends the translated text to Amazon Bedrock for analysis of accuracy and fluency.
            4. The translated text and analysis is displayed on the frontend application.

1. Chat:
            1. The user inputs text and selects the target language.
            2. The application constructs the appropriate prompt for translation and sends it to Amazon Bedrock.
            3. The translated response is displayed on the frontend application.

1. File:
            1. The user uploads a text file and selects the target language.
            2. The application constructs the appropriate prompt for translation and sends it to Amazon Bedrock.
            3. The translated text from the document is displayed on the frontend application.

1. PDF:
            1. The user uploads a PDF file and selects the source and target language.
            2. The application extracts the text from the PDF in small chunks chunks based on the text location.
            3. The application rapidly sends the chunks to Amazon Translate for translation. Because there is a high volume of small requests, Amazon Translate can more efficiently handle the requests.
            4. The application constructs a new PDF by redacting the original text and placing the translated text in the same location (with auto size scaling to handle different length than original text).
            5. The user can download the formatted, translated PDF.




# How to use this Repo:

## Prerequisites:

1. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed and configured with access to Amazon Bedrock.

1. [Python](https://www.python.org/downloads/) v3.11 or greater. The POC runs on python. 



## Steps
1. Clone the repository to your local machine.

    ```
    git clone https://github.com/aws-samples/genai-quickstart-pocs.git
    ```
    
    The file structure of this POC is broken into these files
    
    * `requirements.txt` - all the requirements needed to get the sample application up and running.
    * `app.py` - The streamlit frontend
    
    
    * `streamlit_pages/Text.py` - Frontend for Text Translate
    
    * `streamlit_pages/Chat.py` - Frontend for Chat Translate
    
    * `streamlit_pages/File.py` - Frontend for File Translate
    
    * `streamlit_pages/PDF.py` - Frontend for PDF Translate
    
    * `amazon_bedrock_translation/translate.py` - Logic required to invoke Amazon Bedrock and parse the response
    
    * `amazon_bedrock_translation/text_extractor.py` - Logic required to extract text from a file
    
    * `amazon_bedrock_translation/file_manager.py` - Logic required to manage file uploads and downloads
    
    * `amazon_translate_translation/pdf_translator.py` - Logic required to translate PDFs with Amazon Translate
    
    

1. Open the repository in your favorite code editor. In the terminal, navigate to the POC's folder:
    ```zsh
    cd genai-quickstart-pocs-python/amazon-bedrock-translation-poc
    ```

1. Configure the python virtual environment, activate it & install project dependencies. *Note: each POC has it's own dependencies & dependency management.*
    ```zsh
    python -m venv .env
    source .env/bin/activate
    pip install -r requirements.txt
    ```

1. Create a .env file in the root of this repo. Within the .env file you just created you will need to configure the .env to contain:

    ```zsh
    profile_name=<AWS_CLI_PROFILE_NAME>
    ```


1. Start the POC from your terminal
    ```zsh
    streamlit run app.py
    ```
This should start the POC and open a browser window to the application. 

## How-To Guide
For a details how-to guide for using this poc, visit [HOWTO.md](HOWTO.md)

