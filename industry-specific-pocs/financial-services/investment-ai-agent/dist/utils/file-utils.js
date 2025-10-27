"use strict";
/**
 * Utility functions for file operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasCSVHeader = exports.detectCSVDelimiter = exports.estimateCSVRecords = exports.mightContainSensitiveInfo = exports.generateUniqueFileName = exports.getFileExtension = exports.sanitizeFileName = exports.isValidFileSize = exports.getMimeType = exports.isSupportedFileType = void 0;
/**
 * Checks if a file is of a supported type
 * @param fileName The name of the file
 * @returns True if the file type is supported
 */
const isSupportedFileType = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    return ['csv', 'pdf', 'xls', 'xlsx', 'json'].includes(extension);
};
exports.isSupportedFileType = isSupportedFileType;
/**
 * Gets the MIME type for a file based on its extension
 * @param fileName The name of the file
 * @returns The MIME type
 */
const getMimeType = (fileName) => {
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
exports.getMimeType = getMimeType;
/**
 * Validates file size
 * @param fileSize The size of the file in bytes
 * @param maxSizeInMB The maximum allowed size in MB
 * @returns True if the file size is valid
 */
const isValidFileSize = (fileSize, maxSizeInMB = 100) => {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return fileSize <= maxSizeInBytes;
};
exports.isValidFileSize = isValidFileSize;
/**
 * Generates a secure file name
 * @param originalName The original file name
 * @returns A sanitized file name
 */
const sanitizeFileName = (originalName) => {
    // Remove potentially dangerous characters
    let sanitized = originalName.replace(/[^\w\s.-]/g, '');
    // Ensure the name doesn't start with a dot (hidden file)
    if (sanitized.startsWith('.')) {
        sanitized = 'file' + sanitized;
    }
    return sanitized;
};
exports.sanitizeFileName = sanitizeFileName;
/**
 * Extracts the file extension
 * @param fileName The name of the file
 * @returns The file extension (without the dot)
 */
const getFileExtension = (fileName) => {
    return fileName.split('.').pop()?.toLowerCase() || '';
};
exports.getFileExtension = getFileExtension;
/**
 * Generates a unique file name to prevent collisions
 * @param fileName The original file name
 * @returns A unique file name
 */
const generateUniqueFileName = (fileName) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const extension = (0, exports.getFileExtension)(fileName);
    const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
    return `${baseName}_${timestamp}_${randomString}.${extension}`;
};
exports.generateUniqueFileName = generateUniqueFileName;
/**
 * Checks if a file might contain sensitive information
 * @param fileName The name of the file
 * @param fileContent The content of the file (if available)
 * @returns True if the file might contain sensitive information
 */
