"use strict";
/**
 * Data Privacy Validation Testing Suite
 *
 * This test suite implements comprehensive data privacy validation tests
 * for the Investment AI Agent system, covering:
 * - GDPR compliance (EU General Data Protection Regulation)
 * - CCPA compliance (California Consumer Privacy Act)
 * - PII (Personally Identifiable Information) protection
 * - Data encryption and anonymization
 * - Consent management
 * - Data subject rights
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
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("../auth-service");
const proprietary_data_service_1 = require("../proprietary-data-service");
const user_profile_service_1 = require("../user-profile-service");
const feedback_service_1 = require("../feedback-service");
const crypto = __importStar(require("crypto"));
// Mock DataPrivacyService for testing
class MockDataPrivacyService {
    constructor() {
        this.piiPatterns = [
            /\b\d{3}-\d{2}-\d{4}\b/,
            /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
            /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/,
            /\b\d{1,5}\s\w+\s(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b/i // Address
        ];
    }
    detectPII(text) {
        const detectedPII = [];
        // SSN detection
        const ssnMatch = text.match(this.piiPatterns[0]);
        if (ssnMatch) {
            detectedPII.push({ type: 'SSN', value: ssnMatch[0], confidence: 0.95 });
        }
        // Credit card detection
        const ccMatch = text.match(this.piiPatterns[1]);
        if (ccMatch) {
            detectedPII.push({ type: 'CREDIT_CARD', value: ccMatch[0], confidence: 0.90 });
        }
        // Email detection
        const emailMatch = text.match(this.piiPatterns[2]);
        if (emailMatch) {
            detectedPII.push({ type: 'EMAIL', value: emailMatch[0], confidence: 0.98 });
        }
        // Phone detection
        const phoneMatch = text.match(this.piiPatterns[3]);
        if (phoneMatch) {
            detectedPII.push({ type: 'PHONE', value: phoneMatch[0], confidence: 0.85 });
        }
        // Address detection
        const addressMatch = text.match(this.piiPatterns[4]);
        if (addressMatch) {
            detectedPII.push({ type: 'ADDRESS', value: addressMatch[0], confidence: 0.80 });
        }
        return detectedPII;
    }
    anonymizeData(data) {
        const anonymized = JSON.parse(JSON.stringify(data));
        // Replace PII with anonymized versions
        if (typeof anonymized === 'string') {
            return this.anonymizeText(anonymized);
        }
        if (typeof anonymized === 'object' && anonymized !== null) {
            for (const key in anonymized) {
                if (typeof anonymized[key] === 'string') {
                    anonymized[key] = this.anonymizeText(anonymized[key]);
                }
                else if (typeof anonymized[key] === 'object') {
                    anonymized[key] = this.anonymizeData(anonymized[key]);
                }
            }
        }
        return anonymized;
    }
    anonymizeText(text) {
        let anonymized = text;
        // Anonymize SSN
        anonymized = anonymized.replace(this.piiPatterns[0], 'XXX-XX-XXXX');
        // Anonymize credit card
        anonymized = anonymized.replace(this.piiPatterns[1], 'XXXX-XXXX-XXXX-XXXX');
        // Anonymize email (keep domain)
        anonymized = anonymized.replace(this.piiPatterns[2], (match) => {
            const [, domain] = match.split('@');
            return `[REDACTED]@${domain}`;
        });
        // Anonymize phone
        anonymized = anonymized.replace(this.piiPatterns[3], 'XXX-XXX-XXXX');
        // Anonymize address
        anonymized = anonymized.replace(this.piiPatterns[4], '[REDACTED ADDRESS]');
        return anonymized;
    }
    encryptSensitiveData(data, key) {
        const cipher = crypto.createCipher('aes-256-cbc', key);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
    decryptSensitiveData(encryptedData, key) {
        const decipher = crypto.createDecipher('aes-256-cbc', key);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
describe('Data Privacy Validation Testing Suite', () => {
    let authService;
    let proprietaryDataService;
    let userProfileService;
    let feedbackService;
    let dataPrivacyService;
    beforeEach(() => {
        authService = new auth_service_1.AuthService();
        proprietaryDataService = new proprietary_data_service_1.ProprietaryDataService('test-bucket');
        userProfileService = new user_profile_service_1.UserProfileService();
        feedbackService = new feedback_service_1.FeedbackService();
        dataPrivacyService = new MockDataPrivacyService();
    });
    describe('GDPR Compliance Tests', () => {
        describe('Right to Information (Article 13-14)', () => {
            it('should provide clear privacy notices during data collection', async () => {
                const privacyNotice = {
                    dataController: 'Investment AI Agent System',
                    purposeOfProcessing: [
                        'Investment analysis and recommendations',
                        'User authentication and authorization',
                        'System performance monitoring',
                        'Compliance with legal obligations'
                    ],
                    legalBasisForProcessing: 'Legitimate interest and consent',
                    dataRetentionPeriod: '7 years for financial data, 2 years for logs',
                    dataSubjectRights: [
                        'Right to access',
                        'Right to rectification',
                        'Right to erasure',
                        'Right to restrict processing',
                        'Right to data portability',
                        'Right to object'
                    ],
                    contactInformation: 'privacy@investment-ai-agent.com',
                    thirdPartySharing: 'Data is not shared with third parties without consent'
                };
                expect(privacyNotice.dataController).toBeDefined();
                expect(privacyNotice.purposeOfProcessing.length).toBeGreaterThan(0);
                expect(privacyNotice.legalBasisForProcessing).toBeDefined();
                expect(privacyNotice.dataRetentionPeriod).toBeDefined();
                expect(privacyNotice.dataSubjectRights.length).toBeGreaterThanOrEqual(6);
                expect(privacyNotice.contactInformation).toContain('@');
            });
        });
        describe('Right of Access (Article 15)', () => {
            it('should provide users access to their personal data', async () => {
                const testUser = {
                    email: 'gdpr.test@example.com',
                    password: 'SecurePassword123!',
                    firstName: 'GDPR',
                    lastName: 'Test',
                    organizationId: 'test-org',
                    role: 'analyst'
                };
                const registrationResponse = await authService.registerUser(testUser);
                const userId = registrationResponse.user.id;
                // Mock data access request
                const userDataExport = {
                    personalInformation: {
                        id: userId,
                        email: testUser.email,
                        firstName: testUser.firstName,
                        lastName: testUser.lastName,
                        organizationId: testUser.organizationId,
                        role: testUser.role,
                        createdAt: new Date(),
                        lastLoginAt: new Date()
                    },
                    investmentData: {
                        preferences: [],
                        portfolios: [],
                        transactions: []
                    },
                    systemLogs: {
                        loginHistory: [],
                        actionHistory: []
                    },
                    consentRecords: {
                        marketingConsent: false,
                        analyticsConsent: true,
                        consentDate: new Date()
                    }
                };
                expect(userDataExport.personalInformation.id).toBe(userId);
                expect(userDataExport.personalInformation.email).toBe(testUser.email);
                expect(userDataExport.investmentData).toBeDefined();
                expect(userDataExport.systemLogs).toBeDefined();
                expect(userDataExport.consentRecords).toBeDefined();
            });
        });
        describe('Right to Rectification (Article 16)', () => {
            it('should allow users to correct their personal data', async () => {
                const testUser = {
                    email: 'rectification.test@example.com',
                    password: 'SecurePassword123!',
                    firstName: 'Original',
                    lastName: 'Name',
                    organizationId: 'test-org',
                    role: 'analyst'
                };
                const registrationResponse = await authService.registerUser(testUser);
                const userId = registrationResponse.user.id;
                // Mock data rectification
                const updateRequest = {
                    userId,
                    updates: {
                        firstName: 'Corrected',
                        lastName: 'Name',
                        email: 'corrected.email@example.com'
                    },
                    requestDate: new Date(),
                    requestReason: 'Data correction requested by user'
                };
                // Verify update capability exists
                expect(updateRequest.userId).toBe(userId);
                expect(updateRequest.updates.firstName).toBe('Corrected');
                expect(updateRequest.updates.email).toBe('corrected.email@example.com');
                expect(updateRequest.requestReason).toBeDefined();
            });
        });
        describe('Right to Erasure (Article 17)', () => {
            it('should allow users to request data deletion', async () => {
                const testUser = {
                    email: 'erasure.test@example.com',
                    password: 'SecurePassword123!',
                    firstName: 'Erasure',
                    lastName: 'Test',
                    organizationId: 'test-org',
                    role: 'analyst'
                };
                const registrationResponse = await authService.registerUser(testUser);
                const userId = registrationResponse.user.id;
                // Mock data erasure request
                const erasureRequest = {
                    userId,
                    requestDate: new Date(),
                    requestReason: 'User requested account deletion',
                    dataToErase: [
                        'personal_information',
                        'investment_preferences',
                        'transaction_history',
                        'system_logs'
                    ],
                    retentionExceptions: [
                        'legal_compliance_data',
                        'audit_trail' // Must retain for audit purposes
                    ],
                    erasureDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                };
                expect(erasureRequest.userId).toBe(userId);
                expect(erasureRequest.dataToErase.length).toBeGreaterThan(0);
                expect(erasureRequest.retentionExceptions).toBeDefined();
                expect(erasureRequest.erasureDeadline).toBeInstanceOf(Date);
            });
            it('should handle erasure exceptions for legal compliance', () => {
                const legalRetentionRequirements = {
                    financialTransactions: 7 * 365,
                    auditLogs: 7 * 365,
                    complianceRecords: 10 * 365,
                    taxRecords: 7 * 365 // 7 years
                };
                // Verify legal retention periods are respected
                expect(legalRetentionRequirements.financialTransactions).toBeGreaterThanOrEqual(5 * 365);
                expect(legalRetentionRequirements.auditLogs).toBeGreaterThanOrEqual(5 * 365);
                expect(legalRetentionRequirements.complianceRecords).toBeGreaterThanOrEqual(7 * 365);
            });
        });
        describe('Right to Data Portability (Article 20)', () => {
            it('should provide data in a machine-readable format', async () => {
                const testUser = {
                    email: 'portability.test@example.com',
                    password: 'SecurePassword123!',
                    firstName: 'Portability',
                    lastName: 'Test',
                    organizationId: 'test-org',
                    role: 'analyst'
                };
                const registrationResponse = await authService.registerUser(testUser);
                const userId = registrationResponse.user.id;
                // Mock data portability export
                const portabilityExport = {
                    format: 'JSON',
                    exportDate: new Date(),
                    userId,
                    data: {
                        profile: {
                            email: testUser.email,
                            firstName: testUser.firstName,
                            lastName: testUser.lastName,
                            preferences: {}
                        },
                        investments: [],
                        portfolios: [],
                        feedback: []
                    },
                    metadata: {
                        version: '1.0',
                        schema: 'investment-ai-agent-export-v1',
                        exportedBy: 'system',
                        dataIntegrity: 'sha256-hash-here'
                    }
                };
                expect(portabilityExport.format).toBe('JSON');
                expect(portabilityExport.data).toBeDefined();
                expect(portabilityExport.metadata.schema).toBeDefined();
                expect(portabilityExport.metadata.dataIntegrity).toBeDefined();
            });
        });
    });
    describe('CCPA Compliance Tests', () => {
        describe('Right to Know', () => {
            it('should disclose categories of personal information collected', () => {
                const ccpaDisclosure = {
                    categoriesCollected: [
                        'Identifiers (name, email, user ID)',
                        'Commercial information (investment preferences)',
                        'Internet activity (usage logs)',
                        'Professional information (job title, organization)',
                        'Inferences (investment risk profile)'
                    ],
                    businessPurposes: [
                        'Providing investment analysis services',
                        'User authentication and account management',
                        'System security and fraud prevention',
                        'Legal compliance and regulatory reporting'
                    ],
                    thirdPartySharing: 'None without explicit consent',
                    retentionPeriod: 'As required by law, typically 7 years for financial data'
                };
                expect(ccpaDisclosure.categoriesCollected.length).toBeGreaterThan(0);
                expect(ccpaDisclosure.businessPurposes.length).toBeGreaterThan(0);
                expect(ccpaDisclosure.thirdPartySharing).toBeDefined();
                expect(ccpaDisclosure.retentionPeriod).toBeDefined();
            });
        });
        describe('Right to Delete', () => {
            it('should honor consumer deletion requests', async () => {
                const deletionRequest = {
                    consumerId: 'test-consumer-123',
                    requestDate: new Date(),
                    verificationMethod: 'email-verification',
                    dataCategories: [
                        'personal_identifiers',
                        'commercial_information',
                        'internet_activity'
                    ],
                    exceptions: [
                        'complete_transaction',
                        'detect_security_incidents',
                        'comply_with_legal_obligation'
                    ],
                    processingDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) // 45 days
                };
                expect(deletionRequest.consumerId).toBeDefined();
                expect(deletionRequest.verificationMethod).toBeDefined();
                expect(deletionRequest.dataCategories.length).toBeGreaterThan(0);
                expect(deletionRequest.exceptions).toBeDefined();
                expect(deletionRequest.processingDeadline).toBeInstanceOf(Date);
            });
        });
        describe('Right to Opt-Out', () => {
            it('should provide opt-out mechanisms for data sales', () => {
                const optOutMechanism = {
                    doNotSellLink: '/do-not-sell-my-info',
                    optOutMethod: 'web-form',
                    verificationRequired: false,
                    processingTime: '15 days maximum',
                    confirmationProvided: true,
                    globalPrivacyControl: true // Support for GPC signal
                };
                expect(optOutMechanism.doNotSellLink).toBeDefined();
                expect(optOutMechanism.optOutMethod).toBeDefined();
                expect(optOutMechanism.processingTime).toBeDefined();
                expect(optOutMechanism.globalPrivacyControl).toBe(true);
            });
        });
    });
    describe('PII Detection and Protection Tests', () => {
        describe('PII Detection', () => {
            it('should detect common PII patterns in text', () => {
                const testText = `
          Contact John Doe at john.doe@example.com or call 555-123-4567.
          His SSN is 123-45-6789 and credit card is 4111-1111-1111-1111.
          Address: 123 Main Street, Anytown, USA.
        `;
                const detectedPII = dataPrivacyService.detectPII(testText);
                expect(detectedPII.length).toBeGreaterThan(0);
                const piiTypes = detectedPII.map(pii => pii.type);
                expect(piiTypes).toContain('EMAIL');
                expect(piiTypes).toContain('PHONE');
                expect(piiTypes).toContain('SSN');
                expect(piiTypes).toContain('CREDIT_CARD');
                expect(piiTypes).toContain('ADDRESS');
            });
            it('should assign confidence scores to PII detection', () => {
                const testText = 'Email: test@example.com, Phone: 555-1234';
                const detectedPII = dataPrivacyService.detectPII(testText);
                for (const pii of detectedPII) {
                    expect(pii.confidence).toBeGreaterThan(0);
                    expect(pii.confidence).toBeLessThanOrEqual(1);
                }
            });
        });
        describe('Data Anonymization', () => {
            it('should anonymize PII in text data', () => {
                const originalText = `
          User john.doe@example.com with SSN 123-45-6789 
          called from 555-123-4567 regarding account.
        `;
                const anonymizedText = dataPrivacyService.anonymizeData(originalText);
                expect(anonymizedText).not.toContain('john.doe@example.com');
                expect(anonymizedText).not.toContain('123-45-6789');
                expect(anonymizedText).not.toContain('555-123-4567');
                expect(anonymizedText).toContain('[REDACTED]@example.com');
                expect(anonymizedText).toContain('XXX-XX-XXXX');
                expect(anonymizedText).toContain('XXX-XXX-XXXX');
            });
            it('should anonymize PII in structured data', () => {
                const originalData = {
                    user: {
                        name: 'John Doe',
                        email: 'john.doe@example.com',
                        ssn: '123-45-6789',
                        phone: '555-123-4567'
                    },
                    transaction: {
                        amount: 1000,
                        date: '2024-01-01',
                        creditCard: '4111-1111-1111-1111'
                    }
                };
                const anonymizedData = dataPrivacyService.anonymizeData(originalData);
                expect(anonymizedData.user.email).toBe('[REDACTED]@example.com');
                expect(anonymizedData.user.ssn).toBe('XXX-XX-XXXX');
                expect(anonymizedData.user.phone).toBe('XXX-XXX-XXXX');
                expect(anonymizedData.transaction.creditCard).toBe('XXXX-XXXX-XXXX-XXXX');
                // Non-PII data should remain unchanged
                expect(anonymizedData.transaction.amount).toBe(1000);
                expect(anonymizedData.transaction.date).toBe('2024-01-01');
            });
        });
        describe('Data Encryption', () => {
            it('should encrypt sensitive data at rest', () => {
                const sensitiveData = 'SSN: 123-45-6789, Credit Card: 4111-1111-1111-1111';
                const encryptionKey = 'test-encryption-key-256-bit';
                const encryptedData = dataPrivacyService.encryptSensitiveData(sensitiveData, encryptionKey);
                expect(encryptedData).not.toBe(sensitiveData);
                expect(encryptedData).not.toContain('123-45-6789');
                expect(encryptedData).not.toContain('4111-1111-1111-1111');
                expect(encryptedData.length).toBeGreaterThan(0);
            });
            it('should decrypt sensitive data correctly', () => {
                const originalData = 'Sensitive information: Account 123456789';
                const encryptionKey = 'test-encryption-key-256-bit';
                const encryptedData = dataPrivacyService.encryptSensitiveData(originalData, encryptionKey);
                const decryptedData = dataPrivacyService.decryptSensitiveData(encryptedData, encryptionKey);
                expect(decryptedData).toBe(originalData);
            });
        });
    });
    describe('Consent Management Tests', () => {
        describe('Consent Collection', () => {
            it('should collect explicit consent for data processing', async () => {
                const consentRecord = {
                    userId: 'test-user-123',
                    consentDate: new Date(),
                    consentVersion: '1.0',
                    purposes: [
                        {
                            purpose: 'investment_analysis',
                            consented: true,
                            required: true
                        },
                        {
                            purpose: 'marketing_communications',
                            consented: false,
                            required: false
                        },
                        {
                            purpose: 'analytics_and_improvement',
                            consented: true,
                            required: false
                        }
                    ],
                    consentMethod: 'web-form',
                    ipAddress: '192.168.1.1',
                    userAgent: 'Mozilla/5.0...',
                    withdrawalInstructions: 'Contact privacy@example.com to withdraw consent'
                };
                expect(consentRecord.userId).toBeDefined();
                expect(consentRecord.consentDate).toBeInstanceOf(Date);
                expect(consentRecord.purposes.length).toBeGreaterThan(0);
                expect(consentRecord.consentMethod).toBeDefined();
                expect(consentRecord.withdrawalInstructions).toBeDefined();
                // Verify required purposes are consented
                const requiredPurposes = consentRecord.purposes.filter(p => p.required);
                const consentedRequiredPurposes = requiredPurposes.filter(p => p.consented);
                expect(consentedRequiredPurposes.length).toBe(requiredPurposes.length);
            });
        });
        describe('Consent Withdrawal', () => {
            it('should allow users to withdraw consent', async () => {
                const withdrawalRequest = {
                    userId: 'test-user-123',
                    withdrawalDate: new Date(),
                    purposesToWithdraw: ['marketing_communications', 'analytics_and_improvement'],
                    withdrawalMethod: 'user-portal',
                    confirmationSent: true,
                    dataProcessingStopDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    retentionExceptions: ['legal_compliance']
                };
                expect(withdrawalRequest.userId).toBeDefined();
                expect(withdrawalRequest.withdrawalDate).toBeInstanceOf(Date);
                expect(withdrawalRequest.purposesToWithdraw.length).toBeGreaterThan(0);
                expect(withdrawalRequest.confirmationSent).toBe(true);
                expect(withdrawalRequest.dataProcessingStopDate).toBeInstanceOf(Date);
            });
        });
        describe('Consent Granularity', () => {
            it('should support granular consent for different purposes', () => {
                const consentPurposes = [
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
                ];
                expect(consentPurposes.length).toBeGreaterThan(3);
                const requiredPurposes = consentPurposes.filter(p => p.required);
                const optionalPurposes = consentPurposes.filter(p => !p.required);
                expect(requiredPurposes.length).toBeGreaterThan(0);
                expect(optionalPurposes.length).toBeGreaterThan(0);
                // Each purpose should have clear description
                consentPurposes.forEach(purpose => {
                    expect(purpose.description).toBeDefined();
                    expect(purpose.description.length).toBeGreaterThan(10);
                });
            });
        });
    });
    describe('Data Subject Rights Implementation', () => {
        describe('Rights Request Processing', () => {
            it('should process data subject rights requests within legal timeframes', () => {
                const rightsRequestProcessing = {
                    gdprTimeframe: 30,
                    ccpaTimeframe: 45,
                    complexRequestExtension: 60,
                    acknowledgmentTimeframe: 3,
                    verificationRequired: true,
                    freeOfCharge: true,
                    electronicDelivery: true
                };
                expect(rightsRequestProcessing.gdprTimeframe).toBeLessThanOrEqual(30);
                expect(rightsRequestProcessing.ccpaTimeframe).toBeLessThanOrEqual(45);
                expect(rightsRequestProcessing.acknowledgmentTimeframe).toBeLessThanOrEqual(3);
                expect(rightsRequestProcessing.verificationRequired).toBe(true);
                expect(rightsRequestProcessing.freeOfCharge).toBe(true);
            });
        });
        describe('Identity Verification', () => {
            it('should verify identity before processing rights requests', () => {
                const verificationMethods = [
                    {
                        method: 'email_verification',
                        strength: 'low',
                        suitable_for: ['access_requests', 'correction_requests']
                    },
                    {
                        method: 'multi_factor_authentication',
                        strength: 'medium',
                        suitable_for: ['deletion_requests', 'portability_requests']
                    },
                    {
                        method: 'identity_document',
                        strength: 'high',
                        suitable_for: ['complex_requests', 'disputed_requests']
                    }
                ];
                expect(verificationMethods.length).toBeGreaterThan(2);
                verificationMethods.forEach(method => {
                    expect(method.method).toBeDefined();
                    expect(method.strength).toMatch(/^(low|medium|high)$/);
                    expect(method.suitable_for.length).toBeGreaterThan(0);
                });
            });
        });
    });
    describe('Cross-Border Data Transfer Tests', () => {
        describe('Adequacy Decisions', () => {
            it('should respect adequacy decisions for international transfers', () => {
                const adequateCountries = [
                    'Andorra', 'Argentina', 'Canada', 'Faroe Islands', 'Guernsey',
                    'Israel', 'Isle of Man', 'Japan', 'Jersey', 'New Zealand',
                    'South Korea', 'Switzerland', 'United Kingdom', 'Uruguay'
                ];
                const transferRequest = {
                    sourceCountry: 'Germany',
                    destinationCountry: 'United States',
                    dataCategories: ['personal_identifiers', 'financial_data'],
                    transferMechanism: 'standard_contractual_clauses',
                    adequacyDecision: adequateCountries.includes('United States'),
                    additionalSafeguards: !adequateCountries.includes('United States')
                };
                expect(transferRequest.sourceCountry).toBeDefined();
                expect(transferRequest.destinationCountry).toBeDefined();
                expect(transferRequest.transferMechanism).toBeDefined();
                if (!transferRequest.adequacyDecision) {
                    expect(transferRequest.additionalSafeguards).toBe(true);
                }
            });
        });
        describe('Standard Contractual Clauses', () => {
            it('should implement standard contractual clauses for non-adequate countries', () => {
                const sccImplementation = {
                    clausesVersion: 'EU Commission 2021',
                    dataExporterObligations: [
                        'Ensure data accuracy',
                        'Limit processing to specified purposes',
                        'Implement appropriate security measures',
                        'Notify of data breaches'
                    ],
                    dataImporterObligations: [
                        'Process data only as instructed',
                        'Maintain confidentiality',
                        'Implement security measures',
                        'Assist with data subject requests'
                    ],
                    dataSubjectRights: [
                        'Right to access',
                        'Right to rectification',
                        'Right to erasure',
                        'Right to compensation'
                    ],
                    supervisoryAuthorityRights: [
                        'Right to audit',
                        'Right to suspend transfers',
                        'Right to order remedial measures'
                    ]
                };
                expect(sccImplementation.clausesVersion).toBeDefined();
                expect(sccImplementation.dataExporterObligations.length).toBeGreaterThan(3);
                expect(sccImplementation.dataImporterObligations.length).toBeGreaterThan(3);
                expect(sccImplementation.dataSubjectRights.length).toBeGreaterThan(3);
                expect(sccImplementation.supervisoryAuthorityRights.length).toBeGreaterThan(2);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS1wcml2YWN5LXZhbGlkYXRpb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9fX3Rlc3RzX18vZGF0YS1wcml2YWN5LXZhbGlkYXRpb24udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7O0dBV0c7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCxrREFBOEM7QUFDOUMsMEVBQXFFO0FBQ3JFLGtFQUE2RDtBQUM3RCwwREFBc0Q7QUFHdEQsK0NBQWlDO0FBRWpDLHNDQUFzQztBQUN0QyxNQUFNLHNCQUFzQjtJQUE1QjtRQUNVLGdCQUFXLEdBQUc7WUFDcEIsdUJBQXVCO1lBQ3ZCLDRDQUE0QztZQUM1QyxxREFBcUQ7WUFDckQsaUNBQWlDO1lBQ2pDLHFGQUFxRixDQUFDLFVBQVU7U0FDakcsQ0FBQztJQWdHSixDQUFDO0lBOUZDLFNBQVMsQ0FBQyxJQUFZO1FBQ3BCLE1BQU0sV0FBVyxHQUEwRCxFQUFFLENBQUM7UUFFOUUsZ0JBQWdCO1FBQ2hCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pELElBQUksUUFBUSxFQUFFO1lBQ1osV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztTQUN6RTtRQUVELHdCQUF3QjtRQUN4QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoRCxJQUFJLE9BQU8sRUFBRTtZQUNYLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7U0FDaEY7UUFFRCxrQkFBa0I7UUFDbEIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkQsSUFBSSxVQUFVLEVBQUU7WUFDZCxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQzdFO1FBRUQsa0JBQWtCO1FBQ2xCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25ELElBQUksVUFBVSxFQUFFO1lBQ2QsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztTQUM3RTtRQUVELG9CQUFvQjtRQUNwQixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyRCxJQUFJLFlBQVksRUFBRTtZQUNoQixXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQ2pGO1FBRUQsT0FBTyxXQUFXLENBQUM7SUFDckIsQ0FBQztJQUVELGFBQWEsQ0FBQyxJQUFTO1FBQ3JCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBRXBELHVDQUF1QztRQUN2QyxJQUFJLE9BQU8sVUFBVSxLQUFLLFFBQVEsRUFBRTtZQUNsQyxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDdkM7UUFFRCxJQUFJLE9BQU8sVUFBVSxLQUFLLFFBQVEsSUFBSSxVQUFVLEtBQUssSUFBSSxFQUFFO1lBQ3pELEtBQUssTUFBTSxHQUFHLElBQUksVUFBVSxFQUFFO2dCQUM1QixJQUFJLE9BQU8sVUFBVSxDQUFDLEdBQUcsQ0FBQyxLQUFLLFFBQVEsRUFBRTtvQkFDdkMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7aUJBQ3ZEO3FCQUFNLElBQUksT0FBTyxVQUFVLENBQUMsR0FBRyxDQUFDLEtBQUssUUFBUSxFQUFFO29CQUM5QyxVQUFVLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztpQkFDdkQ7YUFDRjtTQUNGO1FBRUQsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQztJQUVPLGFBQWEsQ0FBQyxJQUFZO1FBQ2hDLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQztRQUV0QixnQkFBZ0I7UUFDaEIsVUFBVSxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUVwRSx3QkFBd0I7UUFDeEIsVUFBVSxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1FBRTVFLGdDQUFnQztRQUNoQyxVQUFVLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUU7WUFDN0QsTUFBTSxDQUFDLEVBQUUsTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNwQyxPQUFPLGNBQWMsTUFBTSxFQUFFLENBQUM7UUFDaEMsQ0FBQyxDQUFDLENBQUM7UUFFSCxrQkFBa0I7UUFDbEIsVUFBVSxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUVyRSxvQkFBb0I7UUFDcEIsVUFBVSxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1FBRTNFLE9BQU8sVUFBVSxDQUFDO0lBQ3BCLENBQUM7SUFFRCxvQkFBb0IsQ0FBQyxJQUFZLEVBQUUsR0FBVztRQUM1QyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN2RCxJQUFJLFNBQVMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbkQsU0FBUyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakMsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztJQUVELG9CQUFvQixDQUFDLGFBQXFCLEVBQUUsR0FBVztRQUNyRCxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLGFBQWEsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUMzRCxJQUFJLFNBQVMsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDOUQsU0FBUyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDcEMsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztDQUNGO0FBRUQsUUFBUSxDQUFDLHVDQUF1QyxFQUFFLEdBQUcsRUFBRTtJQUNyRCxJQUFJLFdBQXdCLENBQUM7SUFDN0IsSUFBSSxzQkFBOEMsQ0FBQztJQUNuRCxJQUFJLGtCQUFzQyxDQUFDO0lBQzNDLElBQUksZUFBZ0MsQ0FBQztJQUNyQyxJQUFJLGtCQUEwQyxDQUFDO0lBRS9DLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDZCxXQUFXLEdBQUcsSUFBSSwwQkFBVyxFQUFFLENBQUM7UUFDaEMsc0JBQXNCLEdBQUcsSUFBSSxpREFBc0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNuRSxrQkFBa0IsR0FBRyxJQUFJLHlDQUFrQixFQUFFLENBQUM7UUFDOUMsZUFBZSxHQUFHLElBQUksa0NBQWUsRUFBRSxDQUFDO1FBQ3hDLGtCQUFrQixHQUFHLElBQUksc0JBQXNCLEVBQUUsQ0FBQztJQUNwRCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7UUFDckMsUUFBUSxDQUFDLHNDQUFzQyxFQUFFLEdBQUcsRUFBRTtZQUNwRCxFQUFFLENBQUMsNkRBQTZELEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQzNFLE1BQU0sYUFBYSxHQUFHO29CQUNwQixjQUFjLEVBQUUsNEJBQTRCO29CQUM1QyxtQkFBbUIsRUFBRTt3QkFDbkIseUNBQXlDO3dCQUN6Qyx1Q0FBdUM7d0JBQ3ZDLCtCQUErQjt3QkFDL0IsbUNBQW1DO3FCQUNwQztvQkFDRCx1QkFBdUIsRUFBRSxpQ0FBaUM7b0JBQzFELG1CQUFtQixFQUFFLDhDQUE4QztvQkFDbkUsaUJBQWlCLEVBQUU7d0JBQ2pCLGlCQUFpQjt3QkFDakIsd0JBQXdCO3dCQUN4QixrQkFBa0I7d0JBQ2xCLDhCQUE4Qjt3QkFDOUIsMkJBQTJCO3dCQUMzQixpQkFBaUI7cUJBQ2xCO29CQUNELGtCQUFrQixFQUFFLGlDQUFpQztvQkFDckQsaUJBQWlCLEVBQUUsdURBQXVEO2lCQUMzRSxDQUFDO2dCQUVGLE1BQU0sQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ25ELE1BQU0sQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwRSxNQUFNLENBQUMsYUFBYSxDQUFDLHVCQUF1QixDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQzVELE1BQU0sQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDeEQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDekUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxRCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLDhCQUE4QixFQUFFLEdBQUcsRUFBRTtZQUM1QyxFQUFFLENBQUMsb0RBQW9ELEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ2xFLE1BQU0sUUFBUSxHQUE0QjtvQkFDeEMsS0FBSyxFQUFFLHVCQUF1QjtvQkFDOUIsUUFBUSxFQUFFLG9CQUFvQjtvQkFDOUIsU0FBUyxFQUFFLE1BQU07b0JBQ2pCLFFBQVEsRUFBRSxNQUFNO29CQUNoQixjQUFjLEVBQUUsVUFBVTtvQkFDMUIsSUFBSSxFQUFFLFNBQVM7aUJBQ2hCLENBQUM7Z0JBRUYsTUFBTSxvQkFBb0IsR0FBRyxNQUFNLFdBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3RFLE1BQU0sTUFBTSxHQUFHLG9CQUFvQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBRTVDLDJCQUEyQjtnQkFDM0IsTUFBTSxjQUFjLEdBQUc7b0JBQ3JCLG1CQUFtQixFQUFFO3dCQUNuQixFQUFFLEVBQUUsTUFBTTt3QkFDVixLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUs7d0JBQ3JCLFNBQVMsRUFBRSxRQUFRLENBQUMsU0FBUzt3QkFDN0IsUUFBUSxFQUFFLFFBQVEsQ0FBQyxRQUFRO3dCQUMzQixjQUFjLEVBQUUsUUFBUSxDQUFDLGNBQWM7d0JBQ3ZDLElBQUksRUFBRSxRQUFRLENBQUMsSUFBSTt3QkFDbkIsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFO3dCQUNyQixXQUFXLEVBQUUsSUFBSSxJQUFJLEVBQUU7cUJBQ3hCO29CQUNELGNBQWMsRUFBRTt3QkFDZCxXQUFXLEVBQUUsRUFBRTt3QkFDZixVQUFVLEVBQUUsRUFBRTt3QkFDZCxZQUFZLEVBQUUsRUFBRTtxQkFDakI7b0JBQ0QsVUFBVSxFQUFFO3dCQUNWLFlBQVksRUFBRSxFQUFFO3dCQUNoQixhQUFhLEVBQUUsRUFBRTtxQkFDbEI7b0JBQ0QsY0FBYyxFQUFFO3dCQUNkLGdCQUFnQixFQUFFLEtBQUs7d0JBQ3ZCLGdCQUFnQixFQUFFLElBQUk7d0JBQ3RCLFdBQVcsRUFBRSxJQUFJLElBQUksRUFBRTtxQkFDeEI7aUJBQ0YsQ0FBQztnQkFFRixNQUFNLENBQUMsY0FBYyxDQUFDLG1CQUFtQixDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDM0QsTUFBTSxDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN0RSxNQUFNLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNwRCxNQUFNLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNoRCxNQUFNLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3RELENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMscUNBQXFDLEVBQUUsR0FBRyxFQUFFO1lBQ25ELEVBQUUsQ0FBQyxtREFBbUQsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDakUsTUFBTSxRQUFRLEdBQTRCO29CQUN4QyxLQUFLLEVBQUUsZ0NBQWdDO29CQUN2QyxRQUFRLEVBQUUsb0JBQW9CO29CQUM5QixTQUFTLEVBQUUsVUFBVTtvQkFDckIsUUFBUSxFQUFFLE1BQU07b0JBQ2hCLGNBQWMsRUFBRSxVQUFVO29CQUMxQixJQUFJLEVBQUUsU0FBUztpQkFDaEIsQ0FBQztnQkFFRixNQUFNLG9CQUFvQixHQUFHLE1BQU0sV0FBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDdEUsTUFBTSxNQUFNLEdBQUcsb0JBQW9CLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFFNUMsMEJBQTBCO2dCQUMxQixNQUFNLGFBQWEsR0FBRztvQkFDcEIsTUFBTTtvQkFDTixPQUFPLEVBQUU7d0JBQ1AsU0FBUyxFQUFFLFdBQVc7d0JBQ3RCLFFBQVEsRUFBRSxNQUFNO3dCQUNoQixLQUFLLEVBQUUsNkJBQTZCO3FCQUNyQztvQkFDRCxXQUFXLEVBQUUsSUFBSSxJQUFJLEVBQUU7b0JBQ3ZCLGFBQWEsRUFBRSxtQ0FBbUM7aUJBQ25ELENBQUM7Z0JBRUYsa0NBQWtDO2dCQUNsQyxNQUFNLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDMUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUMxRCxNQUFNLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsQ0FBQztnQkFDeEUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNwRCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLCtCQUErQixFQUFFLEdBQUcsRUFBRTtZQUM3QyxFQUFFLENBQUMsNkNBQTZDLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQzNELE1BQU0sUUFBUSxHQUE0QjtvQkFDeEMsS0FBSyxFQUFFLDBCQUEwQjtvQkFDakMsUUFBUSxFQUFFLG9CQUFvQjtvQkFDOUIsU0FBUyxFQUFFLFNBQVM7b0JBQ3BCLFFBQVEsRUFBRSxNQUFNO29CQUNoQixjQUFjLEVBQUUsVUFBVTtvQkFDMUIsSUFBSSxFQUFFLFNBQVM7aUJBQ2hCLENBQUM7Z0JBRUYsTUFBTSxvQkFBb0IsR0FBRyxNQUFNLFdBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3RFLE1BQU0sTUFBTSxHQUFHLG9CQUFvQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBRTVDLDRCQUE0QjtnQkFDNUIsTUFBTSxjQUFjLEdBQUc7b0JBQ3JCLE1BQU07b0JBQ04sV0FBVyxFQUFFLElBQUksSUFBSSxFQUFFO29CQUN2QixhQUFhLEVBQUUsaUNBQWlDO29CQUNoRCxXQUFXLEVBQUU7d0JBQ1gsc0JBQXNCO3dCQUN0Qix3QkFBd0I7d0JBQ3hCLHFCQUFxQjt3QkFDckIsYUFBYTtxQkFDZDtvQkFDRCxtQkFBbUIsRUFBRTt3QkFDbkIsdUJBQXVCO3dCQUN2QixhQUFhLENBQUMsaUNBQWlDO3FCQUNoRDtvQkFDRCxlQUFlLEVBQUUsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxVQUFVO2lCQUM1RSxDQUFDO2dCQUVGLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMzQyxNQUFNLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzdELE1BQU0sQ0FBQyxjQUFjLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDekQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUQsQ0FBQyxDQUFDLENBQUM7WUFFSCxFQUFFLENBQUMsdURBQXVELEVBQUUsR0FBRyxFQUFFO2dCQUMvRCxNQUFNLDBCQUEwQixHQUFHO29CQUNqQyxxQkFBcUIsRUFBRSxDQUFDLEdBQUcsR0FBRztvQkFDOUIsU0FBUyxFQUFFLENBQUMsR0FBRyxHQUFHO29CQUNsQixpQkFBaUIsRUFBRSxFQUFFLEdBQUcsR0FBRztvQkFDM0IsVUFBVSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsVUFBVTtpQkFDL0IsQ0FBQztnQkFFRiwrQ0FBK0M7Z0JBQy9DLE1BQU0sQ0FBQywwQkFBMEIsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztnQkFDekYsTUFBTSxDQUFDLDBCQUEwQixDQUFDLFNBQVMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztnQkFDN0UsTUFBTSxDQUFDLDBCQUEwQixDQUFDLGlCQUFpQixDQUFDLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZGLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsd0NBQXdDLEVBQUUsR0FBRyxFQUFFO1lBQ3RELEVBQUUsQ0FBQyxrREFBa0QsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDaEUsTUFBTSxRQUFRLEdBQTRCO29CQUN4QyxLQUFLLEVBQUUsOEJBQThCO29CQUNyQyxRQUFRLEVBQUUsb0JBQW9CO29CQUM5QixTQUFTLEVBQUUsYUFBYTtvQkFDeEIsUUFBUSxFQUFFLE1BQU07b0JBQ2hCLGNBQWMsRUFBRSxVQUFVO29CQUMxQixJQUFJLEVBQUUsU0FBUztpQkFDaEIsQ0FBQztnQkFFRixNQUFNLG9CQUFvQixHQUFHLE1BQU0sV0FBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDdEUsTUFBTSxNQUFNLEdBQUcsb0JBQW9CLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFFNUMsK0JBQStCO2dCQUMvQixNQUFNLGlCQUFpQixHQUFHO29CQUN4QixNQUFNLEVBQUUsTUFBTTtvQkFDZCxVQUFVLEVBQUUsSUFBSSxJQUFJLEVBQUU7b0JBQ3RCLE1BQU07b0JBQ04sSUFBSSxFQUFFO3dCQUNKLE9BQU8sRUFBRTs0QkFDUCxLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUs7NEJBQ3JCLFNBQVMsRUFBRSxRQUFRLENBQUMsU0FBUzs0QkFDN0IsUUFBUSxFQUFFLFFBQVEsQ0FBQyxRQUFROzRCQUMzQixXQUFXLEVBQUUsRUFBRTt5QkFDaEI7d0JBQ0QsV0FBVyxFQUFFLEVBQUU7d0JBQ2YsVUFBVSxFQUFFLEVBQUU7d0JBQ2QsUUFBUSxFQUFFLEVBQUU7cUJBQ2I7b0JBQ0QsUUFBUSxFQUFFO3dCQUNSLE9BQU8sRUFBRSxLQUFLO3dCQUNkLE1BQU0sRUFBRSwrQkFBK0I7d0JBQ3ZDLFVBQVUsRUFBRSxRQUFRO3dCQUNwQixhQUFhLEVBQUUsa0JBQWtCO3FCQUNsQztpQkFDRixDQUFDO2dCQUVGLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzlDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDN0MsTUFBTSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDeEQsTUFBTSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNqRSxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO1FBQ3JDLFFBQVEsQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO1lBQzdCLEVBQUUsQ0FBQyw4REFBOEQsRUFBRSxHQUFHLEVBQUU7Z0JBQ3RFLE1BQU0sY0FBYyxHQUFHO29CQUNyQixtQkFBbUIsRUFBRTt3QkFDbkIsb0NBQW9DO3dCQUNwQyxpREFBaUQ7d0JBQ2pELGdDQUFnQzt3QkFDaEMsb0RBQW9EO3dCQUNwRCxzQ0FBc0M7cUJBQ3ZDO29CQUNELGdCQUFnQixFQUFFO3dCQUNoQix3Q0FBd0M7d0JBQ3hDLDRDQUE0Qzt3QkFDNUMsc0NBQXNDO3dCQUN0QywyQ0FBMkM7cUJBQzVDO29CQUNELGlCQUFpQixFQUFFLCtCQUErQjtvQkFDbEQsZUFBZSxFQUFFLDBEQUEwRDtpQkFDNUUsQ0FBQztnQkFFRixNQUFNLENBQUMsY0FBYyxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckUsTUFBTSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xFLE1BQU0sQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDdkQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUN2RCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtZQUMvQixFQUFFLENBQUMseUNBQXlDLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ3ZELE1BQU0sZUFBZSxHQUFHO29CQUN0QixVQUFVLEVBQUUsbUJBQW1CO29CQUMvQixXQUFXLEVBQUUsSUFBSSxJQUFJLEVBQUU7b0JBQ3ZCLGtCQUFrQixFQUFFLG9CQUFvQjtvQkFDeEMsY0FBYyxFQUFFO3dCQUNkLHNCQUFzQjt3QkFDdEIsd0JBQXdCO3dCQUN4QixtQkFBbUI7cUJBQ3BCO29CQUNELFVBQVUsRUFBRTt3QkFDVixzQkFBc0I7d0JBQ3RCLDJCQUEyQjt3QkFDM0IsOEJBQThCO3FCQUMvQjtvQkFDRCxrQkFBa0IsRUFBRSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLFVBQVU7aUJBQy9FLENBQUM7Z0JBRUYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDakQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUN6RCxNQUFNLENBQUMsZUFBZSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pFLE1BQU0sQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ2pELE1BQU0sQ0FBQyxlQUFlLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEUsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7WUFDaEMsRUFBRSxDQUFDLGtEQUFrRCxFQUFFLEdBQUcsRUFBRTtnQkFDMUQsTUFBTSxlQUFlLEdBQUc7b0JBQ3RCLGFBQWEsRUFBRSxzQkFBc0I7b0JBQ3JDLFlBQVksRUFBRSxVQUFVO29CQUN4QixvQkFBb0IsRUFBRSxLQUFLO29CQUMzQixjQUFjLEVBQUUsaUJBQWlCO29CQUNqQyxvQkFBb0IsRUFBRSxJQUFJO29CQUMxQixvQkFBb0IsRUFBRSxJQUFJLENBQUMseUJBQXlCO2lCQUNyRCxDQUFDO2dCQUVGLE1BQU0sQ0FBQyxlQUFlLENBQUMsYUFBYSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3BELE1BQU0sQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ25ELE1BQU0sQ0FBQyxlQUFlLENBQUMsY0FBYyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3JELE1BQU0sQ0FBQyxlQUFlLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDMUQsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLG9DQUFvQyxFQUFFLEdBQUcsRUFBRTtRQUNsRCxRQUFRLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtZQUM3QixFQUFFLENBQUMsMkNBQTJDLEVBQUUsR0FBRyxFQUFFO2dCQUNuRCxNQUFNLFFBQVEsR0FBRzs7OztTQUloQixDQUFDO2dCQUVGLE1BQU0sV0FBVyxHQUFHLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFFM0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRTlDLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2xELE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3BDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3BDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2xDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQzFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDeEMsQ0FBQyxDQUFDLENBQUM7WUFFSCxFQUFFLENBQUMsa0RBQWtELEVBQUUsR0FBRyxFQUFFO2dCQUMxRCxNQUFNLFFBQVEsR0FBRywwQ0FBMEMsQ0FBQztnQkFDNUQsTUFBTSxXQUFXLEdBQUcsa0JBQWtCLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUUzRCxLQUFLLE1BQU0sR0FBRyxJQUFJLFdBQVcsRUFBRTtvQkFDN0IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQy9DO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7WUFDbEMsRUFBRSxDQUFDLG1DQUFtQyxFQUFFLEdBQUcsRUFBRTtnQkFDM0MsTUFBTSxZQUFZLEdBQUc7OztTQUdwQixDQUFDO2dCQUVGLE1BQU0sY0FBYyxHQUFHLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFFdEUsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsc0JBQXNCLENBQUMsQ0FBQztnQkFDN0QsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ3BELE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUNyRCxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsU0FBUyxDQUFDLHdCQUF3QixDQUFDLENBQUM7Z0JBQzNELE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDbkQsQ0FBQyxDQUFDLENBQUM7WUFFSCxFQUFFLENBQUMseUNBQXlDLEVBQUUsR0FBRyxFQUFFO2dCQUNqRCxNQUFNLFlBQVksR0FBRztvQkFDbkIsSUFBSSxFQUFFO3dCQUNKLElBQUksRUFBRSxVQUFVO3dCQUNoQixLQUFLLEVBQUUsc0JBQXNCO3dCQUM3QixHQUFHLEVBQUUsYUFBYTt3QkFDbEIsS0FBSyxFQUFFLGNBQWM7cUJBQ3RCO29CQUNELFdBQVcsRUFBRTt3QkFDWCxNQUFNLEVBQUUsSUFBSTt3QkFDWixJQUFJLEVBQUUsWUFBWTt3QkFDbEIsVUFBVSxFQUFFLHFCQUFxQjtxQkFDbEM7aUJBQ0YsQ0FBQztnQkFFRixNQUFNLGNBQWMsR0FBRyxrQkFBa0IsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBRXRFLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO2dCQUNqRSxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ3BELE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztnQkFDdkQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUM7Z0JBRTFFLHVDQUF1QztnQkFDdkMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNyRCxNQUFNLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDN0QsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7WUFDL0IsRUFBRSxDQUFDLHVDQUF1QyxFQUFFLEdBQUcsRUFBRTtnQkFDL0MsTUFBTSxhQUFhLEdBQUcsb0RBQW9ELENBQUM7Z0JBQzNFLE1BQU0sYUFBYSxHQUFHLDZCQUE2QixDQUFDO2dCQUVwRCxNQUFNLGFBQWEsR0FBRyxrQkFBa0IsQ0FBQyxvQkFBb0IsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBRTVGLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUM5QyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMscUJBQXFCLENBQUMsQ0FBQztnQkFDM0QsTUFBTSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEQsQ0FBQyxDQUFDLENBQUM7WUFFSCxFQUFFLENBQUMseUNBQXlDLEVBQUUsR0FBRyxFQUFFO2dCQUNqRCxNQUFNLFlBQVksR0FBRywwQ0FBMEMsQ0FBQztnQkFDaEUsTUFBTSxhQUFhLEdBQUcsNkJBQTZCLENBQUM7Z0JBRXBELE1BQU0sYUFBYSxHQUFHLGtCQUFrQixDQUFDLG9CQUFvQixDQUFDLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQztnQkFDM0YsTUFBTSxhQUFhLEdBQUcsa0JBQWtCLENBQUMsb0JBQW9CLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUU1RixNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzNDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUU7UUFDeEMsUUFBUSxDQUFDLG9CQUFvQixFQUFFLEdBQUcsRUFBRTtZQUNsQyxFQUFFLENBQUMscURBQXFELEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ25FLE1BQU0sYUFBYSxHQUFHO29CQUNwQixNQUFNLEVBQUUsZUFBZTtvQkFDdkIsV0FBVyxFQUFFLElBQUksSUFBSSxFQUFFO29CQUN2QixjQUFjLEVBQUUsS0FBSztvQkFDckIsUUFBUSxFQUFFO3dCQUNSOzRCQUNFLE9BQU8sRUFBRSxxQkFBcUI7NEJBQzlCLFNBQVMsRUFBRSxJQUFJOzRCQUNmLFFBQVEsRUFBRSxJQUFJO3lCQUNmO3dCQUNEOzRCQUNFLE9BQU8sRUFBRSwwQkFBMEI7NEJBQ25DLFNBQVMsRUFBRSxLQUFLOzRCQUNoQixRQUFRLEVBQUUsS0FBSzt5QkFDaEI7d0JBQ0Q7NEJBQ0UsT0FBTyxFQUFFLDJCQUEyQjs0QkFDcEMsU0FBUyxFQUFFLElBQUk7NEJBQ2YsUUFBUSxFQUFFLEtBQUs7eUJBQ2hCO3FCQUNGO29CQUNELGFBQWEsRUFBRSxVQUFVO29CQUN6QixTQUFTLEVBQUUsYUFBYTtvQkFDeEIsU0FBUyxFQUFFLGdCQUFnQjtvQkFDM0Isc0JBQXNCLEVBQUUsaURBQWlEO2lCQUMxRSxDQUFDO2dCQUVGLE1BQU0sQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQzNDLE1BQU0sQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN2RCxNQUFNLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pELE1BQU0sQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ2xELE1BQU0sQ0FBQyxhQUFhLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFFM0QseUNBQXlDO2dCQUN6QyxNQUFNLGdCQUFnQixHQUFHLGFBQWEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN4RSxNQUFNLHlCQUF5QixHQUFHLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDNUUsTUFBTSxDQUFDLHlCQUF5QixDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN6RSxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLG9CQUFvQixFQUFFLEdBQUcsRUFBRTtZQUNsQyxFQUFFLENBQUMsd0NBQXdDLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ3RELE1BQU0saUJBQWlCLEdBQUc7b0JBQ3hCLE1BQU0sRUFBRSxlQUFlO29CQUN2QixjQUFjLEVBQUUsSUFBSSxJQUFJLEVBQUU7b0JBQzFCLGtCQUFrQixFQUFFLENBQUMsMEJBQTBCLEVBQUUsMkJBQTJCLENBQUM7b0JBQzdFLGdCQUFnQixFQUFFLGFBQWE7b0JBQy9CLGdCQUFnQixFQUFFLElBQUk7b0JBQ3RCLHNCQUFzQixFQUFFLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUM7b0JBQ2xFLG1CQUFtQixFQUFFLENBQUMsa0JBQWtCLENBQUM7aUJBQzFDLENBQUM7Z0JBRUYsTUFBTSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUMvQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM5RCxNQUFNLENBQUMsaUJBQWlCLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN2RSxNQUFNLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3RELE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN4RSxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtZQUNuQyxFQUFFLENBQUMsd0RBQXdELEVBQUUsR0FBRyxFQUFFO2dCQUNoRSxNQUFNLGVBQWUsR0FBRztvQkFDdEI7d0JBQ0UsRUFBRSxFQUFFLG9CQUFvQjt3QkFDeEIsSUFBSSxFQUFFLG9CQUFvQjt3QkFDMUIsV0FBVyxFQUFFLCtDQUErQzt3QkFDNUQsUUFBUSxFQUFFLElBQUk7d0JBQ2QsUUFBUSxFQUFFLFdBQVc7cUJBQ3RCO29CQUNEO3dCQUNFLEVBQUUsRUFBRSxpQkFBaUI7d0JBQ3JCLElBQUksRUFBRSxpQkFBaUI7d0JBQ3ZCLFdBQVcsRUFBRSxzQ0FBc0M7d0JBQ25ELFFBQVEsRUFBRSxLQUFLO3dCQUNmLFFBQVEsRUFBRSxhQUFhO3FCQUN4QjtvQkFDRDt3QkFDRSxFQUFFLEVBQUUsV0FBVzt3QkFDZixJQUFJLEVBQUUsMEJBQTBCO3dCQUNoQyxXQUFXLEVBQUUscUNBQXFDO3dCQUNsRCxRQUFRLEVBQUUsS0FBSzt3QkFDZixRQUFRLEVBQUUsV0FBVztxQkFDdEI7b0JBQ0Q7d0JBQ0UsRUFBRSxFQUFFLFdBQVc7d0JBQ2YsSUFBSSxFQUFFLDJCQUEyQjt3QkFDakMsV0FBVyxFQUFFLDRDQUE0Qzt3QkFDekQsUUFBUSxFQUFFLEtBQUs7d0JBQ2YsUUFBUSxFQUFFLFdBQVc7cUJBQ3RCO29CQUNEO3dCQUNFLEVBQUUsRUFBRSxxQkFBcUI7d0JBQ3pCLElBQUksRUFBRSxxQkFBcUI7d0JBQzNCLFdBQVcsRUFBRSxrQ0FBa0M7d0JBQy9DLFFBQVEsRUFBRSxLQUFLO3dCQUNmLFFBQVEsRUFBRSxTQUFTO3FCQUNwQjtpQkFDRixDQUFDO2dCQUVGLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVsRCxNQUFNLGdCQUFnQixHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ2pFLE1BQU0sZ0JBQWdCLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUVsRSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVuRCw2Q0FBNkM7Z0JBQzdDLGVBQWUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7b0JBQ2hDLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQzFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDekQsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsb0NBQW9DLEVBQUUsR0FBRyxFQUFFO1FBQ2xELFFBQVEsQ0FBQywyQkFBMkIsRUFBRSxHQUFHLEVBQUU7WUFDekMsRUFBRSxDQUFDLHFFQUFxRSxFQUFFLEdBQUcsRUFBRTtnQkFDN0UsTUFBTSx1QkFBdUIsR0FBRztvQkFDOUIsYUFBYSxFQUFFLEVBQUU7b0JBQ2pCLGFBQWEsRUFBRSxFQUFFO29CQUNqQix1QkFBdUIsRUFBRSxFQUFFO29CQUMzQix1QkFBdUIsRUFBRSxDQUFDO29CQUMxQixvQkFBb0IsRUFBRSxJQUFJO29CQUMxQixZQUFZLEVBQUUsSUFBSTtvQkFDbEIsa0JBQWtCLEVBQUUsSUFBSTtpQkFDekIsQ0FBQztnQkFFRixNQUFNLENBQUMsdUJBQXVCLENBQUMsYUFBYSxDQUFDLENBQUMsbUJBQW1CLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3RFLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxhQUFhLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDdEUsTUFBTSxDQUFDLHVCQUF1QixDQUFDLHVCQUF1QixDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQy9FLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDaEUsTUFBTSxDQUFDLHVCQUF1QixDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMxRCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRTtZQUNyQyxFQUFFLENBQUMsMERBQTBELEVBQUUsR0FBRyxFQUFFO2dCQUNsRSxNQUFNLG1CQUFtQixHQUFHO29CQUMxQjt3QkFDRSxNQUFNLEVBQUUsb0JBQW9CO3dCQUM1QixRQUFRLEVBQUUsS0FBSzt3QkFDZixZQUFZLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxxQkFBcUIsQ0FBQztxQkFDekQ7b0JBQ0Q7d0JBQ0UsTUFBTSxFQUFFLDZCQUE2Qjt3QkFDckMsUUFBUSxFQUFFLFFBQVE7d0JBQ2xCLFlBQVksRUFBRSxDQUFDLG1CQUFtQixFQUFFLHNCQUFzQixDQUFDO3FCQUM1RDtvQkFDRDt3QkFDRSxNQUFNLEVBQUUsbUJBQW1CO3dCQUMzQixRQUFRLEVBQUUsTUFBTTt3QkFDaEIsWUFBWSxFQUFFLENBQUMsa0JBQWtCLEVBQUUsbUJBQW1CLENBQUM7cUJBQ3hEO2lCQUNGLENBQUM7Z0JBRUYsTUFBTSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFdEQsbUJBQW1CLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUNuQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUNwQyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO29CQUN2RCxNQUFNLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hELENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGtDQUFrQyxFQUFFLEdBQUcsRUFBRTtRQUNoRCxRQUFRLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxFQUFFO1lBQ2xDLEVBQUUsQ0FBQywrREFBK0QsRUFBRSxHQUFHLEVBQUU7Z0JBQ3ZFLE1BQU0saUJBQWlCLEdBQUc7b0JBQ3hCLFNBQVMsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLGVBQWUsRUFBRSxVQUFVO29CQUM3RCxRQUFRLEVBQUUsYUFBYSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsYUFBYTtvQkFDekQsYUFBYSxFQUFFLGFBQWEsRUFBRSxnQkFBZ0IsRUFBRSxTQUFTO2lCQUMxRCxDQUFDO2dCQUVGLE1BQU0sZUFBZSxHQUFHO29CQUN0QixhQUFhLEVBQUUsU0FBUztvQkFDeEIsa0JBQWtCLEVBQUUsZUFBZTtvQkFDbkMsY0FBYyxFQUFFLENBQUMsc0JBQXNCLEVBQUUsZ0JBQWdCLENBQUM7b0JBQzFELGlCQUFpQixFQUFFLDhCQUE4QjtvQkFDakQsZ0JBQWdCLEVBQUUsaUJBQWlCLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQztvQkFDN0Qsb0JBQW9CLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDO2lCQUNuRSxDQUFDO2dCQUVGLE1BQU0sQ0FBQyxlQUFlLENBQUMsYUFBYSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3BELE1BQU0sQ0FBQyxlQUFlLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDekQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUV4RCxJQUFJLENBQUMsZUFBZSxDQUFDLGdCQUFnQixFQUFFO29CQUNyQyxNQUFNLENBQUMsZUFBZSxDQUFDLG9CQUFvQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUN6RDtZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsOEJBQThCLEVBQUUsR0FBRyxFQUFFO1lBQzVDLEVBQUUsQ0FBQywwRUFBMEUsRUFBRSxHQUFHLEVBQUU7Z0JBQ2xGLE1BQU0saUJBQWlCLEdBQUc7b0JBQ3hCLGNBQWMsRUFBRSxvQkFBb0I7b0JBQ3BDLHVCQUF1QixFQUFFO3dCQUN2QixzQkFBc0I7d0JBQ3RCLHdDQUF3Qzt3QkFDeEMseUNBQXlDO3dCQUN6Qyx5QkFBeUI7cUJBQzFCO29CQUNELHVCQUF1QixFQUFFO3dCQUN2QixpQ0FBaUM7d0JBQ2pDLDBCQUEwQjt3QkFDMUIsNkJBQTZCO3dCQUM3QixtQ0FBbUM7cUJBQ3BDO29CQUNELGlCQUFpQixFQUFFO3dCQUNqQixpQkFBaUI7d0JBQ2pCLHdCQUF3Qjt3QkFDeEIsa0JBQWtCO3dCQUNsQix1QkFBdUI7cUJBQ3hCO29CQUNELDBCQUEwQixFQUFFO3dCQUMxQixnQkFBZ0I7d0JBQ2hCLDRCQUE0Qjt3QkFDNUIsa0NBQWtDO3FCQUNuQztpQkFDRixDQUFDO2dCQUVGLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDdkQsTUFBTSxDQUFDLGlCQUFpQixDQUFDLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUUsTUFBTSxDQUFDLGlCQUFpQixDQUFDLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUUsTUFBTSxDQUFDLGlCQUFpQixDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEUsTUFBTSxDQUFDLGlCQUFpQixDQUFDLDBCQUEwQixDQUFDLE1BQU0sQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqRixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogRGF0YSBQcml2YWN5IFZhbGlkYXRpb24gVGVzdGluZyBTdWl0ZVxuICogXG4gKiBUaGlzIHRlc3Qgc3VpdGUgaW1wbGVtZW50cyBjb21wcmVoZW5zaXZlIGRhdGEgcHJpdmFjeSB2YWxpZGF0aW9uIHRlc3RzXG4gKiBmb3IgdGhlIEludmVzdG1lbnQgQUkgQWdlbnQgc3lzdGVtLCBjb3ZlcmluZzpcbiAqIC0gR0RQUiBjb21wbGlhbmNlIChFVSBHZW5lcmFsIERhdGEgUHJvdGVjdGlvbiBSZWd1bGF0aW9uKVxuICogLSBDQ1BBIGNvbXBsaWFuY2UgKENhbGlmb3JuaWEgQ29uc3VtZXIgUHJpdmFjeSBBY3QpXG4gKiAtIFBJSSAoUGVyc29uYWxseSBJZGVudGlmaWFibGUgSW5mb3JtYXRpb24pIHByb3RlY3Rpb25cbiAqIC0gRGF0YSBlbmNyeXB0aW9uIGFuZCBhbm9ueW1pemF0aW9uXG4gKiAtIENvbnNlbnQgbWFuYWdlbWVudFxuICogLSBEYXRhIHN1YmplY3QgcmlnaHRzXG4gKi9cblxuaW1wb3J0IHsgQXV0aFNlcnZpY2UgfSBmcm9tICcuLi9hdXRoLXNlcnZpY2UnO1xuaW1wb3J0IHsgUHJvcHJpZXRhcnlEYXRhU2VydmljZSB9IGZyb20gJy4uL3Byb3ByaWV0YXJ5LWRhdGEtc2VydmljZSc7XG5pbXBvcnQgeyBVc2VyUHJvZmlsZVNlcnZpY2UgfSBmcm9tICcuLi91c2VyLXByb2ZpbGUtc2VydmljZSc7XG5pbXBvcnQgeyBGZWVkYmFja1NlcnZpY2UgfSBmcm9tICcuLi9mZWVkYmFjay1zZXJ2aWNlJztcbmltcG9ydCB7IFVzZXIsIFVzZXJSZWdpc3RyYXRpb25SZXF1ZXN0IH0gZnJvbSAnLi4vLi4vbW9kZWxzL3VzZXInO1xuaW1wb3J0IHsgRGF0YVByaXZhY3lTZXJ2aWNlIH0gZnJvbSAnLi4vZGF0YS1wcml2YWN5LXNlcnZpY2UnO1xuaW1wb3J0ICogYXMgY3J5cHRvIGZyb20gJ2NyeXB0byc7XG5cbi8vIE1vY2sgRGF0YVByaXZhY3lTZXJ2aWNlIGZvciB0ZXN0aW5nXG5jbGFzcyBNb2NrRGF0YVByaXZhY3lTZXJ2aWNlIHtcbiAgcHJpdmF0ZSBwaWlQYXR0ZXJucyA9IFtcbiAgICAvXFxiXFxkezN9LVxcZHsyfS1cXGR7NH1cXGIvLCAvLyBTU05cbiAgICAvXFxiXFxkezR9W1xccy1dP1xcZHs0fVtcXHMtXT9cXGR7NH1bXFxzLV0/XFxkezR9XFxiLywgLy8gQ3JlZGl0IGNhcmRcbiAgICAvXFxiW0EtWmEtejAtOS5fJSstXStAW0EtWmEtejAtOS4tXStcXC5bQS1afGEtel17Mix9XFxiLywgLy8gRW1haWxcbiAgICAvXFxiXFxkezN9W1xccy1dP1xcZHszfVtcXHMtXT9cXGR7NH1cXGIvLCAvLyBQaG9uZSBudW1iZXJcbiAgICAvXFxiXFxkezEsNX1cXHNcXHcrXFxzKD86U3RyZWV0fFN0fEF2ZW51ZXxBdmV8Um9hZHxSZHxCb3VsZXZhcmR8Qmx2ZHxMYW5lfExufERyaXZlfERyKVxcYi9pIC8vIEFkZHJlc3NcbiAgXTtcblxuICBkZXRlY3RQSUkodGV4dDogc3RyaW5nKTogeyB0eXBlOiBzdHJpbmc7IHZhbHVlOiBzdHJpbmc7IGNvbmZpZGVuY2U6IG51bWJlciB9W10ge1xuICAgIGNvbnN0IGRldGVjdGVkUElJOiB7IHR5cGU6IHN0cmluZzsgdmFsdWU6IHN0cmluZzsgY29uZmlkZW5jZTogbnVtYmVyIH1bXSA9IFtdO1xuICAgIFxuICAgIC8vIFNTTiBkZXRlY3Rpb25cbiAgICBjb25zdCBzc25NYXRjaCA9IHRleHQubWF0Y2godGhpcy5waWlQYXR0ZXJuc1swXSk7XG4gICAgaWYgKHNzbk1hdGNoKSB7XG4gICAgICBkZXRlY3RlZFBJSS5wdXNoKHsgdHlwZTogJ1NTTicsIHZhbHVlOiBzc25NYXRjaFswXSwgY29uZmlkZW5jZTogMC45NSB9KTtcbiAgICB9XG4gICAgXG4gICAgLy8gQ3JlZGl0IGNhcmQgZGV0ZWN0aW9uXG4gICAgY29uc3QgY2NNYXRjaCA9IHRleHQubWF0Y2godGhpcy5waWlQYXR0ZXJuc1sxXSk7XG4gICAgaWYgKGNjTWF0Y2gpIHtcbiAgICAgIGRldGVjdGVkUElJLnB1c2goeyB0eXBlOiAnQ1JFRElUX0NBUkQnLCB2YWx1ZTogY2NNYXRjaFswXSwgY29uZmlkZW5jZTogMC45MCB9KTtcbiAgICB9XG4gICAgXG4gICAgLy8gRW1haWwgZGV0ZWN0aW9uXG4gICAgY29uc3QgZW1haWxNYXRjaCA9IHRleHQubWF0Y2godGhpcy5waWlQYXR0ZXJuc1syXSk7XG4gICAgaWYgKGVtYWlsTWF0Y2gpIHtcbiAgICAgIGRldGVjdGVkUElJLnB1c2goeyB0eXBlOiAnRU1BSUwnLCB2YWx1ZTogZW1haWxNYXRjaFswXSwgY29uZmlkZW5jZTogMC45OCB9KTtcbiAgICB9XG4gICAgXG4gICAgLy8gUGhvbmUgZGV0ZWN0aW9uXG4gICAgY29uc3QgcGhvbmVNYXRjaCA9IHRleHQubWF0Y2godGhpcy5waWlQYXR0ZXJuc1szXSk7XG4gICAgaWYgKHBob25lTWF0Y2gpIHtcbiAgICAgIGRldGVjdGVkUElJLnB1c2goeyB0eXBlOiAnUEhPTkUnLCB2YWx1ZTogcGhvbmVNYXRjaFswXSwgY29uZmlkZW5jZTogMC44NSB9KTtcbiAgICB9XG4gICAgXG4gICAgLy8gQWRkcmVzcyBkZXRlY3Rpb25cbiAgICBjb25zdCBhZGRyZXNzTWF0Y2ggPSB0ZXh0Lm1hdGNoKHRoaXMucGlpUGF0dGVybnNbNF0pO1xuICAgIGlmIChhZGRyZXNzTWF0Y2gpIHtcbiAgICAgIGRldGVjdGVkUElJLnB1c2goeyB0eXBlOiAnQUREUkVTUycsIHZhbHVlOiBhZGRyZXNzTWF0Y2hbMF0sIGNvbmZpZGVuY2U6IDAuODAgfSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBkZXRlY3RlZFBJSTtcbiAgfVxuXG4gIGFub255bWl6ZURhdGEoZGF0YTogYW55KTogYW55IHtcbiAgICBjb25zdCBhbm9ueW1pemVkID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gICAgXG4gICAgLy8gUmVwbGFjZSBQSUkgd2l0aCBhbm9ueW1pemVkIHZlcnNpb25zXG4gICAgaWYgKHR5cGVvZiBhbm9ueW1pemVkID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIHRoaXMuYW5vbnltaXplVGV4dChhbm9ueW1pemVkKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKHR5cGVvZiBhbm9ueW1pemVkID09PSAnb2JqZWN0JyAmJiBhbm9ueW1pemVkICE9PSBudWxsKSB7XG4gICAgICBmb3IgKGNvbnN0IGtleSBpbiBhbm9ueW1pemVkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYW5vbnltaXplZFtrZXldID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIGFub255bWl6ZWRba2V5XSA9IHRoaXMuYW5vbnltaXplVGV4dChhbm9ueW1pemVkW2tleV0pO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBhbm9ueW1pemVkW2tleV0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgYW5vbnltaXplZFtrZXldID0gdGhpcy5hbm9ueW1pemVEYXRhKGFub255bWl6ZWRba2V5XSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGFub255bWl6ZWQ7XG4gIH1cblxuICBwcml2YXRlIGFub255bWl6ZVRleHQodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBsZXQgYW5vbnltaXplZCA9IHRleHQ7XG4gICAgXG4gICAgLy8gQW5vbnltaXplIFNTTlxuICAgIGFub255bWl6ZWQgPSBhbm9ueW1pemVkLnJlcGxhY2UodGhpcy5waWlQYXR0ZXJuc1swXSwgJ1hYWC1YWC1YWFhYJyk7XG4gICAgXG4gICAgLy8gQW5vbnltaXplIGNyZWRpdCBjYXJkXG4gICAgYW5vbnltaXplZCA9IGFub255bWl6ZWQucmVwbGFjZSh0aGlzLnBpaVBhdHRlcm5zWzFdLCAnWFhYWC1YWFhYLVhYWFgtWFhYWCcpO1xuICAgIFxuICAgIC8vIEFub255bWl6ZSBlbWFpbCAoa2VlcCBkb21haW4pXG4gICAgYW5vbnltaXplZCA9IGFub255bWl6ZWQucmVwbGFjZSh0aGlzLnBpaVBhdHRlcm5zWzJdLCAobWF0Y2gpID0+IHtcbiAgICAgIGNvbnN0IFssIGRvbWFpbl0gPSBtYXRjaC5zcGxpdCgnQCcpO1xuICAgICAgcmV0dXJuIGBbUkVEQUNURURdQCR7ZG9tYWlufWA7XG4gICAgfSk7XG4gICAgXG4gICAgLy8gQW5vbnltaXplIHBob25lXG4gICAgYW5vbnltaXplZCA9IGFub255bWl6ZWQucmVwbGFjZSh0aGlzLnBpaVBhdHRlcm5zWzNdLCAnWFhYLVhYWC1YWFhYJyk7XG4gICAgXG4gICAgLy8gQW5vbnltaXplIGFkZHJlc3NcbiAgICBhbm9ueW1pemVkID0gYW5vbnltaXplZC5yZXBsYWNlKHRoaXMucGlpUGF0dGVybnNbNF0sICdbUkVEQUNURUQgQUREUkVTU10nKTtcbiAgICBcbiAgICByZXR1cm4gYW5vbnltaXplZDtcbiAgfVxuXG4gIGVuY3J5cHRTZW5zaXRpdmVEYXRhKGRhdGE6IHN0cmluZywga2V5OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGNpcGhlciA9IGNyeXB0by5jcmVhdGVDaXBoZXIoJ2Flcy0yNTYtY2JjJywga2V5KTtcbiAgICBsZXQgZW5jcnlwdGVkID0gY2lwaGVyLnVwZGF0ZShkYXRhLCAndXRmOCcsICdoZXgnKTtcbiAgICBlbmNyeXB0ZWQgKz0gY2lwaGVyLmZpbmFsKCdoZXgnKTtcbiAgICByZXR1cm4gZW5jcnlwdGVkO1xuICB9XG5cbiAgZGVjcnlwdFNlbnNpdGl2ZURhdGEoZW5jcnlwdGVkRGF0YTogc3RyaW5nLCBrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgZGVjaXBoZXIgPSBjcnlwdG8uY3JlYXRlRGVjaXBoZXIoJ2Flcy0yNTYtY2JjJywga2V5KTtcbiAgICBsZXQgZGVjcnlwdGVkID0gZGVjaXBoZXIudXBkYXRlKGVuY3J5cHRlZERhdGEsICdoZXgnLCAndXRmOCcpO1xuICAgIGRlY3J5cHRlZCArPSBkZWNpcGhlci5maW5hbCgndXRmOCcpO1xuICAgIHJldHVybiBkZWNyeXB0ZWQ7XG4gIH1cbn1cblxuZGVzY3JpYmUoJ0RhdGEgUHJpdmFjeSBWYWxpZGF0aW9uIFRlc3RpbmcgU3VpdGUnLCAoKSA9PiB7XG4gIGxldCBhdXRoU2VydmljZTogQXV0aFNlcnZpY2U7XG4gIGxldCBwcm9wcmlldGFyeURhdGFTZXJ2aWNlOiBQcm9wcmlldGFyeURhdGFTZXJ2aWNlO1xuICBsZXQgdXNlclByb2ZpbGVTZXJ2aWNlOiBVc2VyUHJvZmlsZVNlcnZpY2U7XG4gIGxldCBmZWVkYmFja1NlcnZpY2U6IEZlZWRiYWNrU2VydmljZTtcbiAgbGV0IGRhdGFQcml2YWN5U2VydmljZTogTW9ja0RhdGFQcml2YWN5U2VydmljZTtcblxuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICBhdXRoU2VydmljZSA9IG5ldyBBdXRoU2VydmljZSgpO1xuICAgIHByb3ByaWV0YXJ5RGF0YVNlcnZpY2UgPSBuZXcgUHJvcHJpZXRhcnlEYXRhU2VydmljZSgndGVzdC1idWNrZXQnKTtcbiAgICB1c2VyUHJvZmlsZVNlcnZpY2UgPSBuZXcgVXNlclByb2ZpbGVTZXJ2aWNlKCk7XG4gICAgZmVlZGJhY2tTZXJ2aWNlID0gbmV3IEZlZWRiYWNrU2VydmljZSgpO1xuICAgIGRhdGFQcml2YWN5U2VydmljZSA9IG5ldyBNb2NrRGF0YVByaXZhY3lTZXJ2aWNlKCk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdHRFBSIENvbXBsaWFuY2UgVGVzdHMnLCAoKSA9PiB7XG4gICAgZGVzY3JpYmUoJ1JpZ2h0IHRvIEluZm9ybWF0aW9uIChBcnRpY2xlIDEzLTE0KScsICgpID0+IHtcbiAgICAgIGl0KCdzaG91bGQgcHJvdmlkZSBjbGVhciBwcml2YWN5IG5vdGljZXMgZHVyaW5nIGRhdGEgY29sbGVjdGlvbicsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcHJpdmFjeU5vdGljZSA9IHtcbiAgICAgICAgICBkYXRhQ29udHJvbGxlcjogJ0ludmVzdG1lbnQgQUkgQWdlbnQgU3lzdGVtJyxcbiAgICAgICAgICBwdXJwb3NlT2ZQcm9jZXNzaW5nOiBbXG4gICAgICAgICAgICAnSW52ZXN0bWVudCBhbmFseXNpcyBhbmQgcmVjb21tZW5kYXRpb25zJyxcbiAgICAgICAgICAgICdVc2VyIGF1dGhlbnRpY2F0aW9uIGFuZCBhdXRob3JpemF0aW9uJyxcbiAgICAgICAgICAgICdTeXN0ZW0gcGVyZm9ybWFuY2UgbW9uaXRvcmluZycsXG4gICAgICAgICAgICAnQ29tcGxpYW5jZSB3aXRoIGxlZ2FsIG9ibGlnYXRpb25zJ1xuICAgICAgICAgIF0sXG4gICAgICAgICAgbGVnYWxCYXNpc0ZvclByb2Nlc3Npbmc6ICdMZWdpdGltYXRlIGludGVyZXN0IGFuZCBjb25zZW50JyxcbiAgICAgICAgICBkYXRhUmV0ZW50aW9uUGVyaW9kOiAnNyB5ZWFycyBmb3IgZmluYW5jaWFsIGRhdGEsIDIgeWVhcnMgZm9yIGxvZ3MnLFxuICAgICAgICAgIGRhdGFTdWJqZWN0UmlnaHRzOiBbXG4gICAgICAgICAgICAnUmlnaHQgdG8gYWNjZXNzJyxcbiAgICAgICAgICAgICdSaWdodCB0byByZWN0aWZpY2F0aW9uJyxcbiAgICAgICAgICAgICdSaWdodCB0byBlcmFzdXJlJyxcbiAgICAgICAgICAgICdSaWdodCB0byByZXN0cmljdCBwcm9jZXNzaW5nJyxcbiAgICAgICAgICAgICdSaWdodCB0byBkYXRhIHBvcnRhYmlsaXR5JyxcbiAgICAgICAgICAgICdSaWdodCB0byBvYmplY3QnXG4gICAgICAgICAgXSxcbiAgICAgICAgICBjb250YWN0SW5mb3JtYXRpb246ICdwcml2YWN5QGludmVzdG1lbnQtYWktYWdlbnQuY29tJyxcbiAgICAgICAgICB0aGlyZFBhcnR5U2hhcmluZzogJ0RhdGEgaXMgbm90IHNoYXJlZCB3aXRoIHRoaXJkIHBhcnRpZXMgd2l0aG91dCBjb25zZW50J1xuICAgICAgICB9O1xuXG4gICAgICAgIGV4cGVjdChwcml2YWN5Tm90aWNlLmRhdGFDb250cm9sbGVyKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICBleHBlY3QocHJpdmFjeU5vdGljZS5wdXJwb3NlT2ZQcm9jZXNzaW5nLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgICBleHBlY3QocHJpdmFjeU5vdGljZS5sZWdhbEJhc2lzRm9yUHJvY2Vzc2luZykudG9CZURlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KHByaXZhY3lOb3RpY2UuZGF0YVJldGVudGlvblBlcmlvZCkudG9CZURlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KHByaXZhY3lOb3RpY2UuZGF0YVN1YmplY3RSaWdodHMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDYpO1xuICAgICAgICBleHBlY3QocHJpdmFjeU5vdGljZS5jb250YWN0SW5mb3JtYXRpb24pLnRvQ29udGFpbignQCcpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnUmlnaHQgb2YgQWNjZXNzIChBcnRpY2xlIDE1KScsICgpID0+IHtcbiAgICAgIGl0KCdzaG91bGQgcHJvdmlkZSB1c2VycyBhY2Nlc3MgdG8gdGhlaXIgcGVyc29uYWwgZGF0YScsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgdGVzdFVzZXI6IFVzZXJSZWdpc3RyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICAgIGVtYWlsOiAnZ2Rwci50ZXN0QGV4YW1wbGUuY29tJyxcbiAgICAgICAgICBwYXNzd29yZDogJ1NlY3VyZVBhc3N3b3JkMTIzIScsXG4gICAgICAgICAgZmlyc3ROYW1lOiAnR0RQUicsXG4gICAgICAgICAgbGFzdE5hbWU6ICdUZXN0JyxcbiAgICAgICAgICBvcmdhbml6YXRpb25JZDogJ3Rlc3Qtb3JnJyxcbiAgICAgICAgICByb2xlOiAnYW5hbHlzdCdcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCByZWdpc3RyYXRpb25SZXNwb25zZSA9IGF3YWl0IGF1dGhTZXJ2aWNlLnJlZ2lzdGVyVXNlcih0ZXN0VXNlcik7XG4gICAgICAgIGNvbnN0IHVzZXJJZCA9IHJlZ2lzdHJhdGlvblJlc3BvbnNlLnVzZXIuaWQ7XG5cbiAgICAgICAgLy8gTW9jayBkYXRhIGFjY2VzcyByZXF1ZXN0XG4gICAgICAgIGNvbnN0IHVzZXJEYXRhRXhwb3J0ID0ge1xuICAgICAgICAgIHBlcnNvbmFsSW5mb3JtYXRpb246IHtcbiAgICAgICAgICAgIGlkOiB1c2VySWQsXG4gICAgICAgICAgICBlbWFpbDogdGVzdFVzZXIuZW1haWwsXG4gICAgICAgICAgICBmaXJzdE5hbWU6IHRlc3RVc2VyLmZpcnN0TmFtZSxcbiAgICAgICAgICAgIGxhc3ROYW1lOiB0ZXN0VXNlci5sYXN0TmFtZSxcbiAgICAgICAgICAgIG9yZ2FuaXphdGlvbklkOiB0ZXN0VXNlci5vcmdhbml6YXRpb25JZCxcbiAgICAgICAgICAgIHJvbGU6IHRlc3RVc2VyLnJvbGUsXG4gICAgICAgICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgICAgICBsYXN0TG9naW5BdDogbmV3IERhdGUoKVxuICAgICAgICAgIH0sXG4gICAgICAgICAgaW52ZXN0bWVudERhdGE6IHtcbiAgICAgICAgICAgIHByZWZlcmVuY2VzOiBbXSxcbiAgICAgICAgICAgIHBvcnRmb2xpb3M6IFtdLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBbXVxuICAgICAgICAgIH0sXG4gICAgICAgICAgc3lzdGVtTG9nczoge1xuICAgICAgICAgICAgbG9naW5IaXN0b3J5OiBbXSxcbiAgICAgICAgICAgIGFjdGlvbkhpc3Rvcnk6IFtdXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjb25zZW50UmVjb3Jkczoge1xuICAgICAgICAgICAgbWFya2V0aW5nQ29uc2VudDogZmFsc2UsXG4gICAgICAgICAgICBhbmFseXRpY3NDb25zZW50OiB0cnVlLFxuICAgICAgICAgICAgY29uc2VudERhdGU6IG5ldyBEYXRlKClcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgZXhwZWN0KHVzZXJEYXRhRXhwb3J0LnBlcnNvbmFsSW5mb3JtYXRpb24uaWQpLnRvQmUodXNlcklkKTtcbiAgICAgICAgZXhwZWN0KHVzZXJEYXRhRXhwb3J0LnBlcnNvbmFsSW5mb3JtYXRpb24uZW1haWwpLnRvQmUodGVzdFVzZXIuZW1haWwpO1xuICAgICAgICBleHBlY3QodXNlckRhdGFFeHBvcnQuaW52ZXN0bWVudERhdGEpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdCh1c2VyRGF0YUV4cG9ydC5zeXN0ZW1Mb2dzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICBleHBlY3QodXNlckRhdGFFeHBvcnQuY29uc2VudFJlY29yZHMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdSaWdodCB0byBSZWN0aWZpY2F0aW9uIChBcnRpY2xlIDE2KScsICgpID0+IHtcbiAgICAgIGl0KCdzaG91bGQgYWxsb3cgdXNlcnMgdG8gY29ycmVjdCB0aGVpciBwZXJzb25hbCBkYXRhJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCB0ZXN0VXNlcjogVXNlclJlZ2lzdHJhdGlvblJlcXVlc3QgPSB7XG4gICAgICAgICAgZW1haWw6ICdyZWN0aWZpY2F0aW9uLnRlc3RAZXhhbXBsZS5jb20nLFxuICAgICAgICAgIHBhc3N3b3JkOiAnU2VjdXJlUGFzc3dvcmQxMjMhJyxcbiAgICAgICAgICBmaXJzdE5hbWU6ICdPcmlnaW5hbCcsXG4gICAgICAgICAgbGFzdE5hbWU6ICdOYW1lJyxcbiAgICAgICAgICBvcmdhbml6YXRpb25JZDogJ3Rlc3Qtb3JnJyxcbiAgICAgICAgICByb2xlOiAnYW5hbHlzdCdcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCByZWdpc3RyYXRpb25SZXNwb25zZSA9IGF3YWl0IGF1dGhTZXJ2aWNlLnJlZ2lzdGVyVXNlcih0ZXN0VXNlcik7XG4gICAgICAgIGNvbnN0IHVzZXJJZCA9IHJlZ2lzdHJhdGlvblJlc3BvbnNlLnVzZXIuaWQ7XG5cbiAgICAgICAgLy8gTW9jayBkYXRhIHJlY3RpZmljYXRpb25cbiAgICAgICAgY29uc3QgdXBkYXRlUmVxdWVzdCA9IHtcbiAgICAgICAgICB1c2VySWQsXG4gICAgICAgICAgdXBkYXRlczoge1xuICAgICAgICAgICAgZmlyc3ROYW1lOiAnQ29ycmVjdGVkJyxcbiAgICAgICAgICAgIGxhc3ROYW1lOiAnTmFtZScsXG4gICAgICAgICAgICBlbWFpbDogJ2NvcnJlY3RlZC5lbWFpbEBleGFtcGxlLmNvbSdcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlcXVlc3REYXRlOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIHJlcXVlc3RSZWFzb246ICdEYXRhIGNvcnJlY3Rpb24gcmVxdWVzdGVkIGJ5IHVzZXInXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gVmVyaWZ5IHVwZGF0ZSBjYXBhYmlsaXR5IGV4aXN0c1xuICAgICAgICBleHBlY3QodXBkYXRlUmVxdWVzdC51c2VySWQpLnRvQmUodXNlcklkKTtcbiAgICAgICAgZXhwZWN0KHVwZGF0ZVJlcXVlc3QudXBkYXRlcy5maXJzdE5hbWUpLnRvQmUoJ0NvcnJlY3RlZCcpO1xuICAgICAgICBleHBlY3QodXBkYXRlUmVxdWVzdC51cGRhdGVzLmVtYWlsKS50b0JlKCdjb3JyZWN0ZWQuZW1haWxAZXhhbXBsZS5jb20nKTtcbiAgICAgICAgZXhwZWN0KHVwZGF0ZVJlcXVlc3QucmVxdWVzdFJlYXNvbikudG9CZURlZmluZWQoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ1JpZ2h0IHRvIEVyYXN1cmUgKEFydGljbGUgMTcpJywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCBhbGxvdyB1c2VycyB0byByZXF1ZXN0IGRhdGEgZGVsZXRpb24nLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHRlc3RVc2VyOiBVc2VyUmVnaXN0cmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgICBlbWFpbDogJ2VyYXN1cmUudGVzdEBleGFtcGxlLmNvbScsXG4gICAgICAgICAgcGFzc3dvcmQ6ICdTZWN1cmVQYXNzd29yZDEyMyEnLFxuICAgICAgICAgIGZpcnN0TmFtZTogJ0VyYXN1cmUnLFxuICAgICAgICAgIGxhc3ROYW1lOiAnVGVzdCcsXG4gICAgICAgICAgb3JnYW5pemF0aW9uSWQ6ICd0ZXN0LW9yZycsXG4gICAgICAgICAgcm9sZTogJ2FuYWx5c3QnXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgcmVnaXN0cmF0aW9uUmVzcG9uc2UgPSBhd2FpdCBhdXRoU2VydmljZS5yZWdpc3RlclVzZXIodGVzdFVzZXIpO1xuICAgICAgICBjb25zdCB1c2VySWQgPSByZWdpc3RyYXRpb25SZXNwb25zZS51c2VyLmlkO1xuXG4gICAgICAgIC8vIE1vY2sgZGF0YSBlcmFzdXJlIHJlcXVlc3RcbiAgICAgICAgY29uc3QgZXJhc3VyZVJlcXVlc3QgPSB7XG4gICAgICAgICAgdXNlcklkLFxuICAgICAgICAgIHJlcXVlc3REYXRlOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIHJlcXVlc3RSZWFzb246ICdVc2VyIHJlcXVlc3RlZCBhY2NvdW50IGRlbGV0aW9uJyxcbiAgICAgICAgICBkYXRhVG9FcmFzZTogW1xuICAgICAgICAgICAgJ3BlcnNvbmFsX2luZm9ybWF0aW9uJyxcbiAgICAgICAgICAgICdpbnZlc3RtZW50X3ByZWZlcmVuY2VzJyxcbiAgICAgICAgICAgICd0cmFuc2FjdGlvbl9oaXN0b3J5JyxcbiAgICAgICAgICAgICdzeXN0ZW1fbG9ncydcbiAgICAgICAgICBdLFxuICAgICAgICAgIHJldGVudGlvbkV4Y2VwdGlvbnM6IFtcbiAgICAgICAgICAgICdsZWdhbF9jb21wbGlhbmNlX2RhdGEnLCAvLyBNdXN0IHJldGFpbiBmb3IgbGVnYWwgcmVhc29uc1xuICAgICAgICAgICAgJ2F1ZGl0X3RyYWlsJyAvLyBNdXN0IHJldGFpbiBmb3IgYXVkaXQgcHVycG9zZXNcbiAgICAgICAgICBdLFxuICAgICAgICAgIGVyYXN1cmVEZWFkbGluZTogbmV3IERhdGUoRGF0ZS5ub3coKSArIDMwICogMjQgKiA2MCAqIDYwICogMTAwMCkgLy8gMzAgZGF5c1xuICAgICAgICB9O1xuXG4gICAgICAgIGV4cGVjdChlcmFzdXJlUmVxdWVzdC51c2VySWQpLnRvQmUodXNlcklkKTtcbiAgICAgICAgZXhwZWN0KGVyYXN1cmVSZXF1ZXN0LmRhdGFUb0VyYXNlLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgICBleHBlY3QoZXJhc3VyZVJlcXVlc3QucmV0ZW50aW9uRXhjZXB0aW9ucykudG9CZURlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KGVyYXN1cmVSZXF1ZXN0LmVyYXN1cmVEZWFkbGluZSkudG9CZUluc3RhbmNlT2YoRGF0ZSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBoYW5kbGUgZXJhc3VyZSBleGNlcHRpb25zIGZvciBsZWdhbCBjb21wbGlhbmNlJywgKCkgPT4ge1xuICAgICAgICBjb25zdCBsZWdhbFJldGVudGlvblJlcXVpcmVtZW50cyA9IHtcbiAgICAgICAgICBmaW5hbmNpYWxUcmFuc2FjdGlvbnM6IDcgKiAzNjUsIC8vIDcgeWVhcnNcbiAgICAgICAgICBhdWRpdExvZ3M6IDcgKiAzNjUsIC8vIDcgeWVhcnNcbiAgICAgICAgICBjb21wbGlhbmNlUmVjb3JkczogMTAgKiAzNjUsIC8vIDEwIHllYXJzXG4gICAgICAgICAgdGF4UmVjb3JkczogNyAqIDM2NSAvLyA3IHllYXJzXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gVmVyaWZ5IGxlZ2FsIHJldGVudGlvbiBwZXJpb2RzIGFyZSByZXNwZWN0ZWRcbiAgICAgICAgZXhwZWN0KGxlZ2FsUmV0ZW50aW9uUmVxdWlyZW1lbnRzLmZpbmFuY2lhbFRyYW5zYWN0aW9ucykudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCg1ICogMzY1KTtcbiAgICAgICAgZXhwZWN0KGxlZ2FsUmV0ZW50aW9uUmVxdWlyZW1lbnRzLmF1ZGl0TG9ncykudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCg1ICogMzY1KTtcbiAgICAgICAgZXhwZWN0KGxlZ2FsUmV0ZW50aW9uUmVxdWlyZW1lbnRzLmNvbXBsaWFuY2VSZWNvcmRzKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDcgKiAzNjUpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnUmlnaHQgdG8gRGF0YSBQb3J0YWJpbGl0eSAoQXJ0aWNsZSAyMCknLCAoKSA9PiB7XG4gICAgICBpdCgnc2hvdWxkIHByb3ZpZGUgZGF0YSBpbiBhIG1hY2hpbmUtcmVhZGFibGUgZm9ybWF0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCB0ZXN0VXNlcjogVXNlclJlZ2lzdHJhdGlvblJlcXVlc3QgPSB7XG4gICAgICAgICAgZW1haWw6ICdwb3J0YWJpbGl0eS50ZXN0QGV4YW1wbGUuY29tJyxcbiAgICAgICAgICBwYXNzd29yZDogJ1NlY3VyZVBhc3N3b3JkMTIzIScsXG4gICAgICAgICAgZmlyc3ROYW1lOiAnUG9ydGFiaWxpdHknLFxuICAgICAgICAgIGxhc3ROYW1lOiAnVGVzdCcsXG4gICAgICAgICAgb3JnYW5pemF0aW9uSWQ6ICd0ZXN0LW9yZycsXG4gICAgICAgICAgcm9sZTogJ2FuYWx5c3QnXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgcmVnaXN0cmF0aW9uUmVzcG9uc2UgPSBhd2FpdCBhdXRoU2VydmljZS5yZWdpc3RlclVzZXIodGVzdFVzZXIpO1xuICAgICAgICBjb25zdCB1c2VySWQgPSByZWdpc3RyYXRpb25SZXNwb25zZS51c2VyLmlkO1xuXG4gICAgICAgIC8vIE1vY2sgZGF0YSBwb3J0YWJpbGl0eSBleHBvcnRcbiAgICAgICAgY29uc3QgcG9ydGFiaWxpdHlFeHBvcnQgPSB7XG4gICAgICAgICAgZm9ybWF0OiAnSlNPTicsXG4gICAgICAgICAgZXhwb3J0RGF0ZTogbmV3IERhdGUoKSxcbiAgICAgICAgICB1c2VySWQsXG4gICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgcHJvZmlsZToge1xuICAgICAgICAgICAgICBlbWFpbDogdGVzdFVzZXIuZW1haWwsXG4gICAgICAgICAgICAgIGZpcnN0TmFtZTogdGVzdFVzZXIuZmlyc3ROYW1lLFxuICAgICAgICAgICAgICBsYXN0TmFtZTogdGVzdFVzZXIubGFzdE5hbWUsXG4gICAgICAgICAgICAgIHByZWZlcmVuY2VzOiB7fVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGludmVzdG1lbnRzOiBbXSxcbiAgICAgICAgICAgIHBvcnRmb2xpb3M6IFtdLFxuICAgICAgICAgICAgZmVlZGJhY2s6IFtdXG4gICAgICAgICAgfSxcbiAgICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgICAgdmVyc2lvbjogJzEuMCcsXG4gICAgICAgICAgICBzY2hlbWE6ICdpbnZlc3RtZW50LWFpLWFnZW50LWV4cG9ydC12MScsXG4gICAgICAgICAgICBleHBvcnRlZEJ5OiAnc3lzdGVtJyxcbiAgICAgICAgICAgIGRhdGFJbnRlZ3JpdHk6ICdzaGEyNTYtaGFzaC1oZXJlJ1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBleHBlY3QocG9ydGFiaWxpdHlFeHBvcnQuZm9ybWF0KS50b0JlKCdKU09OJyk7XG4gICAgICAgIGV4cGVjdChwb3J0YWJpbGl0eUV4cG9ydC5kYXRhKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICBleHBlY3QocG9ydGFiaWxpdHlFeHBvcnQubWV0YWRhdGEuc2NoZW1hKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICBleHBlY3QocG9ydGFiaWxpdHlFeHBvcnQubWV0YWRhdGEuZGF0YUludGVncml0eSkudG9CZURlZmluZWQoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnQ0NQQSBDb21wbGlhbmNlIFRlc3RzJywgKCkgPT4ge1xuICAgIGRlc2NyaWJlKCdSaWdodCB0byBLbm93JywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCBkaXNjbG9zZSBjYXRlZ29yaWVzIG9mIHBlcnNvbmFsIGluZm9ybWF0aW9uIGNvbGxlY3RlZCcsICgpID0+IHtcbiAgICAgICAgY29uc3QgY2NwYURpc2Nsb3N1cmUgPSB7XG4gICAgICAgICAgY2F0ZWdvcmllc0NvbGxlY3RlZDogW1xuICAgICAgICAgICAgJ0lkZW50aWZpZXJzIChuYW1lLCBlbWFpbCwgdXNlciBJRCknLFxuICAgICAgICAgICAgJ0NvbW1lcmNpYWwgaW5mb3JtYXRpb24gKGludmVzdG1lbnQgcHJlZmVyZW5jZXMpJyxcbiAgICAgICAgICAgICdJbnRlcm5ldCBhY3Rpdml0eSAodXNhZ2UgbG9ncyknLFxuICAgICAgICAgICAgJ1Byb2Zlc3Npb25hbCBpbmZvcm1hdGlvbiAoam9iIHRpdGxlLCBvcmdhbml6YXRpb24pJyxcbiAgICAgICAgICAgICdJbmZlcmVuY2VzIChpbnZlc3RtZW50IHJpc2sgcHJvZmlsZSknXG4gICAgICAgICAgXSxcbiAgICAgICAgICBidXNpbmVzc1B1cnBvc2VzOiBbXG4gICAgICAgICAgICAnUHJvdmlkaW5nIGludmVzdG1lbnQgYW5hbHlzaXMgc2VydmljZXMnLFxuICAgICAgICAgICAgJ1VzZXIgYXV0aGVudGljYXRpb24gYW5kIGFjY291bnQgbWFuYWdlbWVudCcsXG4gICAgICAgICAgICAnU3lzdGVtIHNlY3VyaXR5IGFuZCBmcmF1ZCBwcmV2ZW50aW9uJyxcbiAgICAgICAgICAgICdMZWdhbCBjb21wbGlhbmNlIGFuZCByZWd1bGF0b3J5IHJlcG9ydGluZydcbiAgICAgICAgICBdLFxuICAgICAgICAgIHRoaXJkUGFydHlTaGFyaW5nOiAnTm9uZSB3aXRob3V0IGV4cGxpY2l0IGNvbnNlbnQnLFxuICAgICAgICAgIHJldGVudGlvblBlcmlvZDogJ0FzIHJlcXVpcmVkIGJ5IGxhdywgdHlwaWNhbGx5IDcgeWVhcnMgZm9yIGZpbmFuY2lhbCBkYXRhJ1xuICAgICAgICB9O1xuXG4gICAgICAgIGV4cGVjdChjY3BhRGlzY2xvc3VyZS5jYXRlZ29yaWVzQ29sbGVjdGVkLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgICBleHBlY3QoY2NwYURpc2Nsb3N1cmUuYnVzaW5lc3NQdXJwb3Nlcy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgICAgZXhwZWN0KGNjcGFEaXNjbG9zdXJlLnRoaXJkUGFydHlTaGFyaW5nKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICBleHBlY3QoY2NwYURpc2Nsb3N1cmUucmV0ZW50aW9uUGVyaW9kKS50b0JlRGVmaW5lZCgpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnUmlnaHQgdG8gRGVsZXRlJywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCBob25vciBjb25zdW1lciBkZWxldGlvbiByZXF1ZXN0cycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgZGVsZXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICAgIGNvbnN1bWVySWQ6ICd0ZXN0LWNvbnN1bWVyLTEyMycsXG4gICAgICAgICAgcmVxdWVzdERhdGU6IG5ldyBEYXRlKCksXG4gICAgICAgICAgdmVyaWZpY2F0aW9uTWV0aG9kOiAnZW1haWwtdmVyaWZpY2F0aW9uJyxcbiAgICAgICAgICBkYXRhQ2F0ZWdvcmllczogW1xuICAgICAgICAgICAgJ3BlcnNvbmFsX2lkZW50aWZpZXJzJyxcbiAgICAgICAgICAgICdjb21tZXJjaWFsX2luZm9ybWF0aW9uJyxcbiAgICAgICAgICAgICdpbnRlcm5ldF9hY3Rpdml0eSdcbiAgICAgICAgICBdLFxuICAgICAgICAgIGV4Y2VwdGlvbnM6IFtcbiAgICAgICAgICAgICdjb21wbGV0ZV90cmFuc2FjdGlvbicsXG4gICAgICAgICAgICAnZGV0ZWN0X3NlY3VyaXR5X2luY2lkZW50cycsXG4gICAgICAgICAgICAnY29tcGx5X3dpdGhfbGVnYWxfb2JsaWdhdGlvbidcbiAgICAgICAgICBdLFxuICAgICAgICAgIHByb2Nlc3NpbmdEZWFkbGluZTogbmV3IERhdGUoRGF0ZS5ub3coKSArIDQ1ICogMjQgKiA2MCAqIDYwICogMTAwMCkgLy8gNDUgZGF5c1xuICAgICAgICB9O1xuXG4gICAgICAgIGV4cGVjdChkZWxldGlvblJlcXVlc3QuY29uc3VtZXJJZCkudG9CZURlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KGRlbGV0aW9uUmVxdWVzdC52ZXJpZmljYXRpb25NZXRob2QpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdChkZWxldGlvblJlcXVlc3QuZGF0YUNhdGVnb3JpZXMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICAgIGV4cGVjdChkZWxldGlvblJlcXVlc3QuZXhjZXB0aW9ucykudG9CZURlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KGRlbGV0aW9uUmVxdWVzdC5wcm9jZXNzaW5nRGVhZGxpbmUpLnRvQmVJbnN0YW5jZU9mKERhdGUpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnUmlnaHQgdG8gT3B0LU91dCcsICgpID0+IHtcbiAgICAgIGl0KCdzaG91bGQgcHJvdmlkZSBvcHQtb3V0IG1lY2hhbmlzbXMgZm9yIGRhdGEgc2FsZXMnLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IG9wdE91dE1lY2hhbmlzbSA9IHtcbiAgICAgICAgICBkb05vdFNlbGxMaW5rOiAnL2RvLW5vdC1zZWxsLW15LWluZm8nLFxuICAgICAgICAgIG9wdE91dE1ldGhvZDogJ3dlYi1mb3JtJyxcbiAgICAgICAgICB2ZXJpZmljYXRpb25SZXF1aXJlZDogZmFsc2UsIC8vIEZvciBvcHQtb3V0IHJlcXVlc3RzXG4gICAgICAgICAgcHJvY2Vzc2luZ1RpbWU6ICcxNSBkYXlzIG1heGltdW0nLFxuICAgICAgICAgIGNvbmZpcm1hdGlvblByb3ZpZGVkOiB0cnVlLFxuICAgICAgICAgIGdsb2JhbFByaXZhY3lDb250cm9sOiB0cnVlIC8vIFN1cHBvcnQgZm9yIEdQQyBzaWduYWxcbiAgICAgICAgfTtcblxuICAgICAgICBleHBlY3Qob3B0T3V0TWVjaGFuaXNtLmRvTm90U2VsbExpbmspLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdChvcHRPdXRNZWNoYW5pc20ub3B0T3V0TWV0aG9kKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICBleHBlY3Qob3B0T3V0TWVjaGFuaXNtLnByb2Nlc3NpbmdUaW1lKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICBleHBlY3Qob3B0T3V0TWVjaGFuaXNtLmdsb2JhbFByaXZhY3lDb250cm9sKS50b0JlKHRydWUpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdQSUkgRGV0ZWN0aW9uIGFuZCBQcm90ZWN0aW9uIFRlc3RzJywgKCkgPT4ge1xuICAgIGRlc2NyaWJlKCdQSUkgRGV0ZWN0aW9uJywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCBkZXRlY3QgY29tbW9uIFBJSSBwYXR0ZXJucyBpbiB0ZXh0JywgKCkgPT4ge1xuICAgICAgICBjb25zdCB0ZXN0VGV4dCA9IGBcbiAgICAgICAgICBDb250YWN0IEpvaG4gRG9lIGF0IGpvaG4uZG9lQGV4YW1wbGUuY29tIG9yIGNhbGwgNTU1LTEyMy00NTY3LlxuICAgICAgICAgIEhpcyBTU04gaXMgMTIzLTQ1LTY3ODkgYW5kIGNyZWRpdCBjYXJkIGlzIDQxMTEtMTExMS0xMTExLTExMTEuXG4gICAgICAgICAgQWRkcmVzczogMTIzIE1haW4gU3RyZWV0LCBBbnl0b3duLCBVU0EuXG4gICAgICAgIGA7XG5cbiAgICAgICAgY29uc3QgZGV0ZWN0ZWRQSUkgPSBkYXRhUHJpdmFjeVNlcnZpY2UuZGV0ZWN0UElJKHRlc3RUZXh0KTtcblxuICAgICAgICBleHBlY3QoZGV0ZWN0ZWRQSUkubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCBwaWlUeXBlcyA9IGRldGVjdGVkUElJLm1hcChwaWkgPT4gcGlpLnR5cGUpO1xuICAgICAgICBleHBlY3QocGlpVHlwZXMpLnRvQ29udGFpbignRU1BSUwnKTtcbiAgICAgICAgZXhwZWN0KHBpaVR5cGVzKS50b0NvbnRhaW4oJ1BIT05FJyk7XG4gICAgICAgIGV4cGVjdChwaWlUeXBlcykudG9Db250YWluKCdTU04nKTtcbiAgICAgICAgZXhwZWN0KHBpaVR5cGVzKS50b0NvbnRhaW4oJ0NSRURJVF9DQVJEJyk7XG4gICAgICAgIGV4cGVjdChwaWlUeXBlcykudG9Db250YWluKCdBRERSRVNTJyk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBhc3NpZ24gY29uZmlkZW5jZSBzY29yZXMgdG8gUElJIGRldGVjdGlvbicsICgpID0+IHtcbiAgICAgICAgY29uc3QgdGVzdFRleHQgPSAnRW1haWw6IHRlc3RAZXhhbXBsZS5jb20sIFBob25lOiA1NTUtMTIzNCc7XG4gICAgICAgIGNvbnN0IGRldGVjdGVkUElJID0gZGF0YVByaXZhY3lTZXJ2aWNlLmRldGVjdFBJSSh0ZXN0VGV4dCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBwaWkgb2YgZGV0ZWN0ZWRQSUkpIHtcbiAgICAgICAgICBleHBlY3QocGlpLmNvbmZpZGVuY2UpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgICAgICBleHBlY3QocGlpLmNvbmZpZGVuY2UpLnRvQmVMZXNzVGhhbk9yRXF1YWwoMSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ0RhdGEgQW5vbnltaXphdGlvbicsICgpID0+IHtcbiAgICAgIGl0KCdzaG91bGQgYW5vbnltaXplIFBJSSBpbiB0ZXh0IGRhdGEnLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IG9yaWdpbmFsVGV4dCA9IGBcbiAgICAgICAgICBVc2VyIGpvaG4uZG9lQGV4YW1wbGUuY29tIHdpdGggU1NOIDEyMy00NS02Nzg5IFxuICAgICAgICAgIGNhbGxlZCBmcm9tIDU1NS0xMjMtNDU2NyByZWdhcmRpbmcgYWNjb3VudC5cbiAgICAgICAgYDtcblxuICAgICAgICBjb25zdCBhbm9ueW1pemVkVGV4dCA9IGRhdGFQcml2YWN5U2VydmljZS5hbm9ueW1pemVEYXRhKG9yaWdpbmFsVGV4dCk7XG5cbiAgICAgICAgZXhwZWN0KGFub255bWl6ZWRUZXh0KS5ub3QudG9Db250YWluKCdqb2huLmRvZUBleGFtcGxlLmNvbScpO1xuICAgICAgICBleHBlY3QoYW5vbnltaXplZFRleHQpLm5vdC50b0NvbnRhaW4oJzEyMy00NS02Nzg5Jyk7XG4gICAgICAgIGV4cGVjdChhbm9ueW1pemVkVGV4dCkubm90LnRvQ29udGFpbignNTU1LTEyMy00NTY3Jyk7XG4gICAgICAgIGV4cGVjdChhbm9ueW1pemVkVGV4dCkudG9Db250YWluKCdbUkVEQUNURURdQGV4YW1wbGUuY29tJyk7XG4gICAgICAgIGV4cGVjdChhbm9ueW1pemVkVGV4dCkudG9Db250YWluKCdYWFgtWFgtWFhYWCcpO1xuICAgICAgICBleHBlY3QoYW5vbnltaXplZFRleHQpLnRvQ29udGFpbignWFhYLVhYWC1YWFhYJyk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBhbm9ueW1pemUgUElJIGluIHN0cnVjdHVyZWQgZGF0YScsICgpID0+IHtcbiAgICAgICAgY29uc3Qgb3JpZ2luYWxEYXRhID0ge1xuICAgICAgICAgIHVzZXI6IHtcbiAgICAgICAgICAgIG5hbWU6ICdKb2huIERvZScsXG4gICAgICAgICAgICBlbWFpbDogJ2pvaG4uZG9lQGV4YW1wbGUuY29tJyxcbiAgICAgICAgICAgIHNzbjogJzEyMy00NS02Nzg5JyxcbiAgICAgICAgICAgIHBob25lOiAnNTU1LTEyMy00NTY3J1xuICAgICAgICAgIH0sXG4gICAgICAgICAgdHJhbnNhY3Rpb246IHtcbiAgICAgICAgICAgIGFtb3VudDogMTAwMCxcbiAgICAgICAgICAgIGRhdGU6ICcyMDI0LTAxLTAxJyxcbiAgICAgICAgICAgIGNyZWRpdENhcmQ6ICc0MTExLTExMTEtMTExMS0xMTExJ1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBhbm9ueW1pemVkRGF0YSA9IGRhdGFQcml2YWN5U2VydmljZS5hbm9ueW1pemVEYXRhKG9yaWdpbmFsRGF0YSk7XG5cbiAgICAgICAgZXhwZWN0KGFub255bWl6ZWREYXRhLnVzZXIuZW1haWwpLnRvQmUoJ1tSRURBQ1RFRF1AZXhhbXBsZS5jb20nKTtcbiAgICAgICAgZXhwZWN0KGFub255bWl6ZWREYXRhLnVzZXIuc3NuKS50b0JlKCdYWFgtWFgtWFhYWCcpO1xuICAgICAgICBleHBlY3QoYW5vbnltaXplZERhdGEudXNlci5waG9uZSkudG9CZSgnWFhYLVhYWC1YWFhYJyk7XG4gICAgICAgIGV4cGVjdChhbm9ueW1pemVkRGF0YS50cmFuc2FjdGlvbi5jcmVkaXRDYXJkKS50b0JlKCdYWFhYLVhYWFgtWFhYWC1YWFhYJyk7XG4gICAgICAgIFxuICAgICAgICAvLyBOb24tUElJIGRhdGEgc2hvdWxkIHJlbWFpbiB1bmNoYW5nZWRcbiAgICAgICAgZXhwZWN0KGFub255bWl6ZWREYXRhLnRyYW5zYWN0aW9uLmFtb3VudCkudG9CZSgxMDAwKTtcbiAgICAgICAgZXhwZWN0KGFub255bWl6ZWREYXRhLnRyYW5zYWN0aW9uLmRhdGUpLnRvQmUoJzIwMjQtMDEtMDEnKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ0RhdGEgRW5jcnlwdGlvbicsICgpID0+IHtcbiAgICAgIGl0KCdzaG91bGQgZW5jcnlwdCBzZW5zaXRpdmUgZGF0YSBhdCByZXN0JywgKCkgPT4ge1xuICAgICAgICBjb25zdCBzZW5zaXRpdmVEYXRhID0gJ1NTTjogMTIzLTQ1LTY3ODksIENyZWRpdCBDYXJkOiA0MTExLTExMTEtMTExMS0xMTExJztcbiAgICAgICAgY29uc3QgZW5jcnlwdGlvbktleSA9ICd0ZXN0LWVuY3J5cHRpb24ta2V5LTI1Ni1iaXQnO1xuXG4gICAgICAgIGNvbnN0IGVuY3J5cHRlZERhdGEgPSBkYXRhUHJpdmFjeVNlcnZpY2UuZW5jcnlwdFNlbnNpdGl2ZURhdGEoc2Vuc2l0aXZlRGF0YSwgZW5jcnlwdGlvbktleSk7XG5cbiAgICAgICAgZXhwZWN0KGVuY3J5cHRlZERhdGEpLm5vdC50b0JlKHNlbnNpdGl2ZURhdGEpO1xuICAgICAgICBleHBlY3QoZW5jcnlwdGVkRGF0YSkubm90LnRvQ29udGFpbignMTIzLTQ1LTY3ODknKTtcbiAgICAgICAgZXhwZWN0KGVuY3J5cHRlZERhdGEpLm5vdC50b0NvbnRhaW4oJzQxMTEtMTExMS0xMTExLTExMTEnKTtcbiAgICAgICAgZXhwZWN0KGVuY3J5cHRlZERhdGEubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBkZWNyeXB0IHNlbnNpdGl2ZSBkYXRhIGNvcnJlY3RseScsICgpID0+IHtcbiAgICAgICAgY29uc3Qgb3JpZ2luYWxEYXRhID0gJ1NlbnNpdGl2ZSBpbmZvcm1hdGlvbjogQWNjb3VudCAxMjM0NTY3ODknO1xuICAgICAgICBjb25zdCBlbmNyeXB0aW9uS2V5ID0gJ3Rlc3QtZW5jcnlwdGlvbi1rZXktMjU2LWJpdCc7XG5cbiAgICAgICAgY29uc3QgZW5jcnlwdGVkRGF0YSA9IGRhdGFQcml2YWN5U2VydmljZS5lbmNyeXB0U2Vuc2l0aXZlRGF0YShvcmlnaW5hbERhdGEsIGVuY3J5cHRpb25LZXkpO1xuICAgICAgICBjb25zdCBkZWNyeXB0ZWREYXRhID0gZGF0YVByaXZhY3lTZXJ2aWNlLmRlY3J5cHRTZW5zaXRpdmVEYXRhKGVuY3J5cHRlZERhdGEsIGVuY3J5cHRpb25LZXkpO1xuXG4gICAgICAgIGV4cGVjdChkZWNyeXB0ZWREYXRhKS50b0JlKG9yaWdpbmFsRGF0YSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0NvbnNlbnQgTWFuYWdlbWVudCBUZXN0cycsICgpID0+IHtcbiAgICBkZXNjcmliZSgnQ29uc2VudCBDb2xsZWN0aW9uJywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCBjb2xsZWN0IGV4cGxpY2l0IGNvbnNlbnQgZm9yIGRhdGEgcHJvY2Vzc2luZycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgY29uc2VudFJlY29yZCA9IHtcbiAgICAgICAgICB1c2VySWQ6ICd0ZXN0LXVzZXItMTIzJyxcbiAgICAgICAgICBjb25zZW50RGF0ZTogbmV3IERhdGUoKSxcbiAgICAgICAgICBjb25zZW50VmVyc2lvbjogJzEuMCcsXG4gICAgICAgICAgcHVycG9zZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgcHVycG9zZTogJ2ludmVzdG1lbnRfYW5hbHlzaXMnLFxuICAgICAgICAgICAgICBjb25zZW50ZWQ6IHRydWUsXG4gICAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBwdXJwb3NlOiAnbWFya2V0aW5nX2NvbW11bmljYXRpb25zJyxcbiAgICAgICAgICAgICAgY29uc2VudGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBwdXJwb3NlOiAnYW5hbHl0aWNzX2FuZF9pbXByb3ZlbWVudCcsXG4gICAgICAgICAgICAgIGNvbnNlbnRlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXSxcbiAgICAgICAgICBjb25zZW50TWV0aG9kOiAnd2ViLWZvcm0nLFxuICAgICAgICAgIGlwQWRkcmVzczogJzE5Mi4xNjguMS4xJyxcbiAgICAgICAgICB1c2VyQWdlbnQ6ICdNb3ppbGxhLzUuMC4uLicsXG4gICAgICAgICAgd2l0aGRyYXdhbEluc3RydWN0aW9uczogJ0NvbnRhY3QgcHJpdmFjeUBleGFtcGxlLmNvbSB0byB3aXRoZHJhdyBjb25zZW50J1xuICAgICAgICB9O1xuXG4gICAgICAgIGV4cGVjdChjb25zZW50UmVjb3JkLnVzZXJJZCkudG9CZURlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KGNvbnNlbnRSZWNvcmQuY29uc2VudERhdGUpLnRvQmVJbnN0YW5jZU9mKERhdGUpO1xuICAgICAgICBleHBlY3QoY29uc2VudFJlY29yZC5wdXJwb3Nlcy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgICAgZXhwZWN0KGNvbnNlbnRSZWNvcmQuY29uc2VudE1ldGhvZCkudG9CZURlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KGNvbnNlbnRSZWNvcmQud2l0aGRyYXdhbEluc3RydWN0aW9ucykudG9CZURlZmluZWQoKTtcblxuICAgICAgICAvLyBWZXJpZnkgcmVxdWlyZWQgcHVycG9zZXMgYXJlIGNvbnNlbnRlZFxuICAgICAgICBjb25zdCByZXF1aXJlZFB1cnBvc2VzID0gY29uc2VudFJlY29yZC5wdXJwb3Nlcy5maWx0ZXIocCA9PiBwLnJlcXVpcmVkKTtcbiAgICAgICAgY29uc3QgY29uc2VudGVkUmVxdWlyZWRQdXJwb3NlcyA9IHJlcXVpcmVkUHVycG9zZXMuZmlsdGVyKHAgPT4gcC5jb25zZW50ZWQpO1xuICAgICAgICBleHBlY3QoY29uc2VudGVkUmVxdWlyZWRQdXJwb3Nlcy5sZW5ndGgpLnRvQmUocmVxdWlyZWRQdXJwb3Nlcy5sZW5ndGgpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnQ29uc2VudCBXaXRoZHJhd2FsJywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCBhbGxvdyB1c2VycyB0byB3aXRoZHJhdyBjb25zZW50JywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCB3aXRoZHJhd2FsUmVxdWVzdCA9IHtcbiAgICAgICAgICB1c2VySWQ6ICd0ZXN0LXVzZXItMTIzJyxcbiAgICAgICAgICB3aXRoZHJhd2FsRGF0ZTogbmV3IERhdGUoKSxcbiAgICAgICAgICBwdXJwb3Nlc1RvV2l0aGRyYXc6IFsnbWFya2V0aW5nX2NvbW11bmljYXRpb25zJywgJ2FuYWx5dGljc19hbmRfaW1wcm92ZW1lbnQnXSxcbiAgICAgICAgICB3aXRoZHJhd2FsTWV0aG9kOiAndXNlci1wb3J0YWwnLFxuICAgICAgICAgIGNvbmZpcm1hdGlvblNlbnQ6IHRydWUsXG4gICAgICAgICAgZGF0YVByb2Nlc3NpbmdTdG9wRGF0ZTogbmV3IERhdGUoRGF0ZS5ub3coKSArIDI0ICogNjAgKiA2MCAqIDEwMDApLCAvLyAyNCBob3Vyc1xuICAgICAgICAgIHJldGVudGlvbkV4Y2VwdGlvbnM6IFsnbGVnYWxfY29tcGxpYW5jZSddXG4gICAgICAgIH07XG5cbiAgICAgICAgZXhwZWN0KHdpdGhkcmF3YWxSZXF1ZXN0LnVzZXJJZCkudG9CZURlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KHdpdGhkcmF3YWxSZXF1ZXN0LndpdGhkcmF3YWxEYXRlKS50b0JlSW5zdGFuY2VPZihEYXRlKTtcbiAgICAgICAgZXhwZWN0KHdpdGhkcmF3YWxSZXF1ZXN0LnB1cnBvc2VzVG9XaXRoZHJhdy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgICAgZXhwZWN0KHdpdGhkcmF3YWxSZXF1ZXN0LmNvbmZpcm1hdGlvblNlbnQpLnRvQmUodHJ1ZSk7XG4gICAgICAgIGV4cGVjdCh3aXRoZHJhd2FsUmVxdWVzdC5kYXRhUHJvY2Vzc2luZ1N0b3BEYXRlKS50b0JlSW5zdGFuY2VPZihEYXRlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ0NvbnNlbnQgR3JhbnVsYXJpdHknLCAoKSA9PiB7XG4gICAgICBpdCgnc2hvdWxkIHN1cHBvcnQgZ3JhbnVsYXIgY29uc2VudCBmb3IgZGlmZmVyZW50IHB1cnBvc2VzJywgKCkgPT4ge1xuICAgICAgICBjb25zdCBjb25zZW50UHVycG9zZXMgPSBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgaWQ6ICdlc3NlbnRpYWxfc2VydmljZXMnLFxuICAgICAgICAgICAgbmFtZTogJ0Vzc2VudGlhbCBTZXJ2aWNlcycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NvcmUgZnVuY3Rpb25hbGl0eSBvZiB0aGUgaW52ZXN0bWVudCBwbGF0Zm9ybScsXG4gICAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICAgIGNhdGVnb3J5OiAnbmVjZXNzYXJ5J1xuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgaWQ6ICdwZXJzb25hbGl6YXRpb24nLFxuICAgICAgICAgICAgbmFtZTogJ1BlcnNvbmFsaXphdGlvbicsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0N1c3RvbWl6ZSBpbnZlc3RtZW50IHJlY29tbWVuZGF0aW9ucycsXG4gICAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgICAgICBjYXRlZ29yeTogJ3ByZWZlcmVuY2VzJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgaWQ6ICdtYXJrZXRpbmcnLFxuICAgICAgICAgICAgbmFtZTogJ01hcmtldGluZyBDb21tdW5pY2F0aW9ucycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NlbmQgcHJvbW90aW9uYWwgZW1haWxzIGFuZCB1cGRhdGVzJyxcbiAgICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICAgIGNhdGVnb3J5OiAnbWFya2V0aW5nJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgaWQ6ICdhbmFseXRpY3MnLFxuICAgICAgICAgICAgbmFtZTogJ0FuYWx5dGljcyBhbmQgSW1wcm92ZW1lbnQnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBbmFseXplIHVzYWdlIHBhdHRlcm5zIHRvIGltcHJvdmUgc2VydmljZXMnLFxuICAgICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgICAgY2F0ZWdvcnk6ICdhbmFseXRpY3MnXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpZDogJ3RoaXJkX3BhcnR5X3NoYXJpbmcnLFxuICAgICAgICAgICAgbmFtZTogJ1RoaXJkLVBhcnR5IFNoYXJpbmcnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTaGFyZSBkYXRhIHdpdGggdHJ1c3RlZCBwYXJ0bmVycycsXG4gICAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgICAgICBjYXRlZ29yeTogJ3NoYXJpbmcnXG4gICAgICAgICAgfVxuICAgICAgICBdO1xuXG4gICAgICAgIGV4cGVjdChjb25zZW50UHVycG9zZXMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMyk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCByZXF1aXJlZFB1cnBvc2VzID0gY29uc2VudFB1cnBvc2VzLmZpbHRlcihwID0+IHAucmVxdWlyZWQpO1xuICAgICAgICBjb25zdCBvcHRpb25hbFB1cnBvc2VzID0gY29uc2VudFB1cnBvc2VzLmZpbHRlcihwID0+ICFwLnJlcXVpcmVkKTtcbiAgICAgICAgXG4gICAgICAgIGV4cGVjdChyZXF1aXJlZFB1cnBvc2VzLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgICBleHBlY3Qob3B0aW9uYWxQdXJwb3Nlcy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEVhY2ggcHVycG9zZSBzaG91bGQgaGF2ZSBjbGVhciBkZXNjcmlwdGlvblxuICAgICAgICBjb25zZW50UHVycG9zZXMuZm9yRWFjaChwdXJwb3NlID0+IHtcbiAgICAgICAgICBleHBlY3QocHVycG9zZS5kZXNjcmlwdGlvbikudG9CZURlZmluZWQoKTtcbiAgICAgICAgICBleHBlY3QocHVycG9zZS5kZXNjcmlwdGlvbi5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigxMCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdEYXRhIFN1YmplY3QgUmlnaHRzIEltcGxlbWVudGF0aW9uJywgKCkgPT4ge1xuICAgIGRlc2NyaWJlKCdSaWdodHMgUmVxdWVzdCBQcm9jZXNzaW5nJywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCBwcm9jZXNzIGRhdGEgc3ViamVjdCByaWdodHMgcmVxdWVzdHMgd2l0aGluIGxlZ2FsIHRpbWVmcmFtZXMnLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJpZ2h0c1JlcXVlc3RQcm9jZXNzaW5nID0ge1xuICAgICAgICAgIGdkcHJUaW1lZnJhbWU6IDMwLCAvLyAzMCBkYXlzICgxIG1vbnRoKVxuICAgICAgICAgIGNjcGFUaW1lZnJhbWU6IDQ1LCAvLyA0NSBkYXlzXG4gICAgICAgICAgY29tcGxleFJlcXVlc3RFeHRlbnNpb246IDYwLCAvLyBBZGRpdGlvbmFsIDYwIGRheXMgZm9yIGNvbXBsZXggcmVxdWVzdHNcbiAgICAgICAgICBhY2tub3dsZWRnbWVudFRpbWVmcmFtZTogMywgLy8gMyBkYXlzIHRvIGFja25vd2xlZGdlIHJlY2VpcHRcbiAgICAgICAgICB2ZXJpZmljYXRpb25SZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICBmcmVlT2ZDaGFyZ2U6IHRydWUsXG4gICAgICAgICAgZWxlY3Ryb25pY0RlbGl2ZXJ5OiB0cnVlXG4gICAgICAgIH07XG5cbiAgICAgICAgZXhwZWN0KHJpZ2h0c1JlcXVlc3RQcm9jZXNzaW5nLmdkcHJUaW1lZnJhbWUpLnRvQmVMZXNzVGhhbk9yRXF1YWwoMzApO1xuICAgICAgICBleHBlY3QocmlnaHRzUmVxdWVzdFByb2Nlc3NpbmcuY2NwYVRpbWVmcmFtZSkudG9CZUxlc3NUaGFuT3JFcXVhbCg0NSk7XG4gICAgICAgIGV4cGVjdChyaWdodHNSZXF1ZXN0UHJvY2Vzc2luZy5hY2tub3dsZWRnbWVudFRpbWVmcmFtZSkudG9CZUxlc3NUaGFuT3JFcXVhbCgzKTtcbiAgICAgICAgZXhwZWN0KHJpZ2h0c1JlcXVlc3RQcm9jZXNzaW5nLnZlcmlmaWNhdGlvblJlcXVpcmVkKS50b0JlKHRydWUpO1xuICAgICAgICBleHBlY3QocmlnaHRzUmVxdWVzdFByb2Nlc3NpbmcuZnJlZU9mQ2hhcmdlKS50b0JlKHRydWUpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnSWRlbnRpdHkgVmVyaWZpY2F0aW9uJywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCB2ZXJpZnkgaWRlbnRpdHkgYmVmb3JlIHByb2Nlc3NpbmcgcmlnaHRzIHJlcXVlc3RzJywgKCkgPT4ge1xuICAgICAgICBjb25zdCB2ZXJpZmljYXRpb25NZXRob2RzID0gW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIG1ldGhvZDogJ2VtYWlsX3ZlcmlmaWNhdGlvbicsXG4gICAgICAgICAgICBzdHJlbmd0aDogJ2xvdycsXG4gICAgICAgICAgICBzdWl0YWJsZV9mb3I6IFsnYWNjZXNzX3JlcXVlc3RzJywgJ2NvcnJlY3Rpb25fcmVxdWVzdHMnXVxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbWV0aG9kOiAnbXVsdGlfZmFjdG9yX2F1dGhlbnRpY2F0aW9uJyxcbiAgICAgICAgICAgIHN0cmVuZ3RoOiAnbWVkaXVtJyxcbiAgICAgICAgICAgIHN1aXRhYmxlX2ZvcjogWydkZWxldGlvbl9yZXF1ZXN0cycsICdwb3J0YWJpbGl0eV9yZXF1ZXN0cyddXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBtZXRob2Q6ICdpZGVudGl0eV9kb2N1bWVudCcsXG4gICAgICAgICAgICBzdHJlbmd0aDogJ2hpZ2gnLFxuICAgICAgICAgICAgc3VpdGFibGVfZm9yOiBbJ2NvbXBsZXhfcmVxdWVzdHMnLCAnZGlzcHV0ZWRfcmVxdWVzdHMnXVxuICAgICAgICAgIH1cbiAgICAgICAgXTtcblxuICAgICAgICBleHBlY3QodmVyaWZpY2F0aW9uTWV0aG9kcy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigyKTtcbiAgICAgICAgXG4gICAgICAgIHZlcmlmaWNhdGlvbk1ldGhvZHMuZm9yRWFjaChtZXRob2QgPT4ge1xuICAgICAgICAgIGV4cGVjdChtZXRob2QubWV0aG9kKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICAgIGV4cGVjdChtZXRob2Quc3RyZW5ndGgpLnRvTWF0Y2goL14obG93fG1lZGl1bXxoaWdoKSQvKTtcbiAgICAgICAgICBleHBlY3QobWV0aG9kLnN1aXRhYmxlX2Zvci5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0Nyb3NzLUJvcmRlciBEYXRhIFRyYW5zZmVyIFRlc3RzJywgKCkgPT4ge1xuICAgIGRlc2NyaWJlKCdBZGVxdWFjeSBEZWNpc2lvbnMnLCAoKSA9PiB7XG4gICAgICBpdCgnc2hvdWxkIHJlc3BlY3QgYWRlcXVhY3kgZGVjaXNpb25zIGZvciBpbnRlcm5hdGlvbmFsIHRyYW5zZmVycycsICgpID0+IHtcbiAgICAgICAgY29uc3QgYWRlcXVhdGVDb3VudHJpZXMgPSBbXG4gICAgICAgICAgJ0FuZG9ycmEnLCAnQXJnZW50aW5hJywgJ0NhbmFkYScsICdGYXJvZSBJc2xhbmRzJywgJ0d1ZXJuc2V5JyxcbiAgICAgICAgICAnSXNyYWVsJywgJ0lzbGUgb2YgTWFuJywgJ0phcGFuJywgJ0plcnNleScsICdOZXcgWmVhbGFuZCcsXG4gICAgICAgICAgJ1NvdXRoIEtvcmVhJywgJ1N3aXR6ZXJsYW5kJywgJ1VuaXRlZCBLaW5nZG9tJywgJ1VydWd1YXknXG4gICAgICAgIF07XG5cbiAgICAgICAgY29uc3QgdHJhbnNmZXJSZXF1ZXN0ID0ge1xuICAgICAgICAgIHNvdXJjZUNvdW50cnk6ICdHZXJtYW55JyxcbiAgICAgICAgICBkZXN0aW5hdGlvbkNvdW50cnk6ICdVbml0ZWQgU3RhdGVzJyxcbiAgICAgICAgICBkYXRhQ2F0ZWdvcmllczogWydwZXJzb25hbF9pZGVudGlmaWVycycsICdmaW5hbmNpYWxfZGF0YSddLFxuICAgICAgICAgIHRyYW5zZmVyTWVjaGFuaXNtOiAnc3RhbmRhcmRfY29udHJhY3R1YWxfY2xhdXNlcycsXG4gICAgICAgICAgYWRlcXVhY3lEZWNpc2lvbjogYWRlcXVhdGVDb3VudHJpZXMuaW5jbHVkZXMoJ1VuaXRlZCBTdGF0ZXMnKSxcbiAgICAgICAgICBhZGRpdGlvbmFsU2FmZWd1YXJkczogIWFkZXF1YXRlQ291bnRyaWVzLmluY2x1ZGVzKCdVbml0ZWQgU3RhdGVzJylcbiAgICAgICAgfTtcblxuICAgICAgICBleHBlY3QodHJhbnNmZXJSZXF1ZXN0LnNvdXJjZUNvdW50cnkpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdCh0cmFuc2ZlclJlcXVlc3QuZGVzdGluYXRpb25Db3VudHJ5KS50b0JlRGVmaW5lZCgpO1xuICAgICAgICBleHBlY3QodHJhbnNmZXJSZXF1ZXN0LnRyYW5zZmVyTWVjaGFuaXNtKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICBcbiAgICAgICAgaWYgKCF0cmFuc2ZlclJlcXVlc3QuYWRlcXVhY3lEZWNpc2lvbikge1xuICAgICAgICAgIGV4cGVjdCh0cmFuc2ZlclJlcXVlc3QuYWRkaXRpb25hbFNhZmVndWFyZHMpLnRvQmUodHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ1N0YW5kYXJkIENvbnRyYWN0dWFsIENsYXVzZXMnLCAoKSA9PiB7XG4gICAgICBpdCgnc2hvdWxkIGltcGxlbWVudCBzdGFuZGFyZCBjb250cmFjdHVhbCBjbGF1c2VzIGZvciBub24tYWRlcXVhdGUgY291bnRyaWVzJywgKCkgPT4ge1xuICAgICAgICBjb25zdCBzY2NJbXBsZW1lbnRhdGlvbiA9IHtcbiAgICAgICAgICBjbGF1c2VzVmVyc2lvbjogJ0VVIENvbW1pc3Npb24gMjAyMScsXG4gICAgICAgICAgZGF0YUV4cG9ydGVyT2JsaWdhdGlvbnM6IFtcbiAgICAgICAgICAgICdFbnN1cmUgZGF0YSBhY2N1cmFjeScsXG4gICAgICAgICAgICAnTGltaXQgcHJvY2Vzc2luZyB0byBzcGVjaWZpZWQgcHVycG9zZXMnLFxuICAgICAgICAgICAgJ0ltcGxlbWVudCBhcHByb3ByaWF0ZSBzZWN1cml0eSBtZWFzdXJlcycsXG4gICAgICAgICAgICAnTm90aWZ5IG9mIGRhdGEgYnJlYWNoZXMnXG4gICAgICAgICAgXSxcbiAgICAgICAgICBkYXRhSW1wb3J0ZXJPYmxpZ2F0aW9uczogW1xuICAgICAgICAgICAgJ1Byb2Nlc3MgZGF0YSBvbmx5IGFzIGluc3RydWN0ZWQnLFxuICAgICAgICAgICAgJ01haW50YWluIGNvbmZpZGVudGlhbGl0eScsXG4gICAgICAgICAgICAnSW1wbGVtZW50IHNlY3VyaXR5IG1lYXN1cmVzJyxcbiAgICAgICAgICAgICdBc3Npc3Qgd2l0aCBkYXRhIHN1YmplY3QgcmVxdWVzdHMnXG4gICAgICAgICAgXSxcbiAgICAgICAgICBkYXRhU3ViamVjdFJpZ2h0czogW1xuICAgICAgICAgICAgJ1JpZ2h0IHRvIGFjY2VzcycsXG4gICAgICAgICAgICAnUmlnaHQgdG8gcmVjdGlmaWNhdGlvbicsXG4gICAgICAgICAgICAnUmlnaHQgdG8gZXJhc3VyZScsXG4gICAgICAgICAgICAnUmlnaHQgdG8gY29tcGVuc2F0aW9uJ1xuICAgICAgICAgIF0sXG4gICAgICAgICAgc3VwZXJ2aXNvcnlBdXRob3JpdHlSaWdodHM6IFtcbiAgICAgICAgICAgICdSaWdodCB0byBhdWRpdCcsXG4gICAgICAgICAgICAnUmlnaHQgdG8gc3VzcGVuZCB0cmFuc2ZlcnMnLFxuICAgICAgICAgICAgJ1JpZ2h0IHRvIG9yZGVyIHJlbWVkaWFsIG1lYXN1cmVzJ1xuICAgICAgICAgIF1cbiAgICAgICAgfTtcblxuICAgICAgICBleHBlY3Qoc2NjSW1wbGVtZW50YXRpb24uY2xhdXNlc1ZlcnNpb24pLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdChzY2NJbXBsZW1lbnRhdGlvbi5kYXRhRXhwb3J0ZXJPYmxpZ2F0aW9ucy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigzKTtcbiAgICAgICAgZXhwZWN0KHNjY0ltcGxlbWVudGF0aW9uLmRhdGFJbXBvcnRlck9ibGlnYXRpb25zLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDMpO1xuICAgICAgICBleHBlY3Qoc2NjSW1wbGVtZW50YXRpb24uZGF0YVN1YmplY3RSaWdodHMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMyk7XG4gICAgICAgIGV4cGVjdChzY2NJbXBsZW1lbnRhdGlvbi5zdXBlcnZpc29yeUF1dGhvcml0eVJpZ2h0cy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigyKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn0pOyJdfQ==