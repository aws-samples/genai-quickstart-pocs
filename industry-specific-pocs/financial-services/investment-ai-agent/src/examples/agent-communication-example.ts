/**
 * Agent Communication System Example
 * 
 * This example demonstrates how to use the agent communication system
 * including message bus, routing, and error handling.
 */

import { MessageBus, MessageRouter, CommunicationErrorHandler } from '../services/communication';
import { AgentMessage, AgentType, ConversationContext } from '../models/agent';

class AgentCommunicationExample {
  private messageBus: MessageBus;
  private messageRouter: MessageRouter;
  private errorHandler: CommunicationErrorHandler;
  private agents: Map<AgentType, MockAgent> = new Map();

  constructor() {
    // Initialize communication components
    this.messageBus = new MessageBus({
      maxRetries: 3,
      retryDelayMs: 1000,
      messageTimeoutMs: 30000,
      maxQueueSize: 100,
      enablePersistence: true
    });

    this.messageRouter = new MessageRouter(this.messageBus, {
      enableLoadBalancing: true,
      loadBalancingStrategy: { type: 'least-busy' },
      enableCircuitBreaker: true,
      circuitBreakerThreshold: 5,
      enableMessageTransformation: true,
      maxRoutingHops: 10
    });

    this.errorHandler = new CommunicationErrorHandler({
      maxRetries: 3,
      baseRetryDelayMs: 1000,
      maxRetryDelayMs: 30000,
      exponentialBackoff: true,
      jitterEnabled: true,
      deadLetterQueueEnabled: true,
      errorReportingEnabled: true,
      circuitBreakerEnabled: true
    });

    this.setupEventListeners();
    this.initializeAgents();
  }

  /**
   * Run the communication example
   */
  async runExample(): Promise<void> {
    console.log('🚀 Starting Agent Communication Example...\n');

    try {
      // Example 1: Simple direct message
      await this.demonstrateDirectMessage();

      // Example 2: Broadcast message
      await this.demonstrateBroadcastMessage();

      // Example 3: Message routing with rules
      await this.demonstrateMessageRouting();

      // Example 4: Load balancing
      await this.demonstrateLoadBalancing();

      // Example 5: Error handling and retries
      await this.demonstrateErrorHandling();

      // Example 6: Complex multi-agent workflow
      await this.demonstrateMultiAgentWorkflow();

      console.log('✅ Agent Communication Example completed successfully!');

    } catch (error) {
      console.error('❌ Example failed:', error);
    }
  }

  private async demonstrateDirectMessage(): Promise<void> {
    console.log('📨 Example 1: Direct Message Communication');
    console.log('==========================================');

    const message: AgentMessage = {
      sender: 'supervisor',
      recipient: 'research',
      messageType: 'request',
      content: {
        task: 'research_market_trends',
        parameters: {
          sector: 'technology',
          timeframe: '1M'
        }
      },
      metadata: {
        priority: 'medium',
        timestamp: new Date(),
        conversationId: 'conv-direct-001',
        requestId: 'req-direct-001'
      }
    };

    const result = await this.messageBus.sendMessage(message);
    console.log('Message sent:', result.success ? '✅' : '❌');
    console.log('Message ID:', result.messageId);
    
    if (result.error) {
      console.log('Error:', result.error);
    }

    // Wait for processing
    await this.delay(1000);
    console.log('');
  }

  private async demonstrateBroadcastMessage(): Promise<void> {
    console.log('📢 Example 2: Broadcast Message');
    console.log('===============================');

    const broadcastMessage: AgentMessage = {
      sender: 'supervisor',
      recipient: 'broadcast',
      messageType: 'update',
      content: {
        type: 'system_update',
        message: 'New market data available',
        timestamp: new Date()
      },
      metadata: {
        priority: 'low',
        timestamp: new Date(),
        conversationId: 'conv-broadcast-001',
        requestId: 'req-broadcast-001'
      }
    };

    const result = await this.messageBus.sendMessage(broadcastMessage);
    console.log('Broadcast sent:', result.success ? '✅' : '❌');
    
    await this.delay(1000);
    console.log('');
  }

  private async demonstrateMessageRouting(): Promise<void> {
    console.log('🔀 Example 3: Message Routing');
    console.log('=============================');

    // Add custom routing rule
    this.messageRouter.addRoutingRule({
      id: 'urgent-to-supervisor',
      condition: (msg) => msg.content?.urgency === 'critical',
      action: 'route',
      target: 'supervisor',
      priority: 200
    });

    const urgentMessage: AgentMessage = {
      sender: 'research',
      recipient: 'analysis',
      messageType: 'alert',
      content: {
        urgency: 'critical',
        message: 'Market crash detected',
        data: { drop_percentage: -15 }
      },
      metadata: {
        priority: 'high',
        timestamp: new Date(),
        conversationId: 'conv-routing-001',
        requestId: 'req-routing-001'
      }
    };

    const result = await this.messageRouter.routeMessage(urgentMessage);
    console.log('Urgent message routed:', result.success ? '✅' : '❌');
    console.log('Should be routed to supervisor due to critical urgency');
    
    await this.delay(1000);
    console.log('');
  }

