/**
 * Mock services factory for testing
 * Provides consistent mocks for all services used in the application
 */

import { jest } from '@jest/globals';
import {
    createMockUser,
    createMockInvestmentIdea,
    createMockFeedback,
    createMockMarketDataPoint,
    createMockRequest
} from './mock-data';

// Service mock factories based on actual service interfaces

export const createMockInvestmentIdeaService = () => {
    const mockService = {
        createInvestmentIdea: jest.fn<any>(),
        updateInvestmentIdea: jest.fn<any>(),
        getInvestmentIdea: jest.fn<any>(),
        getVersionHistory: jest.fn<any>(),
        addFeedback: jest.fn<any>(),
        addPerformanceTracking: jest.fn<any>(),
        updateStatus: jest.fn<any>(),
        searchInvestmentIdeas: jest.fn<any>(),
        getExpiringIdeas: jest.fn<any>()
    };

    mockService.createInvestmentIdea.mockResolvedValue({
        idea: createMockInvestmentIdea(),
        validation: { isValid: true, errors: [] }
    });

    mockService.updateInvestmentIdea.mockResolvedValue({
        idea: createMockInvestmentIdea(),
        validation: { isValid: true, errors: [] },
        changes: []
    });

    mockService.getInvestmentIdea.mockResolvedValue(createMockInvestmentIdea());
    mockService.getVersionHistory.mockResolvedValue([] as any);
    mockService.addFeedback.mockResolvedValue(undefined as any);
    mockService.addPerformanceTracking.mockResolvedValue(undefined as any);
    mockService.updateStatus.mockResolvedValue(undefined as any);
    mockService.searchInvestmentIdeas.mockResolvedValue([createMockInvestmentIdea()]);
    mockService.getExpiringIdeas.mockResolvedValue([createMockInvestmentIdea()]);

    return mockService;
};

export const createMockInvestmentIdeaOrchestrationService = () => {
    const mockService = {
        generateInvestmentIdeas: jest.fn<any>()
    };

    mockService.generateInvestmentIdeas.mockResolvedValue({
        requestId: 'request-123',
        ideas: [createMockInvestmentIdea()],
        metadata: {
            totalIdeasGenerated: 1,
            totalIdeasFiltered: 0,
            filteringCriteria: [],
            confidenceDistribution: { high: 1, medium: 0, low: 0, average: 0.9 },
            processingSteps: []
        },
        processingMetrics: {
            totalProcessingTime: 5000,
            agentProcessingTimes: {},
            dataSourcesAccessed: ['market-data'],
            modelsUsed: ['claude-sonnet-3.7'],
            resourceUtilization: {}
        }
    });

    return mockService;
};

export const createMockAuthService = () => {
    const mockService = {
        registerUser: jest.fn<any>(),
        loginUser: jest.fn<any>(),
        refreshToken: jest.fn<any>(),
        verifyToken: jest.fn<any>(),
        getUserById: jest.fn<any>(),
        updateUser: jest.fn<any>(),
        changePassword: jest.fn<any>(),
        requestPasswordReset: jest.fn<any>(),
        confirmPasswordReset: jest.fn<any>(),
        logoutUser: jest.fn<any>()
    };

    mockService.registerUser.mockResolvedValue({
        user: createMockUser(),
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600
    });

    mockService.loginUser.mockResolvedValue({
        user: createMockUser(),
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600
    });

    mockService.refreshToken.mockResolvedValue({
        user: createMockUser(),
        token: 'new-jwt-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600
    });

    mockService.verifyToken.mockReturnValue({
        userId: 'user-123',
        organizationId: 'org-456',
        role: 'analyst',
        permissions: ['idea:read', 'idea:write']
    });

    mockService.getUserById.mockResolvedValue(createMockUser());
    mockService.updateUser.mockResolvedValue(createMockUser());
    mockService.changePassword.mockResolvedValue(undefined);
    mockService.requestPasswordReset.mockResolvedValue(undefined);
    mockService.confirmPasswordReset.mockResolvedValue(undefined);
    mockService.logoutUser.mockResolvedValue(undefined);

    return mockService;
};

