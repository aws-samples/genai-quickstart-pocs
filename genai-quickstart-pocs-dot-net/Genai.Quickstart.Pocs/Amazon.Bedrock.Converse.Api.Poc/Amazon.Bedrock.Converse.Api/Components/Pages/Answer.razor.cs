using Microsoft.AspNetCore.Components;


namespace Amazon.Bedrock.Converse.Api.Poc.Components.Pages
{

    public sealed partial class Answer
    {
        [Parameter, EditorRequired] public required string Response { get; set; }
        [Parameter, EditorRequired] public required EventCallback<string> FollowupQuestionClicked { get; set; }

        private string? _parsedAnswer;

        protected override void OnParametersSet()
        {
            _parsedAnswer = Response;
            base.OnParametersSet();
        }

        private async Task OnAskFollowupAsync(string followupQuestion)
        {
            if (FollowupQuestionClicked.HasDelegate)
            {
                await FollowupQuestionClicked.InvokeAsync(followupQuestion);
            }
        }

    }
}
