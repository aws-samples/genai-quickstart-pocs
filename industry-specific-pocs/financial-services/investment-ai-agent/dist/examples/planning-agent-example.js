"use strict";
/**
 * Planning Agent Example
 *
 * This example demonstrates how to use the Planning Agent to create research plans,
 * analysis plans, analyze dependencies, estimate resources, and adapt plans based
 * on intermediate findings.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runExamples = exports.demonstrateMessageProcessing = exports.demonstratePlanningWorkflow = void 0;
const planning_agent_1 = require("../services/ai/planning-agent");
const claude_sonnet_service_1 = require("../services/ai/claude-sonnet-service");
const bedrock_client_1 = require("../services/ai/bedrock-client");
/**
 * Example: Complete planning workflow for investment analysis
 */
async function demonstratePlanningWorkflow() {
    console.log('🎯 Planning Agent Example - Investment Analysis Workflow\n');
    try {
        // Initialize services
        const bedrockClient = new bedrock_client_1.BedrockClientService();
        const claudeSonnetService = new claude_sonnet_service_1.ClaudeSonnetService(bedrockClient);
        const planningAgent = new planning_agent_1.PlanningAgent(claudeSonnetService);
        // Define planning context
        const planningContext = {
            requestType: 'investment-analysis',
            parameters: {
                sector: 'technology',
                focusArea: 'artificial intelligence',
                investmentAmount: 1000000,
                timeHorizon: 'medium-term'
            },
            userPreferences: {
                investmentHorizon: 'medium',
                riskTolerance: 'moderate',
                sectors: ['technology', 'healthcare', 'renewable-energy'],
                assetClasses: ['stocks', 'etfs']
            },
            constraints: {
                timeLimit: 120000,
                budgetLimit: 1000000,
                dataSourceRestrictions: ['no-proprietary-data'],
                complianceRequirements: ['SEC-regulations', 'ESG-compliance']
            },
            availableResources: {
                dataSources: ['market-data', 'financial-reports', 'news-feeds', 'analyst-reports'],
                analysisTools: ['technical-analysis', 'fundamental-analysis', 'sentiment-analysis'],
                timeAllocation: 120000
            }
        };
        console.log('📋 Planning Context:');
        console.log(`- Request Type: ${planningContext.requestType}`);
        console.log(`- Sector: ${planningContext.parameters.sector}`);
        console.log(`- Focus Area: ${planningContext.parameters.focusArea}`);
        console.log(`- Investment Amount: $${planningContext.parameters.investmentAmount.toLocaleString()}`);
        console.log(`- Risk Tolerance: ${planningContext.userPreferences?.riskTolerance}`);
        console.log(`- Time Limit: ${planningContext.constraints?.timeLimit}ms\n`);
        // Step 1: Create Research Plan
        console.log('🔍 Step 1: Creating Research Plan...');
        const researchPlan = await planningAgent.createResearchPlan('conv_example_123', planningContext);
        console.log(`✅ Research Plan Created (ID: ${researchPlan.id})`);
        console.log(`- Objectives: ${researchPlan.objectives.length}`);
        researchPlan.objectives.forEach((obj, i) => console.log(`  ${i + 1}. ${obj}`));
        console.log(`- Research Questions: ${researchPlan.researchQuestions.length}`);
        researchPlan.researchQuestions.forEach((q, i) => console.log(`  ${i + 1}. ${q}`));
        console.log(`- Data Sources: ${researchPlan.dataSources.length}`);
        researchPlan.dataSources.forEach((ds, i) => {
            console.log(`  ${i + 1}. ${ds.source} (${ds.type}, ${ds.priority} priority, ${ds.estimatedTime}ms)`);
        });
        console.log(`- Methodology: ${researchPlan.methodology}`);
        console.log(`- Status: ${researchPlan.status}\n`);
        // Step 2: Create Analysis Plan
        console.log('📊 Step 2: Creating Analysis Plan...');
        const analysisPlan = await planningAgent.createAnalysisPlan('conv_example_123', planningContext, researchPlan);
        console.log(`✅ Analysis Plan Created (ID: ${analysisPlan.id})`);
        console.log(`- Analysis Type: ${analysisPlan.analysisType}`);
        console.log(`- Analysis Steps: ${analysisPlan.analysisSteps.length}`);
        analysisPlan.analysisSteps.forEach((step, i) => {
            console.log(`  ${i + 1}. ${step.step} (${step.agent} agent, ${step.estimatedTime}ms)`);
            console.log(`     Description: ${step.description}`);
            console.log(`     Expected Output: ${step.expectedOutput}`);
            if (step.dependencies.length > 0) {
                console.log(`     Dependencies: ${step.dependencies.join(', ')}`);
            }
        });
        console.log(`- Key Metrics: ${analysisPlan.metrics.join(', ')}`);
        console.log(`- Confidence Thresholds: Min ${analysisPlan.confidenceThresholds.minimum}, Target ${analysisPlan.confidenceThresholds.target}`);
        console.log(`- Status: ${analysisPlan.status}\n`);
        // Step 3: Analyze Dependencies
        console.log('🔗 Step 3: Analyzing Task Dependencies...');
        const dependencies = await planningAgent.analyzeDependencies(researchPlan, analysisPlan);
        console.log(`✅ Dependencies Analyzed (${dependencies.size} tasks)`);
        console.log('Task Dependency Graph:');
        dependencies.forEach((dep, taskId) => {
            console.log(`- ${taskId}:`);
            console.log(`  Duration: ${dep.estimatedDuration}ms`);
            console.log(`  Critical Path: ${dep.criticalPath ? 'Yes' : 'No'}`);
            if (dep.dependsOn.length > 0) {
                console.log(`  Depends On: ${dep.dependsOn.join(', ')}`);
            }
            if (dep.blockedBy.length > 0) {
                console.log(`  Blocks: ${dep.blockedBy.join(', ')}`);
            }
        });
        console.log();
        // Step 4: Estimate Resources
        console.log('⚡ Step 4: Estimating Resource Requirements...');
        const resourceEstimation = await planningAgent.estimateResources(researchPlan, analysisPlan, dependencies);
        console.log(`✅ Resource Estimation Complete`);
        console.log(`- Total Estimated Time: ${resourceEstimation.totalEstimatedTime}ms (${(resourceEstimation.totalEstimatedTime / 1000).toFixed(1)}s)`);
        console.log('- Agent Allocations:');
        resourceEstimation.agentAllocations.forEach(alloc => {
            console.log(`  ${alloc.agent}: ${alloc.estimatedTime}ms, ${alloc.taskCount} tasks, ${(alloc.utilizationRate * 100).toFixed(0)}% utilization`);
        });
        console.log('- Data Requirements:');
        resourceEstimation.dataRequirements.forEach(req => {
            console.log(`  ${req.source}: ${req.volume} volume, ${req.processingTime}ms processing`);
        });
        console.log('- Computational Requirements:');
        console.log(`  Model Calls: ${resourceEstimation.computationalRequirements.modelCalls}`);
        console.log(`  Estimated Cost: $${resourceEstimation.computationalRequirements.estimatedCost.toFixed(2)}`);
        console.log(`  Memory: ${resourceEstimation.computationalRequirements.memoryRequirements}`);
        console.log('- Risk Factors:');
        resourceEstimation.riskFactors.forEach(risk => {
            console.log(`  ${risk.factor} (${risk.impact} impact): ${risk.mitigation}`);
        });
        console.log();
        // Step 5: Simulate Intermediate Findings and Plan Adaptation
        console.log('🔄 Step 5: Simulating Plan Adaptation...');
        // Simulate intermediate findings that might trigger plan adaptation
        const intermediateFindings = {
            marketVolatility: 'increased',
            sectorPerformance: {
                technology: 'outperforming',
                artificialIntelligence: 'high-growth-potential'
            },
            regulatoryChanges: 'new-ai-regulations-proposed',
            dataQuality: {
                marketData: 'excellent',
                analystReports: 'limited-availability'
            },
            competitiveAnalysis: {
                keyPlayers: ['NVIDIA', 'Microsoft', 'Google', 'OpenAI'],
                marketConcentration: 'high'
            }
        };
        const adaptation = await planningAgent.adaptPlan(researchPlan.id, 'research', intermediateFindings, 'Market volatility increased and new AI regulations proposed');
        console.log(`✅ Plan Adaptation Created (ID: ${adaptation.adaptationId})`);
        console.log(`- Original Plan: ${adaptation.originalPlanId}`);
        console.log(`- Trigger: ${adaptation.trigger}`);
        console.log(`- Approval Required: ${adaptation.approvalRequired ? 'Yes' : 'No'}`);
        console.log(`- Justification: ${adaptation.justification}`);
        console.log('- Changes:');
        adaptation.changes.forEach((change, i) => {
            console.log(`  ${i + 1}. ${change.type.toUpperCase()} ${change.target}: ${change.description}`);
            console.log(`     Impact: ${change.impact}`);
        });
        console.log('- Updated Resource Estimation:');
        console.log(`  Total Time: ${adaptation.newEstimations.totalEstimatedTime}ms (${(adaptation.newEstimations.totalEstimatedTime / 1000).toFixed(1)}s)`);
        console.log();
        // Step 6: Demonstrate Plan Retrieval
        console.log('📖 Step 6: Demonstrating Plan Retrieval...');
        const retrievedResearchPlan = planningAgent.getResearchPlan(researchPlan.id);
        const retrievedAnalysisPlan = planningAgent.getAnalysisPlan(analysisPlan.id);
        const retrievedDependencies = planningAgent.getTaskDependencies();
        const retrievedEstimation = planningAgent.getResourceEstimation('conv_example_123');
        const retrievedAdaptations = planningAgent.getPlanAdaptations();
        console.log(`✅ Plan Retrieval Complete`);
        console.log(`- Research Plan: ${retrievedResearchPlan ? 'Found' : 'Not Found'}`);
        console.log(`- Analysis Plan: ${retrievedAnalysisPlan ? 'Found' : 'Not Found'}`);
        console.log(`- Dependencies: ${retrievedDependencies.size} tasks`);
        console.log(`- Resource Estimation: ${retrievedEstimation ? 'Found' : 'Not Found'}`);
        console.log(`- Adaptations: ${retrievedAdaptations.size} adaptations`);
        console.log();
        console.log('🎉 Planning Agent Workflow Complete!\n');
        console.log('Summary:');
        console.log(`- Created comprehensive research plan with ${researchPlan.dataSources.length} data sources`);
        console.log(`- Developed detailed analysis plan with ${analysisPlan.analysisSteps.length} steps`);
        console.log(`- Analyzed ${dependencies.size} task dependencies`);
        console.log(`- Estimated total time: ${(resourceEstimation.totalEstimatedTime / 1000).toFixed(1)}s`);
        console.log(`- Adapted plan based on intermediate findings`);
        console.log(`- All plans and data successfully stored and retrievable`);
    }
    catch (error) {
        console.error('❌ Error in planning workflow:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Stack trace:', error.stack);
        }
    }
}
exports.demonstratePlanningWorkflow = demonstratePlanningWorkflow;
/**
 * Example: Message-based interaction with Planning Agent
 */
