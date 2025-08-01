/**
 * Frontend Routes
 * Serves the investment idea request interface and static assets
 */

import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// Serve the main frontend application
router.get('/', (req: Request, res: Response) => {
  const indexPath = path.join(__dirname, '../../frontend/index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      error: 'Frontend not found',
      message: 'The investment idea request interface is not available'
    });
  }
});

// Serve static assets
router.get('/styles.css', (req: Request, res: Response) => {
  const stylesPath = path.join(__dirname, '../../frontend/styles.css');
  
  if (fs.existsSync(stylesPath)) {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(stylesPath);
  } else {
    res.status(404).send('/* Styles not found */');
  }
});

router.get('/app.js', (req: Request, res: Response) => {
  const appPath = path.join(__dirname, '../../frontend/app.js');
  
  if (fs.existsSync(appPath)) {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(appPath);
  } else {
    res.status(404).send('// Application script not found');
  }
});

// Health check endpoint for the frontend
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'Investment AI Agent Frontend',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API documentation endpoint
router.get('/api-docs', (req: Request, res: Response) => {
  const apiDocs = {
    title: 'Investment AI Agent API',
    version: '1.0.0',
    description: 'API for generating investment ideas using AI',
    baseUrl: '/api/v1',
    endpoints: {
      'POST /ideas/requests': {
        description: 'Submit a new investment idea generation request',
        authentication: 'Bearer token required',
        rateLimit: '10 requests per 15 minutes',
        parameters: {
          investmentHorizon: 'required - Investment time horizon',
          riskTolerance: 'required - Risk tolerance level',
          investmentAmount: 'optional - Investment amount',
          currency: 'optional - Base currency',
          sectors: 'optional - Preferred sectors',
          assetClasses: 'optional - Preferred asset classes',
          geographicFocus: 'optional - Geographic focus',
          excludedInvestments: 'optional - Investments to exclude',
          minimumConfidence: 'optional - Minimum confidence score (0-100)',
          maximumIdeas: 'optional - Maximum number of ideas (1-20)',
          researchDepth: 'optional - Research depth level',
          includeESGFactors: 'optional - Include ESG factors',
          includeVisualizations: 'optional - Include charts and graphs',
          includeRiskAnalysis: 'optional - Include risk analysis'
        }
      },
      'GET /ideas/requests/:requestId/status': {
        description: 'Get request status and progress',
        authentication: 'Bearer token required',
        parameters: {
          requestId: 'required - UUID of the request'
        }
      },
      'GET /ideas/requests/:requestId/results': {
        description: 'Get request results',
        authentication: 'Bearer token required',
        parameters: {
          requestId: 'required - UUID of the request'
        }
      },
      'DELETE /ideas/requests/:requestId': {
        description: 'Cancel a pending request',
        authentication: 'Bearer token required',
        parameters: {
          requestId: 'required - UUID of the request'
        }
      },
      'GET /ideas/requests': {
        description: 'Get user request history',
        authentication: 'Bearer token required',
        parameters: {
          page: 'optional - Page number (default: 1)',
          limit: 'optional - Items per page (default: 10)',
          status: 'optional - Filter by status',
          dateFrom: 'optional - Filter from date',
          dateTo: 'optional - Filter to date'
        }
      },
      'POST /ideas/requests/:requestId/feedback': {
        description: 'Submit feedback for a completed request',
        authentication: 'Bearer token required',
        parameters: {
          requestId: 'required - UUID of the request',
          rating: 'required - Overall rating (1-5)',
          comments: 'optional - Feedback comments',
          actionTaken: 'optional - Action taken based on results'
        }
      },
      'GET /ideas/requests/templates': {
        description: 'Get request parameter templates',
        authentication: 'Bearer token required'
      },
      'GET /ideas/requests/validation/schema': {
        description: 'Get validation schema for request parameters',
        authentication: 'Bearer token required'
      }
    },
    authentication: {
      type: 'Bearer Token',
      description: 'Include Authorization header with Bearer token',
      example: 'Authorization: Bearer your-jwt-token-here'
    },
    errorCodes: {
      400: 'Bad Request - Invalid parameters',
      401: 'Unauthorized - Authentication required',
      403: 'Forbidden - Insufficient permissions',
      404: 'Not Found - Resource not found',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error - Server error'
    }
  };

  res.json(apiDocs);
});

// Request form validation endpoint
router.post('/validate-request', (req: Request, res: Response) => {
  const { parameters } = req.body;
  
  if (!parameters) {
    res.status(400).json({
      isValid: false,
      errors: ['Parameters are required'],
      warnings: []
    });
    return;
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!parameters.investmentHorizon) {
    errors.push('Investment horizon is required');
  }

  if (!parameters.riskTolerance) {
    errors.push('Risk tolerance is required');
  }

  // Range validation
  if (parameters.minimumConfidence !== undefined) {
    if (parameters.minimumConfidence < 0 || parameters.minimumConfidence > 100) {
      errors.push('Minimum confidence must be between 0 and 100');
    }
  }

  if (parameters.maximumIdeas !== undefined) {
    if (parameters.maximumIdeas < 1 || parameters.maximumIdeas > 20) {
      errors.push('Maximum ideas must be between 1 and 20');
    }
  }

  if (parameters.investmentAmount !== undefined) {
    if (parameters.investmentAmount < 0) {
      errors.push('Investment amount must be positive');
    }
  }

  // Business logic warnings
  if (parameters.riskTolerance === 'very-aggressive' && parameters.investmentHorizon === 'short-term') {
    warnings.push('Very aggressive risk tolerance with short-term horizon may result in high volatility');
  }

  if (parameters.riskTolerance === 'very-conservative' && parameters.investmentHorizon === 'long-term') {
    warnings.push('Very conservative approach with long-term horizon may limit growth potential');
  }

  if (!parameters.assetClasses || parameters.assetClasses.length === 0) {
    warnings.push('No asset classes selected - all asset classes will be considered');
  }

  if (parameters.excludedInvestments && parameters.excludedInvestments.length > 50) {
    warnings.push('Large number of exclusions may limit investment opportunities');
  }

  if (parameters.minimumConfidence && parameters.minimumConfidence > 90) {
    warnings.push('Very high confidence threshold may result in fewer investment ideas');
  }

  res.json({
    isValid: errors.length === 0,
    errors,
    warnings
  });
});

