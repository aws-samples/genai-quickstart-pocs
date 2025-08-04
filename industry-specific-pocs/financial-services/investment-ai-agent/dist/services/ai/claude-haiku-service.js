"use strict";
/**
 * Claude Haiku 3.5 service wrapper
 *
 * This service provides a specialized wrapper for the Claude Haiku 3.5 model
 * with optimizations for efficiency and quick processing.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeHaikuService = exports.ClaudeHaikuPromptTemplate = void 0;
const bedrock_1 = require("../../models/bedrock");
/**
 * Claude Haiku prompt template types
 * Optimized for quick processing and specific use cases
 */
var ClaudeHaikuPromptTemplate;
(function (ClaudeHaikuPromptTemplate) {
    ClaudeHaikuPromptTemplate["DEFAULT"] = "default";
    ClaudeHaikuPromptTemplate["QUICK_ANALYSIS"] = "quick-analysis";
    ClaudeHaikuPromptTemplate["DATA_EXTRACTION"] = "data-extraction";
    ClaudeHaikuPromptTemplate["COMPLIANCE_CHECK"] = "compliance-check";
    ClaudeHaikuPromptTemplate["COMPLIANCE_ANALYSIS"] = "compliance-analysis";
    ClaudeHaikuPromptTemplate["RISK_ANALYSIS"] = "risk-analysis";
    ClaudeHaikuPromptTemplate["ESG_ANALYSIS"] = "esg-analysis";
    ClaudeHaikuPromptTemplate["DOCUMENTATION"] = "documentation";
    ClaudeHaikuPromptTemplate["MARKET_SUMMARY"] = "market-summary";
    ClaudeHaikuPromptTemplate["RESEARCH_SYNTHESIS"] = "research-synthesis";
})(ClaudeHaikuPromptTemplate || (exports.ClaudeHaikuPromptTemplate = ClaudeHaikuPromptTemplate = {}));
/**
 * Claude Haiku service
 * Optimized for efficiency and quick processing
 */
