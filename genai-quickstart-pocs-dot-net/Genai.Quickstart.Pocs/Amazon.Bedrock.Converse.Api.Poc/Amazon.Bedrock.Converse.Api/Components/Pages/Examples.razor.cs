using Microsoft.AspNetCore.Components;

namespace Amazon.Bedrock.Converse.Api.Poc.Components.Pages
{
    public sealed partial class Examples
    {
        [Parameter, EditorRequired] public required string Message { get; set; }
        [Parameter, EditorRequired] public EventCallback<string> OnExampleClicked { get; set; }

        private string Question1 { get; } = "Describe the purpose of a 'hello world' program in one line";
        private string Question2 { get; } = "Explain 'rubber duck debugging' in one line.";
        private string Question3 { get; } = "Explain 'Binary Search' to a 5 years old kid";

        private async Task OnClickedAsync(string exampleText)
        {
            if (OnExampleClicked.HasDelegate)
            {
                await OnExampleClicked.InvokeAsync(exampleText);
            }
        }
    }
}
