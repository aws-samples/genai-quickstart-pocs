/**
 * Service for handling proprietary data integration
 */
import { DataMetadata, UploadResult } from '../models/services';
import { ProprietaryDataFile, NormalizationOptions, NormalizationResult, AccessControl } from '../models/proprietary-data';
/**
 * Service for handling proprietary data integration
 */
export declare class ProprietaryDataService {
    private s3Client;
    private bucketName;
    constructor(bucketName: string);
    /**
     * Upload a file to the proprietary data storage
     * @param file The file to upload
     * @param metadata Metadata about the file
     * @param userId The ID of the user uploading the file
     * @param organizationId The ID of the organization the user belongs to
     * @param accessControl Access control settings for the file
     * @returns Upload result with status and document ID
     */
    uploadFile(file: File, metadata: DataMetadata, userId: string, organizationId: string, accessControl: AccessControl): Promise<UploadResult>;
    /**
     * Process a file that has been uploaded
     * @param documentId The ID of the document to process
     * @returns Processing result
     */
    processFile(documentId: string): Promise<UploadResult>;
    /**
     * Normalize data according to specified options
     * @param data The data to normalize
     * @param options Normalization options
     * @returns Normalized data result
     */
    normalizeData(data: any, options: NormalizationOptions): Promise<NormalizationResult>;
    /**
     * Get a list of proprietary data files for a user
     * @param userId The ID of the user
     * @param organizationId The ID of the organization
     * @returns List of proprietary data files
     */
    listFiles(userId: string, organizationId: string): Promise<ProprietaryDataFile[]>;
    /**
     * Get a proprietary data file by ID
     * @param documentId The ID of the document
     * @param userId The ID of the user requesting the file
     * @returns The proprietary data file if found and accessible
     */
    getFile(documentId: string, userId: string): Promise<ProprietaryDataFile | null>;
    /**
     * Delete a proprietary data file
     * @param documentId The ID of the document to delete
     * @param userId The ID of the user requesting deletion
     * @returns True if deletion was successful
     */
    deleteFile(documentId: string, userId: string): Promise<boolean>;
    /**
     * Update access control for a file
     * @param documentId The ID of the document
     * @param userId The ID of the user requesting the update
     * @param accessControl New access control settings
     * @returns True if update was successful
     */
    updateAccessControl(documentId: string, userId: string, accessControl: AccessControl): Promise<boolean>;
    /**
     * Validate a file before upload
     * @param file The file to validate
     * @returns Validation result
     */
    private validateFile;
    /**
     * Determine file type from file name
     * @param fileName The name of the file
     * @returns The file type
     */
    private determineFileType;
    /**
     * Queue a file for processing
     * @param documentId The ID of the document to process
     */
    private queueFileForProcessing;
    /**
     * Get file metadata from the database
     * @param documentId The ID of the document
     * @returns The file metadata if found
     */
    private getFileMetadata;
    /**
     * Update file status in the database
     * @param documentId The ID of the document
     * @param status The new status
     * @param error Optional error message
     */
    private updateFileStatus;
    /**
     * Extract data from a file
     * @param dataFile The file metadata
     * @returns Extraction result
     */
    private extractData;
    /**
     * Extract data from a CSV file
     * @param dataFile The file metadata
     * @returns Extraction result
     */
    private extractFromCSV;
    /**
     * Extract data from a PDF file
     * @param dataFile The file metadata
     * @returns Extraction result
     */
    private extractFromPDF;
    /**
     * Extract data from an Excel file
     * @param dataFile The file metadata
     * @returns Extraction result
     */
    private extractFromExcel;
    /**
     * Extract data from a JSON file
     * @param dataFile The file metadata
     * @returns Extraction result
     */
    private extractFromJSON;
    /**
     * Store extracted data in the database
     * @param documentId The ID of the document
     * @param extractedData The extracted data
     */
    private storeExtractedData;
    /**
     * Normalize tabular data (array of objects)
     * @param data The data to normalize
     * @param options Normalization options
     * @param transformations Array to track applied transformations
     * @param warnings Array to track warnings
     * @returns Normalized data
     */
    private normalizeTabularData;
    /**
     * Normalize a single object
     * @param obj The object to normalize
     * @param options Normalization options
     * @param transformations Array to track applied transformations
     * @param warnings Array to track warnings
     * @returns Normalized object
     */
    private normalizeObject;
    /**
     * Normalize a string value
     * @param value The string to normalize
     * @param fieldName The name of the field
     * @param options Normalization options
     * @param transformations Array to track applied transformations
     * @returns Normalized string
     */
    private normalizeString;
    /**
     * Normalize a date value
     * @param value The date to normalize
     * @param fieldName The name of the field
     * @param options Normalization options
     * @param transformations Array to track applied transformations
     * @returns Normalized date
     */
    private normalizeDate;
    /**
     * Normalize a number value
     * @param value The number to normalize
     * @param fieldName The name of the field
     * @param options Normalization options
     * @param transformations Array to track applied transformations
     * @returns Normalized number
     */
    private normalizeNumber;
}
