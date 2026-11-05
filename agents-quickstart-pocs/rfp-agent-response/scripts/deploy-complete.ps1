#!/usr/bin/env pwsh

param(
    [string]$InfraStackName = "terminal-upload",
    [string]$WebStackName = "rfp-web-app",
    [string]$Region = "us-east-1",
    [string]$ModelId = "us.anthropic.claude-haiku-5-5",
    [string]$AdminEmail = "",
    [switch]$SkipPackaging = $false
)

# Disable AWS CLI paging to prevent interactive prompts
$env:AWS_PAGER = ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RFP Processing System - Full Deploy  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Package Lambda functions (unless skipped)
if (-not $SkipPackaging) {
    Write-Host "1. Packaging Lambda functions..." -ForegroundColor Yellow
    
    # Get the script directory and navigate to project root
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $projectRoot = Split-Path -Parent $scriptDir
    Set-Location $projectRoot
    
    # Clean up any existing package
    if (Test-Path "lambda-function.zip") {
        Remove-Item "lambda-function.zip"
        Write-Host "   - Cleaned up existing package" -ForegroundColor Gray
    }
    
    # Create temporary directory for packaging
    $tempDir = "temp-lambda-package"
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $tempDir | Out-Null
    Write-Host "   - Created temporary packaging directory" -ForegroundColor Gray
    
    # Copy Python files
    $pythonFiles = Get-ChildItem -Path "src" -Filter "*.py"
    if ($pythonFiles.Count -eq 0) {
        Write-Host "   ERROR: No Python files found in src directory!" -ForegroundColor Red
        Write-Host "   Current directory: $(Get-Location)" -ForegroundColor Red
        Write-Host "   Looking for: $(Join-Path (Get-Location) 'src')" -ForegroundColor Red
        exit 1
    }
    
    foreach ($file in $pythonFiles) {
        Copy-Item $file.FullName -Destination $tempDir
    }
    Write-Host "   - Copied $($pythonFiles.Count) Python files" -ForegroundColor Gray
    
    # Install dependencies if requirements.txt exists
    $requirementsFile = "src/requirements.txt"
    if (Test-Path $requirementsFile) {
        Write-Host "   - Installing Python dependencies..." -ForegroundColor Gray
        pip install -r $requirementsFile -t $tempDir --no-deps --platform linux_x86_64 --only-binary=:all:
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   WARNING: Some dependencies may not have installed correctly" -ForegroundColor Yellow
            Write-Host "   Trying alternative installation method..." -ForegroundColor Gray
            pip install -r $requirementsFile -t $tempDir
        }
        Write-Host "   - Dependencies installed" -ForegroundColor Gray
    }
    
    # Create the zip package
    $zipItems = Get-ChildItem -Path $tempDir -Recurse
    Compress-Archive -Path "$tempDir\*" -DestinationPath "lambda-function.zip" -Force
    
    # Clean up temp directory
    Remove-Item $tempDir -Recurse -Force
    
    Write-Host "   - Packaged $($pythonFiles.Count) Python files with dependencies" -ForegroundColor Gray
    Write-Host "   Lambda package created successfully" -ForegroundColor Green
} else {
    Write-Host "1. Skipping Lambda packaging (using existing package)..." -ForegroundColor Yellow
    # Get the script directory and navigate to project root
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $projectRoot = Split-Path -Parent $scriptDir
    Set-Location $projectRoot
}

# Step 2: Get Knowledge Base ID
Write-Host ""
Write-Host "2. Knowledge Base Configuration..." -ForegroundColor Yellow
Write-Host "   You need to provide your Bedrock Knowledge Base ID" -ForegroundColor Gray
Write-Host "   (This should be a 10-character ID like 'ABC123DEF4')" -ForegroundColor Gray
Write-Host ""

$KnowledgeBaseId = Read-Host "Enter your Knowledge Base ID"

# Validate Knowledge Base ID format
if (-not ($KnowledgeBaseId -match '^[A-Z0-9]{10}$')) {
    Write-Host "ERROR: Invalid Knowledge Base ID format!" -ForegroundColor Red
    Write-Host "Knowledge Base ID should be exactly 10 alphanumeric characters (e.g., ABC123DEF4)" -ForegroundColor Red
    exit 1
}

Write-Host "   Using Knowledge Base ID: $KnowledgeBaseId" -ForegroundColor Green

