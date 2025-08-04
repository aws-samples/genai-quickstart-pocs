export interface PerformanceMetric {
    name: string;
    value: number;
    unit: 'Count' | 'Seconds' | 'Milliseconds' | 'Bytes' | 'Percent';
    dimensions?: Record<string, string>;
    timestamp?: Date;
}
export interface ErrorMetric {
    errorType: string;
    errorMessage: string;
    service: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    metadata?: Record<string, any>;
    timestamp?: Date;
}
export interface UsageMetric {
    userId?: string;
    organizationId?: string;
    action: string;
    resource: string;
    duration?: number;
    success: boolean;
    metadata?: Record<string, any>;
    timestamp?: Date;
}
export declare class MonitoringService {
    private cloudWatch;
    private namespace;
    private environment;
    constructor(region?: string, namespace?: string, environment?: string);
    /**
     * Record performance metrics
     */
    recordPerformanceMetric(metric: PerformanceMetric): Promise<void>;
    /**
     * Record multiple performance metrics in batch
     */
    recordPerformanceMetrics(metrics: PerformanceMetric[]): Promise<void>;
    /**
     * Record error metrics
     */
    recordError(error: ErrorMetric): Promise<void>;
    /**
     * Record usage analytics
     */
    recordUsage(usage: UsageMetric): Promise<void>;
    /**
     * Record API request metrics
     */
    recordApiRequest(endpoint: string, method: string, statusCode: number, duration: number, userId?: string, organizationId?: string): Promise<void>;
    /**
     * Record AI model usage metrics
     */
    recordModelUsage(modelName: string, operation: string, duration: number, success: boolean, tokenCount?: number, cost?: number): Promise<void>;
    /**
     * Record system health metrics
     */
    recordSystemHealth(service: string, healthStatus: 'healthy' | 'degraded' | 'unhealthy', responseTime?: number, errorRate?: number): Promise<void>;
    /**
     * Utility method to chunk arrays
     */
    private chunkArray;
}
export declare const monitoringService: MonitoringService;
