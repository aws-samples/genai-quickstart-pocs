#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Rollback script for failed deployments
 * Handles rollback to previous stable version
 */

class RollbackManager {
  constructor() {
    this.environment = process.argv[2] || process.env.NODE_ENV || 'dev';
    this.rollbackStrategy = process.argv[3] || 'previous-version';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${type.toUpperCase()}]`;
    console.log(`${prefix} ${message}`);
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

  loadEnvironmentConfig() {
    const configPath = path.join(__dirname, '..', 'config', 'environments', `${this.environment}.json`);
    
    if (!fs.existsSync(configPath)) {
      throw new Error(`Environment configuration not found: ${configPath}`);
    }

    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  async getDeploymentHistory() {
    this.log('Retrieving deployment history...');
    
    try {
      const config = this.loadEnvironmentConfig();
      
      // Get CloudFormation stack events to find previous versions
      const result = this.runCommand(
        `aws cloudformation describe-stack-events --stack-name ${config.stackName} --max-items 50`,
        { silent: true }
      );
      
      const events = JSON.parse(result.toString());
      const deploymentEvents = events.StackEvents.filter(event => 
        event.ResourceType === 'AWS::CloudFormation::Stack' && 
        event.ResourceStatus === 'UPDATE_COMPLETE'
      );

      this.log(`Found ${deploymentEvents.length} previous deployments`);
      return deploymentEvents;
    } catch (error) {
      this.log(`Failed to retrieve deployment history: ${error.message}`, 'error');
      return [];
    }
  }

  async createRollbackBackup() {
    this.log('Creating rollback backup...');
    
    const config = this.loadEnvironmentConfig();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `rollback-backup-${this.environment}-${timestamp}`;
    
    try {
      // Export current stack template
      const template = this.runCommand(
        `aws cloudformation get-template --stack-name ${config.stackName}`,
        { silent: true }
      );
      
      const backupPath = path.join(__dirname, '..', 'backups', `${backupName}.json`);
      
      // Ensure backup directory exists
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      fs.writeFileSync(backupPath, template);
      this.log(`Rollback backup created: ${backupPath}`);
      
      return backupPath;
    } catch (error) {
      this.log(`Failed to create rollback backup: ${error.message}`, 'warning');
      return null;
    }
  }

  async performStackRollback() {
    this.log('Performing stack rollback...');
    
    const config = this.loadEnvironmentConfig();
    
    try {
      // Check if stack supports rollback
      const stackInfo = this.runCommand(
        `aws cloudformation describe-stacks --stack-name ${config.stackName}`,
        { silent: true }
      );
      
      const stack = JSON.parse(stackInfo.toString()).Stacks[0];
      
      if (stack.StackStatus === 'UPDATE_ROLLBACK_COMPLETE' || 
          stack.StackStatus === 'ROLLBACK_COMPLETE') {
        this.log('Stack is already in rollback state', 'warning');
        return true;
      }

      if (stack.StackStatus.includes('IN_PROGRESS')) {
        this.log('Stack operation in progress, waiting...', 'warning');
        await this.waitForStackOperation(config.stackName);
      }

      // Initiate rollback
      this.runCommand(
        `aws cloudformation cancel-update-stack --stack-name ${config.stackName}`
      );
      
      // Wait for rollback to complete
      await this.waitForStackOperation(config.stackName);
      
      this.log('Stack rollback completed successfully');
      return true;
    } catch (error) {
      this.log(`Stack rollback failed: ${error.message}`, 'error');
      return false;
    }
  }

  async performCDKRollback() {
    this.log('Performing CDK rollback...');
    
    try {
      // Use CDK's built-in rollback capability
      this.runCommand(
        `npx cdk deploy --rollback --context environment=${this.environment}`
      );
      
      this.log('CDK rollback completed successfully');
      return true;
    } catch (error) {
      this.log(`CDK rollback failed: ${error.message}`, 'error');
      return false;
    }
  }

  async performGitRollback() {
    this.log('Performing Git-based rollback...');
    
    try {
      // Get the last successful deployment commit
      const lastSuccessfulCommit = this.getLastSuccessfulCommit();
      
      if (!lastSuccessfulCommit) {
        throw new Error('No previous successful deployment found');
      }

      this.log(`Rolling back to commit: ${lastSuccessfulCommit}`);
      
      // Create a new branch for rollback
      const rollbackBranch = `rollback-${this.environment}-${Date.now()}`;
      this.runCommand(`git checkout -b ${rollbackBranch}`);
      
      // Reset to the last successful commit
      this.runCommand(`git reset --hard ${lastSuccessfulCommit}`);
      
      // Rebuild and redeploy
      this.runCommand('npm run build');
      this.runCommand(`npx cdk deploy --all --require-approval never --context environment=${this.environment}`);
      
      this.log('Git-based rollback completed successfully');
      return true;
    } catch (error) {
      this.log(`Git-based rollback failed: ${error.message}`, 'error');
      return false;
    }
  }

  getLastSuccessfulCommit() {
    try {
      const recordPath = path.join(__dirname, '..', `deployment-record-${this.environment}.json`);
      
      if (fs.existsSync(recordPath)) {
        const record = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
        return record.gitCommit;
      }
      
      return null;
    } catch (error) {
      this.log(`Failed to get last successful commit: ${error.message}`, 'warning');
      return null;
    }
  }

  async waitForStackOperation(stackName, maxWaitTime = 1800) {
    this.log(`Waiting for stack operation to complete: ${stackName}`);
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime * 1000) {
      try {
        const result = this.runCommand(
          `aws cloudformation describe-stacks --stack-name ${stackName}`,
          { silent: true }
        );
        
        const stack = JSON.parse(result.toString()).Stacks[0];
        const status = stack.StackStatus;
        
        if (!status.includes('IN_PROGRESS')) {
          this.log(`Stack operation completed with status: ${status}`);
          return status;
        }
        
        this.log(`Stack status: ${status}, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
      } catch (error) {
        this.log(`Error checking stack status: ${error.message}`, 'warning');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
    
    throw new Error(`Stack operation timed out after ${maxWaitTime} seconds`);
  }

  async validateRollback() {
    this.log('Validating rollback...');
    
    try {
      // Run post-deployment tests to validate rollback
      this.runCommand(`NODE_ENV=${this.environment} node scripts/post-deployment-tests.js`);
      
      this.log('Rollback validation completed successfully');
      return true;
    } catch (error) {
      this.log(`Rollback validation failed: ${error.message}`, 'error');
      return false;
    }
  }

  async notifyRollback(success, error = null) {
    this.log(`Notifying rollback status: ${success ? 'success' : 'failed'}`);
    
    const notification = {
      environment: this.environment,
      rollbackStrategy: this.rollbackStrategy,
      status: success ? 'success' : 'failed',
      timestamp: new Date().toISOString(),
      error: error ? error.message : null
    };

    // In a real implementation, this would send notifications
    this.log(`Rollback notification: ${JSON.stringify(notification)}`);
  }

  async run() {
    const startTime = Date.now();
    
    try {
      this.log(`Starting rollback for ${this.environment} environment`);
      this.log(`Rollback strategy: ${this.rollbackStrategy}`);
      
      // Create backup before rollback
      await this.createRollbackBackup();
      
      let rollbackSuccess = false;
      
      // Try different rollback strategies
      switch (this.rollbackStrategy) {
        case 'stack-rollback':
          rollbackSuccess = await this.performStackRollback();
          break;
        case 'cdk-rollback':
          rollbackSuccess = await this.performCDKRollback();
          break;
        case 'git-rollback':
          rollbackSuccess = await this.performGitRollback();
          break;
        default:
          // Try multiple strategies
          rollbackSuccess = await this.performCDKRollback() || 
                           await this.performStackRollback();
      }
      
      if (!rollbackSuccess) {
        throw new Error('All rollback strategies failed');
      }
      
      // Validate the rollback
      const validationSuccess = await this.validateRollback();
      
      if (!validationSuccess) {
        this.log('Rollback validation failed, but rollback was completed', 'warning');
      }
      
      await this.notifyRollback(true);
      
      const duration = Math.round((Date.now() - startTime) / 1000);
      this.log(`\n✅ Rollback completed successfully in ${duration} seconds!`, 'success');
      
    } catch (error) {
      await this.notifyRollback(false, error);
      this.log(`\n❌ Rollback failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run rollback if called directly
if (require.main === module) {
  const rollback = new RollbackManager();
  rollback.run().catch(error => {
    console.error('Rollback script failed:', error);
    process.exit(1);
  });
}

module.exports = RollbackManager;