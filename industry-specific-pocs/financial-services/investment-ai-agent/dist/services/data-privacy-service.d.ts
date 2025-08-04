/**
 * Data Privacy Service
 *
 * This service handles data privacy operations including:
 * - PII detection and anonymization
 * - Data encryption and decryption
 * - GDPR and CCPA compliance support
 * - Consent management
 * - Data subject rights processing
 */
export interface PIIDetectionResult {
    type: string;
    value: string;
    confidence: number;
    startIndex: number;
    endIndex: number;
}
export interface ConsentRecord {
    userId: string;
    consentDate: Date;
    consentVersion: string;
    purposes: ConsentPurpose[];
    consentMethod: string;
    ipAddress?: string;
    userAgent?: string;
    withdrawalInstructions: string;
}
export interface ConsentPurpose {
    purpose: string;
    consented: boolean;
    required: boolean;
    description?: string;
}
export interface DataSubjectRequest {
    requestId: string;
    userId: string;
    requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
    requestDate: Date;
    verificationMethod: string;
    status: 'pending' | 'verified' | 'processing' | 'completed' | 'rejected';
    processingDeadline: Date;
    requestDetails?: any;
}
export declare class DataPrivacyService {
    private readonly encryptionAlgorithm;
    private readonly piiPatterns;
    /**
     * Detect PII in text content
     */
    detectPII(text: string): PIIDetectionResult[];
    /**
     * Anonymize data by replacing PII with anonymized versions
     */
    anonymizeData(data: any): any;
    /**
     * Anonymize text by replacing PII patterns
     */
    private anonymizeText;
    /**
     * Calculate confidence score for PII detection
     */
    private calculateConfidence;
    /**
     * Validate credit card number using Luhn algorithm
     */
    private isValidCreditCard;
    /**
     * Validate IP address format
     */
    private isValidIPAddress;
    /**
     * Encrypt sensitive data
     */
    encryptSensitiveData(data: string, key: string): {
        encrypted: string;
        iv: string;
        tag: string;
    };
    /**
     * Decrypt sensitive data
     */
    decryptSensitiveData(encryptedData: {
        encrypted: string;
        iv: string;
        tag: string;
    }, key: string): string;
    /**
     * Hash data for anonymization
     */
    hashData(data: string, salt?: string): string;
    /**
     * Generate pseudonymous identifier
     */
    generatePseudonym(originalId: string, context: string): string;
    /**
     * Record user consent
     */
    recordConsent(consentRecord: ConsentRecord): void;
    /**
     * Withdraw user consent
     */
    withdrawConsent(userId: string, purposes: string[]): void;
    /**
     * Process data subject request
     */
    processDataSubjectRequest(request: DataSubjectRequest): void;
    /**
     * Export user data for portability
     */
    exportUserData(userId: string): any;
    /**
     * Delete user data (right to erasure)
     */
    deleteUserData(userId: string, dataCategories: string[], retainForLegal?: boolean): void;
    /**
     * Validate data retention periods
     */
    validateRetentionPeriods(): {
        [category: string]: number;
    };
    /**
     * Check if data transfer is compliant with privacy regulations
     */
    validateDataTransfer(sourceCountry: string, destinationCountry: string, dataCategories: string[]): {
        compliant: boolean;
        mechanism: string;
        additionalSafeguards: string[];
    };
}
