"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationMiddleware = exports.validateRequest = exports.validateDeepResearchRequest = exports.validateWebSearchRequest = exports.requestValidationMiddleware = void 0;
const validation_1 = require("../../utils/validation");
const models_1 = require("../../models");
/**
 * Middleware for validating request bodies against schemas
 */
const requestValidationMiddleware = (req, res, next) => {
    // Skip validation for GET and DELETE requests
    if (['GET', 'DELETE'].includes(req.method)) {
        return next();
    }
    // Get the appropriate schema based on the endpoint
    const schema = getSchemaForEndpoint(req.path, req.method);
    if (!schema) {
        // No schema defined for this endpoint, skip validation
        return next();
    }
    try {
        // Validate the request body against the schema
        const validationResult = (0, validation_1.validateData)(req.body, schema);
        if (!validationResult.valid) {
            return res.status(400).json({
                code: 'VALIDATION_ERROR',
                message: 'Request validation failed',
                details: validationResult.errors.map(error => ({
                    field: error.field,
                    message: error.message,
                    code: error.code
                })),
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || 'unknown',
                severity: 'warning'
            });
        }
        next();
    }
    catch (error) {
        console.error('Validation error:', error);
        return res.status(500).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Validation service error',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
            severity: 'error'
        });
    }
};
exports.requestValidationMiddleware = requestValidationMiddleware;
/**
 * Validate web search request
 */
const validateWebSearchRequest = (req, res, next) => {
    const { query, depth, sources, timeframe, maxResults } = req.body;
    const errors = [];
    // Validate required fields
    if (!query) {
        errors.push(new models_1.ValidationError('Query is required', 'query', 'REQUIRED'));
    }
    // Validate depth
    if (depth && !['basic', 'comprehensive'].includes(depth)) {
        errors.push(new models_1.ValidationError('Depth must be either "basic" or "comprehensive"', 'depth', 'INVALID_VALUE'));
    }
    // Validate sources
    if (sources && !Array.isArray(sources)) {
        errors.push(new models_1.ValidationError('Sources must be an array', 'sources', 'INVALID_TYPE'));
    }
    // Validate timeframe
    const validTimeframes = ['recent', 'past-week', 'past-month', 'past-year', 'all-time'];
    if (timeframe && !validTimeframes.includes(timeframe)) {
        errors.push(new models_1.ValidationError(`Timeframe must be one of: ${validTimeframes.join(', ')}`, 'timeframe', 'INVALID_VALUE'));
    }
    // Validate maxResults
    if (maxResults && (typeof maxResults !== 'number' || maxResults < 1 || maxResults > 100)) {
        errors.push(new models_1.ValidationError('Max results must be a number between 1 and 100', 'maxResults', 'INVALID_VALUE'));
    }
    if (errors.length > 0) {
        res.status(400).json({
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: errors.map(error => ({
                field: error.field,
                message: error.message,
                code: error.code
            })),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
            severity: 'warning'
        });
        return;
    }
    next();
};
exports.validateWebSearchRequest = validateWebSearchRequest;
/**
 * Validate deep research request
 */
const validateDeepResearchRequest = (req, res, next) => {
    const { topic, depth, focusAreas, includeSources, excludeSources, timeConstraint } = req.body;
    const errors = [];
    // Validate required fields
    if (!topic) {
        errors.push(new models_1.ValidationError('Topic is required', 'topic', 'REQUIRED'));
    }
    // Validate depth
    const validDepths = ['standard', 'deep', 'comprehensive'];
    if (depth && !validDepths.includes(depth)) {
        errors.push(new models_1.ValidationError(`Depth must be one of: ${validDepths.join(', ')}`, 'depth', 'INVALID_VALUE'));
    }
    // Validate arrays
    if (focusAreas && !Array.isArray(focusAreas)) {
        errors.push(new models_1.ValidationError('Focus areas must be an array', 'focusAreas', 'INVALID_TYPE'));
    }
    if (includeSources && !Array.isArray(includeSources)) {
        errors.push(new models_1.ValidationError('Include sources must be an array', 'includeSources', 'INVALID_TYPE'));
    }
    if (excludeSources && !Array.isArray(excludeSources)) {
        errors.push(new models_1.ValidationError('Exclude sources must be an array', 'excludeSources', 'INVALID_TYPE'));
    }
    // Validate timeConstraint
    if (timeConstraint && (typeof timeConstraint !== 'number' || timeConstraint < 1)) {
        errors.push(new models_1.ValidationError('Time constraint must be a positive number', 'timeConstraint', 'INVALID_VALUE'));
    }
    if (errors.length > 0) {
        res.status(400).json({
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: errors.map(error => ({
                field: error.field,
                message: error.message,
                code: error.code
            })),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
            severity: 'warning'
        });
        return;
    }
    next();
};
exports.validateDeepResearchRequest = validateDeepResearchRequest;
/**
 * Simple validation middleware for basic request validation
 */
const validateRequest = (req, res, next) => {
    // Basic validation - just ensure request body exists for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.body) {
        res.status(400).json({
            success: false,
            error: 'Validation error',
            message: 'Request body is required'
        });
        return;
    }
    next();
};
exports.validateRequest = validateRequest;
/**
 * Advanced validation middleware factory
 * Creates a validation middleware based on a schema definition
 */
const validationMiddleware = (schema) => {
    return (req, res, next) => {
        const errors = [];
        // Validate body
        if (schema.body) {
            const bodyErrors = validateObject(req.body || {}, schema.body, 'body');
            errors.push(...bodyErrors);
        }
        // Validate params
        if (schema.params) {
            const paramErrors = validateObject(req.params || {}, schema.params, 'params');
            errors.push(...paramErrors);
        }
        // Validate query
        if (schema.query) {
            const queryErrors = validateObject(req.query || {}, schema.query, 'query');
            errors.push(...queryErrors);
        }
        if (errors.length > 0) {
            res.status(400).json({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: { errors },
                timestamp: new Date().toISOString()
            });
            return;
        }
        next();
    };
};
exports.validationMiddleware = validationMiddleware;
/**
 * Validate an object against a schema
 */
