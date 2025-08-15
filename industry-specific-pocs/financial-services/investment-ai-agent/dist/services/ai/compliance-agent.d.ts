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
import { ClaudeHaikuService } from './claude-haiku-service';
import { AgentMessage, ConversationContext } from '../../models/agent';
import { ComplianceResult, InvestmentIdea } from '../../models/investment-idea';
import { Investment } from '../../models/investment';
import { ComplianceService, RegulationDetails, RiskContext, RiskAssessment, RegulationUpdates } from '../../models/services';
export interface ComplianceRequest {
    investments?: Investment[];
    investmentIdeas?: InvestmentIdea[];
    requestType: 'compliance-check' | 'risk-assessment' | 'regulation-lookup' | 'esg-analysis' | 'documentation-generation';
    parameters: {
        jurisdictions?: string[];
        regulationTypes?: string[];
        riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
        investmentHorizon?: 'short' | 'medium' | 'long';
        includeESG?: boolean;
        documentationType?: 'summary' | 'detailed' | 'regulatory-filing';
    };
    context?: ConversationContext;
}
export interface ComplianceResponse {
    complianceResults: ComplianceResult[];
    riskAssessments: RiskAssessment[];
    regulationDetails?: RegulationDetails[];
    esgAnalysis?: ESGAnalysis;
    documentation?: ComplianceDocumentation;
    recommendations: ComplianceRecommendation[];
    confidence: number;
    executionTime: number;
}
export interface ESGAnalysis {
    environmentalScore: number;
    socialScore: number;
    governanceScore: number;
    overallESGScore: number;
    esgFactors: ESGFactor[];
    esgRisks: ESGRisk[];
    esgOpportunities: ESGOpportunity[];
    sustainabilityMetrics: Record<string, any>;
}
export interface ESGFactor {
    category: 'environmental' | 'social' | 'governance';
    factor: string;
    score: number;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
    dataSource: string;
}
export interface ESGRisk {
    category: 'environmental' | 'social' | 'governance';
    risk: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    probability: number;
    impact: string;
    mitigation: string;
}
export interface ESGOpportunity {
    category: 'environmental' | 'social' | 'governance';
    opportunity: string;
    potential: 'low' | 'medium' | 'high';
    description: string;
    implementation: string;
}
export interface ComplianceDocumentation {
    documentType: 'summary' | 'detailed' | 'regulatory-filing';
    title: string;
    content: string;
    sections: DocumentSection[];
    metadata: {
        generatedAt: Date;
        version: string;
        jurisdiction: string;
        regulations: string[];
    };
}
export interface DocumentSection {
    title: string;
    content: string;
    subsections?: DocumentSection[];
    references: string[];
}
export interface ComplianceRecommendation {
    type: 'compliance' | 'risk-mitigation' | 'esg-improvement' | 'regulatory-update';
    priority: 'low' | 'medium' | 'high' | 'critical';
    recommendation: string;
    rationale: string;
    implementation: string;
    timeline: string;
    impact: string;
}
export interface RegulationDatabase {
    regulations: Map<string, RegulationDetails>;
    jurisdictions: string[];
    lastUpdated: Date;
}
/**
 * Compliance Agent class that handles all regulatory compliance and risk assessment tasks
 */
export declare class ComplianceAgent implements ComplianceService {
    private haikuService;
    private agentType;
    private regulationDatabase;
    constructor(haikuService: ClaudeHaikuService);
    /**
     * Process a compliance request and return comprehensive compliance analysis
     */
    processComplianceRequest(request: ComplianceRequest): Promise<ComplianceResponse>;
    /**
     * Check compliance for investments or investment ideas
     */
    checkCompliance(investment: Investment): Promise<ComplianceResult>;
    /**
     * Get details about specific regulations
     */
    getRegulationDetails(regulationId: string): Promise<RegulationDetails>;
    /**
     * Evaluate risk for an investment in a given context
     */
    evaluateRisk(investment: Investment, context: RiskContext): Promise<RiskAssessment>;
    /**
     * Monitor for regulation changes
     */
    monitorRegulationChanges(): Promise<RegulationUpdates>;
    /**
     * Perform comprehensive compliance check
     */
    private performComplianceCheck;
    /**
     * Check compliance for a single investment
     */
    private checkInvestmentCompliance;
    /**
     * Check compliance for an investment idea
     */
    private checkInvestmentIdeaCompliance;
    /**
     * Perform risk assessment
     */
    private performRiskAssessment;
    /**
     * Assess risk for a single investment
     */
    private assessInvestmentRisk;
    /**
     * Perform ESG analysis
     */
    private performESGAnalysis;
    /**
     * Analyze ESG factors for an investment
     */
    private analyzeESGFactors;
    /**
     * Perform regulation lookup
     */
    private performRegulationLookup;
    /**
     * Generate compliance documentation
     */
    private generateComplianceDocumentation;
    /**
     * Create compliance documentation
     */
    private createComplianceDocument;
    private parseComplianceResult;
    private parseRiskAssessment;
    private parseESGAnalysis;
    private parseComplianceDocumentation;
    private generateComplianceRecommendations;
    private generateRiskRecommendations;
    private generateESGRecommendations;
    private calculateComplianceConfidence;
    private initializeRegulationDatabase;
    /**
     * Handle agent messages for communication with other agents
     */
    handleMessage(message: AgentMessage): Promise<AgentMessage>;
}
