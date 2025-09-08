#!/bin/bash

#############################################################################
# Deploy with Pre-Tests - Wrapper Script
#############################################################################
#
# This script runs pre-deployment tests before calling the main deploy.sh
# script. It ensures code quality and prevents broken deployments.
#
# USAGE:
#   ./deploy-with-tests.sh [options] [environment] [region]
#
# OPTIONS:
#   --skip-tests          Skip all pre-deployment tests (urgent deployments)
#   --ignore-test-failures Continue deployment even if tests fail
#   --skip-health-check   Skip health check validation
#
# ENVIRONMENT VARIABLES:
#   SKIP_PERFORMANCE_TESTS=true  Skip performance tests (faster deployment)
#   NEWSAPI_KEY=your_key         NewsAPI key for provider tests
#   FRED_API_KEY=your_key        FRED API key for provider tests
#
# EXAMPLES:
#   ./deploy-with-tests.sh poc us-east-1
#   ./deploy-with-tests.sh --skip-tests poc us-east-1
#   ./deploy-with-tests.sh --ignore-test-failures poc us-east-1
#   ./deploy-with-tests.sh dev us-west-2
#
# API KEYS (optional - set via environment variables):
#   export NEWSAPI_KEY=your_key
#   export FRED_API_KEY=your_key
#
# WINDOWS COMPATIBILITY:
#   - Run in Git Bash, WSL2, or PowerShell with bash support
#   - Ensure Docker Desktop is using Linux containers
#   - AWS CLI must be installed and configured
#
#############################################################################

# Exit on any error to prevent partial deployments
set -e

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Platform detection
detect_platform() {
    case "$(uname -s)" in
        CYGWIN*|MINGW*|MSYS*)
            PLATFORM="windows"
            ;;
        Darwin*)
            PLATFORM="macos"
            ;;
        Linux*)
            PLATFORM="linux"
            ;;
        *)
            PLATFORM="unknown"
            ;;
    esac
}

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Windows-specific validation
validate_windows_environment() {
    if [ "$PLATFORM" = "windows" ]; then
        log "Windows environment detected - performing additional validation..."
        
        # Check if running in appropriate shell environment
        if [ -z "$BASH_VERSION" ]; then
            error "This script requires Bash. Please run in Git Bash, WSL2, or install Windows Subsystem for Linux"
        fi
        
        # Check Docker Desktop configuration
        if docker version --format '{{.Server.Os}}' 2>/dev/null | grep -q "windows"; then
            error "Docker is using Windows containers. Switch to Linux containers in Docker Desktop settings"
        fi
        
        # Provide Windows-specific guidance
        info "Windows deployment validated:"
        info "  ✓ Running in Bash environment"
        info "  ✓ Docker Desktop configured for Linux containers"
        
        # Check for common Windows path issues
        if [[ "$PWD" == *" "* ]]; then
            warn "Current directory path contains spaces. This may cause issues with some tools"
            warn "Consider moving project to a path without spaces"
        fi
    fi
}

# Detect platform early
detect_platform

echo ""
echo "🚀 Advisor Assistant Deployment with Pre-Tests"
echo "=============================================="
echo "Platform: $PLATFORM"
echo ""

# Validate Windows environment if needed
validate_windows_environment

# Parse command line options
SKIP_TESTS=false
IGNORE_TEST_FAILURES=false
SKIP_HEALTH_CHECK=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            SKIP_TESTS=true
            warn "All pre-deployment tests will be skipped"
            shift
            ;;
        --ignore-test-failures)
            IGNORE_TEST_FAILURES=true
            warn "Test failures will be ignored - deployment will continue"
            shift
            ;;
        --skip-health-check)
            SKIP_HEALTH_CHECK=true
            export SKIP_HEALTH_CHECK=true
            warn "Health check will be bypassed - use when application is broken"
            shift
            ;;
        *)
            # Not an option, break to handle environment/region args
            break
            ;;
    esac
done

# Validate deployment safety
if [ "$SKIP_TESTS" = true ] && [ "$IGNORE_TEST_FAILURES" = true ]; then
    warn "Both --skip-tests and --ignore-test-failures specified"
    warn "Using --skip-tests (tests will not run at all)"
    IGNORE_TEST_FAILURES=false
fi

# Step 1: Run pre-deployment tests (unless skipped)
if [ "$SKIP_TESTS" = true ]; then
    warn "⚠️  SKIPPING ALL PRE-DEPLOYMENT TESTS"
    warn "This should only be used for urgent deployments when tests are known to be broken"
    warn "Proceeding directly to deployment..."
    echo ""
