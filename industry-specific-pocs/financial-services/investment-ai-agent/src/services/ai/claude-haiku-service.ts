/**
 * Claude Haiku 3.5 service wrapper
 * 
 * This service provides a specialized wrapper for the Claude Haiku 3.5 model
 * with optimizations for efficiency and quick processing.
 */

import { BedrockClientService } from './bedrock-client';
import { 
  BedrockModelId, 
  BedrockModelConfig, 
  BedrockResponse, 
  BedrockError 
} from '../../models/bedrock';

/**
 * Claude Haiku prompt template types
 * Optimized for quick processing and specific use cases
 */
export enum ClaudeHaikuPromptTemplate {
  DEFAULT = 'default',
  QUICK_ANALYSIS = 'quick-analysis',
  DATA_EXTRACTION = 'data-extraction',
  COMPLIANCE_CHECK = 'compliance-check',
  COMPLIANCE_ANALYSIS = 'compliance-analysis',
  RISK_ANALYSIS = 'risk-analysis',
  ESG_ANALYSIS = 'esg-analysis',
  DOCUMENTATION = 'documentation',
  MARKET_SUMMARY = 'market-summary',
  RESEARCH_SYNTHESIS = 'research-synthesis'
}

/**
 * Claude Haiku request options
 */
export interface ClaudeHaikuRequestOptions {
  prompt: string;
  systemPrompt?: string;
  template?: ClaudeHaikuPromptTemplate;
  templateVariables?: Record<string, any>;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  streaming?: boolean;
  requestId?: string;
}

/**
 * Claude Haiku response parser options
 */
export interface HaikuResponseParserOptions {
  extractJson?: boolean;
  formatType?: 'markdown' | 'html' | 'text';
  validateSchema?: any;
}

/**
 * Claude Haiku service
 * Optimized for efficiency and quick processing
 */
export class ClaudeHaikuService {
  private bedrockClient: BedrockClientService;
  private modelConfig: BedrockModelConfig;
  private promptTemplates: Map<ClaudeHaikuPromptTemplate, string>;

  /**
   * Create a new Claude Haiku service
   * @param bedrockClient The Bedrock client service
   * @param config Optional model configuration overrides
   */
  constructor(
    bedrockClient: BedrockClientService,
    config?: Partial<BedrockModelConfig>
  ) {
    this.bedrockClient = bedrockClient;
    
    // Get the default model configuration and apply any overrides
    this.modelConfig = {
      ...bedrockClient.getModelConfig(BedrockModelId.CLAUDE_HAIKU_3_5),
      ...config
    };
    
    // Initialize prompt templates optimized for quick processing
    this.promptTemplates = this.initializePromptTemplates();
  }

