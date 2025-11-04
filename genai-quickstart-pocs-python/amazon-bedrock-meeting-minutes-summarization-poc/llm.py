"""
This module handles logic to interact with LLM using Amazon Bedrock API
"""
import json


class BedrockModelHandler():
    """
    This class provided an abstraction layer for invoking the Bedrock Model for
    Summarizing or ActionNotes tasks. 
    """
    def __init__(self, _session, model_name, prompt, task):
        """
        :param _session: boto3 session.
        :param model_name: FM model name.
        :param prompt: Meeting trasncript text  to summarize.
        :param task: summarize or notes action.
        """
        self.model_name = model_name
        self._session = _session
        self.prompt = prompt
        self.task = task
    
    def get_response(self):
        """
        Setup the prompt and invoke the bedrock invoke function
        """
        self.process_task()
        return self.__get_model().invoke()
    
    def process_task(self):
        """
        Modify the prompt based on option selected 1. Summarize or ActionNotes
        """
        if self.task == "Summarize":
            self.prompt = "Summarize the meeting transcript:"+self.prompt
        elif self.task == "ActionNotes":
            self.prompt = "Create List of action items from the meeting transcript:"+self.prompt

    def __get_model(self):
        """
        get instance of Foundational models based on user selection 
        currently supported only anthropic.claude-v2 and anthropic.claude-3-sonnet
        return: Model class instance
        """
        bedrock = self._session.client(service_name='bedrock-runtime')
        if self.model_name == "anthropic.claude-v2":
            return ClaudeV2(self.prompt, bedrock)
        elif self.model_name == "anthropic.claude-3-sonnet":
            return ClaudeV3Sonnet(self.prompt, bedrock)
        

class ClaudeV2():
    """
    This class provided anthropic.claude-v2:1 model specific functionality
    """
    def __init__(self, prompt, bedrock_client):
        """
        :param prompt: prompt
        :param bedrock_client: boto3 client for bedrock service
        """
        self.prompt = prompt
        self.bedrock_client = bedrock_client

    def invoke(self):  
        # Setup anthropic.claude-v2:1 model specific parameters
        body = json.dumps({
            "prompt": "\n\nHuman:{}\n\nAssistant:".format(self.prompt),
            "max_tokens_to_sample": 5000,
            "temperature": 0.1,
            "top_p": 0.9,
        })
        modelId ='anthropic.claude-v2:1'
        accept = 'application/json'
        contentType = 'application/json'

        response = self.bedrock_client.invoke_model(body=body, modelId=modelId, accept=accept, contentType=contentType)
        response_body = json.loads(response.get("body").read())
        # get completion response from body
        completion_response = response_body.get("completion")
        return completion_response


class ClaudeV3Sonnet():
    """
    This class provided anthropic.claude-3-sonnet-20240229-v1:0 model specific functionality
    """
    def __init__(self, prompt, bedrock_client):
        """
        :param prompt: prompt
        :param bedrock_client: boto3 client for bedrock service
        """
        self.prompt = prompt
        self.bedrock_client = bedrock_client

    def invoke(self):
        # Setup anthropic.claude-3-sonnet-20240229-v1:0 model specific parameters
        model_id = "anthropic.claude-3-sonnet-20240229-v1:0"
        response = self.bedrock_client.invoke_model(
            modelId=model_id,
            body=json.dumps(
                {
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 1024,
                    "messages": [
                        {
                            "role": "user",
                            "content": [{"type": "text", "text": self.prompt}],
                        }
                    ],
                }
            ),
        )
        result = json.loads(response.get("body").read())
        # get text response from model response
        return result["content"][0]["text"]