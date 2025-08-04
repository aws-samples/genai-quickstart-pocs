/**
 * Authentication middleware
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Extend Express Request type to include user
 */
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                organizationId: string;
                role: string;
                permissions: string[];
            };
        }
    }
}
/**
 * Middleware to authenticate users
 * @param req The request object
 * @param res The response object
 * @param next The next function
 */
export declare const authenticateUser: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if user has required permissions
 * @param permissions The permissions required
 * @returns Middleware function
 */
export declare const checkPermissions: (permissions: string[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if user has required role
 * @param roles The roles required
 * @returns Middleware function
 */
export declare const checkRole: (roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
