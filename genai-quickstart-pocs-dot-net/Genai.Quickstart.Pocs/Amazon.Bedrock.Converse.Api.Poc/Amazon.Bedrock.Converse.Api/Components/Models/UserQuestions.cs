namespace Amazon.Bedrock.Converse.Api.Poc.Components.Models
{
    public readonly record struct UserQuestion(
    string Question,
    string ModelId,
    DateTime AskedOn);
}
