# Intelligent Document Processing with AWS Bedrock Data Automation

This Streamlit application allows users to process documents using AWS Bedrock Data Automation. It supports various document types and integrates with different Bedrock models to extract and analyze data.

## Features

-   **Document Upload**: Upload documents (PDFs, images, etc.) to be processed.
-   **Model Selection**: Choose from a list of supported AWS Bedrock language models (LLMs) for document processing.
-   **Data Automation**: Utilize AWS Bedrock Data Automation to process documents and extract structured data.
-   **Asynchronous Processing**: Perform asynchronous processing of documents, allowing for non-blocking execution.
-   **Result Display**: View extracted data in various formats, including tables, trees, and raw JSON.
-   **Custom Output Configuration**: Option to get Custom output with blueprints.

## Setup Instructions

1.  **Prerequisites**:

    *   An AWS account with access to Bedrock Data Automation and S3.
    *   Python 3.6 or higher.
    *   Pip package manager.

2.  **Install Dependencies**:

    Clone the repository and install the required Python packages:

    ```
    pip install streamlit pillow boto3 PyPDF2 pdf2image pandas urllib3
    ```

3.  **AWS Credentials**:

    Configure your AWS credentials using one of the following methods:

    *   **IAM Role**: Assign an IAM role with appropriate permissions to the EC2 instance or Lambda function running the application.
    *   **AWS CLI**: Configure the AWS CLI with your credentials using `aws configure`.
    *   **Environment Variables**: Set the `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_REGION` environment variables.

4.  **S3 Bucket**:

    Create an S3 bucket to store uploaded documents and processing results. Update the `S3_BUCKET` variable in the script with your bucket name.

5.  **Bedrock Execution Role**:

    Specify the ARN of the IAM role that Bedrock will use to access your S3 buckets. Update the `get_bedrock_execution_role_arn()` function with your actual role ARN.

6.  **Run the Application**:

    ```
    streamlit run your_script_name.py
    ```

    Replace `your_script_name.py` with the name of your Python script.

## Global Variables

*   `S3_BUCKET`: S3 bucket name for storing files.
*   `BEDROCK_REGION`: AWS region for Bedrock.
*   `supported_listo_of_models`: List of supported Bedrock models.
*   `standard_output_config`: Configuration for standard output from Bedrock Data Automation.

## Function Details

### Core Functions

#### 1. `reset_application()`

*   **Description**: Resets all session state variables to their initial values, effectively clearing the application's state.
*   **Parameters**: None
*   **Returns**: None (re-runs the Streamlit app)

#### 2. `upload_to_s3(file, bucket, key)`

*   **Description**: Uploads a file-like object to an S3 bucket.
*   **Parameters**:
    *   `file` (file-like object): The file to upload.
    *   `bucket` (str): The name of the S3 bucket.
    *   `key` (str): The key (path) under which to store the file in S3.
*   **Returns**:
    *   `True` (bool): If the upload was successful.
    *   `False` (bool): If an error occurred during the upload.

#### 3. `list_available_llms()`

*   **Description**: Lists the available language models (LLMs) in AWS Bedrock.
*   **Parameters**: None
*   **Returns**:
    *   `list` of `str`: A list of model IDs.
    *   `[]`: If an error occurred.

#### 4. `display_file_preview(file, file_type)`

*   **Description**: Displays a preview of the uploaded file in the Streamlit app.
*   **Parameters**:
    *   `file` (file-like object): The uploaded file.
    *   `file_type` (str): The MIME type of the file (e.g., "application/pdf", "image/jpeg").
*   **Returns**: None (displays the preview in Streamlit)

#### 5. `parse_s3_uri(s3_uri)`

*   **Description**: Parses an S3 URI to extract the bucket name and key.
*   **Parameters**:
    *   `s3_uri` (str): The S3 URI (e.g., "s3://bucket-name/path/to/file").
*   **Returns**:
    *   `tuple` of (`str`, `str`): The bucket name and key.
*   **Raises**:
    *   `ValueError`: If the URI is not a valid S3 URI.

#### 6. `get_s3_json_content(s3_uri)`

*   **Description**: Retrieves and parses a JSON file from S3.
*   **Parameters**:
    *   `s3_uri` (str): The S3 URI of the JSON file.
