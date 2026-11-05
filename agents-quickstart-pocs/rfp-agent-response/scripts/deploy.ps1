#!/usr/bin/env pwsh
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
#
# Deploys the RFP Processing System (Windows PowerShell 5.1 or PowerShell 7).
# Keep in sync with scripts/deploy.sh (macOS and Linux). Shared logic lives in
# scripts/deploy_helper.py.
#
# Requires: AWS CLI v2 and Python 3.9+ (the .venv is used if present).
#
# Usage:
#   .\scripts\deploy.ps1 [-InfraStackName terminal-upload] [-WebStackName rfp-web-app]
#                        [-Region us-east-1] [-KnowledgeBaseId ABC123DEF4]
#                        [-ModelId us.anthropic.claude-haiku-5-5]
#                        [-AdminEmail you@example.com] [-SkipPackaging]
#
# Uses the credentials and profile of your AWS CLI (for example $env:AWS_PROFILE).

param(
    [string]$InfraStackName = "terminal-upload",
    [string]$WebStackName = "rfp-web-app",
    [string]$Region = "us-east-1",
    [string]$KnowledgeBaseId = "",
    [string]$ModelId = "us.anthropic.claude-haiku-5-5",
    [string]$AdminEmail = "",
    [switch]$SkipPackaging = $false
)

# Native command failures are handled with $LASTEXITCODE. ErrorActionPreference
# is left at Continue because Windows PowerShell 5.1 turns redirected stderr from
# native commands into terminating errors when it is set to Stop.
$env:AWS_PAGER = ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$startLocation = Get-Location
Set-Location $projectRoot

function Write-Step([string]$Message) { Write-Host ""; Write-Host $Message -ForegroundColor Yellow }
function Write-Info([string]$Message) { Write-Host "   - $Message" -ForegroundColor Gray }
function Write-Ok([string]$Message) { Write-Host "   $Message" -ForegroundColor Green }
function Stop-Deploy([string]$Message) {
    Write-Host "   ERROR: $Message" -ForegroundColor Red
    Set-Location $startLocation
    exit 1
}

function Get-StackOutput([string]$StackName, [string]$OutputKey) {
    $value = aws cloudformation describe-stacks --stack-name $StackName --region $Region `
        --query "Stacks[0].Outputs[?OutputKey=='$OutputKey'].OutputValue" --output text
    if ($LASTEXITCODE -ne 0) { Stop-Deploy "Could not read output $OutputKey of stack $StackName" }
    return "$value".Trim()
}

function Update-Functions([string]$FunctionNames, [string]$Bucket) {
    foreach ($fn in ($FunctionNames -split ",")) {
        Write-Info "Updating $fn"
        aws lambda update-function-code --function-name $fn --region $Region `
            --s3-bucket $Bucket --s3-key lambda-function.zip | Out-Null
        if ($LASTEXITCODE -ne 0) { Stop-Deploy "Could not update $fn" }
        aws lambda wait function-updated --function-name $fn --region $Region
    }
}

