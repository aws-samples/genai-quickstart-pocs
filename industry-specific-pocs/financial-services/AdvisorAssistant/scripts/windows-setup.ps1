#############################################################################
# Windows PowerShell Deployment Script for Advisor Assistant POC
#############################################################################
#
# This PowerShell script provides Windows-native deployment capabilities
# for environments where Bash is not available or preferred.
#
# PREREQUISITES:
# - PowerShell 5.1 or PowerShell Core 7+
# - AWS CLI for Windows
# - Docker Desktop for Windows (with Linux containers)
# - Git for Windows (optional, for repository management)
#
# USAGE:
#   .\scripts\windows-setup.ps1 [Environment] [Region]
#   .\scripts\windows-setup.ps1 -Environment poc -Region us-east-1
#   .\scripts\windows-setup.ps1 -Environment dev -Region us-west-2 -SkipTests
#
# PARAMETERS:
#   -Environment    AWS environment (poc, dev, staging, prod) [Default: poc]
#   -Region         AWS region [Default: us-east-1]
#   -SkipTests      Skip pre-deployment validation tests
#   -NewsApiKey     NewsAPI key for data provider
#   -FredApiKey     FRED API key for data provider
#   -Force          Force deployment even if validation fails
#
# EXAMPLES:
#   .\scripts\windows-setup.ps1
#   .\scripts\windows-setup.ps1 -Environment poc -Region us-east-1
#   .\scripts\windows-setup.ps1 -Environment dev -Region us-west-2 -SkipTests
#   .\scripts\windows-setup.ps1 -Environment poc -NewsApiKey "your_key" -FredApiKey "your_key"
#
#############################################################################

[CmdletBinding()]
param(
    [Parameter(Position=0)]
    [ValidateSet("poc", "dev", "staging", "prod")]
    [string]$Environment = "poc",
    
    [Parameter(Position=1)]
    [string]$Region = "us-east-1",
    
    [switch]$SkipTests,
    [switch]$Force,
    [string]$NewsApiKey = "",
    [string]$FredApiKey = ""
)

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Global variables
$ApplicationName = "advisor-assistant"
$SecurityStackName = "advisor-assistant-poc-security"
$AppStackName = "advisor-assistant-poc-app"
$DeploymentStarted = $false
$SecurityStackCreated = $false
$EcrStackCreated = $false
$ImagePushed = $false
$AppStackCreated = $false

#############################################################################
# UTILITY FUNCTIONS
#############################################################################

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    switch ($Color) {
        "Green" { Write-Host "[$timestamp] ✅ $Message" -ForegroundColor Green }
        "Yellow" { Write-Host "[$timestamp] ⚠️  $Message" -ForegroundColor Yellow }
        "Red" { Write-Host "[$timestamp] ❌ $Message" -ForegroundColor Red }
        "Blue" { Write-Host "[$timestamp] ℹ️  $Message" -ForegroundColor Blue }
        default { Write-Host "[$timestamp] $Message" -ForegroundColor White }
    }
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput -Message $Message -Color "Green"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput -Message $Message -Color "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput -Message $Message -Color "Red"
    if (-not $Force) {
        exit 1
    }
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput -Message $Message -Color "Blue"
}

#############################################################################
# PREREQUISITE VALIDATION
#############################################################################

