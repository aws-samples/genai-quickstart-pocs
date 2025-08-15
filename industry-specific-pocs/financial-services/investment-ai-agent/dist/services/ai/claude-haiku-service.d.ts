/**
 * Claude Haiku 3.5 service wrapper
 *
 * This service provides a specialized wrapper for the Claude Haiku 3.5 model
 * with optimizations for efficiency and quick processing.
 */
import { BedrockClientService } from './bedrock-client';
import { BedrockModelConfig, BedrockResponse } from '../../models/bedrock';
/**
 * Claude Haiku prompt template types
 * Optimized for quick processing and specific use cases
 */
export declare enum ClaudeHaikuPromptTemplate {
    DEFAULT = "default",
    QUICK_ANALYSIS = "quick-analysis",
    DATA_EXTRACTION = "data-extraction",
    COMPLIANCE_CHECK = "compliance-check",
    COMPLIANCE_ANALYSIS = "compliance-analysis",
    RISK_ANALYSIS = "risk-analysis",
    ESG_ANALYSIS = "esg-analysis",
    DOCUMENTATION = "documentation",
    MARKET_SUMMARY = "market-summary",
    RESEARCH_SYNTHESIS = "research-synthesis"
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
export declare class ClaudeHaikuService {
    private bedrockClient;
    private modelConfig;
    private promptTemplates;
    /**
     * Create a new Claude Haiku service
     * @param bedrockClient The Bedrock client service
     * @param config Optional model configuration overrides
     */
    constructor(bedrockClient: BedrockClientService, config?: Partial<BedrockModelConfig>);
    /**
     * Initialize prompt templates optimized for quick processing
     * @returns Map of prompt templates
     */
    private initializePromptTemplates;
    /**
     * Apply a prompt template with optimized processing
     * @param template The template to apply
     * @param variables The variables to substitute
     * @returns The formatted prompt
     */
    private applyTemplate;
    /**
     * Generate a system prompt for Claude Haiku
     * Optimized for conciseness and efficiency
     * @param role The role for Claude to assume
     * @param context Additional context for the role
     * @param constraints Constraints for Claude's responses
     * @returns The formatted system prompt
     */
    generateSystemPrompt(role: string, context?: string, constraints?: string[]): string;
    /**
     * Complete a prompt using Claude Haiku 3.5
     * Optimized for efficiency and quick processing
     * @param options Request options
     * @returns The model response
     */
    complete(options: ClaudeHaikuRequestOptions): Promise<BedrockResponse>;
    /**
     * Complete a prompt using Claude Haiku 3.5 with streaming
     * @param prompt The prompt to complete
     * @param systemPrompt Optional system prompt
     * @param modelConfig Model configuration
     * @param requestId Optional request ID
     * @returns The final model response
     */
    private streamComplete;
    /**
     * Parse a response from Claude Haiku
     * Optimized for efficiency with simplified parsing
     * @param response The response to parse
     * @param options Parsing options
     * @returns The parsed response
     */
    parseResponse(response: BedrockResponse, options?: HaikuResponseParserOptions): any;
    /**
     * Format an error
     * @param error The error
     * @param code The error code
     * @returns The formatted error
     */
    private formatError;
}
