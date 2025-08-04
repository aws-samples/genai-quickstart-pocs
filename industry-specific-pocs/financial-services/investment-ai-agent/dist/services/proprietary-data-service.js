"use strict";
/**
 * Service for handling proprietary data integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProprietaryDataService = void 0;
const models_1 = require("../models");
const uuid_1 = require("uuid");
/**
 * Service for handling proprietary data integration
 */
class ProprietaryDataService {
    constructor(bucketName) {
        this.bucketName = bucketName;
        // Initialize S3 client - will be implemented when AWS SDK is added
        this.s3Client = null;
    }
    /**
     * Upload a file to the proprietary data storage
     * @param file The file to upload
     * @param metadata Metadata about the file
     * @param userId The ID of the user uploading the file
     * @param organizationId The ID of the organization the user belongs to
     * @param accessControl Access control settings for the file
     * @returns Upload result with status and document ID
     */
    async uploadFile(file, metadata, userId, organizationId, accessControl) {
        try {
            // Validate file
            const validationResult = this.validateFile(file);
            if (!validationResult.valid) {
                return {
                    success: false,
                    error: validationResult.errors.map(e => e.message).join(', '),
                    processingStatus: 'failed'
                };
            }
            // Generate unique ID for the file
            const documentId = (0, uuid_1.v4)();
            // Determine file type
            const fileType = this.determineFileType(file.name);
            // Create storage key
            const storageKey = `${organizationId}/${userId}/${documentId}/${file.name}`;
            // Create proprietary data file record
            const dataFile = {
                id: documentId,
                fileName: file.name,
                fileSize: file.size,
                fileType,
                uploadDate: new Date(),
                userId,
                organizationId,
                metadata,
                status: 'uploaded',
                accessControl,
                storageLocation: storageKey
            };
            // Upload to S3 (mock implementation for now)
            // await this.uploadToS3(file, storageKey);
            // Store metadata in database (mock implementation for now)
            // await this.storeMetadata(dataFile);
            // Queue file for processing
            this.queueFileForProcessing(documentId);
            return {
                success: true,
                documentId,
                processingStatus: 'queued'
            };
        }
        catch (error) {
            console.error('Error uploading file:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                processingStatus: 'failed'
            };
        }
    }
    /**
     * Process a file that has been uploaded
     * @param documentId The ID of the document to process
     * @returns Processing result
     */
    async processFile(documentId) {
        try {
            // Retrieve file metadata (mock implementation)
            const dataFile = await this.getFileMetadata(documentId);
            if (!dataFile) {
                return {
                    success: false,
                    error: 'File not found',
                    processingStatus: 'failed'
                };
            }
            // Update status to processing
            await this.updateFileStatus(documentId, 'processing');
            // Extract data from file based on file type
            const extractionResult = await this.extractData(dataFile);
            if (!extractionResult.success) {
                await this.updateFileStatus(documentId, 'failed', extractionResult.error);
                return {
                    success: false,
                    documentId,
                    error: extractionResult.error,
                    processingStatus: 'failed'
                };
            }
            // Store extracted data
            await this.storeExtractedData(documentId, extractionResult.extractedData);
            // Update status to processed
            await this.updateFileStatus(documentId, 'processed');
            return {
                success: true,
                documentId,
                processingStatus: 'completed',
                processingTime: extractionResult.processingTime
            };
        }
        catch (error) {
            console.error('Error processing file:', error);
            await this.updateFileStatus(documentId, 'failed', error instanceof Error ? error.message : 'Unknown error');
            return {
                success: false,
                documentId,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                processingStatus: 'failed'
            };
        }
    }
    /**
     * Normalize data according to specified options
     * @param data The data to normalize
     * @param options Normalization options
     * @returns Normalized data result
     */
    async normalizeData(data, options) {
        try {
            const transformations = [];
            const warnings = [];
            let normalizedData = JSON.parse(JSON.stringify(data)); // Deep copy
            // Handle different data types
            if (Array.isArray(normalizedData)) {
                // Array of objects (tabular data)
                normalizedData = this.normalizeTabularData(normalizedData, options, transformations, warnings);
            }
            else if (typeof normalizedData === 'object' && normalizedData !== null) {
                // Single object
                normalizedData = this.normalizeObject(normalizedData, options, transformations, warnings);
            }
            else {
                return {
                    success: false,
                    normalizedData: data,
                    transformations: [],
                    warnings: ['Unsupported data format for normalization'],
                    error: 'Unsupported data format'
                };
            }
            return {
                success: true,
                normalizedData,
                transformations,
                warnings
            };
        }
        catch (error) {
            console.error('Error normalizing data:', error);
            return {
                success: false,
                normalizedData: data,
                transformations: [],
                warnings: [],
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    /**
     * Get a list of proprietary data files for a user
     * @param userId The ID of the user
     * @param organizationId The ID of the organization
     * @returns List of proprietary data files
     */
    async listFiles(userId, organizationId) {
        // Mock implementation - will be replaced with actual database query
        return [];
    }
    /**
     * Get a proprietary data file by ID
     * @param documentId The ID of the document
     * @param userId The ID of the user requesting the file
     * @returns The proprietary data file if found and accessible
     */
    async getFile(documentId, userId) {
        // Mock implementation - will be replaced with actual database query
        return null;
    }
    /**
     * Delete a proprietary data file
     * @param documentId The ID of the document to delete
     * @param userId The ID of the user requesting deletion
     * @returns True if deletion was successful
     */
    async deleteFile(documentId, userId) {
        try {
            // Check if file exists and user has permission
            const file = await this.getFile(documentId, userId);
            if (!file) {
                return false;
            }
            // Check if user has permission to delete
            if (file.userId !== userId) {
                // Check if user has admin role or other permission
                // This would be implemented based on the application's permission system
                return false;
            }
            // Delete from S3 (mock implementation)
            // await this.deleteFromS3(file.storageLocation);
            // Delete metadata from database (mock implementation)
            // await this.deleteMetadata(documentId);
            return true;
        }
        catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }
    /**
     * Update access control for a file
     * @param documentId The ID of the document
     * @param userId The ID of the user requesting the update
     * @param accessControl New access control settings
     * @returns True if update was successful
     */
    async updateAccessControl(documentId, userId, accessControl) {
        try {
            // Check if file exists and user has permission
            const file = await this.getFile(documentId, userId);
            if (!file) {
                return false;
            }
            // Check if user has permission to update
            if (file.userId !== userId) {
                // Check if user has admin role or other permission
                // This would be implemented based on the application's permission system
                return false;
            }
            // Update access control in database (mock implementation)
            // await this.updateFileAccessControl(documentId, accessControl);
            return true;
        }
        catch (error) {
            console.error('Error updating access control:', error);
            return false;
        }
    }
    // Private helper methods
    /**
     * Validate a file before upload
     * @param file The file to validate
     * @returns Validation result
     */
    validateFile(file) {
        const errors = [];
        // Check file size (max 100MB)
        const maxSize = 100 * 1024 * 1024; // 100MB in bytes
        if (file.size > maxSize) {
            errors.push(new models_1.ValidationError('File size exceeds maximum allowed (100MB)', 'fileSize', 'INVALID_SIZE'));
        }
        // Check file type
        const fileType = this.determineFileType(file.name);
        if (fileType === 'other') {
            errors.push(new models_1.ValidationError('Unsupported file type. Supported types: CSV, PDF, Excel, JSON', 'fileType', 'INVALID_TYPE'));
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Determine file type from file name
     * @param fileName The name of the file
     * @returns The file type
     */
    determineFileType(fileName) {
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        switch (extension) {
            case 'csv':
                return 'csv';
            case 'pdf':
                return 'pdf';
            case 'xls':
            case 'xlsx':
                return 'excel';
            case 'json':
                return 'json';
            default:
                return 'other';
        }
    }
    /**
     * Queue a file for processing
     * @param documentId The ID of the document to process
     */
    queueFileForProcessing(documentId) {
        // In a real implementation, this would add the file to a queue (SQS, etc.)
        // For now, we'll just process it immediately
        setTimeout(() => {
            this.processFile(documentId).catch(error => {
                console.error('Error processing file:', error);
            });
        }, 100);
    }
    /**
     * Get file metadata from the database
     * @param documentId The ID of the document
     * @returns The file metadata if found
     */
    async getFileMetadata(documentId) {
        // Mock implementation - will be replaced with actual database query
        return null;
    }
    /**
     * Update file status in the database
     * @param documentId The ID of the document
     * @param status The new status
     * @param error Optional error message
     */
    async updateFileStatus(documentId, status, error) {
        // Mock implementation - will be replaced with actual database update
    }
    /**
     * Extract data from a file
     * @param dataFile The file metadata
     * @returns Extraction result
     */
    async extractData(dataFile) {
        const startTime = Date.now();
        try {
            // Mock implementation - will be replaced with actual extraction logic
            // Different extraction methods based on file type
            switch (dataFile.fileType) {
                case 'csv':
                    return await this.extractFromCSV(dataFile);
                case 'pdf':
                    return await this.extractFromPDF(dataFile);
                case 'excel':
                    return await this.extractFromExcel(dataFile);
                case 'json':
                    return await this.extractFromJSON(dataFile);
                default:
                    return {
                        success: false,
                        dataType: 'unknown',
                        error: 'Unsupported file type',
                        processingTime: Date.now() - startTime,
                        extractionMethod: 'none'
                    };
            }
        }
        catch (error) {
            return {
                success: false,
                dataType: 'unknown',
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                processingTime: Date.now() - startTime,
                extractionMethod: 'failed'
            };
        }
    }
    /**
     * Extract data from a CSV file
     * @param dataFile The file metadata
     * @returns Extraction result
     */
    async extractFromCSV(dataFile) {
        // Mock implementation - will be replaced with actual CSV parsing
        return {
            success: true,
            dataType: 'tabular',
            extractedData: [],
            schema: {
                fields: [],
                dataTypes: {}
            },
            processingTime: 100,
            extractionMethod: 'csv-parser'
        };
    }
    /**
     * Extract data from a PDF file
     * @param dataFile The file metadata
     * @returns Extraction result
     */
    async extractFromPDF(dataFile) {
        // Mock implementation - will be replaced with actual PDF parsing
        return {
            success: true,
            dataType: 'text',
            extractedData: '',
            processingTime: 200,
            extractionMethod: 'pdf-parser'
        };
    }
    /**
     * Extract data from an Excel file
     * @param dataFile The file metadata
     * @returns Extraction result
     */
    async extractFromExcel(dataFile) {
        // Mock implementation - will be replaced with actual Excel parsing
        return {
            success: true,
            dataType: 'tabular',
            extractedData: [],
            schema: {
                fields: [],
                dataTypes: {}
            },
            processingTime: 150,
            extractionMethod: 'excel-parser'
        };
    }
    /**
     * Extract data from a JSON file
     * @param dataFile The file metadata
     * @returns Extraction result
     */
    async extractFromJSON(dataFile) {
        // Mock implementation - will be replaced with actual JSON parsing
        return {
            success: true,
            dataType: 'mixed',
            extractedData: {},
            processingTime: 50,
            extractionMethod: 'json-parser'
        };
    }
    /**
     * Store extracted data in the database
     * @param documentId The ID of the document
     * @param extractedData The extracted data
     */
    async storeExtractedData(documentId, extractedData) {
        // Mock implementation - will be replaced with actual database update
    }
    /**
     * Normalize tabular data (array of objects)
     * @param data The data to normalize
     * @param options Normalization options
     * @param transformations Array to track applied transformations
     * @param warnings Array to track warnings
     * @returns Normalized data
     */
    normalizeTabularData(data, options, transformations, warnings) {
        if (data.length === 0) {
            return data;
        }
        // Get all unique keys from all objects
        const allKeys = new Set();
        data.forEach(item => {
            Object.keys(item).forEach(key => allKeys.add(key));
        });
        // Normalize each object
        return data.map(item => this.normalizeObject(item, options, transformations, warnings));
    }
    /**
     * Normalize a single object
     * @param obj The object to normalize
     * @param options Normalization options
     * @param transformations Array to track applied transformations
     * @param warnings Array to track warnings
     * @returns Normalized object
     */
    normalizeObject(obj, options, transformations, warnings) {
        const result = {};
        // Process each field
        for (const [key, value] of Object.entries(obj)) {
            // Apply custom transformation if available
            if (options.customTransformations && options.customTransformations[key]) {
                try {
                    result[key] = options.customTransformations[key](value);
                    transformations.push(`Applied custom transformation to field '${key}'`);
                }
                catch (error) {
                    result[key] = value;
                    warnings.push(`Custom transformation failed for field '${key}': ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
                continue;
            }
            // Handle null values
            if (value === null || value === undefined) {
                if (options.handleNulls === 'remove') {
                    transformations.push(`Removed null value for field '${key}'`);
                    continue;
                }
                else if (options.handleNulls === 'replace' && options.nullReplacement !== undefined) {
                    result[key] = options.nullReplacement;
                    transformations.push(`Replaced null value for field '${key}' with default value`);
                    continue;
                }
                else {
                    result[key] = value;
                    continue;
                }
            }
            // Process based on value type
            if (typeof value === 'string') {
                result[key] = this.normalizeString(value, key, options, transformations);
            }
            else if (value instanceof Date) {
                result[key] = this.normalizeDate(value, key, options, transformations);
            }
            else if (typeof value === 'number') {
                result[key] = this.normalizeNumber(value, key, options, transformations);
            }
            else if (Array.isArray(value)) {
                result[key] = value.map(item => {
                    if (typeof item === 'object' && item !== null) {
                        return this.normalizeObject(item, options, transformations, warnings);
                    }
                    return item;
                });
            }
            else if (typeof value === 'object') {
                result[key] = this.normalizeObject(value, options, transformations, warnings);
            }
            else {
                result[key] = value;
            }
        }
        return result;
    }
    /**
     * Normalize a string value
     * @param value The string to normalize
     * @param fieldName The name of the field
     * @param options Normalization options
     * @param transformations Array to track applied transformations
     * @returns Normalized string
     */
    normalizeString(value, fieldName, options, transformations) {
        let result = value;
        // Trim whitespace
        if (options.trimWhitespace) {
            const oldLength = result.length;
            result = result.trim();
            if (oldLength !== result.length) {
                transformations.push(`Trimmed whitespace from field '${fieldName}'`);
            }
        }
        // Remove special characters
        if (options.removeSpecialChars) {
            const oldValue = result;
            result = result.replace(/[^\w\s]/gi, '');
            if (oldValue !== result) {
                transformations.push(`Removed special characters from field '${fieldName}'`);
            }
        }
        // Apply text case transformation
        if (options.textCase) {
            const oldValue = result;
            switch (options.textCase) {
                case 'upper':
                    result = result.toUpperCase();
                    break;
                case 'lower':
                    result = result.toLowerCase();
                    break;
                case 'title':
                    result = result
                        .toLowerCase()
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                    break;
            }
            if (oldValue !== result) {
                transformations.push(`Applied ${options.textCase} case to field '${fieldName}'`);
            }
        }
        return result;
    }
    /**
     * Normalize a date value
     * @param value The date to normalize
     * @param fieldName The name of the field
     * @param options Normalization options
     * @param transformations Array to track applied transformations
     * @returns Normalized date
     */
    normalizeDate(value, fieldName, options, transformations) {
        // Format date if format is specified
        if (options.dateFormat) {
            transformations.push(`Formatted date field '${fieldName}' to ${options.dateFormat}`);
            // This is a simplified implementation - would use a proper date formatting library
            return value.toISOString();
        }
        return value;
    }
    /**
     * Normalize a number value
     * @param value The number to normalize
     * @param fieldName The name of the field
     * @param options Normalization options
     * @param transformations Array to track applied transformations
     * @returns Normalized number
     */
    normalizeNumber(value, fieldName, options, transformations) {
        // Format number if format is specified
        if (options.numberFormat) {
            transformations.push(`Formatted number field '${fieldName}' to ${options.numberFormat}`);
            // This is a simplified implementation - would use a proper number formatting library
            return value.toString();
        }
        return value;
    }
}
exports.ProprietaryDataService = ProprietaryDataService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcHJpZXRhcnktZGF0YS1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3NlcnZpY2VzL3Byb3ByaWV0YXJ5LWRhdGEtc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7OztBQWNILHNDQUE4RDtBQUM5RCwrQkFBb0M7QUFFcEM7O0dBRUc7QUFDSCxNQUFhLHNCQUFzQjtJQUlqQyxZQUFZLFVBQWtCO1FBQzVCLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1FBQzdCLG1FQUFtRTtRQUNuRSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztJQUN2QixDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSCxLQUFLLENBQUMsVUFBVSxDQUNkLElBQVUsRUFDVixRQUFzQixFQUN0QixNQUFjLEVBQ2QsY0FBc0IsRUFDdEIsYUFBNEI7UUFFNUIsSUFBSTtZQUNGLGdCQUFnQjtZQUNoQixNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRTtnQkFDM0IsT0FBTztvQkFDTCxPQUFPLEVBQUUsS0FBSztvQkFDZCxLQUFLLEVBQUUsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO29CQUM3RCxnQkFBZ0IsRUFBRSxRQUFRO2lCQUMzQixDQUFDO2FBQ0g7WUFFRCxrQ0FBa0M7WUFDbEMsTUFBTSxVQUFVLEdBQUcsSUFBQSxTQUFNLEdBQUUsQ0FBQztZQUU1QixzQkFBc0I7WUFDdEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVuRCxxQkFBcUI7WUFDckIsTUFBTSxVQUFVLEdBQUcsR0FB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Q3pGLHFGQUFxRjtZQUNyRixPQUFPLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztTQUN6QjtRQUVELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztDQUNGO0FBMXJCRCx3REEwckJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBTZXJ2aWNlIGZvciBoYW5kbGluZyBwcm9wcmlldGFyeSBkYXRhIGludGVncmF0aW9uXG4gKi9cblxuaW1wb3J0IHsgXG4gIERhdGFNZXRhZGF0YSwgXG4gIEtub3dsZWRnZVNlcnZpY2UsIFxuICBVcGxvYWRSZXN1bHQgXG59IGZyb20gJy4uL21vZGVscy9zZXJ2aWNlcyc7XG5pbXBvcnQge1xuICBQcm9wcmlldGFyeURhdGFGaWxlLFxuICBEYXRhRXh0cmFjdGlvblJlc3VsdCxcbiAgTm9ybWFsaXphdGlvbk9wdGlvbnMsXG4gIE5vcm1hbGl6YXRpb25SZXN1bHQsXG4gIEFjY2Vzc0NvbnRyb2xcbn0gZnJvbSAnLi4vbW9kZWxzL3Byb3ByaWV0YXJ5LWRhdGEnO1xuaW1wb3J0IHsgVmFsaWRhdGlvbkVycm9yLCBWYWxpZGF0aW9uUmVzdWx0IH0gZnJvbSAnLi4vbW9kZWxzJztcbmltcG9ydCB7IHY0IGFzIHV1aWR2NCB9IGZyb20gJ3V1aWQnO1xuXG4vKipcbiAqIFNlcnZpY2UgZm9yIGhhbmRsaW5nIHByb3ByaWV0YXJ5IGRhdGEgaW50ZWdyYXRpb25cbiAqL1xuZXhwb3J0IGNsYXNzIFByb3ByaWV0YXJ5RGF0YVNlcnZpY2Uge1xuICBwcml2YXRlIHMzQ2xpZW50OiBhbnk7IC8vIFdpbGwgYmUgcmVwbGFjZWQgd2l0aCBhY3R1YWwgQVdTIFNESyBTMyBjbGllbnRcbiAgcHJpdmF0ZSBidWNrZXROYW1lOiBzdHJpbmc7XG4gIFxuICBjb25zdHJ1Y3RvcihidWNrZXROYW1lOiBzdHJpbmcpIHtcbiAgICB0aGlzLmJ1Y2tldE5hbWUgPSBidWNrZXROYW1lO1xuICAgIC8vIEluaXRpYWxpemUgUzMgY2xpZW50IC0gd2lsbCBiZSBpbXBsZW1lbnRlZCB3aGVuIEFXUyBTREsgaXMgYWRkZWRcbiAgICB0aGlzLnMzQ2xpZW50ID0gbnVsbDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFVwbG9hZCBhIGZpbGUgdG8gdGhlIHByb3ByaWV0YXJ5IGRhdGEgc3RvcmFnZVxuICAgKiBAcGFyYW0gZmlsZSBUaGUgZmlsZSB0byB1cGxvYWRcbiAgICogQHBhcmFtIG1ldGFkYXRhIE1ldGFkYXRhIGFib3V0IHRoZSBmaWxlXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIElEIG9mIHRoZSB1c2VyIHVwbG9hZGluZyB0aGUgZmlsZVxuICAgKiBAcGFyYW0gb3JnYW5pemF0aW9uSWQgVGhlIElEIG9mIHRoZSBvcmdhbml6YXRpb24gdGhlIHVzZXIgYmVsb25ncyB0b1xuICAgKiBAcGFyYW0gYWNjZXNzQ29udHJvbCBBY2Nlc3MgY29udHJvbCBzZXR0aW5ncyBmb3IgdGhlIGZpbGVcbiAgICogQHJldHVybnMgVXBsb2FkIHJlc3VsdCB3aXRoIHN0YXR1cyBhbmQgZG9jdW1lbnQgSURcbiAgICovXG4gIGFzeW5jIHVwbG9hZEZpbGUoXG4gICAgZmlsZTogRmlsZSwgXG4gICAgbWV0YWRhdGE6IERhdGFNZXRhZGF0YSwgXG4gICAgdXNlcklkOiBzdHJpbmcsIFxuICAgIG9yZ2FuaXphdGlvbklkOiBzdHJpbmcsXG4gICAgYWNjZXNzQ29udHJvbDogQWNjZXNzQ29udHJvbFxuICApOiBQcm9taXNlPFVwbG9hZFJlc3VsdD4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBWYWxpZGF0ZSBmaWxlXG4gICAgICBjb25zdCB2YWxpZGF0aW9uUmVzdWx0ID0gdGhpcy52YWxpZGF0ZUZpbGUoZmlsZSk7XG4gICAgICBpZiAoIXZhbGlkYXRpb25SZXN1bHQudmFsaWQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICBlcnJvcjogdmFsaWRhdGlvblJlc3VsdC5lcnJvcnMubWFwKGUgPT4gZS5tZXNzYWdlKS5qb2luKCcsICcpLFxuICAgICAgICAgIHByb2Nlc3NpbmdTdGF0dXM6ICdmYWlsZWQnXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIEdlbmVyYXRlIHVuaXF1ZSBJRCBmb3IgdGhlIGZpbGVcbiAgICAgIGNvbnN0IGRvY3VtZW50SWQgPSB1dWlkdjQoKTtcbiAgICAgIFxuICAgICAgLy8gRGV0ZXJtaW5lIGZpbGUgdHlwZVxuICAgICAgY29uc3QgZmlsZVR5cGUgPSB0aGlzLmRldGVybWluZUZpbGVUeXBlKGZpbGUubmFtZSk7XG4gICAgICBcbiAgICAgIC8vIENyZWF0ZSBzdG9yYWdlIGtleVxuICAgICAgY29uc3Qgc3RvcmFnZUtleSA9IGAke29yZ2FuaXphdGlvbklkfS8ke3VzZXJJZH0vJHtkb2N1bWVudElkfS8ke2ZpbGUubmFtZX1gO1xuICAgICAgXG4gICAgICAvLyBDcmVhdGUgcHJvcHJpZXRhcnkgZGF0YSBmaWxlIHJlY29yZFxuICAgICAgY29uc3QgZGF0YUZpbGU6IFByb3ByaWV0YXJ5RGF0YUZpbGUgPSB7XG4gICAgICAgIGlkOiBkb2N1bWVudElkLFxuICAgICAgICBmaWxlTmFtZTogZmlsZS5uYW1lLFxuICAgICAgICBmaWxlU2l6ZTogZmlsZS5zaXplLFxuICAgICAgICBmaWxlVHlwZSxcbiAgICAgICAgdXBsb2FkRGF0ZTogbmV3IERhdGUoKSxcbiAgICAgICAgdXNlcklkLFxuICAgICAgICBvcmdhbml6YXRpb25JZCxcbiAgICAgICAgbWV0YWRhdGEsXG4gICAgICAgIHN0YXR1czogJ3VwbG9hZGVkJyxcbiAgICAgICAgYWNjZXNzQ29udHJvbCxcbiAgICAgICAgc3RvcmFnZUxvY2F0aW9uOiBzdG9yYWdlS2V5XG4gICAgICB9O1xuICAgICAgXG4gICAgICAvLyBVcGxvYWQgdG8gUzMgKG1vY2sgaW1wbGVtZW50YXRpb24gZm9yIG5vdylcbiAgICAgIC8vIGF3YWl0IHRoaXMudXBsb2FkVG9TMyhmaWxlLCBzdG9yYWdlS2V5KTtcbiAgICAgIFxuICAgICAgLy8gU3RvcmUgbWV0YWRhdGEgaW4gZGF0YWJhc2UgKG1vY2sgaW1wbGVtZW50YXRpb24gZm9yIG5vdylcbiAgICAgIC8vIGF3YWl0IHRoaXMuc3RvcmVNZXRhZGF0YShkYXRhRmlsZSk7XG4gICAgICBcbiAgICAgIC8vIFF1ZXVlIGZpbGUgZm9yIHByb2Nlc3NpbmdcbiAgICAgIHRoaXMucXVldWVGaWxlRm9yUHJvY2Vzc2luZyhkb2N1bWVudElkKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgZG9jdW1lbnRJZCxcbiAgICAgICAgcHJvY2Vzc2luZ1N0YXR1czogJ3F1ZXVlZCdcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHVwbG9hZGluZyBmaWxlOicsIGVycm9yKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvciBvY2N1cnJlZCcsXG4gICAgICAgIHByb2Nlc3NpbmdTdGF0dXM6ICdmYWlsZWQnXG4gICAgICB9O1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIFByb2Nlc3MgYSBmaWxlIHRoYXQgaGFzIGJlZW4gdXBsb2FkZWRcbiAgICogQHBhcmFtIGRvY3VtZW50SWQgVGhlIElEIG9mIHRoZSBkb2N1bWVudCB0byBwcm9jZXNzXG4gICAqIEByZXR1cm5zIFByb2Nlc3NpbmcgcmVzdWx0XG4gICAqL1xuICBhc3luYyBwcm9jZXNzRmlsZShkb2N1bWVudElkOiBzdHJpbmcpOiBQcm9taXNlPFVwbG9hZFJlc3VsdD4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBSZXRyaWV2ZSBmaWxlIG1ldGFkYXRhIChtb2NrIGltcGxlbWVudGF0aW9uKVxuICAgICAgY29uc3QgZGF0YUZpbGUgPSBhd2FpdCB0aGlzLmdldEZpbGVNZXRhZGF0YShkb2N1bWVudElkKTtcbiAgICAgIFxuICAgICAgaWYgKCFkYXRhRmlsZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiAnRmlsZSBub3QgZm91bmQnLFxuICAgICAgICAgIHByb2Nlc3NpbmdTdGF0dXM6ICdmYWlsZWQnXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIFVwZGF0ZSBzdGF0dXMgdG8gcHJvY2Vzc2luZ1xuICAgICAgYXdhaXQgdGhpcy51cGRhdGVGaWxlU3RhdHVzKGRvY3VtZW50SWQsICdwcm9jZXNzaW5nJyk7XG4gICAgICBcbiAgICAgIC8vIEV4dHJhY3QgZGF0YSBmcm9tIGZpbGUgYmFzZWQgb24gZmlsZSB0eXBlXG4gICAgICBjb25zdCBleHRyYWN0aW9uUmVzdWx0ID0gYXdhaXQgdGhpcy5leHRyYWN0RGF0YShkYXRhRmlsZSk7XG4gICAgICBcbiAgICAgIGlmICghZXh0cmFjdGlvblJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgIGF3YWl0IHRoaXMudXBkYXRlRmlsZVN0YXR1cyhkb2N1bWVudElkLCAnZmFpbGVkJywgZXh0cmFjdGlvblJlc3VsdC5lcnJvcik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgZG9jdW1lbnRJZCxcbiAgICAgICAgICBlcnJvcjogZXh0cmFjdGlvblJlc3VsdC5lcnJvcixcbiAgICAgICAgICBwcm9jZXNzaW5nU3RhdHVzOiAnZmFpbGVkJ1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBTdG9yZSBleHRyYWN0ZWQgZGF0YVxuICAgICAgYXdhaXQgdGhpcy5zdG9yZUV4dHJhY3RlZERhdGEoZG9jdW1lbnRJZCwgZXh0cmFjdGlvblJlc3VsdC5leHRyYWN0ZWREYXRhKTtcbiAgICAgIFxuICAgICAgLy8gVXBkYXRlIHN0YXR1cyB0byBwcm9jZXNzZWRcbiAgICAgIGF3YWl0IHRoaXMudXBkYXRlRmlsZVN0YXR1cyhkb2N1bWVudElkLCAncHJvY2Vzc2VkJyk7XG4gICAgICBcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIGRvY3VtZW50SWQsXG4gICAgICAgIHByb2Nlc3NpbmdTdGF0dXM6ICdjb21wbGV0ZWQnLFxuICAgICAgICBwcm9jZXNzaW5nVGltZTogZXh0cmFjdGlvblJlc3VsdC5wcm9jZXNzaW5nVGltZVxuICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgcHJvY2Vzc2luZyBmaWxlOicsIGVycm9yKTtcbiAgICAgIGF3YWl0IHRoaXMudXBkYXRlRmlsZVN0YXR1cyhkb2N1bWVudElkLCAnZmFpbGVkJywgZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGRvY3VtZW50SWQsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yIG9jY3VycmVkJyxcbiAgICAgICAgcHJvY2Vzc2luZ1N0YXR1czogJ2ZhaWxlZCdcbiAgICAgIH07XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogTm9ybWFsaXplIGRhdGEgYWNjb3JkaW5nIHRvIHNwZWNpZmllZCBvcHRpb25zXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBkYXRhIHRvIG5vcm1hbGl6ZVxuICAgKiBAcGFyYW0gb3B0aW9ucyBOb3JtYWxpemF0aW9uIG9wdGlvbnNcbiAgICogQHJldHVybnMgTm9ybWFsaXplZCBkYXRhIHJlc3VsdFxuICAgKi9cbiAgYXN5bmMgbm9ybWFsaXplRGF0YShkYXRhOiBhbnksIG9wdGlvbnM6IE5vcm1hbGl6YXRpb25PcHRpb25zKTogUHJvbWlzZTxOb3JtYWxpemF0aW9uUmVzdWx0PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHRyYW5zZm9ybWF0aW9uczogc3RyaW5nW10gPSBbXTtcbiAgICAgIGNvbnN0IHdhcm5pbmdzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgbGV0IG5vcm1hbGl6ZWREYXRhID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShkYXRhKSk7IC8vIERlZXAgY29weVxuICAgICAgXG4gICAgICAvLyBIYW5kbGUgZGlmZmVyZW50IGRhdGEgdHlwZXNcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KG5vcm1hbGl6ZWREYXRhKSkge1xuICAgICAgICAvLyBBcnJheSBvZiBvYmplY3RzICh0YWJ1bGFyIGRhdGEpXG4gICAgICAgIG5vcm1hbGl6ZWREYXRhID0gdGhpcy5ub3JtYWxpemVUYWJ1bGFyRGF0YShub3JtYWxpemVkRGF0YSwgb3B0aW9ucywgdHJhbnNmb3JtYXRpb25zLCB3YXJuaW5ncyk7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBub3JtYWxpemVkRGF0YSA9PT0gJ29iamVjdCcgJiYgbm9ybWFsaXplZERhdGEgIT09IG51bGwpIHtcbiAgICAgICAgLy8gU2luZ2xlIG9iamVjdFxuICAgICAgICBub3JtYWxpemVkRGF0YSA9IHRoaXMubm9ybWFsaXplT2JqZWN0KG5vcm1hbGl6ZWREYXRhLCBvcHRpb25zLCB0cmFuc2Zvcm1hdGlvbnMsIHdhcm5pbmdzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgbm9ybWFsaXplZERhdGE6IGRhdGEsXG4gICAgICAgICAgdHJhbnNmb3JtYXRpb25zOiBbXSxcbiAgICAgICAgICB3YXJuaW5nczogWydVbnN1cHBvcnRlZCBkYXRhIGZvcm1hdCBmb3Igbm9ybWFsaXphdGlvbiddLFxuICAgICAgICAgIGVycm9yOiAnVW5zdXBwb3J0ZWQgZGF0YSBmb3JtYXQnXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIG5vcm1hbGl6ZWREYXRhLFxuICAgICAgICB0cmFuc2Zvcm1hdGlvbnMsXG4gICAgICAgIHdhcm5pbmdzXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBub3JtYWxpemluZyBkYXRhOicsIGVycm9yKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBub3JtYWxpemVkRGF0YTogZGF0YSxcbiAgICAgICAgdHJhbnNmb3JtYXRpb25zOiBbXSxcbiAgICAgICAgd2FybmluZ3M6IFtdLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvciBvY2N1cnJlZCdcbiAgICAgIH07XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGEgbGlzdCBvZiBwcm9wcmlldGFyeSBkYXRhIGZpbGVzIGZvciBhIHVzZXJcbiAgICogQHBhcmFtIHVzZXJJZCBUaGUgSUQgb2YgdGhlIHVzZXJcbiAgICogQHBhcmFtIG9yZ2FuaXphdGlvbklkIFRoZSBJRCBvZiB0aGUgb3JnYW5pemF0aW9uXG4gICAqIEByZXR1cm5zIExpc3Qgb2YgcHJvcHJpZXRhcnkgZGF0YSBmaWxlc1xuICAgKi9cbiAgYXN5bmMgbGlzdEZpbGVzKHVzZXJJZDogc3RyaW5nLCBvcmdhbml6YXRpb25JZDogc3RyaW5nKTogUHJvbWlzZTxQcm9wcmlldGFyeURhdGFGaWxlW10+IHtcbiAgICAvLyBNb2NrIGltcGxlbWVudGF0aW9uIC0gd2lsbCBiZSByZXBsYWNlZCB3aXRoIGFjdHVhbCBkYXRhYmFzZSBxdWVyeVxuICAgIHJldHVybiBbXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIHByb3ByaWV0YXJ5IGRhdGEgZmlsZSBieSBJRFxuICAgKiBAcGFyYW0gZG9jdW1lbnRJZCBUaGUgSUQgb2YgdGhlIGRvY3VtZW50XG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIElEIG9mIHRoZSB1c2VyIHJlcXVlc3RpbmcgdGhlIGZpbGVcbiAgICogQHJldHVybnMgVGhlIHByb3ByaWV0YXJ5IGRhdGEgZmlsZSBpZiBmb3VuZCBhbmQgYWNjZXNzaWJsZVxuICAgKi9cbiAgYXN5bmMgZ2V0RmlsZShkb2N1bWVudElkOiBzdHJpbmcsIHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxQcm9wcmlldGFyeURhdGFGaWxlIHwgbnVsbD4ge1xuICAgIC8vIE1vY2sgaW1wbGVtZW50YXRpb24gLSB3aWxsIGJlIHJlcGxhY2VkIHdpdGggYWN0dWFsIGRhdGFiYXNlIHF1ZXJ5XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZWxldGUgYSBwcm9wcmlldGFyeSBkYXRhIGZpbGVcbiAgICogQHBhcmFtIGRvY3VtZW50SWQgVGhlIElEIG9mIHRoZSBkb2N1bWVudCB0byBkZWxldGVcbiAgICogQHBhcmFtIHVzZXJJZCBUaGUgSUQgb2YgdGhlIHVzZXIgcmVxdWVzdGluZyBkZWxldGlvblxuICAgKiBAcmV0dXJucyBUcnVlIGlmIGRlbGV0aW9uIHdhcyBzdWNjZXNzZnVsXG4gICAqL1xuICBhc3luYyBkZWxldGVGaWxlKGRvY3VtZW50SWQ6IHN0cmluZywgdXNlcklkOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgLy8gQ2hlY2sgaWYgZmlsZSBleGlzdHMgYW5kIHVzZXIgaGFzIHBlcm1pc3Npb25cbiAgICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmdldEZpbGUoZG9jdW1lbnRJZCwgdXNlcklkKTtcbiAgICAgIFxuICAgICAgaWYgKCFmaWxlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gQ2hlY2sgaWYgdXNlciBoYXMgcGVybWlzc2lvbiB0byBkZWxldGVcbiAgICAgIGlmIChmaWxlLnVzZXJJZCAhPT0gdXNlcklkKSB7XG4gICAgICAgIC8vIENoZWNrIGlmIHVzZXIgaGFzIGFkbWluIHJvbGUgb3Igb3RoZXIgcGVybWlzc2lvblxuICAgICAgICAvLyBUaGlzIHdvdWxkIGJlIGltcGxlbWVudGVkIGJhc2VkIG9uIHRoZSBhcHBsaWNhdGlvbidzIHBlcm1pc3Npb24gc3lzdGVtXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gRGVsZXRlIGZyb20gUzMgKG1vY2sgaW1wbGVtZW50YXRpb24pXG4gICAgICAvLyBhd2FpdCB0aGlzLmRlbGV0ZUZyb21TMyhmaWxlLnN0b3JhZ2VMb2NhdGlvbik7XG4gICAgICBcbiAgICAgIC8vIERlbGV0ZSBtZXRhZGF0YSBmcm9tIGRhdGFiYXNlIChtb2NrIGltcGxlbWVudGF0aW9uKVxuICAgICAgLy8gYXdhaXQgdGhpcy5kZWxldGVNZXRhZGF0YShkb2N1bWVudElkKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGRlbGV0aW5nIGZpbGU6JywgZXJyb3IpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIFVwZGF0ZSBhY2Nlc3MgY29udHJvbCBmb3IgYSBmaWxlXG4gICAqIEBwYXJhbSBkb2N1bWVudElkIFRoZSBJRCBvZiB0aGUgZG9jdW1lbnRcbiAgICogQHBhcmFtIHVzZXJJZCBUaGUgSUQgb2YgdGhlIHVzZXIgcmVxdWVzdGluZyB0aGUgdXBkYXRlXG4gICAqIEBwYXJhbSBhY2Nlc3NDb250cm9sIE5ldyBhY2Nlc3MgY29udHJvbCBzZXR0aW5nc1xuICAgKiBAcmV0dXJucyBUcnVlIGlmIHVwZGF0ZSB3YXMgc3VjY2Vzc2Z1bFxuICAgKi9cbiAgYXN5bmMgdXBkYXRlQWNjZXNzQ29udHJvbChcbiAgICBkb2N1bWVudElkOiBzdHJpbmcsIFxuICAgIHVzZXJJZDogc3RyaW5nLCBcbiAgICBhY2Nlc3NDb250cm9sOiBBY2Nlc3NDb250cm9sXG4gICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBDaGVjayBpZiBmaWxlIGV4aXN0cyBhbmQgdXNlciBoYXMgcGVybWlzc2lvblxuICAgICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuZ2V0RmlsZShkb2N1bWVudElkLCB1c2VySWQpO1xuICAgICAgXG4gICAgICBpZiAoIWZpbGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBDaGVjayBpZiB1c2VyIGhhcyBwZXJtaXNzaW9uIHRvIHVwZGF0ZVxuICAgICAgaWYgKGZpbGUudXNlcklkICE9PSB1c2VySWQpIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgdXNlciBoYXMgYWRtaW4gcm9sZSBvciBvdGhlciBwZXJtaXNzaW9uXG4gICAgICAgIC8vIFRoaXMgd291bGQgYmUgaW1wbGVtZW50ZWQgYmFzZWQgb24gdGhlIGFwcGxpY2F0aW9uJ3MgcGVybWlzc2lvbiBzeXN0ZW1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBVcGRhdGUgYWNjZXNzIGNvbnRyb2wgaW4gZGF0YWJhc2UgKG1vY2sgaW1wbGVtZW50YXRpb24pXG4gICAgICAvLyBhd2FpdCB0aGlzLnVwZGF0ZUZpbGVBY2Nlc3NDb250cm9sKGRvY3VtZW50SWQsIGFjY2Vzc0NvbnRyb2wpO1xuICAgICAgXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgdXBkYXRpbmcgYWNjZXNzIGNvbnRyb2w6JywgZXJyb3IpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gUHJpdmF0ZSBoZWxwZXIgbWV0aG9kc1xuICBcbiAgLyoqXG4gICAqIFZhbGlkYXRlIGEgZmlsZSBiZWZvcmUgdXBsb2FkXG4gICAqIEBwYXJhbSBmaWxlIFRoZSBmaWxlIHRvIHZhbGlkYXRlXG4gICAqIEByZXR1cm5zIFZhbGlkYXRpb24gcmVzdWx0XG4gICAqL1xuICBwcml2YXRlIHZhbGlkYXRlRmlsZShmaWxlOiBGaWxlKTogVmFsaWRhdGlvblJlc3VsdCB7XG4gICAgY29uc3QgZXJyb3JzOiBWYWxpZGF0aW9uRXJyb3JbXSA9IFtdO1xuICAgIFxuICAgIC8vIENoZWNrIGZpbGUgc2l6ZSAobWF4IDEwME1CKVxuICAgIGNvbnN0IG1heFNpemUgPSAxMDAgKiAxMDI0ICogMTAyNDsgLy8gMTAwTUIgaW4gYnl0ZXNcbiAgICBpZiAoZmlsZS5zaXplID4gbWF4U2l6ZSkge1xuICAgICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcignRmlsZSBzaXplIGV4Y2VlZHMgbWF4aW11bSBhbGxvd2VkICgxMDBNQiknLCAnZmlsZVNpemUnLCAnSU5WQUxJRF9TSVpFJykpO1xuICAgIH1cbiAgICBcbiAgICAvLyBDaGVjayBmaWxlIHR5cGVcbiAgICBjb25zdCBmaWxlVHlwZSA9IHRoaXMuZGV0ZXJtaW5lRmlsZVR5cGUoZmlsZS5uYW1lKTtcbiAgICBpZiAoZmlsZVR5cGUgPT09ICdvdGhlcicpIHtcbiAgICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1Vuc3VwcG9ydGVkIGZpbGUgdHlwZS4gU3VwcG9ydGVkIHR5cGVzOiBDU1YsIFBERiwgRXhjZWwsIEpTT04nLCAnZmlsZVR5cGUnLCAnSU5WQUxJRF9UWVBFJykpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgdmFsaWQ6IGVycm9ycy5sZW5ndGggPT09IDAsXG4gICAgICBlcnJvcnNcbiAgICB9O1xuICB9XG4gIFxuICAvKipcbiAgICogRGV0ZXJtaW5lIGZpbGUgdHlwZSBmcm9tIGZpbGUgbmFtZVxuICAgKiBAcGFyYW0gZmlsZU5hbWUgVGhlIG5hbWUgb2YgdGhlIGZpbGVcbiAgICogQHJldHVybnMgVGhlIGZpbGUgdHlwZVxuICAgKi9cbiAgcHJpdmF0ZSBkZXRlcm1pbmVGaWxlVHlwZShmaWxlTmFtZTogc3RyaW5nKTogJ2NzdicgfCAncGRmJyB8ICdleGNlbCcgfCAnanNvbicgfCAnb3RoZXInIHtcbiAgICBjb25zdCBleHRlbnNpb24gPSBmaWxlTmFtZS5zcGxpdCgnLicpLnBvcCgpPy50b0xvd2VyQ2FzZSgpIHx8ICcnO1xuICAgIFxuICAgIHN3aXRjaCAoZXh0ZW5zaW9uKSB7XG4gICAgICBjYXNlICdjc3YnOlxuICAgICAgICByZXR1cm4gJ2Nzdic7XG4gICAgICBjYXNlICdwZGYnOlxuICAgICAgICByZXR1cm4gJ3BkZic7XG4gICAgICBjYXNlICd4bHMnOlxuICAgICAgY2FzZSAneGxzeCc6XG4gICAgICAgIHJldHVybiAnZXhjZWwnO1xuICAgICAgY2FzZSAnanNvbic6XG4gICAgICAgIHJldHVybiAnanNvbic7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gJ290aGVyJztcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBRdWV1ZSBhIGZpbGUgZm9yIHByb2Nlc3NpbmdcbiAgICogQHBhcmFtIGRvY3VtZW50SWQgVGhlIElEIG9mIHRoZSBkb2N1bWVudCB0byBwcm9jZXNzXG4gICAqL1xuICBwcml2YXRlIHF1ZXVlRmlsZUZvclByb2Nlc3NpbmcoZG9jdW1lbnRJZDogc3RyaW5nKTogdm9pZCB7XG4gICAgLy8gSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB0aGlzIHdvdWxkIGFkZCB0aGUgZmlsZSB0byBhIHF1ZXVlIChTUVMsIGV0Yy4pXG4gICAgLy8gRm9yIG5vdywgd2UnbGwganVzdCBwcm9jZXNzIGl0IGltbWVkaWF0ZWx5XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLnByb2Nlc3NGaWxlKGRvY3VtZW50SWQpLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgcHJvY2Vzc2luZyBmaWxlOicsIGVycm9yKTtcbiAgICAgIH0pO1xuICAgIH0sIDEwMCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgZmlsZSBtZXRhZGF0YSBmcm9tIHRoZSBkYXRhYmFzZVxuICAgKiBAcGFyYW0gZG9jdW1lbnRJZCBUaGUgSUQgb2YgdGhlIGRvY3VtZW50XG4gICAqIEByZXR1cm5zIFRoZSBmaWxlIG1ldGFkYXRhIGlmIGZvdW5kXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGdldEZpbGVNZXRhZGF0YShkb2N1bWVudElkOiBzdHJpbmcpOiBQcm9taXNlPFByb3ByaWV0YXJ5RGF0YUZpbGUgfCBudWxsPiB7XG4gICAgLy8gTW9jayBpbXBsZW1lbnRhdGlvbiAtIHdpbGwgYmUgcmVwbGFjZWQgd2l0aCBhY3R1YWwgZGF0YWJhc2UgcXVlcnlcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFVwZGF0ZSBmaWxlIHN0YXR1cyBpbiB0aGUgZGF0YWJhc2VcbiAgICogQHBhcmFtIGRvY3VtZW50SWQgVGhlIElEIG9mIHRoZSBkb2N1bWVudFxuICAgKiBAcGFyYW0gc3RhdHVzIFRoZSBuZXcgc3RhdHVzXG4gICAqIEBwYXJhbSBlcnJvciBPcHRpb25hbCBlcnJvciBtZXNzYWdlXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHVwZGF0ZUZpbGVTdGF0dXMoXG4gICAgZG9jdW1lbnRJZDogc3RyaW5nLCBcbiAgICBzdGF0dXM6ICd1cGxvYWRlZCcgfCAncHJvY2Vzc2luZycgfCAncHJvY2Vzc2VkJyB8ICdmYWlsZWQnLFxuICAgIGVycm9yPzogc3RyaW5nXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIE1vY2sgaW1wbGVtZW50YXRpb24gLSB3aWxsIGJlIHJlcGxhY2VkIHdpdGggYWN0dWFsIGRhdGFiYXNlIHVwZGF0ZVxuICB9XG4gIFxuICAvKipcbiAgICogRXh0cmFjdCBkYXRhIGZyb20gYSBmaWxlXG4gICAqIEBwYXJhbSBkYXRhRmlsZSBUaGUgZmlsZSBtZXRhZGF0YVxuICAgKiBAcmV0dXJucyBFeHRyYWN0aW9uIHJlc3VsdFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBleHRyYWN0RGF0YShkYXRhRmlsZTogUHJvcHJpZXRhcnlEYXRhRmlsZSk6IFByb21pc2U8RGF0YUV4dHJhY3Rpb25SZXN1bHQ+IHtcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICAvLyBNb2NrIGltcGxlbWVudGF0aW9uIC0gd2lsbCBiZSByZXBsYWNlZCB3aXRoIGFjdHVhbCBleHRyYWN0aW9uIGxvZ2ljXG4gICAgICAvLyBEaWZmZXJlbnQgZXh0cmFjdGlvbiBtZXRob2RzIGJhc2VkIG9uIGZpbGUgdHlwZVxuICAgICAgc3dpdGNoIChkYXRhRmlsZS5maWxlVHlwZSkge1xuICAgICAgICBjYXNlICdjc3YnOlxuICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmV4dHJhY3RGcm9tQ1NWKGRhdGFGaWxlKTtcbiAgICAgICAgY2FzZSAncGRmJzpcbiAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5leHRyYWN0RnJvbVBERihkYXRhRmlsZSk7XG4gICAgICAgIGNhc2UgJ2V4Y2VsJzpcbiAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5leHRyYWN0RnJvbUV4Y2VsKGRhdGFGaWxlKTtcbiAgICAgICAgY2FzZSAnanNvbic6XG4gICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZXh0cmFjdEZyb21KU09OKGRhdGFGaWxlKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ3Vua25vd24nLFxuICAgICAgICAgICAgZXJyb3I6ICdVbnN1cHBvcnRlZCBmaWxlIHR5cGUnLFxuICAgICAgICAgICAgcHJvY2Vzc2luZ1RpbWU6IERhdGUubm93KCkgLSBzdGFydFRpbWUsXG4gICAgICAgICAgICBleHRyYWN0aW9uTWV0aG9kOiAnbm9uZSdcbiAgICAgICAgICB9O1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZGF0YVR5cGU6ICd1bmtub3duJyxcbiAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3Igb2NjdXJyZWQnLFxuICAgICAgICBwcm9jZXNzaW5nVGltZTogRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSxcbiAgICAgICAgZXh0cmFjdGlvbk1ldGhvZDogJ2ZhaWxlZCdcbiAgICAgIH07XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogRXh0cmFjdCBkYXRhIGZyb20gYSBDU1YgZmlsZVxuICAgKiBAcGFyYW0gZGF0YUZpbGUgVGhlIGZpbGUgbWV0YWRhdGFcbiAgICogQHJldHVybnMgRXh0cmFjdGlvbiByZXN1bHRcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZXh0cmFjdEZyb21DU1YoZGF0YUZpbGU6IFByb3ByaWV0YXJ5RGF0YUZpbGUpOiBQcm9taXNlPERhdGFFeHRyYWN0aW9uUmVzdWx0PiB7XG4gICAgLy8gTW9jayBpbXBsZW1lbnRhdGlvbiAtIHdpbGwgYmUgcmVwbGFjZWQgd2l0aCBhY3R1YWwgQ1NWIHBhcnNpbmdcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIGRhdGFUeXBlOiAndGFidWxhcicsXG4gICAgICBleHRyYWN0ZWREYXRhOiBbXSxcbiAgICAgIHNjaGVtYToge1xuICAgICAgICBmaWVsZHM6IFtdLFxuICAgICAgICBkYXRhVHlwZXM6IHt9XG4gICAgICB9LFxuICAgICAgcHJvY2Vzc2luZ1RpbWU6IDEwMCxcbiAgICAgIGV4dHJhY3Rpb25NZXRob2Q6ICdjc3YtcGFyc2VyJ1xuICAgIH07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBFeHRyYWN0IGRhdGEgZnJvbSBhIFBERiBmaWxlXG4gICAqIEBwYXJhbSBkYXRhRmlsZSBUaGUgZmlsZSBtZXRhZGF0YVxuICAgKiBAcmV0dXJucyBFeHRyYWN0aW9uIHJlc3VsdFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBleHRyYWN0RnJvbVBERihkYXRhRmlsZTogUHJvcHJpZXRhcnlEYXRhRmlsZSk6IFByb21pc2U8RGF0YUV4dHJhY3Rpb25SZXN1bHQ+IHtcbiAgICAvLyBNb2NrIGltcGxlbWVudGF0aW9uIC0gd2lsbCBiZSByZXBsYWNlZCB3aXRoIGFjdHVhbCBQREYgcGFyc2luZ1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgZGF0YVR5cGU6ICd0ZXh0JyxcbiAgICAgIGV4dHJhY3RlZERhdGE6ICcnLFxuICAgICAgcHJvY2Vzc2luZ1RpbWU6IDIwMCxcbiAgICAgIGV4dHJhY3Rpb25NZXRob2Q6ICdwZGYtcGFyc2VyJ1xuICAgIH07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBFeHRyYWN0IGRhdGEgZnJvbSBhbiBFeGNlbCBmaWxlXG4gICAqIEBwYXJhbSBkYXRhRmlsZSBUaGUgZmlsZSBtZXRhZGF0YVxuICAgKiBAcmV0dXJucyBFeHRyYWN0aW9uIHJlc3VsdFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBleHRyYWN0RnJvbUV4Y2VsKGRhdGFGaWxlOiBQcm9wcmlldGFyeURhdGFGaWxlKTogUHJvbWlzZTxEYXRhRXh0cmFjdGlvblJlc3VsdD4ge1xuICAgIC8vIE1vY2sgaW1wbGVtZW50YXRpb24gLSB3aWxsIGJlIHJlcGxhY2VkIHdpdGggYWN0dWFsIEV4Y2VsIHBhcnNpbmdcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIGRhdGFUeXBlOiAndGFidWxhcicsXG4gICAgICBleHRyYWN0ZWREYXRhOiBbXSxcbiAgICAgIHNjaGVtYToge1xuICAgICAgICBmaWVsZHM6IFtdLFxuICAgICAgICBkYXRhVHlwZXM6IHt9XG4gICAgICB9LFxuICAgICAgcHJvY2Vzc2luZ1RpbWU6IDE1MCxcbiAgICAgIGV4dHJhY3Rpb25NZXRob2Q6ICdleGNlbC1wYXJzZXInXG4gICAgfTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEV4dHJhY3QgZGF0YSBmcm9tIGEgSlNPTiBmaWxlXG4gICAqIEBwYXJhbSBkYXRhRmlsZSBUaGUgZmlsZSBtZXRhZGF0YVxuICAgKiBAcmV0dXJucyBFeHRyYWN0aW9uIHJlc3VsdFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBleHRyYWN0RnJvbUpTT04oZGF0YUZpbGU6IFByb3ByaWV0YXJ5RGF0YUZpbGUpOiBQcm9taXNlPERhdGFFeHRyYWN0aW9uUmVzdWx0PiB7XG4gICAgLy8gTW9jayBpbXBsZW1lbnRhdGlvbiAtIHdpbGwgYmUgcmVwbGFjZWQgd2l0aCBhY3R1YWwgSlNPTiBwYXJzaW5nXG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBkYXRhVHlwZTogJ21peGVkJyxcbiAgICAgIGV4dHJhY3RlZERhdGE6IHt9LFxuICAgICAgcHJvY2Vzc2luZ1RpbWU6IDUwLFxuICAgICAgZXh0cmFjdGlvbk1ldGhvZDogJ2pzb24tcGFyc2VyJ1xuICAgIH07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdG9yZSBleHRyYWN0ZWQgZGF0YSBpbiB0aGUgZGF0YWJhc2VcbiAgICogQHBhcmFtIGRvY3VtZW50SWQgVGhlIElEIG9mIHRoZSBkb2N1bWVudFxuICAgKiBAcGFyYW0gZXh0cmFjdGVkRGF0YSBUaGUgZXh0cmFjdGVkIGRhdGFcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgc3RvcmVFeHRyYWN0ZWREYXRhKGRvY3VtZW50SWQ6IHN0cmluZywgZXh0cmFjdGVkRGF0YTogYW55KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gTW9jayBpbXBsZW1lbnRhdGlvbiAtIHdpbGwgYmUgcmVwbGFjZWQgd2l0aCBhY3R1YWwgZGF0YWJhc2UgdXBkYXRlXG4gIH1cbiAgXG4gIC8qKlxuICAgKiBOb3JtYWxpemUgdGFidWxhciBkYXRhIChhcnJheSBvZiBvYmplY3RzKVxuICAgKiBAcGFyYW0gZGF0YSBUaGUgZGF0YSB0byBub3JtYWxpemVcbiAgICogQHBhcmFtIG9wdGlvbnMgTm9ybWFsaXphdGlvbiBvcHRpb25zXG4gICAqIEBwYXJhbSB0cmFuc2Zvcm1hdGlvbnMgQXJyYXkgdG8gdHJhY2sgYXBwbGllZCB0cmFuc2Zvcm1hdGlvbnNcbiAgICogQHBhcmFtIHdhcm5pbmdzIEFycmF5IHRvIHRyYWNrIHdhcm5pbmdzXG4gICAqIEByZXR1cm5zIE5vcm1hbGl6ZWQgZGF0YVxuICAgKi9cbiAgcHJpdmF0ZSBub3JtYWxpemVUYWJ1bGFyRGF0YShcbiAgICBkYXRhOiBhbnlbXSwgXG4gICAgb3B0aW9uczogTm9ybWFsaXphdGlvbk9wdGlvbnMsXG4gICAgdHJhbnNmb3JtYXRpb25zOiBzdHJpbmdbXSxcbiAgICB3YXJuaW5nczogc3RyaW5nW11cbiAgKTogYW55W10ge1xuICAgIGlmIChkYXRhLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfVxuICAgIFxuICAgIC8vIEdldCBhbGwgdW5pcXVlIGtleXMgZnJvbSBhbGwgb2JqZWN0c1xuICAgIGNvbnN0IGFsbEtleXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBkYXRhLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICBPYmplY3Qua2V5cyhpdGVtKS5mb3JFYWNoKGtleSA9PiBhbGxLZXlzLmFkZChrZXkpKTtcbiAgICB9KTtcbiAgICBcbiAgICAvLyBOb3JtYWxpemUgZWFjaCBvYmplY3RcbiAgICByZXR1cm4gZGF0YS5tYXAoaXRlbSA9PiB0aGlzLm5vcm1hbGl6ZU9iamVjdChpdGVtLCBvcHRpb25zLCB0cmFuc2Zvcm1hdGlvbnMsIHdhcm5pbmdzKSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBOb3JtYWxpemUgYSBzaW5nbGUgb2JqZWN0XG4gICAqIEBwYXJhbSBvYmogVGhlIG9iamVjdCB0byBub3JtYWxpemVcbiAgICogQHBhcmFtIG9wdGlvbnMgTm9ybWFsaXphdGlvbiBvcHRpb25zXG4gICAqIEBwYXJhbSB0cmFuc2Zvcm1hdGlvbnMgQXJyYXkgdG8gdHJhY2sgYXBwbGllZCB0cmFuc2Zvcm1hdGlvbnNcbiAgICogQHBhcmFtIHdhcm5pbmdzIEFycmF5IHRvIHRyYWNrIHdhcm5pbmdzXG4gICAqIEByZXR1cm5zIE5vcm1hbGl6ZWQgb2JqZWN0XG4gICAqL1xuICBwcml2YXRlIG5vcm1hbGl6ZU9iamVjdChcbiAgICBvYmo6IFJlY29yZDxzdHJpbmcsIGFueT4sIFxuICAgIG9wdGlvbnM6IE5vcm1hbGl6YXRpb25PcHRpb25zLFxuICAgIHRyYW5zZm9ybWF0aW9uczogc3RyaW5nW10sXG4gICAgd2FybmluZ3M6IHN0cmluZ1tdXG4gICk6IFJlY29yZDxzdHJpbmcsIGFueT4ge1xuICAgIGNvbnN0IHJlc3VsdDogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xuICAgIFxuICAgIC8vIFByb2Nlc3MgZWFjaCBmaWVsZFxuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKG9iaikpIHtcbiAgICAgIC8vIEFwcGx5IGN1c3RvbSB0cmFuc2Zvcm1hdGlvbiBpZiBhdmFpbGFibGVcbiAgICAgIGlmIChvcHRpb25zLmN1c3RvbVRyYW5zZm9ybWF0aW9ucyAmJiBvcHRpb25zLmN1c3RvbVRyYW5zZm9ybWF0aW9uc1trZXldKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmVzdWx0W2tleV0gPSBvcHRpb25zLmN1c3RvbVRyYW5zZm9ybWF0aW9uc1trZXldKHZhbHVlKTtcbiAgICAgICAgICB0cmFuc2Zvcm1hdGlvbnMucHVzaChgQXBwbGllZCBjdXN0b20gdHJhbnNmb3JtYXRpb24gdG8gZmllbGQgJyR7a2V5fSdgKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICAgICAgICAgIHdhcm5pbmdzLnB1c2goYEN1c3RvbSB0cmFuc2Zvcm1hdGlvbiBmYWlsZWQgZm9yIGZpZWxkICcke2tleX0nOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBIYW5kbGUgbnVsbCB2YWx1ZXNcbiAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmhhbmRsZU51bGxzID09PSAncmVtb3ZlJykge1xuICAgICAgICAgIHRyYW5zZm9ybWF0aW9ucy5wdXNoKGBSZW1vdmVkIG51bGwgdmFsdWUgZm9yIGZpZWxkICcke2tleX0nYCk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5oYW5kbGVOdWxscyA9PT0gJ3JlcGxhY2UnICYmIG9wdGlvbnMubnVsbFJlcGxhY2VtZW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICByZXN1bHRba2V5XSA9IG9wdGlvbnMubnVsbFJlcGxhY2VtZW50O1xuICAgICAgICAgIHRyYW5zZm9ybWF0aW9ucy5wdXNoKGBSZXBsYWNlZCBudWxsIHZhbHVlIGZvciBmaWVsZCAnJHtrZXl9JyB3aXRoIGRlZmF1bHQgdmFsdWVgKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIFByb2Nlc3MgYmFzZWQgb24gdmFsdWUgdHlwZVxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmVzdWx0W2tleV0gPSB0aGlzLm5vcm1hbGl6ZVN0cmluZyh2YWx1ZSwga2V5LCBvcHRpb25zLCB0cmFuc2Zvcm1hdGlvbnMpO1xuICAgICAgfSBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgICAgcmVzdWx0W2tleV0gPSB0aGlzLm5vcm1hbGl6ZURhdGUodmFsdWUsIGtleSwgb3B0aW9ucywgdHJhbnNmb3JtYXRpb25zKTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgICAgICByZXN1bHRba2V5XSA9IHRoaXMubm9ybWFsaXplTnVtYmVyKHZhbHVlLCBrZXksIG9wdGlvbnMsIHRyYW5zZm9ybWF0aW9ucyk7XG4gICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHJlc3VsdFtrZXldID0gdmFsdWUubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ29iamVjdCcgJiYgaXRlbSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubm9ybWFsaXplT2JqZWN0KGl0ZW0sIG9wdGlvbnMsIHRyYW5zZm9ybWF0aW9ucywgd2FybmluZ3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmVzdWx0W2tleV0gPSB0aGlzLm5vcm1hbGl6ZU9iamVjdCh2YWx1ZSwgb3B0aW9ucywgdHJhbnNmb3JtYXRpb25zLCB3YXJuaW5ncyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIFxuICAvKipcbiAgICogTm9ybWFsaXplIGEgc3RyaW5nIHZhbHVlXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgc3RyaW5nIHRvIG5vcm1hbGl6ZVxuICAgKiBAcGFyYW0gZmllbGROYW1lIFRoZSBuYW1lIG9mIHRoZSBmaWVsZFxuICAgKiBAcGFyYW0gb3B0aW9ucyBOb3JtYWxpemF0aW9uIG9wdGlvbnNcbiAgICogQHBhcmFtIHRyYW5zZm9ybWF0aW9ucyBBcnJheSB0byB0cmFjayBhcHBsaWVkIHRyYW5zZm9ybWF0aW9uc1xuICAgKiBAcmV0dXJucyBOb3JtYWxpemVkIHN0cmluZ1xuICAgKi9cbiAgcHJpdmF0ZSBub3JtYWxpemVTdHJpbmcoXG4gICAgdmFsdWU6IHN0cmluZywgXG4gICAgZmllbGROYW1lOiBzdHJpbmcsIFxuICAgIG9wdGlvbnM6IE5vcm1hbGl6YXRpb25PcHRpb25zLFxuICAgIHRyYW5zZm9ybWF0aW9uczogc3RyaW5nW11cbiAgKTogc3RyaW5nIHtcbiAgICBsZXQgcmVzdWx0ID0gdmFsdWU7XG4gICAgXG4gICAgLy8gVHJpbSB3aGl0ZXNwYWNlXG4gICAgaWYgKG9wdGlvbnMudHJpbVdoaXRlc3BhY2UpIHtcbiAgICAgIGNvbnN0IG9sZExlbmd0aCA9IHJlc3VsdC5sZW5ndGg7XG4gICAgICByZXN1bHQgPSByZXN1bHQudHJpbSgpO1xuICAgICAgaWYgKG9sZExlbmd0aCAhPT0gcmVzdWx0Lmxlbmd0aCkge1xuICAgICAgICB0cmFuc2Zvcm1hdGlvbnMucHVzaChgVHJpbW1lZCB3aGl0ZXNwYWNlIGZyb20gZmllbGQgJyR7ZmllbGROYW1lfSdgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gUmVtb3ZlIHNwZWNpYWwgY2hhcmFjdGVyc1xuICAgIGlmIChvcHRpb25zLnJlbW92ZVNwZWNpYWxDaGFycykge1xuICAgICAgY29uc3Qgb2xkVmFsdWUgPSByZXN1bHQ7XG4gICAgICByZXN1bHQgPSByZXN1bHQucmVwbGFjZSgvW15cXHdcXHNdL2dpLCAnJyk7XG4gICAgICBpZiAob2xkVmFsdWUgIT09IHJlc3VsdCkge1xuICAgICAgICB0cmFuc2Zvcm1hdGlvbnMucHVzaChgUmVtb3ZlZCBzcGVjaWFsIGNoYXJhY3RlcnMgZnJvbSBmaWVsZCAnJHtmaWVsZE5hbWV9J2ApO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBBcHBseSB0ZXh0IGNhc2UgdHJhbnNmb3JtYXRpb25cbiAgICBpZiAob3B0aW9ucy50ZXh0Q2FzZSkge1xuICAgICAgY29uc3Qgb2xkVmFsdWUgPSByZXN1bHQ7XG4gICAgICBzd2l0Y2ggKG9wdGlvbnMudGV4dENhc2UpIHtcbiAgICAgICAgY2FzZSAndXBwZXInOlxuICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdsb3dlcic6XG4gICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3RpdGxlJzpcbiAgICAgICAgICByZXN1bHQgPSByZXN1bHRcbiAgICAgICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAuc3BsaXQoJyAnKVxuICAgICAgICAgICAgLm1hcCh3b3JkID0+IHdvcmQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB3b3JkLnNsaWNlKDEpKVxuICAgICAgICAgICAgLmpvaW4oJyAnKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmIChvbGRWYWx1ZSAhPT0gcmVzdWx0KSB7XG4gICAgICAgIHRyYW5zZm9ybWF0aW9ucy5wdXNoKGBBcHBsaWVkICR7b3B0aW9ucy50ZXh0Q2FzZX0gY2FzZSB0byBmaWVsZCAnJHtmaWVsZE5hbWV9J2ApO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIFxuICAvKipcbiAgICogTm9ybWFsaXplIGEgZGF0ZSB2YWx1ZVxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIGRhdGUgdG8gbm9ybWFsaXplXG4gICAqIEBwYXJhbSBmaWVsZE5hbWUgVGhlIG5hbWUgb2YgdGhlIGZpZWxkXG4gICAqIEBwYXJhbSBvcHRpb25zIE5vcm1hbGl6YXRpb24gb3B0aW9uc1xuICAgKiBAcGFyYW0gdHJhbnNmb3JtYXRpb25zIEFycmF5IHRvIHRyYWNrIGFwcGxpZWQgdHJhbnNmb3JtYXRpb25zXG4gICAqIEByZXR1cm5zIE5vcm1hbGl6ZWQgZGF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBub3JtYWxpemVEYXRlKFxuICAgIHZhbHVlOiBEYXRlLCBcbiAgICBmaWVsZE5hbWU6IHN0cmluZywgXG4gICAgb3B0aW9uczogTm9ybWFsaXphdGlvbk9wdGlvbnMsXG4gICAgdHJhbnNmb3JtYXRpb25zOiBzdHJpbmdbXVxuICApOiBzdHJpbmcgfCBEYXRlIHtcbiAgICAvLyBGb3JtYXQgZGF0ZSBpZiBmb3JtYXQgaXMgc3BlY2lmaWVkXG4gICAgaWYgKG9wdGlvbnMuZGF0ZUZvcm1hdCkge1xuICAgICAgdHJhbnNmb3JtYXRpb25zLnB1c2goYEZvcm1hdHRlZCBkYXRlIGZpZWxkICcke2ZpZWxkTmFtZX0nIHRvICR7b3B0aW9ucy5kYXRlRm9ybWF0fWApO1xuICAgICAgLy8gVGhpcyBpcyBhIHNpbXBsaWZpZWQgaW1wbGVtZW50YXRpb24gLSB3b3VsZCB1c2UgYSBwcm9wZXIgZGF0ZSBmb3JtYXR0aW5nIGxpYnJhcnlcbiAgICAgIHJldHVybiB2YWx1ZS50b0lTT1N0cmluZygpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBOb3JtYWxpemUgYSBudW1iZXIgdmFsdWVcbiAgICogQHBhcmFtIHZhbHVlIFRoZSBudW1iZXIgdG8gbm9ybWFsaXplXG4gICAqIEBwYXJhbSBmaWVsZE5hbWUgVGhlIG5hbWUgb2YgdGhlIGZpZWxkXG4gICAqIEBwYXJhbSBvcHRpb25zIE5vcm1hbGl6YXRpb24gb3B0aW9uc1xuICAgKiBAcGFyYW0gdHJhbnNmb3JtYXRpb25zIEFycmF5IHRvIHRyYWNrIGFwcGxpZWQgdHJhbnNmb3JtYXRpb25zXG4gICAqIEByZXR1cm5zIE5vcm1hbGl6ZWQgbnVtYmVyXG4gICAqL1xuICBwcml2YXRlIG5vcm1hbGl6ZU51bWJlcihcbiAgICB2YWx1ZTogbnVtYmVyLCBcbiAgICBmaWVsZE5hbWU6IHN0cmluZywgXG4gICAgb3B0aW9uczogTm9ybWFsaXphdGlvbk9wdGlvbnMsXG4gICAgdHJhbnNmb3JtYXRpb25zOiBzdHJpbmdbXVxuICApOiBzdHJpbmcgfCBudW1iZXIge1xuICAgIC8vIEZvcm1hdCBudW1iZXIgaWYgZm9ybWF0IGlzIHNwZWNpZmllZFxuICAgIGlmIChvcHRpb25zLm51bWJlckZvcm1hdCkge1xuICAgICAgdHJhbnNmb3JtYXRpb25zLnB1c2goYEZvcm1hdHRlZCBudW1iZXIgZmllbGQgJyR7ZmllbGROYW1lfScgdG8gJHtvcHRpb25zLm51bWJlckZvcm1hdH1gKTtcbiAgICAgIC8vIFRoaXMgaXMgYSBzaW1wbGlmaWVkIGltcGxlbWVudGF0aW9uIC0gd291bGQgdXNlIGEgcHJvcGVyIG51bWJlciBmb3JtYXR0aW5nIGxpYnJhcnlcbiAgICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbn0iXX0=