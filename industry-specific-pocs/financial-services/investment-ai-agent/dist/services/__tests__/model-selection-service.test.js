"use strict";
/**
 * Unit tests for Model Selection Service
 */
Object.defineProperty(exports, "__esModule", { value: true });
const model_selection_service_1 = require("../ai/model-selection-service");
describe('ModelSelectionService', () => {
    let service;
    let mockConfig;
    beforeEach(() => {
        mockConfig = {
            defaultModel: 'claude-sonnet-3.7',
            performanceThresholds: {
                accuracy: 0.80,
                latency: 6000,
                errorRate: 0.10
            },
            fallbackChain: ['claude-sonnet-3.7', 'claude-haiku-3.5', 'amazon-nova-pro'],
            maxRetries: 2
        };
        service = (0, model_selection_service_1.createModelSelectionService)(mockConfig);
    });
    describe('Model Selection Logic', () => {
        it('should select Claude Sonnet for supervisor agent tasks', async () => {
            const task = {
                type: 'text-generation',
                complexity: 'complex',
                domain: 'financial',
                priority: 'high',
                agentRole: 'supervisor'
            };
            const context = {
                dataSize: 5000,
                timeConstraint: 10000,
                accuracyRequirement: 'high',
                explainabilityRequirement: 'high'
            };
            const result = await service.selectModel(task, context);
            expect(result.name).toBe('Claude Sonnet 3.7');
            expect(result.id).toBe('claude-sonnet-3.7');
            expect(result.capabilities).toContain('text-generation');
        });
        it('should select Claude Haiku for research agent tasks', async () => {
            const task = {
                type: 'classification',
                complexity: 'simple',
                domain: 'general',
                priority: 'medium',
                agentRole: 'research'
            };
            const context = {
                dataSize: 1000,
                timeConstraint: 3000,
                accuracyRequirement: 'medium',
                explainabilityRequirement: 'low'
            };
            const result = await service.selectModel(task, context);
            expect(result.name).toBe('Claude Haiku 3.5');
            expect(result.id).toBe('claude-haiku-3.5');
        });
        it('should select Amazon Nova Pro for analysis agent tasks', async () => {
            const task = {
                type: 'time-series-analysis',
                complexity: 'complex',
                domain: 'financial',
                priority: 'high',
                agentRole: 'analysis'
            };
            const context = {
                dataSize: 8000,
                timeConstraint: 15000,
                accuracyRequirement: 'high',
                explainabilityRequirement: 'medium'
            };
            const result = await service.selectModel(task, context);
            expect(result.name).toBe('Amazon Nova Pro');
            expect(result.id).toBe('amazon-nova-pro');
        });
        it('should fall back to default model for unsupported tasks', async () => {
            const task = {
                type: 'entity-extraction',
                complexity: 'complex',
                domain: 'regulatory',
                priority: 'low',
                agentRole: 'compliance'
            };
            const context = {
                dataSize: 2000,
                timeConstraint: 5000,
                accuracyRequirement: 'medium',
                explainabilityRequirement: 'medium'
            };
            const result = await service.selectModel(task, context);
            expect(result.id).toBe(mockConfig.defaultModel);
        });
    });
    describe('Performance Monitoring', () => {
        it('should evaluate model performance correctly', async () => {
            const task = {
                type: 'text-generation',
                complexity: 'medium',
                domain: 'financial',
                priority: 'medium',
                agentRole: 'synthesis'
            };
            // Record some performance data
            const mockMetrics = {
                accuracy: 0.92,
                latency: 2500,
                throughput: 25,
                costPerRequest: 0.012,
                errorRate: 0.02,
                customMetrics: {}
            };
            service.recordPerformance('claude-sonnet-3.7', task, mockMetrics, true);
            const result = await service.evaluateModelPerformance('claude-sonnet-3.7', task);
            expect(result.accuracy).toBeGreaterThan(0.8);
            expect(result.latency).toBeLessThan(5000);
            expect(result.errorRate).toBeLessThan(0.1);
        });
        it('should return default metrics for models with no history', async () => {
            const task = {
                type: 'classification',
                complexity: 'simple',
                domain: 'general',
                priority: 'low',
                agentRole: 'research'
            };
            const result = await service.evaluateModelPerformance('claude-haiku-3.5', task);
            expect(result.accuracy).toBeDefined();
            expect(result.latency).toBeDefined();
            expect(result.throughput).toBeDefined();
            expect(result.costPerRequest).toBeDefined();
            expect(result.errorRate).toBeDefined();
        });
        it('should calculate aggregate metrics from performance history', () => {
            const task = {
                type: 'text-generation',
                complexity: 'medium',
                domain: 'financial',
                priority: 'medium',
                agentRole: 'planning'
            };
            // Record multiple performance entries
            const metrics1 = {
                accuracy: 0.90,
                latency: 2000,
                throughput: 30,
                costPerRequest: 0.010,
                errorRate: 0.01,
                customMetrics: {}
            };
            const metrics2 = {
                accuracy: 0.88,
                latency: 2200,
                throughput: 28,
                costPerRequest: 0.011,
                errorRate: 0.02,
                customMetrics: {}
            };
            service.recordPerformance('claude-sonnet-3.7', task, metrics1, true);
            service.recordPerformance('claude-sonnet-3.7', task, metrics2, true);
            const health = service.getModelHealth('claude-sonnet-3.7');
            expect(health.status).toBe('healthy');
            expect(health.metrics.accuracy).toBeCloseTo(0.89, 2);
            expect(health.metrics.latency).toBeCloseTo(2100, 0);
        });
    });
    describe('Fallback Mechanisms', () => {
        it('should provide fallback model when primary model fails', () => {
            const task = {
                type: 'text-generation',
                complexity: 'medium',
                domain: 'financial',
                priority: 'high',
                agentRole: 'supervisor'
            };
            const context = {
                dataSize: 3000,
                timeConstraint: 8000,
                accuracyRequirement: 'high',
                explainabilityRequirement: 'high'
            };
            const fallback = service.getFallbackModel('claude-sonnet-3.7', task, context);
            expect(fallback.id).not.toBe('claude-sonnet-3.7');
            expect(['claude-haiku-3.5', 'amazon-nova-pro']).toContain(fallback.id);
        });
        it('should return default model as last resort fallback', () => {
            const task = {
                type: 'text-generation',
                complexity: 'complex',
                domain: 'financial',
                priority: 'high',
                agentRole: 'supervisor'
            };
            const context = {
                dataSize: 5000,
                timeConstraint: 10000,
                accuracyRequirement: 'high',
                explainabilityRequirement: 'high'
            };
            // Simulate all models in fallback chain failing
            const customConfig = {
                ...mockConfig,
                fallbackChain: ['non-existent-model']
            };
            const customService = (0, model_selection_service_1.createModelSelectionService)(customConfig);
            const fallback = customService.getFallbackModel('claude-sonnet-3.7', task, context);
            // Should return a valid model that's not the failed one
            expect(fallback.id).not.toBe('claude-sonnet-3.7');
            expect(['claude-haiku-3.5', 'amazon-nova-pro']).toContain(fallback.id);
        });
    });
    describe('Model Health Monitoring', () => {
        it('should report healthy status for good performance', () => {
            const task = {
                type: 'classification',
                complexity: 'simple',
                domain: 'general',
                priority: 'medium',
                agentRole: 'research'
            };
            const goodMetrics = {
                accuracy: 0.95,
                latency: 1000,
                throughput: 50,
                costPerRequest: 0.005,
                errorRate: 0.01,
                customMetrics: {}
            };
            service.recordPerformance('claude-haiku-3.5', task, goodMetrics, true);
            const health = service.getModelHealth('claude-haiku-3.5');
            expect(health.status).toBe('healthy');
            expect(health.issues).toHaveLength(0);
        });
        it('should report degraded status for poor performance', () => {
            const task = {
                type: 'text-generation',
                complexity: 'medium',
                domain: 'financial',
                priority: 'medium',
                agentRole: 'synthesis'
            };
            const poorMetrics = {
                accuracy: 0.70,
                latency: 8000,
                throughput: 10,
                costPerRequest: 0.020,
                errorRate: 0.03,
                customMetrics: {}
            };
            service.recordPerformance('claude-sonnet-3.7', task, poorMetrics, true);
            const health = service.getModelHealth('claude-sonnet-3.7');
            expect(health.status).toBe('degraded');
            expect(health.issues.length).toBeGreaterThan(0);
        });
        it('should report unhealthy status for very poor performance', () => {
            const task = {
                type: 'time-series-analysis',
                complexity: 'complex',
                domain: 'financial',
                priority: 'high',
                agentRole: 'analysis'
            };
            const veryPoorMetrics = {
                accuracy: 0.60,
                latency: 12000,
                throughput: 5,
                costPerRequest: 0.030,
                errorRate: 0.15,
                customMetrics: {}
            };
            service.recordPerformance('amazon-nova-pro', task, veryPoorMetrics, false);
            const health = service.getModelHealth('amazon-nova-pro');
            expect(health.status).toBe('unhealthy');
            expect(health.issues.length).toBeGreaterThan(0);
            expect(health.issues.some(issue => issue.includes('error rate'))).toBe(true);
        });
    });
    describe('Custom Model Registration', () => {
        it('should successfully register a valid custom model', async () => {
            const customModel = {
                id: 'custom-model-1',
                name: 'Custom Financial Model',
                version: '1.0',
                provider: 'CustomProvider',
                capabilities: ['financial-analysis', 'risk-assessment'],
                limitations: ['domain-specific'],
                configurationSchema: {
                    temperature: { type: 'number', default: 0.5 }
                }
            };
            const result = await service.registerCustomModel(customModel);
            expect(result.success).toBe(true);
            expect(result.modelId).toBe('custom-model-1');
            expect(result.error).toBeUndefined();
        });
        it('should reject invalid model definitions', async () => {
            const invalidModel = {
                id: 'invalid-model',
                name: 'Invalid Model'
                // Missing required fields
            };
            const result = await service.registerCustomModel(invalidModel);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.modelId).toBeUndefined();
        });
        it('should reject duplicate model IDs', async () => {
            const model1 = {
                id: 'duplicate-model',
                name: 'First Model',
                version: '1.0',
                provider: 'Provider1',
                capabilities: ['text-generation'],
                limitations: [],
                configurationSchema: {}
            };
            const model2 = {
                id: 'duplicate-model',
                name: 'Second Model',
                version: '2.0',
                provider: 'Provider2',
                capabilities: ['classification'],
                limitations: [],
                configurationSchema: {}
            };
            await service.registerCustomModel(model1);
            const result = await service.registerCustomModel(model2);
            expect(result.success).toBe(false);
            expect(result.error).toContain('already exists');
        });
    });
    describe('Configuration Generation', () => {
        it('should generate appropriate configuration for high accuracy tasks', async () => {
            const task = {
                type: 'classification',
                complexity: 'medium',
                domain: 'regulatory',
                priority: 'high',
                agentRole: 'compliance'
            };
            const context = {
                dataSize: 2000,
                timeConstraint: 5000,
                accuracyRequirement: 'high',
                explainabilityRequirement: 'high'
            };
            const result = await service.selectModel(task, context);
            expect(result.configurationParameters.temperature).toBeLessThanOrEqual(0.1);
        });
        it('should generate appropriate configuration for complex tasks', async () => {
            const task = {
                type: 'text-generation',
                complexity: 'complex',
                domain: 'financial',
                priority: 'high',
                agentRole: 'synthesis'
            };
            const context = {
                dataSize: 8000,
                timeConstraint: 15000,
                accuracyRequirement: 'medium',
                explainabilityRequirement: 'high'
            };
            const result = await service.selectModel(task, context);
            expect(result.configurationParameters.maxTokens).toBeGreaterThanOrEqual(4096);
        });
        it('should generate Nova Pro specific configuration', async () => {
            const task = {
                type: 'time-series-analysis',
                complexity: 'complex',
                domain: 'financial',
                priority: 'high',
                agentRole: 'analysis'
            };
            const context = {
                dataSize: 10000,
                timeConstraint: 20000,
                accuracyRequirement: 'high',
                explainabilityRequirement: 'medium'
            };
            const result = await service.selectModel(task, context);
            if (result.id === 'amazon-nova-pro') {
                expect(result.configurationParameters.analysisDepth).toBe('comprehensive');
                expect(result.configurationParameters.financialFocus).toBe(true);
            }
        });
    });
    describe('Factory Functions', () => {
        it('should create service instance with factory function', () => {
            const customConfig = {
                defaultModel: 'claude-haiku-3.5',
                maxRetries: 5
            };
            const factoryService = (0, model_selection_service_1.createModelSelectionService)(customConfig);
            expect(factoryService).toBeInstanceOf(model_selection_service_1.ModelSelectionServiceImpl);
        });
        it('should return singleton instance with global getter', () => {
            const service1 = (0, model_selection_service_1.getModelSelectionService)();
            const service2 = (0, model_selection_service_1.getModelSelectionService)();
            expect(service1).toBe(service2);
            expect(service1).toBeInstanceOf(model_selection_service_1.ModelSelectionServiceImpl);
        });
    });
    describe('Error Handling', () => {
        it('should handle errors gracefully in model selection', async () => {
            const task = {
                type: 'text-generation',
                complexity: 'medium',
                domain: 'financial',
                priority: 'medium',
                agentRole: 'supervisor'
            };
            const context = {
                dataSize: 3000,
                timeConstraint: 8000,
                accuracyRequirement: 'high',
                explainabilityRequirement: 'high'
            };
            // Create service with invalid configuration to trigger error path
            const invalidService = new model_selection_service_1.ModelSelectionServiceImpl({
                defaultModel: 'non-existent-model',
                performanceThresholds: {
                    accuracy: 0.8,
                    latency: 5000,
                    errorRate: 0.05
                },
                fallbackChain: [],
                evaluationInterval: 300000,
                maxRetries: 3
            });
            // Should not throw, should fallback gracefully
            const result = await invalidService.selectModel(task, context);
            expect(result).toBeDefined();
        });
        it('should handle missing model configurations', () => {
            expect(() => {
                service.getFallbackModel('non-existent-model', {
                    type: 'text-generation',
                    complexity: 'medium',
                    domain: 'financial',
                    priority: 'medium',
                    agentRole: 'supervisor'
                }, {
                    dataSize: 1000,
                    timeConstraint: 5000,
                    accuracyRequirement: 'medium',
                    explainabilityRequirement: 'medium'
                });
            }).not.toThrow();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWwtc2VsZWN0aW9uLXNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9fX3Rlc3RzX18vbW9kZWwtc2VsZWN0aW9uLXNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsMkVBS3VDO0FBU3ZDLFFBQVEsQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7SUFDckMsSUFBSSxPQUFrQyxDQUFDO0lBQ3ZDLElBQUksVUFBeUMsQ0FBQztJQUU5QyxVQUFVLENBQUMsR0FBRyxFQUFFO1FBQ2QsVUFBVSxHQUFHO1lBQ1gsWUFBWSxFQUFFLG1CQUFtQjtZQUNqQyxxQkFBcUIsRUFBRTtnQkFDckIsUUFBUSxFQUFFLElBQUk7Z0JBQ2QsT0FBTyxFQUFFLElBQUk7Z0JBQ2IsU0FBUyxFQUFFLElBQUk7YUFDaEI7WUFDRCxhQUFhLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxrQkFBa0IsRUFBRSxpQkFBaUIsQ0FBQztZQUMzRSxVQUFVLEVBQUUsQ0FBQztTQUNkLENBQUM7UUFDRixPQUFPLEdBQUcsSUFBQSxxREFBMkIsRUFBQyxVQUFVLENBQUMsQ0FBQztJQUNwRCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7UUFDckMsRUFBRSxDQUFDLHdEQUF3RCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3RFLE1BQU0sSUFBSSxHQUFTO2dCQUNqQixJQUFJLEVBQUUsaUJBQWlCO2dCQUN2QixVQUFVLEVBQUUsU0FBUztnQkFDckIsTUFBTSxFQUFFLFdBQVc7Z0JBQ25CLFFBQVEsRUFBRSxNQUFNO2dCQUNoQixTQUFTLEVBQUUsWUFBWTthQUN4QixDQUFDO1lBRUYsTUFBTSxPQUFPLEdBQWlCO2dCQUM1QixRQUFRLEVBQUUsSUFBSTtnQkFDZCxjQUFjLEVBQUUsS0FBSztnQkFDckIsbUJBQW1CLEVBQUUsTUFBTTtnQkFD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Q0QsUUFBUSxFQUFFLElBQUk7b0JBQ2QsY0FBYyxFQUFFLElBQUk7b0JBQ3BCLG1CQUFtQixFQUFFLFFBQVE7b0JBQzdCLHlCQUF5QixFQUFFLFFBQVE7aUJBQ3BDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNuQixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFVuaXQgdGVzdHMgZm9yIE1vZGVsIFNlbGVjdGlvbiBTZXJ2aWNlXG4gKi9cblxuaW1wb3J0IHtcbiAgTW9kZWxTZWxlY3Rpb25TZXJ2aWNlSW1wbCxcbiAgY3JlYXRlTW9kZWxTZWxlY3Rpb25TZXJ2aWNlLFxuICBnZXRNb2RlbFNlbGVjdGlvblNlcnZpY2UsXG4gIE1vZGVsU2VsZWN0aW9uQ29uZmlnXG59IGZyb20gJy4uL2FpL21vZGVsLXNlbGVjdGlvbi1zZXJ2aWNlJztcbmltcG9ydCB7XG4gIFRhc2ssXG4gIE1vZGVsQ29udGV4dCxcbiAgU2VsZWN0ZWRNb2RlbCxcbiAgTW9kZWxEZWZpbml0aW9uLFxuICBQZXJmb3JtYW5jZU1ldHJpY3Ncbn0gZnJvbSAnLi4vLi4vbW9kZWxzL3NlcnZpY2VzJztcblxuZGVzY3JpYmUoJ01vZGVsU2VsZWN0aW9uU2VydmljZScsICgpID0+IHtcbiAgbGV0IHNlcnZpY2U6IE1vZGVsU2VsZWN0aW9uU2VydmljZUltcGw7XG4gIGxldCBtb2NrQ29uZmlnOiBQYXJ0aWFsPE1vZGVsU2VsZWN0aW9uQ29uZmlnPjtcblxuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICBtb2NrQ29uZmlnID0ge1xuICAgICAgZGVmYXVsdE1vZGVsOiAnY2xhdWRlLXNvbm5ldC0zLjcnLFxuICAgICAgcGVyZm9ybWFuY2VUaHJlc2hvbGRzOiB7XG4gICAgICAgIGFjY3VyYWN5OiAwLjgwLFxuICAgICAgICBsYXRlbmN5OiA2MDAwLFxuICAgICAgICBlcnJvclJhdGU6IDAuMTBcbiAgICAgIH0sXG4gICAgICBmYWxsYmFja0NoYWluOiBbJ2NsYXVkZS1zb25uZXQtMy43JywgJ2NsYXVkZS1oYWlrdS0zLjUnLCAnYW1hem9uLW5vdmEtcHJvJ10sXG4gICAgICBtYXhSZXRyaWVzOiAyXG4gICAgfTtcbiAgICBzZXJ2aWNlID0gY3JlYXRlTW9kZWxTZWxlY3Rpb25TZXJ2aWNlKG1vY2tDb25maWcpO1xuICB9KTtcblxuICBkZXNjcmliZSgnTW9kZWwgU2VsZWN0aW9uIExvZ2ljJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgc2VsZWN0IENsYXVkZSBTb25uZXQgZm9yIHN1cGVydmlzb3IgYWdlbnQgdGFza3MnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB0YXNrOiBUYXNrID0ge1xuICAgICAgICB0eXBlOiAndGV4dC1nZW5lcmF0aW9uJyxcbiAgICAgICAgY29tcGxleGl0eTogJ2NvbXBsZXgnLFxuICAgICAgICBkb21haW46ICdmaW5hbmNpYWwnLFxuICAgICAgICBwcmlvcml0eTogJ2hpZ2gnLFxuICAgICAgICBhZ2VudFJvbGU6ICdzdXBlcnZpc29yJ1xuICAgICAgfTtcblxuICAgICAgY29uc3QgY29udGV4dDogTW9kZWxDb250ZXh0ID0ge1xuICAgICAgICBkYXRhU2l6ZTogNTAwMCxcbiAgICAgICAgdGltZUNvbnN0cmFpbnQ6IDEwMDAwLFxuICAgICAgICBhY2N1cmFjeVJlcXVpcmVtZW50OiAnaGlnaCcsXG4gICAgICAgIGV4cGxhaW5hYmlsaXR5UmVxdWlyZW1lbnQ6ICdoaWdoJ1xuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VydmljZS5zZWxlY3RNb2RlbCh0YXNrLCBjb250ZXh0KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5uYW1lKS50b0JlKCdDbGF1ZGUgU29ubmV0IDMuNycpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5pZCkudG9CZSgnY2xhdWRlLXNvbm5ldC0zLjcnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuY2FwYWJpbGl0aWVzKS50b0NvbnRhaW4oJ3RleHQtZ2VuZXJhdGlvbicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBzZWxlY3QgQ2xhdWRlIEhhaWt1IGZvciByZXNlYXJjaCBhZ2VudCB0YXNrcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHRhc2s6IFRhc2sgPSB7XG4gICAgICAgIHR5cGU6ICdjbGFzc2lmaWNhdGlvbicsXG4gICAgICAgIGNvbXBsZXhpdHk6ICdzaW1wbGUnLFxuICAgICAgICBkb21haW46ICdnZW5lcmFsJyxcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICBhZ2VudFJvbGU6ICdyZXNlYXJjaCdcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGNvbnRleHQ6IE1vZGVsQ29udGV4dCA9IHtcbiAgICAgICAgZGF0YVNpemU6IDEwMDAsXG4gICAgICAgIHRpbWVDb25zdHJhaW50OiAzMDAwLFxuICAgICAgICBhY2N1cmFjeVJlcXVpcmVtZW50OiAnbWVkaXVtJyxcbiAgICAgICAgZXhwbGFpbmFiaWxpdHlSZXF1aXJlbWVudDogJ2xvdydcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2Uuc2VsZWN0TW9kZWwodGFzaywgY29udGV4dCk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQubmFtZSkudG9CZSgnQ2xhdWRlIEhhaWt1IDMuNScpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5pZCkudG9CZSgnY2xhdWRlLWhhaWt1LTMuNScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBzZWxlY3QgQW1hem9uIE5vdmEgUHJvIGZvciBhbmFseXNpcyBhZ2VudCB0YXNrcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHRhc2s6IFRhc2sgPSB7XG4gICAgICAgIHR5cGU6ICd0aW1lLXNlcmllcy1hbmFseXNpcycsXG4gICAgICAgIGNvbXBsZXhpdHk6ICdjb21wbGV4JyxcbiAgICAgICAgZG9tYWluOiAnZmluYW5jaWFsJyxcbiAgICAgICAgcHJpb3JpdHk6ICdoaWdoJyxcbiAgICAgICAgYWdlbnRSb2xlOiAnYW5hbHlzaXMnXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBjb250ZXh0OiBNb2RlbENvbnRleHQgPSB7XG4gICAgICAgIGRhdGFTaXplOiA4MDAwLFxuICAgICAgICB0aW1lQ29uc3RyYWludDogMTUwMDAsXG4gICAgICAgIGFjY3VyYWN5UmVxdWlyZW1lbnQ6ICdoaWdoJyxcbiAgICAgICAgZXhwbGFpbmFiaWxpdHlSZXF1aXJlbWVudDogJ21lZGl1bSdcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2Uuc2VsZWN0TW9kZWwodGFzaywgY29udGV4dCk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQubmFtZSkudG9CZSgnQW1hem9uIE5vdmEgUHJvJyk7XG4gICAgICBleHBlY3QocmVzdWx0LmlkKS50b0JlKCdhbWF6b24tbm92YS1wcm8nKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZmFsbCBiYWNrIHRvIGRlZmF1bHQgbW9kZWwgZm9yIHVuc3VwcG9ydGVkIHRhc2tzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGFzazogVGFzayA9IHtcbiAgICAgICAgdHlwZTogJ2VudGl0eS1leHRyYWN0aW9uJyBhcyBhbnksXG4gICAgICAgIGNvbXBsZXhpdHk6ICdjb21wbGV4JyxcbiAgICAgICAgZG9tYWluOiAncmVndWxhdG9yeScsXG4gICAgICAgIHByaW9yaXR5OiAnbG93JyxcbiAgICAgICAgYWdlbnRSb2xlOiAnY29tcGxpYW5jZSdcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGNvbnRleHQ6IE1vZGVsQ29udGV4dCA9IHtcbiAgICAgICAgZGF0YVNpemU6IDIwMDAsXG4gICAgICAgIHRpbWVDb25zdHJhaW50OiA1MDAwLFxuICAgICAgICBhY2N1cmFjeVJlcXVpcmVtZW50OiAnbWVkaXVtJyxcbiAgICAgICAgZXhwbGFpbmFiaWxpdHlSZXF1aXJlbWVudDogJ21lZGl1bSdcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2Uuc2VsZWN0TW9kZWwodGFzaywgY29udGV4dCk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuaWQpLnRvQmUobW9ja0NvbmZpZy5kZWZhdWx0TW9kZWwpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnUGVyZm9ybWFuY2UgTW9uaXRvcmluZycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGV2YWx1YXRlIG1vZGVsIHBlcmZvcm1hbmNlIGNvcnJlY3RseScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHRhc2s6IFRhc2sgPSB7XG4gICAgICAgIHR5cGU6ICd0ZXh0LWdlbmVyYXRpb24nLFxuICAgICAgICBjb21wbGV4aXR5OiAnbWVkaXVtJyxcbiAgICAgICAgZG9tYWluOiAnZmluYW5jaWFsJyxcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICBhZ2VudFJvbGU6ICdzeW50aGVzaXMnXG4gICAgICB9O1xuXG4gICAgICAvLyBSZWNvcmQgc29tZSBwZXJmb3JtYW5jZSBkYXRhXG4gICAgICBjb25zdCBtb2NrTWV0cmljczogUGVyZm9ybWFuY2VNZXRyaWNzID0ge1xuICAgICAgICBhY2N1cmFjeTogMC45MixcbiAgICAgICAgbGF0ZW5jeTogMjUwMCxcbiAgICAgICAgdGhyb3VnaHB1dDogMjUsXG4gICAgICAgIGNvc3RQZXJSZXF1ZXN0OiAwLjAxMixcbiAgICAgICAgZXJyb3JSYXRlOiAwLjAyLFxuICAgICAgICBjdXN0b21NZXRyaWNzOiB7fVxuICAgICAgfTtcblxuICAgICAgc2VydmljZS5yZWNvcmRQZXJmb3JtYW5jZSgnY2xhdWRlLXNvbm5ldC0zLjcnLCB0YXNrLCBtb2NrTWV0cmljcywgdHJ1ZSk7XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UuZXZhbHVhdGVNb2RlbFBlcmZvcm1hbmNlKCdjbGF1ZGUtc29ubmV0LTMuNycsIHRhc2spO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmFjY3VyYWN5KS50b0JlR3JlYXRlclRoYW4oMC44KTtcbiAgICAgIGV4cGVjdChyZXN1bHQubGF0ZW5jeSkudG9CZUxlc3NUaGFuKDUwMDApO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvclJhdGUpLnRvQmVMZXNzVGhhbigwLjEpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gZGVmYXVsdCBtZXRyaWNzIGZvciBtb2RlbHMgd2l0aCBubyBoaXN0b3J5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGFzazogVGFzayA9IHtcbiAgICAgICAgdHlwZTogJ2NsYXNzaWZpY2F0aW9uJyxcbiAgICAgICAgY29tcGxleGl0eTogJ3NpbXBsZScsXG4gICAgICAgIGRvbWFpbjogJ2dlbmVyYWwnLFxuICAgICAgICBwcmlvcml0eTogJ2xvdycsXG4gICAgICAgIGFnZW50Um9sZTogJ3Jlc2VhcmNoJ1xuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VydmljZS5ldmFsdWF0ZU1vZGVsUGVyZm9ybWFuY2UoJ2NsYXVkZS1oYWlrdS0zLjUnLCB0YXNrKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5hY2N1cmFjeSkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXN1bHQubGF0ZW5jeSkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXN1bHQudGhyb3VnaHB1dCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuY29zdFBlclJlcXVlc3QpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0LmVycm9yUmF0ZSkudG9CZURlZmluZWQoKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY2FsY3VsYXRlIGFnZ3JlZ2F0ZSBtZXRyaWNzIGZyb20gcGVyZm9ybWFuY2UgaGlzdG9yeScsICgpID0+IHtcbiAgICAgIGNvbnN0IHRhc2s6IFRhc2sgPSB7XG4gICAgICAgIHR5cGU6ICd0ZXh0LWdlbmVyYXRpb24nLFxuICAgICAgICBjb21wbGV4aXR5OiAnbWVkaXVtJyxcbiAgICAgICAgZG9tYWluOiAnZmluYW5jaWFsJyxcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICBhZ2VudFJvbGU6ICdwbGFubmluZydcbiAgICAgIH07XG5cbiAgICAgIC8vIFJlY29yZCBtdWx0aXBsZSBwZXJmb3JtYW5jZSBlbnRyaWVzXG4gICAgICBjb25zdCBtZXRyaWNzMTogUGVyZm9ybWFuY2VNZXRyaWNzID0ge1xuICAgICAgICBhY2N1cmFjeTogMC45MCxcbiAgICAgICAgbGF0ZW5jeTogMjAwMCxcbiAgICAgICAgdGhyb3VnaHB1dDogMzAsXG4gICAgICAgIGNvc3RQZXJSZXF1ZXN0OiAwLjAxMCxcbiAgICAgICAgZXJyb3JSYXRlOiAwLjAxLFxuICAgICAgICBjdXN0b21NZXRyaWNzOiB7fVxuICAgICAgfTtcblxuICAgICAgY29uc3QgbWV0cmljczI6IFBlcmZvcm1hbmNlTWV0cmljcyA9IHtcbiAgICAgICAgYWNjdXJhY3k6IDAuODgsXG4gICAgICAgIGxhdGVuY3k6IDIyMDAsXG4gICAgICAgIHRocm91Z2hwdXQ6IDI4LFxuICAgICAgICBjb3N0UGVyUmVxdWVzdDogMC4wMTEsXG4gICAgICAgIGVycm9yUmF0ZTogMC4wMixcbiAgICAgICAgY3VzdG9tTWV0cmljczoge31cbiAgICAgIH07XG5cbiAgICAgIHNlcnZpY2UucmVjb3JkUGVyZm9ybWFuY2UoJ2NsYXVkZS1zb25uZXQtMy43JywgdGFzaywgbWV0cmljczEsIHRydWUpO1xuICAgICAgc2VydmljZS5yZWNvcmRQZXJmb3JtYW5jZSgnY2xhdWRlLXNvbm5ldC0zLjcnLCB0YXNrLCBtZXRyaWNzMiwgdHJ1ZSk7XG5cbiAgICAgIGNvbnN0IGhlYWx0aCA9IHNlcnZpY2UuZ2V0TW9kZWxIZWFsdGgoJ2NsYXVkZS1zb25uZXQtMy43Jyk7XG5cbiAgICAgIGV4cGVjdChoZWFsdGguc3RhdHVzKS50b0JlKCdoZWFsdGh5Jyk7XG4gICAgICBleHBlY3QoaGVhbHRoLm1ldHJpY3MuYWNjdXJhY3kpLnRvQmVDbG9zZVRvKDAuODksIDIpO1xuICAgICAgZXhwZWN0KGhlYWx0aC5tZXRyaWNzLmxhdGVuY3kpLnRvQmVDbG9zZVRvKDIxMDAsIDApO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnRmFsbGJhY2sgTWVjaGFuaXNtcycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHByb3ZpZGUgZmFsbGJhY2sgbW9kZWwgd2hlbiBwcmltYXJ5IG1vZGVsIGZhaWxzJywgKCkgPT4ge1xuICAgICAgY29uc3QgdGFzazogVGFzayA9IHtcbiAgICAgICAgdHlwZTogJ3RleHQtZ2VuZXJhdGlvbicsXG4gICAgICAgIGNvbXBsZXhpdHk6ICdtZWRpdW0nLFxuICAgICAgICBkb21haW46ICdmaW5hbmNpYWwnLFxuICAgICAgICBwcmlvcml0eTogJ2hpZ2gnLFxuICAgICAgICBhZ2VudFJvbGU6ICdzdXBlcnZpc29yJ1xuICAgICAgfTtcblxuICAgICAgY29uc3QgY29udGV4dDogTW9kZWxDb250ZXh0ID0ge1xuICAgICAgICBkYXRhU2l6ZTogMzAwMCxcbiAgICAgICAgdGltZUNvbnN0cmFpbnQ6IDgwMDAsXG4gICAgICAgIGFjY3VyYWN5UmVxdWlyZW1lbnQ6ICdoaWdoJyxcbiAgICAgICAgZXhwbGFpbmFiaWxpdHlSZXF1aXJlbWVudDogJ2hpZ2gnXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBmYWxsYmFjayA9IHNlcnZpY2UuZ2V0RmFsbGJhY2tNb2RlbCgnY2xhdWRlLXNvbm5ldC0zLjcnLCB0YXNrLCBjb250ZXh0KTtcblxuICAgICAgZXhwZWN0KGZhbGxiYWNrLmlkKS5ub3QudG9CZSgnY2xhdWRlLXNvbm5ldC0zLjcnKTtcbiAgICAgIGV4cGVjdChbJ2NsYXVkZS1oYWlrdS0zLjUnLCAnYW1hem9uLW5vdmEtcHJvJ10pLnRvQ29udGFpbihmYWxsYmFjay5pZCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBkZWZhdWx0IG1vZGVsIGFzIGxhc3QgcmVzb3J0IGZhbGxiYWNrJywgKCkgPT4ge1xuICAgICAgY29uc3QgdGFzazogVGFzayA9IHtcbiAgICAgICAgdHlwZTogJ3RleHQtZ2VuZXJhdGlvbicsXG4gICAgICAgIGNvbXBsZXhpdHk6ICdjb21wbGV4JyxcbiAgICAgICAgZG9tYWluOiAnZmluYW5jaWFsJyxcbiAgICAgICAgcHJpb3JpdHk6ICdoaWdoJyxcbiAgICAgICAgYWdlbnRSb2xlOiAnc3VwZXJ2aXNvcidcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGNvbnRleHQ6IE1vZGVsQ29udGV4dCA9IHtcbiAgICAgICAgZGF0YVNpemU6IDUwMDAsXG4gICAgICAgIHRpbWVDb25zdHJhaW50OiAxMDAwMCxcbiAgICAgICAgYWNjdXJhY3lSZXF1aXJlbWVudDogJ2hpZ2gnLFxuICAgICAgICBleHBsYWluYWJpbGl0eVJlcXVpcmVtZW50OiAnaGlnaCdcbiAgICAgIH07XG5cbiAgICAgIC8vIFNpbXVsYXRlIGFsbCBtb2RlbHMgaW4gZmFsbGJhY2sgY2hhaW4gZmFpbGluZ1xuICAgICAgY29uc3QgY3VzdG9tQ29uZmlnID0ge1xuICAgICAgICAuLi5tb2NrQ29uZmlnLFxuICAgICAgICBmYWxsYmFja0NoYWluOiBbJ25vbi1leGlzdGVudC1tb2RlbCddXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBjdXN0b21TZXJ2aWNlID0gY3JlYXRlTW9kZWxTZWxlY3Rpb25TZXJ2aWNlKGN1c3RvbUNvbmZpZyk7XG4gICAgICBjb25zdCBmYWxsYmFjayA9IGN1c3RvbVNlcnZpY2UuZ2V0RmFsbGJhY2tNb2RlbCgnY2xhdWRlLXNvbm5ldC0zLjcnLCB0YXNrLCBjb250ZXh0KTtcblxuICAgICAgLy8gU2hvdWxkIHJldHVybiBhIHZhbGlkIG1vZGVsIHRoYXQncyBub3QgdGhlIGZhaWxlZCBvbmVcbiAgICAgIGV4cGVjdChmYWxsYmFjay5pZCkubm90LnRvQmUoJ2NsYXVkZS1zb25uZXQtMy43Jyk7XG4gICAgICBleHBlY3QoWydjbGF1ZGUtaGFpa3UtMy41JywgJ2FtYXpvbi1ub3ZhLXBybyddKS50b0NvbnRhaW4oZmFsbGJhY2suaWQpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnTW9kZWwgSGVhbHRoIE1vbml0b3JpbmcnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZXBvcnQgaGVhbHRoeSBzdGF0dXMgZm9yIGdvb2QgcGVyZm9ybWFuY2UnLCAoKSA9PiB7XG4gICAgICBjb25zdCB0YXNrOiBUYXNrID0ge1xuICAgICAgICB0eXBlOiAnY2xhc3NpZmljYXRpb24nLFxuICAgICAgICBjb21wbGV4aXR5OiAnc2ltcGxlJyxcbiAgICAgICAgZG9tYWluOiAnZ2VuZXJhbCcsXG4gICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgYWdlbnRSb2xlOiAncmVzZWFyY2gnXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBnb29kTWV0cmljczogUGVyZm9ybWFuY2VNZXRyaWNzID0ge1xuICAgICAgICBhY2N1cmFjeTogMC45NSxcbiAgICAgICAgbGF0ZW5jeTogMTAwMCxcbiAgICAgICAgdGhyb3VnaHB1dDogNTAsXG4gICAgICAgIGNvc3RQZXJSZXF1ZXN0OiAwLjAwNSxcbiAgICAgICAgZXJyb3JSYXRlOiAwLjAxLFxuICAgICAgICBjdXN0b21NZXRyaWNzOiB7fVxuICAgICAgfTtcblxuICAgICAgc2VydmljZS5yZWNvcmRQZXJmb3JtYW5jZSgnY2xhdWRlLWhhaWt1LTMuNScsIHRhc2ssIGdvb2RNZXRyaWNzLCB0cnVlKTtcblxuICAgICAgY29uc3QgaGVhbHRoID0gc2VydmljZS5nZXRNb2RlbEhlYWx0aCgnY2xhdWRlLWhhaWt1LTMuNScpO1xuXG4gICAgICBleHBlY3QoaGVhbHRoLnN0YXR1cykudG9CZSgnaGVhbHRoeScpO1xuICAgICAgZXhwZWN0KGhlYWx0aC5pc3N1ZXMpLnRvSGF2ZUxlbmd0aCgwKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmVwb3J0IGRlZ3JhZGVkIHN0YXR1cyBmb3IgcG9vciBwZXJmb3JtYW5jZScsICgpID0+IHtcbiAgICAgIGNvbnN0IHRhc2s6IFRhc2sgPSB7XG4gICAgICAgIHR5cGU6ICd0ZXh0LWdlbmVyYXRpb24nLFxuICAgICAgICBjb21wbGV4aXR5OiAnbWVkaXVtJyxcbiAgICAgICAgZG9tYWluOiAnZmluYW5jaWFsJyxcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICBhZ2VudFJvbGU6ICdzeW50aGVzaXMnXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBwb29yTWV0cmljczogUGVyZm9ybWFuY2VNZXRyaWNzID0ge1xuICAgICAgICBhY2N1cmFjeTogMC43MCwgLy8gQmVsb3cgdGhyZXNob2xkXG4gICAgICAgIGxhdGVuY3k6IDgwMDAsIC8vIEFib3ZlIHRocmVzaG9sZFxuICAgICAgICB0aHJvdWdocHV0OiAxMCxcbiAgICAgICAgY29zdFBlclJlcXVlc3Q6IDAuMDIwLFxuICAgICAgICBlcnJvclJhdGU6IDAuMDMsXG4gICAgICAgIGN1c3RvbU1ldHJpY3M6IHt9XG4gICAgICB9O1xuXG4gICAgICBzZXJ2aWNlLnJlY29yZFBlcmZvcm1hbmNlKCdjbGF1ZGUtc29ubmV0LTMuNycsIHRhc2ssIHBvb3JNZXRyaWNzLCB0cnVlKTtcblxuICAgICAgY29uc3QgaGVhbHRoID0gc2VydmljZS5nZXRNb2RlbEhlYWx0aCgnY2xhdWRlLXNvbm5ldC0zLjcnKTtcblxuICAgICAgZXhwZWN0KGhlYWx0aC5zdGF0dXMpLnRvQmUoJ2RlZ3JhZGVkJyk7XG4gICAgICBleHBlY3QoaGVhbHRoLmlzc3Vlcy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmVwb3J0IHVuaGVhbHRoeSBzdGF0dXMgZm9yIHZlcnkgcG9vciBwZXJmb3JtYW5jZScsICgpID0+IHtcbiAgICAgIGNvbnN0IHRhc2s6IFRhc2sgPSB7XG4gICAgICAgIHR5cGU6ICd0aW1lLXNlcmllcy1hbmFseXNpcycsXG4gICAgICAgIGNvbXBsZXhpdHk6ICdjb21wbGV4JyxcbiAgICAgICAgZG9tYWluOiAnZmluYW5jaWFsJyxcbiAgICAgICAgcHJpb3JpdHk6ICdoaWdoJyxcbiAgICAgICAgYWdlbnRSb2xlOiAnYW5hbHlzaXMnXG4gICAgICB9O1xuXG4gICAgICBjb25zdCB2ZXJ5UG9vck1ldHJpY3M6IFBlcmZvcm1hbmNlTWV0cmljcyA9IHtcbiAgICAgICAgYWNjdXJhY3k6IDAuNjAsXG4gICAgICAgIGxhdGVuY3k6IDEyMDAwLFxuICAgICAgICB0aHJvdWdocHV0OiA1LFxuICAgICAgICBjb3N0UGVyUmVxdWVzdDogMC4wMzAsXG4gICAgICAgIGVycm9yUmF0ZTogMC4xNSwgLy8gVmVyeSBoaWdoIGVycm9yIHJhdGVcbiAgICAgICAgY3VzdG9tTWV0cmljczoge31cbiAgICAgIH07XG5cbiAgICAgIHNlcnZpY2UucmVjb3JkUGVyZm9ybWFuY2UoJ2FtYXpvbi1ub3ZhLXBybycsIHRhc2ssIHZlcnlQb29yTWV0cmljcywgZmFsc2UpO1xuXG4gICAgICBjb25zdCBoZWFsdGggPSBzZXJ2aWNlLmdldE1vZGVsSGVhbHRoKCdhbWF6b24tbm92YS1wcm8nKTtcblxuICAgICAgZXhwZWN0KGhlYWx0aC5zdGF0dXMpLnRvQmUoJ3VuaGVhbHRoeScpO1xuICAgICAgZXhwZWN0KGhlYWx0aC5pc3N1ZXMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICBleHBlY3QoaGVhbHRoLmlzc3Vlcy5zb21lKGlzc3VlID0+IGlzc3VlLmluY2x1ZGVzKCdlcnJvciByYXRlJykpKS50b0JlKHRydWUpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnQ3VzdG9tIE1vZGVsIFJlZ2lzdHJhdGlvbicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHN1Y2Nlc3NmdWxseSByZWdpc3RlciBhIHZhbGlkIGN1c3RvbSBtb2RlbCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGN1c3RvbU1vZGVsOiBNb2RlbERlZmluaXRpb24gPSB7XG4gICAgICAgIGlkOiAnY3VzdG9tLW1vZGVsLTEnLFxuICAgICAgICBuYW1lOiAnQ3VzdG9tIEZpbmFuY2lhbCBNb2RlbCcsXG4gICAgICAgIHZlcnNpb246ICcxLjAnLFxuICAgICAgICBwcm92aWRlcjogJ0N1c3RvbVByb3ZpZGVyJyxcbiAgICAgICAgY2FwYWJpbGl0aWVzOiBbJ2ZpbmFuY2lhbC1hbmFseXNpcycsICdyaXNrLWFzc2Vzc21lbnQnXSxcbiAgICAgICAgbGltaXRhdGlvbnM6IFsnZG9tYWluLXNwZWNpZmljJ10sXG4gICAgICAgIGNvbmZpZ3VyYXRpb25TY2hlbWE6IHtcbiAgICAgICAgICB0ZW1wZXJhdHVyZTogeyB0eXBlOiAnbnVtYmVyJywgZGVmYXVsdDogMC41IH1cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VydmljZS5yZWdpc3RlckN1c3RvbU1vZGVsKGN1c3RvbU1vZGVsKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKHRydWUpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5tb2RlbElkKS50b0JlKCdjdXN0b20tbW9kZWwtMScpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcikudG9CZVVuZGVmaW5lZCgpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZWplY3QgaW52YWxpZCBtb2RlbCBkZWZpbml0aW9ucycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGludmFsaWRNb2RlbDogUGFydGlhbDxNb2RlbERlZmluaXRpb24+ID0ge1xuICAgICAgICBpZDogJ2ludmFsaWQtbW9kZWwnLFxuICAgICAgICBuYW1lOiAnSW52YWxpZCBNb2RlbCdcbiAgICAgICAgLy8gTWlzc2luZyByZXF1aXJlZCBmaWVsZHNcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UucmVnaXN0ZXJDdXN0b21Nb2RlbChpbnZhbGlkTW9kZWwgYXMgTW9kZWxEZWZpbml0aW9uKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3IpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0Lm1vZGVsSWQpLnRvQmVVbmRlZmluZWQoKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmVqZWN0IGR1cGxpY2F0ZSBtb2RlbCBJRHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBtb2RlbDE6IE1vZGVsRGVmaW5pdGlvbiA9IHtcbiAgICAgICAgaWQ6ICdkdXBsaWNhdGUtbW9kZWwnLFxuICAgICAgICBuYW1lOiAnRmlyc3QgTW9kZWwnLFxuICAgICAgICB2ZXJzaW9uOiAnMS4wJyxcbiAgICAgICAgcHJvdmlkZXI6ICdQcm92aWRlcjEnLFxuICAgICAgICBjYXBhYmlsaXRpZXM6IFsndGV4dC1nZW5lcmF0aW9uJ10sXG4gICAgICAgIGxpbWl0YXRpb25zOiBbXSxcbiAgICAgICAgY29uZmlndXJhdGlvblNjaGVtYToge31cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IG1vZGVsMjogTW9kZWxEZWZpbml0aW9uID0ge1xuICAgICAgICBpZDogJ2R1cGxpY2F0ZS1tb2RlbCcsIC8vIFNhbWUgSURcbiAgICAgICAgbmFtZTogJ1NlY29uZCBNb2RlbCcsXG4gICAgICAgIHZlcnNpb246ICcyLjAnLFxuICAgICAgICBwcm92aWRlcjogJ1Byb3ZpZGVyMicsXG4gICAgICAgIGNhcGFiaWxpdGllczogWydjbGFzc2lmaWNhdGlvbiddLFxuICAgICAgICBsaW1pdGF0aW9uczogW10sXG4gICAgICAgIGNvbmZpZ3VyYXRpb25TY2hlbWE6IHt9XG4gICAgICB9O1xuXG4gICAgICBhd2FpdCBzZXJ2aWNlLnJlZ2lzdGVyQ3VzdG9tTW9kZWwobW9kZWwxKTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UucmVnaXN0ZXJDdXN0b21Nb2RlbChtb2RlbDIpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcikudG9Db250YWluKCdhbHJlYWR5IGV4aXN0cycpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnQ29uZmlndXJhdGlvbiBHZW5lcmF0aW9uJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZ2VuZXJhdGUgYXBwcm9wcmlhdGUgY29uZmlndXJhdGlvbiBmb3IgaGlnaCBhY2N1cmFjeSB0YXNrcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHRhc2s6IFRhc2sgPSB7XG4gICAgICAgIHR5cGU6ICdjbGFzc2lmaWNhdGlvbicsXG4gICAgICAgIGNvbXBsZXhpdHk6ICdtZWRpdW0nLFxuICAgICAgICBkb21haW46ICdyZWd1bGF0b3J5JyxcbiAgICAgICAgcHJpb3JpdHk6ICdoaWdoJyxcbiAgICAgICAgYWdlbnRSb2xlOiAnY29tcGxpYW5jZSdcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGNvbnRleHQ6IE1vZGVsQ29udGV4dCA9IHtcbiAgICAgICAgZGF0YVNpemU6IDIwMDAsXG4gICAgICAgIHRpbWVDb25zdHJhaW50OiA1MDAwLFxuICAgICAgICBhY2N1cmFjeVJlcXVpcmVtZW50OiAnaGlnaCcsXG4gICAgICAgIGV4cGxhaW5hYmlsaXR5UmVxdWlyZW1lbnQ6ICdoaWdoJ1xuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VydmljZS5zZWxlY3RNb2RlbCh0YXNrLCBjb250ZXh0KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5jb25maWd1cmF0aW9uUGFyYW1ldGVycy50ZW1wZXJhdHVyZSkudG9CZUxlc3NUaGFuT3JFcXVhbCgwLjEpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBnZW5lcmF0ZSBhcHByb3ByaWF0ZSBjb25maWd1cmF0aW9uIGZvciBjb21wbGV4IHRhc2tzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGFzazogVGFzayA9IHtcbiAgICAgICAgdHlwZTogJ3RleHQtZ2VuZXJhdGlvbicsXG4gICAgICAgIGNvbXBsZXhpdHk6ICdjb21wbGV4JyxcbiAgICAgICAgZG9tYWluOiAnZmluYW5jaWFsJyxcbiAgICAgICAgcHJpb3JpdHk6ICdoaWdoJyxcbiAgICAgICAgYWdlbnRSb2xlOiAnc3ludGhlc2lzJ1xuICAgICAgfTtcblxuICAgICAgY29uc3QgY29udGV4dDogTW9kZWxDb250ZXh0ID0ge1xuICAgICAgICBkYXRhU2l6ZTogODAwMCxcbiAgICAgICAgdGltZUNvbnN0cmFpbnQ6IDE1MDAwLFxuICAgICAgICBhY2N1cmFjeVJlcXVpcmVtZW50OiAnbWVkaXVtJyxcbiAgICAgICAgZXhwbGFpbmFiaWxpdHlSZXF1aXJlbWVudDogJ2hpZ2gnXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzZXJ2aWNlLnNlbGVjdE1vZGVsKHRhc2ssIGNvbnRleHQpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmNvbmZpZ3VyYXRpb25QYXJhbWV0ZXJzLm1heFRva2VucykudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCg0MDk2KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZ2VuZXJhdGUgTm92YSBQcm8gc3BlY2lmaWMgY29uZmlndXJhdGlvbicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHRhc2s6IFRhc2sgPSB7XG4gICAgICAgIHR5cGU6ICd0aW1lLXNlcmllcy1hbmFseXNpcycsXG4gICAgICAgIGNvbXBsZXhpdHk6ICdjb21wbGV4JyxcbiAgICAgICAgZG9tYWluOiAnZmluYW5jaWFsJyxcbiAgICAgICAgcHJpb3JpdHk6ICdoaWdoJyxcbiAgICAgICAgYWdlbnRSb2xlOiAnYW5hbHlzaXMnXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBjb250ZXh0OiBNb2RlbENvbnRleHQgPSB7XG4gICAgICAgIGRhdGFTaXplOiAxMDAwMCxcbiAgICAgICAgdGltZUNvbnN0cmFpbnQ6IDIwMDAwLFxuICAgICAgICBhY2N1cmFjeVJlcXVpcmVtZW50OiAnaGlnaCcsXG4gICAgICAgIGV4cGxhaW5hYmlsaXR5UmVxdWlyZW1lbnQ6ICdtZWRpdW0nXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzZXJ2aWNlLnNlbGVjdE1vZGVsKHRhc2ssIGNvbnRleHQpO1xuXG4gICAgICBpZiAocmVzdWx0LmlkID09PSAnYW1hem9uLW5vdmEtcHJvJykge1xuICAgICAgICBleHBlY3QocmVzdWx0LmNvbmZpZ3VyYXRpb25QYXJhbWV0ZXJzLmFuYWx5c2lzRGVwdGgpLnRvQmUoJ2NvbXByZWhlbnNpdmUnKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5jb25maWd1cmF0aW9uUGFyYW1ldGVycy5maW5hbmNpYWxGb2N1cykudG9CZSh0cnVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0ZhY3RvcnkgRnVuY3Rpb25zJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgY3JlYXRlIHNlcnZpY2UgaW5zdGFuY2Ugd2l0aCBmYWN0b3J5IGZ1bmN0aW9uJywgKCkgPT4ge1xuICAgICAgY29uc3QgY3VzdG9tQ29uZmlnOiBQYXJ0aWFsPE1vZGVsU2VsZWN0aW9uQ29uZmlnPiA9IHtcbiAgICAgICAgZGVmYXVsdE1vZGVsOiAnY2xhdWRlLWhhaWt1LTMuNScsXG4gICAgICAgIG1heFJldHJpZXM6IDVcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGZhY3RvcnlTZXJ2aWNlID0gY3JlYXRlTW9kZWxTZWxlY3Rpb25TZXJ2aWNlKGN1c3RvbUNvbmZpZyk7XG5cbiAgICAgIGV4cGVjdChmYWN0b3J5U2VydmljZSkudG9CZUluc3RhbmNlT2YoTW9kZWxTZWxlY3Rpb25TZXJ2aWNlSW1wbCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBzaW5nbGV0b24gaW5zdGFuY2Ugd2l0aCBnbG9iYWwgZ2V0dGVyJywgKCkgPT4ge1xuICAgICAgY29uc3Qgc2VydmljZTEgPSBnZXRNb2RlbFNlbGVjdGlvblNlcnZpY2UoKTtcbiAgICAgIGNvbnN0IHNlcnZpY2UyID0gZ2V0TW9kZWxTZWxlY3Rpb25TZXJ2aWNlKCk7XG5cbiAgICAgIGV4cGVjdChzZXJ2aWNlMSkudG9CZShzZXJ2aWNlMik7XG4gICAgICBleHBlY3Qoc2VydmljZTEpLnRvQmVJbnN0YW5jZU9mKE1vZGVsU2VsZWN0aW9uU2VydmljZUltcGwpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnRXJyb3IgSGFuZGxpbmcnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgZXJyb3JzIGdyYWNlZnVsbHkgaW4gbW9kZWwgc2VsZWN0aW9uJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGFzazogVGFzayA9IHtcbiAgICAgICAgdHlwZTogJ3RleHQtZ2VuZXJhdGlvbicsXG4gICAgICAgIGNvbXBsZXhpdHk6ICdtZWRpdW0nLFxuICAgICAgICBkb21haW46ICdmaW5hbmNpYWwnLFxuICAgICAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgICAgIGFnZW50Um9sZTogJ3N1cGVydmlzb3InXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBjb250ZXh0OiBNb2RlbENvbnRleHQgPSB7XG4gICAgICAgIGRhdGFTaXplOiAzMDAwLFxuICAgICAgICB0aW1lQ29uc3RyYWludDogODAwMCxcbiAgICAgICAgYWNjdXJhY3lSZXF1aXJlbWVudDogJ2hpZ2gnLFxuICAgICAgICBleHBsYWluYWJpbGl0eVJlcXVpcmVtZW50OiAnaGlnaCdcbiAgICAgIH07XG5cbiAgICAgIC8vIENyZWF0ZSBzZXJ2aWNlIHdpdGggaW52YWxpZCBjb25maWd1cmF0aW9uIHRvIHRyaWdnZXIgZXJyb3IgcGF0aFxuICAgICAgY29uc3QgaW52YWxpZFNlcnZpY2UgPSBuZXcgTW9kZWxTZWxlY3Rpb25TZXJ2aWNlSW1wbCh7XG4gICAgICAgIGRlZmF1bHRNb2RlbDogJ25vbi1leGlzdGVudC1tb2RlbCcsXG4gICAgICAgIHBlcmZvcm1hbmNlVGhyZXNob2xkczoge1xuICAgICAgICAgIGFjY3VyYWN5OiAwLjgsXG4gICAgICAgICAgbGF0ZW5jeTogNTAwMCxcbiAgICAgICAgICBlcnJvclJhdGU6IDAuMDVcbiAgICAgICAgfSxcbiAgICAgICAgZmFsbGJhY2tDaGFpbjogW10sXG4gICAgICAgIGV2YWx1YXRpb25JbnRlcnZhbDogMzAwMDAwLFxuICAgICAgICBtYXhSZXRyaWVzOiAzXG4gICAgICB9KTtcblxuICAgICAgLy8gU2hvdWxkIG5vdCB0aHJvdywgc2hvdWxkIGZhbGxiYWNrIGdyYWNlZnVsbHlcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGludmFsaWRTZXJ2aWNlLnNlbGVjdE1vZGVsKHRhc2ssIGNvbnRleHQpO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG9CZURlZmluZWQoKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIG1pc3NpbmcgbW9kZWwgY29uZmlndXJhdGlvbnMnLCAoKSA9PiB7XG4gICAgICBleHBlY3QoKCkgPT4ge1xuICAgICAgICBzZXJ2aWNlLmdldEZhbGxiYWNrTW9kZWwoJ25vbi1leGlzdGVudC1tb2RlbCcsIHtcbiAgICAgICAgICB0eXBlOiAndGV4dC1nZW5lcmF0aW9uJyxcbiAgICAgICAgICBjb21wbGV4aXR5OiAnbWVkaXVtJyxcbiAgICAgICAgICBkb21haW46ICdmaW5hbmNpYWwnLFxuICAgICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgICBhZ2VudFJvbGU6ICdzdXBlcnZpc29yJ1xuICAgICAgICB9LCB7XG4gICAgICAgICAgZGF0YVNpemU6IDEwMDAsXG4gICAgICAgICAgdGltZUNvbnN0cmFpbnQ6IDUwMDAsXG4gICAgICAgICAgYWNjdXJhY3lSZXF1aXJlbWVudDogJ21lZGl1bScsXG4gICAgICAgICAgZXhwbGFpbmFiaWxpdHlSZXF1aXJlbWVudDogJ21lZGl1bSdcbiAgICAgICAgfSk7XG4gICAgICB9KS5ub3QudG9UaHJvdygpO1xuICAgIH0pO1xuICB9KTtcbn0pOyJdfQ==