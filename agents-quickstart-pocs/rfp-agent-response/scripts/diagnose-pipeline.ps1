#!/usr/bin/env pwsh

param(
    [string]$InfraStackName = "terminal-upload",
    [string]$Region = "us-east-1"
)

# Disable AWS CLI paging
$env:AWS_PAGER = ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RFP Pipeline Diagnostics              " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get infrastructure details
Write-Host "1. Getting infrastructure details..." -ForegroundColor Yellow

try {
    $BUCKET_NAME = aws cloudformation describe-stacks --stack-name $InfraStackName --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' --output text --region $Region --no-paginate
    $FUNCTION_NAME = aws cloudformation describe-stacks --stack-name $InfraStackName --query 'Stacks[0].Outputs[?OutputKey==`FunctionName`].OutputValue' --output text --region $Region --no-paginate
    $QUESTION_PROCESSOR_NAME = aws cloudformation describe-stacks --stack-name $InfraStackName --query 'Stacks[0].Outputs[?OutputKey==`QuestionProcessorFunctionName`].OutputValue' --output text --region $Region --no-paginate
    $COMPLIANCE_AGENT_NAME = aws cloudformation describe-stacks --stack-name $InfraStackName --query 'Stacks[0].Outputs[?OutputKey==`ComplianceAgentFunctionName`].OutputValue' --output text --region $Region --no-paginate
    $DRAFTING_AGENT_NAME = aws cloudformation describe-stacks --stack-name $InfraStackName --query 'Stacks[0].Outputs[?OutputKey==`DraftingAgentFunctionName`].OutputValue' --output text --region $Region --no-paginate

    Write-Host "   - Bucket: $BUCKET_NAME" -ForegroundColor Green
    Write-Host "   - RFP Processor: $FUNCTION_NAME" -ForegroundColor Green
    Write-Host "   - Question Processor: $QUESTION_PROCESSOR_NAME" -ForegroundColor Green
    Write-Host "   - Compliance Agent: $COMPLIANCE_AGENT_NAME" -ForegroundColor Green
    Write-Host "   - Drafting Agent: $DRAFTING_AGENT_NAME" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Could not get infrastructure details" -ForegroundColor Red
    Write-Host "   Make sure the CloudFormation stack '$InfraStackName' exists" -ForegroundColor Red
    exit 1
}

# Check S3 bucket structure
Write-Host ""
Write-Host "2. Checking S3 bucket structure..." -ForegroundColor Yellow

$folders = @("uploaded_rfp_requests", "formatted_questions", "completed_responses", "compliance_reviewed", "final_responses")

foreach ($folder in $folders) {
    try {
        $objects = aws s3 ls s3://$BUCKET_NAME/$folder/ --region $Region --no-paginate 2>$null
        if ($objects) {
            $count = ($objects -split "`n" | Where-Object { $_.Trim() -ne "" }).Count
            Write-Host "   - $folder/: $count files" -ForegroundColor Green
            
            # Show recent files
            $recentFiles = aws s3 ls s3://$BUCKET_NAME/$folder/ --region $Region --no-paginate 2>$null | Select-Object -Last 3
            foreach ($file in $recentFiles) {
                if ($file.Trim()) {
                    $fileName = ($file -split '\s+')[-1]
                    Write-Host "     * $fileName" -ForegroundColor Gray
                }
            }
        } else {
            Write-Host "   - $folder/: empty" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   - $folder/: error checking" -ForegroundColor Red
    }
}

# Check S3 bucket notifications
Write-Host ""
Write-Host "3. Checking S3 bucket notifications..." -ForegroundColor Yellow

try {
    $notifications = aws s3api get-bucket-notification-configuration --bucket $BUCKET_NAME --region $Region --no-paginate 2>$null | ConvertFrom-Json
    
    if ($notifications.LambdaFunctionConfigurations) {
        Write-Host "   - Found $($notifications.LambdaFunctionConfigurations.Count) Lambda triggers:" -ForegroundColor Green
        foreach ($config in $notifications.LambdaFunctionConfigurations) {
            $functionName = ($config.LambdaFunctionArn -split ':')[-1]
            $prefix = ($config.Filter.Key.FilterRules | Where-Object { $_.Name -eq "prefix" }).Value
            $suffix = ($config.Filter.Key.FilterRules | Where-Object { $_.Name -eq "suffix" }).Value
            Write-Host "     * $functionName: $prefix*$suffix" -ForegroundColor Gray
        }
    } else {
        Write-Host "   - No Lambda triggers configured!" -ForegroundColor Red
        Write-Host "     This is likely the main issue - files won't trigger processing" -ForegroundColor Red
    }
} catch {
    Write-Host "   - Error checking bucket notifications" -ForegroundColor Red
}

# Check Lambda function status
Write-Host ""
Write-Host "4. Checking Lambda function status..." -ForegroundColor Yellow

$functions = @($FUNCTION_NAME, $QUESTION_PROCESSOR_NAME, $COMPLIANCE_AGENT_NAME, $DRAFTING_AGENT_NAME)

foreach ($func in $functions) {
    try {
        $status = aws lambda get-function --function-name $func --region $Region --query 'Configuration.State' --output text --no-paginate 2>$null
        $lastModified = aws lambda get-function --function-name $func --region $Region --query 'Configuration.LastModified' --output text --no-paginate 2>$null
        
        if ($status -eq "Active") {
            Write-Host "   - $func: $status (updated: $lastModified)" -ForegroundColor Green
        } else {
            Write-Host "   - $func: $status" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   - $func: ERROR" -ForegroundColor Red
    }
}

# Check recent Lambda logs for errors
Write-Host ""
Write-Host "5. Checking recent Lambda logs for errors..." -ForegroundColor Yellow

foreach ($func in $functions) {
    try {
        $logGroup = "/aws/lambda/$func"
        $recentLogs = aws logs describe-log-streams --log-group-name $logGroup --order-by LastEventTime --descending --max-items 1 --region $Region --no-paginate 2>$null | ConvertFrom-Json
        
        if ($recentLogs.logStreams -and $recentLogs.logStreams.Count -gt 0) {
            $latestStream = $recentLogs.logStreams[0].logStreamName
            $errors = aws logs filter-log-events --log-group-name $logGroup --log-stream-names $latestStream --filter-pattern "ERROR" --region $Region --no-paginate 2>$null | ConvertFrom-Json
            
            if ($errors.events -and $errors.events.Count -gt 0) {
                Write-Host "   - $func: $($errors.events.Count) recent errors" -ForegroundColor Red
                $errors.events | Select-Object -Last 2 | ForEach-Object {
                    $timestamp = [DateTimeOffset]::FromUnixTimeMilliseconds($_.timestamp).ToString("yyyy-MM-dd HH:mm:ss")
                    Write-Host "     [$timestamp] $($_.message.Substring(0, [Math]::Min(100, $_.message.Length)))" -ForegroundColor Gray
                }
            } else {
                Write-Host "   - $func: no recent errors" -ForegroundColor Green
            }
        } else {
            Write-Host "   - $func: no recent logs" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   - $func: could not check logs" -ForegroundColor Gray
    }
}

# Check DynamoDB status table
Write-Host ""
Write-Host "6. Checking DynamoDB status table..." -ForegroundColor Yellow

try {
    $tableStatus = aws dynamodb describe-table --table-name rfp-processing-status --region $Region --query 'Table.TableStatus' --output text --no-paginate 2>$null
    
    if ($tableStatus -eq "ACTIVE") {
        Write-Host "   - Table status: $tableStatus" -ForegroundColor Green
        
        # Get recent items
        $recentItems = aws dynamodb scan --table-name rfp-processing-status --region $Region --max-items 5 --no-paginate 2>$null | ConvertFrom-Json
        
        if ($recentItems.Items -and $recentItems.Items.Count -gt 0) {
            Write-Host "   - Recent processing jobs:" -ForegroundColor Green
            foreach ($item in $recentItems.Items) {
                $fileName = $item.file_name.S
                $overallStatus = $item.overall_status.S
                $currentStage = if ($item.current_stage) { $item.current_stage.S } else { "unknown" }
                Write-Host "     * $fileName: $overallStatus (stage: $currentStage)" -ForegroundColor Gray
            }
        } else {
            Write-Host "   - No processing jobs found" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   - Table status: $tableStatus" -ForegroundColor Red
    }
} catch {
    Write-Host "   - Error checking DynamoDB table" -ForegroundColor Red
}

# Recommendations
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RECOMMENDATIONS                       " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if (-not $notifications.LambdaFunctionConfigurations) {
    Write-Host ""
    Write-Host "CRITICAL ISSUE: No S3 bucket notifications configured!" -ForegroundColor Red
    Write-Host "This means uploaded files won't trigger Lambda processing." -ForegroundColor Red
    Write-Host ""
    Write-Host "To fix this, run:" -ForegroundColor Yellow
    Write-Host "  .\scripts\deploy-complete.ps1 -SkipPackaging" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "To test the pipeline:" -ForegroundColor Green
Write-Host "1. Upload a PDF or TXT file to: s3://$BUCKET_NAME/uploaded_rfp_requests/" -ForegroundColor Gray
Write-Host "2. Watch the processing stages in DynamoDB and S3 folders" -ForegroundColor Gray
Write-Host "3. Check Lambda logs for any errors" -ForegroundColor Gray
Write-Host ""
Write-Host "To manually trigger processing:" -ForegroundColor Green
Write-Host "  aws lambda invoke --function-name $FUNCTION_NAME --payload file://test-event.json response.json" -ForegroundColor Gray
Write-Host ""