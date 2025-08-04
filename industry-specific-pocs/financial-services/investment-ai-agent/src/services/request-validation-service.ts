/**
 * Request Validation Service
 * Validates investment idea generation requests and parameters
 */

import { 
  InvestmentIdeaGenerationRequest, 
  InvestmentIdeaRequestParameters,
  TimeHorizon,
  RiskTolerance,
  AssetClass,
  GeographicRegion,
  ResearchDepth,
  LiquidityRequirement,
  OutputFormat
} from '../models/investment-idea-request';
import { ValidationResult, ValidationError, ValidationWarning } from '../models/investment-idea';

export class RequestValidationService {
  private readonly MAX_IDEAS = 20;
  private readonly MIN_IDEAS = 1;
  private readonly MAX_CONFIDENCE = 100;
  private readonly MIN_CONFIDENCE = 0;
  private readonly MAX_INVESTMENT_AMOUNT = 1000000000; // $1B
  private readonly MIN_INVESTMENT_AMOUNT = 100; // $100
  private readonly MAX_SECTORS = 20;
  private readonly MAX_EXCLUDED_INVESTMENTS = 100;
  private readonly MAX_CUSTOM_CRITERIA = 10;

  private readonly VALID_TIME_HORIZONS: TimeHorizon[] = [
    'intraday', 'short-term', 'medium-term', 'long-term', 'flexible'
  ];

  private readonly VALID_RISK_TOLERANCES: RiskTolerance[] = [
    'very-conservative', 'conservative', 'moderate', 'aggressive', 'very-aggressive'
  ];

  private readonly VALID_ASSET_CLASSES: AssetClass[] = [
    'equities', 'fixed-income', 'commodities', 'currencies', 
    'real-estate', 'alternatives', 'cryptocurrencies', 'derivatives'
  ];

  private readonly VALID_GEOGRAPHIC_REGIONS: GeographicRegion[] = [
    'north-america', 'europe', 'asia-pacific', 'emerging-markets', 'global', 'domestic'
  ];

  private readonly VALID_RESEARCH_DEPTHS: ResearchDepth[] = [
    'basic', 'standard', 'comprehensive', 'deep-dive'
  ];

  private readonly VALID_LIQUIDITY_REQUIREMENTS: LiquidityRequirement[] = [
    'high', 'medium', 'low', 'flexible'
  ];

  private readonly VALID_OUTPUT_FORMATS: OutputFormat[] = [
    'detailed', 'summary', 'executive', 'technical', 'presentation'
  ];

  private readonly VALID_CURRENCIES = [
    'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'
  ];

  /**
   * Validate a complete investment idea generation request
   */
  public async validateRequest(request: InvestmentIdeaGenerationRequest): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate basic request structure
    this.validateBasicStructure(request, errors);

    // Validate parameters
    if (request.parameters) {
      await this.validateParameters(request.parameters, errors, warnings);
    } else {
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
  private validateBasicStructure(request: InvestmentIdeaGenerationRequest, errors: ValidationError[]): void {
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
  private async validateParameters(
    parameters: InvestmentIdeaRequestParameters, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): Promise<void> {
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
  private validateTimeHorizon(timeHorizon: TimeHorizon, errors: ValidationError[]): void {
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
  private validateRiskTolerance(riskTolerance: RiskTolerance, errors: ValidationError[]): void {
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
  private validateInvestmentAmount(
    amount: number | undefined, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    if (amount !== undefined) {
      if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
        errors.push({
          field: 'investmentAmount',
          message: 'Investment amount must be a positive number',
          code: 'INVALID_INVESTMENT_AMOUNT',
          severity: 'error'
        });
      } else if (amount < this.MIN_INVESTMENT_AMOUNT) {
        warnings.push({
          field: 'investmentAmount',
          message: `Investment amount is very low (${amount}). Consider minimum of $${this.MIN_INVESTMENT_AMOUNT}`,
          code: 'LOW_INVESTMENT_AMOUNT',
          recommendation: `Increase investment amount to at least $${this.MIN_INVESTMENT_AMOUNT}`
        });
      } else if (amount > this.MAX_INVESTMENT_AMOUNT) {
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
  private validateCurrency(currency: string | undefined, errors: ValidationError[]): void {
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
  private validateSectors(
    sectors: string[] | undefined, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
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
  private validateAssetClasses(assetClasses: AssetClass[] | undefined, errors: ValidationError[]): void {
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
  private validateGeographicFocus(geographicFocus: GeographicRegion[] | undefined, errors: ValidationError[]): void {
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
  private validateExcludedInvestments(
    excludedInvestments: string[] | undefined, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
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
  private validateExcludedSectors(
    excludedSectors: string[] | undefined, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
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
  private validateConfidenceRange(minimumConfidence: number | undefined, errors: ValidationError[]): void {
    if (minimumConfidence !== undefined) {
      if (typeof minimumConfidence !== 'number' || isNaN(minimumConfidence)) {
        errors.push({
          field: 'minimumConfidence',
          message: 'Minimum confidence must be a number',
          code: 'INVALID_CONFIDENCE_TYPE',
          severity: 'error'
        });
      } else if (minimumConfidence < this.MIN_CONFIDENCE || minimumConfidence > this.MAX_CONFIDENCE) {
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
  private validateMaximumIdeas(
    maximumIdeas: number | undefined, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    if (maximumIdeas !== undefined) {
      if (typeof maximumIdeas !== 'number' || isNaN(maximumIdeas) || !Number.isInteger(maximumIdeas)) {
        errors.push({
          field: 'maximumIdeas',
          message: 'Maximum ideas must be an integer',
          code: 'INVALID_MAX_IDEAS_TYPE',
          severity: 'error'
        });
      } else if (maximumIdeas < this.MIN_IDEAS || maximumIdeas > this.MAX_IDEAS) {
        errors.push({
          field: 'maximumIdeas',
          message: `Maximum ideas must be between ${this.MIN_IDEAS} and ${this.MAX_IDEAS}`,
          code: 'INVALID_MAX_IDEAS_RANGE',
          severity: 'error'
        });
      } else if (maximumIdeas > 10) {
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
  private validateResearchDepth(researchDepth: ResearchDepth | undefined, errors: ValidationError[]): void {
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
  private validateLiquidityRequirement(liquidityRequirement: LiquidityRequirement | undefined, errors: ValidationError[]): void {
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
  private validateOutputFormat(outputFormat: OutputFormat | undefined, errors: ValidationError[]): void {
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
  private validateCustomCriteria(
    customCriteria: any[] | undefined, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
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
  private validateModelPreferences(
    modelPreferences: any[] | undefined, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
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
  private validateCallback(callback: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!callback.url || typeof callback.url !== 'string') {
      errors.push({
        field: 'callback.url',
        message: 'Callback URL is required and must be a string',
        code: 'INVALID_CALLBACK_URL',
        severity: 'error'
      });
    } else {
      try {
        new URL(callback.url);
      } catch {
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
  private validatePriority(priority: string, errors: ValidationError[]): void {
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
  private performCrossValidation(
    parameters: InvestmentIdeaRequestParameters, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
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
      const conflicts = parameters.sectors.filter(sector => 
        parameters.excludedSectors!.includes(sector)
      );
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