# Step 3: Deploy infrastructure stack
Write-Host ""
Write-Host "3. Deploying infrastructure stack..." -ForegroundColor Yellow
Write-Host "   - Lambda functions for processing pipeline" -ForegroundColor Gray
Write-Host "   - DynamoDB table for status tracking" -ForegroundColor Gray
Write-Host "   - S3 bucket for file storage" -ForegroundColor Gray
Write-Host "   - IAM roles and permissions" -ForegroundColor Gray

aws cloudformation deploy `
    --template-file infrastructure/cloudformation.yaml `
    --stack-name $InfraStackName `
    --capabilities CAPABILITY_NAMED_IAM `
    --region $Region `
    --parameter-overrides KnowledgeBaseId=$KnowledgeBaseId BedrockModelId=$ModelId `
    --no-paginate

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ERROR: Infrastructure deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "   Infrastructure stack deployed successfully" -ForegroundColor Green

# Step 4: Get infrastructure outputs
Write-Host ""
Write-Host "4. Retrieving infrastructure details..." -ForegroundColor Yellow

$FUNCTION_NAME = aws cloudformation describe-stacks --stack-name $InfraStackName --query 'Stacks[0].Outputs[?OutputKey==`FunctionName`].OutputValue' --output text --region $Region --no-paginate
$QUESTION_PROCESSOR_NAME = aws cloudformation describe-stacks --stack-name $InfraStackName --query 'Stacks[0].Outputs[?OutputKey==`QuestionProcessorFunctionName`].OutputValue' --output text --region $Region --no-paginate
$COMPLIANCE_AGENT_NAME = aws cloudformation describe-stacks --stack-name $InfraStackName --query 'Stacks[0].Outputs[?OutputKey==`ComplianceAgentFunctionName`].OutputValue' --output text --region $Region --no-paginate
$DRAFTING_AGENT_NAME = aws cloudformation describe-stacks --stack-name $InfraStackName --query 'Stacks[0].Outputs[?OutputKey==`DraftingAgentFunctionName`].OutputValue' --output text --region $Region --no-paginate
$DEPLOYMENT_BUCKET = aws cloudformation describe-stacks --stack-name $InfraStackName --query 'Stacks[0].Outputs[?OutputKey==`DeploymentBucket`].OutputValue' --output text --region $Region --no-paginate
$BUCKET_NAME = aws cloudformation describe-stacks --stack-name $InfraStackName --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' --output text --region $Region --no-paginate

Write-Host "   - RFP Processor: $FUNCTION_NAME" -ForegroundColor Gray
Write-Host "   - Question Processor: $QUESTION_PROCESSOR_NAME" -ForegroundColor Gray
Write-Host "   - Compliance Agent: $COMPLIANCE_AGENT_NAME" -ForegroundColor Gray
Write-Host "   - Drafting Agent: $DRAFTING_AGENT_NAME" -ForegroundColor Gray
Write-Host "   - Upload Bucket: $BUCKET_NAME" -ForegroundColor Gray
Write-Host "   Infrastructure details retrieved successfully" -ForegroundColor Green

# Step 5: Deploy Lambda function code
Write-Host ""
Write-Host "5. Deploying Lambda function code..." -ForegroundColor Yellow

# Upload package to S3
Write-Host "   - Uploading Lambda package to S3..." -ForegroundColor Gray
aws s3 cp lambda-function.zip s3://$DEPLOYMENT_BUCKET/ --region $Region --no-paginate | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ERROR: Failed to upload Lambda package!" -ForegroundColor Red
    exit 1
}

# Update all Lambda functions
Write-Host "   - Updating RFP extractor function..." -ForegroundColor Gray
aws lambda update-function-code --function-name $FUNCTION_NAME --s3-bucket $DEPLOYMENT_BUCKET --s3-key lambda-function.zip --region $Region --no-paginate | Out-Null

Write-Host "   - Updating question processor function..." -ForegroundColor Gray
aws lambda update-function-code --function-name $QUESTION_PROCESSOR_NAME --s3-bucket $DEPLOYMENT_BUCKET --s3-key lambda-function.zip --region $Region --no-paginate | Out-Null

Write-Host "   - Updating compliance agent function..." -ForegroundColor Gray
aws lambda update-function-code --function-name $COMPLIANCE_AGENT_NAME --s3-bucket $DEPLOYMENT_BUCKET --s3-key lambda-function.zip --region $Region --no-paginate | Out-Null