const mightContainSensitiveInfo = (fileName, fileContent) => {
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
exports.mightContainSensitiveInfo = mightContainSensitiveInfo;
/**
 * Estimates the number of records in a CSV file
 * @param csvContent The content of the CSV file
 * @returns The estimated number of records
 */
const estimateCSVRecords = (csvContent) => {
    // Simple implementation - count newlines
    return csvContent.split('\n').length - 1; // Subtract 1 for header row
};
exports.estimateCSVRecords = estimateCSVRecords;
/**
 * Detects the delimiter in a CSV file
 * @param csvContent The content of the CSV file
 * @returns The detected delimiter
 */
const detectCSVDelimiter = (csvContent) => {
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
exports.detectCSVDelimiter = detectCSVDelimiter;
/**
 * Checks if a CSV file has a header row
 * @param csvContent The content of the CSV file
 * @param delimiter The delimiter used in the CSV
 * @returns True if the CSV likely has a header row
 */
const hasCSVHeader = (csvContent, delimiter = ',') => {
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
exports.hasCSVHeader = hasCSVHeader;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS11dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9maWxlLXV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7O0FBRUg7Ozs7R0FJRztBQUNJLE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxRQUFnQixFQUFXLEVBQUU7SUFDL0QsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUM7SUFDakUsT0FBTyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDbkUsQ0FBQyxDQUFDO0FBSFcsUUFBQSxtQkFBbUIsdUJBRzlCO0FBRUY7Ozs7R0FJRztBQUNJLE1BQU0sV0FBVyxHQUFHLENBQUMsUUFBZ0IsRUFBVSxFQUFFO0lBQ3RELE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDO0lBRWpFLFFBQVEsU0FBUyxFQUFFO1FBQ2pCLEtBQUssS0FBSztZQUNSLE9BQU8sVUFBVSxDQUFDO1FBQ3BCLEtBQUssS0FBSztZQUNSLE9BQU8saUJBQWlCLENBQUM7UUFDM0IsS0FBSyxLQUFLO1lBQ1IsT0FBTywwQkFBMEIsQ0FBQztRQUNwQyxLQUFLLE1BQU07WUFDVCxPQUFPLG1FQUFtRSxDQUFDO1FBQzdFLEtBQUssTUFBTTtZQUNULE9BQU8sa0JBQWtCLENBQUM7UUFDNUI7WUFDRSxPQUFPLDBCQUEwQixDQUFDO0tBQ3JDO0FBQ0gsQ0FBQyxDQUFDO0FBakJXLFFBQUEsV0FBVyxlQWlCdEI7QUFFRjs7Ozs7R0FLRztBQUNJLE1BQU0sZUFBZSxHQUFHLENBQUMsUUFBZ0IsRUFB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QUFHLEVBQVcsRUFBRTtJQUNuRixNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3JDLElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDcEIsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUVELE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDM0MsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUU1QyxpRkFBaUY7SUFDakYsSUFBSSxjQUFjLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3BFLE1BQU0sYUFBYSxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xELE1BQU0sY0FBYyxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXBELElBQUksYUFBYSxLQUFLLGNBQWMsRUFBRTtZQUNwQyxjQUFjLEVBQUUsQ0FBQztTQUNsQjtLQUNGO0lBRUQsMkVBQTJFO0lBQzNFLE9BQU8sY0FBYyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQzlDLENBQUMsQ0FBQztBQXRCVyxRQUFBLFlBQVksZ0JBc0J2QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVXRpbGl0eSBmdW5jdGlvbnMgZm9yIGZpbGUgb3BlcmF0aW9uc1xuICovXG5cbi8qKlxuICogQ2hlY2tzIGlmIGEgZmlsZSBpcyBvZiBhIHN1cHBvcnRlZCB0eXBlXG4gKiBAcGFyYW0gZmlsZU5hbWUgVGhlIG5hbWUgb2YgdGhlIGZpbGVcbiAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGZpbGUgdHlwZSBpcyBzdXBwb3J0ZWRcbiAqL1xuZXhwb3J0IGNvbnN0IGlzU3VwcG9ydGVkRmlsZVR5cGUgPSAoZmlsZU5hbWU6IHN0cmluZyk6IGJvb2xlYW4gPT4ge1xuICBjb25zdCBleHRlbnNpb24gPSBmaWxlTmFtZS5zcGxpdCgnLicpLnBvcCgpPy50b0xvd2VyQ2FzZSgpIHx8ICcnO1xuICByZXR1cm4gWydjc3YnLCAncGRmJywgJ3hscycsICd4bHN4JywgJ2pzb24nXS5pbmNsdWRlcyhleHRlbnNpb24pO1xufTtcblxuLyoqXG4gKiBHZXRzIHRoZSBNSU1FIHR5cGUgZm9yIGEgZmlsZSBiYXNlZCBvbiBpdHMgZXh0ZW5zaW9uXG4gKiBAcGFyYW0gZmlsZU5hbWUgVGhlIG5hbWUgb2YgdGhlIGZpbGVcbiAqIEByZXR1cm5zIFRoZSBNSU1FIHR5cGVcbiAqL1xuZXhwb3J0IGNvbnN0IGdldE1pbWVUeXBlID0gKGZpbGVOYW1lOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICBjb25zdCBleHRlbnNpb24gPSBmaWxlTmFtZS5zcGxpdCgnLicpLnBvcCgpPy50b0xvd2VyQ2FzZSgpIHx8ICcnO1xuICBcbiAgc3dpdGNoIChleHRlbnNpb24pIHtcbiAgICBjYXNlICdjc3YnOlxuICAgICAgcmV0dXJuICd0ZXh0L2Nzdic7XG4gICAgY2FzZSAncGRmJzpcbiAgICAgIHJldHVybiAnYXBwbGljYXRpb24vcGRmJztcbiAgICBjYXNlICd4bHMnOlxuICAgICAgcmV0dXJuICdhcHBsaWNhdGlvbi92bmQubXMtZXhjZWwnO1xuICAgIGNhc2UgJ3hsc3gnOlxuICAgICAgcmV0dXJuICdhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC5zaGVldCc7XG4gICAgY2FzZSAnanNvbic6XG4gICAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbSc7XG4gIH1cbn07XG5cbi8qKlxuICogVmFsaWRhdGVzIGZpbGUgc2l6ZVxuICogQHBhcmFtIGZpbGVTaXplIFRoZSBzaXplIG9mIHRoZSBmaWxlIGluIGJ5dGVzXG4gKiBAcGFyYW0gbWF4U2l6ZUluTUIgVGhlIG1heGltdW0gYWxsb3dlZCBzaXplIGluIE1CXG4gKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBmaWxlIHNpemUgaXMgdmFsaWRcbiAqL1xuZXhwb3J0IGNvbnN0IGlzVmFsaWRGaWxlU2l6ZSA9IChmaWxlU2l6ZTogbnVtYmVyLCBtYXhTaXplSW5NQjogbnVtYmVyID0gMTAwKTogYm9vbGVhbiA9PiB7XG4gIGNvbnN0IG1heFNpemVJbkJ5dGVzID0gbWF4U2l6ZUluTUIgKiAxMDI0ICogMTAyNDtcbiAgcmV0dXJuIGZpbGVTaXplIDw9IG1heFNpemVJbkJ5dGVzO1xufTtcblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSBzZWN1cmUgZmlsZSBuYW1lXG4gKiBAcGFyYW0gb3JpZ2luYWxOYW1lIFRoZSBvcmlnaW5hbCBmaWxlIG5hbWVcbiAqIEByZXR1cm5zIEEgc2FuaXRpemVkIGZpbGUgbmFtZVxuICovXG5leHBvcnQgY29uc3Qgc2FuaXRpemVGaWxlTmFtZSA9IChvcmlnaW5hbE5hbWU6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gIC8vIFJlbW92ZSBwb3RlbnRpYWxseSBkYW5nZXJvdXMgY2hhcmFjdGVyc1xuICBsZXQgc2FuaXRpemVkID0gb3JpZ2luYWxOYW1lLnJlcGxhY2UoL1teXFx3XFxzLi1dL2csICcnKTtcbiAgXG4gIC8vIEVuc3VyZSB0aGUgbmFtZSBkb2Vzbid0IHN0YXJ0IHdpdGggYSBkb3QgKGhpZGRlbiBmaWxlKVxuICBpZiAoc2FuaXRpemVkLnN0YXJ0c1dpdGgoJy4nKSkge1xuICAgIHNhbml0aXplZCA9ICdmaWxlJyArIHNhbml0aXplZDtcbiAgfVxuICBcbiAgcmV0dXJuIHNhbml0aXplZDtcbn07XG5cbi8qKlxuICogRXh0cmFjdHMgdGhlIGZpbGUgZXh0ZW5zaW9uXG4gKiBAcGFyYW0gZmlsZU5hbWUgVGhlIG5hbWUgb2YgdGhlIGZpbGVcbiAqIEByZXR1cm5zIFRoZSBmaWxlIGV4dGVuc2lvbiAod2l0aG91dCB0aGUgZG90KVxuICovXG5leHBvcnQgY29uc3QgZ2V0RmlsZUV4dGVuc2lvbiA9IChmaWxlTmFtZTogc3RyaW5nKTogc3RyaW5nID0+IHtcbiAgcmV0dXJuIGZpbGVOYW1lLnNwbGl0KCcuJykucG9wKCk/LnRvTG93ZXJDYXNlKCkgfHwgJyc7XG59O1xuXG4vKipcbiAqIEdlbmVyYXRlcyBhIHVuaXF1ZSBmaWxlIG5hbWUgdG8gcHJldmVudCBjb2xsaXNpb25zXG4gKiBAcGFyYW0gZmlsZU5hbWUgVGhlIG9yaWdpbmFsIGZpbGUgbmFtZVxuICogQHJldHVybnMgQSB1bmlxdWUgZmlsZSBuYW1lXG4gKi9cbmV4cG9ydCBjb25zdCBnZW5lcmF0ZVVuaXF1ZUZpbGVOYW1lID0gKGZpbGVOYW1lOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICBjb25zdCB0aW1lc3RhbXAgPSBEYXRlLm5vdygpO1xuICBjb25zdCByYW5kb21TdHJpbmcgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoMiwgMTApO1xuICBjb25zdCBleHRlbnNpb24gPSBnZXRGaWxlRXh0ZW5zaW9uKGZpbGVOYW1lKTtcbiAgY29uc3QgYmFzZU5hbWUgPSBmaWxlTmFtZS5zdWJzdHJpbmcoMCwgZmlsZU5hbWUubGFzdEluZGV4T2YoJy4nKSk7XG4gIFxuICByZXR1cm4gYCR7YmFzZU5hbWV9XyR7dGltZXN0YW1wfV8ke3JhbmRvbVN0cmluZ30uJHtleHRlbnNpb259YDtcbn07XG5cbi8qKlxuICogQ2hlY2tzIGlmIGEgZmlsZSBtaWdodCBjb250YWluIHNlbnNpdGl2ZSBpbmZvcm1hdGlvblxuICogQHBhcmFtIGZpbGVOYW1lIFRoZSBuYW1lIG9mIHRoZSBmaWxlXG4gKiBAcGFyYW0gZmlsZUNvbnRlbnQgVGhlIGNvbnRlbnQgb2YgdGhlIGZpbGUgKGlmIGF2YWlsYWJsZSlcbiAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGZpbGUgbWlnaHQgY29udGFpbiBzZW5zaXRpdmUgaW5mb3JtYXRpb25cbiAqL1xuZXhwb3J0IGNvbnN0IG1pZ2h0Q29udGFpblNlbnNpdGl2ZUluZm8gPSAoZmlsZU5hbWU6IHN0cmluZywgZmlsZUNvbnRlbnQ/OiBzdHJpbmcpOiBib29sZWFuID0+IHtcbiAgY29uc3Qgc2Vuc2l0aXZlS2V5d29yZHMgPSBbXG4gICAgJ3Bhc3N3b3JkJywgJ3NlY3JldCcsICdwcml2YXRlJywgJ2NvbmZpZGVudGlhbCcsICdzZW5zaXRpdmUnLFxuICAgICdzc24nLCAnc29jaWFsIHNlY3VyaXR5JywgJ2NyZWRpdCBjYXJkJywgJ3Bhc3Nwb3J0J1xuICBdO1xuICBcbiAgLy8gQ2hlY2sgZmlsZSBuYW1lXG4gIGNvbnN0IGxvd2VyRmlsZU5hbWUgPSBmaWxlTmFtZS50b0xvd2VyQ2FzZSgpO1xuICBpZiAoc2Vuc2l0aXZlS2V5d29yZHMuc29tZShrZXl3b3JkID0+IGxvd2VyRmlsZU5hbWUuaW5jbHVkZXMoa2V5d29yZCkpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgXG4gIC8vIENoZWNrIGZpbGUgY29udGVudCBpZiBhdmFpbGFibGVcbiAgaWYgKGZpbGVDb250ZW50KSB7XG4gICAgY29uc3QgbG93ZXJDb250ZW50ID0gZmlsZUNvbnRlbnQudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoc2Vuc2l0aXZlS2V5d29yZHMuc29tZShrZXl3b3JkID0+IGxvd2VyQ29udGVudC5pbmNsdWRlcyhrZXl3b3JkKSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICBcbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBFc3RpbWF0ZXMgdGhlIG51bWJlciBvZiByZWNvcmRzIGluIGEgQ1NWIGZpbGVcbiAqIEBwYXJhbSBjc3ZDb250ZW50IFRoZSBjb250ZW50IG9mIHRoZSBDU1YgZmlsZVxuICogQHJldHVybnMgVGhlIGVzdGltYXRlZCBudW1iZXIgb2YgcmVjb3Jkc1xuICovXG5leHBvcnQgY29uc3QgZXN0aW1hdGVDU1ZSZWNvcmRzID0gKGNzdkNvbnRlbnQ6IHN0cmluZyk6IG51bWJlciA9PiB7XG4gIC8vIFNpbXBsZSBpbXBsZW1lbnRhdGlvbiAtIGNvdW50IG5ld2xpbmVzXG4gIHJldHVybiBjc3ZDb250ZW50LnNwbGl0KCdcXG4nKS5sZW5ndGggLSAxOyAvLyBTdWJ0cmFjdCAxIGZvciBoZWFkZXIgcm93XG59O1xuXG4vKipcbiAqIERldGVjdHMgdGhlIGRlbGltaXRlciBpbiBhIENTViBmaWxlXG4gKiBAcGFyYW0gY3N2Q29udGVudCBUaGUgY29udGVudCBvZiB0aGUgQ1NWIGZpbGVcbiAqIEByZXR1cm5zIFRoZSBkZXRlY3RlZCBkZWxpbWl0ZXJcbiAqL1xuZXhwb3J0IGNvbnN0IGRldGVjdENTVkRlbGltaXRlciA9IChjc3ZDb250ZW50OiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICAvLyBHZXQgdGhlIGZpcnN0IGxpbmVcbiAgY29uc3QgZmlyc3RMaW5lID0gY3N2Q29udGVudC5zcGxpdCgnXFxuJylbMF07XG4gIFxuICAvLyBDb3VudCBvY2N1cnJlbmNlcyBvZiBjb21tb24gZGVsaW1pdGVyc1xuICBjb25zdCBkZWxpbWl0ZXJzID0gWycsJywgJzsnLCAnXFx0JywgJ3wnXTtcbiAgY29uc3QgY291bnRzID0gZGVsaW1pdGVycy5tYXAoZGVsaW1pdGVyID0+ICh7XG4gICAgZGVsaW1pdGVyLFxuICAgIGNvdW50OiAoZmlyc3RMaW5lLm1hdGNoKG5ldyBSZWdFeHAoZGVsaW1pdGVyLCAnZycpKSB8fCBbXSkubGVuZ3RoXG4gIH0pKTtcbiAgXG4gIC8vIEZpbmQgdGhlIGRlbGltaXRlciB3aXRoIHRoZSBoaWdoZXN0IGNvdW50XG4gIGNvbnN0IG1heENvdW50ID0gTWF0aC5tYXgoLi4uY291bnRzLm1hcChjID0+IGMuY291bnQpKTtcbiAgY29uc3QgZGV0ZWN0ZWQgPSBjb3VudHMuZmluZChjID0+IGMuY291bnQgPT09IG1heENvdW50KTtcbiAgXG4gIHJldHVybiBkZXRlY3RlZD8uZGVsaW1pdGVyIHx8ICcsJzsgLy8gRGVmYXVsdCB0byBjb21tYSBpZiBubyBkZWxpbWl0ZXIgaXMgZGV0ZWN0ZWRcbn07XG5cbi8qKlxuICogQ2hlY2tzIGlmIGEgQ1NWIGZpbGUgaGFzIGEgaGVhZGVyIHJvd1xuICogQHBhcmFtIGNzdkNvbnRlbnQgVGhlIGNvbnRlbnQgb2YgdGhlIENTViBmaWxlXG4gKiBAcGFyYW0gZGVsaW1pdGVyIFRoZSBkZWxpbWl0ZXIgdXNlZCBpbiB0aGUgQ1NWXG4gKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBDU1YgbGlrZWx5IGhhcyBhIGhlYWRlciByb3dcbiAqL1xuZXhwb3J0IGNvbnN0IGhhc0NTVkhlYWRlciA9IChjc3ZDb250ZW50OiBzdHJpbmcsIGRlbGltaXRlcjogc3RyaW5nID0gJywnKTogYm9vbGVhbiA9PiB7XG4gIGNvbnN0IGxpbmVzID0gY3N2Q29udGVudC5zcGxpdCgnXFxuJyk7XG4gIGlmIChsaW5lcy5sZW5ndGggPCAyKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIFxuICBjb25zdCBmaXJzdFJvdyA9IGxpbmVzWzBdLnNwbGl0KGRlbGltaXRlcik7XG4gIGNvbnN0IHNlY29uZFJvdyA9IGxpbmVzWzFdLnNwbGl0KGRlbGltaXRlcik7XG4gIFxuICAvLyBJZiB0aGUgZmlyc3Qgcm93IGhhcyBkaWZmZXJlbnQgdHlwZXMgdGhhbiB0aGUgc2Vjb25kIHJvdywgaXQncyBsaWtlbHkgYSBoZWFkZXJcbiAgbGV0IGRpZmZlcmVudFR5cGVzID0gMDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBNYXRoLm1pbihmaXJzdFJvdy5sZW5ndGgsIHNlY29uZFJvdy5sZW5ndGgpOyBpKyspIHtcbiAgICBjb25zdCBmaXJzdElzTnVtYmVyID0gIWlzTmFOKE51bWJlcihmaXJzdFJvd1tpXSkpO1xuICAgIGNvbnN0IHNlY29uZElzTnVtYmVyID0gIWlzTmFOKE51bWJlcihzZWNvbmRSb3dbaV0pKTtcbiAgICBcbiAgICBpZiAoZmlyc3RJc051bWJlciAhPT0gc2Vjb25kSXNOdW1iZXIpIHtcbiAgICAgIGRpZmZlcmVudFR5cGVzKys7XG4gICAgfVxuICB9XG4gIFxuICAvLyBJZiBtb3JlIHRoYW4gaGFsZiB0aGUgY29sdW1ucyBoYXZlIGRpZmZlcmVudCB0eXBlcywgYXNzdW1lIGl0J3MgYSBoZWFkZXJcbiAgcmV0dXJuIGRpZmZlcmVudFR5cGVzID4gZmlyc3RSb3cubGVuZ3RoIC8gMjtcbn07Il19