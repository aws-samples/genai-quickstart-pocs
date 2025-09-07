"use strict";
/**
 * Tests for Investment Idea Validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
const investment_idea_validation_1 = require("../../utils/investment-idea-validation");
describe('InvestmentIdeaValidator', () => {
    const mockInvestment = {
        id: 'inv_1',
        type: 'stock',
        name: 'Apple Inc.',
        ticker: 'AAPL',
        description: 'Technology company',
        historicalPerformance: [],
        riskMetrics: {
            volatility: 0.25,
            beta: 1.2,
            sharpeRatio: 1.5,
            drawdown: 0.15,
            var: 0.05,
            correlations: {}
        },
        relatedInvestments: []
    };
    const mockOutcome = {
        scenario: 'expected',
        probability: 0.6,
        returnEstimate: 0.15,
        timeToRealization: 365,
        description: 'Expected scenario',
        conditions: ['Market stability'],
        keyRisks: ['Market volatility'],
        catalysts: ['Product launch']
    };
    const mockCounterArgument = {
        description: 'Market volatility risk',
        strength: 'moderate',
        impact: 'medium',
        probability: 0.3
    };
    describe('validateCreateRequest', () => {
        const validCreateRequest = {
            title: 'Apple Growth Strategy',
            description: 'Long-term growth investment in Apple Inc.',
            investments: [mockInvestment],
            rationale: 'Strong fundamentals and growth prospects',
            strategy: 'buy',
            timeHorizon: 'long',
            confidenceScore: 0.8,
            potentialOutcomes: [mockOutcome],
            supportingData: [],
            counterArguments: [mockCounterArgument],
            tags: ['technology', 'growth'],
            category: 'equity',
            riskLevel: 'moderate',
            targetAudience: ['retail', 'institutional'],
            createdBy: 'claude-sonnet-3.7'
        };
        it('should validate a valid create request', () => {
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateCreateRequest(validCreateRequest);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        it('should require title', () => {
            const request = { ...validCreateRequest, title: '' };
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateCreateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'title',
                code: 'TITLE_REQUIRED'
            }));
        });
        it('should require description', () => {
            const request = { ...validCreateRequest, description: '' };
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateCreateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'description',
                code: 'DESCRIPTION_REQUIRED'
            }));
        });
        it('should require rationale', () => {
            const request = { ...validCreateRequest, rationale: '' };
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateCreateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'rationale',
                code: 'RATIONALE_REQUIRED'
            }));
        });
        it('should require createdBy', () => {
            const request = { ...validCreateRequest, createdBy: '' };
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateCreateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'createdBy',
                code: 'CREATED_BY_REQUIRED'
            }));
        });
        it('should require at least one investment', () => {
            const request = { ...validCreateRequest, investments: [] };
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateCreateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'investments',
                code: 'INVESTMENTS_REQUIRED'
            }));
        });
        it('should validate confidence score range', () => {
            const request = { ...validCreateRequest, confidenceScore: 1.5 };
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateCreateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'confidenceScore',
                code: 'INVALID_CONFIDENCE_SCORE'
            }));
        });
        it('should warn about low confidence score', () => {
            const request = { ...validCreateRequest, confidenceScore: 0.2 };
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateCreateRequest(request);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContainEqual(expect.objectContaining({
                field: 'confidenceScore',
                code: 'LOW_CONFIDENCE_WARNING'
            }));
        });
        it('should validate investment strategy enum', () => {
            const request = { ...validCreateRequest, strategy: 'invalid' };
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateCreateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'strategy',
                code: 'INVALID_STRATEGY'
            }));
        });
        it('should validate time horizon enum', () => {
            const request = { ...validCreateRequest, timeHorizon: 'invalid' };
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateCreateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'timeHorizon',
                code: 'INVALID_TIME_HORIZON'
            }));
        });
        it('should validate category enum', () => {
            const request = { ...validCreateRequest, category: 'invalid' };
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateCreateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'category',
                code: 'INVALID_CATEGORY'
            }));
        });
        it('should validate risk level enum', () => {
            const request = { ...validCreateRequest, riskLevel: 'invalid' };
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateCreateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'riskLevel',
                code: 'INVALID_RISK_LEVEL'
            }));
        });
        it('should validate target audience enum', () => {
            const request = { ...validCreateRequest, targetAudience: ['invalid'] };
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateCreateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'targetAudience',
                code: 'INVALID_TARGET_AUDIENCE'
            }));
        });
        it('should validate outcome probabilities', () => {
            const invalidOutcome = { ...mockOutcome, probability: 1.5 };
            const request = { ...validCreateRequest, potentialOutcomes: [invalidOutcome] };
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateCreateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'potentialOutcomes[0].probability',
                code: 'INVALID_OUTCOME_PROBABILITY'
            }));
        });
        it('should validate counter argument probabilities', () => {
            const invalidCounterArg = { ...mockCounterArgument, probability: -0.1 };
            const request = { ...validCreateRequest, counterArguments: [invalidCounterArg] };
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateCreateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'counterArguments[0].probability',
                code: 'INVALID_COUNTER_ARGUMENT_PROBABILITY'
            }));
        });
        it('should warn about strategy-time horizon mismatch', () => {
            const request = { ...validCreateRequest, strategy: 'value', timeHorizon: 'short' };
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateCreateRequest(request);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContainEqual(expect.objectContaining({
                field: 'strategy',
                code: 'STRATEGY_TIME_HORIZON_MISMATCH'
            }));
        });
    });
    describe('validateUpdateRequest', () => {
        const validUpdateRequest = {
            id: 'idea_123',
            title: 'Updated Apple Strategy',
            confidenceScore: 0.9,
            updatedBy: 'claude-sonnet-3.7'
        };
        it('should validate a valid update request', () => {
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateUpdateRequest(validUpdateRequest);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        it('should require id', () => {
            const request = { ...validUpdateRequest, id: '' };
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateUpdateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'id',
                code: 'ID_REQUIRED'
            }));
        });
        it('should require updatedBy', () => {
            const request = { ...validUpdateRequest, updatedBy: '' };
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateUpdateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'updatedBy',
                code: 'UPDATED_BY_REQUIRED'
            }));
        });
        it('should not allow empty title if provided', () => {
            const request = { ...validUpdateRequest, title: '' };
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateUpdateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'title',
                code: 'TITLE_EMPTY'
            }));
        });
        it('should validate confidence score if provided', () => {
            const request = { ...validUpdateRequest, confidenceScore: 2.0 };
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateUpdateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'confidenceScore',
                code: 'INVALID_CONFIDENCE_SCORE'
            }));
        });
    });
    describe('validateInvestmentIdea', () => {
        const validIdea = {
            id: 'idea_123',
            version: 1,
            title: 'Apple Growth Strategy',
            description: 'Long-term growth investment in Apple Inc.',
            investments: [mockInvestment],
            rationale: 'Strong fundamentals and growth prospects',
            strategy: 'buy',
            timeHorizon: 'long',
            confidenceScore: 0.8,
            generatedAt: new Date('2024-01-01'),
            lastUpdatedAt: new Date('2024-01-01'),
            potentialOutcomes: [
                { ...mockOutcome, scenario: 'best', probability: 0.2 },
                { ...mockOutcome, scenario: 'expected', probability: 0.6 },
                { ...mockOutcome, scenario: 'worst', probability: 0.2 }
            ],
            supportingData: [],
            counterArguments: [mockCounterArgument],
            complianceStatus: {
                compliant: true,
                issues: [],
                regulationsChecked: ['SEC'],
                timestamp: new Date()
            },
            createdBy: 'claude-sonnet-3.7',
            tags: ['technology', 'growth'],
            category: 'equity',
            riskLevel: 'moderate',
            targetAudience: ['retail'],
            metadata: {
                sourceModels: ['claude-sonnet-3.7'],
                processingTime: 1000,
                dataSourcesUsed: ['market-data'],
                researchDepth: 'standard',
                qualityScore: 85,
                noveltyScore: 70,
                marketConditionsAtGeneration: {
                    volatilityIndex: 20,
                    marketTrend: 'bull',
                    economicIndicators: {},
                    geopoliticalRisk: 'low'
                }
            },
            trackingInfo: {
                views: 0,
                implementations: 0,
                feedback: [],
                performance: [],
                status: 'active',
                statusHistory: []
            }
        };
        it('should validate a valid investment idea', () => {
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateInvestmentIdea(validIdea);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        it('should validate expiration date is after generation date', () => {
            const idea = {
                ...validIdea,
                expiresAt: new Date('2023-12-31') // Before generation date
            };
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateInvestmentIdea(idea);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'expiresAt',
                code: 'INVALID_EXPIRATION_DATE'
            }));
        });
        it('should warn about outcome probabilities not summing to 1', () => {
            const idea = {
                ...validIdea,
                potentialOutcomes: [
                    { ...mockOutcome, scenario: 'best', probability: 0.3 },
                    { ...mockOutcome, scenario: 'expected', probability: 0.3 },
                    { ...mockOutcome, scenario: 'worst', probability: 0.3 }
                ]
            };
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateInvestmentIdea(idea);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContainEqual(expect.objectContaining({
                field: 'potentialOutcomes',
                code: 'PROBABILITY_SUM_WARNING'
            }));
        });
        it('should validate version is at least 1', () => {
            const idea = { ...validIdea, version: 0 };
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateInvestmentIdea(idea);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'version',
                code: 'INVALID_VERSION'
            }));
        });
        it('should validate compliance status contradiction', () => {
            const idea = {
                ...validIdea,
                complianceStatus: {
                    compliant: true,
                    issues: [{
                            severity: 'critical',
                            regulation: 'SEC Rule 1',
                            description: 'Critical issue',
                            estimatedImpact: 'high'
                        }],
                    regulationsChecked: ['SEC'],
                    timestamp: new Date()
                }
            };
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateInvestmentIdea(idea);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'complianceStatus',
                code: 'COMPLIANCE_CONTRADICTION'
            }));
        });
        it('should warn about future data points', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            const idea = {
                ...validIdea,
                supportingData: [{
                        source: 'test',
                        type: 'fundamental',
                        value: 100,
                        timestamp: futureDate,
                        reliability: 0.9
                    }]
            };
            const result = investment_idea_validation_1.InvestmentIdeaValidator.validateInvestmentIdea(idea);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContainEqual(expect.objectContaining({
                field: 'supportingData',
                code: 'FUTURE_DATA_POINTS'
            }));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52ZXN0bWVudC1pZGVhLXZhbGlkYXRpb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9fX3Rlc3RzX18vaW52ZXN0bWVudC1pZGVhLXZhbGlkYXRpb24udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsdUZBQWlGO0FBVWpGLFFBQVEsQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLEVBQUU7SUFDdkMsTUFBTSxjQUFjLEdBQWU7UUFDakMsRUFBRSxFQUFFLE9BQU87UUFDWCxJQUFJLEVBQUUsT0FBTztRQUNiLElBQUksRUFBRSxZQUFZO1FBQ2xCLE1BQU0sRUFBRSxNQUFNO1FBQ2QsV0FBVyxFQUFFLG9CQUFvQjtRQUNqQyxxQkFBcUIsRUFBRSxFQUFFO1FBQ3pCLFdBQVcsRUFBRTtZQUNYLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLElBQUksRUFBRSxHQUFHO1lBQ1QsV0FBVyxFQUFFLEdBQUc7WUFDaEIsUUFBUSxFQUFFLElBQUk7WUFDZCxHQUFHLEVBQUUsSUFBSTtZQUNULFlBQVksRUFBRSxFQUFFO1NBQ2pCO1FBQ0Qsa0JBQWtCLEVBQUUsRUFBRTtLQUN2QixDQUFDO0lBRUYsTUFBTSxXQUFXLEdBQVk7UUFDM0IsUUFBUSxFQUFFLFVBQVU7UUFDcEIsV0FBVyxFQUFFLEdBQUc7UUFDaEIsY0FBYyxFQUFFLElBQUk7UUFDcEIsaUJBQWlCLEVBQUUsR0FBRztRQUN0QixXQUFXLEVBQUUsbUJBQW1CO1FBQ2hDLFVBQVUsRUFBRSxDQUFDLGtCQUFrQixDQUFDO1FBQ2hDLFFBQVEsRUFBRSxDQUFDLG1CQUFtQixDQUFDO1FBQy9CLFNBQVMsRUFBRSxDQUFDLGdCQUFnQixDQUFDO0tBQzlCLENBQUM7SUFFRixNQUFNLG1CQUFtQixHQUFvQjtRQUMzQyxXQUFXLEVBQUUsd0JBQXdCO1FBQ3JDLFFBQVEsRUFBRSxVQUFVO1FBQ3BCLE1BQU0sRUFBRSxRQUFRO1FBQ2hCLFdB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Q0FBQyxDQUFDO1lBRTdDLE1BQU0sSUFBSSxHQUFHO2dCQUNYLEdBQUcsU0FBUztnQkFDWixjQUFjLEVBQUUsQ0FBQzt3QkFDZixNQUFNLEVBQUUsTUFBTTt3QkFDZCxJQUFJLEVBQUUsYUFBc0I7d0JBQzVCLEtBQUssRUFBRSxHQUFHO3dCQUNWLFNBQVMsRUFBRSxVQUFVO3dCQUNyQixXQUFXLEVBQUUsR0FBRztxQkFDakIsQ0FBQzthQUNILENBQUM7WUFDRixNQUFNLE1BQU0sR0FBRyxvREFBdUIsQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVwRSxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLGNBQWMsQ0FDcEMsTUFBTSxDQUFDLGdCQUFnQixDQUFDO2dCQUN0QixLQUFLLEVBQUUsZ0JBQWdCO2dCQUN2QixJQUFJLEVBQUUsb0JBQW9CO2FBQzNCLENBQUMsQ0FDSCxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBUZXN0cyBmb3IgSW52ZXN0bWVudCBJZGVhIFZhbGlkYXRpb25cbiAqL1xuXG5pbXBvcnQgeyBJbnZlc3RtZW50SWRlYVZhbGlkYXRvciB9IGZyb20gJy4uLy4uL3V0aWxzL2ludmVzdG1lbnQtaWRlYS12YWxpZGF0aW9uJztcbmltcG9ydCB7XG4gIEludmVzdG1lbnRJZGVhLFxuICBDcmVhdGVJbnZlc3RtZW50SWRlYVJlcXVlc3QsXG4gIFVwZGF0ZUludmVzdG1lbnRJZGVhUmVxdWVzdCxcbiAgT3V0Y29tZSxcbiAgQ291bnRlckFyZ3VtZW50XG59IGZyb20gJy4uLy4uL21vZGVscy9pbnZlc3RtZW50LWlkZWEnO1xuaW1wb3J0IHsgSW52ZXN0bWVudCB9IGZyb20gJy4uLy4uL21vZGVscy9pbnZlc3RtZW50JztcblxuZGVzY3JpYmUoJ0ludmVzdG1lbnRJZGVhVmFsaWRhdG9yJywgKCkgPT4ge1xuICBjb25zdCBtb2NrSW52ZXN0bWVudDogSW52ZXN0bWVudCA9IHtcbiAgICBpZDogJ2ludl8xJyxcbiAgICB0eXBlOiAnc3RvY2snLFxuICAgIG5hbWU6ICdBcHBsZSBJbmMuJyxcbiAgICB0aWNrZXI6ICdBQVBMJyxcbiAgICBkZXNjcmlwdGlvbjogJ1RlY2hub2xvZ3kgY29tcGFueScsXG4gICAgaGlzdG9yaWNhbFBlcmZvcm1hbmNlOiBbXSxcbiAgICByaXNrTWV0cmljczoge1xuICAgICAgdm9sYXRpbGl0eTogMC4yNSxcbiAgICAgIGJldGE6IDEuMixcbiAgICAgIHNoYXJwZVJhdGlvOiAxLjUsXG4gICAgICBkcmF3ZG93bjogMC4xNSxcbiAgICAgIHZhcjogMC4wNSxcbiAgICAgIGNvcnJlbGF0aW9uczoge31cbiAgICB9LFxuICAgIHJlbGF0ZWRJbnZlc3RtZW50czogW11cbiAgfTtcblxuICBjb25zdCBtb2NrT3V0Y29tZTogT3V0Y29tZSA9IHtcbiAgICBzY2VuYXJpbzogJ2V4cGVjdGVkJyxcbiAgICBwcm9iYWJpbGl0eTogMC42LFxuICAgIHJldHVybkVzdGltYXRlOiAwLjE1LFxuICAgIHRpbWVUb1JlYWxpemF0aW9uOiAzNjUsXG4gICAgZGVzY3JpcHRpb246ICdFeHBlY3RlZCBzY2VuYXJpbycsXG4gICAgY29uZGl0aW9uczogWydNYXJrZXQgc3RhYmlsaXR5J10sXG4gICAga2V5Umlza3M6IFsnTWFya2V0IHZvbGF0aWxpdHknXSxcbiAgICBjYXRhbHlzdHM6IFsnUHJvZHVjdCBsYXVuY2gnXVxuICB9O1xuXG4gIGNvbnN0IG1vY2tDb3VudGVyQXJndW1lbnQ6IENvdW50ZXJBcmd1bWVudCA9IHtcbiAgICBkZXNjcmlwdGlvbjogJ01hcmtldCB2b2xhdGlsaXR5IHJpc2snLFxuICAgIHN0cmVuZ3RoOiAnbW9kZXJhdGUnLFxuICAgIGltcGFjdDogJ21lZGl1bScsXG4gICAgcHJvYmFiaWxpdHk6IDAuM1xuICB9O1xuXG4gIGRlc2NyaWJlKCd2YWxpZGF0ZUNyZWF0ZVJlcXVlc3QnLCAoKSA9PiB7XG4gICAgY29uc3QgdmFsaWRDcmVhdGVSZXF1ZXN0OiBDcmVhdGVJbnZlc3RtZW50SWRlYVJlcXVlc3QgPSB7XG4gICAgICB0aXRsZTogJ0FwcGxlIEdyb3d0aCBTdHJhdGVneScsXG4gICAgICBkZXNjcmlwdGlvbjogJ0xvbmctdGVybSBncm93dGggaW52ZXN0bWVudCBpbiBBcHBsZSBJbmMuJyxcbiAgICAgIGludmVzdG1lbnRzOiBbbW9ja0ludmVzdG1lbnRdLFxuICAgICAgcmF0aW9uYWxlOiAnU3Ryb25nIGZ1bmRhbWVudGFscyBhbmQgZ3Jvd3RoIHByb3NwZWN0cycsXG4gICAgICBzdHJhdGVneTogJ2J1eScsXG4gICAgICB0aW1lSG9yaXpvbjogJ2xvbmcnLFxuICAgICAgY29uZmlkZW5jZVNjb3JlOiAwLjgsXG4gICAgICBwb3RlbnRpYWxPdXRjb21lczogW21vY2tPdXRjb21lXSxcbiAgICAgIHN1cHBvcnRpbmdEYXRhOiBbXSxcbiAgICAgIGNvdW50ZXJBcmd1bWVudHM6IFttb2NrQ291bnRlckFyZ3VtZW50XSxcbiAgICAgIHRhZ3M6IFsndGVjaG5vbG9neScsICdncm93dGgnXSxcbiAgICAgIGNhdGVnb3J5OiAnZXF1aXR5JyxcbiAgICAgIHJpc2tMZXZlbDogJ21vZGVyYXRlJyxcbiAgICAgIHRhcmdldEF1ZGllbmNlOiBbJ3JldGFpbCcsICdpbnN0aXR1dGlvbmFsJ10sXG4gICAgICBjcmVhdGVkQnk6ICdjbGF1ZGUtc29ubmV0LTMuNydcbiAgICB9O1xuXG4gICAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSBhIHZhbGlkIGNyZWF0ZSByZXF1ZXN0JywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gSW52ZXN0bWVudElkZWFWYWxpZGF0b3IudmFsaWRhdGVDcmVhdGVSZXF1ZXN0KHZhbGlkQ3JlYXRlUmVxdWVzdCk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNWYWxpZCkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3JzKS50b0hhdmVMZW5ndGgoMCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJlcXVpcmUgdGl0bGUnLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0ID0geyAuLi52YWxpZENyZWF0ZVJlcXVlc3QsIHRpdGxlOiAnJyB9O1xuICAgICAgY29uc3QgcmVzdWx0ID0gSW52ZXN0bWVudElkZWFWYWxpZGF0b3IudmFsaWRhdGVDcmVhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZmllbGQ6ICd0aXRsZScsXG4gICAgICAgICAgY29kZTogJ1RJVExFX1JFUVVJUkVEJ1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmVxdWlyZSBkZXNjcmlwdGlvbicsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3QgPSB7IC4uLnZhbGlkQ3JlYXRlUmVxdWVzdCwgZGVzY3JpcHRpb246ICcnIH07XG4gICAgICBjb25zdCByZXN1bHQgPSBJbnZlc3RtZW50SWRlYVZhbGlkYXRvci52YWxpZGF0ZUNyZWF0ZVJlcXVlc3QocmVxdWVzdCk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNWYWxpZCkudG9CZShmYWxzZSk7XG4gICAgICBleHBlY3QocmVzdWx0LmVycm9ycykudG9Db250YWluRXF1YWwoXG4gICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICBmaWVsZDogJ2Rlc2NyaXB0aW9uJyxcbiAgICAgICAgICBjb2RlOiAnREVTQ1JJUFRJT05fUkVRVUlSRUQnXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZXF1aXJlIHJhdGlvbmFsZScsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3QgPSB7IC4uLnZhbGlkQ3JlYXRlUmVxdWVzdCwgcmF0aW9uYWxlOiAnJyB9O1xuICAgICAgY29uc3QgcmVzdWx0ID0gSW52ZXN0bWVudElkZWFWYWxpZGF0b3IudmFsaWRhdGVDcmVhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZmllbGQ6ICdyYXRpb25hbGUnLFxuICAgICAgICAgIGNvZGU6ICdSQVRJT05BTEVfUkVRVUlSRUQnXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZXF1aXJlIGNyZWF0ZWRCeScsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3QgPSB7IC4uLnZhbGlkQ3JlYXRlUmVxdWVzdCwgY3JlYXRlZEJ5OiAnJyB9O1xuICAgICAgY29uc3QgcmVzdWx0ID0gSW52ZXN0bWVudElkZWFWYWxpZGF0b3IudmFsaWRhdGVDcmVhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZmllbGQ6ICdjcmVhdGVkQnknLFxuICAgICAgICAgIGNvZGU6ICdDUkVBVEVEX0JZX1JFUVVJUkVEJ1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmVxdWlyZSBhdCBsZWFzdCBvbmUgaW52ZXN0bWVudCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3QgPSB7IC4uLnZhbGlkQ3JlYXRlUmVxdWVzdCwgaW52ZXN0bWVudHM6IFtdIH07XG4gICAgICBjb25zdCByZXN1bHQgPSBJbnZlc3RtZW50SWRlYVZhbGlkYXRvci52YWxpZGF0ZUNyZWF0ZVJlcXVlc3QocmVxdWVzdCk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNWYWxpZCkudG9CZShmYWxzZSk7XG4gICAgICBleHBlY3QocmVzdWx0LmVycm9ycykudG9Db250YWluRXF1YWwoXG4gICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICBmaWVsZDogJ2ludmVzdG1lbnRzJyxcbiAgICAgICAgICBjb2RlOiAnSU5WRVNUTUVOVFNfUkVRVUlSRUQnXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSBjb25maWRlbmNlIHNjb3JlIHJhbmdlJywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdCA9IHsgLi4udmFsaWRDcmVhdGVSZXF1ZXN0LCBjb25maWRlbmNlU2NvcmU6IDEuNSB9O1xuICAgICAgY29uc3QgcmVzdWx0ID0gSW52ZXN0bWVudElkZWFWYWxpZGF0b3IudmFsaWRhdGVDcmVhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZmllbGQ6ICdjb25maWRlbmNlU2NvcmUnLFxuICAgICAgICAgIGNvZGU6ICdJTlZBTElEX0NPTkZJREVOQ0VfU0NPUkUnXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB3YXJuIGFib3V0IGxvdyBjb25maWRlbmNlIHNjb3JlJywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdCA9IHsgLi4udmFsaWRDcmVhdGVSZXF1ZXN0LCBjb25maWRlbmNlU2NvcmU6IDAuMiB9O1xuICAgICAgY29uc3QgcmVzdWx0ID0gSW52ZXN0bWVudElkZWFWYWxpZGF0b3IudmFsaWRhdGVDcmVhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QocmVzdWx0Lndhcm5pbmdzKS50b0NvbnRhaW5FcXVhbChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIGZpZWxkOiAnY29uZmlkZW5jZVNjb3JlJyxcbiAgICAgICAgICBjb2RlOiAnTE9XX0NPTkZJREVOQ0VfV0FSTklORydcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHZhbGlkYXRlIGludmVzdG1lbnQgc3RyYXRlZ3kgZW51bScsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3QgPSB7IC4uLnZhbGlkQ3JlYXRlUmVxdWVzdCwgc3RyYXRlZ3k6ICdpbnZhbGlkJyBhcyBhbnkgfTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IEludmVzdG1lbnRJZGVhVmFsaWRhdG9yLnZhbGlkYXRlQ3JlYXRlUmVxdWVzdChyZXF1ZXN0KTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3VsdC5pc1ZhbGlkKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3JzKS50b0NvbnRhaW5FcXVhbChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIGZpZWxkOiAnc3RyYXRlZ3knLFxuICAgICAgICAgIGNvZGU6ICdJTlZBTElEX1NUUkFURUdZJ1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgdGltZSBob3Jpem9uIGVudW0nLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0ID0geyAuLi52YWxpZENyZWF0ZVJlcXVlc3QsIHRpbWVIb3Jpem9uOiAnaW52YWxpZCcgYXMgYW55IH07XG4gICAgICBjb25zdCByZXN1bHQgPSBJbnZlc3RtZW50SWRlYVZhbGlkYXRvci52YWxpZGF0ZUNyZWF0ZVJlcXVlc3QocmVxdWVzdCk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNWYWxpZCkudG9CZShmYWxzZSk7XG4gICAgICBleHBlY3QocmVzdWx0LmVycm9ycykudG9Db250YWluRXF1YWwoXG4gICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICBmaWVsZDogJ3RpbWVIb3Jpem9uJyxcbiAgICAgICAgICBjb2RlOiAnSU5WQUxJRF9USU1FX0hPUklaT04nXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSBjYXRlZ29yeSBlbnVtJywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdCA9IHsgLi4udmFsaWRDcmVhdGVSZXF1ZXN0LCBjYXRlZ29yeTogJ2ludmFsaWQnIGFzIGFueSB9O1xuICAgICAgY29uc3QgcmVzdWx0ID0gSW52ZXN0bWVudElkZWFWYWxpZGF0b3IudmFsaWRhdGVDcmVhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZmllbGQ6ICdjYXRlZ29yeScsXG4gICAgICAgICAgY29kZTogJ0lOVkFMSURfQ0FURUdPUlknXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSByaXNrIGxldmVsIGVudW0nLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0ID0geyAuLi52YWxpZENyZWF0ZVJlcXVlc3QsIHJpc2tMZXZlbDogJ2ludmFsaWQnIGFzIGFueSB9O1xuICAgICAgY29uc3QgcmVzdWx0ID0gSW52ZXN0bWVudElkZWFWYWxpZGF0b3IudmFsaWRhdGVDcmVhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZmllbGQ6ICdyaXNrTGV2ZWwnLFxuICAgICAgICAgIGNvZGU6ICdJTlZBTElEX1JJU0tfTEVWRUwnXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSB0YXJnZXQgYXVkaWVuY2UgZW51bScsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3QgPSB7IC4uLnZhbGlkQ3JlYXRlUmVxdWVzdCwgdGFyZ2V0QXVkaWVuY2U6IFsnaW52YWxpZCddIGFzIGFueSB9O1xuICAgICAgY29uc3QgcmVzdWx0ID0gSW52ZXN0bWVudElkZWFWYWxpZGF0b3IudmFsaWRhdGVDcmVhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZmllbGQ6ICd0YXJnZXRBdWRpZW5jZScsXG4gICAgICAgICAgY29kZTogJ0lOVkFMSURfVEFSR0VUX0FVRElFTkNFJ1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgb3V0Y29tZSBwcm9iYWJpbGl0aWVzJywgKCkgPT4ge1xuICAgICAgY29uc3QgaW52YWxpZE91dGNvbWUgPSB7IC4uLm1vY2tPdXRjb21lLCBwcm9iYWJpbGl0eTogMS41IH07XG4gICAgICBjb25zdCByZXF1ZXN0ID0geyAuLi52YWxpZENyZWF0ZVJlcXVlc3QsIHBvdGVudGlhbE91dGNvbWVzOiBbaW52YWxpZE91dGNvbWVdIH07XG4gICAgICBjb25zdCByZXN1bHQgPSBJbnZlc3RtZW50SWRlYVZhbGlkYXRvci52YWxpZGF0ZUNyZWF0ZVJlcXVlc3QocmVxdWVzdCk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNWYWxpZCkudG9CZShmYWxzZSk7XG4gICAgICBleHBlY3QocmVzdWx0LmVycm9ycykudG9Db250YWluRXF1YWwoXG4gICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICBmaWVsZDogJ3BvdGVudGlhbE91dGNvbWVzWzBdLnByb2JhYmlsaXR5JyxcbiAgICAgICAgICBjb2RlOiAnSU5WQUxJRF9PVVRDT01FX1BST0JBQklMSVRZJ1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgY291bnRlciBhcmd1bWVudCBwcm9iYWJpbGl0aWVzJywgKCkgPT4ge1xuICAgICAgY29uc3QgaW52YWxpZENvdW50ZXJBcmcgPSB7IC4uLm1vY2tDb3VudGVyQXJndW1lbnQsIHByb2JhYmlsaXR5OiAtMC4xIH07XG4gICAgICBjb25zdCByZXF1ZXN0ID0geyAuLi52YWxpZENyZWF0ZVJlcXVlc3QsIGNvdW50ZXJBcmd1bWVudHM6IFtpbnZhbGlkQ291bnRlckFyZ10gfTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IEludmVzdG1lbnRJZGVhVmFsaWRhdG9yLnZhbGlkYXRlQ3JlYXRlUmVxdWVzdChyZXF1ZXN0KTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3VsdC5pc1ZhbGlkKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3JzKS50b0NvbnRhaW5FcXVhbChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIGZpZWxkOiAnY291bnRlckFyZ3VtZW50c1swXS5wcm9iYWJpbGl0eScsXG4gICAgICAgICAgY29kZTogJ0lOVkFMSURfQ09VTlRFUl9BUkdVTUVOVF9QUk9CQUJJTElUWSdcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHdhcm4gYWJvdXQgc3RyYXRlZ3ktdGltZSBob3Jpem9uIG1pc21hdGNoJywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdCA9IHsgLi4udmFsaWRDcmVhdGVSZXF1ZXN0LCBzdHJhdGVneTogJ3ZhbHVlJyBhcyBjb25zdCwgdGltZUhvcml6b246ICdzaG9ydCcgYXMgY29uc3QgfTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IEludmVzdG1lbnRJZGVhVmFsaWRhdG9yLnZhbGlkYXRlQ3JlYXRlUmVxdWVzdChyZXF1ZXN0KTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3VsdC5pc1ZhbGlkKS50b0JlKHRydWUpO1xuICAgICAgZXhwZWN0KHJlc3VsdC53YXJuaW5ncykudG9Db250YWluRXF1YWwoXG4gICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICBmaWVsZDogJ3N0cmF0ZWd5JyxcbiAgICAgICAgICBjb2RlOiAnU1RSQVRFR1lfVElNRV9IT1JJWk9OX01JU01BVENIJ1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3ZhbGlkYXRlVXBkYXRlUmVxdWVzdCcsICgpID0+IHtcbiAgICBjb25zdCB2YWxpZFVwZGF0ZVJlcXVlc3Q6IFVwZGF0ZUludmVzdG1lbnRJZGVhUmVxdWVzdCA9IHtcbiAgICAgIGlkOiAnaWRlYV8xMjMnLFxuICAgICAgdGl0bGU6ICdVcGRhdGVkIEFwcGxlIFN0cmF0ZWd5JyxcbiAgICAgIGNvbmZpZGVuY2VTY29yZTogMC45LFxuICAgICAgdXBkYXRlZEJ5OiAnY2xhdWRlLXNvbm5ldC0zLjcnXG4gICAgfTtcblxuICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgYSB2YWxpZCB1cGRhdGUgcmVxdWVzdCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IEludmVzdG1lbnRJZGVhVmFsaWRhdG9yLnZhbGlkYXRlVXBkYXRlUmVxdWVzdCh2YWxpZFVwZGF0ZVJlcXVlc3QpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QocmVzdWx0LmVycm9ycykudG9IYXZlTGVuZ3RoKDApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZXF1aXJlIGlkJywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdCA9IHsgLi4udmFsaWRVcGRhdGVSZXF1ZXN0LCBpZDogJycgfTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IEludmVzdG1lbnRJZGVhVmFsaWRhdG9yLnZhbGlkYXRlVXBkYXRlUmVxdWVzdChyZXF1ZXN0KTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3VsdC5pc1ZhbGlkKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3JzKS50b0NvbnRhaW5FcXVhbChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIGZpZWxkOiAnaWQnLFxuICAgICAgICAgIGNvZGU6ICdJRF9SRVFVSVJFRCdcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJlcXVpcmUgdXBkYXRlZEJ5JywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdCA9IHsgLi4udmFsaWRVcGRhdGVSZXF1ZXN0LCB1cGRhdGVkQnk6ICcnIH07XG4gICAgICBjb25zdCByZXN1bHQgPSBJbnZlc3RtZW50SWRlYVZhbGlkYXRvci52YWxpZGF0ZVVwZGF0ZVJlcXVlc3QocmVxdWVzdCk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNWYWxpZCkudG9CZShmYWxzZSk7XG4gICAgICBleHBlY3QocmVzdWx0LmVycm9ycykudG9Db250YWluRXF1YWwoXG4gICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICBmaWVsZDogJ3VwZGF0ZWRCeScsXG4gICAgICAgICAgY29kZTogJ1VQREFURURfQllfUkVRVUlSRUQnXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBub3QgYWxsb3cgZW1wdHkgdGl0bGUgaWYgcHJvdmlkZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0ID0geyAuLi52YWxpZFVwZGF0ZVJlcXVlc3QsIHRpdGxlOiAnJyB9O1xuICAgICAgY29uc3QgcmVzdWx0ID0gSW52ZXN0bWVudElkZWFWYWxpZGF0b3IudmFsaWRhdGVVcGRhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZmllbGQ6ICd0aXRsZScsXG4gICAgICAgICAgY29kZTogJ1RJVExFX0VNUFRZJ1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgY29uZmlkZW5jZSBzY29yZSBpZiBwcm92aWRlZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3QgPSB7IC4uLnZhbGlkVXBkYXRlUmVxdWVzdCwgY29uZmlkZW5jZVNjb3JlOiAyLjAgfTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IEludmVzdG1lbnRJZGVhVmFsaWRhdG9yLnZhbGlkYXRlVXBkYXRlUmVxdWVzdChyZXF1ZXN0KTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3VsdC5pc1ZhbGlkKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3JzKS50b0NvbnRhaW5FcXVhbChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIGZpZWxkOiAnY29uZmlkZW5jZVNjb3JlJyxcbiAgICAgICAgICBjb2RlOiAnSU5WQUxJRF9DT05GSURFTkNFX1NDT1JFJ1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3ZhbGlkYXRlSW52ZXN0bWVudElkZWEnLCAoKSA9PiB7XG4gICAgY29uc3QgdmFsaWRJZGVhOiBJbnZlc3RtZW50SWRlYSA9IHtcbiAgICAgIGlkOiAnaWRlYV8xMjMnLFxuICAgICAgdmVyc2lvbjogMSxcbiAgICAgIHRpdGxlOiAnQXBwbGUgR3Jvd3RoIFN0cmF0ZWd5JyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnTG9uZy10ZXJtIGdyb3d0aCBpbnZlc3RtZW50IGluIEFwcGxlIEluYy4nLFxuICAgICAgaW52ZXN0bWVudHM6IFttb2NrSW52ZXN0bWVudF0sXG4gICAgICByYXRpb25hbGU6ICdTdHJvbmcgZnVuZGFtZW50YWxzIGFuZCBncm93dGggcHJvc3BlY3RzJyxcbiAgICAgIHN0cmF0ZWd5OiAnYnV5JyxcbiAgICAgIHRpbWVIb3Jpem9uOiAnbG9uZycsXG4gICAgICBjb25maWRlbmNlU2NvcmU6IDAuOCxcbiAgICAgIGdlbmVyYXRlZEF0OiBuZXcgRGF0ZSgnMjAyNC0wMS0wMScpLFxuICAgICAgbGFzdFVwZGF0ZWRBdDogbmV3IERhdGUoJzIwMjQtMDEtMDEnKSxcbiAgICAgIHBvdGVudGlhbE91dGNvbWVzOiBbXG4gICAgICAgIHsgLi4ubW9ja091dGNvbWUsIHNjZW5hcmlvOiAnYmVzdCcsIHByb2JhYmlsaXR5OiAwLjIgfSxcbiAgICAgICAgeyAuLi5tb2NrT3V0Y29tZSwgc2NlbmFyaW86ICdleHBlY3RlZCcsIHByb2JhYmlsaXR5OiAwLjYgfSxcbiAgICAgICAgeyAuLi5tb2NrT3V0Y29tZSwgc2NlbmFyaW86ICd3b3JzdCcsIHByb2JhYmlsaXR5OiAwLjIgfVxuICAgICAgXSxcbiAgICAgIHN1cHBvcnRpbmdEYXRhOiBbXSxcbiAgICAgIGNvdW50ZXJBcmd1bWVudHM6IFttb2NrQ291bnRlckFyZ3VtZW50XSxcbiAgICAgIGNvbXBsaWFuY2VTdGF0dXM6IHtcbiAgICAgICAgY29tcGxpYW50OiB0cnVlLFxuICAgICAgICBpc3N1ZXM6IFtdLFxuICAgICAgICByZWd1bGF0aW9uc0NoZWNrZWQ6IFsnU0VDJ10sXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKVxuICAgICAgfSxcbiAgICAgIGNyZWF0ZWRCeTogJ2NsYXVkZS1zb25uZXQtMy43JyxcbiAgICAgIHRhZ3M6IFsndGVjaG5vbG9neScsICdncm93dGgnXSxcbiAgICAgIGNhdGVnb3J5OiAnZXF1aXR5JyxcbiAgICAgIHJpc2tMZXZlbDogJ21vZGVyYXRlJyxcbiAgICAgIHRhcmdldEF1ZGllbmNlOiBbJ3JldGFpbCddLFxuICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgc291cmNlTW9kZWxzOiBbJ2NsYXVkZS1zb25uZXQtMy43J10sXG4gICAgICAgIHByb2Nlc3NpbmdUaW1lOiAxMDAwLFxuICAgICAgICBkYXRhU291cmNlc1VzZWQ6IFsnbWFya2V0LWRhdGEnXSxcbiAgICAgICAgcmVzZWFyY2hEZXB0aDogJ3N0YW5kYXJkJyxcbiAgICAgICAgcXVhbGl0eVNjb3JlOiA4NSxcbiAgICAgICAgbm92ZWx0eVNjb3JlOiA3MCxcbiAgICAgICAgbWFya2V0Q29uZGl0aW9uc0F0R2VuZXJhdGlvbjoge1xuICAgICAgICAgIHZvbGF0aWxpdHlJbmRleDogMjAsXG4gICAgICAgICAgbWFya2V0VHJlbmQ6ICdidWxsJyxcbiAgICAgICAgICBlY29ub21pY0luZGljYXRvcnM6IHt9LFxuICAgICAgICAgIGdlb3BvbGl0aWNhbFJpc2s6ICdsb3cnXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB0cmFja2luZ0luZm86IHtcbiAgICAgICAgdmlld3M6IDAsXG4gICAgICAgIGltcGxlbWVudGF0aW9uczogMCxcbiAgICAgICAgZmVlZGJhY2s6IFtdLFxuICAgICAgICBwZXJmb3JtYW5jZTogW10sXG4gICAgICAgIHN0YXR1czogJ2FjdGl2ZScsXG4gICAgICAgIHN0YXR1c0hpc3Rvcnk6IFtdXG4gICAgICB9XG4gICAgfTtcblxuICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgYSB2YWxpZCBpbnZlc3RtZW50IGlkZWEnLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBJbnZlc3RtZW50SWRlYVZhbGlkYXRvci52YWxpZGF0ZUludmVzdG1lbnRJZGVhKHZhbGlkSWRlYSk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNWYWxpZCkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3JzKS50b0hhdmVMZW5ndGgoMCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHZhbGlkYXRlIGV4cGlyYXRpb24gZGF0ZSBpcyBhZnRlciBnZW5lcmF0aW9uIGRhdGUnLCAoKSA9PiB7XG4gICAgICBjb25zdCBpZGVhID0ge1xuICAgICAgICAuLi52YWxpZElkZWEsXG4gICAgICAgIGV4cGlyZXNBdDogbmV3IERhdGUoJzIwMjMtMTItMzEnKSAvLyBCZWZvcmUgZ2VuZXJhdGlvbiBkYXRlXG4gICAgICB9O1xuICAgICAgY29uc3QgcmVzdWx0ID0gSW52ZXN0bWVudElkZWFWYWxpZGF0b3IudmFsaWRhdGVJbnZlc3RtZW50SWRlYShpZGVhKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3VsdC5pc1ZhbGlkKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3JzKS50b0NvbnRhaW5FcXVhbChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIGZpZWxkOiAnZXhwaXJlc0F0JyxcbiAgICAgICAgICBjb2RlOiAnSU5WQUxJRF9FWFBJUkFUSU9OX0RBVEUnXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB3YXJuIGFib3V0IG91dGNvbWUgcHJvYmFiaWxpdGllcyBub3Qgc3VtbWluZyB0byAxJywgKCkgPT4ge1xuICAgICAgY29uc3QgaWRlYSA9IHtcbiAgICAgICAgLi4udmFsaWRJZGVhLFxuICAgICAgICBwb3RlbnRpYWxPdXRjb21lczogW1xuICAgICAgICAgIHsgLi4ubW9ja091dGNvbWUsIHNjZW5hcmlvOiAnYmVzdCcgYXMgY29uc3QsIHByb2JhYmlsaXR5OiAwLjMgfSxcbiAgICAgICAgICB7IC4uLm1vY2tPdXRjb21lLCBzY2VuYXJpbzogJ2V4cGVjdGVkJyBhcyBjb25zdCwgcHJvYmFiaWxpdHk6IDAuMyB9LFxuICAgICAgICAgIHsgLi4ubW9ja091dGNvbWUsIHNjZW5hcmlvOiAnd29yc3QnIGFzIGNvbnN0LCBwcm9iYWJpbGl0eTogMC4zIH1cbiAgICAgICAgXVxuICAgICAgfTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IEludmVzdG1lbnRJZGVhVmFsaWRhdG9yLnZhbGlkYXRlSW52ZXN0bWVudElkZWEoaWRlYSk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNWYWxpZCkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQud2FybmluZ3MpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZmllbGQ6ICdwb3RlbnRpYWxPdXRjb21lcycsXG4gICAgICAgICAgY29kZTogJ1BST0JBQklMSVRZX1NVTV9XQVJOSU5HJ1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgdmVyc2lvbiBpcyBhdCBsZWFzdCAxJywgKCkgPT4ge1xuICAgICAgY29uc3QgaWRlYSA9IHsgLi4udmFsaWRJZGVhLCB2ZXJzaW9uOiAwIH07XG4gICAgICBjb25zdCByZXN1bHQgPSBJbnZlc3RtZW50SWRlYVZhbGlkYXRvci52YWxpZGF0ZUludmVzdG1lbnRJZGVhKGlkZWEpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZmllbGQ6ICd2ZXJzaW9uJyxcbiAgICAgICAgICBjb2RlOiAnSU5WQUxJRF9WRVJTSU9OJ1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgY29tcGxpYW5jZSBzdGF0dXMgY29udHJhZGljdGlvbicsICgpID0+IHtcbiAgICAgIGNvbnN0IGlkZWEgPSB7XG4gICAgICAgIC4uLnZhbGlkSWRlYSxcbiAgICAgICAgY29tcGxpYW5jZVN0YXR1czoge1xuICAgICAgICAgIGNvbXBsaWFudDogdHJ1ZSxcbiAgICAgICAgICBpc3N1ZXM6IFt7XG4gICAgICAgICAgICBzZXZlcml0eTogJ2NyaXRpY2FsJyBhcyBjb25zdCxcbiAgICAgICAgICAgIHJlZ3VsYXRpb246ICdTRUMgUnVsZSAxJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ3JpdGljYWwgaXNzdWUnLFxuICAgICAgICAgICAgZXN0aW1hdGVkSW1wYWN0OiAnaGlnaCcgYXMgY29uc3RcbiAgICAgICAgICB9XSxcbiAgICAgICAgICByZWd1bGF0aW9uc0NoZWNrZWQ6IFsnU0VDJ10sXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBjb25zdCByZXN1bHQgPSBJbnZlc3RtZW50SWRlYVZhbGlkYXRvci52YWxpZGF0ZUludmVzdG1lbnRJZGVhKGlkZWEpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZmllbGQ6ICdjb21wbGlhbmNlU3RhdHVzJyxcbiAgICAgICAgICBjb2RlOiAnQ09NUExJQU5DRV9DT05UUkFESUNUSU9OJ1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgd2FybiBhYm91dCBmdXR1cmUgZGF0YSBwb2ludHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmdXR1cmVEYXRlID0gbmV3IERhdGUoKTtcbiAgICAgIGZ1dHVyZURhdGUuc2V0RGF0ZShmdXR1cmVEYXRlLmdldERhdGUoKSArIDEpO1xuICAgICAgXG4gICAgICBjb25zdCBpZGVhID0ge1xuICAgICAgICAuLi52YWxpZElkZWEsXG4gICAgICAgIHN1cHBvcnRpbmdEYXRhOiBbe1xuICAgICAgICAgIHNvdXJjZTogJ3Rlc3QnLFxuICAgICAgICAgIHR5cGU6ICdmdW5kYW1lbnRhbCcgYXMgY29uc3QsXG4gICAgICAgICAgdmFsdWU6IDEwMCxcbiAgICAgICAgICB0aW1lc3RhbXA6IGZ1dHVyZURhdGUsXG4gICAgICAgICAgcmVsaWFiaWxpdHk6IDAuOVxuICAgICAgICB9XVxuICAgICAgfTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IEludmVzdG1lbnRJZGVhVmFsaWRhdG9yLnZhbGlkYXRlSW52ZXN0bWVudElkZWEoaWRlYSk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNWYWxpZCkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQud2FybmluZ3MpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZmllbGQ6ICdzdXBwb3J0aW5nRGF0YScsXG4gICAgICAgICAgY29kZTogJ0ZVVFVSRV9EQVRBX1BPSU5UUydcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG4gIH0pO1xufSk7Il19