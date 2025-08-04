"use strict";
/**
 * Model Selection Service Example
 *
 * This example demonstrates how to use the Model Selection Service
 * to intelligently choose the best AI model for different investment analysis tasks.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.demonstrateModelSelection = void 0;
const model_selection_service_1 = require("../services/ai/model-selection-service");
async function demonstrateModelSelection() {
    console.log('🤖 Investment AI Agent - Model Selection Service Demo\n');
    // Get the model selection service instance
    const modelService = (0, model_selection_service_1.getModelSelectionService)();
    // Example 1: Supervisor Agent Task (Complex reasoning)
    console.log('📋 Example 1: Supervisor Agent Task');
    const supervisorTask = {
        type: 'text-generation',
        complexity: 'complex',
        domain: 'financial',
        priority: 'high',
        agentRole: 'supervisor'
    };
    const supervisorContext = {
        dataSize: 10000,
        timeConstraint: 15000,
        accuracyRequirement: 'high',
        explainabilityRequirement: 'high'
    };
    const supervisorModel = await modelService.selectModel(supervisorTask, supervisorContext);
    console.log(`Selected Model: ${supervisorModel.name}`);
    console.log(`Capabilities: ${supervisorModel.capabilities.join(', ')}`);
    console.log(`Configuration: ${JSON.stringify(supervisorModel.configurationParameters, null, 2)}\n`);
    // Example 2: Research Agent Task (Fast processing)
    console.log('🔍 Example 2: Research Agent Task');
    const researchTask = {
        type: 'classification',
        complexity: 'simple',
        domain: 'general',
        priority: 'medium',
        agentRole: 'research'
    };
    const researchContext = {
        dataSize: 2000,
        timeConstraint: 3000,
        accuracyRequirement: 'medium',
        explainabilityRequirement: 'low'
    };
    const researchModel = await modelService.selectModel(researchTask, researchContext);
    console.log(`Selected Model: ${researchModel.name}`);
    console.log(`Capabilities: ${researchModel.capabilities.join(', ')}`);
    console.log(`Configuration: ${JSON.stringify(researchModel.configurationParameters, null, 2)}\n`);
    // Example 3: Analysis Agent Task (Quantitative analysis)
    console.log('📊 Example 3: Analysis Agent Task');
    const analysisTask = {
        type: 'time-series-analysis',
        complexity: 'complex',
        domain: 'financial',
        priority: 'high',
        agentRole: 'analysis'
    };
    const analysisContext = {
        dataSize: 15000,
        timeConstraint: 20000,
        accuracyRequirement: 'high',
        explainabilityRequirement: 'medium'
    };
    const analysisModel = await modelService.selectModel(analysisTask, analysisContext);
    console.log(`Selected Model: ${analysisModel.name}`);
    console.log(`Capabilities: ${analysisModel.capabilities.join(', ')}`);
    console.log(`Configuration: ${JSON.stringify(analysisModel.configurationParameters, null, 2)}\n`);
    // Example 4: Performance Monitoring
    console.log('📈 Example 4: Performance Monitoring');
    // Simulate recording performance metrics
    const mockMetrics = {
        accuracy: 0.92,
        latency: 2500,
        throughput: 25,
        costPerRequest: 0.012,
        errorRate: 0.02,
        customMetrics: {
            'financial_accuracy': 0.95,
            'explanation_quality': 0.88
        }
    };
    modelService.recordPerformance('claude-sonnet-3.7', supervisorTask, mockMetrics, true);
    const performanceMetrics = await modelService.evaluateModelPerformance('claude-sonnet-3.7', supervisorTask);
    console.log('Claude Sonnet 3.7 Performance:');
    console.log(`- Accuracy: ${(performanceMetrics.accuracy * 100).toFixed(1)}%`);
    console.log(`- Latency: ${performanceMetrics.latency}ms`);
    console.log(`- Error Rate: ${(performanceMetrics.errorRate * 100).toFixed(1)}%`);
    console.log(`- Cost per Request: $${performanceMetrics.costPerRequest.toFixed(4)}\n`);
    // Example 5: Model Health Monitoring
    console.log('🏥 Example 5: Model Health Monitoring');
    const health = modelService.getModelHealth('claude-sonnet-3.7');
    console.log(`Health Status: ${health.status.toUpperCase()}`);
    if (health.issues.length > 0) {
        console.log('Issues:');
        health.issues.forEach(issue => console.log(`- ${issue}`));
    }
    else {
        console.log('No issues detected');
    }
    console.log();
    // Example 6: Fallback Mechanism
    console.log('🔄 Example 6: Fallback Mechanism');
    const fallbackModel = modelService.getFallbackModel('claude-sonnet-3.7', supervisorTask, supervisorContext);
    console.log(`Fallback Model: ${fallbackModel.name}`);
    console.log(`Fallback ID: ${fallbackModel.id}\n`);
    // Example 7: Custom Model Registration
    console.log('🔧 Example 7: Custom Model Registration');
    const customModel = {
        id: 'custom-financial-model',
        name: 'Custom Financial Analysis Model',
        version: '1.0',
        provider: 'InvestmentAI',
        capabilities: ['financial-analysis', 'risk-assessment', 'portfolio-optimization'],
        limitations: ['domain-specific', 'requires-financial-data'],
        configurationSchema: {
            temperature: { type: 'number', default: 0.3 },
            maxTokens: { type: 'number', default: 3072 },
            financialFocus: { type: 'boolean', default: true }
        }
    };
    const registrationResult = await modelService.registerCustomModel(customModel);
    if (registrationResult.success) {
        console.log(`✅ Successfully registered custom model: ${customModel.name}`);
        console.log(`Model ID: ${registrationResult.modelId}`);
    }
    else {
        console.log(`❌ Failed to register custom model: ${registrationResult.error}`);
    }
    console.log();
    // Example 8: Multi-Agent Workflow Simulation
    console.log('🤝 Example 8: Multi-Agent Workflow Simulation');
    console.log('Simulating a complete investment analysis workflow...\n');
    const agents = [
        { role: 'supervisor', task: 'text-generation', complexity: 'complex' },
        { role: 'planning', task: 'text-generation', complexity: 'medium' },
        { role: 'research', task: 'classification', complexity: 'simple' },
        { role: 'analysis', task: 'time-series-analysis', complexity: 'complex' },
        { role: 'compliance', task: 'classification', complexity: 'medium' },
        { role: 'synthesis', task: 'text-generation', complexity: 'complex' }
    ];
    for (const agent of agents) {
        const agentTask = {
            type: agent.task,
            complexity: agent.complexity,
            domain: 'financial',
            priority: 'high',
            agentRole: agent.role
        };
        const agentContext = {
            dataSize: 5000,
            timeConstraint: 10000,
            accuracyRequirement: 'high',
            explainabilityRequirement: 'high'
        };
        const selectedModel = await modelService.selectModel(agentTask, agentContext);
        console.log(`${agent.role.toUpperCase()} Agent → ${selectedModel.name}`);
    }
    console.log('\n✨ Model Selection Service Demo Complete!');
}
exports.demonstrateModelSelection = demonstrateModelSelection;
// Run the demonstration
if (require.main === module) {
    demonstrateModelSelection().catch(console.error);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWwtc2VsZWN0aW9uLWV4YW1wbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhhbXBsZXMvbW9kZWwtc2VsZWN0aW9uLWV4YW1wbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7OztHQUtHOzs7QUFFSCxvRkFHZ0Q7QUFPaEQsS0FBSyxVQUFVLHlCQUF5QjtJQUN0QyxPQUFPLENBQUMsR0FBRyxDQUFDLHlEQUF5RCxDQUFDLENBQUM7SUFFdkUsMkNBQTJDO0lBQzNDLE1BQU0sWUFBWSxHQUFHLElBQUEsa0RBQXdCLEdBQUUsQ0FBQztJQUVoRCx1REFBdUQ7SUFDdkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO0lBQ25ELE1BQU0sY0FBYyxHQUFTO1FBQzNCLElBQUksRUFBRSxpQkFBaUI7UUFDdkIsVUFBVSxFQUFFLFNBQVM7UUFDckIsTUFBTSxFQUFFLFdBQVc7UUFDbkIsUUFBUSxFQUFFLE1BQU07UUFDaEIsU0FBUyxFQUFFLFlBQVk7S0FDeEIsQ0FBQztJQUVGLE1BQU0saUJBQWlCLEdBQWlCO1FBQ3RDLFFBQVEsRUFBRSxLQUFLO1FBQ2YsY0FBYyxFQUFFLEtBQUs7UUFDckIsbUJBQW1CLEVBQUUsTUFBTTtRQUMzQix5QkFBeUIsRUFBRSxNQUFNO0tBQ2xDLENBQUM7SUFFRixNQUFNLGVBQWUsR0FBRyxNQUFNLFlBQVksQ0FBQyxXQUFXLENBQUMsY0FBYyxFQUFFLGlCQUFpQixDQUFDLENBQUM7SUFDMUYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7SUFDdkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsZUFBZSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3hFLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFD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LENBQUM7UUFFRixNQUFNLFlBQVksR0FBaUI7WUFDakMsUUFBUSxFQUFFLElBQUk7WUFDZCxjQUFjLEVBQUUsS0FBSztZQUNyQixtQkFBbUIsRUFBRSxNQUFNO1lBQzNCLHlCQUF5QixFQUFFLE1BQU07U0FDbEMsQ0FBQztRQUVGLE1BQU0sYUFBYSxHQUFHLE1BQU0sWUFBWSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDOUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLFlBQVksYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7S0FDMUU7SUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLDRDQUE0QyxDQUFDLENBQUM7QUFDNUQsQ0FBQztBQU9RLDhEQUF5QjtBQUxsQyx3QkFBd0I7QUFDeEIsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRTtJQUMzQix5QkFBeUIsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDbEQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIE1vZGVsIFNlbGVjdGlvbiBTZXJ2aWNlIEV4YW1wbGVcbiAqIFxuICogVGhpcyBleGFtcGxlIGRlbW9uc3RyYXRlcyBob3cgdG8gdXNlIHRoZSBNb2RlbCBTZWxlY3Rpb24gU2VydmljZVxuICogdG8gaW50ZWxsaWdlbnRseSBjaG9vc2UgdGhlIGJlc3QgQUkgbW9kZWwgZm9yIGRpZmZlcmVudCBpbnZlc3RtZW50IGFuYWx5c2lzIHRhc2tzLlxuICovXG5cbmltcG9ydCB7XG4gIGdldE1vZGVsU2VsZWN0aW9uU2VydmljZSxcbiAgTW9kZWxTZWxlY3Rpb25TZXJ2aWNlSW1wbFxufSBmcm9tICcuLi9zZXJ2aWNlcy9haS9tb2RlbC1zZWxlY3Rpb24tc2VydmljZSc7XG5pbXBvcnQge1xuICBUYXNrLFxuICBNb2RlbENvbnRleHQsXG4gIFBlcmZvcm1hbmNlTWV0cmljc1xufSBmcm9tICcuLi9tb2RlbHMvc2VydmljZXMnO1xuXG5hc3luYyBmdW5jdGlvbiBkZW1vbnN0cmF0ZU1vZGVsU2VsZWN0aW9uKCkge1xuICBjb25zb2xlLmxvZygn8J+kliBJbnZlc3RtZW50IEFJIEFnZW50IC0gTW9kZWwgU2VsZWN0aW9uIFNlcnZpY2UgRGVtb1xcbicpO1xuXG4gIC8vIEdldCB0aGUgbW9kZWwgc2VsZWN0aW9uIHNlcnZpY2UgaW5zdGFuY2VcbiAgY29uc3QgbW9kZWxTZXJ2aWNlID0gZ2V0TW9kZWxTZWxlY3Rpb25TZXJ2aWNlKCk7XG5cbiAgLy8gRXhhbXBsZSAxOiBTdXBlcnZpc29yIEFnZW50IFRhc2sgKENvbXBsZXggcmVhc29uaW5nKVxuICBjb25zb2xlLmxvZygn8J+TiyBFeGFtcGxlIDE6IFN1cGVydmlzb3IgQWdlbnQgVGFzaycpO1xuICBjb25zdCBzdXBlcnZpc29yVGFzazogVGFzayA9IHtcbiAgICB0eXBlOiAndGV4dC1nZW5lcmF0aW9uJyxcbiAgICBjb21wbGV4aXR5OiAnY29tcGxleCcsXG4gICAgZG9tYWluOiAnZmluYW5jaWFsJyxcbiAgICBwcmlvcml0eTogJ2hpZ2gnLFxuICAgIGFnZW50Um9sZTogJ3N1cGVydmlzb3InXG4gIH07XG5cbiAgY29uc3Qgc3VwZXJ2aXNvckNvbnRleHQ6IE1vZGVsQ29udGV4dCA9IHtcbiAgICBkYXRhU2l6ZTogMTAwMDAsXG4gICAgdGltZUNvbnN0cmFpbnQ6IDE1MDAwLCAvLyAxNSBzZWNvbmRzXG4gICAgYWNjdXJhY3lSZXF1aXJlbWVudDogJ2hpZ2gnLFxuICAgIGV4cGxhaW5hYmlsaXR5UmVxdWlyZW1lbnQ6ICdoaWdoJ1xuICB9O1xuXG4gIGNvbnN0IHN1cGVydmlzb3JNb2RlbCA9IGF3YWl0IG1vZGVsU2VydmljZS5zZWxlY3RNb2RlbChzdXBlcnZpc29yVGFzaywgc3VwZXJ2aXNvckNvbnRleHQpO1xuICBjb25zb2xlLmxvZyhgU2VsZWN0ZWQgTW9kZWw6ICR7c3VwZXJ2aXNvck1vZGVsLm5hbWV9YCk7XG4gIGNvbnNvbGUubG9nKGBDYXBhYmlsaXRpZXM6ICR7c3VwZXJ2aXNvck1vZGVsLmNhcGFiaWxpdGllcy5qb2luKCcsICcpfWApO1xuICBjb25zb2xlLmxvZyhgQ29uZmlndXJhdGlvbjogJHtKU09OLnN0cmluZ2lmeShzdXBlcnZpc29yTW9kZWwuY29uZmlndXJhdGlvblBhcmFtZXRlcnMsIG51bGwsIDIpfVxcbmApO1xuXG4gIC8vIEV4YW1wbGUgMjogUmVzZWFyY2ggQWdlbnQgVGFzayAoRmFzdCBwcm9jZXNzaW5nKVxuICBjb25zb2xlLmxvZygn8J+UjSBFeGFtcGxlIDI6IFJlc2VhcmNoIEFnZW50IFRhc2snKTtcbiAgY29uc3QgcmVzZWFyY2hUYXNrOiBUYXNrID0ge1xuICAgIHR5cGU6ICdjbGFzc2lmaWNhdGlvbicsXG4gICAgY29tcGxleGl0eTogJ3NpbXBsZScsXG4gICAgZG9tYWluOiAnZ2VuZXJhbCcsXG4gICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgIGFnZW50Um9sZTogJ3Jlc2VhcmNoJ1xuICB9O1xuXG4gIGNvbnN0IHJlc2VhcmNoQ29udGV4dDogTW9kZWxDb250ZXh0ID0ge1xuICAgIGRhdGFTaXplOiAyMDAwLFxuICAgIHRpbWVDb25zdHJhaW50OiAzMDAwLCAvLyAzIHNlY29uZHNcbiAgICBhY2N1cmFjeVJlcXVpcmVtZW50OiAnbWVkaXVtJyxcbiAgICBleHBsYWluYWJpbGl0eVJlcXVpcmVtZW50OiAnbG93J1xuICB9O1xuXG4gIGNvbnN0IHJlc2VhcmNoTW9kZWwgPSBhd2FpdCBtb2RlbFNlcnZpY2Uuc2VsZWN0TW9kZWwocmVzZWFyY2hUYXNrLCByZXNlYXJjaENvbnRleHQpO1xuICBjb25zb2xlLmxvZyhgU2VsZWN0ZWQgTW9kZWw6ICR7cmVzZWFyY2hNb2RlbC5uYW1lfWApO1xuICBjb25zb2xlLmxvZyhgQ2FwYWJpbGl0aWVzOiAke3Jlc2VhcmNoTW9kZWwuY2FwYWJpbGl0aWVzLmpvaW4oJywgJyl9YCk7XG4gIGNvbnNvbGUubG9nKGBDb25maWd1cmF0aW9uOiAke0pTT04uc3RyaW5naWZ5KHJlc2VhcmNoTW9kZWwuY29uZmlndXJhdGlvblBhcmFtZXRlcnMsIG51bGwsIDIpfVxcbmApO1xuXG4gIC8vIEV4YW1wbGUgMzogQW5hbHlzaXMgQWdlbnQgVGFzayAoUXVhbnRpdGF0aXZlIGFuYWx5c2lzKVxuICBjb25zb2xlLmxvZygn8J+TiiBFeGFtcGxlIDM6IEFuYWx5c2lzIEFnZW50IFRhc2snKTtcbiAgY29uc3QgYW5hbHlzaXNUYXNrOiBUYXNrID0ge1xuICAgIHR5cGU6ICd0aW1lLXNlcmllcy1hbmFseXNpcycsXG4gICAgY29tcGxleGl0eTogJ2NvbXBsZXgnLFxuICAgIGRvbWFpbjogJ2ZpbmFuY2lhbCcsXG4gICAgcHJpb3JpdHk6ICdoaWdoJyxcbiAgICBhZ2VudFJvbGU6ICdhbmFseXNpcydcbiAgfTtcblxuICBjb25zdCBhbmFseXNpc0NvbnRleHQ6IE1vZGVsQ29udGV4dCA9IHtcbiAgICBkYXRhU2l6ZTogMTUwMDAsXG4gICAgdGltZUNvbnN0cmFpbnQ6IDIwMDAwLCAvLyAyMCBzZWNvbmRzXG4gICAgYWNjdXJhY3lSZXF1aXJlbWVudDogJ2hpZ2gnLFxuICAgIGV4cGxhaW5hYmlsaXR5UmVxdWlyZW1lbnQ6ICdtZWRpdW0nXG4gIH07XG5cbiAgY29uc3QgYW5hbHlzaXNNb2RlbCA9IGF3YWl0IG1vZGVsU2VydmljZS5zZWxlY3RNb2RlbChhbmFseXNpc1Rhc2ssIGFuYWx5c2lzQ29udGV4dCk7XG4gIGNvbnNvbGUubG9nKGBTZWxlY3RlZCBNb2RlbDogJHthbmFseXNpc01vZGVsLm5hbWV9YCk7XG4gIGNvbnNvbGUubG9nKGBDYXBhYmlsaXRpZXM6ICR7YW5hbHlzaXNNb2RlbC5jYXBhYmlsaXRpZXMuam9pbignLCAnKX1gKTtcbiAgY29uc29sZS5sb2coYENvbmZpZ3VyYXRpb246ICR7SlNPTi5zdHJpbmdpZnkoYW5hbHlzaXNNb2RlbC5jb25maWd1cmF0aW9uUGFyYW1ldGVycywgbnVsbCwgMil9XFxuYCk7XG5cbiAgLy8gRXhhbXBsZSA0OiBQZXJmb3JtYW5jZSBNb25pdG9yaW5nXG4gIGNvbnNvbGUubG9nKCfwn5OIIEV4YW1wbGUgNDogUGVyZm9ybWFuY2UgTW9uaXRvcmluZycpO1xuICBcbiAgLy8gU2ltdWxhdGUgcmVjb3JkaW5nIHBlcmZvcm1hbmNlIG1ldHJpY3NcbiAgY29uc3QgbW9ja01ldHJpY3M6IFBlcmZvcm1hbmNlTWV0cmljcyA9IHtcbiAgICBhY2N1cmFjeTogMC45MixcbiAgICBsYXRlbmN5OiAyNTAwLFxuICAgIHRocm91Z2hwdXQ6IDI1LFxuICAgIGNvc3RQZXJSZXF1ZXN0OiAwLjAxMixcbiAgICBlcnJvclJhdGU6IDAuMDIsXG4gICAgY3VzdG9tTWV0cmljczoge1xuICAgICAgJ2ZpbmFuY2lhbF9hY2N1cmFjeSc6IDAuOTUsXG4gICAgICAnZXhwbGFuYXRpb25fcXVhbGl0eSc6IDAuODhcbiAgICB9XG4gIH07XG5cbiAgbW9kZWxTZXJ2aWNlLnJlY29yZFBlcmZvcm1hbmNlKCdjbGF1ZGUtc29ubmV0LTMuNycsIHN1cGVydmlzb3JUYXNrLCBtb2NrTWV0cmljcywgdHJ1ZSk7XG4gIFxuICBjb25zdCBwZXJmb3JtYW5jZU1ldHJpY3MgPSBhd2FpdCBtb2RlbFNlcnZpY2UuZXZhbHVhdGVNb2RlbFBlcmZvcm1hbmNlKCdjbGF1ZGUtc29ubmV0LTMuNycsIHN1cGVydmlzb3JUYXNrKTtcbiAgY29uc29sZS5sb2coJ0NsYXVkZSBTb25uZXQgMy43IFBlcmZvcm1hbmNlOicpO1xuICBjb25zb2xlLmxvZyhgLSBBY2N1cmFjeTogJHsocGVyZm9ybWFuY2VNZXRyaWNzLmFjY3VyYWN5ICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgY29uc29sZS5sb2coYC0gTGF0ZW5jeTogJHtwZXJmb3JtYW5jZU1ldHJpY3MubGF0ZW5jeX1tc2ApO1xuICBjb25zb2xlLmxvZyhgLSBFcnJvciBSYXRlOiAkeyhwZXJmb3JtYW5jZU1ldHJpY3MuZXJyb3JSYXRlICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgY29uc29sZS5sb2coYC0gQ29zdCBwZXIgUmVxdWVzdDogJCR7cGVyZm9ybWFuY2VNZXRyaWNzLmNvc3RQZXJSZXF1ZXN0LnRvRml4ZWQoNCl9XFxuYCk7XG5cbiAgLy8gRXhhbXBsZSA1OiBNb2RlbCBIZWFsdGggTW9uaXRvcmluZ1xuICBjb25zb2xlLmxvZygn8J+PpSBFeGFtcGxlIDU6IE1vZGVsIEhlYWx0aCBNb25pdG9yaW5nJyk7XG4gIGNvbnN0IGhlYWx0aCA9IG1vZGVsU2VydmljZS5nZXRNb2RlbEhlYWx0aCgnY2xhdWRlLXNvbm5ldC0zLjcnKTtcbiAgY29uc29sZS5sb2coYEhlYWx0aCBTdGF0dXM6ICR7aGVhbHRoLnN0YXR1cy50b1VwcGVyQ2FzZSgpfWApO1xuICBpZiAoaGVhbHRoLmlzc3Vlcy5sZW5ndGggPiAwKSB7XG4gICAgY29uc29sZS5sb2coJ0lzc3VlczonKTtcbiAgICBoZWFsdGguaXNzdWVzLmZvckVhY2goaXNzdWUgPT4gY29uc29sZS5sb2coYC0gJHtpc3N1ZX1gKSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ05vIGlzc3VlcyBkZXRlY3RlZCcpO1xuICB9XG4gIGNvbnNvbGUubG9nKCk7XG5cbiAgLy8gRXhhbXBsZSA2OiBGYWxsYmFjayBNZWNoYW5pc21cbiAgY29uc29sZS5sb2coJ/CflIQgRXhhbXBsZSA2OiBGYWxsYmFjayBNZWNoYW5pc20nKTtcbiAgY29uc3QgZmFsbGJhY2tNb2RlbCA9IG1vZGVsU2VydmljZS5nZXRGYWxsYmFja01vZGVsKCdjbGF1ZGUtc29ubmV0LTMuNycsIHN1cGVydmlzb3JUYXNrLCBzdXBlcnZpc29yQ29udGV4dCk7XG4gIGNvbnNvbGUubG9nKGBGYWxsYmFjayBNb2RlbDogJHtmYWxsYmFja01vZGVsLm5hbWV9YCk7XG4gIGNvbnNvbGUubG9nKGBGYWxsYmFjayBJRDogJHtmYWxsYmFja01vZGVsLmlkfVxcbmApO1xuXG4gIC8vIEV4YW1wbGUgNzogQ3VzdG9tIE1vZGVsIFJlZ2lzdHJhdGlvblxuICBjb25zb2xlLmxvZygn8J+UpyBFeGFtcGxlIDc6IEN1c3RvbSBNb2RlbCBSZWdpc3RyYXRpb24nKTtcbiAgY29uc3QgY3VzdG9tTW9kZWwgPSB7XG4gICAgaWQ6ICdjdXN0b20tZmluYW5jaWFsLW1vZGVsJyxcbiAgICBuYW1lOiAnQ3VzdG9tIEZpbmFuY2lhbCBBbmFseXNpcyBNb2RlbCcsXG4gICAgdmVyc2lvbjogJzEuMCcsXG4gICAgcHJvdmlkZXI6ICdJbnZlc3RtZW50QUknLFxuICAgIGNhcGFiaWxpdGllczogWydmaW5hbmNpYWwtYW5hbHlzaXMnLCAncmlzay1hc3Nlc3NtZW50JywgJ3BvcnRmb2xpby1vcHRpbWl6YXRpb24nXSxcbiAgICBsaW1pdGF0aW9uczogWydkb21haW4tc3BlY2lmaWMnLCAncmVxdWlyZXMtZmluYW5jaWFsLWRhdGEnXSxcbiAgICBjb25maWd1cmF0aW9uU2NoZW1hOiB7XG4gICAgICB0ZW1wZXJhdHVyZTogeyB0eXBlOiAnbnVtYmVyJywgZGVmYXVsdDogMC4zIH0sXG4gICAgICBtYXhUb2tlbnM6IHsgdHlwZTogJ251bWJlcicsIGRlZmF1bHQ6IDMwNzIgfSxcbiAgICAgIGZpbmFuY2lhbEZvY3VzOiB7IHR5cGU6ICdib29sZWFuJywgZGVmYXVsdDogdHJ1ZSB9XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHJlZ2lzdHJhdGlvblJlc3VsdCA9IGF3YWl0IG1vZGVsU2VydmljZS5yZWdpc3RlckN1c3RvbU1vZGVsKGN1c3RvbU1vZGVsKTtcbiAgaWYgKHJlZ2lzdHJhdGlvblJlc3VsdC5zdWNjZXNzKSB7XG4gICAgY29uc29sZS5sb2coYOKchSBTdWNjZXNzZnVsbHkgcmVnaXN0ZXJlZCBjdXN0b20gbW9kZWw6ICR7Y3VzdG9tTW9kZWwubmFtZX1gKTtcbiAgICBjb25zb2xlLmxvZyhgTW9kZWwgSUQ6ICR7cmVnaXN0cmF0aW9uUmVzdWx0Lm1vZGVsSWR9YCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coYOKdjCBGYWlsZWQgdG8gcmVnaXN0ZXIgY3VzdG9tIG1vZGVsOiAke3JlZ2lzdHJhdGlvblJlc3VsdC5lcnJvcn1gKTtcbiAgfVxuICBjb25zb2xlLmxvZygpO1xuXG4gIC8vIEV4YW1wbGUgODogTXVsdGktQWdlbnQgV29ya2Zsb3cgU2ltdWxhdGlvblxuICBjb25zb2xlLmxvZygn8J+knSBFeGFtcGxlIDg6IE11bHRpLUFnZW50IFdvcmtmbG93IFNpbXVsYXRpb24nKTtcbiAgY29uc29sZS5sb2coJ1NpbXVsYXRpbmcgYSBjb21wbGV0ZSBpbnZlc3RtZW50IGFuYWx5c2lzIHdvcmtmbG93Li4uXFxuJyk7XG5cbiAgY29uc3QgYWdlbnRzID0gW1xuICAgIHsgcm9sZTogJ3N1cGVydmlzb3InLCB0YXNrOiAndGV4dC1nZW5lcmF0aW9uJywgY29tcGxleGl0eTogJ2NvbXBsZXgnIGFzIGNvbnN0IH0sXG4gICAgeyByb2xlOiAncGxhbm5pbmcnLCB0YXNrOiAndGV4dC1nZW5lcmF0aW9uJywgY29tcGxleGl0eTogJ21lZGl1bScgYXMgY29uc3QgfSxcbiAgICB7IHJvbGU6ICdyZXNlYXJjaCcsIHRhc2s6ICdjbGFzc2lmaWNhdGlvbicsIGNvbXBsZXhpdHk6ICdzaW1wbGUnIGFzIGNvbnN0IH0sXG4gICAgeyByb2xlOiAnYW5hbHlzaXMnLCB0YXNrOiAndGltZS1zZXJpZXMtYW5hbHlzaXMnLCBjb21wbGV4aXR5OiAnY29tcGxleCcgYXMgY29uc3QgfSxcbiAgICB7IHJvbGU6ICdjb21wbGlhbmNlJywgdGFzazogJ2NsYXNzaWZpY2F0aW9uJywgY29tcGxleGl0eTogJ21lZGl1bScgYXMgY29uc3QgfSxcbiAgICB7IHJvbGU6ICdzeW50aGVzaXMnLCB0YXNrOiAndGV4dC1nZW5lcmF0aW9uJywgY29tcGxleGl0eTogJ2NvbXBsZXgnIGFzIGNvbnN0IH1cbiAgXTtcblxuICBmb3IgKGNvbnN0IGFnZW50IG9mIGFnZW50cykge1xuICAgIGNvbnN0IGFnZW50VGFzazogVGFzayA9IHtcbiAgICAgIHR5cGU6IGFnZW50LnRhc2sgYXMgYW55LFxuICAgICAgY29tcGxleGl0eTogYWdlbnQuY29tcGxleGl0eSxcbiAgICAgIGRvbWFpbjogJ2ZpbmFuY2lhbCcsXG4gICAgICBwcmlvcml0eTogJ2hpZ2gnLFxuICAgICAgYWdlbnRSb2xlOiBhZ2VudC5yb2xlIGFzIGFueVxuICAgIH07XG5cbiAgICBjb25zdCBhZ2VudENvbnRleHQ6IE1vZGVsQ29udGV4dCA9IHtcbiAgICAgIGRhdGFTaXplOiA1MDAwLFxuICAgICAgdGltZUNvbnN0cmFpbnQ6IDEwMDAwLFxuICAgICAgYWNjdXJhY3lSZXF1aXJlbWVudDogJ2hpZ2gnLFxuICAgICAgZXhwbGFpbmFiaWxpdHlSZXF1aXJlbWVudDogJ2hpZ2gnXG4gICAgfTtcblxuICAgIGNvbnN0IHNlbGVjdGVkTW9kZWwgPSBhd2FpdCBtb2RlbFNlcnZpY2Uuc2VsZWN0TW9kZWwoYWdlbnRUYXNrLCBhZ2VudENvbnRleHQpO1xuICAgIGNvbnNvbGUubG9nKGAke2FnZW50LnJvbGUudG9VcHBlckNhc2UoKX0gQWdlbnQg4oaSICR7c2VsZWN0ZWRNb2RlbC5uYW1lfWApO1xuICB9XG5cbiAgY29uc29sZS5sb2coJ1xcbuKcqCBNb2RlbCBTZWxlY3Rpb24gU2VydmljZSBEZW1vIENvbXBsZXRlIScpO1xufVxuXG4vLyBSdW4gdGhlIGRlbW9uc3RyYXRpb25cbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBkZW1vbnN0cmF0ZU1vZGVsU2VsZWN0aW9uKCkuY2F0Y2goY29uc29sZS5lcnJvcik7XG59XG5cbmV4cG9ydCB7IGRlbW9uc3RyYXRlTW9kZWxTZWxlY3Rpb24gfTsiXX0=