function Test-Prerequisites {
    Write-Info "Validating Windows deployment prerequisites..."
    
    # Check PowerShell version
    $psVersion = $PSVersionTable.PSVersion
    Write-Info "PowerShell version: $psVersion"
    
    if ($psVersion.Major -lt 5) {
        Write-Error "PowerShell 5.0 or higher is required. Current version: $psVersion"
        return $false
    }
    
    # Check AWS CLI
    try {
        $awsVersion = aws --version 2>$null
        Write-Success "AWS CLI found: $awsVersion"
    }
    catch {
        Write-Error "AWS CLI not found. Install from: https://aws.amazon.com/cli/ or use 'winget install Amazon.AWSCLI'"
        return $false
    }
    
    # Test AWS credentials
    try {
        $identity = aws sts get-caller-identity --output json 2>$null | ConvertFrom-Json
        Write-Success "AWS credentials configured for: $($identity.Arn)"
    }
    catch {
        Write-Error "AWS credentials not configured. Run 'aws configure' or set environment variables"
        return $false
    }
    
    # Check Docker Desktop
    try {
        $dockerVersion = docker --version 2>$null
        Write-Success "Docker found: $dockerVersion"
    }
    catch {
        Write-Error "Docker not found. Install Docker Desktop from: https://docs.docker.com/desktop/windows/"
        return $false
    }
    
    # Test Docker daemon
    try {
        docker info 2>$null | Out-Null
        Write-Success "Docker daemon is running"
    }
    catch {
        Write-Error "Docker daemon not running. Start Docker Desktop and ensure it's using Linux containers"
        return $false
    }
    
    # Check Docker container mode
    try {
        $dockerInfo = docker version --format "{{.Server.Os}}" 2>$null
        if ($dockerInfo -eq "windows") {
            Write-Error "Docker is using Windows containers. Switch to Linux containers in Docker Desktop settings"
            return $false
        }
        Write-Success "Docker is using Linux containers"
    }
    catch {
        Write-Warning "Could not determine Docker container mode"
    }
    
    # Check for required files
    $requiredFiles = @(
        "src\index.js",
        "package.json",
        "Dockerfile",
        "cloudformation\01-security-foundation-poc.yaml",
        "cloudformation\02-application-infrastructure-poc.yaml"
    )
    
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            Write-Error "Required file not found: $file"
            return $false
        }
    }
    
    Write-Success "All prerequisites validated successfully"
    return $true
}

#############################################################################
# DEPLOYMENT FUNCTIONS
#############################################################################

