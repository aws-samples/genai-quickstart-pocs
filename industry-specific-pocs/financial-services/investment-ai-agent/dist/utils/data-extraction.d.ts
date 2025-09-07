/**
 * Utilities for extracting data from various file formats
 */
import { DataExtractionResult, DataSchema } from '../models/proprietary-data';
/**
 * Extract data from a CSV file
 * @param content The content of the CSV file
 * @returns Extraction result
 */
export declare const extractFromCSV: (content: string) => DataExtractionResult;
/**
 * Extract data from a JSON file
 * @param content The content of the JSON file
 * @returns Extraction result
 */
export declare const extractFromJSON: (content: string) => DataExtractionResult;
/**
 * Extract text content from a PDF file (mock implementation)
 * @param content The binary content of the PDF file
 * @returns Extraction result
 */
export declare const extractFromPDF: (content: ArrayBuffer) => DataExtractionResult;
/**
 * Extract data from an Excel file (mock implementation)
 * @param content The binary content of the Excel file
 * @returns Extraction result
 */
export declare const extractFromExcel: (content: ArrayBuffer) => DataExtractionResult;
/**
 * Generate a schema from data
 * @param data The data to generate a schema from
 * @returns The generated schema
 */
export declare const generateSchemaFromData: (data: any[]) => DataSchema;
/**
 * Determine the type of a field based on its values
 * @param values The values to analyze
 * @returns The field type
 */
export declare const determineFieldType: (values: any[]) => 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'unknown';
/**
 * Calculate statistics for a field
 * @param values The values to analyze
 * @param fieldType The type of the field
 * @returns Field statistics
 */
export declare const calculateFieldStatistics: (values: any[], fieldType: string) => any;
/**
 * Calculate standard deviation
 * @param values The values to calculate standard deviation for
 * @param mean The mean of the values
 * @returns The standard deviation
 */
export declare const calculateStandardDeviation: (values: number[], mean: number) => number;
