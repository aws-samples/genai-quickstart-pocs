"use strict";
/**
 * Validation utilities for the investment AI agent
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMarketAlertConfig = exports.validateMarketDataPoint = exports.validateMarketDataFeedConfig = exports.validateData = exports.ValidationError = void 0;
/**
 * Validation error class
 */
class ValidationError extends Error {
    constructor(message, field, code) {
        super(message);
        this.field = field;
        this.code = code;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
/**
 * Validate data against a schema
 * @param data Data to validate
 * @param schema Schema to validate against
 * @returns Validation result
 */
function validateData(data, schema) {
    const errors = [];
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
exports.validateData = validateData;
/**
 * Validate a market data feed configuration
 * @param config Market data feed configuration
 * @returns Validation result
 */
function validateMarketDataFeedConfig(config) {
    const errors = [];
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
} /**
 *
Validate a market data point
 * @param dataPoint Market data point
 * @returns Validation result
 */
exports.validateMarketDataFeedConfig = validateMarketDataFeedConfig;
function validateMarketDataPoint(dataPoint) {
    const errors = [];
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
exports.validateMarketDataPoint = validateMarketDataPoint;
/**
 * Validate a market alert configuration
 * @param alertConfig Market alert configuration
 * @returns Validation result
 */
function validateMarketAlertConfig(alertConfig) {
    const errors = [];
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
exports.validateMarketAlertConfig = validateMarketAlertConfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy92YWxpZGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7O0FBRUg7O0dBRUc7QUFDSCxNQUFhLGVBQWdCLFNBQVEsS0FBSztJQUN4QyxZQUFZLE9BQWUsRUFBUyxLQUFjLEVBQVMsSUFBYTtRQUN0RSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFEbUIsVUFBSyxHQUFMLEtBQUssQ0FBUztRQUFTLFNBQUksR0FBSixJQUFJLENBQVM7UUFFdEUsSUFBSSxDQUFDLElBQUksR0FBRyxpQkFBaUIsQ0FBQztJQUNoQyxDQUFDO0NBQ0Y7QUFMRCwwQ0FLQztBQVVEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsWUFBWSxDQUFDLElBQVMsRUFBRSxNQUEyQjtJQUNqRSxNQUFNLE1BQU0sR0FBc0IsRUFBRSxDQUFDO0lBRXJDLGlDQUFpQztJQUNqQyxLQUFLLE1BQU0sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtRQUNuRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFMUIsd0JBQXdCO1FBQ3hCLElBQUksS0FBSyxDQUFDLFFBQVEsSUFBSSxDQUFDLEtBQUssS0FBSyxTQUFTLElBQUksS0FBSyxLQUFLLElBQUksQ0FBQyxFQUFFO1lBQzdELE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxlQUFlLENBQUMsR0FBRyxLQUFLLGNBQWMsRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUM1RSxTQUFTO1NBQ1Y7UUFFRCxnREFBZ0Q7UUFDaEQsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1lBQ3ZCLFNBQVM7U0FDVjtRQUVELGtCQUFrQjtRQUNsQixJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssUUFBUSxJQUFJLE9BQU8sS0FBSyxL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biAqIFZhbGlkYXRpb24gdXRpbGl0aWVzIGZvciB0aGUgaW52ZXN0bWVudCBBSSBhZ2VudFxuICovXG5cbi8qKlxuICogVmFsaWRhdGlvbiBlcnJvciBjbGFzc1xuICovXG5leHBvcnQgY2xhc3MgVmFsaWRhdGlvbkVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcsIHB1YmxpYyBmaWVsZD86IHN0cmluZywgcHVibGljIGNvZGU/OiBzdHJpbmcpIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm5hbWUgPSAnVmFsaWRhdGlvbkVycm9yJztcbiAgfVxufVxuXG4vKipcbiAqIFZhbGlkYXRpb24gcmVzdWx0IGludGVyZmFjZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFZhbGlkYXRpb25SZXN1bHQge1xuICB2YWxpZDogYm9vbGVhbjtcbiAgZXJyb3JzOiBWYWxpZGF0aW9uRXJyb3JbXTtcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSBkYXRhIGFnYWluc3QgYSBzY2hlbWFcbiAqIEBwYXJhbSBkYXRhIERhdGEgdG8gdmFsaWRhdGVcbiAqIEBwYXJhbSBzY2hlbWEgU2NoZW1hIHRvIHZhbGlkYXRlIGFnYWluc3RcbiAqIEByZXR1cm5zIFZhbGlkYXRpb24gcmVzdWx0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZURhdGEoZGF0YTogYW55LCBzY2hlbWE6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBWYWxpZGF0aW9uUmVzdWx0IHtcbiAgY29uc3QgZXJyb3JzOiBWYWxpZGF0aW9uRXJyb3JbXSA9IFtdO1xuICBcbiAgLy8gQ2hlY2sgZWFjaCBmaWVsZCBpbiB0aGUgc2NoZW1hXG4gIGZvciAoY29uc3QgW2ZpZWxkLCBydWxlc10gb2YgT2JqZWN0LmVudHJpZXMoc2NoZW1hKSkge1xuICAgIGNvbnN0IHZhbHVlID0gZGF0YVtmaWVsZF07XG4gICAgXG4gICAgLy8gQ2hlY2sgcmVxdWlyZWQgZmllbGRzXG4gICAgaWYgKHJ1bGVzLnJlcXVpcmVkICYmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsKSkge1xuICAgICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcihgJHtmaWVsZH0gaXMgcmVxdWlyZWRgLCBmaWVsZCwgJ1JFUVVJUkVEJykpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIFxuICAgIC8vIFNraXAgdmFsaWRhdGlvbiBmb3IgdW5kZWZpbmVkIG9wdGlvbmFsIGZpZWxkc1xuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgXG4gICAgLy8gVHlwZSB2YWxpZGF0aW9uXG4gICAgaWYgKHJ1bGVzLnR5cGUgPT09ICdzdHJpbmcnICYmIHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoYCR7ZmllbGR9IG11c3QgYmUgYSBzdHJpbmdgLCBmaWVsZCwgJ0lOVkFMSURfVFlQRScpKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKHJ1bGVzLnR5cGUgPT09ICdudW1iZXInICYmIHR5cGVvZiB2YWx1ZSAhPT0gJ251bWJlcicpIHtcbiAgICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoYCR7ZmllbGR9IG11c3QgYmUgYSBudW1iZXJgLCBmaWVsZCwgJ0lOVkFMSURfVFlQRScpKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKHJ1bGVzLnR5cGUgPT09ICdib29sZWFuJyAmJiB0eXBlb2YgdmFsdWUgIT09ICdib29sZWFuJykge1xuICAgICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcihgJHtmaWVsZH0gbXVzdCBiZSBhIGJvb2xlYW5gLCBmaWVsZCwgJ0lOVkFMSURfVFlQRScpKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKHJ1bGVzLnR5cGUgPT09ICdhcnJheScgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICBlcnJvcnMucHVzaChuZXcgVmFsaWRhdGlvbkVycm9yKGAke2ZpZWxkfSBtdXN0IGJlIGFuIGFycmF5YCwgZmllbGQsICdJTlZBTElEX1RZUEUnKSk7XG4gICAgfVxuICAgIFxuICAgIGlmIChydWxlcy50eXBlID09PSAnb2JqZWN0JyAmJiAodHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0JyB8fCB2YWx1ZSA9PT0gbnVsbCB8fCBBcnJheS5pc0FycmF5KHZhbHVlKSkpIHtcbiAgICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoYCR7ZmllbGR9IG11c3QgYmUgYW4gb2JqZWN0YCwgZmllbGQsICdJTlZBTElEX1RZUEUnKSk7XG4gICAgfVxuICAgIFxuICAgIC8vIEVudW0gdmFsaWRhdGlvblxuICAgIGlmIChydWxlcy5lbnVtICYmICFydWxlcy5lbnVtLmluY2x1ZGVzKHZhbHVlKSkge1xuICAgICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcihgJHtmaWVsZH0gbXVzdCBiZSBvbmUgb2Y6ICR7cnVsZXMuZW51bS5qb2luKCcsICcpfWAsIGZpZWxkLCAnSU5WQUxJRF9WQUxVRScpKTtcbiAgICB9XG4gICAgXG4gICAgLy8gTWluL21heCB2YWxpZGF0aW9uIGZvciBudW1iZXJzXG4gICAgaWYgKHJ1bGVzLnR5cGUgPT09ICdudW1iZXInKSB7XG4gICAgICBpZiAocnVsZXMubWluICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgPCBydWxlcy5taW4pIHtcbiAgICAgICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcihgJHtmaWVsZH0gbXVzdCBiZSBhdCBsZWFzdCAke3J1bGVzLm1pbn1gLCBmaWVsZCwgJ0lOVkFMSURfVkFMVUUnKSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGlmIChydWxlcy5tYXggIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSA+IHJ1bGVzLm1heCkge1xuICAgICAgICBlcnJvcnMucHVzaChuZXcgVmFsaWRhdGlvbkVycm9yKGAke2ZpZWxkfSBtdXN0IGJlIGF0IG1vc3QgJHtydWxlcy5tYXh9YCwgZmllbGQsICdJTlZBTElEX1ZBTFVFJykpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBNaW4vbWF4IGxlbmd0aCB2YWxpZGF0aW9uIGZvciBzdHJpbmdzXG4gICAgaWYgKHJ1bGVzLnR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBpZiAocnVsZXMubWluTGVuZ3RoICE9PSB1bmRlZmluZWQgJiYgdmFsdWUubGVuZ3RoIDwgcnVsZXMubWluTGVuZ3RoKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoYCR7ZmllbGR9IG11c3QgYmUgYXQgbGVhc3QgJHtydWxlcy5taW5MZW5ndGh9IGNoYXJhY3RlcnNgLCBmaWVsZCwgJ0lOVkFMSURfTEVOR1RIJykpO1xuICAgICAgfVxuICAgICAgXG4gICAgICBpZiAocnVsZXMubWF4TGVuZ3RoICE9PSB1bmRlZmluZWQgJiYgdmFsdWUubGVuZ3RoID4gcnVsZXMubWF4TGVuZ3RoKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoYCR7ZmllbGR9IG11c3QgYmUgYXQgbW9zdCAke3J1bGVzLm1heExlbmd0aH0gY2hhcmFjdGVyc2AsIGZpZWxkLCAnSU5WQUxJRF9MRU5HVEgnKSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIEFycmF5IGl0ZW0gdmFsaWRhdGlvblxuICAgIGlmIChydWxlcy50eXBlID09PSAnYXJyYXknICYmIEFycmF5LmlzQXJyYXkodmFsdWUpICYmIHJ1bGVzLml0ZW1UeXBlKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSB2YWx1ZVtpXTtcbiAgICAgICAgXG4gICAgICAgIGlmIChydWxlcy5pdGVtVHlwZSA9PT0gJ3N0cmluZycgJiYgdHlwZW9mIGl0ZW0gIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcihgJHtmaWVsZH1bJHtpfV0gbXVzdCBiZSBhIHN0cmluZ2AsIGZpZWxkLCAnSU5WQUxJRF9JVEVNX1RZUEUnKSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChydWxlcy5pdGVtVHlwZSA9PT0gJ251bWJlcicgJiYgdHlwZW9mIGl0ZW0gIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcihgJHtmaWVsZH1bJHtpfV0gbXVzdCBiZSBhIG51bWJlcmAsIGZpZWxkLCAnSU5WQUxJRF9JVEVNX1RZUEUnKSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChydWxlcy5pdGVtVHlwZSA9PT0gJ2Jvb2xlYW4nICYmIHR5cGVvZiBpdGVtICE9PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICBlcnJvcnMucHVzaChuZXcgVmFsaWRhdGlvbkVycm9yKGAke2ZpZWxkfVske2l9XSBtdXN0IGJlIGEgYm9vbGVhbmAsIGZpZWxkLCAnSU5WQUxJRF9JVEVNX1RZUEUnKSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChydWxlcy5pdGVtVHlwZSA9PT0gJ29iamVjdCcgJiYgKHR5cGVvZiBpdGVtICE9PSAnb2JqZWN0JyB8fCBpdGVtID09PSBudWxsIHx8IEFycmF5LmlzQXJyYXkoaXRlbSkpKSB7XG4gICAgICAgICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcihgJHtmaWVsZH1bJHtpfV0gbXVzdCBiZSBhbiBvYmplY3RgLCBmaWVsZCwgJ0lOVkFMSURfSVRFTV9UWVBFJykpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICByZXR1cm4ge1xuICAgIHZhbGlkOiBlcnJvcnMubGVuZ3RoID09PSAwLFxuICAgIGVycm9yc1xuICB9O1xufVxuXG4vKipcbiAqIFZhbGlkYXRlIGEgbWFya2V0IGRhdGEgZmVlZCBjb25maWd1cmF0aW9uXG4gKiBAcGFyYW0gY29uZmlnIE1hcmtldCBkYXRhIGZlZWQgY29uZmlndXJhdGlvblxuICogQHJldHVybnMgVmFsaWRhdGlvbiByZXN1bHRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlTWFya2V0RGF0YUZlZWRDb25maWcoY29uZmlnOiBhbnkpOiBWYWxpZGF0aW9uUmVzdWx0IHtcbiAgY29uc3QgZXJyb3JzOiBWYWxpZGF0aW9uRXJyb3JbXSA9IFtdO1xuICBcbiAgLy8gUmVxdWlyZWQgZmllbGRzXG4gIGlmICghY29uZmlnLnByb3ZpZGVyKSB7XG4gICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcignUHJvdmlkZXIgaXMgcmVxdWlyZWQnLCAncHJvdmlkZXInLCAnUkVRVUlSRUQnKSk7XG4gIH1cbiAgXG4gIGlmICghQXJyYXkuaXNBcnJheShjb25maWcuZGF0YVR5cGVzKSB8fCBjb25maWcuZGF0YVR5cGVzLmxlbmd0aCA9PT0gMCkge1xuICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0F0IGxlYXN0IG9uZSBkYXRhIHR5cGUgaXMgcmVxdWlyZWQnLCAnZGF0YVR5cGVzJywgJ1JFUVVJUkVEJykpO1xuICB9XG4gIFxuICBpZiAoIUFycmF5LmlzQXJyYXkoY29uZmlnLnN5bWJvbHMpIHx8IGNvbmZpZy5zeW1ib2xzLmxlbmd0aCA9PT0gMCkge1xuICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0F0IGxlYXN0IG9uZSBzeW1ib2wgaXMgcmVxdWlyZWQnLCAnc3ltYm9scycsICdSRVFVSVJFRCcpKTtcbiAgfVxuICBcbiAgaWYgKCFjb25maWcuaW50ZXJ2YWwpIHtcbiAgICBlcnJvcnMucHVzaChuZXcgVmFsaWRhdGlvbkVycm9yKCdJbnRlcnZhbCBpcyByZXF1aXJlZCcsICdpbnRlcnZhbCcsICdSRVFVSVJFRCcpKTtcbiAgfVxuICBcbiAgLy8gVHlwZSB2YWxpZGF0aW9uc1xuICBjb25zdCB2YWxpZERhdGFUeXBlcyA9IFtcbiAgICAncHJpY2UnLCAndm9sdW1lJywgJ29yZGVyLWJvb2snLCAndGVjaG5pY2FsLWluZGljYXRvcnMnLCBcbiAgICAnbmV3cy1zZW50aW1lbnQnLCAnZWNvbm9taWMtaW5kaWNhdG9ycycsICd2b2xhdGlsaXR5LW1ldHJpY3MnLFxuICAgICdvcHRpb25zLWRhdGEnLCAnZnV0dXJlcy1kYXRhJywgJ2ZvcmV4LWRhdGEnXG4gIF07XG4gIFxuICBpZiAoQXJyYXkuaXNBcnJheShjb25maWcuZGF0YVR5cGVzKSkge1xuICAgIGZvciAoY29uc3QgZGF0YVR5cGUgb2YgY29uZmlnLmRhdGFUeXBlcykge1xuICAgICAgaWYgKCF2YWxpZERhdGFUeXBlcy5pbmNsdWRlcyhkYXRhVHlwZSkpIHtcbiAgICAgICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcihgSW52YWxpZCBkYXRhIHR5cGU6ICR7ZGF0YVR5cGV9YCwgJ2RhdGFUeXBlcycsICdJTlZBTElEX1RZUEUnKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICBjb25zdCB2YWxpZEludGVydmFscyA9IFtcbiAgICAndGljaycsICcxbWluJywgJzVtaW4nLCAnMTVtaW4nLCAnMzBtaW4nLCBcbiAgICAnMWhvdXInLCAnNGhvdXInLCAnZGFpbHknLCAnd2Vla2x5JywgJ21vbnRobHknXG4gIF07XG4gIFxuICBpZiAoY29uZmlnLmludGVydmFsICYmICF2YWxpZEludGVydmFscy5pbmNsdWRlcyhjb25maWcuaW50ZXJ2YWwpKSB7XG4gICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcihgSW52YWxpZCBpbnRlcnZhbDogJHtjb25maWcuaW50ZXJ2YWx9YCwgJ2ludGVydmFsJywgJ0lOVkFMSURfVFlQRScpKTtcbiAgfVxuICBcbiAgLy8gTnVtZXJpYyB2YWxpZGF0aW9uc1xuICBpZiAoY29uZmlnLm1heEhpc3RvcmljYWxEYXlzICE9PSB1bmRlZmluZWQgJiYgKGlzTmFOKGNvbmZpZy5tYXhIaXN0b3JpY2FsRGF5cykgfHwgY29uZmlnLm1heEhpc3RvcmljYWxEYXlzIDwgMSkpIHtcbiAgICBlcnJvcnMucHVzaChuZXcgVmFsaWRhdGlvbkVycm9yKCdNYXggaGlzdG9yaWNhbCBkYXlzIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInLCAnbWF4SGlzdG9yaWNhbERheXMnLCAnSU5WQUxJRF9OVU1CRVInKSk7XG4gIH1cbiAgXG4gIGlmIChjb25maWcucmVmcmVzaEludGVydmFsICE9PSB1bmRlZmluZWQgJiYgKGlzTmFOKGNvbmZpZy5yZWZyZXNoSW50ZXJ2YWwpIHx8IGNvbmZpZy5yZWZyZXNoSW50ZXJ2YWwgPCAxMDAwKSkge1xuICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1JlZnJlc2ggaW50ZXJ2YWwgbXVzdCBiZSBhdCBsZWFzdCAxMDAwIG1pbGxpc2Vjb25kcycsICdyZWZyZXNoSW50ZXJ2YWwnLCAnSU5WQUxJRF9OVU1CRVInKSk7XG4gIH1cbiAgXG4gIHJldHVybiB7XG4gICAgdmFsaWQ6IGVycm9ycy5sZW5ndGggPT09IDAsXG4gICAgZXJyb3JzXG4gIH07XG59LyoqXG4gKiBcblZhbGlkYXRlIGEgbWFya2V0IGRhdGEgcG9pbnRcbiAqIEBwYXJhbSBkYXRhUG9pbnQgTWFya2V0IGRhdGEgcG9pbnRcbiAqIEByZXR1cm5zIFZhbGlkYXRpb24gcmVzdWx0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZU1hcmtldERhdGFQb2ludChkYXRhUG9pbnQ6IGFueSk6IFZhbGlkYXRpb25SZXN1bHQge1xuICBjb25zdCBlcnJvcnM6IFZhbGlkYXRpb25FcnJvcltdID0gW107XG4gIFxuICAvLyBSZXF1aXJlZCBmaWVsZHNcbiAgaWYgKCFkYXRhUG9pbnQuaWQpIHtcbiAgICBlcnJvcnMucHVzaChuZXcgVmFsaWRhdGlvbkVycm9yKCdJRCBpcyByZXF1aXJlZCcsICdpZCcsICdSRVFVSVJFRCcpKTtcbiAgfVxuICBcbiAgaWYgKCFkYXRhUG9pbnQuc3ltYm9sKSB7XG4gICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcignU3ltYm9sIGlzIHJlcXVpcmVkJywgJ3N5bWJvbCcsICdSRVFVSVJFRCcpKTtcbiAgfVxuICBcbiAgaWYgKCFkYXRhUG9pbnQuZGF0YVR5cGUpIHtcbiAgICBlcnJvcnMucHVzaChuZXcgVmFsaWRhdGlvbkVycm9yKCdEYXRhIHR5cGUgaXMgcmVxdWlyZWQnLCAnZGF0YVR5cGUnLCAnUkVRVUlSRUQnKSk7XG4gIH1cbiAgXG4gIGlmICghZGF0YVBvaW50LnRpbWVzdGFtcCkge1xuICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1RpbWVzdGFtcCBpcyByZXF1aXJlZCcsICd0aW1lc3RhbXAnLCAnUkVRVUlSRUQnKSk7XG4gIH1cbiAgXG4gIGlmIChkYXRhUG9pbnQudmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1ZhbHVlIGlzIHJlcXVpcmVkJywgJ3ZhbHVlJywgJ1JFUVVJUkVEJykpO1xuICB9XG4gIFxuICBpZiAoIWRhdGFQb2ludC5zb3VyY2UpIHtcbiAgICBlcnJvcnMucHVzaChuZXcgVmFsaWRhdGlvbkVycm9yKCdTb3VyY2UgaXMgcmVxdWlyZWQnLCAnc291cmNlJywgJ1JFUVVJUkVEJykpO1xuICB9XG4gIFxuICBpZiAoIWRhdGFQb2ludC5pbnRlcnZhbCkge1xuICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0ludGVydmFsIGlzIHJlcXVpcmVkJywgJ2ludGVydmFsJywgJ1JFUVVJUkVEJykpO1xuICB9XG4gIFxuICAvLyBUeXBlIHZhbGlkYXRpb25zXG4gIGNvbnN0IHZhbGlkRGF0YVR5cGVzID0gW1xuICAgICdwcmljZScsICd2b2x1bWUnLCAnb3JkZXItYm9vaycsICd0ZWNobmljYWwtaW5kaWNhdG9ycycsIFxuICAgICduZXdzLXNlbnRpbWVudCcsICdlY29ub21pYy1pbmRpY2F0b3JzJywgJ3ZvbGF0aWxpdHktbWV0cmljcycsXG4gICAgJ29wdGlvbnMtZGF0YScsICdmdXR1cmVzLWRhdGEnLCAnZm9yZXgtZGF0YSdcbiAgXTtcbiAgXG4gIGlmIChkYXRhUG9pbnQuZGF0YVR5cGUgJiYgIXZhbGlkRGF0YVR5cGVzLmluY2x1ZGVzKGRhdGFQb2ludC5kYXRhVHlwZSkpIHtcbiAgICBlcnJvcnMucHVzaChuZXcgVmFsaWRhdGlvbkVycm9yKGBJbnZhbGlkIGRhdGEgdHlwZTogJHtkYXRhUG9pbnQuZGF0YVR5cGV9YCwgJ2RhdGFUeXBlJywgJ0lOVkFMSURfVFlQRScpKTtcbiAgfVxuICBcbiAgY29uc3QgdmFsaWRJbnRlcnZhbHMgPSBbXG4gICAgJ3RpY2snLCAnMW1pbicsICc1bWluJywgJzE1bWluJywgJzMwbWluJywgXG4gICAgJzFob3VyJywgJzRob3VyJywgJ2RhaWx5JywgJ3dlZWtseScsICdtb250aGx5J1xuICBdO1xuICBcbiAgaWYgKGRhdGFQb2ludC5pbnRlcnZhbCAmJiAhdmFsaWRJbnRlcnZhbHMuaW5jbHVkZXMoZGF0YVBvaW50LmludGVydmFsKSkge1xuICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoYEludmFsaWQgaW50ZXJ2YWw6ICR7ZGF0YVBvaW50LmludGVydmFsfWAsICdpbnRlcnZhbCcsICdJTlZBTElEX1RZUEUnKSk7XG4gIH1cbiAgXG4gIC8vIFRpbWVzdGFtcCB2YWxpZGF0aW9uXG4gIGlmIChkYXRhUG9pbnQudGltZXN0YW1wICYmICEoZGF0YVBvaW50LnRpbWVzdGFtcCBpbnN0YW5jZW9mIERhdGUpICYmIGlzTmFOKG5ldyBEYXRlKGRhdGFQb2ludC50aW1lc3RhbXApLmdldFRpbWUoKSkpIHtcbiAgICBlcnJvcnMucHVzaChuZXcgVmFsaWRhdGlvbkVycm9yKCdJbnZhbGlkIHRpbWVzdGFtcCcsICd0aW1lc3RhbXAnLCAnSU5WQUxJRF9EQVRFJykpO1xuICB9XG4gIFxuICByZXR1cm4ge1xuICAgIHZhbGlkOiBlcnJvcnMubGVuZ3RoID09PSAwLFxuICAgIGVycm9yc1xuICB9O1xufVxuXG4vKipcbiAqIFZhbGlkYXRlIGEgbWFya2V0IGFsZXJ0IGNvbmZpZ3VyYXRpb25cbiAqIEBwYXJhbSBhbGVydENvbmZpZyBNYXJrZXQgYWxlcnQgY29uZmlndXJhdGlvblxuICogQHJldHVybnMgVmFsaWRhdGlvbiByZXN1bHRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlTWFya2V0QWxlcnRDb25maWcoYWxlcnRDb25maWc6IGFueSk6IFZhbGlkYXRpb25SZXN1bHQge1xuICBjb25zdCBlcnJvcnM6IFZhbGlkYXRpb25FcnJvcltdID0gW107XG4gIFxuICAvLyBSZXF1aXJlZCBmaWVsZHNcbiAgaWYgKCFhbGVydENvbmZpZy5uYW1lKSB7XG4gICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcignTmFtZSBpcyByZXF1aXJlZCcsICduYW1lJywgJ1JFUVVJUkVEJykpO1xuICB9XG4gIFxuICBpZiAoIWFsZXJ0Q29uZmlnLnN5bWJvbCkge1xuICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1N5bWJvbCBpcyByZXF1aXJlZCcsICdzeW1ib2wnLCAnUkVRVUlSRUQnKSk7XG4gIH1cbiAgXG4gIGlmICghYWxlcnRDb25maWcuZGF0YVR5cGUpIHtcbiAgICBlcnJvcnMucHVzaChuZXcgVmFsaWRhdGlvbkVycm9yKCdEYXRhIHR5cGUgaXMgcmVxdWlyZWQnLCAnZGF0YVR5cGUnLCAnUkVRVUlSRUQnKSk7XG4gIH1cbiAgXG4gIGlmICghYWxlcnRDb25maWcuY29uZGl0aW9uKSB7XG4gICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcignQ29uZGl0aW9uIGlzIHJlcXVpcmVkJywgJ2NvbmRpdGlvbicsICdSRVFVSVJFRCcpKTtcbiAgfVxuICBcbiAgaWYgKGFsZXJ0Q29uZmlnLnRocmVzaG9sZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcignVGhyZXNob2xkIGlzIHJlcXVpcmVkJywgJ3RocmVzaG9sZCcsICdSRVFVSVJFRCcpKTtcbiAgfVxuICBcbiAgaWYgKGFsZXJ0Q29uZmlnLmVuYWJsZWQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0VuYWJsZWQgZmxhZyBpcyByZXF1aXJlZCcsICdlbmFibGVkJywgJ1JFUVVJUkVEJykpO1xuICB9XG4gIFxuICBpZiAoIWFsZXJ0Q29uZmlnLnVzZXJJZCkge1xuICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1VzZXIgSUQgaXMgcmVxdWlyZWQnLCAndXNlcklkJywgJ1JFUVVJUkVEJykpO1xuICB9XG4gIFxuICBpZiAoIUFycmF5LmlzQXJyYXkoYWxlcnRDb25maWcubm90aWZpY2F0aW9uQ2hhbm5lbHMpIHx8IGFsZXJ0Q29uZmlnLm5vdGlmaWNhdGlvbkNoYW5uZWxzLmxlbmd0aCA9PT0gMCkge1xuICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0F0IGxlYXN0IG9uZSBub3RpZmljYXRpb24gY2hhbm5lbCBpcyByZXF1aXJlZCcsICdub3RpZmljYXRpb25DaGFubmVscycsICdSRVFVSVJFRCcpKTtcbiAgfVxuICBcbiAgLy8gVHlwZSB2YWxpZGF0aW9uc1xuICBjb25zdCB2YWxpZERhdGFUeXBlcyA9IFtcbiAgICAncHJpY2UnLCAndm9sdW1lJywgJ29yZGVyLWJvb2snLCAndGVjaG5pY2FsLWluZGljYXRvcnMnLCBcbiAgICAnbmV3cy1zZW50aW1lbnQnLCAnZWNvbm9taWMtaW5kaWNhdG9ycycsICd2b2xhdGlsaXR5LW1ldHJpY3MnLFxuICAgICdvcHRpb25zLWRhdGEnLCAnZnV0dXJlcy1kYXRhJywgJ2ZvcmV4LWRhdGEnXG4gIF07XG4gIFxuICBpZiAoYWxlcnRDb25maWcuZGF0YVR5cGUgJiYgIXZhbGlkRGF0YVR5cGVzLmluY2x1ZGVzKGFsZXJ0Q29uZmlnLmRhdGFUeXBlKSkge1xuICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoYEludmFsaWQgZGF0YSB0eXBlOiAke2FsZXJ0Q29uZmlnLmRhdGFUeXBlfWAsICdkYXRhVHlwZScsICdJTlZBTElEX1RZUEUnKSk7XG4gIH1cbiAgXG4gIGNvbnN0IHZhbGlkQ29uZGl0aW9ucyA9IFtcbiAgICAnZ3JlYXRlci10aGFuJywgJ2xlc3MtdGhhbicsICdlcXVhbC10bycsICdwZXJjZW50LWNoYW5nZS11cCcsXG4gICAgJ3BlcmNlbnQtY2hhbmdlLWRvd24nLCAnY3Jvc3Nlcy1hYm92ZScsICdjcm9zc2VzLWJlbG93JyxcbiAgICAndm9sdW1lLXNwaWtlJywgJ3ZvbGF0aWxpdHktaW5jcmVhc2UnLCAnY3VzdG9tJ1xuICBdO1xuICBcbiAgaWYgKGFsZXJ0Q29uZmlnLmNvbmRpdGlvbiAmJiAhdmFsaWRDb25kaXRpb25zLmluY2x1ZGVzKGFsZXJ0Q29uZmlnLmNvbmRpdGlvbikpIHtcbiAgICBlcnJvcnMucHVzaChuZXcgVmFsaWRhdGlvbkVycm9yKGBJbnZhbGlkIGNvbmRpdGlvbjogJHthbGVydENvbmZpZy5jb25kaXRpb259YCwgJ2NvbmRpdGlvbicsICdJTlZBTElEX1RZUEUnKSk7XG4gIH1cbiAgXG4gIGNvbnN0IHZhbGlkQ29tcGFyaXNvblZhbHVlcyA9IFsncHJldmlvdXMnLCAnbW92aW5nLWF2ZXJhZ2UnLCAnZml4ZWQnXTtcbiAgXG4gIGlmIChhbGVydENvbmZpZy5jb21wYXJpc29uVmFsdWUgJiYgIXZhbGlkQ29tcGFyaXNvblZhbHVlcy5pbmNsdWRlcyhhbGVydENvbmZpZy5jb21wYXJpc29uVmFsdWUpKSB7XG4gICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcihgSW52YWxpZCBjb21wYXJpc29uIHZhbHVlOiAke2FsZXJ0Q29uZmlnLmNvbXBhcmlzb25WYWx1ZX1gLCAnY29tcGFyaXNvblZhbHVlJywgJ0lOVkFMSURfVFlQRScpKTtcbiAgfVxuICBcbiAgLy8gTnVtZXJpYyB2YWxpZGF0aW9uc1xuICBpZiAoYWxlcnRDb25maWcudGhyZXNob2xkICE9PSB1bmRlZmluZWQgJiYgaXNOYU4oYWxlcnRDb25maWcudGhyZXNob2xkKSkge1xuICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1RocmVzaG9sZCBtdXN0IGJlIGEgbnVtYmVyJywgJ3RocmVzaG9sZCcsICdJTlZBTElEX05VTUJFUicpKTtcbiAgfVxuICBcbiAgaWYgKGFsZXJ0Q29uZmlnLm1vdmluZ0F2ZXJhZ2VQZXJpb2QgIT09IHVuZGVmaW5lZCAmJiAoaXNOYU4oYWxlcnRDb25maWcubW92aW5nQXZlcmFnZVBlcmlvZCkgfHwgYWxlcnRDb25maWcubW92aW5nQXZlcmFnZVBlcmlvZCA8IDEpKSB7XG4gICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcignTW92aW5nIGF2ZXJhZ2UgcGVyaW9kIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInLCAnbW92aW5nQXZlcmFnZVBlcmlvZCcsICdJTlZBTElEX05VTUJFUicpKTtcbiAgfVxuICBcbiAgaWYgKGFsZXJ0Q29uZmlnLmNvb2xkb3duUGVyaW9kICE9PSB1bmRlZmluZWQgJiYgKGlzTmFOKGFsZXJ0Q29uZmlnLmNvb2xkb3duUGVyaW9kKSB8fCBhbGVydENvbmZpZy5jb29sZG93blBlcmlvZCA8IDApKSB7XG4gICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcignQ29vbGRvd24gcGVyaW9kIG11c3QgYmUgYSBub24tbmVnYXRpdmUgbnVtYmVyJywgJ2Nvb2xkb3duUGVyaW9kJywgJ0lOVkFMSURfTlVNQkVSJykpO1xuICB9XG4gIFxuICAvLyBOb3RpZmljYXRpb24gY2hhbm5lbCB2YWxpZGF0aW9uc1xuICBpZiAoQXJyYXkuaXNBcnJheShhbGVydENvbmZpZy5ub3RpZmljYXRpb25DaGFubmVscykpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFsZXJ0Q29uZmlnLm5vdGlmaWNhdGlvbkNoYW5uZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjaGFubmVsID0gYWxlcnRDb25maWcubm90aWZpY2F0aW9uQ2hhbm5lbHNbaV07XG4gICAgICBcbiAgICAgIGlmICghY2hhbm5lbC50eXBlKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoYE5vdGlmaWNhdGlvbiBjaGFubmVsIHR5cGUgaXMgcmVxdWlyZWRgLCBgbm90aWZpY2F0aW9uQ2hhbm5lbHNbJHtpfV0udHlwZWAsICdSRVFVSVJFRCcpKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgaWYgKCFjaGFubmVsLmRlc3RpbmF0aW9uKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKG5ldyBWYWxpZGF0aW9uRXJyb3IoYE5vdGlmaWNhdGlvbiBjaGFubmVsIGRlc3RpbmF0aW9uIGlzIHJlcXVpcmVkYCwgYG5vdGlmaWNhdGlvbkNoYW5uZWxzWyR7aX1dLmRlc3RpbmF0aW9uYCwgJ1JFUVVJUkVEJykpO1xuICAgICAgfVxuICAgICAgXG4gICAgICBpZiAoY2hhbm5lbC5lbmFibGVkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcihgTm90aWZpY2F0aW9uIGNoYW5uZWwgZW5hYmxlZCBmbGFnIGlzIHJlcXVpcmVkYCwgYG5vdGlmaWNhdGlvbkNoYW5uZWxzWyR7aX1dLmVuYWJsZWRgLCAnUkVRVUlSRUQnKSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGNvbnN0IHZhbGlkQ2hhbm5lbFR5cGVzID0gWydlbWFpbCcsICdzbXMnLCAncHVzaCcsICd3ZWJob29rJ107XG4gICAgICBcbiAgICAgIGlmIChjaGFubmVsLnR5cGUgJiYgIXZhbGlkQ2hhbm5lbFR5cGVzLmluY2x1ZGVzKGNoYW5uZWwudHlwZSkpIHtcbiAgICAgICAgZXJyb3JzLnB1c2gobmV3IFZhbGlkYXRpb25FcnJvcihgSW52YWxpZCBub3RpZmljYXRpb24gY2hhbm5lbCB0eXBlOiAke2NoYW5uZWwudHlwZX1gLCBgbm90aWZpY2F0aW9uQ2hhbm5lbHNbJHtpfV0udHlwZWAsICdJTlZBTElEX1RZUEUnKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICByZXR1cm4ge1xuICAgIHZhbGlkOiBlcnJvcnMubGVuZ3RoID09PSAwLFxuICAgIGVycm9yc1xuICB9O1xufSJdfQ==