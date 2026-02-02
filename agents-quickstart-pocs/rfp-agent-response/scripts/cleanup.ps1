#!/usr/bin/env pwsh

param(
    [string]$InfraStackName = "terminal-upload",
    [string]$WebStackName = "rfp-web-app",
    [string]$Region = "us-east-1",
    [switch]$Force = $false
)

Write-Host "========================================" -ForegroundColor Red
Write-Host "  RFP Processing System - CLEANUP      " -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

if (-not $Force) {
    Write-Host "WARNING: This will delete ALL resources including:" -ForegroundColor Yellow
    Write-Host "  - All S3 buckets and their contents" -ForegroundColor Yellow
    Write-Host "  - All Lambda functions" -ForegroundColor Yellow
    Write-Host "  - DynamoDB table with processing status data" -ForegroundColor Yellow
    Write-Host "  - CloudFront distribution" -ForegroundColor Yellow
    Write-Host "  - API Gateway" -ForegroundColor Yellow
    Write-Host "  - All CloudFormation stacks" -ForegroundColor Yellow
    Write-Host ""
    $confirmation = Read-Host "Are you sure you want to continue? Type 'DELETE' to confirm"
    
    if ($confirmation -ne "DELETE") {
        Write-Host "Cleanup cancelled." -ForegroundColor Green
        exit 0
    }
}

Write-Host ""
Write-Host "Starting cleanup process..." -ForegroundColor Yellow

# Step 1: Get resource information before deletion
Write-Host ""
Write-Host "1. Gathering resource information..." -ForegroundColor Yellow

# Infrastructure stack resources
$UPLOAD_BUCKET = aws cloudformation describe-stacks --stack-name $InfraStackName --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' --output text --region $Region 2>$null
$DEPLOY_BUCKET = aws cloudformation describe-stacks --stack-name $InfraStackName --query 'Stacks[0].Outputs[?OutputKey==`DeploymentBucket`].OutputValue' --output text --region $Region 2>$null