function validateObject(obj, schema, context) {
    const errors = [];
    for (const [key, rules] of Object.entries(schema)) {
        const value = obj[key];
        // Check required fields
        if (rules.required && (value === undefined || value === null || value === '')) {
            errors.push(`${context}.${key} is required`);
            continue;
        }
        // Skip validation if field is not required and not present
        if (!rules.required && (value === undefined || value === null)) {
            continue;
        }
        // Type validation
        if (rules.type) {
            if (!validateType(value, rules.type)) {
                errors.push(`${context}.${key} must be of type ${rules.type}`);
                continue;
            }
        }
        // Enum validation
        if (rules.enum && !rules.enum.includes(value)) {
            errors.push(`${context}.${key} must be one of: ${rules.enum.join(', ')}`);
        }
        // Number validations
        if (rules.type === 'number') {
            if (rules.min !== undefined && value < rules.min) {
                errors.push(`${context}.${key} must be at least ${rules.min}`);
            }
            if (rules.max !== undefined && value > rules.max) {
                errors.push(`${context}.${key} must be at most ${rules.max}`);
            }
        }
        // String validations
        if (rules.type === 'string') {
            if (rules.minLength !== undefined && value.length < rules.minLength) {
                errors.push(`${context}.${key} must be at least ${rules.minLength} characters long`);
            }
            if (rules.maxLength !== undefined && value.length > rules.maxLength) {
                errors.push(`${context}.${key} must be at most ${rules.maxLength} characters long`);
            }
            if (rules.format === 'uuid' && !isValidUUID(value)) {
                errors.push(`${context}.${key} must be a valid UUID`);
            }
            if (rules.format === 'url' && !isValidURL(value)) {
                errors.push(`${context}.${key} must be a valid URL`);
            }
            if (rules.format === 'date-time' && !isValidDateTime(value)) {
                errors.push(`${context}.${key} must be a valid date-time`);
            }
        }
        // Array validations
        if (rules.type === 'array') {
            if (rules.maxItems !== undefined && value.length > rules.maxItems) {
                errors.push(`${context}.${key} must have at most ${rules.maxItems} items`);
            }
            if (rules.minItems !== undefined && value.length < rules.minItems) {
                errors.push(`${context}.${key} must have at least ${rules.minItems} items`);
            }
            if (rules.items && rules.items.type) {
                for (let i = 0; i < value.length; i++) {
                    if (!validateType(value[i], rules.items.type)) {
                        errors.push(`${context}.${key}[${i}] must be of type ${rules.items.type}`);
                    }
                    if (rules.items.enum && !rules.items.enum.includes(value[i])) {
                        errors.push(`${context}.${key}[${i}] must be one of: ${rules.items.enum.join(', ')}`);
                    }
                }
            }
        }
        // Object validations
        if (rules.type === 'object' && rules.properties) {
            const nestedErrors = validateObject(value, rules.properties, `${context}.${key}`);
            errors.push(...nestedErrors);
        }
    }
    return errors;
}
/**
 * Validate the type of a value
 */
function validateType(value, expectedType) {
    switch (expectedType) {
        case 'string':
            return typeof value === 'string';
        case 'number':
            return typeof value === 'number' && !isNaN(value);
        case 'boolean':
            return typeof value === 'boolean';
        case 'array':
            return Array.isArray(value);
        case 'object':
            return typeof value === 'object' && value !== null && !Array.isArray(value);
        default:
            return true;
    }
}
/**
 * Validate UUID format
 */
function isValidUUID(value) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
}
/**
 * Validate URL format
 */
