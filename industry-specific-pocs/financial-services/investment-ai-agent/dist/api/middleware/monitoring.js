"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheckHandler = exports.errorTrackingMiddleware = exports.businessMetricsMiddleware = exports.userContextMiddleware = exports.performanceMonitoring = void 0;
const monitoring_service_1 = require("../../services/monitoring/monitoring-service");
const alerting_service_1 = require("../../services/monitoring/alerting-service");
/**
 * Middleware to track API performance metrics
 */
const performanceMonitoring = (req, res, next) => {
    // Record start time
    req.startTime = Date.now();
    // Override res.end to capture metrics when response is sent
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        const duration = Date.now() - (req.startTime || Date.now());
        const endpoint = req.route?.path || req.path;
        const method = req.method;
        const statusCode = res.statusCode;
        // Record API request metrics
        monitoring_service_1.monitoringService.recordApiRequest(endpoint, method, statusCode, duration, req.userId, req.organizationId).catch(error => {
            console.error('Failed to record API metrics:', error);
        });
        // Send alerts for slow requests or errors
        if (duration > 10000) { // 10 seconds
            alerting_service_1.alertingService.sendMediumAlert('API', `Slow API request detected: ${method} ${endpoint} took ${duration}ms`, {
                endpoint,
                method,
                duration,
                statusCode,
                userId: req.userId,
                organizationId: req.organizationId
            }).catch(error => {
                console.error('Failed to send slow request alert:', error);
            });
        }
        if (statusCode >= 500) {
            alerting_service_1.alertingService.sendHighAlert('API', `Server error detected: ${method} ${endpoint} returned ${statusCode}`, {
                endpoint,
                method,
                statusCode,
                duration,
                userId: req.userId,
                organizationId: req.organizationId
            }).catch(error => {
                console.error('Failed to send error alert:', error);
            });
        }
        return originalEnd.call(this, chunk, encoding);
    };
    next();
};
exports.performanceMonitoring = performanceMonitoring;
/**
 * Middleware to extract user context for monitoring
 */
const userContextMiddleware = (req, res, next) => {
    // Extract user information from JWT token or headers
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            // In a real implementation, you would decode the JWT token here
            // For now, we'll extract from custom headers if available
            req.userId = req.headers['x-user-id'];
            req.organizationId = req.headers['x-organization-id'];
        }
        catch (error) {
            console.error('Failed to extract user context:', error);
        }
    }
    next();
};
exports.userContextMiddleware = userContextMiddleware;
/**
 * Middleware to track specific business metrics
 */
const businessMetricsMiddleware = (req, res, next) => {
    // Override res.json to capture business-specific metrics
    const originalJson = res.json;
    res.json = function (body) {
        const endpoint = req.route?.path || req.path;
        const method = req.method;
        // Track specific business events based on endpoint
        if (endpoint.includes('/ideas/generate') && method === 'POST') {
            monitoring_service_1.monitoringService.recordUsage({
                userId: req.userId,
                organizationId: req.organizationId,
                action: 'generate_investment_idea',
                resource: 'investment_ideas',
                success: res.statusCode >= 200 && res.statusCode < 300,
                metadata: {
                    endpoint,
                    method,
                    statusCode: res.statusCode
                }
            }).catch(error => {
                console.error('Failed to record business metrics:', error);
            });
        }
        if (endpoint.includes('/knowledge/upload') && method === 'POST') {
            monitoring_service_1.monitoringService.recordUsage({
                userId: req.userId,
                organizationId: req.organizationId,
                action: 'upload_proprietary_data',
                resource: 'knowledge_base',
                success: res.statusCode >= 200 && res.statusCode < 300,
                metadata: {
                    endpoint,
                    method,
                    statusCode: res.statusCode
                }
            }).catch(error => {
                console.error('Failed to record business metrics:', error);
            });
        }
        if (endpoint.includes('/feedback') && method === 'POST') {
            monitoring_service_1.monitoringService.recordUsage({
                userId: req.userId,
                organizationId: req.organizationId,
                action: 'submit_feedback',
                resource: 'feedback',
                success: res.statusCode >= 200 && res.statusCode < 300,
                metadata: {
                    endpoint,
                    method,
                    statusCode: res.statusCode
                }
            }).catch(error => {
                console.error('Failed to record business metrics:', error);
            });
        }
        return originalJson.call(this, body);
    };
    next();
};
exports.businessMetricsMiddleware = businessMetricsMiddleware;
/**
 * Error tracking middleware
 */
const errorTrackingMiddleware = (error, req, res, next) => {
    const endpoint = req.route?.path || req.path;
    const method = req.method;
    // Determine error severity based on error type
    let severity = 'medium';
    if (error.name === 'ValidationError') {
        severity = 'low';
    }
    else if (error.name === 'AuthenticationError' || error.name === 'AuthorizationError') {
        severity = 'medium';
    }
    else if (error.name === 'DatabaseError' || error.name === 'ExternalServiceError') {
        severity = 'high';
    }
    else if (error.name === 'SystemError' || error.message.includes('CRITICAL')) {
        severity = 'critical';
    }
    // Record error metric
    monitoring_service_1.monitoringService.recordError({
        errorType: error.name || 'UnknownError',
        errorMessage: error.message,
        service: 'API',
        severity,
        metadata: {
            endpoint,
            method,
            stack: error.stack,
            userId: req.userId,
            organizationId: req.organizationId,
            timestamp: new Date().toISOString()
        }
    }).catch(monitoringError => {
        console.error('Failed to record error metric:', monitoringError);
    });
    // Send alert for high severity errors
    if (severity === 'high' || severity === 'critical') {
        alerting_service_1.alertingService.sendAlert({
            service: 'API',
            environment: process.env.NODE_ENV || 'dev',
            timestamp: new Date(),
            severity,
            message: `${error.name}: ${error.message}`,
            metadata: {
                endpoint,
                method,
                stack: error.stack,
                userId: req.userId,
                organizationId: req.organizationId
            }
        }).catch(alertError => {
            console.error('Failed to send error alert:', alertError);
        });
    }
    next(error);
};
exports.errorTrackingMiddleware = errorTrackingMiddleware;
/**
 * Health check endpoint with monitoring
 */
