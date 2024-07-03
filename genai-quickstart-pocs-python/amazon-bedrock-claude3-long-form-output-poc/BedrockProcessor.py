import boto3
import botocore
import json
import time
from io import StringIO
from pypdf import PdfReader
from typing import Optional, Tuple, List, Any

class BedrockProcessor:
    def __init__(self, system_prompt_template: str, prompt_template: str, iterations: Optional[int]=10) -> None:
        # Set up the Boto3 client with custom timeouts
        self.config = botocore.config.Config(connect_timeout=500, read_timeout=500)
        self.bedrock_runtime = boto3.client('bedrock-runtime' , 'us-east-1', config = self.config)

        # Set default values for model parameters
        self.max_tokens = 50000
        self.temperature = 0.2
        self.top_p = 0.5
        self.model_id = 'anthropic.claude-3-sonnet-20240229-v1:0'
        self.anthropic_version = 'bedrock-2023-05-31'

        # Initialize chat history and user input
        self.chat_history = "Hello, I am an AI~"
        self.user_input = None

        # Store prompt templates
        self.prompt_template = prompt_template
        self.prompt = None
        self.system_prompt = system_prompt_template

        # Set number of iterations for long-form output
        self.iterations = int(iterations)

        # Initialize document and document type
        self.document = None
        self.document_type = None

        # Initialize other variables
        self.retries = 0
        self.output_tokens = []
        self.invocation_latency = 0
        self.stop_reasons = []


    def change_prompt_template(self, system_prompt_template: Optional[str] = None, prompt_template: Optional[str] = None) -> None:
        # Update system prompt and prompt template if provided
        self.system_prompt = system_prompt_template if system_prompt_template is not None else self.system_prompt

    def build_prompt(self) -> None:
        # Format the prompt template with document and user input if available
        if self.document_type is not None:
            self.prompt_template = self.prompt_template.format(document=self.document, user_input=self.user_input)
        else:
            self.prompt_template = self.prompt_template.format(user_input=self.user_input, retries=self.retries)

        # Build the prompt dictionary with system prompt, chat history, and formatted prompt template
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

    def process_invoke(self) -> Tuple[str, int, float]:
        try:
            # Invoke the Bedrock model with the prompt
            response = self.bedrock_runtime.invoke_model(
                body=self.prompt,
                modelId=self.model_id,
                accept="application/json",
                contentType="application/json"
            )
            
            # Parse the response
            response_body = json.loads(response.get('body').read())
            output_tokens = int(response['ResponseMetadata']['HTTPHeaders']['x-amzn-bedrock-output-token-count']) if response is not None else 0
            invocation_latency = round(float(response['ResponseMetadata']['HTTPHeaders']['x-amzn-bedrock-invocation-latency']), 4) if response is not None else 0.0
            answer = response_body.get('content')[0]['text']
            self.stop_reasons.append(response_body.get('stop_reason'))
        except:
            # Handle invocation errors
            print("Invocation Error")
            answer = "Invocation Error"
        else:
            # Print success message
            print("Invocation completed successfully")
        
        return answer, output_tokens, invocation_latency
    
    def process_long_form_output(self) -> None:
        # Initialize chat history list
        chat_history = [self.chat_history]
        
        # Iterate for long-form output
        for retries in range(self.iterations):
            self.retries = retries
            print(f"Iteration: {self.retries}")
            self.build_prompt()
            answer, output_tokens, invocation_latency = self.process_invoke()
            self.output_tokens.append((self.retries, int(output_tokens)))
            self.invocation_latency += invocation_latency
            chat_history.append(answer)
            self.chat_history = ''.join(chat_history)

            # Break if stop reason is 'end_turn'
            if self.stop_reasons[retries] == 'end_turn':
                break

            time.sleep(2)

    def clear_chat_history(self) -> None:
        # Reset chat history
        self.chat_history = "Hello, I am an AI~"

    def process_documents(self, document: bytes) -> None:
        try:
            # Process text or PDF documents
            if self.document_type.lower() == 'text':
                self.document = StringIO(document.getvalue().decode('utf-8')).read()
            elif self.document_type.lower() == 'pdf':
                document_pdf = PdfReader(document)
                self.document = ''.join([page.extract_text() for page in document_pdf.pages])
            print(len(self.document))
            self.iterations = int(len(self.document)/4096)
            print(self.iterations)
        except:
            # Handle document processing errors
            print("Document processing error")
        else:
            # Print success message
            print("Document pre-processing completed successfully")

    def process_request(self, model_id: str, user_input: str, max_tokens: int, temperature: float, top_p: float, document: Optional[bytes] = None, 
                        document_type: Optional[str] = 'text', processing_type: Optional[str] = 'translation') -> Tuple[str, List[int], float]:
        # Set model parameters
        self.model_id = model_id
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.top_p = top_p
        self.user_input = user_input
        
        # Process document if provided
        if document is not None:
            self.document_type = document_type
            self.process_documents(document)
    
        # Process long-form output
        self.process_long_form_output()
        
        # Return chat history, output tokens, and invocation latency
        return self.chat_history, self.output_tokens, round(self.invocation_latency, 4)