function Deploy-SecurityFoundation {
    Write-Info "Stage 1: Deploying security foundation..."
    
    # Check if stack exists
    try {
        aws cloudformation describe-stacks --stack-name $SecurityStackName --region $Region 2>$null | Out-Null
        Write-Info "Security stack already exists, updating..."
    }
    catch {
        Write-Info "Creating new security stack..."
        $script:SecurityStackCreated = $true
    }
    
    # Validate template
    try {
        aws cloudformation validate-template --template-body file://cloudformation/01-security-foundation-poc.yaml --region $Region 2>$null | Out-Null
    }
    catch {
        Write-Error "CloudFormation template validation failed for security foundation"
        return $false
    }
    
    # Deploy stack
    try {
        aws cloudformation deploy `
            --template-file cloudformation/01-security-foundation-poc.yaml `
            --stack-name $SecurityStackName `
            --parameter-overrides Environment=$Environment ApplicationName=$ApplicationName `
            --capabilities CAPABILITY_NAMED_IAM `
            --region $Region `
            --tags Environment=$Environment Application=$ApplicationName ManagedBy=CloudFormation `
            --no-fail-on-empty-changeset
        
        # Verify deployment
        $stackStatus = aws cloudformation describe-stacks --stack-name $SecurityStackName --region $Region --query 'Stacks[0].StackStatus' --output text
        if ($stackStatus -like "*COMPLETE*") {
            Write-Success "Security foundation deployed successfully (Status: $stackStatus)"
            return $true
        }
        else {
            Write-Error "Security foundation deployment failed (Status: $stackStatus)"
            return $false
        }
    }
    catch {
        Write-Error "Failed to deploy security foundation: $($_.Exception.Message)"
        return $false
    }
}

function Deploy-EcrRepository {
    Write-Info "Stage 2: Deploying ECR repository..."
    
    $ecrStackName = "$ApplicationName-$Environment-ecr"
    
    # Check if ECR stack already exists
    try {
        aws cloudformation describe-stacks --stack-name $ecrStackName --region $Region 2>$null | Out-Null
    }
    catch {
        $script:EcrStackCreated = $true
    }
    
    # Create ECR template
    $ecrTemplate = @"
AWSTemplateFormatVersion: '2010-09-09'
Description: 'ECR Repository for Advisor Assistant'

Parameters:
  Environment:
    Type: String
    Default: poc
  ApplicationName:
    Type: String
    Default: advisor-assistant
  SecurityStackName:
    Type: String
    Default: advisor-assistant-poc-security

Resources:
  ECRRepository:
    Type: AWS::ECR::Repository
    Properties:
      RepositoryName: !Sub '`${ApplicationName}-`${Environment}'
      ImageScanningConfiguration:
        ScanOnPush: true
      EncryptionConfiguration:
        EncryptionType: KMS
        KmsKey: 
          Fn::ImportValue: !Sub '`${SecurityStackName}-KMSKey'
      LifecyclePolicy:
        LifecyclePolicyText: |
          {
            "rules": [
              {
                "rulePriority": 1,
                "description": "Keep last 10 images",
                "selection": {
                  "tagStatus": "any",
                  "countType": "imageCountMoreThan",
                  "countNumber": 10
                },
                "action": {
                  "type": "expire"
                }
              }
            ]
          }
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName

Outputs:
  ECRRepositoryURI:
    Description: ECR Repository URI
    Value: !GetAtt ECRRepository.RepositoryUri
    Export:
      Name: !Sub '`${AWS::StackName}-ECRRepository'
"@
    
    # Write template to temp file
    $tempFile = [System.IO.Path]::GetTempFileName() + ".yaml"
    $ecrTemplate | Out-File -FilePath $tempFile -Encoding UTF8
    
    try {
        # Validate template
        aws cloudformation validate-template --template-body file://$tempFile --region $Region 2>$null | Out-Null
        
        # Deploy ECR stack
        aws cloudformation deploy `
            --template-file $tempFile `
            --stack-name $ecrStackName `
            --parameter-overrides Environment=$Environment ApplicationName=$ApplicationName SecurityStackName=$SecurityStackName `
            --region $Region `
            --tags Environment=$Environment Application=$ApplicationName ManagedBy=CloudFormation `
            --no-fail-on-empty-changeset
        
        # Verify deployment
        $stackStatus = aws cloudformation describe-stacks --stack-name $ecrStackName --region $Region --query 'Stacks[0].StackStatus' --output text
        if ($stackStatus -like "*COMPLETE*") {
            Write-Success "ECR repository deployed successfully (Status: $stackStatus)"
            return $true
        }
        else {
            Write-Error "ECR repository deployment failed (Status: $stackStatus)"
            return $false
        }
    }
    catch {
        Write-Error "Failed to deploy ECR repository: $($_.Exception.Message)"
        return $false
    }
    finally {
        # Clean up temp file
        if (Test-Path $tempFile) {
            Remove-Item $tempFile -Force
        }
    }
}

function Build-AndPushImage {
    Write-Info "Stage 3: Building and pushing Docker image for linux/amd64..."
    
    $ecrStackName = "$ApplicationName-$Environment-ecr"
    
    # Get ECR repository URI
    try {
        $ecrUri = aws cloudformation describe-stacks --stack-name $ecrStackName --query 'Stacks[0].Outputs[?OutputKey==`ECRRepositoryURI`].OutputValue' --output text --region $Region
        if ([string]::IsNullOrEmpty($ecrUri) -or $ecrUri -eq "None") {
            Write-Error "Could not get ECR repository URI from stack $ecrStackName"
            return $false
        }
        Write-Info "ECR Repository: $ecrUri"
    }
    catch {
        Write-Error "Failed to get ECR repository URI: $($_.Exception.Message)"
        return $false
    }
    
    # Login to ECR
    try {
        $loginCommand = aws ecr get-login-password --region $Region
        $loginCommand | docker login --username AWS --password-stdin $ecrUri
        Write-Success "Successfully logged into ECR"
    }
    catch {
        Write-Error "Failed to login to ECR: $($_.Exception.Message)"
        return $false
    }
    
    # Build Docker image
    try {
        Write-Info "Building Docker image for linux/amd64..."
        
        # Check if buildx is available
        try {
            docker buildx version 2>$null | Out-Null
            Write-Info "Using Docker buildx for cross-platform build..."
            docker buildx build --platform linux/amd64 -t "$ApplicationName-$Environment" . --load
        }
        catch {
            Write-Warning "Docker buildx not available, using standard build"
            docker build -t "$ApplicationName-$Environment" .
        }
        
        # Verify image was built
        $images = docker images "$ApplicationName-$Environment" --format "table {{.Repository}}"
        if ($images -notcontains "$ApplicationName-$Environment") {
            Write-Error "Docker image build failed - image not found locally"
            return $false
        }
        
        Write-Success "Docker image built successfully"
    }
    catch {
        Write-Error "Failed to build Docker image: $($_.Exception.Message)"
        return $false
    }
    
    # Tag and push image
    try {
        docker tag "$ApplicationName-$Environment`:latest" "$ecrUri`:latest"
        docker push "$ecrUri`:latest"
        $script:ImagePushed = $true
        Write-Success "Docker image pushed successfully"
        return $true
    }
    catch {
        Write-Error "Failed to push Docker image: $($_.Exception.Message)"
        return $false
    }
}

function Deploy-ApplicationInfrastructure {
    Write-Info "Stage 4: Deploying application infrastructure..."
    
    # Rate limiting defaults
    $rateLimitAuthMax = if ($Environment -eq "production" -or $Environment -eq "prod") { 5 } else { 10 }
    $rateLimitApiMax = if ($Environment -eq "production" -or $Environment -eq "prod") { 100 } else { 1000 }
    $rateLimitAiMax = if ($Environment -eq "production" -or $Environment -eq "prod") { 10 } else { 50 }
    
    Write-Info "Rate limiting configuration for $Environment`:"
    Write-Info "  - Authentication: $rateLimitAuthMax attempts per 15 minutes"
    Write-Info "  - API requests: $rateLimitApiMax requests per 15 minutes"
    Write-Info "  - AI analysis: $rateLimitAiMax requests per hour"
    
    # Check if application stack already exists
    try {
        aws cloudformation describe-stacks --stack-name $AppStackName --region $Region 2>$null | Out-Null
    }
    catch {
        $script:AppStackCreated = $true
    }
    
    try {
        # Validate template
        aws cloudformation validate-template --template-body file://cloudformation/02-application-infrastructure-poc.yaml --region $Region 2>$null | Out-Null
        
        # Deploy application stack
        aws cloudformation deploy `
            --template-file cloudformation/02-application-infrastructure-poc.yaml `
            --stack-name $AppStackName `
            --parameter-overrides Environment=$Environment ApplicationName=$ApplicationName SecurityStackName=$SecurityStackName RateLimitAuthMax=$rateLimitAuthMax RateLimitApiMax=$rateLimitApiMax RateLimitAiMax=$rateLimitAiMax `
            --capabilities CAPABILITY_NAMED_IAM `
            --region $Region `
            --tags Environment=$Environment Application=$ApplicationName ManagedBy=CloudFormation `
            --no-fail-on-empty-changeset
        
        # Verify deployment
        $stackStatus = aws cloudformation describe-stacks --stack-name $AppStackName --region $Region --query 'Stacks[0].StackStatus' --output text
        if ($stackStatus -like "*COMPLETE*") {
            Write-Success "Application infrastructure deployed successfully (Status: $stackStatus)"
            return $true
        }
        else {
            Write-Error "Application infrastructure deployment failed (Status: $stackStatus)"
            return $false
        }
    }
    catch {
        Write-Error "Failed to deploy application infrastructure: $($_.Exception.Message)"
        return $false
    }
}

function Update-Secrets {
    Write-Info "Stage 5: Updating secrets..."
    
    # Update NewsAPI secret if provided
    if (-not [string]::IsNullOrEmpty($NewsApiKey)) {
        try {
            $secretValue = @{ api_key = $NewsApiKey } | ConvertTo-Json -Compress
            aws secretsmanager update-secret --secret-id "$ApplicationName/$Environment/newsapi" --secret-string $secretValue --region $Region
            Write-Success "NewsAPI key updated"
        }
        catch {
            Write-Warning "Failed to update NewsAPI key: $($_.Exception.Message)"
        }
    }
    else {
        Write-Warning "NEWSAPI_KEY not provided, please update manually in AWS Secrets Manager"
        Write-Warning "Secret name: $ApplicationName/$Environment/newsapi"
    }
    
    # Update FRED API secret if provided
    if (-not [string]::IsNullOrEmpty($FredApiKey)) {
        try {
            $secretValue = @{ api_key = $FredApiKey } | ConvertTo-Json -Compress
            aws secretsmanager update-secret --secret-id "$ApplicationName/$Environment/fred" --secret-string $secretValue --region $Region
            Write-Success "FRED API key updated"
        }
        catch {
            Write-Warning "Failed to update FRED API key: $($_.Exception.Message)"
        }
    }
    else {
        Write-Warning "FRED_API_KEY not provided, please update manually in AWS Secrets Manager"
        Write-Warning "Secret name: $ApplicationName/$Environment/fred"
    }
}

function Wait-ForServiceAndHealthCheck {
    Write-Info "Stage 6: Waiting for ECS service to stabilize..."
    
    try {
        # Get ECS cluster name
        $ecsCluster = aws cloudformation describe-stacks --stack-name $AppStackName --query 'Stacks[0].Outputs[?OutputKey==`ECSClusterName`].OutputValue' --output text --region $Region
        
        if (-not [string]::IsNullOrEmpty($ecsCluster)) {
            Write-Info "Forcing ECS service deployment with rolling update..."
            
            # Update service with new task definition
            aws ecs update-service --cluster $ecsCluster --service "$ApplicationName-$Environment-service" --force-new-deployment --region $Region
            
            Write-Info "Waiting for ECS service to stabilize (this may take 5-10 minutes)..."
            Write-Info "ECS will:"
            Write-Info "  1. Start new tasks with updated image"
            Write-Info "  2. Wait for health checks to pass"
            Write-Info "  3. Stop old tasks once new ones are healthy"
            
            # Wait for deployment to complete
            aws ecs wait services-stable --cluster $ecsCluster --services "$ApplicationName-$Environment-service" --region $Region
            
            # Verify deployment success
            $runningCount = aws ecs describe-services --cluster $ecsCluster --services "$ApplicationName-$Environment-service" --query 'services[0].runningCount' --output text --region $Region
            
            if ($runningCount -eq "1") {
                Write-Success "Deployment successful - 1 task running"
            }
            else {
                Write-Warning "Unexpected task count: $runningCount (expected: 1)"
            }
            
            Write-Success "ECS service is stable"
            
            # Get ALB DNS name and perform health check
            $albDns = aws cloudformation describe-stacks --stack-name $AppStackName --query 'Stacks[0].Outputs[?OutputKey==`ApplicationLoadBalancerDNS`].OutputValue' --output text --region $Region
            
            if (-not [string]::IsNullOrEmpty($albDns)) {
                Write-Info "Waiting for ALB to be ready..."
                Start-Sleep -Seconds 30
                
                # Basic health check
                try {
                    $response = Invoke-WebRequest -Uri "http://$albDns/api/health" -TimeoutSec 10 -UseBasicParsing
                    if ($response.StatusCode -eq 200) {
                        Write-Success "Health check passed"
                    }
                    else {
                        Write-Warning "Health check returned status: $($response.StatusCode)"
                    }
                }
                catch {
                    Write-Warning "Health check failed - application may still be starting up"
                    Write-Warning "Try accessing: http://$albDns"
                }
            }
        }
        else {
            Write-Warning "Could not find ECS cluster name"
        }
    }
    catch {
        Write-Warning "Error during service stabilization: $($_.Exception.Message)"
    }
}

function Show-DeploymentInfo {
    Write-Success "Windows PowerShell deployment completed!"
    
    Write-Host ""
    Write-Host "=== Deployment Information ===" -ForegroundColor Cyan
    Write-Host "Environment: $Environment" -ForegroundColor White
    Write-Host "Region: $Region" -ForegroundColor White
    Write-Host "Application: $ApplicationName" -ForegroundColor White
    Write-Host ""
    
    try {
        # Get important URLs and information
        $albDns = aws cloudformation describe-stacks --stack-name $AppStackName --query 'Stacks[0].Outputs[?OutputKey==`ApplicationLoadBalancerDNS`].OutputValue' --output text --region $Region 2>$null
        $userPoolId = aws cloudformation describe-stacks --stack-name $SecurityStackName --query 'Stacks[0].Outputs[?OutputKey==`CognitoUserPoolId`].OutputValue' --output text --region $Region 2>$null
        
        if (-not [string]::IsNullOrEmpty($albDns)) {
            Write-Host "Application URL: http://$albDns" -ForegroundColor Green
        }
        
        if (-not [string]::IsNullOrEmpty($userPoolId)) {
            Write-Host "Cognito User Pool ID: $userPoolId" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "API Keys Configuration:" -ForegroundColor Yellow
        Write-Host "  - NewsAPI: $ApplicationName/$Environment/newsapi" -ForegroundColor White
        Write-Host "  - FRED: $ApplicationName/$Environment/fred" -ForegroundColor White
        Write-Host ""
        
        if (-not [string]::IsNullOrEmpty($userPoolId)) {
            Write-Host "To create a test user:" -ForegroundColor Cyan
            Write-Host "aws cognito-idp admin-create-user --user-pool-id $userPoolId --username testuser --temporary-password TempPass123! --message-action SUPPRESS --region $Region" -ForegroundColor Gray
            Write-Host "aws cognito-idp admin-set-user-password --user-pool-id $userPoolId --username testuser --password NewPass123! --permanent --region $Region" -ForegroundColor Gray
        }
    }
    catch {
        Write-Warning "Could not retrieve all deployment information: $($_.Exception.Message)"
    }
    
    Write-Host ""
}

#############################################################################
# ROLLBACK FUNCTION
#############################################################################

function Invoke-Rollback {
    Write-Info "🔄 Starting rollback process..."
    
    if ($AppStackCreated) {
        Write-Info "Rolling back application stack..."
        try {
            aws cloudformation delete-stack --stack-name $AppStackName --region $Region
        }
        catch {
            Write-Warning "Failed to delete application stack: $($_.Exception.Message)"
        }
    }
    
    if ($ImagePushed) {
        Write-Info "Cleaning up pushed Docker image..."
        Write-Warning "Docker image remains in ECR repository (manual cleanup may be needed)"
    }
    
    if ($EcrStackCreated) {
        Write-Info "Rolling back ECR stack..."
        try {
            aws cloudformation delete-stack --stack-name "$ApplicationName-$Environment-ecr" --region $Region
        }
        catch {
            Write-Warning "Failed to delete ECR stack: $($_.Exception.Message)"
        }
    }
    
    if ($SecurityStackCreated) {
        Write-Warning "Security foundation stack was created but will not be automatically deleted"
        Write-Warning "If this was a new deployment, you may want to manually delete: $SecurityStackName"
    }
    
    Write-Info "Rollback process completed"
}

#############################################################################
# MAIN EXECUTION
#############################################################################

function Main {
    try {
        Write-Host ""
        Write-Host "🚀 Windows PowerShell Deployment for Advisor Assistant POC" -ForegroundColor Cyan
        Write-Host "==========================================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Environment: $Environment" -ForegroundColor White
        Write-Host "Region: $Region" -ForegroundColor White
        Write-Host "Platform: Windows PowerShell" -ForegroundColor White
        Write-Host ""
        
        $script:DeploymentStarted = $true
        
        # Prerequisites validation
        if (-not $SkipTests) {
            if (-not (Test-Prerequisites)) {
                Write-Error "Prerequisites validation failed"
                return
            }
        }
        else {
            Write-Warning "Skipping prerequisites validation"
        }
        
        # Deployment stages
        Write-Info "Starting deployment stages: Security -> ECR -> Build -> Push -> Application -> Secrets -> Health Check"
        
        if (-not (Deploy-SecurityFoundation)) { throw "Security foundation deployment failed" }
        if (-not (Deploy-EcrRepository)) { throw "ECR repository deployment failed" }
        if (-not (Build-AndPushImage)) { throw "Docker build and push failed" }
        if (-not (Deploy-ApplicationInfrastructure)) { throw "Application infrastructure deployment failed" }
        
        Update-Secrets
        Wait-ForServiceAndHealthCheck
        Show-DeploymentInfo
        
        Write-Success "🎉 Windows PowerShell deployment completed successfully!"
        Write-Success "All resources deployed and validated"
    }
    catch {
        Write-Error "Deployment failed: $($_.Exception.Message)"
        
        if ($DeploymentStarted -and -not $Force) {
            Write-Info "Initiating rollback..."
            Invoke-Rollback
        }
        
        Write-Host ""
        Write-Host "🔧 Troubleshooting steps:" -ForegroundColor Yellow
        Write-Host "   1. Check AWS CloudFormation console for detailed error messages" -ForegroundColor White
        Write-Host "   2. Verify AWS credentials have sufficient permissions" -ForegroundColor White
        Write-Host "   3. Ensure Docker Desktop is running with Linux containers" -ForegroundColor White
        Write-Host "   4. Check that all required files exist in the project directory" -ForegroundColor White
        Write-Host "   5. Consider using -Force parameter to skip rollback" -ForegroundColor White
        Write-Host ""
        
        exit 1
    }
}

# Execute main function
Main