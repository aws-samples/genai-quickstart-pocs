#!/bin/bash

#############################################################################
# ECS Deployment Debug Script
#############################################################################
#
# This script helps debug ECS deployment issues by showing detailed
# information about service status, task health, and deployment events.
#
# USAGE:
#   ./scripts/deployment-debug.sh [environment] [region]
#
#############################################################################

ENVIRONMENT=${1:-poc}
REGION=${2:-us-east-1}
APPLICATION_NAME="advisor-assistant"

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

echo ""
echo "🔍 ECS Deployment Debug"
echo "======================="
echo "Environment: ${ENVIRONMENT}"
echo "Region: ${REGION}"
echo ""

ECS_CLUSTER="${APPLICATION_NAME}-${ENVIRONMENT}-cluster"
ECS_SERVICE="${APPLICATION_NAME}-${ENVIRONMENT}-service"

# 1. Service Status
log "1. ECS Service Status"
echo "===================="
aws ecs describe-services \
    --cluster ${ECS_CLUSTER} \
    --services ${ECS_SERVICE} \
    --query 'services[0].{
        ServiceName: serviceName,
        Status: status,
        RunningCount: runningCount,
        PendingCount: pendingCount,
        DesiredCount: desiredCount,
        TaskDefinition: taskDefinition,
        LaunchType: launchType
    }' \
    --output table \
    --region ${REGION}

echo ""

# 2. Deployment Status
log "2. Current Deployments"
echo "====================="
aws ecs describe-services \
    --cluster ${ECS_CLUSTER} \
    --services ${ECS_SERVICE} \
    --query 'services[0].deployments[*].{
        Id: id,
        Status: status,
        TaskDefinition: taskDefinition,
        DesiredCount: desiredCount,
        PendingCount: pendingCount,
        RunningCount: runningCount,
        CreatedAt: createdAt,
        UpdatedAt: updatedAt
    }' \
    --output table \
    --region ${REGION}

echo ""

# 3. Task Status
log "3. Running Tasks"
echo "==============="
TASK_ARNS=$(aws ecs list-tasks \
    --cluster ${ECS_CLUSTER} \
    --service-name ${ECS_SERVICE} \
    --query 'taskArns' \
    --output text \
    --region ${REGION})

if [ ! -z "$TASK_ARNS" ]; then
    aws ecs describe-tasks \
        --cluster ${ECS_CLUSTER} \
        --tasks ${TASK_ARNS} \
        --query 'tasks[*].{
            TaskArn: taskArn,
            LastStatus: lastStatus,
            DesiredStatus: desiredStatus,
            HealthStatus: healthStatus,
            CreatedAt: createdAt,
            StartedAt: startedAt,
            CPU: cpu,
            Memory: memory
        }' \
        --output table \
        --region ${REGION}
else
    warn "No tasks found"
fi

echo ""

# 4. Recent Service Events
log "4. Recent Service Events (last 10)"
echo "=================================="
aws ecs describe-services \
    --cluster ${ECS_CLUSTER} \
    --services ${ECS_SERVICE} \
    --query 'services[0].events[:10].{
        CreatedAt: createdAt,
        Message: message
    }' \
    --output table \
    --region ${REGION}

echo ""

# 5. Target Group Health
log "5. Load Balancer Target Health"
echo "=============================="
APP_STACK_NAME="${APPLICATION_NAME}-${ENVIRONMENT}-app"
TARGET_GROUP_ARN=$(aws cloudformation describe-stacks \
    --stack-name "${APP_STACK_NAME}" \
    --query 'Stacks[0].Outputs[?OutputKey==`ALBTargetGroupArn`].OutputValue' \
    --output text \
    --region ${REGION} 2>/dev/null)

if [ ! -z "$TARGET_GROUP_ARN" ]; then
    aws elbv2 describe-target-health \
        --target-group-arn ${TARGET_GROUP_ARN} \
        --query 'TargetHealthDescriptions[*].{
            Target: Target.Id,
            Port: Target.Port,
            Health: TargetHealth.State,
            Reason: TargetHealth.Reason,
            Description: TargetHealth.Description
        }' \
        --output table \
        --region ${REGION}
else
    warn "Could not find target group ARN"
fi

echo ""

# 6. Application Health Check
log "6. Application Health Check"
echo "=========================="
ALB_DNS=$(aws cloudformation describe-stacks \
    --stack-name "${APP_STACK_NAME}" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApplicationLoadBalancerDNS`].OutputValue' \
    --output text \
    --region ${REGION} 2>/dev/null)

if [ ! -z "$ALB_DNS" ]; then
    info "Testing: http://${ALB_DNS}/api/health"
    if curl -s --connect-timeout 10 "http://${ALB_DNS}/api/health" | jq . 2>/dev/null; then
        log "✅ Health check successful"
    else
        warn "❌ Health check failed or returned non-JSON"
        echo "Raw response:"
        curl -s --connect-timeout 10 "http://${ALB_DNS}/api/health" || echo "Connection failed"
    fi
else
    warn "Could not find ALB DNS"
fi

echo ""

# 7. Recent CloudWatch Logs
log "7. Recent Application Logs (last 20 lines)"
echo "=========================================="
LOG_GROUP="/ecs/${APPLICATION_NAME}-${ENVIRONMENT}"
aws logs tail ${LOG_GROUP} \
    --since 10m \
    --format short \
    --region ${REGION} 2>/dev/null | tail -20 || warn "Could not fetch logs from ${LOG_GROUP}"

echo ""

# 8. Troubleshooting Suggestions
log "8. Troubleshooting Suggestions"
echo "=============================="

# Check if deployment is stuck
DEPLOYMENT_STATUS=$(aws ecs describe-services \
    --cluster ${ECS_CLUSTER} \
    --services ${ECS_SERVICE} \
    --query 'services[0].deployments[0].status' \
    --output text \
    --region ${REGION})

case $DEPLOYMENT_STATUS in
    "PRIMARY")
        info "✅ Deployment is stable"
        ;;
    "PENDING")
        warn "⏳ Deployment is in progress"
        echo "   - Wait for health checks to pass"
        echo "   - Check target group health above"
        echo "   - Monitor application logs"
        ;;
    "FAILED")
        error "❌ Deployment failed"
        echo "   - Check service events above for error details"
        echo "   - Verify task definition and container image"
        echo "   - Check application logs for startup errors"
        ;;
    *)
        warn "⚠️  Unknown deployment status: $DEPLOYMENT_STATUS"
        ;;
esac

echo ""
echo "🔧 Quick Actions:"
echo "  - Force new deployment: aws ecs update-service --cluster ${ECS_CLUSTER} --service ${ECS_SERVICE} --force-new-deployment --region ${REGION}"
echo "  - View logs: aws logs tail ${LOG_GROUP} --follow --region ${REGION}"
echo "  - Scale service: aws ecs update-service --cluster ${ECS_CLUSTER} --service ${ECS_SERVICE} --desired-count 1 --region ${REGION}"
echo ""