# Web stack resources
$WEBSITE_BUCKET = aws cloudformation describe-stacks --stack-name $WebStackName --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucket`].OutputValue' --output text --region $Region 2>$null

Write-Host "   - Infrastructure stack: $InfraStackName" -ForegroundColor Gray
Write-Host "   - Web stack: $WebStackName" -ForegroundColor Gray
Write-Host "   - Upload bucket: $UPLOAD_BUCKET" -ForegroundColor Gray
Write-Host "   - Deployment bucket: $DEPLOY_BUCKET" -ForegroundColor Gray
Write-Host "   - Website bucket: $WEBSITE_BUCKET" -ForegroundColor Gray

# Step 2: Empty and prepare S3 buckets for deletion
Write-Host ""
Write-Host "2. Emptying S3 buckets..." -ForegroundColor Yellow

if ($UPLOAD_BUCKET -and $UPLOAD_BUCKET -ne "None") {
    Write-Host "   - Emptying upload bucket: $UPLOAD_BUCKET" -ForegroundColor Gray
    aws s3 rm s3://$UPLOAD_BUCKET --recursive --region $Region 2>$null
    
    # Remove bucket versioning objects if any
    $versions = aws s3api list-object-versions --bucket $UPLOAD_BUCKET --region $Region --query 'Versions[].{Key:Key,VersionId:VersionId}' --output json 2>$null
    if ($versions -and $versions -ne "null" -and $versions -ne "[]") {
        Write-Host "   - Removing versioned objects from upload bucket..." -ForegroundColor Gray
        $versionsObj = $versions | ConvertFrom-Json
        foreach ($version in $versionsObj) {
            aws s3api delete-object --bucket $UPLOAD_BUCKET --key $version.Key --version-id $version.VersionId --region $Region 2>$null
        }
    }
    
    # Remove delete markers
    $deleteMarkers = aws s3api list-object-versions --bucket $UPLOAD_BUCKET --region $Region --query 'DeleteMarkers[].{Key:Key,VersionId:VersionId}' --output json 2>$null
    if ($deleteMarkers -and $deleteMarkers -ne "null" -and $deleteMarkers -ne "[]") {
        Write-Host "   - Removing delete markers from upload bucket..." -ForegroundColor Gray
        $deleteMarkersObj = $deleteMarkers | ConvertFrom-Json
        foreach ($marker in $deleteMarkersObj) {
            aws s3api delete-object --bucket $UPLOAD_BUCKET --key $marker.Key --version-id $marker.VersionId --region $Region 2>$null
        }
    }
}

if ($DEPLOY_BUCKET -and $DEPLOY_BUCKET -ne "None") {
    Write-Host "   - Emptying deployment bucket: $DEPLOY_BUCKET" -ForegroundColor Gray
    aws s3 rm s3://$DEPLOY_BUCKET --recursive --region $Region 2>$null
}

if ($WEBSITE_BUCKET -and $WEBSITE_BUCKET -ne "None") {
    Write-Host "   - Emptying website bucket: $WEBSITE_BUCKET" -ForegroundColor Gray
    aws s3 rm s3://$WEBSITE_BUCKET --recursive --region $Region 2>$null
    
    # Handle versioned objects for website bucket too
    $versions = aws s3api list-object-versions --bucket $WEBSITE_BUCKET --region $Region --query 'Versions[].{Key:Key,VersionId:VersionId}' --output json 2>$null
    if ($versions -and $versions -ne "null" -and $versions -ne "[]") {
        Write-Host "   - Removing versioned objects from website bucket..." -ForegroundColor Gray
        $versionsObj = $versions | ConvertFrom-Json
        foreach ($version in $versionsObj) {
            aws s3api delete-object --bucket $WEBSITE_BUCKET --key $version.Key --version-id $version.VersionId --region $Region 2>$null
        }
    }
}

Write-Host "   S3 buckets emptied" -ForegroundColor Green

# Step 3: Clear DynamoDB table data (optional - table will be deleted with stack)
Write-Host ""
Write-Host "3. Clearing DynamoDB table..." -ForegroundColor Yellow

$tableExists = aws dynamodb describe-table --table-name rfp-processing-status --region $Region 2>$null
if ($tableExists) {
    Write-Host "   - Found DynamoDB table: rfp-processing-status" -ForegroundColor Gray
    Write-Host "   - Table will be deleted with CloudFormation stack" -ForegroundColor Gray
} else {
    Write-Host "   - DynamoDB table not found or already deleted" -ForegroundColor Gray
}

# Step 4: Delete web stack first (due to dependencies)
Write-Host ""
Write-Host "4. Deleting web infrastructure stack..." -ForegroundColor Yellow

$webStackExists = aws cloudformation describe-stacks --stack-name $WebStackName --region $Region 2>$null
if ($webStackExists) {
    Write-Host "   - Deleting web stack: $WebStackName" -ForegroundColor Gray
    aws cloudformation delete-stack --stack-name $WebStackName --region $Region
    
    Write-Host "   - Waiting for web stack deletion to complete..." -ForegroundColor Gray
    aws cloudformation wait stack-delete-complete --stack-name $WebStackName --region $Region
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Web stack deleted successfully" -ForegroundColor Green
    } else {
        Write-Host "   Web stack deletion may have failed or timed out" -ForegroundColor Yellow
    }
} else {
    Write-Host "   - Web stack not found or already deleted" -ForegroundColor Gray
}

# Step 5: Delete infrastructure stack
Write-Host ""
Write-Host "5. Deleting infrastructure stack..." -ForegroundColor Yellow

$infraStackExists = aws cloudformation describe-stacks --stack-name $InfraStackName --region $Region 2>$null
if ($infraStackExists) {
    Write-Host "   - Deleting infrastructure stack: $InfraStackName" -ForegroundColor Gray
    aws cloudformation delete-stack --stack-name $InfraStackName --region $Region
    
    Write-Host "   - Waiting for infrastructure stack deletion to complete..." -ForegroundColor Gray
    aws cloudformation wait stack-delete-complete --stack-name $InfraStackName --region $Region
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Infrastructure stack deleted successfully" -ForegroundColor Green
    } else {
        Write-Host "   Infrastructure stack deletion may have failed or timed out" -ForegroundColor Yellow
    }
} else {
    Write-Host "   - Infrastructure stack not found or already deleted" -ForegroundColor Gray
}

# Step 6: Clean up any remaining resources
Write-Host ""
Write-Host "6. Checking for remaining resources..." -ForegroundColor Yellow

# Check for any remaining Lambda functions
$remainingLambdas = aws lambda list-functions --region $Region --query "Functions[?contains(FunctionName, 'rfp-') || contains(FunctionName, 'terminal-')].FunctionName" --output text 2>$null
if ($remainingLambdas -and $remainingLambdas.Trim() -ne "") {
    Write-Host "   - Found remaining Lambda functions (may be from other deployments):" -ForegroundColor Yellow
    Write-Host "     $remainingLambdas" -ForegroundColor Gray
}

# Check for remaining S3 buckets
$remainingBuckets = aws s3api list-buckets --region $Region --query "Buckets[?contains(Name, 'rfp-') || contains(Name, 'terminal-')].Name" --output text 2>$null
if ($remainingBuckets -and $remainingBuckets.Trim() -ne "") {
    Write-Host "   - Found remaining S3 buckets (may be from other deployments):" -ForegroundColor Yellow
    Write-Host "     $remainingBuckets" -ForegroundColor Gray
}

# Step 7: Clean up local files
Write-Host ""
Write-Host "7. Cleaning up local files..." -ForegroundColor Yellow

$filesToClean = @("lambda-function.zip", "notification.json", "empty-notification.json")
foreach ($file in $filesToClean) {
    if (Test-Path "../$file") {
        Remove-Item "../$file" -Force
        Write-Host "   - Removed: $file" -ForegroundColor Gray
    }
}

if (Test-Path "../temp") {
    Remove-Item "../temp" -Recurse -Force
    Write-Host "   - Removed: temp directory" -ForegroundColor Gray
}

Write-Host "   Local cleanup completed" -ForegroundColor Green

# Final summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "         CLEANUP COMPLETED              " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "RESOURCES CLEANED UP:" -ForegroundColor White
Write-Host "  - Infrastructure stack: $InfraStackName" -ForegroundColor Gray
Write-Host "  - Web stack: $WebStackName" -ForegroundColor Gray
Write-Host "  - S3 buckets and all contents" -ForegroundColor Gray
Write-Host "  - DynamoDB table: rfp-processing-status" -ForegroundColor Gray
Write-Host "  - All Lambda functions" -ForegroundColor Gray
Write-Host "  - API Gateway and CloudFront distribution" -ForegroundColor Gray
Write-Host "  - IAM roles and policies" -ForegroundColor Gray
Write-Host "  - Local temporary files" -ForegroundColor Gray
Write-Host ""
Write-Host "The RFP Processing System has been completely removed." -ForegroundColor Green
Write-Host ""
Write-Host "Note: CloudFront distributions may take up to 15 minutes to fully delete." -ForegroundColor Yellow