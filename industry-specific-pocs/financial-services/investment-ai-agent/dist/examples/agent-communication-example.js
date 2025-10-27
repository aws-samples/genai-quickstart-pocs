"use strict";
/**
 * Agent Communication System Example
 *
 * This example demonstrates how to use the agent communication system
 * including message bus, routing, and error handling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAgentCommunicationExample = exports.AgentCommunicationExample = void 0;
const communication_1 = require("../services/communication");
class AgentCommunicationExample {
    constructor() {
        this.agents = new Map();
        // Initialize communication components
        this.messageBus = new communication_1.MessageBus({
            maxRetries: 3,
            retryDelayMs: 1000,
            messageTimeoutMs: 30000,
            maxQueueSize: 100,
            enablePersistence: true
        });
        this.messageRouter = new communication_1.MessageRouter(this.messageBus, {
            enableLoadBalancing: true,
            loadBalancingStrategy: { type: 'least-busy' },
            enableCircuitBreaker: true,
            circuitBreakerThreshold: 5,
            enableMessageTransformation: true,
            maxRoutingHops: 10
        });
        this.errorHandler = new communication_1.CommunicationErrorHandler({
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
    async runExample() {
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
        }
        catch (error) {
            console.error('❌ Example failed:', error);
        }
    }
    async demonstrateDirectMessage() {
        console.log('📨 Example 1: Direct Message Communication');
        console.log('==========================================');
        const message = {
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
    async demonstrateBroadcastMessage() {
        console.log('📢 Example 2: Broadcast Message');
        console.log('===============================');
        const broadcastMessage = {
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
    async demonstrateMessageRouting() {
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
        const urgentMessage = {
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
    async demonstrateLoadBalancing() {
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
            const analysisMessage = {
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
    async demonstrateErrorHandling() {
        console.log('🚨 Example 5: Error Handling');
        console.log('============================');
        // Simulate an agent that will fail
        const failingAgent = this.agents.get('compliance');
        if (failingAgent) {
            failingAgent.setShouldFail(true);
        }
        const message = {
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
    async demonstrateMultiAgentWorkflow() {
        console.log('🔄 Example 6: Multi-Agent Workflow');
        console.log('==================================');
        const conversationId = 'conv-workflow-001';
        // Step 1: Supervisor initiates research
        const researchRequest = {
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
        const analysisRequest = {
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
        const complianceRequest = {
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
        const synthesisRequest = {
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
    setupEventListeners() {
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
    initializeAgents() {
        const agentTypes = ['supervisor', 'planning', 'research', 'analysis', 'compliance', 'synthesis'];
        agentTypes.forEach(agentType => {
            const agent = new MockAgent(agentType, this.messageBus);
            this.agents.set(agentType, agent);
            agent.start();
        });
        console.log(`🤖 Initialized ${agentTypes.length} mock agents`);
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.AgentCommunicationExample = AgentCommunicationExample;
/**
 * Mock Agent for demonstration purposes
 */
