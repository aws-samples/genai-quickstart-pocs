/**
 * Investment Idea API Routes
 * Handles HTTP routes for investment idea generation requests
 */

import { Router } from 'express';
import { InvestmentIdeaController } from '../controllers/investment-idea-controller';
import { InvestmentIdeaRequestService } from '../../services/investment-idea-request-service';
import { RequestValidationService } from '../../services/request-validation-service';
import { RequestTrackingService } from '../../services/request-tracking-service';
import { InvestmentIdeaOrchestrationService } from '../../services/investment-idea-orchestration';
import { authenticateUser } from '../middleware/auth';
import { requestValidationMiddleware, validationMiddleware } from '../middleware/validation';
import { rateLimitMiddleware } from '../middleware/rate-limit';

// Initialize services
const trackingService = new RequestTrackingService();
// Mock orchestration service for now - will be properly initialized in production
const orchestrationService = {} as InvestmentIdeaOrchestrationService;
const requestService = new InvestmentIdeaRequestService(trackingService, orchestrationService);
const validationService = new RequestValidationService();

// Initialize controller
const investmentIdeaController = new InvestmentIdeaController(
  requestService,
  validationService,
  trackingService
);

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

/**
 * @route POST /api/v1/ideas/requests
 * @desc Submit a new investment idea generation request
 * @access Private
 */
router.post('/requests', 
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 requests per 15 minutes
  validationMiddleware({
    body: {
      parameters: {
        required: true,
        type: 'object',
        properties: {
          investmentHorizon: {
            required: true,
            type: 'string',
            enum: ['intraday', 'short-term', 'medium-term', 'long-term', 'flexible']
          },
          riskTolerance: {
            required: true,
            type: 'string',
            enum: ['very-conservative', 'conservative', 'moderate', 'aggressive', 'very-aggressive']
          },
          investmentAmount: {
            required: false,
            type: 'number',
            min: 100,
            max: 1000000000
          },
          currency: {
            required: false,
            type: 'string',
            enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL']
          },
          sectors: {
            required: false,
            type: 'array',
            items: { type: 'string' },
            maxItems: 20
          },
          assetClasses: {
            required: false,
            type: 'array',
            items: {
              type: 'string',
              enum: ['equities', 'fixed-income', 'commodities', 'currencies', 'real-estate', 'alternatives', 'cryptocurrencies', 'derivatives']
            }
          },
          geographicFocus: {
            required: false,
            type: 'array',
            items: {
              type: 'string',
              enum: ['north-america', 'europe', 'asia-pacific', 'emerging-markets', 'global', 'domestic']
            }
          },
          excludedInvestments: {
            required: false,
            type: 'array',
            items: { type: 'string' },
            maxItems: 100
          },
          excludedSectors: {
            required: false,
            type: 'array',
            items: { type: 'string' },
            maxItems: 15
          },
          minimumConfidence: {
            required: false,
            type: 'number',
            min: 0,
            max: 100
          },
          maximumIdeas: {
            required: false,
            type: 'number',
            min: 1,
            max: 20
          },
          includeAlternatives: {
            required: false,
            type: 'boolean'
          },
          includeESGFactors: {
            required: false,
            type: 'boolean'
          },
          researchDepth: {
            required: false,
            type: 'string',
            enum: ['basic', 'standard', 'comprehensive', 'deep-dive']
          },
          thematicFocus: {
            required: false,
            type: 'array',
            items: { type: 'string' }
          },
          liquidityRequirement: {
            required: false,
            type: 'string',
            enum: ['high', 'medium', 'low', 'flexible']
          },
          outputFormat: {
            required: false,
            type: 'string',
            enum: ['detailed', 'summary', 'executive', 'technical', 'presentation']
          },
          includeVisualizations: {
            required: false,
            type: 'boolean'
          },
          includeBacktesting: {
            required: false,
            type: 'boolean'
          },
          includeRiskAnalysis: {
            required: false,
            type: 'boolean'
          }
        }
      },
      priority: {
        required: false,
        type: 'string',
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
      },
      callback: {
        required: false,
        type: 'object',
        properties: {
          url: {
            required: true,
            type: 'string',
            format: 'url'
          },
          method: {
            required: false,
            type: 'string',
            enum: ['POST', 'PUT'],
            default: 'POST'
          },
          headers: {
            required: false,
            type: 'object'
          }
        }
      }
    }
  }),
  investmentIdeaController.submitRequest.bind(investmentIdeaController)
);

/**
 * @route GET /api/v1/ideas/requests/:requestId/status
 * @desc Get request status and progress
 * @access Private
 */
router.get('/requests/:requestId/status',
  validationMiddleware({
    params: {
      requestId: {
        required: true,
        type: 'string',
        format: 'uuid'
      }
    }
  }),
  investmentIdeaController.getRequestStatus.bind(investmentIdeaController)
);

