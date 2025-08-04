/**
 * Standalone setup for integration tests
 * Sets up environment without importing problematic modules
 */

// Set integration test environment variables
process.env.NODE_ENV = 'integration-test';
process.env.AWS_REGION = 'us-east-1';
process.env.BEDROCK_REGION = 'us-east-1';
process.env.JWT_SECRET = 'integration-test-jwt-secret';

console.log('🚀 Standalone integration test environment initialized');