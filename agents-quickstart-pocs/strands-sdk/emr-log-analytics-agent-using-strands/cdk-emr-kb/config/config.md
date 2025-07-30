# Configuration Options

This document describes the configuration options for the EMR Knowledge Base CDK application.

## Configuration Sources

The application uses a hierarchical configuration system with the following sources (in order of precedence):

1. Command-line context parameters
2. Environment-specific context in `cdk.json`
3. `config/default.json` - Default configuration values

## Configuration Structure

The configuration is structured into the following sections:

- `vpc`: VPC configuration
- `redshift`: Redshift Serverless configuration
- `bedrock`: Bedrock Knowledge Base configuration
- `glue`: Glue Data Catalog configuration
- `tags`: Resource tagging configuration

## VPC Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `cidr` | string | `10.0.0.0/16` | CIDR block for the VPC |
| `maxAzs` | number | `3` | Maximum number of Availability Zones to use |
| `createPublicSubnets` | boolean | `true` | Whether to create public subnets |
| `createEndpoints` | boolean | `true` | Whether to create VPC endpoints for AWS services |

Example:

```json
"vpc": {
  "cidr": "10.0.0.0/16",
  "maxAzs": 3,
  "createPublicSubnets": true,
  "createEndpoints": true
}
```

## Redshift Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `namespaceName` | string | `emr-kb-namespace` | Name for the Redshift Serverless namespace |
| `workgroupName` | string | `emr-kb-workgroup` | Name for the Redshift Serverless workgroup |
| `databaseName` | string | `dev` | Name for the Redshift Serverless database |
| `baseCapacity` | number | `8` | Base RPU capacity for Redshift Serverless (min: 8, max: 512) |

Example:

```json
"redshift": {
  "namespaceName": "emr-kb-namespace-dev",
  "workgroupName": "emr-kb-workgroup-dev",
  "databaseName": "dev",
  "baseCapacity": 8
}
```

## Bedrock Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `kbName` | string | `EMR-SQL-KB` | Name for the Bedrock Knowledge Base |
| `kbDescription` | string | `SQL knowledge base for EMR troubleshooting` | Description for the Bedrock Knowledge Base |
| `modelId` | string | `anthropic.claude-3-sonnet-20240229-v1:0` | Model ID for the Bedrock Knowledge Base |

Example:

```json
"bedrock": {
  "kbName": "EMR-SQL-KB-Dev",
  "kbDescription": "SQL knowledge base for EMR troubleshooting (Development)",
  "modelId": "anthropic.claude-3-sonnet-20240229-v1:0"
}
```

## Glue Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `databaseName` | string | `emr_kb` | Name for the Glue database |

Example:

```json
"glue": {
  "databaseName": "emr_kb_dev"
}
```

## Tags Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `<key>` | string | - | Tag key-value pairs to apply to all resources |

Example:

```json
"tags": {
  "Project": "EMR-KB",
  "Environment": "Development",
  "Owner": "Data Team"
}
```

## Environment-Specific Configuration

The `cdk.json` file contains environment-specific configurations under the `environments` key. Each environment (e.g., `dev`, `prod`) has its own configuration that overrides the default values.

Example:

```json
"environments": {
  "dev": {
    "vpc": {
      "cidr": "10.0.0.0/16",
      "maxAzs": 3,
      "createPublicSubnets": true,
      "createEndpoints": true
    },
    "redshift": {
      "namespaceName": "emr-kb-namespace-dev",
      "workgroupName": "emr-kb-workgroup-dev",
      "databaseName": "dev",
      "baseCapacity": 8
    },
    "bedrock": {
      "kbName": "EMR-SQL-KB-Dev",
      "kbDescription": "SQL knowledge base for EMR troubleshooting (Development)"
    },
    "glue": {
      "databaseName": "emr_kb_dev"
    }
  },
  "prod": {
    "vpc": {
      "cidr": "10.0.0.0/16",
      "maxAzs": 3,
      "createPublicSubnets": false,
      "createEndpoints": true
    },
    "redshift": {
      "namespaceName": "emr-kb-namespace-prod",
      "workgroupName": "emr-kb-workgroup-prod",
      "databaseName": "prod",
      "baseCapacity": 16
    },
    "bedrock": {
      "kbName": "EMR-SQL-KB-Prod",
      "kbDescription": "SQL knowledge base for EMR troubleshooting (Production)"
    },
    "glue": {
      "databaseName": "emr_kb_prod"
    }
  }
}
```

## Command-Line Context Parameters

You can override configuration values using command-line context parameters:

```bash
cdk deploy --all --context env=dev --context vpc.cidr=10.1.0.0/16
```

## Configuration Validation

The application validates the configuration against a JSON schema to ensure that all required parameters are provided and have the correct types. If the configuration is invalid, the application will fail with an error message.

You can validate the configuration using the `validate_config.py` script:

```bash
python scripts/validate_config.py --env dev
```