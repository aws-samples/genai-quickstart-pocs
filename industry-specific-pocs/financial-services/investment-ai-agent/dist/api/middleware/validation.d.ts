import { Request, Response, NextFunction } from 'express';
/**
 * Middleware for validating request bodies against schemas
 */
export declare const requestValidationMiddleware: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * Validate web search request
 */
export declare const validateWebSearchRequest: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate deep research request
 */
export declare const validateDeepResearchRequest: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Simple validation middleware for basic request validation
 */
export declare const validateRequest: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Advanced validation middleware factory
 * Creates a validation middleware based on a schema definition
 */
export declare const validationMiddleware: (schema: {
    body?: Record<string, any>;
    params?: Record<string, any>;
    query?: Record<string, any>;
}) => (req: Request, res: Response, next: NextFunction) => void;
