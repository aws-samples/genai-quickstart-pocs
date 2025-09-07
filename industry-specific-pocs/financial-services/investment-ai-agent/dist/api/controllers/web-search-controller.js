"use strict";
/**
 * Controller for web search and deep research endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSearchController = void 0;
const web_search_service_1 = require("../../services/web-search-service");
/**
 * Controller for web search and deep research endpoints
 */
class WebSearchController {
    constructor(apiKey, defaultSources = []) {
        this.webSearchService = new web_search_service_1.WebSearchService(apiKey, defaultSources);
    }
    /**
     * Perform a web search
     * @param req Express request
     * @param res Express response
     */
    async performWebSearch(req, res) {
        try {
            const { query, depth, sources, timeframe, maxResults } = req.body;
            // Validate required parameters
            if (!query) {
                res.status(400).json({ error: 'Query is required' });
                return;
            }
            // Create search options
            const options = {
                depth: depth || 'basic',
                sources: sources || [],
                timeframe: timeframe || 'recent',
                maxResults: maxResults || 10
            };
            // Perform search
            const result = await this.webSearchService.performWebSearch(query, options);
            res.status(200).json(result);
        }
        catch (error) {
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
    async performDeepResearch(req, res) {
        try {
            const { topic, depth, focusAreas, includeSources, excludeSources, timeConstraint } = req.body;
            // Validate required parameters
            if (!topic) {
                res.status(400).json({ error: 'Topic is required' });
                return;
            }
            // Create research options
            const options = {
                depth: depth || 'standard',
                focusAreas: focusAreas || [],
                includeSources: includeSources || [],
                excludeSources: excludeSources || [],
                timeConstraint: timeConstraint || 60
            };
            // Perform deep research
            const result = await this.webSearchService.performDeepResearch(topic, options);
            res.status(200).json(result);
        }
        catch (error) {
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
    async verifySource(req, res) {
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
        }
        catch (error) {
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
    async trackCitations(req, res) {
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
        }
        catch (error) {
            console.error('Error in trackCitations:', error);
            res.status(500).json({
                error: 'An error occurred while tracking citations',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.WebSearchController = WebSearchController;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViLXNlYXJjaC1jb250cm9sbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2FwaS9jb250cm9sbGVycy93ZWItc2VhcmNoLWNvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOzs7QUFHSCwwRUFBdUg7QUFHdkg7O0dBRUc7QUFDSCxNQUFhLG1CQUFtQjtJQUc5QixZQUFZLE1BQWMsRUFBRSxpQkFBMkIsRUFBRTtRQUN2RCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxxQ0FBZ0IsQ0FBQyxNQUFNLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsZ0JBQWdCLENBQUMsR0FBWSxFQUFFLEdBQWE7UUFDaEQsSUFBSTtZQUNGLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztZQUVsRSwrQkFBK0I7WUFDL0IsSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFDVixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxtQkFBbUIsRUFBRSxDQUFDLENBQUM7Z0JBQ3JELE9BQU87YUFDUjtZQUVELHdCQUF3QjtZQUN4QixNQUFNLE9BQU8sR0FBcUI7Z0JBQ2hDLEtBQUssRUFBRSxLQUFLLElBQUksT0FBTztnQkFDdkIsT0FBTyxFQUFFLE9BQU8sSUFBSSxFQUFFO2dCQUN0QixTQUFTLEVBQUUsU0FBUyxJQUFJLFFBQVE7Z0JBQ2hDLFVBQVUsRUFBRSxVQUFVLElBQUksRUFBRTthQUM3QixDQUFDO1lBRUYsaUJBQWlCO1lBQ2pCLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztZQUU1RSxH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LENBQUM7U0FDSjtJQUNILENBQUM7Q0FDRjtBQXZJRCxrREF1SUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvbnRyb2xsZXIgZm9yIHdlYiBzZWFyY2ggYW5kIGRlZXAgcmVzZWFyY2ggZW5kcG9pbnRzXG4gKi9cblxuaW1wb3J0IHsgUmVxdWVzdCwgUmVzcG9uc2UgfSBmcm9tICdleHByZXNzJztcbmltcG9ydCB7IFdlYlNlYXJjaFNlcnZpY2UsIFNvdXJjZVZlcmlmaWNhdGlvblJlc3VsdCwgQ2l0YXRpb25UcmFja2luZ1Jlc3VsdCB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL3dlYi1zZWFyY2gtc2VydmljZSc7XG5pbXBvcnQgeyBXZWJTZWFyY2hPcHRpb25zLCBEZWVwUmVzZWFyY2hPcHRpb25zLCBXZWJTZWFyY2hSZXN1bHQsIFJlc2VhcmNoUmVzdWx0IH0gZnJvbSAnLi4vLi4vbW9kZWxzL3NlcnZpY2VzJztcblxuLyoqXG4gKiBDb250cm9sbGVyIGZvciB3ZWIgc2VhcmNoIGFuZCBkZWVwIHJlc2VhcmNoIGVuZHBvaW50c1xuICovXG5leHBvcnQgY2xhc3MgV2ViU2VhcmNoQ29udHJvbGxlciB7XG4gIHByaXZhdGUgd2ViU2VhcmNoU2VydmljZTogV2ViU2VhcmNoU2VydmljZTtcbiAgXG4gIGNvbnN0cnVjdG9yKGFwaUtleTogc3RyaW5nLCBkZWZhdWx0U291cmNlczogc3RyaW5nW10gPSBbXSkge1xuICAgIHRoaXMud2ViU2VhcmNoU2VydmljZSA9IG5ldyBXZWJTZWFyY2hTZXJ2aWNlKGFwaUtleSwgZGVmYXVsdFNvdXJjZXMpO1xuICB9XG4gIFxuICAvKipcbiAgICogUGVyZm9ybSBhIHdlYiBzZWFyY2hcbiAgICogQHBhcmFtIHJlcSBFeHByZXNzIHJlcXVlc3RcbiAgICogQHBhcmFtIHJlcyBFeHByZXNzIHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyBwZXJmb3JtV2ViU2VhcmNoKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB7IHF1ZXJ5LCBkZXB0aCwgc291cmNlcywgdGltZWZyYW1lLCBtYXhSZXN1bHRzIH0gPSByZXEuYm9keTtcbiAgICAgIFxuICAgICAgLy8gVmFsaWRhdGUgcmVxdWlyZWQgcGFyYW1ldGVyc1xuICAgICAgaWYgKCFxdWVyeSkge1xuICAgICAgICByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnUXVlcnkgaXMgcmVxdWlyZWQnIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIENyZWF0ZSBzZWFyY2ggb3B0aW9uc1xuICAgICAgY29uc3Qgb3B0aW9uczogV2ViU2VhcmNoT3B0aW9ucyA9IHtcbiAgICAgICAgZGVwdGg6IGRlcHRoIHx8ICdiYXNpYycsXG4gICAgICAgIHNvdXJjZXM6IHNvdXJjZXMgfHwgW10sXG4gICAgICAgIHRpbWVmcmFtZTogdGltZWZyYW1lIHx8ICdyZWNlbnQnLFxuICAgICAgICBtYXhSZXN1bHRzOiBtYXhSZXN1bHRzIHx8IDEwXG4gICAgICB9O1xuICAgICAgXG4gICAgICAvLyBQZXJmb3JtIHNlYXJjaFxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy53ZWJTZWFyY2hTZXJ2aWNlLnBlcmZvcm1XZWJTZWFyY2gocXVlcnksIG9wdGlvbnMpO1xuICAgICAgXG4gICAgICByZXMuc3RhdHVzKDIwMCkuanNvbihyZXN1bHQpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBpbiBwZXJmb3JtV2ViU2VhcmNoOicsIGVycm9yKTtcbiAgICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgXG4gICAgICAgIGVycm9yOiAnQW4gZXJyb3Igb2NjdXJyZWQgd2hpbGUgcGVyZm9ybWluZyB0aGUgd2ViIHNlYXJjaCcsXG4gICAgICAgIGRldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBQZXJmb3JtIGRlZXAgcmVzZWFyY2hcbiAgICogQHBhcmFtIHJlcSBFeHByZXNzIHJlcXVlc3RcbiAgICogQHBhcmFtIHJlcyBFeHByZXNzIHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyBwZXJmb3JtRGVlcFJlc2VhcmNoKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB7IHRvcGljLCBkZXB0aCwgZm9jdXNBcmVhcywgaW5jbHVkZVNvdXJjZXMsIGV4Y2x1ZGVTb3VyY2VzLCB0aW1lQ29uc3RyYWludCB9ID0gcmVxLmJvZHk7XG4gICAgICBcbiAgICAgIC8vIFZhbGlkYXRlIHJlcXVpcmVkIHBhcmFtZXRlcnNcbiAgICAgIGlmICghdG9waWMpIHtcbiAgICAgICAgcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogJ1RvcGljIGlzIHJlcXVpcmVkJyB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBDcmVhdGUgcmVzZWFyY2ggb3B0aW9uc1xuICAgICAgY29uc3Qgb3B0aW9uczogRGVlcFJlc2VhcmNoT3B0aW9ucyA9IHtcbiAgICAgICAgZGVwdGg6IGRlcHRoIHx8ICdzdGFuZGFyZCcsXG4gICAgICAgIGZvY3VzQXJlYXM6IGZvY3VzQXJlYXMgfHwgW10sXG4gICAgICAgIGluY2x1ZGVTb3VyY2VzOiBpbmNsdWRlU291cmNlcyB8fCBbXSxcbiAgICAgICAgZXhjbHVkZVNvdXJjZXM6IGV4Y2x1ZGVTb3VyY2VzIHx8IFtdLFxuICAgICAgICB0aW1lQ29uc3RyYWludDogdGltZUNvbnN0cmFpbnQgfHwgNjBcbiAgICAgIH07XG4gICAgICBcbiAgICAgIC8vIFBlcmZvcm0gZGVlcCByZXNlYXJjaFxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy53ZWJTZWFyY2hTZXJ2aWNlLnBlcmZvcm1EZWVwUmVzZWFyY2godG9waWMsIG9wdGlvbnMpO1xuICAgICAgXG4gICAgICByZXMuc3RhdHVzKDIwMCkuanNvbihyZXN1bHQpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBpbiBwZXJmb3JtRGVlcFJlc2VhcmNoOicsIGVycm9yKTtcbiAgICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgXG4gICAgICAgIGVycm9yOiAnQW4gZXJyb3Igb2NjdXJyZWQgd2hpbGUgcGVyZm9ybWluZyBkZWVwIHJlc2VhcmNoJyxcbiAgICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcidcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIFZlcmlmeSBhIHNvdXJjZVxuICAgKiBAcGFyYW0gcmVxIEV4cHJlc3MgcmVxdWVzdFxuICAgKiBAcGFyYW0gcmVzIEV4cHJlc3MgcmVzcG9uc2VcbiAgICovXG4gIGFzeW5jIHZlcmlmeVNvdXJjZShyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyBzb3VyY2UgfSA9IHJlcS5ib2R5O1xuICAgICAgXG4gICAgICAvLyBWYWxpZGF0ZSByZXF1aXJlZCBwYXJhbWV0ZXJzXG4gICAgICBpZiAoIXNvdXJjZSB8fCAhc291cmNlLnRpdGxlKSB7XG4gICAgICAgIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6ICdWYWxpZCBzb3VyY2Ugb2JqZWN0IGlzIHJlcXVpcmVkJyB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBWZXJpZnkgc291cmNlXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLndlYlNlYXJjaFNlcnZpY2UudmVyaWZ5U291cmNlKHNvdXJjZSk7XG4gICAgICBcbiAgICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHJlc3VsdCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGluIHZlcmlmeVNvdXJjZTonLCBlcnJvcik7XG4gICAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IFxuICAgICAgICBlcnJvcjogJ0FuIGVycm9yIG9jY3VycmVkIHdoaWxlIHZlcmlmeWluZyB0aGUgc291cmNlJyxcbiAgICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcidcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIFRyYWNrIGNpdGF0aW9ucyBmb3IgYSByZXNlYXJjaCByZXN1bHRcbiAgICogQHBhcmFtIHJlcSBFeHByZXNzIHJlcXVlc3RcbiAgICogQHBhcmFtIHJlcyBFeHByZXNzIHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyB0cmFja0NpdGF0aW9ucyhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyByZXNlYXJjaFJlc3VsdCB9ID0gcmVxLmJvZHk7XG4gICAgICBcbiAgICAgIC8vIFZhbGlkYXRlIHJlcXVpcmVkIHBhcmFtZXRlcnNcbiAgICAgIGlmICghcmVzZWFyY2hSZXN1bHQgfHwgIXJlc2VhcmNoUmVzdWx0LnNvdXJjZXMgfHwgIUFycmF5LmlzQXJyYXkocmVzZWFyY2hSZXN1bHQuc291cmNlcykpIHtcbiAgICAgICAgcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogJ1ZhbGlkIHJlc2VhcmNoIHJlc3VsdCBvYmplY3QgaXMgcmVxdWlyZWQnIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIFRyYWNrIGNpdGF0aW9uc1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy53ZWJTZWFyY2hTZXJ2aWNlLnRyYWNrQ2l0YXRpb25zKHJlc2VhcmNoUmVzdWx0KTtcbiAgICAgIFxuICAgICAgcmVzLnN0YXR1cygyMDApLmpzb24ocmVzdWx0KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gdHJhY2tDaXRhdGlvbnM6JywgZXJyb3IpO1xuICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBcbiAgICAgICAgZXJyb3I6ICdBbiBlcnJvciBvY2N1cnJlZCB3aGlsZSB0cmFja2luZyBjaXRhdGlvbnMnLFxuICAgICAgICBkZXRhaWxzOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ1xuICAgICAgfSk7XG4gICAgfVxuICB9XG59Il19