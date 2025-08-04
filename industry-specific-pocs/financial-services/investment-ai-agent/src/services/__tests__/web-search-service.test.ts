import { WebSearchService } from '../web-search-service';
import { WebSearchOptions, DeepResearchOptions } from '../../models/services';

describe('WebSearchService', () => {
  const apiKey = 'test-api-key';
  const defaultSources = ['Bloomberg', 'Reuters', 'Financial Times'];
  let webSearchService: WebSearchService;
  
  beforeEach(() => {
    webSearchService = new WebSearchService(apiKey, defaultSources);
  });
  
  describe('performWebSearch', () => {
    it('should return search results with the correct structure', async () => {
      const query = 'renewable energy investments';
      const options: WebSearchOptions = {
        depth: 'basic',
        sources: ['Bloomberg', 'Reuters'],
        timeframe: 'past-month',
        maxResults: 5
      };
      
      const result = await webSearchService.performWebSearch(query, options);
      
      expect(result).toBeDefined();
      expect(result.results).toBeInstanceOf(Array);
      expect(result.results.length).toBeLessThanOrEqual(options.maxResults);
      expect(result.totalResults).toBeGreaterThanOrEqual(result.results.length);
      expect(result.executionTime).toBeGreaterThan(0);
      
      if (result.results.length > 0) {
        const firstResult = result.results[0];
        expect(firstResult.title).toContain(query);
        expect(firstResult.url).toBeDefined();
        expect(firstResult.snippet).toBeDefined();
        expect(firstResult.source).toBeDefined();
        expect(firstResult.relevanceScore).toBeGreaterThanOrEqual(0);
        expect(firstResult.relevanceScore).toBeLessThanOrEqual(1);
      }
    });
    
    it('should apply source filtering correctly', async () => {
      const query = 'tech stocks';
      const options: WebSearchOptions = {
        depth: 'basic',
        sources: ['Bloomberg'],
        timeframe: 'recent',
        maxResults: 10
      };
      
      const result = await webSearchService.performWebSearch(query, options);
      
      if (result.results.length > 0) {
        result.results.forEach(item => {
          expect(item.source).toBe('Bloomberg');
        });
      }
    });
    
    it('should use default sources when no sources are provided', async () => {
      const query = 'cryptocurrency market';
      const options: WebSearchOptions = {
        depth: 'basic',
        sources: [],
        timeframe: 'recent',
        maxResults: 10
      };
      
      const result = await webSearchService.performWebSearch(query, options);
      
      if (result.results.length > 0) {
        result.results.forEach(item => {
          expect(defaultSources).toContain(item.source);
        });
      }
    });
    
    it('should rank results by relevance', async () => {
      const query = 'investment strategies';
      const options: WebSearchOptions = {
        depth: 'comprehensive',
        sources: [],
        timeframe: 'all-time',
        maxResults: 20
      };
      
      const result = await webSearchService.performWebSearch(query, options);
      
      if (result.results.length > 1) {
        for (let i = 0; i < result.results.length - 1; i++) {
          expect(result.results[i].relevanceScore).toBeGreaterThanOrEqual(result.results[i + 1].relevanceScore);
        }
      }
    });
  });
  
  describe('performDeepResearch', () => {
    it('should return research results with the correct structure', async () => {
      const topic = 'ESG investing trends';
      const options: DeepResearchOptions = {
        depth: 'deep',
        focusAreas: ['environmental impact', 'corporate governance'],
        includeSources: ['Bloomberg', 'Reuters'],
        excludeSources: ['Social Media'],
        timeConstraint: 60
      };
      
      const result = await webSearchService.performDeepResearch(topic, options);
      
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.keyFindings).toBeInstanceOf(Array);
      expect(result.sources).toBeInstanceOf(Array);
      expect(result.relatedTopics).toBeInstanceOf(Array);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      
      if (result.sources.length > 0) {
        const firstSource = result.sources[0];
        expect(firstSource.title).toBeDefined();
        expect(firstSource.relevance).toBeGreaterThanOrEqual(0);
        expect(firstSource.relevance).toBeLessThanOrEqual(1);
        expect(firstSource.excerpts).toBeInstanceOf(Array);
      }
    });
    
    it('should exclude specified sources', async () => {
      const topic = 'blockchain technology';
      const options: DeepResearchOptions = {
        depth: 'standard',
        focusAreas: ['finance applications'],
        includeSources: [],
        excludeSources: ['Reuters'],
        timeConstraint: 30
      };
      
      const result = await webSearchService.performDeepResearch(topic, options);
      
      if (result.sources.length > 0) {
        result.sources.forEach(source => {
          expect(source.publisher).not.toBe('Reuters');
        });
      }
    });
    
    it('should generate related topics based on the main topic', async () => {
      const topic = 'artificial intelligence in finance';
      const options: DeepResearchOptions = {
        depth: 'comprehensive',
        focusAreas: [],
        includeSources: [],
        excludeSources: [],
        timeConstraint: 120
      };
      
      const result = await webSearchService.performDeepResearch(topic, options);
      
      expect(result.relatedTopics.length).toBeGreaterThan(0);
      result.relatedTopics.forEach(relatedTopic => {
        expect(relatedTopic).toContain(topic);
      });
    });
  });
  
  describe('verifySource', () => {
    it('should verify a source and return a verification result', async () => {
      const source = {
        title: 'Investment Trends 2023',
        url: 'https://example.com/trends-2023',
        publisher: 'Financial Times',
        publishDate: new Date(),
        relevance: 0.85,
        excerpts: ['This is an excerpt from the article.']
      };
      
      const result = await webSearchService.verifySource(source);
      
      expect(result).toBeDefined();
      expect(result.source).toEqual(source);
      expect(typeof result.isVerified).toBe('boolean');
      expect(result.credibilityScore).toBeGreaterThanOrEqual(0);
      expect(result.credibilityScore).toBeLessThanOrEqual(1);
      expect(result.factors).toBeDefined();
      expect(result.verificationMethod).toBe('automated-check');
    });
  });
  
  describe('trackCitations', () => {
    it('should track citations for a research result', async () => {
      const researchResult = {
        summary: 'Research on renewable energy investments',
        keyFindings: ['Finding 1', 'Finding 2'],
        sources: [
          {
            title: 'Renewable Energy Report',
            url: 'https://example.com/report',
            publisher: 'Bloomberg',
            relevance: 0.9,
            excerpts: ['Excerpt 1']
          },
          {
            title: 'Green Investment Outlook',
            url: 'https://example.com/outlook',
            publisher: 'Reuters',
            relevance: 0.8,
            excerpts: ['Excerpt 2']
          }
        ],
        relatedTopics: ['Topic 1', 'Topic 2'],
        confidence: 0.85
      };
      
      const result = await webSearchService.trackCitations(researchResult);
      
      expect(result).toBeDefined();
      expect(result.researchTopic).toBeDefined();
      expect(result.totalCitations).toBeGreaterThan(0);
      expect(result.citations).toBeInstanceOf(Array);
      expect(result.citations.length).toBe(result.totalCitations);
      expect(result.citationGraph).toBeDefined();
      expect(result.citationGraph.nodes).toBeInstanceOf(Array);
      expect(result.citationGraph.edges).toBeInstanceOf(Array);
      
      if (result.citations.length > 0) {
        const firstCitation = result.citations[0];
        expect(firstCitation.id).toBeDefined();
        expect(firstCitation.sourceId).toBeDefined();
        expect(firstCitation.citedBy).toBeDefined();
        expect(firstCitation.publicationDate).toBeInstanceOf(Date);
        expect(firstCitation.context).toBeDefined();
        expect(firstCitation.relevance).toBeGreaterThanOrEqual(0);
        expect(firstCitation.relevance).toBeLessThanOrEqual(1);
      }
    });
  });
});