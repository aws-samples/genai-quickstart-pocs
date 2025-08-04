/**
 * Mock data for testing
 */

import { 
  User, 
  InvestmentIdea, 
  MarketDataPoint,
  Feedback
} from '../models';

export const mockUsers: User[] = [
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

export const mockInvestmentIdeas: InvestmentIdea[] = [
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



export const mockMarketData: MarketDataPoint[] = [
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

export const mockFeedback: Feedback[] = [
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
export const createMockUser = (overrides: Partial<User> = {}): User => ({
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

export const createMockInvestmentIdea = (overrides: Partial<InvestmentIdea> = {}): InvestmentIdea => ({
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

// Mock request factory for testing
export const createMockRequest = (overrides: any = {}) => ({
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

export const createMockMarketDataPoint = (overrides: Partial<MarketDataPoint> = {}): MarketDataPoint => ({
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

export const createMockFeedback = (overrides: Partial<Feedback> = {}): Feedback => ({
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

// Mock API responses
export const mockApiResponses = {
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
export const testUtils = {
  // Generate random test data
  randomString: (length: number = 10) => Math.random().toString(36).substring(2, length + 2),
  randomNumber: (min: number = 0, max: number = 100) => Math.floor(Math.random() * (max - min + 1)) + min,
  randomDate: (start: Date = new Date(2023, 0, 1), end: Date = new Date()) => 
    new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())),
  
  // Async test helpers
  waitFor: (condition: () => boolean, timeout: number = 5000) => {
    return new Promise<void>((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }
};