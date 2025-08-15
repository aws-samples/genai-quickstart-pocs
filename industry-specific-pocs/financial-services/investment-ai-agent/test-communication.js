/**
 * Simple test to verify the communication system works
 */

const { MessageBus, MessageRouter, CommunicationErrorHandler } = require('./dist/services/communication');

async function testCommunication() {
  console.log('🧪 Testing Agent Communication System...\n');

  // Initialize components
  const messageBus = new MessageBus({
    maxRetries: 2,
    retryDelayMs: 500,
    messageTimeoutMs: 10000,
    maxQueueSize: 50,
    enablePersistence: false
  });

  const messageRouter = new MessageRouter(messageBus, {
    enableLoadBalancing: true,
    loadBalancingStrategy: { type: 'least-busy' },
    enableCircuitBreaker: true,
    circuitBreakerThreshold: 3
  });

  const errorHandler = new CommunicationErrorHandler({
    maxRetries: 2,
    baseRetryDelayMs: 500,
    exponentialBackoff: true
  });

  // Subscribe a mock agent
  messageBus.subscribe({
    agentType: 'research',
    messageTypes: ['request'],
    callback: async (message) => {
      console.log(`✅ Research agent received: ${message.content.task}`);
      return Promise.resolve();
    }
  });

  // Send a test message
  const testMessage = {
    sender: 'supervisor',
    recipient: 'research',
    messageType: 'request',
    content: { task: 'analyze market trends' },
    metadata: {
      priority: 'medium',
      timestamp: new Date(),
      conversationId: 'test-conv-001',
      requestId: 'test-req-001'
    }
  };

  try {
    const result = await messageBus.sendMessage(testMessage);
    console.log(`📨 Message sent: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    }

    // Test routing
    const routedResult = await messageRouter.routeMessage(testMessage);
    console.log(`🔀 Message routed: ${routedResult.success ? 'SUCCESS' : 'FAILED'}`);

    // Get statistics
    const queueStats = messageBus.getQueueStatus();
    const routingStats = messageRouter.getRoutingStats();
    const errorStats = errorHandler.getErrorStats();

    console.log('\n📊 Statistics:');
    console.log(`- Queue: ${queueStats.totalMessages} messages`);
    console.log(`- Routing rules: ${routingStats.totalRules}`);
    console.log(`- Errors: ${errorStats.totalErrors}`);

    console.log('\n✅ Communication system test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Cleanup
    messageBus.cleanup();
  }
}

// Run the test
testCommunication().catch(console.error);