Write-Host "   - Updating drafting agent function..." -ForegroundColor Gray
aws lambda update-function-code --function-name $DRAFTING_AGENT_NAME --s3-bucket $DEPLOYMENT_BUCKET --s3-key lambda-function.zip --region $Region --no-paginate | Out-Null

Write-Host "   All Lambda functions updated successfully" -ForegroundColor Green

# Step 6: S3 event triggers are defined in infrastructure/cloudformation.yaml

# Step 7: Deploy web infrastructure
Write-Host ""
Write-Host "7. Deploying web infrastructure..." -ForegroundColor Yellow
Write-Host "   - API Gateway with status and list-jobs endpoints" -ForegroundColor Gray
Write-Host "   - CloudFront distribution" -ForegroundColor Gray
Write-Host "   - S3 bucket for web hosting" -ForegroundColor Gray

aws cloudformation deploy `
    --template-file infrastructure/web-cloudformation.yaml `
    --stack-name $WebStackName `
    --capabilities CAPABILITY_IAM `
    --region $Region `
    --parameter-overrides ProcessingStackName=$InfraStackName $(if ($AdminEmail) { "AdminEmail=$AdminEmail" }) `
    --no-fail-on-empty-changeset `
    --no-paginate

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ERROR: Web infrastructure deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "   Web infrastructure deployed successfully" -ForegroundColor Green

# Allow browser uploads from the CloudFront origin (upload bucket CORS rule)
$CloudFrontOrigin = aws cloudformation describe-stacks --stack-name $WebStackName --region $Region --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" --output text --no-paginate
Write-Host "   - Allowing uploads from $CloudFrontOrigin..." -ForegroundColor Gray
aws cloudformation deploy `
    --template-file infrastructure/cloudformation.yaml `
    --stack-name $InfraStackName `
    --capabilities CAPABILITY_NAMED_IAM `
    --region $Region `
    --parameter-overrides WebAppOrigin=$CloudFrontOrigin `
    --no-fail-on-empty-changeset `
    --no-paginate
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ERROR: Could not update the upload bucket CORS rule" -ForegroundColor Red
    exit 1
}

# Step 8: Deploy web Lambda functions
Write-Host ""
Write-Host "8. Deploying web Lambda functions..." -ForegroundColor Yellow

# Create temp directory
if (!(Test-Path "temp")) {
    New-Item -ItemType Directory -Path "temp" -Force
}

# Get web stack outputs
$WebsiteBucket = aws cloudformation describe-stacks --stack-name $WebStackName --region $Region --query "Stacks[0].Outputs[?OutputKey=='WebsiteBucket'].OutputValue" --output text --no-paginate
$ApiUrl = aws cloudformation describe-stacks --stack-name $WebStackName --region $Region --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayURL'].OutputValue" --output text --no-paginate

# Every web Lambda uses the same package as the pipeline (they share src/common.py)
$webFunctions = @("rfp-upload-api-$WebStackName", "rfp-download-api-$WebStackName", "rfp-status-api-$WebStackName", "rfp-list-jobs-api-$WebStackName")
foreach ($webFunction in $webFunctions) {
    Write-Host "   - Updating $webFunction..." -ForegroundColor Gray
    aws lambda update-function-code --function-name $webFunction --s3-bucket $DEPLOYMENT_BUCKET --s3-key lambda-function.zip --region $Region --no-paginate | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ERROR: Failed to update $webFunction" -ForegroundColor Red
        exit 1
    }
}

Write-Host "   Web Lambda functions deployed successfully" -ForegroundColor Green

# Step 9: Deploy web interface
Write-Host ""
Write-Host "9. Deploying web interface..." -ForegroundColor Yellow

# Render the static site and config.js (API URL, Cognito settings) from the
# web stack outputs. The shared helper is also used by scripts/deploy.sh.
$python = if (Test-Path ".venv/Scripts/python.exe") { ".venv/Scripts/python.exe" } elseif (Test-Path ".venv/bin/python") { ".venv/bin/python" } else { "python" }
New-Item -ItemType Directory -Path "build" -Force | Out-Null
aws cloudformation describe-stacks --stack-name $WebStackName --region $Region --query "Stacks[0].Outputs" --output json --no-paginate | Set-Content "build/web-outputs.json" -Encoding ascii
& $python scripts/deploy_helper.py render-web --outputs build/web-outputs.json --templates web/templates --out build/web
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ERROR: Could not render the web interface" -ForegroundColor Red
    exit 1
}

