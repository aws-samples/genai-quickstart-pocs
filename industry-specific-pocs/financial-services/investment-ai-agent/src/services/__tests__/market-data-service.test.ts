/**
 * Tests for the market data service
 */

import { v4 as uuidv4 } from 'uuid';
import {
  MarketDataService,
  MarketDataProvider,
  MarketDataStorage,
  MarketDataAlertService,
  StorageStats
} from '../market-data-service';
import {
  MarketDataFeedConfig,
  MarketDataStorageConfig,
  MarketDataQuery,
  MarketDataQueryResult,
  MarketAlertConfig,
  MarketDataPoint,
  MarketAlert,
  MarketDataFeedStatus,
  MarketDataType,
  MarketDataInterval
} from '../../models/market-data';

// Mock implementations
class MockMarketDataProvider implements MarketDataProvider {
  async connect(config: MarketDataFeedConfig): Promise<MarketDataFeedStatus> {
    return {
      provider: config.provider,
      connected: true,
      connectionId: 'mock-connection-id',
      latency: 10,
      lastUpdated: new Date(),
      activeSymbols: config.symbols.length,
      activeDataTypes: config.dataTypes,
      throttleStatus: {
        requestsPerMinute: 0,
        maxRequestsPerMinute: 5,
        throttled: false
      }
    };
  }

  async disconnect(): Promise<void> {
    // Do nothing
  }

  getStatus(): MarketDataFeedStatus {
    return {
      provider: 'mock-provider',
      connected: true,
      connectionId: 'mock-connection-id',
      latency: 10,
      lastUpdated: new Date(),
      activeSymbols: 0,
      activeDataTypes: [],
      throttleStatus: {
        requestsPerMinute: 0,
        maxRequestsPerMinute: 5,
        throttled: false
      }
    };
  }

  async subscribeToData(
    symbols: string[], 
    dataTypes: MarketDataType[], 
    interval: MarketDataInterval
  ): Promise<void> {
    // Do nothing
  }

  async unsubscribeFromData(
    symbols: string[], 
    dataTypes: MarketDataType[]
  ): Promise<void> {
    // Do nothing
  }

  async getHistoricalData(query: MarketDataQuery): Promise<MarketDataPoint[]> {
    return [];
  }
}

class MockMarketDataStorage implements MarketDataStorage {
  private data: MarketDataPoint[] = [];
  
  async initialize(config: MarketDataStorageConfig): Promise<void> {
    // Do nothing
  }
  
  async storeDataPoint(dataPoint: MarketDataPoint): Promise<void> {
    this.data.push(dataPoint);
  }
  
  async storeDataPoints(dataPoints: MarketDataPoint[]): Promise<void> {
    this.data.push(...dataPoints);
  }
  
  async queryData(query: MarketDataQuery): Promise<MarketDataQueryResult> {
    // Filter data based on query
    const filteredData = this.data.filter(dp => 
      query.symbols.includes(dp.symbol) &&
      query.dataTypes.includes(dp.dataType) &&
      dp.timestamp >= query.timeRange.start &&
      dp.timestamp <= query.timeRange.end
    );
    
    return {
      data: filteredData,
      metadata: {
        query,
        count: filteredData.length,
        executionTime: 10
      }
    };
  }
  
  async deleteData(query: MarketDataQuery): Promise<number> {
    const beforeCount = this.data.length;
    
    this.data = this.data.filter(dp => 
      !query.symbols.includes(dp.symbol) ||
      !query.dataTypes.includes(dp.dataType) ||
      dp.timestamp < query.timeRange.start ||
      dp.timestamp > query.timeRange.end
    );
    
    return beforeCount - this.data.length;
  }
  
  async getStorageStats(): Promise<StorageStats> {
    return {
      totalDataPoints: this.data.length,
      oldestDataPoint: new Date(),
      newestDataPoint: new Date(),
      dataPointsByType: {} as Record<MarketDataType, number>,
      storageSize: 1000
    };
  }
}

class MockMarketAlertService implements MarketDataAlertService {
  private alerts: Map<string, MarketAlertConfig> = new Map();
  