  private async demonstrateLoadBalancing(): Promise<void> {
    console.log('⚖️ Example 4: Load Balancing');
    console.log('============================');

    // Update agent statuses to simulate different load levels
    this.messageRouter.updateAgentStatus({
      agentType: 'analysis',
      status: 'busy',
      currentTasks: ['task1', 'task2', 'task3'],
      lastActivity: new Date(),
      capabilities: {
        supportedTasks: ['financial-analysis'],
        maxConcurrentTasks: 5,
        averageProcessingTime: 2000,
        reliability: 0.95,
        specializations: ['stocks', 'bonds']
      }
    });

    // Send multiple analysis requests
    for (let i = 0; i < 3; i++) {
      const analysisMessage: AgentMessage = {
        sender: 'supervisor',
        recipient: 'analysis',
        messageType: 'request',
        content: {
          task: 'analyze_investment',
          symbol: `STOCK${i + 1}`,
          analysis_type: 'fundamental'
        },
        metadata: {
          priority: 'medium',
          timestamp: new Date(),
          conversationId: `conv-lb-${i + 1}`,
          requestId: `req-lb-${i + 1}`
        }
      };

      const result = await this.messageRouter.routeMessage(analysisMessage);
      console.log(`Analysis request ${i + 1}:`, result.success ? '✅' : '❌');
    }

    await this.delay(1000);
    console.log('');
  }

  private async demonstrateErrorHandling(): Promise<void> {
    console.log('🚨 Example 5: Error Handling');
    console.log('============================');

    // Simulate an agent that will fail
    const failingAgent = this.agents.get('compliance');
    if (failingAgent) {
      failingAgent.setShouldFail(true);
    }

    const message: AgentMessage = {
      sender: 'supervisor',
      recipient: 'compliance',
      messageType: 'request',
      content: {
        task: 'check_compliance',
        investment: 'RISKY_STOCK'
      },
      metadata: {
        priority: 'high',
        timestamp: new Date(),
        conversationId: 'conv-error-001',
        requestId: 'req-error-001'
      }
    };

    const result = await this.messageBus.sendMessage(message);
    console.log('Message to failing agent:', result.success ? '✅' : '❌');
    
    if (!result.success) {
      console.log('Error detected, checking error handler...');
      
      // Wait for retry attempts
      await this.delay(3000);
      
      const errorStats = this.errorHandler.getErrorStats();
      console.log('Error statistics:', {
        totalErrors: errorStats.totalErrors,
        errorsByType: errorStats.errorsByType,
        deadLetterQueueSize: errorStats.deadLetterQueueSize
      });
    }

    // Reset the failing agent
    if (failingAgent) {
      failingAgent.setShouldFail(false);
    }

    console.log('');
  }

  private async demonstrateMultiAgentWorkflow(): Promise<void> {
    console.log('🔄 Example 6: Multi-Agent Workflow');
    console.log('==================================');

    const conversationId = 'conv-workflow-001';
    
    // Step 1: Supervisor initiates research
    const researchRequest: AgentMessage = {
      sender: 'supervisor',
      recipient: 'research',
      messageType: 'request',
      content: {
        task: 'comprehensive_research',
        topic: 'renewable_energy_stocks',
        depth: 'detailed'
      },
      metadata: {
        priority: 'medium',
        timestamp: new Date(),
        conversationId,
        requestId: 'req-workflow-001'
      }
    };

    console.log('Step 1: Initiating research...');
    await this.messageBus.sendMessage(researchRequest);
    await this.delay(1500);

    // Step 2: Research agent requests analysis
    const analysisRequest: AgentMessage = {
      sender: 'research',
      recipient: 'analysis',
      messageType: 'request',
      content: {
        task: 'analyze_research_data',
        data: {
          companies: ['SOLAR_CORP', 'WIND_ENERGY_INC'],
          metrics: ['revenue_growth', 'market_share', 'sustainability_score']
        }
      },
      metadata: {
        priority: 'medium',
        timestamp: new Date(),
        conversationId,
        requestId: 'req-workflow-002'
      }
    };

    console.log('Step 2: Requesting analysis...');
    await this.messageBus.sendMessage(analysisRequest);
    await this.delay(1500);

    // Step 3: Analysis agent requests compliance check
    const complianceRequest: AgentMessage = {
      sender: 'analysis',
      recipient: 'compliance',
      messageType: 'request',
      content: {
        task: 'compliance_check',
        investments: ['SOLAR_CORP', 'WIND_ENERGY_INC'],
        regulations: ['ESG', 'SEC_FILING']
      },
      metadata: {
        priority: 'high',
        timestamp: new Date(),
        conversationId,
        requestId: 'req-workflow-003'
      }
    };

    console.log('Step 3: Checking compliance...');
    await this.messageBus.sendMessage(complianceRequest);
    await this.delay(1500);

    // Step 4: Synthesis agent creates final report
    const synthesisRequest: AgentMessage = {
      sender: 'supervisor',
      recipient: 'synthesis',
      messageType: 'request',
      content: {
        task: 'create_investment_report',
        conversationId,
        includeAllData: true
      },
      metadata: {
        priority: 'medium',
        timestamp: new Date(),
        conversationId,
        requestId: 'req-workflow-004'
      }
    };

    console.log('Step 4: Creating final report...');
    await this.messageBus.sendMessage(synthesisRequest);
    await this.delay(2000);

    // Show conversation history
    const history = this.messageBus.getConversationHistory(conversationId);
    console.log(`Workflow completed with ${history.length} messages exchanged`);
    console.log('');
  }

