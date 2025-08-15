# Windows Setup Guide - Complete Windows Deployment Instructions

## ⚠️ Important Notice
**This Windows deployment guide has not been fully tested. The deployment has only been validated on macOS environments. Use this guide as reference, but expect potential issues that may require troubleshooting.**

## 🪟 Windows Deployment Overview

This guide provides comprehensive instructions for deploying the Advisor Assistant POC on Windows environments, covering multiple deployment approaches and troubleshooting common Windows-specific issues.

### 🎯 Supported Windows Deployment Methods

1. **Git Bash + Docker Desktop** (Recommended)
2. **Windows Subsystem for Linux 2 (WSL2)**
3. **PowerShell with Docker Desktop** (Alternative)
4. **Native Windows Command Prompt** (Limited support)

## 🛠️ Prerequisites for All Methods

### Required Software
- **Windows 10/11** (64-bit)
- **Docker Desktop for Windows** (latest version)
- **AWS CLI v2** for Windows
- **Node.js 18+** for Windows
- **AWS Bedrock Claude 3.5 Sonnet access** (must be enabled in AWS console)

### Optional but Recommended
- **Git for Windows** (includes Git Bash)
- **Windows Terminal** (enhanced command line experience)
- **Visual Studio Code** (for code editing)

### AWS Bedrock Model Access Setup
Before deployment, enable Claude 3.5 Sonnet access:
1. Open [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. Go to "Model access" → "Modify model access"
3. Select "Anthropic Claude 3.5 Sonnet"
4. Complete use case form and submit

## 🚀 Method 1: Git Bash + Docker Desktop (Recommended)

### Why This Method?
- ✅ Uses familiar bash commands from deployment scripts
- ✅ Most compatible with existing deployment scripts
- ✅ Easy to follow existing documentation
- ✅ Best for developers familiar with Unix/Linux commands

### Step 1: Install Prerequisites

#### Install Git for Windows
1. Download from: https://git-scm.com/download/win
2. During installation, select:
   - ✅ "Git Bash Here" context menu option
   - ✅ "Use Git from Git Bash only" or "Use Git from the Windows Command Prompt"
   - ✅ "Checkout Windows-style, commit Unix-style line endings"

#### Install Docker Desktop
1. Download from: https://www.docker.com/products/docker-desktop
2. Install with default settings
3. Enable WSL2 backend if prompted
4. Start Docker Desktop and wait for it to be ready

#### Install AWS CLI v2
1. Download from: https://aws.amazon.com/cli/
2. Run the installer: `AWSCLIV2.msi`
3. Verify installation: Open Git Bash and run `aws --version`

#### Install Node.js
1. Download from: https://nodejs.org/ (LTS version)
2. Install with default settings
3. Verify: Open Git Bash and run `node --version` and `npm --version`

### Step 2: Configure AWS CLI
```bash
# Open Git Bash and configure AWS
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-east-1)
# Enter default output format (json)
```

### Step 3: Clone and Deploy
```bash
# Open Git Bash
# Navigate to your desired directory
cd /c/Users/YourUsername/Documents

# Clone the repository
git clone <your-repository-url>
cd advisor-assistant-poc

# Make scripts executable
chmod +x deploy-with-tests.sh
chmod +x scripts/*.sh

# Deploy the application
./deploy-with-tests.sh poc us-east-1
```

### Troubleshooting Git Bash Method

#### Issue: "Permission denied" when running scripts
```bash
# Solution: Make scripts executable
chmod +x deploy-with-tests.sh
chmod +x scripts/*.sh
```

#### Issue: Docker commands not found
```bash
# Solution: Ensure Docker Desktop is running
# Check if Docker is available
docker --version

# If not found, restart Docker Desktop
```

#### Issue: AWS CLI not found
```bash
# Solution: Add AWS CLI to PATH or reinstall
# Check current PATH
echo $PATH

# If AWS CLI not in PATH, add it manually or reinstall
```

## 🐧 Method 2: Windows Subsystem for Linux 2 (WSL2)

### Why This Method?
- ✅ Full Linux environment on Windows
- ✅ Native bash script execution
- ✅ Better performance for Docker operations
- ✅ Ideal for developers who prefer Linux tools

### Step 1: Install WSL2

#### Enable WSL2
```powershell
# Run PowerShell as Administrator
wsl --install

# Or if WSL is already installed:
wsl --set-default-version 2
wsl --install -d Ubuntu
```

#### Install Ubuntu
```powershell
# Install Ubuntu (recommended distribution)
wsl --install -d Ubuntu

# Launch Ubuntu and create user account
# Follow the prompts to create username and password
```

### Step 2: Configure WSL2 Environment

#### Update Ubuntu packages
```bash
# Inside WSL2 Ubuntu terminal
sudo apt update && sudo apt upgrade -y
```

#### Install required tools
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install Docker (if not using Docker Desktop integration)
# Note: Docker Desktop for Windows can integrate with WSL2
```

### Step 3: Configure Docker Desktop Integration
1. Open Docker Desktop settings
2. Go to "Resources" → "WSL Integration"
3. Enable integration with Ubuntu
4. Apply & Restart

### Step 4: Deploy from WSL2
```bash
# Configure AWS CLI
aws configure

# Clone repository
git clone <your-repository-url>
cd advisor-assistant-poc

# Deploy
./deploy-with-tests.sh poc us-east-1
```

### WSL2 Troubleshooting

#### Issue: Docker not accessible from WSL2
```bash
# Solution: Enable Docker Desktop WSL2 integration
# Check Docker Desktop settings → Resources → WSL Integration
# Ensure Ubuntu is enabled

# Test Docker access
docker --version
```

#### Issue: File permissions between Windows and WSL2
```bash
# Solution: Work within WSL2 file system
# Use /home/username/ instead of /mnt/c/
cd ~
git clone <your-repository-url>
```

## 💻 Method 3: PowerShell with Docker Desktop

### Why This Method?
- ✅ Native Windows environment
- ✅ No need for additional Linux subsystems
- ✅ Good for Windows-native developers
- ⚠️ Requires PowerShell-specific scripts

### Step 1: Install Prerequisites
- Install Docker Desktop for Windows
- Install AWS CLI v2 for Windows
- Install Node.js for Windows
- Install Git for Windows (optional, for cloning)

### Step 2: PowerShell Deployment Script

The project includes a comprehensive PowerShell deployment script at `scripts/windows-setup.ps1` with the following features:

- ✅ **Comprehensive prerequisite validation**
- ✅ **Platform-specific error handling**
- ✅ **Automatic rollback on failure**
- ✅ **Docker container mode validation**
- ✅ **CloudFormation template validation**
- ✅ **ECS service health monitoring**

#### Script Parameters
```powershell
# Basic deployment
.\scripts\windows-setup.ps1 -Environment poc -Region us-east-1

# With API keys
.\scripts\windows-setup.ps1 -Environment poc -Region us-east-1 -NewsApiKey "your_key" -FredApiKey "your_key"

# Skip validation tests (for urgent deployments)
.\scripts\windows-setup.ps1 -Environment poc -Region us-east-1 -SkipTests

# Force deployment even if validation fails
.\scripts\windows-setup.ps1 -Environment poc -Region us-east-1 -Force
    aws --version | Out-Null
    Write-Host "✅ AWS CLI is available" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install AWS CLI v2." -ForegroundColor Red
    exit 1
}

