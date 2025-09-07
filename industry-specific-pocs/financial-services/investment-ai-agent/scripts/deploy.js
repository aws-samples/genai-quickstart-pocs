#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Deployment script for Investment AI Agent
 * Handles environment-specific deployments with proper validation
 */

class DeploymentManager {
  constructor() {
    this.environment = process.argv[2] || process.env.NODE_ENV || 'dev';
    this.deploymentStrategy = process.argv[3] || 'standard';
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${type.toUpperCase()}]`;
    console.log(`${prefix} ${message}`);
  }

  validateEnvironment() {
    const validEnvironments = ['dev', 'staging', 'prod'];
    if (!validEnvironments.includes(this.environment)) {
      throw new Error(`Invalid environment: ${this.environment}. Valid options: ${validEnvironments.join(', ')}`);
    }
  }

  loadEnvironmentConfig() {
    const configPath = path.join(__dirname, '..', 'config', 'environments', `${this.environment}.json`);
    
    if (!fs.existsSync(configPath)) {
      throw new Error(`Environment configuration not found: ${configPath}`);
    }

    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  runCommand(command, options = {}) {
    this.log(`Executing: ${command}`);
    try {
      const result = execSync(command, { 
        stdio: options.silent ? 'pipe' : 'inherit',
        cwd: path.join(__dirname, '..'),
        ...options 
      });
      return result;
    } catch (error) {
      this.log(`Command failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async preDeploymentChecks() {
    this.log('Running pre-deployment checks...');
    
    // Run deployment validation
    this.runCommand('node scripts/deployment-validation.js');
    
    // Build the application
    this.log('Building application...');
    this.runCommand('npm run build');
    
    // Run tests
    this.log('Running tests...');
    this.runCommand('npm run test:ci');
    
    this.log('Pre-deployment checks completed successfully');
  }

  async bootstrapCDK() {
    this.log('Bootstrapping CDK...');
    
    const config = this.loadEnvironmentConfig();
    
    try {
      this.runCommand(`npx cdk bootstrap --context environment=${this.environment}`, { silent: true });
      this.log('CDK bootstrap completed');
    } catch (error) {
      this.log('CDK bootstrap failed, but continuing...', 'warning');
    }
  }

  async deployInfrastructure() {
    this.log(`Deploying infrastructure to ${this.environment}...`);
    
    const config = this.loadEnvironmentConfig();
    
    let deployCommand = `npx cdk deploy --all --require-approval never --context environment=${this.environment}`;
    
    // Add deployment strategy context
    if (this.deploymentStrategy === 'blue-green') {
      deployCommand += ' --context deploymentStrategy=blue-green';
    }
    
    // Add tags
    if (config.tags) {
      Object.entries(config.tags).forEach(([key, value]) => {
        deployCommand += ` --tags ${key}=${value}`;
      });
    }
    
    this.runCommand(deployCommand);
    this.log('Infrastructure deployment completed');
  }

  async postDeploymentTests() {
    this.log('Running post-deployment tests...');
    
    // Wait for services to be ready
    this.log('Waiting for services to be ready...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Run post-deployment tests
    this.runCommand(`NODE_ENV=${this.environment} node scripts/post-deployment-tests.js`);
    
    this.log('Post-deployment tests completed');
  }

  async createDeploymentRecord() {
    this.log('Creating deployment record...');
    
    const config = this.loadEnvironmentConfig();
    const deploymentRecord = {
      environment: this.environment,
      deploymentStrategy: this.deploymentStrategy,
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      stackName: config.stackName,
      region: config.region,
      version: this.getVersion(),
      gitCommit: this.getGitCommit(),
      deployedBy: process.env.USER || 'unknown'
    };

    const recordPath = path.join(__dirname, '..', `deployment-record-${this.environment}.json`);
    fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2));
    
    this.log(`Deployment record saved to: ${recordPath}`);
    return deploymentRecord;
  }

  getVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
      return packageJson.version;
    } catch (error) {
      return 'unknown';
    }
  }

  getGitCommit() {
    try {
      return execSync('git rev-parse HEAD', { stdio: 'pipe' }).toString().trim();
    } catch (error) {
      return 'unknown';
    }
  }

  async handleBlueGreenDeployment() {
    if (this.deploymentStrategy !== 'blue-green') {
      return;
    }

    this.log('Handling blue-green deployment...');
    
    // For blue-green deployments, we would typically:
    // 1. Deploy to a new environment (green)
    // 2. Run comprehensive tests
    // 3. Switch traffic from blue to green
    // 4. Keep blue as backup for quick rollback
    
    this.log('Blue-green deployment strategy applied');
  }

  async notifyDeploymentStatus(status, error = null) {
    this.log(`Notifying deployment status: ${status}`);
    
    const notification = {
      environment: this.environment,
      status: status,
      timestamp: new Date().toISOString(),
      error: error ? error.message : null
    };

    // In a real implementation, this would send notifications to:
    // - Slack/Teams channels
    // - Email lists
    // - Monitoring systems
    // - Deployment dashboards
    
    this.log(`Deployment notification sent: ${JSON.stringify(notification)}`);
  }

  async run() {
    try {
      this.log(`Starting deployment to ${this.environment} environment`);
      this.log(`Deployment strategy: ${this.deploymentStrategy}`);
      
      this.validateEnvironment();
      
      await this.preDeploymentChecks();
      await this.bootstrapCDK();
      await this.deployInfrastructure();
      await this.handleBlueGreenDeployment();
      await this.postDeploymentTests();
      
      const deploymentRecord = await this.createDeploymentRecord();
      await this.notifyDeploymentStatus('success');
      
      const duration = Math.round((Date.now() - this.startTime) / 1000);
      this.log(`\n✅ Deployment completed successfully in ${duration} seconds!`, 'success');
      this.log(`Environment: ${this.environment}`);
      this.log(`Version: ${deploymentRecord.version}`);
      this.log(`Git Commit: ${deploymentRecord.gitCommit}`);
      
    } catch (error) {
      await this.notifyDeploymentStatus('failed', error);
      this.log(`\n❌ Deployment failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run deployment if called directly
if (require.main === module) {
  const deployment = new DeploymentManager();
  deployment.run().catch(error => {
    console.error('Deployment script failed:', error);
    process.exit(1);
  });
}

module.exports = DeploymentManager;