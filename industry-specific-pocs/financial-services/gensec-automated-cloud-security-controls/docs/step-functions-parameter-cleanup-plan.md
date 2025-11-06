# Step Functions Parameter Cleanup Plan

**Date**: September 23, 2025  
**Status**: Ready for Implementation

## Current Issues Identified

1. **Excessive Parameter Duplication**: The same `serviceDocumentation` object is passed to every Lambda function with identical structure
2. **Unused Parameters**: Many functions don't use all the parameters being passed
3. **Redundant Data**: Service documentation details are repeated across all tasks
4. **Complex Nested Structures**: Deep nesting makes the workflow hard to read and maintain

## Parameter Usage Analysis

| Function | Actually Uses | Currently Receives | Waste |
|----------|---------------|-------------------|-------|
| **AnalyzeSecurityRequirements** | `securityProfile`, `serviceRequest`, `serviceDocumentation.body.service_id` | Full `serviceDocumentation` object + unused fields | ~80% |
| **GenerateSecurityControls** | `requestId`, `serviceId`, `analysisResult` | Full `serviceDocumentation` object | ~90% |
| **GenerateIaCTemplate** | `requestId`, `serviceId`, `analysisResult`, `controlsResult` | Full `serviceDocumentation` object | ~90% |
| **GenerateServiceProfile** | `requestId`, `serviceId` | Full `serviceDocumentation` object | ~95% |
| **GenerateIAMModel** | `requestId`, `serviceId` | Full `serviceDocumentation` object | ~95% |

## Cleanup Plan

### Phase 1: Simplify Core Parameters
```typescript
// Instead of passing full serviceDocumentation to every function
// Pass only essential identifiers and let functions query DynamoDB directly

const analyzeRequirements = new stepfunctionsTasks.LambdaInvoke(this, 'AnalyzeRequirementsTask', {
  lambdaFunction: analyzeSecurityRequirementsLambda,
  resultPath: '$.analysisResult',
  payload: stepfunctions.TaskInput.fromObject({
    'securityProfile.$': '$.securityProfile',
    'serviceRequest.$': '$.serviceRequest',
    // Remove serviceDocumentation - function will query DynamoDB directly
  }),
});
```

### Phase 2: Chain Results Efficiently
```typescript
const generateSecurityControls = new stepfunctionsTasks.LambdaInvoke(this, 'GenerateSecurityControlsTask', {
  lambdaFunction: generateSecurityControlsLambda,
  resultPath: '$.controlsResult',
  payload: stepfunctions.TaskInput.fromObject({
    'requestId.$': '$.serviceRequest.requestId',
    'serviceId.$': '$.serviceRequest.serviceId',
    'analysisResult.$': '$.analysisResult.Payload', // Direct reference to previous result
  }),
});
```

### Phase 3: Eliminate Redundant Service Documentation Passing
```typescript
const generateIaCTemplate = new stepfunctionsTasks.LambdaInvoke(this, 'GenerateIaCTemplateTask', {
  lambdaFunction: generateIaCTemplateLambda,
  resultPath: '$.templateResult',
  payload: stepfunctions.TaskInput.fromObject({
    'requestId.$': '$.serviceRequest.requestId',
    'serviceId.$': '$.serviceRequest.serviceId',
    'controlsResult.$': '$.controlsResult.Payload',
  }),
});
```

### Phase 4: Simplify Final Functions
```typescript
const generateServiceProfile = new stepfunctionsTasks.LambdaInvoke(this, 'GenerateServiceProfileTask', {
  lambdaFunction: generateServiceProfileLambda,
  resultPath: '$.profileResult',
  payload: stepfunctions.TaskInput.fromObject({
    'requestId.$': '$.serviceRequest.requestId',
    'serviceId.$': '$.serviceRequest.serviceId',
  }),
});

const generateIAMModel = new stepfunctionsTasks.LambdaInvoke(this, 'GenerateIAMModelTask', {
  lambdaFunction: generateIAMModelLambda,
  resultPath: '$.iamModelResult',
  payload: stepfunctions.TaskInput.fromObject({
    'requestId.$': '$.serviceRequest.requestId',
    'serviceId.$': '$.serviceRequest.serviceId',
  }),
});
```

## Benefits of This Cleanup

1. **Reduced Payload Size**: ~80-90% reduction in parameter passing
2. **Improved Performance**: Smaller payloads mean faster Step Functions execution
3. **Better Maintainability**: Simpler parameter structure is easier to debug
4. **Cost Optimization**: Reduced Step Functions state transition costs
5. **Cleaner Architecture**: Functions become more self-contained

## Implementation Steps

1. **Update Lambda Functions**: Modify functions to query DynamoDB directly instead of relying on passed service documentation
2. **Update Step Functions Definition**: Implement the simplified parameter passing
3. **Test Workflow**: Ensure all functions still receive required data
4. **Monitor Performance**: Verify improved execution times and reduced costs

## Files to Modify

- `cdk/lib/security-system-stack.ts` - Step Functions task definitions (lines 890-988)
- Lambda functions may need minor updates to handle simplified input structure

## Expected Impact

- **Parameter reduction**: From ~50 parameters per task to ~3-5 parameters
- **Payload size**: Reduce from ~2KB to ~200 bytes per task
- **Execution time**: Estimated 10-15% improvement
- **Cost savings**: Reduced Step Functions state transition costs
