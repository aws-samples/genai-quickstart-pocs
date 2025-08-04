export { MonitoringService, monitoringService } from './monitoring-service';
export { AlertingService, alertingService } from './alerting-service';
export { UsageAnalyticsService, usageAnalyticsService } from './usage-analytics-service';

export type {
  PerformanceMetric,
  ErrorMetric,
  UsageMetric
} from './monitoring-service';

export type {
  AlertRule,
  AlertNotification,
  AlertContext
} from './alerting-service';

export type {
  UsageReport,
  EndpointUsage,
  ModelUsageStats,
  CostAnalysis,
  UserEngagementStats,
  FeatureUsage,
  AnalyticsQuery
} from './usage-analytics-service';

// Monitoring middleware exports
export {
  performanceMonitoring,
  userContextMiddleware,
  businessMetricsMiddleware,
  errorTrackingMiddleware,
  healthCheckHandler
} from '../../api/middleware/monitoring';

// Utility functions for common monitoring tasks
export const MonitoringUtils = {
  /**
   * Create a performance timer
   */
  createTimer: () => {
    const start = Date.now();
    return {
      end: () => Date.now() - start
    };
  },

  /**
   * Wrap a function with performance monitoring
   */
  withPerformanceMonitoring: <T extends (...args: any[]) => any>(
    fn: T,
    metricName: string,
    dimensions?: Record<string, string>
  ): T => {
    return ((...args: any[]) => {
      const timer = MonitoringUtils.createTimer();
      
      try {
        const result = fn(...args);
        
        // Handle both sync and async functions
        if (result instanceof Promise) {
          return result
            .then(async (value) => {
              const { monitoringService } = await import('./monitoring-service');
              await monitoringService.recordPerformanceMetric({
                name: metricName,
                value: timer.end(),
                unit: 'Milliseconds',
                dimensions: { ...dimensions, Status: 'Success' }
              });
              return value;
            })
            .catch(async (error) => {
              const { monitoringService } = await import('./monitoring-service');
              await monitoringService.recordPerformanceMetric({
                name: metricName,
                value: timer.end(),
                unit: 'Milliseconds',
                dimensions: { ...dimensions, Status: 'Error' }
              });
              throw error;
            });
        } else {
          // For sync functions, we can't await the monitoring call
          import('./monitoring-service').then(({ monitoringService }) => {
            monitoringService.recordPerformanceMetric({
              name: metricName,
              value: timer.end(),
              unit: 'Milliseconds',
              dimensions: { ...dimensions, Status: 'Success' }
            });
          });
          return result;
        }
      } catch (error) {
        import('./monitoring-service').then(({ monitoringService }) => {
          monitoringService.recordPerformanceMetric({
            name: metricName,
            value: timer.end(),
            unit: 'Milliseconds',
            dimensions: { ...dimensions, Status: 'Error' }
          });
        });
        throw error;
      }
    }) as T;
  },

  /**
   * Wrap a function with error monitoring
   */
  withErrorMonitoring: <T extends (...args: any[]) => any>(
    fn: T,
    service: string,
    operation: string
  ): T => {
    return ((...args: any[]) => {
      try {
        const result = fn(...args);
        
        if (result instanceof Promise) {
          return result.catch(async (error) => {
            const { monitoringService } = await import('./monitoring-service');
            await monitoringService.recordError({
              errorType: error.name || 'UnknownError',
              errorMessage: error.message,
              service,
              severity: 'medium',
              metadata: {
                operation,
                args: args.length,
                timestamp: new Date().toISOString()
              }
            });
            throw error;
          });
        }
        
        return result;
      } catch (error) {
        import('./monitoring-service').then(({ monitoringService }) => {
          monitoringService.recordError({
            errorType: error instanceof Error ? error.name : 'UnknownError',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            service,
            severity: 'medium',
            metadata: {
              operation,
              args: args.length,
              timestamp: new Date().toISOString()
            }
          });
        });
        throw error;
      }
    }) as T;
  }
};

// Decorator for class methods (if using TypeScript decorators)
export function Monitor(metricName: string, dimensions?: Record<string, string>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = MonitoringUtils.withPerformanceMonitoring(
      originalMethod,
      metricName,
      dimensions
    );
    
    return descriptor;
  };
}

export function ErrorTracking(service: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = MonitoringUtils.withErrorMonitoring(
      originalMethod,
      service,
      propertyKey
    );
    
    return descriptor;
  };
}