/**
 * @route GET /api/v1/ideas/requests/:requestId/results
 * @desc Get request results
 * @access Private
 */
router.get('/requests/:requestId/results',
  validationMiddleware({
    params: {
      requestId: {
        required: true,
        type: 'string',
        format: 'uuid'
      }
    }
  }),
  investmentIdeaController.getRequestResults.bind(investmentIdeaController)
);

/**
 * @route DELETE /api/v1/ideas/requests/:requestId
 * @desc Cancel a pending request
 * @access Private
 */
router.delete('/requests/:requestId',
  validationMiddleware({
    params: {
      requestId: {
        required: true,
        type: 'string',
        format: 'uuid'
      }
    }
  }),
  investmentIdeaController.cancelRequest.bind(investmentIdeaController)
);

/**
 * @route GET /api/v1/ideas/requests
 * @desc Get user's request history
 * @access Private
 */
router.get('/requests',
  validationMiddleware({
    query: {
      page: {
        required: false,
        type: 'number',
        min: 1,
        default: 1
      },
      limit: {
        required: false,
        type: 'number',
        min: 1,
        max: 50,
        default: 10
      },
      status: {
        required: false,
        type: 'string',
        enum: ['submitted', 'validated', 'queued', 'processing', 'completed', 'failed', 'cancelled', 'expired']
      },
      dateFrom: {
        required: false,
        type: 'string',
        format: 'date-time'
      },
      dateTo: {
        required: false,
        type: 'string',
        format: 'date-time'
      }
    }
  }),
  investmentIdeaController.getRequestHistory.bind(investmentIdeaController)
);

/**
 * @route POST /api/v1/ideas/requests/:requestId/feedback
 * @desc Submit feedback for a completed request
 * @access Private
 */
router.post('/requests/:requestId/feedback',
  validationMiddleware({
    params: {
      requestId: {
        required: true,
        type: 'string',
        format: 'uuid'
      }
    },
    body: {
      rating: {
        required: true,
        type: 'number',
        min: 1,
        max: 5
      },
      comments: {
        required: false,
        type: 'string',
        maxLength: 1000
      },
      usefulnessScore: {
        required: false,
        type: 'number',
        min: 1,
        max: 5
      },
      accuracyScore: {
        required: false,
        type: 'number',
        min: 1,
        max: 5
      },
      insightScore: {
        required: false,
        type: 'number',
        min: 1,
        max: 5
      },
      actionTaken: {
        required: false,
        type: 'string',
        enum: ['implemented', 'partially-implemented', 'considered', 'rejected', 'pending', 'requires-more-research']
      },
      specificFeedback: {
        required: false,
        type: 'array',
        items: {
          type: 'object',
          properties: {
            ideaId: {
              required: true,
              type: 'string'
            },
            aspect: {
              required: true,
              type: 'string',
              enum: ['rationale', 'risk-assessment', 'return-estimate', 'timing', 'compliance']
            },
            rating: {
              required: true,
              type: 'number',
              min: 1,
              max: 5
            },
            comment: {
              required: false,
              type: 'string',
              maxLength: 500
            }
          }
        }
      }
    }
  }),
  investmentIdeaController.submitFeedback.bind(investmentIdeaController)
);

/**
 * @route GET /api/v1/ideas/requests/templates
 * @desc Get request parameter templates for common scenarios
 * @access Private
 */
