/**
 * Test setup and configuration
 */

import { jest } from '@jest/globals';

// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.AWS_REGION = 'us-east-1';
  process.env.JWT_SECRET = 'test-jwt-secret';
});

// Global test cleanup
afterAll(() => {
  // Clean up any global resources
});

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  InvokeModelCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-bedrock', () => ({
  BedrockClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  ListFoundationModelsCommand: jest.fn()
}));

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeEach(() => {
  // Suppress console output in tests unless explicitly needed
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  // Restore console methods
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  
  // Clear all mocks
  jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  // Helper to wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to create mock dates
  mockDate: (dateString: string) => new Date(dateString),
  
  // Helper to generate test IDs
  generateTestId: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
};

// Extend Jest matchers
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false
      };
    }
  },
  
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false
      };
    }
  }
});

// Type declarations for global utilities
declare global {
  var testUtils: {
    wait: (ms: number) => Promise<void>;
    mockDate: (dateString: string) => Date;
    generateTestId: () => string;
  };
  
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeValidEmail(): R;
    }
  }
}

export {};