import { Request, Response, NextFunction } from 'express';
import { validateData } from '../../utils/validation';
import { ValidationError } from '../../models';

/**
 * Middleware for validating request bodies against schemas
 */
export const requestValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
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
    const validationResult = validateData(req.body, schema);
    
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
  } catch (error) {
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

/**
 * Validate web search request
 */
export const validateWebSearchRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { query, depth, sources, timeframe, maxResults } = req.body;
  
  const errors = [];
  
  // Validate required fields
  if (!query) {
    errors.push(new ValidationError('Query is required', 'query', 'REQUIRED'));
  }
  
  // Validate depth
  if (depth && !['basic', 'comprehensive'].includes(depth)) {
    errors.push(new ValidationError('Depth must be either "basic" or "comprehensive"', 'depth', 'INVALID_VALUE'));
  }
  
  // Validate sources
  if (sources && !Array.isArray(sources)) {
    errors.push(new ValidationError('Sources must be an array', 'sources', 'INVALID_TYPE'));
  }
  
  // Validate timeframe
  const validTimeframes = ['recent', 'past-week', 'past-month', 'past-year', 'all-time'];
  if (timeframe && !validTimeframes.includes(timeframe)) {
    errors.push(new ValidationError(`Timeframe must be one of: ${validTimeframes.join(', ')}`, 'timeframe', 'INVALID_VALUE'));
  }
  
  // Validate maxResults
  if (maxResults && (typeof maxResults !== 'number' || maxResults < 1 || maxResults > 100)) {
    errors.push(new ValidationError('Max results must be a number between 1 and 100', 'maxResults', 'INVALID_VALUE'));
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

/**
 * Validate deep research request
 */
export const validateDeepResearchRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { topic, depth, focusAreas, includeSources, excludeSources, timeConstraint } = req.body;
  
  const errors = [];
  
  // Validate required fields
  if (!topic) {
    errors.push(new ValidationError('Topic is required', 'topic', 'REQUIRED'));
  }
  
  // Validate depth
  const validDepths = ['standard', 'deep', 'comprehensive'];
  if (depth && !validDepths.includes(depth)) {
    errors.push(new ValidationError(`Depth must be one of: ${validDepths.join(', ')}`, 'depth', 'INVALID_VALUE'));
  }
  
  // Validate arrays
  if (focusAreas && !Array.isArray(focusAreas)) {
    errors.push(new ValidationError('Focus areas must be an array', 'focusAreas', 'INVALID_TYPE'));
  }
  
  if (includeSources && !Array.isArray(includeSources)) {
    errors.push(new ValidationError('Include sources must be an array', 'includeSources', 'INVALID_TYPE'));
  }
  
  if (excludeSources && !Array.isArray(excludeSources)) {
    errors.push(new ValidationError('Exclude sources must be an array', 'excludeSources', 'INVALID_TYPE'));
  }
  
  // Validate timeConstraint
  if (timeConstraint && (typeof timeConstraint !== 'number' || timeConstraint < 1)) {
    errors.push(new ValidationError('Time constraint must be a positive number', 'timeConstraint', 'INVALID_VALUE'));
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

/**
 * Simple validation middleware for basic request validation
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
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

/**
 * Advanced validation middleware factory
 * Creates a validation middleware based on a schema definition
 */
export const validationMiddleware = (schema: {
  body?: Record<string, any>;
  params?: Record<string, any>;
  query?: Record<string, any>;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

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

/**
 * Validate an object against a schema
 */
function validateObject(obj: any, schema: Record<string, any>, context: string): string[] {
  const errors: string[] = [];

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
function validateType(value: any, expectedType: string): boolean {
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
function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Validate URL format
 */
function isValidURL(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate date-time format
 */
function isValidDateTime(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Get the appropriate schema for an endpoint
 * @param path The request path
 * @param method The HTTP method
 * @returns The schema for the endpoint, or undefined if no schema is defined
 */
function getSchemaForEndpoint(path: string, method: string): Record<string, any> | undefined {
  // Define schemas for different endpoints
  const schemas: Record<string, Record<string, Record<string, any>>> = {
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