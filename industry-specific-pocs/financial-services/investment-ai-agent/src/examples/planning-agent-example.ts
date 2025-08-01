/**
 * Planning Agent Example
 * 
 * This example demonstrates how to use the Planning Agent to create research plans,
 * analysis plans, analyze dependencies, estimate resources, and adapt plans based
 * on intermediate findings.
 */

import { 
  PlanningAgent, 
  PlanningTaskType, 
  PlanningContext 
} from '../services/ai/planning-agent';
import { ClaudeSonnetService } from '../services/ai/claude-sonnet-service';
import { BedrockClientService } from '../services/ai/bedrock-client';
import { BedrockModelId } from '../models/bedrock';

/**
 * Example: Complete planning workflow for investment analysis
 */
async function demonstratePlanningWorkflow() {
  console.log('🎯 Planning Agent Example - Investment Analysis Workflow\n');

  try {
    // Initialize services
    const bedrockClient = new BedrockClientService();
    const claudeSonnetService = new ClaudeSonnetService(bedrockClient);
    const planningAgent = new PlanningAgent(claudeSonnetService);

    // Define planning context
    const planningContext: PlanningContext = {
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
        timeLimit: 120000, // 2 minutes
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

    const adaptation = await planningAgent.adaptPlan(
      researchPlan.id,
      'research',
      intermediateFindings,
      'Market volatility increased and new AI regulations proposed'
    );

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

  } catch (error) {
    console.error('❌ Error in planning workflow:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

/**
 * Example: Message-based interaction with Planning Agent
 */
async function demonstrateMessageProcessing() {
  console.log('\n📨 Planning Agent Example - Message Processing\n');

  try {
    // Initialize services
    const bedrockClient = new BedrockClientService();
    const claudeSonnetService = new ClaudeSonnetService(bedrockClient);
    const planningAgent = new PlanningAgent(claudeSonnetService);

    // Example message for creating a research plan
    const researchPlanMessage = {
      sender: 'supervisor' as const,
      recipient: 'planning' as const,
      messageType: 'request' as const,
      content: {
        taskType: PlanningTaskType.RESEARCH_PLAN,
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
        priority: 'high' as const,
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
    } else {
      console.log(`Error: ${researchPlanResponse.content.error}`);
    }

    console.log('\n✅ Message Processing Example Complete!');

  } catch (error) {
    console.error('❌ Error in message processing example:', error);
  }
}

/**
 * Run all examples
 */
async function runExamples() {
  console.log('🚀 Starting Planning Agent Examples...\n');
  
  await demonstratePlanningWorkflow();
  await demonstrateMessageProcessing();
  
  console.log('\n🏁 All Planning Agent Examples Complete!');
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}

export {
  demonstratePlanningWorkflow,
  demonstrateMessageProcessing,
  runExamples
};