async function demonstrateMessageProcessing() {
    console.log('\n📨 Planning Agent Example - Message Processing\n');
    try {
        // Initialize services
        const bedrockClient = new bedrock_client_1.BedrockClientService();
        const claudeSonnetService = new claude_sonnet_service_1.ClaudeSonnetService(bedrockClient);
        const planningAgent = new planning_agent_1.PlanningAgent(claudeSonnetService);
        // Example message for creating a research plan
        const researchPlanMessage = {
            sender: 'supervisor',
            recipient: 'planning',
            messageType: 'request',
            content: {
                taskType: planning_agent_1.PlanningTaskType.RESEARCH_PLAN,
                conversationId: 'conv_message_example',
                context: {
                    requestType: 'market-analysis',
                    parameters: {
                        market: 'cryptocurrency',
                        focus: 'DeFi protocols',
                        timeframe: 'Q1 2024'
                    },
                    userPreferences: {
                        investmentHorizon: 'short',
                        riskTolerance: 'aggressive',
                        sectors: ['cryptocurrency', 'blockchain']
                    }
                }
            },
            metadata: {
                priority: 'high',
                timestamp: new Date(),
                conversationId: 'conv_message_example',
                requestId: 'req_research_plan_001'
            }
        };
        console.log('📤 Sending Research Plan Request...');
        console.log(`Message Type: ${researchPlanMessage.messageType}`);
        console.log(`Task Type: ${researchPlanMessage.content.taskType}`);
        console.log(`Priority: ${researchPlanMessage.metadata.priority}`);
        const researchPlanResponse = await planningAgent.processMessage(researchPlanMessage);
        console.log('\n📥 Research Plan Response Received:');
        console.log(`Success: ${researchPlanResponse.content.success}`);
        console.log(`Response Type: ${researchPlanResponse.messageType}`);
        if (researchPlanResponse.content.success) {
            const plan = researchPlanResponse.content.result;
            console.log(`Plan ID: ${plan.id}`);
            console.log(`Objectives: ${plan.objectives.length}`);
            console.log(`Data Sources: ${plan.dataSources.length}`);
            console.log(`Status: ${plan.status}`);
        }
        else {
            console.log(`Error: ${researchPlanResponse.content.error}`);
        }
        console.log('\n✅ Message Processing Example Complete!');
    }
    catch (error) {
        console.error('❌ Error in message processing example:', error);
    }
}
exports.demonstrateMessageProcessing = demonstrateMessageProcessing;
/**
 * Run all examples
 */
