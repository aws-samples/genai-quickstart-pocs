/**
 * Rate Limiting Middleware
 * Simple in-memory rate limiting for API endpoints
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  message?: string;
  statusCode?: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Create rate limiting middleware
 */
export function rateLimitMiddleware(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later',
    statusCode = 429
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Generate key based on IP and user ID (if available)
    const key = `${req.ip}:${req.user?.userId || 'anonymous'}`;
    const now = Date.now();
    
    // Clean up expired entries periodically
    if (Math.random() < 0.01) { // 1% chance to trigger cleanup
      cleanupExpiredEntries(now);
    }

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      entry = {
        count: 1,
        resetTime: now + windowMs
      };
      rateLimitStore.set(key, entry);
    } else {
      // Increment existing entry
      entry.count++;
    }

    // Check if limit exceeded
    if (entry.count > max) {
      const resetTimeSeconds = Math.ceil((entry.resetTime - now) / 1000);
      
      res.status(statusCode).json({
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: resetTimeSeconds,
        limit: max,
        windowMs
      });
      return;
    }

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': max.toString(),
      'X-RateLimit-Remaining': (max - entry.count).toString(),
      'X-RateLimit-Reset': Math.ceil(entry.resetTime / 1000).toString()
    });

    next();
  };
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(now: number): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get current rate limit status for a key
 */
export function getRateLimitStatus(ip: string, userId?: string): {
  count: number;
  resetTime: number;
  remaining: number;
} | null {
  const key = `${ip}:${userId || 'anonymous'}`;
  const entry = rateLimitStore.get(key);
  
  if (!entry) {
    return null;
  }

  return {
    count: entry.count,
    resetTime: entry.resetTime,
    remaining: Math.max(0, entry.resetTime - Date.now())
  };
}

/**
 * Clear rate limit for a specific key (admin function)
 */
export function clearRateLimit(ip: string, userId?: string): boolean {
  const key = `${ip}:${userId || 'anonymous'}`;
  return rateLimitStore.delete(key);
}

/**
 * Get rate limit statistics
 */
export function getRateLimitStats(): {
  totalEntries: number;
  activeEntries: number;
  expiredEntries: number;
} {
  const now = Date.now();
  let activeEntries = 0;
  let expiredEntries = 0;

  for (const entry of rateLimitStore.values()) {
    if (now > entry.resetTime) {
      expiredEntries++;
    } else {
      activeEntries++;
    }
  }

  return {
    totalEntries: rateLimitStore.size,
    activeEntries,
    expiredEntries
  };
}