  async createAlert(alertConfig: Omit<MarketAlertConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<MarketAlertConfig> {
    const id = uuidv4();
    const now = new Date();
    
    const newAlert: MarketAlertConfig = {
      ...alertConfig,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.alerts.set(id, newAlert);
    return newAlert;
  }
  
  async updateAlert(alertId: string, updates: Partial<MarketAlertConfig>): Promise<MarketAlertConfig> {
    const existingAlert = this.alerts.get(alertId);
    
    if (!existingAlert) {
      throw new Error(`Alert not found: ${alertId}`);
    }
    
    const updatedAlert: MarketAlertConfig = {
      ...existingAlert,
      ...updates,
      id: existingAlert.id,
      createdAt: existingAlert.createdAt,
      updatedAt: new Date()
    };
    
    this.alerts.set(alertId, updatedAlert);
    return updatedAlert;
  }
  
  async deleteAlert(alertId: string): Promise<boolean> {
    return this.alerts.delete(alertId);
  }
  
  async getAlert(alertId: string): Promise<MarketAlertConfig | null> {
    return this.alerts.get(alertId) || null;
  }
  
  async listAlerts(userId: string): Promise<MarketAlertConfig[]> {
    return Array.from(this.alerts.values()).filter(alert => alert.userId === userId);
  }
  
  async enableAlert(alertId: string): Promise<MarketAlertConfig> {
    return this.updateAlert(alertId, { enabled: true });
  }
  
  async disableAlert(alertId: string): Promise<MarketAlertConfig> {
    return this.updateAlert(alertId, { enabled: false });
  }
  
  async processDataPoint(dataPoint: MarketDataPoint): Promise<MarketAlert[]> {
    return []; // No alerts triggered
  }
}

// Test suite
describe('MarketDataService', () => {
  let marketDataService: MarketDataService;
  let mockStorage: MockMarketDataStorage;
  let mockAlertService: MockMarketAlertService;
  let mockProvider: MockMarketDataProvider;
  
  beforeEach(async () => {
    // Set up test environment
    mockStorage = new MockMarketDataStorage();
    mockAlertService = new MockMarketAlertService();
    mockProvider = new MockMarketDataProvider();
    
    marketDataService = new MarketDataService(mockStorage, mockAlertService);
    
    // Initialize service
    const storageConfig: MarketDataStorageConfig = {
      storageType: 'memory',
      retentionPeriod: {
        highResolution: 7,
        lowResolution: 30
      },
      aggregationIntervals: ['1min', '1hour', 'daily'],
      compressionEnabled: false
    };
    
    await marketDataService.initialize(storageConfig);
    
    // Register provider
    marketDataService.registerProvider('mock-provider', mockProvider, true);
  });
  
  test('should connect to market data feed', async () => {
    const feedConfig: MarketDataFeedConfig = {
      provider: 'mock-provider',
      apiKey: 'test-api-key',
      dataTypes: ['price', 'volume'],
      symbols: ['AAPL', 'MSFT'],
      interval: 'daily'
    };
    
    const status = await marketDataService.connectToFeed(feedConfig);
    
    expect(status.connected).toBe(true);
    expect(status.provider).toBe('mock-provider');
    expect(status.activeSymbols).toBe(2);
    expect(status.activeDataTypes).toEqual(['price', 'volume']);
  });
  
  test('should create and retrieve market alerts', async () => {
    const alertConfig: Omit<MarketAlertConfig, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'Test Alert',
      symbol: 'AAPL',
      dataType: 'price',
      condition: 'greater-than',
      threshold: 150,
      enabled: true,
      userId: 'test-user',
      notificationChannels: [
        {
          type: 'email',
          destination: 'test@example.com',
          enabled: true
        }
      ]
    };
    
    const createdAlert = await marketDataService.createAlert(alertConfig);
    
    expect(createdAlert.id).toBeDefined();
    expect(createdAlert.name).toBe('Test Alert');
    expect(createdAlert.symbol).toBe('AAPL');
    
    const retrievedAlert = await marketDataService.getAlert(createdAlert.id);
    
    expect(retrievedAlert).not.toBeNull();
    expect(retrievedAlert?.id).toBe(createdAlert.id);
    expect(retrievedAlert?.name).toBe('Test Alert');
  });
  
  // Add more tests as needed
});