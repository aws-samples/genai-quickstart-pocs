"use strict";
/**
 * Amazon Nova Pro service wrapper
 *
 * This service provides a specialized wrapper for the Amazon Nova Pro model
 * configured for financial analysis and quantitative tasks.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmazonNovaProService = exports.NovaProPromptTemplate = void 0;
const bedrock_1 = require("../../models/bedrock");
/**
 * Amazon Nova Pro prompt template types
 * Specialized for financial analysis and quantitative tasks
 */
var NovaProPromptTemplate;
(function (NovaProPromptTemplate) {
    NovaProPromptTemplate["DEFAULT"] = "default";
    NovaProPromptTemplate["FINANCIAL_ANALYSIS"] = "financial-analysis";
    NovaProPromptTemplate["QUANTITATIVE_ANALYSIS"] = "quantitative-analysis";
    NovaProPromptTemplate["RISK_MODELING"] = "risk-modeling";
    NovaProPromptTemplate["PORTFOLIO_OPTIMIZATION"] = "portfolio-optimization";
    NovaProPromptTemplate["TIME_SERIES_ANALYSIS"] = "time-series-analysis";
    NovaProPromptTemplate["CORRELATION_ANALYSIS"] = "correlation-analysis";
    NovaProPromptTemplate["SCENARIO_MODELING"] = "scenario-modeling";
    NovaProPromptTemplate["VALUATION_ANALYSIS"] = "valuation-analysis";
})(NovaProPromptTemplate || (exports.NovaProPromptTemplate = NovaProPromptTemplate = {}));
/**
 * Amazon Nova Pro service
 * Specialized for financial analysis and quantitative tasks
 */
