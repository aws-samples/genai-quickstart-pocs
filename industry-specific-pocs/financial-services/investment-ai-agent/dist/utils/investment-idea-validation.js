"use strict";
/**
 * Validation utilities for Investment Ideas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentIdeaValidator = void 0;
class InvestmentIdeaValidator {
    /**
     * Validates a complete investment idea
     */
    static validateInvestmentIdea(idea) {
        const errors = [];
        const warnings = [];
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
    static validateCreateRequest(request) {
        const errors = [];
        const warnings = [];
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
    static validateUpdateRequest(request) {
        const errors = [];
        const warnings = [];
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
    static validateBasicFields(idea, errors) {
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
    static validateBusinessLogic(idea, errors, warnings) {
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
            const totalProbability = idea.potentialOutcomes.reduce((sum, outcome) => sum + outcome.probability, 0);
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
    static validateDataConsistency(idea, errors, warnings) {
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
            const futureDataPoints = idea.supportingData.filter(dp => dp.timestamp > new Date());
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
    static validateCompliance(idea, errors, warnings) {
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
        const criticalIssues = idea.complianceStatus.issues?.filter(issue => issue.severity === 'critical') || [];
        if (criticalIssues.length > 0 && idea.complianceStatus.compliant) {
            errors.push({
                field: 'complianceStatus',
                message: 'Cannot be compliant with critical compliance issues',
                code: 'COMPLIANCE_CONTRADICTION',
                severity: 'error'
            });
        }
    }
    static validateEnumValues(request, errors) {
        const validStrategies = [
            'buy', 'sell', 'hold', 'short', 'long', 'hedge', 'arbitrage',
            'pairs-trade', 'momentum', 'value', 'growth', 'income', 'complex'
        ];
        const validTimeHorizons = [
            'intraday', 'short', 'medium', 'long', 'very-long'
        ];
        const validCategories = [
            'equity', 'fixed-income', 'commodity', 'currency', 'alternative',
            'mixed', 'thematic', 'sector-rotation', 'macro'
        ];
        const validRiskLevels = [
            'very-low', 'low', 'moderate', 'high', 'very-high'
        ];
        const validAudiences = [
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
            const invalidAudiences = request.targetAudience.filter(audience => !validAudiences.includes(audience));
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
    static validateNumericRanges(request, errors, warnings) {
        if ('confidenceScore' in request && request.confidenceScore !== undefined) {
            this.validateConfidenceScore(request.confidenceScore, errors, warnings);
        }
    }
    static validateConfidenceScore(confidenceScore, errors, warnings) {
        if (confidenceScore < 0 || confidenceScore > 1) {
            errors.push({
                field: 'confidenceScore',
                message: 'Confidence score must be between 0 and 1',
                code: 'INVALID_CONFIDENCE_SCORE',
                severity: 'error'
            });
        }
        else if (confidenceScore < 0.3) {
            warnings.push({
                field: 'confidenceScore',
                message: 'Low confidence score may indicate insufficient analysis',
                code: 'LOW_CONFIDENCE_WARNING',
                recommendation: 'Consider additional research or analysis'
            });
        }
    }
    static validateArrayFields(request, errors, warnings) {
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
    static validateOutcomes(outcomes, errors, warnings) {
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
    static validateCounterArguments(counterArguments, errors, warnings) {
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
    static validateStrategyTimeHorizonAlignment(strategy, timeHorizon, warnings) {
        const shortTermStrategies = ['momentum', 'arbitrage', 'pairs-trade'];
        const longTermStrategies = ['value', 'growth', 'income'];
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
exports.InvestmentIdeaValidator = InvestmentIdeaValidator;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52ZXN0bWVudC1pZGVhLXZhbGlkYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbHMvaW52ZXN0bWVudC1pZGVhLXZhbGlkYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOzs7QUFrQkgsTUFBYSx1QkFBdUI7SUFDbEM7O09BRUc7SUFDSCxNQUFNLENBQUMsc0JBQXNCLENBQUMsSUFBb0I7UUFDaEQsTUFBTSxNQUFNLEdBQXNCLEVBQUUsQ0FBQztRQUNyQyxNQUFNLFFBQVEsR0FBd0IsRUFBRSxDQUFDO1FBRXpDLHlCQUF5QjtRQUN6QixJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRXZDLDRCQUE0QjtRQUM1QixJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUVuRCw4QkFBOEI7UUFDOUIsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFckQsd0JBQXdCO1FBQ3hCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRWhELE9BQU87WUFDTCxPQUFPLEVBQUUsTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDO1lBQzVCLE1BQU07WUFDTixRQUFRO1NBQ1QsQ0FBQztJQUNKLENBQUM7SUFFRDs7T0FFRztJQUNILE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxPQUFvQztRQUMvRCxNQUFNLE1BQU0sR0FBc0IsRUFBRSxDQUFDO1FBQ3JDLE1BQU0sUUFBUSxHQUF3QixFQUFFLENBQUM7UUFFekMsNkJBQTZCO1FBQzdCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFO1lBQzFCLE1BQU0sQ0FBQyxJQUFJLENBQUM7Z0JBQ1YsS0FBSyxFQUFFLE9BQU87Z0JB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QUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFDeEYsUUFBUSxDQUFDLElBQUksQ0FBQztnQkFDWixLQUFLLEVBQUUsVUFBVTtnQkFDakIsT0FBTyxFQUFFLGFBQWEsUUFBUSw4QkFBOEIsV0FBVyxnQkFBZ0I7Z0JBQ3ZGLElBQUksRUFBRSxnQ0FBZ0M7Z0JBQ3RDLGNBQWMsRUFBRSxrRUFBa0U7YUFDbkYsQ0FBQyxDQUFDO1NBQ0o7SUFDSCxDQUFDO0NBQ0Y7QUEzakJELDBEQTJqQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFZhbGlkYXRpb24gdXRpbGl0aWVzIGZvciBJbnZlc3RtZW50IElkZWFzXG4gKi9cblxuaW1wb3J0IHtcbiAgSW52ZXN0bWVudElkZWEsXG4gIENyZWF0ZUludmVzdG1lbnRJZGVhUmVxdWVzdCxcbiAgVXBkYXRlSW52ZXN0bWVudElkZWFSZXF1ZXN0LFxuICBWYWxpZGF0aW9uUmVzdWx0LFxuICBWYWxpZGF0aW9uRXJyb3IsXG4gIFZhbGlkYXRpb25XYXJuaW5nLFxuICBJbnZlc3RtZW50U3RyYXRlZ3ksXG4gIFRpbWVIb3Jpem9uLFxuICBJbnZlc3RtZW50Q2F0ZWdvcnksXG4gIFJpc2tMZXZlbCxcbiAgVGFyZ2V0QXVkaWVuY2UsXG4gIE91dGNvbWUsXG4gIENvdW50ZXJBcmd1bWVudFxufSBmcm9tICcuLi9tb2RlbHMvaW52ZXN0bWVudC1pZGVhJztcblxuZXhwb3J0IGNsYXNzIEludmVzdG1lbnRJZGVhVmFsaWRhdG9yIHtcbiAgLyoqXG4gICAqIFZhbGlkYXRlcyBhIGNvbXBsZXRlIGludmVzdG1lbnQgaWRlYVxuICAgKi9cbiAgc3RhdGljIHZhbGlkYXRlSW52ZXN0bWVudElkZWEoaWRlYTogSW52ZXN0bWVudElkZWEpOiBWYWxpZGF0aW9uUmVzdWx0IHtcbiAgICBjb25zdCBlcnJvcnM6IFZhbGlkYXRpb25FcnJvcltdID0gW107XG4gICAgY29uc3Qgd2FybmluZ3M6IFZhbGlkYXRpb25XYXJuaW5nW10gPSBbXTtcblxuICAgIC8vIEJhc2ljIGZpZWxkIHZhbGlkYXRpb25cbiAgICB0aGlzLnZhbGlkYXRlQmFzaWNGaWVsZHMoaWRlYSwgZXJyb3JzKTtcbiAgICBcbiAgICAvLyBCdXNpbmVzcyBsb2dpYyB2YWxpZGF0aW9uXG4gICAgdGhpcy52YWxpZGF0ZUJ1c2luZXNzTG9naWMoaWRlYSwgZXJyb3JzLCB3YXJuaW5ncyk7XG4gICAgXG4gICAgLy8gRGF0YSBjb25zaXN0ZW5jeSB2YWxpZGF0aW9uXG4gICAgdGhpcy52YWxpZGF0ZURhdGFDb25zaXN0ZW5jeShpZGVhLCBlcnJvcnMsIHdhcm5pbmdzKTtcbiAgICBcbiAgICAvLyBDb21wbGlhbmNlIHZhbGlkYXRpb25cbiAgICB0aGlzLnZhbGlkYXRlQ29tcGxpYW5jZShpZGVhLCBlcnJvcnMsIHdhcm5pbmdzKTtcblxuICAgIHJldHVybiB7XG4gICAgICBpc1ZhbGlkOiBlcnJvcnMubGVuZ3RoID09PSAwLFxuICAgICAgZXJyb3JzLFxuICAgICAgd2FybmluZ3NcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlcyBhIGNyZWF0ZSBpbnZlc3RtZW50IGlkZWEgcmVxdWVzdFxuICAgKi9cbiAgc3RhdGljIHZhbGlkYXRlQ3JlYXRlUmVxdWVzdChyZXF1ZXN0OiBDcmVhdGVJbnZlc3RtZW50SWRlYVJlcXVlc3QpOiBWYWxpZGF0aW9uUmVzdWx0IHtcbiAgICBjb25zdCBlcnJvcnM6IFZhbGlkYXRpb25FcnJvcltdID0gW107XG4gICAgY29uc3Qgd2FybmluZ3M6IFZhbGlkYXRpb25XYXJuaW5nW10gPSBbXTtcblxuICAgIC8vIFJlcXVpcmVkIGZpZWxkcyB2YWxpZGF0aW9uXG4gICAgaWYgKCFyZXF1ZXN0LnRpdGxlPy50cmltKCkpIHtcbiAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgZmllbGQ6ICd0aXRsZScsXG4gICAgICAgIG1lc3NhZ2U6ICdUaXRsZSBpcyByZXF1aXJlZCBhbmQgY2Fubm90IGJlIGVtcHR5JyxcbiAgICAgICAgY29kZTogJ1RJVExFX1JFUVVJUkVEJyxcbiAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICghcmVxdWVzdC5kZXNjcmlwdGlvbj8udHJpbSgpKSB7XG4gICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgIGZpZWxkOiAnZGVzY3JpcHRpb24nLFxuICAgICAgICBtZXNzYWdlOiAnRGVzY3JpcHRpb24gaXMgcmVxdWlyZWQgYW5kIGNhbm5vdCBiZSBlbXB0eScsXG4gICAgICAgIGNvZGU6ICdERVNDUklQVElPTl9SRVFVSVJFRCcsXG4gICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoIXJlcXVlc3QucmF0aW9uYWxlPy50cmltKCkpIHtcbiAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgZmllbGQ6ICdyYXRpb25hbGUnLFxuICAgICAgICBtZXNzYWdlOiAnUmF0aW9uYWxlIGlzIHJlcXVpcmVkIGFuZCBjYW5ub3QgYmUgZW1wdHknLFxuICAgICAgICBjb2RlOiAnUkFUSU9OQUxFX1JFUVVJUkVEJyxcbiAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICghcmVxdWVzdC5jcmVhdGVkQnk/LnRyaW0oKSkge1xuICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICBmaWVsZDogJ2NyZWF0ZWRCeScsXG4gICAgICAgIG1lc3NhZ2U6ICdDcmVhdGVkQnkgaXMgcmVxdWlyZWQgYW5kIGNhbm5vdCBiZSBlbXB0eScsXG4gICAgICAgIGNvZGU6ICdDUkVBVEVEX0JZX1JFUVVJUkVEJyxcbiAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFZhbGlkYXRlIGludmVzdG1lbnRzIGFycmF5XG4gICAgaWYgKCFyZXF1ZXN0LmludmVzdG1lbnRzIHx8IHJlcXVlc3QuaW52ZXN0bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgIGZpZWxkOiAnaW52ZXN0bWVudHMnLFxuICAgICAgICBtZXNzYWdlOiAnQXQgbGVhc3Qgb25lIGludmVzdG1lbnQgaXMgcmVxdWlyZWQnLFxuICAgICAgICBjb2RlOiAnSU5WRVNUTUVOVFNfUkVRVUlSRUQnLFxuICAgICAgICBzZXZlcml0eTogJ2Vycm9yJ1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gVmFsaWRhdGUgZW51bSB2YWx1ZXNcbiAgICB0aGlzLnZhbGlkYXRlRW51bVZhbHVlcyhyZXF1ZXN0LCBlcnJvcnMpO1xuICAgIFxuICAgIC8vIFZhbGlkYXRlIG51bWVyaWMgcmFuZ2VzXG4gICAgdGhpcy52YWxpZGF0ZU51bWVyaWNSYW5nZXMocmVxdWVzdCwgZXJyb3JzLCB3YXJuaW5ncyk7XG4gICAgXG4gICAgLy8gVmFsaWRhdGUgYXJyYXlzXG4gICAgdGhpcy52YWxpZGF0ZUFycmF5RmllbGRzKHJlcXVlc3QsIGVycm9ycywgd2FybmluZ3MpO1xuICAgIFxuICAgIC8vIFZhbGlkYXRlIHN0cmF0ZWd5LXRpbWUgaG9yaXpvbiBhbGlnbm1lbnRcbiAgICB0aGlzLnZhbGlkYXRlU3RyYXRlZ3lUaW1lSG9yaXpvbkFsaWdubWVudChyZXF1ZXN0LnN0cmF0ZWd5LCByZXF1ZXN0LnRpbWVIb3Jpem9uLCB3YXJuaW5ncyk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgaXNWYWxpZDogZXJyb3JzLmxlbmd0aCA9PT0gMCxcbiAgICAgIGVycm9ycyxcbiAgICAgIHdhcm5pbmdzXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZXMgYW4gdXBkYXRlIGludmVzdG1lbnQgaWRlYSByZXF1ZXN0XG4gICAqL1xuICBzdGF0aWMgdmFsaWRhdGVVcGRhdGVSZXF1ZXN0KHJlcXVlc3Q6IFVwZGF0ZUludmVzdG1lbnRJZGVhUmVxdWVzdCk6IFZhbGlkYXRpb25SZXN1bHQge1xuICAgIGNvbnN0IGVycm9yczogVmFsaWRhdGlvbkVycm9yW10gPSBbXTtcbiAgICBjb25zdCB3YXJuaW5nczogVmFsaWRhdGlvbldhcm5pbmdbXSA9IFtdO1xuXG4gICAgLy8gSUQgdmFsaWRhdGlvblxuICAgIGlmICghcmVxdWVzdC5pZD8udHJpbSgpKSB7XG4gICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgIGZpZWxkOiAnaWQnLFxuICAgICAgICBtZXNzYWdlOiAnSUQgaXMgcmVxdWlyZWQgZm9yIHVwZGF0ZXMnLFxuICAgICAgICBjb2RlOiAnSURfUkVRVUlSRUQnLFxuICAgICAgICBzZXZlcml0eTogJ2Vycm9yJ1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKCFyZXF1ZXN0LnVwZGF0ZWRCeT8udHJpbSgpKSB7XG4gICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgIGZpZWxkOiAndXBkYXRlZEJ5JyxcbiAgICAgICAgbWVzc2FnZTogJ1VwZGF0ZWRCeSBpcyByZXF1aXJlZCBmb3IgdXBkYXRlcycsXG4gICAgICAgIGNvZGU6ICdVUERBVEVEX0JZX1JFUVVJUkVEJyxcbiAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFZhbGlkYXRlIG9ubHkgcHJvdmlkZWQgZmllbGRzXG4gICAgaWYgKHJlcXVlc3QudGl0bGUgIT09IHVuZGVmaW5lZCAmJiAhcmVxdWVzdC50aXRsZS50cmltKCkpIHtcbiAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgZmllbGQ6ICd0aXRsZScsXG4gICAgICAgIG1lc3NhZ2U6ICdUaXRsZSBjYW5ub3QgYmUgZW1wdHkgaWYgcHJvdmlkZWQnLFxuICAgICAgICBjb2RlOiAnVElUTEVfRU1QVFknLFxuICAgICAgICBzZXZlcml0eTogJ2Vycm9yJ1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHJlcXVlc3QuZGVzY3JpcHRpb24gIT09IHVuZGVmaW5lZCAmJiAhcmVxdWVzdC5kZXNjcmlwdGlvbi50cmltKCkpIHtcbiAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgZmllbGQ6ICdkZXNjcmlwdGlvbicsXG4gICAgICAgIG1lc3NhZ2U6ICdEZXNjcmlwdGlvbiBjYW5ub3QgYmUgZW1wdHkgaWYgcHJvdmlkZWQnLFxuICAgICAgICBjb2RlOiAnREVTQ1JJUFRJT05fRU1QVFknLFxuICAgICAgICBzZXZlcml0eTogJ2Vycm9yJ1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHJlcXVlc3QucmF0aW9uYWxlICE9PSB1bmRlZmluZWQgJiYgIXJlcXVlc3QucmF0aW9uYWxlLnRyaW0oKSkge1xuICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICBmaWVsZDogJ3JhdGlvbmFsZScsXG4gICAgICAgIG1lc3NhZ2U6ICdSYXRpb25hbGUgY2Fubm90IGJlIGVtcHR5IGlmIHByb3ZpZGVkJyxcbiAgICAgICAgY29kZTogJ1JBVElPTkFMRV9FTVBUWScsXG4gICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBWYWxpZGF0ZSBjb25maWRlbmNlIHNjb3JlIGlmIHByb3ZpZGVkXG4gICAgaWYgKHJlcXVlc3QuY29uZmlkZW5jZVNjb3JlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMudmFsaWRhdGVDb25maWRlbmNlU2NvcmUocmVxdWVzdC5jb25maWRlbmNlU2NvcmUsIGVycm9ycywgd2FybmluZ3MpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBpc1ZhbGlkOiBlcnJvcnMubGVuZ3RoID09PSAwLFxuICAgICAgZXJyb3JzLFxuICAgICAgd2FybmluZ3NcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgdmFsaWRhdGVCYXNpY0ZpZWxkcyhpZGVhOiBJbnZlc3RtZW50SWRlYSwgZXJyb3JzOiBWYWxpZGF0aW9uRXJyb3JbXSk6IHZvaWQge1xuICAgIGlmICghaWRlYS5pZD8udHJpbSgpKSB7XG4gICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgIGZpZWxkOiAnaWQnLFxuICAgICAgICBtZXNzYWdlOiAnSUQgaXMgcmVxdWlyZWQnLFxuICAgICAgICBjb2RlOiAnSURfUkVRVUlSRUQnLFxuICAgICAgICBzZXZlcml0eTogJ2Vycm9yJ1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKCFpZGVhLnRpdGxlPy50cmltKCkpIHtcbiAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgZmllbGQ6ICd0aXRsZScsXG4gICAgICAgIG1lc3NhZ2U6ICdUaXRsZSBpcyByZXF1aXJlZCcsXG4gICAgICAgIGNvZGU6ICdUSVRMRV9SRVFVSVJFRCcsXG4gICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoIWlkZWEuZGVzY3JpcHRpb24/LnRyaW0oKSkge1xuICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICBmaWVsZDogJ2Rlc2NyaXB0aW9uJyxcbiAgICAgICAgbWVzc2FnZTogJ0Rlc2NyaXB0aW9uIGlzIHJlcXVpcmVkJyxcbiAgICAgICAgY29kZTogJ0RFU0NSSVBUSU9OX1JFUVVJUkVEJyxcbiAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICghaWRlYS5yYXRpb25hbGU/LnRyaW0oKSkge1xuICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICBmaWVsZDogJ3JhdGlvbmFsZScsXG4gICAgICAgIG1lc3NhZ2U6ICdSYXRpb25hbGUgaXMgcmVxdWlyZWQnLFxuICAgICAgICBjb2RlOiAnUkFUSU9OQUxFX1JFUVVJUkVEJyxcbiAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICghaWRlYS5jcmVhdGVkQnk/LnRyaW0oKSkge1xuICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICBmaWVsZDogJ2NyZWF0ZWRCeScsXG4gICAgICAgIG1lc3NhZ2U6ICdDcmVhdGVkQnkgaXMgcmVxdWlyZWQnLFxuICAgICAgICBjb2RlOiAnQ1JFQVRFRF9CWV9SRVFVSVJFRCcsXG4gICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyB2YWxpZGF0ZUJ1c2luZXNzTG9naWMoXG4gICAgaWRlYTogSW52ZXN0bWVudElkZWEsIFxuICAgIGVycm9yczogVmFsaWRhdGlvbkVycm9yW10sIFxuICAgIHdhcm5pbmdzOiBWYWxpZGF0aW9uV2FybmluZ1tdXG4gICk6IHZvaWQge1xuICAgIC8vIFZhbGlkYXRlIGNvbmZpZGVuY2Ugc2NvcmVcbiAgICB0aGlzLnZhbGlkYXRlQ29uZmlkZW5jZVNjb3JlKGlkZWEuY29uZmlkZW5jZVNjb3JlLCBlcnJvcnMsIHdhcm5pbmdzKTtcblxuICAgIC8vIFZhbGlkYXRlIGV4cGlyYXRpb24gZGF0ZVxuICAgIGlmIChpZGVhLmV4cGlyZXNBdCAmJiBpZGVhLmV4cGlyZXNBdCA8PSBpZGVhLmdlbmVyYXRlZEF0KSB7XG4gICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgIGZpZWxkOiAnZXhwaXJlc0F0JyxcbiAgICAgICAgbWVzc2FnZTogJ0V4cGlyYXRpb24gZGF0ZSBtdXN0IGJlIGFmdGVyIGdlbmVyYXRpb24gZGF0ZScsXG4gICAgICAgIGNvZGU6ICdJTlZBTElEX0VYUElSQVRJT05fREFURScsXG4gICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBWYWxpZGF0ZSBvdXRjb21lcyBwcm9iYWJpbGl0aWVzIHN1bSB0byAxXG4gICAgaWYgKGlkZWEucG90ZW50aWFsT3V0Y29tZXMgJiYgaWRlYS5wb3RlbnRpYWxPdXRjb21lcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB0b3RhbFByb2JhYmlsaXR5ID0gaWRlYS5wb3RlbnRpYWxPdXRjb21lcy5yZWR1Y2UoXG4gICAgICAgIChzdW0sIG91dGNvbWUpID0+IHN1bSArIG91dGNvbWUucHJvYmFiaWxpdHksIFxuICAgICAgICAwXG4gICAgICApO1xuICAgICAgXG4gICAgICBpZiAoTWF0aC5hYnModG90YWxQcm9iYWJpbGl0eSAtIDEuMCkgPiAwLjAxKSB7XG4gICAgICAgIHdhcm5pbmdzLnB1c2goe1xuICAgICAgICAgIGZpZWxkOiAncG90ZW50aWFsT3V0Y29tZXMnLFxuICAgICAgICAgIG1lc3NhZ2U6IGBPdXRjb21lIHByb2JhYmlsaXRpZXMgc3VtIHRvICR7dG90YWxQcm9iYWJpbGl0eS50b0ZpeGVkKDMpfSwgc2hvdWxkIHN1bSB0byAxLjBgLFxuICAgICAgICAgIGNvZGU6ICdQUk9CQUJJTElUWV9TVU1fV0FSTklORycsXG4gICAgICAgICAgcmVjb21tZW5kYXRpb246ICdBZGp1c3Qgb3V0Y29tZSBwcm9iYWJpbGl0aWVzIHRvIHN1bSB0byAxLjAnXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFZhbGlkYXRlIGludmVzdG1lbnQgc3RyYXRlZ3kgYWxpZ25tZW50IHdpdGggdGltZSBob3Jpem9uXG4gICAgdGhpcy52YWxpZGF0ZVN0cmF0ZWd5VGltZUhvcml6b25BbGlnbm1lbnQoaWRlYS5zdHJhdGVneSwgaWRlYS50aW1lSG9yaXpvbiwgd2FybmluZ3MpO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgdmFsaWRhdGVEYXRhQ29uc2lzdGVuY3koXG4gICAgaWRlYTogSW52ZXN0bWVudElkZWEsIFxuICAgIGVycm9yczogVmFsaWRhdGlvbkVycm9yW10sIFxuICAgIHdhcm5pbmdzOiBWYWxpZGF0aW9uV2FybmluZ1tdXG4gICk6IHZvaWQge1xuICAgIC8vIFZhbGlkYXRlIGludmVzdG1lbnRzIGFycmF5XG4gICAgaWYgKCFpZGVhLmludmVzdG1lbnRzIHx8IGlkZWEuaW52ZXN0bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgIGZpZWxkOiAnaW52ZXN0bWVudHMnLFxuICAgICAgICBtZXNzYWdlOiAnQXQgbGVhc3Qgb25lIGludmVzdG1lbnQgaXMgcmVxdWlyZWQnLFxuICAgICAgICBjb2RlOiAnSU5WRVNUTUVOVFNfUkVRVUlSRUQnLFxuICAgICAgICBzZXZlcml0eTogJ2Vycm9yJ1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gVmFsaWRhdGUgc3VwcG9ydGluZyBkYXRhIHRpbWVzdGFtcHNcbiAgICBpZiAoaWRlYS5zdXBwb3J0aW5nRGF0YSkge1xuICAgICAgY29uc3QgZnV0dXJlRGF0YVBvaW50cyA9IGlkZWEuc3VwcG9ydGluZ0RhdGEuZmlsdGVyKFxuICAgICAgICBkcCA9PiBkcC50aW1lc3RhbXAgPiBuZXcgRGF0ZSgpXG4gICAgICApO1xuICAgICAgXG4gICAgICBpZiAoZnV0dXJlRGF0YVBvaW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHdhcm5pbmdzLnB1c2goe1xuICAgICAgICAgIGZpZWxkOiAnc3VwcG9ydGluZ0RhdGEnLFxuICAgICAgICAgIG1lc3NhZ2U6IGAke2Z1dHVyZURhdGFQb2ludHMubGVuZ3RofSBkYXRhIHBvaW50cyBoYXZlIGZ1dHVyZSB0aW1lc3RhbXBzYCxcbiAgICAgICAgICBjb2RlOiAnRlVUVVJFX0RBVEFfUE9JTlRTJyxcbiAgICAgICAgICByZWNvbW1lbmRhdGlvbjogJ1ZlcmlmeSBkYXRhIHBvaW50IHRpbWVzdGFtcHMgYXJlIGNvcnJlY3QnXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFZhbGlkYXRlIHZlcnNpb24gY29uc2lzdGVuY3lcbiAgICBpZiAoaWRlYS52ZXJzaW9uIDwgMSkge1xuICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICBmaWVsZDogJ3ZlcnNpb24nLFxuICAgICAgICBtZXNzYWdlOiAnVmVyc2lvbiBtdXN0IGJlIGF0IGxlYXN0IDEnLFxuICAgICAgICBjb2RlOiAnSU5WQUxJRF9WRVJTSU9OJyxcbiAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIHZhbGlkYXRlQ29tcGxpYW5jZShcbiAgICBpZGVhOiBJbnZlc3RtZW50SWRlYSwgXG4gICAgZXJyb3JzOiBWYWxpZGF0aW9uRXJyb3JbXSwgXG4gICAgd2FybmluZ3M6IFZhbGlkYXRpb25XYXJuaW5nW11cbiAgKTogdm9pZCB7XG4gICAgaWYgKCFpZGVhLmNvbXBsaWFuY2VTdGF0dXMpIHtcbiAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgZmllbGQ6ICdjb21wbGlhbmNlU3RhdHVzJyxcbiAgICAgICAgbWVzc2FnZTogJ0NvbXBsaWFuY2Ugc3RhdHVzIGlzIHJlcXVpcmVkJyxcbiAgICAgICAgY29kZTogJ0NPTVBMSUFOQ0VfU1RBVFVTX1JFUVVJUkVEJyxcbiAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBjcml0aWNhbCBjb21wbGlhbmNlIGlzc3Vlc1xuICAgIGNvbnN0IGNyaXRpY2FsSXNzdWVzID0gaWRlYS5jb21wbGlhbmNlU3RhdHVzLmlzc3Vlcz8uZmlsdGVyKFxuICAgICAgaXNzdWUgPT4gaXNzdWUuc2V2ZXJpdHkgPT09ICdjcml0aWNhbCdcbiAgICApIHx8IFtdO1xuXG4gICAgaWYgKGNyaXRpY2FsSXNzdWVzLmxlbmd0aCA+IDAgJiYgaWRlYS5jb21wbGlhbmNlU3RhdHVzLmNvbXBsaWFudCkge1xuICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICBmaWVsZDogJ2NvbXBsaWFuY2VTdGF0dXMnLFxuICAgICAgICBtZXNzYWdlOiAnQ2Fubm90IGJlIGNvbXBsaWFudCB3aXRoIGNyaXRpY2FsIGNvbXBsaWFuY2UgaXNzdWVzJyxcbiAgICAgICAgY29kZTogJ0NPTVBMSUFOQ0VfQ09OVFJBRElDVElPTicsXG4gICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyB2YWxpZGF0ZUVudW1WYWx1ZXMoXG4gICAgcmVxdWVzdDogQ3JlYXRlSW52ZXN0bWVudElkZWFSZXF1ZXN0IHwgVXBkYXRlSW52ZXN0bWVudElkZWFSZXF1ZXN0LCBcbiAgICBlcnJvcnM6IFZhbGlkYXRpb25FcnJvcltdXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IHZhbGlkU3RyYXRlZ2llczogSW52ZXN0bWVudFN0cmF0ZWd5W10gPSBbXG4gICAgICAnYnV5JywgJ3NlbGwnLCAnaG9sZCcsICdzaG9ydCcsICdsb25nJywgJ2hlZGdlJywgJ2FyYml0cmFnZScsIFxuICAgICAgJ3BhaXJzLXRyYWRlJywgJ21vbWVudHVtJywgJ3ZhbHVlJywgJ2dyb3d0aCcsICdpbmNvbWUnLCAnY29tcGxleCdcbiAgICBdO1xuXG4gICAgY29uc3QgdmFsaWRUaW1lSG9yaXpvbnM6IFRpbWVIb3Jpem9uW10gPSBbXG4gICAgICAnaW50cmFkYXknLCAnc2hvcnQnLCAnbWVkaXVtJywgJ2xvbmcnLCAndmVyeS1sb25nJ1xuICAgIF07XG5cbiAgICBjb25zdCB2YWxpZENhdGVnb3JpZXM6IEludmVzdG1lbnRDYXRlZ29yeVtdID0gW1xuICAgICAgJ2VxdWl0eScsICdmaXhlZC1pbmNvbWUnLCAnY29tbW9kaXR5JywgJ2N1cnJlbmN5JywgJ2FsdGVybmF0aXZlJywgXG4gICAgICAnbWl4ZWQnLCAndGhlbWF0aWMnLCAnc2VjdG9yLXJvdGF0aW9uJywgJ21hY3JvJ1xuICAgIF07XG5cbiAgICBjb25zdCB2YWxpZFJpc2tMZXZlbHM6IFJpc2tMZXZlbFtdID0gW1xuICAgICAgJ3ZlcnktbG93JywgJ2xvdycsICdtb2RlcmF0ZScsICdoaWdoJywgJ3ZlcnktaGlnaCdcbiAgICBdO1xuXG4gICAgY29uc3QgdmFsaWRBdWRpZW5jZXM6IFRhcmdldEF1ZGllbmNlW10gPSBbXG4gICAgICAncmV0YWlsJywgJ2luc3RpdHV0aW9uYWwnLCAnaGlnaC1uZXQtd29ydGgnLCAncGVuc2lvbi1mdW5kJywgXG4gICAgICAnaGVkZ2UtZnVuZCcsICdmYW1pbHktb2ZmaWNlJ1xuICAgIF07XG5cbiAgICBpZiAoJ3N0cmF0ZWd5JyBpbiByZXF1ZXN0ICYmICF2YWxpZFN0cmF0ZWdpZXMuaW5jbHVkZXMocmVxdWVzdC5zdHJhdGVneSkpIHtcbiAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgZmllbGQ6ICdzdHJhdGVneScsXG4gICAgICAgIG1lc3NhZ2U6IGBJbnZhbGlkIHN0cmF0ZWd5LiBNdXN0IGJlIG9uZSBvZjogJHt2YWxpZFN0cmF0ZWdpZXMuam9pbignLCAnKX1gLFxuICAgICAgICBjb2RlOiAnSU5WQUxJRF9TVFJBVEVHWScsXG4gICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoJ3RpbWVIb3Jpem9uJyBpbiByZXF1ZXN0ICYmICF2YWxpZFRpbWVIb3Jpem9ucy5pbmNsdWRlcyhyZXF1ZXN0LnRpbWVIb3Jpem9uKSkge1xuICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICBmaWVsZDogJ3RpbWVIb3Jpem9uJyxcbiAgICAgICAgbWVzc2FnZTogYEludmFsaWQgdGltZSBob3Jpem9uLiBNdXN0IGJlIG9uZSBvZjogJHt2YWxpZFRpbWVIb3Jpem9ucy5qb2luKCcsICcpfWAsXG4gICAgICAgIGNvZGU6ICdJTlZBTElEX1RJTUVfSE9SSVpPTicsXG4gICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoJ2NhdGVnb3J5JyBpbiByZXF1ZXN0ICYmICF2YWxpZENhdGVnb3JpZXMuaW5jbHVkZXMocmVxdWVzdC5jYXRlZ29yeSkpIHtcbiAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgZmllbGQ6ICdjYXRlZ29yeScsXG4gICAgICAgIG1lc3NhZ2U6IGBJbnZhbGlkIGNhdGVnb3J5LiBNdXN0IGJlIG9uZSBvZjogJHt2YWxpZENhdGVnb3JpZXMuam9pbignLCAnKX1gLFxuICAgICAgICBjb2RlOiAnSU5WQUxJRF9DQVRFR09SWScsXG4gICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoJ3Jpc2tMZXZlbCcgaW4gcmVxdWVzdCAmJiByZXF1ZXN0LnJpc2tMZXZlbCAmJiAhdmFsaWRSaXNrTGV2ZWxzLmluY2x1ZGVzKHJlcXVlc3Qucmlza0xldmVsKSkge1xuICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICBmaWVsZDogJ3Jpc2tMZXZlbCcsXG4gICAgICAgIG1lc3NhZ2U6IGBJbnZhbGlkIHJpc2sgbGV2ZWwuIE11c3QgYmUgb25lIG9mOiAke3ZhbGlkUmlza0xldmVscy5qb2luKCcsICcpfWAsXG4gICAgICAgIGNvZGU6ICdJTlZBTElEX1JJU0tfTEVWRUwnLFxuICAgICAgICBzZXZlcml0eTogJ2Vycm9yJ1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKCd0YXJnZXRBdWRpZW5jZScgaW4gcmVxdWVzdCAmJiByZXF1ZXN0LnRhcmdldEF1ZGllbmNlKSB7XG4gICAgICBjb25zdCBpbnZhbGlkQXVkaWVuY2VzID0gcmVxdWVzdC50YXJnZXRBdWRpZW5jZS5maWx0ZXIoXG4gICAgICAgIGF1ZGllbmNlID0+ICF2YWxpZEF1ZGllbmNlcy5pbmNsdWRlcyhhdWRpZW5jZSlcbiAgICAgICk7XG4gICAgICBcbiAgICAgIGlmIChpbnZhbGlkQXVkaWVuY2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICAgIGZpZWxkOiAndGFyZ2V0QXVkaWVuY2UnLFxuICAgICAgICAgIG1lc3NhZ2U6IGBJbnZhbGlkIHRhcmdldCBhdWRpZW5jZXM6ICR7aW52YWxpZEF1ZGllbmNlcy5qb2luKCcsICcpfS4gTXVzdCBiZSBvbmUgb2Y6ICR7dmFsaWRBdWRpZW5jZXMuam9pbignLCAnKX1gLFxuICAgICAgICAgIGNvZGU6ICdJTlZBTElEX1RBUkdFVF9BVURJRU5DRScsXG4gICAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgdmFsaWRhdGVOdW1lcmljUmFuZ2VzKFxuICAgIHJlcXVlc3Q6IENyZWF0ZUludmVzdG1lbnRJZGVhUmVxdWVzdCB8IFVwZGF0ZUludmVzdG1lbnRJZGVhUmVxdWVzdCwgXG4gICAgZXJyb3JzOiBWYWxpZGF0aW9uRXJyb3JbXSwgXG4gICAgd2FybmluZ3M6IFZhbGlkYXRpb25XYXJuaW5nW11cbiAgKTogdm9pZCB7XG4gICAgaWYgKCdjb25maWRlbmNlU2NvcmUnIGluIHJlcXVlc3QgJiYgcmVxdWVzdC5jb25maWRlbmNlU2NvcmUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy52YWxpZGF0ZUNvbmZpZGVuY2VTY29yZShyZXF1ZXN0LmNvbmZpZGVuY2VTY29yZSwgZXJyb3JzLCB3YXJuaW5ncyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgdmFsaWRhdGVDb25maWRlbmNlU2NvcmUoXG4gICAgY29uZmlkZW5jZVNjb3JlOiBudW1iZXIsIFxuICAgIGVycm9yczogVmFsaWRhdGlvbkVycm9yW10sIFxuICAgIHdhcm5pbmdzOiBWYWxpZGF0aW9uV2FybmluZ1tdXG4gICk6IHZvaWQge1xuICAgIGlmIChjb25maWRlbmNlU2NvcmUgPCAwIHx8IGNvbmZpZGVuY2VTY29yZSA+IDEpIHtcbiAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgZmllbGQ6ICdjb25maWRlbmNlU2NvcmUnLFxuICAgICAgICBtZXNzYWdlOiAnQ29uZmlkZW5jZSBzY29yZSBtdXN0IGJlIGJldHdlZW4gMCBhbmQgMScsXG4gICAgICAgIGNvZGU6ICdJTlZBTElEX0NPTkZJREVOQ0VfU0NPUkUnLFxuICAgICAgICBzZXZlcml0eTogJ2Vycm9yJ1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChjb25maWRlbmNlU2NvcmUgPCAwLjMpIHtcbiAgICAgIHdhcm5pbmdzLnB1c2goe1xuICAgICAgICBmaWVsZDogJ2NvbmZpZGVuY2VTY29yZScsXG4gICAgICAgIG1lc3NhZ2U6ICdMb3cgY29uZmlkZW5jZSBzY29yZSBtYXkgaW5kaWNhdGUgaW5zdWZmaWNpZW50IGFuYWx5c2lzJyxcbiAgICAgICAgY29kZTogJ0xPV19DT05GSURFTkNFX1dBUk5JTkcnLFxuICAgICAgICByZWNvbW1lbmRhdGlvbjogJ0NvbnNpZGVyIGFkZGl0aW9uYWwgcmVzZWFyY2ggb3IgYW5hbHlzaXMnXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyB2YWxpZGF0ZUFycmF5RmllbGRzKFxuICAgIHJlcXVlc3Q6IENyZWF0ZUludmVzdG1lbnRJZGVhUmVxdWVzdCB8IFVwZGF0ZUludmVzdG1lbnRJZGVhUmVxdWVzdCwgXG4gICAgZXJyb3JzOiBWYWxpZGF0aW9uRXJyb3JbXSwgXG4gICAgd2FybmluZ3M6IFZhbGlkYXRpb25XYXJuaW5nW11cbiAgKTogdm9pZCB7XG4gICAgLy8gVmFsaWRhdGUgcG90ZW50aWFsIG91dGNvbWVzXG4gICAgaWYgKCdwb3RlbnRpYWxPdXRjb21lcycgaW4gcmVxdWVzdCAmJiByZXF1ZXN0LnBvdGVudGlhbE91dGNvbWVzKSB7XG4gICAgICB0aGlzLnZhbGlkYXRlT3V0Y29tZXMocmVxdWVzdC5wb3RlbnRpYWxPdXRjb21lcywgZXJyb3JzLCB3YXJuaW5ncyk7XG4gICAgfVxuXG4gICAgLy8gVmFsaWRhdGUgY291bnRlciBhcmd1bWVudHNcbiAgICBpZiAoJ2NvdW50ZXJBcmd1bWVudHMnIGluIHJlcXVlc3QgJiYgcmVxdWVzdC5jb3VudGVyQXJndW1lbnRzKSB7XG4gICAgICB0aGlzLnZhbGlkYXRlQ291bnRlckFyZ3VtZW50cyhyZXF1ZXN0LmNvdW50ZXJBcmd1bWVudHMsIGVycm9ycywgd2FybmluZ3MpO1xuICAgIH1cblxuICAgIC8vIFZhbGlkYXRlIHRhcmdldCBhdWRpZW5jZVxuICAgIGlmICgndGFyZ2V0QXVkaWVuY2UnIGluIHJlcXVlc3QgJiYgcmVxdWVzdC50YXJnZXRBdWRpZW5jZSkge1xuICAgICAgaWYgKHJlcXVlc3QudGFyZ2V0QXVkaWVuY2UubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHdhcm5pbmdzLnB1c2goe1xuICAgICAgICAgIGZpZWxkOiAndGFyZ2V0QXVkaWVuY2UnLFxuICAgICAgICAgIG1lc3NhZ2U6ICdObyB0YXJnZXQgYXVkaWVuY2Ugc3BlY2lmaWVkJyxcbiAgICAgICAgICBjb2RlOiAnTk9fVEFSR0VUX0FVRElFTkNFJyxcbiAgICAgICAgICByZWNvbW1lbmRhdGlvbjogJ0NvbnNpZGVyIHNwZWNpZnlpbmcgdGFyZ2V0IGF1ZGllbmNlIGZvciBiZXR0ZXIgcmVsZXZhbmNlJ1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyB2YWxpZGF0ZU91dGNvbWVzKFxuICAgIG91dGNvbWVzOiBPdXRjb21lW10sIFxuICAgIGVycm9yczogVmFsaWRhdGlvbkVycm9yW10sIFxuICAgIHdhcm5pbmdzOiBWYWxpZGF0aW9uV2FybmluZ1tdXG4gICk6IHZvaWQge1xuICAgIGlmIChvdXRjb21lcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHdhcm5pbmdzLnB1c2goe1xuICAgICAgICBmaWVsZDogJ3BvdGVudGlhbE91dGNvbWVzJyxcbiAgICAgICAgbWVzc2FnZTogJ05vIHBvdGVudGlhbCBvdXRjb21lcyBzcGVjaWZpZWQnLFxuICAgICAgICBjb2RlOiAnTk9fT1VUQ09NRVMnLFxuICAgICAgICByZWNvbW1lbmRhdGlvbjogJ0NvbnNpZGVyIGFkZGluZyBwb3RlbnRpYWwgb3V0Y29tZXMgZm9yIGJldHRlciBhbmFseXNpcydcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG91dGNvbWVzLmZvckVhY2goKG91dGNvbWUsIGluZGV4KSA9PiB7XG4gICAgICBpZiAob3V0Y29tZS5wcm9iYWJpbGl0eSA8IDAgfHwgb3V0Y29tZS5wcm9iYWJpbGl0eSA+IDEpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICAgIGZpZWxkOiBgcG90ZW50aWFsT3V0Y29tZXNbJHtpbmRleH1dLnByb2JhYmlsaXR5YCxcbiAgICAgICAgICBtZXNzYWdlOiAnT3V0Y29tZSBwcm9iYWJpbGl0eSBtdXN0IGJlIGJldHdlZW4gMCBhbmQgMScsXG4gICAgICAgICAgY29kZTogJ0lOVkFMSURfT1VUQ09NRV9QUk9CQUJJTElUWScsXG4gICAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChvdXRjb21lLnRpbWVUb1JlYWxpemF0aW9uIDwgMCkge1xuICAgICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgICAgZmllbGQ6IGBwb3RlbnRpYWxPdXRjb21lc1ske2luZGV4fV0udGltZVRvUmVhbGl6YXRpb25gLFxuICAgICAgICAgIG1lc3NhZ2U6ICdUaW1lIHRvIHJlYWxpemF0aW9uIGNhbm5vdCBiZSBuZWdhdGl2ZScsXG4gICAgICAgICAgY29kZTogJ0lOVkFMSURfVElNRV9UT19SRUFMSVpBVElPTicsXG4gICAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBDaGVjayBmb3IgcmVxdWlyZWQgc2NlbmFyaW8gdHlwZXNcbiAgICBjb25zdCBzY2VuYXJpb3MgPSBvdXRjb21lcy5tYXAobyA9PiBvLnNjZW5hcmlvKTtcbiAgICBpZiAoIXNjZW5hcmlvcy5pbmNsdWRlcygnZXhwZWN0ZWQnKSkge1xuICAgICAgd2FybmluZ3MucHVzaCh7XG4gICAgICAgIGZpZWxkOiAncG90ZW50aWFsT3V0Y29tZXMnLFxuICAgICAgICBtZXNzYWdlOiAnTm8gZXhwZWN0ZWQgc2NlbmFyaW8gcHJvdmlkZWQnLFxuICAgICAgICBjb2RlOiAnTk9fRVhQRUNURURfU0NFTkFSSU8nLFxuICAgICAgICByZWNvbW1lbmRhdGlvbjogJ0NvbnNpZGVyIGFkZGluZyBhbiBleHBlY3RlZCBvdXRjb21lIHNjZW5hcmlvJ1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgdmFsaWRhdGVDb3VudGVyQXJndW1lbnRzKFxuICAgIGNvdW50ZXJBcmd1bWVudHM6IENvdW50ZXJBcmd1bWVudFtdLCBcbiAgICBlcnJvcnM6IFZhbGlkYXRpb25FcnJvcltdLCBcbiAgICB3YXJuaW5nczogVmFsaWRhdGlvbldhcm5pbmdbXVxuICApOiB2b2lkIHtcbiAgICBjb3VudGVyQXJndW1lbnRzLmZvckVhY2goKGFyZywgaW5kZXgpID0+IHtcbiAgICAgIGlmIChhcmcucHJvYmFiaWxpdHkgPCAwIHx8IGFyZy5wcm9iYWJpbGl0eSA+IDEpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICAgIGZpZWxkOiBgY291bnRlckFyZ3VtZW50c1ske2luZGV4fV0ucHJvYmFiaWxpdHlgLFxuICAgICAgICAgIG1lc3NhZ2U6ICdDb3VudGVyIGFyZ3VtZW50IHByb2JhYmlsaXR5IG11c3QgYmUgYmV0d2VlbiAwIGFuZCAxJyxcbiAgICAgICAgICBjb2RlOiAnSU5WQUxJRF9DT1VOVEVSX0FSR1VNRU5UX1BST0JBQklMSVRZJyxcbiAgICAgICAgICBzZXZlcml0eTogJ2Vycm9yJ1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFhcmcuZGVzY3JpcHRpb24/LnRyaW0oKSkge1xuICAgICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgICAgZmllbGQ6IGBjb3VudGVyQXJndW1lbnRzWyR7aW5kZXh9XS5kZXNjcmlwdGlvbmAsXG4gICAgICAgICAgbWVzc2FnZTogJ0NvdW50ZXIgYXJndW1lbnQgZGVzY3JpcHRpb24gaXMgcmVxdWlyZWQnLFxuICAgICAgICAgIGNvZGU6ICdDT1VOVEVSX0FSR1VNRU5UX0RFU0NSSVBUSU9OX1JFUVVJUkVEJyxcbiAgICAgICAgICBzZXZlcml0eTogJ2Vycm9yJ1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChjb3VudGVyQXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgd2FybmluZ3MucHVzaCh7XG4gICAgICAgIGZpZWxkOiAnY291bnRlckFyZ3VtZW50cycsXG4gICAgICAgIG1lc3NhZ2U6ICdObyBjb3VudGVyIGFyZ3VtZW50cyBwcm92aWRlZCcsXG4gICAgICAgIGNvZGU6ICdOT19DT1VOVEVSX0FSR1VNRU5UUycsXG4gICAgICAgIHJlY29tbWVuZGF0aW9uOiAnQ29uc2lkZXIgYWRkaW5nIGNvdW50ZXIgYXJndW1lbnRzIGZvciBiYWxhbmNlZCBhbmFseXNpcydcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIHZhbGlkYXRlU3RyYXRlZ3lUaW1lSG9yaXpvbkFsaWdubWVudChcbiAgICBzdHJhdGVneTogSW52ZXN0bWVudFN0cmF0ZWd5LCBcbiAgICB0aW1lSG9yaXpvbjogVGltZUhvcml6b24sIFxuICAgIHdhcm5pbmdzOiBWYWxpZGF0aW9uV2FybmluZ1tdXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IHNob3J0VGVybVN0cmF0ZWdpZXM6IEludmVzdG1lbnRTdHJhdGVneVtdID0gWydtb21lbnR1bScsICdhcmJpdHJhZ2UnLCAncGFpcnMtdHJhZGUnXTtcbiAgICBjb25zdCBsb25nVGVybVN0cmF0ZWdpZXM6IEludmVzdG1lbnRTdHJhdGVneVtdID0gWyd2YWx1ZScsICdncm93dGgnLCAnaW5jb21lJ107XG5cbiAgICBpZiAoc2hvcnRUZXJtU3RyYXRlZ2llcy5pbmNsdWRlcyhzdHJhdGVneSkgJiYgWydsb25nJywgJ3ZlcnktbG9uZyddLmluY2x1ZGVzKHRpbWVIb3Jpem9uKSkge1xuICAgICAgd2FybmluZ3MucHVzaCh7XG4gICAgICAgIGZpZWxkOiAnc3RyYXRlZ3knLFxuICAgICAgICBtZXNzYWdlOiBgU3RyYXRlZ3kgJyR7c3RyYXRlZ3l9JyBtYXkgbm90IGFsaWduIHdlbGwgd2l0aCAnJHt0aW1lSG9yaXpvbn0nIHRpbWUgaG9yaXpvbmAsXG4gICAgICAgIGNvZGU6ICdTVFJBVEVHWV9USU1FX0hPUklaT05fTUlTTUFUQ0gnLFxuICAgICAgICByZWNvbW1lbmRhdGlvbjogJ0NvbnNpZGVyIGFkanVzdGluZyBzdHJhdGVneSBvciB0aW1lIGhvcml6b24gZm9yIGJldHRlciBhbGlnbm1lbnQnXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAobG9uZ1Rlcm1TdHJhdGVnaWVzLmluY2x1ZGVzKHN0cmF0ZWd5KSAmJiBbJ2ludHJhZGF5JywgJ3Nob3J0J10uaW5jbHVkZXModGltZUhvcml6b24pKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKHtcbiAgICAgICAgZmllbGQ6ICdzdHJhdGVneScsXG4gICAgICAgIG1lc3NhZ2U6IGBTdHJhdGVneSAnJHtzdHJhdGVneX0nIG1heSBub3QgYWxpZ24gd2VsbCB3aXRoICcke3RpbWVIb3Jpem9ufScgdGltZSBob3Jpem9uYCxcbiAgICAgICAgY29kZTogJ1NUUkFURUdZX1RJTUVfSE9SSVpPTl9NSVNNQVRDSCcsXG4gICAgICAgIHJlY29tbWVuZGF0aW9uOiAnQ29uc2lkZXIgYWRqdXN0aW5nIHN0cmF0ZWd5IG9yIHRpbWUgaG9yaXpvbiBmb3IgYmV0dGVyIGFsaWdubWVudCdcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufSJdfQ==