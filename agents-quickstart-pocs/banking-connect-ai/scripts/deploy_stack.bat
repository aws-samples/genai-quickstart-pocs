@echo off
REM Deploy Lambda-based MCP functions for AgentCore Gateway
REM Fully private, bank-compliant architecture

setlocal enabledelayedexpansion

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=dev

if "%AWS_REGION%"=="" set REGION=us-east-1
if not "%AWS_REGION%"=="" set REGION=%AWS_REGION%

echo =========================================
echo BetterBank Stack Deployment
echo Environment: %ENVIRONMENT%
echo Region: %REGION%
echo =========================================

REM Deploy CDK stacks
echo.
echo Deploying BetterBank stacks...
call cdk deploy --all -c environment=%ENVIRONMENT% --require-approval never
if errorlevel 1 (
    echo ERROR: Deployment failed
    exit /b 1
)

REM Get outputs
echo.
echo =========================================
echo ✅ Deployment complete!
echo =========================================
echo.
echo BetterBank stacks deployed successfully!
echo.

echo Gateway Role ARN (use when creating Gateway):
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name betterbank-mcp-lambda-%ENVIRONMENT% --query "Stacks[0].Outputs[?OutputKey==`GatewayRoleArn`].OutputValue" --output text') do echo %%i

echo.
echo Lambda ARNs for Gateway targets:
echo.

for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name betterbank-mcp-lambda-%ENVIRONMENT% --query "Stacks[0].Outputs[?OutputKey==`LockCardLambdaArn`].OutputValue" --output text') do echo LockCardLambdaArn: %%i

for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name betterbank-mcp-lambda-%ENVIRONMENT% --query "Stacks[0].Outputs[?OutputKey==`UnlockCardLambdaArn`].OutputValue" --output text') do echo UnlockCardLambdaArn: %%i

for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name betterbank-mcp-lambda-%ENVIRONMENT% --query "Stacks[0].Outputs[?OutputKey==`RequestNewCardLambdaArn`].OutputValue" --output text') do echo RequestNewCardLambdaArn: %%i

echo.
echo NEXT STEPS:
echo.
echo Configure AgentCore Gateway via AWS Console:
echo 1. Go to Bedrock AgentCore Gateway console
echo 2. Create new Gateway with the Gateway Role ARN above
echo 3. Add 3 Lambda targets using the Lambda ARNs above
echo 4. Configure Bedrock Agent to use the Gateway
echo 5. Test with Amazon Connect
echo.
echo See LAMBDA_MCP_DEPLOYMENT.md for detailed instructions
echo.

endlocal
