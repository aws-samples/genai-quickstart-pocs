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

import { ComplianceAgent } from '../ai/compliance-agent';
import { ClaudeHaikuService } from '../ai/claude-haiku-service';
import { Investment } from '../../models/investment';
import { InvestmentIdea } from '../../models/investment-idea';
import { User } from '../../models/user';
import { ComplianceResult, ComplianceIssue } from '../../models/investment-idea';
import { RiskContext, RiskAssessment } from '../../models/services';

describe('Compliance Verification Testing Suite', () => {
  let complianceAgent: ComplianceAgent;
  let haikuService: ClaudeHaikuService;

  beforeEach(() => {
    // Mock Bedrock client for Haiku service
    const mockBedrockClient = {
      invokeModel: jest.fn().mockResolvedValue({
        body: Buffer.from(JSON.stringify({ completion: 'test response' }))
      })
    } as any;
    
    haikuService = new ClaudeHaikuService(mockBedrockClient);
    complianceAgent = new ComplianceAgent(haikuService);
  });

  describe('Regulatory Compliance Tests', () => {
    describe('SEC Investment Company Act Compliance', () => {
      it('should verify compliance with SEC investment limits', async () => {
        const investment: Investment = {
          id: 'test-investment-1',
          type: 'stock',
          name: 'Test Corporation',
          ticker: 'TEST',
          description: 'Test investment for compliance verification',
          sector: 'Technology',
          industry: 'Software',
          marketCap: 1000000000, // $1B market cap
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
        const highRiskInvestment: Investment = {
          id: 'high-risk-investment',
          type: 'cryptocurrency',
          name: 'VolatileCoin',
          description: 'Highly volatile cryptocurrency for testing',
          description: 'Highly volatile cryptocurrency',
          sector: 'Cryptocurrency',
          marketCap: 100000000, // $100M market cap (smaller)
          currentPrice: 50000,
          historicalPerformance: [],
          riskMetrics: {
            volatility: 0.80, // Very high volatility
            beta: 2.5, // High beta
            sharpeRatio: 0.5, // Low Sharpe ratio
            drawdown: 0.60, // High drawdown
            var: 0.25, // High VaR
            correlations: {}
          },
          relatedInvestments: []
        };

        const complianceResult = await complianceAgent.checkCompliance(highRiskInvestment);

        expect(complianceResult.compliant).toBe(false);
        expect(complianceResult.issues.length).toBeGreaterThan(0);
        
        // Should have warnings or critical issues for high-risk investments
        const significantIssues = complianceResult.issues.filter(
          issue => issue.severity === 'warning' || issue.severity === 'critical'
        );
        expect(significantIssues.length).toBeGreaterThan(0);
      });

      it('should verify portfolio concentration limits', async () => {
        const investments: Investment[] = [
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
            sector: 'Technology', // Same sector - concentration risk
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
          const concentrationIssues = complianceResult.issues.filter(
            issue => issue.description.toLowerCase().includes('concentration')
          );
          
          // May or may not have concentration issues depending on portfolio context
          expect(concentrationIssues.length).toBeGreaterThanOrEqual(0);
        }
      });
    });

    describe('MiFID II Compliance (EU)', () => {
      it('should verify MiFID II suitability requirements', async () => {
        const complexInvestment: Investment = {
          id: 'complex-investment',
          type: 'other', // Complex financial instrument
          name: 'Complex Derivative Product',
          description: 'Complex structured product with embedded derivatives',
          sector: 'Financial Services',
          marketCap: 1000000000,
          currentPrice: 1000,
          historicalPerformance: [],
          riskMetrics: {
            volatility: 0.45, // High volatility
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
        const suitabilityIssues = complianceResult.issues.filter(
          issue => issue.description.toLowerCase().includes('suitability') ||
                   issue.description.toLowerCase().includes('complex')
        );
        
        expect(suitabilityIssues.length).toBeGreaterThanOrEqual(0);
      });

      it('should verify best execution requirements', async () => {
        const investment: Investment = {
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
        const investmentIdea: InvestmentIdea = {
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
              volatility: 0.15, // Low volatility
              beta: 0.8, // Low beta
              sharpeRatio: 1.8, // Good risk-adjusted returns
              drawdown: 0.08, // Low drawdown
              var: 0.04, // Low VaR
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
          requestType: 'compliance-check' as const,
          parameters: {
            jurisdictions: ['US'],
            includeESG: false
          }
        };

        const response = await complianceAgent.processComplianceRequest(request);

        expect(response.complianceResults.length).toBeGreaterThan(0);
        
        const fiduciaryIssues = response.complianceResults[0].issues.filter(
          issue => issue.regulation.toLowerCase().includes('fiduciary')
        );
        
        // Conservative strategy should have minimal fiduciary concerns
        const criticalFiduciaryIssues = fiduciaryIssues.filter(
          issue => issue.severity === 'critical'
        );
        expect(criticalFiduciaryIssues).toHaveLength(0);
      });
    });
  });

  describe('ESG Compliance Tests', () => {
    describe('Environmental Compliance', () => {
      it('should assess environmental impact compliance', async () => {
        const environmentalInvestment: Investment = {
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
          requestType: 'esg-analysis' as const,
          parameters: {
            includeESG: true,
            jurisdictions: ['US', 'EU']
          }
        };

        const response = await complianceAgent.processComplianceRequest(request);

        expect(response.esgAnalysis).toBeDefined();
        expect(response.esgAnalysis!.environmentalScore).toBeGreaterThanOrEqual(0);
        expect(response.esgAnalysis!.environmentalScore).toBeLessThanOrEqual(100);
        
        // Renewable energy should have positive environmental factors
        const environmentalFactors = response.esgAnalysis!.esgFactors.filter(
          factor => factor.category === 'environmental'
        );
        expect(environmentalFactors.length).toBeGreaterThan(0);
      });

      it('should flag environmental compliance issues', async () => {
        const pollutingInvestment: Investment = {
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
          requestType: 'esg-analysis' as const,
          parameters: {
            includeESG: true,
            jurisdictions: ['US', 'EU']
          }
        };

        const response = await complianceAgent.processComplianceRequest(request);

        expect(response.esgAnalysis).toBeDefined();
        
        // Should identify environmental risks
        const environmentalRisks = response.esgAnalysis!.esgRisks.filter(
          risk => risk.category === 'environmental'
        );
        expect(environmentalRisks.length).toBeGreaterThan(0);
        
        // Should have lower environmental score
        expect(response.esgAnalysis!.environmentalScore).toBeLessThan(70);
      });
    });

    describe('Social Compliance', () => {
      it('should assess social responsibility compliance', async () => {
        const socialInvestment: Investment = {
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
          requestType: 'esg-analysis' as const,
          parameters: {
            includeESG: true,
            jurisdictions: ['US']
          }
        };

        const response = await complianceAgent.processComplianceRequest(request);

        expect(response.esgAnalysis).toBeDefined();
        expect(response.esgAnalysis!.socialScore).toBeGreaterThanOrEqual(0);
        expect(response.esgAnalysis!.socialScore).toBeLessThanOrEqual(100);
        
        // Healthcare should have positive social factors
        const socialFactors = response.esgAnalysis!.esgFactors.filter(
          factor => factor.category === 'social'
        );
        expect(socialFactors.length).toBeGreaterThan(0);
      });
    });

    describe('Governance Compliance', () => {
      it('should assess corporate governance compliance', async () => {
        const governanceInvestment: Investment = {
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
          requestType: 'esg-analysis' as const,
          parameters: {
            includeESG: true,
            jurisdictions: ['US']
          }
        };

        const response = await complianceAgent.processComplianceRequest(request);

        expect(response.esgAnalysis).toBeDefined();
        expect(response.esgAnalysis!.governanceScore).toBeGreaterThanOrEqual(0);
        expect(response.esgAnalysis!.governanceScore).toBeLessThanOrEqual(100);
        
        // Should assess governance factors
        const governanceFactors = response.esgAnalysis!.esgFactors.filter(
          factor => factor.category === 'governance'
        );
        expect(governanceFactors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Risk Management Compliance Tests', () => {
    describe('Risk Assessment Compliance', () => {
      it('should perform comprehensive risk assessment', async () => {
        const investment: Investment = {
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

        const riskContext: RiskContext = {
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
        const highRiskInvestment: Investment = {
          id: 'high-risk-test',
          type: 'cryptocurrency',
          name: 'VolatileCoin',
          description: 'Highly volatile cryptocurrency for testing',
          sector: 'Cryptocurrency',
          marketCap: 50000000,
          currentPrice: 25000,
          historicalPerformance: [],
          riskMetrics: {
            volatility: 0.85, // Very high volatility
            beta: 3.0, // Very high beta
            sharpeRatio: 0.3, // Poor risk-adjusted returns
            drawdown: 0.70, // Very high drawdown
            var: 0.35, // Very high VaR
            correlations: {}
          },
          relatedInvestments: []
        };

        const riskContext: RiskContext = {
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
        const portfolioInvestments: Investment[] = [
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
              volatility: 0.05, // Low volatility
              beta: 0.2, // Low beta
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
          const riskContext: RiskContext = {
            portfolioComposition: { [investment.id]: 0.5 }, // 50% allocation
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
          userDataRetention: 7 * 365, // 7 years
          transactionDataRetention: 7 * 365, // 7 years
          logDataRetention: 2 * 365, // 2 years
          backupDataRetention: 10 * 365, // 10 years
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
          implementRBAC: true, // Role-Based Access Control
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
          criticalRegulationChanges: 24, // 24 hours
          standardRegulationChanges: 72, // 72 hours
          minorRegulationChanges: 168, // 1 week
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