# Check Node.js
try {
    node --version | Out-Null
    Write-Host "✅ Node.js is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+." -ForegroundColor Red
    exit 1
}

# Set environment variables
$env:ENVIRONMENT = $Environment
$env:AWS_REGION = $Region
if ($ApiKey) {
    $env:API_KEY = $ApiKey
}

Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Cyan

# Deploy security foundation
Write-Host "🔐 Deploying security foundation..." -ForegroundColor Yellow
aws cloudformation deploy `
    --template-file cloudformation/01-security-foundation-poc.yaml `
    --stack-name "advisor-assistant-$Environment-security" `
    --capabilities CAPABILITY_NAMED_IAM `
    --region $Region

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Security foundation deployment failed" -ForegroundColor Red
    exit 1
}

# Create ECR repository
Write-Host "📦 Creating ECR repository..." -ForegroundColor Yellow
$ECR_URI = aws ecr describe-repositories --repository-names "advisor-assistant-$Environment" --region $Region --query 'repositories[0].repositoryUri' --output text 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating new ECR repository..." -ForegroundColor Yellow
    aws ecr create-repository --repository-name "advisor-assistant-$Environment" --region $Region | Out-Null
    $ECR_URI = aws ecr describe-repositories --repository-names "advisor-assistant-$Environment" --region $Region --query 'repositories[0].repositoryUri' --output text
}

