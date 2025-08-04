/**
 * Validation utilities for Investment Ideas
 */
import { InvestmentIdea, CreateInvestmentIdeaRequest, UpdateInvestmentIdeaRequest, ValidationResult } from '../models/investment-idea';
export declare class InvestmentIdeaValidator {
    /**
     * Validates a complete investment idea
     */
    static validateInvestmentIdea(idea: InvestmentIdea): ValidationResult;
    /**
     * Validates a create investment idea request
     */
    static validateCreateRequest(request: CreateInvestmentIdeaRequest): ValidationResult;
    /**
     * Validates an update investment idea request
     */
    static validateUpdateRequest(request: UpdateInvestmentIdeaRequest): ValidationResult;
    private static validateBasicFields;
    private static validateBusinessLogic;
    private static validateDataConsistency;
    private static validateCompliance;
    private static validateEnumValues;
    private static validateNumericRanges;
    private static validateConfidenceScore;
    private static validateArrayFields;
    private static validateOutcomes;
    private static validateCounterArguments;
    private static validateStrategyTimeHorizonAlignment;
}
