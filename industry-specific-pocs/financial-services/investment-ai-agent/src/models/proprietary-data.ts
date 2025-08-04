/**
 * Models for proprietary data integration
 */

import { DataMetadata } from './services';

/**
 * Represents a proprietary data file uploaded by a user
 */
export interface ProprietaryDataFile {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: 'csv' | 'pdf' | 'excel' | 'json' | 'other';
  uploadDate: Date;
  userId: string;
  organizationId: string;
  metadata: DataMetadata;
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
  processingError?: string;
  accessControl: AccessControl;
  storageLocation: string;
  extractedData?: any;
}

/**
 * Access control settings for proprietary data
 */
export interface AccessControl {
  visibility: 'public' | 'organization' | 'role' | 'user';
  allowedOrganizations?: string[];
  allowedRoles?: string[];
  allowedUsers?: string[];
}

/**
 * Represents the result of a data extraction operation
 */
export interface DataExtractionResult {
  success: boolean;
  dataType: 'tabular' | 'text' | 'mixed' | 'unknown';
  extractedData?: any;
  schema?: DataSchema;
  error?: string;
  processingTime: number;
  extractionMethod: string;
}

/**
 * Schema information for extracted data
 */
export interface DataSchema {
  fields: DataField[];
  rowCount?: number;
  dataTypes: Record<string, string>;
  statistics?: Record<string, FieldStatistics>;
}

/**
 * Field information for data schema
 */
export interface DataField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'unknown';
  nullable: boolean;
  description?: string;
  format?: string;
  constraints?: Record<string, any>;
}

/**
 * Statistical information about a data field
 */
export interface FieldStatistics {
  count: number;
  nullCount: number;
  uniqueCount?: number;
  min?: number | string | Date;
  max?: number | string | Date;
  mean?: number;
  median?: number;
  stdDev?: number;
  histogram?: Record<string, number>;
}

/**
 * Options for data normalization
 */
export interface NormalizationOptions {
  dateFormat?: string;
  numberFormat?: string;
  textCase?: 'upper' | 'lower' | 'title' | 'preserve';
  handleNulls?: 'keep' | 'remove' | 'replace';
  nullReplacement?: any;
  trimWhitespace?: boolean;
  removeSpecialChars?: boolean;
  customTransformations?: Record<string, (value: any) => any>;
}

/**
 * Result of a data normalization operation
 */
export interface NormalizationResult {
  success: boolean;
  normalizedData: any;
  transformations: string[];
  warnings: string[];
  error?: string;
}