class MockAgent {
    constructor(agentType, messageBus) {
        this.shouldFail = false;
        this.agentType = agentType;
        this.messageBus = messageBus;
    }
    start() {
        this.messageBus.subscribe({
            agentType: this.agentType,
            messageTypes: ['*'],
            callback: this.handleMessage.bind(this)
        });
    }
    setShouldFail(shouldFail) {
        this.shouldFail = shouldFail;
    }
    async handleMessage(message) {
        if (this.shouldFail) {
            throw new Error(`Agent ${this.agentType} is configured to fail`);
        }
        // Simulate processing time
        await this.delay(Math.random() * 500 + 200);
        console.log(`🤖 ${this.agentType} processed message: ${message.messageType} from ${message.sender}`);
        // Simulate responses for certain message types
        if (message.messageType === 'request') {
            const response = {
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
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
/**
 * Run the example
 */
async function runAgentCommunicationExample() {
    const example = new AgentCommunicationExample();
    await example.runExample();
}
exports.runAgentCommunicationExample = runAgentCommunicationExample;
// Run if this file is executed directly
if (require.main === module) {
    runAgentCommunicationExample().catch(console.error);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdlbnQtY29tbXVuaWNhdGlvbi1leGFtcGxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4YW1wbGVzL2FnZW50LWNvbW11bmljYXRpb24tZXhhbXBsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7O0dBS0c7OztBQUVILDZEQUFpRztBQUdqRyxNQUFNLHlCQUF5QjtJQU03QjtRQUZRLFdBQU0sR0FBOEIsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUdwRCxzQ0FBc0M7UUFDdEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLDBCQUFVLENBQUM7WUFDL0IsVUFBVSxFQUFFLENBQUM7WUFDYixZQUFZLEVBQUUsSUFBSTtZQUNsQixnQkFBZ0IsRUFBRSxLQUFLO1lBQ3ZCLFlBQVksRUFBRSxHQUFHO1lBQ2pCLGlCQUFpQixFQUFFLElBQUk7U0FDeEIsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLDZCQUFhLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUN0RCxtQkFBbUIsRUFBRSxJQUFJO1lBQ3pCLHFCQUFxQixFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUM3QyxvQkFBb0IsRUFBRSxJQUFJO1lBQzFCLHVCQUF1QixFQUFFLENBQUM7WUFDMUIsMkJBQTJCLEVBQUUsSUFBSTtZQUNqQyxjQUFjLEVBQUUsRUFBRTtTQUNuQixDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUkseUNBQXlCLENBQUM7WUFDaEQsVUFBVSxFQUFFLENBQUM7WUFDYixnQkFBZ0IsRUFBRSxJQUFJO1lBQ3RCLGVBQWUsRUFBRSxLQUFLO1lBQ3RCLGtCQUFrQixFQUFFLElBQUk7WUFDeEIsYUFBYSxFQUFFLElBQUk7WUFDbkIsc0JBQXNCLEVBQUUsSUFBSTtZQUM1QixxQkFBcUIsRUFBRSxJQUFJO1lBQzNCLHFCQUFxQixFQUFFLElBQUk7U0FDNUIsQ0FBQyxDQUFDO1FBRUgsSUFB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QUssQ0FBQyxFQUFVO1FBQ3RCLE9BQU8sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDekQsQ0FBQztDQUNGO0FBRUQ7O0dBRUc7QUFDSCxLQUFLLFVBQVUsNEJBQTRCO0lBQ3pDLE1BQU0sT0FBTyxHQUFHLElBQUkseUJBQXlCLEVBQUUsQ0FBQztJQUNoRCxNQUFNLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUM3QixDQUFDO0FBR21DLG9FQUE0QjtBQUVoRSx3Q0FBd0M7QUFDeEMsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRTtJQUMzQiw0QkFBNEIsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDckQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEFnZW50IENvbW11bmljYXRpb24gU3lzdGVtIEV4YW1wbGVcbiAqIFxuICogVGhpcyBleGFtcGxlIGRlbW9uc3RyYXRlcyBob3cgdG8gdXNlIHRoZSBhZ2VudCBjb21tdW5pY2F0aW9uIHN5c3RlbVxuICogaW5jbHVkaW5nIG1lc3NhZ2UgYnVzLCByb3V0aW5nLCBhbmQgZXJyb3IgaGFuZGxpbmcuXG4gKi9cblxuaW1wb3J0IHsgTWVzc2FnZUJ1cywgTWVzc2FnZVJvdXRlciwgQ29tbXVuaWNhdGlvbkVycm9ySGFuZGxlciB9IGZyb20gJy4uL3NlcnZpY2VzL2NvbW11bmljYXRpb24nO1xuaW1wb3J0IHsgQWdlbnRNZXNzYWdlLCBBZ2VudFR5cGUsIENvbnZlcnNhdGlvbkNvbnRleHQgfSBmcm9tICcuLi9tb2RlbHMvYWdlbnQnO1xuXG5jbGFzcyBBZ2VudENvbW11bmljYXRpb25FeGFtcGxlIHtcbiAgcHJpdmF0ZSBtZXNzYWdlQnVzOiBNZXNzYWdlQnVzO1xuICBwcml2YXRlIG1lc3NhZ2VSb3V0ZXI6IE1lc3NhZ2VSb3V0ZXI7XG4gIHByaXZhdGUgZXJyb3JIYW5kbGVyOiBDb21tdW5pY2F0aW9uRXJyb3JIYW5kbGVyO1xuICBwcml2YXRlIGFnZW50czogTWFwPEFnZW50VHlwZSwgTW9ja0FnZW50PiA9IG5ldyBNYXAoKTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAvLyBJbml0aWFsaXplIGNvbW11bmljYXRpb24gY29tcG9uZW50c1xuICAgIHRoaXMubWVzc2FnZUJ1cyA9IG5ldyBNZXNzYWdlQnVzKHtcbiAgICAgIG1heFJldHJpZXM6IDMsXG4gICAgICByZXRyeURlbGF5TXM6IDEwMDAsXG4gICAgICBtZXNzYWdlVGltZW91dE1zOiAzMDAwMCxcbiAgICAgIG1heFF1ZXVlU2l6ZTogMTAwLFxuICAgICAgZW5hYmxlUGVyc2lzdGVuY2U6IHRydWVcbiAgICB9KTtcblxuICAgIHRoaXMubWVzc2FnZVJvdXRlciA9IG5ldyBNZXNzYWdlUm91dGVyKHRoaXMubWVzc2FnZUJ1cywge1xuICAgICAgZW5hYmxlTG9hZEJhbGFuY2luZzogdHJ1ZSxcbiAgICAgIGxvYWRCYWxhbmNpbmdTdHJhdGVneTogeyB0eXBlOiAnbGVhc3QtYnVzeScgfSxcbiAgICAgIGVuYWJsZUNpcmN1aXRCcmVha2VyOiB0cnVlLFxuICAgICAgY2lyY3VpdEJyZWFrZXJUaHJlc2hvbGQ6IDUsXG4gICAgICBlbmFibGVNZXNzYWdlVHJhbnNmb3JtYXRpb246IHRydWUsXG4gICAgICBtYXhSb3V0aW5nSG9wczogMTBcbiAgICB9KTtcblxuICAgIHRoaXMuZXJyb3JIYW5kbGVyID0gbmV3IENvbW11bmljYXRpb25FcnJvckhhbmRsZXIoe1xuICAgICAgbWF4UmV0cmllczogMyxcbiAgICAgIGJhc2VSZXRyeURlbGF5TXM6IDEwMDAsXG4gICAgICBtYXhSZXRyeURlbGF5TXM6IDMwMDAwLFxuICAgICAgZXhwb25lbnRpYWxCYWNrb2ZmOiB0cnVlLFxuICAgICAgaml0dGVyRW5hYmxlZDogdHJ1ZSxcbiAgICAgIGRlYWRMZXR0ZXJRdWV1ZUVuYWJsZWQ6IHRydWUsXG4gICAgICBlcnJvclJlcG9ydGluZ0VuYWJsZWQ6IHRydWUsXG4gICAgICBjaXJjdWl0QnJlYWtlckVuYWJsZWQ6IHRydWVcbiAgICB9KTtcblxuICAgIHRoaXMuc2V0dXBFdmVudExpc3RlbmVycygpO1xuICAgIHRoaXMuaW5pdGlhbGl6ZUFnZW50cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJ1biB0aGUgY29tbXVuaWNhdGlvbiBleGFtcGxlXG4gICAqL1xuICBhc3luYyBydW5FeGFtcGxlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKCfwn5qAIFN0YXJ0aW5nIEFnZW50IENvbW11bmljYXRpb24gRXhhbXBsZS4uLlxcbicpO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIEV4YW1wbGUgMTogU2ltcGxlIGRpcmVjdCBtZXNzYWdlXG4gICAgICBhd2FpdCB0aGlzLmRlbW9uc3RyYXRlRGlyZWN0TWVzc2FnZSgpO1xuXG4gICAgICAvLyBFeGFtcGxlIDI6IEJyb2FkY2FzdCBtZXNzYWdlXG4gICAgICBhd2FpdCB0aGlzLmRlbW9uc3RyYXRlQnJvYWRjYXN0TWVzc2FnZSgpO1xuXG4gICAgICAvLyBFeGFtcGxlIDM6IE1lc3NhZ2Ugcm91dGluZyB3aXRoIHJ1bGVzXG4gICAgICBhd2FpdCB0aGlzLmRlbW9uc3RyYXRlTWVzc2FnZVJvdXRpbmcoKTtcblxuICAgICAgLy8gRXhhbXBsZSA0OiBMb2FkIGJhbGFuY2luZ1xuICAgICAgYXdhaXQgdGhpcy5kZW1vbnN0cmF0ZUxvYWRCYWxhbmNpbmcoKTtcblxuICAgICAgLy8gRXhhbXBsZSA1OiBFcnJvciBoYW5kbGluZyBhbmQgcmV0cmllc1xuICAgICAgYXdhaXQgdGhpcy5kZW1vbnN0cmF0ZUVycm9ySGFuZGxpbmcoKTtcblxuICAgICAgLy8gRXhhbXBsZSA2OiBDb21wbGV4IG11bHRpLWFnZW50IHdvcmtmbG93XG4gICAgICBhd2FpdCB0aGlzLmRlbW9uc3RyYXRlTXVsdGlBZ2VudFdvcmtmbG93KCk7XG5cbiAgICAgIGNvbnNvbGUubG9nKCfinIUgQWdlbnQgQ29tbXVuaWNhdGlvbiBFeGFtcGxlIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHkhJyk7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIEV4YW1wbGUgZmFpbGVkOicsIGVycm9yKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGRlbW9uc3RyYXRlRGlyZWN0TWVzc2FnZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zb2xlLmxvZygn8J+TqCBFeGFtcGxlIDE6IERpcmVjdCBNZXNzYWdlIENvbW11bmljYXRpb24nKTtcbiAgICBjb25zb2xlLmxvZygnPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Jyk7XG5cbiAgICBjb25zdCBtZXNzYWdlOiBBZ2VudE1lc3NhZ2UgPSB7XG4gICAgICBzZW5kZXI6ICdzdXBlcnZpc29yJyxcbiAgICAgIHJlY2lwaWVudDogJ3Jlc2VhcmNoJyxcbiAgICAgIG1lc3NhZ2VUeXBlOiAncmVxdWVzdCcsXG4gICAgICBjb250ZW50OiB7XG4gICAgICAgIHRhc2s6ICdyZXNlYXJjaF9tYXJrZXRfdHJlbmRzJyxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIHNlY3RvcjogJ3RlY2hub2xvZ3knLFxuICAgICAgICAgIHRpbWVmcmFtZTogJzFNJ1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIGNvbnZlcnNhdGlvbklkOiAnY29udi1kaXJlY3QtMDAxJyxcbiAgICAgICAgcmVxdWVzdElkOiAncmVxLWRpcmVjdC0wMDEnXG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMubWVzc2FnZUJ1cy5zZW5kTWVzc2FnZShtZXNzYWdlKTtcbiAgICBjb25zb2xlLmxvZygnTWVzc2FnZSBzZW50OicsIHJlc3VsdC5zdWNjZXNzID8gJ+KchScgOiAn4p2MJyk7XG4gICAgY29uc29sZS5sb2coJ01lc3NhZ2UgSUQ6JywgcmVzdWx0Lm1lc3NhZ2VJZCk7XG4gICAgXG4gICAgaWYgKHJlc3VsdC5lcnJvcikge1xuICAgICAgY29uc29sZS5sb2coJ0Vycm9yOicsIHJlc3VsdC5lcnJvcik7XG4gICAgfVxuXG4gICAgLy8gV2FpdCBmb3IgcHJvY2Vzc2luZ1xuICAgIGF3YWl0IHRoaXMuZGVsYXkoMTAwMCk7XG4gICAgY29uc29sZS5sb2coJycpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBkZW1vbnN0cmF0ZUJyb2FkY2FzdE1lc3NhZ2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coJ/Cfk6IgRXhhbXBsZSAyOiBCcm9hZGNhc3QgTWVzc2FnZScpO1xuICAgIGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Jyk7XG5cbiAgICBjb25zdCBicm9hZGNhc3RNZXNzYWdlOiBBZ2VudE1lc3NhZ2UgPSB7XG4gICAgICBzZW5kZXI6ICdzdXBlcnZpc29yJyxcbiAgICAgIHJlY2lwaWVudDogJ2Jyb2FkY2FzdCcsXG4gICAgICBtZXNzYWdlVHlwZTogJ3VwZGF0ZScsXG4gICAgICBjb250ZW50OiB7XG4gICAgICAgIHR5cGU6ICdzeXN0ZW1fdXBkYXRlJyxcbiAgICAgICAgbWVzc2FnZTogJ05ldyBtYXJrZXQgZGF0YSBhdmFpbGFibGUnLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKClcbiAgICAgIH0sXG4gICAgICBtZXRhZGF0YToge1xuICAgICAgICBwcmlvcml0eTogJ2xvdycsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgY29udmVyc2F0aW9uSWQ6ICdjb252LWJyb2FkY2FzdC0wMDEnLFxuICAgICAgICByZXF1ZXN0SWQ6ICdyZXEtYnJvYWRjYXN0LTAwMSdcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5tZXNzYWdlQnVzLnNlbmRNZXNzYWdlKGJyb2FkY2FzdE1lc3NhZ2UpO1xuICAgIGNvbnNvbGUubG9nKCdCcm9hZGNhc3Qgc2VudDonLCByZXN1bHQuc3VjY2VzcyA/ICfinIUnIDogJ+KdjCcpO1xuICAgIFxuICAgIGF3YWl0IHRoaXMuZGVsYXkoMTAwMCk7XG4gICAgY29uc29sZS5sb2coJycpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBkZW1vbnN0cmF0ZU1lc3NhZ2VSb3V0aW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKCfwn5SAIEV4YW1wbGUgMzogTWVzc2FnZSBSb3V0aW5nJyk7XG4gICAgY29uc29sZS5sb2coJz09PT09PT09PT09PT09PT09PT09PT09PT09PT09Jyk7XG5cbiAgICAvLyBBZGQgY3VzdG9tIHJvdXRpbmcgcnVsZVxuICAgIHRoaXMubWVzc2FnZVJvdXRlci5hZGRSb3V0aW5nUnVsZSh7XG4gICAgICBpZDogJ3VyZ2VudC10by1zdXBlcnZpc29yJyxcbiAgICAgIGNvbmRpdGlvbjogKG1zZykgPT4gbXNnLmNvbnRlbnQ/LnVyZ2VuY3kgPT09ICdjcml0aWNhbCcsXG4gICAgICBhY3Rpb246ICdyb3V0ZScsXG4gICAgICB0YXJnZXQ6ICdzdXBlcnZpc29yJyxcbiAgICAgIHByaW9yaXR5OiAyMDBcbiAgICB9KTtcblxuICAgIGNvbnN0IHVyZ2VudE1lc3NhZ2U6IEFnZW50TWVzc2FnZSA9IHtcbiAgICAgIHNlbmRlcjogJ3Jlc2VhcmNoJyxcbiAgICAgIHJlY2lwaWVudDogJ2FuYWx5c2lzJyxcbiAgICAgIG1lc3NhZ2VUeXBlOiAnYWxlcnQnLFxuICAgICAgY29udGVudDoge1xuICAgICAgICB1cmdlbmN5OiAnY3JpdGljYWwnLFxuICAgICAgICBtZXNzYWdlOiAnTWFya2V0IGNyYXNoIGRldGVjdGVkJyxcbiAgICAgICAgZGF0YTogeyBkcm9wX3BlcmNlbnRhZ2U6IC0xNSB9XG4gICAgICB9LFxuICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgcHJpb3JpdHk6ICdoaWdoJyxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICBjb252ZXJzYXRpb25JZDogJ2NvbnYtcm91dGluZy0wMDEnLFxuICAgICAgICByZXF1ZXN0SWQ6ICdyZXEtcm91dGluZy0wMDEnXG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMubWVzc2FnZVJvdXRlci5yb3V0ZU1lc3NhZ2UodXJnZW50TWVzc2FnZSk7XG4gICAgY29uc29sZS5sb2coJ1VyZ2VudCBtZXNzYWdlIHJvdXRlZDonLCByZXN1bHQuc3VjY2VzcyA/ICfinIUnIDogJ+KdjCcpO1xuICAgIGNvbnNvbGUubG9nKCdTaG91bGQgYmUgcm91dGVkIHRvIHN1cGVydmlzb3IgZHVlIHRvIGNyaXRpY2FsIHVyZ2VuY3knKTtcbiAgICBcbiAgICBhd2FpdCB0aGlzLmRlbGF5KDEwMDApO1xuICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZGVtb25zdHJhdGVMb2FkQmFsYW5jaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKCfimpbvuI8gRXhhbXBsZSA0OiBMb2FkIEJhbGFuY2luZycpO1xuICAgIGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PT09PT09PT09Jyk7XG5cbiAgICAvLyBVcGRhdGUgYWdlbnQgc3RhdHVzZXMgdG8gc2ltdWxhdGUgZGlmZmVyZW50IGxvYWQgbGV2ZWxzXG4gICAgdGhpcy5tZXNzYWdlUm91dGVyLnVwZGF0ZUFnZW50U3RhdHVzKHtcbiAgICAgIGFnZW50VHlwZTogJ2FuYWx5c2lzJyxcbiAgICAgIHN0YXR1czogJ2J1c3knLFxuICAgICAgY3VycmVudFRhc2tzOiBbJ3Rhc2sxJywgJ3Rhc2syJywgJ3Rhc2szJ10sXG4gICAgICBsYXN0QWN0aXZpdHk6IG5ldyBEYXRlKCksXG4gICAgICBjYXBhYmlsaXRpZXM6IHtcbiAgICAgICAgc3VwcG9ydGVkVGFza3M6IFsnZmluYW5jaWFsLWFuYWx5c2lzJ10sXG4gICAgICAgIG1heENvbmN1cnJlbnRUYXNrczogNSxcbiAgICAgICAgYXZlcmFnZVByb2Nlc3NpbmdUaW1lOiAyMDAwLFxuICAgICAgICByZWxpYWJpbGl0eTogMC45NSxcbiAgICAgICAgc3BlY2lhbGl6YXRpb25zOiBbJ3N0b2NrcycsICdib25kcyddXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBTZW5kIG11bHRpcGxlIGFuYWx5c2lzIHJlcXVlc3RzXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgIGNvbnN0IGFuYWx5c2lzTWVzc2FnZTogQWdlbnRNZXNzYWdlID0ge1xuICAgICAgICBzZW5kZXI6ICdzdXBlcnZpc29yJyxcbiAgICAgICAgcmVjaXBpZW50OiAnYW5hbHlzaXMnLFxuICAgICAgICBtZXNzYWdlVHlwZTogJ3JlcXVlc3QnLFxuICAgICAgICBjb250ZW50OiB7XG4gICAgICAgICAgdGFzazogJ2FuYWx5emVfaW52ZXN0bWVudCcsXG4gICAgICAgICAgc3ltYm9sOiBgU1RPQ0ske2kgKyAxfWAsXG4gICAgICAgICAgYW5hbHlzaXNfdHlwZTogJ2Z1bmRhbWVudGFsJ1xuICAgICAgICB9LFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgY29udmVyc2F0aW9uSWQ6IGBjb252LWxiLSR7aSArIDF9YCxcbiAgICAgICAgICByZXF1ZXN0SWQ6IGByZXEtbGItJHtpICsgMX1gXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMubWVzc2FnZVJvdXRlci5yb3V0ZU1lc3NhZ2UoYW5hbHlzaXNNZXNzYWdlKTtcbiAgICAgIGNvbnNvbGUubG9nKGBBbmFseXNpcyByZXF1ZXN0ICR7aSArIDF9OmAsIHJlc3VsdC5zdWNjZXNzID8gJ+KchScgOiAn4p2MJyk7XG4gICAgfVxuXG4gICAgYXdhaXQgdGhpcy5kZWxheSgxMDAwKTtcbiAgICBjb25zb2xlLmxvZygnJyk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGRlbW9uc3RyYXRlRXJyb3JIYW5kbGluZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zb2xlLmxvZygn8J+aqCBFeGFtcGxlIDU6IEVycm9yIEhhbmRsaW5nJyk7XG4gICAgY29uc29sZS5sb2coJz09PT09PT09PT09PT09PT09PT09PT09PT09PT0nKTtcblxuICAgIC8vIFNpbXVsYXRlIGFuIGFnZW50IHRoYXQgd2lsbCBmYWlsXG4gICAgY29uc3QgZmFpbGluZ0FnZW50ID0gdGhpcy5hZ2VudHMuZ2V0KCdjb21wbGlhbmNlJyk7XG4gICAgaWYgKGZhaWxpbmdBZ2VudCkge1xuICAgICAgZmFpbGluZ0FnZW50LnNldFNob3VsZEZhaWwodHJ1ZSk7XG4gICAgfVxuXG4gICAgY29uc3QgbWVzc2FnZTogQWdlbnRNZXNzYWdlID0ge1xuICAgICAgc2VuZGVyOiAnc3VwZXJ2aXNvcicsXG4gICAgICByZWNpcGllbnQ6ICdjb21wbGlhbmNlJyxcbiAgICAgIG1lc3NhZ2VUeXBlOiAncmVxdWVzdCcsXG4gICAgICBjb250ZW50OiB7XG4gICAgICAgIHRhc2s6ICdjaGVja19jb21wbGlhbmNlJyxcbiAgICAgICAgaW52ZXN0bWVudDogJ1JJU0tZX1NUT0NLJ1xuICAgICAgfSxcbiAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgIHByaW9yaXR5OiAnaGlnaCcsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgY29udmVyc2F0aW9uSWQ6ICdjb252LWVycm9yLTAwMScsXG4gICAgICAgIHJlcXVlc3RJZDogJ3JlcS1lcnJvci0wMDEnXG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMubWVzc2FnZUJ1cy5zZW5kTWVzc2FnZShtZXNzYWdlKTtcbiAgICBjb25zb2xlLmxvZygnTWVzc2FnZSB0byBmYWlsaW5nIGFnZW50OicsIHJlc3VsdC5zdWNjZXNzID8gJ+KchScgOiAn4p2MJyk7XG4gICAgXG4gICAgaWYgKCFyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgY29uc29sZS5sb2coJ0Vycm9yIGRldGVjdGVkLCBjaGVja2luZyBlcnJvciBoYW5kbGVyLi4uJyk7XG4gICAgICBcbiAgICAgIC8vIFdhaXQgZm9yIHJldHJ5IGF0dGVtcHRzXG4gICAgICBhd2FpdCB0aGlzLmRlbGF5KDMwMDApO1xuICAgICAgXG4gICAgICBjb25zdCBlcnJvclN0YXRzID0gdGhpcy5lcnJvckhhbmRsZXIuZ2V0RXJyb3JTdGF0cygpO1xuICAgICAgY29uc29sZS5sb2coJ0Vycm9yIHN0YXRpc3RpY3M6Jywge1xuICAgICAgICB0b3RhbEVycm9yczogZXJyb3JTdGF0cy50b3RhbEVycm9ycyxcbiAgICAgICAgZXJyb3JzQnlUeXBlOiBlcnJvclN0YXRzLmVycm9yc0J5VHlwZSxcbiAgICAgICAgZGVhZExldHRlclF1ZXVlU2l6ZTogZXJyb3JTdGF0cy5kZWFkTGV0dGVyUXVldWVTaXplXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBSZXNldCB0aGUgZmFpbGluZyBhZ2VudFxuICAgIGlmIChmYWlsaW5nQWdlbnQpIHtcbiAgICAgIGZhaWxpbmdBZ2VudC5zZXRTaG91bGRGYWlsKGZhbHNlKTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZygnJyk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGRlbW9uc3RyYXRlTXVsdGlBZ2VudFdvcmtmbG93KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKCfwn5SEIEV4YW1wbGUgNjogTXVsdGktQWdlbnQgV29ya2Zsb3cnKTtcbiAgICBjb25zb2xlLmxvZygnPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PScpO1xuXG4gICAgY29uc3QgY29udmVyc2F0aW9uSWQgPSAnY29udi13b3JrZmxvdy0wMDEnO1xuICAgIFxuICAgIC8vIFN0ZXAgMTogU3VwZXJ2aXNvciBpbml0aWF0ZXMgcmVzZWFyY2hcbiAgICBjb25zdCByZXNlYXJjaFJlcXVlc3Q6IEFnZW50TWVzc2FnZSA9IHtcbiAgICAgIHNlbmRlcjogJ3N1cGVydmlzb3InLFxuICAgICAgcmVjaXBpZW50OiAncmVzZWFyY2gnLFxuICAgICAgbWVzc2FnZVR5cGU6ICdyZXF1ZXN0JyxcbiAgICAgIGNvbnRlbnQ6IHtcbiAgICAgICAgdGFzazogJ2NvbXByZWhlbnNpdmVfcmVzZWFyY2gnLFxuICAgICAgICB0b3BpYzogJ3JlbmV3YWJsZV9lbmVyZ3lfc3RvY2tzJyxcbiAgICAgICAgZGVwdGg6ICdkZXRhaWxlZCdcbiAgICAgIH0sXG4gICAgICBtZXRhZGF0YToge1xuICAgICAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgY29udmVyc2F0aW9uSWQsXG4gICAgICAgIHJlcXVlc3RJZDogJ3JlcS13b3JrZmxvdy0wMDEnXG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnNvbGUubG9nKCdTdGVwIDE6IEluaXRpYXRpbmcgcmVzZWFyY2guLi4nKTtcbiAgICBhd2FpdCB0aGlzLm1lc3NhZ2VCdXMuc2VuZE1lc3NhZ2UocmVzZWFyY2hSZXF1ZXN0KTtcbiAgICBhd2FpdCB0aGlzLmRlbGF5KDE1MDApO1xuXG4gICAgLy8gU3RlcCAyOiBSZXNlYXJjaCBhZ2VudCByZXF1ZXN0cyBhbmFseXNpc1xuICAgIGNvbnN0IGFuYWx5c2lzUmVxdWVzdDogQWdlbnRNZXNzYWdlID0ge1xuICAgICAgc2VuZGVyOiAncmVzZWFyY2gnLFxuICAgICAgcmVjaXBpZW50OiAnYW5hbHlzaXMnLFxuICAgICAgbWVzc2FnZVR5cGU6ICdyZXF1ZXN0JyxcbiAgICAgIGNvbnRlbnQ6IHtcbiAgICAgICAgdGFzazogJ2FuYWx5emVfcmVzZWFyY2hfZGF0YScsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBjb21wYW5pZXM6IFsnU09MQVJfQ09SUCcsICdXSU5EX0VORVJHWV9JTkMnXSxcbiAgICAgICAgICBtZXRyaWNzOiBbJ3JldmVudWVfZ3Jvd3RoJywgJ21hcmtldF9zaGFyZScsICdzdXN0YWluYWJpbGl0eV9zY29yZSddXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBtZXRhZGF0YToge1xuICAgICAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgY29udmVyc2F0aW9uSWQsXG4gICAgICAgIHJlcXVlc3RJZDogJ3JlcS13b3JrZmxvdy0wMDInXG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnNvbGUubG9nKCdTdGVwIDI6IFJlcXVlc3RpbmcgYW5hbHlzaXMuLi4nKTtcbiAgICBhd2FpdCB0aGlzLm1lc3NhZ2VCdXMuc2VuZE1lc3NhZ2UoYW5hbHlzaXNSZXF1ZXN0KTtcbiAgICBhd2FpdCB0aGlzLmRlbGF5KDE1MDApO1xuXG4gICAgLy8gU3RlcCAzOiBBbmFseXNpcyBhZ2VudCByZXF1ZXN0cyBjb21wbGlhbmNlIGNoZWNrXG4gICAgY29uc3QgY29tcGxpYW5jZVJlcXVlc3Q6IEFnZW50TWVzc2FnZSA9IHtcbiAgICAgIHNlbmRlcjogJ2FuYWx5c2lzJyxcbiAgICAgIHJlY2lwaWVudDogJ2NvbXBsaWFuY2UnLFxuICAgICAgbWVzc2FnZVR5cGU6ICdyZXF1ZXN0JyxcbiAgICAgIGNvbnRlbnQ6IHtcbiAgICAgICAgdGFzazogJ2NvbXBsaWFuY2VfY2hlY2snLFxuICAgICAgICBpbnZlc3RtZW50czogWydTT0xBUl9DT1JQJywgJ1dJTkRfRU5FUkdZX0lOQyddLFxuICAgICAgICByZWd1bGF0aW9uczogWydFU0cnLCAnU0VDX0ZJTElORyddXG4gICAgICB9LFxuICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgcHJpb3JpdHk6ICdoaWdoJyxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICBjb252ZXJzYXRpb25JZCxcbiAgICAgICAgcmVxdWVzdElkOiAncmVxLXdvcmtmbG93LTAwMydcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc29sZS5sb2coJ1N0ZXAgMzogQ2hlY2tpbmcgY29tcGxpYW5jZS4uLicpO1xuICAgIGF3YWl0IHRoaXMubWVzc2FnZUJ1cy5zZW5kTWVzc2FnZShjb21wbGlhbmNlUmVxdWVzdCk7XG4gICAgYXdhaXQgdGhpcy5kZWxheSgxNTAwKTtcblxuICAgIC8vIFN0ZXAgNDogU3ludGhlc2lzIGFnZW50IGNyZWF0ZXMgZmluYWwgcmVwb3J0XG4gICAgY29uc3Qgc3ludGhlc2lzUmVxdWVzdDogQWdlbnRNZXNzYWdlID0ge1xuICAgICAgc2VuZGVyOiAnc3VwZXJ2aXNvcicsXG4gICAgICByZWNpcGllbnQ6ICdzeW50aGVzaXMnLFxuICAgICAgbWVzc2FnZVR5cGU6ICdyZXF1ZXN0JyxcbiAgICAgIGNvbnRlbnQ6IHtcbiAgICAgICAgdGFzazogJ2NyZWF0ZV9pbnZlc3RtZW50X3JlcG9ydCcsXG4gICAgICAgIGNvbnZlcnNhdGlvbklkLFxuICAgICAgICBpbmNsdWRlQWxsRGF0YTogdHJ1ZVxuICAgICAgfSxcbiAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICBjb252ZXJzYXRpb25JZCxcbiAgICAgICAgcmVxdWVzdElkOiAncmVxLXdvcmtmbG93LTAwNCdcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc29sZS5sb2coJ1N0ZXAgNDogQ3JlYXRpbmcgZmluYWwgcmVwb3J0Li4uJyk7XG4gICAgYXdhaXQgdGhpcy5tZXNzYWdlQnVzLnNlbmRNZXNzYWdlKHN5bnRoZXNpc1JlcXVlc3QpO1xuICAgIGF3YWl0IHRoaXMuZGVsYXkoMjAwMCk7XG5cbiAgICAvLyBTaG93IGNvbnZlcnNhdGlvbiBoaXN0b3J5XG4gICAgY29uc3QgaGlzdG9yeSA9IHRoaXMubWVzc2FnZUJ1cy5nZXRDb252ZXJzYXRpb25IaXN0b3J5KGNvbnZlcnNhdGlvbklkKTtcbiAgICBjb25zb2xlLmxvZyhgV29ya2Zsb3cgY29tcGxldGVkIHdpdGggJHtoaXN0b3J5Lmxlbmd0aH0gbWVzc2FnZXMgZXhjaGFuZ2VkYCk7XG4gICAgY29uc29sZS5sb2coJycpO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXR1cEV2ZW50TGlzdGVuZXJzKCk6IHZvaWQge1xuICAgIC8vIE1lc3NhZ2UgYnVzIGV2ZW50c1xuICAgIHRoaXMubWVzc2FnZUJ1cy5vbignYWdlbnQtc3Vic2NyaWJlZCcsIChldmVudCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coYPCflIwgQWdlbnQgJHtldmVudC5hZ2VudFR5cGV9IHN1YnNjcmliZWQgdG8gbWVzc2FnZXNgKTtcbiAgICB9KTtcblxuICAgIHRoaXMubWVzc2FnZUJ1cy5vbignbWVzc2FnZS1yZXRyeS1mYWlsZWQnLCAoZXZlbnQpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGDwn5SEIE1lc3NhZ2UgcmV0cnkgZmFpbGVkOiAke2V2ZW50Lm1lc3NhZ2VJZH0gKCR7ZXZlbnQucmV0cnlDb3VudH0gYXR0ZW1wdHMpYCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLm1lc3NhZ2VCdXMub24oJ2NvbnZlcnNhdGlvbi11cGRhdGVkJywgKGNvbnRleHQpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGDwn5KsIENvbnZlcnNhdGlvbiAke2NvbnRleHQuaWR9IHVwZGF0ZWQgKHBoYXNlOiAke2NvbnRleHQuY3VycmVudFBoYXNlfSlgKTtcbiAgICB9KTtcblxuICAgIC8vIEVycm9yIGhhbmRsZXIgZXZlbnRzXG4gICAgdGhpcy5lcnJvckhhbmRsZXIub24oJ2NvbW11bmljYXRpb24tZXJyb3InLCAoZXJyb3IpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGDimqDvuI8gQ29tbXVuaWNhdGlvbiBlcnJvcjogJHtlcnJvci50eXBlfSAtICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICB9KTtcblxuICAgIHRoaXMuZXJyb3JIYW5kbGVyLm9uKCdjaXJjdWl0LWJyZWFrZXItb3BlbmVkJywgKGV2ZW50KSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhg8J+UtCBDaXJjdWl0IGJyZWFrZXIgb3BlbmVkIGZvciBhZ2VudDogJHtldmVudC5hZ2VudFR5cGV9YCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmVycm9ySGFuZGxlci5vbignbWVzc2FnZS1tb3ZlZC10by1kbHEnLCAoZXJyb3IpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGDwn5OuIE1lc3NhZ2UgbW92ZWQgdG8gZGVhZCBsZXR0ZXIgcXVldWU6ICR7ZXJyb3IuaWR9YCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGluaXRpYWxpemVBZ2VudHMoKTogdm9pZCB7XG4gICAgY29uc3QgYWdlbnRUeXBlczogQWdlbnRUeXBlW10gPSBbJ3N1cGVydmlzb3InLCAncGxhbm5pbmcnLCAncmVzZWFyY2gnLCAnYW5hbHlzaXMnLCAnY29tcGxpYW5jZScsICdzeW50aGVzaXMnXTtcbiAgICBcbiAgICBhZ2VudFR5cGVzLmZvckVhY2goYWdlbnRUeXBlID0+IHtcbiAgICAgIGNvbnN0IGFnZW50ID0gbmV3IE1vY2tBZ2VudChhZ2VudFR5cGUsIHRoaXMubWVzc2FnZUJ1cyk7XG4gICAgICB0aGlzLmFnZW50cy5zZXQoYWdlbnRUeXBlLCBhZ2VudCk7XG4gICAgICBhZ2VudC5zdGFydCgpO1xuICAgIH0pO1xuXG4gICAgY29uc29sZS5sb2coYPCfpJYgSW5pdGlhbGl6ZWQgJHthZ2VudFR5cGVzLmxlbmd0aH0gbW9jayBhZ2VudHNgKTtcbiAgfVxuXG4gIHByaXZhdGUgZGVsYXkobXM6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcbiAgfVxufVxuXG4vKipcbiAqIE1vY2sgQWdlbnQgZm9yIGRlbW9uc3RyYXRpb24gcHVycG9zZXNcbiAqL1xuY2xhc3MgTW9ja0FnZW50IHtcbiAgcHJpdmF0ZSBhZ2VudFR5cGU6IEFnZW50VHlwZTtcbiAgcHJpdmF0ZSBtZXNzYWdlQnVzOiBNZXNzYWdlQnVzO1xuICBwcml2YXRlIHNob3VsZEZhaWw6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihhZ2VudFR5cGU6IEFnZW50VHlwZSwgbWVzc2FnZUJ1czogTWVzc2FnZUJ1cykge1xuICAgIHRoaXMuYWdlbnRUeXBlID0gYWdlbnRUeXBlO1xuICAgIHRoaXMubWVzc2FnZUJ1cyA9IG1lc3NhZ2VCdXM7XG4gIH1cblxuICBzdGFydCgpOiB2b2lkIHtcbiAgICB0aGlzLm1lc3NhZ2VCdXMuc3Vic2NyaWJlKHtcbiAgICAgIGFnZW50VHlwZTogdGhpcy5hZ2VudFR5cGUsXG4gICAgICBtZXNzYWdlVHlwZXM6IFsnKiddLCAvLyBTdWJzY3JpYmUgdG8gYWxsIG1lc3NhZ2UgdHlwZXNcbiAgICAgIGNhbGxiYWNrOiB0aGlzLmhhbmRsZU1lc3NhZ2UuYmluZCh0aGlzKVxuICAgIH0pO1xuICB9XG5cbiAgc2V0U2hvdWxkRmFpbChzaG91bGRGYWlsOiBib29sZWFuKTogdm9pZCB7XG4gICAgdGhpcy5zaG91bGRGYWlsID0gc2hvdWxkRmFpbDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaGFuZGxlTWVzc2FnZShtZXNzYWdlOiBBZ2VudE1lc3NhZ2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5zaG91bGRGYWlsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEFnZW50ICR7dGhpcy5hZ2VudFR5cGV9IGlzIGNvbmZpZ3VyZWQgdG8gZmFpbGApO1xuICAgIH1cblxuICAgIC8vIFNpbXVsYXRlIHByb2Nlc3NpbmcgdGltZVxuICAgIGF3YWl0IHRoaXMuZGVsYXkoTWF0aC5yYW5kb20oKSAqIDUwMCArIDIwMCk7XG5cbiAgICBjb25zb2xlLmxvZyhg8J+kliAke3RoaXMuYWdlbnRUeXBlfSBwcm9jZXNzZWQgbWVzc2FnZTogJHttZXNzYWdlLm1lc3NhZ2VUeXBlfSBmcm9tICR7bWVzc2FnZS5zZW5kZXJ9YCk7XG5cbiAgICAvLyBTaW11bGF0ZSByZXNwb25zZXMgZm9yIGNlcnRhaW4gbWVzc2FnZSB0eXBlc1xuICAgIGlmIChtZXNzYWdlLm1lc3NhZ2VUeXBlID09PSAncmVxdWVzdCcpIHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlOiBBZ2VudE1lc3NhZ2UgPSB7XG4gICAgICAgIHNlbmRlcjogdGhpcy5hZ2VudFR5cGUsXG4gICAgICAgIHJlY2lwaWVudDogbWVzc2FnZS5zZW5kZXIsXG4gICAgICAgIG1lc3NhZ2VUeXBlOiAncmVzcG9uc2UnLFxuICAgICAgICBjb250ZW50OiB7XG4gICAgICAgICAgc3RhdHVzOiAnY29tcGxldGVkJyxcbiAgICAgICAgICByZXN1bHQ6IGAke3RoaXMuYWdlbnRUeXBlfSBjb21wbGV0ZWQgdGFzazogJHttZXNzYWdlLmNvbnRlbnQ/LnRhc2sgfHwgJ3Vua25vd24nfWAsXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpXG4gICAgICAgIH0sXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgcHJpb3JpdHk6IG1lc3NhZ2UubWV0YWRhdGEucHJpb3JpdHksXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIGNvbnZlcnNhdGlvbklkOiBtZXNzYWdlLm1ldGFkYXRhLmNvbnZlcnNhdGlvbklkLFxuICAgICAgICAgIHJlcXVlc3RJZDogbWVzc2FnZS5tZXRhZGF0YS5yZXF1ZXN0SWRcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgLy8gU2VuZCByZXNwb25zZSBiYWNrICh3aXRoIHNtYWxsIGRlbGF5IHRvIHNpbXVsYXRlIHByb2Nlc3NpbmcpXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5tZXNzYWdlQnVzLnNlbmRNZXNzYWdlKHJlc3BvbnNlKS5jYXRjaChjb25zb2xlLmVycm9yKTtcbiAgICAgIH0sIDEwMCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBkZWxheShtczogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtcykpO1xuICB9XG59XG5cbi8qKlxuICogUnVuIHRoZSBleGFtcGxlXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJ1bkFnZW50Q29tbXVuaWNhdGlvbkV4YW1wbGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGV4YW1wbGUgPSBuZXcgQWdlbnRDb21tdW5pY2F0aW9uRXhhbXBsZSgpO1xuICBhd2FpdCBleGFtcGxlLnJ1bkV4YW1wbGUoKTtcbn1cblxuLy8gRXhwb3J0IGZvciB1c2UgaW4gb3RoZXIgbW9kdWxlc1xuZXhwb3J0IHsgQWdlbnRDb21tdW5pY2F0aW9uRXhhbXBsZSwgcnVuQWdlbnRDb21tdW5pY2F0aW9uRXhhbXBsZSB9O1xuXG4vLyBSdW4gaWYgdGhpcyBmaWxlIGlzIGV4ZWN1dGVkIGRpcmVjdGx5XG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgcnVuQWdlbnRDb21tdW5pY2F0aW9uRXhhbXBsZSgpLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xufSJdfQ==