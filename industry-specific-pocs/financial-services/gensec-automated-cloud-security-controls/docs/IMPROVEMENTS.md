# Infrastructure Improvements Plan

This document outlines recommended improvements for the security configuration system infrastructure.

## 1. Security Enhancements

### 1.1 KMS Encryption
Add customer-managed KMS keys for enhanced encryption:

```hcl
# KMS key for encryption
resource "aws_kms_key" "security_config_key" {
  description             = "KMS key for security configuration system"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "security-config-kms-key"
    Environment = var.environment
  }
}

# Update S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "security_config_outputs_encryption" {
  bucket = aws_s3_bucket.security_config_outputs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.security_config_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Update DynamoDB encryption
resource "aws_dynamodb_table" "security_control_library" {
  # ... existing configuration ...
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.security_config_key.arn
  }
}
```

### 1.2 VPC Endpoints
Add VPC endpoints for private access:

```hcl
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = var.vpc_id
  service_name = "com.amazonaws.${var.aws_region}.s3"
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = var.vpc_id
  service_name = "com.amazonaws.${var.aws_region}.dynamodb"
}

resource "aws_vpc_endpoint" "lambda" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${var.aws_region}.lambda"
  vpc_endpoint_type = "Interface"
  subnet_ids        = var.private_subnet_ids
  security_group_ids = [aws_security_group.vpc_endpoint.id]
}
```

### 1.3 S3 Bucket Replication
Implement cross-region replication for disaster recovery:

```hcl
resource "aws_s3_bucket_replication_configuration" "security_config_replication" {
  bucket = aws_s3_bucket.security_config_outputs.id
  role   = aws_iam_role.replication_role.arn

  rule {
    id     = "security-config-replication"
    status = "Enabled"

    destination {
      bucket = aws_s3_bucket.security_config_outputs_replica.arn
      encryption_configuration {
        replica_kms_key_id = aws_kms_key.security_config_key_replica.arn
      }
    }
  }
}
```

## 2. Operational Improvements

### 2.1 CloudWatch Alarms
Add monitoring alarms:

```hcl
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "security-config-handler-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name        = "Errors"
  namespace          = "AWS/Lambda"
  period             = "300"
  statistic          = "Sum"
  threshold          = "1"
  alarm_description  = "Security configuration handler error rate"
  alarm_actions      = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = "gensec-AnalyzeSecurityRequirements"  # Monitor decomposed functions
  }
}

resource "aws_cloudwatch_metric_alarm" "step_functions_failed" {
  alarm_name          = "security-config-workflow-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name        = "ExecutionsFailed"
  namespace          = "AWS/States"
  period             = "300"
  statistic          = "Sum"
  threshold          = "1"
  alarm_description  = "Security configuration workflow failures"
  alarm_actions      = [aws_sns_topic.alerts.arn]

  dimensions = {
    StateMachineArn = "arn:aws:states:region:account:stateMachine:gensec-SecurityConfigWorkflow"
  }
}
```

### 2.2 X-Ray Tracing
Enable X-Ray tracing:

```hcl
resource "aws_lambda_function" "security_configuration_handler_v2" {
  # ... existing configuration ...
  tracing_config {
    mode = "Active"
  }
}

# Add X-Ray policy to Lambda role
resource "aws_iam_role_policy_attachment" "xray_policy" {
  role       = aws_iam_role.security_config_handler_role_v2.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}
```

### 2.3 Dead Letter Queues
Add DLQ for failed executions:

```hcl
resource "aws_sqs_queue" "dlq" {
  name = "security-config-dlq"
  kms_master_key_id = aws_kms_key.security_config_key.id
}

resource "aws_lambda_function" "security_configuration_handler_v2" {
  # ... existing configuration ...
  dead_letter_config {
    target_arn = aws_sqs_queue.dlq.arn
  }
}
```

## 3. Cost Optimization

### 3.1 DynamoDB Auto-scaling
Add DynamoDB auto-scaling:

```hcl
resource "aws_appautoscaling_target" "dynamodb_table_read_target" {
  max_capacity       = 100
  min_capacity       = 5
  resource_id        = "table/${aws_dynamodb_table.security_control_library_v2.name}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamodb_table_read_policy" {
  name               = "DynamoDBReadCapacityUtilization:${aws_appautoscaling_target.dynamodb_table_read_target.resource_id}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_table_read_target.resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_table_read_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_table_read_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }
    target_value = 70.0
  }
}
```

### 3.2 S3 Lifecycle Policies
Add S3 lifecycle policies:

