/**
 * Claude Sonnet 3.7 service wrapper
 *
 * This service provides a specialized wrapper for the Claude Sonnet 3.7 model
 * with prompt engineering utilities and response parsing.
 */
import { BedrockClientService } from './bedrock-client';
import { BedrockModelConfig, BedrockResponse } from '../../models/bedrock';
/**
 * Claude Sonnet prompt template types
 */
export declare enum ClaudePromptTemplate {
    DEFAULT = "default",
    INVESTMENT_ANALYSIS = "investment-analysis",
    MARKET_RESEARCH = "market-research",
    RISK_ASSESSMENT = "risk-assessment",
    COMPLIANCE_CHECK = "compliance-check",
    IDEA_GENERATION = "idea-generation",
    DATA_EXTRACTION = "data-extraction",
    EXPLANATION = "explanation"
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
export declare class ClaudeSonnetService {
    private bedrockClient;
    private modelConfig;
    private promptTemplates;
    /**
     * Create a new Claude Sonnet service
     * @param bedrockClient The Bedrock client service
     * @param config Optional model configuration overrides
     */
    constructor(bedrockClient: BedrockClientService, config?: Partial<BedrockModelConfig>);
    /**
     * Initialize prompt templates for different use cases
     * @returns Map of prompt templates
     */
    private initializePromptTemplates;
    /**
     * Apply a prompt template
     * @param template The template to apply
     * @param variables The variables to substitute
     * @returns The formatted prompt
     */
    private applyTemplate;
    /**
     * Generate a system prompt for Claude Sonnet
     * @param role The role for Claude to assume
     * @param context Additional context for the role
     * @param constraints Constraints for Claude's responses
     * @returns The formatted system prompt
     */
    generateSystemPrompt(role: string, context?: string, constraints?: string[]): string;
    /**
     * Complete a prompt using Claude Sonnet 3.7
     * @param options Request options
     * @returns The model response
     */
    complete(options: ClaudeSonnetRequestOptions): Promise<BedrockResponse>;
    /**
     * Complete a prompt using Claude Sonnet 3.7 with streaming
     * @param prompt The prompt to complete
     * @param systemPrompt Optional system prompt
     * @param modelConfig Model configuration
     * @param requestId Optional request ID
     * @returns The final model response
     */
    private streamComplete;
    /**
     * Parse a response from Claude Sonnet
     * @param response The response to parse
     * @param options Parsing options
     * @returns The parsed response
     */
    parseResponse(response: BedrockResponse, options?: ResponseParserOptions): any;
    /**
     * Format an error
     * @param error The error
     * @param code The error code
     * @returns The formatted error
     */
    private formatError;
}
