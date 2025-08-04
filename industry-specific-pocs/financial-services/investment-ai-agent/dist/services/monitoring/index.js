"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorTracking = exports.Monitor = exports.MonitoringUtils = exports.healthCheckHandler = exports.errorTrackingMiddleware = exports.businessMetricsMiddleware = exports.userContextMiddleware = exports.performanceMonitoring = exports.usageAnalyticsService = exports.UsageAnalyticsService = exports.alertingService = exports.AlertingService = exports.monitoringService = exports.MonitoringService = void 0;
var monitoring_service_1 = require("./monitoring-service");
Object.defineProperty(exports, "MonitoringService", { enumerable: true, get: function () { return monitoring_service_1.MonitoringService; } });
Object.defineProperty(exports, "monitoringService", { enumerable: true, get: function () { return monitoring_service_1.monitoringService; } });
var alerting_service_1 = require("./alerting-service");
Object.defineProperty(exports, "AlertingService", { enumerable: true, get: function () { return alerting_service_1.AlertingService; } });
Object.defineProperty(exports, "alertingService", { enumerable: true, get: function () { return alerting_service_1.alertingService; } });
var usage_analytics_service_1 = require("./usage-analytics-service");
Object.defineProperty(exports, "UsageAnalyticsService", { enumerable: true, get: function () { return usage_analytics_service_1.UsageAnalyticsService; } });
Object.defineProperty(exports, "usageAnalyticsService", { enumerable: true, get: function () { return usage_analytics_service_1.usageAnalyticsService; } });
// Monitoring middleware exports
var monitoring_1 = require("../../api/middleware/monitoring");
Object.defineProperty(exports, "performanceMonitoring", { enumerable: true, get: function () { return monitoring_1.performanceMonitoring; } });
Object.defineProperty(exports, "userContextMiddleware", { enumerable: true, get: function () { return monitoring_1.userContextMiddleware; } });
Object.defineProperty(exports, "businessMetricsMiddleware", { enumerable: true, get: function () { return monitoring_1.businessMetricsMiddleware; } });
Object.defineProperty(exports, "errorTrackingMiddleware", { enumerable: true, get: function () { return monitoring_1.errorTrackingMiddleware; } });
Object.defineProperty(exports, "healthCheckHandler", { enumerable: true, get: function () { return monitoring_1.healthCheckHandler; } });
// Utility functions for common monitoring tasks
exports.MonitoringUtils = {
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
    withPerformanceMonitoring: (fn, metricName, dimensions) => {
        return ((...args) => {
            const timer = exports.MonitoringUtils.createTimer();
            try {
                const result = fn(...args);
                // Handle both sync and async functions
                if (result instanceof Promise) {
                    return result
                        .then(async (value) => {
                        const { monitoringService } = await Promise.resolve().then(() => __importStar(require('./monitoring-service')));
                        await monitoringService.recordPerformanceMetric({
                            name: metricName,
                            value: timer.end(),
                            unit: 'Milliseconds',
                            dimensions: { ...dimensions, Status: 'Success' }
                        });
                        return value;
                    })
                        .catch(async (error) => {
                        const { monitoringService } = await Promise.resolve().then(() => __importStar(require('./monitoring-service')));
                        await monitoringService.recordPerformanceMetric({
                            name: metricName,
                            value: timer.end(),
                            unit: 'Milliseconds',
                            dimensions: { ...dimensions, Status: 'Error' }
                        });
                        throw error;
                    });
                }
                else {
                    // For sync functions, we can't await the monitoring call
                    Promise.resolve().then(() => __importStar(require('./monitoring-service'))).then(({ monitoringService }) => {
                        monitoringService.recordPerformanceMetric({
                            name: metricName,
                            value: timer.end(),
                            unit: 'Milliseconds',
                            dimensions: { ...dimensions, Status: 'Success' }
                        });
                    });
                    return result;
                }
            }
            catch (error) {
                Promise.resolve().then(() => __importStar(require('./monitoring-service'))).then(({ monitoringService }) => {
                    monitoringService.recordPerformanceMetric({
                        name: metricName,
                        value: timer.end(),
                        unit: 'Milliseconds',
                        dimensions: { ...dimensions, Status: 'Error' }
                    });
                });
                throw error;
            }
        });
    },
    /**
     * Wrap a function with error monitoring
     */
    withErrorMonitoring: (fn, service, operation) => {
        return ((...args) => {
            try {
                const result = fn(...args);
                if (result instanceof Promise) {
                    return result.catch(async (error) => {
                        const { monitoringService } = await Promise.resolve().then(() => __importStar(require('./monitoring-service')));
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
            }
            catch (error) {
                Promise.resolve().then(() => __importStar(require('./monitoring-service'))).then(({ monitoringService }) => {
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
        });
    }
};
// Decorator for class methods (if using TypeScript decorators)
function Monitor(metricName, dimensions) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = exports.MonitoringUtils.withPerformanceMonitoring(originalMethod, metricName, dimensions);
        return descriptor;
    };
}
exports.Monitor = Monitor;
function ErrorTracking(service) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = exports.MonitoringUtils.withErrorMonitoring(originalMethod, service, propertyKey);
        return descriptor;
    };
}
exports.ErrorTracking = ErrorTracking;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2VydmljZXMvbW9uaXRvcmluZy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJEQUE0RTtBQUFuRSx1SEFBQSxpQkFBaUIsT0FBQTtBQUFFLHVIQUFBLGlCQUFpQixPQUFBO0FBQzdDLHVEQUFzRTtBQUE3RCxtSEFBQSxlQUFlLE9BQUE7QUFBRSxtSEFBQSxlQUFlLE9BQUE7QUFDekMscUVBQXlGO0FBQWhGLGdJQUFBLHFCQUFxQixPQUFBO0FBQUUsZ0lBQUEscUJBQXFCLE9BQUE7QUF3QnJELGdDQUFnQztBQUNoQyw4REFNeUM7QUFMdkMsbUhBQUEscUJBQXFCLE9BQUE7QUFDckIsbUhBQUEscUJBQXFCLE9BQUE7QUFDckIsdUhBQUEseUJBQXlCLE9BQUE7QUFDekIscUhBQUEsdUJBQXVCLE9BQUE7QUFDdkIsZ0hBQUEsa0JBQWtCLE9BQUE7QUFHcEIsZ0RBQWdEO0FBQ25DLFFBQUEsZUFBZSxHQUFHO0lBQzdCOztPQUVHO0lBQ0gsV0FBVyxFQUFFLEdBQUcsRUFBRTtRQUNoQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDekIsT0FBTztZQUNMLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsS0FBSztTQUM5QixDQUFDO0lBQ0osQ0FBQztJQUVEOztPQUVHO0lBQ0gseUJBQXlCLEVBQUUsQ0FDekIsRUFBSyxFQUNMLFVBQWtCLEVBQ2xCLFVBQW1DLEVBQ2hDLEVBQUU7UUFDTCxPQUFPLENBQUMsQ0FBQyxHQUFHLElBQVcsRUFBRSxFQUFFO1lBQ3pCLE1BQU0sS0FBSyxHQUFHLHVCQUFlLENBQUMsV0FBVyxFQUFFLENBQUM7WUFFNUMsSUFBSTtnQkFDRixNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMs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Y0FBYyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUM7UUFFeEMsVUFBVSxDQUFDLEtBQUssR0FBRyx1QkFBZSxDQUFDLHlCQUF5QixDQUMxRCxjQUFjLEVBQ2QsVUFBVSxFQUNWLFVBQVUsQ0FDWCxDQUFDO1FBRUYsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQVpELDBCQVlDO0FBRUQsU0FBZ0IsYUFBYSxDQUFDLE9BQWU7SUFDM0MsT0FBTyxVQUFVLE1BQVcsRUFBRSxXQUFtQixFQUFFLFVBQThCO1FBQy9FLE1BQU0sY0FBYyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUM7UUFFeEMsVUFBVSxDQUFDLEtBQUssR0FBRyx1QkFBZSxDQUFDLG1CQUFtQixDQUNwRCxjQUFjLEVBQ2QsT0FBTyxFQUNQLFdBQVcsQ0FDWixDQUFDO1FBRUYsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQVpELHNDQVlDIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IHsgTW9uaXRvcmluZ1NlcnZpY2UsIG1vbml0b3JpbmdTZXJ2aWNlIH0gZnJvbSAnLi9tb25pdG9yaW5nLXNlcnZpY2UnO1xuZXhwb3J0IHsgQWxlcnRpbmdTZXJ2aWNlLCBhbGVydGluZ1NlcnZpY2UgfSBmcm9tICcuL2FsZXJ0aW5nLXNlcnZpY2UnO1xuZXhwb3J0IHsgVXNhZ2VBbmFseXRpY3NTZXJ2aWNlLCB1c2FnZUFuYWx5dGljc1NlcnZpY2UgfSBmcm9tICcuL3VzYWdlLWFuYWx5dGljcy1zZXJ2aWNlJztcblxuZXhwb3J0IHR5cGUge1xuICBQZXJmb3JtYW5jZU1ldHJpYyxcbiAgRXJyb3JNZXRyaWMsXG4gIFVzYWdlTWV0cmljXG59IGZyb20gJy4vbW9uaXRvcmluZy1zZXJ2aWNlJztcblxuZXhwb3J0IHR5cGUge1xuICBBbGVydFJ1bGUsXG4gIEFsZXJ0Tm90aWZpY2F0aW9uLFxuICBBbGVydENvbnRleHRcbn0gZnJvbSAnLi9hbGVydGluZy1zZXJ2aWNlJztcblxuZXhwb3J0IHR5cGUge1xuICBVc2FnZVJlcG9ydCxcbiAgRW5kcG9pbnRVc2FnZSxcbiAgTW9kZWxVc2FnZVN0YXRzLFxuICBDb3N0QW5hbHlzaXMsXG4gIFVzZXJFbmdhZ2VtZW50U3RhdHMsXG4gIEZlYXR1cmVVc2FnZSxcbiAgQW5hbHl0aWNzUXVlcnlcbn0gZnJvbSAnLi91c2FnZS1hbmFseXRpY3Mtc2VydmljZSc7XG5cbi8vIE1vbml0b3JpbmcgbWlkZGxld2FyZSBleHBvcnRzXG5leHBvcnQge1xuICBwZXJmb3JtYW5jZU1vbml0b3JpbmcsXG4gIHVzZXJDb250ZXh0TWlkZGxld2FyZSxcbiAgYnVzaW5lc3NNZXRyaWNzTWlkZGxld2FyZSxcbiAgZXJyb3JUcmFja2luZ01pZGRsZXdhcmUsXG4gIGhlYWx0aENoZWNrSGFuZGxlclxufSBmcm9tICcuLi8uLi9hcGkvbWlkZGxld2FyZS9tb25pdG9yaW5nJztcblxuLy8gVXRpbGl0eSBmdW5jdGlvbnMgZm9yIGNvbW1vbiBtb25pdG9yaW5nIHRhc2tzXG5leHBvcnQgY29uc3QgTW9uaXRvcmluZ1V0aWxzID0ge1xuICAvKipcbiAgICogQ3JlYXRlIGEgcGVyZm9ybWFuY2UgdGltZXJcbiAgICovXG4gIGNyZWF0ZVRpbWVyOiAoKSA9PiB7XG4gICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgIHJldHVybiB7XG4gICAgICBlbmQ6ICgpID0+IERhdGUubm93KCkgLSBzdGFydFxuICAgIH07XG4gIH0sXG5cbiAgLyoqXG4gICAqIFdyYXAgYSBmdW5jdGlvbiB3aXRoIHBlcmZvcm1hbmNlIG1vbml0b3JpbmdcbiAgICovXG4gIHdpdGhQZXJmb3JtYW5jZU1vbml0b3Jpbmc6IDxUIGV4dGVuZHMgKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnk+KFxuICAgIGZuOiBULFxuICAgIG1ldHJpY05hbWU6IHN0cmluZyxcbiAgICBkaW1lbnNpb25zPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPlxuICApOiBUID0+IHtcbiAgICByZXR1cm4gKCguLi5hcmdzOiBhbnlbXSkgPT4ge1xuICAgICAgY29uc3QgdGltZXIgPSBNb25pdG9yaW5nVXRpbHMuY3JlYXRlVGltZXIoKTtcbiAgICAgIFxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gZm4oLi4uYXJncyk7XG4gICAgICAgIFxuICAgICAgICAvLyBIYW5kbGUgYm90aCBzeW5jIGFuZCBhc3luYyBmdW5jdGlvbnNcbiAgICAgICAgaWYgKHJlc3VsdCBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgICByZXR1cm4gcmVzdWx0XG4gICAgICAgICAgICAudGhlbihhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgeyBtb25pdG9yaW5nU2VydmljZSB9ID0gYXdhaXQgaW1wb3J0KCcuL21vbml0b3Jpbmctc2VydmljZScpO1xuICAgICAgICAgICAgICBhd2FpdCBtb25pdG9yaW5nU2VydmljZS5yZWNvcmRQZXJmb3JtYW5jZU1ldHJpYyh7XG4gICAgICAgICAgICAgICAgbmFtZTogbWV0cmljTmFtZSxcbiAgICAgICAgICAgICAgICB2YWx1ZTogdGltZXIuZW5kKCksXG4gICAgICAgICAgICAgICAgdW5pdDogJ01pbGxpc2Vjb25kcycsXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uczogeyAuLi5kaW1lbnNpb25zLCBTdGF0dXM6ICdTdWNjZXNzJyB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGFzeW5jIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICBjb25zdCB7IG1vbml0b3JpbmdTZXJ2aWNlIH0gPSBhd2FpdCBpbXBvcnQoJy4vbW9uaXRvcmluZy1zZXJ2aWNlJyk7XG4gICAgICAgICAgICAgIGF3YWl0IG1vbml0b3JpbmdTZXJ2aWNlLnJlY29yZFBlcmZvcm1hbmNlTWV0cmljKHtcbiAgICAgICAgICAgICAgICBuYW1lOiBtZXRyaWNOYW1lLFxuICAgICAgICAgICAgICAgIHZhbHVlOiB0aW1lci5lbmQoKSxcbiAgICAgICAgICAgICAgICB1bml0OiAnTWlsbGlzZWNvbmRzJyxcbiAgICAgICAgICAgICAgICBkaW1lbnNpb25zOiB7IC4uLmRpbWVuc2lvbnMsIFN0YXR1czogJ0Vycm9yJyB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEZvciBzeW5jIGZ1bmN0aW9ucywgd2UgY2FuJ3QgYXdhaXQgdGhlIG1vbml0b3JpbmcgY2FsbFxuICAgICAgICAgIGltcG9ydCgnLi9tb25pdG9yaW5nLXNlcnZpY2UnKS50aGVuKCh7IG1vbml0b3JpbmdTZXJ2aWNlIH0pID0+IHtcbiAgICAgICAgICAgIG1vbml0b3JpbmdTZXJ2aWNlLnJlY29yZFBlcmZvcm1hbmNlTWV0cmljKHtcbiAgICAgICAgICAgICAgbmFtZTogbWV0cmljTmFtZSxcbiAgICAgICAgICAgICAgdmFsdWU6IHRpbWVyLmVuZCgpLFxuICAgICAgICAgICAgICB1bml0OiAnTWlsbGlzZWNvbmRzJyxcbiAgICAgICAgICAgICAgZGltZW5zaW9uczogeyAuLi5kaW1lbnNpb25zLCBTdGF0dXM6ICdTdWNjZXNzJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBpbXBvcnQoJy4vbW9uaXRvcmluZy1zZXJ2aWNlJykudGhlbigoeyBtb25pdG9yaW5nU2VydmljZSB9KSA9PiB7XG4gICAgICAgICAgbW9uaXRvcmluZ1NlcnZpY2UucmVjb3JkUGVyZm9ybWFuY2VNZXRyaWMoe1xuICAgICAgICAgICAgbmFtZTogbWV0cmljTmFtZSxcbiAgICAgICAgICAgIHZhbHVlOiB0aW1lci5lbmQoKSxcbiAgICAgICAgICAgIHVuaXQ6ICdNaWxsaXNlY29uZHMnLFxuICAgICAgICAgICAgZGltZW5zaW9uczogeyAuLi5kaW1lbnNpb25zLCBTdGF0dXM6ICdFcnJvcicgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICB9XG4gICAgfSkgYXMgVDtcbiAgfSxcblxuICAvKipcbiAgICogV3JhcCBhIGZ1bmN0aW9uIHdpdGggZXJyb3IgbW9uaXRvcmluZ1xuICAgKi9cbiAgd2l0aEVycm9yTW9uaXRvcmluZzogPFQgZXh0ZW5kcyAoLi4uYXJnczogYW55W10pID0+IGFueT4oXG4gICAgZm46IFQsXG4gICAgc2VydmljZTogc3RyaW5nLFxuICAgIG9wZXJhdGlvbjogc3RyaW5nXG4gICk6IFQgPT4ge1xuICAgIHJldHVybiAoKC4uLmFyZ3M6IGFueVtdKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBmbiguLi5hcmdzKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChyZXN1bHQgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdC5jYXRjaChhc3luYyAoZXJyb3IpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHsgbW9uaXRvcmluZ1NlcnZpY2UgfSA9IGF3YWl0IGltcG9ydCgnLi9tb25pdG9yaW5nLXNlcnZpY2UnKTtcbiAgICAgICAgICAgIGF3YWl0IG1vbml0b3JpbmdTZXJ2aWNlLnJlY29yZEVycm9yKHtcbiAgICAgICAgICAgICAgZXJyb3JUeXBlOiBlcnJvci5uYW1lIHx8ICdVbmtub3duRXJyb3InLFxuICAgICAgICAgICAgICBlcnJvck1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UsXG4gICAgICAgICAgICAgIHNlcnZpY2UsXG4gICAgICAgICAgICAgIHNldmVyaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICAgICAgICBvcGVyYXRpb24sXG4gICAgICAgICAgICAgICAgYXJnczogYXJncy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGltcG9ydCgnLi9tb25pdG9yaW5nLXNlcnZpY2UnKS50aGVuKCh7IG1vbml0b3JpbmdTZXJ2aWNlIH0pID0+IHtcbiAgICAgICAgICBtb25pdG9yaW5nU2VydmljZS5yZWNvcmRFcnJvcih7XG4gICAgICAgICAgICBlcnJvclR5cGU6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5uYW1lIDogJ1Vua25vd25FcnJvcicsXG4gICAgICAgICAgICBlcnJvck1lc3NhZ2U6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgICAgICAgICAgc2VydmljZSxcbiAgICAgICAgICAgIHNldmVyaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgICAgIG9wZXJhdGlvbixcbiAgICAgICAgICAgICAgYXJnczogYXJncy5sZW5ndGgsXG4gICAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgIH1cbiAgICB9KSBhcyBUO1xuICB9XG59O1xuXG4vLyBEZWNvcmF0b3IgZm9yIGNsYXNzIG1ldGhvZHMgKGlmIHVzaW5nIFR5cGVTY3JpcHQgZGVjb3JhdG9ycylcbmV4cG9ydCBmdW5jdGlvbiBNb25pdG9yKG1ldHJpY05hbWU6IHN0cmluZywgZGltZW5zaW9ucz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQ6IGFueSwgcHJvcGVydHlLZXk6IHN0cmluZywgZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yKSB7XG4gICAgY29uc3Qgb3JpZ2luYWxNZXRob2QgPSBkZXNjcmlwdG9yLnZhbHVlO1xuICAgIFxuICAgIGRlc2NyaXB0b3IudmFsdWUgPSBNb25pdG9yaW5nVXRpbHMud2l0aFBlcmZvcm1hbmNlTW9uaXRvcmluZyhcbiAgICAgIG9yaWdpbmFsTWV0aG9kLFxuICAgICAgbWV0cmljTmFtZSxcbiAgICAgIGRpbWVuc2lvbnNcbiAgICApO1xuICAgIFxuICAgIHJldHVybiBkZXNjcmlwdG9yO1xuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gRXJyb3JUcmFja2luZyhzZXJ2aWNlOiBzdHJpbmcpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQ6IGFueSwgcHJvcGVydHlLZXk6IHN0cmluZywgZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yKSB7XG4gICAgY29uc3Qgb3JpZ2luYWxNZXRob2QgPSBkZXNjcmlwdG9yLnZhbHVlO1xuICAgIFxuICAgIGRlc2NyaXB0b3IudmFsdWUgPSBNb25pdG9yaW5nVXRpbHMud2l0aEVycm9yTW9uaXRvcmluZyhcbiAgICAgIG9yaWdpbmFsTWV0aG9kLFxuICAgICAgc2VydmljZSxcbiAgICAgIHByb3BlcnR5S2V5XG4gICAgKTtcbiAgICBcbiAgICByZXR1cm4gZGVzY3JpcHRvcjtcbiAgfTtcbn0iXX0=