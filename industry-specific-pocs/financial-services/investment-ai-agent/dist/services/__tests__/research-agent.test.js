"use strict";
/**
 * Tests for Research Agent
 */
Object.defineProperty(exports, "__esModule", { value: true });
const research_agent_1 = require("../ai/research-agent");
const claude_haiku_service_1 = require("../ai/claude-haiku-service");
const web_search_service_1 = require("../web-search-service");
const proprietary_data_service_1 = require("../proprietary-data-service");
// Mock the dependencies
jest.mock('../ai/claude-haiku-service');
jest.mock('../web-search-service');
jest.mock('../proprietary-data-service');
jest.mock('../market-data-service');
describe('ResearchAgent', () => {
    let researchAgent;
    let mockClaudeHaikuService;
    let mockWebSearchService;
    let mockProprietaryDataService;
    let mockMarketDataService;
    beforeEach(() => {
        mockClaudeHaikuService = new claude_haiku_service_1.ClaudeHaikuService({});
        mockWebSearchService = new web_search_service_1.WebSearchService('test-key');
        mockProprietaryDataService = new proprietary_data_service_1.ProprietaryDataService({});
        mockMarketDataService = {};
        researchAgent = new research_agent_1.ResearchAgent(mockClaudeHaikuService, mockWebSearchService, mockProprietaryDataService, mockMarketDataService);
    });
    describe('processResearchRequest', () => {
        it('should process web search research request', async () => {
            // Arrange
            const request = {
                topic: 'Tesla stock analysis',
                researchType: 'web-search',
                parameters: {
                    timeframe: 'past-month',
                    depth: 'standard',
                    maxResults: 10
                }
            };
            const mockSearchResult = {
                results: [
                    {
                        title: 'Tesla Stock Analysis Q4 2024',
                        url: 'https://example.com/tesla-analysis',
                        snippet: 'Tesla shows strong performance in Q4 2024 with increased deliveries.',
                        source: 'Financial Times',
                        publishDate: new Date('2024-12-01'),
                        relevanceScore: 0.9
                    }
                ],
                totalResults: 1,
                executionTime: 1000
            };
            const mockExtractionResponse = {
                completion: JSON.stringify({
                    entities: [
                        { name: 'Tesla', type: 'company', confidence: 0.95, mentions: 5, context: ['stock analysis'] }
                    ],
                    keyMetrics: [
                        { name: 'stock price', value: 250, unit: 'USD', context: 'current price', source: 'market data', confidence: 0.9 }
                    ],
                    sentiments: [
                        { text: 'Tesla shows strong performance', sentiment: 'positive', score: 0.8, confidence: 0.9, aspects: [] }
                    ],
                    topics: [
                        { topic: 'stock performance', relevance: 0.9, keywords: ['Tesla', 'stock', 'performance'], frequency: 3 }
                    ],
                    relationships: [
                        { entity1: 'Tesla', entity2: 'stock market', relationship: 'trades_on', strength: 0.9, context: 'public company' }
                    ]
                })
            };
            const mockTrendsResponse = {
                completion: JSON.stringify([
                    {
                        trend: 'Electric vehicle adoption',
                        direction: 'upward',
                        strength: 'strong',
                        timeframe: 'past-month',
                        confidence: 0.85,
                        supportingEvidence: ['Increased deliveries', 'Market expansion'],
                        implications: ['Positive for Tesla stock']
                    }
                ])
            };
            const mockPatternsResponse = {
                completion: JSON.stringify([
                    {
                        pattern: 'Quarterly delivery cycles',
                        type: 'cyclical',
                        frequency: 'quarterly',
                        strength: 0.8,
                        confidence: 0.9,
                        description: 'Tesla shows cyclical delivery patterns',
                        historicalOccurrences: 12,
                        predictiveValue: 'high'
                    }
                ])
            };
            mockWebSearchService.performWebSearch.mockResolvedValue(mockSearchResult);
            mockClaudeHaikuService.complete = jest.fn()
                .mockResolvedValueOnce(mockExtractionResponse)
                .mockResolvedValueOnce(mockTrendsResponse)
                .mockResolvedValueOnce(mockPatternsResponse)
                .mockResolvedValue({ completion: 'Tesla research shows positive trends in electric vehicle market.' });
            // Act
            const result = await researchAgent.processResearchRequest(request);
            // Assert
            expect(result).toBeDefined();
            expect(result.summary).toContain('Tesla');
            expect(result.keyFindings).toHaveLength(3); // 1 from entities + 1 from trends + 1 from patterns
            expect(result.trends).toHaveLength(1);
            expect(result.patterns).toHaveLength(1);
            expect(result.sources).toHaveLength(1);
            expect(result.confidence).toBeGreaterThan(0);
            expect(result.recommendations.some(rec => rec.includes('Consider increasing exposure to Tesla stock analysis'))).toBe(true);
            expect(result.executionTime).toBeGreaterThan(0);
            expect(mockWebSearchService.performWebSearch).toHaveBeenCalledWith('Tesla stock analysis', expect.objectContaining({
                depth: 'basic',
                timeframe: 'past-month',
                maxResults: 10
            }));
        });
        it('should process deep research request', async () => {
            // Arrange
            const request = {
                topic: 'AI investment opportunities',
                researchType: 'deep-research',
                parameters: {
                    depth: 'comprehensive',
                    focusAreas: ['machine learning', 'automation'],
                    maxResults: 20
                }
            };
            const mockDeepResearchResult = {
                summary: 'AI investment opportunities show significant growth potential across multiple sectors.',
                keyFindings: [
                    'Machine learning adoption is accelerating',
                    'Automation investments are increasing'
                ],
                sources: [
                    {
                        title: 'AI Investment Trends 2024',
                        url: 'https://example.com/ai-trends',
                        publisher: 'Tech Research',
                        publishDate: new Date('2024-11-15'),
                        relevance: 0.95,
                        excerpts: ['AI investments reached record highs in 2024']
                    }
                ],
                relatedTopics: ['machine learning', 'automation', 'robotics'],
                confidence: 0.88
            };
            const mockExtractionResponse = {
                completion: JSON.stringify({
                    entities: [
                        { name: 'AI', type: 'concept', confidence: 0.9, mentions: 10, context: ['investment', 'technology'] }
                    ],
                    keyMetrics: [],
                    sentiments: [
                        { text: 'AI shows significant growth potential', sentiment: 'positive', score: 0.85, confidence: 0.9, aspects: [] }
                    ],
                    topics: [
                        { topic: 'AI investment', relevance: 0.95, keywords: ['AI', 'investment', 'growth'], frequency: 8 }
                    ],
                    relationships: []
                })
            };
            mockWebSearchService.performDeepResearch.mockResolvedValue(mockDeepResearchResult);
            mockClaudeHaikuService.complete = jest.fn().mockResolvedValue(mockExtractionResponse);
            // Act
            const result = await researchAgent.processResearchRequest(request);
            // Assert
            expect(result).toBeDefined();
            expect(result.summary).toBe(mockDeepResearchResult.summary);
            expect(result.keyFindings).toEqual(mockDeepResearchResult.keyFindings);
            expect(result.sources).toEqual(mockDeepResearchResult.sources);
            expect(result.confidence).toBe(mockDeepResearchResult.confidence);
            expect(result.relatedTopics).toEqual(mockDeepResearchResult.relatedTopics);
            expect(mockWebSearchService.performDeepResearch).toHaveBeenCalledWith('AI investment opportunities', expect.objectContaining({
                depth: 'comprehensive',
                focusAreas: ['machine learning', 'automation']
            }));
        });
        it('should process market analysis request', async () => {
            // Arrange
            const request = {
                topic: 'AAPL',
                researchType: 'market-analysis',
                parameters: {
                    timeframe: 'past-week',
                    includeMarketData: true
                }
            };
            const mockMarketData = {
                data: [
                    {
                        symbol: 'AAPL',
                        timestamp: new Date('2024-12-01'),
                        price: 150.25,
                        volume: 1000000,
                        change: 2.5,
                        changePercent: 1.69
                    }
                ],
                metadata: {
                    source: 'market-provider',
                    lastUpdated: new Date(),
                    symbols: ['AAPL']
                }
            };
            // Mock market data service doesn't have getMarketData method in current implementation
            mockClaudeHaikuService.complete = jest.fn().mockResolvedValue({
                completion: 'AAPL market analysis shows positive momentum with strong trading volume.'
            });
            // Act
            const result = await researchAgent.processResearchRequest(request);
            // Assert
            expect(result).toBeDefined();
            expect(result.summary).toContain('AAPL');
            expect(result.marketInsights).toBeDefined();
            expect(result.confidence).toBeGreaterThan(0.5);
            // Market data service method calls are mocked internally
        });
        it('should process proprietary analysis request', async () => {
            // Arrange
            const request = {
                topic: 'renewable energy',
                researchType: 'proprietary-analysis',
                parameters: {
                    timeframe: 'past-year',
                    includeProprietaryData: true
                }
            };
            const mockProprietaryResult = {
                results: [
                    {
                        id: 'prop-1',
                        title: 'Internal Renewable Energy Analysis',
                        content: 'Our analysis shows strong growth in renewable energy sector',
                        relevance: 0.9,
                        lastModified: new Date('2024-11-01')
                    }
                ],
                sources: [
                    {
                        title: 'Internal Renewable Energy Analysis',
                        url: 'internal://renewable-analysis',
                        source: 'Internal Research',
                        lastModified: new Date('2024-11-01'),
                        relevance: 0.9,
                        summary: 'Strong growth in renewable energy sector'
                    }
                ],
                confidence: 0.85,
                totalResults: 1
            };
            // Mock proprietary data service doesn't have queryData method in current implementation
            mockClaudeHaikuService.complete = jest.fn().mockResolvedValue({
                completion: 'Proprietary analysis of renewable energy shows significant investment opportunities.'
            });
            // Act
            const result = await researchAgent.processResearchRequest(request);
            // Assert
            expect(result).toBeDefined();
            expect(result.summary).toContain('renewable energy');
            expect(result.proprietaryInsights).toBeDefined();
            expect(result.sources).toHaveLength(1);
            expect(result.confidence).toBe(0.85);
            // Proprietary data service method calls are mocked internally
        });
        it('should process comprehensive research request', async () => {
            // Arrange
            const request = {
                topic: 'cryptocurrency market',
                researchType: 'comprehensive',
                parameters: {
                    includeMarketData: true,
                    includeProprietaryData: true,
                    depth: 'comprehensive'
                }
            };
            // Mock all the individual research methods
            const mockWebResult = {
                summary: 'Web research on cryptocurrency market',
                keyFindings: ['Web finding 1', 'Web finding 2'],
                trends: [],
                patterns: [],
                sources: [],
                confidence: 0.8,
                recommendations: ['Web recommendation'],
                relatedTopics: ['bitcoin', 'ethereum'],
                executionTime: 1000
            };
            const mockMarketResult = {
                summary: 'Market analysis of cryptocurrency',
                keyFindings: ['Market finding 1'],
                trends: [],
                patterns: [],
                sources: [],
                marketInsights: [],
                confidence: 0.75,
                recommendations: ['Market recommendation'],
                relatedTopics: ['trading', 'volatility'],
                executionTime: 800
            };
            const mockProprietaryResult = {
                summary: 'Proprietary cryptocurrency analysis',
                keyFindings: ['Proprietary finding 1'],
                trends: [],
                patterns: [],
                sources: [],
                proprietaryInsights: [],
                confidence: 0.9,
                recommendations: ['Proprietary recommendation'],
                relatedTopics: ['blockchain', 'defi'],
                executionTime: 1200
            };
            // Mock the individual research methods
            jest.spyOn(researchAgent, 'performWebSearchResearch').mockResolvedValue(mockWebResult);
            jest.spyOn(researchAgent, 'performMarketAnalysis').mockResolvedValue(mockMarketResult);
            jest.spyOn(researchAgent, 'performProprietaryAnalysis').mockResolvedValue(mockProprietaryResult);
            mockClaudeHaikuService.complete = jest.fn().mockResolvedValue({
                completion: 'Comprehensive cryptocurrency market analysis combining web, market, and proprietary data.'
            });
            // Act
            const result = await researchAgent.processResearchRequest(request);
            // Assert
            expect(result).toBeDefined();
            expect(result.summary).toContain('cryptocurrency');
            expect(result.keyFindings).toHaveLength(4); // Combined from all sources
            expect(result.marketInsights).toBeDefined();
            expect(result.proprietaryInsights).toBeDefined();
            expect(result.confidence).toBeCloseTo(0.817, 2); // Average of all confidences
            expect(result.relatedTopics).toContain('bitcoin');
            expect(result.relatedTopics).toContain('trading');
            expect(result.relatedTopics).toContain('blockchain');
        });
        it('should handle unsupported research type', async () => {
            // Arrange
            const request = {
                topic: 'test topic',
                researchType: 'unsupported',
                parameters: {}
            };
            // Act & Assert
            await expect(researchAgent.processResearchRequest(request)).rejects.toThrow('Unsupported research type: unsupported');
        });
        it('should handle errors gracefully', async () => {
            // Arrange
            const request = {
                topic: 'error test',
                researchType: 'web-search',
                parameters: {}
            };
            mockWebSearchService.performWebSearch.mockRejectedValue(new Error('Search service error'));
            // Act & Assert
            await expect(researchAgent.processResearchRequest(request)).rejects.toThrow('Search service error');
        });
    });
    describe('handleMessage', () => {
        it('should handle research request message', async () => {
            // Arrange
            const message = {
                sender: 'supervisor',
                recipient: 'research',
                messageType: 'request',
                content: {
                    type: 'research',
                    request: {
                        topic: 'AI stocks',
                        researchType: 'web-search',
                        parameters: { depth: 'basic' }
                    }
                },
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'conv-123',
                    requestId: 'req-456'
                }
            };
            const mockResearchResult = {
                summary: 'AI stocks research summary',
                keyFindings: ['Finding 1'],
                trends: [],
                patterns: [],
                sources: [],
                confidence: 0.8,
                recommendations: ['Recommendation 1'],
                relatedTopics: ['artificial intelligence'],
                executionTime: 1000
            };
            jest.spyOn(researchAgent, 'processResearchRequest').mockResolvedValue(mockResearchResult);
            // Act
            const response = await researchAgent.handleMessage(message);
            // Assert
            expect(response.sender).toBe('research');
            expect(response.recipient).toBe('supervisor');
            expect(response.messageType).toBe('response');
            expect(response.content).toEqual(mockResearchResult);
            expect(response.metadata.conversationId).toBe('conv-123');
            expect(response.metadata.requestId).toBe('req-456');
        });
        it('should handle unsupported request type', async () => {
            // Arrange
            const message = {
                sender: 'supervisor',
                recipient: 'research',
                messageType: 'request',
                content: {
                    type: 'unsupported',
                    request: {}
                },
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'conv-123',
                    requestId: 'req-456'
                }
            };
            // Act
            const response = await researchAgent.handleMessage(message);
            // Assert
            expect(response.messageType).toBe('error');
            expect(response.content.error).toContain('Unsupported request type: unsupported');
            expect(response.metadata.priority).toBe('high');
        });
        it('should handle unsupported message type', async () => {
            // Arrange
            const message = {
                sender: 'supervisor',
                recipient: 'research',
                messageType: 'update',
                content: {},
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'conv-123',
                    requestId: 'req-456'
                }
            };
            // Act
            const response = await researchAgent.handleMessage(message);
            // Assert
            expect(response.messageType).toBe('error');
            expect(response.content.error).toContain('Unsupported message type: update');
        });
    });
    describe('Information Extraction', () => {
        it('should extract information from text', async () => {
            // Arrange
            const text = 'Tesla stock price increased by 5% to $250 per share. The company reported strong Q4 earnings.';
            const mockExtractionResponse = {
                completion: JSON.stringify({
                    entities: [
                        { name: 'Tesla', type: 'company', confidence: 0.95, mentions: 1, context: ['stock price'] }
                    ],
                    keyMetrics: [
                        { name: 'stock price', value: 250, unit: 'USD', context: 'current price', source: 'text', confidence: 0.9 }
                    ],
                    sentiments: [
                        { text: 'strong Q4 earnings', sentiment: 'positive', score: 0.8, confidence: 0.9, aspects: [] }
                    ],
                    topics: [
                        { topic: 'earnings', relevance: 0.8, keywords: ['earnings', 'Q4'], frequency: 1 }
                    ],
                    relationships: []
                })
            };
            mockClaudeHaikuService.complete = jest.fn().mockResolvedValue(mockExtractionResponse);
            // Act
            const result = await researchAgent.extractInformation(text);
            // Assert
            expect(result.entities).toHaveLength(1);
            expect(result.entities[0].name).toBe('Tesla');
            expect(result.keyMetrics).toHaveLength(1);
            expect(result.keyMetrics[0].value).toBe(250);
            expect(result.sentiments).toHaveLength(1);
            expect(result.sentiments[0].sentiment).toBe('positive');
            expect(result.topics).toHaveLength(1);
            expect(result.topics[0].topic).toBe('earnings');
        });
        it('should handle extraction errors gracefully', async () => {
            // Arrange
            const text = 'Test text';
            mockClaudeHaikuService.complete = jest.fn().mockRejectedValue(new Error('API error'));
            // Act
            const result = await researchAgent.extractInformation(text);
            // Assert
            expect(result.entities).toEqual([]);
            expect(result.keyMetrics).toEqual([]);
            expect(result.sentiments).toEqual([]);
            expect(result.topics).toEqual([]);
            expect(result.relationships).toEqual([]);
        });
    });
    describe('Trend and Pattern Identification', () => {
        it('should identify trends from search results', async () => {
            // Arrange
            const results = [
                {
                    title: 'Stock Market Rises for Third Consecutive Day',
                    snippet: 'Markets continue upward trend with strong investor confidence',
                    publishDate: new Date('2024-12-01')
                }
            ];
            const mockTrendsResponse = {
                completion: JSON.stringify([
                    {
                        trend: 'Market upward momentum',
                        direction: 'upward',
                        strength: 'strong',
                        timeframe: 'past-week',
                        confidence: 0.85,
                        supportingEvidence: ['Three consecutive days of gains'],
                        implications: ['Continued investor confidence']
                    }
                ])
            };
            mockClaudeHaikuService.complete = jest.fn().mockResolvedValue(mockTrendsResponse);
            // Act
            const trends = await researchAgent.identifyTrends(results, 'stock market');
            // Assert
            expect(trends).toHaveLength(1);
            expect(trends[0].trend).toBe('Market upward momentum');
            expect(trends[0].direction).toBe('upward');
            expect(trends[0].strength).toBe('strong');
        });
        it('should identify patterns from search results', async () => {
            // Arrange
            const results = [
                {
                    title: 'Quarterly Earnings Pattern Emerges',
                    snippet: 'Companies show cyclical earnings patterns every quarter',
                    publishDate: new Date('2024-12-01')
                }
            ];
            const mockPatternsResponse = {
                completion: JSON.stringify([
                    {
                        pattern: 'Quarterly earnings cycle',
                        type: 'cyclical',
                        frequency: 'quarterly',
                        strength: 0.8,
                        confidence: 0.9,
                        description: 'Regular quarterly earnings patterns',
                        historicalOccurrences: 20,
                        predictiveValue: 'high'
                    }
                ])
            };
            mockClaudeHaikuService.complete = jest.fn().mockResolvedValue(mockPatternsResponse);
            // Act
            const patterns = await researchAgent.identifyPatterns(results, 'earnings');
            // Assert
            expect(patterns).toHaveLength(1);
            expect(patterns[0].pattern).toBe('Quarterly earnings cycle');
            expect(patterns[0].type).toBe('cyclical');
            expect(patterns[0].predictiveValue).toBe('high');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzZWFyY2gtYWdlbnQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9fX3Rlc3RzX18vcmVzZWFyY2gtYWdlbnQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgseURBQXdGO0FBQ3hGLHFFQUFnRTtBQUNoRSw4REFBeUQ7QUFDekQsMEVBQXFFO0FBSXJFLHdCQUF3QjtBQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLENBQUM7QUFDeEMsSUFBSSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0FBQ25DLElBQUksQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsQ0FBQztBQUN6QyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUM7QUFFcEMsUUFBUSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7SUFDN0IsSUFBSSxhQUE0QixDQUFDO0lBQ2pDLElBQUksc0JBQXVELENBQUM7SUFDNUQsSUFBSSxvQkFBbUQsQ0FBQztJQUN4RCxJQUFJLDBCQUErRCxDQUFDO0lBQ3BFLElBQUkscUJBQXFELENBQUM7SUFFMUQsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUNkLHNCQUFzQixHQUFHLElBQUkseUNBQWtCLENBQUMsRUFBUyxDQUFvQyxDQUFDO1FBQzlGLG9CQUFvQixHQUFHLElBQUkscUNBQWdCLENBQUMsVUFBVSxDQUFrQyxDQUFDO1FBQ3pGLDBCQUEwQixHQUFHLElBQUksaURBQXNCLENBQUMsRUFBUyxDQUF3QyxDQUFDO1FBQzFHLHFCQUFxQixHQUFHLEVBQW9DLENBQUM7UUFFN0QsYUFBYSxHQUFHLElBQUksOEJBQWEsQ0FDL0Isc0JBQXNCLEVBQ3RCLG9CQUFvQixFQUNwQiwwQkFBMEIsRUFDMUIscUJBQXFCLENBQ3RCLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyx3QkFBd0IsRUFBRSxHQUFH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YixVQUFVLEVBQUUsR0FBRzt3QkFDZixXQUFXLEVBQUUscUNBQXFDO3dCQUNsRCxxQkFBcUIsRUFBRSxFQUFFO3dCQUN6QixlQUFlLEVBQUUsTUFBTTtxQkFDeEI7aUJBQ0YsQ0FBQzthQUNILENBQUM7WUFFRixzQkFBc0IsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFFcEYsTUFBTTtZQUNOLE1BQU0sUUFBUSxHQUFHLE1BQU8sYUFBcUIsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFFcEYsU0FBUztZQUNULE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsQ0FBQztZQUM3RCxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMxQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNuRCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRlc3RzIGZvciBSZXNlYXJjaCBBZ2VudFxuICovXG5cbmltcG9ydCB7IFJlc2VhcmNoQWdlbnQsIFJlc2VhcmNoUmVxdWVzdCwgUmVzZWFyY2hSZXNwb25zZSB9IGZyb20gJy4uL2FpL3Jlc2VhcmNoLWFnZW50JztcbmltcG9ydCB7IENsYXVkZUhhaWt1U2VydmljZSB9IGZyb20gJy4uL2FpL2NsYXVkZS1oYWlrdS1zZXJ2aWNlJztcbmltcG9ydCB7IFdlYlNlYXJjaFNlcnZpY2UgfSBmcm9tICcuLi93ZWItc2VhcmNoLXNlcnZpY2UnO1xuaW1wb3J0IHsgUHJvcHJpZXRhcnlEYXRhU2VydmljZSB9IGZyb20gJy4uL3Byb3ByaWV0YXJ5LWRhdGEtc2VydmljZSc7XG5pbXBvcnQgeyBNYXJrZXREYXRhU2VydmljZSB9IGZyb20gJy4uL21hcmtldC1kYXRhLXNlcnZpY2UnO1xuaW1wb3J0IHsgQWdlbnRNZXNzYWdlIH0gZnJvbSAnLi4vLi4vbW9kZWxzL2FnZW50JztcblxuLy8gTW9jayB0aGUgZGVwZW5kZW5jaWVzXG5qZXN0Lm1vY2soJy4uL2FpL2NsYXVkZS1oYWlrdS1zZXJ2aWNlJyk7XG5qZXN0Lm1vY2soJy4uL3dlYi1zZWFyY2gtc2VydmljZScpO1xuamVzdC5tb2NrKCcuLi9wcm9wcmlldGFyeS1kYXRhLXNlcnZpY2UnKTtcbmplc3QubW9jaygnLi4vbWFya2V0LWRhdGEtc2VydmljZScpO1xuXG5kZXNjcmliZSgnUmVzZWFyY2hBZ2VudCcsICgpID0+IHtcbiAgbGV0IHJlc2VhcmNoQWdlbnQ6IFJlc2VhcmNoQWdlbnQ7XG4gIGxldCBtb2NrQ2xhdWRlSGFpa3VTZXJ2aWNlOiBqZXN0Lk1vY2tlZDxDbGF1ZGVIYWlrdVNlcnZpY2U+O1xuICBsZXQgbW9ja1dlYlNlYXJjaFNlcnZpY2U6IGplc3QuTW9ja2VkPFdlYlNlYXJjaFNlcnZpY2U+O1xuICBsZXQgbW9ja1Byb3ByaWV0YXJ5RGF0YVNlcnZpY2U6IGplc3QuTW9ja2VkPFByb3ByaWV0YXJ5RGF0YVNlcnZpY2U+O1xuICBsZXQgbW9ja01hcmtldERhdGFTZXJ2aWNlOiBqZXN0Lk1vY2tlZDxNYXJrZXREYXRhU2VydmljZT47XG5cbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgbW9ja0NsYXVkZUhhaWt1U2VydmljZSA9IG5ldyBDbGF1ZGVIYWlrdVNlcnZpY2Uoe30gYXMgYW55KSBhcyBqZXN0Lk1vY2tlZDxDbGF1ZGVIYWlrdVNlcnZpY2U+O1xuICAgIG1vY2tXZWJTZWFyY2hTZXJ2aWNlID0gbmV3IFdlYlNlYXJjaFNlcnZpY2UoJ3Rlc3Qta2V5JykgYXMgamVzdC5Nb2NrZWQ8V2ViU2VhcmNoU2VydmljZT47XG4gICAgbW9ja1Byb3ByaWV0YXJ5RGF0YVNlcnZpY2UgPSBuZXcgUHJvcHJpZXRhcnlEYXRhU2VydmljZSh7fSBhcyBhbnkpIGFzIGplc3QuTW9ja2VkPFByb3ByaWV0YXJ5RGF0YVNlcnZpY2U+O1xuICAgIG1vY2tNYXJrZXREYXRhU2VydmljZSA9IHt9IGFzIGplc3QuTW9ja2VkPE1hcmtldERhdGFTZXJ2aWNlPjtcblxuICAgIHJlc2VhcmNoQWdlbnQgPSBuZXcgUmVzZWFyY2hBZ2VudChcbiAgICAgIG1vY2tDbGF1ZGVIYWlrdVNlcnZpY2UsXG4gICAgICBtb2NrV2ViU2VhcmNoU2VydmljZSxcbiAgICAgIG1vY2tQcm9wcmlldGFyeURhdGFTZXJ2aWNlLFxuICAgICAgbW9ja01hcmtldERhdGFTZXJ2aWNlXG4gICAgKTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3Byb2Nlc3NSZXNlYXJjaFJlcXVlc3QnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBwcm9jZXNzIHdlYiBzZWFyY2ggcmVzZWFyY2ggcmVxdWVzdCcsIGFzeW5jICgpID0+IHtcbiAgICAgIC8vIEFycmFuZ2VcbiAgICAgIGNvbnN0IHJlcXVlc3Q6IFJlc2VhcmNoUmVxdWVzdCA9IHtcbiAgICAgICAgdG9waWM6ICdUZXNsYSBzdG9jayBhbmFseXNpcycsXG4gICAgICAgIHJlc2VhcmNoVHlwZTogJ3dlYi1zZWFyY2gnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgdGltZWZyYW1lOiAncGFzdC1tb250aCcsXG4gICAgICAgICAgZGVwdGg6ICdzdGFuZGFyZCcsXG4gICAgICAgICAgbWF4UmVzdWx0czogMTBcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgbW9ja1NlYXJjaFJlc3VsdCA9IHtcbiAgICAgICAgcmVzdWx0czogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRpdGxlOiAnVGVzbGEgU3RvY2sgQW5hbHlzaXMgUTQgMjAyNCcsXG4gICAgICAgICAgICB1cmw6ICdodHRwczovL2V4YW1wbGUuY29tL3Rlc2xhLWFuYWx5c2lzJyxcbiAgICAgICAgICAgIHNuaXBwZXQ6ICdUZXNsYSBzaG93cyBzdHJvbmcgcGVyZm9ybWFuY2UgaW4gUTQgMjAyNCB3aXRoIGluY3JlYXNlZCBkZWxpdmVyaWVzLicsXG4gICAgICAgICAgICBzb3VyY2U6ICdGaW5hbmNpYWwgVGltZXMnLFxuICAgICAgICAgICAgcHVibGlzaERhdGU6IG5ldyBEYXRlKCcyMDI0LTEyLTAxJyksXG4gICAgICAgICAgICByZWxldmFuY2VTY29yZTogMC45XG4gICAgICAgICAgfVxuICAgICAgICBdLFxuICAgICAgICB0b3RhbFJlc3VsdHM6IDEsXG4gICAgICAgIGV4ZWN1dGlvblRpbWU6IDEwMDBcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IG1vY2tFeHRyYWN0aW9uUmVzcG9uc2UgPSB7XG4gICAgICAgIGNvbXBsZXRpb246IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBlbnRpdGllczogW1xuICAgICAgICAgICAgeyBuYW1lOiAnVGVzbGEnLCB0eXBlOiAnY29tcGFueScsIGNvbmZpZGVuY2U6IDAuOTUsIG1lbnRpb25zOiA1LCBjb250ZXh0OiBbJ3N0b2NrIGFuYWx5c2lzJ10gfVxuICAgICAgICAgIF0sXG4gICAgICAgICAga2V5TWV0cmljczogW1xuICAgICAgICAgICAgeyBuYW1lOiAnc3RvY2sgcHJpY2UnLCB2YWx1ZTogMjUwLCB1bml0OiAnVVNEJywgY29udGV4dDogJ2N1cnJlbnQgcHJpY2UnLCBzb3VyY2U6ICdtYXJrZXQgZGF0YScsIGNvbmZpZGVuY2U6IDAuOSB9XG4gICAgICAgICAgXSxcbiAgICAgICAgICBzZW50aW1lbnRzOiBbXG4gICAgICAgICAgICB7IHRleHQ6ICdUZXNsYSBzaG93cyBzdHJvbmcgcGVyZm9ybWFuY2UnLCBzZW50aW1lbnQ6ICdwb3NpdGl2ZScsIHNjb3JlOiAwLjgsIGNvbmZpZGVuY2U6IDAuOSwgYXNwZWN0czogW10gfVxuICAgICAgICAgIF0sXG4gICAgICAgICAgdG9waWNzOiBbXG4gICAgICAgICAgICB7IHRvcGljOiAnc3RvY2sgcGVyZm9ybWFuY2UnLCByZWxldmFuY2U6IDAuOSwga2V5d29yZHM6IFsnVGVzbGEnLCAnc3RvY2snLCAncGVyZm9ybWFuY2UnXSwgZnJlcXVlbmN5OiAzIH1cbiAgICAgICAgICBdLFxuICAgICAgICAgIHJlbGF0aW9uc2hpcHM6IFtcbiAgICAgICAgICAgIHsgZW50aXR5MTogJ1Rlc2xhJywgZW50aXR5MjogJ3N0b2NrIG1hcmtldCcsIHJlbGF0aW9uc2hpcDogJ3RyYWRlc19vbicsIHN0cmVuZ3RoOiAwLjksIGNvbnRleHQ6ICdwdWJsaWMgY29tcGFueScgfVxuICAgICAgICAgIF1cbiAgICAgICAgfSlcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IG1vY2tUcmVuZHNSZXNwb25zZSA9IHtcbiAgICAgICAgY29tcGxldGlvbjogSlNPTi5zdHJpbmdpZnkoW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRyZW5kOiAnRWxlY3RyaWMgdmVoaWNsZSBhZG9wdGlvbicsXG4gICAgICAgICAgICBkaXJlY3Rpb246ICd1cHdhcmQnLFxuICAgICAgICAgICAgc3RyZW5ndGg6ICdzdHJvbmcnLFxuICAgICAgICAgICAgdGltZWZyYW1lOiAncGFzdC1tb250aCcsXG4gICAgICAgICAgICBjb25maWRlbmNlOiAwLjg1LFxuICAgICAgICAgICAgc3VwcG9ydGluZ0V2aWRlbmNlOiBbJ0luY3JlYXNlZCBkZWxpdmVyaWVzJywgJ01hcmtldCBleHBhbnNpb24nXSxcbiAgICAgICAgICAgIGltcGxpY2F0aW9uczogWydQb3NpdGl2ZSBmb3IgVGVzbGEgc3RvY2snXVxuICAgICAgICAgIH1cbiAgICAgICAgXSlcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IG1vY2tQYXR0ZXJuc1Jlc3BvbnNlID0ge1xuICAgICAgICBjb21wbGV0aW9uOiBKU09OLnN0cmluZ2lmeShbXG4gICAgICAgICAge1xuICAgICAgICAgICAgcGF0dGVybjogJ1F1YXJ0ZXJseSBkZWxpdmVyeSBjeWNsZXMnLFxuICAgICAgICAgICAgdHlwZTogJ2N5Y2xpY2FsJyxcbiAgICAgICAgICAgIGZyZXF1ZW5jeTogJ3F1YXJ0ZXJseScsXG4gICAgICAgICAgICBzdHJlbmd0aDogMC44LFxuICAgICAgICAgICAgY29uZmlkZW5jZTogMC45LFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdUZXNsYSBzaG93cyBjeWNsaWNhbCBkZWxpdmVyeSBwYXR0ZXJucycsXG4gICAgICAgICAgICBoaXN0b3JpY2FsT2NjdXJyZW5jZXM6IDEyLFxuICAgICAgICAgICAgcHJlZGljdGl2ZVZhbHVlOiAnaGlnaCdcbiAgICAgICAgICB9XG4gICAgICAgIF0pXG4gICAgICB9O1xuXG4gICAgICBtb2NrV2ViU2VhcmNoU2VydmljZS5wZXJmb3JtV2ViU2VhcmNoLm1vY2tSZXNvbHZlZFZhbHVlKG1vY2tTZWFyY2hSZXN1bHQpO1xuICAgICAgbW9ja0NsYXVkZUhhaWt1U2VydmljZS5jb21wbGV0ZSA9IGplc3QuZm4oKVxuICAgICAgICAubW9ja1Jlc29sdmVkVmFsdWVPbmNlKG1vY2tFeHRyYWN0aW9uUmVzcG9uc2UpXG4gICAgICAgIC5tb2NrUmVzb2x2ZWRWYWx1ZU9uY2UobW9ja1RyZW5kc1Jlc3BvbnNlKVxuICAgICAgICAubW9ja1Jlc29sdmVkVmFsdWVPbmNlKG1vY2tQYXR0ZXJuc1Jlc3BvbnNlKVxuICAgICAgICAubW9ja1Jlc29sdmVkVmFsdWUoeyBjb21wbGV0aW9uOiAnVGVzbGEgcmVzZWFyY2ggc2hvd3MgcG9zaXRpdmUgdHJlbmRzIGluIGVsZWN0cmljIHZlaGljbGUgbWFya2V0LicgfSk7XG5cbiAgICAgIC8vIEFjdFxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzZWFyY2hBZ2VudC5wcm9jZXNzUmVzZWFyY2hSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICAvLyBBc3NlcnRcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0LnN1bW1hcnkpLnRvQ29udGFpbignVGVzbGEnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQua2V5RmluZGluZ3MpLnRvSGF2ZUxlbmd0aCgzKTsgLy8gMSBmcm9tIGVudGl0aWVzICsgMSBmcm9tIHRyZW5kcyArIDEgZnJvbSBwYXR0ZXJuc1xuICAgICAgZXhwZWN0KHJlc3VsdC50cmVuZHMpLnRvSGF2ZUxlbmd0aCgxKTtcbiAgICAgIGV4cGVjdChyZXN1bHQucGF0dGVybnMpLnRvSGF2ZUxlbmd0aCgxKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuc291cmNlcykudG9IYXZlTGVuZ3RoKDEpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5jb25maWRlbmNlKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICBleHBlY3QocmVzdWx0LnJlY29tbWVuZGF0aW9ucy5zb21lKHJlYyA9PiByZWMuaW5jbHVkZXMoJ0NvbnNpZGVyIGluY3JlYXNpbmcgZXhwb3N1cmUgdG8gVGVzbGEgc3RvY2sgYW5hbHlzaXMnKSkpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QocmVzdWx0LmV4ZWN1dGlvblRpbWUpLnRvQmVHcmVhdGVyVGhhbigwKTtcblxuICAgICAgZXhwZWN0KG1vY2tXZWJTZWFyY2hTZXJ2aWNlLnBlcmZvcm1XZWJTZWFyY2gpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICAgICAgICAnVGVzbGEgc3RvY2sgYW5hbHlzaXMnLFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZGVwdGg6ICdiYXNpYycsXG4gICAgICAgICAgdGltZWZyYW1lOiAncGFzdC1tb250aCcsXG4gICAgICAgICAgbWF4UmVzdWx0czogMTBcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHByb2Nlc3MgZGVlcCByZXNlYXJjaCByZXF1ZXN0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgLy8gQXJyYW5nZVxuICAgICAgY29uc3QgcmVxdWVzdDogUmVzZWFyY2hSZXF1ZXN0ID0ge1xuICAgICAgICB0b3BpYzogJ0FJIGludmVzdG1lbnQgb3Bwb3J0dW5pdGllcycsXG4gICAgICAgIHJlc2VhcmNoVHlwZTogJ2RlZXAtcmVzZWFyY2gnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgZGVwdGg6ICdjb21wcmVoZW5zaXZlJyxcbiAgICAgICAgICBmb2N1c0FyZWFzOiBbJ21hY2hpbmUgbGVhcm5pbmcnLCAnYXV0b21hdGlvbiddLFxuICAgICAgICAgIG1heFJlc3VsdHM6IDIwXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IG1vY2tEZWVwUmVzZWFyY2hSZXN1bHQgPSB7XG4gICAgICAgIHN1bW1hcnk6ICdBSSBpbnZlc3RtZW50IG9wcG9ydHVuaXRpZXMgc2hvdyBzaWduaWZpY2FudCBncm93dGggcG90ZW50aWFsIGFjcm9zcyBtdWx0aXBsZSBzZWN0b3JzLicsXG4gICAgICAgIGtleUZpbmRpbmdzOiBbXG4gICAgICAgICAgJ01hY2hpbmUgbGVhcm5pbmcgYWRvcHRpb24gaXMgYWNjZWxlcmF0aW5nJyxcbiAgICAgICAgICAnQXV0b21hdGlvbiBpbnZlc3RtZW50cyBhcmUgaW5jcmVhc2luZydcbiAgICAgICAgXSxcbiAgICAgICAgc291cmNlczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRpdGxlOiAnQUkgSW52ZXN0bWVudCBUcmVuZHMgMjAyNCcsXG4gICAgICAgICAgICB1cmw6ICdodHRwczovL2V4YW1wbGUuY29tL2FpLXRyZW5kcycsXG4gICAgICAgICAgICBwdWJsaXNoZXI6ICdUZWNoIFJlc2VhcmNoJyxcbiAgICAgICAgICAgIHB1Ymxpc2hEYXRlOiBuZXcgRGF0ZSgnMjAyNC0xMS0xNScpLFxuICAgICAgICAgICAgcmVsZXZhbmNlOiAwLjk1LFxuICAgICAgICAgICAgZXhjZXJwdHM6IFsnQUkgaW52ZXN0bWVudHMgcmVhY2hlZCByZWNvcmQgaGlnaHMgaW4gMjAyNCddXG4gICAgICAgICAgfVxuICAgICAgICBdLFxuICAgICAgICByZWxhdGVkVG9waWNzOiBbJ21hY2hpbmUgbGVhcm5pbmcnLCAnYXV0b21hdGlvbicsICdyb2JvdGljcyddLFxuICAgICAgICBjb25maWRlbmNlOiAwLjg4XG4gICAgICB9O1xuXG4gICAgICBjb25zdCBtb2NrRXh0cmFjdGlvblJlc3BvbnNlID0ge1xuICAgICAgICBjb21wbGV0aW9uOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgZW50aXRpZXM6IFtcbiAgICAgICAgICAgIHsgbmFtZTogJ0FJJywgdHlwZTogJ2NvbmNlcHQnLCBjb25maWRlbmNlOiAwLjksIG1lbnRpb25zOiAxMCwgY29udGV4dDogWydpbnZlc3RtZW50JywgJ3RlY2hub2xvZ3knXSB9XG4gICAgICAgICAgXSxcbiAgICAgICAgICBrZXlNZXRyaWNzOiBbXSxcbiAgICAgICAgICBzZW50aW1lbnRzOiBbXG4gICAgICAgICAgICB7IHRleHQ6ICdBSSBzaG93cyBzaWduaWZpY2FudCBncm93dGggcG90ZW50aWFsJywgc2VudGltZW50OiAncG9zaXRpdmUnLCBzY29yZTogMC44NSwgY29uZmlkZW5jZTogMC45LCBhc3BlY3RzOiBbXSB9XG4gICAgICAgICAgXSxcbiAgICAgICAgICB0b3BpY3M6IFtcbiAgICAgICAgICAgIHsgdG9waWM6ICdBSSBpbnZlc3RtZW50JywgcmVsZXZhbmNlOiAwLjk1LCBrZXl3b3JkczogWydBSScsICdpbnZlc3RtZW50JywgJ2dyb3d0aCddLCBmcmVxdWVuY3k6IDggfVxuICAgICAgICAgIF0sXG4gICAgICAgICAgcmVsYXRpb25zaGlwczogW11cbiAgICAgICAgfSlcbiAgICAgIH07XG5cbiAgICAgIG1vY2tXZWJTZWFyY2hTZXJ2aWNlLnBlcmZvcm1EZWVwUmVzZWFyY2gubW9ja1Jlc29sdmVkVmFsdWUobW9ja0RlZXBSZXNlYXJjaFJlc3VsdCk7XG4gICAgICBtb2NrQ2xhdWRlSGFpa3VTZXJ2aWNlLmNvbXBsZXRlID0gamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKG1vY2tFeHRyYWN0aW9uUmVzcG9uc2UpO1xuXG4gICAgICAvLyBBY3RcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlc2VhcmNoQWdlbnQucHJvY2Vzc1Jlc2VhcmNoUmVxdWVzdChyZXF1ZXN0KTtcblxuICAgICAgLy8gQXNzZXJ0XG4gICAgICBleHBlY3QocmVzdWx0KS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5zdW1tYXJ5KS50b0JlKG1vY2tEZWVwUmVzZWFyY2hSZXN1bHQuc3VtbWFyeSk7XG4gICAgICBleHBlY3QocmVzdWx0LmtleUZpbmRpbmdzKS50b0VxdWFsKG1vY2tEZWVwUmVzZWFyY2hSZXN1bHQua2V5RmluZGluZ3MpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5zb3VyY2VzKS50b0VxdWFsKG1vY2tEZWVwUmVzZWFyY2hSZXN1bHQuc291cmNlcyk7XG4gICAgICBleHBlY3QocmVzdWx0LmNvbmZpZGVuY2UpLnRvQmUobW9ja0RlZXBSZXNlYXJjaFJlc3VsdC5jb25maWRlbmNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQucmVsYXRlZFRvcGljcykudG9FcXVhbChtb2NrRGVlcFJlc2VhcmNoUmVzdWx0LnJlbGF0ZWRUb3BpY3MpO1xuXG4gICAgICBleHBlY3QobW9ja1dlYlNlYXJjaFNlcnZpY2UucGVyZm9ybURlZXBSZXNlYXJjaCkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXG4gICAgICAgICdBSSBpbnZlc3RtZW50IG9wcG9ydHVuaXRpZXMnLFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZGVwdGg6ICdjb21wcmVoZW5zaXZlJyxcbiAgICAgICAgICBmb2N1c0FyZWFzOiBbJ21hY2hpbmUgbGVhcm5pbmcnLCAnYXV0b21hdGlvbiddXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBwcm9jZXNzIG1hcmtldCBhbmFseXNpcyByZXF1ZXN0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgLy8gQXJyYW5nZVxuICAgICAgY29uc3QgcmVxdWVzdDogUmVzZWFyY2hSZXF1ZXN0ID0ge1xuICAgICAgICB0b3BpYzogJ0FBUEwnLFxuICAgICAgICByZXNlYXJjaFR5cGU6ICdtYXJrZXQtYW5hbHlzaXMnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgdGltZWZyYW1lOiAncGFzdC13ZWVrJyxcbiAgICAgICAgICBpbmNsdWRlTWFya2V0RGF0YTogdHJ1ZVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCBtb2NrTWFya2V0RGF0YSA9IHtcbiAgICAgICAgZGF0YTogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN5bWJvbDogJ0FBUEwnLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgnMjAyNC0xMi0wMScpLFxuICAgICAgICAgICAgcHJpY2U6IDE1MC4yNSxcbiAgICAgICAgICAgIHZvbHVtZTogMTAwMDAwMCxcbiAgICAgICAgICAgIGNoYW5nZTogMi41LFxuICAgICAgICAgICAgY2hhbmdlUGVyY2VudDogMS42OVxuICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBzb3VyY2U6ICdtYXJrZXQtcHJvdmlkZXInLFxuICAgICAgICAgIGxhc3RVcGRhdGVkOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIHN5bWJvbHM6IFsnQUFQTCddXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIC8vIE1vY2sgbWFya2V0IGRhdGEgc2VydmljZSBkb2Vzbid0IGhhdmUgZ2V0TWFya2V0RGF0YSBtZXRob2QgaW4gY3VycmVudCBpbXBsZW1lbnRhdGlvblxuICAgICAgbW9ja0NsYXVkZUhhaWt1U2VydmljZS5jb21wbGV0ZSA9IGplc3QuZm4oKS5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIGNvbXBsZXRpb246ICdBQVBMIG1hcmtldCBhbmFseXNpcyBzaG93cyBwb3NpdGl2ZSBtb21lbnR1bSB3aXRoIHN0cm9uZyB0cmFkaW5nIHZvbHVtZS4nXG4gICAgICB9KTtcblxuICAgICAgLy8gQWN0XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXNlYXJjaEFnZW50LnByb2Nlc3NSZXNlYXJjaFJlcXVlc3QocmVxdWVzdCk7XG5cbiAgICAgIC8vIEFzc2VydFxuICAgICAgZXhwZWN0KHJlc3VsdCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuc3VtbWFyeSkudG9Db250YWluKCdBQVBMJyk7XG4gICAgICBleHBlY3QocmVzdWx0Lm1hcmtldEluc2lnaHRzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5jb25maWRlbmNlKS50b0JlR3JlYXRlclRoYW4oMC41KTtcblxuICAgICAgLy8gTWFya2V0IGRhdGEgc2VydmljZSBtZXRob2QgY2FsbHMgYXJlIG1vY2tlZCBpbnRlcm5hbGx5XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHByb2Nlc3MgcHJvcHJpZXRhcnkgYW5hbHlzaXMgcmVxdWVzdCcsIGFzeW5jICgpID0+IHtcbiAgICAgIC8vIEFycmFuZ2VcbiAgICAgIGNvbnN0IHJlcXVlc3Q6IFJlc2VhcmNoUmVxdWVzdCA9IHtcbiAgICAgICAgdG9waWM6ICdyZW5ld2FibGUgZW5lcmd5JyxcbiAgICAgICAgcmVzZWFyY2hUeXBlOiAncHJvcHJpZXRhcnktYW5hbHlzaXMnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgdGltZWZyYW1lOiAncGFzdC15ZWFyJyxcbiAgICAgICAgICBpbmNsdWRlUHJvcHJpZXRhcnlEYXRhOiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IG1vY2tQcm9wcmlldGFyeVJlc3VsdCA9IHtcbiAgICAgICAgcmVzdWx0czogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGlkOiAncHJvcC0xJyxcbiAgICAgICAgICAgIHRpdGxlOiAnSW50ZXJuYWwgUmVuZXdhYmxlIEVuZXJneSBBbmFseXNpcycsXG4gICAgICAgICAgICBjb250ZW50OiAnT3VyIGFuYWx5c2lzIHNob3dzIHN0cm9uZyBncm93dGggaW4gcmVuZXdhYmxlIGVuZXJneSBzZWN0b3InLFxuICAgICAgICAgICAgcmVsZXZhbmNlOiAwLjksXG4gICAgICAgICAgICBsYXN0TW9kaWZpZWQ6IG5ldyBEYXRlKCcyMDI0LTExLTAxJylcbiAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIHNvdXJjZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0aXRsZTogJ0ludGVybmFsIFJlbmV3YWJsZSBFbmVyZ3kgQW5hbHlzaXMnLFxuICAgICAgICAgICAgdXJsOiAnaW50ZXJuYWw6Ly9yZW5ld2FibGUtYW5hbHlzaXMnLFxuICAgICAgICAgICAgc291cmNlOiAnSW50ZXJuYWwgUmVzZWFyY2gnLFxuICAgICAgICAgICAgbGFzdE1vZGlmaWVkOiBuZXcgRGF0ZSgnMjAyNC0xMS0wMScpLFxuICAgICAgICAgICAgcmVsZXZhbmNlOiAwLjksXG4gICAgICAgICAgICBzdW1tYXJ5OiAnU3Ryb25nIGdyb3d0aCBpbiByZW5ld2FibGUgZW5lcmd5IHNlY3RvcidcbiAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIGNvbmZpZGVuY2U6IDAuODUsXG4gICAgICAgIHRvdGFsUmVzdWx0czogMVxuICAgICAgfTtcblxuICAgICAgLy8gTW9jayBwcm9wcmlldGFyeSBkYXRhIHNlcnZpY2UgZG9lc24ndCBoYXZlIHF1ZXJ5RGF0YSBtZXRob2QgaW4gY3VycmVudCBpbXBsZW1lbnRhdGlvblxuICAgICAgbW9ja0NsYXVkZUhhaWt1U2VydmljZS5jb21wbGV0ZSA9IGplc3QuZm4oKS5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIGNvbXBsZXRpb246ICdQcm9wcmlldGFyeSBhbmFseXNpcyBvZiByZW5ld2FibGUgZW5lcmd5IHNob3dzIHNpZ25pZmljYW50IGludmVzdG1lbnQgb3Bwb3J0dW5pdGllcy4nXG4gICAgICB9KTtcblxuICAgICAgLy8gQWN0XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXNlYXJjaEFnZW50LnByb2Nlc3NSZXNlYXJjaFJlcXVlc3QocmVxdWVzdCk7XG5cbiAgICAgIC8vIEFzc2VydFxuICAgICAgZXhwZWN0KHJlc3VsdCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuc3VtbWFyeSkudG9Db250YWluKCdyZW5ld2FibGUgZW5lcmd5Jyk7XG4gICAgICBleHBlY3QocmVzdWx0LnByb3ByaWV0YXJ5SW5zaWdodHMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0LnNvdXJjZXMpLnRvSGF2ZUxlbmd0aCgxKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuY29uZmlkZW5jZSkudG9CZSgwLjg1KTtcblxuICAgICAgLy8gUHJvcHJpZXRhcnkgZGF0YSBzZXJ2aWNlIG1ldGhvZCBjYWxscyBhcmUgbW9ja2VkIGludGVybmFsbHlcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcHJvY2VzcyBjb21wcmVoZW5zaXZlIHJlc2VhcmNoIHJlcXVlc3QnLCBhc3luYyAoKSA9PiB7XG4gICAgICAvLyBBcnJhbmdlXG4gICAgICBjb25zdCByZXF1ZXN0OiBSZXNlYXJjaFJlcXVlc3QgPSB7XG4gICAgICAgIHRvcGljOiAnY3J5cHRvY3VycmVuY3kgbWFya2V0JyxcbiAgICAgICAgcmVzZWFyY2hUeXBlOiAnY29tcHJlaGVuc2l2ZScsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICBpbmNsdWRlTWFya2V0RGF0YTogdHJ1ZSxcbiAgICAgICAgICBpbmNsdWRlUHJvcHJpZXRhcnlEYXRhOiB0cnVlLFxuICAgICAgICAgIGRlcHRoOiAnY29tcHJlaGVuc2l2ZSdcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgLy8gTW9jayBhbGwgdGhlIGluZGl2aWR1YWwgcmVzZWFyY2ggbWV0aG9kc1xuICAgICAgY29uc3QgbW9ja1dlYlJlc3VsdCA9IHtcbiAgICAgICAgc3VtbWFyeTogJ1dlYiByZXNlYXJjaCBvbiBjcnlwdG9jdXJyZW5jeSBtYXJrZXQnLFxuICAgICAgICBrZXlGaW5kaW5nczogWydXZWIgZmluZGluZyAxJywgJ1dlYiBmaW5kaW5nIDInXSxcbiAgICAgICAgdHJlbmRzOiBbXSxcbiAgICAgICAgcGF0dGVybnM6IFtdLFxuICAgICAgICBzb3VyY2VzOiBbXSxcbiAgICAgICAgY29uZmlkZW5jZTogMC44LFxuICAgICAgICByZWNvbW1lbmRhdGlvbnM6IFsnV2ViIHJlY29tbWVuZGF0aW9uJ10sXG4gICAgICAgIHJlbGF0ZWRUb3BpY3M6IFsnYml0Y29pbicsICdldGhlcmV1bSddLFxuICAgICAgICBleGVjdXRpb25UaW1lOiAxMDAwXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBtb2NrTWFya2V0UmVzdWx0ID0ge1xuICAgICAgICBzdW1tYXJ5OiAnTWFya2V0IGFuYWx5c2lzIG9mIGNyeXB0b2N1cnJlbmN5JyxcbiAgICAgICAga2V5RmluZGluZ3M6IFsnTWFya2V0IGZpbmRpbmcgMSddLFxuICAgICAgICB0cmVuZHM6IFtdLFxuICAgICAgICBwYXR0ZXJuczogW10sXG4gICAgICAgIHNvdXJjZXM6IFtdLFxuICAgICAgICBtYXJrZXRJbnNpZ2h0czogW10sXG4gICAgICAgIGNvbmZpZGVuY2U6IDAuNzUsXG4gICAgICAgIHJlY29tbWVuZGF0aW9uczogWydNYXJrZXQgcmVjb21tZW5kYXRpb24nXSxcbiAgICAgICAgcmVsYXRlZFRvcGljczogWyd0cmFkaW5nJywgJ3ZvbGF0aWxpdHknXSxcbiAgICAgICAgZXhlY3V0aW9uVGltZTogODAwXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBtb2NrUHJvcHJpZXRhcnlSZXN1bHQgPSB7XG4gICAgICAgIHN1bW1hcnk6ICdQcm9wcmlldGFyeSBjcnlwdG9jdXJyZW5jeSBhbmFseXNpcycsXG4gICAgICAgIGtleUZpbmRpbmdzOiBbJ1Byb3ByaWV0YXJ5IGZpbmRpbmcgMSddLFxuICAgICAgICB0cmVuZHM6IFtdLFxuICAgICAgICBwYXR0ZXJuczogW10sXG4gICAgICAgIHNvdXJjZXM6IFtdLFxuICAgICAgICBwcm9wcmlldGFyeUluc2lnaHRzOiBbXSxcbiAgICAgICAgY29uZmlkZW5jZTogMC45LFxuICAgICAgICByZWNvbW1lbmRhdGlvbnM6IFsnUHJvcHJpZXRhcnkgcmVjb21tZW5kYXRpb24nXSxcbiAgICAgICAgcmVsYXRlZFRvcGljczogWydibG9ja2NoYWluJywgJ2RlZmknXSxcbiAgICAgICAgZXhlY3V0aW9uVGltZTogMTIwMFxuICAgICAgfTtcblxuICAgICAgLy8gTW9jayB0aGUgaW5kaXZpZHVhbCByZXNlYXJjaCBtZXRob2RzXG4gICAgICBqZXN0LnNweU9uKHJlc2VhcmNoQWdlbnQgYXMgYW55LCAncGVyZm9ybVdlYlNlYXJjaFJlc2VhcmNoJykubW9ja1Jlc29sdmVkVmFsdWUobW9ja1dlYlJlc3VsdCk7XG4gICAgICBqZXN0LnNweU9uKHJlc2VhcmNoQWdlbnQgYXMgYW55LCAncGVyZm9ybU1hcmtldEFuYWx5c2lzJykubW9ja1Jlc29sdmVkVmFsdWUobW9ja01hcmtldFJlc3VsdCk7XG4gICAgICBqZXN0LnNweU9uKHJlc2VhcmNoQWdlbnQgYXMgYW55LCAncGVyZm9ybVByb3ByaWV0YXJ5QW5hbHlzaXMnKS5tb2NrUmVzb2x2ZWRWYWx1ZShtb2NrUHJvcHJpZXRhcnlSZXN1bHQpO1xuXG4gICAgICBtb2NrQ2xhdWRlSGFpa3VTZXJ2aWNlLmNvbXBsZXRlID0gamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgY29tcGxldGlvbjogJ0NvbXByZWhlbnNpdmUgY3J5cHRvY3VycmVuY3kgbWFya2V0IGFuYWx5c2lzIGNvbWJpbmluZyB3ZWIsIG1hcmtldCwgYW5kIHByb3ByaWV0YXJ5IGRhdGEuJ1xuICAgICAgfSk7XG5cbiAgICAgIC8vIEFjdFxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzZWFyY2hBZ2VudC5wcm9jZXNzUmVzZWFyY2hSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICAvLyBBc3NlcnRcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0LnN1bW1hcnkpLnRvQ29udGFpbignY3J5cHRvY3VycmVuY3knKTtcbiAgICAgIGV4cGVjdChyZXN1bHQua2V5RmluZGluZ3MpLnRvSGF2ZUxlbmd0aCg0KTsgLy8gQ29tYmluZWQgZnJvbSBhbGwgc291cmNlc1xuICAgICAgZXhwZWN0KHJlc3VsdC5tYXJrZXRJbnNpZ2h0cykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXN1bHQucHJvcHJpZXRhcnlJbnNpZ2h0cykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuY29uZmlkZW5jZSkudG9CZUNsb3NlVG8oMC44MTcsIDIpOyAvLyBBdmVyYWdlIG9mIGFsbCBjb25maWRlbmNlc1xuICAgICAgZXhwZWN0KHJlc3VsdC5yZWxhdGVkVG9waWNzKS50b0NvbnRhaW4oJ2JpdGNvaW4nKTtcbiAgICAgIGV4cGVjdChyZXN1bHQucmVsYXRlZFRvcGljcykudG9Db250YWluKCd0cmFkaW5nJyk7XG4gICAgICBleHBlY3QocmVzdWx0LnJlbGF0ZWRUb3BpY3MpLnRvQ29udGFpbignYmxvY2tjaGFpbicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgdW5zdXBwb3J0ZWQgcmVzZWFyY2ggdHlwZScsIGFzeW5jICgpID0+IHtcbiAgICAgIC8vIEFycmFuZ2VcbiAgICAgIGNvbnN0IHJlcXVlc3Q6IFJlc2VhcmNoUmVxdWVzdCA9IHtcbiAgICAgICAgdG9waWM6ICd0ZXN0IHRvcGljJyxcbiAgICAgICAgcmVzZWFyY2hUeXBlOiAndW5zdXBwb3J0ZWQnIGFzIGFueSxcbiAgICAgICAgcGFyYW1ldGVyczoge31cbiAgICAgIH07XG5cbiAgICAgIC8vIEFjdCAmIEFzc2VydFxuICAgICAgYXdhaXQgZXhwZWN0KHJlc2VhcmNoQWdlbnQucHJvY2Vzc1Jlc2VhcmNoUmVxdWVzdChyZXF1ZXN0KSkucmVqZWN0cy50b1Rocm93KFxuICAgICAgICAnVW5zdXBwb3J0ZWQgcmVzZWFyY2ggdHlwZTogdW5zdXBwb3J0ZWQnXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgZXJyb3JzIGdyYWNlZnVsbHknLCBhc3luYyAoKSA9PiB7XG4gICAgICAvLyBBcnJhbmdlXG4gICAgICBjb25zdCByZXF1ZXN0OiBSZXNlYXJjaFJlcXVlc3QgPSB7XG4gICAgICAgIHRvcGljOiAnZXJyb3IgdGVzdCcsXG4gICAgICAgIHJlc2VhcmNoVHlwZTogJ3dlYi1zZWFyY2gnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7fVxuICAgICAgfTtcblxuICAgICAgbW9ja1dlYlNlYXJjaFNlcnZpY2UucGVyZm9ybVdlYlNlYXJjaC5tb2NrUmVqZWN0ZWRWYWx1ZShuZXcgRXJyb3IoJ1NlYXJjaCBzZXJ2aWNlIGVycm9yJykpO1xuXG4gICAgICAvLyBBY3QgJiBBc3NlcnRcbiAgICAgIGF3YWl0IGV4cGVjdChyZXNlYXJjaEFnZW50LnByb2Nlc3NSZXNlYXJjaFJlcXVlc3QocmVxdWVzdCkpLnJlamVjdHMudG9UaHJvdygnU2VhcmNoIHNlcnZpY2UgZXJyb3InKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2hhbmRsZU1lc3NhZ2UnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgcmVzZWFyY2ggcmVxdWVzdCBtZXNzYWdlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgLy8gQXJyYW5nZVxuICAgICAgY29uc3QgbWVzc2FnZTogQWdlbnRNZXNzYWdlID0ge1xuICAgICAgICBzZW5kZXI6ICdzdXBlcnZpc29yJyxcbiAgICAgICAgcmVjaXBpZW50OiAncmVzZWFyY2gnLFxuICAgICAgICBtZXNzYWdlVHlwZTogJ3JlcXVlc3QnLFxuICAgICAgICBjb250ZW50OiB7XG4gICAgICAgICAgdHlwZTogJ3Jlc2VhcmNoJyxcbiAgICAgICAgICByZXF1ZXN0OiB7XG4gICAgICAgICAgICB0b3BpYzogJ0FJIHN0b2NrcycsXG4gICAgICAgICAgICByZXNlYXJjaFR5cGU6ICd3ZWItc2VhcmNoJyxcbiAgICAgICAgICAgIHBhcmFtZXRlcnM6IHsgZGVwdGg6ICdiYXNpYycgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIGNvbnZlcnNhdGlvbklkOiAnY29udi0xMjMnLFxuICAgICAgICAgIHJlcXVlc3RJZDogJ3JlcS00NTYnXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IG1vY2tSZXNlYXJjaFJlc3VsdCA9IHtcbiAgICAgICAgc3VtbWFyeTogJ0FJIHN0b2NrcyByZXNlYXJjaCBzdW1tYXJ5JyxcbiAgICAgICAga2V5RmluZGluZ3M6IFsnRmluZGluZyAxJ10sXG4gICAgICAgIHRyZW5kczogW10sXG4gICAgICAgIHBhdHRlcm5zOiBbXSxcbiAgICAgICAgc291cmNlczogW10sXG4gICAgICAgIGNvbmZpZGVuY2U6IDAuOCxcbiAgICAgICAgcmVjb21tZW5kYXRpb25zOiBbJ1JlY29tbWVuZGF0aW9uIDEnXSxcbiAgICAgICAgcmVsYXRlZFRvcGljczogWydhcnRpZmljaWFsIGludGVsbGlnZW5jZSddLFxuICAgICAgICBleGVjdXRpb25UaW1lOiAxMDAwXG4gICAgICB9O1xuXG4gICAgICBqZXN0LnNweU9uKHJlc2VhcmNoQWdlbnQsICdwcm9jZXNzUmVzZWFyY2hSZXF1ZXN0JykubW9ja1Jlc29sdmVkVmFsdWUobW9ja1Jlc2VhcmNoUmVzdWx0KTtcblxuICAgICAgLy8gQWN0XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlc2VhcmNoQWdlbnQuaGFuZGxlTWVzc2FnZShtZXNzYWdlKTtcblxuICAgICAgLy8gQXNzZXJ0XG4gICAgICBleHBlY3QocmVzcG9uc2Uuc2VuZGVyKS50b0JlKCdyZXNlYXJjaCcpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLnJlY2lwaWVudCkudG9CZSgnc3VwZXJ2aXNvcicpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLm1lc3NhZ2VUeXBlKS50b0JlKCdyZXNwb25zZScpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLmNvbnRlbnQpLnRvRXF1YWwobW9ja1Jlc2VhcmNoUmVzdWx0KTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5tZXRhZGF0YS5jb252ZXJzYXRpb25JZCkudG9CZSgnY29udi0xMjMnKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5tZXRhZGF0YS5yZXF1ZXN0SWQpLnRvQmUoJ3JlcS00NTYnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIHVuc3VwcG9ydGVkIHJlcXVlc3QgdHlwZScsIGFzeW5jICgpID0+IHtcbiAgICAgIC8vIEFycmFuZ2VcbiAgICAgIGNvbnN0IG1lc3NhZ2U6IEFnZW50TWVzc2FnZSA9IHtcbiAgICAgICAgc2VuZGVyOiAnc3VwZXJ2aXNvcicsXG4gICAgICAgIHJlY2lwaWVudDogJ3Jlc2VhcmNoJyxcbiAgICAgICAgbWVzc2FnZVR5cGU6ICdyZXF1ZXN0JyxcbiAgICAgICAgY29udGVudDoge1xuICAgICAgICAgIHR5cGU6ICd1bnN1cHBvcnRlZCcsXG4gICAgICAgICAgcmVxdWVzdDoge31cbiAgICAgICAgfSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIGNvbnZlcnNhdGlvbklkOiAnY29udi0xMjMnLFxuICAgICAgICAgIHJlcXVlc3RJZDogJ3JlcS00NTYnXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIC8vIEFjdFxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXNlYXJjaEFnZW50LmhhbmRsZU1lc3NhZ2UobWVzc2FnZSk7XG5cbiAgICAgIC8vIEFzc2VydFxuICAgICAgZXhwZWN0KHJlc3BvbnNlLm1lc3NhZ2VUeXBlKS50b0JlKCdlcnJvcicpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLmNvbnRlbnQuZXJyb3IpLnRvQ29udGFpbignVW5zdXBwb3J0ZWQgcmVxdWVzdCB0eXBlOiB1bnN1cHBvcnRlZCcpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLm1ldGFkYXRhLnByaW9yaXR5KS50b0JlKCdoaWdoJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSB1bnN1cHBvcnRlZCBtZXNzYWdlIHR5cGUnLCBhc3luYyAoKSA9PiB7XG4gICAgICAvLyBBcnJhbmdlXG4gICAgICBjb25zdCBtZXNzYWdlOiBBZ2VudE1lc3NhZ2UgPSB7XG4gICAgICAgIHNlbmRlcjogJ3N1cGVydmlzb3InLFxuICAgICAgICByZWNpcGllbnQ6ICdyZXNlYXJjaCcsXG4gICAgICAgIG1lc3NhZ2VUeXBlOiAndXBkYXRlJyxcbiAgICAgICAgY29udGVudDoge30sXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgICBjb252ZXJzYXRpb25JZDogJ2NvbnYtMTIzJyxcbiAgICAgICAgICByZXF1ZXN0SWQ6ICdyZXEtNDU2J1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAvLyBBY3RcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVzZWFyY2hBZ2VudC5oYW5kbGVNZXNzYWdlKG1lc3NhZ2UpO1xuXG4gICAgICAvLyBBc3NlcnRcbiAgICAgIGV4cGVjdChyZXNwb25zZS5tZXNzYWdlVHlwZSkudG9CZSgnZXJyb3InKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5jb250ZW50LmVycm9yKS50b0NvbnRhaW4oJ1Vuc3VwcG9ydGVkIG1lc3NhZ2UgdHlwZTogdXBkYXRlJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdJbmZvcm1hdGlvbiBFeHRyYWN0aW9uJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZXh0cmFjdCBpbmZvcm1hdGlvbiBmcm9tIHRleHQnLCBhc3luYyAoKSA9PiB7XG4gICAgICAvLyBBcnJhbmdlXG4gICAgICBjb25zdCB0ZXh0ID0gJ1Rlc2xhIHN0b2NrIHByaWNlIGluY3JlYXNlZCBieSA1JSB0byAkMjUwIHBlciBzaGFyZS4gVGhlIGNvbXBhbnkgcmVwb3J0ZWQgc3Ryb25nIFE0IGVhcm5pbmdzLic7XG4gICAgICBcbiAgICAgIGNvbnN0IG1vY2tFeHRyYWN0aW9uUmVzcG9uc2UgPSB7XG4gICAgICAgIGNvbXBsZXRpb246IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBlbnRpdGllczogW1xuICAgICAgICAgICAgeyBuYW1lOiAnVGVzbGEnLCB0eXBlOiAnY29tcGFueScsIGNvbmZpZGVuY2U6IDAuOTUsIG1lbnRpb25zOiAxLCBjb250ZXh0OiBbJ3N0b2NrIHByaWNlJ10gfVxuICAgICAgICAgIF0sXG4gICAgICAgICAga2V5TWV0cmljczogW1xuICAgICAgICAgICAgeyBuYW1lOiAnc3RvY2sgcHJpY2UnLCB2YWx1ZTogMjUwLCB1bml0OiAnVVNEJywgY29udGV4dDogJ2N1cnJlbnQgcHJpY2UnLCBzb3VyY2U6ICd0ZXh0JywgY29uZmlkZW5jZTogMC45IH1cbiAgICAgICAgICBdLFxuICAgICAgICAgIHNlbnRpbWVudHM6IFtcbiAgICAgICAgICAgIHsgdGV4dDogJ3N0cm9uZyBRNCBlYXJuaW5ncycsIHNlbnRpbWVudDogJ3Bvc2l0aXZlJywgc2NvcmU6IDAuOCwgY29uZmlkZW5jZTogMC45LCBhc3BlY3RzOiBbXSB9XG4gICAgICAgICAgXSxcbiAgICAgICAgICB0b3BpY3M6IFtcbiAgICAgICAgICAgIHsgdG9waWM6ICdlYXJuaW5ncycsIHJlbGV2YW5jZTogMC44LCBrZXl3b3JkczogWydlYXJuaW5ncycsICdRNCddLCBmcmVxdWVuY3k6IDEgfVxuICAgICAgICAgIF0sXG4gICAgICAgICAgcmVsYXRpb25zaGlwczogW11cbiAgICAgICAgfSlcbiAgICAgIH07XG5cbiAgICAgIG1vY2tDbGF1ZGVIYWlrdVNlcnZpY2UuY29tcGxldGUgPSBqZXN0LmZuKCkubW9ja1Jlc29sdmVkVmFsdWUobW9ja0V4dHJhY3Rpb25SZXNwb25zZSk7XG5cbiAgICAgIC8vIEFjdFxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgKHJlc2VhcmNoQWdlbnQgYXMgYW55KS5leHRyYWN0SW5mb3JtYXRpb24odGV4dCk7XG5cbiAgICAgIC8vIEFzc2VydFxuICAgICAgZXhwZWN0KHJlc3VsdC5lbnRpdGllcykudG9IYXZlTGVuZ3RoKDEpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lbnRpdGllc1swXS5uYW1lKS50b0JlKCdUZXNsYScpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5rZXlNZXRyaWNzKS50b0hhdmVMZW5ndGgoMSk7XG4gICAgICBleHBlY3QocmVzdWx0LmtleU1ldHJpY3NbMF0udmFsdWUpLnRvQmUoMjUwKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuc2VudGltZW50cykudG9IYXZlTGVuZ3RoKDEpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5zZW50aW1lbnRzWzBdLnNlbnRpbWVudCkudG9CZSgncG9zaXRpdmUnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQudG9waWNzKS50b0hhdmVMZW5ndGgoMSk7XG4gICAgICBleHBlY3QocmVzdWx0LnRvcGljc1swXS50b3BpYykudG9CZSgnZWFybmluZ3MnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIGV4dHJhY3Rpb24gZXJyb3JzIGdyYWNlZnVsbHknLCBhc3luYyAoKSA9PiB7XG4gICAgICAvLyBBcnJhbmdlXG4gICAgICBjb25zdCB0ZXh0ID0gJ1Rlc3QgdGV4dCc7XG4gICAgICBtb2NrQ2xhdWRlSGFpa3VTZXJ2aWNlLmNvbXBsZXRlID0gamVzdC5mbigpLm1vY2tSZWplY3RlZFZhbHVlKG5ldyBFcnJvcignQVBJIGVycm9yJykpO1xuXG4gICAgICAvLyBBY3RcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IChyZXNlYXJjaEFnZW50IGFzIGFueSkuZXh0cmFjdEluZm9ybWF0aW9uKHRleHQpO1xuXG4gICAgICAvLyBBc3NlcnRcbiAgICAgIGV4cGVjdChyZXN1bHQuZW50aXRpZXMpLnRvRXF1YWwoW10pO1xuICAgICAgZXhwZWN0KHJlc3VsdC5rZXlNZXRyaWNzKS50b0VxdWFsKFtdKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuc2VudGltZW50cykudG9FcXVhbChbXSk7XG4gICAgICBleHBlY3QocmVzdWx0LnRvcGljcykudG9FcXVhbChbXSk7XG4gICAgICBleHBlY3QocmVzdWx0LnJlbGF0aW9uc2hpcHMpLnRvRXF1YWwoW10pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnVHJlbmQgYW5kIFBhdHRlcm4gSWRlbnRpZmljYXRpb24nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBpZGVudGlmeSB0cmVuZHMgZnJvbSBzZWFyY2ggcmVzdWx0cycsIGFzeW5jICgpID0+IHtcbiAgICAgIC8vIEFycmFuZ2VcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICB0aXRsZTogJ1N0b2NrIE1hcmtldCBSaXNlcyBmb3IgVGhpcmQgQ29uc2VjdXRpdmUgRGF5JyxcbiAgICAgICAgICBzbmlwcGV0OiAnTWFya2V0cyBjb250aW51ZSB1cHdhcmQgdHJlbmQgd2l0aCBzdHJvbmcgaW52ZXN0b3IgY29uZmlkZW5jZScsXG4gICAgICAgICAgcHVibGlzaERhdGU6IG5ldyBEYXRlKCcyMDI0LTEyLTAxJylcbiAgICAgICAgfVxuICAgICAgXTtcblxuICAgICAgY29uc3QgbW9ja1RyZW5kc1Jlc3BvbnNlID0ge1xuICAgICAgICBjb21wbGV0aW9uOiBKU09OLnN0cmluZ2lmeShbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHJlbmQ6ICdNYXJrZXQgdXB3YXJkIG1vbWVudHVtJyxcbiAgICAgICAgICAgIGRpcmVjdGlvbjogJ3Vwd2FyZCcsXG4gICAgICAgICAgICBzdHJlbmd0aDogJ3N0cm9uZycsXG4gICAgICAgICAgICB0aW1lZnJhbWU6ICdwYXN0LXdlZWsnLFxuICAgICAgICAgICAgY29uZmlkZW5jZTogMC44NSxcbiAgICAgICAgICAgIHN1cHBvcnRpbmdFdmlkZW5jZTogWydUaHJlZSBjb25zZWN1dGl2ZSBkYXlzIG9mIGdhaW5zJ10sXG4gICAgICAgICAgICBpbXBsaWNhdGlvbnM6IFsnQ29udGludWVkIGludmVzdG9yIGNvbmZpZGVuY2UnXVxuICAgICAgICAgIH1cbiAgICAgICAgXSlcbiAgICAgIH07XG5cbiAgICAgIG1vY2tDbGF1ZGVIYWlrdVNlcnZpY2UuY29tcGxldGUgPSBqZXN0LmZuKCkubW9ja1Jlc29sdmVkVmFsdWUobW9ja1RyZW5kc1Jlc3BvbnNlKTtcblxuICAgICAgLy8gQWN0XG4gICAgICBjb25zdCB0cmVuZHMgPSBhd2FpdCAocmVzZWFyY2hBZ2VudCBhcyBhbnkpLmlkZW50aWZ5VHJlbmRzKHJlc3VsdHMsICdzdG9jayBtYXJrZXQnKTtcblxuICAgICAgLy8gQXNzZXJ0XG4gICAgICBleHBlY3QodHJlbmRzKS50b0hhdmVMZW5ndGgoMSk7XG4gICAgICBleHBlY3QodHJlbmRzWzBdLnRyZW5kKS50b0JlKCdNYXJrZXQgdXB3YXJkIG1vbWVudHVtJyk7XG4gICAgICBleHBlY3QodHJlbmRzWzBdLmRpcmVjdGlvbikudG9CZSgndXB3YXJkJyk7XG4gICAgICBleHBlY3QodHJlbmRzWzBdLnN0cmVuZ3RoKS50b0JlKCdzdHJvbmcnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaWRlbnRpZnkgcGF0dGVybnMgZnJvbSBzZWFyY2ggcmVzdWx0cycsIGFzeW5jICgpID0+IHtcbiAgICAgIC8vIEFycmFuZ2VcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICB0aXRsZTogJ1F1YXJ0ZXJseSBFYXJuaW5ncyBQYXR0ZXJuIEVtZXJnZXMnLFxuICAgICAgICAgIHNuaXBwZXQ6ICdDb21wYW5pZXMgc2hvdyBjeWNsaWNhbCBlYXJuaW5ncyBwYXR0ZXJucyBldmVyeSBxdWFydGVyJyxcbiAgICAgICAgICBwdWJsaXNoRGF0ZTogbmV3IERhdGUoJzIwMjQtMTItMDEnKVxuICAgICAgICB9XG4gICAgICBdO1xuXG4gICAgICBjb25zdCBtb2NrUGF0dGVybnNSZXNwb25zZSA9IHtcbiAgICAgICAgY29tcGxldGlvbjogSlNPTi5zdHJpbmdpZnkoW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHBhdHRlcm46ICdRdWFydGVybHkgZWFybmluZ3MgY3ljbGUnLFxuICAgICAgICAgICAgdHlwZTogJ2N5Y2xpY2FsJyxcbiAgICAgICAgICAgIGZyZXF1ZW5jeTogJ3F1YXJ0ZXJseScsXG4gICAgICAgICAgICBzdHJlbmd0aDogMC44LFxuICAgICAgICAgICAgY29uZmlkZW5jZTogMC45LFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdSZWd1bGFyIHF1YXJ0ZXJseSBlYXJuaW5ncyBwYXR0ZXJucycsXG4gICAgICAgICAgICBoaXN0b3JpY2FsT2NjdXJyZW5jZXM6IDIwLFxuICAgICAgICAgICAgcHJlZGljdGl2ZVZhbHVlOiAnaGlnaCdcbiAgICAgICAgICB9XG4gICAgICAgIF0pXG4gICAgICB9O1xuXG4gICAgICBtb2NrQ2xhdWRlSGFpa3VTZXJ2aWNlLmNvbXBsZXRlID0gamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKG1vY2tQYXR0ZXJuc1Jlc3BvbnNlKTtcblxuICAgICAgLy8gQWN0XG4gICAgICBjb25zdCBwYXR0ZXJucyA9IGF3YWl0IChyZXNlYXJjaEFnZW50IGFzIGFueSkuaWRlbnRpZnlQYXR0ZXJucyhyZXN1bHRzLCAnZWFybmluZ3MnKTtcblxuICAgICAgLy8gQXNzZXJ0XG4gICAgICBleHBlY3QocGF0dGVybnMpLnRvSGF2ZUxlbmd0aCgxKTtcbiAgICAgIGV4cGVjdChwYXR0ZXJuc1swXS5wYXR0ZXJuKS50b0JlKCdRdWFydGVybHkgZWFybmluZ3MgY3ljbGUnKTtcbiAgICAgIGV4cGVjdChwYXR0ZXJuc1swXS50eXBlKS50b0JlKCdjeWNsaWNhbCcpO1xuICAgICAgZXhwZWN0KHBhdHRlcm5zWzBdLnByZWRpY3RpdmVWYWx1ZSkudG9CZSgnaGlnaCcpO1xuICAgIH0pO1xuICB9KTtcbn0pOyJdfQ==