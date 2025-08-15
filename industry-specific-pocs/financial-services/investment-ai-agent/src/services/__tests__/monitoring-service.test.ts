import { MonitoringService, PerformanceMetric, ErrorMetric, UsageMetric } from '../monitoring/monitoring-service';
import { CloudWatch } from 'aws-sdk';

// Mock AWS SDK
jest.mock('aws-sdk');

describe('MonitoringService', () => {
  let monitoringService: MonitoringService;
  let mockCloudWatch: jest.Mocked<CloudWatch>;

  beforeEach(() => {
    mockCloudWatch = {
      putMetricData: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      })
    } as any;

    (CloudWatch as jest.MockedClass<typeof CloudWatch>).mockImplementation(() => mockCloudWatch);
    
    monitoringService = new MonitoringService('us-east-1', 'TestNamespace', 'test');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recordPerformanceMetric', () => {
    it('should record a performance metric successfully', async () => {
      const metric: PerformanceMetric = {
        name: 'TestMetric',
        value: 100,
        unit: 'Milliseconds',
        dimensions: { Service: 'TestService' }
      };

      await monitoringService.recordPerformanceMetric(metric);

      expect(mockCloudWatch.putMetricData).toHaveBeenCalledWith({
        Namespace: 'TestNamespace',
        MetricData: [{
          MetricName: 'TestMetric',
          Value: 100,
          Unit: 'Milliseconds',
          Timestamp: expect.any(Date),
          Dimensions: [
            { Name: 'Environment', Value: 'test' },
            { Name: 'Service', Value: 'TestService' }
          ]
        }]
      });
    });

    it('should handle errors gracefully', async () => {
      const metric: PerformanceMetric = {
        name: 'TestMetric',
        value: 100,
        unit: 'Count'
      };

      mockCloudWatch.putMetricData.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('CloudWatch error'))
      } as any);

      // Should not throw error
      await expect(monitoringService.recordPerformanceMetric(metric)).resolves.toBeUndefined();
    });
  });

  describe('recordPerformanceMetrics', () => {
    it('should record multiple metrics in batches', async () => {
      const metrics: PerformanceMetric[] = Array.from({ length: 25 }, (_, i) => ({
        name: `TestMetric${i}`,
        value: i,
        unit: 'Count'
      }));

      await monitoringService.recordPerformanceMetrics(metrics);

      // Should be called twice due to 20-metric batch limit
      expect(mockCloudWatch.putMetricData).toHaveBeenCalledTimes(2);
      
      // First batch should have 20 metrics
      expect(mockCloudWatch.putMetricData).toHaveBeenNthCalledWith(1, {
        Namespace: 'TestNamespace',
        MetricData: expect.arrayContaining([
          expect.objectContaining({ MetricName: 'TestMetric0' })
        ])
      });

      // Second batch should have 5 metrics
      expect(mockCloudWatch.putMetricData).toHaveBeenNthCalledWith(2, {
        Namespace: 'TestNamespace',
        MetricData: expect.arrayContaining([
          expect.objectContaining({ MetricName: 'TestMetric20' })
        ])
      });
    });
  });

  describe('recordError', () => {
    it('should record error metrics', async () => {
      const error: ErrorMetric = {
        errorType: 'ValidationError',
        errorMessage: 'Invalid input',
        service: 'TestService',
        severity: 'medium'
      };

      await monitoringService.recordError(error);

      expect(mockCloudWatch.putMetricData).toHaveBeenCalledWith({
        Namespace: 'TestNamespace',
        MetricData: [
          {
            MetricName: 'ErrorCount',
            Value: 1,
            Unit: 'Count',
            Timestamp: expect.any(Date),
            Dimensions: [
              { Name: 'Environment', Value: 'test' },
              { Name: 'Service', Value: 'TestService' },
              { Name: 'ErrorType', Value: 'ValidationError' },
              { Name: 'Severity', Value: 'medium' }
            ]
          },
          {
            MetricName: 'Error_medium',
            Value: 1,
            Unit: 'Count',
            Timestamp: expect.any(Date),
            Dimensions: [
              { Name: 'Environment', Value: 'test' },
              { Name: 'Service', Value: 'TestService' },
              { Name: 'ErrorType', Value: 'ValidationError' },
              { Name: 'Severity', Value: 'medium' }
            ]
          }
        ]
      });
    });
  });

  describe('recordUsage', () => {
    it('should record usage metrics', async () => {
      const usage: UsageMetric = {
        userId: 'user123',
        organizationId: 'org456',
        action: 'generate_idea',
        resource: 'investment_ideas',
        duration: 1500,
        success: true
      };

      await monitoringService.recordUsage(usage);

      expect(mockCloudWatch.putMetricData).toHaveBeenCalledWith({
        Namespace: 'TestNamespace',
        MetricData: [
          {
            MetricName: 'UsageCount',
            Value: 1,
            Unit: 'Count',
            Timestamp: expect.any(Date),
            Dimensions: [
              { Name: 'Environment', Value: 'test' },
              { Name: 'Action', Value: 'generate_idea' },
              { Name: 'Resource', Value: 'investment_ideas' },
              { Name: 'Success', Value: 'true' },
              { Name: 'OrganizationId', Value: 'org456' }
            ]
          },
          {
            MetricName: 'UsageDuration',
            Value: 1500,
            Unit: 'Milliseconds',
            Timestamp: expect.any(Date),
            Dimensions: [
              { Name: 'Environment', Value: 'test' },
              { Name: 'Action', Value: 'generate_idea' },
              { Name: 'Resource', Value: 'investment_ideas' },
              { Name: 'Success', Value: 'true' },
              { Name: 'OrganizationId', Value: 'org456' }
            ]
          },
          {
            MetricName: 'SuccessCount',
            Value: 1,
            Unit: 'Count',
            Timestamp: expect.any(Date),
            Dimensions: [
              { Name: 'Environment', Value: 'test' },
              { Name: 'Action', Value: 'generate_idea' },
              { Name: 'Resource', Value: 'investment_ideas' },
              { Name: 'Success', Value: 'true' },
              { Name: 'OrganizationId', Value: 'org456' }
            ]
          }
        ]
      });
    });
  });

  describe('recordApiRequest', () => {
    it('should record API request metrics', async () => {
      await monitoringService.recordApiRequest(
        '/api/v1/ideas',
        'POST',
        200,
        1200,
        'user123',
        'org456'
      );

      expect(mockCloudWatch.putMetricData).toHaveBeenCalledWith({
        Namespace: 'TestNamespace',
        MetricData: [
          expect.objectContaining({
            MetricName: 'ApiRequestCount',
            Value: 1,
            Unit: 'Count'
          }),
          expect.objectContaining({
            MetricName: 'ApiRequestDuration',
            Value: 1200,
            Unit: 'Milliseconds'
          }),
          expect.objectContaining({
            MetricName: 'ApiRequestSuccess',
            Value: 1,
            Unit: 'Count'
          })
        ]
      });
    });

    it('should record error metrics for failed requests', async () => {
      await monitoringService.recordApiRequest(
        '/api/v1/ideas',
        'POST',
        500,
        2000
      );

      expect(mockCloudWatch.putMetricData).toHaveBeenCalledWith({
        Namespace: 'TestNamespace',
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            MetricName: 'ApiRequestError',
            Value: 1,
            Unit: 'Count'
          })
        ])
      });
    });
  });

  describe('recordModelUsage', () => {
    it('should record model usage metrics', async () => {
      await monitoringService.recordModelUsage(
        'Claude-Sonnet-3.7',
        'text-generation',
        3000,
        true,
        1500,
        0.05
      );

      expect(mockCloudWatch.putMetricData).toHaveBeenCalledWith({
        Namespace: 'TestNamespace',
        MetricData: [
          expect.objectContaining({
            MetricName: 'ModelUsageCount',
            Value: 1,
            Unit: 'Count'
          }),
          expect.objectContaining({
            MetricName: 'ModelUsageDuration',
            Value: 3000,
            Unit: 'Milliseconds'
          }),
          expect.objectContaining({
            MetricName: 'ModelTokenCount',
            Value: 1500,
            Unit: 'Count'
          }),
          expect.objectContaining({
            MetricName: 'ModelUsageCost',
            Value: 0.05,
            Unit: 'Count'
          })
        ]
      });
    });
  });

  describe('recordSystemHealth', () => {
    it('should record system health metrics', async () => {
      await monitoringService.recordSystemHealth(
        'API',
        'healthy',
        150,
        2.5
      );

      expect(mockCloudWatch.putMetricData).toHaveBeenCalledWith({
        Namespace: 'TestNamespace',
        MetricData: [
          expect.objectContaining({
            MetricName: 'SystemHealthCheck',
            Value: 1,
            Unit: 'Count'
          }),
          expect.objectContaining({
            MetricName: 'SystemResponseTime',
            Value: 150,
            Unit: 'Milliseconds'
          }),
          expect.objectContaining({
            MetricName: 'SystemErrorRate',
            Value: 2.5,
            Unit: 'Percent'
          })
        ]
      });
    });

    it('should record unhealthy status correctly', async () => {
      await monitoringService.recordSystemHealth('API', 'unhealthy');

      expect(mockCloudWatch.putMetricData).toHaveBeenCalledWith({
        Namespace: 'TestNamespace',
        MetricData: [
          expect.objectContaining({
            MetricName: 'SystemHealthCheck',
            Value: 0,
            Unit: 'Count'
          })
        ]
      });
    });
  });
});