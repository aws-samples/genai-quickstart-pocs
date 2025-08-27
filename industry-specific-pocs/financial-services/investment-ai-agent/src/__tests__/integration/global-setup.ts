/**
 * Global setup for integration tests
 */

export default async function globalSetup() {
  console.log('🚀 Starting integration test environment...');
  
  // Set global test environment variables
  process.env.NODE_ENV = 'integration-test';
  process.env.AWS_REGION = 'us-east-1';
  process.env.BEDROCK_REGION = 'us-east-1';
  process.env.JWT_SECRET = 'integration-test-jwt-secret-key';
  
  // Initialize any global test resources
  console.log('✅ Integration test environment ready');
}