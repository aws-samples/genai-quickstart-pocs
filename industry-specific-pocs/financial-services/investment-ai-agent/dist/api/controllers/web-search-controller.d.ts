/**
 * Controller for web search and deep research endpoints
 */
import { Request, Response } from 'express';
/**
 * Controller for web search and deep research endpoints
 */
export declare class WebSearchController {
    private webSearchService;
    constructor(apiKey: string, defaultSources?: string[]);
    /**
     * Perform a web search
     * @param req Express request
     * @param res Express response
     */
    performWebSearch(req: Request, res: Response): Promise<void>;
    /**
     * Perform deep research
     * @param req Express request
     * @param res Express response
     */
    performDeepResearch(req: Request, res: Response): Promise<void>;
    /**
     * Verify a source
     * @param req Express request
     * @param res Express response
     */
    verifySource(req: Request, res: Response): Promise<void>;
    /**
     * Track citations for a research result
     * @param req Express request
     * @param res Express response
     */
    trackCitations(req: Request, res: Response): Promise<void>;
}
