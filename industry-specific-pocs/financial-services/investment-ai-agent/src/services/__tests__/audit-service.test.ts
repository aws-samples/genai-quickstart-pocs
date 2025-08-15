import { AuditService, AuditEventType } from '../logging/audit-service';
import { DynamoDB } from 'aws-sdk';

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
  let auditService: AuditService;
  let mockDynamoDB: jest.Mocked<DynamoDB.DocumentClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    auditService = new AuditService();
    mockDynamoDB = (DynamoDB.DocumentClient as jest.Mock).mock.results[0].value;
  });

  describe('recordAuditEvent', () => {
    it('should record audit event successfully', async () => {
      const eventData = {
        userId: 'user123',
        userRole: 'analyst',
        organizationId: 'org123',
        eventType: 'investment_idea_generation' as AuditEventType,
        resource: 'investment_ideas',
        action: 'POST /api/v1/ideas/generate',
        outcome: 'success' as const,
        details: { requestId: 'req123' },
        riskLevel: 'medium' as const,
        dataClassification: 'confidential' as const
      };

      const eventId = await auditService.recordAuditEvent(eventData);

      expect(eventId).toMatch(/^audit_\d+_[a-z0-9]+$/);
      expect(mockDynamoDB.put).toHaveBeenCalledWith(
        expect.objectContaining({
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
        })
      );
    });

    it('should handle high-risk events', async () => {
      const eventData = {
        userId: 'user123',
        userRole: 'admin',
        organizationId: 'org123',
        eventType: 'security_event' as AuditEventType,
        resource: 'system_config',
        action: 'DELETE /api/v1/config',
        outcome: 'success' as const,
        details: { configKey: 'sensitive_setting' },
        riskLevel: 'critical' as const,
        dataClassification: 'restricted' as const
      };

      await auditService.recordAuditEvent(eventData);

      // Should log critical event
      const { logger } = require('../logging/logger');
      expect(logger.critical).toHaveBeenCalledWith(
        'AuditService',
        'handleHighRiskEvent',
        'High-risk audit event detected',
        undefined,
        expect.objectContaining({
          eventType: 'security_event',
          riskLevel: 'critical'
        })
      );
    });

    it('should handle DynamoDB errors', async () => {
      mockDynamoDB.put.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('DynamoDB error'))
      } as any);

      const eventData = {
        userId: 'user123',
        userRole: 'analyst',
        organizationId: 'org123',
        eventType: 'data_access' as AuditEventType,
        resource: 'market_data',
        action: 'GET /api/v1/market/data',
        outcome: 'success' as const,
        details: {},
        riskLevel: 'low' as const,
        dataClassification: 'public' as const
      };

      await expect(auditService.recordAuditEvent(eventData)).rejects.toThrow('DynamoDB error');

      const { logger } = require('../logging/logger');
      expect(logger.error).toHaveBeenCalledWith(
        'AuditService',
        'recordAuditEvent',
        'Failed to record audit event',
        expect.any(Error),
        expect.objectContaining({
          eventType: 'data_access',
          userId: 'user123'
        })
      );
    });
  });

  describe('recordComplianceAudit', () => {
    it('should record compliance audit successfully', async () => {
      const auditData = {
        complianceRule: 'GDPR_DATA_PROTECTION',
        regulatoryFramework: 'GDPR',
        checkResult: 'compliant' as const,
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
      expect(mockDynamoDB.put).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'investment-ai-compliance-audit',
          Item: expect.objectContaining({
            auditId,
            complianceRule: 'GDPR_DATA_PROTECTION',
            regulatoryFramework: 'GDPR',
            checkResult: 'compliant',
            userId: 'user123',
            organizationId: 'org123',
            ttl: expect.any(Number), // 7 years retention
            gsi1pk: 'org123#GDPR',
            gsi2pk: 'GDPR_DATA_PROTECTION#compliant'
          })
        })
      );
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
      } as any);

      const result = await auditService.queryAuditEvents({
        organizationId: 'org123',
        eventType: 'investment_idea_generation',
        limit: 50
      });

      expect(mockDynamoDB.query).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'investment-ai-audit-trail',
          IndexName: 'GSI1',
          KeyConditionExpression: 'gsi1pk = :pk',
          ExpressionAttributeValues: {
            ':pk': 'org123#investment_idea_generation'
          },
          Limit: 50
        })
      );

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

      expect(mockDynamoDB.query).toHaveBeenCalledWith(
        expect.objectContaining({
          IndexName: 'GSI2',
          KeyConditionExpression: 'gsi2pk = :pk',
          ExpressionAttributeValues: {
            ':pk': 'user123#data_access'
          }
        })
      );
    });

    it('should fallback to scan with filters', async () => {
      await auditService.queryAuditEvents({
        userId: 'user123',
        outcome: 'failure',
        riskLevel: 'high'
      });

      expect(mockDynamoDB.scan).toHaveBeenCalledWith(
        expect.objectContaining({
          FilterExpression: 'userId = :userId AND outcome = :outcome AND riskLevel = :riskLevel',
          ExpressionAttributeValues: {
            ':userId': 'user123',
            ':outcome': 'failure',
            ':riskLevel': 'high'
          }
        })
      );
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
          timestamp: new Date('2022-12-31'), // Should be filtered out
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
      } as any);

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
      } as any);

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
      } as any);

      await expect(auditService.queryAuditEvents({
        organizationId: 'org123',
        eventType: 'data_access'
      })).rejects.toThrow('Query error');

      const { logger } = require('../logging/logger');
      expect(logger.error).toHaveBeenCalledWith(
        'AuditService',
        'queryAuditEvents',
        'Failed to query audit events',
        expect.any(Error),
        expect.objectContaining({
          query: expect.objectContaining({
            organizationId: 'org123',
            eventType: 'data_access'
          })
        })
      );
    });
  });
});