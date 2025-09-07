"use strict";
/**
 * Integration tests for logging and auditing system
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = __importDefault(require("../../api/server"));
const logger_1 = require("../../services/logging/logger");
const audit_service_1 = require("../../services/logging/audit-service");
const log_analysis_service_1 = require("../../services/logging/log-analysis-service");
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
            const loggerSpy = jest.spyOn(logger_1.logger, 'info');
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/health')
                .set('x-user-id', 'test-user')
                .set('x-organization-id', 'test-org')
                .expect(200);
            expect(response.headers['x-request-id']).toBeDefined();
            // Should log the request
            expect(loggerSpy).toHaveBeenCalledWith('API', 'request', 'GET /health', expect.objectContaining({
                method: 'GET',
                path: '/health'
            }), expect.objectContaining({
                userId: 'test-user',
                organizationId: 'test-org'
            }));
            // Should log the response
            expect(loggerSpy).toHaveBeenCalledWith('API', 'response', 'GET /health - 200', expect.objectContaining({
                statusCode: 200,
                responseTime: expect.any(Number)
            }), expect.objectContaining({
                userId: 'test-user',
                organizationId: 'test-org'
            }));
        });
        it('should log error responses', async () => {
            const loggerSpy = jest.spyOn(logger_1.logger, 'warn');
            await (0, supertest_1.default)(server_1.default)
                .get('/nonexistent-endpoint')
                .set('x-user-id', 'test-user')
                .set('x-organization-id', 'test-org')
                .expect(404);
            expect(loggerSpy).toHaveBeenCalledWith('API', 'error_response', expect.stringContaining('GET /nonexistent-endpoint - 404'), expect.objectContaining({
                statusCode: 404
            }), expect.objectContaining({
                userId: 'test-user'
            }));
        });
        it('should sanitize sensitive data in request logs', async () => {
            const loggerSpy = jest.spyOn(logger_1.logger, 'info');
            await (0, supertest_1.default)(server_1.default)
                .post('/api/auth/login')
                .send({
                username: 'testuser',
                password: 'secretpassword',
                token: 'sensitive-token'
            })
                .set('x-user-id', 'test-user')
                .set('authorization', 'Bearer secret-token');
            const requestLogCall = loggerSpy.mock.calls.find(call => call[1] === 'request' && call[2].includes('POST /api/auth/login'));
            expect(requestLogCall).toBeDefined();
            const loggedBody = requestLogCall[3].body;
            expect(loggedBody.password).toBe('[REDACTED]');
            expect(loggedBody.token).toBe('[REDACTED]');
            expect(loggedBody.username).toBe('testuser'); // Non-sensitive data should remain
            const loggedHeaders = requestLogCall[3].headers;
            expect(loggedHeaders.authorization).toBe('[REDACTED]');
        });
    });
    describe('Audit Trail', () => {
        it('should record audit events for sensitive operations', async () => {
            const auditSpy = jest.spyOn(audit_service_1.auditService, 'recordAuditEvent');
            // Mock a protected route that uses audit middleware
            await (0, supertest_1.default)(server_1.default)
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
            expect(auditSpy).toHaveBeenCalledWith(expect.objectContaining({
                userId: 'test-user',
                userRole: 'analyst',
                organizationId: 'test-org',
                eventType: 'investment_idea_generation',
                resource: 'investment_ideas',
                action: 'POST /api/v1/ideas/generate',
                outcome: 'success',
                riskLevel: 'medium',
                dataClassification: 'confidential'
            }));
        });
        it('should record compliance audit events', async () => {
            const complianceAuditSpy = jest.spyOn(audit_service_1.auditService, 'recordComplianceAudit');
            // This would be triggered by compliance middleware on sensitive endpoints
            await audit_service_1.auditService.recordComplianceAudit({
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
            expect(complianceAuditSpy).toHaveBeenCalledWith(expect.objectContaining({
                complianceRule: 'GDPR_DATA_PROTECTION',
                regulatoryFramework: 'GDPR',
                checkResult: 'compliant',
                userId: 'test-user',
                organizationId: 'test-org'
            }));
        });
        it('should handle high-risk audit events', async () => {
            const loggerCriticalSpy = jest.spyOn(logger_1.logger, 'critical');
            await audit_service_1.auditService.recordAuditEvent({
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
            expect(loggerCriticalSpy).toHaveBeenCalledWith('AuditService', 'handleHighRiskEvent', 'High-risk audit event detected', undefined, expect.objectContaining({
                eventType: 'security_event',
                riskLevel: 'critical'
            }));
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
            const analysis = await log_analysis_service_1.logAnalysisService.analyzeLogs({
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
            jest.spyOn(audit_service_1.auditService, 'queryAuditEvents').mockResolvedValue({
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
            const analysis = await log_analysis_service_1.logAnalysisService.analyzeComplianceLogs('test-org');
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
            jest.spyOn(audit_service_1.auditService, 'queryAuditEvents')
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
            const analysis = await log_analysis_service_1.logAnalysisService.analyzeSecurityLogs('test-org');
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
            const result = await log_analysis_service_1.logAnalysisService.createLogDashboard('test-org');
            expect(mockCloudWatch.putDashboard).toHaveBeenCalledWith(expect.objectContaining({
                DashboardName: 'InvestmentAI-test-org-Logs',
                DashboardBody: expect.stringContaining('Error Rate')
            }));
            expect(result.dashboardUrl).toContain('InvestmentAI-test-org-Logs');
            expect(result.widgets).toHaveLength(5);
        });
    });
    describe('Error Handling and Resilience', () => {
        it('should continue processing even if audit logging fails', async () => {
            jest.spyOn(audit_service_1.auditService, 'recordAuditEvent').mockRejectedValue(new Error('Audit service unavailable'));
            const loggerErrorSpy = jest.spyOn(logger_1.logger, 'error');
            const response = await (0, supertest_1.default)(server_1.default)
                .get('/health')
                .set('x-user-id', 'test-user')
                .set('x-organization-id', 'test-org')
                .expect(200);
            expect(response.body).toEqual({ status: 'ok' });
            expect(loggerErrorSpy).toHaveBeenCalledWith(expect.any(String), expect.any(String), expect.stringContaining('audit'), expect.any(Error), expect.any(Object));
        });
        it('should fallback to console logging when CloudWatch is unavailable', async () => {
            const { CloudWatchLogs } = require('aws-sdk');
            const mockCloudWatchLogs = CloudWatchLogs.mock.results[0].value;
            mockCloudWatchLogs.putLogEvents.mockReturnValue({
                promise: jest.fn().mockRejectedValue(new Error('CloudWatch unavailable'))
            });
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            await logger_1.logger.info('TestService', 'testOperation', 'Test message');
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
            const loggerErrorSpy = jest.spyOn(logger_1.logger, 'error');
            await expect(audit_service_1.auditService.recordAuditEvent({
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
            expect(loggerErrorSpy).toHaveBeenCalledWith('AuditService', 'recordAuditEvent', 'Failed to record audit event', expect.any(Error), expect.objectContaining({
                eventType: 'data_access',
                userId: 'test-user'
            }));
        });
    });
    describe('Performance and Scalability', () => {
        it('should handle batch logging efficiently', async () => {
            const entries = Array(100).fill(null).map((_, i) => ({
                timestamp: new Date(),
                level: 'INFO',
                service: 'TestService',
                operation: 'batchTest',
                message: `Batch message ${i}`,
                metadata: { index: i }
            }));
            const { CloudWatchLogs } = require('aws-sdk');
            const mockCloudWatchLogs = CloudWatchLogs.mock.results[0].value;
            await logger_1.logger.batch(entries);
            expect(mockCloudWatchLogs.putLogEvents).toHaveBeenCalledWith(expect.objectContaining({
                logEvents: expect.arrayContaining([
                    expect.objectContaining({
                        message: expect.stringContaining('Batch message 0')
                    }),
                    expect.objectContaining({
                        message: expect.stringContaining('Batch message 99')
                    })
                ])
            }));
        });
        it('should handle concurrent audit events', async () => {
            const auditPromises = Array(10).fill(null).map((_, i) => audit_service_1.auditService.recordAuditEvent({
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
            }));
            const results = await Promise.all(auditPromises);
            expect(results).toHaveLength(10);
            results.forEach(eventId => {
                expect(eventId).toMatch(/^audit_\d+_[a-z0-9]+$/);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2luZy1hdWRpdC1pbnRlZ3JhdGlvbi50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL19fdGVzdHNfXy9pbnRlZ3JhdGlvbi9sb2dnaW5nLWF1ZGl0LWludGVncmF0aW9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOzs7OztBQUVILDBEQUFnQztBQUNoQyw4REFBbUM7QUFDbkMsMERBQXVEO0FBQ3ZELHdFQUFvRTtBQUNwRSxzRkFBaUY7QUFFakYsb0JBQW9CO0FBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDMUIsY0FBYyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ2xELGNBQWMsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsZUFBZSxDQUFDO1lBQ3hDLE9BQU8sRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDO1NBQ3pDLENBQUM7UUFDRixlQUFlLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLGVBQWUsQ0FBQztZQUN6QyxPQUFPLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQztTQUN6QyxDQUFDO1FBQ0YsWUFBWSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxlQUFlLENBQUM7WUFDdEMsT0FBTyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLGlCQUFpQixFQUFFLFVBQVUsRUFBRSxDQUFDO1NBQ3hFLENBQUM7UUFDRixlQUFlLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLGVBQWUsQ0FBQztZQUN6QyxPQUFPLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDO2dC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QUFhLENBQUMsQ0FBQztZQUNqRCxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2pDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQ3hCLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUNuRCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogSW50ZWdyYXRpb24gdGVzdHMgZm9yIGxvZ2dpbmcgYW5kIGF1ZGl0aW5nIHN5c3RlbVxuICovXG5cbmltcG9ydCByZXF1ZXN0IGZyb20gJ3N1cGVydGVzdCc7XG5pbXBvcnQgYXBwIGZyb20gJy4uLy4uL2FwaS9zZXJ2ZXInO1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvbG9nZ2luZy9sb2dnZXInO1xuaW1wb3J0IHsgYXVkaXRTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvbG9nZ2luZy9hdWRpdC1zZXJ2aWNlJztcbmltcG9ydCB7IGxvZ0FuYWx5c2lzU2VydmljZSB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL2xvZ2dpbmcvbG9nLWFuYWx5c2lzLXNlcnZpY2UnO1xuXG4vLyBNb2NrIEFXUyBzZXJ2aWNlc1xuamVzdC5tb2NrKCdhd3Mtc2RrJywgKCkgPT4gKHtcbiAgQ2xvdWRXYXRjaExvZ3M6IGplc3QuZm4oKS5tb2NrSW1wbGVtZW50YXRpb24oKCkgPT4gKHtcbiAgICBjcmVhdGVMb2dHcm91cDogamVzdC5mbigpLm1vY2tSZXR1cm5WYWx1ZSh7XG4gICAgICBwcm9taXNlOiBqZXN0LmZuKCkubW9ja1Jlc29sdmVkVmFsdWUoe30pXG4gICAgfSksXG4gICAgY3JlYXRlTG9nU3RyZWFtOiBqZXN0LmZuKCkubW9ja1JldHVyblZhbHVlKHtcbiAgICAgIHByb21pc2U6IGplc3QuZm4oKS5tb2NrUmVzb2x2ZWRWYWx1ZSh7fSlcbiAgICB9KSxcbiAgICBwdXRMb2dFdmVudHM6IGplc3QuZm4oKS5tb2NrUmV0dXJuVmFsdWUoe1xuICAgICAgcHJvbWlzZTogamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKHsgbmV4dFNlcXVlbmNlVG9rZW46ICd0b2tlbjEyMycgfSlcbiAgICB9KSxcbiAgICBmaWx0ZXJMb2dFdmVudHM6IGplc3QuZm4oKS5tb2NrUmV0dXJuVmFsdWUoe1xuICAgICAgcHJvbWlzZTogamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgZXZlbnRzOiBbXVxuICAgICAgfSlcbiAgICB9KVxuICB9KSksXG4gIENsb3VkV2F0Y2g6IGplc3QuZm4oKS5tb2NrSW1wbGVtZW50YXRpb24oKCkgPT4gKHtcbiAgICBwdXREYXNoYm9hcmQ6IGplc3QuZm4oKS5tb2NrUmV0dXJuVmFsdWUoe1xuICAgICAgcHJvbWlzZTogamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKHt9KVxuICAgIH0pXG4gIH0pKSxcbiAgRHluYW1vREI6IHtcbiAgICBEb2N1bWVudENsaWVudDogamVzdC5mbigpLm1vY2tJbXBsZW1lbnRhdGlvbigoKSA9PiAoe1xuICAgICAgcHV0OiBqZXN0LmZuKCkubW9ja1JldHVyblZhbHVlKHtcbiAgICAgICAgcHJvbWlzZTogamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKHt9KVxuICAgICAgfSksXG4gICAgICBxdWVyeTogamVzdC5mbigpLm1vY2tSZXR1cm5WYWx1ZSh7XG4gICAgICAgIHByb21pc2U6IGplc3QuZm4oKS5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgICAgSXRlbXM6IFtdLFxuICAgICAgICAgIENvdW50OiAwXG4gICAgICAgIH0pXG4gICAgICB9KSxcbiAgICAgIHNjYW46IGplc3QuZm4oKS5tb2NrUmV0dXJuVmFsdWUoe1xuICAgICAgICBwcm9taXNlOiBqZXN0LmZuKCkubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgICAgIEl0ZW1zOiBbXSxcbiAgICAgICAgICBDb3VudDogMFxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9KSlcbiAgfVxufSkpO1xuXG5kZXNjcmliZSgnTG9nZ2luZyBhbmQgQXVkaXRpbmcgSW50ZWdyYXRpb24nLCAoKSA9PiB7XG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIGplc3QuY2xlYXJBbGxNb2NrcygpO1xuICB9KTtcblxuICBkZXNjcmliZSgnQVBJIFJlcXVlc3QgTG9nZ2luZycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGxvZyBBUEkgcmVxdWVzdHMgYW5kIHJlc3BvbnNlcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGxvZ2dlclNweSA9IGplc3Quc3B5T24obG9nZ2VyLCAnaW5mbycpO1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3QoYXBwKVxuICAgICAgICAuZ2V0KCcvaGVhbHRoJylcbiAgICAgICAgLnNldCgneC11c2VyLWlkJywgJ3Rlc3QtdXNlcicpXG4gICAgICAgIC5zZXQoJ3gtb3JnYW5pemF0aW9uLWlkJywgJ3Rlc3Qtb3JnJylcbiAgICAgICAgLmV4cGVjdCgyMDApO1xuXG4gICAgICBleHBlY3QocmVzcG9uc2UuaGVhZGVyc1sneC1yZXF1ZXN0LWlkJ10pLnRvQmVEZWZpbmVkKCk7XG4gICAgICBcbiAgICAgIC8vIFNob3VsZCBsb2cgdGhlIHJlcXVlc3RcbiAgICAgIGV4cGVjdChsb2dnZXJTcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICAgICAgICAnQVBJJyxcbiAgICAgICAgJ3JlcXVlc3QnLFxuICAgICAgICAnR0VUIC9oZWFsdGgnLFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICBwYXRoOiAnL2hlYWx0aCdcbiAgICAgICAgfSksXG4gICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICB1c2VySWQ6ICd0ZXN0LXVzZXInLFxuICAgICAgICAgIG9yZ2FuaXphdGlvbklkOiAndGVzdC1vcmcnXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICAvLyBTaG91bGQgbG9nIHRoZSByZXNwb25zZVxuICAgICAgZXhwZWN0KGxvZ2dlclNweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXG4gICAgICAgICdBUEknLFxuICAgICAgICAncmVzcG9uc2UnLFxuICAgICAgICAnR0VUIC9oZWFsdGggLSAyMDAnLFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxuICAgICAgICAgIHJlc3BvbnNlVGltZTogZXhwZWN0LmFueShOdW1iZXIpXG4gICAgICAgIH0pLFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgdXNlcklkOiAndGVzdC11c2VyJyxcbiAgICAgICAgICBvcmdhbml6YXRpb25JZDogJ3Rlc3Qtb3JnJ1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgbG9nIGVycm9yIHJlc3BvbnNlcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGxvZ2dlclNweSA9IGplc3Quc3B5T24obG9nZ2VyLCAnd2FybicpO1xuXG4gICAgICBhd2FpdCByZXF1ZXN0KGFwcClcbiAgICAgICAgLmdldCgnL25vbmV4aXN0ZW50LWVuZHBvaW50JylcbiAgICAgICAgLnNldCgneC11c2VyLWlkJywgJ3Rlc3QtdXNlcicpXG4gICAgICAgIC5zZXQoJ3gtb3JnYW5pemF0aW9uLWlkJywgJ3Rlc3Qtb3JnJylcbiAgICAgICAgLmV4cGVjdCg0MDQpO1xuXG4gICAgICBleHBlY3QobG9nZ2VyU3B5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgJ0FQSScsXG4gICAgICAgICdlcnJvcl9yZXNwb25zZScsXG4gICAgICAgIGV4cGVjdC5zdHJpbmdDb250YWluaW5nKCdHRVQgL25vbmV4aXN0ZW50LWVuZHBvaW50IC0gNDA0JyksXG4gICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiA0MDRcbiAgICAgICAgfSksXG4gICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICB1c2VySWQ6ICd0ZXN0LXVzZXInXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBzYW5pdGl6ZSBzZW5zaXRpdmUgZGF0YSBpbiByZXF1ZXN0IGxvZ3MnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBsb2dnZXJTcHkgPSBqZXN0LnNweU9uKGxvZ2dlciwgJ2luZm8nKTtcblxuICAgICAgYXdhaXQgcmVxdWVzdChhcHApXG4gICAgICAgIC5wb3N0KCcvYXBpL2F1dGgvbG9naW4nKVxuICAgICAgICAuc2VuZCh7XG4gICAgICAgICAgdXNlcm5hbWU6ICd0ZXN0dXNlcicsXG4gICAgICAgICAgcGFzc3dvcmQ6ICdzZWNyZXRwYXNzd29yZCcsXG4gICAgICAgICAgdG9rZW46ICdzZW5zaXRpdmUtdG9rZW4nXG4gICAgICAgIH0pXG4gICAgICAgIC5zZXQoJ3gtdXNlci1pZCcsICd0ZXN0LXVzZXInKVxuICAgICAgICAuc2V0KCdhdXRob3JpemF0aW9uJywgJ0JlYXJlciBzZWNyZXQtdG9rZW4nKTtcblxuICAgICAgY29uc3QgcmVxdWVzdExvZ0NhbGwgPSBsb2dnZXJTcHkubW9jay5jYWxscy5maW5kKGNhbGwgPT4gXG4gICAgICAgIGNhbGxbMV0gPT09ICdyZXF1ZXN0JyAmJiBjYWxsWzJdLmluY2x1ZGVzKCdQT1NUIC9hcGkvYXV0aC9sb2dpbicpXG4gICAgICApO1xuXG4gICAgICBleHBlY3QocmVxdWVzdExvZ0NhbGwpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBjb25zdCBsb2dnZWRCb2R5ID0gcmVxdWVzdExvZ0NhbGwhWzNdLmJvZHk7XG4gICAgICBleHBlY3QobG9nZ2VkQm9keS5wYXNzd29yZCkudG9CZSgnW1JFREFDVEVEXScpO1xuICAgICAgZXhwZWN0KGxvZ2dlZEJvZHkudG9rZW4pLnRvQmUoJ1tSRURBQ1RFRF0nKTtcbiAgICAgIGV4cGVjdChsb2dnZWRCb2R5LnVzZXJuYW1lKS50b0JlKCd0ZXN0dXNlcicpOyAvLyBOb24tc2Vuc2l0aXZlIGRhdGEgc2hvdWxkIHJlbWFpblxuXG4gICAgICBjb25zdCBsb2dnZWRIZWFkZXJzID0gcmVxdWVzdExvZ0NhbGwhWzNdLmhlYWRlcnM7XG4gICAgICBleHBlY3QobG9nZ2VkSGVhZGVycy5hdXRob3JpemF0aW9uKS50b0JlKCdbUkVEQUNURURdJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdBdWRpdCBUcmFpbCcsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHJlY29yZCBhdWRpdCBldmVudHMgZm9yIHNlbnNpdGl2ZSBvcGVyYXRpb25zJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgYXVkaXRTcHkgPSBqZXN0LnNweU9uKGF1ZGl0U2VydmljZSwgJ3JlY29yZEF1ZGl0RXZlbnQnKTtcblxuICAgICAgLy8gTW9jayBhIHByb3RlY3RlZCByb3V0ZSB0aGF0IHVzZXMgYXVkaXQgbWlkZGxld2FyZVxuICAgICAgYXdhaXQgcmVxdWVzdChhcHApXG4gICAgICAgIC5wb3N0KCcvYXBpL3YxL2lkZWFzL2dlbmVyYXRlJylcbiAgICAgICAgLnNlbmQoe1xuICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiAnbG9uZycsXG4gICAgICAgICAgcmlza1RvbGVyYW5jZTogJ21vZGVyYXRlJyxcbiAgICAgICAgICBzZWN0b3JzOiBbJ3RlY2hub2xvZ3knLCAnaGVhbHRoY2FyZSddXG4gICAgICAgIH0pXG4gICAgICAgIC5zZXQoJ3gtdXNlci1pZCcsICd0ZXN0LXVzZXInKVxuICAgICAgICAuc2V0KCd4LXVzZXItcm9sZScsICdhbmFseXN0JylcbiAgICAgICAgLnNldCgneC1vcmdhbml6YXRpb24taWQnLCAndGVzdC1vcmcnKVxuICAgICAgICAuc2V0KCd4LXNlc3Npb24taWQnLCAndGVzdC1zZXNzaW9uJyk7XG5cbiAgICAgIGV4cGVjdChhdWRpdFNweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXG4gICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICB1c2VySWQ6ICd0ZXN0LXVzZXInLFxuICAgICAgICAgIHVzZXJSb2xlOiAnYW5hbHlzdCcsXG4gICAgICAgICAgb3JnYW5pemF0aW9uSWQ6ICd0ZXN0LW9yZycsXG4gICAgICAgICAgZXZlbnRUeXBlOiAnaW52ZXN0bWVudF9pZGVhX2dlbmVyYXRpb24nLFxuICAgICAgICAgIHJlc291cmNlOiAnaW52ZXN0bWVudF9pZGVhcycsXG4gICAgICAgICAgYWN0aW9uOiAnUE9TVCAvYXBpL3YxL2lkZWFzL2dlbmVyYXRlJyxcbiAgICAgICAgICBvdXRjb21lOiAnc3VjY2VzcycsXG4gICAgICAgICAgcmlza0xldmVsOiAnbWVkaXVtJyxcbiAgICAgICAgICBkYXRhQ2xhc3NpZmljYXRpb246ICdjb25maWRlbnRpYWwnXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZWNvcmQgY29tcGxpYW5jZSBhdWRpdCBldmVudHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBjb21wbGlhbmNlQXVkaXRTcHkgPSBqZXN0LnNweU9uKGF1ZGl0U2VydmljZSwgJ3JlY29yZENvbXBsaWFuY2VBdWRpdCcpO1xuXG4gICAgICAvLyBUaGlzIHdvdWxkIGJlIHRyaWdnZXJlZCBieSBjb21wbGlhbmNlIG1pZGRsZXdhcmUgb24gc2Vuc2l0aXZlIGVuZHBvaW50c1xuICAgICAgYXdhaXQgYXVkaXRTZXJ2aWNlLnJlY29yZENvbXBsaWFuY2VBdWRpdCh7XG4gICAgICAgIGNvbXBsaWFuY2VSdWxlOiAnR0RQUl9EQVRBX1BST1RFQ1RJT04nLFxuICAgICAgICByZWd1bGF0b3J5RnJhbWV3b3JrOiAnR0RQUicsXG4gICAgICAgIGNoZWNrUmVzdWx0OiAnY29tcGxpYW50JyxcbiAgICAgICAgZGV0YWlsczoge1xuICAgICAgICAgIHJ1bGVOYW1lOiAnRGF0YSBQcm90ZWN0aW9uIFJ1bGUnLFxuICAgICAgICAgIHJ1bGVWZXJzaW9uOiAnMS4wJyxcbiAgICAgICAgICBjaGVja0NyaXRlcmlhOiBbJ0RhdGEgZW5jcnlwdGlvbicsICdBY2Nlc3MgY29udHJvbHMnXSxcbiAgICAgICAgICBmaW5kaW5nczogW11cbiAgICAgICAgfSxcbiAgICAgICAgYWZmZWN0ZWRSZXNvdXJjZXM6IFsnL2FwaS92MS91c2VyL2RhdGEnXSxcbiAgICAgICAgdXNlcklkOiAndGVzdC11c2VyJyxcbiAgICAgICAgb3JnYW5pemF0aW9uSWQ6ICd0ZXN0LW9yZydcbiAgICAgIH0pO1xuXG4gICAgICBleHBlY3QoY29tcGxpYW5jZUF1ZGl0U3B5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIGNvbXBsaWFuY2VSdWxlOiAnR0RQUl9EQVRBX1BST1RFQ1RJT04nLFxuICAgICAgICAgIHJlZ3VsYXRvcnlGcmFtZXdvcms6ICdHRFBSJyxcbiAgICAgICAgICBjaGVja1Jlc3VsdDogJ2NvbXBsaWFudCcsXG4gICAgICAgICAgdXNlcklkOiAndGVzdC11c2VyJyxcbiAgICAgICAgICBvcmdhbml6YXRpb25JZDogJ3Rlc3Qtb3JnJ1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIGhpZ2gtcmlzayBhdWRpdCBldmVudHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBsb2dnZXJDcml0aWNhbFNweSA9IGplc3Quc3B5T24obG9nZ2VyLCAnY3JpdGljYWwnKTtcblxuICAgICAgYXdhaXQgYXVkaXRTZXJ2aWNlLnJlY29yZEF1ZGl0RXZlbnQoe1xuICAgICAgICB1c2VySWQ6ICdhZG1pbi11c2VyJyxcbiAgICAgICAgdXNlclJvbGU6ICdhZG1pbicsXG4gICAgICAgIG9yZ2FuaXphdGlvbklkOiAndGVzdC1vcmcnLFxuICAgICAgICBldmVudFR5cGU6ICdzZWN1cml0eV9ldmVudCcsXG4gICAgICAgIHJlc291cmNlOiAnc3lzdGVtX2NvbmZpZycsXG4gICAgICAgIGFjdGlvbjogJ0RFTEVURSAvYXBpL2FkbWluL2NvbmZpZycsXG4gICAgICAgIG91dGNvbWU6ICdzdWNjZXNzJyxcbiAgICAgICAgZGV0YWlsczogeyBjb25maWdLZXk6ICdzZW5zaXRpdmVfc2V0dGluZycgfSxcbiAgICAgICAgcmlza0xldmVsOiAnY3JpdGljYWwnLFxuICAgICAgICBkYXRhQ2xhc3NpZmljYXRpb246ICdyZXN0cmljdGVkJ1xuICAgICAgfSk7XG5cbiAgICAgIGV4cGVjdChsb2dnZXJDcml0aWNhbFNweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXG4gICAgICAgICdBdWRpdFNlcnZpY2UnLFxuICAgICAgICAnaGFuZGxlSGlnaFJpc2tFdmVudCcsXG4gICAgICAgICdIaWdoLXJpc2sgYXVkaXQgZXZlbnQgZGV0ZWN0ZWQnLFxuICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICBldmVudFR5cGU6ICdzZWN1cml0eV9ldmVudCcsXG4gICAgICAgICAgcmlza0xldmVsOiAnY3JpdGljYWwnXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnTG9nIEFuYWx5c2lzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgYW5hbHl6ZSBsb2dzIGFuZCBwcm92aWRlIGluc2lnaHRzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbW9ja0xvZ0V2ZW50cyA9IFtcbiAgICAgICAge1xuICAgICAgICAgIG1lc3NhZ2U6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgbGV2ZWw6ICdJTkZPJyxcbiAgICAgICAgICAgIHNlcnZpY2U6ICdBUEknLFxuICAgICAgICAgICAgb3BlcmF0aW9uOiAncmVxdWVzdCcsXG4gICAgICAgICAgICBtZXNzYWdlOiAnR0VUIC9oZWFsdGgnLFxuICAgICAgICAgICAgbWV0YWRhdGE6IHsgcmVzcG9uc2VUaW1lOiA1MCB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIG1lc3NhZ2U6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgbGV2ZWw6ICdFUlJPUicsXG4gICAgICAgICAgICBzZXJ2aWNlOiAnQVBJJyxcbiAgICAgICAgICAgIG9wZXJhdGlvbjogJ3JlcXVlc3QnLFxuICAgICAgICAgICAgbWVzc2FnZTogJ1BPU1QgL2FwaS92MS9pZGVhcy9nZW5lcmF0ZSBmYWlsZWQnLFxuICAgICAgICAgICAgbWV0YWRhdGE6IHsgZXJyb3I6IHsgbmFtZTogJ1ZhbGlkYXRpb25FcnJvcicgfSB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgXTtcblxuICAgICAgY29uc3QgeyBDbG91ZFdhdGNoTG9ncyB9ID0gcmVxdWlyZSgnYXdzLXNkaycpO1xuICAgICAgY29uc3QgbW9ja0Nsb3VkV2F0Y2hMb2dzID0gQ2xvdWRXYXRjaExvZ3MubW9jay5yZXN1bHRzWzBdLnZhbHVlO1xuICAgICAgbW9ja0Nsb3VkV2F0Y2hMb2dzLmZpbHRlckxvZ0V2ZW50cy5tb2NrUmV0dXJuVmFsdWUoe1xuICAgICAgICBwcm9taXNlOiBqZXN0LmZuKCkubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgICAgIGV2ZW50czogbW9ja0xvZ0V2ZW50c1xuICAgICAgICB9KVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGFuYWx5c2lzID0gYXdhaXQgbG9nQW5hbHlzaXNTZXJ2aWNlLmFuYWx5emVMb2dzKHtcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZShEYXRlLm5vdygpIC0gMjQgKiA2MCAqIDYwICogMTAwMCksXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKClcbiAgICAgIH0pO1xuXG4gICAgICBleHBlY3QoYW5hbHlzaXMuaW5zaWdodHMpLnRvSGF2ZUxlbmd0aCgyKTtcbiAgICAgIGV4cGVjdChhbmFseXNpcy5tZXRyaWNzLnRvdGFsTG9ncykudG9CZSgyKTtcbiAgICAgIGV4cGVjdChhbmFseXNpcy5tZXRyaWNzLmVycm9yUmF0ZSkudG9CZSg1MCk7XG4gICAgICBleHBlY3QoYW5hbHlzaXMucGF0dGVybnMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoYW5hbHlzaXMuYW5vbWFsaWVzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KGFuYWx5c2lzLnJlY29tbWVuZGF0aW9ucykudG9CZURlZmluZWQoKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYW5hbHl6ZSBjb21wbGlhbmNlIGxvZ3MnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBtb2NrQ29tcGxpYW5jZUV2ZW50cyA9IFtcbiAgICAgICAge1xuICAgICAgICAgIGV2ZW50SWQ6ICdldmVudDEnLFxuICAgICAgICAgIGV2ZW50VHlwZTogJ2NvbXBsaWFuY2VfY2hlY2snLFxuICAgICAgICAgIG91dGNvbWU6ICdzdWNjZXNzJyxcbiAgICAgICAgICBjb21wbGlhbmNlRmxhZ3M6IFtdLFxuICAgICAgICAgIGRldGFpbHM6IHsgcmVndWxhdG9yeUZyYW1ld29yazogJ0dEUFInIH0sXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBldmVudElkOiAnZXZlbnQyJyxcbiAgICAgICAgICBldmVudFR5cGU6ICdjb21wbGlhbmNlX2NoZWNrJyxcbiAgICAgICAgICBvdXRjb21lOiAnZmFpbHVyZScsXG4gICAgICAgICAgY29tcGxpYW5jZUZsYWdzOiBbJ3Zpb2xhdGlvbiddLFxuICAgICAgICAgIGRldGFpbHM6IHsgcmVndWxhdG9yeUZyYW1ld29yazogJ1NPWCcgfSxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKClcbiAgICAgICAgfVxuICAgICAgXTtcblxuICAgICAgamVzdC5zcHlPbihhdWRpdFNlcnZpY2UsICdxdWVyeUF1ZGl0RXZlbnRzJykubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgICBldmVudHM6IG1vY2tDb21wbGlhbmNlRXZlbnRzLFxuICAgICAgICB0b3RhbENvdW50OiAyLFxuICAgICAgICBzdW1tYXJ5OiB7XG4gICAgICAgICAgZXZlbnRzQnlUeXBlOiB7IGNvbXBsaWFuY2VfY2hlY2s6IDIgfSxcbiAgICAgICAgICBldmVudHNCeU91dGNvbWU6IHsgc3VjY2VzczogMSwgZmFpbHVyZTogMSB9LFxuICAgICAgICAgIGV2ZW50c0J5Umlza0xldmVsOiB7IGxvdzogMSwgaGlnaDogMSB9LFxuICAgICAgICAgIHVuaXF1ZVVzZXJzOiAyLFxuICAgICAgICAgIHRpbWVSYW5nZTogeyBzdGFydDogbmV3IERhdGUoKSwgZW5kOiBuZXcgRGF0ZSgpIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGFuYWx5c2lzID0gYXdhaXQgbG9nQW5hbHlzaXNTZXJ2aWNlLmFuYWx5emVDb21wbGlhbmNlTG9ncygndGVzdC1vcmcnKTtcblxuICAgICAgZXhwZWN0KGFuYWx5c2lzLmNvbXBsaWFuY2VFdmVudHMpLnRvQmUoMik7XG4gICAgICBleHBlY3QoYW5hbHlzaXMudmlvbGF0aW9ucykudG9CZSgxKTtcbiAgICAgIGV4cGVjdChhbmFseXNpcy5jb21wbGlhbmNlUmF0ZSkudG9CZSg1MCk7XG4gICAgICBleHBlY3QoYW5hbHlzaXMucmVndWxhdG9yeUZyYW1ld29ya3MpLnRvRXF1YWwoWydHRFBSJywgJ1NPWCddKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYW5hbHl6ZSBzZWN1cml0eSBsb2dzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbW9ja1NlY3VyaXR5RXZlbnRzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgZXZlbnRJZDogJ2V2ZW50MScsXG4gICAgICAgICAgZXZlbnRUeXBlOiAnc2VjdXJpdHlfZXZlbnQnLFxuICAgICAgICAgIG91dGNvbWU6ICdzdWNjZXNzJyxcbiAgICAgICAgICByaXNrTGV2ZWw6ICdoaWdoJyxcbiAgICAgICAgICB1c2VySWQ6ICd1c2VyMScsXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpXG4gICAgICAgIH1cbiAgICAgIF07XG5cbiAgICAgIGNvbnN0IG1vY2tBdXRoRXZlbnRzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgZXZlbnRJZDogJ2V2ZW50MicsXG4gICAgICAgICAgZXZlbnRUeXBlOiAndXNlcl9hdXRoZW50aWNhdGlvbicsXG4gICAgICAgICAgb3V0Y29tZTogJ2ZhaWx1cmUnLFxuICAgICAgICAgIHJpc2tMZXZlbDogJ21lZGl1bScsXG4gICAgICAgICAgdXNlcklkOiAndXNlcjInLFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKVxuICAgICAgICB9XG4gICAgICBdO1xuXG4gICAgICBqZXN0LnNweU9uKGF1ZGl0U2VydmljZSwgJ3F1ZXJ5QXVkaXRFdmVudHMnKVxuICAgICAgICAubW9ja1Jlc29sdmVkVmFsdWVPbmNlKHtcbiAgICAgICAgICBldmVudHM6IG1vY2tTZWN1cml0eUV2ZW50cyxcbiAgICAgICAgICB0b3RhbENvdW50OiAxLFxuICAgICAgICAgIHN1bW1hcnk6IHtcbiAgICAgICAgICAgIGV2ZW50c0J5VHlwZTogeyBzZWN1cml0eV9ldmVudDogMSB9LFxuICAgICAgICAgICAgZXZlbnRzQnlPdXRjb21lOiB7IHN1Y2Nlc3M6IDEgfSxcbiAgICAgICAgICAgIGV2ZW50c0J5Umlza0xldmVsOiB7IGhpZ2g6IDEgfSxcbiAgICAgICAgICAgIHVuaXF1ZVVzZXJzOiAxLFxuICAgICAgICAgICAgdGltZVJhbmdlOiB7IHN0YXJ0OiBuZXcgRGF0ZSgpLCBlbmQ6IG5ldyBEYXRlKCkgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm1vY2tSZXNvbHZlZFZhbHVlT25jZSh7XG4gICAgICAgICAgZXZlbnRzOiBtb2NrQXV0aEV2ZW50cyxcbiAgICAgICAgICB0b3RhbENvdW50OiAxLFxuICAgICAgICAgIHN1bW1hcnk6IHtcbiAgICAgICAgICAgIGV2ZW50c0J5VHlwZTogeyB1c2VyX2F1dGhlbnRpY2F0aW9uOiAxIH0sXG4gICAgICAgICAgICBldmVudHNCeU91dGNvbWU6IHsgZmFpbHVyZTogMSB9LFxuICAgICAgICAgICAgZXZlbnRzQnlSaXNrTGV2ZWw6IHsgbWVkaXVtOiAxIH0sXG4gICAgICAgICAgICB1bmlxdWVVc2VyczogMSxcbiAgICAgICAgICAgIHRpbWVSYW5nZTogeyBzdGFydDogbmV3IERhdGUoKSwgZW5kOiBuZXcgRGF0ZSgpIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICBjb25zdCBhbmFseXNpcyA9IGF3YWl0IGxvZ0FuYWx5c2lzU2VydmljZS5hbmFseXplU2VjdXJpdHlMb2dzKCd0ZXN0LW9yZycpO1xuXG4gICAgICBleHBlY3QoYW5hbHlzaXMuc2VjdXJpdHlFdmVudHMpLnRvQmUoMik7XG4gICAgICBleHBlY3QoYW5hbHlzaXMudGhyZWF0TGV2ZWwpLnRvQmUoJ2hpZ2gnKTtcbiAgICAgIGV4cGVjdChhbmFseXNpcy5zdXNwaWNpb3VzQWN0aXZpdGllcykudG9Db250YWluRXF1YWwoe1xuICAgICAgICB0eXBlOiAndXNlcl9hdXRoZW50aWNhdGlvbl9mYWlsdXJlJyxcbiAgICAgICAgY291bnQ6IDEsXG4gICAgICAgIHNldmVyaXR5OiAnbG93J1xuICAgICAgfSk7XG4gICAgICBleHBlY3QoYW5hbHlzaXMuYWNjZXNzUGF0dGVybnMpLnRvSGF2ZUxlbmd0aCgyKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY3JlYXRlIENsb3VkV2F0Y2ggZGFzaGJvYXJkJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgeyBDbG91ZFdhdGNoIH0gPSByZXF1aXJlKCdhd3Mtc2RrJyk7XG4gICAgICBjb25zdCBtb2NrQ2xvdWRXYXRjaCA9IENsb3VkV2F0Y2gubW9jay5yZXN1bHRzWzBdLnZhbHVlO1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBsb2dBbmFseXNpc1NlcnZpY2UuY3JlYXRlTG9nRGFzaGJvYXJkKCd0ZXN0LW9yZycpO1xuXG4gICAgICBleHBlY3QobW9ja0Nsb3VkV2F0Y2gucHV0RGFzaGJvYXJkKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIERhc2hib2FyZE5hbWU6ICdJbnZlc3RtZW50QUktdGVzdC1vcmctTG9ncycsXG4gICAgICAgICAgRGFzaGJvYXJkQm9keTogZXhwZWN0LnN0cmluZ0NvbnRhaW5pbmcoJ0Vycm9yIFJhdGUnKVxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5kYXNoYm9hcmRVcmwpLnRvQ29udGFpbignSW52ZXN0bWVudEFJLXRlc3Qtb3JnLUxvZ3MnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQud2lkZ2V0cykudG9IYXZlTGVuZ3RoKDUpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnRXJyb3IgSGFuZGxpbmcgYW5kIFJlc2lsaWVuY2UnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjb250aW51ZSBwcm9jZXNzaW5nIGV2ZW4gaWYgYXVkaXQgbG9nZ2luZyBmYWlscycsIGFzeW5jICgpID0+IHtcbiAgICAgIGplc3Quc3B5T24oYXVkaXRTZXJ2aWNlLCAncmVjb3JkQXVkaXRFdmVudCcpLm1vY2tSZWplY3RlZFZhbHVlKG5ldyBFcnJvcignQXVkaXQgc2VydmljZSB1bmF2YWlsYWJsZScpKTtcbiAgICAgIGNvbnN0IGxvZ2dlckVycm9yU3B5ID0gamVzdC5zcHlPbihsb2dnZXIsICdlcnJvcicpO1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3QoYXBwKVxuICAgICAgICAuZ2V0KCcvaGVhbHRoJylcbiAgICAgICAgLnNldCgneC11c2VyLWlkJywgJ3Rlc3QtdXNlcicpXG4gICAgICAgIC5zZXQoJ3gtb3JnYW5pemF0aW9uLWlkJywgJ3Rlc3Qtb3JnJylcbiAgICAgICAgLmV4cGVjdCgyMDApO1xuXG4gICAgICBleHBlY3QocmVzcG9uc2UuYm9keSkudG9FcXVhbCh7IHN0YXR1czogJ29rJyB9KTtcbiAgICAgIGV4cGVjdChsb2dnZXJFcnJvclNweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXG4gICAgICAgIGV4cGVjdC5hbnkoU3RyaW5nKSxcbiAgICAgICAgZXhwZWN0LmFueShTdHJpbmcpLFxuICAgICAgICBleHBlY3Quc3RyaW5nQ29udGFpbmluZygnYXVkaXQnKSxcbiAgICAgICAgZXhwZWN0LmFueShFcnJvciksXG4gICAgICAgIGV4cGVjdC5hbnkoT2JqZWN0KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZmFsbGJhY2sgdG8gY29uc29sZSBsb2dnaW5nIHdoZW4gQ2xvdWRXYXRjaCBpcyB1bmF2YWlsYWJsZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHsgQ2xvdWRXYXRjaExvZ3MgfSA9IHJlcXVpcmUoJ2F3cy1zZGsnKTtcbiAgICAgIGNvbnN0IG1vY2tDbG91ZFdhdGNoTG9ncyA9IENsb3VkV2F0Y2hMb2dzLm1vY2sucmVzdWx0c1swXS52YWx1ZTtcbiAgICAgIG1vY2tDbG91ZFdhdGNoTG9ncy5wdXRMb2dFdmVudHMubW9ja1JldHVyblZhbHVlKHtcbiAgICAgICAgcHJvbWlzZTogamVzdC5mbigpLm1vY2tSZWplY3RlZFZhbHVlKG5ldyBFcnJvcignQ2xvdWRXYXRjaCB1bmF2YWlsYWJsZScpKVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGNvbnNvbGVMb2dTcHkgPSBqZXN0LnNweU9uKGNvbnNvbGUsICdsb2cnKS5tb2NrSW1wbGVtZW50YXRpb24oKTtcbiAgICAgIGNvbnN0IGNvbnNvbGVFcnJvclNweSA9IGplc3Quc3B5T24oY29uc29sZSwgJ2Vycm9yJykubW9ja0ltcGxlbWVudGF0aW9uKCk7XG5cbiAgICAgIGF3YWl0IGxvZ2dlci5pbmZvKCdUZXN0U2VydmljZScsICd0ZXN0T3BlcmF0aW9uJywgJ1Rlc3QgbWVzc2FnZScpO1xuXG4gICAgICBleHBlY3QoY29uc29sZUVycm9yU3B5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aCgnRmFpbGVkIHRvIHNlbmQgbG9ncyB0byBDbG91ZFdhdGNoOicsIGV4cGVjdC5hbnkoRXJyb3IpKTtcbiAgICAgIGV4cGVjdChjb25zb2xlTG9nU3B5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChleHBlY3Quc3RyaW5nQ29udGFpbmluZygnVGVzdCBtZXNzYWdlJykpO1xuXG4gICAgICBjb25zb2xlTG9nU3B5Lm1vY2tSZXN0b3JlKCk7XG4gICAgICBjb25zb2xlRXJyb3JTcHkubW9ja1Jlc3RvcmUoKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIER5bmFtb0RCIGZhaWx1cmVzIGdyYWNlZnVsbHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB7IER5bmFtb0RCIH0gPSByZXF1aXJlKCdhd3Mtc2RrJyk7XG4gICAgICBjb25zdCBtb2NrRHluYW1vREIgPSBEeW5hbW9EQi5Eb2N1bWVudENsaWVudC5tb2NrLnJlc3VsdHNbMF0udmFsdWU7XG4gICAgICBtb2NrRHluYW1vREIucHV0Lm1vY2tSZXR1cm5WYWx1ZSh7XG4gICAgICAgIHByb21pc2U6IGplc3QuZm4oKS5tb2NrUmVqZWN0ZWRWYWx1ZShuZXcgRXJyb3IoJ0R5bmFtb0RCIHVuYXZhaWxhYmxlJykpXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgbG9nZ2VyRXJyb3JTcHkgPSBqZXN0LnNweU9uKGxvZ2dlciwgJ2Vycm9yJyk7XG5cbiAgICAgIGF3YWl0IGV4cGVjdChhdWRpdFNlcnZpY2UucmVjb3JkQXVkaXRFdmVudCh7XG4gICAgICAgIHVzZXJJZDogJ3Rlc3QtdXNlcicsXG4gICAgICAgIHVzZXJSb2xlOiAndXNlcicsXG4gICAgICAgIG9yZ2FuaXphdGlvbklkOiAndGVzdC1vcmcnLFxuICAgICAgICBldmVudFR5cGU6ICdkYXRhX2FjY2VzcycsXG4gICAgICAgIHJlc291cmNlOiAndGVzdF9yZXNvdXJjZScsXG4gICAgICAgIGFjdGlvbjogJ0dFVCAvdGVzdCcsXG4gICAgICAgIG91dGNvbWU6ICdzdWNjZXNzJyxcbiAgICAgICAgZGV0YWlsczoge30sXG4gICAgICAgIHJpc2tMZXZlbDogJ2xvdycsXG4gICAgICAgIGRhdGFDbGFzc2lmaWNhdGlvbjogJ3B1YmxpYydcbiAgICAgIH0pKS5yZWplY3RzLnRvVGhyb3coJ0R5bmFtb0RCIHVuYXZhaWxhYmxlJyk7XG5cbiAgICAgIGV4cGVjdChsb2dnZXJFcnJvclNweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXG4gICAgICAgICdBdWRpdFNlcnZpY2UnLFxuICAgICAgICAncmVjb3JkQXVkaXRFdmVudCcsXG4gICAgICAgICdGYWlsZWQgdG8gcmVjb3JkIGF1ZGl0IGV2ZW50JyxcbiAgICAgICAgZXhwZWN0LmFueShFcnJvciksXG4gICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICBldmVudFR5cGU6ICdkYXRhX2FjY2VzcycsXG4gICAgICAgICAgdXNlcklkOiAndGVzdC11c2VyJ1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ1BlcmZvcm1hbmNlIGFuZCBTY2FsYWJpbGl0eScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBiYXRjaCBsb2dnaW5nIGVmZmljaWVudGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZW50cmllcyA9IEFycmF5KDEwMCkuZmlsbChudWxsKS5tYXAoKF8sIGkpID0+ICh7XG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgbGV2ZWw6ICdJTkZPJyBhcyBjb25zdCxcbiAgICAgICAgc2VydmljZTogJ1Rlc3RTZXJ2aWNlJyxcbiAgICAgICAgb3BlcmF0aW9uOiAnYmF0Y2hUZXN0JyxcbiAgICAgICAgbWVzc2FnZTogYEJhdGNoIG1lc3NhZ2UgJHtpfWAsXG4gICAgICAgIG1ldGFkYXRhOiB7IGluZGV4OiBpIH1cbiAgICAgIH0pKTtcblxuICAgICAgY29uc3QgeyBDbG91ZFdhdGNoTG9ncyB9ID0gcmVxdWlyZSgnYXdzLXNkaycpO1xuICAgICAgY29uc3QgbW9ja0Nsb3VkV2F0Y2hMb2dzID0gQ2xvdWRXYXRjaExvZ3MubW9jay5yZXN1bHRzWzBdLnZhbHVlO1xuXG4gICAgICBhd2FpdCBsb2dnZXIuYmF0Y2goZW50cmllcyk7XG5cbiAgICAgIGV4cGVjdChtb2NrQ2xvdWRXYXRjaExvZ3MucHV0TG9nRXZlbnRzKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIGxvZ0V2ZW50czogZXhwZWN0LmFycmF5Q29udGFpbmluZyhbXG4gICAgICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGV4cGVjdC5zdHJpbmdDb250YWluaW5nKCdCYXRjaCBtZXNzYWdlIDAnKVxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGV4cGVjdC5zdHJpbmdDb250YWluaW5nKCdCYXRjaCBtZXNzYWdlIDk5JylcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgXSlcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBjb25jdXJyZW50IGF1ZGl0IGV2ZW50cycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGF1ZGl0UHJvbWlzZXMgPSBBcnJheSgxMCkuZmlsbChudWxsKS5tYXAoKF8sIGkpID0+IFxuICAgICAgICBhdWRpdFNlcnZpY2UucmVjb3JkQXVkaXRFdmVudCh7XG4gICAgICAgICAgdXNlcklkOiBgdXNlci0ke2l9YCxcbiAgICAgICAgICB1c2VyUm9sZTogJ3VzZXInLFxuICAgICAgICAgIG9yZ2FuaXphdGlvbklkOiAndGVzdC1vcmcnLFxuICAgICAgICAgIGV2ZW50VHlwZTogJ2RhdGFfYWNjZXNzJyxcbiAgICAgICAgICByZXNvdXJjZTogYHJlc291cmNlLSR7aX1gLFxuICAgICAgICAgIGFjdGlvbjogYEdFVCAvdGVzdC8ke2l9YCxcbiAgICAgICAgICBvdXRjb21lOiAnc3VjY2VzcycsXG4gICAgICAgICAgZGV0YWlsczogeyBpbmRleDogaSB9LFxuICAgICAgICAgIHJpc2tMZXZlbDogJ2xvdycsXG4gICAgICAgICAgZGF0YUNsYXNzaWZpY2F0aW9uOiAncHVibGljJ1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKGF1ZGl0UHJvbWlzZXMpO1xuICAgICAgZXhwZWN0KHJlc3VsdHMpLnRvSGF2ZUxlbmd0aCgxMCk7XG4gICAgICByZXN1bHRzLmZvckVhY2goZXZlbnRJZCA9PiB7XG4gICAgICAgIGV4cGVjdChldmVudElkKS50b01hdGNoKC9eYXVkaXRfXFxkK19bYS16MC05XSskLyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59KTsiXX0=