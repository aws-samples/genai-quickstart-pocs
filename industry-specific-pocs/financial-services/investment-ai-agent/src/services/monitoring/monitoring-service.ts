import { CloudWatch } from 'aws-sdk';

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

export class MonitoringService {
  private cloudWatch: CloudWatch;
  private namespace: string;
  private environment: string;

  constructor(region: string = 'us-east-1', namespace: string = 'InvestmentAI', environment: string = 'dev') {
    this.cloudWatch = new CloudWatch({ region });
    this.namespace = namespace;
    this.environment = environment;
  }

  /**
   * Record performance metrics
   */
  async recordPerformanceMetric(metric: PerformanceMetric): Promise<void> {
    try {
      const dimensions: CloudWatch.Dimension[] = [
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
    } catch (error) {
      console.error('Failed to record performance metric:', error);
      // Don't throw error to avoid impacting main application flow
    }
  }

  /**
   * Record multiple performance metrics in batch
   */
  async recordPerformanceMetrics(metrics: PerformanceMetric[]): Promise<void> {
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
    } catch (error) {
      console.error('Failed to record performance metrics:', error);
    }
  }

  /**
   * Record error metrics
   */
  async recordError(error: ErrorMetric): Promise<void> {
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

    } catch (cloudWatchError) {
      console.error('Failed to record error metric:', cloudWatchError);
    }
  }

  /**
   * Record usage analytics
   */
  async recordUsage(usage: UsageMetric): Promise<void> {
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

    } catch (error) {
      console.error('Failed to record usage metric:', error);
    }
  }

  /**
   * Record API request metrics
   */
  async recordApiRequest(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    userId?: string,
    organizationId?: string
  ): Promise<void> {
    const dimensions = [
      { Name: 'Environment', Value: this.environment },
      { Name: 'Endpoint', Value: endpoint },
      { Name: 'Method', Value: method },
      { Name: 'StatusCode', Value: statusCode.toString() }
    ];

    if (organizationId) {
      dimensions.push({ Name: 'OrganizationId', Value: organizationId });
    }

    const metrics: PerformanceMetric[] = [
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
    } else {
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
  async recordModelUsage(
    modelName: string,
    operation: string,
    duration: number,
    success: boolean,
    tokenCount?: number,
    cost?: number
  ): Promise<void> {
    const dimensions = {
      Environment: this.environment,
      ModelName: modelName,
      Operation: operation,
      Success: success.toString()
    };

    const metrics: PerformanceMetric[] = [
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
        unit: 'Count', // Using Count for currency values
        dimensions
      });
    }

    await this.recordPerformanceMetrics(metrics);
  }

  /**
   * Record system health metrics
   */
  async recordSystemHealth(
    service: string,
    healthStatus: 'healthy' | 'degraded' | 'unhealthy',
    responseTime?: number,
    errorRate?: number
  ): Promise<void> {
    const dimensions = {
      Environment: this.environment,
      Service: service,
      HealthStatus: healthStatus
    };

    const metrics: PerformanceMetric[] = [
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
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Singleton instance
export const monitoringService = new MonitoringService(
  process.env.AWS_REGION || 'us-east-1',
  process.env.CLOUDWATCH_NAMESPACE || 'InvestmentAI',
  process.env.NODE_ENV || 'dev'
);