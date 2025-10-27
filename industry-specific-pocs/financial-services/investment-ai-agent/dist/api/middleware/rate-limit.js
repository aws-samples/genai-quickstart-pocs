"use strict";
/**
 * Rate Limiting Middleware
 * Simple in-memory rate limiting for API endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRateLimitStats = exports.clearRateLimit = exports.getRateLimitStatus = exports.rateLimitMiddleware = void 0;
// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map();
/**
 * Create rate limiting middleware
 */
function rateLimitMiddleware(options) {
    const { windowMs, max, message = 'Too many requests, please try again later', statusCode = 429 } = options;
    return (req, res, next) => {
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
        }
        else {
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
exports.rateLimitMiddleware = rateLimitMiddleware;
/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(now) {
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}
/**
 * Get current rate limit status for a key
 */
function getRateLimitStatus(ip, userId) {
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
exports.getRateLimitStatus = getRateLimitStatus;
/**
 * Clear rate limit for a specific key (admin function)
 */
function clearRateLimit(ip, userId) {
    const key = `${ip}:${userId || 'anonymous'}`;
    return rateLimitStore.delete(key);
}
exports.clearRateLimit = clearRateLimit;
/**
 * Get rate limit statistics
 */
function getRateLimitStats() {
    const now = Date.now();
    let activeEntries = 0;
    let expiredEntries = 0;
    for (const entry of rateLimitStore.values()) {
        if (now > entry.resetTime) {
            expiredEntries++;
        }
        else {
            activeEntries++;
        }
    }
    return {
        totalEntries: rateLimitStore.size,
        activeEntries,
        expiredEntries
    };
}
exports.getRateLimitStats = getRateLimitStats;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmF0ZS1saW1pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hcGkvbWlkZGxld2FyZS9yYXRlLWxpbWl0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O0dBR0c7OztBQWdCSCw4REFBOEQ7QUFDOUQsTUFBTSxjQUFjLEdBQUcsSUFBSSxHQUFHLEVBQTBCLENBQUM7QUFFekQ7O0dBRUc7QUFDSCxTQUFnQixtQkFBbUIsQ0FBQyxPQUF5QjtJQUMzRCxNQUFNLEVBQ0osUUFBUSxFQUNSLEdBQUcsRUFDSCxPQUFPLEdBQUcsMkNBQTJDLEVBQ3JELFVBQVUsR0FBRyxHQUFHLEVBQ2pCLEdBQUcsT0FBTyxDQUFDO0lBRVosT0FBTyxDQUFDLEdBQVksRUFBRSxHQUFhLEVBQUUsSUFBa0IsRUFBRSxFQUFFO1FBQ3pELHNEQUFzRDtRQUN0RCxNQUFNLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxFQUFFLElBQUksR0FBRyxDQUFDLElBQUksRUFBRSxNQUFNLElBQUksV0FBVyxFQUFFLENBQUM7UUFDM0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRXZCLHdDQUF3QztRQUN4QyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxJQUFJLEVBQUUsRUFBRSwrQkFBK0I7WUFDekQscUJBQXFCLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUI7UUFFRCxpQ0FBaUM7UUFDakMsSUFBSSxLQUFLLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUVwQyxJQUFJLENBQUMsS0FBSyxJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUMsU0FBUyxFQUFFO1lBQ25DLDBDQUEwQztZQUMxQyxLQUFLLEdBQUc7Z0JBQ04sS0FBSyxFQUFFLENBQUM7Z0JBQ1IsU0FBUyxFQUFFLEdBQUcsR0FBRyxRQUFRO2FBQzFCLENBQUM7WUFDRixjQUFjLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxL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SUFFRCxPQUFPO1FBQ0wsWUFBWSxFQUFFLGNBQWMsQ0FBQyxJQUFJO1FBQ2pDLGFBQWE7UUFDYixjQUFjO0tBQ2YsQ0FBQztBQUNKLENBQUM7QUF0QkQsOENBc0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBSYXRlIExpbWl0aW5nIE1pZGRsZXdhcmVcbiAqIFNpbXBsZSBpbi1tZW1vcnkgcmF0ZSBsaW1pdGluZyBmb3IgQVBJIGVuZHBvaW50c1xuICovXG5cbmltcG9ydCB7IFJlcXVlc3QsIFJlc3BvbnNlLCBOZXh0RnVuY3Rpb24gfSBmcm9tICdleHByZXNzJztcblxuaW50ZXJmYWNlIFJhdGVMaW1pdE9wdGlvbnMge1xuICB3aW5kb3dNczogbnVtYmVyOyAvLyBUaW1lIHdpbmRvdyBpbiBtaWxsaXNlY29uZHNcbiAgbWF4OiBudW1iZXI7IC8vIE1heGltdW0gbnVtYmVyIG9mIHJlcXVlc3RzIHBlciB3aW5kb3dcbiAgbWVzc2FnZT86IHN0cmluZztcbiAgc3RhdHVzQ29kZT86IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIFJhdGVMaW1pdEVudHJ5IHtcbiAgY291bnQ6IG51bWJlcjtcbiAgcmVzZXRUaW1lOiBudW1iZXI7XG59XG5cbi8vIEluLW1lbW9yeSBzdG9yZSBmb3IgcmF0ZSBsaW1pdGluZyAodXNlIFJlZGlzIGluIHByb2R1Y3Rpb24pXG5jb25zdCByYXRlTGltaXRTdG9yZSA9IG5ldyBNYXA8c3RyaW5nLCBSYXRlTGltaXRFbnRyeT4oKTtcblxuLyoqXG4gKiBDcmVhdGUgcmF0ZSBsaW1pdGluZyBtaWRkbGV3YXJlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByYXRlTGltaXRNaWRkbGV3YXJlKG9wdGlvbnM6IFJhdGVMaW1pdE9wdGlvbnMpIHtcbiAgY29uc3Qge1xuICAgIHdpbmRvd01zLFxuICAgIG1heCxcbiAgICBtZXNzYWdlID0gJ1RvbyBtYW55IHJlcXVlc3RzLCBwbGVhc2UgdHJ5IGFnYWluIGxhdGVyJyxcbiAgICBzdGF0dXNDb2RlID0gNDI5XG4gIH0gPSBvcHRpb25zO1xuXG4gIHJldHVybiAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pID0+IHtcbiAgICAvLyBHZW5lcmF0ZSBrZXkgYmFzZWQgb24gSVAgYW5kIHVzZXIgSUQgKGlmIGF2YWlsYWJsZSlcbiAgICBjb25zdCBrZXkgPSBgJHtyZXEuaXB9OiR7cmVxLnVzZXI/LnVzZXJJZCB8fCAnYW5vbnltb3VzJ31gO1xuICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgXG4gICAgLy8gQ2xlYW4gdXAgZXhwaXJlZCBlbnRyaWVzIHBlcmlvZGljYWxseVxuICAgIGlmIChNYXRoLnJhbmRvbSgpIDwgMC4wMSkgeyAvLyAxJSBjaGFuY2UgdG8gdHJpZ2dlciBjbGVhbnVwXG4gICAgICBjbGVhbnVwRXhwaXJlZEVudHJpZXMobm93KTtcbiAgICB9XG5cbiAgICAvLyBHZXQgb3IgY3JlYXRlIHJhdGUgbGltaXQgZW50cnlcbiAgICBsZXQgZW50cnkgPSByYXRlTGltaXRTdG9yZS5nZXQoa2V5KTtcbiAgICBcbiAgICBpZiAoIWVudHJ5IHx8IG5vdyA+IGVudHJ5LnJlc2V0VGltZSkge1xuICAgICAgLy8gQ3JlYXRlIG5ldyBlbnRyeSBvciByZXNldCBleHBpcmVkIGVudHJ5XG4gICAgICBlbnRyeSA9IHtcbiAgICAgICAgY291bnQ6IDEsXG4gICAgICAgIHJlc2V0VGltZTogbm93ICsgd2luZG93TXNcbiAgICAgIH07XG4gICAgICByYXRlTGltaXRTdG9yZS5zZXQoa2V5LCBlbnRyeSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEluY3JlbWVudCBleGlzdGluZyBlbnRyeVxuICAgICAgZW50cnkuY291bnQrKztcbiAgICB9XG5cbiAgICAvLyBDaGVjayBpZiBsaW1pdCBleGNlZWRlZFxuICAgIGlmIChlbnRyeS5jb3VudCA+IG1heCkge1xuICAgICAgY29uc3QgcmVzZXRUaW1lU2Vjb25kcyA9IE1hdGguY2VpbCgoZW50cnkucmVzZXRUaW1lIC0gbm93KSAvIDEwMDApO1xuICAgICAgXG4gICAgICByZXMuc3RhdHVzKHN0YXR1c0NvZGUpLmpzb24oe1xuICAgICAgICBlcnJvcjogbWVzc2FnZSxcbiAgICAgICAgY29kZTogJ1JBVEVfTElNSVRfRVhDRUVERUQnLFxuICAgICAgICByZXRyeUFmdGVyOiByZXNldFRpbWVTZWNvbmRzLFxuICAgICAgICBsaW1pdDogbWF4LFxuICAgICAgICB3aW5kb3dNc1xuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gQWRkIHJhdGUgbGltaXQgaGVhZGVyc1xuICAgIHJlcy5zZXQoe1xuICAgICAgJ1gtUmF0ZUxpbWl0LUxpbWl0JzogbWF4LnRvU3RyaW5nKCksXG4gICAgICAnWC1SYXRlTGltaXQtUmVtYWluaW5nJzogKG1heCAtIGVudHJ5LmNvdW50KS50b1N0cmluZygpLFxuICAgICAgJ1gtUmF0ZUxpbWl0LVJlc2V0JzogTWF0aC5jZWlsKGVudHJ5LnJlc2V0VGltZSAvIDEwMDApLnRvU3RyaW5nKClcbiAgICB9KTtcblxuICAgIG5leHQoKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBDbGVhbiB1cCBleHBpcmVkIHJhdGUgbGltaXQgZW50cmllc1xuICovXG5mdW5jdGlvbiBjbGVhbnVwRXhwaXJlZEVudHJpZXMobm93OiBudW1iZXIpOiB2b2lkIHtcbiAgZm9yIChjb25zdCBba2V5LCBlbnRyeV0gb2YgcmF0ZUxpbWl0U3RvcmUuZW50cmllcygpKSB7XG4gICAgaWYgKG5vdyA+IGVudHJ5LnJlc2V0VGltZSkge1xuICAgICAgcmF0ZUxpbWl0U3RvcmUuZGVsZXRlKGtleSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2V0IGN1cnJlbnQgcmF0ZSBsaW1pdCBzdGF0dXMgZm9yIGEga2V5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSYXRlTGltaXRTdGF0dXMoaXA6IHN0cmluZywgdXNlcklkPzogc3RyaW5nKToge1xuICBjb3VudDogbnVtYmVyO1xuICByZXNldFRpbWU6IG51bWJlcjtcbiAgcmVtYWluaW5nOiBudW1iZXI7XG59IHwgbnVsbCB7XG4gIGNvbnN0IGtleSA9IGAke2lwfToke3VzZXJJZCB8fCAnYW5vbnltb3VzJ31gO1xuICBjb25zdCBlbnRyeSA9IHJhdGVMaW1pdFN0b3JlLmdldChrZXkpO1xuICBcbiAgaWYgKCFlbnRyeSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBjb3VudDogZW50cnkuY291bnQsXG4gICAgcmVzZXRUaW1lOiBlbnRyeS5yZXNldFRpbWUsXG4gICAgcmVtYWluaW5nOiBNYXRoLm1heCgwLCBlbnRyeS5yZXNldFRpbWUgLSBEYXRlLm5vdygpKVxuICB9O1xufVxuXG4vKipcbiAqIENsZWFyIHJhdGUgbGltaXQgZm9yIGEgc3BlY2lmaWMga2V5IChhZG1pbiBmdW5jdGlvbilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyUmF0ZUxpbWl0KGlwOiBzdHJpbmcsIHVzZXJJZD86IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBrZXkgPSBgJHtpcH06JHt1c2VySWQgfHwgJ2Fub255bW91cyd9YDtcbiAgcmV0dXJuIHJhdGVMaW1pdFN0b3JlLmRlbGV0ZShrZXkpO1xufVxuXG4vKipcbiAqIEdldCByYXRlIGxpbWl0IHN0YXRpc3RpY3NcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJhdGVMaW1pdFN0YXRzKCk6IHtcbiAgdG90YWxFbnRyaWVzOiBudW1iZXI7XG4gIGFjdGl2ZUVudHJpZXM6IG51bWJlcjtcbiAgZXhwaXJlZEVudHJpZXM6IG51bWJlcjtcbn0ge1xuICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICBsZXQgYWN0aXZlRW50cmllcyA9IDA7XG4gIGxldCBleHBpcmVkRW50cmllcyA9IDA7XG5cbiAgZm9yIChjb25zdCBlbnRyeSBvZiByYXRlTGltaXRTdG9yZS52YWx1ZXMoKSkge1xuICAgIGlmIChub3cgPiBlbnRyeS5yZXNldFRpbWUpIHtcbiAgICAgIGV4cGlyZWRFbnRyaWVzKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFjdGl2ZUVudHJpZXMrKztcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHRvdGFsRW50cmllczogcmF0ZUxpbWl0U3RvcmUuc2l6ZSxcbiAgICBhY3RpdmVFbnRyaWVzLFxuICAgIGV4cGlyZWRFbnRyaWVzXG4gIH07XG59Il19