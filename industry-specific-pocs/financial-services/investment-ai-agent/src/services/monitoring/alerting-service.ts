import { CloudWatch, SNS } from 'aws-sdk';

export interface AlertRule {
  name: string;
  description: string;
  metricName: string;
  namespace: string;
  threshold: number;
  comparisonOperator: string;
  evaluationPeriods: number;
  period: number;
  statistic: string;
  unit?: string;
  dimensions?: Record<string, string>;
  treatMissingData?: 'breaching' | 'notBreaching' | 'ignore' | 'missing';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AlertNotification {
  type: 'email' | 'sms' | 'webhook' | 'slack';
  target: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AlertContext {
  service: string;
  environment: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metadata?: Record<string, any>;
}

export class AlertingService {
  private cloudWatch: CloudWatch;
  private sns: SNS;
  private namespace: string;
  private environment: string;
  private snsTopicArn?: string;

  constructor(
    region: string = 'us-east-1',
    namespace: string = 'InvestmentAI',
    environment: string = 'dev',
    snsTopicArn?: string
  ) {
    this.cloudWatch = new CloudWatch({ region });
    this.sns = new SNS({ region });
    this.namespace = namespace;
    this.environment = environment;
    this.snsTopicArn = snsTopicArn;
  }

  /**
   * Create CloudWatch alarm
   */
  async createAlarm(rule: AlertRule, snsTopicArn?: string): Promise<void> {
    try {
      const dimensions = rule.dimensions ? 
        Object.entries(rule.dimensions).map(([name, value]) => ({ Name: name, Value: value })) : 
        [];

      const params = {
        AlarmName: `${this.environment}-${rule.name}`,
        AlarmDescription: rule.description,
        MetricName: rule.metricName,
        Namespace: rule.namespace,
        Statistic: rule.statistic,
        Period: rule.period,
        EvaluationPeriods: rule.evaluationPeriods,
        Threshold: rule.threshold,
        ComparisonOperator: rule.comparisonOperator,
        Dimensions: dimensions,
        Unit: rule.unit,
        TreatMissingData: rule.treatMissingData || 'notBreaching',
        AlarmActions: snsTopicArn ? [snsTopicArn] : [],
        OKActions: snsTopicArn ? [snsTopicArn] : [],
        Tags: [
          { Key: 'Environment', Value: this.environment },
          { Key: 'Service', Value: 'InvestmentAI' },
          { Key: 'Severity', Value: rule.severity }
        ]
      };

      await this.cloudWatch.putMetricAlarm(params).promise();
      console.log(`Created alarm: ${params.AlarmName}`);

    } catch (error) {
      console.error(`Failed to create alarm ${rule.name}:`, error);
      throw error;
    }
  }

  /**
   * Create standard monitoring alarms for the Investment AI system
   */
  async createStandardAlarms(snsTopicArn?: string): Promise<void> {
    const standardRules: AlertRule[] = [
      // API Error Rate Alarm
      {
        name: 'HighApiErrorRate',
        description: 'Alert when API error rate exceeds 5%',
        metricName: 'ApiRequestError',
        namespace: this.namespace,
        threshold: 5,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        period: 300, // 5 minutes
        statistic: 'Sum',
        dimensions: { Environment: this.environment },
        severity: 'high'
      },
      
      // API Response Time Alarm
      {
        name: 'HighApiResponseTime',
        description: 'Alert when API response time exceeds 5 seconds',
        metricName: 'ApiRequestDuration',
        namespace: this.namespace,
        threshold: 5000,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 3,
        period: 300,
        statistic: 'Average',
        unit: 'Milliseconds',
        dimensions: { Environment: this.environment },
        severity: 'medium'
      },

      // Model Usage Cost Alarm
      {
        name: 'HighModelUsageCost',
        description: 'Alert when model usage cost is high',
        metricName: 'ModelUsageCost',
        namespace: this.namespace,
        threshold: 100, // $100 per 5-minute period
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        period: 300,
        statistic: 'Sum',
        dimensions: { Environment: this.environment },
        severity: 'medium'
      },

      // Critical Error Alarm
      {
        name: 'CriticalErrors',
        description: 'Alert on any critical errors',
        metricName: 'Error_critical',
        namespace: this.namespace,
        threshold: 0,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        period: 60, // 1 minute
        statistic: 'Sum',
        dimensions: { Environment: this.environment },
        severity: 'critical'
      },

      // System Health Alarm
      {
        name: 'SystemUnhealthy',
        description: 'Alert when system health check fails',
        metricName: 'SystemHealthCheck',
        namespace: this.namespace,
        threshold: 0.8, // Less than 80% healthy
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        period: 300,
        statistic: 'Average',
        dimensions: { Environment: this.environment },
        severity: 'high'
      },

      // Model Failure Rate Alarm
      {
        name: 'HighModelFailureRate',
        description: 'Alert when model failure rate exceeds 10%',
        metricName: 'ModelUsageCount',
        namespace: this.namespace,
        threshold: 0.1, // 10% failure rate
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        period: 300,
        statistic: 'Average',
        dimensions: { 
          Environment: this.environment,
          Success: 'false'
        },
        severity: 'high'
      }
    ];

    for (const rule of standardRules) {
      await this.createAlarm(rule, snsTopicArn || this.snsTopicArn);
    }
  }

  /**
   * Send immediate alert notification
   */
  async sendAlert(context: AlertContext): Promise<void> {
    try {
      if (!this.snsTopicArn) {
        console.warn('No SNS topic configured for alerts');
        return;
      }

      const message = {
        service: context.service,
        environment: context.environment,
        severity: context.severity,
        timestamp: context.timestamp.toISOString(),
        message: context.message,
        metadata: context.metadata
      };

      const params = {
        TopicArn: this.snsTopicArn,
        Subject: `[${context.severity.toUpperCase()}] Investment AI Alert - ${context.service}`,
        Message: JSON.stringify(message, null, 2),
        MessageAttributes: {
          severity: {
            DataType: 'String',
            StringValue: context.severity
          },
          service: {
            DataType: 'String',
            StringValue: context.service
          },
          environment: {
            DataType: 'String',
            StringValue: context.environment
          }
        }
      };

      await this.sns.publish(params).promise();
      console.log(`Alert sent for ${context.service}: ${context.message}`);

    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  /**
   * Send critical alert with immediate notification
   */
  async sendCriticalAlert(
    service: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.sendAlert({
      service,
      environment: this.environment,
      timestamp: new Date(),
      severity: 'critical',
      message,
      metadata
    });
  }

  /**
   * Send high priority alert
   */
  async sendHighAlert(
    service: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.sendAlert({
      service,
      environment: this.environment,
      timestamp: new Date(),
      severity: 'high',
      message,
      metadata
    });
  }

  /**
   * Send medium priority alert
   */
  async sendMediumAlert(
    service: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.sendAlert({
      service,
      environment: this.environment,
      timestamp: new Date(),
      severity: 'medium',
      message,
      metadata
    });
  }

  /**
   * Delete alarm
   */
  async deleteAlarm(alarmName: string): Promise<void> {
    try {
      await this.cloudWatch.deleteAlarms({
        AlarmNames: [`${this.environment}-${alarmName}`]
      }).promise();
      
      console.log(`Deleted alarm: ${this.environment}-${alarmName}`);
    } catch (error) {
      console.error(`Failed to delete alarm ${alarmName}:`, error);
      throw error;
    }
  }

  /**
   * List all alarms for this environment
   */
  async listAlarms(): Promise<any[]> {
    try {
      const result = await this.cloudWatch.describeAlarms({
        AlarmNamePrefix: `${this.environment}-`
      }).promise();

      return result.MetricAlarms || [];
    } catch (error) {
      console.error('Failed to list alarms:', error);
      throw error;
    }
  }

  /**
   * Update alarm state for testing
   */
  async setAlarmState(
    alarmName: string,
    state: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA',
    reason: string
  ): Promise<void> {
    try {
      await this.cloudWatch.setAlarmState({
        AlarmName: `${this.environment}-${alarmName}`,
        StateValue: state,
        StateReason: reason
      }).promise();

      console.log(`Set alarm ${alarmName} state to ${state}`);
    } catch (error) {
      console.error(`Failed to set alarm state for ${alarmName}:`, error);
      throw error;
    }
  }
}

// Singleton instance
export const alertingService = new AlertingService(
  process.env.AWS_REGION || 'us-east-1',
  process.env.CLOUDWATCH_NAMESPACE || 'InvestmentAI',
  process.env.NODE_ENV || 'dev',
  process.env.SNS_TOPIC_ARN
);