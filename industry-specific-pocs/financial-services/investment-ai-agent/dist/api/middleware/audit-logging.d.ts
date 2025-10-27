import { Request, Response, NextFunction } from 'express';
import { AuditEventType } from '../../services/logging/audit-service';
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
export declare function auditContextMiddleware(req: AuditableRequest, res: Response, next: NextFunction): void;
/**
 * Middleware to log API requests and responses
 */
export declare function requestLoggingMiddleware(req: AuditableRequest, res: Response, next: NextFunction): void;
/**
 * Middleware to audit specific API operations
 */
export declare function auditOperationMiddleware(eventType: AuditEventType, resource: string, dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted'): (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware for compliance-sensitive operations
 */
export declare function complianceAuditMiddleware(complianceRule: string, regulatoryFramework: string): (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Error handling middleware with audit logging
 */
export declare function auditErrorMiddleware(error: Error, req: AuditableRequest, res: Response, next: NextFunction): void;
/**
 * Middleware to log data access events
 */
export declare function dataAccessAuditMiddleware(dataType: string, sensitivity?: 'low' | 'medium' | 'high' | 'critical'): (req: AuditableRequest, res: Response<any, Record<string, any>>, next: NextFunction) => Promise<void>;
/**
 * Middleware to log investment idea generation events
 */
export declare function investmentIdeaAuditMiddleware(): (req: AuditableRequest, res: Response<any, Record<string, any>>, next: NextFunction) => Promise<void>;
