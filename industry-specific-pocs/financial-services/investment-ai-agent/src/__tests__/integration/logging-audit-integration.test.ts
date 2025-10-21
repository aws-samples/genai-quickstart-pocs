/**
 * Integration tests for logging and auditing system
 */

import request from 'supertest';
import app from '../../api/server';
import { logger } from '../../services/logging/logger';
import { auditService } from '../../services/logging/audit-service';
import { logAnalysisService } from '../../services/logging/log-analysis-service';

// Mock AWS services
jest.mock('aws-sdk', () => ({
  CloudWatchLogs: jest.fn().mockImplementation(() => ({
    createLogGroup: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    }),
    createLogStream: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    }),
    putLogEvents: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ nextSequenceToken: 'token123' })
    }),
    filterLogEvents: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        events: []
      })
    })
  })),
  CloudWatch: jest.fn().mockImplementation(() => ({
    putDashboard: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    })
  })),
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

describe('Logging and Auditing Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API Request Logging', () => {
    it('should log API requests and responses', async () => {
      const loggerSpy = jest.spyOn(logger, 'info');

      const response = await request(app)
        .get('/health')
        .set('x-user-id', 'test-user')
        .set('x-organization-id', 'test-org')
        .expect(200);

      expect(response.headers['x-request-id']).toBeDefined();
      
      // Should log the request
      expect(loggerSpy).toHaveBeenCalledWith(
        'API',
        'request',
        'GET /health',
        expect.objectContaining({
          method: 'GET',
          path: '/health'
        }),
        expect.objectContaining({
          userId: 'test-user',
          organizationId: 'test-org'
        })
      );

      // Should log the response
      expect(loggerSpy).toHaveBeenCalledWith(
        'API',
        'response',
        'GET /health - 200',
        expect.objectContaining({
          statusCode: 200,
          responseTime: expect.any(Number)
        }),
        expect.objectContaining({
          userId: 'test-user',
          organizationId: 'test-org'
        })
      );
    });

    it('should log error responses', async () => {
      const loggerSpy = jest.spyOn(logger, 'warn');

      await request(app)
        .get('/nonexistent-endpoint')
        .set('x-user-id', 'test-user')
        .set('x-organization-id', 'test-org')
        .expect(404);

      expect(loggerSpy).toHaveBeenCalledWith(
        'API',
        'error_response',
        expect.stringContaining('GET /nonexistent-endpoint - 404'),
        expect.objectContaining({
          statusCode: 404
        }),
        expect.objectContaining({
          userId: 'test-user'
        })
      );
    });

    it('should sanitize sensitive data in request logs', async () => {
      const loggerSpy = jest.spyOn(logger, 'info');

      await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'secretpassword',
          token: 'sensitive-token'
        })
        .set('x-user-id', 'test-user')
        .set('authorization', 'Bearer secret-token');

      const requestLogCall = loggerSpy.mock.calls.find(call => 
        call[1] === 'request' && call[2].includes('POST /api/auth/login')
      );

      expect(requestLogCall).toBeDefined();
      const loggedBody = requestLogCall![3].body;
      expect(loggedBody.password).toBe('[REDACTED]');
      expect(loggedBody.token).toBe('[REDACTED]');
      expect(loggedBody.username).toBe('testuser'); // Non-sensitive data should remain

      const loggedHeaders = requestLogCall![3].headers;
      expect(loggedHeaders.authorization).toBe('[REDACTED]');
    });
  });

  describe('Audit Trail', () => {
    it('should record audit events for sensitive operations', async () => {
      const auditSpy = jest.spyOn(auditService, 'recordAuditEvent');

      // Mock a protected route that uses audit middleware
      await request(app)
        .post('/api/v1/ideas/generate')
        .send({
          investmentHorizon: 'long',
          riskTolerance: 'moderate',
          sectors: ['technology', 'healthcare']
        })
        .set('x-user-id', 'test-user')
        .set('x-user-role', 'analyst')
        .set('x-organization-id', 'test-org')
        .set('x-session-id', 'test-session');

      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user',
          userRole: 'analyst',
          organizationId: 'test-org',
          eventType: 'investment_idea_generation',
          resource: 'investment_ideas',
          action: 'POST /api/v1/ideas/generate',
          outcome: 'success',
          riskLevel: 'medium',
          dataClassification: 'confidential'
        })
      );
    });

    it('should record compliance audit events', async () => {
      const complianceAuditSpy = jest.spyOn(auditService, 'recordComplianceAudit');

      // This would be triggered by compliance middleware on sensitive endpoints
      await auditService.recordComplianceAudit({
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
        userId: 'test-user',
        organizationId: 'test-org'
      });

      expect(complianceAuditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          complianceRule: 'GDPR_DATA_PROTECTION',
          regulatoryFramework: 'GDPR',
          checkResult: 'compliant',
          userId: 'test-user',
          organizationId: 'test-org'
        })
      );
    });

    it('should handle high-risk audit events', async () => {
      const loggerCriticalSpy = jest.spyOn(logger, 'critical');

      await auditService.recordAuditEvent({
        userId: 'admin-user',
        userRole: 'admin',
        organizationId: 'test-org',
        eventType: 'security_event',
        resource: 'system_config',
        action: 'DELETE /api/admin/config',
        outcome: 'success',
        details: { configKey: 'sensitive_setting' },
        riskLevel: 'critical',
        dataClassification: 'restricted'
      });

      expect(loggerCriticalSpy).toHaveBeenCalledWith(
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
  });

  describe('Log Analysis', () => {
    it('should analyze logs and provide insights', async () => {
      const mockLogEvents = [
        {
          message: JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            service: 'API',
            operation: 'request',
            message: 'GET /health',
            metadata: { responseTime: 50 }
          })
        },
        {
          message: JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            service: 'API',
            operation: 'request',
            message: 'POST /api/v1/ideas/generate failed',
            metadata: { error: { name: 'ValidationError' } }
          })
        }
      ];

      const { CloudWatchLogs } = require('aws-sdk');
      const mockCloudWatchLogs = CloudWatchLogs.mock.results[0].value;
      mockCloudWatchLogs.filterLogEvents.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          events: mockLogEvents
        })
      });

      const analysis = await logAnalysisService.analyzeLogs({
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endTime: new Date()
      });

      expect(analysis.insights).toHaveLength(2);
      expect(analysis.metrics.totalLogs).toBe(2);
      expect(analysis.metrics.errorRate).toBe(50);
      expect(analysis.patterns).toBeDefined();
      expect(analysis.anomalies).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
    });

    it('should analyze compliance logs', async () => {
      const mockComplianceEvents = [
        {
          eventId: 'event1',
          eventType: 'compliance_check',
          outcome: 'success',
          complianceFlags: [],
          details: { regulatoryFramework: 'GDPR' },
          timestamp: new Date()
        },
        {
          eventId: 'event2',
          eventType: 'compliance_check',
          outcome: 'failure',
          complianceFlags: ['violation'],
          details: { regulatoryFramework: 'SOX' },
          timestamp: new Date()
        }
      ];

      jest.spyOn(auditService, 'queryAuditEvents').mockResolvedValue({
        events: mockComplianceEvents,
        totalCount: 2,
        summary: {
          eventsByType: { compliance_check: 2 },
          eventsByOutcome: { success: 1, failure: 1 },
          eventsByRiskLevel: { low: 1, high: 1 },
          uniqueUsers: 2,
          timeRange: { start: new Date(), end: new Date() }
        }
      });

      const analysis = await logAnalysisService.analyzeComplianceLogs('test-org');

      expect(analysis.complianceEvents).toBe(2);
      expect(analysis.violations).toBe(1);
      expect(analysis.complianceRate).toBe(50);
      expect(analysis.regulatoryFrameworks).toEqual(['GDPR', 'SOX']);
    });

    it('should analyze security logs', async () => {
      const mockSecurityEvents = [
        {
          eventId: 'event1',
          eventType: 'security_event',
          outcome: 'success',
          riskLevel: 'high',
          userId: 'user1',
          timestamp: new Date()
        }
      ];

      const mockAuthEvents = [
        {
          eventId: 'event2',
          eventType: 'user_authentication',
          outcome: 'failure',
          riskLevel: 'medium',
          userId: 'user2',
          timestamp: new Date()
        }
      ];

      jest.spyOn(auditService, 'queryAuditEvents')
        .mockResolvedValueOnce({
          events: mockSecurityEvents,
          totalCount: 1,
          summary: {
            eventsByType: { security_event: 1 },
            eventsByOutcome: { success: 1 },
            eventsByRiskLevel: { high: 1 },
            uniqueUsers: 1,
            timeRange: { start: new Date(), end: new Date() }
          }
        })
        .mockResolvedValueOnce({
          events: mockAuthEvents,
          totalCount: 1,
          summary: {
            eventsByType: { user_authentication: 1 },
            eventsByOutcome: { failure: 1 },
            eventsByRiskLevel: { medium: 1 },
            uniqueUsers: 1,
            timeRange: { start: new Date(), end: new Date() }
          }
        });

      const analysis = await logAnalysisService.analyzeSecurityLogs('test-org');

      expect(analysis.securityEvents).toBe(2);
      expect(analysis.threatLevel).toBe('high');
      expect(analysis.suspiciousActivities).toContainEqual({
        type: 'user_authentication_failure',
        count: 1,
        severity: 'low'
      });
      expect(analysis.accessPatterns).toHaveLength(2);
    });

    it('should create CloudWatch dashboard', async () => {
      const { CloudWatch } = require('aws-sdk');
      const mockCloudWatch = CloudWatch.mock.results[0].value;

      const result = await logAnalysisService.createLogDashboard('test-org');

      expect(mockCloudWatch.putDashboard).toHaveBeenCalledWith(
        expect.objectContaining({
          DashboardName: 'InvestmentAI-test-org-Logs',
          DashboardBody: expect.stringContaining('Error Rate')
        })
      );

      expect(result.dashboardUrl).toContain('InvestmentAI-test-org-Logs');
      expect(result.widgets).toHaveLength(5);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should continue processing even if audit logging fails', async () => {
      jest.spyOn(auditService, 'recordAuditEvent').mockRejectedValue(new Error('Audit service unavailable'));
      const loggerErrorSpy = jest.spyOn(logger, 'error');

      const response = await request(app)
        .get('/health')
        .set('x-user-id', 'test-user')
        .set('x-organization-id', 'test-org')
        .expect(200);

      expect(response.body).toEqual({ status: 'ok' });
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.stringContaining('audit'),
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('should fallback to console logging when CloudWatch is unavailable', async () => {
      const { CloudWatchLogs } = require('aws-sdk');
      const mockCloudWatchLogs = CloudWatchLogs.mock.results[0].value;
      mockCloudWatchLogs.putLogEvents.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('CloudWatch unavailable'))
      });

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await logger.info('TestService', 'testOperation', 'Test message');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to send logs to CloudWatch:', expect.any(Error));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Test message'));

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle DynamoDB failures gracefully', async () => {
      const { DynamoDB } = require('aws-sdk');
      const mockDynamoDB = DynamoDB.DocumentClient.mock.results[0].value;
      mockDynamoDB.put.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('DynamoDB unavailable'))
      });

      const loggerErrorSpy = jest.spyOn(logger, 'error');

      await expect(auditService.recordAuditEvent({
        userId: 'test-user',
        userRole: 'user',
        organizationId: 'test-org',
        eventType: 'data_access',
        resource: 'test_resource',
        action: 'GET /test',
        outcome: 'success',
        details: {},
        riskLevel: 'low',
        dataClassification: 'public'
      })).rejects.toThrow('DynamoDB unavailable');

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'AuditService',
        'recordAuditEvent',
        'Failed to record audit event',
        expect.any(Error),
        expect.objectContaining({
          eventType: 'data_access',
          userId: 'test-user'
        })
      );
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle batch logging efficiently', async () => {
      const entries = Array(100).fill(null).map((_, i) => ({
        timestamp: new Date(),
        level: 'INFO' as const,
        service: 'TestService',
        operation: 'batchTest',
        message: `Batch message ${i}`,
        metadata: { index: i }
      }));

      const { CloudWatchLogs } = require('aws-sdk');
      const mockCloudWatchLogs = CloudWatchLogs.mock.results[0].value;

      await logger.batch(entries);

      expect(mockCloudWatchLogs.putLogEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          logEvents: expect.arrayContaining([
            expect.objectContaining({
              message: expect.stringContaining('Batch message 0')
            }),
            expect.objectContaining({
              message: expect.stringContaining('Batch message 99')
            })
          ])
        })
      );
    });

    it('should handle concurrent audit events', async () => {
      const auditPromises = Array(10).fill(null).map((_, i) => 
        auditService.recordAuditEvent({
          userId: `user-${i}`,
          userRole: 'user',
          organizationId: 'test-org',
          eventType: 'data_access',
          resource: `resource-${i}`,
          action: `GET /test/${i}`,
          outcome: 'success',
          details: { index: i },
          riskLevel: 'low',
          dataClassification: 'public'
        })
      );

      const results = await Promise.all(auditPromises);
      expect(results).toHaveLength(10);
      results.forEach(eventId => {
        expect(eventId).toMatch(/^audit_\d+_[a-z0-9]+$/);
      });
    });
  });
});