export interface AuditEvent {
    eventId: string;
    timestamp: Date;
    userId: string;
    userRole: string;
    organizationId: string;
    eventType: AuditEventType;
    resource: string;
    action: string;
    outcome: 'success' | 'failure' | 'partial';
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    requestId?: string;
    complianceFlags?: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
}
export type AuditEventType = 'user_authentication' | 'user_authorization' | 'data_access' | 'data_modification' | 'data_export' | 'investment_idea_generation' | 'investment_idea_access' | 'compliance_check' | 'model_execution' | 'configuration_change' | 'system_error' | 'security_event' | 'regulatory_action';
export interface AuditQuery {
    userId?: string;
    organizationId?: string;
    eventType?: AuditEventType;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    riskLevel?: string;
    outcome?: string;
    limit?: number;
    nextToken?: string;
}
export interface AuditReport {
    events: AuditEvent[];
    totalCount: number;
    nextToken?: string;
    summary: {
        eventsByType: Record<AuditEventType, number>;
        eventsByOutcome: Record<string, number>;
        eventsByRiskLevel: Record<string, number>;
        uniqueUsers: number;
        timeRange: {
            start: Date;
            end: Date;
        };
    };
}
export interface ComplianceAuditTrail {
    auditId: string;
    timestamp: Date;
    complianceRule: string;
    regulatoryFramework: string;
    checkResult: 'compliant' | 'non_compliant' | 'warning';
    details: {
        ruleName: string;
        ruleVersion: string;
        checkCriteria: string[];
        findings: string[];
        remediation?: string[];
    };
    affectedResources: string[];
    userId: string;
    organizationId: string;
}
export declare class AuditService {
    private dynamodb;
    private auditTableName;
    private complianceTableName;
    constructor();
    recordAuditEvent(event: Omit<AuditEvent, 'eventId' | 'timestamp'>): Promise<string>;
    recordComplianceAudit(audit: Omit<ComplianceAuditTrail, 'auditId' | 'timestamp'>): Promise<string>;
    queryAuditEvents(query: AuditQuery): Promise<AuditReport>;
    generateComplianceReport(organizationId: string, regulatoryFramework?: string, startDate?: Date, endDate?: Date): Promise<{
        audits: ComplianceAuditTrail[];
        summary: {
            totalAudits: number;
            compliantCount: number;
            nonCompliantCount: number;
            warningCount: number;
            complianceRate: number;
            topViolations: Array<{
                rule: string;
                count: number;
            }>;
        };
    }>;
    private generateEventId;
    private generateAuditSummary;
    private getTopViolations;
    private handleHighRiskEvent;
}
export declare const auditService: AuditService;
