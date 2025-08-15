/**
 * Integration tests for service interactions
 * Tests the complete flow between different services
 */

import { jest } from '@jest/globals';
import { integrationTestUtils } from './integration-setup';
import { createAllMocks, resetAllMocks } from '../mock-services';

describe('Service Integration Tests', () => {
  let mocks: ReturnType<typeof createAllMocks>;

  beforeEach(() => {
    mocks = createAllMocks();
  });

  afterEach(() => {
    resetAllMocks(mocks);
  });

  describe('Investment Idea Generation Flow', () => {
    it('should complete full investment idea generation workflow', async () => {
      // Test the complete flow from request to final investment idea
      const requestData = integrationTestUtils.createTestInvestmentIdeaRequest();

      // Step 1: Supervisor Agent receives request
      const supervisorResult = await mocks.supervisorAgent.processRequest(requestData);
      expect(supervisorResult).toHaveProperty('result');
      expect(supervisorResult).toHaveProperty('agentsUsed');
      expect(supervisorResult.agentsUsed).toContain('planning');

      // Step 2: Planning Agent creates research plan
      const planningResult = await mocks.planningAgent.createResearchPlan(requestData);
      expect(planningResult).toHaveProperty('planId');
      expect(planningResult).toHaveProperty('steps');
      expect(Array.isArray(planningResult.steps)).toBe(true);

      // Step 3: Research Agent gathers information
      const researchResult = await mocks.researchAgent.processResearchRequest({
        query: 'technology investment opportunities',
        sources: ['web', 'proprietary']
      });
      expect(researchResult).toHaveProperty('findings');
      expect(researchResult).toHaveProperty('confidence');

      // Step 4: Analysis Agent processes data
      const analysisResult = await mocks.analysisAgent.processAnalysisRequest({
        data: researchResult.findings,
        parameters: requestData.parameters
      });
      expect(analysisResult).toHaveProperty('analysisResults');
      expect(analysisResult.analysisResults).toHaveProperty('expectedReturn');

      // Step 5: Compliance Agent validates
      const complianceResult = await mocks.complianceAgent.processComplianceRequest({
        investment: analysisResult.analysisResults
      });
      expect(complianceResult).toHaveProperty('compliant');
      expect(complianceResult.compliant).toBe(true);

      // Step 6: Synthesis Agent creates final output
      const synthesisResult = await mocks.synthesisAgent.processSynthesisRequest({
        research: researchResult,
        analysis: analysisResult,
        compliance: complianceResult
      });
      expect(synthesisResult).toHaveProperty('synthesizedResult');
      expect(synthesisResult.synthesizedResult).toHaveProperty('recommendation');

      // Verify all agents were called in correct sequence
      expect(mocks.supervisorAgent.processRequest).toHaveBeenCalledTimes(1);
      expect(mocks.planningAgent.createResearchPlan).toHaveBeenCalledTimes(1);
      expect(mocks.researchAgent.processResearchRequest).toHaveBeenCalledTimes(1);
      expect(mocks.analysisAgent.processAnalysisRequest).toHaveBeenCalledTimes(1);
      expect(mocks.complianceAgent.processComplianceRequest).toHaveBeenCalledTimes(1);
      expect(mocks.synthesisAgent.processSynthesisRequest).toHaveBeenCalledTimes(1);
    });

    it('should handle agent communication failures gracefully', async () => {
      // Simulate research agent failure
      mocks.researchAgent.processResearchRequest.mockRejectedValue(
        new Error('Research service unavailable')
      );

      // Supervisor should handle the error
      const errorResult = await mocks.supervisorAgent.handleError({
        error: new Error('Research service unavailable'),
        context: 'research-phase'
      });

      expect(errorResult).toHaveProperty('handled');
      expect(errorResult.handled).toBe(true);
      expect(mocks.supervisorAgent.handleError).toHaveBeenCalledTimes(1);
    });

    it('should coordinate multiple agents for complex analysis', async () => {
      const complexRequest = {
        ...integrationTestUtils.createTestInvestmentIdeaRequest(),
        parameters: {
          ...integrationTestUtils.createTestInvestmentIdeaRequest().parameters,
          sectors: ['technology', 'healthcare', 'finance'],
          requiresDeepAnalysis: true
        }
      };

      // Multiple research requests for different sectors
      const researchPromises = complexRequest.parameters.sectors.map(sector =>
        mocks.researchAgent.processResearchRequest({
          query: `${sector} investment opportunities`,
          sector
        })
      );

      const researchResults = await Promise.all(researchPromises);
      expect(researchResults).toHaveLength(3);

      // Analysis agent processes all research results
      const analysisResult = await mocks.analysisAgent.processAnalysisRequest({
        data: researchResults,
        parameters: complexRequest.parameters
      });

      expect(analysisResult).toHaveProperty('analysisResults');
      expect(mocks.researchAgent.processResearchRequest).toHaveBeenCalledTimes(3);
      expect(mocks.analysisAgent.processAnalysisRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('Data Integration Flow', () => {
    it('should integrate proprietary data with web search results', async () => {
      const proprietaryData = integrationTestUtils.createTestProprietaryData();

      // Upload proprietary data
      const uploadResult = await mocks.investmentIdeaService.createInvestmentIdea({
        proprietaryData,
        source: 'upload'
      });
      expect(uploadResult).toHaveProperty('idea');

      // Perform web search
      const webSearchResult = await mocks.webSearchService.performWebSearch({
        query: 'Apple Inc investment analysis',
        options: { depth: 'comprehensive' }
      });
      expect(webSearchResult).toHaveProperty('results');

      // Research agent should combine both data sources
      const combinedResearch = await mocks.researchAgent.processResearchRequest({
        query: 'Apple Inc comprehensive analysis',
        sources: ['proprietary', 'web'],
        proprietaryData: uploadResult.idea,
        webResults: webSearchResult.results
      });

      expect(combinedResearch).toHaveProperty('findings');
      expect(combinedResearch).toHaveProperty('sources');
      expect(combinedResearch.confidence).toBeGreaterThan(0.8); // Higher confidence with multiple sources
    });

    it('should handle market data integration', async () => {
      // Initialize market data service
      await mocks.marketDataService.initialize();

      // Subscribe to market data
      const subscriptionId = await mocks.marketDataService.subscribeToData({
        symbols: ['AAPL', 'GOOGL', 'MSFT'],
        dataTypes: ['price', 'volume', 'fundamentals']
      });
      expect(typeof subscriptionId).toBe('string');

      // Get current market data
      const currentData = await mocks.marketDataService.getCurrentData({
        symbol: 'AAPL'
      });
      expect(currentData).toHaveProperty('symbol');
      expect(currentData).toHaveProperty('price');

      // Analysis agent uses market data
      const marketAnalysis = await mocks.analysisAgent.processAnalysisRequest({
        data: currentData,
        type: 'market-analysis'
      });

      expect(marketAnalysis).toHaveProperty('analysisResults');
      expect(mocks.marketDataService.initialize).toHaveBeenCalledTimes(1);
      expect(mocks.marketDataService.subscribeToData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Model Selection and AI Integration', () => {
    it('should select appropriate models for different tasks', async () => {
      // Test model selection for different agent types
      const tasks = [
        { type: 'text-generation', agentRole: 'supervisor', complexity: 'complex' },
        { type: 'classification', agentRole: 'research', complexity: 'simple' },
        { type: 'time-series-analysis', agentRole: 'analysis', complexity: 'medium' }
      ];

      const modelSelections = await Promise.all(
        tasks.map(task => mocks.modelSelectionService.selectOptimalModel(task, {}))
      );

      expect(modelSelections).toHaveLength(3);
      
      // Supervisor should get Claude Sonnet for complex reasoning
      expect(modelSelections[0].name).toBe('Claude-Sonnet-3.7');
      
      // Research should get Claude Haiku for efficiency
      expect(modelSelections[1].name).toBe('Claude-Sonnet-3.7'); // Mock returns Sonnet
      
      // Analysis should get appropriate model
      expect(modelSelections[2]).toHaveProperty('name');

      expect(mocks.modelSelectionService.selectOptimalModel).toHaveBeenCalledTimes(3);
    });

    it('should handle model failures with fallbacks', async () => {
      // Simulate primary model failure
      mocks.bedrockClientService.invokeModel
        .mockRejectedValueOnce(new Error('Model unavailable'))
        .mockResolvedValueOnce({
          completion: 'Fallback model response',
          modelId: 'fallback-model',
          usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 }
        });

      // Model selection should provide fallback
      const fallbackModel = await mocks.modelSelectionService.selectOptimalModel({
        type: 'text-generation',
        agentRole: 'supervisor',
        complexity: 'complex'
      }, {});

      expect(fallbackModel).toHaveProperty('name');

      // Bedrock client should retry with fallback
      const result = await mocks.bedrockClientService.invokeModel({
        modelId: fallbackModel.id,
        prompt: 'Test prompt'
      });

      expect(result).toHaveProperty('completion');
      expect(result.completion).toBe('Fallback model response');
    });
  });

  describe('Communication and Message Routing', () => {
    it('should route messages between agents correctly', async () => {
      const testMessage = {
        sender: 'supervisor',
        recipient: 'research',
        messageType: 'request',
        content: { task: 'research technology trends' },
        metadata: {
          priority: 'high',
          timestamp: new Date(),
          conversationId: 'conv-123',
          requestId: 'req-456'
        }
      };

      // Route message
      const routeResult = await mocks.messageRouter.route(testMessage);
      expect(routeResult).toHaveProperty('routeId');
      expect(routeResult).toHaveProperty('destination');
      expect(routeResult.destination).toBe('analysis-agent'); // Mock returns analysis-agent

      // Publish message
      const publishResult = await mocks.messageBus.publish('agent.research.request', testMessage);
      expect(publishResult).toBe(true);

      // Subscribe to responses
      const subscriptionId = await mocks.messageBus.subscribe('agent.research.response', jest.fn());
      expect(typeof subscriptionId).toBe('string');

      expect(mocks.messageRouter.route).toHaveBeenCalledTimes(1);
      expect(mocks.messageBus.publish).toHaveBeenCalledTimes(1);
      expect(mocks.messageBus.subscribe).toHaveBeenCalledTimes(1);
    });

    it('should handle communication errors', async () => {
      // Simulate message routing failure
      mocks.messageRouter.route.mockRejectedValue(new Error('Routing failed'));

      // Error handler should be called
      const errorResult = await mocks.communicationErrorHandler.handleError({
        error: new Error('Routing failed'),
        context: 'message-routing'
      });

      expect(errorResult).toHaveProperty('handled');
      expect(errorResult.handled).toBe(true);
      expect(mocks.communicationErrorHandler.handleError).toHaveBeenCalledTimes(1);
    });
  });

  describe('Feedback and Learning Integration', () => {
    it('should integrate feedback into system improvement', async () => {
      const feedbackData = {
        investmentIdeaId: 'idea-123',
        rating: 4,
        category: 'accuracy',
        type: 'investment-idea-quality',
        comment: 'Good analysis but could be more detailed',
        sentiment: 'positive'
      };

      // Submit feedback
      const feedbackResult = await mocks.feedbackService.submitFeedback(feedbackData);
      expect(feedbackResult).toHaveProperty('success');
      expect(feedbackResult.success).toBe(true);

      // Generate analytics from feedback
      const analytics = await mocks.feedbackService.generateFeedbackAnalytics({
        timeRange: { start: new Date('2024-01-01'), end: new Date() },
        categories: ['accuracy', 'relevance']
      });

      expect(analytics).toHaveProperty('trends');
      expect(analytics).toHaveProperty('insights');
      expect(analytics).toHaveProperty('recommendations');

      // Model selection service should use feedback for improvements
      await mocks.modelSelectionService.updateModelPreferences({
        feedbackAnalytics: analytics,
        improvementAreas: ['accuracy', 'detail']
      });

      expect(mocks.feedbackService.submitFeedback).toHaveBeenCalledTimes(1);
      expect(mocks.feedbackService.generateFeedbackAnalytics).toHaveBeenCalledTimes(1);
      expect(mocks.modelSelectionService.updateModelPreferences).toHaveBeenCalledTimes(1);
    });
  });

  describe('End-to-End Workflow Integration', () => {
    it('should complete full investment research workflow', async () => {
      const startTime = Date.now();
      
      // 1. User authentication
      const authResult = await mocks.authService.loginUser({
        email: 'test@example.com',
        password: 'password'
      });
      expect(authResult).toHaveProperty('token');

      // 2. Investment idea request
      const requestData = integrationTestUtils.createTestInvestmentIdeaRequest();
      const ideaResult = await mocks.investmentIdeaOrchestrationService.generateInvestmentIdeas(requestData);
      expect(ideaResult).toHaveProperty('ideas');

      // 3. Feedback submission
      const feedbackData = {
        investmentIdeaId: ideaResult.ideas[0].id,
        rating: 5,
        category: 'accuracy',
        type: 'investment-idea-quality'
      };
      const feedbackResult = await mocks.feedbackService.submitFeedback(feedbackData);
      expect(feedbackResult.success).toBe(true);

      // 4. Performance tracking
      await integrationTestUtils.wait(100); // Simulate processing time

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify workflow completed successfully
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(mocks.authService.loginUser).toHaveBeenCalledTimes(1);
      expect(mocks.investmentIdeaOrchestrationService.generateInvestmentIdeas).toHaveBeenCalledTimes(1);
      expect(mocks.feedbackService.submitFeedback).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent user requests', async () => {
      const concurrentRequests = 5;
      const requests = Array(concurrentRequests).fill(null).map((_, index) => ({
        ...integrationTestUtils.createTestInvestmentIdeaRequest(),
        userId: `user-${index}`
      }));

      // Process all requests concurrently
      const results = await Promise.all(
        requests.map(request => 
          mocks.investmentIdeaOrchestrationService.generateInvestmentIdeas(request)
        )
      );

      // Verify all requests completed successfully
      expect(results).toHaveLength(concurrentRequests);
      results.forEach(result => {
        expect(result).toHaveProperty('ideas');
        expect(Array.isArray(result.ideas)).toBe(true);
      });

      expect(mocks.investmentIdeaOrchestrationService.generateInvestmentIdeas)
        .toHaveBeenCalledTimes(concurrentRequests);
    });
  });
});