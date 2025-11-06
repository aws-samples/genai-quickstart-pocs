# Lambda Layers for Security System

This directory contains Lambda layers that provide common dependencies for the security system Lambda functions. Using layers reduces deployment package sizes, improves cold start times, and enables better dependency management.

## Layer Structure

### 1. Common Layer (`common-layer/`)
**Purpose**: Provides core AWS SDK and utility dependencies used by all Lambda functions.

**Dependencies**:
- `boto3>=1.28.0` - AWS SDK for Python
- `botocore>=1.31.0` - Low-level AWS service client library
- `python-dateutil>=2.8.2` - Date/time utilities

**Used by**:
- SecurityConfigurationHandler
- SecurityProfileProcessor  
- AWSServiceDocumentationManager

### 2. Requests Layer (`requests-layer/`)
**Purpose**: Provides HTTP client libraries for making external API calls.

**Dependencies**:
- `requests>=2.31.0` - HTTP library for Python
- `urllib3>=1.26.16` - HTTP client library
- `certifi>=2023.7.22` - Certificate bundle
- `charset-normalizer>=3.2.0` - Character encoding detection
- `idna>=3.4` - Internationalized domain names

**Used by**:
- SecurityConfigurationHandler
- AWSServiceDocumentationManager

### 3. Web Scraping Layer (`web-scraping-layer/`)
**Purpose**: Provides web scraping and HTML parsing capabilities.

**Dependencies**:
- `beautifulsoup4>=4.12.2` - HTML/XML parser
- `lxml>=4.9.3` - XML/HTML processing library
- `html5lib>=1.1` - HTML5 parser
- `soupsieve>=2.4.1` - CSS selector library
- `webencodings>=0.5.1` - Character encoding utilities

**Used by**:
- AWSServiceDocumentationManager

## Building Layers

### Prerequisites
- Python 3.9 (matching Lambda runtime)
- pip package manager

### Build Individual Layers

```bash
# Build common layer
cd common-layer
./build.sh

# Build requests layer
cd requests-layer
./build.sh

# Build web scraping layer
cd web-scraping-layer
./build.sh
```

### Build All Layers
```bash
# From the layers directory
./build-all-layers.sh
```

## Layer Usage in CDK

The layers are automatically configured in the CDK stack through the `LambdaLayers` class:

```typescript
// Initialize layers
const layers = new LambdaLayers(this, 'SecuritySystemLayers');

// Use in Lambda function
const myFunction = new lambda.Function(this, 'MyFunction', {
  // ... other properties
  layers: [
    layers.commonLayer,
    layers.requestsLayer,
    // layers.webScrapingLayer, // if needed
  ],
});
```

## Lambda Function Mapping

| Function | Common Layer | Requests Layer | Web Scraping Layer |
|----------|--------------|----------------|-------------------|
| SecurityConfigurationHandler | ✅ | ✅ | ❌ |
| SecurityProfileProcessor | ✅ | ❌ | ❌ |
| AWSServiceDocumentationManager | ✅ | ✅ | ✅ |

## Benefits

1. **Reduced Package Size**: Lambda functions no longer need to include common dependencies
2. **Faster Deployments**: Layers are cached and reused across deployments
3. **Better Cold Starts**: Smaller function packages load faster
4. **Dependency Management**: Centralized dependency management and versioning
5. **Code Reuse**: Common dependencies shared across multiple functions

## Maintenance

### Updating Dependencies
1. Update the `requirements.txt` file in the appropriate layer directory
2. Rebuild the layer using the build script
3. Deploy the updated CDK stack

### Adding New Dependencies
1. Determine which layer the dependency belongs to (or create a new layer)
2. Add the dependency to the appropriate `requirements.txt`
3. Rebuild the layer
4. Update the Lambda function to use the layer if not already configured

### Layer Size Limits
- Maximum layer size: 250 MB (unzipped)
- Maximum total size (function + layers): 250 MB (unzipped)
- Monitor layer sizes and split if necessary

## Troubleshooting

### Import Errors
If you encounter import errors after implementing layers:
1. Verify the dependency is included in the correct layer
2. Check that the Lambda function is configured to use the layer
3. Ensure the layer was built successfully

### Layer Size Issues
If layers become too large:
1. Remove unnecessary files (tests, documentation, etc.)
2. Use `--no-deps` flag for specific packages if needed
3. Consider splitting large layers into smaller, more focused layers

### Build Issues
If build scripts fail:
1. Ensure Python 3.9 is available
2. Check pip is installed and up to date
3. Verify write permissions in the layer directories
