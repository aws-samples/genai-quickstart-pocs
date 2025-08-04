/**
 * Amazon Timestream storage implementation for market data
 */
import { MarketDataPoint, MarketDataQuery, MarketDataQueryResult, MarketDataStorageConfig, MarketDataType } from '../../models/market-data';
import { MarketDataStorage } from '../market-data-service';
/**
 * Storage statistics interface
 */
interface StorageStats {
    totalDataPoints: number;
    oldestDataPoint: Date;
    newestDataPoint: Date;
    dataPointsByType: Record<MarketDataType, number>;
    storageSize: number;
    compressionRatio?: number;
}
/**
 * Timestream storage implementation for market data
 */
export declare class TimestreamStorage implements MarketDataStorage {
    private databaseName;
    private tableName;
    private config;
    private initialized;
    private memoryCache;
    /**
     * Initialize the Timestream storage
     * @param config Storage configuration
     */
    initialize(config: MarketDataStorageConfig): Promise<void>; /**
     *
   Store a single data point
     * @param dataPoint Data point to store
     */
    storeDataPoint(dataPoint: MarketDataPoint): Promise<void>;
    /**
     * Store multiple data points
     * @param dataPoints Data points to store
     */
    storeDataPoints(dataPoints: MarketDataPoint[]): Promise<void>;
    /**
     * Query data from storage
     * @param query Query parameters
     * @returns Query result
     */
    queryData(query: MarketDataQuery): Promise<MarketDataQueryResult>;
    /**
       * Delete data from storage
       * @param query Query parameters for data to delete
       * @returns Number of deleted data points
       */
    deleteData(query: MarketDataQuery): Promise<number>;
    /**
     * Get storage statistics
     * @returns Storage statistics
     */
    getStorageStats(): Promise<StorageStats>;
    /**
     * Ensure the storage is initialized
     * @throws Error if not initialized
     */
    private ensureInitialized;
    /**
     * Query the memory cache
     * @param query Query parameters
     * @returns Matching data points
     */
    private queryMemoryCache;
    /**
     * Apply aggregation to data points
     * @param dataPoints Data points to aggregate
     * @param query Query parameters
     * @returns Aggregated data points
     */
    private applyAggregation; /**
   
    * Aggregate data points into OHLC format
     * @param dataPoints Data points to aggregate
     * @param symbol Symbol
     * @param interval Interval
     * @returns Aggregated data points
     */
    private aggregateOHLC;
    /**
     * Aggregate data points by average
     * @param dataPoints Data points to aggregate
     * @param symbol Symbol
     * @param interval Interval
     * @returns Aggregated data points
     */
    private aggregateAvg; /**
   
    * Aggregate data points by minimum
     * @param dataPoints Data points to aggregate
     * @param symbol Symbol
     * @param interval Interval
     * @returns Aggregated data points
     */
    private aggregateMin;
    /**
     * Aggregate data points by maximum
     * @param dataPoints Data points to aggregate
     * @param symbol Symbol
     * @param interval Interval
     * @returns Aggregated data points
     */
    private aggregateMax;
    /**
      * Aggregate data points by sum
      * @param dataPoints Data points to aggregate
      * @param symbol Symbol
      * @param interval Interval
      * @returns Aggregated data points
      */
    private aggregateSum;
    /**
     * Estimate storage size of data points
     * @param dataPoints Data points
     * @returns Estimated size in bytes
     */
    private estimateStorageSize;
}
export {};
