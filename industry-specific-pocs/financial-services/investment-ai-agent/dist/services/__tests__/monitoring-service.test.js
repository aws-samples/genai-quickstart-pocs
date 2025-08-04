"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const monitoring_service_1 = require("../monitoring/monitoring-service");
const aws_sdk_1 = require("aws-sdk");
// Mock AWS SDK
jest.mock('aws-sdk');
describe('MonitoringService', () => {
    let monitoringService;
    let mockCloudWatch;
    beforeEach(() => {
        mockCloudWatch = {
            putMetricData: jest.fn().mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            })
        };
        aws_sdk_1.CloudWatch.mockImplementation(() => mockCloudWatch);
        monitoringService = new monitoring_service_1.MonitoringService('us-east-1', 'TestNamespace', 'test');
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('recordPerformanceMetric', () => {
        it('should record a performance metric successfully', async () => {
            const metric = {
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
            const metric = {
                name: 'TestMetric',
                value: 100,
                unit: 'Count'
            };
            mockCloudWatch.putMetricData.mockReturnValue({
                promise: jest.fn().mockRejectedValue(new Error('CloudWatch error'))
            });
            // Should not throw error
            await expect(monitoringService.recordPerformanceMetric(metric)).resolves.toBeUndefined();
        });
    });
    describe('recordPerformanceMetrics', () => {
        it('should record multiple metrics in batches', async () => {
            const metrics = Array.from({ length: 25 }, (_, i) => ({
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
            const error = {
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
            const usage = {
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
            await monitoringService.recordApiRequest('/api/v1/ideas', 'POST', 200, 1200, 'user123', 'org456');
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
            await monitoringService.recordApiRequest('/api/v1/ideas', 'POST', 500, 2000);
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
            await monitoringService.recordModelUsage('Claude-Sonnet-3.7', 'text-generation', 3000, true, 1500, 0.05);
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
            await monitoringService.recordSystemHealth('API', 'healthy', 150, 2.5);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uaXRvcmluZy1zZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2VydmljZXMvX190ZXN0c19fL21vbml0b3Jpbmctc2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEseUVBQWtIO0FBQ2xILHFDQUFxQztBQUVyQyxlQUFlO0FBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUVyQixRQUFRLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO0lBQ2pDLElBQUksaUJBQW9DLENBQUM7SUFDekMsSUFBSSxjQUF1QyxDQUFDO0lBRTVDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDZCxjQUFjLEdBQUc7WUFDZixhQUFhLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLGVBQWUsQ0FBQztnQkFDdkMsT0FBTyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7YUFDekMsQ0FBQztTQUNJLENBQUM7UUFFUixvQkFBa0QsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUU3RixpQkFBaUIsR0FBRyxJQUFJLHNDQUFpQixDQUFDLFdBQVcsRUFBRSxlQUFlLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDbEYsQ0FBQyxDQUFDLENBQUM7SUFFSCxTQUFTLENBQUMsR0FBRyxFQUFFO1FBQ2IsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ3ZCLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtRQUN2QyxFQUFFLENBQUMsaURBQWlELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDL0QsTUFBTSxNQUFNLEdBQXNCO2dCQUNoQyxJQUFJLEVBQUUsWUFBWTtnQkFDbEIsS0FBSyxFQUFFLEdBQUc7Z0JBQ1YsSUFBSSxFQUFFLGNBQWM7Z0JBQ3BCLFVB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QkFBZ0IsQ0FBQzt3QkFDdEIsVUFBVSxFQUFFLG1CQUFtQjt3QkFDL0IsS0FBSyxFQUFFLENBQUM7d0JBQ1IsSUFBSSxFQUFFLE9BQU87cUJBQ2QsQ0FBQztpQkFDSDthQUNGLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vbml0b3JpbmdTZXJ2aWNlLCBQZXJmb3JtYW5jZU1ldHJpYywgRXJyb3JNZXRyaWMsIFVzYWdlTWV0cmljIH0gZnJvbSAnLi4vbW9uaXRvcmluZy9tb25pdG9yaW5nLXNlcnZpY2UnO1xuaW1wb3J0IHsgQ2xvdWRXYXRjaCB9IGZyb20gJ2F3cy1zZGsnO1xuXG4vLyBNb2NrIEFXUyBTREtcbmplc3QubW9jaygnYXdzLXNkaycpO1xuXG5kZXNjcmliZSgnTW9uaXRvcmluZ1NlcnZpY2UnLCAoKSA9PiB7XG4gIGxldCBtb25pdG9yaW5nU2VydmljZTogTW9uaXRvcmluZ1NlcnZpY2U7XG4gIGxldCBtb2NrQ2xvdWRXYXRjaDogamVzdC5Nb2NrZWQ8Q2xvdWRXYXRjaD47XG5cbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgbW9ja0Nsb3VkV2F0Y2ggPSB7XG4gICAgICBwdXRNZXRyaWNEYXRhOiBqZXN0LmZuKCkubW9ja1JldHVyblZhbHVlKHtcbiAgICAgICAgcHJvbWlzZTogamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKHt9KVxuICAgICAgfSlcbiAgICB9IGFzIGFueTtcblxuICAgIChDbG91ZFdhdGNoIGFzIGplc3QuTW9ja2VkQ2xhc3M8dHlwZW9mIENsb3VkV2F0Y2g+KS5tb2NrSW1wbGVtZW50YXRpb24oKCkgPT4gbW9ja0Nsb3VkV2F0Y2gpO1xuICAgIFxuICAgIG1vbml0b3JpbmdTZXJ2aWNlID0gbmV3IE1vbml0b3JpbmdTZXJ2aWNlKCd1cy1lYXN0LTEnLCAnVGVzdE5hbWVzcGFjZScsICd0ZXN0Jyk7XG4gIH0pO1xuXG4gIGFmdGVyRWFjaCgoKSA9PiB7XG4gICAgamVzdC5jbGVhckFsbE1vY2tzKCk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdyZWNvcmRQZXJmb3JtYW5jZU1ldHJpYycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHJlY29yZCBhIHBlcmZvcm1hbmNlIG1ldHJpYyBzdWNjZXNzZnVsbHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBtZXRyaWM6IFBlcmZvcm1hbmNlTWV0cmljID0ge1xuICAgICAgICBuYW1lOiAnVGVzdE1ldHJpYycsXG4gICAgICAgIHZhbHVlOiAxMDAsXG4gICAgICAgIHVuaXQ6ICdNaWxsaXNlY29uZHMnLFxuICAgICAgICBkaW1lbnNpb25zOiB7IFNlcnZpY2U6ICdUZXN0U2VydmljZScgfVxuICAgICAgfTtcblxuICAgICAgYXdhaXQgbW9uaXRvcmluZ1NlcnZpY2UucmVjb3JkUGVyZm9ybWFuY2VNZXRyaWMobWV0cmljKTtcblxuICAgICAgZXhwZWN0KG1vY2tDbG91ZFdhdGNoLnB1dE1ldHJpY0RhdGEpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHtcbiAgICAgICAgTmFtZXNwYWNlOiAnVGVzdE5hbWVzcGFjZScsXG4gICAgICAgIE1ldHJpY0RhdGE6IFt7XG4gICAgICAgICAgTWV0cmljTmFtZTogJ1Rlc3RNZXRyaWMnLFxuICAgICAgICAgIFZhbHVlOiAxMDAsXG4gICAgICAgICAgVW5pdDogJ01pbGxpc2Vjb25kcycsXG4gICAgICAgICAgVGltZXN0YW1wOiBleHBlY3QuYW55KERhdGUpLFxuICAgICAgICAgIERpbWVuc2lvbnM6IFtcbiAgICAgICAgICAgIHsgTmFtZTogJ0Vudmlyb25tZW50JywgVmFsdWU6ICd0ZXN0JyB9LFxuICAgICAgICAgICAgeyBOYW1lOiAnU2VydmljZScsIFZhbHVlOiAnVGVzdFNlcnZpY2UnIH1cbiAgICAgICAgICBdXG4gICAgICAgIH1dXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIGVycm9ycyBncmFjZWZ1bGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbWV0cmljOiBQZXJmb3JtYW5jZU1ldHJpYyA9IHtcbiAgICAgICAgbmFtZTogJ1Rlc3RNZXRyaWMnLFxuICAgICAgICB2YWx1ZTogMTAwLFxuICAgICAgICB1bml0OiAnQ291bnQnXG4gICAgICB9O1xuXG4gICAgICBtb2NrQ2xvdWRXYXRjaC5wdXRNZXRyaWNEYXRhLm1vY2tSZXR1cm5WYWx1ZSh7XG4gICAgICAgIHByb21pc2U6IGplc3QuZm4oKS5tb2NrUmVqZWN0ZWRWYWx1ZShuZXcgRXJyb3IoJ0Nsb3VkV2F0Y2ggZXJyb3InKSlcbiAgICAgIH0gYXMgYW55KTtcblxuICAgICAgLy8gU2hvdWxkIG5vdCB0aHJvdyBlcnJvclxuICAgICAgYXdhaXQgZXhwZWN0KG1vbml0b3JpbmdTZXJ2aWNlLnJlY29yZFBlcmZvcm1hbmNlTWV0cmljKG1ldHJpYykpLnJlc29sdmVzLnRvQmVVbmRlZmluZWQoKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3JlY29yZFBlcmZvcm1hbmNlTWV0cmljcycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHJlY29yZCBtdWx0aXBsZSBtZXRyaWNzIGluIGJhdGNoZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBtZXRyaWNzOiBQZXJmb3JtYW5jZU1ldHJpY1tdID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogMjUgfSwgKF8sIGkpID0+ICh7XG4gICAgICAgIG5hbWU6IGBUZXN0TWV0cmljJHtpfWAsXG4gICAgICAgIHZhbHVlOiBpLFxuICAgICAgICB1bml0OiAnQ291bnQnXG4gICAgICB9KSk7XG5cbiAgICAgIGF3YWl0IG1vbml0b3JpbmdTZXJ2aWNlLnJlY29yZFBlcmZvcm1hbmNlTWV0cmljcyhtZXRyaWNzKTtcblxuICAgICAgLy8gU2hvdWxkIGJlIGNhbGxlZCB0d2ljZSBkdWUgdG8gMjAtbWV0cmljIGJhdGNoIGxpbWl0XG4gICAgICBleHBlY3QobW9ja0Nsb3VkV2F0Y2gucHV0TWV0cmljRGF0YSkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDIpO1xuICAgICAgXG4gICAgICAvLyBGaXJzdCBiYXRjaCBzaG91bGQgaGF2ZSAyMCBtZXRyaWNzXG4gICAgICBleHBlY3QobW9ja0Nsb3VkV2F0Y2gucHV0TWV0cmljRGF0YSkudG9IYXZlQmVlbk50aENhbGxlZFdpdGgoMSwge1xuICAgICAgICBOYW1lc3BhY2U6ICdUZXN0TmFtZXNwYWNlJyxcbiAgICAgICAgTWV0cmljRGF0YTogZXhwZWN0LmFycmF5Q29udGFpbmluZyhbXG4gICAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoeyBNZXRyaWNOYW1lOiAnVGVzdE1ldHJpYzAnIH0pXG4gICAgICAgIF0pXG4gICAgICB9KTtcblxuICAgICAgLy8gU2Vjb25kIGJhdGNoIHNob3VsZCBoYXZlIDUgbWV0cmljc1xuICAgICAgZXhwZWN0KG1vY2tDbG91ZFdhdGNoLnB1dE1ldHJpY0RhdGEpLnRvSGF2ZUJlZW5OdGhDYWxsZWRXaXRoKDIsIHtcbiAgICAgICAgTmFtZXNwYWNlOiAnVGVzdE5hbWVzcGFjZScsXG4gICAgICAgIE1ldHJpY0RhdGE6IGV4cGVjdC5hcnJheUNvbnRhaW5pbmcoW1xuICAgICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHsgTWV0cmljTmFtZTogJ1Rlc3RNZXRyaWMyMCcgfSlcbiAgICAgICAgXSlcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgncmVjb3JkRXJyb3InLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZWNvcmQgZXJyb3IgbWV0cmljcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGVycm9yOiBFcnJvck1ldHJpYyA9IHtcbiAgICAgICAgZXJyb3JUeXBlOiAnVmFsaWRhdGlvbkVycm9yJyxcbiAgICAgICAgZXJyb3JNZXNzYWdlOiAnSW52YWxpZCBpbnB1dCcsXG4gICAgICAgIHNlcnZpY2U6ICdUZXN0U2VydmljZScsXG4gICAgICAgIHNldmVyaXR5OiAnbWVkaXVtJ1xuICAgICAgfTtcblxuICAgICAgYXdhaXQgbW9uaXRvcmluZ1NlcnZpY2UucmVjb3JkRXJyb3IoZXJyb3IpO1xuXG4gICAgICBleHBlY3QobW9ja0Nsb3VkV2F0Y2gucHV0TWV0cmljRGF0YSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoe1xuICAgICAgICBOYW1lc3BhY2U6ICdUZXN0TmFtZXNwYWNlJyxcbiAgICAgICAgTWV0cmljRGF0YTogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIE1ldHJpY05hbWU6ICdFcnJvckNvdW50JyxcbiAgICAgICAgICAgIFZhbHVlOiAxLFxuICAgICAgICAgICAgVW5pdDogJ0NvdW50JyxcbiAgICAgICAgICAgIFRpbWVzdGFtcDogZXhwZWN0LmFueShEYXRlKSxcbiAgICAgICAgICAgIERpbWVuc2lvbnM6IFtcbiAgICAgICAgICAgICAgeyBOYW1lOiAnRW52aXJvbm1lbnQnLCBWYWx1ZTogJ3Rlc3QnIH0sXG4gICAgICAgICAgICAgIHsgTmFtZTogJ1NlcnZpY2UnLCBWYWx1ZTogJ1Rlc3RTZXJ2aWNlJyB9LFxuICAgICAgICAgICAgICB7IE5hbWU6ICdFcnJvclR5cGUnLCBWYWx1ZTogJ1ZhbGlkYXRpb25FcnJvcicgfSxcbiAgICAgICAgICAgICAgeyBOYW1lOiAnU2V2ZXJpdHknLCBWYWx1ZTogJ21lZGl1bScgfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgTWV0cmljTmFtZTogJ0Vycm9yX21lZGl1bScsXG4gICAgICAgICAgICBWYWx1ZTogMSxcbiAgICAgICAgICAgIFVuaXQ6ICdDb3VudCcsXG4gICAgICAgICAgICBUaW1lc3RhbXA6IGV4cGVjdC5hbnkoRGF0ZSksXG4gICAgICAgICAgICBEaW1lbnNpb25zOiBbXG4gICAgICAgICAgICAgIHsgTmFtZTogJ0Vudmlyb25tZW50JywgVmFsdWU6ICd0ZXN0JyB9LFxuICAgICAgICAgICAgICB7IE5hbWU6ICdTZXJ2aWNlJywgVmFsdWU6ICdUZXN0U2VydmljZScgfSxcbiAgICAgICAgICAgICAgeyBOYW1lOiAnRXJyb3JUeXBlJywgVmFsdWU6ICdWYWxpZGF0aW9uRXJyb3InIH0sXG4gICAgICAgICAgICAgIHsgTmFtZTogJ1NldmVyaXR5JywgVmFsdWU6ICdtZWRpdW0nIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgncmVjb3JkVXNhZ2UnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZWNvcmQgdXNhZ2UgbWV0cmljcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHVzYWdlOiBVc2FnZU1ldHJpYyA9IHtcbiAgICAgICAgdXNlcklkOiAndXNlcjEyMycsXG4gICAgICAgIG9yZ2FuaXphdGlvbklkOiAnb3JnNDU2JyxcbiAgICAgICAgYWN0aW9uOiAnZ2VuZXJhdGVfaWRlYScsXG4gICAgICAgIHJlc291cmNlOiAnaW52ZXN0bWVudF9pZGVhcycsXG4gICAgICAgIGR1cmF0aW9uOiAxNTAwLFxuICAgICAgICBzdWNjZXNzOiB0cnVlXG4gICAgICB9O1xuXG4gICAgICBhd2FpdCBtb25pdG9yaW5nU2VydmljZS5yZWNvcmRVc2FnZSh1c2FnZSk7XG5cbiAgICAgIGV4cGVjdChtb2NrQ2xvdWRXYXRjaC5wdXRNZXRyaWNEYXRhKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCh7XG4gICAgICAgIE5hbWVzcGFjZTogJ1Rlc3ROYW1lc3BhY2UnLFxuICAgICAgICBNZXRyaWNEYXRhOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgTWV0cmljTmFtZTogJ1VzYWdlQ291bnQnLFxuICAgICAgICAgICAgVmFsdWU6IDEsXG4gICAgICAgICAgICBVbml0OiAnQ291bnQnLFxuICAgICAgICAgICAgVGltZXN0YW1wOiBleHBlY3QuYW55KERhdGUpLFxuICAgICAgICAgICAgRGltZW5zaW9uczogW1xuICAgICAgICAgICAgICB7IE5hbWU6ICdFbnZpcm9ubWVudCcsIFZhbHVlOiAndGVzdCcgfSxcbiAgICAgICAgICAgICAgeyBOYW1lOiAnQWN0aW9uJywgVmFsdWU6ICdnZW5lcmF0ZV9pZGVhJyB9LFxuICAgICAgICAgICAgICB7IE5hbWU6ICdSZXNvdXJjZScsIFZhbHVlOiAnaW52ZXN0bWVudF9pZGVhcycgfSxcbiAgICAgICAgICAgICAgeyBOYW1lOiAnU3VjY2VzcycsIFZhbHVlOiAndHJ1ZScgfSxcbiAgICAgICAgICAgICAgeyBOYW1lOiAnT3JnYW5pemF0aW9uSWQnLCBWYWx1ZTogJ29yZzQ1NicgfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgTWV0cmljTmFtZTogJ1VzYWdlRHVyYXRpb24nLFxuICAgICAgICAgICAgVmFsdWU6IDE1MDAsXG4gICAgICAgICAgICBVbml0OiAnTWlsbGlzZWNvbmRzJyxcbiAgICAgICAgICAgIFRpbWVzdGFtcDogZXhwZWN0LmFueShEYXRlKSxcbiAgICAgICAgICAgIERpbWVuc2lvbnM6IFtcbiAgICAgICAgICAgICAgeyBOYW1lOiAnRW52aXJvbm1lbnQnLCBWYWx1ZTogJ3Rlc3QnIH0sXG4gICAgICAgICAgICAgIHsgTmFtZTogJ0FjdGlvbicsIFZhbHVlOiAnZ2VuZXJhdGVfaWRlYScgfSxcbiAgICAgICAgICAgICAgeyBOYW1lOiAnUmVzb3VyY2UnLCBWYWx1ZTogJ2ludmVzdG1lbnRfaWRlYXMnIH0sXG4gICAgICAgICAgICAgIHsgTmFtZTogJ1N1Y2Nlc3MnLCBWYWx1ZTogJ3RydWUnIH0sXG4gICAgICAgICAgICAgIHsgTmFtZTogJ09yZ2FuaXphdGlvbklkJywgVmFsdWU6ICdvcmc0NTYnIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIE1ldHJpY05hbWU6ICdTdWNjZXNzQ291bnQnLFxuICAgICAgICAgICAgVmFsdWU6IDEsXG4gICAgICAgICAgICBVbml0OiAnQ291bnQnLFxuICAgICAgICAgICAgVGltZXN0YW1wOiBleHBlY3QuYW55KERhdGUpLFxuICAgICAgICAgICAgRGltZW5zaW9uczogW1xuICAgICAgICAgICAgICB7IE5hbWU6ICdFbnZpcm9ubWVudCcsIFZhbHVlOiAndGVzdCcgfSxcbiAgICAgICAgICAgICAgeyBOYW1lOiAnQWN0aW9uJywgVmFsdWU6ICdnZW5lcmF0ZV9pZGVhJyB9LFxuICAgICAgICAgICAgICB7IE5hbWU6ICdSZXNvdXJjZScsIFZhbHVlOiAnaW52ZXN0bWVudF9pZGVhcycgfSxcbiAgICAgICAgICAgICAgeyBOYW1lOiAnU3VjY2VzcycsIFZhbHVlOiAndHJ1ZScgfSxcbiAgICAgICAgICAgICAgeyBOYW1lOiAnT3JnYW5pemF0aW9uSWQnLCBWYWx1ZTogJ29yZzQ1NicgfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdyZWNvcmRBcGlSZXF1ZXN0JywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcmVjb3JkIEFQSSByZXF1ZXN0IG1ldHJpY3MnLCBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBtb25pdG9yaW5nU2VydmljZS5yZWNvcmRBcGlSZXF1ZXN0KFxuICAgICAgICAnL2FwaS92MS9pZGVhcycsXG4gICAgICAgICdQT1NUJyxcbiAgICAgICAgMjAwLFxuICAgICAgICAxMjAwLFxuICAgICAgICAndXNlcjEyMycsXG4gICAgICAgICdvcmc0NTYnXG4gICAgICApO1xuXG4gICAgICBleHBlY3QobW9ja0Nsb3VkV2F0Y2gucHV0TWV0cmljRGF0YSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoe1xuICAgICAgICBOYW1lc3BhY2U6ICdUZXN0TmFtZXNwYWNlJyxcbiAgICAgICAgTWV0cmljRGF0YTogW1xuICAgICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICAgIE1ldHJpY05hbWU6ICdBcGlSZXF1ZXN0Q291bnQnLFxuICAgICAgICAgICAgVmFsdWU6IDEsXG4gICAgICAgICAgICBVbml0OiAnQ291bnQnXG4gICAgICAgICAgfSksXG4gICAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgICAgTWV0cmljTmFtZTogJ0FwaVJlcXVlc3REdXJhdGlvbicsXG4gICAgICAgICAgICBWYWx1ZTogMTIwMCxcbiAgICAgICAgICAgIFVuaXQ6ICdNaWxsaXNlY29uZHMnXG4gICAgICAgICAgfSksXG4gICAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgICAgTWV0cmljTmFtZTogJ0FwaVJlcXVlc3RTdWNjZXNzJyxcbiAgICAgICAgICAgIFZhbHVlOiAxLFxuICAgICAgICAgICAgVW5pdDogJ0NvdW50J1xuICAgICAgICAgIH0pXG4gICAgICAgIF1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZWNvcmQgZXJyb3IgbWV0cmljcyBmb3IgZmFpbGVkIHJlcXVlc3RzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgbW9uaXRvcmluZ1NlcnZpY2UucmVjb3JkQXBpUmVxdWVzdChcbiAgICAgICAgJy9hcGkvdjEvaWRlYXMnLFxuICAgICAgICAnUE9TVCcsXG4gICAgICAgIDUwMCxcbiAgICAgICAgMjAwMFxuICAgICAgKTtcblxuICAgICAgZXhwZWN0KG1vY2tDbG91ZFdhdGNoLnB1dE1ldHJpY0RhdGEpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHtcbiAgICAgICAgTmFtZXNwYWNlOiAnVGVzdE5hbWVzcGFjZScsXG4gICAgICAgIE1ldHJpY0RhdGE6IGV4cGVjdC5hcnJheUNvbnRhaW5pbmcoW1xuICAgICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICAgIE1ldHJpY05hbWU6ICdBcGlSZXF1ZXN0RXJyb3InLFxuICAgICAgICAgICAgVmFsdWU6IDEsXG4gICAgICAgICAgICBVbml0OiAnQ291bnQnXG4gICAgICAgICAgfSlcbiAgICAgICAgXSlcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgncmVjb3JkTW9kZWxVc2FnZScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHJlY29yZCBtb2RlbCB1c2FnZSBtZXRyaWNzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgbW9uaXRvcmluZ1NlcnZpY2UucmVjb3JkTW9kZWxVc2FnZShcbiAgICAgICAgJ0NsYXVkZS1Tb25uZXQtMy43JyxcbiAgICAgICAgJ3RleHQtZ2VuZXJhdGlvbicsXG4gICAgICAgIDMwMDAsXG4gICAgICAgIHRydWUsXG4gICAgICAgIDE1MDAsXG4gICAgICAgIDAuMDVcbiAgICAgICk7XG5cbiAgICAgIGV4cGVjdChtb2NrQ2xvdWRXYXRjaC5wdXRNZXRyaWNEYXRhKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCh7XG4gICAgICAgIE5hbWVzcGFjZTogJ1Rlc3ROYW1lc3BhY2UnLFxuICAgICAgICBNZXRyaWNEYXRhOiBbXG4gICAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgICAgTWV0cmljTmFtZTogJ01vZGVsVXNhZ2VDb3VudCcsXG4gICAgICAgICAgICBWYWx1ZTogMSxcbiAgICAgICAgICAgIFVuaXQ6ICdDb3VudCdcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgICBNZXRyaWNOYW1lOiAnTW9kZWxVc2FnZUR1cmF0aW9uJyxcbiAgICAgICAgICAgIFZhbHVlOiAzMDAwLFxuICAgICAgICAgICAgVW5pdDogJ01pbGxpc2Vjb25kcydcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgICBNZXRyaWNOYW1lOiAnTW9kZWxUb2tlbkNvdW50JyxcbiAgICAgICAgICAgIFZhbHVlOiAxNTAwLFxuICAgICAgICAgICAgVW5pdDogJ0NvdW50J1xuICAgICAgICAgIH0pLFxuICAgICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICAgIE1ldHJpY05hbWU6ICdNb2RlbFVzYWdlQ29zdCcsXG4gICAgICAgICAgICBWYWx1ZTogMC4wNSxcbiAgICAgICAgICAgIFVuaXQ6ICdDb3VudCdcbiAgICAgICAgICB9KVxuICAgICAgICBdXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3JlY29yZFN5c3RlbUhlYWx0aCcsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHJlY29yZCBzeXN0ZW0gaGVhbHRoIG1ldHJpY3MnLCBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBtb25pdG9yaW5nU2VydmljZS5yZWNvcmRTeXN0ZW1IZWFsdGgoXG4gICAgICAgICdBUEknLFxuICAgICAgICAnaGVhbHRoeScsXG4gICAgICAgIDE1MCxcbiAgICAgICAgMi41XG4gICAgICApO1xuXG4gICAgICBleHBlY3QobW9ja0Nsb3VkV2F0Y2gucHV0TWV0cmljRGF0YSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoe1xuICAgICAgICBOYW1lc3BhY2U6ICdUZXN0TmFtZXNwYWNlJyxcbiAgICAgICAgTWV0cmljRGF0YTogW1xuICAgICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICAgIE1ldHJpY05hbWU6ICdTeXN0ZW1IZWFsdGhDaGVjaycsXG4gICAgICAgICAgICBWYWx1ZTogMSxcbiAgICAgICAgICAgIFVuaXQ6ICdDb3VudCdcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgICBNZXRyaWNOYW1lOiAnU3lzdGVtUmVzcG9uc2VUaW1lJyxcbiAgICAgICAgICAgIFZhbHVlOiAxNTAsXG4gICAgICAgICAgICBVbml0OiAnTWlsbGlzZWNvbmRzJ1xuICAgICAgICAgIH0pLFxuICAgICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICAgIE1ldHJpY05hbWU6ICdTeXN0ZW1FcnJvclJhdGUnLFxuICAgICAgICAgICAgVmFsdWU6IDIuNSxcbiAgICAgICAgICAgIFVuaXQ6ICdQZXJjZW50J1xuICAgICAgICAgIH0pXG4gICAgICAgIF1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZWNvcmQgdW5oZWFsdGh5IHN0YXR1cyBjb3JyZWN0bHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBtb25pdG9yaW5nU2VydmljZS5yZWNvcmRTeXN0ZW1IZWFsdGgoJ0FQSScsICd1bmhlYWx0aHknKTtcblxuICAgICAgZXhwZWN0KG1vY2tDbG91ZFdhdGNoLnB1dE1ldHJpY0RhdGEpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHtcbiAgICAgICAgTmFtZXNwYWNlOiAnVGVzdE5hbWVzcGFjZScsXG4gICAgICAgIE1ldHJpY0RhdGE6IFtcbiAgICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgICBNZXRyaWNOYW1lOiAnU3lzdGVtSGVhbHRoQ2hlY2snLFxuICAgICAgICAgICAgVmFsdWU6IDAsXG4gICAgICAgICAgICBVbml0OiAnQ291bnQnXG4gICAgICAgICAgfSlcbiAgICAgICAgXVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufSk7Il19