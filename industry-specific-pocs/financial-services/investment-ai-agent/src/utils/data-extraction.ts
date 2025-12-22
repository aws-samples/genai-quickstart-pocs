/**
 * Utilities for extracting data from various file formats
 */

import { DataExtractionResult, DataSchema, DataField } from '../models/proprietary-data';
import { detectCSVDelimiter, hasCSVHeader } from './file-utils';

/**
 * Extract data from a CSV file
 * @param content The content of the CSV file
 * @returns Extraction result
 */
export const extractFromCSV = (content: string): DataExtractionResult => {
  try {
    const startTime = Date.now();
    
    // Detect delimiter
    const delimiter = detectCSVDelimiter(content);
    
    // Split into lines
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      return {
        success: false,
        dataType: 'tabular',
        error: 'Empty CSV file',
        processingTime: Date.now() - startTime,
        extractionMethod: 'csv-parser'
      };
    }
    
    // Check if the file has a header
    const hasHeader = hasCSVHeader(content, delimiter);
    
    // Parse header
    const headerRow = lines[0].split(delimiter).map(h => h.trim().replace(/^["'](.*)["']$/, '$1'));
    
    // Parse data rows
    const dataStartIndex = hasHeader ? 1 : 0;
    const data = [];
    
    for (let i = dataStartIndex; i < lines.length; i++) {
      const row = lines[i].split(delimiter).map(cell => {
        // Remove quotes if present
        const trimmed = cell.trim();
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
          return trimmed.substring(1, trimmed.length - 1);
        }
        return trimmed;
      });
      
      // Create object from row
      const rowObject: Record<string, any> = {};
      for (let j = 0; j < row.length; j++) {
        const key = j < headerRow.length ? headerRow[j] : `Column${j + 1}`;
        
        // Try to convert to number if possible
        const value = row[j];
        if (!isNaN(Number(value)) && value.trim() !== '') {
          rowObject[key] = Number(value);
        } else if (value.toLowerCase() === 'true') {
          rowObject[key] = true;
        } else if (value.toLowerCase() === 'false') {
          rowObject[key] = false;
        } else if (value === '') {
          rowObject[key] = null;
        } else {
          rowObject[key] = value;
        }
      }
      
      data.push(rowObject);
    }
    
    // Generate schema
    const schema = generateSchemaFromData(data);
    
    return {
      success: true,
      dataType: 'tabular',
      extractedData: data,
      schema,
      processingTime: Date.now() - startTime,
      extractionMethod: 'csv-parser'
    };
  } catch (error) {
    return {
      success: false,
      dataType: 'tabular',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      processingTime: 0,
      extractionMethod: 'csv-parser'
    };
  }
};

/**
 * Extract data from a JSON file
 * @param content The content of the JSON file
 * @returns Extraction result
 */
export const extractFromJSON = (content: string): DataExtractionResult => {
  try {
    const startTime = Date.now();
    
    // Parse JSON
    const data = JSON.parse(content);
    
    // Determine data type
    let dataType: 'tabular' | 'text' | 'mixed' | 'unknown' = 'unknown';
    let schema: DataSchema | undefined;
    
    if (Array.isArray(data)) {
      if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
        dataType = 'tabular';
        schema = generateSchemaFromData(data);
      } else {
        dataType = 'mixed';
      }
    } else if (typeof data === 'object' && data !== null) {
      dataType = 'mixed';
    } else {
      dataType = 'text';
    }
    
    return {
      success: true,
      dataType,
      extractedData: data,
      schema,
      processingTime: Date.now() - startTime,
      extractionMethod: 'json-parser'
    };
  } catch (error) {
    return {
      success: false,
      dataType: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      processingTime: 0,
      extractionMethod: 'json-parser'
    };
  }
};

/**
 * Extract text content from a PDF file (mock implementation)
 * @param content The binary content of the PDF file
 * @returns Extraction result
 */
export const extractFromPDF = (content: ArrayBuffer): DataExtractionResult => {
  // This is a mock implementation
  // In a real implementation, we would use a PDF parsing library
  
  const startTime = Date.now();
  
  return {
    success: true,
    dataType: 'text',
    extractedData: 'This is a mock extraction of PDF content.',
    processingTime: Date.now() - startTime,
    extractionMethod: 'pdf-parser'
  };
};

/**
 * Extract data from an Excel file (mock implementation)
 * @param content The binary content of the Excel file
 * @returns Extraction result
 */
export const extractFromExcel = (content: ArrayBuffer): DataExtractionResult => {
  // This is a mock implementation
  // In a real implementation, we would use an Excel parsing library
  
  const startTime = Date.now();
  
  // Mock data
  const data = [
    { Column1: 'Value1', Column2: 123, Column3: true },
    { Column1: 'Value2', Column2: 456, Column3: false }
  ];
  
  const schema = generateSchemaFromData(data);
  
  return {
    success: true,
    dataType: 'tabular',
    extractedData: data,
    schema,
    processingTime: Date.now() - startTime,
    extractionMethod: 'excel-parser'
  };
};

