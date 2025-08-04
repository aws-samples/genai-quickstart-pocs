/**
 * Routes for web search and deep research
 */

import express from 'express';
import { WebSearchController } from '../controllers/web-search-controller';
import { validateWebSearchRequest, validateDeepResearchRequest } from '../middleware/validation';
import { authenticateUser } from '../middleware/auth';

// Create router
const router = express.Router();

// Initialize controller
// In a real application, the API key would be loaded from environment variables or secrets manager
const webSearchController = new WebSearchController('api-key-placeholder', [
  'Bloomberg', 'Reuters', 'Financial Times', 'Wall Street Journal', 'CNBC',
  'Forbes', 'The Economist', 'Morningstar', 'MarketWatch'
]);

// Routes
router.post('/search', authenticateUser, validateWebSearchRequest, (req, res) => 
  webSearchController.performWebSearch(req, res));

router.post('/research', authenticateUser, validateDeepResearchRequest, (req, res) => 
  webSearchController.performDeepResearch(req, res));

router.post('/verify-source', authenticateUser, (req, res) => 
  webSearchController.verifySource(req, res));

router.post('/track-citations', authenticateUser, (req, res) => 
  webSearchController.trackCitations(req, res));

export default router;