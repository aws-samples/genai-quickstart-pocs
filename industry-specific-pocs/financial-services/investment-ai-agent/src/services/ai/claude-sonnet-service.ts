/**
 * Claude Sonnet 3.7 service wrapper
 * 
 * This service provides a specialized wrapper for the Claude Sonnet 3.7 model
 * with prompt engineering utilities and response parsing.
 */

import { BedrockClientService } from './bedrock-client';
import { 
  BedrockModelId, 
  BedrockModelConfig, 
  BedrockResponse, 
  BedrockError 
} from '../../models/bedrock';

/**
 * Claude Sonnet prompt template types
 */
export enum ClaudePromptTemplate {
  DEFAULT = 'default',
  INVESTMENT_ANALYSIS = 'investment-analysis',
  MARKET_RESEARCH = 'market-research',
  RISK_ASSESSMENT = 'risk-assessment',
  COMPLIANCE_CHECK = 'compliance-check',
  IDEA_GENERATION = 'idea-generation',
  DATA_EXTRACTION = 'data-extraction',
  EXPLANATION = 'explanation'
}

/**
 * Claude Sonnet request options
 */
export interface ClaudeSonnetRequestOptions {
  prompt: string;
  systemPrompt?: string;
  template?: ClaudePromptTemplate;
  templateVariables?: Record<string, any>;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  streaming?: boolean;
  requestId?: string;
}

/**
 * Claude Sonnet response parser options
 */
export interface ResponseParserOptions {
  extractJson?: boolean;
  formatType?: 'markdown' | 'html' | 'text';
  validateSchema?: any;
}

/**
 * Claude Sonnet service
 */
export class ClaudeSonnetService {
  private bedrockClient: BedrockClientService;
  private modelConfig: BedrockModelConfig;
  private promptTemplates: Map<ClaudePromptTemplate, string>;

  /**
   * Create a new Claude Sonnet service
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
      ...bedrockClient.getModelConfig(BedrockModelId.CLAUDE_SONNET_3_7),
      ...config
    };
    
    // Initialize prompt templates
    this.promptTemplates = this.initializePromptTemplates();
  }

  /**
   * Initialize prompt templates for different use cases
   * @returns Map of prompt templates
   */
  private initializePromptTemplates(): Map<ClaudePromptTemplate, string> {
    const templates = new Map<ClaudePromptTemplate, string>();
    
    // Default template
    templates.set(ClaudePromptTemplate.DEFAULT, `
      {{prompt}}
    `);
    
    // Investment analysis template
    templates.set(ClaudePromptTemplate.INVESTMENT_ANALYSIS, `
      # Investment Analysis Request
      
      ## Context
      {{context}}
      
      ## Investment Details
      {{investmentDetails}}
      
      ## Analysis Requirements
      {{analysisRequirements}}
      
      ## Questions
      {{questions}}
    `);
    
    // Market research template
    templates.set(ClaudePromptTemplate.MARKET_RESEARCH, `
      # Market Research Request
      
      ## Research Topic
      {{topic}}
      
      ## Specific Questions
      {{questions}}
      
      ## Data Sources to Consider
      {{dataSources}}
      
      ## Output Format
      {{outputFormat}}
    `);
    
    // Risk assessment template
    templates.set(ClaudePromptTemplate.RISK_ASSESSMENT, `
      # Risk Assessment Request
      
      ## Investment or Strategy
      {{investment}}
      
      ## Risk Factors to Consider
      {{riskFactors}}
      
      ## Risk Metrics Required
      {{riskMetrics}}
      
      ## Time Horizon
      {{timeHorizon}}
    `);
    
    // Compliance check template
    templates.set(ClaudePromptTemplate.COMPLIANCE_CHECK, `
      # Compliance Check Request
      
      ## Investment or Strategy
      {{investment}}
      
      ## Regulatory Framework
      {{regulations}}
      
      ## Compliance Requirements
      {{requirements}}
      
      ## Specific Concerns
      {{concerns}}
    `);
    
    // Idea generation template
    templates.set(ClaudePromptTemplate.IDEA_GENERATION, `
      # Investment Idea Generation Request
      
      ## Investment Parameters
      {{parameters}}
      
      ## Market Context
      {{marketContext}}
      
      ## User Preferences
      {{preferences}}
      
      ## Constraints
      {{constraints}}
    `);
    
    // Data extraction template
    templates.set(ClaudePromptTemplate.DATA_EXTRACTION, `
      # Data Extraction Request
      
      ## Document or Data Source
      {{source}}
      
      ## Extraction Requirements
      {{requirements}}
      
      ## Output Format
      {{outputFormat}}
    `);
    
    // Explanation template
    templates.set(ClaudePromptTemplate.EXPLANATION, `
      # Explanation Request
      
      ## Topic to Explain
      {{topic}}
      
      ## Target Audience
      {{audience}}
      
      ## Complexity Level
      {{complexity}}
      
      ## Required Elements
      {{elements}}
    `);
    
    return templates;
  }

