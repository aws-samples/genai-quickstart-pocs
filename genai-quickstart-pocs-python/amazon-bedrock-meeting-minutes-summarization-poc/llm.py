import json


class BedrockModelHandler():
    def __init__(self, _session, model_name, prompt, task):
        self.model_name = model_name
        self._session = _session
        self.prompt = prompt
        self.task = task
    
    def get_response(self):
        self.process_task()
        return self.__get_model().invoke()
    
    def process_task(self):
        # Define body for the model invocation
        if self.task == "Summarize":
            self.prompt = "Summarize the meeting transcript:"+self.prompt
        elif self.task == "ActionNotes":
            self.prompt = "Create List of action items from the meeting transcript:"+self.prompt

    def __get_model(self):
        bedrock = self._session.client(service_name='bedrock-runtime')
        if self.model_name == "anthropic.claude-v2":
            return ClaudeV2(self.prompt, bedrock)
        elif self.model_name == "anthropic.claude-3-sonnet":
            return ClaudeV3Sonnet(self.prompt, bedrock)
        

class ClaudeV2():
    def __init__(self, prompt, bedrock_client):
        self.prompt = prompt
        self.bedrock_client = bedrock_client

    def invoke(self):  
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
        completion_response = response_body.get("completion")
        return completion_response


class ClaudeV3Sonnet():
    def __init__(self, prompt, bedrock_client):
        self.prompt = prompt
        self.bedrock_client = bedrock_client

    def invoke(self):
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
        return result["content"][0]["text"]