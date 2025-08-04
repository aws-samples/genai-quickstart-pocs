import { UsageAnalyticsService, AnalyticsQuery } from '../monitoring/usage-analytics-service';
import { CloudWatch } from 'aws-sdk';

// Mock AWS SDK
jest.mock('aws-sdk');

describe('UsageAnalyticsService', () => {
  let usageAnalyticsService: UsageAnalyticsService;
  let mockCloudWatch: jest.Mocked<CloudWatch>;

  beforeEach(() => {
    mockCloudWatch = {
      getMetricStatistics: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Datapoints: [] })
      })
    } as any;

    (CloudWatch as jest.MockedClass<typeof CloudWatch>).mockImplementation(() => mockCloudWatch);
    
    usageAnalyticsService = new UsageAnalyticsService('us-east-1', 'TestNamespace', 'test');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateUsageReport', () => {
    it('should generate comprehensive usage report', async () => {
      const query: AnalyticsQuery = {
        startTime: new Date('2023-01-01T00:00:00Z'),
        endTime: new Date('2023-01-02T00:00:00Z'),
        granularity: 'hour'
      };

      // Mock CloudWatch responses
      mockCloudWatch.getMetricStatistics
        .mockReturnValueOnce({
          promise: jest.fn().mockResolvedValue({
            Datapoints: [
              { Sum: 100, Timestamp: new Date('2023-01-01T01:00:00Z') },
              { Sum: 150, Timestamp: new Date('2023-01-01T02:00:00Z') }
            ]
          })
        })
        .mockReturnValueOnce({
          promise: jest.fn().mockResolvedValue({
            Datapoints: [
              { Sum: 5, Timestamp: new Date('2023-01-01T01:00:00Z') }
            ]
          })
        })
        .mockReturnValueOnce({
          promise: jest.fn().mockResolvedValue({
            Datapoints: [
              { Average: 1200, ExtendedStatistics: { p95: 2000, p99: 3000 } }
            ]
          })
        })
        .mockReturnValue({
          promise: jest.fn().mockResolvedValue({
            Datapoints: [
              { Sum: 10, Average: 500 }
            ]
          })
        });

      const report = await usageAnalyticsService.generateUsageReport(query);

      expect(report).toMatchObject({
        period: {
          start: query.startTime,
          end: query.endTime
        },
        totalRequests: 250,
        errorRate: expect.any(Number),
        averageResponseTime: expect.any(Number)
      });

      expect(report.modelUsage).toBeInstanceOf(Array);
      expect(report.topEndpoints).toBeInstanceOf(Array);
      expect(report.costAnalysis).toHaveProperty('totalCost');
      expect(report.userEngagement).toHaveProperty('activeUsers');
    });

    it('should handle CloudWatch errors gracefully', async () => {
      const query: AnalyticsQuery = {
        startTime: new Date('2023-01-01T00:00:00Z'),
        endTime: new Date('2023-01-02T00:00:00Z')
      };

      mockCloudWatch.getMetricStatistics.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('CloudWatch error'))
      });

      await expect(usageAnalyticsService.generateUsageReport(query)).rejects.toThrow('CloudWatch error');
    });
  });

  describe('exportUsageData', () => {
    it('should export usage data in JSON format', async () => {
      const query: AnalyticsQuery = {
        startTime: new Date('2023-01-01T00:00:00Z'),
        endTime: new Date('2023-01-02T00:00:00Z')
      };

      // Mock minimal CloudWatch responses
      mockCloudWatch.getMetricStatistics.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Datapoints: [{ Sum: 100 }]
        })
      });

      const result = await usageAnalyticsService.exportUsageData(query, 'json');

      expect(result).toContain('"totalRequests"');
      expect(result).toContain('"period"');
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should export usage data in CSV format', async () => {
      const query: AnalyticsQuery = {
        startTime: new Date('2023-01-01T00:00:00Z'),
        endTime: new Date('2023-01-02T00:00:00Z')
      };

      // Mock minimal CloudWatch responses
      mockCloudWatch.getMetricStatistics.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Datapoints: [{ Sum: 100 }]
        })
      });

      const result = await usageAnalyticsService.exportUsageData(query, 'csv');

      expect(result).toContain('Metric,Value,Period Start,Period End');
      expect(result).toContain('Total Requests');
      expect(result).toContain('Error Rate');
    });
  });

  describe('private helper methods', () => {
    it('should convert granularity to seconds correctly', () => {
      // Access private method through type assertion for testing
      const service = usageAnalyticsService as any;
      
      expect(service.getPeriodInSeconds('hour')).toBe(3600);
      expect(service.getPeriodInSeconds('day')).toBe(86400);
      expect(service.getPeriodInSeconds('week')).toBe(604800);
      expect(service.getPeriodInSeconds('month')).toBe(2592000);
    });
  });

  describe('metric aggregation', () => {
    it('should handle empty datapoints gracefully', async () => {
      const query: AnalyticsQuery = {
        startTime: new Date('2023-01-01T00:00:00Z'),
        endTime: new Date('2023-01-02T00:00:00Z')
      };

      mockCloudWatch.getMetricStatistics.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Datapoints: []
        })
      });

      const report = await usageAnalyticsService.generateUsageReport(query);

      expect(report.totalRequests).toBe(0);
      expect(report.errorRate).toBe(0);
      expect(report.averageResponseTime).toBe(0);
    });

    it('should filter out models with zero usage', async () => {
      const query: AnalyticsQuery = {
        startTime: new Date('2023-01-01T00:00:00Z'),
        endTime: new Date('2023-01-02T00:00:00Z')
      };

      // Mock responses where some models have zero usage
      let callCount = 0;
      mockCloudWatch.getMetricStatistics.mockImplementation(() => {
        callCount++;
        const responses = [
          { Datapoints: [{ Sum: 100 }] }, // Total requests
          { Datapoints: [{ Sum: 5 }] },   // Errors
          { Datapoints: [{ Average: 1200 }] }, // Response time
          { Datapoints: [{ Sum: 50 }] },  // Model 1 usage
          { Datapoints: [{ Sum: 0 }] },   // Model 1 tokens
          { Datapoints: [{ Sum: 0 }] },   // Model 1 cost
          { Datapoints: [{ Average: 1000 }] }, // Model 1 response time
          { Datapoints: [{ Sum: 45 }] },  // Model 1 success calls
          { Datapoints: [{ Sum: 0 }] },   // Model 2 usage (zero)
          { Datapoints: [] }
        ];
        
        return {
          promise: jest.fn().mockResolvedValue(responses[callCount - 1] || { Datapoints: [] })
        };
      });

      const report = await usageAnalyticsService.generateUsageReport(query);

      // Should only include models with usage > 0
      expect(report.modelUsage).toHaveLength(1);
      expect(report.modelUsage[0].totalCalls).toBe(50);
    });
  });

  describe('cost analysis', () => {
    it('should calculate projected monthly cost correctly', async () => {
      const query: AnalyticsQuery = {
        startTime: new Date('2023-01-01T00:00:00Z'),
        endTime: new Date('2023-01-02T00:00:00Z') // 1 day period
      };

      // Mock cost of $10 for 1 day
      let callCount = 0;
      mockCloudWatch.getMetricStatistics.mockImplementation(() => {
        callCount++;
        const responses = [
          { Datapoints: [{ Sum: 100 }] }, // Total requests
          { Datapoints: [{ Sum: 5 }] },   // Errors
          { Datapoints: [{ Average: 1200 }] }, // Response time
          { Datapoints: [{ Sum: 10 }] }     // Total cost
        ];
        
        return {
          promise: jest.fn().mockResolvedValue(responses[callCount - 1] || { Datapoints: [{ Sum: 10 }] })
        };
      });

      const report = await usageAnalyticsService.generateUsageReport(query);

      // Should project $300 for 30 days ($10 * 30)
      expect(report.costAnalysis.projectedMonthlyCost).toBe(300);
    });
  });

  describe('endpoint filtering', () => {
    it('should sort endpoints by request count', async () => {
      const query: AnalyticsQuery = {
        startTime: new Date('2023-01-01T00:00:00Z'),
        endTime: new Date('2023-01-02T00:00:00Z')
      };

      // Mock different request counts for different endpoints
      let callCount = 0;
      mockCloudWatch.getMetricStatistics.mockImplementation(() => {
        callCount++;
        if (callCount <= 3) {
          return {
            promise: jest.fn().mockResolvedValue({ Datapoints: [{ Sum: 100 }] })
          };
        }
        // For endpoint stats, return different values
        const endpointCounts = [50, 100, 25, 75, 10]; // Different request counts
        const index = (callCount - 4) % 15; // 3 metrics per endpoint * 5 endpoints
        const metricIndex = Math.floor(index / 5);
        const endpointIndex = index % 5;
        
        if (metricIndex === 0) { // Request count
          return {
            promise: jest.fn().mockResolvedValue({ Datapoints: [{ Sum: endpointCounts[endpointIndex] }] })
          };
        } else { // Response time or error count
          return {
            promise: jest.fn().mockResolvedValue({ Datapoints: [{ Average: 1000, Sum: 1 }] })
          };
        }
      });

      const report = await usageAnalyticsService.generateUsageReport(query);

      // Should be sorted by request count (descending)
      expect(report.topEndpoints.length).toBeGreaterThan(0);
      for (let i = 1; i < report.topEndpoints.length; i++) {
        expect(report.topEndpoints[i-1].requestCount).toBeGreaterThanOrEqual(
          report.topEndpoints[i].requestCount
        );
      }
    });
  });
});