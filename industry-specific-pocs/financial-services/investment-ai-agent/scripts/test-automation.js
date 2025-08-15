#!/usr/bin/env node

/**
 * Test Automation Script
 * Comprehensive test execution with reporting and CI/CD integration
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestAutomation {
  constructor() {
    this.testResults = {
      unit: null,
      integration: null,
      coverage: null,
      startTime: null,
      endTime: null
    };
    
    this.config = {
      unitTestTimeout: 60000,
      integrationTestTimeout: 180000,
      coverageThreshold: {
        statements: 60,
        branches: 60,
        functions: 60,
        lines: 60
      }
    };
  }

  async runAllTests(options = {}) {
    console.log('🚀 Starting Comprehensive Test Automation\n');
    this.testResults.startTime = Date.now();

    const {
      skipUnit = false,
      skipIntegration = false,
      skipCoverage = false,
      bail = false,
      parallel = true
    } = options;

    try {
      // Pre-test validation
      await this.validateTestEnvironment();

      const testPromises = [];

      // Run unit tests
      if (!skipUnit) {
        console.log('📋 Scheduling unit tests...');
        if (parallel) {
          testPromises.push(this.runUnitTests());
        } else {
          await this.runUnitTests();
          if (bail && !this.testResults.unit.success) {
            throw new Error('Unit tests failed, stopping execution');
          }
        }
      }

      // Run integration tests
      if (!skipIntegration) {
        console.log('🔗 Scheduling integration tests...');
        if (parallel) {
          testPromises.push(this.runIntegrationTests());
        } else {
          await this.runIntegrationTests();
          if (bail && !this.testResults.integration.success) {
            throw new Error('Integration tests failed, stopping execution');
          }
        }
      }

      // Wait for parallel tests to complete
      if (parallel && testPromises.length > 0) {
        console.log('⏳ Waiting for parallel tests to complete...\n');
        await Promise.all(testPromises);
      }

      // Run coverage analysis
      if (!skipCoverage) {
        console.log('📊 Running coverage analysis...');
        await this.runCoverageAnalysis();
      }

      this.testResults.endTime = Date.now();

      // Generate comprehensive report
      await this.generateTestReport();

      // Validate results
      this.validateTestResults();

      console.log('\n✅ All tests completed successfully!');
      return this.testResults;

    } catch (error) {
      this.testResults.endTime = Date.now();
      console.error('\n❌ Test automation failed:', error.message);
      await this.generateFailureReport(error);
      throw error;
    }
  }

  async validateTestEnvironment() {
    console.log('🔍 Validating test environment...');

    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`   Node.js version: ${nodeVersion}`);

    // Check required dependencies
    const requiredDeps = ['jest', 'ts-jest', 'supertest'];
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    for (const dep of requiredDeps) {
      if (!packageJson.devDependencies[dep] && !packageJson.dependencies[dep]) {
        throw new Error(`Required dependency missing: ${dep}`);
      }
    }

    // Check test files exist
    const testDirs = [
      'src/__tests__',
      'src/__tests__/integration'
    ];

    for (const dir of testDirs) {
      if (!fs.existsSync(dir)) {
        throw new Error(`Test directory missing: ${dir}`);
      }
    }

    // Set environment variables
    process.env.NODE_ENV = 'test';
    process.env.AWS_REGION = 'us-east-1';
    process.env.JWT_SECRET = 'test-jwt-secret';

    console.log('✅ Environment validation passed\n');
  }

  async runUnitTests() {
    console.log('🧪 Running unit tests...');
    
    const startTime = Date.now();
    
    try {
      const result = await this.executeCommand('npm', ['run', 'test:unit', '--', '--ci', '--coverage=false']);
      
      this.testResults.unit = {
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        duration: Date.now() - startTime,
        output: result.output
      };

      if (this.testResults.unit.success) {
        console.log('✅ Unit tests passed');
      } else {
        console.log('❌ Unit tests failed');
      }

    } catch (error) {
      this.testResults.unit = {
        success: false,
        exitCode: 1,
        duration: Date.now() - startTime,
        error: error.message
      };
      console.log('❌ Unit tests failed with error:', error.message);
    }
  }

  async runIntegrationTests() {
    console.log('🔗 Running integration tests...');
    
    const startTime = Date.now();
    
    try {
      const result = await this.executeCommand('npm', ['run', 'test:integration', '--', '--ci']);
      
      this.testResults.integration = {
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        duration: Date.now() - startTime,
        output: result.output
      };

      if (this.testResults.integration.success) {
        console.log('✅ Integration tests passed');
      } else {
        console.log('❌ Integration tests failed');
      }

    } catch (error) {
      this.testResults.integration = {
        success: false,
        exitCode: 1,
        duration: Date.now() - startTime,
        error: error.message
      };
      console.log('❌ Integration tests failed with error:', error.message);
    }
  }

  async runCoverageAnalysis() {
    console.log('📊 Running coverage analysis...');
    
    const startTime = Date.now();
    
    try {
      const result = await this.executeCommand('npm', ['run', 'test:coverage']);
      
      this.testResults.coverage = {
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        duration: Date.now() - startTime,
        output: result.output
      };

      // Parse coverage results
      if (fs.existsSync('coverage/coverage-summary.json')) {
        const coverageSummary = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
        this.testResults.coverage.summary = coverageSummary.total;
      }

      if (this.testResults.coverage.success) {
        console.log('✅ Coverage analysis completed');
      } else {
        console.log('❌ Coverage analysis failed');
      }

    } catch (error) {
      this.testResults.coverage = {
        success: false,
        exitCode: 1,
        duration: Date.now() - startTime,
        error: error.message
      };
      console.log('❌ Coverage analysis failed with error:', error.message);
    }
  }

  executeCommand(command, args, options = {}) {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        stdio: 'pipe',
        cwd: process.cwd(),
        ...options
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        if (!options.silent) {
          process.stdout.write(text);
        }
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        if (!options.silent) {
          process.stderr.write(text);
        }
      });

      child.on('close', (code) => {
        resolve({
          exitCode: code,
          output,
          errorOutput
        });
      });

      child.on('error', (error) => {
        resolve({
          exitCode: 1,
          output,
          errorOutput: errorOutput + error.message
        });
      });
    });
  }

  async generateTestReport() {
    console.log('\n📋 Generating test report...');

    const totalDuration = this.testResults.endTime - this.testResults.startTime;
    
    const report = {
      timestamp: new Date().toISOString(),
      totalDuration,
      summary: {
        unit: this.testResults.unit ? {
          passed: this.testResults.unit.success,
          duration: this.testResults.unit.duration
        } : null,
        integration: this.testResults.integration ? {
          passed: this.testResults.integration.success,
          duration: this.testResults.integration.duration
        } : null,
        coverage: this.testResults.coverage ? {
          passed: this.testResults.coverage.success,
          summary: this.testResults.coverage.summary
        } : null
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        ci: !!process.env.CI
      }
    };

    // Write report to file
    const reportPath = 'test-results/test-report.json';
    await this.ensureDirectoryExists('test-results');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate human-readable report
    const humanReport = this.generateHumanReadableReport(report);
    fs.writeFileSync('test-results/test-report.md', humanReport);

    console.log(`📄 Test report saved to: ${reportPath}`);
  }

  generateHumanReadableReport(report) {
    const { summary, totalDuration, timestamp } = report;
    
    let markdown = `# Test Execution Report\n\n`;
    markdown += `**Generated:** ${timestamp}\n`;
    markdown += `**Total Duration:** ${(totalDuration / 1000).toFixed(2)}s\n\n`;

    markdown += `## Summary\n\n`;

    if (summary.unit) {
      const status = summary.unit.passed ? '✅ PASSED' : '❌ FAILED';
      const duration = (summary.unit.duration / 1000).toFixed(2);
      markdown += `- **Unit Tests:** ${status} (${duration}s)\n`;
    }

    if (summary.integration) {
      const status = summary.integration.passed ? '✅ PASSED' : '❌ FAILED';
      const duration = (summary.integration.duration / 1000).toFixed(2);
      markdown += `- **Integration Tests:** ${status} (${duration}s)\n`;
    }

    if (summary.coverage && summary.coverage.summary) {
      const cov = summary.coverage.summary;
      markdown += `\n## Coverage Report\n\n`;
      markdown += `- **Statements:** ${cov.statements.pct}%\n`;
      markdown += `- **Branches:** ${cov.branches.pct}%\n`;
      markdown += `- **Functions:** ${cov.functions.pct}%\n`;
      markdown += `- **Lines:** ${cov.lines.pct}%\n`;
    }

    return markdown;
  }

  async generateFailureReport(error) {
    console.log('📋 Generating failure report...');

    const failureReport = {
      timestamp: new Date().toISOString(),
      error: error.message,
      testResults: this.testResults,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    await this.ensureDirectoryExists('test-results');
    fs.writeFileSync('test-results/failure-report.json', JSON.stringify(failureReport, null, 2));
  }

  validateTestResults() {
    const failures = [];

    if (this.testResults.unit && !this.testResults.unit.success) {
      failures.push('Unit tests failed');
    }

    if (this.testResults.integration && !this.testResults.integration.success) {
      failures.push('Integration tests failed');
    }

    if (this.testResults.coverage && this.testResults.coverage.summary) {
      const cov = this.testResults.coverage.summary;
      const threshold = this.config.coverageThreshold;

      if (cov.statements.pct < threshold.statements) {
        failures.push(`Statement coverage below threshold: ${cov.statements.pct}% < ${threshold.statements}%`);
      }
      if (cov.branches.pct < threshold.branches) {
        failures.push(`Branch coverage below threshold: ${cov.branches.pct}% < ${threshold.branches}%`);
      }
      if (cov.functions.pct < threshold.functions) {
        failures.push(`Function coverage below threshold: ${cov.functions.pct}% < ${threshold.functions}%`);
      }
      if (cov.lines.pct < threshold.lines) {
        failures.push(`Line coverage below threshold: ${cov.lines.pct}% < ${threshold.lines}%`);
      }
    }

    if (failures.length > 0) {
      throw new Error(`Test validation failed:\n${failures.map(f => `  - ${f}`).join('\n')}`);
    }
  }

  async ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// CLI Interface
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--skip-unit':
        options.skipUnit = true;
        break;
      case '--skip-integration':
        options.skipIntegration = true;
        break;
      case '--skip-coverage':
        options.skipCoverage = true;
        break;
      case '--bail':
        options.bail = true;
        break;
      case '--sequential':
        options.parallel = false;
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Test Automation Script

Usage: node scripts/test-automation.js [options]

Options:
  --skip-unit          Skip unit tests
  --skip-integration   Skip integration tests
  --skip-coverage      Skip coverage analysis
  --bail               Stop on first failure
  --sequential         Run tests sequentially instead of parallel
  --help               Show this help message

Examples:
  node scripts/test-automation.js
  node scripts/test-automation.js --skip-integration
  node scripts/test-automation.js --bail --sequential
`);
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  const automation = new TestAutomation();
  
  automation.runAllTests(options)
    .then(() => {
      console.log('\n🎉 Test automation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test automation failed:', error.message);
      process.exit(1);
    });
}

module.exports = TestAutomation;