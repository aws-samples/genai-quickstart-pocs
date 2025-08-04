import { Request, Response, NextFunction } from 'express';
import { logger } from '../../services/logging/logger';
import { auditService, AuditEventType } from '../../services/logging/audit-service';

export interface AuditContext {
  userId?: string;
  userRole?: string;
  organizationId?: string;
  sessionId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditableRequest extends Request {
  auditContext?: AuditContext;
  startTime?: number;
}

/**
 * Middleware to extract audit context from request
 */
export function auditContextMiddleware(req: AuditableRequest, res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.auditContext = {
    userId: req.headers['x-user-id'] as string,
    userRole: req.headers['x-user-role'] as string,
    organizationId: req.headers['x-organization-id'] as string,
    sessionId: req.headers['x-session-id'] as string,
    requestId,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']
  };

  req.startTime = Date.now();

  // Add request ID to response headers
  res.setHeader('x-request-id', requestId);

  next();
}

/**
 * Middleware to log API requests and responses
 */
export function requestLoggingMiddleware(req: AuditableRequest, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Log incoming request
  logger.info('API', 'request', `${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'authorization': req.headers.authorization ? '[REDACTED]' : undefined
    },
    body: req.method !== 'GET' ? sanitizeRequestBody(req.body) : undefined
  }, req.auditContext);

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const responseTime = Date.now() - startTime;
    
    // Log response
    logger.info('API', 'response', `${req.method} ${req.path} - ${res.statusCode}`, {
      statusCode: res.statusCode,
      responseTime,
      responseSize: JSON.stringify(body).length
    }, req.auditContext);

    return originalJson.call(this, body);
  };

  // Override res.status to capture error responses
  const originalStatus = res.status;
  res.status = function(code: number) {
    if (code >= 400) {
      const responseTime = Date.now() - startTime;
      logger.warn('API', 'error_response', `${req.method} ${req.path} - ${code}`, {
        statusCode: code,
        responseTime
      }, req.auditContext);
    }
    return originalStatus.call(this, code);
  };

  next();
}

/**
 * Middleware to audit specific API operations
 */
export function auditOperationMiddleware(
  eventType: AuditEventType,
  resource: string,
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted' = 'internal'
) {
  return async (req: AuditableRequest, res: Response, next: NextFunction): Promise<void> => {
    const context = req.auditContext;
    
    if (!context?.userId || !context?.organizationId) {
      logger.warn('API', 'audit_missing_context', 'Audit context missing for operation', {
        eventType,
        resource,
        path: req.path
      });
      return next();
    }

    try {
      // Record the audit event
      await auditService.recordAuditEvent({
        userId: context.userId,
        userRole: context.userRole || 'unknown',
        organizationId: context.organizationId,
        eventType,
        resource,
        action: `${req.method} ${req.path}`,
        outcome: 'success', // Will be updated if there's an error
        details: {
          method: req.method,
          path: req.path,
          query: req.query,
          requestId: context.requestId,
          sessionId: context.sessionId
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
        requestId: context.requestId,
        riskLevel: determineRiskLevel(eventType, resource),
        dataClassification
      });

      // Override response methods to update audit outcome
      const originalJson = res.json;
      const originalStatus = res.status;
      let statusCode = 200;

      res.status = function(code: number) {
        statusCode = code;
        return originalStatus.call(this, code);
      };

      res.json = function(body: any) {
        // Update audit event with final outcome
        updateAuditOutcome(context.requestId!, statusCode >= 400 ? 'failure' : 'success', {
          statusCode,
          responseTime: Date.now() - (req.startTime || Date.now())
        });

        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      logger.error('API', 'audit_middleware_error', 'Failed to record audit event', error as Error, {
        eventType,
        resource,
        userId: context.userId
      });
      next(); // Continue processing even if audit fails
    }
  };
}

/**
 * Middleware for compliance-sensitive operations
 */
export function complianceAuditMiddleware(
  complianceRule: string,
  regulatoryFramework: string
) {
  return async (req: AuditableRequest, res: Response, next: NextFunction): Promise<void> => {
    const context = req.auditContext;
    
    if (!context?.userId || !context?.organizationId) {
      return next();
    }

    try {
      // Record compliance audit
      await auditService.recordComplianceAudit({
        complianceRule,
        regulatoryFramework,
        checkResult: 'compliant', // Will be updated based on operation result
        details: {
          ruleName: complianceRule,
          ruleVersion: '1.0',
          checkCriteria: [`API operation: ${req.method} ${req.path}`],
          findings: []
        },
        affectedResources: [req.path],
        userId: context.userId,
        organizationId: context.organizationId
      });

      next();
    } catch (error) {
      logger.error('API', 'compliance_audit_error', 'Failed to record compliance audit', error as Error, {
        complianceRule,
        regulatoryFramework,
        userId: context.userId
      });
      next();
    }
  };
}

/**
 * Error handling middleware with audit logging
 */
export function auditErrorMiddleware(error: Error, req: AuditableRequest, res: Response, next: NextFunction): void {
  const context = req.auditContext;
  
  // Log the error
  logger.error('API', 'unhandled_error', error.message, error, {
    path: req.path,
    method: req.method,
    statusCode: res.statusCode
  }, context);

  // Record security-relevant errors as audit events
  if (isSecurityRelevantError(error)) {
    auditService.recordAuditEvent({
      userId: context?.userId || 'anonymous',
      userRole: context?.userRole || 'unknown',
      organizationId: context?.organizationId || 'unknown',
      eventType: 'security_event',
      resource: req.path,
      action: `${req.method} ${req.path}`,
      outcome: 'failure',
      details: {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        requestId: context?.requestId,
        sessionId: context?.sessionId
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      sessionId: context?.sessionId,
      requestId: context?.requestId,
      riskLevel: 'high',
      dataClassification: 'internal'
    }).catch(auditError => {
      logger.error('API', 'audit_error_logging_failed', 'Failed to log security error to audit', auditError);
    });
  }

  next(error);
}

/**
 * Middleware to log data access events
 */
export function dataAccessAuditMiddleware(
  dataType: string,
  sensitivity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) {
  return auditOperationMiddleware(
    'data_access',
    `${dataType}_data`,
    sensitivity === 'critical' ? 'restricted' : 
    sensitivity === 'high' ? 'confidential' : 
    sensitivity === 'medium' ? 'internal' : 'public'
  );
}

/**
 * Middleware to log investment idea generation events
 */
export function investmentIdeaAuditMiddleware() {
  return auditOperationMiddleware(
    'investment_idea_generation',
    'investment_ideas',
    'confidential'
  );
}

// Helper functions

function sanitizeRequestBody(body: any): any {
  if (!body) return body;
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

function determineRiskLevel(eventType: AuditEventType, resource: string): 'low' | 'medium' | 'high' | 'critical' {
  // High-risk operations
  if (eventType === 'data_export' || eventType === 'configuration_change') {
    return 'high';
  }
  
  // Medium-risk operations
  if (eventType === 'investment_idea_generation' || eventType === 'data_modification') {
    return 'medium';
  }
  
  // Critical operations
  if (eventType === 'security_event' || resource.includes('admin')) {
    return 'critical';
  }
  
  return 'low';
}

async function updateAuditOutcome(requestId: string, outcome: 'success' | 'failure', metadata: Record<string, any>): Promise<void> {
  try {
    // In a real implementation, you would update the audit record in the database
    // For now, we'll just log the outcome
    await logger.info('API', 'audit_outcome', `Request ${requestId} completed with outcome: ${outcome}`, {
      requestId,
      outcome,
      ...metadata
    });
  } catch (error) {
    logger.error('API', 'audit_outcome_update_failed', 'Failed to update audit outcome', error as Error, {
      requestId,
      outcome
    });
  }
}

function isSecurityRelevantError(error: Error): boolean {
  const securityKeywords = [
    'unauthorized',
    'forbidden',
    'authentication',
    'authorization',
    'token',
    'permission',
    'access denied',
    'invalid credentials'
  ];
  
  const errorMessage = error.message.toLowerCase();
  return securityKeywords.some(keyword => errorMessage.includes(keyword));
}