export const createMockFeedbackService = () => {
    const mockService = {
        submitFeedback: jest.fn<any>(),
        getFeedback: jest.fn<any>(),
        searchFeedback: jest.fn<any>(),
        updateFeedbackStatus: jest.fn<any>(),
        getFeedbackSummary: jest.fn<any>(),
        generateFeedbackAnalytics: jest.fn<any>(),
        getFeedbackForInvestmentIdea: jest.fn<any>(),
        getFeedbackForUser: jest.fn<any>()
    };

    mockService.submitFeedback.mockResolvedValue({
        success: true,
        feedback: createMockFeedback()
    });

    mockService.getFeedback.mockResolvedValue(createMockFeedback());

    mockService.searchFeedback.mockResolvedValue({
        feedback: [createMockFeedback()],
        totalCount: 1,
        hasMore: false
    });

    mockService.updateFeedbackStatus.mockResolvedValue(true);

    mockService.getFeedbackSummary.mockResolvedValue({
        totalCount: 10,
        averageRating: 4.2,
        ratingDistribution: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 },
        categoryBreakdown: { accuracy: 5, relevance: 3, completeness: 2, timeliness: 0, usability: 0, performance: 0, compliance: 0, other: 0 },
        typeBreakdown: { 'investment-idea-quality': 5, 'analysis-accuracy': 3, 'system-performance': 2, 'user-experience': 0, 'feature-request': 0, 'bug-report': 0, 'general': 0 },
        sentimentBreakdown: { positive: 7, neutral: 2, negative: 1 },
        statusBreakdown: { submitted: 2, 'under-review': 3, 'in-progress': 2, resolved: 3, dismissed: 0, archived: 0 },
        timeRange: { start: new Date(), end: new Date() }
    });

    mockService.generateFeedbackAnalytics.mockResolvedValue({
        trends: [],
        insights: [],
        recommendations: [],
        correlations: []
    });

    mockService.getFeedbackForInvestmentIdea.mockResolvedValue([createMockFeedback()]);
    mockService.getFeedbackForUser.mockResolvedValue([createMockFeedback()]);

    return mockService;
};

export const createMockMarketDataService = () => {
    const mockService = {
        initialize: jest.fn<any>(),
        addProvider: jest.fn<any>(),
        removeProvider: jest.fn<any>(),
        subscribeToData: jest.fn<any>(),
        unsubscribeFromData: jest.fn<any>(),
        getHistoricalData: jest.fn<any>(),
        getCurrentData: jest.fn<any>(),
        normalizeData: jest.fn<any>(),
        createAlert: jest.fn<any>(),
        updateAlert: jest.fn<any>(),
        deleteAlert: jest.fn<any>(),
        getAlert: jest.fn<any>(),
        listAlerts: jest.fn<any>(),
        enableAlert: jest.fn<any>(),
        disableAlert: jest.fn<any>(),
        getStorageStats: jest.fn<any>()
    };

    mockService.initialize.mockResolvedValue(undefined);
    mockService.addProvider.mockResolvedValue(undefined);
    mockService.removeProvider.mockResolvedValue(true);
    mockService.subscribeToData.mockResolvedValue('subscription-123');
    mockService.unsubscribeFromData.mockResolvedValue(true);
    mockService.getHistoricalData.mockResolvedValue([createMockMarketDataPoint()]);
    mockService.getCurrentData.mockResolvedValue(createMockMarketDataPoint());
    mockService.normalizeData.mockResolvedValue({
        normalizedData: [createMockMarketDataPoint()],
        metadata: { originalCount: 1, normalizedCount: 1 }
    });
    mockService.createAlert.mockResolvedValue({ id: 'alert-123' });
    mockService.updateAlert.mockResolvedValue({ id: 'alert-123' });
    mockService.deleteAlert.mockResolvedValue(true);
    mockService.getAlert.mockResolvedValue({ id: 'alert-123' });
    mockService.listAlerts.mockResolvedValue([{ id: 'alert-123' }]);
    mockService.enableAlert.mockResolvedValue({ id: 'alert-123', enabled: true });
    mockService.disableAlert.mockResolvedValue({ id: 'alert-123', enabled: false });
    mockService.getStorageStats.mockResolvedValue({
        totalDataPoints: 1000,
        oldestDataPoint: new Date(),
        newestDataPoint: new Date(),
        dataPointsByType: {},
        storageSize: 1024
    });

    return mockService;
};

export const createMockWebSearchService = () => {
    const mockService = {
        performWebSearch: jest.fn<any>(),
        performDeepResearch: jest.fn<any>()
    };

    mockService.performWebSearch.mockResolvedValue({
        results: [
            {
                title: 'Market Analysis Report',
                url: 'https://example.com/report',
                snippet: 'Comprehensive market analysis...',
                relevanceScore: 0.95,
                source: 'Financial Times'
            }
        ],
        totalResults: 1,
        executionTime: 250
    });

    mockService.performDeepResearch.mockResolvedValue({
        summary: 'Deep research findings...',
        sources: [
            {
                title: 'Research Source',
                url: 'https://example.com/source',
                credibilityScore: 0.9,
                relevanceScore: 0.85
            }
        ],
        keyFindings: ['Finding 1', 'Finding 2'],
        relatedTopics: ['Topic 1', 'Topic 2'],
        confidence: 0.85
    });

    return mockService;
};

