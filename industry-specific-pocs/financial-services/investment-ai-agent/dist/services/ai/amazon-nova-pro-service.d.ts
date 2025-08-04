/**
 * Amazon Nova Pro service wrapper
 *
 * This service provides a specialized wrapper for the Amazon Nova Pro model
 * configured for financial analysis and quantitative tasks.
 */
import { BedrockClientService } from './bedrock-client';
import { BedrockModelConfig, BedrockResponse } from '../../models/bedrock';
/**
 * Amazon Nova Pro prompt template types
 * Specialized for financial analysis and quantitative tasks
 */
export declare enum NovaProPromptTemplate {
    DEFAULT = "default",
    FINANCIAL_ANALYSIS = "financial-analysis",
    QUANTITATIVE_ANALYSIS = "quantitative-analysis",
    RISK_MODELING = "risk-modeling",
    PORTFOLIO_OPTIMIZATION = "portfolio-optimization",
    TIME_SERIES_ANALYSIS = "time-series-analysis",
    CORRELATION_ANALYSIS = "correlation-analysis",
    SCENARIO_MODELING = "scenario-modeling",
    VALUATION_ANALYSIS = "valuation-analysis"
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
export declare class AmazonNovaProService {
    private bedrockClient;
    private modelConfig;
    private promptTemplates;
    /**
     * Create a new Amazon Nova Pro service
     * @param bedrockClient The Bedrock client service
     * @param config Optional model configuration overrides
     */
    constructor(bedrockClient: BedrockClientService, config?: Partial<BedrockModelConfig>);
    /**
     * Initialize prompt templates specialized for financial analysis and quantitative tasks
     * @returns Map of prompt templates
     */
    private initializePromptTemplates;
    /**
     * Apply a prompt template with financial analysis optimization
     * @param template The template to apply
     * @param variables The variables to substitute
     * @returns The formatted prompt
     */
    private applyTemplate;
    /**
     * Generate a system prompt for Amazon Nova Pro
     * Optimized for financial analysis and quantitative tasks
     * @param role The role for Nova Pro to assume
     * @param context Additional context for the role
     * @param constraints Constraints for Nova Pro's responses
     * @returns The formatted system prompt
     */
    generateSystemPrompt(role: string, context?: string, constraints?: string[]): string;
    /**
     * Complete a prompt using Amazon Nova Pro
     * Optimized for financial analysis and quantitative tasks
     * @param options Request options
     * @returns The model response
     */
    complete(options: NovaProRequestOptions): Promise<BedrockResponse>;
    /**
     * Determine the appropriate role based on analysis type
     * @param analysisType The type of analysis being performed
     * @returns The appropriate role description
     */
    private determineRoleFromAnalysisType;
    /**
     * Complete a prompt using Amazon Nova Pro with streaming
     * @param prompt The prompt to complete
     * @param systemPrompt Optional system prompt
     * @param modelConfig Model configuration
     * @param requestId Optional request ID
     * @returns The final model response
     */
    private streamComplete;
    /**
     * Parse a response from Amazon Nova Pro
     * Specialized for financial analysis and quantitative results
     * @param response The response to parse
     * @param options Parsing options
     * @returns The parsed response
     */
    parseResponse(response: BedrockResponse, options?: NovaProResponseParserOptions): any;
    /**
     * Extract financial metrics from the response text
     * @param text The response text
     * @returns Extracted financial metrics
     */
    private extractFinancialMetrics;
    /**
     * Parse numerical content from text
     * @param content The content to parse
     * @returns Content with parsed numbers
     */
    private parseNumericalContent;
    /**
     * Parse structured financial response
     * @param content The content to structure
     * @returns Structured response
     */
    private parseStructuredFinancialResponse;
    /**
     * Convert markdown to HTML (simplified)
     * @param content The markdown content
     * @returns HTML content
     */
    private convertToHtml;
    /**
     * Strip markdown formatting
     * @param content The markdown content
     * @returns Plain text content
     */
    private stripMarkdown;
    /**
     * Format an error
     * @param error The error
     * @param code The error code
     * @returns The formatted error
     */
    private formatError;
}
