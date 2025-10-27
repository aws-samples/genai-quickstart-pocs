/**
 * Standalone Jest configuration for integration tests
 * Minimal configuration that doesn't import any existing codebase
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/standalone-integration.test.ts'],
  setupFilesAfterEnv: [
    '<rootDir>/../setup.ts'
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        isolatedModules: true
      }
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: false,
  testTimeout: 30000,
  maxWorkers: 1,
  verbose: true,
  // Set environment variables for integration tests
  setupFiles: ['<rootDir>/standalone-setup.js']
};