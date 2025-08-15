/**
 * Example usage of the SupervisorAgent
 * 
 * This example demonstrates how to use the SupervisorAgent to coordinate
 * multi-agent workflows for investment analysis.
 */

import { SupervisorAgent } from '../services/ai/supervisor-agent';
import { ClaudeSonnetService } from '../services/ai/claude-sonnet-service';
import { ModelSelectionServiceImpl, createModelSelectionService } from '../services/ai/model-selection-service';
import { BedrockClientService } from '../services/ai/bedrock-client';
import { BedrockModelId } from '../models/bedrock';

async function runSupervisorAgentExample() {
  console.log('🤖 Supervisor Agent Example');
  console.log('============================\n');

  try {
    // Initialize services
    console.log('1. Initializing services...');
    const bedrockClient = new BedrockClientService();
    const claudeSonnetService = new ClaudeSonnetService(bedrockClient);
    const modelSelectionService = createModelSelectionService();
    
    // Create supervisor agent
    const supervisorAgent = new SupervisorAgent(
      claudeSonnetService,
      modelSelectionService
    );
    
    console.log('✅ Services initialized successfully\n');

    // Example 1: Process investment idea generation request
    console.log('2. Processing investment idea generation request...');
    const investmentRequest = await supervisorAgent.processUserRequest(
      'user123',
      'investment-idea-generation',
      {
        riskTolerance: 'moderate',
        investmentHorizon: 'long',
        sectors: ['technology', 'healthcare'],
        excludedInvestments: ['cryptocurrency'],
        minimumConfidence: 0.7
      }
    );
    
    console.log('✅ Request processed successfully');
    console.log(`   Conversation ID: ${investmentRequest.id}`);
    console.log(`   Current Phase: ${investmentRequest.currentPhase}`);
    console.log(`   Tasks Created: ${investmentRequest.tasks.length}`);
    console.log('');

    // Example 2: Check agent statuses
    console.log('3. Checking agent statuses...');
    const agentTypes = ['supervisor', 'planning', 'research', 'analysis', 'compliance', 'synthesis'] as const;
    
    agentTypes.forEach(agentType => {
      const status = supervisorAgent.getAgentStatus(agentType);
      if (status) {
        console.log(`   ${agentType.toUpperCase()}: ${status.status} (${status.currentTasks.length} tasks)`);
      }
    });
    console.log('');

    // Example 3: Demonstrate task delegation
    console.log('4. Demonstrating task delegation...');
    const sampleTask = {
      id: 'demo-task-001',
      type: 'text-generation' as const,
      complexity: 'medium' as const,
      domain: 'financial' as const,
      priority: 'high' as const,
      agentRole: 'research' as const,
      description: 'Gather market data for technology sector',
      parameters: { sector: 'technology', timeframe: '1Y' },
      dependencies: [],
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const delegationResult = await supervisorAgent.delegateTask(sampleTask);
    console.log(`   Task delegation: ${delegationResult.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Assigned to: ${delegationResult.assignedTo}`);
    console.log(`   Estimated completion: ${delegationResult.estimatedCompletion.toISOString()}`);
    console.log('');

    // Example 4: Message queue management
    console.log('5. Demonstrating message queue...');
    supervisorAgent.sendMessage({
      sender: 'supervisor',
      recipient: 'research',
      messageType: 'request',
      content: { instruction: 'Begin market analysis' },
      metadata: {
        priority: 'high',
        timestamp: new Date(),
        conversationId: investmentRequest.id,
        requestId: 'req-001'
      }
    });

    const messageQueue = supervisorAgent.getMessageQueue();
    console.log(`   Messages in queue: ${messageQueue.length}`);
    console.log('');

    // Example 5: Conversation context retrieval
    console.log('6. Retrieving conversation context...');
    const context = supervisorAgent.getConversationContext(investmentRequest.id);
    if (context) {
      console.log(`   ✅ Context found for conversation: ${context.id}`);
      console.log(`   User ID: ${context.userId}`);
      console.log(`   Request Type: ${context.requestType}`);
      console.log(`   Messages: ${context.messages.length}`);
      console.log(`   Tasks: ${context.tasks.length}`);
    }
    console.log('');

    // Example 6: Active conversations overview
    console.log('7. Active conversations overview...');
    const activeConversations = supervisorAgent.getActiveConversations();
    console.log(`   Total active conversations: ${activeConversations.length}`);
    
    activeConversations.forEach((conv, index) => {
      console.log(`   ${index + 1}. ${conv.id} - Phase: ${conv.currentPhase} - Tasks: ${conv.tasks.length}`);
    });
    console.log('');

    // Example 7: Cleanup demonstration
    console.log('8. Cleanup demonstration...');
    console.log('   Before cleanup:', supervisorAgent.getActiveConversations().length, 'conversations');
    supervisorAgent.cleanupCompletedConversations(0); // Clean up all completed conversations
    console.log('   After cleanup:', supervisorAgent.getActiveConversations().length, 'conversations');
    console.log('');

    console.log('🎉 Supervisor Agent example completed successfully!');
    console.log('\nKey Features Demonstrated:');
    console.log('- ✅ Multi-agent workflow coordination');
    console.log('- ✅ Task delegation and management');
    console.log('- ✅ Context management and conversation tracking');
    console.log('- ✅ Message queue handling');
    console.log('- ✅ Agent status monitoring');
    console.log('- ✅ Conversation lifecycle management');

  } catch (error) {
    console.error('❌ Error running supervisor agent example:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n')
      });
    }
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  runSupervisorAgentExample()
    .then(() => {
      console.log('\n✨ Example execution completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Example execution failed:', error);
      process.exit(1);
    });
}

export { runSupervisorAgentExample };