/**
 * Amazon Nova Pro service wrapper
 * 
 * This service provides a specialized wrapper for the Amazon Nova Pro model
 * configured for financial analysis and quantitative tasks.
 */

import { BedrockClientService } from './bedrock-client';
import { 
  BedrockModelId, 
  BedrockModelConfig, 
  BedrockResponse, 
  BedrockError 
} from '../../models/bedrock';

/**
 * Amazon Nova Pro prompt template types
 * Specialized for financial analysis and quantitative tasks
 */
export enum NovaProPromptTemplate {
  DEFAULT = 'default',
  FINANCIAL_ANALYSIS = 'financial-analysis',
  QUANTITATIVE_ANALYSIS = 'quantitative-analysis',
  RISK_MODELING = 'risk-modeling',
  PORTFOLIO_OPTIMIZATION = 'portfolio-optimization',
  TIME_SERIES_ANALYSIS = 'time-series-analysis',
  CORRELATION_ANALYSIS = 'correlation-analysis',
  SCENARIO_MODELING = 'scenario-modeling',
  VALUATION_ANALYSIS = 'valuation-analysis'
}

/**
 * Amazon Nova Pro request options
 */
export interface NovaProRequestOptions {
  prompt: string;
  systemPrompt?: string;
  template?: NovaProPromptTemplate;
  templateVariables?: Record<string, any>;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  streaming?: boolean;
  requestId?: string;
  analysisType?: 'quantitative' | 'qualitative' | 'mixed';
  outputFormat?: 'structured' | 'narrative' | 'json';
}

/**
 * Amazon Nova Pro response parser options
 */
export interface NovaProResponseParserOptions {
  extractJson?: boolean;
  extractMetrics?: boolean;
  formatType?: 'markdown' | 'html' | 'text' | 'structured';
  validateSchema?: any;
  parseNumbers?: boolean;
}

/**
 * Financial metrics extraction result
 */
export interface FinancialMetrics {
  ratios?: Record<string, number>;
  returns?: Record<string, number>;
  risks?: Record<string, number>;
  correlations?: Record<string, number>;
  projections?: Record<string, number[]>;
  confidence?: Record<string, number>;
}

/**
 * Amazon Nova Pro service
 * Specialized for financial analysis and quantitative tasks
 */
export class AmazonNovaProService {
  private bedrockClient: BedrockClientService;
  private modelConfig: BedrockModelConfig;
  private promptTemplates: Map<NovaProPromptTemplate, string>;

