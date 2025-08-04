import { Request, Response, NextFunction } from 'express';
import { monitoringService } from '../../services/monitoring/monitoring-service';
import { alertingService } from '../../services/monitoring/alerting-service';

export interface MonitoringRequest extends Request {
  startTime?: number;
  userId?: string;
  organizationId?: string;
}

/**
 * Middleware to track API performance metrics
 */
export const performanceMonitoring = (
  req: MonitoringRequest,
  res: Response,
  next: NextFunction
): void => {
  // Record start time
  req.startTime = Date.now();

  // Override res.end to capture metrics when response is sent
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const duration = Date.now() - (req.startTime || Date.now());
    const endpoint = req.route?.path || req.path;
    const method = req.method;
    const statusCode = res.statusCode;

    // Record API request metrics
    monitoringService.recordApiRequest(
      endpoint,
      method,
      statusCode,
      duration,
      req.userId,
      req.organizationId
    ).catch(error => {
      console.error('Failed to record API metrics:', error);
    });

    // Send alerts for slow requests or errors
    if (duration > 10000) { // 10 seconds
      alertingService.sendMediumAlert(
        'API',
        `Slow API request detected: ${method} ${endpoint} took ${duration}ms`,
        {
          endpoint,
          method,
          duration,
          statusCode,
          userId: req.userId,
          organizationId: req.organizationId
        }
      ).catch(error => {
        console.error('Failed to send slow request alert:', error);
      });
    }

    if (statusCode >= 500) {
      alertingService.sendHighAlert(
        'API',
        `Server error detected: ${method} ${endpoint} returned ${statusCode}`,
        {
          endpoint,
          method,
          statusCode,
          duration,
          userId: req.userId,
          organizationId: req.organizationId
        }
      ).catch(error => {
        console.error('Failed to send error alert:', error);
      });
    }

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Middleware to extract user context for monitoring
 */
export const userContextMiddleware = (
  req: MonitoringRequest,
  res: Response,
  next: NextFunction
): void => {
  // Extract user information from JWT token or headers
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      // In a real implementation, you would decode the JWT token here
      // For now, we'll extract from custom headers if available
      req.userId = req.headers['x-user-id'] as string;
      req.organizationId = req.headers['x-organization-id'] as string;
    } catch (error) {
      console.error('Failed to extract user context:', error);
    }
  }

  next();
};

/**
 * Middleware to track specific business metrics
 */
export const businessMetricsMiddleware = (
  req: MonitoringRequest,
  res: Response,
  next: NextFunction
): void => {
  // Override res.json to capture business-specific metrics
  const originalJson = res.json;
  res.json = function(body?: any): Response {
    const endpoint = req.route?.path || req.path;
    const method = req.method;

    // Track specific business events based on endpoint
    if (endpoint.includes('/ideas/generate') && method === 'POST') {
      monitoringService.recordUsage({
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
      monitoringService.recordUsage({
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
      monitoringService.recordUsage({
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

/**
 * Error tracking middleware
 */
export const errorTrackingMiddleware = (
  error: Error,
  req: MonitoringRequest,
  res: Response,
  next: NextFunction
): void => {
  const endpoint = req.route?.path || req.path;
  const method = req.method;

  // Determine error severity based on error type
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  
  if (error.name === 'ValidationError') {
    severity = 'low';
  } else if (error.name === 'AuthenticationError' || error.name === 'AuthorizationError') {
    severity = 'medium';
  } else if (error.name === 'DatabaseError' || error.name === 'ExternalServiceError') {
    severity = 'high';
  } else if (error.name === 'SystemError' || error.message.includes('CRITICAL')) {
    severity = 'critical';
  }

  // Record error metric
  monitoringService.recordError({
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
    alertingService.sendAlert({
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

/**
 * Health check endpoint with monitoring
 */
export const healthCheckHandler = async (req: Request, res: Response): Promise<void> => {
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

    const isHealthy = Object.values(healthChecks).every(check => 
      typeof check === 'boolean' ? check : true
    );

    const responseTime = Date.now() - startTime;

    // Record system health metrics
    await monitoringService.recordSystemHealth(
      'API',
      isHealthy ? 'healthy' : 'degraded',
      responseTime
    );

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      checks: healthChecks,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    await monitoringService.recordSystemHealth(
      'API',
      'unhealthy',
      responseTime
    );

    await alertingService.sendHighAlert(
      'API',
      'Health check failed',
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );

    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${responseTime}ms`
    });
  }
};

/**
 * Check database connectivity
 */
async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Implement actual database health check
    // For now, return true as placeholder
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Check external services health
 */
async function checkExternalServicesHealth(): Promise<boolean> {
  try {
    // Implement actual external service health checks
    // For now, return true as placeholder
    return true;
  } catch (error) {
    console.error('External services health check failed:', error);
    return false;
  }
}

/**
 * Check memory usage
 */
function checkMemoryUsage(): { used: string; free: string; percentage: number } {
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