export interface UsageReport {
    period: {
        start: Date;
        end: Date;
    };
    totalRequests: number;
    uniqueUsers: number;
    uniqueOrganizations: number;
    topEndpoints: EndpointUsage[];
    errorRate: number;
    averageResponseTime: number;
    modelUsage: ModelUsageStats[];
    costAnalysis: CostAnalysis;
    userEngagement: UserEngagementStats;
}
export interface EndpointUsage {
    endpoint: string;
    method: string;
    requestCount: number;
    averageResponseTime: number;
    errorRate: number;
    uniqueUsers: number;
}
export interface ModelUsageStats {
    modelName: string;
    totalCalls: number;
    totalTokens: number;
    totalCost: number;
    averageResponseTime: number;
    successRate: number;
}
export interface CostAnalysis {
    totalCost: number;
    costByModel: Record<string, number>;
    costByOrganization: Record<string, number>;
    projectedMonthlyCost: number;
}
export interface UserEngagementStats {
    activeUsers: number;
    newUsers: number;
    returningUsers: number;
    averageSessionDuration: number;
    topFeatures: FeatureUsage[];
}
export interface FeatureUsage {
    feature: string;
    usageCount: number;
    uniqueUsers: number;
    averageUsagePerUser: number;
}
export interface AnalyticsQuery {
    startTime: Date;
    endTime: Date;
    organizationId?: string;
    userId?: string;
    service?: string;
    granularity?: 'hour' | 'day' | 'week' | 'month';
}
export declare class UsageAnalyticsService {
    private cloudWatch;
    private namespace;
    private environment;
    constructor(region?: string, namespace?: string, environment?: string);
    /**
     * Generate comprehensive usage report
     */
    generateUsageReport(query: AnalyticsQuery): Promise<UsageReport>;
    /**
     * Get total API requests for the period
     */
    private getTotalRequests;
    /**
     * Get error metrics for the period
     */
    private getErrorMetrics;
    /**
     * Get response time metrics
     */
    private getResponseTimeMetrics;
    /**
     * Get model usage statistics
     */
    private getModelUsageStats;
    /**
     * Get endpoint usage statistics
     */
    private getEndpointUsageStats;
    /**
     * Get user engagement statistics
     */
    private getUserEngagementStats;
    /**
     * Get cost analysis
     */
    private getCostAnalysis;
    /**
     * Get feature usage statistics
     */
    private getFeatureUsageStats;
    /**
     * Helper method to get metric sum
     */
    private getMetricSum;
    /**
     * Helper method to get metric average
     */
    private getMetricAverage;
    /**
     * Get model success rate
     */
    private getModelSuccessRate;
    /**
     * Get unique user count (simplified - would need more sophisticated tracking in real implementation)
     */
    private getUniqueUserCount;
    /**
     * Convert granularity to seconds
     */
    private getPeriodInSeconds;
    /**
     * Export usage data for external analysis
     */
    exportUsageData(query: AnalyticsQuery, format?: 'json' | 'csv'): Promise<string>;
    /**
     * Convert usage report to CSV format
     */
    private convertToCSV;
}
export declare const usageAnalyticsService: UsageAnalyticsService;