/**
 * Generate a schema from data
 * @param data The data to generate a schema from
 * @returns The generated schema
 */
export const generateSchemaFromData = (data: any[]): DataSchema => {
  if (data.length === 0) {
    return {
      fields: [],
      dataTypes: {},
      rowCount: 0
    };
  }
  
  // Get all unique keys
  const allKeys = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });
  
  // Analyze each field
  const fields: DataField[] = [];
  const dataTypes: Record<string, string> = {};
  const statistics: Record<string, any> = {};
  
  allKeys.forEach(key => {
    // Get all values for this field
    const values = data.map(item => item[key]);
    
    // Determine field type
    const fieldType = determineFieldType(values);
    
    // Create field definition
    fields.push({
      name: key,
      type: fieldType,
      nullable: values.some(v => v === null || v === undefined)
    });
    
    // Record data type
    dataTypes[key] = fieldType;
    
    // Calculate statistics
    statistics[key] = calculateFieldStatistics(values, fieldType);
  });
  
  return {
    fields,
    dataTypes,
    rowCount: data.length,
    statistics
  };
};

/**
 * Determine the type of a field based on its values
 * @param values The values to analyze
 * @returns The field type
 */
export const determineFieldType = (values: any[]): 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'unknown' => {
  // Filter out null and undefined values
  const nonNullValues = values.filter(v => v !== null && v !== undefined);
  
  if (nonNullValues.length === 0) {
    return 'unknown';
  }
  
  // Check if all values are of the same type
  const firstType = typeof nonNullValues[0];
  const allSameType = nonNullValues.every(v => typeof v === firstType);
  
  if (allSameType) {
    switch (firstType) {
      case 'string':
        // Check if strings might be dates
        if (nonNullValues.every(v => !isNaN(Date.parse(v)))) {
          return 'date';
        }
        return 'string';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'object':
        if (nonNullValues[0] instanceof Date) {
          return 'date';
        } else if (Array.isArray(nonNullValues[0])) {
          return 'array';
        }
        return 'object';
      default:
        return 'unknown';
    }
  }
  
  // Mixed types - try to find a common type
  if (nonNullValues.every(v => typeof v === 'string' || typeof v === 'number')) {
    return 'string'; // Coerce to string if mix of strings and numbers
  }
  
  return 'unknown';
};

/**
 * Calculate statistics for a field
 * @param values The values to analyze
 * @param fieldType The type of the field
 * @returns Field statistics
 */
export const calculateFieldStatistics = (values: any[], fieldType: string): any => {
  const nonNullValues = values.filter(v => v !== null && v !== undefined);
  const count = values.length;
  const nullCount = count - nonNullValues.length;
  
  // Basic statistics for all types
  const stats = {
    count,
    nullCount,
    uniqueCount: new Set(values).size
  };
  
  // Type-specific statistics
  if (fieldType === 'number') {
    const numericValues = nonNullValues.map(v => Number(v));
    const sum = numericValues.reduce((acc, val) => acc + val, 0);
    const mean = sum / numericValues.length;
    
    // Sort for median and min/max
    const sorted = [...numericValues].sort((a, b) => a - b);
    
    return {
      ...stats,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean,
      median: sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)],
      stdDev: calculateStandardDeviation(numericValues, mean)
    };
  } else if (fieldType === 'string') {
    // For strings, calculate length statistics
    const lengths = nonNullValues.map(v => v.length);
    
    return {
      ...stats,
      minLength: Math.min(...lengths),
      maxLength: Math.max(...lengths),
      avgLength: lengths.reduce((acc, val) => acc + val, 0) / lengths.length
    };
  } else if (fieldType === 'date') {
    // For dates, find min and max
    const dates = nonNullValues.map(v => v instanceof Date ? v : new Date(v));
    const validDates = dates.filter(d => !isNaN(d.getTime()));
    
    if (validDates.length > 0) {
      return {
        ...stats,
        min: new Date(Math.min(...validDates.map(d => d.getTime()))),
        max: new Date(Math.max(...validDates.map(d => d.getTime())))
      };
    }
  }
  
  return stats;
};

/**
 * Calculate standard deviation
 * @param values The values to calculate standard deviation for
 * @param mean The mean of the values
 * @returns The standard deviation
 */
export const calculateStandardDeviation = (values: number[], mean: number): number => {
  if (values.length <= 1) {
    return 0;
  }
  
  const squaredDifferences = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / (values.length - 1);
  return Math.sqrt(variance);
};