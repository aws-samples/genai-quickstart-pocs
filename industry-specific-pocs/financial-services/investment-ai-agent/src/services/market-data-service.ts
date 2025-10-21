/**
 * Service for handling real-time market data integration
 */

import { v4 as uuidv4 } from 'uuid';
import {
  MarketDataFeedConfig,
  MarketDataPoint,
  MarketDataType,
  MarketDataInterval,
  MarketDataFeedStatus,
  MarketDataQuery,
  MarketDataQueryResult,
  MarketDataStorageConfig,
  MarketDataNormalizationOptions,
  MarketDataNormalizationResult,
  MarketAlertConfig,
  MarketAlert,
  PriceData,
  OrderBookData,
  TechnicalIndicatorData,
  NewsSentimentData,
  EconomicIndicatorData,
  VolatilityData,
  AlertCondition
} from '../models/market-data';
import { ValidationError } from '../utils/validation';

/**
 * Market data provider interface
 */
export interface MarketDataProvider {
  connect(config: MarketDataFeedConfig): Promise<MarketDataFeedStatus>;
  disconnect(): Promise<void>;
  getStatus(): MarketDataFeedStatus;
  subscribeToData(symbols: string[], dataTypes: MarketDataType[], interval: MarketDataInterval): Promise<void>;
  unsubscribeFromData(symbols: string[], dataTypes: MarketDataType[]): Promise<void>;
  getHistoricalData(query: MarketDataQuery): Promise<MarketDataPoint[]>;
}

/**
 * Storage statistics
 */
export interface StorageStats {
  totalDataPoints: number;
  oldestDataPoint: Date;
  newestDataPoint: Date;
  dataPointsByType: Record<MarketDataType, number>;
  storageSize: number; // in bytes
  compressionRatio?: number;
}

/**
 * Market data storage interface
 */
export interface MarketDataStorage {
  initialize(config: MarketDataStorageConfig): Promise<void>;
  storeDataPoint(dataPoint: MarketDataPoint): Promise<void>;
  storeDataPoints(dataPoints: MarketDataPoint[]): Promise<void>;
  queryData(query: MarketDataQuery): Promise<MarketDataQueryResult>;
  deleteData(query: MarketDataQuery): Promise<number>;
  getStorageStats(): Promise<StorageStats>;
}

/**
 * Market data alert service interface
 */
export interface MarketDataAlertService {
  createAlert(alertConfig: Omit<MarketAlertConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<MarketAlertConfig>;
  updateAlert(alertId: string, updates: Partial<MarketAlertConfig>): Promise<MarketAlertConfig>;
  deleteAlert(alertId: string): Promise<boolean>;
  getAlert(alertId: string): Promise<MarketAlertConfig | null>;
  listAlerts(userId: string): Promise<MarketAlertConfig[]>;
  enableAlert(alertId: string): Promise<MarketAlertConfig>;
  disableAlert(alertId: string): Promise<MarketAlertConfig>;
  processDataPoint(dataPoint: MarketDataPoint): Promise<MarketAlert[]>;
}/**
 * Dat
a listener interface
 */
interface DataListener {
  id: string;
  providerName: string;
  symbols: string[];
  dataTypes: MarketDataType[];
  interval: MarketDataInterval;
  callback: (dataPoint: MarketDataPoint) => Promise<void>;
}

/**
 * Market data service for handling real-time market data integration
 */
export class MarketDataService {
  private providers: Map<string, MarketDataProvider>;
  private storage: MarketDataStorage;
  private alertService: MarketDataAlertService;
  private dataListeners: Map<string, DataListener[]>;
  private isInitialized: boolean;
  private defaultProvider: string;

  /**
   * Constructor
   * @param storage Market data storage implementation
   * @param alertService Market data alert service implementation
   */
  constructor(storage: MarketDataStorage, alertService: MarketDataAlertService) {
    this.providers = new Map();
    this.storage = storage;
    this.alertService = alertService;
    this.dataListeners = new Map();
    this.isInitialized = false;
    this.defaultProvider = '';
  }

  /**
   * Initialize the market data service
   * @param storageConfig Storage configuration
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(storageConfig: MarketDataStorageConfig): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.storage.initialize(storageConfig);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize market data service:', error);
      throw new Error(`Market data service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }  /**

   * Register a market data provider
   * @param name Provider name
   * @param provider Provider implementation
   * @param isDefault Whether this is the default provider
   */
  registerProvider(name: string, provider: MarketDataProvider, isDefault = false): void {
    this.providers.set(name, provider);
    if (isDefault || this.providers.size === 1) {
      this.defaultProvider = name;
    }
  }

