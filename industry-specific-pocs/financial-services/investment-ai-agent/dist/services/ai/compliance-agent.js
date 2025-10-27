"use strict";
/**
 * Compliance Agent Implementation
 *
 * This agent is responsible for:
 * - Regulatory compliance checking
 * - Risk assessment for investment ideas
 * - Compliance documentation generation
 *
 * Uses Claude Haiku 3.5 for efficient compliance processing and regulatory analysis
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceAgent = void 0;
const claude_haiku_service_1 = require("./claude-haiku-service");
/**
 * Compliance Agent class that handles all regulatory compliance and risk assessment tasks
 */
class ComplianceAgent {
    constructor(haikuService) {
        this.agentType = 'compliance';
        this.haikuService = haikuService;
        this.regulationDatabase = this.initializeRegulationDatabase();
    }
    /**
     * Process a compliance request and return comprehensive compliance analysis
     */
    async processComplianceRequest(request) {
        const startTime = Date.now();
        try {
            let response;
            switch (request.requestType) {
                case 'compliance-check':
                    response = await this.performComplianceCheck(request, startTime);
                    break;
                case 'risk-assessment':
                    response = await this.performRiskAssessment(request, startTime);
                    break;
                case 'regulation-lookup':
                    response = await this.performRegulationLookup(request, startTime);
                    break;
                case 'esg-analysis':
                    response = await this.performESGAnalysis(request, startTime);
                    break;
                case 'documentation-generation':
                    response = await this.generateComplianceDocumentation(request, startTime);
                    break;
                default:
                    throw new Error(`Unsupported compliance request type: ${request.requestType}`);
            }
            if (response.executionTime === 0) {
                response.executionTime = Date.now() - startTime;
            }
            return response;
        }
        catch (error) {
            console.error('Error processing compliance request:', error);
            throw error;
        }
    }
    /**
     * Check compliance for investments or investment ideas
     */
    async checkCompliance(investment) {
        const request = {
            investments: [investment],
            requestType: 'compliance-check',
            parameters: {
                jurisdictions: ['US', 'EU'],
                includeESG: true
            }
        };
        const response = await this.performComplianceCheck(request);
        return response.complianceResults[0];
    }
    /**
     * Get details about specific regulations
     */
    async getRegulationDetails(regulationId) {
        const regulation = this.regulationDatabase.regulations.get(regulationId);
        if (!regulation) {
            throw new Error(`Regulation not found: ${regulationId}`);
        }
        return regulation;
    }
    /**
     * Evaluate risk for an investment in a given context
     */
    async evaluateRisk(investment, context) {
        const request = {
            investments: [investment],
            requestType: 'risk-assessment',
            parameters: {
                riskTolerance: context.riskTolerance,
                investmentHorizon: context.investmentHorizon,
                jurisdictions: context.regulatoryContext
            }
        };
        const response = await this.performRiskAssessment(request);
        return response.riskAssessments[0];
    }
    /**
     * Monitor for regulation changes
     */
    async monitorRegulationChanges() {
        // In a real implementation, this would connect to regulatory data feeds
        return {
            newRegulations: [],
            updatedRegulations: [],
            upcomingRegulations: []
        };
    }
    /**
     * Perform comprehensive compliance check
     */
    async performComplianceCheck(request, startTime = Date.now()) {
        const complianceResults = [];
        const riskAssessments = [];
        // Check investments
        if (request.investments) {
            for (const investment of request.investments) {
                const result = await this.checkInvestmentCompliance(investment, request.parameters);
                complianceResults.push(result);
                const riskContext = {
                    portfolioComposition: { [investment.id]: 1.0 },
                    marketConditions: {},
                    riskTolerance: request.parameters.riskTolerance || 'moderate',
                    investmentHorizon: request.parameters.investmentHorizon || 'medium',
                    regulatoryContext: request.parameters.jurisdictions || ['US']
                };
                const riskAssessment = await this.assessInvestmentRisk(investment, riskContext);
                riskAssessments.push(riskAssessment);
            }
        }
        // Check investment ideas
        if (request.investmentIdeas) {
            for (const idea of request.investmentIdeas) {
                const result = await this.checkInvestmentIdeaCompliance(idea, request.parameters);
                complianceResults.push(result);
            }
        }
        const recommendations = await this.generateComplianceRecommendations(complianceResults, riskAssessments);
        return {
            complianceResults,
            riskAssessments,
            recommendations,
            confidence: this.calculateComplianceConfidence(complianceResults),
            executionTime: Date.now() - startTime
        };
    }
    /**
     * Check compliance for a single investment
     */
    async checkInvestmentCompliance(investment, parameters) {
        const prompt = `
      Perform comprehensive regulatory compliance analysis for the following investment:
      
      Investment Details:
      - Name: ${investment.name}
      - Type: ${investment.type}
      - Sector: ${investment.sector || 'N/A'}
      - Industry: ${investment.industry || 'N/A'}
      - Market Cap: ${investment.marketCap ? investment.marketCap.toLocaleString() : 'N/A'}
      
      Jurisdictions to check: ${parameters.jurisdictions?.join(', ') || 'US'}
      Include ESG analysis: ${parameters.includeESG ? 'Yes' : 'No'}
      
      Please analyze compliance with:
      1. Securities regulations (SEC, MiFID II, etc.)
      2. Investment restrictions and limitations
      3. Fiduciary duty requirements
      4. Anti-money laundering (AML) requirements
      5. Know Your Customer (KYC) requirements
      6. ESG compliance requirements (if applicable)
      7. Sector-specific regulations
      
      For each regulation, provide:
      - Compliance status (compliant/non-compliant/requires-review)
      - Specific issues or concerns
      - Severity level (info/warning/critical)
      - Recommended remediation actions
    `;
        const response = await this.haikuService.complete({
            prompt,
            template: claude_haiku_service_1.ClaudeHaikuPromptTemplate.COMPLIANCE_ANALYSIS,
            templateVariables: {
                investmentName: investment.name,
                investmentType: investment.type,
                sector: investment.sector || 'N/A',
                jurisdictions: parameters.jurisdictions?.join(', ') || 'US',
                analysisType: 'regulatory-compliance'
            },
            maxTokens: 1500
        });
        return await this.parseComplianceResult(response.completion, investment);
    }
    /**
     * Check compliance for an investment idea
     */
    async checkInvestmentIdeaCompliance(idea, parameters) {
        const prompt = `
      Perform regulatory compliance analysis for the following investment idea:
      
      Investment Idea: ${idea.title}
      Description: ${idea.description}
      Strategy: ${idea.strategy}
      Time Horizon: ${idea.timeHorizon}
      Confidence Score: ${idea.confidenceScore}
      
      Investments involved:
      ${idea.investments.map(inv => `- ${inv.name} (${inv.type})`).join('\n')}
      
      Jurisdictions to check: ${parameters.jurisdictions?.join(', ') || 'US'}
      
      Please analyze:
      1. Overall strategy compliance with investment regulations
      2. Portfolio concentration limits
      3. Suitability requirements
      4. Risk disclosure requirements
      5. Potential conflicts of interest
      6. Market manipulation concerns
      7. ESG compliance (if applicable)
      
      Provide specific compliance issues and recommendations.
    `;
        const response = await this.haikuService.complete({
            prompt,
            template: claude_haiku_service_1.ClaudeHaikuPromptTemplate.COMPLIANCE_ANALYSIS,
            templateVariables: {
                investmentName: idea.title,
                investmentType: 'investment-idea',
                sector: 'mixed',
                jurisdictions: parameters.jurisdictions?.join(', ') || 'US',
                analysisType: 'strategy-compliance'
            },
            maxTokens: 1500
        });
        return await this.parseComplianceResult(response.completion, undefined, idea);
    }
    /**
     * Perform risk assessment
     */
    async performRiskAssessment(request, startTime = Date.now()) {
        const riskAssessments = [];
        if (request.investments) {
            for (const investment of request.investments) {
                const riskContext = {
                    portfolioComposition: { [investment.id]: 1.0 },
                    marketConditions: {},
                    riskTolerance: request.parameters.riskTolerance || 'moderate',
                    investmentHorizon: request.parameters.investmentHorizon || 'medium',
                    regulatoryContext: request.parameters.jurisdictions || ['US']
                };
                const assessment = await this.assessInvestmentRisk(investment, riskContext);
                riskAssessments.push(assessment);
            }
        }
        const recommendations = await this.generateRiskRecommendations(riskAssessments);
        return {
            complianceResults: [],
            riskAssessments,
            recommendations,
            confidence: 0.85,
            executionTime: Date.now() - startTime
        };
    }
    /**
     * Assess risk for a single investment
     */
    async assessInvestmentRisk(investment, context) {
        const prompt = `
      Perform comprehensive risk assessment for the following investment:
      
      Investment: ${investment.name} (${investment.type})
      Sector: ${investment.sector || 'N/A'}
      Current Price: ${investment.currentPrice || 'N/A'}
      Market Cap: ${investment.marketCap ? investment.marketCap.toLocaleString() : 'N/A'}
      
      Risk Context:
      - Risk Tolerance: ${context.riskTolerance}
      - Investment Horizon: ${context.investmentHorizon}
      - Regulatory Context: ${context.regulatoryContext.join(', ')}
      
      Risk Metrics:
      ${investment.riskMetrics ? JSON.stringify(investment.riskMetrics, null, 2) : 'No risk metrics available'}
      
      Please assess:
      1. Market risk (systematic and unsystematic)
      2. Credit risk (if applicable)
      3. Liquidity risk
      4. Operational risk
      5. Regulatory risk
      6. ESG risks
      7. Concentration risk
      8. Currency risk (if applicable)
      
      For each risk factor, provide:
      - Risk level (low/medium/high/very-high)
      - Description of the risk
      - Potential impact
      - Mitigation strategies
      
      Provide an overall risk assessment and recommendations.
    `;
        const response = await this.haikuService.complete({
            prompt,
            template: claude_haiku_service_1.ClaudeHaikuPromptTemplate.RISK_ANALYSIS,
            templateVariables: {
                investmentName: investment.name,
                investmentType: investment.type,
                riskTolerance: context.riskTolerance,
                timeHorizon: context.investmentHorizon,
                analysisType: 'comprehensive-risk'
            },
            maxTokens: 1500
        });
        return await this.parseRiskAssessment(response.completion, investment);
    }
    /**
     * Perform ESG analysis
     */
    async performESGAnalysis(request, startTime = Date.now()) {
        if (!request.investments || request.investments.length === 0) {
            throw new Error('ESG analysis requires investments to be provided');
        }
        const esgAnalysis = await this.analyzeESGFactors(request.investments[0]);
        const recommendations = await this.generateESGRecommendations(esgAnalysis);
        return {
            complianceResults: [],
            riskAssessments: [],
            esgAnalysis,
            recommendations,
            confidence: 0.80,
            executionTime: Date.now() - startTime
        };
    }
    /**
     * Analyze ESG factors for an investment
     */
    async analyzeESGFactors(investment) {
        const prompt = `
      Perform comprehensive ESG (Environmental, Social, Governance) analysis for:
      
      Investment: ${investment.name}
      Type: ${investment.type}
      Sector: ${investment.sector || 'N/A'}
      Industry: ${investment.industry || 'N/A'}
      
      Please analyze and score (0-100) the following:
      
      ENVIRONMENTAL FACTORS:
      - Carbon footprint and emissions
      - Resource usage and waste management
      - Environmental compliance
      - Climate change adaptation
      - Renewable energy usage
      
      SOCIAL FACTORS:
      - Labor practices and human rights
      - Community impact
      - Product safety and quality
      - Data privacy and security
      - Diversity and inclusion
      
      GOVERNANCE FACTORS:
      - Board composition and independence
      - Executive compensation
      - Shareholder rights
      - Business ethics and transparency
      - Risk management
      
      For each factor, provide:
      - Score (0-100)
      - Impact assessment (positive/negative/neutral)
      - Description and rationale
      - Data sources used
      
      Also identify:
      - Key ESG risks and their severity
      - ESG opportunities for improvement
      - Overall ESG score and rating
      - Sustainability metrics
    `;
        const response = await this.haikuService.complete({
            prompt,
            template: claude_haiku_service_1.ClaudeHaikuPromptTemplate.ESG_ANALYSIS,
            templateVariables: {
                investmentName: investment.name,
                sector: investment.sector || 'N/A',
                industry: investment.industry || 'N/A',
                analysisType: 'comprehensive-esg'
            },
            maxTokens: 2000
        });
        return await this.parseESGAnalysis(response.completion, investment);
    }
    /**
     * Perform regulation lookup
     */
    async performRegulationLookup(request, startTime = Date.now()) {
        const regulationDetails = [];
        if (request.parameters.regulationTypes) {
            for (const regulationType of request.parameters.regulationTypes) {
                const regulation = this.regulationDatabase.regulations.get(regulationType);
                if (regulation) {
                    regulationDetails.push(regulation);
                }
            }
        }
        return {
            complianceResults: [],
            riskAssessments: [],
            regulationDetails,
            recommendations: [],
            confidence: 0.95,
            executionTime: Date.now() - startTime
        };
    }
    /**
     * Generate compliance documentation
     */
    async generateComplianceDocumentation(request, startTime = Date.now()) {
        const documentationType = request.parameters.documentationType || 'summary';
        const documentation = await this.createComplianceDocument(request, documentationType);
        return {
            complianceResults: [],
            riskAssessments: [],
            documentation,
            recommendations: [],
            confidence: 0.90,
            executionTime: Date.now() - startTime
        };
    }
    /**
     * Create compliance documentation
     */
    async createComplianceDocument(request, documentationType) {
        const prompt = `
      Generate ${documentationType} compliance documentation for the following:
      
      ${request.investments ?
            `Investments:\n${request.investments.map(inv => `- ${inv.name} (${inv.type})`).join('\n')}` :
            ''}
      
      ${request.investmentIdeas ?
            `Investment Ideas:\n${request.investmentIdeas.map(idea => `- ${idea.title}`).join('\n')}` :
            ''}
      
      Jurisdictions: ${request.parameters.jurisdictions?.join(', ') || 'US'}
      Document Type: ${documentationType}
      
      Please create a comprehensive compliance document that includes:
      
      1. Executive Summary
      2. Regulatory Framework Overview
      3. Compliance Analysis
      4. Risk Assessment
      5. ESG Considerations (if applicable)
      6. Recommendations and Action Items
      7. Appendices (regulations, references)
      
      Format the document with clear sections, subsections, and references.
      Ensure it meets regulatory documentation standards.
    `;
        const response = await this.haikuService.complete({
            prompt,
            template: claude_haiku_service_1.ClaudeHaikuPromptTemplate.DOCUMENTATION,
            templateVariables: {
                documentType: documentationType,
                subject: request.investments?.[0]?.name || 'Investment Portfolio',
                jurisdiction: request.parameters.jurisdictions?.join(', ') || 'US',
                analysisType: 'compliance-documentation'
            },
            maxTokens: 3000
        });
        return await this.parseComplianceDocumentation(response.completion, documentationType, request.parameters.jurisdictions || ['US']);
    }
    // Helper methods for parsing responses
    async parseComplianceResult(completion, investment, idea) {
        // In a real implementation, this would use structured parsing
        // For now, we'll create a mock result based on the completion
        const issues = [];
        // Extract potential issues from the completion text
        if (completion.toLowerCase().includes('warning') || completion.toLowerCase().includes('concern')) {
            issues.push({
                severity: 'warning',
                regulation: 'SEC Investment Company Act',
                description: 'Potential compliance concern identified',
                remediation: 'Review investment strategy and documentation',
                estimatedImpact: 'medium'
            });
        }
        if (completion.toLowerCase().includes('critical') || completion.toLowerCase().includes('violation')) {
            issues.push({
                severity: 'critical',
                regulation: 'Fiduciary Duty Requirements',
                description: 'Critical compliance issue requiring immediate attention',
                remediation: 'Immediate review and corrective action required',
                estimatedImpact: 'high'
            });
        }
        return {
            compliant: issues.filter(i => i.severity === 'critical').length === 0,
            issues,
            regulationsChecked: [
                'SEC Investment Company Act',
                'Fiduciary Duty Requirements',
                'Anti-Money Laundering (AML)',
                'Know Your Customer (KYC)',
                'MiFID II (if applicable)'
            ],
            timestamp: new Date()
        };
    }
    async parseRiskAssessment(completion, investment) {
        // Mock risk assessment based on completion
        const riskFactors = [
            {
                factor: 'Market Risk',
                level: 'medium',
                description: 'Standard market volatility risk'
            },
            {
                factor: 'Liquidity Risk',
                level: 'low',
                description: 'Good liquidity in normal market conditions'
            }
        ];
        // Determine overall risk based on investment type and sector
        let overallRisk = 'medium';
        if (investment.type === 'cryptocurrency')
            overallRisk = 'very-high';
        else if (investment.type === 'bond')
            overallRisk = 'low';
        else if (investment.sector === 'Technology')
            overallRisk = 'high';
        return {
            overallRisk,
            riskFactors,
            mitigationStrategies: [
                'Diversification across asset classes',
                'Regular portfolio rebalancing',
                'Risk monitoring and alerts'
            ],
            scenarioAnalysis: {
                'bull-market': 'Positive performance expected',
                'bear-market': 'Potential for significant losses',
                'stable-market': 'Moderate performance expected'
            }
        };
    }
    async parseESGAnalysis(completion, investment) {
        // Mock ESG analysis
        const esgFactors = [
            {
                category: 'environmental',
                factor: 'Carbon Emissions',
                score: 75,
                impact: 'positive',
                description: 'Company has strong carbon reduction initiatives',
                dataSource: 'Company sustainability report'
            },
            {
                category: 'social',
                factor: 'Labor Practices',
                score: 80,
                impact: 'positive',
                description: 'Good employee satisfaction and fair labor practices',
                dataSource: 'Third-party ESG rating agency'
            },
            {
                category: 'governance',
                factor: 'Board Independence',
                score: 70,
                impact: 'neutral',
                description: 'Adequate board independence with room for improvement',
                dataSource: 'Proxy statements and governance reports'
            }
        ];
        const environmentalScore = 75;
        const socialScore = 80;
        const governanceScore = 70;
        const overallESGScore = (environmentalScore + socialScore + governanceScore) / 3;
        return {
            environmentalScore,
            socialScore,
            governanceScore,
            overallESGScore,
            esgFactors,
            esgRisks: [
                {
                    category: 'environmental',
                    risk: 'Climate Change Impact',
                    severity: 'medium',
                    probability: 0.6,
                    impact: 'Potential regulatory changes affecting operations',
                    mitigation: 'Invest in climate adaptation strategies'
                }
            ],
            esgOpportunities: [
                {
                    category: 'environmental',
                    opportunity: 'Renewable Energy Transition',
                    potential: 'high',
                    description: 'Opportunity to benefit from clean energy transition',
                    implementation: 'Increase investment in renewable energy projects'
                }
            ],
            sustainabilityMetrics: {
                'carbon-intensity': 'Low',
                'water-usage': 'Moderate',
                'waste-reduction': 'High',
                'employee-satisfaction': 'High'
            }
        };
    }
    async parseComplianceDocumentation(completion, documentationType, jurisdictions) {
        const sections = [
            {
                title: 'Executive Summary',
                content: 'Overview of compliance analysis and key findings',
                references: []
            },
            {
                title: 'Regulatory Framework',
                content: 'Applicable regulations and requirements',
                references: ['SEC Investment Company Act', 'MiFID II']
            },
            {
                title: 'Compliance Analysis',
                content: completion.substring(0, 500) + '...',
                references: []
            },
            {
                title: 'Recommendations',
                content: 'Key recommendations for maintaining compliance',
                references: []
            }
        ];
        return {
            documentType: documentationType,
            title: `Compliance Analysis Report - ${new Date().toLocaleDateString()}`,
            content: completion,
            sections,
            metadata: {
                generatedAt: new Date(),
                version: '1.0',
                jurisdiction: jurisdictions[0] || 'US',
                regulations: ['SEC Investment Company Act', 'Fiduciary Duty Requirements', 'AML/KYC']
            }
        };
    }
    // Helper methods for generating recommendations
    async generateComplianceRecommendations(complianceResults, riskAssessments) {
        const recommendations = [];
        // Generate recommendations based on compliance issues
        complianceResults.forEach(result => {
            result.issues.forEach(issue => {
                if (issue.severity === 'critical') {
                    recommendations.push({
                        type: 'compliance',
                        priority: 'critical',
                        recommendation: `Address critical compliance issue: ${issue.description}`,
                        rationale: `Violation of ${issue.regulation}`,
                        implementation: issue.remediation || 'Immediate corrective action required',
                        timeline: 'Immediate',
                        impact: 'High regulatory risk if not addressed'
                    });
                }
            });
        });
        // Generate recommendations based on risk assessments
        riskAssessments.forEach(assessment => {
            if (assessment.overallRisk === 'high' || assessment.overallRisk === 'very-high') {
                recommendations.push({
                    type: 'risk-mitigation',
                    priority: 'high',
                    recommendation: 'Implement additional risk controls',
                    rationale: `Overall risk level is ${assessment.overallRisk}`,
                    implementation: assessment.mitigationStrategies.join('; '),
                    timeline: '30 days',
                    impact: 'Reduced portfolio risk'
                });
            }
        });
        return recommendations;
    }
    async generateRiskRecommendations(riskAssessments) {
        return riskAssessments.flatMap(assessment => assessment.mitigationStrategies.map(strategy => ({
            type: 'risk-mitigation',
            priority: assessment.overallRisk === 'very-high' ? 'critical' : 'medium',
            recommendation: strategy,
            rationale: `Mitigate ${assessment.overallRisk} risk level`,
            implementation: 'Implement recommended risk mitigation strategy',
            timeline: '30-60 days',
            impact: 'Reduced investment risk'
        })));
    }
    async generateESGRecommendations(esgAnalysis) {
        const recommendations = [];
        // Recommendations based on ESG opportunities
        esgAnalysis.esgOpportunities.forEach(opportunity => {
            recommendations.push({
                type: 'esg-improvement',
                priority: opportunity.potential === 'high' ? 'high' : 'medium',
                recommendation: `Pursue ESG opportunity: ${opportunity.opportunity}`,
                rationale: opportunity.description,
                implementation: opportunity.implementation,
                timeline: '90 days',
                impact: 'Improved ESG score and sustainable returns'
            });
        });
        // Recommendations based on ESG risks
        esgAnalysis.esgRisks.forEach(risk => {
            if (risk.severity === 'high' || risk.severity === 'critical') {
                recommendations.push({
                    type: 'risk-mitigation',
                    priority: risk.severity === 'critical' ? 'critical' : 'high',
                    recommendation: `Mitigate ESG risk: ${risk.risk}`,
                    rationale: risk.impact,
                    implementation: risk.mitigation,
                    timeline: '60 days',
                    impact: 'Reduced ESG-related risks'
                });
            }
        });
        return recommendations;
    }
    calculateComplianceConfidence(results) {
        if (results.length === 0)
            return 0;
        const criticalIssues = results.reduce((sum, result) => sum + result.issues.filter(issue => issue.severity === 'critical').length, 0);
        const warningIssues = results.reduce((sum, result) => sum + result.issues.filter(issue => issue.severity === 'warning').length, 0);
        // Base confidence of 0.9, reduced by issues
        let confidence = 0.9;
        confidence -= criticalIssues * 0.2;
        confidence -= warningIssues * 0.1;
        return Math.max(0.1, Math.min(1.0, confidence));
    }
    initializeRegulationDatabase() {
        const regulations = new Map();
        // Add some common regulations
        regulations.set('SEC-ICA-1940', {
            id: 'SEC-ICA-1940',
            name: 'Investment Company Act of 1940',
            description: 'Federal law that regulates investment companies',
            jurisdiction: 'US',
            effectiveDate: new Date('1940-08-22'),
            requirements: [
                'Registration with SEC',
                'Disclosure requirements',
                'Investment restrictions',
                'Governance requirements'
            ],
            applicability: ['mutual-funds', 'etfs', 'investment-advisors'],
            references: ['15 U.S.C. §80a-1 et seq.']
        });
        regulations.set('MIFID-II', {
            id: 'MIFID-II',
            name: 'Markets in Financial Instruments Directive II',
            description: 'EU regulation for investment services',
            jurisdiction: 'EU',
            effectiveDate: new Date('2018-01-03'),
            requirements: [
                'Best execution',
                'Client categorization',
                'Product governance',
                'Transparency requirements'
            ],
            applicability: ['investment-firms', 'trading-venues', 'data-providers'],
            references: ['Directive 2014/65/EU']
        });
        return {
            regulations,
            jurisdictions: ['US', 'EU', 'UK', 'APAC'],
            lastUpdated: new Date()
        };
    }
    /**
     * Handle agent messages for communication with other agents
     */
    async handleMessage(message) {
        try {
            let responseContent;
            switch (message.messageType) {
                case 'request':
                    if (message.content.type === 'compliance') {
                        responseContent = await this.processComplianceRequest(message.content.request);
                    }
                    else {
                        throw new Error(`Unsupported request type: ${message.content.type}`);
                    }
                    break;
                default:
                    throw new Error(`Unsupported message type: ${message.messageType}`);
            }
            return {
                sender: this.agentType,
                recipient: message.sender,
                messageType: 'response',
                content: responseContent,
                metadata: {
                    priority: message.metadata.priority,
                    timestamp: new Date(),
                    conversationId: message.metadata.conversationId,
                    requestId: message.metadata.requestId
                }
            };
        }
        catch (error) {
            console.error('Error handling message:', error);
            throw error;
        }
    }
}
exports.ComplianceAgent = ComplianceAgent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGxpYW5jZS1hZ2VudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9haS9jb21wbGlhbmNlLWFnZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7O0dBU0c7OztBQUVILGlFQUF1RjtBQXlIdkY7O0dBRUc7QUFDSCxNQUFhLGVBQWU7SUFLMUIsWUFBWSxZQUFnQztRQUhwQyxjQUFTLEdBQWMsWUFBWSxDQUFDO1FBSTFDLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztJQUNoRSxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsd0JBQXdCLENBQUMsT0FBMEI7UUFDdkQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRTdCLElBQUk7WUFDRixJQUFJLFFBQTRCLENBQUM7WUFFakMsUUFBUSxPQUFPLENBQUMsV0FBVyxFQUFFO2dCQUMzQixLQUFLLGtCQUFrQjtvQkFDckIsUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLHNCQUFzQixDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztvQkFDakUsTUFBTTtnQkFDUixLQUFLLGlCQUFpQjtvQkFDcEIsUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztvQkFDaEUsTUFBTTtnQkFDUixLQUFLLG1CQUFtQjtvQkFDdEIsUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztvQkFDbEUsTUFBTTtnQkFDUixLQUFLLGNBQWM7b0JBQ2pCLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7b0JBQzdELE1BQU07Z0JBQ1Is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LE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztxQkFDdEU7b0JBQ0QsTUFBTTtnQkFDUjtvQkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQzthQUN2RTtZQUVELE9BQU87Z0JBQ0wsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTO2dCQUN0QixTQUFTLEVBQUUsT0FBTyxDQUFDLE1BQU07Z0JBQ3pCLFdBQVcsRUFBRSxVQUFVO2dCQUN2QixPQUFPLEVBQUUsZUFBZTtnQkFDeEIsUUFBUSxFQUFFO29CQUNSLFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLFFBQVE7b0JBQ25DLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRTtvQkFDckIsY0FBYyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsY0FBYztvQkFDL0MsU0FBUyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsU0FBUztpQkFDdEM7YUFDRixDQUFDO1NBQ0g7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNkLE9BQU8sQ0FBQyxLQUFLLENBQUMseUJBQXlCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDaEQsTUFBTSxLQUFLLENBQUM7U0FDYjtJQUNILENBQUM7Q0FDRjtBQXIzQkQsMENBcTNCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29tcGxpYW5jZSBBZ2VudCBJbXBsZW1lbnRhdGlvblxuICogXG4gKiBUaGlzIGFnZW50IGlzIHJlc3BvbnNpYmxlIGZvcjpcbiAqIC0gUmVndWxhdG9yeSBjb21wbGlhbmNlIGNoZWNraW5nXG4gKiAtIFJpc2sgYXNzZXNzbWVudCBmb3IgaW52ZXN0bWVudCBpZGVhc1xuICogLSBDb21wbGlhbmNlIGRvY3VtZW50YXRpb24gZ2VuZXJhdGlvblxuICogXG4gKiBVc2VzIENsYXVkZSBIYWlrdSAzLjUgZm9yIGVmZmljaWVudCBjb21wbGlhbmNlIHByb2Nlc3NpbmcgYW5kIHJlZ3VsYXRvcnkgYW5hbHlzaXNcbiAqL1xuXG5pbXBvcnQgeyBDbGF1ZGVIYWlrdVNlcnZpY2UsIENsYXVkZUhhaWt1UHJvbXB0VGVtcGxhdGUgfSBmcm9tICcuL2NsYXVkZS1oYWlrdS1zZXJ2aWNlJztcbmltcG9ydCB7IFxuICBBZ2VudE1lc3NhZ2UsIFxuICBBZ2VudFRhc2ssIFxuICBDb252ZXJzYXRpb25Db250ZXh0LCBcbiAgQWdlbnRUeXBlIFxufSBmcm9tICcuLi8uLi9tb2RlbHMvYWdlbnQnO1xuaW1wb3J0IHsgXG4gIENvbXBsaWFuY2VSZXN1bHQsXG4gIENvbXBsaWFuY2VJc3N1ZSxcbiAgSW52ZXN0bWVudElkZWFcbn0gZnJvbSAnLi4vLi4vbW9kZWxzL2ludmVzdG1lbnQtaWRlYSc7XG5pbXBvcnQgeyBJbnZlc3RtZW50IH0gZnJvbSAnLi4vLi4vbW9kZWxzL2ludmVzdG1lbnQnO1xuaW1wb3J0IHsgXG4gIENvbXBsaWFuY2VTZXJ2aWNlLFxuICBSZWd1bGF0aW9uRGV0YWlscyxcbiAgUmlza0NvbnRleHQsXG4gIFJpc2tBc3Nlc3NtZW50LFxuICBSZWd1bGF0aW9uVXBkYXRlc1xufSBmcm9tICcuLi8uLi9tb2RlbHMvc2VydmljZXMnO1xuaW1wb3J0IHsgdjQgYXMgdXVpZHY0IH0gZnJvbSAndXVpZCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcGxpYW5jZVJlcXVlc3Qge1xuICBpbnZlc3RtZW50cz86IEludmVzdG1lbnRbXTtcbiAgaW52ZXN0bWVudElkZWFzPzogSW52ZXN0bWVudElkZWFbXTtcbiAgcmVxdWVzdFR5cGU6ICdjb21wbGlhbmNlLWNoZWNrJyB8ICdyaXNrLWFzc2Vzc21lbnQnIHwgJ3JlZ3VsYXRpb24tbG9va3VwJyB8ICdlc2ctYW5hbHlzaXMnIHwgJ2RvY3VtZW50YXRpb24tZ2VuZXJhdGlvbic7XG4gIHBhcmFtZXRlcnM6IHtcbiAgICBqdXJpc2RpY3Rpb25zPzogc3RyaW5nW107XG4gICAgcmVndWxhdGlvblR5cGVzPzogc3RyaW5nW107XG4gICAgcmlza1RvbGVyYW5jZT86ICdjb25zZXJ2YXRpdmUnIHwgJ21vZGVyYXRlJyB8ICdhZ2dyZXNzaXZlJztcbiAgICBpbnZlc3RtZW50SG9yaXpvbj86ICdzaG9ydCcgfCAnbWVkaXVtJyB8ICdsb25nJztcbiAgICBpbmNsdWRlRVNHPzogYm9vbGVhbjtcbiAgICBkb2N1bWVudGF0aW9uVHlwZT86ICdzdW1tYXJ5JyB8ICdkZXRhaWxlZCcgfCAncmVndWxhdG9yeS1maWxpbmcnO1xuICB9O1xuICBjb250ZXh0PzogQ29udmVyc2F0aW9uQ29udGV4dDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb21wbGlhbmNlUmVzcG9uc2Uge1xuICBjb21wbGlhbmNlUmVzdWx0czogQ29tcGxpYW5jZVJlc3VsdFtdO1xuICByaXNrQXNzZXNzbWVudHM6IFJpc2tBc3Nlc3NtZW50W107XG4gIHJlZ3VsYXRpb25EZXRhaWxzPzogUmVndWxhdGlvbkRldGFpbHNbXTtcbiAgZXNnQW5hbHlzaXM/OiBFU0dBbmFseXNpcztcbiAgZG9jdW1lbnRhdGlvbj86IENvbXBsaWFuY2VEb2N1bWVudGF0aW9uO1xuICByZWNvbW1lbmRhdGlvbnM6IENvbXBsaWFuY2VSZWNvbW1lbmRhdGlvbltdO1xuICBjb25maWRlbmNlOiBudW1iZXI7XG4gIGV4ZWN1dGlvblRpbWU6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFU0dBbmFseXNpcyB7XG4gIGVudmlyb25tZW50YWxTY29yZTogbnVtYmVyO1xuICBzb2NpYWxTY29yZTogbnVtYmVyO1xuICBnb3Zlcm5hbmNlU2NvcmU6IG51bWJlcjtcbiAgb3ZlcmFsbEVTR1Njb3JlOiBudW1iZXI7XG4gIGVzZ0ZhY3RvcnM6IEVTR0ZhY3RvcltdO1xuICBlc2dSaXNrczogRVNHUmlza1tdO1xuICBlc2dPcHBvcnR1bml0aWVzOiBFU0dPcHBvcnR1bml0eVtdO1xuICBzdXN0YWluYWJpbGl0eU1ldHJpY3M6IFJlY29yZDxzdHJpbmcsIGFueT47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRVNHRmFjdG9yIHtcbiAgY2F0ZWdvcnk6ICdlbnZpcm9ubWVudGFsJyB8ICdzb2NpYWwnIHwgJ2dvdmVybmFuY2UnO1xuICBmYWN0b3I6IHN0cmluZztcbiAgc2NvcmU6IG51bWJlcjtcbiAgaW1wYWN0OiAncG9zaXRpdmUnIHwgJ25lZ2F0aXZlJyB8ICduZXV0cmFsJztcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgZGF0YVNvdXJjZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEVTR1Jpc2sge1xuICBjYXRlZ29yeTogJ2Vudmlyb25tZW50YWwnIHwgJ3NvY2lhbCcgfCAnZ292ZXJuYW5jZSc7XG4gIHJpc2s6IHN0cmluZztcbiAgc2V2ZXJpdHk6ICdsb3cnIHwgJ21lZGl1bScgfCAnaGlnaCcgfCAnY3JpdGljYWwnO1xuICBwcm9iYWJpbGl0eTogbnVtYmVyO1xuICBpbXBhY3Q6IHN0cmluZztcbiAgbWl0aWdhdGlvbjogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEVTR09wcG9ydHVuaXR5IHtcbiAgY2F0ZWdvcnk6ICdlbnZpcm9ubWVudGFsJyB8ICdzb2NpYWwnIHwgJ2dvdmVybmFuY2UnO1xuICBvcHBvcnR1bml0eTogc3RyaW5nO1xuICBwb3RlbnRpYWw6ICdsb3cnIHwgJ21lZGl1bScgfCAnaGlnaCc7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gIGltcGxlbWVudGF0aW9uOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcGxpYW5jZURvY3VtZW50YXRpb24ge1xuICBkb2N1bWVudFR5cGU6ICdzdW1tYXJ5JyB8ICdkZXRhaWxlZCcgfCAncmVndWxhdG9yeS1maWxpbmcnO1xuICB0aXRsZTogc3RyaW5nO1xuICBjb250ZW50OiBzdHJpbmc7XG4gIHNlY3Rpb25zOiBEb2N1bWVudFNlY3Rpb25bXTtcbiAgbWV0YWRhdGE6IHtcbiAgICBnZW5lcmF0ZWRBdDogRGF0ZTtcbiAgICB2ZXJzaW9uOiBzdHJpbmc7XG4gICAganVyaXNkaWN0aW9uOiBzdHJpbmc7XG4gICAgcmVndWxhdGlvbnM6IHN0cmluZ1tdO1xuICB9O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERvY3VtZW50U2VjdGlvbiB7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGNvbnRlbnQ6IHN0cmluZztcbiAgc3Vic2VjdGlvbnM/OiBEb2N1bWVudFNlY3Rpb25bXTtcbiAgcmVmZXJlbmNlczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcGxpYW5jZVJlY29tbWVuZGF0aW9uIHtcbiAgdHlwZTogJ2NvbXBsaWFuY2UnIHwgJ3Jpc2stbWl0aWdhdGlvbicgfCAnZXNnLWltcHJvdmVtZW50JyB8ICdyZWd1bGF0b3J5LXVwZGF0ZSc7XG4gIHByaW9yaXR5OiAnbG93JyB8ICdtZWRpdW0nIHwgJ2hpZ2gnIHwgJ2NyaXRpY2FsJztcbiAgcmVjb21tZW5kYXRpb246IHN0cmluZztcbiAgcmF0aW9uYWxlOiBzdHJpbmc7XG4gIGltcGxlbWVudGF0aW9uOiBzdHJpbmc7XG4gIHRpbWVsaW5lOiBzdHJpbmc7XG4gIGltcGFjdDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlZ3VsYXRpb25EYXRhYmFzZSB7XG4gIHJlZ3VsYXRpb25zOiBNYXA8c3RyaW5nLCBSZWd1bGF0aW9uRGV0YWlscz47XG4gIGp1cmlzZGljdGlvbnM6IHN0cmluZ1tdO1xuICBsYXN0VXBkYXRlZDogRGF0ZTtcbn1cblxuLyoqXG4gKiBDb21wbGlhbmNlIEFnZW50IGNsYXNzIHRoYXQgaGFuZGxlcyBhbGwgcmVndWxhdG9yeSBjb21wbGlhbmNlIGFuZCByaXNrIGFzc2Vzc21lbnQgdGFza3NcbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBsaWFuY2VBZ2VudCBpbXBsZW1lbnRzIENvbXBsaWFuY2VTZXJ2aWNlIHtcbiAgcHJpdmF0ZSBoYWlrdVNlcnZpY2U6IENsYXVkZUhhaWt1U2VydmljZTtcbiAgcHJpdmF0ZSBhZ2VudFR5cGU6IEFnZW50VHlwZSA9ICdjb21wbGlhbmNlJztcbiAgcHJpdmF0ZSByZWd1bGF0aW9uRGF0YWJhc2U6IFJlZ3VsYXRpb25EYXRhYmFzZTtcblxuICBjb25zdHJ1Y3RvcihoYWlrdVNlcnZpY2U6IENsYXVkZUhhaWt1U2VydmljZSkge1xuICAgIHRoaXMuaGFpa3VTZXJ2aWNlID0gaGFpa3VTZXJ2aWNlO1xuICAgIHRoaXMucmVndWxhdGlvbkRhdGFiYXNlID0gdGhpcy5pbml0aWFsaXplUmVndWxhdGlvbkRhdGFiYXNlKCk7XG4gIH1cblxuICAvKipcbiAgICogUHJvY2VzcyBhIGNvbXBsaWFuY2UgcmVxdWVzdCBhbmQgcmV0dXJuIGNvbXByZWhlbnNpdmUgY29tcGxpYW5jZSBhbmFseXNpc1xuICAgKi9cbiAgYXN5bmMgcHJvY2Vzc0NvbXBsaWFuY2VSZXF1ZXN0KHJlcXVlc3Q6IENvbXBsaWFuY2VSZXF1ZXN0KTogUHJvbWlzZTxDb21wbGlhbmNlUmVzcG9uc2U+IHtcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcG9uc2U6IENvbXBsaWFuY2VSZXNwb25zZTtcblxuICAgICAgc3dpdGNoIChyZXF1ZXN0LnJlcXVlc3RUeXBlKSB7XG4gICAgICAgIGNhc2UgJ2NvbXBsaWFuY2UtY2hlY2snOlxuICAgICAgICAgIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wZXJmb3JtQ29tcGxpYW5jZUNoZWNrKHJlcXVlc3QsIHN0YXJ0VGltZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3Jpc2stYXNzZXNzbWVudCc6XG4gICAgICAgICAgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBlcmZvcm1SaXNrQXNzZXNzbWVudChyZXF1ZXN0LCBzdGFydFRpbWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyZWd1bGF0aW9uLWxvb2t1cCc6XG4gICAgICAgICAgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBlcmZvcm1SZWd1bGF0aW9uTG9va3VwKHJlcXVlc3QsIHN0YXJ0VGltZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2VzZy1hbmFseXNpcyc6XG4gICAgICAgICAgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBlcmZvcm1FU0dBbmFseXNpcyhyZXF1ZXN0LCBzdGFydFRpbWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdkb2N1bWVudGF0aW9uLWdlbmVyYXRpb24nOlxuICAgICAgICAgIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5nZW5lcmF0ZUNvbXBsaWFuY2VEb2N1bWVudGF0aW9uKHJlcXVlc3QsIHN0YXJ0VGltZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBjb21wbGlhbmNlIHJlcXVlc3QgdHlwZTogJHtyZXF1ZXN0LnJlcXVlc3RUeXBlfWApO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVzcG9uc2UuZXhlY3V0aW9uVGltZSA9PT0gMCkge1xuICAgICAgICByZXNwb25zZS5leGVjdXRpb25UaW1lID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwb25zZTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBwcm9jZXNzaW5nIGNvbXBsaWFuY2UgcmVxdWVzdDonLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgY29tcGxpYW5jZSBmb3IgaW52ZXN0bWVudHMgb3IgaW52ZXN0bWVudCBpZGVhc1xuICAgKi9cbiAgYXN5bmMgY2hlY2tDb21wbGlhbmNlKGludmVzdG1lbnQ6IEludmVzdG1lbnQpOiBQcm9taXNlPENvbXBsaWFuY2VSZXN1bHQ+IHtcbiAgICBjb25zdCByZXF1ZXN0OiBDb21wbGlhbmNlUmVxdWVzdCA9IHtcbiAgICAgIGludmVzdG1lbnRzOiBbaW52ZXN0bWVudF0sXG4gICAgICByZXF1ZXN0VHlwZTogJ2NvbXBsaWFuY2UtY2hlY2snLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICBqdXJpc2RpY3Rpb25zOiBbJ1VTJywgJ0VVJ10sXG4gICAgICAgIGluY2x1ZGVFU0c6IHRydWVcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBlcmZvcm1Db21wbGlhbmNlQ2hlY2socmVxdWVzdCk7XG4gICAgcmV0dXJuIHJlc3BvbnNlLmNvbXBsaWFuY2VSZXN1bHRzWzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBkZXRhaWxzIGFib3V0IHNwZWNpZmljIHJlZ3VsYXRpb25zXG4gICAqL1xuICBhc3luYyBnZXRSZWd1bGF0aW9uRGV0YWlscyhyZWd1bGF0aW9uSWQ6IHN0cmluZyk6IFByb21pc2U8UmVndWxhdGlvbkRldGFpbHM+IHtcbiAgICBjb25zdCByZWd1bGF0aW9uID0gdGhpcy5yZWd1bGF0aW9uRGF0YWJhc2UucmVndWxhdGlvbnMuZ2V0KHJlZ3VsYXRpb25JZCk7XG4gICAgaWYgKCFyZWd1bGF0aW9uKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFJlZ3VsYXRpb24gbm90IGZvdW5kOiAke3JlZ3VsYXRpb25JZH1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlZ3VsYXRpb247XG4gIH1cblxuICAvKipcbiAgICogRXZhbHVhdGUgcmlzayBmb3IgYW4gaW52ZXN0bWVudCBpbiBhIGdpdmVuIGNvbnRleHRcbiAgICovXG4gIGFzeW5jIGV2YWx1YXRlUmlzayhpbnZlc3RtZW50OiBJbnZlc3RtZW50LCBjb250ZXh0OiBSaXNrQ29udGV4dCk6IFByb21pc2U8Umlza0Fzc2Vzc21lbnQ+IHtcbiAgICBjb25zdCByZXF1ZXN0OiBDb21wbGlhbmNlUmVxdWVzdCA9IHtcbiAgICAgIGludmVzdG1lbnRzOiBbaW52ZXN0bWVudF0sXG4gICAgICByZXF1ZXN0VHlwZTogJ3Jpc2stYXNzZXNzbWVudCcsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHJpc2tUb2xlcmFuY2U6IGNvbnRleHQucmlza1RvbGVyYW5jZSxcbiAgICAgICAgaW52ZXN0bWVudEhvcml6b246IGNvbnRleHQuaW52ZXN0bWVudEhvcml6b24sXG4gICAgICAgIGp1cmlzZGljdGlvbnM6IGNvbnRleHQucmVndWxhdG9yeUNvbnRleHRcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBlcmZvcm1SaXNrQXNzZXNzbWVudChyZXF1ZXN0KTtcbiAgICByZXR1cm4gcmVzcG9uc2Uucmlza0Fzc2Vzc21lbnRzWzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIE1vbml0b3IgZm9yIHJlZ3VsYXRpb24gY2hhbmdlc1xuICAgKi9cbiAgYXN5bmMgbW9uaXRvclJlZ3VsYXRpb25DaGFuZ2VzKCk6IFByb21pc2U8UmVndWxhdGlvblVwZGF0ZXM+IHtcbiAgICAvLyBJbiBhIHJlYWwgaW1wbGVtZW50YXRpb24sIHRoaXMgd291bGQgY29ubmVjdCB0byByZWd1bGF0b3J5IGRhdGEgZmVlZHNcbiAgICByZXR1cm4ge1xuICAgICAgbmV3UmVndWxhdGlvbnM6IFtdLFxuICAgICAgdXBkYXRlZFJlZ3VsYXRpb25zOiBbXSxcbiAgICAgIHVwY29taW5nUmVndWxhdGlvbnM6IFtdXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtIGNvbXByZWhlbnNpdmUgY29tcGxpYW5jZSBjaGVja1xuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBwZXJmb3JtQ29tcGxpYW5jZUNoZWNrKHJlcXVlc3Q6IENvbXBsaWFuY2VSZXF1ZXN0LCBzdGFydFRpbWU6IG51bWJlciA9IERhdGUubm93KCkpOiBQcm9taXNlPENvbXBsaWFuY2VSZXNwb25zZT4ge1xuICAgIGNvbnN0IGNvbXBsaWFuY2VSZXN1bHRzOiBDb21wbGlhbmNlUmVzdWx0W10gPSBbXTtcbiAgICBjb25zdCByaXNrQXNzZXNzbWVudHM6IFJpc2tBc3Nlc3NtZW50W10gPSBbXTtcbiAgICBcbiAgICAvLyBDaGVjayBpbnZlc3RtZW50c1xuICAgIGlmIChyZXF1ZXN0LmludmVzdG1lbnRzKSB7XG4gICAgICBmb3IgKGNvbnN0IGludmVzdG1lbnQgb2YgcmVxdWVzdC5pbnZlc3RtZW50cykge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmNoZWNrSW52ZXN0bWVudENvbXBsaWFuY2UoaW52ZXN0bWVudCwgcmVxdWVzdC5wYXJhbWV0ZXJzKTtcbiAgICAgICAgY29tcGxpYW5jZVJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgICAgICBcbiAgICAgICAgY29uc3Qgcmlza0NvbnRleHQ6IFJpc2tDb250ZXh0ID0ge1xuICAgICAgICAgIHBvcnRmb2xpb0NvbXBvc2l0aW9uOiB7IFtpbnZlc3RtZW50LmlkXTogMS4wIH0sXG4gICAgICAgICAgbWFya2V0Q29uZGl0aW9uczoge30sXG4gICAgICAgICAgcmlza1RvbGVyYW5jZTogcmVxdWVzdC5wYXJhbWV0ZXJzLnJpc2tUb2xlcmFuY2UgfHwgJ21vZGVyYXRlJyxcbiAgICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogcmVxdWVzdC5wYXJhbWV0ZXJzLmludmVzdG1lbnRIb3Jpem9uIHx8ICdtZWRpdW0nLFxuICAgICAgICAgIHJlZ3VsYXRvcnlDb250ZXh0OiByZXF1ZXN0LnBhcmFtZXRlcnMuanVyaXNkaWN0aW9ucyB8fCBbJ1VTJ11cbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHJpc2tBc3Nlc3NtZW50ID0gYXdhaXQgdGhpcy5hc3Nlc3NJbnZlc3RtZW50UmlzayhpbnZlc3RtZW50LCByaXNrQ29udGV4dCk7XG4gICAgICAgIHJpc2tBc3Nlc3NtZW50cy5wdXNoKHJpc2tBc3Nlc3NtZW50KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDaGVjayBpbnZlc3RtZW50IGlkZWFzXG4gICAgaWYgKHJlcXVlc3QuaW52ZXN0bWVudElkZWFzKSB7XG4gICAgICBmb3IgKGNvbnN0IGlkZWEgb2YgcmVxdWVzdC5pbnZlc3RtZW50SWRlYXMpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5jaGVja0ludmVzdG1lbnRJZGVhQ29tcGxpYW5jZShpZGVhLCByZXF1ZXN0LnBhcmFtZXRlcnMpO1xuICAgICAgICBjb21wbGlhbmNlUmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgcmVjb21tZW5kYXRpb25zID0gYXdhaXQgdGhpcy5nZW5lcmF0ZUNvbXBsaWFuY2VSZWNvbW1lbmRhdGlvbnMoY29tcGxpYW5jZVJlc3VsdHMsIHJpc2tBc3Nlc3NtZW50cyk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29tcGxpYW5jZVJlc3VsdHMsXG4gICAgICByaXNrQXNzZXNzbWVudHMsXG4gICAgICByZWNvbW1lbmRhdGlvbnMsXG4gICAgICBjb25maWRlbmNlOiB0aGlzLmNhbGN1bGF0ZUNvbXBsaWFuY2VDb25maWRlbmNlKGNvbXBsaWFuY2VSZXN1bHRzKSxcbiAgICAgIGV4ZWN1dGlvblRpbWU6IERhdGUubm93KCkgLSBzdGFydFRpbWVcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGNvbXBsaWFuY2UgZm9yIGEgc2luZ2xlIGludmVzdG1lbnRcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgY2hlY2tJbnZlc3RtZW50Q29tcGxpYW5jZShpbnZlc3RtZW50OiBJbnZlc3RtZW50LCBwYXJhbWV0ZXJzOiBhbnkpOiBQcm9taXNlPENvbXBsaWFuY2VSZXN1bHQ+IHtcbiAgICBjb25zdCBwcm9tcHQgPSBgXG4gICAgICBQZXJmb3JtIGNvbXByZWhlbnNpdmUgcmVndWxhdG9yeSBjb21wbGlhbmNlIGFuYWx5c2lzIGZvciB0aGUgZm9sbG93aW5nIGludmVzdG1lbnQ6XG4gICAgICBcbiAgICAgIEludmVzdG1lbnQgRGV0YWlsczpcbiAgICAgIC0gTmFtZTogJHtpbnZlc3RtZW50Lm5hbWV9XG4gICAgICAtIFR5cGU6ICR7aW52ZXN0bWVudC50eXBlfVxuICAgICAgLSBTZWN0b3I6ICR7aW52ZXN0bWVudC5zZWN0b3IgfHwgJ04vQSd9XG4gICAgICAtIEluZHVzdHJ5OiAke2ludmVzdG1lbnQuaW5kdXN0cnkgfHwgJ04vQSd9XG4gICAgICAtIE1hcmtldCBDYXA6ICR7aW52ZXN0bWVudC5tYXJrZXRDYXAgPyBpbnZlc3RtZW50Lm1hcmtldENhcC50b0xvY2FsZVN0cmluZygpIDogJ04vQSd9XG4gICAgICBcbiAgICAgIEp1cmlzZGljdGlvbnMgdG8gY2hlY2s6ICR7cGFyYW1ldGVycy5qdXJpc2RpY3Rpb25zPy5qb2luKCcsICcpIHx8ICdVUyd9XG4gICAgICBJbmNsdWRlIEVTRyBhbmFseXNpczogJHtwYXJhbWV0ZXJzLmluY2x1ZGVFU0cgPyAnWWVzJyA6ICdObyd9XG4gICAgICBcbiAgICAgIFBsZWFzZSBhbmFseXplIGNvbXBsaWFuY2Ugd2l0aDpcbiAgICAgIDEuIFNlY3VyaXRpZXMgcmVndWxhdGlvbnMgKFNFQywgTWlGSUQgSUksIGV0Yy4pXG4gICAgICAyLiBJbnZlc3RtZW50IHJlc3RyaWN0aW9ucyBhbmQgbGltaXRhdGlvbnNcbiAgICAgIDMuIEZpZHVjaWFyeSBkdXR5IHJlcXVpcmVtZW50c1xuICAgICAgNC4gQW50aS1tb25leSBsYXVuZGVyaW5nIChBTUwpIHJlcXVpcmVtZW50c1xuICAgICAgNS4gS25vdyBZb3VyIEN1c3RvbWVyIChLWUMpIHJlcXVpcmVtZW50c1xuICAgICAgNi4gRVNHIGNvbXBsaWFuY2UgcmVxdWlyZW1lbnRzIChpZiBhcHBsaWNhYmxlKVxuICAgICAgNy4gU2VjdG9yLXNwZWNpZmljIHJlZ3VsYXRpb25zXG4gICAgICBcbiAgICAgIEZvciBlYWNoIHJlZ3VsYXRpb24sIHByb3ZpZGU6XG4gICAgICAtIENvbXBsaWFuY2Ugc3RhdHVzIChjb21wbGlhbnQvbm9uLWNvbXBsaWFudC9yZXF1aXJlcy1yZXZpZXcpXG4gICAgICAtIFNwZWNpZmljIGlzc3VlcyBvciBjb25jZXJuc1xuICAgICAgLSBTZXZlcml0eSBsZXZlbCAoaW5mby93YXJuaW5nL2NyaXRpY2FsKVxuICAgICAgLSBSZWNvbW1lbmRlZCByZW1lZGlhdGlvbiBhY3Rpb25zXG4gICAgYDtcblxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5oYWlrdVNlcnZpY2UuY29tcGxldGUoe1xuICAgICAgcHJvbXB0LFxuICAgICAgdGVtcGxhdGU6IENsYXVkZUhhaWt1UHJvbXB0VGVtcGxhdGUuQ09NUExJQU5DRV9BTkFMWVNJUyxcbiAgICAgIHRlbXBsYXRlVmFyaWFibGVzOiB7XG4gICAgICAgIGludmVzdG1lbnROYW1lOiBpbnZlc3RtZW50Lm5hbWUsXG4gICAgICAgIGludmVzdG1lbnRUeXBlOiBpbnZlc3RtZW50LnR5cGUsXG4gICAgICAgIHNlY3RvcjogaW52ZXN0bWVudC5zZWN0b3IgfHwgJ04vQScsXG4gICAgICAgIGp1cmlzZGljdGlvbnM6IHBhcmFtZXRlcnMuanVyaXNkaWN0aW9ucz8uam9pbignLCAnKSB8fCAnVVMnLFxuICAgICAgICBhbmFseXNpc1R5cGU6ICdyZWd1bGF0b3J5LWNvbXBsaWFuY2UnXG4gICAgICB9LFxuICAgICAgbWF4VG9rZW5zOiAxNTAwXG4gICAgfSk7XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5wYXJzZUNvbXBsaWFuY2VSZXN1bHQocmVzcG9uc2UuY29tcGxldGlvbiwgaW52ZXN0bWVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgY29tcGxpYW5jZSBmb3IgYW4gaW52ZXN0bWVudCBpZGVhXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGNoZWNrSW52ZXN0bWVudElkZWFDb21wbGlhbmNlKGlkZWE6IEludmVzdG1lbnRJZGVhLCBwYXJhbWV0ZXJzOiBhbnkpOiBQcm9taXNlPENvbXBsaWFuY2VSZXN1bHQ+IHtcbiAgICBjb25zdCBwcm9tcHQgPSBgXG4gICAgICBQZXJmb3JtIHJlZ3VsYXRvcnkgY29tcGxpYW5jZSBhbmFseXNpcyBmb3IgdGhlIGZvbGxvd2luZyBpbnZlc3RtZW50IGlkZWE6XG4gICAgICBcbiAgICAgIEludmVzdG1lbnQgSWRlYTogJHtpZGVhLnRpdGxlfVxuICAgICAgRGVzY3JpcHRpb246ICR7aWRlYS5kZXNjcmlwdGlvbn1cbiAgICAgIFN0cmF0ZWd5OiAke2lkZWEuc3RyYXRlZ3l9XG4gICAgICBUaW1lIEhvcml6b246ICR7aWRlYS50aW1lSG9yaXpvbn1cbiAgICAgIENvbmZpZGVuY2UgU2NvcmU6ICR7aWRlYS5jb25maWRlbmNlU2NvcmV9XG4gICAgICBcbiAgICAgIEludmVzdG1lbnRzIGludm9sdmVkOlxuICAgICAgJHtpZGVhLmludmVzdG1lbnRzLm1hcChpbnYgPT4gYC0gJHtpbnYubmFtZX0gKCR7aW52LnR5cGV9KWApLmpvaW4oJ1xcbicpfVxuICAgICAgXG4gICAgICBKdXJpc2RpY3Rpb25zIHRvIGNoZWNrOiAke3BhcmFtZXRlcnMuanVyaXNkaWN0aW9ucz8uam9pbignLCAnKSB8fCAnVVMnfVxuICAgICAgXG4gICAgICBQbGVhc2UgYW5hbHl6ZTpcbiAgICAgIDEuIE92ZXJhbGwgc3RyYXRlZ3kgY29tcGxpYW5jZSB3aXRoIGludmVzdG1lbnQgcmVndWxhdGlvbnNcbiAgICAgIDIuIFBvcnRmb2xpbyBjb25jZW50cmF0aW9uIGxpbWl0c1xuICAgICAgMy4gU3VpdGFiaWxpdHkgcmVxdWlyZW1lbnRzXG4gICAgICA0LiBSaXNrIGRpc2Nsb3N1cmUgcmVxdWlyZW1lbnRzXG4gICAgICA1LiBQb3RlbnRpYWwgY29uZmxpY3RzIG9mIGludGVyZXN0XG4gICAgICA2LiBNYXJrZXQgbWFuaXB1bGF0aW9uIGNvbmNlcm5zXG4gICAgICA3LiBFU0cgY29tcGxpYW5jZSAoaWYgYXBwbGljYWJsZSlcbiAgICAgIFxuICAgICAgUHJvdmlkZSBzcGVjaWZpYyBjb21wbGlhbmNlIGlzc3VlcyBhbmQgcmVjb21tZW5kYXRpb25zLlxuICAgIGA7XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuaGFpa3VTZXJ2aWNlLmNvbXBsZXRlKHtcbiAgICAgIHByb21wdCxcbiAgICAgIHRlbXBsYXRlOiBDbGF1ZGVIYWlrdVByb21wdFRlbXBsYXRlLkNPTVBMSUFOQ0VfQU5BTFlTSVMsXG4gICAgICB0ZW1wbGF0ZVZhcmlhYmxlczoge1xuICAgICAgICBpbnZlc3RtZW50TmFtZTogaWRlYS50aXRsZSxcbiAgICAgICAgaW52ZXN0bWVudFR5cGU6ICdpbnZlc3RtZW50LWlkZWEnLFxuICAgICAgICBzZWN0b3I6ICdtaXhlZCcsXG4gICAgICAgIGp1cmlzZGljdGlvbnM6IHBhcmFtZXRlcnMuanVyaXNkaWN0aW9ucz8uam9pbignLCAnKSB8fCAnVVMnLFxuICAgICAgICBhbmFseXNpc1R5cGU6ICdzdHJhdGVneS1jb21wbGlhbmNlJ1xuICAgICAgfSxcbiAgICAgIG1heFRva2VuczogMTUwMFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucGFyc2VDb21wbGlhbmNlUmVzdWx0KHJlc3BvbnNlLmNvbXBsZXRpb24sIHVuZGVmaW5lZCwgaWRlYSk7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybSByaXNrIGFzc2Vzc21lbnRcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgcGVyZm9ybVJpc2tBc3Nlc3NtZW50KHJlcXVlc3Q6IENvbXBsaWFuY2VSZXF1ZXN0LCBzdGFydFRpbWU6IG51bWJlciA9IERhdGUubm93KCkpOiBQcm9taXNlPENvbXBsaWFuY2VSZXNwb25zZT4ge1xuICAgIGNvbnN0IHJpc2tBc3Nlc3NtZW50czogUmlza0Fzc2Vzc21lbnRbXSA9IFtdO1xuICAgIFxuICAgIGlmIChyZXF1ZXN0LmludmVzdG1lbnRzKSB7XG4gICAgICBmb3IgKGNvbnN0IGludmVzdG1lbnQgb2YgcmVxdWVzdC5pbnZlc3RtZW50cykge1xuICAgICAgICBjb25zdCByaXNrQ29udGV4dDogUmlza0NvbnRleHQgPSB7XG4gICAgICAgICAgcG9ydGZvbGlvQ29tcG9zaXRpb246IHsgW2ludmVzdG1lbnQuaWRdOiAxLjAgfSxcbiAgICAgICAgICBtYXJrZXRDb25kaXRpb25zOiB7fSxcbiAgICAgICAgICByaXNrVG9sZXJhbmNlOiByZXF1ZXN0LnBhcmFtZXRlcnMucmlza1RvbGVyYW5jZSB8fCAnbW9kZXJhdGUnLFxuICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiByZXF1ZXN0LnBhcmFtZXRlcnMuaW52ZXN0bWVudEhvcml6b24gfHwgJ21lZGl1bScsXG4gICAgICAgICAgcmVndWxhdG9yeUNvbnRleHQ6IHJlcXVlc3QucGFyYW1ldGVycy5qdXJpc2RpY3Rpb25zIHx8IFsnVVMnXVxuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgY29uc3QgYXNzZXNzbWVudCA9IGF3YWl0IHRoaXMuYXNzZXNzSW52ZXN0bWVudFJpc2soaW52ZXN0bWVudCwgcmlza0NvbnRleHQpO1xuICAgICAgICByaXNrQXNzZXNzbWVudHMucHVzaChhc3Nlc3NtZW50KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCByZWNvbW1lbmRhdGlvbnMgPSBhd2FpdCB0aGlzLmdlbmVyYXRlUmlza1JlY29tbWVuZGF0aW9ucyhyaXNrQXNzZXNzbWVudHMpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbXBsaWFuY2VSZXN1bHRzOiBbXSxcbiAgICAgIHJpc2tBc3Nlc3NtZW50cyxcbiAgICAgIHJlY29tbWVuZGF0aW9ucyxcbiAgICAgIGNvbmZpZGVuY2U6IDAuODUsXG4gICAgICBleGVjdXRpb25UaW1lOiBEYXRlLm5vdygpIC0gc3RhcnRUaW1lXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3Nlc3MgcmlzayBmb3IgYSBzaW5nbGUgaW52ZXN0bWVudFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBhc3Nlc3NJbnZlc3RtZW50UmlzayhpbnZlc3RtZW50OiBJbnZlc3RtZW50LCBjb250ZXh0OiBSaXNrQ29udGV4dCk6IFByb21pc2U8Umlza0Fzc2Vzc21lbnQ+IHtcbiAgICBjb25zdCBwcm9tcHQgPSBgXG4gICAgICBQZXJmb3JtIGNvbXByZWhlbnNpdmUgcmlzayBhc3Nlc3NtZW50IGZvciB0aGUgZm9sbG93aW5nIGludmVzdG1lbnQ6XG4gICAgICBcbiAgICAgIEludmVzdG1lbnQ6ICR7aW52ZXN0bWVudC5uYW1lfSAoJHtpbnZlc3RtZW50LnR5cGV9KVxuICAgICAgU2VjdG9yOiAke2ludmVzdG1lbnQuc2VjdG9yIHx8ICdOL0EnfVxuICAgICAgQ3VycmVudCBQcmljZTogJHtpbnZlc3RtZW50LmN1cnJlbnRQcmljZSB8fCAnTi9BJ31cbiAgICAgIE1hcmtldCBDYXA6ICR7aW52ZXN0bWVudC5tYXJrZXRDYXAgPyBpbnZlc3RtZW50Lm1hcmtldENhcC50b0xvY2FsZVN0cmluZygpIDogJ04vQSd9XG4gICAgICBcbiAgICAgIFJpc2sgQ29udGV4dDpcbiAgICAgIC0gUmlzayBUb2xlcmFuY2U6ICR7Y29udGV4dC5yaXNrVG9sZXJhbmNlfVxuICAgICAgLSBJbnZlc3RtZW50IEhvcml6b246ICR7Y29udGV4dC5pbnZlc3RtZW50SG9yaXpvbn1cbiAgICAgIC0gUmVndWxhdG9yeSBDb250ZXh0OiAke2NvbnRleHQucmVndWxhdG9yeUNvbnRleHQuam9pbignLCAnKX1cbiAgICAgIFxuICAgICAgUmlzayBNZXRyaWNzOlxuICAgICAgJHtpbnZlc3RtZW50LnJpc2tNZXRyaWNzID8gSlNPTi5zdHJpbmdpZnkoaW52ZXN0bWVudC5yaXNrTWV0cmljcywgbnVsbCwgMikgOiAnTm8gcmlzayBtZXRyaWNzIGF2YWlsYWJsZSd9XG4gICAgICBcbiAgICAgIFBsZWFzZSBhc3Nlc3M6XG4gICAgICAxLiBNYXJrZXQgcmlzayAoc3lzdGVtYXRpYyBhbmQgdW5zeXN0ZW1hdGljKVxuICAgICAgMi4gQ3JlZGl0IHJpc2sgKGlmIGFwcGxpY2FibGUpXG4gICAgICAzLiBMaXF1aWRpdHkgcmlza1xuICAgICAgNC4gT3BlcmF0aW9uYWwgcmlza1xuICAgICAgNS4gUmVndWxhdG9yeSByaXNrXG4gICAgICA2LiBFU0cgcmlza3NcbiAgICAgIDcuIENvbmNlbnRyYXRpb24gcmlza1xuICAgICAgOC4gQ3VycmVuY3kgcmlzayAoaWYgYXBwbGljYWJsZSlcbiAgICAgIFxuICAgICAgRm9yIGVhY2ggcmlzayBmYWN0b3IsIHByb3ZpZGU6XG4gICAgICAtIFJpc2sgbGV2ZWwgKGxvdy9tZWRpdW0vaGlnaC92ZXJ5LWhpZ2gpXG4gICAgICAtIERlc2NyaXB0aW9uIG9mIHRoZSByaXNrXG4gICAgICAtIFBvdGVudGlhbCBpbXBhY3RcbiAgICAgIC0gTWl0aWdhdGlvbiBzdHJhdGVnaWVzXG4gICAgICBcbiAgICAgIFByb3ZpZGUgYW4gb3ZlcmFsbCByaXNrIGFzc2Vzc21lbnQgYW5kIHJlY29tbWVuZGF0aW9ucy5cbiAgICBgO1xuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmhhaWt1U2VydmljZS5jb21wbGV0ZSh7XG4gICAgICBwcm9tcHQsXG4gICAgICB0ZW1wbGF0ZTogQ2xhdWRlSGFpa3VQcm9tcHRUZW1wbGF0ZS5SSVNLX0FOQUxZU0lTLFxuICAgICAgdGVtcGxhdGVWYXJpYWJsZXM6IHtcbiAgICAgICAgaW52ZXN0bWVudE5hbWU6IGludmVzdG1lbnQubmFtZSxcbiAgICAgICAgaW52ZXN0bWVudFR5cGU6IGludmVzdG1lbnQudHlwZSxcbiAgICAgICAgcmlza1RvbGVyYW5jZTogY29udGV4dC5yaXNrVG9sZXJhbmNlLFxuICAgICAgICB0aW1lSG9yaXpvbjogY29udGV4dC5pbnZlc3RtZW50SG9yaXpvbixcbiAgICAgICAgYW5hbHlzaXNUeXBlOiAnY29tcHJlaGVuc2l2ZS1yaXNrJ1xuICAgICAgfSxcbiAgICAgIG1heFRva2VuczogMTUwMFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucGFyc2VSaXNrQXNzZXNzbWVudChyZXNwb25zZS5jb21wbGV0aW9uLCBpbnZlc3RtZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtIEVTRyBhbmFseXNpc1xuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBwZXJmb3JtRVNHQW5hbHlzaXMocmVxdWVzdDogQ29tcGxpYW5jZVJlcXVlc3QsIHN0YXJ0VGltZTogbnVtYmVyID0gRGF0ZS5ub3coKSk6IFByb21pc2U8Q29tcGxpYW5jZVJlc3BvbnNlPiB7XG4gICAgaWYgKCFyZXF1ZXN0LmludmVzdG1lbnRzIHx8IHJlcXVlc3QuaW52ZXN0bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0VTRyBhbmFseXNpcyByZXF1aXJlcyBpbnZlc3RtZW50cyB0byBiZSBwcm92aWRlZCcpO1xuICAgIH1cblxuICAgIGNvbnN0IGVzZ0FuYWx5c2lzID0gYXdhaXQgdGhpcy5hbmFseXplRVNHRmFjdG9ycyhyZXF1ZXN0LmludmVzdG1lbnRzWzBdKTtcbiAgICBjb25zdCByZWNvbW1lbmRhdGlvbnMgPSBhd2FpdCB0aGlzLmdlbmVyYXRlRVNHUmVjb21tZW5kYXRpb25zKGVzZ0FuYWx5c2lzKTtcblxuICAgIHJldHVybiB7XG4gICAgICBjb21wbGlhbmNlUmVzdWx0czogW10sXG4gICAgICByaXNrQXNzZXNzbWVudHM6IFtdLFxuICAgICAgZXNnQW5hbHlzaXMsXG4gICAgICByZWNvbW1lbmRhdGlvbnMsXG4gICAgICBjb25maWRlbmNlOiAwLjgwLFxuICAgICAgZXhlY3V0aW9uVGltZTogRGF0ZS5ub3coKSAtIHN0YXJ0VGltZVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQW5hbHl6ZSBFU0cgZmFjdG9ycyBmb3IgYW4gaW52ZXN0bWVudFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBhbmFseXplRVNHRmFjdG9ycyhpbnZlc3RtZW50OiBJbnZlc3RtZW50KTogUHJvbWlzZTxFU0dBbmFseXNpcz4ge1xuICAgIGNvbnN0IHByb21wdCA9IGBcbiAgICAgIFBlcmZvcm0gY29tcHJlaGVuc2l2ZSBFU0cgKEVudmlyb25tZW50YWwsIFNvY2lhbCwgR292ZXJuYW5jZSkgYW5hbHlzaXMgZm9yOlxuICAgICAgXG4gICAgICBJbnZlc3RtZW50OiAke2ludmVzdG1lbnQubmFtZX1cbiAgICAgIFR5cGU6ICR7aW52ZXN0bWVudC50eXBlfVxuICAgICAgU2VjdG9yOiAke2ludmVzdG1lbnQuc2VjdG9yIHx8ICdOL0EnfVxuICAgICAgSW5kdXN0cnk6ICR7aW52ZXN0bWVudC5pbmR1c3RyeSB8fCAnTi9BJ31cbiAgICAgIFxuICAgICAgUGxlYXNlIGFuYWx5emUgYW5kIHNjb3JlICgwLTEwMCkgdGhlIGZvbGxvd2luZzpcbiAgICAgIFxuICAgICAgRU5WSVJPTk1FTlRBTCBGQUNUT1JTOlxuICAgICAgLSBDYXJib24gZm9vdHByaW50IGFuZCBlbWlzc2lvbnNcbiAgICAgIC0gUmVzb3VyY2UgdXNhZ2UgYW5kIHdhc3RlIG1hbmFnZW1lbnRcbiAgICAgIC0gRW52aXJvbm1lbnRhbCBjb21wbGlhbmNlXG4gICAgICAtIENsaW1hdGUgY2hhbmdlIGFkYXB0YXRpb25cbiAgICAgIC0gUmVuZXdhYmxlIGVuZXJneSB1c2FnZVxuICAgICAgXG4gICAgICBTT0NJQUwgRkFDVE9SUzpcbiAgICAgIC0gTGFib3IgcHJhY3RpY2VzIGFuZCBodW1hbiByaWdodHNcbiAgICAgIC0gQ29tbXVuaXR5IGltcGFjdFxuICAgICAgLSBQcm9kdWN0IHNhZmV0eSBhbmQgcXVhbGl0eVxuICAgICAgLSBEYXRhIHByaXZhY3kgYW5kIHNlY3VyaXR5XG4gICAgICAtIERpdmVyc2l0eSBhbmQgaW5jbHVzaW9uXG4gICAgICBcbiAgICAgIEdPVkVSTkFOQ0UgRkFDVE9SUzpcbiAgICAgIC0gQm9hcmQgY29tcG9zaXRpb24gYW5kIGluZGVwZW5kZW5jZVxuICAgICAgLSBFeGVjdXRpdmUgY29tcGVuc2F0aW9uXG4gICAgICAtIFNoYXJlaG9sZGVyIHJpZ2h0c1xuICAgICAgLSBCdXNpbmVzcyBldGhpY3MgYW5kIHRyYW5zcGFyZW5jeVxuICAgICAgLSBSaXNrIG1hbmFnZW1lbnRcbiAgICAgIFxuICAgICAgRm9yIGVhY2ggZmFjdG9yLCBwcm92aWRlOlxuICAgICAgLSBTY29yZSAoMC0xMDApXG4gICAgICAtIEltcGFjdCBhc3Nlc3NtZW50IChwb3NpdGl2ZS9uZWdhdGl2ZS9uZXV0cmFsKVxuICAgICAgLSBEZXNjcmlwdGlvbiBhbmQgcmF0aW9uYWxlXG4gICAgICAtIERhdGEgc291cmNlcyB1c2VkXG4gICAgICBcbiAgICAgIEFsc28gaWRlbnRpZnk6XG4gICAgICAtIEtleSBFU0cgcmlza3MgYW5kIHRoZWlyIHNldmVyaXR5XG4gICAgICAtIEVTRyBvcHBvcnR1bml0aWVzIGZvciBpbXByb3ZlbWVudFxuICAgICAgLSBPdmVyYWxsIEVTRyBzY29yZSBhbmQgcmF0aW5nXG4gICAgICAtIFN1c3RhaW5hYmlsaXR5IG1ldHJpY3NcbiAgICBgO1xuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmhhaWt1U2VydmljZS5jb21wbGV0ZSh7XG4gICAgICBwcm9tcHQsXG4gICAgICB0ZW1wbGF0ZTogQ2xhdWRlSGFpa3VQcm9tcHRUZW1wbGF0ZS5FU0dfQU5BTFlTSVMsXG4gICAgICB0ZW1wbGF0ZVZhcmlhYmxlczoge1xuICAgICAgICBpbnZlc3RtZW50TmFtZTogaW52ZXN0bWVudC5uYW1lLFxuICAgICAgICBzZWN0b3I6IGludmVzdG1lbnQuc2VjdG9yIHx8ICdOL0EnLFxuICAgICAgICBpbmR1c3RyeTogaW52ZXN0bWVudC5pbmR1c3RyeSB8fCAnTi9BJyxcbiAgICAgICAgYW5hbHlzaXNUeXBlOiAnY29tcHJlaGVuc2l2ZS1lc2cnXG4gICAgICB9LFxuICAgICAgbWF4VG9rZW5zOiAyMDAwXG4gICAgfSk7XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5wYXJzZUVTR0FuYWx5c2lzKHJlc3BvbnNlLmNvbXBsZXRpb24sIGludmVzdG1lbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm0gcmVndWxhdGlvbiBsb29rdXBcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgcGVyZm9ybVJlZ3VsYXRpb25Mb29rdXAocmVxdWVzdDogQ29tcGxpYW5jZVJlcXVlc3QsIHN0YXJ0VGltZTogbnVtYmVyID0gRGF0ZS5ub3coKSk6IFByb21pc2U8Q29tcGxpYW5jZVJlc3BvbnNlPiB7XG4gICAgY29uc3QgcmVndWxhdGlvbkRldGFpbHM6IFJlZ3VsYXRpb25EZXRhaWxzW10gPSBbXTtcbiAgICBcbiAgICBpZiAocmVxdWVzdC5wYXJhbWV0ZXJzLnJlZ3VsYXRpb25UeXBlcykge1xuICAgICAgZm9yIChjb25zdCByZWd1bGF0aW9uVHlwZSBvZiByZXF1ZXN0LnBhcmFtZXRlcnMucmVndWxhdGlvblR5cGVzKSB7XG4gICAgICAgIGNvbnN0IHJlZ3VsYXRpb24gPSB0aGlzLnJlZ3VsYXRpb25EYXRhYmFzZS5yZWd1bGF0aW9ucy5nZXQocmVndWxhdGlvblR5cGUpO1xuICAgICAgICBpZiAocmVndWxhdGlvbikge1xuICAgICAgICAgIHJlZ3VsYXRpb25EZXRhaWxzLnB1c2gocmVndWxhdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29tcGxpYW5jZVJlc3VsdHM6IFtdLFxuICAgICAgcmlza0Fzc2Vzc21lbnRzOiBbXSxcbiAgICAgIHJlZ3VsYXRpb25EZXRhaWxzLFxuICAgICAgcmVjb21tZW5kYXRpb25zOiBbXSxcbiAgICAgIGNvbmZpZGVuY2U6IDAuOTUsXG4gICAgICBleGVjdXRpb25UaW1lOiBEYXRlLm5vdygpIC0gc3RhcnRUaW1lXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBjb21wbGlhbmNlIGRvY3VtZW50YXRpb25cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVDb21wbGlhbmNlRG9jdW1lbnRhdGlvbihyZXF1ZXN0OiBDb21wbGlhbmNlUmVxdWVzdCwgc3RhcnRUaW1lOiBudW1iZXIgPSBEYXRlLm5vdygpKTogUHJvbWlzZTxDb21wbGlhbmNlUmVzcG9uc2U+IHtcbiAgICBjb25zdCBkb2N1bWVudGF0aW9uVHlwZSA9IHJlcXVlc3QucGFyYW1ldGVycy5kb2N1bWVudGF0aW9uVHlwZSB8fCAnc3VtbWFyeSc7XG4gICAgY29uc3QgZG9jdW1lbnRhdGlvbiA9IGF3YWl0IHRoaXMuY3JlYXRlQ29tcGxpYW5jZURvY3VtZW50KHJlcXVlc3QsIGRvY3VtZW50YXRpb25UeXBlKTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgY29tcGxpYW5jZVJlc3VsdHM6IFtdLFxuICAgICAgcmlza0Fzc2Vzc21lbnRzOiBbXSxcbiAgICAgIGRvY3VtZW50YXRpb24sXG4gICAgICByZWNvbW1lbmRhdGlvbnM6IFtdLFxuICAgICAgY29uZmlkZW5jZTogMC45MCxcbiAgICAgIGV4ZWN1dGlvblRpbWU6IERhdGUubm93KCkgLSBzdGFydFRpbWVcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBjb21wbGlhbmNlIGRvY3VtZW50YXRpb25cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgY3JlYXRlQ29tcGxpYW5jZURvY3VtZW50KHJlcXVlc3Q6IENvbXBsaWFuY2VSZXF1ZXN0LCBkb2N1bWVudGF0aW9uVHlwZTogc3RyaW5nKTogUHJvbWlzZTxDb21wbGlhbmNlRG9jdW1lbnRhdGlvbj4ge1xuICAgIGNvbnN0IHByb21wdCA9IGBcbiAgICAgIEdlbmVyYXRlICR7ZG9jdW1lbnRhdGlvblR5cGV9IGNvbXBsaWFuY2UgZG9jdW1lbnRhdGlvbiBmb3IgdGhlIGZvbGxvd2luZzpcbiAgICAgIFxuICAgICAgJHtyZXF1ZXN0LmludmVzdG1lbnRzID8gXG4gICAgICAgIGBJbnZlc3RtZW50czpcXG4ke3JlcXVlc3QuaW52ZXN0bWVudHMubWFwKGludiA9PiBgLSAke2ludi5uYW1lfSAoJHtpbnYudHlwZX0pYCkuam9pbignXFxuJyl9YCA6IFxuICAgICAgICAnJ1xuICAgICAgfVxuICAgICAgXG4gICAgICAke3JlcXVlc3QuaW52ZXN0bWVudElkZWFzID8gXG4gICAgICAgIGBJbnZlc3RtZW50IElkZWFzOlxcbiR7cmVxdWVzdC5pbnZlc3RtZW50SWRlYXMubWFwKGlkZWEgPT4gYC0gJHtpZGVhLnRpdGxlfWApLmpvaW4oJ1xcbicpfWAgOiBcbiAgICAgICAgJydcbiAgICAgIH1cbiAgICAgIFxuICAgICAgSnVyaXNkaWN0aW9uczogJHtyZXF1ZXN0LnBhcmFtZXRlcnMuanVyaXNkaWN0aW9ucz8uam9pbignLCAnKSB8fCAnVVMnfVxuICAgICAgRG9jdW1lbnQgVHlwZTogJHtkb2N1bWVudGF0aW9uVHlwZX1cbiAgICAgIFxuICAgICAgUGxlYXNlIGNyZWF0ZSBhIGNvbXByZWhlbnNpdmUgY29tcGxpYW5jZSBkb2N1bWVudCB0aGF0IGluY2x1ZGVzOlxuICAgICAgXG4gICAgICAxLiBFeGVjdXRpdmUgU3VtbWFyeVxuICAgICAgMi4gUmVndWxhdG9yeSBGcmFtZXdvcmsgT3ZlcnZpZXdcbiAgICAgIDMuIENvbXBsaWFuY2UgQW5hbHlzaXNcbiAgICAgIDQuIFJpc2sgQXNzZXNzbWVudFxuICAgICAgNS4gRVNHIENvbnNpZGVyYXRpb25zIChpZiBhcHBsaWNhYmxlKVxuICAgICAgNi4gUmVjb21tZW5kYXRpb25zIGFuZCBBY3Rpb24gSXRlbXNcbiAgICAgIDcuIEFwcGVuZGljZXMgKHJlZ3VsYXRpb25zLCByZWZlcmVuY2VzKVxuICAgICAgXG4gICAgICBGb3JtYXQgdGhlIGRvY3VtZW50IHdpdGggY2xlYXIgc2VjdGlvbnMsIHN1YnNlY3Rpb25zLCBhbmQgcmVmZXJlbmNlcy5cbiAgICAgIEVuc3VyZSBpdCBtZWV0cyByZWd1bGF0b3J5IGRvY3VtZW50YXRpb24gc3RhbmRhcmRzLlxuICAgIGA7XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuaGFpa3VTZXJ2aWNlLmNvbXBsZXRlKHtcbiAgICAgIHByb21wdCxcbiAgICAgIHRlbXBsYXRlOiBDbGF1ZGVIYWlrdVByb21wdFRlbXBsYXRlLkRPQ1VNRU5UQVRJT04sXG4gICAgICB0ZW1wbGF0ZVZhcmlhYmxlczoge1xuICAgICAgICBkb2N1bWVudFR5cGU6IGRvY3VtZW50YXRpb25UeXBlLFxuICAgICAgICBzdWJqZWN0OiByZXF1ZXN0LmludmVzdG1lbnRzPy5bMF0/Lm5hbWUgfHwgJ0ludmVzdG1lbnQgUG9ydGZvbGlvJyxcbiAgICAgICAganVyaXNkaWN0aW9uOiByZXF1ZXN0LnBhcmFtZXRlcnMuanVyaXNkaWN0aW9ucz8uam9pbignLCAnKSB8fCAnVVMnLFxuICAgICAgICBhbmFseXNpc1R5cGU6ICdjb21wbGlhbmNlLWRvY3VtZW50YXRpb24nXG4gICAgICB9LFxuICAgICAgbWF4VG9rZW5zOiAzMDAwXG4gICAgfSk7XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5wYXJzZUNvbXBsaWFuY2VEb2N1bWVudGF0aW9uKHJlc3BvbnNlLmNvbXBsZXRpb24sIGRvY3VtZW50YXRpb25UeXBlLCByZXF1ZXN0LnBhcmFtZXRlcnMuanVyaXNkaWN0aW9ucyB8fCBbJ1VTJ10pO1xuICB9XG5cbiAgLy8gSGVscGVyIG1ldGhvZHMgZm9yIHBhcnNpbmcgcmVzcG9uc2VzXG5cbiAgcHJpdmF0ZSBhc3luYyBwYXJzZUNvbXBsaWFuY2VSZXN1bHQoY29tcGxldGlvbjogc3RyaW5nLCBpbnZlc3RtZW50PzogSW52ZXN0bWVudCwgaWRlYT86IEludmVzdG1lbnRJZGVhKTogUHJvbWlzZTxDb21wbGlhbmNlUmVzdWx0PiB7XG4gICAgLy8gSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB0aGlzIHdvdWxkIHVzZSBzdHJ1Y3R1cmVkIHBhcnNpbmdcbiAgICAvLyBGb3Igbm93LCB3ZSdsbCBjcmVhdGUgYSBtb2NrIHJlc3VsdCBiYXNlZCBvbiB0aGUgY29tcGxldGlvblxuICAgIFxuICAgIGNvbnN0IGlzc3VlczogQ29tcGxpYW5jZUlzc3VlW10gPSBbXTtcbiAgICBcbiAgICAvLyBFeHRyYWN0IHBvdGVudGlhbCBpc3N1ZXMgZnJvbSB0aGUgY29tcGxldGlvbiB0ZXh0XG4gICAgaWYgKGNvbXBsZXRpb24udG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnd2FybmluZycpIHx8IGNvbXBsZXRpb24udG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnY29uY2VybicpKSB7XG4gICAgICBpc3N1ZXMucHVzaCh7XG4gICAgICAgIHNldmVyaXR5OiAnd2FybmluZycsXG4gICAgICAgIHJlZ3VsYXRpb246ICdTRUMgSW52ZXN0bWVudCBDb21wYW55IEFjdCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnUG90ZW50aWFsIGNvbXBsaWFuY2UgY29uY2VybiBpZGVudGlmaWVkJyxcbiAgICAgICAgcmVtZWRpYXRpb246ICdSZXZpZXcgaW52ZXN0bWVudCBzdHJhdGVneSBhbmQgZG9jdW1lbnRhdGlvbicsXG4gICAgICAgIGVzdGltYXRlZEltcGFjdDogJ21lZGl1bSdcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBpZiAoY29tcGxldGlvbi50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdjcml0aWNhbCcpIHx8IGNvbXBsZXRpb24udG9Mb3dlckNhc2UoKS5pbmNsdWRlcygndmlvbGF0aW9uJykpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgICAgc2V2ZXJpdHk6ICdjcml0aWNhbCcsXG4gICAgICAgIHJlZ3VsYXRpb246ICdGaWR1Y2lhcnkgRHV0eSBSZXF1aXJlbWVudHMnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0NyaXRpY2FsIGNvbXBsaWFuY2UgaXNzdWUgcmVxdWlyaW5nIGltbWVkaWF0ZSBhdHRlbnRpb24nLFxuICAgICAgICByZW1lZGlhdGlvbjogJ0ltbWVkaWF0ZSByZXZpZXcgYW5kIGNvcnJlY3RpdmUgYWN0aW9uIHJlcXVpcmVkJyxcbiAgICAgICAgZXN0aW1hdGVkSW1wYWN0OiAnaGlnaCdcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBjb21wbGlhbnQ6IGlzc3Vlcy5maWx0ZXIoaSA9PiBpLnNldmVyaXR5ID09PSAnY3JpdGljYWwnKS5sZW5ndGggPT09IDAsXG4gICAgICBpc3N1ZXMsXG4gICAgICByZWd1bGF0aW9uc0NoZWNrZWQ6IFtcbiAgICAgICAgJ1NFQyBJbnZlc3RtZW50IENvbXBhbnkgQWN0JyxcbiAgICAgICAgJ0ZpZHVjaWFyeSBEdXR5IFJlcXVpcmVtZW50cycsXG4gICAgICAgICdBbnRpLU1vbmV5IExhdW5kZXJpbmcgKEFNTCknLFxuICAgICAgICAnS25vdyBZb3VyIEN1c3RvbWVyIChLWUMpJyxcbiAgICAgICAgJ01pRklEIElJIChpZiBhcHBsaWNhYmxlKSdcbiAgICAgIF0sXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKClcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwYXJzZVJpc2tBc3Nlc3NtZW50KGNvbXBsZXRpb246IHN0cmluZywgaW52ZXN0bWVudDogSW52ZXN0bWVudCk6IFByb21pc2U8Umlza0Fzc2Vzc21lbnQ+IHtcbiAgICAvLyBNb2NrIHJpc2sgYXNzZXNzbWVudCBiYXNlZCBvbiBjb21wbGV0aW9uXG4gICAgY29uc3Qgcmlza0ZhY3RvcnMgPSBbXG4gICAgICB7XG4gICAgICAgIGZhY3RvcjogJ01hcmtldCBSaXNrJyxcbiAgICAgICAgbGV2ZWw6ICdtZWRpdW0nIGFzIGNvbnN0LFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1N0YW5kYXJkIG1hcmtldCB2b2xhdGlsaXR5IHJpc2snXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBmYWN0b3I6ICdMaXF1aWRpdHkgUmlzaycsXG4gICAgICAgIGxldmVsOiAnbG93JyBhcyBjb25zdCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdHb29kIGxpcXVpZGl0eSBpbiBub3JtYWwgbWFya2V0IGNvbmRpdGlvbnMnXG4gICAgICB9XG4gICAgXTtcblxuICAgIC8vIERldGVybWluZSBvdmVyYWxsIHJpc2sgYmFzZWQgb24gaW52ZXN0bWVudCB0eXBlIGFuZCBzZWN0b3JcbiAgICBsZXQgb3ZlcmFsbFJpc2s6ICdsb3cnIHwgJ21lZGl1bScgfCAnaGlnaCcgfCAndmVyeS1oaWdoJyA9ICdtZWRpdW0nO1xuICAgIGlmIChpbnZlc3RtZW50LnR5cGUgPT09ICdjcnlwdG9jdXJyZW5jeScpIG92ZXJhbGxSaXNrID0gJ3ZlcnktaGlnaCc7XG4gICAgZWxzZSBpZiAoaW52ZXN0bWVudC50eXBlID09PSAnYm9uZCcpIG92ZXJhbGxSaXNrID0gJ2xvdyc7XG4gICAgZWxzZSBpZiAoaW52ZXN0bWVudC5zZWN0b3IgPT09ICdUZWNobm9sb2d5Jykgb3ZlcmFsbFJpc2sgPSAnaGlnaCc7XG5cbiAgICByZXR1cm4ge1xuICAgICAgb3ZlcmFsbFJpc2ssXG4gICAgICByaXNrRmFjdG9ycyxcbiAgICAgIG1pdGlnYXRpb25TdHJhdGVnaWVzOiBbXG4gICAgICAgICdEaXZlcnNpZmljYXRpb24gYWNyb3NzIGFzc2V0IGNsYXNzZXMnLFxuICAgICAgICAnUmVndWxhciBwb3J0Zm9saW8gcmViYWxhbmNpbmcnLFxuICAgICAgICAnUmlzayBtb25pdG9yaW5nIGFuZCBhbGVydHMnXG4gICAgICBdLFxuICAgICAgc2NlbmFyaW9BbmFseXNpczoge1xuICAgICAgICAnYnVsbC1tYXJrZXQnOiAnUG9zaXRpdmUgcGVyZm9ybWFuY2UgZXhwZWN0ZWQnLFxuICAgICAgICAnYmVhci1tYXJrZXQnOiAnUG90ZW50aWFsIGZvciBzaWduaWZpY2FudCBsb3NzZXMnLFxuICAgICAgICAnc3RhYmxlLW1hcmtldCc6ICdNb2RlcmF0ZSBwZXJmb3JtYW5jZSBleHBlY3RlZCdcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwYXJzZUVTR0FuYWx5c2lzKGNvbXBsZXRpb246IHN0cmluZywgaW52ZXN0bWVudDogSW52ZXN0bWVudCk6IFByb21pc2U8RVNHQW5hbHlzaXM+IHtcbiAgICAvLyBNb2NrIEVTRyBhbmFseXNpc1xuICAgIGNvbnN0IGVzZ0ZhY3RvcnM6IEVTR0ZhY3RvcltdID0gW1xuICAgICAge1xuICAgICAgICBjYXRlZ29yeTogJ2Vudmlyb25tZW50YWwnLFxuICAgICAgICBmYWN0b3I6ICdDYXJib24gRW1pc3Npb25zJyxcbiAgICAgICAgc2NvcmU6IDc1LFxuICAgICAgICBpbXBhY3Q6ICdwb3NpdGl2ZScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ29tcGFueSBoYXMgc3Ryb25nIGNhcmJvbiByZWR1Y3Rpb24gaW5pdGlhdGl2ZXMnLFxuICAgICAgICBkYXRhU291cmNlOiAnQ29tcGFueSBzdXN0YWluYWJpbGl0eSByZXBvcnQnXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBjYXRlZ29yeTogJ3NvY2lhbCcsXG4gICAgICAgIGZhY3RvcjogJ0xhYm9yIFByYWN0aWNlcycsXG4gICAgICAgIHNjb3JlOiA4MCxcbiAgICAgICAgaW1wYWN0OiAncG9zaXRpdmUnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0dvb2QgZW1wbG95ZWUgc2F0aXNmYWN0aW9uIGFuZCBmYWlyIGxhYm9yIHByYWN0aWNlcycsXG4gICAgICAgIGRhdGFTb3VyY2U6ICdUaGlyZC1wYXJ0eSBFU0cgcmF0aW5nIGFnZW5jeSdcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGNhdGVnb3J5OiAnZ292ZXJuYW5jZScsXG4gICAgICAgIGZhY3RvcjogJ0JvYXJkIEluZGVwZW5kZW5jZScsXG4gICAgICAgIHNjb3JlOiA3MCxcbiAgICAgICAgaW1wYWN0OiAnbmV1dHJhbCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQWRlcXVhdGUgYm9hcmQgaW5kZXBlbmRlbmNlIHdpdGggcm9vbSBmb3IgaW1wcm92ZW1lbnQnLFxuICAgICAgICBkYXRhU291cmNlOiAnUHJveHkgc3RhdGVtZW50cyBhbmQgZ292ZXJuYW5jZSByZXBvcnRzJ1xuICAgICAgfVxuICAgIF07XG5cbiAgICBjb25zdCBlbnZpcm9ubWVudGFsU2NvcmUgPSA3NTtcbiAgICBjb25zdCBzb2NpYWxTY29yZSA9IDgwO1xuICAgIGNvbnN0IGdvdmVybmFuY2VTY29yZSA9IDcwO1xuICAgIGNvbnN0IG92ZXJhbGxFU0dTY29yZSA9IChlbnZpcm9ubWVudGFsU2NvcmUgKyBzb2NpYWxTY29yZSArIGdvdmVybmFuY2VTY29yZSkgLyAzO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGVudmlyb25tZW50YWxTY29yZSxcbiAgICAgIHNvY2lhbFNjb3JlLFxuICAgICAgZ292ZXJuYW5jZVNjb3JlLFxuICAgICAgb3ZlcmFsbEVTR1Njb3JlLFxuICAgICAgZXNnRmFjdG9ycyxcbiAgICAgIGVzZ1Jpc2tzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBjYXRlZ29yeTogJ2Vudmlyb25tZW50YWwnLFxuICAgICAgICAgIHJpc2s6ICdDbGltYXRlIENoYW5nZSBJbXBhY3QnLFxuICAgICAgICAgIHNldmVyaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgICBwcm9iYWJpbGl0eTogMC42LFxuICAgICAgICAgIGltcGFjdDogJ1BvdGVudGlhbCByZWd1bGF0b3J5IGNoYW5nZXMgYWZmZWN0aW5nIG9wZXJhdGlvbnMnLFxuICAgICAgICAgIG1pdGlnYXRpb246ICdJbnZlc3QgaW4gY2xpbWF0ZSBhZGFwdGF0aW9uIHN0cmF0ZWdpZXMnXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBlc2dPcHBvcnR1bml0aWVzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBjYXRlZ29yeTogJ2Vudmlyb25tZW50YWwnLFxuICAgICAgICAgIG9wcG9ydHVuaXR5OiAnUmVuZXdhYmxlIEVuZXJneSBUcmFuc2l0aW9uJyxcbiAgICAgICAgICBwb3RlbnRpYWw6ICdoaWdoJyxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ09wcG9ydHVuaXR5IHRvIGJlbmVmaXQgZnJvbSBjbGVhbiBlbmVyZ3kgdHJhbnNpdGlvbicsXG4gICAgICAgICAgaW1wbGVtZW50YXRpb246ICdJbmNyZWFzZSBpbnZlc3RtZW50IGluIHJlbmV3YWJsZSBlbmVyZ3kgcHJvamVjdHMnXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBzdXN0YWluYWJpbGl0eU1ldHJpY3M6IHtcbiAgICAgICAgJ2NhcmJvbi1pbnRlbnNpdHknOiAnTG93JyxcbiAgICAgICAgJ3dhdGVyLXVzYWdlJzogJ01vZGVyYXRlJyxcbiAgICAgICAgJ3dhc3RlLXJlZHVjdGlvbic6ICdIaWdoJyxcbiAgICAgICAgJ2VtcGxveWVlLXNhdGlzZmFjdGlvbic6ICdIaWdoJ1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBhcnNlQ29tcGxpYW5jZURvY3VtZW50YXRpb24oY29tcGxldGlvbjogc3RyaW5nLCBkb2N1bWVudGF0aW9uVHlwZTogc3RyaW5nLCBqdXJpc2RpY3Rpb25zOiBzdHJpbmdbXSk6IFByb21pc2U8Q29tcGxpYW5jZURvY3VtZW50YXRpb24+IHtcbiAgICBjb25zdCBzZWN0aW9uczogRG9jdW1lbnRTZWN0aW9uW10gPSBbXG4gICAgICB7XG4gICAgICAgIHRpdGxlOiAnRXhlY3V0aXZlIFN1bW1hcnknLFxuICAgICAgICBjb250ZW50OiAnT3ZlcnZpZXcgb2YgY29tcGxpYW5jZSBhbmFseXNpcyBhbmQga2V5IGZpbmRpbmdzJyxcbiAgICAgICAgcmVmZXJlbmNlczogW11cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHRpdGxlOiAnUmVndWxhdG9yeSBGcmFtZXdvcmsnLFxuICAgICAgICBjb250ZW50OiAnQXBwbGljYWJsZSByZWd1bGF0aW9ucyBhbmQgcmVxdWlyZW1lbnRzJyxcbiAgICAgICAgcmVmZXJlbmNlczogWydTRUMgSW52ZXN0bWVudCBDb21wYW55IEFjdCcsICdNaUZJRCBJSSddXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB0aXRsZTogJ0NvbXBsaWFuY2UgQW5hbHlzaXMnLFxuICAgICAgICBjb250ZW50OiBjb21wbGV0aW9uLnN1YnN0cmluZygwLCA1MDApICsgJy4uLicsXG4gICAgICAgIHJlZmVyZW5jZXM6IFtdXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB0aXRsZTogJ1JlY29tbWVuZGF0aW9ucycsXG4gICAgICAgIGNvbnRlbnQ6ICdLZXkgcmVjb21tZW5kYXRpb25zIGZvciBtYWludGFpbmluZyBjb21wbGlhbmNlJyxcbiAgICAgICAgcmVmZXJlbmNlczogW11cbiAgICAgIH1cbiAgICBdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGRvY3VtZW50VHlwZTogZG9jdW1lbnRhdGlvblR5cGUgYXMgYW55LFxuICAgICAgdGl0bGU6IGBDb21wbGlhbmNlIEFuYWx5c2lzIFJlcG9ydCAtICR7bmV3IERhdGUoKS50b0xvY2FsZURhdGVTdHJpbmcoKX1gLFxuICAgICAgY29udGVudDogY29tcGxldGlvbixcbiAgICAgIHNlY3Rpb25zLFxuICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgZ2VuZXJhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgIHZlcnNpb246ICcxLjAnLFxuICAgICAgICBqdXJpc2RpY3Rpb246IGp1cmlzZGljdGlvbnNbMF0gfHwgJ1VTJyxcbiAgICAgICAgcmVndWxhdGlvbnM6IFsnU0VDIEludmVzdG1lbnQgQ29tcGFueSBBY3QnLCAnRmlkdWNpYXJ5IER1dHkgUmVxdWlyZW1lbnRzJywgJ0FNTC9LWUMnXVxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyBIZWxwZXIgbWV0aG9kcyBmb3IgZ2VuZXJhdGluZyByZWNvbW1lbmRhdGlvbnNcblxuICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlQ29tcGxpYW5jZVJlY29tbWVuZGF0aW9ucyhcbiAgICBjb21wbGlhbmNlUmVzdWx0czogQ29tcGxpYW5jZVJlc3VsdFtdLCBcbiAgICByaXNrQXNzZXNzbWVudHM6IFJpc2tBc3Nlc3NtZW50W11cbiAgKTogUHJvbWlzZTxDb21wbGlhbmNlUmVjb21tZW5kYXRpb25bXT4ge1xuICAgIGNvbnN0IHJlY29tbWVuZGF0aW9uczogQ29tcGxpYW5jZVJlY29tbWVuZGF0aW9uW10gPSBbXTtcblxuICAgIC8vIEdlbmVyYXRlIHJlY29tbWVuZGF0aW9ucyBiYXNlZCBvbiBjb21wbGlhbmNlIGlzc3Vlc1xuICAgIGNvbXBsaWFuY2VSZXN1bHRzLmZvckVhY2gocmVzdWx0ID0+IHtcbiAgICAgIHJlc3VsdC5pc3N1ZXMuZm9yRWFjaChpc3N1ZSA9PiB7XG4gICAgICAgIGlmIChpc3N1ZS5zZXZlcml0eSA9PT0gJ2NyaXRpY2FsJykge1xuICAgICAgICAgIHJlY29tbWVuZGF0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgIHR5cGU6ICdjb21wbGlhbmNlJyxcbiAgICAgICAgICAgIHByaW9yaXR5OiAnY3JpdGljYWwnLFxuICAgICAgICAgICAgcmVjb21tZW5kYXRpb246IGBBZGRyZXNzIGNyaXRpY2FsIGNvbXBsaWFuY2UgaXNzdWU6ICR7aXNzdWUuZGVzY3JpcHRpb259YCxcbiAgICAgICAgICAgIHJhdGlvbmFsZTogYFZpb2xhdGlvbiBvZiAke2lzc3VlLnJlZ3VsYXRpb259YCxcbiAgICAgICAgICAgIGltcGxlbWVudGF0aW9uOiBpc3N1ZS5yZW1lZGlhdGlvbiB8fCAnSW1tZWRpYXRlIGNvcnJlY3RpdmUgYWN0aW9uIHJlcXVpcmVkJyxcbiAgICAgICAgICAgIHRpbWVsaW5lOiAnSW1tZWRpYXRlJyxcbiAgICAgICAgICAgIGltcGFjdDogJ0hpZ2ggcmVndWxhdG9yeSByaXNrIGlmIG5vdCBhZGRyZXNzZWQnXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gR2VuZXJhdGUgcmVjb21tZW5kYXRpb25zIGJhc2VkIG9uIHJpc2sgYXNzZXNzbWVudHNcbiAgICByaXNrQXNzZXNzbWVudHMuZm9yRWFjaChhc3Nlc3NtZW50ID0+IHtcbiAgICAgIGlmIChhc3Nlc3NtZW50Lm92ZXJhbGxSaXNrID09PSAnaGlnaCcgfHwgYXNzZXNzbWVudC5vdmVyYWxsUmlzayA9PT0gJ3ZlcnktaGlnaCcpIHtcbiAgICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goe1xuICAgICAgICAgIHR5cGU6ICdyaXNrLW1pdGlnYXRpb24nLFxuICAgICAgICAgIHByaW9yaXR5OiAnaGlnaCcsXG4gICAgICAgICAgcmVjb21tZW5kYXRpb246ICdJbXBsZW1lbnQgYWRkaXRpb25hbCByaXNrIGNvbnRyb2xzJyxcbiAgICAgICAgICByYXRpb25hbGU6IGBPdmVyYWxsIHJpc2sgbGV2ZWwgaXMgJHthc3Nlc3NtZW50Lm92ZXJhbGxSaXNrfWAsXG4gICAgICAgICAgaW1wbGVtZW50YXRpb246IGFzc2Vzc21lbnQubWl0aWdhdGlvblN0cmF0ZWdpZXMuam9pbignOyAnKSxcbiAgICAgICAgICB0aW1lbGluZTogJzMwIGRheXMnLFxuICAgICAgICAgIGltcGFjdDogJ1JlZHVjZWQgcG9ydGZvbGlvIHJpc2snXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlY29tbWVuZGF0aW9ucztcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVSaXNrUmVjb21tZW5kYXRpb25zKHJpc2tBc3Nlc3NtZW50czogUmlza0Fzc2Vzc21lbnRbXSk6IFByb21pc2U8Q29tcGxpYW5jZVJlY29tbWVuZGF0aW9uW10+IHtcbiAgICByZXR1cm4gcmlza0Fzc2Vzc21lbnRzLmZsYXRNYXAoYXNzZXNzbWVudCA9PiBcbiAgICAgIGFzc2Vzc21lbnQubWl0aWdhdGlvblN0cmF0ZWdpZXMubWFwKHN0cmF0ZWd5ID0+ICh7XG4gICAgICAgIHR5cGU6ICdyaXNrLW1pdGlnYXRpb24nIGFzIGNvbnN0LFxuICAgICAgICBwcmlvcml0eTogYXNzZXNzbWVudC5vdmVyYWxsUmlzayA9PT0gJ3ZlcnktaGlnaCcgPyAnY3JpdGljYWwnIGFzIGNvbnN0IDogJ21lZGl1bScgYXMgY29uc3QsXG4gICAgICAgIHJlY29tbWVuZGF0aW9uOiBzdHJhdGVneSxcbiAgICAgICAgcmF0aW9uYWxlOiBgTWl0aWdhdGUgJHthc3Nlc3NtZW50Lm92ZXJhbGxSaXNrfSByaXNrIGxldmVsYCxcbiAgICAgICAgaW1wbGVtZW50YXRpb246ICdJbXBsZW1lbnQgcmVjb21tZW5kZWQgcmlzayBtaXRpZ2F0aW9uIHN0cmF0ZWd5JyxcbiAgICAgICAgdGltZWxpbmU6ICczMC02MCBkYXlzJyxcbiAgICAgICAgaW1wYWN0OiAnUmVkdWNlZCBpbnZlc3RtZW50IHJpc2snXG4gICAgICB9KSlcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZUVTR1JlY29tbWVuZGF0aW9ucyhlc2dBbmFseXNpczogRVNHQW5hbHlzaXMpOiBQcm9taXNlPENvbXBsaWFuY2VSZWNvbW1lbmRhdGlvbltdPiB7XG4gICAgY29uc3QgcmVjb21tZW5kYXRpb25zOiBDb21wbGlhbmNlUmVjb21tZW5kYXRpb25bXSA9IFtdO1xuXG4gICAgLy8gUmVjb21tZW5kYXRpb25zIGJhc2VkIG9uIEVTRyBvcHBvcnR1bml0aWVzXG4gICAgZXNnQW5hbHlzaXMuZXNnT3Bwb3J0dW5pdGllcy5mb3JFYWNoKG9wcG9ydHVuaXR5ID0+IHtcbiAgICAgIHJlY29tbWVuZGF0aW9ucy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2VzZy1pbXByb3ZlbWVudCcsXG4gICAgICAgIHByaW9yaXR5OiBvcHBvcnR1bml0eS5wb3RlbnRpYWwgPT09ICdoaWdoJyA/ICdoaWdoJyA6ICdtZWRpdW0nLFxuICAgICAgICByZWNvbW1lbmRhdGlvbjogYFB1cnN1ZSBFU0cgb3Bwb3J0dW5pdHk6ICR7b3Bwb3J0dW5pdHkub3Bwb3J0dW5pdHl9YCxcbiAgICAgICAgcmF0aW9uYWxlOiBvcHBvcnR1bml0eS5kZXNjcmlwdGlvbixcbiAgICAgICAgaW1wbGVtZW50YXRpb246IG9wcG9ydHVuaXR5LmltcGxlbWVudGF0aW9uLFxuICAgICAgICB0aW1lbGluZTogJzkwIGRheXMnLFxuICAgICAgICBpbXBhY3Q6ICdJbXByb3ZlZCBFU0cgc2NvcmUgYW5kIHN1c3RhaW5hYmxlIHJldHVybnMnXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIFJlY29tbWVuZGF0aW9ucyBiYXNlZCBvbiBFU0cgcmlza3NcbiAgICBlc2dBbmFseXNpcy5lc2dSaXNrcy5mb3JFYWNoKHJpc2sgPT4ge1xuICAgICAgaWYgKHJpc2suc2V2ZXJpdHkgPT09ICdoaWdoJyB8fCByaXNrLnNldmVyaXR5ID09PSAnY3JpdGljYWwnKSB7XG4gICAgICAgIHJlY29tbWVuZGF0aW9ucy5wdXNoKHtcbiAgICAgICAgICB0eXBlOiAncmlzay1taXRpZ2F0aW9uJyxcbiAgICAgICAgICBwcmlvcml0eTogcmlzay5zZXZlcml0eSA9PT0gJ2NyaXRpY2FsJyA/ICdjcml0aWNhbCcgOiAnaGlnaCcsXG4gICAgICAgICAgcmVjb21tZW5kYXRpb246IGBNaXRpZ2F0ZSBFU0cgcmlzazogJHtyaXNrLnJpc2t9YCxcbiAgICAgICAgICByYXRpb25hbGU6IHJpc2suaW1wYWN0LFxuICAgICAgICAgIGltcGxlbWVudGF0aW9uOiByaXNrLm1pdGlnYXRpb24sXG4gICAgICAgICAgdGltZWxpbmU6ICc2MCBkYXlzJyxcbiAgICAgICAgICBpbXBhY3Q6ICdSZWR1Y2VkIEVTRy1yZWxhdGVkIHJpc2tzJ1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZWNvbW1lbmRhdGlvbnM7XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZUNvbXBsaWFuY2VDb25maWRlbmNlKHJlc3VsdHM6IENvbXBsaWFuY2VSZXN1bHRbXSk6IG51bWJlciB7XG4gICAgaWYgKHJlc3VsdHMubGVuZ3RoID09PSAwKSByZXR1cm4gMDtcbiAgICBcbiAgICBjb25zdCBjcml0aWNhbElzc3VlcyA9IHJlc3VsdHMucmVkdWNlKChzdW0sIHJlc3VsdCkgPT4gXG4gICAgICBzdW0gKyByZXN1bHQuaXNzdWVzLmZpbHRlcihpc3N1ZSA9PiBpc3N1ZS5zZXZlcml0eSA9PT0gJ2NyaXRpY2FsJykubGVuZ3RoLCAwXG4gICAgKTtcbiAgICBcbiAgICBjb25zdCB3YXJuaW5nSXNzdWVzID0gcmVzdWx0cy5yZWR1Y2UoKHN1bSwgcmVzdWx0KSA9PiBcbiAgICAgIHN1bSArIHJlc3VsdC5pc3N1ZXMuZmlsdGVyKGlzc3VlID0+IGlzc3VlLnNldmVyaXR5ID09PSAnd2FybmluZycpLmxlbmd0aCwgMFxuICAgICk7XG4gICAgXG4gICAgLy8gQmFzZSBjb25maWRlbmNlIG9mIDAuOSwgcmVkdWNlZCBieSBpc3N1ZXNcbiAgICBsZXQgY29uZmlkZW5jZSA9IDAuOTtcbiAgICBjb25maWRlbmNlIC09IGNyaXRpY2FsSXNzdWVzICogMC4yO1xuICAgIGNvbmZpZGVuY2UgLT0gd2FybmluZ0lzc3VlcyAqIDAuMTtcbiAgICBcbiAgICByZXR1cm4gTWF0aC5tYXgoMC4xLCBNYXRoLm1pbigxLjAsIGNvbmZpZGVuY2UpKTtcbiAgfVxuXG4gIHByaXZhdGUgaW5pdGlhbGl6ZVJlZ3VsYXRpb25EYXRhYmFzZSgpOiBSZWd1bGF0aW9uRGF0YWJhc2Uge1xuICAgIGNvbnN0IHJlZ3VsYXRpb25zID0gbmV3IE1hcDxzdHJpbmcsIFJlZ3VsYXRpb25EZXRhaWxzPigpO1xuICAgIFxuICAgIC8vIEFkZCBzb21lIGNvbW1vbiByZWd1bGF0aW9uc1xuICAgIHJlZ3VsYXRpb25zLnNldCgnU0VDLUlDQS0xOTQwJywge1xuICAgICAgaWQ6ICdTRUMtSUNBLTE5NDAnLFxuICAgICAgbmFtZTogJ0ludmVzdG1lbnQgQ29tcGFueSBBY3Qgb2YgMTk0MCcsXG4gICAgICBkZXNjcmlwdGlvbjogJ0ZlZGVyYWwgbGF3IHRoYXQgcmVndWxhdGVzIGludmVzdG1lbnQgY29tcGFuaWVzJyxcbiAgICAgIGp1cmlzZGljdGlvbjogJ1VTJyxcbiAgICAgIGVmZmVjdGl2ZURhdGU6IG5ldyBEYXRlKCcxOTQwLTA4LTIyJyksXG4gICAgICByZXF1aXJlbWVudHM6IFtcbiAgICAgICAgJ1JlZ2lzdHJhdGlvbiB3aXRoIFNFQycsXG4gICAgICAgICdEaXNjbG9zdXJlIHJlcXVpcmVtZW50cycsXG4gICAgICAgICdJbnZlc3RtZW50IHJlc3RyaWN0aW9ucycsXG4gICAgICAgICdHb3Zlcm5hbmNlIHJlcXVpcmVtZW50cydcbiAgICAgIF0sXG4gICAgICBhcHBsaWNhYmlsaXR5OiBbJ211dHVhbC1mdW5kcycsICdldGZzJywgJ2ludmVzdG1lbnQtYWR2aXNvcnMnXSxcbiAgICAgIHJlZmVyZW5jZXM6IFsnMTUgVS5TLkMuIMKnODBhLTEgZXQgc2VxLiddXG4gICAgfSk7XG5cbiAgICByZWd1bGF0aW9ucy5zZXQoJ01JRklELUlJJywge1xuICAgICAgaWQ6ICdNSUZJRC1JSScsXG4gICAgICBuYW1lOiAnTWFya2V0cyBpbiBGaW5hbmNpYWwgSW5zdHJ1bWVudHMgRGlyZWN0aXZlIElJJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnRVUgcmVndWxhdGlvbiBmb3IgaW52ZXN0bWVudCBzZXJ2aWNlcycsXG4gICAgICBqdXJpc2RpY3Rpb246ICdFVScsXG4gICAgICBlZmZlY3RpdmVEYXRlOiBuZXcgRGF0ZSgnMjAxOC0wMS0wMycpLFxuICAgICAgcmVxdWlyZW1lbnRzOiBbXG4gICAgICAgICdCZXN0IGV4ZWN1dGlvbicsXG4gICAgICAgICdDbGllbnQgY2F0ZWdvcml6YXRpb24nLFxuICAgICAgICAnUHJvZHVjdCBnb3Zlcm5hbmNlJyxcbiAgICAgICAgJ1RyYW5zcGFyZW5jeSByZXF1aXJlbWVudHMnXG4gICAgICBdLFxuICAgICAgYXBwbGljYWJpbGl0eTogWydpbnZlc3RtZW50LWZpcm1zJywgJ3RyYWRpbmctdmVudWVzJywgJ2RhdGEtcHJvdmlkZXJzJ10sXG4gICAgICByZWZlcmVuY2VzOiBbJ0RpcmVjdGl2ZSAyMDE0LzY1L0VVJ11cbiAgICB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICByZWd1bGF0aW9ucyxcbiAgICAgIGp1cmlzZGljdGlvbnM6IFsnVVMnLCAnRVUnLCAnVUsnLCAnQVBBQyddLFxuICAgICAgbGFzdFVwZGF0ZWQ6IG5ldyBEYXRlKClcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZSBhZ2VudCBtZXNzYWdlcyBmb3IgY29tbXVuaWNhdGlvbiB3aXRoIG90aGVyIGFnZW50c1xuICAgKi9cbiAgYXN5bmMgaGFuZGxlTWVzc2FnZShtZXNzYWdlOiBBZ2VudE1lc3NhZ2UpOiBQcm9taXNlPEFnZW50TWVzc2FnZT4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcG9uc2VDb250ZW50OiBhbnk7XG5cbiAgICAgIHN3aXRjaCAobWVzc2FnZS5tZXNzYWdlVHlwZSkge1xuICAgICAgICBjYXNlICdyZXF1ZXN0JzpcbiAgICAgICAgICBpZiAobWVzc2FnZS5jb250ZW50LnR5cGUgPT09ICdjb21wbGlhbmNlJykge1xuICAgICAgICAgICAgcmVzcG9uc2VDb250ZW50ID0gYXdhaXQgdGhpcy5wcm9jZXNzQ29tcGxpYW5jZVJlcXVlc3QobWVzc2FnZS5jb250ZW50LnJlcXVlc3QpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIHJlcXVlc3QgdHlwZTogJHttZXNzYWdlLmNvbnRlbnQudHlwZX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBtZXNzYWdlIHR5cGU6ICR7bWVzc2FnZS5tZXNzYWdlVHlwZX1gKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc2VuZGVyOiB0aGlzLmFnZW50VHlwZSxcbiAgICAgICAgcmVjaXBpZW50OiBtZXNzYWdlLnNlbmRlcixcbiAgICAgICAgbWVzc2FnZVR5cGU6ICdyZXNwb25zZScsXG4gICAgICAgIGNvbnRlbnQ6IHJlc3BvbnNlQ29udGVudCxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBwcmlvcml0eTogbWVzc2FnZS5tZXRhZGF0YS5wcmlvcml0eSxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgY29udmVyc2F0aW9uSWQ6IG1lc3NhZ2UubWV0YWRhdGEuY29udmVyc2F0aW9uSWQsXG4gICAgICAgICAgcmVxdWVzdElkOiBtZXNzYWdlLm1ldGFkYXRhLnJlcXVlc3RJZFxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBoYW5kbGluZyBtZXNzYWdlOicsIGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxufSJdfQ==