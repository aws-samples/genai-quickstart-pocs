"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const audit_service_1 = require("../logging/audit-service");
const aws_sdk_1 = require("aws-sdk");
// Mock AWS SDK
jest.mock('aws-sdk', () => ({
    DynamoDB: {
        DocumentClient: jest.fn().mockImplementation(() => ({
            put: jest.fn().mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            }),
            query: jest.fn().mockReturnValue({
                promise: jest.fn().mockResolvedValue({
                    Items: [],
                    Count: 0
                })
            }),
            scan: jest.fn().mockReturnValue({
                promise: jest.fn().mockResolvedValue({
                    Items: [],
                    Count: 0
                })
            })
        }))
    }
}));
// Mock logger
jest.mock('../logging/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        critical: jest.fn()
    }
}));
describe('AuditService', () => {
    let auditService;
    let mockDynamoDB;
    beforeEach(() => {
        jest.clearAllMocks();
        auditService = new audit_service_1.AuditService();
        mockDynamoDB = aws_sdk_1.DynamoDB.DocumentClient.mock.results[0].value;
    });
    describe('recordAuditEvent', () => {
        it('should record audit event successfully', async () => {
            const eventData = {
                userId: 'user123',
                userRole: 'analyst',
                organizationId: 'org123',
                eventType: 'investment_idea_generation',
                resource: 'investment_ideas',
                action: 'POST /api/v1/ideas/generate',
                outcome: 'success',
                details: { requestId: 'req123' },
                riskLevel: 'medium',
                dataClassification: 'confidential'
            };
            const eventId = await auditService.recordAuditEvent(eventData);
            expect(eventId).toMatch(/^audit_\d+_[a-z0-9]+$/);
            expect(mockDynamoDB.put).toHaveBeenCalledWith(expect.objectContaining({
                TableName: 'investment-ai-audit-trail',
                Item: expect.objectContaining({
                    eventId,
                    userId: 'user123',
                    userRole: 'analyst',
                    organizationId: 'org123',
                    eventType: 'investment_idea_generation',
                    resource: 'investment_ideas',
                    action: 'POST /api/v1/ideas/generate',
                    outcome: 'success',
                    riskLevel: 'medium',
                    dataClassification: 'confidential',
                    ttl: expect.any(Number),
                    gsi1pk: 'org123#investment_idea_generation',
                    gsi1sk: expect.any(String),
                    gsi2pk: 'user123#investment_idea_generation',
                    gsi2sk: expect.any(String)
                })
            }));
        });
        it('should handle high-risk events', async () => {
            const eventData = {
                userId: 'user123',
                userRole: 'admin',
                organizationId: 'org123',
                eventType: 'security_event',
                resource: 'system_config',
                action: 'DELETE /api/v1/config',
                outcome: 'success',
                details: { configKey: 'sensitive_setting' },
                riskLevel: 'critical',
                dataClassification: 'restricted'
            };
            await auditService.recordAuditEvent(eventData);
            // Should log critical event
            const { logger } = require('../logging/logger');
            expect(logger.critical).toHaveBeenCalledWith('AuditService', 'handleHighRiskEvent', 'High-risk audit event detected', undefined, expect.objectContaining({
                eventType: 'security_event',
                riskLevel: 'critical'
            }));
        });
        it('should handle DynamoDB errors', async () => {
            mockDynamoDB.put.mockReturnValue({
                promise: jest.fn().mockRejectedValue(new Error('DynamoDB error'))
            });
            const eventData = {
                userId: 'user123',
                userRole: 'analyst',
                organizationId: 'org123',
                eventType: 'data_access',
                resource: 'market_data',
                action: 'GET /api/v1/market/data',
                outcome: 'success',
                details: {},
                riskLevel: 'low',
                dataClassification: 'public'
            };
            await expect(auditService.recordAuditEvent(eventData)).rejects.toThrow('DynamoDB error');
            const { logger } = require('../logging/logger');
            expect(logger.error).toHaveBeenCalledWith('AuditService', 'recordAuditEvent', 'Failed to record audit event', expect.any(Error), expect.objectContaining({
                eventType: 'data_access',
                userId: 'user123'
            }));
        });
    });
    describe('recordComplianceAudit', () => {
        it('should record compliance audit successfully', async () => {
            const auditData = {
                complianceRule: 'GDPR_DATA_PROTECTION',
                regulatoryFramework: 'GDPR',
                checkResult: 'compliant',
                details: {
                    ruleName: 'Data Protection Rule',
                    ruleVersion: '1.0',
                    checkCriteria: ['Data encryption', 'Access controls'],
                    findings: []
                },
                affectedResources: ['/api/v1/user/data'],
                userId: 'user123',
                organizationId: 'org123'
            };
            const auditId = await auditService.recordComplianceAudit(auditData);
            expect(auditId).toMatch(/^audit_\d+_[a-z0-9]+$/);
            expect(mockDynamoDB.put).toHaveBeenCalledWith(expect.objectContaining({
                TableName: 'investment-ai-compliance-audit',
                Item: expect.objectContaining({
                    auditId,
                    complianceRule: 'GDPR_DATA_PROTECTION',
                    regulatoryFramework: 'GDPR',
                    checkResult: 'compliant',
                    userId: 'user123',
                    organizationId: 'org123',
                    ttl: expect.any(Number),
                    gsi1pk: 'org123#GDPR',
                    gsi2pk: 'GDPR_DATA_PROTECTION#compliant'
                })
            }));
        });
    });
    describe('queryAuditEvents', () => {
        it('should query audit events by organization and event type', async () => {
            const mockEvents = [
                {
                    eventId: 'event1',
                    userId: 'user123',
                    organizationId: 'org123',
                    eventType: 'investment_idea_generation',
                    timestamp: new Date(),
                    outcome: 'success',
                    riskLevel: 'medium'
                }
            ];
            mockDynamoDB.query.mockReturnValue({
                promise: jest.fn().mockResolvedValue({
                    Items: mockEvents,
                    Count: 1
                })
            });
            const result = await auditService.queryAuditEvents({
                organizationId: 'org123',
                eventType: 'investment_idea_generation',
                limit: 50
            });
            expect(mockDynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({
                TableName: 'investment-ai-audit-trail',
                IndexName: 'GSI1',
                KeyConditionExpression: 'gsi1pk = :pk',
                ExpressionAttributeValues: {
                    ':pk': 'org123#investment_idea_generation'
                },
                Limit: 50
            }));
            expect(result.events).toHaveLength(1);
            expect(result.totalCount).toBe(1);
            expect(result.summary).toMatchObject({
                eventsByType: { investment_idea_generation: 1 },
                eventsByOutcome: { success: 1 },
                eventsByRiskLevel: { medium: 1 },
                uniqueUsers: 1
            });
        });
        it('should query audit events by user and event type', async () => {
            await auditService.queryAuditEvents({
                userId: 'user123',
                eventType: 'data_access',
                limit: 25
            });
            expect(mockDynamoDB.query).toHaveBeenCalledWith(expect.objectContaining({
                IndexName: 'GSI2',
                KeyConditionExpression: 'gsi2pk = :pk',
                ExpressionAttributeValues: {
                    ':pk': 'user123#data_access'
                }
            }));
        });
        it('should fallback to scan with filters', async () => {
            await auditService.queryAuditEvents({
                userId: 'user123',
                outcome: 'failure',
                riskLevel: 'high'
            });
            expect(mockDynamoDB.scan).toHaveBeenCalledWith(expect.objectContaining({
                FilterExpression: 'userId = :userId AND outcome = :outcome AND riskLevel = :riskLevel',
                ExpressionAttributeValues: {
                    ':userId': 'user123',
                    ':outcome': 'failure',
                    ':riskLevel': 'high'
                }
            }));
        });
        it('should filter events by date range', async () => {
            const startDate = new Date('2023-01-01');
            const endDate = new Date('2023-12-31');
            const mockEvents = [
                {
                    eventId: 'event1',
                    timestamp: new Date('2023-06-15'),
                    eventType: 'data_access',
                    outcome: 'success',
                    riskLevel: 'low',
                    userId: 'user1'
                },
                {
                    eventId: 'event2',
                    timestamp: new Date('2022-12-31'),
                    eventType: 'data_access',
                    outcome: 'success',
                    riskLevel: 'low',
                    userId: 'user2'
                }
            ];
            mockDynamoDB.scan.mockReturnValue({
                promise: jest.fn().mockResolvedValue({
                    Items: mockEvents,
                    Count: 2
                })
            });
            const result = await auditService.queryAuditEvents({
                startDate,
                endDate
            });
            expect(result.events).toHaveLength(1);
            expect(result.events[0].eventId).toBe('event1');
        });
    });
    describe('generateComplianceReport', () => {
        it('should generate compliance report', async () => {
            const mockAudits = [
                {
                    auditId: 'audit1',
                    complianceRule: 'RULE1',
                    checkResult: 'compliant',
                    timestamp: new Date()
                },
                {
                    auditId: 'audit2',
                    complianceRule: 'RULE2',
                    checkResult: 'non_compliant',
                    timestamp: new Date()
                },
                {
                    auditId: 'audit3',
                    complianceRule: 'RULE1',
                    checkResult: 'non_compliant',
                    timestamp: new Date()
                }
            ];
            mockDynamoDB.query.mockReturnValue({
                promise: jest.fn().mockResolvedValue({
                    Items: mockAudits
                })
            });
            const result = await auditService.generateComplianceReport('org123', 'GDPR');
            expect(result.summary).toMatchObject({
                totalAudits: 3,
                compliantCount: 1,
                nonCompliantCount: 2,
                warningCount: 0,
                complianceRate: expect.closeTo(33.33, 2),
                topViolations: expect.arrayContaining([
                    { rule: 'RULE1', count: 1 },
                    { rule: 'RULE2', count: 1 }
                ])
            });
        });
    });
    describe('error handling', () => {
        it('should handle query errors gracefully', async () => {
            mockDynamoDB.query.mockReturnValue({
                promise: jest.fn().mockRejectedValue(new Error('Query error'))
            });
            await expect(auditService.queryAuditEvents({
                organizationId: 'org123',
                eventType: 'data_access'
            })).rejects.toThrow('Query error');
            const { logger } = require('../logging/logger');
            expect(logger.error).toHaveBeenCalledWith('AuditService', 'queryAuditEvents', 'Failed to query audit events', expect.any(Error), expect.objectContaining({
                query: expect.objectContaining({
                    organizationId: 'org123',
                    eventType: 'data_access'
                })
            }));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXVkaXQtc2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3NlcnZpY2VzL19fdGVzdHNfXy9hdWRpdC1zZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw0REFBd0U7QUFDeEUscUNBQW1DO0FBRW5DLGVBQWU7QUFDZixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQzFCLFFBQVEsRUFBRTtRQUNSLGNBQWMsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsa0JBQWtCLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUNsRCxHQUFHLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLGVBQWUsQ0FBQztnQkFDN0IsT0FBTyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7YUFDekMsQ0FBQztZQUNGLEtBQUssRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsZUFBZSxDQUFDO2dCQUMvQixPQUFPLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDO29CQUNuQyxLQUFLLEVBQUUsRUFBRTtvQkFDVCxLQUFLLEVBQUUsQ0FBQztpQkFDVCxDQUFDO2FBQ0gsQ0FBQztZQUNGLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsZUFBZSxDQUFDO2dCQUM5QixPQUFPLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDO29CQUNuQyxLQUFLLEVBQUUsRUFBRTtvQkFDVCxLQUFLLEVBQUUsQ0FBQztpQkFDVCxDQUFDO2FBQ0gsQ0FBQztTQUNILENBQUMsQ0FBQztLQUNKO0NBQ0YsQ0FBQyxDQUFDLENBQUM7QUFFSixjQUFjO0FBQ2QsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFD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QUFDLENBQUM7WUFFVixNQUFNLE1BQU0sQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLENBQUM7Z0JBQ3pDLGNBQWMsRUFBRSxRQUFRO2dCQUN4QixTQUFTLEVBQUUsYUFBYTthQUN6QixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBRW5DLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUNoRCxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLG9CQUFvQixDQUN2QyxjQUFjLEVBQ2Qsa0JBQWtCLEVBQ2xCLDhCQUE4QixFQUM5QixNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUNqQixNQUFNLENBQUMsZ0JBQWdCLENBQUM7Z0JBQ3RCLEtBQUssRUFBRSxNQUFNLENBQUMsZ0JBQWdCLENBQUM7b0JBQzdCLGNBQWMsRUFBRSxRQUFRO29CQUN4QixTQUFTLEVBQUUsYUFBYTtpQkFDekIsQ0FBQzthQUNILENBQUMsQ0FDSCxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXVkaXRTZXJ2aWNlLCBBdWRpdEV2ZW50VHlwZSB9IGZyb20gJy4uL2xvZ2dpbmcvYXVkaXQtc2VydmljZSc7XG5pbXBvcnQgeyBEeW5hbW9EQiB9IGZyb20gJ2F3cy1zZGsnO1xuXG4vLyBNb2NrIEFXUyBTREtcbmplc3QubW9jaygnYXdzLXNkaycsICgpID0+ICh7XG4gIER5bmFtb0RCOiB7XG4gICAgRG9jdW1lbnRDbGllbnQ6IGplc3QuZm4oKS5tb2NrSW1wbGVtZW50YXRpb24oKCkgPT4gKHtcbiAgICAgIHB1dDogamVzdC5mbigpLm1vY2tSZXR1cm5WYWx1ZSh7XG4gICAgICAgIHByb21pc2U6IGplc3QuZm4oKS5tb2NrUmVzb2x2ZWRWYWx1ZSh7fSlcbiAgICAgIH0pLFxuICAgICAgcXVlcnk6IGplc3QuZm4oKS5tb2NrUmV0dXJuVmFsdWUoe1xuICAgICAgICBwcm9taXNlOiBqZXN0LmZuKCkubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgICAgIEl0ZW1zOiBbXSxcbiAgICAgICAgICBDb3VudDogMFxuICAgICAgICB9KVxuICAgICAgfSksXG4gICAgICBzY2FuOiBqZXN0LmZuKCkubW9ja1JldHVyblZhbHVlKHtcbiAgICAgICAgcHJvbWlzZTogamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgICBJdGVtczogW10sXG4gICAgICAgICAgQ291bnQ6IDBcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfSkpXG4gIH1cbn0pKTtcblxuLy8gTW9jayBsb2dnZXJcbmplc3QubW9jaygnLi4vbG9nZ2luZy9sb2dnZXInLCAoKSA9PiAoe1xuICBsb2dnZXI6IHtcbiAgICBpbmZvOiBqZXN0LmZuKCksXG4gICAgZXJyb3I6IGplc3QuZm4oKSxcbiAgICBjcml0aWNhbDogamVzdC5mbigpXG4gIH1cbn0pKTtcblxuZGVzY3JpYmUoJ0F1ZGl0U2VydmljZScsICgpID0+IHtcbiAgbGV0IGF1ZGl0U2VydmljZTogQXVkaXRTZXJ2aWNlO1xuICBsZXQgbW9ja0R5bmFtb0RCOiBqZXN0Lk1vY2tlZDxEeW5hbW9EQi5Eb2N1bWVudENsaWVudD47XG5cbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgamVzdC5jbGVhckFsbE1vY2tzKCk7XG4gICAgYXVkaXRTZXJ2aWNlID0gbmV3IEF1ZGl0U2VydmljZSgpO1xuICAgIG1vY2tEeW5hbW9EQiA9IChEeW5hbW9EQi5Eb2N1bWVudENsaWVudCBhcyBqZXN0Lk1vY2spLm1vY2sucmVzdWx0c1swXS52YWx1ZTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3JlY29yZEF1ZGl0RXZlbnQnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZWNvcmQgYXVkaXQgZXZlbnQgc3VjY2Vzc2Z1bGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZXZlbnREYXRhID0ge1xuICAgICAgICB1c2VySWQ6ICd1c2VyMTIzJyxcbiAgICAgICAgdXNlclJvbGU6ICdhbmFseXN0JyxcbiAgICAgICAgb3JnYW5pemF0aW9uSWQ6ICdvcmcxMjMnLFxuICAgICAgICBldmVudFR5cGU6ICdpbnZlc3RtZW50X2lkZWFfZ2VuZXJhdGlvbicgYXMgQXVkaXRFdmVudFR5cGUsXG4gICAgICAgIHJlc291cmNlOiAnaW52ZXN0bWVudF9pZGVhcycsXG4gICAgICAgIGFjdGlvbjogJ1BPU1QgL2FwaS92MS9pZGVhcy9nZW5lcmF0ZScsXG4gICAgICAgIG91dGNvbWU6ICdzdWNjZXNzJyBhcyBjb25zdCxcbiAgICAgICAgZGV0YWlsczogeyByZXF1ZXN0SWQ6ICdyZXExMjMnIH0sXG4gICAgICAgIHJpc2tMZXZlbDogJ21lZGl1bScgYXMgY29uc3QsXG4gICAgICAgIGRhdGFDbGFzc2lmaWNhdGlvbjogJ2NvbmZpZGVudGlhbCcgYXMgY29uc3RcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGV2ZW50SWQgPSBhd2FpdCBhdWRpdFNlcnZpY2UucmVjb3JkQXVkaXRFdmVudChldmVudERhdGEpO1xuXG4gICAgICBleHBlY3QoZXZlbnRJZCkudG9NYXRjaCgvXmF1ZGl0X1xcZCtfW2EtejAtOV0rJC8pO1xuICAgICAgZXhwZWN0KG1vY2tEeW5hbW9EQi5wdXQpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgVGFibGVOYW1lOiAnaW52ZXN0bWVudC1haS1hdWRpdC10cmFpbCcsXG4gICAgICAgICAgSXRlbTogZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgICAgZXZlbnRJZCxcbiAgICAgICAgICAgIHVzZXJJZDogJ3VzZXIxMjMnLFxuICAgICAgICAgICAgdXNlclJvbGU6ICdhbmFseXN0JyxcbiAgICAgICAgICAgIG9yZ2FuaXphdGlvbklkOiAnb3JnMTIzJyxcbiAgICAgICAgICAgIGV2ZW50VHlwZTogJ2ludmVzdG1lbnRfaWRlYV9nZW5lcmF0aW9uJyxcbiAgICAgICAgICAgIHJlc291cmNlOiAnaW52ZXN0bWVudF9pZGVhcycsXG4gICAgICAgICAgICBhY3Rpb246ICdQT1NUIC9hcGkvdjEvaWRlYXMvZ2VuZXJhdGUnLFxuICAgICAgICAgICAgb3V0Y29tZTogJ3N1Y2Nlc3MnLFxuICAgICAgICAgICAgcmlza0xldmVsOiAnbWVkaXVtJyxcbiAgICAgICAgICAgIGRhdGFDbGFzc2lmaWNhdGlvbjogJ2NvbmZpZGVudGlhbCcsXG4gICAgICAgICAgICB0dGw6IGV4cGVjdC5hbnkoTnVtYmVyKSxcbiAgICAgICAgICAgIGdzaTFwazogJ29yZzEyMyNpbnZlc3RtZW50X2lkZWFfZ2VuZXJhdGlvbicsXG4gICAgICAgICAgICBnc2kxc2s6IGV4cGVjdC5hbnkoU3RyaW5nKSxcbiAgICAgICAgICAgIGdzaTJwazogJ3VzZXIxMjMjaW52ZXN0bWVudF9pZGVhX2dlbmVyYXRpb24nLFxuICAgICAgICAgICAgZ3NpMnNrOiBleHBlY3QuYW55KFN0cmluZylcbiAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIGhpZ2gtcmlzayBldmVudHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBldmVudERhdGEgPSB7XG4gICAgICAgIHVzZXJJZDogJ3VzZXIxMjMnLFxuICAgICAgICB1c2VyUm9sZTogJ2FkbWluJyxcbiAgICAgICAgb3JnYW5pemF0aW9uSWQ6ICdvcmcxMjMnLFxuICAgICAgICBldmVudFR5cGU6ICdzZWN1cml0eV9ldmVudCcgYXMgQXVkaXRFdmVudFR5cGUsXG4gICAgICAgIHJlc291cmNlOiAnc3lzdGVtX2NvbmZpZycsXG4gICAgICAgIGFjdGlvbjogJ0RFTEVURSAvYXBpL3YxL2NvbmZpZycsXG4gICAgICAgIG91dGNvbWU6ICdzdWNjZXNzJyBhcyBjb25zdCxcbiAgICAgICAgZGV0YWlsczogeyBjb25maWdLZXk6ICdzZW5zaXRpdmVfc2V0dGluZycgfSxcbiAgICAgICAgcmlza0xldmVsOiAnY3JpdGljYWwnIGFzIGNvbnN0LFxuICAgICAgICBkYXRhQ2xhc3NpZmljYXRpb246ICdyZXN0cmljdGVkJyBhcyBjb25zdFxuICAgICAgfTtcblxuICAgICAgYXdhaXQgYXVkaXRTZXJ2aWNlLnJlY29yZEF1ZGl0RXZlbnQoZXZlbnREYXRhKTtcblxuICAgICAgLy8gU2hvdWxkIGxvZyBjcml0aWNhbCBldmVudFxuICAgICAgY29uc3QgeyBsb2dnZXIgfSA9IHJlcXVpcmUoJy4uL2xvZ2dpbmcvbG9nZ2VyJyk7XG4gICAgICBleHBlY3QobG9nZ2VyLmNyaXRpY2FsKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgJ0F1ZGl0U2VydmljZScsXG4gICAgICAgICdoYW5kbGVIaWdoUmlza0V2ZW50JyxcbiAgICAgICAgJ0hpZ2gtcmlzayBhdWRpdCBldmVudCBkZXRlY3RlZCcsXG4gICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIGV2ZW50VHlwZTogJ3NlY3VyaXR5X2V2ZW50JyxcbiAgICAgICAgICByaXNrTGV2ZWw6ICdjcml0aWNhbCdcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBEeW5hbW9EQiBlcnJvcnMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBtb2NrRHluYW1vREIucHV0Lm1vY2tSZXR1cm5WYWx1ZSh7XG4gICAgICAgIHByb21pc2U6IGplc3QuZm4oKS5tb2NrUmVqZWN0ZWRWYWx1ZShuZXcgRXJyb3IoJ0R5bmFtb0RCIGVycm9yJykpXG4gICAgICB9IGFzIGFueSk7XG5cbiAgICAgIGNvbnN0IGV2ZW50RGF0YSA9IHtcbiAgICAgICAgdXNlcklkOiAndXNlcjEyMycsXG4gICAgICAgIHVzZXJSb2xlOiAnYW5hbHlzdCcsXG4gICAgICAgIG9yZ2FuaXphdGlvbklkOiAnb3JnMTIzJyxcbiAgICAgICAgZXZlbnRUeXBlOiAnZGF0YV9hY2Nlc3MnIGFzIEF1ZGl0RXZlbnRUeXBlLFxuICAgICAgICByZXNvdXJjZTogJ21hcmtldF9kYXRhJyxcbiAgICAgICAgYWN0aW9uOiAnR0VUIC9hcGkvdjEvbWFya2V0L2RhdGEnLFxuICAgICAgICBvdXRjb21lOiAnc3VjY2VzcycgYXMgY29uc3QsXG4gICAgICAgIGRldGFpbHM6IHt9LFxuICAgICAgICByaXNrTGV2ZWw6ICdsb3cnIGFzIGNvbnN0LFxuICAgICAgICBkYXRhQ2xhc3NpZmljYXRpb246ICdwdWJsaWMnIGFzIGNvbnN0XG4gICAgICB9O1xuXG4gICAgICBhd2FpdCBleHBlY3QoYXVkaXRTZXJ2aWNlLnJlY29yZEF1ZGl0RXZlbnQoZXZlbnREYXRhKSkucmVqZWN0cy50b1Rocm93KCdEeW5hbW9EQiBlcnJvcicpO1xuXG4gICAgICBjb25zdCB7IGxvZ2dlciB9ID0gcmVxdWlyZSgnLi4vbG9nZ2luZy9sb2dnZXInKTtcbiAgICAgIGV4cGVjdChsb2dnZXIuZXJyb3IpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICAgICAgICAnQXVkaXRTZXJ2aWNlJyxcbiAgICAgICAgJ3JlY29yZEF1ZGl0RXZlbnQnLFxuICAgICAgICAnRmFpbGVkIHRvIHJlY29yZCBhdWRpdCBldmVudCcsXG4gICAgICAgIGV4cGVjdC5hbnkoRXJyb3IpLFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZXZlbnRUeXBlOiAnZGF0YV9hY2Nlc3MnLFxuICAgICAgICAgIHVzZXJJZDogJ3VzZXIxMjMnXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgncmVjb3JkQ29tcGxpYW5jZUF1ZGl0JywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcmVjb3JkIGNvbXBsaWFuY2UgYXVkaXQgc3VjY2Vzc2Z1bGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgYXVkaXREYXRhID0ge1xuICAgICAgICBjb21wbGlhbmNlUnVsZTogJ0dEUFJfREFUQV9QUk9URUNUSU9OJyxcbiAgICAgICAgcmVndWxhdG9yeUZyYW1ld29yazogJ0dEUFInLFxuICAgICAgICBjaGVja1Jlc3VsdDogJ2NvbXBsaWFudCcgYXMgY29uc3QsXG4gICAgICAgIGRldGFpbHM6IHtcbiAgICAgICAgICBydWxlTmFtZTogJ0RhdGEgUHJvdGVjdGlvbiBSdWxlJyxcbiAgICAgICAgICBydWxlVmVyc2lvbjogJzEuMCcsXG4gICAgICAgICAgY2hlY2tDcml0ZXJpYTogWydEYXRhIGVuY3J5cHRpb24nLCAnQWNjZXNzIGNvbnRyb2xzJ10sXG4gICAgICAgICAgZmluZGluZ3M6IFtdXG4gICAgICAgIH0sXG4gICAgICAgIGFmZmVjdGVkUmVzb3VyY2VzOiBbJy9hcGkvdjEvdXNlci9kYXRhJ10sXG4gICAgICAgIHVzZXJJZDogJ3VzZXIxMjMnLFxuICAgICAgICBvcmdhbml6YXRpb25JZDogJ29yZzEyMydcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGF1ZGl0SWQgPSBhd2FpdCBhdWRpdFNlcnZpY2UucmVjb3JkQ29tcGxpYW5jZUF1ZGl0KGF1ZGl0RGF0YSk7XG5cbiAgICAgIGV4cGVjdChhdWRpdElkKS50b01hdGNoKC9eYXVkaXRfXFxkK19bYS16MC05XSskLyk7XG4gICAgICBleHBlY3QobW9ja0R5bmFtb0RCLnB1dCkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXG4gICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICBUYWJsZU5hbWU6ICdpbnZlc3RtZW50LWFpLWNvbXBsaWFuY2UtYXVkaXQnLFxuICAgICAgICAgIEl0ZW06IGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICAgIGF1ZGl0SWQsXG4gICAgICAgICAgICBjb21wbGlhbmNlUnVsZTogJ0dEUFJfREFUQV9QUk9URUNUSU9OJyxcbiAgICAgICAgICAgIHJlZ3VsYXRvcnlGcmFtZXdvcms6ICdHRFBSJyxcbiAgICAgICAgICAgIGNoZWNrUmVzdWx0OiAnY29tcGxpYW50JyxcbiAgICAgICAgICAgIHVzZXJJZDogJ3VzZXIxMjMnLFxuICAgICAgICAgICAgb3JnYW5pemF0aW9uSWQ6ICdvcmcxMjMnLFxuICAgICAgICAgICAgdHRsOiBleHBlY3QuYW55KE51bWJlciksIC8vIDcgeWVhcnMgcmV0ZW50aW9uXG4gICAgICAgICAgICBnc2kxcGs6ICdvcmcxMjMjR0RQUicsXG4gICAgICAgICAgICBnc2kycGs6ICdHRFBSX0RBVEFfUFJPVEVDVElPTiNjb21wbGlhbnQnXG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdxdWVyeUF1ZGl0RXZlbnRzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcXVlcnkgYXVkaXQgZXZlbnRzIGJ5IG9yZ2FuaXphdGlvbiBhbmQgZXZlbnQgdHlwZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG1vY2tFdmVudHMgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICBldmVudElkOiAnZXZlbnQxJyxcbiAgICAgICAgICB1c2VySWQ6ICd1c2VyMTIzJyxcbiAgICAgICAgICBvcmdhbml6YXRpb25JZDogJ29yZzEyMycsXG4gICAgICAgICAgZXZlbnRUeXBlOiAnaW52ZXN0bWVudF9pZGVhX2dlbmVyYXRpb24nLFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgICBvdXRjb21lOiAnc3VjY2VzcycsXG4gICAgICAgICAgcmlza0xldmVsOiAnbWVkaXVtJ1xuICAgICAgICB9XG4gICAgICBdO1xuXG4gICAgICBtb2NrRHluYW1vREIucXVlcnkubW9ja1JldHVyblZhbHVlKHtcbiAgICAgICAgcHJvbWlzZTogamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgICBJdGVtczogbW9ja0V2ZW50cyxcbiAgICAgICAgICBDb3VudDogMVxuICAgICAgICB9KVxuICAgICAgfSBhcyBhbnkpO1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBhdWRpdFNlcnZpY2UucXVlcnlBdWRpdEV2ZW50cyh7XG4gICAgICAgIG9yZ2FuaXphdGlvbklkOiAnb3JnMTIzJyxcbiAgICAgICAgZXZlbnRUeXBlOiAnaW52ZXN0bWVudF9pZGVhX2dlbmVyYXRpb24nLFxuICAgICAgICBsaW1pdDogNTBcbiAgICAgIH0pO1xuXG4gICAgICBleHBlY3QobW9ja0R5bmFtb0RCLnF1ZXJ5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIFRhYmxlTmFtZTogJ2ludmVzdG1lbnQtYWktYXVkaXQtdHJhaWwnLFxuICAgICAgICAgIEluZGV4TmFtZTogJ0dTSTEnLFxuICAgICAgICAgIEtleUNvbmRpdGlvbkV4cHJlc3Npb246ICdnc2kxcGsgPSA6cGsnLFxuICAgICAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IHtcbiAgICAgICAgICAgICc6cGsnOiAnb3JnMTIzI2ludmVzdG1lbnRfaWRlYV9nZW5lcmF0aW9uJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgTGltaXQ6IDUwXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmV2ZW50cykudG9IYXZlTGVuZ3RoKDEpO1xuICAgICAgZXhwZWN0KHJlc3VsdC50b3RhbENvdW50KS50b0JlKDEpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5zdW1tYXJ5KS50b01hdGNoT2JqZWN0KHtcbiAgICAgICAgZXZlbnRzQnlUeXBlOiB7IGludmVzdG1lbnRfaWRlYV9nZW5lcmF0aW9uOiAxIH0sXG4gICAgICAgIGV2ZW50c0J5T3V0Y29tZTogeyBzdWNjZXNzOiAxIH0sXG4gICAgICAgIGV2ZW50c0J5Umlza0xldmVsOiB7IG1lZGl1bTogMSB9LFxuICAgICAgICB1bmlxdWVVc2VyczogMVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHF1ZXJ5IGF1ZGl0IGV2ZW50cyBieSB1c2VyIGFuZCBldmVudCB0eXBlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgYXVkaXRTZXJ2aWNlLnF1ZXJ5QXVkaXRFdmVudHMoe1xuICAgICAgICB1c2VySWQ6ICd1c2VyMTIzJyxcbiAgICAgICAgZXZlbnRUeXBlOiAnZGF0YV9hY2Nlc3MnLFxuICAgICAgICBsaW1pdDogMjVcbiAgICAgIH0pO1xuXG4gICAgICBleHBlY3QobW9ja0R5bmFtb0RCLnF1ZXJ5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIEluZGV4TmFtZTogJ0dTSTInLFxuICAgICAgICAgIEtleUNvbmRpdGlvbkV4cHJlc3Npb246ICdnc2kycGsgPSA6cGsnLFxuICAgICAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IHtcbiAgICAgICAgICAgICc6cGsnOiAndXNlcjEyMyNkYXRhX2FjY2VzcydcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBmYWxsYmFjayB0byBzY2FuIHdpdGggZmlsdGVycycsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IGF1ZGl0U2VydmljZS5xdWVyeUF1ZGl0RXZlbnRzKHtcbiAgICAgICAgdXNlcklkOiAndXNlcjEyMycsXG4gICAgICAgIG91dGNvbWU6ICdmYWlsdXJlJyxcbiAgICAgICAgcmlza0xldmVsOiAnaGlnaCdcbiAgICAgIH0pO1xuXG4gICAgICBleHBlY3QobW9ja0R5bmFtb0RCLnNjYW4pLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgRmlsdGVyRXhwcmVzc2lvbjogJ3VzZXJJZCA9IDp1c2VySWQgQU5EIG91dGNvbWUgPSA6b3V0Y29tZSBBTkQgcmlza0xldmVsID0gOnJpc2tMZXZlbCcsXG4gICAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xuICAgICAgICAgICAgJzp1c2VySWQnOiAndXNlcjEyMycsXG4gICAgICAgICAgICAnOm91dGNvbWUnOiAnZmFpbHVyZScsXG4gICAgICAgICAgICAnOnJpc2tMZXZlbCc6ICdoaWdoJ1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGZpbHRlciBldmVudHMgYnkgZGF0ZSByYW5nZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHN0YXJ0RGF0ZSA9IG5ldyBEYXRlKCcyMDIzLTAxLTAxJyk7XG4gICAgICBjb25zdCBlbmREYXRlID0gbmV3IERhdGUoJzIwMjMtMTItMzEnKTtcbiAgICAgIGNvbnN0IG1vY2tFdmVudHMgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICBldmVudElkOiAnZXZlbnQxJyxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCcyMDIzLTA2LTE1JyksXG4gICAgICAgICAgZXZlbnRUeXBlOiAnZGF0YV9hY2Nlc3MnLFxuICAgICAgICAgIG91dGNvbWU6ICdzdWNjZXNzJyxcbiAgICAgICAgICByaXNrTGV2ZWw6ICdsb3cnLFxuICAgICAgICAgIHVzZXJJZDogJ3VzZXIxJ1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZXZlbnRJZDogJ2V2ZW50MicsXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgnMjAyMi0xMi0zMScpLCAvLyBTaG91bGQgYmUgZmlsdGVyZWQgb3V0XG4gICAgICAgICAgZXZlbnRUeXBlOiAnZGF0YV9hY2Nlc3MnLFxuICAgICAgICAgIG91dGNvbWU6ICdzdWNjZXNzJyxcbiAgICAgICAgICByaXNrTGV2ZWw6ICdsb3cnLFxuICAgICAgICAgIHVzZXJJZDogJ3VzZXIyJ1xuICAgICAgICB9XG4gICAgICBdO1xuXG4gICAgICBtb2NrRHluYW1vREIuc2Nhbi5tb2NrUmV0dXJuVmFsdWUoe1xuICAgICAgICBwcm9taXNlOiBqZXN0LmZuKCkubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgICAgIEl0ZW1zOiBtb2NrRXZlbnRzLFxuICAgICAgICAgIENvdW50OiAyXG4gICAgICAgIH0pXG4gICAgICB9IGFzIGFueSk7XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGF1ZGl0U2VydmljZS5xdWVyeUF1ZGl0RXZlbnRzKHtcbiAgICAgICAgc3RhcnREYXRlLFxuICAgICAgICBlbmREYXRlXG4gICAgICB9KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5ldmVudHMpLnRvSGF2ZUxlbmd0aCgxKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXZlbnRzWzBdLmV2ZW50SWQpLnRvQmUoJ2V2ZW50MScpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZ2VuZXJhdGVDb21wbGlhbmNlUmVwb3J0JywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZ2VuZXJhdGUgY29tcGxpYW5jZSByZXBvcnQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBtb2NrQXVkaXRzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgYXVkaXRJZDogJ2F1ZGl0MScsXG4gICAgICAgICAgY29tcGxpYW5jZVJ1bGU6ICdSVUxFMScsXG4gICAgICAgICAgY2hlY2tSZXN1bHQ6ICdjb21wbGlhbnQnLFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgYXVkaXRJZDogJ2F1ZGl0MicsXG4gICAgICAgICAgY29tcGxpYW5jZVJ1bGU6ICdSVUxFMicsXG4gICAgICAgICAgY2hlY2tSZXN1bHQ6ICdub25fY29tcGxpYW50JyxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKClcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGF1ZGl0SWQ6ICdhdWRpdDMnLFxuICAgICAgICAgIGNvbXBsaWFuY2VSdWxlOiAnUlVMRTEnLFxuICAgICAgICAgIGNoZWNrUmVzdWx0OiAnbm9uX2NvbXBsaWFudCcsXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpXG4gICAgICAgIH1cbiAgICAgIF07XG5cbiAgICAgIG1vY2tEeW5hbW9EQi5xdWVyeS5tb2NrUmV0dXJuVmFsdWUoe1xuICAgICAgICBwcm9taXNlOiBqZXN0LmZuKCkubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgICAgIEl0ZW1zOiBtb2NrQXVkaXRzXG4gICAgICAgIH0pXG4gICAgICB9IGFzIGFueSk7XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGF1ZGl0U2VydmljZS5nZW5lcmF0ZUNvbXBsaWFuY2VSZXBvcnQoJ29yZzEyMycsICdHRFBSJyk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuc3VtbWFyeSkudG9NYXRjaE9iamVjdCh7XG4gICAgICAgIHRvdGFsQXVkaXRzOiAzLFxuICAgICAgICBjb21wbGlhbnRDb3VudDogMSxcbiAgICAgICAgbm9uQ29tcGxpYW50Q291bnQ6IDIsXG4gICAgICAgIHdhcm5pbmdDb3VudDogMCxcbiAgICAgICAgY29tcGxpYW5jZVJhdGU6IGV4cGVjdC5jbG9zZVRvKDMzLjMzLCAyKSxcbiAgICAgICAgdG9wVmlvbGF0aW9uczogZXhwZWN0LmFycmF5Q29udGFpbmluZyhbXG4gICAgICAgICAgeyBydWxlOiAnUlVMRTEnLCBjb3VudDogMSB9LFxuICAgICAgICAgIHsgcnVsZTogJ1JVTEUyJywgY291bnQ6IDEgfVxuICAgICAgICBdKVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdlcnJvciBoYW5kbGluZycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBxdWVyeSBlcnJvcnMgZ3JhY2VmdWxseScsIGFzeW5jICgpID0+IHtcbiAgICAgIG1vY2tEeW5hbW9EQi5xdWVyeS5tb2NrUmV0dXJuVmFsdWUoe1xuICAgICAgICBwcm9taXNlOiBqZXN0LmZuKCkubW9ja1JlamVjdGVkVmFsdWUobmV3IEVycm9yKCdRdWVyeSBlcnJvcicpKVxuICAgICAgfSBhcyBhbnkpO1xuXG4gICAgICBhd2FpdCBleHBlY3QoYXVkaXRTZXJ2aWNlLnF1ZXJ5QXVkaXRFdmVudHMoe1xuICAgICAgICBvcmdhbml6YXRpb25JZDogJ29yZzEyMycsXG4gICAgICAgIGV2ZW50VHlwZTogJ2RhdGFfYWNjZXNzJ1xuICAgICAgfSkpLnJlamVjdHMudG9UaHJvdygnUXVlcnkgZXJyb3InKTtcblxuICAgICAgY29uc3QgeyBsb2dnZXIgfSA9IHJlcXVpcmUoJy4uL2xvZ2dpbmcvbG9nZ2VyJyk7XG4gICAgICBleHBlY3QobG9nZ2VyLmVycm9yKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgJ0F1ZGl0U2VydmljZScsXG4gICAgICAgICdxdWVyeUF1ZGl0RXZlbnRzJyxcbiAgICAgICAgJ0ZhaWxlZCB0byBxdWVyeSBhdWRpdCBldmVudHMnLFxuICAgICAgICBleHBlY3QuYW55KEVycm9yKSxcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIHF1ZXJ5OiBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgICBvcmdhbml6YXRpb25JZDogJ29yZzEyMycsXG4gICAgICAgICAgICBldmVudFR5cGU6ICdkYXRhX2FjY2VzcydcbiAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcbiAgfSk7XG59KTsiXX0=