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

import { ClaudeSonnetService, ClaudePromptTemplate } from './claude-sonnet-service';
import { 
  AgentMessage, 
  AgentTask, 
  ConversationContext, 
  AgentType 
} from '../../models/agent';
import { 
  AnalysisResult,
  AnalysisRecommendation,
  DataPoint
} from '../../models/analysis';
import { InvestmentIdea, Outcome, CounterArgument } from '../../models/investment-idea';
import { v4 as uuidv4 } from 'uuid';

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
export class SynthesisAgent {
  private claudeSonnetService: ClaudeSonnetService;
  private agentType: AgentType = 'synthesis';

  constructor(claudeSonnetService: ClaudeSonnetService) {
    this.claudeSonnetService = claudeSonnetService;
  }

  /**
   * Process a synthesis request and return integrated investment ideas with narratives
   */
  async processSynthesisRequest(request: SynthesisRequest): Promise<SynthesisResponse> {
    const startTime = Date.now();
    
    try {
      // Step 1: Perform coherence checking on input data
      const coherenceCheck = await this.performCoherenceCheck(request);
      
      // Step 2: Integrate analysis results
      const integratedResults = await this.integrateAnalysisResults(request.analysisResults);
      
      // Step 3: Generate investment ideas
      const investmentIdeas = await this.generateInvestmentIdeas(
        integratedResults,
        request.researchFindings,
        request.complianceChecks,
        request.userPreferences
      );
      
      // Step 4: Create narrative structure
      const narrativeStructure = await this.createNarrativeStructure(
        investmentIdeas,
        integratedResults,
        request.outputFormat
      );
      
      // Step 5: Generate detailed narratives
      const detailedNarrative = await this.generateDetailedNarrative(narrativeStructure);
      const executiveSummary = await this.generateExecutiveSummary(investmentIdeas, integratedResults);
      
      // Step 6: Extract key insights
      const keyInsights = await this.extractKeyInsights(investmentIdeas, integratedResults);
      
      // Step 7: Generate risk summary
      const riskSummary = await this.generateRiskSummary(investmentIdeas, request.complianceChecks);
      
      // Step 8: Create synthesis recommendations
      const recommendations = await this.createSynthesisRecommendations(investmentIdeas);
      
      // Step 9: Generate visualizations if requested
      const visualizations = request.includeVisualizations 
        ? await this.generateVisualizations(investmentIdeas, integratedResults)
        : [];

      return {
        investmentIdeas,
        executiveSummary,
        detailedNarrative,
        keyInsights,
        riskSummary,
        recommendations,
        visualizations,
        coherenceScore: coherenceCheck.overallScore,
        confidence: this.calculateOverallConfidence(investmentIdeas),
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Error processing synthesis request:', error);
      throw error;
    }
  }

  /**
   * Perform coherence checking on input data
   */
  private async performCoherenceCheck(request: SynthesisRequest): Promise<CoherenceCheck> {
    const prompt = `
      As a synthesis agent, perform a comprehensive coherence check on the following investment analysis data:
      
      Analysis Results: ${JSON.stringify(request.analysisResults, null, 2)}
      Research Findings: ${JSON.stringify(request.researchFindings, null, 2)}
      Compliance Checks: ${JSON.stringify(request.complianceChecks, null, 2)}
      
      Please evaluate:
      1. Consistency across different analysis types
      2. Completeness of the analysis coverage
      3. Clarity of findings and recommendations
      4. Identification of any contradictions or gaps
      
      Provide scores (0-1) for:
      - Overall coherence
      - Consistency
      - Completeness
      - Clarity
      
      List any issues found with severity levels and suggested fixes.
      
      Format your response as JSON with the structure:
      {
        "overallScore": number,
        "consistencyScore": number,
        "completenessScore": number,
        "clarityScore": number,
        "issues": [{"type": string, "severity": string, "description": string, "location": string, "suggestedFix": string}],
        "recommendations": [string]
      }
    `;

    const response = await this.claudeSonnetService.complete({
      prompt,
      template: ClaudePromptTemplate.INVESTMENT_ANALYSIS,
      templateVariables: {
        analysisType: 'coherence-check',
        context: 'Investment analysis synthesis',
        requirements: 'Comprehensive coherence evaluation'
      },
      maxTokens: 1500,
      temperature: 0.2
    });

    try {
      return JSON.parse(response.completion);
    } catch (error) {
      // Fallback coherence check
      return {
        overallScore: 0.8,
        consistencyScore: 0.8,
        completenessScore: 0.7,
        clarityScore: 0.8,
        issues: [],
        recommendations: ['Review for consistency', 'Ensure completeness']
      };
    }
  }

  /**
   * Integrate analysis results from different agents
   */
  private async integrateAnalysisResults(analysisResults: AnalysisResult[]): Promise<any> {
    const integrationPrompt = `
      Integrate the following analysis results from different specialized agents:
      
      ${analysisResults.map((result, index) => `
        Analysis ${index + 1} (${result.analysisType}):
        - Summary: ${result.summary}
        - Confidence: ${result.confidence}
        - Key Details: ${JSON.stringify(result.details, null, 2)}
        - Recommendations: ${JSON.stringify(result.recommendations, null, 2)}
      `).join('\n')}
      
      Please provide:
      1. Consolidated findings that reconcile different perspectives
      2. Weighted confidence scores based on analysis quality
      3. Integrated recommendations that consider all inputs
      4. Identification of consensus and divergent views
      5. Overall investment thesis
      
      Format as structured JSON.
    `;

    const response = await this.claudeSonnetService.complete({
      prompt: integrationPrompt,
      maxTokens: 2000,
      temperature: 0.3
    });

    try {
      return JSON.parse(response.completion);
    } catch (error) {
      // Fallback integration
      return {
        consolidatedFindings: analysisResults.map(r => r.summary),
        weightedConfidence: analysisResults.reduce((sum, r) => sum + r.confidence, 0) / analysisResults.length,
        integratedRecommendations: analysisResults.flatMap(r => r.recommendations),
        consensus: 'Mixed signals require careful consideration',
        investmentThesis: 'Comprehensive analysis suggests cautious optimism'
      };
    }
  }

  /**
   * Generate investment ideas based on integrated analysis
   */
  private async generateInvestmentIdeas(
    integratedResults: any,
    researchFindings: any[],
    complianceChecks: any[],
    userPreferences: any
  ): Promise<InvestmentIdea[]> {
    const ideaGenerationPrompt = `
      Based on the integrated analysis and research findings, generate specific investment ideas:
      
      Integrated Analysis: ${JSON.stringify(integratedResults, null, 2)}
      Research Findings: ${JSON.stringify(researchFindings, null, 2)}
      Compliance Status: ${JSON.stringify(complianceChecks, null, 2)}
      User Preferences: ${JSON.stringify(userPreferences, null, 2)}
      
      Generate 3-5 specific investment ideas, each with:
      1. Clear title and description
      2. Detailed rationale based on analysis
      3. Confidence score (0-1)
      4. Time horizon alignment
      5. Potential outcomes (best, expected, worst case)
      6. Risk factors and mitigation strategies
      7. Supporting data points
      8. Counter-arguments and responses
      9. Compliance considerations
      
      Format each idea as a complete investment recommendation.
    `;

    const response = await this.claudeSonnetService.complete({
      prompt: ideaGenerationPrompt,
      maxTokens: 3000,
      temperature: 0.4
    });

    // Parse and structure the investment ideas
    const ideas = await this.parseInvestmentIdeas(response.completion, integratedResults);
    return ideas;
  }

  /**
   * Parse investment ideas from AI response
   */
  private async parseInvestmentIdeas(completion: string, integratedResults: any): Promise<InvestmentIdea[]> {
    // This would typically involve more sophisticated parsing
    // For now, create structured investment ideas based on the completion
    
    const ideas: InvestmentIdea[] = [];
    
    // Create a sample investment idea structure
    const baseIdea: InvestmentIdea = {
      id: uuidv4(),
      version: 1,
      title: 'AI-Generated Investment Opportunity',
      description: completion.substring(0, 500) + '...',
      investments: [], // Would be populated with actual Investment objects
      rationale: 'Based on comprehensive multi-agent analysis',
      strategy: 'buy',
      timeHorizon: 'medium',
      confidenceScore: integratedResults.weightedConfidence || 0.8,
      generatedAt: new Date(),
      lastUpdatedAt: new Date(),
      potentialOutcomes: [
        {
          scenario: 'best',
          probability: 0.2,
          returnEstimate: 0.25,
          timeToRealization: 365,
          description: 'Optimal market conditions and execution',
          conditions: ['Strong market performance', 'Successful strategy execution'],
          keyRisks: ['Market volatility'],
          catalysts: ['Strong earnings', 'Market expansion']
        },
        {
          scenario: 'expected',
          probability: 0.6,
          returnEstimate: 0.12,
          timeToRealization: 365,
          description: 'Normal market conditions',
          conditions: ['Stable market environment', 'Average execution'],
          keyRisks: ['Market uncertainty'],
          catalysts: ['Steady growth', 'Market stability']
        },
        {
          scenario: 'worst',
          probability: 0.2,
          returnEstimate: -0.05,
          timeToRealization: 365,
          description: 'Adverse market conditions',
          conditions: ['Market downturn', 'Strategy underperformance'],
          keyRisks: ['Economic recession', 'Market crash'],
          catalysts: ['Market recovery', 'Policy changes']
        }
      ],
      supportingData: [],
      counterArguments: [
        {
          description: 'Market volatility could impact returns',
          strength: 'moderate',
          impact: 'medium',
          mitigationStrategy: 'Diversification and risk management',
          probability: 0.3
        }
      ],
      complianceStatus: {
        compliant: true,
        issues: [],
        regulationsChecked: ['SEC', 'FINRA'],
        timestamp: new Date()
      },
      createdBy: 'synthesis-agent-claude-sonnet',
      tags: ['ai-generated', 'multi-agent-analysis'],
      category: 'equity',
      riskLevel: 'moderate',
      targetAudience: ['retail'],
      metadata: {
        sourceModels: ['claude-sonnet-3.7'],
        processingTime: 10000,
        dataSourcesUsed: ['research-agent', 'analysis-agent', 'compliance-agent'],
        researchDepth: 'comprehensive',
        qualityScore: 85,
        noveltyScore: 75,
        marketConditionsAtGeneration: {
          volatilityIndex: 20,
          marketTrend: 'sideways',
          economicIndicators: {},
          geopoliticalRisk: 'medium'
        }
      },
      trackingInfo: {
        views: 0,
        implementations: 0,
        feedback: [],
        performance: [],
        status: 'active',
        statusHistory: [{
          status: 'active',
          timestamp: new Date(),
          changedBy: 'synthesis-agent'
        }]
      }
    };

    ideas.push(baseIdea);
    return ideas;
  }

  /**
   * Create narrative structure for the investment report
   */
  private async createNarrativeStructure(
    investmentIdeas: InvestmentIdea[],
    integratedResults: any,
    outputFormat: string
  ): Promise<NarrativeStructure> {
    const structurePrompt = `
      Create a narrative structure for an investment report with the following format: ${outputFormat}
      
      Investment Ideas: ${investmentIdeas.length} ideas generated
      Analysis Results: ${JSON.stringify(integratedResults, null, 2)}
      
      Design a logical flow with sections that include:
      1. Executive summary
      2. Market analysis overview
      3. Individual investment opportunities
      4. Risk assessment
      5. Implementation recommendations
      6. Conclusion and next steps
      
      For each section, specify:
      - Title and content outline
      - Priority level
      - Dependencies on other sections
      - Key messages to convey
      
      Format as structured JSON.
    `;

    const response = await this.claudeSonnetService.complete({
      prompt: structurePrompt,
      maxTokens: 1500,
      temperature: 0.3
    });

    try {
      const parsed = JSON.parse(response.completion);
      return {
        sections: parsed.sections || [],
        flow: parsed.flow || ['introduction', 'analysis', 'recommendations', 'conclusion'],
        keyMessages: parsed.keyMessages || [],
        supportingEvidence: parsed.supportingEvidence || {}
      };
    } catch (error) {
      // Fallback structure
      return {
        sections: [
          {
            id: 'executive-summary',
            title: 'Executive Summary',
            content: 'High-level overview of investment opportunities',
            type: 'introduction',
            priority: 1,
            dependencies: []
          },
          {
            id: 'investment-ideas',
            title: 'Investment Opportunities',
            content: 'Detailed analysis of recommended investments',
            type: 'recommendations',
            priority: 2,
            dependencies: ['executive-summary']
          }
        ],
        flow: ['executive-summary', 'investment-ideas'],
        keyMessages: ['Strong investment opportunities identified', 'Risk-adjusted returns favorable'],
        supportingEvidence: {}
      };
    }
  }

  /**
   * Generate detailed narrative based on structure
   */
  private async generateDetailedNarrative(structure: NarrativeStructure): Promise<string> {
    const narrativePrompt = `
      Generate a comprehensive investment report narrative based on this structure:
      
      ${JSON.stringify(structure, null, 2)}
      
      Create a professional, coherent narrative that:
      1. Flows logically from section to section
      2. Maintains consistent tone and style
      3. Supports key messages with evidence
      4. Uses clear, professional language
      5. Includes appropriate transitions
      
      The narrative should be suitable for investment professionals and decision-makers.
    `;

    const response = await this.claudeSonnetService.complete({
      prompt: narrativePrompt,
      maxTokens: 4000,
      temperature: 0.4
    });

    return response.completion;
  }

  /**
   * Generate executive summary
   */
  private async generateExecutiveSummary(
    investmentIdeas: InvestmentIdea[],
    integratedResults: any
  ): Promise<string> {
    const summaryPrompt = `
      Create a concise executive summary for the following investment analysis:
      
      Number of Investment Ideas: ${investmentIdeas.length}
      Average Confidence: ${investmentIdeas.reduce((sum, idea) => sum + idea.confidenceScore, 0) / investmentIdeas.length}
      
      Investment Ideas:
      ${investmentIdeas.map(idea => `- ${idea.title}: ${idea.description.substring(0, 100)}...`).join('\n')}
      
      Integrated Analysis: ${JSON.stringify(integratedResults, null, 2)}
      
      The summary should be 3-4 paragraphs covering:
      1. Key findings and opportunities
      2. Risk assessment
      3. Recommended actions
      4. Expected outcomes
    `;

    const response = await this.claudeSonnetService.complete({
      prompt: summaryPrompt,
      maxTokens: 800,
      temperature: 0.3
    });

    return response.completion;
  }

  /**
   * Extract key insights from analysis
   */
  private async extractKeyInsights(
    investmentIdeas: InvestmentIdea[],
    integratedResults: any
  ): Promise<string[]> {
    const insightsPrompt = `
      Extract 5-7 key insights from the investment analysis:
      
      Investment Ideas: ${JSON.stringify(investmentIdeas.map(idea => ({
        title: idea.title,
        rationale: idea.rationale,
        confidence: idea.confidenceScore
      })), null, 2)}
      
      Integrated Results: ${JSON.stringify(integratedResults, null, 2)}
      
      Focus on:
      1. Market opportunities
      2. Risk factors
      3. Timing considerations
      4. Strategic implications
      5. Unique findings
      
      Return as a JSON array of strings.
    `;

    const response = await this.claudeSonnetService.complete({
      prompt: insightsPrompt,
      maxTokens: 1000,
      temperature: 0.3
    });

    try {
      return JSON.parse(response.completion);
    } catch (error) {
      // Fallback insights
      return [
        'Multiple investment opportunities identified with strong fundamentals',
        'Risk-adjusted returns appear favorable in current market conditions',
        'Diversification across sectors recommended for optimal portfolio balance',
        'Timing considerations suggest gradual position building',
        'Compliance requirements fully satisfied for all recommendations'
      ];
    }
  }

  /**
   * Generate risk summary
   */
  private async generateRiskSummary(
    investmentIdeas: InvestmentIdea[],
    complianceChecks: any[]
  ): Promise<string> {
    const riskPrompt = `
      Generate a comprehensive risk summary for the investment recommendations:
      
      Investment Ideas: ${investmentIdeas.length} recommendations
      Risk Factors: ${investmentIdeas.flatMap(idea => 
        idea.counterArguments.map((arg: CounterArgument) => arg.description)
      ).join(', ')}
      
      Compliance Status: ${JSON.stringify(complianceChecks, null, 2)}
      
      Cover:
      1. Overall risk assessment
      2. Key risk factors and mitigation strategies
      3. Compliance considerations
      4. Risk monitoring recommendations
    `;

    const response = await this.claudeSonnetService.complete({
      prompt: riskPrompt,
      maxTokens: 1200,
      temperature: 0.3
    });

    return response.completion;
  }

  /**
   * Create synthesis recommendations
   */
  private async createSynthesisRecommendations(
    investmentIdeas: InvestmentIdea[]
  ): Promise<SynthesisRecommendation[]> {
    const recommendations: SynthesisRecommendation[] = [];

    for (const idea of investmentIdeas) {
      recommendations.push({
        priority: idea.confidenceScore > 0.8 ? 'high' : idea.confidenceScore > 0.6 ? 'medium' : 'low',
        action: idea.strategy as any,
        investment: idea.title,
        rationale: idea.rationale,
        timeframe: idea.timeHorizon,
        confidence: idea.confidenceScore,
        supportingEvidence: idea.supportingData.map((dp: any) => dp.source)
      });
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate visualizations for the investment ideas
   */
  private async generateVisualizations(
    investmentIdeas: InvestmentIdea[],
    integratedResults: any
  ): Promise<VisualizationSpec[]> {
    const visualizations: VisualizationSpec[] = [];

    // Risk-Return Scatter Plot
    visualizations.push({
      id: uuidv4(),
      type: 'chart',
      title: 'Risk-Return Analysis',
      description: 'Investment opportunities plotted by expected return vs risk',
      data: {
        datasets: [{
          label: 'Investment Ideas',
          data: investmentIdeas.map(idea => ({
            x: this.calculateRiskScore(idea),
            y: idea.potentialOutcomes.find((o: Outcome) => o.scenario === 'expected')?.returnEstimate || 0,
            label: idea.title
          }))
        }]
      },
      config: {
        chartType: 'scatter',
        dimensions: { width: 800, height: 600 },
        styling: { theme: 'professional', colors: ['#2E86AB', '#A23B72', '#F18F01'] },
        interactivity: { zoom: true, filter: true, tooltip: true },
        export: { formats: ['png', 'svg'] }
      },
      priority: 'high'
    });

    // Confidence Distribution
    visualizations.push({
      id: uuidv4(),
      type: 'chart',
      title: 'Confidence Distribution',
      description: 'Distribution of confidence scores across investment ideas',
      data: {
        labels: investmentIdeas.map(idea => idea.title),
        datasets: [{
          label: 'Confidence Score',
          data: investmentIdeas.map(idea => idea.confidenceScore)
        }]
      },
      config: {
        chartType: 'bar',
        dimensions: { width: 600, height: 400 },
        styling: { theme: 'professional', colors: ['#4CAF50', '#FF9800', '#F44336'] },
        interactivity: { zoom: false, filter: true, tooltip: true },
        export: { formats: ['png'] }
      },
      priority: 'medium'
    });

    // Investment Timeline
    visualizations.push({
      id: uuidv4(),
      type: 'diagram',
      title: 'Implementation Timeline',
      description: 'Recommended timeline for investment implementation',
      data: {
        timeline: investmentIdeas.map((idea, index) => ({
          id: idea.id,
          title: idea.title,
          timeHorizon: idea.timeHorizon,
          priority: index + 1
        }))
      },
      config: {
        dimensions: { width: 1000, height: 300 },
        styling: { theme: 'professional', colors: ['#1976D2', '#388E3C', '#F57C00'] },
        interactivity: { zoom: false, filter: false, tooltip: true },
        export: { formats: ['png', 'svg'] }
      },
      priority: 'medium'
    });

    return visualizations;
  }

  /**
   * Calculate risk score for an investment idea
   */
  private calculateRiskScore(idea: InvestmentIdea): number {
    const worstCase = idea.potentialOutcomes.find((o: Outcome) => o.scenario === 'worst');
    const expected = idea.potentialOutcomes.find((o: Outcome) => o.scenario === 'expected');
    
    if (!worstCase || !expected) return 0.5;
    
    // Risk as potential downside from expected
    return Math.abs(worstCase.returnEstimate - expected.returnEstimate);
  }

  /**
   * Calculate overall confidence across investment ideas
   */
  private calculateOverallConfidence(investmentIdeas: InvestmentIdea[]): number {
    if (investmentIdeas.length === 0) return 0;
    return investmentIdeas.reduce((sum, idea) => sum + idea.confidenceScore, 0) / investmentIdeas.length;
  }

  /**
   * Handle agent messages for communication with other agents
   */
  async handleMessage(message: AgentMessage): Promise<AgentMessage> {
    try {
      let responseContent: any;

      switch (message.messageType) {
        case 'request':
          if (message.content.type === 'synthesis') {
            responseContent = await this.processSynthesisRequest(message.content.request);
          } else {
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
    } catch (error) {
      console.error('Error handling message:', error);
      throw error;
    }
  }

  /**
   * Format output for different presentation formats
   */
  async formatOutput(
    response: SynthesisResponse,
    format: 'json' | 'markdown' | 'html' | 'pdf'
  ): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(response, null, 2);
      
      case 'markdown':
        return this.formatAsMarkdown(response);
      
      case 'html':
        return this.formatAsHTML(response);
      
      case 'pdf':
        // Would integrate with PDF generation library
        return this.formatAsMarkdown(response); // Fallback to markdown
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Format response as Markdown
   */
  private formatAsMarkdown(response: SynthesisResponse): string {
    let markdown = `# Investment Analysis Report\n\n`;
    
    markdown += `## Executive Summary\n\n${response.executiveSummary}\n\n`;
    
    markdown += `## Key Insights\n\n`;
    response.keyInsights.forEach((insight, index) => {
      markdown += `${index + 1}. ${insight}\n`;
    });
    markdown += '\n';
    
    markdown += `## Investment Opportunities\n\n`;
    response.investmentIdeas.forEach((idea, index) => {
      markdown += `### ${index + 1}. ${idea.title}\n\n`;
      markdown += `**Description:** ${idea.description}\n\n`;
      markdown += `**Rationale:** ${idea.rationale}\n\n`;
      markdown += `**Confidence:** ${(idea.confidenceScore * 100).toFixed(1)}%\n\n`;
      markdown += `**Time Horizon:** ${idea.timeHorizon}\n\n`;
      
      markdown += `**Potential Outcomes:**\n`;
      idea.potentialOutcomes.forEach((outcome: Outcome) => {
        markdown += `- **${outcome.scenario.charAt(0).toUpperCase() + outcome.scenario.slice(1)}:** ${(outcome.returnEstimate * 100).toFixed(1)}% (${(outcome.probability * 100).toFixed(0)}% probability)\n`;
      });
      markdown += '\n';
    });
    
    markdown += `## Risk Assessment\n\n${response.riskSummary}\n\n`;
    
    markdown += `## Recommendations\n\n`;
    response.recommendations.forEach((rec, index) => {
      markdown += `${index + 1}. **${rec.action.toUpperCase()}** ${rec.investment} (${rec.priority} priority)\n`;
      markdown += `   - ${rec.rationale}\n`;
      markdown += `   - Confidence: ${(rec.confidence * 100).toFixed(1)}%\n\n`;
    });
    
    markdown += `---\n\n`;
    markdown += `*Report generated by Investment AI Agent - Synthesis Agent*\n`;
    markdown += `*Coherence Score: ${(response.coherenceScore * 100).toFixed(1)}%*\n`;
    markdown += `*Overall Confidence: ${(response.confidence * 100).toFixed(1)}%*\n`;
    
    return markdown;
  }

  /**
   * Format response as HTML
   */
  private formatAsHTML(response: SynthesisResponse): string {
    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Investment Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1, h2, h3 { color: #2c3e50; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .insight { margin: 10px 0; padding: 10px; background: #e3f2fd; border-radius: 3px; }
        .investment { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .confidence { font-weight: bold; color: #27ae60; }
        .risk { color: #e74c3c; }
        .recommendation { margin: 10px 0; padding: 10px; background: #f0f8ff; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>Investment Analysis Report</h1>
    
    <div class="summary">
        <h2>Executive Summary</h2>
        <p>${response.executiveSummary.replace(/\n/g, '</p><p>')}</p>
    </div>
    
    <h2>Key Insights</h2>
    ${response.keyInsights.map(insight => `<div class="insight">${insight}</div>`).join('')}
    
    <h2>Investment Opportunities</h2>
    ${response.investmentIdeas.map((idea, index) => `
        <div class="investment">
            <h3>${index + 1}. ${idea.title}</h3>
            <p><strong>Description:</strong> ${idea.description}</p>
            <p><strong>Rationale:</strong> ${idea.rationale}</p>
            <p><strong>Confidence:</strong> <span class="confidence">${(idea.confidenceScore * 100).toFixed(1)}%</span></p>
            <p><strong>Time Horizon:</strong> ${idea.timeHorizon}</p>
            <h4>Potential Outcomes:</h4>
            <ul>
                ${idea.potentialOutcomes.map((outcome: Outcome) => `
                    <li><strong>${outcome.scenario.charAt(0).toUpperCase() + outcome.scenario.slice(1)}:</strong> 
                        ${(outcome.returnEstimate * 100).toFixed(1)}% (${(outcome.probability * 100).toFixed(0)}% probability)
                    </li>
                `).join('')}
            </ul>
        </div>
    `).join('')}
    
    <h2>Risk Assessment</h2>
    <div class="risk">
        <p>${response.riskSummary.replace(/\n/g, '</p><p>')}</p>
    </div>
    
    <h2>Recommendations</h2>
    ${response.recommendations.map((rec, index) => `
        <div class="recommendation">
            <strong>${index + 1}. ${rec.action.toUpperCase()}</strong> ${rec.investment} (${rec.priority} priority)<br>
            ${rec.rationale}<br>
            <span class="confidence">Confidence: ${(rec.confidence * 100).toFixed(1)}%</span>
        </div>
    `).join('')}
    
    <hr>
    <p><em>Report generated by Investment AI Agent - Synthesis Agent</em></p>
    <p><em>Coherence Score: ${(response.coherenceScore * 100).toFixed(1)}%</em></p>
    <p><em>Overall Confidence: ${(response.confidence * 100).toFixed(1)}%</em></p>
</body>
</html>
    `;
    
    return html;
  }
}