#!/usr/bin/env node

/**
 * Quick Demo Deployment Script
 * 
 * Deploys the Investment AI Agent for demo purposes with minimal configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Investment AI Agent - Quick Demo Deployment');
console.log('===============================================');

// Configuration
const config = {
  environment: 'demo',
  region: process.env.AWS_REGION || 'us-east-1',
  stackName: 'investment-ai-agent-demo',
  enableMocks: process.argv.includes('--mock'),
  minimalDeploy: process.argv.includes('--minimal'),
  costOptimized: process.argv.includes('--cost-optimized')
};

console.log('📋 Demo Configuration:');
console.log(`   Environment: ${config.environment}`);
console.log(`   Region: ${config.region}`);
console.log(`   Stack Name: ${config.stackName}`);
console.log(`   Enable Mocks: ${config.enableMocks}`);
console.log(`   Minimal Deploy: ${config.minimalDeploy}`);
console.log(`   Cost Optimized: ${config.costOptimized}`);
console.log('');

function runCommand(command, description) {
  console.log(`⚡ ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`✅ ${description} completed\n`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

function createDemoConfig() {
  console.log('📝 Creating demo configuration...');
  
  const demoConfig = {
    environment: 'demo',
    aws: {
      region: config.region,
      account: 'current'
    },
    features: {
      enableMonitoring: !config.minimalDeploy,
      enableBackups: false,
      enableMultiAZ: false,
      enableDetailedLogging: !config.costOptimized,
      enableMockResponses: config.enableMocks
    },
    resources: {
      lambda: {
        memorySize: config.costOptimized ? 512 : 1024,
        timeout: config.costOptimized ? 30 : 60
      },
      dynamodb: {
        billingMode: 'PAY_PER_REQUEST',
        pointInTimeRecovery: false
      },
      apiGateway: {
        throttling: {
          rateLimit: 100,
          burstLimit: 200
        }
      }
    }
  };

  const configPath = path.join(__dirname, '..', 'config', 'environments', 'demo.json');
  fs.writeFileSync(configPath, JSON.stringify(demoConfig, null, 2));
  console.log(`✅ Demo configuration created at ${configPath}\n`);
}

function createEnvFile() {
  console.log('📝 Creating environment file...');
  
  const envContent = `# Demo Environment Configuration
NODE_ENV=demo
AWS_REGION=${config.region}
BEDROCK_REGION=${config.region}

# Demo Features
MOCK_AI_RESPONSES=${config.enableMocks}
MOCK_MARKET_DATA=${config.enableMocks}
ENABLE_DETAILED_LOGGING=${!config.costOptimized}

# API Configuration
API_RATE_LIMIT=100
API_BURST_LIMIT=200

# Demo Mode Settings
DEMO_MODE=true
SKIP_AUTH=${config.enableMocks}
`;

  const envPath = path.join(__dirname, '..', '.env.demo');
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Environment file created at ${envPath}\n`);
}

function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...');
  
  try {
    // Check AWS CLI
    execSync('aws --version', { stdio: 'pipe' });
    console.log('✅ AWS CLI is installed');
    
    // Check AWS credentials
    execSync('aws sts get-caller-identity', { stdio: 'pipe' });
    console.log('✅ AWS credentials are configured');
    
    // Check CDK
    execSync('npx cdk --version', { stdio: 'pipe' });
    console.log('✅ AWS CDK is available');
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 18) {
      throw new Error(`Node.js version ${nodeVersion} is too old. Please use Node.js 18 or higher.`);
    }
    console.log(`✅ Node.js version ${nodeVersion} is compatible`);
    
  } catch (error) {
    console.error('❌ Prerequisites check failed:', error.message);
    console.log('\n📋 Please ensure you have:');
    console.log('   - AWS CLI installed and configured');
    console.log('   - Node.js 18+ installed');
    console.log('   - AWS CDK installed (npm install -g aws-cdk)');
    process.exit(1);
  }
  
  console.log('✅ All prerequisites met\n');
}

function deployStack() {
  console.log('🚀 Starting deployment...');
  
  const contextArgs = [
    `--context environment=${config.environment}`,
    `--context region=${config.region}`,
    config.minimalDeploy ? '--context minimal=true' : '',
    config.costOptimized ? '--context costOptimized=true' : '',
    config.enableMocks ? '--context enableMocks=true' : ''
  ].filter(Boolean).join(' ');
  
  const deployCommand = `npx cdk deploy ${config.stackName} --require-approval never ${contextArgs}`;
  
  runCommand(deployCommand, 'CDK deployment');
}

function getStackOutputs() {
  console.log('📋 Retrieving deployment information...');
  
  try {
    const outputs = execSync(`aws cloudformation describe-stacks --stack-name ${config.stackName} --query 'Stacks[0].Outputs' --output json`, { encoding: 'utf8' });
    const parsedOutputs = JSON.parse(outputs);
    
    console.log('🎉 Deployment completed successfully!');
    console.log('=====================================');
    
    parsedOutputs.forEach(output => {
      console.log(`${output.OutputKey}: ${output.OutputValue}`);
    });
    
    console.log('\n🌐 Demo URLs:');
    const apiUrl = parsedOutputs.find(o => o.OutputKey.includes('ApiUrl'))?.OutputValue;
    const webUrl = parsedOutputs.find(o => o.OutputKey.includes('WebUrl'))?.OutputValue;
    
    if (apiUrl) console.log(`   API: ${apiUrl}`);
    if (webUrl) console.log(`   Web Interface: ${webUrl}`);
    
    console.log('\n🧪 Test Commands:');
    if (apiUrl) {
      console.log(`   Health Check: curl ${apiUrl}/health`);
      console.log(`   Generate Ideas: curl -X POST ${apiUrl}/api/v1/ideas/generate -H "Content-Type: application/json" -d '{"investmentHorizon":"medium","riskTolerance":"moderate","sectors":["technology"],"assetClasses":["stocks"],"maximumIdeas":2}'`);
    }
    
  } catch (error) {
    console.log('⚠️  Deployment completed but couldn\'t retrieve outputs. Check AWS Console for details.');
  }
}

function showCleanupInstructions() {
  console.log('\n🧹 Cleanup Instructions:');
  console.log('========================');
  console.log('To remove all demo resources and avoid charges:');
  console.log(`   npx cdk destroy ${config.stackName}`);
  console.log('');
}

// Main execution
async function main() {
  try {
    checkPrerequisites();
    
    // Create demo configuration
    createDemoConfig();
    createEnvFile();
    
    // Install dependencies
    runCommand('npm ci', 'Installing dependencies');
    
    // Build the project
    runCommand('npm run build', 'Building TypeScript');
    
    // Bootstrap CDK if needed
    try {
      execSync(`aws cloudformation describe-stacks --stack-name CDKToolkit --region ${config.region}`, { stdio: 'pipe' });
      console.log('✅ CDK already bootstrapped\n');
    } catch {
      runCommand(`npx cdk bootstrap --region ${config.region}`, 'Bootstrapping CDK');
    }
    
    // Deploy the stack
    deployStack();
    
    // Get deployment outputs
    getStackOutputs();
    
    // Show cleanup instructions
    showCleanupInstructions();
    
    console.log('🎉 Demo deployment completed successfully!');
    
  } catch (error) {
    console.error('💥 Demo deployment failed:', error.message);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: node demo-deploy.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --mock           Enable mock responses for faster testing');
  console.log('  --minimal        Deploy minimal features only');
  console.log('  --cost-optimized Optimize for lowest cost');
  console.log('  --help, -h       Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node demo-deploy.js                    # Full demo deployment');
  console.log('  node demo-deploy.js --mock             # With mock responses');
  console.log('  node demo-deploy.js --minimal --mock   # Minimal with mocks');
  console.log('  node demo-deploy.js --cost-optimized   # Lowest cost');
  process.exit(0);
}

// Run the deployment
main();