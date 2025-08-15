"use strict";
/**
 * Mock data for testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testUtils = exports.mockApiResponses = exports.createMockFeedback = exports.createMockMarketDataPoint = exports.createMockRequest = exports.createMockInvestmentIdea = exports.createMockUser = exports.mockFeedback = exports.mockMarketData = exports.mockInvestmentIdeas = exports.mockUsers = void 0;
exports.mockUsers = [
    {
        id: 'user-1',
        organizationId: 'org-1',
        role: 'analyst',
        permissions: ['read:ideas', 'write:ideas'],
        preferences: {
            investmentHorizon: 'medium',
            riskTolerance: 'moderate',
            preferredSectors: ['technology', 'healthcare'],
            preferredAssetClasses: ['stocks'],
            excludedInvestments: [],
            notificationSettings: {
                email: true,
                push: false,
                frequency: 'daily',
                types: {
                    ideaGeneration: true,
                    marketAlerts: true,
                    complianceIssues: true,
                    systemUpdates: false
                }
            }
        },
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
    },
    {
        id: 'user-2',
        organizationId: 'org-1',
        role: 'portfolio-manager',
        permissions: ['read:ideas', 'write:ideas', 'admin:users'],
        preferences: {
            investmentHorizon: 'long',
            riskTolerance: 'aggressive',
            preferredSectors: ['technology', 'finance'],
            preferredAssetClasses: ['stocks', 'bonds'],
            excludedInvestments: ['crypto'],
            notificationSettings: {
                email: true,
                push: true,
                frequency: 'immediate',
                types: {
                    ideaGeneration: true,
                    marketAlerts: true,
                    complianceIssues: true,
                    systemUpdates: true
                }
            }
        },
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
    }
];
exports.mockInvestmentIdeas = [
    {
        id: 'idea-1',
        version: 1,
        title: 'AI Technology Growth Opportunity',
        description: 'Investment in artificial intelligence companies showing strong growth potential',
        investments: [],
        rationale: 'Strong fundamentals and growing market demand for AI solutions',
        strategy: 'buy',
        timeHorizon: 'medium',
        confidenceScore: 0.85,
        generatedAt: new Date('2023-06-01'),
        lastUpdatedAt: new Date('2023-06-01'),
        potentialOutcomes: [
            {
                scenario: 'best',
                probability: 0.2,
                returnEstimate: 0.35,
                timeToRealization: 365,
                description: 'AI market exceeds expectations',
                conditions: ['Strong earnings growth', 'Market expansion'],
                keyRisks: ['Market volatility'],
                catalysts: ['Earnings growth']
            },
            {
                scenario: 'expected',
                probability: 0.6,
                returnEstimate: 0.15,
                timeToRealization: 180,
                description: 'Steady growth in AI adoption',
                conditions: ['Normal market conditions'],
                keyRisks: ['Competition'],
                catalysts: ['Market adoption']
            },
            {
                scenario: 'worst',
                probability: 0.2,
                returnEstimate: -0.10,
                timeToRealization: 90,
                description: 'AI market slowdown',
                conditions: ['Economic downturn', 'Regulatory challenges'],
                keyRisks: ['Regulatory risk'],
                catalysts: ['Economic recovery']
            }
        ],
        supportingData: [
            {
                source: 'market-analysis',
                type: 'fundamental',
                value: { revenue_growth: 0.25, profit_margin: 0.18 },
                timestamp: new Date('2023-05-30'),
                reliability: 0.9
            }
        ],
        counterArguments: [
            {
                description: 'High valuation compared to traditional tech stocks',
                strength: 'moderate',
                impact: 'medium',
                probability: 0.3,
                mitigationStrategy: 'Focus on companies with proven revenue streams'
            }
        ],
        complianceStatus: {
            compliant: true,
            issues: [],
            regulationsChecked: ['SEC-RULE-1', 'FINRA-2111'],
            timestamp: new Date('2023-06-01')
        },
        createdBy: 'claude-sonnet-3.7',
        tags: ['technology', 'AI'],
        category: 'equity',
        riskLevel: 'moderate',
        targetAudience: ['institutional'],
        metadata: {
            sourceModels: ['claude-sonnet-3.7'],
            processingTime: 5000,
            dataSourcesUsed: ['market-data'],
            researchDepth: 'standard',
            qualityScore: 85,
            noveltyScore: 70,
            marketConditionsAtGeneration: {
                volatilityIndex: 25,
                marketTrend: 'bull',
                economicIndicators: { gdp_growth: 2.5 },
                geopoliticalRisk: 'low'
            }
        },
        trackingInfo: {
            views: 0,
            implementations: 0,
            feedback: [],
            performance: [],
            status: 'active',
            statusHistory: []
        }
    }
];
exports.mockMarketData = [
    {
        id: 'market-data-1',
        symbol: 'AAPL',
        dataType: 'price',
        value: 150.25,
        timestamp: new Date('2023-06-01T16:00:00Z'),
        source: 'alpha-vantage',
        interval: '1min',
        metadata: {
            volume: 50000000,
            high: 152.00,
            low: 149.50,
            open: 151.00
        }
    },
    {
        id: 'market-data-2',
        symbol: 'MSFT',
        dataType: 'price',
        value: 280.75,
        timestamp: new Date('2023-06-01T16:00:00Z'),
        source: 'alpha-vantage',
        interval: '1min',
        metadata: {
            volume: 30000000,
            high: 282.00,
            low: 278.50,
            open: 279.00
        }
    }
];
exports.mockFeedback = [
    {
        id: 'feedback-1',
        userId: 'user-1',
        investmentIdeaId: 'idea-1',
        feedbackType: 'investment-idea-quality',
        rating: 4,
        category: 'accuracy',
        title: 'Good Analysis',
        description: 'Good analysis, but could use more risk assessment',
        tags: ['analysis', 'risk'],
        sentiment: 'positive',
        priority: 'medium',
        status: 'submitted',
        metadata: {
            source: 'web',
            sessionId: 'session-1',
            userAgent: 'Mozilla/5.0...'
        },
        createdAt: new Date('2023-06-02'),
        updatedAt: new Date('2023-06-02')
    }
];
// Factory functions for creating test data
const createMockUser = (overrides = {}) => ({
    id: `user-${Date.now()}`,
    organizationId: 'test-org',
    role: 'analyst',
    permissions: ['read:ideas'],
    preferences: {
        investmentHorizon: 'medium',
        riskTolerance: 'moderate',
        preferredSectors: [],
        preferredAssetClasses: [],
        excludedInvestments: [],
        notificationSettings: {
            email: true,
            push: false,
            frequency: 'daily',
            types: {
                ideaGeneration: true,
                marketAlerts: true,
                complianceIssues: true,
                systemUpdates: false
            }
        }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
});
exports.createMockUser = createMockUser;
const createMockInvestmentIdea = (overrides = {}) => ({
    id: `idea-${Date.now()}`,
    version: 1,
    title: 'Test Investment Idea',
    description: 'A test investment idea for unit testing',
    investments: [],
    rationale: 'Test rationale',
    strategy: 'buy',
    timeHorizon: 'medium',
    confidenceScore: 0.75,
    generatedAt: new Date(),
    lastUpdatedAt: new Date(),
    potentialOutcomes: [],
    supportingData: [],
    counterArguments: [],
    complianceStatus: {
        compliant: true,
        issues: [],
        regulationsChecked: [],
        timestamp: new Date()
    },
    createdBy: 'test-model',
    tags: [],
    category: 'equity',
    riskLevel: 'moderate',
    targetAudience: ['institutional'],
    metadata: {
        sourceModels: ['test-model'],
        processingTime: 1000,
        dataSourcesUsed: ['test-data'],
        researchDepth: 'basic',
        qualityScore: 75,
        noveltyScore: 60,
        marketConditionsAtGeneration: {
            volatilityIndex: 20,
            marketTrend: 'sideways',
            economicIndicators: {},
            geopoliticalRisk: 'low'
        }
    },
    trackingInfo: {
        views: 0,
        implementations: 0,
        feedback: [],
        performance: [],
        status: 'active',
        statusHistory: []
    },
    ...overrides
});
exports.createMockInvestmentIdea = createMockInvestmentIdea;
// Mock request factory for testing
const createMockRequest = (overrides = {}) => ({
    id: `request-${Date.now()}`,
    userId: 'test-user',
    parameters: {
        investmentHorizon: 'medium',
        riskTolerance: 'moderate'
    },
    priority: 'medium',
    complexity: 'standard',
    status: 'submitted',
    submittedAt: new Date(),
    metadata: {},
    ...overrides
});
exports.createMockRequest = createMockRequest;
const createMockMarketDataPoint = (overrides = {}) => ({
    id: `market-${Date.now()}`,
    symbol: 'TEST',
    dataType: 'price',
    value: 100.00,
    timestamp: new Date(),
    source: 'test-provider',
    interval: '1min',
    metadata: {},
    ...overrides
});
exports.createMockMarketDataPoint = createMockMarketDataPoint;
const createMockFeedback = (overrides = {}) => ({
    id: `feedback-${Date.now()}`,
    userId: 'test-user',
    feedbackType: 'investment-idea-quality',
    rating: 3,
    category: 'accuracy',
    title: 'Test Feedback',
    description: 'Test feedback description',
    tags: [],
    sentiment: 'neutral',
    priority: 'medium',
    status: 'submitted',
    metadata: {
        source: 'web'
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
});
exports.createMockFeedback = createMockFeedback;
// Mock API responses
exports.mockApiResponses = {
    bedrockInvokeModel: {
        body: new TextEncoder().encode(JSON.stringify({
            completion: 'Mock AI response',
            stop_reason: 'end_turn'
        }))
    },
    marketDataApi: {
        'Global Quote': {
            '01. symbol': 'AAPL',
            '05. price': '150.25',
            '07. latest trading day': '2023-06-01',
            '09. change': '2.50',
            '10. change percent': '1.69%'
        }
    }
};
// Test utilities
exports.testUtils = {
    // Generate random test data
    randomString: (length = 10) => Math.random().toString(36).substring(2, length + 2),
    randomNumber: (min = 0, max = 100) => Math.floor(Math.random() * (max - min + 1)) + min,
    randomDate: (start = new Date(2023, 0, 1), end = new Date()) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())),
    // Async test helpers
    waitFor: (condition, timeout = 5000) => {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const check = () => {
                if (condition()) {
                    resolve();
                }
                else if (Date.now() - startTime > timeout) {
                    reject(new Error('Timeout waiting for condition'));
                }
                else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9jay1kYXRhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL19fdGVzdHNfXy9tb2NrLWRhdGEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOzs7QUFTVSxRQUFBLFNBQVMsR0FBVztJQUMvQjtRQUNFLEVBQUUsRUFBRSxRQUFRO1FBQ1osY0FBYyxFQUFFLE9BQU87UUFDdkIsSUFBSSxFQUFFLFNBQVM7UUFDZixXQUFXLEVBQUUsQ0FBQyxZQUFZLEVBQUUsYUFBYSxDQUFDO1FBQzFDLFdBQVcsRUFBRTtZQUNYLGlCQUFpQixFQUFFLFFBQVE7WUFDM0IsYUFBYSxFQUFFLFVBQVU7WUFDekIsZ0JBQWdCLEVBQUUsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDO1lBQzlDLHFCQUFxQixFQUFFLENBQUMsUUFBUSxDQUFDO1lBQ2pDLG1CQUFtQixFQUFFLEVBQUU7WUFDdkIsb0JBQW9CLEVBQUU7Z0JBQ3BCLEtBQUssRUFBRSxJQUFJO2dCQUNYLElBQUksRUFBRSxLQUFLO2dCQUNYLFNBQVMsRUFBRSxPQUFPO2dCQUNsQixLQUFLLEVBQUU7b0JBQ0wsY0FBYyxFQUFFLElBQUk7b0JBQ3BCLFlBQVksRUFBRSxJQUFJO29CQUNsQixnQkFBZ0IsRUFBRSxJQUFJO29CQUN0QixhQUFhLEVBQUUsS0FBSztpQkFDckI7YUFDRjtTQUNGO1FBQ0QsU0FBUyxFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQztRQUNqQyxTQUFTLEVBQUUsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDO0tBQ2xDO0lBQ0Q7UUFDRSxFQUFFLEVBQUUsUUFBUTtRQUNaLGNBQWMsRUFBRSxPQUFPO1FBQ3ZCLElBQUksRUFBRSxtQkFBbUI7UUFDekIsV0FBVyxFQUFFLENBQUMsWUFBWSxFQUFFLGFBQWEsRUFBRSxhQUFhLENBQUM7UUFDekQsV0FBVyxFQUFFO1lBQ1gsaUJBQWlCLEVBQUUsTUFBTTtZQUN6QixhQUFhLEVBQUUsWUFBWTtZQUMzQixnQkFB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QUFVLEVBQUUsQ0FBQyxRQUFjLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsTUFBWSxJQUFJLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FDekUsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsR0FBRyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztJQUUvRSxxQkFBcUI7SUFDckIsT0FBTyxFQUFFLENBQUMsU0FBd0IsRUFBRSxVQUFrQixJQUFJLEVBQUUsRUFBRTtRQUM1RCxPQUFPLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQzNDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUM3QixNQUFNLEtBQUssR0FBRyxHQUFHLEVBQUU7Z0JBQ2pCLElBQUksU0FBUyxFQUFFLEVBQUU7b0JBQ2YsT0FBTyxFQUFFLENBQUM7aUJBQ1g7cUJBQU0sSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxHQUFHLE9BQU8sRUFBRTtvQkFDM0MsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUMsQ0FBQztpQkFDcEQ7cUJBQU07b0JBQ0wsVUFBVSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztpQkFDeEI7WUFDSCxDQUFDLENBQUM7WUFDRixLQUFLLEVBQUUsQ0FBQztRQUNWLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIE1vY2sgZGF0YSBmb3IgdGVzdGluZ1xuICovXG5cbmltcG9ydCB7IFxuICBVc2VyLCBcbiAgSW52ZXN0bWVudElkZWEsIFxuICBNYXJrZXREYXRhUG9pbnQsXG4gIEZlZWRiYWNrXG59IGZyb20gJy4uL21vZGVscyc7XG5cbmV4cG9ydCBjb25zdCBtb2NrVXNlcnM6IFVzZXJbXSA9IFtcbiAge1xuICAgIGlkOiAndXNlci0xJyxcbiAgICBvcmdhbml6YXRpb25JZDogJ29yZy0xJyxcbiAgICByb2xlOiAnYW5hbHlzdCcsXG4gICAgcGVybWlzc2lvbnM6IFsncmVhZDppZGVhcycsICd3cml0ZTppZGVhcyddLFxuICAgIHByZWZlcmVuY2VzOiB7XG4gICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ21lZGl1bScsXG4gICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnLFxuICAgICAgcHJlZmVycmVkU2VjdG9yczogWyd0ZWNobm9sb2d5JywgJ2hlYWx0aGNhcmUnXSxcbiAgICAgIHByZWZlcnJlZEFzc2V0Q2xhc3NlczogWydzdG9ja3MnXSxcbiAgICAgIGV4Y2x1ZGVkSW52ZXN0bWVudHM6IFtdLFxuICAgICAgbm90aWZpY2F0aW9uU2V0dGluZ3M6IHtcbiAgICAgICAgZW1haWw6IHRydWUsXG4gICAgICAgIHB1c2g6IGZhbHNlLFxuICAgICAgICBmcmVxdWVuY3k6ICdkYWlseScsXG4gICAgICAgIHR5cGVzOiB7XG4gICAgICAgICAgaWRlYUdlbmVyYXRpb246IHRydWUsXG4gICAgICAgICAgbWFya2V0QWxlcnRzOiB0cnVlLFxuICAgICAgICAgIGNvbXBsaWFuY2VJc3N1ZXM6IHRydWUsXG4gICAgICAgICAgc3lzdGVtVXBkYXRlczogZmFsc2VcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgnMjAyMy0wMS0wMScpLFxuICAgIHVwZGF0ZWRBdDogbmV3IERhdGUoJzIwMjMtMDEtMDEnKVxuICB9LFxuICB7XG4gICAgaWQ6ICd1c2VyLTInLFxuICAgIG9yZ2FuaXphdGlvbklkOiAnb3JnLTEnLFxuICAgIHJvbGU6ICdwb3J0Zm9saW8tbWFuYWdlcicsXG4gICAgcGVybWlzc2lvbnM6IFsncmVhZDppZGVhcycsICd3cml0ZTppZGVhcycsICdhZG1pbjp1c2VycyddLFxuICAgIHByZWZlcmVuY2VzOiB7XG4gICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ2xvbmcnLFxuICAgICAgcmlza1RvbGVyYW5jZTogJ2FnZ3Jlc3NpdmUnLFxuICAgICAgcHJlZmVycmVkU2VjdG9yczogWyd0ZWNobm9sb2d5JywgJ2ZpbmFuY2UnXSxcbiAgICAgIHByZWZlcnJlZEFzc2V0Q2xhc3NlczogWydzdG9ja3MnLCAnYm9uZHMnXSxcbiAgICAgIGV4Y2x1ZGVkSW52ZXN0bWVudHM6IFsnY3J5cHRvJ10sXG4gICAgICBub3RpZmljYXRpb25TZXR0aW5nczoge1xuICAgICAgICBlbWFpbDogdHJ1ZSxcbiAgICAgICAgcHVzaDogdHJ1ZSxcbiAgICAgICAgZnJlcXVlbmN5OiAnaW1tZWRpYXRlJyxcbiAgICAgICAgdHlwZXM6IHtcbiAgICAgICAgICBpZGVhR2VuZXJhdGlvbjogdHJ1ZSxcbiAgICAgICAgICBtYXJrZXRBbGVydHM6IHRydWUsXG4gICAgICAgICAgY29tcGxpYW5jZUlzc3VlczogdHJ1ZSxcbiAgICAgICAgICBzeXN0ZW1VcGRhdGVzOiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoJzIwMjMtMDEtMDEnKSxcbiAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCcyMDIzLTAxLTAxJylcbiAgfVxuXTtcblxuZXhwb3J0IGNvbnN0IG1vY2tJbnZlc3RtZW50SWRlYXM6IEludmVzdG1lbnRJZGVhW10gPSBbXG4gIHtcbiAgICBpZDogJ2lkZWEtMScsXG4gICAgdmVyc2lvbjogMSxcbiAgICB0aXRsZTogJ0FJIFRlY2hub2xvZ3kgR3Jvd3RoIE9wcG9ydHVuaXR5JyxcbiAgICBkZXNjcmlwdGlvbjogJ0ludmVzdG1lbnQgaW4gYXJ0aWZpY2lhbCBpbnRlbGxpZ2VuY2UgY29tcGFuaWVzIHNob3dpbmcgc3Ryb25nIGdyb3d0aCBwb3RlbnRpYWwnLFxuICAgIGludmVzdG1lbnRzOiBbXSxcbiAgICByYXRpb25hbGU6ICdTdHJvbmcgZnVuZGFtZW50YWxzIGFuZCBncm93aW5nIG1hcmtldCBkZW1hbmQgZm9yIEFJIHNvbHV0aW9ucycsXG4gICAgc3RyYXRlZ3k6ICdidXknLFxuICAgIHRpbWVIb3Jpem9uOiAnbWVkaXVtJyxcbiAgICBjb25maWRlbmNlU2NvcmU6IDAuODUsXG4gICAgZ2VuZXJhdGVkQXQ6IG5ldyBEYXRlKCcyMDIzLTA2LTAxJyksXG4gICAgbGFzdFVwZGF0ZWRBdDogbmV3IERhdGUoJzIwMjMtMDYtMDEnKSxcbiAgICBwb3RlbnRpYWxPdXRjb21lczogW1xuICAgICAge1xuICAgICAgICBzY2VuYXJpbzogJ2Jlc3QnLFxuICAgICAgICBwcm9iYWJpbGl0eTogMC4yLFxuICAgICAgICByZXR1cm5Fc3RpbWF0ZTogMC4zNSxcbiAgICAgICAgdGltZVRvUmVhbGl6YXRpb246IDM2NSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBSSBtYXJrZXQgZXhjZWVkcyBleHBlY3RhdGlvbnMnLFxuICAgICAgICBjb25kaXRpb25zOiBbJ1N0cm9uZyBlYXJuaW5ncyBncm93dGgnLCAnTWFya2V0IGV4cGFuc2lvbiddLFxuICAgICAgICBrZXlSaXNrczogWydNYXJrZXQgdm9sYXRpbGl0eSddLFxuICAgICAgICBjYXRhbHlzdHM6IFsnRWFybmluZ3MgZ3Jvd3RoJ11cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNjZW5hcmlvOiAnZXhwZWN0ZWQnLFxuICAgICAgICBwcm9iYWJpbGl0eTogMC42LFxuICAgICAgICByZXR1cm5Fc3RpbWF0ZTogMC4xNSxcbiAgICAgICAgdGltZVRvUmVhbGl6YXRpb246IDE4MCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTdGVhZHkgZ3Jvd3RoIGluIEFJIGFkb3B0aW9uJyxcbiAgICAgICAgY29uZGl0aW9uczogWydOb3JtYWwgbWFya2V0IGNvbmRpdGlvbnMnXSxcbiAgICAgICAga2V5Umlza3M6IFsnQ29tcGV0aXRpb24nXSxcbiAgICAgICAgY2F0YWx5c3RzOiBbJ01hcmtldCBhZG9wdGlvbiddXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzY2VuYXJpbzogJ3dvcnN0JyxcbiAgICAgICAgcHJvYmFiaWxpdHk6IDAuMixcbiAgICAgICAgcmV0dXJuRXN0aW1hdGU6IC0wLjEwLFxuICAgICAgICB0aW1lVG9SZWFsaXphdGlvbjogOTAsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQUkgbWFya2V0IHNsb3dkb3duJyxcbiAgICAgICAgY29uZGl0aW9uczogWydFY29ub21pYyBkb3dudHVybicsICdSZWd1bGF0b3J5IGNoYWxsZW5nZXMnXSxcbiAgICAgICAga2V5Umlza3M6IFsnUmVndWxhdG9yeSByaXNrJ10sXG4gICAgICAgIGNhdGFseXN0czogWydFY29ub21pYyByZWNvdmVyeSddXG4gICAgICB9XG4gICAgXSxcbiAgICBzdXBwb3J0aW5nRGF0YTogW1xuICAgICAge1xuICAgICAgICBzb3VyY2U6ICdtYXJrZXQtYW5hbHlzaXMnLFxuICAgICAgICB0eXBlOiAnZnVuZGFtZW50YWwnLFxuICAgICAgICB2YWx1ZTogeyByZXZlbnVlX2dyb3d0aDogMC4yNSwgcHJvZml0X21hcmdpbjogMC4xOCB9LFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCcyMDIzLTA1LTMwJyksXG4gICAgICAgIHJlbGlhYmlsaXR5OiAwLjlcbiAgICAgIH1cbiAgICBdLFxuICAgIGNvdW50ZXJBcmd1bWVudHM6IFtcbiAgICAgIHtcbiAgICAgICAgZGVzY3JpcHRpb246ICdIaWdoIHZhbHVhdGlvbiBjb21wYXJlZCB0byB0cmFkaXRpb25hbCB0ZWNoIHN0b2NrcycsXG4gICAgICAgIHN0cmVuZ3RoOiAnbW9kZXJhdGUnLFxuICAgICAgICBpbXBhY3Q6ICdtZWRpdW0nLFxuICAgICAgICBwcm9iYWJpbGl0eTogMC4zLFxuICAgICAgICBtaXRpZ2F0aW9uU3RyYXRlZ3k6ICdGb2N1cyBvbiBjb21wYW5pZXMgd2l0aCBwcm92ZW4gcmV2ZW51ZSBzdHJlYW1zJ1xuICAgICAgfVxuICAgIF0sXG4gICAgY29tcGxpYW5jZVN0YXR1czoge1xuICAgICAgY29tcGxpYW50OiB0cnVlLFxuICAgICAgaXNzdWVzOiBbXSxcbiAgICAgIHJlZ3VsYXRpb25zQ2hlY2tlZDogWydTRUMtUlVMRS0xJywgJ0ZJTlJBLTIxMTEnXSxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoJzIwMjMtMDYtMDEnKVxuICAgIH0sXG4gICAgY3JlYXRlZEJ5OiAnY2xhdWRlLXNvbm5ldC0zLjcnLFxuICAgIHRhZ3M6IFsndGVjaG5vbG9neScsICdBSSddLFxuICAgIGNhdGVnb3J5OiAnZXF1aXR5JyxcbiAgICByaXNrTGV2ZWw6ICdtb2RlcmF0ZScsXG4gICAgdGFyZ2V0QXVkaWVuY2U6IFsnaW5zdGl0dXRpb25hbCddLFxuICAgIG1ldGFkYXRhOiB7XG4gICAgICBzb3VyY2VNb2RlbHM6IFsnY2xhdWRlLXNvbm5ldC0zLjcnXSxcbiAgICAgIHByb2Nlc3NpbmdUaW1lOiA1MDAwLFxuICAgICAgZGF0YVNvdXJjZXNVc2VkOiBbJ21hcmtldC1kYXRhJ10sXG4gICAgICByZXNlYXJjaERlcHRoOiAnc3RhbmRhcmQnLFxuICAgICAgcXVhbGl0eVNjb3JlOiA4NSxcbiAgICAgIG5vdmVsdHlTY29yZTogNzAsXG4gICAgICBtYXJrZXRDb25kaXRpb25zQXRHZW5lcmF0aW9uOiB7XG4gICAgICAgIHZvbGF0aWxpdHlJbmRleDogMjUsXG4gICAgICAgIG1hcmtldFRyZW5kOiAnYnVsbCcsXG4gICAgICAgIGVjb25vbWljSW5kaWNhdG9yczogeyBnZHBfZ3Jvd3RoOiAyLjUgfSxcbiAgICAgICAgZ2VvcG9saXRpY2FsUmlzazogJ2xvdydcbiAgICAgIH1cbiAgICB9LFxuICAgIHRyYWNraW5nSW5mbzoge1xuICAgICAgdmlld3M6IDAsXG4gICAgICBpbXBsZW1lbnRhdGlvbnM6IDAsXG4gICAgICBmZWVkYmFjazogW10sXG4gICAgICBwZXJmb3JtYW5jZTogW10sXG4gICAgICBzdGF0dXM6ICdhY3RpdmUnLFxuICAgICAgc3RhdHVzSGlzdG9yeTogW11cbiAgICB9XG4gIH1cbl07XG5cblxuXG5leHBvcnQgY29uc3QgbW9ja01hcmtldERhdGE6IE1hcmtldERhdGFQb2ludFtdID0gW1xuICB7XG4gICAgaWQ6ICdtYXJrZXQtZGF0YS0xJyxcbiAgICBzeW1ib2w6ICdBQVBMJyxcbiAgICBkYXRhVHlwZTogJ3ByaWNlJyxcbiAgICB2YWx1ZTogMTUwLjI1LFxuICAgIHRpbWVzdGFtcDogbmV3IERhdGUoJzIwMjMtMDYtMDFUMTY6MDA6MDBaJyksXG4gICAgc291cmNlOiAnYWxwaGEtdmFudGFnZScsXG4gICAgaW50ZXJ2YWw6ICcxbWluJyxcbiAgICBtZXRhZGF0YToge1xuICAgICAgdm9sdW1lOiA1MDAwMDAwMCxcbiAgICAgIGhpZ2g6IDE1Mi4wMCxcbiAgICAgIGxvdzogMTQ5LjUwLFxuICAgICAgb3BlbjogMTUxLjAwXG4gICAgfVxuICB9LFxuICB7XG4gICAgaWQ6ICdtYXJrZXQtZGF0YS0yJyxcbiAgICBzeW1ib2w6ICdNU0ZUJyxcbiAgICBkYXRhVHlwZTogJ3ByaWNlJyxcbiAgICB2YWx1ZTogMjgwLjc1LFxuICAgIHRpbWVzdGFtcDogbmV3IERhdGUoJzIwMjMtMDYtMDFUMTY6MDA6MDBaJyksXG4gICAgc291cmNlOiAnYWxwaGEtdmFudGFnZScsXG4gICAgaW50ZXJ2YWw6ICcxbWluJyxcbiAgICBtZXRhZGF0YToge1xuICAgICAgdm9sdW1lOiAzMDAwMDAwMCxcbiAgICAgIGhpZ2g6IDI4Mi4wMCxcbiAgICAgIGxvdzogMjc4LjUwLFxuICAgICAgb3BlbjogMjc5LjAwXG4gICAgfVxuICB9XG5dO1xuXG5leHBvcnQgY29uc3QgbW9ja0ZlZWRiYWNrOiBGZWVkYmFja1tdID0gW1xuICB7XG4gICAgaWQ6ICdmZWVkYmFjay0xJyxcbiAgICB1c2VySWQ6ICd1c2VyLTEnLFxuICAgIGludmVzdG1lbnRJZGVhSWQ6ICdpZGVhLTEnLFxuICAgIGZlZWRiYWNrVHlwZTogJ2ludmVzdG1lbnQtaWRlYS1xdWFsaXR5JyxcbiAgICByYXRpbmc6IDQsXG4gICAgY2F0ZWdvcnk6ICdhY2N1cmFjeScsXG4gICAgdGl0bGU6ICdHb29kIEFuYWx5c2lzJyxcbiAgICBkZXNjcmlwdGlvbjogJ0dvb2QgYW5hbHlzaXMsIGJ1dCBjb3VsZCB1c2UgbW9yZSByaXNrIGFzc2Vzc21lbnQnLFxuICAgIHRhZ3M6IFsnYW5hbHlzaXMnLCAncmlzayddLFxuICAgIHNlbnRpbWVudDogJ3Bvc2l0aXZlJyxcbiAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgc3RhdHVzOiAnc3VibWl0dGVkJyxcbiAgICBtZXRhZGF0YToge1xuICAgICAgc291cmNlOiAnd2ViJyxcbiAgICAgIHNlc3Npb25JZDogJ3Nlc3Npb24tMScsXG4gICAgICB1c2VyQWdlbnQ6ICdNb3ppbGxhLzUuMC4uLidcbiAgICB9LFxuICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoJzIwMjMtMDYtMDInKSxcbiAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCcyMDIzLTA2LTAyJylcbiAgfVxuXTtcblxuLy8gRmFjdG9yeSBmdW5jdGlvbnMgZm9yIGNyZWF0aW5nIHRlc3QgZGF0YVxuZXhwb3J0IGNvbnN0IGNyZWF0ZU1vY2tVc2VyID0gKG92ZXJyaWRlczogUGFydGlhbDxVc2VyPiA9IHt9KTogVXNlciA9PiAoe1xuICBpZDogYHVzZXItJHtEYXRlLm5vdygpfWAsXG4gIG9yZ2FuaXphdGlvbklkOiAndGVzdC1vcmcnLFxuICByb2xlOiAnYW5hbHlzdCcsXG4gIHBlcm1pc3Npb25zOiBbJ3JlYWQ6aWRlYXMnXSxcbiAgcHJlZmVyZW5jZXM6IHtcbiAgICBpbnZlc3RtZW50SG9yaXpvbjogJ21lZGl1bScsXG4gICAgcmlza1RvbGVyYW5jZTogJ21vZGVyYXRlJyxcbiAgICBwcmVmZXJyZWRTZWN0b3JzOiBbXSxcbiAgICBwcmVmZXJyZWRBc3NldENsYXNzZXM6IFtdLFxuICAgIGV4Y2x1ZGVkSW52ZXN0bWVudHM6IFtdLFxuICAgIG5vdGlmaWNhdGlvblNldHRpbmdzOiB7XG4gICAgICBlbWFpbDogdHJ1ZSxcbiAgICAgIHB1c2g6IGZhbHNlLFxuICAgICAgZnJlcXVlbmN5OiAnZGFpbHknLFxuICAgICAgdHlwZXM6IHtcbiAgICAgICAgaWRlYUdlbmVyYXRpb246IHRydWUsXG4gICAgICAgIG1hcmtldEFsZXJ0czogdHJ1ZSxcbiAgICAgICAgY29tcGxpYW5jZUlzc3VlczogdHJ1ZSxcbiAgICAgICAgc3lzdGVtVXBkYXRlczogZmFsc2VcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIGNyZWF0ZWRBdDogbmV3IERhdGUoKSxcbiAgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLFxuICAuLi5vdmVycmlkZXNcbn0pO1xuXG5leHBvcnQgY29uc3QgY3JlYXRlTW9ja0ludmVzdG1lbnRJZGVhID0gKG92ZXJyaWRlczogUGFydGlhbDxJbnZlc3RtZW50SWRlYT4gPSB7fSk6IEludmVzdG1lbnRJZGVhID0+ICh7XG4gIGlkOiBgaWRlYS0ke0RhdGUubm93KCl9YCxcbiAgdmVyc2lvbjogMSxcbiAgdGl0bGU6ICdUZXN0IEludmVzdG1lbnQgSWRlYScsXG4gIGRlc2NyaXB0aW9uOiAnQSB0ZXN0IGludmVzdG1lbnQgaWRlYSBmb3IgdW5pdCB0ZXN0aW5nJyxcbiAgaW52ZXN0bWVudHM6IFtdLFxuICByYXRpb25hbGU6ICdUZXN0IHJhdGlvbmFsZScsXG4gIHN0cmF0ZWd5OiAnYnV5JyxcbiAgdGltZUhvcml6b246ICdtZWRpdW0nLFxuICBjb25maWRlbmNlU2NvcmU6IDAuNzUsXG4gIGdlbmVyYXRlZEF0OiBuZXcgRGF0ZSgpLFxuICBsYXN0VXBkYXRlZEF0OiBuZXcgRGF0ZSgpLFxuICBwb3RlbnRpYWxPdXRjb21lczogW10sXG4gIHN1cHBvcnRpbmdEYXRhOiBbXSxcbiAgY291bnRlckFyZ3VtZW50czogW10sXG4gIGNvbXBsaWFuY2VTdGF0dXM6IHtcbiAgICBjb21wbGlhbnQ6IHRydWUsXG4gICAgaXNzdWVzOiBbXSxcbiAgICByZWd1bGF0aW9uc0NoZWNrZWQ6IFtdLFxuICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKVxuICB9LFxuICBjcmVhdGVkQnk6ICd0ZXN0LW1vZGVsJyxcbiAgdGFnczogW10sXG4gIGNhdGVnb3J5OiAnZXF1aXR5JyxcbiAgcmlza0xldmVsOiAnbW9kZXJhdGUnLFxuICB0YXJnZXRBdWRpZW5jZTogWydpbnN0aXR1dGlvbmFsJ10sXG4gIG1ldGFkYXRhOiB7XG4gICAgc291cmNlTW9kZWxzOiBbJ3Rlc3QtbW9kZWwnXSxcbiAgICBwcm9jZXNzaW5nVGltZTogMTAwMCxcbiAgICBkYXRhU291cmNlc1VzZWQ6IFsndGVzdC1kYXRhJ10sXG4gICAgcmVzZWFyY2hEZXB0aDogJ2Jhc2ljJyxcbiAgICBxdWFsaXR5U2NvcmU6IDc1LFxuICAgIG5vdmVsdHlTY29yZTogNjAsXG4gICAgbWFya2V0Q29uZGl0aW9uc0F0R2VuZXJhdGlvbjoge1xuICAgICAgdm9sYXRpbGl0eUluZGV4OiAyMCxcbiAgICAgIG1hcmtldFRyZW5kOiAnc2lkZXdheXMnLFxuICAgICAgZWNvbm9taWNJbmRpY2F0b3JzOiB7fSxcbiAgICAgIGdlb3BvbGl0aWNhbFJpc2s6ICdsb3cnXG4gICAgfVxuICB9LFxuICB0cmFja2luZ0luZm86IHtcbiAgICB2aWV3czogMCxcbiAgICBpbXBsZW1lbnRhdGlvbnM6IDAsXG4gICAgZmVlZGJhY2s6IFtdLFxuICAgIHBlcmZvcm1hbmNlOiBbXSxcbiAgICBzdGF0dXM6ICdhY3RpdmUnLFxuICAgIHN0YXR1c0hpc3Rvcnk6IFtdXG4gIH0sXG4gIC4uLm92ZXJyaWRlc1xufSk7XG5cbi8vIE1vY2sgcmVxdWVzdCBmYWN0b3J5IGZvciB0ZXN0aW5nXG5leHBvcnQgY29uc3QgY3JlYXRlTW9ja1JlcXVlc3QgPSAob3ZlcnJpZGVzOiBhbnkgPSB7fSkgPT4gKHtcbiAgaWQ6IGByZXF1ZXN0LSR7RGF0ZS5ub3coKX1gLFxuICB1c2VySWQ6ICd0ZXN0LXVzZXInLFxuICBwYXJhbWV0ZXJzOiB7XG4gICAgaW52ZXN0bWVudEhvcml6b246ICdtZWRpdW0nLFxuICAgIHJpc2tUb2xlcmFuY2U6ICdtb2RlcmF0ZSdcbiAgfSxcbiAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICBjb21wbGV4aXR5OiAnc3RhbmRhcmQnLFxuICBzdGF0dXM6ICdzdWJtaXR0ZWQnLFxuICBzdWJtaXR0ZWRBdDogbmV3IERhdGUoKSxcbiAgbWV0YWRhdGE6IHt9LFxuICAuLi5vdmVycmlkZXNcbn0pO1xuXG5leHBvcnQgY29uc3QgY3JlYXRlTW9ja01hcmtldERhdGFQb2ludCA9IChvdmVycmlkZXM6IFBhcnRpYWw8TWFya2V0RGF0YVBvaW50PiA9IHt9KTogTWFya2V0RGF0YVBvaW50ID0+ICh7XG4gIGlkOiBgbWFya2V0LSR7RGF0ZS5ub3coKX1gLFxuICBzeW1ib2w6ICdURVNUJyxcbiAgZGF0YVR5cGU6ICdwcmljZScsXG4gIHZhbHVlOiAxMDAuMDAsXG4gIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgc291cmNlOiAndGVzdC1wcm92aWRlcicsXG4gIGludGVydmFsOiAnMW1pbicsXG4gIG1ldGFkYXRhOiB7fSxcbiAgLi4ub3ZlcnJpZGVzXG59KTtcblxuZXhwb3J0IGNvbnN0IGNyZWF0ZU1vY2tGZWVkYmFjayA9IChvdmVycmlkZXM6IFBhcnRpYWw8RmVlZGJhY2s+ID0ge30pOiBGZWVkYmFjayA9PiAoe1xuICBpZDogYGZlZWRiYWNrLSR7RGF0ZS5ub3coKX1gLFxuICB1c2VySWQ6ICd0ZXN0LXVzZXInLFxuICBmZWVkYmFja1R5cGU6ICdpbnZlc3RtZW50LWlkZWEtcXVhbGl0eScsXG4gIHJhdGluZzogMyxcbiAgY2F0ZWdvcnk6ICdhY2N1cmFjeScsXG4gIHRpdGxlOiAnVGVzdCBGZWVkYmFjaycsXG4gIGRlc2NyaXB0aW9uOiAnVGVzdCBmZWVkYmFjayBkZXNjcmlwdGlvbicsXG4gIHRhZ3M6IFtdLFxuICBzZW50aW1lbnQ6ICduZXV0cmFsJyxcbiAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICBzdGF0dXM6ICdzdWJtaXR0ZWQnLFxuICBtZXRhZGF0YToge1xuICAgIHNvdXJjZTogJ3dlYidcbiAgfSxcbiAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLFxuICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCksXG4gIC4uLm92ZXJyaWRlc1xufSk7XG5cbi8vIE1vY2sgQVBJIHJlc3BvbnNlc1xuZXhwb3J0IGNvbnN0IG1vY2tBcGlSZXNwb25zZXMgPSB7XG4gIGJlZHJvY2tJbnZva2VNb2RlbDoge1xuICAgIGJvZHk6IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShKU09OLnN0cmluZ2lmeSh7XG4gICAgICBjb21wbGV0aW9uOiAnTW9jayBBSSByZXNwb25zZScsXG4gICAgICBzdG9wX3JlYXNvbjogJ2VuZF90dXJuJ1xuICAgIH0pKVxuICB9LFxuICBcbiAgbWFya2V0RGF0YUFwaToge1xuICAgICdHbG9iYWwgUXVvdGUnOiB7XG4gICAgICAnMDEuIHN5bWJvbCc6ICdBQVBMJyxcbiAgICAgICcwNS4gcHJpY2UnOiAnMTUwLjI1JyxcbiAgICAgICcwNy4gbGF0ZXN0IHRyYWRpbmcgZGF5JzogJzIwMjMtMDYtMDEnLFxuICAgICAgJzA5LiBjaGFuZ2UnOiAnMi41MCcsXG4gICAgICAnMTAuIGNoYW5nZSBwZXJjZW50JzogJzEuNjklJ1xuICAgIH1cbiAgfVxufTtcblxuLy8gVGVzdCB1dGlsaXRpZXNcbmV4cG9ydCBjb25zdCB0ZXN0VXRpbHMgPSB7XG4gIC8vIEdlbmVyYXRlIHJhbmRvbSB0ZXN0IGRhdGFcbiAgcmFuZG9tU3RyaW5nOiAobGVuZ3RoOiBudW1iZXIgPSAxMCkgPT4gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDIsIGxlbmd0aCArIDIpLFxuICByYW5kb21OdW1iZXI6IChtaW46IG51bWJlciA9IDAsIG1heDogbnVtYmVyID0gMTAwKSA9PiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluLFxuICByYW5kb21EYXRlOiAoc3RhcnQ6IERhdGUgPSBuZXcgRGF0ZSgyMDIzLCAwLCAxKSwgZW5kOiBEYXRlID0gbmV3IERhdGUoKSkgPT4gXG4gICAgbmV3IERhdGUoc3RhcnQuZ2V0VGltZSgpICsgTWF0aC5yYW5kb20oKSAqIChlbmQuZ2V0VGltZSgpIC0gc3RhcnQuZ2V0VGltZSgpKSksXG4gIFxuICAvLyBBc3luYyB0ZXN0IGhlbHBlcnNcbiAgd2FpdEZvcjogKGNvbmRpdGlvbjogKCkgPT4gYm9vbGVhbiwgdGltZW91dDogbnVtYmVyID0gNTAwMCkgPT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICAgIGlmIChjb25kaXRpb24oKSkge1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSBlbHNlIGlmIChEYXRlLm5vdygpIC0gc3RhcnRUaW1lID4gdGltZW91dCkge1xuICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ1RpbWVvdXQgd2FpdGluZyBmb3IgY29uZGl0aW9uJykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNldFRpbWVvdXQoY2hlY2ssIDEwMCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBjaGVjaygpO1xuICAgIH0pO1xuICB9XG59OyJdfQ==