  /**
   * Create a new Amazon Nova Pro service
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
      ...bedrockClient.getModelConfig(BedrockModelId.AMAZON_NOVA_PRO),
      ...config
    };
    
    // Initialize prompt templates specialized for financial analysis
    this.promptTemplates = this.initializePromptTemplates();
  }

  /**
   * Initialize prompt templates specialized for financial analysis and quantitative tasks
   * @returns Map of prompt templates
   */
  private initializePromptTemplates(): Map<NovaProPromptTemplate, string> {
    const templates = new Map<NovaProPromptTemplate, string>();
    
    // Default template
    templates.set(NovaProPromptTemplate.DEFAULT, `{{prompt}}`);
    
    // Financial analysis template - comprehensive financial evaluation
    templates.set(NovaProPromptTemplate.FINANCIAL_ANALYSIS, `
      # Financial Analysis Request
      
      ## Company/Investment Details
      {{investmentDetails}}
      
      ## Financial Data
      {{financialData}}
      
      ## Analysis Requirements
      {{analysisRequirements}}
      
      ## Key Metrics to Calculate
      {{keyMetrics}}
      
      ## Time Period
      {{timePeriod}}
      
      ## Output Requirements
      Please provide:
      1. Key financial ratios and their interpretation
      2. Trend analysis over the specified period
      3. Comparative analysis against benchmarks
      4. Risk assessment and key concerns
      5. Investment recommendation with supporting rationale
      
      Format the response with clear sections and include numerical calculations where applicable.
    `);
    
    // Quantitative analysis template - mathematical and statistical analysis
    templates.set(NovaProPromptTemplate.QUANTITATIVE_ANALYSIS, `
      # Quantitative Analysis Request
      
      ## Dataset Description
      {{datasetDescription}}
      
      ## Analysis Type
      {{analysisType}}
      
      ## Statistical Methods Required
      {{statisticalMethods}}
      
      ## Variables of Interest
      {{variables}}
      
      ## Hypothesis or Research Questions
      {{hypothesis}}
      
      ## Output Requirements
      Please provide:
      1. Descriptive statistics summary
      2. Statistical test results with p-values
      3. Correlation and regression analysis
      4. Confidence intervals and significance levels
      5. Interpretation of results and practical implications
      
      Include all relevant calculations and statistical measures.
    `);
    
    // Risk modeling template - comprehensive risk assessment
    templates.set(NovaProPromptTemplate.RISK_MODELING, `
      # Risk Modeling Request
      
      ## Investment/Portfolio Details
      {{investmentDetails}}
      
      ## Risk Factors
      {{riskFactors}}
      
      ## Historical Data
      {{historicalData}}
      
      ## Risk Metrics Required
      {{riskMetrics}}
      
      ## Time Horizon
      {{timeHorizon}}
      
      ## Output Requirements
      Please calculate and analyze:
      1. Value at Risk (VaR) at different confidence levels
      2. Expected Shortfall (Conditional VaR)
      3. Maximum Drawdown analysis
      4. Beta and correlation with market indices
      5. Stress testing scenarios
      6. Risk-adjusted return metrics (Sharpe, Sortino, Calmar ratios)
      
      Provide detailed calculations and risk interpretation.
    `);
    
    // Portfolio optimization template - modern portfolio theory application
    templates.set(NovaProPromptTemplate.PORTFOLIO_OPTIMIZATION, `
      # Portfolio Optimization Request
      
      ## Available Assets
      {{availableAssets}}
      
      ## Expected Returns
      {{expectedReturns}}
      
      ## Risk Data (Covariance Matrix)
      {{riskData}}
      
      ## Constraints
      {{constraints}}
      
      ## Optimization Objective
      {{objective}}
      
      ## Output Requirements
      Please provide:
      1. Optimal portfolio weights
      2. Expected portfolio return and risk
      3. Efficient frontier analysis
      4. Sensitivity analysis
      5. Alternative portfolio scenarios
      6. Risk contribution analysis
      
      Include mathematical justification for the optimization approach.
    `);
    
    // Time series analysis template - temporal data analysis
    templates.set(NovaProPromptTemplate.TIME_SERIES_ANALYSIS, `
      # Time Series Analysis Request
      
      ## Time Series Data
      {{timeSeriesData}}
      
      ## Analysis Period
      {{analysisPeriod}}
      
      ## Forecasting Horizon
      {{forecastingHorizon}}
      
      ## Seasonality Considerations
      {{seasonality}}
      
      ## External Factors
      {{externalFactors}}
      
      ## Output Requirements
      Please provide:
      1. Trend and seasonality decomposition
      2. Stationarity tests and transformations
      3. Autocorrelation and partial autocorrelation analysis
      4. Model selection and parameter estimation
      5. Forecasting with confidence intervals
      6. Model diagnostics and validation
      
      Include statistical tests and model performance metrics.
    `);
    
    // Correlation analysis template - relationship analysis
    templates.set(NovaProPromptTemplate.CORRELATION_ANALYSIS, `
      # Correlation Analysis Request
      
      ## Variables/Assets
      {{variables}}
      
      ## Data Period
      {{dataPeriod}}
      
      ## Correlation Types
      {{correlationTypes}}
      
      ## Market Conditions
      {{marketConditions}}
      
      ## Output Requirements
      Please analyze:
      1. Pearson and Spearman correlation matrices
      2. Rolling correlation analysis
      3. Conditional correlations during different market regimes
      4. Correlation stability over time
      5. Principal component analysis
      6. Clustering analysis based on correlations
      
      Provide statistical significance tests and practical interpretation.
    `);
    
    // Scenario modeling template - what-if analysis
    templates.set(NovaProPromptTemplate.SCENARIO_MODELING, `
      # Scenario Modeling Request
      
      ## Base Case Assumptions
      {{baseCaseAssumptions}}
      
      ## Scenario Definitions
      {{scenarioDefinitions}}
      
      ## Key Variables
      {{keyVariables}}
      
      ## Impact Metrics
      {{impactMetrics}}
      
      ## Probability Assessments
      {{probabilities}}
      
      ## Output Requirements
      Please provide:
      1. Detailed scenario outcomes for each case
      2. Sensitivity analysis for key variables
      3. Monte Carlo simulation results
      4. Probability-weighted expected outcomes
      5. Stress testing results
      6. Risk mitigation strategies for adverse scenarios
      
      Include quantitative analysis and decision-making insights.
    `);
    
    // Valuation analysis template - investment valuation
    templates.set(NovaProPromptTemplate.VALUATION_ANALYSIS, `
      # Valuation Analysis Request
      
      ## Investment Details
      {{investmentDetails}}
      
      ## Financial Statements
      {{financialStatements}}
      
      ## Market Data
      {{marketData}}
      
      ## Valuation Methods
      {{valuationMethods}}
      
      ## Assumptions
      {{assumptions}}
      
      ## Output Requirements
      Please provide:
      1. Discounted Cash Flow (DCF) analysis
      2. Comparable company analysis
      3. Precedent transaction analysis
      4. Asset-based valuation (if applicable)
      5. Sensitivity analysis on key assumptions
      6. Fair value range and recommendation
      
      Include detailed calculations and valuation methodology justification.
    `);
    
    return templates;
  }

