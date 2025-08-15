import { Request, Response, NextFunction } from 'express';
/**
 * Error response interface
 */
export interface ErrorResponse {
    code: string;
    message: string;
    details?: any;
    timestamp: Date;
    requestId: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    suggestedAction?: string;
}
/**
 * Custom error class for API errors
 */
export declare class ApiError extends Error {
    code: string;
    statusCode: number;
    details?: any;
    severity: 'info' | 'warning' | 'error' | 'critical';
    suggestedAction?: string | undefined;
    constructor(code: string, message: string, statusCode?: number, details?: any, severity?: 'info' | 'warning' | 'error' | 'critical', suggestedAction?: string | undefined);
}
/**
 * Global error handling middleware
 */
export declare const errorHandlerMiddleware: (err: Error | ApiError, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