Write-Host "ECR URI: $ECR_URI" -ForegroundColor Cyan

# Build and push Docker image
Write-Host "🐳 Building Docker image..." -ForegroundColor Yellow
docker build -t "advisor-assistant-$Environment" .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    exit 1
}

# Login to ECR
Write-Host "🔑 Logging into ECR..." -ForegroundColor Yellow
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $ECR_URI

# Tag and push image
Write-Host "📤 Pushing Docker image..." -ForegroundColor Yellow
docker tag "advisor-assistant-$Environment`:latest" "$ECR_URI`:latest"
docker push "$ECR_URI`:latest"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker push failed" -ForegroundColor Red
    exit 1
}

# Deploy application infrastructure
Write-Host "🏗️ Deploying application infrastructure..." -ForegroundColor Yellow
aws cloudformation deploy `
    --template-file cloudformation/02-application-infrastructure-poc.yaml `
    --stack-name "advisor-assistant-$Environment-app" `
    --capabilities CAPABILITY_NAMED_IAM `
    --parameter-overrides Environment=$Environment `
    --region $Region

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Application infrastructure deployment failed" -ForegroundColor Red
    exit 1
}

# Get ALB DNS name
$ALB_DNS = aws cloudformation describe-stacks `
    --stack-name "advisor-assistant-$Environment-app" `
    --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' `
    --output text `
    --region $Region

Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "Application URL: http://$ALB_DNS" -ForegroundColor Cyan
Write-Host "Health Check: http://$ALB_DNS/api/health" -ForegroundColor Cyan
```

### Step 3: Deploy Using PowerShell

#### Prerequisites Check
```powershell
# Open PowerShell as Administrator (recommended)
# Navigate to project directory
cd C:\Users\YourUsername\Documents\advisor-assistant

# Verify prerequisites
docker --version
aws --version
node --version

# Check Docker is using Linux containers
docker version --format "{{.Server.Os}}"
# Should return "linux", not "windows"
```

#### Run Deployment
```powershell
# Basic deployment (recommended for first-time users)
.\scripts\windows-setup.ps1 -Environment poc -Region us-east-1

# With API keys (optional)
.\scripts\windows-setup.ps1 -Environment poc -Region us-east-1 -NewsApiKey "your_newsapi_key" -FredApiKey "your_fred_key"

# Skip tests for faster deployment (use with caution)
.\scripts\windows-setup.ps1 -Environment poc -Region us-east-1 -SkipTests

# Force deployment even if validation fails (emergency use only)
.\scripts\windows-setup.ps1 -Environment poc -Region us-east-1 -Force
```

#### Deployment Process
The PowerShell script will:
1. ✅ Validate all prerequisites and Windows-specific requirements
2. ✅ Deploy security foundation (VPC, Cognito, KMS)
3. ✅ Create ECR repository for Docker images
4. ✅ Build Docker image for linux/amd64 platform
5. ✅ Push image to ECR with retry logic
6. ✅ Deploy application infrastructure (ECS, DynamoDB, S3)
7. ✅ Update API secrets in AWS Secrets Manager
8. ✅ Wait for ECS service to stabilize and perform health checks
9. ✅ Display deployment information and access URLs

### PowerShell Troubleshooting

#### Issue: Execution policy prevents script execution
```powershell
# Solution: Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or run with bypass
powershell -ExecutionPolicy Bypass -File .\scripts\windows-setup.ps1 -Environment poc -Region us-east-1
```

#### Issue: Docker commands fail in PowerShell
```powershell
# Solution: Ensure Docker Desktop is running and restart PowerShell
# Check Docker status
docker info

# If issues persist, restart Docker Desktop
```

## 🔧 Platform Compatibility Matrix

