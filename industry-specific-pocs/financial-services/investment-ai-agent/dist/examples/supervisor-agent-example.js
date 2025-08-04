"use strict";
/**
 * Example usage of the SupervisorAgent
 *
 * This example demonstrates how to use the SupervisorAgent to coordinate
 * multi-agent workflows for investment analysis.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSupervisorAgentExample = void 0;
const supervisor_agent_1 = require("../services/ai/supervisor-agent");
const claude_sonnet_service_1 = require("../services/ai/claude-sonnet-service");
const model_selection_service_1 = require("../services/ai/model-selection-service");
const bedrock_client_1 = require("../services/ai/bedrock-client");
async function runSupervisorAgentExample() {
    console.log('🤖 Supervisor Agent Example');
    console.log('============================\n');
    try {
        // Initialize services
        console.log('1. Initializing services...');
        const bedrockClient = new bedrock_client_1.BedrockClientService();
        const claudeSonnetService = new claude_sonnet_service_1.ClaudeSonnetService(bedrockClient);
        const modelSelectionService = (0, model_selection_service_1.createModelSelectionService)();
        // Create supervisor agent
        const supervisorAgent = new supervisor_agent_1.SupervisorAgent(claudeSonnetService, modelSelectionService);
        console.log('✅ Services initialized successfully\n');
        // Example 1: Process investment idea generation request
        console.log('2. Processing investment idea generation request...');
        const investmentRequest = await supervisorAgent.processUserRequest('user123', 'investment-idea-generation', {
            riskTolerance: 'moderate',
            investmentHorizon: 'long',
            sectors: ['technology', 'healthcare'],
            excludedInvestments: ['cryptocurrency'],
            minimumConfidence: 0.7
        });
        console.log('✅ Request processed successfully');
        console.log(`   Conversation ID: ${investmentRequest.id}`);
        console.log(`   Current Phase: ${investmentRequest.currentPhase}`);
        console.log(`   Tasks Created: ${investmentRequest.tasks.length}`);
        console.log('');
        // Example 2: Check agent statuses
        console.log('3. Checking agent statuses...');
        const agentTypes = ['supervisor', 'planning', 'research', 'analysis', 'compliance', 'synthesis'];
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
            type: 'text-generation',
            complexity: 'medium',
            domain: 'financial',
            priority: 'high',
            agentRole: 'research',
            description: 'Gather market data for technology sector',
            parameters: { sector: 'technology', timeframe: '1Y' },
            dependencies: [],
            status: 'pending',
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
    }
    catch (error) {
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
exports.runSupervisorAgentExample = runSupervisorAgentExample;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VwZXJ2aXNvci1hZ2VudC1leGFtcGxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4YW1wbGVzL3N1cGVydmlzb3ItYWdlbnQtZXhhbXBsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7O0dBS0c7OztBQUVILHNFQUFrRTtBQUNsRSxnRkFBMkU7QUFDM0Usb0ZBQWdIO0FBQ2hILGtFQUFxRTtBQUdyRSxLQUFLLFVBQVUseUJBQXlCO0lBQ3RDLE9BQU8sQ0FBQyxHQUFHLENBQUMsNkJBQTZCLENBQUMsQ0FBQztJQUMzQyxPQUFPLENBQUMsR0FBRyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7SUFFOUMsSUFBSTtRQUNGLHNCQUFzQjtRQUN0QixPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLENBQUM7UUFDM0MsTUFBTSxhQUFhLEdBQUcsSUFBSSxxQ0FBb0IsRUFBRSxDQUFDO1FBQ2pELE1BQU0sbUJBQW1CLEdBQUcsSUFBSSwyQ0FBbUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNuRSxNQUFNLHFCQUFxQixHQUFHLElBQUEscURBQTJCLEdBQUUsQ0FBQztRQUU1RCwwQkFBMEI7UUFDMUIsTUFBTSxlQUFlLEdBQUcsSUFBSSxrQ0FBZSxDQUN6QyxtQkFBbUIsRUFDbkIscUJBQXFCLENBQ3RCLENBQUM7UUFFRixPQUFPLENBQUMsR0FBRyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7UUFFckQsd0RBQXdEO1FBQ3hELE9BQU8sQ0FBQyxHQUFHLENBQUMscURBQXFELENBQUMsQ0FBQztRQUNuRSxNQUFNLGlCQUFpQixHQUFHLE1BQU0sZUFBZSxDQUFDLGtCQUFrQixDQUNoRSxTQUFTLEVBQ1QsNEJBQTRCLEVBQzVCO1lBQ0UsYUFBYSxFQUFFLFVBQVU7WUFDekIsaUJBQWlCLEVBQUUsTUFBTTtZQUN6QixPQUFPLEVBQUUsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDO1lBQ3JDLG1CQUFtQixFQUFFLENBQUMsZ0JB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LENBQUM7UUFDM0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO0tBRXREO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLDJDQUEyQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRWxFLElBQUksS0FBSyxZQUFZLEtBQUssRUFBRTtZQUMxQixPQUFPLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFO2dCQUM5QixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7Z0JBQ2hCLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTztnQkFDdEIsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQzthQUN2RCxDQUFDLENBQUM7U0FDSjtLQUNGO0FBQ0gsQ0FBQztBQWVRLDhEQUF5QjtBQWJsQyxvREFBb0Q7QUFDcEQsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRTtJQUMzQix5QkFBeUIsRUFBRTtTQUN4QixJQUFJLENBQUMsR0FBRyxFQUFFO1FBQ1QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO1FBQy9DLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsQ0FBQyxDQUFDO1NBQ0QsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLGdDQUFnQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3ZELE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsQ0FBQyxDQUFDLENBQUM7Q0FDTiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogRXhhbXBsZSB1c2FnZSBvZiB0aGUgU3VwZXJ2aXNvckFnZW50XG4gKiBcbiAqIFRoaXMgZXhhbXBsZSBkZW1vbnN0cmF0ZXMgaG93IHRvIHVzZSB0aGUgU3VwZXJ2aXNvckFnZW50IHRvIGNvb3JkaW5hdGVcbiAqIG11bHRpLWFnZW50IHdvcmtmbG93cyBmb3IgaW52ZXN0bWVudCBhbmFseXNpcy5cbiAqL1xuXG5pbXBvcnQgeyBTdXBlcnZpc29yQWdlbnQgfSBmcm9tICcuLi9zZXJ2aWNlcy9haS9zdXBlcnZpc29yLWFnZW50JztcbmltcG9ydCB7IENsYXVkZVNvbm5ldFNlcnZpY2UgfSBmcm9tICcuLi9zZXJ2aWNlcy9haS9jbGF1ZGUtc29ubmV0LXNlcnZpY2UnO1xuaW1wb3J0IHsgTW9kZWxTZWxlY3Rpb25TZXJ2aWNlSW1wbCwgY3JlYXRlTW9kZWxTZWxlY3Rpb25TZXJ2aWNlIH0gZnJvbSAnLi4vc2VydmljZXMvYWkvbW9kZWwtc2VsZWN0aW9uLXNlcnZpY2UnO1xuaW1wb3J0IHsgQmVkcm9ja0NsaWVudFNlcnZpY2UgfSBmcm9tICcuLi9zZXJ2aWNlcy9haS9iZWRyb2NrLWNsaWVudCc7XG5pbXBvcnQgeyBCZWRyb2NrTW9kZWxJZCB9IGZyb20gJy4uL21vZGVscy9iZWRyb2NrJztcblxuYXN5bmMgZnVuY3Rpb24gcnVuU3VwZXJ2aXNvckFnZW50RXhhbXBsZSgpIHtcbiAgY29uc29sZS5sb2coJ/CfpJYgU3VwZXJ2aXNvciBBZ2VudCBFeGFtcGxlJyk7XG4gIGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PT09PT09PT09XFxuJyk7XG5cbiAgdHJ5IHtcbiAgICAvLyBJbml0aWFsaXplIHNlcnZpY2VzXG4gICAgY29uc29sZS5sb2coJzEuIEluaXRpYWxpemluZyBzZXJ2aWNlcy4uLicpO1xuICAgIGNvbnN0IGJlZHJvY2tDbGllbnQgPSBuZXcgQmVkcm9ja0NsaWVudFNlcnZpY2UoKTtcbiAgICBjb25zdCBjbGF1ZGVTb25uZXRTZXJ2aWNlID0gbmV3IENsYXVkZVNvbm5ldFNlcnZpY2UoYmVkcm9ja0NsaWVudCk7XG4gICAgY29uc3QgbW9kZWxTZWxlY3Rpb25TZXJ2aWNlID0gY3JlYXRlTW9kZWxTZWxlY3Rpb25TZXJ2aWNlKCk7XG4gICAgXG4gICAgLy8gQ3JlYXRlIHN1cGVydmlzb3IgYWdlbnRcbiAgICBjb25zdCBzdXBlcnZpc29yQWdlbnQgPSBuZXcgU3VwZXJ2aXNvckFnZW50KFxuICAgICAgY2xhdWRlU29ubmV0U2VydmljZSxcbiAgICAgIG1vZGVsU2VsZWN0aW9uU2VydmljZVxuICAgICk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ+KchSBTZXJ2aWNlcyBpbml0aWFsaXplZCBzdWNjZXNzZnVsbHlcXG4nKTtcblxuICAgIC8vIEV4YW1wbGUgMTogUHJvY2VzcyBpbnZlc3RtZW50IGlkZWEgZ2VuZXJhdGlvbiByZXF1ZXN0XG4gICAgY29uc29sZS5sb2coJzIuIFByb2Nlc3NpbmcgaW52ZXN0bWVudCBpZGVhIGdlbmVyYXRpb24gcmVxdWVzdC4uLicpO1xuICAgIGNvbnN0IGludmVzdG1lbnRSZXF1ZXN0ID0gYXdhaXQgc3VwZXJ2aXNvckFnZW50LnByb2Nlc3NVc2VyUmVxdWVzdChcbiAgICAgICd1c2VyMTIzJyxcbiAgICAgICdpbnZlc3RtZW50LWlkZWEtZ2VuZXJhdGlvbicsXG4gICAgICB7XG4gICAgICAgIHJpc2tUb2xlcmFuY2U6ICdtb2RlcmF0ZScsXG4gICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiAnbG9uZycsXG4gICAgICAgIHNlY3RvcnM6IFsndGVjaG5vbG9neScsICdoZWFsdGhjYXJlJ10sXG4gICAgICAgIGV4Y2x1ZGVkSW52ZXN0bWVudHM6IFsnY3J5cHRvY3VycmVuY3knXSxcbiAgICAgICAgbWluaW11bUNvbmZpZGVuY2U6IDAuN1xuICAgICAgfVxuICAgICk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ+KchSBSZXF1ZXN0IHByb2Nlc3NlZCBzdWNjZXNzZnVsbHknKTtcbiAgICBjb25zb2xlLmxvZyhgICAgQ29udmVyc2F0aW9uIElEOiAke2ludmVzdG1lbnRSZXF1ZXN0LmlkfWApO1xuICAgIGNvbnNvbGUubG9nKGAgICBDdXJyZW50IFBoYXNlOiAke2ludmVzdG1lbnRSZXF1ZXN0LmN1cnJlbnRQaGFzZX1gKTtcbiAgICBjb25zb2xlLmxvZyhgICAgVGFza3MgQ3JlYXRlZDogJHtpbnZlc3RtZW50UmVxdWVzdC50YXNrcy5sZW5ndGh9YCk7XG4gICAgY29uc29sZS5sb2coJycpO1xuXG4gICAgLy8gRXhhbXBsZSAyOiBDaGVjayBhZ2VudCBzdGF0dXNlc1xuICAgIGNvbnNvbGUubG9nKCczLiBDaGVja2luZyBhZ2VudCBzdGF0dXNlcy4uLicpO1xuICAgIGNvbnN0IGFnZW50VHlwZXMgPSBbJ3N1cGVydmlzb3InLCAncGxhbm5pbmcnLCAncmVzZWFyY2gnLCAnYW5hbHlzaXMnLCAnY29tcGxpYW5jZScsICdzeW50aGVzaXMnXSBhcyBjb25zdDtcbiAgICBcbiAgICBhZ2VudFR5cGVzLmZvckVhY2goYWdlbnRUeXBlID0+IHtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IHN1cGVydmlzb3JBZ2VudC5nZXRBZ2VudFN0YXR1cyhhZ2VudFR5cGUpO1xuICAgICAgaWYgKHN0YXR1cykge1xuICAgICAgICBjb25zb2xlLmxvZyhgICAgJHthZ2VudFR5cGUudG9VcHBlckNhc2UoKX06ICR7c3RhdHVzLnN0YXR1c30gKCR7c3RhdHVzLmN1cnJlbnRUYXNrcy5sZW5ndGh9IHRhc2tzKWApO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKCcnKTtcblxuICAgIC8vIEV4YW1wbGUgMzogRGVtb25zdHJhdGUgdGFzayBkZWxlZ2F0aW9uXG4gICAgY29uc29sZS5sb2coJzQuIERlbW9uc3RyYXRpbmcgdGFzayBkZWxlZ2F0aW9uLi4uJyk7XG4gICAgY29uc3Qgc2FtcGxlVGFzayA9IHtcbiAgICAgIGlkOiAnZGVtby10YXNrLTAwMScsXG4gICAgICB0eXBlOiAndGV4dC1nZW5lcmF0aW9uJyBhcyBjb25zdCxcbiAgICAgIGNvbXBsZXhpdHk6ICdtZWRpdW0nIGFzIGNvbnN0LFxuICAgICAgZG9tYWluOiAnZmluYW5jaWFsJyBhcyBjb25zdCxcbiAgICAgIHByaW9yaXR5OiAnaGlnaCcgYXMgY29uc3QsXG4gICAgICBhZ2VudFJvbGU6ICdyZXNlYXJjaCcgYXMgY29uc3QsXG4gICAgICBkZXNjcmlwdGlvbjogJ0dhdGhlciBtYXJrZXQgZGF0YSBmb3IgdGVjaG5vbG9neSBzZWN0b3InLFxuICAgICAgcGFyYW1ldGVyczogeyBzZWN0b3I6ICd0ZWNobm9sb2d5JywgdGltZWZyYW1lOiAnMVknIH0sXG4gICAgICBkZXBlbmRlbmNpZXM6IFtdLFxuICAgICAgc3RhdHVzOiAncGVuZGluZycgYXMgY29uc3QsXG4gICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKClcbiAgICB9O1xuXG4gICAgY29uc3QgZGVsZWdhdGlvblJlc3VsdCA9IGF3YWl0IHN1cGVydmlzb3JBZ2VudC5kZWxlZ2F0ZVRhc2soc2FtcGxlVGFzayk7XG4gICAgY29uc29sZS5sb2coYCAgIFRhc2sgZGVsZWdhdGlvbjogJHtkZWxlZ2F0aW9uUmVzdWx0LnN1Y2Nlc3MgPyAn4pyFIFN1Y2Nlc3MnIDogJ+KdjCBGYWlsZWQnfWApO1xuICAgIGNvbnNvbGUubG9nKGAgICBBc3NpZ25lZCB0bzogJHtkZWxlZ2F0aW9uUmVzdWx0LmFzc2lnbmVkVG99YCk7XG4gICAgY29uc29sZS5sb2coYCAgIEVzdGltYXRlZCBjb21wbGV0aW9uOiAke2RlbGVnYXRpb25SZXN1bHQuZXN0aW1hdGVkQ29tcGxldGlvbi50b0lTT1N0cmluZygpfWApO1xuICAgIGNvbnNvbGUubG9nKCcnKTtcblxuICAgIC8vIEV4YW1wbGUgNDogTWVzc2FnZSBxdWV1ZSBtYW5hZ2VtZW50XG4gICAgY29uc29sZS5sb2coJzUuIERlbW9uc3RyYXRpbmcgbWVzc2FnZSBxdWV1ZS4uLicpO1xuICAgIHN1cGVydmlzb3JBZ2VudC5zZW5kTWVzc2FnZSh7XG4gICAgICBzZW5kZXI6ICdzdXBlcnZpc29yJyxcbiAgICAgIHJlY2lwaWVudDogJ3Jlc2VhcmNoJyxcbiAgICAgIG1lc3NhZ2VUeXBlOiAncmVxdWVzdCcsXG4gICAgICBjb250ZW50OiB7IGluc3RydWN0aW9uOiAnQmVnaW4gbWFya2V0IGFuYWx5c2lzJyB9LFxuICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgcHJpb3JpdHk6ICdoaWdoJyxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICBjb252ZXJzYXRpb25JZDogaW52ZXN0bWVudFJlcXVlc3QuaWQsXG4gICAgICAgIHJlcXVlc3RJZDogJ3JlcS0wMDEnXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBtZXNzYWdlUXVldWUgPSBzdXBlcnZpc29yQWdlbnQuZ2V0TWVzc2FnZVF1ZXVlKCk7XG4gICAgY29uc29sZS5sb2coYCAgIE1lc3NhZ2VzIGluIHF1ZXVlOiAke21lc3NhZ2VRdWV1ZS5sZW5ndGh9YCk7XG4gICAgY29uc29sZS5sb2coJycpO1xuXG4gICAgLy8gRXhhbXBsZSA1OiBDb252ZXJzYXRpb24gY29udGV4dCByZXRyaWV2YWxcbiAgICBjb25zb2xlLmxvZygnNi4gUmV0cmlldmluZyBjb252ZXJzYXRpb24gY29udGV4dC4uLicpO1xuICAgIGNvbnN0IGNvbnRleHQgPSBzdXBlcnZpc29yQWdlbnQuZ2V0Q29udmVyc2F0aW9uQ29udGV4dChpbnZlc3RtZW50UmVxdWVzdC5pZCk7XG4gICAgaWYgKGNvbnRleHQpIHtcbiAgICAgIGNvbnNvbGUubG9nKGAgICDinIUgQ29udGV4dCBmb3VuZCBmb3IgY29udmVyc2F0aW9uOiAke2NvbnRleHQuaWR9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgVXNlciBJRDogJHtjb250ZXh0LnVzZXJJZH1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICBSZXF1ZXN0IFR5cGU6ICR7Y29udGV4dC5yZXF1ZXN0VHlwZX1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICBNZXNzYWdlczogJHtjb250ZXh0Lm1lc3NhZ2VzLmxlbmd0aH1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICBUYXNrczogJHtjb250ZXh0LnRhc2tzLmxlbmd0aH1gKTtcbiAgICB9XG4gICAgY29uc29sZS5sb2coJycpO1xuXG4gICAgLy8gRXhhbXBsZSA2OiBBY3RpdmUgY29udmVyc2F0aW9ucyBvdmVydmlld1xuICAgIGNvbnNvbGUubG9nKCc3LiBBY3RpdmUgY29udmVyc2F0aW9ucyBvdmVydmlldy4uLicpO1xuICAgIGNvbnN0IGFjdGl2ZUNvbnZlcnNhdGlvbnMgPSBzdXBlcnZpc29yQWdlbnQuZ2V0QWN0aXZlQ29udmVyc2F0aW9ucygpO1xuICAgIGNvbnNvbGUubG9nKGAgICBUb3RhbCBhY3RpdmUgY29udmVyc2F0aW9uczogJHthY3RpdmVDb252ZXJzYXRpb25zLmxlbmd0aH1gKTtcbiAgICBcbiAgICBhY3RpdmVDb252ZXJzYXRpb25zLmZvckVhY2goKGNvbnYsIGluZGV4KSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhgICAgJHtpbmRleCArIDF9LiAke2NvbnYuaWR9IC0gUGhhc2U6ICR7Y29udi5jdXJyZW50UGhhc2V9IC0gVGFza3M6ICR7Y29udi50YXNrcy5sZW5ndGh9YCk7XG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coJycpO1xuXG4gICAgLy8gRXhhbXBsZSA3OiBDbGVhbnVwIGRlbW9uc3RyYXRpb25cbiAgICBjb25zb2xlLmxvZygnOC4gQ2xlYW51cCBkZW1vbnN0cmF0aW9uLi4uJyk7XG4gICAgY29uc29sZS5sb2coJyAgIEJlZm9yZSBjbGVhbnVwOicsIHN1cGVydmlzb3JBZ2VudC5nZXRBY3RpdmVDb252ZXJzYXRpb25zKCkubGVuZ3RoLCAnY29udmVyc2F0aW9ucycpO1xuICAgIHN1cGVydmlzb3JBZ2VudC5jbGVhbnVwQ29tcGxldGVkQ29udmVyc2F0aW9ucygwKTsgLy8gQ2xlYW4gdXAgYWxsIGNvbXBsZXRlZCBjb252ZXJzYXRpb25zXG4gICAgY29uc29sZS5sb2coJyAgIEFmdGVyIGNsZWFudXA6Jywgc3VwZXJ2aXNvckFnZW50LmdldEFjdGl2ZUNvbnZlcnNhdGlvbnMoKS5sZW5ndGgsICdjb252ZXJzYXRpb25zJyk7XG4gICAgY29uc29sZS5sb2coJycpO1xuXG4gICAgY29uc29sZS5sb2coJ/CfjokgU3VwZXJ2aXNvciBBZ2VudCBleGFtcGxlIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHkhJyk7XG4gICAgY29uc29sZS5sb2coJ1xcbktleSBGZWF0dXJlcyBEZW1vbnN0cmF0ZWQ6Jyk7XG4gICAgY29uc29sZS5sb2coJy0g4pyFIE11bHRpLWFnZW50IHdvcmtmbG93IGNvb3JkaW5hdGlvbicpO1xuICAgIGNvbnNvbGUubG9nKCctIOKchSBUYXNrIGRlbGVnYXRpb24gYW5kIG1hbmFnZW1lbnQnKTtcbiAgICBjb25zb2xlLmxvZygnLSDinIUgQ29udGV4dCBtYW5hZ2VtZW50IGFuZCBjb252ZXJzYXRpb24gdHJhY2tpbmcnKTtcbiAgICBjb25zb2xlLmxvZygnLSDinIUgTWVzc2FnZSBxdWV1ZSBoYW5kbGluZycpO1xuICAgIGNvbnNvbGUubG9nKCctIOKchSBBZ2VudCBzdGF0dXMgbW9uaXRvcmluZycpO1xuICAgIGNvbnNvbGUubG9nKCctIOKchSBDb252ZXJzYXRpb24gbGlmZWN5Y2xlIG1hbmFnZW1lbnQnKTtcblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCBFcnJvciBydW5uaW5nIHN1cGVydmlzb3IgYWdlbnQgZXhhbXBsZTonLCBlcnJvcik7XG4gICAgXG4gICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGRldGFpbHM6Jywge1xuICAgICAgICBuYW1lOiBlcnJvci5uYW1lLFxuICAgICAgICBtZXNzYWdlOiBlcnJvci5tZXNzYWdlLFxuICAgICAgICBzdGFjazogZXJyb3Iuc3RhY2s/LnNwbGl0KCdcXG4nKS5zbGljZSgwLCA1KS5qb2luKCdcXG4nKVxuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG5cbi8vIFJ1biB0aGUgZXhhbXBsZSBpZiB0aGlzIGZpbGUgaXMgZXhlY3V0ZWQgZGlyZWN0bHlcbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBydW5TdXBlcnZpc29yQWdlbnRFeGFtcGxlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnXFxu4pyoIEV4YW1wbGUgZXhlY3V0aW9uIGNvbXBsZXRlZCcpO1xuICAgICAgcHJvY2Vzcy5leGl0KDApO1xuICAgIH0pXG4gICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgY29uc29sZS5lcnJvcignXFxu8J+SpSBFeGFtcGxlIGV4ZWN1dGlvbiBmYWlsZWQ6JywgZXJyb3IpO1xuICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgIH0pO1xufVxuXG5leHBvcnQgeyBydW5TdXBlcnZpc29yQWdlbnRFeGFtcGxlIH07Il19