*   **Returns**:
    *   `dict` or `list`: The parsed JSON data.
    *   `None`: If an error occurred.

#### 7. `display_data_section(data, title)`

*   **Description**: Displays a section of data in the Streamlit app using different viewing options (Table View, Tree View, Raw JSON).
*   **Parameters**:
    *   `data` (dict or list): The data to display.
    *   `title` (str): The title of the data section.
*   **Returns**: None (displays the data in Streamlit)

#### 8. `process_job_metadata(metadata_uri)`

*   **Description**: Processes job metadata from an S3 URI and displays it in the Streamlit app.
*   **Parameters**:
    *   `metadata_uri` (str): The S3 URI of the job metadata JSON file.
*   **Returns**: None (displays job metadata and results in Streamlit)

#### 9. `create_data_automation_project(project_name=None, blueprint_arn_list=None)`

*   **Description**: Creates a Bedrock Data Automation project.
*   **Parameters**:
    *   `project_name` (str, optional): The name of the project. If None, a unique name is generated.
    *   `blueprint_arn_list` (list, optional): List of blueprint ARNs for custom output.
*   **Returns**:
    *   `str`: The ARN of the created project.
    *   `None`: If an error occurred.

#### 10. `get_bedrock_execution_role_arn()`

*   **Description**: Returns the ARN of the IAM role that Bedrock will use for execution.
*   **Parameters**: None
*   **Returns**:
    *   `str`: The ARN of the IAM role.
*   **Note**: **Important**: Replace the placeholder ARN with your actual role ARN.

#### 11. `start_processing_job(project_arn, output_type, custom_blueprint=None)`

*   **Description**: Starts a processing job within an existing Data Automation project.
*   **Parameters**:
    *   `project_arn` (str): The ARN of the Data Automation project.
    *   `output_type` (str): The type of output to generate (e.g., "STANDARD").
    *   `custom_blueprint` (str, optional): The ARN of a custom blueprint to use.
*   **Returns**:
    *   `str`: The ID of the started job.
    *   `None`: If an error occurred.

#### 12. `invoke_data_automation_async(project_arn, input_config, output_config)`

*   **Description**: Invokes a Bedrock Data Automation job asynchronously.
*   **Parameters**:
    *   `project_arn` (str): The ARN of the Data Automation project.
    *   `input_config` (dict): Configuration for the input data.
    *   `output_config` (dict): Configuration for the output data.
*   **Returns**:
    *   `str`: The ARN of the invocation.
    *   `None`: If an error occurred.

#### 13. `get_data_automation_status(invocation_arn, job_id)`

*   **Description**: Checks the status of a Bedrock Data Automation job.
*   **Parameters**:
    *   `invocation_arn` (str): The ARN of the invocation.
    *   `job_id` (str): The ID of the job.
*   **Returns**:
    *   `tuple` of (`str`, `str`): The status of the job and a status message.

#### 14. `wait_for_job_to_complete(invocationArn)`

*   **Description**: Waits for a BDA Invocation Async Job to complete.
*   **Parameters**:
    *   `invocationArn` (str): The ARN of the invocation.
*   **Returns**:
    *   `tuple` of (`str`, `str`): The status of the job and a status message.

#### 15. `monitor_data_automation_job(invocation_arn, job_id)`

*   **Description**: Monitors the job status until completion.
*   **Parameters**:
    *   `invocation_arn` (str): The ARN of the invocation.
    *   `job_id` (str): The ID of the job.
*   **Returns**:
    *   `tuple` of (`str`, `str`, `dict`): The status of the job, a status message, and the get_status_response.

#### 16. `get_data_automation_results(project_arn, job_id)`

*   **Description**: Retrieves the results of a completed Data Automation job.
*   **Parameters**:
    *   `project_arn` (str): The ARN of the Data Automation project.
    *   `job_id` (str): The ID of the job.
*   **Returns**:
    *   `dict`: The results of the job.
    *   `None`: If an error occurred.

#### 17. `parse_s3_uri(s3_uri)`

*   **Description**: Extracts bucket and key from s3:// URI.
*   **Parameters**:
    *   `s3_uri` (str): The S3 URI.
*   **Returns**:
    *   `tuple` of (`str`, `str`): The bucket and key.

#### 18. `extract_structured_context(document_data)`