  /**
   * Initialize prompt templates optimized for quick processing
   * @returns Map of prompt templates
   */
  private initializePromptTemplates(): Map<ClaudeHaikuPromptTemplate, string> {
    const templates = new Map<ClaudeHaikuPromptTemplate, string>();
    
    // Default template - simplified for efficiency
    templates.set(ClaudeHaikuPromptTemplate.DEFAULT, `{{prompt}}`);
    
    // Quick analysis template - streamlined for fast processing
    templates.set(ClaudeHaikuPromptTemplate.QUICK_ANALYSIS, `
      # Quick Analysis Request
      
      ## Topic
      {{topic}}
      
      ## Analysis Points
      {{points}}
      
      ## Output Format
      {{format}}
    `);
    
    // Data extraction template - focused on structured data
    templates.set(ClaudeHaikuPromptTemplate.DATA_EXTRACTION, `
      # Data Extraction
      
      ## Source
      {{source}}
      
      ## Extract
      {{extract}}
      
      ## Format
      {{format}}
    `);
    
    // Compliance check template - simplified for quick checks
    templates.set(ClaudeHaikuPromptTemplate.COMPLIANCE_CHECK, `
      # Compliance Check
      
      ## Investment
      {{investment}}
      
      ## Regulations
      {{regulations}}
      
      ## Check
      {{check}}
    `);
    
    // Market summary template - for quick market updates
    templates.set(ClaudeHaikuPromptTemplate.MARKET_SUMMARY, `
      # Market Summary
      
      ## Market Data
      {{data}}
      
      ## Focus Areas
      {{focus}}
      
      ## Summary Type
      {{type}}
    `);
    
    // Research synthesis template - for combining research findings
    templates.set(ClaudeHaikuPromptTemplate.RESEARCH_SYNTHESIS, `
      # Research Synthesis
      
      ## Research Points
      {{points}}
      
      ## Synthesis Goal
      {{goal}}
      
      ## Output Requirements
      {{requirements}}
    `);
    
    // Compliance analysis template - for detailed compliance analysis
    templates.set(ClaudeHaikuPromptTemplate.COMPLIANCE_ANALYSIS, `
      # Compliance Analysis
      
      ## Investment Details
      Name: {{investmentName}}
      Type: {{investmentType}}
      Sector: {{sector}}
      
      ## Jurisdictions
      {{jurisdictions}}
      
      ## Analysis Type
      {{analysisType}}
      
      ## Instructions
      {{prompt}}
      
      Please provide a structured compliance analysis with specific findings and recommendations.
    `);
    
    // Risk analysis template - for risk assessment
    templates.set(ClaudeHaikuPromptTemplate.RISK_ANALYSIS, `
      # Risk Analysis
      
      ## Investment
      {{investmentName}} ({{investmentType}})
      
      ## Risk Context
      - Risk Tolerance: {{riskTolerance}}
      - Time Horizon: {{timeHorizon}}
      - Analysis Type: {{analysisType}}
      
      ## Instructions
      {{prompt}}
      
      Please provide a comprehensive risk assessment with specific risk factors and mitigation strategies.
    `);
    
    // ESG analysis template - for ESG evaluation
    templates.set(ClaudeHaikuPromptTemplate.ESG_ANALYSIS, `
      # ESG Analysis
      
      ## Investment
      {{investmentName}}
      Sector: {{sector}}
      Industry: {{industry}}
      
      ## Analysis Type
      {{analysisType}}
      
      ## Instructions
      {{prompt}}
      
      Please provide detailed ESG scoring and analysis with specific factors and recommendations.
    `);
    
    // Documentation template - for generating compliance documents
    templates.set(ClaudeHaikuPromptTemplate.DOCUMENTATION, `
      # {{documentType}} Documentation
      
      ## Subject
      {{subject}}
      
      ## Jurisdiction
      {{jurisdiction}}
      
      ## Analysis Type
      {{analysisType}}
      
      ## Instructions
      {{prompt}}
      
      Please generate professional compliance documentation with proper structure and references.
    `);
    
    return templates;
  }

  /**
   * Apply a prompt template with optimized processing
   * @param template The template to apply
   * @param variables The variables to substitute
   * @returns The formatted prompt
   */
  private applyTemplate(template: string, variables: Record<string, any>): string {
    let result = template;
    
    // Replace all variables in the template
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(placeholder, value);
    }
    
