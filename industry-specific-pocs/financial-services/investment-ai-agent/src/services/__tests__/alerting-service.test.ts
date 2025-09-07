import { AlertingService, AlertRule, AlertContext } from '../monitoring/alerting-service';
import { CloudWatch, SNS } from 'aws-sdk';

// Mock AWS SDK
jest.mock('aws-sdk');

describe('AlertingService', () => {
  let alertingService: AlertingService;
  let mockCloudWatch: jest.Mocked<CloudWatch>;
  let mockSNS: jest.Mocked<SNS>;

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
    } as any;

    mockSNS = {
      publish: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({ MessageId: 'test-message-id' })
      })
    } as any;

    (CloudWatch as jest.MockedClass<typeof CloudWatch>).mockImplementation(() => mockCloudWatch);
    (SNS as jest.MockedClass<typeof SNS>).mockImplementation(() => mockSNS);
    
    alertingService = new AlertingService(
      'us-east-1',
      'TestNamespace',
      'test',
      'arn:aws:sns:us-east-1:123456789012:test-topic'
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAlarm', () => {
    it('should create a CloudWatch alarm successfully', async () => {
      const rule: AlertRule = {
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
      const rule: AlertRule = {
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
      } as any);

      await expect(alertingService.createAlarm(rule)).rejects.toThrow('CloudWatch error');
    });
  });

  describe('createStandardAlarms', () => {
    it('should create all standard alarms', async () => {
      await alertingService.createStandardAlarms('arn:aws:sns:us-east-1:123456789012:test-topic');

      // Should create multiple standard alarms
      expect(mockCloudWatch.putMetricAlarm).toHaveBeenCalledTimes(6);
      
      // Check that specific alarms are created
      expect(mockCloudWatch.putMetricAlarm).toHaveBeenCalledWith(
        expect.objectContaining({
          AlarmName: 'test-HighApiErrorRate'
        })
      );
      
      expect(mockCloudWatch.putMetricAlarm).toHaveBeenCalledWith(
        expect.objectContaining({
          AlarmName: 'test-CriticalErrors'
        })
      );
    });
  });

  describe('sendAlert', () => {
    it('should send alert notification via SNS', async () => {
      const context: AlertContext = {
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
      const context: AlertContext = {
        service: 'TestService',
        environment: 'test',
        timestamp: new Date(),
        severity: 'high',
        message: 'Test alert message'
      };

      mockSNS.publish.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('SNS error'))
      } as any);

      // Should not throw error
      await expect(alertingService.sendAlert(context)).resolves.toBeUndefined();
    });
  });

  describe('sendCriticalAlert', () => {
    it('should send critical alert with correct severity', async () => {
      await alertingService.sendCriticalAlert('TestService', 'Critical error occurred');

      expect(mockSNS.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          Subject: '[CRITICAL] Investment AI Alert - TestService',
          MessageAttributes: expect.objectContaining({
            severity: {
              DataType: 'String',
              StringValue: 'critical'
            }
          })
        })
      );
    });
  });

  describe('sendHighAlert', () => {
    it('should send high priority alert', async () => {
      await alertingService.sendHighAlert('TestService', 'High priority issue');

      expect(mockSNS.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          Subject: '[HIGH] Investment AI Alert - TestService',
          MessageAttributes: expect.objectContaining({
            severity: {
              DataType: 'String',
              StringValue: 'high'
            }
          })
        })
      );
    });
  });

  describe('sendMediumAlert', () => {
    it('should send medium priority alert', async () => {
      await alertingService.sendMediumAlert('TestService', 'Medium priority issue');

      expect(mockSNS.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          Subject: '[MEDIUM] Investment AI Alert - TestService',
          MessageAttributes: expect.objectContaining({
            severity: {
              DataType: 'String',
              StringValue: 'medium'
            }
          })
        })
      );
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
      } as any);

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
      } as any);

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
      } as any);

      await expect(
        alertingService.setAlarmState('TestAlarm', 'ALARM', 'Test reason')
      ).rejects.toThrow('Set state error');
    });
  });
});