async function runExamples() {
    console.log('🚀 Starting Planning Agent Examples...\n');
    await demonstratePlanningWorkflow();
    await demonstrateMessageProcessing();
    console.log('\n🏁 All Planning Agent Examples Complete!');
}
exports.runExamples = runExamples;
// Run examples if this file is executed directly
if (require.main === module) {
    runExamples().catch(console.error);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhbm5pbmctYWdlbnQtZXhhbXBsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGFtcGxlcy9wbGFubmluZy1hZ2VudC1leGFtcGxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILGtFQUl1QztBQUN2QyxnRkFBMkU7QUFDM0Usa0VBQXFFO0FBR3JFOztHQUVHO0FBQ0gsS0FBSyxVQUFVLDJCQUEyQjtJQUN4QyxPQUFPLENBQUMsR0FBRyxDQUFDLDREQUE0RCxDQUFDLENBQUM7SUFFMUUsSUFBSTtRQUNGLHNCQUFzQjtRQUN0QixNQUFNLGFBQWEsR0FBRyxJQUFJLHFDQUFvQixFQUFFLENBQUM7UUFDakQsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLDJDQUFtQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ25FLE1BQU0sYUFBYSxHQUFHLElBQUksOEJBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBRTdELDBCQUEwQjtRQUMxQixNQUFNLGVBQWUsR0FBb0I7WUFDdkMsV0FBVyxFQUFFLHFCQUFxQjtZQUNsQyxVQUFVLEVBQUU7Z0JBQ1YsTUFBTSxFQUFFLFlBQVk7Z0JBQ3BCLFNBQVMsRUFBRSx5QkFBeUI7Z0JBQ3BDLGdCQUFnQixFQUFFLE9BQU87Z0JBQ3pCLFdBQVcsRUFBRSxhQUFhO2FBQzNCO1lBQ0QsZUFBZSxFQUFFO2dCQUNmLGlCQUFpQixFQUFFLFFBQVE7Z0JBQzNCLGFBQWEsRUFBRSxVQUFVO2dCQUN6QixPQUFPLEVBQUUsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLGtCQUFrQixDQUFDO2dCQUN6RCxZQUFZLEVBQUUsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDO2FBQ2pDO1lBQ0QsV0FBVyxFQUFFO2dCQUNYLFNBQVMsRUFBRSxNQUFNO2dCQUNqQixXQUFXLEVBQUUsT0FBTztnQkFDcEIsc0JBQXNCLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQztnQkFDL0Msc0JBQXNCLEVBQUUs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LENBQUMsd0NBQXdDLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDaEU7QUFDSCxDQUFDO0FBcUJDLG9FQUE0QjtBQW5COUI7O0dBRUc7QUFDSCxLQUFLLFVBQVUsV0FBVztJQUN4QixPQUFPLENBQUMsR0FBRyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7SUFFeEQsTUFBTSwyQkFBMkIsRUFBRSxDQUFDO0lBQ3BDLE1BQU0sNEJBQTRCLEVBQUUsQ0FBQztJQUVyQyxPQUFPLENBQUMsR0FBRyxDQUFDLDRDQUE0QyxDQUFDLENBQUM7QUFDNUQsQ0FBQztBQVVDLGtDQUFXO0FBUmIsaURBQWlEO0FBQ2pELElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUU7SUFDM0IsV0FBVyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztDQUNwQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogUGxhbm5pbmcgQWdlbnQgRXhhbXBsZVxuICogXG4gKiBUaGlzIGV4YW1wbGUgZGVtb25zdHJhdGVzIGhvdyB0byB1c2UgdGhlIFBsYW5uaW5nIEFnZW50IHRvIGNyZWF0ZSByZXNlYXJjaCBwbGFucyxcbiAqIGFuYWx5c2lzIHBsYW5zLCBhbmFseXplIGRlcGVuZGVuY2llcywgZXN0aW1hdGUgcmVzb3VyY2VzLCBhbmQgYWRhcHQgcGxhbnMgYmFzZWRcbiAqIG9uIGludGVybWVkaWF0ZSBmaW5kaW5ncy5cbiAqL1xuXG5pbXBvcnQgeyBcbiAgUGxhbm5pbmdBZ2VudCwgXG4gIFBsYW5uaW5nVGFza1R5cGUsIFxuICBQbGFubmluZ0NvbnRleHQgXG59IGZyb20gJy4uL3NlcnZpY2VzL2FpL3BsYW5uaW5nLWFnZW50JztcbmltcG9ydCB7IENsYXVkZVNvbm5ldFNlcnZpY2UgfSBmcm9tICcuLi9zZXJ2aWNlcy9haS9jbGF1ZGUtc29ubmV0LXNlcnZpY2UnO1xuaW1wb3J0IHsgQmVkcm9ja0NsaWVudFNlcnZpY2UgfSBmcm9tICcuLi9zZXJ2aWNlcy9haS9iZWRyb2NrLWNsaWVudCc7XG5pbXBvcnQgeyBCZWRyb2NrTW9kZWxJZCB9IGZyb20gJy4uL21vZGVscy9iZWRyb2NrJztcblxuLyoqXG4gKiBFeGFtcGxlOiBDb21wbGV0ZSBwbGFubmluZyB3b3JrZmxvdyBmb3IgaW52ZXN0bWVudCBhbmFseXNpc1xuICovXG5hc3luYyBmdW5jdGlvbiBkZW1vbnN0cmF0ZVBsYW5uaW5nV29ya2Zsb3coKSB7XG4gIGNvbnNvbGUubG9nKCfwn46vIFBsYW5uaW5nIEFnZW50IEV4YW1wbGUgLSBJbnZlc3RtZW50IEFuYWx5c2lzIFdvcmtmbG93XFxuJyk7XG5cbiAgdHJ5IHtcbiAgICAvLyBJbml0aWFsaXplIHNlcnZpY2VzXG4gICAgY29uc3QgYmVkcm9ja0NsaWVudCA9IG5ldyBCZWRyb2NrQ2xpZW50U2VydmljZSgpO1xuICAgIGNvbnN0IGNsYXVkZVNvbm5ldFNlcnZpY2UgPSBuZXcgQ2xhdWRlU29ubmV0U2VydmljZShiZWRyb2NrQ2xpZW50KTtcbiAgICBjb25zdCBwbGFubmluZ0FnZW50ID0gbmV3IFBsYW5uaW5nQWdlbnQoY2xhdWRlU29ubmV0U2VydmljZSk7XG5cbiAgICAvLyBEZWZpbmUgcGxhbm5pbmcgY29udGV4dFxuICAgIGNvbnN0IHBsYW5uaW5nQ29udGV4dDogUGxhbm5pbmdDb250ZXh0ID0ge1xuICAgICAgcmVxdWVzdFR5cGU6ICdpbnZlc3RtZW50LWFuYWx5c2lzJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgc2VjdG9yOiAndGVjaG5vbG9neScsXG4gICAgICAgIGZvY3VzQXJlYTogJ2FydGlmaWNpYWwgaW50ZWxsaWdlbmNlJyxcbiAgICAgICAgaW52ZXN0bWVudEFtb3VudDogMTAwMDAwMCxcbiAgICAgICAgdGltZUhvcml6b246ICdtZWRpdW0tdGVybSdcbiAgICAgIH0sXG4gICAgICB1c2VyUHJlZmVyZW5jZXM6IHtcbiAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdtZWRpdW0nLFxuICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnLFxuICAgICAgICBzZWN0b3JzOiBbJ3RlY2hub2xvZ3knLCAnaGVhbHRoY2FyZScsICdyZW5ld2FibGUtZW5lcmd5J10sXG4gICAgICAgIGFzc2V0Q2xhc3NlczogWydzdG9ja3MnLCAnZXRmcyddXG4gICAgICB9LFxuICAgICAgY29uc3RyYWludHM6IHtcbiAgICAgICAgdGltZUxpbWl0OiAxMjAwMDAsIC8vIDIgbWludXRlc1xuICAgICAgICBidWRnZXRMaW1pdDogMTAwMDAwMCxcbiAgICAgICAgZGF0YVNvdXJjZVJlc3RyaWN0aW9uczogWyduby1wcm9wcmlldGFyeS1kYXRhJ10sXG4gICAgICAgIGNvbXBsaWFuY2VSZXF1aXJlbWVudHM6IFsnU0VDLXJlZ3VsYXRpb25zJywgJ0VTRy1jb21wbGlhbmNlJ11cbiAgICAgIH0sXG4gICAgICBhdmFpbGFibGVSZXNvdXJjZXM6IHtcbiAgICAgICAgZGF0YVNvdXJjZXM6IFsnbWFya2V0LWRhdGEnLCAnZmluYW5jaWFsLXJlcG9ydHMnLCAnbmV3cy1mZWVkcycsICdhbmFseXN0LXJlcG9ydHMnXSxcbiAgICAgICAgYW5hbHlzaXNUb29sczogWyd0ZWNobmljYWwtYW5hbHlzaXMnLCAnZnVuZGFtZW50YWwtYW5hbHlzaXMnLCAnc2VudGltZW50LWFuYWx5c2lzJ10sXG4gICAgICAgIHRpbWVBbGxvY2F0aW9uOiAxMjAwMDBcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc29sZS5sb2coJ/Cfk4sgUGxhbm5pbmcgQ29udGV4dDonKTtcbiAgICBjb25zb2xlLmxvZyhgLSBSZXF1ZXN0IFR5cGU6ICR7cGxhbm5pbmdDb250ZXh0LnJlcXVlc3RUeXBlfWApO1xuICAgIGNvbnNvbGUubG9nKGAtIFNlY3RvcjogJHtwbGFubmluZ0NvbnRleHQucGFyYW1ldGVycy5zZWN0b3J9YCk7XG4gICAgY29uc29sZS5sb2coYC0gRm9jdXMgQXJlYTogJHtwbGFubmluZ0NvbnRleHQucGFyYW1ldGVycy5mb2N1c0FyZWF9YCk7XG4gICAgY29uc29sZS5sb2coYC0gSW52ZXN0bWVudCBBbW91bnQ6ICQke3BsYW5uaW5nQ29udGV4dC5wYXJhbWV0ZXJzLmludmVzdG1lbnRBbW91bnQudG9Mb2NhbGVTdHJpbmcoKX1gKTtcbiAgICBjb25zb2xlLmxvZyhgLSBSaXNrIFRvbGVyYW5jZTogJHtwbGFubmluZ0NvbnRleHQudXNlclByZWZlcmVuY2VzPy5yaXNrVG9sZXJhbmNlfWApO1xuICAgIGNvbnNvbGUubG9nKGAtIFRpbWUgTGltaXQ6ICR7cGxhbm5pbmdDb250ZXh0LmNvbnN0cmFpbnRzPy50aW1lTGltaXR9bXNcXG5gKTtcblxuICAgIC8vIFN0ZXAgMTogQ3JlYXRlIFJlc2VhcmNoIFBsYW5cbiAgICBjb25zb2xlLmxvZygn8J+UjSBTdGVwIDE6IENyZWF0aW5nIFJlc2VhcmNoIFBsYW4uLi4nKTtcbiAgICBjb25zdCByZXNlYXJjaFBsYW4gPSBhd2FpdCBwbGFubmluZ0FnZW50LmNyZWF0ZVJlc2VhcmNoUGxhbignY29udl9leGFtcGxlXzEyMycsIHBsYW5uaW5nQ29udGV4dCk7XG4gICAgXG4gICAgY29uc29sZS5sb2coYOKchSBSZXNlYXJjaCBQbGFuIENyZWF0ZWQgKElEOiAke3Jlc2VhcmNoUGxhbi5pZH0pYCk7XG4gICAgY29uc29sZS5sb2coYC0gT2JqZWN0aXZlczogJHtyZXNlYXJjaFBsYW4ub2JqZWN0aXZlcy5sZW5ndGh9YCk7XG4gICAgcmVzZWFyY2hQbGFuLm9iamVjdGl2ZXMuZm9yRWFjaCgob2JqLCBpKSA9PiBjb25zb2xlLmxvZyhgICAke2kgKyAxfS4gJHtvYmp9YCkpO1xuICAgIGNvbnNvbGUubG9nKGAtIFJlc2VhcmNoIFF1ZXN0aW9uczogJHtyZXNlYXJjaFBsYW4ucmVzZWFyY2hRdWVzdGlvbnMubGVuZ3RofWApO1xuICAgIHJlc2VhcmNoUGxhbi5yZXNlYXJjaFF1ZXN0aW9ucy5mb3JFYWNoKChxLCBpKSA9PiBjb25zb2xlLmxvZyhgICAke2kgKyAxfS4gJHtxfWApKTtcbiAgICBjb25zb2xlLmxvZyhgLSBEYXRhIFNvdXJjZXM6ICR7cmVzZWFyY2hQbGFuLmRhdGFTb3VyY2VzLmxlbmd0aH1gKTtcbiAgICByZXNlYXJjaFBsYW4uZGF0YVNvdXJjZXMuZm9yRWFjaCgoZHMsIGkpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGAgICR7aSArIDF9LiAke2RzLnNvdXJjZX0gKCR7ZHMudHlwZX0sICR7ZHMucHJpb3JpdHl9IHByaW9yaXR5LCAke2RzLmVzdGltYXRlZFRpbWV9bXMpYCk7XG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coYC0gTWV0aG9kb2xvZ3k6ICR7cmVzZWFyY2hQbGFuLm1ldGhvZG9sb2d5fWApO1xuICAgIGNvbnNvbGUubG9nKGAtIFN0YXR1czogJHtyZXNlYXJjaFBsYW4uc3RhdHVzfVxcbmApO1xuXG4gICAgLy8gU3RlcCAyOiBDcmVhdGUgQW5hbHlzaXMgUGxhblxuICAgIGNvbnNvbGUubG9nKCfwn5OKIFN0ZXAgMjogQ3JlYXRpbmcgQW5hbHlzaXMgUGxhbi4uLicpO1xuICAgIGNvbnN0IGFuYWx5c2lzUGxhbiA9IGF3YWl0IHBsYW5uaW5nQWdlbnQuY3JlYXRlQW5hbHlzaXNQbGFuKCdjb252X2V4YW1wbGVfMTIzJywgcGxhbm5pbmdDb250ZXh0LCByZXNlYXJjaFBsYW4pO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKGDinIUgQW5hbHlzaXMgUGxhbiBDcmVhdGVkIChJRDogJHthbmFseXNpc1BsYW4uaWR9KWApO1xuICAgIGNvbnNvbGUubG9nKGAtIEFuYWx5c2lzIFR5cGU6ICR7YW5hbHlzaXNQbGFuLmFuYWx5c2lzVHlwZX1gKTtcbiAgICBjb25zb2xlLmxvZyhgLSBBbmFseXNpcyBTdGVwczogJHthbmFseXNpc1BsYW4uYW5hbHlzaXNTdGVwcy5sZW5ndGh9YCk7XG4gICAgYW5hbHlzaXNQbGFuLmFuYWx5c2lzU3RlcHMuZm9yRWFjaCgoc3RlcCwgaSkgPT4ge1xuICAgICAgY29uc29sZS5sb2coYCAgJHtpICsgMX0uICR7c3RlcC5zdGVwfSAoJHtzdGVwLmFnZW50fSBhZ2VudCwgJHtzdGVwLmVzdGltYXRlZFRpbWV9bXMpYCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgICBEZXNjcmlwdGlvbjogJHtzdGVwLmRlc2NyaXB0aW9ufWApO1xuICAgICAgY29uc29sZS5sb2coYCAgICAgRXhwZWN0ZWQgT3V0cHV0OiAke3N0ZXAuZXhwZWN0ZWRPdXRwdXR9YCk7XG4gICAgICBpZiAoc3RlcC5kZXBlbmRlbmNpZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgICAgICBEZXBlbmRlbmNpZXM6ICR7c3RlcC5kZXBlbmRlbmNpZXMuam9pbignLCAnKX1gKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBjb25zb2xlLmxvZyhgLSBLZXkgTWV0cmljczogJHthbmFseXNpc1BsYW4ubWV0cmljcy5qb2luKCcsICcpfWApO1xuICAgIGNvbnNvbGUubG9nKGAtIENvbmZpZGVuY2UgVGhyZXNob2xkczogTWluICR7YW5hbHlzaXNQbGFuLmNvbmZpZGVuY2VUaHJlc2hvbGRzLm1pbmltdW19LCBUYXJnZXQgJHthbmFseXNpc1BsYW4uY29uZmlkZW5jZVRocmVzaG9sZHMudGFyZ2V0fWApO1xuICAgIGNvbnNvbGUubG9nKGAtIFN0YXR1czogJHthbmFseXNpc1BsYW4uc3RhdHVzfVxcbmApO1xuXG4gICAgLy8gU3RlcCAzOiBBbmFseXplIERlcGVuZGVuY2llc1xuICAgIGNvbnNvbGUubG9nKCfwn5SXIFN0ZXAgMzogQW5hbHl6aW5nIFRhc2sgRGVwZW5kZW5jaWVzLi4uJyk7XG4gICAgY29uc3QgZGVwZW5kZW5jaWVzID0gYXdhaXQgcGxhbm5pbmdBZ2VudC5hbmFseXplRGVwZW5kZW5jaWVzKHJlc2VhcmNoUGxhbiwgYW5hbHlzaXNQbGFuKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZyhg4pyFIERlcGVuZGVuY2llcyBBbmFseXplZCAoJHtkZXBlbmRlbmNpZXMuc2l6ZX0gdGFza3MpYCk7XG4gICAgY29uc29sZS5sb2coJ1Rhc2sgRGVwZW5kZW5jeSBHcmFwaDonKTtcbiAgICBkZXBlbmRlbmNpZXMuZm9yRWFjaCgoZGVwLCB0YXNrSWQpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGAtICR7dGFza0lkfTpgKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgIER1cmF0aW9uOiAke2RlcC5lc3RpbWF0ZWREdXJhdGlvbn1tc2ApO1xuICAgICAgY29uc29sZS5sb2coYCAgQ3JpdGljYWwgUGF0aDogJHtkZXAuY3JpdGljYWxQYXRoID8gJ1llcycgOiAnTm8nfWApO1xuICAgICAgaWYgKGRlcC5kZXBlbmRzT24ubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgICBEZXBlbmRzIE9uOiAke2RlcC5kZXBlbmRzT24uam9pbignLCAnKX1gKTtcbiAgICAgIH1cbiAgICAgIGlmIChkZXAuYmxvY2tlZEJ5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc29sZS5sb2coYCAgQmxvY2tzOiAke2RlcC5ibG9ja2VkQnkuam9pbignLCAnKX1gKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBjb25zb2xlLmxvZygpO1xuXG4gICAgLy8gU3RlcCA0OiBFc3RpbWF0ZSBSZXNvdXJjZXNcbiAgICBjb25zb2xlLmxvZygn4pqhIFN0ZXAgNDogRXN0aW1hdGluZyBSZXNvdXJjZSBSZXF1aXJlbWVudHMuLi4nKTtcbiAgICBjb25zdCByZXNvdXJjZUVzdGltYXRpb24gPSBhd2FpdCBwbGFubmluZ0FnZW50LmVzdGltYXRlUmVzb3VyY2VzKHJlc2VhcmNoUGxhbiwgYW5hbHlzaXNQbGFuLCBkZXBlbmRlbmNpZXMpO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKGDinIUgUmVzb3VyY2UgRXN0aW1hdGlvbiBDb21wbGV0ZWApO1xuICAgIGNvbnNvbGUubG9nKGAtIFRvdGFsIEVzdGltYXRlZCBUaW1lOiAke3Jlc291cmNlRXN0aW1hdGlvbi50b3RhbEVzdGltYXRlZFRpbWV9bXMgKCR7KHJlc291cmNlRXN0aW1hdGlvbi50b3RhbEVzdGltYXRlZFRpbWUgLyAxMDAwKS50b0ZpeGVkKDEpfXMpYCk7XG4gICAgY29uc29sZS5sb2coJy0gQWdlbnQgQWxsb2NhdGlvbnM6Jyk7XG4gICAgcmVzb3VyY2VFc3RpbWF0aW9uLmFnZW50QWxsb2NhdGlvbnMuZm9yRWFjaChhbGxvYyA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhgICAke2FsbG9jLmFnZW50fTogJHthbGxvYy5lc3RpbWF0ZWRUaW1lfW1zLCAke2FsbG9jLnRhc2tDb3VudH0gdGFza3MsICR7KGFsbG9jLnV0aWxpemF0aW9uUmF0ZSAqIDEwMCkudG9GaXhlZCgwKX0lIHV0aWxpemF0aW9uYCk7XG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coJy0gRGF0YSBSZXF1aXJlbWVudHM6Jyk7XG4gICAgcmVzb3VyY2VFc3RpbWF0aW9uLmRhdGFSZXF1aXJlbWVudHMuZm9yRWFjaChyZXEgPT4ge1xuICAgICAgY29uc29sZS5sb2coYCAgJHtyZXEuc291cmNlfTogJHtyZXEudm9sdW1lfSB2b2x1bWUsICR7cmVxLnByb2Nlc3NpbmdUaW1lfW1zIHByb2Nlc3NpbmdgKTtcbiAgICB9KTtcbiAgICBjb25zb2xlLmxvZygnLSBDb21wdXRhdGlvbmFsIFJlcXVpcmVtZW50czonKTtcbiAgICBjb25zb2xlLmxvZyhgICBNb2RlbCBDYWxsczogJHtyZXNvdXJjZUVzdGltYXRpb24uY29tcHV0YXRpb25hbFJlcXVpcmVtZW50cy5tb2RlbENhbGxzfWApO1xuICAgIGNvbnNvbGUubG9nKGAgIEVzdGltYXRlZCBDb3N0OiAkJHtyZXNvdXJjZUVzdGltYXRpb24uY29tcHV0YXRpb25hbFJlcXVpcmVtZW50cy5lc3RpbWF0ZWRDb3N0LnRvRml4ZWQoMil9YCk7XG4gICAgY29uc29sZS5sb2coYCAgTWVtb3J5OiAke3Jlc291cmNlRXN0aW1hdGlvbi5jb21wdXRhdGlvbmFsUmVxdWlyZW1lbnRzLm1lbW9yeVJlcXVpcmVtZW50c31gKTtcbiAgICBjb25zb2xlLmxvZygnLSBSaXNrIEZhY3RvcnM6Jyk7XG4gICAgcmVzb3VyY2VFc3RpbWF0aW9uLnJpc2tGYWN0b3JzLmZvckVhY2gocmlzayA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhgICAke3Jpc2suZmFjdG9yfSAoJHtyaXNrLmltcGFjdH0gaW1wYWN0KTogJHtyaXNrLm1pdGlnYXRpb259YCk7XG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coKTtcblxuICAgIC8vIFN0ZXAgNTogU2ltdWxhdGUgSW50ZXJtZWRpYXRlIEZpbmRpbmdzIGFuZCBQbGFuIEFkYXB0YXRpb25cbiAgICBjb25zb2xlLmxvZygn8J+UhCBTdGVwIDU6IFNpbXVsYXRpbmcgUGxhbiBBZGFwdGF0aW9uLi4uJyk7XG4gICAgXG4gICAgLy8gU2ltdWxhdGUgaW50ZXJtZWRpYXRlIGZpbmRpbmdzIHRoYXQgbWlnaHQgdHJpZ2dlciBwbGFuIGFkYXB0YXRpb25cbiAgICBjb25zdCBpbnRlcm1lZGlhdGVGaW5kaW5ncyA9IHtcbiAgICAgIG1hcmtldFZvbGF0aWxpdHk6ICdpbmNyZWFzZWQnLFxuICAgICAgc2VjdG9yUGVyZm9ybWFuY2U6IHtcbiAgICAgICAgdGVjaG5vbG9neTogJ291dHBlcmZvcm1pbmcnLFxuICAgICAgICBhcnRpZmljaWFsSW50ZWxsaWdlbmNlOiAnaGlnaC1ncm93dGgtcG90ZW50aWFsJ1xuICAgICAgfSxcbiAgICAgIHJlZ3VsYXRvcnlDaGFuZ2VzOiAnbmV3LWFpLXJlZ3VsYXRpb25zLXByb3Bvc2VkJyxcbiAgICAgIGRhdGFRdWFsaXR5OiB7XG4gICAgICAgIG1hcmtldERhdGE6ICdleGNlbGxlbnQnLFxuICAgICAgICBhbmFseXN0UmVwb3J0czogJ2xpbWl0ZWQtYXZhaWxhYmlsaXR5J1xuICAgICAgfSxcbiAgICAgIGNvbXBldGl0aXZlQW5hbHlzaXM6IHtcbiAgICAgICAga2V5UGxheWVyczogWydOVklESUEnLCAnTWljcm9zb2Z0JywgJ0dvb2dsZScsICdPcGVuQUknXSxcbiAgICAgICAgbWFya2V0Q29uY2VudHJhdGlvbjogJ2hpZ2gnXG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IGFkYXB0YXRpb24gPSBhd2FpdCBwbGFubmluZ0FnZW50LmFkYXB0UGxhbihcbiAgICAgIHJlc2VhcmNoUGxhbi5pZCxcbiAgICAgICdyZXNlYXJjaCcsXG4gICAgICBpbnRlcm1lZGlhdGVGaW5kaW5ncyxcbiAgICAgICdNYXJrZXQgdm9sYXRpbGl0eSBpbmNyZWFzZWQgYW5kIG5ldyBBSSByZWd1bGF0aW9ucyBwcm9wb3NlZCdcbiAgICApO1xuXG4gICAgY29uc29sZS5sb2coYOKchSBQbGFuIEFkYXB0YXRpb24gQ3JlYXRlZCAoSUQ6ICR7YWRhcHRhdGlvbi5hZGFwdGF0aW9uSWR9KWApO1xuICAgIGNvbnNvbGUubG9nKGAtIE9yaWdpbmFsIFBsYW46ICR7YWRhcHRhdGlvbi5vcmlnaW5hbFBsYW5JZH1gKTtcbiAgICBjb25zb2xlLmxvZyhgLSBUcmlnZ2VyOiAke2FkYXB0YXRpb24udHJpZ2dlcn1gKTtcbiAgICBjb25zb2xlLmxvZyhgLSBBcHByb3ZhbCBSZXF1aXJlZDogJHthZGFwdGF0aW9uLmFwcHJvdmFsUmVxdWlyZWQgPyAnWWVzJyA6ICdObyd9YCk7XG4gICAgY29uc29sZS5sb2coYC0gSnVzdGlmaWNhdGlvbjogJHthZGFwdGF0aW9uLmp1c3RpZmljYXRpb259YCk7XG4gICAgY29uc29sZS5sb2coJy0gQ2hhbmdlczonKTtcbiAgICBhZGFwdGF0aW9uLmNoYW5nZXMuZm9yRWFjaCgoY2hhbmdlLCBpKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhgICAke2kgKyAxfS4gJHtjaGFuZ2UudHlwZS50b1VwcGVyQ2FzZSgpfSAke2NoYW5nZS50YXJnZXR9OiAke2NoYW5nZS5kZXNjcmlwdGlvbn1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICAgIEltcGFjdDogJHtjaGFuZ2UuaW1wYWN0fWApO1xuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKCctIFVwZGF0ZWQgUmVzb3VyY2UgRXN0aW1hdGlvbjonKTtcbiAgICBjb25zb2xlLmxvZyhgICBUb3RhbCBUaW1lOiAke2FkYXB0YXRpb24ubmV3RXN0aW1hdGlvbnMudG90YWxFc3RpbWF0ZWRUaW1lfW1zICgkeyhhZGFwdGF0aW9uLm5ld0VzdGltYXRpb25zLnRvdGFsRXN0aW1hdGVkVGltZSAvIDEwMDApLnRvRml4ZWQoMSl9cylgKTtcbiAgICBjb25zb2xlLmxvZygpO1xuXG4gICAgLy8gU3RlcCA2OiBEZW1vbnN0cmF0ZSBQbGFuIFJldHJpZXZhbFxuICAgIGNvbnNvbGUubG9nKCfwn5OWIFN0ZXAgNjogRGVtb25zdHJhdGluZyBQbGFuIFJldHJpZXZhbC4uLicpO1xuICAgIFxuICAgIGNvbnN0IHJldHJpZXZlZFJlc2VhcmNoUGxhbiA9IHBsYW5uaW5nQWdlbnQuZ2V0UmVzZWFyY2hQbGFuKHJlc2VhcmNoUGxhbi5pZCk7XG4gICAgY29uc3QgcmV0cmlldmVkQW5hbHlzaXNQbGFuID0gcGxhbm5pbmdBZ2VudC5nZXRBbmFseXNpc1BsYW4oYW5hbHlzaXNQbGFuLmlkKTtcbiAgICBjb25zdCByZXRyaWV2ZWREZXBlbmRlbmNpZXMgPSBwbGFubmluZ0FnZW50LmdldFRhc2tEZXBlbmRlbmNpZXMoKTtcbiAgICBjb25zdCByZXRyaWV2ZWRFc3RpbWF0aW9uID0gcGxhbm5pbmdBZ2VudC5nZXRSZXNvdXJjZUVzdGltYXRpb24oJ2NvbnZfZXhhbXBsZV8xMjMnKTtcbiAgICBjb25zdCByZXRyaWV2ZWRBZGFwdGF0aW9ucyA9IHBsYW5uaW5nQWdlbnQuZ2V0UGxhbkFkYXB0YXRpb25zKCk7XG5cbiAgICBjb25zb2xlLmxvZyhg4pyFIFBsYW4gUmV0cmlldmFsIENvbXBsZXRlYCk7XG4gICAgY29uc29sZS5sb2coYC0gUmVzZWFyY2ggUGxhbjogJHtyZXRyaWV2ZWRSZXNlYXJjaFBsYW4gPyAnRm91bmQnIDogJ05vdCBGb3VuZCd9YCk7XG4gICAgY29uc29sZS5sb2coYC0gQW5hbHlzaXMgUGxhbjogJHtyZXRyaWV2ZWRBbmFseXNpc1BsYW4gPyAnRm91bmQnIDogJ05vdCBGb3VuZCd9YCk7XG4gICAgY29uc29sZS5sb2coYC0gRGVwZW5kZW5jaWVzOiAke3JldHJpZXZlZERlcGVuZGVuY2llcy5zaXplfSB0YXNrc2ApO1xuICAgIGNvbnNvbGUubG9nKGAtIFJlc291cmNlIEVzdGltYXRpb246ICR7cmV0cmlldmVkRXN0aW1hdGlvbiA/ICdGb3VuZCcgOiAnTm90IEZvdW5kJ31gKTtcbiAgICBjb25zb2xlLmxvZyhgLSBBZGFwdGF0aW9uczogJHtyZXRyaWV2ZWRBZGFwdGF0aW9ucy5zaXplfSBhZGFwdGF0aW9uc2ApO1xuICAgIGNvbnNvbGUubG9nKCk7XG5cbiAgICBjb25zb2xlLmxvZygn8J+OiSBQbGFubmluZyBBZ2VudCBXb3JrZmxvdyBDb21wbGV0ZSFcXG4nKTtcbiAgICBjb25zb2xlLmxvZygnU3VtbWFyeTonKTtcbiAgICBjb25zb2xlLmxvZyhgLSBDcmVhdGVkIGNvbXByZWhlbnNpdmUgcmVzZWFyY2ggcGxhbiB3aXRoICR7cmVzZWFyY2hQbGFuLmRhdGFTb3VyY2VzLmxlbmd0aH0gZGF0YSBzb3VyY2VzYCk7XG4gICAgY29uc29sZS5sb2coYC0gRGV2ZWxvcGVkIGRldGFpbGVkIGFuYWx5c2lzIHBsYW4gd2l0aCAke2FuYWx5c2lzUGxhbi5hbmFseXNpc1N0ZXBzLmxlbmd0aH0gc3RlcHNgKTtcbiAgICBjb25zb2xlLmxvZyhgLSBBbmFseXplZCAke2RlcGVuZGVuY2llcy5zaXplfSB0YXNrIGRlcGVuZGVuY2llc2ApO1xuICAgIGNvbnNvbGUubG9nKGAtIEVzdGltYXRlZCB0b3RhbCB0aW1lOiAkeyhyZXNvdXJjZUVzdGltYXRpb24udG90YWxFc3RpbWF0ZWRUaW1lIC8gMTAwMCkudG9GaXhlZCgxKX1zYCk7XG4gICAgY29uc29sZS5sb2coYC0gQWRhcHRlZCBwbGFuIGJhc2VkIG9uIGludGVybWVkaWF0ZSBmaW5kaW5nc2ApO1xuICAgIGNvbnNvbGUubG9nKGAtIEFsbCBwbGFucyBhbmQgZGF0YSBzdWNjZXNzZnVsbHkgc3RvcmVkIGFuZCByZXRyaWV2YWJsZWApO1xuXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcign4p2MIEVycm9yIGluIHBsYW5uaW5nIHdvcmtmbG93OicsIGVycm9yKTtcbiAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZGV0YWlsczonLCBlcnJvci5tZXNzYWdlKTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1N0YWNrIHRyYWNlOicsIGVycm9yLnN0YWNrKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBFeGFtcGxlOiBNZXNzYWdlLWJhc2VkIGludGVyYWN0aW9uIHdpdGggUGxhbm5pbmcgQWdlbnRcbiAqL1xuYXN5bmMgZnVuY3Rpb24gZGVtb25zdHJhdGVNZXNzYWdlUHJvY2Vzc2luZygpIHtcbiAgY29uc29sZS5sb2coJ1xcbvCfk6ggUGxhbm5pbmcgQWdlbnQgRXhhbXBsZSAtIE1lc3NhZ2UgUHJvY2Vzc2luZ1xcbicpO1xuXG4gIHRyeSB7XG4gICAgLy8gSW5pdGlhbGl6ZSBzZXJ2aWNlc1xuICAgIGNvbnN0IGJlZHJvY2tDbGllbnQgPSBuZXcgQmVkcm9ja0NsaWVudFNlcnZpY2UoKTtcbiAgICBjb25zdCBjbGF1ZGVTb25uZXRTZXJ2aWNlID0gbmV3IENsYXVkZVNvbm5ldFNlcnZpY2UoYmVkcm9ja0NsaWVudCk7XG4gICAgY29uc3QgcGxhbm5pbmdBZ2VudCA9IG5ldyBQbGFubmluZ0FnZW50KGNsYXVkZVNvbm5ldFNlcnZpY2UpO1xuXG4gICAgLy8gRXhhbXBsZSBtZXNzYWdlIGZvciBjcmVhdGluZyBhIHJlc2VhcmNoIHBsYW5cbiAgICBjb25zdCByZXNlYXJjaFBsYW5NZXNzYWdlID0ge1xuICAgICAgc2VuZGVyOiAnc3VwZXJ2aXNvcicgYXMgY29uc3QsXG4gICAgICByZWNpcGllbnQ6ICdwbGFubmluZycgYXMgY29uc3QsXG4gICAgICBtZXNzYWdlVHlwZTogJ3JlcXVlc3QnIGFzIGNvbnN0LFxuICAgICAgY29udGVudDoge1xuICAgICAgICB0YXNrVHlwZTogUGxhbm5pbmdUYXNrVHlwZS5SRVNFQVJDSF9QTEFOLFxuICAgICAgICBjb252ZXJzYXRpb25JZDogJ2NvbnZfbWVzc2FnZV9leGFtcGxlJyxcbiAgICAgICAgY29udGV4dDoge1xuICAgICAgICAgIHJlcXVlc3RUeXBlOiAnbWFya2V0LWFuYWx5c2lzJyxcbiAgICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgICBtYXJrZXQ6ICdjcnlwdG9jdXJyZW5jeScsXG4gICAgICAgICAgICBmb2N1czogJ0RlRmkgcHJvdG9jb2xzJyxcbiAgICAgICAgICAgIHRpbWVmcmFtZTogJ1ExIDIwMjQnXG4gICAgICAgICAgfSxcbiAgICAgICAgICB1c2VyUHJlZmVyZW5jZXM6IHtcbiAgICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiAnc2hvcnQnLFxuICAgICAgICAgICAgcmlza1RvbGVyYW5jZTogJ2FnZ3Jlc3NpdmUnLFxuICAgICAgICAgICAgc2VjdG9yczogWydjcnlwdG9jdXJyZW5jeScsICdibG9ja2NoYWluJ11cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBtZXRhZGF0YToge1xuICAgICAgICBwcmlvcml0eTogJ2hpZ2gnIGFzIGNvbnN0LFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIGNvbnZlcnNhdGlvbklkOiAnY29udl9tZXNzYWdlX2V4YW1wbGUnLFxuICAgICAgICByZXF1ZXN0SWQ6ICdyZXFfcmVzZWFyY2hfcGxhbl8wMDEnXG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnNvbGUubG9nKCfwn5OkIFNlbmRpbmcgUmVzZWFyY2ggUGxhbiBSZXF1ZXN0Li4uJyk7XG4gICAgY29uc29sZS5sb2coYE1lc3NhZ2UgVHlwZTogJHtyZXNlYXJjaFBsYW5NZXNzYWdlLm1lc3NhZ2VUeXBlfWApO1xuICAgIGNvbnNvbGUubG9nKGBUYXNrIFR5cGU6ICR7cmVzZWFyY2hQbGFuTWVzc2FnZS5jb250ZW50LnRhc2tUeXBlfWApO1xuICAgIGNvbnNvbGUubG9nKGBQcmlvcml0eTogJHtyZXNlYXJjaFBsYW5NZXNzYWdlLm1ldGFkYXRhLnByaW9yaXR5fWApO1xuXG4gICAgY29uc3QgcmVzZWFyY2hQbGFuUmVzcG9uc2UgPSBhd2FpdCBwbGFubmluZ0FnZW50LnByb2Nlc3NNZXNzYWdlKHJlc2VhcmNoUGxhbk1lc3NhZ2UpO1xuXG4gICAgY29uc29sZS5sb2coJ1xcbvCfk6UgUmVzZWFyY2ggUGxhbiBSZXNwb25zZSBSZWNlaXZlZDonKTtcbiAgICBjb25zb2xlLmxvZyhgU3VjY2VzczogJHtyZXNlYXJjaFBsYW5SZXNwb25zZS5jb250ZW50LnN1Y2Nlc3N9YCk7XG4gICAgY29uc29sZS5sb2coYFJlc3BvbnNlIFR5cGU6ICR7cmVzZWFyY2hQbGFuUmVzcG9uc2UubWVzc2FnZVR5cGV9YCk7XG4gICAgXG4gICAgaWYgKHJlc2VhcmNoUGxhblJlc3BvbnNlLmNvbnRlbnQuc3VjY2Vzcykge1xuICAgICAgY29uc3QgcGxhbiA9IHJlc2VhcmNoUGxhblJlc3BvbnNlLmNvbnRlbnQucmVzdWx0O1xuICAgICAgY29uc29sZS5sb2coYFBsYW4gSUQ6ICR7cGxhbi5pZH1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGBPYmplY3RpdmVzOiAke3BsYW4ub2JqZWN0aXZlcy5sZW5ndGh9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgRGF0YSBTb3VyY2VzOiAke3BsYW4uZGF0YVNvdXJjZXMubGVuZ3RofWApO1xuICAgICAgY29uc29sZS5sb2coYFN0YXR1czogJHtwbGFuLnN0YXR1c31gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coYEVycm9yOiAke3Jlc2VhcmNoUGxhblJlc3BvbnNlLmNvbnRlbnQuZXJyb3J9YCk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coJ1xcbuKchSBNZXNzYWdlIFByb2Nlc3NpbmcgRXhhbXBsZSBDb21wbGV0ZSEnKTtcblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCBFcnJvciBpbiBtZXNzYWdlIHByb2Nlc3NpbmcgZXhhbXBsZTonLCBlcnJvcik7XG4gIH1cbn1cblxuLyoqXG4gKiBSdW4gYWxsIGV4YW1wbGVzXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJ1bkV4YW1wbGVzKCkge1xuICBjb25zb2xlLmxvZygn8J+agCBTdGFydGluZyBQbGFubmluZyBBZ2VudCBFeGFtcGxlcy4uLlxcbicpO1xuICBcbiAgYXdhaXQgZGVtb25zdHJhdGVQbGFubmluZ1dvcmtmbG93KCk7XG4gIGF3YWl0IGRlbW9uc3RyYXRlTWVzc2FnZVByb2Nlc3NpbmcoKTtcbiAgXG4gIGNvbnNvbGUubG9nKCdcXG7wn4+BIEFsbCBQbGFubmluZyBBZ2VudCBFeGFtcGxlcyBDb21wbGV0ZSEnKTtcbn1cblxuLy8gUnVuIGV4YW1wbGVzIGlmIHRoaXMgZmlsZSBpcyBleGVjdXRlZCBkaXJlY3RseVxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIHJ1bkV4YW1wbGVzKCkuY2F0Y2goY29uc29sZS5lcnJvcik7XG59XG5cbmV4cG9ydCB7XG4gIGRlbW9uc3RyYXRlUGxhbm5pbmdXb3JrZmxvdyxcbiAgZGVtb25zdHJhdGVNZXNzYWdlUHJvY2Vzc2luZyxcbiAgcnVuRXhhbXBsZXNcbn07Il19