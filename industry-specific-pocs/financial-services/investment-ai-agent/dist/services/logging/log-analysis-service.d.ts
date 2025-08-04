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
    topErrors: Array<{
        error: string;
        count: number;
    }>;
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
export declare class LogAnalysisService {
    private cloudWatchLogs;
    private cloudWatch;
    private logGroupName;
    constructor();
    analyzeLogs(query: LogAnalysisQuery): Promise<LogAnalysisResult>;
    analyzeComplianceLogs(organizationId: string, startDate?: Date, endDate?: Date): Promise<ComplianceLogAnalysis>;
    analyzeSecurityLogs(organizationId: string, startDate?: Date, endDate?: Date): Promise<SecurityLogAnalysis>;
    createLogDashboard(organizationId: string): Promise<{
        dashboardUrl: string;
        widgets: Array<{
            type: string;
            title: string;
            metrics: string[];
        }>;
    }>;
    private fetchLogs;
    private parseLogInsights;
    private identifyPatterns;
    private detectAnomalies;
    private calculateMetrics;
    private generateRecommendations;
    private extractErrorPattern;
    private detectErrorSpike;
    private detectPerformanceDegradation;
    private calculateComplianceTrends;
    private calculateThreatLevel;
    private identifySuspiciousActivities;
    private analyzeAccessPatterns;
    private generateSecurityRecommendations;
    private generateTimeSeriesData;
}
export declare const logAnalysisService: LogAnalysisService;
