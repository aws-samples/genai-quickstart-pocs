#!/usr/bin/env pwsh
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
#
# Read-only health check of the RFP pipeline (Windows).
# Keep in sync with scripts/diagnose-pipeline.sh (macOS and Linux).
#
# Usage:
#   .\scripts\diagnose-pipeline.ps1 [-InfraStackName terminal-upload] [-WebStackName rfp-web-app] [-Region us-east-1]

param(
    [string]$InfraStackName = "terminal-upload",
    [string]$WebStackName = "rfp-web-app",
    [string]$Region = "us-east-1"
)

$env:AWS_PAGER = ""

function Write-Step([string]$Message) { Write-Host ""; Write-Host $Message -ForegroundColor Yellow }
function Write-Good([string]$Message) { Write-Host "   - $Message" -ForegroundColor Green }
function Write-Note([string]$Message) { Write-Host "   - $Message" -ForegroundColor Yellow }
function Write-Bad([string]$Message) { Write-Host "   - $Message" -ForegroundColor Red }
function Write-Detail([string]$Message) { Write-Host "     * $Message" -ForegroundColor Gray }

function Get-StackOutput([string]$StackName, [string]$OutputKey) {
    $value = aws cloudformation describe-stacks --stack-name $StackName --region $Region `
        --query "Stacks[0].Outputs[?OutputKey=='$OutputKey'].OutputValue" --output text 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $value -or $value -eq "None") { return "" }
    return "$value".Trim()
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RFP Pipeline Diagnostics" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Step "1. Getting infrastructure details..."
$bucketName = Get-StackOutput $InfraStackName "BucketName"
$tableName = Get-StackOutput $InfraStackName "TableName"
$functionList = Get-StackOutput $InfraStackName "LambdaFunctionNames"
if (-not $bucketName -or -not $functionList) {
    Write-Bad "Could not read stack '$InfraStackName' in $Region. Deploy with .\scripts\deploy.ps1 first."
    exit 1
}
$functions = $functionList -split ","
Write-Good "Bucket: $bucketName"
Write-Good "Status table: $tableName"
foreach ($fn in $functions) { Write-Good "Function: $fn" }

Write-Step "2. Checking S3 bucket structure..."
foreach ($prefix in @("uploaded_rfp_requests", "formatted_questions", "completed_responses", "compliance_reviewed", "final_responses")) {
    $count = aws s3api list-objects-v2 --bucket $bucketName --region $Region --prefix "$prefix/" `
        --query "KeyCount" --output text 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Bad "${prefix}/: error checking"
    } elseif ("$count".Trim() -eq "0") {
        Write-Note "${prefix}/: empty"
    } else {
        Write-Good "${prefix}/: $("$count".Trim()) files"
        $recent = aws s3api list-objects-v2 --bucket $bucketName --region $Region --prefix "$prefix/" `
            --query "reverse(sort_by(Contents, &LastModified))[:3].Key" --output json | ConvertFrom-Json
        foreach ($key in $recent) { Write-Detail ($key.Substring($prefix.Length + 1)) }
    }
}

Write-Step "3. Checking S3 event notifications (defined in infrastructure/cloudformation.yaml)..."
$notifications = aws s3api get-bucket-notification-configuration --bucket $bucketName --region $Region --output json 2>$null | ConvertFrom-Json
$noTriggers = -not ($notifications -and $notifications.LambdaFunctionConfigurations)
if ($noTriggers) {
    Write-Bad "No Lambda triggers configured! Uploaded files will not be processed."
} else {
    Write-Good "Lambda triggers:"
    foreach ($config in $notifications.LambdaFunctionConfigurations) {
        $name = ($config.LambdaFunctionArn -split ":")[-1]
        $prefix = ($config.Filter.Key.FilterRules | Where-Object { $_.Name -eq "Prefix" }).Value
        $suffix = ($config.Filter.Key.FilterRules | Where-Object { $_.Name -eq "Suffix" }).Value
        Write-Detail "${name}: $prefix*$suffix"
    }
}

Write-Step "4. Checking Lambda function status..."
foreach ($fn in $functions) {
    $state = aws lambda get-function-configuration --function-name $fn --region $Region `
        --query "[State, LastModified]" --output text 2>$null
    if ($LASTEXITCODE -ne 0) { $state = "ERROR" }
    if ("$state" -like "Active*") { Write-Good "${fn}: $state" } else { Write-Note "${fn}: $state" }
}

