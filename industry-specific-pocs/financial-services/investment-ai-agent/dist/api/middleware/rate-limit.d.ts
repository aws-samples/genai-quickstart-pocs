/**
 * Rate Limiting Middleware
 * Simple in-memory rate limiting for API endpoints
 */
import { Request, Response, NextFunction } from 'express';
interface RateLimitOptions {
    windowMs: number;
    max: number;
    message?: string;
    statusCode?: number;
}
/**
 * Create rate limiting middleware
 */
export declare function rateLimitMiddleware(options: RateLimitOptions): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Get current rate limit status for a key
 */
export declare function getRateLimitStatus(ip: string, userId?: string): {
    count: number;
    resetTime: number;
    remaining: number;
} | null;
/**
 * Clear rate limit for a specific key (admin function)
 */
export declare function clearRateLimit(ip: string, userId?: string): boolean;
/**
 * Get rate limit statistics
 */
export declare function getRateLimitStats(): {
    totalEntries: number;
    activeEntries: number;
    expiredEntries: number;
};
export {};
