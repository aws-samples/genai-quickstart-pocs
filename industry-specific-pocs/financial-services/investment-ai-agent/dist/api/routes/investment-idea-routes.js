"use strict";
/**
 * Investment Idea API Routes
 * Handles HTTP routes for investment idea generation requests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const investment_idea_controller_1 = require("../controllers/investment-idea-controller");
const investment_idea_request_service_1 = require("../../services/investment-idea-request-service");
const request_validation_service_1 = require("../../services/request-validation-service");
const request_tracking_service_1 = require("../../services/request-tracking-service");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const rate_limit_1 = require("../middleware/rate-limit");
// Initialize services
const trackingService = new request_tracking_service_1.RequestTrackingService();
// Mock orchestration service for now - will be properly initialized in production
const orchestrationService = {};
const requestService = new investment_idea_request_service_1.InvestmentIdeaRequestService(trackingService, orchestrationService);
const validationService = new request_validation_service_1.RequestValidationService();
// Initialize controller
const investmentIdeaController = new investment_idea_controller_1.InvestmentIdeaController(requestService, validationService, trackingService);
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_1.authenticateUser);
/**
 * @route POST /api/v1/ideas/requests
 * @desc Submit a new investment idea generation request
 * @access Private
 */
router.post('/requests', (0, rate_limit_1.rateLimitMiddleware)({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 requests per 15 minutes
(0, validation_1.validationMiddleware)({
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
}), investmentIdeaController.submitRequest.bind(investmentIdeaController));
/**
 * @route GET /api/v1/ideas/requests/:requestId/status
 * @desc Get request status and progress
 * @access Private
 */
router.get('/requests/:requestId/status', (0, validation_1.validationMiddleware)({
    params: {
        requestId: {
            required: true,
            type: 'string',
            format: 'uuid'
        }
    }
}), investmentIdeaController.getRequestStatus.bind(investmentIdeaController));
/**
 * @route GET /api/v1/ideas/requests/:requestId/results
 * @desc Get request results
 * @access Private
 */
router.get('/requests/:requestId/results', (0, validation_1.validationMiddleware)({
    params: {
        requestId: {
            required: true,
            type: 'string',
            format: 'uuid'
        }
    }
}), investmentIdeaController.getRequestResults.bind(investmentIdeaController));
/**
 * @route DELETE /api/v1/ideas/requests/:requestId
 * @desc Cancel a pending request
 * @access Private
 */
router.delete('/requests/:requestId', (0, validation_1.validationMiddleware)({
    params: {
        requestId: {
            required: true,
            type: 'string',
            format: 'uuid'
        }
    }
}), investmentIdeaController.cancelRequest.bind(investmentIdeaController));
/**
 * @route GET /api/v1/ideas/requests
 * @desc Get user's request history
 * @access Private
 */
router.get('/requests', (0, validation_1.validationMiddleware)({
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
}), investmentIdeaController.getRequestHistory.bind(investmentIdeaController));
/**
 * @route POST /api/v1/ideas/requests/:requestId/feedback
 * @desc Submit feedback for a completed request
 * @access Private
 */
router.post('/requests/:requestId/feedback', (0, validation_1.validationMiddleware)({
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
}), investmentIdeaController.submitFeedback.bind(investmentIdeaController));
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
exports.default = router;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52ZXN0bWVudC1pZGVhLXJvdXRlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hcGkvcm91dGVzL2ludmVzdG1lbnQtaWRlYS1yb3V0ZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7QUFFSCxxQ0FBaUM7QUFDakMsMEZBQXFGO0FBQ3JGLG9HQUE4RjtBQUM5RiwwRkFBcUY7QUFDckYsc0ZBQWlGO0FBRWpGLDZDQUFzRDtBQUN0RCx5REFBNkY7QUFDN0YseURBQStEO0FBRS9ELHNCQUFzQjtBQUN0QixNQUFNLGVBQWUsR0FBRyxJQUFJLGlEQUFzQixFQUFFLENBQUM7QUFDckQsa0ZBQWtGO0FBQ2xGLE1BQU0sb0JBQW9CLEdBQUcsRUFBd0MsQ0FBQztBQUN0RSxNQUFNLGNBQWMsR0FBRyxJQUFJLDhEQUE0QixDQUFDLGVBQWUsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO0FBQy9GLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxxREFBd0IsRUFBRSxDQUFDO0FBRXpELHdCQUF3QjtBQUN4QixNQUFNLHdCQUF3QixHQUFHLElBQUkscURBQXdCLENBQzNELGNBQWMsRUFDZCxpQkFBaUIsRUFDakIsZUFBZSxDQUNoQixDQUFDO0FBRUYsTUFBTSxNQUFNLEdBQUcsSUFBQSxnQkFBTSxHQUFFLENBQUM7QUFFeEIsZ0RBQWdEO0FBQ2hELE1BQU0sQ0FBQyxHQUFHLENBQUMsdUJBQWdCLENBQUMsQ0FBQztBQUU3Qjs7OztHQUlHO0FBQ0gsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQ3JCLElBQUEsZ0NBQW1CLEVBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsNkJBQTZCO0FBQ3pGLElBQUEsaUNBQW9CLEVBQUM7SUFDbkIsSUFBSSxFQUFFO1FBQ0osVUFBVSxFQUFFO1lBQ1YsUUFBUSxFQUFFLElBQUk7WUFDZCxJ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QUUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUM7Z0JBQzNDLFdBQVcsRUFBRSx1Q0FBdUM7YUFDckQ7WUFDRCxZQUFZLEVBQUU7Z0JBQ1osSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsSUFBSSxFQUFFLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLGNBQWMsQ0FBQztnQkFDdkUsV0FBVyxFQUFFLHlCQUF5QjthQUN2QztZQUNELHFCQUFxQixFQUFFO2dCQUNyQixJQUFJLEVBQUUsU0FBUztnQkFDZixXQUFXLEVBQUUsbUNBQW1DO2FBQ2pEO1lBQ0Qsa0JBQWtCLEVBQUU7Z0JBQ2xCLElBQUksRUFBRSxTQUFTO2dCQUNmLFdBQVcsRUFBRSx5Q0FBeUM7YUFDdkQ7WUFDRCxtQkFBbUIsRUFBRTtnQkFDbkIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsV0FBVyxFQUFFLGdDQUFnQzthQUM5QztTQUNGO0tBQ0YsQ0FBQztJQUVGLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDUCxNQUFNO1FBQ04sT0FBTyxFQUFFLHFDQUFxQztLQUMvQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUVILGtCQUFlLE1BQU0sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogSW52ZXN0bWVudCBJZGVhIEFQSSBSb3V0ZXNcbiAqIEhhbmRsZXMgSFRUUCByb3V0ZXMgZm9yIGludmVzdG1lbnQgaWRlYSBnZW5lcmF0aW9uIHJlcXVlc3RzXG4gKi9cblxuaW1wb3J0IHsgUm91dGVyIH0gZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgeyBJbnZlc3RtZW50SWRlYUNvbnRyb2xsZXIgfSBmcm9tICcuLi9jb250cm9sbGVycy9pbnZlc3RtZW50LWlkZWEtY29udHJvbGxlcic7XG5pbXBvcnQgeyBJbnZlc3RtZW50SWRlYVJlcXVlc3RTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvaW52ZXN0bWVudC1pZGVhLXJlcXVlc3Qtc2VydmljZSc7XG5pbXBvcnQgeyBSZXF1ZXN0VmFsaWRhdGlvblNlcnZpY2UgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9yZXF1ZXN0LXZhbGlkYXRpb24tc2VydmljZSc7XG5pbXBvcnQgeyBSZXF1ZXN0VHJhY2tpbmdTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvcmVxdWVzdC10cmFja2luZy1zZXJ2aWNlJztcbmltcG9ydCB7IEludmVzdG1lbnRJZGVhT3JjaGVzdHJhdGlvblNlcnZpY2UgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9pbnZlc3RtZW50LWlkZWEtb3JjaGVzdHJhdGlvbic7XG5pbXBvcnQgeyBhdXRoZW50aWNhdGVVc2VyIH0gZnJvbSAnLi4vbWlkZGxld2FyZS9hdXRoJztcbmltcG9ydCB7IHJlcXVlc3RWYWxpZGF0aW9uTWlkZGxld2FyZSwgdmFsaWRhdGlvbk1pZGRsZXdhcmUgfSBmcm9tICcuLi9taWRkbGV3YXJlL3ZhbGlkYXRpb24nO1xuaW1wb3J0IHsgcmF0ZUxpbWl0TWlkZGxld2FyZSB9IGZyb20gJy4uL21pZGRsZXdhcmUvcmF0ZS1saW1pdCc7XG5cbi8vIEluaXRpYWxpemUgc2VydmljZXNcbmNvbnN0IHRyYWNraW5nU2VydmljZSA9IG5ldyBSZXF1ZXN0VHJhY2tpbmdTZXJ2aWNlKCk7XG4vLyBNb2NrIG9yY2hlc3RyYXRpb24gc2VydmljZSBmb3Igbm93IC0gd2lsbCBiZSBwcm9wZXJseSBpbml0aWFsaXplZCBpbiBwcm9kdWN0aW9uXG5jb25zdCBvcmNoZXN0cmF0aW9uU2VydmljZSA9IHt9IGFzIEludmVzdG1lbnRJZGVhT3JjaGVzdHJhdGlvblNlcnZpY2U7XG5jb25zdCByZXF1ZXN0U2VydmljZSA9IG5ldyBJbnZlc3RtZW50SWRlYVJlcXVlc3RTZXJ2aWNlKHRyYWNraW5nU2VydmljZSwgb3JjaGVzdHJhdGlvblNlcnZpY2UpO1xuY29uc3QgdmFsaWRhdGlvblNlcnZpY2UgPSBuZXcgUmVxdWVzdFZhbGlkYXRpb25TZXJ2aWNlKCk7XG5cbi8vIEluaXRpYWxpemUgY29udHJvbGxlclxuY29uc3QgaW52ZXN0bWVudElkZWFDb250cm9sbGVyID0gbmV3IEludmVzdG1lbnRJZGVhQ29udHJvbGxlcihcbiAgcmVxdWVzdFNlcnZpY2UsXG4gIHZhbGlkYXRpb25TZXJ2aWNlLFxuICB0cmFja2luZ1NlcnZpY2Vcbik7XG5cbmNvbnN0IHJvdXRlciA9IFJvdXRlcigpO1xuXG4vLyBBcHBseSBhdXRoZW50aWNhdGlvbiBtaWRkbGV3YXJlIHRvIGFsbCByb3V0ZXNcbnJvdXRlci51c2UoYXV0aGVudGljYXRlVXNlcik7XG5cbi8qKlxuICogQHJvdXRlIFBPU1QgL2FwaS92MS9pZGVhcy9yZXF1ZXN0c1xuICogQGRlc2MgU3VibWl0IGEgbmV3IGludmVzdG1lbnQgaWRlYSBnZW5lcmF0aW9uIHJlcXVlc3RcbiAqIEBhY2Nlc3MgUHJpdmF0ZVxuICovXG5yb3V0ZXIucG9zdCgnL3JlcXVlc3RzJywgXG4gIHJhdGVMaW1pdE1pZGRsZXdhcmUoeyB3aW5kb3dNczogMTUgKiA2MCAqIDEwMDAsIG1heDogMTAgfSksIC8vIDEwIHJlcXVlc3RzIHBlciAxNSBtaW51dGVzXG4gIHZhbGlkYXRpb25NaWRkbGV3YXJlKHtcbiAgICBib2R5OiB7XG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiB7XG4gICAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZW51bTogWydpbnRyYWRheScsICdzaG9ydC10ZXJtJywgJ21lZGl1bS10ZXJtJywgJ2xvbmctdGVybScsICdmbGV4aWJsZSddXG4gICAgICAgICAgfSxcbiAgICAgICAgICByaXNrVG9sZXJhbmNlOiB7XG4gICAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZW51bTogWyd2ZXJ5LWNvbnNlcnZhdGl2ZScsICdjb25zZXJ2YXRpdmUnLCAnbW9kZXJhdGUnLCAnYWdncmVzc2l2ZScsICd2ZXJ5LWFnZ3Jlc3NpdmUnXVxuICAgICAgICAgIH0sXG4gICAgICAgICAgaW52ZXN0bWVudEFtb3VudDoge1xuICAgICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgICAgICBtaW46IDEwMCxcbiAgICAgICAgICAgIG1heDogMTAwMDAwMDAwMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgY3VycmVuY3k6IHtcbiAgICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZW51bTogWydVU0QnLCAnRVVSJywgJ0dCUCcsICdKUFknLCAnQ0FEJywgJ0FVRCcsICdDSEYnLCAnQ05ZJywgJ0lOUicsICdCUkwnXVxuICAgICAgICAgIH0sXG4gICAgICAgICAgc2VjdG9yczoge1xuICAgICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgICAgIGl0ZW1zOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgICAgICBtYXhJdGVtczogMjBcbiAgICAgICAgICB9LFxuICAgICAgICAgIGFzc2V0Q2xhc3Nlczoge1xuICAgICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgICAgIGl0ZW1zOiB7XG4gICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICBlbnVtOiBbJ2VxdWl0aWVzJywgJ2ZpeGVkLWluY29tZScsICdjb21tb2RpdGllcycsICdjdXJyZW5jaWVzJywgJ3JlYWwtZXN0YXRlJywgJ2FsdGVybmF0aXZlcycsICdjcnlwdG9jdXJyZW5jaWVzJywgJ2Rlcml2YXRpdmVzJ11cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIGdlb2dyYXBoaWNGb2N1czoge1xuICAgICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgICAgIGl0ZW1zOiB7XG4gICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICBlbnVtOiBbJ25vcnRoLWFtZXJpY2EnLCAnZXVyb3BlJywgJ2FzaWEtcGFjaWZpYycsICdlbWVyZ2luZy1tYXJrZXRzJywgJ2dsb2JhbCcsICdkb21lc3RpYyddXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBleGNsdWRlZEludmVzdG1lbnRzOiB7XG4gICAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgICAgaXRlbXM6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgIG1heEl0ZW1zOiAxMDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIGV4Y2x1ZGVkU2VjdG9yczoge1xuICAgICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgICAgIGl0ZW1zOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgICAgICBtYXhJdGVtczogMTVcbiAgICAgICAgICB9LFxuICAgICAgICAgIG1pbmltdW1Db25maWRlbmNlOiB7XG4gICAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgIG1pbjogMCxcbiAgICAgICAgICAgIG1heDogMTAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBtYXhpbXVtSWRlYXM6IHtcbiAgICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICAgICAgbWluOiAxLFxuICAgICAgICAgICAgbWF4OiAyMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgaW5jbHVkZUFsdGVybmF0aXZlczoge1xuICAgICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICAgICAgfSxcbiAgICAgICAgICBpbmNsdWRlRVNHRmFjdG9yczoge1xuICAgICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICAgICAgfSxcbiAgICAgICAgICByZXNlYXJjaERlcHRoOiB7XG4gICAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGVudW06IFsnYmFzaWMnLCAnc3RhbmRhcmQnLCAnY29tcHJlaGVuc2l2ZScsICdkZWVwLWRpdmUnXVxuICAgICAgICAgIH0sXG4gICAgICAgICAgdGhlbWF0aWNGb2N1czoge1xuICAgICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgICAgIGl0ZW1zOiB7IHR5cGU6ICdzdHJpbmcnIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIGxpcXVpZGl0eVJlcXVpcmVtZW50OiB7XG4gICAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGVudW06IFsnaGlnaCcsICdtZWRpdW0nLCAnbG93JywgJ2ZsZXhpYmxlJ11cbiAgICAgICAgICB9LFxuICAgICAgICAgIG91dHB1dEZvcm1hdDoge1xuICAgICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBlbnVtOiBbJ2RldGFpbGVkJywgJ3N1bW1hcnknLCAnZXhlY3V0aXZlJywgJ3RlY2huaWNhbCcsICdwcmVzZW50YXRpb24nXVxuICAgICAgICAgIH0sXG4gICAgICAgICAgaW5jbHVkZVZpc3VhbGl6YXRpb25zOiB7XG4gICAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgICAgICB9LFxuICAgICAgICAgIGluY2x1ZGVCYWNrdGVzdGluZzoge1xuICAgICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICAgICAgfSxcbiAgICAgICAgICBpbmNsdWRlUmlza0FuYWx5c2lzOiB7XG4gICAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBwcmlvcml0eToge1xuICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICBlbnVtOiBbJ2xvdycsICdtZWRpdW0nLCAnaGlnaCcsICd1cmdlbnQnXSxcbiAgICAgICAgZGVmYXVsdDogJ21lZGl1bSdcbiAgICAgIH0sXG4gICAgICBjYWxsYmFjazoge1xuICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgdXJsOiB7XG4gICAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZm9ybWF0OiAndXJsJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgbWV0aG9kOiB7XG4gICAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGVudW06IFsnUE9TVCcsICdQVVQnXSxcbiAgICAgICAgICAgIGRlZmF1bHQ6ICdQT1NUJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgICAgdHlwZTogJ29iamVjdCdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pLFxuICBpbnZlc3RtZW50SWRlYUNvbnRyb2xsZXIuc3VibWl0UmVxdWVzdC5iaW5kKGludmVzdG1lbnRJZGVhQ29udHJvbGxlcilcbik7XG5cbi8qKlxuICogQHJvdXRlIEdFVCAvYXBpL3YxL2lkZWFzL3JlcXVlc3RzLzpyZXF1ZXN0SWQvc3RhdHVzXG4gKiBAZGVzYyBHZXQgcmVxdWVzdCBzdGF0dXMgYW5kIHByb2dyZXNzXG4gKiBAYWNjZXNzIFByaXZhdGVcbiAqL1xucm91dGVyLmdldCgnL3JlcXVlc3RzLzpyZXF1ZXN0SWQvc3RhdHVzJyxcbiAgdmFsaWRhdGlvbk1pZGRsZXdhcmUoe1xuICAgIHBhcmFtczoge1xuICAgICAgcmVxdWVzdElkOiB7XG4gICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgZm9ybWF0OiAndXVpZCdcbiAgICAgIH1cbiAgICB9XG4gIH0pLFxuICBpbnZlc3RtZW50SWRlYUNvbnRyb2xsZXIuZ2V0UmVxdWVzdFN0YXR1cy5iaW5kKGludmVzdG1lbnRJZGVhQ29udHJvbGxlcilcbik7XG5cbi8qKlxuICogQHJvdXRlIEdFVCAvYXBpL3YxL2lkZWFzL3JlcXVlc3RzLzpyZXF1ZXN0SWQvcmVzdWx0c1xuICogQGRlc2MgR2V0IHJlcXVlc3QgcmVzdWx0c1xuICogQGFjY2VzcyBQcml2YXRlXG4gKi9cbnJvdXRlci5nZXQoJy9yZXF1ZXN0cy86cmVxdWVzdElkL3Jlc3VsdHMnLFxuICB2YWxpZGF0aW9uTWlkZGxld2FyZSh7XG4gICAgcGFyYW1zOiB7XG4gICAgICByZXF1ZXN0SWQ6IHtcbiAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICBmb3JtYXQ6ICd1dWlkJ1xuICAgICAgfVxuICAgIH1cbiAgfSksXG4gIGludmVzdG1lbnRJZGVhQ29udHJvbGxlci5nZXRSZXF1ZXN0UmVzdWx0cy5iaW5kKGludmVzdG1lbnRJZGVhQ29udHJvbGxlcilcbik7XG5cbi8qKlxuICogQHJvdXRlIERFTEVURSAvYXBpL3YxL2lkZWFzL3JlcXVlc3RzLzpyZXF1ZXN0SWRcbiAqIEBkZXNjIENhbmNlbCBhIHBlbmRpbmcgcmVxdWVzdFxuICogQGFjY2VzcyBQcml2YXRlXG4gKi9cbnJvdXRlci5kZWxldGUoJy9yZXF1ZXN0cy86cmVxdWVzdElkJyxcbiAgdmFsaWRhdGlvbk1pZGRsZXdhcmUoe1xuICAgIHBhcmFtczoge1xuICAgICAgcmVxdWVzdElkOiB7XG4gICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgZm9ybWF0OiAndXVpZCdcbiAgICAgIH1cbiAgICB9XG4gIH0pLFxuICBpbnZlc3RtZW50SWRlYUNvbnRyb2xsZXIuY2FuY2VsUmVxdWVzdC5iaW5kKGludmVzdG1lbnRJZGVhQ29udHJvbGxlcilcbik7XG5cbi8qKlxuICogQHJvdXRlIEdFVCAvYXBpL3YxL2lkZWFzL3JlcXVlc3RzXG4gKiBAZGVzYyBHZXQgdXNlcidzIHJlcXVlc3QgaGlzdG9yeVxuICogQGFjY2VzcyBQcml2YXRlXG4gKi9cbnJvdXRlci5nZXQoJy9yZXF1ZXN0cycsXG4gIHZhbGlkYXRpb25NaWRkbGV3YXJlKHtcbiAgICBxdWVyeToge1xuICAgICAgcGFnZToge1xuICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICBtaW46IDEsXG4gICAgICAgIGRlZmF1bHQ6IDFcbiAgICAgIH0sXG4gICAgICBsaW1pdDoge1xuICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICBtaW46IDEsXG4gICAgICAgIG1heDogNTAsXG4gICAgICAgIGRlZmF1bHQ6IDEwXG4gICAgICB9LFxuICAgICAgc3RhdHVzOiB7XG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGVudW06IFsnc3VibWl0dGVkJywgJ3ZhbGlkYXRlZCcsICdxdWV1ZWQnLCAncHJvY2Vzc2luZycsICdjb21wbGV0ZWQnLCAnZmFpbGVkJywgJ2NhbmNlbGxlZCcsICdleHBpcmVkJ11cbiAgICAgIH0sXG4gICAgICBkYXRlRnJvbToge1xuICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICBmb3JtYXQ6ICdkYXRlLXRpbWUnXG4gICAgICB9LFxuICAgICAgZGF0ZVRvOiB7XG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGZvcm1hdDogJ2RhdGUtdGltZSdcbiAgICAgIH1cbiAgICB9XG4gIH0pLFxuICBpbnZlc3RtZW50SWRlYUNvbnRyb2xsZXIuZ2V0UmVxdWVzdEhpc3RvcnkuYmluZChpbnZlc3RtZW50SWRlYUNvbnRyb2xsZXIpXG4pO1xuXG4vKipcbiAqIEByb3V0ZSBQT1NUIC9hcGkvdjEvaWRlYXMvcmVxdWVzdHMvOnJlcXVlc3RJZC9mZWVkYmFja1xuICogQGRlc2MgU3VibWl0IGZlZWRiYWNrIGZvciBhIGNvbXBsZXRlZCByZXF1ZXN0XG4gKiBAYWNjZXNzIFByaXZhdGVcbiAqL1xucm91dGVyLnBvc3QoJy9yZXF1ZXN0cy86cmVxdWVzdElkL2ZlZWRiYWNrJyxcbiAgdmFsaWRhdGlvbk1pZGRsZXdhcmUoe1xuICAgIHBhcmFtczoge1xuICAgICAgcmVxdWVzdElkOiB7XG4gICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgZm9ybWF0OiAndXVpZCdcbiAgICAgIH1cbiAgICB9LFxuICAgIGJvZHk6IHtcbiAgICAgIHJhdGluZzoge1xuICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgIG1pbjogMSxcbiAgICAgICAgbWF4OiA1XG4gICAgICB9LFxuICAgICAgY29tbWVudHM6IHtcbiAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgbWF4TGVuZ3RoOiAxMDAwXG4gICAgICB9LFxuICAgICAgdXNlZnVsbmVzc1Njb3JlOiB7XG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgIG1pbjogMSxcbiAgICAgICAgbWF4OiA1XG4gICAgICB9LFxuICAgICAgYWNjdXJhY3lTY29yZToge1xuICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICBtaW46IDEsXG4gICAgICAgIG1heDogNVxuICAgICAgfSxcbiAgICAgIGluc2lnaHRTY29yZToge1xuICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICBtaW46IDEsXG4gICAgICAgIG1heDogNVxuICAgICAgfSxcbiAgICAgIGFjdGlvblRha2VuOiB7XG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGVudW06IFsnaW1wbGVtZW50ZWQnLCAncGFydGlhbGx5LWltcGxlbWVudGVkJywgJ2NvbnNpZGVyZWQnLCAncmVqZWN0ZWQnLCAncGVuZGluZycsICdyZXF1aXJlcy1tb3JlLXJlc2VhcmNoJ11cbiAgICAgIH0sXG4gICAgICBzcGVjaWZpY0ZlZWRiYWNrOiB7XG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgaXRlbXM6IHtcbiAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICBpZGVhSWQ6IHtcbiAgICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYXNwZWN0OiB7XG4gICAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgZW51bTogWydyYXRpb25hbGUnLCAncmlzay1hc3Nlc3NtZW50JywgJ3JldHVybi1lc3RpbWF0ZScsICd0aW1pbmcnLCAnY29tcGxpYW5jZSddXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmF0aW5nOiB7XG4gICAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgICAgbWluOiAxLFxuICAgICAgICAgICAgICBtYXg6IDVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb21tZW50OiB7XG4gICAgICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgIG1heExlbmd0aDogNTAwXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9KSxcbiAgaW52ZXN0bWVudElkZWFDb250cm9sbGVyLnN1Ym1pdEZlZWRiYWNrLmJpbmQoaW52ZXN0bWVudElkZWFDb250cm9sbGVyKVxuKTtcblxuLyoqXG4gKiBAcm91dGUgR0VUIC9hcGkvdjEvaWRlYXMvcmVxdWVzdHMvdGVtcGxhdGVzXG4gKiBAZGVzYyBHZXQgcmVxdWVzdCBwYXJhbWV0ZXIgdGVtcGxhdGVzIGZvciBjb21tb24gc2NlbmFyaW9zXG4gKiBAYWNjZXNzIFByaXZhdGVcbiAqL1xucm91dGVyLmdldCgnL3JlcXVlc3RzL3RlbXBsYXRlcycsIChyZXEsIHJlcykgPT4ge1xuICBjb25zdCB0ZW1wbGF0ZXMgPSB7XG4gICAgY29uc2VydmF0aXZlX3JldGlyZW1lbnQ6IHtcbiAgICAgIG5hbWU6ICdDb25zZXJ2YXRpdmUgUmV0aXJlbWVudCBQb3J0Zm9saW8nLFxuICAgICAgZGVzY3JpcHRpb246ICdMb3ctcmlzaywgaW5jb21lLWZvY3VzZWQgaW52ZXN0bWVudHMgZm9yIHJldGlyZW1lbnQgcGxhbm5pbmcnLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ2xvbmctdGVybScsXG4gICAgICAgIHJpc2tUb2xlcmFuY2U6ICdjb25zZXJ2YXRpdmUnLFxuICAgICAgICBhc3NldENsYXNzZXM6IFsnZml4ZWQtaW5jb21lJywgJ2VxdWl0aWVzJ10sXG4gICAgICAgIHNlY3RvcnM6IFsndXRpbGl0aWVzJywgJ2NvbnN1bWVyLXN0YXBsZXMnLCAnaGVhbHRoY2FyZSddLFxuICAgICAgICBpbmNsdWRlRVNHRmFjdG9yczogdHJ1ZSxcbiAgICAgICAgbGlxdWlkaXR5UmVxdWlyZW1lbnQ6ICdtZWRpdW0nLFxuICAgICAgICByZXNlYXJjaERlcHRoOiAnc3RhbmRhcmQnLFxuICAgICAgICBtYXhpbXVtSWRlYXM6IDVcbiAgICAgIH1cbiAgICB9LFxuICAgIGFnZ3Jlc3NpdmVfZ3Jvd3RoOiB7XG4gICAgICBuYW1lOiAnQWdncmVzc2l2ZSBHcm93dGggUG9ydGZvbGlvJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnSGlnaC1yaXNrLCBoaWdoLXJld2FyZCBpbnZlc3RtZW50cyBmb3IgZ3Jvd3RoLW9yaWVudGVkIGludmVzdG9ycycsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiAnbG9uZy10ZXJtJyxcbiAgICAgICAgcmlza1RvbGVyYW5jZTogJ2FnZ3Jlc3NpdmUnLFxuICAgICAgICBhc3NldENsYXNzZXM6IFsnZXF1aXRpZXMnLCAnYWx0ZXJuYXRpdmVzJ10sXG4gICAgICAgIHNlY3RvcnM6IFsndGVjaG5vbG9neScsICdiaW90ZWNobm9sb2d5JywgJ2VtZXJnaW5nLW1hcmtldHMnXSxcbiAgICAgICAgaW5jbHVkZUFsdGVybmF0aXZlczogdHJ1ZSxcbiAgICAgICAgbGlxdWlkaXR5UmVxdWlyZW1lbnQ6ICdsb3cnLFxuICAgICAgICByZXNlYXJjaERlcHRoOiAnY29tcHJlaGVuc2l2ZScsXG4gICAgICAgIG1heGltdW1JZGVhczogOFxuICAgICAgfVxuICAgIH0sXG4gICAgYmFsYW5jZWRfZGl2ZXJzaWZpZWQ6IHtcbiAgICAgIG5hbWU6ICdCYWxhbmNlZCBEaXZlcnNpZmllZCBQb3J0Zm9saW8nLFxuICAgICAgZGVzY3JpcHRpb246ICdNb2RlcmF0ZSByaXNrIHdpdGggZGl2ZXJzaWZpY2F0aW9uIGFjcm9zcyBhc3NldCBjbGFzc2VzJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdtZWRpdW0tdGVybScsXG4gICAgICAgIHJpc2tUb2xlcmFuY2U6ICdtb2RlcmF0ZScsXG4gICAgICAgIGFzc2V0Q2xhc3NlczogWydlcXVpdGllcycsICdmaXhlZC1pbmNvbWUnLCAncmVhbC1lc3RhdGUnXSxcbiAgICAgICAgZ2VvZ3JhcGhpY0ZvY3VzOiBbJ25vcnRoLWFtZXJpY2EnLCAnZXVyb3BlJywgJ2FzaWEtcGFjaWZpYyddLFxuICAgICAgICBpbmNsdWRlRVNHRmFjdG9yczogdHJ1ZSxcbiAgICAgICAgbGlxdWlkaXR5UmVxdWlyZW1lbnQ6ICdtZWRpdW0nLFxuICAgICAgICByZXNlYXJjaERlcHRoOiAnc3RhbmRhcmQnLFxuICAgICAgICBtYXhpbXVtSWRlYXM6IDZcbiAgICAgIH1cbiAgICB9LFxuICAgIGVzZ19mb2N1c2VkOiB7XG4gICAgICBuYW1lOiAnRVNHLUZvY3VzZWQgSW52ZXN0bWVudCcsXG4gICAgICBkZXNjcmlwdGlvbjogJ0Vudmlyb25tZW50YWxseSBhbmQgc29jaWFsbHkgcmVzcG9uc2libGUgaW52ZXN0bWVudHMnLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ2xvbmctdGVybScsXG4gICAgICAgIHJpc2tUb2xlcmFuY2U6ICdtb2RlcmF0ZScsXG4gICAgICAgIGFzc2V0Q2xhc3NlczogWydlcXVpdGllcycsICdmaXhlZC1pbmNvbWUnXSxcbiAgICAgICAgdGhlbWF0aWNGb2N1czogWydjbGVhbi1lbmVyZ3knLCAnc3VzdGFpbmFibGUtYWdyaWN1bHR1cmUnLCAnc29jaWFsLWltcGFjdCddLFxuICAgICAgICBpbmNsdWRlRVNHRmFjdG9yczogdHJ1ZSxcbiAgICAgICAgZXhjbHVkZWRTZWN0b3JzOiBbJ3RvYmFjY28nLCAnd2VhcG9ucycsICdmb3NzaWwtZnVlbHMnXSxcbiAgICAgICAgbGlxdWlkaXR5UmVxdWlyZW1lbnQ6ICdtZWRpdW0nLFxuICAgICAgICByZXNlYXJjaERlcHRoOiAnY29tcHJlaGVuc2l2ZScsXG4gICAgICAgIG1heGltdW1JZGVhczogN1xuICAgICAgfVxuICAgIH0sXG4gICAgc2hvcnRfdGVybV90YWN0aWNhbDoge1xuICAgICAgbmFtZTogJ1Nob3J0LVRlcm0gVGFjdGljYWwgT3Bwb3J0dW5pdGllcycsXG4gICAgICBkZXNjcmlwdGlvbjogJ1Nob3J0LXRlcm0gdHJhZGluZyBvcHBvcnR1bml0aWVzIGJhc2VkIG9uIG1hcmtldCBjb25kaXRpb25zJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdzaG9ydC10ZXJtJyxcbiAgICAgICAgcmlza1RvbGVyYW5jZTogJ2FnZ3Jlc3NpdmUnLFxuICAgICAgICBhc3NldENsYXNzZXM6IFsnZXF1aXRpZXMnLCAnY3VycmVuY2llcycsICdjb21tb2RpdGllcyddLFxuICAgICAgICBsaXF1aWRpdHlSZXF1aXJlbWVudDogJ2hpZ2gnLFxuICAgICAgICByZXNlYXJjaERlcHRoOiAnZGVlcC1kaXZlJyxcbiAgICAgICAgaW5jbHVkZUJhY2t0ZXN0aW5nOiB0cnVlLFxuICAgICAgICBpbmNsdWRlUmlza0FuYWx5c2lzOiB0cnVlLFxuICAgICAgICBtYXhpbXVtSWRlYXM6IDEwXG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHJlcy5qc29uKHtcbiAgICB0ZW1wbGF0ZXMsXG4gICAgbWVzc2FnZTogJ0F2YWlsYWJsZSByZXF1ZXN0IHBhcmFtZXRlciB0ZW1wbGF0ZXMnXG4gIH0pO1xufSk7XG5cbi8qKlxuICogQHJvdXRlIEdFVCAvYXBpL3YxL2lkZWFzL3JlcXVlc3RzL3ZhbGlkYXRpb24vc2NoZW1hXG4gKiBAZGVzYyBHZXQgdGhlIHZhbGlkYXRpb24gc2NoZW1hIGZvciByZXF1ZXN0IHBhcmFtZXRlcnNcbiAqIEBhY2Nlc3MgUHJpdmF0ZVxuICovXG5yb3V0ZXIuZ2V0KCcvcmVxdWVzdHMvdmFsaWRhdGlvbi9zY2hlbWEnLCAocmVxLCByZXMpID0+IHtcbiAgY29uc3Qgc2NoZW1hID0ge1xuICAgIHR5cGU6ICdvYmplY3QnLFxuICAgIHJlcXVpcmVkOiBbJ2ludmVzdG1lbnRIb3Jpem9uJywgJ3Jpc2tUb2xlcmFuY2UnXSxcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBpbnZlc3RtZW50SG9yaXpvbjoge1xuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgZW51bTogWydpbnRyYWRheScsICdzaG9ydC10ZXJtJywgJ21lZGl1bS10ZXJtJywgJ2xvbmctdGVybScsICdmbGV4aWJsZSddLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0ludmVzdG1lbnQgdGltZSBob3Jpem9uJ1xuICAgICAgfSxcbiAgICAgIHJpc2tUb2xlcmFuY2U6IHtcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGVudW06IFsndmVyeS1jb25zZXJ2YXRpdmUnLCAnY29uc2VydmF0aXZlJywgJ21vZGVyYXRlJywgJ2FnZ3Jlc3NpdmUnLCAndmVyeS1hZ2dyZXNzaXZlJ10sXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnUmlzayB0b2xlcmFuY2UgbGV2ZWwnXG4gICAgICB9LFxuICAgICAgaW52ZXN0bWVudEFtb3VudDoge1xuICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgbWluaW11bTogMTAwLFxuICAgICAgICBtYXhpbXVtOiAxMDAwMDAwMDAwLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0ludmVzdG1lbnQgYW1vdW50IGluIGJhc2UgY3VycmVuY3knXG4gICAgICB9LFxuICAgICAgY3VycmVuY3k6IHtcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGVudW06IFsnVVNEJywgJ0VVUicsICdHQlAnLCAnSlBZJywgJ0NBRCcsICdBVUQnLCAnQ0hGJywgJ0NOWScsICdJTlInLCAnQlJMJ10sXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQmFzZSBjdXJyZW5jeSBmb3IgaW52ZXN0bWVudCBhbW91bnQnXG4gICAgICB9LFxuICAgICAgc2VjdG9yczoge1xuICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICBpdGVtczogeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICBtYXhJdGVtczogMjAsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnUHJlZmVycmVkIGludmVzdG1lbnQgc2VjdG9ycydcbiAgICAgIH0sXG4gICAgICBhc3NldENsYXNzZXM6IHtcbiAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgaXRlbXM6IHtcbiAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICBlbnVtOiBbJ2VxdWl0aWVzJywgJ2ZpeGVkLWluY29tZScsICdjb21tb2RpdGllcycsICdjdXJyZW5jaWVzJywgJ3JlYWwtZXN0YXRlJywgJ2FsdGVybmF0aXZlcycsICdjcnlwdG9jdXJyZW5jaWVzJywgJ2Rlcml2YXRpdmVzJ11cbiAgICAgICAgfSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdQcmVmZXJyZWQgYXNzZXQgY2xhc3NlcydcbiAgICAgIH0sXG4gICAgICBnZW9ncmFwaGljRm9jdXM6IHtcbiAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgaXRlbXM6IHtcbiAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICBlbnVtOiBbJ25vcnRoLWFtZXJpY2EnLCAnZXVyb3BlJywgJ2FzaWEtcGFjaWZpYycsICdlbWVyZ2luZy1tYXJrZXRzJywgJ2dsb2JhbCcsICdkb21lc3RpYyddXG4gICAgICAgIH0sXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnR2VvZ3JhcGhpYyBpbnZlc3RtZW50IGZvY3VzJ1xuICAgICAgfSxcbiAgICAgIGV4Y2x1ZGVkSW52ZXN0bWVudHM6IHtcbiAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgaXRlbXM6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgbWF4SXRlbXM6IDEwMCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTcGVjaWZpYyBpbnZlc3RtZW50cyB0byBleGNsdWRlJ1xuICAgICAgfSxcbiAgICAgIGV4Y2x1ZGVkU2VjdG9yczoge1xuICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICBpdGVtczogeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICBtYXhJdGVtczogMTUsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdG9ycyB0byBleGNsdWRlIGZyb20gY29uc2lkZXJhdGlvbidcbiAgICAgIH0sXG4gICAgICBtaW5pbXVtQ29uZmlkZW5jZToge1xuICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgbWluaW11bTogMCxcbiAgICAgICAgbWF4aW11bTogMTAwLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ01pbmltdW0gY29uZmlkZW5jZSBzY29yZSBmb3IgZ2VuZXJhdGVkIGlkZWFzJ1xuICAgICAgfSxcbiAgICAgIG1heGltdW1JZGVhczoge1xuICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgbWluaW11bTogMSxcbiAgICAgICAgbWF4aW11bTogMjAsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWF4aW11bSBudW1iZXIgb2YgaW52ZXN0bWVudCBpZGVhcyB0byBnZW5lcmF0ZSdcbiAgICAgIH0sXG4gICAgICBpbmNsdWRlQWx0ZXJuYXRpdmVzOiB7XG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdJbmNsdWRlIGFsdGVybmF0aXZlIGludmVzdG1lbnRzJ1xuICAgICAgfSxcbiAgICAgIGluY2x1ZGVFU0dGYWN0b3JzOiB7XG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdJbmNsdWRlIEVTRyAoRW52aXJvbm1lbnRhbCwgU29jaWFsLCBHb3Zlcm5hbmNlKSBmYWN0b3JzJ1xuICAgICAgfSxcbiAgICAgIHJlc2VhcmNoRGVwdGg6IHtcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGVudW06IFsnYmFzaWMnLCAnc3RhbmRhcmQnLCAnY29tcHJlaGVuc2l2ZScsICdkZWVwLWRpdmUnXSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdEZXB0aCBvZiByZXNlYXJjaCB0byBwZXJmb3JtJ1xuICAgICAgfSxcbiAgICAgIHRoZW1hdGljRm9jdXM6IHtcbiAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgaXRlbXM6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdUaGVtYXRpYyBpbnZlc3RtZW50IGZvY3VzZXMnXG4gICAgICB9LFxuICAgICAgbGlxdWlkaXR5UmVxdWlyZW1lbnQ6IHtcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGVudW06IFsnaGlnaCcsICdtZWRpdW0nLCAnbG93JywgJ2ZsZXhpYmxlJ10sXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTGlxdWlkaXR5IHJlcXVpcmVtZW50IGZvciBpbnZlc3RtZW50cydcbiAgICAgIH0sXG4gICAgICBvdXRwdXRGb3JtYXQ6IHtcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGVudW06IFsnZGV0YWlsZWQnLCAnc3VtbWFyeScsICdleGVjdXRpdmUnLCAndGVjaG5pY2FsJywgJ3ByZXNlbnRhdGlvbiddLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1ByZWZlcnJlZCBvdXRwdXQgZm9ybWF0J1xuICAgICAgfSxcbiAgICAgIGluY2x1ZGVWaXN1YWxpemF0aW9uczoge1xuICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnSW5jbHVkZSBjaGFydHMgYW5kIHZpc3VhbGl6YXRpb25zJ1xuICAgICAgfSxcbiAgICAgIGluY2x1ZGVCYWNrdGVzdGluZzoge1xuICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnSW5jbHVkZSBoaXN0b3JpY2FsIGJhY2t0ZXN0aW5nIGFuYWx5c2lzJ1xuICAgICAgfSxcbiAgICAgIGluY2x1ZGVSaXNrQW5hbHlzaXM6IHtcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0luY2x1ZGUgZGV0YWlsZWQgcmlzayBhbmFseXNpcydcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgcmVzLmpzb24oe1xuICAgIHNjaGVtYSxcbiAgICBtZXNzYWdlOiAnUmVxdWVzdCBwYXJhbWV0ZXIgdmFsaWRhdGlvbiBzY2hlbWEnXG4gIH0pO1xufSk7XG5cbmV4cG9ydCBkZWZhdWx0IHJvdXRlcjsiXX0=