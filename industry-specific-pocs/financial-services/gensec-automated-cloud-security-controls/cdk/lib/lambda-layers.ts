import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class LambdaLayers {
  public readonly commonLayer: lambda.LayerVersion;
  public readonly requestsLayer: lambda.LayerVersion;
  public readonly webScrapingLayer: lambda.LayerVersion;
  public readonly bedrockLayer: lambda.LayerVersion;
  public readonly dynamodbOperationsLayer: lambda.LayerVersion;
  public readonly validationLayer: lambda.LayerVersion;
  public readonly mcpToolsLayer: lambda.LayerVersion;

  constructor(scope: Construct, id: string) {
    // Common layer with boto3, botocore, python-dateutil, and s3_operations
    // These are commonly used across all Lambda functions
    this.commonLayer = new lambda.LayerVersion(scope, `${id}CommonLayer`, {
      layerVersionName: 'gensec-common-dependencies',
      code: lambda.Code.fromAsset('../layers/common-layer'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_10],
      description: 'Common dependencies: boto3, botocore, python-dateutil, s3_operations',
    });

    // Requests layer for HTTP operations
    // Used by SecurityConfigurationHandler and AWSServiceDocumentationManager
    this.requestsLayer = new lambda.LayerVersion(scope, `${id}RequestsLayer`, {
      layerVersionName: 'gensec-requests-dependencies',
      code: lambda.Code.fromAsset('../layers/requests-layer'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_10],
      description: 'HTTP dependencies: requests, urllib3',
    });

    // Web scraping layer for documentation collection
    // Used specifically by AWSServiceDocumentationManager
    this.webScrapingLayer = new lambda.LayerVersion(scope, `${id}WebScrapingLayer`, {
      layerVersionName: 'gensec-web-scraping-dependencies',
      code: lambda.Code.fromAsset('../layers/web-scraping-layer'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_10],
      description: 'Web scraping dependencies: beautifulsoup4, lxml, html5lib',
    });

    // Bedrock layer for AI model interactions
    // Used by all security analysis Lambda functions
    this.bedrockLayer = new lambda.LayerVersion(scope, `${id}BedrockLayer`, {
      layerVersionName: 'gensec-bedrock-client',
      code: lambda.Code.fromAsset('../layers/bedrock-layer'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_10],
      description: 'Bedrock client for AI model interactions',
    });

    // DynamoDB operations layer
    // Common DynamoDB functions used across multiple Lambda functions
    this.dynamodbOperationsLayer = new lambda.LayerVersion(scope, `${id}DynamodbOperationsLayer`, {
      layerVersionName: 'gensec-dynamodb-operations',
      code: lambda.Code.fromAsset('../layers/dynamodb-operations-layer'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_10],
      description: 'Common DynamoDB operations: queries, parsing, storage',
    });

    // Validation layer with json_processing
    // Common validation functions for parameters, actions, configurations, and JSON processing
    this.validationLayer = new lambda.LayerVersion(scope, `${id}ValidationLayer`, {
      layerVersionName: 'gensec-validation',
      code: lambda.Code.fromAsset('../layers/validation-layer'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_10],
      description: 'Validation functions: parameters, actions, configurations, json_processing',
    });

    // MCP tools layer for AWS Documentation MCP Server integration
    // Used by AWSServiceDocumentationManager for structured documentation access
    this.mcpToolsLayer = new lambda.LayerVersion(scope, `${id}McpToolsLayer`, {
      layerVersionName: 'gensec-mcp-tools',
      code: lambda.Code.fromAsset('../layers/mcp-tools-layer'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_10],
      description: 'MCP tools for AWS Documentation MCP Server integration',
    });
  }
}
