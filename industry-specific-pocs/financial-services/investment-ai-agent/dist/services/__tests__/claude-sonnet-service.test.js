"use strict";
/**
 * Tests for the Claude Sonnet service
 */
Object.defineProperty(exports, "__esModule", { value: true });
const bedrock_client_1 = require("../ai/bedrock-client");
const claude_sonnet_service_1 = require("../ai/claude-sonnet-service");
const bedrock_1 = require("../../models/bedrock");
// Mock the Bedrock client
jest.mock('../ai/bedrock-client');
describe('ClaudeSonnetService', () => {
    let bedrockClient;
    let claudeSonnetService;
    beforeEach(() => {
        // Create a mock Bedrock client
        bedrockClient = new bedrock_client_1.BedrockClientService();
        // Mock the getModelConfig method
        bedrockClient.getModelConfig = jest.fn().mockReturnValue({
            modelId: bedrock_1.BedrockModelId.CLAUDE_SONNET_3_7,
            maxTokens: 4096,
            temperature: 0.7,
            topP: 0.9
        });
        // Mock the invokeModel method
        bedrockClient.invokeModel = jest.fn().mockResolvedValue({
            completion: 'This is a test response',
            modelId: bedrock_1.BedrockModelId.CLAUDE_SONNET_3_7,
            usage: {
                inputTokens: 10,
                outputTokens: 5,
                totalTokens: 15
            },
            requestId: 'test-request-id',
            finishReason: 'stop'
        });
        // Mock the invokeModelWithStreaming method
        bedrockClient.invokeModelWithStreaming = jest.fn().mockImplementation(async function* () {
            yield {
                completion: 'This ',
                modelId: bedrock_1.BedrockModelId.CLAUDE_SONNET_3_7,
                requestId: 'test-request-id'
            };
            yield {
                completion: 'is ',
                modelId: bedrock_1.BedrockModelId.CLAUDE_SONNET_3_7,
                requestId: 'test-request-id'
            };
            yield {
                completion: 'a ',
                modelId: bedrock_1.BedrockModelId.CLAUDE_SONNET_3_7,
                requestId: 'test-request-id'
            };
            yield {
                completion: 'test',
                modelId: bedrock_1.BedrockModelId.CLAUDE_SONNET_3_7,
                requestId: 'test-request-id'
            };
            yield {
                completion: 'This is a test',
                modelId: bedrock_1.BedrockModelId.CLAUDE_SONNET_3_7,
                requestId: 'test-request-id',
                finishReason: 'stop',
                usage: {
                    inputTokens: 10,
                    outputTokens: 5,
                    totalTokens: 15
                }
            };
        });
        // Create the Claude Sonnet service
        claudeSonnetService = new claude_sonnet_service_1.ClaudeSonnetService(bedrockClient);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('generateSystemPrompt', () => {
        it('should generate a basic system prompt with just a role', () => {
            const systemPrompt = claudeSonnetService.generateSystemPrompt('an investment advisor');
            expect(systemPrompt).toBe('You are an investment advisor.');
        });
        it('should generate a system prompt with role and context', () => {
            const systemPrompt = claudeSonnetService.generateSystemPrompt('an investment advisor', 'You specialize in technology stocks and have 10 years of experience.');
            expect(systemPrompt).toContain('You are an investment advisor.');
            expect(systemPrompt).toContain('You specialize in technology stocks and have 10 years of experience.');
        });
        it('should generate a system prompt with role, context, and constraints', () => {
            const systemPrompt = claudeSonnetService.generateSystemPrompt('an investment advisor', 'You specialize in technology stocks.', [
                'Always cite your sources',
                'Provide balanced perspectives',
                'Highlight risks clearly'
            ]);
            expect(systemPrompt).toContain('You are an investment advisor.');
            expect(systemPrompt).toContain('You specialize in technology stocks.');
            expect(systemPrompt).toContain('Constraints:');
            expect(systemPrompt).toContain('- Always cite your sources');
            expect(systemPrompt).toContain('- Provide balanced perspectives');
            expect(systemPrompt).toContain('- Highlight risks clearly');
        });
    });
    describe('complete', () => {
        it('should complete a prompt using the default template', async () => {
            const response = await claudeSonnetService.complete({
                prompt: 'What are the best tech stocks to invest in?'
            });
            expect(bedrockClient.invokeModel).toHaveBeenCalledWith({
                modelConfig: expect.objectContaining({
                    modelId: bedrock_1.BedrockModelId.CLAUDE_SONNET_3_7
                }),
                prompt: 'What are the best tech stocks to invest in?',
                systemPrompt: undefined,
                requestId: undefined
            });
            expect(response.completion).toBe('This is a test response');
        });
        it('should complete a prompt using a specific template', async () => {
            const response = await claudeSonnetService.complete({
                prompt: 'Tech stocks analysis',
                template: claude_sonnet_service_1.ClaudePromptTemplate.INVESTMENT_ANALYSIS,
                templateVariables: {
                    context: 'Current market conditions show tech sector volatility.',
                    investmentDetails: 'Looking at FAANG stocks.',
                    analysisRequirements: 'Need fundamental and technical analysis.',
                    questions: 'Which tech stock has the best growth potential?'
                }
            });
            expect(bedrockClient.invokeModel).toHaveBeenCalled();
            const callArgs = bedrockClient.invokeModel.mock.calls[0][0];
            expect(callArgs.prompt).toContain('# Investment Analysis Request');
            expect(callArgs.prompt).toContain('Current market conditions show tech sector volatility.');
            expect(callArgs.prompt).toContain('Looking at FAANG stocks.');
            expect(callArgs.prompt).toContain('Need fundamental and technical analysis.');
            expect(callArgs.prompt).toContain('Which tech stock has the best growth potential?');
            expect(response.completion).toBe('This is a test response');
        });
        it('should complete a prompt with a system prompt', async () => {
            const response = await claudeSonnetService.complete({
                prompt: 'What are the best tech stocks to invest in?',
                systemPrompt: 'You are a financial advisor specializing in technology investments.'
            });
            expect(bedrockClient.invokeModel).toHaveBeenCalledWith({
                modelConfig: expect.objectContaining({
                    modelId: bedrock_1.BedrockModelId.CLAUDE_SONNET_3_7
                }),
                prompt: 'What are the best tech stocks to invest in?',
                systemPrompt: 'You are a financial advisor specializing in technology investments.',
                requestId: undefined
            });
            expect(response.completion).toBe('This is a test response');
        });
        it('should complete a prompt with custom model parameters', async () => {
            const response = await claudeSonnetService.complete({
                prompt: 'What are the best tech stocks to invest in?',
                maxTokens: 2000,
                temperature: 0.5,
                topP: 0.8,
                stopSequences: ['END']
            });
            expect(bedrockClient.invokeModel).toHaveBeenCalledWith({
                modelConfig: expect.objectContaining({
                    modelId: bedrock_1.BedrockModelId.CLAUDE_SONNET_3_7,
                    maxTokens: 2000,
                    temperature: 0.5,
                    topP: 0.8,
                    stopSequences: ['END']
                }),
                prompt: 'What are the best tech stocks to invest in?',
                systemPrompt: undefined,
                requestId: undefined
            });
            expect(response.completion).toBe('This is a test response');
        });
        it('should complete a prompt with streaming', async () => {
            const response = await claudeSonnetService.complete({
                prompt: 'What are the best tech stocks to invest in?',
                streaming: true
            });
            expect(bedrockClient.invokeModelWithStreaming).toHaveBeenCalled();
            expect(response.completion).toBe('This is a test');
        });
    });
    describe('parseResponse', () => {
        it('should return the raw completion by default', () => {
            const response = {
                completion: 'This is a test response',
                modelId: bedrock_1.BedrockModelId.CLAUDE_SONNET_3_7,
                usage: {
                    inputTokens: 10,
                    outputTokens: 5,
                    totalTokens: 15
                },
                requestId: 'test-request-id',
                finishReason: 'stop'
            };
            const parsed = claudeSonnetService.parseResponse(response);
            expect(parsed).toBe('This is a test response');
        });
        it('should extract JSON from code blocks', () => {
            const response = {
                completion: 'Here is the analysis:\n\n```json\n{"stock": "AAPL", "recommendation": "buy", "targetPrice": 200}\n```',
                modelId: bedrock_1.BedrockModelId.CLAUDE_SONNET_3_7,
                usage: {
                    inputTokens: 10,
                    outputTokens: 5,
                    totalTokens: 15
                },
                requestId: 'test-request-id',
                finishReason: 'stop'
            };
            const parsed = claudeSonnetService.parseResponse(response, { extractJson: true });
            expect(parsed).toEqual({
                stock: 'AAPL',
                recommendation: 'buy',
                targetPrice: 200
            });
        });
        it('should format response as HTML', () => {
            const response = {
                completion: '# Analysis\n\nThis is a **bold** statement with *emphasis*.\n\nNew paragraph.',
                modelId: bedrock_1.BedrockModelId.CLAUDE_SONNET_3_7,
                usage: {
                    inputTokens: 10,
                    outputTokens: 5,
                    totalTokens: 15
                },
                requestId: 'test-request-id',
                finishReason: 'stop'
            };
            const parsed = claudeSonnetService.parseResponse(response, { formatType: 'html' });
            expect(parsed).toContain('<h1>Analysis</h1>');
            expect(parsed).toContain('<strong>bold</strong>');
            expect(parsed).toContain('<em>emphasis</em>');
            expect(parsed).toContain('<br><br>');
        });
        it('should format response as plain text', () => {
            const response = {
                completion: '# Analysis\n\nThis is a **bold** statement with *emphasis*.',
                modelId: bedrock_1.BedrockModelId.CLAUDE_SONNET_3_7,
                usage: {
                    inputTokens: 10,
                    outputTokens: 5,
                    totalTokens: 15
                },
                requestId: 'test-request-id',
                finishReason: 'stop'
            };
            const parsed = claudeSonnetService.parseResponse(response, { formatType: 'text' });
            expect(parsed).not.toContain('#');
            expect(parsed).not.toContain('**');
            expect(parsed).not.toContain('*');
            expect(parsed).toContain('Analysis');
            expect(parsed).toContain('This is a bold statement with emphasis.');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhdWRlLXNvbm5ldC1zZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2VydmljZXMvX190ZXN0c19fL2NsYXVkZS1zb25uZXQtc2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCx5REFBNEQ7QUFDNUQsdUVBQXdGO0FBQ3hGLGtEQUFzRDtBQUV0RCwwQkFBMEI7QUFDMUIsSUFBSSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0FBRWxDLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7SUFDbkMsSUFBSSxhQUFnRCxDQUFDO0lBQ3JELElBQUksbUJBQXdDLENBQUM7SUFFN0MsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUNkLCtCQUErQjtRQUMvQixhQUFhLEdBQUcsSUFBSSxxQ0FBb0IsRUFBdUMsQ0FBQztRQUVoRixpQ0FBaUM7UUFDakMsYUFBYSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsZUFBZSxDQUFDO1lBQ3ZELE9BQU8sRUFBRSx3QkFBYyxDQUFDLGlCQUFpQjtZQUN6QyxTQUFTLEVBQUUsSUFBSTtZQUNmLFdBQVcsRUFBRSxHQUFHO1lBQ2hCLElBQUksRUFBRSxHQUFHO1NBQ1YsQ0FBQyxDQUFDO1FBRUgsOEJBQThCO1FBQzlCLGFBQWEsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDO1lBQ3RELFVBQVUsRUFBRSx5QkFBeUI7WUFDckMsT0FBTyxFQUFFLHdCQUFjLENBQUMsaUJBQWlCO1lBQ3pDLEtBQUssRUFBRTtnQkFDTCxXQUFXLEVBQUUsRUFBRTtnQkFDZixZQUFZLEVBQUUsQ0FBQztnQkFDZixXQUFXLEVBQUUsRUFBRTthQUNoQjtZQUNELFNBQVMsRUFBRSxpQkFBaUI7WUFDNUIsWUFBWSxFQUFFLE1BQU07U0FDckIsQ0FBQyxDQUFDO1FBRUgs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QUssRUFBRTtvQkFDTCxXQUFXLEVBQUUsRUFBRTtvQkFDZixZQUFZLEVBQUUsQ0FBQztvQkFDZixXQUFXLEVBQUUsRUFBRTtpQkFDaEI7Z0JBQ0QsU0FBUyxFQUFFLGlCQUFpQjtnQkFDNUIsWUFBWSxFQUFFLE1BQU07YUFDckIsQ0FBQztZQUVGLE1BQU0sTUFBTSxHQUFHLG1CQUFtQixDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztZQUNuRixNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxTQUFTLENBQUMseUNBQXlDLENBQUMsQ0FBQztRQUN0RSxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRlc3RzIGZvciB0aGUgQ2xhdWRlIFNvbm5ldCBzZXJ2aWNlXG4gKi9cblxuaW1wb3J0IHsgQmVkcm9ja0NsaWVudFNlcnZpY2UgfSBmcm9tICcuLi9haS9iZWRyb2NrLWNsaWVudCc7XG5pbXBvcnQgeyBDbGF1ZGVTb25uZXRTZXJ2aWNlLCBDbGF1ZGVQcm9tcHRUZW1wbGF0ZSB9IGZyb20gJy4uL2FpL2NsYXVkZS1zb25uZXQtc2VydmljZSc7XG5pbXBvcnQgeyBCZWRyb2NrTW9kZWxJZCB9IGZyb20gJy4uLy4uL21vZGVscy9iZWRyb2NrJztcblxuLy8gTW9jayB0aGUgQmVkcm9jayBjbGllbnRcbmplc3QubW9jaygnLi4vYWkvYmVkcm9jay1jbGllbnQnKTtcblxuZGVzY3JpYmUoJ0NsYXVkZVNvbm5ldFNlcnZpY2UnLCAoKSA9PiB7XG4gIGxldCBiZWRyb2NrQ2xpZW50OiBqZXN0Lk1vY2tlZDxCZWRyb2NrQ2xpZW50U2VydmljZT47XG4gIGxldCBjbGF1ZGVTb25uZXRTZXJ2aWNlOiBDbGF1ZGVTb25uZXRTZXJ2aWNlO1xuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIC8vIENyZWF0ZSBhIG1vY2sgQmVkcm9jayBjbGllbnRcbiAgICBiZWRyb2NrQ2xpZW50ID0gbmV3IEJlZHJvY2tDbGllbnRTZXJ2aWNlKCkgYXMgamVzdC5Nb2NrZWQ8QmVkcm9ja0NsaWVudFNlcnZpY2U+O1xuICAgIFxuICAgIC8vIE1vY2sgdGhlIGdldE1vZGVsQ29uZmlnIG1ldGhvZFxuICAgIGJlZHJvY2tDbGllbnQuZ2V0TW9kZWxDb25maWcgPSBqZXN0LmZuKCkubW9ja1JldHVyblZhbHVlKHtcbiAgICAgIG1vZGVsSWQ6IEJlZHJvY2tNb2RlbElkLkNMQVVERV9TT05ORVRfM183LFxuICAgICAgbWF4VG9rZW5zOiA0MDk2LFxuICAgICAgdGVtcGVyYXR1cmU6IDAuNyxcbiAgICAgIHRvcFA6IDAuOVxuICAgIH0pO1xuICAgIFxuICAgIC8vIE1vY2sgdGhlIGludm9rZU1vZGVsIG1ldGhvZFxuICAgIGJlZHJvY2tDbGllbnQuaW52b2tlTW9kZWwgPSBqZXN0LmZuKCkubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgY29tcGxldGlvbjogJ1RoaXMgaXMgYSB0ZXN0IHJlc3BvbnNlJyxcbiAgICAgIG1vZGVsSWQ6IEJlZHJvY2tNb2RlbElkLkNMQVVERV9TT05ORVRfM183LFxuICAgICAgdXNhZ2U6IHtcbiAgICAgICAgaW5wdXRUb2tlbnM6IDEwLFxuICAgICAgICBvdXRwdXRUb2tlbnM6IDUsXG4gICAgICAgIHRvdGFsVG9rZW5zOiAxNVxuICAgICAgfSxcbiAgICAgIHJlcXVlc3RJZDogJ3Rlc3QtcmVxdWVzdC1pZCcsXG4gICAgICBmaW5pc2hSZWFzb246ICdzdG9wJ1xuICAgIH0pO1xuICAgIFxuICAgIC8vIE1vY2sgdGhlIGludm9rZU1vZGVsV2l0aFN0cmVhbWluZyBtZXRob2RcbiAgICBiZWRyb2NrQ2xpZW50Lmludm9rZU1vZGVsV2l0aFN0cmVhbWluZyA9IGplc3QuZm4oKS5tb2NrSW1wbGVtZW50YXRpb24oYXN5bmMgZnVuY3Rpb24qICgpIHtcbiAgICAgIHlpZWxkIHtcbiAgICAgICAgY29tcGxldGlvbjogJ1RoaXMgJyxcbiAgICAgICAgbW9kZWxJZDogQmVkcm9ja01vZGVsSWQuQ0xBVURFX1NPTk5FVF8zXzcsXG4gICAgICAgIHJlcXVlc3RJZDogJ3Rlc3QtcmVxdWVzdC1pZCdcbiAgICAgIH07XG4gICAgICB5aWVsZCB7XG4gICAgICAgIGNvbXBsZXRpb246ICdpcyAnLFxuICAgICAgICBtb2RlbElkOiBCZWRyb2NrTW9kZWxJZC5DTEFVREVfU09OTkVUXzNfNyxcbiAgICAgICAgcmVxdWVzdElkOiAndGVzdC1yZXF1ZXN0LWlkJ1xuICAgICAgfTtcbiAgICAgIHlpZWxkIHtcbiAgICAgICAgY29tcGxldGlvbjogJ2EgJyxcbiAgICAgICAgbW9kZWxJZDogQmVkcm9ja01vZGVsSWQuQ0xBVURFX1NPTk5FVF8zXzcsXG4gICAgICAgIHJlcXVlc3RJZDogJ3Rlc3QtcmVxdWVzdC1pZCdcbiAgICAgIH07XG4gICAgICB5aWVsZCB7XG4gICAgICAgIGNvbXBsZXRpb246ICd0ZXN0JyxcbiAgICAgICAgbW9kZWxJZDogQmVkcm9ja01vZGVsSWQuQ0xBVURFX1NPTk5FVF8zXzcsXG4gICAgICAgIHJlcXVlc3RJZDogJ3Rlc3QtcmVxdWVzdC1pZCdcbiAgICAgIH07XG4gICAgICB5aWVsZCB7XG4gICAgICAgIGNvbXBsZXRpb246ICdUaGlzIGlzIGEgdGVzdCcsXG4gICAgICAgIG1vZGVsSWQ6IEJlZHJvY2tNb2RlbElkLkNMQVVERV9TT05ORVRfM183LFxuICAgICAgICByZXF1ZXN0SWQ6ICd0ZXN0LXJlcXVlc3QtaWQnLFxuICAgICAgICBmaW5pc2hSZWFzb246ICdzdG9wJyxcbiAgICAgICAgdXNhZ2U6IHtcbiAgICAgICAgICBpbnB1dFRva2VuczogMTAsXG4gICAgICAgICAgb3V0cHV0VG9rZW5zOiA1LFxuICAgICAgICAgIHRvdGFsVG9rZW5zOiAxNVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pO1xuICAgIFxuICAgIC8vIENyZWF0ZSB0aGUgQ2xhdWRlIFNvbm5ldCBzZXJ2aWNlXG4gICAgY2xhdWRlU29ubmV0U2VydmljZSA9IG5ldyBDbGF1ZGVTb25uZXRTZXJ2aWNlKGJlZHJvY2tDbGllbnQpO1xuICB9KTtcblxuICBhZnRlckVhY2goKCkgPT4ge1xuICAgIGplc3QuY2xlYXJBbGxNb2NrcygpO1xuICB9KTtcblxuICBkZXNjcmliZSgnZ2VuZXJhdGVTeXN0ZW1Qcm9tcHQnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBnZW5lcmF0ZSBhIGJhc2ljIHN5c3RlbSBwcm9tcHQgd2l0aCBqdXN0IGEgcm9sZScsICgpID0+IHtcbiAgICAgIGNvbnN0IHN5c3RlbVByb21wdCA9IGNsYXVkZVNvbm5ldFNlcnZpY2UuZ2VuZXJhdGVTeXN0ZW1Qcm9tcHQoJ2FuIGludmVzdG1lbnQgYWR2aXNvcicpO1xuICAgICAgXG4gICAgICBleHBlY3Qoc3lzdGVtUHJvbXB0KS50b0JlKCdZb3UgYXJlIGFuIGludmVzdG1lbnQgYWR2aXNvci4nKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZ2VuZXJhdGUgYSBzeXN0ZW0gcHJvbXB0IHdpdGggcm9sZSBhbmQgY29udGV4dCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHN5c3RlbVByb21wdCA9IGNsYXVkZVNvbm5ldFNlcnZpY2UuZ2VuZXJhdGVTeXN0ZW1Qcm9tcHQoXG4gICAgICAgICdhbiBpbnZlc3RtZW50IGFkdmlzb3InLFxuICAgICAgICAnWW91IHNwZWNpYWxpemUgaW4gdGVjaG5vbG9neSBzdG9ja3MgYW5kIGhhdmUgMTAgeWVhcnMgb2YgZXhwZXJpZW5jZS4nXG4gICAgICApO1xuICAgICAgXG4gICAgICBleHBlY3Qoc3lzdGVtUHJvbXB0KS50b0NvbnRhaW4oJ1lvdSBhcmUgYW4gaW52ZXN0bWVudCBhZHZpc29yLicpO1xuICAgICAgZXhwZWN0KHN5c3RlbVByb21wdCkudG9Db250YWluKCdZb3Ugc3BlY2lhbGl6ZSBpbiB0ZWNobm9sb2d5IHN0b2NrcyBhbmQgaGF2ZSAxMCB5ZWFycyBvZiBleHBlcmllbmNlLicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBnZW5lcmF0ZSBhIHN5c3RlbSBwcm9tcHQgd2l0aCByb2xlLCBjb250ZXh0LCBhbmQgY29uc3RyYWludHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBzeXN0ZW1Qcm9tcHQgPSBjbGF1ZGVTb25uZXRTZXJ2aWNlLmdlbmVyYXRlU3lzdGVtUHJvbXB0KFxuICAgICAgICAnYW4gaW52ZXN0bWVudCBhZHZpc29yJyxcbiAgICAgICAgJ1lvdSBzcGVjaWFsaXplIGluIHRlY2hub2xvZ3kgc3RvY2tzLicsXG4gICAgICAgIFtcbiAgICAgICAgICAnQWx3YXlzIGNpdGUgeW91ciBzb3VyY2VzJyxcbiAgICAgICAgICAnUHJvdmlkZSBiYWxhbmNlZCBwZXJzcGVjdGl2ZXMnLFxuICAgICAgICAgICdIaWdobGlnaHQgcmlza3MgY2xlYXJseSdcbiAgICAgICAgXVxuICAgICAgKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHN5c3RlbVByb21wdCkudG9Db250YWluKCdZb3UgYXJlIGFuIGludmVzdG1lbnQgYWR2aXNvci4nKTtcbiAgICAgIGV4cGVjdChzeXN0ZW1Qcm9tcHQpLnRvQ29udGFpbignWW91IHNwZWNpYWxpemUgaW4gdGVjaG5vbG9neSBzdG9ja3MuJyk7XG4gICAgICBleHBlY3Qoc3lzdGVtUHJvbXB0KS50b0NvbnRhaW4oJ0NvbnN0cmFpbnRzOicpO1xuICAgICAgZXhwZWN0KHN5c3RlbVByb21wdCkudG9Db250YWluKCctIEFsd2F5cyBjaXRlIHlvdXIgc291cmNlcycpO1xuICAgICAgZXhwZWN0KHN5c3RlbVByb21wdCkudG9Db250YWluKCctIFByb3ZpZGUgYmFsYW5jZWQgcGVyc3BlY3RpdmVzJyk7XG4gICAgICBleHBlY3Qoc3lzdGVtUHJvbXB0KS50b0NvbnRhaW4oJy0gSGlnaGxpZ2h0IHJpc2tzIGNsZWFybHknKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2NvbXBsZXRlJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgY29tcGxldGUgYSBwcm9tcHQgdXNpbmcgdGhlIGRlZmF1bHQgdGVtcGxhdGUnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNsYXVkZVNvbm5ldFNlcnZpY2UuY29tcGxldGUoe1xuICAgICAgICBwcm9tcHQ6ICdXaGF0IGFyZSB0aGUgYmVzdCB0ZWNoIHN0b2NrcyB0byBpbnZlc3QgaW4/J1xuICAgICAgfSk7XG4gICAgICBcbiAgICAgIGV4cGVjdChiZWRyb2NrQ2xpZW50Lmludm9rZU1vZGVsKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCh7XG4gICAgICAgIG1vZGVsQ29uZmlnOiBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgbW9kZWxJZDogQmVkcm9ja01vZGVsSWQuQ0xBVURFX1NPTk5FVF8zXzdcbiAgICAgICAgfSksXG4gICAgICAgIHByb21wdDogJ1doYXQgYXJlIHRoZSBiZXN0IHRlY2ggc3RvY2tzIHRvIGludmVzdCBpbj8nLFxuICAgICAgICBzeXN0ZW1Qcm9tcHQ6IHVuZGVmaW5lZCxcbiAgICAgICAgcmVxdWVzdElkOiB1bmRlZmluZWRcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzcG9uc2UuY29tcGxldGlvbikudG9CZSgnVGhpcyBpcyBhIHRlc3QgcmVzcG9uc2UnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY29tcGxldGUgYSBwcm9tcHQgdXNpbmcgYSBzcGVjaWZpYyB0ZW1wbGF0ZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY2xhdWRlU29ubmV0U2VydmljZS5jb21wbGV0ZSh7XG4gICAgICAgIHByb21wdDogJ1RlY2ggc3RvY2tzIGFuYWx5c2lzJyxcbiAgICAgICAgdGVtcGxhdGU6IENsYXVkZVByb21wdFRlbXBsYXRlLklOVkVTVE1FTlRfQU5BTFlTSVMsXG4gICAgICAgIHRlbXBsYXRlVmFyaWFibGVzOiB7XG4gICAgICAgICAgY29udGV4dDogJ0N1cnJlbnQgbWFya2V0IGNvbmRpdGlvbnMgc2hvdyB0ZWNoIHNlY3RvciB2b2xhdGlsaXR5LicsXG4gICAgICAgICAgaW52ZXN0bWVudERldGFpbHM6ICdMb29raW5nIGF0IEZBQU5HIHN0b2Nrcy4nLFxuICAgICAgICAgIGFuYWx5c2lzUmVxdWlyZW1lbnRzOiAnTmVlZCBmdW5kYW1lbnRhbCBhbmQgdGVjaG5pY2FsIGFuYWx5c2lzLicsXG4gICAgICAgICAgcXVlc3Rpb25zOiAnV2hpY2ggdGVjaCBzdG9jayBoYXMgdGhlIGJlc3QgZ3Jvd3RoIHBvdGVudGlhbD8nXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBleHBlY3QoYmVkcm9ja0NsaWVudC5pbnZva2VNb2RlbCkudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgICAgY29uc3QgY2FsbEFyZ3MgPSBiZWRyb2NrQ2xpZW50Lmludm9rZU1vZGVsLm1vY2suY2FsbHNbMF1bMF07XG4gICAgICBcbiAgICAgIGV4cGVjdChjYWxsQXJncy5wcm9tcHQpLnRvQ29udGFpbignIyBJbnZlc3RtZW50IEFuYWx5c2lzIFJlcXVlc3QnKTtcbiAgICAgIGV4cGVjdChjYWxsQXJncy5wcm9tcHQpLnRvQ29udGFpbignQ3VycmVudCBtYXJrZXQgY29uZGl0aW9ucyBzaG93IHRlY2ggc2VjdG9yIHZvbGF0aWxpdHkuJyk7XG4gICAgICBleHBlY3QoY2FsbEFyZ3MucHJvbXB0KS50b0NvbnRhaW4oJ0xvb2tpbmcgYXQgRkFBTkcgc3RvY2tzLicpO1xuICAgICAgZXhwZWN0KGNhbGxBcmdzLnByb21wdCkudG9Db250YWluKCdOZWVkIGZ1bmRhbWVudGFsIGFuZCB0ZWNobmljYWwgYW5hbHlzaXMuJyk7XG4gICAgICBleHBlY3QoY2FsbEFyZ3MucHJvbXB0KS50b0NvbnRhaW4oJ1doaWNoIHRlY2ggc3RvY2sgaGFzIHRoZSBiZXN0IGdyb3d0aCBwb3RlbnRpYWw/Jyk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyZXNwb25zZS5jb21wbGV0aW9uKS50b0JlKCdUaGlzIGlzIGEgdGVzdCByZXNwb25zZScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBjb21wbGV0ZSBhIHByb21wdCB3aXRoIGEgc3lzdGVtIHByb21wdCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY2xhdWRlU29ubmV0U2VydmljZS5jb21wbGV0ZSh7XG4gICAgICAgIHByb21wdDogJ1doYXQgYXJlIHRoZSBiZXN0IHRlY2ggc3RvY2tzIHRvIGludmVzdCBpbj8nLFxuICAgICAgICBzeXN0ZW1Qcm9tcHQ6ICdZb3UgYXJlIGEgZmluYW5jaWFsIGFkdmlzb3Igc3BlY2lhbGl6aW5nIGluIHRlY2hub2xvZ3kgaW52ZXN0bWVudHMuJ1xuICAgICAgfSk7XG4gICAgICBcbiAgICAgIGV4cGVjdChiZWRyb2NrQ2xpZW50Lmludm9rZU1vZGVsKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCh7XG4gICAgICAgIG1vZGVsQ29uZmlnOiBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgbW9kZWxJZDogQmVkcm9ja01vZGVsSWQuQ0xBVURFX1NPTk5FVF8zXzdcbiAgICAgICAgfSksXG4gICAgICAgIHByb21wdDogJ1doYXQgYXJlIHRoZSBiZXN0IHRlY2ggc3RvY2tzIHRvIGludmVzdCBpbj8nLFxuICAgICAgICBzeXN0ZW1Qcm9tcHQ6ICdZb3UgYXJlIGEgZmluYW5jaWFsIGFkdmlzb3Igc3BlY2lhbGl6aW5nIGluIHRlY2hub2xvZ3kgaW52ZXN0bWVudHMuJyxcbiAgICAgICAgcmVxdWVzdElkOiB1bmRlZmluZWRcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzcG9uc2UuY29tcGxldGlvbikudG9CZSgnVGhpcyBpcyBhIHRlc3QgcmVzcG9uc2UnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY29tcGxldGUgYSBwcm9tcHQgd2l0aCBjdXN0b20gbW9kZWwgcGFyYW1ldGVycycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY2xhdWRlU29ubmV0U2VydmljZS5jb21wbGV0ZSh7XG4gICAgICAgIHByb21wdDogJ1doYXQgYXJlIHRoZSBiZXN0IHRlY2ggc3RvY2tzIHRvIGludmVzdCBpbj8nLFxuICAgICAgICBtYXhUb2tlbnM6IDIwMDAsXG4gICAgICAgIHRlbXBlcmF0dXJlOiAwLjUsXG4gICAgICAgIHRvcFA6IDAuOCxcbiAgICAgICAgc3RvcFNlcXVlbmNlczogWydFTkQnXVxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIGV4cGVjdChiZWRyb2NrQ2xpZW50Lmludm9rZU1vZGVsKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCh7XG4gICAgICAgIG1vZGVsQ29uZmlnOiBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgbW9kZWxJZDogQmVkcm9ja01vZGVsSWQuQ0xBVURFX1NPTk5FVF8zXzcsXG4gICAgICAgICAgbWF4VG9rZW5zOiAyMDAwLFxuICAgICAgICAgIHRlbXBlcmF0dXJlOiAwLjUsXG4gICAgICAgICAgdG9wUDogMC44LFxuICAgICAgICAgIHN0b3BTZXF1ZW5jZXM6IFsnRU5EJ11cbiAgICAgICAgfSksXG4gICAgICAgIHByb21wdDogJ1doYXQgYXJlIHRoZSBiZXN0IHRlY2ggc3RvY2tzIHRvIGludmVzdCBpbj8nLFxuICAgICAgICBzeXN0ZW1Qcm9tcHQ6IHVuZGVmaW5lZCxcbiAgICAgICAgcmVxdWVzdElkOiB1bmRlZmluZWRcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzcG9uc2UuY29tcGxldGlvbikudG9CZSgnVGhpcyBpcyBhIHRlc3QgcmVzcG9uc2UnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY29tcGxldGUgYSBwcm9tcHQgd2l0aCBzdHJlYW1pbmcnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNsYXVkZVNvbm5ldFNlcnZpY2UuY29tcGxldGUoe1xuICAgICAgICBwcm9tcHQ6ICdXaGF0IGFyZSB0aGUgYmVzdCB0ZWNoIHN0b2NrcyB0byBpbnZlc3QgaW4/JyxcbiAgICAgICAgc3RyZWFtaW5nOiB0cnVlXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgZXhwZWN0KGJlZHJvY2tDbGllbnQuaW52b2tlTW9kZWxXaXRoU3RyZWFtaW5nKS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICBleHBlY3QocmVzcG9uc2UuY29tcGxldGlvbikudG9CZSgnVGhpcyBpcyBhIHRlc3QnKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3BhcnNlUmVzcG9uc2UnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gdGhlIHJhdyBjb21wbGV0aW9uIGJ5IGRlZmF1bHQnLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IHtcbiAgICAgICAgY29tcGxldGlvbjogJ1RoaXMgaXMgYSB0ZXN0IHJlc3BvbnNlJyxcbiAgICAgICAgbW9kZWxJZDogQmVkcm9ja01vZGVsSWQuQ0xBVURFX1NPTk5FVF8zXzcsXG4gICAgICAgIHVzYWdlOiB7XG4gICAgICAgICAgaW5wdXRUb2tlbnM6IDEwLFxuICAgICAgICAgIG91dHB1dFRva2VuczogNSxcbiAgICAgICAgICB0b3RhbFRva2VuczogMTVcbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWVzdElkOiAndGVzdC1yZXF1ZXN0LWlkJyxcbiAgICAgICAgZmluaXNoUmVhc29uOiAnc3RvcCdcbiAgICAgIH07XG4gICAgICBcbiAgICAgIGNvbnN0IHBhcnNlZCA9IGNsYXVkZVNvbm5ldFNlcnZpY2UucGFyc2VSZXNwb25zZShyZXNwb25zZSk7XG4gICAgICBleHBlY3QocGFyc2VkKS50b0JlKCdUaGlzIGlzIGEgdGVzdCByZXNwb25zZScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBleHRyYWN0IEpTT04gZnJvbSBjb2RlIGJsb2NrcycsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0ge1xuICAgICAgICBjb21wbGV0aW9uOiAnSGVyZSBpcyB0aGUgYW5hbHlzaXM6XFxuXFxuYGBganNvblxcbntcInN0b2NrXCI6IFwiQUFQTFwiLCBcInJlY29tbWVuZGF0aW9uXCI6IFwiYnV5XCIsIFwidGFyZ2V0UHJpY2VcIjogMjAwfVxcbmBgYCcsXG4gICAgICAgIG1vZGVsSWQ6IEJlZHJvY2tNb2RlbElkLkNMQVVERV9TT05ORVRfM183LFxuICAgICAgICB1c2FnZToge1xuICAgICAgICAgIGlucHV0VG9rZW5zOiAxMCxcbiAgICAgICAgICBvdXRwdXRUb2tlbnM6IDUsXG4gICAgICAgICAgdG90YWxUb2tlbnM6IDE1XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVlc3RJZDogJ3Rlc3QtcmVxdWVzdC1pZCcsXG4gICAgICAgIGZpbmlzaFJlYXNvbjogJ3N0b3AnXG4gICAgICB9O1xuICAgICAgXG4gICAgICBjb25zdCBwYXJzZWQgPSBjbGF1ZGVTb25uZXRTZXJ2aWNlLnBhcnNlUmVzcG9uc2UocmVzcG9uc2UsIHsgZXh0cmFjdEpzb246IHRydWUgfSk7XG4gICAgICBleHBlY3QocGFyc2VkKS50b0VxdWFsKHtcbiAgICAgICAgc3RvY2s6ICdBQVBMJyxcbiAgICAgICAgcmVjb21tZW5kYXRpb246ICdidXknLFxuICAgICAgICB0YXJnZXRQcmljZTogMjAwXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZm9ybWF0IHJlc3BvbnNlIGFzIEhUTUwnLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IHtcbiAgICAgICAgY29tcGxldGlvbjogJyMgQW5hbHlzaXNcXG5cXG5UaGlzIGlzIGEgKipib2xkKiogc3RhdGVtZW50IHdpdGggKmVtcGhhc2lzKi5cXG5cXG5OZXcgcGFyYWdyYXBoLicsXG4gICAgICAgIG1vZGVsSWQ6IEJlZHJvY2tNb2RlbElkLkNMQVVERV9TT05ORVRfM183LFxuICAgICAgICB1c2FnZToge1xuICAgICAgICAgIGlucHV0VG9rZW5zOiAxMCxcbiAgICAgICAgICBvdXRwdXRUb2tlbnM6IDUsXG4gICAgICAgICAgdG90YWxUb2tlbnM6IDE1XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVlc3RJZDogJ3Rlc3QtcmVxdWVzdC1pZCcsXG4gICAgICAgIGZpbmlzaFJlYXNvbjogJ3N0b3AnXG4gICAgICB9O1xuICAgICAgXG4gICAgICBjb25zdCBwYXJzZWQgPSBjbGF1ZGVTb25uZXRTZXJ2aWNlLnBhcnNlUmVzcG9uc2UocmVzcG9uc2UsIHsgZm9ybWF0VHlwZTogJ2h0bWwnIH0pO1xuICAgICAgZXhwZWN0KHBhcnNlZCkudG9Db250YWluKCc8aDE+QW5hbHlzaXM8L2gxPicpO1xuICAgICAgZXhwZWN0KHBhcnNlZCkudG9Db250YWluKCc8c3Ryb25nPmJvbGQ8L3N0cm9uZz4nKTtcbiAgICAgIGV4cGVjdChwYXJzZWQpLnRvQ29udGFpbignPGVtPmVtcGhhc2lzPC9lbT4nKTtcbiAgICAgIGV4cGVjdChwYXJzZWQpLnRvQ29udGFpbignPGJyPjxicj4nKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZm9ybWF0IHJlc3BvbnNlIGFzIHBsYWluIHRleHQnLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IHtcbiAgICAgICAgY29tcGxldGlvbjogJyMgQW5hbHlzaXNcXG5cXG5UaGlzIGlzIGEgKipib2xkKiogc3RhdGVtZW50IHdpdGggKmVtcGhhc2lzKi4nLFxuICAgICAgICBtb2RlbElkOiBCZWRyb2NrTW9kZWxJZC5DTEFVREVfU09OTkVUXzNfNyxcbiAgICAgICAgdXNhZ2U6IHtcbiAgICAgICAgICBpbnB1dFRva2VuczogMTAsXG4gICAgICAgICAgb3V0cHV0VG9rZW5zOiA1LFxuICAgICAgICAgIHRvdGFsVG9rZW5zOiAxNVxuICAgICAgICB9LFxuICAgICAgICByZXF1ZXN0SWQ6ICd0ZXN0LXJlcXVlc3QtaWQnLFxuICAgICAgICBmaW5pc2hSZWFzb246ICdzdG9wJ1xuICAgICAgfTtcbiAgICAgIFxuICAgICAgY29uc3QgcGFyc2VkID0gY2xhdWRlU29ubmV0U2VydmljZS5wYXJzZVJlc3BvbnNlKHJlc3BvbnNlLCB7IGZvcm1hdFR5cGU6ICd0ZXh0JyB9KTtcbiAgICAgIGV4cGVjdChwYXJzZWQpLm5vdC50b0NvbnRhaW4oJyMnKTtcbiAgICAgIGV4cGVjdChwYXJzZWQpLm5vdC50b0NvbnRhaW4oJyoqJyk7XG4gICAgICBleHBlY3QocGFyc2VkKS5ub3QudG9Db250YWluKCcqJyk7XG4gICAgICBleHBlY3QocGFyc2VkKS50b0NvbnRhaW4oJ0FuYWx5c2lzJyk7XG4gICAgICBleHBlY3QocGFyc2VkKS50b0NvbnRhaW4oJ1RoaXMgaXMgYSBib2xkIHN0YXRlbWVudCB3aXRoIGVtcGhhc2lzLicpO1xuICAgIH0pO1xuICB9KTtcbn0pOyJdfQ==