# Returns the HTTP status code of an anonymous request.
function Get-AnonymousStatus([string]$Url, [string]$Method = "GET") {
    try {
        if ($Method -eq "POST") {
            Invoke-WebRequest -Uri $Url -Method POST -Body "{}" -ContentType "application/json" `
                -TimeoutSec 15 -UseBasicParsing | Out-Null
        } else {
            Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 15 -UseBasicParsing | Out-Null
        }
        return 200
    } catch {
        if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode }
        return 0
    }
}

# Prefer the project virtual environment for the shared helper.
$python = $null
foreach ($candidate in @(".venv/Scripts/python.exe", ".venv/bin/python")) {
    if (Test-Path $candidate) { $python = $candidate; break }
}
if (-not $python) {
    foreach ($candidate in @("python", "python3")) {
        if (Get-Command $candidate -ErrorAction SilentlyContinue) { $python = $candidate; break }
    }
}
if (-not $python) { Stop-Deploy "Python 3 is required but was not found" }
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) { Stop-Deploy "The AWS CLI is required but was not found" }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RFP Processing System - Full Deploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Step "0. Checking AWS credentials..."
$callerArn = aws sts get-caller-identity --query Arn --output text
if ($LASTEXITCODE -ne 0) { Stop-Deploy "No AWS credentials. Configure the AWS CLI (for example: aws configure sso)." }
Write-Info "Deploying as $callerArn"
Write-Info "Region: $Region"

# Step 1: Package the Lambda code
if ($SkipPackaging) {
    Write-Step "1. Skipping Lambda packaging (using build/lambda-function.zip)..."
    if (-not (Test-Path "build/lambda-function.zip")) { Stop-Deploy "build/lambda-function.zip not found; run without -SkipPackaging" }
} else {
    Write-Step "1. Packaging Lambda functions..."
    & $python scripts/deploy_helper.py package --src src --out build/lambda-function.zip
    if ($LASTEXITCODE -ne 0) { Stop-Deploy "Packaging failed" }
    Write-Ok "Lambda package created"
}

# Step 2: Knowledge base ID
Write-Step "2. Knowledge Base configuration..."
if (-not $KnowledgeBaseId) {
    Write-Info "Enter the 10-character ID of your Bedrock knowledge base (for example ABC123DEF4)"
    $KnowledgeBaseId = Read-Host "   Knowledge Base ID"
}
if ($KnowledgeBaseId -cnotmatch '^[A-Z0-9]{10}$') {
    Stop-Deploy "Invalid Knowledge Base ID '$KnowledgeBaseId' (expected 10 uppercase letters or digits)"
}
Write-Ok "Using Knowledge Base ID $KnowledgeBaseId and model $ModelId"

# Step 3: Processing stack
Write-Step "3. Deploying infrastructure stack ($InfraStackName)..."
aws cloudformation deploy `
    --template-file infrastructure/cloudformation.yaml `
    --stack-name $InfraStackName `
    --capabilities CAPABILITY_NAMED_IAM `
    --region $Region `
    --parameter-overrides "KnowledgeBaseId=$KnowledgeBaseId" "BedrockModelId=$ModelId" `
    --no-fail-on-empty-changeset
if ($LASTEXITCODE -ne 0) { Stop-Deploy "Infrastructure deployment failed" }
Write-Ok "Infrastructure stack deployed"

# Step 4: Pipeline Lambda code
Write-Step "4. Deploying pipeline Lambda code..."
$deploymentBucket = Get-StackOutput $InfraStackName "DeploymentBucket"
$bucketName = Get-StackOutput $InfraStackName "BucketName"
$tableName = Get-StackOutput $InfraStackName "TableName"
$pipelineFunctions = Get-StackOutput $InfraStackName "LambdaFunctionNames"
Write-Info "Uploading package to s3://$deploymentBucket/lambda-function.zip"
aws s3 cp build/lambda-function.zip "s3://$deploymentBucket/lambda-function.zip" --region $Region --only-show-errors
if ($LASTEXITCODE -ne 0) { Stop-Deploy "Could not upload the Lambda package" }
Update-Functions $pipelineFunctions $deploymentBucket
Write-Ok "Pipeline Lambda functions updated"

# Step 5: Web stack
Write-Step "5. Deploying web stack ($WebStackName): Cognito, API Gateway, CloudFront..."
$webParams = @("ProcessingStackName=$InfraStackName")
if ($AdminEmail) { $webParams += "AdminEmail=$AdminEmail" }
aws cloudformation deploy `
    --template-file infrastructure/web-cloudformation.yaml `
    --stack-name $WebStackName `
    --capabilities CAPABILITY_IAM `
    --region $Region `
    --parameter-overrides $webParams `
    --no-fail-on-empty-changeset
if ($LASTEXITCODE -ne 0) { Stop-Deploy "Web stack deployment failed" }
Write-Ok "Web stack deployed"

# Step 6: API Lambda code (same package)
Write-Step "6. Deploying API Lambda code..."
$webFunctions = Get-StackOutput $WebStackName "LambdaFunctionNames"
Update-Functions $webFunctions $deploymentBucket
Write-Ok "API Lambda functions updated"

# Step 7: Allow browser uploads and downloads from the CloudFront origin
$cloudFrontUrl = Get-StackOutput $WebStackName "CloudFrontURL"
Write-Step "7. Allowing browser access to the upload bucket from $cloudFrontUrl..."
aws cloudformation deploy `
    --template-file infrastructure/cloudformation.yaml `
    --stack-name $InfraStackName `
    --capabilities CAPABILITY_NAMED_IAM `
    --region $Region `
    --parameter-overrides "WebAppOrigin=$cloudFrontUrl" `
    --no-fail-on-empty-changeset
if ($LASTEXITCODE -ne 0) { Stop-Deploy "Could not update the upload bucket CORS rule" }
Write-Ok "Upload bucket CORS rule set"

# Step 8: Static site
Write-Step "8. Deploying web interface..."
$websiteBucket = Get-StackOutput $WebStackName "WebsiteBucket"
$distributionId = Get-StackOutput $WebStackName "CloudFrontDistributionId"
$apiUrl = Get-StackOutput $WebStackName "ApiGatewayURL"
$userPoolId = Get-StackOutput $WebStackName "UserPoolId"
New-Item -ItemType Directory -Path "build" -Force | Out-Null
$outputsJson = aws cloudformation describe-stacks --stack-name $WebStackName --region $Region `
    --query "Stacks[0].Outputs" --output json
if ($LASTEXITCODE -ne 0) { Stop-Deploy "Could not read the web stack outputs" }
$outputsJson | Set-Content -Path "build/web-outputs.json" -Encoding ascii
& $python scripts/deploy_helper.py render-web --outputs build/web-outputs.json --templates web/templates --out build/web
if ($LASTEXITCODE -ne 0) { Stop-Deploy "Could not render the web interface" }
aws s3 sync build/web/ "s3://$websiteBucket/" --delete --region $Region --only-show-errors
if ($LASTEXITCODE -ne 0) { Stop-Deploy "Could not upload the web interface" }
$invalidationId = aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*" `
    --query Invalidation.Id --output text 2>$null
if ($LASTEXITCODE -eq 0 -and $invalidationId) {
    Write-Info "CloudFront invalidation $invalidationId created"
} else {
    Write-Host "   CloudFront invalidation failed; changes can take 5-15 minutes to appear" -ForegroundColor Yellow
}
Write-Ok "Web interface deployed"

# Step 9: Verify
Write-Step "9. Verifying deployment..."
$tableStatus = aws dynamodb describe-table --table-name $tableName --region $Region `
    --query Table.TableStatus --output text 2>$null
if ($LASTEXITCODE -ne 0) { $tableStatus = "MISSING" }
Write-Info "DynamoDB status table ${tableName}: $tableStatus"
$active = 0
$allFunctions = @($pipelineFunctions -split ",") + @($webFunctions -split ",")
foreach ($fn in $allFunctions) {
    $state = aws lambda get-function --function-name $fn --region $Region --query Configuration.State --output text 2>$null
    if ($state -eq "Active") { $active++ }
}
Write-Info "Lambda functions active: $active/$($allFunctions.Count)"

# Every API route must reject anonymous callers (Cognito authorizer -> 401).
$anonymousOk = $true
foreach ($route in @("/list-jobs", "/downloads", "/status?fileName=test.txt", "/download/final_responses/test.txt")) {
    $code = Get-AnonymousStatus "$apiUrl$route"
    if ($code -eq 401) {
        Write-Ok "Anonymous GET $route -> 401 (authentication required)"
    } else {
        Write-Host "   Anonymous GET $route -> $code (expected 401)" -ForegroundColor Red
        $anonymousOk = $false
    }
}
$code = Get-AnonymousStatus "$apiUrl/upload" "POST"
if ($code -eq 401) {
    Write-Ok "Anonymous POST /upload -> 401 (authentication required)"
} else {
    Write-Host "   Anonymous POST /upload -> $code (expected 401)" -ForegroundColor Red
    $anonymousOk = $false
}
if (-not $anonymousOk) { Stop-Deploy "The API is not rejecting anonymous requests. Do not use this deployment." }

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "       DEPLOYMENT SUCCESSFUL" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Web app:        $cloudFrontUrl"
Write-Host "Job status:     $cloudFrontUrl/status.html"
Write-Host "Downloads:      $cloudFrontUrl/downloads.html"
Write-Host "API:            $apiUrl"
Write-Host "Upload bucket:  $bucketName"
Write-Host "Status table:   $tableName"
Write-Host "User pool:      $userPoolId"
Write-Host ""
if ($AdminEmail) {
    Write-Host "Cognito sent a temporary password to $AdminEmail. Sign in at $cloudFrontUrl."
} else {
    Write-Host "Create a user to sign in (Cognito emails a temporary password):"
    Write-Host "  aws cognito-idp admin-create-user --region $Region --user-pool-id $userPoolId ``"
    Write-Host "    --username you@example.com --user-attributes Name=email,Value=you@example.com Name=email_verified,Value=true"
}
Write-Host ""
Write-Host "Reset demo data: .\scripts\cleanup.ps1 -DataOnly    Remove everything: .\scripts\cleanup.ps1"

Set-Location $startLocation
