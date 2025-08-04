/**
 * Jest configuration for integration tests
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.integration.test.ts'],
  modulePathIgnorePatterns: [
    '<rootDir>/../../api/',
    '<rootDir>/../../services/',
    '<rootDir>/../../utils/',
    '<rootDir>/../../models/'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/../setup.ts',
    '<rootDir>/integration-setup.ts'
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: false, // Disable coverage for integration tests
  testTimeout: 60000, // Longer timeout for integration tests
  maxWorkers: 2, // Limit workers for integration tests
  verbose: true,
  // Global setup and teardown for integration tests
  globalSetup: '<rootDir>/global-setup.ts',
  globalTeardown: '<rootDir>/global-teardown.ts'
};