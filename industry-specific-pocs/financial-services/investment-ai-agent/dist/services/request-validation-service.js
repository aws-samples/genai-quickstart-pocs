"use strict";
/**
 * Request Validation Service
 * Validates investment idea generation requests and parameters
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestValidationService = void 0;
class RequestValidationService {
    constructor() {
        this.MAX_IDEAS = 20;
        this.MIN_IDEAS = 1;
        this.MAX_CONFIDENCE = 100;
        this.MIN_CONFIDENCE = 0;
        this.MAX_INVESTMENT_AMOUNT = 1000000000; // $1B
        this.MIN_INVESTMENT_AMOUNT = 100; // $100
        this.MAX_SECTORS = 20;
        this.MAX_EXCLUDED_INVESTMENTS = 100;
        this.MAX_CUSTOM_CRITERIA = 10;
        this.VALID_TIME_HORIZONS = [
            'intraday', 'short-term', 'medium-term', 'long-term', 'flexible'
        ];
        this.VALID_RISK_TOLERANCES = [
            'very-conservative', 'conservative', 'moderate', 'aggressive', 'very-aggressive'
        ];
        this.VALID_ASSET_CLASSES = [
            'equities', 'fixed-income', 'commodities', 'currencies',
            'real-estate', 'alternatives', 'cryptocurrencies', 'derivatives'
        ];
        this.VALID_GEOGRAPHIC_REGIONS = [
            'north-america', 'europe', 'asia-pacific', 'emerging-markets', 'global', 'domestic'
        ];
        this.VALID_RESEARCH_DEPTHS = [
            'basic', 'standard', 'comprehensive', 'deep-dive'
        ];
        this.VALID_LIQUIDITY_REQUIREMENTS = [
            'high', 'medium', 'low', 'flexible'
        ];
        this.VALID_OUTPUT_FORMATS = [
            'detailed', 'summary', 'executive', 'technical', 'presentation'
        ];
        this.VALID_CURRENCIES = [
            'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'
        ];
    }
    /**
     * Validate a complete investment idea generation request
     */
    async validateRequest(request) {
        const errors = [];
        const warnings = [];
        // Validate basic request structure
        this.validateBasicStructure(request, errors);
        // Validate parameters
        if (request.parameters) {
            await this.validateParameters(request.parameters, errors, warnings);
        }
        else {
            errors.push({
                field: 'parameters',
                message: 'Request parameters are required',
                code: 'MISSING_PARAMETERS',
                severity: 'critical'
            });
        }
        // Validate callback configuration if provided
        if (request.callback) {
            this.validateCallback(request.callback, errors, warnings);
        }
        // Validate priority
        this.validatePriority(request.priority, errors);
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Validate basic request structure
     */
    validateBasicStructure(request, errors) {
        if (!request.id || typeof request.id !== 'string' || request.id.trim().length === 0) {
            errors.push({
                field: 'id',
                message: 'Request ID is required and must be a non-empty string',
                code: 'INVALID_REQUEST_ID',
                severity: 'critical'
            });
        }
        if (!request.userId || typeof request.userId !== 'string' || request.userId.trim().length === 0) {
            errors.push({
                field: 'userId',
                message: 'User ID is required and must be a non-empty string',
                code: 'INVALID_USER_ID',
                severity: 'critical'
            });
        }
        if (!request.timestamp || !(request.timestamp instanceof Date)) {
            errors.push({
                field: 'timestamp',
                message: 'Timestamp is required and must be a valid Date',
                code: 'INVALID_TIMESTAMP',
                severity: 'error'
            });
        }
        if (!request.status || typeof request.status !== 'string') {
            errors.push({
                field: 'status',
                message: 'Status is required and must be a string',
                code: 'INVALID_STATUS',
                severity: 'error'
            });
        }
    }
    /**
     * Validate request parameters
     */
    async validateParameters(parameters, errors, warnings) {
        // Validate required parameters
        this.validateTimeHorizon(parameters.investmentHorizon, errors);
        this.validateRiskTolerance(parameters.riskTolerance, errors);
        // Validate optional parameters
        this.validateInvestmentAmount(parameters.investmentAmount, errors, warnings);
        this.validateCurrency(parameters.currency, errors);
        this.validateSectors(parameters.sectors, errors, warnings);
        this.validateAssetClasses(parameters.assetClasses, errors);
        this.validateGeographicFocus(parameters.geographicFocus, errors);
        this.validateExcludedInvestments(parameters.excludedInvestments, errors, warnings);
        this.validateExcludedSectors(parameters.excludedSectors, errors, warnings);
        this.validateConfidenceRange(parameters.minimumConfidence, errors);
        this.validateMaximumIdeas(parameters.maximumIdeas, errors, warnings);
        this.validateResearchDepth(parameters.researchDepth, errors);
        this.validateLiquidityRequirement(parameters.liquidityRequirement, errors);
        this.validateOutputFormat(parameters.outputFormat, errors);
        this.validateCustomCriteria(parameters.customCriteria, errors, warnings);
        this.validateModelPreferences(parameters.modelPreferences, errors, warnings);
        // Cross-validation checks
        this.performCrossValidation(parameters, errors, warnings);
    }
    /**
     * Validate time horizon
     */
    validateTimeHorizon(timeHorizon, errors) {
        if (!timeHorizon) {
            errors.push({
                field: 'investmentHorizon',
                message: 'Investment horizon is required',
                code: 'MISSING_TIME_HORIZON',
                severity: 'critical'
            });
            return;
        }
        if (!this.VALID_TIME_HORIZONS.includes(timeHorizon)) {
            errors.push({
                field: 'investmentHorizon',
                message: `Invalid time horizon. Must be one of: ${this.VALID_TIME_HORIZONS.join(', ')}`,
                code: 'INVALID_TIME_HORIZON',
                severity: 'error'
            });
        }
    }
    /**
     * Validate risk tolerance
     */
    validateRiskTolerance(riskTolerance, errors) {
        if (!riskTolerance) {
            errors.push({
                field: 'riskTolerance',
                message: 'Risk tolerance is required',
                code: 'MISSING_RISK_TOLERANCE',
                severity: 'critical'
            });
            return;
        }
        if (!this.VALID_RISK_TOLERANCES.includes(riskTolerance)) {
            errors.push({
                field: 'riskTolerance',
                message: `Invalid risk tolerance. Must be one of: ${this.VALID_RISK_TOLERANCES.join(', ')}`,
                code: 'INVALID_RISK_TOLERANCE',
                severity: 'error'
            });
        }
    }
    /**
     * Validate investment amount
     */
    validateInvestmentAmount(amount, errors, warnings) {
        if (amount !== undefined) {
            if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
                errors.push({
                    field: 'investmentAmount',
                    message: 'Investment amount must be a positive number',
                    code: 'INVALID_INVESTMENT_AMOUNT',
                    severity: 'error'
                });
            }
            else if (amount < this.MIN_INVESTMENT_AMOUNT) {
                warnings.push({
                    field: 'investmentAmount',
                    message: `Investment amount is very low (${amount}). Consider minimum of $${this.MIN_INVESTMENT_AMOUNT}`,
                    code: 'LOW_INVESTMENT_AMOUNT',
                    recommendation: `Increase investment amount to at least $${this.MIN_INVESTMENT_AMOUNT}`
                });
            }
            else if (amount > this.MAX_INVESTMENT_AMOUNT) {
                warnings.push({
                    field: 'investmentAmount',
                    message: `Investment amount is very high (${amount}). Consider institutional-grade analysis`,
                    code: 'HIGH_INVESTMENT_AMOUNT',
                    recommendation: 'Consider using institutional-grade analysis features'
                });
            }
        }
    }
    /**
     * Validate currency
     */
    validateCurrency(currency, errors) {
        if (currency && !this.VALID_CURRENCIES.includes(currency.toUpperCase())) {
            errors.push({
                field: 'currency',
                message: `Invalid currency. Must be one of: ${this.VALID_CURRENCIES.join(', ')}`,
                code: 'INVALID_CURRENCY',
                severity: 'error'
            });
        }
    }
    /**
     * Validate sectors
     */
    validateSectors(sectors, errors, warnings) {
        if (sectors) {
            if (!Array.isArray(sectors)) {
                errors.push({
                    field: 'sectors',
                    message: 'Sectors must be an array of strings',
                    code: 'INVALID_SECTORS_FORMAT',
                    severity: 'error'
                });
                return;
            }
            if (sectors.length > this.MAX_SECTORS) {
                errors.push({
                    field: 'sectors',
                    message: `Too many sectors specified. Maximum allowed: ${this.MAX_SECTORS}`,
                    code: 'TOO_MANY_SECTORS',
                    severity: 'error'
                });
            }
            // Check for empty or invalid sector names
            sectors.forEach((sector, index) => {
                if (typeof sector !== 'string' || sector.trim().length === 0) {
                    errors.push({
                        field: `sectors[${index}]`,
                        message: 'Sector name must be a non-empty string',
                        code: 'INVALID_SECTOR_NAME',
                        severity: 'error'
                    });
                }
            });
            if (sectors.length === 1) {
                warnings.push({
                    field: 'sectors',
                    message: 'Only one sector specified. Consider diversifying across multiple sectors',
                    code: 'SINGLE_SECTOR_FOCUS',
                    recommendation: 'Add additional sectors for better diversification'
                });
            }
        }
    }
    /**
     * Validate asset classes
     */
    validateAssetClasses(assetClasses, errors) {
        if (assetClasses) {
            if (!Array.isArray(assetClasses)) {
                errors.push({
                    field: 'assetClasses',
                    message: 'Asset classes must be an array',
                    code: 'INVALID_ASSET_CLASSES_FORMAT',
                    severity: 'error'
                });
                return;
            }
            assetClasses.forEach((assetClass, index) => {
                if (!this.VALID_ASSET_CLASSES.includes(assetClass)) {
                    errors.push({
                        field: `assetClasses[${index}]`,
                        message: `Invalid asset class: ${assetClass}. Must be one of: ${this.VALID_ASSET_CLASSES.join(', ')}`,
                        code: 'INVALID_ASSET_CLASS',
                        severity: 'error'
                    });
                }
            });
        }
    }
    /**
     * Validate geographic focus
     */
    validateGeographicFocus(geographicFocus, errors) {
        if (geographicFocus) {
            if (!Array.isArray(geographicFocus)) {
                errors.push({
                    field: 'geographicFocus',
                    message: 'Geographic focus must be an array',
                    code: 'INVALID_GEOGRAPHIC_FOCUS_FORMAT',
                    severity: 'error'
                });
                return;
            }
            geographicFocus.forEach((region, index) => {
                if (!this.VALID_GEOGRAPHIC_REGIONS.includes(region)) {
                    errors.push({
                        field: `geographicFocus[${index}]`,
                        message: `Invalid geographic region: ${region}. Must be one of: ${this.VALID_GEOGRAPHIC_REGIONS.join(', ')}`,
                        code: 'INVALID_GEOGRAPHIC_REGION',
                        severity: 'error'
                    });
                }
            });
        }
    }
    /**
     * Validate excluded investments
     */
    validateExcludedInvestments(excludedInvestments, errors, warnings) {
        if (excludedInvestments) {
            if (!Array.isArray(excludedInvestments)) {
                errors.push({
                    field: 'excludedInvestments',
                    message: 'Excluded investments must be an array of strings',
                    code: 'INVALID_EXCLUDED_INVESTMENTS_FORMAT',
                    severity: 'error'
                });
                return;
            }
            if (excludedInvestments.length > this.MAX_EXCLUDED_INVESTMENTS) {
                errors.push({
                    field: 'excludedInvestments',
                    message: `Too many excluded investments. Maximum allowed: ${this.MAX_EXCLUDED_INVESTMENTS}`,
                    code: 'TOO_MANY_EXCLUDED_INVESTMENTS',
                    severity: 'error'
                });
            }
            if (excludedInvestments.length > 50) {
                warnings.push({
                    field: 'excludedInvestments',
                    message: 'Large number of excluded investments may limit available opportunities',
                    code: 'MANY_EXCLUDED_INVESTMENTS',
                    recommendation: 'Consider reducing exclusions to increase opportunity set'
                });
            }
        }
    }
    /**
     * Validate excluded sectors
     */
    validateExcludedSectors(excludedSectors, errors, warnings) {
        if (excludedSectors) {
            if (!Array.isArray(excludedSectors)) {
                errors.push({
                    field: 'excludedSectors',
                    message: 'Excluded sectors must be an array of strings',
                    code: 'INVALID_EXCLUDED_SECTORS_FORMAT',
                    severity: 'error'
                });
                return;
            }
            if (excludedSectors.length > 15) {
                warnings.push({
                    field: 'excludedSectors',
                    message: 'Excluding many sectors may significantly limit investment opportunities',
                    code: 'MANY_EXCLUDED_SECTORS',
                    recommendation: 'Consider reducing sector exclusions for better diversification'
                });
            }
        }
    }
    /**
     * Validate confidence range
     */
    validateConfidenceRange(minimumConfidence, errors) {
        if (minimumConfidence !== undefined) {
            if (typeof minimumConfidence !== 'number' || isNaN(minimumConfidence)) {
                errors.push({
                    field: 'minimumConfidence',
                    message: 'Minimum confidence must be a number',
                    code: 'INVALID_CONFIDENCE_TYPE',
                    severity: 'error'
                });
            }
            else if (minimumConfidence < this.MIN_CONFIDENCE || minimumConfidence > this.MAX_CONFIDENCE) {
                errors.push({
                    field: 'minimumConfidence',
                    message: `Minimum confidence must be between ${this.MIN_CONFIDENCE} and ${this.MAX_CONFIDENCE}`,
                    code: 'INVALID_CONFIDENCE_RANGE',
                    severity: 'error'
                });
            }
        }
    }
    /**
     * Validate maximum ideas
     */
    validateMaximumIdeas(maximumIdeas, errors, warnings) {
        if (maximumIdeas !== undefined) {
            if (typeof maximumIdeas !== 'number' || isNaN(maximumIdeas) || !Number.isInteger(maximumIdeas)) {
                errors.push({
                    field: 'maximumIdeas',
                    message: 'Maximum ideas must be an integer',
                    code: 'INVALID_MAX_IDEAS_TYPE',
                    severity: 'error'
                });
            }
            else if (maximumIdeas < this.MIN_IDEAS || maximumIdeas > this.MAX_IDEAS) {
                errors.push({
                    field: 'maximumIdeas',
                    message: `Maximum ideas must be between ${this.MIN_IDEAS} and ${this.MAX_IDEAS}`,
                    code: 'INVALID_MAX_IDEAS_RANGE',
                    severity: 'error'
                });
            }
            else if (maximumIdeas > 10) {
                warnings.push({
                    field: 'maximumIdeas',
                    message: 'Requesting many ideas may increase processing time',
                    code: 'HIGH_MAX_IDEAS',
                    recommendation: 'Consider requesting fewer ideas for faster processing'
                });
            }
        }
    }
    /**
     * Validate research depth
     */
    validateResearchDepth(researchDepth, errors) {
        if (researchDepth && !this.VALID_RESEARCH_DEPTHS.includes(researchDepth)) {
            errors.push({
                field: 'researchDepth',
                message: `Invalid research depth. Must be one of: ${this.VALID_RESEARCH_DEPTHS.join(', ')}`,
                code: 'INVALID_RESEARCH_DEPTH',
                severity: 'error'
            });
        }
    }
    /**
     * Validate liquidity requirement
     */
    validateLiquidityRequirement(liquidityRequirement, errors) {
        if (liquidityRequirement && !this.VALID_LIQUIDITY_REQUIREMENTS.includes(liquidityRequirement)) {
            errors.push({
                field: 'liquidityRequirement',
                message: `Invalid liquidity requirement. Must be one of: ${this.VALID_LIQUIDITY_REQUIREMENTS.join(', ')}`,
                code: 'INVALID_LIQUIDITY_REQUIREMENT',
                severity: 'error'
            });
        }
    }
    /**
     * Validate output format
     */
    validateOutputFormat(outputFormat, errors) {
        if (outputFormat && !this.VALID_OUTPUT_FORMATS.includes(outputFormat)) {
            errors.push({
                field: 'outputFormat',
                message: `Invalid output format. Must be one of: ${this.VALID_OUTPUT_FORMATS.join(', ')}`,
                code: 'INVALID_OUTPUT_FORMAT',
                severity: 'error'
            });
        }
    }
    /**
     * Validate custom criteria
     */
    validateCustomCriteria(customCriteria, errors, warnings) {
        if (customCriteria) {
            if (!Array.isArray(customCriteria)) {
                errors.push({
                    field: 'customCriteria',
                    message: 'Custom criteria must be an array',
                    code: 'INVALID_CUSTOM_CRITERIA_FORMAT',
                    severity: 'error'
                });
                return;
            }
            if (customCriteria.length > this.MAX_CUSTOM_CRITERIA) {
                errors.push({
                    field: 'customCriteria',
                    message: `Too many custom criteria. Maximum allowed: ${this.MAX_CUSTOM_CRITERIA}`,
                    code: 'TOO_MANY_CUSTOM_CRITERIA',
                    severity: 'error'
                });
            }
            customCriteria.forEach((criterion, index) => {
                if (!criterion.name || typeof criterion.name !== 'string') {
                    errors.push({
                        field: `customCriteria[${index}].name`,
                        message: 'Custom criterion name is required and must be a string',
                        code: 'INVALID_CUSTOM_CRITERION_NAME',
                        severity: 'error'
                    });
                }
                if (criterion.weight !== undefined && (typeof criterion.weight !== 'number' || criterion.weight < 0 || criterion.weight > 100)) {
                    errors.push({
                        field: `customCriteria[${index}].weight`,
                        message: 'Custom criterion weight must be a number between 0 and 100',
                        code: 'INVALID_CUSTOM_CRITERION_WEIGHT',
                        severity: 'error'
                    });
                }
            });
        }
    }
    /**
     * Validate model preferences
     */
    validateModelPreferences(modelPreferences, errors, warnings) {
        if (modelPreferences) {
            if (!Array.isArray(modelPreferences)) {
                errors.push({
                    field: 'modelPreferences',
                    message: 'Model preferences must be an array',
                    code: 'INVALID_MODEL_PREFERENCES_FORMAT',
                    severity: 'error'
                });
                return;
            }
            const validModelTypes = ['claude-sonnet', 'claude-haiku', 'amazon-nova-pro'];
            const validTaskTypes = ['research', 'analysis', 'synthesis', 'compliance'];
            modelPreferences.forEach((preference, index) => {
                if (!validModelTypes.includes(preference.modelType)) {
                    errors.push({
                        field: `modelPreferences[${index}].modelType`,
                        message: `Invalid model type. Must be one of: ${validModelTypes.join(', ')}`,
                        code: 'INVALID_MODEL_TYPE',
                        severity: 'error'
                    });
                }
                if (!validTaskTypes.includes(preference.taskType)) {
                    errors.push({
                        field: `modelPreferences[${index}].taskType`,
                        message: `Invalid task type. Must be one of: ${validTaskTypes.join(', ')}`,
                        code: 'INVALID_TASK_TYPE',
                        severity: 'error'
                    });
                }
            });
        }
    }
    /**
     * Validate callback configuration
     */
    validateCallback(callback, errors, warnings) {
        if (!callback.url || typeof callback.url !== 'string') {
            errors.push({
                field: 'callback.url',
                message: 'Callback URL is required and must be a string',
                code: 'INVALID_CALLBACK_URL',
                severity: 'error'
            });
        }
        else {
            try {
                new URL(callback.url);
            }
            catch {
                errors.push({
                    field: 'callback.url',
                    message: 'Callback URL must be a valid URL',
                    code: 'INVALID_CALLBACK_URL_FORMAT',
                    severity: 'error'
                });
            }
        }
        if (callback.method && !['POST', 'PUT'].includes(callback.method)) {
            errors.push({
                field: 'callback.method',
                message: 'Callback method must be POST or PUT',
                code: 'INVALID_CALLBACK_METHOD',
                severity: 'error'
            });
        }
    }
    /**
     * Validate priority
     */
    validatePriority(priority, errors) {
        const validPriorities = ['low', 'medium', 'high', 'urgent'];
        if (!validPriorities.includes(priority)) {
            errors.push({
                field: 'priority',
                message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
                code: 'INVALID_PRIORITY',
                severity: 'error'
            });
        }
    }
    /**
     * Perform cross-validation checks
     */
    performCrossValidation(parameters, errors, warnings) {
        // Check for conflicting risk tolerance and investment horizon
        if (parameters.riskTolerance === 'very-conservative' && parameters.investmentHorizon === 'intraday') {
            warnings.push({
                field: 'riskTolerance',
                message: 'Very conservative risk tolerance with intraday horizon may limit opportunities',
                code: 'CONFLICTING_RISK_HORIZON',
                recommendation: 'Consider longer investment horizon for conservative strategies'
            });
        }
        // Check for conflicting asset classes and risk tolerance
        if (parameters.riskTolerance === 'very-conservative' &&
            parameters.assetClasses?.includes('cryptocurrencies')) {
            warnings.push({
                field: 'assetClasses',
                message: 'Cryptocurrencies may not align with very conservative risk tolerance',
                code: 'CONFLICTING_RISK_ASSETS',
                recommendation: 'Consider removing high-risk asset classes or adjusting risk tolerance'
            });
        }
        // Check for sectors vs excluded sectors conflicts
        if (parameters.sectors && parameters.excludedSectors) {
            const conflicts = parameters.sectors.filter(sector => parameters.excludedSectors.includes(sector));
            if (conflicts.length > 0) {
                errors.push({
                    field: 'sectors',
                    message: `Conflicting sectors: ${conflicts.join(', ')} are both included and excluded`,
                    code: 'CONFLICTING_SECTORS',
                    severity: 'error'
                });
            }
        }
    }
}
exports.RequestValidationService = RequestValidationService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdC12YWxpZGF0aW9uLXNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2VydmljZXMvcmVxdWVzdC12YWxpZGF0aW9uLXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7O0FBZUgsTUFBYSx3QkFBd0I7SUFBckM7UUFDbUIsY0FBUyxHQUFHLEVBQUUsQ0FBQztRQUNmLGNBQVMsR0FBRyxDQUFDLENBQUM7UUFDZCxtQkFBYyxHQUFHLEdBQUcsQ0FBQztRQUNyQixtQkFBYyxHQUFHLENBQUMsQ0FBQztRQUNuQiwwQkFBcUIsR0FBRyxVQUFVLENBQUMsQ0FBQyxNQUFNO1FBQzFDLDBCQUFxQixHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU87UUFDcEMsZ0JBQVcsR0FBRyxFQUFFLENBQUM7UUFDakIsNkJBQXdCLEdBQUcsR0FBRyxDQUFDO1FBQy9CLHdCQUFtQixHQUFHLEVBQUUsQ0FBQztRQUV6Qix3QkFBbUIsR0FBa0I7WUFDcEQsVUFBVSxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLFVBQVU7U0FDakUsQ0FBQztRQUVlLDBCQUFxQixHQUFvQjtZQUN4RCxtQkFBbUIsRUFBRSxjQUFjLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxpQkFBaUI7U0FDakYsQ0FBQztRQUVlLHdCQUFtQixHQUFpQjtZQUNuRCxVQUFVLEVBQUUsY0FBYyxFQUFFLGFBQWEsRUFBRSxZQUFZO1lBQ3ZELGFBQWEsRUFBRSxjQUFjLEVBQUUsa0JBQWtCLEVBQUUsYUFBYTtTQUNqRSxDQUFDO1FBRWUsNkJBQXdCLEdBQXVCO1lBQzlELGVBQWUsRUFBRSxRQUFRLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixFQUFFLFFBQVEsRUFBRSxVQUFVO1NBQ3BGLENBQUM7UUFFZSwwQkFBcUIsR0FBb0I7WUFDeEQsT0FBTyxFQUFFLFVBQVUsRUFBRSxlQUFlLEVBQUUsV0FBVztTQUNsRCxDQUFDO1FBRWUs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UmVxdWVzdCBWYWxpZGF0aW9uIFNlcnZpY2VcbiAqIFZhbGlkYXRlcyBpbnZlc3RtZW50IGlkZWEgZ2VuZXJhdGlvbiByZXF1ZXN0cyBhbmQgcGFyYW1ldGVyc1xuICovXG5cbmltcG9ydCB7IFxuICBJbnZlc3RtZW50SWRlYUdlbmVyYXRpb25SZXF1ZXN0LCBcbiAgSW52ZXN0bWVudElkZWFSZXF1ZXN0UGFyYW1ldGVycyxcbiAgVGltZUhvcml6b24sXG4gIFJpc2tUb2xlcmFuY2UsXG4gIEFzc2V0Q2xhc3MsXG4gIEdlb2dyYXBoaWNSZWdpb24sXG4gIFJlc2VhcmNoRGVwdGgsXG4gIExpcXVpZGl0eVJlcXVpcmVtZW50LFxuICBPdXRwdXRGb3JtYXRcbn0gZnJvbSAnLi4vbW9kZWxzL2ludmVzdG1lbnQtaWRlYS1yZXF1ZXN0JztcbmltcG9ydCB7IFZhbGlkYXRpb25SZXN1bHQsIFZhbGlkYXRpb25FcnJvciwgVmFsaWRhdGlvbldhcm5pbmcgfSBmcm9tICcuLi9tb2RlbHMvaW52ZXN0bWVudC1pZGVhJztcblxuZXhwb3J0IGNsYXNzIFJlcXVlc3RWYWxpZGF0aW9uU2VydmljZSB7XG4gIHByaXZhdGUgcmVhZG9ubHkgTUFYX0lERUFTID0gMjA7XG4gIHByaXZhdGUgcmVhZG9ubHkgTUlOX0lERUFTID0gMTtcbiAgcHJpdmF0ZSByZWFkb25seSBNQVhfQ09ORklERU5DRSA9IDEwMDtcbiAgcHJpdmF0ZSByZWFkb25seSBNSU5fQ09ORklERU5DRSA9IDA7XG4gIHByaXZhdGUgcmVhZG9ubHkgTUFYX0lOVkVTVE1FTlRfQU1PVU5UID0gMTAwMDAwMDAwMDsgLy8gJDFCXG4gIHByaXZhdGUgcmVhZG9ubHkgTUlOX0lOVkVTVE1FTlRfQU1PVU5UID0gMTAwOyAvLyAkMTAwXG4gIHByaXZhdGUgcmVhZG9ubHkgTUFYX1NFQ1RPUlMgPSAyMDtcbiAgcHJpdmF0ZSByZWFkb25seSBNQVhfRVhDTFVERURfSU5WRVNUTUVOVFMgPSAxMDA7XG4gIHByaXZhdGUgcmVhZG9ubHkgTUFYX0NVU1RPTV9DUklURVJJQSA9IDEwO1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgVkFMSURfVElNRV9IT1JJWk9OUzogVGltZUhvcml6b25bXSA9IFtcbiAgICAnaW50cmFkYXknLCAnc2hvcnQtdGVybScsICdtZWRpdW0tdGVybScsICdsb25nLXRlcm0nLCAnZmxleGlibGUnXG4gIF07XG5cbiAgcHJpdmF0ZSByZWFkb25seSBWQUxJRF9SSVNLX1RPTEVSQU5DRVM6IFJpc2tUb2xlcmFuY2VbXSA9IFtcbiAgICAndmVyeS1jb25zZXJ2YXRpdmUnLCAnY29uc2VydmF0aXZlJywgJ21vZGVyYXRlJywgJ2FnZ3Jlc3NpdmUnLCAndmVyeS1hZ2dyZXNzaXZlJ1xuICBdO1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgVkFMSURfQVNTRVRfQ0xBU1NFUzogQXNzZXRDbGFzc1tdID0gW1xuICAgICdlcXVpdGllcycsICdmaXhlZC1pbmNvbWUnLCAnY29tbW9kaXRpZXMnLCAnY3VycmVuY2llcycsIFxuICAgICdyZWFsLWVzdGF0ZScsICdhbHRlcm5hdGl2ZXMnLCAnY3J5cHRvY3VycmVuY2llcycsICdkZXJpdmF0aXZlcydcbiAgXTtcblxuICBwcml2YXRlIHJlYWRvbmx5IFZBTElEX0dFT0dSQVBISUNfUkVHSU9OUzogR2VvZ3JhcGhpY1JlZ2lvbltdID0gW1xuICAgICdub3J0aC1hbWVyaWNhJywgJ2V1cm9wZScsICdhc2lhLXBhY2lmaWMnLCAnZW1lcmdpbmctbWFya2V0cycsICdnbG9iYWwnLCAnZG9tZXN0aWMnXG4gIF07XG5cbiAgcHJpdmF0ZSByZWFkb25seSBWQUxJRF9SRVNFQVJDSF9ERVBUSFM6IFJlc2VhcmNoRGVwdGhbXSA9IFtcbiAgICAnYmFzaWMnLCAnc3RhbmRhcmQnLCAnY29tcHJlaGVuc2l2ZScsICdkZWVwLWRpdmUnXG4gIF07XG5cbiAgcHJpdmF0ZSByZWFkb25seSBWQUxJRF9MSVFVSURJVFlfUkVRVUlSRU1FTlRTOiBMaXF1aWRpdHlSZXF1aXJlbWVudFtdID0gW1xuICAgICdoaWdoJywgJ21lZGl1bScsICdsb3cnLCAnZmxleGlibGUnXG4gIF07XG5cbiAgcHJpdmF0ZSByZWFkb25seSBWQUxJRF9PVVRQVVRfRk9STUFUUzogT3V0cHV0Rm9ybWF0W10gPSBbXG4gICAgJ2RldGFpbGVkJywgJ3N1bW1hcnknLCAnZXhlY3V0aXZlJywgJ3RlY2huaWNhbCcsICdwcmVzZW50YXRpb24nXG4gIF07XG5cbiAgcHJpdmF0ZSByZWFkb25seSBWQUxJRF9DVVJSRU5DSUVTID0gW1xuICAgICdVU0QnLCAnRVVSJywgJ0dCUCcsICdKUFknLCAnQ0FEJywgJ0FVRCcsICdDSEYnLCAnQ05ZJywgJ0lOUicsICdCUkwnXG4gIF07XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIGEgY29tcGxldGUgaW52ZXN0bWVudCBpZGVhIGdlbmVyYXRpb24gcmVxdWVzdFxuICAgKi9cbiAgcHVibGljIGFzeW5jIHZhbGlkYXRlUmVxdWVzdChyZXF1ZXN0OiBJbnZlc3RtZW50SWRlYUdlbmVyYXRpb25SZXF1ZXN0KTogUHJvbWlzZTxWYWxpZGF0aW9uUmVzdWx0PiB7XG4gICAgY29uc3QgZXJyb3JzOiBWYWxpZGF0aW9uRXJyb3JbXSA9IFtdO1xuICAgIGNvbnN0IHdhcm5pbmdzOiBWYWxpZGF0aW9uV2FybmluZ1tdID0gW107XG5cbiAgICAvLyBWYWxpZGF0ZSBiYXNpYyByZXF1ZXN0IHN0cnVjdHVyZVxuICAgIHRoaXMudmFsaWRhdGVCYXNpY1N0cnVjdHVyZShyZXF1ZXN0LCBlcnJvcnMpO1xuXG4gICAgLy8gVmFsaWRhdGUgcGFyYW1ldGVyc1xuICAgIGlmIChyZXF1ZXN0LnBhcmFtZXRlcnMpIHtcbiAgICAgIGF3YWl0IHRoaXMudmFsaWRhdGVQYXJhbWV0ZXJzKHJlcXVlc3QucGFyYW1ldGVycywgZXJyb3JzLCB3YXJuaW5ncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgZmllbGQ6ICdwYXJhbWV0ZXJzJyxcbiAgICAgICAgbWVzc2FnZTogJ1JlcXVlc3QgcGFyYW1ldGVycyBhcmUgcmVxdWlyZWQnLFxuICAgICAgICBjb2RlOiAnTUlTU0lOR19QQVJBTUVURVJTJyxcbiAgICAgICAgc2V2ZXJpdHk6ICdjcml0aWNhbCdcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFZhbGlkYXRlIGNhbGxiYWNrIGNvbmZpZ3VyYXRpb24gaWYgcHJvdmlkZWRcbiAgICBpZiAocmVxdWVzdC5jYWxsYmFjaykge1xuICAgICAgdGhpcy52YWxpZGF0ZUNhbGxiYWNrKHJlcXVlc3QuY2FsbGJhY2ssIGVycm9ycywgd2FybmluZ3MpO1xuICAgIH1cblxuICAgIC8vIFZhbGlkYXRlIHByaW9yaXR5XG4gICAgdGhpcy52YWxpZGF0ZVByaW9yaXR5KHJlcXVlc3QucHJpb3JpdHksIGVycm9ycyk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgaXNWYWxpZDogZXJyb3JzLmxlbmd0aCA9PT0gMCxcbiAgICAgIGVycm9ycyxcbiAgICAgIHdhcm5pbmdzXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSBiYXNpYyByZXF1ZXN0IHN0cnVjdHVyZVxuICAgKi9cbiAgcHJpdmF0ZSB2YWxpZGF0ZUJhc2ljU3RydWN0dXJlKHJlcXVlc3Q6IEludmVzdG1lbnRJZGVhR2VuZXJhdGlvblJlcXVlc3QsIGVycm9yczogVmFsaWRhdGlvbkVycm9yW10pOiB2b2lkIHtcbiAgICBpZiAoIXJlcXVlc3QuaWQgfHwgdHlwZW9mIHJlcXVlc3QuaWQgIT09ICdzdHJpbmcnIHx8IHJlcXVlc3QuaWQudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICBmaWVsZDogJ2lkJyxcbiAgICAgICAgbWVzc2FnZTogJ1JlcXVlc3QgSUQgaXMgcmVxdWlyZWQgYW5kIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nJyxcbiAgICAgICAgY29kZTogJ0lOVkFMSURfUkVRVUVTVF9JRCcsXG4gICAgICAgIHNldmVyaXR5OiAnY3JpdGljYWwnXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoIXJlcXVlc3QudXNlcklkIHx8IHR5cGVvZiByZXF1ZXN0LnVzZXJJZCAhPT0gJ3N0cmluZycgfHwgcmVxdWVzdC51c2VySWQudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICBmaWVsZDogJ3VzZXJJZCcsXG4gICAgICAgIG1lc3NhZ2U6ICdVc2VyIElEIGlzIHJlcXVpcmVkIGFuZCBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZycsXG4gICAgICAgIGNvZGU6ICdJTlZBTElEX1VTRVJfSUQnLFxuICAgICAgICBzZXZlcml0eTogJ2NyaXRpY2FsJ1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKCFyZXF1ZXN0LnRpbWVzdGFtcCB8fCAhKHJlcXVlc3QudGltZXN0YW1wIGluc3RhbmNlb2YgRGF0ZSkpIHtcbiAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgZmllbGQ6ICd0aW1lc3RhbXAnLFxuICAgICAgICBtZXNzYWdlOiAnVGltZXN0YW1wIGlzIHJlcXVpcmVkIGFuZCBtdXN0IGJlIGEgdmFsaWQgRGF0ZScsXG4gICAgICAgIGNvZGU6ICdJTlZBTElEX1RJTUVTVEFNUCcsXG4gICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoIXJlcXVlc3Quc3RhdHVzIHx8IHR5cGVvZiByZXF1ZXN0LnN0YXR1cyAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgZmllbGQ6ICdzdGF0dXMnLFxuICAgICAgICBtZXNzYWdlOiAnU3RhdHVzIGlzIHJlcXVpcmVkIGFuZCBtdXN0IGJlIGEgc3RyaW5nJyxcbiAgICAgICAgY29kZTogJ0lOVkFMSURfU1RBVFVTJyxcbiAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSByZXF1ZXN0IHBhcmFtZXRlcnNcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgdmFsaWRhdGVQYXJhbWV0ZXJzKFxuICAgIHBhcmFtZXRlcnM6IEludmVzdG1lbnRJZGVhUmVxdWVzdFBhcmFtZXRlcnMsIFxuICAgIGVycm9yczogVmFsaWRhdGlvbkVycm9yW10sIFxuICAgIHdhcm5pbmdzOiBWYWxpZGF0aW9uV2FybmluZ1tdXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIFZhbGlkYXRlIHJlcXVpcmVkIHBhcmFtZXRlcnNcbiAgICB0aGlzLnZhbGlkYXRlVGltZUhvcml6b24ocGFyYW1ldGVycy5pbnZlc3RtZW50SG9yaXpvbiwgZXJyb3JzKTtcbiAgICB0aGlzLnZhbGlkYXRlUmlza1RvbGVyYW5jZShwYXJhbWV0ZXJzLnJpc2tUb2xlcmFuY2UsIGVycm9ycyk7XG5cbiAgICAvLyBWYWxpZGF0ZSBvcHRpb25hbCBwYXJhbWV0ZXJzXG4gICAgdGhpcy52YWxpZGF0ZUludmVzdG1lbnRBbW91bnQocGFyYW1ldGVycy5pbnZlc3RtZW50QW1vdW50LCBlcnJvcnMsIHdhcm5pbmdzKTtcbiAgICB0aGlzLnZhbGlkYXRlQ3VycmVuY3kocGFyYW1ldGVycy5jdXJyZW5jeSwgZXJyb3JzKTtcbiAgICB0aGlzLnZhbGlkYXRlU2VjdG9ycyhwYXJhbWV0ZXJzLnNlY3RvcnMsIGVycm9ycywgd2FybmluZ3MpO1xuICAgIHRoaXMudmFsaWRhdGVBc3NldENsYXNzZXMocGFyYW1ldGVycy5hc3NldENsYXNzZXMsIGVycm9ycyk7XG4gICAgdGhpcy52YWxpZGF0ZUdlb2dyYXBoaWNGb2N1cyhwYXJhbWV0ZXJzLmdlb2dyYXBoaWNGb2N1cywgZXJyb3JzKTtcbiAgICB0aGlzLnZhbGlkYXRlRXhjbHVkZWRJbnZlc3RtZW50cyhwYXJhbWV0ZXJzLmV4Y2x1ZGVkSW52ZXN0bWVudHMsIGVycm9ycywgd2FybmluZ3MpO1xuICAgIHRoaXMudmFsaWRhdGVFeGNsdWRlZFNlY3RvcnMocGFyYW1ldGVycy5leGNsdWRlZFNlY3RvcnMsIGVycm9ycywgd2FybmluZ3MpO1xuICAgIHRoaXMudmFsaWRhdGVDb25maWRlbmNlUmFuZ2UocGFyYW1ldGVycy5taW5pbXVtQ29uZmlkZW5jZSwgZXJyb3JzKTtcbiAgICB0aGlzLnZhbGlkYXRlTWF4aW11bUlkZWFzKHBhcmFtZXRlcnMubWF4aW11bUlkZWFzLCBlcnJvcnMsIHdhcm5pbmdzKTtcbiAgICB0aGlzLnZhbGlkYXRlUmVzZWFyY2hEZXB0aChwYXJhbWV0ZXJzLnJlc2VhcmNoRGVwdGgsIGVycm9ycyk7XG4gICAgdGhpcy52YWxpZGF0ZUxpcXVpZGl0eVJlcXVpcmVtZW50KHBhcmFtZXRlcnMubGlxdWlkaXR5UmVxdWlyZW1lbnQsIGVycm9ycyk7XG4gICAgdGhpcy52YWxpZGF0ZU91dHB1dEZvcm1hdChwYXJhbWV0ZXJzLm91dHB1dEZvcm1hdCwgZXJyb3JzKTtcbiAgICB0aGlzLnZhbGlkYXRlQ3VzdG9tQ3JpdGVyaWEocGFyYW1ldGVycy5jdXN0b21Dcml0ZXJpYSwgZXJyb3JzLCB3YXJuaW5ncyk7XG4gICAgdGhpcy52YWxpZGF0ZU1vZGVsUHJlZmVyZW5jZXMocGFyYW1ldGVycy5tb2RlbFByZWZlcmVuY2VzLCBlcnJvcnMsIHdhcm5pbmdzKTtcblxuICAgIC8vIENyb3NzLXZhbGlkYXRpb24gY2hlY2tzXG4gICAgdGhpcy5wZXJmb3JtQ3Jvc3NWYWxpZGF0aW9uKHBhcmFtZXRlcnMsIGVycm9ycywgd2FybmluZ3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRpbWUgaG9yaXpvblxuICAgKi9cbiAgcHJpdmF0ZSB2YWxpZGF0ZVRpbWVIb3Jpem9uKHRpbWVIb3Jpem9uOiBUaW1lSG9yaXpvbiwgZXJyb3JzOiBWYWxpZGF0aW9uRXJyb3JbXSk6IHZvaWQge1xuICAgIGlmICghdGltZUhvcml6b24pIHtcbiAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgZmllbGQ6ICdpbnZlc3RtZW50SG9yaXpvbicsXG4gICAgICAgIG1lc3NhZ2U6ICdJbnZlc3RtZW50IGhvcml6b24gaXMgcmVxdWlyZWQnLFxuICAgICAgICBjb2RlOiAnTUlTU0lOR19USU1FX0hPUklaT04nLFxuICAgICAgICBzZXZlcml0eTogJ2NyaXRpY2FsJ1xuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLlZBTElEX1RJTUVfSE9SSVpPTlMuaW5jbHVkZXModGltZUhvcml6b24pKSB7XG4gICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgIGZpZWxkOiAnaW52ZXN0bWVudEhvcml6b24nLFxuICAgICAgICBtZXNzYWdlOiBgSW52YWxpZCB0aW1lIGhvcml6b24uIE11c3QgYmUgb25lIG9mOiAke3RoaXMuVkFMSURfVElNRV9IT1JJWk9OUy5qb2luKCcsICcpfWAsXG4gICAgICAgIGNvZGU6ICdJTlZBTElEX1RJTUVfSE9SSVpPTicsXG4gICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgcmlzayB0b2xlcmFuY2VcbiAgICovXG4gIHByaXZhdGUgdmFsaWRhdGVSaXNrVG9sZXJhbmNlKHJpc2tUb2xlcmFuY2U6IFJpc2tUb2xlcmFuY2UsIGVycm9yczogVmFsaWRhdGlvbkVycm9yW10pOiB2b2lkIHtcbiAgICBpZiAoIXJpc2tUb2xlcmFuY2UpIHtcbiAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgZmllbGQ6ICdyaXNrVG9sZXJhbmNlJyxcbiAgICAgICAgbWVzc2FnZTogJ1Jpc2sgdG9sZXJhbmNlIGlzIHJlcXVpcmVkJyxcbiAgICAgICAgY29kZTogJ01JU1NJTkdfUklTS19UT0xFUkFOQ0UnLFxuICAgICAgICBzZXZlcml0eTogJ2NyaXRpY2FsJ1xuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLlZBTElEX1JJU0tfVE9MRVJBTkNFUy5pbmNsdWRlcyhyaXNrVG9sZXJhbmNlKSkge1xuICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICBmaWVsZDogJ3Jpc2tUb2xlcmFuY2UnLFxuICAgICAgICBtZXNzYWdlOiBgSW52YWxpZCByaXNrIHRvbGVyYW5jZS4gTXVzdCBiZSBvbmUgb2Y6ICR7dGhpcy5WQUxJRF9SSVNLX1RPTEVSQU5DRVMuam9pbignLCAnKX1gLFxuICAgICAgICBjb2RlOiAnSU5WQUxJRF9SSVNLX1RPTEVSQU5DRScsXG4gICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgaW52ZXN0bWVudCBhbW91bnRcbiAgICovXG4gIHByaXZhdGUgdmFsaWRhdGVJbnZlc3RtZW50QW1vdW50KFxuICAgIGFtb3VudDogbnVtYmVyIHwgdW5kZWZpbmVkLCBcbiAgICBlcnJvcnM6IFZhbGlkYXRpb25FcnJvcltdLCBcbiAgICB3YXJuaW5nczogVmFsaWRhdGlvbldhcm5pbmdbXVxuICApOiB2b2lkIHtcbiAgICBpZiAoYW1vdW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eXBlb2YgYW1vdW50ICE9PSAnbnVtYmVyJyB8fCBpc05hTihhbW91bnQpIHx8IGFtb3VudCA8PSAwKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgICBmaWVsZDogJ2ludmVzdG1lbnRBbW91bnQnLFxuICAgICAgICAgIG1lc3NhZ2U6ICdJbnZlc3RtZW50IGFtb3VudCBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyxcbiAgICAgICAgICBjb2RlOiAnSU5WQUxJRF9JTlZFU1RNRU5UX0FNT1VOVCcsXG4gICAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2UgaWYgKGFtb3VudCA8IHRoaXMuTUlOX0lOVkVTVE1FTlRfQU1PVU5UKSB7XG4gICAgICAgIHdhcm5pbmdzLnB1c2goe1xuICAgICAgICAgIGZpZWxkOiAnaW52ZXN0bWVudEFtb3VudCcsXG4gICAgICAgICAgbWVzc2FnZTogYEludmVzdG1lbnQgYW1vdW50IGlzIHZlcnkgbG93ICgke2Ftb3VudH0pLiBDb25zaWRlciBtaW5pbXVtIG9mICQke3RoaXMuTUlOX0lOVkVTVE1FTlRfQU1PVU5UfWAsXG4gICAgICAgICAgY29kZTogJ0xPV19JTlZFU1RNRU5UX0FNT1VOVCcsXG4gICAgICAgICAgcmVjb21tZW5kYXRpb246IGBJbmNyZWFzZSBpbnZlc3RtZW50IGFtb3VudCB0byBhdCBsZWFzdCAkJHt0aGlzLk1JTl9JTlZFU1RNRU5UX0FNT1VOVH1gXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmIChhbW91bnQgPiB0aGlzLk1BWF9JTlZFU1RNRU5UX0FNT1VOVCkge1xuICAgICAgICB3YXJuaW5ncy5wdXNoKHtcbiAgICAgICAgICBmaWVsZDogJ2ludmVzdG1lbnRBbW91bnQnLFxuICAgICAgICAgIG1lc3NhZ2U6IGBJbnZlc3RtZW50IGFtb3VudCBpcyB2ZXJ5IGhpZ2ggKCR7YW1vdW50fSkuIENvbnNpZGVyIGluc3RpdHV0aW9uYWwtZ3JhZGUgYW5hbHlzaXNgLFxuICAgICAgICAgIGNvZGU6ICdISUdIX0lOVkVTVE1FTlRfQU1PVU5UJyxcbiAgICAgICAgICByZWNvbW1lbmRhdGlvbjogJ0NvbnNpZGVyIHVzaW5nIGluc3RpdHV0aW9uYWwtZ3JhZGUgYW5hbHlzaXMgZmVhdHVyZXMnXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSBjdXJyZW5jeVxuICAgKi9cbiAgcHJpdmF0ZSB2YWxpZGF0ZUN1cnJlbmN5KGN1cnJlbmN5OiBzdHJpbmcgfCB1bmRlZmluZWQsIGVycm9yczogVmFsaWRhdGlvbkVycm9yW10pOiB2b2lkIHtcbiAgICBpZiAoY3VycmVuY3kgJiYgIXRoaXMuVkFMSURfQ1VSUkVOQ0lFUy5pbmNsdWRlcyhjdXJyZW5jeS50b1VwcGVyQ2FzZSgpKSkge1xuICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICBmaWVsZDogJ2N1cnJlbmN5JyxcbiAgICAgICAgbWVzc2FnZTogYEludmFsaWQgY3VycmVuY3kuIE11c3QgYmUgb25lIG9mOiAke3RoaXMuVkFMSURfQ1VSUkVOQ0lFUy5qb2luKCcsICcpfWAsXG4gICAgICAgIGNvZGU6ICdJTlZBTElEX0NVUlJFTkNZJyxcbiAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSBzZWN0b3JzXG4gICAqL1xuICBwcml2YXRlIHZhbGlkYXRlU2VjdG9ycyhcbiAgICBzZWN0b3JzOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCwgXG4gICAgZXJyb3JzOiBWYWxpZGF0aW9uRXJyb3JbXSwgXG4gICAgd2FybmluZ3M6IFZhbGlkYXRpb25XYXJuaW5nW11cbiAgKTogdm9pZCB7XG4gICAgaWYgKHNlY3RvcnMpIHtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShzZWN0b3JzKSkge1xuICAgICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgICAgZmllbGQ6ICdzZWN0b3JzJyxcbiAgICAgICAgICBtZXNzYWdlOiAnU2VjdG9ycyBtdXN0IGJlIGFuIGFycmF5IG9mIHN0cmluZ3MnLFxuICAgICAgICAgIGNvZGU6ICdJTlZBTElEX1NFQ1RPUlNfRk9STUFUJyxcbiAgICAgICAgICBzZXZlcml0eTogJ2Vycm9yJ1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2VjdG9ycy5sZW5ndGggPiB0aGlzLk1BWF9TRUNUT1JTKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgICBmaWVsZDogJ3NlY3RvcnMnLFxuICAgICAgICAgIG1lc3NhZ2U6IGBUb28gbWFueSBzZWN0b3JzIHNwZWNpZmllZC4gTWF4aW11bSBhbGxvd2VkOiAke3RoaXMuTUFYX1NFQ1RPUlN9YCxcbiAgICAgICAgICBjb2RlOiAnVE9PX01BTllfU0VDVE9SUycsXG4gICAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIENoZWNrIGZvciBlbXB0eSBvciBpbnZhbGlkIHNlY3RvciBuYW1lc1xuICAgICAgc2VjdG9ycy5mb3JFYWNoKChzZWN0b3IsIGluZGV4KSA9PiB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2VjdG9yICE9PSAnc3RyaW5nJyB8fCBzZWN0b3IudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgICAgIGZpZWxkOiBgc2VjdG9yc1ske2luZGV4fV1gLFxuICAgICAgICAgICAgbWVzc2FnZTogJ1NlY3RvciBuYW1lIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nJyxcbiAgICAgICAgICAgIGNvZGU6ICdJTlZBTElEX1NFQ1RPUl9OQU1FJyxcbiAgICAgICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBpZiAoc2VjdG9ycy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgd2FybmluZ3MucHVzaCh7XG4gICAgICAgICAgZmllbGQ6ICdzZWN0b3JzJyxcbiAgICAgICAgICBtZXNzYWdlOiAnT25seSBvbmUgc2VjdG9yIHNwZWNpZmllZC4gQ29uc2lkZXIgZGl2ZXJzaWZ5aW5nIGFjcm9zcyBtdWx0aXBsZSBzZWN0b3JzJyxcbiAgICAgICAgICBjb2RlOiAnU0lOR0xFX1NFQ1RPUl9GT0NVUycsXG4gICAgICAgICAgcmVjb21tZW5kYXRpb246ICdBZGQgYWRkaXRpb25hbCBzZWN0b3JzIGZvciBiZXR0ZXIgZGl2ZXJzaWZpY2F0aW9uJ1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgYXNzZXQgY2xhc3Nlc1xuICAgKi9cbiAgcHJpdmF0ZSB2YWxpZGF0ZUFzc2V0Q2xhc3Nlcyhhc3NldENsYXNzZXM6IEFzc2V0Q2xhc3NbXSB8IHVuZGVmaW5lZCwgZXJyb3JzOiBWYWxpZGF0aW9uRXJyb3JbXSk6IHZvaWQge1xuICAgIGlmIChhc3NldENsYXNzZXMpIHtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShhc3NldENsYXNzZXMpKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgICBmaWVsZDogJ2Fzc2V0Q2xhc3NlcycsXG4gICAgICAgICAgbWVzc2FnZTogJ0Fzc2V0IGNsYXNzZXMgbXVzdCBiZSBhbiBhcnJheScsXG4gICAgICAgICAgY29kZTogJ0lOVkFMSURfQVNTRVRfQ0xBU1NFU19GT1JNQVQnLFxuICAgICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGFzc2V0Q2xhc3Nlcy5mb3JFYWNoKChhc3NldENsYXNzLCBpbmRleCkgPT4ge1xuICAgICAgICBpZiAoIXRoaXMuVkFMSURfQVNTRVRfQ0xBU1NFUy5pbmNsdWRlcyhhc3NldENsYXNzKSkge1xuICAgICAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgICAgIGZpZWxkOiBgYXNzZXRDbGFzc2VzWyR7aW5kZXh9XWAsXG4gICAgICAgICAgICBtZXNzYWdlOiBgSW52YWxpZCBhc3NldCBjbGFzczogJHthc3NldENsYXNzfS4gTXVzdCBiZSBvbmUgb2Y6ICR7dGhpcy5WQUxJRF9BU1NFVF9DTEFTU0VTLmpvaW4oJywgJyl9YCxcbiAgICAgICAgICAgIGNvZGU6ICdJTlZBTElEX0FTU0VUX0NMQVNTJyxcbiAgICAgICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSBnZW9ncmFwaGljIGZvY3VzXG4gICAqL1xuICBwcml2YXRlIHZhbGlkYXRlR2VvZ3JhcGhpY0ZvY3VzKGdlb2dyYXBoaWNGb2N1czogR2VvZ3JhcGhpY1JlZ2lvbltdIHwgdW5kZWZpbmVkLCBlcnJvcnM6IFZhbGlkYXRpb25FcnJvcltdKTogdm9pZCB7XG4gICAgaWYgKGdlb2dyYXBoaWNGb2N1cykge1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGdlb2dyYXBoaWNGb2N1cykpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICAgIGZpZWxkOiAnZ2VvZ3JhcGhpY0ZvY3VzJyxcbiAgICAgICAgICBtZXNzYWdlOiAnR2VvZ3JhcGhpYyBmb2N1cyBtdXN0IGJlIGFuIGFycmF5JyxcbiAgICAgICAgICBjb2RlOiAnSU5WQUxJRF9HRU9HUkFQSElDX0ZPQ1VTX0ZPUk1BVCcsXG4gICAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgZ2VvZ3JhcGhpY0ZvY3VzLmZvckVhY2goKHJlZ2lvbiwgaW5kZXgpID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLlZBTElEX0dFT0dSQVBISUNfUkVHSU9OUy5pbmNsdWRlcyhyZWdpb24pKSB7XG4gICAgICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICAgICAgZmllbGQ6IGBnZW9ncmFwaGljRm9jdXNbJHtpbmRleH1dYCxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGBJbnZhbGlkIGdlb2dyYXBoaWMgcmVnaW9uOiAke3JlZ2lvbn0uIE11c3QgYmUgb25lIG9mOiAke3RoaXMuVkFMSURfR0VPR1JBUEhJQ19SRUdJT05TLmpvaW4oJywgJyl9YCxcbiAgICAgICAgICAgIGNvZGU6ICdJTlZBTElEX0dFT0dSQVBISUNfUkVHSU9OJyxcbiAgICAgICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSBleGNsdWRlZCBpbnZlc3RtZW50c1xuICAgKi9cbiAgcHJpdmF0ZSB2YWxpZGF0ZUV4Y2x1ZGVkSW52ZXN0bWVudHMoXG4gICAgZXhjbHVkZWRJbnZlc3RtZW50czogc3RyaW5nW10gfCB1bmRlZmluZWQsIFxuICAgIGVycm9yczogVmFsaWRhdGlvbkVycm9yW10sIFxuICAgIHdhcm5pbmdzOiBWYWxpZGF0aW9uV2FybmluZ1tdXG4gICk6IHZvaWQge1xuICAgIGlmIChleGNsdWRlZEludmVzdG1lbnRzKSB7XG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkoZXhjbHVkZWRJbnZlc3RtZW50cykpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICAgIGZpZWxkOiAnZXhjbHVkZWRJbnZlc3RtZW50cycsXG4gICAgICAgICAgbWVzc2FnZTogJ0V4Y2x1ZGVkIGludmVzdG1lbnRzIG11c3QgYmUgYW4gYXJyYXkgb2Ygc3RyaW5ncycsXG4gICAgICAgICAgY29kZTogJ0lOVkFMSURfRVhDTFVERURfSU5WRVNUTUVOVFNfRk9STUFUJyxcbiAgICAgICAgICBzZXZlcml0eTogJ2Vycm9yJ1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoZXhjbHVkZWRJbnZlc3RtZW50cy5sZW5ndGggPiB0aGlzLk1BWF9FWENMVURFRF9JTlZFU1RNRU5UUykge1xuICAgICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgICAgZmllbGQ6ICdleGNsdWRlZEludmVzdG1lbnRzJyxcbiAgICAgICAgICBtZXNzYWdlOiBgVG9vIG1hbnkgZXhjbHVkZWQgaW52ZXN0bWVudHMuIE1heGltdW0gYWxsb3dlZDogJHt0aGlzLk1BWF9FWENMVURFRF9JTlZFU1RNRU5UU31gLFxuICAgICAgICAgIGNvZGU6ICdUT09fTUFOWV9FWENMVURFRF9JTlZFU1RNRU5UUycsXG4gICAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChleGNsdWRlZEludmVzdG1lbnRzLmxlbmd0aCA+IDUwKSB7XG4gICAgICAgIHdhcm5pbmdzLnB1c2goe1xuICAgICAgICAgIGZpZWxkOiAnZXhjbHVkZWRJbnZlc3RtZW50cycsXG4gICAgICAgICAgbWVzc2FnZTogJ0xhcmdlIG51bWJlciBvZiBleGNsdWRlZCBpbnZlc3RtZW50cyBtYXkgbGltaXQgYXZhaWxhYmxlIG9wcG9ydHVuaXRpZXMnLFxuICAgICAgICAgIGNvZGU6ICdNQU5ZX0VYQ0xVREVEX0lOVkVTVE1FTlRTJyxcbiAgICAgICAgICByZWNvbW1lbmRhdGlvbjogJ0NvbnNpZGVyIHJlZHVjaW5nIGV4Y2x1c2lvbnMgdG8gaW5jcmVhc2Ugb3Bwb3J0dW5pdHkgc2V0J1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgZXhjbHVkZWQgc2VjdG9yc1xuICAgKi9cbiAgcHJpdmF0ZSB2YWxpZGF0ZUV4Y2x1ZGVkU2VjdG9ycyhcbiAgICBleGNsdWRlZFNlY3RvcnM6IHN0cmluZ1tdIHwgdW5kZWZpbmVkLCBcbiAgICBlcnJvcnM6IFZhbGlkYXRpb25FcnJvcltdLCBcbiAgICB3YXJuaW5nczogVmFsaWRhdGlvbldhcm5pbmdbXVxuICApOiB2b2lkIHtcbiAgICBpZiAoZXhjbHVkZWRTZWN0b3JzKSB7XG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkoZXhjbHVkZWRTZWN0b3JzKSkge1xuICAgICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgICAgZmllbGQ6ICdleGNsdWRlZFNlY3RvcnMnLFxuICAgICAgICAgIG1lc3NhZ2U6ICdFeGNsdWRlZCBzZWN0b3JzIG11c3QgYmUgYW4gYXJyYXkgb2Ygc3RyaW5ncycsXG4gICAgICAgICAgY29kZTogJ0lOVkFMSURfRVhDTFVERURfU0VDVE9SU19GT1JNQVQnLFxuICAgICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChleGNsdWRlZFNlY3RvcnMubGVuZ3RoID4gMTUpIHtcbiAgICAgICAgd2FybmluZ3MucHVzaCh7XG4gICAgICAgICAgZmllbGQ6ICdleGNsdWRlZFNlY3RvcnMnLFxuICAgICAgICAgIG1lc3NhZ2U6ICdFeGNsdWRpbmcgbWFueSBzZWN0b3JzIG1heSBzaWduaWZpY2FudGx5IGxpbWl0IGludmVzdG1lbnQgb3Bwb3J0dW5pdGllcycsXG4gICAgICAgICAgY29kZTogJ01BTllfRVhDTFVERURfU0VDVE9SUycsXG4gICAgICAgICAgcmVjb21tZW5kYXRpb246ICdDb25zaWRlciByZWR1Y2luZyBzZWN0b3IgZXhjbHVzaW9ucyBmb3IgYmV0dGVyIGRpdmVyc2lmaWNhdGlvbidcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIGNvbmZpZGVuY2UgcmFuZ2VcbiAgICovXG4gIHByaXZhdGUgdmFsaWRhdGVDb25maWRlbmNlUmFuZ2UobWluaW11bUNvbmZpZGVuY2U6IG51bWJlciB8IHVuZGVmaW5lZCwgZXJyb3JzOiBWYWxpZGF0aW9uRXJyb3JbXSk6IHZvaWQge1xuICAgIGlmIChtaW5pbXVtQ29uZmlkZW5jZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodHlwZW9mIG1pbmltdW1Db25maWRlbmNlICE9PSAnbnVtYmVyJyB8fCBpc05hTihtaW5pbXVtQ29uZmlkZW5jZSkpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICAgIGZpZWxkOiAnbWluaW11bUNvbmZpZGVuY2UnLFxuICAgICAgICAgIG1lc3NhZ2U6ICdNaW5pbXVtIGNvbmZpZGVuY2UgbXVzdCBiZSBhIG51bWJlcicsXG4gICAgICAgICAgY29kZTogJ0lOVkFMSURfQ09ORklERU5DRV9UWVBFJyxcbiAgICAgICAgICBzZXZlcml0eTogJ2Vycm9yJ1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAobWluaW11bUNvbmZpZGVuY2UgPCB0aGlzLk1JTl9DT05GSURFTkNFIHx8IG1pbmltdW1Db25maWRlbmNlID4gdGhpcy5NQVhfQ09ORklERU5DRSkge1xuICAgICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgICAgZmllbGQ6ICdtaW5pbXVtQ29uZmlkZW5jZScsXG4gICAgICAgICAgbWVzc2FnZTogYE1pbmltdW0gY29uZmlkZW5jZSBtdXN0IGJlIGJldHdlZW4gJHt0aGlzLk1JTl9DT05GSURFTkNFfSBhbmQgJHt0aGlzLk1BWF9DT05GSURFTkNFfWAsXG4gICAgICAgICAgY29kZTogJ0lOVkFMSURfQ09ORklERU5DRV9SQU5HRScsXG4gICAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIG1heGltdW0gaWRlYXNcbiAgICovXG4gIHByaXZhdGUgdmFsaWRhdGVNYXhpbXVtSWRlYXMoXG4gICAgbWF4aW11bUlkZWFzOiBudW1iZXIgfCB1bmRlZmluZWQsIFxuICAgIGVycm9yczogVmFsaWRhdGlvbkVycm9yW10sIFxuICAgIHdhcm5pbmdzOiBWYWxpZGF0aW9uV2FybmluZ1tdXG4gICk6IHZvaWQge1xuICAgIGlmIChtYXhpbXVtSWRlYXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR5cGVvZiBtYXhpbXVtSWRlYXMgIT09ICdudW1iZXInIHx8IGlzTmFOKG1heGltdW1JZGVhcykgfHwgIU51bWJlci5pc0ludGVnZXIobWF4aW11bUlkZWFzKSkge1xuICAgICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgICAgZmllbGQ6ICdtYXhpbXVtSWRlYXMnLFxuICAgICAgICAgIG1lc3NhZ2U6ICdNYXhpbXVtIGlkZWFzIG11c3QgYmUgYW4gaW50ZWdlcicsXG4gICAgICAgICAgY29kZTogJ0lOVkFMSURfTUFYX0lERUFTX1RZUEUnLFxuICAgICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmIChtYXhpbXVtSWRlYXMgPCB0aGlzLk1JTl9JREVBUyB8fCBtYXhpbXVtSWRlYXMgPiB0aGlzLk1BWF9JREVBUykge1xuICAgICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgICAgZmllbGQ6ICdtYXhpbXVtSWRlYXMnLFxuICAgICAgICAgIG1lc3NhZ2U6IGBNYXhpbXVtIGlkZWFzIG11c3QgYmUgYmV0d2VlbiAke3RoaXMuTUlOX0lERUFTfSBhbmQgJHt0aGlzLk1BWF9JREVBU31gLFxuICAgICAgICAgIGNvZGU6ICdJTlZBTElEX01BWF9JREVBU19SQU5HRScsXG4gICAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2UgaWYgKG1heGltdW1JZGVhcyA+IDEwKSB7XG4gICAgICAgIHdhcm5pbmdzLnB1c2goe1xuICAgICAgICAgIGZpZWxkOiAnbWF4aW11bUlkZWFzJyxcbiAgICAgICAgICBtZXNzYWdlOiAnUmVxdWVzdGluZyBtYW55IGlkZWFzIG1heSBpbmNyZWFzZSBwcm9jZXNzaW5nIHRpbWUnLFxuICAgICAgICAgIGNvZGU6ICdISUdIX01BWF9JREVBUycsXG4gICAgICAgICAgcmVjb21tZW5kYXRpb246ICdDb25zaWRlciByZXF1ZXN0aW5nIGZld2VyIGlkZWFzIGZvciBmYXN0ZXIgcHJvY2Vzc2luZydcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIHJlc2VhcmNoIGRlcHRoXG4gICAqL1xuICBwcml2YXRlIHZhbGlkYXRlUmVzZWFyY2hEZXB0aChyZXNlYXJjaERlcHRoOiBSZXNlYXJjaERlcHRoIHwgdW5kZWZpbmVkLCBlcnJvcnM6IFZhbGlkYXRpb25FcnJvcltdKTogdm9pZCB7XG4gICAgaWYgKHJlc2VhcmNoRGVwdGggJiYgIXRoaXMuVkFMSURfUkVTRUFSQ0hfREVQVEhTLmluY2x1ZGVzKHJlc2VhcmNoRGVwdGgpKSB7XG4gICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgIGZpZWxkOiAncmVzZWFyY2hEZXB0aCcsXG4gICAgICAgIG1lc3NhZ2U6IGBJbnZhbGlkIHJlc2VhcmNoIGRlcHRoLiBNdXN0IGJlIG9uZSBvZjogJHt0aGlzLlZBTElEX1JFU0VBUkNIX0RFUFRIUy5qb2luKCcsICcpfWAsXG4gICAgICAgIGNvZGU6ICdJTlZBTElEX1JFU0VBUkNIX0RFUFRIJyxcbiAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSBsaXF1aWRpdHkgcmVxdWlyZW1lbnRcbiAgICovXG4gIHByaXZhdGUgdmFsaWRhdGVMaXF1aWRpdHlSZXF1aXJlbWVudChsaXF1aWRpdHlSZXF1aXJlbWVudDogTGlxdWlkaXR5UmVxdWlyZW1lbnQgfCB1bmRlZmluZWQsIGVycm9yczogVmFsaWRhdGlvbkVycm9yW10pOiB2b2lkIHtcbiAgICBpZiAobGlxdWlkaXR5UmVxdWlyZW1lbnQgJiYgIXRoaXMuVkFMSURfTElRVUlESVRZX1JFUVVJUkVNRU5UUy5pbmNsdWRlcyhsaXF1aWRpdHlSZXF1aXJlbWVudCkpIHtcbiAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgZmllbGQ6ICdsaXF1aWRpdHlSZXF1aXJlbWVudCcsXG4gICAgICAgIG1lc3NhZ2U6IGBJbnZhbGlkIGxpcXVpZGl0eSByZXF1aXJlbWVudC4gTXVzdCBiZSBvbmUgb2Y6ICR7dGhpcy5WQUxJRF9MSVFVSURJVFlfUkVRVUlSRU1FTlRTLmpvaW4oJywgJyl9YCxcbiAgICAgICAgY29kZTogJ0lOVkFMSURfTElRVUlESVRZX1JFUVVJUkVNRU5UJyxcbiAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSBvdXRwdXQgZm9ybWF0XG4gICAqL1xuICBwcml2YXRlIHZhbGlkYXRlT3V0cHV0Rm9ybWF0KG91dHB1dEZvcm1hdDogT3V0cHV0Rm9ybWF0IHwgdW5kZWZpbmVkLCBlcnJvcnM6IFZhbGlkYXRpb25FcnJvcltdKTogdm9pZCB7XG4gICAgaWYgKG91dHB1dEZvcm1hdCAmJiAhdGhpcy5WQUxJRF9PVVRQVVRfRk9STUFUUy5pbmNsdWRlcyhvdXRwdXRGb3JtYXQpKSB7XG4gICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgIGZpZWxkOiAnb3V0cHV0Rm9ybWF0JyxcbiAgICAgICAgbWVzc2FnZTogYEludmFsaWQgb3V0cHV0IGZvcm1hdC4gTXVzdCBiZSBvbmUgb2Y6ICR7dGhpcy5WQUxJRF9PVVRQVVRfRk9STUFUUy5qb2luKCcsICcpfWAsXG4gICAgICAgIGNvZGU6ICdJTlZBTElEX09VVFBVVF9GT1JNQVQnLFxuICAgICAgICBzZXZlcml0eTogJ2Vycm9yJ1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIGN1c3RvbSBjcml0ZXJpYVxuICAgKi9cbiAgcHJpdmF0ZSB2YWxpZGF0ZUN1c3RvbUNyaXRlcmlhKFxuICAgIGN1c3RvbUNyaXRlcmlhOiBhbnlbXSB8IHVuZGVmaW5lZCwgXG4gICAgZXJyb3JzOiBWYWxpZGF0aW9uRXJyb3JbXSwgXG4gICAgd2FybmluZ3M6IFZhbGlkYXRpb25XYXJuaW5nW11cbiAgKTogdm9pZCB7XG4gICAgaWYgKGN1c3RvbUNyaXRlcmlhKSB7XG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkoY3VzdG9tQ3JpdGVyaWEpKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgICBmaWVsZDogJ2N1c3RvbUNyaXRlcmlhJyxcbiAgICAgICAgICBtZXNzYWdlOiAnQ3VzdG9tIGNyaXRlcmlhIG11c3QgYmUgYW4gYXJyYXknLFxuICAgICAgICAgIGNvZGU6ICdJTlZBTElEX0NVU1RPTV9DUklURVJJQV9GT1JNQVQnLFxuICAgICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChjdXN0b21Dcml0ZXJpYS5sZW5ndGggPiB0aGlzLk1BWF9DVVNUT01fQ1JJVEVSSUEpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICAgIGZpZWxkOiAnY3VzdG9tQ3JpdGVyaWEnLFxuICAgICAgICAgIG1lc3NhZ2U6IGBUb28gbWFueSBjdXN0b20gY3JpdGVyaWEuIE1heGltdW0gYWxsb3dlZDogJHt0aGlzLk1BWF9DVVNUT01fQ1JJVEVSSUF9YCxcbiAgICAgICAgICBjb2RlOiAnVE9PX01BTllfQ1VTVE9NX0NSSVRFUklBJyxcbiAgICAgICAgICBzZXZlcml0eTogJ2Vycm9yJ1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgY3VzdG9tQ3JpdGVyaWEuZm9yRWFjaCgoY3JpdGVyaW9uLCBpbmRleCkgPT4ge1xuICAgICAgICBpZiAoIWNyaXRlcmlvbi5uYW1lIHx8IHR5cGVvZiBjcml0ZXJpb24ubmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgICAgICBmaWVsZDogYGN1c3RvbUNyaXRlcmlhWyR7aW5kZXh9XS5uYW1lYCxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdDdXN0b20gY3JpdGVyaW9uIG5hbWUgaXMgcmVxdWlyZWQgYW5kIG11c3QgYmUgYSBzdHJpbmcnLFxuICAgICAgICAgICAgY29kZTogJ0lOVkFMSURfQ1VTVE9NX0NSSVRFUklPTl9OQU1FJyxcbiAgICAgICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY3JpdGVyaW9uLndlaWdodCAhPT0gdW5kZWZpbmVkICYmICh0eXBlb2YgY3JpdGVyaW9uLndlaWdodCAhPT0gJ251bWJlcicgfHwgY3JpdGVyaW9uLndlaWdodCA8IDAgfHwgY3JpdGVyaW9uLndlaWdodCA+IDEwMCkpIHtcbiAgICAgICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgICAgICBmaWVsZDogYGN1c3RvbUNyaXRlcmlhWyR7aW5kZXh9XS53ZWlnaHRgLFxuICAgICAgICAgICAgbWVzc2FnZTogJ0N1c3RvbSBjcml0ZXJpb24gd2VpZ2h0IG11c3QgYmUgYSBudW1iZXIgYmV0d2VlbiAwIGFuZCAxMDAnLFxuICAgICAgICAgICAgY29kZTogJ0lOVkFMSURfQ1VTVE9NX0NSSVRFUklPTl9XRUlHSFQnLFxuICAgICAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIG1vZGVsIHByZWZlcmVuY2VzXG4gICAqL1xuICBwcml2YXRlIHZhbGlkYXRlTW9kZWxQcmVmZXJlbmNlcyhcbiAgICBtb2RlbFByZWZlcmVuY2VzOiBhbnlbXSB8IHVuZGVmaW5lZCwgXG4gICAgZXJyb3JzOiBWYWxpZGF0aW9uRXJyb3JbXSwgXG4gICAgd2FybmluZ3M6IFZhbGlkYXRpb25XYXJuaW5nW11cbiAgKTogdm9pZCB7XG4gICAgaWYgKG1vZGVsUHJlZmVyZW5jZXMpIHtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShtb2RlbFByZWZlcmVuY2VzKSkge1xuICAgICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgICAgZmllbGQ6ICdtb2RlbFByZWZlcmVuY2VzJyxcbiAgICAgICAgICBtZXNzYWdlOiAnTW9kZWwgcHJlZmVyZW5jZXMgbXVzdCBiZSBhbiBhcnJheScsXG4gICAgICAgICAgY29kZTogJ0lOVkFMSURfTU9ERUxfUFJFRkVSRU5DRVNfRk9STUFUJyxcbiAgICAgICAgICBzZXZlcml0eTogJ2Vycm9yJ1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB2YWxpZE1vZGVsVHlwZXMgPSBbJ2NsYXVkZS1zb25uZXQnLCAnY2xhdWRlLWhhaWt1JywgJ2FtYXpvbi1ub3ZhLXBybyddO1xuICAgICAgY29uc3QgdmFsaWRUYXNrVHlwZXMgPSBbJ3Jlc2VhcmNoJywgJ2FuYWx5c2lzJywgJ3N5bnRoZXNpcycsICdjb21wbGlhbmNlJ107XG5cbiAgICAgIG1vZGVsUHJlZmVyZW5jZXMuZm9yRWFjaCgocHJlZmVyZW5jZSwgaW5kZXgpID0+IHtcbiAgICAgICAgaWYgKCF2YWxpZE1vZGVsVHlwZXMuaW5jbHVkZXMocHJlZmVyZW5jZS5tb2RlbFR5cGUpKSB7XG4gICAgICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICAgICAgZmllbGQ6IGBtb2RlbFByZWZlcmVuY2VzWyR7aW5kZXh9XS5tb2RlbFR5cGVgLFxuICAgICAgICAgICAgbWVzc2FnZTogYEludmFsaWQgbW9kZWwgdHlwZS4gTXVzdCBiZSBvbmUgb2Y6ICR7dmFsaWRNb2RlbFR5cGVzLmpvaW4oJywgJyl9YCxcbiAgICAgICAgICAgIGNvZGU6ICdJTlZBTElEX01PREVMX1RZUEUnLFxuICAgICAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdmFsaWRUYXNrVHlwZXMuaW5jbHVkZXMocHJlZmVyZW5jZS50YXNrVHlwZSkpIHtcbiAgICAgICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgICAgICBmaWVsZDogYG1vZGVsUHJlZmVyZW5jZXNbJHtpbmRleH1dLnRhc2tUeXBlYCxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGBJbnZhbGlkIHRhc2sgdHlwZS4gTXVzdCBiZSBvbmUgb2Y6ICR7dmFsaWRUYXNrVHlwZXMuam9pbignLCAnKX1gLFxuICAgICAgICAgICAgY29kZTogJ0lOVkFMSURfVEFTS19UWVBFJyxcbiAgICAgICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSBjYWxsYmFjayBjb25maWd1cmF0aW9uXG4gICAqL1xuICBwcml2YXRlIHZhbGlkYXRlQ2FsbGJhY2soY2FsbGJhY2s6IGFueSwgZXJyb3JzOiBWYWxpZGF0aW9uRXJyb3JbXSwgd2FybmluZ3M6IFZhbGlkYXRpb25XYXJuaW5nW10pOiB2b2lkIHtcbiAgICBpZiAoIWNhbGxiYWNrLnVybCB8fCB0eXBlb2YgY2FsbGJhY2sudXJsICE9PSAnc3RyaW5nJykge1xuICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICBmaWVsZDogJ2NhbGxiYWNrLnVybCcsXG4gICAgICAgIG1lc3NhZ2U6ICdDYWxsYmFjayBVUkwgaXMgcmVxdWlyZWQgYW5kIG11c3QgYmUgYSBzdHJpbmcnLFxuICAgICAgICBjb2RlOiAnSU5WQUxJRF9DQUxMQkFDS19VUkwnLFxuICAgICAgICBzZXZlcml0eTogJ2Vycm9yJ1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIG5ldyBVUkwoY2FsbGJhY2sudXJsKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgICAgZmllbGQ6ICdjYWxsYmFjay51cmwnLFxuICAgICAgICAgIG1lc3NhZ2U6ICdDYWxsYmFjayBVUkwgbXVzdCBiZSBhIHZhbGlkIFVSTCcsXG4gICAgICAgICAgY29kZTogJ0lOVkFMSURfQ0FMTEJBQ0tfVVJMX0ZPUk1BVCcsXG4gICAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNhbGxiYWNrLm1ldGhvZCAmJiAhWydQT1NUJywgJ1BVVCddLmluY2x1ZGVzKGNhbGxiYWNrLm1ldGhvZCkpIHtcbiAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgZmllbGQ6ICdjYWxsYmFjay5tZXRob2QnLFxuICAgICAgICBtZXNzYWdlOiAnQ2FsbGJhY2sgbWV0aG9kIG11c3QgYmUgUE9TVCBvciBQVVQnLFxuICAgICAgICBjb2RlOiAnSU5WQUxJRF9DQUxMQkFDS19NRVRIT0QnLFxuICAgICAgICBzZXZlcml0eTogJ2Vycm9yJ1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIHByaW9yaXR5XG4gICAqL1xuICBwcml2YXRlIHZhbGlkYXRlUHJpb3JpdHkocHJpb3JpdHk6IHN0cmluZywgZXJyb3JzOiBWYWxpZGF0aW9uRXJyb3JbXSk6IHZvaWQge1xuICAgIGNvbnN0IHZhbGlkUHJpb3JpdGllcyA9IFsnbG93JywgJ21lZGl1bScsICdoaWdoJywgJ3VyZ2VudCddO1xuICAgIGlmICghdmFsaWRQcmlvcml0aWVzLmluY2x1ZGVzKHByaW9yaXR5KSkge1xuICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICBmaWVsZDogJ3ByaW9yaXR5JyxcbiAgICAgICAgbWVzc2FnZTogYEludmFsaWQgcHJpb3JpdHkuIE11c3QgYmUgb25lIG9mOiAke3ZhbGlkUHJpb3JpdGllcy5qb2luKCcsICcpfWAsXG4gICAgICAgIGNvZGU6ICdJTlZBTElEX1BSSU9SSVRZJyxcbiAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtIGNyb3NzLXZhbGlkYXRpb24gY2hlY2tzXG4gICAqL1xuICBwcml2YXRlIHBlcmZvcm1Dcm9zc1ZhbGlkYXRpb24oXG4gICAgcGFyYW1ldGVyczogSW52ZXN0bWVudElkZWFSZXF1ZXN0UGFyYW1ldGVycywgXG4gICAgZXJyb3JzOiBWYWxpZGF0aW9uRXJyb3JbXSwgXG4gICAgd2FybmluZ3M6IFZhbGlkYXRpb25XYXJuaW5nW11cbiAgKTogdm9pZCB7XG4gICAgLy8gQ2hlY2sgZm9yIGNvbmZsaWN0aW5nIHJpc2sgdG9sZXJhbmNlIGFuZCBpbnZlc3RtZW50IGhvcml6b25cbiAgICBpZiAocGFyYW1ldGVycy5yaXNrVG9sZXJhbmNlID09PSAndmVyeS1jb25zZXJ2YXRpdmUnICYmIHBhcmFtZXRlcnMuaW52ZXN0bWVudEhvcml6b24gPT09ICdpbnRyYWRheScpIHtcbiAgICAgIHdhcm5pbmdzLnB1c2goe1xuICAgICAgICBmaWVsZDogJ3Jpc2tUb2xlcmFuY2UnLFxuICAgICAgICBtZXNzYWdlOiAnVmVyeSBjb25zZXJ2YXRpdmUgcmlzayB0b2xlcmFuY2Ugd2l0aCBpbnRyYWRheSBob3Jpem9uIG1heSBsaW1pdCBvcHBvcnR1bml0aWVzJyxcbiAgICAgICAgY29kZTogJ0NPTkZMSUNUSU5HX1JJU0tfSE9SSVpPTicsXG4gICAgICAgIHJlY29tbWVuZGF0aW9uOiAnQ29uc2lkZXIgbG9uZ2VyIGludmVzdG1lbnQgaG9yaXpvbiBmb3IgY29uc2VydmF0aXZlIHN0cmF0ZWdpZXMnXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgY29uZmxpY3RpbmcgYXNzZXQgY2xhc3NlcyBhbmQgcmlzayB0b2xlcmFuY2VcbiAgICBpZiAocGFyYW1ldGVycy5yaXNrVG9sZXJhbmNlID09PSAndmVyeS1jb25zZXJ2YXRpdmUnICYmIFxuICAgICAgICBwYXJhbWV0ZXJzLmFzc2V0Q2xhc3Nlcz8uaW5jbHVkZXMoJ2NyeXB0b2N1cnJlbmNpZXMnKSkge1xuICAgICAgd2FybmluZ3MucHVzaCh7XG4gICAgICAgIGZpZWxkOiAnYXNzZXRDbGFzc2VzJyxcbiAgICAgICAgbWVzc2FnZTogJ0NyeXB0b2N1cnJlbmNpZXMgbWF5IG5vdCBhbGlnbiB3aXRoIHZlcnkgY29uc2VydmF0aXZlIHJpc2sgdG9sZXJhbmNlJyxcbiAgICAgICAgY29kZTogJ0NPTkZMSUNUSU5HX1JJU0tfQVNTRVRTJyxcbiAgICAgICAgcmVjb21tZW5kYXRpb246ICdDb25zaWRlciByZW1vdmluZyBoaWdoLXJpc2sgYXNzZXQgY2xhc3NlcyBvciBhZGp1c3RpbmcgcmlzayB0b2xlcmFuY2UnXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3Igc2VjdG9ycyB2cyBleGNsdWRlZCBzZWN0b3JzIGNvbmZsaWN0c1xuICAgIGlmIChwYXJhbWV0ZXJzLnNlY3RvcnMgJiYgcGFyYW1ldGVycy5leGNsdWRlZFNlY3RvcnMpIHtcbiAgICAgIGNvbnN0IGNvbmZsaWN0cyA9IHBhcmFtZXRlcnMuc2VjdG9ycy5maWx0ZXIoc2VjdG9yID0+IFxuICAgICAgICBwYXJhbWV0ZXJzLmV4Y2x1ZGVkU2VjdG9ycyEuaW5jbHVkZXMoc2VjdG9yKVxuICAgICAgKTtcbiAgICAgIGlmIChjb25mbGljdHMubGVuZ3RoID4gMCkge1xuICAgICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgICAgZmllbGQ6ICdzZWN0b3JzJyxcbiAgICAgICAgICBtZXNzYWdlOiBgQ29uZmxpY3Rpbmcgc2VjdG9yczogJHtjb25mbGljdHMuam9pbignLCAnKX0gYXJlIGJvdGggaW5jbHVkZWQgYW5kIGV4Y2x1ZGVkYCxcbiAgICAgICAgICBjb2RlOiAnQ09ORkxJQ1RJTkdfU0VDVE9SUycsXG4gICAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59Il19