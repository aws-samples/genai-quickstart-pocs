"use strict";
/**
 * Tests for Amazon Nova Pro service
 */
Object.defineProperty(exports, "__esModule", { value: true });
const amazon_nova_pro_service_1 = require("../ai/amazon-nova-pro-service");
const bedrock_1 = require("../../models/bedrock");
// Mock the Bedrock client
jest.mock('../ai/bedrock-client');
describe('AmazonNovaProService', () => {
    let mockBedrockClient;
    let novaProService;
    let mockResponse;
    beforeEach(() => {
        // Create mock Bedrock client
        mockBedrockClient = {
            getModelConfig: jest.fn(),
            invokeModel: jest.fn(),
            invokeModelWithStreaming: jest.fn()
        };
        // Mock the model config
        mockBedrockClient.getModelConfig.mockReturnValue({
            modelId: bedrock_1.BedrockModelId.AMAZON_NOVA_PRO,
            maxTokens: 4096,
            temperature: 0.7,
            topP: 0.9
        });
        // Create mock response
        mockResponse = {
            completion: 'Test response from Amazon Nova Pro',
            modelId: bedrock_1.BedrockModelId.AMAZON_NOVA_PRO,
            usage: {
                inputTokens: 100,
                outputTokens: 200,
                totalTokens: 300
            },
            requestId: 'test-request-id',
            finishReason: 'stop'
        };
        mockBedrockClient.invokeModel.mockResolvedValue(mockResponse);
        // Create the service
        novaProService = new amazon_nova_pro_service_1.AmazonNovaProService(mockBedrockClient);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('constructor', () => {
        it('should initialize with default configuration', () => {
            expect(mockBedrockClient.getModelConfig).toHaveBeenCalledWith(bedrock_1.BedrockModelId.AMAZON_NOVA_PRO);
        });
        it('should apply configuration overrides', () => {
            const customConfig = { maxTokens: 2048, temperature: 0.3 };
            const customService = new amazon_nova_pro_service_1.AmazonNovaProService(mockBedrockClient, customConfig);
            expect(customService).toBeDefined();
        });
    });
    describe('generateSystemPrompt', () => {
        it('should generate a basic system prompt', () => {
            const prompt = novaProService.generateSystemPrompt('a financial analyst');
            expect(prompt).toContain('You are a financial analyst with expertise in financial analysis');
            expect(prompt).toContain('Financial statement analysis');
            expect(prompt).toContain('Statistical analysis');
            expect(prompt).toContain('Risk modeling');
        });
        it('should include additional context', () => {
            const context = 'Focus on technology sector analysis';
            const prompt = novaProService.generateSystemPrompt('a sector analyst', context);
            expect(prompt).toContain('You are a sector analyst');
            expect(prompt).toContain('Additional Context: Focus on technology sector analysis');
        });
        it('should include constraints', () => {
            const constraints = ['Use only public data', 'Provide confidence intervals'];
            const prompt = novaProService.generateSystemPrompt('an analyst', undefined, constraints);
            expect(prompt).toContain('Constraints:');
            expect(prompt).toContain('- Use only public data');
            expect(prompt).toContain('- Provide confidence intervals');
        });
    });
    describe('complete', () => {
        it('should complete a basic prompt', async () => {
            const options = {
                prompt: 'Analyze AAPL stock performance'
            };
            const result = await novaProService.complete(options);
            expect(mockBedrockClient.invokeModel).toHaveBeenCalledWith({
                modelConfig: expect.objectContaining({
                    modelId: bedrock_1.BedrockModelId.AMAZON_NOVA_PRO,
                    temperature: 0.3 // Should use lower temperature for financial analysis
                }),
                prompt: 'Analyze AAPL stock performance',
                systemPrompt: expect.stringContaining('financial analyst and quantitative researcher'),
                requestId: undefined
            });
            expect(result).toEqual(mockResponse);
        });
        it('should apply financial analysis template', async () => {
            const options = {
                prompt: 'Analyze this company',
                template: amazon_nova_pro_service_1.NovaProPromptTemplate.FINANCIAL_ANALYSIS,
                templateVariables: {
                    investmentDetails: 'Apple Inc. (AAPL)',
                    financialData: 'Revenue: $365B, Net Income: $95B',
                    analysisRequirements: 'Full financial analysis',
                    keyMetrics: 'P/E, ROE, ROA, Debt/Equity',
                    timePeriod: '2020-2023'
                }
            };
            await novaProService.complete(options);
            expect(mockBedrockClient.invokeModel).toHaveBeenCalledWith({
                modelConfig: expect.any(Object),
                prompt: expect.stringContaining('Financial Analysis Request'),
                systemPrompt: expect.any(String),
                requestId: undefined
            });
        });
        it('should apply quantitative analysis template', async () => {
            const options = {
                prompt: 'Perform statistical analysis',
                template: amazon_nova_pro_service_1.NovaProPromptTemplate.QUANTITATIVE_ANALYSIS,
                templateVariables: {
                    datasetDescription: 'Stock returns data',
                    analysisType: 'Regression analysis',
                    statisticalMethods: 'Linear regression, correlation',
                    variables: 'Returns, volatility, volume',
                    hypothesis: 'Higher volume leads to higher volatility'
                }
            };
            await novaProService.complete(options);
            expect(mockBedrockClient.invokeModel).toHaveBeenCalledWith({
                modelConfig: expect.any(Object),
                prompt: expect.stringContaining('Quantitative Analysis Request'),
                systemPrompt: expect.any(String),
                requestId: undefined
            });
        });
        it('should apply risk modeling template', async () => {
            const options = {
                prompt: 'Calculate portfolio risk',
                template: amazon_nova_pro_service_1.NovaProPromptTemplate.RISK_MODELING,
                templateVariables: {
                    investmentDetails: 'Diversified equity portfolio',
                    riskFactors: 'Market risk, sector concentration',
                    historicalData: '5 years of daily returns',
                    riskMetrics: 'VaR, Expected Shortfall, Beta',
                    timeHorizon: '1 year'
                }
            };
            await novaProService.complete(options);
            expect(mockBedrockClient.invokeModel).toHaveBeenCalledWith({
                modelConfig: expect.any(Object),
                prompt: expect.stringContaining('Risk Modeling Request'),
                systemPrompt: expect.any(String),
                requestId: undefined
            });
        });
        it('should handle custom analysis type', async () => {
            const options = {
                prompt: 'Analyze portfolio',
                analysisType: 'quantitative'
            };
            await novaProService.complete(options);
            expect(mockBedrockClient.invokeModel).toHaveBeenCalledWith({
                modelConfig: expect.any(Object),
                prompt: 'Analyze portfolio',
                systemPrompt: expect.stringContaining('quantitative analyst specializing in statistical analysis'),
                requestId: undefined
            });
        });
        it('should handle streaming requests', async () => {
            const mockStreamResponse = [
                { completion: 'Part 1', modelId: bedrock_1.BedrockModelId.AMAZON_NOVA_PRO, requestId: 'test' },
                { completion: 'Part 2', modelId: bedrock_1.BedrockModelId.AMAZON_NOVA_PRO, requestId: 'test' },
                {
                    completion: 'Part 1Part 2',
                    modelId: bedrock_1.BedrockModelId.AMAZON_NOVA_PRO,
                    requestId: 'test',
                    finishReason: 'stop',
                    usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 }
                }
            ];
            mockBedrockClient.invokeModelWithStreaming.mockImplementation(async function* () {
                for (const chunk of mockStreamResponse) {
                    yield chunk;
                }
            });
            const options = {
                prompt: 'Analyze stock',
                streaming: true
            };
            const result = await novaProService.complete(options);
            expect(result.completion).toBe('Part 1Part 2');
            expect(result.finishReason).toBe('stop');
        });
        it('should handle errors gracefully', async () => {
            const error = new Error('Bedrock service error');
            mockBedrockClient.invokeModel.mockRejectedValue(error);
            const options = {
                prompt: 'Analyze stock'
            };
            await expect(novaProService.complete(options)).rejects.toThrow('Bedrock service error');
        });
    });
    describe('parseResponse', () => {
        it('should return raw response by default', () => {
            const result = novaProService.parseResponse(mockResponse);
            expect(result).toBe('Test response from Amazon Nova Pro');
        });
        it('should extract JSON from code blocks', () => {
            const jsonResponse = {
                ...mockResponse,
                completion: 'Here is the analysis:\n```json\n{"pe_ratio": 25.5, "roe": 0.15}\n```\nEnd of analysis.'
            };
            const result = novaProService.parseResponse(jsonResponse, { extractJson: true });
            expect(result).toEqual({ pe_ratio: 25.5, roe: 0.15 });
        });
        it('should extract financial metrics', () => {
            const metricsResponse = {
                ...mockResponse,
                completion: `
          Financial Analysis Results:
          P/E Ratio: 25.5
          ROE: 15.2%
          Annual Return: 8.5%
          Beta: 1.15
          VaR (95%): 1.2
          Correlation with S&P 500: 0.85
        `
            };
            const result = novaProService.parseResponse(metricsResponse, { extractMetrics: true });
            expect(result.extractedMetrics.ratios).toEqual({
                'P/E Ratio': 25.5
            });
            expect(result.extractedMetrics.returns).toEqual({
                'Annual Return': 8.5
            });
            expect(result.extractedMetrics.risks).toEqual({
                'Beta': 1.15,
                'VaR': 1.2
            });
        });
        it('should parse structured financial response', () => {
            const structuredResponse = {
                ...mockResponse,
                completion: `
          # Executive Summary
          This is the summary of the analysis.
          
          ## Financial Ratios
          P/E Ratio: 25.5
          ROE: 15.2%
          
          ## Recommendations
          I recommend buying this stock based on strong fundamentals.
        `
            };
            const result = novaProService.parseResponse(structuredResponse, { formatType: 'structured' });
            expect(result.sections).toHaveLength(3);
            expect(result.sections[0].title).toBe('Executive Summary');
            expect(result.sections[1].title).toBe('Financial Ratios');
            expect(result.sections[2].title).toBe('Recommendations');
            expect(result.metrics['Financial Ratios']).toBeDefined();
        });
        it('should convert to HTML format', () => {
            const markdownResponse = {
                ...mockResponse,
                completion: '# Analysis\n**Strong** performance with *good* metrics.'
            };
            const result = novaProService.parseResponse(markdownResponse, { formatType: 'html' });
            expect(result).toContain('<h1>Analysis</h1>');
            expect(result).toContain('<strong>Strong</strong>');
            expect(result).toContain('<em>good</em>');
        });
        it('should strip markdown formatting', () => {
            const markdownResponse = {
                ...mockResponse,
                completion: '# Analysis\n**Strong** performance with *good* metrics.'
            };
            const result = novaProService.parseResponse(markdownResponse, { formatType: 'text' });
            expect(result).toBe('Analysis\nStrong performance with good metrics.');
        });
        it('should parse numerical content', () => {
            const numericalResponse = {
                ...mockResponse,
                completion: 'The return is 8.5% and the cost is $1,250.00'
            };
            const result = novaProService.parseResponse(numericalResponse, { parseNumbers: true });
            expect(result).toContain('0.085');
            expect(result).toContain('1250');
        });
    });
    describe('error handling', () => {
        it('should format errors correctly', async () => {
            const error = new Error('Model invocation failed');
            mockBedrockClient.invokeModel.mockRejectedValue(error);
            await expect(novaProService.complete({ prompt: 'test' })).rejects.toThrow('Model invocation failed');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW1hem9uLW5vdmEtcHJvLXNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9fX3Rlc3RzX18vYW1hem9uLW5vdmEtcHJvLXNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsMkVBQTRGO0FBRTVGLGtEQUF1RTtBQUV2RSwwQkFBMEI7QUFDMUIsSUFBSSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0FBRWxDLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLEVBQUU7SUFDcEMsSUFBSSxpQkFBb0QsQ0FBQztJQUN6RCxJQUFJLGNBQW9DLENBQUM7SUFDekMsSUFBSSxZQUE2QixDQUFDO0lBRWxDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDZCw2QkFBNkI7UUFDN0IsaUJBQWlCLEdBQUc7WUFDbEIsY0FBYyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7WUFDekIsV0FBVyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7WUFDdEIsd0JBQXdCLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTtTQUM3QixDQUFDO1FBRVQsd0JBQXdCO1FBQ3hCLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUM7WUFDL0MsT0FBTyxFQUFFLHdCQUFjLENBQUMsZUFBZTtZQUN2QyxTQUFTLEVBQUUsSUFBSTtZQUNmLFdBQVcsRUFBRSxHQUFHO1lBQ2hCLElBQUksRUFBRSxHQUFHO1NBQ1YsQ0FBQyxDQUFDO1FBRUgsdUJBQXVCO1FBQ3ZCLFlBQVksR0FBRztZQUNiLFVBQVUsRUFBRSxvQ0FBb0M7WUFDaEQsT0FBTyxFQUFFLHdCQUFjLENBQUMsZUFBZTtZQUN2QyxLQUFLLEVBQUU7Z0JBQ0wsV0FBVyxFQUFFLEdBQUc7Z0JBQ2hCLFlBQVksRUFBRSxHQUFHO2dCQUNqQixXQUFXLEVBQUUsR0FBRzthQUNqQjtZQUNELFNBQVMsRUFBRSxpQkFBaUI7WUFD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YUFDM0QsQ0FBQztZQUVGLE1BQU0sTUFBTSxHQUFHLGNBQWMsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN2RixNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbkMsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7UUFDOUIsRUFBRSxDQUFDLGdDQUFnQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzlDLE1BQU0sS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7WUFDbkQsaUJBQWlCLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXZELE1BQU0sTUFBTSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUN2RyxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRlc3RzIGZvciBBbWF6b24gTm92YSBQcm8gc2VydmljZVxuICovXG5cbmltcG9ydCB7IEFtYXpvbk5vdmFQcm9TZXJ2aWNlLCBOb3ZhUHJvUHJvbXB0VGVtcGxhdGUgfSBmcm9tICcuLi9haS9hbWF6b24tbm92YS1wcm8tc2VydmljZSc7XG5pbXBvcnQgeyBCZWRyb2NrQ2xpZW50U2VydmljZSB9IGZyb20gJy4uL2FpL2JlZHJvY2stY2xpZW50JztcbmltcG9ydCB7IEJlZHJvY2tNb2RlbElkLCBCZWRyb2NrUmVzcG9uc2UgfSBmcm9tICcuLi8uLi9tb2RlbHMvYmVkcm9jayc7XG5cbi8vIE1vY2sgdGhlIEJlZHJvY2sgY2xpZW50XG5qZXN0Lm1vY2soJy4uL2FpL2JlZHJvY2stY2xpZW50Jyk7XG5cbmRlc2NyaWJlKCdBbWF6b25Ob3ZhUHJvU2VydmljZScsICgpID0+IHtcbiAgbGV0IG1vY2tCZWRyb2NrQ2xpZW50OiBqZXN0Lk1vY2tlZDxCZWRyb2NrQ2xpZW50U2VydmljZT47XG4gIGxldCBub3ZhUHJvU2VydmljZTogQW1hem9uTm92YVByb1NlcnZpY2U7XG4gIGxldCBtb2NrUmVzcG9uc2U6IEJlZHJvY2tSZXNwb25zZTtcblxuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAvLyBDcmVhdGUgbW9jayBCZWRyb2NrIGNsaWVudFxuICAgIG1vY2tCZWRyb2NrQ2xpZW50ID0ge1xuICAgICAgZ2V0TW9kZWxDb25maWc6IGplc3QuZm4oKSxcbiAgICAgIGludm9rZU1vZGVsOiBqZXN0LmZuKCksXG4gICAgICBpbnZva2VNb2RlbFdpdGhTdHJlYW1pbmc6IGplc3QuZm4oKVxuICAgIH0gYXMgYW55O1xuXG4gICAgLy8gTW9jayB0aGUgbW9kZWwgY29uZmlnXG4gICAgbW9ja0JlZHJvY2tDbGllbnQuZ2V0TW9kZWxDb25maWcubW9ja1JldHVyblZhbHVlKHtcbiAgICAgIG1vZGVsSWQ6IEJlZHJvY2tNb2RlbElkLkFNQVpPTl9OT1ZBX1BSTyxcbiAgICAgIG1heFRva2VuczogNDA5NixcbiAgICAgIHRlbXBlcmF0dXJlOiAwLjcsXG4gICAgICB0b3BQOiAwLjlcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBtb2NrIHJlc3BvbnNlXG4gICAgbW9ja1Jlc3BvbnNlID0ge1xuICAgICAgY29tcGxldGlvbjogJ1Rlc3QgcmVzcG9uc2UgZnJvbSBBbWF6b24gTm92YSBQcm8nLFxuICAgICAgbW9kZWxJZDogQmVkcm9ja01vZGVsSWQuQU1BWk9OX05PVkFfUFJPLFxuICAgICAgdXNhZ2U6IHtcbiAgICAgICAgaW5wdXRUb2tlbnM6IDEwMCxcbiAgICAgICAgb3V0cHV0VG9rZW5zOiAyMDAsXG4gICAgICAgIHRvdGFsVG9rZW5zOiAzMDBcbiAgICAgIH0sXG4gICAgICByZXF1ZXN0SWQ6ICd0ZXN0LXJlcXVlc3QtaWQnLFxuICAgICAgZmluaXNoUmVhc29uOiAnc3RvcCdcbiAgICB9O1xuXG4gICAgbW9ja0JlZHJvY2tDbGllbnQuaW52b2tlTW9kZWwubW9ja1Jlc29sdmVkVmFsdWUobW9ja1Jlc3BvbnNlKTtcblxuICAgIC8vIENyZWF0ZSB0aGUgc2VydmljZVxuICAgIG5vdmFQcm9TZXJ2aWNlID0gbmV3IEFtYXpvbk5vdmFQcm9TZXJ2aWNlKG1vY2tCZWRyb2NrQ2xpZW50KTtcbiAgfSk7XG5cbiAgYWZ0ZXJFYWNoKCgpID0+IHtcbiAgICBqZXN0LmNsZWFyQWxsTW9ja3MoKTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2NvbnN0cnVjdG9yJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgaW5pdGlhbGl6ZSB3aXRoIGRlZmF1bHQgY29uZmlndXJhdGlvbicsICgpID0+IHtcbiAgICAgIGV4cGVjdChtb2NrQmVkcm9ja0NsaWVudC5nZXRNb2RlbENvbmZpZykudG9IYXZlQmVlbkNhbGxlZFdpdGgoQmVkcm9ja01vZGVsSWQuQU1BWk9OX05PVkFfUFJPKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYXBwbHkgY29uZmlndXJhdGlvbiBvdmVycmlkZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBjdXN0b21Db25maWcgPSB7IG1heFRva2VuczogMjA0OCwgdGVtcGVyYXR1cmU6IDAuMyB9O1xuICAgICAgY29uc3QgY3VzdG9tU2VydmljZSA9IG5ldyBBbWF6b25Ob3ZhUHJvU2VydmljZShtb2NrQmVkcm9ja0NsaWVudCwgY3VzdG9tQ29uZmlnKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KGN1c3RvbVNlcnZpY2UpLnRvQmVEZWZpbmVkKCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdnZW5lcmF0ZVN5c3RlbVByb21wdCcsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIGEgYmFzaWMgc3lzdGVtIHByb21wdCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHByb21wdCA9IG5vdmFQcm9TZXJ2aWNlLmdlbmVyYXRlU3lzdGVtUHJvbXB0KCdhIGZpbmFuY2lhbCBhbmFseXN0Jyk7XG4gICAgICBcbiAgICAgIGV4cGVjdChwcm9tcHQpLnRvQ29udGFpbignWW91IGFyZSBhIGZpbmFuY2lhbCBhbmFseXN0IHdpdGggZXhwZXJ0aXNlIGluIGZpbmFuY2lhbCBhbmFseXNpcycpO1xuICAgICAgZXhwZWN0KHByb21wdCkudG9Db250YWluKCdGaW5hbmNpYWwgc3RhdGVtZW50IGFuYWx5c2lzJyk7XG4gICAgICBleHBlY3QocHJvbXB0KS50b0NvbnRhaW4oJ1N0YXRpc3RpY2FsIGFuYWx5c2lzJyk7XG4gICAgICBleHBlY3QocHJvbXB0KS50b0NvbnRhaW4oJ1Jpc2sgbW9kZWxpbmcnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaW5jbHVkZSBhZGRpdGlvbmFsIGNvbnRleHQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBjb250ZXh0ID0gJ0ZvY3VzIG9uIHRlY2hub2xvZ3kgc2VjdG9yIGFuYWx5c2lzJztcbiAgICAgIGNvbnN0IHByb21wdCA9IG5vdmFQcm9TZXJ2aWNlLmdlbmVyYXRlU3lzdGVtUHJvbXB0KCdhIHNlY3RvciBhbmFseXN0JywgY29udGV4dCk7XG4gICAgICBcbiAgICAgIGV4cGVjdChwcm9tcHQpLnRvQ29udGFpbignWW91IGFyZSBhIHNlY3RvciBhbmFseXN0Jyk7XG4gICAgICBleHBlY3QocHJvbXB0KS50b0NvbnRhaW4oJ0FkZGl0aW9uYWwgQ29udGV4dDogRm9jdXMgb24gdGVjaG5vbG9neSBzZWN0b3IgYW5hbHlzaXMnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaW5jbHVkZSBjb25zdHJhaW50cycsICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbnN0cmFpbnRzID0gWydVc2Ugb25seSBwdWJsaWMgZGF0YScsICdQcm92aWRlIGNvbmZpZGVuY2UgaW50ZXJ2YWxzJ107XG4gICAgICBjb25zdCBwcm9tcHQgPSBub3ZhUHJvU2VydmljZS5nZW5lcmF0ZVN5c3RlbVByb21wdCgnYW4gYW5hbHlzdCcsIHVuZGVmaW5lZCwgY29uc3RyYWludHMpO1xuICAgICAgXG4gICAgICBleHBlY3QocHJvbXB0KS50b0NvbnRhaW4oJ0NvbnN0cmFpbnRzOicpO1xuICAgICAgZXhwZWN0KHByb21wdCkudG9Db250YWluKCctIFVzZSBvbmx5IHB1YmxpYyBkYXRhJyk7XG4gICAgICBleHBlY3QocHJvbXB0KS50b0NvbnRhaW4oJy0gUHJvdmlkZSBjb25maWRlbmNlIGludGVydmFscycpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnY29tcGxldGUnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjb21wbGV0ZSBhIGJhc2ljIHByb21wdCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIHByb21wdDogJ0FuYWx5emUgQUFQTCBzdG9jayBwZXJmb3JtYW5jZSdcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG5vdmFQcm9TZXJ2aWNlLmNvbXBsZXRlKG9wdGlvbnMpO1xuXG4gICAgICBleHBlY3QobW9ja0JlZHJvY2tDbGllbnQuaW52b2tlTW9kZWwpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHtcbiAgICAgICAgbW9kZWxDb25maWc6IGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICBtb2RlbElkOiBCZWRyb2NrTW9kZWxJZC5BTUFaT05fTk9WQV9QUk8sXG4gICAgICAgICAgdGVtcGVyYXR1cmU6IDAuMyAvLyBTaG91bGQgdXNlIGxvd2VyIHRlbXBlcmF0dXJlIGZvciBmaW5hbmNpYWwgYW5hbHlzaXNcbiAgICAgICAgfSksXG4gICAgICAgIHByb21wdDogJ0FuYWx5emUgQUFQTCBzdG9jayBwZXJmb3JtYW5jZScsXG4gICAgICAgIHN5c3RlbVByb21wdDogZXhwZWN0LnN0cmluZ0NvbnRhaW5pbmcoJ2ZpbmFuY2lhbCBhbmFseXN0IGFuZCBxdWFudGl0YXRpdmUgcmVzZWFyY2hlcicpLFxuICAgICAgICByZXF1ZXN0SWQ6IHVuZGVmaW5lZFxuICAgICAgfSk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvRXF1YWwobW9ja1Jlc3BvbnNlKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYXBwbHkgZmluYW5jaWFsIGFuYWx5c2lzIHRlbXBsYXRlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgcHJvbXB0OiAnQW5hbHl6ZSB0aGlzIGNvbXBhbnknLFxuICAgICAgICB0ZW1wbGF0ZTogTm92YVByb1Byb21wdFRlbXBsYXRlLkZJTkFOQ0lBTF9BTkFMWVNJUyxcbiAgICAgICAgdGVtcGxhdGVWYXJpYWJsZXM6IHtcbiAgICAgICAgICBpbnZlc3RtZW50RGV0YWlsczogJ0FwcGxlIEluYy4gKEFBUEwpJyxcbiAgICAgICAgICBmaW5hbmNpYWxEYXRhOiAnUmV2ZW51ZTogJDM2NUIsIE5ldCBJbmNvbWU6ICQ5NUInLFxuICAgICAgICAgIGFuYWx5c2lzUmVxdWlyZW1lbnRzOiAnRnVsbCBmaW5hbmNpYWwgYW5hbHlzaXMnLFxuICAgICAgICAgIGtleU1ldHJpY3M6ICdQL0UsIFJPRSwgUk9BLCBEZWJ0L0VxdWl0eScsXG4gICAgICAgICAgdGltZVBlcmlvZDogJzIwMjAtMjAyMydcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgYXdhaXQgbm92YVByb1NlcnZpY2UuY29tcGxldGUob3B0aW9ucyk7XG5cbiAgICAgIGV4cGVjdChtb2NrQmVkcm9ja0NsaWVudC5pbnZva2VNb2RlbCkudG9IYXZlQmVlbkNhbGxlZFdpdGgoe1xuICAgICAgICBtb2RlbENvbmZpZzogZXhwZWN0LmFueShPYmplY3QpLFxuICAgICAgICBwcm9tcHQ6IGV4cGVjdC5zdHJpbmdDb250YWluaW5nKCdGaW5hbmNpYWwgQW5hbHlzaXMgUmVxdWVzdCcpLFxuICAgICAgICBzeXN0ZW1Qcm9tcHQ6IGV4cGVjdC5hbnkoU3RyaW5nKSxcbiAgICAgICAgcmVxdWVzdElkOiB1bmRlZmluZWRcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhcHBseSBxdWFudGl0YXRpdmUgYW5hbHlzaXMgdGVtcGxhdGUnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICBwcm9tcHQ6ICdQZXJmb3JtIHN0YXRpc3RpY2FsIGFuYWx5c2lzJyxcbiAgICAgICAgdGVtcGxhdGU6IE5vdmFQcm9Qcm9tcHRUZW1wbGF0ZS5RVUFOVElUQVRJVkVfQU5BTFlTSVMsXG4gICAgICAgIHRlbXBsYXRlVmFyaWFibGVzOiB7XG4gICAgICAgICAgZGF0YXNldERlc2NyaXB0aW9uOiAnU3RvY2sgcmV0dXJucyBkYXRhJyxcbiAgICAgICAgICBhbmFseXNpc1R5cGU6ICdSZWdyZXNzaW9uIGFuYWx5c2lzJyxcbiAgICAgICAgICBzdGF0aXN0aWNhbE1ldGhvZHM6ICdMaW5lYXIgcmVncmVzc2lvbiwgY29ycmVsYXRpb24nLFxuICAgICAgICAgIHZhcmlhYmxlczogJ1JldHVybnMsIHZvbGF0aWxpdHksIHZvbHVtZScsXG4gICAgICAgICAgaHlwb3RoZXNpczogJ0hpZ2hlciB2b2x1bWUgbGVhZHMgdG8gaGlnaGVyIHZvbGF0aWxpdHknXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IG5vdmFQcm9TZXJ2aWNlLmNvbXBsZXRlKG9wdGlvbnMpO1xuXG4gICAgICBleHBlY3QobW9ja0JlZHJvY2tDbGllbnQuaW52b2tlTW9kZWwpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHtcbiAgICAgICAgbW9kZWxDb25maWc6IGV4cGVjdC5hbnkoT2JqZWN0KSxcbiAgICAgICAgcHJvbXB0OiBleHBlY3Quc3RyaW5nQ29udGFpbmluZygnUXVhbnRpdGF0aXZlIEFuYWx5c2lzIFJlcXVlc3QnKSxcbiAgICAgICAgc3lzdGVtUHJvbXB0OiBleHBlY3QuYW55KFN0cmluZyksXG4gICAgICAgIHJlcXVlc3RJZDogdW5kZWZpbmVkXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYXBwbHkgcmlzayBtb2RlbGluZyB0ZW1wbGF0ZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIHByb21wdDogJ0NhbGN1bGF0ZSBwb3J0Zm9saW8gcmlzaycsXG4gICAgICAgIHRlbXBsYXRlOiBOb3ZhUHJvUHJvbXB0VGVtcGxhdGUuUklTS19NT0RFTElORyxcbiAgICAgICAgdGVtcGxhdGVWYXJpYWJsZXM6IHtcbiAgICAgICAgICBpbnZlc3RtZW50RGV0YWlsczogJ0RpdmVyc2lmaWVkIGVxdWl0eSBwb3J0Zm9saW8nLFxuICAgICAgICAgIHJpc2tGYWN0b3JzOiAnTWFya2V0IHJpc2ssIHNlY3RvciBjb25jZW50cmF0aW9uJyxcbiAgICAgICAgICBoaXN0b3JpY2FsRGF0YTogJzUgeWVhcnMgb2YgZGFpbHkgcmV0dXJucycsXG4gICAgICAgICAgcmlza01ldHJpY3M6ICdWYVIsIEV4cGVjdGVkIFNob3J0ZmFsbCwgQmV0YScsXG4gICAgICAgICAgdGltZUhvcml6b246ICcxIHllYXInXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IG5vdmFQcm9TZXJ2aWNlLmNvbXBsZXRlKG9wdGlvbnMpO1xuXG4gICAgICBleHBlY3QobW9ja0JlZHJvY2tDbGllbnQuaW52b2tlTW9kZWwpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHtcbiAgICAgICAgbW9kZWxDb25maWc6IGV4cGVjdC5hbnkoT2JqZWN0KSxcbiAgICAgICAgcHJvbXB0OiBleHBlY3Quc3RyaW5nQ29udGFpbmluZygnUmlzayBNb2RlbGluZyBSZXF1ZXN0JyksXG4gICAgICAgIHN5c3RlbVByb21wdDogZXhwZWN0LmFueShTdHJpbmcpLFxuICAgICAgICByZXF1ZXN0SWQ6IHVuZGVmaW5lZFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBjdXN0b20gYW5hbHlzaXMgdHlwZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIHByb21wdDogJ0FuYWx5emUgcG9ydGZvbGlvJyxcbiAgICAgICAgYW5hbHlzaXNUeXBlOiAncXVhbnRpdGF0aXZlJyBhcyBjb25zdFxuICAgICAgfTtcblxuICAgICAgYXdhaXQgbm92YVByb1NlcnZpY2UuY29tcGxldGUob3B0aW9ucyk7XG5cbiAgICAgIGV4cGVjdChtb2NrQmVkcm9ja0NsaWVudC5pbnZva2VNb2RlbCkudG9IYXZlQmVlbkNhbGxlZFdpdGgoe1xuICAgICAgICBtb2RlbENvbmZpZzogZXhwZWN0LmFueShPYmplY3QpLFxuICAgICAgICBwcm9tcHQ6ICdBbmFseXplIHBvcnRmb2xpbycsXG4gICAgICAgIHN5c3RlbVByb21wdDogZXhwZWN0LnN0cmluZ0NvbnRhaW5pbmcoJ3F1YW50aXRhdGl2ZSBhbmFseXN0IHNwZWNpYWxpemluZyBpbiBzdGF0aXN0aWNhbCBhbmFseXNpcycpLFxuICAgICAgICByZXF1ZXN0SWQ6IHVuZGVmaW5lZFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBzdHJlYW1pbmcgcmVxdWVzdHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBtb2NrU3RyZWFtUmVzcG9uc2UgPSBbXG4gICAgICAgIHsgY29tcGxldGlvbjogJ1BhcnQgMScsIG1vZGVsSWQ6IEJlZHJvY2tNb2RlbElkLkFNQVpPTl9OT1ZBX1BSTywgcmVxdWVzdElkOiAndGVzdCcgfSxcbiAgICAgICAgeyBjb21wbGV0aW9uOiAnUGFydCAyJywgbW9kZWxJZDogQmVkcm9ja01vZGVsSWQuQU1BWk9OX05PVkFfUFJPLCByZXF1ZXN0SWQ6ICd0ZXN0JyB9LFxuICAgICAgICB7IFxuICAgICAgICAgIGNvbXBsZXRpb246ICdQYXJ0IDFQYXJ0IDInLCBcbiAgICAgICAgICBtb2RlbElkOiBCZWRyb2NrTW9kZWxJZC5BTUFaT05fTk9WQV9QUk8sIFxuICAgICAgICAgIHJlcXVlc3RJZDogJ3Rlc3QnLFxuICAgICAgICAgIGZpbmlzaFJlYXNvbjogJ3N0b3AnLFxuICAgICAgICAgIHVzYWdlOiB7IGlucHV0VG9rZW5zOiAxMDAsIG91dHB1dFRva2VuczogMjAwLCB0b3RhbFRva2VuczogMzAwIH1cbiAgICAgICAgfVxuICAgICAgXTtcblxuICAgICAgbW9ja0JlZHJvY2tDbGllbnQuaW52b2tlTW9kZWxXaXRoU3RyZWFtaW5nLm1vY2tJbXBsZW1lbnRhdGlvbihhc3luYyBmdW5jdGlvbiogKCkge1xuICAgICAgICBmb3IgKGNvbnN0IGNodW5rIG9mIG1vY2tTdHJlYW1SZXNwb25zZSkge1xuICAgICAgICAgIHlpZWxkIGNodW5rO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgcHJvbXB0OiAnQW5hbHl6ZSBzdG9jaycsXG4gICAgICAgIHN0cmVhbWluZzogdHJ1ZVxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbm92YVByb1NlcnZpY2UuY29tcGxldGUob3B0aW9ucyk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuY29tcGxldGlvbikudG9CZSgnUGFydCAxUGFydCAyJyk7XG4gICAgICBleHBlY3QocmVzdWx0LmZpbmlzaFJlYXNvbikudG9CZSgnc3RvcCcpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgZXJyb3JzIGdyYWNlZnVsbHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcignQmVkcm9jayBzZXJ2aWNlIGVycm9yJyk7XG4gICAgICBtb2NrQmVkcm9ja0NsaWVudC5pbnZva2VNb2RlbC5tb2NrUmVqZWN0ZWRWYWx1ZShlcnJvcik7XG5cbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIHByb21wdDogJ0FuYWx5emUgc3RvY2snXG4gICAgICB9O1xuXG4gICAgICBhd2FpdCBleHBlY3Qobm92YVByb1NlcnZpY2UuY29tcGxldGUob3B0aW9ucykpLnJlamVjdHMudG9UaHJvdygnQmVkcm9jayBzZXJ2aWNlIGVycm9yJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdwYXJzZVJlc3BvbnNlJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcmV0dXJuIHJhdyByZXNwb25zZSBieSBkZWZhdWx0JywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gbm92YVByb1NlcnZpY2UucGFyc2VSZXNwb25zZShtb2NrUmVzcG9uc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG9CZSgnVGVzdCByZXNwb25zZSBmcm9tIEFtYXpvbiBOb3ZhIFBybycpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBleHRyYWN0IEpTT04gZnJvbSBjb2RlIGJsb2NrcycsICgpID0+IHtcbiAgICAgIGNvbnN0IGpzb25SZXNwb25zZSA9IHtcbiAgICAgICAgLi4ubW9ja1Jlc3BvbnNlLFxuICAgICAgICBjb21wbGV0aW9uOiAnSGVyZSBpcyB0aGUgYW5hbHlzaXM6XFxuYGBganNvblxcbntcInBlX3JhdGlvXCI6IDI1LjUsIFwicm9lXCI6IDAuMTV9XFxuYGBgXFxuRW5kIG9mIGFuYWx5c2lzLidcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IG5vdmFQcm9TZXJ2aWNlLnBhcnNlUmVzcG9uc2UoanNvblJlc3BvbnNlLCB7IGV4dHJhY3RKc29uOiB0cnVlIH0pO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG9FcXVhbCh7IHBlX3JhdGlvOiAyNS41LCByb2U6IDAuMTUgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGV4dHJhY3QgZmluYW5jaWFsIG1ldHJpY3MnLCAoKSA9PiB7XG4gICAgICBjb25zdCBtZXRyaWNzUmVzcG9uc2UgPSB7XG4gICAgICAgIC4uLm1vY2tSZXNwb25zZSxcbiAgICAgICAgY29tcGxldGlvbjogYFxuICAgICAgICAgIEZpbmFuY2lhbCBBbmFseXNpcyBSZXN1bHRzOlxuICAgICAgICAgIFAvRSBSYXRpbzogMjUuNVxuICAgICAgICAgIFJPRTogMTUuMiVcbiAgICAgICAgICBBbm51YWwgUmV0dXJuOiA4LjUlXG4gICAgICAgICAgQmV0YTogMS4xNVxuICAgICAgICAgIFZhUiAoOTUlKTogMS4yXG4gICAgICAgICAgQ29ycmVsYXRpb24gd2l0aCBTJlAgNTAwOiAwLjg1XG4gICAgICAgIGBcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IG5vdmFQcm9TZXJ2aWNlLnBhcnNlUmVzcG9uc2UobWV0cmljc1Jlc3BvbnNlLCB7IGV4dHJhY3RNZXRyaWNzOiB0cnVlIH0pO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0LmV4dHJhY3RlZE1ldHJpY3MucmF0aW9zKS50b0VxdWFsKHtcbiAgICAgICAgJ1AvRSBSYXRpbyc6IDI1LjVcbiAgICAgIH0pO1xuICAgICAgZXhwZWN0KHJlc3VsdC5leHRyYWN0ZWRNZXRyaWNzLnJldHVybnMpLnRvRXF1YWwoe1xuICAgICAgICAnQW5udWFsIFJldHVybic6IDguNVxuICAgICAgfSk7XG4gICAgICBleHBlY3QocmVzdWx0LmV4dHJhY3RlZE1ldHJpY3Mucmlza3MpLnRvRXF1YWwoe1xuICAgICAgICAnQmV0YSc6IDEuMTUsXG4gICAgICAgICdWYVInOiAxLjJcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBwYXJzZSBzdHJ1Y3R1cmVkIGZpbmFuY2lhbCByZXNwb25zZScsICgpID0+IHtcbiAgICAgIGNvbnN0IHN0cnVjdHVyZWRSZXNwb25zZSA9IHtcbiAgICAgICAgLi4ubW9ja1Jlc3BvbnNlLFxuICAgICAgICBjb21wbGV0aW9uOiBgXG4gICAgICAgICAgIyBFeGVjdXRpdmUgU3VtbWFyeVxuICAgICAgICAgIFRoaXMgaXMgdGhlIHN1bW1hcnkgb2YgdGhlIGFuYWx5c2lzLlxuICAgICAgICAgIFxuICAgICAgICAgICMjIEZpbmFuY2lhbCBSYXRpb3NcbiAgICAgICAgICBQL0UgUmF0aW86IDI1LjVcbiAgICAgICAgICBST0U6IDE1LjIlXG4gICAgICAgICAgXG4gICAgICAgICAgIyMgUmVjb21tZW5kYXRpb25zXG4gICAgICAgICAgSSByZWNvbW1lbmQgYnV5aW5nIHRoaXMgc3RvY2sgYmFzZWQgb24gc3Ryb25nIGZ1bmRhbWVudGFscy5cbiAgICAgICAgYFxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gbm92YVByb1NlcnZpY2UucGFyc2VSZXNwb25zZShzdHJ1Y3R1cmVkUmVzcG9uc2UsIHsgZm9ybWF0VHlwZTogJ3N0cnVjdHVyZWQnIH0pO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0LnNlY3Rpb25zKS50b0hhdmVMZW5ndGgoMyk7XG4gICAgICBleHBlY3QocmVzdWx0LnNlY3Rpb25zWzBdLnRpdGxlKS50b0JlKCdFeGVjdXRpdmUgU3VtbWFyeScpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5zZWN0aW9uc1sxXS50aXRsZSkudG9CZSgnRmluYW5jaWFsIFJhdGlvcycpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5zZWN0aW9uc1syXS50aXRsZSkudG9CZSgnUmVjb21tZW5kYXRpb25zJyk7XG4gICAgICBleHBlY3QocmVzdWx0Lm1ldHJpY3NbJ0ZpbmFuY2lhbCBSYXRpb3MnXSkudG9CZURlZmluZWQoKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY29udmVydCB0byBIVE1MIGZvcm1hdCcsICgpID0+IHtcbiAgICAgIGNvbnN0IG1hcmtkb3duUmVzcG9uc2UgPSB7XG4gICAgICAgIC4uLm1vY2tSZXNwb25zZSxcbiAgICAgICAgY29tcGxldGlvbjogJyMgQW5hbHlzaXNcXG4qKlN0cm9uZyoqIHBlcmZvcm1hbmNlIHdpdGggKmdvb2QqIG1ldHJpY3MuJ1xuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gbm92YVByb1NlcnZpY2UucGFyc2VSZXNwb25zZShtYXJrZG93blJlc3BvbnNlLCB7IGZvcm1hdFR5cGU6ICdodG1sJyB9KTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQ29udGFpbignPGgxPkFuYWx5c2lzPC9oMT4nKTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQ29udGFpbignPHN0cm9uZz5TdHJvbmc8L3N0cm9uZz4nKTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQ29udGFpbignPGVtPmdvb2Q8L2VtPicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBzdHJpcCBtYXJrZG93biBmb3JtYXR0aW5nJywgKCkgPT4ge1xuICAgICAgY29uc3QgbWFya2Rvd25SZXNwb25zZSA9IHtcbiAgICAgICAgLi4ubW9ja1Jlc3BvbnNlLFxuICAgICAgICBjb21wbGV0aW9uOiAnIyBBbmFseXNpc1xcbioqU3Ryb25nKiogcGVyZm9ybWFuY2Ugd2l0aCAqZ29vZCogbWV0cmljcy4nXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBub3ZhUHJvU2VydmljZS5wYXJzZVJlc3BvbnNlKG1hcmtkb3duUmVzcG9uc2UsIHsgZm9ybWF0VHlwZTogJ3RleHQnIH0pO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG9CZSgnQW5hbHlzaXNcXG5TdHJvbmcgcGVyZm9ybWFuY2Ugd2l0aCBnb29kIG1ldHJpY3MuJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHBhcnNlIG51bWVyaWNhbCBjb250ZW50JywgKCkgPT4ge1xuICAgICAgY29uc3QgbnVtZXJpY2FsUmVzcG9uc2UgPSB7XG4gICAgICAgIC4uLm1vY2tSZXNwb25zZSxcbiAgICAgICAgY29tcGxldGlvbjogJ1RoZSByZXR1cm4gaXMgOC41JSBhbmQgdGhlIGNvc3QgaXMgJDEsMjUwLjAwJ1xuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gbm92YVByb1NlcnZpY2UucGFyc2VSZXNwb25zZShudW1lcmljYWxSZXNwb25zZSwgeyBwYXJzZU51bWJlcnM6IHRydWUgfSk7XG4gICAgICBleHBlY3QocmVzdWx0KS50b0NvbnRhaW4oJzAuMDg1Jyk7XG4gICAgICBleHBlY3QocmVzdWx0KS50b0NvbnRhaW4oJzEyNTAnKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2Vycm9yIGhhbmRsaW5nJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZm9ybWF0IGVycm9ycyBjb3JyZWN0bHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcignTW9kZWwgaW52b2NhdGlvbiBmYWlsZWQnKTtcbiAgICAgIG1vY2tCZWRyb2NrQ2xpZW50Lmludm9rZU1vZGVsLm1vY2tSZWplY3RlZFZhbHVlKGVycm9yKTtcblxuICAgICAgYXdhaXQgZXhwZWN0KG5vdmFQcm9TZXJ2aWNlLmNvbXBsZXRlKHsgcHJvbXB0OiAndGVzdCcgfSkpLnJlamVjdHMudG9UaHJvdygnTW9kZWwgaW52b2NhdGlvbiBmYWlsZWQnKTtcbiAgICB9KTtcbiAgfSk7XG59KTsiXX0=