/**
 * Utility functions for file operations
 */

/**
 * Checks if a file is of a supported type
 * @param fileName The name of the file
 * @returns True if the file type is supported
 */
export const isSupportedFileType = (fileName: string): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  return ['csv', 'pdf', 'xls', 'xlsx', 'json'].includes(extension);
};

/**
 * Gets the MIME type for a file based on its extension
 * @param fileName The name of the file
 * @returns The MIME type
 */
export const getMimeType = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  switch (extension) {
    case 'csv':
      return 'text/csv';
    case 'pdf':
      return 'application/pdf';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
};

/**
 * Validates file size
 * @param fileSize The size of the file in bytes
 * @param maxSizeInMB The maximum allowed size in MB
 * @returns True if the file size is valid
 */
export const isValidFileSize = (fileSize: number, maxSizeInMB: number = 100): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return fileSize <= maxSizeInBytes;
};

/**
 * Generates a secure file name
 * @param originalName The original file name
 * @returns A sanitized file name
 */
export const sanitizeFileName = (originalName: string): string => {
  // Remove potentially dangerous characters
  let sanitized = originalName.replace(/[^\w\s.-]/g, '');
  
  // Ensure the name doesn't start with a dot (hidden file)
  if (sanitized.startsWith('.')) {
    sanitized = 'file' + sanitized;
  }
  
  return sanitized;
};

/**
 * Extracts the file extension
 * @param fileName The name of the file
 * @returns The file extension (without the dot)
 */
export const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};

/**
 * Generates a unique file name to prevent collisions
 * @param fileName The original file name
 * @returns A unique file name
 */
export const generateUniqueFileName = (fileName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  const extension = getFileExtension(fileName);
  const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
  
  return `${baseName}_${timestamp}_${randomString}.${extension}`;
};

/**
 * Checks if a file might contain sensitive information
 * @param fileName The name of the file
 * @param fileContent The content of the file (if available)
 * @returns True if the file might contain sensitive information
 */
export const mightContainSensitiveInfo = (fileName: string, fileContent?: string): boolean => {
  const sensitiveKeywords = [
    'password', 'secret', 'private', 'confidential', 'sensitive',
    'ssn', 'social security', 'credit card', 'passport'
  ];
  
  // Check file name
  const lowerFileName = fileName.toLowerCase();
  if (sensitiveKeywords.some(keyword => lowerFileName.includes(keyword))) {
    return true;
  }
  
  // Check file content if available
  if (fileContent) {
    const lowerContent = fileContent.toLowerCase();
    if (sensitiveKeywords.some(keyword => lowerContent.includes(keyword))) {
      return true;
    }
  }
  
  return false;
};

/**
 * Estimates the number of records in a CSV file
 * @param csvContent The content of the CSV file
 * @returns The estimated number of records
 */
export const estimateCSVRecords = (csvContent: string): number => {
  // Simple implementation - count newlines
  return csvContent.split('\n').length - 1; // Subtract 1 for header row
};

/**
 * Detects the delimiter in a CSV file
 * @param csvContent The content of the CSV file
 * @returns The detected delimiter
 */
export const detectCSVDelimiter = (csvContent: string): string => {
  // Get the first line
  const firstLine = csvContent.split('\n')[0];
  
  // Count occurrences of common delimiters
  const delimiters = [',', ';', '\t', '|'];
  const counts = delimiters.map(delimiter => ({
    delimiter,
    count: (firstLine.match(new RegExp(delimiter, 'g')) || []).length
  }));
  
  // Find the delimiter with the highest count
  const maxCount = Math.max(...counts.map(c => c.count));
  const detected = counts.find(c => c.count === maxCount);
  
  return detected?.delimiter || ','; // Default to comma if no delimiter is detected
};

/**
 * Checks if a CSV file has a header row
 * @param csvContent The content of the CSV file
 * @param delimiter The delimiter used in the CSV
 * @returns True if the CSV likely has a header row
 */
export const hasCSVHeader = (csvContent: string, delimiter: string = ','): boolean => {
  const lines = csvContent.split('\n');
  if (lines.length < 2) {
    return false;
  }
  
  const firstRow = lines[0].split(delimiter);
  const secondRow = lines[1].split(delimiter);
  
  // If the first row has different types than the second row, it's likely a header
  let differentTypes = 0;
  for (let i = 0; i < Math.min(firstRow.length, secondRow.length); i++) {
    const firstIsNumber = !isNaN(Number(firstRow[i]));
    const secondIsNumber = !isNaN(Number(secondRow[i]));
    
    if (firstIsNumber !== secondIsNumber) {
      differentTypes++;
    }
  }
  
  // If more than half the columns have different types, assume it's a header
  return differentTypes > firstRow.length / 2;
};