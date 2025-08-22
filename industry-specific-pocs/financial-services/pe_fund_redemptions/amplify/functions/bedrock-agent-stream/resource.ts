import { defineFunction } from '@aws-amplify/backend';

export const bedrockAgentStream = defineFunction({
  name: 'bedrock-agent-stream',
  entry: './handler.mjs',          // <-- just this
  runtime: 20,
  timeoutSeconds: 600,
  memoryMB: 1024,
  environment: {
    AGENTCORE_QUALIFIER: 'DEFAULT',
    AGENTCORE_RUNTIME_ARN: process.env.AGENTCORE_RUNTIME_ARN ?? '',
  },
});
