/**
 * Synthesis Agent Implementation
 *
 * This agent is responsible for:
 * - Output integration and coherence checking
 * - Narrative generation for investment ideas
 * - Visualization and formatting utilities
 *
 * Uses Claude Sonnet 3.7 for sophisticated content synthesis and narrative generation
 */
import { ClaudeSonnetService } from './claude-sonnet-service';
import { AgentMessage, ConversationContext } from '../../models/agent';
import { AnalysisResult } from '../../models/analysis';
import { InvestmentIdea } from '../../models/investment-idea';
export interface SynthesisRequest {
    analysisResults: AnalysisResult[];
    researchFindings: any[];
    complianceChecks: any[];
    userPreferences: {
        investmentHorizon: 'short' | 'medium' | 'long';
        riskTolerance: 'conservative' | 'moderate' | 'aggressive';
        preferredSectors?: string[];
        excludedInvestments?: string[];
    };
    outputFormat: 'detailed' | 'summary' | 'executive' | 'technical';
    includeVisualizations: boolean;
    context?: ConversationContext;
}
export interface SynthesisResponse {
    investmentIdeas: InvestmentIdea[];
    executiveSummary: string;
    detailedNarrative: string;
    keyInsights: string[];
    riskSummary: string;
    recommendations: SynthesisRecommendation[];
    visualizations: VisualizationSpec[];
    coherenceScore: number;
    confidence: number;
    executionTime: number;
}
export interface SynthesisRecommendation {
    priority: 'high' | 'medium' | 'low';
    action: 'buy' | 'sell' | 'hold' | 'investigate' | 'monitor';
    investment: string;
    rationale: string;
    timeframe: string;
    confidence: number;
    supportingEvidence: string[];
}
export interface VisualizationSpec {
    id: string;
    type: 'chart' | 'table' | 'diagram' | 'infographic' | 'dashboard';
    title: string;
    description: string;
    data: any;
    config: VisualizationConfig;
    priority: 'high' | 'medium' | 'low';
}
export interface VisualizationConfig {
    chartType?: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'treemap';
    dimensions: {
        width: number;
        height: number;
    };
    styling: {
        theme: 'light' | 'dark' | 'professional';
        colors: string[];
    };
    interactivity: {
        zoom: boolean;
        filter: boolean;
        tooltip: boolean;
    };
    export: {
        formats: ('png' | 'svg' | 'pdf')[];
    };
}
export interface CoherenceCheck {
    overallScore: number;
    consistencyScore: number;
    completenessScore: number;
    clarityScore: number;
    issues: CoherenceIssue[];
    recommendations: string[];
}
export interface CoherenceIssue {
    type: 'inconsistency' | 'gap' | 'contradiction' | 'unclear' | 'incomplete';
    severity: 'low' | 'medium' | 'high';
    description: string;
    location: string;
    suggestedFix: string;
}
export interface NarrativeStructure {
    sections: NarrativeSection[];
    flow: string[];
    keyMessages: string[];
    supportingEvidence: Record<string, string[]>;
}
export interface NarrativeSection {
    id: string;
    title: string;
    content: string;
    type: 'introduction' | 'analysis' | 'findings' | 'recommendations' | 'risks' | 'conclusion';
    priority: number;
    dependencies: string[];
}
/**
 * Synthesis Agent class that handles output integration and narrative generation
 */
export declare class SynthesisAgent {
    private claudeSonnetService;
    private agentType;
    constructor(claudeSonnetService: ClaudeSonnetService);
    /**
     * Process a synthesis request and return integrated investment ideas with narratives
     */
    processSynthesisRequest(request: SynthesisRequest): Promise<SynthesisResponse>;
    /**
     * Perform coherence checking on input data
     */
    private performCoherenceCheck;
    /**
     * Integrate analysis results from different agents
     */
    private integrateAnalysisResults;
    /**
     * Generate investment ideas based on integrated analysis
     */
    private generateInvestmentIdeas;
    /**
     * Parse investment ideas from AI response
     */
    private parseInvestmentIdeas;
    /**
     * Create narrative structure for the investment report
     */
    private createNarrativeStructure;
    /**
     * Generate detailed narrative based on structure
     */
    private generateDetailedNarrative;
    /**
     * Generate executive summary
     */
    private generateExecutiveSummary;
    /**
     * Extract key insights from analysis
     */
    private extractKeyInsights;
    /**
     * Generate risk summary
     */
    private generateRiskSummary;
    /**
     * Create synthesis recommendations
     */
    private createSynthesisRecommendations;
    /**
     * Generate visualizations for the investment ideas
     */
    private generateVisualizations;
    /**
     * Calculate risk score for an investment idea
     */
    private calculateRiskScore;
    /**
     * Calculate overall confidence across investment ideas
     */
    private calculateOverallConfidence;
    /**
     * Handle agent messages for communication with other agents
     */
    handleMessage(message: AgentMessage): Promise<AgentMessage>;
    /**
     * Format output for different presentation formats
     */
    formatOutput(response: SynthesisResponse, format: 'json' | 'markdown' | 'html' | 'pdf'): Promise<string>;
    /**
     * Format response as Markdown
     */
    private formatAsMarkdown;
    /**
     * Format response as HTML
     */
    private formatAsHTML;
}
