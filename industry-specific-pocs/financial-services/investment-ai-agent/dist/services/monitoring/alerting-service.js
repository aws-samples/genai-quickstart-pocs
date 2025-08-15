"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertingService = exports.AlertingService = void 0;
const aws_sdk_1 = require("aws-sdk");
class AlertingService {
    constructor(region = 'us-east-1', namespace = 'InvestmentAI', environment = 'dev', snsTopicArn) {
        this.cloudWatch = new aws_sdk_1.CloudWatch({ region });
        this.sns = new aws_sdk_1.SNS({ region });
        this.namespace = namespace;
        this.environment = environment;
        this.snsTopicArn = snsTopicArn;
    }
    /**
     * Create CloudWatch alarm
     */
    async createAlarm(rule, snsTopicArn) {
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
        }
        catch (error) {
            console.error(`Failed to create alarm ${rule.name}:`, error);
            throw error;
        }
    }
    /**
     * Create standard monitoring alarms for the Investment AI system
     */
    async createStandardAlarms(snsTopicArn) {
        const standardRules = [
            // API Error Rate Alarm
            {
                name: 'HighApiErrorRate',
                description: 'Alert when API error rate exceeds 5%',
                metricName: 'ApiRequestError',
                namespace: this.namespace,
                threshold: 5,
                comparisonOperator: 'GreaterThanThreshold',
                evaluationPeriods: 2,
                period: 300,
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
                threshold: 100,
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
                period: 60,
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
                threshold: 0.8,
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
                threshold: 0.1,
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
    async sendAlert(context) {
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
        }
        catch (error) {
            console.error('Failed to send alert:', error);
        }
    }
    /**
     * Send critical alert with immediate notification
     */
    async sendCriticalAlert(service, message, metadata) {
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
    async sendHighAlert(service, message, metadata) {
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
    async sendMediumAlert(service, message, metadata) {
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
    async deleteAlarm(alarmName) {
        try {
            await this.cloudWatch.deleteAlarms({
                AlarmNames: [`${this.environment}-${alarmName}`]
            }).promise();
            console.log(`Deleted alarm: ${this.environment}-${alarmName}`);
        }
        catch (error) {
            console.error(`Failed to delete alarm ${alarmName}:`, error);
            throw error;
        }
    }
    /**
     * List all alarms for this environment
     */
    async listAlarms() {
        try {
            const result = await this.cloudWatch.describeAlarms({
                AlarmNamePrefix: `${this.environment}-`
            }).promise();
            return result.MetricAlarms || [];
        }
        catch (error) {
            console.error('Failed to list alarms:', error);
            throw error;
        }
    }
    /**
     * Update alarm state for testing
     */
    async setAlarmState(alarmName, state, reason) {
        try {
            await this.cloudWatch.setAlarmState({
                AlarmName: `${this.environment}-${alarmName}`,
                StateValue: state,
                StateReason: reason
            }).promise();
            console.log(`Set alarm ${alarmName} state to ${state}`);
        }
        catch (error) {
            console.error(`Failed to set alarm state for ${alarmName}:`, error);
            throw error;
        }
    }
}
exports.AlertingService = AlertingService;
// Singleton instance
exports.alertingService = new AlertingService(process.env.AWS_REGION || 'us-east-1', process.env.CLOUDWATCH_NAMESPACE || 'InvestmentAI', process.env.NODE_ENV || 'dev', process.env.SNS_TOPIC_ARN);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxlcnRpbmctc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9tb25pdG9yaW5nL2FsZXJ0aW5nLXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscUNBQTBDO0FBaUMxQyxNQUFhLGVBQWU7SUFPMUIsWUFDRSxTQUFpQixXQUFXLEVBQzVCLFlBQW9CLGNBQWMsRUFDbEMsY0FBc0IsS0FBSyxFQUMzQixXQUFvQjtRQUVwQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksb0JBQVUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDN0MsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLGFBQUcsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDL0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFDM0IsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7UUFDL0IsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7SUFDakMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFlLEVBQUUsV0FBb0I7UUFDckQsSUFBSTtZQUNGLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDbEMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDeEYsRUFBRSxDQUFDO1lBRUwsTUFBTSxNQUFNLEdBQUc7Z0JBQ2IsU0FBUyxFQUFFLEdBQUcsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO2dCQUM3QyxnQkFBZ0IsRUFB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aCwgU05TIH0gZnJvbSAnYXdzLXNkayc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQWxlcnRSdWxlIHtcbiAgbmFtZTogc3RyaW5nO1xuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICBtZXRyaWNOYW1lOiBzdHJpbmc7XG4gIG5hbWVzcGFjZTogc3RyaW5nO1xuICB0aHJlc2hvbGQ6IG51bWJlcjtcbiAgY29tcGFyaXNvbk9wZXJhdG9yOiBzdHJpbmc7XG4gIGV2YWx1YXRpb25QZXJpb2RzOiBudW1iZXI7XG4gIHBlcmlvZDogbnVtYmVyO1xuICBzdGF0aXN0aWM6IHN0cmluZztcbiAgdW5pdD86IHN0cmluZztcbiAgZGltZW5zaW9ucz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIHRyZWF0TWlzc2luZ0RhdGE/OiAnYnJlYWNoaW5nJyB8ICdub3RCcmVhY2hpbmcnIHwgJ2lnbm9yZScgfCAnbWlzc2luZyc7XG4gIHNldmVyaXR5OiAnbG93JyB8ICdtZWRpdW0nIHwgJ2hpZ2gnIHwgJ2NyaXRpY2FsJztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBbGVydE5vdGlmaWNhdGlvbiB7XG4gIHR5cGU6ICdlbWFpbCcgfCAnc21zJyB8ICd3ZWJob29rJyB8ICdzbGFjayc7XG4gIHRhcmdldDogc3RyaW5nO1xuICBzZXZlcml0eTogJ2xvdycgfCAnbWVkaXVtJyB8ICdoaWdoJyB8ICdjcml0aWNhbCc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQWxlcnRDb250ZXh0IHtcbiAgc2VydmljZTogc3RyaW5nO1xuICBlbnZpcm9ubWVudDogc3RyaW5nO1xuICB0aW1lc3RhbXA6IERhdGU7XG4gIHNldmVyaXR5OiAnbG93JyB8ICdtZWRpdW0nIHwgJ2hpZ2gnIHwgJ2NyaXRpY2FsJztcbiAgbWVzc2FnZTogc3RyaW5nO1xuICBtZXRhZGF0YT86IFJlY29yZDxzdHJpbmcsIGFueT47XG59XG5cbmV4cG9ydCBjbGFzcyBBbGVydGluZ1NlcnZpY2Uge1xuICBwcml2YXRlIGNsb3VkV2F0Y2g6IENsb3VkV2F0Y2g7XG4gIHByaXZhdGUgc25zOiBTTlM7XG4gIHByaXZhdGUgbmFtZXNwYWNlOiBzdHJpbmc7XG4gIHByaXZhdGUgZW52aXJvbm1lbnQ6IHN0cmluZztcbiAgcHJpdmF0ZSBzbnNUb3BpY0Fybj86IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihcbiAgICByZWdpb246IHN0cmluZyA9ICd1cy1lYXN0LTEnLFxuICAgIG5hbWVzcGFjZTogc3RyaW5nID0gJ0ludmVzdG1lbnRBSScsXG4gICAgZW52aXJvbm1lbnQ6IHN0cmluZyA9ICdkZXYnLFxuICAgIHNuc1RvcGljQXJuPzogc3RyaW5nXG4gICkge1xuICAgIHRoaXMuY2xvdWRXYXRjaCA9IG5ldyBDbG91ZFdhdGNoKHsgcmVnaW9uIH0pO1xuICAgIHRoaXMuc25zID0gbmV3IFNOUyh7IHJlZ2lvbiB9KTtcbiAgICB0aGlzLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcbiAgICB0aGlzLmVudmlyb25tZW50ID0gZW52aXJvbm1lbnQ7XG4gICAgdGhpcy5zbnNUb3BpY0FybiA9IHNuc1RvcGljQXJuO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBDbG91ZFdhdGNoIGFsYXJtXG4gICAqL1xuICBhc3luYyBjcmVhdGVBbGFybShydWxlOiBBbGVydFJ1bGUsIHNuc1RvcGljQXJuPzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGRpbWVuc2lvbnMgPSBydWxlLmRpbWVuc2lvbnMgPyBcbiAgICAgICAgT2JqZWN0LmVudHJpZXMocnVsZS5kaW1lbnNpb25zKS5tYXAoKFtuYW1lLCB2YWx1ZV0pID0+ICh7IE5hbWU6IG5hbWUsIFZhbHVlOiB2YWx1ZSB9KSkgOiBcbiAgICAgICAgW107XG5cbiAgICAgIGNvbnN0IHBhcmFtcyA9IHtcbiAgICAgICAgQWxhcm1OYW1lOiBgJHt0aGlzLmVudmlyb25tZW50fS0ke3J1bGUubmFtZX1gLFxuICAgICAgICBBbGFybURlc2NyaXB0aW9uOiBydWxlLmRlc2NyaXB0aW9uLFxuICAgICAgICBNZXRyaWNOYW1lOiBydWxlLm1ldHJpY05hbWUsXG4gICAgICAgIE5hbWVzcGFjZTogcnVsZS5uYW1lc3BhY2UsXG4gICAgICAgIFN0YXRpc3RpYzogcnVsZS5zdGF0aXN0aWMsXG4gICAgICAgIFBlcmlvZDogcnVsZS5wZXJpb2QsXG4gICAgICAgIEV2YWx1YXRpb25QZXJpb2RzOiBydWxlLmV2YWx1YXRpb25QZXJpb2RzLFxuICAgICAgICBUaHJlc2hvbGQ6IHJ1bGUudGhyZXNob2xkLFxuICAgICAgICBDb21wYXJpc29uT3BlcmF0b3I6IHJ1bGUuY29tcGFyaXNvbk9wZXJhdG9yLFxuICAgICAgICBEaW1lbnNpb25zOiBkaW1lbnNpb25zLFxuICAgICAgICBVbml0OiBydWxlLnVuaXQsXG4gICAgICAgIFRyZWF0TWlzc2luZ0RhdGE6IHJ1bGUudHJlYXRNaXNzaW5nRGF0YSB8fCAnbm90QnJlYWNoaW5nJyxcbiAgICAgICAgQWxhcm1BY3Rpb25zOiBzbnNUb3BpY0FybiA/IFtzbnNUb3BpY0Fybl0gOiBbXSxcbiAgICAgICAgT0tBY3Rpb25zOiBzbnNUb3BpY0FybiA/IFtzbnNUb3BpY0Fybl0gOiBbXSxcbiAgICAgICAgVGFnczogW1xuICAgICAgICAgIHsgS2V5OiAnRW52aXJvbm1lbnQnLCBWYWx1ZTogdGhpcy5lbnZpcm9ubWVudCB9LFxuICAgICAgICAgIHsgS2V5OiAnU2VydmljZScsIFZhbHVlOiAnSW52ZXN0bWVudEFJJyB9LFxuICAgICAgICAgIHsgS2V5OiAnU2V2ZXJpdHknLCBWYWx1ZTogcnVsZS5zZXZlcml0eSB9XG4gICAgICAgIF1cbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IHRoaXMuY2xvdWRXYXRjaC5wdXRNZXRyaWNBbGFybShwYXJhbXMpLnByb21pc2UoKTtcbiAgICAgIGNvbnNvbGUubG9nKGBDcmVhdGVkIGFsYXJtOiAke3BhcmFtcy5BbGFybU5hbWV9YCk7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihgRmFpbGVkIHRvIGNyZWF0ZSBhbGFybSAke3J1bGUubmFtZX06YCwgZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBzdGFuZGFyZCBtb25pdG9yaW5nIGFsYXJtcyBmb3IgdGhlIEludmVzdG1lbnQgQUkgc3lzdGVtXG4gICAqL1xuICBhc3luYyBjcmVhdGVTdGFuZGFyZEFsYXJtcyhzbnNUb3BpY0Fybj86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHN0YW5kYXJkUnVsZXM6IEFsZXJ0UnVsZVtdID0gW1xuICAgICAgLy8gQVBJIEVycm9yIFJhdGUgQWxhcm1cbiAgICAgIHtcbiAgICAgICAgbmFtZTogJ0hpZ2hBcGlFcnJvclJhdGUnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0FsZXJ0IHdoZW4gQVBJIGVycm9yIHJhdGUgZXhjZWVkcyA1JScsXG4gICAgICAgIG1ldHJpY05hbWU6ICdBcGlSZXF1ZXN0RXJyb3InLFxuICAgICAgICBuYW1lc3BhY2U6IHRoaXMubmFtZXNwYWNlLFxuICAgICAgICB0aHJlc2hvbGQ6IDUsXG4gICAgICAgIGNvbXBhcmlzb25PcGVyYXRvcjogJ0dyZWF0ZXJUaGFuVGhyZXNob2xkJyxcbiAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXG4gICAgICAgIHBlcmlvZDogMzAwLCAvLyA1IG1pbnV0ZXNcbiAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgZGltZW5zaW9uczogeyBFbnZpcm9ubWVudDogdGhpcy5lbnZpcm9ubWVudCB9LFxuICAgICAgICBzZXZlcml0eTogJ2hpZ2gnXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBBUEkgUmVzcG9uc2UgVGltZSBBbGFybVxuICAgICAge1xuICAgICAgICBuYW1lOiAnSGlnaEFwaVJlc3BvbnNlVGltZScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQWxlcnQgd2hlbiBBUEkgcmVzcG9uc2UgdGltZSBleGNlZWRzIDUgc2Vjb25kcycsXG4gICAgICAgIG1ldHJpY05hbWU6ICdBcGlSZXF1ZXN0RHVyYXRpb24nLFxuICAgICAgICBuYW1lc3BhY2U6IHRoaXMubmFtZXNwYWNlLFxuICAgICAgICB0aHJlc2hvbGQ6IDUwMDAsXG4gICAgICAgIGNvbXBhcmlzb25PcGVyYXRvcjogJ0dyZWF0ZXJUaGFuVGhyZXNob2xkJyxcbiAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDMsXG4gICAgICAgIHBlcmlvZDogMzAwLFxuICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgdW5pdDogJ01pbGxpc2Vjb25kcycsXG4gICAgICAgIGRpbWVuc2lvbnM6IHsgRW52aXJvbm1lbnQ6IHRoaXMuZW52aXJvbm1lbnQgfSxcbiAgICAgICAgc2V2ZXJpdHk6ICdtZWRpdW0nXG4gICAgICB9LFxuXG4gICAgICAvLyBNb2RlbCBVc2FnZSBDb3N0IEFsYXJtXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdIaWdoTW9kZWxVc2FnZUNvc3QnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0FsZXJ0IHdoZW4gbW9kZWwgdXNhZ2UgY29zdCBpcyBoaWdoJyxcbiAgICAgICAgbWV0cmljTmFtZTogJ01vZGVsVXNhZ2VDb3N0JyxcbiAgICAgICAgbmFtZXNwYWNlOiB0aGlzLm5hbWVzcGFjZSxcbiAgICAgICAgdGhyZXNob2xkOiAxMDAsIC8vICQxMDAgcGVyIDUtbWludXRlIHBlcmlvZFxuICAgICAgICBjb21wYXJpc29uT3BlcmF0b3I6ICdHcmVhdGVyVGhhblRocmVzaG9sZCcsXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAxLFxuICAgICAgICBwZXJpb2Q6IDMwMCxcbiAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgZGltZW5zaW9uczogeyBFbnZpcm9ubWVudDogdGhpcy5lbnZpcm9ubWVudCB9LFxuICAgICAgICBzZXZlcml0eTogJ21lZGl1bSdcbiAgICAgIH0sXG5cbiAgICAgIC8vIENyaXRpY2FsIEVycm9yIEFsYXJtXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdDcml0aWNhbEVycm9ycycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQWxlcnQgb24gYW55IGNyaXRpY2FsIGVycm9ycycsXG4gICAgICAgIG1ldHJpY05hbWU6ICdFcnJvcl9jcml0aWNhbCcsXG4gICAgICAgIG5hbWVzcGFjZTogdGhpcy5uYW1lc3BhY2UsXG4gICAgICAgIHRocmVzaG9sZDogMCxcbiAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiAnR3JlYXRlclRoYW5UaHJlc2hvbGQnLFxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICAgICAgcGVyaW9kOiA2MCwgLy8gMSBtaW51dGVcbiAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgZGltZW5zaW9uczogeyBFbnZpcm9ubWVudDogdGhpcy5lbnZpcm9ubWVudCB9LFxuICAgICAgICBzZXZlcml0eTogJ2NyaXRpY2FsJ1xuICAgICAgfSxcblxuICAgICAgLy8gU3lzdGVtIEhlYWx0aCBBbGFybVxuICAgICAge1xuICAgICAgICBuYW1lOiAnU3lzdGVtVW5oZWFsdGh5JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBbGVydCB3aGVuIHN5c3RlbSBoZWFsdGggY2hlY2sgZmFpbHMnLFxuICAgICAgICBtZXRyaWNOYW1lOiAnU3lzdGVtSGVhbHRoQ2hlY2snLFxuICAgICAgICBuYW1lc3BhY2U6IHRoaXMubmFtZXNwYWNlLFxuICAgICAgICB0aHJlc2hvbGQ6IDAuOCwgLy8gTGVzcyB0aGFuIDgwJSBoZWFsdGh5XG4gICAgICAgIGNvbXBhcmlzb25PcGVyYXRvcjogJ0xlc3NUaGFuVGhyZXNob2xkJyxcbiAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXG4gICAgICAgIHBlcmlvZDogMzAwLFxuICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgZGltZW5zaW9uczogeyBFbnZpcm9ubWVudDogdGhpcy5lbnZpcm9ubWVudCB9LFxuICAgICAgICBzZXZlcml0eTogJ2hpZ2gnXG4gICAgICB9LFxuXG4gICAgICAvLyBNb2RlbCBGYWlsdXJlIFJhdGUgQWxhcm1cbiAgICAgIHtcbiAgICAgICAgbmFtZTogJ0hpZ2hNb2RlbEZhaWx1cmVSYXRlJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBbGVydCB3aGVuIG1vZGVsIGZhaWx1cmUgcmF0ZSBleGNlZWRzIDEwJScsXG4gICAgICAgIG1ldHJpY05hbWU6ICdNb2RlbFVzYWdlQ291bnQnLFxuICAgICAgICBuYW1lc3BhY2U6IHRoaXMubmFtZXNwYWNlLFxuICAgICAgICB0aHJlc2hvbGQ6IDAuMSwgLy8gMTAlIGZhaWx1cmUgcmF0ZVxuICAgICAgICBjb21wYXJpc29uT3BlcmF0b3I6ICdHcmVhdGVyVGhhblRocmVzaG9sZCcsXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxuICAgICAgICBwZXJpb2Q6IDMwMCxcbiAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZScsXG4gICAgICAgIGRpbWVuc2lvbnM6IHsgXG4gICAgICAgICAgRW52aXJvbm1lbnQ6IHRoaXMuZW52aXJvbm1lbnQsXG4gICAgICAgICAgU3VjY2VzczogJ2ZhbHNlJ1xuICAgICAgICB9LFxuICAgICAgICBzZXZlcml0eTogJ2hpZ2gnXG4gICAgICB9XG4gICAgXTtcblxuICAgIGZvciAoY29uc3QgcnVsZSBvZiBzdGFuZGFyZFJ1bGVzKSB7XG4gICAgICBhd2FpdCB0aGlzLmNyZWF0ZUFsYXJtKHJ1bGUsIHNuc1RvcGljQXJuIHx8IHRoaXMuc25zVG9waWNBcm4pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGltbWVkaWF0ZSBhbGVydCBub3RpZmljYXRpb25cbiAgICovXG4gIGFzeW5jIHNlbmRBbGVydChjb250ZXh0OiBBbGVydENvbnRleHQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgaWYgKCF0aGlzLnNuc1RvcGljQXJuKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignTm8gU05TIHRvcGljIGNvbmZpZ3VyZWQgZm9yIGFsZXJ0cycpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSB7XG4gICAgICAgIHNlcnZpY2U6IGNvbnRleHQuc2VydmljZSxcbiAgICAgICAgZW52aXJvbm1lbnQ6IGNvbnRleHQuZW52aXJvbm1lbnQsXG4gICAgICAgIHNldmVyaXR5OiBjb250ZXh0LnNldmVyaXR5LFxuICAgICAgICB0aW1lc3RhbXA6IGNvbnRleHQudGltZXN0YW1wLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIG1lc3NhZ2U6IGNvbnRleHQubWVzc2FnZSxcbiAgICAgICAgbWV0YWRhdGE6IGNvbnRleHQubWV0YWRhdGFcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHBhcmFtcyA9IHtcbiAgICAgICAgVG9waWNBcm46IHRoaXMuc25zVG9waWNBcm4sXG4gICAgICAgIFN1YmplY3Q6IGBbJHtjb250ZXh0LnNldmVyaXR5LnRvVXBwZXJDYXNlKCl9XSBJbnZlc3RtZW50IEFJIEFsZXJ0IC0gJHtjb250ZXh0LnNlcnZpY2V9YCxcbiAgICAgICAgTWVzc2FnZTogSlNPTi5zdHJpbmdpZnkobWVzc2FnZSwgbnVsbCwgMiksXG4gICAgICAgIE1lc3NhZ2VBdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgc2V2ZXJpdHk6IHtcbiAgICAgICAgICAgIERhdGFUeXBlOiAnU3RyaW5nJyxcbiAgICAgICAgICAgIFN0cmluZ1ZhbHVlOiBjb250ZXh0LnNldmVyaXR5XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzZXJ2aWNlOiB7XG4gICAgICAgICAgICBEYXRhVHlwZTogJ1N0cmluZycsXG4gICAgICAgICAgICBTdHJpbmdWYWx1ZTogY29udGV4dC5zZXJ2aWNlXG4gICAgICAgICAgfSxcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgRGF0YVR5cGU6ICdTdHJpbmcnLFxuICAgICAgICAgICAgU3RyaW5nVmFsdWU6IGNvbnRleHQuZW52aXJvbm1lbnRcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IHRoaXMuc25zLnB1Ymxpc2gocGFyYW1zKS5wcm9taXNlKCk7XG4gICAgICBjb25zb2xlLmxvZyhgQWxlcnQgc2VudCBmb3IgJHtjb250ZXh0LnNlcnZpY2V9OiAke2NvbnRleHQubWVzc2FnZX1gKTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gc2VuZCBhbGVydDonLCBlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgY3JpdGljYWwgYWxlcnQgd2l0aCBpbW1lZGlhdGUgbm90aWZpY2F0aW9uXG4gICAqL1xuICBhc3luYyBzZW5kQ3JpdGljYWxBbGVydChcbiAgICBzZXJ2aWNlOiBzdHJpbmcsXG4gICAgbWVzc2FnZTogc3RyaW5nLFxuICAgIG1ldGFkYXRhPzogUmVjb3JkPHN0cmluZywgYW55PlxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnNlbmRBbGVydCh7XG4gICAgICBzZXJ2aWNlLFxuICAgICAgZW52aXJvbm1lbnQ6IHRoaXMuZW52aXJvbm1lbnQsXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICBzZXZlcml0eTogJ2NyaXRpY2FsJyxcbiAgICAgIG1lc3NhZ2UsXG4gICAgICBtZXRhZGF0YVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgaGlnaCBwcmlvcml0eSBhbGVydFxuICAgKi9cbiAgYXN5bmMgc2VuZEhpZ2hBbGVydChcbiAgICBzZXJ2aWNlOiBzdHJpbmcsXG4gICAgbWVzc2FnZTogc3RyaW5nLFxuICAgIG1ldGFkYXRhPzogUmVjb3JkPHN0cmluZywgYW55PlxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnNlbmRBbGVydCh7XG4gICAgICBzZXJ2aWNlLFxuICAgICAgZW52aXJvbm1lbnQ6IHRoaXMuZW52aXJvbm1lbnQsXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICBzZXZlcml0eTogJ2hpZ2gnLFxuICAgICAgbWVzc2FnZSxcbiAgICAgIG1ldGFkYXRhXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2VuZCBtZWRpdW0gcHJpb3JpdHkgYWxlcnRcbiAgICovXG4gIGFzeW5jIHNlbmRNZWRpdW1BbGVydChcbiAgICBzZXJ2aWNlOiBzdHJpbmcsXG4gICAgbWVzc2FnZTogc3RyaW5nLFxuICAgIG1ldGFkYXRhPzogUmVjb3JkPHN0cmluZywgYW55PlxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnNlbmRBbGVydCh7XG4gICAgICBzZXJ2aWNlLFxuICAgICAgZW52aXJvbm1lbnQ6IHRoaXMuZW52aXJvbm1lbnQsXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICBzZXZlcml0eTogJ21lZGl1bScsXG4gICAgICBtZXNzYWdlLFxuICAgICAgbWV0YWRhdGFcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYWxhcm1cbiAgICovXG4gIGFzeW5jIGRlbGV0ZUFsYXJtKGFsYXJtTmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY2xvdWRXYXRjaC5kZWxldGVBbGFybXMoe1xuICAgICAgICBBbGFybU5hbWVzOiBbYCR7dGhpcy5lbnZpcm9ubWVudH0tJHthbGFybU5hbWV9YF1cbiAgICAgIH0pLnByb21pc2UoKTtcbiAgICAgIFxuICAgICAgY29uc29sZS5sb2coYERlbGV0ZWQgYWxhcm06ICR7dGhpcy5lbnZpcm9ubWVudH0tJHthbGFybU5hbWV9YCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byBkZWxldGUgYWxhcm0gJHthbGFybU5hbWV9OmAsIGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCBhbGFybXMgZm9yIHRoaXMgZW52aXJvbm1lbnRcbiAgICovXG4gIGFzeW5jIGxpc3RBbGFybXMoKTogUHJvbWlzZTxhbnlbXT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmNsb3VkV2F0Y2guZGVzY3JpYmVBbGFybXMoe1xuICAgICAgICBBbGFybU5hbWVQcmVmaXg6IGAke3RoaXMuZW52aXJvbm1lbnR9LWBcbiAgICAgIH0pLnByb21pc2UoKTtcblxuICAgICAgcmV0dXJuIHJlc3VsdC5NZXRyaWNBbGFybXMgfHwgW107XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBsaXN0IGFsYXJtczonLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIGFsYXJtIHN0YXRlIGZvciB0ZXN0aW5nXG4gICAqL1xuICBhc3luYyBzZXRBbGFybVN0YXRlKFxuICAgIGFsYXJtTmFtZTogc3RyaW5nLFxuICAgIHN0YXRlOiAnT0snIHwgJ0FMQVJNJyB8ICdJTlNVRkZJQ0lFTlRfREFUQScsXG4gICAgcmVhc29uOiBzdHJpbmdcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY2xvdWRXYXRjaC5zZXRBbGFybVN0YXRlKHtcbiAgICAgICAgQWxhcm1OYW1lOiBgJHt0aGlzLmVudmlyb25tZW50fS0ke2FsYXJtTmFtZX1gLFxuICAgICAgICBTdGF0ZVZhbHVlOiBzdGF0ZSxcbiAgICAgICAgU3RhdGVSZWFzb246IHJlYXNvblxuICAgICAgfSkucHJvbWlzZSgpO1xuXG4gICAgICBjb25zb2xlLmxvZyhgU2V0IGFsYXJtICR7YWxhcm1OYW1lfSBzdGF0ZSB0byAke3N0YXRlfWApO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgdG8gc2V0IGFsYXJtIHN0YXRlIGZvciAke2FsYXJtTmFtZX06YCwgZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG59XG5cbi8vIFNpbmdsZXRvbiBpbnN0YW5jZVxuZXhwb3J0IGNvbnN0IGFsZXJ0aW5nU2VydmljZSA9IG5ldyBBbGVydGluZ1NlcnZpY2UoXG4gIHByb2Nlc3MuZW52LkFXU19SRUdJT04gfHwgJ3VzLWVhc3QtMScsXG4gIHByb2Nlc3MuZW52LkNMT1VEV0FUQ0hfTkFNRVNQQUNFIHx8ICdJbnZlc3RtZW50QUknLFxuICBwcm9jZXNzLmVudi5OT0RFX0VOViB8fCAnZGV2JyxcbiAgcHJvY2Vzcy5lbnYuU05TX1RPUElDX0FSTlxuKTsiXX0=