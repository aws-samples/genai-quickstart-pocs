import { DynamoDB } from 'aws-sdk';
import { logger } from './logger';

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

export type AuditEventType = 
  | 'user_authentication'
  | 'user_authorization'
  | 'data_access'
  | 'data_modification'
  | 'data_export'
  | 'investment_idea_generation'
  | 'investment_idea_access'
  | 'compliance_check'
  | 'model_execution'
  | 'configuration_change'
  | 'system_error'
  | 'security_event'
  | 'regulatory_action';

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

export class AuditService {
  private dynamodb: DynamoDB.DocumentClient;
  private auditTableName: string;
  private complianceTableName: string;

  constructor() {
    this.dynamodb = new DynamoDB.DocumentClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.auditTableName = process.env.AUDIT_TABLE_NAME || 'investment-ai-audit-trail';
    this.complianceTableName = process.env.COMPLIANCE_TABLE_NAME || 'investment-ai-compliance-audit';
  }

  async recordAuditEvent(event: Omit<AuditEvent, 'eventId' | 'timestamp'>): Promise<string> {
    const auditEvent: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date(),
      ...event
    };

    try {
      // Store in DynamoDB
      await this.dynamodb.put({
        TableName: this.auditTableName,
        Item: {
          ...auditEvent,
          ttl: Math.floor((Date.now() + (365 * 24 * 60 * 60 * 1000)) / 1000), // 1 year retention
          gsi1pk: `${auditEvent.organizationId}#${auditEvent.eventType}`,
          gsi1sk: auditEvent.timestamp.toISOString(),
          gsi2pk: `${auditEvent.userId}#${auditEvent.eventType}`,
          gsi2sk: auditEvent.timestamp.toISOString()
        }
      }).promise();

      // Log the audit event
      await logger.info('AuditService', 'recordAuditEvent', 'Audit event recorded', {
        eventId: auditEvent.eventId,
        eventType: auditEvent.eventType,
        userId: auditEvent.userId,
        resource: auditEvent.resource,
        outcome: auditEvent.outcome
      });

      // Check for high-risk events and alert
      if (auditEvent.riskLevel === 'critical' || auditEvent.riskLevel === 'high') {
        await this.handleHighRiskEvent(auditEvent);
      }

      return auditEvent.eventId;
    } catch (error) {
      await logger.error('AuditService', 'recordAuditEvent', 'Failed to record audit event', error as Error, {
        eventType: event.eventType,
        userId: event.userId,
        resource: event.resource
      });
      throw error;
    }
  }

  async recordComplianceAudit(audit: Omit<ComplianceAuditTrail, 'auditId' | 'timestamp'>): Promise<string> {
    const complianceAudit: ComplianceAuditTrail = {
      auditId: this.generateEventId(),
      timestamp: new Date(),
      ...audit
    };

    try {
      await this.dynamodb.put({
        TableName: this.complianceTableName,
        Item: {
          ...complianceAudit,
          ttl: Math.floor((Date.now() + (7 * 365 * 24 * 60 * 60 * 1000)) / 1000), // 7 years retention for compliance
          gsi1pk: `${complianceAudit.organizationId}#${complianceAudit.regulatoryFramework}`,
          gsi1sk: complianceAudit.timestamp.toISOString(),
          gsi2pk: `${complianceAudit.complianceRule}#${complianceAudit.checkResult}`,
          gsi2sk: complianceAudit.timestamp.toISOString()
        }
      }).promise();

      await logger.info('AuditService', 'recordComplianceAudit', 'Compliance audit recorded', {
        auditId: complianceAudit.auditId,
        complianceRule: complianceAudit.complianceRule,
        checkResult: complianceAudit.checkResult,
        organizationId: complianceAudit.organizationId
      });

      return complianceAudit.auditId;
    } catch (error) {
      await logger.error('AuditService', 'recordComplianceAudit', 'Failed to record compliance audit', error as Error, {
        complianceRule: audit.complianceRule,
        organizationId: audit.organizationId
      });
      throw error;
    }
  }

  async queryAuditEvents(query: AuditQuery): Promise<AuditReport> {
    try {
      let params: DynamoDB.DocumentClient.QueryInput | DynamoDB.DocumentClient.ScanInput;
      
      if (query.organizationId && query.eventType) {
        // Use GSI1 for organization + event type queries
        params = {
          TableName: this.auditTableName,
          IndexName: 'GSI1',
          KeyConditionExpression: 'gsi1pk = :pk',
          ExpressionAttributeValues: {
            ':pk': `${query.organizationId}#${query.eventType}`
          },
          Limit: query.limit || 100,
          ExclusiveStartKey: query.nextToken ? JSON.parse(Buffer.from(query.nextToken, 'base64').toString()) : undefined
        };
      } else if (query.userId && query.eventType) {
        // Use GSI2 for user + event type queries
        params = {
          TableName: this.auditTableName,
          IndexName: 'GSI2',
          KeyConditionExpression: 'gsi2pk = :pk',
          ExpressionAttributeValues: {
            ':pk': `${query.userId}#${query.eventType}`
          },
          Limit: query.limit || 100,
          ExclusiveStartKey: query.nextToken ? JSON.parse(Buffer.from(query.nextToken, 'base64').toString()) : undefined
        };
      } else {
        // Fallback to scan with filters
        params = {
          TableName: this.auditTableName,
          Limit: query.limit || 100,
          ExclusiveStartKey: query.nextToken ? JSON.parse(Buffer.from(query.nextToken, 'base64').toString()) : undefined
        };

        // Add filter expressions
        const filterExpressions: string[] = [];
        const expressionAttributeValues: Record<string, any> = {};

        if (query.userId) {
          filterExpressions.push('userId = :userId');
          expressionAttributeValues[':userId'] = query.userId;
        }

        if (query.organizationId) {
          filterExpressions.push('organizationId = :orgId');
          expressionAttributeValues[':orgId'] = query.organizationId;
        }

        if (query.eventType) {
          filterExpressions.push('eventType = :eventType');
          expressionAttributeValues[':eventType'] = query.eventType;
        }

        if (query.outcome) {
          filterExpressions.push('outcome = :outcome');
          expressionAttributeValues[':outcome'] = query.outcome;
        }

        if (query.riskLevel) {
          filterExpressions.push('riskLevel = :riskLevel');
          expressionAttributeValues[':riskLevel'] = query.riskLevel;
        }

        if (filterExpressions.length > 0) {
          params.FilterExpression = filterExpressions.join(' AND ');
          params.ExpressionAttributeValues = expressionAttributeValues;
        }
      }

      const result = await ('KeyConditionExpression' in params ? 
        this.dynamodb.query(params as DynamoDB.DocumentClient.QueryInput) : 
        this.dynamodb.scan(params as DynamoDB.DocumentClient.ScanInput)
      ).promise();

      const events = (result.Items || []) as AuditEvent[];
      
      // Filter by date range if specified
      const filteredEvents = events.filter(event => {
        if (query.startDate && event.timestamp < query.startDate) return false;
        if (query.endDate && event.timestamp > query.endDate) return false;
        return true;
      });

      const report: AuditReport = {
        events: filteredEvents,
        totalCount: result.Count || 0,
        nextToken: result.LastEvaluatedKey ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : undefined,
        summary: this.generateAuditSummary(filteredEvents)
      };

      await logger.info('AuditService', 'queryAuditEvents', 'Audit events queried', {
        queryParams: query,
        resultCount: filteredEvents.length
      });

      return report;
    } catch (error) {
      await logger.error('AuditService', 'queryAuditEvents', 'Failed to query audit events', error as Error, { query });
      throw error;
    }
  }

  async generateComplianceReport(organizationId: string, regulatoryFramework?: string, startDate?: Date, endDate?: Date): Promise<{
    audits: ComplianceAuditTrail[];
    summary: {
      totalAudits: number;
      compliantCount: number;
      nonCompliantCount: number;
      warningCount: number;
      complianceRate: number;
      topViolations: Array<{ rule: string; count: number }>;
    };
  }> {
    try {
      let params: DynamoDB.DocumentClient.QueryInput;

      if (regulatoryFramework) {
        params = {
          TableName: this.complianceTableName,
          IndexName: 'GSI1',
          KeyConditionExpression: 'gsi1pk = :pk',
          ExpressionAttributeValues: {
            ':pk': `${organizationId}#${regulatoryFramework}`
          }
        };
      } else {
        params = {
          TableName: this.complianceTableName,
          FilterExpression: 'organizationId = :orgId',
          ExpressionAttributeValues: {
            ':orgId': organizationId
          }
        };
      }

      const result = await ('KeyConditionExpression' in params ? 
        this.dynamodb.query(params) : 
        this.dynamodb.scan(params)
      ).promise();

      let audits = (result.Items || []) as ComplianceAuditTrail[];

      // Filter by date range
      if (startDate || endDate) {
        audits = audits.filter(audit => {
          if (startDate && audit.timestamp < startDate) return false;
          if (endDate && audit.timestamp > endDate) return false;
          return true;
        });
      }

      const summary = {
        totalAudits: audits.length,
        compliantCount: audits.filter(a => a.checkResult === 'compliant').length,
        nonCompliantCount: audits.filter(a => a.checkResult === 'non_compliant').length,
        warningCount: audits.filter(a => a.checkResult === 'warning').length,
        complianceRate: audits.length > 0 ? (audits.filter(a => a.checkResult === 'compliant').length / audits.length) * 100 : 0,
        topViolations: this.getTopViolations(audits.filter(a => a.checkResult === 'non_compliant'))
      };

      await logger.info('AuditService', 'generateComplianceReport', 'Compliance report generated', {
        organizationId,
        regulatoryFramework,
        totalAudits: summary.totalAudits,
        complianceRate: summary.complianceRate
      });

      return { audits, summary };
    } catch (error) {
      await logger.error('AuditService', 'generateComplianceReport', 'Failed to generate compliance report', error as Error, {
        organizationId,
        regulatoryFramework
      });
      throw error;
    }
  }

  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAuditSummary(events: AuditEvent[]): AuditReport['summary'] {
    const eventsByType = {} as Record<AuditEventType, number>;
    const eventsByOutcome = {} as Record<string, number>;
    const eventsByRiskLevel = {} as Record<string, number>;
    const uniqueUsers = new Set<string>();

    let minDate = new Date();
    let maxDate = new Date(0);

    events.forEach(event => {
      // Count by type
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      
      // Count by outcome
      eventsByOutcome[event.outcome] = (eventsByOutcome[event.outcome] || 0) + 1;
      
      // Count by risk level
      eventsByRiskLevel[event.riskLevel] = (eventsByRiskLevel[event.riskLevel] || 0) + 1;
      
      // Track unique users
      uniqueUsers.add(event.userId);
      
      // Track date range
      if (event.timestamp < minDate) minDate = event.timestamp;
      if (event.timestamp > maxDate) maxDate = event.timestamp;
    });

    return {
      eventsByType,
      eventsByOutcome,
      eventsByRiskLevel,
      uniqueUsers: uniqueUsers.size,
      timeRange: {
        start: events.length > 0 ? minDate : new Date(),
        end: events.length > 0 ? maxDate : new Date()
      }
    };
  }

  private getTopViolations(nonCompliantAudits: ComplianceAuditTrail[]): Array<{ rule: string; count: number }> {
    const violations = {} as Record<string, number>;
    
    nonCompliantAudits.forEach(audit => {
      violations[audit.complianceRule] = (violations[audit.complianceRule] || 0) + 1;
    });

    return Object.entries(violations)
      .map(([rule, count]) => ({ rule, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private async handleHighRiskEvent(event: AuditEvent): Promise<void> {
    await logger.critical('AuditService', 'handleHighRiskEvent', 'High-risk audit event detected', undefined, {
      eventId: event.eventId,
      eventType: event.eventType,
      userId: event.userId,
      resource: event.resource,
      riskLevel: event.riskLevel,
      details: event.details
    });

    // Additional alerting logic could be added here
    // For example, sending notifications to security teams
  }
}

export const auditService = new AuditService();