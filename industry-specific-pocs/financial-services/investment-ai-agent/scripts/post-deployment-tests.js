#!/usr/bin/env node

const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Post-deployment testing script
 * Validates that the deployed infrastructure is working correctly
 */

class PostDeploymentTester {
  constructor() {
    this.environment = process.env.NODE_ENV || 'dev';
    this.results = [];
    this.apiUrl = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${type.toUpperCase()}]`;
    console.log(`${prefix} ${message}`);
  }

  async getStackOutputs() {
    this.log('Retrieving stack outputs...');
    
    try {
      const configPath = path.join(__dirname, '..', 'config', 'environments', `${this.environment}.json`);
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      const result = execSync(`aws cloudformation describe-stacks --stack-name ${config.stackName}`, { stdio: 'pipe' });
      const stacks = JSON.parse(result.toString());
      
      if (stacks.Stacks && stacks.Stacks.length > 0) {
        const outputs = stacks.Stacks[0].Outputs || [];
        const outputMap = {};
        
        outputs.forEach(output => {
          outputMap[output.OutputKey] = output.OutputValue;
        });
        
        this.apiUrl = outputMap.ApiUrl;
        this.log(`API URL: ${this.apiUrl}`);
        
        return outputMap;
      } else {
        throw new Error('Stack not found');
      }
    } catch (error) {
      this.log(`Failed to retrieve stack outputs: ${error.message}`, 'error');
      throw error;
    }
  }

  async testHealthEndpoint() {
    this.log('Testing health endpoint...');
    
    return new Promise((resolve, reject) => {
      const url = `${this.apiUrl}api/v1/health`;
      
      https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            this.log('✅ Health endpoint test passed');
            this.results.push({ test: 'Health Endpoint', status: 'PASS', details: 'Endpoint responding correctly' });
            resolve(true);
          } else {
            this.log(`❌ Health endpoint test failed: HTTP ${res.statusCode}`, 'error');
            this.results.push({ test: 'Health Endpoint', status: 'FAIL', details: `HTTP ${res.statusCode}` });
            resolve(false);
          }
        });
      }).on('error', (error) => {
        this.log(`❌ Health endpoint test failed: ${error.message}`, 'error');
        this.results.push({ test: 'Health Endpoint', status: 'FAIL', details: error.message });
        resolve(false);
      });
    });
  }

  async testVersionEndpoint() {
    this.log('Testing version endpoint...');
    
    return new Promise((resolve, reject) => {
      const url = `${this.apiUrl}api/v1/version`;
      
      https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const version = JSON.parse(data);
              if (version.version) {
                this.log(`✅ Version endpoint test passed: ${version.version}`);
                this.results.push({ test: 'Version Endpoint', status: 'PASS', details: `Version: ${version.version}` });
                resolve(true);
              } else {
                this.log('❌ Version endpoint test failed: No version in response', 'error');
                this.results.push({ test: 'Version Endpoint', status: 'FAIL', details: 'No version in response' });
                resolve(false);
              }
            } catch (error) {
              this.log(`❌ Version endpoint test failed: Invalid JSON response`, 'error');
              this.results.push({ test: 'Version Endpoint', status: 'FAIL', details: 'Invalid JSON response' });
              resolve(false);
            }
          } else {
            this.log(`❌ Version endpoint test failed: HTTP ${res.statusCode}`, 'error');
            this.results.push({ test: 'Version Endpoint', status: 'FAIL', details: `HTTP ${res.statusCode}` });
            resolve(false);
          }
        });
      }).on('error', (error) => {
        this.log(`❌ Version endpoint test failed: ${error.message}`, 'error');
        this.results.push({ test: 'Version Endpoint', status: 'FAIL', details: error.message });
        resolve(false);
      });
    });
  }

  async testDatabaseConnectivity() {
    this.log('Testing database connectivity...');
    
    try {
      const configPath = path.join(__dirname, '..', 'config', 'environments', `${this.environment}.json`);
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Test DynamoDB table existence
      const result = execSync(`aws dynamodb describe-table --table-name InvestmentIdeasTable-${config.environment}`, { stdio: 'pipe' });
      const table = JSON.parse(result.toString());
      
      if (table.Table && table.Table.TableStatus === 'ACTIVE') {
        this.log('✅ Database connectivity test passed');
        this.results.push({ test: 'Database Connectivity', status: 'PASS', details: 'DynamoDB table is active' });
        return true;
      } else {
        this.log('❌ Database connectivity test failed: Table not active', 'error');
        this.results.push({ test: 'Database Connectivity', status: 'FAIL', details: 'Table not active' });
        return false;
      }
    } catch (error) {
      this.log(`❌ Database connectivity test failed: ${error.message}`, 'error');
      this.results.push({ test: 'Database Connectivity', status: 'FAIL', details: error.message });
      return false;
    }
  }

  async testS3BucketAccess() {
    this.log('Testing S3 bucket access...');
    
    try {
      const configPath = path.join(__dirname, '..', 'config', 'environments', `${this.environment}.json`);
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // List S3 buckets to verify access
      const result = execSync('aws s3 ls', { stdio: 'pipe' });
      const buckets = result.toString();
      
      if (buckets.includes('proprietarydatabucket')) {
        this.log('✅ S3 bucket access test passed');
        this.results.push({ test: 'S3 Bucket Access', status: 'PASS', details: 'Bucket accessible' });
        return true;
      } else {
        this.log('❌ S3 bucket access test failed: Bucket not found', 'error');
        this.results.push({ test: 'S3 Bucket Access', status: 'FAIL', details: 'Bucket not found' });
        return false;
      }
    } catch (error) {
      this.log(`❌ S3 bucket access test failed: ${error.message}`, 'error');
      this.results.push({ test: 'S3 Bucket Access', status: 'FAIL', details: error.message });
      return false;
    }
  }

  async testBedrockAccess() {
    this.log('Testing Bedrock access...');
    
    try {
      // List available foundation models
      const result = execSync('aws bedrock list-foundation-models', { stdio: 'pipe' });
      const models = JSON.parse(result.toString());
      
      if (models.modelSummaries && models.modelSummaries.length > 0) {
        this.log('✅ Bedrock access test passed');
        this.results.push({ test: 'Bedrock Access', status: 'PASS', details: `${models.modelSummaries.length} models available` });
        return true;
      } else {
        this.log('❌ Bedrock access test failed: No models available', 'error');
        this.results.push({ test: 'Bedrock Access', status: 'FAIL', details: 'No models available' });
        return false;
      }
    } catch (error) {
      this.log(`❌ Bedrock access test failed: ${error.message}`, 'error');
      this.results.push({ test: 'Bedrock Access', status: 'FAIL', details: error.message });
      return false;
    }
  }

  async testCognitoUserPool() {
    this.log('Testing Cognito User Pool...');
    
    try {
      const outputs = await this.getStackOutputs();
      const userPoolId = outputs.UserPoolId;
      
      if (!userPoolId) {
        throw new Error('User Pool ID not found in stack outputs');
      }
      
      const result = execSync(`aws cognito-idp describe-user-pool --user-pool-id ${userPoolId}`, { stdio: 'pipe' });
      const userPool = JSON.parse(result.toString());
      
      if (userPool.UserPool && userPool.UserPool.Status === 'Enabled') {
        this.log('✅ Cognito User Pool test passed');
        this.results.push({ test: 'Cognito User Pool', status: 'PASS', details: 'User pool is enabled' });
        return true;
      } else {
        this.log('❌ Cognito User Pool test failed: Pool not enabled', 'error');
        this.results.push({ test: 'Cognito User Pool', status: 'FAIL', details: 'Pool not enabled' });
        return false;
      }
    } catch (error) {
      this.log(`❌ Cognito User Pool test failed: ${error.message}`, 'error');
      this.results.push({ test: 'Cognito User Pool', status: 'FAIL', details: error.message });
      return false;
    }
  }

  async testAPIGatewayThrottling() {
    this.log('Testing API Gateway throttling...');
    
    try {
      // Make multiple rapid requests to test throttling
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(this.makeRequest(`${this.apiUrl}api/v1/health`));
      }
      
      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.success).length;
      
      if (successCount >= 8) { // Allow for some throttling
        this.log('✅ API Gateway throttling test passed');
        this.results.push({ test: 'API Gateway Throttling', status: 'PASS', details: `${successCount}/10 requests succeeded` });
        return true;
      } else {
        this.log(`❌ API Gateway throttling test failed: Only ${successCount}/10 requests succeeded`, 'error');
        this.results.push({ test: 'API Gateway Throttling', status: 'FAIL', details: `Only ${successCount}/10 requests succeeded` });
        return false;
      }
    } catch (error) {
      this.log(`❌ API Gateway throttling test failed: ${error.message}`, 'error');
      this.results.push({ test: 'API Gateway Throttling', status: 'FAIL', details: error.message });
      return false;
    }
  }

  async makeRequest(url) {
    return new Promise((resolve) => {
      https.get(url, (res) => {
        resolve({ success: res.statusCode === 200, statusCode: res.statusCode });
      }).on('error', () => {
        resolve({ success: false, statusCode: null });
      });
    });
  }

  async generateTestReport() {
    this.log('Generating test report...');
    
    const report = {
      environment: this.environment,
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.status === 'PASS').length,
        failed: this.results.filter(r => r.status === 'FAIL').length
      },
      results: this.results
    };

    const reportPath = path.join(__dirname, '..', 'deployment-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Test report saved to: ${reportPath}`);
    return report;
  }

  async run() {
    this.log(`Starting post-deployment tests for environment: ${this.environment}`);
    
    try {
      await this.getStackOutputs();
      
      const tests = [
        () => this.testHealthEndpoint(),
        () => this.testVersionEndpoint(),
        () => this.testDatabaseConnectivity(),
        () => this.testS3BucketAccess(),
        () => this.testBedrockAccess(),
        () => this.testCognitoUserPool(),
        () => this.testAPIGatewayThrottling()
      ];

      for (const test of tests) {
        await test();
        // Add delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const report = await this.generateTestReport();
      
      // Summary
      this.log('\n=== Test Summary ===');
      this.log(`Environment: ${this.environment}`);
      this.log(`Total Tests: ${report.summary.total}`);
      this.log(`Passed: ${report.summary.passed}`);
      this.log(`Failed: ${report.summary.failed}`);

      if (report.summary.failed === 0) {
        this.log('\n✅ All post-deployment tests passed!', 'success');
        process.exit(0);
      } else {
        this.log('\n❌ Some post-deployment tests failed!', 'error');
        this.results.filter(r => r.status === 'FAIL').forEach(result => {
          this.log(`  - ${result.test}: ${result.details}`, 'error');
        });
        process.exit(1);
      }
    } catch (error) {
      this.log(`Post-deployment tests failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new PostDeploymentTester();
  tester.run().catch(error => {
    console.error('Post-deployment test script failed:', error);
    process.exit(1);
  });
}

module.exports = PostDeploymentTester;