const healthCheckHandler = async (req, res) => {
    const startTime = Date.now();
    try {
        // Perform basic health checks
        const healthChecks = {
            api: true,
            database: await checkDatabaseHealth(),
            externalServices: await checkExternalServicesHealth(),
            memory: checkMemoryUsage(),
            timestamp: new Date().toISOString()
        };
        const isHealthy = Object.values(healthChecks).every(check => typeof check === 'boolean' ? check : true);
        const responseTime = Date.now() - startTime;
        // Record system health metrics
        await monitoring_service_1.monitoringService.recordSystemHealth('API', isHealthy ? 'healthy' : 'degraded', responseTime);
        res.status(isHealthy ? 200 : 503).json({
            status: isHealthy ? 'healthy' : 'degraded',
            checks: healthChecks,
            responseTime: `${responseTime}ms`
        });
    }
    catch (error) {
        const responseTime = Date.now() - startTime;
        await monitoring_service_1.monitoringService.recordSystemHealth('API', 'unhealthy', responseTime);
        await alerting_service_1.alertingService.sendHighAlert('API', 'Health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        res.status(503).json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
            responseTime: `${responseTime}ms`
        });
    }
};
exports.healthCheckHandler = healthCheckHandler;
/**
 * Check database connectivity
 */
async function checkDatabaseHealth() {
    try {
        // Implement actual database health check
        // For now, return true as placeholder
        return true;
    }
    catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
}
/**
 * Check external services health
 */
async function checkExternalServicesHealth() {
    try {
        // Implement actual external service health checks
        // For now, return true as placeholder
        return true;
    }
    catch (error) {
        console.error('External services health check failed:', error);
        return false;
    }
}
/**
 * Check memory usage
 */
function checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const freeMemory = totalMemory - usedMemory;
    const percentage = Math.round((usedMemory / totalMemory) * 100);
    return {
        used: `${Math.round(usedMemory / 1024 / 1024)}MB`,
        free: `${Math.round(freeMemory / 1024 / 1024)}MB`,
        percentage
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uaXRvcmluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hcGkvbWlkZGxld2FyZS9tb25pdG9yaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHFGQUFpRjtBQUNqRixpRkFBNkU7QUFRN0U7O0dBRUc7QUFDSSxNQUFNLHFCQUFxQixHQUFHLENBQ25DLEdBQXNCLEVBQ3RCLEdBQWEsRUFDYixJQUFrQixFQUNaLEVBQUU7SUFDUixvQkFBb0I7SUFDcEIsR0FBRyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7SUFFM0IsNERBQTREO0lBQzVELE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUM7SUFDNUIsR0FBRyxDQUFDLEdBQUcsR0FBRyxVQUFTLEtBQVcsRUFBRSxRQUFjO1FBQzVDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDNUQsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLEtBQUssRUFBRSxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQztRQUM3QyxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO1FBQzFCLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUM7UUFFbEMsNkJBQTZCO1FBQzdCLHNDQUFpQixDQUFDLGdCQUFnQixDQUNoQyxRQUFRLEVBQ1IsTUFBTSxFQUNOLFVBQVUsRUFDVixRQUFRLEVBQ1IsR0FBRyxDQUFDLE1BQU0sRUFDVixHQUFHLENBQUMsY0FBYyxDQUNuQixDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNkLE9BQU8sQ0FBQyxLQUFLLENBQUMsK0JBQStCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDeEQsQ0FBQyxDQUFDLENBQUM7UUFFSCwwQ0FBMEM7UUFDMUMsSUFBSSxRQUFRLEdBQUcsS0FBSyxFQUFFLEVBQUUsYUFBYTtZQUNuQyxrQ0FBZSxDQUFDLGVBQWUsQ0FDN0IsS0FBSyxFQUNMLDhCQUE4QixNQUFNLElBQUksUUFBUSxTQUFTLFFBQVEsSUFBSSxFQUNyRTtnQkFDRSxRQUFRO2dCQUNSLE1BQU07Z0JBQ04sUUFBUTtnQkFDUixVQUFVO2dCQUNWLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTTtnQkFDbEIsY0FBYyxFQUFFLEdBQUcsQ0FBQyxjQUFjO2FBQ25DLENBQ0YsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQyxvQ0FBb0MsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM3RCxDQUFDLENBQUMsQ0FBQztTQUNKO1FBRUQsSUFBSSxVQUFVLElBQUksR0FBRyxFQUFFO1lBQ3JCLGtDQUFlLENBQUMsYUFBYSxDQUMzQixLQUFLLEVBQ0wsMEJBQTBCLE1BQU0sSUFBSSxRQUFRLGFBQWEsVUFBVSxFQUFFLEVBQ3JFO2dCQUNFLFFBQVE7Z0JBQ1IsTUFBTTtnQkFDTixVQUFVO2dCQUNWLFFBQVE7Z0JBQ1IsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNO2dCQUNsQixjQUFjLEVBQUUsR0FBRyxDQUFDLGNBQWM7YUFDbkMsQ0FDRixDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLDZCQUE2QixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3RELENBQUMsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNqRCxDQUFDLENBQUM7SUFFRixJQUFJLEVBQUUsQ0FBQztBQUNULENBQUMsQ0FBQztBQW5FVyxRQUFBLHFCQUFxQix5QkFtRWhDO0FBRUY7O0dBRUc7QUFDSSxNQUFNLHFCQUFxQixHQUFHLENBQ25DLEdBQXNCLEVBQ3RCLEdBQWEsRUFDYixJQUFrQixFQUNaLEVBQUU7SUFDUixxREFBcUQ7SUFDckQsTUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUM7SUFDN0MsSUFBSSxVQUFVLElBQUksVUFBVSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBRTtRQUNsRCxJQUFJO1lBQ0YsZ0VBQWdFO1lBQ2hFLDBEQUEwRDtZQUMxRCxHQUFHLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFXLENBQUM7WUFDaEQsR0FBRyxDQUFDLGNBQWMsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFXLENBQUM7U0FDakU7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNkLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUNBQWlDLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDekQ7S0FDRjtJQUVELElBQUksRUFBRSxDQUFDO0FBQ1QsQ0FBQyxDQUFDO0FBbkJXLFFBQUEscUJBQXFCLHlCQW1CaEM7QUFFRjs7R0FFRztBQUNJLE1BQU0seUJBQXlCLEdBQUcsQ0FDdkMsR0FBc0IsRUFDdEIsR0FBYSxFQUNiLElBQWtCLEVBQ1osRUFBRTtJQUNSLHlEQUF5RDtJQUN6RCxNQUFNLFlBQVksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDO0lBQzlCLEdBQUcsQ0FBQyxJQUFJLEdBQUcsVUFBUyxJQUFVO1FBQzVCLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDN0MsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztRQUUxQixtREFBbUQ7UUFDbkQsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLElBQUksTUFBTSxLQUFLLE1BQU0sRUFBRTtZQUM3RCxzQ0FBaUIsQ0FBQyxXQUFXLENBQUM7Z0JBQzVCLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTTtnQkFDbEIsY0FBYyxFQUFFLEdBQUcsQ0FBQyxjQUFjO2dCQUNsQyxNQUFNLEVBQUUsMEJBQTBCO2dCQUNsQyxRQUFRLEVBQUUsa0JBQWtCO2dCQUM1QixPQUFPLEVBQUUsR0FBRyxDQUFDLFVBQVUsSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsR0FBRyxHQUFHO2dCQUN0RCxRQUFRLEVBQUU7b0JBQ1IsUUFBUTtvQkFDUixNQUFNO29CQUNOLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVTtpQkFDM0I7YUFDRixDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsb0NBQW9DLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDN0QsQ0FBQyxDQUFDLENBQUM7U0FDSjtRQUVELElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLE1BQU0sS0FBSyxNQUFNLEVBQUU7WUFDL0Qsc0NBQWlCLENBQUMsV0FBVyxDQUFDO2dCQUM1QixNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU07Z0JBQ2xCLGNBQWMsRUFBRSxHQUFHLENBQUMsY0FBYztnQkFDbEMsTUFBTSxFQUFFLHlCQUF5QjtnQkFDakMsUUFBUSxFQUFFLGdCQUFnQjtnQkFDMUIsT0FBTyxFQUFFLEdBQUcsQ0FBQyxVQUFVLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLEdBQUcsR0FBRztnQkFDdEQsUUFBUSxFQUFFO29CQUNSLFFBQVE7b0JBQ1IsTUFBTTtvQkFDTixVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVU7aUJBQzNCO2FBQ0YsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDZixPQUFPLENBQUMsS0FBSyxDQUFDLG9DQUFvQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdELENBQUMsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksTUFBTSxLQUFLLE1BQU0sRUFBRTtZQUN2RCxzQ0FBaUIsQ0FBQyxXQUFXLENBQUM7Z0JBQzVCLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTTtnQkFDbEIsY0FBYyxFQUFFLEdBQUcsQ0FBQyxjQUFjO2dCQUNsQyxNQUFNLEVBQUUsaUJBQWlCO2dCQUN6QixRQUFRLEVBQUUsVUFBVTtnQkFDcEIsT0FBTyxFQUFFLEdBQUcsQ0FBQyxVQUFVLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLEdBQUcsR0FBRztnQkFDdEQsUUFBUSxFQUFFO29CQUNSLFFBQVE7b0JBQ1IsTUFBTTtvQkFDTixVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVU7aUJBQzNCO2FBQ0YsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDZixPQUFPLENBQUMsS0FBSyxDQUFDLG9DQUFvQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdELENBQUMsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxPQUFPLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3ZDLENBQUMsQ0FBQztJQUVGLElBQUksRUFBRSxDQUFDO0FBQ1QsQ0FBQyxDQUFDO0FBbkVXLFFBQUEseUJBQXlCLDZCQW1FcEM7QUFFRjs7R0FFRztBQUNJLE1BQU0sdUJBQXVCLEdBQUcsQ0FDckMsS0FBWSxFQUNaLEdBQXNCLEVBQ3RCLEdBQWEsRUFDYixJQUFrQixFQUNaLEVBQUU7SUFDUixNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsS0FBSyxFQUFFLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDO0lBQzdDLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7SUFFMUIsK0NBQStDO0lBQy9DLElBQUksUUFBUSxHQUEyQyxRQUFRLENBQUM7SUFFaEUsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLGlCQUFpQixFQUFFO1FBQ3BDLFFBQVEsR0FBRyxLQUFLLENBQUM7S0FDbEI7U0FBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUsscUJBQXFCLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxvQkFBb0IsRUFBRTtRQUN0RixRQUFRLEdBQUcsUUFBUSxDQUFDO0tBQ3JCO1NBQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLGVBQWUsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLHNCQUFzQixFQUFFO1FBQ2xGLFFBQVEsR0FBRyxNQUFNLENBQUM7S0FDbkI7U0FBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssYUFBYSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQzdFLFFBQVEsR0FBRyxVQUFVLENBQUM7S0FDdkI7SUFFRCxzQkFBc0I7SUFDdEIsc0NBQWlCLENBQUMsV0FBVyxDQUFDO1FBQzVCLFNBQVMsRUFBRSxLQUFLLENBQUMsSUFBSSxJQUFJLGNBQWM7UUFDdkMsWUFBWSxFQUFFLEtBQUssQ0FBQyxPQUFPO1FBQzNCLE9BQU8sRUFBRSxLQUFLO1FBQ2QsUUFBUTtRQUNSLFFBQVEsRUFBRTtZQUNSLFFBQVE7WUFDUixNQUFNO1lBQ04sS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLO1lBQ2xCLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTTtZQUNsQixjQUFjLEVBQUUsR0FBRyxDQUFDLGNBQWM7WUFDbEMsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1NBQ3BDO0tBQ0YsQ0FBQyxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsRUFBRTtRQUN6QixPQUFPLENBQUMsS0FBSyxDQUFDLGdDQUFnQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBQ25FLENBQUMsQ0FBQyxDQUFDO0lBRUgsc0NBQXNDO0lBQ3RDLElBQUksUUFBUSxLQUFLLE1BQU0sSUFBSSxRQUFRLEtBQUssVUFBVSxFQUFFO1FBQ2xELGtDQUFlLENBQUMsU0FBUyxDQUFDO1lBQ3hCLE9BQU8sRUFBRSxLQUFLO1lBQ2QsV0FBVyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxJQUFJLEtBQUs7WUFDMUMsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFO1lBQ3JCLFFBQVE7WUFDUixPQUFPLEVBQUUsR0FBRyxLQUFLLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxPQUFPLEVBQUU7WUFDMUMsUUFBUSxFQUFFO2dCQUNSLFFBQVE7Z0JBQ1IsTUFBTTtnQkFDTixLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUs7Z0JBQ2xCLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTTtnQkFDbEIsY0FBYyxFQUFFLEdBQUcsQ0FBQyxjQUFjO2FBQ25DO1NBQ0YsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUNwQixPQUFPLENBQUMsS0FBSyxDQUFDLDZCQUE2QixFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzNELENBQUMsQ0FBQyxDQUFDO0tBQ0o7SUFFRCxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDZCxDQUFDLENBQUM7QUE3RFcsUUFBQSx1QkFBdUIsMkJBNkRsQztBQUVGOztHQUVHO0FBQ0ksTUFBTSxrQkFBa0IsR0FBRyxLQUFLLEVBQUUsR0FBWSxFQUFFLEdBQWEsRUFBaUIsRUFBRTtJQUNyRixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7SUFFN0IsSUFBSTtRQUNGLDhCQUE4QjtRQUM5QixNQUFNLFlBQVksR0FBRztZQUNuQixHQUFHLEVBQUUsSUFBSTtZQUNULFFBQVEsRUFBRSxNQUFNLG1CQUFtQixFQUFFO1lBQ3JDLGdCQUFnQixFQUFFLE1BQU0sMkJBQTJCLEVBQUU7WUFDckQsTUFBTSxFQUFFLGdCQUFnQixFQUFFO1lBQzFCLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtTQUNwQyxDQUFDO1FBRUYsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FDMUQsT0FBTyxLQUFLLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FDMUMsQ0FBQztRQUVGLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUM7UUFFNUMsK0JBQStCO1FBQy9CLE1BQU0sc0NBQWlCLENBQUMsa0JBQWtCLENBQ3hDLEtBQUssRUFDTCxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUNsQyxZQUFZLENBQ2IsQ0FBQztRQUVGLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNyQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFVBQVU7WUFDMUMsTUFBTSxFQUFFLFlBQVk7WUFDcEIsWUFBWSxFQUFFLEdBQUcsWUFBWSxJQUFJO1NBQ2xDLENBQUMsQ0FBQztLQUVKO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDO1FBRTVDLE1BQU0sc0NBQWlCLENBQUMsa0JBQWtCLENBQ3hDLEtBQUssRUFDTCxXQUFXLEVBQ1gsWUFBWSxDQUNiLENBQUM7UUFFRixNQUFNLGtDQUFlLENBQUMsYUFBYSxDQUNqQyxLQUFLLEVBQ0wscUJBQXFCLEVBQ3JCLEVBQUUsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUNwRSxDQUFDO1FBRUYsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbkIsTUFBTSxFQUFFLFdBQVc7WUFDbkIsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWU7WUFDL0QsWUFBWSxFQUFFLEdBQUcsWUFBWSxJQUFJO1NBQ2xDLENBQUMsQ0FBQztLQUNKO0FBQ0gsQ0FBQyxDQUFDO0FBckRXLFFBQUEsa0JBQWtCLHNCQXFEN0I7QUFFRjs7R0FFRztBQUNILEtBQUssVUFBVSxtQkFBbUI7SUFDaEMsSUFBSTtRQUNGLHlDQUF5QztRQUN6QyxzQ0FBc0M7UUFDdEMsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQywrQkFBK0IsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN0RCxPQUFPLEtBQUssQ0FBQztLQUNkO0FBQ0gsQ0FBQztBQUVEOztHQUVHO0FBQ0gsS0FBSyxVQUFVLDJCQUEyQjtJQUN4QyxJQUFJO1FBQ0Ysa0RBQWtEO1FBQ2xELHNDQUFzQztRQUN0QyxPQUFPLElBQUksQ0FBQztLQUNiO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLHdDQUF3QyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQy9ELE9BQU8sS0FBSyxDQUFDO0tBQ2Q7QUFDSCxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLGdCQUFnQjtJQUN2QixNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDdkMsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQztJQUN2QyxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDO0lBQ3JDLE1BQU0sVUFBVSxHQUFHLFdBQVcsR0FBRyxVQUFVLENBQUM7SUFDNUMsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsR0FBRyxXQUFXLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztJQUVoRSxPQUFPO1FBQ0wsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJO1FBQ2pELElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSTtRQUNqRCxVQUFVO0tBQ1gsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBSZXF1ZXN0LCBSZXNwb25zZSwgTmV4dEZ1bmN0aW9uIH0gZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgeyBtb25pdG9yaW5nU2VydmljZSB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL21vbml0b3JpbmcvbW9uaXRvcmluZy1zZXJ2aWNlJztcbmltcG9ydCB7IGFsZXJ0aW5nU2VydmljZSB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL21vbml0b3JpbmcvYWxlcnRpbmctc2VydmljZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTW9uaXRvcmluZ1JlcXVlc3QgZXh0ZW5kcyBSZXF1ZXN0IHtcbiAgc3RhcnRUaW1lPzogbnVtYmVyO1xuICB1c2VySWQ/OiBzdHJpbmc7XG4gIG9yZ2FuaXphdGlvbklkPzogc3RyaW5nO1xufVxuXG4vKipcbiAqIE1pZGRsZXdhcmUgdG8gdHJhY2sgQVBJIHBlcmZvcm1hbmNlIG1ldHJpY3NcbiAqL1xuZXhwb3J0IGNvbnN0IHBlcmZvcm1hbmNlTW9uaXRvcmluZyA9IChcbiAgcmVxOiBNb25pdG9yaW5nUmVxdWVzdCxcbiAgcmVzOiBSZXNwb25zZSxcbiAgbmV4dDogTmV4dEZ1bmN0aW9uXG4pOiB2b2lkID0+IHtcbiAgLy8gUmVjb3JkIHN0YXJ0IHRpbWVcbiAgcmVxLnN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cbiAgLy8gT3ZlcnJpZGUgcmVzLmVuZCB0byBjYXB0dXJlIG1ldHJpY3Mgd2hlbiByZXNwb25zZSBpcyBzZW50XG4gIGNvbnN0IG9yaWdpbmFsRW5kID0gcmVzLmVuZDtcbiAgcmVzLmVuZCA9IGZ1bmN0aW9uKGNodW5rPzogYW55LCBlbmNvZGluZz86IGFueSk6IFJlc3BvbnNlIHtcbiAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSAocmVxLnN0YXJ0VGltZSB8fCBEYXRlLm5vdygpKTtcbiAgICBjb25zdCBlbmRwb2ludCA9IHJlcS5yb3V0ZT8ucGF0aCB8fCByZXEucGF0aDtcbiAgICBjb25zdCBtZXRob2QgPSByZXEubWV0aG9kO1xuICAgIGNvbnN0IHN0YXR1c0NvZGUgPSByZXMuc3RhdHVzQ29kZTtcblxuICAgIC8vIFJlY29yZCBBUEkgcmVxdWVzdCBtZXRyaWNzXG4gICAgbW9uaXRvcmluZ1NlcnZpY2UucmVjb3JkQXBpUmVxdWVzdChcbiAgICAgIGVuZHBvaW50LFxuICAgICAgbWV0aG9kLFxuICAgICAgc3RhdHVzQ29kZSxcbiAgICAgIGR1cmF0aW9uLFxuICAgICAgcmVxLnVzZXJJZCxcbiAgICAgIHJlcS5vcmdhbml6YXRpb25JZFxuICAgICkuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIHJlY29yZCBBUEkgbWV0cmljczonLCBlcnJvcik7XG4gICAgfSk7XG5cbiAgICAvLyBTZW5kIGFsZXJ0cyBmb3Igc2xvdyByZXF1ZXN0cyBvciBlcnJvcnNcbiAgICBpZiAoZHVyYXRpb24gPiAxMDAwMCkgeyAvLyAxMCBzZWNvbmRzXG4gICAgICBhbGVydGluZ1NlcnZpY2Uuc2VuZE1lZGl1bUFsZXJ0KFxuICAgICAgICAnQVBJJyxcbiAgICAgICAgYFNsb3cgQVBJIHJlcXVlc3QgZGV0ZWN0ZWQ6ICR7bWV0aG9kfSAke2VuZHBvaW50fSB0b29rICR7ZHVyYXRpb259bXNgLFxuICAgICAgICB7XG4gICAgICAgICAgZW5kcG9pbnQsXG4gICAgICAgICAgbWV0aG9kLFxuICAgICAgICAgIGR1cmF0aW9uLFxuICAgICAgICAgIHN0YXR1c0NvZGUsXG4gICAgICAgICAgdXNlcklkOiByZXEudXNlcklkLFxuICAgICAgICAgIG9yZ2FuaXphdGlvbklkOiByZXEub3JnYW5pemF0aW9uSWRcbiAgICAgICAgfVxuICAgICAgKS5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBzZW5kIHNsb3cgcmVxdWVzdCBhbGVydDonLCBlcnJvcik7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoc3RhdHVzQ29kZSA+PSA1MDApIHtcbiAgICAgIGFsZXJ0aW5nU2VydmljZS5zZW5kSGlnaEFsZXJ0KFxuICAgICAgICAnQVBJJyxcbiAgICAgICAgYFNlcnZlciBlcnJvciBkZXRlY3RlZDogJHttZXRob2R9ICR7ZW5kcG9pbnR9IHJldHVybmVkICR7c3RhdHVzQ29kZX1gLFxuICAgICAgICB7XG4gICAgICAgICAgZW5kcG9pbnQsXG4gICAgICAgICAgbWV0aG9kLFxuICAgICAgICAgIHN0YXR1c0NvZGUsXG4gICAgICAgICAgZHVyYXRpb24sXG4gICAgICAgICAgdXNlcklkOiByZXEudXNlcklkLFxuICAgICAgICAgIG9yZ2FuaXphdGlvbklkOiByZXEub3JnYW5pemF0aW9uSWRcbiAgICAgICAgfVxuICAgICAgKS5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBzZW5kIGVycm9yIGFsZXJ0OicsIGVycm9yKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBvcmlnaW5hbEVuZC5jYWxsKHRoaXMsIGNodW5rLCBlbmNvZGluZyk7XG4gIH07XG5cbiAgbmV4dCgpO1xufTtcblxuLyoqXG4gKiBNaWRkbGV3YXJlIHRvIGV4dHJhY3QgdXNlciBjb250ZXh0IGZvciBtb25pdG9yaW5nXG4gKi9cbmV4cG9ydCBjb25zdCB1c2VyQ29udGV4dE1pZGRsZXdhcmUgPSAoXG4gIHJlcTogTW9uaXRvcmluZ1JlcXVlc3QsXG4gIHJlczogUmVzcG9uc2UsXG4gIG5leHQ6IE5leHRGdW5jdGlvblxuKTogdm9pZCA9PiB7XG4gIC8vIEV4dHJhY3QgdXNlciBpbmZvcm1hdGlvbiBmcm9tIEpXVCB0b2tlbiBvciBoZWFkZXJzXG4gIGNvbnN0IGF1dGhIZWFkZXIgPSByZXEuaGVhZGVycy5hdXRob3JpemF0aW9uO1xuICBpZiAoYXV0aEhlYWRlciAmJiBhdXRoSGVhZGVyLnN0YXJ0c1dpdGgoJ0JlYXJlciAnKSkge1xuICAgIHRyeSB7XG4gICAgICAvLyBJbiBhIHJlYWwgaW1wbGVtZW50YXRpb24sIHlvdSB3b3VsZCBkZWNvZGUgdGhlIEpXVCB0b2tlbiBoZXJlXG4gICAgICAvLyBGb3Igbm93LCB3ZSdsbCBleHRyYWN0IGZyb20gY3VzdG9tIGhlYWRlcnMgaWYgYXZhaWxhYmxlXG4gICAgICByZXEudXNlcklkID0gcmVxLmhlYWRlcnNbJ3gtdXNlci1pZCddIGFzIHN0cmluZztcbiAgICAgIHJlcS5vcmdhbml6YXRpb25JZCA9IHJlcS5oZWFkZXJzWyd4LW9yZ2FuaXphdGlvbi1pZCddIGFzIHN0cmluZztcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGV4dHJhY3QgdXNlciBjb250ZXh0OicsIGVycm9yKTtcbiAgICB9XG4gIH1cblxuICBuZXh0KCk7XG59O1xuXG4vKipcbiAqIE1pZGRsZXdhcmUgdG8gdHJhY2sgc3BlY2lmaWMgYnVzaW5lc3MgbWV0cmljc1xuICovXG5leHBvcnQgY29uc3QgYnVzaW5lc3NNZXRyaWNzTWlkZGxld2FyZSA9IChcbiAgcmVxOiBNb25pdG9yaW5nUmVxdWVzdCxcbiAgcmVzOiBSZXNwb25zZSxcbiAgbmV4dDogTmV4dEZ1bmN0aW9uXG4pOiB2b2lkID0+IHtcbiAgLy8gT3ZlcnJpZGUgcmVzLmpzb24gdG8gY2FwdHVyZSBidXNpbmVzcy1zcGVjaWZpYyBtZXRyaWNzXG4gIGNvbnN0IG9yaWdpbmFsSnNvbiA9IHJlcy5qc29uO1xuICByZXMuanNvbiA9IGZ1bmN0aW9uKGJvZHk/OiBhbnkpOiBSZXNwb25zZSB7XG4gICAgY29uc3QgZW5kcG9pbnQgPSByZXEucm91dGU/LnBhdGggfHwgcmVxLnBhdGg7XG4gICAgY29uc3QgbWV0aG9kID0gcmVxLm1ldGhvZDtcblxuICAgIC8vIFRyYWNrIHNwZWNpZmljIGJ1c2luZXNzIGV2ZW50cyBiYXNlZCBvbiBlbmRwb2ludFxuICAgIGlmIChlbmRwb2ludC5pbmNsdWRlcygnL2lkZWFzL2dlbmVyYXRlJykgJiYgbWV0aG9kID09PSAnUE9TVCcpIHtcbiAgICAgIG1vbml0b3JpbmdTZXJ2aWNlLnJlY29yZFVzYWdlKHtcbiAgICAgICAgdXNlcklkOiByZXEudXNlcklkLFxuICAgICAgICBvcmdhbml6YXRpb25JZDogcmVxLm9yZ2FuaXphdGlvbklkLFxuICAgICAgICBhY3Rpb246ICdnZW5lcmF0ZV9pbnZlc3RtZW50X2lkZWEnLFxuICAgICAgICByZXNvdXJjZTogJ2ludmVzdG1lbnRfaWRlYXMnLFxuICAgICAgICBzdWNjZXNzOiByZXMuc3RhdHVzQ29kZSA+PSAyMDAgJiYgcmVzLnN0YXR1c0NvZGUgPCAzMDAsXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgZW5kcG9pbnQsXG4gICAgICAgICAgbWV0aG9kLFxuICAgICAgICAgIHN0YXR1c0NvZGU6IHJlcy5zdGF0dXNDb2RlXG4gICAgICAgIH1cbiAgICAgIH0pLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIHJlY29yZCBidXNpbmVzcyBtZXRyaWNzOicsIGVycm9yKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChlbmRwb2ludC5pbmNsdWRlcygnL2tub3dsZWRnZS91cGxvYWQnKSAmJiBtZXRob2QgPT09ICdQT1NUJykge1xuICAgICAgbW9uaXRvcmluZ1NlcnZpY2UucmVjb3JkVXNhZ2Uoe1xuICAgICAgICB1c2VySWQ6IHJlcS51c2VySWQsXG4gICAgICAgIG9yZ2FuaXphdGlvbklkOiByZXEub3JnYW5pemF0aW9uSWQsXG4gICAgICAgIGFjdGlvbjogJ3VwbG9hZF9wcm9wcmlldGFyeV9kYXRhJyxcbiAgICAgICAgcmVzb3VyY2U6ICdrbm93bGVkZ2VfYmFzZScsXG4gICAgICAgIHN1Y2Nlc3M6IHJlcy5zdGF0dXNDb2RlID49IDIwMCAmJiByZXMuc3RhdHVzQ29kZSA8IDMwMCxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBlbmRwb2ludCxcbiAgICAgICAgICBtZXRob2QsXG4gICAgICAgICAgc3RhdHVzQ29kZTogcmVzLnN0YXR1c0NvZGVcbiAgICAgICAgfVxuICAgICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gcmVjb3JkIGJ1c2luZXNzIG1ldHJpY3M6JywgZXJyb3IpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGVuZHBvaW50LmluY2x1ZGVzKCcvZmVlZGJhY2snKSAmJiBtZXRob2QgPT09ICdQT1NUJykge1xuICAgICAgbW9uaXRvcmluZ1NlcnZpY2UucmVjb3JkVXNhZ2Uoe1xuICAgICAgICB1c2VySWQ6IHJlcS51c2VySWQsXG4gICAgICAgIG9yZ2FuaXphdGlvbklkOiByZXEub3JnYW5pemF0aW9uSWQsXG4gICAgICAgIGFjdGlvbjogJ3N1Ym1pdF9mZWVkYmFjaycsXG4gICAgICAgIHJlc291cmNlOiAnZmVlZGJhY2snLFxuICAgICAgICBzdWNjZXNzOiByZXMuc3RhdHVzQ29kZSA+PSAyMDAgJiYgcmVzLnN0YXR1c0NvZGUgPCAzMDAsXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgZW5kcG9pbnQsXG4gICAgICAgICAgbWV0aG9kLFxuICAgICAgICAgIHN0YXR1c0NvZGU6IHJlcy5zdGF0dXNDb2RlXG4gICAgICAgIH1cbiAgICAgIH0pLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIHJlY29yZCBidXNpbmVzcyBtZXRyaWNzOicsIGVycm9yKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBvcmlnaW5hbEpzb24uY2FsbCh0aGlzLCBib2R5KTtcbiAgfTtcblxuICBuZXh0KCk7XG59O1xuXG4vKipcbiAqIEVycm9yIHRyYWNraW5nIG1pZGRsZXdhcmVcbiAqL1xuZXhwb3J0IGNvbnN0IGVycm9yVHJhY2tpbmdNaWRkbGV3YXJlID0gKFxuICBlcnJvcjogRXJyb3IsXG4gIHJlcTogTW9uaXRvcmluZ1JlcXVlc3QsXG4gIHJlczogUmVzcG9uc2UsXG4gIG5leHQ6IE5leHRGdW5jdGlvblxuKTogdm9pZCA9PiB7XG4gIGNvbnN0IGVuZHBvaW50ID0gcmVxLnJvdXRlPy5wYXRoIHx8IHJlcS5wYXRoO1xuICBjb25zdCBtZXRob2QgPSByZXEubWV0aG9kO1xuXG4gIC8vIERldGVybWluZSBlcnJvciBzZXZlcml0eSBiYXNlZCBvbiBlcnJvciB0eXBlXG4gIGxldCBzZXZlcml0eTogJ2xvdycgfCAnbWVkaXVtJyB8ICdoaWdoJyB8ICdjcml0aWNhbCcgPSAnbWVkaXVtJztcbiAgXG4gIGlmIChlcnJvci5uYW1lID09PSAnVmFsaWRhdGlvbkVycm9yJykge1xuICAgIHNldmVyaXR5ID0gJ2xvdyc7XG4gIH0gZWxzZSBpZiAoZXJyb3IubmFtZSA9PT0gJ0F1dGhlbnRpY2F0aW9uRXJyb3InIHx8IGVycm9yLm5hbWUgPT09ICdBdXRob3JpemF0aW9uRXJyb3InKSB7XG4gICAgc2V2ZXJpdHkgPSAnbWVkaXVtJztcbiAgfSBlbHNlIGlmIChlcnJvci5uYW1lID09PSAnRGF0YWJhc2VFcnJvcicgfHwgZXJyb3IubmFtZSA9PT0gJ0V4dGVybmFsU2VydmljZUVycm9yJykge1xuICAgIHNldmVyaXR5ID0gJ2hpZ2gnO1xuICB9IGVsc2UgaWYgKGVycm9yLm5hbWUgPT09ICdTeXN0ZW1FcnJvcicgfHwgZXJyb3IubWVzc2FnZS5pbmNsdWRlcygnQ1JJVElDQUwnKSkge1xuICAgIHNldmVyaXR5ID0gJ2NyaXRpY2FsJztcbiAgfVxuXG4gIC8vIFJlY29yZCBlcnJvciBtZXRyaWNcbiAgbW9uaXRvcmluZ1NlcnZpY2UucmVjb3JkRXJyb3Ioe1xuICAgIGVycm9yVHlwZTogZXJyb3IubmFtZSB8fCAnVW5rbm93bkVycm9yJyxcbiAgICBlcnJvck1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UsXG4gICAgc2VydmljZTogJ0FQSScsXG4gICAgc2V2ZXJpdHksXG4gICAgbWV0YWRhdGE6IHtcbiAgICAgIGVuZHBvaW50LFxuICAgICAgbWV0aG9kLFxuICAgICAgc3RhY2s6IGVycm9yLnN0YWNrLFxuICAgICAgdXNlcklkOiByZXEudXNlcklkLFxuICAgICAgb3JnYW5pemF0aW9uSWQ6IHJlcS5vcmdhbml6YXRpb25JZCxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgfVxuICB9KS5jYXRjaChtb25pdG9yaW5nRXJyb3IgPT4ge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byByZWNvcmQgZXJyb3IgbWV0cmljOicsIG1vbml0b3JpbmdFcnJvcik7XG4gIH0pO1xuXG4gIC8vIFNlbmQgYWxlcnQgZm9yIGhpZ2ggc2V2ZXJpdHkgZXJyb3JzXG4gIGlmIChzZXZlcml0eSA9PT0gJ2hpZ2gnIHx8IHNldmVyaXR5ID09PSAnY3JpdGljYWwnKSB7XG4gICAgYWxlcnRpbmdTZXJ2aWNlLnNlbmRBbGVydCh7XG4gICAgICBzZXJ2aWNlOiAnQVBJJyxcbiAgICAgIGVudmlyb25tZW50OiBwcm9jZXNzLmVudi5OT0RFX0VOViB8fCAnZGV2JyxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgIHNldmVyaXR5LFxuICAgICAgbWVzc2FnZTogYCR7ZXJyb3IubmFtZX06ICR7ZXJyb3IubWVzc2FnZX1gLFxuICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgZW5kcG9pbnQsXG4gICAgICAgIG1ldGhvZCxcbiAgICAgICAgc3RhY2s6IGVycm9yLnN0YWNrLFxuICAgICAgICB1c2VySWQ6IHJlcS51c2VySWQsXG4gICAgICAgIG9yZ2FuaXphdGlvbklkOiByZXEub3JnYW5pemF0aW9uSWRcbiAgICAgIH1cbiAgICB9KS5jYXRjaChhbGVydEVycm9yID0+IHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBzZW5kIGVycm9yIGFsZXJ0OicsIGFsZXJ0RXJyb3IpO1xuICAgIH0pO1xuICB9XG5cbiAgbmV4dChlcnJvcik7XG59O1xuXG4vKipcbiAqIEhlYWx0aCBjaGVjayBlbmRwb2ludCB3aXRoIG1vbml0b3JpbmdcbiAqL1xuZXhwb3J0IGNvbnN0IGhlYWx0aENoZWNrSGFuZGxlciA9IGFzeW5jIChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgXG4gIHRyeSB7XG4gICAgLy8gUGVyZm9ybSBiYXNpYyBoZWFsdGggY2hlY2tzXG4gICAgY29uc3QgaGVhbHRoQ2hlY2tzID0ge1xuICAgICAgYXBpOiB0cnVlLFxuICAgICAgZGF0YWJhc2U6IGF3YWl0IGNoZWNrRGF0YWJhc2VIZWFsdGgoKSxcbiAgICAgIGV4dGVybmFsU2VydmljZXM6IGF3YWl0IGNoZWNrRXh0ZXJuYWxTZXJ2aWNlc0hlYWx0aCgpLFxuICAgICAgbWVtb3J5OiBjaGVja01lbW9yeVVzYWdlKCksXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgIH07XG5cbiAgICBjb25zdCBpc0hlYWx0aHkgPSBPYmplY3QudmFsdWVzKGhlYWx0aENoZWNrcykuZXZlcnkoY2hlY2sgPT4gXG4gICAgICB0eXBlb2YgY2hlY2sgPT09ICdib29sZWFuJyA/IGNoZWNrIDogdHJ1ZVxuICAgICk7XG5cbiAgICBjb25zdCByZXNwb25zZVRpbWUgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuXG4gICAgLy8gUmVjb3JkIHN5c3RlbSBoZWFsdGggbWV0cmljc1xuICAgIGF3YWl0IG1vbml0b3JpbmdTZXJ2aWNlLnJlY29yZFN5c3RlbUhlYWx0aChcbiAgICAgICdBUEknLFxuICAgICAgaXNIZWFsdGh5ID8gJ2hlYWx0aHknIDogJ2RlZ3JhZGVkJyxcbiAgICAgIHJlc3BvbnNlVGltZVxuICAgICk7XG5cbiAgICByZXMuc3RhdHVzKGlzSGVhbHRoeSA/IDIwMCA6IDUwMykuanNvbih7XG4gICAgICBzdGF0dXM6IGlzSGVhbHRoeSA/ICdoZWFsdGh5JyA6ICdkZWdyYWRlZCcsXG4gICAgICBjaGVja3M6IGhlYWx0aENoZWNrcyxcbiAgICAgIHJlc3BvbnNlVGltZTogYCR7cmVzcG9uc2VUaW1lfW1zYFxuICAgIH0pO1xuXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc3QgcmVzcG9uc2VUaW1lID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICBcbiAgICBhd2FpdCBtb25pdG9yaW5nU2VydmljZS5yZWNvcmRTeXN0ZW1IZWFsdGgoXG4gICAgICAnQVBJJyxcbiAgICAgICd1bmhlYWx0aHknLFxuICAgICAgcmVzcG9uc2VUaW1lXG4gICAgKTtcblxuICAgIGF3YWl0IGFsZXJ0aW5nU2VydmljZS5zZW5kSGlnaEFsZXJ0KFxuICAgICAgJ0FQSScsXG4gICAgICAnSGVhbHRoIGNoZWNrIGZhaWxlZCcsXG4gICAgICB7IGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyB9XG4gICAgKTtcblxuICAgIHJlcy5zdGF0dXMoNTAzKS5qc29uKHtcbiAgICAgIHN0YXR1czogJ3VuaGVhbHRoeScsXG4gICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgICByZXNwb25zZVRpbWU6IGAke3Jlc3BvbnNlVGltZX1tc2BcbiAgICB9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBDaGVjayBkYXRhYmFzZSBjb25uZWN0aXZpdHlcbiAqL1xuYXN5bmMgZnVuY3Rpb24gY2hlY2tEYXRhYmFzZUhlYWx0aCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgdHJ5IHtcbiAgICAvLyBJbXBsZW1lbnQgYWN0dWFsIGRhdGFiYXNlIGhlYWx0aCBjaGVja1xuICAgIC8vIEZvciBub3csIHJldHVybiB0cnVlIGFzIHBsYWNlaG9sZGVyXG4gICAgcmV0dXJuIHRydWU7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRGF0YWJhc2UgaGVhbHRoIGNoZWNrIGZhaWxlZDonLCBlcnJvcik7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8qKlxuICogQ2hlY2sgZXh0ZXJuYWwgc2VydmljZXMgaGVhbHRoXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGNoZWNrRXh0ZXJuYWxTZXJ2aWNlc0hlYWx0aCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgdHJ5IHtcbiAgICAvLyBJbXBsZW1lbnQgYWN0dWFsIGV4dGVybmFsIHNlcnZpY2UgaGVhbHRoIGNoZWNrc1xuICAgIC8vIEZvciBub3csIHJldHVybiB0cnVlIGFzIHBsYWNlaG9sZGVyXG4gICAgcmV0dXJuIHRydWU7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXh0ZXJuYWwgc2VydmljZXMgaGVhbHRoIGNoZWNrIGZhaWxlZDonLCBlcnJvcik7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8qKlxuICogQ2hlY2sgbWVtb3J5IHVzYWdlXG4gKi9cbmZ1bmN0aW9uIGNoZWNrTWVtb3J5VXNhZ2UoKTogeyB1c2VkOiBzdHJpbmc7IGZyZWU6IHN0cmluZzsgcGVyY2VudGFnZTogbnVtYmVyIH0ge1xuICBjb25zdCBtZW1Vc2FnZSA9IHByb2Nlc3MubWVtb3J5VXNhZ2UoKTtcbiAgY29uc3QgdG90YWxNZW1vcnkgPSBtZW1Vc2FnZS5oZWFwVG90YWw7XG4gIGNvbnN0IHVzZWRNZW1vcnkgPSBtZW1Vc2FnZS5oZWFwVXNlZDtcbiAgY29uc3QgZnJlZU1lbW9yeSA9IHRvdGFsTWVtb3J5IC0gdXNlZE1lbW9yeTtcbiAgY29uc3QgcGVyY2VudGFnZSA9IE1hdGgucm91bmQoKHVzZWRNZW1vcnkgLyB0b3RhbE1lbW9yeSkgKiAxMDApO1xuXG4gIHJldHVybiB7XG4gICAgdXNlZDogYCR7TWF0aC5yb3VuZCh1c2VkTWVtb3J5IC8gMTAyNCAvIDEwMjQpfU1CYCxcbiAgICBmcmVlOiBgJHtNYXRoLnJvdW5kKGZyZWVNZW1vcnkgLyAxMDI0IC8gMTAyNCl9TUJgLFxuICAgIHBlcmNlbnRhZ2VcbiAgfTtcbn0iXX0=