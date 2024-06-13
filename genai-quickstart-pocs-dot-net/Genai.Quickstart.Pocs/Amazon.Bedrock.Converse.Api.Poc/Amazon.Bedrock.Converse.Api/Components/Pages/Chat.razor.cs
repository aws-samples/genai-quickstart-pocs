using Amazon.Bedrock.Converse.Api.Poc.Components.Models;
using Amazon.Bedrock.Model;
using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;




namespace Amazon.Bedrock.Converse.Api.Poc.Components.Pages
{
    public sealed partial class Chat
    {
        private string _userQuestion = "";
        private UserQuestion _currentQuestion;
        private ChatMessage _chatMessage;
        private string _lastReferenceQuestion = "";
        private bool _isReceivingResponse = false;
        private readonly Dictionary<UserQuestion, ChatMessage> _questionAndAnswerMap = [];
        private BedrockModel _bedrockModel;
        
        private List<BedrockModel> _bedrockModels; 

        public required bool IsReversed { get; set; }
        private Task OnAskQuestionAsync(string question)
        {
            _userQuestion = question;
            return OnAskClickedAsync();
        }
        

        private async Task<IEnumerable<BedrockModel>> Search(string value)
        {
            await Task.Delay(5);
            if (string.IsNullOrEmpty(value))
            {
                return await Task.FromResult(Enumerable.Empty<BedrockModel>());
            }
            await GetBedrockModels();

            var models = _bedrockModels?.Where(x => x.ModelName.Contains(value, StringComparison.InvariantCultureIgnoreCase))
               ?? Enumerable.Empty<BedrockModel>();

            return await Task.FromResult(models);

            
        }

        readonly Func<BedrockModel, string> _selectConverter = bm => string.Concat(bm?.ModelName + " - " + bm?.ModelIdentifier);

        protected override async Task OnInitializedAsync()
        {
            await GetBedrockModels();
            await base.OnInitializedAsync();
        }

        private async Task<IEnumerable<BedrockModel>> GetBedrockModels()
        {
            _bedrockModels = new List<BedrockModel>();
            try
            {
                
                ListFoundationModelsResponse response = await bedrockClient.ListFoundationModelsAsync(new ListFoundationModelsRequest()
                {
                });

                if (response?.HttpStatusCode == System.Net.HttpStatusCode.OK)
                {
                    response.ModelSummaries.OrderBy(fm => fm.ModelName).ToList();
                    foreach (var fm in response.ModelSummaries)
                    {
                        var _bedrockModeltemp = new BedrockModel
                        {
                            ModelName = fm.ModelName,
                            ModelIdentifier = fm.ModelId
                        };
                        _bedrockModels.Add(_bedrockModeltemp);
                    }
                }
                else
                {
                    Console.WriteLine("Something wrong happened");
                }

            }
            catch (AmazonBedrockException e)
            {
                Console.WriteLine(e.Message);
            }
            return _bedrockModels;
        }


       
        private async Task OnAskClickedAsync()
        {
            if (string.IsNullOrWhiteSpace(_userQuestion))
            {
                return;
            }
            else
            {
                var modelId = _bedrockModel.ModelIdentifier;
                _currentQuestion = new(_userQuestion, modelId, DateTime.Now );
                _chatMessage = new ChatMessage { Content= _userQuestion, Role="user" };

                
                var client = new AmazonBedrockRuntimeClient(RegionEndpoint.USEast1);
                
                try
                {
                    
                    // Create a request with the model ID, the user message, and an inference configuration.
                    var request = new ConverseRequest
                    {
                        ModelId = modelId,
                        Messages = new List<Message>
                        {
                            new Message
                            {
                                Role = ConversationRole.User,
                                Content = new List<ContentBlock> { new ContentBlock { Text = _userQuestion } }
                            }
                        },
                        InferenceConfig = new InferenceConfiguration()
                        {
                            MaxTokens = 512,
                            Temperature = 0.5F,
                            TopP = 0.9F
                        }
                    };

                
                    // Send the request to the Bedrock Runtime and wait for the result.
                    var response = await client.ConverseAsync(request);

                    // Extract and print the response text.
                    string responseText = response?.Output?.Message?.Content?[0]?.Text ?? "";
                    _chatMessage = new ChatMessage { Content = responseText, Role = "assistant" };

                    if (!_questionAndAnswerMap.ContainsKey(_currentQuestion))
                        _questionAndAnswerMap.Add(_currentQuestion, _chatMessage);

                   
                }
                catch (AmazonBedrockRuntimeException e)
                {
                    Console.WriteLine($"ERROR: Can't invoke '{modelId}'. Reason: {e.Message}");
                    throw;
                }
            }
        }

        private void OnClearChat()
        {
            _userQuestion = _lastReferenceQuestion = "";
            _currentQuestion = default;
            _questionAndAnswerMap.Clear();
        }
    }
}
