/**
 * Minimal Jest configuration for integration tests
 * Only runs integration test files without compiling the entire codebase
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/minimal-integration.test.ts', '**/simple-integration.test.ts'],
  setupFilesAfterEnv: [
    '<rootDir>/../setup.ts',
    '<rootDir>/integration-setup.ts'
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
  globalSetup: '<rootDir>/global-setup.ts',
  globalTeardown: '<rootDir>/global-teardown.ts',
  // Ignore problematic files
  transformIgnorePatterns: [
    'node_modules/(?!(supertest|express)/)'
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/../../api/controllers/',
    '<rootDir>/../../services/',
    '<rootDir>/../../utils/',
    '<rootDir>/../../models/'
  ]
};