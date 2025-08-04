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

import * as crypto from 'crypto';

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

export class DataPrivacyService {
  private readonly encryptionAlgorithm = 'aes-256-gcm';
  private readonly piiPatterns = new Map<string, RegExp>([
    ['SSN', /\b\d{3}-\d{2}-\d{4}\b/g],
    ['CREDIT_CARD', /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g],
    ['EMAIL', /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g],
    ['PHONE', /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/g],
    ['ADDRESS', /\b\d{1,5}\s\w+\s(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b/gi],
    ['IP_ADDRESS', /\b(?:\d{1,3}\.){3}\d{1,3}\b/g],
    ['DATE_OF_BIRTH', /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g]
  ]);

  /**
   * Detect PII in text content
   */
  detectPII(text: string): PIIDetectionResult[] {
    const results: PIIDetectionResult[] = [];

    for (const [type, pattern] of this.piiPatterns) {
      const matches = Array.from(text.matchAll(pattern));
      
      for (const match of matches) {
        if (match.index !== undefined) {
          results.push({
            type,
            value: match[0],
            confidence: this.calculateConfidence(type, match[0]),
            startIndex: match.index,
            endIndex: match.index + match[0].length
          });
        }
      }
    }

    return results.sort((a, b) => a.startIndex - b.startIndex);
  }

  /**
   * Anonymize data by replacing PII with anonymized versions
   */
  anonymizeData(data: any): any {
    if (typeof data === 'string') {
      return this.anonymizeText(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.anonymizeData(item));
    }

    if (typeof data === 'object' && data !== null) {
      const anonymized: any = {};
      for (const [key, value] of Object.entries(data)) {
        anonymized[key] = this.anonymizeData(value);
      }
      return anonymized;
    }

    return data;
  }

  /**
   * Anonymize text by replacing PII patterns
   */
  private anonymizeText(text: string): string {
    let anonymized = text;

    // Replace SSN
    anonymized = anonymized.replace(this.piiPatterns.get('SSN')!, 'XXX-XX-XXXX');

    // Replace credit card numbers
    anonymized = anonymized.replace(this.piiPatterns.get('CREDIT_CARD')!, 'XXXX-XXXX-XXXX-XXXX');

    // Replace email addresses (preserve domain)
    anonymized = anonymized.replace(this.piiPatterns.get('EMAIL')!, (match) => {
      const atIndex = match.indexOf('@');
      if (atIndex > 0) {
        return '[REDACTED]' + match.substring(atIndex);
      }
      return '[REDACTED]';
    });

    // Replace phone numbers
    anonymized = anonymized.replace(this.piiPatterns.get('PHONE')!, 'XXX-XXX-XXXX');

    // Replace addresses
    anonymized = anonymized.replace(this.piiPatterns.get('ADDRESS')!, '[REDACTED ADDRESS]');

    // Replace IP addresses
    anonymized = anonymized.replace(this.piiPatterns.get('IP_ADDRESS')!, 'XXX.XXX.XXX.XXX');

    // Replace dates of birth
    anonymized = anonymized.replace(this.piiPatterns.get('DATE_OF_BIRTH')!, 'XX/XX/XXXX');

    return anonymized;
  }

  /**
   * Calculate confidence score for PII detection
   */
  private calculateConfidence(type: string, value: string): number {
    switch (type) {
      case 'EMAIL':
        return value.includes('@') && value.includes('.') ? 0.98 : 0.70;
      case 'SSN':
        return /^\d{3}-\d{2}-\d{4}$/.test(value) ? 0.95 : 0.80;
      case 'CREDIT_CARD':
        return this.isValidCreditCard(value) ? 0.90 : 0.70;
      case 'PHONE':
        return /^\d{3}[\s-]?\d{3}[\s-]?\d{4}$/.test(value) ? 0.85 : 0.70;
      case 'ADDRESS':
        return 0.80;
      case 'IP_ADDRESS':
        return this.isValidIPAddress(value) ? 0.95 : 0.70;
      case 'DATE_OF_BIRTH':
        return 0.75;
      default:
        return 0.50;
    }
  }

  /**
   * Validate credit card number using Luhn algorithm
   */
  private isValidCreditCard(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    if (!/^\d+$/.test(cleaned) || cleaned.length < 13 || cleaned.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Validate IP address format
   */
  private isValidIPAddress(ip: string): boolean {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;

    return parts.every(part => {
      const num = parseInt(part);
      return num >= 0 && num <= 255 && part === num.toString();
    });
  }

  /**
   * Encrypt sensitive data
   */
  encryptSensitiveData(data: string, key: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.encryptionAlgorithm, key);
    cipher.setAAD(Buffer.from('investment-ai-agent'));

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  /**
   * Decrypt sensitive data
   */
  decryptSensitiveData(encryptedData: { encrypted: string; iv: string; tag: string }, key: string): string {
    const decipher = crypto.createDecipher(this.encryptionAlgorithm, key);
    decipher.setAAD(Buffer.from('investment-ai-agent'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Hash data for anonymization
   */
  hashData(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256');
    hash.update(data + actualSalt);
    return hash.digest('hex');
  }

  /**
   * Generate pseudonymous identifier
   */
  generatePseudonym(originalId: string, context: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(originalId + context + process.env.PSEUDONYM_SECRET || 'default-secret');
    return 'pseudo_' + hash.digest('hex').substring(0, 16);
  }

  /**
   * Record user consent
   */
  recordConsent(consentRecord: ConsentRecord): void {
    // In a real implementation, this would store to a database
    console.log('Recording consent:', {
      userId: consentRecord.userId,
      consentDate: consentRecord.consentDate,
      purposes: consentRecord.purposes.map(p => ({ purpose: p.purpose, consented: p.consented }))
    });
  }

  /**
   * Withdraw user consent
   */
  withdrawConsent(userId: string, purposes: string[]): void {
    // In a real implementation, this would update the database
    console.log('Withdrawing consent:', { userId, purposes });
  }

  /**
   * Process data subject request
   */
  processDataSubjectRequest(request: DataSubjectRequest): void {
    // In a real implementation, this would handle the request processing
    console.log('Processing data subject request:', {
      requestId: request.requestId,
      userId: request.userId,
      requestType: request.requestType,
      status: request.status
    });
  }

  /**
   * Export user data for portability
   */
  exportUserData(userId: string): any {
    // In a real implementation, this would gather all user data
    return {
      userId,
      exportDate: new Date(),
      personalData: {
        // User profile data
      },
      investmentData: {
        // Investment preferences and history
      },
      systemData: {
        // System logs and metadata
      }
    };
  }

  /**
   * Delete user data (right to erasure)
   */
  deleteUserData(userId: string, dataCategories: string[], retainForLegal: boolean = true): void {
    // In a real implementation, this would delete specified data categories
    console.log('Deleting user data:', {
      userId,
      dataCategories,
      retainForLegal,
      deletionDate: new Date()
    });
  }

  /**
   * Validate data retention periods
   */
  validateRetentionPeriods(): { [category: string]: number } {
    return {
      personalData: 7 * 365, // 7 years
      financialTransactions: 7 * 365, // 7 years
      auditLogs: 7 * 365, // 7 years
      systemLogs: 2 * 365, // 2 years
      marketingData: 3 * 365, // 3 years
      analyticsData: 2 * 365 // 2 years
    };
  }

  /**
   * Check if data transfer is compliant with privacy regulations
   */
  validateDataTransfer(sourceCountry: string, destinationCountry: string, dataCategories: string[]): {
    compliant: boolean;
    mechanism: string;
    additionalSafeguards: string[];
  } {
    const adequateCountries = [
      'Andorra', 'Argentina', 'Canada', 'Faroe Islands', 'Guernsey',
      'Israel', 'Isle of Man', 'Japan', 'Jersey', 'New Zealand',
      'South Korea', 'Switzerland', 'United Kingdom', 'Uruguay'
    ];

    const isAdequate = adequateCountries.includes(destinationCountry);

    return {
      compliant: isAdequate || destinationCountry === sourceCountry,
      mechanism: isAdequate ? 'adequacy_decision' : 'standard_contractual_clauses',
      additionalSafeguards: isAdequate ? [] : [
        'Data encryption in transit and at rest',
        'Access controls and authentication',
        'Regular security audits',
        'Data breach notification procedures'
      ]
    };
  }
}