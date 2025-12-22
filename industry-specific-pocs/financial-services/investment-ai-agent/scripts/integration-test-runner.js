#!/usr/bin/env node

/**
 * Integration Test Runner
 * Automated execution of integration tests with proper setup and teardown
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class IntegrationTestRunner {
  constructor() {
    this.testConfig = {
      configPath: 'src/__tests__/integration/jest.integration.config.js',
      timeout: 120000, // 2 minutes timeout for integration tests
      maxWorkers: 2,
      verbose: true
    };
  }

  async runTests(options = {}) {
    console.log('🚀 Starting Integration Test Runner...\n');

    const {
      watch = false,
      coverage = false,
      pattern = '',
      bail = false,
      updateSnapshots = false
    } = options;

    try {
      // Validate test environment
      await this.validateEnvironment();

      // Build Jest command
      const jestArgs = this.buildJestCommand({
        watch,
        coverage,
        pattern,
        bail,
        updateSnapshots
      });

      console.log(`📋 Running command: jest ${jestArgs.join(' ')}\n`);

      // Execute tests
      const result = await this.executeJest(jestArgs);
      
      if (result.success) {
        console.log('\n✅ Integration tests completed successfully!');
        this.printTestSummary(result);
      } else {
        console.log('\n❌ Integration tests failed!');
        this.printFailureSummary(result);
        process.exit(1);
      }

    } catch (error) {
      console.error('\n💥 Integration test runner failed:', error.message);
      process.exit(1);
    }
  }

  async validateEnvironment() {
    console.log('🔍 Validating test environment...');

    // Check if required files exist
    const requiredFiles = [
      'src/__tests__/integration/jest.integration.config.js',
      'src/__tests__/integration/integration-setup.ts',
      'src/__tests__/integration/global-setup.ts',
      'src/__tests__/integration/global-teardown.ts'
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Required file not found: ${file}`);
      }
    }

    // Set test environment variables
    process.env.NODE_ENV = 'integration-test';
    process.env.AWS_REGION = 'us-east-1';
    process.env.BEDROCK_REGION = 'us-east-1';
    process.env.JWT_SECRET = 'integration-test-jwt-secret';

    console.log('✅ Environment validation passed\n');
  }

  buildJestCommand(options) {
    const args = [
      '--config', this.testConfig.configPath,
      '--testTimeout', this.testConfig.timeout.toString(),
      '--maxWorkers', this.testConfig.maxWorkers.toString()
    ];

    if (this.testConfig.verbose) {
      args.push('--verbose');
    }

    if (options.watch) {
      args.push('--watch');
    }

    if (options.coverage) {
      args.push('--coverage');
      args.push('--coverageDirectory', 'coverage/integration');
    }

    if (options.pattern) {
      args.push('--testNamePattern', options.pattern);
    }

    if (options.bail) {
      args.push('--bail');
    }

    if (options.updateSnapshots) {
      args.push('--updateSnapshot');
    }

    // Force colors in CI environments
    args.push('--colors');

    return args;
  }

  executeJest(args) {
    return new Promise((resolve) => {
      const jest = spawn('npx', ['jest', ...args], {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      let success = true;
      const startTime = Date.now();

      jest.on('error', (error) => {
        console.error('Failed to start Jest:', error);
        success = false;
      });

      jest.on('close', (code) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        resolve({
          success: code === 0,
          exitCode: code,
          duration
        });
      });
    });
  }

  printTestSummary(result) {
    console.log('\n📊 Test Summary:');
    console.log(`⏱️  Duration: ${(result.duration / 1000).toFixed(2)}s`);
    console.log(`🎯 Exit Code: ${result.exitCode}`);
  }

  printFailureSummary(result) {
    console.log('\n📊 Failure Summary:');
    console.log(`⏱️  Duration: ${(result.duration / 1000).toFixed(2)}s`);
    console.log(`❌ Exit Code: ${result.exitCode}`);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   • Check test logs above for specific failures');
    console.log('   • Ensure all services are properly mocked');
    console.log('   • Verify test data and expectations');
    console.log('   • Run with --verbose for more details');
  }
}

// CLI Interface
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--watch':
      case '-w':
        options.watch = true;
        break;
      case '--coverage':
      case '-c':
        options.coverage = true;
        break;
      case '--bail':
      case '-b':
        options.bail = true;
        break;
      case '--update-snapshots':
      case '-u':
        options.updateSnapshots = true;
        break;
      case '--pattern':
      case '-p':
        options.pattern = args[++i];
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith('--')) {
          console.warn(`Unknown option: ${arg}`);
        }
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Integration Test Runner

Usage: node scripts/integration-test-runner.js [options]

Options:
  --watch, -w              Run tests in watch mode
  --coverage, -c           Generate coverage report
  --bail, -b               Stop on first test failure
  --update-snapshots, -u   Update test snapshots
  --pattern, -p <pattern>  Run tests matching pattern
  --help, -h               Show this help message

Examples:
  node scripts/integration-test-runner.js
  node scripts/integration-test-runner.js --watch
  node scripts/integration-test-runner.js --coverage
  node scripts/integration-test-runner.js --pattern "API"
`);
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  const runner = new IntegrationTestRunner();
  runner.runTests(options).catch(console.error);
}

module.exports = IntegrationTestRunner;