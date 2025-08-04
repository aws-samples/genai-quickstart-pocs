"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.investmentIdeaAuditMiddleware = exports.dataAccessAuditMiddleware = exports.auditErrorMiddleware = exports.complianceAuditMiddleware = exports.auditOperationMiddleware = exports.requestLoggingMiddleware = exports.auditContextMiddleware = void 0;
const logger_1 = require("../../services/logging/logger");
const audit_service_1 = require("../../services/logging/audit-service");
/**
 * Middleware to extract audit context from request
 */
function auditContextMiddleware(req, res, next) {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    req.auditContext = {
        userId: req.headers['x-user-id'],
        userRole: req.headers['x-user-role'],
        organizationId: req.headers['x-organization-id'],
        sessionId: req.headers['x-session-id'],
        requestId,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
    };
    req.startTime = Date.now();
    // Add request ID to response headers
    res.setHeader('x-request-id', requestId);
    next();
}
exports.auditContextMiddleware = auditContextMiddleware;
/**
 * Middleware to log API requests and responses
 */
function requestLoggingMiddleware(req, res, next) {
    const startTime = Date.now();
    // Log incoming request
    logger_1.logger.info('API', 'request', `${req.method} ${req.path}`, {
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
    res.json = function (body) {
        const responseTime = Date.now() - startTime;
        // Log response
        logger_1.logger.info('API', 'response', `${req.method} ${req.path} - ${res.statusCode}`, {
            statusCode: res.statusCode,
            responseTime,
            responseSize: JSON.stringify(body).length
        }, req.auditContext);
        return originalJson.call(this, body);
    };
    // Override res.status to capture error responses
    const originalStatus = res.status;
    res.status = function (code) {
        if (code >= 400) {
            const responseTime = Date.now() - startTime;
            logger_1.logger.warn('API', 'error_response', `${req.method} ${req.path} - ${code}`, {
                statusCode: code,
                responseTime
            }, req.auditContext);
        }
        return originalStatus.call(this, code);
    };
    next();
}
exports.requestLoggingMiddleware = requestLoggingMiddleware;
/**
 * Middleware to audit specific API operations
 */
function auditOperationMiddleware(eventType, resource, dataClassification = 'internal') {
    return async (req, res, next) => {
        const context = req.auditContext;
        if (!context?.userId || !context?.organizationId) {
            logger_1.logger.warn('API', 'audit_missing_context', 'Audit context missing for operation', {
                eventType,
                resource,
                path: req.path
            });
            return next();
        }
        try {
            // Record the audit event
            await audit_service_1.auditService.recordAuditEvent({
                userId: context.userId,
                userRole: context.userRole || 'unknown',
                organizationId: context.organizationId,
                eventType,
                resource,
                action: `${req.method} ${req.path}`,
                outcome: 'success',
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
            res.status = function (code) {
                statusCode = code;
                return originalStatus.call(this, code);
            };
            res.json = function (body) {
                // Update audit event with final outcome
                updateAuditOutcome(context.requestId, statusCode >= 400 ? 'failure' : 'success', {
                    statusCode,
                    responseTime: Date.now() - (req.startTime || Date.now())
                });
                return originalJson.call(this, body);
            };
            next();
        }
        catch (error) {
            logger_1.logger.error('API', 'audit_middleware_error', 'Failed to record audit event', error, {
                eventType,
                resource,
                userId: context.userId
            });
            next(); // Continue processing even if audit fails
        }
    };
}
exports.auditOperationMiddleware = auditOperationMiddleware;
/**
 * Middleware for compliance-sensitive operations
 */
function complianceAuditMiddleware(complianceRule, regulatoryFramework) {
    return async (req, res, next) => {
        const context = req.auditContext;
        if (!context?.userId || !context?.organizationId) {
            return next();
        }
        try {
            // Record compliance audit
            await audit_service_1.auditService.recordComplianceAudit({
                complianceRule,
                regulatoryFramework,
                checkResult: 'compliant',
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
        }
        catch (error) {
            logger_1.logger.error('API', 'compliance_audit_error', 'Failed to record compliance audit', error, {
                complianceRule,
                regulatoryFramework,
                userId: context.userId
            });
            next();
        }
    };
}
exports.complianceAuditMiddleware = complianceAuditMiddleware;
/**
 * Error handling middleware with audit logging
 */
function auditErrorMiddleware(error, req, res, next) {
    const context = req.auditContext;
    // Log the error
    logger_1.logger.error('API', 'unhandled_error', error.message, error, {
        path: req.path,
        method: req.method,
        statusCode: res.statusCode
    }, context);
    // Record security-relevant errors as audit events
    if (isSecurityRelevantError(error)) {
        audit_service_1.auditService.recordAuditEvent({
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
            logger_1.logger.error('API', 'audit_error_logging_failed', 'Failed to log security error to audit', auditError);
        });
    }
    next(error);
}
exports.auditErrorMiddleware = auditErrorMiddleware;
/**
 * Middleware to log data access events
 */
function dataAccessAuditMiddleware(dataType, sensitivity = 'medium') {
    return auditOperationMiddleware('data_access', `${dataType}_data`, sensitivity === 'critical' ? 'restricted' :
        sensitivity === 'high' ? 'confidential' :
            sensitivity === 'medium' ? 'internal' : 'public');
}
exports.dataAccessAuditMiddleware = dataAccessAuditMiddleware;
/**
 * Middleware to log investment idea generation events
 */
function investmentIdeaAuditMiddleware() {
    return auditOperationMiddleware('investment_idea_generation', 'investment_ideas', 'confidential');
}
exports.investmentIdeaAuditMiddleware = investmentIdeaAuditMiddleware;
// Helper functions
function sanitizeRequestBody(body) {
    if (!body)
        return body;
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
function determineRiskLevel(eventType, resource) {
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
async function updateAuditOutcome(requestId, outcome, metadata) {
    try {
        // In a real implementation, you would update the audit record in the database
        // For now, we'll just log the outcome
        await logger_1.logger.info('API', 'audit_outcome', `Request ${requestId} completed with outcome: ${outcome}`, {
            requestId,
            outcome,
            ...metadata
        });
    }
    catch (error) {
        logger_1.logger.error('API', 'audit_outcome_update_failed', 'Failed to update audit outcome', error, {
            requestId,
            outcome
        });
    }
}
function isSecurityRelevantError(error) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXVkaXQtbG9nZ2luZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hcGkvbWlkZGxld2FyZS9hdWRpdC1sb2dnaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDBEQUF1RDtBQUN2RCx3RUFBb0Y7QUFpQnBGOztHQUVHO0FBQ0gsU0FBZ0Isc0JBQXNCLENBQUMsR0FBcUIsRUFBRSxHQUFhLEVBQUUsSUFBa0I7SUFDN0YsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQVcsSUFBSSxPQUFPLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUUxSCxHQUFHLENBQUMsWUFBWSxHQUFHO1FBQ2pCLE1BQU0sRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBVztRQUMxQyxRQUFRLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQVc7UUFDOUMsY0FBYyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQVc7UUFDMUQsU0FBUyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFXO1FBQ2hELFNBQVM7UUFDVCxTQUFTLEVBQUUsR0FBRyxDQUFDLEVBQUUsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLGFBQWE7UUFDakQsU0FBUyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDO0tBQ3JDLENBQUM7SUFFRixHQUFHLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUUzQixxQ0FBcUM7SUFDckMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFFekMsSUFBSSxFQUFFLENBQUM7QUFDVCxDQUFDO0FBbkJELHdEQW1C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QixHQUFHO1FBQ3ZCLGNBQWM7UUFDZCxXQUFXO1FBQ1gsZ0JBQWdCO1FBQ2hCLGVBQWU7UUFDZixPQUFPO1FBQ1AsWUFBWTtRQUNaLGVBQWU7UUFDZixxQkFBcUI7S0FDdEIsQ0FBQztJQUVGLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDakQsT0FBTyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDMUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFJlcXVlc3QsIFJlc3BvbnNlLCBOZXh0RnVuY3Rpb24gfSBmcm9tICdleHByZXNzJztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL2xvZ2dpbmcvbG9nZ2VyJztcbmltcG9ydCB7IGF1ZGl0U2VydmljZSwgQXVkaXRFdmVudFR5cGUgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9sb2dnaW5nL2F1ZGl0LXNlcnZpY2UnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEF1ZGl0Q29udGV4dCB7XG4gIHVzZXJJZD86IHN0cmluZztcbiAgdXNlclJvbGU/OiBzdHJpbmc7XG4gIG9yZ2FuaXphdGlvbklkPzogc3RyaW5nO1xuICBzZXNzaW9uSWQ/OiBzdHJpbmc7XG4gIHJlcXVlc3RJZD86IHN0cmluZztcbiAgaXBBZGRyZXNzPzogc3RyaW5nO1xuICB1c2VyQWdlbnQ/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXVkaXRhYmxlUmVxdWVzdCBleHRlbmRzIFJlcXVlc3Qge1xuICBhdWRpdENvbnRleHQ/OiBBdWRpdENvbnRleHQ7XG4gIHN0YXJ0VGltZT86IG51bWJlcjtcbn1cblxuLyoqXG4gKiBNaWRkbGV3YXJlIHRvIGV4dHJhY3QgYXVkaXQgY29udGV4dCBmcm9tIHJlcXVlc3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGF1ZGl0Q29udGV4dE1pZGRsZXdhcmUocmVxOiBBdWRpdGFibGVSZXF1ZXN0LCByZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pOiB2b2lkIHtcbiAgY29uc3QgcmVxdWVzdElkID0gcmVxLmhlYWRlcnNbJ3gtcmVxdWVzdC1pZCddIGFzIHN0cmluZyB8fCBgcmVxXyR7RGF0ZS5ub3coKX1fJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHIoMiwgOSl9YDtcbiAgXG4gIHJlcS5hdWRpdENvbnRleHQgPSB7XG4gICAgdXNlcklkOiByZXEuaGVhZGVyc1sneC11c2VyLWlkJ10gYXMgc3RyaW5nLFxuICAgIHVzZXJSb2xlOiByZXEuaGVhZGVyc1sneC11c2VyLXJvbGUnXSBhcyBzdHJpbmcsXG4gICAgb3JnYW5pemF0aW9uSWQ6IHJlcS5oZWFkZXJzWyd4LW9yZ2FuaXphdGlvbi1pZCddIGFzIHN0cmluZyxcbiAgICBzZXNzaW9uSWQ6IHJlcS5oZWFkZXJzWyd4LXNlc3Npb24taWQnXSBhcyBzdHJpbmcsXG4gICAgcmVxdWVzdElkLFxuICAgIGlwQWRkcmVzczogcmVxLmlwIHx8IHJlcS5jb25uZWN0aW9uLnJlbW90ZUFkZHJlc3MsXG4gICAgdXNlckFnZW50OiByZXEuaGVhZGVyc1sndXNlci1hZ2VudCddXG4gIH07XG5cbiAgcmVxLnN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cbiAgLy8gQWRkIHJlcXVlc3QgSUQgdG8gcmVzcG9uc2UgaGVhZGVyc1xuICByZXMuc2V0SGVhZGVyKCd4LXJlcXVlc3QtaWQnLCByZXF1ZXN0SWQpO1xuXG4gIG5leHQoKTtcbn1cblxuLyoqXG4gKiBNaWRkbGV3YXJlIHRvIGxvZyBBUEkgcmVxdWVzdHMgYW5kIHJlc3BvbnNlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVxdWVzdExvZ2dpbmdNaWRkbGV3YXJlKHJlcTogQXVkaXRhYmxlUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKTogdm9pZCB7XG4gIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cbiAgLy8gTG9nIGluY29taW5nIHJlcXVlc3RcbiAgbG9nZ2VyLmluZm8oJ0FQSScsICdyZXF1ZXN0JywgYCR7cmVxLm1ldGhvZH0gJHtyZXEucGF0aH1gLCB7XG4gICAgbWV0aG9kOiByZXEubWV0aG9kLFxuICAgIHBhdGg6IHJlcS5wYXRoLFxuICAgIHF1ZXJ5OiByZXEucXVlcnksXG4gICAgaGVhZGVyczoge1xuICAgICAgJ2NvbnRlbnQtdHlwZSc6IHJlcS5oZWFkZXJzWydjb250ZW50LXR5cGUnXSxcbiAgICAgICd1c2VyLWFnZW50JzogcmVxLmhlYWRlcnNbJ3VzZXItYWdlbnQnXSxcbiAgICAgICdhdXRob3JpemF0aW9uJzogcmVxLmhlYWRlcnMuYXV0aG9yaXphdGlvbiA/ICdbUkVEQUNURURdJyA6IHVuZGVmaW5lZFxuICAgIH0sXG4gICAgYm9keTogcmVxLm1ldGhvZCAhPT0gJ0dFVCcgPyBzYW5pdGl6ZVJlcXVlc3RCb2R5KHJlcS5ib2R5KSA6IHVuZGVmaW5lZFxuICB9LCByZXEuYXVkaXRDb250ZXh0KTtcblxuICAvLyBPdmVycmlkZSByZXMuanNvbiB0byBsb2cgcmVzcG9uc2VcbiAgY29uc3Qgb3JpZ2luYWxKc29uID0gcmVzLmpzb247XG4gIHJlcy5qc29uID0gZnVuY3Rpb24oYm9keTogYW55KSB7XG4gICAgY29uc3QgcmVzcG9uc2VUaW1lID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICBcbiAgICAvLyBMb2cgcmVzcG9uc2VcbiAgICBsb2dnZXIuaW5mbygnQVBJJywgJ3Jlc3BvbnNlJywgYCR7cmVxLm1ldGhvZH0gJHtyZXEucGF0aH0gLSAke3Jlcy5zdGF0dXNDb2RlfWAsIHtcbiAgICAgIHN0YXR1c0NvZGU6IHJlcy5zdGF0dXNDb2RlLFxuICAgICAgcmVzcG9uc2VUaW1lLFxuICAgICAgcmVzcG9uc2VTaXplOiBKU09OLnN0cmluZ2lmeShib2R5KS5sZW5ndGhcbiAgICB9LCByZXEuYXVkaXRDb250ZXh0KTtcblxuICAgIHJldHVybiBvcmlnaW5hbEpzb24uY2FsbCh0aGlzLCBib2R5KTtcbiAgfTtcblxuICAvLyBPdmVycmlkZSByZXMuc3RhdHVzIHRvIGNhcHR1cmUgZXJyb3IgcmVzcG9uc2VzXG4gIGNvbnN0IG9yaWdpbmFsU3RhdHVzID0gcmVzLnN0YXR1cztcbiAgcmVzLnN0YXR1cyA9IGZ1bmN0aW9uKGNvZGU6IG51bWJlcikge1xuICAgIGlmIChjb2RlID49IDQwMCkge1xuICAgICAgY29uc3QgcmVzcG9uc2VUaW1lID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICAgIGxvZ2dlci53YXJuKCdBUEknLCAnZXJyb3JfcmVzcG9uc2UnLCBgJHtyZXEubWV0aG9kfSAke3JlcS5wYXRofSAtICR7Y29kZX1gLCB7XG4gICAgICAgIHN0YXR1c0NvZGU6IGNvZGUsXG4gICAgICAgIHJlc3BvbnNlVGltZVxuICAgICAgfSwgcmVxLmF1ZGl0Q29udGV4dCk7XG4gICAgfVxuICAgIHJldHVybiBvcmlnaW5hbFN0YXR1cy5jYWxsKHRoaXMsIGNvZGUpO1xuICB9O1xuXG4gIG5leHQoKTtcbn1cblxuLyoqXG4gKiBNaWRkbGV3YXJlIHRvIGF1ZGl0IHNwZWNpZmljIEFQSSBvcGVyYXRpb25zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdWRpdE9wZXJhdGlvbk1pZGRsZXdhcmUoXG4gIGV2ZW50VHlwZTogQXVkaXRFdmVudFR5cGUsXG4gIHJlc291cmNlOiBzdHJpbmcsXG4gIGRhdGFDbGFzc2lmaWNhdGlvbjogJ3B1YmxpYycgfCAnaW50ZXJuYWwnIHwgJ2NvbmZpZGVudGlhbCcgfCAncmVzdHJpY3RlZCcgPSAnaW50ZXJuYWwnXG4pIHtcbiAgcmV0dXJuIGFzeW5jIChyZXE6IEF1ZGl0YWJsZVJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbik6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIGNvbnN0IGNvbnRleHQgPSByZXEuYXVkaXRDb250ZXh0O1xuICAgIFxuICAgIGlmICghY29udGV4dD8udXNlcklkIHx8ICFjb250ZXh0Py5vcmdhbml6YXRpb25JZCkge1xuICAgICAgbG9nZ2VyLndhcm4oJ0FQSScsICdhdWRpdF9taXNzaW5nX2NvbnRleHQnLCAnQXVkaXQgY29udGV4dCBtaXNzaW5nIGZvciBvcGVyYXRpb24nLCB7XG4gICAgICAgIGV2ZW50VHlwZSxcbiAgICAgICAgcmVzb3VyY2UsXG4gICAgICAgIHBhdGg6IHJlcS5wYXRoXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIC8vIFJlY29yZCB0aGUgYXVkaXQgZXZlbnRcbiAgICAgIGF3YWl0IGF1ZGl0U2VydmljZS5yZWNvcmRBdWRpdEV2ZW50KHtcbiAgICAgICAgdXNlcklkOiBjb250ZXh0LnVzZXJJZCxcbiAgICAgICAgdXNlclJvbGU6IGNvbnRleHQudXNlclJvbGUgfHwgJ3Vua25vd24nLFxuICAgICAgICBvcmdhbml6YXRpb25JZDogY29udGV4dC5vcmdhbml6YXRpb25JZCxcbiAgICAgICAgZXZlbnRUeXBlLFxuICAgICAgICByZXNvdXJjZSxcbiAgICAgICAgYWN0aW9uOiBgJHtyZXEubWV0aG9kfSAke3JlcS5wYXRofWAsXG4gICAgICAgIG91dGNvbWU6ICdzdWNjZXNzJywgLy8gV2lsbCBiZSB1cGRhdGVkIGlmIHRoZXJlJ3MgYW4gZXJyb3JcbiAgICAgICAgZGV0YWlsczoge1xuICAgICAgICAgIG1ldGhvZDogcmVxLm1ldGhvZCxcbiAgICAgICAgICBwYXRoOiByZXEucGF0aCxcbiAgICAgICAgICBxdWVyeTogcmVxLnF1ZXJ5LFxuICAgICAgICAgIHJlcXVlc3RJZDogY29udGV4dC5yZXF1ZXN0SWQsXG4gICAgICAgICAgc2Vzc2lvbklkOiBjb250ZXh0LnNlc3Npb25JZFxuICAgICAgICB9LFxuICAgICAgICBpcEFkZHJlc3M6IGNvbnRleHQuaXBBZGRyZXNzLFxuICAgICAgICB1c2VyQWdlbnQ6IGNvbnRleHQudXNlckFnZW50LFxuICAgICAgICBzZXNzaW9uSWQ6IGNvbnRleHQuc2Vzc2lvbklkLFxuICAgICAgICByZXF1ZXN0SWQ6IGNvbnRleHQucmVxdWVzdElkLFxuICAgICAgICByaXNrTGV2ZWw6IGRldGVybWluZVJpc2tMZXZlbChldmVudFR5cGUsIHJlc291cmNlKSxcbiAgICAgICAgZGF0YUNsYXNzaWZpY2F0aW9uXG4gICAgICB9KTtcblxuICAgICAgLy8gT3ZlcnJpZGUgcmVzcG9uc2UgbWV0aG9kcyB0byB1cGRhdGUgYXVkaXQgb3V0Y29tZVxuICAgICAgY29uc3Qgb3JpZ2luYWxKc29uID0gcmVzLmpzb247XG4gICAgICBjb25zdCBvcmlnaW5hbFN0YXR1cyA9IHJlcy5zdGF0dXM7XG4gICAgICBsZXQgc3RhdHVzQ29kZSA9IDIwMDtcblxuICAgICAgcmVzLnN0YXR1cyA9IGZ1bmN0aW9uKGNvZGU6IG51bWJlcikge1xuICAgICAgICBzdGF0dXNDb2RlID0gY29kZTtcbiAgICAgICAgcmV0dXJuIG9yaWdpbmFsU3RhdHVzLmNhbGwodGhpcywgY29kZSk7XG4gICAgICB9O1xuXG4gICAgICByZXMuanNvbiA9IGZ1bmN0aW9uKGJvZHk6IGFueSkge1xuICAgICAgICAvLyBVcGRhdGUgYXVkaXQgZXZlbnQgd2l0aCBmaW5hbCBvdXRjb21lXG4gICAgICAgIHVwZGF0ZUF1ZGl0T3V0Y29tZShjb250ZXh0LnJlcXVlc3RJZCEsIHN0YXR1c0NvZGUgPj0gNDAwID8gJ2ZhaWx1cmUnIDogJ3N1Y2Nlc3MnLCB7XG4gICAgICAgICAgc3RhdHVzQ29kZSxcbiAgICAgICAgICByZXNwb25zZVRpbWU6IERhdGUubm93KCkgLSAocmVxLnN0YXJ0VGltZSB8fCBEYXRlLm5vdygpKVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gb3JpZ2luYWxKc29uLmNhbGwodGhpcywgYm9keSk7XG4gICAgICB9O1xuXG4gICAgICBuZXh0KCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGxvZ2dlci5lcnJvcignQVBJJywgJ2F1ZGl0X21pZGRsZXdhcmVfZXJyb3InLCAnRmFpbGVkIHRvIHJlY29yZCBhdWRpdCBldmVudCcsIGVycm9yIGFzIEVycm9yLCB7XG4gICAgICAgIGV2ZW50VHlwZSxcbiAgICAgICAgcmVzb3VyY2UsXG4gICAgICAgIHVzZXJJZDogY29udGV4dC51c2VySWRcbiAgICAgIH0pO1xuICAgICAgbmV4dCgpOyAvLyBDb250aW51ZSBwcm9jZXNzaW5nIGV2ZW4gaWYgYXVkaXQgZmFpbHNcbiAgICB9XG4gIH07XG59XG5cbi8qKlxuICogTWlkZGxld2FyZSBmb3IgY29tcGxpYW5jZS1zZW5zaXRpdmUgb3BlcmF0aW9uc1xuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGxpYW5jZUF1ZGl0TWlkZGxld2FyZShcbiAgY29tcGxpYW5jZVJ1bGU6IHN0cmluZyxcbiAgcmVndWxhdG9yeUZyYW1ld29yazogc3RyaW5nXG4pIHtcbiAgcmV0dXJuIGFzeW5jIChyZXE6IEF1ZGl0YWJsZVJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbik6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIGNvbnN0IGNvbnRleHQgPSByZXEuYXVkaXRDb250ZXh0O1xuICAgIFxuICAgIGlmICghY29udGV4dD8udXNlcklkIHx8ICFjb250ZXh0Py5vcmdhbml6YXRpb25JZCkge1xuICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgLy8gUmVjb3JkIGNvbXBsaWFuY2UgYXVkaXRcbiAgICAgIGF3YWl0IGF1ZGl0U2VydmljZS5yZWNvcmRDb21wbGlhbmNlQXVkaXQoe1xuICAgICAgICBjb21wbGlhbmNlUnVsZSxcbiAgICAgICAgcmVndWxhdG9yeUZyYW1ld29yayxcbiAgICAgICAgY2hlY2tSZXN1bHQ6ICdjb21wbGlhbnQnLCAvLyBXaWxsIGJlIHVwZGF0ZWQgYmFzZWQgb24gb3BlcmF0aW9uIHJlc3VsdFxuICAgICAgICBkZXRhaWxzOiB7XG4gICAgICAgICAgcnVsZU5hbWU6IGNvbXBsaWFuY2VSdWxlLFxuICAgICAgICAgIHJ1bGVWZXJzaW9uOiAnMS4wJyxcbiAgICAgICAgICBjaGVja0NyaXRlcmlhOiBbYEFQSSBvcGVyYXRpb246ICR7cmVxLm1ldGhvZH0gJHtyZXEucGF0aH1gXSxcbiAgICAgICAgICBmaW5kaW5nczogW11cbiAgICAgICAgfSxcbiAgICAgICAgYWZmZWN0ZWRSZXNvdXJjZXM6IFtyZXEucGF0aF0sXG4gICAgICAgIHVzZXJJZDogY29udGV4dC51c2VySWQsXG4gICAgICAgIG9yZ2FuaXphdGlvbklkOiBjb250ZXh0Lm9yZ2FuaXphdGlvbklkXG4gICAgICB9KTtcblxuICAgICAgbmV4dCgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBsb2dnZXIuZXJyb3IoJ0FQSScsICdjb21wbGlhbmNlX2F1ZGl0X2Vycm9yJywgJ0ZhaWxlZCB0byByZWNvcmQgY29tcGxpYW5jZSBhdWRpdCcsIGVycm9yIGFzIEVycm9yLCB7XG4gICAgICAgIGNvbXBsaWFuY2VSdWxlLFxuICAgICAgICByZWd1bGF0b3J5RnJhbWV3b3JrLFxuICAgICAgICB1c2VySWQ6IGNvbnRleHQudXNlcklkXG4gICAgICB9KTtcbiAgICAgIG5leHQoKTtcbiAgICB9XG4gIH07XG59XG5cbi8qKlxuICogRXJyb3IgaGFuZGxpbmcgbWlkZGxld2FyZSB3aXRoIGF1ZGl0IGxvZ2dpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGF1ZGl0RXJyb3JNaWRkbGV3YXJlKGVycm9yOiBFcnJvciwgcmVxOiBBdWRpdGFibGVSZXF1ZXN0LCByZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pOiB2b2lkIHtcbiAgY29uc3QgY29udGV4dCA9IHJlcS5hdWRpdENvbnRleHQ7XG4gIFxuICAvLyBMb2cgdGhlIGVycm9yXG4gIGxvZ2dlci5lcnJvcignQVBJJywgJ3VuaGFuZGxlZF9lcnJvcicsIGVycm9yLm1lc3NhZ2UsIGVycm9yLCB7XG4gICAgcGF0aDogcmVxLnBhdGgsXG4gICAgbWV0aG9kOiByZXEubWV0aG9kLFxuICAgIHN0YXR1c0NvZGU6IHJlcy5zdGF0dXNDb2RlXG4gIH0sIGNvbnRleHQpO1xuXG4gIC8vIFJlY29yZCBzZWN1cml0eS1yZWxldmFudCBlcnJvcnMgYXMgYXVkaXQgZXZlbnRzXG4gIGlmIChpc1NlY3VyaXR5UmVsZXZhbnRFcnJvcihlcnJvcikpIHtcbiAgICBhdWRpdFNlcnZpY2UucmVjb3JkQXVkaXRFdmVudCh7XG4gICAgICB1c2VySWQ6IGNvbnRleHQ/LnVzZXJJZCB8fCAnYW5vbnltb3VzJyxcbiAgICAgIHVzZXJSb2xlOiBjb250ZXh0Py51c2VyUm9sZSB8fCAndW5rbm93bicsXG4gICAgICBvcmdhbml6YXRpb25JZDogY29udGV4dD8ub3JnYW5pemF0aW9uSWQgfHwgJ3Vua25vd24nLFxuICAgICAgZXZlbnRUeXBlOiAnc2VjdXJpdHlfZXZlbnQnLFxuICAgICAgcmVzb3VyY2U6IHJlcS5wYXRoLFxuICAgICAgYWN0aW9uOiBgJHtyZXEubWV0aG9kfSAke3JlcS5wYXRofWAsXG4gICAgICBvdXRjb21lOiAnZmFpbHVyZScsXG4gICAgICBkZXRhaWxzOiB7XG4gICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgbmFtZTogZXJyb3IubmFtZSxcbiAgICAgICAgICBtZXNzYWdlOiBlcnJvci5tZXNzYWdlLFxuICAgICAgICAgIHN0YWNrOiBlcnJvci5zdGFja1xuICAgICAgICB9LFxuICAgICAgICByZXF1ZXN0SWQ6IGNvbnRleHQ/LnJlcXVlc3RJZCxcbiAgICAgICAgc2Vzc2lvbklkOiBjb250ZXh0Py5zZXNzaW9uSWRcbiAgICAgIH0sXG4gICAgICBpcEFkZHJlc3M6IGNvbnRleHQ/LmlwQWRkcmVzcyxcbiAgICAgIHVzZXJBZ2VudDogY29udGV4dD8udXNlckFnZW50LFxuICAgICAgc2Vzc2lvbklkOiBjb250ZXh0Py5zZXNzaW9uSWQsXG4gICAgICByZXF1ZXN0SWQ6IGNvbnRleHQ/LnJlcXVlc3RJZCxcbiAgICAgIHJpc2tMZXZlbDogJ2hpZ2gnLFxuICAgICAgZGF0YUNsYXNzaWZpY2F0aW9uOiAnaW50ZXJuYWwnXG4gICAgfSkuY2F0Y2goYXVkaXRFcnJvciA9PiB7XG4gICAgICBsb2dnZXIuZXJyb3IoJ0FQSScsICdhdWRpdF9lcnJvcl9sb2dnaW5nX2ZhaWxlZCcsICdGYWlsZWQgdG8gbG9nIHNlY3VyaXR5IGVycm9yIHRvIGF1ZGl0JywgYXVkaXRFcnJvcik7XG4gICAgfSk7XG4gIH1cblxuICBuZXh0KGVycm9yKTtcbn1cblxuLyoqXG4gKiBNaWRkbGV3YXJlIHRvIGxvZyBkYXRhIGFjY2VzcyBldmVudHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRhdGFBY2Nlc3NBdWRpdE1pZGRsZXdhcmUoXG4gIGRhdGFUeXBlOiBzdHJpbmcsXG4gIHNlbnNpdGl2aXR5OiAnbG93JyB8ICdtZWRpdW0nIHwgJ2hpZ2gnIHwgJ2NyaXRpY2FsJyA9ICdtZWRpdW0nXG4pIHtcbiAgcmV0dXJuIGF1ZGl0T3BlcmF0aW9uTWlkZGxld2FyZShcbiAgICAnZGF0YV9hY2Nlc3MnLFxuICAgIGAke2RhdGFUeXBlfV9kYXRhYCxcbiAgICBzZW5zaXRpdml0eSA9PT0gJ2NyaXRpY2FsJyA/ICdyZXN0cmljdGVkJyA6IFxuICAgIHNlbnNpdGl2aXR5ID09PSAnaGlnaCcgPyAnY29uZmlkZW50aWFsJyA6IFxuICAgIHNlbnNpdGl2aXR5ID09PSAnbWVkaXVtJyA/ICdpbnRlcm5hbCcgOiAncHVibGljJ1xuICApO1xufVxuXG4vKipcbiAqIE1pZGRsZXdhcmUgdG8gbG9nIGludmVzdG1lbnQgaWRlYSBnZW5lcmF0aW9uIGV2ZW50c1xuICovXG5leHBvcnQgZnVuY3Rpb24gaW52ZXN0bWVudElkZWFBdWRpdE1pZGRsZXdhcmUoKSB7XG4gIHJldHVybiBhdWRpdE9wZXJhdGlvbk1pZGRsZXdhcmUoXG4gICAgJ2ludmVzdG1lbnRfaWRlYV9nZW5lcmF0aW9uJyxcbiAgICAnaW52ZXN0bWVudF9pZGVhcycsXG4gICAgJ2NvbmZpZGVudGlhbCdcbiAgKTtcbn1cblxuLy8gSGVscGVyIGZ1bmN0aW9uc1xuXG5mdW5jdGlvbiBzYW5pdGl6ZVJlcXVlc3RCb2R5KGJvZHk6IGFueSk6IGFueSB7XG4gIGlmICghYm9keSkgcmV0dXJuIGJvZHk7XG4gIFxuICBjb25zdCBzYW5pdGl6ZWQgPSB7IC4uLmJvZHkgfTtcbiAgXG4gIC8vIFJlbW92ZSBzZW5zaXRpdmUgZmllbGRzXG4gIGNvbnN0IHNlbnNpdGl2ZUZpZWxkcyA9IFsncGFzc3dvcmQnLCAndG9rZW4nLCAnc2VjcmV0JywgJ2tleScsICdhdXRob3JpemF0aW9uJ107XG4gIHNlbnNpdGl2ZUZpZWxkcy5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICBpZiAoc2FuaXRpemVkW2ZpZWxkXSkge1xuICAgICAgc2FuaXRpemVkW2ZpZWxkXSA9ICdbUkVEQUNURURdJztcbiAgICB9XG4gIH0pO1xuICBcbiAgcmV0dXJuIHNhbml0aXplZDtcbn1cblxuZnVuY3Rpb24gZGV0ZXJtaW5lUmlza0xldmVsKGV2ZW50VHlwZTogQXVkaXRFdmVudFR5cGUsIHJlc291cmNlOiBzdHJpbmcpOiAnbG93JyB8ICdtZWRpdW0nIHwgJ2hpZ2gnIHwgJ2NyaXRpY2FsJyB7XG4gIC8vIEhpZ2gtcmlzayBvcGVyYXRpb25zXG4gIGlmIChldmVudFR5cGUgPT09ICdkYXRhX2V4cG9ydCcgfHwgZXZlbnRUeXBlID09PSAnY29uZmlndXJhdGlvbl9jaGFuZ2UnKSB7XG4gICAgcmV0dXJuICdoaWdoJztcbiAgfVxuICBcbiAgLy8gTWVkaXVtLXJpc2sgb3BlcmF0aW9uc1xuICBpZiAoZXZlbnRUeXBlID09PSAnaW52ZXN0bWVudF9pZGVhX2dlbmVyYXRpb24nIHx8IGV2ZW50VHlwZSA9PT0gJ2RhdGFfbW9kaWZpY2F0aW9uJykge1xuICAgIHJldHVybiAnbWVkaXVtJztcbiAgfVxuICBcbiAgLy8gQ3JpdGljYWwgb3BlcmF0aW9uc1xuICBpZiAoZXZlbnRUeXBlID09PSAnc2VjdXJpdHlfZXZlbnQnIHx8IHJlc291cmNlLmluY2x1ZGVzKCdhZG1pbicpKSB7XG4gICAgcmV0dXJuICdjcml0aWNhbCc7XG4gIH1cbiAgXG4gIHJldHVybiAnbG93Jztcbn1cblxuYXN5bmMgZnVuY3Rpb24gdXBkYXRlQXVkaXRPdXRjb21lKHJlcXVlc3RJZDogc3RyaW5nLCBvdXRjb21lOiAnc3VjY2VzcycgfCAnZmFpbHVyZScsIG1ldGFkYXRhOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogUHJvbWlzZTx2b2lkPiB7XG4gIHRyeSB7XG4gICAgLy8gSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB5b3Ugd291bGQgdXBkYXRlIHRoZSBhdWRpdCByZWNvcmQgaW4gdGhlIGRhdGFiYXNlXG4gICAgLy8gRm9yIG5vdywgd2UnbGwganVzdCBsb2cgdGhlIG91dGNvbWVcbiAgICBhd2FpdCBsb2dnZXIuaW5mbygnQVBJJywgJ2F1ZGl0X291dGNvbWUnLCBgUmVxdWVzdCAke3JlcXVlc3RJZH0gY29tcGxldGVkIHdpdGggb3V0Y29tZTogJHtvdXRjb21lfWAsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIG91dGNvbWUsXG4gICAgICAuLi5tZXRhZGF0YVxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGxvZ2dlci5lcnJvcignQVBJJywgJ2F1ZGl0X291dGNvbWVfdXBkYXRlX2ZhaWxlZCcsICdGYWlsZWQgdG8gdXBkYXRlIGF1ZGl0IG91dGNvbWUnLCBlcnJvciBhcyBFcnJvciwge1xuICAgICAgcmVxdWVzdElkLFxuICAgICAgb3V0Y29tZVxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzU2VjdXJpdHlSZWxldmFudEVycm9yKGVycm9yOiBFcnJvcik6IGJvb2xlYW4ge1xuICBjb25zdCBzZWN1cml0eUtleXdvcmRzID0gW1xuICAgICd1bmF1dGhvcml6ZWQnLFxuICAgICdmb3JiaWRkZW4nLFxuICAgICdhdXRoZW50aWNhdGlvbicsXG4gICAgJ2F1dGhvcml6YXRpb24nLFxuICAgICd0b2tlbicsXG4gICAgJ3Blcm1pc3Npb24nLFxuICAgICdhY2Nlc3MgZGVuaWVkJyxcbiAgICAnaW52YWxpZCBjcmVkZW50aWFscydcbiAgXTtcbiAgXG4gIGNvbnN0IGVycm9yTWVzc2FnZSA9IGVycm9yLm1lc3NhZ2UudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIHNlY3VyaXR5S2V5d29yZHMuc29tZShrZXl3b3JkID0+IGVycm9yTWVzc2FnZS5pbmNsdWRlcyhrZXl3b3JkKSk7XG59Il19