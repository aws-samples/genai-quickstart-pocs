#!/bin/bash

#############################################################################
# Pre-Deployment Test Suite
#############################################################################
#
# Comprehensive validation suite that runs before each deployment to ensure
# code quality, syntax validity, and application health.
#
# USAGE:
#   ./scripts/pre-deploy-tests.sh
#
# EXIT CODES:
#   0 - All tests passed
#   1 - One or more tests failed
#
#############################################################################

# Exit on any error
set -e

# ANSI color codes for output formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ️  $1${NC}"
}

# Test execution wrapper
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    info "Running: $test_name"
    
    if eval "$test_command" > /dev/null 2>&1; then
        log "$test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        error "$test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test execution wrapper with output capture
run_test_with_output() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    info "Running: $test_name"
    
    local output
    if output=$(eval "$test_command" 2>&1); then
        log "$test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        error "$test_name"
        echo "Output: $output"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo ""
echo "🧪 Pre-Deployment Test Suite"
echo "============================"
echo ""

#############################################################################
# 1. SYNTAX AND STRUCTURE VALIDATION
#############################################################################

info "📋 Phase 1: Syntax and Structure Validation"
echo ""

# JavaScript syntax validation
run_test "Main application syntax" "node -c src/index.js"
run_test "AWS Services syntax" "node -c src/services/awsServices.js"
run_test "Enhanced AI Analyzer syntax" "node -c src/services/enhancedAiAnalyzer.js"
run_test "Cognito Auth syntax" "node -c src/services/cognitoAuth.js"
run_test "Advisor Assistant syntax" "node -c src/services/advisorAssistant.js"
run_test "User Config syntax" "node -c src/services/userConfig.js"

# JSON validation
run_test "package.json validity" "cat package.json | jq . > /dev/null"
run_test "environments.json validity" "cat config/environments.json | jq . > /dev/null"

# File structure validation
run_test "Essential files exist" "test -f src/index.js && test -f package.json && test -f deploy.sh && test -f Dockerfile"
run_test "Public HTML files exist" "test -f public/index.html && test -f public/login.html && test -f public/admin.html"
run_test "CloudFormation templates exist" "test -f cloudformation/01-security-foundation-poc.yaml && test -f cloudformation/02-application-infrastructure-poc.yaml"

echo ""

#############################################################################
# 2. DEPENDENCY AND IMPORT VALIDATION
#############################################################################

info "📦 Phase 2: Dependency and Import Validation"
echo ""

# Node.js dependency imports
run_test_with_output "Service imports" "node -e \"
try {
  require('./src/services/awsServices');
  require('./src/services/cognitoAuth');
  require('./src/services/advisorAssistant');
  require('./src/services/enhancedAiAnalyzer');
  require('./src/services/userConfig');
  console.log('All service imports successful');
} catch (error) {
  console.error('Import error:', error.message);
  process.exit(1);
}
\""

# NPM package validation
run_test "NPM dependencies check" "npm ls --depth=0 > /dev/null"

# Provider test validation
run_test "Provider test files exist" "test -f src/services/providers/__tests__/YahooFinanceProvider.test.js && test -f src/services/providers/__tests__/NewsAPIProvider.test.js && test -f src/services/providers/__tests__/FREDProvider.test.js"
run_test "Integration test files exist" "test -f src/services/providers/__tests__/integration.test.js && test -f src/services/providers/__tests__/performance.test.js"

echo ""

#############################################################################
# 3. CONFIGURATION VALIDATION
#############################################################################

info "⚙️  Phase 3: Configuration Validation"
echo ""

# Environment file validation
run_test "Environment file exists" "test -f .env"
run_test "Environment example exists" "test -f .env.example"

# Docker configuration
run_test "Dockerfile exists" "test -f Dockerfile"
run_test "Docker compose syntax" "DOCKER_DEFAULT_PLATFORM=linux/amd64 docker-compose config > /dev/null"

# Script permissions
run_test "Deploy script executable" "test -x deploy.sh"
run_test "Windows setup script executable" "test -x scripts/windows-setup.ps1"

echo ""

#############################################################################
# 4. NPM SCRIPT VALIDATION
#############################################################################

info "📜 Phase 4: NPM Script Validation"
echo ""

# Test all NPM scripts
run_test_with_output "NPM build script" "npm run build"
run_test_with_output "NPM lint script" "npm run lint"

# Run comprehensive provider tests
info "Running comprehensive provider test suite..."
run_test_with_output "Provider unit tests" "npm test -- --testPathPattern='src/services/providers/__tests__' --testNamePattern='(YahooFinanceProvider|NewsAPIProvider|FREDProvider|EnhancedDataAggregator|ErrorHandler|EnvironmentConfig|FeatureFlagManager|ProviderMonitor)' --verbose=false --silent=true --forceExit"
run_test_with_output "Data provider factory tests" "npm test -- --testPathPattern='src/services/__tests__/dataProviderFactory.test.js' --verbose=false --silent=true --forceExit"
run_test_with_output "Integration tests" "npm test -- --testPathPattern='src/services/providers/__tests__/integration.test.js' --verbose=false --silent=true --forceExit"

