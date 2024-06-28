using Amazon.Bedrock.Guardrail.Components;
using MudBlazor;
using MudBlazor.Services;
using Amazon.Bedrock;
using Amazon.BedrockRuntime;
using Amazon;
using Amazon.BedrockAgentRuntime;
using Microsoft.Extensions.DependencyInjection;
using Amazon.BedrockAgent;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

builder.Services.AddMudServices();
builder.Services.AddMudMarkdownServices();





builder.Services.AddSingleton(
    new AmazonBedrockRuntimeClient(new AmazonBedrockRuntimeConfig()
    {
        RegionEndpoint = RegionEndpoint.USEast1
    }));
builder.Services.AddSingleton(
    new AmazonBedrockClient(new AmazonBedrockConfig()
    {
        RegionEndpoint = RegionEndpoint.USEast1
    }));

builder.Services.AddSingleton(
     new AmazonBedrockAgentRuntimeClient(new AmazonBedrockAgentRuntimeConfig()
     {
         RegionEndpoint = RegionEndpoint.USEast1
     }));


builder.Services.AddSingleton(
     new AmazonBedrockAgentClient(new AmazonBedrockAgentConfig()
     {
         RegionEndpoint = RegionEndpoint.USEast1
     }));


var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
}

app.UseStaticFiles();
app.UseAntiforgery();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();
