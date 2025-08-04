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
export declare class AlertingService {
    private cloudWatch;
    private sns;
    private namespace;
    private environment;
    private snsTopicArn?;
    constructor(region?: string, namespace?: string, environment?: string, snsTopicArn?: string);
    /**
     * Create CloudWatch alarm
     */
    createAlarm(rule: AlertRule, snsTopicArn?: string): Promise<void>;
    /**
     * Create standard monitoring alarms for the Investment AI system
     */
    createStandardAlarms(snsTopicArn?: string): Promise<void>;
    /**
     * Send immediate alert notification
     */
    sendAlert(context: AlertContext): Promise<void>;
    /**
     * Send critical alert with immediate notification
     */
    sendCriticalAlert(service: string, message: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Send high priority alert
     */
    sendHighAlert(service: string, message: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Send medium priority alert
     */
    sendMediumAlert(service: string, message: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Delete alarm
     */
    deleteAlarm(alarmName: string): Promise<void>;
    /**
     * List all alarms for this environment
     */
    listAlarms(): Promise<any[]>;
    /**
     * Update alarm state for testing
     */
    setAlarmState(alarmName: string, state: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA', reason: string): Promise<void>;
}
export declare const alertingService: AlertingService;