// AI Service mocks
export const createMockBedrockClientService = () => {
    const mockService = {
        initialize: jest.fn<any>(),
        listModels: jest.fn<any>(),
        getModelDetails: jest.fn<any>(),
        invokeModel: jest.fn<any>(),
        invokeModelWithStreaming: jest.fn<any>()
    };

    mockService.initialize.mockResolvedValue(undefined);
    mockService.listModels.mockResolvedValue([
        'anthropic.claude-3-sonnet-20240229-v1:0',
        'anthropic.claude-3-haiku-20240307-v1:0',
        'amazon.nova-pro-v1:0'
    ]);

    mockService.getModelDetails.mockResolvedValue({
        modelDetails: {
            modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
            providerName: 'Anthropic',
            modelName: 'Claude 3 Sonnet'
        }
    });

    mockService.invokeModel.mockResolvedValue({
        completion: 'Mock AI response',
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 }
    });

    mockService.invokeModelWithStreaming.mockImplementation(async function* () {
        yield { completion: 'Mock ', isComplete: false };
        yield { completion: 'AI ', isComplete: false };
        yield { completion: 'response', isComplete: true };
    });

    return mockService;
};

export const createMockModelSelectionService = () => {
    const mockService = {
        selectOptimalModel: jest.fn<any>(),
        evaluateModelPerformance: jest.fn<any>(),
        getModelRecommendations: jest.fn<any>(),
        updateModelPreferences: jest.fn<any>()
    };

    mockService.selectOptimalModel.mockResolvedValue({
        id: 'anthropic.claude-3-sonnet-20240229-v1:0',
        name: 'Claude-Sonnet-3.7',
        version: '1.0',
        capabilities: ['text-generation', 'analysis'],
        limitations: ['token-limit'],
        configurationParameters: { maxTokens: 4000, temperature: 0.7 }
    });

    mockService.evaluateModelPerformance.mockResolvedValue({
        accuracy: 0.92,
        latency: 1500,
        throughput: 100,
        costPerToken: 0.001
    });

    mockService.getModelRecommendations.mockResolvedValue([
        { modelId: 'claude-sonnet-3.7', score: 0.95, reason: 'Best for complex analysis' }
    ]);

    mockService.updateModelPreferences.mockResolvedValue(undefined);

    return mockService;
};

// Agent mocks
export const createMockSupervisorAgent = () => {
    const mockService = {
        processRequest: jest.fn<any>(),
        delegateTask: jest.fn<any>(),
        monitorProgress: jest.fn<any>(),
        handleError: jest.fn<any>()
    };

    mockService.processRequest.mockResolvedValue({
        result: 'Task completed successfully',
        agentsUsed: ['planning', 'research', 'analysis'],
        executionTime: 5000
    });

    mockService.delegateTask.mockResolvedValue({
        taskId: 'task-123',
        assignedAgent: 'research',
        status: 'in-progress'
    });

    mockService.monitorProgress.mockResolvedValue({
        overallProgress: 75,
        activeAgents: ['analysis', 'compliance'],
        completedSteps: ['planning', 'research']
    });

    mockService.handleError.mockResolvedValue({
        handled: true,
        recovery: 'automatic'
    });

    return mockService;
};

export const createMockPlanningAgent = () => {
    const mockService = {
        createResearchPlan: jest.fn<any>(),
        updatePlan: jest.fn<any>(),
        executePlan: jest.fn<any>(),
        validatePlan: jest.fn<any>()
    };

    mockService.createResearchPlan.mockResolvedValue({
        planId: 'plan-123',
        steps: [
            { id: 'step-1', name: 'Market Research', estimatedTime: 1000 },
            { id: 'step-2', name: 'Financial Analysis', estimatedTime: 2000 }
        ],
        totalEstimatedTime: 3000
    });

    mockService.updatePlan.mockResolvedValue({
        planId: 'plan-123',
        updatedSteps: ['step-1', 'step-2'],
        reason: 'New data available'
    });

    mockService.executePlan.mockResolvedValue({
        planId: 'plan-123',
        status: 'completed',
        results: { step1: 'Research complete', step2: 'Analysis complete' }
    });

    mockService.validatePlan.mockResolvedValue({
        valid: true,
        issues: []
    });

    return mockService;
};

