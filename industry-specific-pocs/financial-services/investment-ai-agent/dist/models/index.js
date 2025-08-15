"use strict";
// Export all models from this file
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserRequest = exports.validateAnalysisResult = exports.validateInvestment = exports.ValidationError = void 0;
// Re-export all models from their respective files
__exportStar(require("./investment"), exports);
__exportStar(require("./analysis"), exports);
__exportStar(require("./investment-idea"), exports);
__exportStar(require("./request"), exports);
__exportStar(require("./services"), exports);
__exportStar(require("./proprietary-data"), exports);
__exportStar(require("./market-data"), exports);
__exportStar(require("./bedrock"), exports);
__exportStar(require("./agent"), exports);
__exportStar(require("./feedback"), exports);
// Validation utilities
class ValidationError extends Error {
    constructor(message, field, code) {
        super(message);
        this.field = field;
        this.code = code;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
const validateInvestment = (investment) => {
    const errors = [];
    // Required fields
    if (!investment.id)
        errors.push(new ValidationError('Investment ID is required', 'id', 'REQUIRED'));
    if (!investment.name)
        errors.push(new ValidationError('Investment name is required', 'name', 'REQUIRED'));
    if (!investment.type)
        errors.push(new ValidationError('Investment type is required', 'type', 'REQUIRED'));
    if (!investment.description)
        errors.push(new ValidationError('Investment description is required', 'description', 'REQUIRED'));
    // Type validation
    if (investment.type && !['stock', 'bond', 'etf', 'mutual-fund', 'commodity', 'cryptocurrency', 'real-estate', 'other'].includes(investment.type)) {
        errors.push(new ValidationError('Invalid investment type', 'type', 'INVALID_TYPE'));
    }
    // Numeric validations
    if (investment.currentPrice !== undefined && (isNaN(investment.currentPrice) || investment.currentPrice < 0)) {
        errors.push(new ValidationError('Current price must be a positive number', 'currentPrice', 'INVALID_NUMBER'));
    }
    if (investment.marketCap !== undefined && (isNaN(investment.marketCap) || investment.marketCap < 0)) {
        errors.push(new ValidationError('Market cap must be a positive number', 'marketCap', 'INVALID_NUMBER'));
    }
    // Array validations
    if (!Array.isArray(investment.historicalPerformance)) {
        errors.push(new ValidationError('Historical performance must be an array', 'historicalPerformance', 'INVALID_ARRAY'));
    }
    if (!Array.isArray(investment.relatedInvestments)) {
        errors.push(new ValidationError('Related investments must be an array', 'relatedInvestments', 'INVALID_ARRAY'));
    }
    return {
        valid: errors.length === 0,
        errors
    };
};
exports.validateInvestment = validateInvestment;
const validateAnalysisResult = (analysis) => {
    const errors = [];
    // Required fields
    if (!analysis.id)
        errors.push(new ValidationError('Analysis ID is required', 'id', 'REQUIRED'));
    if (!analysis.investmentId)
        errors.push(new ValidationError('Investment ID is required', 'investmentId', 'REQUIRED'));
    if (!analysis.analysisType)
        errors.push(new ValidationError('Analysis type is required', 'analysisType', 'REQUIRED'));
    if (!analysis.timestamp)
        errors.push(new ValidationError('Timestamp is required', 'timestamp', 'REQUIRED'));
    if (!analysis.summary)
        errors.push(new ValidationError('Summary is required', 'summary', 'REQUIRED'));
    // Type validation
    if (analysis.analysisType && !['fundamental', 'technical', 'sentiment', 'risk', 'comprehensive'].includes(analysis.analysisType)) {
        errors.push(new ValidationError('Invalid analysis type', 'analysisType', 'INVALID_TYPE'));
    }
    // Numeric validations
    if (analysis.confidence !== undefined && (isNaN(analysis.confidence) || analysis.confidence < 0 || analysis.confidence > 1)) {
        errors.push(new ValidationError('Confidence must be a number between 0 and 1', 'confidence', 'INVALID_NUMBER'));
    }
    // Object validations
    if (!analysis.details || typeof analysis.details !== 'object') {
        errors.push(new ValidationError('Analysis details are required and must be an object', 'details', 'INVALID_OBJECT'));
    }
    // Array validations
    if (!Array.isArray(analysis.recommendations)) {
        errors.push(new ValidationError('Recommendations must be an array', 'recommendations', 'INVALID_ARRAY'));
    }
    if (!Array.isArray(analysis.dataPoints)) {
        errors.push(new ValidationError('Data points must be an array', 'dataPoints', 'INVALID_ARRAY'));
    }
    return {
        valid: errors.length === 0,
        errors
    };
};
exports.validateAnalysisResult = validateAnalysisResult;
const validateUserRequest = (request) => {
    const errors = [];
    // Required fields
    if (!request.id)
        errors.push(new ValidationError('Request ID is required', 'id', 'REQUIRED'));
    if (!request.userId)
        errors.push(new ValidationError('User ID is required', 'userId', 'REQUIRED'));
    if (!request.requestType)
        errors.push(new ValidationError('Request type is required', 'requestType', 'REQUIRED'));
    if (!request.timestamp)
        errors.push(new ValidationError('Timestamp is required', 'timestamp', 'REQUIRED'));
    if (!request.status)
        errors.push(new ValidationError('Status is required', 'status', 'REQUIRED'));
    // Type validation
    const validRequestTypes = [
        'investment-idea-generation',
        'investment-analysis',
        'market-research',
        'portfolio-optimization',
        'risk-assessment',
        'compliance-check'
    ];
    if (request.requestType && !validRequestTypes.includes(request.requestType)) {
        errors.push(new ValidationError('Invalid request type', 'requestType', 'INVALID_TYPE'));
    }
    const validStatusTypes = [
        'submitted',
        'queued',
        'processing',
        'completed',
        'failed',
        'cancelled'
    ];
    if (request.status && !validStatusTypes.includes(request.status)) {
        errors.push(new ValidationError('Invalid status', 'status', 'INVALID_TYPE'));
    }
    // Object validations
    if (!request.parameters || typeof request.parameters !== 'object') {
        errors.push(new ValidationError('Parameters are required and must be an object', 'parameters', 'INVALID_OBJECT'));
    }
    return {
        valid: errors.length === 0,
        errors
    };
};
exports.validateUserRequest = validateUserRequest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbW9kZWxzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxtQ0FBbUM7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0NuQyxtREFBbUQ7QUFDbkQsK0NBQTZCO0FBQzdCLDZDQUEyQjtBQUMzQixvREFBa0M7QUFDbEMsNENBQTBCO0FBQzFCLDZDQUEyQjtBQUMzQixxREFBbUM7QUFDbkMsZ0RBQThCO0FBQzlCLDRDQUEwQjtBQUMxQiwwQ0FBd0I7QUFDeEIsNkNBQTJCO0FBRTNCLHVCQUF1QjtBQUN2QixNQUFhLGVBQWdCLFNBQVEsS0FBSztJQUN4QyxZQUFZLE9BQWUsRUFBUyxLQUFjLEVBQVMsSUFBYTtRQUN0RSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFEbUIsVUFBSyxHQUFMLEtBQUssQ0FBUztRQUFTLFNBQUksR0FBSixJQUFJLENBQVM7UUFFdEUsSUFBSSxDQUFDLElBQUksR0FBRyxpQkFBaUIsQ0FBQztJQUNoQyxDQUFDO0NBQ0Y7QUFMRCwwQ0FLQztBQU9NLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxVQUFlLEVBQW9CLEVBQUU7SUFDdEUsTUFBTSxNQUFNLEdBQXNCLEVBQUUsQ0FBQztJQUVyQyxrQkFBa0I7SUFDbEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLGVBQWUsQ0FBQywyQkFBMkIsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUNwRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUk7UUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksZUFBZSxDQUFDLDZCQUE2QixFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQzFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSTtRQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxlQUFlLENBQUMsNkJBQTZCLEVB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LCJzb3VyY2VzQ29udGVudCI6WyIvLyBFeHBvcnQgYWxsIG1vZGVscyBmcm9tIHRoaXMgZmlsZVxuXG4vLyBVc2VyIG1vZGVsc1xuZXhwb3J0IGludGVyZmFjZSBVc2VyIHtcbiAgaWQ6IHN0cmluZztcbiAgb3JnYW5pemF0aW9uSWQ6IHN0cmluZztcbiAgcm9sZTogJ2FuYWx5c3QnIHwgJ3BvcnRmb2xpby1tYW5hZ2VyJyB8ICdjb21wbGlhbmNlLW9mZmljZXInIHwgJ2FkbWluaXN0cmF0b3InO1xuICBwZXJtaXNzaW9uczogc3RyaW5nW107XG4gIHByZWZlcmVuY2VzOiBVc2VyUHJlZmVyZW5jZXM7XG4gIGNyZWF0ZWRBdDogRGF0ZTtcbiAgdXBkYXRlZEF0OiBEYXRlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFVzZXJQcmVmZXJlbmNlcyB7XG4gIGludmVzdG1lbnRIb3Jpem9uOiAnc2hvcnQnIHwgJ21lZGl1bScgfCAnbG9uZyc7XG4gIHJpc2tUb2xlcmFuY2U6ICdjb25zZXJ2YXRpdmUnIHwgJ21vZGVyYXRlJyB8ICdhZ2dyZXNzaXZlJztcbiAgcHJlZmVycmVkU2VjdG9yczogc3RyaW5nW107XG4gIHByZWZlcnJlZEFzc2V0Q2xhc3Nlczogc3RyaW5nW107XG4gIGV4Y2x1ZGVkSW52ZXN0bWVudHM6IHN0cmluZ1tdO1xuICBub3RpZmljYXRpb25TZXR0aW5nczogTm90aWZpY2F0aW9uU2V0dGluZ3M7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTm90aWZpY2F0aW9uU2V0dGluZ3Mge1xuICBlbWFpbDogYm9vbGVhbjtcbiAgcHVzaDogYm9vbGVhbjtcbiAgZnJlcXVlbmN5OiAnaW1tZWRpYXRlJyB8ICdkYWlseScgfCAnd2Vla2x5JztcbiAgdHlwZXM6IHtcbiAgICBpZGVhR2VuZXJhdGlvbjogYm9vbGVhbjtcbiAgICBtYXJrZXRBbGVydHM6IGJvb2xlYW47XG4gICAgY29tcGxpYW5jZUlzc3VlczogYm9vbGVhbjtcbiAgICBzeXN0ZW1VcGRhdGVzOiBib29sZWFuO1xuICB9O1xufVxuXG4vLyBSZS1leHBvcnQgYWxsIG1vZGVscyBmcm9tIHRoZWlyIHJlc3BlY3RpdmUgZmlsZXNcbmV4cG9ydCAqIGZyb20gJy4vaW52ZXN0bWVudCc7XG5leHBvcnQgKiBmcm9tICcuL2FuYWx5c2lzJztcbmV4cG9ydCAqIGZyb20gJy4vaW52ZXN0bWVudC1pZGVhJztcbmV4cG9ydCAqIGZyb20gJy4vcmVxdWVzdCc7XG5leHBvcnQgKiBmcm9tICcuL3NlcnZpY2VzJztcbmV4cG9ydCAqIGZyb20gJy4vcHJvcHJpZXRhcnktZGF0YSc7XG5leHBvcnQgKiBmcm9tICcuL21hcmtldC1kYXRhJztcbmV4cG9ydCAqIGZyb20gJy4vYmVkcm9jayc7XG5leHBvcnQgKiBmcm9tICcuL2FnZW50JztcbmV4cG9ydCAqIGZyb20gJy4vZmVlZGJhY2snO1xuXG4vLyBWYWxpZGF0aW9uIHV0aWxpdGllc1xuZXhwb3J0IGNsYXNzIFZhbGlkYXRpb25FcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBwdWJsaWMgZmllbGQ/OiBzdHJpbmcsIHB1YmxpYyBjb2RlPzogc3RyaW5nKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5uYW1lID0gJ1ZhbGlkYXRpb25FcnJvcic7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBWYWxpZGF0aW9uUmVzdWx0IHtcbiAgdmFsaWQ6IGJvb2xlYW47XG4gIGVycm9yczogVmFsaWRhdGlvbkVycm9yW107XG59XG5cbmV4cG9ydCBjb25zdCB2YWxpZGF0ZUludmVzdG1lbnQgPSAoaW52ZXN0bWVudDogYW55KTogVmFsaWRhdGlvblJlc3VsdCA9PiB7XG4gIGNvbnN0IGVycm9yczogVmFsaWRhdGlvbkVycm9yW10gPSBbXTtcbiAgXG4gIC8vIFJlcXVpcmVkIGZpZWxkc1xuICBpZiAoIWludmVzdG1lbnQuaWQpIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0ludmVzdG1lbnQgSUQgaXMgcmVxdWlyZWQnLCAnaWQnLCAnUkVRVUlSRUQnKSk7XG4gIGlmICghaW52ZXN0bWVudC5uYW1lKSBlcnJvcnMucHVzaChuZXcgVmFsaWRhdGlvbkVycm9yKCdJbnZlc3RtZW50IG5hbWUgaXMgcmVxdWlyZWQnLCAnbmFtZScsICdSRVFVSVJFRCcpKTtcbiAgaWYgKCFpbnZlc3RtZW50LnR5cGUpIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0ludmVzdG1lbnQgdHlwZSBpcyByZXF1aXJlZCcsICd0eXBlJywgJ1JFUVVJUkVEJykpO1xuICBpZiAoIWludmVzdG1lbnQuZGVzY3JpcHRpb24pIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0ludmVzdG1lbnQgZGVzY3JpcHRpb24gaXMgcmVxdWlyZWQnLCAnZGVzY3JpcHRpb24nLCAnUkVRVUlSRUQnKSk7XG4gIFxuICAvLyBUeXBlIHZhbGlkYXRpb25cbiAgaWYgKGludmVzdG1lbnQudHlwZSAmJiAhWydzdG9jaycsICdib25kJywgJ2V0ZicsICdtdXR1YWwtZnVuZCcsICdjb21tb2RpdHknLCAnY3J5cHRvY3VycmVuY3knLCAncmVhbC1lc3RhdGUnLCAnb3RoZXInXS5pbmNsdWRlcyhpbnZlc3RtZW50LnR5cGUpKSB7XG4gICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcignSW52YWxpZCBpbnZlc3RtZW50IHR5cGUnLCAndHlwZScsICdJTlZBTElEX1RZUEUnKSk7XG4gIH1cbiAgXG4gIC8vIE51bWVyaWMgdmFsaWRhdGlvbnNcbiAgaWYgKGludmVzdG1lbnQuY3VycmVudFByaWNlICE9PSB1bmRlZmluZWQgJiYgKGlzTmFOKGludmVzdG1lbnQuY3VycmVudFByaWNlKSB8fCBpbnZlc3RtZW50LmN1cnJlbnRQcmljZSA8IDApKSB7XG4gICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcignQ3VycmVudCBwcmljZSBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJywgJ2N1cnJlbnRQcmljZScsICdJTlZBTElEX05VTUJFUicpKTtcbiAgfVxuICBcbiAgaWYgKGludmVzdG1lbnQubWFya2V0Q2FwICE9PSB1bmRlZmluZWQgJiYgKGlzTmFOKGludmVzdG1lbnQubWFya2V0Q2FwKSB8fCBpbnZlc3RtZW50Lm1hcmtldENhcCA8IDApKSB7XG4gICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcignTWFya2V0IGNhcCBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJywgJ21hcmtldENhcCcsICdJTlZBTElEX05VTUJFUicpKTtcbiAgfVxuICBcbiAgLy8gQXJyYXkgdmFsaWRhdGlvbnNcbiAgaWYgKCFBcnJheS5pc0FycmF5KGludmVzdG1lbnQuaGlzdG9yaWNhbFBlcmZvcm1hbmNlKSkge1xuICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0hpc3RvcmljYWwgcGVyZm9ybWFuY2UgbXVzdCBiZSBhbiBhcnJheScsICdoaXN0b3JpY2FsUGVyZm9ybWFuY2UnLCAnSU5WQUxJRF9BUlJBWScpKTtcbiAgfVxuICBcbiAgaWYgKCFBcnJheS5pc0FycmF5KGludmVzdG1lbnQucmVsYXRlZEludmVzdG1lbnRzKSkge1xuICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1JlbGF0ZWQgaW52ZXN0bWVudHMgbXVzdCBiZSBhbiBhcnJheScsICdyZWxhdGVkSW52ZXN0bWVudHMnLCAnSU5WQUxJRF9BUlJBWScpKTtcbiAgfVxuICBcbiAgcmV0dXJuIHtcbiAgICB2YWxpZDogZXJyb3JzLmxlbmd0aCA9PT0gMCxcbiAgICBlcnJvcnNcbiAgfTtcbn07XG5cbmV4cG9ydCBjb25zdCB2YWxpZGF0ZUFuYWx5c2lzUmVzdWx0ID0gKGFuYWx5c2lzOiBhbnkpOiBWYWxpZGF0aW9uUmVzdWx0ID0+IHtcbiAgY29uc3QgZXJyb3JzOiBWYWxpZGF0aW9uRXJyb3JbXSA9IFtdO1xuICBcbiAgLy8gUmVxdWlyZWQgZmllbGRzXG4gIGlmICghYW5hbHlzaXMuaWQpIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0FuYWx5c2lzIElEIGlzIHJlcXVpcmVkJywgJ2lkJywgJ1JFUVVJUkVEJykpO1xuICBpZiAoIWFuYWx5c2lzLmludmVzdG1lbnRJZCkgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcignSW52ZXN0bWVudCBJRCBpcyByZXF1aXJlZCcsICdpbnZlc3RtZW50SWQnLCAnUkVRVUlSRUQnKSk7XG4gIGlmICghYW5hbHlzaXMuYW5hbHlzaXNUeXBlKSBlcnJvcnMucHVzaChuZXcgVmFsaWRhdGlvbkVycm9yKCdBbmFseXNpcyB0eXBlIGlzIHJlcXVpcmVkJywgJ2FuYWx5c2lzVHlwZScsICdSRVFVSVJFRCcpKTtcbiAgaWYgKCFhbmFseXNpcy50aW1lc3RhbXApIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1RpbWVzdGFtcCBpcyByZXF1aXJlZCcsICd0aW1lc3RhbXAnLCAnUkVRVUlSRUQnKSk7XG4gIGlmICghYW5hbHlzaXMuc3VtbWFyeSkgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcignU3VtbWFyeSBpcyByZXF1aXJlZCcsICdzdW1tYXJ5JywgJ1JFUVVJUkVEJykpO1xuICBcbiAgLy8gVHlwZSB2YWxpZGF0aW9uXG4gIGlmIChhbmFseXNpcy5hbmFseXNpc1R5cGUgJiYgIVsnZnVuZGFtZW50YWwnLCAndGVjaG5pY2FsJywgJ3NlbnRpbWVudCcsICdyaXNrJywgJ2NvbXByZWhlbnNpdmUnXS5pbmNsdWRlcyhhbmFseXNpcy5hbmFseXNpc1R5cGUpKSB7XG4gICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcignSW52YWxpZCBhbmFseXNpcyB0eXBlJywgJ2FuYWx5c2lzVHlwZScsICdJTlZBTElEX1RZUEUnKSk7XG4gIH1cbiAgXG4gIC8vIE51bWVyaWMgdmFsaWRhdGlvbnNcbiAgaWYgKGFuYWx5c2lzLmNvbmZpZGVuY2UgIT09IHVuZGVmaW5lZCAmJiAoaXNOYU4oYW5hbHlzaXMuY29uZmlkZW5jZSkgfHwgYW5hbHlzaXMuY29uZmlkZW5jZSA8IDAgfHwgYW5hbHlzaXMuY29uZmlkZW5jZSA+IDEpKSB7XG4gICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcignQ29uZmlkZW5jZSBtdXN0IGJlIGEgbnVtYmVyIGJldHdlZW4gMCBhbmQgMScsICdjb25maWRlbmNlJywgJ0lOVkFMSURfTlVNQkVSJykpO1xuICB9XG4gIFxuICAvLyBPYmplY3QgdmFsaWRhdGlvbnNcbiAgaWYgKCFhbmFseXNpcy5kZXRhaWxzIHx8IHR5cGVvZiBhbmFseXNpcy5kZXRhaWxzICE9PSAnb2JqZWN0Jykge1xuICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0FuYWx5c2lzIGRldGFpbHMgYXJlIHJlcXVpcmVkIGFuZCBtdXN0IGJlIGFuIG9iamVjdCcsICdkZXRhaWxzJywgJ0lOVkFMSURfT0JKRUNUJykpO1xuICB9XG4gIFxuICAvLyBBcnJheSB2YWxpZGF0aW9uc1xuICBpZiAoIUFycmF5LmlzQXJyYXkoYW5hbHlzaXMucmVjb21tZW5kYXRpb25zKSkge1xuICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1JlY29tbWVuZGF0aW9ucyBtdXN0IGJlIGFuIGFycmF5JywgJ3JlY29tbWVuZGF0aW9ucycsICdJTlZBTElEX0FSUkFZJykpO1xuICB9XG4gIFxuICBpZiAoIUFycmF5LmlzQXJyYXkoYW5hbHlzaXMuZGF0YVBvaW50cykpIHtcbiAgICBlcnJvcnMucHVzaChuZXcgVmFsaWRhdGlvbkVycm9yKCdEYXRhIHBvaW50cyBtdXN0IGJlIGFuIGFycmF5JywgJ2RhdGFQb2ludHMnLCAnSU5WQUxJRF9BUlJBWScpKTtcbiAgfVxuICBcbiAgcmV0dXJuIHtcbiAgICB2YWxpZDogZXJyb3JzLmxlbmd0aCA9PT0gMCxcbiAgICBlcnJvcnNcbiAgfTtcbn07XG5cbmV4cG9ydCBjb25zdCB2YWxpZGF0ZVVzZXJSZXF1ZXN0ID0gKHJlcXVlc3Q6IGFueSk6IFZhbGlkYXRpb25SZXN1bHQgPT4ge1xuICBjb25zdCBlcnJvcnM6IFZhbGlkYXRpb25FcnJvcltdID0gW107XG4gIFxuICAvLyBSZXF1aXJlZCBmaWVsZHNcbiAgaWYgKCFyZXF1ZXN0LmlkKSBlcnJvcnMucHVzaChuZXcgVmFsaWRhdGlvbkVycm9yKCdSZXF1ZXN0IElEIGlzIHJlcXVpcmVkJywgJ2lkJywgJ1JFUVVJUkVEJykpO1xuICBpZiAoIXJlcXVlc3QudXNlcklkKSBlcnJvcnMucHVzaChuZXcgVmFsaWRhdGlvbkVycm9yKCdVc2VyIElEIGlzIHJlcXVpcmVkJywgJ3VzZXJJZCcsICdSRVFVSVJFRCcpKTtcbiAgaWYgKCFyZXF1ZXN0LnJlcXVlc3RUeXBlKSBlcnJvcnMucHVzaChuZXcgVmFsaWRhdGlvbkVycm9yKCdSZXF1ZXN0IHR5cGUgaXMgcmVxdWlyZWQnLCAncmVxdWVzdFR5cGUnLCAnUkVRVUlSRUQnKSk7XG4gIGlmICghcmVxdWVzdC50aW1lc3RhbXApIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1RpbWVzdGFtcCBpcyByZXF1aXJlZCcsICd0aW1lc3RhbXAnLCAnUkVRVUlSRUQnKSk7XG4gIGlmICghcmVxdWVzdC5zdGF0dXMpIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1N0YXR1cyBpcyByZXF1aXJlZCcsICdzdGF0dXMnLCAnUkVRVUlSRUQnKSk7XG4gIFxuICAvLyBUeXBlIHZhbGlkYXRpb25cbiAgY29uc3QgdmFsaWRSZXF1ZXN0VHlwZXMgPSBbXG4gICAgJ2ludmVzdG1lbnQtaWRlYS1nZW5lcmF0aW9uJyxcbiAgICAnaW52ZXN0bWVudC1hbmFseXNpcycsXG4gICAgJ21hcmtldC1yZXNlYXJjaCcsXG4gICAgJ3BvcnRmb2xpby1vcHRpbWl6YXRpb24nLFxuICAgICdyaXNrLWFzc2Vzc21lbnQnLFxuICAgICdjb21wbGlhbmNlLWNoZWNrJ1xuICBdO1xuICBcbiAgaWYgKHJlcXVlc3QucmVxdWVzdFR5cGUgJiYgIXZhbGlkUmVxdWVzdFR5cGVzLmluY2x1ZGVzKHJlcXVlc3QucmVxdWVzdFR5cGUpKSB7XG4gICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcignSW52YWxpZCByZXF1ZXN0IHR5cGUnLCAncmVxdWVzdFR5cGUnLCAnSU5WQUxJRF9UWVBFJykpO1xuICB9XG4gIFxuICBjb25zdCB2YWxpZFN0YXR1c1R5cGVzID0gW1xuICAgICdzdWJtaXR0ZWQnLFxuICAgICdxdWV1ZWQnLFxuICAgICdwcm9jZXNzaW5nJyxcbiAgICAnY29tcGxldGVkJyxcbiAgICAnZmFpbGVkJyxcbiAgICAnY2FuY2VsbGVkJ1xuICBdO1xuICBcbiAgaWYgKHJlcXVlc3Quc3RhdHVzICYmICF2YWxpZFN0YXR1c1R5cGVzLmluY2x1ZGVzKHJlcXVlc3Quc3RhdHVzKSkge1xuICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0ludmFsaWQgc3RhdHVzJywgJ3N0YXR1cycsICdJTlZBTElEX1RZUEUnKSk7XG4gIH1cbiAgXG4gIC8vIE9iamVjdCB2YWxpZGF0aW9uc1xuICBpZiAoIXJlcXVlc3QucGFyYW1ldGVycyB8fCB0eXBlb2YgcmVxdWVzdC5wYXJhbWV0ZXJzICE9PSAnb2JqZWN0Jykge1xuICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1BhcmFtZXRlcnMgYXJlIHJlcXVpcmVkIGFuZCBtdXN0IGJlIGFuIG9iamVjdCcsICdwYXJhbWV0ZXJzJywgJ0lOVkFMSURfT0JKRUNUJykpO1xuICB9XG4gIFxuICByZXR1cm4ge1xuICAgIHZhbGlkOiBlcnJvcnMubGVuZ3RoID09PSAwLFxuICAgIGVycm9yc1xuICB9O1xufTsiXX0=