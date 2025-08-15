/**
 * Mock services factory for testing
 * Provides consistent mocks for all services used in the application
 */
export declare const createMockInvestmentIdeaService: () => {
    createInvestmentIdea: import("jest-mock").Mock<any>;
    updateInvestmentIdea: import("jest-mock").Mock<any>;
    getInvestmentIdea: import("jest-mock").Mock<any>;
    getVersionHistory: import("jest-mock").Mock<any>;
    addFeedback: import("jest-mock").Mock<any>;
    addPerformanceTracking: import("jest-mock").Mock<any>;
    updateStatus: import("jest-mock").Mock<any>;
    searchInvestmentIdeas: import("jest-mock").Mock<any>;
    getExpiringIdeas: import("jest-mock").Mock<any>;
};
export declare const createMockInvestmentIdeaOrchestrationService: () => {
    generateInvestmentIdeas: import("jest-mock").Mock<any>;
};
export declare const createMockAuthService: () => {
    registerUser: import("jest-mock").Mock<any>;
    loginUser: import("jest-mock").Mock<any>;
    refreshToken: import("jest-mock").Mock<any>;
    verifyToken: import("jest-mock").Mock<any>;
    getUserById: import("jest-mock").Mock<any>;
    updateUser: import("jest-mock").Mock<any>;
    changePassword: import("jest-mock").Mock<any>;
    requestPasswordReset: import("jest-mock").Mock<any>;
    confirmPasswordReset: import("jest-mock").Mock<any>;
    logoutUser: import("jest-mock").Mock<any>;
};
export declare const createMockFeedbackService: () => {
    submitFeedback: import("jest-mock").Mock<any>;
    getFeedback: import("jest-mock").Mock<any>;
    searchFeedback: import("jest-mock").Mock<any>;
    updateFeedbackStatus: import("jest-mock").Mock<any>;
    getFeedbackSummary: import("jest-mock").Mock<any>;
    generateFeedbackAnalytics: import("jest-mock").Mock<any>;
    getFeedbackForInvestmentIdea: import("jest-mock").Mock<any>;
    getFeedbackForUser: import("jest-mock").Mock<any>;
};
export declare const createMockMarketDataService: () => {
    initialize: import("jest-mock").Mock<any>;
    addProvider: import("jest-mock").Mock<any>;
    removeProvider: import("jest-mock").Mock<any>;
    subscribeToData: import("jest-mock").Mock<any>;
    unsubscribeFromData: import("jest-mock").Mock<any>;
    getHistoricalData: import("jest-mock").Mock<any>;
    getCurrentData: import("jest-mock").Mock<any>;
    normalizeData: import("jest-mock").Mock<any>;
    createAlert: import("jest-mock").Mock<any>;
    updateAlert: import("jest-mock").Mock<any>;
    deleteAlert: import("jest-mock").Mock<any>;
    getAlert: import("jest-mock").Mock<any>;
    listAlerts: import("jest-mock").Mock<any>;
    enableAlert: import("jest-mock").Mock<any>;
    disableAlert: import("jest-mock").Mock<any>;
    getStorageStats: import("jest-mock").Mock<any>;
};
export declare const createMockWebSearchService: () => {
    performWebSearch: import("jest-mock").Mock<any>;
    performDeepResearch: import("jest-mock").Mock<any>;
};
export declare const createMockBedrockClientService: () => {
    initialize: import("jest-mock").Mock<any>;
    listModels: import("jest-mock").Mock<any>;
    getModelDetails: import("jest-mock").Mock<any>;
    invokeModel: import("jest-mock").Mock<any>;
    invokeModelWithStreaming: import("jest-mock").Mock<any>;
};
export declare const createMockModelSelectionService: () => {
    selectOptimalModel: import("jest-mock").Mock<any>;
    evaluateModelPerformance: import("jest-mock").Mock<any>;
    getModelRecommendations: import("jest-mock").Mock<any>;
    updateModelPreferences: import("jest-mock").Mock<any>;
};
export declare const createMockSupervisorAgent: () => {
    processRequest: import("jest-mock").Mock<any>;
    delegateTask: import("jest-mock").Mock<any>;
    monitorProgress: import("jest-mock").Mock<any>;
    handleError: import("jest-mock").Mock<any>;
};
export declare const createMockPlanningAgent: () => {
    createResearchPlan: import("jest-mock").Mock<any>;
    updatePlan: import("jest-mock").Mock<any>;
    executePlan: import("jest-mock").Mock<any>;
    validatePlan: import("jest-mock").Mock<any>;
};
export declare const createMockResearchAgent: () => {
    processResearchRequest: import("jest-mock").Mock<any>;
    analyzeMarketTrends: import("jest-mock").Mock<any>;
    gatherCompanyData: import("jest-mock").Mock<any>;
    validateSources: import("jest-mock").Mock<any>;
};
export declare const createMockAnalysisAgent: () => {
    processAnalysisRequest: import("jest-mock").Mock<any>;
    calculateRisk: import("jest-mock").Mock<any>;
    projectPerformance: import("jest-mock").Mock<any>;
    generateScenarios: import("jest-mock").Mock<any>;
};
export declare const createMockComplianceAgent: () => {
    processComplianceRequest: import("jest-mock").Mock<any>;
    validateInvestment: import("jest-mock").Mock<any>;
    generateComplianceReport: import("jest-mock").Mock<any>;
    checkRegulations: import("jest-mock").Mock<any>;
};
export declare const createMockSynthesisAgent: () => {
    processSynthesisRequest: import("jest-mock").Mock<any>;
    generateReport: import("jest-mock").Mock<any>;
    createVisualization: import("jest-mock").Mock<any>;
    summarizeFindings: import("jest-mock").Mock<any>;
};
export declare const createMockMessageBus: () => {
    publish: import("jest-mock").Mock<any>;
    subscribe: import("jest-mock").Mock<any>;
    unsubscribe: import("jest-mock").Mock<any>;
    getSubscriptions: import("jest-mock").Mock<any>;
    clearSubscriptions: import("jest-mock").Mock<any>;
};
export declare const createMockMessageRouter: () => {
    route: import("jest-mock").Mock<any>;
    addRoute: import("jest-mock").Mock<any>;
    removeRoute: import("jest-mock").Mock<any>;
    getRoutes: import("jest-mock").Mock<any>;
};
export declare const createMockCommunicationErrorHandler: () => {
    handleError: import("jest-mock").Mock<any>;
    logError: import("jest-mock").Mock<any>;
    notifyError: import("jest-mock").Mock<any>;
    recoverFromError: import("jest-mock").Mock<any>;
};
export declare const createAllMocks: () => {
    investmentIdeaService: {
        createInvestmentIdea: import("jest-mock").Mock<any>;
        updateInvestmentIdea: import("jest-mock").Mock<any>;
        getInvestmentIdea: import("jest-mock").Mock<any>;
        getVersionHistory: import("jest-mock").Mock<any>;
        addFeedback: import("jest-mock").Mock<any>;
        addPerformanceTracking: import("jest-mock").Mock<any>;
        updateStatus: import("jest-mock").Mock<any>;
        searchInvestmentIdeas: import("jest-mock").Mock<any>;
        getExpiringIdeas: import("jest-mock").Mock<any>;
    };
    investmentIdeaOrchestrationService: {
        generateInvestmentIdeas: import("jest-mock").Mock<any>;
    };
    authService: {
        registerUser: import("jest-mock").Mock<any>;
        loginUser: import("jest-mock").Mock<any>;
        refreshToken: import("jest-mock").Mock<any>;
        verifyToken: import("jest-mock").Mock<any>;
        getUserById: import("jest-mock").Mock<any>;
        updateUser: import("jest-mock").Mock<any>;
        changePassword: import("jest-mock").Mock<any>;
        requestPasswordReset: import("jest-mock").Mock<any>;
        confirmPasswordReset: import("jest-mock").Mock<any>;
        logoutUser: import("jest-mock").Mock<any>;
    };
    feedbackService: {
        submitFeedback: import("jest-mock").Mock<any>;
        getFeedback: import("jest-mock").Mock<any>;
        searchFeedback: import("jest-mock").Mock<any>;
        updateFeedbackStatus: import("jest-mock").Mock<any>;
        getFeedbackSummary: import("jest-mock").Mock<any>;
        generateFeedbackAnalytics: import("jest-mock").Mock<any>;
        getFeedbackForInvestmentIdea: import("jest-mock").Mock<any>;
        getFeedbackForUser: import("jest-mock").Mock<any>;
    };
    marketDataService: {
        initialize: import("jest-mock").Mock<any>;
        addProvider: import("jest-mock").Mock<any>;
        removeProvider: import("jest-mock").Mock<any>;
        subscribeToData: import("jest-mock").Mock<any>;
        unsubscribeFromData: import("jest-mock").Mock<any>;
        getHistoricalData: import("jest-mock").Mock<any>;
        getCurrentData: import("jest-mock").Mock<any>;
        normalizeData: import("jest-mock").Mock<any>;
        createAlert: import("jest-mock").Mock<any>;
        updateAlert: import("jest-mock").Mock<any>;
        deleteAlert: import("jest-mock").Mock<any>;
        getAlert: import("jest-mock").Mock<any>;
        listAlerts: import("jest-mock").Mock<any>;
        enableAlert: import("jest-mock").Mock<any>;
        disableAlert: import("jest-mock").Mock<any>;
        getStorageStats: import("jest-mock").Mock<any>;
    };
    webSearchService: {
        performWebSearch: import("jest-mock").Mock<any>;
        performDeepResearch: import("jest-mock").Mock<any>;
    };
    bedrockClientService: {
        initialize: import("jest-mock").Mock<any>;
        listModels: import("jest-mock").Mock<any>;
        getModelDetails: import("jest-mock").Mock<any>;
        invokeModel: import("jest-mock").Mock<any>;
        invokeModelWithStreaming: import("jest-mock").Mock<any>;
    };
    modelSelectionService: {
        selectOptimalModel: import("jest-mock").Mock<any>;
        evaluateModelPerformance: import("jest-mock").Mock<any>;
        getModelRecommendations: import("jest-mock").Mock<any>;
        updateModelPreferences: import("jest-mock").Mock<any>;
    };
    supervisorAgent: {
        processRequest: import("jest-mock").Mock<any>;
        delegateTask: import("jest-mock").Mock<any>;
        monitorProgress: import("jest-mock").Mock<any>;
        handleError: import("jest-mock").Mock<any>;
    };
    planningAgent: {
        createResearchPlan: import("jest-mock").Mock<any>;
        updatePlan: import("jest-mock").Mock<any>;
        executePlan: import("jest-mock").Mock<any>;
        validatePlan: import("jest-mock").Mock<any>;
    };
    researchAgent: {
        processResearchRequest: import("jest-mock").Mock<any>;
        analyzeMarketTrends: import("jest-mock").Mock<any>;
        gatherCompanyData: import("jest-mock").Mock<any>;
        validateSources: import("jest-mock").Mock<any>;
    };
    analysisAgent: {
        processAnalysisRequest: import("jest-mock").Mock<any>;
        calculateRisk: import("jest-mock").Mock<any>;
        projectPerformance: import("jest-mock").Mock<any>;
        generateScenarios: import("jest-mock").Mock<any>;
    };
    complianceAgent: {
        processComplianceRequest: import("jest-mock").Mock<any>;
        validateInvestment: import("jest-mock").Mock<any>;
        generateComplianceReport: import("jest-mock").Mock<any>;
        checkRegulations: import("jest-mock").Mock<any>;
    };
    synthesisAgent: {
        processSynthesisRequest: import("jest-mock").Mock<any>;
        generateReport: import("jest-mock").Mock<any>;
        createVisualization: import("jest-mock").Mock<any>;
        summarizeFindings: import("jest-mock").Mock<any>;
    };
    messageBus: {
        publish: import("jest-mock").Mock<any>;
        subscribe: import("jest-mock").Mock<any>;
        unsubscribe: import("jest-mock").Mock<any>;
        getSubscriptions: import("jest-mock").Mock<any>;
        clearSubscriptions: import("jest-mock").Mock<any>;
    };
    messageRouter: {
        route: import("jest-mock").Mock<any>;
        addRoute: import("jest-mock").Mock<any>;
        removeRoute: import("jest-mock").Mock<any>;
        getRoutes: import("jest-mock").Mock<any>;
    };
    communicationErrorHandler: {
        handleError: import("jest-mock").Mock<any>;
        logError: import("jest-mock").Mock<any>;
        notifyError: import("jest-mock").Mock<any>;
        recoverFromError: import("jest-mock").Mock<any>;
    };
};
export declare const resetAllMocks: (mocks: ReturnType<typeof createAllMocks>) => void;
export declare const createMockExpressRequest: (overrides?: any) => any;
export declare const createMockResponse: () => any;
export declare const createMockNext: () => import("jest-mock").Mock<any>;
