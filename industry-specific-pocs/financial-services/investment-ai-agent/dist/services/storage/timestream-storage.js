"use strict";
/**
 * Amazon Timestream storage implementation for market data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimestreamStorage = void 0;
const uuid_1 = require("uuid");
/**
 * Timestream storage implementation for market data
 */
class TimestreamStorage {
    constructor() {
        this.databaseName = '';
        this.tableName = '';
        this.config = null;
        this.initialized = false;
        this.memoryCache = new Map();
    }
    /**
     * Initialize the Timestream storage
     * @param config Storage configuration
     */
    async initialize(config) {
        // In a real implementation, this would initialize the AWS SDK and create the database/table if needed
        this.config = config;
        this.databaseName = 'market_data';
        this.tableName = 'market_data_points';
        this.initialized = true;
        console.log(`Initialized Timestream storage with config: ${JSON.stringify(config)}`);
    } /**
     *
   Store a single data point
     * @param dataPoint Data point to store
     */
    async storeDataPoint(dataPoint) {
        this.ensureInitialized();
        try {
            // In a real implementation, this would write to Timestream
            // For now, we'll just store in memory
            this.memoryCache.set(dataPoint.id, dataPoint);
            // Log the operation
            console.log(`Stored data point: ${dataPoint.symbol} ${dataPoint.dataType} at ${dataPoint.timestamp.toISOString()}`);
        }
        catch (error) {
            console.error('Error storing data point:', error);
            throw new Error(`Failed to store data point: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Store multiple data points
     * @param dataPoints Data points to store
     */
    async storeDataPoints(dataPoints) {
        this.ensureInitialized();
        try {
            // In a real implementation, this would use batch write to Timestream
            // For now, we'll just store in memory
            for (const dataPoint of dataPoints) {
                this.memoryCache.set(dataPoint.id, dataPoint);
            }
            // Log the operation
            console.log(`Stored ${dataPoints.length} data points`);
        }
        catch (error) {
            console.error('Error storing data points:', error);
            throw new Error(`Failed to store data points: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Query data from storage
     * @param query Query parameters
     * @returns Query result
     */
    async queryData(query) {
        this.ensureInitialized();
        try {
            const startTime = Date.now();
            // In a real implementation, this would query Timestream
            // For now, we'll just filter the memory cache
            const results = this.queryMemoryCache(query);
            const executionTime = Date.now() - startTime;
            return {
                data: results,
                metadata: {
                    query,
                    count: results.length,
                    executionTime
                }
            };
        }
        catch (error) {
            console.error('Error querying data:', error);
            throw new Error(`Failed to query data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
       * Delete data from storage
       * @param query Query parameters for data to delete
       * @returns Number of deleted data points
       */
    async deleteData(query) {
        this.ensureInitialized();
        try {
            // In a real implementation, this would delete from Timestream
            // For now, we'll just delete from memory cache
            const dataToDelete = this.queryMemoryCache(query);
            let deletedCount = 0;
            for (const dataPoint of dataToDelete) {
                if (this.memoryCache.delete(dataPoint.id)) {
                    deletedCount++;
                }
            }
            // Log the operation
            console.log(`Deleted ${deletedCount} data points`);
            return deletedCount;
        }
        catch (error) {
            console.error('Error deleting data:', error);
            throw new Error(`Failed to delete data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get storage statistics
     * @returns Storage statistics
     */
    async getStorageStats() {
        this.ensureInitialized();
        try {
            // In a real implementation, this would query Timestream for statistics
            // For now, we'll just return stats from the memory cache
            const dataPoints = Array.from(this.memoryCache.values());
            // Calculate statistics
            const dataPointsByType = {};
            let oldestTimestamp = new Date();
            let newestTimestamp = new Date(0);
            for (const dataPoint of dataPoints) {
                // Count by type
                if (!dataPointsByType[dataPoint.dataType]) {
                    dataPointsByType[dataPoint.dataType] = 0;
                }
                dataPointsByType[dataPoint.dataType]++;
                // Track oldest and newest
                if (dataPoint.timestamp < oldestTimestamp) {
                    oldestTimestamp = dataPoint.timestamp;
                }
                if (dataPoint.timestamp > newestTimestamp) {
                    newestTimestamp = dataPoint.timestamp;
                }
            }
            return {
                totalDataPoints: dataPoints.length,
                oldestDataPoint: oldestTimestamp,
                newestDataPoint: newestTimestamp,
                dataPointsByType,
                storageSize: this.estimateStorageSize(dataPoints),
                compressionRatio: this.config?.compressionEnabled ? 0.4 : 1.0 // Mock compression ratio
            };
        }
        catch (error) {
            console.error('Error getting storage stats:', error);
            throw new Error(`Failed to get storage stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    } // Private helper methods
    /**
     * Ensure the storage is initialized
     * @throws Error if not initialized
     */
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('Timestream storage is not initialized');
        }
    }
    /**
     * Query the memory cache
     * @param query Query parameters
     * @returns Matching data points
     */
    queryMemoryCache(query) {
        const dataPoints = Array.from(this.memoryCache.values());
        // Filter by symbols
        const filteredBySymbol = query.symbols.length > 0
            ? dataPoints.filter(dp => query.symbols.includes(dp.symbol))
            : dataPoints;
        // Filter by data types
        const filteredByType = query.dataTypes.length > 0
            ? filteredBySymbol.filter(dp => query.dataTypes.includes(dp.dataType))
            : filteredBySymbol;
        // Filter by time range
        const filteredByTime = filteredByType.filter(dp => dp.timestamp >= query.timeRange.start && dp.timestamp <= query.timeRange.end);
        // Filter by interval if specified
        const filteredByInterval = query.interval
            ? filteredByTime.filter(dp => dp.interval === query.interval)
            : filteredByTime;
        // Apply aggregation if specified
        let result = filteredByInterval;
        if (query.aggregation && query.aggregation !== 'none') {
            result = this.applyAggregation(result, query);
        }
        // Apply limit if specified
        if (query.limit !== undefined && query.limit > 0) {
            result = result.slice(0, query.limit);
        }
        return result;
    }
    /**
     * Apply aggregation to data points
     * @param dataPoints Data points to aggregate
     * @param query Query parameters
     * @returns Aggregated data points
     */
    applyAggregation(dataPoints, query) {
        // Group by symbol and interval
        const groupedData = {};
        for (const dataPoint of dataPoints) {
            const key = `${dataPoint.symbol}-${dataPoint.interval}`;
            if (!groupedData[key]) {
                groupedData[key] = [];
            }
            groupedData[key].push(dataPoint);
        }
        const result = [];
        // Apply aggregation to each group
        for (const [key, group] of Object.entries(groupedData)) {
            const [symbol, interval] = key.split('-');
            // Sort by timestamp
            group.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            // Apply the specified aggregation
            switch (query.aggregation) {
                case 'ohlc':
                    result.push(...this.aggregateOHLC(group, symbol, interval));
                    break;
                case 'avg':
                    result.push(...this.aggregateAvg(group, symbol, interval));
                    break;
                case 'min':
                    result.push(...this.aggregateMin(group, symbol, interval));
                    break;
                case 'max':
                    result.push(...this.aggregateMax(group, symbol, interval));
                    break;
                case 'sum':
                    result.push(...this.aggregateSum(group, symbol, interval));
                    break;
            }
        }
        return result;
    } /**
   
    * Aggregate data points into OHLC format
     * @param dataPoints Data points to aggregate
     * @param symbol Symbol
     * @param interval Interval
     * @returns Aggregated data points
     */
    aggregateOHLC(dataPoints, symbol, interval) {
        // This is a simplified implementation that assumes all data points are price data
        // In a real implementation, this would handle different data types appropriately
        if (dataPoints.length === 0) {
            return [];
        }
        return [
            {
                id: (0, uuid_1.v4)(),
                symbol,
                dataType: 'price',
                timestamp: dataPoints[0].timestamp,
                value: {
                    open: dataPoints[0].value.open || dataPoints[0].value,
                    high: Math.max(...dataPoints.map(dp => dp.value.high || dp.value)),
                    low: Math.min(...dataPoints.map(dp => dp.value.low || dp.value)),
                    close: dataPoints[dataPoints.length - 1].value.close || dataPoints[dataPoints.length - 1].value,
                    volume: dataPoints.reduce((sum, dp) => sum + (dp.value.volume || 0), 0)
                },
                source: 'aggregated',
                interval,
                metadata: {
                    aggregation: 'ohlc',
                    count: dataPoints.length
                }
            }
        ];
    }
    /**
     * Aggregate data points by average
     * @param dataPoints Data points to aggregate
     * @param symbol Symbol
     * @param interval Interval
     * @returns Aggregated data points
     */
    aggregateAvg(dataPoints, symbol, interval) {
        if (dataPoints.length === 0) {
            return [];
        }
        // Calculate average value
        let sum = 0;
        for (const dp of dataPoints) {
            sum += typeof dp.value === 'number' ? dp.value : (dp.value.close || 0);
        }
        const avg = sum / dataPoints.length;
        return [
            {
                id: (0, uuid_1.v4)(),
                symbol,
                dataType: dataPoints[0].dataType,
                timestamp: dataPoints[0].timestamp,
                value: avg,
                source: 'aggregated',
                interval,
                metadata: {
                    aggregation: 'avg',
                    count: dataPoints.length
                }
            }
        ];
    } /**
   
    * Aggregate data points by minimum
     * @param dataPoints Data points to aggregate
     * @param symbol Symbol
     * @param interval Interval
     * @returns Aggregated data points
     */
    aggregateMin(dataPoints, symbol, interval) {
        if (dataPoints.length === 0) {
            return [];
        }
        // Find minimum value
        let min = Infinity;
        for (const dp of dataPoints) {
            const value = typeof dp.value === 'number' ? dp.value : (dp.value.low || dp.value.close || 0);
            min = Math.min(min, value);
        }
        return [
            {
                id: (0, uuid_1.v4)(),
                symbol,
                dataType: dataPoints[0].dataType,
                timestamp: dataPoints[0].timestamp,
                value: min,
                source: 'aggregated',
                interval,
                metadata: {
                    aggregation: 'min',
                    count: dataPoints.length
                }
            }
        ];
    }
    /**
     * Aggregate data points by maximum
     * @param dataPoints Data points to aggregate
     * @param symbol Symbol
     * @param interval Interval
     * @returns Aggregated data points
     */
    aggregateMax(dataPoints, symbol, interval) {
        if (dataPoints.length === 0) {
            return [];
        }
        // Find maximum value
        let max = -Infinity;
        for (const dp of dataPoints) {
            const value = typeof dp.value === 'number' ? dp.value : (dp.value.high || dp.value.close || 0);
            max = Math.max(max, value);
        }
        return [
            {
                id: (0, uuid_1.v4)(),
                symbol,
                dataType: dataPoints[0].dataType,
                timestamp: dataPoints[0].timestamp,
                value: max,
                source: 'aggregated',
                interval,
                metadata: {
                    aggregation: 'max',
                    count: dataPoints.length
                }
            }
        ];
    }
    /**
      * Aggregate data points by sum
      * @param dataPoints Data points to aggregate
      * @param symbol Symbol
      * @param interval Interval
      * @returns Aggregated data points
      */
    aggregateSum(dataPoints, symbol, interval) {
        if (dataPoints.length === 0) {
            return [];
        }
        // Calculate sum
        let sum = 0;
        for (const dp of dataPoints) {
            sum += typeof dp.value === 'number' ? dp.value : (dp.value.close || 0);
        }
        return [
            {
                id: (0, uuid_1.v4)(),
                symbol,
                dataType: dataPoints[0].dataType,
                timestamp: dataPoints[0].timestamp,
                value: sum,
                source: 'aggregated',
                interval,
                metadata: {
                    aggregation: 'sum',
                    count: dataPoints.length
                }
            }
        ];
    }
    /**
     * Estimate storage size of data points
     * @param dataPoints Data points
     * @returns Estimated size in bytes
     */
    estimateStorageSize(dataPoints) {
        // This is a very rough estimate
        let size = 0;
        for (const dp of dataPoints) {
            // Estimate size of each field
            size += dp.id.length * 2; // String
            size += dp.symbol.length * 2; // String
            size += dp.dataType.length * 2; // String
            size += 8; // Timestamp (8 bytes)
            size += JSON.stringify(dp.value).length * 2; // Value as JSON
            size += dp.source.length * 2; // String
            size += dp.interval.length * 2; // String
            size += dp.metadata ? JSON.stringify(dp.metadata).length * 2 : 0; // Metadata as JSON
        }
        return size;
    }
}
exports.TimestreamStorage = TimestreamStorage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGltZXN0cmVhbS1zdG9yYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3NlcnZpY2VzL3N0b3JhZ2UvdGltZXN0cmVhbS1zdG9yYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7O0FBRUgsK0JBQW9DO0FBdUJwQzs7R0FFRztBQUNILE1BQWEsaUJBQWlCO0lBQTlCO1FBQ1UsaUJBQVksR0FBVyxFQUFFLENBQUM7UUFDMUIsY0FBUyxHQUFXLEVBQUUsQ0FBQztRQUN2QixXQUFNLEdBQW1DLElBQUksQ0FBQztRQUM5QyxnQkFBVyxHQUFZLEtBQUssQ0FBQztRQUM3QixnQkFBVyxHQUFpQyxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBbWRoRSxDQUFDO0lBamRDOzs7T0FHRztJQUNILEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBK0I7UUFDOUMsc0dBQXNHO1FBQ3RHLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxZQUFZLEdBQUcsYUFBYSxDQUFDO1FBQ2xDLElBQUksQ0FBQyxTQUFTLEdBQUcsb0JBQW9CLENBQUM7UUFDdEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFFeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQywrQ0FBK0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDdkYsQ0FBQyxDQUFFOzs7O09BSUE7SUFDSCxLQUFLLENBQUMsY0FBYyxDQUFDLFNBQTBCO1FBQzdDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBRXpCLElBQUk7WUFDRiwyREFBMkQ7WUFDM0Qsc0NBQXNDO1lBQ3RDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFFOUMsb0JBQW9CO1lBQ3BCLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLFNBQVMsQ0FBQyxN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Q0YsQ0FBQztJQUNKLENBQUM7SUFFRDs7OztPQUlHO0lBQ0ssbUJBQW1CLENBQUMsVUFBNkI7UUFDdkQsZ0NBQWdDO1FBQ2hDLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztRQUViLEtBQUssTUFBTSxFQUFFLElBQUksVUFBVSxFQUFFO1lBQzNCLDhCQUE4QjtZQUM5QixJQUFJLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsU0FBUztZQUNuQyxJQUFJLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsU0FBUztZQUN2QyxJQUFJLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsU0FBUztZQUN6QyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsc0JBQXNCO1lBQ2pDLElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCO1lBQzdELElBQUksSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxTQUFTO1lBQ3ZDLElBQUksSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxTQUFTO1lBQ3pDLElBQUksSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBbUI7U0FDdEY7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7Q0FDRjtBQXhkRCw4Q0F3ZEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEFtYXpvbiBUaW1lc3RyZWFtIHN0b3JhZ2UgaW1wbGVtZW50YXRpb24gZm9yIG1hcmtldCBkYXRhXG4gKi9cblxuaW1wb3J0IHsgdjQgYXMgdXVpZHY0IH0gZnJvbSAndXVpZCc7XG5pbXBvcnQge1xuICBNYXJrZXREYXRhUG9pbnQsXG4gIE1hcmtldERhdGFRdWVyeSxcbiAgTWFya2V0RGF0YVF1ZXJ5UmVzdWx0LFxuICBNYXJrZXREYXRhU3RvcmFnZUNvbmZpZyxcbiAgTWFya2V0RGF0YVR5cGUsXG4gIE1hcmtldERhdGFJbnRlcnZhbFxufSBmcm9tICcuLi8uLi9tb2RlbHMvbWFya2V0LWRhdGEnO1xuaW1wb3J0IHsgTWFya2V0RGF0YVN0b3JhZ2UgfSBmcm9tICcuLi9tYXJrZXQtZGF0YS1zZXJ2aWNlJztcblxuLyoqXG4gKiBTdG9yYWdlIHN0YXRpc3RpY3MgaW50ZXJmYWNlXG4gKi9cbmludGVyZmFjZSBTdG9yYWdlU3RhdHMge1xuICB0b3RhbERhdGFQb2ludHM6IG51bWJlcjtcbiAgb2xkZXN0RGF0YVBvaW50OiBEYXRlO1xuICBuZXdlc3REYXRhUG9pbnQ6IERhdGU7XG4gIGRhdGFQb2ludHNCeVR5cGU6IFJlY29yZDxNYXJrZXREYXRhVHlwZSwgbnVtYmVyPjtcbiAgc3RvcmFnZVNpemU6IG51bWJlcjsgLy8gaW4gYnl0ZXNcbiAgY29tcHJlc3Npb25SYXRpbz86IG51bWJlcjtcbn1cblxuLyoqXG4gKiBUaW1lc3RyZWFtIHN0b3JhZ2UgaW1wbGVtZW50YXRpb24gZm9yIG1hcmtldCBkYXRhXG4gKi9cbmV4cG9ydCBjbGFzcyBUaW1lc3RyZWFtU3RvcmFnZSBpbXBsZW1lbnRzIE1hcmtldERhdGFTdG9yYWdlIHtcbiAgcHJpdmF0ZSBkYXRhYmFzZU5hbWU6IHN0cmluZyA9ICcnO1xuICBwcml2YXRlIHRhYmxlTmFtZTogc3RyaW5nID0gJyc7XG4gIHByaXZhdGUgY29uZmlnOiBNYXJrZXREYXRhU3RvcmFnZUNvbmZpZyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGluaXRpYWxpemVkOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgbWVtb3J5Q2FjaGU6IE1hcDxzdHJpbmcsIE1hcmtldERhdGFQb2ludD4gPSBuZXcgTWFwKCk7XG4gIFxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgVGltZXN0cmVhbSBzdG9yYWdlXG4gICAqIEBwYXJhbSBjb25maWcgU3RvcmFnZSBjb25maWd1cmF0aW9uXG4gICAqL1xuICBhc3luYyBpbml0aWFsaXplKGNvbmZpZzogTWFya2V0RGF0YVN0b3JhZ2VDb25maWcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyBJbiBhIHJlYWwgaW1wbGVtZW50YXRpb24sIHRoaXMgd291bGQgaW5pdGlhbGl6ZSB0aGUgQVdTIFNESyBhbmQgY3JlYXRlIHRoZSBkYXRhYmFzZS90YWJsZSBpZiBuZWVkZWRcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLmRhdGFiYXNlTmFtZSA9ICdtYXJrZXRfZGF0YSc7XG4gICAgdGhpcy50YWJsZU5hbWUgPSAnbWFya2V0X2RhdGFfcG9pbnRzJztcbiAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICBcbiAgICBjb25zb2xlLmxvZyhgSW5pdGlhbGl6ZWQgVGltZXN0cmVhbSBzdG9yYWdlIHdpdGggY29uZmlnOiAke0pTT04uc3RyaW5naWZ5KGNvbmZpZyl9YCk7XG4gIH0gIC8qKlxuICAgKlxuIFN0b3JlIGEgc2luZ2xlIGRhdGEgcG9pbnRcbiAgICogQHBhcmFtIGRhdGFQb2ludCBEYXRhIHBvaW50IHRvIHN0b3JlXG4gICAqL1xuICBhc3luYyBzdG9yZURhdGFQb2ludChkYXRhUG9pbnQ6IE1hcmtldERhdGFQb2ludCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuZW5zdXJlSW5pdGlhbGl6ZWQoKTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgLy8gSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB0aGlzIHdvdWxkIHdyaXRlIHRvIFRpbWVzdHJlYW1cbiAgICAgIC8vIEZvciBub3csIHdlJ2xsIGp1c3Qgc3RvcmUgaW4gbWVtb3J5XG4gICAgICB0aGlzLm1lbW9yeUNhY2hlLnNldChkYXRhUG9pbnQuaWQsIGRhdGFQb2ludCk7XG4gICAgICBcbiAgICAgIC8vIExvZyB0aGUgb3BlcmF0aW9uXG4gICAgICBjb25zb2xlLmxvZyhgU3RvcmVkIGRhdGEgcG9pbnQ6ICR7ZGF0YVBvaW50LnN5bWJvbH0gJHtkYXRhUG9pbnQuZGF0YVR5cGV9IGF0ICR7ZGF0YVBvaW50LnRpbWVzdGFtcC50b0lTT1N0cmluZygpfWApO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBzdG9yaW5nIGRhdGEgcG9pbnQ6JywgZXJyb3IpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gc3RvcmUgZGF0YSBwb2ludDogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ31gKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdG9yZSBtdWx0aXBsZSBkYXRhIHBvaW50c1xuICAgKiBAcGFyYW0gZGF0YVBvaW50cyBEYXRhIHBvaW50cyB0byBzdG9yZVxuICAgKi9cbiAgYXN5bmMgc3RvcmVEYXRhUG9pbnRzKGRhdGFQb2ludHM6IE1hcmtldERhdGFQb2ludFtdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5lbnN1cmVJbml0aWFsaXplZCgpO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICAvLyBJbiBhIHJlYWwgaW1wbGVtZW50YXRpb24sIHRoaXMgd291bGQgdXNlIGJhdGNoIHdyaXRlIHRvIFRpbWVzdHJlYW1cbiAgICAgIC8vIEZvciBub3csIHdlJ2xsIGp1c3Qgc3RvcmUgaW4gbWVtb3J5XG4gICAgICBmb3IgKGNvbnN0IGRhdGFQb2ludCBvZiBkYXRhUG9pbnRzKSB7XG4gICAgICAgIHRoaXMubWVtb3J5Q2FjaGUuc2V0KGRhdGFQb2ludC5pZCwgZGF0YVBvaW50KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gTG9nIHRoZSBvcGVyYXRpb25cbiAgICAgIGNvbnNvbGUubG9nKGBTdG9yZWQgJHtkYXRhUG9pbnRzLmxlbmd0aH0gZGF0YSBwb2ludHNgKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc3RvcmluZyBkYXRhIHBvaW50czonLCBlcnJvcik7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBzdG9yZSBkYXRhIHBvaW50czogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ31gKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBRdWVyeSBkYXRhIGZyb20gc3RvcmFnZVxuICAgKiBAcGFyYW0gcXVlcnkgUXVlcnkgcGFyYW1ldGVyc1xuICAgKiBAcmV0dXJucyBRdWVyeSByZXN1bHRcbiAgICovXG4gIGFzeW5jIHF1ZXJ5RGF0YShxdWVyeTogTWFya2V0RGF0YVF1ZXJ5KTogUHJvbWlzZTxNYXJrZXREYXRhUXVlcnlSZXN1bHQ+IHtcbiAgICB0aGlzLmVuc3VyZUluaXRpYWxpemVkKCk7XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgICBcbiAgICAgIC8vIEluIGEgcmVhbCBpbXBsZW1lbnRhdGlvbiwgdGhpcyB3b3VsZCBxdWVyeSBUaW1lc3RyZWFtXG4gICAgICAvLyBGb3Igbm93LCB3ZSdsbCBqdXN0IGZpbHRlciB0aGUgbWVtb3J5IGNhY2hlXG4gICAgICBjb25zdCByZXN1bHRzID0gdGhpcy5xdWVyeU1lbW9yeUNhY2hlKHF1ZXJ5KTtcbiAgICAgIFxuICAgICAgY29uc3QgZXhlY3V0aW9uVGltZSA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgICBcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGRhdGE6IHJlc3VsdHMsXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgcXVlcnksXG4gICAgICAgICAgY291bnQ6IHJlc3VsdHMubGVuZ3RoLFxuICAgICAgICAgIGV4ZWN1dGlvblRpbWVcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgcXVlcnlpbmcgZGF0YTonLCBlcnJvcik7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBxdWVyeSBkYXRhOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWApO1xuICAgIH1cbiAgfSAgXG4vKipcbiAgICogRGVsZXRlIGRhdGEgZnJvbSBzdG9yYWdlXG4gICAqIEBwYXJhbSBxdWVyeSBRdWVyeSBwYXJhbWV0ZXJzIGZvciBkYXRhIHRvIGRlbGV0ZVxuICAgKiBAcmV0dXJucyBOdW1iZXIgb2YgZGVsZXRlZCBkYXRhIHBvaW50c1xuICAgKi9cbiAgYXN5bmMgZGVsZXRlRGF0YShxdWVyeTogTWFya2V0RGF0YVF1ZXJ5KTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aGlzLmVuc3VyZUluaXRpYWxpemVkKCk7XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIC8vIEluIGEgcmVhbCBpbXBsZW1lbnRhdGlvbiwgdGhpcyB3b3VsZCBkZWxldGUgZnJvbSBUaW1lc3RyZWFtXG4gICAgICAvLyBGb3Igbm93LCB3ZSdsbCBqdXN0IGRlbGV0ZSBmcm9tIG1lbW9yeSBjYWNoZVxuICAgICAgY29uc3QgZGF0YVRvRGVsZXRlID0gdGhpcy5xdWVyeU1lbW9yeUNhY2hlKHF1ZXJ5KTtcbiAgICAgIGxldCBkZWxldGVkQ291bnQgPSAwO1xuICAgICAgXG4gICAgICBmb3IgKGNvbnN0IGRhdGFQb2ludCBvZiBkYXRhVG9EZWxldGUpIHtcbiAgICAgICAgaWYgKHRoaXMubWVtb3J5Q2FjaGUuZGVsZXRlKGRhdGFQb2ludC5pZCkpIHtcbiAgICAgICAgICBkZWxldGVkQ291bnQrKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBMb2cgdGhlIG9wZXJhdGlvblxuICAgICAgY29uc29sZS5sb2coYERlbGV0ZWQgJHtkZWxldGVkQ291bnR9IGRhdGEgcG9pbnRzYCk7XG4gICAgICBcbiAgICAgIHJldHVybiBkZWxldGVkQ291bnQ7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGRlbGV0aW5nIGRhdGE6JywgZXJyb3IpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gZGVsZXRlIGRhdGE6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcid9YCk7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHN0b3JhZ2Ugc3RhdGlzdGljc1xuICAgKiBAcmV0dXJucyBTdG9yYWdlIHN0YXRpc3RpY3NcbiAgICovXG4gIGFzeW5jIGdldFN0b3JhZ2VTdGF0cygpOiBQcm9taXNlPFN0b3JhZ2VTdGF0cz4ge1xuICAgIHRoaXMuZW5zdXJlSW5pdGlhbGl6ZWQoKTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgLy8gSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB0aGlzIHdvdWxkIHF1ZXJ5IFRpbWVzdHJlYW0gZm9yIHN0YXRpc3RpY3NcbiAgICAgIC8vIEZvciBub3csIHdlJ2xsIGp1c3QgcmV0dXJuIHN0YXRzIGZyb20gdGhlIG1lbW9yeSBjYWNoZVxuICAgICAgY29uc3QgZGF0YVBvaW50cyA9IEFycmF5LmZyb20odGhpcy5tZW1vcnlDYWNoZS52YWx1ZXMoKSk7XG4gICAgICBcbiAgICAgIC8vIENhbGN1bGF0ZSBzdGF0aXN0aWNzXG4gICAgICBjb25zdCBkYXRhUG9pbnRzQnlUeXBlOiBSZWNvcmQ8TWFya2V0RGF0YVR5cGUsIG51bWJlcj4gPSB7fSBhcyBSZWNvcmQ8TWFya2V0RGF0YVR5cGUsIG51bWJlcj47XG4gICAgICBsZXQgb2xkZXN0VGltZXN0YW1wID0gbmV3IERhdGUoKTtcbiAgICAgIGxldCBuZXdlc3RUaW1lc3RhbXAgPSBuZXcgRGF0ZSgwKTtcbiAgICAgIFxuICAgICAgZm9yIChjb25zdCBkYXRhUG9pbnQgb2YgZGF0YVBvaW50cykge1xuICAgICAgICAvLyBDb3VudCBieSB0eXBlXG4gICAgICAgIGlmICghZGF0YVBvaW50c0J5VHlwZVtkYXRhUG9pbnQuZGF0YVR5cGVdKSB7XG4gICAgICAgICAgZGF0YVBvaW50c0J5VHlwZVtkYXRhUG9pbnQuZGF0YVR5cGVdID0gMDtcbiAgICAgICAgfVxuICAgICAgICBkYXRhUG9pbnRzQnlUeXBlW2RhdGFQb2ludC5kYXRhVHlwZV0rKztcbiAgICAgICAgXG4gICAgICAgIC8vIFRyYWNrIG9sZGVzdCBhbmQgbmV3ZXN0XG4gICAgICAgIGlmIChkYXRhUG9pbnQudGltZXN0YW1wIDwgb2xkZXN0VGltZXN0YW1wKSB7XG4gICAgICAgICAgb2xkZXN0VGltZXN0YW1wID0gZGF0YVBvaW50LnRpbWVzdGFtcDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGF0YVBvaW50LnRpbWVzdGFtcCA+IG5ld2VzdFRpbWVzdGFtcCkge1xuICAgICAgICAgIG5ld2VzdFRpbWVzdGFtcCA9IGRhdGFQb2ludC50aW1lc3RhbXA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdG90YWxEYXRhUG9pbnRzOiBkYXRhUG9pbnRzLmxlbmd0aCxcbiAgICAgICAgb2xkZXN0RGF0YVBvaW50OiBvbGRlc3RUaW1lc3RhbXAsXG4gICAgICAgIG5ld2VzdERhdGFQb2ludDogbmV3ZXN0VGltZXN0YW1wLFxuICAgICAgICBkYXRhUG9pbnRzQnlUeXBlLFxuICAgICAgICBzdG9yYWdlU2l6ZTogdGhpcy5lc3RpbWF0ZVN0b3JhZ2VTaXplKGRhdGFQb2ludHMpLFxuICAgICAgICBjb21wcmVzc2lvblJhdGlvOiB0aGlzLmNvbmZpZz8uY29tcHJlc3Npb25FbmFibGVkID8gMC40IDogMS4wIC8vIE1vY2sgY29tcHJlc3Npb24gcmF0aW9cbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGdldHRpbmcgc3RvcmFnZSBzdGF0czonLCBlcnJvcik7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBnZXQgc3RvcmFnZSBzdGF0czogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ31gKTtcbiAgICB9XG4gIH0gIC8vIFByaXZhdGUgaGVscGVyIG1ldGhvZHNcbiAgXG4gIC8qKlxuICAgKiBFbnN1cmUgdGhlIHN0b3JhZ2UgaXMgaW5pdGlhbGl6ZWRcbiAgICogQHRocm93cyBFcnJvciBpZiBub3QgaW5pdGlhbGl6ZWRcbiAgICovXG4gIHByaXZhdGUgZW5zdXJlSW5pdGlhbGl6ZWQoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmluaXRpYWxpemVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RpbWVzdHJlYW0gc3RvcmFnZSBpcyBub3QgaW5pdGlhbGl6ZWQnKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBRdWVyeSB0aGUgbWVtb3J5IGNhY2hlXG4gICAqIEBwYXJhbSBxdWVyeSBRdWVyeSBwYXJhbWV0ZXJzXG4gICAqIEByZXR1cm5zIE1hdGNoaW5nIGRhdGEgcG9pbnRzXG4gICAqL1xuICBwcml2YXRlIHF1ZXJ5TWVtb3J5Q2FjaGUocXVlcnk6IE1hcmtldERhdGFRdWVyeSk6IE1hcmtldERhdGFQb2ludFtdIHtcbiAgICBjb25zdCBkYXRhUG9pbnRzID0gQXJyYXkuZnJvbSh0aGlzLm1lbW9yeUNhY2hlLnZhbHVlcygpKTtcbiAgICBcbiAgICAvLyBGaWx0ZXIgYnkgc3ltYm9sc1xuICAgIGNvbnN0IGZpbHRlcmVkQnlTeW1ib2wgPSBxdWVyeS5zeW1ib2xzLmxlbmd0aCA+IDBcbiAgICAgID8gZGF0YVBvaW50cy5maWx0ZXIoZHAgPT4gcXVlcnkuc3ltYm9scy5pbmNsdWRlcyhkcC5zeW1ib2wpKVxuICAgICAgOiBkYXRhUG9pbnRzO1xuICAgIFxuICAgIC8vIEZpbHRlciBieSBkYXRhIHR5cGVzXG4gICAgY29uc3QgZmlsdGVyZWRCeVR5cGUgPSBxdWVyeS5kYXRhVHlwZXMubGVuZ3RoID4gMFxuICAgICAgPyBmaWx0ZXJlZEJ5U3ltYm9sLmZpbHRlcihkcCA9PiBxdWVyeS5kYXRhVHlwZXMuaW5jbHVkZXMoZHAuZGF0YVR5cGUpKVxuICAgICAgOiBmaWx0ZXJlZEJ5U3ltYm9sO1xuICAgIFxuICAgIC8vIEZpbHRlciBieSB0aW1lIHJhbmdlXG4gICAgY29uc3QgZmlsdGVyZWRCeVRpbWUgPSBmaWx0ZXJlZEJ5VHlwZS5maWx0ZXIoZHAgPT4gXG4gICAgICBkcC50aW1lc3RhbXAgPj0gcXVlcnkudGltZVJhbmdlLnN0YXJ0ICYmIGRwLnRpbWVzdGFtcCA8PSBxdWVyeS50aW1lUmFuZ2UuZW5kXG4gICAgKTtcbiAgICBcbiAgICAvLyBGaWx0ZXIgYnkgaW50ZXJ2YWwgaWYgc3BlY2lmaWVkXG4gICAgY29uc3QgZmlsdGVyZWRCeUludGVydmFsID0gcXVlcnkuaW50ZXJ2YWxcbiAgICAgID8gZmlsdGVyZWRCeVRpbWUuZmlsdGVyKGRwID0+IGRwLmludGVydmFsID09PSBxdWVyeS5pbnRlcnZhbClcbiAgICAgIDogZmlsdGVyZWRCeVRpbWU7XG4gICAgXG4gICAgLy8gQXBwbHkgYWdncmVnYXRpb24gaWYgc3BlY2lmaWVkXG4gICAgbGV0IHJlc3VsdCA9IGZpbHRlcmVkQnlJbnRlcnZhbDtcbiAgICBpZiAocXVlcnkuYWdncmVnYXRpb24gJiYgcXVlcnkuYWdncmVnYXRpb24gIT09ICdub25lJykge1xuICAgICAgcmVzdWx0ID0gdGhpcy5hcHBseUFnZ3JlZ2F0aW9uKHJlc3VsdCwgcXVlcnkpO1xuICAgIH1cbiAgICBcbiAgICAvLyBBcHBseSBsaW1pdCBpZiBzcGVjaWZpZWRcbiAgICBpZiAocXVlcnkubGltaXQgIT09IHVuZGVmaW5lZCAmJiBxdWVyeS5saW1pdCA+IDApIHtcbiAgICAgIHJlc3VsdCA9IHJlc3VsdC5zbGljZSgwLCBxdWVyeS5saW1pdCk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBBcHBseSBhZ2dyZWdhdGlvbiB0byBkYXRhIHBvaW50c1xuICAgKiBAcGFyYW0gZGF0YVBvaW50cyBEYXRhIHBvaW50cyB0byBhZ2dyZWdhdGVcbiAgICogQHBhcmFtIHF1ZXJ5IFF1ZXJ5IHBhcmFtZXRlcnNcbiAgICogQHJldHVybnMgQWdncmVnYXRlZCBkYXRhIHBvaW50c1xuICAgKi9cbiAgcHJpdmF0ZSBhcHBseUFnZ3JlZ2F0aW9uKGRhdGFQb2ludHM6IE1hcmtldERhdGFQb2ludFtdLCBxdWVyeTogTWFya2V0RGF0YVF1ZXJ5KTogTWFya2V0RGF0YVBvaW50W10ge1xuICAgIC8vIEdyb3VwIGJ5IHN5bWJvbCBhbmQgaW50ZXJ2YWxcbiAgICBjb25zdCBncm91cGVkRGF0YTogUmVjb3JkPHN0cmluZywgTWFya2V0RGF0YVBvaW50W10+ID0ge307XG4gICAgXG4gICAgZm9yIChjb25zdCBkYXRhUG9pbnQgb2YgZGF0YVBvaW50cykge1xuICAgICAgY29uc3Qga2V5ID0gYCR7ZGF0YVBvaW50LnN5bWJvbH0tJHtkYXRhUG9pbnQuaW50ZXJ2YWx9YDtcbiAgICAgIGlmICghZ3JvdXBlZERhdGFba2V5XSkge1xuICAgICAgICBncm91cGVkRGF0YVtrZXldID0gW107XG4gICAgICB9XG4gICAgICBncm91cGVkRGF0YVtrZXldLnB1c2goZGF0YVBvaW50KTtcbiAgICB9XG4gICAgXG4gICAgY29uc3QgcmVzdWx0OiBNYXJrZXREYXRhUG9pbnRbXSA9IFtdO1xuICAgIFxuICAgIC8vIEFwcGx5IGFnZ3JlZ2F0aW9uIHRvIGVhY2ggZ3JvdXBcbiAgICBmb3IgKGNvbnN0IFtrZXksIGdyb3VwXSBvZiBPYmplY3QuZW50cmllcyhncm91cGVkRGF0YSkpIHtcbiAgICAgIGNvbnN0IFtzeW1ib2wsIGludGVydmFsXSA9IGtleS5zcGxpdCgnLScpO1xuICAgICAgXG4gICAgICAvLyBTb3J0IGJ5IHRpbWVzdGFtcFxuICAgICAgZ3JvdXAuc29ydCgoYSwgYikgPT4gYS50aW1lc3RhbXAuZ2V0VGltZSgpIC0gYi50aW1lc3RhbXAuZ2V0VGltZSgpKTtcbiAgICAgIFxuICAgICAgLy8gQXBwbHkgdGhlIHNwZWNpZmllZCBhZ2dyZWdhdGlvblxuICAgICAgc3dpdGNoIChxdWVyeS5hZ2dyZWdhdGlvbikge1xuICAgICAgICBjYXNlICdvaGxjJzpcbiAgICAgICAgICByZXN1bHQucHVzaCguLi50aGlzLmFnZ3JlZ2F0ZU9ITEMoZ3JvdXAsIHN5bWJvbCwgaW50ZXJ2YWwgYXMgTWFya2V0RGF0YUludGVydmFsKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2F2Zyc6XG4gICAgICAgICAgcmVzdWx0LnB1c2goLi4udGhpcy5hZ2dyZWdhdGVBdmcoZ3JvdXAsIHN5bWJvbCwgaW50ZXJ2YWwgYXMgTWFya2V0RGF0YUludGVydmFsKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ21pbic6XG4gICAgICAgICAgcmVzdWx0LnB1c2goLi4udGhpcy5hZ2dyZWdhdGVNaW4oZ3JvdXAsIHN5bWJvbCwgaW50ZXJ2YWwgYXMgTWFya2V0RGF0YUludGVydmFsKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ21heCc6XG4gICAgICAgICAgcmVzdWx0LnB1c2goLi4udGhpcy5hZ2dyZWdhdGVNYXgoZ3JvdXAsIHN5bWJvbCwgaW50ZXJ2YWwgYXMgTWFya2V0RGF0YUludGVydmFsKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3N1bSc6XG4gICAgICAgICAgcmVzdWx0LnB1c2goLi4udGhpcy5hZ2dyZWdhdGVTdW0oZ3JvdXAsIHN5bWJvbCwgaW50ZXJ2YWwgYXMgTWFya2V0RGF0YUludGVydmFsKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0gIC8qKlxuIFxuICAqIEFnZ3JlZ2F0ZSBkYXRhIHBvaW50cyBpbnRvIE9ITEMgZm9ybWF0XG4gICAqIEBwYXJhbSBkYXRhUG9pbnRzIERhdGEgcG9pbnRzIHRvIGFnZ3JlZ2F0ZVxuICAgKiBAcGFyYW0gc3ltYm9sIFN5bWJvbFxuICAgKiBAcGFyYW0gaW50ZXJ2YWwgSW50ZXJ2YWxcbiAgICogQHJldHVybnMgQWdncmVnYXRlZCBkYXRhIHBvaW50c1xuICAgKi9cbiAgcHJpdmF0ZSBhZ2dyZWdhdGVPSExDKGRhdGFQb2ludHM6IE1hcmtldERhdGFQb2ludFtdLCBzeW1ib2w6IHN0cmluZywgaW50ZXJ2YWw6IE1hcmtldERhdGFJbnRlcnZhbCk6IE1hcmtldERhdGFQb2ludFtdIHtcbiAgICAvLyBUaGlzIGlzIGEgc2ltcGxpZmllZCBpbXBsZW1lbnRhdGlvbiB0aGF0IGFzc3VtZXMgYWxsIGRhdGEgcG9pbnRzIGFyZSBwcmljZSBkYXRhXG4gICAgLy8gSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB0aGlzIHdvdWxkIGhhbmRsZSBkaWZmZXJlbnQgZGF0YSB0eXBlcyBhcHByb3ByaWF0ZWx5XG4gICAgXG4gICAgaWYgKGRhdGFQb2ludHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBbXG4gICAgICB7XG4gICAgICAgIGlkOiB1dWlkdjQoKSxcbiAgICAgICAgc3ltYm9sLFxuICAgICAgICBkYXRhVHlwZTogJ3ByaWNlJyxcbiAgICAgICAgdGltZXN0YW1wOiBkYXRhUG9pbnRzWzBdLnRpbWVzdGFtcCxcbiAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICBvcGVuOiBkYXRhUG9pbnRzWzBdLnZhbHVlLm9wZW4gfHwgZGF0YVBvaW50c1swXS52YWx1ZSxcbiAgICAgICAgICBoaWdoOiBNYXRoLm1heCguLi5kYXRhUG9pbnRzLm1hcChkcCA9PiBkcC52YWx1ZS5oaWdoIHx8IGRwLnZhbHVlKSksXG4gICAgICAgICAgbG93OiBNYXRoLm1pbiguLi5kYXRhUG9pbnRzLm1hcChkcCA9PiBkcC52YWx1ZS5sb3cgfHwgZHAudmFsdWUpKSxcbiAgICAgICAgICBjbG9zZTogZGF0YVBvaW50c1tkYXRhUG9pbnRzLmxlbmd0aCAtIDFdLnZhbHVlLmNsb3NlIHx8IGRhdGFQb2ludHNbZGF0YVBvaW50cy5sZW5ndGggLSAxXS52YWx1ZSxcbiAgICAgICAgICB2b2x1bWU6IGRhdGFQb2ludHMucmVkdWNlKChzdW0sIGRwKSA9PiBzdW0gKyAoZHAudmFsdWUudm9sdW1lIHx8IDApLCAwKVxuICAgICAgICB9LFxuICAgICAgICBzb3VyY2U6ICdhZ2dyZWdhdGVkJyxcbiAgICAgICAgaW50ZXJ2YWwsXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgYWdncmVnYXRpb246ICdvaGxjJyxcbiAgICAgICAgICBjb3VudDogZGF0YVBvaW50cy5sZW5ndGhcbiAgICAgICAgfVxuICAgICAgfVxuICAgIF07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBBZ2dyZWdhdGUgZGF0YSBwb2ludHMgYnkgYXZlcmFnZVxuICAgKiBAcGFyYW0gZGF0YVBvaW50cyBEYXRhIHBvaW50cyB0byBhZ2dyZWdhdGVcbiAgICogQHBhcmFtIHN5bWJvbCBTeW1ib2xcbiAgICogQHBhcmFtIGludGVydmFsIEludGVydmFsXG4gICAqIEByZXR1cm5zIEFnZ3JlZ2F0ZWQgZGF0YSBwb2ludHNcbiAgICovXG4gIHByaXZhdGUgYWdncmVnYXRlQXZnKGRhdGFQb2ludHM6IE1hcmtldERhdGFQb2ludFtdLCBzeW1ib2w6IHN0cmluZywgaW50ZXJ2YWw6IE1hcmtldERhdGFJbnRlcnZhbCk6IE1hcmtldERhdGFQb2ludFtdIHtcbiAgICBpZiAoZGF0YVBvaW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgXG4gICAgLy8gQ2FsY3VsYXRlIGF2ZXJhZ2UgdmFsdWVcbiAgICBsZXQgc3VtID0gMDtcbiAgICBmb3IgKGNvbnN0IGRwIG9mIGRhdGFQb2ludHMpIHtcbiAgICAgIHN1bSArPSB0eXBlb2YgZHAudmFsdWUgPT09ICdudW1iZXInID8gZHAudmFsdWUgOiAoZHAudmFsdWUuY2xvc2UgfHwgMCk7XG4gICAgfVxuICAgIGNvbnN0IGF2ZyA9IHN1bSAvIGRhdGFQb2ludHMubGVuZ3RoO1xuICAgIFxuICAgIHJldHVybiBbXG4gICAgICB7XG4gICAgICAgIGlkOiB1dWlkdjQoKSxcbiAgICAgICAgc3ltYm9sLFxuICAgICAgICBkYXRhVHlwZTogZGF0YVBvaW50c1swXS5kYXRhVHlwZSxcbiAgICAgICAgdGltZXN0YW1wOiBkYXRhUG9pbnRzWzBdLnRpbWVzdGFtcCxcbiAgICAgICAgdmFsdWU6IGF2ZyxcbiAgICAgICAgc291cmNlOiAnYWdncmVnYXRlZCcsXG4gICAgICAgIGludGVydmFsLFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIGFnZ3JlZ2F0aW9uOiAnYXZnJyxcbiAgICAgICAgICBjb3VudDogZGF0YVBvaW50cy5sZW5ndGhcbiAgICAgICAgfVxuICAgICAgfVxuICAgIF07XG4gIH0gIC8qKlxuIFxuICAqIEFnZ3JlZ2F0ZSBkYXRhIHBvaW50cyBieSBtaW5pbXVtXG4gICAqIEBwYXJhbSBkYXRhUG9pbnRzIERhdGEgcG9pbnRzIHRvIGFnZ3JlZ2F0ZVxuICAgKiBAcGFyYW0gc3ltYm9sIFN5bWJvbFxuICAgKiBAcGFyYW0gaW50ZXJ2YWwgSW50ZXJ2YWxcbiAgICogQHJldHVybnMgQWdncmVnYXRlZCBkYXRhIHBvaW50c1xuICAgKi9cbiAgcHJpdmF0ZSBhZ2dyZWdhdGVNaW4oZGF0YVBvaW50czogTWFya2V0RGF0YVBvaW50W10sIHN5bWJvbDogc3RyaW5nLCBpbnRlcnZhbDogTWFya2V0RGF0YUludGVydmFsKTogTWFya2V0RGF0YVBvaW50W10ge1xuICAgIGlmIChkYXRhUG9pbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBcbiAgICAvLyBGaW5kIG1pbmltdW0gdmFsdWVcbiAgICBsZXQgbWluID0gSW5maW5pdHk7XG4gICAgZm9yIChjb25zdCBkcCBvZiBkYXRhUG9pbnRzKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHR5cGVvZiBkcC52YWx1ZSA9PT0gJ251bWJlcicgPyBkcC52YWx1ZSA6IChkcC52YWx1ZS5sb3cgfHwgZHAudmFsdWUuY2xvc2UgfHwgMCk7XG4gICAgICBtaW4gPSBNYXRoLm1pbihtaW4sIHZhbHVlKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIFtcbiAgICAgIHtcbiAgICAgICAgaWQ6IHV1aWR2NCgpLFxuICAgICAgICBzeW1ib2wsXG4gICAgICAgIGRhdGFUeXBlOiBkYXRhUG9pbnRzWzBdLmRhdGFUeXBlLFxuICAgICAgICB0aW1lc3RhbXA6IGRhdGFQb2ludHNbMF0udGltZXN0YW1wLFxuICAgICAgICB2YWx1ZTogbWluLFxuICAgICAgICBzb3VyY2U6ICdhZ2dyZWdhdGVkJyxcbiAgICAgICAgaW50ZXJ2YWwsXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgYWdncmVnYXRpb246ICdtaW4nLFxuICAgICAgICAgIGNvdW50OiBkYXRhUG9pbnRzLmxlbmd0aFxuICAgICAgICB9XG4gICAgICB9XG4gICAgXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEFnZ3JlZ2F0ZSBkYXRhIHBvaW50cyBieSBtYXhpbXVtXG4gICAqIEBwYXJhbSBkYXRhUG9pbnRzIERhdGEgcG9pbnRzIHRvIGFnZ3JlZ2F0ZVxuICAgKiBAcGFyYW0gc3ltYm9sIFN5bWJvbFxuICAgKiBAcGFyYW0gaW50ZXJ2YWwgSW50ZXJ2YWxcbiAgICogQHJldHVybnMgQWdncmVnYXRlZCBkYXRhIHBvaW50c1xuICAgKi9cbiAgcHJpdmF0ZSBhZ2dyZWdhdGVNYXgoZGF0YVBvaW50czogTWFya2V0RGF0YVBvaW50W10sIHN5bWJvbDogc3RyaW5nLCBpbnRlcnZhbDogTWFya2V0RGF0YUludGVydmFsKTogTWFya2V0RGF0YVBvaW50W10ge1xuICAgIGlmIChkYXRhUG9pbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBcbiAgICAvLyBGaW5kIG1heGltdW0gdmFsdWVcbiAgICBsZXQgbWF4ID0gLUluZmluaXR5O1xuICAgIGZvciAoY29uc3QgZHAgb2YgZGF0YVBvaW50cykge1xuICAgICAgY29uc3QgdmFsdWUgPSB0eXBlb2YgZHAudmFsdWUgPT09ICdudW1iZXInID8gZHAudmFsdWUgOiAoZHAudmFsdWUuaGlnaCB8fCBkcC52YWx1ZS5jbG9zZSB8fCAwKTtcbiAgICAgIG1heCA9IE1hdGgubWF4KG1heCwgdmFsdWUpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gW1xuICAgICAge1xuICAgICAgICBpZDogdXVpZHY0KCksXG4gICAgICAgIHN5bWJvbCxcbiAgICAgICAgZGF0YVR5cGU6IGRhdGFQb2ludHNbMF0uZGF0YVR5cGUsXG4gICAgICAgIHRpbWVzdGFtcDogZGF0YVBvaW50c1swXS50aW1lc3RhbXAsXG4gICAgICAgIHZhbHVlOiBtYXgsXG4gICAgICAgIHNvdXJjZTogJ2FnZ3JlZ2F0ZWQnLFxuICAgICAgICBpbnRlcnZhbCxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBhZ2dyZWdhdGlvbjogJ21heCcsXG4gICAgICAgICAgY291bnQ6IGRhdGFQb2ludHMubGVuZ3RoXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBdO1xuICB9IFxuIC8qKlxuICAgKiBBZ2dyZWdhdGUgZGF0YSBwb2ludHMgYnkgc3VtXG4gICAqIEBwYXJhbSBkYXRhUG9pbnRzIERhdGEgcG9pbnRzIHRvIGFnZ3JlZ2F0ZVxuICAgKiBAcGFyYW0gc3ltYm9sIFN5bWJvbFxuICAgKiBAcGFyYW0gaW50ZXJ2YWwgSW50ZXJ2YWxcbiAgICogQHJldHVybnMgQWdncmVnYXRlZCBkYXRhIHBvaW50c1xuICAgKi9cbiAgcHJpdmF0ZSBhZ2dyZWdhdGVTdW0oZGF0YVBvaW50czogTWFya2V0RGF0YVBvaW50W10sIHN5bWJvbDogc3RyaW5nLCBpbnRlcnZhbDogTWFya2V0RGF0YUludGVydmFsKTogTWFya2V0RGF0YVBvaW50W10ge1xuICAgIGlmIChkYXRhUG9pbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBcbiAgICAvLyBDYWxjdWxhdGUgc3VtXG4gICAgbGV0IHN1bSA9IDA7XG4gICAgZm9yIChjb25zdCBkcCBvZiBkYXRhUG9pbnRzKSB7XG4gICAgICBzdW0gKz0gdHlwZW9mIGRwLnZhbHVlID09PSAnbnVtYmVyJyA/IGRwLnZhbHVlIDogKGRwLnZhbHVlLmNsb3NlIHx8IDApO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gW1xuICAgICAge1xuICAgICAgICBpZDogdXVpZHY0KCksXG4gICAgICAgIHN5bWJvbCxcbiAgICAgICAgZGF0YVR5cGU6IGRhdGFQb2ludHNbMF0uZGF0YVR5cGUsXG4gICAgICAgIHRpbWVzdGFtcDogZGF0YVBvaW50c1swXS50aW1lc3RhbXAsXG4gICAgICAgIHZhbHVlOiBzdW0sXG4gICAgICAgIHNvdXJjZTogJ2FnZ3JlZ2F0ZWQnLFxuICAgICAgICBpbnRlcnZhbCxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBhZ2dyZWdhdGlvbjogJ3N1bScsXG4gICAgICAgICAgY291bnQ6IGRhdGFQb2ludHMubGVuZ3RoXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBdO1xuICB9XG4gIFxuICAvKipcbiAgICogRXN0aW1hdGUgc3RvcmFnZSBzaXplIG9mIGRhdGEgcG9pbnRzXG4gICAqIEBwYXJhbSBkYXRhUG9pbnRzIERhdGEgcG9pbnRzXG4gICAqIEByZXR1cm5zIEVzdGltYXRlZCBzaXplIGluIGJ5dGVzXG4gICAqL1xuICBwcml2YXRlIGVzdGltYXRlU3RvcmFnZVNpemUoZGF0YVBvaW50czogTWFya2V0RGF0YVBvaW50W10pOiBudW1iZXIge1xuICAgIC8vIFRoaXMgaXMgYSB2ZXJ5IHJvdWdoIGVzdGltYXRlXG4gICAgbGV0IHNpemUgPSAwO1xuICAgIFxuICAgIGZvciAoY29uc3QgZHAgb2YgZGF0YVBvaW50cykge1xuICAgICAgLy8gRXN0aW1hdGUgc2l6ZSBvZiBlYWNoIGZpZWxkXG4gICAgICBzaXplICs9IGRwLmlkLmxlbmd0aCAqIDI7IC8vIFN0cmluZ1xuICAgICAgc2l6ZSArPSBkcC5zeW1ib2wubGVuZ3RoICogMjsgLy8gU3RyaW5nXG4gICAgICBzaXplICs9IGRwLmRhdGFUeXBlLmxlbmd0aCAqIDI7IC8vIFN0cmluZ1xuICAgICAgc2l6ZSArPSA4OyAvLyBUaW1lc3RhbXAgKDggYnl0ZXMpXG4gICAgICBzaXplICs9IEpTT04uc3RyaW5naWZ5KGRwLnZhbHVlKS5sZW5ndGggKiAyOyAvLyBWYWx1ZSBhcyBKU09OXG4gICAgICBzaXplICs9IGRwLnNvdXJjZS5sZW5ndGggKiAyOyAvLyBTdHJpbmdcbiAgICAgIHNpemUgKz0gZHAuaW50ZXJ2YWwubGVuZ3RoICogMjsgLy8gU3RyaW5nXG4gICAgICBzaXplICs9IGRwLm1ldGFkYXRhID8gSlNPTi5zdHJpbmdpZnkoZHAubWV0YWRhdGEpLmxlbmd0aCAqIDIgOiAwOyAvLyBNZXRhZGF0YSBhcyBKU09OXG4gICAgfVxuICAgIFxuICAgIHJldHVybiBzaXplO1xuICB9XG59Il19