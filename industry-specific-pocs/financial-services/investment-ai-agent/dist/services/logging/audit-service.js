"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = exports.AuditService = void 0;
const aws_sdk_1 = require("aws-sdk");
const logger_1 = require("./logger");
class AuditService {
    constructor() {
        this.dynamodb = new aws_sdk_1.DynamoDB.DocumentClient({
            region: process.env.AWS_REGION || 'us-east-1'
        });
        this.auditTableName = process.env.AUDIT_TABLE_NAME || 'investment-ai-audit-trail';
        this.complianceTableName = process.env.COMPLIANCE_TABLE_NAME || 'investment-ai-compliance-audit';
    }
    async recordAuditEvent(event) {
        const auditEvent = {
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
                    ttl: Math.floor((Date.now() + (365 * 24 * 60 * 60 * 1000)) / 1000),
                    gsi1pk: `${auditEvent.organizationId}#${auditEvent.eventType}`,
                    gsi1sk: auditEvent.timestamp.toISOString(),
                    gsi2pk: `${auditEvent.userId}#${auditEvent.eventType}`,
                    gsi2sk: auditEvent.timestamp.toISOString()
                }
            }).promise();
            // Log the audit event
            await logger_1.logger.info('AuditService', 'recordAuditEvent', 'Audit event recorded', {
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
        }
        catch (error) {
            await logger_1.logger.error('AuditService', 'recordAuditEvent', 'Failed to record audit event', error, {
                eventType: event.eventType,
                userId: event.userId,
                resource: event.resource
            });
            throw error;
        }
    }
    async recordComplianceAudit(audit) {
        const complianceAudit = {
            auditId: this.generateEventId(),
            timestamp: new Date(),
            ...audit
        };
        try {
            await this.dynamodb.put({
                TableName: this.complianceTableName,
                Item: {
                    ...complianceAudit,
                    ttl: Math.floor((Date.now() + (7 * 365 * 24 * 60 * 60 * 1000)) / 1000),
                    gsi1pk: `${complianceAudit.organizationId}#${complianceAudit.regulatoryFramework}`,
                    gsi1sk: complianceAudit.timestamp.toISOString(),
                    gsi2pk: `${complianceAudit.complianceRule}#${complianceAudit.checkResult}`,
                    gsi2sk: complianceAudit.timestamp.toISOString()
                }
            }).promise();
            await logger_1.logger.info('AuditService', 'recordComplianceAudit', 'Compliance audit recorded', {
                auditId: complianceAudit.auditId,
                complianceRule: complianceAudit.complianceRule,
                checkResult: complianceAudit.checkResult,
                organizationId: complianceAudit.organizationId
            });
            return complianceAudit.auditId;
        }
        catch (error) {
            await logger_1.logger.error('AuditService', 'recordComplianceAudit', 'Failed to record compliance audit', error, {
                complianceRule: audit.complianceRule,
                organizationId: audit.organizationId
            });
            throw error;
        }
    }
    async queryAuditEvents(query) {
        try {
            let params;
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
            }
            else if (query.userId && query.eventType) {
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
            }
            else {
                // Fallback to scan with filters
                params = {
                    TableName: this.auditTableName,
                    Limit: query.limit || 100,
                    ExclusiveStartKey: query.nextToken ? JSON.parse(Buffer.from(query.nextToken, 'base64').toString()) : undefined
                };
                // Add filter expressions
                const filterExpressions = [];
                const expressionAttributeValues = {};
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
                this.dynamodb.query(params) :
                this.dynamodb.scan(params)).promise();
            const events = (result.Items || []);
            // Filter by date range if specified
            const filteredEvents = events.filter(event => {
                if (query.startDate && event.timestamp < query.startDate)
                    return false;
                if (query.endDate && event.timestamp > query.endDate)
                    return false;
                return true;
            });
            const report = {
                events: filteredEvents,
                totalCount: result.Count || 0,
                nextToken: result.LastEvaluatedKey ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : undefined,
                summary: this.generateAuditSummary(filteredEvents)
            };
            await logger_1.logger.info('AuditService', 'queryAuditEvents', 'Audit events queried', {
                queryParams: query,
                resultCount: filteredEvents.length
            });
            return report;
        }
        catch (error) {
            await logger_1.logger.error('AuditService', 'queryAuditEvents', 'Failed to query audit events', error, { query });
            throw error;
        }
    }
    async generateComplianceReport(organizationId, regulatoryFramework, startDate, endDate) {
        try {
            let params;
            if (regulatoryFramework) {
                params = {
                    TableName: this.complianceTableName,
                    IndexName: 'GSI1',
                    KeyConditionExpression: 'gsi1pk = :pk',
                    ExpressionAttributeValues: {
                        ':pk': `${organizationId}#${regulatoryFramework}`
                    }
                };
            }
            else {
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
                this.dynamodb.scan(params)).promise();
            let audits = (result.Items || []);
            // Filter by date range
            if (startDate || endDate) {
                audits = audits.filter(audit => {
                    if (startDate && audit.timestamp < startDate)
                        return false;
                    if (endDate && audit.timestamp > endDate)
                        return false;
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
            await logger_1.logger.info('AuditService', 'generateComplianceReport', 'Compliance report generated', {
                organizationId,
                regulatoryFramework,
                totalAudits: summary.totalAudits,
                complianceRate: summary.complianceRate
            });
            return { audits, summary };
        }
        catch (error) {
            await logger_1.logger.error('AuditService', 'generateComplianceReport', 'Failed to generate compliance report', error, {
                organizationId,
                regulatoryFramework
            });
            throw error;
        }
    }
    generateEventId() {
        return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateAuditSummary(events) {
        const eventsByType = {};
        const eventsByOutcome = {};
        const eventsByRiskLevel = {};
        const uniqueUsers = new Set();
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
            if (event.timestamp < minDate)
                minDate = event.timestamp;
            if (event.timestamp > maxDate)
                maxDate = event.timestamp;
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
    getTopViolations(nonCompliantAudits) {
        const violations = {};
        nonCompliantAudits.forEach(audit => {
            violations[audit.complianceRule] = (violations[audit.complianceRule] || 0) + 1;
        });
        return Object.entries(violations)
            .map(([rule, count]) => ({ rule, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }
    async handleHighRiskEvent(event) {
        await logger_1.logger.critical('AuditService', 'handleHighRiskEvent', 'High-risk audit event detected', undefined, {
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
exports.AuditService = AuditService;
exports.auditService = new AuditService();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXVkaXQtc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9sb2dnaW5nL2F1ZGl0LXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscUNBQW1DO0FBQ25DLHFDQUFrQztBQW9GbEMsTUFBYSxZQUFZO0lBS3ZCO1FBQ0UsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLGtCQUFRLENBQUMsY0FBYyxDQUFDO1lBQzFDLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsSUFBSSxXQUFXO1NBQzlDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxjQUFjLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsSUFBSSwyQkFBMkIsQ0FBQztRQUNsRixJQUFJLENBQUMsbUJBQW1CLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsSUFBSSxnQ0FBZ0MsQ0FBQztJQUNuRyxDQUFDO0lBRUQsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEtBQWdEO1FBQ3JFLE1BQU0sVUFBVSxHQUFlO1lBQzdCLE9BQU8sRUFBRSxJQUFJLENBQUMsZUFBZSxFQUFFO1lBQy9CLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRTtZQUNyQixHQUFHLEtBQUs7U0FDVCxDQUFDO1FBRUYsSUFBSTtZQUNGLG9CQUFvQjtZQUNwQixNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDO2dCQUN0QixTQUFTLEVBQUUsSUFBSSxDQUFDLGNBQWM7Z0JBQzlCLElBQUksRUFBRTtvQkFDSixHQUFHLFVBQVU7b0JBQ2IsR0FBRyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7b0JBQ2xFLE1BQU0sRUFBRSxHQUFHLFVB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TyxNQUFNLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQzthQUM5QixHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2FBQ3pDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQzthQUNqQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ2xCLENBQUM7SUFFTyxLQUFLLENBQUMsbUJBQW1CLENBQUMsS0FBaUI7UUFDakQsTUFBTSxlQUFNLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBRSxxQkFBcUIsRUFBRSxnQ0FBZ0MsRUFBRSxTQUFTLEVBQUU7WUFDeEcsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO1lBQ3RCLFNBQVMsRUFBRSxLQUFLLENBQUMsU0FBUztZQUMxQixNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU07WUFDcEIsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRO1lBQ3hCLFNBQVMsRUFBRSxLQUFLLENBQUMsU0FBUztZQUMxQixPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87U0FDdkIsQ0FBQyxDQUFDO1FBRUgsZ0RBQWdEO1FBQ2hELHVEQUF1RDtJQUN6RCxDQUFDO0NBQ0Y7QUF4VkQsb0NBd1ZDO0FBRVksUUFBQSxZQUFZLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IER5bmFtb0RCIH0gZnJvbSAnYXdzLXNkayc7XG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuL2xvZ2dlcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXVkaXRFdmVudCB7XG4gIGV2ZW50SWQ6IHN0cmluZztcbiAgdGltZXN0YW1wOiBEYXRlO1xuICB1c2VySWQ6IHN0cmluZztcbiAgdXNlclJvbGU6IHN0cmluZztcbiAgb3JnYW5pemF0aW9uSWQ6IHN0cmluZztcbiAgZXZlbnRUeXBlOiBBdWRpdEV2ZW50VHlwZTtcbiAgcmVzb3VyY2U6IHN0cmluZztcbiAgYWN0aW9uOiBzdHJpbmc7XG4gIG91dGNvbWU6ICdzdWNjZXNzJyB8ICdmYWlsdXJlJyB8ICdwYXJ0aWFsJztcbiAgZGV0YWlsczogUmVjb3JkPHN0cmluZywgYW55PjtcbiAgaXBBZGRyZXNzPzogc3RyaW5nO1xuICB1c2VyQWdlbnQ/OiBzdHJpbmc7XG4gIHNlc3Npb25JZD86IHN0cmluZztcbiAgcmVxdWVzdElkPzogc3RyaW5nO1xuICBjb21wbGlhbmNlRmxhZ3M/OiBzdHJpbmdbXTtcbiAgcmlza0xldmVsOiAnbG93JyB8ICdtZWRpdW0nIHwgJ2hpZ2gnIHwgJ2NyaXRpY2FsJztcbiAgZGF0YUNsYXNzaWZpY2F0aW9uOiAncHVibGljJyB8ICdpbnRlcm5hbCcgfCAnY29uZmlkZW50aWFsJyB8ICdyZXN0cmljdGVkJztcbn1cblxuZXhwb3J0IHR5cGUgQXVkaXRFdmVudFR5cGUgPSBcbiAgfCAndXNlcl9hdXRoZW50aWNhdGlvbidcbiAgfCAndXNlcl9hdXRob3JpemF0aW9uJ1xuICB8ICdkYXRhX2FjY2VzcydcbiAgfCAnZGF0YV9tb2RpZmljYXRpb24nXG4gIHwgJ2RhdGFfZXhwb3J0J1xuICB8ICdpbnZlc3RtZW50X2lkZWFfZ2VuZXJhdGlvbidcbiAgfCAnaW52ZXN0bWVudF9pZGVhX2FjY2VzcydcbiAgfCAnY29tcGxpYW5jZV9jaGVjaydcbiAgfCAnbW9kZWxfZXhlY3V0aW9uJ1xuICB8ICdjb25maWd1cmF0aW9uX2NoYW5nZSdcbiAgfCAnc3lzdGVtX2Vycm9yJ1xuICB8ICdzZWN1cml0eV9ldmVudCdcbiAgfCAncmVndWxhdG9yeV9hY3Rpb24nO1xuXG5leHBvcnQgaW50ZXJmYWNlIEF1ZGl0UXVlcnkge1xuICB1c2VySWQ/OiBzdHJpbmc7XG4gIG9yZ2FuaXphdGlvbklkPzogc3RyaW5nO1xuICBldmVudFR5cGU/OiBBdWRpdEV2ZW50VHlwZTtcbiAgcmVzb3VyY2U/OiBzdHJpbmc7XG4gIHN0YXJ0RGF0ZT86IERhdGU7XG4gIGVuZERhdGU/OiBEYXRlO1xuICByaXNrTGV2ZWw/OiBzdHJpbmc7XG4gIG91dGNvbWU/OiBzdHJpbmc7XG4gIGxpbWl0PzogbnVtYmVyO1xuICBuZXh0VG9rZW4/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXVkaXRSZXBvcnQge1xuICBldmVudHM6IEF1ZGl0RXZlbnRbXTtcbiAgdG90YWxDb3VudDogbnVtYmVyO1xuICBuZXh0VG9rZW4/OiBzdHJpbmc7XG4gIHN1bW1hcnk6IHtcbiAgICBldmVudHNCeVR5cGU6IFJlY29yZDxBdWRpdEV2ZW50VHlwZSwgbnVtYmVyPjtcbiAgICBldmVudHNCeU91dGNvbWU6IFJlY29yZDxzdHJpbmcsIG51bWJlcj47XG4gICAgZXZlbnRzQnlSaXNrTGV2ZWw6IFJlY29yZDxzdHJpbmcsIG51bWJlcj47XG4gICAgdW5pcXVlVXNlcnM6IG51bWJlcjtcbiAgICB0aW1lUmFuZ2U6IHtcbiAgICAgIHN0YXJ0OiBEYXRlO1xuICAgICAgZW5kOiBEYXRlO1xuICAgIH07XG4gIH07XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcGxpYW5jZUF1ZGl0VHJhaWwge1xuICBhdWRpdElkOiBzdHJpbmc7XG4gIHRpbWVzdGFtcDogRGF0ZTtcbiAgY29tcGxpYW5jZVJ1bGU6IHN0cmluZztcbiAgcmVndWxhdG9yeUZyYW1ld29yazogc3RyaW5nO1xuICBjaGVja1Jlc3VsdDogJ2NvbXBsaWFudCcgfCAnbm9uX2NvbXBsaWFudCcgfCAnd2FybmluZyc7XG4gIGRldGFpbHM6IHtcbiAgICBydWxlTmFtZTogc3RyaW5nO1xuICAgIHJ1bGVWZXJzaW9uOiBzdHJpbmc7XG4gICAgY2hlY2tDcml0ZXJpYTogc3RyaW5nW107XG4gICAgZmluZGluZ3M6IHN0cmluZ1tdO1xuICAgIHJlbWVkaWF0aW9uPzogc3RyaW5nW107XG4gIH07XG4gIGFmZmVjdGVkUmVzb3VyY2VzOiBzdHJpbmdbXTtcbiAgdXNlcklkOiBzdHJpbmc7XG4gIG9yZ2FuaXphdGlvbklkOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBBdWRpdFNlcnZpY2Uge1xuICBwcml2YXRlIGR5bmFtb2RiOiBEeW5hbW9EQi5Eb2N1bWVudENsaWVudDtcbiAgcHJpdmF0ZSBhdWRpdFRhYmxlTmFtZTogc3RyaW5nO1xuICBwcml2YXRlIGNvbXBsaWFuY2VUYWJsZU5hbWU6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmR5bmFtb2RiID0gbmV3IER5bmFtb0RCLkRvY3VtZW50Q2xpZW50KHtcbiAgICAgIHJlZ2lvbjogcHJvY2Vzcy5lbnYuQVdTX1JFR0lPTiB8fCAndXMtZWFzdC0xJ1xuICAgIH0pO1xuICAgIHRoaXMuYXVkaXRUYWJsZU5hbWUgPSBwcm9jZXNzLmVudi5BVURJVF9UQUJMRV9OQU1FIHx8ICdpbnZlc3RtZW50LWFpLWF1ZGl0LXRyYWlsJztcbiAgICB0aGlzLmNvbXBsaWFuY2VUYWJsZU5hbWUgPSBwcm9jZXNzLmVudi5DT01QTElBTkNFX1RBQkxFX05BTUUgfHwgJ2ludmVzdG1lbnQtYWktY29tcGxpYW5jZS1hdWRpdCc7XG4gIH1cblxuICBhc3luYyByZWNvcmRBdWRpdEV2ZW50KGV2ZW50OiBPbWl0PEF1ZGl0RXZlbnQsICdldmVudElkJyB8ICd0aW1lc3RhbXAnPik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgYXVkaXRFdmVudDogQXVkaXRFdmVudCA9IHtcbiAgICAgIGV2ZW50SWQ6IHRoaXMuZ2VuZXJhdGVFdmVudElkKCksXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAuLi5ldmVudFxuICAgIH07XG5cbiAgICB0cnkge1xuICAgICAgLy8gU3RvcmUgaW4gRHluYW1vREJcbiAgICAgIGF3YWl0IHRoaXMuZHluYW1vZGIucHV0KHtcbiAgICAgICAgVGFibGVOYW1lOiB0aGlzLmF1ZGl0VGFibGVOYW1lLFxuICAgICAgICBJdGVtOiB7XG4gICAgICAgICAgLi4uYXVkaXRFdmVudCxcbiAgICAgICAgICB0dGw6IE1hdGguZmxvb3IoKERhdGUubm93KCkgKyAoMzY1ICogMjQgKiA2MCAqIDYwICogMTAwMCkpIC8gMTAwMCksIC8vIDEgeWVhciByZXRlbnRpb25cbiAgICAgICAgICBnc2kxcGs6IGAke2F1ZGl0RXZlbnQub3JnYW5pemF0aW9uSWR9IyR7YXVkaXRFdmVudC5ldmVudFR5cGV9YCxcbiAgICAgICAgICBnc2kxc2s6IGF1ZGl0RXZlbnQudGltZXN0YW1wLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgZ3NpMnBrOiBgJHthdWRpdEV2ZW50LnVzZXJJZH0jJHthdWRpdEV2ZW50LmV2ZW50VHlwZX1gLFxuICAgICAgICAgIGdzaTJzazogYXVkaXRFdmVudC50aW1lc3RhbXAudG9JU09TdHJpbmcoKVxuICAgICAgICB9XG4gICAgICB9KS5wcm9taXNlKCk7XG5cbiAgICAgIC8vIExvZyB0aGUgYXVkaXQgZXZlbnRcbiAgICAgIGF3YWl0IGxvZ2dlci5pbmZvKCdBdWRpdFNlcnZpY2UnLCAncmVjb3JkQXVkaXRFdmVudCcsICdBdWRpdCBldmVudCByZWNvcmRlZCcsIHtcbiAgICAgICAgZXZlbnRJZDogYXVkaXRFdmVudC5ldmVudElkLFxuICAgICAgICBldmVudFR5cGU6IGF1ZGl0RXZlbnQuZXZlbnRUeXBlLFxuICAgICAgICB1c2VySWQ6IGF1ZGl0RXZlbnQudXNlcklkLFxuICAgICAgICByZXNvdXJjZTogYXVkaXRFdmVudC5yZXNvdXJjZSxcbiAgICAgICAgb3V0Y29tZTogYXVkaXRFdmVudC5vdXRjb21lXG4gICAgICB9KTtcblxuICAgICAgLy8gQ2hlY2sgZm9yIGhpZ2gtcmlzayBldmVudHMgYW5kIGFsZXJ0XG4gICAgICBpZiAoYXVkaXRFdmVudC5yaXNrTGV2ZWwgPT09ICdjcml0aWNhbCcgfHwgYXVkaXRFdmVudC5yaXNrTGV2ZWwgPT09ICdoaWdoJykge1xuICAgICAgICBhd2FpdCB0aGlzLmhhbmRsZUhpZ2hSaXNrRXZlbnQoYXVkaXRFdmVudCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhdWRpdEV2ZW50LmV2ZW50SWQ7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGF3YWl0IGxvZ2dlci5lcnJvcignQXVkaXRTZXJ2aWNlJywgJ3JlY29yZEF1ZGl0RXZlbnQnLCAnRmFpbGVkIHRvIHJlY29yZCBhdWRpdCBldmVudCcsIGVycm9yIGFzIEVycm9yLCB7XG4gICAgICAgIGV2ZW50VHlwZTogZXZlbnQuZXZlbnRUeXBlLFxuICAgICAgICB1c2VySWQ6IGV2ZW50LnVzZXJJZCxcbiAgICAgICAgcmVzb3VyY2U6IGV2ZW50LnJlc291cmNlXG4gICAgICB9KTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHJlY29yZENvbXBsaWFuY2VBdWRpdChhdWRpdDogT21pdDxDb21wbGlhbmNlQXVkaXRUcmFpbCwgJ2F1ZGl0SWQnIHwgJ3RpbWVzdGFtcCc+KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBjb21wbGlhbmNlQXVkaXQ6IENvbXBsaWFuY2VBdWRpdFRyYWlsID0ge1xuICAgICAgYXVkaXRJZDogdGhpcy5nZW5lcmF0ZUV2ZW50SWQoKSxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgIC4uLmF1ZGl0XG4gICAgfTtcblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmR5bmFtb2RiLnB1dCh7XG4gICAgICAgIFRhYmxlTmFtZTogdGhpcy5jb21wbGlhbmNlVGFibGVOYW1lLFxuICAgICAgICBJdGVtOiB7XG4gICAgICAgICAgLi4uY29tcGxpYW5jZUF1ZGl0LFxuICAgICAgICAgIHR0bDogTWF0aC5mbG9vcigoRGF0ZS5ub3coKSArICg3ICogMzY1ICogMjQgKiA2MCAqIDYwICogMTAwMCkpIC8gMTAwMCksIC8vIDcgeWVhcnMgcmV0ZW50aW9uIGZvciBjb21wbGlhbmNlXG4gICAgICAgICAgZ3NpMXBrOiBgJHtjb21wbGlhbmNlQXVkaXQub3JnYW5pemF0aW9uSWR9IyR7Y29tcGxpYW5jZUF1ZGl0LnJlZ3VsYXRvcnlGcmFtZXdvcmt9YCxcbiAgICAgICAgICBnc2kxc2s6IGNvbXBsaWFuY2VBdWRpdC50aW1lc3RhbXAudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICBnc2kycGs6IGAke2NvbXBsaWFuY2VBdWRpdC5jb21wbGlhbmNlUnVsZX0jJHtjb21wbGlhbmNlQXVkaXQuY2hlY2tSZXN1bHR9YCxcbiAgICAgICAgICBnc2kyc2s6IGNvbXBsaWFuY2VBdWRpdC50aW1lc3RhbXAudG9JU09TdHJpbmcoKVxuICAgICAgICB9XG4gICAgICB9KS5wcm9taXNlKCk7XG5cbiAgICAgIGF3YWl0IGxvZ2dlci5pbmZvKCdBdWRpdFNlcnZpY2UnLCAncmVjb3JkQ29tcGxpYW5jZUF1ZGl0JywgJ0NvbXBsaWFuY2UgYXVkaXQgcmVjb3JkZWQnLCB7XG4gICAgICAgIGF1ZGl0SWQ6IGNvbXBsaWFuY2VBdWRpdC5hdWRpdElkLFxuICAgICAgICBjb21wbGlhbmNlUnVsZTogY29tcGxpYW5jZUF1ZGl0LmNvbXBsaWFuY2VSdWxlLFxuICAgICAgICBjaGVja1Jlc3VsdDogY29tcGxpYW5jZUF1ZGl0LmNoZWNrUmVzdWx0LFxuICAgICAgICBvcmdhbml6YXRpb25JZDogY29tcGxpYW5jZUF1ZGl0Lm9yZ2FuaXphdGlvbklkXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGNvbXBsaWFuY2VBdWRpdC5hdWRpdElkO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBhd2FpdCBsb2dnZXIuZXJyb3IoJ0F1ZGl0U2VydmljZScsICdyZWNvcmRDb21wbGlhbmNlQXVkaXQnLCAnRmFpbGVkIHRvIHJlY29yZCBjb21wbGlhbmNlIGF1ZGl0JywgZXJyb3IgYXMgRXJyb3IsIHtcbiAgICAgICAgY29tcGxpYW5jZVJ1bGU6IGF1ZGl0LmNvbXBsaWFuY2VSdWxlLFxuICAgICAgICBvcmdhbml6YXRpb25JZDogYXVkaXQub3JnYW5pemF0aW9uSWRcbiAgICAgIH0pO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgcXVlcnlBdWRpdEV2ZW50cyhxdWVyeTogQXVkaXRRdWVyeSk6IFByb21pc2U8QXVkaXRSZXBvcnQ+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHBhcmFtczogRHluYW1vREIuRG9jdW1lbnRDbGllbnQuUXVlcnlJbnB1dCB8IER5bmFtb0RCLkRvY3VtZW50Q2xpZW50LlNjYW5JbnB1dDtcbiAgICAgIFxuICAgICAgaWYgKHF1ZXJ5Lm9yZ2FuaXphdGlvbklkICYmIHF1ZXJ5LmV2ZW50VHlwZSkge1xuICAgICAgICAvLyBVc2UgR1NJMSBmb3Igb3JnYW5pemF0aW9uICsgZXZlbnQgdHlwZSBxdWVyaWVzXG4gICAgICAgIHBhcmFtcyA9IHtcbiAgICAgICAgICBUYWJsZU5hbWU6IHRoaXMuYXVkaXRUYWJsZU5hbWUsXG4gICAgICAgICAgSW5kZXhOYW1lOiAnR1NJMScsXG4gICAgICAgICAgS2V5Q29uZGl0aW9uRXhwcmVzc2lvbjogJ2dzaTFwayA9IDpwaycsXG4gICAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xuICAgICAgICAgICAgJzpwayc6IGAke3F1ZXJ5Lm9yZ2FuaXphdGlvbklkfSMke3F1ZXJ5LmV2ZW50VHlwZX1gXG4gICAgICAgICAgfSxcbiAgICAgICAgICBMaW1pdDogcXVlcnkubGltaXQgfHwgMTAwLFxuICAgICAgICAgIEV4Y2x1c2l2ZVN0YXJ0S2V5OiBxdWVyeS5uZXh0VG9rZW4gPyBKU09OLnBhcnNlKEJ1ZmZlci5mcm9tKHF1ZXJ5Lm5leHRUb2tlbiwgJ2Jhc2U2NCcpLnRvU3RyaW5nKCkpIDogdW5kZWZpbmVkXG4gICAgICAgIH07XG4gICAgICB9IGVsc2UgaWYgKHF1ZXJ5LnVzZXJJZCAmJiBxdWVyeS5ldmVudFR5cGUpIHtcbiAgICAgICAgLy8gVXNlIEdTSTIgZm9yIHVzZXIgKyBldmVudCB0eXBlIHF1ZXJpZXNcbiAgICAgICAgcGFyYW1zID0ge1xuICAgICAgICAgIFRhYmxlTmFtZTogdGhpcy5hdWRpdFRhYmxlTmFtZSxcbiAgICAgICAgICBJbmRleE5hbWU6ICdHU0kyJyxcbiAgICAgICAgICBLZXlDb25kaXRpb25FeHByZXNzaW9uOiAnZ3NpMnBrID0gOnBrJyxcbiAgICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XG4gICAgICAgICAgICAnOnBrJzogYCR7cXVlcnkudXNlcklkfSMke3F1ZXJ5LmV2ZW50VHlwZX1gXG4gICAgICAgICAgfSxcbiAgICAgICAgICBMaW1pdDogcXVlcnkubGltaXQgfHwgMTAwLFxuICAgICAgICAgIEV4Y2x1c2l2ZVN0YXJ0S2V5OiBxdWVyeS5uZXh0VG9rZW4gPyBKU09OLnBhcnNlKEJ1ZmZlci5mcm9tKHF1ZXJ5Lm5leHRUb2tlbiwgJ2Jhc2U2NCcpLnRvU3RyaW5nKCkpIDogdW5kZWZpbmVkXG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBGYWxsYmFjayB0byBzY2FuIHdpdGggZmlsdGVyc1xuICAgICAgICBwYXJhbXMgPSB7XG4gICAgICAgICAgVGFibGVOYW1lOiB0aGlzLmF1ZGl0VGFibGVOYW1lLFxuICAgICAgICAgIExpbWl0OiBxdWVyeS5saW1pdCB8fCAxMDAsXG4gICAgICAgICAgRXhjbHVzaXZlU3RhcnRLZXk6IHF1ZXJ5Lm5leHRUb2tlbiA/IEpTT04ucGFyc2UoQnVmZmVyLmZyb20ocXVlcnkubmV4dFRva2VuLCAnYmFzZTY0JykudG9TdHJpbmcoKSkgOiB1bmRlZmluZWRcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBBZGQgZmlsdGVyIGV4cHJlc3Npb25zXG4gICAgICAgIGNvbnN0IGZpbHRlckV4cHJlc3Npb25zOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBjb25zdCBleHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge307XG5cbiAgICAgICAgaWYgKHF1ZXJ5LnVzZXJJZCkge1xuICAgICAgICAgIGZpbHRlckV4cHJlc3Npb25zLnB1c2goJ3VzZXJJZCA9IDp1c2VySWQnKTtcbiAgICAgICAgICBleHByZXNzaW9uQXR0cmlidXRlVmFsdWVzWyc6dXNlcklkJ10gPSBxdWVyeS51c2VySWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocXVlcnkub3JnYW5pemF0aW9uSWQpIHtcbiAgICAgICAgICBmaWx0ZXJFeHByZXNzaW9ucy5wdXNoKCdvcmdhbml6YXRpb25JZCA9IDpvcmdJZCcpO1xuICAgICAgICAgIGV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXNbJzpvcmdJZCddID0gcXVlcnkub3JnYW5pemF0aW9uSWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocXVlcnkuZXZlbnRUeXBlKSB7XG4gICAgICAgICAgZmlsdGVyRXhwcmVzc2lvbnMucHVzaCgnZXZlbnRUeXBlID0gOmV2ZW50VHlwZScpO1xuICAgICAgICAgIGV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXNbJzpldmVudFR5cGUnXSA9IHF1ZXJ5LmV2ZW50VHlwZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChxdWVyeS5vdXRjb21lKSB7XG4gICAgICAgICAgZmlsdGVyRXhwcmVzc2lvbnMucHVzaCgnb3V0Y29tZSA9IDpvdXRjb21lJyk7XG4gICAgICAgICAgZXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlc1snOm91dGNvbWUnXSA9IHF1ZXJ5Lm91dGNvbWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocXVlcnkucmlza0xldmVsKSB7XG4gICAgICAgICAgZmlsdGVyRXhwcmVzc2lvbnMucHVzaCgncmlza0xldmVsID0gOnJpc2tMZXZlbCcpO1xuICAgICAgICAgIGV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXNbJzpyaXNrTGV2ZWwnXSA9IHF1ZXJ5LnJpc2tMZXZlbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChmaWx0ZXJFeHByZXNzaW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcGFyYW1zLkZpbHRlckV4cHJlc3Npb24gPSBmaWx0ZXJFeHByZXNzaW9ucy5qb2luKCcgQU5EICcpO1xuICAgICAgICAgIHBhcmFtcy5FeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzID0gZXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlcztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCAoJ0tleUNvbmRpdGlvbkV4cHJlc3Npb24nIGluIHBhcmFtcyA/IFxuICAgICAgICB0aGlzLmR5bmFtb2RiLnF1ZXJ5KHBhcmFtcyBhcyBEeW5hbW9EQi5Eb2N1bWVudENsaWVudC5RdWVyeUlucHV0KSA6IFxuICAgICAgICB0aGlzLmR5bmFtb2RiLnNjYW4ocGFyYW1zIGFzIER5bmFtb0RCLkRvY3VtZW50Q2xpZW50LlNjYW5JbnB1dClcbiAgICAgICkucHJvbWlzZSgpO1xuXG4gICAgICBjb25zdCBldmVudHMgPSAocmVzdWx0Lkl0ZW1zIHx8IFtdKSBhcyBBdWRpdEV2ZW50W107XG4gICAgICBcbiAgICAgIC8vIEZpbHRlciBieSBkYXRlIHJhbmdlIGlmIHNwZWNpZmllZFxuICAgICAgY29uc3QgZmlsdGVyZWRFdmVudHMgPSBldmVudHMuZmlsdGVyKGV2ZW50ID0+IHtcbiAgICAgICAgaWYgKHF1ZXJ5LnN0YXJ0RGF0ZSAmJiBldmVudC50aW1lc3RhbXAgPCBxdWVyeS5zdGFydERhdGUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKHF1ZXJ5LmVuZERhdGUgJiYgZXZlbnQudGltZXN0YW1wID4gcXVlcnkuZW5kRGF0ZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZXBvcnQ6IEF1ZGl0UmVwb3J0ID0ge1xuICAgICAgICBldmVudHM6IGZpbHRlcmVkRXZlbnRzLFxuICAgICAgICB0b3RhbENvdW50OiByZXN1bHQuQ291bnQgfHwgMCxcbiAgICAgICAgbmV4dFRva2VuOiByZXN1bHQuTGFzdEV2YWx1YXRlZEtleSA/IEJ1ZmZlci5mcm9tKEpTT04uc3RyaW5naWZ5KHJlc3VsdC5MYXN0RXZhbHVhdGVkS2V5KSkudG9TdHJpbmcoJ2Jhc2U2NCcpIDogdW5kZWZpbmVkLFxuICAgICAgICBzdW1tYXJ5OiB0aGlzLmdlbmVyYXRlQXVkaXRTdW1tYXJ5KGZpbHRlcmVkRXZlbnRzKVxuICAgICAgfTtcblxuICAgICAgYXdhaXQgbG9nZ2VyLmluZm8oJ0F1ZGl0U2VydmljZScsICdxdWVyeUF1ZGl0RXZlbnRzJywgJ0F1ZGl0IGV2ZW50cyBxdWVyaWVkJywge1xuICAgICAgICBxdWVyeVBhcmFtczogcXVlcnksXG4gICAgICAgIHJlc3VsdENvdW50OiBmaWx0ZXJlZEV2ZW50cy5sZW5ndGhcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gcmVwb3J0O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBhd2FpdCBsb2dnZXIuZXJyb3IoJ0F1ZGl0U2VydmljZScsICdxdWVyeUF1ZGl0RXZlbnRzJywgJ0ZhaWxlZCB0byBxdWVyeSBhdWRpdCBldmVudHMnLCBlcnJvciBhcyBFcnJvciwgeyBxdWVyeSB9KTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGdlbmVyYXRlQ29tcGxpYW5jZVJlcG9ydChvcmdhbml6YXRpb25JZDogc3RyaW5nLCByZWd1bGF0b3J5RnJhbWV3b3JrPzogc3RyaW5nLCBzdGFydERhdGU/OiBEYXRlLCBlbmREYXRlPzogRGF0ZSk6IFByb21pc2U8e1xuICAgIGF1ZGl0czogQ29tcGxpYW5jZUF1ZGl0VHJhaWxbXTtcbiAgICBzdW1tYXJ5OiB7XG4gICAgICB0b3RhbEF1ZGl0czogbnVtYmVyO1xuICAgICAgY29tcGxpYW50Q291bnQ6IG51bWJlcjtcbiAgICAgIG5vbkNvbXBsaWFudENvdW50OiBudW1iZXI7XG4gICAgICB3YXJuaW5nQ291bnQ6IG51bWJlcjtcbiAgICAgIGNvbXBsaWFuY2VSYXRlOiBudW1iZXI7XG4gICAgICB0b3BWaW9sYXRpb25zOiBBcnJheTx7IHJ1bGU6IHN0cmluZzsgY291bnQ6IG51bWJlciB9PjtcbiAgICB9O1xuICB9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCBwYXJhbXM6IER5bmFtb0RCLkRvY3VtZW50Q2xpZW50LlF1ZXJ5SW5wdXQ7XG5cbiAgICAgIGlmIChyZWd1bGF0b3J5RnJhbWV3b3JrKSB7XG4gICAgICAgIHBhcmFtcyA9IHtcbiAgICAgICAgICBUYWJsZU5hbWU6IHRoaXMuY29tcGxpYW5jZVRhYmxlTmFtZSxcbiAgICAgICAgICBJbmRleE5hbWU6ICdHU0kxJyxcbiAgICAgICAgICBLZXlDb25kaXRpb25FeHByZXNzaW9uOiAnZ3NpMXBrID0gOnBrJyxcbiAgICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XG4gICAgICAgICAgICAnOnBrJzogYCR7b3JnYW5pemF0aW9uSWR9IyR7cmVndWxhdG9yeUZyYW1ld29ya31gXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFyYW1zID0ge1xuICAgICAgICAgIFRhYmxlTmFtZTogdGhpcy5jb21wbGlhbmNlVGFibGVOYW1lLFxuICAgICAgICAgIEZpbHRlckV4cHJlc3Npb246ICdvcmdhbml6YXRpb25JZCA9IDpvcmdJZCcsXG4gICAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xuICAgICAgICAgICAgJzpvcmdJZCc6IG9yZ2FuaXphdGlvbklkXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCAoJ0tleUNvbmRpdGlvbkV4cHJlc3Npb24nIGluIHBhcmFtcyA/IFxuICAgICAgICB0aGlzLmR5bmFtb2RiLnF1ZXJ5KHBhcmFtcykgOiBcbiAgICAgICAgdGhpcy5keW5hbW9kYi5zY2FuKHBhcmFtcylcbiAgICAgICkucHJvbWlzZSgpO1xuXG4gICAgICBsZXQgYXVkaXRzID0gKHJlc3VsdC5JdGVtcyB8fCBbXSkgYXMgQ29tcGxpYW5jZUF1ZGl0VHJhaWxbXTtcblxuICAgICAgLy8gRmlsdGVyIGJ5IGRhdGUgcmFuZ2VcbiAgICAgIGlmIChzdGFydERhdGUgfHwgZW5kRGF0ZSkge1xuICAgICAgICBhdWRpdHMgPSBhdWRpdHMuZmlsdGVyKGF1ZGl0ID0+IHtcbiAgICAgICAgICBpZiAoc3RhcnREYXRlICYmIGF1ZGl0LnRpbWVzdGFtcCA8IHN0YXJ0RGF0ZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIGlmIChlbmREYXRlICYmIGF1ZGl0LnRpbWVzdGFtcCA+IGVuZERhdGUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHN1bW1hcnkgPSB7XG4gICAgICAgIHRvdGFsQXVkaXRzOiBhdWRpdHMubGVuZ3RoLFxuICAgICAgICBjb21wbGlhbnRDb3VudDogYXVkaXRzLmZpbHRlcihhID0+IGEuY2hlY2tSZXN1bHQgPT09ICdjb21wbGlhbnQnKS5sZW5ndGgsXG4gICAgICAgIG5vbkNvbXBsaWFudENvdW50OiBhdWRpdHMuZmlsdGVyKGEgPT4gYS5jaGVja1Jlc3VsdCA9PT0gJ25vbl9jb21wbGlhbnQnKS5sZW5ndGgsXG4gICAgICAgIHdhcm5pbmdDb3VudDogYXVkaXRzLmZpbHRlcihhID0+IGEuY2hlY2tSZXN1bHQgPT09ICd3YXJuaW5nJykubGVuZ3RoLFxuICAgICAgICBjb21wbGlhbmNlUmF0ZTogYXVkaXRzLmxlbmd0aCA+IDAgPyAoYXVkaXRzLmZpbHRlcihhID0+IGEuY2hlY2tSZXN1bHQgPT09ICdjb21wbGlhbnQnKS5sZW5ndGggLyBhdWRpdHMubGVuZ3RoKSAqIDEwMCA6IDAsXG4gICAgICAgIHRvcFZpb2xhdGlvbnM6IHRoaXMuZ2V0VG9wVmlvbGF0aW9ucyhhdWRpdHMuZmlsdGVyKGEgPT4gYS5jaGVja1Jlc3VsdCA9PT0gJ25vbl9jb21wbGlhbnQnKSlcbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IGxvZ2dlci5pbmZvKCdBdWRpdFNlcnZpY2UnLCAnZ2VuZXJhdGVDb21wbGlhbmNlUmVwb3J0JywgJ0NvbXBsaWFuY2UgcmVwb3J0IGdlbmVyYXRlZCcsIHtcbiAgICAgICAgb3JnYW5pemF0aW9uSWQsXG4gICAgICAgIHJlZ3VsYXRvcnlGcmFtZXdvcmssXG4gICAgICAgIHRvdGFsQXVkaXRzOiBzdW1tYXJ5LnRvdGFsQXVkaXRzLFxuICAgICAgICBjb21wbGlhbmNlUmF0ZTogc3VtbWFyeS5jb21wbGlhbmNlUmF0ZVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB7IGF1ZGl0cywgc3VtbWFyeSB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBhd2FpdCBsb2dnZXIuZXJyb3IoJ0F1ZGl0U2VydmljZScsICdnZW5lcmF0ZUNvbXBsaWFuY2VSZXBvcnQnLCAnRmFpbGVkIHRvIGdlbmVyYXRlIGNvbXBsaWFuY2UgcmVwb3J0JywgZXJyb3IgYXMgRXJyb3IsIHtcbiAgICAgICAgb3JnYW5pemF0aW9uSWQsXG4gICAgICAgIHJlZ3VsYXRvcnlGcmFtZXdvcmtcbiAgICAgIH0pO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZUV2ZW50SWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYGF1ZGl0XyR7RGF0ZS5ub3coKX1fJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHIoMiwgOSl9YDtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVBdWRpdFN1bW1hcnkoZXZlbnRzOiBBdWRpdEV2ZW50W10pOiBBdWRpdFJlcG9ydFsnc3VtbWFyeSddIHtcbiAgICBjb25zdCBldmVudHNCeVR5cGUgPSB7fSBhcyBSZWNvcmQ8QXVkaXRFdmVudFR5cGUsIG51bWJlcj47XG4gICAgY29uc3QgZXZlbnRzQnlPdXRjb21lID0ge30gYXMgUmVjb3JkPHN0cmluZywgbnVtYmVyPjtcbiAgICBjb25zdCBldmVudHNCeVJpc2tMZXZlbCA9IHt9IGFzIFJlY29yZDxzdHJpbmcsIG51bWJlcj47XG4gICAgY29uc3QgdW5pcXVlVXNlcnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICAgIGxldCBtaW5EYXRlID0gbmV3IERhdGUoKTtcbiAgICBsZXQgbWF4RGF0ZSA9IG5ldyBEYXRlKDApO1xuXG4gICAgZXZlbnRzLmZvckVhY2goZXZlbnQgPT4ge1xuICAgICAgLy8gQ291bnQgYnkgdHlwZVxuICAgICAgZXZlbnRzQnlUeXBlW2V2ZW50LmV2ZW50VHlwZV0gPSAoZXZlbnRzQnlUeXBlW2V2ZW50LmV2ZW50VHlwZV0gfHwgMCkgKyAxO1xuICAgICAgXG4gICAgICAvLyBDb3VudCBieSBvdXRjb21lXG4gICAgICBldmVudHNCeU91dGNvbWVbZXZlbnQub3V0Y29tZV0gPSAoZXZlbnRzQnlPdXRjb21lW2V2ZW50Lm91dGNvbWVdIHx8IDApICsgMTtcbiAgICAgIFxuICAgICAgLy8gQ291bnQgYnkgcmlzayBsZXZlbFxuICAgICAgZXZlbnRzQnlSaXNrTGV2ZWxbZXZlbnQucmlza0xldmVsXSA9IChldmVudHNCeVJpc2tMZXZlbFtldmVudC5yaXNrTGV2ZWxdIHx8IDApICsgMTtcbiAgICAgIFxuICAgICAgLy8gVHJhY2sgdW5pcXVlIHVzZXJzXG4gICAgICB1bmlxdWVVc2Vycy5hZGQoZXZlbnQudXNlcklkKTtcbiAgICAgIFxuICAgICAgLy8gVHJhY2sgZGF0ZSByYW5nZVxuICAgICAgaWYgKGV2ZW50LnRpbWVzdGFtcCA8IG1pbkRhdGUpIG1pbkRhdGUgPSBldmVudC50aW1lc3RhbXA7XG4gICAgICBpZiAoZXZlbnQudGltZXN0YW1wID4gbWF4RGF0ZSkgbWF4RGF0ZSA9IGV2ZW50LnRpbWVzdGFtcDtcbiAgICB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICBldmVudHNCeVR5cGUsXG4gICAgICBldmVudHNCeU91dGNvbWUsXG4gICAgICBldmVudHNCeVJpc2tMZXZlbCxcbiAgICAgIHVuaXF1ZVVzZXJzOiB1bmlxdWVVc2Vycy5zaXplLFxuICAgICAgdGltZVJhbmdlOiB7XG4gICAgICAgIHN0YXJ0OiBldmVudHMubGVuZ3RoID4gMCA/IG1pbkRhdGUgOiBuZXcgRGF0ZSgpLFxuICAgICAgICBlbmQ6IGV2ZW50cy5sZW5ndGggPiAwID8gbWF4RGF0ZSA6IG5ldyBEYXRlKClcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRUb3BWaW9sYXRpb25zKG5vbkNvbXBsaWFudEF1ZGl0czogQ29tcGxpYW5jZUF1ZGl0VHJhaWxbXSk6IEFycmF5PHsgcnVsZTogc3RyaW5nOyBjb3VudDogbnVtYmVyIH0+IHtcbiAgICBjb25zdCB2aW9sYXRpb25zID0ge30gYXMgUmVjb3JkPHN0cmluZywgbnVtYmVyPjtcbiAgICBcbiAgICBub25Db21wbGlhbnRBdWRpdHMuZm9yRWFjaChhdWRpdCA9PiB7XG4gICAgICB2aW9sYXRpb25zW2F1ZGl0LmNvbXBsaWFuY2VSdWxlXSA9ICh2aW9sYXRpb25zW2F1ZGl0LmNvbXBsaWFuY2VSdWxlXSB8fCAwKSArIDE7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gT2JqZWN0LmVudHJpZXModmlvbGF0aW9ucylcbiAgICAgIC5tYXAoKFtydWxlLCBjb3VudF0pID0+ICh7IHJ1bGUsIGNvdW50IH0pKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IGIuY291bnQgLSBhLmNvdW50KVxuICAgICAgLnNsaWNlKDAsIDEwKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaGFuZGxlSGlnaFJpc2tFdmVudChldmVudDogQXVkaXRFdmVudCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IGxvZ2dlci5jcml0aWNhbCgnQXVkaXRTZXJ2aWNlJywgJ2hhbmRsZUhpZ2hSaXNrRXZlbnQnLCAnSGlnaC1yaXNrIGF1ZGl0IGV2ZW50IGRldGVjdGVkJywgdW5kZWZpbmVkLCB7XG4gICAgICBldmVudElkOiBldmVudC5ldmVudElkLFxuICAgICAgZXZlbnRUeXBlOiBldmVudC5ldmVudFR5cGUsXG4gICAgICB1c2VySWQ6IGV2ZW50LnVzZXJJZCxcbiAgICAgIHJlc291cmNlOiBldmVudC5yZXNvdXJjZSxcbiAgICAgIHJpc2tMZXZlbDogZXZlbnQucmlza0xldmVsLFxuICAgICAgZGV0YWlsczogZXZlbnQuZGV0YWlsc1xuICAgIH0pO1xuXG4gICAgLy8gQWRkaXRpb25hbCBhbGVydGluZyBsb2dpYyBjb3VsZCBiZSBhZGRlZCBoZXJlXG4gICAgLy8gRm9yIGV4YW1wbGUsIHNlbmRpbmcgbm90aWZpY2F0aW9ucyB0byBzZWN1cml0eSB0ZWFtc1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBhdWRpdFNlcnZpY2UgPSBuZXcgQXVkaXRTZXJ2aWNlKCk7Il19