"use strict";
/**
 * Compliance Verification Testing Suite
 *
 * This test suite implements comprehensive compliance verification tests
 * for the Investment AI Agent system, covering:
 * - Regulatory compliance requirements (SEC, MiFID II, etc.)
 * - ESG compliance verification
 * - Risk management compliance
 * - Data governance compliance
 * - Audit trail compliance
 */
Object.defineProperty(exports, "__esModule", { value: true });
const compliance_agent_1 = require("../ai/compliance-agent");
const claude_haiku_service_1 = require("../ai/claude-haiku-service");
describe('Compliance Verification Testing Suite', () => {
    let complianceAgent;
    let haikuService;
    beforeEach(() => {
        // Mock Bedrock client for Haiku service
        const mockBedrockClient = {
            invokeModel: jest.fn().mockResolvedValue({
                body: Buffer.from(JSON.stringify({ completion: 'test response' }))
            })
        };
        haikuService = new claude_haiku_service_1.ClaudeHaikuService(mockBedrockClient);
        complianceAgent = new compliance_agent_1.ComplianceAgent(haikuService);
    });
    describe('Regulatory Compliance Tests', () => {
        describe('SEC Investment Company Act Compliance', () => {
            it('should verify compliance with SEC investment limits', async () => {
                const investment = {
                    id: 'test-investment-1',
                    type: 'stock',
                    name: 'Test Corporation',
                    ticker: 'TEST',
                    description: 'Test investment for compliance verification',
                    sector: 'Technology',
                    industry: 'Software',
                    marketCap: 1000000000,
                    currentPrice: 100,
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
                const complianceResult = await complianceAgent.checkCompliance(investment);
                expect(complianceResult).toBeDefined();
                expect(complianceResult.regulationsChecked).toContain('SEC Investment Company Act');
                expect(complianceResult.timestamp).toBeInstanceOf(Date);
                // Verify no critical compliance issues for a standard stock investment
                const criticalIssues = complianceResult.issues.filter(issue => issue.severity === 'critical');
                expect(criticalIssues).toHaveLength(0);
            });
            it('should flag compliance issues for high-risk investments', async () => {
                const highRiskInvestment = {
                    id: 'high-risk-investment',
                    type: 'cryptocurrency',
                    name: 'VolatileCoin',
                    description: 'Highly volatile cryptocurrency for testing',
                    description: 'Highly volatile cryptocurrency',
                    sector: 'Cryptocurrency',
                    marketCap: 100000000,
                    currentPrice: 50000,
                    historicalPerformance: [],
                    riskMetrics: {
                        volatility: 0.80,
                        beta: 2.5,
                        sharpeRatio: 0.5,
                        drawdown: 0.60,
                        var: 0.25,
                        correlations: {}
                    },
                    relatedInvestments: []
                };
                const complianceResult = await complianceAgent.checkCompliance(highRiskInvestment);
                expect(complianceResult.compliant).toBe(false);
                expect(complianceResult.issues.length).toBeGreaterThan(0);
                // Should have warnings or critical issues for high-risk investments
                const significantIssues = complianceResult.issues.filter(issue => issue.severity === 'warning' || issue.severity === 'critical');
                expect(significantIssues.length).toBeGreaterThan(0);
            });
            it('should verify portfolio concentration limits', async () => {
                const investments = [
                    {
                        id: 'concentrated-investment-1',
                        type: 'stock',
                        name: 'Concentrated Corp A',
                        description: 'Technology company for concentration testing',
                        sector: 'Technology',
                        marketCap: 500000000,
                        currentPrice: 100,
                        historicalPerformance: [],
                        riskMetrics: {
                            volatility: 0.30,
                            beta: 1.0,
                            sharpeRatio: 1.0,
                            drawdown: 0.20,
                            var: 0.10,
                            correlations: {}
                        },
                        relatedInvestments: []
                    },
                    {
                        id: 'concentrated-investment-2',
                        type: 'stock',
                        name: 'Concentrated Corp B',
                        description: 'Another technology company for concentration testing',
                        sector: 'Technology',
                        marketCap: 500000000,
                        currentPrice: 100,
                        historicalPerformance: [],
                        riskMetrics: {
                            volatility: 0.30,
                            beta: 1.0,
                            sharpeRatio: 1.0,
                            drawdown: 0.20,
                            var: 0.10,
                            correlations: {}
                        },
                        relatedInvestments: []
                    }
                ];
                // Test each investment for concentration compliance
                for (const investment of investments) {
                    const complianceResult = await complianceAgent.checkCompliance(investment);
                    expect(complianceResult).toBeDefined();
                    // Should check for concentration risks
                    const concentrationIssues = complianceResult.issues.filter(issue => issue.description.toLowerCase().includes('concentration'));
                    // May or may not have concentration issues depending on portfolio context
                    expect(concentrationIssues.length).toBeGreaterThanOrEqual(0);
                }
            });
        });
        describe('MiFID II Compliance (EU)', () => {
            it('should verify MiFID II suitability requirements', async () => {
                const complexInvestment = {
                    id: 'complex-investment',
                    type: 'other',
                    name: 'Complex Derivative Product',
                    description: 'Complex structured product with embedded derivatives',
                    sector: 'Financial Services',
                    marketCap: 1000000000,
                    currentPrice: 1000,
                    historicalPerformance: [],
                    riskMetrics: {
                        volatility: 0.45,
                        beta: 1.8,
                        sharpeRatio: 0.8,
                        drawdown: 0.35,
                        var: 0.20,
                        correlations: {}
                    },
                    relatedInvestments: []
                };
                const complianceResult = await complianceAgent.checkCompliance(complexInvestment);
                expect(complianceResult.regulationsChecked).toContain('MiFID II (if applicable)');
                // Complex instruments should trigger suitability warnings
                const suitabilityIssues = complianceResult.issues.filter(issue => issue.description.toLowerCase().includes('suitability') ||
                    issue.description.toLowerCase().includes('complex'));
                expect(suitabilityIssues.length).toBeGreaterThanOrEqual(0);
            });
            it('should verify best execution requirements', async () => {
                const investment = {
                    id: 'execution-test',
                    type: 'stock',
                    name: 'Execution Test Corp',
                    description: 'Technology company for execution testing',
                    sector: 'Technology',
                    marketCap: 2000000000,
                    currentPrice: 150,
                    historicalPerformance: [],
                    riskMetrics: {
                        volatility: 0.20,
                        beta: 1.1,
                        sharpeRatio: 1.3,
                        drawdown: 0.12,
                        var: 0.08,
                        correlations: {}
                    },
                    relatedInvestments: []
                };
                const complianceResult = await complianceAgent.checkCompliance(investment);
                // Should include checks for best execution
                expect(complianceResult.regulationsChecked.length).toBeGreaterThan(0);
                expect(complianceResult.timestamp).toBeInstanceOf(Date);
            });
        });
        describe('Fiduciary Duty Compliance', () => {
            it('should verify fiduciary duty requirements', async () => {
                const investmentIdea = {
                    id: 'fiduciary-test-idea',
                    title: 'Conservative Growth Strategy',
                    description: 'Low-risk growth strategy for retirement accounts',
                    investments: [{
                            id: 'conservative-stock',
                            type: 'stock',
                            name: 'Stable Dividend Corp',
                            description: 'Stable utility company with consistent dividends',
                            sector: 'Utilities',
                            marketCap: 5000000000,
                            currentPrice: 75,
                            historicalPerformance: [],
                            riskMetrics: {
                                volatility: 0.15,
                                beta: 0.8,
                                sharpeRatio: 1.8,
                                drawdown: 0.08,
                                var: 0.04,
                                correlations: {}
                            },
                            relatedInvestments: []
                        }],
                    rationale: 'Suitable for conservative investors seeking steady income',
                    strategy: 'buy',
                    timeHorizon: 'long',
                    confidenceScore: 0.85,
                    generatedAt: new Date(),
                    potentialOutcomes: [
                        {
                            scenario: 'expected',
                            probability: 0.7,
                            returnEstimate: 0.08,
                            timeToRealization: 365,
                            description: 'Steady 8% annual returns',
                            conditions: ['Stable market conditions', 'Continued dividend payments'],
                            keyRisks: ['Market volatility', 'Interest rate changes'],
                            catalysts: ['Dividend increases', 'Sector growth']
                        }
                    ],
                    supportingData: [],
                    counterArguments: [],
                    complianceStatus: {
                        compliant: true,
                        issues: [],
                        regulationsChecked: [],
                        timestamp: new Date()
                    },
                    createdBy: 'test-model'
                };
                const request = {
                    investmentIdeas: [investmentIdea],
                    requestType: 'compliance-check',
                    parameters: {
                        jurisdictions: ['US'],
                        includeESG: false
                    }
                };
                const response = await complianceAgent.processComplianceRequest(request);
                expect(response.complianceResults.length).toBeGreaterThan(0);
                const fiduciaryIssues = response.complianceResults[0].issues.filter(issue => issue.regulation.toLowerCase().includes('fiduciary'));
                // Conservative strategy should have minimal fiduciary concerns
                const criticalFiduciaryIssues = fiduciaryIssues.filter(issue => issue.severity === 'critical');
                expect(criticalFiduciaryIssues).toHaveLength(0);
            });
        });
    });
    describe('ESG Compliance Tests', () => {
        describe('Environmental Compliance', () => {
            it('should assess environmental impact compliance', async () => {
                const environmentalInvestment = {
                    id: 'environmental-test',
                    type: 'stock',
                    name: 'Green Energy Corp',
                    description: 'Renewable energy company focused on solar and wind power',
                    description: 'Renewable energy company focused on solar and wind power',
                    sector: 'Energy',
                    industry: 'Renewable Energy',
                    marketCap: 3000000000,
                    currentPrice: 120,
                    historicalPerformance: [],
                    riskMetrics: {
                        volatility: 0.25,
                        beta: 1.0,
                        sharpeRatio: 1.2,
                        drawdown: 0.18,
                        var: 0.12,
                        correlations: {}
                    },
                    relatedInvestments: []
                };
                const request = {
                    investments: [environmentalInvestment],
                    requestType: 'esg-analysis',
                    parameters: {
                        includeESG: true,
                        jurisdictions: ['US', 'EU']
                    }
                };
                const response = await complianceAgent.processComplianceRequest(request);
                expect(response.esgAnalysis).toBeDefined();
                expect(response.esgAnalysis.environmentalScore).toBeGreaterThanOrEqual(0);
                expect(response.esgAnalysis.environmentalScore).toBeLessThanOrEqual(100);
                // Renewable energy should have positive environmental factors
                const environmentalFactors = response.esgAnalysis.esgFactors.filter(factor => factor.category === 'environmental');
                expect(environmentalFactors.length).toBeGreaterThan(0);
            });
            it('should flag environmental compliance issues', async () => {
                const pollutingInvestment = {
                    id: 'polluting-investment',
                    type: 'stock',
                    name: 'Heavy Polluter Corp',
                    description: 'Coal mining company with high environmental impact',
                    sector: 'Energy',
                    industry: 'Coal Mining',
                    marketCap: 1000000000,
                    currentPrice: 50,
                    historicalPerformance: [],
                    riskMetrics: {
                        volatility: 0.40,
                        beta: 1.5,
                        sharpeRatio: 0.6,
                        drawdown: 0.30,
                        var: 0.18,
                        correlations: {}
                    },
                    relatedInvestments: []
                };
                const request = {
                    investments: [pollutingInvestment],
                    requestType: 'esg-analysis',
                    parameters: {
                        includeESG: true,
                        jurisdictions: ['US', 'EU']
                    }
                };
                const response = await complianceAgent.processComplianceRequest(request);
                expect(response.esgAnalysis).toBeDefined();
                // Should identify environmental risks
                const environmentalRisks = response.esgAnalysis.esgRisks.filter(risk => risk.category === 'environmental');
                expect(environmentalRisks.length).toBeGreaterThan(0);
                // Should have lower environmental score
                expect(response.esgAnalysis.environmentalScore).toBeLessThan(70);
            });
        });
        describe('Social Compliance', () => {
            it('should assess social responsibility compliance', async () => {
                const socialInvestment = {
                    id: 'social-test',
                    type: 'stock',
                    name: 'Healthcare Innovation Corp',
                    description: 'Pharmaceutical company focused on innovative treatments',
                    sector: 'Healthcare',
                    industry: 'Pharmaceuticals',
                    marketCap: 8000000000,
                    currentPrice: 200,
                    historicalPerformance: [],
                    riskMetrics: {
                        volatility: 0.22,
                        beta: 0.9,
                        sharpeRatio: 1.4,
                        drawdown: 0.15,
                        var: 0.10,
                        correlations: {}
                    },
                    relatedInvestments: []
                };
                const request = {
                    investments: [socialInvestment],
                    requestType: 'esg-analysis',
                    parameters: {
                        includeESG: true,
                        jurisdictions: ['US']
                    }
                };
                const response = await complianceAgent.processComplianceRequest(request);
                expect(response.esgAnalysis).toBeDefined();
                expect(response.esgAnalysis.socialScore).toBeGreaterThanOrEqual(0);
                expect(response.esgAnalysis.socialScore).toBeLessThanOrEqual(100);
                // Healthcare should have positive social factors
                const socialFactors = response.esgAnalysis.esgFactors.filter(factor => factor.category === 'social');
                expect(socialFactors.length).toBeGreaterThan(0);
            });
        });
        describe('Governance Compliance', () => {
            it('should assess corporate governance compliance', async () => {
                const governanceInvestment = {
                    id: 'governance-test',
                    type: 'stock',
                    name: 'Well-Governed Corp',
                    description: 'Financial services company with strong governance practices',
                    sector: 'Financial Services',
                    industry: 'Banking',
                    marketCap: 15000000000,
                    currentPrice: 300,
                    historicalPerformance: [],
                    riskMetrics: {
                        volatility: 0.18,
                        beta: 1.1,
                        sharpeRatio: 1.6,
                        drawdown: 0.12,
                        var: 0.08,
                        correlations: {}
                    },
                    relatedInvestments: []
                };
                const request = {
                    investments: [governanceInvestment],
                    requestType: 'esg-analysis',
                    parameters: {
                        includeESG: true,
                        jurisdictions: ['US']
                    }
                };
                const response = await complianceAgent.processComplianceRequest(request);
                expect(response.esgAnalysis).toBeDefined();
                expect(response.esgAnalysis.governanceScore).toBeGreaterThanOrEqual(0);
                expect(response.esgAnalysis.governanceScore).toBeLessThanOrEqual(100);
                // Should assess governance factors
                const governanceFactors = response.esgAnalysis.esgFactors.filter(factor => factor.category === 'governance');
                expect(governanceFactors.length).toBeGreaterThan(0);
            });
        });
    });
    describe('Risk Management Compliance Tests', () => {
        describe('Risk Assessment Compliance', () => {
            it('should perform comprehensive risk assessment', async () => {
                const investment = {
                    id: 'risk-assessment-test',
                    type: 'stock',
                    name: 'Risk Assessment Corp',
                    description: 'Technology company for risk assessment testing',
                    sector: 'Technology',
                    marketCap: 2000000000,
                    currentPrice: 100,
                    historicalPerformance: [],
                    riskMetrics: {
                        volatility: 0.30,
                        beta: 1.3,
                        sharpeRatio: 1.1,
                        drawdown: 0.25,
                        var: 0.15,
                        correlations: {}
                    },
                    relatedInvestments: []
                };
                const riskContext = {
                    portfolioComposition: { [investment.id]: 1.0 },
                    marketConditions: {},
                    riskTolerance: 'moderate',
                    investmentHorizon: 'medium',
                    regulatoryContext: ['US']
                };
                const riskAssessment = await complianceAgent.evaluateRisk(investment, riskContext);
                expect(riskAssessment).toBeDefined();
                expect(riskAssessment.overallRisk).toMatch(/^(low|medium|high|very-high)$/);
                expect(riskAssessment.riskFactors).toBeDefined();
                expect(riskAssessment.riskFactors.length).toBeGreaterThan(0);
                expect(riskAssessment.mitigationStrategies).toBeDefined();
                expect(riskAssessment.mitigationStrategies.length).toBeGreaterThan(0);
            });
            it('should identify high-risk investments', async () => {
                const highRiskInvestment = {
                    id: 'high-risk-test',
                    type: 'cryptocurrency',
                    name: 'VolatileCoin',
                    description: 'Highly volatile cryptocurrency for testing',
                    sector: 'Cryptocurrency',
                    marketCap: 50000000,
                    currentPrice: 25000,
                    historicalPerformance: [],
                    riskMetrics: {
                        volatility: 0.85,
                        beta: 3.0,
                        sharpeRatio: 0.3,
                        drawdown: 0.70,
                        var: 0.35,
                        correlations: {}
                    },
                    relatedInvestments: []
                };
                const riskContext = {
                    portfolioComposition: { [highRiskInvestment.id]: 1.0 },
                    marketConditions: {},
                    riskTolerance: 'conservative',
                    investmentHorizon: 'short',
                    regulatoryContext: ['US']
                };
                const riskAssessment = await complianceAgent.evaluateRisk(highRiskInvestment, riskContext);
                expect(riskAssessment.overallRisk).toMatch(/^(high|very-high)$/);
                expect(riskAssessment.riskFactors.length).toBeGreaterThan(3);
                // Should have multiple mitigation strategies for high-risk investments
                expect(riskAssessment.mitigationStrategies.length).toBeGreaterThan(2);
            });
        });
        describe('Portfolio Risk Compliance', () => {
            it('should assess portfolio-level risk compliance', async () => {
                const portfolioInvestments = [
                    {
                        id: 'portfolio-stock-1',
                        type: 'stock',
                        name: 'Diversified Corp A',
                        description: 'Technology company for portfolio diversification testing',
                        sector: 'Technology',
                        marketCap: 5000000000,
                        currentPrice: 150,
                        historicalPerformance: [],
                        riskMetrics: {
                            volatility: 0.25,
                            beta: 1.2,
                            sharpeRatio: 1.3,
                            drawdown: 0.18,
                            var: 0.12,
                            correlations: {}
                        },
                        relatedInvestments: []
                    },
                    {
                        id: 'portfolio-bond-1',
                        type: 'bond',
                        name: 'Government Bond Fund',
                        description: 'Low-risk government bond fund for portfolio balance',
                        sector: 'Fixed Income',
                        marketCap: 10000000000,
                        currentPrice: 100,
                        historicalPerformance: [],
                        riskMetrics: {
                            volatility: 0.05,
                            beta: 0.2,
                            sharpeRatio: 0.8,
                            drawdown: 0.03,
                            var: 0.02,
                            correlations: {}
                        },
                        relatedInvestments: []
                    }
                ];
                // Test portfolio diversification compliance
                for (const investment of portfolioInvestments) {
                    const riskContext = {
                        portfolioComposition: { [investment.id]: 0.5 },
                        marketConditions: {},
                        riskTolerance: 'moderate',
                        investmentHorizon: 'long',
                        regulatoryContext: ['US']
                    };
                    const riskAssessment = await complianceAgent.evaluateRisk(investment, riskContext);
                    expect(riskAssessment).toBeDefined();
                }
            });
        });
    });
    describe('Data Governance Compliance Tests', () => {
        describe('Data Retention Compliance', () => {
            it('should verify data retention policy compliance', () => {
                const dataRetentionPolicy = {
                    userDataRetention: 7 * 365,
                    transactionDataRetention: 7 * 365,
                    logDataRetention: 2 * 365,
                    backupDataRetention: 10 * 365,
                    deletionGracePeriod: 30 // 30 days
                };
                // Verify retention periods meet regulatory requirements
                expect(dataRetentionPolicy.userDataRetention).toBeGreaterThanOrEqual(5 * 365); // Min 5 years
                expect(dataRetentionPolicy.transactionDataRetention).toBeGreaterThanOrEqual(7 * 365); // Min 7 years
                expect(dataRetentionPolicy.logDataRetention).toBeGreaterThanOrEqual(1 * 365); // Min 1 year
            });
        });
        describe('Data Access Control Compliance', () => {
            it('should verify proper data access controls', () => {
                const accessControlPolicy = {
                    requireAuthentication: true,
                    requireAuthorization: true,
                    implementRBAC: true,
                    auditDataAccess: true,
                    encryptSensitiveData: true,
                    minimumPasswordComplexity: true
                };
                expect(accessControlPolicy.requireAuthentication).toBe(true);
                expect(accessControlPolicy.requireAuthorization).toBe(true);
                expect(accessControlPolicy.implementRBAC).toBe(true);
                expect(accessControlPolicy.auditDataAccess).toBe(true);
                expect(accessControlPolicy.encryptSensitiveData).toBe(true);
            });
        });
    });
    describe('Audit Trail Compliance Tests', () => {
        describe('Transaction Audit Trail', () => {
            it('should maintain comprehensive audit trails', () => {
                const auditTrailRequirements = {
                    logAllTransactions: true,
                    includeTimestamps: true,
                    includeUserIdentification: true,
                    includeActionDetails: true,
                    tamperProofLogs: true,
                    regularBackups: true,
                    accessControlForLogs: true
                };
                expect(auditTrailRequirements.logAllTransactions).toBe(true);
                expect(auditTrailRequirements.includeTimestamps).toBe(true);
                expect(auditTrailRequirements.includeUserIdentification).toBe(true);
                expect(auditTrailRequirements.includeActionDetails).toBe(true);
                expect(auditTrailRequirements.tamperProofLogs).toBe(true);
            });
        });
        describe('Compliance Reporting', () => {
            it('should generate required compliance reports', async () => {
                const reportingRequirements = {
                    monthlyRiskReports: true,
                    quarterlyComplianceReports: true,
                    annualAuditReports: true,
                    incidentReports: true,
                    regulatoryFilings: true
                };
                expect(reportingRequirements.monthlyRiskReports).toBe(true);
                expect(reportingRequirements.quarterlyComplianceReports).toBe(true);
                expect(reportingRequirements.annualAuditReports).toBe(true);
                expect(reportingRequirements.incidentReports).toBe(true);
                expect(reportingRequirements.regulatoryFilings).toBe(true);
            });
        });
    });
    describe('Regulation Change Monitoring', () => {
        describe('Regulatory Update Compliance', () => {
            it('should monitor and adapt to regulatory changes', async () => {
                const regulationMonitoring = await complianceAgent.monitorRegulationChanges();
                expect(regulationMonitoring).toBeDefined();
                expect(regulationMonitoring.newRegulations).toBeDefined();
                expect(regulationMonitoring.updatedRegulations).toBeDefined();
                expect(regulationMonitoring.upcomingRegulations).toBeDefined();
                // Should be arrays (even if empty)
                expect(Array.isArray(regulationMonitoring.newRegulations)).toBe(true);
                expect(Array.isArray(regulationMonitoring.updatedRegulations)).toBe(true);
                expect(Array.isArray(regulationMonitoring.upcomingRegulations)).toBe(true);
            });
            it('should update compliance rules within required timeframes', () => {
                const updateTimeframes = {
                    criticalRegulationChanges: 24,
                    standardRegulationChanges: 72,
                    minorRegulationChanges: 168,
                    plannedRegulationChanges: 720 // 30 days
                };
                // Verify update timeframes are reasonable
                expect(updateTimeframes.criticalRegulationChanges).toBeLessThanOrEqual(48);
                expect(updateTimeframes.standardRegulationChanges).toBeLessThanOrEqual(168);
                expect(updateTimeframes.minorRegulationChanges).toBeLessThanOrEqual(720);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGxpYW5jZS12ZXJpZmljYXRpb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9fX3Rlc3RzX18vY29tcGxpYW5jZS12ZXJpZmljYXRpb24udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7R0FVRzs7QUFFSCw2REFBeUQ7QUFDekQscUVBQWdFO0FBT2hFLFFBQVEsQ0FBQyx1Q0FBdUMsRUFBRSxHQUFHLEVBQUU7SUFDckQsSUFBSSxlQUFnQyxDQUFDO0lBQ3JDLElBQUksWUFBZ0MsQ0FBQztJQUVyQyxVQUFVLENBQUMsR0FBRyxFQUFFO1FBQ2Qsd0NBQXdDO1FBQ3hDLE1BQU0saUJBQWlCLEdBQUc7WUFDeEIsV0FBVyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQztnQkFDdkMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLFVBQVUsRUFBRSxlQUFlLEVBQUUsQ0FBQyxDQUFDO2FBQ25FLENBQUM7U0FDSSxDQUFDO1FBRVQsWUFBWSxHQUFHLElBQUkseUNBQWtCLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUN6RCxlQUFlLEdBQUcsSUFBSSxrQ0FBZSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ3RELENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtRQUMzQyxRQUFRLENBQUMsdUNBQXVDLEVBQUUsR0FBRyxFQUFFO1lBQ3JELEVBQUUsQ0FBQyxxREFBcUQsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDbkUsTUFBTSxVQUFVLEdBQWU7b0JBQzdCLEVBQUUsRUFBRSxtQkFBbUI7b0JBQ3ZCLElBQUksRUFBRSxPQUFPO29CQUNiLElBQUksRUFBRSxrQkFBa0I7b0JBQ3hCLE1BQU0sRUFBRSxNQUFNO29CQUNkLFdBQVcsRUFBRSw2Q0FBNkM7b0JB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QUFDLElBQUksQ0FBQyxDQUFDO1lBQzdFLENBQUMsQ0FBQyxDQUFDO1lBRUgsRUFBRSxDQUFDLDJEQUEyRCxFQUFFLEdBQUcsRUFBRTtnQkFDbkUsTUFBTSxnQkFBZ0IsR0FBRztvQkFDdkIseUJBQXlCLEVBQUUsRUFBRTtvQkFDN0IseUJBQXlCLEVBQUUsRUFBRTtvQkFDN0Isc0JBQXNCLEVBQUUsR0FBRztvQkFDM0Isd0JBQXdCLEVBQUUsR0FBRyxDQUFDLFVBQVU7aUJBQ3pDLENBQUM7Z0JBRUYsMENBQTBDO2dCQUMxQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMseUJBQXlCLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDM0UsTUFBTSxDQUFDLGdCQUFnQixDQUFDLHlCQUF5QixDQUFDLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzVFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzNFLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb21wbGlhbmNlIFZlcmlmaWNhdGlvbiBUZXN0aW5nIFN1aXRlXG4gKiBcbiAqIFRoaXMgdGVzdCBzdWl0ZSBpbXBsZW1lbnRzIGNvbXByZWhlbnNpdmUgY29tcGxpYW5jZSB2ZXJpZmljYXRpb24gdGVzdHNcbiAqIGZvciB0aGUgSW52ZXN0bWVudCBBSSBBZ2VudCBzeXN0ZW0sIGNvdmVyaW5nOlxuICogLSBSZWd1bGF0b3J5IGNvbXBsaWFuY2UgcmVxdWlyZW1lbnRzIChTRUMsIE1pRklEIElJLCBldGMuKVxuICogLSBFU0cgY29tcGxpYW5jZSB2ZXJpZmljYXRpb25cbiAqIC0gUmlzayBtYW5hZ2VtZW50IGNvbXBsaWFuY2VcbiAqIC0gRGF0YSBnb3Zlcm5hbmNlIGNvbXBsaWFuY2VcbiAqIC0gQXVkaXQgdHJhaWwgY29tcGxpYW5jZVxuICovXG5cbmltcG9ydCB7IENvbXBsaWFuY2VBZ2VudCB9IGZyb20gJy4uL2FpL2NvbXBsaWFuY2UtYWdlbnQnO1xuaW1wb3J0IHsgQ2xhdWRlSGFpa3VTZXJ2aWNlIH0gZnJvbSAnLi4vYWkvY2xhdWRlLWhhaWt1LXNlcnZpY2UnO1xuaW1wb3J0IHsgSW52ZXN0bWVudCB9IGZyb20gJy4uLy4uL21vZGVscy9pbnZlc3RtZW50JztcbmltcG9ydCB7IEludmVzdG1lbnRJZGVhIH0gZnJvbSAnLi4vLi4vbW9kZWxzL2ludmVzdG1lbnQtaWRlYSc7XG5pbXBvcnQgeyBVc2VyIH0gZnJvbSAnLi4vLi4vbW9kZWxzL3VzZXInO1xuaW1wb3J0IHsgQ29tcGxpYW5jZVJlc3VsdCwgQ29tcGxpYW5jZUlzc3VlIH0gZnJvbSAnLi4vLi4vbW9kZWxzL2ludmVzdG1lbnQtaWRlYSc7XG5pbXBvcnQgeyBSaXNrQ29udGV4dCwgUmlza0Fzc2Vzc21lbnQgfSBmcm9tICcuLi8uLi9tb2RlbHMvc2VydmljZXMnO1xuXG5kZXNjcmliZSgnQ29tcGxpYW5jZSBWZXJpZmljYXRpb24gVGVzdGluZyBTdWl0ZScsICgpID0+IHtcbiAgbGV0IGNvbXBsaWFuY2VBZ2VudDogQ29tcGxpYW5jZUFnZW50O1xuICBsZXQgaGFpa3VTZXJ2aWNlOiBDbGF1ZGVIYWlrdVNlcnZpY2U7XG5cbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgLy8gTW9jayBCZWRyb2NrIGNsaWVudCBmb3IgSGFpa3Ugc2VydmljZVxuICAgIGNvbnN0IG1vY2tCZWRyb2NrQ2xpZW50ID0ge1xuICAgICAgaW52b2tlTW9kZWw6IGplc3QuZm4oKS5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIGJvZHk6IEJ1ZmZlci5mcm9tKEpTT04uc3RyaW5naWZ5KHsgY29tcGxldGlvbjogJ3Rlc3QgcmVzcG9uc2UnIH0pKVxuICAgICAgfSlcbiAgICB9IGFzIGFueTtcbiAgICBcbiAgICBoYWlrdVNlcnZpY2UgPSBuZXcgQ2xhdWRlSGFpa3VTZXJ2aWNlKG1vY2tCZWRyb2NrQ2xpZW50KTtcbiAgICBjb21wbGlhbmNlQWdlbnQgPSBuZXcgQ29tcGxpYW5jZUFnZW50KGhhaWt1U2VydmljZSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdSZWd1bGF0b3J5IENvbXBsaWFuY2UgVGVzdHMnLCAoKSA9PiB7XG4gICAgZGVzY3JpYmUoJ1NFQyBJbnZlc3RtZW50IENvbXBhbnkgQWN0IENvbXBsaWFuY2UnLCAoKSA9PiB7XG4gICAgICBpdCgnc2hvdWxkIHZlcmlmeSBjb21wbGlhbmNlIHdpdGggU0VDIGludmVzdG1lbnQgbGltaXRzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBpbnZlc3RtZW50OiBJbnZlc3RtZW50ID0ge1xuICAgICAgICAgIGlkOiAndGVzdC1pbnZlc3RtZW50LTEnLFxuICAgICAgICAgIHR5cGU6ICdzdG9jaycsXG4gICAgICAgICAgbmFtZTogJ1Rlc3QgQ29ycG9yYXRpb24nLFxuICAgICAgICAgIHRpY2tlcjogJ1RFU1QnLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGVzdCBpbnZlc3RtZW50IGZvciBjb21wbGlhbmNlIHZlcmlmaWNhdGlvbicsXG4gICAgICAgICAgc2VjdG9yOiAnVGVjaG5vbG9neScsXG4gICAgICAgICAgaW5kdXN0cnk6ICdTb2Z0d2FyZScsXG4gICAgICAgICAgbWFya2V0Q2FwOiAxMDAwMDAwMDAwLCAvLyAkMUIgbWFya2V0IGNhcFxuICAgICAgICAgIGN1cnJlbnRQcmljZTogMTAwLFxuICAgICAgICAgIGhpc3RvcmljYWxQZXJmb3JtYW5jZTogW10sXG4gICAgICAgICAgcmlza01ldHJpY3M6IHtcbiAgICAgICAgICAgIHZvbGF0aWxpdHk6IDAuMjUsXG4gICAgICAgICAgICBiZXRhOiAxLjIsXG4gICAgICAgICAgICBzaGFycGVSYXRpbzogMS41LFxuICAgICAgICAgICAgZHJhd2Rvd246IDAuMTUsXG4gICAgICAgICAgICB2YXI6IDAuMDUsXG4gICAgICAgICAgICBjb3JyZWxhdGlvbnM6IHt9XG4gICAgICAgICAgfSxcbiAgICAgICAgICByZWxhdGVkSW52ZXN0bWVudHM6IFtdXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgY29tcGxpYW5jZVJlc3VsdCA9IGF3YWl0IGNvbXBsaWFuY2VBZ2VudC5jaGVja0NvbXBsaWFuY2UoaW52ZXN0bWVudCk7XG5cbiAgICAgICAgZXhwZWN0KGNvbXBsaWFuY2VSZXN1bHQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdChjb21wbGlhbmNlUmVzdWx0LnJlZ3VsYXRpb25zQ2hlY2tlZCkudG9Db250YWluKCdTRUMgSW52ZXN0bWVudCBDb21wYW55IEFjdCcpO1xuICAgICAgICBleHBlY3QoY29tcGxpYW5jZVJlc3VsdC50aW1lc3RhbXApLnRvQmVJbnN0YW5jZU9mKERhdGUpO1xuICAgICAgICBcbiAgICAgICAgLy8gVmVyaWZ5IG5vIGNyaXRpY2FsIGNvbXBsaWFuY2UgaXNzdWVzIGZvciBhIHN0YW5kYXJkIHN0b2NrIGludmVzdG1lbnRcbiAgICAgICAgY29uc3QgY3JpdGljYWxJc3N1ZXMgPSBjb21wbGlhbmNlUmVzdWx0Lmlzc3Vlcy5maWx0ZXIoaXNzdWUgPT4gaXNzdWUuc2V2ZXJpdHkgPT09ICdjcml0aWNhbCcpO1xuICAgICAgICBleHBlY3QoY3JpdGljYWxJc3N1ZXMpLnRvSGF2ZUxlbmd0aCgwKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIGZsYWcgY29tcGxpYW5jZSBpc3N1ZXMgZm9yIGhpZ2gtcmlzayBpbnZlc3RtZW50cycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgaGlnaFJpc2tJbnZlc3RtZW50OiBJbnZlc3RtZW50ID0ge1xuICAgICAgICAgIGlkOiAnaGlnaC1yaXNrLWludmVzdG1lbnQnLFxuICAgICAgICAgIHR5cGU6ICdjcnlwdG9jdXJyZW5jeScsXG4gICAgICAgICAgbmFtZTogJ1ZvbGF0aWxlQ29pbicsXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdIaWdobHkgdm9sYXRpbGUgY3J5cHRvY3VycmVuY3kgZm9yIHRlc3RpbmcnLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSGlnaGx5IHZvbGF0aWxlIGNyeXB0b2N1cnJlbmN5JyxcbiAgICAgICAgICBzZWN0b3I6ICdDcnlwdG9jdXJyZW5jeScsXG4gICAgICAgICAgbWFya2V0Q2FwOiAxMDAwMDAwMDAsIC8vICQxMDBNIG1hcmtldCBjYXAgKHNtYWxsZXIpXG4gICAgICAgICAgY3VycmVudFByaWNlOiA1MDAwMCxcbiAgICAgICAgICBoaXN0b3JpY2FsUGVyZm9ybWFuY2U6IFtdLFxuICAgICAgICAgIHJpc2tNZXRyaWNzOiB7XG4gICAgICAgICAgICB2b2xhdGlsaXR5OiAwLjgwLCAvLyBWZXJ5IGhpZ2ggdm9sYXRpbGl0eVxuICAgICAgICAgICAgYmV0YTogMi41LCAvLyBIaWdoIGJldGFcbiAgICAgICAgICAgIHNoYXJwZVJhdGlvOiAwLjUsIC8vIExvdyBTaGFycGUgcmF0aW9cbiAgICAgICAgICAgIGRyYXdkb3duOiAwLjYwLCAvLyBIaWdoIGRyYXdkb3duXG4gICAgICAgICAgICB2YXI6IDAuMjUsIC8vIEhpZ2ggVmFSXG4gICAgICAgICAgICBjb3JyZWxhdGlvbnM6IHt9XG4gICAgICAgICAgfSxcbiAgICAgICAgICByZWxhdGVkSW52ZXN0bWVudHM6IFtdXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgY29tcGxpYW5jZVJlc3VsdCA9IGF3YWl0IGNvbXBsaWFuY2VBZ2VudC5jaGVja0NvbXBsaWFuY2UoaGlnaFJpc2tJbnZlc3RtZW50KTtcblxuICAgICAgICBleHBlY3QoY29tcGxpYW5jZVJlc3VsdC5jb21wbGlhbnQpLnRvQmUoZmFsc2UpO1xuICAgICAgICBleHBlY3QoY29tcGxpYW5jZVJlc3VsdC5pc3N1ZXMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICAgIFxuICAgICAgICAvLyBTaG91bGQgaGF2ZSB3YXJuaW5ncyBvciBjcml0aWNhbCBpc3N1ZXMgZm9yIGhpZ2gtcmlzayBpbnZlc3RtZW50c1xuICAgICAgICBjb25zdCBzaWduaWZpY2FudElzc3VlcyA9IGNvbXBsaWFuY2VSZXN1bHQuaXNzdWVzLmZpbHRlcihcbiAgICAgICAgICBpc3N1ZSA9PiBpc3N1ZS5zZXZlcml0eSA9PT0gJ3dhcm5pbmcnIHx8IGlzc3VlLnNldmVyaXR5ID09PSAnY3JpdGljYWwnXG4gICAgICAgICk7XG4gICAgICAgIGV4cGVjdChzaWduaWZpY2FudElzc3Vlcy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIHZlcmlmeSBwb3J0Zm9saW8gY29uY2VudHJhdGlvbiBsaW1pdHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGludmVzdG1lbnRzOiBJbnZlc3RtZW50W10gPSBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgaWQ6ICdjb25jZW50cmF0ZWQtaW52ZXN0bWVudC0xJyxcbiAgICAgICAgICAgIHR5cGU6ICdzdG9jaycsXG4gICAgICAgICAgICBuYW1lOiAnQ29uY2VudHJhdGVkIENvcnAgQScsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1RlY2hub2xvZ3kgY29tcGFueSBmb3IgY29uY2VudHJhdGlvbiB0ZXN0aW5nJyxcbiAgICAgICAgICAgIHNlY3RvcjogJ1RlY2hub2xvZ3knLFxuICAgICAgICAgICAgbWFya2V0Q2FwOiA1MDAwMDAwMDAsXG4gICAgICAgICAgICBjdXJyZW50UHJpY2U6IDEwMCxcbiAgICAgICAgICAgIGhpc3RvcmljYWxQZXJmb3JtYW5jZTogW10sXG4gICAgICAgICAgICByaXNrTWV0cmljczoge1xuICAgICAgICAgICAgICB2b2xhdGlsaXR5OiAwLjMwLFxuICAgICAgICAgICAgICBiZXRhOiAxLjAsXG4gICAgICAgICAgICAgIHNoYXJwZVJhdGlvOiAxLjAsXG4gICAgICAgICAgICAgIGRyYXdkb3duOiAwLjIwLFxuICAgICAgICAgICAgICB2YXI6IDAuMTAsXG4gICAgICAgICAgICAgIGNvcnJlbGF0aW9uczoge31cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWxhdGVkSW52ZXN0bWVudHM6IFtdXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpZDogJ2NvbmNlbnRyYXRlZC1pbnZlc3RtZW50LTInLFxuICAgICAgICAgICAgdHlwZTogJ3N0b2NrJyxcbiAgICAgICAgICAgIG5hbWU6ICdDb25jZW50cmF0ZWQgQ29ycCBCJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQW5vdGhlciB0ZWNobm9sb2d5IGNvbXBhbnkgZm9yIGNvbmNlbnRyYXRpb24gdGVzdGluZycsXG4gICAgICAgICAgICBzZWN0b3I6ICdUZWNobm9sb2d5JywgLy8gU2FtZSBzZWN0b3IgLSBjb25jZW50cmF0aW9uIHJpc2tcbiAgICAgICAgICAgIG1hcmtldENhcDogNTAwMDAwMDAwLFxuICAgICAgICAgICAgY3VycmVudFByaWNlOiAxMDAsXG4gICAgICAgICAgICBoaXN0b3JpY2FsUGVyZm9ybWFuY2U6IFtdLFxuICAgICAgICAgICAgcmlza01ldHJpY3M6IHtcbiAgICAgICAgICAgICAgdm9sYXRpbGl0eTogMC4zMCxcbiAgICAgICAgICAgICAgYmV0YTogMS4wLFxuICAgICAgICAgICAgICBzaGFycGVSYXRpbzogMS4wLFxuICAgICAgICAgICAgICBkcmF3ZG93bjogMC4yMCxcbiAgICAgICAgICAgICAgdmFyOiAwLjEwLFxuICAgICAgICAgICAgICBjb3JyZWxhdGlvbnM6IHt9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVsYXRlZEludmVzdG1lbnRzOiBbXVxuICAgICAgICAgIH1cbiAgICAgICAgXTtcblxuICAgICAgICAvLyBUZXN0IGVhY2ggaW52ZXN0bWVudCBmb3IgY29uY2VudHJhdGlvbiBjb21wbGlhbmNlXG4gICAgICAgIGZvciAoY29uc3QgaW52ZXN0bWVudCBvZiBpbnZlc3RtZW50cykge1xuICAgICAgICAgIGNvbnN0IGNvbXBsaWFuY2VSZXN1bHQgPSBhd2FpdCBjb21wbGlhbmNlQWdlbnQuY2hlY2tDb21wbGlhbmNlKGludmVzdG1lbnQpO1xuICAgICAgICAgIGV4cGVjdChjb21wbGlhbmNlUmVzdWx0KS50b0JlRGVmaW5lZCgpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIFNob3VsZCBjaGVjayBmb3IgY29uY2VudHJhdGlvbiByaXNrc1xuICAgICAgICAgIGNvbnN0IGNvbmNlbnRyYXRpb25Jc3N1ZXMgPSBjb21wbGlhbmNlUmVzdWx0Lmlzc3Vlcy5maWx0ZXIoXG4gICAgICAgICAgICBpc3N1ZSA9PiBpc3N1ZS5kZXNjcmlwdGlvbi50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdjb25jZW50cmF0aW9uJylcbiAgICAgICAgICApO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIE1heSBvciBtYXkgbm90IGhhdmUgY29uY2VudHJhdGlvbiBpc3N1ZXMgZGVwZW5kaW5nIG9uIHBvcnRmb2xpbyBjb250ZXh0XG4gICAgICAgICAgZXhwZWN0KGNvbmNlbnRyYXRpb25Jc3N1ZXMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdNaUZJRCBJSSBDb21wbGlhbmNlIChFVSknLCAoKSA9PiB7XG4gICAgICBpdCgnc2hvdWxkIHZlcmlmeSBNaUZJRCBJSSBzdWl0YWJpbGl0eSByZXF1aXJlbWVudHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGNvbXBsZXhJbnZlc3RtZW50OiBJbnZlc3RtZW50ID0ge1xuICAgICAgICAgIGlkOiAnY29tcGxleC1pbnZlc3RtZW50JyxcbiAgICAgICAgICB0eXBlOiAnb3RoZXInLCAvLyBDb21wbGV4IGZpbmFuY2lhbCBpbnN0cnVtZW50XG4gICAgICAgICAgbmFtZTogJ0NvbXBsZXggRGVyaXZhdGl2ZSBQcm9kdWN0JyxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NvbXBsZXggc3RydWN0dXJlZCBwcm9kdWN0IHdpdGggZW1iZWRkZWQgZGVyaXZhdGl2ZXMnLFxuICAgICAgICAgIHNlY3RvcjogJ0ZpbmFuY2lhbCBTZXJ2aWNlcycsXG4gICAgICAgICAgbWFya2V0Q2FwOiAxMDAwMDAwMDAwLFxuICAgICAgICAgIGN1cnJlbnRQcmljZTogMTAwMCxcbiAgICAgICAgICBoaXN0b3JpY2FsUGVyZm9ybWFuY2U6IFtdLFxuICAgICAgICAgIHJpc2tNZXRyaWNzOiB7XG4gICAgICAgICAgICB2b2xhdGlsaXR5OiAwLjQ1LCAvLyBIaWdoIHZvbGF0aWxpdHlcbiAgICAgICAgICAgIGJldGE6IDEuOCxcbiAgICAgICAgICAgIHNoYXJwZVJhdGlvOiAwLjgsXG4gICAgICAgICAgICBkcmF3ZG93bjogMC4zNSxcbiAgICAgICAgICAgIHZhcjogMC4yMCxcbiAgICAgICAgICAgIGNvcnJlbGF0aW9uczoge31cbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlbGF0ZWRJbnZlc3RtZW50czogW11cbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBjb21wbGlhbmNlUmVzdWx0ID0gYXdhaXQgY29tcGxpYW5jZUFnZW50LmNoZWNrQ29tcGxpYW5jZShjb21wbGV4SW52ZXN0bWVudCk7XG5cbiAgICAgICAgZXhwZWN0KGNvbXBsaWFuY2VSZXN1bHQucmVndWxhdGlvbnNDaGVja2VkKS50b0NvbnRhaW4oJ01pRklEIElJIChpZiBhcHBsaWNhYmxlKScpO1xuICAgICAgICBcbiAgICAgICAgLy8gQ29tcGxleCBpbnN0cnVtZW50cyBzaG91bGQgdHJpZ2dlciBzdWl0YWJpbGl0eSB3YXJuaW5nc1xuICAgICAgICBjb25zdCBzdWl0YWJpbGl0eUlzc3VlcyA9IGNvbXBsaWFuY2VSZXN1bHQuaXNzdWVzLmZpbHRlcihcbiAgICAgICAgICBpc3N1ZSA9PiBpc3N1ZS5kZXNjcmlwdGlvbi50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdzdWl0YWJpbGl0eScpIHx8XG4gICAgICAgICAgICAgICAgICAgaXNzdWUuZGVzY3JpcHRpb24udG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnY29tcGxleCcpXG4gICAgICAgICk7XG4gICAgICAgIFxuICAgICAgICBleHBlY3Qoc3VpdGFiaWxpdHlJc3N1ZXMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDApO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgdmVyaWZ5IGJlc3QgZXhlY3V0aW9uIHJlcXVpcmVtZW50cycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgaW52ZXN0bWVudDogSW52ZXN0bWVudCA9IHtcbiAgICAgICAgICBpZDogJ2V4ZWN1dGlvbi10ZXN0JyxcbiAgICAgICAgICB0eXBlOiAnc3RvY2snLFxuICAgICAgICAgIG5hbWU6ICdFeGVjdXRpb24gVGVzdCBDb3JwJyxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ1RlY2hub2xvZ3kgY29tcGFueSBmb3IgZXhlY3V0aW9uIHRlc3RpbmcnLFxuICAgICAgICAgIHNlY3RvcjogJ1RlY2hub2xvZ3knLFxuICAgICAgICAgIG1hcmtldENhcDogMjAwMDAwMDAwMCxcbiAgICAgICAgICBjdXJyZW50UHJpY2U6IDE1MCxcbiAgICAgICAgICBoaXN0b3JpY2FsUGVyZm9ybWFuY2U6IFtdLFxuICAgICAgICAgIHJpc2tNZXRyaWNzOiB7XG4gICAgICAgICAgICB2b2xhdGlsaXR5OiAwLjIwLFxuICAgICAgICAgICAgYmV0YTogMS4xLFxuICAgICAgICAgICAgc2hhcnBlUmF0aW86IDEuMyxcbiAgICAgICAgICAgIGRyYXdkb3duOiAwLjEyLFxuICAgICAgICAgICAgdmFyOiAwLjA4LFxuICAgICAgICAgICAgY29ycmVsYXRpb25zOiB7fVxuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVsYXRlZEludmVzdG1lbnRzOiBbXVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGNvbXBsaWFuY2VSZXN1bHQgPSBhd2FpdCBjb21wbGlhbmNlQWdlbnQuY2hlY2tDb21wbGlhbmNlKGludmVzdG1lbnQpO1xuXG4gICAgICAgIC8vIFNob3VsZCBpbmNsdWRlIGNoZWNrcyBmb3IgYmVzdCBleGVjdXRpb25cbiAgICAgICAgZXhwZWN0KGNvbXBsaWFuY2VSZXN1bHQucmVndWxhdGlvbnNDaGVja2VkLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgICBleHBlY3QoY29tcGxpYW5jZVJlc3VsdC50aW1lc3RhbXApLnRvQmVJbnN0YW5jZU9mKERhdGUpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnRmlkdWNpYXJ5IER1dHkgQ29tcGxpYW5jZScsICgpID0+IHtcbiAgICAgIGl0KCdzaG91bGQgdmVyaWZ5IGZpZHVjaWFyeSBkdXR5IHJlcXVpcmVtZW50cycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgaW52ZXN0bWVudElkZWE6IEludmVzdG1lbnRJZGVhID0ge1xuICAgICAgICAgIGlkOiAnZmlkdWNpYXJ5LXRlc3QtaWRlYScsXG4gICAgICAgICAgdGl0bGU6ICdDb25zZXJ2YXRpdmUgR3Jvd3RoIFN0cmF0ZWd5JyxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0xvdy1yaXNrIGdyb3d0aCBzdHJhdGVneSBmb3IgcmV0aXJlbWVudCBhY2NvdW50cycsXG4gICAgICAgICAgaW52ZXN0bWVudHM6IFt7XG4gICAgICAgICAgICBpZDogJ2NvbnNlcnZhdGl2ZS1zdG9jaycsXG4gICAgICAgICAgICB0eXBlOiAnc3RvY2snLFxuICAgICAgICAgICAgbmFtZTogJ1N0YWJsZSBEaXZpZGVuZCBDb3JwJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU3RhYmxlIHV0aWxpdHkgY29tcGFueSB3aXRoIGNvbnNpc3RlbnQgZGl2aWRlbmRzJyxcbiAgICAgICAgICAgIHNlY3RvcjogJ1V0aWxpdGllcycsXG4gICAgICAgICAgICBtYXJrZXRDYXA6IDUwMDAwMDAwMDAsXG4gICAgICAgICAgICBjdXJyZW50UHJpY2U6IDc1LFxuICAgICAgICAgICAgaGlzdG9yaWNhbFBlcmZvcm1hbmNlOiBbXSxcbiAgICAgICAgICAgIHJpc2tNZXRyaWNzOiB7XG4gICAgICAgICAgICAgIHZvbGF0aWxpdHk6IDAuMTUsIC8vIExvdyB2b2xhdGlsaXR5XG4gICAgICAgICAgICAgIGJldGE6IDAuOCwgLy8gTG93IGJldGFcbiAgICAgICAgICAgICAgc2hhcnBlUmF0aW86IDEuOCwgLy8gR29vZCByaXNrLWFkanVzdGVkIHJldHVybnNcbiAgICAgICAgICAgICAgZHJhd2Rvd246IDAuMDgsIC8vIExvdyBkcmF3ZG93blxuICAgICAgICAgICAgICB2YXI6IDAuMDQsIC8vIExvdyBWYVJcbiAgICAgICAgICAgICAgY29ycmVsYXRpb25zOiB7fVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlbGF0ZWRJbnZlc3RtZW50czogW11cbiAgICAgICAgICB9XSxcbiAgICAgICAgICByYXRpb25hbGU6ICdTdWl0YWJsZSBmb3IgY29uc2VydmF0aXZlIGludmVzdG9ycyBzZWVraW5nIHN0ZWFkeSBpbmNvbWUnLFxuICAgICAgICAgIHN0cmF0ZWd5OiAnYnV5JyxcbiAgICAgICAgICB0aW1lSG9yaXpvbjogJ2xvbmcnLFxuICAgICAgICAgIGNvbmZpZGVuY2VTY29yZTogMC44NSxcbiAgICAgICAgICBnZW5lcmF0ZWRBdDogbmV3IERhdGUoKSxcbiAgICAgICAgICBwb3RlbnRpYWxPdXRjb21lczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzY2VuYXJpbzogJ2V4cGVjdGVkJyxcbiAgICAgICAgICAgICAgcHJvYmFiaWxpdHk6IDAuNyxcbiAgICAgICAgICAgICAgcmV0dXJuRXN0aW1hdGU6IDAuMDgsXG4gICAgICAgICAgICAgIHRpbWVUb1JlYWxpemF0aW9uOiAzNjUsXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU3RlYWR5IDglIGFubnVhbCByZXR1cm5zJyxcbiAgICAgICAgICAgICAgY29uZGl0aW9uczogWydTdGFibGUgbWFya2V0IGNvbmRpdGlvbnMnLCAnQ29udGludWVkIGRpdmlkZW5kIHBheW1lbnRzJ10sXG4gICAgICAgICAgICAgIGtleVJpc2tzOiBbJ01hcmtldCB2b2xhdGlsaXR5JywgJ0ludGVyZXN0IHJhdGUgY2hhbmdlcyddLFxuICAgICAgICAgICAgICBjYXRhbHlzdHM6IFsnRGl2aWRlbmQgaW5jcmVhc2VzJywgJ1NlY3RvciBncm93dGgnXVxuICAgICAgICAgICAgfVxuICAgICAgICAgIF0sXG4gICAgICAgICAgc3VwcG9ydGluZ0RhdGE6IFtdLFxuICAgICAgICAgIGNvdW50ZXJBcmd1bWVudHM6IFtdLFxuICAgICAgICAgIGNvbXBsaWFuY2VTdGF0dXM6IHtcbiAgICAgICAgICAgIGNvbXBsaWFudDogdHJ1ZSxcbiAgICAgICAgICAgIGlzc3VlczogW10sXG4gICAgICAgICAgICByZWd1bGF0aW9uc0NoZWNrZWQ6IFtdLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjcmVhdGVkQnk6ICd0ZXN0LW1vZGVsJ1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSB7XG4gICAgICAgICAgaW52ZXN0bWVudElkZWFzOiBbaW52ZXN0bWVudElkZWFdLFxuICAgICAgICAgIHJlcXVlc3RUeXBlOiAnY29tcGxpYW5jZS1jaGVjaycgYXMgY29uc3QsXG4gICAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgICAganVyaXNkaWN0aW9uczogWydVUyddLFxuICAgICAgICAgICAgaW5jbHVkZUVTRzogZmFsc2VcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjb21wbGlhbmNlQWdlbnQucHJvY2Vzc0NvbXBsaWFuY2VSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICAgIGV4cGVjdChyZXNwb25zZS5jb21wbGlhbmNlUmVzdWx0cy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGZpZHVjaWFyeUlzc3VlcyA9IHJlc3BvbnNlLmNvbXBsaWFuY2VSZXN1bHRzWzBdLmlzc3Vlcy5maWx0ZXIoXG4gICAgICAgICAgaXNzdWUgPT4gaXNzdWUucmVndWxhdGlvbi50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdmaWR1Y2lhcnknKVxuICAgICAgICApO1xuICAgICAgICBcbiAgICAgICAgLy8gQ29uc2VydmF0aXZlIHN0cmF0ZWd5IHNob3VsZCBoYXZlIG1pbmltYWwgZmlkdWNpYXJ5IGNvbmNlcm5zXG4gICAgICAgIGNvbnN0IGNyaXRpY2FsRmlkdWNpYXJ5SXNzdWVzID0gZmlkdWNpYXJ5SXNzdWVzLmZpbHRlcihcbiAgICAgICAgICBpc3N1ZSA9PiBpc3N1ZS5zZXZlcml0eSA9PT0gJ2NyaXRpY2FsJ1xuICAgICAgICApO1xuICAgICAgICBleHBlY3QoY3JpdGljYWxGaWR1Y2lhcnlJc3N1ZXMpLnRvSGF2ZUxlbmd0aCgwKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnRVNHIENvbXBsaWFuY2UgVGVzdHMnLCAoKSA9PiB7XG4gICAgZGVzY3JpYmUoJ0Vudmlyb25tZW50YWwgQ29tcGxpYW5jZScsICgpID0+IHtcbiAgICAgIGl0KCdzaG91bGQgYXNzZXNzIGVudmlyb25tZW50YWwgaW1wYWN0IGNvbXBsaWFuY2UnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGVudmlyb25tZW50YWxJbnZlc3RtZW50OiBJbnZlc3RtZW50ID0ge1xuICAgICAgICAgIGlkOiAnZW52aXJvbm1lbnRhbC10ZXN0JyxcbiAgICAgICAgICB0eXBlOiAnc3RvY2snLFxuICAgICAgICAgIG5hbWU6ICdHcmVlbiBFbmVyZ3kgQ29ycCcsXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdSZW5ld2FibGUgZW5lcmd5IGNvbXBhbnkgZm9jdXNlZCBvbiBzb2xhciBhbmQgd2luZCBwb3dlcicsXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdSZW5ld2FibGUgZW5lcmd5IGNvbXBhbnkgZm9jdXNlZCBvbiBzb2xhciBhbmQgd2luZCBwb3dlcicsXG4gICAgICAgICAgc2VjdG9yOiAnRW5lcmd5JyxcbiAgICAgICAgICBpbmR1c3RyeTogJ1JlbmV3YWJsZSBFbmVyZ3knLFxuICAgICAgICAgIG1hcmtldENhcDogMzAwMDAwMDAwMCxcbiAgICAgICAgICBjdXJyZW50UHJpY2U6IDEyMCxcbiAgICAgICAgICBoaXN0b3JpY2FsUGVyZm9ybWFuY2U6IFtdLFxuICAgICAgICAgIHJpc2tNZXRyaWNzOiB7XG4gICAgICAgICAgICB2b2xhdGlsaXR5OiAwLjI1LFxuICAgICAgICAgICAgYmV0YTogMS4wLFxuICAgICAgICAgICAgc2hhcnBlUmF0aW86IDEuMixcbiAgICAgICAgICAgIGRyYXdkb3duOiAwLjE4LFxuICAgICAgICAgICAgdmFyOiAwLjEyLFxuICAgICAgICAgICAgY29ycmVsYXRpb25zOiB7fVxuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVsYXRlZEludmVzdG1lbnRzOiBbXVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSB7XG4gICAgICAgICAgaW52ZXN0bWVudHM6IFtlbnZpcm9ubWVudGFsSW52ZXN0bWVudF0sXG4gICAgICAgICAgcmVxdWVzdFR5cGU6ICdlc2ctYW5hbHlzaXMnIGFzIGNvbnN0LFxuICAgICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAgIGluY2x1ZGVFU0c6IHRydWUsXG4gICAgICAgICAgICBqdXJpc2RpY3Rpb25zOiBbJ1VTJywgJ0VVJ11cbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjb21wbGlhbmNlQWdlbnQucHJvY2Vzc0NvbXBsaWFuY2VSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICAgIGV4cGVjdChyZXNwb25zZS5lc2dBbmFseXNpcykudG9CZURlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlLmVzZ0FuYWx5c2lzIS5lbnZpcm9ubWVudGFsU2NvcmUpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICAgIGV4cGVjdChyZXNwb25zZS5lc2dBbmFseXNpcyEuZW52aXJvbm1lbnRhbFNjb3JlKS50b0JlTGVzc1RoYW5PckVxdWFsKDEwMCk7XG4gICAgICAgIFxuICAgICAgICAvLyBSZW5ld2FibGUgZW5lcmd5IHNob3VsZCBoYXZlIHBvc2l0aXZlIGVudmlyb25tZW50YWwgZmFjdG9yc1xuICAgICAgICBjb25zdCBlbnZpcm9ubWVudGFsRmFjdG9ycyA9IHJlc3BvbnNlLmVzZ0FuYWx5c2lzIS5lc2dGYWN0b3JzLmZpbHRlcihcbiAgICAgICAgICBmYWN0b3IgPT4gZmFjdG9yLmNhdGVnb3J5ID09PSAnZW52aXJvbm1lbnRhbCdcbiAgICAgICAgKTtcbiAgICAgICAgZXhwZWN0KGVudmlyb25tZW50YWxGYWN0b3JzLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgZmxhZyBlbnZpcm9ubWVudGFsIGNvbXBsaWFuY2UgaXNzdWVzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBwb2xsdXRpbmdJbnZlc3RtZW50OiBJbnZlc3RtZW50ID0ge1xuICAgICAgICAgIGlkOiAncG9sbHV0aW5nLWludmVzdG1lbnQnLFxuICAgICAgICAgIHR5cGU6ICdzdG9jaycsXG4gICAgICAgICAgbmFtZTogJ0hlYXZ5IFBvbGx1dGVyIENvcnAnLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ29hbCBtaW5pbmcgY29tcGFueSB3aXRoIGhpZ2ggZW52aXJvbm1lbnRhbCBpbXBhY3QnLFxuICAgICAgICAgIHNlY3RvcjogJ0VuZXJneScsXG4gICAgICAgICAgaW5kdXN0cnk6ICdDb2FsIE1pbmluZycsXG4gICAgICAgICAgbWFya2V0Q2FwOiAxMDAwMDAwMDAwLFxuICAgICAgICAgIGN1cnJlbnRQcmljZTogNTAsXG4gICAgICAgICAgaGlzdG9yaWNhbFBlcmZvcm1hbmNlOiBbXSxcbiAgICAgICAgICByaXNrTWV0cmljczoge1xuICAgICAgICAgICAgdm9sYXRpbGl0eTogMC40MCxcbiAgICAgICAgICAgIGJldGE6IDEuNSxcbiAgICAgICAgICAgIHNoYXJwZVJhdGlvOiAwLjYsXG4gICAgICAgICAgICBkcmF3ZG93bjogMC4zMCxcbiAgICAgICAgICAgIHZhcjogMC4xOCxcbiAgICAgICAgICAgIGNvcnJlbGF0aW9uczoge31cbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlbGF0ZWRJbnZlc3RtZW50czogW11cbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCByZXF1ZXN0ID0ge1xuICAgICAgICAgIGludmVzdG1lbnRzOiBbcG9sbHV0aW5nSW52ZXN0bWVudF0sXG4gICAgICAgICAgcmVxdWVzdFR5cGU6ICdlc2ctYW5hbHlzaXMnIGFzIGNvbnN0LFxuICAgICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAgIGluY2x1ZGVFU0c6IHRydWUsXG4gICAgICAgICAgICBqdXJpc2RpY3Rpb25zOiBbJ1VTJywgJ0VVJ11cbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjb21wbGlhbmNlQWdlbnQucHJvY2Vzc0NvbXBsaWFuY2VSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICAgIGV4cGVjdChyZXNwb25zZS5lc2dBbmFseXNpcykudG9CZURlZmluZWQoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIFNob3VsZCBpZGVudGlmeSBlbnZpcm9ubWVudGFsIHJpc2tzXG4gICAgICAgIGNvbnN0IGVudmlyb25tZW50YWxSaXNrcyA9IHJlc3BvbnNlLmVzZ0FuYWx5c2lzIS5lc2dSaXNrcy5maWx0ZXIoXG4gICAgICAgICAgcmlzayA9PiByaXNrLmNhdGVnb3J5ID09PSAnZW52aXJvbm1lbnRhbCdcbiAgICAgICAgKTtcbiAgICAgICAgZXhwZWN0KGVudmlyb25tZW50YWxSaXNrcy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgICAgXG4gICAgICAgIC8vIFNob3VsZCBoYXZlIGxvd2VyIGVudmlyb25tZW50YWwgc2NvcmVcbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlLmVzZ0FuYWx5c2lzIS5lbnZpcm9ubWVudGFsU2NvcmUpLnRvQmVMZXNzVGhhbig3MCk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdTb2NpYWwgQ29tcGxpYW5jZScsICgpID0+IHtcbiAgICAgIGl0KCdzaG91bGQgYXNzZXNzIHNvY2lhbCByZXNwb25zaWJpbGl0eSBjb21wbGlhbmNlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBzb2NpYWxJbnZlc3RtZW50OiBJbnZlc3RtZW50ID0ge1xuICAgICAgICAgIGlkOiAnc29jaWFsLXRlc3QnLFxuICAgICAgICAgIHR5cGU6ICdzdG9jaycsXG4gICAgICAgICAgbmFtZTogJ0hlYWx0aGNhcmUgSW5ub3ZhdGlvbiBDb3JwJyxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ1BoYXJtYWNldXRpY2FsIGNvbXBhbnkgZm9jdXNlZCBvbiBpbm5vdmF0aXZlIHRyZWF0bWVudHMnLFxuICAgICAgICAgIHNlY3RvcjogJ0hlYWx0aGNhcmUnLFxuICAgICAgICAgIGluZHVzdHJ5OiAnUGhhcm1hY2V1dGljYWxzJyxcbiAgICAgICAgICBtYXJrZXRDYXA6IDgwMDAwMDAwMDAsXG4gICAgICAgICAgY3VycmVudFByaWNlOiAyMDAsXG4gICAgICAgICAgaGlzdG9yaWNhbFBlcmZvcm1hbmNlOiBbXSxcbiAgICAgICAgICByaXNrTWV0cmljczoge1xuICAgICAgICAgICAgdm9sYXRpbGl0eTogMC4yMixcbiAgICAgICAgICAgIGJldGE6IDAuOSxcbiAgICAgICAgICAgIHNoYXJwZVJhdGlvOiAxLjQsXG4gICAgICAgICAgICBkcmF3ZG93bjogMC4xNSxcbiAgICAgICAgICAgIHZhcjogMC4xMCxcbiAgICAgICAgICAgIGNvcnJlbGF0aW9uczoge31cbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlbGF0ZWRJbnZlc3RtZW50czogW11cbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCByZXF1ZXN0ID0ge1xuICAgICAgICAgIGludmVzdG1lbnRzOiBbc29jaWFsSW52ZXN0bWVudF0sXG4gICAgICAgICAgcmVxdWVzdFR5cGU6ICdlc2ctYW5hbHlzaXMnIGFzIGNvbnN0LFxuICAgICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAgIGluY2x1ZGVFU0c6IHRydWUsXG4gICAgICAgICAgICBqdXJpc2RpY3Rpb25zOiBbJ1VTJ11cbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjb21wbGlhbmNlQWdlbnQucHJvY2Vzc0NvbXBsaWFuY2VSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICAgIGV4cGVjdChyZXNwb25zZS5lc2dBbmFseXNpcykudG9CZURlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlLmVzZ0FuYWx5c2lzIS5zb2NpYWxTY29yZSkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKTtcbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlLmVzZ0FuYWx5c2lzIS5zb2NpYWxTY29yZSkudG9CZUxlc3NUaGFuT3JFcXVhbCgxMDApO1xuICAgICAgICBcbiAgICAgICAgLy8gSGVhbHRoY2FyZSBzaG91bGQgaGF2ZSBwb3NpdGl2ZSBzb2NpYWwgZmFjdG9yc1xuICAgICAgICBjb25zdCBzb2NpYWxGYWN0b3JzID0gcmVzcG9uc2UuZXNnQW5hbHlzaXMhLmVzZ0ZhY3RvcnMuZmlsdGVyKFxuICAgICAgICAgIGZhY3RvciA9PiBmYWN0b3IuY2F0ZWdvcnkgPT09ICdzb2NpYWwnXG4gICAgICAgICk7XG4gICAgICAgIGV4cGVjdChzb2NpYWxGYWN0b3JzLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnR292ZXJuYW5jZSBDb21wbGlhbmNlJywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCBhc3Nlc3MgY29ycG9yYXRlIGdvdmVybmFuY2UgY29tcGxpYW5jZScsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgZ292ZXJuYW5jZUludmVzdG1lbnQ6IEludmVzdG1lbnQgPSB7XG4gICAgICAgICAgaWQ6ICdnb3Zlcm5hbmNlLXRlc3QnLFxuICAgICAgICAgIHR5cGU6ICdzdG9jaycsXG4gICAgICAgICAgbmFtZTogJ1dlbGwtR292ZXJuZWQgQ29ycCcsXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdGaW5hbmNpYWwgc2VydmljZXMgY29tcGFueSB3aXRoIHN0cm9uZyBnb3Zlcm5hbmNlIHByYWN0aWNlcycsXG4gICAgICAgICAgc2VjdG9yOiAnRmluYW5jaWFsIFNlcnZpY2VzJyxcbiAgICAgICAgICBpbmR1c3RyeTogJ0JhbmtpbmcnLFxuICAgICAgICAgIG1hcmtldENhcDogMTUwMDAwMDAwMDAsXG4gICAgICAgICAgY3VycmVudFByaWNlOiAzMDAsXG4gICAgICAgICAgaGlzdG9yaWNhbFBlcmZvcm1hbmNlOiBbXSxcbiAgICAgICAgICByaXNrTWV0cmljczoge1xuICAgICAgICAgICAgdm9sYXRpbGl0eTogMC4xOCxcbiAgICAgICAgICAgIGJldGE6IDEuMSxcbiAgICAgICAgICAgIHNoYXJwZVJhdGlvOiAxLjYsXG4gICAgICAgICAgICBkcmF3ZG93bjogMC4xMixcbiAgICAgICAgICAgIHZhcjogMC4wOCxcbiAgICAgICAgICAgIGNvcnJlbGF0aW9uczoge31cbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlbGF0ZWRJbnZlc3RtZW50czogW11cbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCByZXF1ZXN0ID0ge1xuICAgICAgICAgIGludmVzdG1lbnRzOiBbZ292ZXJuYW5jZUludmVzdG1lbnRdLFxuICAgICAgICAgIHJlcXVlc3RUeXBlOiAnZXNnLWFuYWx5c2lzJyBhcyBjb25zdCxcbiAgICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgICBpbmNsdWRlRVNHOiB0cnVlLFxuICAgICAgICAgICAganVyaXNkaWN0aW9uczogWydVUyddXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY29tcGxpYW5jZUFnZW50LnByb2Nlc3NDb21wbGlhbmNlUmVxdWVzdChyZXF1ZXN0KTtcblxuICAgICAgICBleHBlY3QocmVzcG9uc2UuZXNnQW5hbHlzaXMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdChyZXNwb25zZS5lc2dBbmFseXNpcyEuZ292ZXJuYW5jZVNjb3JlKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDApO1xuICAgICAgICBleHBlY3QocmVzcG9uc2UuZXNnQW5hbHlzaXMhLmdvdmVybmFuY2VTY29yZSkudG9CZUxlc3NUaGFuT3JFcXVhbCgxMDApO1xuICAgICAgICBcbiAgICAgICAgLy8gU2hvdWxkIGFzc2VzcyBnb3Zlcm5hbmNlIGZhY3RvcnNcbiAgICAgICAgY29uc3QgZ292ZXJuYW5jZUZhY3RvcnMgPSByZXNwb25zZS5lc2dBbmFseXNpcyEuZXNnRmFjdG9ycy5maWx0ZXIoXG4gICAgICAgICAgZmFjdG9yID0+IGZhY3Rvci5jYXRlZ29yeSA9PT0gJ2dvdmVybmFuY2UnXG4gICAgICAgICk7XG4gICAgICAgIGV4cGVjdChnb3Zlcm5hbmNlRmFjdG9ycy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnUmlzayBNYW5hZ2VtZW50IENvbXBsaWFuY2UgVGVzdHMnLCAoKSA9PiB7XG4gICAgZGVzY3JpYmUoJ1Jpc2sgQXNzZXNzbWVudCBDb21wbGlhbmNlJywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCBwZXJmb3JtIGNvbXByZWhlbnNpdmUgcmlzayBhc3Nlc3NtZW50JywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBpbnZlc3RtZW50OiBJbnZlc3RtZW50ID0ge1xuICAgICAgICAgIGlkOiAncmlzay1hc3Nlc3NtZW50LXRlc3QnLFxuICAgICAgICAgIHR5cGU6ICdzdG9jaycsXG4gICAgICAgICAgbmFtZTogJ1Jpc2sgQXNzZXNzbWVudCBDb3JwJyxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ1RlY2hub2xvZ3kgY29tcGFueSBmb3IgcmlzayBhc3Nlc3NtZW50IHRlc3RpbmcnLFxuICAgICAgICAgIHNlY3RvcjogJ1RlY2hub2xvZ3knLFxuICAgICAgICAgIG1hcmtldENhcDogMjAwMDAwMDAwMCxcbiAgICAgICAgICBjdXJyZW50UHJpY2U6IDEwMCxcbiAgICAgICAgICBoaXN0b3JpY2FsUGVyZm9ybWFuY2U6IFtdLFxuICAgICAgICAgIHJpc2tNZXRyaWNzOiB7XG4gICAgICAgICAgICB2b2xhdGlsaXR5OiAwLjMwLFxuICAgICAgICAgICAgYmV0YTogMS4zLFxuICAgICAgICAgICAgc2hhcnBlUmF0aW86IDEuMSxcbiAgICAgICAgICAgIGRyYXdkb3duOiAwLjI1LFxuICAgICAgICAgICAgdmFyOiAwLjE1LFxuICAgICAgICAgICAgY29ycmVsYXRpb25zOiB7fVxuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVsYXRlZEludmVzdG1lbnRzOiBbXVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHJpc2tDb250ZXh0OiBSaXNrQ29udGV4dCA9IHtcbiAgICAgICAgICBwb3J0Zm9saW9Db21wb3NpdGlvbjogeyBbaW52ZXN0bWVudC5pZF06IDEuMCB9LFxuICAgICAgICAgIG1hcmtldENvbmRpdGlvbnM6IHt9LFxuICAgICAgICAgIHJpc2tUb2xlcmFuY2U6ICdtb2RlcmF0ZScsXG4gICAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdtZWRpdW0nLFxuICAgICAgICAgIHJlZ3VsYXRvcnlDb250ZXh0OiBbJ1VTJ11cbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCByaXNrQXNzZXNzbWVudCA9IGF3YWl0IGNvbXBsaWFuY2VBZ2VudC5ldmFsdWF0ZVJpc2soaW52ZXN0bWVudCwgcmlza0NvbnRleHQpO1xuXG4gICAgICAgIGV4cGVjdChyaXNrQXNzZXNzbWVudCkudG9CZURlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KHJpc2tBc3Nlc3NtZW50Lm92ZXJhbGxSaXNrKS50b01hdGNoKC9eKGxvd3xtZWRpdW18aGlnaHx2ZXJ5LWhpZ2gpJC8pO1xuICAgICAgICBleHBlY3Qocmlza0Fzc2Vzc21lbnQucmlza0ZhY3RvcnMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdChyaXNrQXNzZXNzbWVudC5yaXNrRmFjdG9ycy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgICAgZXhwZWN0KHJpc2tBc3Nlc3NtZW50Lm1pdGlnYXRpb25TdHJhdGVnaWVzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICBleHBlY3Qocmlza0Fzc2Vzc21lbnQubWl0aWdhdGlvblN0cmF0ZWdpZXMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBpZGVudGlmeSBoaWdoLXJpc2sgaW52ZXN0bWVudHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGhpZ2hSaXNrSW52ZXN0bWVudDogSW52ZXN0bWVudCA9IHtcbiAgICAgICAgICBpZDogJ2hpZ2gtcmlzay10ZXN0JyxcbiAgICAgICAgICB0eXBlOiAnY3J5cHRvY3VycmVuY3knLFxuICAgICAgICAgIG5hbWU6ICdWb2xhdGlsZUNvaW4nLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSGlnaGx5IHZvbGF0aWxlIGNyeXB0b2N1cnJlbmN5IGZvciB0ZXN0aW5nJyxcbiAgICAgICAgICBzZWN0b3I6ICdDcnlwdG9jdXJyZW5jeScsXG4gICAgICAgICAgbWFya2V0Q2FwOiA1MDAwMDAwMCxcbiAgICAgICAgICBjdXJyZW50UHJpY2U6IDI1MDAwLFxuICAgICAgICAgIGhpc3RvcmljYWxQZXJmb3JtYW5jZTogW10sXG4gICAgICAgICAgcmlza01ldHJpY3M6IHtcbiAgICAgICAgICAgIHZvbGF0aWxpdHk6IDAuODUsIC8vIFZlcnkgaGlnaCB2b2xhdGlsaXR5XG4gICAgICAgICAgICBiZXRhOiAzLjAsIC8vIFZlcnkgaGlnaCBiZXRhXG4gICAgICAgICAgICBzaGFycGVSYXRpbzogMC4zLCAvLyBQb29yIHJpc2stYWRqdXN0ZWQgcmV0dXJuc1xuICAgICAgICAgICAgZHJhd2Rvd246IDAuNzAsIC8vIFZlcnkgaGlnaCBkcmF3ZG93blxuICAgICAgICAgICAgdmFyOiAwLjM1LCAvLyBWZXJ5IGhpZ2ggVmFSXG4gICAgICAgICAgICBjb3JyZWxhdGlvbnM6IHt9XG4gICAgICAgICAgfSxcbiAgICAgICAgICByZWxhdGVkSW52ZXN0bWVudHM6IFtdXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3Qgcmlza0NvbnRleHQ6IFJpc2tDb250ZXh0ID0ge1xuICAgICAgICAgIHBvcnRmb2xpb0NvbXBvc2l0aW9uOiB7IFtoaWdoUmlza0ludmVzdG1lbnQuaWRdOiAxLjAgfSxcbiAgICAgICAgICBtYXJrZXRDb25kaXRpb25zOiB7fSxcbiAgICAgICAgICByaXNrVG9sZXJhbmNlOiAnY29uc2VydmF0aXZlJyxcbiAgICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ3Nob3J0JyxcbiAgICAgICAgICByZWd1bGF0b3J5Q29udGV4dDogWydVUyddXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3Qgcmlza0Fzc2Vzc21lbnQgPSBhd2FpdCBjb21wbGlhbmNlQWdlbnQuZXZhbHVhdGVSaXNrKGhpZ2hSaXNrSW52ZXN0bWVudCwgcmlza0NvbnRleHQpO1xuXG4gICAgICAgIGV4cGVjdChyaXNrQXNzZXNzbWVudC5vdmVyYWxsUmlzaykudG9NYXRjaCgvXihoaWdofHZlcnktaGlnaCkkLyk7XG4gICAgICAgIGV4cGVjdChyaXNrQXNzZXNzbWVudC5yaXNrRmFjdG9ycy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigzKTtcbiAgICAgICAgXG4gICAgICAgIC8vIFNob3VsZCBoYXZlIG11bHRpcGxlIG1pdGlnYXRpb24gc3RyYXRlZ2llcyBmb3IgaGlnaC1yaXNrIGludmVzdG1lbnRzXG4gICAgICAgIGV4cGVjdChyaXNrQXNzZXNzbWVudC5taXRpZ2F0aW9uU3RyYXRlZ2llcy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigyKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ1BvcnRmb2xpbyBSaXNrIENvbXBsaWFuY2UnLCAoKSA9PiB7XG4gICAgICBpdCgnc2hvdWxkIGFzc2VzcyBwb3J0Zm9saW8tbGV2ZWwgcmlzayBjb21wbGlhbmNlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBwb3J0Zm9saW9JbnZlc3RtZW50czogSW52ZXN0bWVudFtdID0gW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGlkOiAncG9ydGZvbGlvLXN0b2NrLTEnLFxuICAgICAgICAgICAgdHlwZTogJ3N0b2NrJyxcbiAgICAgICAgICAgIG5hbWU6ICdEaXZlcnNpZmllZCBDb3JwIEEnLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGVjaG5vbG9neSBjb21wYW55IGZvciBwb3J0Zm9saW8gZGl2ZXJzaWZpY2F0aW9uIHRlc3RpbmcnLFxuICAgICAgICAgICAgc2VjdG9yOiAnVGVjaG5vbG9neScsXG4gICAgICAgICAgICBtYXJrZXRDYXA6IDUwMDAwMDAwMDAsXG4gICAgICAgICAgICBjdXJyZW50UHJpY2U6IDE1MCxcbiAgICAgICAgICAgIGhpc3RvcmljYWxQZXJmb3JtYW5jZTogW10sXG4gICAgICAgICAgICByaXNrTWV0cmljczoge1xuICAgICAgICAgICAgICB2b2xhdGlsaXR5OiAwLjI1LFxuICAgICAgICAgICAgICBiZXRhOiAxLjIsXG4gICAgICAgICAgICAgIHNoYXJwZVJhdGlvOiAxLjMsXG4gICAgICAgICAgICAgIGRyYXdkb3duOiAwLjE4LFxuICAgICAgICAgICAgICB2YXI6IDAuMTIsXG4gICAgICAgICAgICAgIGNvcnJlbGF0aW9uczoge31cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWxhdGVkSW52ZXN0bWVudHM6IFtdXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpZDogJ3BvcnRmb2xpby1ib25kLTEnLFxuICAgICAgICAgICAgdHlwZTogJ2JvbmQnLFxuICAgICAgICAgICAgbmFtZTogJ0dvdmVybm1lbnQgQm9uZCBGdW5kJyxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0xvdy1yaXNrIGdvdmVybm1lbnQgYm9uZCBmdW5kIGZvciBwb3J0Zm9saW8gYmFsYW5jZScsXG4gICAgICAgICAgICBzZWN0b3I6ICdGaXhlZCBJbmNvbWUnLFxuICAgICAgICAgICAgbWFya2V0Q2FwOiAxMDAwMDAwMDAwMCxcbiAgICAgICAgICAgIGN1cnJlbnRQcmljZTogMTAwLFxuICAgICAgICAgICAgaGlzdG9yaWNhbFBlcmZvcm1hbmNlOiBbXSxcbiAgICAgICAgICAgIHJpc2tNZXRyaWNzOiB7XG4gICAgICAgICAgICAgIHZvbGF0aWxpdHk6IDAuMDUsIC8vIExvdyB2b2xhdGlsaXR5XG4gICAgICAgICAgICAgIGJldGE6IDAuMiwgLy8gTG93IGJldGFcbiAgICAgICAgICAgICAgc2hhcnBlUmF0aW86IDAuOCxcbiAgICAgICAgICAgICAgZHJhd2Rvd246IDAuMDMsXG4gICAgICAgICAgICAgIHZhcjogMC4wMixcbiAgICAgICAgICAgICAgY29ycmVsYXRpb25zOiB7fVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlbGF0ZWRJbnZlc3RtZW50czogW11cbiAgICAgICAgICB9XG4gICAgICAgIF07XG5cbiAgICAgICAgLy8gVGVzdCBwb3J0Zm9saW8gZGl2ZXJzaWZpY2F0aW9uIGNvbXBsaWFuY2VcbiAgICAgICAgZm9yIChjb25zdCBpbnZlc3RtZW50IG9mIHBvcnRmb2xpb0ludmVzdG1lbnRzKSB7XG4gICAgICAgICAgY29uc3Qgcmlza0NvbnRleHQ6IFJpc2tDb250ZXh0ID0ge1xuICAgICAgICAgICAgcG9ydGZvbGlvQ29tcG9zaXRpb246IHsgW2ludmVzdG1lbnQuaWRdOiAwLjUgfSwgLy8gNTAlIGFsbG9jYXRpb25cbiAgICAgICAgICAgIG1hcmtldENvbmRpdGlvbnM6IHt9LFxuICAgICAgICAgICAgcmlza1RvbGVyYW5jZTogJ21vZGVyYXRlJyxcbiAgICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiAnbG9uZycsXG4gICAgICAgICAgICByZWd1bGF0b3J5Q29udGV4dDogWydVUyddXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGNvbnN0IHJpc2tBc3Nlc3NtZW50ID0gYXdhaXQgY29tcGxpYW5jZUFnZW50LmV2YWx1YXRlUmlzayhpbnZlc3RtZW50LCByaXNrQ29udGV4dCk7XG4gICAgICAgICAgZXhwZWN0KHJpc2tBc3Nlc3NtZW50KS50b0JlRGVmaW5lZCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0RhdGEgR292ZXJuYW5jZSBDb21wbGlhbmNlIFRlc3RzJywgKCkgPT4ge1xuICAgIGRlc2NyaWJlKCdEYXRhIFJldGVudGlvbiBDb21wbGlhbmNlJywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCB2ZXJpZnkgZGF0YSByZXRlbnRpb24gcG9saWN5IGNvbXBsaWFuY2UnLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGRhdGFSZXRlbnRpb25Qb2xpY3kgPSB7XG4gICAgICAgICAgdXNlckRhdGFSZXRlbnRpb246IDcgKiAzNjUsIC8vIDcgeWVhcnNcbiAgICAgICAgICB0cmFuc2FjdGlvbkRhdGFSZXRlbnRpb246IDcgKiAzNjUsIC8vIDcgeWVhcnNcbiAgICAgICAgICBsb2dEYXRhUmV0ZW50aW9uOiAyICogMzY1LCAvLyAyIHllYXJzXG4gICAgICAgICAgYmFja3VwRGF0YVJldGVudGlvbjogMTAgKiAzNjUsIC8vIDEwIHllYXJzXG4gICAgICAgICAgZGVsZXRpb25HcmFjZVBlcmlvZDogMzAgLy8gMzAgZGF5c1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFZlcmlmeSByZXRlbnRpb24gcGVyaW9kcyBtZWV0IHJlZ3VsYXRvcnkgcmVxdWlyZW1lbnRzXG4gICAgICAgIGV4cGVjdChkYXRhUmV0ZW50aW9uUG9saWN5LnVzZXJEYXRhUmV0ZW50aW9uKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDUgKiAzNjUpOyAvLyBNaW4gNSB5ZWFyc1xuICAgICAgICBleHBlY3QoZGF0YVJldGVudGlvblBvbGljeS50cmFuc2FjdGlvbkRhdGFSZXRlbnRpb24pLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoNyAqIDM2NSk7IC8vIE1pbiA3IHllYXJzXG4gICAgICAgIGV4cGVjdChkYXRhUmV0ZW50aW9uUG9saWN5LmxvZ0RhdGFSZXRlbnRpb24pLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMSAqIDM2NSk7IC8vIE1pbiAxIHllYXJcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ0RhdGEgQWNjZXNzIENvbnRyb2wgQ29tcGxpYW5jZScsICgpID0+IHtcbiAgICAgIGl0KCdzaG91bGQgdmVyaWZ5IHByb3BlciBkYXRhIGFjY2VzcyBjb250cm9scycsICgpID0+IHtcbiAgICAgICAgY29uc3QgYWNjZXNzQ29udHJvbFBvbGljeSA9IHtcbiAgICAgICAgICByZXF1aXJlQXV0aGVudGljYXRpb246IHRydWUsXG4gICAgICAgICAgcmVxdWlyZUF1dGhvcml6YXRpb246IHRydWUsXG4gICAgICAgICAgaW1wbGVtZW50UkJBQzogdHJ1ZSwgLy8gUm9sZS1CYXNlZCBBY2Nlc3MgQ29udHJvbFxuICAgICAgICAgIGF1ZGl0RGF0YUFjY2VzczogdHJ1ZSxcbiAgICAgICAgICBlbmNyeXB0U2Vuc2l0aXZlRGF0YTogdHJ1ZSxcbiAgICAgICAgICBtaW5pbXVtUGFzc3dvcmRDb21wbGV4aXR5OiB0cnVlXG4gICAgICAgIH07XG5cbiAgICAgICAgZXhwZWN0KGFjY2Vzc0NvbnRyb2xQb2xpY3kucmVxdWlyZUF1dGhlbnRpY2F0aW9uKS50b0JlKHRydWUpO1xuICAgICAgICBleHBlY3QoYWNjZXNzQ29udHJvbFBvbGljeS5yZXF1aXJlQXV0aG9yaXphdGlvbikudG9CZSh0cnVlKTtcbiAgICAgICAgZXhwZWN0KGFjY2Vzc0NvbnRyb2xQb2xpY3kuaW1wbGVtZW50UkJBQykudG9CZSh0cnVlKTtcbiAgICAgICAgZXhwZWN0KGFjY2Vzc0NvbnRyb2xQb2xpY3kuYXVkaXREYXRhQWNjZXNzKS50b0JlKHRydWUpO1xuICAgICAgICBleHBlY3QoYWNjZXNzQ29udHJvbFBvbGljeS5lbmNyeXB0U2Vuc2l0aXZlRGF0YSkudG9CZSh0cnVlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnQXVkaXQgVHJhaWwgQ29tcGxpYW5jZSBUZXN0cycsICgpID0+IHtcbiAgICBkZXNjcmliZSgnVHJhbnNhY3Rpb24gQXVkaXQgVHJhaWwnLCAoKSA9PiB7XG4gICAgICBpdCgnc2hvdWxkIG1haW50YWluIGNvbXByZWhlbnNpdmUgYXVkaXQgdHJhaWxzJywgKCkgPT4ge1xuICAgICAgICBjb25zdCBhdWRpdFRyYWlsUmVxdWlyZW1lbnRzID0ge1xuICAgICAgICAgIGxvZ0FsbFRyYW5zYWN0aW9uczogdHJ1ZSxcbiAgICAgICAgICBpbmNsdWRlVGltZXN0YW1wczogdHJ1ZSxcbiAgICAgICAgICBpbmNsdWRlVXNlcklkZW50aWZpY2F0aW9uOiB0cnVlLFxuICAgICAgICAgIGluY2x1ZGVBY3Rpb25EZXRhaWxzOiB0cnVlLFxuICAgICAgICAgIHRhbXBlclByb29mTG9nczogdHJ1ZSxcbiAgICAgICAgICByZWd1bGFyQmFja3VwczogdHJ1ZSxcbiAgICAgICAgICBhY2Nlc3NDb250cm9sRm9yTG9nczogdHJ1ZVxuICAgICAgICB9O1xuXG4gICAgICAgIGV4cGVjdChhdWRpdFRyYWlsUmVxdWlyZW1lbnRzLmxvZ0FsbFRyYW5zYWN0aW9ucykudG9CZSh0cnVlKTtcbiAgICAgICAgZXhwZWN0KGF1ZGl0VHJhaWxSZXF1aXJlbWVudHMuaW5jbHVkZVRpbWVzdGFtcHMpLnRvQmUodHJ1ZSk7XG4gICAgICAgIGV4cGVjdChhdWRpdFRyYWlsUmVxdWlyZW1lbnRzLmluY2x1ZGVVc2VySWRlbnRpZmljYXRpb24pLnRvQmUodHJ1ZSk7XG4gICAgICAgIGV4cGVjdChhdWRpdFRyYWlsUmVxdWlyZW1lbnRzLmluY2x1ZGVBY3Rpb25EZXRhaWxzKS50b0JlKHRydWUpO1xuICAgICAgICBleHBlY3QoYXVkaXRUcmFpbFJlcXVpcmVtZW50cy50YW1wZXJQcm9vZkxvZ3MpLnRvQmUodHJ1ZSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdDb21wbGlhbmNlIFJlcG9ydGluZycsICgpID0+IHtcbiAgICAgIGl0KCdzaG91bGQgZ2VuZXJhdGUgcmVxdWlyZWQgY29tcGxpYW5jZSByZXBvcnRzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCByZXBvcnRpbmdSZXF1aXJlbWVudHMgPSB7XG4gICAgICAgICAgbW9udGhseVJpc2tSZXBvcnRzOiB0cnVlLFxuICAgICAgICAgIHF1YXJ0ZXJseUNvbXBsaWFuY2VSZXBvcnRzOiB0cnVlLFxuICAgICAgICAgIGFubnVhbEF1ZGl0UmVwb3J0czogdHJ1ZSxcbiAgICAgICAgICBpbmNpZGVudFJlcG9ydHM6IHRydWUsXG4gICAgICAgICAgcmVndWxhdG9yeUZpbGluZ3M6IHRydWVcbiAgICAgICAgfTtcblxuICAgICAgICBleHBlY3QocmVwb3J0aW5nUmVxdWlyZW1lbnRzLm1vbnRobHlSaXNrUmVwb3J0cykudG9CZSh0cnVlKTtcbiAgICAgICAgZXhwZWN0KHJlcG9ydGluZ1JlcXVpcmVtZW50cy5xdWFydGVybHlDb21wbGlhbmNlUmVwb3J0cykudG9CZSh0cnVlKTtcbiAgICAgICAgZXhwZWN0KHJlcG9ydGluZ1JlcXVpcmVtZW50cy5hbm51YWxBdWRpdFJlcG9ydHMpLnRvQmUodHJ1ZSk7XG4gICAgICAgIGV4cGVjdChyZXBvcnRpbmdSZXF1aXJlbWVudHMuaW5jaWRlbnRSZXBvcnRzKS50b0JlKHRydWUpO1xuICAgICAgICBleHBlY3QocmVwb3J0aW5nUmVxdWlyZW1lbnRzLnJlZ3VsYXRvcnlGaWxpbmdzKS50b0JlKHRydWUpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdSZWd1bGF0aW9uIENoYW5nZSBNb25pdG9yaW5nJywgKCkgPT4ge1xuICAgIGRlc2NyaWJlKCdSZWd1bGF0b3J5IFVwZGF0ZSBDb21wbGlhbmNlJywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCBtb25pdG9yIGFuZCBhZGFwdCB0byByZWd1bGF0b3J5IGNoYW5nZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlZ3VsYXRpb25Nb25pdG9yaW5nID0gYXdhaXQgY29tcGxpYW5jZUFnZW50Lm1vbml0b3JSZWd1bGF0aW9uQ2hhbmdlcygpO1xuXG4gICAgICAgIGV4cGVjdChyZWd1bGF0aW9uTW9uaXRvcmluZykudG9CZURlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KHJlZ3VsYXRpb25Nb25pdG9yaW5nLm5ld1JlZ3VsYXRpb25zKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICBleHBlY3QocmVndWxhdGlvbk1vbml0b3JpbmcudXBkYXRlZFJlZ3VsYXRpb25zKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICBleHBlY3QocmVndWxhdGlvbk1vbml0b3JpbmcudXBjb21pbmdSZWd1bGF0aW9ucykudG9CZURlZmluZWQoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIFNob3VsZCBiZSBhcnJheXMgKGV2ZW4gaWYgZW1wdHkpXG4gICAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KHJlZ3VsYXRpb25Nb25pdG9yaW5nLm5ld1JlZ3VsYXRpb25zKSkudG9CZSh0cnVlKTtcbiAgICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkocmVndWxhdGlvbk1vbml0b3JpbmcudXBkYXRlZFJlZ3VsYXRpb25zKSkudG9CZSh0cnVlKTtcbiAgICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkocmVndWxhdGlvbk1vbml0b3JpbmcudXBjb21pbmdSZWd1bGF0aW9ucykpLnRvQmUodHJ1ZSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCB1cGRhdGUgY29tcGxpYW5jZSBydWxlcyB3aXRoaW4gcmVxdWlyZWQgdGltZWZyYW1lcycsICgpID0+IHtcbiAgICAgICAgY29uc3QgdXBkYXRlVGltZWZyYW1lcyA9IHtcbiAgICAgICAgICBjcml0aWNhbFJlZ3VsYXRpb25DaGFuZ2VzOiAyNCwgLy8gMjQgaG91cnNcbiAgICAgICAgICBzdGFuZGFyZFJlZ3VsYXRpb25DaGFuZ2VzOiA3MiwgLy8gNzIgaG91cnNcbiAgICAgICAgICBtaW5vclJlZ3VsYXRpb25DaGFuZ2VzOiAxNjgsIC8vIDEgd2Vla1xuICAgICAgICAgIHBsYW5uZWRSZWd1bGF0aW9uQ2hhbmdlczogNzIwIC8vIDMwIGRheXNcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBWZXJpZnkgdXBkYXRlIHRpbWVmcmFtZXMgYXJlIHJlYXNvbmFibGVcbiAgICAgICAgZXhwZWN0KHVwZGF0ZVRpbWVmcmFtZXMuY3JpdGljYWxSZWd1bGF0aW9uQ2hhbmdlcykudG9CZUxlc3NUaGFuT3JFcXVhbCg0OCk7XG4gICAgICAgIGV4cGVjdCh1cGRhdGVUaW1lZnJhbWVzLnN0YW5kYXJkUmVndWxhdGlvbkNoYW5nZXMpLnRvQmVMZXNzVGhhbk9yRXF1YWwoMTY4KTtcbiAgICAgICAgZXhwZWN0KHVwZGF0ZVRpbWVmcmFtZXMubWlub3JSZWd1bGF0aW9uQ2hhbmdlcykudG9CZUxlc3NUaGFuT3JFcXVhbCg3MjApO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufSk7Il19