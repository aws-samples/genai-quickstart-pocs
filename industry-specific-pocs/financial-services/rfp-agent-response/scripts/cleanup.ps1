#!/usr/bin/env pwsh
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
#
# Removes the RFP Processing System, or with -DataOnly resets its demo data.
# Keep in sync with scripts/cleanup.sh.
#
# Usage:
#   ./scripts/cleanup.ps1 [-InfraStackName terminal-upload] [-WebStackName rfp-web-app]
#                         [-Region us-east-1] [-DataOnly] [-Force]
#
#   -DataOnly  Delete every uploaded file, pipeline output and status record,
#              but keep the stacks deployed.
#   -Force     Skip the confirmation prompt.

param(
    [string]$InfraStackName = "terminal-upload",
    [string]$WebStackName = "rfp-web-app",
    [string]$Region = "us-east-1",
    [switch]$DataOnly = $false,
    [switch]$Force = $false
)

# Native command failures are handled with $LASTEXITCODE. ErrorActionPreference
# is left at Continue because Windows PowerShell 5.1 turns redirected stderr from
# native commands into terminating errors when it is set to Stop.
$env:AWS_PAGER = ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

function Get-StackOutput {
    param([string]$StackName, [string]$OutputKey)
    $value = aws cloudformation describe-stacks --stack-name $StackName --region $Region `
        --query "Stacks[0].Outputs[?OutputKey=='$OutputKey'].OutputValue" --output text 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $value -or $value -eq "None") { return "" }
    return $value.Trim()
}

function Test-StackExists {
    param([string]$StackName)
    aws cloudformation describe-stacks --stack-name $StackName --region $Region --output text 2>$null | Out-Null
    return ($LASTEXITCODE -eq 0)
}

# Delete every object version and delete marker in a bucket, in batches.
function Clear-Bucket {
    param([string]$Bucket)
    if (-not $Bucket) { return }
    Write-Host "   - Emptying s3://$Bucket" -ForegroundColor Gray
    $batchFile = Join-Path ([System.IO.Path]::GetTempPath()) "rfp-delete-batch.json"
    while ($true) {
        $json = aws s3api list-object-versions --bucket $Bucket --region $Region --max-items 500 `
            --query "{Objects: [Versions, DeleteMarkers][][].{Key: Key, VersionId: VersionId}}" --output json
        if ($LASTEXITCODE -ne 0) { throw "Could not list objects in $Bucket" }
        $batch = $json | ConvertFrom-Json
        if (-not $batch.Objects -or $batch.Objects.Count -eq 0) { break }
        @{ Objects = @($batch.Objects); Quiet = $true } | ConvertTo-Json -Depth 4 -Compress |
            Set-Content -Path $batchFile -Encoding ascii
        aws s3api delete-objects --bucket $Bucket --region $Region --delete "file://$batchFile" | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Could not delete objects from $Bucket" }
    }
    Remove-Item $batchFile -ErrorAction SilentlyContinue
}

