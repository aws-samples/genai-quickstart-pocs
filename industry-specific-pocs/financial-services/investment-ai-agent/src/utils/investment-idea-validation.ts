/**
 * Validation utilities for Investment Ideas
 */

import {
  InvestmentIdea,
  CreateInvestmentIdeaRequest,
  UpdateInvestmentIdeaRequest,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  InvestmentStrategy,
  TimeHorizon,
  InvestmentCategory,
  RiskLevel,
  TargetAudience,
  Outcome,
  CounterArgument
} from '../models/investment-idea';

export class InvestmentIdeaValidator {
  /**
   * Validates a complete investment idea
   */
  static validateInvestmentIdea(idea: InvestmentIdea): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic field validation
    this.validateBasicFields(idea, errors);
    
    // Business logic validation
    this.validateBusinessLogic(idea, errors, warnings);
    
    // Data consistency validation
    this.validateDataConsistency(idea, errors, warnings);
    
    // Compliance validation
    this.validateCompliance(idea, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates a create investment idea request
   */
  static validateCreateRequest(request: CreateInvestmentIdeaRequest): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields validation
    if (!request.title?.trim()) {
      errors.push({
        field: 'title',
        message: 'Title is required and cannot be empty',
        code: 'TITLE_REQUIRED',
        severity: 'error'
      });
    }

    if (!request.description?.trim()) {
      errors.push({
        field: 'description',
        message: 'Description is required and cannot be empty',
        code: 'DESCRIPTION_REQUIRED',
        severity: 'error'
      });
    }

    if (!request.rationale?.trim()) {
      errors.push({
        field: 'rationale',
        message: 'Rationale is required and cannot be empty',
        code: 'RATIONALE_REQUIRED',
        severity: 'error'
      });
    }

    if (!request.createdBy?.trim()) {
      errors.push({
        field: 'createdBy',
        message: 'CreatedBy is required and cannot be empty',
        code: 'CREATED_BY_REQUIRED',
        severity: 'error'
      });
    }

    // Validate investments array
    if (!request.investments || request.investments.length === 0) {
      errors.push({
        field: 'investments',
        message: 'At least one investment is required',
        code: 'INVESTMENTS_REQUIRED',
        severity: 'error'
      });
    }

    // Validate enum values
    this.validateEnumValues(request, errors);
    
    // Validate numeric ranges
    this.validateNumericRanges(request, errors, warnings);
    
    // Validate arrays
    this.validateArrayFields(request, errors, warnings);
    
    // Validate strategy-time horizon alignment
    this.validateStrategyTimeHorizonAlignment(request.strategy, request.timeHorizon, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates an update investment idea request
   */
  static validateUpdateRequest(request: UpdateInvestmentIdeaRequest): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // ID validation
    if (!request.id?.trim()) {
      errors.push({
        field: 'id',
        message: 'ID is required for updates',
        code: 'ID_REQUIRED',
        severity: 'error'
      });
    }

    if (!request.updatedBy?.trim()) {
      errors.push({
        field: 'updatedBy',
        message: 'UpdatedBy is required for updates',
        code: 'UPDATED_BY_REQUIRED',
        severity: 'error'
      });
    }

    // Validate only provided fields
    if (request.title !== undefined && !request.title.trim()) {
      errors.push({
        field: 'title',
        message: 'Title cannot be empty if provided',
        code: 'TITLE_EMPTY',
        severity: 'error'
      });
    }

    if (request.description !== undefined && !request.description.trim()) {
      errors.push({
        field: 'description',
        message: 'Description cannot be empty if provided',
        code: 'DESCRIPTION_EMPTY',
        severity: 'error'
      });
    }

    if (request.rationale !== undefined && !request.rationale.trim()) {
      errors.push({
        field: 'rationale',
        message: 'Rationale cannot be empty if provided',
        code: 'RATIONALE_EMPTY',
        severity: 'error'
      });
    }

    // Validate confidence score if provided
    if (request.confidenceScore !== undefined) {
      this.validateConfidenceScore(request.confidenceScore, errors, warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static validateBasicFields(idea: InvestmentIdea, errors: ValidationError[]): void {
    if (!idea.id?.trim()) {
      errors.push({
        field: 'id',
        message: 'ID is required',
        code: 'ID_REQUIRED',
        severity: 'error'
      });
    }

    if (!idea.title?.trim()) {
      errors.push({
        field: 'title',
        message: 'Title is required',
        code: 'TITLE_REQUIRED',
        severity: 'error'
      });
    }

    if (!idea.description?.trim()) {
      errors.push({
        field: 'description',
        message: 'Description is required',
        code: 'DESCRIPTION_REQUIRED',
        severity: 'error'
      });
    }

    if (!idea.rationale?.trim()) {
      errors.push({
        field: 'rationale',
        message: 'Rationale is required',
        code: 'RATIONALE_REQUIRED',
        severity: 'error'
      });
    }

    if (!idea.createdBy?.trim()) {
      errors.push({
        field: 'createdBy',
        message: 'CreatedBy is required',
        code: 'CREATED_BY_REQUIRED',
        severity: 'error'
      });
    }
  }

  private static validateBusinessLogic(
    idea: InvestmentIdea, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    // Validate confidence score
    this.validateConfidenceScore(idea.confidenceScore, errors, warnings);

    // Validate expiration date
    if (idea.expiresAt && idea.expiresAt <= idea.generatedAt) {
      errors.push({
        field: 'expiresAt',
        message: 'Expiration date must be after generation date',
        code: 'INVALID_EXPIRATION_DATE',
        severity: 'error'
      });
    }

    // Validate outcomes probabilities sum to 1
    if (idea.potentialOutcomes && idea.potentialOutcomes.length > 0) {
      const totalProbability = idea.potentialOutcomes.reduce(
        (sum, outcome) => sum + outcome.probability, 
        0
      );
      
      if (Math.abs(totalProbability - 1.0) > 0.01) {
        warnings.push({
          field: 'potentialOutcomes',
          message: `Outcome probabilities sum to ${totalProbability.toFixed(3)}, should sum to 1.0`,
          code: 'PROBABILITY_SUM_WARNING',
          recommendation: 'Adjust outcome probabilities to sum to 1.0'
        });
      }
    }

    // Validate investment strategy alignment with time horizon
    this.validateStrategyTimeHorizonAlignment(idea.strategy, idea.timeHorizon, warnings);
  }

  private static validateDataConsistency(
    idea: InvestmentIdea, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    // Validate investments array
    if (!idea.investments || idea.investments.length === 0) {
      errors.push({
        field: 'investments',
        message: 'At least one investment is required',
        code: 'INVESTMENTS_REQUIRED',
        severity: 'error'
      });
    }

    // Validate supporting data timestamps
    if (idea.supportingData) {
      const futureDataPoints = idea.supportingData.filter(
        dp => dp.timestamp > new Date()
      );
      
      if (futureDataPoints.length > 0) {
        warnings.push({
          field: 'supportingData',
          message: `${futureDataPoints.length} data points have future timestamps`,
          code: 'FUTURE_DATA_POINTS',
          recommendation: 'Verify data point timestamps are correct'
        });
      }
    }

    // Validate version consistency
    if (idea.version < 1) {
      errors.push({
        field: 'version',
        message: 'Version must be at least 1',
        code: 'INVALID_VERSION',
        severity: 'error'
      });
    }
  }

  private static validateCompliance(
    idea: InvestmentIdea, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    if (!idea.complianceStatus) {
      errors.push({
        field: 'complianceStatus',
        message: 'Compliance status is required',
        code: 'COMPLIANCE_STATUS_REQUIRED',
        severity: 'error'
      });
      return;
    }

    // Check for critical compliance issues
    const criticalIssues = idea.complianceStatus.issues?.filter(
      issue => issue.severity === 'critical'
    ) || [];

    if (criticalIssues.length > 0 && idea.complianceStatus.compliant) {
      errors.push({
        field: 'complianceStatus',
        message: 'Cannot be compliant with critical compliance issues',
        code: 'COMPLIANCE_CONTRADICTION',
        severity: 'error'
      });
    }
  }

  private static validateEnumValues(
    request: CreateInvestmentIdeaRequest | UpdateInvestmentIdeaRequest, 
    errors: ValidationError[]
  ): void {
    const validStrategies: InvestmentStrategy[] = [
      'buy', 'sell', 'hold', 'short', 'long', 'hedge', 'arbitrage', 
      'pairs-trade', 'momentum', 'value', 'growth', 'income', 'complex'
    ];

    const validTimeHorizons: TimeHorizon[] = [
      'intraday', 'short', 'medium', 'long', 'very-long'
    ];

    const validCategories: InvestmentCategory[] = [
      'equity', 'fixed-income', 'commodity', 'currency', 'alternative', 
      'mixed', 'thematic', 'sector-rotation', 'macro'
    ];

    const validRiskLevels: RiskLevel[] = [
      'very-low', 'low', 'moderate', 'high', 'very-high'
    ];

    const validAudiences: TargetAudience[] = [
      'retail', 'institutional', 'high-net-worth', 'pension-fund', 
      'hedge-fund', 'family-office'
    ];

    if ('strategy' in request && !validStrategies.includes(request.strategy)) {
      errors.push({
        field: 'strategy',
        message: `Invalid strategy. Must be one of: ${validStrategies.join(', ')}`,
        code: 'INVALID_STRATEGY',
        severity: 'error'
      });
    }

    if ('timeHorizon' in request && !validTimeHorizons.includes(request.timeHorizon)) {
      errors.push({
        field: 'timeHorizon',
        message: `Invalid time horizon. Must be one of: ${validTimeHorizons.join(', ')}`,
        code: 'INVALID_TIME_HORIZON',
        severity: 'error'
      });
    }

    if ('category' in request && !validCategories.includes(request.category)) {
      errors.push({
        field: 'category',
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
        code: 'INVALID_CATEGORY',
        severity: 'error'
      });
    }

    if ('riskLevel' in request && request.riskLevel && !validRiskLevels.includes(request.riskLevel)) {
      errors.push({
        field: 'riskLevel',
        message: `Invalid risk level. Must be one of: ${validRiskLevels.join(', ')}`,
        code: 'INVALID_RISK_LEVEL',
        severity: 'error'
      });
    }

    if ('targetAudience' in request && request.targetAudience) {
      const invalidAudiences = request.targetAudience.filter(
        audience => !validAudiences.includes(audience)
      );
      
      if (invalidAudiences.length > 0) {
        errors.push({
          field: 'targetAudience',
          message: `Invalid target audiences: ${invalidAudiences.join(', ')}. Must be one of: ${validAudiences.join(', ')}`,
          code: 'INVALID_TARGET_AUDIENCE',
          severity: 'error'
        });
      }
    }
  }

  private static validateNumericRanges(
    request: CreateInvestmentIdeaRequest | UpdateInvestmentIdeaRequest, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    if ('confidenceScore' in request && request.confidenceScore !== undefined) {
      this.validateConfidenceScore(request.confidenceScore, errors, warnings);
    }
  }

  private static validateConfidenceScore(
    confidenceScore: number, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    if (confidenceScore < 0 || confidenceScore > 1) {
      errors.push({
        field: 'confidenceScore',
        message: 'Confidence score must be between 0 and 1',
        code: 'INVALID_CONFIDENCE_SCORE',
        severity: 'error'
      });
    } else if (confidenceScore < 0.3) {
      warnings.push({
        field: 'confidenceScore',
        message: 'Low confidence score may indicate insufficient analysis',
        code: 'LOW_CONFIDENCE_WARNING',
        recommendation: 'Consider additional research or analysis'
      });
    }
  }

  private static validateArrayFields(
    request: CreateInvestmentIdeaRequest | UpdateInvestmentIdeaRequest, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    // Validate potential outcomes
    if ('potentialOutcomes' in request && request.potentialOutcomes) {
      this.validateOutcomes(request.potentialOutcomes, errors, warnings);
    }

    // Validate counter arguments
    if ('counterArguments' in request && request.counterArguments) {
      this.validateCounterArguments(request.counterArguments, errors, warnings);
    }

    // Validate target audience
    if ('targetAudience' in request && request.targetAudience) {
      if (request.targetAudience.length === 0) {
        warnings.push({
          field: 'targetAudience',
          message: 'No target audience specified',
          code: 'NO_TARGET_AUDIENCE',
          recommendation: 'Consider specifying target audience for better relevance'
        });
      }
    }
  }

  private static validateOutcomes(
    outcomes: Outcome[], 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    if (outcomes.length === 0) {
      warnings.push({
        field: 'potentialOutcomes',
        message: 'No potential outcomes specified',
        code: 'NO_OUTCOMES',
        recommendation: 'Consider adding potential outcomes for better analysis'
      });
      return;
    }

    outcomes.forEach((outcome, index) => {
      if (outcome.probability < 0 || outcome.probability > 1) {
        errors.push({
          field: `potentialOutcomes[${index}].probability`,
          message: 'Outcome probability must be between 0 and 1',
          code: 'INVALID_OUTCOME_PROBABILITY',
          severity: 'error'
        });
      }

      if (outcome.timeToRealization < 0) {
        errors.push({
          field: `potentialOutcomes[${index}].timeToRealization`,
          message: 'Time to realization cannot be negative',
          code: 'INVALID_TIME_TO_REALIZATION',
          severity: 'error'
        });
      }
    });

    // Check for required scenario types
    const scenarios = outcomes.map(o => o.scenario);
    if (!scenarios.includes('expected')) {
      warnings.push({
        field: 'potentialOutcomes',
        message: 'No expected scenario provided',
        code: 'NO_EXPECTED_SCENARIO',
        recommendation: 'Consider adding an expected outcome scenario'
      });
    }
  }

  private static validateCounterArguments(
    counterArguments: CounterArgument[], 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    counterArguments.forEach((arg, index) => {
      if (arg.probability < 0 || arg.probability > 1) {
        errors.push({
          field: `counterArguments[${index}].probability`,
          message: 'Counter argument probability must be between 0 and 1',
          code: 'INVALID_COUNTER_ARGUMENT_PROBABILITY',
          severity: 'error'
        });
      }

      if (!arg.description?.trim()) {
        errors.push({
          field: `counterArguments[${index}].description`,
          message: 'Counter argument description is required',
          code: 'COUNTER_ARGUMENT_DESCRIPTION_REQUIRED',
          severity: 'error'
        });
      }
    });

    if (counterArguments.length === 0) {
      warnings.push({
        field: 'counterArguments',
        message: 'No counter arguments provided',
        code: 'NO_COUNTER_ARGUMENTS',
        recommendation: 'Consider adding counter arguments for balanced analysis'
      });
    }
  }

  private static validateStrategyTimeHorizonAlignment(
    strategy: InvestmentStrategy, 
    timeHorizon: TimeHorizon, 
    warnings: ValidationWarning[]
  ): void {
    const shortTermStrategies: InvestmentStrategy[] = ['momentum', 'arbitrage', 'pairs-trade'];
    const longTermStrategies: InvestmentStrategy[] = ['value', 'growth', 'income'];

    if (shortTermStrategies.includes(strategy) && ['long', 'very-long'].includes(timeHorizon)) {
      warnings.push({
        field: 'strategy',
        message: `Strategy '${strategy}' may not align well with '${timeHorizon}' time horizon`,
        code: 'STRATEGY_TIME_HORIZON_MISMATCH',
        recommendation: 'Consider adjusting strategy or time horizon for better alignment'
      });
    }

    if (longTermStrategies.includes(strategy) && ['intraday', 'short'].includes(timeHorizon)) {
      warnings.push({
        field: 'strategy',
        message: `Strategy '${strategy}' may not align well with '${timeHorizon}' time horizon`,
        code: 'STRATEGY_TIME_HORIZON_MISMATCH',
        recommendation: 'Consider adjusting strategy or time horizon for better alignment'
      });
    }
  }
}