class ClaudeHaikuService {
    /**
     * Create a new Claude Haiku service
     * @param bedrockClient The Bedrock client service
     * @param config Optional model configuration overrides
     */
    constructor(bedrockClient, config) {
        this.bedrockClient = bedrockClient;
        // Get the default model configuration and apply any overrides
        this.modelConfig = {
            ...bedrockClient.getModelConfig(bedrock_1.BedrockModelId.CLAUDE_HAIKU_3_5),
            ...config
        };
        // Initialize prompt templates optimized for quick processing
        this.promptTemplates = this.initializePromptTemplates();
    }
    /**
     * Initialize prompt templates optimized for quick processing
     * @returns Map of prompt templates
     */
    initializePromptTemplates() {
        const templates = new Map();
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
     * Generate a system prompt for Claude Haiku
     * Optimized for conciseness and efficiency
     * @param role The role for Claude to assume
     * @param context Additional context for the role
     * @param constraints Constraints for Claude's responses
     * @returns The formatted system prompt
     */
    generateSystemPrompt(role, context, constraints) {
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
    async complete(options) {
        try {
            // Apply template if specified
            let finalPrompt = options.prompt;
            if (options.template && options.templateVariables) {
                const templateString = this.promptTemplates.get(options.template) || this.promptTemplates.get(ClaudeHaikuPromptTemplate.DEFAULT);
                finalPrompt = this.applyTemplate(templateString, {
                    ...options.templateVariables,
                    prompt: options.prompt
                });
            }
            // Create model config with any overrides
            // Use lower token limits by default for efficiency
            const modelConfig = {
                ...this.modelConfig,
                maxTokens: options.maxTokens || this.modelConfig.maxTokens,
                temperature: options.temperature || this.modelConfig.temperature,
                topP: options.topP || this.modelConfig.topP,
                stopSequences: options.stopSequences || this.modelConfig.stopSequences
            };
            // Invoke the model
            if (options.streaming) {
                return this.streamComplete(finalPrompt, options.systemPrompt, modelConfig, options.requestId);
            }
            else {
                return this.bedrockClient.invokeModel({
                    modelConfig,
                    prompt: finalPrompt,
                    systemPrompt: options.systemPrompt,
                    requestId: options.requestId
                });
            }
        }
        catch (error) {
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
    parseResponse(response, options) {
        const { completion } = response;
        try {
            // Extract JSON if requested - optimized for speed
            if (options?.extractJson) {
                // First try to find JSON in code blocks
                const jsonMatch = completion.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (jsonMatch && jsonMatch[1]) {
                    try {
                        return JSON.parse(jsonMatch[1].trim());
                    }
                    catch (e) {
                        // If parsing fails, continue to next method
                    }
                }
                // Try to parse the entire response as JSON
                try {
                    return JSON.parse(completion);
                }
                catch (e) {
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
        }
        catch (error) {
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
exports.ClaudeHaikuService = ClaudeHaikuService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhdWRlLWhhaWt1LXNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2VydmljZXMvYWkvY2xhdWRlLWhhaWt1LXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7OztHQUtHOzs7QUFHSCxrREFLOEI7QUFFOUI7OztHQUdHO0FBQ0gsSUFBWSx5QkFXWDtBQVhELFdBQVkseUJBQXlCO0lBQ25DLGdEQUFtQixDQUFBO0lBQ25CLDhEQUFpQyxDQUFBO0lBQ2pDLGdFQUFtQyxDQUFBO0lBQ25DLGtFQUFxQyxDQUFBO0lBQ3JDLHdFQUEyQyxDQUFBO0lBQzNDLDREQUErQixDQUFBO0lBQy9CLDBEQUE2QixDQUFBO0lBQzdCLDREQUErQixDQUFBO0lBQy9CLDhEQUFpQyxDQUFBO0lBQ2pDLHNFQUF5QyxDQUFBO0FBQzNDLENBQUMsRUFYVyx5QkFBeUIseUNBQXpCLHlCQUF5QixRQVdwQztBQTJCRDs7O0dBR0c7QUFDSCxNQUFhLGtCQUFrQjtJQUs3Qjs7OztPQUlHO0lBQ0gsWUFDRSxhQUFtQyxFQUNuQyxNQUFvQztRQUVwQyxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztRQUVuQyw4REFBOEQ7UUFDOUQsSUFBSSxDQUFDLFdBQVcsR0FBRztZQUNqQixHQUFHLGFBQWEsQ0FBQyxjQUFjLENBQUMsd0JBQWMsQ0FBQyxnQkFBZ0IsQ0FBQztZQUNoRSxHQUFHLE1BQU07U0FDVixDQUFDO1FBRUYsNkRBQTZEO1FBQzdELElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7SUFDMUQsQ0FBQztJQUVEOzs7T0FHRztJQUNLLHlCQUF5QjtRQUMvQixNQUFNLFNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBcUMsQ0FBQztRQUUvRCwrQ0FBK0M7UUFDL0MsU0FBUyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFFL0QsNERB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QUMsU0FBUztZQUMxQixVQUFVLEVBQUUsS0FBSyxDQUFDLFVBQVU7WUFDNUIsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFO1NBQ3RCLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUF0YUQsZ0RBc2FDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDbGF1ZGUgSGFpa3UgMy41IHNlcnZpY2Ugd3JhcHBlclxuICogXG4gKiBUaGlzIHNlcnZpY2UgcHJvdmlkZXMgYSBzcGVjaWFsaXplZCB3cmFwcGVyIGZvciB0aGUgQ2xhdWRlIEhhaWt1IDMuNSBtb2RlbFxuICogd2l0aCBvcHRpbWl6YXRpb25zIGZvciBlZmZpY2llbmN5IGFuZCBxdWljayBwcm9jZXNzaW5nLlxuICovXG5cbmltcG9ydCB7IEJlZHJvY2tDbGllbnRTZXJ2aWNlIH0gZnJvbSAnLi9iZWRyb2NrLWNsaWVudCc7XG5pbXBvcnQgeyBcbiAgQmVkcm9ja01vZGVsSWQsIFxuICBCZWRyb2NrTW9kZWxDb25maWcsIFxuICBCZWRyb2NrUmVzcG9uc2UsIFxuICBCZWRyb2NrRXJyb3IgXG59IGZyb20gJy4uLy4uL21vZGVscy9iZWRyb2NrJztcblxuLyoqXG4gKiBDbGF1ZGUgSGFpa3UgcHJvbXB0IHRlbXBsYXRlIHR5cGVzXG4gKiBPcHRpbWl6ZWQgZm9yIHF1aWNrIHByb2Nlc3NpbmcgYW5kIHNwZWNpZmljIHVzZSBjYXNlc1xuICovXG5leHBvcnQgZW51bSBDbGF1ZGVIYWlrdVByb21wdFRlbXBsYXRlIHtcbiAgREVGQVVMVCA9ICdkZWZhdWx0JyxcbiAgUVVJQ0tfQU5BTFlTSVMgPSAncXVpY2stYW5hbHlzaXMnLFxuICBEQVRBX0VYVFJBQ1RJT04gPSAnZGF0YS1leHRyYWN0aW9uJyxcbiAgQ09NUExJQU5DRV9DSEVDSyA9ICdjb21wbGlhbmNlLWNoZWNrJyxcbiAgQ09NUExJQU5DRV9BTkFMWVNJUyA9ICdjb21wbGlhbmNlLWFuYWx5c2lzJyxcbiAgUklTS19BTkFMWVNJUyA9ICdyaXNrLWFuYWx5c2lzJyxcbiAgRVNHX0FOQUxZU0lTID0gJ2VzZy1hbmFseXNpcycsXG4gIERPQ1VNRU5UQVRJT04gPSAnZG9jdW1lbnRhdGlvbicsXG4gIE1BUktFVF9TVU1NQVJZID0gJ21hcmtldC1zdW1tYXJ5JyxcbiAgUkVTRUFSQ0hfU1lOVEhFU0lTID0gJ3Jlc2VhcmNoLXN5bnRoZXNpcydcbn1cblxuLyoqXG4gKiBDbGF1ZGUgSGFpa3UgcmVxdWVzdCBvcHRpb25zXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2xhdWRlSGFpa3VSZXF1ZXN0T3B0aW9ucyB7XG4gIHByb21wdDogc3RyaW5nO1xuICBzeXN0ZW1Qcm9tcHQ/OiBzdHJpbmc7XG4gIHRlbXBsYXRlPzogQ2xhdWRlSGFpa3VQcm9tcHRUZW1wbGF0ZTtcbiAgdGVtcGxhdGVWYXJpYWJsZXM/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuICBtYXhUb2tlbnM/OiBudW1iZXI7XG4gIHRlbXBlcmF0dXJlPzogbnVtYmVyO1xuICB0b3BQPzogbnVtYmVyO1xuICBzdG9wU2VxdWVuY2VzPzogc3RyaW5nW107XG4gIHN0cmVhbWluZz86IGJvb2xlYW47XG4gIHJlcXVlc3RJZD86IHN0cmluZztcbn1cblxuLyoqXG4gKiBDbGF1ZGUgSGFpa3UgcmVzcG9uc2UgcGFyc2VyIG9wdGlvbnNcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBIYWlrdVJlc3BvbnNlUGFyc2VyT3B0aW9ucyB7XG4gIGV4dHJhY3RKc29uPzogYm9vbGVhbjtcbiAgZm9ybWF0VHlwZT86ICdtYXJrZG93bicgfCAnaHRtbCcgfCAndGV4dCc7XG4gIHZhbGlkYXRlU2NoZW1hPzogYW55O1xufVxuXG4vKipcbiAqIENsYXVkZSBIYWlrdSBzZXJ2aWNlXG4gKiBPcHRpbWl6ZWQgZm9yIGVmZmljaWVuY3kgYW5kIHF1aWNrIHByb2Nlc3NpbmdcbiAqL1xuZXhwb3J0IGNsYXNzIENsYXVkZUhhaWt1U2VydmljZSB7XG4gIHByaXZhdGUgYmVkcm9ja0NsaWVudDogQmVkcm9ja0NsaWVudFNlcnZpY2U7XG4gIHByaXZhdGUgbW9kZWxDb25maWc6IEJlZHJvY2tNb2RlbENvbmZpZztcbiAgcHJpdmF0ZSBwcm9tcHRUZW1wbGF0ZXM6IE1hcDxDbGF1ZGVIYWlrdVByb21wdFRlbXBsYXRlLCBzdHJpbmc+O1xuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgQ2xhdWRlIEhhaWt1IHNlcnZpY2VcbiAgICogQHBhcmFtIGJlZHJvY2tDbGllbnQgVGhlIEJlZHJvY2sgY2xpZW50IHNlcnZpY2VcbiAgICogQHBhcmFtIGNvbmZpZyBPcHRpb25hbCBtb2RlbCBjb25maWd1cmF0aW9uIG92ZXJyaWRlc1xuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgYmVkcm9ja0NsaWVudDogQmVkcm9ja0NsaWVudFNlcnZpY2UsXG4gICAgY29uZmlnPzogUGFydGlhbDxCZWRyb2NrTW9kZWxDb25maWc+XG4gICkge1xuICAgIHRoaXMuYmVkcm9ja0NsaWVudCA9IGJlZHJvY2tDbGllbnQ7XG4gICAgXG4gICAgLy8gR2V0IHRoZSBkZWZhdWx0IG1vZGVsIGNvbmZpZ3VyYXRpb24gYW5kIGFwcGx5IGFueSBvdmVycmlkZXNcbiAgICB0aGlzLm1vZGVsQ29uZmlnID0ge1xuICAgICAgLi4uYmVkcm9ja0NsaWVudC5nZXRNb2RlbENvbmZpZyhCZWRyb2NrTW9kZWxJZC5DTEFVREVfSEFJS1VfM181KSxcbiAgICAgIC4uLmNvbmZpZ1xuICAgIH07XG4gICAgXG4gICAgLy8gSW5pdGlhbGl6ZSBwcm9tcHQgdGVtcGxhdGVzIG9wdGltaXplZCBmb3IgcXVpY2sgcHJvY2Vzc2luZ1xuICAgIHRoaXMucHJvbXB0VGVtcGxhdGVzID0gdGhpcy5pbml0aWFsaXplUHJvbXB0VGVtcGxhdGVzKCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBwcm9tcHQgdGVtcGxhdGVzIG9wdGltaXplZCBmb3IgcXVpY2sgcHJvY2Vzc2luZ1xuICAgKiBAcmV0dXJucyBNYXAgb2YgcHJvbXB0IHRlbXBsYXRlc1xuICAgKi9cbiAgcHJpdmF0ZSBpbml0aWFsaXplUHJvbXB0VGVtcGxhdGVzKCk6IE1hcDxDbGF1ZGVIYWlrdVByb21wdFRlbXBsYXRlLCBzdHJpbmc+IHtcbiAgICBjb25zdCB0ZW1wbGF0ZXMgPSBuZXcgTWFwPENsYXVkZUhhaWt1UHJvbXB0VGVtcGxhdGUsIHN0cmluZz4oKTtcbiAgICBcbiAgICAvLyBEZWZhdWx0IHRlbXBsYXRlIC0gc2ltcGxpZmllZCBmb3IgZWZmaWNpZW5jeVxuICAgIHRlbXBsYXRlcy5zZXQoQ2xhdWRlSGFpa3VQcm9tcHRUZW1wbGF0ZS5ERUZBVUxULCBge3twcm9tcHR9fWApO1xuICAgIFxuICAgIC8vIFF1aWNrIGFuYWx5c2lzIHRlbXBsYXRlIC0gc3RyZWFtbGluZWQgZm9yIGZhc3QgcHJvY2Vzc2luZ1xuICAgIHRlbXBsYXRlcy5zZXQoQ2xhdWRlSGFpa3VQcm9tcHRUZW1wbGF0ZS5RVUlDS19BTkFMWVNJUywgYFxuICAgICAgIyBRdWljayBBbmFseXNpcyBSZXF1ZXN0XG4gICAgICBcbiAgICAgICMjIFRvcGljXG4gICAgICB7e3RvcGljfX1cbiAgICAgIFxuICAgICAgIyMgQW5hbHlzaXMgUG9pbnRzXG4gICAgICB7e3BvaW50c319XG4gICAgICBcbiAgICAgICMjIE91dHB1dCBGb3JtYXRcbiAgICAgIHt7Zm9ybWF0fX1cbiAgICBgKTtcbiAgICBcbiAgICAvLyBEYXRhIGV4dHJhY3Rpb24gdGVtcGxhdGUgLSBmb2N1c2VkIG9uIHN0cnVjdHVyZWQgZGF0YVxuICAgIHRlbXBsYXRlcy5zZXQoQ2xhdWRlSGFpa3VQcm9tcHRUZW1wbGF0ZS5EQVRBX0VYVFJBQ1RJT04sIGBcbiAgICAgICMgRGF0YSBFeHRyYWN0aW9uXG4gICAgICBcbiAgICAgICMjIFNvdXJjZVxuICAgICAge3tzb3VyY2V9fVxuICAgICAgXG4gICAgICAjIyBFeHRyYWN0XG4gICAgICB7e2V4dHJhY3R9fVxuICAgICAgXG4gICAgICAjIyBGb3JtYXRcbiAgICAgIHt7Zm9ybWF0fX1cbiAgICBgKTtcbiAgICBcbiAgICAvLyBDb21wbGlhbmNlIGNoZWNrIHRlbXBsYXRlIC0gc2ltcGxpZmllZCBmb3IgcXVpY2sgY2hlY2tzXG4gICAgdGVtcGxhdGVzLnNldChDbGF1ZGVIYWlrdVByb21wdFRlbXBsYXRlLkNPTVBMSUFOQ0VfQ0hFQ0ssIGBcbiAgICAgICMgQ29tcGxpYW5jZSBDaGVja1xuICAgICAgXG4gICAgICAjIyBJbnZlc3RtZW50XG4gICAgICB7e2ludmVzdG1lbnR9fVxuICAgICAgXG4gICAgICAjIyBSZWd1bGF0aW9uc1xuICAgICAge3tyZWd1bGF0aW9uc319XG4gICAgICBcbiAgICAgICMjIENoZWNrXG4gICAgICB7e2NoZWNrfX1cbiAgICBgKTtcbiAgICBcbiAgICAvLyBNYXJrZXQgc3VtbWFyeSB0ZW1wbGF0ZSAtIGZvciBxdWljayBtYXJrZXQgdXBkYXRlc1xuICAgIHRlbXBsYXRlcy5zZXQoQ2xhdWRlSGFpa3VQcm9tcHRUZW1wbGF0ZS5NQVJLRVRfU1VNTUFSWSwgYFxuICAgICAgIyBNYXJrZXQgU3VtbWFyeVxuICAgICAgXG4gICAgICAjIyBNYXJrZXQgRGF0YVxuICAgICAge3tkYXRhfX1cbiAgICAgIFxuICAgICAgIyMgRm9jdXMgQXJlYXNcbiAgICAgIHt7Zm9jdXN9fVxuICAgICAgXG4gICAgICAjIyBTdW1tYXJ5IFR5cGVcbiAgICAgIHt7dHlwZX19XG4gICAgYCk7XG4gICAgXG4gICAgLy8gUmVzZWFyY2ggc3ludGhlc2lzIHRlbXBsYXRlIC0gZm9yIGNvbWJpbmluZyByZXNlYXJjaCBmaW5kaW5nc1xuICAgIHRlbXBsYXRlcy5zZXQoQ2xhdWRlSGFpa3VQcm9tcHRUZW1wbGF0ZS5SRVNFQVJDSF9TWU5USEVTSVMsIGBcbiAgICAgICMgUmVzZWFyY2ggU3ludGhlc2lzXG4gICAgICBcbiAgICAgICMjIFJlc2VhcmNoIFBvaW50c1xuICAgICAge3twb2ludHN9fVxuICAgICAgXG4gICAgICAjIyBTeW50aGVzaXMgR29hbFxuICAgICAge3tnb2FsfX1cbiAgICAgIFxuICAgICAgIyMgT3V0cHV0IFJlcXVpcmVtZW50c1xuICAgICAge3tyZXF1aXJlbWVudHN9fVxuICAgIGApO1xuICAgIFxuICAgIC8vIENvbXBsaWFuY2UgYW5hbHlzaXMgdGVtcGxhdGUgLSBmb3IgZGV0YWlsZWQgY29tcGxpYW5jZSBhbmFseXNpc1xuICAgIHRlbXBsYXRlcy5zZXQoQ2xhdWRlSGFpa3VQcm9tcHRUZW1wbGF0ZS5DT01QTElBTkNFX0FOQUxZU0lTLCBgXG4gICAgICAjIENvbXBsaWFuY2UgQW5hbHlzaXNcbiAgICAgIFxuICAgICAgIyMgSW52ZXN0bWVudCBEZXRhaWxzXG4gICAgICBOYW1lOiB7e2ludmVzdG1lbnROYW1lfX1cbiAgICAgIFR5cGU6IHt7aW52ZXN0bWVudFR5cGV9fVxuICAgICAgU2VjdG9yOiB7e3NlY3Rvcn19XG4gICAgICBcbiAgICAgICMjIEp1cmlzZGljdGlvbnNcbiAgICAgIHt7anVyaXNkaWN0aW9uc319XG4gICAgICBcbiAgICAgICMjIEFuYWx5c2lzIFR5cGVcbiAgICAgIHt7YW5hbHlzaXNUeXBlfX1cbiAgICAgIFxuICAgICAgIyMgSW5zdHJ1Y3Rpb25zXG4gICAgICB7e3Byb21wdH19XG4gICAgICBcbiAgICAgIFBsZWFzZSBwcm92aWRlIGEgc3RydWN0dXJlZCBjb21wbGlhbmNlIGFuYWx5c2lzIHdpdGggc3BlY2lmaWMgZmluZGluZ3MgYW5kIHJlY29tbWVuZGF0aW9ucy5cbiAgICBgKTtcbiAgICBcbiAgICAvLyBSaXNrIGFuYWx5c2lzIHRlbXBsYXRlIC0gZm9yIHJpc2sgYXNzZXNzbWVudFxuICAgIHRlbXBsYXRlcy5zZXQoQ2xhdWRlSGFpa3VQcm9tcHRUZW1wbGF0ZS5SSVNLX0FOQUxZU0lTLCBgXG4gICAgICAjIFJpc2sgQW5hbHlzaXNcbiAgICAgIFxuICAgICAgIyMgSW52ZXN0bWVudFxuICAgICAge3tpbnZlc3RtZW50TmFtZX19ICh7e2ludmVzdG1lbnRUeXBlfX0pXG4gICAgICBcbiAgICAgICMjIFJpc2sgQ29udGV4dFxuICAgICAgLSBSaXNrIFRvbGVyYW5jZToge3tyaXNrVG9sZXJhbmNlfX1cbiAgICAgIC0gVGltZSBIb3Jpem9uOiB7e3RpbWVIb3Jpem9ufX1cbiAgICAgIC0gQW5hbHlzaXMgVHlwZToge3thbmFseXNpc1R5cGV9fVxuICAgICAgXG4gICAgICAjIyBJbnN0cnVjdGlvbnNcbiAgICAgIHt7cHJvbXB0fX1cbiAgICAgIFxuICAgICAgUGxlYXNlIHByb3ZpZGUgYSBjb21wcmVoZW5zaXZlIHJpc2sgYXNzZXNzbWVudCB3aXRoIHNwZWNpZmljIHJpc2sgZmFjdG9ycyBhbmQgbWl0aWdhdGlvbiBzdHJhdGVnaWVzLlxuICAgIGApO1xuICAgIFxuICAgIC8vIEVTRyBhbmFseXNpcyB0ZW1wbGF0ZSAtIGZvciBFU0cgZXZhbHVhdGlvblxuICAgIHRlbXBsYXRlcy5zZXQoQ2xhdWRlSGFpa3VQcm9tcHRUZW1wbGF0ZS5FU0dfQU5BTFlTSVMsIGBcbiAgICAgICMgRVNHIEFuYWx5c2lzXG4gICAgICBcbiAgICAgICMjIEludmVzdG1lbnRcbiAgICAgIHt7aW52ZXN0bWVudE5hbWV9fVxuICAgICAgU2VjdG9yOiB7e3NlY3Rvcn19XG4gICAgICBJbmR1c3RyeToge3tpbmR1c3RyeX19XG4gICAgICBcbiAgICAgICMjIEFuYWx5c2lzIFR5cGVcbiAgICAgIHt7YW5hbHlzaXNUeXBlfX1cbiAgICAgIFxuICAgICAgIyMgSW5zdHJ1Y3Rpb25zXG4gICAgICB7e3Byb21wdH19XG4gICAgICBcbiAgICAgIFBsZWFzZSBwcm92aWRlIGRldGFpbGVkIEVTRyBzY29yaW5nIGFuZCBhbmFseXNpcyB3aXRoIHNwZWNpZmljIGZhY3RvcnMgYW5kIHJlY29tbWVuZGF0aW9ucy5cbiAgICBgKTtcbiAgICBcbiAgICAvLyBEb2N1bWVudGF0aW9uIHRlbXBsYXRlIC0gZm9yIGdlbmVyYXRpbmcgY29tcGxpYW5jZSBkb2N1bWVudHNcbiAgICB0ZW1wbGF0ZXMuc2V0KENsYXVkZUhhaWt1UHJvbXB0VGVtcGxhdGUuRE9DVU1FTlRBVElPTiwgYFxuICAgICAgIyB7e2RvY3VtZW50VHlwZX19IERvY3VtZW50YXRpb25cbiAgICAgIFxuICAgICAgIyMgU3ViamVjdFxuICAgICAge3tzdWJqZWN0fX1cbiAgICAgIFxuICAgICAgIyMgSnVyaXNkaWN0aW9uXG4gICAgICB7e2p1cmlzZGljdGlvbn19XG4gICAgICBcbiAgICAgICMjIEFuYWx5c2lzIFR5cGVcbiAgICAgIHt7YW5hbHlzaXNUeXBlfX1cbiAgICAgIFxuICAgICAgIyMgSW5zdHJ1Y3Rpb25zXG4gICAgICB7e3Byb21wdH19XG4gICAgICBcbiAgICAgIFBsZWFzZSBnZW5lcmF0ZSBwcm9mZXNzaW9uYWwgY29tcGxpYW5jZSBkb2N1bWVudGF0aW9uIHdpdGggcHJvcGVyIHN0cnVjdHVyZSBhbmQgcmVmZXJlbmNlcy5cbiAgICBgKTtcbiAgICBcbiAgICByZXR1cm4gdGVtcGxhdGVzO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGx5IGEgcHJvbXB0IHRlbXBsYXRlIHdpdGggb3B0aW1pemVkIHByb2Nlc3NpbmdcbiAgICogQHBhcmFtIHRlbXBsYXRlIFRoZSB0ZW1wbGF0ZSB0byBhcHBseVxuICAgKiBAcGFyYW0gdmFyaWFibGVzIFRoZSB2YXJpYWJsZXMgdG8gc3Vic3RpdHV0ZVxuICAgKiBAcmV0dXJucyBUaGUgZm9ybWF0dGVkIHByb21wdFxuICAgKi9cbiAgcHJpdmF0ZSBhcHBseVRlbXBsYXRlKHRlbXBsYXRlOiBzdHJpbmcsIHZhcmlhYmxlczogUmVjb3JkPHN0cmluZywgYW55Pik6IHN0cmluZyB7XG4gICAgbGV0IHJlc3VsdCA9IHRlbXBsYXRlO1xuICAgIFxuICAgIC8vIFJlcGxhY2UgYWxsIHZhcmlhYmxlcyBpbiB0aGUgdGVtcGxhdGVcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyh2YXJpYWJsZXMpKSB7XG4gICAgICBjb25zdCBwbGFjZWhvbGRlciA9IG5ldyBSZWdFeHAoYHt7JHtrZXl9fX1gLCAnZycpO1xuICAgICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UocGxhY2Vob2xkZXIsIHZhbHVlKTtcbiAgICB9XG4gICAgXG4gICAgLy8gUmVtb3ZlIGFueSByZW1haW5pbmcgcGxhY2Vob2xkZXJzXG4gICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoL3t7W159XSt9fS9nLCAnJyk7XG4gICAgXG4gICAgLy8gQ2xlYW4gdXAgdGhlIHJlc3VsdCBieSByZW1vdmluZyBleHRyYSB3aGl0ZXNwYWNlXG4gICAgcmVzdWx0ID0gcmVzdWx0LnRyaW0oKVxuICAgICAgLnNwbGl0KCdcXG4nKVxuICAgICAgLm1hcChsaW5lID0+IGxpbmUudHJpbSgpKVxuICAgICAgLmpvaW4oJ1xcbicpO1xuICAgIFxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGUgYSBzeXN0ZW0gcHJvbXB0IGZvciBDbGF1ZGUgSGFpa3VcbiAgICogT3B0aW1pemVkIGZvciBjb25jaXNlbmVzcyBhbmQgZWZmaWNpZW5jeVxuICAgKiBAcGFyYW0gcm9sZSBUaGUgcm9sZSBmb3IgQ2xhdWRlIHRvIGFzc3VtZVxuICAgKiBAcGFyYW0gY29udGV4dCBBZGRpdGlvbmFsIGNvbnRleHQgZm9yIHRoZSByb2xlXG4gICAqIEBwYXJhbSBjb25zdHJhaW50cyBDb25zdHJhaW50cyBmb3IgQ2xhdWRlJ3MgcmVzcG9uc2VzXG4gICAqIEByZXR1cm5zIFRoZSBmb3JtYXR0ZWQgc3lzdGVtIHByb21wdFxuICAgKi9cbiAgcHVibGljIGdlbmVyYXRlU3lzdGVtUHJvbXB0KFxuICAgIHJvbGU6IHN0cmluZyxcbiAgICBjb250ZXh0Pzogc3RyaW5nLFxuICAgIGNvbnN0cmFpbnRzPzogc3RyaW5nW11cbiAgKTogc3RyaW5nIHtcbiAgICAvLyBDcmVhdGUgYSBjb25jaXNlIHN5c3RlbSBwcm9tcHQgZm9yIGVmZmljaWVuY3lcbiAgICBsZXQgc3lzdGVtUHJvbXB0ID0gYFlvdSBhcmUgJHtyb2xlfS5gO1xuICAgIFxuICAgIGlmIChjb250ZXh0KSB7XG4gICAgICBzeXN0ZW1Qcm9tcHQgKz0gYCAke2NvbnRleHR9YDtcbiAgICB9XG4gICAgXG4gICAgaWYgKGNvbnN0cmFpbnRzICYmIGNvbnN0cmFpbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIHN5c3RlbVByb21wdCArPSAnIENvbnN0cmFpbnRzOic7XG4gICAgICBmb3IgKGNvbnN0IGNvbnN0cmFpbnQgb2YgY29uc3RyYWludHMpIHtcbiAgICAgICAgc3lzdGVtUHJvbXB0ICs9IGAgJHtjb25zdHJhaW50fS5gO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gc3lzdGVtUHJvbXB0O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBsZXRlIGEgcHJvbXB0IHVzaW5nIENsYXVkZSBIYWlrdSAzLjVcbiAgICogT3B0aW1pemVkIGZvciBlZmZpY2llbmN5IGFuZCBxdWljayBwcm9jZXNzaW5nXG4gICAqIEBwYXJhbSBvcHRpb25zIFJlcXVlc3Qgb3B0aW9uc1xuICAgKiBAcmV0dXJucyBUaGUgbW9kZWwgcmVzcG9uc2VcbiAgICovXG4gIHB1YmxpYyBhc3luYyBjb21wbGV0ZShvcHRpb25zOiBDbGF1ZGVIYWlrdVJlcXVlc3RPcHRpb25zKTogUHJvbWlzZTxCZWRyb2NrUmVzcG9uc2U+IHtcbiAgICB0cnkge1xuICAgICAgLy8gQXBwbHkgdGVtcGxhdGUgaWYgc3BlY2lmaWVkXG4gICAgICBsZXQgZmluYWxQcm9tcHQgPSBvcHRpb25zLnByb21wdDtcbiAgICAgIGlmIChvcHRpb25zLnRlbXBsYXRlICYmIG9wdGlvbnMudGVtcGxhdGVWYXJpYWJsZXMpIHtcbiAgICAgICAgY29uc3QgdGVtcGxhdGVTdHJpbmcgPSB0aGlzLnByb21wdFRlbXBsYXRlcy5nZXQob3B0aW9ucy50ZW1wbGF0ZSkgfHwgdGhpcy5wcm9tcHRUZW1wbGF0ZXMuZ2V0KENsYXVkZUhhaWt1UHJvbXB0VGVtcGxhdGUuREVGQVVMVCkhO1xuICAgICAgICBmaW5hbFByb21wdCA9IHRoaXMuYXBwbHlUZW1wbGF0ZSh0ZW1wbGF0ZVN0cmluZywge1xuICAgICAgICAgIC4uLm9wdGlvbnMudGVtcGxhdGVWYXJpYWJsZXMsXG4gICAgICAgICAgcHJvbXB0OiBvcHRpb25zLnByb21wdFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gQ3JlYXRlIG1vZGVsIGNvbmZpZyB3aXRoIGFueSBvdmVycmlkZXNcbiAgICAgIC8vIFVzZSBsb3dlciB0b2tlbiBsaW1pdHMgYnkgZGVmYXVsdCBmb3IgZWZmaWNpZW5jeVxuICAgICAgY29uc3QgbW9kZWxDb25maWc6IEJlZHJvY2tNb2RlbENvbmZpZyA9IHtcbiAgICAgICAgLi4udGhpcy5tb2RlbENvbmZpZyxcbiAgICAgICAgbWF4VG9rZW5zOiBvcHRpb25zLm1heFRva2VucyB8fCB0aGlzLm1vZGVsQ29uZmlnLm1heFRva2VucyxcbiAgICAgICAgdGVtcGVyYXR1cmU6IG9wdGlvbnMudGVtcGVyYXR1cmUgfHwgdGhpcy5tb2RlbENvbmZpZy50ZW1wZXJhdHVyZSxcbiAgICAgICAgdG9wUDogb3B0aW9ucy50b3BQIHx8IHRoaXMubW9kZWxDb25maWcudG9wUCxcbiAgICAgICAgc3RvcFNlcXVlbmNlczogb3B0aW9ucy5zdG9wU2VxdWVuY2VzIHx8IHRoaXMubW9kZWxDb25maWcuc3RvcFNlcXVlbmNlc1xuICAgICAgfTtcbiAgICAgIFxuICAgICAgLy8gSW52b2tlIHRoZSBtb2RlbFxuICAgICAgaWYgKG9wdGlvbnMuc3RyZWFtaW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0cmVhbUNvbXBsZXRlKGZpbmFsUHJvbXB0LCBvcHRpb25zLnN5c3RlbVByb21wdCwgbW9kZWxDb25maWcsIG9wdGlvbnMucmVxdWVzdElkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmJlZHJvY2tDbGllbnQuaW52b2tlTW9kZWwoe1xuICAgICAgICAgIG1vZGVsQ29uZmlnLFxuICAgICAgICAgIHByb21wdDogZmluYWxQcm9tcHQsXG4gICAgICAgICAgc3lzdGVtUHJvbXB0OiBvcHRpb25zLnN5c3RlbVByb21wdCxcbiAgICAgICAgICByZXF1ZXN0SWQ6IG9wdGlvbnMucmVxdWVzdElkXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBjb21wbGV0aW5nIHByb21wdCB3aXRoIENsYXVkZSBIYWlrdTonLCBlcnJvcik7XG4gICAgICB0aHJvdyB0aGlzLmZvcm1hdEVycm9yKGVycm9yLCAnQ0xBVURFX0hBSUtVX0NPTVBMRVRJT05fRVJST1InKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ29tcGxldGUgYSBwcm9tcHQgdXNpbmcgQ2xhdWRlIEhhaWt1IDMuNSB3aXRoIHN0cmVhbWluZ1xuICAgKiBAcGFyYW0gcHJvbXB0IFRoZSBwcm9tcHQgdG8gY29tcGxldGVcbiAgICogQHBhcmFtIHN5c3RlbVByb21wdCBPcHRpb25hbCBzeXN0ZW0gcHJvbXB0XG4gICAqIEBwYXJhbSBtb2RlbENvbmZpZyBNb2RlbCBjb25maWd1cmF0aW9uXG4gICAqIEBwYXJhbSByZXF1ZXN0SWQgT3B0aW9uYWwgcmVxdWVzdCBJRFxuICAgKiBAcmV0dXJucyBUaGUgZmluYWwgbW9kZWwgcmVzcG9uc2VcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgc3RyZWFtQ29tcGxldGUoXG4gICAgcHJvbXB0OiBzdHJpbmcsXG4gICAgc3lzdGVtUHJvbXB0Pzogc3RyaW5nLFxuICAgIG1vZGVsQ29uZmlnPzogQmVkcm9ja01vZGVsQ29uZmlnLFxuICAgIHJlcXVlc3RJZD86IHN0cmluZ1xuICApOiBQcm9taXNlPEJlZHJvY2tSZXNwb25zZT4ge1xuICAgIGNvbnN0IGNvbmZpZyA9IG1vZGVsQ29uZmlnIHx8IHRoaXMubW9kZWxDb25maWc7XG4gICAgbGV0IGZ1bGxSZXNwb25zZSA9ICcnO1xuICAgIGxldCBmaW5hbFJlc3BvbnNlOiBQYXJ0aWFsPEJlZHJvY2tSZXNwb25zZT4gPSB7fTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiB0aGlzLmJlZHJvY2tDbGllbnQuaW52b2tlTW9kZWxXaXRoU3RyZWFtaW5nKHtcbiAgICAgICAgbW9kZWxDb25maWc6IGNvbmZpZyxcbiAgICAgICAgcHJvbXB0LFxuICAgICAgICBzeXN0ZW1Qcm9tcHQsXG4gICAgICAgIHJlcXVlc3RJZFxuICAgICAgfSkpIHtcbiAgICAgICAgaWYgKGNodW5rLmNvbXBsZXRpb24pIHtcbiAgICAgICAgICAvLyBJZiB0aGlzIGlzIHRoZSBmaW5hbCBjaHVuayB3aXRoIHRoZSBjb21wbGV0ZSByZXNwb25zZSwgZG9uJ3QgYXBwZW5kIGl0XG4gICAgICAgICAgLy8gYXMgaXQgd291bGQgZHVwbGljYXRlIHRoZSBjb250ZW50XG4gICAgICAgICAgaWYgKGNodW5rLmZpbmlzaFJlYXNvbikge1xuICAgICAgICAgICAgZmluYWxSZXNwb25zZSA9IGNodW5rO1xuICAgICAgICAgICAgLy8gVGhlIGxhc3QgY2h1bmsgaXMgdGhlIGNvbXBsZXRlIHJlc3BvbnNlLCBzbyB1c2UgaXQgZGlyZWN0bHlcbiAgICAgICAgICAgIGZ1bGxSZXNwb25zZSA9IGNodW5rLmNvbXBsZXRpb247XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEZvciBpbnRlcm1lZGlhdGUgY2h1bmtzLCBhcHBlbmQgdG8gdGhlIGZ1bGwgcmVzcG9uc2VcbiAgICAgICAgICAgIGZ1bGxSZXNwb25zZSArPSBjaHVuay5jb21wbGV0aW9uO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBSZXR1cm4gdGhlIGNvbXBsZXRlIHJlc3BvbnNlXG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb21wbGV0aW9uOiBmdWxsUmVzcG9uc2UsXG4gICAgICAgIG1vZGVsSWQ6IGNvbmZpZy5tb2RlbElkLFxuICAgICAgICB1c2FnZTogZmluYWxSZXNwb25zZS51c2FnZSB8fCB7XG4gICAgICAgICAgaW5wdXRUb2tlbnM6IC0xLFxuICAgICAgICAgIG91dHB1dFRva2VuczogLTEsXG4gICAgICAgICAgdG90YWxUb2tlbnM6IC0xXG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVlc3RJZDogcmVxdWVzdElkIHx8ICd1bmtub3duJyxcbiAgICAgICAgZmluaXNoUmVhc29uOiBmaW5hbFJlc3BvbnNlLmZpbmlzaFJlYXNvbiB8fCAndW5rbm93bidcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHN0cmVhbWluZyBjb21wbGV0aW9uIHdpdGggQ2xhdWRlIEhhaWt1OicsIGVycm9yKTtcbiAgICAgIHRocm93IHRoaXMuZm9ybWF0RXJyb3IoZXJyb3IsICdDTEFVREVfSEFJS1VfU1RSRUFNSU5HX0VSUk9SJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIGEgcmVzcG9uc2UgZnJvbSBDbGF1ZGUgSGFpa3VcbiAgICogT3B0aW1pemVkIGZvciBlZmZpY2llbmN5IHdpdGggc2ltcGxpZmllZCBwYXJzaW5nXG4gICAqIEBwYXJhbSByZXNwb25zZSBUaGUgcmVzcG9uc2UgdG8gcGFyc2VcbiAgICogQHBhcmFtIG9wdGlvbnMgUGFyc2luZyBvcHRpb25zXG4gICAqIEByZXR1cm5zIFRoZSBwYXJzZWQgcmVzcG9uc2VcbiAgICovXG4gIHB1YmxpYyBwYXJzZVJlc3BvbnNlKHJlc3BvbnNlOiBCZWRyb2NrUmVzcG9uc2UsIG9wdGlvbnM/OiBIYWlrdVJlc3BvbnNlUGFyc2VyT3B0aW9ucyk6IGFueSB7XG4gICAgY29uc3QgeyBjb21wbGV0aW9uIH0gPSByZXNwb25zZTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgLy8gRXh0cmFjdCBKU09OIGlmIHJlcXVlc3RlZCAtIG9wdGltaXplZCBmb3Igc3BlZWRcbiAgICAgIGlmIChvcHRpb25zPy5leHRyYWN0SnNvbikge1xuICAgICAgICAvLyBGaXJzdCB0cnkgdG8gZmluZCBKU09OIGluIGNvZGUgYmxvY2tzXG4gICAgICAgIGNvbnN0IGpzb25NYXRjaCA9IGNvbXBsZXRpb24ubWF0Y2goL2BgYCg/Ompzb24pP1xccyooW1xcc1xcU10qPylcXHMqYGBgLyk7XG4gICAgICAgIGlmIChqc29uTWF0Y2ggJiYganNvbk1hdGNoWzFdKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKGpzb25NYXRjaFsxXS50cmltKCkpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIElmIHBhcnNpbmcgZmFpbHMsIGNvbnRpbnVlIHRvIG5leHQgbWV0aG9kXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBUcnkgdG8gcGFyc2UgdGhlIGVudGlyZSByZXNwb25zZSBhcyBKU09OXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoY29tcGxldGlvbik7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAvLyBOb3QgdmFsaWQgSlNPTiwgY29udGludWUgd2l0aCBvdGhlciBwYXJzaW5nIG9wdGlvbnNcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBGb3JtYXQgdGhlIHJlc3BvbnNlIGlmIHJlcXVlc3RlZCAtIHNpbXBsaWZpZWQgZm9yIHNwZWVkXG4gICAgICBpZiAob3B0aW9ucz8uZm9ybWF0VHlwZSkge1xuICAgICAgICBzd2l0Y2ggKG9wdGlvbnMuZm9ybWF0VHlwZSkge1xuICAgICAgICAgIGNhc2UgJ21hcmtkb3duJzpcbiAgICAgICAgICAgIC8vIFJldHVybiBhcy1pcywgYXNzdW1pbmcgQ2xhdWRlIGFscmVhZHkgb3V0cHV0cyBtYXJrZG93blxuICAgICAgICAgICAgcmV0dXJuIGNvbXBsZXRpb247XG4gICAgICAgICAgY2FzZSAnaHRtbCc6XG4gICAgICAgICAgICAvLyBTaW1wbGlmaWVkIEhUTUwgY29udmVyc2lvbiBmb3Igc3BlZWRcbiAgICAgICAgICAgIHJldHVybiBjb21wbGV0aW9uXG4gICAgICAgICAgICAgIC5yZXBsYWNlKC8jezEsNn0gKC4rKS9nLCAnPGgzPiQxPC9oMz4nKVxuICAgICAgICAgICAgICAucmVwbGFjZSgvXFwqXFwqKC4rPylcXCpcXCovZywgJzxzdHJvbmc+JDE8L3N0cm9uZz4nKVxuICAgICAgICAgICAgICAucmVwbGFjZSgvXFwqKC4rPylcXCovZywgJzxlbT4kMTwvZW0+JylcbiAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcblxcbi9nLCAnPGJyPicpO1xuICAgICAgICAgIGNhc2UgJ3RleHQnOlxuICAgICAgICAgICAgLy8gU2ltcGxpZmllZCB0ZXh0IGNvbnZlcnNpb24gZm9yIHNwZWVkXG4gICAgICAgICAgICByZXR1cm4gY29tcGxldGlvblxuICAgICAgICAgICAgICAucmVwbGFjZSgvI3sxLDZ9IC9nLCAnJylcbiAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcKlxcKiguKz8pXFwqXFwqL2csICckMScpXG4gICAgICAgICAgICAgIC5yZXBsYWNlKC9cXCooLis/KVxcKi9nLCAnJDEnKTtcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIGNvbXBsZXRpb247XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gRGVmYXVsdDogcmV0dXJuIHRoZSByYXcgY29tcGxldGlvblxuICAgICAgcmV0dXJuIGNvbXBsZXRpb247XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHBhcnNpbmcgQ2xhdWRlIEhhaWt1IHJlc3BvbnNlOicsIGVycm9yKTtcbiAgICAgIHRocm93IHRoaXMuZm9ybWF0RXJyb3IoZXJyb3IsICdDTEFVREVfSEFJS1VfUEFSU0lOR19FUlJPUicpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGb3JtYXQgYW4gZXJyb3JcbiAgICogQHBhcmFtIGVycm9yIFRoZSBlcnJvclxuICAgKiBAcGFyYW0gY29kZSBUaGUgZXJyb3IgY29kZVxuICAgKiBAcmV0dXJucyBUaGUgZm9ybWF0dGVkIGVycm9yXG4gICAqL1xuICBwcml2YXRlIGZvcm1hdEVycm9yKGVycm9yOiBhbnksIGNvZGU6IHN0cmluZyk6IEJlZHJvY2tFcnJvciB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvZGUsXG4gICAgICBtZXNzYWdlOiBlcnJvci5tZXNzYWdlIHx8ICdVbmtub3duIGVycm9yJyxcbiAgICAgIHJlcXVlc3RJZDogZXJyb3IucmVxdWVzdElkLFxuICAgICAgc3RhdHVzQ29kZTogZXJyb3Iuc3RhdHVzQ29kZSxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKVxuICAgIH07XG4gIH1cbn0iXX0=