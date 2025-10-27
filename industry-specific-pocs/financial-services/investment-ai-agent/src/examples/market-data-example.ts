/**
 * Example usage of the market data integration module
 */

import { v4 as uuidv4 } from 'uuid';
import {
  MarketDataService,
  AlphaVantageProvider,
  TimestreamStorage,
  MarketAlertService
} from '../services';
import {
  MarketDataFeedConfig,
  MarketDataStorageConfig,
  MarketDataQuery,
  MarketAlertConfig,
  NotificationChannel
} from '../models/market-data';
import { validateMarketDataFeedConfig } from '../utils/validation';

/**
 * Run the market data example
 */
async function runMarketDataExample() {
  console.log('Starting market data integration example...');
  
  try {
    // Initialize components
    const alertService = new MarketAlertService();
    const storage = new TimestreamStorage();
    const marketDataService = new MarketDataService(storage, alertService);
    
    // Initialize storage
    const storageConfig: MarketDataStorageConfig = {
      storageType: 'timestream',
      retentionPeriod: {
        highResolution: 7, // 7 days
        lowResolution: 365 // 1 year
      },
      aggregationIntervals: ['1min', '1hour', 'daily'],
      compressionEnabled: true
    };
    
    await marketDataService.initialize(storageConfig);
    console.log('Market data service initialized');
    
    // Register provider
    const alphaVantageProvider = new AlphaVantageProvider();
    marketDataService.registerProvider('alpha-vantage', alphaVantageProvider, true);
    console.log('Alpha Vantage provider registered');
     
   // Connect to market data feed
    const feedConfig: MarketDataFeedConfig = {
      provider: 'alpha-vantage',
      apiKey: 'demo', // Replace with actual API key
      dataTypes: ['price', 'volume', 'technical-indicators'],
      symbols: ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META'],
      interval: '15min',
      maxHistoricalDays: 30,
      refreshInterval: 60000 // 1 minute
    };
    
    // Validate feed configuration
    const validationResult = validateMarketDataFeedConfig(feedConfig);
    if (!validationResult.valid) {
      console.error('Invalid feed configuration:', validationResult.errors);
      return;
    }
    
    const connectionStatus = await marketDataService.connectToFeed(feedConfig);
    console.log('Connection status:', connectionStatus);
    
    // Create market alert
    const emailChannel: NotificationChannel = {
      type: 'email',
      destination: 'user@example.com',
      enabled: true
    };
    
    const smsChannel: NotificationChannel = {
      type: 'sms',
      destination: '+1234567890',
      enabled: false
    };
    
    const alertConfig: Omit<MarketAlertConfig, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'AAPL Price Alert',
      description: 'Alert when AAPL price changes significantly',
      symbol: 'AAPL',
      dataType: 'price',
      condition: 'percent-change-up',
      threshold: 5, // 5% change
      comparisonValue: 'previous',
      enabled: true,
      cooldownPeriod: 3600000, // 1 hour
      userId: 'user123',
      notificationChannels: [emailChannel, smsChannel]
    };
    
    const createdAlert = await marketDataService.createAlert(alertConfig);
    console.log('Created alert:', createdAlert);
      
  // Query historical data
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const query: MarketDataQuery = {
      symbols: ['AAPL', 'MSFT'],
      dataTypes: ['price'],
      timeRange: {
        start: oneMonthAgo,
        end: now
      },
      interval: 'daily',
      aggregation: 'ohlc',
      limit: 10
    };
    
    const queryResult = await marketDataService.queryData(query);
    console.log(`Query returned ${queryResult.data.length} data points`);
    console.log('First data point:', queryResult.data[0]);
    
    // Normalize data
    const normalizedResult = marketDataService.normalizeData(queryResult.data, {
      adjustForSplits: true,
      adjustForDividends: true,
      fillGaps: true,
      fillMethod: 'linear',
      timezone: 'America/New_York',
      convertCurrency: false
    });
    
    console.log(`Normalized ${normalizedResult.normalizedData.length} data points`);
    console.log('Transformations:', normalizedResult.transformations);
    
    // Disconnect from feed
    await marketDataService.disconnectFromFeed('alpha-vantage');
    console.log('Disconnected from Alpha Vantage');
    
    console.log('Market data integration example completed successfully');
  } catch (error) {
    console.error('Error in market data example:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  runMarketDataExample().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { runMarketDataExample };