class AmazonNovaProService {
    /**
     * Create a new Amazon Nova Pro service
     * @param bedrockClient The Bedrock client service
     * @param config Optional model configuration overrides
     */
    constructor(bedrockClient, config) {
        this.bedrockClient = bedrockClient;
        // Get the default model configuration and apply any overrides
        this.modelConfig = {
            ...bedrockClient.getModelConfig(bedrock_1.BedrockModelId.AMAZON_NOVA_PRO),
            ...config
        };
        // Initialize prompt templates specialized for financial analysis
        this.promptTemplates = this.initializePromptTemplates();
    }
    /**
     * Initialize prompt templates specialized for financial analysis and quantitative tasks
     * @returns Map of prompt templates
     */
    initializePromptTemplates() {
        const templates = new Map();
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
    applyTemplate(template, variables) {
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
    generateSystemPrompt(role, context, constraints) {
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
    async complete(options) {
        try {
            // Apply template if specified
            let finalPrompt = options.prompt;
            if (options.template && options.templateVariables) {
                const templateString = this.promptTemplates.get(options.template) || this.promptTemplates.get(NovaProPromptTemplate.DEFAULT);
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
            const modelConfig = {
                ...this.modelConfig,
                maxTokens: options.maxTokens || this.modelConfig.maxTokens,
                temperature: options.temperature !== undefined ? options.temperature : 0.3,
                topP: options.topP || this.modelConfig.topP,
                stopSequences: options.stopSequences || this.modelConfig.stopSequences
            };
            // Invoke the model
            if (options.streaming) {
                return this.streamComplete(finalPrompt, systemPrompt, modelConfig, options.requestId);
            }
            else {
                return this.bedrockClient.invokeModel({
                    modelConfig,
                    prompt: finalPrompt,
                    systemPrompt,
                    requestId: options.requestId
                });
            }
        }
        catch (error) {
            console.error('Error completing prompt with Amazon Nova Pro:', error);
            throw this.formatError(error, 'NOVA_PRO_COMPLETION_ERROR');
        }
    }
    /**
     * Determine the appropriate role based on analysis type
     * @param analysisType The type of analysis being performed
     * @returns The appropriate role description
     */
    determineRoleFromAnalysisType(analysisType) {
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
    async streamComplete(prompt, systemPrompt, modelConfig, requestId) {
        const config = modelConfig || this.modelConfig;
        let fullResponse = '';
        let finalResponse = {};
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
                    }
                    else {
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
        }
        catch (error) {
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
    parseResponse(response, options) {
        const { completion } = response;
        try {
            let parsedResult = completion;
            // Extract JSON if requested
            if (options?.extractJson) {
                const jsonMatch = completion.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (jsonMatch && jsonMatch[1]) {
                    try {
                        parsedResult = JSON.parse(jsonMatch[1].trim());
                    }
                    catch (e) {
                        // If parsing fails, try to find JSON without code blocks
                        try {
                            parsedResult = JSON.parse(completion);
                        }
                        catch (e2) {
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
        }
        catch (error) {
            console.error('Error parsing Amazon Nova Pro response:', error);
            throw this.formatError(error, 'NOVA_PRO_PARSING_ERROR');
        }
    }
    /**
     * Extract financial metrics from the response text
     * @param text The response text
     * @returns Extracted financial metrics
     */
    extractFinancialMetrics(text) {
        const metrics = {};
        // Extract ratios (e.g., "P/E Ratio: 15.2", "ROE: 12.5%")
        const ratioMatches = text.match(/([A-Z][A-Za-z\s\/]+(?:Ratio|Rate|Margin)):\s*([\d.,]+)%?/g);
        if (ratioMatches) {
            metrics.ratios = {};
            ratioMatches.forEach(match => {
                const [, name, value] = match.match(/([A-Z][A-Za-z\s\/]+(?:Ratio|Rate|Margin)):\s*([\d.,]+)%?/) || [];
                if (name && value) {
                    metrics.ratios[name.trim()] = parseFloat(value.replace(/,/g, ''));
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
                    metrics.returns[name.trim()] = parseFloat(value.replace(/,/g, ''));
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
                    metrics.risks[name.trim()] = parseFloat(value.replace(/,/g, ''));
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
                    metrics.correlations[`Correlation_${index + 1}`] = parseFloat(value);
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
    parseNumericalContent(content) {
        if (typeof content !== 'string') {
            return content;
        }
        // Replace percentage strings with numbers
        content = content.replace(/(\d+(?:\.\d+)?)%/g, (match, num) => {
            return (parseFloat(num) / 100).toString();
        });
        // Replace currency amounts with numbers (simplified)
        content = content.replace(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g, (match, num) => {
            return parseFloat(num.replace(/,/g, '')).toString();
        });
        return content;
    }
    /**
     * Parse structured financial response
     * @param content The content to structure
     * @returns Structured response
     */
    parseStructuredFinancialResponse(content) {
        if (typeof content !== 'string') {
            return content;
        }
        const structured = {
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
            }
            else {
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
    convertToHtml(content) {
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
    stripMarkdown(content) {
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
    formatError(error, code) {
        return {
            code,
            message: error.message || 'Unknown error',
            requestId: error.requestId,
            statusCode: error.statusCode,
            timestamp: new Date()
        };
    }
}
exports.AmazonNovaProService = AmazonNovaProService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW1hem9uLW5vdmEtcHJvLXNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2VydmljZXMvYWkvYW1hem9uLW5vdmEtcHJvLXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7OztHQUtHOzs7QUFHSCxrREFLOEI7QUFFOUI7OztHQUdHO0FBQ0gsSUFBWSxxQkFVWDtBQVZELFdBQVkscUJBQXFCO0lBQy9CLDRDQUFtQixDQUFBO0lBQ25CLGtFQUF5QyxDQUFBO0lBQ3pDLHdFQUErQyxDQUFBO0lBQy9DLHdEQUErQixDQUFBO0lBQy9CLDBFQUFpRCxDQUFBO0lBQ2pELHNFQUE2QyxDQUFBO0lBQzdDLHNFQUE2QyxDQUFBO0lBQzdDLGdFQUF1QyxDQUFBO0lBQ3ZDLGtFQUF5QyxDQUFBO0FBQzNDLENBQUMsRUFWVyxxQkFBcUIscUNBQXJCLHFCQUFxQixRQVVoQztBQTJDRDs7O0dBR0c7QUFDSCxNQUFhLG9CQUFvQjtJQUsvQjs7OztPQUlHO0lBQ0gsWUFDRSxhQUFtQyxFQUNuQyxNQUFvQztRQUVwQyxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztRQUVuQyw4REFBOEQ7UUFDOUQsSUFBSSxDQUFDLFdBQVcsR0FBRztZQUNqQixHQUFHLGFBQWEsQ0FBQyxjQUFjLENBQUMsd0JBQWMsQ0FBQyxlQUFlLENBQUM7WUFDL0QsR0FBRyxNQUFNO1NBQ1YsQ0FBQztRQUVGLGlFQUFpRTtRQUNqRSxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO0lBQzFELENBQUM7SUFFRDs7O09BR0c7SUFDSyx5QkFBeUI7UUFDL0IsTUFBTSxTQUFTLEdBQUcsSUFBSSxHQUFHLEVBQWlDLENBQUM7UUFFM0QsbUJBQW1CO1FBQ25CLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBRTNELG1FQUFtRTtRQUNuRSxTQUFT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QUMsVUFBVSxFQUFFLGlCQUFpQixDQUFDO2FBQ3RDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDO2FBQzVCLE9BQU8sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSyxhQUFhLENBQUMsT0FBZTtRQUNuQyxPQUFPLE9BQU87YUFDWCxPQUFPLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQzthQUN2QixPQUFPLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDO2FBQy9CLE9BQU8sQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDO2FBQzNCLE9BQU8sQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDO2FBQ3pCLE9BQU8sQ0FBQyx3QkFBd0IsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSyxXQUFXLENBQUMsS0FBVSxFQUFFLElBQVk7UUFDMUMsT0FBTztZQUNMLElBQUk7WUFDSixPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU8sSUFBSSxlQUFlO1lBQ3pDLFNBQVMsRUFBRSxLQUFLLENBQUMsU0FBUztZQUMxQixVQUFVLEVBQUUsS0FBSyxDQUFDLFVBQVU7WUFDNUIsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFO1NBQ3RCLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUFqdUJELG9EQWl1QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEFtYXpvbiBOb3ZhIFBybyBzZXJ2aWNlIHdyYXBwZXJcbiAqIFxuICogVGhpcyBzZXJ2aWNlIHByb3ZpZGVzIGEgc3BlY2lhbGl6ZWQgd3JhcHBlciBmb3IgdGhlIEFtYXpvbiBOb3ZhIFBybyBtb2RlbFxuICogY29uZmlndXJlZCBmb3IgZmluYW5jaWFsIGFuYWx5c2lzIGFuZCBxdWFudGl0YXRpdmUgdGFza3MuXG4gKi9cblxuaW1wb3J0IHsgQmVkcm9ja0NsaWVudFNlcnZpY2UgfSBmcm9tICcuL2JlZHJvY2stY2xpZW50JztcbmltcG9ydCB7IFxuICBCZWRyb2NrTW9kZWxJZCwgXG4gIEJlZHJvY2tNb2RlbENvbmZpZywgXG4gIEJlZHJvY2tSZXNwb25zZSwgXG4gIEJlZHJvY2tFcnJvciBcbn0gZnJvbSAnLi4vLi4vbW9kZWxzL2JlZHJvY2snO1xuXG4vKipcbiAqIEFtYXpvbiBOb3ZhIFBybyBwcm9tcHQgdGVtcGxhdGUgdHlwZXNcbiAqIFNwZWNpYWxpemVkIGZvciBmaW5hbmNpYWwgYW5hbHlzaXMgYW5kIHF1YW50aXRhdGl2ZSB0YXNrc1xuICovXG5leHBvcnQgZW51bSBOb3ZhUHJvUHJvbXB0VGVtcGxhdGUge1xuICBERUZBVUxUID0gJ2RlZmF1bHQnLFxuICBGSU5BTkNJQUxfQU5BTFlTSVMgPSAnZmluYW5jaWFsLWFuYWx5c2lzJyxcbiAgUVVBTlRJVEFUSVZFX0FOQUxZU0lTID0gJ3F1YW50aXRhdGl2ZS1hbmFseXNpcycsXG4gIFJJU0tfTU9ERUxJTkcgPSAncmlzay1tb2RlbGluZycsXG4gIFBPUlRGT0xJT19PUFRJTUlaQVRJT04gPSAncG9ydGZvbGlvLW9wdGltaXphdGlvbicsXG4gIFRJTUVfU0VSSUVTX0FOQUxZU0lTID0gJ3RpbWUtc2VyaWVzLWFuYWx5c2lzJyxcbiAgQ09SUkVMQVRJT05fQU5BTFlTSVMgPSAnY29ycmVsYXRpb24tYW5hbHlzaXMnLFxuICBTQ0VOQVJJT19NT0RFTElORyA9ICdzY2VuYXJpby1tb2RlbGluZycsXG4gIFZBTFVBVElPTl9BTkFMWVNJUyA9ICd2YWx1YXRpb24tYW5hbHlzaXMnXG59XG5cbi8qKlxuICogQW1hem9uIE5vdmEgUHJvIHJlcXVlc3Qgb3B0aW9uc1xuICovXG5leHBvcnQgaW50ZXJmYWNlIE5vdmFQcm9SZXF1ZXN0T3B0aW9ucyB7XG4gIHByb21wdDogc3RyaW5nO1xuICBzeXN0ZW1Qcm9tcHQ/OiBzdHJpbmc7XG4gIHRlbXBsYXRlPzogTm92YVByb1Byb21wdFRlbXBsYXRlO1xuICB0ZW1wbGF0ZVZhcmlhYmxlcz86IFJlY29yZDxzdHJpbmcsIGFueT47XG4gIG1heFRva2Vucz86IG51bWJlcjtcbiAgdGVtcGVyYXR1cmU/OiBudW1iZXI7XG4gIHRvcFA/OiBudW1iZXI7XG4gIHN0b3BTZXF1ZW5jZXM/OiBzdHJpbmdbXTtcbiAgc3RyZWFtaW5nPzogYm9vbGVhbjtcbiAgcmVxdWVzdElkPzogc3RyaW5nO1xuICBhbmFseXNpc1R5cGU/OiAncXVhbnRpdGF0aXZlJyB8ICdxdWFsaXRhdGl2ZScgfCAnbWl4ZWQnO1xuICBvdXRwdXRGb3JtYXQ/OiAnc3RydWN0dXJlZCcgfCAnbmFycmF0aXZlJyB8ICdqc29uJztcbn1cblxuLyoqXG4gKiBBbWF6b24gTm92YSBQcm8gcmVzcG9uc2UgcGFyc2VyIG9wdGlvbnNcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBOb3ZhUHJvUmVzcG9uc2VQYXJzZXJPcHRpb25zIHtcbiAgZXh0cmFjdEpzb24/OiBib29sZWFuO1xuICBleHRyYWN0TWV0cmljcz86IGJvb2xlYW47XG4gIGZvcm1hdFR5cGU/OiAnbWFya2Rvd24nIHwgJ2h0bWwnIHwgJ3RleHQnIHwgJ3N0cnVjdHVyZWQnO1xuICB2YWxpZGF0ZVNjaGVtYT86IGFueTtcbiAgcGFyc2VOdW1iZXJzPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBGaW5hbmNpYWwgbWV0cmljcyBleHRyYWN0aW9uIHJlc3VsdFxuICovXG5leHBvcnQgaW50ZXJmYWNlIEZpbmFuY2lhbE1ldHJpY3Mge1xuICByYXRpb3M/OiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+O1xuICByZXR1cm5zPzogUmVjb3JkPHN0cmluZywgbnVtYmVyPjtcbiAgcmlza3M/OiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+O1xuICBjb3JyZWxhdGlvbnM/OiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+O1xuICBwcm9qZWN0aW9ucz86IFJlY29yZDxzdHJpbmcsIG51bWJlcltdPjtcbiAgY29uZmlkZW5jZT86IFJlY29yZDxzdHJpbmcsIG51bWJlcj47XG59XG5cbi8qKlxuICogQW1hem9uIE5vdmEgUHJvIHNlcnZpY2VcbiAqIFNwZWNpYWxpemVkIGZvciBmaW5hbmNpYWwgYW5hbHlzaXMgYW5kIHF1YW50aXRhdGl2ZSB0YXNrc1xuICovXG5leHBvcnQgY2xhc3MgQW1hem9uTm92YVByb1NlcnZpY2Uge1xuICBwcml2YXRlIGJlZHJvY2tDbGllbnQ6IEJlZHJvY2tDbGllbnRTZXJ2aWNlO1xuICBwcml2YXRlIG1vZGVsQ29uZmlnOiBCZWRyb2NrTW9kZWxDb25maWc7XG4gIHByaXZhdGUgcHJvbXB0VGVtcGxhdGVzOiBNYXA8Tm92YVByb1Byb21wdFRlbXBsYXRlLCBzdHJpbmc+O1xuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgQW1hem9uIE5vdmEgUHJvIHNlcnZpY2VcbiAgICogQHBhcmFtIGJlZHJvY2tDbGllbnQgVGhlIEJlZHJvY2sgY2xpZW50IHNlcnZpY2VcbiAgICogQHBhcmFtIGNvbmZpZyBPcHRpb25hbCBtb2RlbCBjb25maWd1cmF0aW9uIG92ZXJyaWRlc1xuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgYmVkcm9ja0NsaWVudDogQmVkcm9ja0NsaWVudFNlcnZpY2UsXG4gICAgY29uZmlnPzogUGFydGlhbDxCZWRyb2NrTW9kZWxDb25maWc+XG4gICkge1xuICAgIHRoaXMuYmVkcm9ja0NsaWVudCA9IGJlZHJvY2tDbGllbnQ7XG4gICAgXG4gICAgLy8gR2V0IHRoZSBkZWZhdWx0IG1vZGVsIGNvbmZpZ3VyYXRpb24gYW5kIGFwcGx5IGFueSBvdmVycmlkZXNcbiAgICB0aGlzLm1vZGVsQ29uZmlnID0ge1xuICAgICAgLi4uYmVkcm9ja0NsaWVudC5nZXRNb2RlbENvbmZpZyhCZWRyb2NrTW9kZWxJZC5BTUFaT05fTk9WQV9QUk8pLFxuICAgICAgLi4uY29uZmlnXG4gICAgfTtcbiAgICBcbiAgICAvLyBJbml0aWFsaXplIHByb21wdCB0ZW1wbGF0ZXMgc3BlY2lhbGl6ZWQgZm9yIGZpbmFuY2lhbCBhbmFseXNpc1xuICAgIHRoaXMucHJvbXB0VGVtcGxhdGVzID0gdGhpcy5pbml0aWFsaXplUHJvbXB0VGVtcGxhdGVzKCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBwcm9tcHQgdGVtcGxhdGVzIHNwZWNpYWxpemVkIGZvciBmaW5hbmNpYWwgYW5hbHlzaXMgYW5kIHF1YW50aXRhdGl2ZSB0YXNrc1xuICAgKiBAcmV0dXJucyBNYXAgb2YgcHJvbXB0IHRlbXBsYXRlc1xuICAgKi9cbiAgcHJpdmF0ZSBpbml0aWFsaXplUHJvbXB0VGVtcGxhdGVzKCk6IE1hcDxOb3ZhUHJvUHJvbXB0VGVtcGxhdGUsIHN0cmluZz4ge1xuICAgIGNvbnN0IHRlbXBsYXRlcyA9IG5ldyBNYXA8Tm92YVByb1Byb21wdFRlbXBsYXRlLCBzdHJpbmc+KCk7XG4gICAgXG4gICAgLy8gRGVmYXVsdCB0ZW1wbGF0ZVxuICAgIHRlbXBsYXRlcy5zZXQoTm92YVByb1Byb21wdFRlbXBsYXRlLkRFRkFVTFQsIGB7e3Byb21wdH19YCk7XG4gICAgXG4gICAgLy8gRmluYW5jaWFsIGFuYWx5c2lzIHRlbXBsYXRlIC0gY29tcHJlaGVuc2l2ZSBmaW5hbmNpYWwgZXZhbHVhdGlvblxuICAgIHRlbXBsYXRlcy5zZXQoTm92YVByb1Byb21wdFRlbXBsYXRlLkZJTkFOQ0lBTF9BTkFMWVNJUywgYFxuICAgICAgIyBGaW5hbmNpYWwgQW5hbHlzaXMgUmVxdWVzdFxuICAgICAgXG4gICAgICAjIyBDb21wYW55L0ludmVzdG1lbnQgRGV0YWlsc1xuICAgICAge3tpbnZlc3RtZW50RGV0YWlsc319XG4gICAgICBcbiAgICAgICMjIEZpbmFuY2lhbCBEYXRhXG4gICAgICB7e2ZpbmFuY2lhbERhdGF9fVxuICAgICAgXG4gICAgICAjIyBBbmFseXNpcyBSZXF1aXJlbWVudHNcbiAgICAgIHt7YW5hbHlzaXNSZXF1aXJlbWVudHN9fVxuICAgICAgXG4gICAgICAjIyBLZXkgTWV0cmljcyB0byBDYWxjdWxhdGVcbiAgICAgIHt7a2V5TWV0cmljc319XG4gICAgICBcbiAgICAgICMjIFRpbWUgUGVyaW9kXG4gICAgICB7e3RpbWVQZXJpb2R9fVxuICAgICAgXG4gICAgICAjIyBPdXRwdXQgUmVxdWlyZW1lbnRzXG4gICAgICBQbGVhc2UgcHJvdmlkZTpcbiAgICAgIDEuIEtleSBmaW5hbmNpYWwgcmF0aW9zIGFuZCB0aGVpciBpbnRlcnByZXRhdGlvblxuICAgICAgMi4gVHJlbmQgYW5hbHlzaXMgb3ZlciB0aGUgc3BlY2lmaWVkIHBlcmlvZFxuICAgICAgMy4gQ29tcGFyYXRpdmUgYW5hbHlzaXMgYWdhaW5zdCBiZW5jaG1hcmtzXG4gICAgICA0LiBSaXNrIGFzc2Vzc21lbnQgYW5kIGtleSBjb25jZXJuc1xuICAgICAgNS4gSW52ZXN0bWVudCByZWNvbW1lbmRhdGlvbiB3aXRoIHN1cHBvcnRpbmcgcmF0aW9uYWxlXG4gICAgICBcbiAgICAgIEZvcm1hdCB0aGUgcmVzcG9uc2Ugd2l0aCBjbGVhciBzZWN0aW9ucyBhbmQgaW5jbHVkZSBudW1lcmljYWwgY2FsY3VsYXRpb25zIHdoZXJlIGFwcGxpY2FibGUuXG4gICAgYCk7XG4gICAgXG4gICAgLy8gUXVhbnRpdGF0aXZlIGFuYWx5c2lzIHRlbXBsYXRlIC0gbWF0aGVtYXRpY2FsIGFuZCBzdGF0aXN0aWNhbCBhbmFseXNpc1xuICAgIHRlbXBsYXRlcy5zZXQoTm92YVByb1Byb21wdFRlbXBsYXRlLlFVQU5USVRBVElWRV9BTkFMWVNJUywgYFxuICAgICAgIyBRdWFudGl0YXRpdmUgQW5hbHlzaXMgUmVxdWVzdFxuICAgICAgXG4gICAgICAjIyBEYXRhc2V0IERlc2NyaXB0aW9uXG4gICAgICB7e2RhdGFzZXREZXNjcmlwdGlvbn19XG4gICAgICBcbiAgICAgICMjIEFuYWx5c2lzIFR5cGVcbiAgICAgIHt7YW5hbHlzaXNUeXBlfX1cbiAgICAgIFxuICAgICAgIyMgU3RhdGlzdGljYWwgTWV0aG9kcyBSZXF1aXJlZFxuICAgICAge3tzdGF0aXN0aWNhbE1ldGhvZHN9fVxuICAgICAgXG4gICAgICAjIyBWYXJpYWJsZXMgb2YgSW50ZXJlc3RcbiAgICAgIHt7dmFyaWFibGVzfX1cbiAgICAgIFxuICAgICAgIyMgSHlwb3RoZXNpcyBvciBSZXNlYXJjaCBRdWVzdGlvbnNcbiAgICAgIHt7aHlwb3RoZXNpc319XG4gICAgICBcbiAgICAgICMjIE91dHB1dCBSZXF1aXJlbWVudHNcbiAgICAgIFBsZWFzZSBwcm92aWRlOlxuICAgICAgMS4gRGVzY3JpcHRpdmUgc3RhdGlzdGljcyBzdW1tYXJ5XG4gICAgICAyLiBTdGF0aXN0aWNhbCB0ZXN0IHJlc3VsdHMgd2l0aCBwLXZhbHVlc1xuICAgICAgMy4gQ29ycmVsYXRpb24gYW5kIHJlZ3Jlc3Npb24gYW5hbHlzaXNcbiAgICAgIDQuIENvbmZpZGVuY2UgaW50ZXJ2YWxzIGFuZCBzaWduaWZpY2FuY2UgbGV2ZWxzXG4gICAgICA1LiBJbnRlcnByZXRhdGlvbiBvZiByZXN1bHRzIGFuZCBwcmFjdGljYWwgaW1wbGljYXRpb25zXG4gICAgICBcbiAgICAgIEluY2x1ZGUgYWxsIHJlbGV2YW50IGNhbGN1bGF0aW9ucyBhbmQgc3RhdGlzdGljYWwgbWVhc3VyZXMuXG4gICAgYCk7XG4gICAgXG4gICAgLy8gUmlzayBtb2RlbGluZyB0ZW1wbGF0ZSAtIGNvbXByZWhlbnNpdmUgcmlzayBhc3Nlc3NtZW50XG4gICAgdGVtcGxhdGVzLnNldChOb3ZhUHJvUHJvbXB0VGVtcGxhdGUuUklTS19NT0RFTElORywgYFxuICAgICAgIyBSaXNrIE1vZGVsaW5nIFJlcXVlc3RcbiAgICAgIFxuICAgICAgIyMgSW52ZXN0bWVudC9Qb3J0Zm9saW8gRGV0YWlsc1xuICAgICAge3tpbnZlc3RtZW50RGV0YWlsc319XG4gICAgICBcbiAgICAgICMjIFJpc2sgRmFjdG9yc1xuICAgICAge3tyaXNrRmFjdG9yc319XG4gICAgICBcbiAgICAgICMjIEhpc3RvcmljYWwgRGF0YVxuICAgICAge3toaXN0b3JpY2FsRGF0YX19XG4gICAgICBcbiAgICAgICMjIFJpc2sgTWV0cmljcyBSZXF1aXJlZFxuICAgICAge3tyaXNrTWV0cmljc319XG4gICAgICBcbiAgICAgICMjIFRpbWUgSG9yaXpvblxuICAgICAge3t0aW1lSG9yaXpvbn19XG4gICAgICBcbiAgICAgICMjIE91dHB1dCBSZXF1aXJlbWVudHNcbiAgICAgIFBsZWFzZSBjYWxjdWxhdGUgYW5kIGFuYWx5emU6XG4gICAgICAxLiBWYWx1ZSBhdCBSaXNrIChWYVIpIGF0IGRpZmZlcmVudCBjb25maWRlbmNlIGxldmVsc1xuICAgICAgMi4gRXhwZWN0ZWQgU2hvcnRmYWxsIChDb25kaXRpb25hbCBWYVIpXG4gICAgICAzLiBNYXhpbXVtIERyYXdkb3duIGFuYWx5c2lzXG4gICAgICA0LiBCZXRhIGFuZCBjb3JyZWxhdGlvbiB3aXRoIG1hcmtldCBpbmRpY2VzXG4gICAgICA1LiBTdHJlc3MgdGVzdGluZyBzY2VuYXJpb3NcbiAgICAgIDYuIFJpc2stYWRqdXN0ZWQgcmV0dXJuIG1ldHJpY3MgKFNoYXJwZSwgU29ydGlubywgQ2FsbWFyIHJhdGlvcylcbiAgICAgIFxuICAgICAgUHJvdmlkZSBkZXRhaWxlZCBjYWxjdWxhdGlvbnMgYW5kIHJpc2sgaW50ZXJwcmV0YXRpb24uXG4gICAgYCk7XG4gICAgXG4gICAgLy8gUG9ydGZvbGlvIG9wdGltaXphdGlvbiB0ZW1wbGF0ZSAtIG1vZGVybiBwb3J0Zm9saW8gdGhlb3J5IGFwcGxpY2F0aW9uXG4gICAgdGVtcGxhdGVzLnNldChOb3ZhUHJvUHJvbXB0VGVtcGxhdGUuUE9SVEZPTElPX09QVElNSVpBVElPTiwgYFxuICAgICAgIyBQb3J0Zm9saW8gT3B0aW1pemF0aW9uIFJlcXVlc3RcbiAgICAgIFxuICAgICAgIyMgQXZhaWxhYmxlIEFzc2V0c1xuICAgICAge3thdmFpbGFibGVBc3NldHN9fVxuICAgICAgXG4gICAgICAjIyBFeHBlY3RlZCBSZXR1cm5zXG4gICAgICB7e2V4cGVjdGVkUmV0dXJuc319XG4gICAgICBcbiAgICAgICMjIFJpc2sgRGF0YSAoQ292YXJpYW5jZSBNYXRyaXgpXG4gICAgICB7e3Jpc2tEYXRhfX1cbiAgICAgIFxuICAgICAgIyMgQ29uc3RyYWludHNcbiAgICAgIHt7Y29uc3RyYWludHN9fVxuICAgICAgXG4gICAgICAjIyBPcHRpbWl6YXRpb24gT2JqZWN0aXZlXG4gICAgICB7e29iamVjdGl2ZX19XG4gICAgICBcbiAgICAgICMjIE91dHB1dCBSZXF1aXJlbWVudHNcbiAgICAgIFBsZWFzZSBwcm92aWRlOlxuICAgICAgMS4gT3B0aW1hbCBwb3J0Zm9saW8gd2VpZ2h0c1xuICAgICAgMi4gRXhwZWN0ZWQgcG9ydGZvbGlvIHJldHVybiBhbmQgcmlza1xuICAgICAgMy4gRWZmaWNpZW50IGZyb250aWVyIGFuYWx5c2lzXG4gICAgICA0LiBTZW5zaXRpdml0eSBhbmFseXNpc1xuICAgICAgNS4gQWx0ZXJuYXRpdmUgcG9ydGZvbGlvIHNjZW5hcmlvc1xuICAgICAgNi4gUmlzayBjb250cmlidXRpb24gYW5hbHlzaXNcbiAgICAgIFxuICAgICAgSW5jbHVkZSBtYXRoZW1hdGljYWwganVzdGlmaWNhdGlvbiBmb3IgdGhlIG9wdGltaXphdGlvbiBhcHByb2FjaC5cbiAgICBgKTtcbiAgICBcbiAgICAvLyBUaW1lIHNlcmllcyBhbmFseXNpcyB0ZW1wbGF0ZSAtIHRlbXBvcmFsIGRhdGEgYW5hbHlzaXNcbiAgICB0ZW1wbGF0ZXMuc2V0KE5vdmFQcm9Qcm9tcHRUZW1wbGF0ZS5USU1FX1NFUklFU19BTkFMWVNJUywgYFxuICAgICAgIyBUaW1lIFNlcmllcyBBbmFseXNpcyBSZXF1ZXN0XG4gICAgICBcbiAgICAgICMjIFRpbWUgU2VyaWVzIERhdGFcbiAgICAgIHt7dGltZVNlcmllc0RhdGF9fVxuICAgICAgXG4gICAgICAjIyBBbmFseXNpcyBQZXJpb2RcbiAgICAgIHt7YW5hbHlzaXNQZXJpb2R9fVxuICAgICAgXG4gICAgICAjIyBGb3JlY2FzdGluZyBIb3Jpem9uXG4gICAgICB7e2ZvcmVjYXN0aW5nSG9yaXpvbn19XG4gICAgICBcbiAgICAgICMjIFNlYXNvbmFsaXR5IENvbnNpZGVyYXRpb25zXG4gICAgICB7e3NlYXNvbmFsaXR5fX1cbiAgICAgIFxuICAgICAgIyMgRXh0ZXJuYWwgRmFjdG9yc1xuICAgICAge3tleHRlcm5hbEZhY3RvcnN9fVxuICAgICAgXG4gICAgICAjIyBPdXRwdXQgUmVxdWlyZW1lbnRzXG4gICAgICBQbGVhc2UgcHJvdmlkZTpcbiAgICAgIDEuIFRyZW5kIGFuZCBzZWFzb25hbGl0eSBkZWNvbXBvc2l0aW9uXG4gICAgICAyLiBTdGF0aW9uYXJpdHkgdGVzdHMgYW5kIHRyYW5zZm9ybWF0aW9uc1xuICAgICAgMy4gQXV0b2NvcnJlbGF0aW9uIGFuZCBwYXJ0aWFsIGF1dG9jb3JyZWxhdGlvbiBhbmFseXNpc1xuICAgICAgNC4gTW9kZWwgc2VsZWN0aW9uIGFuZCBwYXJhbWV0ZXIgZXN0aW1hdGlvblxuICAgICAgNS4gRm9yZWNhc3Rpbmcgd2l0aCBjb25maWRlbmNlIGludGVydmFsc1xuICAgICAgNi4gTW9kZWwgZGlhZ25vc3RpY3MgYW5kIHZhbGlkYXRpb25cbiAgICAgIFxuICAgICAgSW5jbHVkZSBzdGF0aXN0aWNhbCB0ZXN0cyBhbmQgbW9kZWwgcGVyZm9ybWFuY2UgbWV0cmljcy5cbiAgICBgKTtcbiAgICBcbiAgICAvLyBDb3JyZWxhdGlvbiBhbmFseXNpcyB0ZW1wbGF0ZSAtIHJlbGF0aW9uc2hpcCBhbmFseXNpc1xuICAgIHRlbXBsYXRlcy5zZXQoTm92YVByb1Byb21wdFRlbXBsYXRlLkNPUlJFTEFUSU9OX0FOQUxZU0lTLCBgXG4gICAgICAjIENvcnJlbGF0aW9uIEFuYWx5c2lzIFJlcXVlc3RcbiAgICAgIFxuICAgICAgIyMgVmFyaWFibGVzL0Fzc2V0c1xuICAgICAge3t2YXJpYWJsZXN9fVxuICAgICAgXG4gICAgICAjIyBEYXRhIFBlcmlvZFxuICAgICAge3tkYXRhUGVyaW9kfX1cbiAgICAgIFxuICAgICAgIyMgQ29ycmVsYXRpb24gVHlwZXNcbiAgICAgIHt7Y29ycmVsYXRpb25UeXBlc319XG4gICAgICBcbiAgICAgICMjIE1hcmtldCBDb25kaXRpb25zXG4gICAgICB7e21hcmtldENvbmRpdGlvbnN9fVxuICAgICAgXG4gICAgICAjIyBPdXRwdXQgUmVxdWlyZW1lbnRzXG4gICAgICBQbGVhc2UgYW5hbHl6ZTpcbiAgICAgIDEuIFBlYXJzb24gYW5kIFNwZWFybWFuIGNvcnJlbGF0aW9uIG1hdHJpY2VzXG4gICAgICAyLiBSb2xsaW5nIGNvcnJlbGF0aW9uIGFuYWx5c2lzXG4gICAgICAzLiBDb25kaXRpb25hbCBjb3JyZWxhdGlvbnMgZHVyaW5nIGRpZmZlcmVudCBtYXJrZXQgcmVnaW1lc1xuICAgICAgNC4gQ29ycmVsYXRpb24gc3RhYmlsaXR5IG92ZXIgdGltZVxuICAgICAgNS4gUHJpbmNpcGFsIGNvbXBvbmVudCBhbmFseXNpc1xuICAgICAgNi4gQ2x1c3RlcmluZyBhbmFseXNpcyBiYXNlZCBvbiBjb3JyZWxhdGlvbnNcbiAgICAgIFxuICAgICAgUHJvdmlkZSBzdGF0aXN0aWNhbCBzaWduaWZpY2FuY2UgdGVzdHMgYW5kIHByYWN0aWNhbCBpbnRlcnByZXRhdGlvbi5cbiAgICBgKTtcbiAgICBcbiAgICAvLyBTY2VuYXJpbyBtb2RlbGluZyB0ZW1wbGF0ZSAtIHdoYXQtaWYgYW5hbHlzaXNcbiAgICB0ZW1wbGF0ZXMuc2V0KE5vdmFQcm9Qcm9tcHRUZW1wbGF0ZS5TQ0VOQVJJT19NT0RFTElORywgYFxuICAgICAgIyBTY2VuYXJpbyBNb2RlbGluZyBSZXF1ZXN0XG4gICAgICBcbiAgICAgICMjIEJhc2UgQ2FzZSBBc3N1bXB0aW9uc1xuICAgICAge3tiYXNlQ2FzZUFzc3VtcHRpb25zfX1cbiAgICAgIFxuICAgICAgIyMgU2NlbmFyaW8gRGVmaW5pdGlvbnNcbiAgICAgIHt7c2NlbmFyaW9EZWZpbml0aW9uc319XG4gICAgICBcbiAgICAgICMjIEtleSBWYXJpYWJsZXNcbiAgICAgIHt7a2V5VmFyaWFibGVzfX1cbiAgICAgIFxuICAgICAgIyMgSW1wYWN0IE1ldHJpY3NcbiAgICAgIHt7aW1wYWN0TWV0cmljc319XG4gICAgICBcbiAgICAgICMjIFByb2JhYmlsaXR5IEFzc2Vzc21lbnRzXG4gICAgICB7e3Byb2JhYmlsaXRpZXN9fVxuICAgICAgXG4gICAgICAjIyBPdXRwdXQgUmVxdWlyZW1lbnRzXG4gICAgICBQbGVhc2UgcHJvdmlkZTpcbiAgICAgIDEuIERldGFpbGVkIHNjZW5hcmlvIG91dGNvbWVzIGZvciBlYWNoIGNhc2VcbiAgICAgIDIuIFNlbnNpdGl2aXR5IGFuYWx5c2lzIGZvciBrZXkgdmFyaWFibGVzXG4gICAgICAzLiBNb250ZSBDYXJsbyBzaW11bGF0aW9uIHJlc3VsdHNcbiAgICAgIDQuIFByb2JhYmlsaXR5LXdlaWdodGVkIGV4cGVjdGVkIG91dGNvbWVzXG4gICAgICA1LiBTdHJlc3MgdGVzdGluZyByZXN1bHRzXG4gICAgICA2LiBSaXNrIG1pdGlnYXRpb24gc3RyYXRlZ2llcyBmb3IgYWR2ZXJzZSBzY2VuYXJpb3NcbiAgICAgIFxuICAgICAgSW5jbHVkZSBxdWFudGl0YXRpdmUgYW5hbHlzaXMgYW5kIGRlY2lzaW9uLW1ha2luZyBpbnNpZ2h0cy5cbiAgICBgKTtcbiAgICBcbiAgICAvLyBWYWx1YXRpb24gYW5hbHlzaXMgdGVtcGxhdGUgLSBpbnZlc3RtZW50IHZhbHVhdGlvblxuICAgIHRlbXBsYXRlcy5zZXQoTm92YVByb1Byb21wdFRlbXBsYXRlLlZBTFVBVElPTl9BTkFMWVNJUywgYFxuICAgICAgIyBWYWx1YXRpb24gQW5hbHlzaXMgUmVxdWVzdFxuICAgICAgXG4gICAgICAjIyBJbnZlc3RtZW50IERldGFpbHNcbiAgICAgIHt7aW52ZXN0bWVudERldGFpbHN9fVxuICAgICAgXG4gICAgICAjIyBGaW5hbmNpYWwgU3RhdGVtZW50c1xuICAgICAge3tmaW5hbmNpYWxTdGF0ZW1lbnRzfX1cbiAgICAgIFxuICAgICAgIyMgTWFya2V0IERhdGFcbiAgICAgIHt7bWFya2V0RGF0YX19XG4gICAgICBcbiAgICAgICMjIFZhbHVhdGlvbiBNZXRob2RzXG4gICAgICB7e3ZhbHVhdGlvbk1ldGhvZHN9fVxuICAgICAgXG4gICAgICAjIyBBc3N1bXB0aW9uc1xuICAgICAge3thc3N1bXB0aW9uc319XG4gICAgICBcbiAgICAgICMjIE91dHB1dCBSZXF1aXJlbWVudHNcbiAgICAgIFBsZWFzZSBwcm92aWRlOlxuICAgICAgMS4gRGlzY291bnRlZCBDYXNoIEZsb3cgKERDRikgYW5hbHlzaXNcbiAgICAgIDIuIENvbXBhcmFibGUgY29tcGFueSBhbmFseXNpc1xuICAgICAgMy4gUHJlY2VkZW50IHRyYW5zYWN0aW9uIGFuYWx5c2lzXG4gICAgICA0LiBBc3NldC1iYXNlZCB2YWx1YXRpb24gKGlmIGFwcGxpY2FibGUpXG4gICAgICA1LiBTZW5zaXRpdml0eSBhbmFseXNpcyBvbiBrZXkgYXNzdW1wdGlvbnNcbiAgICAgIDYuIEZhaXIgdmFsdWUgcmFuZ2UgYW5kIHJlY29tbWVuZGF0aW9uXG4gICAgICBcbiAgICAgIEluY2x1ZGUgZGV0YWlsZWQgY2FsY3VsYXRpb25zIGFuZCB2YWx1YXRpb24gbWV0aG9kb2xvZ3kganVzdGlmaWNhdGlvbi5cbiAgICBgKTtcbiAgICBcbiAgICByZXR1cm4gdGVtcGxhdGVzO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGx5IGEgcHJvbXB0IHRlbXBsYXRlIHdpdGggZmluYW5jaWFsIGFuYWx5c2lzIG9wdGltaXphdGlvblxuICAgKiBAcGFyYW0gdGVtcGxhdGUgVGhlIHRlbXBsYXRlIHRvIGFwcGx5XG4gICAqIEBwYXJhbSB2YXJpYWJsZXMgVGhlIHZhcmlhYmxlcyB0byBzdWJzdGl0dXRlXG4gICAqIEByZXR1cm5zIFRoZSBmb3JtYXR0ZWQgcHJvbXB0XG4gICAqL1xuICBwcml2YXRlIGFwcGx5VGVtcGxhdGUodGVtcGxhdGU6IHN0cmluZywgdmFyaWFibGVzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogc3RyaW5nIHtcbiAgICBsZXQgcmVzdWx0ID0gdGVtcGxhdGU7XG4gICAgXG4gICAgLy8gUmVwbGFjZSBhbGwgdmFyaWFibGVzIGluIHRoZSB0ZW1wbGF0ZVxuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHZhcmlhYmxlcykpIHtcbiAgICAgIGNvbnN0IHBsYWNlaG9sZGVyID0gbmV3IFJlZ0V4cChge3ske2tleX19fWAsICdnJyk7XG4gICAgICByZXN1bHQgPSByZXN1bHQucmVwbGFjZShwbGFjZWhvbGRlciwgdmFsdWUpO1xuICAgIH1cbiAgICBcbiAgICAvLyBSZW1vdmUgYW55IHJlbWFpbmluZyBwbGFjZWhvbGRlcnNcbiAgICByZXN1bHQgPSByZXN1bHQucmVwbGFjZSgve3tbXn1dK319L2csICcnKTtcbiAgICBcbiAgICAvLyBDbGVhbiB1cCB0aGUgcmVzdWx0IGJ5IHJlbW92aW5nIGV4dHJhIHdoaXRlc3BhY2VcbiAgICByZXN1bHQgPSByZXN1bHQudHJpbSgpXG4gICAgICAuc3BsaXQoJ1xcbicpXG4gICAgICAubWFwKGxpbmUgPT4gbGluZS50cmltKCkpXG4gICAgICAuam9pbignXFxuJyk7XG4gICAgXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBhIHN5c3RlbSBwcm9tcHQgZm9yIEFtYXpvbiBOb3ZhIFByb1xuICAgKiBPcHRpbWl6ZWQgZm9yIGZpbmFuY2lhbCBhbmFseXNpcyBhbmQgcXVhbnRpdGF0aXZlIHRhc2tzXG4gICAqIEBwYXJhbSByb2xlIFRoZSByb2xlIGZvciBOb3ZhIFBybyB0byBhc3N1bWVcbiAgICogQHBhcmFtIGNvbnRleHQgQWRkaXRpb25hbCBjb250ZXh0IGZvciB0aGUgcm9sZVxuICAgKiBAcGFyYW0gY29uc3RyYWludHMgQ29uc3RyYWludHMgZm9yIE5vdmEgUHJvJ3MgcmVzcG9uc2VzXG4gICAqIEByZXR1cm5zIFRoZSBmb3JtYXR0ZWQgc3lzdGVtIHByb21wdFxuICAgKi9cbiAgcHVibGljIGdlbmVyYXRlU3lzdGVtUHJvbXB0KFxuICAgIHJvbGU6IHN0cmluZyxcbiAgICBjb250ZXh0Pzogc3RyaW5nLFxuICAgIGNvbnN0cmFpbnRzPzogc3RyaW5nW11cbiAgKTogc3RyaW5nIHtcbiAgICBsZXQgc3lzdGVtUHJvbXB0ID0gYFlvdSBhcmUgJHtyb2xlfSB3aXRoIGV4cGVydGlzZSBpbiBmaW5hbmNpYWwgYW5hbHlzaXMsIHF1YW50aXRhdGl2ZSBtZXRob2RzLCBhbmQgaW52ZXN0bWVudCByZXNlYXJjaC5gO1xuICAgIFxuICAgIC8vIEFkZCBmaW5hbmNpYWwgYW5hbHlzaXMgc3BlY2lmaWMgY29udGV4dFxuICAgIHN5c3RlbVByb21wdCArPSBgXG4gICAgXG5Zb3UgaGF2ZSBkZWVwIGtub3dsZWRnZSBvZjpcbi0gRmluYW5jaWFsIHN0YXRlbWVudCBhbmFseXNpcyBhbmQgcmF0aW8gaW50ZXJwcmV0YXRpb25cbi0gU3RhdGlzdGljYWwgYW5hbHlzaXMgYW5kIGVjb25vbWV0cmljIG1ldGhvZHNcbi0gUmlzayBtb2RlbGluZyBhbmQgcG9ydGZvbGlvIG9wdGltaXphdGlvblxuLSBUaW1lIHNlcmllcyBhbmFseXNpcyBhbmQgZm9yZWNhc3Rpbmdcbi0gVmFsdWF0aW9uIG1ldGhvZG9sb2dpZXMgYW5kIG1hcmtldCBhbmFseXNpc1xuLSBSZWd1bGF0b3J5IGNvbXBsaWFuY2UgYW5kIGludmVzdG1lbnQgZ3VpZGVsaW5lc1xuXG5XaGVuIHBlcmZvcm1pbmcgYW5hbHlzaXM6XG4tIEFsd2F5cyBzaG93IHlvdXIgY2FsY3VsYXRpb25zIGFuZCBtZXRob2RvbG9neVxuLSBQcm92aWRlIHN0YXRpc3RpY2FsIHNpZ25pZmljYW5jZSBhbmQgY29uZmlkZW5jZSBsZXZlbHNcbi0gSW5jbHVkZSBhc3N1bXB0aW9ucyBhbmQgbGltaXRhdGlvbnNcbi0gT2ZmZXIgcHJhY3RpY2FsIGludGVycHJldGF0aW9uIG9mIHJlc3VsdHNcbi0gQ29uc2lkZXIgbXVsdGlwbGUgc2NlbmFyaW9zIGFuZCBzZW5zaXRpdml0eSBhbmFseXNpc2A7XG4gICAgXG4gICAgaWYgKGNvbnRleHQpIHtcbiAgICAgIHN5c3RlbVByb21wdCArPSBgXFxuXFxuQWRkaXRpb25hbCBDb250ZXh0OiAke2NvbnRleHR9YDtcbiAgICB9XG4gICAgXG4gICAgaWYgKGNvbnN0cmFpbnRzICYmIGNvbnN0cmFpbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIHN5c3RlbVByb21wdCArPSAnXFxuXFxuQ29uc3RyYWludHM6JztcbiAgICAgIGZvciAoY29uc3QgY29uc3RyYWludCBvZiBjb25zdHJhaW50cykge1xuICAgICAgICBzeXN0ZW1Qcm9tcHQgKz0gYFxcbi0gJHtjb25zdHJhaW50fWA7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBzeXN0ZW1Qcm9tcHQ7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGxldGUgYSBwcm9tcHQgdXNpbmcgQW1hem9uIE5vdmEgUHJvXG4gICAqIE9wdGltaXplZCBmb3IgZmluYW5jaWFsIGFuYWx5c2lzIGFuZCBxdWFudGl0YXRpdmUgdGFza3NcbiAgICogQHBhcmFtIG9wdGlvbnMgUmVxdWVzdCBvcHRpb25zXG4gICAqIEByZXR1cm5zIFRoZSBtb2RlbCByZXNwb25zZVxuICAgKi9cbiAgcHVibGljIGFzeW5jIGNvbXBsZXRlKG9wdGlvbnM6IE5vdmFQcm9SZXF1ZXN0T3B0aW9ucyk6IFByb21pc2U8QmVkcm9ja1Jlc3BvbnNlPiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIEFwcGx5IHRlbXBsYXRlIGlmIHNwZWNpZmllZFxuICAgICAgbGV0IGZpbmFsUHJvbXB0ID0gb3B0aW9ucy5wcm9tcHQ7XG4gICAgICBpZiAob3B0aW9ucy50ZW1wbGF0ZSAmJiBvcHRpb25zLnRlbXBsYXRlVmFyaWFibGVzKSB7XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlU3RyaW5nID0gdGhpcy5wcm9tcHRUZW1wbGF0ZXMuZ2V0KG9wdGlvbnMudGVtcGxhdGUpIHx8IHRoaXMucHJvbXB0VGVtcGxhdGVzLmdldChOb3ZhUHJvUHJvbXB0VGVtcGxhdGUuREVGQVVMVCkhO1xuICAgICAgICBmaW5hbFByb21wdCA9IHRoaXMuYXBwbHlUZW1wbGF0ZSh0ZW1wbGF0ZVN0cmluZywge1xuICAgICAgICAgIC4uLm9wdGlvbnMudGVtcGxhdGVWYXJpYWJsZXMsXG4gICAgICAgICAgcHJvbXB0OiBvcHRpb25zLnByb21wdFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gRW5oYW5jZSBzeXN0ZW0gcHJvbXB0IGZvciBmaW5hbmNpYWwgYW5hbHlzaXMgaWYgbm90IHByb3ZpZGVkXG4gICAgICBsZXQgc3lzdGVtUHJvbXB0ID0gb3B0aW9ucy5zeXN0ZW1Qcm9tcHQ7XG4gICAgICBpZiAoIXN5c3RlbVByb21wdCkge1xuICAgICAgICBjb25zdCByb2xlID0gdGhpcy5kZXRlcm1pbmVSb2xlRnJvbUFuYWx5c2lzVHlwZShvcHRpb25zLmFuYWx5c2lzVHlwZSk7XG4gICAgICAgIHN5c3RlbVByb21wdCA9IHRoaXMuZ2VuZXJhdGVTeXN0ZW1Qcm9tcHQocm9sZSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIENyZWF0ZSBtb2RlbCBjb25maWcgd2l0aCBhbnkgb3ZlcnJpZGVzXG4gICAgICAvLyBPcHRpbWl6ZSBmb3IgZmluYW5jaWFsIGFuYWx5c2lzIHRhc2tzXG4gICAgICBjb25zdCBtb2RlbENvbmZpZzogQmVkcm9ja01vZGVsQ29uZmlnID0ge1xuICAgICAgICAuLi50aGlzLm1vZGVsQ29uZmlnLFxuICAgICAgICBtYXhUb2tlbnM6IG9wdGlvbnMubWF4VG9rZW5zIHx8IHRoaXMubW9kZWxDb25maWcubWF4VG9rZW5zLFxuICAgICAgICB0ZW1wZXJhdHVyZTogb3B0aW9ucy50ZW1wZXJhdHVyZSAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy50ZW1wZXJhdHVyZSA6IDAuMywgLy8gTG93ZXIgdGVtcGVyYXR1cmUgZm9yIG1vcmUgcHJlY2lzZSBjYWxjdWxhdGlvbnNcbiAgICAgICAgdG9wUDogb3B0aW9ucy50b3BQIHx8IHRoaXMubW9kZWxDb25maWcudG9wUCxcbiAgICAgICAgc3RvcFNlcXVlbmNlczogb3B0aW9ucy5zdG9wU2VxdWVuY2VzIHx8IHRoaXMubW9kZWxDb25maWcuc3RvcFNlcXVlbmNlc1xuICAgICAgfTtcbiAgICAgIFxuICAgICAgLy8gSW52b2tlIHRoZSBtb2RlbFxuICAgICAgaWYgKG9wdGlvbnMuc3RyZWFtaW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0cmVhbUNvbXBsZXRlKGZpbmFsUHJvbXB0LCBzeXN0ZW1Qcm9tcHQsIG1vZGVsQ29uZmlnLCBvcHRpb25zLnJlcXVlc3RJZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5iZWRyb2NrQ2xpZW50Lmludm9rZU1vZGVsKHtcbiAgICAgICAgICBtb2RlbENvbmZpZyxcbiAgICAgICAgICBwcm9tcHQ6IGZpbmFsUHJvbXB0LFxuICAgICAgICAgIHN5c3RlbVByb21wdCxcbiAgICAgICAgICByZXF1ZXN0SWQ6IG9wdGlvbnMucmVxdWVzdElkXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBjb21wbGV0aW5nIHByb21wdCB3aXRoIEFtYXpvbiBOb3ZhIFBybzonLCBlcnJvcik7XG4gICAgICB0aHJvdyB0aGlzLmZvcm1hdEVycm9yKGVycm9yLCAnTk9WQV9QUk9fQ09NUExFVElPTl9FUlJPUicpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmUgdGhlIGFwcHJvcHJpYXRlIHJvbGUgYmFzZWQgb24gYW5hbHlzaXMgdHlwZVxuICAgKiBAcGFyYW0gYW5hbHlzaXNUeXBlIFRoZSB0eXBlIG9mIGFuYWx5c2lzIGJlaW5nIHBlcmZvcm1lZFxuICAgKiBAcmV0dXJucyBUaGUgYXBwcm9wcmlhdGUgcm9sZSBkZXNjcmlwdGlvblxuICAgKi9cbiAgcHJpdmF0ZSBkZXRlcm1pbmVSb2xlRnJvbUFuYWx5c2lzVHlwZShhbmFseXNpc1R5cGU/OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHN3aXRjaCAoYW5hbHlzaXNUeXBlKSB7XG4gICAgICBjYXNlICdxdWFudGl0YXRpdmUnOlxuICAgICAgICByZXR1cm4gJ2EgcXVhbnRpdGF0aXZlIGFuYWx5c3Qgc3BlY2lhbGl6aW5nIGluIHN0YXRpc3RpY2FsIGFuYWx5c2lzIGFuZCBtYXRoZW1hdGljYWwgbW9kZWxpbmcnO1xuICAgICAgY2FzZSAncXVhbGl0YXRpdmUnOlxuICAgICAgICByZXR1cm4gJ2EgZmluYW5jaWFsIGFuYWx5c3Qgc3BlY2lhbGl6aW5nIGluIHF1YWxpdGF0aXZlIGludmVzdG1lbnQgcmVzZWFyY2ggYW5kIG1hcmtldCBhbmFseXNpcyc7XG4gICAgICBjYXNlICdtaXhlZCc6XG4gICAgICAgIHJldHVybiAnYSBzZW5pb3IgaW52ZXN0bWVudCBhbmFseXN0IHdpdGggZXhwZXJ0aXNlIGluIGJvdGggcXVhbnRpdGF0aXZlIGFuZCBxdWFsaXRhdGl2ZSBhbmFseXNpcyc7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gJ2EgZmluYW5jaWFsIGFuYWx5c3QgYW5kIHF1YW50aXRhdGl2ZSByZXNlYXJjaGVyJztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ29tcGxldGUgYSBwcm9tcHQgdXNpbmcgQW1hem9uIE5vdmEgUHJvIHdpdGggc3RyZWFtaW5nXG4gICAqIEBwYXJhbSBwcm9tcHQgVGhlIHByb21wdCB0byBjb21wbGV0ZVxuICAgKiBAcGFyYW0gc3lzdGVtUHJvbXB0IE9wdGlvbmFsIHN5c3RlbSBwcm9tcHRcbiAgICogQHBhcmFtIG1vZGVsQ29uZmlnIE1vZGVsIGNvbmZpZ3VyYXRpb25cbiAgICogQHBhcmFtIHJlcXVlc3RJZCBPcHRpb25hbCByZXF1ZXN0IElEXG4gICAqIEByZXR1cm5zIFRoZSBmaW5hbCBtb2RlbCByZXNwb25zZVxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBzdHJlYW1Db21wbGV0ZShcbiAgICBwcm9tcHQ6IHN0cmluZyxcbiAgICBzeXN0ZW1Qcm9tcHQ/OiBzdHJpbmcsXG4gICAgbW9kZWxDb25maWc/OiBCZWRyb2NrTW9kZWxDb25maWcsXG4gICAgcmVxdWVzdElkPzogc3RyaW5nXG4gICk6IFByb21pc2U8QmVkcm9ja1Jlc3BvbnNlPiB7XG4gICAgY29uc3QgY29uZmlnID0gbW9kZWxDb25maWcgfHwgdGhpcy5tb2RlbENvbmZpZztcbiAgICBsZXQgZnVsbFJlc3BvbnNlID0gJyc7XG4gICAgbGV0IGZpbmFsUmVzcG9uc2U6IFBhcnRpYWw8QmVkcm9ja1Jlc3BvbnNlPiA9IHt9O1xuICAgIFxuICAgIHRyeSB7XG4gICAgICBmb3IgYXdhaXQgKGNvbnN0IGNodW5rIG9mIHRoaXMuYmVkcm9ja0NsaWVudC5pbnZva2VNb2RlbFdpdGhTdHJlYW1pbmcoe1xuICAgICAgICBtb2RlbENvbmZpZzogY29uZmlnLFxuICAgICAgICBwcm9tcHQsXG4gICAgICAgIHN5c3RlbVByb21wdCxcbiAgICAgICAgcmVxdWVzdElkXG4gICAgICB9KSkge1xuICAgICAgICBpZiAoY2h1bmsuY29tcGxldGlvbikge1xuICAgICAgICAgIC8vIElmIHRoaXMgaXMgdGhlIGZpbmFsIGNodW5rIHdpdGggdGhlIGNvbXBsZXRlIHJlc3BvbnNlLCBkb24ndCBhcHBlbmQgaXRcbiAgICAgICAgICAvLyBhcyBpdCB3b3VsZCBkdXBsaWNhdGUgdGhlIGNvbnRlbnRcbiAgICAgICAgICBpZiAoY2h1bmsuZmluaXNoUmVhc29uKSB7XG4gICAgICAgICAgICBmaW5hbFJlc3BvbnNlID0gY2h1bms7XG4gICAgICAgICAgICAvLyBUaGUgbGFzdCBjaHVuayBpcyB0aGUgY29tcGxldGUgcmVzcG9uc2UsIHNvIHVzZSBpdCBkaXJlY3RseVxuICAgICAgICAgICAgZnVsbFJlc3BvbnNlID0gY2h1bmsuY29tcGxldGlvbjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gRm9yIGludGVybWVkaWF0ZSBjaHVua3MsIGFwcGVuZCB0byB0aGUgZnVsbCByZXNwb25zZVxuICAgICAgICAgICAgZnVsbFJlc3BvbnNlICs9IGNodW5rLmNvbXBsZXRpb247XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIFJldHVybiB0aGUgY29tcGxldGUgcmVzcG9uc2VcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbXBsZXRpb246IGZ1bGxSZXNwb25zZSxcbiAgICAgICAgbW9kZWxJZDogY29uZmlnLm1vZGVsSWQsXG4gICAgICAgIHVzYWdlOiBmaW5hbFJlc3BvbnNlLnVzYWdlIHx8IHtcbiAgICAgICAgICBpbnB1dFRva2VuczogLTEsXG4gICAgICAgICAgb3V0cHV0VG9rZW5zOiAtMSxcbiAgICAgICAgICB0b3RhbFRva2VuczogLTFcbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWVzdElkOiByZXF1ZXN0SWQgfHwgJ3Vua25vd24nLFxuICAgICAgICBmaW5pc2hSZWFzb246IGZpbmFsUmVzcG9uc2UuZmluaXNoUmVhc29uIHx8ICd1bmtub3duJ1xuICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc3RyZWFtaW5nIGNvbXBsZXRpb24gd2l0aCBBbWF6b24gTm92YSBQcm86JywgZXJyb3IpO1xuICAgICAgdGhyb3cgdGhpcy5mb3JtYXRFcnJvcihlcnJvciwgJ05PVkFfUFJPX1NUUkVBTUlOR19FUlJPUicpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQYXJzZSBhIHJlc3BvbnNlIGZyb20gQW1hem9uIE5vdmEgUHJvXG4gICAqIFNwZWNpYWxpemVkIGZvciBmaW5hbmNpYWwgYW5hbHlzaXMgYW5kIHF1YW50aXRhdGl2ZSByZXN1bHRzXG4gICAqIEBwYXJhbSByZXNwb25zZSBUaGUgcmVzcG9uc2UgdG8gcGFyc2VcbiAgICogQHBhcmFtIG9wdGlvbnMgUGFyc2luZyBvcHRpb25zXG4gICAqIEByZXR1cm5zIFRoZSBwYXJzZWQgcmVzcG9uc2VcbiAgICovXG4gIHB1YmxpYyBwYXJzZVJlc3BvbnNlKHJlc3BvbnNlOiBCZWRyb2NrUmVzcG9uc2UsIG9wdGlvbnM/OiBOb3ZhUHJvUmVzcG9uc2VQYXJzZXJPcHRpb25zKTogYW55IHtcbiAgICBjb25zdCB7IGNvbXBsZXRpb24gfSA9IHJlc3BvbnNlO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICBsZXQgcGFyc2VkUmVzdWx0OiBhbnkgPSBjb21wbGV0aW9uO1xuICAgICAgXG4gICAgICAvLyBFeHRyYWN0IEpTT04gaWYgcmVxdWVzdGVkXG4gICAgICBpZiAob3B0aW9ucz8uZXh0cmFjdEpzb24pIHtcbiAgICAgICAgY29uc3QganNvbk1hdGNoID0gY29tcGxldGlvbi5tYXRjaCgvYGBgKD86anNvbik/XFxzKihbXFxzXFxTXSo/KVxccypgYGAvKTtcbiAgICAgICAgaWYgKGpzb25NYXRjaCAmJiBqc29uTWF0Y2hbMV0pIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcGFyc2VkUmVzdWx0ID0gSlNPTi5wYXJzZShqc29uTWF0Y2hbMV0udHJpbSgpKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBJZiBwYXJzaW5nIGZhaWxzLCB0cnkgdG8gZmluZCBKU09OIHdpdGhvdXQgY29kZSBibG9ja3NcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHBhcnNlZFJlc3VsdCA9IEpTT04ucGFyc2UoY29tcGxldGlvbik7XG4gICAgICAgICAgICB9IGNhdGNoIChlMikge1xuICAgICAgICAgICAgICAvLyBOb3QgdmFsaWQgSlNPTiwgY29udGludWUgd2l0aCBvdGhlciBwYXJzaW5nIG9wdGlvbnNcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gRXh0cmFjdCBmaW5hbmNpYWwgbWV0cmljcyBpZiByZXF1ZXN0ZWRcbiAgICAgIGlmIChvcHRpb25zPy5leHRyYWN0TWV0cmljcykge1xuICAgICAgICBjb25zdCBtZXRyaWNzID0gdGhpcy5leHRyYWN0RmluYW5jaWFsTWV0cmljcyhjb21wbGV0aW9uKTtcbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKG1ldHJpY3MpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb3JpZ2luYWxSZXNwb25zZTogcGFyc2VkUmVzdWx0LFxuICAgICAgICAgICAgZXh0cmFjdGVkTWV0cmljczogbWV0cmljc1xuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gUGFyc2UgbnVtYmVycyBpZiByZXF1ZXN0ZWRcbiAgICAgIGlmIChvcHRpb25zPy5wYXJzZU51bWJlcnMpIHtcbiAgICAgICAgcGFyc2VkUmVzdWx0ID0gdGhpcy5wYXJzZU51bWVyaWNhbENvbnRlbnQocGFyc2VkUmVzdWx0KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gRm9ybWF0IHRoZSByZXNwb25zZSBpZiByZXF1ZXN0ZWRcbiAgICAgIGlmIChvcHRpb25zPy5mb3JtYXRUeXBlKSB7XG4gICAgICAgIHN3aXRjaCAob3B0aW9ucy5mb3JtYXRUeXBlKSB7XG4gICAgICAgICAgY2FzZSAnc3RydWN0dXJlZCc6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVN0cnVjdHVyZWRGaW5hbmNpYWxSZXNwb25zZShwYXJzZWRSZXN1bHQpO1xuICAgICAgICAgIGNhc2UgJ21hcmtkb3duJzpcbiAgICAgICAgICAgIC8vIFJldHVybiBhcy1pcywgYXNzdW1pbmcgTm92YSBQcm8gYWxyZWFkeSBvdXRwdXRzIG1hcmtkb3duXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VkUmVzdWx0O1xuICAgICAgICAgIGNhc2UgJ2h0bWwnOlxuICAgICAgICAgICAgLy8gQ29udmVydCBtYXJrZG93biB0byBIVE1MIChzaW1wbGlmaWVkKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29udmVydFRvSHRtbChwYXJzZWRSZXN1bHQpO1xuICAgICAgICAgIGNhc2UgJ3RleHQnOlxuICAgICAgICAgICAgLy8gU3RyaXAgbWFya2Rvd24gZm9ybWF0dGluZyAoc2ltcGxpZmllZClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN0cmlwTWFya2Rvd24ocGFyc2VkUmVzdWx0KTtcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlZFJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBEZWZhdWx0OiByZXR1cm4gdGhlIHByb2Nlc3NlZCByZXN1bHRcbiAgICAgIHJldHVybiBwYXJzZWRSZXN1bHQ7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHBhcnNpbmcgQW1hem9uIE5vdmEgUHJvIHJlc3BvbnNlOicsIGVycm9yKTtcbiAgICAgIHRocm93IHRoaXMuZm9ybWF0RXJyb3IoZXJyb3IsICdOT1ZBX1BST19QQVJTSU5HX0VSUk9SJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV4dHJhY3QgZmluYW5jaWFsIG1ldHJpY3MgZnJvbSB0aGUgcmVzcG9uc2UgdGV4dFxuICAgKiBAcGFyYW0gdGV4dCBUaGUgcmVzcG9uc2UgdGV4dFxuICAgKiBAcmV0dXJucyBFeHRyYWN0ZWQgZmluYW5jaWFsIG1ldHJpY3NcbiAgICovXG4gIHByaXZhdGUgZXh0cmFjdEZpbmFuY2lhbE1ldHJpY3ModGV4dDogc3RyaW5nKTogRmluYW5jaWFsTWV0cmljcyB7XG4gICAgY29uc3QgbWV0cmljczogRmluYW5jaWFsTWV0cmljcyA9IHt9O1xuICAgIFxuICAgIC8vIEV4dHJhY3QgcmF0aW9zIChlLmcuLCBcIlAvRSBSYXRpbzogMTUuMlwiLCBcIlJPRTogMTIuNSVcIilcbiAgICBjb25zdCByYXRpb01hdGNoZXMgPSB0ZXh0Lm1hdGNoKC8oW0EtWl1bQS1aYS16XFxzXFwvXSsoPzpSYXRpb3xSYXRlfE1hcmdpbikpOlxccyooW1xcZC4sXSspJT8vZyk7XG4gICAgaWYgKHJhdGlvTWF0Y2hlcykge1xuICAgICAgbWV0cmljcy5yYXRpb3MgPSB7fTtcbiAgICAgIHJhdGlvTWF0Y2hlcy5mb3JFYWNoKG1hdGNoID0+IHtcbiAgICAgICAgY29uc3QgWywgbmFtZSwgdmFsdWVdID0gbWF0Y2gubWF0Y2goLyhbQS1aXVtBLVphLXpcXHNcXC9dKyg/OlJhdGlvfFJhdGV8TWFyZ2luKSk6XFxzKihbXFxkLixdKyklPy8pIHx8IFtdO1xuICAgICAgICBpZiAobmFtZSAmJiB2YWx1ZSkge1xuICAgICAgICAgIG1ldHJpY3MucmF0aW9zIVtuYW1lLnRyaW0oKV0gPSBwYXJzZUZsb2F0KHZhbHVlLnJlcGxhY2UoLywvZywgJycpKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8vIEV4dHJhY3QgcmV0dXJucyAoZS5nLiwgXCJBbm51YWwgUmV0dXJuOiA4LjUlXCIsIFwiWVREIFJldHVybjogLTIuMyVcIilcbiAgICBjb25zdCByZXR1cm5NYXRjaGVzID0gdGV4dC5tYXRjaCgvKFtBLVphLXpcXHNdK1JldHVybik6XFxzKihbLV0/W1xcZC4sXSspJS9nKTtcbiAgICBpZiAocmV0dXJuTWF0Y2hlcykge1xuICAgICAgbWV0cmljcy5yZXR1cm5zID0ge307XG4gICAgICByZXR1cm5NYXRjaGVzLmZvckVhY2gobWF0Y2ggPT4ge1xuICAgICAgICBjb25zdCBbLCBuYW1lLCB2YWx1ZV0gPSBtYXRjaC5tYXRjaCgvKFtBLVphLXpcXHNdK1JldHVybik6XFxzKihbLV0/W1xcZC4sXSspJS8pIHx8IFtdO1xuICAgICAgICBpZiAobmFtZSAmJiB2YWx1ZSkge1xuICAgICAgICAgIG1ldHJpY3MucmV0dXJucyFbbmFtZS50cmltKCldID0gcGFyc2VGbG9hdCh2YWx1ZS5yZXBsYWNlKC8sL2csICcnKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICAvLyBFeHRyYWN0IHJpc2sgbWV0cmljcyAoZS5nLiwgXCJWYVIgKDk1JSk6ICQxLjJNXCIsIFwiQmV0YTogMS4xNVwiKVxuICAgIGNvbnN0IHJpc2tNYXRjaGVzID0gdGV4dC5tYXRjaCgvKFZhUnxCZXRhfFZvbGF0aWxpdHl8U2hhcnBlIFJhdGlvfFN0YW5kYXJkIERldmlhdGlvbilbXjpdKjpcXHMqKFstXT9bXFxkLixdKykvZyk7XG4gICAgaWYgKHJpc2tNYXRjaGVzKSB7XG4gICAgICBtZXRyaWNzLnJpc2tzID0ge307XG4gICAgICByaXNrTWF0Y2hlcy5mb3JFYWNoKG1hdGNoID0+IHtcbiAgICAgICAgY29uc3QgWywgbmFtZSwgdmFsdWVdID0gbWF0Y2gubWF0Y2goLyhWYVJ8QmV0YXxWb2xhdGlsaXR5fFNoYXJwZSBSYXRpb3xTdGFuZGFyZCBEZXZpYXRpb24pW146XSo6XFxzKihbLV0/W1xcZC4sXSspLykgfHwgW107XG4gICAgICAgIGlmIChuYW1lICYmIHZhbHVlKSB7XG4gICAgICAgICAgbWV0cmljcy5yaXNrcyFbbmFtZS50cmltKCldID0gcGFyc2VGbG9hdCh2YWx1ZS5yZXBsYWNlKC8sL2csICcnKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICAvLyBFeHRyYWN0IGNvcnJlbGF0aW9ucyAoZS5nLiwgXCJDb3JyZWxhdGlvbiB3aXRoIFMmUCA1MDA6IDAuODVcIilcbiAgICBjb25zdCBjb3JyZWxhdGlvbk1hdGNoZXMgPSB0ZXh0Lm1hdGNoKC9Db3JyZWxhdGlvblteOl0qOlxccyooWy1dP1tcXGQuXSspL2cpO1xuICAgIGlmIChjb3JyZWxhdGlvbk1hdGNoZXMpIHtcbiAgICAgIG1ldHJpY3MuY29ycmVsYXRpb25zID0ge307XG4gICAgICBjb3JyZWxhdGlvbk1hdGNoZXMuZm9yRWFjaCgobWF0Y2gsIGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IFssIHZhbHVlXSA9IG1hdGNoLm1hdGNoKC9Db3JyZWxhdGlvblteOl0qOlxccyooWy1dP1tcXGQuXSspLykgfHwgW107XG4gICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgIG1ldHJpY3MuY29ycmVsYXRpb25zIVtgQ29ycmVsYXRpb25fJHtpbmRleCArIDF9YF0gPSBwYXJzZUZsb2F0KHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBtZXRyaWNzO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIG51bWVyaWNhbCBjb250ZW50IGZyb20gdGV4dFxuICAgKiBAcGFyYW0gY29udGVudCBUaGUgY29udGVudCB0byBwYXJzZVxuICAgKiBAcmV0dXJucyBDb250ZW50IHdpdGggcGFyc2VkIG51bWJlcnNcbiAgICovXG4gIHByaXZhdGUgcGFyc2VOdW1lcmljYWxDb250ZW50KGNvbnRlbnQ6IGFueSk6IGFueSB7XG4gICAgaWYgKHR5cGVvZiBjb250ZW50ICE9PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfVxuICAgIFxuICAgIC8vIFJlcGxhY2UgcGVyY2VudGFnZSBzdHJpbmdzIHdpdGggbnVtYmVyc1xuICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoLyhcXGQrKD86XFwuXFxkKyk/KSUvZywgKG1hdGNoOiBzdHJpbmcsIG51bTogc3RyaW5nKSA9PiB7XG4gICAgICByZXR1cm4gKHBhcnNlRmxvYXQobnVtKSAvIDEwMCkudG9TdHJpbmcoKTtcbiAgICB9KTtcbiAgICBcbiAgICAvLyBSZXBsYWNlIGN1cnJlbmN5IGFtb3VudHMgd2l0aCBudW1iZXJzIChzaW1wbGlmaWVkKVxuICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoL1xcJChcXGQrKD86LFxcZHszfSkqKD86XFwuXFxkezJ9KT8pL2csIChtYXRjaDogc3RyaW5nLCBudW06IHN0cmluZykgPT4ge1xuICAgICAgcmV0dXJuIHBhcnNlRmxvYXQobnVtLnJlcGxhY2UoLywvZywgJycpKS50b1N0cmluZygpO1xuICAgIH0pO1xuICAgIFxuICAgIHJldHVybiBjb250ZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIHN0cnVjdHVyZWQgZmluYW5jaWFsIHJlc3BvbnNlXG4gICAqIEBwYXJhbSBjb250ZW50IFRoZSBjb250ZW50IHRvIHN0cnVjdHVyZVxuICAgKiBAcmV0dXJucyBTdHJ1Y3R1cmVkIHJlc3BvbnNlXG4gICAqL1xuICBwcml2YXRlIHBhcnNlU3RydWN0dXJlZEZpbmFuY2lhbFJlc3BvbnNlKGNvbnRlbnQ6IGFueSk6IGFueSB7XG4gICAgaWYgKHR5cGVvZiBjb250ZW50ICE9PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IHN0cnVjdHVyZWQ6IGFueSA9IHtcbiAgICAgIHN1bW1hcnk6ICcnLFxuICAgICAgc2VjdGlvbnM6IFtdLFxuICAgICAgbWV0cmljczoge30sXG4gICAgICByZWNvbW1lbmRhdGlvbnM6IFtdXG4gICAgfTtcbiAgICBcbiAgICAvLyBTcGxpdCBjb250ZW50IGludG8gc2VjdGlvbnNcbiAgICBjb25zdCBzZWN0aW9ucyA9IGNvbnRlbnQuc3BsaXQoLyN7MSwzfVxccysvKTtcbiAgICBcbiAgICBzZWN0aW9ucy5mb3JFYWNoKChzZWN0aW9uLCBpbmRleCkgPT4ge1xuICAgICAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgICAgIHN0cnVjdHVyZWQuc3VtbWFyeSA9IHNlY3Rpb24udHJpbSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgbGluZXMgPSBzZWN0aW9uLnNwbGl0KCdcXG4nKTtcbiAgICAgICAgY29uc3QgdGl0bGUgPSBsaW5lc1swXT8udHJpbSgpO1xuICAgICAgICBjb25zdCBjb250ZW50ID0gbGluZXMuc2xpY2UoMSkuam9pbignXFxuJykudHJpbSgpO1xuICAgICAgICBcbiAgICAgICAgaWYgKHRpdGxlICYmIGNvbnRlbnQpIHtcbiAgICAgICAgICBzdHJ1Y3R1cmVkLnNlY3Rpb25zLnB1c2goe1xuICAgICAgICAgICAgdGl0bGUsXG4gICAgICAgICAgICBjb250ZW50XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gRXh0cmFjdCBtZXRyaWNzIGZyb20gdGhpcyBzZWN0aW9uXG4gICAgICAgICAgY29uc3Qgc2VjdGlvbk1ldHJpY3MgPSB0aGlzLmV4dHJhY3RGaW5hbmNpYWxNZXRyaWNzKGNvbnRlbnQpO1xuICAgICAgICAgIGlmIChPYmplY3Qua2V5cyhzZWN0aW9uTWV0cmljcykubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc3RydWN0dXJlZC5tZXRyaWNzW3RpdGxlXSA9IHNlY3Rpb25NZXRyaWNzO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIFxuICAgIC8vIEV4dHJhY3QgcmVjb21tZW5kYXRpb25zXG4gICAgY29uc3QgcmVjb21tZW5kYXRpb25NYXRjaGVzID0gY29udGVudC5tYXRjaCgvKD86cmVjb21tZW5kfHN1Z2dlc3R8YWR2aXNlKVteLl0qXFwuL2dpKTtcbiAgICBpZiAocmVjb21tZW5kYXRpb25NYXRjaGVzKSB7XG4gICAgICBzdHJ1Y3R1cmVkLnJlY29tbWVuZGF0aW9ucyA9IHJlY29tbWVuZGF0aW9uTWF0Y2hlcy5tYXAocmVjID0+IHJlYy50cmltKCkpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gc3RydWN0dXJlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0IG1hcmtkb3duIHRvIEhUTUwgKHNpbXBsaWZpZWQpXG4gICAqIEBwYXJhbSBjb250ZW50IFRoZSBtYXJrZG93biBjb250ZW50XG4gICAqIEByZXR1cm5zIEhUTUwgY29udGVudFxuICAgKi9cbiAgcHJpdmF0ZSBjb252ZXJ0VG9IdG1sKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGNvbnRlbnRcbiAgICAgIC5yZXBsYWNlKC8jezEsNn0gKC4rKS9nLCAobWF0Y2gsIHAxLCBvZmZzZXQsIHN0cmluZykgPT4ge1xuICAgICAgICBjb25zdCBsZXZlbCA9IG1hdGNoLnRyaW0oKS5pbmRleE9mKCcgJyk7XG4gICAgICAgIHJldHVybiBgPGgke2xldmVsfT4ke3AxfTwvaCR7bGV2ZWx9PmA7XG4gICAgICB9KVxuICAgICAgLnJlcGxhY2UoL1xcKlxcKiguKz8pXFwqXFwqL2csICc8c3Ryb25nPiQxPC9zdHJvbmc+JylcbiAgICAgIC5yZXBsYWNlKC9cXCooLis/KVxcKi9nLCAnPGVtPiQxPC9lbT4nKVxuICAgICAgLnJlcGxhY2UoL2AoLis/KWAvZywgJzxjb2RlPiQxPC9jb2RlPicpXG4gICAgICAucmVwbGFjZSgvXFxuXFxuL2csICc8YnI+PGJyPicpXG4gICAgICAucmVwbGFjZSgvXFxuL2csICc8YnI+Jyk7XG4gIH1cblxuICAvKipcbiAgICogU3RyaXAgbWFya2Rvd24gZm9ybWF0dGluZ1xuICAgKiBAcGFyYW0gY29udGVudCBUaGUgbWFya2Rvd24gY29udGVudFxuICAgKiBAcmV0dXJucyBQbGFpbiB0ZXh0IGNvbnRlbnRcbiAgICovXG4gIHByaXZhdGUgc3RyaXBNYXJrZG93bihjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBjb250ZW50XG4gICAgICAucmVwbGFjZSgvI3sxLDZ9IC9nLCAnJylcbiAgICAgIC5yZXBsYWNlKC9cXCpcXCooLis/KVxcKlxcKi9nLCAnJDEnKVxuICAgICAgLnJlcGxhY2UoL1xcKiguKz8pXFwqL2csICckMScpXG4gICAgICAucmVwbGFjZSgvYCguKz8pYC9nLCAnJDEnKVxuICAgICAgLnJlcGxhY2UoL1xcWyhbXlxcXV0rKVxcXVxcKFteKV0rXFwpL2csICckMScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvcm1hdCBhbiBlcnJvclxuICAgKiBAcGFyYW0gZXJyb3IgVGhlIGVycm9yXG4gICAqIEBwYXJhbSBjb2RlIFRoZSBlcnJvciBjb2RlXG4gICAqIEByZXR1cm5zIFRoZSBmb3JtYXR0ZWQgZXJyb3JcbiAgICovXG4gIHByaXZhdGUgZm9ybWF0RXJyb3IoZXJyb3I6IGFueSwgY29kZTogc3RyaW5nKTogQmVkcm9ja0Vycm9yIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29kZSxcbiAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UgfHwgJ1Vua25vd24gZXJyb3InLFxuICAgICAgcmVxdWVzdElkOiBlcnJvci5yZXF1ZXN0SWQsXG4gICAgICBzdGF0dXNDb2RlOiBlcnJvci5zdGF0dXNDb2RlLFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpXG4gICAgfTtcbiAgfVxufSJdfQ==