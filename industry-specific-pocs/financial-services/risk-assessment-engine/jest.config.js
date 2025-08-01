module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    '!packages/*/src/**/*.d.ts',
    '!packages/*/src/**/__tests__/**',
    '!packages/*/src/**/*.test.ts',
    '!packages/*/src/**/*.spec.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapping: {
    '^@agentic-shared/(.*)$': '<rootDir>/packages/shared/src/$1',
    '^@agentic-agents/(.*)$': '<rootDir>/packages/agents/src/$1',
    '^@agentic-mcp-servers/(.*)$': '<rootDir>/packages/mcp-servers/src/$1',
    '^@agentic-api/(.*)$': '<rootDir>/packages/api/src/$1',
    '^@agentic-infrastructure/(.*)$': '<rootDir>/packages/infrastructure/lib/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 30000,
  verbose: true
};