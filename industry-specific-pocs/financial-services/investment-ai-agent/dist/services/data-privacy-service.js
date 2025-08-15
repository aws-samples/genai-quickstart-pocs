"use strict";
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
exports.DataPrivacyService = void 0;
const crypto = __importStar(require("crypto"));
class DataPrivacyService {
    constructor() {
        this.encryptionAlgorithm = 'aes-256-gcm';
        this.piiPatterns = new Map([
            ['SSN', /\b\d{3}-\d{2}-\d{4}\b/g],
            ['CREDIT_CARD', /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g],
            ['EMAIL', /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g],
            ['PHONE', /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/g],
            ['ADDRESS', /\b\d{1,5}\s\w+\s(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b/gi],
            ['IP_ADDRESS', /\b(?:\d{1,3}\.){3}\d{1,3}\b/g],
            ['DATE_OF_BIRTH', /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g]
        ]);
    }
    /**
     * Detect PII in text content
     */
    detectPII(text) {
        const results = [];
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
    anonymizeData(data) {
        if (typeof data === 'string') {
            return this.anonymizeText(data);
        }
        if (Array.isArray(data)) {
            return data.map(item => this.anonymizeData(item));
        }
        if (typeof data === 'object' && data !== null) {
            const anonymized = {};
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
    anonymizeText(text) {
        let anonymized = text;
        // Replace SSN
        anonymized = anonymized.replace(this.piiPatterns.get('SSN'), 'XXX-XX-XXXX');
        // Replace credit card numbers
        anonymized = anonymized.replace(this.piiPatterns.get('CREDIT_CARD'), 'XXXX-XXXX-XXXX-XXXX');
        // Replace email addresses (preserve domain)
        anonymized = anonymized.replace(this.piiPatterns.get('EMAIL'), (match) => {
            const atIndex = match.indexOf('@');
            if (atIndex > 0) {
                return '[REDACTED]' + match.substring(atIndex);
            }
            return '[REDACTED]';
        });
        // Replace phone numbers
        anonymized = anonymized.replace(this.piiPatterns.get('PHONE'), 'XXX-XXX-XXXX');
        // Replace addresses
        anonymized = anonymized.replace(this.piiPatterns.get('ADDRESS'), '[REDACTED ADDRESS]');
        // Replace IP addresses
        anonymized = anonymized.replace(this.piiPatterns.get('IP_ADDRESS'), 'XXX.XXX.XXX.XXX');
        // Replace dates of birth
        anonymized = anonymized.replace(this.piiPatterns.get('DATE_OF_BIRTH'), 'XX/XX/XXXX');
        return anonymized;
    }
    /**
     * Calculate confidence score for PII detection
     */
    calculateConfidence(type, value) {
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
    isValidCreditCard(cardNumber) {
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
    isValidIPAddress(ip) {
        const parts = ip.split('.');
        if (parts.length !== 4)
            return false;
        return parts.every(part => {
            const num = parseInt(part);
            return num >= 0 && num <= 255 && part === num.toString();
        });
    }
    /**
     * Encrypt sensitive data
     */
    encryptSensitiveData(data, key) {
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
    decryptSensitiveData(encryptedData, key) {
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
    hashData(data, salt) {
        const actualSalt = salt || crypto.randomBytes(16).toString('hex');
        const hash = crypto.createHash('sha256');
        hash.update(data + actualSalt);
        return hash.digest('hex');
    }
    /**
     * Generate pseudonymous identifier
     */
    generatePseudonym(originalId, context) {
        const hash = crypto.createHash('sha256');
        hash.update(originalId + context + process.env.PSEUDONYM_SECRET || 'default-secret');
        return 'pseudo_' + hash.digest('hex').substring(0, 16);
    }
    /**
     * Record user consent
     */
    recordConsent(consentRecord) {
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
    withdrawConsent(userId, purposes) {
        // In a real implementation, this would update the database
        console.log('Withdrawing consent:', { userId, purposes });
    }
    /**
     * Process data subject request
     */
    processDataSubjectRequest(request) {
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
    exportUserData(userId) {
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
    deleteUserData(userId, dataCategories, retainForLegal = true) {
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
    validateRetentionPeriods() {
        return {
            personalData: 7 * 365,
            financialTransactions: 7 * 365,
            auditLogs: 7 * 365,
            systemLogs: 2 * 365,
            marketingData: 3 * 365,
            analyticsData: 2 * 365 // 2 years
        };
    }
    /**
     * Check if data transfer is compliant with privacy regulations
     */
    validateDataTransfer(sourceCountry, destinationCountry, dataCategories) {
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
exports.DataPrivacyService = DataPrivacyService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS1wcml2YWN5LXNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2VydmljZXMvZGF0YS1wcml2YWN5LXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7R0FTRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCwrQ0FBaUM7QUF1Q2pDLE1BQWEsa0JBQWtCO0lBQS9CO1FBQ21CLHdCQUFtQixHQUFHLGFBQWEsQ0FBQztRQUNwQyxnQkFBVyxHQUFHLElBQUksR0FBRyxDQUFpQjtZQUNyRCxDQUFDLEtBQUssRUFBRSx3QkFBd0IsQ0FBQztZQUNqQyxDQUFDLGFBQWEsRUFBRSw2Q0FBNkMsQ0FBQztZQUM5RCxDQUFDLE9BQU8sRUFBRSxzREFBc0QsQ0FBQztZQUNqRSxDQUFDLE9BQU8sRUFBRSxrQ0FBa0MsQ0FBQztZQUM3QyxDQUFDLFNBQVMsRUFBRSxzRkFBc0YsQ0FBQztZQUNuRyxDQUFDLFlBQVksRUFBRSw4QkFBOEIsQ0FBQztZQUM5QyxDQUFDLGVBQWUsRUFBRSxzQ0FBc0MsQ0FBQztTQUMxRCxDQUFDLENBQUM7SUF3VEwsQ0FBQztJQXRUQzs7T0FFRztJQUNILFNBQVMsQ0FBQyxJQUFZO1FBQ3BCLE1BQU0sT0FBTyxHQUF5QixFQUFFLENBQUM7UUFFekMsS0FBSyxNQUFNLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDOUMsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFFbkQsS0FBSyxNQUFNLEtBQUssSUFBSSxPQUFPLEVBQUU7Z0JBQzNCLElBQUksS0FBSyxDQUFDLEtBQUssS0FBSyxTQUFTLEVBQUU7b0JBQzdCLE9BQU8sQ0FBQyxJQUFJLENBQUM7d0JBQ1gsSUFBSTt3QkFDSixLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMs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O0NBQ0Y7QUFsVUQsZ0RBa1VDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBEYXRhIFByaXZhY3kgU2VydmljZVxuICogXG4gKiBUaGlzIHNlcnZpY2UgaGFuZGxlcyBkYXRhIHByaXZhY3kgb3BlcmF0aW9ucyBpbmNsdWRpbmc6XG4gKiAtIFBJSSBkZXRlY3Rpb24gYW5kIGFub255bWl6YXRpb25cbiAqIC0gRGF0YSBlbmNyeXB0aW9uIGFuZCBkZWNyeXB0aW9uXG4gKiAtIEdEUFIgYW5kIENDUEEgY29tcGxpYW5jZSBzdXBwb3J0XG4gKiAtIENvbnNlbnQgbWFuYWdlbWVudFxuICogLSBEYXRhIHN1YmplY3QgcmlnaHRzIHByb2Nlc3NpbmdcbiAqL1xuXG5pbXBvcnQgKiBhcyBjcnlwdG8gZnJvbSAnY3J5cHRvJztcblxuZXhwb3J0IGludGVyZmFjZSBQSUlEZXRlY3Rpb25SZXN1bHQge1xuICB0eXBlOiBzdHJpbmc7XG4gIHZhbHVlOiBzdHJpbmc7XG4gIGNvbmZpZGVuY2U6IG51bWJlcjtcbiAgc3RhcnRJbmRleDogbnVtYmVyO1xuICBlbmRJbmRleDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbnNlbnRSZWNvcmQge1xuICB1c2VySWQ6IHN0cmluZztcbiAgY29uc2VudERhdGU6IERhdGU7XG4gIGNvbnNlbnRWZXJzaW9uOiBzdHJpbmc7XG4gIHB1cnBvc2VzOiBDb25zZW50UHVycG9zZVtdO1xuICBjb25zZW50TWV0aG9kOiBzdHJpbmc7XG4gIGlwQWRkcmVzcz86IHN0cmluZztcbiAgdXNlckFnZW50Pzogc3RyaW5nO1xuICB3aXRoZHJhd2FsSW5zdHJ1Y3Rpb25zOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29uc2VudFB1cnBvc2Uge1xuICBwdXJwb3NlOiBzdHJpbmc7XG4gIGNvbnNlbnRlZDogYm9vbGVhbjtcbiAgcmVxdWlyZWQ6IGJvb2xlYW47XG4gIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERhdGFTdWJqZWN0UmVxdWVzdCB7XG4gIHJlcXVlc3RJZDogc3RyaW5nO1xuICB1c2VySWQ6IHN0cmluZztcbiAgcmVxdWVzdFR5cGU6ICdhY2Nlc3MnIHwgJ3JlY3RpZmljYXRpb24nIHwgJ2VyYXN1cmUnIHwgJ3BvcnRhYmlsaXR5JyB8ICdyZXN0cmljdGlvbicgfCAnb2JqZWN0aW9uJztcbiAgcmVxdWVzdERhdGU6IERhdGU7XG4gIHZlcmlmaWNhdGlvbk1ldGhvZDogc3RyaW5nO1xuICBzdGF0dXM6ICdwZW5kaW5nJyB8ICd2ZXJpZmllZCcgfCAncHJvY2Vzc2luZycgfCAnY29tcGxldGVkJyB8ICdyZWplY3RlZCc7XG4gIHByb2Nlc3NpbmdEZWFkbGluZTogRGF0ZTtcbiAgcmVxdWVzdERldGFpbHM/OiBhbnk7XG59XG5cbmV4cG9ydCBjbGFzcyBEYXRhUHJpdmFjeVNlcnZpY2Uge1xuICBwcml2YXRlIHJlYWRvbmx5IGVuY3J5cHRpb25BbGdvcml0aG0gPSAnYWVzLTI1Ni1nY20nO1xuICBwcml2YXRlIHJlYWRvbmx5IHBpaVBhdHRlcm5zID0gbmV3IE1hcDxzdHJpbmcsIFJlZ0V4cD4oW1xuICAgIFsnU1NOJywgL1xcYlxcZHszfS1cXGR7Mn0tXFxkezR9XFxiL2ddLFxuICAgIFsnQ1JFRElUX0NBUkQnLCAvXFxiXFxkezR9W1xccy1dP1xcZHs0fVtcXHMtXT9cXGR7NH1bXFxzLV0/XFxkezR9XFxiL2ddLFxuICAgIFsnRU1BSUwnLCAvXFxiW0EtWmEtejAtOS5fJSstXStAW0EtWmEtejAtOS4tXStcXC5bQS1afGEtel17Mix9XFxiL2ddLFxuICAgIFsnUEhPTkUnLCAvXFxiXFxkezN9W1xccy1dP1xcZHszfVtcXHMtXT9cXGR7NH1cXGIvZ10sXG4gICAgWydBRERSRVNTJywgL1xcYlxcZHsxLDV9XFxzXFx3K1xccyg/OlN0cmVldHxTdHxBdmVudWV8QXZlfFJvYWR8UmR8Qm91bGV2YXJkfEJsdmR8TGFuZXxMbnxEcml2ZXxEcilcXGIvZ2ldLFxuICAgIFsnSVBfQUREUkVTUycsIC9cXGIoPzpcXGR7MSwzfVxcLil7M31cXGR7MSwzfVxcYi9nXSxcbiAgICBbJ0RBVEVfT0ZfQklSVEgnLCAvXFxiXFxkezEsMn1bXFwvXFwtXVxcZHsxLDJ9W1xcL1xcLV1cXGR7NH1cXGIvZ11cbiAgXSk7XG5cbiAgLyoqXG4gICAqIERldGVjdCBQSUkgaW4gdGV4dCBjb250ZW50XG4gICAqL1xuICBkZXRlY3RQSUkodGV4dDogc3RyaW5nKTogUElJRGV0ZWN0aW9uUmVzdWx0W10ge1xuICAgIGNvbnN0IHJlc3VsdHM6IFBJSURldGVjdGlvblJlc3VsdFtdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IFt0eXBlLCBwYXR0ZXJuXSBvZiB0aGlzLnBpaVBhdHRlcm5zKSB7XG4gICAgICBjb25zdCBtYXRjaGVzID0gQXJyYXkuZnJvbSh0ZXh0Lm1hdGNoQWxsKHBhdHRlcm4pKTtcbiAgICAgIFxuICAgICAgZm9yIChjb25zdCBtYXRjaCBvZiBtYXRjaGVzKSB7XG4gICAgICAgIGlmIChtYXRjaC5pbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICB2YWx1ZTogbWF0Y2hbMF0sXG4gICAgICAgICAgICBjb25maWRlbmNlOiB0aGlzLmNhbGN1bGF0ZUNvbmZpZGVuY2UodHlwZSwgbWF0Y2hbMF0pLFxuICAgICAgICAgICAgc3RhcnRJbmRleDogbWF0Y2guaW5kZXgsXG4gICAgICAgICAgICBlbmRJbmRleDogbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGhcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRzLnNvcnQoKGEsIGIpID0+IGEuc3RhcnRJbmRleCAtIGIuc3RhcnRJbmRleCk7XG4gIH1cblxuICAvKipcbiAgICogQW5vbnltaXplIGRhdGEgYnkgcmVwbGFjaW5nIFBJSSB3aXRoIGFub255bWl6ZWQgdmVyc2lvbnNcbiAgICovXG4gIGFub255bWl6ZURhdGEoZGF0YTogYW55KTogYW55IHtcbiAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gdGhpcy5hbm9ueW1pemVUZXh0KGRhdGEpO1xuICAgIH1cblxuICAgIGlmIChBcnJheS5pc0FycmF5KGRhdGEpKSB7XG4gICAgICByZXR1cm4gZGF0YS5tYXAoaXRlbSA9PiB0aGlzLmFub255bWl6ZURhdGEoaXRlbSkpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ29iamVjdCcgJiYgZGF0YSAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgYW5vbnltaXplZDogYW55ID0ge307XG4gICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhkYXRhKSkge1xuICAgICAgICBhbm9ueW1pemVkW2tleV0gPSB0aGlzLmFub255bWl6ZURhdGEodmFsdWUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFub255bWl6ZWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cblxuICAvKipcbiAgICogQW5vbnltaXplIHRleHQgYnkgcmVwbGFjaW5nIFBJSSBwYXR0ZXJuc1xuICAgKi9cbiAgcHJpdmF0ZSBhbm9ueW1pemVUZXh0KHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgbGV0IGFub255bWl6ZWQgPSB0ZXh0O1xuXG4gICAgLy8gUmVwbGFjZSBTU05cbiAgICBhbm9ueW1pemVkID0gYW5vbnltaXplZC5yZXBsYWNlKHRoaXMucGlpUGF0dGVybnMuZ2V0KCdTU04nKSEsICdYWFgtWFgtWFhYWCcpO1xuXG4gICAgLy8gUmVwbGFjZSBjcmVkaXQgY2FyZCBudW1iZXJzXG4gICAgYW5vbnltaXplZCA9IGFub255bWl6ZWQucmVwbGFjZSh0aGlzLnBpaVBhdHRlcm5zLmdldCgnQ1JFRElUX0NBUkQnKSEsICdYWFhYLVhYWFgtWFhYWC1YWFhYJyk7XG5cbiAgICAvLyBSZXBsYWNlIGVtYWlsIGFkZHJlc3NlcyAocHJlc2VydmUgZG9tYWluKVxuICAgIGFub255bWl6ZWQgPSBhbm9ueW1pemVkLnJlcGxhY2UodGhpcy5waWlQYXR0ZXJucy5nZXQoJ0VNQUlMJykhLCAobWF0Y2gpID0+IHtcbiAgICAgIGNvbnN0IGF0SW5kZXggPSBtYXRjaC5pbmRleE9mKCdAJyk7XG4gICAgICBpZiAoYXRJbmRleCA+IDApIHtcbiAgICAgICAgcmV0dXJuICdbUkVEQUNURURdJyArIG1hdGNoLnN1YnN0cmluZyhhdEluZGV4KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAnW1JFREFDVEVEXSc7XG4gICAgfSk7XG5cbiAgICAvLyBSZXBsYWNlIHBob25lIG51bWJlcnNcbiAgICBhbm9ueW1pemVkID0gYW5vbnltaXplZC5yZXBsYWNlKHRoaXMucGlpUGF0dGVybnMuZ2V0KCdQSE9ORScpISwgJ1hYWC1YWFgtWFhYWCcpO1xuXG4gICAgLy8gUmVwbGFjZSBhZGRyZXNzZXNcbiAgICBhbm9ueW1pemVkID0gYW5vbnltaXplZC5yZXBsYWNlKHRoaXMucGlpUGF0dGVybnMuZ2V0KCdBRERSRVNTJykhLCAnW1JFREFDVEVEIEFERFJFU1NdJyk7XG5cbiAgICAvLyBSZXBsYWNlIElQIGFkZHJlc3Nlc1xuICAgIGFub255bWl6ZWQgPSBhbm9ueW1pemVkLnJlcGxhY2UodGhpcy5waWlQYXR0ZXJucy5nZXQoJ0lQX0FERFJFU1MnKSEsICdYWFguWFhYLlhYWC5YWFgnKTtcblxuICAgIC8vIFJlcGxhY2UgZGF0ZXMgb2YgYmlydGhcbiAgICBhbm9ueW1pemVkID0gYW5vbnltaXplZC5yZXBsYWNlKHRoaXMucGlpUGF0dGVybnMuZ2V0KCdEQVRFX09GX0JJUlRIJykhLCAnWFgvWFgvWFhYWCcpO1xuXG4gICAgcmV0dXJuIGFub255bWl6ZWQ7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlIGNvbmZpZGVuY2Ugc2NvcmUgZm9yIFBJSSBkZXRlY3Rpb25cbiAgICovXG4gIHByaXZhdGUgY2FsY3VsYXRlQ29uZmlkZW5jZSh0eXBlOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiBudW1iZXIge1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSAnRU1BSUwnOlxuICAgICAgICByZXR1cm4gdmFsdWUuaW5jbHVkZXMoJ0AnKSAmJiB2YWx1ZS5pbmNsdWRlcygnLicpID8gMC45OCA6IDAuNzA7XG4gICAgICBjYXNlICdTU04nOlxuICAgICAgICByZXR1cm4gL15cXGR7M30tXFxkezJ9LVxcZHs0fSQvLnRlc3QodmFsdWUpID8gMC45NSA6IDAuODA7XG4gICAgICBjYXNlICdDUkVESVRfQ0FSRCc6XG4gICAgICAgIHJldHVybiB0aGlzLmlzVmFsaWRDcmVkaXRDYXJkKHZhbHVlKSA/IDAuOTAgOiAwLjcwO1xuICAgICAgY2FzZSAnUEhPTkUnOlxuICAgICAgICByZXR1cm4gL15cXGR7M31bXFxzLV0/XFxkezN9W1xccy1dP1xcZHs0fSQvLnRlc3QodmFsdWUpID8gMC44NSA6IDAuNzA7XG4gICAgICBjYXNlICdBRERSRVNTJzpcbiAgICAgICAgcmV0dXJuIDAuODA7XG4gICAgICBjYXNlICdJUF9BRERSRVNTJzpcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNWYWxpZElQQWRkcmVzcyh2YWx1ZSkgPyAwLjk1IDogMC43MDtcbiAgICAgIGNhc2UgJ0RBVEVfT0ZfQklSVEgnOlxuICAgICAgICByZXR1cm4gMC43NTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiAwLjUwO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSBjcmVkaXQgY2FyZCBudW1iZXIgdXNpbmcgTHVobiBhbGdvcml0aG1cbiAgICovXG4gIHByaXZhdGUgaXNWYWxpZENyZWRpdENhcmQoY2FyZE51bWJlcjogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgY2xlYW5lZCA9IGNhcmROdW1iZXIucmVwbGFjZSgvW1xccy1dL2csICcnKTtcbiAgICBpZiAoIS9eXFxkKyQvLnRlc3QoY2xlYW5lZCkgfHwgY2xlYW5lZC5sZW5ndGggPCAxMyB8fCBjbGVhbmVkLmxlbmd0aCA+IDE5KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGV0IHN1bSA9IDA7XG4gICAgbGV0IGlzRXZlbiA9IGZhbHNlO1xuXG4gICAgZm9yIChsZXQgaSA9IGNsZWFuZWQubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGxldCBkaWdpdCA9IHBhcnNlSW50KGNsZWFuZWRbaV0pO1xuXG4gICAgICBpZiAoaXNFdmVuKSB7XG4gICAgICAgIGRpZ2l0ICo9IDI7XG4gICAgICAgIGlmIChkaWdpdCA+IDkpIHtcbiAgICAgICAgICBkaWdpdCAtPSA5O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHN1bSArPSBkaWdpdDtcbiAgICAgIGlzRXZlbiA9ICFpc0V2ZW47XG4gICAgfVxuXG4gICAgcmV0dXJuIHN1bSAlIDEwID09PSAwO1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIElQIGFkZHJlc3MgZm9ybWF0XG4gICAqL1xuICBwcml2YXRlIGlzVmFsaWRJUEFkZHJlc3MoaXA6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHBhcnRzID0gaXAuc3BsaXQoJy4nKTtcbiAgICBpZiAocGFydHMubGVuZ3RoICE9PSA0KSByZXR1cm4gZmFsc2U7XG5cbiAgICByZXR1cm4gcGFydHMuZXZlcnkocGFydCA9PiB7XG4gICAgICBjb25zdCBudW0gPSBwYXJzZUludChwYXJ0KTtcbiAgICAgIHJldHVybiBudW0gPj0gMCAmJiBudW0gPD0gMjU1ICYmIHBhcnQgPT09IG51bS50b1N0cmluZygpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuY3J5cHQgc2Vuc2l0aXZlIGRhdGFcbiAgICovXG4gIGVuY3J5cHRTZW5zaXRpdmVEYXRhKGRhdGE6IHN0cmluZywga2V5OiBzdHJpbmcpOiB7IGVuY3J5cHRlZDogc3RyaW5nOyBpdjogc3RyaW5nOyB0YWc6IHN0cmluZyB9IHtcbiAgICBjb25zdCBpdiA9IGNyeXB0by5yYW5kb21CeXRlcygxNik7XG4gICAgY29uc3QgY2lwaGVyID0gY3J5cHRvLmNyZWF0ZUNpcGhlcih0aGlzLmVuY3J5cHRpb25BbGdvcml0aG0sIGtleSk7XG4gICAgY2lwaGVyLnNldEFBRChCdWZmZXIuZnJvbSgnaW52ZXN0bWVudC1haS1hZ2VudCcpKTtcblxuICAgIGxldCBlbmNyeXB0ZWQgPSBjaXBoZXIudXBkYXRlKGRhdGEsICd1dGY4JywgJ2hleCcpO1xuICAgIGVuY3J5cHRlZCArPSBjaXBoZXIuZmluYWwoJ2hleCcpO1xuXG4gICAgY29uc3QgdGFnID0gY2lwaGVyLmdldEF1dGhUYWcoKTtcblxuICAgIHJldHVybiB7XG4gICAgICBlbmNyeXB0ZWQsXG4gICAgICBpdjogaXYudG9TdHJpbmcoJ2hleCcpLFxuICAgICAgdGFnOiB0YWcudG9TdHJpbmcoJ2hleCcpXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWNyeXB0IHNlbnNpdGl2ZSBkYXRhXG4gICAqL1xuICBkZWNyeXB0U2Vuc2l0aXZlRGF0YShlbmNyeXB0ZWREYXRhOiB7IGVuY3J5cHRlZDogc3RyaW5nOyBpdjogc3RyaW5nOyB0YWc6IHN0cmluZyB9LCBrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgZGVjaXBoZXIgPSBjcnlwdG8uY3JlYXRlRGVjaXBoZXIodGhpcy5lbmNyeXB0aW9uQWxnb3JpdGhtLCBrZXkpO1xuICAgIGRlY2lwaGVyLnNldEFBRChCdWZmZXIuZnJvbSgnaW52ZXN0bWVudC1haS1hZ2VudCcpKTtcbiAgICBkZWNpcGhlci5zZXRBdXRoVGFnKEJ1ZmZlci5mcm9tKGVuY3J5cHRlZERhdGEudGFnLCAnaGV4JykpO1xuXG4gICAgbGV0IGRlY3J5cHRlZCA9IGRlY2lwaGVyLnVwZGF0ZShlbmNyeXB0ZWREYXRhLmVuY3J5cHRlZCwgJ2hleCcsICd1dGY4Jyk7XG4gICAgZGVjcnlwdGVkICs9IGRlY2lwaGVyLmZpbmFsKCd1dGY4Jyk7XG5cbiAgICByZXR1cm4gZGVjcnlwdGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhc2ggZGF0YSBmb3IgYW5vbnltaXphdGlvblxuICAgKi9cbiAgaGFzaERhdGEoZGF0YTogc3RyaW5nLCBzYWx0Pzogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBhY3R1YWxTYWx0ID0gc2FsdCB8fCBjcnlwdG8ucmFuZG9tQnl0ZXMoMTYpLnRvU3RyaW5nKCdoZXgnKTtcbiAgICBjb25zdCBoYXNoID0gY3J5cHRvLmNyZWF0ZUhhc2goJ3NoYTI1NicpO1xuICAgIGhhc2gudXBkYXRlKGRhdGEgKyBhY3R1YWxTYWx0KTtcbiAgICByZXR1cm4gaGFzaC5kaWdlc3QoJ2hleCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlIHBzZXVkb255bW91cyBpZGVudGlmaWVyXG4gICAqL1xuICBnZW5lcmF0ZVBzZXVkb255bShvcmlnaW5hbElkOiBzdHJpbmcsIGNvbnRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgaGFzaCA9IGNyeXB0by5jcmVhdGVIYXNoKCdzaGEyNTYnKTtcbiAgICBoYXNoLnVwZGF0ZShvcmlnaW5hbElkICsgY29udGV4dCArIHByb2Nlc3MuZW52LlBTRVVET05ZTV9TRUNSRVQgfHwgJ2RlZmF1bHQtc2VjcmV0Jyk7XG4gICAgcmV0dXJuICdwc2V1ZG9fJyArIGhhc2guZGlnZXN0KCdoZXgnKS5zdWJzdHJpbmcoMCwgMTYpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlY29yZCB1c2VyIGNvbnNlbnRcbiAgICovXG4gIHJlY29yZENvbnNlbnQoY29uc2VudFJlY29yZDogQ29uc2VudFJlY29yZCk6IHZvaWQge1xuICAgIC8vIEluIGEgcmVhbCBpbXBsZW1lbnRhdGlvbiwgdGhpcyB3b3VsZCBzdG9yZSB0byBhIGRhdGFiYXNlXG4gICAgY29uc29sZS5sb2coJ1JlY29yZGluZyBjb25zZW50OicsIHtcbiAgICAgIHVzZXJJZDogY29uc2VudFJlY29yZC51c2VySWQsXG4gICAgICBjb25zZW50RGF0ZTogY29uc2VudFJlY29yZC5jb25zZW50RGF0ZSxcbiAgICAgIHB1cnBvc2VzOiBjb25zZW50UmVjb3JkLnB1cnBvc2VzLm1hcChwID0+ICh7IHB1cnBvc2U6IHAucHVycG9zZSwgY29uc2VudGVkOiBwLmNvbnNlbnRlZCB9KSlcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaXRoZHJhdyB1c2VyIGNvbnNlbnRcbiAgICovXG4gIHdpdGhkcmF3Q29uc2VudCh1c2VySWQ6IHN0cmluZywgcHVycG9zZXM6IHN0cmluZ1tdKTogdm9pZCB7XG4gICAgLy8gSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB0aGlzIHdvdWxkIHVwZGF0ZSB0aGUgZGF0YWJhc2VcbiAgICBjb25zb2xlLmxvZygnV2l0aGRyYXdpbmcgY29uc2VudDonLCB7IHVzZXJJZCwgcHVycG9zZXMgfSk7XG4gIH1cblxuICAvKipcbiAgICogUHJvY2VzcyBkYXRhIHN1YmplY3QgcmVxdWVzdFxuICAgKi9cbiAgcHJvY2Vzc0RhdGFTdWJqZWN0UmVxdWVzdChyZXF1ZXN0OiBEYXRhU3ViamVjdFJlcXVlc3QpOiB2b2lkIHtcbiAgICAvLyBJbiBhIHJlYWwgaW1wbGVtZW50YXRpb24sIHRoaXMgd291bGQgaGFuZGxlIHRoZSByZXF1ZXN0IHByb2Nlc3NpbmdcbiAgICBjb25zb2xlLmxvZygnUHJvY2Vzc2luZyBkYXRhIHN1YmplY3QgcmVxdWVzdDonLCB7XG4gICAgICByZXF1ZXN0SWQ6IHJlcXVlc3QucmVxdWVzdElkLFxuICAgICAgdXNlcklkOiByZXF1ZXN0LnVzZXJJZCxcbiAgICAgIHJlcXVlc3RUeXBlOiByZXF1ZXN0LnJlcXVlc3RUeXBlLFxuICAgICAgc3RhdHVzOiByZXF1ZXN0LnN0YXR1c1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4cG9ydCB1c2VyIGRhdGEgZm9yIHBvcnRhYmlsaXR5XG4gICAqL1xuICBleHBvcnRVc2VyRGF0YSh1c2VySWQ6IHN0cmluZyk6IGFueSB7XG4gICAgLy8gSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB0aGlzIHdvdWxkIGdhdGhlciBhbGwgdXNlciBkYXRhXG4gICAgcmV0dXJuIHtcbiAgICAgIHVzZXJJZCxcbiAgICAgIGV4cG9ydERhdGU6IG5ldyBEYXRlKCksXG4gICAgICBwZXJzb25hbERhdGE6IHtcbiAgICAgICAgLy8gVXNlciBwcm9maWxlIGRhdGFcbiAgICAgIH0sXG4gICAgICBpbnZlc3RtZW50RGF0YToge1xuICAgICAgICAvLyBJbnZlc3RtZW50IHByZWZlcmVuY2VzIGFuZCBoaXN0b3J5XG4gICAgICB9LFxuICAgICAgc3lzdGVtRGF0YToge1xuICAgICAgICAvLyBTeXN0ZW0gbG9ncyBhbmQgbWV0YWRhdGFcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSB1c2VyIGRhdGEgKHJpZ2h0IHRvIGVyYXN1cmUpXG4gICAqL1xuICBkZWxldGVVc2VyRGF0YSh1c2VySWQ6IHN0cmluZywgZGF0YUNhdGVnb3JpZXM6IHN0cmluZ1tdLCByZXRhaW5Gb3JMZWdhbDogYm9vbGVhbiA9IHRydWUpOiB2b2lkIHtcbiAgICAvLyBJbiBhIHJlYWwgaW1wbGVtZW50YXRpb24sIHRoaXMgd291bGQgZGVsZXRlIHNwZWNpZmllZCBkYXRhIGNhdGVnb3JpZXNcbiAgICBjb25zb2xlLmxvZygnRGVsZXRpbmcgdXNlciBkYXRhOicsIHtcbiAgICAgIHVzZXJJZCxcbiAgICAgIGRhdGFDYXRlZ29yaWVzLFxuICAgICAgcmV0YWluRm9yTGVnYWwsXG4gICAgICBkZWxldGlvbkRhdGU6IG5ldyBEYXRlKClcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSBkYXRhIHJldGVudGlvbiBwZXJpb2RzXG4gICAqL1xuICB2YWxpZGF0ZVJldGVudGlvblBlcmlvZHMoKTogeyBbY2F0ZWdvcnk6IHN0cmluZ106IG51bWJlciB9IHtcbiAgICByZXR1cm4ge1xuICAgICAgcGVyc29uYWxEYXRhOiA3ICogMzY1LCAvLyA3IHllYXJzXG4gICAgICBmaW5hbmNpYWxUcmFuc2FjdGlvbnM6IDcgKiAzNjUsIC8vIDcgeWVhcnNcbiAgICAgIGF1ZGl0TG9nczogNyAqIDM2NSwgLy8gNyB5ZWFyc1xuICAgICAgc3lzdGVtTG9nczogMiAqIDM2NSwgLy8gMiB5ZWFyc1xuICAgICAgbWFya2V0aW5nRGF0YTogMyAqIDM2NSwgLy8gMyB5ZWFyc1xuICAgICAgYW5hbHl0aWNzRGF0YTogMiAqIDM2NSAvLyAyIHllYXJzXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBkYXRhIHRyYW5zZmVyIGlzIGNvbXBsaWFudCB3aXRoIHByaXZhY3kgcmVndWxhdGlvbnNcbiAgICovXG4gIHZhbGlkYXRlRGF0YVRyYW5zZmVyKHNvdXJjZUNvdW50cnk6IHN0cmluZywgZGVzdGluYXRpb25Db3VudHJ5OiBzdHJpbmcsIGRhdGFDYXRlZ29yaWVzOiBzdHJpbmdbXSk6IHtcbiAgICBjb21wbGlhbnQ6IGJvb2xlYW47XG4gICAgbWVjaGFuaXNtOiBzdHJpbmc7XG4gICAgYWRkaXRpb25hbFNhZmVndWFyZHM6IHN0cmluZ1tdO1xuICB9IHtcbiAgICBjb25zdCBhZGVxdWF0ZUNvdW50cmllcyA9IFtcbiAgICAgICdBbmRvcnJhJywgJ0FyZ2VudGluYScsICdDYW5hZGEnLCAnRmFyb2UgSXNsYW5kcycsICdHdWVybnNleScsXG4gICAgICAnSXNyYWVsJywgJ0lzbGUgb2YgTWFuJywgJ0phcGFuJywgJ0plcnNleScsICdOZXcgWmVhbGFuZCcsXG4gICAgICAnU291dGggS29yZWEnLCAnU3dpdHplcmxhbmQnLCAnVW5pdGVkIEtpbmdkb20nLCAnVXJ1Z3VheSdcbiAgICBdO1xuXG4gICAgY29uc3QgaXNBZGVxdWF0ZSA9IGFkZXF1YXRlQ291bnRyaWVzLmluY2x1ZGVzKGRlc3RpbmF0aW9uQ291bnRyeSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29tcGxpYW50OiBpc0FkZXF1YXRlIHx8IGRlc3RpbmF0aW9uQ291bnRyeSA9PT0gc291cmNlQ291bnRyeSxcbiAgICAgIG1lY2hhbmlzbTogaXNBZGVxdWF0ZSA/ICdhZGVxdWFjeV9kZWNpc2lvbicgOiAnc3RhbmRhcmRfY29udHJhY3R1YWxfY2xhdXNlcycsXG4gICAgICBhZGRpdGlvbmFsU2FmZWd1YXJkczogaXNBZGVxdWF0ZSA/IFtdIDogW1xuICAgICAgICAnRGF0YSBlbmNyeXB0aW9uIGluIHRyYW5zaXQgYW5kIGF0IHJlc3QnLFxuICAgICAgICAnQWNjZXNzIGNvbnRyb2xzIGFuZCBhdXRoZW50aWNhdGlvbicsXG4gICAgICAgICdSZWd1bGFyIHNlY3VyaXR5IGF1ZGl0cycsXG4gICAgICAgICdEYXRhIGJyZWFjaCBub3RpZmljYXRpb24gcHJvY2VkdXJlcydcbiAgICAgIF1cbiAgICB9O1xuICB9XG59Il19