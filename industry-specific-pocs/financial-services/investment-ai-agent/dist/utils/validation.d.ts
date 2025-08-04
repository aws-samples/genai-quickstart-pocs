/**
 * Validation utilities for the investment AI agent
 */
/**
 * Validation error class
 */
export declare class ValidationError extends Error {
    field?: string | undefined;
    code?: string | undefined;
    constructor(message: string, field?: string | undefined, code?: string | undefined);
}
/**
 * Validation result interface
 */
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}
/**
 * Validate data against a schema
 * @param data Data to validate
 * @param schema Schema to validate against
 * @returns Validation result
 */
export declare function validateData(data: any, schema: Record<string, any>): ValidationResult;
/**
 * Validate a market data feed configuration
 * @param config Market data feed configuration
 * @returns Validation result
 */
export declare function validateMarketDataFeedConfig(config: any): ValidationResult; /**
 *
Validate a market data point
 * @param dataPoint Market data point
 * @returns Validation result
 */
export declare function validateMarketDataPoint(dataPoint: any): ValidationResult;
/**
 * Validate a market alert configuration
 * @param alertConfig Market alert configuration
 * @returns Validation result
 */
export declare function validateMarketAlertConfig(alertConfig: any): ValidationResult;
