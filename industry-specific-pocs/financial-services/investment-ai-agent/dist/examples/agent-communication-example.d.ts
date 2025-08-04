/**
 * Agent Communication System Example
 *
 * This example demonstrates how to use the agent communication system
 * including message bus, routing, and error handling.
 */
declare class AgentCommunicationExample {
    private messageBus;
    private messageRouter;
    private errorHandler;
    private agents;
    constructor();
    /**
     * Run the communication example
     */
    runExample(): Promise<void>;
    private demonstrateDirectMessage;
    private demonstrateBroadcastMessage;
    private demonstrateMessageRouting;
    private demonstrateLoadBalancing;
    private demonstrateErrorHandling;
    private demonstrateMultiAgentWorkflow;
    private setupEventListeners;
    private initializeAgents;
    private delay;
}
/**
 * Run the example
 */
declare function runAgentCommunicationExample(): Promise<void>;
export { AgentCommunicationExample, runAgentCommunicationExample };
