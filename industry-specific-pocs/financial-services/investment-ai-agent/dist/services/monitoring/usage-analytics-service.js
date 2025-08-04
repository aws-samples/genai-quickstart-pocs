"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usageAnalyticsService = exports.UsageAnalyticsService = void 0;
const aws_sdk_1 = require("aws-sdk");
class UsageAnalyticsService {
    constructor(region = 'us-east-1', namespace = 'InvestmentAI', environment = 'dev') {
        this.cloudWatch = new aws_sdk_1.CloudWatch({ region });
        this.namespace = namespace;
        this.environment = environment;
    }
    /**
     * Generate comprehensive usage report
     */
    async generateUsageReport(query) {
        try {
            const [totalRequests, errorMetrics, responseTimeMetrics, modelUsageStats, endpointStats, userStats] = await Promise.all([
                this.getTotalRequests(query),
                this.getErrorMetrics(query),
                this.getResponseTimeMetrics(query),
                this.getModelUsageStats(query),
                this.getEndpointUsageStats(query),
                this.getUserEngagementStats(query)
            ]);
            const costAnalysis = await this.getCostAnalysis(query);
            return {
                period: {
                    start: query.startTime,
                    end: query.endTime
                },
                totalRequests: totalRequests.sum || 0,
                uniqueUsers: userStats.activeUsers,
                uniqueOrganizations: 0,
                topEndpoints: endpointStats,
                errorRate: errorMetrics.errorRate,
                averageResponseTime: responseTimeMetrics.average || 0,
                modelUsage: modelUsageStats,
                costAnalysis,
                userEngagement: userStats
            };
        }
        catch (error) {
            console.error('Failed to generate usage report:', error);
            throw error;
        }
    }
    /**
     * Get total API requests for the period
     */
    async getTotalRequests(query) {
        const params = {
            MetricName: 'ApiRequestCount',
            Namespace: this.namespace,
            StartTime: query.startTime,
            EndTime: query.endTime,
            Period: this.getPeriodInSeconds(query.granularity || 'hour'),
            Statistics: ['Sum'],
            Dimensions: [
                { Name: 'Environment', Value: this.environment }
            ]
        };
        if (query.organizationId) {
            params.Dimensions.push({ Name: 'OrganizationId', Value: query.organizationId });
        }
        const result = await this.cloudWatch.getMetricStatistics(params).promise();
        const sum = result.Datapoints?.reduce((total, point) => total + (point.Sum || 0), 0) || 0;
        return { sum, datapoints: result.Datapoints || [] };
    }
    /**
     * Get error metrics for the period
     */
    async getErrorMetrics(query) {
        const [totalRequests, totalErrors] = await Promise.all([
            this.getTotalRequests(query),
            this.getMetricSum('ApiRequestError', query)
        ]);
        const errorRate = totalRequests.sum > 0 ? (totalErrors / totalRequests.sum) * 100 : 0;
        return { errorRate, totalErrors };
    }
    /**
     * Get response time metrics
     */
    async getResponseTimeMetrics(query) {
        const params = {
            MetricName: 'ApiRequestDuration',
            Namespace: this.namespace,
            StartTime: query.startTime,
            EndTime: query.endTime,
            Period: this.getPeriodInSeconds(query.granularity || 'hour'),
            Statistics: ['Average'],
            ExtendedStatistics: ['p95', 'p99'],
            Dimensions: [
                { Name: 'Environment', Value: this.environment }
            ]
        };
        if (query.organizationId) {
            params.Dimensions.push({ Name: 'OrganizationId', Value: query.organizationId });
        }
        const result = await this.cloudWatch.getMetricStatistics(params).promise();
        const datapoints = result.Datapoints || [];
        const average = datapoints.reduce((sum, point) => sum + (point.Average || 0), 0) / (datapoints.length || 1);
        const p95 = datapoints.reduce((sum, point) => sum + (point.ExtendedStatistics?.p95 || 0), 0) / (datapoints.length || 1);
        const p99 = datapoints.reduce((sum, point) => sum + (point.ExtendedStatistics?.p99 || 0), 0) / (datapoints.length || 1);
        return { average, p95, p99 };
    }
    /**
     * Get model usage statistics
     */
    async getModelUsageStats(query) {
        // Get unique model names (in a real implementation, this would come from a configuration or discovery)
        const modelNames = ['Claude-Sonnet-3.7', 'Claude-Haiku-3.5', 'Amazon-Nova-Pro'];
        const modelStats = await Promise.all(modelNames.map(async (modelName) => {
            const [totalCalls, totalTokens, totalCost, responseTime, successRate] = await Promise.all([
                this.getMetricSum('ModelUsageCount', query, { ModelName: modelName }),
                this.getMetricSum('ModelTokenCount', query, { ModelName: modelName }),
                this.getMetricSum('ModelUsageCost', query, { ModelName: modelName }),
                this.getMetricAverage('ModelUsageDuration', query, { ModelName: modelName }),
                this.getModelSuccessRate(modelName, query)
            ]);
            return {
                modelName,
                totalCalls,
                totalTokens,
                totalCost,
                averageResponseTime: responseTime,
                successRate
            };
        }));
        return modelStats.filter(stats => stats.totalCalls > 0);
    }
    /**
     * Get endpoint usage statistics
     */
    async getEndpointUsageStats(query) {
        // In a real implementation, you would dynamically discover endpoints
        const commonEndpoints = [
            { endpoint: '/api/v1/ideas/generate', method: 'POST' },
            { endpoint: '/api/v1/knowledge/upload', method: 'POST' },
            { endpoint: '/api/v1/feedback', method: 'POST' },
            { endpoint: '/api/v1/market/signals', method: 'GET' },
            { endpoint: '/api/v1/ideas/{id}', method: 'GET' }
        ];
        const endpointStats = await Promise.all(commonEndpoints.map(async ({ endpoint, method }) => {
            const dimensions = {
                Environment: this.environment,
                Endpoint: endpoint,
                Method: method
            };
            const [requestCount, averageResponseTime, errorCount] = await Promise.all([
                this.getMetricSum('ApiRequestCount', query, dimensions),
                this.getMetricAverage('ApiRequestDuration', query, dimensions),
                this.getMetricSum('ApiRequestError', query, dimensions)
            ]);
            const errorRate = requestCount > 0 ? (errorCount / requestCount) * 100 : 0;
            return {
                endpoint,
                method,
                requestCount,
                averageResponseTime,
                errorRate,
                uniqueUsers: 0 // Would need additional tracking to get unique users per endpoint
            };
        }));
        return endpointStats
            .filter(stats => stats.requestCount > 0)
            .sort((a, b) => b.requestCount - a.requestCount);
    }
    /**
     * Get user engagement statistics
     */
    async getUserEngagementStats(query) {
        const [activeUsers, totalUsage, featureUsage] = await Promise.all([
            this.getUniqueUserCount(query),
            this.getMetricSum('UsageCount', query),
            this.getFeatureUsageStats(query)
        ]);
        return {
            activeUsers,
            newUsers: 0,
            returningUsers: 0,
            averageSessionDuration: 0,
            topFeatures: featureUsage,
        };
    }
    /**
     * Get cost analysis
     */
    async getCostAnalysis(query) {
        const totalCost = await this.getMetricSum('ModelUsageCost', query);
        // Get cost by model
        const modelNames = ['Claude-Sonnet-3.7', 'Claude-Haiku-3.5', 'Amazon-Nova-Pro'];
        const costByModel = {};
        for (const modelName of modelNames) {
            costByModel[modelName] = await this.getMetricSum('ModelUsageCost', query, { ModelName: modelName });
        }
        // Calculate projected monthly cost
        const periodDays = (query.endTime.getTime() - query.startTime.getTime()) / (1000 * 60 * 60 * 24);
        const projectedMonthlyCost = periodDays > 0 ? (totalCost / periodDays) * 30 : 0;
        return {
            totalCost,
            costByModel,
            costByOrganization: {},
            projectedMonthlyCost
        };
    }
    /**
     * Get feature usage statistics
     */
    async getFeatureUsageStats(query) {
        const features = [
            'generate_investment_idea',
            'upload_proprietary_data',
            'submit_feedback',
            'query_market_data'
        ];
        const featureStats = await Promise.all(features.map(async (feature) => {
            const usageCount = await this.getMetricSum('UsageCount', query, { Action: feature });
            return {
                feature,
                usageCount,
                uniqueUsers: 0,
                averageUsagePerUser: 0 // Would need additional tracking
            };
        }));
        return featureStats
            .filter(stats => stats.usageCount > 0)
            .sort((a, b) => b.usageCount - a.usageCount);
    }
    /**
     * Helper method to get metric sum
     */
    async getMetricSum(metricName, query, additionalDimensions) {
        const dimensions = [
            { Name: 'Environment', Value: this.environment }
        ];
        if (query.organizationId) {
            dimensions.push({ Name: 'OrganizationId', Value: query.organizationId });
        }
        if (additionalDimensions) {
            Object.entries(additionalDimensions).forEach(([key, value]) => {
                dimensions.push({ Name: key, Value: value });
            });
        }
        const params = {
            MetricName: metricName,
            Namespace: this.namespace,
            StartTime: query.startTime,
            EndTime: query.endTime,
            Period: this.getPeriodInSeconds(query.granularity || 'hour'),
            Statistics: ['Sum'],
            Dimensions: dimensions
        };
        const result = await this.cloudWatch.getMetricStatistics(params).promise();
        return result.Datapoints?.reduce((total, point) => total + (point.Sum || 0), 0) || 0;
    }
    /**
     * Helper method to get metric average
     */
    async getMetricAverage(metricName, query, additionalDimensions) {
        const dimensions = [
            { Name: 'Environment', Value: this.environment }
        ];
        if (query.organizationId) {
            dimensions.push({ Name: 'OrganizationId', Value: query.organizationId });
        }
        if (additionalDimensions) {
            Object.entries(additionalDimensions).forEach(([key, value]) => {
                dimensions.push({ Name: key, Value: value });
            });
        }
        const params = {
            MetricName: metricName,
            Namespace: this.namespace,
            StartTime: query.startTime,
            EndTime: query.endTime,
            Period: this.getPeriodInSeconds(query.granularity || 'hour'),
            Statistics: ['Average'],
            Dimensions: dimensions
        };
        const result = await this.cloudWatch.getMetricStatistics(params).promise();
        const datapoints = result.Datapoints || [];
        return datapoints.reduce((sum, point) => sum + (point.Average || 0), 0) / (datapoints.length || 1);
    }
    /**
     * Get model success rate
     */
    async getModelSuccessRate(modelName, query) {
        const [totalCalls, successfulCalls] = await Promise.all([
            this.getMetricSum('ModelUsageCount', query, { ModelName: modelName }),
            this.getMetricSum('ModelUsageCount', query, { ModelName: modelName, Success: 'true' })
        ]);
        return totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
    }
    /**
     * Get unique user count (simplified - would need more sophisticated tracking in real implementation)
     */
    async getUniqueUserCount(query) {
        // This is a simplified implementation
        // In reality, you'd need to track unique users separately
        const totalUsage = await this.getMetricSum('UsageCount', query);
        return Math.ceil(totalUsage / 10); // Rough estimate
    }
    /**
     * Convert granularity to seconds
     */
    getPeriodInSeconds(granularity) {
        switch (granularity) {
            case 'hour': return 3600;
            case 'day': return 86400;
            case 'week': return 604800;
            case 'month': return 2592000;
            default: return 3600;
        }
    }
    /**
     * Export usage data for external analysis
     */
    async exportUsageData(query, format = 'json') {
        const report = await this.generateUsageReport(query);
        if (format === 'json') {
            return JSON.stringify(report, null, 2);
        }
        else {
            // Convert to CSV format
            return this.convertToCSV(report);
        }
    }
    /**
     * Convert usage report to CSV format
     */
    convertToCSV(report) {
        const lines = [];
        // Header
        lines.push('Metric,Value,Period Start,Period End');
        // Basic metrics
        lines.push(`Total Requests,${report.totalRequests},${report.period.start.toISOString()},${report.period.end.toISOString()}`);
        lines.push(`Unique Users,${report.uniqueUsers},${report.period.start.toISOString()},${report.period.end.toISOString()}`);
        lines.push(`Error Rate,${report.errorRate}%,${report.period.start.toISOString()},${report.period.end.toISOString()}`);
        lines.push(`Average Response Time,${report.averageResponseTime}ms,${report.period.start.toISOString()},${report.period.end.toISOString()}`);
        lines.push(`Total Cost,$${report.costAnalysis.totalCost},${report.period.start.toISOString()},${report.period.end.toISOString()}`);
        return lines.join('\n');
    }
}
exports.UsageAnalyticsService = UsageAnalyticsService;
// Singleton instance
exports.usageAnalyticsService = new UsageAnalyticsService(process.env.AWS_REGION || 'us-east-1', process.env.CLOUDWATCH_NAMESPACE || 'InvestmentAI', process.env.NODE_ENV || 'dev');
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNhZ2UtYW5hbHl0aWNzLXNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2VydmljZXMvbW9uaXRvcmluZy91c2FnZS1hbmFseXRpY3Mtc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FBcUM7QUFvRXJDLE1BQWEscUJBQXFCO0lBS2hDLFlBQ0UsU0FBaUIsV0FBVyxFQUM1QixZQUFvQixjQUFjLEVBQ2xDLGNBQXNCLEtBQUs7UUFFM0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLG9CQUFVLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBQzNCLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO0lBQ2pDLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxLQUFxQjtRQUM3QyxJQUFJO1lBQ0YsTUFBTSxDQUNKLGFBQWEsRUFDYixZQUFZLEVBQ1osbUJBQW1CLEVBQ25CLGVBQWUsRUFDZixhQUFhLEVBQ2IsU0FBUyxDQUNWLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDO2dCQUNwQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDO2dCQUM1QixJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQztnQkFDM0IsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQztnQkFDbEMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQztnQkFDOUIsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQztnQkFDakMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQzthQUNuQyxDQUFDLENBQUM7WUFFSCxNQUFNLFlBQVksR0FBRyxNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFdkQsT0FBTztnQkFDTCxNQUFNLEVBQUU7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QUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdEgsS0FBSyxDQUFDLElBQUksQ0FBQyx5QkFBeUIsTUFBTSxDQUFDLG1CQUFtQixNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUM1SSxLQUFLLENBQUMsSUFBSSxDQUFDLGVBQWUsTUFBTSxDQUFDLFlBQVksQ0FBQyxTQUFTLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRW5JLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMxQixDQUFDO0NBQ0Y7QUF0YUQsc0RBc2FDO0FBRUQscUJBQXFCO0FBQ1IsUUFBQSxxQkFBcUIsR0FBRyxJQUFJLHFCQUFxQixDQUM1RCxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsSUFBSSxXQUFXLEVBQ3JDLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLElBQUksY0FBYyxFQUNsRCxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsSUFBSSxLQUFLLENBQzlCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDbG91ZFdhdGNoIH0gZnJvbSAnYXdzLXNkayc7XG5pbXBvcnQgeyBtb25pdG9yaW5nU2VydmljZSB9IGZyb20gJy4vbW9uaXRvcmluZy1zZXJ2aWNlJztcblxuZXhwb3J0IGludGVyZmFjZSBVc2FnZVJlcG9ydCB7XG4gIHBlcmlvZDoge1xuICAgIHN0YXJ0OiBEYXRlO1xuICAgIGVuZDogRGF0ZTtcbiAgfTtcbiAgdG90YWxSZXF1ZXN0czogbnVtYmVyO1xuICB1bmlxdWVVc2VyczogbnVtYmVyO1xuICB1bmlxdWVPcmdhbml6YXRpb25zOiBudW1iZXI7XG4gIHRvcEVuZHBvaW50czogRW5kcG9pbnRVc2FnZVtdO1xuICBlcnJvclJhdGU6IG51bWJlcjtcbiAgYXZlcmFnZVJlc3BvbnNlVGltZTogbnVtYmVyO1xuICBtb2RlbFVzYWdlOiBNb2RlbFVzYWdlU3RhdHNbXTtcbiAgY29zdEFuYWx5c2lzOiBDb3N0QW5hbHlzaXM7XG4gIHVzZXJFbmdhZ2VtZW50OiBVc2VyRW5nYWdlbWVudFN0YXRzO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEVuZHBvaW50VXNhZ2Uge1xuICBlbmRwb2ludDogc3RyaW5nO1xuICBtZXRob2Q6IHN0cmluZztcbiAgcmVxdWVzdENvdW50OiBudW1iZXI7XG4gIGF2ZXJhZ2VSZXNwb25zZVRpbWU6IG51bWJlcjtcbiAgZXJyb3JSYXRlOiBudW1iZXI7XG4gIHVuaXF1ZVVzZXJzOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTW9kZWxVc2FnZVN0YXRzIHtcbiAgbW9kZWxOYW1lOiBzdHJpbmc7XG4gIHRvdGFsQ2FsbHM6IG51bWJlcjtcbiAgdG90YWxUb2tlbnM6IG51bWJlcjtcbiAgdG90YWxDb3N0OiBudW1iZXI7XG4gIGF2ZXJhZ2VSZXNwb25zZVRpbWU6IG51bWJlcjtcbiAgc3VjY2Vzc1JhdGU6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb3N0QW5hbHlzaXMge1xuICB0b3RhbENvc3Q6IG51bWJlcjtcbiAgY29zdEJ5TW9kZWw6IFJlY29yZDxzdHJpbmcsIG51bWJlcj47XG4gIGNvc3RCeU9yZ2FuaXphdGlvbjogUmVjb3JkPHN0cmluZywgbnVtYmVyPjtcbiAgcHJvamVjdGVkTW9udGhseUNvc3Q6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBVc2VyRW5nYWdlbWVudFN0YXRzIHtcbiAgYWN0aXZlVXNlcnM6IG51bWJlcjtcbiAgbmV3VXNlcnM6IG51bWJlcjtcbiAgcmV0dXJuaW5nVXNlcnM6IG51bWJlcjtcbiAgYXZlcmFnZVNlc3Npb25EdXJhdGlvbjogbnVtYmVyO1xuICB0b3BGZWF0dXJlczogRmVhdHVyZVVzYWdlW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRmVhdHVyZVVzYWdlIHtcbiAgZmVhdHVyZTogc3RyaW5nO1xuICB1c2FnZUNvdW50OiBudW1iZXI7XG4gIHVuaXF1ZVVzZXJzOiBudW1iZXI7XG4gIGF2ZXJhZ2VVc2FnZVBlclVzZXI6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBbmFseXRpY3NRdWVyeSB7XG4gIHN0YXJ0VGltZTogRGF0ZTtcbiAgZW5kVGltZTogRGF0ZTtcbiAgb3JnYW5pemF0aW9uSWQ/OiBzdHJpbmc7XG4gIHVzZXJJZD86IHN0cmluZztcbiAgc2VydmljZT86IHN0cmluZztcbiAgZ3JhbnVsYXJpdHk/OiAnaG91cicgfCAnZGF5JyB8ICd3ZWVrJyB8ICdtb250aCc7XG59XG5cbmV4cG9ydCBjbGFzcyBVc2FnZUFuYWx5dGljc1NlcnZpY2Uge1xuICBwcml2YXRlIGNsb3VkV2F0Y2g6IENsb3VkV2F0Y2g7XG4gIHByaXZhdGUgbmFtZXNwYWNlOiBzdHJpbmc7XG4gIHByaXZhdGUgZW52aXJvbm1lbnQ6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihcbiAgICByZWdpb246IHN0cmluZyA9ICd1cy1lYXN0LTEnLFxuICAgIG5hbWVzcGFjZTogc3RyaW5nID0gJ0ludmVzdG1lbnRBSScsXG4gICAgZW52aXJvbm1lbnQ6IHN0cmluZyA9ICdkZXYnXG4gICkge1xuICAgIHRoaXMuY2xvdWRXYXRjaCA9IG5ldyBDbG91ZFdhdGNoKHsgcmVnaW9uIH0pO1xuICAgIHRoaXMubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuICAgIHRoaXMuZW52aXJvbm1lbnQgPSBlbnZpcm9ubWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBjb21wcmVoZW5zaXZlIHVzYWdlIHJlcG9ydFxuICAgKi9cbiAgYXN5bmMgZ2VuZXJhdGVVc2FnZVJlcG9ydChxdWVyeTogQW5hbHl0aWNzUXVlcnkpOiBQcm9taXNlPFVzYWdlUmVwb3J0PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IFtcbiAgICAgICAgdG90YWxSZXF1ZXN0cyxcbiAgICAgICAgZXJyb3JNZXRyaWNzLFxuICAgICAgICByZXNwb25zZVRpbWVNZXRyaWNzLFxuICAgICAgICBtb2RlbFVzYWdlU3RhdHMsXG4gICAgICAgIGVuZHBvaW50U3RhdHMsXG4gICAgICAgIHVzZXJTdGF0c1xuICAgICAgXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgdGhpcy5nZXRUb3RhbFJlcXVlc3RzKHF1ZXJ5KSxcbiAgICAgICAgdGhpcy5nZXRFcnJvck1ldHJpY3MocXVlcnkpLFxuICAgICAgICB0aGlzLmdldFJlc3BvbnNlVGltZU1ldHJpY3MocXVlcnkpLFxuICAgICAgICB0aGlzLmdldE1vZGVsVXNhZ2VTdGF0cyhxdWVyeSksXG4gICAgICAgIHRoaXMuZ2V0RW5kcG9pbnRVc2FnZVN0YXRzKHF1ZXJ5KSxcbiAgICAgICAgdGhpcy5nZXRVc2VyRW5nYWdlbWVudFN0YXRzKHF1ZXJ5KVxuICAgICAgXSk7XG5cbiAgICAgIGNvbnN0IGNvc3RBbmFseXNpcyA9IGF3YWl0IHRoaXMuZ2V0Q29zdEFuYWx5c2lzKHF1ZXJ5KTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcGVyaW9kOiB7XG4gICAgICAgICAgc3RhcnQ6IHF1ZXJ5LnN0YXJ0VGltZSxcbiAgICAgICAgICBlbmQ6IHF1ZXJ5LmVuZFRpbWVcbiAgICAgICAgfSxcbiAgICAgICAgdG90YWxSZXF1ZXN0czogdG90YWxSZXF1ZXN0cy5zdW0gfHwgMCxcbiAgICAgICAgdW5pcXVlVXNlcnM6IHVzZXJTdGF0cy5hY3RpdmVVc2VycyxcbiAgICAgICAgdW5pcXVlT3JnYW5pemF0aW9uczogMCwgLy8gV291bGQgbmVlZCBhZGRpdGlvbmFsIHRyYWNraW5nXG4gICAgICAgIHRvcEVuZHBvaW50czogZW5kcG9pbnRTdGF0cyxcbiAgICAgICAgZXJyb3JSYXRlOiBlcnJvck1ldHJpY3MuZXJyb3JSYXRlLFxuICAgICAgICBhdmVyYWdlUmVzcG9uc2VUaW1lOiByZXNwb25zZVRpbWVNZXRyaWNzLmF2ZXJhZ2UgfHwgMCxcbiAgICAgICAgbW9kZWxVc2FnZTogbW9kZWxVc2FnZVN0YXRzLFxuICAgICAgICBjb3N0QW5hbHlzaXMsXG4gICAgICAgIHVzZXJFbmdhZ2VtZW50OiB1c2VyU3RhdHNcbiAgICAgIH07XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGdlbmVyYXRlIHVzYWdlIHJlcG9ydDonLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRvdGFsIEFQSSByZXF1ZXN0cyBmb3IgdGhlIHBlcmlvZFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBnZXRUb3RhbFJlcXVlc3RzKHF1ZXJ5OiBBbmFseXRpY3NRdWVyeSk6IFByb21pc2U8eyBzdW06IG51bWJlcjsgZGF0YXBvaW50czogYW55W10gfT4ge1xuICAgIGNvbnN0IHBhcmFtcyA9IHtcbiAgICAgIE1ldHJpY05hbWU6ICdBcGlSZXF1ZXN0Q291bnQnLFxuICAgICAgTmFtZXNwYWNlOiB0aGlzLm5hbWVzcGFjZSxcbiAgICAgIFN0YXJ0VGltZTogcXVlcnkuc3RhcnRUaW1lLFxuICAgICAgRW5kVGltZTogcXVlcnkuZW5kVGltZSxcbiAgICAgIFBlcmlvZDogdGhpcy5nZXRQZXJpb2RJblNlY29uZHMocXVlcnkuZ3JhbnVsYXJpdHkgfHwgJ2hvdXInKSxcbiAgICAgIFN0YXRpc3RpY3M6IFsnU3VtJ10sXG4gICAgICBEaW1lbnNpb25zOiBbXG4gICAgICAgIHsgTmFtZTogJ0Vudmlyb25tZW50JywgVmFsdWU6IHRoaXMuZW52aXJvbm1lbnQgfVxuICAgICAgXVxuICAgIH07XG5cbiAgICBpZiAocXVlcnkub3JnYW5pemF0aW9uSWQpIHtcbiAgICAgIHBhcmFtcy5EaW1lbnNpb25zLnB1c2goeyBOYW1lOiAnT3JnYW5pemF0aW9uSWQnLCBWYWx1ZTogcXVlcnkub3JnYW5pemF0aW9uSWQgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5jbG91ZFdhdGNoLmdldE1ldHJpY1N0YXRpc3RpY3MocGFyYW1zKS5wcm9taXNlKCk7XG4gICAgY29uc3Qgc3VtID0gcmVzdWx0LkRhdGFwb2ludHM/LnJlZHVjZSgodG90YWwsIHBvaW50KSA9PiB0b3RhbCArIChwb2ludC5TdW0gfHwgMCksIDApIHx8IDA7XG5cbiAgICByZXR1cm4geyBzdW0sIGRhdGFwb2ludHM6IHJlc3VsdC5EYXRhcG9pbnRzIHx8IFtdIH07XG4gIH1cblxuICAvKipcbiAgICogR2V0IGVycm9yIG1ldHJpY3MgZm9yIHRoZSBwZXJpb2RcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZ2V0RXJyb3JNZXRyaWNzKHF1ZXJ5OiBBbmFseXRpY3NRdWVyeSk6IFByb21pc2U8eyBlcnJvclJhdGU6IG51bWJlcjsgdG90YWxFcnJvcnM6IG51bWJlciB9PiB7XG4gICAgY29uc3QgW3RvdGFsUmVxdWVzdHMsIHRvdGFsRXJyb3JzXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgIHRoaXMuZ2V0VG90YWxSZXF1ZXN0cyhxdWVyeSksXG4gICAgICB0aGlzLmdldE1ldHJpY1N1bSgnQXBpUmVxdWVzdEVycm9yJywgcXVlcnkpXG4gICAgXSk7XG5cbiAgICBjb25zdCBlcnJvclJhdGUgPSB0b3RhbFJlcXVlc3RzLnN1bSA+IDAgPyAodG90YWxFcnJvcnMgLyB0b3RhbFJlcXVlc3RzLnN1bSkgKiAxMDAgOiAwO1xuXG4gICAgcmV0dXJuIHsgZXJyb3JSYXRlLCB0b3RhbEVycm9ycyB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCByZXNwb25zZSB0aW1lIG1ldHJpY3NcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZ2V0UmVzcG9uc2VUaW1lTWV0cmljcyhxdWVyeTogQW5hbHl0aWNzUXVlcnkpOiBQcm9taXNlPHsgYXZlcmFnZTogbnVtYmVyOyBwOTU6IG51bWJlcjsgcDk5OiBudW1iZXIgfT4ge1xuICAgIGNvbnN0IHBhcmFtcyA9IHtcbiAgICAgIE1ldHJpY05hbWU6ICdBcGlSZXF1ZXN0RHVyYXRpb24nLFxuICAgICAgTmFtZXNwYWNlOiB0aGlzLm5hbWVzcGFjZSxcbiAgICAgIFN0YXJ0VGltZTogcXVlcnkuc3RhcnRUaW1lLFxuICAgICAgRW5kVGltZTogcXVlcnkuZW5kVGltZSxcbiAgICAgIFBlcmlvZDogdGhpcy5nZXRQZXJpb2RJblNlY29uZHMocXVlcnkuZ3JhbnVsYXJpdHkgfHwgJ2hvdXInKSxcbiAgICAgIFN0YXRpc3RpY3M6IFsnQXZlcmFnZSddLFxuICAgICAgRXh0ZW5kZWRTdGF0aXN0aWNzOiBbJ3A5NScsICdwOTknXSxcbiAgICAgIERpbWVuc2lvbnM6IFtcbiAgICAgICAgeyBOYW1lOiAnRW52aXJvbm1lbnQnLCBWYWx1ZTogdGhpcy5lbnZpcm9ubWVudCB9XG4gICAgICBdXG4gICAgfTtcblxuICAgIGlmIChxdWVyeS5vcmdhbml6YXRpb25JZCkge1xuICAgICAgcGFyYW1zLkRpbWVuc2lvbnMucHVzaCh7IE5hbWU6ICdPcmdhbml6YXRpb25JZCcsIFZhbHVlOiBxdWVyeS5vcmdhbml6YXRpb25JZCB9KTtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmNsb3VkV2F0Y2guZ2V0TWV0cmljU3RhdGlzdGljcyhwYXJhbXMpLnByb21pc2UoKTtcbiAgICBcbiAgICBjb25zdCBkYXRhcG9pbnRzID0gcmVzdWx0LkRhdGFwb2ludHMgfHwgW107XG4gICAgY29uc3QgYXZlcmFnZSA9IGRhdGFwb2ludHMucmVkdWNlKChzdW0sIHBvaW50KSA9PiBzdW0gKyAocG9pbnQuQXZlcmFnZSB8fCAwKSwgMCkgLyAoZGF0YXBvaW50cy5sZW5ndGggfHwgMSk7XG4gICAgY29uc3QgcDk1ID0gZGF0YXBvaW50cy5yZWR1Y2UoKHN1bSwgcG9pbnQpID0+IHN1bSArICgocG9pbnQuRXh0ZW5kZWRTdGF0aXN0aWNzIGFzIGFueSk/LnA5NSB8fCAwKSwgMCkgLyAoZGF0YXBvaW50cy5sZW5ndGggfHwgMSk7XG4gICAgY29uc3QgcDk5ID0gZGF0YXBvaW50cy5yZWR1Y2UoKHN1bSwgcG9pbnQpID0+IHN1bSArICgocG9pbnQuRXh0ZW5kZWRTdGF0aXN0aWNzIGFzIGFueSk/LnA5OSB8fCAwKSwgMCkgLyAoZGF0YXBvaW50cy5sZW5ndGggfHwgMSk7XG5cbiAgICByZXR1cm4geyBhdmVyYWdlLCBwOTUsIHA5OSB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBtb2RlbCB1c2FnZSBzdGF0aXN0aWNzXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGdldE1vZGVsVXNhZ2VTdGF0cyhxdWVyeTogQW5hbHl0aWNzUXVlcnkpOiBQcm9taXNlPE1vZGVsVXNhZ2VTdGF0c1tdPiB7XG4gICAgLy8gR2V0IHVuaXF1ZSBtb2RlbCBuYW1lcyAoaW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB0aGlzIHdvdWxkIGNvbWUgZnJvbSBhIGNvbmZpZ3VyYXRpb24gb3IgZGlzY292ZXJ5KVxuICAgIGNvbnN0IG1vZGVsTmFtZXMgPSBbJ0NsYXVkZS1Tb25uZXQtMy43JywgJ0NsYXVkZS1IYWlrdS0zLjUnLCAnQW1hem9uLU5vdmEtUHJvJ107XG4gICAgXG4gICAgY29uc3QgbW9kZWxTdGF0cyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgbW9kZWxOYW1lcy5tYXAoYXN5bmMgKG1vZGVsTmFtZSkgPT4ge1xuICAgICAgICBjb25zdCBbdG90YWxDYWxscywgdG90YWxUb2tlbnMsIHRvdGFsQ29zdCwgcmVzcG9uc2VUaW1lLCBzdWNjZXNzUmF0ZV0gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgdGhpcy5nZXRNZXRyaWNTdW0oJ01vZGVsVXNhZ2VDb3VudCcsIHF1ZXJ5LCB7IE1vZGVsTmFtZTogbW9kZWxOYW1lIH0pLFxuICAgICAgICAgIHRoaXMuZ2V0TWV0cmljU3VtKCdNb2RlbFRva2VuQ291bnQnLCBxdWVyeSwgeyBNb2RlbE5hbWU6IG1vZGVsTmFtZSB9KSxcbiAgICAgICAgICB0aGlzLmdldE1ldHJpY1N1bSgnTW9kZWxVc2FnZUNvc3QnLCBxdWVyeSwgeyBNb2RlbE5hbWU6IG1vZGVsTmFtZSB9KSxcbiAgICAgICAgICB0aGlzLmdldE1ldHJpY0F2ZXJhZ2UoJ01vZGVsVXNhZ2VEdXJhdGlvbicsIHF1ZXJ5LCB7IE1vZGVsTmFtZTogbW9kZWxOYW1lIH0pLFxuICAgICAgICAgIHRoaXMuZ2V0TW9kZWxTdWNjZXNzUmF0ZShtb2RlbE5hbWUsIHF1ZXJ5KVxuICAgICAgICBdKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG1vZGVsTmFtZSxcbiAgICAgICAgICB0b3RhbENhbGxzLFxuICAgICAgICAgIHRvdGFsVG9rZW5zLFxuICAgICAgICAgIHRvdGFsQ29zdCxcbiAgICAgICAgICBhdmVyYWdlUmVzcG9uc2VUaW1lOiByZXNwb25zZVRpbWUsXG4gICAgICAgICAgc3VjY2Vzc1JhdGVcbiAgICAgICAgfTtcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIHJldHVybiBtb2RlbFN0YXRzLmZpbHRlcihzdGF0cyA9PiBzdGF0cy50b3RhbENhbGxzID4gMCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGVuZHBvaW50IHVzYWdlIHN0YXRpc3RpY3NcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZ2V0RW5kcG9pbnRVc2FnZVN0YXRzKHF1ZXJ5OiBBbmFseXRpY3NRdWVyeSk6IFByb21pc2U8RW5kcG9pbnRVc2FnZVtdPiB7XG4gICAgLy8gSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB5b3Ugd291bGQgZHluYW1pY2FsbHkgZGlzY292ZXIgZW5kcG9pbnRzXG4gICAgY29uc3QgY29tbW9uRW5kcG9pbnRzID0gW1xuICAgICAgeyBlbmRwb2ludDogJy9hcGkvdjEvaWRlYXMvZ2VuZXJhdGUnLCBtZXRob2Q6ICdQT1NUJyB9LFxuICAgICAgeyBlbmRwb2ludDogJy9hcGkvdjEva25vd2xlZGdlL3VwbG9hZCcsIG1ldGhvZDogJ1BPU1QnIH0sXG4gICAgICB7IGVuZHBvaW50OiAnL2FwaS92MS9mZWVkYmFjaycsIG1ldGhvZDogJ1BPU1QnIH0sXG4gICAgICB7IGVuZHBvaW50OiAnL2FwaS92MS9tYXJrZXQvc2lnbmFscycsIG1ldGhvZDogJ0dFVCcgfSxcbiAgICAgIHsgZW5kcG9pbnQ6ICcvYXBpL3YxL2lkZWFzL3tpZH0nLCBtZXRob2Q6ICdHRVQnIH1cbiAgICBdO1xuXG4gICAgY29uc3QgZW5kcG9pbnRTdGF0cyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgY29tbW9uRW5kcG9pbnRzLm1hcChhc3luYyAoeyBlbmRwb2ludCwgbWV0aG9kIH0pID0+IHtcbiAgICAgICAgY29uc3QgZGltZW5zaW9ucyA9IHsgXG4gICAgICAgICAgRW52aXJvbm1lbnQ6IHRoaXMuZW52aXJvbm1lbnQsIFxuICAgICAgICAgIEVuZHBvaW50OiBlbmRwb2ludCwgXG4gICAgICAgICAgTWV0aG9kOiBtZXRob2QgXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgW3JlcXVlc3RDb3VudCwgYXZlcmFnZVJlc3BvbnNlVGltZSwgZXJyb3JDb3VudF0gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgdGhpcy5nZXRNZXRyaWNTdW0oJ0FwaVJlcXVlc3RDb3VudCcsIHF1ZXJ5LCBkaW1lbnNpb25zKSxcbiAgICAgICAgICB0aGlzLmdldE1ldHJpY0F2ZXJhZ2UoJ0FwaVJlcXVlc3REdXJhdGlvbicsIHF1ZXJ5LCBkaW1lbnNpb25zKSxcbiAgICAgICAgICB0aGlzLmdldE1ldHJpY1N1bSgnQXBpUmVxdWVzdEVycm9yJywgcXVlcnksIGRpbWVuc2lvbnMpXG4gICAgICAgIF0pO1xuXG4gICAgICAgIGNvbnN0IGVycm9yUmF0ZSA9IHJlcXVlc3RDb3VudCA+IDAgPyAoZXJyb3JDb3VudCAvIHJlcXVlc3RDb3VudCkgKiAxMDAgOiAwO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZW5kcG9pbnQsXG4gICAgICAgICAgbWV0aG9kLFxuICAgICAgICAgIHJlcXVlc3RDb3VudCxcbiAgICAgICAgICBhdmVyYWdlUmVzcG9uc2VUaW1lLFxuICAgICAgICAgIGVycm9yUmF0ZSxcbiAgICAgICAgICB1bmlxdWVVc2VyczogMCAvLyBXb3VsZCBuZWVkIGFkZGl0aW9uYWwgdHJhY2tpbmcgdG8gZ2V0IHVuaXF1ZSB1c2VycyBwZXIgZW5kcG9pbnRcbiAgICAgICAgfTtcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIHJldHVybiBlbmRwb2ludFN0YXRzXG4gICAgICAuZmlsdGVyKHN0YXRzID0+IHN0YXRzLnJlcXVlc3RDb3VudCA+IDApXG4gICAgICAuc29ydCgoYSwgYikgPT4gYi5yZXF1ZXN0Q291bnQgLSBhLnJlcXVlc3RDb3VudCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHVzZXIgZW5nYWdlbWVudCBzdGF0aXN0aWNzXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGdldFVzZXJFbmdhZ2VtZW50U3RhdHMocXVlcnk6IEFuYWx5dGljc1F1ZXJ5KTogUHJvbWlzZTxVc2VyRW5nYWdlbWVudFN0YXRzPiB7XG4gICAgY29uc3QgW2FjdGl2ZVVzZXJzLCB0b3RhbFVzYWdlLCBmZWF0dXJlVXNhZ2VdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgdGhpcy5nZXRVbmlxdWVVc2VyQ291bnQocXVlcnkpLFxuICAgICAgdGhpcy5nZXRNZXRyaWNTdW0oJ1VzYWdlQ291bnQnLCBxdWVyeSksXG4gICAgICB0aGlzLmdldEZlYXR1cmVVc2FnZVN0YXRzKHF1ZXJ5KVxuICAgIF0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGFjdGl2ZVVzZXJzLFxuICAgICAgbmV3VXNlcnM6IDAsIC8vIFdvdWxkIG5lZWQgYWRkaXRpb25hbCB0cmFja2luZ1xuICAgICAgcmV0dXJuaW5nVXNlcnM6IDAsIC8vIFdvdWxkIG5lZWQgYWRkaXRpb25hbCB0cmFja2luZ1xuICAgICAgYXZlcmFnZVNlc3Npb25EdXJhdGlvbjogMCwgLy8gV291bGQgbmVlZCBzZXNzaW9uIHRyYWNraW5nXG4gICAgICB0b3BGZWF0dXJlczogZmVhdHVyZVVzYWdlLFxuXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgY29zdCBhbmFseXNpc1xuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBnZXRDb3N0QW5hbHlzaXMocXVlcnk6IEFuYWx5dGljc1F1ZXJ5KTogUHJvbWlzZTxDb3N0QW5hbHlzaXM+IHtcbiAgICBjb25zdCB0b3RhbENvc3QgPSBhd2FpdCB0aGlzLmdldE1ldHJpY1N1bSgnTW9kZWxVc2FnZUNvc3QnLCBxdWVyeSk7XG4gICAgXG4gICAgLy8gR2V0IGNvc3QgYnkgbW9kZWxcbiAgICBjb25zdCBtb2RlbE5hbWVzID0gWydDbGF1ZGUtU29ubmV0LTMuNycsICdDbGF1ZGUtSGFpa3UtMy41JywgJ0FtYXpvbi1Ob3ZhLVBybyddO1xuICAgIGNvbnN0IGNvc3RCeU1vZGVsOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XG4gICAgXG4gICAgZm9yIChjb25zdCBtb2RlbE5hbWUgb2YgbW9kZWxOYW1lcykge1xuICAgICAgY29zdEJ5TW9kZWxbbW9kZWxOYW1lXSA9IGF3YWl0IHRoaXMuZ2V0TWV0cmljU3VtKCdNb2RlbFVzYWdlQ29zdCcsIHF1ZXJ5LCB7IE1vZGVsTmFtZTogbW9kZWxOYW1lIH0pO1xuICAgIH1cblxuICAgIC8vIENhbGN1bGF0ZSBwcm9qZWN0ZWQgbW9udGhseSBjb3N0XG4gICAgY29uc3QgcGVyaW9kRGF5cyA9IChxdWVyeS5lbmRUaW1lLmdldFRpbWUoKSAtIHF1ZXJ5LnN0YXJ0VGltZS5nZXRUaW1lKCkpIC8gKDEwMDAgKiA2MCAqIDYwICogMjQpO1xuICAgIGNvbnN0IHByb2plY3RlZE1vbnRobHlDb3N0ID0gcGVyaW9kRGF5cyA+IDAgPyAodG90YWxDb3N0IC8gcGVyaW9kRGF5cykgKiAzMCA6IDA7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdG90YWxDb3N0LFxuICAgICAgY29zdEJ5TW9kZWwsXG4gICAgICBjb3N0QnlPcmdhbml6YXRpb246IHt9LCAvLyBXb3VsZCBuZWVkIG9yZ2FuaXphdGlvbi1zcGVjaWZpYyB0cmFja2luZ1xuICAgICAgcHJvamVjdGVkTW9udGhseUNvc3RcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBmZWF0dXJlIHVzYWdlIHN0YXRpc3RpY3NcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZ2V0RmVhdHVyZVVzYWdlU3RhdHMocXVlcnk6IEFuYWx5dGljc1F1ZXJ5KTogUHJvbWlzZTxGZWF0dXJlVXNhZ2VbXT4ge1xuICAgIGNvbnN0IGZlYXR1cmVzID0gW1xuICAgICAgJ2dlbmVyYXRlX2ludmVzdG1lbnRfaWRlYScsXG4gICAgICAndXBsb2FkX3Byb3ByaWV0YXJ5X2RhdGEnLFxuICAgICAgJ3N1Ym1pdF9mZWVkYmFjaycsXG4gICAgICAncXVlcnlfbWFya2V0X2RhdGEnXG4gICAgXTtcblxuICAgIGNvbnN0IGZlYXR1cmVTdGF0cyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgZmVhdHVyZXMubWFwKGFzeW5jIChmZWF0dXJlKSA9PiB7XG4gICAgICAgIGNvbnN0IHVzYWdlQ291bnQgPSBhd2FpdCB0aGlzLmdldE1ldHJpY1N1bSgnVXNhZ2VDb3VudCcsIHF1ZXJ5LCB7IEFjdGlvbjogZmVhdHVyZSB9KTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZmVhdHVyZSxcbiAgICAgICAgICB1c2FnZUNvdW50LFxuICAgICAgICAgIHVuaXF1ZVVzZXJzOiAwLCAvLyBXb3VsZCBuZWVkIGFkZGl0aW9uYWwgdHJhY2tpbmdcbiAgICAgICAgICBhdmVyYWdlVXNhZ2VQZXJVc2VyOiAwIC8vIFdvdWxkIG5lZWQgYWRkaXRpb25hbCB0cmFja2luZ1xuICAgICAgICB9O1xuICAgICAgfSlcbiAgICApO1xuXG4gICAgcmV0dXJuIGZlYXR1cmVTdGF0c1xuICAgICAgLmZpbHRlcihzdGF0cyA9PiBzdGF0cy51c2FnZUNvdW50ID4gMClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBiLnVzYWdlQ291bnQgLSBhLnVzYWdlQ291bnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciBtZXRob2QgdG8gZ2V0IG1ldHJpYyBzdW1cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZ2V0TWV0cmljU3VtKFxuICAgIG1ldHJpY05hbWU6IHN0cmluZywgXG4gICAgcXVlcnk6IEFuYWx5dGljc1F1ZXJ5LCBcbiAgICBhZGRpdGlvbmFsRGltZW5zaW9ucz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz5cbiAgKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBjb25zdCBkaW1lbnNpb25zID0gW1xuICAgICAgeyBOYW1lOiAnRW52aXJvbm1lbnQnLCBWYWx1ZTogdGhpcy5lbnZpcm9ubWVudCB9XG4gICAgXTtcblxuICAgIGlmIChxdWVyeS5vcmdhbml6YXRpb25JZCkge1xuICAgICAgZGltZW5zaW9ucy5wdXNoKHsgTmFtZTogJ09yZ2FuaXphdGlvbklkJywgVmFsdWU6IHF1ZXJ5Lm9yZ2FuaXphdGlvbklkIH0pO1xuICAgIH1cblxuICAgIGlmIChhZGRpdGlvbmFsRGltZW5zaW9ucykge1xuICAgICAgT2JqZWN0LmVudHJpZXMoYWRkaXRpb25hbERpbWVuc2lvbnMpLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT4ge1xuICAgICAgICBkaW1lbnNpb25zLnB1c2goeyBOYW1lOiBrZXksIFZhbHVlOiB2YWx1ZSB9KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHBhcmFtcyA9IHtcbiAgICAgIE1ldHJpY05hbWU6IG1ldHJpY05hbWUsXG4gICAgICBOYW1lc3BhY2U6IHRoaXMubmFtZXNwYWNlLFxuICAgICAgU3RhcnRUaW1lOiBxdWVyeS5zdGFydFRpbWUsXG4gICAgICBFbmRUaW1lOiBxdWVyeS5lbmRUaW1lLFxuICAgICAgUGVyaW9kOiB0aGlzLmdldFBlcmlvZEluU2Vjb25kcyhxdWVyeS5ncmFudWxhcml0eSB8fCAnaG91cicpLFxuICAgICAgU3RhdGlzdGljczogWydTdW0nXSxcbiAgICAgIERpbWVuc2lvbnM6IGRpbWVuc2lvbnNcbiAgICB9O1xuXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5jbG91ZFdhdGNoLmdldE1ldHJpY1N0YXRpc3RpY3MocGFyYW1zKS5wcm9taXNlKCk7XG4gICAgcmV0dXJuIHJlc3VsdC5EYXRhcG9pbnRzPy5yZWR1Y2UoKHRvdGFsLCBwb2ludCkgPT4gdG90YWwgKyAocG9pbnQuU3VtIHx8IDApLCAwKSB8fCAwO1xuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciBtZXRob2QgdG8gZ2V0IG1ldHJpYyBhdmVyYWdlXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGdldE1ldHJpY0F2ZXJhZ2UoXG4gICAgbWV0cmljTmFtZTogc3RyaW5nLCBcbiAgICBxdWVyeTogQW5hbHl0aWNzUXVlcnksIFxuICAgIGFkZGl0aW9uYWxEaW1lbnNpb25zPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPlxuICApOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGNvbnN0IGRpbWVuc2lvbnMgPSBbXG4gICAgICB7IE5hbWU6ICdFbnZpcm9ubWVudCcsIFZhbHVlOiB0aGlzLmVudmlyb25tZW50IH1cbiAgICBdO1xuXG4gICAgaWYgKHF1ZXJ5Lm9yZ2FuaXphdGlvbklkKSB7XG4gICAgICBkaW1lbnNpb25zLnB1c2goeyBOYW1lOiAnT3JnYW5pemF0aW9uSWQnLCBWYWx1ZTogcXVlcnkub3JnYW5pemF0aW9uSWQgfSk7XG4gICAgfVxuXG4gICAgaWYgKGFkZGl0aW9uYWxEaW1lbnNpb25zKSB7XG4gICAgICBPYmplY3QuZW50cmllcyhhZGRpdGlvbmFsRGltZW5zaW9ucykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICAgIGRpbWVuc2lvbnMucHVzaCh7IE5hbWU6IGtleSwgVmFsdWU6IHZhbHVlIH0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgcGFyYW1zID0ge1xuICAgICAgTWV0cmljTmFtZTogbWV0cmljTmFtZSxcbiAgICAgIE5hbWVzcGFjZTogdGhpcy5uYW1lc3BhY2UsXG4gICAgICBTdGFydFRpbWU6IHF1ZXJ5LnN0YXJ0VGltZSxcbiAgICAgIEVuZFRpbWU6IHF1ZXJ5LmVuZFRpbWUsXG4gICAgICBQZXJpb2Q6IHRoaXMuZ2V0UGVyaW9kSW5TZWNvbmRzKHF1ZXJ5LmdyYW51bGFyaXR5IHx8ICdob3VyJyksXG4gICAgICBTdGF0aXN0aWNzOiBbJ0F2ZXJhZ2UnXSxcbiAgICAgIERpbWVuc2lvbnM6IGRpbWVuc2lvbnNcbiAgICB9O1xuXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5jbG91ZFdhdGNoLmdldE1ldHJpY1N0YXRpc3RpY3MocGFyYW1zKS5wcm9taXNlKCk7XG4gICAgY29uc3QgZGF0YXBvaW50cyA9IHJlc3VsdC5EYXRhcG9pbnRzIHx8IFtdO1xuICAgIHJldHVybiBkYXRhcG9pbnRzLnJlZHVjZSgoc3VtLCBwb2ludCkgPT4gc3VtICsgKHBvaW50LkF2ZXJhZ2UgfHwgMCksIDApIC8gKGRhdGFwb2ludHMubGVuZ3RoIHx8IDEpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBtb2RlbCBzdWNjZXNzIHJhdGVcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZ2V0TW9kZWxTdWNjZXNzUmF0ZShtb2RlbE5hbWU6IHN0cmluZywgcXVlcnk6IEFuYWx5dGljc1F1ZXJ5KTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBjb25zdCBbdG90YWxDYWxscywgc3VjY2Vzc2Z1bENhbGxzXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgIHRoaXMuZ2V0TWV0cmljU3VtKCdNb2RlbFVzYWdlQ291bnQnLCBxdWVyeSwgeyBNb2RlbE5hbWU6IG1vZGVsTmFtZSB9KSxcbiAgICAgIHRoaXMuZ2V0TWV0cmljU3VtKCdNb2RlbFVzYWdlQ291bnQnLCBxdWVyeSwgeyBNb2RlbE5hbWU6IG1vZGVsTmFtZSwgU3VjY2VzczogJ3RydWUnIH0pXG4gICAgXSk7XG5cbiAgICByZXR1cm4gdG90YWxDYWxscyA+IDAgPyAoc3VjY2Vzc2Z1bENhbGxzIC8gdG90YWxDYWxscykgKiAxMDAgOiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB1bmlxdWUgdXNlciBjb3VudCAoc2ltcGxpZmllZCAtIHdvdWxkIG5lZWQgbW9yZSBzb3BoaXN0aWNhdGVkIHRyYWNraW5nIGluIHJlYWwgaW1wbGVtZW50YXRpb24pXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGdldFVuaXF1ZVVzZXJDb3VudChxdWVyeTogQW5hbHl0aWNzUXVlcnkpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIC8vIFRoaXMgaXMgYSBzaW1wbGlmaWVkIGltcGxlbWVudGF0aW9uXG4gICAgLy8gSW4gcmVhbGl0eSwgeW91J2QgbmVlZCB0byB0cmFjayB1bmlxdWUgdXNlcnMgc2VwYXJhdGVseVxuICAgIGNvbnN0IHRvdGFsVXNhZ2UgPSBhd2FpdCB0aGlzLmdldE1ldHJpY1N1bSgnVXNhZ2VDb3VudCcsIHF1ZXJ5KTtcbiAgICByZXR1cm4gTWF0aC5jZWlsKHRvdGFsVXNhZ2UgLyAxMCk7IC8vIFJvdWdoIGVzdGltYXRlXG4gIH1cblxuICAvKipcbiAgICogQ29udmVydCBncmFudWxhcml0eSB0byBzZWNvbmRzXG4gICAqL1xuICBwcml2YXRlIGdldFBlcmlvZEluU2Vjb25kcyhncmFudWxhcml0eTogJ2hvdXInIHwgJ2RheScgfCAnd2VlaycgfCAnbW9udGgnKTogbnVtYmVyIHtcbiAgICBzd2l0Y2ggKGdyYW51bGFyaXR5KSB7XG4gICAgICBjYXNlICdob3VyJzogcmV0dXJuIDM2MDA7XG4gICAgICBjYXNlICdkYXknOiByZXR1cm4gODY0MDA7XG4gICAgICBjYXNlICd3ZWVrJzogcmV0dXJuIDYwNDgwMDtcbiAgICAgIGNhc2UgJ21vbnRoJzogcmV0dXJuIDI1OTIwMDA7XG4gICAgICBkZWZhdWx0OiByZXR1cm4gMzYwMDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXhwb3J0IHVzYWdlIGRhdGEgZm9yIGV4dGVybmFsIGFuYWx5c2lzXG4gICAqL1xuICBhc3luYyBleHBvcnRVc2FnZURhdGEocXVlcnk6IEFuYWx5dGljc1F1ZXJ5LCBmb3JtYXQ6ICdqc29uJyB8ICdjc3YnID0gJ2pzb24nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCByZXBvcnQgPSBhd2FpdCB0aGlzLmdlbmVyYXRlVXNhZ2VSZXBvcnQocXVlcnkpO1xuICAgIFxuICAgIGlmIChmb3JtYXQgPT09ICdqc29uJykge1xuICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHJlcG9ydCwgbnVsbCwgMik7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIENvbnZlcnQgdG8gQ1NWIGZvcm1hdFxuICAgICAgcmV0dXJuIHRoaXMuY29udmVydFRvQ1NWKHJlcG9ydCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnQgdXNhZ2UgcmVwb3J0IHRvIENTViBmb3JtYXRcbiAgICovXG4gIHByaXZhdGUgY29udmVydFRvQ1NWKHJlcG9ydDogVXNhZ2VSZXBvcnQpOiBzdHJpbmcge1xuICAgIGNvbnN0IGxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuICAgIFxuICAgIC8vIEhlYWRlclxuICAgIGxpbmVzLnB1c2goJ01ldHJpYyxWYWx1ZSxQZXJpb2QgU3RhcnQsUGVyaW9kIEVuZCcpO1xuICAgIFxuICAgIC8vIEJhc2ljIG1ldHJpY3NcbiAgICBsaW5lcy5wdXNoKGBUb3RhbCBSZXF1ZXN0cywke3JlcG9ydC50b3RhbFJlcXVlc3RzfSwke3JlcG9ydC5wZXJpb2Quc3RhcnQudG9JU09TdHJpbmcoKX0sJHtyZXBvcnQucGVyaW9kLmVuZC50b0lTT1N0cmluZygpfWApO1xuICAgIGxpbmVzLnB1c2goYFVuaXF1ZSBVc2Vycywke3JlcG9ydC51bmlxdWVVc2Vyc30sJHtyZXBvcnQucGVyaW9kLnN0YXJ0LnRvSVNPU3RyaW5nKCl9LCR7cmVwb3J0LnBlcmlvZC5lbmQudG9JU09TdHJpbmcoKX1gKTtcbiAgICBsaW5lcy5wdXNoKGBFcnJvciBSYXRlLCR7cmVwb3J0LmVycm9yUmF0ZX0lLCR7cmVwb3J0LnBlcmlvZC5zdGFydC50b0lTT1N0cmluZygpfSwke3JlcG9ydC5wZXJpb2QuZW5kLnRvSVNPU3RyaW5nKCl9YCk7XG4gICAgbGluZXMucHVzaChgQXZlcmFnZSBSZXNwb25zZSBUaW1lLCR7cmVwb3J0LmF2ZXJhZ2VSZXNwb25zZVRpbWV9bXMsJHtyZXBvcnQucGVyaW9kLnN0YXJ0LnRvSVNPU3RyaW5nKCl9LCR7cmVwb3J0LnBlcmlvZC5lbmQudG9JU09TdHJpbmcoKX1gKTtcbiAgICBsaW5lcy5wdXNoKGBUb3RhbCBDb3N0LCQke3JlcG9ydC5jb3N0QW5hbHlzaXMudG90YWxDb3N0fSwke3JlcG9ydC5wZXJpb2Quc3RhcnQudG9JU09TdHJpbmcoKX0sJHtyZXBvcnQucGVyaW9kLmVuZC50b0lTT1N0cmluZygpfWApO1xuICAgIFxuICAgIHJldHVybiBsaW5lcy5qb2luKCdcXG4nKTtcbiAgfVxufVxuXG4vLyBTaW5nbGV0b24gaW5zdGFuY2VcbmV4cG9ydCBjb25zdCB1c2FnZUFuYWx5dGljc1NlcnZpY2UgPSBuZXcgVXNhZ2VBbmFseXRpY3NTZXJ2aWNlKFxuICBwcm9jZXNzLmVudi5BV1NfUkVHSU9OIHx8ICd1cy1lYXN0LTEnLFxuICBwcm9jZXNzLmVudi5DTE9VRFdBVENIX05BTUVTUEFDRSB8fCAnSW52ZXN0bWVudEFJJyxcbiAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgfHwgJ2Rldidcbik7Il19