  private setupEventListeners(): void {
    // Message bus events
    this.messageBus.on('agent-subscribed', (event) => {
      console.log(`🔌 Agent ${event.agentType} subscribed to messages`);
    });

    this.messageBus.on('message-retry-failed', (event) => {
      console.log(`🔄 Message retry failed: ${event.messageId} (${event.retryCount} attempts)`);
    });

    this.messageBus.on('conversation-updated', (context) => {
      console.log(`💬 Conversation ${context.id} updated (phase: ${context.currentPhase})`);
    });

    // Error handler events
    this.errorHandler.on('communication-error', (error) => {
      console.log(`⚠️ Communication error: ${error.type} - ${error.message}`);
    });

    this.errorHandler.on('circuit-breaker-opened', (event) => {
      console.log(`🔴 Circuit breaker opened for agent: ${event.agentType}`);
    });

    this.errorHandler.on('message-moved-to-dlq', (error) => {
      console.log(`📮 Message moved to dead letter queue: ${error.id}`);
    });
  }

  private initializeAgents(): void {
    const agentTypes: AgentType[] = ['supervisor', 'planning', 'research', 'analysis', 'compliance', 'synthesis'];
    
    agentTypes.forEach(agentType => {
      const agent = new MockAgent(agentType, this.messageBus);
      this.agents.set(agentType, agent);
      agent.start();
    });

    console.log(`🤖 Initialized ${agentTypes.length} mock agents`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Mock Agent for demonstration purposes
 */
class MockAgent {
  private agentType: AgentType;
  private messageBus: MessageBus;
  private shouldFail: boolean = false;

  constructor(agentType: AgentType, messageBus: MessageBus) {
    this.agentType = agentType;
    this.messageBus = messageBus;
  }

  start(): void {
    this.messageBus.subscribe({
      agentType: this.agentType,
      messageTypes: ['*'], // Subscribe to all message types
      callback: this.handleMessage.bind(this)
    });
  }

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  private async handleMessage(message: AgentMessage): Promise<void> {
    if (this.shouldFail) {
      throw new Error(`Agent ${this.agentType} is configured to fail`);
    }

    // Simulate processing time
    await this.delay(Math.random() * 500 + 200);

    console.log(`🤖 ${this.agentType} processed message: ${message.messageType} from ${message.sender}`);

    // Simulate responses for certain message types
    if (message.messageType === 'request') {
      const response: AgentMessage = {
        sender: this.agentType,
        recipient: message.sender,
        messageType: 'response',
        content: {
          status: 'completed',
          result: `${this.agentType} completed task: ${message.content?.task || 'unknown'}`,
          timestamp: new Date()
        },
        metadata: {
          priority: message.metadata.priority,
          timestamp: new Date(),
          conversationId: message.metadata.conversationId,
          requestId: message.metadata.requestId
        }
      };

      // Send response back (with small delay to simulate processing)
      setTimeout(() => {
        this.messageBus.sendMessage(response).catch(console.error);
      }, 100);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Run the example
 */
async function runAgentCommunicationExample(): Promise<void> {
  const example = new AgentCommunicationExample();
  await example.runExample();
}

// Export for use in other modules
export { AgentCommunicationExample, runAgentCommunicationExample };

// Run if this file is executed directly
if (require.main === module) {
  runAgentCommunicationExample().catch(console.error);
}