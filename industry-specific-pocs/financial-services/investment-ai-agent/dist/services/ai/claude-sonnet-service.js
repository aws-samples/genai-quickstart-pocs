"use strict";
/**
 * Claude Sonnet 3.7 service wrapper
 *
 * This service provides a specialized wrapper for the Claude Sonnet 3.7 model
 * with prompt engineering utilities and response parsing.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeSonnetService = exports.ClaudePromptTemplate = void 0;
const bedrock_1 = require("../../models/bedrock");
/**
 * Claude Sonnet prompt template types
 */
var ClaudePromptTemplate;
(function (ClaudePromptTemplate) {
    ClaudePromptTemplate["DEFAULT"] = "default";
    ClaudePromptTemplate["INVESTMENT_ANALYSIS"] = "investment-analysis";
    ClaudePromptTemplate["MARKET_RESEARCH"] = "market-research";
    ClaudePromptTemplate["RISK_ASSESSMENT"] = "risk-assessment";
    ClaudePromptTemplate["COMPLIANCE_CHECK"] = "compliance-check";
    ClaudePromptTemplate["IDEA_GENERATION"] = "idea-generation";
    ClaudePromptTemplate["DATA_EXTRACTION"] = "data-extraction";
    ClaudePromptTemplate["EXPLANATION"] = "explanation";
})(ClaudePromptTemplate || (exports.ClaudePromptTemplate = ClaudePromptTemplate = {}));
/**
 * Claude Sonnet service
 */
