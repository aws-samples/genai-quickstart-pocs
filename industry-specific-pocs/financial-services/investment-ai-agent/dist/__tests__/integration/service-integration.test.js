"use strict";
/**
 * Integration tests for service interactions
 * Tests the complete flow between different services
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const integration_setup_1 = require("./integration-setup");
const mock_services_1 = require("../mock-services");
describe('Service Integration Tests', () => {
    let mocks;
    beforeEach(() => {
        mocks = (0, mock_services_1.createAllMocks)();
    });
    afterEach(() => {
        (0, mock_services_1.resetAllMocks)(mocks);
    });
    describe('Investment Idea Generation Flow', () => {
        it('should complete full investment idea generation workflow', async () => {
            // Test the complete flow from request to final investment idea
            const requestData = integration_setup_1.integrationTestUtils.createTestInvestmentIdeaRequest();
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
            mocks.researchAgent.processResearchRequest.mockRejectedValue(new Error('Research service unavailable'));
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
                ...integration_setup_1.integrationTestUtils.createTestInvestmentIdeaRequest(),
                parameters: {
                    ...integration_setup_1.integrationTestUtils.createTestInvestmentIdeaRequest().parameters,
                    sectors: ['technology', 'healthcare', 'finance'],
                    requiresDeepAnalysis: true
                }
            };
            // Multiple research requests for different sectors
            const researchPromises = complexRequest.parameters.sectors.map(sector => mocks.researchAgent.processResearchRequest({
                query: `${sector} investment opportunities`,
                sector
            }));
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
            const proprietaryData = integration_setup_1.integrationTestUtils.createTestProprietaryData();
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
            const modelSelections = await Promise.all(tasks.map(task => mocks.modelSelectionService.selectOptimalModel(task, {})));
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
            const subscriptionId = await mocks.messageBus.subscribe('agent.research.response', globals_1.jest.fn());
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
            const requestData = integration_setup_1.integrationTestUtils.createTestInvestmentIdeaRequest();
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
            await integration_setup_1.integrationTestUtils.wait(100); // Simulate processing time
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
                ...integration_setup_1.integrationTestUtils.createTestInvestmentIdeaRequest(),
                userId: `user-${index}`
            }));
            // Process all requests concurrently
            const results = await Promise.all(requests.map(request => mocks.investmentIdeaOrchestrationService.generateInvestmentIdeas(request)));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZS1pbnRlZ3JhdGlvbi50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL19fdGVzdHNfXy9pbnRlZ3JhdGlvbi9zZXJ2aWNlLWludGVncmF0aW9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7QUFFSCwyQ0FBcUM7QUFDckMsMkRBQTJEO0FBQzNELG9EQUFpRTtBQUVqRSxRQUFRLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxFQUFFO0lBQ3pDLElBQUksS0FBd0MsQ0FBQztJQUU3QyxVQUFVLENBQUMsR0FBRyxFQUFFO1FBQ2QsS0FBSyxHQUFHLElBQUEsOEJBQWMsR0FBRSxDQUFDO0lBQzNCLENBQUMsQ0FBQyxDQUFDO0lBRUgsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNiLElBQUEsNkJBQWEsRUFBQyxLQUFLLENBQUMsQ0FBQztJQUN2QixDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxpQ0FBaUMsRUFBRSxHQUFHLEVBQUU7UUFDL0MsRUFBRSxDQUFDLDBEQUEwRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3hFLCtEQUErRDtZQUMvRCxNQUFNLFdBQVcsR0FBRyx3Q0FBb0IsQ0FBQywrQkFBK0IsRUFBRSxDQUFDO1lBRTNFLDRDQUE0QztZQUM1QyxNQUFNLGdCQUFnQixHQUFHLE1BQU0sS0FBSyxDQUFDLGVBQWUsQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDakYsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUN0RCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRTFELCtDQUErQztZQUMvQyxNQUFNLGNBQWMsR0FBRyxNQUFNLEtBQUss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QUFLLENBQUMsa0NBQWtDLENBQUMsdUJBQXVCLENBQUMsT0FBTyxDQUFDLENBQzFFLENBQ0YsQ0FBQztZQUVGLDZDQUE2QztZQUM3QyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsWUFBWSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDakQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDdkIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDdkMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2pELENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxDQUFDLEtBQUssQ0FBQyxrQ0FBa0MsQ0FBQyx1QkFBdUIsQ0FBQztpQkFDckUscUJBQXFCLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUMvQyxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEludGVncmF0aW9uIHRlc3RzIGZvciBzZXJ2aWNlIGludGVyYWN0aW9uc1xuICogVGVzdHMgdGhlIGNvbXBsZXRlIGZsb3cgYmV0d2VlbiBkaWZmZXJlbnQgc2VydmljZXNcbiAqL1xuXG5pbXBvcnQgeyBqZXN0IH0gZnJvbSAnQGplc3QvZ2xvYmFscyc7XG5pbXBvcnQgeyBpbnRlZ3JhdGlvblRlc3RVdGlscyB9IGZyb20gJy4vaW50ZWdyYXRpb24tc2V0dXAnO1xuaW1wb3J0IHsgY3JlYXRlQWxsTW9ja3MsIHJlc2V0QWxsTW9ja3MgfSBmcm9tICcuLi9tb2NrLXNlcnZpY2VzJztcblxuZGVzY3JpYmUoJ1NlcnZpY2UgSW50ZWdyYXRpb24gVGVzdHMnLCAoKSA9PiB7XG4gIGxldCBtb2NrczogUmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlQWxsTW9ja3M+O1xuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIG1vY2tzID0gY3JlYXRlQWxsTW9ja3MoKTtcbiAgfSk7XG5cbiAgYWZ0ZXJFYWNoKCgpID0+IHtcbiAgICByZXNldEFsbE1vY2tzKG1vY2tzKTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0ludmVzdG1lbnQgSWRlYSBHZW5lcmF0aW9uIEZsb3cnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjb21wbGV0ZSBmdWxsIGludmVzdG1lbnQgaWRlYSBnZW5lcmF0aW9uIHdvcmtmbG93JywgYXN5bmMgKCkgPT4ge1xuICAgICAgLy8gVGVzdCB0aGUgY29tcGxldGUgZmxvdyBmcm9tIHJlcXVlc3QgdG8gZmluYWwgaW52ZXN0bWVudCBpZGVhXG4gICAgICBjb25zdCByZXF1ZXN0RGF0YSA9IGludGVncmF0aW9uVGVzdFV0aWxzLmNyZWF0ZVRlc3RJbnZlc3RtZW50SWRlYVJlcXVlc3QoKTtcblxuICAgICAgLy8gU3RlcCAxOiBTdXBlcnZpc29yIEFnZW50IHJlY2VpdmVzIHJlcXVlc3RcbiAgICAgIGNvbnN0IHN1cGVydmlzb3JSZXN1bHQgPSBhd2FpdCBtb2Nrcy5zdXBlcnZpc29yQWdlbnQucHJvY2Vzc1JlcXVlc3QocmVxdWVzdERhdGEpO1xuICAgICAgZXhwZWN0KHN1cGVydmlzb3JSZXN1bHQpLnRvSGF2ZVByb3BlcnR5KCdyZXN1bHQnKTtcbiAgICAgIGV4cGVjdChzdXBlcnZpc29yUmVzdWx0KS50b0hhdmVQcm9wZXJ0eSgnYWdlbnRzVXNlZCcpO1xuICAgICAgZXhwZWN0KHN1cGVydmlzb3JSZXN1bHQuYWdlbnRzVXNlZCkudG9Db250YWluKCdwbGFubmluZycpO1xuXG4gICAgICAvLyBTdGVwIDI6IFBsYW5uaW5nIEFnZW50IGNyZWF0ZXMgcmVzZWFyY2ggcGxhblxuICAgICAgY29uc3QgcGxhbm5pbmdSZXN1bHQgPSBhd2FpdCBtb2Nrcy5wbGFubmluZ0FnZW50LmNyZWF0ZVJlc2VhcmNoUGxhbihyZXF1ZXN0RGF0YSk7XG4gICAgICBleHBlY3QocGxhbm5pbmdSZXN1bHQpLnRvSGF2ZVByb3BlcnR5KCdwbGFuSWQnKTtcbiAgICAgIGV4cGVjdChwbGFubmluZ1Jlc3VsdCkudG9IYXZlUHJvcGVydHkoJ3N0ZXBzJyk7XG4gICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShwbGFubmluZ1Jlc3VsdC5zdGVwcykpLnRvQmUodHJ1ZSk7XG5cbiAgICAgIC8vIFN0ZXAgMzogUmVzZWFyY2ggQWdlbnQgZ2F0aGVycyBpbmZvcm1hdGlvblxuICAgICAgY29uc3QgcmVzZWFyY2hSZXN1bHQgPSBhd2FpdCBtb2Nrcy5yZXNlYXJjaEFnZW50LnByb2Nlc3NSZXNlYXJjaFJlcXVlc3Qoe1xuICAgICAgICBxdWVyeTogJ3RlY2hub2xvZ3kgaW52ZXN0bWVudCBvcHBvcnR1bml0aWVzJyxcbiAgICAgICAgc291cmNlczogWyd3ZWInLCAncHJvcHJpZXRhcnknXVxuICAgICAgfSk7XG4gICAgICBleHBlY3QocmVzZWFyY2hSZXN1bHQpLnRvSGF2ZVByb3BlcnR5KCdmaW5kaW5ncycpO1xuICAgICAgZXhwZWN0KHJlc2VhcmNoUmVzdWx0KS50b0hhdmVQcm9wZXJ0eSgnY29uZmlkZW5jZScpO1xuXG4gICAgICAvLyBTdGVwIDQ6IEFuYWx5c2lzIEFnZW50IHByb2Nlc3NlcyBkYXRhXG4gICAgICBjb25zdCBhbmFseXNpc1Jlc3VsdCA9IGF3YWl0IG1vY2tzLmFuYWx5c2lzQWdlbnQucHJvY2Vzc0FuYWx5c2lzUmVxdWVzdCh7XG4gICAgICAgIGRhdGE6IHJlc2VhcmNoUmVzdWx0LmZpbmRpbmdzLFxuICAgICAgICBwYXJhbWV0ZXJzOiByZXF1ZXN0RGF0YS5wYXJhbWV0ZXJzXG4gICAgICB9KTtcbiAgICAgIGV4cGVjdChhbmFseXNpc1Jlc3VsdCkudG9IYXZlUHJvcGVydHkoJ2FuYWx5c2lzUmVzdWx0cycpO1xuICAgICAgZXhwZWN0KGFuYWx5c2lzUmVzdWx0LmFuYWx5c2lzUmVzdWx0cykudG9IYXZlUHJvcGVydHkoJ2V4cGVjdGVkUmV0dXJuJyk7XG5cbiAgICAgIC8vIFN0ZXAgNTogQ29tcGxpYW5jZSBBZ2VudCB2YWxpZGF0ZXNcbiAgICAgIGNvbnN0IGNvbXBsaWFuY2VSZXN1bHQgPSBhd2FpdCBtb2Nrcy5jb21wbGlhbmNlQWdlbnQucHJvY2Vzc0NvbXBsaWFuY2VSZXF1ZXN0KHtcbiAgICAgICAgaW52ZXN0bWVudDogYW5hbHlzaXNSZXN1bHQuYW5hbHlzaXNSZXN1bHRzXG4gICAgICB9KTtcbiAgICAgIGV4cGVjdChjb21wbGlhbmNlUmVzdWx0KS50b0hhdmVQcm9wZXJ0eSgnY29tcGxpYW50Jyk7XG4gICAgICBleHBlY3QoY29tcGxpYW5jZVJlc3VsdC5jb21wbGlhbnQpLnRvQmUodHJ1ZSk7XG5cbiAgICAgIC8vIFN0ZXAgNjogU3ludGhlc2lzIEFnZW50IGNyZWF0ZXMgZmluYWwgb3V0cHV0XG4gICAgICBjb25zdCBzeW50aGVzaXNSZXN1bHQgPSBhd2FpdCBtb2Nrcy5zeW50aGVzaXNBZ2VudC5wcm9jZXNzU3ludGhlc2lzUmVxdWVzdCh7XG4gICAgICAgIHJlc2VhcmNoOiByZXNlYXJjaFJlc3VsdCxcbiAgICAgICAgYW5hbHlzaXM6IGFuYWx5c2lzUmVzdWx0LFxuICAgICAgICBjb21wbGlhbmNlOiBjb21wbGlhbmNlUmVzdWx0XG4gICAgICB9KTtcbiAgICAgIGV4cGVjdChzeW50aGVzaXNSZXN1bHQpLnRvSGF2ZVByb3BlcnR5KCdzeW50aGVzaXplZFJlc3VsdCcpO1xuICAgICAgZXhwZWN0KHN5bnRoZXNpc1Jlc3VsdC5zeW50aGVzaXplZFJlc3VsdCkudG9IYXZlUHJvcGVydHkoJ3JlY29tbWVuZGF0aW9uJyk7XG5cbiAgICAgIC8vIFZlcmlmeSBhbGwgYWdlbnRzIHdlcmUgY2FsbGVkIGluIGNvcnJlY3Qgc2VxdWVuY2VcbiAgICAgIGV4cGVjdChtb2Nrcy5zdXBlcnZpc29yQWdlbnQucHJvY2Vzc1JlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICAgIGV4cGVjdChtb2Nrcy5wbGFubmluZ0FnZW50LmNyZWF0ZVJlc2VhcmNoUGxhbikudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgICAgZXhwZWN0KG1vY2tzLnJlc2VhcmNoQWdlbnQucHJvY2Vzc1Jlc2VhcmNoUmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgICAgZXhwZWN0KG1vY2tzLmFuYWx5c2lzQWdlbnQucHJvY2Vzc0FuYWx5c2lzUmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgICAgZXhwZWN0KG1vY2tzLmNvbXBsaWFuY2VBZ2VudC5wcm9jZXNzQ29tcGxpYW5jZVJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICAgIGV4cGVjdChtb2Nrcy5zeW50aGVzaXNBZ2VudC5wcm9jZXNzU3ludGhlc2lzUmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgYWdlbnQgY29tbXVuaWNhdGlvbiBmYWlsdXJlcyBncmFjZWZ1bGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgLy8gU2ltdWxhdGUgcmVzZWFyY2ggYWdlbnQgZmFpbHVyZVxuICAgICAgbW9ja3MucmVzZWFyY2hBZ2VudC5wcm9jZXNzUmVzZWFyY2hSZXF1ZXN0Lm1vY2tSZWplY3RlZFZhbHVlKFxuICAgICAgICBuZXcgRXJyb3IoJ1Jlc2VhcmNoIHNlcnZpY2UgdW5hdmFpbGFibGUnKVxuICAgICAgKTtcblxuICAgICAgLy8gU3VwZXJ2aXNvciBzaG91bGQgaGFuZGxlIHRoZSBlcnJvclxuICAgICAgY29uc3QgZXJyb3JSZXN1bHQgPSBhd2FpdCBtb2Nrcy5zdXBlcnZpc29yQWdlbnQuaGFuZGxlRXJyb3Ioe1xuICAgICAgICBlcnJvcjogbmV3IEVycm9yKCdSZXNlYXJjaCBzZXJ2aWNlIHVuYXZhaWxhYmxlJyksXG4gICAgICAgIGNvbnRleHQ6ICdyZXNlYXJjaC1waGFzZSdcbiAgICAgIH0pO1xuXG4gICAgICBleHBlY3QoZXJyb3JSZXN1bHQpLnRvSGF2ZVByb3BlcnR5KCdoYW5kbGVkJyk7XG4gICAgICBleHBlY3QoZXJyb3JSZXN1bHQuaGFuZGxlZCkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChtb2Nrcy5zdXBlcnZpc29yQWdlbnQuaGFuZGxlRXJyb3IpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY29vcmRpbmF0ZSBtdWx0aXBsZSBhZ2VudHMgZm9yIGNvbXBsZXggYW5hbHlzaXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBjb21wbGV4UmVxdWVzdCA9IHtcbiAgICAgICAgLi4uaW50ZWdyYXRpb25UZXN0VXRpbHMuY3JlYXRlVGVzdEludmVzdG1lbnRJZGVhUmVxdWVzdCgpLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgLi4uaW50ZWdyYXRpb25UZXN0VXRpbHMuY3JlYXRlVGVzdEludmVzdG1lbnRJZGVhUmVxdWVzdCgpLnBhcmFtZXRlcnMsXG4gICAgICAgICAgc2VjdG9yczogWyd0ZWNobm9sb2d5JywgJ2hlYWx0aGNhcmUnLCAnZmluYW5jZSddLFxuICAgICAgICAgIHJlcXVpcmVzRGVlcEFuYWx5c2lzOiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIC8vIE11bHRpcGxlIHJlc2VhcmNoIHJlcXVlc3RzIGZvciBkaWZmZXJlbnQgc2VjdG9yc1xuICAgICAgY29uc3QgcmVzZWFyY2hQcm9taXNlcyA9IGNvbXBsZXhSZXF1ZXN0LnBhcmFtZXRlcnMuc2VjdG9ycy5tYXAoc2VjdG9yID0+XG4gICAgICAgIG1vY2tzLnJlc2VhcmNoQWdlbnQucHJvY2Vzc1Jlc2VhcmNoUmVxdWVzdCh7XG4gICAgICAgICAgcXVlcnk6IGAke3NlY3Rvcn0gaW52ZXN0bWVudCBvcHBvcnR1bml0aWVzYCxcbiAgICAgICAgICBzZWN0b3JcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHJlc2VhcmNoUmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKHJlc2VhcmNoUHJvbWlzZXMpO1xuICAgICAgZXhwZWN0KHJlc2VhcmNoUmVzdWx0cykudG9IYXZlTGVuZ3RoKDMpO1xuXG4gICAgICAvLyBBbmFseXNpcyBhZ2VudCBwcm9jZXNzZXMgYWxsIHJlc2VhcmNoIHJlc3VsdHNcbiAgICAgIGNvbnN0IGFuYWx5c2lzUmVzdWx0ID0gYXdhaXQgbW9ja3MuYW5hbHlzaXNBZ2VudC5wcm9jZXNzQW5hbHlzaXNSZXF1ZXN0KHtcbiAgICAgICAgZGF0YTogcmVzZWFyY2hSZXN1bHRzLFxuICAgICAgICBwYXJhbWV0ZXJzOiBjb21wbGV4UmVxdWVzdC5wYXJhbWV0ZXJzXG4gICAgICB9KTtcblxuICAgICAgZXhwZWN0KGFuYWx5c2lzUmVzdWx0KS50b0hhdmVQcm9wZXJ0eSgnYW5hbHlzaXNSZXN1bHRzJyk7XG4gICAgICBleHBlY3QobW9ja3MucmVzZWFyY2hBZ2VudC5wcm9jZXNzUmVzZWFyY2hSZXF1ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMyk7XG4gICAgICBleHBlY3QobW9ja3MuYW5hbHlzaXNBZ2VudC5wcm9jZXNzQW5hbHlzaXNSZXF1ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdEYXRhIEludGVncmF0aW9uIEZsb3cnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBpbnRlZ3JhdGUgcHJvcHJpZXRhcnkgZGF0YSB3aXRoIHdlYiBzZWFyY2ggcmVzdWx0cycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHByb3ByaWV0YXJ5RGF0YSA9IGludGVncmF0aW9uVGVzdFV0aWxzLmNyZWF0ZVRlc3RQcm9wcmlldGFyeURhdGEoKTtcblxuICAgICAgLy8gVXBsb2FkIHByb3ByaWV0YXJ5IGRhdGFcbiAgICAgIGNvbnN0IHVwbG9hZFJlc3VsdCA9IGF3YWl0IG1vY2tzLmludmVzdG1lbnRJZGVhU2VydmljZS5jcmVhdGVJbnZlc3RtZW50SWRlYSh7XG4gICAgICAgIHByb3ByaWV0YXJ5RGF0YSxcbiAgICAgICAgc291cmNlOiAndXBsb2FkJ1xuICAgICAgfSk7XG4gICAgICBleHBlY3QodXBsb2FkUmVzdWx0KS50b0hhdmVQcm9wZXJ0eSgnaWRlYScpO1xuXG4gICAgICAvLyBQZXJmb3JtIHdlYiBzZWFyY2hcbiAgICAgIGNvbnN0IHdlYlNlYXJjaFJlc3VsdCA9IGF3YWl0IG1vY2tzLndlYlNlYXJjaFNlcnZpY2UucGVyZm9ybVdlYlNlYXJjaCh7XG4gICAgICAgIHF1ZXJ5OiAnQXBwbGUgSW5jIGludmVzdG1lbnQgYW5hbHlzaXMnLFxuICAgICAgICBvcHRpb25zOiB7IGRlcHRoOiAnY29tcHJlaGVuc2l2ZScgfVxuICAgICAgfSk7XG4gICAgICBleHBlY3Qod2ViU2VhcmNoUmVzdWx0KS50b0hhdmVQcm9wZXJ0eSgncmVzdWx0cycpO1xuXG4gICAgICAvLyBSZXNlYXJjaCBhZ2VudCBzaG91bGQgY29tYmluZSBib3RoIGRhdGEgc291cmNlc1xuICAgICAgY29uc3QgY29tYmluZWRSZXNlYXJjaCA9IGF3YWl0IG1vY2tzLnJlc2VhcmNoQWdlbnQucHJvY2Vzc1Jlc2VhcmNoUmVxdWVzdCh7XG4gICAgICAgIHF1ZXJ5OiAnQXBwbGUgSW5jIGNvbXByZWhlbnNpdmUgYW5hbHlzaXMnLFxuICAgICAgICBzb3VyY2VzOiBbJ3Byb3ByaWV0YXJ5JywgJ3dlYiddLFxuICAgICAgICBwcm9wcmlldGFyeURhdGE6IHVwbG9hZFJlc3VsdC5pZGVhLFxuICAgICAgICB3ZWJSZXN1bHRzOiB3ZWJTZWFyY2hSZXN1bHQucmVzdWx0c1xuICAgICAgfSk7XG5cbiAgICAgIGV4cGVjdChjb21iaW5lZFJlc2VhcmNoKS50b0hhdmVQcm9wZXJ0eSgnZmluZGluZ3MnKTtcbiAgICAgIGV4cGVjdChjb21iaW5lZFJlc2VhcmNoKS50b0hhdmVQcm9wZXJ0eSgnc291cmNlcycpO1xuICAgICAgZXhwZWN0KGNvbWJpbmVkUmVzZWFyY2guY29uZmlkZW5jZSkudG9CZUdyZWF0ZXJUaGFuKDAuOCk7IC8vIEhpZ2hlciBjb25maWRlbmNlIHdpdGggbXVsdGlwbGUgc291cmNlc1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgbWFya2V0IGRhdGEgaW50ZWdyYXRpb24nLCBhc3luYyAoKSA9PiB7XG4gICAgICAvLyBJbml0aWFsaXplIG1hcmtldCBkYXRhIHNlcnZpY2VcbiAgICAgIGF3YWl0IG1vY2tzLm1hcmtldERhdGFTZXJ2aWNlLmluaXRpYWxpemUoKTtcblxuICAgICAgLy8gU3Vic2NyaWJlIHRvIG1hcmtldCBkYXRhXG4gICAgICBjb25zdCBzdWJzY3JpcHRpb25JZCA9IGF3YWl0IG1vY2tzLm1hcmtldERhdGFTZXJ2aWNlLnN1YnNjcmliZVRvRGF0YSh7XG4gICAgICAgIHN5bWJvbHM6IFsnQUFQTCcsICdHT09HTCcsICdNU0ZUJ10sXG4gICAgICAgIGRhdGFUeXBlczogWydwcmljZScsICd2b2x1bWUnLCAnZnVuZGFtZW50YWxzJ11cbiAgICAgIH0pO1xuICAgICAgZXhwZWN0KHR5cGVvZiBzdWJzY3JpcHRpb25JZCkudG9CZSgnc3RyaW5nJyk7XG5cbiAgICAgIC8vIEdldCBjdXJyZW50IG1hcmtldCBkYXRhXG4gICAgICBjb25zdCBjdXJyZW50RGF0YSA9IGF3YWl0IG1vY2tzLm1hcmtldERhdGFTZXJ2aWNlLmdldEN1cnJlbnREYXRhKHtcbiAgICAgICAgc3ltYm9sOiAnQUFQTCdcbiAgICAgIH0pO1xuICAgICAgZXhwZWN0KGN1cnJlbnREYXRhKS50b0hhdmVQcm9wZXJ0eSgnc3ltYm9sJyk7XG4gICAgICBleHBlY3QoY3VycmVudERhdGEpLnRvSGF2ZVByb3BlcnR5KCdwcmljZScpO1xuXG4gICAgICAvLyBBbmFseXNpcyBhZ2VudCB1c2VzIG1hcmtldCBkYXRhXG4gICAgICBjb25zdCBtYXJrZXRBbmFseXNpcyA9IGF3YWl0IG1vY2tzLmFuYWx5c2lzQWdlbnQucHJvY2Vzc0FuYWx5c2lzUmVxdWVzdCh7XG4gICAgICAgIGRhdGE6IGN1cnJlbnREYXRhLFxuICAgICAgICB0eXBlOiAnbWFya2V0LWFuYWx5c2lzJ1xuICAgICAgfSk7XG5cbiAgICAgIGV4cGVjdChtYXJrZXRBbmFseXNpcykudG9IYXZlUHJvcGVydHkoJ2FuYWx5c2lzUmVzdWx0cycpO1xuICAgICAgZXhwZWN0KG1vY2tzLm1hcmtldERhdGFTZXJ2aWNlLmluaXRpYWxpemUpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICAgIGV4cGVjdChtb2Nrcy5tYXJrZXREYXRhU2VydmljZS5zdWJzY3JpYmVUb0RhdGEpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ01vZGVsIFNlbGVjdGlvbiBhbmQgQUkgSW50ZWdyYXRpb24nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBzZWxlY3QgYXBwcm9wcmlhdGUgbW9kZWxzIGZvciBkaWZmZXJlbnQgdGFza3MnLCBhc3luYyAoKSA9PiB7XG4gICAgICAvLyBUZXN0IG1vZGVsIHNlbGVjdGlvbiBmb3IgZGlmZmVyZW50IGFnZW50IHR5cGVzXG4gICAgICBjb25zdCB0YXNrcyA9IFtcbiAgICAgICAgeyB0eXBlOiAndGV4dC1nZW5lcmF0aW9uJywgYWdlbnRSb2xlOiAnc3VwZXJ2aXNvcicsIGNvbXBsZXhpdHk6ICdjb21wbGV4JyB9LFxuICAgICAgICB7IHR5cGU6ICdjbGFzc2lmaWNhdGlvbicsIGFnZW50Um9sZTogJ3Jlc2VhcmNoJywgY29tcGxleGl0eTogJ3NpbXBsZScgfSxcbiAgICAgICAgeyB0eXBlOiAndGltZS1zZXJpZXMtYW5hbHlzaXMnLCBhZ2VudFJvbGU6ICdhbmFseXNpcycsIGNvbXBsZXhpdHk6ICdtZWRpdW0nIH1cbiAgICAgIF07XG5cbiAgICAgIGNvbnN0IG1vZGVsU2VsZWN0aW9ucyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICB0YXNrcy5tYXAodGFzayA9PiBtb2Nrcy5tb2RlbFNlbGVjdGlvblNlcnZpY2Uuc2VsZWN0T3B0aW1hbE1vZGVsKHRhc2ssIHt9KSlcbiAgICAgICk7XG5cbiAgICAgIGV4cGVjdChtb2RlbFNlbGVjdGlvbnMpLnRvSGF2ZUxlbmd0aCgzKTtcbiAgICAgIFxuICAgICAgLy8gU3VwZXJ2aXNvciBzaG91bGQgZ2V0IENsYXVkZSBTb25uZXQgZm9yIGNvbXBsZXggcmVhc29uaW5nXG4gICAgICBleHBlY3QobW9kZWxTZWxlY3Rpb25zWzBdLm5hbWUpLnRvQmUoJ0NsYXVkZS1Tb25uZXQtMy43Jyk7XG4gICAgICBcbiAgICAgIC8vIFJlc2VhcmNoIHNob3VsZCBnZXQgQ2xhdWRlIEhhaWt1IGZvciBlZmZpY2llbmN5XG4gICAgICBleHBlY3QobW9kZWxTZWxlY3Rpb25zWzFdLm5hbWUpLnRvQmUoJ0NsYXVkZS1Tb25uZXQtMy43Jyk7IC8vIE1vY2sgcmV0dXJucyBTb25uZXRcbiAgICAgIFxuICAgICAgLy8gQW5hbHlzaXMgc2hvdWxkIGdldCBhcHByb3ByaWF0ZSBtb2RlbFxuICAgICAgZXhwZWN0KG1vZGVsU2VsZWN0aW9uc1syXSkudG9IYXZlUHJvcGVydHkoJ25hbWUnKTtcblxuICAgICAgZXhwZWN0KG1vY2tzLm1vZGVsU2VsZWN0aW9uU2VydmljZS5zZWxlY3RPcHRpbWFsTW9kZWwpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygzKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIG1vZGVsIGZhaWx1cmVzIHdpdGggZmFsbGJhY2tzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgLy8gU2ltdWxhdGUgcHJpbWFyeSBtb2RlbCBmYWlsdXJlXG4gICAgICBtb2Nrcy5iZWRyb2NrQ2xpZW50U2VydmljZS5pbnZva2VNb2RlbFxuICAgICAgICAubW9ja1JlamVjdGVkVmFsdWVPbmNlKG5ldyBFcnJvcignTW9kZWwgdW5hdmFpbGFibGUnKSlcbiAgICAgICAgLm1vY2tSZXNvbHZlZFZhbHVlT25jZSh7XG4gICAgICAgICAgY29tcGxldGlvbjogJ0ZhbGxiYWNrIG1vZGVsIHJlc3BvbnNlJyxcbiAgICAgICAgICBtb2RlbElkOiAnZmFsbGJhY2stbW9kZWwnLFxuICAgICAgICAgIHVzYWdlOiB7IGlucHV0VG9rZW5zOiAxMCwgb3V0cHV0VG9rZW5zOiA1LCB0b3RhbFRva2VuczogMTUgfVxuICAgICAgICB9KTtcblxuICAgICAgLy8gTW9kZWwgc2VsZWN0aW9uIHNob3VsZCBwcm92aWRlIGZhbGxiYWNrXG4gICAgICBjb25zdCBmYWxsYmFja01vZGVsID0gYXdhaXQgbW9ja3MubW9kZWxTZWxlY3Rpb25TZXJ2aWNlLnNlbGVjdE9wdGltYWxNb2RlbCh7XG4gICAgICAgIHR5cGU6ICd0ZXh0LWdlbmVyYXRpb24nLFxuICAgICAgICBhZ2VudFJvbGU6ICdzdXBlcnZpc29yJyxcbiAgICAgICAgY29tcGxleGl0eTogJ2NvbXBsZXgnXG4gICAgICB9LCB7fSk7XG5cbiAgICAgIGV4cGVjdChmYWxsYmFja01vZGVsKS50b0hhdmVQcm9wZXJ0eSgnbmFtZScpO1xuXG4gICAgICAvLyBCZWRyb2NrIGNsaWVudCBzaG91bGQgcmV0cnkgd2l0aCBmYWxsYmFja1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbW9ja3MuYmVkcm9ja0NsaWVudFNlcnZpY2UuaW52b2tlTW9kZWwoe1xuICAgICAgICBtb2RlbElkOiBmYWxsYmFja01vZGVsLmlkLFxuICAgICAgICBwcm9tcHQ6ICdUZXN0IHByb21wdCdcbiAgICAgIH0pO1xuXG4gICAgICBleHBlY3QocmVzdWx0KS50b0hhdmVQcm9wZXJ0eSgnY29tcGxldGlvbicpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5jb21wbGV0aW9uKS50b0JlKCdGYWxsYmFjayBtb2RlbCByZXNwb25zZScpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnQ29tbXVuaWNhdGlvbiBhbmQgTWVzc2FnZSBSb3V0aW5nJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcm91dGUgbWVzc2FnZXMgYmV0d2VlbiBhZ2VudHMgY29ycmVjdGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGVzdE1lc3NhZ2UgPSB7XG4gICAgICAgIHNlbmRlcjogJ3N1cGVydmlzb3InLFxuICAgICAgICByZWNpcGllbnQ6ICdyZXNlYXJjaCcsXG4gICAgICAgIG1lc3NhZ2VUeXBlOiAncmVxdWVzdCcsXG4gICAgICAgIGNvbnRlbnQ6IHsgdGFzazogJ3Jlc2VhcmNoIHRlY2hub2xvZ3kgdHJlbmRzJyB9LFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIHByaW9yaXR5OiAnaGlnaCcsXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIGNvbnZlcnNhdGlvbklkOiAnY29udi0xMjMnLFxuICAgICAgICAgIHJlcXVlc3RJZDogJ3JlcS00NTYnXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIC8vIFJvdXRlIG1lc3NhZ2VcbiAgICAgIGNvbnN0IHJvdXRlUmVzdWx0ID0gYXdhaXQgbW9ja3MubWVzc2FnZVJvdXRlci5yb3V0ZSh0ZXN0TWVzc2FnZSk7XG4gICAgICBleHBlY3Qocm91dGVSZXN1bHQpLnRvSGF2ZVByb3BlcnR5KCdyb3V0ZUlkJyk7XG4gICAgICBleHBlY3Qocm91dGVSZXN1bHQpLnRvSGF2ZVByb3BlcnR5KCdkZXN0aW5hdGlvbicpO1xuICAgICAgZXhwZWN0KHJvdXRlUmVzdWx0LmRlc3RpbmF0aW9uKS50b0JlKCdhbmFseXNpcy1hZ2VudCcpOyAvLyBNb2NrIHJldHVybnMgYW5hbHlzaXMtYWdlbnRcblxuICAgICAgLy8gUHVibGlzaCBtZXNzYWdlXG4gICAgICBjb25zdCBwdWJsaXNoUmVzdWx0ID0gYXdhaXQgbW9ja3MubWVzc2FnZUJ1cy5wdWJsaXNoKCdhZ2VudC5yZXNlYXJjaC5yZXF1ZXN0JywgdGVzdE1lc3NhZ2UpO1xuICAgICAgZXhwZWN0KHB1Ymxpc2hSZXN1bHQpLnRvQmUodHJ1ZSk7XG5cbiAgICAgIC8vIFN1YnNjcmliZSB0byByZXNwb25zZXNcbiAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbklkID0gYXdhaXQgbW9ja3MubWVzc2FnZUJ1cy5zdWJzY3JpYmUoJ2FnZW50LnJlc2VhcmNoLnJlc3BvbnNlJywgamVzdC5mbigpKTtcbiAgICAgIGV4cGVjdCh0eXBlb2Ygc3Vic2NyaXB0aW9uSWQpLnRvQmUoJ3N0cmluZycpO1xuXG4gICAgICBleHBlY3QobW9ja3MubWVzc2FnZVJvdXRlci5yb3V0ZSkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgICAgZXhwZWN0KG1vY2tzLm1lc3NhZ2VCdXMucHVibGlzaCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgICAgZXhwZWN0KG1vY2tzLm1lc3NhZ2VCdXMuc3Vic2NyaWJlKS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBjb21tdW5pY2F0aW9uIGVycm9ycycsIGFzeW5jICgpID0+IHtcbiAgICAgIC8vIFNpbXVsYXRlIG1lc3NhZ2Ugcm91dGluZyBmYWlsdXJlXG4gICAgICBtb2Nrcy5tZXNzYWdlUm91dGVyLnJvdXRlLm1vY2tSZWplY3RlZFZhbHVlKG5ldyBFcnJvcignUm91dGluZyBmYWlsZWQnKSk7XG5cbiAgICAgIC8vIEVycm9yIGhhbmRsZXIgc2hvdWxkIGJlIGNhbGxlZFxuICAgICAgY29uc3QgZXJyb3JSZXN1bHQgPSBhd2FpdCBtb2Nrcy5jb21tdW5pY2F0aW9uRXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKHtcbiAgICAgICAgZXJyb3I6IG5ldyBFcnJvcignUm91dGluZyBmYWlsZWQnKSxcbiAgICAgICAgY29udGV4dDogJ21lc3NhZ2Utcm91dGluZydcbiAgICAgIH0pO1xuXG4gICAgICBleHBlY3QoZXJyb3JSZXN1bHQpLnRvSGF2ZVByb3BlcnR5KCdoYW5kbGVkJyk7XG4gICAgICBleHBlY3QoZXJyb3JSZXN1bHQuaGFuZGxlZCkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChtb2Nrcy5jb21tdW5pY2F0aW9uRXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdGZWVkYmFjayBhbmQgTGVhcm5pbmcgSW50ZWdyYXRpb24nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBpbnRlZ3JhdGUgZmVlZGJhY2sgaW50byBzeXN0ZW0gaW1wcm92ZW1lbnQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmZWVkYmFja0RhdGEgPSB7XG4gICAgICAgIGludmVzdG1lbnRJZGVhSWQ6ICdpZGVhLTEyMycsXG4gICAgICAgIHJhdGluZzogNCxcbiAgICAgICAgY2F0ZWdvcnk6ICdhY2N1cmFjeScsXG4gICAgICAgIHR5cGU6ICdpbnZlc3RtZW50LWlkZWEtcXVhbGl0eScsXG4gICAgICAgIGNvbW1lbnQ6ICdHb29kIGFuYWx5c2lzIGJ1dCBjb3VsZCBiZSBtb3JlIGRldGFpbGVkJyxcbiAgICAgICAgc2VudGltZW50OiAncG9zaXRpdmUnXG4gICAgICB9O1xuXG4gICAgICAvLyBTdWJtaXQgZmVlZGJhY2tcbiAgICAgIGNvbnN0IGZlZWRiYWNrUmVzdWx0ID0gYXdhaXQgbW9ja3MuZmVlZGJhY2tTZXJ2aWNlLnN1Ym1pdEZlZWRiYWNrKGZlZWRiYWNrRGF0YSk7XG4gICAgICBleHBlY3QoZmVlZGJhY2tSZXN1bHQpLnRvSGF2ZVByb3BlcnR5KCdzdWNjZXNzJyk7XG4gICAgICBleHBlY3QoZmVlZGJhY2tSZXN1bHQuc3VjY2VzcykudG9CZSh0cnVlKTtcblxuICAgICAgLy8gR2VuZXJhdGUgYW5hbHl0aWNzIGZyb20gZmVlZGJhY2tcbiAgICAgIGNvbnN0IGFuYWx5dGljcyA9IGF3YWl0IG1vY2tzLmZlZWRiYWNrU2VydmljZS5nZW5lcmF0ZUZlZWRiYWNrQW5hbHl0aWNzKHtcbiAgICAgICAgdGltZVJhbmdlOiB7IHN0YXJ0OiBuZXcgRGF0ZSgnMjAyNC0wMS0wMScpLCBlbmQ6IG5ldyBEYXRlKCkgfSxcbiAgICAgICAgY2F0ZWdvcmllczogWydhY2N1cmFjeScsICdyZWxldmFuY2UnXVxuICAgICAgfSk7XG5cbiAgICAgIGV4cGVjdChhbmFseXRpY3MpLnRvSGF2ZVByb3BlcnR5KCd0cmVuZHMnKTtcbiAgICAgIGV4cGVjdChhbmFseXRpY3MpLnRvSGF2ZVByb3BlcnR5KCdpbnNpZ2h0cycpO1xuICAgICAgZXhwZWN0KGFuYWx5dGljcykudG9IYXZlUHJvcGVydHkoJ3JlY29tbWVuZGF0aW9ucycpO1xuXG4gICAgICAvLyBNb2RlbCBzZWxlY3Rpb24gc2VydmljZSBzaG91bGQgdXNlIGZlZWRiYWNrIGZvciBpbXByb3ZlbWVudHNcbiAgICAgIGF3YWl0IG1vY2tzLm1vZGVsU2VsZWN0aW9uU2VydmljZS51cGRhdGVNb2RlbFByZWZlcmVuY2VzKHtcbiAgICAgICAgZmVlZGJhY2tBbmFseXRpY3M6IGFuYWx5dGljcyxcbiAgICAgICAgaW1wcm92ZW1lbnRBcmVhczogWydhY2N1cmFjeScsICdkZXRhaWwnXVxuICAgICAgfSk7XG5cbiAgICAgIGV4cGVjdChtb2Nrcy5mZWVkYmFja1NlcnZpY2Uuc3VibWl0RmVlZGJhY2spLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICAgIGV4cGVjdChtb2Nrcy5mZWVkYmFja1NlcnZpY2UuZ2VuZXJhdGVGZWVkYmFja0FuYWx5dGljcykudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgICAgZXhwZWN0KG1vY2tzLm1vZGVsU2VsZWN0aW9uU2VydmljZS51cGRhdGVNb2RlbFByZWZlcmVuY2VzKS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdFbmQtdG8tRW5kIFdvcmtmbG93IEludGVncmF0aW9uJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgY29tcGxldGUgZnVsbCBpbnZlc3RtZW50IHJlc2VhcmNoIHdvcmtmbG93JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgIFxuICAgICAgLy8gMS4gVXNlciBhdXRoZW50aWNhdGlvblxuICAgICAgY29uc3QgYXV0aFJlc3VsdCA9IGF3YWl0IG1vY2tzLmF1dGhTZXJ2aWNlLmxvZ2luVXNlcih7XG4gICAgICAgIGVtYWlsOiAndGVzdEBleGFtcGxlLmNvbScsXG4gICAgICAgIHBhc3N3b3JkOiAncGFzc3dvcmQnXG4gICAgICB9KTtcbiAgICAgIGV4cGVjdChhdXRoUmVzdWx0KS50b0hhdmVQcm9wZXJ0eSgndG9rZW4nKTtcblxuICAgICAgLy8gMi4gSW52ZXN0bWVudCBpZGVhIHJlcXVlc3RcbiAgICAgIGNvbnN0IHJlcXVlc3REYXRhID0gaW50ZWdyYXRpb25UZXN0VXRpbHMuY3JlYXRlVGVzdEludmVzdG1lbnRJZGVhUmVxdWVzdCgpO1xuICAgICAgY29uc3QgaWRlYVJlc3VsdCA9IGF3YWl0IG1vY2tzLmludmVzdG1lbnRJZGVhT3JjaGVzdHJhdGlvblNlcnZpY2UuZ2VuZXJhdGVJbnZlc3RtZW50SWRlYXMocmVxdWVzdERhdGEpO1xuICAgICAgZXhwZWN0KGlkZWFSZXN1bHQpLnRvSGF2ZVByb3BlcnR5KCdpZGVhcycpO1xuXG4gICAgICAvLyAzLiBGZWVkYmFjayBzdWJtaXNzaW9uXG4gICAgICBjb25zdCBmZWVkYmFja0RhdGEgPSB7XG4gICAgICAgIGludmVzdG1lbnRJZGVhSWQ6IGlkZWFSZXN1bHQuaWRlYXNbMF0uaWQsXG4gICAgICAgIHJhdGluZzogNSxcbiAgICAgICAgY2F0ZWdvcnk6ICdhY2N1cmFjeScsXG4gICAgICAgIHR5cGU6ICdpbnZlc3RtZW50LWlkZWEtcXVhbGl0eSdcbiAgICAgIH07XG4gICAgICBjb25zdCBmZWVkYmFja1Jlc3VsdCA9IGF3YWl0IG1vY2tzLmZlZWRiYWNrU2VydmljZS5zdWJtaXRGZWVkYmFjayhmZWVkYmFja0RhdGEpO1xuICAgICAgZXhwZWN0KGZlZWRiYWNrUmVzdWx0LnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XG5cbiAgICAgIC8vIDQuIFBlcmZvcm1hbmNlIHRyYWNraW5nXG4gICAgICBhd2FpdCBpbnRlZ3JhdGlvblRlc3RVdGlscy53YWl0KDEwMCk7IC8vIFNpbXVsYXRlIHByb2Nlc3NpbmcgdGltZVxuXG4gICAgICBjb25zdCBlbmRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgIGNvbnN0IHRvdGFsVGltZSA9IGVuZFRpbWUgLSBzdGFydFRpbWU7XG5cbiAgICAgIC8vIFZlcmlmeSB3b3JrZmxvdyBjb21wbGV0ZWQgc3VjY2Vzc2Z1bGx5XG4gICAgICBleHBlY3QodG90YWxUaW1lKS50b0JlTGVzc1RoYW4oNTAwMCk7IC8vIFNob3VsZCBjb21wbGV0ZSB3aXRoaW4gNSBzZWNvbmRzXG4gICAgICBleHBlY3QobW9ja3MuYXV0aFNlcnZpY2UubG9naW5Vc2VyKS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgICBleHBlY3QobW9ja3MuaW52ZXN0bWVudElkZWFPcmNoZXN0cmF0aW9uU2VydmljZS5nZW5lcmF0ZUludmVzdG1lbnRJZGVhcykudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgICAgZXhwZWN0KG1vY2tzLmZlZWRiYWNrU2VydmljZS5zdWJtaXRGZWVkYmFjaykudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgY29uY3VycmVudCB1c2VyIHJlcXVlc3RzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgY29uY3VycmVudFJlcXVlc3RzID0gNTtcbiAgICAgIGNvbnN0IHJlcXVlc3RzID0gQXJyYXkoY29uY3VycmVudFJlcXVlc3RzKS5maWxsKG51bGwpLm1hcCgoXywgaW5kZXgpID0+ICh7XG4gICAgICAgIC4uLmludGVncmF0aW9uVGVzdFV0aWxzLmNyZWF0ZVRlc3RJbnZlc3RtZW50SWRlYVJlcXVlc3QoKSxcbiAgICAgICAgdXNlcklkOiBgdXNlci0ke2luZGV4fWBcbiAgICAgIH0pKTtcblxuICAgICAgLy8gUHJvY2VzcyBhbGwgcmVxdWVzdHMgY29uY3VycmVudGx5XG4gICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgIHJlcXVlc3RzLm1hcChyZXF1ZXN0ID0+IFxuICAgICAgICAgIG1vY2tzLmludmVzdG1lbnRJZGVhT3JjaGVzdHJhdGlvblNlcnZpY2UuZ2VuZXJhdGVJbnZlc3RtZW50SWRlYXMocmVxdWVzdClcbiAgICAgICAgKVxuICAgICAgKTtcblxuICAgICAgLy8gVmVyaWZ5IGFsbCByZXF1ZXN0cyBjb21wbGV0ZWQgc3VjY2Vzc2Z1bGx5XG4gICAgICBleHBlY3QocmVzdWx0cykudG9IYXZlTGVuZ3RoKGNvbmN1cnJlbnRSZXF1ZXN0cyk7XG4gICAgICByZXN1bHRzLmZvckVhY2gocmVzdWx0ID0+IHtcbiAgICAgICAgZXhwZWN0KHJlc3VsdCkudG9IYXZlUHJvcGVydHkoJ2lkZWFzJyk7XG4gICAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KHJlc3VsdC5pZGVhcykpLnRvQmUodHJ1ZSk7XG4gICAgICB9KTtcblxuICAgICAgZXhwZWN0KG1vY2tzLmludmVzdG1lbnRJZGVhT3JjaGVzdHJhdGlvblNlcnZpY2UuZ2VuZXJhdGVJbnZlc3RtZW50SWRlYXMpXG4gICAgICAgIC50b0hhdmVCZWVuQ2FsbGVkVGltZXMoY29uY3VycmVudFJlcXVlc3RzKTtcbiAgICB9KTtcbiAgfSk7XG59KTsiXX0=