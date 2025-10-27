"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const alerting_service_1 = require("../monitoring/alerting-service");
const aws_sdk_1 = require("aws-sdk");
// Mock AWS SDK
jest.mock('aws-sdk');
describe('AlertingService', () => {
    let alertingService;
    let mockCloudWatch;
    let mockSNS;
    beforeEach(() => {
        mockCloudWatch = {
            putMetricAlarm: jest.fn().mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            }),
            deleteAlarms: jest.fn().mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            }),
            describeAlarms: jest.fn().mockReturnValue({
                promise: jest.fn().mockResolvedValue({ MetricAlarms: [] })
            }),
            setAlarmState: jest.fn().mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            })
        };
        mockSNS = {
            publish: jest.fn().mockReturnValue({
                promise: jest.fn().mockResolvedValue({ MessageId: 'test-message-id' })
            })
        };
        aws_sdk_1.CloudWatch.mockImplementation(() => mockCloudWatch);
        aws_sdk_1.SNS.mockImplementation(() => mockSNS);
        alertingService = new alerting_service_1.AlertingService('us-east-1', 'TestNamespace', 'test', 'arn:aws:sns:us-east-1:123456789012:test-topic');
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('createAlarm', () => {
        it('should create a CloudWatch alarm successfully', async () => {
            const rule = {
                name: 'TestAlarm',
                description: 'Test alarm description',
                metricName: 'TestMetric',
                namespace: 'TestNamespace',
                threshold: 100,
                comparisonOperator: 'GreaterThanThreshold',
                evaluationPeriods: 2,
                period: 300,
                statistic: 'Average',
                unit: 'Count',
                dimensions: { Service: 'TestService' },
                severity: 'high'
            };
            await alertingService.createAlarm(rule, 'arn:aws:sns:us-east-1:123456789012:test-topic');
            expect(mockCloudWatch.putMetricAlarm).toHaveBeenCalledWith({
                AlarmName: 'test-TestAlarm',
                AlarmDescription: 'Test alarm description',
                MetricName: 'TestMetric',
                Namespace: 'TestNamespace',
                Statistic: 'Average',
                Period: 300,
                EvaluationPeriods: 2,
                Threshold: 100,
                ComparisonOperator: 'GreaterThanThreshold',
                Dimensions: [{ Name: 'Service', Value: 'TestService' }],
                Unit: 'Count',
                TreatMissingData: 'notBreaching',
                AlarmActions: ['arn:aws:sns:us-east-1:123456789012:test-topic'],
                OKActions: ['arn:aws:sns:us-east-1:123456789012:test-topic'],
                Tags: [
                    { Key: 'Environment', Value: 'test' },
                    { Key: 'Service', Value: 'InvestmentAI' },
                    { Key: 'Severity', Value: 'high' }
                ]
            });
        });
        it('should handle errors when creating alarms', async () => {
            const rule = {
                name: 'TestAlarm',
                description: 'Test alarm description',
                metricName: 'TestMetric',
                namespace: 'TestNamespace',
                threshold: 100,
                comparisonOperator: 'GreaterThanThreshold',
                evaluationPeriods: 2,
                period: 300,
                statistic: 'Average',
                severity: 'high'
            };
            mockCloudWatch.putMetricAlarm.mockReturnValue({
                promise: jest.fn().mockRejectedValue(new Error('CloudWatch error'))
            });
            await expect(alertingService.createAlarm(rule)).rejects.toThrow('CloudWatch error');
        });
    });
    describe('createStandardAlarms', () => {
        it('should create all standard alarms', async () => {
            await alertingService.createStandardAlarms('arn:aws:sns:us-east-1:123456789012:test-topic');
            // Should create multiple standard alarms
            expect(mockCloudWatch.putMetricAlarm).toHaveBeenCalledTimes(6);
            // Check that specific alarms are created
            expect(mockCloudWatch.putMetricAlarm).toHaveBeenCalledWith(expect.objectContaining({
                AlarmName: 'test-HighApiErrorRate'
            }));
            expect(mockCloudWatch.putMetricAlarm).toHaveBeenCalledWith(expect.objectContaining({
                AlarmName: 'test-CriticalErrors'
            }));
        });
    });
    describe('sendAlert', () => {
        it('should send alert notification via SNS', async () => {
            const context = {
                service: 'TestService',
                environment: 'test',
                timestamp: new Date('2023-01-01T00:00:00Z'),
                severity: 'high',
                message: 'Test alert message',
                metadata: { key: 'value' }
            };
            await alertingService.sendAlert(context);
            expect(mockSNS.publish).toHaveBeenCalledWith({
                TopicArn: 'arn:aws:sns:us-east-1:123456789012:test-topic',
                Subject: '[HIGH] Investment AI Alert - TestService',
                Message: JSON.stringify({
                    service: 'TestService',
                    environment: 'test',
                    severity: 'high',
                    timestamp: '2023-01-01T00:00:00.000Z',
                    message: 'Test alert message',
                    metadata: { key: 'value' }
                }, null, 2),
                MessageAttributes: {
                    severity: {
                        DataType: 'String',
                        StringValue: 'high'
                    },
                    service: {
                        DataType: 'String',
                        StringValue: 'TestService'
                    },
                    environment: {
                        DataType: 'String',
                        StringValue: 'test'
                    }
                }
            });
        });
        it('should handle SNS errors gracefully', async () => {
            const context = {
                service: 'TestService',
                environment: 'test',
                timestamp: new Date(),
                severity: 'high',
                message: 'Test alert message'
            };
            mockSNS.publish.mockReturnValue({
                promise: jest.fn().mockRejectedValue(new Error('SNS error'))
            });
            // Should not throw error
            await expect(alertingService.sendAlert(context)).resolves.toBeUndefined();
        });
    });
    describe('sendCriticalAlert', () => {
        it('should send critical alert with correct severity', async () => {
            await alertingService.sendCriticalAlert('TestService', 'Critical error occurred');
            expect(mockSNS.publish).toHaveBeenCalledWith(expect.objectContaining({
                Subject: '[CRITICAL] Investment AI Alert - TestService',
                MessageAttributes: expect.objectContaining({
                    severity: {
                        DataType: 'String',
                        StringValue: 'critical'
                    }
                })
            }));
        });
    });
    describe('sendHighAlert', () => {
        it('should send high priority alert', async () => {
            await alertingService.sendHighAlert('TestService', 'High priority issue');
            expect(mockSNS.publish).toHaveBeenCalledWith(expect.objectContaining({
                Subject: '[HIGH] Investment AI Alert - TestService',
                MessageAttributes: expect.objectContaining({
                    severity: {
                        DataType: 'String',
                        StringValue: 'high'
                    }
                })
            }));
        });
    });
    describe('sendMediumAlert', () => {
        it('should send medium priority alert', async () => {
            await alertingService.sendMediumAlert('TestService', 'Medium priority issue');
            expect(mockSNS.publish).toHaveBeenCalledWith(expect.objectContaining({
                Subject: '[MEDIUM] Investment AI Alert - TestService',
                MessageAttributes: expect.objectContaining({
                    severity: {
                        DataType: 'String',
                        StringValue: 'medium'
                    }
                })
            }));
        });
    });
    describe('deleteAlarm', () => {
        it('should delete alarm successfully', async () => {
            await alertingService.deleteAlarm('TestAlarm');
            expect(mockCloudWatch.deleteAlarms).toHaveBeenCalledWith({
                AlarmNames: ['test-TestAlarm']
            });
        });
        it('should handle delete errors', async () => {
            mockCloudWatch.deleteAlarms.mockReturnValue({
                promise: jest.fn().mockRejectedValue(new Error('Delete error'))
            });
            await expect(alertingService.deleteAlarm('TestAlarm')).rejects.toThrow('Delete error');
        });
    });
    describe('listAlarms', () => {
        it('should list alarms for environment', async () => {
            const mockAlarms = [
                { AlarmName: 'test-Alarm1' },
                { AlarmName: 'test-Alarm2' }
            ];
            mockCloudWatch.describeAlarms.mockReturnValue({
                promise: jest.fn().mockResolvedValue({ MetricAlarms: mockAlarms })
            });
            const result = await alertingService.listAlarms();
            expect(mockCloudWatch.describeAlarms).toHaveBeenCalledWith({
                AlarmNamePrefix: 'test-'
            });
            expect(result).toEqual(mockAlarms);
        });
    });
    describe('setAlarmState', () => {
        it('should set alarm state successfully', async () => {
            await alertingService.setAlarmState('TestAlarm', 'ALARM', 'Test reason');
            expect(mockCloudWatch.setAlarmState).toHaveBeenCalledWith({
                AlarmName: 'test-TestAlarm',
                StateValue: 'ALARM',
                StateReason: 'Test reason'
            });
        });
        it('should handle set alarm state errors', async () => {
            mockCloudWatch.setAlarmState.mockReturnValue({
                promise: jest.fn().mockRejectedValue(new Error('Set state error'))
            });
            await expect(alertingService.setAlarmState('TestAlarm', 'ALARM', 'Test reason')).rejects.toThrow('Set state error');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxlcnRpbmctc2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3NlcnZpY2VzL19fdGVzdHNfXy9hbGVydGluZy1zZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxxRUFBMEY7QUFDMUYscUNBQTBDO0FBRTFDLGVBQWU7QUFDZixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBRXJCLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7SUFDL0IsSUFBSSxlQUFnQyxDQUFDO0lBQ3JDLElBQUksY0FBdUMsQ0FBQztJQUM1QyxJQUFJLE9BQXlCLENBQUM7SUFFOUIsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUNkLGNBQWMsR0FBRztZQUNmLGNBQWMsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsZUFBZSxDQUFDO2dCQUN4QyxPQUFPLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQzthQUN6QyxDQUFDO1lBQ0YsWUFBWSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxlQUFlLENBQUM7Z0JBQ3RDLE9BQU8sRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDO2FBQ3pDLENBQUM7WUFDRixjQUFjLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLGVBQWUsQ0FBQztnQkFDeEMsT0FBTyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLFlBQVksRUFBRSxFQUFFLEVBQUUsQ0FBQzthQUMzRCxDQUFDO1lBQ0YsYUFBYSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxlQUFlLENBQUM7Z0JBQ3ZDLE9BQU8sRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDO2FBQ3pDLENBQUM7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LE9BQU87YUFDekIsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNyQyxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7UUFDN0IsRUFBRSxDQUFDLHFDQUFxQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ25ELE1BQU0sZUFBZSxDQUFDLGFBQWEsQ0FBQyxXQUFXLEVBQUUsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRXpFLE1BQU0sQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDLENBQUMsb0JBQW9CLENBQUM7Z0JBQ3hELFNBQVMsRUFBRSxnQkFBZ0I7Z0JBQzNCLFVBQVUsRUFBRSxPQUFPO2dCQUNuQixXQUFXLEVBQUUsYUFBYTthQUMzQixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxzQ0FBc0MsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNwRCxjQUFjLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQztnQkFDM0MsT0FBTyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2FBQzVELENBQUMsQ0FBQztZQUVWLE1BQU0sTUFBTSxDQUNWLGVBQWUsQ0FBQyxhQUFhLENBQUMsV0FBVyxFQUFFLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FDbkUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWxlcnRpbmdTZXJ2aWNlLCBBbGVydFJ1bGUsIEFsZXJ0Q29udGV4dCB9IGZyb20gJy4uL21vbml0b3JpbmcvYWxlcnRpbmctc2VydmljZSc7XG5pbXBvcnQgeyBDbG91ZFdhdGNoLCBTTlMgfSBmcm9tICdhd3Mtc2RrJztcblxuLy8gTW9jayBBV1MgU0RLXG5qZXN0Lm1vY2soJ2F3cy1zZGsnKTtcblxuZGVzY3JpYmUoJ0FsZXJ0aW5nU2VydmljZScsICgpID0+IHtcbiAgbGV0IGFsZXJ0aW5nU2VydmljZTogQWxlcnRpbmdTZXJ2aWNlO1xuICBsZXQgbW9ja0Nsb3VkV2F0Y2g6IGplc3QuTW9ja2VkPENsb3VkV2F0Y2g+O1xuICBsZXQgbW9ja1NOUzogamVzdC5Nb2NrZWQ8U05TPjtcblxuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICBtb2NrQ2xvdWRXYXRjaCA9IHtcbiAgICAgIHB1dE1ldHJpY0FsYXJtOiBqZXN0LmZuKCkubW9ja1JldHVyblZhbHVlKHtcbiAgICAgICAgcHJvbWlzZTogamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKHt9KVxuICAgICAgfSksXG4gICAgICBkZWxldGVBbGFybXM6IGplc3QuZm4oKS5tb2NrUmV0dXJuVmFsdWUoe1xuICAgICAgICBwcm9taXNlOiBqZXN0LmZuKCkubW9ja1Jlc29sdmVkVmFsdWUoe30pXG4gICAgICB9KSxcbiAgICAgIGRlc2NyaWJlQWxhcm1zOiBqZXN0LmZuKCkubW9ja1JldHVyblZhbHVlKHtcbiAgICAgICAgcHJvbWlzZTogamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKHsgTWV0cmljQWxhcm1zOiBbXSB9KVxuICAgICAgfSksXG4gICAgICBzZXRBbGFybVN0YXRlOiBqZXN0LmZuKCkubW9ja1JldHVyblZhbHVlKHtcbiAgICAgICAgcHJvbWlzZTogamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKHt9KVxuICAgICAgfSlcbiAgICB9IGFzIGFueTtcblxuICAgIG1vY2tTTlMgPSB7XG4gICAgICBwdWJsaXNoOiBqZXN0LmZuKCkubW9ja1JldHVyblZhbHVlKHtcbiAgICAgICAgcHJvbWlzZTogamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKHsgTWVzc2FnZUlkOiAndGVzdC1tZXNzYWdlLWlkJyB9KVxuICAgICAgfSlcbiAgICB9IGFzIGFueTtcblxuICAgIChDbG91ZFdhdGNoIGFzIGplc3QuTW9ja2VkQ2xhc3M8dHlwZW9mIENsb3VkV2F0Y2g+KS5tb2NrSW1wbGVtZW50YXRpb24oKCkgPT4gbW9ja0Nsb3VkV2F0Y2gpO1xuICAgIChTTlMgYXMgamVzdC5Nb2NrZWRDbGFzczx0eXBlb2YgU05TPikubW9ja0ltcGxlbWVudGF0aW9uKCgpID0+IG1vY2tTTlMpO1xuICAgIFxuICAgIGFsZXJ0aW5nU2VydmljZSA9IG5ldyBBbGVydGluZ1NlcnZpY2UoXG4gICAgICAndXMtZWFzdC0xJyxcbiAgICAgICdUZXN0TmFtZXNwYWNlJyxcbiAgICAgICd0ZXN0JyxcbiAgICAgICdhcm46YXdzOnNuczp1cy1lYXN0LTE6MTIzNDU2Nzg5MDEyOnRlc3QtdG9waWMnXG4gICAgKTtcbiAgfSk7XG5cbiAgYWZ0ZXJFYWNoKCgpID0+IHtcbiAgICBqZXN0LmNsZWFyQWxsTW9ja3MoKTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2NyZWF0ZUFsYXJtJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgY3JlYXRlIGEgQ2xvdWRXYXRjaCBhbGFybSBzdWNjZXNzZnVsbHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBydWxlOiBBbGVydFJ1bGUgPSB7XG4gICAgICAgIG5hbWU6ICdUZXN0QWxhcm0nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1Rlc3QgYWxhcm0gZGVzY3JpcHRpb24nLFxuICAgICAgICBtZXRyaWNOYW1lOiAnVGVzdE1ldHJpYycsXG4gICAgICAgIG5hbWVzcGFjZTogJ1Rlc3ROYW1lc3BhY2UnLFxuICAgICAgICB0aHJlc2hvbGQ6IDEwMCxcbiAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiAnR3JlYXRlclRoYW5UaHJlc2hvbGQnLFxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMixcbiAgICAgICAgcGVyaW9kOiAzMDAsXG4gICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnLFxuICAgICAgICB1bml0OiAnQ291bnQnLFxuICAgICAgICBkaW1lbnNpb25zOiB7IFNlcnZpY2U6ICdUZXN0U2VydmljZScgfSxcbiAgICAgICAgc2V2ZXJpdHk6ICdoaWdoJ1xuICAgICAgfTtcblxuICAgICAgYXdhaXQgYWxlcnRpbmdTZXJ2aWNlLmNyZWF0ZUFsYXJtKHJ1bGUsICdhcm46YXdzOnNuczp1cy1lYXN0LTE6MTIzNDU2Nzg5MDEyOnRlc3QtdG9waWMnKTtcblxuICAgICAgZXhwZWN0KG1vY2tDbG91ZFdhdGNoLnB1dE1ldHJpY0FsYXJtKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCh7XG4gICAgICAgIEFsYXJtTmFtZTogJ3Rlc3QtVGVzdEFsYXJtJyxcbiAgICAgICAgQWxhcm1EZXNjcmlwdGlvbjogJ1Rlc3QgYWxhcm0gZGVzY3JpcHRpb24nLFxuICAgICAgICBNZXRyaWNOYW1lOiAnVGVzdE1ldHJpYycsXG4gICAgICAgIE5hbWVzcGFjZTogJ1Rlc3ROYW1lc3BhY2UnLFxuICAgICAgICBTdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgUGVyaW9kOiAzMDAsXG4gICAgICAgIEV2YWx1YXRpb25QZXJpb2RzOiAyLFxuICAgICAgICBUaHJlc2hvbGQ6IDEwMCxcbiAgICAgICAgQ29tcGFyaXNvbk9wZXJhdG9yOiAnR3JlYXRlclRoYW5UaHJlc2hvbGQnLFxuICAgICAgICBEaW1lbnNpb25zOiBbeyBOYW1lOiAnU2VydmljZScsIFZhbHVlOiAnVGVzdFNlcnZpY2UnIH1dLFxuICAgICAgICBVbml0OiAnQ291bnQnLFxuICAgICAgICBUcmVhdE1pc3NpbmdEYXRhOiAnbm90QnJlYWNoaW5nJyxcbiAgICAgICAgQWxhcm1BY3Rpb25zOiBbJ2Fybjphd3M6c25zOnVzLWVhc3QtMToxMjM0NTY3ODkwMTI6dGVzdC10b3BpYyddLFxuICAgICAgICBPS0FjdGlvbnM6IFsnYXJuOmF3czpzbnM6dXMtZWFzdC0xOjEyMzQ1Njc4OTAxMjp0ZXN0LXRvcGljJ10sXG4gICAgICAgIFRhZ3M6IFtcbiAgICAgICAgICB7IEtleTogJ0Vudmlyb25tZW50JywgVmFsdWU6ICd0ZXN0JyB9LFxuICAgICAgICAgIHsgS2V5OiAnU2VydmljZScsIFZhbHVlOiAnSW52ZXN0bWVudEFJJyB9LFxuICAgICAgICAgIHsgS2V5OiAnU2V2ZXJpdHknLCBWYWx1ZTogJ2hpZ2gnIH1cbiAgICAgICAgXVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBlcnJvcnMgd2hlbiBjcmVhdGluZyBhbGFybXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBydWxlOiBBbGVydFJ1bGUgPSB7XG4gICAgICAgIG5hbWU6ICdUZXN0QWxhcm0nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1Rlc3QgYWxhcm0gZGVzY3JpcHRpb24nLFxuICAgICAgICBtZXRyaWNOYW1lOiAnVGVzdE1ldHJpYycsXG4gICAgICAgIG5hbWVzcGFjZTogJ1Rlc3ROYW1lc3BhY2UnLFxuICAgICAgICB0aHJlc2hvbGQ6IDEwMCxcbiAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiAnR3JlYXRlclRoYW5UaHJlc2hvbGQnLFxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMixcbiAgICAgICAgcGVyaW9kOiAzMDAsXG4gICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnLFxuICAgICAgICBzZXZlcml0eTogJ2hpZ2gnXG4gICAgICB9O1xuXG4gICAgICBtb2NrQ2xvdWRXYXRjaC5wdXRNZXRyaWNBbGFybS5tb2NrUmV0dXJuVmFsdWUoe1xuICAgICAgICBwcm9taXNlOiBqZXN0LmZuKCkubW9ja1JlamVjdGVkVmFsdWUobmV3IEVycm9yKCdDbG91ZFdhdGNoIGVycm9yJykpXG4gICAgICB9IGFzIGFueSk7XG5cbiAgICAgIGF3YWl0IGV4cGVjdChhbGVydGluZ1NlcnZpY2UuY3JlYXRlQWxhcm0ocnVsZSkpLnJlamVjdHMudG9UaHJvdygnQ2xvdWRXYXRjaCBlcnJvcicpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnY3JlYXRlU3RhbmRhcmRBbGFybXMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjcmVhdGUgYWxsIHN0YW5kYXJkIGFsYXJtcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IGFsZXJ0aW5nU2VydmljZS5jcmVhdGVTdGFuZGFyZEFsYXJtcygnYXJuOmF3czpzbnM6dXMtZWFzdC0xOjEyMzQ1Njc4OTAxMjp0ZXN0LXRvcGljJyk7XG5cbiAgICAgIC8vIFNob3VsZCBjcmVhdGUgbXVsdGlwbGUgc3RhbmRhcmQgYWxhcm1zXG4gICAgICBleHBlY3QobW9ja0Nsb3VkV2F0Y2gucHV0TWV0cmljQWxhcm0pLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcyg2KTtcbiAgICAgIFxuICAgICAgLy8gQ2hlY2sgdGhhdCBzcGVjaWZpYyBhbGFybXMgYXJlIGNyZWF0ZWRcbiAgICAgIGV4cGVjdChtb2NrQ2xvdWRXYXRjaC5wdXRNZXRyaWNBbGFybSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXG4gICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICBBbGFybU5hbWU6ICd0ZXN0LUhpZ2hBcGlFcnJvclJhdGUnXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgICAgXG4gICAgICBleHBlY3QobW9ja0Nsb3VkV2F0Y2gucHV0TWV0cmljQWxhcm0pLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgQWxhcm1OYW1lOiAndGVzdC1Dcml0aWNhbEVycm9ycydcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdzZW5kQWxlcnQnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBzZW5kIGFsZXJ0IG5vdGlmaWNhdGlvbiB2aWEgU05TJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgY29udGV4dDogQWxlcnRDb250ZXh0ID0ge1xuICAgICAgICBzZXJ2aWNlOiAnVGVzdFNlcnZpY2UnLFxuICAgICAgICBlbnZpcm9ubWVudDogJ3Rlc3QnLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCcyMDIzLTAxLTAxVDAwOjAwOjAwWicpLFxuICAgICAgICBzZXZlcml0eTogJ2hpZ2gnLFxuICAgICAgICBtZXNzYWdlOiAnVGVzdCBhbGVydCBtZXNzYWdlJyxcbiAgICAgICAgbWV0YWRhdGE6IHsga2V5OiAndmFsdWUnIH1cbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IGFsZXJ0aW5nU2VydmljZS5zZW5kQWxlcnQoY29udGV4dCk7XG5cbiAgICAgIGV4cGVjdChtb2NrU05TLnB1Ymxpc2gpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHtcbiAgICAgICAgVG9waWNBcm46ICdhcm46YXdzOnNuczp1cy1lYXN0LTE6MTIzNDU2Nzg5MDEyOnRlc3QtdG9waWMnLFxuICAgICAgICBTdWJqZWN0OiAnW0hJR0hdIEludmVzdG1lbnQgQUkgQWxlcnQgLSBUZXN0U2VydmljZScsXG4gICAgICAgIE1lc3NhZ2U6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBzZXJ2aWNlOiAnVGVzdFNlcnZpY2UnLFxuICAgICAgICAgIGVudmlyb25tZW50OiAndGVzdCcsXG4gICAgICAgICAgc2V2ZXJpdHk6ICdoaWdoJyxcbiAgICAgICAgICB0aW1lc3RhbXA6ICcyMDIzLTAxLTAxVDAwOjAwOjAwLjAwMFonLFxuICAgICAgICAgIG1lc3NhZ2U6ICdUZXN0IGFsZXJ0IG1lc3NhZ2UnLFxuICAgICAgICAgIG1ldGFkYXRhOiB7IGtleTogJ3ZhbHVlJyB9XG4gICAgICAgIH0sIG51bGwsIDIpLFxuICAgICAgICBNZXNzYWdlQXR0cmlidXRlczoge1xuICAgICAgICAgIHNldmVyaXR5OiB7XG4gICAgICAgICAgICBEYXRhVHlwZTogJ1N0cmluZycsXG4gICAgICAgICAgICBTdHJpbmdWYWx1ZTogJ2hpZ2gnXG4gICAgICAgICAgfSxcbiAgICAgICAgICBzZXJ2aWNlOiB7XG4gICAgICAgICAgICBEYXRhVHlwZTogJ1N0cmluZycsXG4gICAgICAgICAgICBTdHJpbmdWYWx1ZTogJ1Rlc3RTZXJ2aWNlJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICAgIERhdGFUeXBlOiAnU3RyaW5nJyxcbiAgICAgICAgICAgIFN0cmluZ1ZhbHVlOiAndGVzdCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgU05TIGVycm9ycyBncmFjZWZ1bGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgY29udGV4dDogQWxlcnRDb250ZXh0ID0ge1xuICAgICAgICBzZXJ2aWNlOiAnVGVzdFNlcnZpY2UnLFxuICAgICAgICBlbnZpcm9ubWVudDogJ3Rlc3QnLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIHNldmVyaXR5OiAnaGlnaCcsXG4gICAgICAgIG1lc3NhZ2U6ICdUZXN0IGFsZXJ0IG1lc3NhZ2UnXG4gICAgICB9O1xuXG4gICAgICBtb2NrU05TLnB1Ymxpc2gubW9ja1JldHVyblZhbHVlKHtcbiAgICAgICAgcHJvbWlzZTogamVzdC5mbigpLm1vY2tSZWplY3RlZFZhbHVlKG5ldyBFcnJvcignU05TIGVycm9yJykpXG4gICAgICB9IGFzIGFueSk7XG5cbiAgICAgIC8vIFNob3VsZCBub3QgdGhyb3cgZXJyb3JcbiAgICAgIGF3YWl0IGV4cGVjdChhbGVydGluZ1NlcnZpY2Uuc2VuZEFsZXJ0KGNvbnRleHQpKS5yZXNvbHZlcy50b0JlVW5kZWZpbmVkKCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdzZW5kQ3JpdGljYWxBbGVydCcsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHNlbmQgY3JpdGljYWwgYWxlcnQgd2l0aCBjb3JyZWN0IHNldmVyaXR5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgYWxlcnRpbmdTZXJ2aWNlLnNlbmRDcml0aWNhbEFsZXJ0KCdUZXN0U2VydmljZScsICdDcml0aWNhbCBlcnJvciBvY2N1cnJlZCcpO1xuXG4gICAgICBleHBlY3QobW9ja1NOUy5wdWJsaXNoKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIFN1YmplY3Q6ICdbQ1JJVElDQUxdIEludmVzdG1lbnQgQUkgQWxlcnQgLSBUZXN0U2VydmljZScsXG4gICAgICAgICAgTWVzc2FnZUF0dHJpYnV0ZXM6IGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICAgIHNldmVyaXR5OiB7XG4gICAgICAgICAgICAgIERhdGFUeXBlOiAnU3RyaW5nJyxcbiAgICAgICAgICAgICAgU3RyaW5nVmFsdWU6ICdjcml0aWNhbCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3NlbmRIaWdoQWxlcnQnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBzZW5kIGhpZ2ggcHJpb3JpdHkgYWxlcnQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBhbGVydGluZ1NlcnZpY2Uuc2VuZEhpZ2hBbGVydCgnVGVzdFNlcnZpY2UnLCAnSGlnaCBwcmlvcml0eSBpc3N1ZScpO1xuXG4gICAgICBleHBlY3QobW9ja1NOUy5wdWJsaXNoKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIFN1YmplY3Q6ICdbSElHSF0gSW52ZXN0bWVudCBBSSBBbGVydCAtIFRlc3RTZXJ2aWNlJyxcbiAgICAgICAgICBNZXNzYWdlQXR0cmlidXRlczogZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgICAgc2V2ZXJpdHk6IHtcbiAgICAgICAgICAgICAgRGF0YVR5cGU6ICdTdHJpbmcnLFxuICAgICAgICAgICAgICBTdHJpbmdWYWx1ZTogJ2hpZ2gnXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdzZW5kTWVkaXVtQWxlcnQnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBzZW5kIG1lZGl1bSBwcmlvcml0eSBhbGVydCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IGFsZXJ0aW5nU2VydmljZS5zZW5kTWVkaXVtQWxlcnQoJ1Rlc3RTZXJ2aWNlJywgJ01lZGl1bSBwcmlvcml0eSBpc3N1ZScpO1xuXG4gICAgICBleHBlY3QobW9ja1NOUy5wdWJsaXNoKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIFN1YmplY3Q6ICdbTUVESVVNXSBJbnZlc3RtZW50IEFJIEFsZXJ0IC0gVGVzdFNlcnZpY2UnLFxuICAgICAgICAgIE1lc3NhZ2VBdHRyaWJ1dGVzOiBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgICBzZXZlcml0eToge1xuICAgICAgICAgICAgICBEYXRhVHlwZTogJ1N0cmluZycsXG4gICAgICAgICAgICAgIFN0cmluZ1ZhbHVlOiAnbWVkaXVtJ1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZGVsZXRlQWxhcm0nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBkZWxldGUgYWxhcm0gc3VjY2Vzc2Z1bGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgYWxlcnRpbmdTZXJ2aWNlLmRlbGV0ZUFsYXJtKCdUZXN0QWxhcm0nKTtcblxuICAgICAgZXhwZWN0KG1vY2tDbG91ZFdhdGNoLmRlbGV0ZUFsYXJtcykudG9IYXZlQmVlbkNhbGxlZFdpdGgoe1xuICAgICAgICBBbGFybU5hbWVzOiBbJ3Rlc3QtVGVzdEFsYXJtJ11cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgZGVsZXRlIGVycm9ycycsIGFzeW5jICgpID0+IHtcbiAgICAgIG1vY2tDbG91ZFdhdGNoLmRlbGV0ZUFsYXJtcy5tb2NrUmV0dXJuVmFsdWUoe1xuICAgICAgICBwcm9taXNlOiBqZXN0LmZuKCkubW9ja1JlamVjdGVkVmFsdWUobmV3IEVycm9yKCdEZWxldGUgZXJyb3InKSlcbiAgICAgIH0gYXMgYW55KTtcblxuICAgICAgYXdhaXQgZXhwZWN0KGFsZXJ0aW5nU2VydmljZS5kZWxldGVBbGFybSgnVGVzdEFsYXJtJykpLnJlamVjdHMudG9UaHJvdygnRGVsZXRlIGVycm9yJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdsaXN0QWxhcm1zJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgbGlzdCBhbGFybXMgZm9yIGVudmlyb25tZW50JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbW9ja0FsYXJtcyA9IFtcbiAgICAgICAgeyBBbGFybU5hbWU6ICd0ZXN0LUFsYXJtMScgfSxcbiAgICAgICAgeyBBbGFybU5hbWU6ICd0ZXN0LUFsYXJtMicgfVxuICAgICAgXTtcblxuICAgICAgbW9ja0Nsb3VkV2F0Y2guZGVzY3JpYmVBbGFybXMubW9ja1JldHVyblZhbHVlKHtcbiAgICAgICAgcHJvbWlzZTogamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKHsgTWV0cmljQWxhcm1zOiBtb2NrQWxhcm1zIH0pXG4gICAgICB9IGFzIGFueSk7XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGFsZXJ0aW5nU2VydmljZS5saXN0QWxhcm1zKCk7XG5cbiAgICAgIGV4cGVjdChtb2NrQ2xvdWRXYXRjaC5kZXNjcmliZUFsYXJtcykudG9IYXZlQmVlbkNhbGxlZFdpdGgoe1xuICAgICAgICBBbGFybU5hbWVQcmVmaXg6ICd0ZXN0LSdcbiAgICAgIH0pO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG9FcXVhbChtb2NrQWxhcm1zKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3NldEFsYXJtU3RhdGUnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBzZXQgYWxhcm0gc3RhdGUgc3VjY2Vzc2Z1bGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgYWxlcnRpbmdTZXJ2aWNlLnNldEFsYXJtU3RhdGUoJ1Rlc3RBbGFybScsICdBTEFSTScsICdUZXN0IHJlYXNvbicpO1xuXG4gICAgICBleHBlY3QobW9ja0Nsb3VkV2F0Y2guc2V0QWxhcm1TdGF0ZSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoe1xuICAgICAgICBBbGFybU5hbWU6ICd0ZXN0LVRlc3RBbGFybScsXG4gICAgICAgIFN0YXRlVmFsdWU6ICdBTEFSTScsXG4gICAgICAgIFN0YXRlUmVhc29uOiAnVGVzdCByZWFzb24nXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIHNldCBhbGFybSBzdGF0ZSBlcnJvcnMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBtb2NrQ2xvdWRXYXRjaC5zZXRBbGFybVN0YXRlLm1vY2tSZXR1cm5WYWx1ZSh7XG4gICAgICAgIHByb21pc2U6IGplc3QuZm4oKS5tb2NrUmVqZWN0ZWRWYWx1ZShuZXcgRXJyb3IoJ1NldCBzdGF0ZSBlcnJvcicpKVxuICAgICAgfSBhcyBhbnkpO1xuXG4gICAgICBhd2FpdCBleHBlY3QoXG4gICAgICAgIGFsZXJ0aW5nU2VydmljZS5zZXRBbGFybVN0YXRlKCdUZXN0QWxhcm0nLCAnQUxBUk0nLCAnVGVzdCByZWFzb24nKVxuICAgICAgKS5yZWplY3RzLnRvVGhyb3coJ1NldCBzdGF0ZSBlcnJvcicpO1xuICAgIH0pO1xuICB9KTtcbn0pOyJdfQ==