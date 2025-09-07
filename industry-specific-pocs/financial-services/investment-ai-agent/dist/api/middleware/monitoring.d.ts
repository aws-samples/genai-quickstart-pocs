import { Request, Response, NextFunction } from 'express';
export interface MonitoringRequest extends Request {
    startTime?: number;
    userId?: string;
    organizationId?: string;
}
/**
 * Middleware to track API performance metrics
 */
export declare const performanceMonitoring: (req: MonitoringRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware to extract user context for monitoring
 */
export declare const userContextMiddleware: (req: MonitoringRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware to track specific business metrics
 */
export declare const businessMetricsMiddleware: (req: MonitoringRequest, res: Response, next: NextFunction) => void;
/**
 * Error tracking middleware
 */
export declare const errorTrackingMiddleware: (error: Error, req: MonitoringRequest, res: Response, next: NextFunction) => void;
/**
 * Health check endpoint with monitoring
 */
export declare const healthCheckHandler: (req: Request, res: Response) => Promise<void>;