router.get('/requests/templates', (req, res) => {
  const templates = {
    conservative_retirement: {
      name: 'Conservative Retirement Portfolio',
      description: 'Low-risk, income-focused investments for retirement planning',
      parameters: {
        investmentHorizon: 'long-term',
        riskTolerance: 'conservative',
        assetClasses: ['fixed-income', 'equities'],
        sectors: ['utilities', 'consumer-staples', 'healthcare'],
        includeESGFactors: true,
        liquidityRequirement: 'medium',
        researchDepth: 'standard',
        maximumIdeas: 5
      }
    },
    aggressive_growth: {
      name: 'Aggressive Growth Portfolio',
      description: 'High-risk, high-reward investments for growth-oriented investors',
      parameters: {
        investmentHorizon: 'long-term',
        riskTolerance: 'aggressive',
        assetClasses: ['equities', 'alternatives'],
        sectors: ['technology', 'biotechnology', 'emerging-markets'],
        includeAlternatives: true,
        liquidityRequirement: 'low',
        researchDepth: 'comprehensive',
        maximumIdeas: 8
      }
    },
    balanced_diversified: {
      name: 'Balanced Diversified Portfolio',
      description: 'Moderate risk with diversification across asset classes',
      parameters: {
        investmentHorizon: 'medium-term',
        riskTolerance: 'moderate',
        assetClasses: ['equities', 'fixed-income', 'real-estate'],
        geographicFocus: ['north-america', 'europe', 'asia-pacific'],
        includeESGFactors: true,
        liquidityRequirement: 'medium',
        researchDepth: 'standard',
        maximumIdeas: 6
      }
    },
    esg_focused: {
      name: 'ESG-Focused Investment',
      description: 'Environmentally and socially responsible investments',
      parameters: {
        investmentHorizon: 'long-term',
        riskTolerance: 'moderate',
        assetClasses: ['equities', 'fixed-income'],
        thematicFocus: ['clean-energy', 'sustainable-agriculture', 'social-impact'],
        includeESGFactors: true,
        excludedSectors: ['tobacco', 'weapons', 'fossil-fuels'],
        liquidityRequirement: 'medium',
        researchDepth: 'comprehensive',
        maximumIdeas: 7
      }
    },
    short_term_tactical: {
      name: 'Short-Term Tactical Opportunities',
      description: 'Short-term trading opportunities based on market conditions',
      parameters: {
        investmentHorizon: 'short-term',
        riskTolerance: 'aggressive',
        assetClasses: ['equities', 'currencies', 'commodities'],
        liquidityRequirement: 'high',
        researchDepth: 'deep-dive',
        includeBacktesting: true,
        includeRiskAnalysis: true,
        maximumIdeas: 10
      }
    }
  };

  res.json({
    templates,
    message: 'Available request parameter templates'
  });
});

/**
 * @route GET /api/v1/ideas/requests/validation/schema
 * @desc Get the validation schema for request parameters
 * @access Private
 */
router.get('/requests/validation/schema', (req, res) => {
  const schema = {
    type: 'object',
    required: ['investmentHorizon', 'riskTolerance'],
    properties: {
      investmentHorizon: {
        type: 'string',
        enum: ['intraday', 'short-term', 'medium-term', 'long-term', 'flexible'],
        description: 'Investment time horizon'
      },
      riskTolerance: {
        type: 'string',
        enum: ['very-conservative', 'conservative', 'moderate', 'aggressive', 'very-aggressive'],
        description: 'Risk tolerance level'
      },
      investmentAmount: {
        type: 'number',
        minimum: 100,
        maximum: 1000000000,
        description: 'Investment amount in base currency'
      },
      currency: {
        type: 'string',
        enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'],
        description: 'Base currency for investment amount'
      },
      sectors: {
        type: 'array',
        items: { type: 'string' },
        maxItems: 20,
        description: 'Preferred investment sectors'
      },
      assetClasses: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['equities', 'fixed-income', 'commodities', 'currencies', 'real-estate', 'alternatives', 'cryptocurrencies', 'derivatives']
        },
        description: 'Preferred asset classes'
      },
      geographicFocus: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['north-america', 'europe', 'asia-pacific', 'emerging-markets', 'global', 'domestic']
        },
        description: 'Geographic investment focus'
      },
      excludedInvestments: {
        type: 'array',
        items: { type: 'string' },
        maxItems: 100,
        description: 'Specific investments to exclude'
      },
      excludedSectors: {
        type: 'array',
        items: { type: 'string' },
        maxItems: 15,
        description: 'Sectors to exclude from consideration'
      },
      minimumConfidence: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        description: 'Minimum confidence score for generated ideas'
      },
      maximumIdeas: {
        type: 'number',
        minimum: 1,
        maximum: 20,
        description: 'Maximum number of investment ideas to generate'
      },
      includeAlternatives: {
        type: 'boolean',
        description: 'Include alternative investments'
      },
      includeESGFactors: {
        type: 'boolean',
        description: 'Include ESG (Environmental, Social, Governance) factors'
      },
      researchDepth: {
        type: 'string',
        enum: ['basic', 'standard', 'comprehensive', 'deep-dive'],
        description: 'Depth of research to perform'
      },
      thematicFocus: {
        type: 'array',
        items: { type: 'string' },
        description: 'Thematic investment focuses'
      },
      liquidityRequirement: {
        type: 'string',
        enum: ['high', 'medium', 'low', 'flexible'],
        description: 'Liquidity requirement for investments'
      },
      outputFormat: {
        type: 'string',
        enum: ['detailed', 'summary', 'executive', 'technical', 'presentation'],
        description: 'Preferred output format'
      },
      includeVisualizations: {
        type: 'boolean',
        description: 'Include charts and visualizations'
      },
      includeBacktesting: {
        type: 'boolean',
        description: 'Include historical backtesting analysis'
      },
      includeRiskAnalysis: {
        type: 'boolean',
        description: 'Include detailed risk analysis'
      }
    }
  };

  res.json({
    schema,
    message: 'Request parameter validation schema'
  });
});

export default router;