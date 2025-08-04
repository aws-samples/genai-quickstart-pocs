import { CloudWatch } from 'aws-sdk';
import { monitoringService } from './monitoring-service';

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

export class UsageAnalyticsService {
  private cloudWatch: CloudWatch;
  private namespace: string;
  private environment: string;

  constructor(
    region: string = 'us-east-1',
    namespace: string = 'InvestmentAI',
    environment: string = 'dev'
  ) {
    this.cloudWatch = new CloudWatch({ region });
    this.namespace = namespace;
    this.environment = environment;
  }

  /**
   * Generate comprehensive usage report
   */
  async generateUsageReport(query: AnalyticsQuery): Promise<UsageReport> {
    try {
      const [
        totalRequests,
        errorMetrics,
        responseTimeMetrics,
        modelUsageStats,
        endpointStats,
        userStats
      ] = await Promise.all([
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
        uniqueOrganizations: 0, // Would need additional tracking
        topEndpoints: endpointStats,
        errorRate: errorMetrics.errorRate,
        averageResponseTime: responseTimeMetrics.average || 0,
        modelUsage: modelUsageStats,
        costAnalysis,
        userEngagement: userStats
      };

    } catch (error) {
      console.error('Failed to generate usage report:', error);
      throw error;
    }
  }

  /**
   * Get total API requests for the period
   */
  private async getTotalRequests(query: AnalyticsQuery): Promise<{ sum: number; datapoints: any[] }> {
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
  private async getErrorMetrics(query: AnalyticsQuery): Promise<{ errorRate: number; totalErrors: number }> {
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
  private async getResponseTimeMetrics(query: AnalyticsQuery): Promise<{ average: number; p95: number; p99: number }> {
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
    const p95 = datapoints.reduce((sum, point) => sum + ((point.ExtendedStatistics as any)?.p95 || 0), 0) / (datapoints.length || 1);
    const p99 = datapoints.reduce((sum, point) => sum + ((point.ExtendedStatistics as any)?.p99 || 0), 0) / (datapoints.length || 1);

    return { average, p95, p99 };
  }

  /**
   * Get model usage statistics
   */
  private async getModelUsageStats(query: AnalyticsQuery): Promise<ModelUsageStats[]> {
    // Get unique model names (in a real implementation, this would come from a configuration or discovery)
    const modelNames = ['Claude-Sonnet-3.7', 'Claude-Haiku-3.5', 'Amazon-Nova-Pro'];
    
    const modelStats = await Promise.all(
      modelNames.map(async (modelName) => {
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
      })
    );

    return modelStats.filter(stats => stats.totalCalls > 0);
  }

  /**
   * Get endpoint usage statistics
   */
  private async getEndpointUsageStats(query: AnalyticsQuery): Promise<EndpointUsage[]> {
    // In a real implementation, you would dynamically discover endpoints
    const commonEndpoints = [
      { endpoint: '/api/v1/ideas/generate', method: 'POST' },
      { endpoint: '/api/v1/knowledge/upload', method: 'POST' },
      { endpoint: '/api/v1/feedback', method: 'POST' },
      { endpoint: '/api/v1/market/signals', method: 'GET' },
      { endpoint: '/api/v1/ideas/{id}', method: 'GET' }
    ];

    const endpointStats = await Promise.all(
      commonEndpoints.map(async ({ endpoint, method }) => {
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
      })
    );

    return endpointStats
      .filter(stats => stats.requestCount > 0)
      .sort((a, b) => b.requestCount - a.requestCount);
  }

  /**
   * Get user engagement statistics
   */
  private async getUserEngagementStats(query: AnalyticsQuery): Promise<UserEngagementStats> {
    const [activeUsers, totalUsage, featureUsage] = await Promise.all([
      this.getUniqueUserCount(query),
      this.getMetricSum('UsageCount', query),
      this.getFeatureUsageStats(query)
    ]);

    return {
      activeUsers,
      newUsers: 0, // Would need additional tracking
      returningUsers: 0, // Would need additional tracking
      averageSessionDuration: 0, // Would need session tracking
      topFeatures: featureUsage,

    };
  }

  /**
   * Get cost analysis
   */
  private async getCostAnalysis(query: AnalyticsQuery): Promise<CostAnalysis> {
    const totalCost = await this.getMetricSum('ModelUsageCost', query);
    
    // Get cost by model
    const modelNames = ['Claude-Sonnet-3.7', 'Claude-Haiku-3.5', 'Amazon-Nova-Pro'];
    const costByModel: Record<string, number> = {};
    
    for (const modelName of modelNames) {
      costByModel[modelName] = await this.getMetricSum('ModelUsageCost', query, { ModelName: modelName });
    }

    // Calculate projected monthly cost
    const periodDays = (query.endTime.getTime() - query.startTime.getTime()) / (1000 * 60 * 60 * 24);
    const projectedMonthlyCost = periodDays > 0 ? (totalCost / periodDays) * 30 : 0;

    return {
      totalCost,
      costByModel,
      costByOrganization: {}, // Would need organization-specific tracking
      projectedMonthlyCost
    };
  }

  /**
   * Get feature usage statistics
   */
  private async getFeatureUsageStats(query: AnalyticsQuery): Promise<FeatureUsage[]> {
    const features = [
      'generate_investment_idea',
      'upload_proprietary_data',
      'submit_feedback',
      'query_market_data'
    ];

    const featureStats = await Promise.all(
      features.map(async (feature) => {
        const usageCount = await this.getMetricSum('UsageCount', query, { Action: feature });
        
        return {
          feature,
          usageCount,
          uniqueUsers: 0, // Would need additional tracking
          averageUsagePerUser: 0 // Would need additional tracking
        };
      })
    );

    return featureStats
      .filter(stats => stats.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Helper method to get metric sum
   */
  private async getMetricSum(
    metricName: string, 
    query: AnalyticsQuery, 
    additionalDimensions?: Record<string, string>
  ): Promise<number> {
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
  private async getMetricAverage(
    metricName: string, 
    query: AnalyticsQuery, 
    additionalDimensions?: Record<string, string>
  ): Promise<number> {
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
  private async getModelSuccessRate(modelName: string, query: AnalyticsQuery): Promise<number> {
    const [totalCalls, successfulCalls] = await Promise.all([
      this.getMetricSum('ModelUsageCount', query, { ModelName: modelName }),
      this.getMetricSum('ModelUsageCount', query, { ModelName: modelName, Success: 'true' })
    ]);

    return totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
  }

  /**
   * Get unique user count (simplified - would need more sophisticated tracking in real implementation)
   */
  private async getUniqueUserCount(query: AnalyticsQuery): Promise<number> {
    // This is a simplified implementation
    // In reality, you'd need to track unique users separately
    const totalUsage = await this.getMetricSum('UsageCount', query);
    return Math.ceil(totalUsage / 10); // Rough estimate
  }

  /**
   * Convert granularity to seconds
   */
  private getPeriodInSeconds(granularity: 'hour' | 'day' | 'week' | 'month'): number {
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
  async exportUsageData(query: AnalyticsQuery, format: 'json' | 'csv' = 'json'): Promise<string> {
    const report = await this.generateUsageReport(query);
    
    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    } else {
      // Convert to CSV format
      return this.convertToCSV(report);
    }
  }

  /**
   * Convert usage report to CSV format
   */
  private convertToCSV(report: UsageReport): string {
    const lines: string[] = [];
    
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

// Singleton instance
export const usageAnalyticsService = new UsageAnalyticsService(
  process.env.AWS_REGION || 'us-east-1',
  process.env.CLOUDWATCH_NAMESPACE || 'InvestmentAI',
  process.env.NODE_ENV || 'dev'
);