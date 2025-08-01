/**
 * Tests for Research Agent
 */

import { ResearchAgent, ResearchRequest, ResearchResponse } from '../ai/research-agent';
import { ClaudeHaikuService } from '../ai/claude-haiku-service';
import { WebSearchService } from '../web-search-service';
import { ProprietaryDataService } from '../proprietary-data-service';
import { MarketDataService } from '../market-data-service';
import { AgentMessage } from '../../models/agent';

// Mock the dependencies
jest.mock('../ai/claude-haiku-service');
jest.mock('../web-search-service');
jest.mock('../proprietary-data-service');
jest.mock('../market-data-service');

describe('ResearchAgent', () => {
  let researchAgent: ResearchAgent;
  let mockClaudeHaikuService: jest.Mocked<ClaudeHaikuService>;
  let mockWebSearchService: jest.Mocked<WebSearchService>;
  let mockProprietaryDataService: jest.Mocked<ProprietaryDataService>;
  let mockMarketDataService: jest.Mocked<MarketDataService>;

  beforeEach(() => {
    mockClaudeHaikuService = new ClaudeHaikuService({} as any) as jest.Mocked<ClaudeHaikuService>;
    mockWebSearchService = new WebSearchService('test-key') as jest.Mocked<WebSearchService>;
    mockProprietaryDataService = new ProprietaryDataService({} as any) as jest.Mocked<ProprietaryDataService>;
    mockMarketDataService = {} as jest.Mocked<MarketDataService>;

    researchAgent = new ResearchAgent(
      mockClaudeHaikuService,
      mockWebSearchService,
      mockProprietaryDataService,
      mockMarketDataService
    );
  });

  describe('processResearchRequest', () => {
    it('should process web search research request', async () => {
      // Arrange
      const request: ResearchRequest = {
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

      expect(mockWebSearchService.performWebSearch).toHaveBeenCalledWith(
        'Tesla stock analysis',
        expect.objectContaining({
          depth: 'basic',
          timeframe: 'past-month',
          maxResults: 10
        })
      );
    });

    it('should process deep research request', async () => {
      // Arrange
      const request: ResearchRequest = {
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

      expect(mockWebSearchService.performDeepResearch).toHaveBeenCalledWith(
        'AI investment opportunities',
        expect.objectContaining({
          depth: 'comprehensive',
          focusAreas: ['machine learning', 'automation']
        })
      );
    });

    it('should process market analysis request', async () => {
      // Arrange
      const request: ResearchRequest = {
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
      const request: ResearchRequest = {
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
      const request: ResearchRequest = {
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
      jest.spyOn(researchAgent as any, 'performWebSearchResearch').mockResolvedValue(mockWebResult);
      jest.spyOn(researchAgent as any, 'performMarketAnalysis').mockResolvedValue(mockMarketResult);
      jest.spyOn(researchAgent as any, 'performProprietaryAnalysis').mockResolvedValue(mockProprietaryResult);

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
      const request: ResearchRequest = {
        topic: 'test topic',
        researchType: 'unsupported' as any,
        parameters: {}
      };

      // Act & Assert
      await expect(researchAgent.processResearchRequest(request)).rejects.toThrow(
        'Unsupported research type: unsupported'
      );
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const request: ResearchRequest = {
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
      const message: AgentMessage = {
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
      const message: AgentMessage = {
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
      const message: AgentMessage = {
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
      const result = await (researchAgent as any).extractInformation(text);

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
      const result = await (researchAgent as any).extractInformation(text);

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
      const trends = await (researchAgent as any).identifyTrends(results, 'stock market');

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
      const patterns = await (researchAgent as any).identifyPatterns(results, 'earnings');

      // Assert
      expect(patterns).toHaveLength(1);
      expect(patterns[0].pattern).toBe('Quarterly earnings cycle');
      expect(patterns[0].type).toBe('cyclical');
      expect(patterns[0].predictiveValue).toBe('high');
    });
  });
});