  /**
   * Apply a prompt template with financial analysis optimization
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
   * Generate a system prompt for Amazon Nova Pro
   * Optimized for financial analysis and quantitative tasks
   * @param role The role for Nova Pro to assume
   * @param context Additional context for the role
   * @param constraints Constraints for Nova Pro's responses
   * @returns The formatted system prompt
   */
  public generateSystemPrompt(
    role: string,
    context?: string,
    constraints?: string[]
  ): string {
    let systemPrompt = `You are ${role} with expertise in financial analysis, quantitative methods, and investment research.`;
    
    // Add financial analysis specific context
    systemPrompt += `
    
You have deep knowledge of:
- Financial statement analysis and ratio interpretation
- Statistical analysis and econometric methods
- Risk modeling and portfolio optimization
- Time series analysis and forecasting
- Valuation methodologies and market analysis
- Regulatory compliance and investment guidelines

When performing analysis:
- Always show your calculations and methodology
- Provide statistical significance and confidence levels
- Include assumptions and limitations
- Offer practical interpretation of results
- Consider multiple scenarios and sensitivity analysis`;
    
    if (context) {
      systemPrompt += `\n\nAdditional Context: ${context}`;
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
   * Complete a prompt using Amazon Nova Pro
   * Optimized for financial analysis and quantitative tasks
   * @param options Request options
   * @returns The model response
   */
  public async complete(options: NovaProRequestOptions): Promise<BedrockResponse> {
    try {
      // Apply template if specified
      let finalPrompt = options.prompt;
      if (options.template && options.templateVariables) {
        const templateString = this.promptTemplates.get(options.template) || this.promptTemplates.get(NovaProPromptTemplate.DEFAULT)!;
        finalPrompt = this.applyTemplate(templateString, {
          ...options.templateVariables,
          prompt: options.prompt
        });
      }
      
      // Enhance system prompt for financial analysis if not provided
      let systemPrompt = options.systemPrompt;
      if (!systemPrompt) {
        const role = this.determineRoleFromAnalysisType(options.analysisType);
        systemPrompt = this.generateSystemPrompt(role);
      }
      
      // Create model config with any overrides
      // Optimize for financial analysis tasks
      const modelConfig: BedrockModelConfig = {
        ...this.modelConfig,
        maxTokens: options.maxTokens || this.modelConfig.maxTokens,
        temperature: options.temperature !== undefined ? options.temperature : 0.3, // Lower temperature for more precise calculations
        topP: options.topP || this.modelConfig.topP,
        stopSequences: options.stopSequences || this.modelConfig.stopSequences
      };
      
      // Invoke the model
      if (options.streaming) {
        return this.streamComplete(finalPrompt, systemPrompt, modelConfig, options.requestId);
      } else {
        return this.bedrockClient.invokeModel({
          modelConfig,
          prompt: finalPrompt,
          systemPrompt,
          requestId: options.requestId
        });
      }
    } catch (error) {
      console.error('Error completing prompt with Amazon Nova Pro:', error);
      throw this.formatError(error, 'NOVA_PRO_COMPLETION_ERROR');
    }
  }

  /**
   * Determine the appropriate role based on analysis type
   * @param analysisType The type of analysis being performed
   * @returns The appropriate role description
   */
  private determineRoleFromAnalysisType(analysisType?: string): string {
    switch (analysisType) {
      case 'quantitative':
        return 'a quantitative analyst specializing in statistical analysis and mathematical modeling';
      case 'qualitative':
        return 'a financial analyst specializing in qualitative investment research and market analysis';
      case 'mixed':
        return 'a senior investment analyst with expertise in both quantitative and qualitative analysis';
      default:
        return 'a financial analyst and quantitative researcher';
    }
  }

  /**
   * Complete a prompt using Amazon Nova Pro with streaming
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
      console.error('Error streaming completion with Amazon Nova Pro:', error);
      throw this.formatError(error, 'NOVA_PRO_STREAMING_ERROR');
    }
  }

  /**
   * Parse a response from Amazon Nova Pro
   * Specialized for financial analysis and quantitative results
   * @param response The response to parse
   * @param options Parsing options
   * @returns The parsed response
   */
  public parseResponse(response: BedrockResponse, options?: NovaProResponseParserOptions): any {
    const { completion } = response;
    
    try {
      let parsedResult: any = completion;
      
      // Extract JSON if requested
      if (options?.extractJson) {
        const jsonMatch = completion.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            parsedResult = JSON.parse(jsonMatch[1].trim());
          } catch (e) {
            // If parsing fails, try to find JSON without code blocks
            try {
              parsedResult = JSON.parse(completion);
            } catch (e2) {
              // Not valid JSON, continue with other parsing options
            }
          }
        }
      }
      
      // Extract financial metrics if requested
      if (options?.extractMetrics) {
        const metrics = this.extractFinancialMetrics(completion);
        if (Object.keys(metrics).length > 0) {
          return {
            originalResponse: parsedResult,
            extractedMetrics: metrics
          };
        }
      }
      
      // Parse numbers if requested
      if (options?.parseNumbers) {
        parsedResult = this.parseNumericalContent(parsedResult);
      }
      
      // Format the response if requested
      if (options?.formatType) {
        switch (options.formatType) {
          case 'structured':
            return this.parseStructuredFinancialResponse(parsedResult);
          case 'markdown':
            // Return as-is, assuming Nova Pro already outputs markdown
            return parsedResult;
          case 'html':
            // Convert markdown to HTML (simplified)
            return this.convertToHtml(parsedResult);
          case 'text':
            // Strip markdown formatting (simplified)
            return this.stripMarkdown(parsedResult);
          default:
            return parsedResult;
        }
      }
      
      // Default: return the processed result
      return parsedResult;
    } catch (error) {
      console.error('Error parsing Amazon Nova Pro response:', error);
      throw this.formatError(error, 'NOVA_PRO_PARSING_ERROR');
    }
  }