| Tool/Feature | Git Bash | WSL2 | PowerShell | Cmd |
|--------------|----------|------|------------|-----|
| **Bash Scripts** | ✅ Native | ✅ Native | ❌ No | ❌ No |
| **PowerShell Scripts** | ❌ No | ❌ No | ✅ Native | ✅ Limited |
| **Docker Commands** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **AWS CLI** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Node.js/NPM** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **File Permissions** | ⚠️ Limited | ✅ Full | ⚠️ Limited | ⚠️ Limited |
| **Path Handling** | ✅ Unix-style | ✅ Unix-style | ✅ Windows-style | ✅ Windows-style |

## 🚨 Common Windows Issues & Solutions

> 📖 **For additional troubleshooting beyond Windows-specific issues, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)**

### Issue: Line Ending Problems
**Symptoms**: Scripts fail with "command not found" or syntax errors

**Solution**:
```bash
# Convert line endings using Git
git config --global core.autocrlf true

# Or use dos2unix if available
dos2unix deploy-with-tests.sh
```

### Issue: Path Separator Problems
**Symptoms**: File paths not found, especially in scripts

**Solution**:
```bash
# Use forward slashes in Git Bash
cd /c/Users/YourUsername/Documents

# Use backslashes in PowerShell/Cmd
cd C:\Users\YourUsername\Documents
```

### Issue: Docker Desktop Not Starting
**Symptoms**: "Docker daemon not running" errors

**Solution**:
1. Restart Docker Desktop
2. Check Windows features: Hyper-V, Containers, WSL2
3. Restart Windows if necessary
4. Check Docker Desktop logs in system tray

### Issue: AWS CLI Authentication
**Symptoms**: "Unable to locate credentials" errors

**Solution**:
```bash
# Reconfigure AWS CLI
aws configure

# Check credentials file location
# Windows: C:\Users\YourUsername\.aws\credentials
# Verify credentials are properly formatted
```

### Issue: Port Conflicts
**Symptoms**: "Port already in use" errors

**Solution**:
```powershell
# Check what's using port 3000
netstat -ano | findstr :3000

# Kill process if needed (replace PID)
taskkill /PID 1234 /F
```

### Issue: Firewall/Antivirus Blocking
**Symptoms**: Network timeouts, Docker build failures

**Solution**:
1. Add Docker Desktop to firewall exceptions
2. Add project directory to antivirus exclusions
3. Temporarily disable real-time protection during deployment

## 📋 Windows Deployment Checklist

### Pre-Deployment
- [ ] Windows 10/11 (64-bit) installed
- [ ] Docker Desktop installed and running
- [ ] AWS CLI v2 installed and configured
- [ ] Node.js 18+ installed
- [ ] Git for Windows installed (for Git Bash method)
- [ ] WSL2 enabled (for WSL2 method)
- [ ] PowerShell execution policy configured (for PowerShell method)

### During Deployment
- [ ] Docker Desktop is running
- [ ] No port conflicts (3000, 80, 443)
- [ ] Firewall/antivirus not blocking
- [ ] Stable internet connection
- [ ] AWS credentials properly configured

### Post-Deployment
- [ ] Application health check passes
- [ ] Can access web interface
- [ ] API endpoints responding
- [ ] No error messages in logs
- [ ] Docker containers running properly

## 🎯 Recommended Windows Setup

For the best Windows deployment experience:

1. **Use Git Bash method** for compatibility with existing scripts
2. **Install Windows Terminal** for better command line experience
3. **Use WSL2** if you're comfortable with Linux environments
4. **Keep Docker Desktop updated** to latest version
5. **Use PowerShell method** only if bash is not available

## 📞 Windows-Specific Support

### Getting Help
- Check Docker Desktop logs in system tray
- Use Windows Event Viewer for system-level issues
- Check Windows Defender/antivirus logs
- Verify Windows features are enabled (Hyper-V, Containers)

### Useful Windows Commands
```powershell
# Check Windows version
winver

# Check enabled Windows features
Get-WindowsOptionalFeature -Online | Where-Object {$_.State -eq "Enabled"}

# Check running services
Get-Service | Where-Object {$_.Status -eq "Running"}

# Check network connectivity
Test-NetConnection -ComputerName amazonaws.com -Port 443
```

---

**This Windows setup guide ensures successful deployment across different Windows environments while providing comprehensive troubleshooting support.**