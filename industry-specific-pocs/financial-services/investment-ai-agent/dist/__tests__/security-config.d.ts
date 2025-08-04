/**
 * Security Testing Configuration
 *
 * This file contains configuration and utilities for security testing
 * including test data, mock services, and security validation helpers.
 */
/// <reference types="node" />
/// <reference types="node" />
export declare const SECURITY_TEST_CONFIG: {
    passwordPolicy: {
        minLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSpecialChars: boolean;
        maxAge: number;
        preventReuse: number;
        lockoutThreshold: number;
        lockoutDuration: number;
    };
    jwtConfig: {
        algorithm: string;
        maxAge: number;
        refreshMaxAge: number;
        issuer: string;
        audience: string;
    };
    rateLimiting: {
        general: {
            windowMs: number;
            maxRequests: number;
        };
        authentication: {
            windowMs: number;
            maxRequests: number;
        };
        fileUpload: {
            windowMs: number;
            maxRequests: number;
        };
    };
    fileUpload: {
        maxFileSize: number;
        allowedMimeTypes: string[];
        quarantineDirectory: string;
        scanTimeout: number;
    };
    encryption: {
        algorithm: string;
        keyLength: number;
        ivLength: number;
        tagLength: number;
        saltLength: number;
    };
    session: {
        maxAge: number;
        secure: boolean;
        httpOnly: boolean;
        sameSite: string;
        regenerateOnLogin: boolean;
    };
    cors: {
        allowedOrigins: string[];
        allowedMethods: string[];
        allowedHeaders: string[];
        credentials: boolean;
        maxAge: number;
    };
    securityHeaders: {
        'X-Content-Type-Options': string;
        'X-Frame-Options': string;
        'X-XSS-Protection': string;
        'Strict-Transport-Security': string;
        'Content-Security-Policy': string;
        'Referrer-Policy': string;
        'Permissions-Policy': string;
    };
};
export declare const SECURITY_TEST_DATA: {
    weakPasswords: string[];
    strongPasswords: string[];
    sqlInjectionPayloads: string[];
    xssPayloads: string[];
    commandInjectionPayloads: string[];
    pathTraversalPayloads: string[];
    ldapInjectionPayloads: string[];
    nosqlInjectionPayloads: string[];
    piiTestData: {
        ssn: string;
        creditCard: string;
        email: string;
        phone: string;
        address: string;
        ipAddress: string;
        dateOfBirth: string;
    };
    maliciousFileContent: {
        scriptInjection: string;
        sqlInjection: string;
        commandInjection: string;
        pathTraversal: string;
        binaryPayload: Buffer;
    };
};
export declare const COMPLIANCE_TEST_CONFIG: {
    regulations: {
        sec: {
            name: string;
            jurisdiction: string;
            applicableInvestmentTypes: string[];
            concentrationLimits: {
                singleIssuer: number;
                singleSector: number;
                illiquidAssets: number;
            };
        };
        mifidII: {
            name: string;
            jurisdiction: string;
            applicableInvestmentTypes: string[];
            suitabilityRequirements: boolean;
            bestExecutionRequired: boolean;
            complexInstrumentWarnings: boolean;
        };
        gdpr: {
            name: string;
            jurisdiction: string;
            dataSubjectRights: string[];
            processingTimeframes: {
                standardRequest: number;
                complexRequest: number;
            };
        };
        ccpa: {
            name: string;
            jurisdiction: string;
            consumerRights: string[];
            processingTimeframes: {
                standardRequest: number;
                verificationRequired: boolean;
            };
        };
    };
    esgCriteria: {
        environmental: string[];
        social: string[];
        governance: string[];
    };
    riskCriteria: {
        marketRisk: {
            volatilityThresholds: {
                low: number;
                medium: number;
                high: number;
                veryHigh: number;
            };
            betaThresholds: {
                low: number;
                medium: number;
                high: number;
                veryHigh: number;
            };
        };
        creditRisk: {
            ratingThresholds: {
                investmentGrade: string[];
                speculativeGrade: string[];
                default: string[];
            };
        };
        liquidityRisk: {
            tradingVolumeThresholds: {
                high: number;
                medium: number;
                low: number;
                veryLow: number;
            };
        };
    };
};
export declare const PRIVACY_TEST_CONFIG: {
    dataCategories: {
        personalIdentifiers: string[];
        financialData: string[];
        biometricData: string[];
        healthData: string[];
        behavioralData: string[];
    };
    consentPurposes: {
        id: string;
        name: string;
        description: string;
        required: boolean;
        category: string;
    }[];
    retentionPeriods: {
        personalData: number;
        financialTransactions: number;
        auditLogs: number;
        systemLogs: number;
        marketingData: number;
        analyticsData: number;
        sessionData: number;
        temporaryFiles: number;
    };
    adequateCountries: string[];
};
export declare class SecurityTestUtils {
    /**
     * Generate test JWT token
     */
    static generateTestJWT(payload: any, secret?: string, expiresIn?: string): string;
    /**
     * Generate expired JWT token
     */
    static generateExpiredJWT(payload: any, secret?: string): string;
    /**
     * Generate malicious file for testing
     */
    static generateMaliciousFile(type: 'script' | 'sql' | 'command' | 'binary'): Buffer;
    /**
     * Validate password strength
     */
    static validatePasswordStrength(password: string): {
        isStrong: boolean;
        score: number;
        feedback: string[];
    };
    /**
     * Check if input contains potential injection
     */
    static containsInjection(input: string): {
        hasSQLInjection: boolean;
        hasXSS: boolean;
        hasCommandInjection: boolean;
        hasPathTraversal: boolean;
    };
}
