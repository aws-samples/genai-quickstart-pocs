/**
 * Request Validation Service
 * Validates investment idea generation requests and parameters
 */
import { InvestmentIdeaGenerationRequest } from '../models/investment-idea-request';
import { ValidationResult } from '../models/investment-idea';
export declare class RequestValidationService {
    private readonly MAX_IDEAS;
    private readonly MIN_IDEAS;
    private readonly MAX_CONFIDENCE;
    private readonly MIN_CONFIDENCE;
    private readonly MAX_INVESTMENT_AMOUNT;
    private readonly MIN_INVESTMENT_AMOUNT;
    private readonly MAX_SECTORS;
    private readonly MAX_EXCLUDED_INVESTMENTS;
    private readonly MAX_CUSTOM_CRITERIA;
    private readonly VALID_TIME_HORIZONS;
    private readonly VALID_RISK_TOLERANCES;
    private readonly VALID_ASSET_CLASSES;
    private readonly VALID_GEOGRAPHIC_REGIONS;
    private readonly VALID_RESEARCH_DEPTHS;
    private readonly VALID_LIQUIDITY_REQUIREMENTS;
    private readonly VALID_OUTPUT_FORMATS;
    private readonly VALID_CURRENCIES;
    /**
     * Validate a complete investment idea generation request
     */
    validateRequest(request: InvestmentIdeaGenerationRequest): Promise<ValidationResult>;
    /**
     * Validate basic request structure
     */
    private validateBasicStructure;
    /**
     * Validate request parameters
     */
    private validateParameters;
    /**
     * Validate time horizon
     */
    private validateTimeHorizon;
    /**
     * Validate risk tolerance
     */
    private validateRiskTolerance;
    /**
     * Validate investment amount
     */
    private validateInvestmentAmount;
    /**
     * Validate currency
     */
    private validateCurrency;
    /**
     * Validate sectors
     */
    private validateSectors;
    /**
     * Validate asset classes
     */
    private validateAssetClasses;
    /**
     * Validate geographic focus
     */
    private validateGeographicFocus;
    /**
     * Validate excluded investments
     */
    private validateExcludedInvestments;
    /**
     * Validate excluded sectors
     */
    private validateExcludedSectors;
    /**
     * Validate confidence range
     */
    private validateConfidenceRange;
    /**
     * Validate maximum ideas
     */
    private validateMaximumIdeas;
    /**
     * Validate research depth
     */
    private validateResearchDepth;
    /**
     * Validate liquidity requirement
     */
    private validateLiquidityRequirement;
    /**
     * Validate output format
     */
    private validateOutputFormat;
    /**
     * Validate custom criteria
     */
    private validateCustomCriteria;
    /**
     * Validate model preferences
     */
    private validateModelPreferences;
    /**
     * Validate callback configuration
     */
    private validateCallback;
    /**
     * Validate priority
     */
    private validatePriority;
    /**
     * Perform cross-validation checks
     */
    private performCrossValidation;
}
