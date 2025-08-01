/**
 * Controller for web search and deep research endpoints
 */

import { Request, Response } from 'express';
import { WebSearchService, SourceVerificationResult, CitationTrackingResult } from '../../services/web-search-service';
import { WebSearchOptions, DeepResearchOptions, WebSearchResult, ResearchResult } from '../../models/services';

/**
 * Controller for web search and deep research endpoints
 */
export class WebSearchController {
  private webSearchService: WebSearchService;
  
  constructor(apiKey: string, defaultSources: string[] = []) {
    this.webSearchService = new WebSearchService(apiKey, defaultSources);
  }
  
  /**
   * Perform a web search
   * @param req Express request
   * @param res Express response
   */
  async performWebSearch(req: Request, res: Response): Promise<void> {
    try {
      const { query, depth, sources, timeframe, maxResults } = req.body;
      
      // Validate required parameters
      if (!query) {
        res.status(400).json({ error: 'Query is required' });
        return;
      }
      
      // Create search options
      const options: WebSearchOptions = {
        depth: depth || 'basic',
        sources: sources || [],
        timeframe: timeframe || 'recent',
        maxResults: maxResults || 10
      };
      
      // Perform search
      const result = await this.webSearchService.performWebSearch(query, options);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in performWebSearch:', error);
      res.status(500).json({ 
        error: 'An error occurred while performing the web search',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * Perform deep research
   * @param req Express request
   * @param res Express response
   */
  async performDeepResearch(req: Request, res: Response): Promise<void> {
    try {
      const { topic, depth, focusAreas, includeSources, excludeSources, timeConstraint } = req.body;
      
      // Validate required parameters
      if (!topic) {
        res.status(400).json({ error: 'Topic is required' });
        return;
      }
      
      // Create research options
      const options: DeepResearchOptions = {
        depth: depth || 'standard',
        focusAreas: focusAreas || [],
        includeSources: includeSources || [],
        excludeSources: excludeSources || [],
        timeConstraint: timeConstraint || 60
      };
      
      // Perform deep research
      const result = await this.webSearchService.performDeepResearch(topic, options);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in performDeepResearch:', error);
      res.status(500).json({ 
        error: 'An error occurred while performing deep research',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * Verify a source
   * @param req Express request
   * @param res Express response
   */
  async verifySource(req: Request, res: Response): Promise<void> {
    try {
      const { source } = req.body;
      
      // Validate required parameters
      if (!source || !source.title) {
        res.status(400).json({ error: 'Valid source object is required' });
        return;
      }
      
      // Verify source
      const result = await this.webSearchService.verifySource(source);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in verifySource:', error);
      res.status(500).json({ 
        error: 'An error occurred while verifying the source',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * Track citations for a research result
   * @param req Express request
   * @param res Express response
   */
  async trackCitations(req: Request, res: Response): Promise<void> {
    try {
      const { researchResult } = req.body;
      
      // Validate required parameters
      if (!researchResult || !researchResult.sources || !Array.isArray(researchResult.sources)) {
        res.status(400).json({ error: 'Valid research result object is required' });
        return;
      }
      
      // Track citations
      const result = await this.webSearchService.trackCitations(researchResult);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in trackCitations:', error);
      res.status(500).json({ 
        error: 'An error occurred while tracking citations',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}