export const createMockResearchAgent = () => {
    const mockService = {
        processResearchRequest: jest.fn<any>(),
        analyzeMarketTrends: jest.fn<any>(),
        gatherCompanyData: jest.fn<any>(),
        validateSources: jest.fn<any>()
    };

    mockService.processResearchRequest.mockResolvedValue({
        findings: ['Finding 1', 'Finding 2'],
        sources: ['Source 1', 'Source 2'],
        confidence: 0.9,
        researchTime: 2000
    });

    mockService.analyzeMarketTrends.mockResolvedValue({
        trends: ['Upward trend in AI stocks', 'Volatility in tech sector'],
        timeframe: '30 days',
        confidence: 0.85
    });

    mockService.gatherCompanyData.mockResolvedValue({
        companyData: {
            revenue: 1000000000,
            marketCap: 50000000000,
            peRatio: 25.5
        },
        dataQuality: 'high',
        lastUpdated: new Date()
    });

    mockService.validateSources.mockResolvedValue({
        validSources: ['Source 1'],
        invalidSources: [],
        confidence: 0.95
    });

    return mockService;
};

export const createMockAnalysisAgent = () => {
    const mockService = {
        processAnalysisRequest: jest.fn<any>(),
        calculateRisk: jest.fn<any>(),
        projectPerformance: jest.fn<any>(),
        generateScenarios: jest.fn<any>()
    };

    mockService.processAnalysisRequest.mockResolvedValue({
        analysisResults: {
            expectedReturn: 0.15,
            riskScore: 0.6,
            recommendation: 'buy'
        },
        confidence: 0.88,
        analysisTime: 3000
    });

    mockService.calculateRisk.mockResolvedValue({
        overallRisk: 'medium',
        riskFactors: ['market volatility', 'sector concentration'],
        riskScore: 0.6,
        mitigationStrategies: ['diversification', 'hedging']
    });

    mockService.projectPerformance.mockResolvedValue({
        projections: {
            '1year': { return: 0.12, confidence: 0.8 },
            '3year': { return: 0.35, confidence: 0.6 },
            '5year': { return: 0.65, confidence: 0.4 }
        }
    });

    mockService.generateScenarios.mockResolvedValue({
        scenarios: [
            { name: 'Bull Market', probability: 0.3, impact: 0.25 },
            { name: 'Bear Market', probability: 0.2, impact: -0.15 },
            { name: 'Sideways Market', probability: 0.5, impact: 0.05 }
        ]
    });

    return mockService;
};

export const createMockComplianceAgent = () => {
    const mockService = {
        processComplianceRequest: jest.fn<any>(),
        validateInvestment: jest.fn<any>(),
        generateComplianceReport: jest.fn<any>(),
        checkRegulations: jest.fn<any>()
    };

    mockService.processComplianceRequest.mockResolvedValue({
        compliant: true,
        issues: [],
        regulationsChecked: ['SEC-RULE-1', 'FINRA-2111'],
        timestamp: new Date()
    });

    mockService.validateInvestment.mockResolvedValue({
        valid: true,
        warnings: [],
        restrictions: []
    });

    mockService.generateComplianceReport.mockResolvedValue({
        reportId: 'report-123',
        summary: 'All compliance checks passed',
        details: { sec: 'compliant', finra: 'compliant' }
    });

    mockService.checkRegulations.mockResolvedValue({
        applicable: ['SEC', 'FINRA'],
        violations: [],
        recommendations: []
    });

    return mockService;
};

export const createMockSynthesisAgent = () => {
    const mockService = {
        processSynthesisRequest: jest.fn<any>(),
        generateReport: jest.fn<any>(),
        createVisualization: jest.fn<any>(),
        summarizeFindings: jest.fn<any>()
    };

    mockService.processSynthesisRequest.mockResolvedValue({
        synthesizedResult: {
            title: 'Investment Recommendation',
            summary: 'Based on analysis...',
            recommendation: 'buy',
            confidence: 0.85
        },
        sourcesUsed: ['research', 'analysis', 'compliance'],
        synthesisTime: 1500
    });

    mockService.generateReport.mockResolvedValue({
        reportId: 'report-123',
        format: 'pdf',
        content: Buffer.from('Report content'),
        generationTime: 2000
    });

    mockService.createVisualization.mockResolvedValue({
        visualizationId: 'viz-123',
        type: 'chart',
        data: { labels: ['Q1', 'Q2'], values: [100, 150] }
    });

    mockService.summarizeFindings.mockResolvedValue({
        summary: 'Key findings summary',
        keyPoints: ['Point 1', 'Point 2'],
        confidence: 0.9
    });

    return mockService;
};