# Delete every item from the status table.
function Clear-StatusTable {
    param([string]$TableName)
    if (-not $TableName) { return }
    Write-Host "   - Deleting status records from $TableName" -ForegroundColor Gray
    $keys = aws dynamodb scan --table-name $TableName --region $Region `
        --projection-expression file_name --query "Items[].file_name.S" --output text
    if ($LASTEXITCODE -ne 0) { throw "Could not scan $TableName" }
    $count = 0
    foreach ($fileName in ($keys -split "\s+" | Where-Object { $_ -and $_ -ne "None" })) {
        $keyJson = @{ file_name = @{ S = $fileName } } | ConvertTo-Json -Compress
        $keyFile = Join-Path ([System.IO.Path]::GetTempPath()) "rfp-delete-key.json"
        Set-Content -Path $keyFile -Value $keyJson -Encoding ascii
        aws dynamodb delete-item --table-name $TableName --region $Region --key "file://$keyFile" | Out-Null
        Remove-Item $keyFile -ErrorAction SilentlyContinue
        $count++
    }
    Write-Host "   - Deleted $count status records" -ForegroundColor Gray
}

$mode = if ($DataOnly) { "DEMO DATA RESET" } else { "CLEANUP" }
Write-Host "========================================" -ForegroundColor Red
Write-Host "  RFP Processing System - $mode" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "Region:               $Region"
Write-Host "Infrastructure stack: $InfraStackName"
if (-not $DataOnly) { Write-Host "Web stack:            $WebStackName" }
Write-Host ""

if (-not $Force) {
    if ($DataOnly) {
        Write-Host "WARNING: This deletes every uploaded RFP, pipeline output and status record." -ForegroundColor Yellow
        $expected = "RESET"
    } else {
        Write-Host "WARNING: This deletes ALL resources, including:" -ForegroundColor Yellow
        Write-Host "  - All S3 buckets and their contents" -ForegroundColor Yellow
        Write-Host "  - All Lambda functions" -ForegroundColor Yellow
        Write-Host "  - The DynamoDB status table" -ForegroundColor Yellow
        Write-Host "  - The Cognito user pool and its users" -ForegroundColor Yellow
        Write-Host "  - The CloudFront distribution and API Gateway" -ForegroundColor Yellow
        $expected = "DELETE"
    }
    $confirmation = Read-Host "Type '$expected' to confirm"
    if ($confirmation -ne $expected) {
        Write-Host "Cancelled." -ForegroundColor Green
        exit 0
    }
}

Write-Host ""
Write-Host "1. Gathering resource information..." -ForegroundColor Yellow
$uploadBucket = Get-StackOutput $InfraStackName "BucketName"
$deployBucket = Get-StackOutput $InfraStackName "DeploymentBucket"
$tableName = Get-StackOutput $InfraStackName "TableName"
$websiteBucket = Get-StackOutput $WebStackName "WebsiteBucket"
Write-Host "   - Upload bucket:     $uploadBucket" -ForegroundColor Gray
Write-Host "   - Status table:      $tableName" -ForegroundColor Gray
if (-not $DataOnly) {
    Write-Host "   - Deployment bucket: $deployBucket" -ForegroundColor Gray
    Write-Host "   - Website bucket:    $websiteBucket" -ForegroundColor Gray
}

if ($DataOnly) {
    if (-not $uploadBucket -or -not $tableName) {
        Write-Host "ERROR: Stack '$InfraStackName' was not found in $Region." -ForegroundColor Red
        exit 1
    }
    Write-Host ""
    Write-Host "2. Deleting demo data..." -ForegroundColor Yellow
    Clear-Bucket $uploadBucket
    Clear-StatusTable $tableName
    Write-Host ""
    Write-Host "Demo data reset complete. The stacks are still deployed." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "2. Emptying S3 buckets..." -ForegroundColor Yellow
Clear-Bucket $uploadBucket
Clear-Bucket $deployBucket
Clear-Bucket $websiteBucket

# The web stack imports values from the infrastructure stack, so delete it first.
$step = 3
foreach ($stack in @($WebStackName, $InfraStackName)) {
    Write-Host ""
    Write-Host "$step. Deleting stack $stack..." -ForegroundColor Yellow
    if (Test-StackExists $stack) {
        aws cloudformation delete-stack --stack-name $stack --region $Region
        aws cloudformation wait stack-delete-complete --stack-name $stack --region $Region
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   Stack $stack deleted" -ForegroundColor Green
        } else {
            Write-Host "   Stack $stack deletion failed or timed out; check the CloudFormation console" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   - Stack not found or already deleted" -ForegroundColor Gray
    }
    $step++
}

Write-Host ""
Write-Host "$step. Cleaning up local build files..." -ForegroundColor Yellow
$buildDir = Join-Path $projectRoot "build"
if (Test-Path $buildDir) {
    Remove-Item $buildDir -Recurse -Force
    Write-Host "   - Removed build/" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "         CLEANUP COMPLETED              " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Lambda log groups (/aws/lambda/...) are kept; delete them in CloudWatch if you no longer need them."