```hcl
resource "aws_s3_bucket_lifecycle_configuration" "security_config_lifecycle" {
  bucket = aws_s3_bucket.security_config_outputs.id

  rule {
    id     = "archive-old-configs"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "INTELLIGENT_TIERING"
    }

    transition {
      days          = 180
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}
```

## 4. Performance Improvements

### 4.1 DynamoDB GSIs
Add Global Secondary Indexes for common queries:

```hcl
resource "aws_dynamodb_table" "service_request_tracking" {
  # ... existing configuration ...

  global_secondary_index {
    name               = "StatusIndex"
    hash_key           = "status"
    range_key         = "timestamp"
    projection_type    = "ALL"
  }

  attribute {
    name = "status"
    type = "S"
  }
}
```

### 4.2 Lambda Performance
Optimize Lambda settings:

```hcl
resource "aws_lambda_function" "security_configuration_handler_v2" {
  # ... existing configuration ...
  memory_size = 2048  # Increased for better performance
  
  # Add provisioned concurrency for consistent performance
  provisioned_concurrent_executions = 5
}

# Add Lambda alias for provisioned concurrency
resource "aws_lambda_alias" "security_config_handler_alias" {
  name             = "production"
  description      = "Production alias for security config handler"
  function_name    = aws_lambda_function.security_configuration_handler_v2.function_name
  function_version = "$LATEST"
}
```

## 5. Additional Improvements

### 5.1 Resource Tagging Strategy
Implement comprehensive tagging:

```hcl
locals {
  common_tags = {
    Environment     = var.environment
    Project        = "security-config-system"
    Owner          = "security-team"
    CostCenter     = "security-operations"
    DataClass      = "confidential"
    Backup         = "true"
    SecurityZone   = "restricted"
  }
}

# Apply to all resources
resource "aws_lambda_function" "security_configuration_handler_v2" {
  # ... existing configuration ...
  tags = merge(local.common_tags, {
    Name = "2SecurityConfigurationHandler"
  })
}
```

### 5.2 Backup Strategy
Implement comprehensive backup:

```hcl
resource "aws_backup_plan" "security_config" {
  name = "security-config-backup-plan"

  rule {
    rule_name         = "daily-backup"
    target_vault_name = aws_backup_vault.security_config.name
    schedule          = "cron(0 5 ? * * *)"
    
    lifecycle {
      cold_storage_after = 30
      delete_after       = 180
    }
  }
}

resource "aws_backup_selection" "security_config" {
  name         = "security-config-backup-selection"
  plan_id      = aws_backup_plan.security_config.id
  iam_role_arn = aws_iam_role.backup_role.arn

  selection_tag {
    type  = "STRINGEQUALS"
    key   = "Backup"
    value = "true"
  }
}
```

## Implementation Plan

1. **Phase 1: Security (High Priority)**
   - Implement KMS encryption
   - Add VPC endpoints
   - Set up S3 replication

2. **Phase 2: Monitoring (High Priority)**
   - Add CloudWatch alarms
   - Enable X-Ray tracing
   - Implement DLQ handling

3. **Phase 3: Performance (Medium Priority)**
   - Add DynamoDB GSIs
   - Optimize Lambda settings
   - Implement caching

4. **Phase 4: Cost Optimization (Medium Priority)**
   - Set up DynamoDB auto-scaling
   - Implement S3 lifecycle policies
   - Configure provisioned concurrency

5. **Phase 5: Operations (Low Priority)**
   - Implement tagging strategy
   - Set up backup policies
   - Add documentation

## Cost Impact

Estimated monthly cost changes:

| Improvement | Cost Impact | Benefit |
|------------|-------------|----------|
| KMS Keys | +$1/month/key | Enhanced security |
| VPC Endpoints | +$7.50/endpoint/month | Private access |
| S3 Replication | Data transfer costs | Disaster recovery |
| X-Ray Tracing | Usage-based (~$5/month) | Better debugging |
| DynamoDB Auto-scaling | Cost savings | Optimal capacity |
| Lambda Provisioned Concurrency | +$0.015/hour/instance | Consistent performance |

## Monitoring Recommendations

1. **CloudWatch Dashboards**:
   - Lambda performance metrics
   - Step Functions execution metrics
   - DynamoDB capacity usage
   - S3 bucket metrics

2. **Alerts**:
   - Lambda errors and timeouts
   - Step Functions failures
   - DynamoDB throttling
   - S3 access patterns

3. **Logging**:
   - Centralized log analysis
   - Error pattern detection
   - Security event monitoring
   - Cost anomaly detection

## Next Steps

1. Review and prioritize improvements
2. Create test environment for validation
3. Implement changes incrementally
4. Monitor impact and adjust as needed
5. Update documentation and runbooks
