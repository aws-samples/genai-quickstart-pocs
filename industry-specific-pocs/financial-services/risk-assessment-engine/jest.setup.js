// Global test setup
process.env.NODE_ENV = 'test';

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  config: {
    update: jest.fn()
  },
  DynamoDB: {
    DocumentClient: jest.fn(() => ({
      get: jest.fn(),
      put: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      query: jest.fn(),
      scan: jest.fn()
    }))
  },
  S3: jest.fn(() => ({
    getObject: jest.fn(),
    putObject: jest.fn(),
    deleteObject: jest.fn()
  })),
  Kinesis: jest.fn(() => ({
    putRecord: jest.fn(),
    putRecords: jest.fn()
  }))
}));

// Mock AgentCore services
jest.mock('@aws-sdk/client-bedrock-agent-runtime', () => ({
  BedrockAgentRuntimeClient: jest.fn(() => ({
    invokeAgent: jest.fn()
  }))
}));

// Increase timeout for integration tests
jest.setTimeout(30000);