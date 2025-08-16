import { LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { Code } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export function createBedrockAgentCoreLayer(scope: Construct): LayerVersion {
  return new LayerVersion(scope, 'BedrockAgentCoreLayer', {
    layerVersionName: 'bedrock-agentcore-layer',
    code: Code.fromAsset('./amplify/layers/bedrock-agentcore-layer'),
    description: 'Lambda layer containing @aws-sdk/client-bedrock-agentcore',
    compatibleRuntimes: [
      // Add compatible runtimes
    ],
  });
}
