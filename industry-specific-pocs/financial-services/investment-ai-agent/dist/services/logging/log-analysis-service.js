"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAnalysisService = exports.LogAnalysisService = void 0;
const aws_sdk_1 = require("aws-sdk");
const logger_1 = require("./logger");
const audit_service_1 = require("./audit-service");
class LogAnalysisService {
    constructor() {
        this.cloudWatchLogs = new aws_sdk_1.CloudWatchLogs({
            region: process.env.AWS_REGION || 'us-east-1'
        });
        this.cloudWatch = new aws_sdk_1.CloudWatch({
            region: process.env.AWS_REGION || 'us-east-1'
        });
        this.logGroupName = process.env.LOG_GROUP_NAME || '/aws/lambda/investment-ai-agent';
    }
    async analyzeLogs(query) {
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
            const result = {
                insights,
                patterns,
                anomalies,
                metrics,
                recommendations
            };
            await logger_1.logger.info('LogAnalysisService', 'analyzeLogs', 'Log analysis completed', {
                totalInsights: insights.length,
                patternsFound: patterns.length,
                anomaliesDetected: anomalies.length,
                timeRange: { startTime, endTime }
            });
            return result;
        }
        catch (error) {
            await logger_1.logger.error('LogAnalysisService', 'analyzeLogs', 'Failed to analyze logs', error, { query });
            throw error;
        }
    }
    async analyzeComplianceLogs(organizationId, startDate, endDate) {
        try {
            const auditReport = await audit_service_1.auditService.queryAuditEvents({
                organizationId,
                startDate,
                endDate,
                limit: 1000
            });
            const complianceEvents = auditReport.events.filter(e => e.eventType === 'compliance_check' || e.complianceFlags?.length);
            const violations = complianceEvents.filter(e => e.outcome === 'failure' || e.complianceFlags?.some(flag => flag.includes('violation')));
            const complianceRate = complianceEvents.length > 0 ?
                ((complianceEvents.length - violations.length) / complianceEvents.length) * 100 : 100;
            const riskDistribution = auditReport.summary.eventsByRiskLevel;
            const regulatoryFrameworks = [...new Set(complianceEvents
                    .map(e => e.details?.regulatoryFramework)
                    .filter(Boolean))];
            const trends = this.calculateComplianceTrends(complianceEvents, startDate, endDate);
            const analysis = {
                complianceEvents: complianceEvents.length,
                violations: violations.length,
                complianceRate,
                riskDistribution,
                regulatoryFrameworks,
                trends
            };
            await logger_1.logger.info('LogAnalysisService', 'analyzeComplianceLogs', 'Compliance log analysis completed', {
                organizationId,
                complianceEvents: analysis.complianceEvents,
                violations: analysis.violations,
                complianceRate: analysis.complianceRate
            });
            return analysis;
        }
        catch (error) {
            await logger_1.logger.error('LogAnalysisService', 'analyzeComplianceLogs', 'Failed to analyze compliance logs', error, {
                organizationId
            });
            throw error;
        }
    }
    async analyzeSecurityLogs(organizationId, startDate, endDate) {
        try {
            const securityEvents = await audit_service_1.auditService.queryAuditEvents({
                organizationId,
                eventType: 'security_event',
                startDate,
                endDate,
                limit: 1000
            });
            const authEvents = await audit_service_1.auditService.queryAuditEvents({
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
            const analysis = {
                securityEvents: allSecurityEvents.length,
                threatLevel,
                suspiciousActivities,
                accessPatterns,
                recommendations
            };
            await logger_1.logger.info('LogAnalysisService', 'analyzeSecurityLogs', 'Security log analysis completed', {
                organizationId,
                securityEvents: analysis.securityEvents,
                threatLevel: analysis.threatLevel,
                suspiciousActivitiesCount: analysis.suspiciousActivities.length
            });
            return analysis;
        }
        catch (error) {
            await logger_1.logger.error('LogAnalysisService', 'analyzeSecurityLogs', 'Failed to analyze security logs', error, {
                organizationId
            });
            throw error;
        }
    }
    async createLogDashboard(organizationId) {
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
            await logger_1.logger.info('LogAnalysisService', 'createLogDashboard', 'Log dashboard created', {
                organizationId,
                dashboardName,
                widgetCount: widgets.length
            });
            return {
                dashboardUrl,
                widgets
            };
        }
        catch (error) {
            await logger_1.logger.error('LogAnalysisService', 'createLogDashboard', 'Failed to create log dashboard', error, {
                organizationId
            });
            throw error;
        }
    }
    async fetchLogs(query) {
        const params = {
            logGroupName: query.logGroupName || this.logGroupName,
            startTime: query.startTime?.getTime(),
            endTime: query.endTime?.getTime(),
            filterPattern: query.filterPattern,
            limit: query.limit || 1000
        };
        const result = await this.cloudWatchLogs.filterLogEvents(params).promise();
        return (result.events || []).map(event => event.message || '');
    }
    parseLogInsights(logs) {
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
            }
            catch {
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
    async identifyPatterns(insights) {
        const patterns = new Map();
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
    async detectAnomalies(insights) {
        const anomalies = [];
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
    calculateMetrics(insights) {
        const totalLogs = insights.length;
        const errorLogs = insights.filter(i => i.level === 'ERROR' || i.level === 'CRITICAL');
        const errorRate = totalLogs > 0 ? (errorLogs.length / totalLogs) * 100 : 0;
        const responseTimes = insights
            .filter(i => i.metadata?.responseTime)
            .map(i => i.metadata.responseTime);
        const averageResponseTime = responseTimes.length > 0 ?
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
        const errorCounts = {};
        errorLogs.forEach(log => {
            const error = log.metadata?.error?.name || 'Unknown Error';
            errorCounts[error] = (errorCounts[error] || 0) + 1;
        });
        const topErrors = Object.entries(errorCounts)
            .map(([error, count]) => ({ error, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        const serviceDistribution = {};
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
    generateRecommendations(patterns, anomalies, metrics) {
        const recommendations = [];
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
    extractErrorPattern(insight) {
        if (insight.level === 'ERROR' || insight.level === 'CRITICAL') {
            // Extract common error patterns
            const message = insight.message.toLowerCase();
            if (message.includes('timeout'))
                return 'timeout_error';
            if (message.includes('connection'))
                return 'connection_error';
            if (message.includes('authentication'))
                return 'auth_error';
            if (message.includes('authorization'))
                return 'authz_error';
            if (message.includes('validation'))
                return 'validation_error';
            return 'generic_error';
        }
        return null;
    }
    detectErrorSpike(insights) {
        const recentErrors = insights.filter(i => (i.level === 'ERROR' || i.level === 'CRITICAL') &&
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
    detectPerformanceDegradation(insights) {
        const recentPerformance = insights
            .filter(i => i.metadata?.responseTime && i.timestamp > new Date(Date.now() - 60 * 60 * 1000))
            .map(i => i.metadata.responseTime);
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
    calculateComplianceTrends(events, startDate, endDate) {
        // Group events by day and calculate compliance rate
        const dailyStats = {};
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
    calculateThreatLevel(events) {
        const criticalEvents = events.filter(e => e.riskLevel === 'critical').length;
        const highRiskEvents = events.filter(e => e.riskLevel === 'high').length;
        if (criticalEvents > 0)
            return 'critical';
        if (highRiskEvents > 5)
            return 'high';
        if (highRiskEvents > 0 || events.filter(e => e.riskLevel === 'medium').length > 10)
            return 'medium';
        return 'low';
    }
    identifySuspiciousActivities(events) {
        const activities = {};
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
    analyzeAccessPatterns(events) {
        const userAccess = {};
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
    generateSecurityRecommendations(events, suspiciousActivities) {
        const recommendations = [];
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
    generateTimeSeriesData(insights) {
        // Group by hour
        const hourlyData = {};
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
exports.LogAnalysisService = LogAnalysisService;
exports.logAnalysisService = new LogAnalysisService();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nLWFuYWx5c2lzLXNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2VydmljZXMvbG9nZ2luZy9sb2ctYW5hbHlzaXMtc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FBcUQ7QUFDckQscUNBQWtDO0FBQ2xDLG1EQUEyRTtBQXdGM0UsTUFBYSxrQkFBa0I7SUFLN0I7UUFDRSxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksd0JBQWMsQ0FBQztZQUN2QyxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksV0FBVztTQUM5QyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksb0JBQVUsQ0FBQztZQUMvQixNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksV0FBVztTQUM5QyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxJQUFJLGlDQUFpQyxDQUFDO0lBQ3RGLENBQUM7SUFFRCxLQUFLLENBQUMsV0FBVyxDQUFDLEtBQXVCO1FBQ3ZDLElBQUk7WUFDRixNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLGdCQUFnQjtZQUNqRyxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxJQUFJLElBQUksSUFBSSxFQUFFLENBQUM7WUFFNUMsNkJBQTZCO1lBQzdCLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDaEMsR0FBRyxLQUFLO2dCQUNSLFNBQVM7Z0JBQ1QsT0FBTzthQUNSLENBQUMsQ0FBQztZQUVILHlCQUF5QjtZQUN6QixNQUFNLFFBQVEsR0FBRyxJ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LCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDbG91ZFdhdGNoTG9ncywgQ2xvdWRXYXRjaCB9IGZyb20gJ2F3cy1zZGsnO1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi9sb2dnZXInO1xuaW1wb3J0IHsgYXVkaXRTZXJ2aWNlLCBBdWRpdEV2ZW50LCBBdWRpdEV2ZW50VHlwZSB9IGZyb20gJy4vYXVkaXQtc2VydmljZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTG9nQW5hbHlzaXNRdWVyeSB7XG4gIGxvZ0dyb3VwTmFtZT86IHN0cmluZztcbiAgc3RhcnRUaW1lPzogRGF0ZTtcbiAgZW5kVGltZT86IERhdGU7XG4gIGZpbHRlclBhdHRlcm4/OiBzdHJpbmc7XG4gIGxpbWl0PzogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExvZ0luc2lnaHQge1xuICB0aW1lc3RhbXA6IERhdGU7XG4gIG1lc3NhZ2U6IHN0cmluZztcbiAgbGV2ZWw6IHN0cmluZztcbiAgc2VydmljZTogc3RyaW5nO1xuICBvcGVyYXRpb246IHN0cmluZztcbiAgbWV0YWRhdGE/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExvZ0FuYWx5c2lzUmVzdWx0IHtcbiAgaW5zaWdodHM6IExvZ0luc2lnaHRbXTtcbiAgcGF0dGVybnM6IExvZ1BhdHRlcm5bXTtcbiAgYW5vbWFsaWVzOiBMb2dBbm9tYWx5W107XG4gIG1ldHJpY3M6IExvZ01ldHJpY3M7XG4gIHJlY29tbWVuZGF0aW9uczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTG9nUGF0dGVybiB7XG4gIHBhdHRlcm46IHN0cmluZztcbiAgZnJlcXVlbmN5OiBudW1iZXI7XG4gIHNldmVyaXR5OiAnbG93JyB8ICdtZWRpdW0nIHwgJ2hpZ2gnO1xuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICBleGFtcGxlczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTG9nQW5vbWFseSB7XG4gIHRpbWVzdGFtcDogRGF0ZTtcbiAgdHlwZTogJ2Vycm9yX3NwaWtlJyB8ICdwZXJmb3JtYW5jZV9kZWdyYWRhdGlvbicgfCAndW51c3VhbF9hY3Rpdml0eScgfCAnc2VjdXJpdHlfY29uY2Vybic7XG4gIHNldmVyaXR5OiAnbG93JyB8ICdtZWRpdW0nIHwgJ2hpZ2gnIHwgJ2NyaXRpY2FsJztcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgYWZmZWN0ZWRTZXJ2aWNlczogc3RyaW5nW107XG4gIG1ldHJpY3M6IFJlY29yZDxzdHJpbmcsIG51bWJlcj47XG4gIHN1Z2dlc3RlZEFjdGlvbnM6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExvZ01ldHJpY3Mge1xuICB0b3RhbExvZ3M6IG51bWJlcjtcbiAgZXJyb3JSYXRlOiBudW1iZXI7XG4gIGF2ZXJhZ2VSZXNwb25zZVRpbWU6IG51bWJlcjtcbiAgdG9wRXJyb3JzOiBBcnJheTx7IGVycm9yOiBzdHJpbmc7IGNvdW50OiBudW1iZXIgfT47XG4gIHNlcnZpY2VEaXN0cmlidXRpb246IFJlY29yZDxzdHJpbmcsIG51bWJlcj47XG4gIHRpbWVTZXJpZXNEYXRhOiBBcnJheTx7XG4gICAgdGltZXN0YW1wOiBEYXRlO1xuICAgIGxvZ0NvdW50OiBudW1iZXI7XG4gICAgZXJyb3JDb3VudDogbnVtYmVyO1xuICAgIGF2Z1Jlc3BvbnNlVGltZTogbnVtYmVyO1xuICB9Pjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb21wbGlhbmNlTG9nQW5hbHlzaXMge1xuICBjb21wbGlhbmNlRXZlbnRzOiBudW1iZXI7XG4gIHZpb2xhdGlvbnM6IG51bWJlcjtcbiAgY29tcGxpYW5jZVJhdGU6IG51bWJlcjtcbiAgcmlza0Rpc3RyaWJ1dGlvbjogUmVjb3JkPHN0cmluZywgbnVtYmVyPjtcbiAgcmVndWxhdG9yeUZyYW1ld29ya3M6IHN0cmluZ1tdO1xuICB0cmVuZHM6IEFycmF5PHtcbiAgICBkYXRlOiBEYXRlO1xuICAgIGNvbXBsaWFuY2VSYXRlOiBudW1iZXI7XG4gICAgdmlvbGF0aW9uQ291bnQ6IG51bWJlcjtcbiAgfT47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VjdXJpdHlMb2dBbmFseXNpcyB7XG4gIHNlY3VyaXR5RXZlbnRzOiBudW1iZXI7XG4gIHRocmVhdExldmVsOiAnbG93JyB8ICdtZWRpdW0nIHwgJ2hpZ2gnIHwgJ2NyaXRpY2FsJztcbiAgc3VzcGljaW91c0FjdGl2aXRpZXM6IEFycmF5PHtcbiAgICB0eXBlOiBzdHJpbmc7XG4gICAgY291bnQ6IG51bWJlcjtcbiAgICBzZXZlcml0eTogc3RyaW5nO1xuICB9PjtcbiAgYWNjZXNzUGF0dGVybnM6IEFycmF5PHtcbiAgICB1c2VySWQ6IHN0cmluZztcbiAgICBhY2Nlc3NDb3VudDogbnVtYmVyO1xuICAgIHJpc2tTY29yZTogbnVtYmVyO1xuICB9PjtcbiAgcmVjb21tZW5kYXRpb25zOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGNsYXNzIExvZ0FuYWx5c2lzU2VydmljZSB7XG4gIHByaXZhdGUgY2xvdWRXYXRjaExvZ3M6IENsb3VkV2F0Y2hMb2dzO1xuICBwcml2YXRlIGNsb3VkV2F0Y2g6IENsb3VkV2F0Y2g7XG4gIHByaXZhdGUgbG9nR3JvdXBOYW1lOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5jbG91ZFdhdGNoTG9ncyA9IG5ldyBDbG91ZFdhdGNoTG9ncyh7XG4gICAgICByZWdpb246IHByb2Nlc3MuZW52LkFXU19SRUdJT04gfHwgJ3VzLWVhc3QtMSdcbiAgICB9KTtcbiAgICB0aGlzLmNsb3VkV2F0Y2ggPSBuZXcgQ2xvdWRXYXRjaCh7XG4gICAgICByZWdpb246IHByb2Nlc3MuZW52LkFXU19SRUdJT04gfHwgJ3VzLWVhc3QtMSdcbiAgICB9KTtcbiAgICB0aGlzLmxvZ0dyb3VwTmFtZSA9IHByb2Nlc3MuZW52LkxPR19HUk9VUF9OQU1FIHx8ICcvYXdzL2xhbWJkYS9pbnZlc3RtZW50LWFpLWFnZW50JztcbiAgfVxuXG4gIGFzeW5jIGFuYWx5emVMb2dzKHF1ZXJ5OiBMb2dBbmFseXNpc1F1ZXJ5KTogUHJvbWlzZTxMb2dBbmFseXNpc1Jlc3VsdD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzdGFydFRpbWUgPSBxdWVyeS5zdGFydFRpbWUgfHwgbmV3IERhdGUoRGF0ZS5ub3coKSAtIDI0ICogNjAgKiA2MCAqIDEwMDApOyAvLyBMYXN0IDI0IGhvdXJzXG4gICAgICBjb25zdCBlbmRUaW1lID0gcXVlcnkuZW5kVGltZSB8fCBuZXcgRGF0ZSgpO1xuXG4gICAgICAvLyBGZXRjaCBsb2dzIGZyb20gQ2xvdWRXYXRjaFxuICAgICAgY29uc3QgbG9ncyA9IGF3YWl0IHRoaXMuZmV0Y2hMb2dzKHtcbiAgICAgICAgLi4ucXVlcnksXG4gICAgICAgIHN0YXJ0VGltZSxcbiAgICAgICAgZW5kVGltZVxuICAgICAgfSk7XG5cbiAgICAgIC8vIFBhcnNlIGFuZCBhbmFseXplIGxvZ3NcbiAgICAgIGNvbnN0IGluc2lnaHRzID0gdGhpcy5wYXJzZUxvZ0luc2lnaHRzKGxvZ3MpO1xuICAgICAgY29uc3QgcGF0dGVybnMgPSBhd2FpdCB0aGlzLmlkZW50aWZ5UGF0dGVybnMoaW5zaWdodHMpO1xuICAgICAgY29uc3QgYW5vbWFsaWVzID0gYXdhaXQgdGhpcy5kZXRlY3RBbm9tYWxpZXMoaW5zaWdodHMpO1xuICAgICAgY29uc3QgbWV0cmljcyA9IHRoaXMuY2FsY3VsYXRlTWV0cmljcyhpbnNpZ2h0cyk7XG4gICAgICBjb25zdCByZWNvbW1lbmRhdGlvbnMgPSB0aGlzLmdlbmVyYXRlUmVjb21tZW5kYXRpb25zKHBhdHRlcm5zLCBhbm9tYWxpZXMsIG1ldHJpY3MpO1xuXG4gICAgICBjb25zdCByZXN1bHQ6IExvZ0FuYWx5c2lzUmVzdWx0ID0ge1xuICAgICAgICBpbnNpZ2h0cyxcbiAgICAgICAgcGF0dGVybnMsXG4gICAgICAgIGFub21hbGllcyxcbiAgICAgICAgbWV0cmljcyxcbiAgICAgICAgcmVjb21tZW5kYXRpb25zXG4gICAgICB9O1xuXG4gICAgICBhd2FpdCBsb2dnZXIuaW5mbygnTG9nQW5hbHlzaXNTZXJ2aWNlJywgJ2FuYWx5emVMb2dzJywgJ0xvZyBhbmFseXNpcyBjb21wbGV0ZWQnLCB7XG4gICAgICAgIHRvdGFsSW5zaWdodHM6IGluc2lnaHRzLmxlbmd0aCxcbiAgICAgICAgcGF0dGVybnNGb3VuZDogcGF0dGVybnMubGVuZ3RoLFxuICAgICAgICBhbm9tYWxpZXNEZXRlY3RlZDogYW5vbWFsaWVzLmxlbmd0aCxcbiAgICAgICAgdGltZVJhbmdlOiB7IHN0YXJ0VGltZSwgZW5kVGltZSB9XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgYXdhaXQgbG9nZ2VyLmVycm9yKCdMb2dBbmFseXNpc1NlcnZpY2UnLCAnYW5hbHl6ZUxvZ3MnLCAnRmFpbGVkIHRvIGFuYWx5emUgbG9ncycsIGVycm9yIGFzIEVycm9yLCB7IHF1ZXJ5IH0pO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgYW5hbHl6ZUNvbXBsaWFuY2VMb2dzKG9yZ2FuaXphdGlvbklkOiBzdHJpbmcsIHN0YXJ0RGF0ZT86IERhdGUsIGVuZERhdGU/OiBEYXRlKTogUHJvbWlzZTxDb21wbGlhbmNlTG9nQW5hbHlzaXM+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgYXVkaXRSZXBvcnQgPSBhd2FpdCBhdWRpdFNlcnZpY2UucXVlcnlBdWRpdEV2ZW50cyh7XG4gICAgICAgIG9yZ2FuaXphdGlvbklkLFxuICAgICAgICBzdGFydERhdGUsXG4gICAgICAgIGVuZERhdGUsXG4gICAgICAgIGxpbWl0OiAxMDAwXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgY29tcGxpYW5jZUV2ZW50cyA9IGF1ZGl0UmVwb3J0LmV2ZW50cy5maWx0ZXIoZSA9PiBcbiAgICAgICAgZS5ldmVudFR5cGUgPT09ICdjb21wbGlhbmNlX2NoZWNrJyB8fCBlLmNvbXBsaWFuY2VGbGFncz8ubGVuZ3RoXG4gICAgICApO1xuXG4gICAgICBjb25zdCB2aW9sYXRpb25zID0gY29tcGxpYW5jZUV2ZW50cy5maWx0ZXIoZSA9PiBcbiAgICAgICAgZS5vdXRjb21lID09PSAnZmFpbHVyZScgfHwgZS5jb21wbGlhbmNlRmxhZ3M/LnNvbWUoZmxhZyA9PiBmbGFnLmluY2x1ZGVzKCd2aW9sYXRpb24nKSlcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IGNvbXBsaWFuY2VSYXRlID0gY29tcGxpYW5jZUV2ZW50cy5sZW5ndGggPiAwID8gXG4gICAgICAgICgoY29tcGxpYW5jZUV2ZW50cy5sZW5ndGggLSB2aW9sYXRpb25zLmxlbmd0aCkgLyBjb21wbGlhbmNlRXZlbnRzLmxlbmd0aCkgKiAxMDAgOiAxMDA7XG5cbiAgICAgIGNvbnN0IHJpc2tEaXN0cmlidXRpb24gPSBhdWRpdFJlcG9ydC5zdW1tYXJ5LmV2ZW50c0J5Umlza0xldmVsO1xuXG4gICAgICBjb25zdCByZWd1bGF0b3J5RnJhbWV3b3JrcyA9IFsuLi5uZXcgU2V0KFxuICAgICAgICBjb21wbGlhbmNlRXZlbnRzXG4gICAgICAgICAgLm1hcChlID0+IGUuZGV0YWlscz8ucmVndWxhdG9yeUZyYW1ld29yaylcbiAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICApXTtcblxuICAgICAgY29uc3QgdHJlbmRzID0gdGhpcy5jYWxjdWxhdGVDb21wbGlhbmNlVHJlbmRzKGNvbXBsaWFuY2VFdmVudHMsIHN0YXJ0RGF0ZSwgZW5kRGF0ZSk7XG5cbiAgICAgIGNvbnN0IGFuYWx5c2lzOiBDb21wbGlhbmNlTG9nQW5hbHlzaXMgPSB7XG4gICAgICAgIGNvbXBsaWFuY2VFdmVudHM6IGNvbXBsaWFuY2VFdmVudHMubGVuZ3RoLFxuICAgICAgICB2aW9sYXRpb25zOiB2aW9sYXRpb25zLmxlbmd0aCxcbiAgICAgICAgY29tcGxpYW5jZVJhdGUsXG4gICAgICAgIHJpc2tEaXN0cmlidXRpb24sXG4gICAgICAgIHJlZ3VsYXRvcnlGcmFtZXdvcmtzLFxuICAgICAgICB0cmVuZHNcbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IGxvZ2dlci5pbmZvKCdMb2dBbmFseXNpc1NlcnZpY2UnLCAnYW5hbHl6ZUNvbXBsaWFuY2VMb2dzJywgJ0NvbXBsaWFuY2UgbG9nIGFuYWx5c2lzIGNvbXBsZXRlZCcsIHtcbiAgICAgICAgb3JnYW5pemF0aW9uSWQsXG4gICAgICAgIGNvbXBsaWFuY2VFdmVudHM6IGFuYWx5c2lzLmNvbXBsaWFuY2VFdmVudHMsXG4gICAgICAgIHZpb2xhdGlvbnM6IGFuYWx5c2lzLnZpb2xhdGlvbnMsXG4gICAgICAgIGNvbXBsaWFuY2VSYXRlOiBhbmFseXNpcy5jb21wbGlhbmNlUmF0ZVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBhbmFseXNpcztcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgYXdhaXQgbG9nZ2VyLmVycm9yKCdMb2dBbmFseXNpc1NlcnZpY2UnLCAnYW5hbHl6ZUNvbXBsaWFuY2VMb2dzJywgJ0ZhaWxlZCB0byBhbmFseXplIGNvbXBsaWFuY2UgbG9ncycsIGVycm9yIGFzIEVycm9yLCB7XG4gICAgICAgIG9yZ2FuaXphdGlvbklkXG4gICAgICB9KTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGFuYWx5emVTZWN1cml0eUxvZ3Mob3JnYW5pemF0aW9uSWQ6IHN0cmluZywgc3RhcnREYXRlPzogRGF0ZSwgZW5kRGF0ZT86IERhdGUpOiBQcm9taXNlPFNlY3VyaXR5TG9nQW5hbHlzaXM+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc2VjdXJpdHlFdmVudHMgPSBhd2FpdCBhdWRpdFNlcnZpY2UucXVlcnlBdWRpdEV2ZW50cyh7XG4gICAgICAgIG9yZ2FuaXphdGlvbklkLFxuICAgICAgICBldmVudFR5cGU6ICdzZWN1cml0eV9ldmVudCcsXG4gICAgICAgIHN0YXJ0RGF0ZSxcbiAgICAgICAgZW5kRGF0ZSxcbiAgICAgICAgbGltaXQ6IDEwMDBcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBhdXRoRXZlbnRzID0gYXdhaXQgYXVkaXRTZXJ2aWNlLnF1ZXJ5QXVkaXRFdmVudHMoe1xuICAgICAgICBvcmdhbml6YXRpb25JZCxcbiAgICAgICAgZXZlbnRUeXBlOiAndXNlcl9hdXRoZW50aWNhdGlvbicsXG4gICAgICAgIHN0YXJ0RGF0ZSxcbiAgICAgICAgZW5kRGF0ZSxcbiAgICAgICAgbGltaXQ6IDEwMDBcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBhbGxTZWN1cml0eUV2ZW50cyA9IFsuLi5zZWN1cml0eUV2ZW50cy5ldmVudHMsIC4uLmF1dGhFdmVudHMuZXZlbnRzXTtcblxuICAgICAgY29uc3QgdGhyZWF0TGV2ZWwgPSB0aGlzLmNhbGN1bGF0ZVRocmVhdExldmVsKGFsbFNlY3VyaXR5RXZlbnRzKTtcbiAgICAgIGNvbnN0IHN1c3BpY2lvdXNBY3Rpdml0aWVzID0gdGhpcy5pZGVudGlmeVN1c3BpY2lvdXNBY3Rpdml0aWVzKGFsbFNlY3VyaXR5RXZlbnRzKTtcbiAgICAgIGNvbnN0IGFjY2Vzc1BhdHRlcm5zID0gdGhpcy5hbmFseXplQWNjZXNzUGF0dGVybnMoYWxsU2VjdXJpdHlFdmVudHMpO1xuICAgICAgY29uc3QgcmVjb21tZW5kYXRpb25zID0gdGhpcy5nZW5lcmF0ZVNlY3VyaXR5UmVjb21tZW5kYXRpb25zKGFsbFNlY3VyaXR5RXZlbnRzLCBzdXNwaWNpb3VzQWN0aXZpdGllcyk7XG5cbiAgICAgIGNvbnN0IGFuYWx5c2lzOiBTZWN1cml0eUxvZ0FuYWx5c2lzID0ge1xuICAgICAgICBzZWN1cml0eUV2ZW50czogYWxsU2VjdXJpdHlFdmVudHMubGVuZ3RoLFxuICAgICAgICB0aHJlYXRMZXZlbCxcbiAgICAgICAgc3VzcGljaW91c0FjdGl2aXRpZXMsXG4gICAgICAgIGFjY2Vzc1BhdHRlcm5zLFxuICAgICAgICByZWNvbW1lbmRhdGlvbnNcbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IGxvZ2dlci5pbmZvKCdMb2dBbmFseXNpc1NlcnZpY2UnLCAnYW5hbHl6ZVNlY3VyaXR5TG9ncycsICdTZWN1cml0eSBsb2cgYW5hbHlzaXMgY29tcGxldGVkJywge1xuICAgICAgICBvcmdhbml6YXRpb25JZCxcbiAgICAgICAgc2VjdXJpdHlFdmVudHM6IGFuYWx5c2lzLnNlY3VyaXR5RXZlbnRzLFxuICAgICAgICB0aHJlYXRMZXZlbDogYW5hbHlzaXMudGhyZWF0TGV2ZWwsXG4gICAgICAgIHN1c3BpY2lvdXNBY3Rpdml0aWVzQ291bnQ6IGFuYWx5c2lzLnN1c3BpY2lvdXNBY3Rpdml0aWVzLmxlbmd0aFxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBhbmFseXNpcztcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgYXdhaXQgbG9nZ2VyLmVycm9yKCdMb2dBbmFseXNpc1NlcnZpY2UnLCAnYW5hbHl6ZVNlY3VyaXR5TG9ncycsICdGYWlsZWQgdG8gYW5hbHl6ZSBzZWN1cml0eSBsb2dzJywgZXJyb3IgYXMgRXJyb3IsIHtcbiAgICAgICAgb3JnYW5pemF0aW9uSWRcbiAgICAgIH0pO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgY3JlYXRlTG9nRGFzaGJvYXJkKG9yZ2FuaXphdGlvbklkOiBzdHJpbmcpOiBQcm9taXNlPHtcbiAgICBkYXNoYm9hcmRVcmw6IHN0cmluZztcbiAgICB3aWRnZXRzOiBBcnJheTx7XG4gICAgICB0eXBlOiBzdHJpbmc7XG4gICAgICB0aXRsZTogc3RyaW5nO1xuICAgICAgbWV0cmljczogc3RyaW5nW107XG4gICAgfT47XG4gIH0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZGFzaGJvYXJkTmFtZSA9IGBJbnZlc3RtZW50QUktJHtvcmdhbml6YXRpb25JZH0tTG9nc2A7XG4gICAgICBcbiAgICAgIGNvbnN0IHdpZGdldHMgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICB0eXBlOiAnbWV0cmljJyxcbiAgICAgICAgICB0aXRsZTogJ0Vycm9yIFJhdGUnLFxuICAgICAgICAgIG1ldHJpY3M6IFsnQVdTL0xhbWJkYScsICdFcnJvcnMnLCAnRnVuY3Rpb25OYW1lJywgJ2ludmVzdG1lbnQtYWktYWdlbnQnXVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogJ21ldHJpYycsXG4gICAgICAgICAgdGl0bGU6ICdSZXNwb25zZSBUaW1lJyxcbiAgICAgICAgICBtZXRyaWNzOiBbJ0FXUy9MYW1iZGEnLCAnRHVyYXRpb24nLCAnRnVuY3Rpb25OYW1lJywgJ2ludmVzdG1lbnQtYWktYWdlbnQnXVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogJ2xvZycsXG4gICAgICAgICAgdGl0bGU6ICdSZWNlbnQgRXJyb3JzJyxcbiAgICAgICAgICBtZXRyaWNzOiBbYCR7dGhpcy5sb2dHcm91cE5hbWV9YF1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6ICdtZXRyaWMnLFxuICAgICAgICAgIHRpdGxlOiAnQ29tcGxpYW5jZSBFdmVudHMnLFxuICAgICAgICAgIG1ldHJpY3M6IFsnSW52ZXN0bWVudEFJL0NvbXBsaWFuY2UnLCAnRXZlbnRzJywgJ09yZ2FuaXphdGlvbklkJywgb3JnYW5pemF0aW9uSWRdXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB0eXBlOiAnbWV0cmljJyxcbiAgICAgICAgICB0aXRsZTogJ1NlY3VyaXR5IEV2ZW50cycsXG4gICAgICAgICAgbWV0cmljczogWydJbnZlc3RtZW50QUkvU2VjdXJpdHknLCAnRXZlbnRzJywgJ09yZ2FuaXphdGlvbklkJywgb3JnYW5pemF0aW9uSWRdXG4gICAgICAgIH1cbiAgICAgIF07XG5cbiAgICAgIGNvbnN0IGRhc2hib2FyZEJvZHkgPSB7XG4gICAgICAgIHdpZGdldHM6IHdpZGdldHMubWFwKCh3aWRnZXQsIGluZGV4KSA9PiAoe1xuICAgICAgICAgIHR5cGU6IHdpZGdldC50eXBlLFxuICAgICAgICAgIHg6IChpbmRleCAlIDMpICogOCxcbiAgICAgICAgICB5OiBNYXRoLmZsb29yKGluZGV4IC8gMykgKiA2LFxuICAgICAgICAgIHdpZHRoOiA4LFxuICAgICAgICAgIGhlaWdodDogNixcbiAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICB0aXRsZTogd2lkZ2V0LnRpdGxlLFxuICAgICAgICAgICAgbWV0cmljczogW3dpZGdldC5tZXRyaWNzXSxcbiAgICAgICAgICAgIHBlcmlvZDogMzAwLFxuICAgICAgICAgICAgc3RhdDogJ0F2ZXJhZ2UnLFxuICAgICAgICAgICAgcmVnaW9uOiBwcm9jZXNzLmVudi5BV1NfUkVHSU9OIHx8ICd1cy1lYXN0LTEnXG4gICAgICAgICAgfVxuICAgICAgICB9KSlcbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IHRoaXMuY2xvdWRXYXRjaC5wdXREYXNoYm9hcmQoe1xuICAgICAgICBEYXNoYm9hcmROYW1lOiBkYXNoYm9hcmROYW1lLFxuICAgICAgICBEYXNoYm9hcmRCb2R5OiBKU09OLnN0cmluZ2lmeShkYXNoYm9hcmRCb2R5KVxuICAgICAgfSkucHJvbWlzZSgpO1xuXG4gICAgICBjb25zdCBkYXNoYm9hcmRVcmwgPSBgaHR0cHM6Ly9jb25zb2xlLmF3cy5hbWF6b24uY29tL2Nsb3Vkd2F0Y2gvaG9tZT9yZWdpb249JHtwcm9jZXNzLmVudi5BV1NfUkVHSU9OIHx8ICd1cy1lYXN0LTEnfSNkYXNoYm9hcmRzOm5hbWU9JHtkYXNoYm9hcmROYW1lfWA7XG5cbiAgICAgIGF3YWl0IGxvZ2dlci5pbmZvKCdMb2dBbmFseXNpc1NlcnZpY2UnLCAnY3JlYXRlTG9nRGFzaGJvYXJkJywgJ0xvZyBkYXNoYm9hcmQgY3JlYXRlZCcsIHtcbiAgICAgICAgb3JnYW5pemF0aW9uSWQsXG4gICAgICAgIGRhc2hib2FyZE5hbWUsXG4gICAgICAgIHdpZGdldENvdW50OiB3aWRnZXRzLmxlbmd0aFxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGRhc2hib2FyZFVybCxcbiAgICAgICAgd2lkZ2V0c1xuICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgYXdhaXQgbG9nZ2VyLmVycm9yKCdMb2dBbmFseXNpc1NlcnZpY2UnLCAnY3JlYXRlTG9nRGFzaGJvYXJkJywgJ0ZhaWxlZCB0byBjcmVhdGUgbG9nIGRhc2hib2FyZCcsIGVycm9yIGFzIEVycm9yLCB7XG4gICAgICAgIG9yZ2FuaXphdGlvbklkXG4gICAgICB9KTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZmV0Y2hMb2dzKHF1ZXJ5OiBMb2dBbmFseXNpc1F1ZXJ5KTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGNvbnN0IHBhcmFtczogQ2xvdWRXYXRjaExvZ3MuRmlsdGVyTG9nRXZlbnRzUmVxdWVzdCA9IHtcbiAgICAgIGxvZ0dyb3VwTmFtZTogcXVlcnkubG9nR3JvdXBOYW1lIHx8IHRoaXMubG9nR3JvdXBOYW1lLFxuICAgICAgc3RhcnRUaW1lOiBxdWVyeS5zdGFydFRpbWU/LmdldFRpbWUoKSxcbiAgICAgIGVuZFRpbWU6IHF1ZXJ5LmVuZFRpbWU/LmdldFRpbWUoKSxcbiAgICAgIGZpbHRlclBhdHRlcm46IHF1ZXJ5LmZpbHRlclBhdHRlcm4sXG4gICAgICBsaW1pdDogcXVlcnkubGltaXQgfHwgMTAwMFxuICAgIH07XG5cbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmNsb3VkV2F0Y2hMb2dzLmZpbHRlckxvZ0V2ZW50cyhwYXJhbXMpLnByb21pc2UoKTtcbiAgICByZXR1cm4gKHJlc3VsdC5ldmVudHMgfHwgW10pLm1hcChldmVudCA9PiBldmVudC5tZXNzYWdlIHx8ICcnKTtcbiAgfVxuXG4gIHByaXZhdGUgcGFyc2VMb2dJbnNpZ2h0cyhsb2dzOiBzdHJpbmdbXSk6IExvZ0luc2lnaHRbXSB7XG4gICAgcmV0dXJuIGxvZ3NcbiAgICAgIC5tYXAobG9nID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGxvZyk7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUocGFyc2VkLnRpbWVzdGFtcCksXG4gICAgICAgICAgICBtZXNzYWdlOiBwYXJzZWQubWVzc2FnZSxcbiAgICAgICAgICAgIGxldmVsOiBwYXJzZWQubGV2ZWwsXG4gICAgICAgICAgICBzZXJ2aWNlOiBwYXJzZWQuc2VydmljZSxcbiAgICAgICAgICAgIG9wZXJhdGlvbjogcGFyc2VkLm9wZXJhdGlvbixcbiAgICAgICAgICAgIG1ldGFkYXRhOiBwYXJzZWQubWV0YWRhdGFcbiAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAvLyBIYW5kbGUgbm9uLUpTT04gbG9nc1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgICBtZXNzYWdlOiBsb2csXG4gICAgICAgICAgICBsZXZlbDogJ0lORk8nLFxuICAgICAgICAgICAgc2VydmljZTogJ3Vua25vd24nLFxuICAgICAgICAgICAgb3BlcmF0aW9uOiAndW5rbm93bidcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmZpbHRlcihpbnNpZ2h0ID0+IGluc2lnaHQubWVzc2FnZSAmJiBpbnNpZ2h0LnNlcnZpY2UpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBpZGVudGlmeVBhdHRlcm5zKGluc2lnaHRzOiBMb2dJbnNpZ2h0W10pOiBQcm9taXNlPExvZ1BhdHRlcm5bXT4ge1xuICAgIGNvbnN0IHBhdHRlcm5zOiBNYXA8c3RyaW5nLCB7IGNvdW50OiBudW1iZXI7IGV4YW1wbGVzOiBzdHJpbmdbXSB9PiA9IG5ldyBNYXAoKTtcblxuICAgIGluc2lnaHRzLmZvckVhY2goaW5zaWdodCA9PiB7XG4gICAgICAvLyBQYXR0ZXJuIGRldGVjdGlvbiBsb2dpY1xuICAgICAgY29uc3QgZXJyb3JQYXR0ZXJuID0gdGhpcy5leHRyYWN0RXJyb3JQYXR0ZXJuKGluc2lnaHQpO1xuICAgICAgaWYgKGVycm9yUGF0dGVybikge1xuICAgICAgICBjb25zdCBleGlzdGluZyA9IHBhdHRlcm5zLmdldChlcnJvclBhdHRlcm4pIHx8IHsgY291bnQ6IDAsIGV4YW1wbGVzOiBbXSB9O1xuICAgICAgICBleGlzdGluZy5jb3VudCsrO1xuICAgICAgICBpZiAoZXhpc3RpbmcuZXhhbXBsZXMubGVuZ3RoIDwgMykge1xuICAgICAgICAgIGV4aXN0aW5nLmV4YW1wbGVzLnB1c2goaW5zaWdodC5tZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgICBwYXR0ZXJucy5zZXQoZXJyb3JQYXR0ZXJuLCBleGlzdGluZyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gQXJyYXkuZnJvbShwYXR0ZXJucy5lbnRyaWVzKCkpLm1hcCgoW3BhdHRlcm4sIGRhdGFdKSA9PiAoe1xuICAgICAgcGF0dGVybixcbiAgICAgIGZyZXF1ZW5jeTogZGF0YS5jb3VudCxcbiAgICAgIHNldmVyaXR5OiBkYXRhLmNvdW50ID4gMTAgPyAnaGlnaCcgOiBkYXRhLmNvdW50ID4gNSA/ICdtZWRpdW0nIDogJ2xvdycsXG4gICAgICBkZXNjcmlwdGlvbjogYFBhdHRlcm4gZGV0ZWN0ZWQ6ICR7cGF0dGVybn1gLFxuICAgICAgZXhhbXBsZXM6IGRhdGEuZXhhbXBsZXNcbiAgICB9KSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGRldGVjdEFub21hbGllcyhpbnNpZ2h0czogTG9nSW5zaWdodFtdKTogUHJvbWlzZTxMb2dBbm9tYWx5W10+IHtcbiAgICBjb25zdCBhbm9tYWxpZXM6IExvZ0Fub21hbHlbXSA9IFtdO1xuXG4gICAgLy8gRXJyb3Igc3Bpa2UgZGV0ZWN0aW9uXG4gICAgY29uc3QgZXJyb3JTcGlrZSA9IHRoaXMuZGV0ZWN0RXJyb3JTcGlrZShpbnNpZ2h0cyk7XG4gICAgaWYgKGVycm9yU3Bpa2UpIHtcbiAgICAgIGFub21hbGllcy5wdXNoKGVycm9yU3Bpa2UpO1xuICAgIH1cblxuICAgIC8vIFBlcmZvcm1hbmNlIGRlZ3JhZGF0aW9uIGRldGVjdGlvblxuICAgIGNvbnN0IHBlcmZEZWdyYWRhdGlvbiA9IHRoaXMuZGV0ZWN0UGVyZm9ybWFuY2VEZWdyYWRhdGlvbihpbnNpZ2h0cyk7XG4gICAgaWYgKHBlcmZEZWdyYWRhdGlvbikge1xuICAgICAgYW5vbWFsaWVzLnB1c2gocGVyZkRlZ3JhZGF0aW9uKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYW5vbWFsaWVzO1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVNZXRyaWNzKGluc2lnaHRzOiBMb2dJbnNpZ2h0W10pOiBMb2dNZXRyaWNzIHtcbiAgICBjb25zdCB0b3RhbExvZ3MgPSBpbnNpZ2h0cy5sZW5ndGg7XG4gICAgY29uc3QgZXJyb3JMb2dzID0gaW5zaWdodHMuZmlsdGVyKGkgPT4gaS5sZXZlbCA9PT0gJ0VSUk9SJyB8fCBpLmxldmVsID09PSAnQ1JJVElDQUwnKTtcbiAgICBjb25zdCBlcnJvclJhdGUgPSB0b3RhbExvZ3MgPiAwID8gKGVycm9yTG9ncy5sZW5ndGggLyB0b3RhbExvZ3MpICogMTAwIDogMDtcblxuICAgIGNvbnN0IHJlc3BvbnNlVGltZXMgPSBpbnNpZ2h0c1xuICAgICAgLmZpbHRlcihpID0+IGkubWV0YWRhdGE/LnJlc3BvbnNlVGltZSlcbiAgICAgIC5tYXAoaSA9PiBpLm1ldGFkYXRhIS5yZXNwb25zZVRpbWUpO1xuICAgIGNvbnN0IGF2ZXJhZ2VSZXNwb25zZVRpbWUgPSByZXNwb25zZVRpbWVzLmxlbmd0aCA+IDAgPyBcbiAgICAgIHJlc3BvbnNlVGltZXMucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMCkgLyByZXNwb25zZVRpbWVzLmxlbmd0aCA6IDA7XG5cbiAgICBjb25zdCBlcnJvckNvdW50czogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHt9O1xuICAgIGVycm9yTG9ncy5mb3JFYWNoKGxvZyA9PiB7XG4gICAgICBjb25zdCBlcnJvciA9IGxvZy5tZXRhZGF0YT8uZXJyb3I/Lm5hbWUgfHwgJ1Vua25vd24gRXJyb3InO1xuICAgICAgZXJyb3JDb3VudHNbZXJyb3JdID0gKGVycm9yQ291bnRzW2Vycm9yXSB8fCAwKSArIDE7XG4gICAgfSk7XG5cbiAgICBjb25zdCB0b3BFcnJvcnMgPSBPYmplY3QuZW50cmllcyhlcnJvckNvdW50cylcbiAgICAgIC5tYXAoKFtlcnJvciwgY291bnRdKSA9PiAoeyBlcnJvciwgY291bnQgfSkpXG4gICAgICAuc29ydCgoYSwgYikgPT4gYi5jb3VudCAtIGEuY291bnQpXG4gICAgICAuc2xpY2UoMCwgMTApO1xuXG4gICAgY29uc3Qgc2VydmljZURpc3RyaWJ1dGlvbjogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHt9O1xuICAgIGluc2lnaHRzLmZvckVhY2goaW5zaWdodCA9PiB7XG4gICAgICBzZXJ2aWNlRGlzdHJpYnV0aW9uW2luc2lnaHQuc2VydmljZV0gPSAoc2VydmljZURpc3RyaWJ1dGlvbltpbnNpZ2h0LnNlcnZpY2VdIHx8IDApICsgMTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHRpbWVTZXJpZXNEYXRhID0gdGhpcy5nZW5lcmF0ZVRpbWVTZXJpZXNEYXRhKGluc2lnaHRzKTtcblxuICAgIHJldHVybiB7XG4gICAgICB0b3RhbExvZ3MsXG4gICAgICBlcnJvclJhdGUsXG4gICAgICBhdmVyYWdlUmVzcG9uc2VUaW1lLFxuICAgICAgdG9wRXJyb3JzLFxuICAgICAgc2VydmljZURpc3RyaWJ1dGlvbixcbiAgICAgIHRpbWVTZXJpZXNEYXRhXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVSZWNvbW1lbmRhdGlvbnMocGF0dGVybnM6IExvZ1BhdHRlcm5bXSwgYW5vbWFsaWVzOiBMb2dBbm9tYWx5W10sIG1ldHJpY3M6IExvZ01ldHJpY3MpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgcmVjb21tZW5kYXRpb25zOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgaWYgKG1ldHJpY3MuZXJyb3JSYXRlID4gNSkge1xuICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goJ0hpZ2ggZXJyb3IgcmF0ZSBkZXRlY3RlZC4gQ29uc2lkZXIgaW52ZXN0aWdhdGluZyB0aGUgdG9wIGVycm9ycyBhbmQgaW1wbGVtZW50aW5nIGJldHRlciBlcnJvciBoYW5kbGluZy4nKTtcbiAgICB9XG5cbiAgICBpZiAobWV0cmljcy5hdmVyYWdlUmVzcG9uc2VUaW1lID4gNTAwMCkge1xuICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goJ0hpZ2ggYXZlcmFnZSByZXNwb25zZSB0aW1lIGRldGVjdGVkLiBDb25zaWRlciBvcHRpbWl6aW5nIHBlcmZvcm1hbmNlLWNyaXRpY2FsIG9wZXJhdGlvbnMuJyk7XG4gICAgfVxuXG4gICAgaWYgKGFub21hbGllcy5zb21lKGEgPT4gYS5zZXZlcml0eSA9PT0gJ2NyaXRpY2FsJykpIHtcbiAgICAgIHJlY29tbWVuZGF0aW9ucy5wdXNoKCdDcml0aWNhbCBhbm9tYWxpZXMgZGV0ZWN0ZWQuIEltbWVkaWF0ZSBpbnZlc3RpZ2F0aW9uIHJlY29tbWVuZGVkLicpO1xuICAgIH1cblxuICAgIGlmIChwYXR0ZXJucy5zb21lKHAgPT4gcC5zZXZlcml0eSA9PT0gJ2hpZ2gnKSkge1xuICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goJ0hpZ2gtZnJlcXVlbmN5IGVycm9yIHBhdHRlcm5zIGRldGVjdGVkLiBDb25zaWRlciBpbXBsZW1lbnRpbmcgcHJldmVudGl2ZSBtZWFzdXJlcy4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVjb21tZW5kYXRpb25zO1xuICB9XG5cbiAgcHJpdmF0ZSBleHRyYWN0RXJyb3JQYXR0ZXJuKGluc2lnaHQ6IExvZ0luc2lnaHQpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBpZiAoaW5zaWdodC5sZXZlbCA9PT0gJ0VSUk9SJyB8fCBpbnNpZ2h0LmxldmVsID09PSAnQ1JJVElDQUwnKSB7XG4gICAgICAvLyBFeHRyYWN0IGNvbW1vbiBlcnJvciBwYXR0ZXJuc1xuICAgICAgY29uc3QgbWVzc2FnZSA9IGluc2lnaHQubWVzc2FnZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgaWYgKG1lc3NhZ2UuaW5jbHVkZXMoJ3RpbWVvdXQnKSkgcmV0dXJuICd0aW1lb3V0X2Vycm9yJztcbiAgICAgIGlmIChtZXNzYWdlLmluY2x1ZGVzKCdjb25uZWN0aW9uJykpIHJldHVybiAnY29ubmVjdGlvbl9lcnJvcic7XG4gICAgICBpZiAobWVzc2FnZS5pbmNsdWRlcygnYXV0aGVudGljYXRpb24nKSkgcmV0dXJuICdhdXRoX2Vycm9yJztcbiAgICAgIGlmIChtZXNzYWdlLmluY2x1ZGVzKCdhdXRob3JpemF0aW9uJykpIHJldHVybiAnYXV0aHpfZXJyb3InO1xuICAgICAgaWYgKG1lc3NhZ2UuaW5jbHVkZXMoJ3ZhbGlkYXRpb24nKSkgcmV0dXJuICd2YWxpZGF0aW9uX2Vycm9yJztcbiAgICAgIHJldHVybiAnZ2VuZXJpY19lcnJvcic7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBkZXRlY3RFcnJvclNwaWtlKGluc2lnaHRzOiBMb2dJbnNpZ2h0W10pOiBMb2dBbm9tYWx5IHwgbnVsbCB7XG4gICAgY29uc3QgcmVjZW50RXJyb3JzID0gaW5zaWdodHMuZmlsdGVyKGkgPT4gXG4gICAgICAoaS5sZXZlbCA9PT0gJ0VSUk9SJyB8fCBpLmxldmVsID09PSAnQ1JJVElDQUwnKSAmJlxuICAgICAgaS50aW1lc3RhbXAgPiBuZXcgRGF0ZShEYXRlLm5vdygpIC0gNjAgKiA2MCAqIDEwMDApIC8vIExhc3QgaG91clxuICAgICk7XG5cbiAgICBpZiAocmVjZW50RXJyb3JzLmxlbmd0aCA+IDUwKSB7IC8vIFRocmVzaG9sZCBmb3IgZXJyb3Igc3Bpa2VcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgdHlwZTogJ2Vycm9yX3NwaWtlJyxcbiAgICAgICAgc2V2ZXJpdHk6ICdoaWdoJyxcbiAgICAgICAgZGVzY3JpcHRpb246IGBFcnJvciBzcGlrZSBkZXRlY3RlZDogJHtyZWNlbnRFcnJvcnMubGVuZ3RofSBlcnJvcnMgaW4gdGhlIGxhc3QgaG91cmAsXG4gICAgICAgIGFmZmVjdGVkU2VydmljZXM6IFsuLi5uZXcgU2V0KHJlY2VudEVycm9ycy5tYXAoZSA9PiBlLnNlcnZpY2UpKV0sXG4gICAgICAgIG1ldHJpY3M6IHsgZXJyb3JDb3VudDogcmVjZW50RXJyb3JzLmxlbmd0aCB9LFxuICAgICAgICBzdWdnZXN0ZWRBY3Rpb25zOiBbXG4gICAgICAgICAgJ0ludmVzdGlnYXRlIHJlY2VudCBkZXBsb3ltZW50cycsXG4gICAgICAgICAgJ0NoZWNrIGV4dGVybmFsIHNlcnZpY2UgZGVwZW5kZW5jaWVzJyxcbiAgICAgICAgICAnUmV2aWV3IGVycm9yIGxvZ3MgZm9yIGNvbW1vbiBwYXR0ZXJucydcbiAgICAgICAgXVxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgZGV0ZWN0UGVyZm9ybWFuY2VEZWdyYWRhdGlvbihpbnNpZ2h0czogTG9nSW5zaWdodFtdKTogTG9nQW5vbWFseSB8IG51bGwge1xuICAgIGNvbnN0IHJlY2VudFBlcmZvcm1hbmNlID0gaW5zaWdodHNcbiAgICAgIC5maWx0ZXIoaSA9PiBpLm1ldGFkYXRhPy5yZXNwb25zZVRpbWUgJiYgaS50aW1lc3RhbXAgPiBuZXcgRGF0ZShEYXRlLm5vdygpIC0gNjAgKiA2MCAqIDEwMDApKVxuICAgICAgLm1hcChpID0+IGkubWV0YWRhdGEhLnJlc3BvbnNlVGltZSk7XG5cbiAgICBpZiAocmVjZW50UGVyZm9ybWFuY2UubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgYXZnUmVzcG9uc2VUaW1lID0gcmVjZW50UGVyZm9ybWFuY2UucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMCkgLyByZWNlbnRQZXJmb3JtYW5jZS5sZW5ndGg7XG4gICAgICBcbiAgICAgIGlmIChhdmdSZXNwb25zZVRpbWUgPiAxMDAwMCkgeyAvLyAxMCBzZWNvbmRzIHRocmVzaG9sZFxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgICB0eXBlOiAncGVyZm9ybWFuY2VfZGVncmFkYXRpb24nLFxuICAgICAgICAgIHNldmVyaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogYFBlcmZvcm1hbmNlIGRlZ3JhZGF0aW9uIGRldGVjdGVkOiBhdmVyYWdlIHJlc3BvbnNlIHRpbWUgJHthdmdSZXNwb25zZVRpbWV9bXNgLFxuICAgICAgICAgIGFmZmVjdGVkU2VydmljZXM6IFsnYXBpJ10sXG4gICAgICAgICAgbWV0cmljczogeyBhdmVyYWdlUmVzcG9uc2VUaW1lOiBhdmdSZXNwb25zZVRpbWUgfSxcbiAgICAgICAgICBzdWdnZXN0ZWRBY3Rpb25zOiBbXG4gICAgICAgICAgICAnQ2hlY2sgc3lzdGVtIHJlc291cmNlcycsXG4gICAgICAgICAgICAnUmV2aWV3IGRhdGFiYXNlIHBlcmZvcm1hbmNlJyxcbiAgICAgICAgICAgICdBbmFseXplIHNsb3cgcXVlcmllcydcbiAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZUNvbXBsaWFuY2VUcmVuZHMoZXZlbnRzOiBBdWRpdEV2ZW50W10sIHN0YXJ0RGF0ZT86IERhdGUsIGVuZERhdGU/OiBEYXRlKTogQXJyYXk8e1xuICAgIGRhdGU6IERhdGU7XG4gICAgY29tcGxpYW5jZVJhdGU6IG51bWJlcjtcbiAgICB2aW9sYXRpb25Db3VudDogbnVtYmVyO1xuICB9PiB7XG4gICAgLy8gR3JvdXAgZXZlbnRzIGJ5IGRheSBhbmQgY2FsY3VsYXRlIGNvbXBsaWFuY2UgcmF0ZVxuICAgIGNvbnN0IGRhaWx5U3RhdHM6IFJlY29yZDxzdHJpbmcsIHsgdG90YWw6IG51bWJlcjsgdmlvbGF0aW9uczogbnVtYmVyIH0+ID0ge307XG5cbiAgICBldmVudHMuZm9yRWFjaChldmVudCA9PiB7XG4gICAgICBjb25zdCBkYXRlS2V5ID0gZXZlbnQudGltZXN0YW1wLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXTtcbiAgICAgIGlmICghZGFpbHlTdGF0c1tkYXRlS2V5XSkge1xuICAgICAgICBkYWlseVN0YXRzW2RhdGVLZXldID0geyB0b3RhbDogMCwgdmlvbGF0aW9uczogMCB9O1xuICAgICAgfVxuICAgICAgZGFpbHlTdGF0c1tkYXRlS2V5XS50b3RhbCsrO1xuICAgICAgaWYgKGV2ZW50Lm91dGNvbWUgPT09ICdmYWlsdXJlJykge1xuICAgICAgICBkYWlseVN0YXRzW2RhdGVLZXldLnZpb2xhdGlvbnMrKztcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBPYmplY3QuZW50cmllcyhkYWlseVN0YXRzKS5tYXAoKFtkYXRlS2V5LCBzdGF0c10pID0+ICh7XG4gICAgICBkYXRlOiBuZXcgRGF0ZShkYXRlS2V5KSxcbiAgICAgIGNvbXBsaWFuY2VSYXRlOiBzdGF0cy50b3RhbCA+IDAgPyAoKHN0YXRzLnRvdGFsIC0gc3RhdHMudmlvbGF0aW9ucykgLyBzdGF0cy50b3RhbCkgKiAxMDAgOiAxMDAsXG4gICAgICB2aW9sYXRpb25Db3VudDogc3RhdHMudmlvbGF0aW9uc1xuICAgIH0pKS5zb3J0KChhLCBiKSA9PiBhLmRhdGUuZ2V0VGltZSgpIC0gYi5kYXRlLmdldFRpbWUoKSk7XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZVRocmVhdExldmVsKGV2ZW50czogQXVkaXRFdmVudFtdKTogJ2xvdycgfCAnbWVkaXVtJyB8ICdoaWdoJyB8ICdjcml0aWNhbCcge1xuICAgIGNvbnN0IGNyaXRpY2FsRXZlbnRzID0gZXZlbnRzLmZpbHRlcihlID0+IGUucmlza0xldmVsID09PSAnY3JpdGljYWwnKS5sZW5ndGg7XG4gICAgY29uc3QgaGlnaFJpc2tFdmVudHMgPSBldmVudHMuZmlsdGVyKGUgPT4gZS5yaXNrTGV2ZWwgPT09ICdoaWdoJykubGVuZ3RoO1xuXG4gICAgaWYgKGNyaXRpY2FsRXZlbnRzID4gMCkgcmV0dXJuICdjcml0aWNhbCc7XG4gICAgaWYgKGhpZ2hSaXNrRXZlbnRzID4gNSkgcmV0dXJuICdoaWdoJztcbiAgICBpZiAoaGlnaFJpc2tFdmVudHMgPiAwIHx8IGV2ZW50cy5maWx0ZXIoZSA9PiBlLnJpc2tMZXZlbCA9PT0gJ21lZGl1bScpLmxlbmd0aCA+IDEwKSByZXR1cm4gJ21lZGl1bSc7XG4gICAgcmV0dXJuICdsb3cnO1xuICB9XG5cbiAgcHJpdmF0ZSBpZGVudGlmeVN1c3BpY2lvdXNBY3Rpdml0aWVzKGV2ZW50czogQXVkaXRFdmVudFtdKTogQXJyYXk8e1xuICAgIHR5cGU6IHN0cmluZztcbiAgICBjb3VudDogbnVtYmVyO1xuICAgIHNldmVyaXR5OiBzdHJpbmc7XG4gIH0+IHtcbiAgICBjb25zdCBhY3Rpdml0aWVzOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XG5cbiAgICBldmVudHMuZm9yRWFjaChldmVudCA9PiB7XG4gICAgICBpZiAoZXZlbnQub3V0Y29tZSA9PT0gJ2ZhaWx1cmUnKSB7XG4gICAgICAgIGNvbnN0IGFjdGl2aXR5VHlwZSA9IGAke2V2ZW50LmV2ZW50VHlwZX1fZmFpbHVyZWA7XG4gICAgICAgIGFjdGl2aXRpZXNbYWN0aXZpdHlUeXBlXSA9IChhY3Rpdml0aWVzW2FjdGl2aXR5VHlwZV0gfHwgMCkgKyAxO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIE9iamVjdC5lbnRyaWVzKGFjdGl2aXRpZXMpLm1hcCgoW3R5cGUsIGNvdW50XSkgPT4gKHtcbiAgICAgIHR5cGUsXG4gICAgICBjb3VudCxcbiAgICAgIHNldmVyaXR5OiBjb3VudCA+IDEwID8gJ2hpZ2gnIDogY291bnQgPiA1ID8gJ21lZGl1bScgOiAnbG93J1xuICAgIH0pKTtcbiAgfVxuXG4gIHByaXZhdGUgYW5hbHl6ZUFjY2Vzc1BhdHRlcm5zKGV2ZW50czogQXVkaXRFdmVudFtdKTogQXJyYXk8e1xuICAgIHVzZXJJZDogc3RyaW5nO1xuICAgIGFjY2Vzc0NvdW50OiBudW1iZXI7XG4gICAgcmlza1Njb3JlOiBudW1iZXI7XG4gIH0+IHtcbiAgICBjb25zdCB1c2VyQWNjZXNzOiBSZWNvcmQ8c3RyaW5nLCB7IGNvdW50OiBudW1iZXI7IGZhaWx1cmVzOiBudW1iZXI7IGhpZ2hSaXNrOiBudW1iZXIgfT4gPSB7fTtcblxuICAgIGV2ZW50cy5mb3JFYWNoKGV2ZW50ID0+IHtcbiAgICAgIGlmICghdXNlckFjY2Vzc1tldmVudC51c2VySWRdKSB7XG4gICAgICAgIHVzZXJBY2Nlc3NbZXZlbnQudXNlcklkXSA9IHsgY291bnQ6IDAsIGZhaWx1cmVzOiAwLCBoaWdoUmlzazogMCB9O1xuICAgICAgfVxuICAgICAgdXNlckFjY2Vzc1tldmVudC51c2VySWRdLmNvdW50Kys7XG4gICAgICBpZiAoZXZlbnQub3V0Y29tZSA9PT0gJ2ZhaWx1cmUnKSB7XG4gICAgICAgIHVzZXJBY2Nlc3NbZXZlbnQudXNlcklkXS5mYWlsdXJlcysrO1xuICAgICAgfVxuICAgICAgaWYgKGV2ZW50LnJpc2tMZXZlbCA9PT0gJ2hpZ2gnIHx8IGV2ZW50LnJpc2tMZXZlbCA9PT0gJ2NyaXRpY2FsJykge1xuICAgICAgICB1c2VyQWNjZXNzW2V2ZW50LnVzZXJJZF0uaGlnaFJpc2srKztcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBPYmplY3QuZW50cmllcyh1c2VyQWNjZXNzKS5tYXAoKFt1c2VySWQsIHN0YXRzXSkgPT4gKHtcbiAgICAgIHVzZXJJZCxcbiAgICAgIGFjY2Vzc0NvdW50OiBzdGF0cy5jb3VudCxcbiAgICAgIHJpc2tTY29yZTogKHN0YXRzLmZhaWx1cmVzICogMiArIHN0YXRzLmhpZ2hSaXNrICogMykgLyBzdGF0cy5jb3VudFxuICAgIH0pKS5zb3J0KChhLCBiKSA9PiBiLnJpc2tTY29yZSAtIGEucmlza1Njb3JlKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVTZWN1cml0eVJlY29tbWVuZGF0aW9ucyhldmVudHM6IEF1ZGl0RXZlbnRbXSwgc3VzcGljaW91c0FjdGl2aXRpZXM6IEFycmF5PHsgdHlwZTogc3RyaW5nOyBjb3VudDogbnVtYmVyOyBzZXZlcml0eTogc3RyaW5nIH0+KTogc3RyaW5nW10ge1xuICAgIGNvbnN0IHJlY29tbWVuZGF0aW9uczogc3RyaW5nW10gPSBbXTtcblxuICAgIGNvbnN0IGZhaWxlZEF1dGggPSBldmVudHMuZmlsdGVyKGUgPT4gZS5ldmVudFR5cGUgPT09ICd1c2VyX2F1dGhlbnRpY2F0aW9uJyAmJiBlLm91dGNvbWUgPT09ICdmYWlsdXJlJykubGVuZ3RoO1xuICAgIGlmIChmYWlsZWRBdXRoID4gMTApIHtcbiAgICAgIHJlY29tbWVuZGF0aW9ucy5wdXNoKCdIaWdoIG51bWJlciBvZiBhdXRoZW50aWNhdGlvbiBmYWlsdXJlcyBkZXRlY3RlZC4gQ29uc2lkZXIgaW1wbGVtZW50aW5nIGFjY291bnQgbG9ja291dCBwb2xpY2llcy4nKTtcbiAgICB9XG5cbiAgICBjb25zdCBoaWdoUmlza0V2ZW50cyA9IGV2ZW50cy5maWx0ZXIoZSA9PiBlLnJpc2tMZXZlbCA9PT0gJ2hpZ2gnIHx8IGUucmlza0xldmVsID09PSAnY3JpdGljYWwnKS5sZW5ndGg7XG4gICAgaWYgKGhpZ2hSaXNrRXZlbnRzID4gMCkge1xuICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goJ0hpZ2gtcmlzayBzZWN1cml0eSBldmVudHMgZGV0ZWN0ZWQuIFJldmlldyBhbmQgaW52ZXN0aWdhdGUgaW1tZWRpYXRlbHkuJyk7XG4gICAgfVxuXG4gICAgaWYgKHN1c3BpY2lvdXNBY3Rpdml0aWVzLnNvbWUoYSA9PiBhLnNldmVyaXR5ID09PSAnaGlnaCcpKSB7XG4gICAgICByZWNvbW1lbmRhdGlvbnMucHVzaCgnU3VzcGljaW91cyBhY3Rpdml0eSBwYXR0ZXJucyBkZXRlY3RlZC4gQ29uc2lkZXIgZW5oYW5jZWQgbW9uaXRvcmluZyBhbmQgYWxlcnRpbmcuJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlY29tbWVuZGF0aW9ucztcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVUaW1lU2VyaWVzRGF0YShpbnNpZ2h0czogTG9nSW5zaWdodFtdKTogQXJyYXk8e1xuICAgIHRpbWVzdGFtcDogRGF0ZTtcbiAgICBsb2dDb3VudDogbnVtYmVyO1xuICAgIGVycm9yQ291bnQ6IG51bWJlcjtcbiAgICBhdmdSZXNwb25zZVRpbWU6IG51bWJlcjtcbiAgfT4ge1xuICAgIC8vIEdyb3VwIGJ5IGhvdXJcbiAgICBjb25zdCBob3VybHlEYXRhOiBSZWNvcmQ8c3RyaW5nLCB7IGxvZ3M6IExvZ0luc2lnaHRbXTsgZXJyb3JzOiBMb2dJbnNpZ2h0W107IHJlc3BvbnNlVGltZXM6IG51bWJlcltdIH0+ID0ge307XG5cbiAgICBpbnNpZ2h0cy5mb3JFYWNoKGluc2lnaHQgPT4ge1xuICAgICAgY29uc3QgaG91cktleSA9IG5ldyBEYXRlKGluc2lnaHQudGltZXN0YW1wLmdldEZ1bGxZZWFyKCksIGluc2lnaHQudGltZXN0YW1wLmdldE1vbnRoKCksIGluc2lnaHQudGltZXN0YW1wLmdldERhdGUoKSwgaW5zaWdodC50aW1lc3RhbXAuZ2V0SG91cnMoKSkudG9JU09TdHJpbmcoKTtcbiAgICAgIFxuICAgICAgaWYgKCFob3VybHlEYXRhW2hvdXJLZXldKSB7XG4gICAgICAgIGhvdXJseURhdGFbaG91cktleV0gPSB7IGxvZ3M6IFtdLCBlcnJvcnM6IFtdLCByZXNwb25zZVRpbWVzOiBbXSB9O1xuICAgICAgfVxuICAgICAgXG4gICAgICBob3VybHlEYXRhW2hvdXJLZXldLmxvZ3MucHVzaChpbnNpZ2h0KTtcbiAgICAgIFxuICAgICAgaWYgKGluc2lnaHQubGV2ZWwgPT09ICdFUlJPUicgfHwgaW5zaWdodC5sZXZlbCA9PT0gJ0NSSVRJQ0FMJykge1xuICAgICAgICBob3VybHlEYXRhW2hvdXJLZXldLmVycm9ycy5wdXNoKGluc2lnaHQpO1xuICAgICAgfVxuICAgICAgXG4gICAgICBpZiAoaW5zaWdodC5tZXRhZGF0YT8ucmVzcG9uc2VUaW1lKSB7XG4gICAgICAgIGhvdXJseURhdGFbaG91cktleV0ucmVzcG9uc2VUaW1lcy5wdXNoKGluc2lnaHQubWV0YWRhdGEucmVzcG9uc2VUaW1lKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBPYmplY3QuZW50cmllcyhob3VybHlEYXRhKS5tYXAoKFtob3VyS2V5LCBkYXRhXSkgPT4gKHtcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoaG91cktleSksXG4gICAgICBsb2dDb3VudDogZGF0YS5sb2dzLmxlbmd0aCxcbiAgICAgIGVycm9yQ291bnQ6IGRhdGEuZXJyb3JzLmxlbmd0aCxcbiAgICAgIGF2Z1Jlc3BvbnNlVGltZTogZGF0YS5yZXNwb25zZVRpbWVzLmxlbmd0aCA+IDAgPyBcbiAgICAgICAgZGF0YS5yZXNwb25zZVRpbWVzLnJlZHVjZSgoYSwgYikgPT4gYSArIGIsIDApIC8gZGF0YS5yZXNwb25zZVRpbWVzLmxlbmd0aCA6IDBcbiAgICB9KSkuc29ydCgoYSwgYikgPT4gYS50aW1lc3RhbXAuZ2V0VGltZSgpIC0gYi50aW1lc3RhbXAuZ2V0VGltZSgpKTtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgbG9nQW5hbHlzaXNTZXJ2aWNlID0gbmV3IExvZ0FuYWx5c2lzU2VydmljZSgpOyJdfQ==