*   **Description**: Extracts structured context from document data.
*   **Parameters**:
    *   `document_data` (dict): The document data.
*   **Returns**:
    *   `list`: The list of structured data.

#### 19. `query_llm(messages, model_id)`

*   **Description**: Queries a language model with a list of messages.
*   **Parameters**:
    *   `messages` (list): The list of messages.
    *   `model_id` (str): The ID of the language model.
*   **Returns**:
    *   `str`: The content of the response.

### UI Functions

*   **(Several UI functions)**: Implement the Streamlit user interface.

## Usage

1.  Upload a document using the file uploader.
2.  Select a language model from the dropdown menu.
3.  Click the "Process Document" button to start the processing job.
4.  Monitor the job status using the progress bar and status messages.
5.  View the extracted data in the Table View, Tree View, or Raw JSON tabs.



# Intelligent Document Processing with Amazon Bedrock

## Overview

This Python script, built with Streamlit, implements an Intelligent Document Processing (IDP) application powered by Amazon Bedrock. It allows users to upload documents (PDF, DOCX, TXT, CSV) or images (PNG, JPEG, etc.), define fields to extract, and then uses Amazon Bedrock to extract structured data from the content based on a dynamically generated Pydantic model and schema description.

## Functionality

*   **File Upload**: Supports uploading various file types, including PDF, DOCX, TXT, PNG, JPEG, GIF, and WEBP.
*   **File Preview**: Displays a preview of the uploaded file, adapting to the file type (PDF, image, DOCX, TXT, CSV).
*   **Dynamic Field Definition**: Allows users to define fields to extract, specifying the field name, data type (string, integer, float, boolean), and an optional description.
*   **Pydantic Model Generation**: Generates a Pydantic model dynamically based on the user-defined fields.
*   **Schema Description Generation**: Creates a schema description from the Pydantic model for use with the LLM.
*   **Data Extraction with Bedrock**: Uses Amazon Bedrock to extract data from the uploaded content based on the generated schema.
*   **Data Display**: Displays the extracted data in both JSON and table formats, with validation against the defined schema.

## Functions

### 1. `show_pdf_preview(uploaded_file)`

Displays a preview of a PDF file.

*   **Parameters**:
    *   `uploaded_file`: The uploaded PDF file.
*   **Functionality**:
    *   Reads the PDF file.
    *   Encodes the PDF content to base64.
    *   Embeds the base64 encoded PDF into an HTML iframe for display.

### 2. `show_image_preview(uploaded_file)`

Displays a preview of an image file.

*   **Parameters**:
    *   `uploaded_file`: The uploaded image file.
*   **Functionality**:
    *   Displays the image using `st.image`, automatically handling various image formats.

### 3. `show_docx_preview(uploaded_file)`

Displays a preview of a DOCX file as formatted text with basic styling.

*   **Parameters**:
    *   `uploaded_file`: The uploaded DOCX file.
*   **Functionality**:
    *   Opens the DOCX file using `docx.Document`.
    *   Iterates through paragraphs, applying basic styling (e.g., bold for headings).
    *   Renders the styled content using `st.markdown`.

### 4. `show_txt_preview(uploaded_file)`

Displays a preview of a text file.

*   **Parameters**:
    *   `uploaded_file`: The uploaded text file.
*   **Functionality**:
    *   Reads the content of the text file.
    *   Displays the first 5000 characters in a code block using `st.markdown`.

### 5. `show_csv_preview(uploaded_file)`

Displays an enhanced preview of a CSV file.

*   **Parameters**:
    *   `uploaded_file`: The uploaded CSV file.
*   **Functionality**:
    *   Reads the CSV file into a Pandas DataFrame.
    *   Displays a specified number of rows using `st.dataframe`.
    *   Shows file information, such as the number of rows and columns.

### 6. `process_file_content(uploaded_file)`

Processes the content of an uploaded file based on its type.

*   **Parameters**:
    *   `uploaded_file`: The uploaded file.
*   **Returns**:
    *   A dictionary containing the processed content, suitable for Bedrock.
*   **Functionality**:
    *   Determines the file type based on the file extension.
    *   Extracts text from PDF, DOCX, and TXT files.
    *   Reads image files and converts them to base64.
    *   Reads CSV files and returns both the text content and a Pandas DataFrame.

