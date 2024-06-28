using Amazon.Bedrock.Guardrail.Components.Models;
using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;
using Amazon.Util;
using Microsoft.AspNetCore.Components;
using System.Text.Json;
using System.Text.Json.Nodes;


namespace Amazon.Bedrock.Guardrail.Components.Pages
{
    public partial class BedrockGuardrail
    {
        [SupplyParameterFromForm]
        public ResponseGenerator? Model { get; set; }

     

        protected override void OnInitialized() => Model ??= new();
        private string outputText;


        private async Task OnAskClickedAsync()
        {
            string userRequest = Model?.Request;
            Logger.LogInformation("Request = {Request}", userRequest);


            outputText = await InvokeClaudeAsync(userRequest);

            StateHasChanged();
        }
    

        public async Task<string> InvokeClaudeAsync(string prompt)
        {
            string claudeModelId = Configuration["GuardrailConfig:ModelId"];
            
            // Claude requires you to enclose the prompt as follows:
            string enclosedPrompt = prompt;
            //Format the request payload using the model's native structure.
            var nativeRequest = JsonSerializer.Serialize(new
            {
                anthropic_version = "bedrock-2023-05-31",
                max_tokens = 512,
                temperature = 0.5,
                messages = new[]
                {
                    new { role = "user", content = prompt }
                }
            });

            string generatedText = "";
            try
            {
                InvokeModelResponse response = await BedrockRuntimeClient.InvokeModelAsync(new InvokeModelRequest()
                {
                    ModelId = claudeModelId,
                    Body = AWSSDKUtils.GenerateMemoryStreamFromString(nativeRequest),
                    ContentType = "application/json",
                    Accept = "application/json",
                    GuardrailIdentifier = Configuration["GuardrailConfig:GuardrailId"],
                    GuardrailVersion = Configuration["GuardrailConfig:GuardrailVersion"]
                });

                if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
                {
                    var output = JsonNode.ParseAsync(response.Body).Result?["content"][0]["text"]?.GetValue<string>() ?? "";
                    return output;
                }
                else
                {
                    Console.WriteLine("InvokeModelAsync failed with status code " + response.HttpStatusCode);
                }
            }
            catch (AmazonBedrockRuntimeException e)
            {
                Console.WriteLine(e.Message);
            }
            return generatedText;
        }

        

      
    }
}