  /**
   * Apply a prompt template
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
   * Generate a system prompt for Claude Sonnet
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
    let systemPrompt = `You are ${role}.`;
    
    if (context) {
      systemPrompt += `\n\n${context}`;
    }
    
    if (constraints && constraints.length > 0) {
      systemPrompt += '\n\nConstraints:';
      for (const constraint of constraints) {
        systemPrompt += `\n- ${constraint}`;
      }
    }
    
    return systemPrompt;
  }

  /**
   * Complete a prompt using Claude Sonnet 3.7
   * @param options Request options
   * @returns The model response
   */
  public async complete(options: ClaudeSonnetRequestOptions): Promise<BedrockResponse> {
    try {
      // Apply template if specified
      let finalPrompt = options.prompt;
      if (options.template && options.templateVariables) {
        const templateString = this.promptTemplates.get(options.template) || this.promptTemplates.get(ClaudePromptTemplate.DEFAULT)!;
        finalPrompt = this.applyTemplate(templateString, {
          ...options.templateVariables,
          prompt: options.prompt
        });
      }
      
      // Create model config with any overrides
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
      console.error('Error completing prompt with Claude Sonnet:', error);
      throw this.formatError(error, 'CLAUDE_SONNET_COMPLETION_ERROR');
    }
  }

  /**
   * Complete a prompt using Claude Sonnet 3.7 with streaming
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
      // Track the last chunk to avoid duplicating content in the final response
      let lastChunk = '';
      
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
            lastChunk = chunk.completion;
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
      console.error('Error streaming completion with Claude Sonnet:', error);
      throw this.formatError(error, 'CLAUDE_SONNET_STREAMING_ERROR');
    }
  }

  /**
   * Parse a response from Claude Sonnet
   * @param response The response to parse
   * @param options Parsing options
   * @returns The parsed response
   */
  public parseResponse(response: BedrockResponse, options?: ResponseParserOptions): any {
    const { completion } = response;
    
    try {
      // Extract JSON if requested
      if (options?.extractJson) {
        const jsonMatch = completion.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          const jsonStr = jsonMatch[1].trim();
          const parsed = JSON.parse(jsonStr);
          
          // Validate against schema if provided
          if (options.validateSchema) {
            // Schema validation would be implemented here
            // For now, we'll just return the parsed JSON
          }
          
          return parsed;
        }
        
        // Try to find JSON without code blocks
        try {
          return JSON.parse(completion);
        } catch (e) {
          // Not valid JSON, continue with other parsing options
        }
      }
      
      // Format the response if requested
      if (options?.formatType) {
        switch (options.formatType) {
          case 'markdown':
            // Return as-is, assuming Claude already outputs markdown
            return completion;
          case 'html':
            // Convert markdown to HTML (simplified)
            return completion
              .replace(/#{1,6} (.+)/g, (match, p1, offset, string) => {
                const level = match.trim().indexOf(' ');
                return `<h${level}>${p1}</h${level}>`;
              })
              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.+?)\*/g, '<em>$1</em>')
              .replace(/\n\n/g, '<br><br>');
          case 'text':
            // Strip markdown formatting (simplified)
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
      console.error('Error parsing Claude Sonnet response:', error);
      throw this.formatError(error, 'CLAUDE_SONNET_PARSING_ERROR');
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