# Upload web files to S3
Write-Host "   - Uploading web files to S3..." -ForegroundColor Gray
aws s3 sync build/web/ s3://$WebsiteBucket/ --delete --region $Region --no-paginate

# Create CloudFront invalidation to force cache refresh
Write-Host "   - Creating CloudFront invalidation for immediate updates..." -ForegroundColor Gray

# Get CloudFront distribution ID from stack outputs
$CloudFrontDistributionId = aws cloudformation describe-stacks --stack-name $WebStackName --region $Region --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text --no-paginate

if ($CloudFrontDistributionId -and $CloudFrontDistributionId -ne "None") {
    $invalidationResult = aws cloudfront create-invalidation --distribution-id $CloudFrontDistributionId --paths "/*" --output json --no-paginate 2>$null
    if ($LASTEXITCODE -eq 0) {
        $invalidation = $invalidationResult | ConvertFrom-Json
        Write-Host "   - CloudFront invalidation created: $($invalidation.Invalidation.Id)" -ForegroundColor Gray
        Write-Host "   - Changes will be available immediately (no 5-15 minute wait)" -ForegroundColor Green
    } else {
        Write-Host "   - CloudFront invalidation failed, changes may take 5-15 minutes" -ForegroundColor Yellow
    }
} else {
    Write-Host "   - CloudFront distribution ID not found, skipping invalidation" -ForegroundColor Yellow
}

Write-Host "   Web interface deployed successfully" -ForegroundColor Green

# Step 10: Verify deployment
Write-Host ""
Write-Host "10. Verifying deployment..." -ForegroundColor Yellow

# Check DynamoDB table
$tableStatus = aws dynamodb describe-table --table-name rfp-processing-status --region $Region --query 'Table.TableStatus' --output text --no-paginate 2>$null
if ($tableStatus -eq "ACTIVE") {
    Write-Host "   - DynamoDB status table: ACTIVE" -ForegroundColor Green
} else {
    Write-Host "   - DynamoDB status table: NOT FOUND" -ForegroundColor Red
}

# Check Lambda functions
$lambdaFunctions = @($FUNCTION_NAME, $QUESTION_PROCESSOR_NAME, $COMPLIANCE_AGENT_NAME, $DRAFTING_AGENT_NAME)
$functionsOk = 0
foreach ($func in $lambdaFunctions) {
    $funcStatus = aws lambda get-function --function-name $func --region $Region --query 'Configuration.State' --output text --no-paginate 2>$null
    if ($funcStatus -eq "Active") {
        $functionsOk++
    }
}
Write-Host "   - Lambda functions: $functionsOk/$($lambdaFunctions.Count) active" -ForegroundColor $(if ($functionsOk -eq $lambdaFunctions.Count) { "Green" } else { "Yellow" })

# Every API route must reject anonymous callers (Cognito authorizer -> 401)
$anonymousOk = $true
foreach ($route in @("/list-jobs", "/downloads", "/status?fileName=test.txt", "/download/final_responses/test.txt")) {
    try {
        Invoke-WebRequest -Uri "$ApiUrl$route" -Method GET -TimeoutSec 15 -UseBasicParsing | Out-Null
        $code = 200
    } catch {
        $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    }
    if ($code -eq 401) {
        Write-Host "   - Anonymous GET $route -> 401 (authentication required)" -ForegroundColor Green
    } else {
        Write-Host "   - Anonymous GET $route -> $code (expected 401)" -ForegroundColor Red
        $anonymousOk = $false
    }
}
if (-not $anonymousOk) {
    Write-Host "   ERROR: The API is not rejecting anonymous requests. Do not use this deployment." -ForegroundColor Red
    exit 1
}

# Step 11: Cleanup and final output
Write-Host ""
Write-Host "11. Cleaning up..." -ForegroundColor Yellow
Remove-Item "lambda-function.zip" -ErrorAction SilentlyContinue
Remove-Item "temp" -Recurse -ErrorAction SilentlyContinue

# Get final URLs
$CloudFrontURL = aws cloudformation describe-stacks --stack-name $WebStackName --region $Region --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" --output text --no-paginate