else
    log "Step 1: Running pre-deployment tests..."
    echo ""
    
    # Verify pre-deploy-tests.sh exists and is executable
    if [ ! -f "scripts/pre-deploy-tests.sh" ]; then
        error "Pre-deployment test script not found: scripts/pre-deploy-tests.sh"
    fi
    
    if [ ! -x "scripts/pre-deploy-tests.sh" ]; then
        warn "Making pre-deploy-tests.sh executable..."
        chmod +x scripts/pre-deploy-tests.sh
    fi
    
    # Set platform-specific environment variables for tests
    export DOCKER_DEFAULT_PLATFORM=linux/amd64
    
    # Run tests with appropriate error handling
    if ./scripts/pre-deploy-tests.sh; then
        echo ""
        log "✅ All pre-deployment tests passed!"
        echo ""
    else
        TEST_EXIT_CODE=$?
        echo ""
        
        if [ "$IGNORE_TEST_FAILURES" = true ]; then
            warn "⚠️  PRE-DEPLOYMENT TESTS FAILED (exit code: $TEST_EXIT_CODE)"
            warn "Continuing with deployment due to --ignore-test-failures flag"
            warn "This may result in a broken deployment - use with caution"
            echo ""
        else
            error "Pre-deployment tests failed (exit code: $TEST_EXIT_CODE). Deployment aborted for safety."
            echo ""
            echo "💡 Options to proceed:"
            echo "   1. Fix the failing tests and run again (recommended)"
            echo "   2. Use --ignore-test-failures to deploy anyway (risky)"
            echo "   3. Use --skip-tests for urgent deployments (very risky)"
            echo ""
            if [ "$PLATFORM" = "windows" ]; then
                echo "🪟 Windows-specific troubleshooting:"
                echo "   - Ensure Docker Desktop is running with Linux containers"
                echo "   - Check that all paths use forward slashes"
                echo "   - Verify Node.js and npm are installed and in PATH"
                echo ""
            fi
            exit $TEST_EXIT_CODE
        fi
    fi
fi

# Step 2: Run the actual deployment
log "Step 2: Starting deployment..."
echo ""

# Ensure proper Docker platform flags are used consistently
export DOCKER_DEFAULT_PLATFORM=linux/amd64

# Enhanced error handling for CloudFormation stack dependencies
trap 'handle_deployment_error $? $LINENO "$BASH_COMMAND"' ERR

handle_deployment_error() {
    local exit_code=$1
    local line_number=$2
    local command="$3"
    
    error "Deployment failed at line $line_number with exit code $exit_code"
    error "Failed command: $command"
    
    # Get the region from arguments or use default
    local region="${2:-us-east-1}"
    
    # Check for common CloudFormation dependency issues
    if aws cloudformation describe-stacks --stack-name "advisor-assistant-poc-security" --region "$region" >/dev/null 2>&1; then
        info "Security stack exists - checking application stack..."
        
        if aws cloudformation describe-stacks --stack-name "advisor-assistant-poc-app" --region "$region" >/dev/null 2>&1; then
            warn "Both stacks exist - this may be a deployment configuration issue"
            warn "Check CloudFormation console for detailed error messages"
        else
            warn "Security stack exists but application stack failed"
            warn "This is likely an application infrastructure issue"
        fi
    else
        warn "Security stack may not exist or be accessible"
        warn "Check AWS credentials and permissions"
    fi
    
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "   1. Check AWS CloudFormation console for detailed error messages"
    echo "   2. Verify AWS credentials have sufficient permissions"
    echo "   3. Check if required resources are available in the region"
    echo "   4. Review CloudFormation template parameters"
    
    if [ "$PLATFORM" = "windows" ]; then
        echo ""
        echo "🪟 Windows-specific troubleshooting:"
        echo "   5. Ensure Docker Desktop is running and using Linux containers"
        echo "   6. Check that AWS CLI is properly installed and configured"
        echo "   7. Verify all file paths use forward slashes"
        echo "   8. Consider running in WSL2 if Git Bash has issues"
    fi
    
    echo ""
    
    exit $exit_code
}

# Verify deploy.sh exists and is executable
if [ ! -f "deploy.sh" ]; then
    error "Main deployment script not found: deploy.sh"
fi

if [ ! -x "deploy.sh" ]; then
    warn "Making deploy.sh executable..."
    chmod +x deploy.sh
fi

# Pass all remaining arguments to the original deploy script
./deploy.sh "$@"

# Clear the error trap on successful completion
trap - ERR

echo ""
log "🎉 Deployment completed successfully!"

# Display deployment summary
if [ "$SKIP_TESTS" = true ]; then
    warn "⚠️  Deployment completed WITHOUT pre-deployment tests"
    warn "Consider running tests manually to verify system integrity"
elif [ "$IGNORE_TEST_FAILURES" = true ]; then
    warn "⚠️  Deployment completed despite test failures"
    warn "Monitor application closely for potential issues"
else
    log "✅ Deployment completed with all tests passing"
fi

# Platform-specific post-deployment notes
if [ "$PLATFORM" = "windows" ]; then
    echo ""
    info "🪟 Windows deployment completed successfully!"
    info "If you encounter any issues, consider:"
    info "  - Using WSL2 for better Linux compatibility"
    info "  - Checking Docker Desktop logs for container issues"
    info "  - Verifying AWS CLI configuration with 'aws sts get-caller-identity'"
fi

echo ""