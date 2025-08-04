/**
 * Utility functions for file operations
 */
/**
 * Checks if a file is of a supported type
 * @param fileName The name of the file
 * @returns True if the file type is supported
 */
export declare const isSupportedFileType: (fileName: string) => boolean;
/**
 * Gets the MIME type for a file based on its extension
 * @param fileName The name of the file
 * @returns The MIME type
 */
export declare const getMimeType: (fileName: string) => string;
/**
 * Validates file size
 * @param fileSize The size of the file in bytes
 * @param maxSizeInMB The maximum allowed size in MB
 * @returns True if the file size is valid
 */
export declare const isValidFileSize: (fileSize: number, maxSizeInMB?: number) => boolean;
/**
 * Generates a secure file name
 * @param originalName The original file name
 * @returns A sanitized file name
 */
export declare const sanitizeFileName: (originalName: string) => string;
/**
 * Extracts the file extension
 * @param fileName The name of the file
 * @returns The file extension (without the dot)
 */
export declare const getFileExtension: (fileName: string) => string;
/**
 * Generates a unique file name to prevent collisions
 * @param fileName The original file name
 * @returns A unique file name
 */
export declare const generateUniqueFileName: (fileName: string) => string;
/**
 * Checks if a file might contain sensitive information
 * @param fileName The name of the file
 * @param fileContent The content of the file (if available)
 * @returns True if the file might contain sensitive information
 */
export declare const mightContainSensitiveInfo: (fileName: string, fileContent?: string) => boolean;
/**
 * Estimates the number of records in a CSV file
 * @param csvContent The content of the CSV file
 * @returns The estimated number of records
 */
export declare const estimateCSVRecords: (csvContent: string) => number;
/**
 * Detects the delimiter in a CSV file
 * @param csvContent The content of the CSV file
 * @returns The detected delimiter
 */
export declare const detectCSVDelimiter: (csvContent: string) => string;
/**
 * Checks if a CSV file has a header row
 * @param csvContent The content of the CSV file
 * @param delimiter The delimiter used in the CSV
 * @returns True if the CSV likely has a header row
 */
export declare const hasCSVHeader: (csvContent: string, delimiter?: string) => boolean;
