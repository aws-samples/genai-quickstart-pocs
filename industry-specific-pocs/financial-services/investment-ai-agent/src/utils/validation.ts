/**
 * Validation utilities for the investment AI agent
 */

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string, public code?: string) {
    super(message);
    this.name = 'ValidationError';
  }
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
export function validateData(data: any, schema: Record<string, any>): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Check each field in the schema
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    // Check required fields
    if (rules.required && (value === undefined || value === null)) {
      errors.push(new ValidationError(`${field} is required`, field, 'REQUIRED'));
      continue;
    }
    
    // Skip validation for undefined optional fields
    if (value === undefined) {
      continue;
    }
    
    // Type validation
    if (rules.type === 'string' && typeof value !== 'string') {
      errors.push(new ValidationError(`${field} must be a string`, field, 'INVALID_TYPE'));
    }
    
    if (rules.type === 'number' && typeof value !== 'number') {
      errors.push(new ValidationError(`${field} must be a number`, field, 'INVALID_TYPE'));
    }
    
    if (rules.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(new ValidationError(`${field} must be a boolean`, field, 'INVALID_TYPE'));
    }
    
    if (rules.type === 'array' && !Array.isArray(value)) {
      errors.push(new ValidationError(`${field} must be an array`, field, 'INVALID_TYPE'));
    }
    
    if (rules.type === 'object' && (typeof value !== 'object' || value === null || Array.isArray(value))) {
      errors.push(new ValidationError(`${field} must be an object`, field, 'INVALID_TYPE'));
    }
    
    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(new ValidationError(`${field} must be one of: ${rules.enum.join(', ')}`, field, 'INVALID_VALUE'));
    }
    
    // Min/max validation for numbers
    if (rules.type === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(new ValidationError(`${field} must be at least ${rules.min}`, field, 'INVALID_VALUE'));
      }
      
      if (rules.max !== undefined && value > rules.max) {
        errors.push(new ValidationError(`${field} must be at most ${rules.max}`, field, 'INVALID_VALUE'));
      }
    }
    
    // Min/max length validation for strings
    if (rules.type === 'string') {
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        errors.push(new ValidationError(`${field} must be at least ${rules.minLength} characters`, field, 'INVALID_LENGTH'));
      }
      
      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        errors.push(new ValidationError(`${field} must be at most ${rules.maxLength} characters`, field, 'INVALID_LENGTH'));
      }
    }
    
    // Array item validation
    if (rules.type === 'array' && Array.isArray(value) && rules.itemType) {
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        
        if (rules.itemType === 'string' && typeof item !== 'string') {
          errors.push(new ValidationError(`${field}[${i}] must be a string`, field, 'INVALID_ITEM_TYPE'));
        }
        
        if (rules.itemType === 'number' && typeof item !== 'number') {
          errors.push(new ValidationError(`${field}[${i}] must be a number`, field, 'INVALID_ITEM_TYPE'));
        }
        
        if (rules.itemType === 'boolean' && typeof item !== 'boolean') {
          errors.push(new ValidationError(`${field}[${i}] must be a boolean`, field, 'INVALID_ITEM_TYPE'));
        }
        
        if (rules.itemType === 'object' && (typeof item !== 'object' || item === null || Array.isArray(item))) {
          errors.push(new ValidationError(`${field}[${i}] must be an object`, field, 'INVALID_ITEM_TYPE'));
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate a market data feed configuration
 * @param config Market data feed configuration
 * @returns Validation result
 */
export function validateMarketDataFeedConfig(config: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Required fields
  if (!config.provider) {
    errors.push(new ValidationError('Provider is required', 'provider', 'REQUIRED'));
  }
  
  if (!Array.isArray(config.dataTypes) || config.dataTypes.length === 0) {
    errors.push(new ValidationError('At least one data type is required', 'dataTypes', 'REQUIRED'));
  }
  
  if (!Array.isArray(config.symbols) || config.symbols.length === 0) {
    errors.push(new ValidationError('At least one symbol is required', 'symbols', 'REQUIRED'));
  }
  
  if (!config.interval) {
    errors.push(new ValidationError('Interval is required', 'interval', 'REQUIRED'));
  }
  
  // Type validations
  const validDataTypes = [
    'price', 'volume', 'order-book', 'technical-indicators', 
    'news-sentiment', 'economic-indicators', 'volatility-metrics',
    'options-data', 'futures-data', 'forex-data'
  ];
  
  if (Array.isArray(config.dataTypes)) {
    for (const dataType of config.dataTypes) {
      if (!validDataTypes.includes(dataType)) {
        errors.push(new ValidationError(`Invalid data type: ${dataType}`, 'dataTypes', 'INVALID_TYPE'));
      }
    }
  }
  
  const validIntervals = [
    'tick', '1min', '5min', '15min', '30min', 
    '1hour', '4hour', 'daily', 'weekly', 'monthly'
  ];
  
  if (config.interval && !validIntervals.includes(config.interval)) {
    errors.push(new ValidationError(`Invalid interval: ${config.interval}`, 'interval', 'INVALID_TYPE'));
  }
  
  // Numeric validations
  if (config.maxHistoricalDays !== undefined && (isNaN(config.maxHistoricalDays) || config.maxHistoricalDays < 1)) {
    errors.push(new ValidationError('Max historical days must be a positive number', 'maxHistoricalDays', 'INVALID_NUMBER'));
  }
  
  if (config.refreshInterval !== undefined && (isNaN(config.refreshInterval) || config.refreshInterval < 1000)) {
    errors.push(new ValidationError('Refresh interval must be at least 1000 milliseconds', 'refreshInterval', 'INVALID_NUMBER'));
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}/**
 * 
Validate a market data point
 * @param dataPoint Market data point
 * @returns Validation result
 */
export function validateMarketDataPoint(dataPoint: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Required fields
  if (!dataPoint.id) {
    errors.push(new ValidationError('ID is required', 'id', 'REQUIRED'));
  }
  
  if (!dataPoint.symbol) {
    errors.push(new ValidationError('Symbol is required', 'symbol', 'REQUIRED'));
  }
  
  if (!dataPoint.dataType) {
    errors.push(new ValidationError('Data type is required', 'dataType', 'REQUIRED'));
  }
  
  if (!dataPoint.timestamp) {
    errors.push(new ValidationError('Timestamp is required', 'timestamp', 'REQUIRED'));
  }
  
  if (dataPoint.value === undefined) {
    errors.push(new ValidationError('Value is required', 'value', 'REQUIRED'));
  }
  
  if (!dataPoint.source) {
    errors.push(new ValidationError('Source is required', 'source', 'REQUIRED'));
  }
  
  if (!dataPoint.interval) {
    errors.push(new ValidationError('Interval is required', 'interval', 'REQUIRED'));
  }
  
  // Type validations
  const validDataTypes = [
    'price', 'volume', 'order-book', 'technical-indicators', 
    'news-sentiment', 'economic-indicators', 'volatility-metrics',
    'options-data', 'futures-data', 'forex-data'
  ];
  
  if (dataPoint.dataType && !validDataTypes.includes(dataPoint.dataType)) {
    errors.push(new ValidationError(`Invalid data type: ${dataPoint.dataType}`, 'dataType', 'INVALID_TYPE'));
  }
  
  const validIntervals = [
    'tick', '1min', '5min', '15min', '30min', 
    '1hour', '4hour', 'daily', 'weekly', 'monthly'
  ];
  
  if (dataPoint.interval && !validIntervals.includes(dataPoint.interval)) {
    errors.push(new ValidationError(`Invalid interval: ${dataPoint.interval}`, 'interval', 'INVALID_TYPE'));
  }
  
  // Timestamp validation
  if (dataPoint.timestamp && !(dataPoint.timestamp instanceof Date) && isNaN(new Date(dataPoint.timestamp).getTime())) {
    errors.push(new ValidationError('Invalid timestamp', 'timestamp', 'INVALID_DATE'));
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate a market alert configuration
 * @param alertConfig Market alert configuration
 * @returns Validation result
 */
export function validateMarketAlertConfig(alertConfig: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Required fields
  if (!alertConfig.name) {
    errors.push(new ValidationError('Name is required', 'name', 'REQUIRED'));
  }
  
  if (!alertConfig.symbol) {
    errors.push(new ValidationError('Symbol is required', 'symbol', 'REQUIRED'));
  }
  
  if (!alertConfig.dataType) {
    errors.push(new ValidationError('Data type is required', 'dataType', 'REQUIRED'));
  }
  
  if (!alertConfig.condition) {
    errors.push(new ValidationError('Condition is required', 'condition', 'REQUIRED'));
  }
  
  if (alertConfig.threshold === undefined) {
    errors.push(new ValidationError('Threshold is required', 'threshold', 'REQUIRED'));
  }
  
  if (alertConfig.enabled === undefined) {
    errors.push(new ValidationError('Enabled flag is required', 'enabled', 'REQUIRED'));
  }
  
  if (!alertConfig.userId) {
    errors.push(new ValidationError('User ID is required', 'userId', 'REQUIRED'));
  }
  
  if (!Array.isArray(alertConfig.notificationChannels) || alertConfig.notificationChannels.length === 0) {
    errors.push(new ValidationError('At least one notification channel is required', 'notificationChannels', 'REQUIRED'));
  }
  
  // Type validations
  const validDataTypes = [
    'price', 'volume', 'order-book', 'technical-indicators', 
    'news-sentiment', 'economic-indicators', 'volatility-metrics',
    'options-data', 'futures-data', 'forex-data'
  ];
  
  if (alertConfig.dataType && !validDataTypes.includes(alertConfig.dataType)) {
    errors.push(new ValidationError(`Invalid data type: ${alertConfig.dataType}`, 'dataType', 'INVALID_TYPE'));
  }
  
  const validConditions = [
    'greater-than', 'less-than', 'equal-to', 'percent-change-up',
    'percent-change-down', 'crosses-above', 'crosses-below',
    'volume-spike', 'volatility-increase', 'custom'
  ];
  
  if (alertConfig.condition && !validConditions.includes(alertConfig.condition)) {
    errors.push(new ValidationError(`Invalid condition: ${alertConfig.condition}`, 'condition', 'INVALID_TYPE'));
  }
  
  const validComparisonValues = ['previous', 'moving-average', 'fixed'];
  
  if (alertConfig.comparisonValue && !validComparisonValues.includes(alertConfig.comparisonValue)) {
    errors.push(new ValidationError(`Invalid comparison value: ${alertConfig.comparisonValue}`, 'comparisonValue', 'INVALID_TYPE'));
  }
  
  // Numeric validations
  if (alertConfig.threshold !== undefined && isNaN(alertConfig.threshold)) {
    errors.push(new ValidationError('Threshold must be a number', 'threshold', 'INVALID_NUMBER'));
  }
  
  if (alertConfig.movingAveragePeriod !== undefined && (isNaN(alertConfig.movingAveragePeriod) || alertConfig.movingAveragePeriod < 1)) {
    errors.push(new ValidationError('Moving average period must be a positive number', 'movingAveragePeriod', 'INVALID_NUMBER'));
  }
  
  if (alertConfig.cooldownPeriod !== undefined && (isNaN(alertConfig.cooldownPeriod) || alertConfig.cooldownPeriod < 0)) {
    errors.push(new ValidationError('Cooldown period must be a non-negative number', 'cooldownPeriod', 'INVALID_NUMBER'));
  }
  
  // Notification channel validations
  if (Array.isArray(alertConfig.notificationChannels)) {
    for (let i = 0; i < alertConfig.notificationChannels.length; i++) {
      const channel = alertConfig.notificationChannels[i];
      
      if (!channel.type) {
        errors.push(new ValidationError(`Notification channel type is required`, `notificationChannels[${i}].type`, 'REQUIRED'));
      }
      
      if (!channel.destination) {
        errors.push(new ValidationError(`Notification channel destination is required`, `notificationChannels[${i}].destination`, 'REQUIRED'));
      }
      
      if (channel.enabled === undefined) {
        errors.push(new ValidationError(`Notification channel enabled flag is required`, `notificationChannels[${i}].enabled`, 'REQUIRED'));
      }
      
      const validChannelTypes = ['email', 'sms', 'push', 'webhook'];
      
      if (channel.type && !validChannelTypes.includes(channel.type)) {
        errors.push(new ValidationError(`Invalid notification channel type: ${channel.type}`, `notificationChannels[${i}].type`, 'INVALID_TYPE'));
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}