# Optional performance tests (can be skipped if they take too long)
if [ "$SKIP_PERFORMANCE_TESTS" != "true" ]; then
    info "Running performance tests (set SKIP_PERFORMANCE_TESTS=true to skip)..."
    if ! run_test_with_output "Performance tests" "npm test -- --testPathPattern='src/services/providers/__tests__/performance.test.js' --testTimeout=60000 --verbose=false --silent=true --forceExit"; then
        warn "Performance tests failed - this may indicate performance issues but won't block deployment"
        warn "Consider investigating performance test failures after deployment"
    fi
else
    warn "Performance tests skipped (SKIP_PERFORMANCE_TESTS=true)"
fi

echo ""

#############################################################################
# 5. APPLICATION HEALTH CHECK (if deployed)
#############################################################################

info "🏥 Phase 5: Application Health Check"
echo ""

# Check if health check bypass is requested
if [ "$SKIP_HEALTH_CHECK" = "true" ]; then
    warn "Health check bypassed via SKIP_HEALTH_CHECK=true"
    info "Use this when application is known to be broken and needs deployment to fix"
else

# Check if application is deployed and healthy
# Get ALB DNS dynamically from CloudFormation
ALB_DNS=$(aws cloudformation describe-stacks \
    --stack-name "advisor-assistant-poc-app" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApplicationLoadBalancerDNS`].OutputValue' \
    --output text \
    --region us-east-1 2>/dev/null || echo "")

if [ ! -z "$ALB_DNS" ]; then
    # Test if application is accessible
    if curl -s --connect-timeout 5 "http://$ALB_DNS/api/health" > /dev/null 2>&1; then
        # Application is responding, run full health checks
        HEALTH_RESPONSE=$(curl -s "http://$ALB_DNS/api/health" 2>/dev/null)
        if echo "$HEALTH_RESPONSE" | jq . > /dev/null 2>&1; then
            # Valid JSON response
            run_test_with_output "Deployed application health" "curl -s http://$ALB_DNS/api/health | jq -e '.status == \"healthy\"'"
            run_test "Health endpoint response format" "curl -s http://$ALB_DNS/api/health | jq -e 'has(\"status\") and has(\"timestamp\") and has(\"version\")'"
        else
            # Non-JSON response (likely error page)
            warn "Application responding but returning non-JSON (likely error state)"
            info "This suggests application needs to be redeployed - continuing with deployment"
            info "Response preview: $(echo \"$HEALTH_RESPONSE\" | head -c 100)..."
        fi
    else
        # Application not responding at all
        warn "Deployed application not accessible - skipping health checks"
        info "This is normal if:"
        info "  - Application hasn't been deployed yet"
        info "  - Application is in failed state (will be fixed by deployment)"
        info "  - ECS tasks are not running (will be started by deployment)"
    fi
else
    info "No ALB DNS found - application not deployed yet"
fi
fi  # End of SKIP_HEALTH_CHECK check

echo ""

#############################################################################
# 6. SECURITY AND BEST PRACTICES
#############################################################################

info "🔒 Phase 6: Security and Best Practices"
echo ""

# Check for AWS keys in code
run_test "No AWS keys in code" "! grep -r 'AKIA[0-9A-Z]{16}' src/ --include='*.js'"
run_test "Environment variables used" "grep -q 'process.env' src/index.js"

# Check for debug code (optional warnings)
if grep -r 'console.log' src/ --include='*.js' > /dev/null; then
    warn "Console.log statements found (acceptable for operational logging)"
fi

echo ""

#############################################################################
# 7. DEPLOYMENT READINESS
#############################################################################

info "🚀 Phase 7: Deployment Readiness"
echo ""

# Check deployment prerequisites
run_test "AWS CLI available" "command -v aws"
run_test "Docker available" "command -v docker"
run_test "Docker daemon running" "DOCKER_DEFAULT_PLATFORM=linux/amd64 docker info > /dev/null"
run_test "Docker buildx available" "docker buildx version > /dev/null"

echo ""

#############################################################################
# TEST SUMMARY
#############################################################################

echo "📊 Test Summary"
echo "==============="
echo ""
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    log "All tests passed! ✨ Ready for deployment"
    echo ""
    echo "🚀 Next steps:"
    echo "   OR"
    echo ""
    exit 0
else
    error "$TESTS_FAILED test(s) failed! ❌ Fix issues before deployment"
    echo ""
    echo "🔧 Please fix the failing tests before proceeding with deployment."
    echo ""
    exit 1
fi