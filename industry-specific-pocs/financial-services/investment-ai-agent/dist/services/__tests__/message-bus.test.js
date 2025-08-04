"use strict";
/**
 * Tests for MessageBus service
 */
Object.defineProperty(exports, "__esModule", { value: true });
const message_bus_1 = require("../communication/message-bus");
describe('MessageBus', () => {
    let messageBus;
    let testConfig;
    beforeEach(() => {
        testConfig = {
            maxRetries: 2,
            retryDelayMs: 100,
            messageTimeoutMs: 5000,
            maxQueueSize: 10,
            enablePersistence: false
        };
        messageBus = new message_bus_1.MessageBus(testConfig);
    });
    afterEach(() => {
        messageBus.cleanup();
        // Clear any pending timers to prevent memory leaks
        jest.clearAllTimers();
    });
    describe('sendMessage', () => {
        it('should send a message successfully to subscribed agent', async () => {
            const mockCallback = jest.fn().mockResolvedValue(undefined);
            const subscription = {
                agentType: 'research',
                messageTypes: ['request'],
                callback: mockCallback
            };
            messageBus.subscribe(subscription);
            const message = {
                sender: 'supervisor',
                recipient: 'research',
                messageType: 'request',
                content: { task: 'analyze market data' },
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'conv-123',
                    requestId: 'req-456'
                }
            };
            const result = await messageBus.sendMessage(message);
            expect(result.success).toBe(true);
            expect(result.deliveredAt).toBeDefined();
            expect(mockCallback).toHaveBeenCalledWith(message);
        });
        it('should handle broadcast messages', async () => {
            const mockCallback1 = jest.fn().mockResolvedValue(undefined);
            const mockCallback2 = jest.fn().mockResolvedValue(undefined);
            messageBus.subscribe({
                agentType: 'research',
                messageTypes: ['update'],
                callback: mockCallback1
            });
            messageBus.subscribe({
                agentType: 'analysis',
                messageTypes: ['update'],
                callback: mockCallback2
            });
            const message = {
                sender: 'supervisor',
                recipient: 'broadcast',
                messageType: 'update',
                content: { status: 'system maintenance' },
                metadata: {
                    priority: 'high',
                    timestamp: new Date(),
                    conversationId: 'conv-123',
                    requestId: 'req-456'
                }
            };
            const result = await messageBus.sendMessage(message);
            expect(result.success).toBe(true);
            expect(mockCallback1).toHaveBeenCalledWith(message);
            expect(mockCallback2).toHaveBeenCalledWith(message);
        });
        it('should queue messages when no subscribers are available', async () => {
            const message = {
                sender: 'supervisor',
                recipient: 'research',
                messageType: 'request',
                content: { task: 'analyze market data' },
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'conv-123',
                    requestId: 'req-456'
                }
            };
            const result = await messageBus.sendMessage(message);
            expect(result.success).toBe(false);
            expect(result.error).toContain('No subscribers found');
            const queueStatus = messageBus.getQueueStatus();
            expect(queueStatus.messagesByAgent['research']).toBe(1);
        });
        it('should validate message format', async () => {
            const invalidMessage = {
                sender: 'supervisor',
                // missing recipient
                messageType: 'request',
                content: { task: 'analyze market data' },
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'conv-123',
                    requestId: 'req-456'
                }
            };
            const result = await messageBus.sendMessage(invalidMessage);
            expect(result.success).toBe(false);
            expect(result.error).toContain('recipient is required');
        });
    });
    describe('subscription management', () => {
        it('should allow agents to subscribe to specific message types', () => {
            const mockCallback = jest.fn();
            const subscription = {
                agentType: 'research',
                messageTypes: ['request', 'update'],
                callback: mockCallback
            };
            messageBus.subscribe(subscription);
            // Verify subscription was added (internal state check)
            expect(messageBus.getQueueStatus().totalMessages).toBe(0);
        });
        it('should allow agents to unsubscribe', async () => {
            const mockCallback = jest.fn().mockResolvedValue(undefined);
            const subscription = {
                agentType: 'research',
                messageTypes: ['request'],
                callback: mockCallback
            };
            messageBus.subscribe(subscription);
            messageBus.unsubscribe('research');
            const message = {
                sender: 'supervisor',
                recipient: 'research',
                messageType: 'request',
                content: { task: 'analyze market data' },
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'conv-123',
                    requestId: 'req-456'
                }
            };
            const result = await messageBus.sendMessage(message);
            expect(result.success).toBe(false);
            expect(mockCallback).not.toHaveBeenCalled();
        });
    });
    describe('conversation management', () => {
        it('should track conversation history', async () => {
            const mockCallback = jest.fn().mockResolvedValue(undefined);
            messageBus.subscribe({
                agentType: 'research',
                messageTypes: ['request'],
                callback: mockCallback
            });
            const message = {
                sender: 'supervisor',
                recipient: 'research',
                messageType: 'request',
                content: { task: 'analyze market data' },
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'conv-123',
                    requestId: 'req-456'
                }
            };
            await messageBus.sendMessage(message);
            const history = messageBus.getConversationHistory('conv-123');
            expect(history).toHaveLength(1);
            expect(history[0]).toEqual(message);
        });
        it('should clear conversation data', async () => {
            const mockCallback = jest.fn().mockResolvedValue(undefined);
            messageBus.subscribe({
                agentType: 'research',
                messageTypes: ['request'],
                callback: mockCallback
            });
            const message = {
                sender: 'supervisor',
                recipient: 'research',
                messageType: 'request',
                content: { task: 'analyze market data' },
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'conv-123',
                    requestId: 'req-456'
                }
            };
            await messageBus.sendMessage(message);
            messageBus.clearConversation('conv-123');
            const history = messageBus.getConversationHistory('conv-123');
            expect(history).toHaveLength(0);
        });
    });
    describe('error handling and retries', () => {
        it('should retry failed message deliveries', async () => {
            let callCount = 0;
            const mockCallback = jest.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    throw new Error('Temporary failure');
                }
                return Promise.resolve();
            });
            messageBus.subscribe({
                agentType: 'research',
                messageTypes: ['request'],
                callback: mockCallback
            });
            const message = {
                sender: 'supervisor',
                recipient: 'research',
                messageType: 'request',
                content: { task: 'analyze market data' },
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'conv-123',
                    requestId: 'req-456'
                }
            };
            const result = await messageBus.sendMessage(message);
            // Initial delivery should fail
            expect(result.success).toBe(false);
            expect(mockCallback).toHaveBeenCalledTimes(1);
            // Wait for retry with longer timeout
            await new Promise(resolve => setTimeout(resolve, 1200));
            // Should have retried and succeeded
            expect(mockCallback).toHaveBeenCalledTimes(2);
        });
        it('should emit retry events', (done) => {
            const mockCallback = jest.fn().mockRejectedValue(new Error('Always fails'));
            messageBus.subscribe({
                agentType: 'research',
                messageTypes: ['request'],
                callback: mockCallback
            });
            messageBus.on('message-retry-failed', (event) => {
                expect(event.retryCount).toBeGreaterThan(0);
                expect(event.error).toBeDefined();
                done();
            });
            const message = {
                sender: 'supervisor',
                recipient: 'research',
                messageType: 'request',
                content: { task: 'analyze market data' },
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'conv-123',
                    requestId: 'req-456'
                }
            };
            messageBus.sendMessage(message);
        });
    });
    describe('queue management', () => {
        it('should provide queue status information', async () => {
            // Send message to non-existent subscriber to queue it
            const message = {
                sender: 'supervisor',
                recipient: 'research',
                messageType: 'request',
                content: { task: 'analyze market data' },
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'conv-123',
                    requestId: 'req-456'
                }
            };
            await messageBus.sendMessage(message);
            const status = messageBus.getQueueStatus();
            expect(status.totalMessages).toBe(1);
            expect(status.messagesByAgent['research']).toBe(1);
            expect(status.retryQueueSize).toBeGreaterThanOrEqual(0);
        });
        it('should respect maximum queue size', async () => {
            const maxQueueSize = testConfig.maxQueueSize || 10;
            // Send more messages than queue size
            for (let i = 0; i < maxQueueSize + 5; i++) {
                const message = {
                    sender: 'supervisor',
                    recipient: 'research',
                    messageType: 'request',
                    content: { task: `analyze data ${i}` },
                    metadata: {
                        priority: 'medium',
                        timestamp: new Date(),
                        conversationId: 'conv-123',
                        requestId: `req-${i}`
                    }
                };
                await messageBus.sendMessage(message);
            }
            const status = messageBus.getQueueStatus();
            expect(status.messagesByAgent['research']).toBeLessThanOrEqual(maxQueueSize);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZS1idXMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9fX3Rlc3RzX18vbWVzc2FnZS1idXMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsOERBQWlHO0FBR2pHLFFBQVEsQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO0lBQzFCLElBQUksVUFBc0IsQ0FBQztJQUMzQixJQUFJLFVBQXFDLENBQUM7SUFFMUMsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUNkLFVBQVUsR0FBRztZQUNYLFVBQVUsRUFBRSxDQUFDO1lBQ2IsWUFBWSxFQUFFLEdBQUc7WUFDakIsZ0JBQWdCLEVBQUUsSUFBSTtZQUN0QixZQUFZLEVBQUUsRUFBRTtZQUNoQixpQkFBaUIsRUFBRSxLQUFLO1NBQ3pCLENBQUM7UUFDRixVQUFVLEdBQUcsSUFBSSx3QkFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzFDLENBQUMsQ0FBQyxDQUFDO0lBRUgsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNiLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNyQixtREFBbUQ7UUFDbkQsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQ3hCLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUU7UUFDM0IsRUFBRSxDQUFDLHdEQUF3RCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3RFLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM1RCxNQUFNLFlBQVksR0FBd0I7Z0JBQ3hDLFNBQVMsRUFBRSxVQUFVO2dCQUNyQixZQUFZLEVBQUUsQ0FBQyxTQUFTLENBQUM7Z0JBQ3pCLFFBQVEsRUFBRSxZQUFZO2FBQ3ZCLENBQUM7WUFFRixVQUFVLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lB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R0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFlBQVksR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3pDLE1BQU0sT0FBTyxHQUFpQjtvQkFDNUIsTUFBTSxFQUFFLFlBQVk7b0JBQ3BCLFNBQVMsRUFBRSxVQUFVO29CQUNyQixXQUFXLEVBQUUsU0FBUztvQkFDdEIsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixDQUFDLEVBQUUsRUFBRTtvQkFDdEMsUUFBUSxFQUFFO3dCQUNSLFFBQVEsRUFBRSxRQUFRO3dCQUNsQixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUU7d0JBQ3JCLGNBQWMsRUFBRSxVQUFVO3dCQUMxQixTQUFTLEVBQUUsT0FBTyxDQUFDLEVBQUU7cUJBQ3RCO2lCQUNGLENBQUM7Z0JBRUYsTUFBTSxVQUFVLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQ3ZDO1lBRUQsTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDL0UsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBUZXN0cyBmb3IgTWVzc2FnZUJ1cyBzZXJ2aWNlXG4gKi9cblxuaW1wb3J0IHsgTWVzc2FnZUJ1cywgTWVzc2FnZUJ1c0NvbmZpZywgTWVzc2FnZVN1YnNjcmlwdGlvbiB9IGZyb20gJy4uL2NvbW11bmljYXRpb24vbWVzc2FnZS1idXMnO1xuaW1wb3J0IHsgQWdlbnRNZXNzYWdlLCBBZ2VudFR5cGUgfSBmcm9tICcuLi8uLi9tb2RlbHMvYWdlbnQnO1xuXG5kZXNjcmliZSgnTWVzc2FnZUJ1cycsICgpID0+IHtcbiAgbGV0IG1lc3NhZ2VCdXM6IE1lc3NhZ2VCdXM7XG4gIGxldCB0ZXN0Q29uZmlnOiBQYXJ0aWFsPE1lc3NhZ2VCdXNDb25maWc+O1xuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIHRlc3RDb25maWcgPSB7XG4gICAgICBtYXhSZXRyaWVzOiAyLFxuICAgICAgcmV0cnlEZWxheU1zOiAxMDAsXG4gICAgICBtZXNzYWdlVGltZW91dE1zOiA1MDAwLFxuICAgICAgbWF4UXVldWVTaXplOiAxMCxcbiAgICAgIGVuYWJsZVBlcnNpc3RlbmNlOiBmYWxzZVxuICAgIH07XG4gICAgbWVzc2FnZUJ1cyA9IG5ldyBNZXNzYWdlQnVzKHRlc3RDb25maWcpO1xuICB9KTtcblxuICBhZnRlckVhY2goKCkgPT4ge1xuICAgIG1lc3NhZ2VCdXMuY2xlYW51cCgpO1xuICAgIC8vIENsZWFyIGFueSBwZW5kaW5nIHRpbWVycyB0byBwcmV2ZW50IG1lbW9yeSBsZWFrc1xuICAgIGplc3QuY2xlYXJBbGxUaW1lcnMoKTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3NlbmRNZXNzYWdlJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgc2VuZCBhIG1lc3NhZ2Ugc3VjY2Vzc2Z1bGx5IHRvIHN1YnNjcmliZWQgYWdlbnQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBtb2NrQ2FsbGJhY2sgPSBqZXN0LmZuKCkubW9ja1Jlc29sdmVkVmFsdWUodW5kZWZpbmVkKTtcbiAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbjogTWVzc2FnZVN1YnNjcmlwdGlvbiA9IHtcbiAgICAgICAgYWdlbnRUeXBlOiAncmVzZWFyY2gnLFxuICAgICAgICBtZXNzYWdlVHlwZXM6IFsncmVxdWVzdCddLFxuICAgICAgICBjYWxsYmFjazogbW9ja0NhbGxiYWNrXG4gICAgICB9O1xuXG4gICAgICBtZXNzYWdlQnVzLnN1YnNjcmliZShzdWJzY3JpcHRpb24pO1xuXG4gICAgICBjb25zdCBtZXNzYWdlOiBBZ2VudE1lc3NhZ2UgPSB7XG4gICAgICAgIHNlbmRlcjogJ3N1cGVydmlzb3InLFxuICAgICAgICByZWNpcGllbnQ6ICdyZXNlYXJjaCcsXG4gICAgICAgIG1lc3NhZ2VUeXBlOiAncmVxdWVzdCcsXG4gICAgICAgIGNvbnRlbnQ6IHsgdGFzazogJ2FuYWx5emUgbWFya2V0IGRhdGEnIH0sXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgICBjb252ZXJzYXRpb25JZDogJ2NvbnYtMTIzJyxcbiAgICAgICAgICByZXF1ZXN0SWQ6ICdyZXEtNDU2J1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBtZXNzYWdlQnVzLnNlbmRNZXNzYWdlKG1lc3NhZ2UpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QocmVzdWx0LmRlbGl2ZXJlZEF0KS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KG1vY2tDYWxsYmFjaykudG9IYXZlQmVlbkNhbGxlZFdpdGgobWVzc2FnZSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBicm9hZGNhc3QgbWVzc2FnZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBtb2NrQ2FsbGJhY2sxID0gamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKHVuZGVmaW5lZCk7XG4gICAgICBjb25zdCBtb2NrQ2FsbGJhY2syID0gamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKHVuZGVmaW5lZCk7XG5cbiAgICAgIG1lc3NhZ2VCdXMuc3Vic2NyaWJlKHtcbiAgICAgICAgYWdlbnRUeXBlOiAncmVzZWFyY2gnLFxuICAgICAgICBtZXNzYWdlVHlwZXM6IFsndXBkYXRlJ10sXG4gICAgICAgIGNhbGxiYWNrOiBtb2NrQ2FsbGJhY2sxXG4gICAgICB9KTtcblxuICAgICAgbWVzc2FnZUJ1cy5zdWJzY3JpYmUoe1xuICAgICAgICBhZ2VudFR5cGU6ICdhbmFseXNpcycsXG4gICAgICAgIG1lc3NhZ2VUeXBlczogWyd1cGRhdGUnXSxcbiAgICAgICAgY2FsbGJhY2s6IG1vY2tDYWxsYmFjazJcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBtZXNzYWdlOiBBZ2VudE1lc3NhZ2UgPSB7XG4gICAgICAgIHNlbmRlcjogJ3N1cGVydmlzb3InLFxuICAgICAgICByZWNpcGllbnQ6ICdicm9hZGNhc3QnLFxuICAgICAgICBtZXNzYWdlVHlwZTogJ3VwZGF0ZScsXG4gICAgICAgIGNvbnRlbnQ6IHsgc3RhdHVzOiAnc3lzdGVtIG1haW50ZW5hbmNlJyB9LFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIHByaW9yaXR5OiAnaGlnaCcsXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIGNvbnZlcnNhdGlvbklkOiAnY29udi0xMjMnLFxuICAgICAgICAgIHJlcXVlc3RJZDogJ3JlcS00NTYnXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG1lc3NhZ2VCdXMuc2VuZE1lc3NhZ2UobWVzc2FnZSk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuc3VjY2VzcykudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChtb2NrQ2FsbGJhY2sxKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChtZXNzYWdlKTtcbiAgICAgIGV4cGVjdChtb2NrQ2FsbGJhY2syKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChtZXNzYWdlKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcXVldWUgbWVzc2FnZXMgd2hlbiBubyBzdWJzY3JpYmVycyBhcmUgYXZhaWxhYmxlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbWVzc2FnZTogQWdlbnRNZXNzYWdlID0ge1xuICAgICAgICBzZW5kZXI6ICdzdXBlcnZpc29yJyxcbiAgICAgICAgcmVjaXBpZW50OiAncmVzZWFyY2gnLFxuICAgICAgICBtZXNzYWdlVHlwZTogJ3JlcXVlc3QnLFxuICAgICAgICBjb250ZW50OiB7IHRhc2s6ICdhbmFseXplIG1hcmtldCBkYXRhJyB9LFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgY29udmVyc2F0aW9uSWQ6ICdjb252LTEyMycsXG4gICAgICAgICAgcmVxdWVzdElkOiAncmVxLTQ1NidcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbWVzc2FnZUJ1cy5zZW5kTWVzc2FnZShtZXNzYWdlKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3IpLnRvQ29udGFpbignTm8gc3Vic2NyaWJlcnMgZm91bmQnKTtcblxuICAgICAgY29uc3QgcXVldWVTdGF0dXMgPSBtZXNzYWdlQnVzLmdldFF1ZXVlU3RhdHVzKCk7XG4gICAgICBleHBlY3QocXVldWVTdGF0dXMubWVzc2FnZXNCeUFnZW50WydyZXNlYXJjaCddKS50b0JlKDEpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSBtZXNzYWdlIGZvcm1hdCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGludmFsaWRNZXNzYWdlID0ge1xuICAgICAgICBzZW5kZXI6ICdzdXBlcnZpc29yJyxcbiAgICAgICAgLy8gbWlzc2luZyByZWNpcGllbnRcbiAgICAgICAgbWVzc2FnZVR5cGU6ICdyZXF1ZXN0JyxcbiAgICAgICAgY29udGVudDogeyB0YXNrOiAnYW5hbHl6ZSBtYXJrZXQgZGF0YScgfSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIGNvbnZlcnNhdGlvbklkOiAnY29udi0xMjMnLFxuICAgICAgICAgIHJlcXVlc3RJZDogJ3JlcS00NTYnXG4gICAgICAgIH1cbiAgICAgIH0gYXMgQWdlbnRNZXNzYWdlO1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBtZXNzYWdlQnVzLnNlbmRNZXNzYWdlKGludmFsaWRNZXNzYWdlKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3IpLnRvQ29udGFpbigncmVjaXBpZW50IGlzIHJlcXVpcmVkJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdzdWJzY3JpcHRpb24gbWFuYWdlbWVudCcsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGFsbG93IGFnZW50cyB0byBzdWJzY3JpYmUgdG8gc3BlY2lmaWMgbWVzc2FnZSB0eXBlcycsICgpID0+IHtcbiAgICAgIGNvbnN0IG1vY2tDYWxsYmFjayA9IGplc3QuZm4oKTtcbiAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbjogTWVzc2FnZVN1YnNjcmlwdGlvbiA9IHtcbiAgICAgICAgYWdlbnRUeXBlOiAncmVzZWFyY2gnLFxuICAgICAgICBtZXNzYWdlVHlwZXM6IFsncmVxdWVzdCcsICd1cGRhdGUnXSxcbiAgICAgICAgY2FsbGJhY2s6IG1vY2tDYWxsYmFja1xuICAgICAgfTtcblxuICAgICAgbWVzc2FnZUJ1cy5zdWJzY3JpYmUoc3Vic2NyaXB0aW9uKTtcblxuICAgICAgLy8gVmVyaWZ5IHN1YnNjcmlwdGlvbiB3YXMgYWRkZWQgKGludGVybmFsIHN0YXRlIGNoZWNrKVxuICAgICAgZXhwZWN0KG1lc3NhZ2VCdXMuZ2V0UXVldWVTdGF0dXMoKS50b3RhbE1lc3NhZ2VzKS50b0JlKDApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhbGxvdyBhZ2VudHMgdG8gdW5zdWJzY3JpYmUnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBtb2NrQ2FsbGJhY2sgPSBqZXN0LmZuKCkubW9ja1Jlc29sdmVkVmFsdWUodW5kZWZpbmVkKTtcbiAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbjogTWVzc2FnZVN1YnNjcmlwdGlvbiA9IHtcbiAgICAgICAgYWdlbnRUeXBlOiAncmVzZWFyY2gnLFxuICAgICAgICBtZXNzYWdlVHlwZXM6IFsncmVxdWVzdCddLFxuICAgICAgICBjYWxsYmFjazogbW9ja0NhbGxiYWNrXG4gICAgICB9O1xuXG4gICAgICBtZXNzYWdlQnVzLnN1YnNjcmliZShzdWJzY3JpcHRpb24pO1xuICAgICAgbWVzc2FnZUJ1cy51bnN1YnNjcmliZSgncmVzZWFyY2gnKTtcblxuICAgICAgY29uc3QgbWVzc2FnZTogQWdlbnRNZXNzYWdlID0ge1xuICAgICAgICBzZW5kZXI6ICdzdXBlcnZpc29yJyxcbiAgICAgICAgcmVjaXBpZW50OiAncmVzZWFyY2gnLFxuICAgICAgICBtZXNzYWdlVHlwZTogJ3JlcXVlc3QnLFxuICAgICAgICBjb250ZW50OiB7IHRhc2s6ICdhbmFseXplIG1hcmtldCBkYXRhJyB9LFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgY29udmVyc2F0aW9uSWQ6ICdjb252LTEyMycsXG4gICAgICAgICAgcmVxdWVzdElkOiAncmVxLTQ1NidcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbWVzc2FnZUJ1cy5zZW5kTWVzc2FnZShtZXNzYWdlKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdChtb2NrQ2FsbGJhY2spLm5vdC50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdjb252ZXJzYXRpb24gbWFuYWdlbWVudCcsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHRyYWNrIGNvbnZlcnNhdGlvbiBoaXN0b3J5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbW9ja0NhbGxiYWNrID0gamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKHVuZGVmaW5lZCk7XG4gICAgICBtZXNzYWdlQnVzLnN1YnNjcmliZSh7XG4gICAgICAgIGFnZW50VHlwZTogJ3Jlc2VhcmNoJyxcbiAgICAgICAgbWVzc2FnZVR5cGVzOiBbJ3JlcXVlc3QnXSxcbiAgICAgICAgY2FsbGJhY2s6IG1vY2tDYWxsYmFja1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IG1lc3NhZ2U6IEFnZW50TWVzc2FnZSA9IHtcbiAgICAgICAgc2VuZGVyOiAnc3VwZXJ2aXNvcicsXG4gICAgICAgIHJlY2lwaWVudDogJ3Jlc2VhcmNoJyxcbiAgICAgICAgbWVzc2FnZVR5cGU6ICdyZXF1ZXN0JyxcbiAgICAgICAgY29udGVudDogeyB0YXNrOiAnYW5hbHl6ZSBtYXJrZXQgZGF0YScgfSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIGNvbnZlcnNhdGlvbklkOiAnY29udi0xMjMnLFxuICAgICAgICAgIHJlcXVlc3RJZDogJ3JlcS00NTYnXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IG1lc3NhZ2VCdXMuc2VuZE1lc3NhZ2UobWVzc2FnZSk7XG5cbiAgICAgIGNvbnN0IGhpc3RvcnkgPSBtZXNzYWdlQnVzLmdldENvbnZlcnNhdGlvbkhpc3RvcnkoJ2NvbnYtMTIzJyk7XG4gICAgICBleHBlY3QoaGlzdG9yeSkudG9IYXZlTGVuZ3RoKDEpO1xuICAgICAgZXhwZWN0KGhpc3RvcnlbMF0pLnRvRXF1YWwobWVzc2FnZSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGNsZWFyIGNvbnZlcnNhdGlvbiBkYXRhJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbW9ja0NhbGxiYWNrID0gamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKHVuZGVmaW5lZCk7XG4gICAgICBtZXNzYWdlQnVzLnN1YnNjcmliZSh7XG4gICAgICAgIGFnZW50VHlwZTogJ3Jlc2VhcmNoJyxcbiAgICAgICAgbWVzc2FnZVR5cGVzOiBbJ3JlcXVlc3QnXSxcbiAgICAgICAgY2FsbGJhY2s6IG1vY2tDYWxsYmFja1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IG1lc3NhZ2U6IEFnZW50TWVzc2FnZSA9IHtcbiAgICAgICAgc2VuZGVyOiAnc3VwZXJ2aXNvcicsXG4gICAgICAgIHJlY2lwaWVudDogJ3Jlc2VhcmNoJyxcbiAgICAgICAgbWVzc2FnZVR5cGU6ICdyZXF1ZXN0JyxcbiAgICAgICAgY29udGVudDogeyB0YXNrOiAnYW5hbHl6ZSBtYXJrZXQgZGF0YScgfSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIGNvbnZlcnNhdGlvbklkOiAnY29udi0xMjMnLFxuICAgICAgICAgIHJlcXVlc3RJZDogJ3JlcS00NTYnXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IG1lc3NhZ2VCdXMuc2VuZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICBtZXNzYWdlQnVzLmNsZWFyQ29udmVyc2F0aW9uKCdjb252LTEyMycpO1xuXG4gICAgICBjb25zdCBoaXN0b3J5ID0gbWVzc2FnZUJ1cy5nZXRDb252ZXJzYXRpb25IaXN0b3J5KCdjb252LTEyMycpO1xuICAgICAgZXhwZWN0KGhpc3RvcnkpLnRvSGF2ZUxlbmd0aCgwKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2Vycm9yIGhhbmRsaW5nIGFuZCByZXRyaWVzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcmV0cnkgZmFpbGVkIG1lc3NhZ2UgZGVsaXZlcmllcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGxldCBjYWxsQ291bnQgPSAwO1xuICAgICAgY29uc3QgbW9ja0NhbGxiYWNrID0gamVzdC5mbigpLm1vY2tJbXBsZW1lbnRhdGlvbigoKSA9PiB7XG4gICAgICAgIGNhbGxDb3VudCsrO1xuICAgICAgICBpZiAoY2FsbENvdW50ID09PSAxKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUZW1wb3JhcnkgZmFpbHVyZScpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH0pO1xuXG4gICAgICBtZXNzYWdlQnVzLnN1YnNjcmliZSh7XG4gICAgICAgIGFnZW50VHlwZTogJ3Jlc2VhcmNoJyxcbiAgICAgICAgbWVzc2FnZVR5cGVzOiBbJ3JlcXVlc3QnXSxcbiAgICAgICAgY2FsbGJhY2s6IG1vY2tDYWxsYmFja1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IG1lc3NhZ2U6IEFnZW50TWVzc2FnZSA9IHtcbiAgICAgICAgc2VuZGVyOiAnc3VwZXJ2aXNvcicsXG4gICAgICAgIHJlY2lwaWVudDogJ3Jlc2VhcmNoJyxcbiAgICAgICAgbWVzc2FnZVR5cGU6ICdyZXF1ZXN0JyxcbiAgICAgICAgY29udGVudDogeyB0YXNrOiAnYW5hbHl6ZSBtYXJrZXQgZGF0YScgfSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIGNvbnZlcnNhdGlvbklkOiAnY29udi0xMjMnLFxuICAgICAgICAgIHJlcXVlc3RJZDogJ3JlcS00NTYnXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG1lc3NhZ2VCdXMuc2VuZE1lc3NhZ2UobWVzc2FnZSk7XG5cbiAgICAgIC8vIEluaXRpYWwgZGVsaXZlcnkgc2hvdWxkIGZhaWxcbiAgICAgIGV4cGVjdChyZXN1bHQuc3VjY2VzcykudG9CZShmYWxzZSk7XG4gICAgICBleHBlY3QobW9ja0NhbGxiYWNrKS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG5cbiAgICAgIC8vIFdhaXQgZm9yIHJldHJ5IHdpdGggbG9uZ2VyIHRpbWVvdXRcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMjAwKSk7XG5cbiAgICAgIC8vIFNob3VsZCBoYXZlIHJldHJpZWQgYW5kIHN1Y2NlZWRlZFxuICAgICAgZXhwZWN0KG1vY2tDYWxsYmFjaykudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDIpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBlbWl0IHJldHJ5IGV2ZW50cycsIChkb25lKSA9PiB7XG4gICAgICBjb25zdCBtb2NrQ2FsbGJhY2sgPSBqZXN0LmZuKCkubW9ja1JlamVjdGVkVmFsdWUobmV3IEVycm9yKCdBbHdheXMgZmFpbHMnKSk7XG5cbiAgICAgIG1lc3NhZ2VCdXMuc3Vic2NyaWJlKHtcbiAgICAgICAgYWdlbnRUeXBlOiAncmVzZWFyY2gnLFxuICAgICAgICBtZXNzYWdlVHlwZXM6IFsncmVxdWVzdCddLFxuICAgICAgICBjYWxsYmFjazogbW9ja0NhbGxiYWNrXG4gICAgICB9KTtcblxuICAgICAgbWVzc2FnZUJ1cy5vbignbWVzc2FnZS1yZXRyeS1mYWlsZWQnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgZXhwZWN0KGV2ZW50LnJldHJ5Q291bnQpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgICAgZXhwZWN0KGV2ZW50LmVycm9yKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICBkb25lKCk7XG4gICAgICB9KTtcblxuICAgICAgY29uc3QgbWVzc2FnZTogQWdlbnRNZXNzYWdlID0ge1xuICAgICAgICBzZW5kZXI6ICdzdXBlcnZpc29yJyxcbiAgICAgICAgcmVjaXBpZW50OiAncmVzZWFyY2gnLFxuICAgICAgICBtZXNzYWdlVHlwZTogJ3JlcXVlc3QnLFxuICAgICAgICBjb250ZW50OiB7IHRhc2s6ICdhbmFseXplIG1hcmtldCBkYXRhJyB9LFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgY29udmVyc2F0aW9uSWQ6ICdjb252LTEyMycsXG4gICAgICAgICAgcmVxdWVzdElkOiAncmVxLTQ1NidcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgbWVzc2FnZUJ1cy5zZW5kTWVzc2FnZShtZXNzYWdlKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3F1ZXVlIG1hbmFnZW1lbnQnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBwcm92aWRlIHF1ZXVlIHN0YXR1cyBpbmZvcm1hdGlvbicsIGFzeW5jICgpID0+IHtcbiAgICAgIC8vIFNlbmQgbWVzc2FnZSB0byBub24tZXhpc3RlbnQgc3Vic2NyaWJlciB0byBxdWV1ZSBpdFxuICAgICAgY29uc3QgbWVzc2FnZTogQWdlbnRNZXNzYWdlID0ge1xuICAgICAgICBzZW5kZXI6ICdzdXBlcnZpc29yJyxcbiAgICAgICAgcmVjaXBpZW50OiAncmVzZWFyY2gnLFxuICAgICAgICBtZXNzYWdlVHlwZTogJ3JlcXVlc3QnLFxuICAgICAgICBjb250ZW50OiB7IHRhc2s6ICdhbmFseXplIG1hcmtldCBkYXRhJyB9LFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgY29udmVyc2F0aW9uSWQ6ICdjb252LTEyMycsXG4gICAgICAgICAgcmVxdWVzdElkOiAncmVxLTQ1NidcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgYXdhaXQgbWVzc2FnZUJ1cy5zZW5kTWVzc2FnZShtZXNzYWdlKTtcblxuICAgICAgY29uc3Qgc3RhdHVzID0gbWVzc2FnZUJ1cy5nZXRRdWV1ZVN0YXR1cygpO1xuICAgICAgZXhwZWN0KHN0YXR1cy50b3RhbE1lc3NhZ2VzKS50b0JlKDEpO1xuICAgICAgZXhwZWN0KHN0YXR1cy5tZXNzYWdlc0J5QWdlbnRbJ3Jlc2VhcmNoJ10pLnRvQmUoMSk7XG4gICAgICBleHBlY3Qoc3RhdHVzLnJldHJ5UXVldWVTaXplKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZXNwZWN0IG1heGltdW0gcXVldWUgc2l6ZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG1heFF1ZXVlU2l6ZSA9IHRlc3RDb25maWcubWF4UXVldWVTaXplIHx8IDEwO1xuXG4gICAgICAvLyBTZW5kIG1vcmUgbWVzc2FnZXMgdGhhbiBxdWV1ZSBzaXplXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1heFF1ZXVlU2l6ZSArIDU7IGkrKykge1xuICAgICAgICBjb25zdCBtZXNzYWdlOiBBZ2VudE1lc3NhZ2UgPSB7XG4gICAgICAgICAgc2VuZGVyOiAnc3VwZXJ2aXNvcicsXG4gICAgICAgICAgcmVjaXBpZW50OiAncmVzZWFyY2gnLFxuICAgICAgICAgIG1lc3NhZ2VUeXBlOiAncmVxdWVzdCcsXG4gICAgICAgICAgY29udGVudDogeyB0YXNrOiBgYW5hbHl6ZSBkYXRhICR7aX1gIH0sXG4gICAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgICAgIGNvbnZlcnNhdGlvbklkOiAnY29udi0xMjMnLFxuICAgICAgICAgICAgcmVxdWVzdElkOiBgcmVxLSR7aX1gXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGF3YWl0IG1lc3NhZ2VCdXMuc2VuZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHN0YXR1cyA9IG1lc3NhZ2VCdXMuZ2V0UXVldWVTdGF0dXMoKTtcbiAgICAgIGV4cGVjdChzdGF0dXMubWVzc2FnZXNCeUFnZW50WydyZXNlYXJjaCddKS50b0JlTGVzc1RoYW5PckVxdWFsKG1heFF1ZXVlU2l6ZSk7XG4gICAgfSk7XG4gIH0pO1xufSk7Il19