  /**
   * Connect to a market data feed
   * @param config Market data feed configuration
   * @returns Connection status
   */
  async connectToFeed(config: MarketDataFeedConfig): Promise<MarketDataFeedStatus> {
    this.ensureInitialized();
    
    const provider = this.getProvider(config.provider);
    
    try {
      const status = await provider.connect(config);
      
      if (status.connected) {
        // Set up data listener for this provider
        this.setupDataListener(config.provider, config.symbols, config.dataTypes, config.interval);
      }
      
      return status;
    } catch (error) {
      console.error(`Failed to connect to market data feed (${config.provider}):`, error);
      throw new Error(`Market data feed connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Disconnect from a market data feed
   * @param providerName Provider name
   */
  async disconnectFromFeed(providerName: string): Promise<void> {
    this.ensureInitialized();
    
    const provider = this.getProvider(providerName);
    
    try {
      await provider.disconnect();
      
      // Remove data listeners for this provider
      this.dataListeners.delete(providerName);
    } catch (error) {
      console.error(`Failed to disconnect from market data feed (${providerName}):`, error);
      throw new Error(`Market data feed disconnection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }  /**

   * Get market data feed status
   * @param providerName Provider name
   * @returns Market data feed status
   */
  getFeedStatus(providerName?: string): MarketDataFeedStatus {
    this.ensureInitialized();
    
    const provider = this.getProvider(providerName);
    return provider.getStatus();
  }

  /**
   * Subscribe to market data
   * @param symbols List of symbols to subscribe to
   * @param dataTypes List of data types to subscribe to
   * @param interval Data interval
   * @param providerName Provider name (optional, uses default if not provided)
   */
  async subscribeToData(
    symbols: string[],
    dataTypes: MarketDataType[],
    interval: MarketDataInterval,
    providerName?: string
  ): Promise<void> {
    this.ensureInitialized();
    
    const provider = this.getProvider(providerName);
    
    try {
      await provider.subscribeToData(symbols, dataTypes, interval);
    } catch (error) {
      console.error(`Failed to subscribe to market data (${providerName || this.defaultProvider}):`, error);
      throw new Error(`Market data subscription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Unsubscribe from market data
   * @param symbols List of symbols to unsubscribe from
   * @param dataTypes List of data types to unsubscribe from
   * @param providerName Provider name (optional, uses default if not provided)
   */
  async unsubscribeFromData(
    symbols: string[],
    dataTypes: MarketDataType[],
    providerName?: string
  ): Promise<void> {
    this.ensureInitialized();
    
    const provider = this.getProvider(providerName);
    
    try {
      await provider.unsubscribeFromData(symbols, dataTypes);
    } catch (error) {
      console.error(`Failed to unsubscribe from market data (${providerName || this.defaultProvider}):`, error);
      throw new Error(`Market data unsubscription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }  /**

   * Query historical market data
   * @param query Market data query
   * @param providerName Provider name (optional, uses default if not provided)
   * @returns Market data query result
   */
  async queryData(query: MarketDataQuery, providerName?: string): Promise<MarketDataQueryResult> {
    this.ensureInitialized();
    
    try {
      // First try to get data from storage
      const storageResult = await this.storage.queryData(query);
      
      // If we have enough data from storage, return it
      if (storageResult.data.length > 0 && 
          (query.limit === undefined || storageResult.data.length >= query.limit)) {
        return storageResult;
      }
      
      // Otherwise, fetch from provider
      const provider = this.getProvider(providerName);
      const providerData = await provider.getHistoricalData(query);
      
      // Store the data we got from the provider
      if (providerData.length > 0) {
        await this.storage.storeDataPoints(providerData);
      }
      
      // Combine with any data we got from storage (avoiding duplicates)
      const existingIds = new Set(storageResult.data.map(d => d.id));
      const newData = providerData.filter(d => !existingIds.has(d.id));
      const combinedData = [...storageResult.data, ...newData];
      
      // Sort by timestamp (newest first)
      combinedData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      // Apply limit if specified
      const limitedData = query.limit !== undefined 
        ? combinedData.slice(0, query.limit) 
        : combinedData;
      
      return {
        data: limitedData,
        metadata: {
          query,
          count: limitedData.length,
          executionTime: storageResult.metadata.executionTime,
          nextToken: undefined // Not implementing pagination in this version
        }
      };
    } catch (error) {
      console.error(`Failed to query market data:`, error);
      throw new Error(`Market data query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }  
/**
   * Normalize market data
   * @param data Market data points to normalize
   * @param options Normalization options
   * @returns Normalized market data
   */
  normalizeData(data: MarketDataPoint[], options: MarketDataNormalizationOptions): MarketDataNormalizationResult {
    const transformations: string[] = [];
    const warnings: string[] = [];
    let normalizedData = [...data]; // Create a copy to avoid modifying the original
    
    try {
      // Handle adjustments for splits and dividends
      if (options.adjustForSplits || options.adjustForDividends) {
        normalizedData = this.adjustForCorporateActions(normalizedData, options, transformations);
      }
      
      // Fill gaps in time series data
      if (options.fillGaps && options.fillMethod) {
        normalizedData = this.fillDataGaps(normalizedData, options.fillMethod, transformations, warnings);
      }
      
      // Convert currency if needed
      if (options.convertCurrency && options.currency) {
        normalizedData = this.convertCurrency(normalizedData, options.currency, transformations, warnings);
      }
      
      // Adjust timezone if needed
      normalizedData = this.adjustTimezone(normalizedData, options.timezone, transformations);
      
      return {
        originalData: data,
        normalizedData,
        transformations,
        warnings
      };
    } catch (error) {
      console.error('Error normalizing market data:', error);
      warnings.push(`Normalization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        originalData: data,
        normalizedData: data, // Return original data on error
        transformations,
        warnings
      };
    }
  }  /**
   
* Create a market alert
   * @param alertConfig Alert configuration
   * @returns Created alert configuration
   */
  async createAlert(alertConfig: Omit<MarketAlertConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<MarketAlertConfig> {
    this.ensureInitialized();
    
    try {
      return await this.alertService.createAlert(alertConfig);
    } catch (error) {
      console.error('Failed to create market alert:', error);
      throw new Error(`Market alert creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a market alert
   * @param alertId Alert ID
   * @param updates Alert updates
   * @returns Updated alert configuration
   */
  async updateAlert(alertId: string, updates: Partial<MarketAlertConfig>): Promise<MarketAlertConfig> {
    this.ensureInitialized();
    
    try {
      return await this.alertService.updateAlert(alertId, updates);
    } catch (error) {
      console.error(`Failed to update market alert (${alertId}):`, error);
      throw new Error(`Market alert update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a market alert
   * @param alertId Alert ID
   * @returns True if deletion was successful
   */
  async deleteAlert(alertId: string): Promise<boolean> {
    this.ensureInitialized();
    
    try {
      return await this.alertService.deleteAlert(alertId);
    } catch (error) {
      console.error(`Failed to delete market alert (${alertId}):`, error);
      throw new Error(`Market alert deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }  /*
*
   * Get a market alert
   * @param alertId Alert ID
   * @returns Alert configuration or null if not found
   */
  async getAlert(alertId: string): Promise<MarketAlertConfig | null> {
    this.ensureInitialized();
    
    try {
      return await this.alertService.getAlert(alertId);
    } catch (error) {
      console.error(`Failed to get market alert (${alertId}):`, error);
      throw new Error(`Market alert retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List market alerts for a user
   * @param userId User ID
   * @returns List of alert configurations
   */
  async listAlerts(userId: string): Promise<MarketAlertConfig[]> {
    this.ensureInitialized();
    
    try {
      return await this.alertService.listAlerts(userId);
    } catch (error) {
      console.error(`Failed to list market alerts for user (${userId}):`, error);
      throw new Error(`Market alert listing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enable a market alert
   * @param alertId Alert ID
   * @returns Updated alert configuration
   */
  async enableAlert(alertId: string): Promise<MarketAlertConfig> {
    this.ensureInitialized();
    
    try {
      return await this.alertService.enableAlert(alertId);
    } catch (error) {
      console.error(`Failed to enable market alert (${alertId}):`, error);
      throw new Error(`Market alert enabling failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Disable a market alert
   * @param alertId Alert ID
   * @returns Updated alert configuration
   */
  async disableAlert(alertId: string): Promise<MarketAlertConfig> {
    this.ensureInitialized();
    
    try {
      return await this.alertService.disableAlert(alertId);
    } catch (error) {
      console.error(`Failed to disable market alert (${alertId}):`, error);
      throw new Error(`Market alert disabling failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }  
  
  // Private helper methods

  /**
   * Ensure the service is initialized
   * @throws Error if the service is not initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Market data service is not initialized');
    }
  }

  /**
   * Get a provider by name
   * @param providerName Provider name (optional, uses default if not provided)
   * @returns Provider implementation
   * @throws Error if provider is not found
   */
  private getProvider(providerName?: string): MarketDataProvider {
    const name = providerName || this.defaultProvider;
    
    if (!name) {
      throw new Error('No market data provider specified and no default provider is set');
    }
    
    const provider = this.providers.get(name);
    
    if (!provider) {
      throw new Error(`Market data provider not found: ${name}`);
    }
    
    return provider;
  }

  /**
   * Set up a data listener for a provider
   * @param providerName Provider name
   * @param symbols Symbols to listen for
   * @param dataTypes Data types to listen for
   * @param interval Data interval
   */
  private setupDataListener(
    providerName: string,
    symbols: string[],
    dataTypes: MarketDataType[],
    interval: MarketDataInterval
  ): void {
    // Create a unique listener ID
    const listenerId = `${providerName}-${symbols.join(',')}-${dataTypes.join(',')}-${interval}`;
    
    // Check if we already have a listener for this configuration
    if (this.dataListeners.has(providerName)) {
      const listeners = this.dataListeners.get(providerName) || [];
      if (listeners.some(l => l.id === listenerId)) {
        return; // Listener already exists
      }
    }
    
    // Create a new listener
    const listener: DataListener = {
      id: listenerId,
      providerName,
      symbols,
      dataTypes,
      interval,
      callback: async (dataPoint: MarketDataPoint) => {
        try {
          // Store the data point
          await this.storage.storeDataPoint(dataPoint);
          
          // Process alerts
          const triggeredAlerts = await this.alertService.processDataPoint(dataPoint);
          
          // Handle triggered alerts (e.g., send notifications)
          if (triggeredAlerts.length > 0) {
            this.handleTriggeredAlerts(triggeredAlerts);
          }
        } catch (error) {
          console.error('Error processing market data point:', error);
        }
      }
    };
    
    // Add the listener to our map
    const listeners = this.dataListeners.get(providerName) || [];
    listeners.push(listener);
    this.dataListeners.set(providerName, listeners);
    
    // Register the listener with the provider (implementation would depend on the provider)
    // This is a mock implementation
    console.log(`Registered data listener for provider ${providerName}`);
  } 
 /**
   * Handle triggered market alerts
   * @param alerts Triggered alerts
   */
  private handleTriggeredAlerts(alerts: MarketAlert[]): void {
    // In a real implementation, this would send notifications via the configured channels
    // For now, we'll just log the alerts
    for (const alert of alerts) {
      console.log(`MARKET ALERT [${alert.severity}]: ${alert.message}`);
    }
  }

  /**
   * Adjust market data for corporate actions (splits and dividends)
   * @param data Market data points
   * @param options Normalization options
   * @param transformations Array to track transformations
   * @returns Adjusted market data points
   */
  private adjustForCorporateActions(
    data: MarketDataPoint[],
    options: MarketDataNormalizationOptions,
    transformations: string[]
  ): MarketDataPoint[] {
    // Group data by symbol
    const dataBySymbol = this.groupBySymbol(data);
    const result: MarketDataPoint[] = [];
    
    // Process each symbol separately
    for (const [symbol, symbolData] of Object.entries(dataBySymbol)) {
      // Sort by timestamp (oldest first)
      symbolData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      // Apply adjustments
      const adjustedData = symbolData.map(dataPoint => {
        // Clone the data point to avoid modifying the original
        const adjustedPoint = { ...dataPoint, value: { ...dataPoint.value } };
        
        // Only adjust price data
        if (dataPoint.dataType === 'price' && typeof dataPoint.value === 'object') {
          const priceData = dataPoint.value as PriceData;
          
          // In a real implementation, we would look up split and dividend information
          // and apply the appropriate adjustments
          
          // For now, we'll just add a mock adjustment flag to the metadata
          adjustedPoint.metadata = {
            ...adjustedPoint.metadata,
            adjusted: true,
            adjustedForSplits: options.adjustForSplits,
            adjustedForDividends: options.adjustForDividends
          };
        }
        
        return adjustedPoint;
      });
      
      result.push(...adjustedData);
      
      if (options.adjustForSplits) {
        transformations.push(`Adjusted ${symbol} data for stock splits`);
      }
      
      if (options.adjustForDividends) {
        transformations.push(`Adjusted ${symbol} data for dividends`);
      }
    }
    
    return result;
  }  
/**
   * Fill gaps in time series data
   * @param data Market data points
   * @param fillMethod Method to use for filling gaps
   * @param transformations Array to track transformations
   * @param warnings Array to track warnings
   * @returns Data with gaps filled
   */
  private fillDataGaps(
    data: MarketDataPoint[],
    fillMethod: 'previous' | 'linear' | 'zero',
    transformations: string[],
    warnings: string[]
  ): MarketDataPoint[] {
    // Group data by symbol and data type
    const dataBySymbolAndType: Record<string, MarketDataPoint[]> = {};
    
    for (const point of data) {
      const key = `${point.symbol}-${point.dataType}-${point.interval}`;
      if (!dataBySymbolAndType[key]) {
        dataBySymbolAndType[key] = [];
      }
      dataBySymbolAndType[key].push(point);
    }
    
    const result: MarketDataPoint[] = [];
    
    // Process each group separately
    for (const [key, groupData] of Object.entries(dataBySymbolAndType)) {
      // Sort by timestamp (oldest first)
      groupData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      // Check for gaps
      const filledData = [...groupData];
      let gapsFilled = 0;
      
      for (let i = 1; i < groupData.length; i++) {
        const current = groupData[i];
        const previous = groupData[i - 1];
        const expectedGap = this.getExpectedTimestampGap(current.interval);
        const actualGap = current.timestamp.getTime() - previous.timestamp.getTime();
        
        // If the gap is larger than expected, fill it
        if (actualGap > expectedGap * 1.5) {
          const missingPoints = Math.floor(actualGap / expectedGap) - 1;
          
          if (missingPoints > 0) {
            const newPoints = this.generateFilledDataPoints(
              previous,
              current,
              missingPoints,
              fillMethod
            );
            
            filledData.splice(i, 0, ...newPoints);
            i += newPoints.length;
            gapsFilled += newPoints.length;
          }
        }
      }
      
      result.push(...filledData);
      
      if (gapsFilled > 0) {
        const [symbol, dataType, interval] = key.split('-');
        transformations.push(`Filled ${gapsFilled} gaps in ${symbol} ${dataType} data (${interval}) using ${fillMethod} method`);
      }
    }
    
    return result;
  }  
  
  /**
   * Convert market data to a different currency
   * @param data Market data points
   * @param targetCurrency Target currency code
   * @param transformations Array to track transformations
   * @param warnings Array to track warnings
   * @returns Data with currency converted
   */
  private convertCurrency(
    data: MarketDataPoint[],
    targetCurrency: string,
    transformations: string[],
    warnings: string[]
  ): MarketDataPoint[] {
    // In a real implementation, this would use exchange rate data to convert prices
    // For now, we'll just add a mock conversion flag to the metadata
    
    const result = data.map(dataPoint => {
      // Clone the data point to avoid modifying the original
      const convertedPoint = { ...dataPoint };
      
      // Only convert price data
      if (dataPoint.dataType === 'price') {
        // Add conversion metadata
        convertedPoint.metadata = {
          ...convertedPoint.metadata,
          currencyConverted: true,
          originalCurrency: 'USD', // Assuming original is USD
          targetCurrency
        };
      }
      
      return convertedPoint;
    });
    
    transformations.push(`Converted price data to ${targetCurrency}`);
    warnings.push('Currency conversion is simulated and not using real exchange rates');
    
    return result;
  }

  /**
   * Adjust market data timestamps to a different timezone
   * @param data Market data points
   * @param timezone Target timezone
   * @param transformations Array to track transformations
   * @returns Data with adjusted timestamps
   */
  private adjustTimezone(
    data: MarketDataPoint[],
    timezone: string,
    transformations: string[]
  ): MarketDataPoint[] {
    // In a real implementation, this would use a proper timezone library
    // For now, we'll just add a mock timezone flag to the metadata
    
    const result = data.map(dataPoint => {
      // Clone the data point to avoid modifying the original
      const adjustedPoint = { ...dataPoint };
      
      // Add timezone metadata
      adjustedPoint.metadata = {
        ...adjustedPoint.metadata,
        timezoneAdjusted: true,
        originalTimezone: 'UTC', // Assuming original is UTC
        targetTimezone: timezone
      };
      
      return adjustedPoint;
    });
    
    transformations.push(`Adjusted timestamps to ${timezone} timezone`);
    
    return result;
  }  
  
  /**
   * Group market data points by symbol
   * @param data Market data points
   * @returns Data grouped by symbol
   */
  private groupBySymbol(data: MarketDataPoint[]): Record<string, MarketDataPoint[]> {
    const result: Record<string, MarketDataPoint[]> = {};
    
    for (const point of data) {
      if (!result[point.symbol]) {
        result[point.symbol] = [];
      }
      result[point.symbol].push(point);
    }
    
    return result;
  }

  /**
   * Get the expected time gap between data points based on interval
   * @param interval Data interval
   * @returns Expected gap in milliseconds
   */
  private getExpectedTimestampGap(interval: MarketDataInterval): number {
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    
    switch (interval) {
      case 'tick': return 1000; // Assume 1 second for ticks
      case '1min': return minute;
      case '5min': return 5 * minute;
      case '15min': return 15 * minute;
      case '30min': return 30 * minute;
      case '1hour': return hour;
      case '4hour': return 4 * hour;
      case 'daily': return day;
      case 'weekly': return week;
      case 'monthly': return 30 * day; // Approximate
      default: return day;
    }
  }

  /**
   * Generate filled data points between two existing points
   * @param start Start data point
   * @param end End data point
   * @param count Number of points to generate
   * @param fillMethod Method to use for filling
   * @returns Generated data points
   */
  private generateFilledDataPoints(
    start: MarketDataPoint,
    end: MarketDataPoint,
    count: number,
    fillMethod: 'previous' | 'linear' | 'zero'
  ): MarketDataPoint[] {
    const result: MarketDataPoint[] = [];
    const startTime = start.timestamp.getTime();
    const endTime = end.timestamp.getTime();
    const timeStep = (endTime - startTime) / (count + 1);
    
    for (let i = 1; i <= count; i++) {
      const timestamp = new Date(startTime + i * timeStep);
      let value: any;
      
      // Generate value based on fill method
      if (fillMethod === 'previous') {
        value = this.cloneValue(start.value);
      } else if (fillMethod === 'zero') {
        value = this.generateZeroValue(start.dataType);
      } else if (fillMethod === 'linear') {
        value = this.interpolateValue(start.value, end.value, i / (count + 1), start.dataType);
      }
      
      result.push({
        id: uuidv4(),
        symbol: start.symbol,
        dataType: start.dataType,
        timestamp,
        value,
        source: start.source,
        interval: start.interval,
        metadata: {
          ...start.metadata,
          filled: true,
          fillMethod
        }
      });
    }
    
    return result;
  }  /**

   * Clone a value (deep copy)
   * @param value Value to clone
   * @returns Cloned value
   */
  private cloneValue(value: any): any {
    if (typeof value !== 'object' || value === null) {
      return value;
    }
    return JSON.parse(JSON.stringify(value));
  }

  /**
   * Generate a zero value for a data type
   * @param dataType Data type
   * @returns Zero value
   */
  private generateZeroValue(dataType: MarketDataType): any {
    switch (dataType) {
      case 'price':
        return { open: 0, high: 0, low: 0, close: 0, volume: 0 };
      case 'volume':
        return 0;
      case 'order-book':
        return { bids: [], asks: [], spread: 0, depth: 0 };
      case 'technical-indicators':
        return { indicator: 'unknown', value: 0, parameters: {} };
      default:
        return 0;
    }
  }

  /**
   * Interpolate between two values
   * @param start Start value
   * @param end End value
   * @param ratio Interpolation ratio (0-1)
   * @param dataType Data type
   * @returns Interpolated value
   */
  private interpolateValue(start: any, end: any, ratio: number, dataType: MarketDataType): any {
    if (typeof start === 'number' && typeof end === 'number') {
      return start + (end - start) * ratio;
    }
    
    if (dataType === 'price' && typeof start === 'object' && typeof end === 'object') {
      const startPrice = start as PriceData;
      const endPrice = end as PriceData;
      
      return {
        open: startPrice.open + (endPrice.open - startPrice.open) * ratio,
        high: startPrice.high + (endPrice.high - startPrice.high) * ratio,
        low: startPrice.low + (endPrice.low - startPrice.low) * ratio,
        close: startPrice.close + (endPrice.close - startPrice.close) * ratio,
        volume: Math.round(startPrice.volume + (endPrice.volume - startPrice.volume) * ratio),
        adjustedClose: startPrice.adjustedClose !== undefined && endPrice.adjustedClose !== undefined
          ? startPrice.adjustedClose + (endPrice.adjustedClose - startPrice.adjustedClose) * ratio
          : undefined
      };
    }
    
    // For complex objects, just use the start value
    return this.cloneValue(start);
  }
}