function isValidURL(value) {
    try {
        new URL(value);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Validate date-time format
 */
function isValidDateTime(value) {
    const date = new Date(value);
    return !isNaN(date.getTime());
}
/**
 * Get the appropriate schema for an endpoint
 * @param path The request path
 * @param method The HTTP method
 * @returns The schema for the endpoint, or undefined if no schema is defined
 */
function getSchemaForEndpoint(path, method) {
    // Define schemas for different endpoints
    const schemas = {
        '/api/auth/register': {
            POST: {
                email: { type: 'string', required: true },
                password: { type: 'string', required: true },
                firstName: { type: 'string', required: true },
                lastName: { type: 'string', required: true },
                organizationId: { type: 'string', required: true },
                role: { type: 'string', required: true, enum: ['analyst', 'portfolio-manager', 'compliance-officer', 'administrator'] },
                title: { type: 'string', required: false },
                department: { type: 'string', required: false },
                phoneNumber: { type: 'string', required: false },
                timezone: { type: 'string', required: false },
                language: { type: 'string', required: false }
            }
        },
        '/api/auth/login': {
            POST: {
                email: { type: 'string', required: true },
                password: { type: 'string', required: true }
            }
        },
        '/api/auth/refresh': {
            POST: {
                refreshToken: { type: 'string', required: true }
            }
        },
        '/api/auth/change-password': {
            POST: {
                currentPassword: { type: 'string', required: true },
                newPassword: { type: 'string', required: true }
            }
        },
        '/api/auth/forgot-password': {
            POST: {
                email: { type: 'string', required: true }
            }
        },
        '/api/auth/reset-password': {
            POST: {
                token: { type: 'string', required: true },
                newPassword: { type: 'string', required: true }
            }
        },
        '/api/v1/ideas': {
            POST: {
                investmentHorizon: { type: 'string', required: true, enum: ['short', 'medium', 'long'] },
                riskTolerance: { type: 'string', required: true, enum: ['conservative', 'moderate', 'aggressive'] },
                sectors: { type: 'array', required: false, itemType: 'string' },
                assetClasses: { type: 'array', required: false, itemType: 'string' },
                excludedInvestments: { type: 'array', required: false, itemType: 'string' },
                minimumConfidence: { type: 'number', required: false, min: 0, max: 1 },
                maximumIdeas: { type: 'number', required: false, min: 1 }
            }
        },
        '/api/v1/investments': {
            POST: {
                id: { type: 'string', required: true },
                name: { type: 'string', required: true },
                type: { type: 'string', required: true, enum: ['stock', 'bond', 'etf', 'mutual-fund', 'commodity', 'cryptocurrency', 'real-estate', 'other'] },
                description: { type: 'string', required: true },
                sector: { type: 'string', required: false },
                industry: { type: 'string', required: false },
                marketCap: { type: 'number', required: false, min: 0 },
                currentPrice: { type: 'number', required: false, min: 0 },
                historicalPerformance: { type: 'array', required: true },
                riskMetrics: { type: 'object', required: true },
                relatedInvestments: { type: 'array', required: true }
            }
        },
        '/api/v1/analysis': {
            POST: {
                investmentId: { type: 'string', required: true },
                analysisType: { type: 'string', required: true, enum: ['fundamental', 'technical', 'sentiment', 'risk', 'comprehensive'] },
                parameters: { type: 'object', required: true }
            }
        },
        '/api/web-search/search': {
            POST: {
                query: { type: 'string', required: true },
                depth: { type: 'string', required: false, enum: ['basic', 'comprehensive'] },
                sources: { type: 'array', required: false, itemType: 'string' },
                timeframe: { type: 'string', required: false, enum: ['recent', 'past-week', 'past-month', 'past-year', 'all-time'] },
                maxResults: { type: 'number', required: false, min: 1, max: 100 }
            }
        },
        '/api/web-search/research': {
            POST: {
                topic: { type: 'string', required: true },
                depth: { type: 'string', required: false, enum: ['standard', 'deep', 'comprehensive'] },
                focusAreas: { type: 'array', required: false, itemType: 'string' },
                includeSources: { type: 'array', required: false, itemType: 'string' },
                excludeSources: { type: 'array', required: false, itemType: 'string' },
                timeConstraint: { type: 'number', required: false, min: 1 }
            }
        },
        '/api/web-search/verify-source': {
            POST: {
                source: { type: 'object', required: true }
            }
        },
        '/api/web-search/track-citations': {
            POST: {
                researchResult: { type: 'object', required: true }
            }
        }
    };
    // Find the matching schema
    for (const [routePath, methodSchemas] of Object.entries(schemas)) {
        if (path.startsWith(routePath)) {
            return methodSchemas[method];
        }
    }
    return undefined;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hcGkvbWlkZGxld2FyZS92YWxpZGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHVEQUFzRDtBQUN0RCx5Q0FBK0M7QUFFL0M7O0dBRUc7QUFDSSxNQUFNLDJCQUEyQixHQUFHLENBQUMsR0FBWSxFQUFFLEdBQWEsRUFBRSxJQUFrQixFQUFFLEVBQUU7SUFDN0YsOENBQThDO0lBQzlDLElBQUksQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRTtRQUMxQyxPQUFPLElBQUksRUFBRSxDQUFDO0tBQ2Y7SUFFRCxtREFBbUQ7SUFDbkQsTUFBTSxNQUFNLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFMUQsSUFBSSxDQUFDLE1BQU0sRUFBRTtRQUNYLHVEQUF1RDtRQUN2RCxPQUFPLElBQUksRUFBRSxDQUFDO0tBQ2Y7SUFFRCxJQUFJO1FBQ0YsK0NBQStDO1FBQy9DLE1BQU0sZ0JBQWdCLEdBQUcsSUFBQSx5QkFBWSxFQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFeEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRTtZQUMzQixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixJQUFJLEVBQUUsa0JBQWtCO2dCQUN4QixPQUFPLEVBQUUsMkJBQTJCO2dCQUNwQyxPQUFPLEVBQUUsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQzdDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSztvQkFDbEIsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO29CQUN0QixJQUFJ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LGNBQWMsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRTthQUNuRDtTQUNGO0tBQ0YsQ0FBQztJQUVGLDJCQUEyQjtJQUMzQixLQUFLLE1BQU0sQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUNoRSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDOUIsT0FBTyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDOUI7S0FDRjtJQUVELE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBSZXF1ZXN0LCBSZXNwb25zZSwgTmV4dEZ1bmN0aW9uIH0gZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgeyB2YWxpZGF0ZURhdGEgfSBmcm9tICcuLi8uLi91dGlscy92YWxpZGF0aW9uJztcbmltcG9ydCB7IFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uLy4uL21vZGVscyc7XG5cbi8qKlxuICogTWlkZGxld2FyZSBmb3IgdmFsaWRhdGluZyByZXF1ZXN0IGJvZGllcyBhZ2FpbnN0IHNjaGVtYXNcbiAqL1xuZXhwb3J0IGNvbnN0IHJlcXVlc3RWYWxpZGF0aW9uTWlkZGxld2FyZSA9IChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbikgPT4ge1xuICAvLyBTa2lwIHZhbGlkYXRpb24gZm9yIEdFVCBhbmQgREVMRVRFIHJlcXVlc3RzXG4gIGlmIChbJ0dFVCcsICdERUxFVEUnXS5pbmNsdWRlcyhyZXEubWV0aG9kKSkge1xuICAgIHJldHVybiBuZXh0KCk7XG4gIH1cblxuICAvLyBHZXQgdGhlIGFwcHJvcHJpYXRlIHNjaGVtYSBiYXNlZCBvbiB0aGUgZW5kcG9pbnRcbiAgY29uc3Qgc2NoZW1hID0gZ2V0U2NoZW1hRm9yRW5kcG9pbnQocmVxLnBhdGgsIHJlcS5tZXRob2QpO1xuICBcbiAgaWYgKCFzY2hlbWEpIHtcbiAgICAvLyBObyBzY2hlbWEgZGVmaW5lZCBmb3IgdGhpcyBlbmRwb2ludCwgc2tpcCB2YWxpZGF0aW9uXG4gICAgcmV0dXJuIG5leHQoKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgLy8gVmFsaWRhdGUgdGhlIHJlcXVlc3QgYm9keSBhZ2FpbnN0IHRoZSBzY2hlbWFcbiAgICBjb25zdCB2YWxpZGF0aW9uUmVzdWx0ID0gdmFsaWRhdGVEYXRhKHJlcS5ib2R5LCBzY2hlbWEpO1xuICAgIFxuICAgIGlmICghdmFsaWRhdGlvblJlc3VsdC52YWxpZCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgICAgY29kZTogJ1ZBTElEQVRJT05fRVJST1InLFxuICAgICAgICBtZXNzYWdlOiAnUmVxdWVzdCB2YWxpZGF0aW9uIGZhaWxlZCcsXG4gICAgICAgIGRldGFpbHM6IHZhbGlkYXRpb25SZXN1bHQuZXJyb3JzLm1hcChlcnJvciA9PiAoe1xuICAgICAgICAgIGZpZWxkOiBlcnJvci5maWVsZCxcbiAgICAgICAgICBtZXNzYWdlOiBlcnJvci5tZXNzYWdlLFxuICAgICAgICAgIGNvZGU6IGVycm9yLmNvZGVcbiAgICAgICAgfSkpLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgcmVxdWVzdElkOiByZXEuaGVhZGVyc1sneC1yZXF1ZXN0LWlkJ10gfHwgJ3Vua25vd24nLFxuICAgICAgICBzZXZlcml0eTogJ3dhcm5pbmcnXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgbmV4dCgpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1ZhbGlkYXRpb24gZXJyb3I6JywgZXJyb3IpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICBjb2RlOiAnSU5URVJOQUxfU0VSVkVSX0VSUk9SJyxcbiAgICAgIG1lc3NhZ2U6ICdWYWxpZGF0aW9uIHNlcnZpY2UgZXJyb3InLFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICByZXF1ZXN0SWQ6IHJlcS5oZWFkZXJzWyd4LXJlcXVlc3QtaWQnXSB8fCAndW5rbm93bicsXG4gICAgICBzZXZlcml0eTogJ2Vycm9yJ1xuICAgIH0pO1xuICB9XG59O1xuXG4vKipcbiAqIFZhbGlkYXRlIHdlYiBzZWFyY2ggcmVxdWVzdFxuICovXG5leHBvcnQgY29uc3QgdmFsaWRhdGVXZWJTZWFyY2hSZXF1ZXN0ID0gKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKTogdm9pZCA9PiB7XG4gIGNvbnN0IHsgcXVlcnksIGRlcHRoLCBzb3VyY2VzLCB0aW1lZnJhbWUsIG1heFJlc3VsdHMgfSA9IHJlcS5ib2R5O1xuICBcbiAgY29uc3QgZXJyb3JzID0gW107XG4gIFxuICAvLyBWYWxpZGF0ZSByZXF1aXJlZCBmaWVsZHNcbiAgaWYgKCFxdWVyeSkge1xuICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1F1ZXJ5IGlzIHJlcXVpcmVkJywgJ3F1ZXJ5JywgJ1JFUVVJUkVEJykpO1xuICB9XG4gIFxuICAvLyBWYWxpZGF0ZSBkZXB0aFxuICBpZiAoZGVwdGggJiYgIVsnYmFzaWMnLCAnY29tcHJlaGVuc2l2ZSddLmluY2x1ZGVzKGRlcHRoKSkge1xuICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0RlcHRoIG11c3QgYmUgZWl0aGVyIFwiYmFzaWNcIiBvciBcImNvbXByZWhlbnNpdmVcIicsICdkZXB0aCcsICdJTlZBTElEX1ZBTFVFJykpO1xuICB9XG4gIFxuICAvLyBWYWxpZGF0ZSBzb3VyY2VzXG4gIGlmIChzb3VyY2VzICYmICFBcnJheS5pc0FycmF5KHNvdXJjZXMpKSB7XG4gICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcignU291cmNlcyBtdXN0IGJlIGFuIGFycmF5JywgJ3NvdXJjZXMnLCAnSU5WQUxJRF9UWVBFJykpO1xuICB9XG4gIFxuICAvLyBWYWxpZGF0ZSB0aW1lZnJhbWVcbiAgY29uc3QgdmFsaWRUaW1lZnJhbWVzID0gWydyZWNlbnQnLCAncGFzdC13ZWVrJywgJ3Bhc3QtbW9udGgnLCAncGFzdC15ZWFyJywgJ2FsbC10aW1lJ107XG4gIGlmICh0aW1lZnJhbWUgJiYgIXZhbGlkVGltZWZyYW1lcy5pbmNsdWRlcyh0aW1lZnJhbWUpKSB7XG4gICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcihgVGltZWZyYW1lIG11c3QgYmUgb25lIG9mOiAke3ZhbGlkVGltZWZyYW1lcy5qb2luKCcsICcpfWAsICd0aW1lZnJhbWUnLCAnSU5WQUxJRF9WQUxVRScpKTtcbiAgfVxuICBcbiAgLy8gVmFsaWRhdGUgbWF4UmVzdWx0c1xuICBpZiAobWF4UmVzdWx0cyAmJiAodHlwZW9mIG1heFJlc3VsdHMgIT09ICdudW1iZXInIHx8IG1heFJlc3VsdHMgPCAxIHx8IG1heFJlc3VsdHMgPiAxMDApKSB7XG4gICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcignTWF4IHJlc3VsdHMgbXVzdCBiZSBhIG51bWJlciBiZXR3ZWVuIDEgYW5kIDEwMCcsICdtYXhSZXN1bHRzJywgJ0lOVkFMSURfVkFMVUUnKSk7XG4gIH1cbiAgXG4gIGlmIChlcnJvcnMubGVuZ3RoID4gMCkge1xuICAgIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgIGNvZGU6ICdWQUxJREFUSU9OX0VSUk9SJyxcbiAgICAgIG1lc3NhZ2U6ICdSZXF1ZXN0IHZhbGlkYXRpb24gZmFpbGVkJyxcbiAgICAgIGRldGFpbHM6IGVycm9ycy5tYXAoZXJyb3IgPT4gKHtcbiAgICAgICAgZmllbGQ6IGVycm9yLmZpZWxkLFxuICAgICAgICBtZXNzYWdlOiBlcnJvci5tZXNzYWdlLFxuICAgICAgICBjb2RlOiBlcnJvci5jb2RlXG4gICAgICB9KSksXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIHJlcXVlc3RJZDogcmVxLmhlYWRlcnNbJ3gtcmVxdWVzdC1pZCddIHx8ICd1bmtub3duJyxcbiAgICAgIHNldmVyaXR5OiAnd2FybmluZydcbiAgICB9KTtcbiAgICByZXR1cm47XG4gIH1cbiAgXG4gIG5leHQoKTtcbn07XG5cbi8qKlxuICogVmFsaWRhdGUgZGVlcCByZXNlYXJjaCByZXF1ZXN0XG4gKi9cbmV4cG9ydCBjb25zdCB2YWxpZGF0ZURlZXBSZXNlYXJjaFJlcXVlc3QgPSAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pOiB2b2lkID0+IHtcbiAgY29uc3QgeyB0b3BpYywgZGVwdGgsIGZvY3VzQXJlYXMsIGluY2x1ZGVTb3VyY2VzLCBleGNsdWRlU291cmNlcywgdGltZUNvbnN0cmFpbnQgfSA9IHJlcS5ib2R5O1xuICBcbiAgY29uc3QgZXJyb3JzID0gW107XG4gIFxuICAvLyBWYWxpZGF0ZSByZXF1aXJlZCBmaWVsZHNcbiAgaWYgKCF0b3BpYykge1xuICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1RvcGljIGlzIHJlcXVpcmVkJywgJ3RvcGljJywgJ1JFUVVJUkVEJykpO1xuICB9XG4gIFxuICAvLyBWYWxpZGF0ZSBkZXB0aFxuICBjb25zdCB2YWxpZERlcHRocyA9IFsnc3RhbmRhcmQnLCAnZGVlcCcsICdjb21wcmVoZW5zaXZlJ107XG4gIGlmIChkZXB0aCAmJiAhdmFsaWREZXB0aHMuaW5jbHVkZXMoZGVwdGgpKSB7XG4gICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcihgRGVwdGggbXVzdCBiZSBvbmUgb2Y6ICR7dmFsaWREZXB0aHMuam9pbignLCAnKX1gLCAnZGVwdGgnLCAnSU5WQUxJRF9WQUxVRScpKTtcbiAgfVxuICBcbiAgLy8gVmFsaWRhdGUgYXJyYXlzXG4gIGlmIChmb2N1c0FyZWFzICYmICFBcnJheS5pc0FycmF5KGZvY3VzQXJlYXMpKSB7XG4gICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcignRm9jdXMgYXJlYXMgbXVzdCBiZSBhbiBhcnJheScsICdmb2N1c0FyZWFzJywgJ0lOVkFMSURfVFlQRScpKTtcbiAgfVxuICBcbiAgaWYgKGluY2x1ZGVTb3VyY2VzICYmICFBcnJheS5pc0FycmF5KGluY2x1ZGVTb3VyY2VzKSkge1xuICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0luY2x1ZGUgc291cmNlcyBtdXN0IGJlIGFuIGFycmF5JywgJ2luY2x1ZGVTb3VyY2VzJywgJ0lOVkFMSURfVFlQRScpKTtcbiAgfVxuICBcbiAgaWYgKGV4Y2x1ZGVTb3VyY2VzICYmICFBcnJheS5pc0FycmF5KGV4Y2x1ZGVTb3VyY2VzKSkge1xuICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0V4Y2x1ZGUgc291cmNlcyBtdXN0IGJlIGFuIGFycmF5JywgJ2V4Y2x1ZGVTb3VyY2VzJywgJ0lOVkFMSURfVFlQRScpKTtcbiAgfVxuICBcbiAgLy8gVmFsaWRhdGUgdGltZUNvbnN0cmFpbnRcbiAgaWYgKHRpbWVDb25zdHJhaW50ICYmICh0eXBlb2YgdGltZUNvbnN0cmFpbnQgIT09ICdudW1iZXInIHx8IHRpbWVDb25zdHJhaW50IDwgMSkpIHtcbiAgICBlcnJvcnMucHVzaChuZXcgVmFsaWRhdGlvbkVycm9yKCdUaW1lIGNvbnN0cmFpbnQgbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicsICd0aW1lQ29uc3RyYWludCcsICdJTlZBTElEX1ZBTFVFJykpO1xuICB9XG4gIFxuICBpZiAoZXJyb3JzLmxlbmd0aCA+IDApIHtcbiAgICByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICBjb2RlOiAnVkFMSURBVElPTl9FUlJPUicsXG4gICAgICBtZXNzYWdlOiAnUmVxdWVzdCB2YWxpZGF0aW9uIGZhaWxlZCcsXG4gICAgICBkZXRhaWxzOiBlcnJvcnMubWFwKGVycm9yID0+ICh7XG4gICAgICAgIGZpZWxkOiBlcnJvci5maWVsZCxcbiAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZSxcbiAgICAgICAgY29kZTogZXJyb3IuY29kZVxuICAgICAgfSkpLFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICByZXF1ZXN0SWQ6IHJlcS5oZWFkZXJzWyd4LXJlcXVlc3QtaWQnXSB8fCAndW5rbm93bicsXG4gICAgICBzZXZlcml0eTogJ3dhcm5pbmcnXG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIFxuICBuZXh0KCk7XG59O1xuXG4vKipcbiAqIFNpbXBsZSB2YWxpZGF0aW9uIG1pZGRsZXdhcmUgZm9yIGJhc2ljIHJlcXVlc3QgdmFsaWRhdGlvblxuICovXG5leHBvcnQgY29uc3QgdmFsaWRhdGVSZXF1ZXN0ID0gKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKTogdm9pZCA9PiB7XG4gIC8vIEJhc2ljIHZhbGlkYXRpb24gLSBqdXN0IGVuc3VyZSByZXF1ZXN0IGJvZHkgZXhpc3RzIGZvciBQT1NUL1BVVCByZXF1ZXN0c1xuICBpZiAoWydQT1NUJywgJ1BVVCcsICdQQVRDSCddLmluY2x1ZGVzKHJlcS5tZXRob2QpICYmICFyZXEuYm9keSkge1xuICAgIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgZXJyb3I6ICdWYWxpZGF0aW9uIGVycm9yJyxcbiAgICAgIG1lc3NhZ2U6ICdSZXF1ZXN0IGJvZHkgaXMgcmVxdWlyZWQnXG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIFxuICBuZXh0KCk7XG59O1xuXG4vKipcbiAqIEFkdmFuY2VkIHZhbGlkYXRpb24gbWlkZGxld2FyZSBmYWN0b3J5XG4gKiBDcmVhdGVzIGEgdmFsaWRhdGlvbiBtaWRkbGV3YXJlIGJhc2VkIG9uIGEgc2NoZW1hIGRlZmluaXRpb25cbiAqL1xuZXhwb3J0IGNvbnN0IHZhbGlkYXRpb25NaWRkbGV3YXJlID0gKHNjaGVtYToge1xuICBib2R5PzogUmVjb3JkPHN0cmluZywgYW55PjtcbiAgcGFyYW1zPzogUmVjb3JkPHN0cmluZywgYW55PjtcbiAgcXVlcnk/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xufSkgPT4ge1xuICByZXR1cm4gKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKTogdm9pZCA9PiB7XG4gICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgLy8gVmFsaWRhdGUgYm9keVxuICAgIGlmIChzY2hlbWEuYm9keSkge1xuICAgICAgY29uc3QgYm9keUVycm9ycyA9IHZhbGlkYXRlT2JqZWN0KHJlcS5ib2R5IHx8IHt9LCBzY2hlbWEuYm9keSwgJ2JvZHknKTtcbiAgICAgIGVycm9ycy5wdXNoKC4uLmJvZHlFcnJvcnMpO1xuICAgIH1cblxuICAgIC8vIFZhbGlkYXRlIHBhcmFtc1xuICAgIGlmIChzY2hlbWEucGFyYW1zKSB7XG4gICAgICBjb25zdCBwYXJhbUVycm9ycyA9IHZhbGlkYXRlT2JqZWN0KHJlcS5wYXJhbXMgfHwge30sIHNjaGVtYS5wYXJhbXMsICdwYXJhbXMnKTtcbiAgICAgIGVycm9ycy5wdXNoKC4uLnBhcmFtRXJyb3JzKTtcbiAgICB9XG5cbiAgICAvLyBWYWxpZGF0ZSBxdWVyeVxuICAgIGlmIChzY2hlbWEucXVlcnkpIHtcbiAgICAgIGNvbnN0IHF1ZXJ5RXJyb3JzID0gdmFsaWRhdGVPYmplY3QocmVxLnF1ZXJ5IHx8IHt9LCBzY2hlbWEucXVlcnksICdxdWVyeScpO1xuICAgICAgZXJyb3JzLnB1c2goLi4ucXVlcnlFcnJvcnMpO1xuICAgIH1cblxuICAgIGlmIChlcnJvcnMubGVuZ3RoID4gMCkge1xuICAgICAgcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBlcnJvcjogJ1ZhbGlkYXRpb24gZmFpbGVkJyxcbiAgICAgICAgY29kZTogJ1ZBTElEQVRJT05fRVJST1InLFxuICAgICAgICBkZXRhaWxzOiB7IGVycm9ycyB9LFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbmV4dCgpO1xuICB9O1xufTtcblxuLyoqXG4gKiBWYWxpZGF0ZSBhbiBvYmplY3QgYWdhaW5zdCBhIHNjaGVtYVxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZU9iamVjdChvYmo6IGFueSwgc2NoZW1hOiBSZWNvcmQ8c3RyaW5nLCBhbnk+LCBjb250ZXh0OiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcblxuICBmb3IgKGNvbnN0IFtrZXksIHJ1bGVzXSBvZiBPYmplY3QuZW50cmllcyhzY2hlbWEpKSB7XG4gICAgY29uc3QgdmFsdWUgPSBvYmpba2V5XTtcblxuICAgIC8vIENoZWNrIHJlcXVpcmVkIGZpZWxkc1xuICAgIGlmIChydWxlcy5yZXF1aXJlZCAmJiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycpKSB7XG4gICAgICBlcnJvcnMucHVzaChgJHtjb250ZXh0fS4ke2tleX0gaXMgcmVxdWlyZWRgKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIFNraXAgdmFsaWRhdGlvbiBpZiBmaWVsZCBpcyBub3QgcmVxdWlyZWQgYW5kIG5vdCBwcmVzZW50XG4gICAgaWYgKCFydWxlcy5yZXF1aXJlZCAmJiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIFR5cGUgdmFsaWRhdGlvblxuICAgIGlmIChydWxlcy50eXBlKSB7XG4gICAgICBpZiAoIXZhbGlkYXRlVHlwZSh2YWx1ZSwgcnVsZXMudHlwZSkpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goYCR7Y29udGV4dH0uJHtrZXl9IG11c3QgYmUgb2YgdHlwZSAke3J1bGVzLnR5cGV9YCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEVudW0gdmFsaWRhdGlvblxuICAgIGlmIChydWxlcy5lbnVtICYmICFydWxlcy5lbnVtLmluY2x1ZGVzKHZhbHVlKSkge1xuICAgICAgZXJyb3JzLnB1c2goYCR7Y29udGV4dH0uJHtrZXl9IG11c3QgYmUgb25lIG9mOiAke3J1bGVzLmVudW0uam9pbignLCAnKX1gKTtcbiAgICB9XG5cbiAgICAvLyBOdW1iZXIgdmFsaWRhdGlvbnNcbiAgICBpZiAocnVsZXMudHlwZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIGlmIChydWxlcy5taW4gIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSA8IHJ1bGVzLm1pbikge1xuICAgICAgICBlcnJvcnMucHVzaChgJHtjb250ZXh0fS4ke2tleX0gbXVzdCBiZSBhdCBsZWFzdCAke3J1bGVzLm1pbn1gKTtcbiAgICAgIH1cbiAgICAgIGlmIChydWxlcy5tYXggIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSA+IHJ1bGVzLm1heCkge1xuICAgICAgICBlcnJvcnMucHVzaChgJHtjb250ZXh0fS4ke2tleX0gbXVzdCBiZSBhdCBtb3N0ICR7cnVsZXMubWF4fWApO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFN0cmluZyB2YWxpZGF0aW9uc1xuICAgIGlmIChydWxlcy50eXBlID09PSAnc3RyaW5nJykge1xuICAgICAgaWYgKHJ1bGVzLm1pbkxlbmd0aCAhPT0gdW5kZWZpbmVkICYmIHZhbHVlLmxlbmd0aCA8IHJ1bGVzLm1pbkxlbmd0aCkge1xuICAgICAgICBlcnJvcnMucHVzaChgJHtjb250ZXh0fS4ke2tleX0gbXVzdCBiZSBhdCBsZWFzdCAke3J1bGVzLm1pbkxlbmd0aH0gY2hhcmFjdGVycyBsb25nYCk7XG4gICAgICB9XG4gICAgICBpZiAocnVsZXMubWF4TGVuZ3RoICE9PSB1bmRlZmluZWQgJiYgdmFsdWUubGVuZ3RoID4gcnVsZXMubWF4TGVuZ3RoKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKGAke2NvbnRleHR9LiR7a2V5fSBtdXN0IGJlIGF0IG1vc3QgJHtydWxlcy5tYXhMZW5ndGh9IGNoYXJhY3RlcnMgbG9uZ2ApO1xuICAgICAgfVxuICAgICAgaWYgKHJ1bGVzLmZvcm1hdCA9PT0gJ3V1aWQnICYmICFpc1ZhbGlkVVVJRCh2YWx1ZSkpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goYCR7Y29udGV4dH0uJHtrZXl9IG11c3QgYmUgYSB2YWxpZCBVVUlEYCk7XG4gICAgICB9XG4gICAgICBpZiAocnVsZXMuZm9ybWF0ID09PSAndXJsJyAmJiAhaXNWYWxpZFVSTCh2YWx1ZSkpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goYCR7Y29udGV4dH0uJHtrZXl9IG11c3QgYmUgYSB2YWxpZCBVUkxgKTtcbiAgICAgIH1cbiAgICAgIGlmIChydWxlcy5mb3JtYXQgPT09ICdkYXRlLXRpbWUnICYmICFpc1ZhbGlkRGF0ZVRpbWUodmFsdWUpKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKGAke2NvbnRleHR9LiR7a2V5fSBtdXN0IGJlIGEgdmFsaWQgZGF0ZS10aW1lYCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQXJyYXkgdmFsaWRhdGlvbnNcbiAgICBpZiAocnVsZXMudHlwZSA9PT0gJ2FycmF5Jykge1xuICAgICAgaWYgKHJ1bGVzLm1heEl0ZW1zICE9PSB1bmRlZmluZWQgJiYgdmFsdWUubGVuZ3RoID4gcnVsZXMubWF4SXRlbXMpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goYCR7Y29udGV4dH0uJHtrZXl9IG11c3QgaGF2ZSBhdCBtb3N0ICR7cnVsZXMubWF4SXRlbXN9IGl0ZW1zYCk7XG4gICAgICB9XG4gICAgICBpZiAocnVsZXMubWluSXRlbXMgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZS5sZW5ndGggPCBydWxlcy5taW5JdGVtcykge1xuICAgICAgICBlcnJvcnMucHVzaChgJHtjb250ZXh0fS4ke2tleX0gbXVzdCBoYXZlIGF0IGxlYXN0ICR7cnVsZXMubWluSXRlbXN9IGl0ZW1zYCk7XG4gICAgICB9XG4gICAgICBpZiAocnVsZXMuaXRlbXMgJiYgcnVsZXMuaXRlbXMudHlwZSkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKCF2YWxpZGF0ZVR5cGUodmFsdWVbaV0sIHJ1bGVzLml0ZW1zLnR5cGUpKSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChgJHtjb250ZXh0fS4ke2tleX1bJHtpfV0gbXVzdCBiZSBvZiB0eXBlICR7cnVsZXMuaXRlbXMudHlwZX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHJ1bGVzLml0ZW1zLmVudW0gJiYgIXJ1bGVzLml0ZW1zLmVudW0uaW5jbHVkZXModmFsdWVbaV0pKSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChgJHtjb250ZXh0fS4ke2tleX1bJHtpfV0gbXVzdCBiZSBvbmUgb2Y6ICR7cnVsZXMuaXRlbXMuZW51bS5qb2luKCcsICcpfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE9iamVjdCB2YWxpZGF0aW9uc1xuICAgIGlmIChydWxlcy50eXBlID09PSAnb2JqZWN0JyAmJiBydWxlcy5wcm9wZXJ0aWVzKSB7XG4gICAgICBjb25zdCBuZXN0ZWRFcnJvcnMgPSB2YWxpZGF0ZU9iamVjdCh2YWx1ZSwgcnVsZXMucHJvcGVydGllcywgYCR7Y29udGV4dH0uJHtrZXl9YCk7XG4gICAgICBlcnJvcnMucHVzaCguLi5uZXN0ZWRFcnJvcnMpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBlcnJvcnM7XG59XG5cbi8qKlxuICogVmFsaWRhdGUgdGhlIHR5cGUgb2YgYSB2YWx1ZVxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZVR5cGUodmFsdWU6IGFueSwgZXhwZWN0ZWRUeXBlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgc3dpdGNoIChleHBlY3RlZFR5cGUpIHtcbiAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZyc7XG4gICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICYmICFpc05hTih2YWx1ZSk7XG4gICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbic7XG4gICAgY2FzZSAnYXJyYXknOlxuICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpO1xuICAgIGNhc2UgJ29iamVjdCc6XG4gICAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCAmJiAhQXJyYXkuaXNBcnJheSh2YWx1ZSk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbi8qKlxuICogVmFsaWRhdGUgVVVJRCBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gaXNWYWxpZFVVSUQodmFsdWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCB1dWlkUmVnZXggPSAvXlswLTlhLWZdezh9LVswLTlhLWZdezR9LVsxLTVdWzAtOWEtZl17M30tWzg5YWJdWzAtOWEtZl17M30tWzAtOWEtZl17MTJ9JC9pO1xuICByZXR1cm4gdXVpZFJlZ2V4LnRlc3QodmFsdWUpO1xufVxuXG4vKipcbiAqIFZhbGlkYXRlIFVSTCBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gaXNWYWxpZFVSTCh2YWx1ZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHRyeSB7XG4gICAgbmV3IFVSTCh2YWx1ZSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG4vKipcbiAqIFZhbGlkYXRlIGRhdGUtdGltZSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gaXNWYWxpZERhdGVUaW1lKHZhbHVlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgZGF0ZSA9IG5ldyBEYXRlKHZhbHVlKTtcbiAgcmV0dXJuICFpc05hTihkYXRlLmdldFRpbWUoKSk7XG59XG5cbi8qKlxuICogR2V0IHRoZSBhcHByb3ByaWF0ZSBzY2hlbWEgZm9yIGFuIGVuZHBvaW50XG4gKiBAcGFyYW0gcGF0aCBUaGUgcmVxdWVzdCBwYXRoXG4gKiBAcGFyYW0gbWV0aG9kIFRoZSBIVFRQIG1ldGhvZFxuICogQHJldHVybnMgVGhlIHNjaGVtYSBmb3IgdGhlIGVuZHBvaW50LCBvciB1bmRlZmluZWQgaWYgbm8gc2NoZW1hIGlzIGRlZmluZWRcbiAqL1xuZnVuY3Rpb24gZ2V0U2NoZW1hRm9yRW5kcG9pbnQocGF0aDogc3RyaW5nLCBtZXRob2Q6IHN0cmluZyk6IFJlY29yZDxzdHJpbmcsIGFueT4gfCB1bmRlZmluZWQge1xuICAvLyBEZWZpbmUgc2NoZW1hcyBmb3IgZGlmZmVyZW50IGVuZHBvaW50c1xuICBjb25zdCBzY2hlbWFzOiBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBhbnk+Pj4gPSB7XG4gICAgJy9hcGkvYXV0aC9yZWdpc3Rlcic6IHtcbiAgICAgIFBPU1Q6IHtcbiAgICAgICAgZW1haWw6IHsgdHlwZTogJ3N0cmluZycsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgIHBhc3N3b3JkOiB7IHR5cGU6ICdzdHJpbmcnLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICBmaXJzdE5hbWU6IHsgdHlwZTogJ3N0cmluZycsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgIGxhc3ROYW1lOiB7IHR5cGU6ICdzdHJpbmcnLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICBvcmdhbml6YXRpb25JZDogeyB0eXBlOiAnc3RyaW5nJywgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgcm9sZTogeyB0eXBlOiAnc3RyaW5nJywgcmVxdWlyZWQ6IHRydWUsIGVudW06IFsnYW5hbHlzdCcsICdwb3J0Zm9saW8tbWFuYWdlcicsICdjb21wbGlhbmNlLW9mZmljZXInLCAnYWRtaW5pc3RyYXRvciddIH0sXG4gICAgICAgIHRpdGxlOiB7IHR5cGU6ICdzdHJpbmcnLCByZXF1aXJlZDogZmFsc2UgfSxcbiAgICAgICAgZGVwYXJ0bWVudDogeyB0eXBlOiAnc3RyaW5nJywgcmVxdWlyZWQ6IGZhbHNlIH0sXG4gICAgICAgIHBob25lTnVtYmVyOiB7IHR5cGU6ICdzdHJpbmcnLCByZXF1aXJlZDogZmFsc2UgfSxcbiAgICAgICAgdGltZXpvbmU6IHsgdHlwZTogJ3N0cmluZycsIHJlcXVpcmVkOiBmYWxzZSB9LFxuICAgICAgICBsYW5ndWFnZTogeyB0eXBlOiAnc3RyaW5nJywgcmVxdWlyZWQ6IGZhbHNlIH1cbiAgICAgIH1cbiAgICB9LFxuICAgICcvYXBpL2F1dGgvbG9naW4nOiB7XG4gICAgICBQT1NUOiB7XG4gICAgICAgIGVtYWlsOiB7IHR5cGU6ICdzdHJpbmcnLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICBwYXNzd29yZDogeyB0eXBlOiAnc3RyaW5nJywgcmVxdWlyZWQ6IHRydWUgfVxuICAgICAgfVxuICAgIH0sXG4gICAgJy9hcGkvYXV0aC9yZWZyZXNoJzoge1xuICAgICAgUE9TVDoge1xuICAgICAgICByZWZyZXNoVG9rZW46IHsgdHlwZTogJ3N0cmluZycsIHJlcXVpcmVkOiB0cnVlIH1cbiAgICAgIH1cbiAgICB9LFxuICAgICcvYXBpL2F1dGgvY2hhbmdlLXBhc3N3b3JkJzoge1xuICAgICAgUE9TVDoge1xuICAgICAgICBjdXJyZW50UGFzc3dvcmQ6IHsgdHlwZTogJ3N0cmluZycsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgIG5ld1Bhc3N3b3JkOiB7IHR5cGU6ICdzdHJpbmcnLCByZXF1aXJlZDogdHJ1ZSB9XG4gICAgICB9XG4gICAgfSxcbiAgICAnL2FwaS9hdXRoL2ZvcmdvdC1wYXNzd29yZCc6IHtcbiAgICAgIFBPU1Q6IHtcbiAgICAgICAgZW1haWw6IHsgdHlwZTogJ3N0cmluZycsIHJlcXVpcmVkOiB0cnVlIH1cbiAgICAgIH1cbiAgICB9LFxuICAgICcvYXBpL2F1dGgvcmVzZXQtcGFzc3dvcmQnOiB7XG4gICAgICBQT1NUOiB7XG4gICAgICAgIHRva2VuOiB7IHR5cGU6ICdzdHJpbmcnLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICBuZXdQYXNzd29yZDogeyB0eXBlOiAnc3RyaW5nJywgcmVxdWlyZWQ6IHRydWUgfVxuICAgICAgfVxuICAgIH0sXG4gICAgJy9hcGkvdjEvaWRlYXMnOiB7XG4gICAgICBQT1NUOiB7XG4gICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiB7IHR5cGU6ICdzdHJpbmcnLCByZXF1aXJlZDogdHJ1ZSwgZW51bTogWydzaG9ydCcsICdtZWRpdW0nLCAnbG9uZyddIH0sXG4gICAgICAgIHJpc2tUb2xlcmFuY2U6IHsgdHlwZTogJ3N0cmluZycsIHJlcXVpcmVkOiB0cnVlLCBlbnVtOiBbJ2NvbnNlcnZhdGl2ZScsICdtb2RlcmF0ZScsICdhZ2dyZXNzaXZlJ10gfSxcbiAgICAgICAgc2VjdG9yczogeyB0eXBlOiAnYXJyYXknLCByZXF1aXJlZDogZmFsc2UsIGl0ZW1UeXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICBhc3NldENsYXNzZXM6IHsgdHlwZTogJ2FycmF5JywgcmVxdWlyZWQ6IGZhbHNlLCBpdGVtVHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgZXhjbHVkZWRJbnZlc3RtZW50czogeyB0eXBlOiAnYXJyYXknLCByZXF1aXJlZDogZmFsc2UsIGl0ZW1UeXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICBtaW5pbXVtQ29uZmlkZW5jZTogeyB0eXBlOiAnbnVtYmVyJywgcmVxdWlyZWQ6IGZhbHNlLCBtaW46IDAsIG1heDogMSB9LFxuICAgICAgICBtYXhpbXVtSWRlYXM6IHsgdHlwZTogJ251bWJlcicsIHJlcXVpcmVkOiBmYWxzZSwgbWluOiAxIH1cbiAgICAgIH1cbiAgICB9LFxuICAgICcvYXBpL3YxL2ludmVzdG1lbnRzJzoge1xuICAgICAgUE9TVDoge1xuICAgICAgICBpZDogeyB0eXBlOiAnc3RyaW5nJywgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgbmFtZTogeyB0eXBlOiAnc3RyaW5nJywgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgdHlwZTogeyB0eXBlOiAnc3RyaW5nJywgcmVxdWlyZWQ6IHRydWUsIGVudW06IFsnc3RvY2snLCAnYm9uZCcsICdldGYnLCAnbXV0dWFsLWZ1bmQnLCAnY29tbW9kaXR5JywgJ2NyeXB0b2N1cnJlbmN5JywgJ3JlYWwtZXN0YXRlJywgJ290aGVyJ10gfSxcbiAgICAgICAgZGVzY3JpcHRpb246IHsgdHlwZTogJ3N0cmluZycsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgIHNlY3RvcjogeyB0eXBlOiAnc3RyaW5nJywgcmVxdWlyZWQ6IGZhbHNlIH0sXG4gICAgICAgIGluZHVzdHJ5OiB7IHR5cGU6ICdzdHJpbmcnLCByZXF1aXJlZDogZmFsc2UgfSxcbiAgICAgICAgbWFya2V0Q2FwOiB7IHR5cGU6ICdudW1iZXInLCByZXF1aXJlZDogZmFsc2UsIG1pbjogMCB9LFxuICAgICAgICBjdXJyZW50UHJpY2U6IHsgdHlwZTogJ251bWJlcicsIHJlcXVpcmVkOiBmYWxzZSwgbWluOiAwIH0sXG4gICAgICAgIGhpc3RvcmljYWxQZXJmb3JtYW5jZTogeyB0eXBlOiAnYXJyYXknLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICByaXNrTWV0cmljczogeyB0eXBlOiAnb2JqZWN0JywgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgcmVsYXRlZEludmVzdG1lbnRzOiB7IHR5cGU6ICdhcnJheScsIHJlcXVpcmVkOiB0cnVlIH1cbiAgICAgIH1cbiAgICB9LFxuICAgICcvYXBpL3YxL2FuYWx5c2lzJzoge1xuICAgICAgUE9TVDoge1xuICAgICAgICBpbnZlc3RtZW50SWQ6IHsgdHlwZTogJ3N0cmluZycsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgIGFuYWx5c2lzVHlwZTogeyB0eXBlOiAnc3RyaW5nJywgcmVxdWlyZWQ6IHRydWUsIGVudW06IFsnZnVuZGFtZW50YWwnLCAndGVjaG5pY2FsJywgJ3NlbnRpbWVudCcsICdyaXNrJywgJ2NvbXByZWhlbnNpdmUnXSB9LFxuICAgICAgICBwYXJhbWV0ZXJzOiB7IHR5cGU6ICdvYmplY3QnLCByZXF1aXJlZDogdHJ1ZSB9XG4gICAgICB9XG4gICAgfSxcbiAgICAnL2FwaS93ZWItc2VhcmNoL3NlYXJjaCc6IHtcbiAgICAgIFBPU1Q6IHtcbiAgICAgICAgcXVlcnk6IHsgdHlwZTogJ3N0cmluZycsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgIGRlcHRoOiB7IHR5cGU6ICdzdHJpbmcnLCByZXF1aXJlZDogZmFsc2UsIGVudW06IFsnYmFzaWMnLCAnY29tcHJlaGVuc2l2ZSddIH0sXG4gICAgICAgIHNvdXJjZXM6IHsgdHlwZTogJ2FycmF5JywgcmVxdWlyZWQ6IGZhbHNlLCBpdGVtVHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgdGltZWZyYW1lOiB7IHR5cGU6ICdzdHJpbmcnLCByZXF1aXJlZDogZmFsc2UsIGVudW06IFsncmVjZW50JywgJ3Bhc3Qtd2VlaycsICdwYXN0LW1vbnRoJywgJ3Bhc3QteWVhcicsICdhbGwtdGltZSddIH0sXG4gICAgICAgIG1heFJlc3VsdHM6IHsgdHlwZTogJ251bWJlcicsIHJlcXVpcmVkOiBmYWxzZSwgbWluOiAxLCBtYXg6IDEwMCB9XG4gICAgICB9XG4gICAgfSxcbiAgICAnL2FwaS93ZWItc2VhcmNoL3Jlc2VhcmNoJzoge1xuICAgICAgUE9TVDoge1xuICAgICAgICB0b3BpYzogeyB0eXBlOiAnc3RyaW5nJywgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgZGVwdGg6IHsgdHlwZTogJ3N0cmluZycsIHJlcXVpcmVkOiBmYWxzZSwgZW51bTogWydzdGFuZGFyZCcsICdkZWVwJywgJ2NvbXByZWhlbnNpdmUnXSB9LFxuICAgICAgICBmb2N1c0FyZWFzOiB7IHR5cGU6ICdhcnJheScsIHJlcXVpcmVkOiBmYWxzZSwgaXRlbVR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgIGluY2x1ZGVTb3VyY2VzOiB7IHR5cGU6ICdhcnJheScsIHJlcXVpcmVkOiBmYWxzZSwgaXRlbVR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgIGV4Y2x1ZGVTb3VyY2VzOiB7IHR5cGU6ICdhcnJheScsIHJlcXVpcmVkOiBmYWxzZSwgaXRlbVR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgIHRpbWVDb25zdHJhaW50OiB7IHR5cGU6ICdudW1iZXInLCByZXF1aXJlZDogZmFsc2UsIG1pbjogMSB9XG4gICAgICB9XG4gICAgfSxcbiAgICAnL2FwaS93ZWItc2VhcmNoL3ZlcmlmeS1zb3VyY2UnOiB7XG4gICAgICBQT1NUOiB7XG4gICAgICAgIHNvdXJjZTogeyB0eXBlOiAnb2JqZWN0JywgcmVxdWlyZWQ6IHRydWUgfVxuICAgICAgfVxuICAgIH0sXG4gICAgJy9hcGkvd2ViLXNlYXJjaC90cmFjay1jaXRhdGlvbnMnOiB7XG4gICAgICBQT1NUOiB7XG4gICAgICAgIHJlc2VhcmNoUmVzdWx0OiB7IHR5cGU6ICdvYmplY3QnLCByZXF1aXJlZDogdHJ1ZSB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8vIEZpbmQgdGhlIG1hdGNoaW5nIHNjaGVtYVxuICBmb3IgKGNvbnN0IFtyb3V0ZVBhdGgsIG1ldGhvZFNjaGVtYXNdIG9mIE9iamVjdC5lbnRyaWVzKHNjaGVtYXMpKSB7XG4gICAgaWYgKHBhdGguc3RhcnRzV2l0aChyb3V0ZVBhdGgpKSB7XG4gICAgICByZXR1cm4gbWV0aG9kU2NoZW1hc1ttZXRob2RdO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB1bmRlZmluZWQ7XG59Il19