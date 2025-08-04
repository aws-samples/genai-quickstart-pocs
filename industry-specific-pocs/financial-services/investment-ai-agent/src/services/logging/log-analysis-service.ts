import { CloudWatchLogs, CloudWatch } from 'aws-sdk';
import { logger } from './logger';
import { auditService, AuditEvent, AuditEventType } from './audit-service';

export interface LogAnalysisQuery {
  logGroupName?: string;
  startTime?: Date;
  endTime?: Date;
  filterPattern?: string;
  limit?: number;
}

export interface LogInsight {
  timestamp: Date;
  message: string;
  level: string;
  service: string;
  operation: string;
  metadata?: Record<string, any>;
}

export interface LogAnalysisResult {
  insights: LogInsight[];
  patterns: LogPattern[];
  anomalies: LogAnomaly[];
  metrics: LogMetrics;
  recommendations: string[];
}

export interface LogPattern {
  pattern: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  examples: string[];
}

export interface LogAnomaly {
  timestamp: Date;
  type: 'error_spike' | 'performance_degradation' | 'unusual_activity' | 'security_concern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedServices: string[];
  metrics: Record<string, number>;
  suggestedActions: string[];
}

export interface LogMetrics {
  totalLogs: number;
  errorRate: number;
  averageResponseTime: number;
  topErrors: Array<{ error: string; count: number }>;
  serviceDistribution: Record<string, number>;
  timeSeriesData: Array<{
    timestamp: Date;
    logCount: number;
    errorCount: number;
    avgResponseTime: number;
  }>;
}

export interface ComplianceLogAnalysis {
  complianceEvents: number;
  violations: number;
  complianceRate: number;
  riskDistribution: Record<string, number>;
  regulatoryFrameworks: string[];
  trends: Array<{
    date: Date;
    complianceRate: number;
    violationCount: number;
  }>;
}

export interface SecurityLogAnalysis {
  securityEvents: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  suspiciousActivities: Array<{
    type: string;
    count: number;
    severity: string;
  }>;
  accessPatterns: Array<{
    userId: string;
    accessCount: number;
    riskScore: number;
  }>;
  recommendations: string[];
}

export class LogAnalysisService {
  private cloudWatchLogs: CloudWatchLogs;
  private cloudWatch: CloudWatch;
  private logGroupName: string;