// Get available options for form fields
router.get('/form-options', (req: Request, res: Response) => {
  const options = {
    investmentHorizons: [
      { value: 'intraday', label: 'Intraday', description: 'Same-day trading opportunities' },
      { value: 'short-term', label: 'Short-term (< 1 year)', description: 'Investments held for less than one year' },
      { value: 'medium-term', label: 'Medium-term (1-5 years)', description: 'Investments held for one to five years' },
      { value: 'long-term', label: 'Long-term (> 5 years)', description: 'Investments held for more than five years' },
      { value: 'flexible', label: 'Flexible', description: 'Adaptable based on market conditions' }
    ],
    riskTolerances: [
      { value: 'very-conservative', label: 'Very Conservative', description: 'Minimal risk, capital preservation focus' },
      { value: 'conservative', label: 'Conservative', description: 'Low risk, steady returns' },
      { value: 'moderate', label: 'Moderate', description: 'Balanced risk and return' },
      { value: 'aggressive', label: 'Aggressive', description: 'Higher risk for higher returns' },
      { value: 'very-aggressive', label: 'Very Aggressive', description: 'Maximum risk for maximum returns' }
    ],
    assetClasses: [
      { value: 'equities', label: 'Equities', description: 'Stocks and equity securities' },
      { value: 'fixed-income', label: 'Fixed Income', description: 'Bonds and debt securities' },
      { value: 'commodities', label: 'Commodities', description: 'Physical goods and raw materials' },
      { value: 'currencies', label: 'Currencies', description: 'Foreign exchange and currency pairs' },
      { value: 'real-estate', label: 'Real Estate', description: 'Property and real estate investments' },
      { value: 'alternatives', label: 'Alternatives', description: 'Hedge funds, private equity, etc.' },
      { value: 'cryptocurrencies', label: 'Cryptocurrencies', description: 'Digital currencies and tokens' },
      { value: 'derivatives', label: 'Derivatives', description: 'Options, futures, and other derivatives' }
    ],
    geographicFocus: [
      { value: 'north-america', label: 'North America', description: 'US, Canada, Mexico' },
      { value: 'europe', label: 'Europe', description: 'European markets' },
      { value: 'asia-pacific', label: 'Asia Pacific', description: 'Asian and Pacific markets' },
      { value: 'emerging-markets', label: 'Emerging Markets', description: 'Developing economies' },
      { value: 'global', label: 'Global', description: 'Worldwide diversification' },
      { value: 'domestic', label: 'Domestic', description: 'Home country focus' }
    ],
    researchDepths: [
      { value: 'basic', label: 'Basic', description: 'Quick analysis with key metrics' },
      { value: 'standard', label: 'Standard', description: 'Comprehensive analysis with multiple sources' },
      { value: 'comprehensive', label: 'Comprehensive', description: 'Deep analysis with extensive research' },
      { value: 'deep-dive', label: 'Deep Dive', description: 'Exhaustive analysis with all available data' }
    ],
    liquidityRequirements: [
      { value: 'high', label: 'High', description: 'Easy to buy/sell quickly' },
      { value: 'medium', label: 'Medium', description: 'Moderate liquidity requirements' },
      { value: 'low', label: 'Low', description: 'Can accept illiquid investments' },
      { value: 'flexible', label: 'Flexible', description: 'Adaptable to opportunities' }
    ],
    outputFormats: [
      { value: 'detailed', label: 'Detailed', description: 'Comprehensive report with all analysis' },
      { value: 'summary', label: 'Summary', description: 'Concise overview of key points' },
      { value: 'executive', label: 'Executive', description: 'High-level summary for decision makers' },
      { value: 'technical', label: 'Technical', description: 'Technical analysis focus' },
      { value: 'presentation', label: 'Presentation', description: 'Formatted for presentations' }
    ],
    priorities: [
      { value: 'low', label: 'Low', description: 'Standard processing time' },
      { value: 'medium', label: 'Medium', description: 'Balanced priority' },
      { value: 'high', label: 'High', description: 'Faster processing' },
      { value: 'urgent', label: 'Urgent', description: 'Highest priority processing' }
    ],
    currencies: [
      { value: 'USD', label: 'US Dollar (USD)' },
      { value: 'EUR', label: 'Euro (EUR)' },
      { value: 'GBP', label: 'British Pound (GBP)' },
      { value: 'JPY', label: 'Japanese Yen (JPY)' },
      { value: 'CAD', label: 'Canadian Dollar (CAD)' },
      { value: 'AUD', label: 'Australian Dollar (AUD)' },
      { value: 'CHF', label: 'Swiss Franc (CHF)' },
      { value: 'CNY', label: 'Chinese Yuan (CNY)' },
      { value: 'INR', label: 'Indian Rupee (INR)' },
      { value: 'BRL', label: 'Brazilian Real (BRL)' }
    ]
  };

  res.json(options);
});

export default router;