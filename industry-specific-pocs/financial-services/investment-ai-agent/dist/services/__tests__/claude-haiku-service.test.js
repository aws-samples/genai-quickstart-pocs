"use strict";
/**
 * Tests for Claude Haiku 3.5 service
 */
Object.defineProperty(exports, "__esModule", { value: true });
const bedrock_client_1 = require("../ai/bedrock-client");
const claude_haiku_service_1 = require("../ai/claude-haiku-service");
const bedrock_1 = require("../../models/bedrock");
// Mock the Bedrock client
jest.mock('../ai/bedrock-client');
describe('ClaudeHaikuService', () => {
    let bedrockClient;
    let haikuService;
    beforeEach(() => {
        // Create a mock Bedrock client
        bedrockClient = new bedrock_client_1.BedrockClientService();
        // Mock the getModelConfig method
        bedrockClient.getModelConfig = jest.fn().mockReturnValue({
            modelId: bedrock_1.BedrockModelId.CLAUDE_HAIKU_3_5,
            maxTokens: 2048,
            temperature: 0.7,
            topP: 0.9
        });
        // Create the Claude Haiku service
        haikuService = new claude_haiku_service_1.ClaudeHaikuService(bedrockClient);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('constructor', () => {
        it('should initialize with default configuration', () => {
            expect(bedrockClient.getModelConfig).toHaveBeenCalledWith(bedrock_1.BedrockModelId.CLAUDE_HAIKU_3_5);
        });
        it('should apply configuration overrides', () => {
            const config = {
                maxTokens: 1000,
                temperature: 0.5
            };
            const customService = new claude_haiku_service_1.ClaudeHaikuService(bedrockClient, config);
            expect(customService).toBeDefined();
        });
    });
    describe('generateSystemPrompt', () => {
        it('should generate a basic system prompt', () => {
            const prompt = haikuService.generateSystemPrompt('a financial analyst');
            expect(prompt).toBe('You are a financial analyst.');
        });
        it('should include context in the system prompt', () => {
            const prompt = haikuService.generateSystemPrompt('a financial analyst', 'You specialize in market trends');
            expect(prompt).toBe('You are a financial analyst. You specialize in market trends');
        });
        it('should include constraints in the system prompt', () => {
            const prompt = haikuService.generateSystemPrompt('a financial analyst', 'You specialize in market trends', ['Be concise', 'Focus on data']);
            expect(prompt).toBe('You are a financial analyst. You specialize in market trends Constraints: Be concise. Focus on data.');
        });
    });
    describe('complete', () => {
        beforeEach(() => {
            // Mock the invokeModel method
            bedrockClient.invokeModel = jest.fn().mockResolvedValue({
                completion: 'Test completion',
                modelId: bedrock_1.BedrockModelId.CLAUDE_HAIKU_3_5,
                usage: {
                    inputTokens: 10,
                    outputTokens: 20,
                    totalTokens: 30
                },
                requestId: 'test-request-id',
                finishReason: 'stop'
            });
        });
        it('should complete a prompt with default options', async () => {
            const response = await haikuService.complete({
                prompt: 'Test prompt'
            });
            expect(bedrockClient.invokeModel).toHaveBeenCalledWith({
                modelConfig: expect.objectContaining({
                    modelId: bedrock_1.BedrockModelId.CLAUDE_HAIKU_3_5
                }),
                prompt: 'Test prompt',
                systemPrompt: undefined,
                requestId: undefined
            });
            expect(response).toEqual({
                completion: 'Test completion',
                modelId: bedrock_1.BedrockModelId.CLAUDE_HAIKU_3_5,
                usage: {
                    inputTokens: 10,
                    outputTokens: 20,
                    totalTokens: 30
                },
                requestId: 'test-request-id',
                finishReason: 'stop'
            });
        });
        it('should apply a template when specified', async () => {
            const response = await haikuService.complete({
                prompt: 'Test prompt',
                template: claude_haiku_service_1.ClaudeHaikuPromptTemplate.QUICK_ANALYSIS,
                templateVariables: {
                    topic: 'Market trends',
                    points: 'Key indicators',
                    format: 'Bullet points'
                }
            });
            expect(bedrockClient.invokeModel).toHaveBeenCalledWith(expect.objectContaining({
                prompt: expect.stringContaining('Market trends')
            }));
            expect(response.completion).toBe('Test completion');
        });
        it('should handle errors gracefully', async () => {
            bedrockClient.invokeModel = jest.fn().mockRejectedValue(new Error('Test error'));
            await expect(haikuService.complete({
                prompt: 'Test prompt'
            })).rejects.toThrow('Test error');
        });
    });
    describe('parseResponse', () => {
        const mockResponse = {
            completion: '```json\n{"key": "value"}\n```',
            modelId: bedrock_1.BedrockModelId.CLAUDE_HAIKU_3_5,
            usage: {
                inputTokens: 10,
                outputTokens: 20,
                totalTokens: 30
            },
            requestId: 'test-request-id',
            finishReason: 'stop'
        };
        it('should extract JSON from code blocks', () => {
            const result = haikuService.parseResponse(mockResponse, {
                extractJson: true
            });
            expect(result).toEqual({ key: 'value' });
        });
        it('should return raw completion when no options are specified', () => {
            const result = haikuService.parseResponse(mockResponse);
            expect(result).toBe('```json\n{"key": "value"}\n```');
        });
        it('should format as HTML when requested', () => {
            const response = {
                ...mockResponse,
                completion: '# Title\n\n**Bold** and *italic*'
            };
            const result = haikuService.parseResponse(response, {
                formatType: 'html'
            });
            expect(result).toContain('<h3>Title</h3>');
            expect(result).toContain('<strong>Bold</strong>');
            expect(result).toContain('<em>italic</em>');
        });
        it('should format as plain text when requested', () => {
            const response = {
                ...mockResponse,
                completion: '# Title\n\n**Bold** and *italic*'
            };
            const result = haikuService.parseResponse(response, {
                formatType: 'text'
            });
            expect(result).toBe('Title\n\nBold and italic');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhdWRlLWhhaWt1LXNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9fX3Rlc3RzX18vY2xhdWRlLWhhaWt1LXNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgseURBQTREO0FBQzVELHFFQUEyRjtBQUMzRixrREFBdUU7QUFFdkUsMEJBQTBCO0FBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUVsQyxRQUFRLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxFQUFFO0lBQ2xDLElBQUksYUFBZ0QsQ0FBQztJQUNyRCxJQUFJLFlBQWdDLENBQUM7SUFFckMsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUNkLCtCQUErQjtRQUMvQixhQUFhLEdBQUcsSUFBSSxxQ0FBb0IsRUFBdUMsQ0FBQztRQUVoRixpQ0FBaUM7UUFDakMsYUFBYSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsZUFBZSxDQUFDO1lBQ3ZELE9BQU8sRUFBRSx3QkFBYyxDQUFDLGdCQUFnQjtZQUN4QyxTQUFTLEVBQUUsSUFBSTtZQUNmLFdBQVcsRUFBRSxHQUFHO1lBQ2hCLElBQUksRUFBRSxHQUFHO1NBQ1YsQ0FBQyxDQUFDO1FBRUgsa0NBQWtDO1FBQ2xDLFlBQVksR0FBRyxJQUFJLHlDQUFrQixDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ3ZELENBQUMsQ0FBQyxDQUFDO0lBRUgsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNiLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUN2QixDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFO1FBQzNCLEVBQUUsQ0FBQyw4Q0FBOEMsRUFBRSxHQUFHLEVBQUU7WUFDdEQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyx3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QyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDOUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsNENBQTRDLEVBQUUsR0FBRyxFQUFFO1lBQ3BELE1BQU0sUUFBUSxHQUFvQjtnQkFDaEMsR0FBRyxZQUFZO2dCQUNmLFVBQVUsRUFBRSxrQ0FBa0M7YUFDL0MsQ0FBQztZQUVGLE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFO2dCQUNsRCxVQUFVLEVBQUUsTUFBTTthQUNuQixDQUFDLENBQUM7WUFFSCxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFDbEQsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBUZXN0cyBmb3IgQ2xhdWRlIEhhaWt1IDMuNSBzZXJ2aWNlXG4gKi9cblxuaW1wb3J0IHsgQmVkcm9ja0NsaWVudFNlcnZpY2UgfSBmcm9tICcuLi9haS9iZWRyb2NrLWNsaWVudCc7XG5pbXBvcnQgeyBDbGF1ZGVIYWlrdVNlcnZpY2UsIENsYXVkZUhhaWt1UHJvbXB0VGVtcGxhdGUgfSBmcm9tICcuLi9haS9jbGF1ZGUtaGFpa3Utc2VydmljZSc7XG5pbXBvcnQgeyBCZWRyb2NrTW9kZWxJZCwgQmVkcm9ja1Jlc3BvbnNlIH0gZnJvbSAnLi4vLi4vbW9kZWxzL2JlZHJvY2snO1xuXG4vLyBNb2NrIHRoZSBCZWRyb2NrIGNsaWVudFxuamVzdC5tb2NrKCcuLi9haS9iZWRyb2NrLWNsaWVudCcpO1xuXG5kZXNjcmliZSgnQ2xhdWRlSGFpa3VTZXJ2aWNlJywgKCkgPT4ge1xuICBsZXQgYmVkcm9ja0NsaWVudDogamVzdC5Nb2NrZWQ8QmVkcm9ja0NsaWVudFNlcnZpY2U+O1xuICBsZXQgaGFpa3VTZXJ2aWNlOiBDbGF1ZGVIYWlrdVNlcnZpY2U7XG4gIFxuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAvLyBDcmVhdGUgYSBtb2NrIEJlZHJvY2sgY2xpZW50XG4gICAgYmVkcm9ja0NsaWVudCA9IG5ldyBCZWRyb2NrQ2xpZW50U2VydmljZSgpIGFzIGplc3QuTW9ja2VkPEJlZHJvY2tDbGllbnRTZXJ2aWNlPjtcbiAgICBcbiAgICAvLyBNb2NrIHRoZSBnZXRNb2RlbENvbmZpZyBtZXRob2RcbiAgICBiZWRyb2NrQ2xpZW50LmdldE1vZGVsQ29uZmlnID0gamVzdC5mbigpLm1vY2tSZXR1cm5WYWx1ZSh7XG4gICAgICBtb2RlbElkOiBCZWRyb2NrTW9kZWxJZC5DTEFVREVfSEFJS1VfM181LFxuICAgICAgbWF4VG9rZW5zOiAyMDQ4LFxuICAgICAgdGVtcGVyYXR1cmU6IDAuNyxcbiAgICAgIHRvcFA6IDAuOVxuICAgIH0pO1xuICAgIFxuICAgIC8vIENyZWF0ZSB0aGUgQ2xhdWRlIEhhaWt1IHNlcnZpY2VcbiAgICBoYWlrdVNlcnZpY2UgPSBuZXcgQ2xhdWRlSGFpa3VTZXJ2aWNlKGJlZHJvY2tDbGllbnQpO1xuICB9KTtcbiAgXG4gIGFmdGVyRWFjaCgoKSA9PiB7XG4gICAgamVzdC5jbGVhckFsbE1vY2tzKCk7XG4gIH0pO1xuICBcbiAgZGVzY3JpYmUoJ2NvbnN0cnVjdG9yJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgaW5pdGlhbGl6ZSB3aXRoIGRlZmF1bHQgY29uZmlndXJhdGlvbicsICgpID0+IHtcbiAgICAgIGV4cGVjdChiZWRyb2NrQ2xpZW50LmdldE1vZGVsQ29uZmlnKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChCZWRyb2NrTW9kZWxJZC5DTEFVREVfSEFJS1VfM181KTtcbiAgICB9KTtcbiAgICBcbiAgICBpdCgnc2hvdWxkIGFwcGx5IGNvbmZpZ3VyYXRpb24gb3ZlcnJpZGVzJywgKCkgPT4ge1xuICAgICAgY29uc3QgY29uZmlnID0ge1xuICAgICAgICBtYXhUb2tlbnM6IDEwMDAsXG4gICAgICAgIHRlbXBlcmF0dXJlOiAwLjVcbiAgICAgIH07XG4gICAgICBcbiAgICAgIGNvbnN0IGN1c3RvbVNlcnZpY2UgPSBuZXcgQ2xhdWRlSGFpa3VTZXJ2aWNlKGJlZHJvY2tDbGllbnQsIGNvbmZpZyk7XG4gICAgICBleHBlY3QoY3VzdG9tU2VydmljZSkudG9CZURlZmluZWQoKTtcbiAgICB9KTtcbiAgfSk7XG4gIFxuICBkZXNjcmliZSgnZ2VuZXJhdGVTeXN0ZW1Qcm9tcHQnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBnZW5lcmF0ZSBhIGJhc2ljIHN5c3RlbSBwcm9tcHQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBwcm9tcHQgPSBoYWlrdVNlcnZpY2UuZ2VuZXJhdGVTeXN0ZW1Qcm9tcHQoJ2EgZmluYW5jaWFsIGFuYWx5c3QnKTtcbiAgICAgIGV4cGVjdChwcm9tcHQpLnRvQmUoJ1lvdSBhcmUgYSBmaW5hbmNpYWwgYW5hbHlzdC4nKTtcbiAgICB9KTtcbiAgICBcbiAgICBpdCgnc2hvdWxkIGluY2x1ZGUgY29udGV4dCBpbiB0aGUgc3lzdGVtIHByb21wdCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHByb21wdCA9IGhhaWt1U2VydmljZS5nZW5lcmF0ZVN5c3RlbVByb21wdChcbiAgICAgICAgJ2EgZmluYW5jaWFsIGFuYWx5c3QnLFxuICAgICAgICAnWW91IHNwZWNpYWxpemUgaW4gbWFya2V0IHRyZW5kcydcbiAgICAgICk7XG4gICAgICBleHBlY3QocHJvbXB0KS50b0JlKCdZb3UgYXJlIGEgZmluYW5jaWFsIGFuYWx5c3QuIFlvdSBzcGVjaWFsaXplIGluIG1hcmtldCB0cmVuZHMnKTtcbiAgICB9KTtcbiAgICBcbiAgICBpdCgnc2hvdWxkIGluY2x1ZGUgY29uc3RyYWludHMgaW4gdGhlIHN5c3RlbSBwcm9tcHQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBwcm9tcHQgPSBoYWlrdVNlcnZpY2UuZ2VuZXJhdGVTeXN0ZW1Qcm9tcHQoXG4gICAgICAgICdhIGZpbmFuY2lhbCBhbmFseXN0JyxcbiAgICAgICAgJ1lvdSBzcGVjaWFsaXplIGluIG1hcmtldCB0cmVuZHMnLFxuICAgICAgICBbJ0JlIGNvbmNpc2UnLCAnRm9jdXMgb24gZGF0YSddXG4gICAgICApO1xuICAgICAgZXhwZWN0KHByb21wdCkudG9CZSgnWW91IGFyZSBhIGZpbmFuY2lhbCBhbmFseXN0LiBZb3Ugc3BlY2lhbGl6ZSBpbiBtYXJrZXQgdHJlbmRzIENvbnN0cmFpbnRzOiBCZSBjb25jaXNlLiBGb2N1cyBvbiBkYXRhLicpO1xuICAgIH0pO1xuICB9KTtcbiAgXG4gIGRlc2NyaWJlKCdjb21wbGV0ZScsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIC8vIE1vY2sgdGhlIGludm9rZU1vZGVsIG1ldGhvZFxuICAgICAgYmVkcm9ja0NsaWVudC5pbnZva2VNb2RlbCA9IGplc3QuZm4oKS5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIGNvbXBsZXRpb246ICdUZXN0IGNvbXBsZXRpb24nLFxuICAgICAgICBtb2RlbElkOiBCZWRyb2NrTW9kZWxJZC5DTEFVREVfSEFJS1VfM181LFxuICAgICAgICB1c2FnZToge1xuICAgICAgICAgIGlucHV0VG9rZW5zOiAxMCxcbiAgICAgICAgICBvdXRwdXRUb2tlbnM6IDIwLFxuICAgICAgICAgIHRvdGFsVG9rZW5zOiAzMFxuICAgICAgICB9LFxuICAgICAgICByZXF1ZXN0SWQ6ICd0ZXN0LXJlcXVlc3QtaWQnLFxuICAgICAgICBmaW5pc2hSZWFzb246ICdzdG9wJ1xuICAgICAgfSBhcyBCZWRyb2NrUmVzcG9uc2UpO1xuICAgIH0pO1xuICAgIFxuICAgIGl0KCdzaG91bGQgY29tcGxldGUgYSBwcm9tcHQgd2l0aCBkZWZhdWx0IG9wdGlvbnMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGhhaWt1U2VydmljZS5jb21wbGV0ZSh7XG4gICAgICAgIHByb21wdDogJ1Rlc3QgcHJvbXB0J1xuICAgICAgfSk7XG4gICAgICBcbiAgICAgIGV4cGVjdChiZWRyb2NrQ2xpZW50Lmludm9rZU1vZGVsKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCh7XG4gICAgICAgIG1vZGVsQ29uZmlnOiBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgbW9kZWxJZDogQmVkcm9ja01vZGVsSWQuQ0xBVURFX0hBSUtVXzNfNVxuICAgICAgICB9KSxcbiAgICAgICAgcHJvbXB0OiAnVGVzdCBwcm9tcHQnLFxuICAgICAgICBzeXN0ZW1Qcm9tcHQ6IHVuZGVmaW5lZCxcbiAgICAgICAgcmVxdWVzdElkOiB1bmRlZmluZWRcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzcG9uc2UpLnRvRXF1YWwoe1xuICAgICAgICBjb21wbGV0aW9uOiAnVGVzdCBjb21wbGV0aW9uJyxcbiAgICAgICAgbW9kZWxJZDogQmVkcm9ja01vZGVsSWQuQ0xBVURFX0hBSUtVXzNfNSxcbiAgICAgICAgdXNhZ2U6IHtcbiAgICAgICAgICBpbnB1dFRva2VuczogMTAsXG4gICAgICAgICAgb3V0cHV0VG9rZW5zOiAyMCxcbiAgICAgICAgICB0b3RhbFRva2VuczogMzBcbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWVzdElkOiAndGVzdC1yZXF1ZXN0LWlkJyxcbiAgICAgICAgZmluaXNoUmVhc29uOiAnc3RvcCdcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIFxuICAgIGl0KCdzaG91bGQgYXBwbHkgYSB0ZW1wbGF0ZSB3aGVuIHNwZWNpZmllZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgaGFpa3VTZXJ2aWNlLmNvbXBsZXRlKHtcbiAgICAgICAgcHJvbXB0OiAnVGVzdCBwcm9tcHQnLFxuICAgICAgICB0ZW1wbGF0ZTogQ2xhdWRlSGFpa3VQcm9tcHRUZW1wbGF0ZS5RVUlDS19BTkFMWVNJUyxcbiAgICAgICAgdGVtcGxhdGVWYXJpYWJsZXM6IHtcbiAgICAgICAgICB0b3BpYzogJ01hcmtldCB0cmVuZHMnLFxuICAgICAgICAgIHBvaW50czogJ0tleSBpbmRpY2F0b3JzJyxcbiAgICAgICAgICBmb3JtYXQ6ICdCdWxsZXQgcG9pbnRzJ1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgZXhwZWN0KGJlZHJvY2tDbGllbnQuaW52b2tlTW9kZWwpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgcHJvbXB0OiBleHBlY3Quc3RyaW5nQ29udGFpbmluZygnTWFya2V0IHRyZW5kcycpXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzcG9uc2UuY29tcGxldGlvbikudG9CZSgnVGVzdCBjb21wbGV0aW9uJyk7XG4gICAgfSk7XG4gICAgXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgZXJyb3JzIGdyYWNlZnVsbHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBiZWRyb2NrQ2xpZW50Lmludm9rZU1vZGVsID0gamVzdC5mbigpLm1vY2tSZWplY3RlZFZhbHVlKG5ldyBFcnJvcignVGVzdCBlcnJvcicpKTtcbiAgICAgIFxuICAgICAgYXdhaXQgZXhwZWN0KGhhaWt1U2VydmljZS5jb21wbGV0ZSh7XG4gICAgICAgIHByb21wdDogJ1Rlc3QgcHJvbXB0J1xuICAgICAgfSkpLnJlamVjdHMudG9UaHJvdygnVGVzdCBlcnJvcicpO1xuICAgIH0pO1xuICB9KTtcbiAgXG4gIGRlc2NyaWJlKCdwYXJzZVJlc3BvbnNlJywgKCkgPT4ge1xuICAgIGNvbnN0IG1vY2tSZXNwb25zZTogQmVkcm9ja1Jlc3BvbnNlID0ge1xuICAgICAgY29tcGxldGlvbjogJ2BgYGpzb25cXG57XCJrZXlcIjogXCJ2YWx1ZVwifVxcbmBgYCcsXG4gICAgICBtb2RlbElkOiBCZWRyb2NrTW9kZWxJZC5DTEFVREVfSEFJS1VfM181LFxuICAgICAgdXNhZ2U6IHtcbiAgICAgICAgaW5wdXRUb2tlbnM6IDEwLFxuICAgICAgICBvdXRwdXRUb2tlbnM6IDIwLFxuICAgICAgICB0b3RhbFRva2VuczogMzBcbiAgICAgIH0sXG4gICAgICByZXF1ZXN0SWQ6ICd0ZXN0LXJlcXVlc3QtaWQnLFxuICAgICAgZmluaXNoUmVhc29uOiAnc3RvcCdcbiAgICB9O1xuICAgIFxuICAgIGl0KCdzaG91bGQgZXh0cmFjdCBKU09OIGZyb20gY29kZSBibG9ja3MnLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBoYWlrdVNlcnZpY2UucGFyc2VSZXNwb25zZShtb2NrUmVzcG9uc2UsIHtcbiAgICAgICAgZXh0cmFjdEpzb246IHRydWVcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0KS50b0VxdWFsKHsga2V5OiAndmFsdWUnIH0pO1xuICAgIH0pO1xuICAgIFxuICAgIGl0KCdzaG91bGQgcmV0dXJuIHJhdyBjb21wbGV0aW9uIHdoZW4gbm8gb3B0aW9ucyBhcmUgc3BlY2lmaWVkJywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gaGFpa3VTZXJ2aWNlLnBhcnNlUmVzcG9uc2UobW9ja1Jlc3BvbnNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmUoJ2BgYGpzb25cXG57XCJrZXlcIjogXCJ2YWx1ZVwifVxcbmBgYCcpO1xuICAgIH0pO1xuICAgIFxuICAgIGl0KCdzaG91bGQgZm9ybWF0IGFzIEhUTUwgd2hlbiByZXF1ZXN0ZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXNwb25zZTogQmVkcm9ja1Jlc3BvbnNlID0ge1xuICAgICAgICAuLi5tb2NrUmVzcG9uc2UsXG4gICAgICAgIGNvbXBsZXRpb246ICcjIFRpdGxlXFxuXFxuKipCb2xkKiogYW5kICppdGFsaWMqJ1xuICAgICAgfTtcbiAgICAgIFxuICAgICAgY29uc3QgcmVzdWx0ID0gaGFpa3VTZXJ2aWNlLnBhcnNlUmVzcG9uc2UocmVzcG9uc2UsIHtcbiAgICAgICAgZm9ybWF0VHlwZTogJ2h0bWwnXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3VsdCkudG9Db250YWluKCc8aDM+VGl0bGU8L2gzPicpO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG9Db250YWluKCc8c3Ryb25nPkJvbGQ8L3N0cm9uZz4nKTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQ29udGFpbignPGVtPml0YWxpYzwvZW0+Jyk7XG4gICAgfSk7XG4gICAgXG4gICAgaXQoJ3Nob3VsZCBmb3JtYXQgYXMgcGxhaW4gdGV4dCB3aGVuIHJlcXVlc3RlZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlOiBCZWRyb2NrUmVzcG9uc2UgPSB7XG4gICAgICAgIC4uLm1vY2tSZXNwb25zZSxcbiAgICAgICAgY29tcGxldGlvbjogJyMgVGl0bGVcXG5cXG4qKkJvbGQqKiBhbmQgKml0YWxpYyonXG4gICAgICB9O1xuICAgICAgXG4gICAgICBjb25zdCByZXN1bHQgPSBoYWlrdVNlcnZpY2UucGFyc2VSZXNwb25zZShyZXNwb25zZSwge1xuICAgICAgICBmb3JtYXRUeXBlOiAndGV4dCdcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0KS50b0JlKCdUaXRsZVxcblxcbkJvbGQgYW5kIGl0YWxpYycpO1xuICAgIH0pO1xuICB9KTtcbn0pOyJdfQ==