Write-Host "   Cleanup completed" -ForegroundColor Green

# Final success message
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "       DEPLOYMENT SUCCESSFUL!           " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "RFP Processing System with Status Tracking" -ForegroundColor Cyan
Write-Host ""
Write-Host "ACCESS URLS:" -ForegroundColor White
Write-Host "  Main Upload Page:    $CloudFrontURL" -ForegroundColor Cyan
Write-Host "  Job Status Dashboard: $CloudFrontURL/status.html" -ForegroundColor Cyan
Write-Host "  Downloads Page:      $CloudFrontURL/downloads.html" -ForegroundColor Cyan
Write-Host "  Admin Dashboard:     $CloudFrontURL/admin.html" -ForegroundColor Cyan
Write-Host "  API Gateway:         $ApiUrl" -ForegroundColor Cyan
Write-Host "  Status Endpoint:     $ApiUrl/status" -ForegroundColor Cyan
Write-Host "  List Jobs Endpoint:  $ApiUrl/list-jobs" -ForegroundColor Cyan
Write-Host "  Download Endpoint:   $ApiUrl/download" -ForegroundColor Cyan
Write-Host ""
Write-Host "INFRASTRUCTURE:" -ForegroundColor White
Write-Host "  Upload Bucket:   $BUCKET_NAME" -ForegroundColor Cyan
Write-Host "  Status Table:    rfp-processing-status" -ForegroundColor Cyan
Write-Host "  Region:          $Region" -ForegroundColor Cyan
Write-Host ""
Write-Host "FEATURES:" -ForegroundColor White
Write-Host "  - Job Status Dashboard with real-time monitoring" -ForegroundColor Gray
Write-Host "  - Multi-job tracking and filtering capabilities" -ForegroundColor Gray
Write-Host "  - Real-time processing status updates" -ForegroundColor Gray
Write-Host "  - Stage-by-stage progress tracking" -ForegroundColor Gray
Write-Host "  - Dashboard statistics (total, processing, completed, errors)" -ForegroundColor Gray
Write-Host "  - Auto-refresh every 30 seconds on dashboard" -ForegroundColor Gray
Write-Host "  - Individual job detail tracking" -ForegroundColor Gray
Write-Host "  - Dedicated downloads page with enhanced interface" -ForegroundColor Gray
Write-Host "  - Download links for each completed processing stage" -ForegroundColor Gray
Write-Host "  - Access to original RFP, extracted questions, responses, and final document" -ForegroundColor Gray
Write-Host "  - Error reporting and timestamps" -ForegroundColor Gray
Write-Host "  - Visual progress indicators with download buttons" -ForegroundColor Gray
Write-Host "  - Enhanced download API supporting all file types" -ForegroundColor Gray
Write-Host "  - Automated RFP processing pipeline" -ForegroundColor Gray
Write-Host "  - Unified navigation across all pages" -ForegroundColor Gray
Write-Host "  - Admin dashboard for system management" -ForegroundColor Gray
Write-Host "  - Demo data reset with scripts/cleanup.ps1 -DataOnly" -ForegroundColor Gray
Write-Host ""
Write-Host "AVAILABLE DOWNLOADS BY STAGE:" -ForegroundColor White
Write-Host "  - Original RFP (uploaded stage)" -ForegroundColor Gray
Write-Host "  - Extracted Questions (questions_extracted stage)" -ForegroundColor Gray
Write-Host "  - Initial Responses (questions_answered stage)" -ForegroundColor Gray
Write-Host "  - Compliance Reviewed (compliance_reviewed stage)" -ForegroundColor Gray
Write-Host "  - Final RFP Response (final_document stage)" -ForegroundColor Gray
Write-Host ""
Write-Host "READY TO USE!" -ForegroundColor Green
Write-Host "Upload an RFP file and watch the real-time status updates with download links!" -ForegroundColor Yellow
Write-Host ""
if ($CloudFrontDistributionId -and $CloudFrontDistributionId -ne "None") {
    Write-Host "Note: CloudFront cache invalidation was created - changes are available immediately!" -ForegroundColor Green
} else {
    Write-Host "Note: CloudFront may take 5-15 minutes to fully propagate." -ForegroundColor Gray
}

# Return to scripts directory
Set-Location $scriptDir