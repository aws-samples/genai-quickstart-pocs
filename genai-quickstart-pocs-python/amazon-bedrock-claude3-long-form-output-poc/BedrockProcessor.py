import boto3  # AWS SDK for Python
import botocore  # Low-level client for AWS services
import json  # For working with JSON data
import time  # For adding delays
from io import StringIO  # For working with text streams
from pypdf import PdfReader  # For reading PDF files
from typing import Optional, Tuple, List, Any  # For type hints

class BedrockProcessor:
    def __init__(self, system_prompt_template: str, prompt_template: str, iterations: Optional[int]=10) -> None:
        # Set up the AWS client configuration
        self.config = botocore.config.Config(connect_timeout=500, read_timeout=500)
        self.bedrock_runtime = boto3.client('bedrock-runtime' , 'us-east-1', config = self.config)

        # Set up the model parameters
        self.max_tokens = 50000  # Maximum number of tokens to generate
        self.temperature = 0.2  # Controls the randomness of the output
        self.top_p = 0.5  # Controls the nucleus sampling
        self.model_id = 'anthropic.claude-3-sonnet-20240229-v1:0'  # The model ID
        self.anthropic_version = 'bedrock-2023-05-31'  # The Anthropic version

        # Initialize other variables
        self.chat_history = "Hello, I am an AI~"  # Initial chat history
        self.user_input = None  # User input
        self.prompt_template = prompt_template  # Prompt template
        self.prompt = None  # Prompt to be sent to the model
        self.system_prompt = system_prompt_template  # System prompt
        self.iterations = int(iterations)  # Number of iterations
        self.document = None  # Document to be processed
        self.retries = 0  # Number of retries
        self.output_tokens = []  # List to store output token counts
        self.invocation_latency = 0  # Total invocation latency
        self.document_type = None  # Type of document (text or PDF)
        self.stop_reasons = []  # List to store stop reasons
        self.sleep_time = 2  # Initial sleep time (in seconds)

    # Change the system prompt and/or prompt template
    def change_prompt_template(self, system_prompt_template: Optional[str] = None, prompt_template: Optional[str] = None) -> None:
        self.system_prompt = system_prompt_template if system_prompt_template is not None else self.system_prompt
        self.prompt_template = prompt_template if prompt_template is not None else self.prompt_template

    # Build the prompt based on the document type and user input
    def build_prompt(self) -> None:
        # Set the right prompt template
        if self.document_type is not None:
            self.prompt_template = self.prompt_template.format(document=self.document, user_input=self.user_input)
        else:
            self.prompt_template = self.prompt_template.format(user_input=self.user_input, retries=self.retries)

        # Create the prompt dictionary
        prompt = {
            "anthropic_version": self.anthropic_version,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "top_p": self.top_p,
            "system": self.system_prompt,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": self.prompt_template
                        }
                    ]
                },
                {
                    "role": "assistant",
                    "content": [
                        {
                            "type": "text",
                            "text": f"{self.chat_history}"
                        }
                    ]
                }
            ]
        }

        # Convert the prompt dictionary to JSON
        self.prompt = json.dumps(prompt)

    #  Handle LLM Invoke
    def process_invoke(self) -> Tuple[str, int, float]:
        try:
            # Invoke the Bedrock model
            response = self.bedrock_runtime.invoke_model(
                body=self.prompt,
                modelId=self.model_id,
                accept="application/json",
                contentType="application/json"
            )
            
            # Process the response
            response_body = json.loads(response.get('body').read())
            output_tokens = int(response['ResponseMetadata']['HTTPHeaders']['x-amzn-bedrock-output-token-count']) if response is not None else 0
            invocation_latency = round(float(response['ResponseMetadata']['HTTPHeaders']['x-amzn-bedrock-invocation-latency']), 4) if response is not None else 0.0
            answer = response_body.get('content')[0]['text']
            self.stop_reasons.append(response_body.get('stop_reason'))
        except:
            # Handle exceptions
            print("Invocation Error")
            answer = "Invocation Error"
        else:
            # Print success message
            print("Invocation completed successfully")
        
        return answer, output_tokens, invocation_latency
    
    #  Generate the long form output
    def process_long_form_output(self) -> None:
        # Initialize the chat history
        chat_history = [self.chat_history]

        # Iterate over the specified number of iterations
        for retries in range(self.iterations):
            self.retries = retries
            print(f"Iteration: {self.retries}")  # Print the current iteration

            # Build the prompt and invoke the model
            self.build_prompt()
            answer, output_tokens, invocation_latency = self.process_invoke()

            # Store the output token count and update the invocation latency
            self.output_tokens.append((self.retries, int(output_tokens)))
            self.invocation_latency += invocation_latency

            # Update the chat history
            chat_history.append(answer)
            self.chat_history = ''.join(chat_history)

            # Check if the stop reason is 'end_turn' and break if true
            if self.stop_reasons[retries] == 'end_turn':
                break

            # Add a delay between iterations
            time.sleep(self.sleep_time)

    # Reset the chat history
    def clear_chat_history(self) -> None:
        self.chat_history = "Hello, I am an AI~"

    # Pre-process the document to prepare it for the LLM
    def process_documents(self, document: bytes) -> None:
        try:
            # Process the document based on its type
            if self.document_type.lower() == 'text':
                self.document = StringIO(document.getvalue().decode('utf-8')).read()
            elif self.document_type.lower() == 'pdf':
                document_pdf = PdfReader(document)
                self.document = ''.join([page.extract_text() for page in document_pdf.pages])
            
            # Print the document length and calculate the number of iterations
            print(len(self.document))
            self.iterations = int(len(self.document)/4096)
            print(self.iterations)
        except:
            # Handle exceptions
            print("Document processing error")
        else:
            # Print success message
            print("Document pre-processing completed successfully")

    # Main method to process the request from the user
    def process_request(self, model_id: str, user_input: str, max_tokens: int, temperature: float, top_p: float, 
                        document: Optional[bytes] = None, document_type: Optional[str] = 'text', 
                        processing_type: Optional[str] = 'translation') -> Tuple[str, List[int], float]:
        # Update the model parameters
        self.model_id = model_id
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.top_p = top_p
        self.user_input = user_input
        
        # Process the document if provided
        if document is not None:
            self.document_type = document_type
            self.process_documents(document)
    
        # Process the long-form output
        self.process_long_form_output()
        
        # Return the final output, output token counts, and invocation latency
        return self.chat_history, self.output_tokens, round(self.invocation_latency, 4)
    
