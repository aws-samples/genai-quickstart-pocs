"use strict";
/**
 * Tests for the KnowledgeQueryService
 */
Object.defineProperty(exports, "__esModule", { value: true });
const knowledge_query_service_1 = require("../knowledge-query-service");
const proprietary_data_service_1 = require("../proprietary-data-service");
const web_search_service_1 = require("../web-search-service");
// Mock dependencies
jest.mock('../proprietary-data-service');
jest.mock('../web-search-service');
jest.mock('../market-data-service');
describe('KnowledgeQueryService', () => {
    let knowledgeQueryService;
    let mockProprietaryDataService;
    let mockWebSearchService;
    let mockMarketDataService;
    const testCacheConfig = {
        stdTTL: 60,
        checkperiod: 30,
        maxKeys: 100,
        useClones: true
    };
    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        // Create mock instances
        mockProprietaryDataService = new proprietary_data_service_1.ProprietaryDataService('test-bucket');
        mockWebSearchService = new web_search_service_1.WebSearchService('test-api-key');
        mockMarketDataService = {
            queryData: jest.fn()
        };
        // Create service instance
        knowledgeQueryService = new knowledge_query_service_1.KnowledgeQueryService(mockProprietaryDataService, mockWebSearchService, mockMarketDataService, testCacheConfig);
        // Mock web search results
        mockWebSearchService.performWebSearch = jest.fn().mockResolvedValue({
            results: [
                {
                    title: 'Test Result 1',
                    url: 'https://example.com/1',
                    snippet: 'This is a test result about AAPL',
                    source: 'Example Source',
                    publishDate: new Date('2023-01-01'),
                    relevanceScore: 0.8
                },
                {
                    title: 'Test Result 2',
                    url: 'https://example.com/2',
                    snippet: 'This is another test result about MSFT',
                    source: 'Another Source',
                    publishDate: new Date('2023-02-01'),
                    relevanceScore: 0.7
                }
            ],
            totalResults: 2,
            executionTime: 100
        });
        // Mock market data results
        mockMarketDataService.queryData = jest.fn().mockResolvedValue({
            data: [
                {
                    id: 'md-1',
                    symbol: 'AAPL',
                    dataType: 'price',
                    timestamp: new Date('2023-03-01'),
                    value: { open: 150, high: 155, low: 148, close: 152, volume: 1000000 },
                    source: 'Alpha Vantage',
                    interval: 'daily'
                },
                {
                    id: 'md-2',
                    symbol: 'MSFT',
                    dataType: 'price',
                    timestamp: new Date('2023-03-01'),
                    value: { open: 250, high: 255, low: 248, close: 252, volume: 800000 },
                    source: 'Alpha Vantage',
                    interval: 'daily'
                }
            ],
            metadata: {
                query: {},
                count: 2,
                executionTime: 150
            }
        });
    });
    describe('queryKnowledgeBase', () => {
        it('should query all data sources and return combined results', async () => {
            // Define test query and filters
            const query = {
                text: 'AAPL stock performance',
                type: 'keyword'
            };
            const filters = {
                dateRange: {
                    start: new Date('2023-01-01'),
                    end: new Date('2023-03-31')
                }
            };
            // Call the method
            const result = await knowledgeQueryService.queryKnowledgeBase(query, filters);
            // Verify web search was called with correct parameters
            expect(mockWebSearchService.performWebSearch).toHaveBeenCalledWith('AAPL stock performance', expect.objectContaining({
                depth: 'comprehensive',
                timeframe: 'past-month'
            }));
            // Verify market data service was called with correct parameters
            expect(mockMarketDataService.queryData).toHaveBeenCalledWith(expect.objectContaining({
                symbols: ['AAPL'],
                timeRange: {
                    start: new Date('2023-01-01'),
                    end: new Date('2023-03-31')
                }
            }));
            // Verify result structure
            expect(result).toHaveProperty('items');
            expect(result).toHaveProperty('totalCount');
            expect(result).toHaveProperty('executionTime');
            // Verify items were combined from both sources
            expect(result.items.length).toBeGreaterThan(0);
            // Verify items are ranked by relevance
            expect(result.items[0].relevanceScore).toBeGreaterThanOrEqual(result.items[1].relevanceScore);
        });
        it('should use cache for repeated queries', async () => {
            // Define test query and filters
            const query = {
                text: 'MSFT quarterly earnings',
                type: 'keyword'
            };
            const filters = {};
            // First call should query services
            await knowledgeQueryService.queryKnowledgeBase(query, filters);
            // Reset mocks to verify they aren't called again
            jest.clearAllMocks();
            // Second call should use cache
            await knowledgeQueryService.queryKnowledgeBase(query, filters);
            // Verify services weren't called again
            expect(mockWebSearchService.performWebSearch).not.toHaveBeenCalled();
            expect(mockMarketDataService.queryData).not.toHaveBeenCalled();
        });
        it('should apply relevance threshold filter', async () => {
            // Define test query and filters with relevance threshold
            const query = {
                text: 'tech stocks',
                type: 'keyword'
            };
            const filters = {
                relevanceThreshold: 0.75 // Only include items with relevance >= 0.75
            };
            // Call the method
            const result = await knowledgeQueryService.queryKnowledgeBase(query, filters);
            // Verify all items meet the threshold
            expect(result.items.every(item => item.relevanceScore >= 0.75)).toBe(true);
        });
    });
    describe('cache management', () => {
        it('should clear cache', () => {
            // First populate cache
            const query = {
                text: 'test query',
                type: 'keyword'
            };
            const filters = {};
            // Call the method to populate cache
            knowledgeQueryService.queryKnowledgeBase(query, filters);
            // Clear cache
            const result = knowledgeQueryService.clearCache();
            // Verify result
            expect(result).toBe(true);
            // Verify cache stats
            const stats = knowledgeQueryService.getCacheStats();
            expect(stats.keys).toBe(0);
        });
        it('should return cache statistics', async () => {
            // First populate cache
            const query = {
                text: 'test query for stats',
                type: 'keyword'
            };
            const filters = {};
            // Call the method to populate cache
            await knowledgeQueryService.queryKnowledgeBase(query, filters);
            // Get cache stats
            const stats = knowledgeQueryService.getCacheStats();
            // Verify stats structure
            expect(stats).toHaveProperty('keys');
            expect(stats).toHaveProperty('hits');
            expect(stats).toHaveProperty('misses');
            expect(stats.keys).toBeGreaterThan(0);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia25vd2xlZGdlLXF1ZXJ5LXNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9fX3Rlc3RzX18va25vd2xlZGdlLXF1ZXJ5LXNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsd0VBQWdGO0FBQ2hGLDBFQUFxRTtBQUNyRSw4REFBeUQ7QUFLekQsb0JBQW9CO0FBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsQ0FBQztBQUN6QyxJQUFJLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUM7QUFDbkMsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO0FBRXBDLFFBQVEsQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7SUFDckMsSUFBSSxxQkFBNEMsQ0FBQztJQUNqRCxJQUFJLDBCQUErRCxDQUFDO0lBQ3BFLElBQUksb0JBQW1ELENBQUM7SUFDeEQsSUFBSSxxQkFBcUQsQ0FBQztJQUUxRCxNQUFNLGVBQWUsR0FBZ0I7UUFDbkMsTUFBTSxFQUFFLEVBQUU7UUFDVixXQUFXLEVBQUUsRUFBRTtRQUNmLE9BQU8sRUFBRSxHQUFHO1FBQ1osU0FBUyxFQUFFLElBQUk7S0FDaEIsQ0FBQztJQUVGLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDZCxrQkFBa0I7UUFDbEIsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBRXJCLHdCQUF3QjtRQUN4QiwwQkFBMEIsR0FBRyxJQUFJLGlEQUFzQixDQUFDLGFBQWEsQ0FBd0MsQ0FBQztRQUM5RyxvQkFBb0IsR0FBRyxJQUFJLHFDQUFnQixDQUFDLGNBQWMsQ0FBa0MsQ0FBQztRQUM3RixxQkFBcUIsR0FBRztZQUN0QixTQUFTLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTtTQUN3QixDQUFDO1FBRS9DLDBCQUEwQjtRQUMxQixxQkFBcUIsR0FBRyxJQUFJLCtDQUFxQixD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Q3JDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDckMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN2QyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4QyxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRlc3RzIGZvciB0aGUgS25vd2xlZGdlUXVlcnlTZXJ2aWNlXG4gKi9cblxuaW1wb3J0IHsgS25vd2xlZGdlUXVlcnlTZXJ2aWNlLCBDYWNoZUNvbmZpZyB9IGZyb20gJy4uL2tub3dsZWRnZS1xdWVyeS1zZXJ2aWNlJztcbmltcG9ydCB7IFByb3ByaWV0YXJ5RGF0YVNlcnZpY2UgfSBmcm9tICcuLi9wcm9wcmlldGFyeS1kYXRhLXNlcnZpY2UnO1xuaW1wb3J0IHsgV2ViU2VhcmNoU2VydmljZSB9IGZyb20gJy4uL3dlYi1zZWFyY2gtc2VydmljZSc7XG5pbXBvcnQgeyBNYXJrZXREYXRhU2VydmljZSB9IGZyb20gJy4uL21hcmtldC1kYXRhLXNlcnZpY2UnO1xuaW1wb3J0IHsgUXVlcnksIFF1ZXJ5RmlsdGVycywgV2ViU2VhcmNoT3B0aW9ucywgV2ViU2VhcmNoUmVzdWx0IH0gZnJvbSAnLi4vLi4vbW9kZWxzL3NlcnZpY2VzJztcbmltcG9ydCB7IE1hcmtldERhdGFRdWVyeSwgTWFya2V0RGF0YVF1ZXJ5UmVzdWx0IH0gZnJvbSAnLi4vLi4vbW9kZWxzL21hcmtldC1kYXRhJztcblxuLy8gTW9jayBkZXBlbmRlbmNpZXNcbmplc3QubW9jaygnLi4vcHJvcHJpZXRhcnktZGF0YS1zZXJ2aWNlJyk7XG5qZXN0Lm1vY2soJy4uL3dlYi1zZWFyY2gtc2VydmljZScpO1xuamVzdC5tb2NrKCcuLi9tYXJrZXQtZGF0YS1zZXJ2aWNlJyk7XG5cbmRlc2NyaWJlKCdLbm93bGVkZ2VRdWVyeVNlcnZpY2UnLCAoKSA9PiB7XG4gIGxldCBrbm93bGVkZ2VRdWVyeVNlcnZpY2U6IEtub3dsZWRnZVF1ZXJ5U2VydmljZTtcbiAgbGV0IG1vY2tQcm9wcmlldGFyeURhdGFTZXJ2aWNlOiBqZXN0Lk1vY2tlZDxQcm9wcmlldGFyeURhdGFTZXJ2aWNlPjtcbiAgbGV0IG1vY2tXZWJTZWFyY2hTZXJ2aWNlOiBqZXN0Lk1vY2tlZDxXZWJTZWFyY2hTZXJ2aWNlPjtcbiAgbGV0IG1vY2tNYXJrZXREYXRhU2VydmljZTogamVzdC5Nb2NrZWQ8TWFya2V0RGF0YVNlcnZpY2U+O1xuICBcbiAgY29uc3QgdGVzdENhY2hlQ29uZmlnOiBDYWNoZUNvbmZpZyA9IHtcbiAgICBzdGRUVEw6IDYwLCAvLyAxIG1pbnV0ZVxuICAgIGNoZWNrcGVyaW9kOiAzMCxcbiAgICBtYXhLZXlzOiAxMDAsXG4gICAgdXNlQ2xvbmVzOiB0cnVlXG4gIH07XG4gIFxuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAvLyBDbGVhciBhbGwgbW9ja3NcbiAgICBqZXN0LmNsZWFyQWxsTW9ja3MoKTtcbiAgICBcbiAgICAvLyBDcmVhdGUgbW9jayBpbnN0YW5jZXNcbiAgICBtb2NrUHJvcHJpZXRhcnlEYXRhU2VydmljZSA9IG5ldyBQcm9wcmlldGFyeURhdGFTZXJ2aWNlKCd0ZXN0LWJ1Y2tldCcpIGFzIGplc3QuTW9ja2VkPFByb3ByaWV0YXJ5RGF0YVNlcnZpY2U+O1xuICAgIG1vY2tXZWJTZWFyY2hTZXJ2aWNlID0gbmV3IFdlYlNlYXJjaFNlcnZpY2UoJ3Rlc3QtYXBpLWtleScpIGFzIGplc3QuTW9ja2VkPFdlYlNlYXJjaFNlcnZpY2U+O1xuICAgIG1vY2tNYXJrZXREYXRhU2VydmljZSA9IHtcbiAgICAgIHF1ZXJ5RGF0YTogamVzdC5mbigpXG4gICAgfSBhcyB1bmtub3duIGFzIGplc3QuTW9ja2VkPE1hcmtldERhdGFTZXJ2aWNlPjtcbiAgICBcbiAgICAvLyBDcmVhdGUgc2VydmljZSBpbnN0YW5jZVxuICAgIGtub3dsZWRnZVF1ZXJ5U2VydmljZSA9IG5ldyBLbm93bGVkZ2VRdWVyeVNlcnZpY2UoXG4gICAgICBtb2NrUHJvcHJpZXRhcnlEYXRhU2VydmljZSxcbiAgICAgIG1vY2tXZWJTZWFyY2hTZXJ2aWNlLFxuICAgICAgbW9ja01hcmtldERhdGFTZXJ2aWNlLFxuICAgICAgdGVzdENhY2hlQ29uZmlnXG4gICAgKTtcbiAgICBcbiAgICAvLyBNb2NrIHdlYiBzZWFyY2ggcmVzdWx0c1xuICAgIG1vY2tXZWJTZWFyY2hTZXJ2aWNlLnBlcmZvcm1XZWJTZWFyY2ggPSBqZXN0LmZuKCkubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgcmVzdWx0czogW1xuICAgICAgICB7XG4gICAgICAgICAgdGl0bGU6ICdUZXN0IFJlc3VsdCAxJyxcbiAgICAgICAgICB1cmw6ICdodHRwczovL2V4YW1wbGUuY29tLzEnLFxuICAgICAgICAgIHNuaXBwZXQ6ICdUaGlzIGlzIGEgdGVzdCByZXN1bHQgYWJvdXQgQUFQTCcsXG4gICAgICAgICAgc291cmNlOiAnRXhhbXBsZSBTb3VyY2UnLFxuICAgICAgICAgIHB1Ymxpc2hEYXRlOiBuZXcgRGF0ZSgnMjAyMy0wMS0wMScpLFxuICAgICAgICAgIHJlbGV2YW5jZVNjb3JlOiAwLjhcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHRpdGxlOiAnVGVzdCBSZXN1bHQgMicsXG4gICAgICAgICAgdXJsOiAnaHR0cHM6Ly9leGFtcGxlLmNvbS8yJyxcbiAgICAgICAgICBzbmlwcGV0OiAnVGhpcyBpcyBhbm90aGVyIHRlc3QgcmVzdWx0IGFib3V0IE1TRlQnLFxuICAgICAgICAgIHNvdXJjZTogJ0Fub3RoZXIgU291cmNlJyxcbiAgICAgICAgICBwdWJsaXNoRGF0ZTogbmV3IERhdGUoJzIwMjMtMDItMDEnKSxcbiAgICAgICAgICByZWxldmFuY2VTY29yZTogMC43XG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICB0b3RhbFJlc3VsdHM6IDIsXG4gICAgICBleGVjdXRpb25UaW1lOiAxMDBcbiAgICB9IGFzIFdlYlNlYXJjaFJlc3VsdCk7XG4gICAgXG4gICAgLy8gTW9jayBtYXJrZXQgZGF0YSByZXN1bHRzXG4gICAgbW9ja01hcmtldERhdGFTZXJ2aWNlLnF1ZXJ5RGF0YSA9IGplc3QuZm4oKS5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICBkYXRhOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ21kLTEnLFxuICAgICAgICAgIHN5bWJvbDogJ0FBUEwnLFxuICAgICAgICAgIGRhdGFUeXBlOiAncHJpY2UnLFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoJzIwMjMtMDMtMDEnKSxcbiAgICAgICAgICB2YWx1ZTogeyBvcGVuOiAxNTAsIGhpZ2g6IDE1NSwgbG93OiAxNDgsIGNsb3NlOiAxNTIsIHZvbHVtZTogMTAwMDAwMCB9LFxuICAgICAgICAgIHNvdXJjZTogJ0FscGhhIFZhbnRhZ2UnLFxuICAgICAgICAgIGludGVydmFsOiAnZGFpbHknXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ21kLTInLFxuICAgICAgICAgIHN5bWJvbDogJ01TRlQnLFxuICAgICAgICAgIGRhdGFUeXBlOiAncHJpY2UnLFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoJzIwMjMtMDMtMDEnKSxcbiAgICAgICAgICB2YWx1ZTogeyBvcGVuOiAyNTAsIGhpZ2g6IDI1NSwgbG93OiAyNDgsIGNsb3NlOiAyNTIsIHZvbHVtZTogODAwMDAwIH0sXG4gICAgICAgICAgc291cmNlOiAnQWxwaGEgVmFudGFnZScsXG4gICAgICAgICAgaW50ZXJ2YWw6ICdkYWlseSdcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgIHF1ZXJ5OiB7fSBhcyBNYXJrZXREYXRhUXVlcnksXG4gICAgICAgIGNvdW50OiAyLFxuICAgICAgICBleGVjdXRpb25UaW1lOiAxNTBcbiAgICAgIH1cbiAgICB9IGFzIE1hcmtldERhdGFRdWVyeVJlc3VsdCk7XG4gIH0pO1xuICBcbiAgZGVzY3JpYmUoJ3F1ZXJ5S25vd2xlZGdlQmFzZScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHF1ZXJ5IGFsbCBkYXRhIHNvdXJjZXMgYW5kIHJldHVybiBjb21iaW5lZCByZXN1bHRzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgLy8gRGVmaW5lIHRlc3QgcXVlcnkgYW5kIGZpbHRlcnNcbiAgICAgIGNvbnN0IHF1ZXJ5OiBRdWVyeSA9IHtcbiAgICAgICAgdGV4dDogJ0FBUEwgc3RvY2sgcGVyZm9ybWFuY2UnLFxuICAgICAgICB0eXBlOiAna2V5d29yZCdcbiAgICAgIH07XG4gICAgICBcbiAgICAgIGNvbnN0IGZpbHRlcnM6IFF1ZXJ5RmlsdGVycyA9IHtcbiAgICAgICAgZGF0ZVJhbmdlOiB7XG4gICAgICAgICAgc3RhcnQ6IG5ldyBEYXRlKCcyMDIzLTAxLTAxJyksXG4gICAgICAgICAgZW5kOiBuZXcgRGF0ZSgnMjAyMy0wMy0zMScpXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBcbiAgICAgIC8vIENhbGwgdGhlIG1ldGhvZFxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQga25vd2xlZGdlUXVlcnlTZXJ2aWNlLnF1ZXJ5S25vd2xlZGdlQmFzZShxdWVyeSwgZmlsdGVycyk7XG4gICAgICBcbiAgICAgIC8vIFZlcmlmeSB3ZWIgc2VhcmNoIHdhcyBjYWxsZWQgd2l0aCBjb3JyZWN0IHBhcmFtZXRlcnNcbiAgICAgIGV4cGVjdChtb2NrV2ViU2VhcmNoU2VydmljZS5wZXJmb3JtV2ViU2VhcmNoKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgJ0FBUEwgc3RvY2sgcGVyZm9ybWFuY2UnLFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZGVwdGg6ICdjb21wcmVoZW5zaXZlJyxcbiAgICAgICAgICB0aW1lZnJhbWU6ICdwYXN0LW1vbnRoJ1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICAgIFxuICAgICAgLy8gVmVyaWZ5IG1hcmtldCBkYXRhIHNlcnZpY2Ugd2FzIGNhbGxlZCB3aXRoIGNvcnJlY3QgcGFyYW1ldGVyc1xuICAgICAgZXhwZWN0KG1vY2tNYXJrZXREYXRhU2VydmljZS5xdWVyeURhdGEpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgc3ltYm9sczogWydBQVBMJ10sXG4gICAgICAgICAgdGltZVJhbmdlOiB7XG4gICAgICAgICAgICBzdGFydDogbmV3IERhdGUoJzIwMjMtMDEtMDEnKSxcbiAgICAgICAgICAgIGVuZDogbmV3IERhdGUoJzIwMjMtMDMtMzEnKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgICBcbiAgICAgIC8vIFZlcmlmeSByZXN1bHQgc3RydWN0dXJlXG4gICAgICBleHBlY3QocmVzdWx0KS50b0hhdmVQcm9wZXJ0eSgnaXRlbXMnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvSGF2ZVByb3BlcnR5KCd0b3RhbENvdW50Jyk7XG4gICAgICBleHBlY3QocmVzdWx0KS50b0hhdmVQcm9wZXJ0eSgnZXhlY3V0aW9uVGltZScpO1xuICAgICAgXG4gICAgICAvLyBWZXJpZnkgaXRlbXMgd2VyZSBjb21iaW5lZCBmcm9tIGJvdGggc291cmNlc1xuICAgICAgZXhwZWN0KHJlc3VsdC5pdGVtcy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgIFxuICAgICAgLy8gVmVyaWZ5IGl0ZW1zIGFyZSByYW5rZWQgYnkgcmVsZXZhbmNlXG4gICAgICBleHBlY3QocmVzdWx0Lml0ZW1zWzBdLnJlbGV2YW5jZVNjb3JlKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKHJlc3VsdC5pdGVtc1sxXS5yZWxldmFuY2VTY29yZSk7XG4gICAgfSk7XG4gICAgXG4gICAgaXQoJ3Nob3VsZCB1c2UgY2FjaGUgZm9yIHJlcGVhdGVkIHF1ZXJpZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICAvLyBEZWZpbmUgdGVzdCBxdWVyeSBhbmQgZmlsdGVyc1xuICAgICAgY29uc3QgcXVlcnk6IFF1ZXJ5ID0ge1xuICAgICAgICB0ZXh0OiAnTVNGVCBxdWFydGVybHkgZWFybmluZ3MnLFxuICAgICAgICB0eXBlOiAna2V5d29yZCdcbiAgICAgIH07XG4gICAgICBcbiAgICAgIGNvbnN0IGZpbHRlcnM6IFF1ZXJ5RmlsdGVycyA9IHt9O1xuICAgICAgXG4gICAgICAvLyBGaXJzdCBjYWxsIHNob3VsZCBxdWVyeSBzZXJ2aWNlc1xuICAgICAgYXdhaXQga25vd2xlZGdlUXVlcnlTZXJ2aWNlLnF1ZXJ5S25vd2xlZGdlQmFzZShxdWVyeSwgZmlsdGVycyk7XG4gICAgICBcbiAgICAgIC8vIFJlc2V0IG1vY2tzIHRvIHZlcmlmeSB0aGV5IGFyZW4ndCBjYWxsZWQgYWdhaW5cbiAgICAgIGplc3QuY2xlYXJBbGxNb2NrcygpO1xuICAgICAgXG4gICAgICAvLyBTZWNvbmQgY2FsbCBzaG91bGQgdXNlIGNhY2hlXG4gICAgICBhd2FpdCBrbm93bGVkZ2VRdWVyeVNlcnZpY2UucXVlcnlLbm93bGVkZ2VCYXNlKHF1ZXJ5LCBmaWx0ZXJzKTtcbiAgICAgIFxuICAgICAgLy8gVmVyaWZ5IHNlcnZpY2VzIHdlcmVuJ3QgY2FsbGVkIGFnYWluXG4gICAgICBleHBlY3QobW9ja1dlYlNlYXJjaFNlcnZpY2UucGVyZm9ybVdlYlNlYXJjaCkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICAgIGV4cGVjdChtb2NrTWFya2V0RGF0YVNlcnZpY2UucXVlcnlEYXRhKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgIH0pO1xuICAgIFxuICAgIGl0KCdzaG91bGQgYXBwbHkgcmVsZXZhbmNlIHRocmVzaG9sZCBmaWx0ZXInLCBhc3luYyAoKSA9PiB7XG4gICAgICAvLyBEZWZpbmUgdGVzdCBxdWVyeSBhbmQgZmlsdGVycyB3aXRoIHJlbGV2YW5jZSB0aHJlc2hvbGRcbiAgICAgIGNvbnN0IHF1ZXJ5OiBRdWVyeSA9IHtcbiAgICAgICAgdGV4dDogJ3RlY2ggc3RvY2tzJyxcbiAgICAgICAgdHlwZTogJ2tleXdvcmQnXG4gICAgICB9O1xuICAgICAgXG4gICAgICBjb25zdCBmaWx0ZXJzOiBRdWVyeUZpbHRlcnMgPSB7XG4gICAgICAgIHJlbGV2YW5jZVRocmVzaG9sZDogMC43NSAvLyBPbmx5IGluY2x1ZGUgaXRlbXMgd2l0aCByZWxldmFuY2UgPj0gMC43NVxuICAgICAgfTtcbiAgICAgIFxuICAgICAgLy8gQ2FsbCB0aGUgbWV0aG9kXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBrbm93bGVkZ2VRdWVyeVNlcnZpY2UucXVlcnlLbm93bGVkZ2VCYXNlKHF1ZXJ5LCBmaWx0ZXJzKTtcbiAgICAgIFxuICAgICAgLy8gVmVyaWZ5IGFsbCBpdGVtcyBtZWV0IHRoZSB0aHJlc2hvbGRcbiAgICAgIGV4cGVjdChyZXN1bHQuaXRlbXMuZXZlcnkoaXRlbSA9PiBpdGVtLnJlbGV2YW5jZVNjb3JlID49IDAuNzUpKS50b0JlKHRydWUpO1xuICAgIH0pO1xuICB9KTtcbiAgXG4gIGRlc2NyaWJlKCdjYWNoZSBtYW5hZ2VtZW50JywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgY2xlYXIgY2FjaGUnLCAoKSA9PiB7XG4gICAgICAvLyBGaXJzdCBwb3B1bGF0ZSBjYWNoZVxuICAgICAgY29uc3QgcXVlcnk6IFF1ZXJ5ID0ge1xuICAgICAgICB0ZXh0OiAndGVzdCBxdWVyeScsXG4gICAgICAgIHR5cGU6ICdrZXl3b3JkJ1xuICAgICAgfTtcbiAgICAgIFxuICAgICAgY29uc3QgZmlsdGVyczogUXVlcnlGaWx0ZXJzID0ge307XG4gICAgICBcbiAgICAgIC8vIENhbGwgdGhlIG1ldGhvZCB0byBwb3B1bGF0ZSBjYWNoZVxuICAgICAga25vd2xlZGdlUXVlcnlTZXJ2aWNlLnF1ZXJ5S25vd2xlZGdlQmFzZShxdWVyeSwgZmlsdGVycyk7XG4gICAgICBcbiAgICAgIC8vIENsZWFyIGNhY2hlXG4gICAgICBjb25zdCByZXN1bHQgPSBrbm93bGVkZ2VRdWVyeVNlcnZpY2UuY2xlYXJDYWNoZSgpO1xuICAgICAgXG4gICAgICAvLyBWZXJpZnkgcmVzdWx0XG4gICAgICBleHBlY3QocmVzdWx0KS50b0JlKHRydWUpO1xuICAgICAgXG4gICAgICAvLyBWZXJpZnkgY2FjaGUgc3RhdHNcbiAgICAgIGNvbnN0IHN0YXRzID0ga25vd2xlZGdlUXVlcnlTZXJ2aWNlLmdldENhY2hlU3RhdHMoKTtcbiAgICAgIGV4cGVjdChzdGF0cy5rZXlzKS50b0JlKDApO1xuICAgIH0pO1xuICAgIFxuICAgIGl0KCdzaG91bGQgcmV0dXJuIGNhY2hlIHN0YXRpc3RpY3MnLCBhc3luYyAoKSA9PiB7XG4gICAgICAvLyBGaXJzdCBwb3B1bGF0ZSBjYWNoZVxuICAgICAgY29uc3QgcXVlcnk6IFF1ZXJ5ID0ge1xuICAgICAgICB0ZXh0OiAndGVzdCBxdWVyeSBmb3Igc3RhdHMnLFxuICAgICAgICB0eXBlOiAna2V5d29yZCdcbiAgICAgIH07XG4gICAgICBcbiAgICAgIGNvbnN0IGZpbHRlcnM6IFF1ZXJ5RmlsdGVycyA9IHt9O1xuICAgICAgXG4gICAgICAvLyBDYWxsIHRoZSBtZXRob2QgdG8gcG9wdWxhdGUgY2FjaGVcbiAgICAgIGF3YWl0IGtub3dsZWRnZVF1ZXJ5U2VydmljZS5xdWVyeUtub3dsZWRnZUJhc2UocXVlcnksIGZpbHRlcnMpO1xuICAgICAgXG4gICAgICAvLyBHZXQgY2FjaGUgc3RhdHNcbiAgICAgIGNvbnN0IHN0YXRzID0ga25vd2xlZGdlUXVlcnlTZXJ2aWNlLmdldENhY2hlU3RhdHMoKTtcbiAgICAgIFxuICAgICAgLy8gVmVyaWZ5IHN0YXRzIHN0cnVjdHVyZVxuICAgICAgZXhwZWN0KHN0YXRzKS50b0hhdmVQcm9wZXJ0eSgna2V5cycpO1xuICAgICAgZXhwZWN0KHN0YXRzKS50b0hhdmVQcm9wZXJ0eSgnaGl0cycpO1xuICAgICAgZXhwZWN0KHN0YXRzKS50b0hhdmVQcm9wZXJ0eSgnbWlzc2VzJyk7XG4gICAgICBleHBlY3Qoc3RhdHMua2V5cykudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgIH0pO1xuICB9KTtcbn0pOyJdfQ==