Write-Step "5. Checking Lambda logs for errors in the last hour..."
$startMs = [DateTimeOffset]::UtcNow.AddHours(-1).ToUnixTimeMilliseconds()
foreach ($fn in $functions) {
    $errors = aws logs filter-log-events --log-group-name "/aws/lambda/$fn" --region $Region `
        --start-time $startMs --filter-pattern ERROR --max-items 50 --query "length(events)" --output text 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Note "${fn}: no logs yet"
    } elseif ("$errors".Trim() -eq "0") {
        Write-Good "${fn}: no recent errors"
    } else {
        Write-Bad "${fn}: $("$errors".Trim()) recent errors"
        $messages = aws logs filter-log-events --log-group-name "/aws/lambda/$fn" --region $Region `
            --start-time $startMs --filter-pattern ERROR --max-items 2 --query "events[].message" --output json 2>$null | ConvertFrom-Json
        foreach ($message in $messages) {
            $line = ("$message" -replace "\s+", " ").Trim()
            Write-Detail $line.Substring(0, [Math]::Min(160, $line.Length))
        }
    }
}

Write-Step "6. Checking DynamoDB status table..."
$tableStatus = aws dynamodb describe-table --table-name $tableName --region $Region --query Table.TableStatus --output text 2>$null
if ($LASTEXITCODE -eq 0 -and $tableStatus -eq "ACTIVE") {
    Write-Good "Table status: ACTIVE"
    $jobs = aws dynamodb scan --table-name $tableName --region $Region --max-items 5 `
        --query "Items[].{name: file_name.S, status: overall_status.S, stage: current_stage.S}" --output json 2>$null | ConvertFrom-Json
    if ($jobs) {
        Write-Good "Recent processing jobs:"
        foreach ($job in $jobs) { Write-Detail "$($job.name): $($job.status) (stage: $($job.stage))" }
    } else {
        Write-Note "No processing jobs found"
    }
} else {
    Write-Bad "Table status: $(if ($tableStatus) { $tableStatus } else { 'MISSING' })"
}

Write-Step "7. Checking API authentication..."
$apiUrl = Get-StackOutput $WebStackName "ApiGatewayURL"
if (-not $apiUrl) {
    Write-Note "Web stack '$WebStackName' not found"
} else {
    try {
        Invoke-WebRequest -Uri "$apiUrl/list-jobs" -Method GET -TimeoutSec 15 -UseBasicParsing | Out-Null
        $code = 200
    } catch {
        $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    }
    if ($code -eq 401) { Write-Good "Anonymous GET /list-jobs -> 401 (authentication required)" }
    else { Write-Bad "Anonymous GET /list-jobs -> $code (expected 401)" }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RECOMMENDATIONS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
if ($noTriggers) {
    Write-Host ""
    Write-Host "CRITICAL: No S3 event notifications are configured." -ForegroundColor Red
    Write-Host "Redeploy the infrastructure stack to restore them:"
    Write-Host "  .\scripts\deploy.ps1 -SkipPackaging -KnowledgeBaseId <ID>"
}
Write-Host ""
Write-Host "To test the pipeline:"
Write-Host "  1. Sign in to the web app and upload a PDF or TXT file"
Write-Host "  2. Watch the stages on the Job Status page or in s3://$bucketName/"
Write-Host "  3. Check the Lambda logs above (or in CloudWatch) for errors"
