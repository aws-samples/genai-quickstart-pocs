#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Deployment validation script
 * Validates the deployment configuration and infrastructure before deployment
 */

class DeploymentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.environment = process.env.NODE_ENV || 'dev';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${type.toUpperCase()}]`;
    console.log(`${prefix} ${message}`);
  }

  addError(message) {
    this.errors.push(message);
    this.log(message, 'error');
  }

  addWarning(message) {
    this.warnings.push(message);
    this.log(message, 'warning');
  }

  validateEnvironmentConfig() {
    this.log('Validating environment configuration...');
    
    const configPath = path.join(__dirname, '..', 'config', 'environments', `${this.environment}.json`);
    
    if (!fs.existsSync(configPath)) {
      this.addError(`Environment configuration file not found: ${configPath}`);
      return false;
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Validate required fields
      const requiredFields = ['environment', 'region', 'stackName'];
      for (const field of requiredFields) {
        if (!config[field]) {
          this.addError(`Missing required field in environment config: ${field}`);
        }
      }

      // Validate AWS region format
      if (config.region && !/^[a-z]{2}-[a-z]+-\d+$/.test(config.region)) {
        this.addError(`Invalid AWS region format: ${config.region}`);
      }

      // Validate stack name format
      if (config.stackName && !/^[A-Za-z][A-Za-z0-9-]*$/.test(config.stackName)) {
        this.addError(`Invalid stack name format: ${config.stackName}`);
      }

      this.log('Environment configuration validation completed');
      return true;
    } catch (error) {
      this.addError(`Failed to parse environment configuration: ${error.message}`);
      return false;
    }
  }

  validateAWSCredentials() {
    this.log('Validating AWS credentials...');
    
    try {
      execSync('aws sts get-caller-identity', { stdio: 'pipe' });
      this.log('AWS credentials validation completed');
      return true;
    } catch (error) {
      this.addError('AWS credentials not configured or invalid');
      return false;
    }
  }

  validateCDKBootstrap() {
    this.log('Validating CDK bootstrap...');
    
    try {
      const result = execSync('aws cloudformation describe-stacks --stack-name CDKToolkit', { stdio: 'pipe' });
      const stacks = JSON.parse(result.toString());
      
      if (stacks.Stacks && stacks.Stacks.length > 0) {
        const stack = stacks.Stacks[0];
        if (stack.StackStatus === 'CREATE_COMPLETE' || stack.StackStatus === 'UPDATE_COMPLETE') {
          this.log('CDK bootstrap validation completed');
          return true;
        } else {
          this.addWarning(`CDK bootstrap stack in unexpected state: ${stack.StackStatus}`);
        }
      }
    } catch (error) {
      this.addWarning('CDK bootstrap stack not found - will be created during deployment');
    }
    
    return true;
  }

  validateBuildArtifacts() {
    this.log('Validating build artifacts...');
    
    const distPath = path.join(__dirname, '..', 'dist');
    if (!fs.existsSync(distPath)) {
      this.addError('Build artifacts not found. Run "npm run build" first.');
      return false;
    }

    // Check for essential build files
    const requiredFiles = [
      'api/lambda.js',
      'infrastructure/investment-ai-agent-stack.js'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(distPath, file);
      if (!fs.existsSync(filePath)) {
        this.addError(`Required build artifact not found: ${file}`);
      }
    }

    this.log('Build artifacts validation completed');
    return this.errors.length === 0;
  }

  validateDependencies() {
    this.log('Validating dependencies...');
    
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageLockPath = path.join(__dirname, '..', 'package-lock.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      this.addError('package.json not found');
      return false;
    }

    if (!fs.existsSync(packageLockPath)) {
      this.addWarning('package-lock.json not found - dependencies may not be locked');
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check for critical dependencies
      const criticalDeps = ['aws-cdk-lib', '@aws-sdk/client-bedrock-runtime'];
      for (const dep of criticalDeps) {
        if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
          this.addError(`Critical dependency missing: ${dep}`);
        }
      }

      this.log('Dependencies validation completed');
      return true;
    } catch (error) {
      this.addError(`Failed to parse package.json: ${error.message}`);
      return false;
    }
  }

  validateSecurityConfiguration() {
    this.log('Validating security configuration...');
    
    const configPath = path.join(__dirname, '..', 'config', 'environments', `${this.environment}.json`);
    
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Check encryption settings
      if (this.environment === 'prod') {
        if (config.s3 && config.s3.encryption !== 'KMS') {
          this.addWarning('Production environment should use KMS encryption for S3');
        }
        
        if (config.cognito && config.cognito.mfaConfiguration !== 'ON') {
          this.addWarning('Production environment should enforce MFA');
        }
        
        if (!config.security || !config.security.enableWAF) {
          this.addWarning('Production environment should enable WAF');
        }
      }

      this.log('Security configuration validation completed');
      return true;
    } catch (error) {
      this.addError(`Failed to validate security configuration: ${error.message}`);
      return false;
    }
  }

  validateCDKSynthesis() {
    this.log('Validating CDK synthesis...');
    
    try {
      execSync(`npx cdk synth --context environment=${this.environment}`, { stdio: 'pipe' });
      this.log('CDK synthesis validation completed');
      return true;
    } catch (error) {
      this.addError(`CDK synthesis failed: ${error.message}`);
      return false;
    }
  }

  async run() {
    this.log(`Starting deployment validation for environment: ${this.environment}`);
    
    const validations = [
      () => this.validateEnvironmentConfig(),
      () => this.validateAWSCredentials(),
      () => this.validateCDKBootstrap(),
      () => this.validateBuildArtifacts(),
      () => this.validateDependencies(),
      () => this.validateSecurityConfiguration(),
      () => this.validateCDKSynthesis()
    ];

    let allPassed = true;
    for (const validation of validations) {
      try {
        const result = validation();
        if (!result) {
          allPassed = false;
        }
      } catch (error) {
        this.addError(`Validation failed: ${error.message}`);
        allPassed = false;
      }
    }

    // Summary
    this.log('\n=== Validation Summary ===');
    this.log(`Environment: ${this.environment}`);
    this.log(`Errors: ${this.errors.length}`);
    this.log(`Warnings: ${this.warnings.length}`);

    if (this.errors.length > 0) {
      this.log('\nErrors:');
      this.errors.forEach(error => this.log(`  - ${error}`, 'error'));
    }

    if (this.warnings.length > 0) {
      this.log('\nWarnings:');
      this.warnings.forEach(warning => this.log(`  - ${warning}`, 'warning'));
    }

    if (allPassed) {
      this.log('\n✅ All validations passed! Deployment can proceed.', 'success');
      process.exit(0);
    } else {
      this.log('\n❌ Validation failed! Please fix the errors before deploying.', 'error');
      process.exit(1);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new DeploymentValidator();
  validator.run().catch(error => {
    console.error('Validation script failed:', error);
    process.exit(1);
  });
}

module.exports = DeploymentValidator;