  /**
   * Extract financial metrics from the response text
   * @param text The response text
   * @returns Extracted financial metrics
   */
  private extractFinancialMetrics(text: string): FinancialMetrics {
    const metrics: FinancialMetrics = {};
    
    // Extract ratios (e.g., "P/E Ratio: 15.2", "ROE: 12.5%")
    const ratioMatches = text.match(/([A-Z][A-Za-z\s\/]+(?:Ratio|Rate|Margin)):\s*([\d.,]+)%?/g);
    if (ratioMatches) {
      metrics.ratios = {};
      ratioMatches.forEach(match => {
        const [, name, value] = match.match(/([A-Z][A-Za-z\s\/]+(?:Ratio|Rate|Margin)):\s*([\d.,]+)%?/) || [];
        if (name && value) {
          metrics.ratios![name.trim()] = parseFloat(value.replace(/,/g, ''));
        }
      });
    }
    
    // Extract returns (e.g., "Annual Return: 8.5%", "YTD Return: -2.3%")
    const returnMatches = text.match(/([A-Za-z\s]+Return):\s*([-]?[\d.,]+)%/g);
    if (returnMatches) {
      metrics.returns = {};
      returnMatches.forEach(match => {
        const [, name, value] = match.match(/([A-Za-z\s]+Return):\s*([-]?[\d.,]+)%/) || [];
        if (name && value) {
          metrics.returns![name.trim()] = parseFloat(value.replace(/,/g, ''));
        }
      });
    }
    
    // Extract risk metrics (e.g., "VaR (95%): $1.2M", "Beta: 1.15")
    const riskMatches = text.match(/(VaR|Beta|Volatility|Sharpe Ratio|Standard Deviation)[^:]*:\s*([-]?[\d.,]+)/g);
    if (riskMatches) {
      metrics.risks = {};
      riskMatches.forEach(match => {
        const [, name, value] = match.match(/(VaR|Beta|Volatility|Sharpe Ratio|Standard Deviation)[^:]*:\s*([-]?[\d.,]+)/) || [];
        if (name && value) {
          metrics.risks![name.trim()] = parseFloat(value.replace(/,/g, ''));
        }
      });
    }
    
    // Extract correlations (e.g., "Correlation with S&P 500: 0.85")
    const correlationMatches = text.match(/Correlation[^:]*:\s*([-]?[\d.]+)/g);
    if (correlationMatches) {
      metrics.correlations = {};
      correlationMatches.forEach((match, index) => {
        const [, value] = match.match(/Correlation[^:]*:\s*([-]?[\d.]+)/) || [];
        if (value) {
          metrics.correlations![`Correlation_${index + 1}`] = parseFloat(value);
        }
      });
    }
    
    return metrics;
  }

