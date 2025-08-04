"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoringService = exports.MonitoringService = void 0;
const aws_sdk_1 = require("aws-sdk");
class MonitoringService {
    constructor(region = 'us-east-1', namespace = 'InvestmentAI', environment = 'dev') {
        this.cloudWatch = new aws_sdk_1.CloudWatch({ region });
        this.namespace = namespace;
        this.environment = environment;
    }
    /**
     * Record performance metrics
     */
    async recordPerformanceMetric(metric) {
        try {
            const dimensions = [
                { Name: 'Environment', Value: this.environment }
            ];
            if (metric.dimensions) {
                Object.entries(metric.dimensions).forEach(([key, value]) => {
                    dimensions.push({ Name: key, Value: value });
                });
            }
            const metricData = {
                MetricName: metric.name,
                Value: metric.value,
                Unit: metric.unit,
                Timestamp: metric.timestamp || new Date(),
                Dimensions: dimensions
            };
            const params = {
                Namespace: this.namespace,
                MetricData: [metricData]
            };
            await this.cloudWatch.putMetricData(params).promise();
        }
        catch (error) {
            console.error('Failed to record performance metric:', error);
            // Don't throw error to avoid impacting main application flow
        }
    }
    /**
     * Record multiple performance metrics in batch
     */
    async recordPerformanceMetrics(metrics) {
        try {
            const metricData = metrics.map(metric => {
                const dimensions = [
                    { Name: 'Environment', Value: this.environment }
                ];
                if (metric.dimensions) {
                    Object.entries(metric.dimensions).forEach(([key, value]) => {
                        dimensions.push({ Name: key, Value: value });
                    });
                }
                return {
                    MetricName: metric.name,
                    Value: metric.value,
                    Unit: metric.unit,
                    Timestamp: metric.timestamp || new Date(),
                    Dimensions: dimensions
                };
            });
            // CloudWatch allows max 20 metrics per request
            const chunks = this.chunkArray(metricData, 20);
            for (const chunk of chunks) {
                const params = {
                    Namespace: this.namespace,
                    MetricData: chunk
                };
                await this.cloudWatch.putMetricData(params).promise();
            }
        }
        catch (error) {
            console.error('Failed to record performance metrics:', error);
        }
    }
    /**
     * Record error metrics
     */
    async recordError(error) {
        try {
            const dimensions = [
                { Name: 'Environment', Value: this.environment },
                { Name: 'Service', Value: error.service },
                { Name: 'ErrorType', Value: error.errorType },
                { Name: 'Severity', Value: error.severity }
            ];
            const metricData = [
                {
                    MetricName: 'ErrorCount',
                    Value: 1,
                    Unit: 'Count',
                    Timestamp: error.timestamp || new Date(),
                    Dimensions: dimensions
                },
                {
                    MetricName: `Error_${error.severity}`,
                    Value: 1,
                    Unit: 'Count',
                    Timestamp: error.timestamp || new Date(),
                    Dimensions: dimensions
                }
            ];
            const params = {
                Namespace: this.namespace,
                MetricData: metricData
            };
            await this.cloudWatch.putMetricData(params).promise();
            // Log error details for debugging
            console.error(`[${error.severity.toUpperCase()}] ${error.service}: ${error.errorType}`, {
                message: error.errorMessage,
                metadata: error.metadata,
                timestamp: error.timestamp || new Date()
            });
        }
        catch (cloudWatchError) {
            console.error('Failed to record error metric:', cloudWatchError);
        }
    }
    /**
     * Record usage analytics
     */
    async recordUsage(usage) {
        try {
            const dimensions = [
                { Name: 'Environment', Value: this.environment },
                { Name: 'Action', Value: usage.action },
                { Name: 'Resource', Value: usage.resource },
                { Name: 'Success', Value: usage.success.toString() }
            ];
            if (usage.organizationId) {
                dimensions.push({ Name: 'OrganizationId', Value: usage.organizationId });
            }
            const metricData = [
                {
                    MetricName: 'UsageCount',
                    Value: 1,
                    Unit: 'Count',
                    Timestamp: usage.timestamp || new Date(),
                    Dimensions: dimensions
                }
            ];
            // Add duration metric if provided
            if (usage.duration !== undefined) {
                metricData.push({
                    MetricName: 'UsageDuration',
                    Value: usage.duration,
                    Unit: 'Milliseconds',
                    Timestamp: usage.timestamp || new Date(),
                    Dimensions: dimensions
                });
            }
            // Add success/failure metrics
            metricData.push({
                MetricName: usage.success ? 'SuccessCount' : 'FailureCount',
                Value: 1,
                Unit: 'Count',
                Timestamp: usage.timestamp || new Date(),
                Dimensions: dimensions
            });
            const params = {
                Namespace: this.namespace,
                MetricData: metricData
            };
            await this.cloudWatch.putMetricData(params).promise();
        }
        catch (error) {
            console.error('Failed to record usage metric:', error);
        }
    }
    /**
     * Record API request metrics
     */
    async recordApiRequest(endpoint, method, statusCode, duration, userId, organizationId) {
        const dimensions = [
            { Name: 'Environment', Value: this.environment },
            { Name: 'Endpoint', Value: endpoint },
            { Name: 'Method', Value: method },
            { Name: 'StatusCode', Value: statusCode.toString() }
        ];
        if (organizationId) {
            dimensions.push({ Name: 'OrganizationId', Value: organizationId });
        }
        const metrics = [
            {
                name: 'ApiRequestCount',
                value: 1,
                unit: 'Count',
                dimensions: Object.fromEntries(dimensions.map(d => [d.Name, d.Value]))
            },
            {
                name: 'ApiRequestDuration',
                value: duration,
                unit: 'Milliseconds',
                dimensions: Object.fromEntries(dimensions.map(d => [d.Name, d.Value]))
            }
        ];
        // Add success/error metrics based on status code
        if (statusCode >= 200 && statusCode < 300) {
            metrics.push({
                name: 'ApiRequestSuccess',
                value: 1,
                unit: 'Count',
                dimensions: Object.fromEntries(dimensions.map(d => [d.Name, d.Value]))
            });
        }
        else {
            metrics.push({
                name: 'ApiRequestError',
                value: 1,
                unit: 'Count',
                dimensions: Object.fromEntries(dimensions.map(d => [d.Name, d.Value]))
            });
        }
        await this.recordPerformanceMetrics(metrics);
    }
    /**
     * Record AI model usage metrics
     */
    async recordModelUsage(modelName, operation, duration, success, tokenCount, cost) {
        const dimensions = {
            Environment: this.environment,
            ModelName: modelName,
            Operation: operation,
            Success: success.toString()
        };
        const metrics = [
            {
                name: 'ModelUsageCount',
                value: 1,
                unit: 'Count',
                dimensions
            },
            {
                name: 'ModelUsageDuration',
                value: duration,
                unit: 'Milliseconds',
                dimensions
            }
        ];
        if (tokenCount !== undefined) {
            metrics.push({
                name: 'ModelTokenCount',
                value: tokenCount,
                unit: 'Count',
                dimensions
            });
        }
        if (cost !== undefined) {
            metrics.push({
                name: 'ModelUsageCost',
                value: cost,
                unit: 'Count',
                dimensions
            });
        }
        await this.recordPerformanceMetrics(metrics);
    }
    /**
     * Record system health metrics
     */
    async recordSystemHealth(service, healthStatus, responseTime, errorRate) {
        const dimensions = {
            Environment: this.environment,
            Service: service,
            HealthStatus: healthStatus
        };
        const metrics = [
            {
                name: 'SystemHealthCheck',
                value: healthStatus === 'healthy' ? 1 : 0,
                unit: 'Count',
                dimensions
            }
        ];
        if (responseTime !== undefined) {
            metrics.push({
                name: 'SystemResponseTime',
                value: responseTime,
                unit: 'Milliseconds',
                dimensions
            });
        }
        if (errorRate !== undefined) {
            metrics.push({
                name: 'SystemErrorRate',
                value: errorRate,
                unit: 'Percent',
                dimensions
            });
        }
        await this.recordPerformanceMetrics(metrics);
    }
    /**
     * Utility method to chunk arrays
     */
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
}
exports.MonitoringService = MonitoringService;
// Singleton instance
exports.monitoringService = new MonitoringService(process.env.AWS_REGION || 'us-east-1', process.env.CLOUDWATCH_NAMESPACE || 'InvestmentAI', process.env.NODE_ENV || 'dev');
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uaXRvcmluZy1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3NlcnZpY2VzL21vbml0b3JpbmcvbW9uaXRvcmluZy1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFDQUFxQztBQThCckMsTUFBYSxpQkFBaUI7SUFLNUIsWUFBWSxTQUFpQixXQUFXLEVBQUUsWUFBb0IsY0FBYyxFQUFFLGNBQXNCLEtBQUs7UUFDdkcsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLG9CQUFVLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBQzNCLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO0lBQ2pDLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxNQUF5QjtRQUNyRCxJQUFJO1lBQ0YsTUFBTSxVQUFVLEdBQTJCO2dCQUN6QyxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUU7YUFDakQsQ0FBQztZQUVGLElBQUksTUFBTSxDQUFDLFVBQVUsRUFBRTtnQkFDckIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRTtvQkFDekQsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBQy9DLENBQUMsQ0FBQyxDQUFDO2FBQ0o7WUFFRCxNQUFNLFVBQVUsR0FBRztnQkFDakIsVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJO2dCQUN2QixLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUs7Z0JBQ25CLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSTtnQkFD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Q2hELE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUM7U0FDNUM7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0NBQ0Y7QUF2V0QsOENBdVdDO0FBRUQscUJBQXFCO0FBQ1IsUUFBQSxpQkFBaUIsR0FBRyxJQUFJLGlCQUFpQixDQUNwRCxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsSUFBSSxXQUFXLEVBQ3JDLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLElBQUksY0FBYyxFQUNsRCxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsSUFBSSxLQUFLLENBQzlCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDbG91ZFdhdGNoIH0gZnJvbSAnYXdzLXNkayc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGVyZm9ybWFuY2VNZXRyaWMge1xuICBuYW1lOiBzdHJpbmc7XG4gIHZhbHVlOiBudW1iZXI7XG4gIHVuaXQ6ICdDb3VudCcgfCAnU2Vjb25kcycgfCAnTWlsbGlzZWNvbmRzJyB8ICdCeXRlcycgfCAnUGVyY2VudCc7XG4gIGRpbWVuc2lvbnM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICB0aW1lc3RhbXA/OiBEYXRlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEVycm9yTWV0cmljIHtcbiAgZXJyb3JUeXBlOiBzdHJpbmc7XG4gIGVycm9yTWVzc2FnZTogc3RyaW5nO1xuICBzZXJ2aWNlOiBzdHJpbmc7XG4gIHNldmVyaXR5OiAnbG93JyB8ICdtZWRpdW0nIHwgJ2hpZ2gnIHwgJ2NyaXRpY2FsJztcbiAgbWV0YWRhdGE/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuICB0aW1lc3RhbXA/OiBEYXRlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFVzYWdlTWV0cmljIHtcbiAgdXNlcklkPzogc3RyaW5nO1xuICBvcmdhbml6YXRpb25JZD86IHN0cmluZztcbiAgYWN0aW9uOiBzdHJpbmc7XG4gIHJlc291cmNlOiBzdHJpbmc7XG4gIGR1cmF0aW9uPzogbnVtYmVyO1xuICBzdWNjZXNzOiBib29sZWFuO1xuICBtZXRhZGF0YT86IFJlY29yZDxzdHJpbmcsIGFueT47XG4gIHRpbWVzdGFtcD86IERhdGU7XG59XG5cbmV4cG9ydCBjbGFzcyBNb25pdG9yaW5nU2VydmljZSB7XG4gIHByaXZhdGUgY2xvdWRXYXRjaDogQ2xvdWRXYXRjaDtcbiAgcHJpdmF0ZSBuYW1lc3BhY2U6IHN0cmluZztcbiAgcHJpdmF0ZSBlbnZpcm9ubWVudDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHJlZ2lvbjogc3RyaW5nID0gJ3VzLWVhc3QtMScsIG5hbWVzcGFjZTogc3RyaW5nID0gJ0ludmVzdG1lbnRBSScsIGVudmlyb25tZW50OiBzdHJpbmcgPSAnZGV2Jykge1xuICAgIHRoaXMuY2xvdWRXYXRjaCA9IG5ldyBDbG91ZFdhdGNoKHsgcmVnaW9uIH0pO1xuICAgIHRoaXMubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuICAgIHRoaXMuZW52aXJvbm1lbnQgPSBlbnZpcm9ubWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWNvcmQgcGVyZm9ybWFuY2UgbWV0cmljc1xuICAgKi9cbiAgYXN5bmMgcmVjb3JkUGVyZm9ybWFuY2VNZXRyaWMobWV0cmljOiBQZXJmb3JtYW5jZU1ldHJpYyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBkaW1lbnNpb25zOiBDbG91ZFdhdGNoLkRpbWVuc2lvbltdID0gW1xuICAgICAgICB7IE5hbWU6ICdFbnZpcm9ubWVudCcsIFZhbHVlOiB0aGlzLmVudmlyb25tZW50IH1cbiAgICAgIF07XG5cbiAgICAgIGlmIChtZXRyaWMuZGltZW5zaW9ucykge1xuICAgICAgICBPYmplY3QuZW50cmllcyhtZXRyaWMuZGltZW5zaW9ucykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICAgICAgZGltZW5zaW9ucy5wdXNoKHsgTmFtZToga2V5LCBWYWx1ZTogdmFsdWUgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBtZXRyaWNEYXRhID0ge1xuICAgICAgICBNZXRyaWNOYW1lOiBtZXRyaWMubmFtZSxcbiAgICAgICAgVmFsdWU6IG1ldHJpYy52YWx1ZSxcbiAgICAgICAgVW5pdDogbWV0cmljLnVuaXQsXG4gICAgICAgIFRpbWVzdGFtcDogbWV0cmljLnRpbWVzdGFtcCB8fCBuZXcgRGF0ZSgpLFxuICAgICAgICBEaW1lbnNpb25zOiBkaW1lbnNpb25zXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBwYXJhbXMgPSB7XG4gICAgICAgIE5hbWVzcGFjZTogdGhpcy5uYW1lc3BhY2UsXG4gICAgICAgIE1ldHJpY0RhdGE6IFttZXRyaWNEYXRhXVxuICAgICAgfTtcblxuICAgICAgYXdhaXQgdGhpcy5jbG91ZFdhdGNoLnB1dE1ldHJpY0RhdGEocGFyYW1zKS5wcm9taXNlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byByZWNvcmQgcGVyZm9ybWFuY2UgbWV0cmljOicsIGVycm9yKTtcbiAgICAgIC8vIERvbid0IHRocm93IGVycm9yIHRvIGF2b2lkIGltcGFjdGluZyBtYWluIGFwcGxpY2F0aW9uIGZsb3dcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVjb3JkIG11bHRpcGxlIHBlcmZvcm1hbmNlIG1ldHJpY3MgaW4gYmF0Y2hcbiAgICovXG4gIGFzeW5jIHJlY29yZFBlcmZvcm1hbmNlTWV0cmljcyhtZXRyaWNzOiBQZXJmb3JtYW5jZU1ldHJpY1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1ldHJpY0RhdGEgPSBtZXRyaWNzLm1hcChtZXRyaWMgPT4ge1xuICAgICAgICBjb25zdCBkaW1lbnNpb25zID0gW1xuICAgICAgICAgIHsgTmFtZTogJ0Vudmlyb25tZW50JywgVmFsdWU6IHRoaXMuZW52aXJvbm1lbnQgfVxuICAgICAgICBdO1xuXG4gICAgICAgIGlmIChtZXRyaWMuZGltZW5zaW9ucykge1xuICAgICAgICAgIE9iamVjdC5lbnRyaWVzKG1ldHJpYy5kaW1lbnNpb25zKS5mb3JFYWNoKChba2V5LCB2YWx1ZV0pID0+IHtcbiAgICAgICAgICAgIGRpbWVuc2lvbnMucHVzaCh7IE5hbWU6IGtleSwgVmFsdWU6IHZhbHVlIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBNZXRyaWNOYW1lOiBtZXRyaWMubmFtZSxcbiAgICAgICAgICBWYWx1ZTogbWV0cmljLnZhbHVlLFxuICAgICAgICAgIFVuaXQ6IG1ldHJpYy51bml0LFxuICAgICAgICAgIFRpbWVzdGFtcDogbWV0cmljLnRpbWVzdGFtcCB8fCBuZXcgRGF0ZSgpLFxuICAgICAgICAgIERpbWVuc2lvbnM6IGRpbWVuc2lvbnNcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBDbG91ZFdhdGNoIGFsbG93cyBtYXggMjAgbWV0cmljcyBwZXIgcmVxdWVzdFxuICAgICAgY29uc3QgY2h1bmtzID0gdGhpcy5jaHVua0FycmF5KG1ldHJpY0RhdGEsIDIwKTtcbiAgICAgIFxuICAgICAgZm9yIChjb25zdCBjaHVuayBvZiBjaHVua3MpIHtcbiAgICAgICAgY29uc3QgcGFyYW1zID0ge1xuICAgICAgICAgIE5hbWVzcGFjZTogdGhpcy5uYW1lc3BhY2UsXG4gICAgICAgICAgTWV0cmljRGF0YTogY2h1bmtcbiAgICAgICAgfTtcblxuICAgICAgICBhd2FpdCB0aGlzLmNsb3VkV2F0Y2gucHV0TWV0cmljRGF0YShwYXJhbXMpLnByb21pc2UoKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIHJlY29yZCBwZXJmb3JtYW5jZSBtZXRyaWNzOicsIGVycm9yKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVjb3JkIGVycm9yIG1ldHJpY3NcbiAgICovXG4gIGFzeW5jIHJlY29yZEVycm9yKGVycm9yOiBFcnJvck1ldHJpYyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBkaW1lbnNpb25zID0gW1xuICAgICAgICB7IE5hbWU6ICdFbnZpcm9ubWVudCcsIFZhbHVlOiB0aGlzLmVudmlyb25tZW50IH0sXG4gICAgICAgIHsgTmFtZTogJ1NlcnZpY2UnLCBWYWx1ZTogZXJyb3Iuc2VydmljZSB9LFxuICAgICAgICB7IE5hbWU6ICdFcnJvclR5cGUnLCBWYWx1ZTogZXJyb3IuZXJyb3JUeXBlIH0sXG4gICAgICAgIHsgTmFtZTogJ1NldmVyaXR5JywgVmFsdWU6IGVycm9yLnNldmVyaXR5IH1cbiAgICAgIF07XG5cbiAgICAgIGNvbnN0IG1ldHJpY0RhdGEgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICBNZXRyaWNOYW1lOiAnRXJyb3JDb3VudCcsXG4gICAgICAgICAgVmFsdWU6IDEsXG4gICAgICAgICAgVW5pdDogJ0NvdW50JyxcbiAgICAgICAgICBUaW1lc3RhbXA6IGVycm9yLnRpbWVzdGFtcCB8fCBuZXcgRGF0ZSgpLFxuICAgICAgICAgIERpbWVuc2lvbnM6IGRpbWVuc2lvbnNcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIE1ldHJpY05hbWU6IGBFcnJvcl8ke2Vycm9yLnNldmVyaXR5fWAsXG4gICAgICAgICAgVmFsdWU6IDEsXG4gICAgICAgICAgVW5pdDogJ0NvdW50JyxcbiAgICAgICAgICBUaW1lc3RhbXA6IGVycm9yLnRpbWVzdGFtcCB8fCBuZXcgRGF0ZSgpLFxuICAgICAgICAgIERpbWVuc2lvbnM6IGRpbWVuc2lvbnNcbiAgICAgICAgfVxuICAgICAgXTtcblxuICAgICAgY29uc3QgcGFyYW1zID0ge1xuICAgICAgICBOYW1lc3BhY2U6IHRoaXMubmFtZXNwYWNlLFxuICAgICAgICBNZXRyaWNEYXRhOiBtZXRyaWNEYXRhXG4gICAgICB9O1xuXG4gICAgICBhd2FpdCB0aGlzLmNsb3VkV2F0Y2gucHV0TWV0cmljRGF0YShwYXJhbXMpLnByb21pc2UoKTtcblxuICAgICAgLy8gTG9nIGVycm9yIGRldGFpbHMgZm9yIGRlYnVnZ2luZ1xuICAgICAgY29uc29sZS5lcnJvcihgWyR7ZXJyb3Iuc2V2ZXJpdHkudG9VcHBlckNhc2UoKX1dICR7ZXJyb3Iuc2VydmljZX06ICR7ZXJyb3IuZXJyb3JUeXBlfWAsIHtcbiAgICAgICAgbWVzc2FnZTogZXJyb3IuZXJyb3JNZXNzYWdlLFxuICAgICAgICBtZXRhZGF0YTogZXJyb3IubWV0YWRhdGEsXG4gICAgICAgIHRpbWVzdGFtcDogZXJyb3IudGltZXN0YW1wIHx8IG5ldyBEYXRlKClcbiAgICAgIH0pO1xuXG4gICAgfSBjYXRjaCAoY2xvdWRXYXRjaEVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gcmVjb3JkIGVycm9yIG1ldHJpYzonLCBjbG91ZFdhdGNoRXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZWNvcmQgdXNhZ2UgYW5hbHl0aWNzXG4gICAqL1xuICBhc3luYyByZWNvcmRVc2FnZSh1c2FnZTogVXNhZ2VNZXRyaWMpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZGltZW5zaW9ucyA9IFtcbiAgICAgICAgeyBOYW1lOiAnRW52aXJvbm1lbnQnLCBWYWx1ZTogdGhpcy5lbnZpcm9ubWVudCB9LFxuICAgICAgICB7IE5hbWU6ICdBY3Rpb24nLCBWYWx1ZTogdXNhZ2UuYWN0aW9uIH0sXG4gICAgICAgIHsgTmFtZTogJ1Jlc291cmNlJywgVmFsdWU6IHVzYWdlLnJlc291cmNlIH0sXG4gICAgICAgIHsgTmFtZTogJ1N1Y2Nlc3MnLCBWYWx1ZTogdXNhZ2Uuc3VjY2Vzcy50b1N0cmluZygpIH1cbiAgICAgIF07XG5cbiAgICAgIGlmICh1c2FnZS5vcmdhbml6YXRpb25JZCkge1xuICAgICAgICBkaW1lbnNpb25zLnB1c2goeyBOYW1lOiAnT3JnYW5pemF0aW9uSWQnLCBWYWx1ZTogdXNhZ2Uub3JnYW5pemF0aW9uSWQgfSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1ldHJpY0RhdGEgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICBNZXRyaWNOYW1lOiAnVXNhZ2VDb3VudCcsXG4gICAgICAgICAgVmFsdWU6IDEsXG4gICAgICAgICAgVW5pdDogJ0NvdW50JyxcbiAgICAgICAgICBUaW1lc3RhbXA6IHVzYWdlLnRpbWVzdGFtcCB8fCBuZXcgRGF0ZSgpLFxuICAgICAgICAgIERpbWVuc2lvbnM6IGRpbWVuc2lvbnNcbiAgICAgICAgfVxuICAgICAgXTtcblxuICAgICAgLy8gQWRkIGR1cmF0aW9uIG1ldHJpYyBpZiBwcm92aWRlZFxuICAgICAgaWYgKHVzYWdlLmR1cmF0aW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbWV0cmljRGF0YS5wdXNoKHtcbiAgICAgICAgICBNZXRyaWNOYW1lOiAnVXNhZ2VEdXJhdGlvbicsXG4gICAgICAgICAgVmFsdWU6IHVzYWdlLmR1cmF0aW9uLFxuICAgICAgICAgIFVuaXQ6ICdNaWxsaXNlY29uZHMnLFxuICAgICAgICAgIFRpbWVzdGFtcDogdXNhZ2UudGltZXN0YW1wIHx8IG5ldyBEYXRlKCksXG4gICAgICAgICAgRGltZW5zaW9uczogZGltZW5zaW9uc1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gQWRkIHN1Y2Nlc3MvZmFpbHVyZSBtZXRyaWNzXG4gICAgICBtZXRyaWNEYXRhLnB1c2goe1xuICAgICAgICBNZXRyaWNOYW1lOiB1c2FnZS5zdWNjZXNzID8gJ1N1Y2Nlc3NDb3VudCcgOiAnRmFpbHVyZUNvdW50JyxcbiAgICAgICAgVmFsdWU6IDEsXG4gICAgICAgIFVuaXQ6ICdDb3VudCcsXG4gICAgICAgIFRpbWVzdGFtcDogdXNhZ2UudGltZXN0YW1wIHx8IG5ldyBEYXRlKCksXG4gICAgICAgIERpbWVuc2lvbnM6IGRpbWVuc2lvbnNcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBwYXJhbXMgPSB7XG4gICAgICAgIE5hbWVzcGFjZTogdGhpcy5uYW1lc3BhY2UsXG4gICAgICAgIE1ldHJpY0RhdGE6IG1ldHJpY0RhdGFcbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IHRoaXMuY2xvdWRXYXRjaC5wdXRNZXRyaWNEYXRhKHBhcmFtcykucHJvbWlzZSgpO1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byByZWNvcmQgdXNhZ2UgbWV0cmljOicsIGVycm9yKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVjb3JkIEFQSSByZXF1ZXN0IG1ldHJpY3NcbiAgICovXG4gIGFzeW5jIHJlY29yZEFwaVJlcXVlc3QoXG4gICAgZW5kcG9pbnQ6IHN0cmluZyxcbiAgICBtZXRob2Q6IHN0cmluZyxcbiAgICBzdGF0dXNDb2RlOiBudW1iZXIsXG4gICAgZHVyYXRpb246IG51bWJlcixcbiAgICB1c2VySWQ/OiBzdHJpbmcsXG4gICAgb3JnYW5pemF0aW9uSWQ/OiBzdHJpbmdcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZGltZW5zaW9ucyA9IFtcbiAgICAgIHsgTmFtZTogJ0Vudmlyb25tZW50JywgVmFsdWU6IHRoaXMuZW52aXJvbm1lbnQgfSxcbiAgICAgIHsgTmFtZTogJ0VuZHBvaW50JywgVmFsdWU6IGVuZHBvaW50IH0sXG4gICAgICB7IE5hbWU6ICdNZXRob2QnLCBWYWx1ZTogbWV0aG9kIH0sXG4gICAgICB7IE5hbWU6ICdTdGF0dXNDb2RlJywgVmFsdWU6IHN0YXR1c0NvZGUudG9TdHJpbmcoKSB9XG4gICAgXTtcblxuICAgIGlmIChvcmdhbml6YXRpb25JZCkge1xuICAgICAgZGltZW5zaW9ucy5wdXNoKHsgTmFtZTogJ09yZ2FuaXphdGlvbklkJywgVmFsdWU6IG9yZ2FuaXphdGlvbklkIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IG1ldHJpY3M6IFBlcmZvcm1hbmNlTWV0cmljW10gPSBbXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdBcGlSZXF1ZXN0Q291bnQnLFxuICAgICAgICB2YWx1ZTogMSxcbiAgICAgICAgdW5pdDogJ0NvdW50JyxcbiAgICAgICAgZGltZW5zaW9uczogT2JqZWN0LmZyb21FbnRyaWVzKGRpbWVuc2lvbnMubWFwKGQgPT4gW2QuTmFtZSwgZC5WYWx1ZV0pKVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogJ0FwaVJlcXVlc3REdXJhdGlvbicsXG4gICAgICAgIHZhbHVlOiBkdXJhdGlvbixcbiAgICAgICAgdW5pdDogJ01pbGxpc2Vjb25kcycsXG4gICAgICAgIGRpbWVuc2lvbnM6IE9iamVjdC5mcm9tRW50cmllcyhkaW1lbnNpb25zLm1hcChkID0+IFtkLk5hbWUsIGQuVmFsdWVdKSlcbiAgICAgIH1cbiAgICBdO1xuXG4gICAgLy8gQWRkIHN1Y2Nlc3MvZXJyb3IgbWV0cmljcyBiYXNlZCBvbiBzdGF0dXMgY29kZVxuICAgIGlmIChzdGF0dXNDb2RlID49IDIwMCAmJiBzdGF0dXNDb2RlIDwgMzAwKSB7XG4gICAgICBtZXRyaWNzLnB1c2goe1xuICAgICAgICBuYW1lOiAnQXBpUmVxdWVzdFN1Y2Nlc3MnLFxuICAgICAgICB2YWx1ZTogMSxcbiAgICAgICAgdW5pdDogJ0NvdW50JyxcbiAgICAgICAgZGltZW5zaW9uczogT2JqZWN0LmZyb21FbnRyaWVzKGRpbWVuc2lvbnMubWFwKGQgPT4gW2QuTmFtZSwgZC5WYWx1ZV0pKVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1ldHJpY3MucHVzaCh7XG4gICAgICAgIG5hbWU6ICdBcGlSZXF1ZXN0RXJyb3InLFxuICAgICAgICB2YWx1ZTogMSxcbiAgICAgICAgdW5pdDogJ0NvdW50JyxcbiAgICAgICAgZGltZW5zaW9uczogT2JqZWN0LmZyb21FbnRyaWVzKGRpbWVuc2lvbnMubWFwKGQgPT4gW2QuTmFtZSwgZC5WYWx1ZV0pKVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXdhaXQgdGhpcy5yZWNvcmRQZXJmb3JtYW5jZU1ldHJpY3MobWV0cmljcyk7XG4gIH1cblxuICAvKipcbiAgICogUmVjb3JkIEFJIG1vZGVsIHVzYWdlIG1ldHJpY3NcbiAgICovXG4gIGFzeW5jIHJlY29yZE1vZGVsVXNhZ2UoXG4gICAgbW9kZWxOYW1lOiBzdHJpbmcsXG4gICAgb3BlcmF0aW9uOiBzdHJpbmcsXG4gICAgZHVyYXRpb246IG51bWJlcixcbiAgICBzdWNjZXNzOiBib29sZWFuLFxuICAgIHRva2VuQ291bnQ/OiBudW1iZXIsXG4gICAgY29zdD86IG51bWJlclxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBkaW1lbnNpb25zID0ge1xuICAgICAgRW52aXJvbm1lbnQ6IHRoaXMuZW52aXJvbm1lbnQsXG4gICAgICBNb2RlbE5hbWU6IG1vZGVsTmFtZSxcbiAgICAgIE9wZXJhdGlvbjogb3BlcmF0aW9uLFxuICAgICAgU3VjY2Vzczogc3VjY2Vzcy50b1N0cmluZygpXG4gICAgfTtcblxuICAgIGNvbnN0IG1ldHJpY3M6IFBlcmZvcm1hbmNlTWV0cmljW10gPSBbXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdNb2RlbFVzYWdlQ291bnQnLFxuICAgICAgICB2YWx1ZTogMSxcbiAgICAgICAgdW5pdDogJ0NvdW50JyxcbiAgICAgICAgZGltZW5zaW9uc1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogJ01vZGVsVXNhZ2VEdXJhdGlvbicsXG4gICAgICAgIHZhbHVlOiBkdXJhdGlvbixcbiAgICAgICAgdW5pdDogJ01pbGxpc2Vjb25kcycsXG4gICAgICAgIGRpbWVuc2lvbnNcbiAgICAgIH1cbiAgICBdO1xuXG4gICAgaWYgKHRva2VuQ291bnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbWV0cmljcy5wdXNoKHtcbiAgICAgICAgbmFtZTogJ01vZGVsVG9rZW5Db3VudCcsXG4gICAgICAgIHZhbHVlOiB0b2tlbkNvdW50LFxuICAgICAgICB1bml0OiAnQ291bnQnLFxuICAgICAgICBkaW1lbnNpb25zXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoY29zdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBtZXRyaWNzLnB1c2goe1xuICAgICAgICBuYW1lOiAnTW9kZWxVc2FnZUNvc3QnLFxuICAgICAgICB2YWx1ZTogY29zdCxcbiAgICAgICAgdW5pdDogJ0NvdW50JywgLy8gVXNpbmcgQ291bnQgZm9yIGN1cnJlbmN5IHZhbHVlc1xuICAgICAgICBkaW1lbnNpb25zXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLnJlY29yZFBlcmZvcm1hbmNlTWV0cmljcyhtZXRyaWNzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWNvcmQgc3lzdGVtIGhlYWx0aCBtZXRyaWNzXG4gICAqL1xuICBhc3luYyByZWNvcmRTeXN0ZW1IZWFsdGgoXG4gICAgc2VydmljZTogc3RyaW5nLFxuICAgIGhlYWx0aFN0YXR1czogJ2hlYWx0aHknIHwgJ2RlZ3JhZGVkJyB8ICd1bmhlYWx0aHknLFxuICAgIHJlc3BvbnNlVGltZT86IG51bWJlcixcbiAgICBlcnJvclJhdGU/OiBudW1iZXJcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZGltZW5zaW9ucyA9IHtcbiAgICAgIEVudmlyb25tZW50OiB0aGlzLmVudmlyb25tZW50LFxuICAgICAgU2VydmljZTogc2VydmljZSxcbiAgICAgIEhlYWx0aFN0YXR1czogaGVhbHRoU3RhdHVzXG4gICAgfTtcblxuICAgIGNvbnN0IG1ldHJpY3M6IFBlcmZvcm1hbmNlTWV0cmljW10gPSBbXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdTeXN0ZW1IZWFsdGhDaGVjaycsXG4gICAgICAgIHZhbHVlOiBoZWFsdGhTdGF0dXMgPT09ICdoZWFsdGh5JyA/IDEgOiAwLFxuICAgICAgICB1bml0OiAnQ291bnQnLFxuICAgICAgICBkaW1lbnNpb25zXG4gICAgICB9XG4gICAgXTtcblxuICAgIGlmIChyZXNwb25zZVRpbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbWV0cmljcy5wdXNoKHtcbiAgICAgICAgbmFtZTogJ1N5c3RlbVJlc3BvbnNlVGltZScsXG4gICAgICAgIHZhbHVlOiByZXNwb25zZVRpbWUsXG4gICAgICAgIHVuaXQ6ICdNaWxsaXNlY29uZHMnLFxuICAgICAgICBkaW1lbnNpb25zXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoZXJyb3JSYXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIG1ldHJpY3MucHVzaCh7XG4gICAgICAgIG5hbWU6ICdTeXN0ZW1FcnJvclJhdGUnLFxuICAgICAgICB2YWx1ZTogZXJyb3JSYXRlLFxuICAgICAgICB1bml0OiAnUGVyY2VudCcsXG4gICAgICAgIGRpbWVuc2lvbnNcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMucmVjb3JkUGVyZm9ybWFuY2VNZXRyaWNzKG1ldHJpY3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIFV0aWxpdHkgbWV0aG9kIHRvIGNodW5rIGFycmF5c1xuICAgKi9cbiAgcHJpdmF0ZSBjaHVua0FycmF5PFQ+KGFycmF5OiBUW10sIGNodW5rU2l6ZTogbnVtYmVyKTogVFtdW10ge1xuICAgIGNvbnN0IGNodW5rczogVFtdW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSArPSBjaHVua1NpemUpIHtcbiAgICAgIGNodW5rcy5wdXNoKGFycmF5LnNsaWNlKGksIGkgKyBjaHVua1NpemUpKTtcbiAgICB9XG4gICAgcmV0dXJuIGNodW5rcztcbiAgfVxufVxuXG4vLyBTaW5nbGV0b24gaW5zdGFuY2VcbmV4cG9ydCBjb25zdCBtb25pdG9yaW5nU2VydmljZSA9IG5ldyBNb25pdG9yaW5nU2VydmljZShcbiAgcHJvY2Vzcy5lbnYuQVdTX1JFR0lPTiB8fCAndXMtZWFzdC0xJyxcbiAgcHJvY2Vzcy5lbnYuQ0xPVURXQVRDSF9OQU1FU1BBQ0UgfHwgJ0ludmVzdG1lbnRBSScsXG4gIHByb2Nlc3MuZW52Lk5PREVfRU5WIHx8ICdkZXYnXG4pOyJdfQ==