### 7. `process_and_preview_file(uploaded_file)`

Processes the uploaded file and shows an appropriate preview.

*   **Parameters**:
    *   `uploaded_file`: The uploaded file.
*   **Returns**:
    *   The processed file content from `process_file_content`.
*   **Functionality**:
    *   Determines the file type.
    *   Displays a preview using the appropriate `show_*_preview` function.
    *   Returns the processed file content.

### 8. `generate_pydantic_model(field_definitions: List[Dict]) -> BaseModel`

Generates a Pydantic model from user-defined fields.

*   **Parameters**:
    *   `field_definitions`: A list of dictionaries, where each dictionary defines a field with a name, type, and description.
*   **Returns**:
    *   A dynamically created Pydantic model.
*   **Functionality**:
    *   Iterates through the field definitions.
    *   Maps the defined types (string, integer, float, boolean) to Python types.
    *   Creates a Pydantic model with optional fields based on the provided definitions.

### 9. `generate_schema_description(model: BaseModel) -> str`

Generates a description of the schema for the LLM.

*   **Parameters**:
    *   `model`: The Pydantic model.
*   **Returns**:
    *   A string describing the schema in JSON format, along with instructions for the LLM.
*   **Functionality**:
    *   Converts the Pydantic model to a JSON schema.
    *   Adds instructions for the LLM, such as returning only JSON that validates against the schema and using null for missing fields.

### 10. `extract_data_with_bedrock(file_content: Dict, schema_description: str, uploaded_file) -> Dict`

Uses Bedrock to extract data from both text and images.

*   **Parameters**:
    *   `file_content`: The content of the uploaded file.
    *   `schema_description`: The schema description for the LLM.
    *   `uploaded_file`: The uploaded file.
*   **Returns**:
    *   A dictionary containing the extracted data.
*   **Functionality**:
    *   Constructs a prompt for Bedrock, including the schema description and file content.
    *   Invokes the Bedrock API to extract the data.
    *   Parses the JSON output from Bedrock and returns it.

### 11. `display_extracted_data(extracted_data: Union[Dict, List[Dict]], model: BaseModel)`

Displays the extracted data in both JSON and table formats.

*   **Parameters**:
    *   `extracted_data`: The extracted data, which can be a dictionary or a list of dictionaries.
    *   `model`: The Pydantic model used for extraction.
*   **Functionality**:
    *   Displays the extracted data in a JSON format.
    *   Normalizes the data into a list of dictionaries.
    *   Formats the data for display in a Pandas DataFrame.
    *   Validates the extracted data against the Pydantic model.

### 12. `main()`

The main function that orchestrates the Streamlit application.

*   **Functionality**:
    *   Sets up the Streamlit app layout.
    *   Handles file uploads and previews.
    *   Allows users to define fields to extract.
    *   Generates a Pydantic model and schema description.
    *   Calls Bedrock to extract data.
    *   Displays the extracted data.

## Utility Functions (from `utils.utils_streamlitApp`)

The script imports a module named `utils.utils_streamlitApp`. The contents of this module are not provided, so I can only list them based on their usage in the main script.

*   `display_banner()`: Displays a banner image at the top of the application.
*   `contact_sidebar()`: Creates a contact information section in the sidebar.

## Dependencies

*   streamlit
*   pandas
*   pydantic
*   typing
*   json
*   boto3
*   io
*   base64
*   PyPDF2
*   docx
*   PIL (Pillow)
*   csv
*   utils.utils\_streamlitApp (custom module)

## Setup and Usage

1.  **Install Dependencies**:

    ```
    pip install streamlit pandas pydantic boto3 PyPDF2 python-docx Pillow
    ```
2.  **Configure AWS Credentials**:

    *   Ensure you have configured your AWS credentials to allow access to Amazon Bedrock.
    *   You can configure your credentials using the AWS CLI or by setting environment variables.
3.  **Run the Script**:

    ```
    streamlit run your_script_name.py
    ```

    Replace `your_script_name.py` with the actual name of the Python file.
4.  **Use the Application**:

    *   Upload a document or image.
    *   Define the fields you want to extract, specifying the name, type, and description for each field.
    *   Click the "Extract Data" button to extract the data using Amazon Bedrock.
    *   View the extracted data in JSON and table formats.