  /**
   * Parse numerical content from text
   * @param content The content to parse
   * @returns Content with parsed numbers
   */
  private parseNumericalContent(content: any): any {
    if (typeof content !== 'string') {
      return content;
    }
    
    // Replace percentage strings with numbers
    content = content.replace(/(\d+(?:\.\d+)?)%/g, (match: string, num: string) => {
      return (parseFloat(num) / 100).toString();
    });
    
    // Replace currency amounts with numbers (simplified)
    content = content.replace(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g, (match: string, num: string) => {
      return parseFloat(num.replace(/,/g, '')).toString();
    });
    
    return content;
  }

  /**
   * Parse structured financial response
   * @param content The content to structure
   * @returns Structured response
   */
  private parseStructuredFinancialResponse(content: any): any {
    if (typeof content !== 'string') {
      return content;
    }
    
    const structured: any = {
      summary: '',
      sections: [],
      metrics: {},
      recommendations: []
    };
    
    // Split content into sections
    const sections = content.split(/#{1,3}\s+/);
    
    sections.forEach((section, index) => {
      if (index === 0) {
        structured.summary = section.trim();
      } else {
        const lines = section.split('\n');
        const title = lines[0]?.trim();
        const content = lines.slice(1).join('\n').trim();
        
        if (title && content) {
          structured.sections.push({
            title,
            content
          });
          
          // Extract metrics from this section
          const sectionMetrics = this.extractFinancialMetrics(content);
          if (Object.keys(sectionMetrics).length > 0) {
            structured.metrics[title] = sectionMetrics;
          }
        }
      }
    });
    
    // Extract recommendations
    const recommendationMatches = content.match(/(?:recommend|suggest|advise)[^.]*\./gi);
    if (recommendationMatches) {
      structured.recommendations = recommendationMatches.map(rec => rec.trim());
    }
    
    return structured;
  }

  /**
   * Convert markdown to HTML (simplified)
   * @param content The markdown content
   * @returns HTML content
   */
  private convertToHtml(content: string): string {
    return content
      .replace(/#{1,6} (.+)/g, (match, p1, offset, string) => {
        const level = match.trim().indexOf(' ');
        return `<h${level}>${p1}</h${level}>`;
      })
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }

  /**
   * Strip markdown formatting
   * @param content The markdown content
   * @returns Plain text content
   */
  private stripMarkdown(content: string): string {
    return content
      .replace(/#{1,6} /g, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
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