using Amazon.Bedrock.Rag.Kendra.Poc.Components;
using MudBlazor;
using MudBlazor.Services;
using Amazon.Bedrock;
using Amazon.BedrockRuntime;
using Amazon;
using Amazon.BedrockAgentRuntime;
using Microsoft.Extensions.DependencyInjection;
using Amazon.BedrockAgent;
using Amazon.Kendra;

var builder = WebApplication.CreateBuilder(args);

// Add configuration from appsettings.json
builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);

// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

builder.Services.AddMudServices();
builder.Services.AddMudMarkdownServices();

builder.Services.AddSingleton<IConfiguration>(builder.Configuration);


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

builder.Services.AddSingleton(
     new AmazonKendraClient(new AmazonKendraConfig()
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