class ClaudeSonnetService {
    /**
     * Create a new Claude Sonnet service
     * @param bedrockClient The Bedrock client service
     * @param config Optional model configuration overrides
     */
    constructor(bedrockClient, config) {
        this.bedrockClient = bedrockClient;
        // Get the default model configuration and apply any overrides
        this.modelConfig = {
            ...bedrockClient.getModelConfig(bedrock_1.BedrockModelId.CLAUDE_SONNET_3_7),
            ...config
        };
        // Initialize prompt templates
        this.promptTemplates = this.initializePromptTemplates();
    }
    /**
     * Initialize prompt templates for different use cases
     * @returns Map of prompt templates
     */
    initializePromptTemplates() {
        const templates = new Map();
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
     * Generate a system prompt for Claude Sonnet
     * @param role The role for Claude to assume
     * @param context Additional context for the role
     * @param constraints Constraints for Claude's responses
     * @returns The formatted system prompt
     */
    generateSystemPrompt(role, context, constraints) {
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
    async complete(options) {
        try {
            // Apply template if specified
            let finalPrompt = options.prompt;
            if (options.template && options.templateVariables) {
                const templateString = this.promptTemplates.get(options.template) || this.promptTemplates.get(ClaudePromptTemplate.DEFAULT);
                finalPrompt = this.applyTemplate(templateString, {
                    ...options.templateVariables,
                    prompt: options.prompt
                });
            }
            // Create model config with any overrides
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
    async streamComplete(prompt, systemPrompt, modelConfig, requestId) {
        const config = modelConfig || this.modelConfig;
        let fullResponse = '';
        let finalResponse = {};
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
                    }
                    else {
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
        }
        catch (error) {
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
    parseResponse(response, options) {
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
                }
                catch (e) {
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
        }
        catch (error) {
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
exports.ClaudeSonnetService = ClaudeSonnetService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhdWRlLXNvbm5ldC1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3NlcnZpY2VzL2FpL2NsYXVkZS1zb25uZXQtc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7O0dBS0c7OztBQUdILGtEQUs4QjtBQUU5Qjs7R0FFRztBQUNILElBQVksb0JBU1g7QUFURCxXQUFZLG9CQUFvQjtJQUM5QiwyQ0FBbUIsQ0FBQTtJQUNuQixtRUFBMkMsQ0FBQTtJQUMzQywyREFBbUMsQ0FBQTtJQUNuQywyREFBbUMsQ0FBQTtJQUNuQyw2REFBcUMsQ0FBQTtJQUNyQywyREFBbUMsQ0FBQTtJQUNuQywyREFBbUMsQ0FBQTtJQUNuQyxtREFBMkIsQ0FBQTtBQUM3QixDQUFDLEVBVFcsb0JBQW9CLG9DQUFwQixvQkFBb0IsUUFTL0I7QUEyQkQ7O0dBRUc7QUFDSCxNQUFhLG1CQUFtQjtJQUs5Qjs7OztPQUlHO0lBQ0gsWUFDRSxhQUFtQyxFQUNuQyxNQUFvQztRQUVwQyxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztRQUVuQyw4REFBOEQ7UUFDOUQsSUFBSSxDQUFDLFdBQVcsR0FBRztZQUNqQixHQUFHLGFBQWEsQ0FBQyxjQUFjLENBQUMsd0JBQWMsQ0FBQyxpQkFBaUIsQ0FBQztZQUNqRSxHQUFHLE1BQU07U0FDVixDQUFDO1FBRUYsOEJBQThCO1FBQzlCLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7SUFDMUQsQ0FBQztJQUVEOzs7T0FHRztJQUNLLHlCQUF5QjtRQUMvQixNQUFNLFNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBZ0MsQ0FBQztRQUUxRCxtQkFBbUI7UUFDbkIsU0FBUyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLEVBQUU7O0tBRTNDLENBQUMsQ0FBQztRQUVILCtCQUErQjtRQUMvQixTQUFTLENBQUMsR0FBRyxDQUFDLG9CQUFv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QUUsSUFBWTtRQUMxQyxPQUFPO1lBQ0wsSUFBSTtZQUNKLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTyxJQUFJLGVBQWU7WUFDekMsU0FBUyxFQUFFLEtBQUssQ0FBQyxTQUFTO1lBQzFCLFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVTtZQUM1QixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUU7U0FDdEIsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQWhaRCxrREFnWkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENsYXVkZSBTb25uZXQgMy43IHNlcnZpY2Ugd3JhcHBlclxuICogXG4gKiBUaGlzIHNlcnZpY2UgcHJvdmlkZXMgYSBzcGVjaWFsaXplZCB3cmFwcGVyIGZvciB0aGUgQ2xhdWRlIFNvbm5ldCAzLjcgbW9kZWxcbiAqIHdpdGggcHJvbXB0IGVuZ2luZWVyaW5nIHV0aWxpdGllcyBhbmQgcmVzcG9uc2UgcGFyc2luZy5cbiAqL1xuXG5pbXBvcnQgeyBCZWRyb2NrQ2xpZW50U2VydmljZSB9IGZyb20gJy4vYmVkcm9jay1jbGllbnQnO1xuaW1wb3J0IHsgXG4gIEJlZHJvY2tNb2RlbElkLCBcbiAgQmVkcm9ja01vZGVsQ29uZmlnLCBcbiAgQmVkcm9ja1Jlc3BvbnNlLCBcbiAgQmVkcm9ja0Vycm9yIFxufSBmcm9tICcuLi8uLi9tb2RlbHMvYmVkcm9jayc7XG5cbi8qKlxuICogQ2xhdWRlIFNvbm5ldCBwcm9tcHQgdGVtcGxhdGUgdHlwZXNcbiAqL1xuZXhwb3J0IGVudW0gQ2xhdWRlUHJvbXB0VGVtcGxhdGUge1xuICBERUZBVUxUID0gJ2RlZmF1bHQnLFxuICBJTlZFU1RNRU5UX0FOQUxZU0lTID0gJ2ludmVzdG1lbnQtYW5hbHlzaXMnLFxuICBNQVJLRVRfUkVTRUFSQ0ggPSAnbWFya2V0LXJlc2VhcmNoJyxcbiAgUklTS19BU1NFU1NNRU5UID0gJ3Jpc2stYXNzZXNzbWVudCcsXG4gIENPTVBMSUFOQ0VfQ0hFQ0sgPSAnY29tcGxpYW5jZS1jaGVjaycsXG4gIElERUFfR0VORVJBVElPTiA9ICdpZGVhLWdlbmVyYXRpb24nLFxuICBEQVRBX0VYVFJBQ1RJT04gPSAnZGF0YS1leHRyYWN0aW9uJyxcbiAgRVhQTEFOQVRJT04gPSAnZXhwbGFuYXRpb24nXG59XG5cbi8qKlxuICogQ2xhdWRlIFNvbm5ldCByZXF1ZXN0IG9wdGlvbnNcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDbGF1ZGVTb25uZXRSZXF1ZXN0T3B0aW9ucyB7XG4gIHByb21wdDogc3RyaW5nO1xuICBzeXN0ZW1Qcm9tcHQ/OiBzdHJpbmc7XG4gIHRlbXBsYXRlPzogQ2xhdWRlUHJvbXB0VGVtcGxhdGU7XG4gIHRlbXBsYXRlVmFyaWFibGVzPzogUmVjb3JkPHN0cmluZywgYW55PjtcbiAgbWF4VG9rZW5zPzogbnVtYmVyO1xuICB0ZW1wZXJhdHVyZT86IG51bWJlcjtcbiAgdG9wUD86IG51bWJlcjtcbiAgc3RvcFNlcXVlbmNlcz86IHN0cmluZ1tdO1xuICBzdHJlYW1pbmc/OiBib29sZWFuO1xuICByZXF1ZXN0SWQ/OiBzdHJpbmc7XG59XG5cbi8qKlxuICogQ2xhdWRlIFNvbm5ldCByZXNwb25zZSBwYXJzZXIgb3B0aW9uc1xuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlc3BvbnNlUGFyc2VyT3B0aW9ucyB7XG4gIGV4dHJhY3RKc29uPzogYm9vbGVhbjtcbiAgZm9ybWF0VHlwZT86ICdtYXJrZG93bicgfCAnaHRtbCcgfCAndGV4dCc7XG4gIHZhbGlkYXRlU2NoZW1hPzogYW55O1xufVxuXG4vKipcbiAqIENsYXVkZSBTb25uZXQgc2VydmljZVxuICovXG5leHBvcnQgY2xhc3MgQ2xhdWRlU29ubmV0U2VydmljZSB7XG4gIHByaXZhdGUgYmVkcm9ja0NsaWVudDogQmVkcm9ja0NsaWVudFNlcnZpY2U7XG4gIHByaXZhdGUgbW9kZWxDb25maWc6IEJlZHJvY2tNb2RlbENvbmZpZztcbiAgcHJpdmF0ZSBwcm9tcHRUZW1wbGF0ZXM6IE1hcDxDbGF1ZGVQcm9tcHRUZW1wbGF0ZSwgc3RyaW5nPjtcblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IENsYXVkZSBTb25uZXQgc2VydmljZVxuICAgKiBAcGFyYW0gYmVkcm9ja0NsaWVudCBUaGUgQmVkcm9jayBjbGllbnQgc2VydmljZVxuICAgKiBAcGFyYW0gY29uZmlnIE9wdGlvbmFsIG1vZGVsIGNvbmZpZ3VyYXRpb24gb3ZlcnJpZGVzXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBiZWRyb2NrQ2xpZW50OiBCZWRyb2NrQ2xpZW50U2VydmljZSxcbiAgICBjb25maWc/OiBQYXJ0aWFsPEJlZHJvY2tNb2RlbENvbmZpZz5cbiAgKSB7XG4gICAgdGhpcy5iZWRyb2NrQ2xpZW50ID0gYmVkcm9ja0NsaWVudDtcbiAgICBcbiAgICAvLyBHZXQgdGhlIGRlZmF1bHQgbW9kZWwgY29uZmlndXJhdGlvbiBhbmQgYXBwbHkgYW55IG92ZXJyaWRlc1xuICAgIHRoaXMubW9kZWxDb25maWcgPSB7XG4gICAgICAuLi5iZWRyb2NrQ2xpZW50LmdldE1vZGVsQ29uZmlnKEJlZHJvY2tNb2RlbElkLkNMQVVERV9TT05ORVRfM183KSxcbiAgICAgIC4uLmNvbmZpZ1xuICAgIH07XG4gICAgXG4gICAgLy8gSW5pdGlhbGl6ZSBwcm9tcHQgdGVtcGxhdGVzXG4gICAgdGhpcy5wcm9tcHRUZW1wbGF0ZXMgPSB0aGlzLmluaXRpYWxpemVQcm9tcHRUZW1wbGF0ZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHByb21wdCB0ZW1wbGF0ZXMgZm9yIGRpZmZlcmVudCB1c2UgY2FzZXNcbiAgICogQHJldHVybnMgTWFwIG9mIHByb21wdCB0ZW1wbGF0ZXNcbiAgICovXG4gIHByaXZhdGUgaW5pdGlhbGl6ZVByb21wdFRlbXBsYXRlcygpOiBNYXA8Q2xhdWRlUHJvbXB0VGVtcGxhdGUsIHN0cmluZz4ge1xuICAgIGNvbnN0IHRlbXBsYXRlcyA9IG5ldyBNYXA8Q2xhdWRlUHJvbXB0VGVtcGxhdGUsIHN0cmluZz4oKTtcbiAgICBcbiAgICAvLyBEZWZhdWx0IHRlbXBsYXRlXG4gICAgdGVtcGxhdGVzLnNldChDbGF1ZGVQcm9tcHRUZW1wbGF0ZS5ERUZBVUxULCBgXG4gICAgICB7e3Byb21wdH19XG4gICAgYCk7XG4gICAgXG4gICAgLy8gSW52ZXN0bWVudCBhbmFseXNpcyB0ZW1wbGF0ZVxuICAgIHRlbXBsYXRlcy5zZXQoQ2xhdWRlUHJvbXB0VGVtcGxhdGUuSU5WRVNUTUVOVF9BTkFMWVNJUywgYFxuICAgICAgIyBJbnZlc3RtZW50IEFuYWx5c2lzIFJlcXVlc3RcbiAgICAgIFxuICAgICAgIyMgQ29udGV4dFxuICAgICAge3tjb250ZXh0fX1cbiAgICAgIFxuICAgICAgIyMgSW52ZXN0bWVudCBEZXRhaWxzXG4gICAgICB7e2ludmVzdG1lbnREZXRhaWxzfX1cbiAgICAgIFxuICAgICAgIyMgQW5hbHlzaXMgUmVxdWlyZW1lbnRzXG4gICAgICB7e2FuYWx5c2lzUmVxdWlyZW1lbnRzfX1cbiAgICAgIFxuICAgICAgIyMgUXVlc3Rpb25zXG4gICAgICB7e3F1ZXN0aW9uc319XG4gICAgYCk7XG4gICAgXG4gICAgLy8gTWFya2V0IHJlc2VhcmNoIHRlbXBsYXRlXG4gICAgdGVtcGxhdGVzLnNldChDbGF1ZGVQcm9tcHRUZW1wbGF0ZS5NQVJLRVRfUkVTRUFSQ0gsIGBcbiAgICAgICMgTWFya2V0IFJlc2VhcmNoIFJlcXVlc3RcbiAgICAgIFxuICAgICAgIyMgUmVzZWFyY2ggVG9waWNcbiAgICAgIHt7dG9waWN9fVxuICAgICAgXG4gICAgICAjIyBTcGVjaWZpYyBRdWVzdGlvbnNcbiAgICAgIHt7cXVlc3Rpb25zfX1cbiAgICAgIFxuICAgICAgIyMgRGF0YSBTb3VyY2VzIHRvIENvbnNpZGVyXG4gICAgICB7e2RhdGFTb3VyY2VzfX1cbiAgICAgIFxuICAgICAgIyMgT3V0cHV0IEZvcm1hdFxuICAgICAge3tvdXRwdXRGb3JtYXR9fVxuICAgIGApO1xuICAgIFxuICAgIC8vIFJpc2sgYXNzZXNzbWVudCB0ZW1wbGF0ZVxuICAgIHRlbXBsYXRlcy5zZXQoQ2xhdWRlUHJvbXB0VGVtcGxhdGUuUklTS19BU1NFU1NNRU5ULCBgXG4gICAgICAjIFJpc2sgQXNzZXNzbWVudCBSZXF1ZXN0XG4gICAgICBcbiAgICAgICMjIEludmVzdG1lbnQgb3IgU3RyYXRlZ3lcbiAgICAgIHt7aW52ZXN0bWVudH19XG4gICAgICBcbiAgICAgICMjIFJpc2sgRmFjdG9ycyB0byBDb25zaWRlclxuICAgICAge3tyaXNrRmFjdG9yc319XG4gICAgICBcbiAgICAgICMjIFJpc2sgTWV0cmljcyBSZXF1aXJlZFxuICAgICAge3tyaXNrTWV0cmljc319XG4gICAgICBcbiAgICAgICMjIFRpbWUgSG9yaXpvblxuICAgICAge3t0aW1lSG9yaXpvbn19XG4gICAgYCk7XG4gICAgXG4gICAgLy8gQ29tcGxpYW5jZSBjaGVjayB0ZW1wbGF0ZVxuICAgIHRlbXBsYXRlcy5zZXQoQ2xhdWRlUHJvbXB0VGVtcGxhdGUuQ09NUExJQU5DRV9DSEVDSywgYFxuICAgICAgIyBDb21wbGlhbmNlIENoZWNrIFJlcXVlc3RcbiAgICAgIFxuICAgICAgIyMgSW52ZXN0bWVudCBvciBTdHJhdGVneVxuICAgICAge3tpbnZlc3RtZW50fX1cbiAgICAgIFxuICAgICAgIyMgUmVndWxhdG9yeSBGcmFtZXdvcmtcbiAgICAgIHt7cmVndWxhdGlvbnN9fVxuICAgICAgXG4gICAgICAjIyBDb21wbGlhbmNlIFJlcXVpcmVtZW50c1xuICAgICAge3tyZXF1aXJlbWVudHN9fVxuICAgICAgXG4gICAgICAjIyBTcGVjaWZpYyBDb25jZXJuc1xuICAgICAge3tjb25jZXJuc319XG4gICAgYCk7XG4gICAgXG4gICAgLy8gSWRlYSBnZW5lcmF0aW9uIHRlbXBsYXRlXG4gICAgdGVtcGxhdGVzLnNldChDbGF1ZGVQcm9tcHRUZW1wbGF0ZS5JREVBX0dFTkVSQVRJT04sIGBcbiAgICAgICMgSW52ZXN0bWVudCBJZGVhIEdlbmVyYXRpb24gUmVxdWVzdFxuICAgICAgXG4gICAgICAjIyBJbnZlc3RtZW50IFBhcmFtZXRlcnNcbiAgICAgIHt7cGFyYW1ldGVyc319XG4gICAgICBcbiAgICAgICMjIE1hcmtldCBDb250ZXh0XG4gICAgICB7e21hcmtldENvbnRleHR9fVxuICAgICAgXG4gICAgICAjIyBVc2VyIFByZWZlcmVuY2VzXG4gICAgICB7e3ByZWZlcmVuY2VzfX1cbiAgICAgIFxuICAgICAgIyMgQ29uc3RyYWludHNcbiAgICAgIHt7Y29uc3RyYWludHN9fVxuICAgIGApO1xuICAgIFxuICAgIC8vIERhdGEgZXh0cmFjdGlvbiB0ZW1wbGF0ZVxuICAgIHRlbXBsYXRlcy5zZXQoQ2xhdWRlUHJvbXB0VGVtcGxhdGUuREFUQV9FWFRSQUNUSU9OLCBgXG4gICAgICAjIERhdGEgRXh0cmFjdGlvbiBSZXF1ZXN0XG4gICAgICBcbiAgICAgICMjIERvY3VtZW50IG9yIERhdGEgU291cmNlXG4gICAgICB7e3NvdXJjZX19XG4gICAgICBcbiAgICAgICMjIEV4dHJhY3Rpb24gUmVxdWlyZW1lbnRzXG4gICAgICB7e3JlcXVpcmVtZW50c319XG4gICAgICBcbiAgICAgICMjIE91dHB1dCBGb3JtYXRcbiAgICAgIHt7b3V0cHV0Rm9ybWF0fX1cbiAgICBgKTtcbiAgICBcbiAgICAvLyBFeHBsYW5hdGlvbiB0ZW1wbGF0ZVxuICAgIHRlbXBsYXRlcy5zZXQoQ2xhdWRlUHJvbXB0VGVtcGxhdGUuRVhQTEFOQVRJT04sIGBcbiAgICAgICMgRXhwbGFuYXRpb24gUmVxdWVzdFxuICAgICAgXG4gICAgICAjIyBUb3BpYyB0byBFeHBsYWluXG4gICAgICB7e3RvcGljfX1cbiAgICAgIFxuICAgICAgIyMgVGFyZ2V0IEF1ZGllbmNlXG4gICAgICB7e2F1ZGllbmNlfX1cbiAgICAgIFxuICAgICAgIyMgQ29tcGxleGl0eSBMZXZlbFxuICAgICAge3tjb21wbGV4aXR5fX1cbiAgICAgIFxuICAgICAgIyMgUmVxdWlyZWQgRWxlbWVudHNcbiAgICAgIHt7ZWxlbWVudHN9fVxuICAgIGApO1xuICAgIFxuICAgIHJldHVybiB0ZW1wbGF0ZXM7XG4gIH1cblxuICAvKipcbiAgICogQXBwbHkgYSBwcm9tcHQgdGVtcGxhdGVcbiAgICogQHBhcmFtIHRlbXBsYXRlIFRoZSB0ZW1wbGF0ZSB0byBhcHBseVxuICAgKiBAcGFyYW0gdmFyaWFibGVzIFRoZSB2YXJpYWJsZXMgdG8gc3Vic3RpdHV0ZVxuICAgKiBAcmV0dXJucyBUaGUgZm9ybWF0dGVkIHByb21wdFxuICAgKi9cbiAgcHJpdmF0ZSBhcHBseVRlbXBsYXRlKHRlbXBsYXRlOiBzdHJpbmcsIHZhcmlhYmxlczogUmVjb3JkPHN0cmluZywgYW55Pik6IHN0cmluZyB7XG4gICAgbGV0IHJlc3VsdCA9IHRlbXBsYXRlO1xuICAgIFxuICAgIC8vIFJlcGxhY2UgYWxsIHZhcmlhYmxlcyBpbiB0aGUgdGVtcGxhdGVcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyh2YXJpYWJsZXMpKSB7XG4gICAgICBjb25zdCBwbGFjZWhvbGRlciA9IG5ldyBSZWdFeHAoYHt7JHtrZXl9fX1gLCAnZycpO1xuICAgICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UocGxhY2Vob2xkZXIsIHZhbHVlKTtcbiAgICB9XG4gICAgXG4gICAgLy8gUmVtb3ZlIGFueSByZW1haW5pbmcgcGxhY2Vob2xkZXJzXG4gICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoL3t7W159XSt9fS9nLCAnJyk7XG4gICAgXG4gICAgLy8gQ2xlYW4gdXAgdGhlIHJlc3VsdCBieSByZW1vdmluZyBleHRyYSB3aGl0ZXNwYWNlXG4gICAgcmVzdWx0ID0gcmVzdWx0LnRyaW0oKVxuICAgICAgLnNwbGl0KCdcXG4nKVxuICAgICAgLm1hcChsaW5lID0+IGxpbmUudHJpbSgpKVxuICAgICAgLmpvaW4oJ1xcbicpO1xuICAgIFxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGUgYSBzeXN0ZW0gcHJvbXB0IGZvciBDbGF1ZGUgU29ubmV0XG4gICAqIEBwYXJhbSByb2xlIFRoZSByb2xlIGZvciBDbGF1ZGUgdG8gYXNzdW1lXG4gICAqIEBwYXJhbSBjb250ZXh0IEFkZGl0aW9uYWwgY29udGV4dCBmb3IgdGhlIHJvbGVcbiAgICogQHBhcmFtIGNvbnN0cmFpbnRzIENvbnN0cmFpbnRzIGZvciBDbGF1ZGUncyByZXNwb25zZXNcbiAgICogQHJldHVybnMgVGhlIGZvcm1hdHRlZCBzeXN0ZW0gcHJvbXB0XG4gICAqL1xuICBwdWJsaWMgZ2VuZXJhdGVTeXN0ZW1Qcm9tcHQoXG4gICAgcm9sZTogc3RyaW5nLFxuICAgIGNvbnRleHQ/OiBzdHJpbmcsXG4gICAgY29uc3RyYWludHM/OiBzdHJpbmdbXVxuICApOiBzdHJpbmcge1xuICAgIGxldCBzeXN0ZW1Qcm9tcHQgPSBgWW91IGFyZSAke3JvbGV9LmA7XG4gICAgXG4gICAgaWYgKGNvbnRleHQpIHtcbiAgICAgIHN5c3RlbVByb21wdCArPSBgXFxuXFxuJHtjb250ZXh0fWA7XG4gICAgfVxuICAgIFxuICAgIGlmIChjb25zdHJhaW50cyAmJiBjb25zdHJhaW50cy5sZW5ndGggPiAwKSB7XG4gICAgICBzeXN0ZW1Qcm9tcHQgKz0gJ1xcblxcbkNvbnN0cmFpbnRzOic7XG4gICAgICBmb3IgKGNvbnN0IGNvbnN0cmFpbnQgb2YgY29uc3RyYWludHMpIHtcbiAgICAgICAgc3lzdGVtUHJvbXB0ICs9IGBcXG4tICR7Y29uc3RyYWludH1gO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gc3lzdGVtUHJvbXB0O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBsZXRlIGEgcHJvbXB0IHVzaW5nIENsYXVkZSBTb25uZXQgMy43XG4gICAqIEBwYXJhbSBvcHRpb25zIFJlcXVlc3Qgb3B0aW9uc1xuICAgKiBAcmV0dXJucyBUaGUgbW9kZWwgcmVzcG9uc2VcbiAgICovXG4gIHB1YmxpYyBhc3luYyBjb21wbGV0ZShvcHRpb25zOiBDbGF1ZGVTb25uZXRSZXF1ZXN0T3B0aW9ucyk6IFByb21pc2U8QmVkcm9ja1Jlc3BvbnNlPiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIEFwcGx5IHRlbXBsYXRlIGlmIHNwZWNpZmllZFxuICAgICAgbGV0IGZpbmFsUHJvbXB0ID0gb3B0aW9ucy5wcm9tcHQ7XG4gICAgICBpZiAob3B0aW9ucy50ZW1wbGF0ZSAmJiBvcHRpb25zLnRlbXBsYXRlVmFyaWFibGVzKSB7XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlU3RyaW5nID0gdGhpcy5wcm9tcHRUZW1wbGF0ZXMuZ2V0KG9wdGlvbnMudGVtcGxhdGUpIHx8IHRoaXMucHJvbXB0VGVtcGxhdGVzLmdldChDbGF1ZGVQcm9tcHRUZW1wbGF0ZS5ERUZBVUxUKSE7XG4gICAgICAgIGZpbmFsUHJvbXB0ID0gdGhpcy5hcHBseVRlbXBsYXRlKHRlbXBsYXRlU3RyaW5nLCB7XG4gICAgICAgICAgLi4ub3B0aW9ucy50ZW1wbGF0ZVZhcmlhYmxlcyxcbiAgICAgICAgICBwcm9tcHQ6IG9wdGlvbnMucHJvbXB0XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBDcmVhdGUgbW9kZWwgY29uZmlnIHdpdGggYW55IG92ZXJyaWRlc1xuICAgICAgY29uc3QgbW9kZWxDb25maWc6IEJlZHJvY2tNb2RlbENvbmZpZyA9IHtcbiAgICAgICAgLi4udGhpcy5tb2RlbENvbmZpZyxcbiAgICAgICAgbWF4VG9rZW5zOiBvcHRpb25zLm1heFRva2VucyB8fCB0aGlzLm1vZGVsQ29uZmlnLm1heFRva2VucyxcbiAgICAgICAgdGVtcGVyYXR1cmU6IG9wdGlvbnMudGVtcGVyYXR1cmUgfHwgdGhpcy5tb2RlbENvbmZpZy50ZW1wZXJhdHVyZSxcbiAgICAgICAgdG9wUDogb3B0aW9ucy50b3BQIHx8IHRoaXMubW9kZWxDb25maWcudG9wUCxcbiAgICAgICAgc3RvcFNlcXVlbmNlczogb3B0aW9ucy5zdG9wU2VxdWVuY2VzIHx8IHRoaXMubW9kZWxDb25maWcuc3RvcFNlcXVlbmNlc1xuICAgICAgfTtcbiAgICAgIFxuICAgICAgLy8gSW52b2tlIHRoZSBtb2RlbFxuICAgICAgaWYgKG9wdGlvbnMuc3RyZWFtaW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0cmVhbUNvbXBsZXRlKGZpbmFsUHJvbXB0LCBvcHRpb25zLnN5c3RlbVByb21wdCwgbW9kZWxDb25maWcsIG9wdGlvbnMucmVxdWVzdElkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmJlZHJvY2tDbGllbnQuaW52b2tlTW9kZWwoe1xuICAgICAgICAgIG1vZGVsQ29uZmlnLFxuICAgICAgICAgIHByb21wdDogZmluYWxQcm9tcHQsXG4gICAgICAgICAgc3lzdGVtUHJvbXB0OiBvcHRpb25zLnN5c3RlbVByb21wdCxcbiAgICAgICAgICByZXF1ZXN0SWQ6IG9wdGlvbnMucmVxdWVzdElkXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBjb21wbGV0aW5nIHByb21wdCB3aXRoIENsYXVkZSBTb25uZXQ6JywgZXJyb3IpO1xuICAgICAgdGhyb3cgdGhpcy5mb3JtYXRFcnJvcihlcnJvciwgJ0NMQVVERV9TT05ORVRfQ09NUExFVElPTl9FUlJPUicpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wbGV0ZSBhIHByb21wdCB1c2luZyBDbGF1ZGUgU29ubmV0IDMuNyB3aXRoIHN0cmVhbWluZ1xuICAgKiBAcGFyYW0gcHJvbXB0IFRoZSBwcm9tcHQgdG8gY29tcGxldGVcbiAgICogQHBhcmFtIHN5c3RlbVByb21wdCBPcHRpb25hbCBzeXN0ZW0gcHJvbXB0XG4gICAqIEBwYXJhbSBtb2RlbENvbmZpZyBNb2RlbCBjb25maWd1cmF0aW9uXG4gICAqIEBwYXJhbSByZXF1ZXN0SWQgT3B0aW9uYWwgcmVxdWVzdCBJRFxuICAgKiBAcmV0dXJucyBUaGUgZmluYWwgbW9kZWwgcmVzcG9uc2VcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgc3RyZWFtQ29tcGxldGUoXG4gICAgcHJvbXB0OiBzdHJpbmcsXG4gICAgc3lzdGVtUHJvbXB0Pzogc3RyaW5nLFxuICAgIG1vZGVsQ29uZmlnPzogQmVkcm9ja01vZGVsQ29uZmlnLFxuICAgIHJlcXVlc3RJZD86IHN0cmluZ1xuICApOiBQcm9taXNlPEJlZHJvY2tSZXNwb25zZT4ge1xuICAgIGNvbnN0IGNvbmZpZyA9IG1vZGVsQ29uZmlnIHx8IHRoaXMubW9kZWxDb25maWc7XG4gICAgbGV0IGZ1bGxSZXNwb25zZSA9ICcnO1xuICAgIGxldCBmaW5hbFJlc3BvbnNlOiBQYXJ0aWFsPEJlZHJvY2tSZXNwb25zZT4gPSB7fTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgLy8gVHJhY2sgdGhlIGxhc3QgY2h1bmsgdG8gYXZvaWQgZHVwbGljYXRpbmcgY29udGVudCBpbiB0aGUgZmluYWwgcmVzcG9uc2VcbiAgICAgIGxldCBsYXN0Q2h1bmsgPSAnJztcbiAgICAgIFxuICAgICAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiB0aGlzLmJlZHJvY2tDbGllbnQuaW52b2tlTW9kZWxXaXRoU3RyZWFtaW5nKHtcbiAgICAgICAgbW9kZWxDb25maWc6IGNvbmZpZyxcbiAgICAgICAgcHJvbXB0LFxuICAgICAgICBzeXN0ZW1Qcm9tcHQsXG4gICAgICAgIHJlcXVlc3RJZFxuICAgICAgfSkpIHtcbiAgICAgICAgaWYgKGNodW5rLmNvbXBsZXRpb24pIHtcbiAgICAgICAgICAvLyBJZiB0aGlzIGlzIHRoZSBmaW5hbCBjaHVuayB3aXRoIHRoZSBjb21wbGV0ZSByZXNwb25zZSwgZG9uJ3QgYXBwZW5kIGl0XG4gICAgICAgICAgLy8gYXMgaXQgd291bGQgZHVwbGljYXRlIHRoZSBjb250ZW50XG4gICAgICAgICAgaWYgKGNodW5rLmZpbmlzaFJlYXNvbikge1xuICAgICAgICAgICAgZmluYWxSZXNwb25zZSA9IGNodW5rO1xuICAgICAgICAgICAgLy8gVGhlIGxhc3QgY2h1bmsgaXMgdGhlIGNvbXBsZXRlIHJlc3BvbnNlLCBzbyB1c2UgaXQgZGlyZWN0bHlcbiAgICAgICAgICAgIGZ1bGxSZXNwb25zZSA9IGNodW5rLmNvbXBsZXRpb247XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEZvciBpbnRlcm1lZGlhdGUgY2h1bmtzLCBhcHBlbmQgdG8gdGhlIGZ1bGwgcmVzcG9uc2VcbiAgICAgICAgICAgIGxhc3RDaHVuayA9IGNodW5rLmNvbXBsZXRpb247XG4gICAgICAgICAgICBmdWxsUmVzcG9uc2UgKz0gY2h1bmsuY29tcGxldGlvbjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gUmV0dXJuIHRoZSBjb21wbGV0ZSByZXNwb25zZVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29tcGxldGlvbjogZnVsbFJlc3BvbnNlLFxuICAgICAgICBtb2RlbElkOiBjb25maWcubW9kZWxJZCxcbiAgICAgICAgdXNhZ2U6IGZpbmFsUmVzcG9uc2UudXNhZ2UgfHwge1xuICAgICAgICAgIGlucHV0VG9rZW5zOiAtMSxcbiAgICAgICAgICBvdXRwdXRUb2tlbnM6IC0xLFxuICAgICAgICAgIHRvdGFsVG9rZW5zOiAtMVxuICAgICAgICB9LFxuICAgICAgICByZXF1ZXN0SWQ6IHJlcXVlc3RJZCB8fCAndW5rbm93bicsXG4gICAgICAgIGZpbmlzaFJlYXNvbjogZmluYWxSZXNwb25zZS5maW5pc2hSZWFzb24gfHwgJ3Vua25vd24nXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBzdHJlYW1pbmcgY29tcGxldGlvbiB3aXRoIENsYXVkZSBTb25uZXQ6JywgZXJyb3IpO1xuICAgICAgdGhyb3cgdGhpcy5mb3JtYXRFcnJvcihlcnJvciwgJ0NMQVVERV9TT05ORVRfU1RSRUFNSU5HX0VSUk9SJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIGEgcmVzcG9uc2UgZnJvbSBDbGF1ZGUgU29ubmV0XG4gICAqIEBwYXJhbSByZXNwb25zZSBUaGUgcmVzcG9uc2UgdG8gcGFyc2VcbiAgICogQHBhcmFtIG9wdGlvbnMgUGFyc2luZyBvcHRpb25zXG4gICAqIEByZXR1cm5zIFRoZSBwYXJzZWQgcmVzcG9uc2VcbiAgICovXG4gIHB1YmxpYyBwYXJzZVJlc3BvbnNlKHJlc3BvbnNlOiBCZWRyb2NrUmVzcG9uc2UsIG9wdGlvbnM/OiBSZXNwb25zZVBhcnNlck9wdGlvbnMpOiBhbnkge1xuICAgIGNvbnN0IHsgY29tcGxldGlvbiB9ID0gcmVzcG9uc2U7XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIC8vIEV4dHJhY3QgSlNPTiBpZiByZXF1ZXN0ZWRcbiAgICAgIGlmIChvcHRpb25zPy5leHRyYWN0SnNvbikge1xuICAgICAgICBjb25zdCBqc29uTWF0Y2ggPSBjb21wbGV0aW9uLm1hdGNoKC9gYGAoPzpqc29uKT9cXHMqKFtcXHNcXFNdKj8pXFxzKmBgYC8pO1xuICAgICAgICBpZiAoanNvbk1hdGNoICYmIGpzb25NYXRjaFsxXSkge1xuICAgICAgICAgIGNvbnN0IGpzb25TdHIgPSBqc29uTWF0Y2hbMV0udHJpbSgpO1xuICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoanNvblN0cik7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gVmFsaWRhdGUgYWdhaW5zdCBzY2hlbWEgaWYgcHJvdmlkZWRcbiAgICAgICAgICBpZiAob3B0aW9ucy52YWxpZGF0ZVNjaGVtYSkge1xuICAgICAgICAgICAgLy8gU2NoZW1hIHZhbGlkYXRpb24gd291bGQgYmUgaW1wbGVtZW50ZWQgaGVyZVxuICAgICAgICAgICAgLy8gRm9yIG5vdywgd2UnbGwganVzdCByZXR1cm4gdGhlIHBhcnNlZCBKU09OXG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIHJldHVybiBwYXJzZWQ7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIFRyeSB0byBmaW5kIEpTT04gd2l0aG91dCBjb2RlIGJsb2Nrc1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKGNvbXBsZXRpb24pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgLy8gTm90IHZhbGlkIEpTT04sIGNvbnRpbnVlIHdpdGggb3RoZXIgcGFyc2luZyBvcHRpb25zXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gRm9ybWF0IHRoZSByZXNwb25zZSBpZiByZXF1ZXN0ZWRcbiAgICAgIGlmIChvcHRpb25zPy5mb3JtYXRUeXBlKSB7XG4gICAgICAgIHN3aXRjaCAob3B0aW9ucy5mb3JtYXRUeXBlKSB7XG4gICAgICAgICAgY2FzZSAnbWFya2Rvd24nOlxuICAgICAgICAgICAgLy8gUmV0dXJuIGFzLWlzLCBhc3N1bWluZyBDbGF1ZGUgYWxyZWFkeSBvdXRwdXRzIG1hcmtkb3duXG4gICAgICAgICAgICByZXR1cm4gY29tcGxldGlvbjtcbiAgICAgICAgICBjYXNlICdodG1sJzpcbiAgICAgICAgICAgIC8vIENvbnZlcnQgbWFya2Rvd24gdG8gSFRNTCAoc2ltcGxpZmllZClcbiAgICAgICAgICAgIHJldHVybiBjb21wbGV0aW9uXG4gICAgICAgICAgICAgIC5yZXBsYWNlKC8jezEsNn0gKC4rKS9nLCAobWF0Y2gsIHAxLCBvZmZzZXQsIHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxldmVsID0gbWF0Y2gudHJpbSgpLmluZGV4T2YoJyAnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYDxoJHtsZXZlbH0+JHtwMX08L2gke2xldmVsfT5gO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAucmVwbGFjZSgvXFwqXFwqKC4rPylcXCpcXCovZywgJzxzdHJvbmc+JDE8L3N0cm9uZz4nKVxuICAgICAgICAgICAgICAucmVwbGFjZSgvXFwqKC4rPylcXCovZywgJzxlbT4kMTwvZW0+JylcbiAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcblxcbi9nLCAnPGJyPjxicj4nKTtcbiAgICAgICAgICBjYXNlICd0ZXh0JzpcbiAgICAgICAgICAgIC8vIFN0cmlwIG1hcmtkb3duIGZvcm1hdHRpbmcgKHNpbXBsaWZpZWQpXG4gICAgICAgICAgICByZXR1cm4gY29tcGxldGlvblxuICAgICAgICAgICAgICAucmVwbGFjZSgvI3sxLDZ9IC9nLCAnJylcbiAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcKlxcKiguKz8pXFwqXFwqL2csICckMScpXG4gICAgICAgICAgICAgIC5yZXBsYWNlKC9cXCooLis/KVxcKi9nLCAnJDEnKTtcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIGNvbXBsZXRpb247XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gRGVmYXVsdDogcmV0dXJuIHRoZSByYXcgY29tcGxldGlvblxuICAgICAgcmV0dXJuIGNvbXBsZXRpb247XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHBhcnNpbmcgQ2xhdWRlIFNvbm5ldCByZXNwb25zZTonLCBlcnJvcik7XG4gICAgICB0aHJvdyB0aGlzLmZvcm1hdEVycm9yKGVycm9yLCAnQ0xBVURFX1NPTk5FVF9QQVJTSU5HX0VSUk9SJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEZvcm1hdCBhbiBlcnJvclxuICAgKiBAcGFyYW0gZXJyb3IgVGhlIGVycm9yXG4gICAqIEBwYXJhbSBjb2RlIFRoZSBlcnJvciBjb2RlXG4gICAqIEByZXR1cm5zIFRoZSBmb3JtYXR0ZWQgZXJyb3JcbiAgICovXG4gIHByaXZhdGUgZm9ybWF0RXJyb3IoZXJyb3I6IGFueSwgY29kZTogc3RyaW5nKTogQmVkcm9ja0Vycm9yIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29kZSxcbiAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UgfHwgJ1Vua25vd24gZXJyb3InLFxuICAgICAgcmVxdWVzdElkOiBlcnJvci5yZXF1ZXN0SWQsXG4gICAgICBzdGF0dXNDb2RlOiBlcnJvci5zdGF0dXNDb2RlLFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpXG4gICAgfTtcbiAgfVxufSJdfQ==