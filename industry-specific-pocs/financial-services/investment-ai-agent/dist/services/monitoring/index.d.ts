export { MonitoringService, monitoringService } from './monitoring-service';
export { AlertingService, alertingService } from './alerting-service';
export { UsageAnalyticsService, usageAnalyticsService } from './usage-analytics-service';
export type { PerformanceMetric, ErrorMetric, UsageMetric } from './monitoring-service';
export type { AlertRule, AlertNotification, AlertContext } from './alerting-service';
export type { UsageReport, EndpointUsage, ModelUsageStats, CostAnalysis, UserEngagementStats, FeatureUsage, AnalyticsQuery } from './usage-analytics-service';
export { performanceMonitoring, userContextMiddleware, businessMetricsMiddleware, errorTrackingMiddleware, healthCheckHandler } from '../../api/middleware/monitoring';
export declare const MonitoringUtils: {
    /**
     * Create a performance timer
     */
    createTimer: () => {
        end: () => number;
    };
    /**
     * Wrap a function with performance monitoring
     */
    withPerformanceMonitoring: <T extends (...args: any[]) => any>(fn: T, metricName: string, dimensions?: Record<string, string>) => T;
    /**
     * Wrap a function with error monitoring
     */
    withErrorMonitoring: <T_1 extends (...args: any[]) => any>(fn: T_1, service: string, operation: string) => T_1;
};
export declare function Monitor(metricName: string, dimensions?: Record<string, string>): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function ErrorTracking(service: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