// Communication service mocks
export const createMockMessageBus = () => {
    const mockService = {
        publish: jest.fn<any>(),
        subscribe: jest.fn<any>(),
        unsubscribe: jest.fn<any>(),
        getSubscriptions: jest.fn<any>(),
        clearSubscriptions: jest.fn<any>()
    };

    mockService.publish.mockResolvedValue(true);
    mockService.subscribe.mockResolvedValue('subscription-123');
    mockService.unsubscribe.mockResolvedValue(true);
    mockService.getSubscriptions.mockResolvedValue(['subscription-123']);
    mockService.clearSubscriptions.mockResolvedValue(true);

    return mockService;
};

export const createMockMessageRouter = () => {
    const mockService = {
        route: jest.fn<any>(),
        addRoute: jest.fn<any>(),
        removeRoute: jest.fn<any>(),
        getRoutes: jest.fn<any>()
    };

    mockService.route.mockResolvedValue({
        routeId: 'route-123',
        destination: 'analysis-agent',
        status: 'delivered'
    });

    mockService.addRoute.mockResolvedValue('route-123');
    mockService.removeRoute.mockResolvedValue(true);
    mockService.getRoutes.mockResolvedValue([
        { id: 'route-123', pattern: '/analysis/*', destination: 'analysis-agent' }
    ]);

    return mockService;
};

export const createMockCommunicationErrorHandler = () => {
    const mockService = {
        handleError: jest.fn<any>(),
        logError: jest.fn<any>(),
        notifyError: jest.fn<any>(),
        recoverFromError: jest.fn<any>()
    };

    mockService.handleError.mockResolvedValue({
        handled: true,
        recovery: 'automatic'
    });

    mockService.logError.mockResolvedValue(undefined);
    mockService.notifyError.mockResolvedValue(undefined);
    mockService.recoverFromError.mockResolvedValue(true);

    return mockService;
};

// Utility function to create all mocks at once
export const createAllMocks = () => ({
    // Core services
    investmentIdeaService: createMockInvestmentIdeaService(),
    investmentIdeaOrchestrationService: createMockInvestmentIdeaOrchestrationService(),
    authService: createMockAuthService(),
    feedbackService: createMockFeedbackService(),
    marketDataService: createMockMarketDataService(),
    webSearchService: createMockWebSearchService(),

    // AI services
    bedrockClientService: createMockBedrockClientService(),
    modelSelectionService: createMockModelSelectionService(),

    // Agents
    supervisorAgent: createMockSupervisorAgent(),
    planningAgent: createMockPlanningAgent(),
    researchAgent: createMockResearchAgent(),
    analysisAgent: createMockAnalysisAgent(),
    complianceAgent: createMockComplianceAgent(),
    synthesisAgent: createMockSynthesisAgent(),

    // Communication
    messageBus: createMockMessageBus(),
    messageRouter: createMockMessageRouter(),
    communicationErrorHandler: createMockCommunicationErrorHandler()
});

// Helper function to reset all mocks
export const resetAllMocks = (mocks: ReturnType<typeof createAllMocks>) => {
    Object.values(mocks).forEach(mockService => {
        if (typeof mockService === 'object' && mockService !== null) {
            Object.values(mockService).forEach(mockMethod => {
                if (jest.isMockFunction(mockMethod)) {
                    mockMethod.mockClear();
                }
            });
        }
    });
};

// Test helper to create a mock Express request
export const createMockExpressRequest = (overrides: any = {}) => ({
    user: {
        userId: 'user-123',
        organizationId: 'org-456',
        role: 'analyst',
        permissions: ['idea:read', 'idea:write']
    },
    params: {},
    query: {},
    body: {},
    headers: {},
    ...overrides
});

// Test helper to create a mock Express response
export const createMockResponse = () => {
    const res: any = {};
    res.status = jest.fn<any>().mockReturnValue(res);
    res.json = jest.fn<any>().mockReturnValue(res);
    res.send = jest.fn<any>().mockReturnValue(res);
    res.setHeader = jest.fn<any>().mockReturnValue(res);
    res.end = jest.fn<any>().mockReturnValue(res);
    return res;
};

// Test helper to create a mock Next function
export const createMockNext = () => jest.fn<any>();