    // Remove any remaining placeholders
    result = result.replace(/{{[^}]+}}/g, '');
    
    // Clean up the result by removing extra whitespace
    result = result.trim()
      .split('\n')
      .map(line => line.trim())
      .join('\n');
    
    return result;
  }

  /**
   * Generate a system prompt for Claude Haiku
   * Optimized for conciseness and efficiency
   * @param role The role for Claude to assume
   * @param context Additional context for the role
   * @param constraints Constraints for Claude's responses
   * @returns The formatted system prompt
   */
  public generateSystemPrompt(
    role: string,
    context?: string,
    constraints?: string[]
  ): string {
    // Create a concise system prompt for efficiency
    let systemPrompt = `You are ${role}.`;
    
    if (context) {
      systemPrompt += ` ${context}`;
    }
    
    if (constraints && constraints.length > 0) {
      systemPrompt += ' Constraints:';
      for (const constraint of constraints) {
        systemPrompt += ` ${constraint}.`;
      }
    }
    
    return systemPrompt;
  }

  /**
   * Complete a prompt using Claude Haiku 3.5
   * Optimized for efficiency and quick processing
   * @param options Request options
   * @returns The model response
   */
  public async complete(options: ClaudeHaikuRequestOptions): Promise<BedrockResponse> {
    try {
      // Apply template if specified
      let finalPrompt = options.prompt;
      if (options.template && options.templateVariables) {
        const templateString = this.promptTemplates.get(options.template) || this.promptTemplates.get(ClaudeHaikuPromptTemplate.DEFAULT)!;
        finalPrompt = this.applyTemplate(templateString, {
          ...options.templateVariables,
          prompt: options.prompt
        });
      }
      
      // Create model config with any overrides
      // Use lower token limits by default for efficiency
      const modelConfig: BedrockModelConfig = {
        ...this.modelConfig,
        maxTokens: options.maxTokens || this.modelConfig.maxTokens,
        temperature: options.temperature || this.modelConfig.temperature,
        topP: options.topP || this.modelConfig.topP,
        stopSequences: options.stopSequences || this.modelConfig.stopSequences
      };
      
      // Invoke the model
      if (options.streaming) {
        return this.streamComplete(finalPrompt, options.systemPrompt, modelConfig, options.requestId);
      } else {
        return this.bedrockClient.invokeModel({
          modelConfig,
          prompt: finalPrompt,
          systemPrompt: options.systemPrompt,
          requestId: options.requestId
        });
      }
    } catch (error) {
      console.error('Error completing prompt with Claude Haiku:', error);
      throw this.formatError(error, 'CLAUDE_HAIKU_COMPLETION_ERROR');
    }
  }

  /**
   * Complete a prompt using Claude Haiku 3.5 with streaming
   * @param prompt The prompt to complete
   * @param systemPrompt Optional system prompt
   * @param modelConfig Model configuration
   * @param requestId Optional request ID
   * @returns The final model response
   */
  private async streamComplete(
    prompt: string,
    systemPrompt?: string,
    modelConfig?: BedrockModelConfig,
    requestId?: string
  ): Promise<BedrockResponse> {
    const config = modelConfig || this.modelConfig;
    let fullResponse = '';
    let finalResponse: Partial<BedrockResponse> = {};
    
    try {
      for await (const chunk of this.bedrockClient.invokeModelWithStreaming({
        modelConfig: config,
        prompt,
        systemPrompt,
        requestId
      })) {
        if (chunk.completion) {
          // If this is the final chunk with the complete response, don't append it
          // as it would duplicate the content
          if (chunk.finishReason) {
            finalResponse = chunk;
            // The last chunk is the complete response, so use it directly
            fullResponse = chunk.completion;
          } else {
            // For intermediate chunks, append to the full response
            fullResponse += chunk.completion;
          }
        }
      }
      
      // Return the complete response
      return {
        completion: fullResponse,
        modelId: config.modelId,
        usage: finalResponse.usage || {
          inputTokens: -1,
          outputTokens: -1,
          totalTokens: -1
        },
        requestId: requestId || 'unknown',
        finishReason: finalResponse.finishReason || 'unknown'
      };
    } catch (error) {
      console.error('Error streaming completion with Claude Haiku:', error);
      throw this.formatError(error, 'CLAUDE_HAIKU_STREAMING_ERROR');
    }
  }

  /**
   * Parse a response from Claude Haiku
   * Optimized for efficiency with simplified parsing
   * @param response The response to parse
   * @param options Parsing options
   * @returns The parsed response
   */
  public parseResponse(response: BedrockResponse, options?: HaikuResponseParserOptions): any {
    const { completion } = response;
    
    try {
      // Extract JSON if requested - optimized for speed
      if (options?.extractJson) {
        // First try to find JSON in code blocks
        const jsonMatch = completion.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            return JSON.parse(jsonMatch[1].trim());
          } catch (e) {
            // If parsing fails, continue to next method
          }
        }
        
        // Try to parse the entire response as JSON
        try {
          return JSON.parse(completion);
        } catch (e) {
          // Not valid JSON, continue with other parsing options
        }
      }
      
      // Format the response if requested - simplified for speed
      if (options?.formatType) {
        switch (options.formatType) {
          case 'markdown':
            // Return as-is, assuming Claude already outputs markdown
            return completion;
          case 'html':
            // Simplified HTML conversion for speed
            return completion
              .replace(/#{1,6} (.+)/g, '<h3>$1</h3>')
              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.+?)\*/g, '<em>$1</em>')
              .replace(/\n\n/g, '<br>');
          case 'text':
            // Simplified text conversion for speed
            return completion
              .replace(/#{1,6} /g, '')
              .replace(/\*\*(.+?)\*\*/g, '$1')
              .replace(/\*(.+?)\*/g, '$1');
          default:
            return completion;
        }
      }
      
      // Default: return the raw completion
      return completion;
    } catch (error) {
      console.error('Error parsing Claude Haiku response:', error);
      throw this.formatError(error, 'CLAUDE_HAIKU_PARSING_ERROR');
    }
  }

  /**
   * Format an error
   * @param error The error
   * @param code The error code
   * @returns The formatted error
   */
  private formatError(error: any, code: string): BedrockError {
    return {
      code,
      message: error.message || 'Unknown error',
      requestId: error.requestId,
      statusCode: error.statusCode,
      timestamp: new Date()
    };
  }
}