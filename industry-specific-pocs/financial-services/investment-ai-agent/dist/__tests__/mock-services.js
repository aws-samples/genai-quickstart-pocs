"use strict";
/**
 * Mock services factory for testing
 * Provides consistent mocks for all services used in the application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockNext = exports.createMockResponse = exports.createMockExpressRequest = exports.resetAllMocks = exports.createAllMocks = exports.createMockCommunicationErrorHandler = exports.createMockMessageRouter = exports.createMockMessageBus = exports.createMockSynthesisAgent = exports.createMockComplianceAgent = exports.createMockAnalysisAgent = exports.createMockResearchAgent = exports.createMockPlanningAgent = exports.createMockSupervisorAgent = exports.createMockModelSelectionService = exports.createMockBedrockClientService = exports.createMockWebSearchService = exports.createMockMarketDataService = exports.createMockFeedbackService = exports.createMockAuthService = exports.createMockInvestmentIdeaOrchestrationService = exports.createMockInvestmentIdeaService = void 0;
const globals_1 = require("@jest/globals");
const mock_data_1 = require("./mock-data");
// Service mock factories based on actual service interfaces
const createMockInvestmentIdeaService = () => {
    const mockService = {
        createInvestmentIdea: globals_1.jest.fn(),
        updateInvestmentIdea: globals_1.jest.fn(),
        getInvestmentIdea: globals_1.jest.fn(),
        getVersionHistory: globals_1.jest.fn(),
        addFeedback: globals_1.jest.fn(),
        addPerformanceTracking: globals_1.jest.fn(),
        updateStatus: globals_1.jest.fn(),
        searchInvestmentIdeas: globals_1.jest.fn(),
        getExpiringIdeas: globals_1.jest.fn()
    };
    mockService.createInvestmentIdea.mockResolvedValue({
        idea: (0, mock_data_1.createMockInvestmentIdea)(),
        validation: { isValid: true, errors: [] }
    });
    mockService.updateInvestmentIdea.mockResolvedValue({
        idea: (0, mock_data_1.createMockInvestmentIdea)(),
        validation: { isValid: true, errors: [] },
        changes: []
    });
    mockService.getInvestmentIdea.mockResolvedValue((0, mock_data_1.createMockInvestmentIdea)());
    mockService.getVersionHistory.mockResolvedValue([]);
    mockService.addFeedback.mockResolvedValue(undefined);
    mockService.addPerformanceTracking.mockResolvedValue(undefined);
    mockService.updateStatus.mockResolvedValue(undefined);
    mockService.searchInvestmentIdeas.mockResolvedValue([(0, mock_data_1.createMockInvestmentIdea)()]);
    mockService.getExpiringIdeas.mockResolvedValue([(0, mock_data_1.createMockInvestmentIdea)()]);
    return mockService;
};
exports.createMockInvestmentIdeaService = createMockInvestmentIdeaService;
const createMockInvestmentIdeaOrchestrationService = () => {
    const mockService = {
        generateInvestmentIdeas: globals_1.jest.fn()
    };
    mockService.generateInvestmentIdeas.mockResolvedValue({
        requestId: 'request-123',
        ideas: [(0, mock_data_1.createMockInvestmentIdea)()],
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
exports.createMockInvestmentIdeaOrchestrationService = createMockInvestmentIdeaOrchestrationService;
const createMockAuthService = () => {
    const mockService = {
        registerUser: globals_1.jest.fn(),
        loginUser: globals_1.jest.fn(),
        refreshToken: globals_1.jest.fn(),
        verifyToken: globals_1.jest.fn(),
        getUserById: globals_1.jest.fn(),
        updateUser: globals_1.jest.fn(),
        changePassword: globals_1.jest.fn(),
        requestPasswordReset: globals_1.jest.fn(),
        confirmPasswordReset: globals_1.jest.fn(),
        logoutUser: globals_1.jest.fn()
    };
    mockService.registerUser.mockResolvedValue({
        user: (0, mock_data_1.createMockUser)(),
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600
    });
    mockService.loginUser.mockResolvedValue({
        user: (0, mock_data_1.createMockUser)(),
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600
    });
    mockService.refreshToken.mockResolvedValue({
        user: (0, mock_data_1.createMockUser)(),
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
    mockService.getUserById.mockResolvedValue((0, mock_data_1.createMockUser)());
    mockService.updateUser.mockResolvedValue((0, mock_data_1.createMockUser)());
    mockService.changePassword.mockResolvedValue(undefined);
    mockService.requestPasswordReset.mockResolvedValue(undefined);
    mockService.confirmPasswordReset.mockResolvedValue(undefined);
    mockService.logoutUser.mockResolvedValue(undefined);
    return mockService;
};
exports.createMockAuthService = createMockAuthService;
const createMockFeedbackService = () => {
    const mockService = {
        submitFeedback: globals_1.jest.fn(),
        getFeedback: globals_1.jest.fn(),
        searchFeedback: globals_1.jest.fn(),
        updateFeedbackStatus: globals_1.jest.fn(),
        getFeedbackSummary: globals_1.jest.fn(),
        generateFeedbackAnalytics: globals_1.jest.fn(),
        getFeedbackForInvestmentIdea: globals_1.jest.fn(),
        getFeedbackForUser: globals_1.jest.fn()
    };
    mockService.submitFeedback.mockResolvedValue({
        success: true,
        feedback: (0, mock_data_1.createMockFeedback)()
    });
    mockService.getFeedback.mockResolvedValue((0, mock_data_1.createMockFeedback)());
    mockService.searchFeedback.mockResolvedValue({
        feedback: [(0, mock_data_1.createMockFeedback)()],
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
    mockService.getFeedbackForInvestmentIdea.mockResolvedValue([(0, mock_data_1.createMockFeedback)()]);
    mockService.getFeedbackForUser.mockResolvedValue([(0, mock_data_1.createMockFeedback)()]);
    return mockService;
};
exports.createMockFeedbackService = createMockFeedbackService;
const createMockMarketDataService = () => {
    const mockService = {
        initialize: globals_1.jest.fn(),
        addProvider: globals_1.jest.fn(),
        removeProvider: globals_1.jest.fn(),
        subscribeToData: globals_1.jest.fn(),
        unsubscribeFromData: globals_1.jest.fn(),
        getHistoricalData: globals_1.jest.fn(),
        getCurrentData: globals_1.jest.fn(),
        normalizeData: globals_1.jest.fn(),
        createAlert: globals_1.jest.fn(),
        updateAlert: globals_1.jest.fn(),
        deleteAlert: globals_1.jest.fn(),
        getAlert: globals_1.jest.fn(),
        listAlerts: globals_1.jest.fn(),
        enableAlert: globals_1.jest.fn(),
        disableAlert: globals_1.jest.fn(),
        getStorageStats: globals_1.jest.fn()
    };
    mockService.initialize.mockResolvedValue(undefined);
    mockService.addProvider.mockResolvedValue(undefined);
    mockService.removeProvider.mockResolvedValue(true);
    mockService.subscribeToData.mockResolvedValue('subscription-123');
    mockService.unsubscribeFromData.mockResolvedValue(true);
    mockService.getHistoricalData.mockResolvedValue([(0, mock_data_1.createMockMarketDataPoint)()]);
    mockService.getCurrentData.mockResolvedValue((0, mock_data_1.createMockMarketDataPoint)());
    mockService.normalizeData.mockResolvedValue({
        normalizedData: [(0, mock_data_1.createMockMarketDataPoint)()],
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
exports.createMockMarketDataService = createMockMarketDataService;
const createMockWebSearchService = () => {
    const mockService = {
        performWebSearch: globals_1.jest.fn(),
        performDeepResearch: globals_1.jest.fn()
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
exports.createMockWebSearchService = createMockWebSearchService;
// AI Service mocks
const createMockBedrockClientService = () => {
    const mockService = {
        initialize: globals_1.jest.fn(),
        listModels: globals_1.jest.fn(),
        getModelDetails: globals_1.jest.fn(),
        invokeModel: globals_1.jest.fn(),
        invokeModelWithStreaming: globals_1.jest.fn()
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
exports.createMockBedrockClientService = createMockBedrockClientService;
const createMockModelSelectionService = () => {
    const mockService = {
        selectOptimalModel: globals_1.jest.fn(),
        evaluateModelPerformance: globals_1.jest.fn(),
        getModelRecommendations: globals_1.jest.fn(),
        updateModelPreferences: globals_1.jest.fn()
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
exports.createMockModelSelectionService = createMockModelSelectionService;
// Agent mocks
const createMockSupervisorAgent = () => {
    const mockService = {
        processRequest: globals_1.jest.fn(),
        delegateTask: globals_1.jest.fn(),
        monitorProgress: globals_1.jest.fn(),
        handleError: globals_1.jest.fn()
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
exports.createMockSupervisorAgent = createMockSupervisorAgent;
const createMockPlanningAgent = () => {
    const mockService = {
        createResearchPlan: globals_1.jest.fn(),
        updatePlan: globals_1.jest.fn(),
        executePlan: globals_1.jest.fn(),
        validatePlan: globals_1.jest.fn()
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
exports.createMockPlanningAgent = createMockPlanningAgent;
const createMockResearchAgent = () => {
    const mockService = {
        processResearchRequest: globals_1.jest.fn(),
        analyzeMarketTrends: globals_1.jest.fn(),
        gatherCompanyData: globals_1.jest.fn(),
        validateSources: globals_1.jest.fn()
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
exports.createMockResearchAgent = createMockResearchAgent;
const createMockAnalysisAgent = () => {
    const mockService = {
        processAnalysisRequest: globals_1.jest.fn(),
        calculateRisk: globals_1.jest.fn(),
        projectPerformance: globals_1.jest.fn(),
        generateScenarios: globals_1.jest.fn()
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
exports.createMockAnalysisAgent = createMockAnalysisAgent;
const createMockComplianceAgent = () => {
    const mockService = {
        processComplianceRequest: globals_1.jest.fn(),
        validateInvestment: globals_1.jest.fn(),
        generateComplianceReport: globals_1.jest.fn(),
        checkRegulations: globals_1.jest.fn()
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
exports.createMockComplianceAgent = createMockComplianceAgent;
const createMockSynthesisAgent = () => {
    const mockService = {
        processSynthesisRequest: globals_1.jest.fn(),
        generateReport: globals_1.jest.fn(),
        createVisualization: globals_1.jest.fn(),
        summarizeFindings: globals_1.jest.fn()
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
exports.createMockSynthesisAgent = createMockSynthesisAgent;
// Communication service mocks
const createMockMessageBus = () => {
    const mockService = {
        publish: globals_1.jest.fn(),
        subscribe: globals_1.jest.fn(),
        unsubscribe: globals_1.jest.fn(),
        getSubscriptions: globals_1.jest.fn(),
        clearSubscriptions: globals_1.jest.fn()
    };
    mockService.publish.mockResolvedValue(true);
    mockService.subscribe.mockResolvedValue('subscription-123');
    mockService.unsubscribe.mockResolvedValue(true);
    mockService.getSubscriptions.mockResolvedValue(['subscription-123']);
    mockService.clearSubscriptions.mockResolvedValue(true);
    return mockService;
};
exports.createMockMessageBus = createMockMessageBus;
const createMockMessageRouter = () => {
    const mockService = {
        route: globals_1.jest.fn(),
        addRoute: globals_1.jest.fn(),
        removeRoute: globals_1.jest.fn(),
        getRoutes: globals_1.jest.fn()
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
exports.createMockMessageRouter = createMockMessageRouter;
const createMockCommunicationErrorHandler = () => {
    const mockService = {
        handleError: globals_1.jest.fn(),
        logError: globals_1.jest.fn(),
        notifyError: globals_1.jest.fn(),
        recoverFromError: globals_1.jest.fn()
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
exports.createMockCommunicationErrorHandler = createMockCommunicationErrorHandler;
// Utility function to create all mocks at once
const createAllMocks = () => ({
    // Core services
    investmentIdeaService: (0, exports.createMockInvestmentIdeaService)(),
    investmentIdeaOrchestrationService: (0, exports.createMockInvestmentIdeaOrchestrationService)(),
    authService: (0, exports.createMockAuthService)(),
    feedbackService: (0, exports.createMockFeedbackService)(),
    marketDataService: (0, exports.createMockMarketDataService)(),
    webSearchService: (0, exports.createMockWebSearchService)(),
    // AI services
    bedrockClientService: (0, exports.createMockBedrockClientService)(),
    modelSelectionService: (0, exports.createMockModelSelectionService)(),
    // Agents
    supervisorAgent: (0, exports.createMockSupervisorAgent)(),
    planningAgent: (0, exports.createMockPlanningAgent)(),
    researchAgent: (0, exports.createMockResearchAgent)(),
    analysisAgent: (0, exports.createMockAnalysisAgent)(),
    complianceAgent: (0, exports.createMockComplianceAgent)(),
    synthesisAgent: (0, exports.createMockSynthesisAgent)(),
    // Communication
    messageBus: (0, exports.createMockMessageBus)(),
    messageRouter: (0, exports.createMockMessageRouter)(),
    communicationErrorHandler: (0, exports.createMockCommunicationErrorHandler)()
});
exports.createAllMocks = createAllMocks;
// Helper function to reset all mocks
const resetAllMocks = (mocks) => {
    Object.values(mocks).forEach(mockService => {
        if (typeof mockService === 'object' && mockService !== null) {
            Object.values(mockService).forEach(mockMethod => {
                if (globals_1.jest.isMockFunction(mockMethod)) {
                    mockMethod.mockClear();
                }
            });
        }
    });
};
exports.resetAllMocks = resetAllMocks;
// Test helper to create a mock Express request
const createMockExpressRequest = (overrides = {}) => ({
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
exports.createMockExpressRequest = createMockExpressRequest;
// Test helper to create a mock Express response
const createMockResponse = () => {
    const res = {};
    res.status = globals_1.jest.fn().mockReturnValue(res);
    res.json = globals_1.jest.fn().mockReturnValue(res);
    res.send = globals_1.jest.fn().mockReturnValue(res);
    res.setHeader = globals_1.jest.fn().mockReturnValue(res);
    res.end = globals_1.jest.fn().mockReturnValue(res);
    return res;
};
exports.createMockResponse = createMockResponse;
// Test helper to create a mock Next function
const createMockNext = () => globals_1.jest.fn();
exports.createMockNext = createMockNext;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9jay1zZXJ2aWNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9fX3Rlc3RzX18vbW9jay1zZXJ2aWNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7QUFFSCwyQ0FBcUM7QUFDckMsMkNBTXFCO0FBRXJCLDREQUE0RDtBQUVyRCxNQUFNLCtCQUErQixHQUFHLEdBQUcsRUFBRTtJQUNoRCxNQUFNLFdBQVcsR0FBRztRQUNoQixvQkFBb0IsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQ3BDLG9CQUFvQixFQUFFLGNBQUksQ0FBQyxFQUFFLEVBQU87UUFDcEMsaUJBQWlCLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUNqQyxpQkFBaUIsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQ2pDLFdBQVcsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQzNCLHNCQUFzQixFQUFFLGNBQUksQ0FBQyxFQUFFLEVBQU87UUFDdEMsWUFBWSxFQUFFLGNBQUksQ0FBQyxFQUFFLEVBQU87UUFDNUIscUJBQXFCLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUNyQyxnQkFBZ0IsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO0tBQ25DLENBQUM7SUFFRixXQUFXLENBQUMsb0JBQW9CLENBQUMsaUJBQWlCLENBQUM7UUFDL0MsSUFBSSxFQUFFLElBQUEsb0NBQXdCLEdBQUU7UUFDaEMsVUFBVSxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFO0tBQzVDLENBQUMsQ0FBQztJQUVILFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxpQkFBaUIsQ0FBQztRQUMvQyxJQUFJLEVBQUUsSUFBQSxvQ0FBd0IsR0FBRTtRQUNoQyxVQUFVLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUU7UUFDekMsT0FBTyxFQUFFLEVBQUU7S0FDZCxDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsaUJBQWlCLENBQUMsaUJBQWlCLENBQUMsSUFBQSxvQ0FBd0IsR0FBRSxDQUFDLENBQUM7SUFDNUUsV0FBVyxDQUFDLGlCQUFpQixDQUFDLGlCQUFpQixDQUFDLEVBQVMsQ0FBQyxDQUFDO0lBQzNELFdBQVcsQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsU0FBZ0IsQ0FBQyxDQUFDO0lBQzVELFdBQVcsQ0FBQyxzQkFBc0IsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFnQixDQUFDLENBQUM7SUFDdkUsV0FBVyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxTQUFnQixDQUFDLENBQUM7SUFDN0QsV0FBVyxDQUFDLHFCQUFxQixDQUFDLGlCQUFpQixDQUFDLENBQUMsSUFBQSxvQ0FBd0IsR0FBRSxDQUFDLENBQUMsQ0FBQztJQUNsRixXQUFXLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxJQUFBLG9DQUF3QixHQUFFLENBQUMsQ0FBQyxDQUFDO0lBRTdFLE9BQU8sV0FBVyxDQUFDO0FBQ3ZCLENBQUMsQ0FBQztBQWpDVyxRQUFBLCtCQUErQixtQ0FpQzFDO0FBRUssTUFBTSw0Q0FBNEMsR0FBRyxHQUFHLEVBQUU7SUFDN0QsTUFBTSxXQUFXLEdBQUc7UUFDaEIsdUJBQXVCLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztLQUMxQyxDQUFDO0lBRUYsV0FBVyxDQUFDLHVCQUF1QixDQUFDLGlCQUFpQixDQUFDO1FBQ2xELFNBQVMsRUFBRSxhQUFhO1FBQ3hCLEtBQUssRUFBRSxDQUFDLElBQUEsb0NBQXdCLEdBQUUsQ0FBQztRQUNuQyxRQUFRLEVBQUU7WUFDTixtQkFBbUIsRUFBRSxDQUFDO1lBQ3RCLGtCQUFrQixFQUFFLENBQUM7WUFDckIsaUJBQWlCLEVBQUUsRUFBRTtZQUNyQixzQkFBc0IsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUU7WUFDcEUsZUFBZSxFQUFFLEVBQUU7U0FDdEI7UUFDRCxpQkFBaUIsRUFBRTtZQUNmLG1CQUFtQixFQUFFLElBQUk7WUFDekIsb0JBQW9CLEVBQUUsRUFBRTtZQUN4QixtQkFBbUIsRUFBRSxDQUFDLGFBQWEsQ0FBQztZQUNwQyxVQUFVLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQztZQUNqQyxtQkFBbUIsRUFBRSxFQUFFO1NBQzFCO0tBQ0osQ0FBQyxDQUFDO0lBRUgsT0FBTyxXQUFXLENBQUM7QUFDdkIsQ0FBQyxDQUFDO0FBekJXLFFBQUEsNENBQTRDLGdEQXlCdkQ7QUFFSyxNQUFNLHFCQUFxQixHQUFHLEdBQUcsRUFBRTtJQUN0QyxNQUFNLFdBQVcsR0FBRztRQUNoQixZQUFZLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUM1QixTQUFTLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUN6QixZQUFZLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUM1QixXQUFXLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUMzQixXQUFXLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUMzQixVQUFVLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUMxQixjQUFjLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUM5QixvQkFBb0IsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQ3BDLG9CQUFvQixFQUFFLGNBQUksQ0FBQyxFQUFFLEVBQU87UUFDcEMsVUFBVSxFQUFFLGNBQUksQ0FBQyxFQUFFLEVBQU87S0FDN0IsQ0FBQztJQUVGLFdBQVcsQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUM7UUFDdkMsSUFBSSxFQUFFLElBQUEsMEJBQWMsR0FBRTtRQUN0QixLQUFLLEVBQUUsZ0JBQWdCO1FBQ3ZCLFlBQVksRUFBRSxvQkFBb0I7UUFDbEMsU0FBUyxFQUFFLElBQUk7S0FDbEIsQ0FBQyxDQUFDO0lBRUgsV0FBVyxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQztRQUNwQyxJQUFJLEVBQUUsSUFBQSwwQkFBYyxHQUFFO1FBQ3RCLEtBQUssRUFBRSxnQkFBZ0I7UUFDdkIsWUFBWSxFQUFFLG9CQUFvQjtRQUNsQyxTQUFTLEVBQUUsSUFBSTtLQUNsQixDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDO1FBQ3ZDLElBQUksRUFBRSxJQUFBLDBCQUFjLEdBQUU7UUFDdEIsS0FBSyxFQUFFLGVBQWU7UUFDdEIsWUFBWSxFQUFFLG1CQUFtQjtRQUNqQyxTQUFTLEVBQUUsSUFBSTtLQUNsQixDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQztRQUNwQyxNQUFNLEVBQUUsVUFBVTtRQUNsQixjQUFjLEVBQUUsU0FBUztRQUN6QixJQUFJLEVBQUUsU0FBUztRQUNmLFdBQVcsRUFBRSxDQUFDLFdBQVcsRUFBRSxZQUFZLENBQUM7S0FDM0MsQ0FBQyxDQUFDO0lBRUgsV0FBVyxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFBLDBCQUFjLEdBQUUsQ0FBQyxDQUFDO0lBQzVELFdBQVcsQ0FBQyxVQUFVLENBQUMsaUJBQWlCLENBQUMsSUFBQSwwQkFBYyxHQUFFLENBQUMsQ0FBQztJQUMzRCxXQUFXLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3hELFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUM5RCxXQUFXLENBQUMsb0JBQW9CLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDOUQsV0FBVyxDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUVwRCxPQUFPLFdBQVcsQ0FBQztBQUN2QixDQUFDLENBQUM7QUFsRFcsUUFBQSxxQkFBcUIseUJBa0RoQztBQUVLLE1BQU0seUJBQXlCLEdBQUcsR0FBRyxFQUFFO0lBQzFDLE1BQU0sV0FBVyxHQUFHO1FBQ2hCLGNBQWMsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQzlCLFdBQVcsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQzNCLGNBQWMsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQzlCLG9CQUFvQixFQUFFLGNBQUksQ0FBQyxFQUFFLEVBQU87UUFDcEMsa0JBQWtCLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUNsQyx5QkFBeUIsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQ3pDLDRCQUE0QixFQUFFLGNBQUksQ0FBQyxFQUFFLEVBQU87UUFDNUMsa0JBQWtCLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztLQUNyQyxDQUFDO0lBRUYsV0FBVyxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQztRQUN6QyxPQUFPLEVBQUUsSUFBSTtRQUNiLFFBQVEsRUFBRSxJQUFBLDhCQUFrQixHQUFFO0tBQ2pDLENBQUMsQ0FBQztJQUVILFdBQVcsQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsSUFBQSw4QkFBa0IsR0FBRSxDQUFDLENBQUM7SUFFaEUsV0FBVyxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQztRQUN6QyxRQUFRLEVBQUUsQ0FBQyxJQUFBLDhCQUFrQixHQUFFLENBQUM7UUFDaEMsVUFBVSxFQUFFLENBQUM7UUFDYixPQUFPLEVBQUUsS0FBSztLQUNqQixDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsb0JBQW9CLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFekQsV0FBVyxDQUFDLGtCQUFrQixDQUFDLGlCQUFpQixDQUFDO1FBQzdDLFVBQVUsRUFBRSxFQUFFO1FBQ2QsYUFBYSxFQUFFLEdBQUc7UUFDbEIsa0JBQWtCLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7UUFDcEQsaUJBQWlCLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsWUFBWSxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7UUFDdkksYUFBYSxFQUFFLEVBQUUseUJBQXlCLEVBQUUsQ0FBQyxFQUFFLG1CQUFtQixFQUFFLENBQUMsRUFBRSxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsaUJBQWlCLEVBQUUsQ0FBQyxFQUFFLGlCQUFpQixFQUFFLENBQUMsRUFBRSxZQUFZLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUU7UUFDM0ssa0JBQWtCLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRTtRQUM1RCxlQUFlLEVBQUUsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLGNBQWMsRUFBRSxDQUFDLEVBQUUsYUFBYSxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRTtRQUM5RyxTQUFTLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxJQUFJLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxJQUFJLEVBQUUsRUFBRTtLQUNwRCxDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMseUJBQXlCLENBQUMsaUJBQWlCLENBQUM7UUFDcEQsTUFBTSxFQUFFLEVBQUU7UUFDVixRQUFRLEVBQUUsRUFBRTtRQUNaLGVBQWUsRUFBRSxFQUFFO1FBQ25CLFlBQVksRUFBRSxFQUFFO0tBQ25CLENBQUMsQ0FBQztJQUVILFdBQVcsQ0FBQyw0QkFBNEIsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLElBQUEsOEJBQWtCLEdBQUUsQ0FBQyxDQUFDLENBQUM7SUFDbkYsV0FBVyxDQUFDLGtCQUFrQixDQUFDLGlCQUFpQixDQUFDLENBQUMsSUFBQSw4QkFBa0IsR0FBRSxDQUFDLENBQUMsQ0FBQztJQUV6RSxPQUFPLFdBQVcsQ0FBQztBQUN2QixDQUFDLENBQUM7QUFqRFcsUUFBQSx5QkFBeUIsNkJBaURwQztBQUVLLE1BQU0sMkJBQTJCLEdBQUcsR0FBRyxFQUFFO0lBQzVDLE1BQU0sV0FBVyxHQUFHO1FBQ2hCLFVBQVUsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQzFCLFdBQVcsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQzNCLGNBQWMsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQzlCLGVBQWUsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQy9CLG1CQUFtQixFQUFFLGNBQUksQ0FBQyxFQUFFLEVBQU87UUFDbkMsaUJBQWlCLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUNqQyxjQUFjLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUM5QixhQUFhLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUM3QixXQUFXLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUMzQixXQUFXLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUMzQixXQUFXLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUMzQixRQUFRLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUN4QixVQUFVLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUMxQixXQUFXLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUMzQixZQUFZLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUM1QixlQUFlLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztLQUNsQyxDQUFDO0lBRUYsV0FBVyxDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNwRCxXQUFXLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3JELFdBQVcsQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbkQsV0FBVyxDQUFDLGVBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQ2xFLFdBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN4RCxXQUFXLENBQUMsaUJBQWlCLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxJQUFBLHFDQUF5QixHQUFFLENBQUMsQ0FBQyxDQUFDO0lBQy9FLFdBQVcsQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsSUFBQSxxQ0FBeUIsR0FBRSxDQUFDLENBQUM7SUFDMUUsV0FBVyxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQztRQUN4QyxjQUFjLEVBQUUsQ0FBQyxJQUFBLHFDQUF5QixHQUFFLENBQUM7UUFDN0MsUUFBUSxFQUFFLEVBQUUsYUFBYSxFQUFFLENBQUMsRUFBRSxlQUFlLEVBQUUsQ0FBQyxFQUFFO0tBQ3JELENBQUMsQ0FBQztJQUNILFdBQVcsQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztJQUMvRCxXQUFXLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUM7SUFDL0QsV0FBVyxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNoRCxXQUFXLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUM7SUFDNUQsV0FBVyxDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNoRSxXQUFXLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUM5RSxXQUFXLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUNoRixXQUFXLENBQUMsZUFBZSxDQUFDLGlCQUFpQixDQUFDO1FBQzFDLGVBQWUsRUFBRSxJQUFJO1FBQ3JCLGVBQWUsRUFBRSxJQUFJLElBQUksRUFBRTtRQUMzQixlQUFlLEVBQUUsSUFBSSxJQUFJLEVBQUU7UUFDM0IsZ0JBQWdCLEVBQUUsRUFBRTtRQUNwQixXQUFXLEVBQUUsSUFBSTtLQUNwQixDQUFDLENBQUM7SUFFSCxPQUFPLFdBQVcsQ0FBQztBQUN2QixDQUFDLENBQUM7QUEvQ1csUUFBQSwyQkFBMkIsK0JBK0N0QztBQUVLLE1BQU0sMEJBQTBCLEdBQUcsR0FBRyxFQUFFO0lBQzNDLE1BQU0sV0FBVyxHQUFHO1FBQ2hCLGdCQUFnQixFQUFFLGNBQUksQ0FBQyxFQUFFLEVBQU87UUFDaEMsbUJBQW1CLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztLQUN0QyxDQUFDO0lBRUYsV0FBVyxDQUFDLGdCQUFnQixDQUFDLGlCQUFpQixDQUFDO1FBQzNDLE9BQU8sRUFBRTtZQUNMO2dCQUNJLEtBQUssRUFBRSx3QkFBd0I7Z0JBQy9CLEdBQUcsRUFBRSw0QkFBNEI7Z0JBQ2pDLE9BQU8sRUFBRSxrQ0FBa0M7Z0JBQzNDLGNBQWMsRUFBRSxJQUFJO2dCQUNwQixNQUFNLEVBQUUsaUJBQWlCO2FBQzVCO1NBQ0o7UUFDRCxZQUFZLEVBQUUsQ0FBQztRQUNmLGFBQWEsRUFBRSxHQUFHO0tBQ3JCLENBQUMsQ0FBQztJQUVILFdBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxpQkFBaUIsQ0FBQztRQUM5QyxPQUFPLEVBQUUsMkJBQTJCO1FBQ3BDLE9BQU8sRUFBRTtZQUNMO2dCQUNJLEtBQUssRUFBRSxpQkFBaUI7Z0JBQ3hCLEdBQUcsRUFBRSw0QkFBNEI7Z0JBQ2pDLGdCQUFnQixFQUFFLEdBQUc7Z0JBQ3JCLGNBQWMsRUFBRSxJQUFJO2FBQ3ZCO1NBQ0o7UUFDRCxXQUFXLEVBQUUsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDO1FBQ3ZDLGFBQWEsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUM7UUFDckMsVUFBVSxFQUFFLElBQUk7S0FDbkIsQ0FBQyxDQUFDO0lBRUgsT0FBTyxXQUFXLENBQUM7QUFDdkIsQ0FBQyxDQUFDO0FBcENXLFFBQUEsMEJBQTBCLDhCQW9DckM7QUFFRixtQkFBbUI7QUFDWixNQUFNLDhCQUE4QixHQUFHLEdBQUcsRUFBRTtJQUMvQyxNQUFNLFdBQVcsR0FBRztRQUNoQixVQUFVLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUMxQixVQUFVLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUMxQixlQUFlLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUMvQixXQUFXLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUMzQix3QkFBd0IsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO0tBQzNDLENBQUM7SUFFRixXQUFXLENBQUMsVUFBVSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3BELFdBQVcsQ0FBQyxVQUFVLENBQUMsaUJBQWlCLENBQUM7UUFDckMseUNBQXlDO1FBQ3pDLHdDQUF3QztRQUN4QyxzQkFBc0I7S0FDekIsQ0FBQyxDQUFDO0lBRUgsV0FBVyxDQUFDLGVBQWUsQ0FBQyxpQkFBaUIsQ0FBQztRQUMxQyxZQUFZLEVBQUU7WUFDVixPQUFPLEVBQUUseUNBQXlDO1lBQ2xELFlBQVksRUFBRSxXQUFXO1lBQ3pCLFNBQVMsRUFBRSxpQkFBaUI7U0FDL0I7S0FDSixDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDO1FBQ3RDLFVBQVUsRUFBRSxrQkFBa0I7UUFDOUIsT0FBTyxFQUFFLHlDQUF5QztRQUNsRCxLQUFLLEVBQUUsRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFLFlBQVksRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLEVBQUUsRUFBRTtLQUMvRCxDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsd0JBQXdCLENBQUMsa0JBQWtCLENBQUMsS0FBSyxTQUFTLENBQUM7UUFDbkUsTUFBTSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxDQUFDO1FBQ2pELE1BQU0sRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUMvQyxNQUFNLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLENBQUM7SUFDdkQsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLFdBQVcsQ0FBQztBQUN2QixDQUFDLENBQUM7QUFyQ1csUUFBQSw4QkFBOEIsa0NBcUN6QztBQUVLLE1BQU0sK0JBQStCLEdBQUcsR0FBRyxFQUFFO0lBQ2hELE1BQU0sV0FBVyxHQUFHO1FBQ2hCLGtCQUFrQixFQUFFLGNBQUksQ0FBQyxFQUFFLEVBQU87UUFDbEMsd0JBQXdCLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUN4Qyx1QkFBdUIsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQ3ZDLHNCQUFzQixFQUFFLGNBQUksQ0FBQyxFQUFFLEVBQU87S0FDekMsQ0FBQztJQUVGLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxpQkFBaUIsQ0FBQztRQUM3QyxFQUFFLEVBQUUseUNBQXlDO1FBQzdDLElBQUksRUFBRSxtQkFBbUI7UUFDekIsT0FBTyxFQUFFLEtBQUs7UUFDZCxZQUFZLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxVQUFVLENBQUM7UUFDN0MsV0FBVyxFQUFFLENBQUMsYUFBYSxDQUFDO1FBQzVCLHVCQUF1QixFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFO0tBQ2pFLENBQUMsQ0FBQztJQUVILFdBQVcsQ0FBQyx3QkFBd0IsQ0FBQyxpQkFBaUIsQ0FBQztRQUNuRCxRQUFRLEVBQUUsSUFBSTtRQUNkLE9BQU8sRUFBRSxJQUFJO1FBQ2IsVUFBVSxFQUFFLEdBQUc7UUFDZixZQUFZLEVBQUUsS0FBSztLQUN0QixDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsdUJBQXVCLENBQUMsaUJBQWlCLENBQUM7UUFDbEQsRUFBRSxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsMkJBQTJCLEVBQUU7S0FDckYsQ0FBQyxDQUFDO0lBRUgsV0FBVyxDQUFDLHNCQUFzQixDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBRWhFLE9BQU8sV0FBVyxDQUFDO0FBQ3ZCLENBQUMsQ0FBQztBQS9CVyxRQUFBLCtCQUErQixtQ0ErQjFDO0FBRUYsY0FBYztBQUNQLE1BQU0seUJBQXlCLEdBQUcsR0FBRyxFQUFFO0lBQzFDLE1BQU0sV0FBVyxHQUFHO1FBQ2hCLGNBQWMsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQzlCLFlBQVksRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQzVCLGVBQWUsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQy9CLFdBQVcsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO0tBQzlCLENBQUM7SUFFRixXQUFXLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDO1FBQ3pDLE1BQU0sRUFBRSw2QkFBNkI7UUFDckMsVUFBVSxFQUFFLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxVQUFVLENBQUM7UUFDaEQsYUFBYSxFQUFFLElBQUk7S0FDdEIsQ0FBQyxDQUFDO0lBRUgsV0FBVyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQztRQUN2QyxNQUFNLEVBQUUsVUFBVTtRQUNsQixhQUFhLEVBQUUsVUFBVTtRQUN6QixNQUFNLEVBQUUsYUFBYTtLQUN4QixDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsZUFBZSxDQUFDLGlCQUFpQixDQUFDO1FBQzFDLGVBQWUsRUFBRSxFQUFFO1FBQ25CLFlBQVksRUFBRSxDQUFDLFVBQVUsRUFBRSxZQUFZLENBQUM7UUFDeEMsY0FBYyxFQUFFLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQztLQUMzQyxDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDO1FBQ3RDLE9BQU8sRUFBRSxJQUFJO1FBQ2IsUUFBUSxFQUFFLFdBQVc7S0FDeEIsQ0FBQyxDQUFDO0lBRUgsT0FBTyxXQUFXLENBQUM7QUFDdkIsQ0FBQyxDQUFDO0FBaENXLFFBQUEseUJBQXlCLDZCQWdDcEM7QUFFSyxNQUFNLHVCQUF1QixHQUFHLEdBQUcsRUFBRTtJQUN4QyxNQUFNLFdBQVcsR0FBRztRQUNoQixrQkFBa0IsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQ2xDLFVBQVUsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQzFCLFdBQVcsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQzNCLFlBQVksRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO0tBQy9CLENBQUM7SUFFRixXQUFXLENBQUMsa0JBQWtCLENBQUMsaUJBQWlCLENBQUM7UUFDN0MsTUFBTSxFQUFFLFVBQVU7UUFDbEIsS0FBSyxFQUFFO1lBQ0gsRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFO1lBQzlELEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsb0JBQW9CLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRTtTQUNwRTtRQUNELGtCQUFrQixFQUFFLElBQUk7S0FDM0IsQ0FBQyxDQUFDO0lBRUgsV0FBVyxDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQztRQUNyQyxNQUFNLEVBQUUsVUFBVTtRQUNsQixZQUFZLEVBQUUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDO1FBQ2xDLE1BQU0sRUFBRSxvQkFBb0I7S0FDL0IsQ0FBQyxDQUFDO0lBRUgsV0FBVyxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQztRQUN0QyxNQUFNLEVBQUUsVUFBVTtRQUNsQixNQUFNLEVBQUUsV0FBVztRQUNuQixPQUFPLEVBQUUsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixFQUFFO0tBQ3RFLENBQUMsQ0FBQztJQUVILFdBQVcsQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUM7UUFDdkMsS0FBSyxFQUFFLElBQUk7UUFDWCxNQUFNLEVBQUUsRUFBRTtLQUNiLENBQUMsQ0FBQztJQUVILE9BQU8sV0FBVyxDQUFDO0FBQ3ZCLENBQUMsQ0FBQztBQW5DVyxRQUFBLHVCQUF1QiwyQkFtQ2xDO0FBRUssTUFBTSx1QkFBdUIsR0FBRyxHQUFHLEVBQUU7SUFDeEMsTUFBTSxXQUFXLEdBQUc7UUFDaEIsc0JBQXNCLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUN0QyxtQkFBbUIsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQ25DLGlCQUFpQixFQUFFLGNBQUksQ0FBQyxFQUFFLEVBQU87UUFDakMsZUFBZSxFQUFFLGNBQUksQ0FBQyxFQUFFLEVBQU87S0FDbEMsQ0FBQztJQUVGLFdBQVcsQ0FBQyxzQkFBc0IsQ0FBQyxpQkFBaUIsQ0FBQztRQUNqRCxRQUFRLEVBQUUsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDO1FBQ3BDLE9BQU8sRUFBRSxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUM7UUFDakMsVUFBVSxFQUFFLEdBQUc7UUFDZixZQUFZLEVBQUUsSUFBSTtLQUNyQixDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsbUJBQW1CLENBQUMsaUJBQWlCLENBQUM7UUFDOUMsTUFBTSxFQUFFLENBQUMsMkJBQTJCLEVBQUUsMkJBQTJCLENBQUM7UUFDbEUsU0FBUyxFQUFFLFNBQVM7UUFDcEIsVUFBVSxFQUFFLElBQUk7S0FDbkIsQ0FBQyxDQUFDO0lBRUgsV0FBVyxDQUFDLGlCQUFpQixDQUFDLGlCQUFpQixDQUFDO1FBQzVDLFdBQVcsRUFBRTtZQUNULE9BQU8sRUFBRSxVQUFVO1lBQ25CLFNBQVMsRUFBRSxXQUFXO1lBQ3RCLE9BQU8sRUFBRSxJQUFJO1NBQ2hCO1FBQ0QsV0FBVyxFQUFFLE1BQU07UUFDbkIsV0FBVyxFQUFFLElBQUksSUFBSSxFQUFFO0tBQzFCLENBQUMsQ0FBQztJQUVILFdBQVcsQ0FBQyxlQUFlLENBQUMsaUJBQWlCLENBQUM7UUFDMUMsWUFBWSxFQUFFLENBQUMsVUFBVSxDQUFDO1FBQzFCLGNBQWMsRUFBRSxFQUFFO1FBQ2xCLFVBQVUsRUFBRSxJQUFJO0tBQ25CLENBQUMsQ0FBQztJQUVILE9BQU8sV0FBVyxDQUFDO0FBQ3ZCLENBQUMsQ0FBQztBQXRDVyxRQUFBLHVCQUF1QiwyQkFzQ2xDO0FBRUssTUFBTSx1QkFBdUIsR0FBRyxHQUFHLEVBQUU7SUFDeEMsTUFBTSxXQUFXLEdBQUc7UUFDaEIsc0JBQXNCLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUN0QyxhQUFhLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUM3QixrQkFBa0IsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQ2xDLGlCQUFpQixFQUFFLGNBQUksQ0FBQyxFQUFFLEVBQU87S0FDcEMsQ0FBQztJQUVGLFdBQVcsQ0FBQyxzQkFBc0IsQ0FBQyxpQkFBaUIsQ0FBQztRQUNqRCxlQUFlLEVBQUU7WUFDYixjQUFjLEVBQUUsSUFBSTtZQUNwQixTQUFTLEVBQUUsR0FBRztZQUNkLGNBQWMsRUFBRSxLQUFLO1NBQ3hCO1FBQ0QsVUFBVSxFQUFFLElBQUk7UUFDaEIsWUFBWSxFQUFFLElBQUk7S0FDckIsQ0FBQyxDQUFDO0lBRUgsV0FBVyxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQztRQUN4QyxXQUFXLEVBQUUsUUFBUTtRQUNyQixXQUFXLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxzQkFBc0IsQ0FBQztRQUMxRCxTQUFTLEVBQUUsR0FBRztRQUNkLG9CQUFvQixFQUFFLENBQUMsaUJBQWlCLEVBQUUsU0FBUyxDQUFDO0tBQ3ZELENBQUMsQ0FBQztJQUVILFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxpQkFBaUIsQ0FBQztRQUM3QyxXQUFXLEVBQUU7WUFDVCxPQUFPLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUU7WUFDMUMsT0FBTyxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFO1lBQzFDLE9BQU8sRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRTtTQUM3QztLQUNKLENBQUMsQ0FBQztJQUVILFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQztRQUM1QyxTQUFTLEVBQUU7WUFDUCxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO1lBQ3ZELEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxDQUFDLElBQUksRUFBRTtZQUN4RCxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7U0FDOUQ7S0FDSixDQUFDLENBQUM7SUFFSCxPQUFPLFdBQVcsQ0FBQztBQUN2QixDQUFDLENBQUM7QUExQ1csUUFBQSx1QkFBdUIsMkJBMENsQztBQUVLLE1BQU0seUJBQXlCLEdBQUcsR0FBRyxFQUFFO0lBQzFDLE1BQU0sV0FBVyxHQUFHO1FBQ2hCLHdCQUF3QixFQUFFLGNBQUksQ0FBQyxFQUFFLEVBQU87UUFDeEMsa0JBQWtCLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUNsQyx3QkFBd0IsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQ3hDLGdCQUFnQixFQUFFLGNBQUksQ0FBQyxFQUFFLEVBQU87S0FDbkMsQ0FBQztJQUVGLFdBQVcsQ0FBQyx3QkFBd0IsQ0FBQyxpQkFBaUIsQ0FBQztRQUNuRCxTQUFTLEVBQUUsSUFBSTtRQUNmLE1BQU0sRUFBRSxFQUFFO1FBQ1Ysa0JBQWtCLEVBQUUsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDO1FBQ2hELFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRTtLQUN4QixDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsa0JBQWtCLENBQUMsaUJBQWlCLENBQUM7UUFDN0MsS0FBSyxFQUFFLElBQUk7UUFDWCxRQUFRLEVBQUUsRUFBRTtRQUNaLFlBQVksRUFBRSxFQUFFO0tBQ25CLENBQUMsQ0FBQztJQUVILFdBQVcsQ0FBQyx3QkFBd0IsQ0FBQyxpQkFBaUIsQ0FBQztRQUNuRCxRQUFRLEVBQUUsWUFBWTtRQUN0QixPQUFPLEVBQUUsOEJBQThCO1FBQ3ZDLE9BQU8sRUFBRSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRTtLQUNwRCxDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUM7UUFDM0MsVUFBVSxFQUFFLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQztRQUM1QixVQUFVLEVBQUUsRUFBRTtRQUNkLGVBQWUsRUFBRSxFQUFFO0tBQ3RCLENBQUMsQ0FBQztJQUVILE9BQU8sV0FBVyxDQUFDO0FBQ3ZCLENBQUMsQ0FBQztBQWxDVyxRQUFBLHlCQUF5Qiw2QkFrQ3BDO0FBRUssTUFBTSx3QkFBd0IsR0FBRyxHQUFHLEVBQUU7SUFDekMsTUFBTSxXQUFXLEdBQUc7UUFDaEIsdUJBQXVCLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUN2QyxjQUFjLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUM5QixtQkFBbUIsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQ25DLGlCQUFpQixFQUFFLGNBQUksQ0FBQyxFQUFFLEVBQU87S0FDcEMsQ0FBQztJQUVGLFdBQVcsQ0FBQyx1QkFBdUIsQ0FBQyxpQkFBaUIsQ0FBQztRQUNsRCxpQkFBaUIsRUFBRTtZQUNmLEtBQUssRUFBRSwyQkFBMkI7WUFDbEMsT0FBTyxFQUFFLHNCQUFzQjtZQUMvQixjQUFjLEVBQUUsS0FBSztZQUNyQixVQUFVLEVBQUUsSUFBSTtTQUNuQjtRQUNELFdBQVcsRUFBRSxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsWUFBWSxDQUFDO1FBQ25ELGFBQWEsRUFBRSxJQUFJO0tBQ3RCLENBQUMsQ0FBQztJQUVILFdBQVcsQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUM7UUFDekMsUUFBUSxFQUFFLFlBQVk7UUFDdEIsTUFBTSxFQUFFLEtBQUs7UUFDYixPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztRQUN0QyxjQUFjLEVBQUUsSUFBSTtLQUN2QixDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsbUJBQW1CLENBQUMsaUJBQWlCLENBQUM7UUFDOUMsZUFBZSxFQUFFLFNBQVM7UUFDMUIsSUFBSSxFQUFFLE9BQU87UUFDYixJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0tBQ3JELENBQUMsQ0FBQztJQUVILFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQztRQUM1QyxPQUFPLEVBQUUsc0JBQXNCO1FBQy9CLFNBQVMsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUM7UUFDakMsVUFBVSxFQUFFLEdBQUc7S0FDbEIsQ0FBQyxDQUFDO0lBRUgsT0FBTyxXQUFXLENBQUM7QUFDdkIsQ0FBQyxDQUFDO0FBdkNXLFFBQUEsd0JBQXdCLDRCQXVDbkM7QUFFRiw4QkFBOEI7QUFDdkIsTUFBTSxvQkFBb0IsR0FBRyxHQUFHLEVBQUU7SUFDckMsTUFBTSxXQUFXLEdBQUc7UUFDaEIsT0FBTyxFQUFFLGNBQUksQ0FBQyxFQUFFLEVBQU87UUFDdkIsU0FBUyxFQUFFLGNBQUksQ0FBQyxFQUFFLEVBQU87UUFDekIsV0FBVyxFQUFFLGNBQUksQ0FBQyxFQUFFLEVBQU87UUFDM0IsZ0JBQWdCLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUNoQyxrQkFBa0IsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO0tBQ3JDLENBQUM7SUFFRixXQUFXLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVDLFdBQVcsQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUM1RCxXQUFXLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2hELFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztJQUNyRSxXQUFXLENBQUMsa0JBQWtCLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFdkQsT0FBTyxXQUFXLENBQUM7QUFDdkIsQ0FBQyxDQUFDO0FBaEJXLFFBQUEsb0JBQW9CLHdCQWdCL0I7QUFFSyxNQUFNLHVCQUF1QixHQUFHLEdBQUcsRUFBRTtJQUN4QyxNQUFNLFdBQVcsR0FBRztRQUNoQixLQUFLLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUNyQixRQUFRLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUN4QixXQUFXLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztRQUMzQixTQUFTLEVBQUUsY0FBSSxDQUFDLEVBQUUsRUFBTztLQUM1QixDQUFDO0lBRUYsV0FBVyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztRQUNoQyxPQUFPLEVBQUUsV0FBVztRQUNwQixXQUFXLEVBQUUsZ0JBQWdCO1FBQzdCLE1BQU0sRUFBRSxXQUFXO0tBQ3RCLENBQUMsQ0FBQztJQUVILFdBQVcsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDcEQsV0FBVyxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNoRCxXQUFXLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDO1FBQ3BDLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxnQkFBZ0IsRUFBRTtLQUM3RSxDQUFDLENBQUM7SUFFSCxPQUFPLFdBQVcsQ0FBQztBQUN2QixDQUFDLENBQUM7QUFyQlcsUUFBQSx1QkFBdUIsMkJBcUJsQztBQUVLLE1BQU0sbUNBQW1DLEdBQUcsR0FBRyxFQUFFO0lBQ3BELE1BQU0sV0FBVyxHQUFHO1FBQ2hCLFdBQVcsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQzNCLFFBQVEsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQ3hCLFdBQVcsRUFBRSxjQUFJLENBQUMsRUFBRSxFQUFPO1FBQzNCLGdCQUFnQixFQUFFLGNBQUksQ0FBQyxFQUFFLEVBQU87S0FDbkMsQ0FBQztJQUVGLFdBQVcsQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUM7UUFDdEMsT0FBTyxFQUFFLElBQUk7UUFDYixRQUFRLEVBQUUsV0FBVztLQUN4QixDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2xELFdBQVcsQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDckQsV0FBVyxDQUFDLGdCQUFnQixDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBRXJELE9BQU8sV0FBVyxDQUFDO0FBQ3ZCLENBQUMsQ0FBQztBQWxCVyxRQUFBLG1DQUFtQyx1Q0FrQjlDO0FBRUYsK0NBQStDO0FBQ3hDLE1BQU0sY0FBYyxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDakMsZ0JBQWdCO0lBQ2hCLHFCQUFxQixFQUFFLElBQUEsdUNBQStCLEdBQUU7SUFDeEQsa0NBQWtDLEVBQUUsSUFBQSxvREFBNEMsR0FBRTtJQUNsRixXQUFXLEVBQUUsSUFBQSw2QkFBcUIsR0FBRTtJQUNwQyxlQUFlLEVBQUUsSUFBQSxpQ0FBeUIsR0FBRTtJQUM1QyxpQkFBaUIsRUFBRSxJQUFBLG1DQUEyQixHQUFFO0lBQ2hELGdCQUFnQixFQUFFLElBQUEsa0NBQTBCLEdBQUU7SUFFOUMsY0FBYztJQUNkLG9CQUFvQixFQUFFLElBQUEsc0NBQThCLEdBQUU7SUFDdEQscUJBQXFCLEVBQUUsSUFBQSx1Q0FBK0IsR0FBRTtJQUV4RCxTQUFTO0lBQ1QsZUFBZSxFQUFFLElBQUEsaUNBQXlCLEdBQUU7SUFDNUMsYUFBYSxFQUFFLElBQUEsK0JBQXVCLEdBQUU7SUFDeEMsYUFBYSxFQUFFLElBQUEsK0JBQXVCLEdBQUU7SUFDeEMsYUFBYSxFQUFFLElBQUEsK0JBQXVCLEdBQUU7SUFDeEMsZUFBZSxFQUFFLElBQUEsaUNBQXlCLEdBQUU7SUFDNUMsY0FBYyxFQUFFLElBQUEsZ0NBQXdCLEdBQUU7SUFFMUMsZ0JBQWdCO0lBQ2hCLFVBQVUsRUFBRSxJQUFBLDRCQUFvQixHQUFFO0lBQ2xDLGFBQWEsRUFBRSxJQUFBLCtCQUF1QixHQUFFO0lBQ3hDLHlCQUF5QixFQUFFLElBQUEsMkNBQW1DLEdBQUU7Q0FDbkUsQ0FBQyxDQUFDO0FBekJVLFFBQUEsY0FBYyxrQkF5QnhCO0FBRUgscUNBQXFDO0FBQzlCLE1BQU0sYUFBYSxHQUFHLENBQUMsS0FBd0MsRUFBRSxFQUFFO0lBQ3RFLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFO1FBQ3ZDLElBQUksT0FBTyxXQUFXLEtBQUssUUFBUSxJQUFJLFdBQVcsS0FBSyxJQUFJLEVBQUU7WUFDekQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUU7Z0JBQzVDLElBQUksY0FBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsRUFBRTtvQkFDakMsVUFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDO2lCQUMxQjtZQUNMLENBQUMsQ0FBQyxDQUFDO1NBQ047SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQztBQVZXLFFBQUEsYUFBYSxpQkFVeEI7QUFFRiwrQ0FBK0M7QUFDeEMsTUFBTSx3QkFBd0IsR0FBRyxDQUFDLFlBQWlCLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM5RCxJQUFJLEVBQUU7UUFDRixNQUFNLEVBQUUsVUFBVTtRQUNsQixjQUFjLEVBQUUsU0FBUztRQUN6QixJQUFJLEVBQUUsU0FBUztRQUNmLFdBQVcsRUFBRSxDQUFDLFdBQVcsRUFBRSxZQUFZLENBQUM7S0FDM0M7SUFDRCxNQUFNLEVBQUUsRUFBRTtJQUNWLEtBQUssRUFBRSxFQUFFO0lBQ1QsSUFBSSxFQUFFLEVBQUU7SUFDUixPQUFPLEVBQUUsRUFBRTtJQUNYLEdBQUcsU0FBUztDQUNmLENBQUMsQ0FBQztBQVpVLFFBQUEsd0JBQXdCLDRCQVlsQztBQUVILGdEQUFnRDtBQUN6QyxNQUFNLGtCQUFrQixHQUFHLEdBQUcsRUFBRTtJQUNuQyxNQUFNLEdBQUcsR0FBUSxFQUFFLENBQUM7SUFDcEIsR0FBRyxDQUFDLE1BQU0sR0FBRyxjQUFJLENBQUMsRUFBRSxFQUFPLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2pELEdBQUcsQ0FBQyxJQUFJLEdBQUcsY0FBSSxDQUFDLEVBQUUsRUFBTyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMvQyxHQUFHLENBQUMsSUFBSSxHQUFHLGNBQUksQ0FBQyxFQUFFLEVBQU8sQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDL0MsR0FBRyxDQUFDLFNBQVMsR0FBRyxjQUFJLENBQUMsRUFBRSxFQUFPLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3BELEdBQUcsQ0FBQyxHQUFHLEdBQUcsY0FBSSxDQUFDLEVBQUUsRUFBTyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM5QyxPQUFPLEdBQUcsQ0FBQztBQUNmLENBQUMsQ0FBQztBQVJXLFFBQUEsa0JBQWtCLHNCQVE3QjtBQUVGLDZDQUE2QztBQUN0QyxNQUFNLGNBQWMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxjQUFJLENBQUMsRUFBRSxFQUFPLENBQUM7QUFBdEMsUUFBQSxjQUFjLGtCQUF3QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogTW9jayBzZXJ2aWNlcyBmYWN0b3J5IGZvciB0ZXN0aW5nXG4gKiBQcm92aWRlcyBjb25zaXN0ZW50IG1vY2tzIGZvciBhbGwgc2VydmljZXMgdXNlZCBpbiB0aGUgYXBwbGljYXRpb25cbiAqL1xuXG5pbXBvcnQgeyBqZXN0IH0gZnJvbSAnQGplc3QvZ2xvYmFscyc7XG5pbXBvcnQge1xuICAgIGNyZWF0ZU1vY2tVc2VyLFxuICAgIGNyZWF0ZU1vY2tJbnZlc3RtZW50SWRlYSxcbiAgICBjcmVhdGVNb2NrRmVlZGJhY2ssXG4gICAgY3JlYXRlTW9ja01hcmtldERhdGFQb2ludCxcbiAgICBjcmVhdGVNb2NrUmVxdWVzdFxufSBmcm9tICcuL21vY2stZGF0YSc7XG5cbi8vIFNlcnZpY2UgbW9jayBmYWN0b3JpZXMgYmFzZWQgb24gYWN0dWFsIHNlcnZpY2UgaW50ZXJmYWNlc1xuXG5leHBvcnQgY29uc3QgY3JlYXRlTW9ja0ludmVzdG1lbnRJZGVhU2VydmljZSA9ICgpID0+IHtcbiAgICBjb25zdCBtb2NrU2VydmljZSA9IHtcbiAgICAgICAgY3JlYXRlSW52ZXN0bWVudElkZWE6IGplc3QuZm48YW55PigpLFxuICAgICAgICB1cGRhdGVJbnZlc3RtZW50SWRlYTogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIGdldEludmVzdG1lbnRJZGVhOiBqZXN0LmZuPGFueT4oKSxcbiAgICAgICAgZ2V0VmVyc2lvbkhpc3Rvcnk6IGplc3QuZm48YW55PigpLFxuICAgICAgICBhZGRGZWVkYmFjazogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIGFkZFBlcmZvcm1hbmNlVHJhY2tpbmc6IGplc3QuZm48YW55PigpLFxuICAgICAgICB1cGRhdGVTdGF0dXM6IGplc3QuZm48YW55PigpLFxuICAgICAgICBzZWFyY2hJbnZlc3RtZW50SWRlYXM6IGplc3QuZm48YW55PigpLFxuICAgICAgICBnZXRFeHBpcmluZ0lkZWFzOiBqZXN0LmZuPGFueT4oKVxuICAgIH07XG5cbiAgICBtb2NrU2VydmljZS5jcmVhdGVJbnZlc3RtZW50SWRlYS5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIGlkZWE6IGNyZWF0ZU1vY2tJbnZlc3RtZW50SWRlYSgpLFxuICAgICAgICB2YWxpZGF0aW9uOiB7IGlzVmFsaWQ6IHRydWUsIGVycm9yczogW10gfVxuICAgIH0pO1xuXG4gICAgbW9ja1NlcnZpY2UudXBkYXRlSW52ZXN0bWVudElkZWEubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgICBpZGVhOiBjcmVhdGVNb2NrSW52ZXN0bWVudElkZWEoKSxcbiAgICAgICAgdmFsaWRhdGlvbjogeyBpc1ZhbGlkOiB0cnVlLCBlcnJvcnM6IFtdIH0sXG4gICAgICAgIGNoYW5nZXM6IFtdXG4gICAgfSk7XG5cbiAgICBtb2NrU2VydmljZS5nZXRJbnZlc3RtZW50SWRlYS5tb2NrUmVzb2x2ZWRWYWx1ZShjcmVhdGVNb2NrSW52ZXN0bWVudElkZWEoKSk7XG4gICAgbW9ja1NlcnZpY2UuZ2V0VmVyc2lvbkhpc3RvcnkubW9ja1Jlc29sdmVkVmFsdWUoW10gYXMgYW55KTtcbiAgICBtb2NrU2VydmljZS5hZGRGZWVkYmFjay5tb2NrUmVzb2x2ZWRWYWx1ZSh1bmRlZmluZWQgYXMgYW55KTtcbiAgICBtb2NrU2VydmljZS5hZGRQZXJmb3JtYW5jZVRyYWNraW5nLm1vY2tSZXNvbHZlZFZhbHVlKHVuZGVmaW5lZCBhcyBhbnkpO1xuICAgIG1vY2tTZXJ2aWNlLnVwZGF0ZVN0YXR1cy5tb2NrUmVzb2x2ZWRWYWx1ZSh1bmRlZmluZWQgYXMgYW55KTtcbiAgICBtb2NrU2VydmljZS5zZWFyY2hJbnZlc3RtZW50SWRlYXMubW9ja1Jlc29sdmVkVmFsdWUoW2NyZWF0ZU1vY2tJbnZlc3RtZW50SWRlYSgpXSk7XG4gICAgbW9ja1NlcnZpY2UuZ2V0RXhwaXJpbmdJZGVhcy5tb2NrUmVzb2x2ZWRWYWx1ZShbY3JlYXRlTW9ja0ludmVzdG1lbnRJZGVhKCldKTtcblxuICAgIHJldHVybiBtb2NrU2VydmljZTtcbn07XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVNb2NrSW52ZXN0bWVudElkZWFPcmNoZXN0cmF0aW9uU2VydmljZSA9ICgpID0+IHtcbiAgICBjb25zdCBtb2NrU2VydmljZSA9IHtcbiAgICAgICAgZ2VuZXJhdGVJbnZlc3RtZW50SWRlYXM6IGplc3QuZm48YW55PigpXG4gICAgfTtcblxuICAgIG1vY2tTZXJ2aWNlLmdlbmVyYXRlSW52ZXN0bWVudElkZWFzLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgcmVxdWVzdElkOiAncmVxdWVzdC0xMjMnLFxuICAgICAgICBpZGVhczogW2NyZWF0ZU1vY2tJbnZlc3RtZW50SWRlYSgpXSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICAgIHRvdGFsSWRlYXNHZW5lcmF0ZWQ6IDEsXG4gICAgICAgICAgICB0b3RhbElkZWFzRmlsdGVyZWQ6IDAsXG4gICAgICAgICAgICBmaWx0ZXJpbmdDcml0ZXJpYTogW10sXG4gICAgICAgICAgICBjb25maWRlbmNlRGlzdHJpYnV0aW9uOiB7IGhpZ2g6IDEsIG1lZGl1bTogMCwgbG93OiAwLCBhdmVyYWdlOiAwLjkgfSxcbiAgICAgICAgICAgIHByb2Nlc3NpbmdTdGVwczogW11cbiAgICAgICAgfSxcbiAgICAgICAgcHJvY2Vzc2luZ01ldHJpY3M6IHtcbiAgICAgICAgICAgIHRvdGFsUHJvY2Vzc2luZ1RpbWU6IDUwMDAsXG4gICAgICAgICAgICBhZ2VudFByb2Nlc3NpbmdUaW1lczoge30sXG4gICAgICAgICAgICBkYXRhU291cmNlc0FjY2Vzc2VkOiBbJ21hcmtldC1kYXRhJ10sXG4gICAgICAgICAgICBtb2RlbHNVc2VkOiBbJ2NsYXVkZS1zb25uZXQtMy43J10sXG4gICAgICAgICAgICByZXNvdXJjZVV0aWxpemF0aW9uOiB7fVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbW9ja1NlcnZpY2U7XG59O1xuXG5leHBvcnQgY29uc3QgY3JlYXRlTW9ja0F1dGhTZXJ2aWNlID0gKCkgPT4ge1xuICAgIGNvbnN0IG1vY2tTZXJ2aWNlID0ge1xuICAgICAgICByZWdpc3RlclVzZXI6IGplc3QuZm48YW55PigpLFxuICAgICAgICBsb2dpblVzZXI6IGplc3QuZm48YW55PigpLFxuICAgICAgICByZWZyZXNoVG9rZW46IGplc3QuZm48YW55PigpLFxuICAgICAgICB2ZXJpZnlUb2tlbjogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIGdldFVzZXJCeUlkOiBqZXN0LmZuPGFueT4oKSxcbiAgICAgICAgdXBkYXRlVXNlcjogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIGNoYW5nZVBhc3N3b3JkOiBqZXN0LmZuPGFueT4oKSxcbiAgICAgICAgcmVxdWVzdFBhc3N3b3JkUmVzZXQ6IGplc3QuZm48YW55PigpLFxuICAgICAgICBjb25maXJtUGFzc3dvcmRSZXNldDogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIGxvZ291dFVzZXI6IGplc3QuZm48YW55PigpXG4gICAgfTtcblxuICAgIG1vY2tTZXJ2aWNlLnJlZ2lzdGVyVXNlci5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIHVzZXI6IGNyZWF0ZU1vY2tVc2VyKCksXG4gICAgICAgIHRva2VuOiAnbW9jay1qd3QtdG9rZW4nLFxuICAgICAgICByZWZyZXNoVG9rZW46ICdtb2NrLXJlZnJlc2gtdG9rZW4nLFxuICAgICAgICBleHBpcmVzSW46IDM2MDBcbiAgICB9KTtcblxuICAgIG1vY2tTZXJ2aWNlLmxvZ2luVXNlci5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIHVzZXI6IGNyZWF0ZU1vY2tVc2VyKCksXG4gICAgICAgIHRva2VuOiAnbW9jay1qd3QtdG9rZW4nLFxuICAgICAgICByZWZyZXNoVG9rZW46ICdtb2NrLXJlZnJlc2gtdG9rZW4nLFxuICAgICAgICBleHBpcmVzSW46IDM2MDBcbiAgICB9KTtcblxuICAgIG1vY2tTZXJ2aWNlLnJlZnJlc2hUb2tlbi5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIHVzZXI6IGNyZWF0ZU1vY2tVc2VyKCksXG4gICAgICAgIHRva2VuOiAnbmV3LWp3dC10b2tlbicsXG4gICAgICAgIHJlZnJlc2hUb2tlbjogJ25ldy1yZWZyZXNoLXRva2VuJyxcbiAgICAgICAgZXhwaXJlc0luOiAzNjAwXG4gICAgfSk7XG5cbiAgICBtb2NrU2VydmljZS52ZXJpZnlUb2tlbi5tb2NrUmV0dXJuVmFsdWUoe1xuICAgICAgICB1c2VySWQ6ICd1c2VyLTEyMycsXG4gICAgICAgIG9yZ2FuaXphdGlvbklkOiAnb3JnLTQ1NicsXG4gICAgICAgIHJvbGU6ICdhbmFseXN0JyxcbiAgICAgICAgcGVybWlzc2lvbnM6IFsnaWRlYTpyZWFkJywgJ2lkZWE6d3JpdGUnXVxuICAgIH0pO1xuXG4gICAgbW9ja1NlcnZpY2UuZ2V0VXNlckJ5SWQubW9ja1Jlc29sdmVkVmFsdWUoY3JlYXRlTW9ja1VzZXIoKSk7XG4gICAgbW9ja1NlcnZpY2UudXBkYXRlVXNlci5tb2NrUmVzb2x2ZWRWYWx1ZShjcmVhdGVNb2NrVXNlcigpKTtcbiAgICBtb2NrU2VydmljZS5jaGFuZ2VQYXNzd29yZC5tb2NrUmVzb2x2ZWRWYWx1ZSh1bmRlZmluZWQpO1xuICAgIG1vY2tTZXJ2aWNlLnJlcXVlc3RQYXNzd29yZFJlc2V0Lm1vY2tSZXNvbHZlZFZhbHVlKHVuZGVmaW5lZCk7XG4gICAgbW9ja1NlcnZpY2UuY29uZmlybVBhc3N3b3JkUmVzZXQubW9ja1Jlc29sdmVkVmFsdWUodW5kZWZpbmVkKTtcbiAgICBtb2NrU2VydmljZS5sb2dvdXRVc2VyLm1vY2tSZXNvbHZlZFZhbHVlKHVuZGVmaW5lZCk7XG5cbiAgICByZXR1cm4gbW9ja1NlcnZpY2U7XG59O1xuXG5leHBvcnQgY29uc3QgY3JlYXRlTW9ja0ZlZWRiYWNrU2VydmljZSA9ICgpID0+IHtcbiAgICBjb25zdCBtb2NrU2VydmljZSA9IHtcbiAgICAgICAgc3VibWl0RmVlZGJhY2s6IGplc3QuZm48YW55PigpLFxuICAgICAgICBnZXRGZWVkYmFjazogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIHNlYXJjaEZlZWRiYWNrOiBqZXN0LmZuPGFueT4oKSxcbiAgICAgICAgdXBkYXRlRmVlZGJhY2tTdGF0dXM6IGplc3QuZm48YW55PigpLFxuICAgICAgICBnZXRGZWVkYmFja1N1bW1hcnk6IGplc3QuZm48YW55PigpLFxuICAgICAgICBnZW5lcmF0ZUZlZWRiYWNrQW5hbHl0aWNzOiBqZXN0LmZuPGFueT4oKSxcbiAgICAgICAgZ2V0RmVlZGJhY2tGb3JJbnZlc3RtZW50SWRlYTogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIGdldEZlZWRiYWNrRm9yVXNlcjogamVzdC5mbjxhbnk+KClcbiAgICB9O1xuXG4gICAgbW9ja1NlcnZpY2Uuc3VibWl0RmVlZGJhY2subW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICBmZWVkYmFjazogY3JlYXRlTW9ja0ZlZWRiYWNrKClcbiAgICB9KTtcblxuICAgIG1vY2tTZXJ2aWNlLmdldEZlZWRiYWNrLm1vY2tSZXNvbHZlZFZhbHVlKGNyZWF0ZU1vY2tGZWVkYmFjaygpKTtcblxuICAgIG1vY2tTZXJ2aWNlLnNlYXJjaEZlZWRiYWNrLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgZmVlZGJhY2s6IFtjcmVhdGVNb2NrRmVlZGJhY2soKV0sXG4gICAgICAgIHRvdGFsQ291bnQ6IDEsXG4gICAgICAgIGhhc01vcmU6IGZhbHNlXG4gICAgfSk7XG5cbiAgICBtb2NrU2VydmljZS51cGRhdGVGZWVkYmFja1N0YXR1cy5tb2NrUmVzb2x2ZWRWYWx1ZSh0cnVlKTtcblxuICAgIG1vY2tTZXJ2aWNlLmdldEZlZWRiYWNrU3VtbWFyeS5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIHRvdGFsQ291bnQ6IDEwLFxuICAgICAgICBhdmVyYWdlUmF0aW5nOiA0LjIsXG4gICAgICAgIHJhdGluZ0Rpc3RyaWJ1dGlvbjogeyAxOiAwLCAyOiAxLCAzOiAyLCA0OiAzLCA1OiA0IH0sXG4gICAgICAgIGNhdGVnb3J5QnJlYWtkb3duOiB7IGFjY3VyYWN5OiA1LCByZWxldmFuY2U6IDMsIGNvbXBsZXRlbmVzczogMiwgdGltZWxpbmVzczogMCwgdXNhYmlsaXR5OiAwLCBwZXJmb3JtYW5jZTogMCwgY29tcGxpYW5jZTogMCwgb3RoZXI6IDAgfSxcbiAgICAgICAgdHlwZUJyZWFrZG93bjogeyAnaW52ZXN0bWVudC1pZGVhLXF1YWxpdHknOiA1LCAnYW5hbHlzaXMtYWNjdXJhY3knOiAzLCAnc3lzdGVtLXBlcmZvcm1hbmNlJzogMiwgJ3VzZXItZXhwZXJpZW5jZSc6IDAsICdmZWF0dXJlLXJlcXVlc3QnOiAwLCAnYnVnLXJlcG9ydCc6IDAsICdnZW5lcmFsJzogMCB9LFxuICAgICAgICBzZW50aW1lbnRCcmVha2Rvd246IHsgcG9zaXRpdmU6IDcsIG5ldXRyYWw6IDIsIG5lZ2F0aXZlOiAxIH0sXG4gICAgICAgIHN0YXR1c0JyZWFrZG93bjogeyBzdWJtaXR0ZWQ6IDIsICd1bmRlci1yZXZpZXcnOiAzLCAnaW4tcHJvZ3Jlc3MnOiAyLCByZXNvbHZlZDogMywgZGlzbWlzc2VkOiAwLCBhcmNoaXZlZDogMCB9LFxuICAgICAgICB0aW1lUmFuZ2U6IHsgc3RhcnQ6IG5ldyBEYXRlKCksIGVuZDogbmV3IERhdGUoKSB9XG4gICAgfSk7XG5cbiAgICBtb2NrU2VydmljZS5nZW5lcmF0ZUZlZWRiYWNrQW5hbHl0aWNzLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgdHJlbmRzOiBbXSxcbiAgICAgICAgaW5zaWdodHM6IFtdLFxuICAgICAgICByZWNvbW1lbmRhdGlvbnM6IFtdLFxuICAgICAgICBjb3JyZWxhdGlvbnM6IFtdXG4gICAgfSk7XG5cbiAgICBtb2NrU2VydmljZS5nZXRGZWVkYmFja0ZvckludmVzdG1lbnRJZGVhLm1vY2tSZXNvbHZlZFZhbHVlKFtjcmVhdGVNb2NrRmVlZGJhY2soKV0pO1xuICAgIG1vY2tTZXJ2aWNlLmdldEZlZWRiYWNrRm9yVXNlci5tb2NrUmVzb2x2ZWRWYWx1ZShbY3JlYXRlTW9ja0ZlZWRiYWNrKCldKTtcblxuICAgIHJldHVybiBtb2NrU2VydmljZTtcbn07XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVNb2NrTWFya2V0RGF0YVNlcnZpY2UgPSAoKSA9PiB7XG4gICAgY29uc3QgbW9ja1NlcnZpY2UgPSB7XG4gICAgICAgIGluaXRpYWxpemU6IGplc3QuZm48YW55PigpLFxuICAgICAgICBhZGRQcm92aWRlcjogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIHJlbW92ZVByb3ZpZGVyOiBqZXN0LmZuPGFueT4oKSxcbiAgICAgICAgc3Vic2NyaWJlVG9EYXRhOiBqZXN0LmZuPGFueT4oKSxcbiAgICAgICAgdW5zdWJzY3JpYmVGcm9tRGF0YTogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIGdldEhpc3RvcmljYWxEYXRhOiBqZXN0LmZuPGFueT4oKSxcbiAgICAgICAgZ2V0Q3VycmVudERhdGE6IGplc3QuZm48YW55PigpLFxuICAgICAgICBub3JtYWxpemVEYXRhOiBqZXN0LmZuPGFueT4oKSxcbiAgICAgICAgY3JlYXRlQWxlcnQ6IGplc3QuZm48YW55PigpLFxuICAgICAgICB1cGRhdGVBbGVydDogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIGRlbGV0ZUFsZXJ0OiBqZXN0LmZuPGFueT4oKSxcbiAgICAgICAgZ2V0QWxlcnQ6IGplc3QuZm48YW55PigpLFxuICAgICAgICBsaXN0QWxlcnRzOiBqZXN0LmZuPGFueT4oKSxcbiAgICAgICAgZW5hYmxlQWxlcnQ6IGplc3QuZm48YW55PigpLFxuICAgICAgICBkaXNhYmxlQWxlcnQ6IGplc3QuZm48YW55PigpLFxuICAgICAgICBnZXRTdG9yYWdlU3RhdHM6IGplc3QuZm48YW55PigpXG4gICAgfTtcblxuICAgIG1vY2tTZXJ2aWNlLmluaXRpYWxpemUubW9ja1Jlc29sdmVkVmFsdWUodW5kZWZpbmVkKTtcbiAgICBtb2NrU2VydmljZS5hZGRQcm92aWRlci5tb2NrUmVzb2x2ZWRWYWx1ZSh1bmRlZmluZWQpO1xuICAgIG1vY2tTZXJ2aWNlLnJlbW92ZVByb3ZpZGVyLm1vY2tSZXNvbHZlZFZhbHVlKHRydWUpO1xuICAgIG1vY2tTZXJ2aWNlLnN1YnNjcmliZVRvRGF0YS5tb2NrUmVzb2x2ZWRWYWx1ZSgnc3Vic2NyaXB0aW9uLTEyMycpO1xuICAgIG1vY2tTZXJ2aWNlLnVuc3Vic2NyaWJlRnJvbURhdGEubW9ja1Jlc29sdmVkVmFsdWUodHJ1ZSk7XG4gICAgbW9ja1NlcnZpY2UuZ2V0SGlzdG9yaWNhbERhdGEubW9ja1Jlc29sdmVkVmFsdWUoW2NyZWF0ZU1vY2tNYXJrZXREYXRhUG9pbnQoKV0pO1xuICAgIG1vY2tTZXJ2aWNlLmdldEN1cnJlbnREYXRhLm1vY2tSZXNvbHZlZFZhbHVlKGNyZWF0ZU1vY2tNYXJrZXREYXRhUG9pbnQoKSk7XG4gICAgbW9ja1NlcnZpY2Uubm9ybWFsaXplRGF0YS5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIG5vcm1hbGl6ZWREYXRhOiBbY3JlYXRlTW9ja01hcmtldERhdGFQb2ludCgpXSxcbiAgICAgICAgbWV0YWRhdGE6IHsgb3JpZ2luYWxDb3VudDogMSwgbm9ybWFsaXplZENvdW50OiAxIH1cbiAgICB9KTtcbiAgICBtb2NrU2VydmljZS5jcmVhdGVBbGVydC5tb2NrUmVzb2x2ZWRWYWx1ZSh7IGlkOiAnYWxlcnQtMTIzJyB9KTtcbiAgICBtb2NrU2VydmljZS51cGRhdGVBbGVydC5tb2NrUmVzb2x2ZWRWYWx1ZSh7IGlkOiAnYWxlcnQtMTIzJyB9KTtcbiAgICBtb2NrU2VydmljZS5kZWxldGVBbGVydC5tb2NrUmVzb2x2ZWRWYWx1ZSh0cnVlKTtcbiAgICBtb2NrU2VydmljZS5nZXRBbGVydC5tb2NrUmVzb2x2ZWRWYWx1ZSh7IGlkOiAnYWxlcnQtMTIzJyB9KTtcbiAgICBtb2NrU2VydmljZS5saXN0QWxlcnRzLm1vY2tSZXNvbHZlZFZhbHVlKFt7IGlkOiAnYWxlcnQtMTIzJyB9XSk7XG4gICAgbW9ja1NlcnZpY2UuZW5hYmxlQWxlcnQubW9ja1Jlc29sdmVkVmFsdWUoeyBpZDogJ2FsZXJ0LTEyMycsIGVuYWJsZWQ6IHRydWUgfSk7XG4gICAgbW9ja1NlcnZpY2UuZGlzYWJsZUFsZXJ0Lm1vY2tSZXNvbHZlZFZhbHVlKHsgaWQ6ICdhbGVydC0xMjMnLCBlbmFibGVkOiBmYWxzZSB9KTtcbiAgICBtb2NrU2VydmljZS5nZXRTdG9yYWdlU3RhdHMubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgICB0b3RhbERhdGFQb2ludHM6IDEwMDAsXG4gICAgICAgIG9sZGVzdERhdGFQb2ludDogbmV3IERhdGUoKSxcbiAgICAgICAgbmV3ZXN0RGF0YVBvaW50OiBuZXcgRGF0ZSgpLFxuICAgICAgICBkYXRhUG9pbnRzQnlUeXBlOiB7fSxcbiAgICAgICAgc3RvcmFnZVNpemU6IDEwMjRcbiAgICB9KTtcblxuICAgIHJldHVybiBtb2NrU2VydmljZTtcbn07XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVNb2NrV2ViU2VhcmNoU2VydmljZSA9ICgpID0+IHtcbiAgICBjb25zdCBtb2NrU2VydmljZSA9IHtcbiAgICAgICAgcGVyZm9ybVdlYlNlYXJjaDogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIHBlcmZvcm1EZWVwUmVzZWFyY2g6IGplc3QuZm48YW55PigpXG4gICAgfTtcblxuICAgIG1vY2tTZXJ2aWNlLnBlcmZvcm1XZWJTZWFyY2gubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgICByZXN1bHRzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdNYXJrZXQgQW5hbHlzaXMgUmVwb3J0JyxcbiAgICAgICAgICAgICAgICB1cmw6ICdodHRwczovL2V4YW1wbGUuY29tL3JlcG9ydCcsXG4gICAgICAgICAgICAgICAgc25pcHBldDogJ0NvbXByZWhlbnNpdmUgbWFya2V0IGFuYWx5c2lzLi4uJyxcbiAgICAgICAgICAgICAgICByZWxldmFuY2VTY29yZTogMC45NSxcbiAgICAgICAgICAgICAgICBzb3VyY2U6ICdGaW5hbmNpYWwgVGltZXMnXG4gICAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIHRvdGFsUmVzdWx0czogMSxcbiAgICAgICAgZXhlY3V0aW9uVGltZTogMjUwXG4gICAgfSk7XG5cbiAgICBtb2NrU2VydmljZS5wZXJmb3JtRGVlcFJlc2VhcmNoLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgc3VtbWFyeTogJ0RlZXAgcmVzZWFyY2ggZmluZGluZ3MuLi4nLFxuICAgICAgICBzb3VyY2VzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdSZXNlYXJjaCBTb3VyY2UnLFxuICAgICAgICAgICAgICAgIHVybDogJ2h0dHBzOi8vZXhhbXBsZS5jb20vc291cmNlJyxcbiAgICAgICAgICAgICAgICBjcmVkaWJpbGl0eVNjb3JlOiAwLjksXG4gICAgICAgICAgICAgICAgcmVsZXZhbmNlU2NvcmU6IDAuODVcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAga2V5RmluZGluZ3M6IFsnRmluZGluZyAxJywgJ0ZpbmRpbmcgMiddLFxuICAgICAgICByZWxhdGVkVG9waWNzOiBbJ1RvcGljIDEnLCAnVG9waWMgMiddLFxuICAgICAgICBjb25maWRlbmNlOiAwLjg1XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbW9ja1NlcnZpY2U7XG59O1xuXG4vLyBBSSBTZXJ2aWNlIG1vY2tzXG5leHBvcnQgY29uc3QgY3JlYXRlTW9ja0JlZHJvY2tDbGllbnRTZXJ2aWNlID0gKCkgPT4ge1xuICAgIGNvbnN0IG1vY2tTZXJ2aWNlID0ge1xuICAgICAgICBpbml0aWFsaXplOiBqZXN0LmZuPGFueT4oKSxcbiAgICAgICAgbGlzdE1vZGVsczogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIGdldE1vZGVsRGV0YWlsczogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIGludm9rZU1vZGVsOiBqZXN0LmZuPGFueT4oKSxcbiAgICAgICAgaW52b2tlTW9kZWxXaXRoU3RyZWFtaW5nOiBqZXN0LmZuPGFueT4oKVxuICAgIH07XG5cbiAgICBtb2NrU2VydmljZS5pbml0aWFsaXplLm1vY2tSZXNvbHZlZFZhbHVlKHVuZGVmaW5lZCk7XG4gICAgbW9ja1NlcnZpY2UubGlzdE1vZGVscy5tb2NrUmVzb2x2ZWRWYWx1ZShbXG4gICAgICAgICdhbnRocm9waWMuY2xhdWRlLTMtc29ubmV0LTIwMjQwMjI5LXYxOjAnLFxuICAgICAgICAnYW50aHJvcGljLmNsYXVkZS0zLWhhaWt1LTIwMjQwMzA3LXYxOjAnLFxuICAgICAgICAnYW1hem9uLm5vdmEtcHJvLXYxOjAnXG4gICAgXSk7XG5cbiAgICBtb2NrU2VydmljZS5nZXRNb2RlbERldGFpbHMubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgICBtb2RlbERldGFpbHM6IHtcbiAgICAgICAgICAgIG1vZGVsSWQ6ICdhbnRocm9waWMuY2xhdWRlLTMtc29ubmV0LTIwMjQwMjI5LXYxOjAnLFxuICAgICAgICAgICAgcHJvdmlkZXJOYW1lOiAnQW50aHJvcGljJyxcbiAgICAgICAgICAgIG1vZGVsTmFtZTogJ0NsYXVkZSAzIFNvbm5ldCdcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgbW9ja1NlcnZpY2UuaW52b2tlTW9kZWwubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgICBjb21wbGV0aW9uOiAnTW9jayBBSSByZXNwb25zZScsXG4gICAgICAgIG1vZGVsSWQ6ICdhbnRocm9waWMuY2xhdWRlLTMtc29ubmV0LTIwMjQwMjI5LXYxOjAnLFxuICAgICAgICB1c2FnZTogeyBpbnB1dFRva2VuczogMTAsIG91dHB1dFRva2VuczogNSwgdG90YWxUb2tlbnM6IDE1IH1cbiAgICB9KTtcblxuICAgIG1vY2tTZXJ2aWNlLmludm9rZU1vZGVsV2l0aFN0cmVhbWluZy5tb2NrSW1wbGVtZW50YXRpb24oYXN5bmMgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgeWllbGQgeyBjb21wbGV0aW9uOiAnTW9jayAnLCBpc0NvbXBsZXRlOiBmYWxzZSB9O1xuICAgICAgICB5aWVsZCB7IGNvbXBsZXRpb246ICdBSSAnLCBpc0NvbXBsZXRlOiBmYWxzZSB9O1xuICAgICAgICB5aWVsZCB7IGNvbXBsZXRpb246ICdyZXNwb25zZScsIGlzQ29tcGxldGU6IHRydWUgfTtcbiAgICB9KTtcblxuICAgIHJldHVybiBtb2NrU2VydmljZTtcbn07XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVNb2NrTW9kZWxTZWxlY3Rpb25TZXJ2aWNlID0gKCkgPT4ge1xuICAgIGNvbnN0IG1vY2tTZXJ2aWNlID0ge1xuICAgICAgICBzZWxlY3RPcHRpbWFsTW9kZWw6IGplc3QuZm48YW55PigpLFxuICAgICAgICBldmFsdWF0ZU1vZGVsUGVyZm9ybWFuY2U6IGplc3QuZm48YW55PigpLFxuICAgICAgICBnZXRNb2RlbFJlY29tbWVuZGF0aW9uczogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIHVwZGF0ZU1vZGVsUHJlZmVyZW5jZXM6IGplc3QuZm48YW55PigpXG4gICAgfTtcblxuICAgIG1vY2tTZXJ2aWNlLnNlbGVjdE9wdGltYWxNb2RlbC5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIGlkOiAnYW50aHJvcGljLmNsYXVkZS0zLXNvbm5ldC0yMDI0MDIyOS12MTowJyxcbiAgICAgICAgbmFtZTogJ0NsYXVkZS1Tb25uZXQtMy43JyxcbiAgICAgICAgdmVyc2lvbjogJzEuMCcsXG4gICAgICAgIGNhcGFiaWxpdGllczogWyd0ZXh0LWdlbmVyYXRpb24nLCAnYW5hbHlzaXMnXSxcbiAgICAgICAgbGltaXRhdGlvbnM6IFsndG9rZW4tbGltaXQnXSxcbiAgICAgICAgY29uZmlndXJhdGlvblBhcmFtZXRlcnM6IHsgbWF4VG9rZW5zOiA0MDAwLCB0ZW1wZXJhdHVyZTogMC43IH1cbiAgICB9KTtcblxuICAgIG1vY2tTZXJ2aWNlLmV2YWx1YXRlTW9kZWxQZXJmb3JtYW5jZS5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIGFjY3VyYWN5OiAwLjkyLFxuICAgICAgICBsYXRlbmN5OiAxNTAwLFxuICAgICAgICB0aHJvdWdocHV0OiAxMDAsXG4gICAgICAgIGNvc3RQZXJUb2tlbjogMC4wMDFcbiAgICB9KTtcblxuICAgIG1vY2tTZXJ2aWNlLmdldE1vZGVsUmVjb21tZW5kYXRpb25zLm1vY2tSZXNvbHZlZFZhbHVlKFtcbiAgICAgICAgeyBtb2RlbElkOiAnY2xhdWRlLXNvbm5ldC0zLjcnLCBzY29yZTogMC45NSwgcmVhc29uOiAnQmVzdCBmb3IgY29tcGxleCBhbmFseXNpcycgfVxuICAgIF0pO1xuXG4gICAgbW9ja1NlcnZpY2UudXBkYXRlTW9kZWxQcmVmZXJlbmNlcy5tb2NrUmVzb2x2ZWRWYWx1ZSh1bmRlZmluZWQpO1xuXG4gICAgcmV0dXJuIG1vY2tTZXJ2aWNlO1xufTtcblxuLy8gQWdlbnQgbW9ja3NcbmV4cG9ydCBjb25zdCBjcmVhdGVNb2NrU3VwZXJ2aXNvckFnZW50ID0gKCkgPT4ge1xuICAgIGNvbnN0IG1vY2tTZXJ2aWNlID0ge1xuICAgICAgICBwcm9jZXNzUmVxdWVzdDogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIGRlbGVnYXRlVGFzazogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIG1vbml0b3JQcm9ncmVzczogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIGhhbmRsZUVycm9yOiBqZXN0LmZuPGFueT4oKVxuICAgIH07XG5cbiAgICBtb2NrU2VydmljZS5wcm9jZXNzUmVxdWVzdC5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIHJlc3VsdDogJ1Rhc2sgY29tcGxldGVkIHN1Y2Nlc3NmdWxseScsXG4gICAgICAgIGFnZW50c1VzZWQ6IFsncGxhbm5pbmcnLCAncmVzZWFyY2gnLCAnYW5hbHlzaXMnXSxcbiAgICAgICAgZXhlY3V0aW9uVGltZTogNTAwMFxuICAgIH0pO1xuXG4gICAgbW9ja1NlcnZpY2UuZGVsZWdhdGVUYXNrLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgdGFza0lkOiAndGFzay0xMjMnLFxuICAgICAgICBhc3NpZ25lZEFnZW50OiAncmVzZWFyY2gnLFxuICAgICAgICBzdGF0dXM6ICdpbi1wcm9ncmVzcydcbiAgICB9KTtcblxuICAgIG1vY2tTZXJ2aWNlLm1vbml0b3JQcm9ncmVzcy5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIG92ZXJhbGxQcm9ncmVzczogNzUsXG4gICAgICAgIGFjdGl2ZUFnZW50czogWydhbmFseXNpcycsICdjb21wbGlhbmNlJ10sXG4gICAgICAgIGNvbXBsZXRlZFN0ZXBzOiBbJ3BsYW5uaW5nJywgJ3Jlc2VhcmNoJ11cbiAgICB9KTtcblxuICAgIG1vY2tTZXJ2aWNlLmhhbmRsZUVycm9yLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgaGFuZGxlZDogdHJ1ZSxcbiAgICAgICAgcmVjb3Zlcnk6ICdhdXRvbWF0aWMnXG4gICAgfSk7XG5cbiAgICByZXR1cm4gbW9ja1NlcnZpY2U7XG59O1xuXG5leHBvcnQgY29uc3QgY3JlYXRlTW9ja1BsYW5uaW5nQWdlbnQgPSAoKSA9PiB7XG4gICAgY29uc3QgbW9ja1NlcnZpY2UgPSB7XG4gICAgICAgIGNyZWF0ZVJlc2VhcmNoUGxhbjogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIHVwZGF0ZVBsYW46IGplc3QuZm48YW55PigpLFxuICAgICAgICBleGVjdXRlUGxhbjogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIHZhbGlkYXRlUGxhbjogamVzdC5mbjxhbnk+KClcbiAgICB9O1xuXG4gICAgbW9ja1NlcnZpY2UuY3JlYXRlUmVzZWFyY2hQbGFuLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgcGxhbklkOiAncGxhbi0xMjMnLFxuICAgICAgICBzdGVwczogW1xuICAgICAgICAgICAgeyBpZDogJ3N0ZXAtMScsIG5hbWU6ICdNYXJrZXQgUmVzZWFyY2gnLCBlc3RpbWF0ZWRUaW1lOiAxMDAwIH0sXG4gICAgICAgICAgICB7IGlkOiAnc3RlcC0yJywgbmFtZTogJ0ZpbmFuY2lhbCBBbmFseXNpcycsIGVzdGltYXRlZFRpbWU6IDIwMDAgfVxuICAgICAgICBdLFxuICAgICAgICB0b3RhbEVzdGltYXRlZFRpbWU6IDMwMDBcbiAgICB9KTtcblxuICAgIG1vY2tTZXJ2aWNlLnVwZGF0ZVBsYW4ubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgICBwbGFuSWQ6ICdwbGFuLTEyMycsXG4gICAgICAgIHVwZGF0ZWRTdGVwczogWydzdGVwLTEnLCAnc3RlcC0yJ10sXG4gICAgICAgIHJlYXNvbjogJ05ldyBkYXRhIGF2YWlsYWJsZSdcbiAgICB9KTtcblxuICAgIG1vY2tTZXJ2aWNlLmV4ZWN1dGVQbGFuLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgcGxhbklkOiAncGxhbi0xMjMnLFxuICAgICAgICBzdGF0dXM6ICdjb21wbGV0ZWQnLFxuICAgICAgICByZXN1bHRzOiB7IHN0ZXAxOiAnUmVzZWFyY2ggY29tcGxldGUnLCBzdGVwMjogJ0FuYWx5c2lzIGNvbXBsZXRlJyB9XG4gICAgfSk7XG5cbiAgICBtb2NrU2VydmljZS52YWxpZGF0ZVBsYW4ubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgICB2YWxpZDogdHJ1ZSxcbiAgICAgICAgaXNzdWVzOiBbXVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG1vY2tTZXJ2aWNlO1xufTtcblxuZXhwb3J0IGNvbnN0IGNyZWF0ZU1vY2tSZXNlYXJjaEFnZW50ID0gKCkgPT4ge1xuICAgIGNvbnN0IG1vY2tTZXJ2aWNlID0ge1xuICAgICAgICBwcm9jZXNzUmVzZWFyY2hSZXF1ZXN0OiBqZXN0LmZuPGFueT4oKSxcbiAgICAgICAgYW5hbHl6ZU1hcmtldFRyZW5kczogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIGdhdGhlckNvbXBhbnlEYXRhOiBqZXN0LmZuPGFueT4oKSxcbiAgICAgICAgdmFsaWRhdGVTb3VyY2VzOiBqZXN0LmZuPGFueT4oKVxuICAgIH07XG5cbiAgICBtb2NrU2VydmljZS5wcm9jZXNzUmVzZWFyY2hSZXF1ZXN0Lm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgZmluZGluZ3M6IFsnRmluZGluZyAxJywgJ0ZpbmRpbmcgMiddLFxuICAgICAgICBzb3VyY2VzOiBbJ1NvdXJjZSAxJywgJ1NvdXJjZSAyJ10sXG4gICAgICAgIGNvbmZpZGVuY2U6IDAuOSxcbiAgICAgICAgcmVzZWFyY2hUaW1lOiAyMDAwXG4gICAgfSk7XG5cbiAgICBtb2NrU2VydmljZS5hbmFseXplTWFya2V0VHJlbmRzLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgdHJlbmRzOiBbJ1Vwd2FyZCB0cmVuZCBpbiBBSSBzdG9ja3MnLCAnVm9sYXRpbGl0eSBpbiB0ZWNoIHNlY3RvciddLFxuICAgICAgICB0aW1lZnJhbWU6ICczMCBkYXlzJyxcbiAgICAgICAgY29uZmlkZW5jZTogMC44NVxuICAgIH0pO1xuXG4gICAgbW9ja1NlcnZpY2UuZ2F0aGVyQ29tcGFueURhdGEubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgICBjb21wYW55RGF0YToge1xuICAgICAgICAgICAgcmV2ZW51ZTogMTAwMDAwMDAwMCxcbiAgICAgICAgICAgIG1hcmtldENhcDogNTAwMDAwMDAwMDAsXG4gICAgICAgICAgICBwZVJhdGlvOiAyNS41XG4gICAgICAgIH0sXG4gICAgICAgIGRhdGFRdWFsaXR5OiAnaGlnaCcsXG4gICAgICAgIGxhc3RVcGRhdGVkOiBuZXcgRGF0ZSgpXG4gICAgfSk7XG5cbiAgICBtb2NrU2VydmljZS52YWxpZGF0ZVNvdXJjZXMubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgICB2YWxpZFNvdXJjZXM6IFsnU291cmNlIDEnXSxcbiAgICAgICAgaW52YWxpZFNvdXJjZXM6IFtdLFxuICAgICAgICBjb25maWRlbmNlOiAwLjk1XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbW9ja1NlcnZpY2U7XG59O1xuXG5leHBvcnQgY29uc3QgY3JlYXRlTW9ja0FuYWx5c2lzQWdlbnQgPSAoKSA9PiB7XG4gICAgY29uc3QgbW9ja1NlcnZpY2UgPSB7XG4gICAgICAgIHByb2Nlc3NBbmFseXNpc1JlcXVlc3Q6IGplc3QuZm48YW55PigpLFxuICAgICAgICBjYWxjdWxhdGVSaXNrOiBqZXN0LmZuPGFueT4oKSxcbiAgICAgICAgcHJvamVjdFBlcmZvcm1hbmNlOiBqZXN0LmZuPGFueT4oKSxcbiAgICAgICAgZ2VuZXJhdGVTY2VuYXJpb3M6IGplc3QuZm48YW55PigpXG4gICAgfTtcblxuICAgIG1vY2tTZXJ2aWNlLnByb2Nlc3NBbmFseXNpc1JlcXVlc3QubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgICBhbmFseXNpc1Jlc3VsdHM6IHtcbiAgICAgICAgICAgIGV4cGVjdGVkUmV0dXJuOiAwLjE1LFxuICAgICAgICAgICAgcmlza1Njb3JlOiAwLjYsXG4gICAgICAgICAgICByZWNvbW1lbmRhdGlvbjogJ2J1eSdcbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlkZW5jZTogMC44OCxcbiAgICAgICAgYW5hbHlzaXNUaW1lOiAzMDAwXG4gICAgfSk7XG5cbiAgICBtb2NrU2VydmljZS5jYWxjdWxhdGVSaXNrLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgb3ZlcmFsbFJpc2s6ICdtZWRpdW0nLFxuICAgICAgICByaXNrRmFjdG9yczogWydtYXJrZXQgdm9sYXRpbGl0eScsICdzZWN0b3IgY29uY2VudHJhdGlvbiddLFxuICAgICAgICByaXNrU2NvcmU6IDAuNixcbiAgICAgICAgbWl0aWdhdGlvblN0cmF0ZWdpZXM6IFsnZGl2ZXJzaWZpY2F0aW9uJywgJ2hlZGdpbmcnXVxuICAgIH0pO1xuXG4gICAgbW9ja1NlcnZpY2UucHJvamVjdFBlcmZvcm1hbmNlLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgcHJvamVjdGlvbnM6IHtcbiAgICAgICAgICAgICcxeWVhcic6IHsgcmV0dXJuOiAwLjEyLCBjb25maWRlbmNlOiAwLjggfSxcbiAgICAgICAgICAgICczeWVhcic6IHsgcmV0dXJuOiAwLjM1LCBjb25maWRlbmNlOiAwLjYgfSxcbiAgICAgICAgICAgICc1eWVhcic6IHsgcmV0dXJuOiAwLjY1LCBjb25maWRlbmNlOiAwLjQgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBtb2NrU2VydmljZS5nZW5lcmF0ZVNjZW5hcmlvcy5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIHNjZW5hcmlvczogW1xuICAgICAgICAgICAgeyBuYW1lOiAnQnVsbCBNYXJrZXQnLCBwcm9iYWJpbGl0eTogMC4zLCBpbXBhY3Q6IDAuMjUgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ0JlYXIgTWFya2V0JywgcHJvYmFiaWxpdHk6IDAuMiwgaW1wYWN0OiAtMC4xNSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnU2lkZXdheXMgTWFya2V0JywgcHJvYmFiaWxpdHk6IDAuNSwgaW1wYWN0OiAwLjA1IH1cbiAgICAgICAgXVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG1vY2tTZXJ2aWNlO1xufTtcblxuZXhwb3J0IGNvbnN0IGNyZWF0ZU1vY2tDb21wbGlhbmNlQWdlbnQgPSAoKSA9PiB7XG4gICAgY29uc3QgbW9ja1NlcnZpY2UgPSB7XG4gICAgICAgIHByb2Nlc3NDb21wbGlhbmNlUmVxdWVzdDogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIHZhbGlkYXRlSW52ZXN0bWVudDogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIGdlbmVyYXRlQ29tcGxpYW5jZVJlcG9ydDogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIGNoZWNrUmVndWxhdGlvbnM6IGplc3QuZm48YW55PigpXG4gICAgfTtcblxuICAgIG1vY2tTZXJ2aWNlLnByb2Nlc3NDb21wbGlhbmNlUmVxdWVzdC5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIGNvbXBsaWFudDogdHJ1ZSxcbiAgICAgICAgaXNzdWVzOiBbXSxcbiAgICAgICAgcmVndWxhdGlvbnNDaGVja2VkOiBbJ1NFQy1SVUxFLTEnLCAnRklOUkEtMjExMSddLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKClcbiAgICB9KTtcblxuICAgIG1vY2tTZXJ2aWNlLnZhbGlkYXRlSW52ZXN0bWVudC5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIHZhbGlkOiB0cnVlLFxuICAgICAgICB3YXJuaW5nczogW10sXG4gICAgICAgIHJlc3RyaWN0aW9uczogW11cbiAgICB9KTtcblxuICAgIG1vY2tTZXJ2aWNlLmdlbmVyYXRlQ29tcGxpYW5jZVJlcG9ydC5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIHJlcG9ydElkOiAncmVwb3J0LTEyMycsXG4gICAgICAgIHN1bW1hcnk6ICdBbGwgY29tcGxpYW5jZSBjaGVja3MgcGFzc2VkJyxcbiAgICAgICAgZGV0YWlsczogeyBzZWM6ICdjb21wbGlhbnQnLCBmaW5yYTogJ2NvbXBsaWFudCcgfVxuICAgIH0pO1xuXG4gICAgbW9ja1NlcnZpY2UuY2hlY2tSZWd1bGF0aW9ucy5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIGFwcGxpY2FibGU6IFsnU0VDJywgJ0ZJTlJBJ10sXG4gICAgICAgIHZpb2xhdGlvbnM6IFtdLFxuICAgICAgICByZWNvbW1lbmRhdGlvbnM6IFtdXG4gICAgfSk7XG5cbiAgICByZXR1cm4gbW9ja1NlcnZpY2U7XG59O1xuXG5leHBvcnQgY29uc3QgY3JlYXRlTW9ja1N5bnRoZXNpc0FnZW50ID0gKCkgPT4ge1xuICAgIGNvbnN0IG1vY2tTZXJ2aWNlID0ge1xuICAgICAgICBwcm9jZXNzU3ludGhlc2lzUmVxdWVzdDogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIGdlbmVyYXRlUmVwb3J0OiBqZXN0LmZuPGFueT4oKSxcbiAgICAgICAgY3JlYXRlVmlzdWFsaXphdGlvbjogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIHN1bW1hcml6ZUZpbmRpbmdzOiBqZXN0LmZuPGFueT4oKVxuICAgIH07XG5cbiAgICBtb2NrU2VydmljZS5wcm9jZXNzU3ludGhlc2lzUmVxdWVzdC5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIHN5bnRoZXNpemVkUmVzdWx0OiB7XG4gICAgICAgICAgICB0aXRsZTogJ0ludmVzdG1lbnQgUmVjb21tZW5kYXRpb24nLFxuICAgICAgICAgICAgc3VtbWFyeTogJ0Jhc2VkIG9uIGFuYWx5c2lzLi4uJyxcbiAgICAgICAgICAgIHJlY29tbWVuZGF0aW9uOiAnYnV5JyxcbiAgICAgICAgICAgIGNvbmZpZGVuY2U6IDAuODVcbiAgICAgICAgfSxcbiAgICAgICAgc291cmNlc1VzZWQ6IFsncmVzZWFyY2gnLCAnYW5hbHlzaXMnLCAnY29tcGxpYW5jZSddLFxuICAgICAgICBzeW50aGVzaXNUaW1lOiAxNTAwXG4gICAgfSk7XG5cbiAgICBtb2NrU2VydmljZS5nZW5lcmF0ZVJlcG9ydC5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIHJlcG9ydElkOiAncmVwb3J0LTEyMycsXG4gICAgICAgIGZvcm1hdDogJ3BkZicsXG4gICAgICAgIGNvbnRlbnQ6IEJ1ZmZlci5mcm9tKCdSZXBvcnQgY29udGVudCcpLFxuICAgICAgICBnZW5lcmF0aW9uVGltZTogMjAwMFxuICAgIH0pO1xuXG4gICAgbW9ja1NlcnZpY2UuY3JlYXRlVmlzdWFsaXphdGlvbi5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIHZpc3VhbGl6YXRpb25JZDogJ3Zpei0xMjMnLFxuICAgICAgICB0eXBlOiAnY2hhcnQnLFxuICAgICAgICBkYXRhOiB7IGxhYmVsczogWydRMScsICdRMiddLCB2YWx1ZXM6IFsxMDAsIDE1MF0gfVxuICAgIH0pO1xuXG4gICAgbW9ja1NlcnZpY2Uuc3VtbWFyaXplRmluZGluZ3MubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgICBzdW1tYXJ5OiAnS2V5IGZpbmRpbmdzIHN1bW1hcnknLFxuICAgICAgICBrZXlQb2ludHM6IFsnUG9pbnQgMScsICdQb2ludCAyJ10sXG4gICAgICAgIGNvbmZpZGVuY2U6IDAuOVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG1vY2tTZXJ2aWNlO1xufTtcblxuLy8gQ29tbXVuaWNhdGlvbiBzZXJ2aWNlIG1vY2tzXG5leHBvcnQgY29uc3QgY3JlYXRlTW9ja01lc3NhZ2VCdXMgPSAoKSA9PiB7XG4gICAgY29uc3QgbW9ja1NlcnZpY2UgPSB7XG4gICAgICAgIHB1Ymxpc2g6IGplc3QuZm48YW55PigpLFxuICAgICAgICBzdWJzY3JpYmU6IGplc3QuZm48YW55PigpLFxuICAgICAgICB1bnN1YnNjcmliZTogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIGdldFN1YnNjcmlwdGlvbnM6IGplc3QuZm48YW55PigpLFxuICAgICAgICBjbGVhclN1YnNjcmlwdGlvbnM6IGplc3QuZm48YW55PigpXG4gICAgfTtcblxuICAgIG1vY2tTZXJ2aWNlLnB1Ymxpc2gubW9ja1Jlc29sdmVkVmFsdWUodHJ1ZSk7XG4gICAgbW9ja1NlcnZpY2Uuc3Vic2NyaWJlLm1vY2tSZXNvbHZlZFZhbHVlKCdzdWJzY3JpcHRpb24tMTIzJyk7XG4gICAgbW9ja1NlcnZpY2UudW5zdWJzY3JpYmUubW9ja1Jlc29sdmVkVmFsdWUodHJ1ZSk7XG4gICAgbW9ja1NlcnZpY2UuZ2V0U3Vic2NyaXB0aW9ucy5tb2NrUmVzb2x2ZWRWYWx1ZShbJ3N1YnNjcmlwdGlvbi0xMjMnXSk7XG4gICAgbW9ja1NlcnZpY2UuY2xlYXJTdWJzY3JpcHRpb25zLm1vY2tSZXNvbHZlZFZhbHVlKHRydWUpO1xuXG4gICAgcmV0dXJuIG1vY2tTZXJ2aWNlO1xufTtcblxuZXhwb3J0IGNvbnN0IGNyZWF0ZU1vY2tNZXNzYWdlUm91dGVyID0gKCkgPT4ge1xuICAgIGNvbnN0IG1vY2tTZXJ2aWNlID0ge1xuICAgICAgICByb3V0ZTogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIGFkZFJvdXRlOiBqZXN0LmZuPGFueT4oKSxcbiAgICAgICAgcmVtb3ZlUm91dGU6IGplc3QuZm48YW55PigpLFxuICAgICAgICBnZXRSb3V0ZXM6IGplc3QuZm48YW55PigpXG4gICAgfTtcblxuICAgIG1vY2tTZXJ2aWNlLnJvdXRlLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgcm91dGVJZDogJ3JvdXRlLTEyMycsXG4gICAgICAgIGRlc3RpbmF0aW9uOiAnYW5hbHlzaXMtYWdlbnQnLFxuICAgICAgICBzdGF0dXM6ICdkZWxpdmVyZWQnXG4gICAgfSk7XG5cbiAgICBtb2NrU2VydmljZS5hZGRSb3V0ZS5tb2NrUmVzb2x2ZWRWYWx1ZSgncm91dGUtMTIzJyk7XG4gICAgbW9ja1NlcnZpY2UucmVtb3ZlUm91dGUubW9ja1Jlc29sdmVkVmFsdWUodHJ1ZSk7XG4gICAgbW9ja1NlcnZpY2UuZ2V0Um91dGVzLm1vY2tSZXNvbHZlZFZhbHVlKFtcbiAgICAgICAgeyBpZDogJ3JvdXRlLTEyMycsIHBhdHRlcm46ICcvYW5hbHlzaXMvKicsIGRlc3RpbmF0aW9uOiAnYW5hbHlzaXMtYWdlbnQnIH1cbiAgICBdKTtcblxuICAgIHJldHVybiBtb2NrU2VydmljZTtcbn07XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVNb2NrQ29tbXVuaWNhdGlvbkVycm9ySGFuZGxlciA9ICgpID0+IHtcbiAgICBjb25zdCBtb2NrU2VydmljZSA9IHtcbiAgICAgICAgaGFuZGxlRXJyb3I6IGplc3QuZm48YW55PigpLFxuICAgICAgICBsb2dFcnJvcjogamVzdC5mbjxhbnk+KCksXG4gICAgICAgIG5vdGlmeUVycm9yOiBqZXN0LmZuPGFueT4oKSxcbiAgICAgICAgcmVjb3ZlckZyb21FcnJvcjogamVzdC5mbjxhbnk+KClcbiAgICB9O1xuXG4gICAgbW9ja1NlcnZpY2UuaGFuZGxlRXJyb3IubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgICBoYW5kbGVkOiB0cnVlLFxuICAgICAgICByZWNvdmVyeTogJ2F1dG9tYXRpYydcbiAgICB9KTtcblxuICAgIG1vY2tTZXJ2aWNlLmxvZ0Vycm9yLm1vY2tSZXNvbHZlZFZhbHVlKHVuZGVmaW5lZCk7XG4gICAgbW9ja1NlcnZpY2Uubm90aWZ5RXJyb3IubW9ja1Jlc29sdmVkVmFsdWUodW5kZWZpbmVkKTtcbiAgICBtb2NrU2VydmljZS5yZWNvdmVyRnJvbUVycm9yLm1vY2tSZXNvbHZlZFZhbHVlKHRydWUpO1xuXG4gICAgcmV0dXJuIG1vY2tTZXJ2aWNlO1xufTtcblxuLy8gVXRpbGl0eSBmdW5jdGlvbiB0byBjcmVhdGUgYWxsIG1vY2tzIGF0IG9uY2VcbmV4cG9ydCBjb25zdCBjcmVhdGVBbGxNb2NrcyA9ICgpID0+ICh7XG4gICAgLy8gQ29yZSBzZXJ2aWNlc1xuICAgIGludmVzdG1lbnRJZGVhU2VydmljZTogY3JlYXRlTW9ja0ludmVzdG1lbnRJZGVhU2VydmljZSgpLFxuICAgIGludmVzdG1lbnRJZGVhT3JjaGVzdHJhdGlvblNlcnZpY2U6IGNyZWF0ZU1vY2tJbnZlc3RtZW50SWRlYU9yY2hlc3RyYXRpb25TZXJ2aWNlKCksXG4gICAgYXV0aFNlcnZpY2U6IGNyZWF0ZU1vY2tBdXRoU2VydmljZSgpLFxuICAgIGZlZWRiYWNrU2VydmljZTogY3JlYXRlTW9ja0ZlZWRiYWNrU2VydmljZSgpLFxuICAgIG1hcmtldERhdGFTZXJ2aWNlOiBjcmVhdGVNb2NrTWFya2V0RGF0YVNlcnZpY2UoKSxcbiAgICB3ZWJTZWFyY2hTZXJ2aWNlOiBjcmVhdGVNb2NrV2ViU2VhcmNoU2VydmljZSgpLFxuXG4gICAgLy8gQUkgc2VydmljZXNcbiAgICBiZWRyb2NrQ2xpZW50U2VydmljZTogY3JlYXRlTW9ja0JlZHJvY2tDbGllbnRTZXJ2aWNlKCksXG4gICAgbW9kZWxTZWxlY3Rpb25TZXJ2aWNlOiBjcmVhdGVNb2NrTW9kZWxTZWxlY3Rpb25TZXJ2aWNlKCksXG5cbiAgICAvLyBBZ2VudHNcbiAgICBzdXBlcnZpc29yQWdlbnQ6IGNyZWF0ZU1vY2tTdXBlcnZpc29yQWdlbnQoKSxcbiAgICBwbGFubmluZ0FnZW50OiBjcmVhdGVNb2NrUGxhbm5pbmdBZ2VudCgpLFxuICAgIHJlc2VhcmNoQWdlbnQ6IGNyZWF0ZU1vY2tSZXNlYXJjaEFnZW50KCksXG4gICAgYW5hbHlzaXNBZ2VudDogY3JlYXRlTW9ja0FuYWx5c2lzQWdlbnQoKSxcbiAgICBjb21wbGlhbmNlQWdlbnQ6IGNyZWF0ZU1vY2tDb21wbGlhbmNlQWdlbnQoKSxcbiAgICBzeW50aGVzaXNBZ2VudDogY3JlYXRlTW9ja1N5bnRoZXNpc0FnZW50KCksXG5cbiAgICAvLyBDb21tdW5pY2F0aW9uXG4gICAgbWVzc2FnZUJ1czogY3JlYXRlTW9ja01lc3NhZ2VCdXMoKSxcbiAgICBtZXNzYWdlUm91dGVyOiBjcmVhdGVNb2NrTWVzc2FnZVJvdXRlcigpLFxuICAgIGNvbW11bmljYXRpb25FcnJvckhhbmRsZXI6IGNyZWF0ZU1vY2tDb21tdW5pY2F0aW9uRXJyb3JIYW5kbGVyKClcbn0pO1xuXG4vLyBIZWxwZXIgZnVuY3Rpb24gdG8gcmVzZXQgYWxsIG1vY2tzXG5leHBvcnQgY29uc3QgcmVzZXRBbGxNb2NrcyA9IChtb2NrczogUmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlQWxsTW9ja3M+KSA9PiB7XG4gICAgT2JqZWN0LnZhbHVlcyhtb2NrcykuZm9yRWFjaChtb2NrU2VydmljZSA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgbW9ja1NlcnZpY2UgPT09ICdvYmplY3QnICYmIG1vY2tTZXJ2aWNlICE9PSBudWxsKSB7XG4gICAgICAgICAgICBPYmplY3QudmFsdWVzKG1vY2tTZXJ2aWNlKS5mb3JFYWNoKG1vY2tNZXRob2QgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChqZXN0LmlzTW9ja0Z1bmN0aW9uKG1vY2tNZXRob2QpKSB7XG4gICAgICAgICAgICAgICAgICAgIG1vY2tNZXRob2QubW9ja0NsZWFyKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn07XG5cbi8vIFRlc3QgaGVscGVyIHRvIGNyZWF0ZSBhIG1vY2sgRXhwcmVzcyByZXF1ZXN0XG5leHBvcnQgY29uc3QgY3JlYXRlTW9ja0V4cHJlc3NSZXF1ZXN0ID0gKG92ZXJyaWRlczogYW55ID0ge30pID0+ICh7XG4gICAgdXNlcjoge1xuICAgICAgICB1c2VySWQ6ICd1c2VyLTEyMycsXG4gICAgICAgIG9yZ2FuaXphdGlvbklkOiAnb3JnLTQ1NicsXG4gICAgICAgIHJvbGU6ICdhbmFseXN0JyxcbiAgICAgICAgcGVybWlzc2lvbnM6IFsnaWRlYTpyZWFkJywgJ2lkZWE6d3JpdGUnXVxuICAgIH0sXG4gICAgcGFyYW1zOiB7fSxcbiAgICBxdWVyeToge30sXG4gICAgYm9keToge30sXG4gICAgaGVhZGVyczoge30sXG4gICAgLi4ub3ZlcnJpZGVzXG59KTtcblxuLy8gVGVzdCBoZWxwZXIgdG8gY3JlYXRlIGEgbW9jayBFeHByZXNzIHJlc3BvbnNlXG5leHBvcnQgY29uc3QgY3JlYXRlTW9ja1Jlc3BvbnNlID0gKCkgPT4ge1xuICAgIGNvbnN0IHJlczogYW55ID0ge307XG4gICAgcmVzLnN0YXR1cyA9IGplc3QuZm48YW55PigpLm1vY2tSZXR1cm5WYWx1ZShyZXMpO1xuICAgIHJlcy5qc29uID0gamVzdC5mbjxhbnk+KCkubW9ja1JldHVyblZhbHVlKHJlcyk7XG4gICAgcmVzLnNlbmQgPSBqZXN0LmZuPGFueT4oKS5tb2NrUmV0dXJuVmFsdWUocmVzKTtcbiAgICByZXMuc2V0SGVhZGVyID0gamVzdC5mbjxhbnk+KCkubW9ja1JldHVyblZhbHVlKHJlcyk7XG4gICAgcmVzLmVuZCA9IGplc3QuZm48YW55PigpLm1vY2tSZXR1cm5WYWx1ZShyZXMpO1xuICAgIHJldHVybiByZXM7XG59O1xuXG4vLyBUZXN0IGhlbHBlciB0byBjcmVhdGUgYSBtb2NrIE5leHQgZnVuY3Rpb25cbmV4cG9ydCBjb25zdCBjcmVhdGVNb2NrTmV4dCA9ICgpID0+IGplc3QuZm48YW55PigpOyJdfQ==