  constructor() {
    this.cloudWatchLogs = new CloudWatchLogs({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.cloudWatch = new CloudWatch({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.logGroupName = process.env.LOG_GROUP_NAME || '/aws/lambda/investment-ai-agent';
  }

  async analyzeLogs(query: LogAnalysisQuery): Promise<LogAnalysisResult> {
    try {
      const startTime = query.startTime || new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
      const endTime = query.endTime || new Date();

      // Fetch logs from CloudWatch
      const logs = await this.fetchLogs({
        ...query,
        startTime,
        endTime
      });

      // Parse and analyze logs
      const insights = this.parseLogInsights(logs);
      const patterns = await this.identifyPatterns(insights);
      const anomalies = await this.detectAnomalies(insights);
      const metrics = this.calculateMetrics(insights);
      const recommendations = this.generateRecommendations(patterns, anomalies, metrics);

      const result: LogAnalysisResult = {
        insights,
        patterns,
        anomalies,
        metrics,
        recommendations
      };

      await logger.info('LogAnalysisService', 'analyzeLogs', 'Log analysis completed', {
        totalInsights: insights.length,
        patternsFound: patterns.length,
        anomaliesDetected: anomalies.length,
        timeRange: { startTime, endTime }
      });

      return result;
    } catch (error) {
      await logger.error('LogAnalysisService', 'analyzeLogs', 'Failed to analyze logs', error as Error, { query });
      throw error;
    }
  }

  async analyzeComplianceLogs(organizationId: string, startDate?: Date, endDate?: Date): Promise<ComplianceLogAnalysis> {
    try {
      const auditReport = await auditService.queryAuditEvents({
        organizationId,
        startDate,
        endDate,
        limit: 1000
      });

      const complianceEvents = auditReport.events.filter(e => 
        e.eventType === 'compliance_check' || e.complianceFlags?.length
      );

      const violations = complianceEvents.filter(e => 
        e.outcome === 'failure' || e.complianceFlags?.some(flag => flag.includes('violation'))
      );

      const complianceRate = complianceEvents.length > 0 ? 
        ((complianceEvents.length - violations.length) / complianceEvents.length) * 100 : 100;

      const riskDistribution = auditReport.summary.eventsByRiskLevel;

      const regulatoryFrameworks = [...new Set(
        complianceEvents
          .map(e => e.details?.regulatoryFramework)
          .filter(Boolean)
      )];

      const trends = this.calculateComplianceTrends(complianceEvents, startDate, endDate);

      const analysis: ComplianceLogAnalysis = {
        complianceEvents: complianceEvents.length,
        violations: violations.length,
        complianceRate,
        riskDistribution,
        regulatoryFrameworks,
        trends
      };

      await logger.info('LogAnalysisService', 'analyzeComplianceLogs', 'Compliance log analysis completed', {
        organizationId,
        complianceEvents: analysis.complianceEvents,
        violations: analysis.violations,
        complianceRate: analysis.complianceRate
      });

      return analysis;
    } catch (error) {
      await logger.error('LogAnalysisService', 'analyzeComplianceLogs', 'Failed to analyze compliance logs', error as Error, {
        organizationId
      });
      throw error;
    }
  }

  async analyzeSecurityLogs(organizationId: string, startDate?: Date, endDate?: Date): Promise<SecurityLogAnalysis> {
    try {
      const securityEvents = await auditService.queryAuditEvents({
        organizationId,
        eventType: 'security_event',
        startDate,
        endDate,
        limit: 1000
      });

      const authEvents = await auditService.queryAuditEvents({
        organizationId,
        eventType: 'user_authentication',
        startDate,
        endDate,
        limit: 1000
      });

      const allSecurityEvents = [...securityEvents.events, ...authEvents.events];

      const threatLevel = this.calculateThreatLevel(allSecurityEvents);
      const suspiciousActivities = this.identifySuspiciousActivities(allSecurityEvents);
      const accessPatterns = this.analyzeAccessPatterns(allSecurityEvents);
      const recommendations = this.generateSecurityRecommendations(allSecurityEvents, suspiciousActivities);

      const analysis: SecurityLogAnalysis = {
        securityEvents: allSecurityEvents.length,
        threatLevel,
        suspiciousActivities,
        accessPatterns,
        recommendations
      };

      await logger.info('LogAnalysisService', 'analyzeSecurityLogs', 'Security log analysis completed', {
        organizationId,
        securityEvents: analysis.securityEvents,
        threatLevel: analysis.threatLevel,
        suspiciousActivitiesCount: analysis.suspiciousActivities.length
      });

      return analysis;
    } catch (error) {
      await logger.error('LogAnalysisService', 'analyzeSecurityLogs', 'Failed to analyze security logs', error as Error, {
        organizationId
      });
      throw error;
    }
  }

  async createLogDashboard(organizationId: string): Promise<{
    dashboardUrl: string;
    widgets: Array<{
      type: string;
      title: string;
      metrics: string[];
    }>;
  }> {
    try {
      const dashboardName = `InvestmentAI-${organizationId}-Logs`;
      
      const widgets = [
        {
          type: 'metric',
          title: 'Error Rate',
          metrics: ['AWS/Lambda', 'Errors', 'FunctionName', 'investment-ai-agent']
        },
        {
          type: 'metric',
          title: 'Response Time',
          metrics: ['AWS/Lambda', 'Duration', 'FunctionName', 'investment-ai-agent']
        },
        {
          type: 'log',
          title: 'Recent Errors',
          metrics: [`${this.logGroupName}`]
        },
        {
          type: 'metric',
          title: 'Compliance Events',
          metrics: ['InvestmentAI/Compliance', 'Events', 'OrganizationId', organizationId]
        },
        {
          type: 'metric',
          title: 'Security Events',
          metrics: ['InvestmentAI/Security', 'Events', 'OrganizationId', organizationId]
        }
      ];

      const dashboardBody = {
        widgets: widgets.map((widget, index) => ({
          type: widget.type,
          x: (index % 3) * 8,
          y: Math.floor(index / 3) * 6,
          width: 8,
          height: 6,
          properties: {
            title: widget.title,
            metrics: [widget.metrics],
            period: 300,
            stat: 'Average',
            region: process.env.AWS_REGION || 'us-east-1'
          }
        }))
      };

      await this.cloudWatch.putDashboard({
        DashboardName: dashboardName,
        DashboardBody: JSON.stringify(dashboardBody)
      }).promise();

      const dashboardUrl = `https://console.aws.amazon.com/cloudwatch/home?region=${process.env.AWS_REGION || 'us-east-1'}#dashboards:name=${dashboardName}`;

      await logger.info('LogAnalysisService', 'createLogDashboard', 'Log dashboard created', {
        organizationId,
        dashboardName,
        widgetCount: widgets.length
      });

      return {
        dashboardUrl,
        widgets
      };
    } catch (error) {
      await logger.error('LogAnalysisService', 'createLogDashboard', 'Failed to create log dashboard', error as Error, {
        organizationId
      });
      throw error;
    }
  }

  private async fetchLogs(query: LogAnalysisQuery): Promise<string[]> {
    const params: CloudWatchLogs.FilterLogEventsRequest = {
      logGroupName: query.logGroupName || this.logGroupName,
      startTime: query.startTime?.getTime(),
      endTime: query.endTime?.getTime(),
      filterPattern: query.filterPattern,
      limit: query.limit || 1000
    };

    const result = await this.cloudWatchLogs.filterLogEvents(params).promise();
    return (result.events || []).map(event => event.message || '');
  }

  private parseLogInsights(logs: string[]): LogInsight[] {
    return logs
      .map(log => {
        try {
          const parsed = JSON.parse(log);
          return {
            timestamp: new Date(parsed.timestamp),
            message: parsed.message,
            level: parsed.level,
            service: parsed.service,
            operation: parsed.operation,
            metadata: parsed.metadata
          };
        } catch {
          // Handle non-JSON logs
          return {
            timestamp: new Date(),
            message: log,
            level: 'INFO',
            service: 'unknown',
            operation: 'unknown'
          };
        }
      })
      .filter(insight => insight.message && insight.service);
  }

  private async identifyPatterns(insights: LogInsight[]): Promise<LogPattern[]> {
    const patterns: Map<string, { count: number; examples: string[] }> = new Map();

    insights.forEach(insight => {
      // Pattern detection logic
      const errorPattern = this.extractErrorPattern(insight);
      if (errorPattern) {
        const existing = patterns.get(errorPattern) || { count: 0, examples: [] };
        existing.count++;
        if (existing.examples.length < 3) {
          existing.examples.push(insight.message);
        }
        patterns.set(errorPattern, existing);
      }
    });

    return Array.from(patterns.entries()).map(([pattern, data]) => ({
      pattern,
      frequency: data.count,
      severity: data.count > 10 ? 'high' : data.count > 5 ? 'medium' : 'low',
      description: `Pattern detected: ${pattern}`,
      examples: data.examples
    }));
  }

  private async detectAnomalies(insights: LogInsight[]): Promise<LogAnomaly[]> {
    const anomalies: LogAnomaly[] = [];

    // Error spike detection
    const errorSpike = this.detectErrorSpike(insights);
    if (errorSpike) {
      anomalies.push(errorSpike);
    }

    // Performance degradation detection
    const perfDegradation = this.detectPerformanceDegradation(insights);
    if (perfDegradation) {
      anomalies.push(perfDegradation);
    }

    return anomalies;
  }

  private calculateMetrics(insights: LogInsight[]): LogMetrics {
    const totalLogs = insights.length;
    const errorLogs = insights.filter(i => i.level === 'ERROR' || i.level === 'CRITICAL');
    const errorRate = totalLogs > 0 ? (errorLogs.length / totalLogs) * 100 : 0;

    const responseTimes = insights
      .filter(i => i.metadata?.responseTime)
      .map(i => i.metadata!.responseTime);
    const averageResponseTime = responseTimes.length > 0 ? 
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;

    const errorCounts: Record<string, number> = {};
    errorLogs.forEach(log => {
      const error = log.metadata?.error?.name || 'Unknown Error';
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    });

    const topErrors = Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const serviceDistribution: Record<string, number> = {};
    insights.forEach(insight => {
      serviceDistribution[insight.service] = (serviceDistribution[insight.service] || 0) + 1;
    });

    const timeSeriesData = this.generateTimeSeriesData(insights);

    return {
      totalLogs,
      errorRate,
      averageResponseTime,
      topErrors,
      serviceDistribution,
      timeSeriesData
    };
  }

  private generateRecommendations(patterns: LogPattern[], anomalies: LogAnomaly[], metrics: LogMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.errorRate > 5) {
      recommendations.push('High error rate detected. Consider investigating the top errors and implementing better error handling.');
    }

    if (metrics.averageResponseTime > 5000) {
      recommendations.push('High average response time detected. Consider optimizing performance-critical operations.');
    }

    if (anomalies.some(a => a.severity === 'critical')) {
      recommendations.push('Critical anomalies detected. Immediate investigation recommended.');
    }

    if (patterns.some(p => p.severity === 'high')) {
      recommendations.push('High-frequency error patterns detected. Consider implementing preventive measures.');
    }

    return recommendations;
  }

  private extractErrorPattern(insight: LogInsight): string | null {
    if (insight.level === 'ERROR' || insight.level === 'CRITICAL') {
      // Extract common error patterns
      const message = insight.message.toLowerCase();
      if (message.includes('timeout')) return 'timeout_error';
      if (message.includes('connection')) return 'connection_error';
      if (message.includes('authentication')) return 'auth_error';
      if (message.includes('authorization')) return 'authz_error';
      if (message.includes('validation')) return 'validation_error';
      return 'generic_error';
    }
    return null;
  }

  private detectErrorSpike(insights: LogInsight[]): LogAnomaly | null {
    const recentErrors = insights.filter(i => 
      (i.level === 'ERROR' || i.level === 'CRITICAL') &&
      i.timestamp > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );

    if (recentErrors.length > 50) { // Threshold for error spike
      return {
        timestamp: new Date(),
        type: 'error_spike',
        severity: 'high',
        description: `Error spike detected: ${recentErrors.length} errors in the last hour`,
        affectedServices: [...new Set(recentErrors.map(e => e.service))],
        metrics: { errorCount: recentErrors.length },
        suggestedActions: [
          'Investigate recent deployments',
          'Check external service dependencies',
          'Review error logs for common patterns'
        ]
      };
    }

    return null;
  }

  private detectPerformanceDegradation(insights: LogInsight[]): LogAnomaly | null {
    const recentPerformance = insights
      .filter(i => i.metadata?.responseTime && i.timestamp > new Date(Date.now() - 60 * 60 * 1000))
      .map(i => i.metadata!.responseTime);

    if (recentPerformance.length > 0) {
      const avgResponseTime = recentPerformance.reduce((a, b) => a + b, 0) / recentPerformance.length;
      
      if (avgResponseTime > 10000) { // 10 seconds threshold
        return {
          timestamp: new Date(),
          type: 'performance_degradation',
          severity: 'medium',
          description: `Performance degradation detected: average response time ${avgResponseTime}ms`,
          affectedServices: ['api'],
          metrics: { averageResponseTime: avgResponseTime },
          suggestedActions: [
            'Check system resources',
            'Review database performance',
            'Analyze slow queries'
          ]
        };
      }
    }

    return null;
  }

  private calculateComplianceTrends(events: AuditEvent[], startDate?: Date, endDate?: Date): Array<{
    date: Date;
    complianceRate: number;
    violationCount: number;
  }> {
    // Group events by day and calculate compliance rate
    const dailyStats: Record<string, { total: number; violations: number }> = {};

    events.forEach(event => {
      const dateKey = event.timestamp.toISOString().split('T')[0];
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { total: 0, violations: 0 };
      }
      dailyStats[dateKey].total++;
      if (event.outcome === 'failure') {
        dailyStats[dateKey].violations++;
      }
    });

    return Object.entries(dailyStats).map(([dateKey, stats]) => ({
      date: new Date(dateKey),
      complianceRate: stats.total > 0 ? ((stats.total - stats.violations) / stats.total) * 100 : 100,
      violationCount: stats.violations
    })).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private calculateThreatLevel(events: AuditEvent[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalEvents = events.filter(e => e.riskLevel === 'critical').length;
    const highRiskEvents = events.filter(e => e.riskLevel === 'high').length;

    if (criticalEvents > 0) return 'critical';
    if (highRiskEvents > 5) return 'high';
    if (highRiskEvents > 0 || events.filter(e => e.riskLevel === 'medium').length > 10) return 'medium';
    return 'low';
  }

  private identifySuspiciousActivities(events: AuditEvent[]): Array<{
    type: string;
    count: number;
    severity: string;
  }> {
    const activities: Record<string, number> = {};

    events.forEach(event => {
      if (event.outcome === 'failure') {
        const activityType = `${event.eventType}_failure`;
        activities[activityType] = (activities[activityType] || 0) + 1;
      }
    });

    return Object.entries(activities).map(([type, count]) => ({
      type,
      count,
      severity: count > 10 ? 'high' : count > 5 ? 'medium' : 'low'
    }));
  }

  private analyzeAccessPatterns(events: AuditEvent[]): Array<{
    userId: string;
    accessCount: number;
    riskScore: number;
  }> {
    const userAccess: Record<string, { count: number; failures: number; highRisk: number }> = {};

    events.forEach(event => {
      if (!userAccess[event.userId]) {
        userAccess[event.userId] = { count: 0, failures: 0, highRisk: 0 };
      }
      userAccess[event.userId].count++;
      if (event.outcome === 'failure') {
        userAccess[event.userId].failures++;
      }
      if (event.riskLevel === 'high' || event.riskLevel === 'critical') {
        userAccess[event.userId].highRisk++;
      }
    });

    return Object.entries(userAccess).map(([userId, stats]) => ({
      userId,
      accessCount: stats.count,
      riskScore: (stats.failures * 2 + stats.highRisk * 3) / stats.count
    })).sort((a, b) => b.riskScore - a.riskScore);
  }

  private generateSecurityRecommendations(events: AuditEvent[], suspiciousActivities: Array<{ type: string; count: number; severity: string }>): string[] {
    const recommendations: string[] = [];

    const failedAuth = events.filter(e => e.eventType === 'user_authentication' && e.outcome === 'failure').length;
    if (failedAuth > 10) {
      recommendations.push('High number of authentication failures detected. Consider implementing account lockout policies.');
    }

    const highRiskEvents = events.filter(e => e.riskLevel === 'high' || e.riskLevel === 'critical').length;
    if (highRiskEvents > 0) {
      recommendations.push('High-risk security events detected. Review and investigate immediately.');
    }

    if (suspiciousActivities.some(a => a.severity === 'high')) {
      recommendations.push('Suspicious activity patterns detected. Consider enhanced monitoring and alerting.');
    }

    return recommendations;
  }

  private generateTimeSeriesData(insights: LogInsight[]): Array<{
    timestamp: Date;
    logCount: number;
    errorCount: number;
    avgResponseTime: number;
  }> {
    // Group by hour
    const hourlyData: Record<string, { logs: LogInsight[]; errors: LogInsight[]; responseTimes: number[] }> = {};

    insights.forEach(insight => {
      const hourKey = new Date(insight.timestamp.getFullYear(), insight.timestamp.getMonth(), insight.timestamp.getDate(), insight.timestamp.getHours()).toISOString();
      
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = { logs: [], errors: [], responseTimes: [] };
      }
      
      hourlyData[hourKey].logs.push(insight);
      
      if (insight.level === 'ERROR' || insight.level === 'CRITICAL') {
        hourlyData[hourKey].errors.push(insight);
      }
      
      if (insight.metadata?.responseTime) {
        hourlyData[hourKey].responseTimes.push(insight.metadata.responseTime);
      }
    });

    return Object.entries(hourlyData).map(([hourKey, data]) => ({
      timestamp: new Date(hourKey),
      logCount: data.logs.length,
      errorCount: data.errors.length,
      avgResponseTime: data.responseTimes.length > 0 ? 
        data.responseTimes.reduce((a, b) => a + b, 0) / data.responseTimes.length : 0
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

export const logAnalysisService = new LogAnalysisService();