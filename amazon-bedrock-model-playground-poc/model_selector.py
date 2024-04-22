import boto3
import os
import json
from dotenv import load_dotenv

# Loading environment variables from .env file
load_dotenv()
# Setting up the default boto3 session with a specified AWS profile name
boto3.setup_default_session(profile_name=os.getenv("profile_name"))
# Instantiating the Amazon Bedrock Runtime Client
client = boto3.client(
    service_name="bedrock-runtime", region_name=os.getenv("region_name"))
# Define request headers, for Amazon Bedrock Model invocations
accept = 'application/json'
contentType = 'application/json'

class ModelChoices:
    """
    Class to select the appropriate model based on the model ID. Then invokes the exact model specified by the end user.
    """
    def anthropic(self, model_id, question):
        """
        Method to invoke Anthropic models.
        Args:
            model_id: The specific anthropic model to invoke.
            question: The question passed in by the user on the front end.

        Returns:
            The output text (response) from the specific Anthropic model.
        """
        # Define the request body for the Anthropic model using the messages API structure
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": question,
                        }
                    ],
                }
            ],
        }
        # Invoke the Anthropic model with the request body, and specific Model ID selected by the end user
        response = client.invoke_model(
            modelId=model_id,
            body=json.dumps(request_body),
        )
        # Extract the response from the Anthropic model
        result = json.loads(response.get("body").read())
        # Extract the output text from the response
        output_text = result["content"][0]["text"]
        # Return the output text
        return output_text

    def meta(self, model_id, question):
        """
        Method to invoke Meta models.
        Args:
            model_id: The specific Meta model to invoke.
            question: The question passed in by the user on the front end.

        Returns:
            The output text (response) from the specific Meta model.
        """
        # Define the request body for the Meta model, passing in the user question
        request_body = json.dumps({"prompt": question,
                                   "max_gen_len": 2048,
                                   "temperature": 0.5,
                                   "top_p": 0.5
                                   })
        # Invoke the Meta model with the request body, and specific Meta Model ID selected by the end user
        response = client.invoke_model(
            modelId=model_id,
            body=request_body,
            accept=accept,
            contentType=contentType
        )
        # Extract information from the response
        response_body = json.loads(response.get('body').read())
        # Extract the output text from the response
        output_text = response_body['generation']
        # Return the output text
        return output_text

    def mistral(self, model_id, question):
        """
        Method to invoke Mistral models.
        Args:
            model_id: The specific Mistral model to invoke.
            question: The question passed in by the user on the front end.

        Returns:
            The output text (response) from the specific Meta model.
        """
        # Define the request body for the Mistral model, passing in the user question
        request_body = json.dumps({"prompt": question,
                                   "max_tokens": 4096,
                                   "temperature": 0,
                                   "top_k": 200,
                                   "top_p": 0.5
                                   })
        # Invoke the Mistral model with the request body, and specific Mistral Model ID selected by the end user
        response = client.invoke_model(
            modelId=model_id,
            body=request_body,
            accept=accept,
            contentType=contentType
        )
        # Extract information from the response
        response_body = json.loads(response.get('body').read())
        # Extract the output text from the response
        output_text = response_body['outputs'][0]['text']
        # Return the output text
        return output_text

    def cohere(self, model_id, question):
        """
        Method to invoke Cohere models.
        Args:
            model_id: The specific Cohere model to invoke.
            question: The question passed in by the user on the front end.

        Returns:
            The output text (response) from the specific Cohere model.
        """
        # Define the request body for the Cohere model, passing in the user question
        request_body = json.dumps({"prompt": question,
                                   "max_tokens": 4096,
                                   "temperature": 0.5,
                                   })
        # Invoke the Cohere model with the request body, and specific Cohere Model ID selected by the end user
        response = client.invoke_model(
            modelId=model_id,
            body=request_body,
            accept=accept,
            contentType=contentType
        )
        # Extract information from the response
        response_body = json.loads(response.get('body').read())
        # Extract the output text from the response
        output_text = response_body['generations'][0]['text']
        # Return the output text
        return output_text

    def amazon(self, model_id, question):
        """
        Method to invoke Amazon models.
        Args:
            model_id: The specific Amazon model to invoke.
            question: The question passed in by the user on the front end.

        Returns:
            The output text (response) from the specific Amazon model.
        """
        # Define the request body for the Amazon model, passing in the user question
        request_body = json.dumps({"inputText": question,
                                   "textGenerationConfig": {
                                       "maxTokenCount": 4096,
                                       "stopSequences": [],
                                       "temperature": 0.5,
                                       "topP": 0.5
                                   }})
        # Invoke the Amazon model with the request body, and specific Amazon Model ID selected by the end user
        response = client.invoke_model(
            modelId=model_id,
            body=request_body,
            accept=accept,
            contentType=contentType
        )
        # Extract information from the response
        response_body = json.loads(response.get('body').read())
        # Extract the output text from the response
        output_text = response_body['results'][0]['outputText']
        # Return the output text
        return output_text

    def AI21(self, model_id, question):
        """
        Method to invoke AI21 models.
        Args:
            model_id: The specific AI21 model to invoke.
            question: The question passed in by the user on the front end.

        Returns:
            The output text (response) from the specific AI21 model.
        """
        # Define the request body for the AI21 model, passing in the user question
        request_body = json.dumps({"prompt": question,
                                   "maxTokens": 4096,
                                   "temperature": 0.5,
                                   "topP": 0.5,
                                   "stopSequences": [],
                                   })
        # Invoke the AI21 model with the request body, and specific AI21 Model ID selected by the end user
        response = client.invoke_model(
            modelId=model_id,
            body=request_body,
            accept=accept,
            contentType=contentType
        )
        # Extract information from the response
        response_body = json.loads(response.get('body').read())
        # Extract the output text from the response
        output_text = response_body['completions'][0]['data']['text']
        # Return the output text
        return output_text