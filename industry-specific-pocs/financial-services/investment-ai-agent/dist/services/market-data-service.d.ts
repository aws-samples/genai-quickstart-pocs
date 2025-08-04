/**
 * Service for handling real-time market data integration
 */
import { MarketDataFeedConfig, MarketDataPoint, MarketDataType, MarketDataInterval, MarketDataFeedStatus, MarketDataQuery, MarketDataQueryResult, MarketDataStorageConfig, MarketDataNormalizationOptions, MarketDataNormalizationResult, MarketAlertConfig, MarketAlert } from '../models/market-data';
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
    storageSize: number;
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
} /**
 * Dat
a listener interface
 */
/**
 * Market data service for handling real-time market data integration
 */
export declare class MarketDataService {
    private providers;
    private storage;
    private alertService;
    private dataListeners;
    private isInitialized;
    private defaultProvider;
    /**
     * Constructor
     * @param storage Market data storage implementation
     * @param alertService Market data alert service implementation
     */
    constructor(storage: MarketDataStorage, alertService: MarketDataAlertService);
    /**
     * Initialize the market data service
     * @param storageConfig Storage configuration
     * @returns Promise that resolves when initialization is complete
     */
    initialize(storageConfig: MarketDataStorageConfig): Promise<void>; /**
  
     * Register a market data provider
     * @param name Provider name
     * @param provider Provider implementation
     * @param isDefault Whether this is the default provider
     */
    registerProvider(name: string, provider: MarketDataProvider, isDefault?: boolean): void;
    /**
     * Connect to a market data feed
     * @param config Market data feed configuration
     * @returns Connection status
     */
    connectToFeed(config: MarketDataFeedConfig): Promise<MarketDataFeedStatus>;
    /**
     * Disconnect from a market data feed
     * @param providerName Provider name
     */
    disconnectFromFeed(providerName: string): Promise<void>; /**
  
     * Get market data feed status
     * @param providerName Provider name
     * @returns Market data feed status
     */
    getFeedStatus(providerName?: string): MarketDataFeedStatus;
    /**
     * Subscribe to market data
     * @param symbols List of symbols to subscribe to
     * @param dataTypes List of data types to subscribe to
     * @param interval Data interval
     * @param providerName Provider name (optional, uses default if not provided)
     */
    subscribeToData(symbols: string[], dataTypes: MarketDataType[], interval: MarketDataInterval, providerName?: string): Promise<void>;
    /**
     * Unsubscribe from market data
     * @param symbols List of symbols to unsubscribe from
     * @param dataTypes List of data types to unsubscribe from
     * @param providerName Provider name (optional, uses default if not provided)
     */
    unsubscribeFromData(symbols: string[], dataTypes: MarketDataType[], providerName?: string): Promise<void>; /**
  
     * Query historical market data
     * @param query Market data query
     * @param providerName Provider name (optional, uses default if not provided)
     * @returns Market data query result
     */
    queryData(query: MarketDataQuery, providerName?: string): Promise<MarketDataQueryResult>;
    /**
       * Normalize market data
       * @param data Market data points to normalize
       * @param options Normalization options
       * @returns Normalized market data
       */
    normalizeData(data: MarketDataPoint[], options: MarketDataNormalizationOptions): MarketDataNormalizationResult; /**
     
  * Create a market alert
     * @param alertConfig Alert configuration
     * @returns Created alert configuration
     */
    createAlert(alertConfig: Omit<MarketAlertConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<MarketAlertConfig>;
    /**
     * Update a market alert
     * @param alertId Alert ID
     * @param updates Alert updates
     * @returns Updated alert configuration
     */
    updateAlert(alertId: string, updates: Partial<MarketAlertConfig>): Promise<MarketAlertConfig>;
    /**
     * Delete a market alert
     * @param alertId Alert ID
     * @returns True if deletion was successful
     */
    deleteAlert(alertId: string): Promise<boolean>;
    getAlert(alertId: string): Promise<MarketAlertConfig | null>;
    /**
     * List market alerts for a user
     * @param userId User ID
     * @returns List of alert configurations
     */
    listAlerts(userId: string): Promise<MarketAlertConfig[]>;
    /**
     * Enable a market alert
     * @param alertId Alert ID
     * @returns Updated alert configuration
     */
    enableAlert(alertId: string): Promise<MarketAlertConfig>;
    /**
     * Disable a market alert
     * @param alertId Alert ID
     * @returns Updated alert configuration
     */
    disableAlert(alertId: string): Promise<MarketAlertConfig>;
    /**
     * Ensure the service is initialized
     * @throws Error if the service is not initialized
     */
    private ensureInitialized;
    /**
     * Get a provider by name
     * @param providerName Provider name (optional, uses default if not provided)
     * @returns Provider implementation
     * @throws Error if provider is not found
     */
    private getProvider;
    /**
     * Set up a data listener for a provider
     * @param providerName Provider name
     * @param symbols Symbols to listen for
     * @param dataTypes Data types to listen for
     * @param interval Data interval
     */
    private setupDataListener;
    /**
      * Handle triggered market alerts
      * @param alerts Triggered alerts
      */
    private handleTriggeredAlerts;
    /**
     * Adjust market data for corporate actions (splits and dividends)
     * @param data Market data points
     * @param options Normalization options
     * @param transformations Array to track transformations
     * @returns Adjusted market data points
     */
    private adjustForCorporateActions;
    /**
       * Fill gaps in time series data
       * @param data Market data points
       * @param fillMethod Method to use for filling gaps
       * @param transformations Array to track transformations
       * @param warnings Array to track warnings
       * @returns Data with gaps filled
       */
    private fillDataGaps;
    /**
     * Convert market data to a different currency
     * @param data Market data points
     * @param targetCurrency Target currency code
     * @param transformations Array to track transformations
     * @param warnings Array to track warnings
     * @returns Data with currency converted
     */
    private convertCurrency;
    /**
     * Adjust market data timestamps to a different timezone
     * @param data Market data points
     * @param timezone Target timezone
     * @param transformations Array to track transformations
     * @returns Data with adjusted timestamps
     */
    private adjustTimezone;
    /**
     * Group market data points by symbol
     * @param data Market data points
     * @returns Data grouped by symbol
     */
    private groupBySymbol;
    /**
     * Get the expected time gap between data points based on interval
     * @param interval Data interval
     * @returns Expected gap in milliseconds
     */
    private getExpectedTimestampGap;
    /**
     * Generate filled data points between two existing points
     * @param start Start data point
     * @param end End data point
     * @param count Number of points to generate
     * @param fillMethod Method to use for filling
     * @returns Generated data points
     */
    private generateFilledDataPoints; /**
  
     * Clone a value (deep copy)
     * @param value Value to clone
     * @returns Cloned value
     */
    private cloneValue;
    /**
     * Generate a zero value for a data type
     * @param dataType Data type
     * @returns Zero value
     */
    private generateZeroValue;
    /**
     * Interpolate between two values
     * @param start Start value
     * @param end End value
     * @param ratio Interpolation ratio (0-1)
     * @param dataType Data type
     * @returns Interpolated value
     */
    private interpolateValue;
}
