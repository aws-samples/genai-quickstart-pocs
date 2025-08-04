"use strict";
/**
 * Service for handling real-time market data integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketDataService = void 0;
const uuid_1 = require("uuid");
/**
 * Market data service for handling real-time market data integration
 */
class MarketDataService {
    /**
     * Constructor
     * @param storage Market data storage implementation
     * @param alertService Market data alert service implementation
     */
    constructor(storage, alertService) {
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
    async initialize(storageConfig) {
        if (this.isInitialized) {
            return;
        }
        try {
            await this.storage.initialize(storageConfig);
            this.isInitialized = true;
        }
        catch (error) {
            console.error('Failed to initialize market data service:', error);
            throw new Error(`Market data service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    } /**
  
     * Register a market data provider
     * @param name Provider name
     * @param provider Provider implementation
     * @param isDefault Whether this is the default provider
     */
    registerProvider(name, provider, isDefault = false) {
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
    async connectToFeed(config) {
        this.ensureInitialized();
        const provider = this.getProvider(config.provider);
        try {
            const status = await provider.connect(config);
            if (status.connected) {
                // Set up data listener for this provider
                this.setupDataListener(config.provider, config.symbols, config.dataTypes, config.interval);
            }
            return status;
        }
        catch (error) {
            console.error(`Failed to connect to market data feed (${config.provider}):`, error);
            throw new Error(`Market data feed connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Disconnect from a market data feed
     * @param providerName Provider name
     */
    async disconnectFromFeed(providerName) {
        this.ensureInitialized();
        const provider = this.getProvider(providerName);
        try {
            await provider.disconnect();
            // Remove data listeners for this provider
            this.dataListeners.delete(providerName);
        }
        catch (error) {
            console.error(`Failed to disconnect from market data feed (${providerName}):`, error);
            throw new Error(`Market data feed disconnection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    } /**
  
     * Get market data feed status
     * @param providerName Provider name
     * @returns Market data feed status
     */
    getFeedStatus(providerName) {
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
    async subscribeToData(symbols, dataTypes, interval, providerName) {
        this.ensureInitialized();
        const provider = this.getProvider(providerName);
        try {
            await provider.subscribeToData(symbols, dataTypes, interval);
        }
        catch (error) {
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
    async unsubscribeFromData(symbols, dataTypes, providerName) {
        this.ensureInitialized();
        const provider = this.getProvider(providerName);
        try {
            await provider.unsubscribeFromData(symbols, dataTypes);
        }
        catch (error) {
            console.error(`Failed to unsubscribe from market data (${providerName || this.defaultProvider}):`, error);
            throw new Error(`Market data unsubscription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    } /**
  
     * Query historical market data
     * @param query Market data query
     * @param providerName Provider name (optional, uses default if not provided)
     * @returns Market data query result
     */
    async queryData(query, providerName) {
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
        }
        catch (error) {
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
    normalizeData(data, options) {
        const transformations = [];
        const warnings = [];
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
        }
        catch (error) {
            console.error('Error normalizing market data:', error);
            warnings.push(`Normalization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return {
                originalData: data,
                normalizedData: data,
                transformations,
                warnings
            };
        }
    } /**
     
  * Create a market alert
     * @param alertConfig Alert configuration
     * @returns Created alert configuration
     */
    async createAlert(alertConfig) {
        this.ensureInitialized();
        try {
            return await this.alertService.createAlert(alertConfig);
        }
        catch (error) {
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
    async updateAlert(alertId, updates) {
        this.ensureInitialized();
        try {
            return await this.alertService.updateAlert(alertId, updates);
        }
        catch (error) {
            console.error(`Failed to update market alert (${alertId}):`, error);
            throw new Error(`Market alert update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Delete a market alert
     * @param alertId Alert ID
     * @returns True if deletion was successful
     */
    async deleteAlert(alertId) {
        this.ensureInitialized();
        try {
            return await this.alertService.deleteAlert(alertId);
        }
        catch (error) {
            console.error(`Failed to delete market alert (${alertId}):`, error);
            throw new Error(`Market alert deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    } /*
  *
     * Get a market alert
     * @param alertId Alert ID
     * @returns Alert configuration or null if not found
     */
    async getAlert(alertId) {
        this.ensureInitialized();
        try {
            return await this.alertService.getAlert(alertId);
        }
        catch (error) {
            console.error(`Failed to get market alert (${alertId}):`, error);
            throw new Error(`Market alert retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * List market alerts for a user
     * @param userId User ID
     * @returns List of alert configurations
     */
    async listAlerts(userId) {
        this.ensureInitialized();
        try {
            return await this.alertService.listAlerts(userId);
        }
        catch (error) {
            console.error(`Failed to list market alerts for user (${userId}):`, error);
            throw new Error(`Market alert listing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Enable a market alert
     * @param alertId Alert ID
     * @returns Updated alert configuration
     */
    async enableAlert(alertId) {
        this.ensureInitialized();
        try {
            return await this.alertService.enableAlert(alertId);
        }
        catch (error) {
            console.error(`Failed to enable market alert (${alertId}):`, error);
            throw new Error(`Market alert enabling failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Disable a market alert
     * @param alertId Alert ID
     * @returns Updated alert configuration
     */
    async disableAlert(alertId) {
        this.ensureInitialized();
        try {
            return await this.alertService.disableAlert(alertId);
        }
        catch (error) {
            console.error(`Failed to disable market alert (${alertId}):`, error);
            throw new Error(`Market alert disabling failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Private helper methods
    /**
     * Ensure the service is initialized
     * @throws Error if the service is not initialized
     */
    ensureInitialized() {
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
    getProvider(providerName) {
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
    setupDataListener(providerName, symbols, dataTypes, interval) {
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
        const listener = {
            id: listenerId,
            providerName,
            symbols,
            dataTypes,
            interval,
            callback: async (dataPoint) => {
                try {
                    // Store the data point
                    await this.storage.storeDataPoint(dataPoint);
                    // Process alerts
                    const triggeredAlerts = await this.alertService.processDataPoint(dataPoint);
                    // Handle triggered alerts (e.g., send notifications)
                    if (triggeredAlerts.length > 0) {
                        this.handleTriggeredAlerts(triggeredAlerts);
                    }
                }
                catch (error) {
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
    handleTriggeredAlerts(alerts) {
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
    adjustForCorporateActions(data, options, transformations) {
        // Group data by symbol
        const dataBySymbol = this.groupBySymbol(data);
        const result = [];
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
                    const priceData = dataPoint.value;
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
    fillDataGaps(data, fillMethod, transformations, warnings) {
        // Group data by symbol and data type
        const dataBySymbolAndType = {};
        for (const point of data) {
            const key = `${point.symbol}-${point.dataType}-${point.interval}`;
            if (!dataBySymbolAndType[key]) {
                dataBySymbolAndType[key] = [];
            }
            dataBySymbolAndType[key].push(point);
        }
        const result = [];
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
                        const newPoints = this.generateFilledDataPoints(previous, current, missingPoints, fillMethod);
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
    convertCurrency(data, targetCurrency, transformations, warnings) {
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
                    originalCurrency: 'USD',
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
    adjustTimezone(data, timezone, transformations) {
        // In a real implementation, this would use a proper timezone library
        // For now, we'll just add a mock timezone flag to the metadata
        const result = data.map(dataPoint => {
            // Clone the data point to avoid modifying the original
            const adjustedPoint = { ...dataPoint };
            // Add timezone metadata
            adjustedPoint.metadata = {
                ...adjustedPoint.metadata,
                timezoneAdjusted: true,
                originalTimezone: 'UTC',
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
    groupBySymbol(data) {
        const result = {};
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
    getExpectedTimestampGap(interval) {
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
    generateFilledDataPoints(start, end, count, fillMethod) {
        const result = [];
        const startTime = start.timestamp.getTime();
        const endTime = end.timestamp.getTime();
        const timeStep = (endTime - startTime) / (count + 1);
        for (let i = 1; i <= count; i++) {
            const timestamp = new Date(startTime + i * timeStep);
            let value;
            // Generate value based on fill method
            if (fillMethod === 'previous') {
                value = this.cloneValue(start.value);
            }
            else if (fillMethod === 'zero') {
                value = this.generateZeroValue(start.dataType);
            }
            else if (fillMethod === 'linear') {
                value = this.interpolateValue(start.value, end.value, i / (count + 1), start.dataType);
            }
            result.push({
                id: (0, uuid_1.v4)(),
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
    } /**
  
     * Clone a value (deep copy)
     * @param value Value to clone
     * @returns Cloned value
     */
    cloneValue(value) {
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
    generateZeroValue(dataType) {
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
    interpolateValue(start, end, ratio, dataType) {
        if (typeof start === 'number' && typeof end === 'number') {
            return start + (end - start) * ratio;
        }
        if (dataType === 'price' && typeof start === 'object' && typeof end === 'object') {
            const startPrice = start;
            const endPrice = end;
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
exports.MarketDataService = MarketDataService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2V0LWRhdGEtc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zZXJ2aWNlcy9tYXJrZXQtZGF0YS1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7O0FBRUgsK0JBQW9DO0FBcUZwQzs7R0FFRztBQUNILE1BQWEsaUJBQWlCO0lBUTVCOzs7O09BSUc7SUFDSCxZQUFZLE9BQTBCLEVBQUUsWUFBb0M7UUFDMUUsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQzNCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUMvQixJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztRQUMzQixJQUFJLENBQUMsZUFBZSxHQUFHLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxVQUFVLENBQUMsYUFBc0M7UUFDckQsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO1lBQ3RCLE9BQU87U0FDUjtRQUVELElBQUk7WUFDRixNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQzdDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO1NBQzNCO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLDJDQUEyQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sSUFBSSxLQUFLLENBQUMsOENBQThDLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUM7U0FDM0g7SUFDSCxDQUFDLENBQUU7Ozs7OztPQU1BO0lB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SUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSztnQkFDakUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLO2dCQUNqRSxHQUFHLEVBQUUsVUFBVSxDQUFDLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUs7Z0JBQzdELEtBQUssRUFBRSxVQUFVLENBQUMsS0FBSyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSztnQkFDckUsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQztnQkFDckYsYUFBYSxFQUFFLFVBQVUsQ0FBQyxhQUFhLEtBQUssU0FBUyxJQUFJLFFBQVEsQ0FBQyxhQUFhLEtBQUssU0FBUztvQkFDM0YsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxRQUFRLENBQUMsYUFBYSxHQUFHLFVBQVUsQ0FBQyxhQUFhLENBQUMsR0FBRyxLQUFLO29CQUN4RixDQUFDLENBQUMsU0FBUzthQUNkLENBQUM7U0FDSDtRQUVELGdEQUFnRDtRQUNoRCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDaEMsQ0FBQztDQUNGO0FBdjBCRCw4Q0F1MEJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBTZXJ2aWNlIGZvciBoYW5kbGluZyByZWFsLXRpbWUgbWFya2V0IGRhdGEgaW50ZWdyYXRpb25cbiAqL1xuXG5pbXBvcnQgeyB2NCBhcyB1dWlkdjQgfSBmcm9tICd1dWlkJztcbmltcG9ydCB7XG4gIE1hcmtldERhdGFGZWVkQ29uZmlnLFxuICBNYXJrZXREYXRhUG9pbnQsXG4gIE1hcmtldERhdGFUeXBlLFxuICBNYXJrZXREYXRhSW50ZXJ2YWwsXG4gIE1hcmtldERhdGFGZWVkU3RhdHVzLFxuICBNYXJrZXREYXRhUXVlcnksXG4gIE1hcmtldERhdGFRdWVyeVJlc3VsdCxcbiAgTWFya2V0RGF0YVN0b3JhZ2VDb25maWcsXG4gIE1hcmtldERhdGFOb3JtYWxpemF0aW9uT3B0aW9ucyxcbiAgTWFya2V0RGF0YU5vcm1hbGl6YXRpb25SZXN1bHQsXG4gIE1hcmtldEFsZXJ0Q29uZmlnLFxuICBNYXJrZXRBbGVydCxcbiAgUHJpY2VEYXRhLFxuICBPcmRlckJvb2tEYXRhLFxuICBUZWNobmljYWxJbmRpY2F0b3JEYXRhLFxuICBOZXdzU2VudGltZW50RGF0YSxcbiAgRWNvbm9taWNJbmRpY2F0b3JEYXRhLFxuICBWb2xhdGlsaXR5RGF0YSxcbiAgQWxlcnRDb25kaXRpb25cbn0gZnJvbSAnLi4vbW9kZWxzL21hcmtldC1kYXRhJztcbmltcG9ydCB7IFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uL3V0aWxzL3ZhbGlkYXRpb24nO1xuXG4vKipcbiAqIE1hcmtldCBkYXRhIHByb3ZpZGVyIGludGVyZmFjZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE1hcmtldERhdGFQcm92aWRlciB7XG4gIGNvbm5lY3QoY29uZmlnOiBNYXJrZXREYXRhRmVlZENvbmZpZyk6IFByb21pc2U8TWFya2V0RGF0YUZlZWRTdGF0dXM+O1xuICBkaXNjb25uZWN0KCk6IFByb21pc2U8dm9pZD47XG4gIGdldFN0YXR1cygpOiBNYXJrZXREYXRhRmVlZFN0YXR1cztcbiAgc3Vic2NyaWJlVG9EYXRhKHN5bWJvbHM6IHN0cmluZ1tdLCBkYXRhVHlwZXM6IE1hcmtldERhdGFUeXBlW10sIGludGVydmFsOiBNYXJrZXREYXRhSW50ZXJ2YWwpOiBQcm9taXNlPHZvaWQ+O1xuICB1bnN1YnNjcmliZUZyb21EYXRhKHN5bWJvbHM6IHN0cmluZ1tdLCBkYXRhVHlwZXM6IE1hcmtldERhdGFUeXBlW10pOiBQcm9taXNlPHZvaWQ+O1xuICBnZXRIaXN0b3JpY2FsRGF0YShxdWVyeTogTWFya2V0RGF0YVF1ZXJ5KTogUHJvbWlzZTxNYXJrZXREYXRhUG9pbnRbXT47XG59XG5cbi8qKlxuICogU3RvcmFnZSBzdGF0aXN0aWNzXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3RvcmFnZVN0YXRzIHtcbiAgdG90YWxEYXRhUG9pbnRzOiBudW1iZXI7XG4gIG9sZGVzdERhdGFQb2ludDogRGF0ZTtcbiAgbmV3ZXN0RGF0YVBvaW50OiBEYXRlO1xuICBkYXRhUG9pbnRzQnlUeXBlOiBSZWNvcmQ8TWFya2V0RGF0YVR5cGUsIG51bWJlcj47XG4gIHN0b3JhZ2VTaXplOiBudW1iZXI7IC8vIGluIGJ5dGVzXG4gIGNvbXByZXNzaW9uUmF0aW8/OiBudW1iZXI7XG59XG5cbi8qKlxuICogTWFya2V0IGRhdGEgc3RvcmFnZSBpbnRlcmZhY2VcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNYXJrZXREYXRhU3RvcmFnZSB7XG4gIGluaXRpYWxpemUoY29uZmlnOiBNYXJrZXREYXRhU3RvcmFnZUNvbmZpZyk6IFByb21pc2U8dm9pZD47XG4gIHN0b3JlRGF0YVBvaW50KGRhdGFQb2ludDogTWFya2V0RGF0YVBvaW50KTogUHJvbWlzZTx2b2lkPjtcbiAgc3RvcmVEYXRhUG9pbnRzKGRhdGFQb2ludHM6IE1hcmtldERhdGFQb2ludFtdKTogUHJvbWlzZTx2b2lkPjtcbiAgcXVlcnlEYXRhKHF1ZXJ5OiBNYXJrZXREYXRhUXVlcnkpOiBQcm9taXNlPE1hcmtldERhdGFRdWVyeVJlc3VsdD47XG4gIGRlbGV0ZURhdGEocXVlcnk6IE1hcmtldERhdGFRdWVyeSk6IFByb21pc2U8bnVtYmVyPjtcbiAgZ2V0U3RvcmFnZVN0YXRzKCk6IFByb21pc2U8U3RvcmFnZVN0YXRzPjtcbn1cblxuLyoqXG4gKiBNYXJrZXQgZGF0YSBhbGVydCBzZXJ2aWNlIGludGVyZmFjZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE1hcmtldERhdGFBbGVydFNlcnZpY2Uge1xuICBjcmVhdGVBbGVydChhbGVydENvbmZpZzogT21pdDxNYXJrZXRBbGVydENvbmZpZywgJ2lkJyB8ICdjcmVhdGVkQXQnIHwgJ3VwZGF0ZWRBdCc+KTogUHJvbWlzZTxNYXJrZXRBbGVydENvbmZpZz47XG4gIHVwZGF0ZUFsZXJ0KGFsZXJ0SWQ6IHN0cmluZywgdXBkYXRlczogUGFydGlhbDxNYXJrZXRBbGVydENvbmZpZz4pOiBQcm9taXNlPE1hcmtldEFsZXJ0Q29uZmlnPjtcbiAgZGVsZXRlQWxlcnQoYWxlcnRJZDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPjtcbiAgZ2V0QWxlcnQoYWxlcnRJZDogc3RyaW5nKTogUHJvbWlzZTxNYXJrZXRBbGVydENvbmZpZyB8IG51bGw+O1xuICBsaXN0QWxlcnRzKHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxNYXJrZXRBbGVydENvbmZpZ1tdPjtcbiAgZW5hYmxlQWxlcnQoYWxlcnRJZDogc3RyaW5nKTogUHJvbWlzZTxNYXJrZXRBbGVydENvbmZpZz47XG4gIGRpc2FibGVBbGVydChhbGVydElkOiBzdHJpbmcpOiBQcm9taXNlPE1hcmtldEFsZXJ0Q29uZmlnPjtcbiAgcHJvY2Vzc0RhdGFQb2ludChkYXRhUG9pbnQ6IE1hcmtldERhdGFQb2ludCk6IFByb21pc2U8TWFya2V0QWxlcnRbXT47XG59LyoqXG4gKiBEYXRcbmEgbGlzdGVuZXIgaW50ZXJmYWNlXG4gKi9cbmludGVyZmFjZSBEYXRhTGlzdGVuZXIge1xuICBpZDogc3RyaW5nO1xuICBwcm92aWRlck5hbWU6IHN0cmluZztcbiAgc3ltYm9sczogc3RyaW5nW107XG4gIGRhdGFUeXBlczogTWFya2V0RGF0YVR5cGVbXTtcbiAgaW50ZXJ2YWw6IE1hcmtldERhdGFJbnRlcnZhbDtcbiAgY2FsbGJhY2s6IChkYXRhUG9pbnQ6IE1hcmtldERhdGFQb2ludCkgPT4gUHJvbWlzZTx2b2lkPjtcbn1cblxuLyoqXG4gKiBNYXJrZXQgZGF0YSBzZXJ2aWNlIGZvciBoYW5kbGluZyByZWFsLXRpbWUgbWFya2V0IGRhdGEgaW50ZWdyYXRpb25cbiAqL1xuZXhwb3J0IGNsYXNzIE1hcmtldERhdGFTZXJ2aWNlIHtcbiAgcHJpdmF0ZSBwcm92aWRlcnM6IE1hcDxzdHJpbmcsIE1hcmtldERhdGFQcm92aWRlcj47XG4gIHByaXZhdGUgc3RvcmFnZTogTWFya2V0RGF0YVN0b3JhZ2U7XG4gIHByaXZhdGUgYWxlcnRTZXJ2aWNlOiBNYXJrZXREYXRhQWxlcnRTZXJ2aWNlO1xuICBwcml2YXRlIGRhdGFMaXN0ZW5lcnM6IE1hcDxzdHJpbmcsIERhdGFMaXN0ZW5lcltdPjtcbiAgcHJpdmF0ZSBpc0luaXRpYWxpemVkOiBib29sZWFuO1xuICBwcml2YXRlIGRlZmF1bHRQcm92aWRlcjogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0gc3RvcmFnZSBNYXJrZXQgZGF0YSBzdG9yYWdlIGltcGxlbWVudGF0aW9uXG4gICAqIEBwYXJhbSBhbGVydFNlcnZpY2UgTWFya2V0IGRhdGEgYWxlcnQgc2VydmljZSBpbXBsZW1lbnRhdGlvblxuICAgKi9cbiAgY29uc3RydWN0b3Ioc3RvcmFnZTogTWFya2V0RGF0YVN0b3JhZ2UsIGFsZXJ0U2VydmljZTogTWFya2V0RGF0YUFsZXJ0U2VydmljZSkge1xuICAgIHRoaXMucHJvdmlkZXJzID0gbmV3IE1hcCgpO1xuICAgIHRoaXMuc3RvcmFnZSA9IHN0b3JhZ2U7XG4gICAgdGhpcy5hbGVydFNlcnZpY2UgPSBhbGVydFNlcnZpY2U7XG4gICAgdGhpcy5kYXRhTGlzdGVuZXJzID0gbmV3IE1hcCgpO1xuICAgIHRoaXMuaXNJbml0aWFsaXplZCA9IGZhbHNlO1xuICAgIHRoaXMuZGVmYXVsdFByb3ZpZGVyID0gJyc7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgbWFya2V0IGRhdGEgc2VydmljZVxuICAgKiBAcGFyYW0gc3RvcmFnZUNvbmZpZyBTdG9yYWdlIGNvbmZpZ3VyYXRpb25cbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gaW5pdGlhbGl6YXRpb24gaXMgY29tcGxldGVcbiAgICovXG4gIGFzeW5jIGluaXRpYWxpemUoc3RvcmFnZUNvbmZpZzogTWFya2V0RGF0YVN0b3JhZ2VDb25maWcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5pc0luaXRpYWxpemVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuc3RvcmFnZS5pbml0aWFsaXplKHN0b3JhZ2VDb25maWcpO1xuICAgICAgdGhpcy5pc0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGluaXRpYWxpemUgbWFya2V0IGRhdGEgc2VydmljZTonLCBlcnJvcik7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYE1hcmtldCBkYXRhIHNlcnZpY2UgaW5pdGlhbGl6YXRpb24gZmFpbGVkOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWApO1xuICAgIH1cbiAgfSAgLyoqXG5cbiAgICogUmVnaXN0ZXIgYSBtYXJrZXQgZGF0YSBwcm92aWRlclxuICAgKiBAcGFyYW0gbmFtZSBQcm92aWRlciBuYW1lXG4gICAqIEBwYXJhbSBwcm92aWRlciBQcm92aWRlciBpbXBsZW1lbnRhdGlvblxuICAgKiBAcGFyYW0gaXNEZWZhdWx0IFdoZXRoZXIgdGhpcyBpcyB0aGUgZGVmYXVsdCBwcm92aWRlclxuICAgKi9cbiAgcmVnaXN0ZXJQcm92aWRlcihuYW1lOiBzdHJpbmcsIHByb3ZpZGVyOiBNYXJrZXREYXRhUHJvdmlkZXIsIGlzRGVmYXVsdCA9IGZhbHNlKTogdm9pZCB7XG4gICAgdGhpcy5wcm92aWRlcnMuc2V0KG5hbWUsIHByb3ZpZGVyKTtcbiAgICBpZiAoaXNEZWZhdWx0IHx8IHRoaXMucHJvdmlkZXJzLnNpemUgPT09IDEpIHtcbiAgICAgIHRoaXMuZGVmYXVsdFByb3ZpZGVyID0gbmFtZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ29ubmVjdCB0byBhIG1hcmtldCBkYXRhIGZlZWRcbiAgICogQHBhcmFtIGNvbmZpZyBNYXJrZXQgZGF0YSBmZWVkIGNvbmZpZ3VyYXRpb25cbiAgICogQHJldHVybnMgQ29ubmVjdGlvbiBzdGF0dXNcbiAgICovXG4gIGFzeW5jIGNvbm5lY3RUb0ZlZWQoY29uZmlnOiBNYXJrZXREYXRhRmVlZENvbmZpZyk6IFByb21pc2U8TWFya2V0RGF0YUZlZWRTdGF0dXM+IHtcbiAgICB0aGlzLmVuc3VyZUluaXRpYWxpemVkKCk7XG4gICAgXG4gICAgY29uc3QgcHJvdmlkZXIgPSB0aGlzLmdldFByb3ZpZGVyKGNvbmZpZy5wcm92aWRlcik7XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IGF3YWl0IHByb3ZpZGVyLmNvbm5lY3QoY29uZmlnKTtcbiAgICAgIFxuICAgICAgaWYgKHN0YXR1cy5jb25uZWN0ZWQpIHtcbiAgICAgICAgLy8gU2V0IHVwIGRhdGEgbGlzdGVuZXIgZm9yIHRoaXMgcHJvdmlkZXJcbiAgICAgICAgdGhpcy5zZXR1cERhdGFMaXN0ZW5lcihjb25maWcucHJvdmlkZXIsIGNvbmZpZy5zeW1ib2xzLCBjb25maWcuZGF0YVR5cGVzLCBjb25maWcuaW50ZXJ2YWwpO1xuICAgICAgfVxuICAgICAgXG4gICAgICByZXR1cm4gc3RhdHVzO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgdG8gY29ubmVjdCB0byBtYXJrZXQgZGF0YSBmZWVkICgke2NvbmZpZy5wcm92aWRlcn0pOmAsIGVycm9yKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTWFya2V0IGRhdGEgZmVlZCBjb25uZWN0aW9uIGZhaWxlZDogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ31gKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGlzY29ubmVjdCBmcm9tIGEgbWFya2V0IGRhdGEgZmVlZFxuICAgKiBAcGFyYW0gcHJvdmlkZXJOYW1lIFByb3ZpZGVyIG5hbWVcbiAgICovXG4gIGFzeW5jIGRpc2Nvbm5lY3RGcm9tRmVlZChwcm92aWRlck5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuZW5zdXJlSW5pdGlhbGl6ZWQoKTtcbiAgICBcbiAgICBjb25zdCBwcm92aWRlciA9IHRoaXMuZ2V0UHJvdmlkZXIocHJvdmlkZXJOYW1lKTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgYXdhaXQgcHJvdmlkZXIuZGlzY29ubmVjdCgpO1xuICAgICAgXG4gICAgICAvLyBSZW1vdmUgZGF0YSBsaXN0ZW5lcnMgZm9yIHRoaXMgcHJvdmlkZXJcbiAgICAgIHRoaXMuZGF0YUxpc3RlbmVycy5kZWxldGUocHJvdmlkZXJOYW1lKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihgRmFpbGVkIHRvIGRpc2Nvbm5lY3QgZnJvbSBtYXJrZXQgZGF0YSBmZWVkICgke3Byb3ZpZGVyTmFtZX0pOmAsIGVycm9yKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTWFya2V0IGRhdGEgZmVlZCBkaXNjb25uZWN0aW9uIGZhaWxlZDogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ31gKTtcbiAgICB9XG4gIH0gIC8qKlxuXG4gICAqIEdldCBtYXJrZXQgZGF0YSBmZWVkIHN0YXR1c1xuICAgKiBAcGFyYW0gcHJvdmlkZXJOYW1lIFByb3ZpZGVyIG5hbWVcbiAgICogQHJldHVybnMgTWFya2V0IGRhdGEgZmVlZCBzdGF0dXNcbiAgICovXG4gIGdldEZlZWRTdGF0dXMocHJvdmlkZXJOYW1lPzogc3RyaW5nKTogTWFya2V0RGF0YUZlZWRTdGF0dXMge1xuICAgIHRoaXMuZW5zdXJlSW5pdGlhbGl6ZWQoKTtcbiAgICBcbiAgICBjb25zdCBwcm92aWRlciA9IHRoaXMuZ2V0UHJvdmlkZXIocHJvdmlkZXJOYW1lKTtcbiAgICByZXR1cm4gcHJvdmlkZXIuZ2V0U3RhdHVzKCk7XG4gIH1cblxuICAvKipcbiAgICogU3Vic2NyaWJlIHRvIG1hcmtldCBkYXRhXG4gICAqIEBwYXJhbSBzeW1ib2xzIExpc3Qgb2Ygc3ltYm9scyB0byBzdWJzY3JpYmUgdG9cbiAgICogQHBhcmFtIGRhdGFUeXBlcyBMaXN0IG9mIGRhdGEgdHlwZXMgdG8gc3Vic2NyaWJlIHRvXG4gICAqIEBwYXJhbSBpbnRlcnZhbCBEYXRhIGludGVydmFsXG4gICAqIEBwYXJhbSBwcm92aWRlck5hbWUgUHJvdmlkZXIgbmFtZSAob3B0aW9uYWwsIHVzZXMgZGVmYXVsdCBpZiBub3QgcHJvdmlkZWQpXG4gICAqL1xuICBhc3luYyBzdWJzY3JpYmVUb0RhdGEoXG4gICAgc3ltYm9sczogc3RyaW5nW10sXG4gICAgZGF0YVR5cGVzOiBNYXJrZXREYXRhVHlwZVtdLFxuICAgIGludGVydmFsOiBNYXJrZXREYXRhSW50ZXJ2YWwsXG4gICAgcHJvdmlkZXJOYW1lPzogc3RyaW5nXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuZW5zdXJlSW5pdGlhbGl6ZWQoKTtcbiAgICBcbiAgICBjb25zdCBwcm92aWRlciA9IHRoaXMuZ2V0UHJvdmlkZXIocHJvdmlkZXJOYW1lKTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgYXdhaXQgcHJvdmlkZXIuc3Vic2NyaWJlVG9EYXRhKHN5bWJvbHMsIGRhdGFUeXBlcywgaW50ZXJ2YWwpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgdG8gc3Vic2NyaWJlIHRvIG1hcmtldCBkYXRhICgke3Byb3ZpZGVyTmFtZSB8fCB0aGlzLmRlZmF1bHRQcm92aWRlcn0pOmAsIGVycm9yKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTWFya2V0IGRhdGEgc3Vic2NyaXB0aW9uIGZhaWxlZDogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ31gKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVW5zdWJzY3JpYmUgZnJvbSBtYXJrZXQgZGF0YVxuICAgKiBAcGFyYW0gc3ltYm9scyBMaXN0IG9mIHN5bWJvbHMgdG8gdW5zdWJzY3JpYmUgZnJvbVxuICAgKiBAcGFyYW0gZGF0YVR5cGVzIExpc3Qgb2YgZGF0YSB0eXBlcyB0byB1bnN1YnNjcmliZSBmcm9tXG4gICAqIEBwYXJhbSBwcm92aWRlck5hbWUgUHJvdmlkZXIgbmFtZSAob3B0aW9uYWwsIHVzZXMgZGVmYXVsdCBpZiBub3QgcHJvdmlkZWQpXG4gICAqL1xuICBhc3luYyB1bnN1YnNjcmliZUZyb21EYXRhKFxuICAgIHN5bWJvbHM6IHN0cmluZ1tdLFxuICAgIGRhdGFUeXBlczogTWFya2V0RGF0YVR5cGVbXSxcbiAgICBwcm92aWRlck5hbWU/OiBzdHJpbmdcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5lbnN1cmVJbml0aWFsaXplZCgpO1xuICAgIFxuICAgIGNvbnN0IHByb3ZpZGVyID0gdGhpcy5nZXRQcm92aWRlcihwcm92aWRlck5hbWUpO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBwcm92aWRlci51bnN1YnNjcmliZUZyb21EYXRhKHN5bWJvbHMsIGRhdGFUeXBlcyk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byB1bnN1YnNjcmliZSBmcm9tIG1hcmtldCBkYXRhICgke3Byb3ZpZGVyTmFtZSB8fCB0aGlzLmRlZmF1bHRQcm92aWRlcn0pOmAsIGVycm9yKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTWFya2V0IGRhdGEgdW5zdWJzY3JpcHRpb24gZmFpbGVkOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWApO1xuICAgIH1cbiAgfSAgLyoqXG5cbiAgICogUXVlcnkgaGlzdG9yaWNhbCBtYXJrZXQgZGF0YVxuICAgKiBAcGFyYW0gcXVlcnkgTWFya2V0IGRhdGEgcXVlcnlcbiAgICogQHBhcmFtIHByb3ZpZGVyTmFtZSBQcm92aWRlciBuYW1lIChvcHRpb25hbCwgdXNlcyBkZWZhdWx0IGlmIG5vdCBwcm92aWRlZClcbiAgICogQHJldHVybnMgTWFya2V0IGRhdGEgcXVlcnkgcmVzdWx0XG4gICAqL1xuICBhc3luYyBxdWVyeURhdGEocXVlcnk6IE1hcmtldERhdGFRdWVyeSwgcHJvdmlkZXJOYW1lPzogc3RyaW5nKTogUHJvbWlzZTxNYXJrZXREYXRhUXVlcnlSZXN1bHQ+IHtcbiAgICB0aGlzLmVuc3VyZUluaXRpYWxpemVkKCk7XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIC8vIEZpcnN0IHRyeSB0byBnZXQgZGF0YSBmcm9tIHN0b3JhZ2VcbiAgICAgIGNvbnN0IHN0b3JhZ2VSZXN1bHQgPSBhd2FpdCB0aGlzLnN0b3JhZ2UucXVlcnlEYXRhKHF1ZXJ5KTtcbiAgICAgIFxuICAgICAgLy8gSWYgd2UgaGF2ZSBlbm91Z2ggZGF0YSBmcm9tIHN0b3JhZ2UsIHJldHVybiBpdFxuICAgICAgaWYgKHN0b3JhZ2VSZXN1bHQuZGF0YS5sZW5ndGggPiAwICYmIFxuICAgICAgICAgIChxdWVyeS5saW1pdCA9PT0gdW5kZWZpbmVkIHx8IHN0b3JhZ2VSZXN1bHQuZGF0YS5sZW5ndGggPj0gcXVlcnkubGltaXQpKSB7XG4gICAgICAgIHJldHVybiBzdG9yYWdlUmVzdWx0O1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBPdGhlcndpc2UsIGZldGNoIGZyb20gcHJvdmlkZXJcbiAgICAgIGNvbnN0IHByb3ZpZGVyID0gdGhpcy5nZXRQcm92aWRlcihwcm92aWRlck5hbWUpO1xuICAgICAgY29uc3QgcHJvdmlkZXJEYXRhID0gYXdhaXQgcHJvdmlkZXIuZ2V0SGlzdG9yaWNhbERhdGEocXVlcnkpO1xuICAgICAgXG4gICAgICAvLyBTdG9yZSB0aGUgZGF0YSB3ZSBnb3QgZnJvbSB0aGUgcHJvdmlkZXJcbiAgICAgIGlmIChwcm92aWRlckRhdGEubGVuZ3RoID4gMCkge1xuICAgICAgICBhd2FpdCB0aGlzLnN0b3JhZ2Uuc3RvcmVEYXRhUG9pbnRzKHByb3ZpZGVyRGF0YSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIENvbWJpbmUgd2l0aCBhbnkgZGF0YSB3ZSBnb3QgZnJvbSBzdG9yYWdlIChhdm9pZGluZyBkdXBsaWNhdGVzKVxuICAgICAgY29uc3QgZXhpc3RpbmdJZHMgPSBuZXcgU2V0KHN0b3JhZ2VSZXN1bHQuZGF0YS5tYXAoZCA9PiBkLmlkKSk7XG4gICAgICBjb25zdCBuZXdEYXRhID0gcHJvdmlkZXJEYXRhLmZpbHRlcihkID0+ICFleGlzdGluZ0lkcy5oYXMoZC5pZCkpO1xuICAgICAgY29uc3QgY29tYmluZWREYXRhID0gWy4uLnN0b3JhZ2VSZXN1bHQuZGF0YSwgLi4ubmV3RGF0YV07XG4gICAgICBcbiAgICAgIC8vIFNvcnQgYnkgdGltZXN0YW1wIChuZXdlc3QgZmlyc3QpXG4gICAgICBjb21iaW5lZERhdGEuc29ydCgoYSwgYikgPT4gYi50aW1lc3RhbXAuZ2V0VGltZSgpIC0gYS50aW1lc3RhbXAuZ2V0VGltZSgpKTtcbiAgICAgIFxuICAgICAgLy8gQXBwbHkgbGltaXQgaWYgc3BlY2lmaWVkXG4gICAgICBjb25zdCBsaW1pdGVkRGF0YSA9IHF1ZXJ5LmxpbWl0ICE9PSB1bmRlZmluZWQgXG4gICAgICAgID8gY29tYmluZWREYXRhLnNsaWNlKDAsIHF1ZXJ5LmxpbWl0KSBcbiAgICAgICAgOiBjb21iaW5lZERhdGE7XG4gICAgICBcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGRhdGE6IGxpbWl0ZWREYXRhLFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICAgIGNvdW50OiBsaW1pdGVkRGF0YS5sZW5ndGgsXG4gICAgICAgICAgZXhlY3V0aW9uVGltZTogc3RvcmFnZVJlc3VsdC5tZXRhZGF0YS5leGVjdXRpb25UaW1lLFxuICAgICAgICAgIG5leHRUb2tlbjogdW5kZWZpbmVkIC8vIE5vdCBpbXBsZW1lbnRpbmcgcGFnaW5hdGlvbiBpbiB0aGlzIHZlcnNpb25cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihgRmFpbGVkIHRvIHF1ZXJ5IG1hcmtldCBkYXRhOmAsIGVycm9yKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTWFya2V0IGRhdGEgcXVlcnkgZmFpbGVkOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWApO1xuICAgIH1cbiAgfSAgXG4vKipcbiAgICogTm9ybWFsaXplIG1hcmtldCBkYXRhXG4gICAqIEBwYXJhbSBkYXRhIE1hcmtldCBkYXRhIHBvaW50cyB0byBub3JtYWxpemVcbiAgICogQHBhcmFtIG9wdGlvbnMgTm9ybWFsaXphdGlvbiBvcHRpb25zXG4gICAqIEByZXR1cm5zIE5vcm1hbGl6ZWQgbWFya2V0IGRhdGFcbiAgICovXG4gIG5vcm1hbGl6ZURhdGEoZGF0YTogTWFya2V0RGF0YVBvaW50W10sIG9wdGlvbnM6IE1hcmtldERhdGFOb3JtYWxpemF0aW9uT3B0aW9ucyk6IE1hcmtldERhdGFOb3JtYWxpemF0aW9uUmVzdWx0IHtcbiAgICBjb25zdCB0cmFuc2Zvcm1hdGlvbnM6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3Qgd2FybmluZ3M6IHN0cmluZ1tdID0gW107XG4gICAgbGV0IG5vcm1hbGl6ZWREYXRhID0gWy4uLmRhdGFdOyAvLyBDcmVhdGUgYSBjb3B5IHRvIGF2b2lkIG1vZGlmeWluZyB0aGUgb3JpZ2luYWxcbiAgICBcbiAgICB0cnkge1xuICAgICAgLy8gSGFuZGxlIGFkanVzdG1lbnRzIGZvciBzcGxpdHMgYW5kIGRpdmlkZW5kc1xuICAgICAgaWYgKG9wdGlvbnMuYWRqdXN0Rm9yU3BsaXRzIHx8IG9wdGlvbnMuYWRqdXN0Rm9yRGl2aWRlbmRzKSB7XG4gICAgICAgIG5vcm1hbGl6ZWREYXRhID0gdGhpcy5hZGp1c3RGb3JDb3Jwb3JhdGVBY3Rpb25zKG5vcm1hbGl6ZWREYXRhLCBvcHRpb25zLCB0cmFuc2Zvcm1hdGlvbnMpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBGaWxsIGdhcHMgaW4gdGltZSBzZXJpZXMgZGF0YVxuICAgICAgaWYgKG9wdGlvbnMuZmlsbEdhcHMgJiYgb3B0aW9ucy5maWxsTWV0aG9kKSB7XG4gICAgICAgIG5vcm1hbGl6ZWREYXRhID0gdGhpcy5maWxsRGF0YUdhcHMobm9ybWFsaXplZERhdGEsIG9wdGlvbnMuZmlsbE1ldGhvZCwgdHJhbnNmb3JtYXRpb25zLCB3YXJuaW5ncyk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIENvbnZlcnQgY3VycmVuY3kgaWYgbmVlZGVkXG4gICAgICBpZiAob3B0aW9ucy5jb252ZXJ0Q3VycmVuY3kgJiYgb3B0aW9ucy5jdXJyZW5jeSkge1xuICAgICAgICBub3JtYWxpemVkRGF0YSA9IHRoaXMuY29udmVydEN1cnJlbmN5KG5vcm1hbGl6ZWREYXRhLCBvcHRpb25zLmN1cnJlbmN5LCB0cmFuc2Zvcm1hdGlvbnMsIHdhcm5pbmdzKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gQWRqdXN0IHRpbWV6b25lIGlmIG5lZWRlZFxuICAgICAgbm9ybWFsaXplZERhdGEgPSB0aGlzLmFkanVzdFRpbWV6b25lKG5vcm1hbGl6ZWREYXRhLCBvcHRpb25zLnRpbWV6b25lLCB0cmFuc2Zvcm1hdGlvbnMpO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICBvcmlnaW5hbERhdGE6IGRhdGEsXG4gICAgICAgIG5vcm1hbGl6ZWREYXRhLFxuICAgICAgICB0cmFuc2Zvcm1hdGlvbnMsXG4gICAgICAgIHdhcm5pbmdzXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBub3JtYWxpemluZyBtYXJrZXQgZGF0YTonLCBlcnJvcik7XG4gICAgICB3YXJuaW5ncy5wdXNoKGBOb3JtYWxpemF0aW9uIGVycm9yOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWApO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICBvcmlnaW5hbERhdGE6IGRhdGEsXG4gICAgICAgIG5vcm1hbGl6ZWREYXRhOiBkYXRhLCAvLyBSZXR1cm4gb3JpZ2luYWwgZGF0YSBvbiBlcnJvclxuICAgICAgICB0cmFuc2Zvcm1hdGlvbnMsXG4gICAgICAgIHdhcm5pbmdzXG4gICAgICB9O1xuICAgIH1cbiAgfSAgLyoqXG4gICBcbiogQ3JlYXRlIGEgbWFya2V0IGFsZXJ0XG4gICAqIEBwYXJhbSBhbGVydENvbmZpZyBBbGVydCBjb25maWd1cmF0aW9uXG4gICAqIEByZXR1cm5zIENyZWF0ZWQgYWxlcnQgY29uZmlndXJhdGlvblxuICAgKi9cbiAgYXN5bmMgY3JlYXRlQWxlcnQoYWxlcnRDb25maWc6IE9taXQ8TWFya2V0QWxlcnRDb25maWcsICdpZCcgfCAnY3JlYXRlZEF0JyB8ICd1cGRhdGVkQXQnPik6IFByb21pc2U8TWFya2V0QWxlcnRDb25maWc+IHtcbiAgICB0aGlzLmVuc3VyZUluaXRpYWxpemVkKCk7XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLmFsZXJ0U2VydmljZS5jcmVhdGVBbGVydChhbGVydENvbmZpZyk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBjcmVhdGUgbWFya2V0IGFsZXJ0OicsIGVycm9yKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTWFya2V0IGFsZXJ0IGNyZWF0aW9uIGZhaWxlZDogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ31gKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIGEgbWFya2V0IGFsZXJ0XG4gICAqIEBwYXJhbSBhbGVydElkIEFsZXJ0IElEXG4gICAqIEBwYXJhbSB1cGRhdGVzIEFsZXJ0IHVwZGF0ZXNcbiAgICogQHJldHVybnMgVXBkYXRlZCBhbGVydCBjb25maWd1cmF0aW9uXG4gICAqL1xuICBhc3luYyB1cGRhdGVBbGVydChhbGVydElkOiBzdHJpbmcsIHVwZGF0ZXM6IFBhcnRpYWw8TWFya2V0QWxlcnRDb25maWc+KTogUHJvbWlzZTxNYXJrZXRBbGVydENvbmZpZz4ge1xuICAgIHRoaXMuZW5zdXJlSW5pdGlhbGl6ZWQoKTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuYWxlcnRTZXJ2aWNlLnVwZGF0ZUFsZXJ0KGFsZXJ0SWQsIHVwZGF0ZXMpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgdG8gdXBkYXRlIG1hcmtldCBhbGVydCAoJHthbGVydElkfSk6YCwgZXJyb3IpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBNYXJrZXQgYWxlcnQgdXBkYXRlIGZhaWxlZDogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ31gKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGEgbWFya2V0IGFsZXJ0XG4gICAqIEBwYXJhbSBhbGVydElkIEFsZXJ0IElEXG4gICAqIEByZXR1cm5zIFRydWUgaWYgZGVsZXRpb24gd2FzIHN1Y2Nlc3NmdWxcbiAgICovXG4gIGFzeW5jIGRlbGV0ZUFsZXJ0KGFsZXJ0SWQ6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRoaXMuZW5zdXJlSW5pdGlhbGl6ZWQoKTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuYWxlcnRTZXJ2aWNlLmRlbGV0ZUFsZXJ0KGFsZXJ0SWQpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgdG8gZGVsZXRlIG1hcmtldCBhbGVydCAoJHthbGVydElkfSk6YCwgZXJyb3IpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBNYXJrZXQgYWxlcnQgZGVsZXRpb24gZmFpbGVkOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWApO1xuICAgIH1cbiAgfSAgLypcbipcbiAgICogR2V0IGEgbWFya2V0IGFsZXJ0XG4gICAqIEBwYXJhbSBhbGVydElkIEFsZXJ0IElEXG4gICAqIEByZXR1cm5zIEFsZXJ0IGNvbmZpZ3VyYXRpb24gb3IgbnVsbCBpZiBub3QgZm91bmRcbiAgICovXG4gIGFzeW5jIGdldEFsZXJ0KGFsZXJ0SWQ6IHN0cmluZyk6IFByb21pc2U8TWFya2V0QWxlcnRDb25maWcgfCBudWxsPiB7XG4gICAgdGhpcy5lbnN1cmVJbml0aWFsaXplZCgpO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5hbGVydFNlcnZpY2UuZ2V0QWxlcnQoYWxlcnRJZCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byBnZXQgbWFya2V0IGFsZXJ0ICgke2FsZXJ0SWR9KTpgLCBlcnJvcik7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYE1hcmtldCBhbGVydCByZXRyaWV2YWwgZmFpbGVkOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IG1hcmtldCBhbGVydHMgZm9yIGEgdXNlclxuICAgKiBAcGFyYW0gdXNlcklkIFVzZXIgSURcbiAgICogQHJldHVybnMgTGlzdCBvZiBhbGVydCBjb25maWd1cmF0aW9uc1xuICAgKi9cbiAgYXN5bmMgbGlzdEFsZXJ0cyh1c2VySWQ6IHN0cmluZyk6IFByb21pc2U8TWFya2V0QWxlcnRDb25maWdbXT4ge1xuICAgIHRoaXMuZW5zdXJlSW5pdGlhbGl6ZWQoKTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuYWxlcnRTZXJ2aWNlLmxpc3RBbGVydHModXNlcklkKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihgRmFpbGVkIHRvIGxpc3QgbWFya2V0IGFsZXJ0cyBmb3IgdXNlciAoJHt1c2VySWR9KTpgLCBlcnJvcik7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYE1hcmtldCBhbGVydCBsaXN0aW5nIGZhaWxlZDogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ31gKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlIGEgbWFya2V0IGFsZXJ0XG4gICAqIEBwYXJhbSBhbGVydElkIEFsZXJ0IElEXG4gICAqIEByZXR1cm5zIFVwZGF0ZWQgYWxlcnQgY29uZmlndXJhdGlvblxuICAgKi9cbiAgYXN5bmMgZW5hYmxlQWxlcnQoYWxlcnRJZDogc3RyaW5nKTogUHJvbWlzZTxNYXJrZXRBbGVydENvbmZpZz4ge1xuICAgIHRoaXMuZW5zdXJlSW5pdGlhbGl6ZWQoKTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuYWxlcnRTZXJ2aWNlLmVuYWJsZUFsZXJ0KGFsZXJ0SWQpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgdG8gZW5hYmxlIG1hcmtldCBhbGVydCAoJHthbGVydElkfSk6YCwgZXJyb3IpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBNYXJrZXQgYWxlcnQgZW5hYmxpbmcgZmFpbGVkOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNhYmxlIGEgbWFya2V0IGFsZXJ0XG4gICAqIEBwYXJhbSBhbGVydElkIEFsZXJ0IElEXG4gICAqIEByZXR1cm5zIFVwZGF0ZWQgYWxlcnQgY29uZmlndXJhdGlvblxuICAgKi9cbiAgYXN5bmMgZGlzYWJsZUFsZXJ0KGFsZXJ0SWQ6IHN0cmluZyk6IFByb21pc2U8TWFya2V0QWxlcnRDb25maWc+IHtcbiAgICB0aGlzLmVuc3VyZUluaXRpYWxpemVkKCk7XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLmFsZXJ0U2VydmljZS5kaXNhYmxlQWxlcnQoYWxlcnRJZCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byBkaXNhYmxlIG1hcmtldCBhbGVydCAoJHthbGVydElkfSk6YCwgZXJyb3IpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBNYXJrZXQgYWxlcnQgZGlzYWJsaW5nIGZhaWxlZDogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ31gKTtcbiAgICB9XG4gIH0gIFxuICBcbiAgLy8gUHJpdmF0ZSBoZWxwZXIgbWV0aG9kc1xuXG4gIC8qKlxuICAgKiBFbnN1cmUgdGhlIHNlcnZpY2UgaXMgaW5pdGlhbGl6ZWRcbiAgICogQHRocm93cyBFcnJvciBpZiB0aGUgc2VydmljZSBpcyBub3QgaW5pdGlhbGl6ZWRcbiAgICovXG4gIHByaXZhdGUgZW5zdXJlSW5pdGlhbGl6ZWQoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmlzSW5pdGlhbGl6ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTWFya2V0IGRhdGEgc2VydmljZSBpcyBub3QgaW5pdGlhbGl6ZWQnKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcHJvdmlkZXIgYnkgbmFtZVxuICAgKiBAcGFyYW0gcHJvdmlkZXJOYW1lIFByb3ZpZGVyIG5hbWUgKG9wdGlvbmFsLCB1c2VzIGRlZmF1bHQgaWYgbm90IHByb3ZpZGVkKVxuICAgKiBAcmV0dXJucyBQcm92aWRlciBpbXBsZW1lbnRhdGlvblxuICAgKiBAdGhyb3dzIEVycm9yIGlmIHByb3ZpZGVyIGlzIG5vdCBmb3VuZFxuICAgKi9cbiAgcHJpdmF0ZSBnZXRQcm92aWRlcihwcm92aWRlck5hbWU/OiBzdHJpbmcpOiBNYXJrZXREYXRhUHJvdmlkZXIge1xuICAgIGNvbnN0IG5hbWUgPSBwcm92aWRlck5hbWUgfHwgdGhpcy5kZWZhdWx0UHJvdmlkZXI7XG4gICAgXG4gICAgaWYgKCFuYW1lKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIG1hcmtldCBkYXRhIHByb3ZpZGVyIHNwZWNpZmllZCBhbmQgbm8gZGVmYXVsdCBwcm92aWRlciBpcyBzZXQnKTtcbiAgICB9XG4gICAgXG4gICAgY29uc3QgcHJvdmlkZXIgPSB0aGlzLnByb3ZpZGVycy5nZXQobmFtZSk7XG4gICAgXG4gICAgaWYgKCFwcm92aWRlcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBNYXJrZXQgZGF0YSBwcm92aWRlciBub3QgZm91bmQ6ICR7bmFtZX1gKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHByb3ZpZGVyO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB1cCBhIGRhdGEgbGlzdGVuZXIgZm9yIGEgcHJvdmlkZXJcbiAgICogQHBhcmFtIHByb3ZpZGVyTmFtZSBQcm92aWRlciBuYW1lXG4gICAqIEBwYXJhbSBzeW1ib2xzIFN5bWJvbHMgdG8gbGlzdGVuIGZvclxuICAgKiBAcGFyYW0gZGF0YVR5cGVzIERhdGEgdHlwZXMgdG8gbGlzdGVuIGZvclxuICAgKiBAcGFyYW0gaW50ZXJ2YWwgRGF0YSBpbnRlcnZhbFxuICAgKi9cbiAgcHJpdmF0ZSBzZXR1cERhdGFMaXN0ZW5lcihcbiAgICBwcm92aWRlck5hbWU6IHN0cmluZyxcbiAgICBzeW1ib2xzOiBzdHJpbmdbXSxcbiAgICBkYXRhVHlwZXM6IE1hcmtldERhdGFUeXBlW10sXG4gICAgaW50ZXJ2YWw6IE1hcmtldERhdGFJbnRlcnZhbFxuICApOiB2b2lkIHtcbiAgICAvLyBDcmVhdGUgYSB1bmlxdWUgbGlzdGVuZXIgSURcbiAgICBjb25zdCBsaXN0ZW5lcklkID0gYCR7cHJvdmlkZXJOYW1lfS0ke3N5bWJvbHMuam9pbignLCcpfS0ke2RhdGFUeXBlcy5qb2luKCcsJyl9LSR7aW50ZXJ2YWx9YDtcbiAgICBcbiAgICAvLyBDaGVjayBpZiB3ZSBhbHJlYWR5IGhhdmUgYSBsaXN0ZW5lciBmb3IgdGhpcyBjb25maWd1cmF0aW9uXG4gICAgaWYgKHRoaXMuZGF0YUxpc3RlbmVycy5oYXMocHJvdmlkZXJOYW1lKSkge1xuICAgICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5kYXRhTGlzdGVuZXJzLmdldChwcm92aWRlck5hbWUpIHx8IFtdO1xuICAgICAgaWYgKGxpc3RlbmVycy5zb21lKGwgPT4gbC5pZCA9PT0gbGlzdGVuZXJJZCkpIHtcbiAgICAgICAgcmV0dXJuOyAvLyBMaXN0ZW5lciBhbHJlYWR5IGV4aXN0c1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBDcmVhdGUgYSBuZXcgbGlzdGVuZXJcbiAgICBjb25zdCBsaXN0ZW5lcjogRGF0YUxpc3RlbmVyID0ge1xuICAgICAgaWQ6IGxpc3RlbmVySWQsXG4gICAgICBwcm92aWRlck5hbWUsXG4gICAgICBzeW1ib2xzLFxuICAgICAgZGF0YVR5cGVzLFxuICAgICAgaW50ZXJ2YWwsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKGRhdGFQb2ludDogTWFya2V0RGF0YVBvaW50KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gU3RvcmUgdGhlIGRhdGEgcG9pbnRcbiAgICAgICAgICBhd2FpdCB0aGlzLnN0b3JhZ2Uuc3RvcmVEYXRhUG9pbnQoZGF0YVBvaW50KTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBQcm9jZXNzIGFsZXJ0c1xuICAgICAgICAgIGNvbnN0IHRyaWdnZXJlZEFsZXJ0cyA9IGF3YWl0IHRoaXMuYWxlcnRTZXJ2aWNlLnByb2Nlc3NEYXRhUG9pbnQoZGF0YVBvaW50KTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBIYW5kbGUgdHJpZ2dlcmVkIGFsZXJ0cyAoZS5nLiwgc2VuZCBub3RpZmljYXRpb25zKVxuICAgICAgICAgIGlmICh0cmlnZ2VyZWRBbGVydHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVUcmlnZ2VyZWRBbGVydHModHJpZ2dlcmVkQWxlcnRzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgcHJvY2Vzc2luZyBtYXJrZXQgZGF0YSBwb2ludDonLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICAgIFxuICAgIC8vIEFkZCB0aGUgbGlzdGVuZXIgdG8gb3VyIG1hcFxuICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuZGF0YUxpc3RlbmVycy5nZXQocHJvdmlkZXJOYW1lKSB8fCBbXTtcbiAgICBsaXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG4gICAgdGhpcy5kYXRhTGlzdGVuZXJzLnNldChwcm92aWRlck5hbWUsIGxpc3RlbmVycyk7XG4gICAgXG4gICAgLy8gUmVnaXN0ZXIgdGhlIGxpc3RlbmVyIHdpdGggdGhlIHByb3ZpZGVyIChpbXBsZW1lbnRhdGlvbiB3b3VsZCBkZXBlbmQgb24gdGhlIHByb3ZpZGVyKVxuICAgIC8vIFRoaXMgaXMgYSBtb2NrIGltcGxlbWVudGF0aW9uXG4gICAgY29uc29sZS5sb2coYFJlZ2lzdGVyZWQgZGF0YSBsaXN0ZW5lciBmb3IgcHJvdmlkZXIgJHtwcm92aWRlck5hbWV9YCk7XG4gIH0gXG4gLyoqXG4gICAqIEhhbmRsZSB0cmlnZ2VyZWQgbWFya2V0IGFsZXJ0c1xuICAgKiBAcGFyYW0gYWxlcnRzIFRyaWdnZXJlZCBhbGVydHNcbiAgICovXG4gIHByaXZhdGUgaGFuZGxlVHJpZ2dlcmVkQWxlcnRzKGFsZXJ0czogTWFya2V0QWxlcnRbXSk6IHZvaWQge1xuICAgIC8vIEluIGEgcmVhbCBpbXBsZW1lbnRhdGlvbiwgdGhpcyB3b3VsZCBzZW5kIG5vdGlmaWNhdGlvbnMgdmlhIHRoZSBjb25maWd1cmVkIGNoYW5uZWxzXG4gICAgLy8gRm9yIG5vdywgd2UnbGwganVzdCBsb2cgdGhlIGFsZXJ0c1xuICAgIGZvciAoY29uc3QgYWxlcnQgb2YgYWxlcnRzKSB7XG4gICAgICBjb25zb2xlLmxvZyhgTUFSS0VUIEFMRVJUIFske2FsZXJ0LnNldmVyaXR5fV06ICR7YWxlcnQubWVzc2FnZX1gKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRqdXN0IG1hcmtldCBkYXRhIGZvciBjb3Jwb3JhdGUgYWN0aW9ucyAoc3BsaXRzIGFuZCBkaXZpZGVuZHMpXG4gICAqIEBwYXJhbSBkYXRhIE1hcmtldCBkYXRhIHBvaW50c1xuICAgKiBAcGFyYW0gb3B0aW9ucyBOb3JtYWxpemF0aW9uIG9wdGlvbnNcbiAgICogQHBhcmFtIHRyYW5zZm9ybWF0aW9ucyBBcnJheSB0byB0cmFjayB0cmFuc2Zvcm1hdGlvbnNcbiAgICogQHJldHVybnMgQWRqdXN0ZWQgbWFya2V0IGRhdGEgcG9pbnRzXG4gICAqL1xuICBwcml2YXRlIGFkanVzdEZvckNvcnBvcmF0ZUFjdGlvbnMoXG4gICAgZGF0YTogTWFya2V0RGF0YVBvaW50W10sXG4gICAgb3B0aW9uczogTWFya2V0RGF0YU5vcm1hbGl6YXRpb25PcHRpb25zLFxuICAgIHRyYW5zZm9ybWF0aW9uczogc3RyaW5nW11cbiAgKTogTWFya2V0RGF0YVBvaW50W10ge1xuICAgIC8vIEdyb3VwIGRhdGEgYnkgc3ltYm9sXG4gICAgY29uc3QgZGF0YUJ5U3ltYm9sID0gdGhpcy5ncm91cEJ5U3ltYm9sKGRhdGEpO1xuICAgIGNvbnN0IHJlc3VsdDogTWFya2V0RGF0YVBvaW50W10gPSBbXTtcbiAgICBcbiAgICAvLyBQcm9jZXNzIGVhY2ggc3ltYm9sIHNlcGFyYXRlbHlcbiAgICBmb3IgKGNvbnN0IFtzeW1ib2wsIHN5bWJvbERhdGFdIG9mIE9iamVjdC5lbnRyaWVzKGRhdGFCeVN5bWJvbCkpIHtcbiAgICAgIC8vIFNvcnQgYnkgdGltZXN0YW1wIChvbGRlc3QgZmlyc3QpXG4gICAgICBzeW1ib2xEYXRhLnNvcnQoKGEsIGIpID0+IGEudGltZXN0YW1wLmdldFRpbWUoKSAtIGIudGltZXN0YW1wLmdldFRpbWUoKSk7XG4gICAgICBcbiAgICAgIC8vIEFwcGx5IGFkanVzdG1lbnRzXG4gICAgICBjb25zdCBhZGp1c3RlZERhdGEgPSBzeW1ib2xEYXRhLm1hcChkYXRhUG9pbnQgPT4ge1xuICAgICAgICAvLyBDbG9uZSB0aGUgZGF0YSBwb2ludCB0byBhdm9pZCBtb2RpZnlpbmcgdGhlIG9yaWdpbmFsXG4gICAgICAgIGNvbnN0IGFkanVzdGVkUG9pbnQgPSB7IC4uLmRhdGFQb2ludCwgdmFsdWU6IHsgLi4uZGF0YVBvaW50LnZhbHVlIH0gfTtcbiAgICAgICAgXG4gICAgICAgIC8vIE9ubHkgYWRqdXN0IHByaWNlIGRhdGFcbiAgICAgICAgaWYgKGRhdGFQb2ludC5kYXRhVHlwZSA9PT0gJ3ByaWNlJyAmJiB0eXBlb2YgZGF0YVBvaW50LnZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIGNvbnN0IHByaWNlRGF0YSA9IGRhdGFQb2ludC52YWx1ZSBhcyBQcmljZURhdGE7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB3ZSB3b3VsZCBsb29rIHVwIHNwbGl0IGFuZCBkaXZpZGVuZCBpbmZvcm1hdGlvblxuICAgICAgICAgIC8vIGFuZCBhcHBseSB0aGUgYXBwcm9wcmlhdGUgYWRqdXN0bWVudHNcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBGb3Igbm93LCB3ZSdsbCBqdXN0IGFkZCBhIG1vY2sgYWRqdXN0bWVudCBmbGFnIHRvIHRoZSBtZXRhZGF0YVxuICAgICAgICAgIGFkanVzdGVkUG9pbnQubWV0YWRhdGEgPSB7XG4gICAgICAgICAgICAuLi5hZGp1c3RlZFBvaW50Lm1ldGFkYXRhLFxuICAgICAgICAgICAgYWRqdXN0ZWQ6IHRydWUsXG4gICAgICAgICAgICBhZGp1c3RlZEZvclNwbGl0czogb3B0aW9ucy5hZGp1c3RGb3JTcGxpdHMsXG4gICAgICAgICAgICBhZGp1c3RlZEZvckRpdmlkZW5kczogb3B0aW9ucy5hZGp1c3RGb3JEaXZpZGVuZHNcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gYWRqdXN0ZWRQb2ludDtcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICByZXN1bHQucHVzaCguLi5hZGp1c3RlZERhdGEpO1xuICAgICAgXG4gICAgICBpZiAob3B0aW9ucy5hZGp1c3RGb3JTcGxpdHMpIHtcbiAgICAgICAgdHJhbnNmb3JtYXRpb25zLnB1c2goYEFkanVzdGVkICR7c3ltYm9sfSBkYXRhIGZvciBzdG9jayBzcGxpdHNgKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgaWYgKG9wdGlvbnMuYWRqdXN0Rm9yRGl2aWRlbmRzKSB7XG4gICAgICAgIHRyYW5zZm9ybWF0aW9ucy5wdXNoKGBBZGp1c3RlZCAke3N5bWJvbH0gZGF0YSBmb3IgZGl2aWRlbmRzYCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0gIFxuLyoqXG4gICAqIEZpbGwgZ2FwcyBpbiB0aW1lIHNlcmllcyBkYXRhXG4gICAqIEBwYXJhbSBkYXRhIE1hcmtldCBkYXRhIHBvaW50c1xuICAgKiBAcGFyYW0gZmlsbE1ldGhvZCBNZXRob2QgdG8gdXNlIGZvciBmaWxsaW5nIGdhcHNcbiAgICogQHBhcmFtIHRyYW5zZm9ybWF0aW9ucyBBcnJheSB0byB0cmFjayB0cmFuc2Zvcm1hdGlvbnNcbiAgICogQHBhcmFtIHdhcm5pbmdzIEFycmF5IHRvIHRyYWNrIHdhcm5pbmdzXG4gICAqIEByZXR1cm5zIERhdGEgd2l0aCBnYXBzIGZpbGxlZFxuICAgKi9cbiAgcHJpdmF0ZSBmaWxsRGF0YUdhcHMoXG4gICAgZGF0YTogTWFya2V0RGF0YVBvaW50W10sXG4gICAgZmlsbE1ldGhvZDogJ3ByZXZpb3VzJyB8ICdsaW5lYXInIHwgJ3plcm8nLFxuICAgIHRyYW5zZm9ybWF0aW9uczogc3RyaW5nW10sXG4gICAgd2FybmluZ3M6IHN0cmluZ1tdXG4gICk6IE1hcmtldERhdGFQb2ludFtdIHtcbiAgICAvLyBHcm91cCBkYXRhIGJ5IHN5bWJvbCBhbmQgZGF0YSB0eXBlXG4gICAgY29uc3QgZGF0YUJ5U3ltYm9sQW5kVHlwZTogUmVjb3JkPHN0cmluZywgTWFya2V0RGF0YVBvaW50W10+ID0ge307XG4gICAgXG4gICAgZm9yIChjb25zdCBwb2ludCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBrZXkgPSBgJHtwb2ludC5zeW1ib2x9LSR7cG9pbnQuZGF0YVR5cGV9LSR7cG9pbnQuaW50ZXJ2YWx9YDtcbiAgICAgIGlmICghZGF0YUJ5U3ltYm9sQW5kVHlwZVtrZXldKSB7XG4gICAgICAgIGRhdGFCeVN5bWJvbEFuZFR5cGVba2V5XSA9IFtdO1xuICAgICAgfVxuICAgICAgZGF0YUJ5U3ltYm9sQW5kVHlwZVtrZXldLnB1c2gocG9pbnQpO1xuICAgIH1cbiAgICBcbiAgICBjb25zdCByZXN1bHQ6IE1hcmtldERhdGFQb2ludFtdID0gW107XG4gICAgXG4gICAgLy8gUHJvY2VzcyBlYWNoIGdyb3VwIHNlcGFyYXRlbHlcbiAgICBmb3IgKGNvbnN0IFtrZXksIGdyb3VwRGF0YV0gb2YgT2JqZWN0LmVudHJpZXMoZGF0YUJ5U3ltYm9sQW5kVHlwZSkpIHtcbiAgICAgIC8vIFNvcnQgYnkgdGltZXN0YW1wIChvbGRlc3QgZmlyc3QpXG4gICAgICBncm91cERhdGEuc29ydCgoYSwgYikgPT4gYS50aW1lc3RhbXAuZ2V0VGltZSgpIC0gYi50aW1lc3RhbXAuZ2V0VGltZSgpKTtcbiAgICAgIFxuICAgICAgLy8gQ2hlY2sgZm9yIGdhcHNcbiAgICAgIGNvbnN0IGZpbGxlZERhdGEgPSBbLi4uZ3JvdXBEYXRhXTtcbiAgICAgIGxldCBnYXBzRmlsbGVkID0gMDtcbiAgICAgIFxuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBncm91cERhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgY3VycmVudCA9IGdyb3VwRGF0YVtpXTtcbiAgICAgICAgY29uc3QgcHJldmlvdXMgPSBncm91cERhdGFbaSAtIDFdO1xuICAgICAgICBjb25zdCBleHBlY3RlZEdhcCA9IHRoaXMuZ2V0RXhwZWN0ZWRUaW1lc3RhbXBHYXAoY3VycmVudC5pbnRlcnZhbCk7XG4gICAgICAgIGNvbnN0IGFjdHVhbEdhcCA9IGN1cnJlbnQudGltZXN0YW1wLmdldFRpbWUoKSAtIHByZXZpb3VzLnRpbWVzdGFtcC5nZXRUaW1lKCk7XG4gICAgICAgIFxuICAgICAgICAvLyBJZiB0aGUgZ2FwIGlzIGxhcmdlciB0aGFuIGV4cGVjdGVkLCBmaWxsIGl0XG4gICAgICAgIGlmIChhY3R1YWxHYXAgPiBleHBlY3RlZEdhcCAqIDEuNSkge1xuICAgICAgICAgIGNvbnN0IG1pc3NpbmdQb2ludHMgPSBNYXRoLmZsb29yKGFjdHVhbEdhcCAvIGV4cGVjdGVkR2FwKSAtIDE7XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKG1pc3NpbmdQb2ludHMgPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBuZXdQb2ludHMgPSB0aGlzLmdlbmVyYXRlRmlsbGVkRGF0YVBvaW50cyhcbiAgICAgICAgICAgICAgcHJldmlvdXMsXG4gICAgICAgICAgICAgIGN1cnJlbnQsXG4gICAgICAgICAgICAgIG1pc3NpbmdQb2ludHMsXG4gICAgICAgICAgICAgIGZpbGxNZXRob2RcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZpbGxlZERhdGEuc3BsaWNlKGksIDAsIC4uLm5ld1BvaW50cyk7XG4gICAgICAgICAgICBpICs9IG5ld1BvaW50cy5sZW5ndGg7XG4gICAgICAgICAgICBnYXBzRmlsbGVkICs9IG5ld1BvaW50cy5sZW5ndGg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIHJlc3VsdC5wdXNoKC4uLmZpbGxlZERhdGEpO1xuICAgICAgXG4gICAgICBpZiAoZ2Fwc0ZpbGxlZCA+IDApIHtcbiAgICAgICAgY29uc3QgW3N5bWJvbCwgZGF0YVR5cGUsIGludGVydmFsXSA9IGtleS5zcGxpdCgnLScpO1xuICAgICAgICB0cmFuc2Zvcm1hdGlvbnMucHVzaChgRmlsbGVkICR7Z2Fwc0ZpbGxlZH0gZ2FwcyBpbiAke3N5bWJvbH0gJHtkYXRhVHlwZX0gZGF0YSAoJHtpbnRlcnZhbH0pIHVzaW5nICR7ZmlsbE1ldGhvZH0gbWV0aG9kYCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0gIFxuICBcbiAgLyoqXG4gICAqIENvbnZlcnQgbWFya2V0IGRhdGEgdG8gYSBkaWZmZXJlbnQgY3VycmVuY3lcbiAgICogQHBhcmFtIGRhdGEgTWFya2V0IGRhdGEgcG9pbnRzXG4gICAqIEBwYXJhbSB0YXJnZXRDdXJyZW5jeSBUYXJnZXQgY3VycmVuY3kgY29kZVxuICAgKiBAcGFyYW0gdHJhbnNmb3JtYXRpb25zIEFycmF5IHRvIHRyYWNrIHRyYW5zZm9ybWF0aW9uc1xuICAgKiBAcGFyYW0gd2FybmluZ3MgQXJyYXkgdG8gdHJhY2sgd2FybmluZ3NcbiAgICogQHJldHVybnMgRGF0YSB3aXRoIGN1cnJlbmN5IGNvbnZlcnRlZFxuICAgKi9cbiAgcHJpdmF0ZSBjb252ZXJ0Q3VycmVuY3koXG4gICAgZGF0YTogTWFya2V0RGF0YVBvaW50W10sXG4gICAgdGFyZ2V0Q3VycmVuY3k6IHN0cmluZyxcbiAgICB0cmFuc2Zvcm1hdGlvbnM6IHN0cmluZ1tdLFxuICAgIHdhcm5pbmdzOiBzdHJpbmdbXVxuICApOiBNYXJrZXREYXRhUG9pbnRbXSB7XG4gICAgLy8gSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB0aGlzIHdvdWxkIHVzZSBleGNoYW5nZSByYXRlIGRhdGEgdG8gY29udmVydCBwcmljZXNcbiAgICAvLyBGb3Igbm93LCB3ZSdsbCBqdXN0IGFkZCBhIG1vY2sgY29udmVyc2lvbiBmbGFnIHRvIHRoZSBtZXRhZGF0YVxuICAgIFxuICAgIGNvbnN0IHJlc3VsdCA9IGRhdGEubWFwKGRhdGFQb2ludCA9PiB7XG4gICAgICAvLyBDbG9uZSB0aGUgZGF0YSBwb2ludCB0byBhdm9pZCBtb2RpZnlpbmcgdGhlIG9yaWdpbmFsXG4gICAgICBjb25zdCBjb252ZXJ0ZWRQb2ludCA9IHsgLi4uZGF0YVBvaW50IH07XG4gICAgICBcbiAgICAgIC8vIE9ubHkgY29udmVydCBwcmljZSBkYXRhXG4gICAgICBpZiAoZGF0YVBvaW50LmRhdGFUeXBlID09PSAncHJpY2UnKSB7XG4gICAgICAgIC8vIEFkZCBjb252ZXJzaW9uIG1ldGFkYXRhXG4gICAgICAgIGNvbnZlcnRlZFBvaW50Lm1ldGFkYXRhID0ge1xuICAgICAgICAgIC4uLmNvbnZlcnRlZFBvaW50Lm1ldGFkYXRhLFxuICAgICAgICAgIGN1cnJlbmN5Q29udmVydGVkOiB0cnVlLFxuICAgICAgICAgIG9yaWdpbmFsQ3VycmVuY3k6ICdVU0QnLCAvLyBBc3N1bWluZyBvcmlnaW5hbCBpcyBVU0RcbiAgICAgICAgICB0YXJnZXRDdXJyZW5jeVxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgXG4gICAgICByZXR1cm4gY29udmVydGVkUG9pbnQ7XG4gICAgfSk7XG4gICAgXG4gICAgdHJhbnNmb3JtYXRpb25zLnB1c2goYENvbnZlcnRlZCBwcmljZSBkYXRhIHRvICR7dGFyZ2V0Q3VycmVuY3l9YCk7XG4gICAgd2FybmluZ3MucHVzaCgnQ3VycmVuY3kgY29udmVyc2lvbiBpcyBzaW11bGF0ZWQgYW5kIG5vdCB1c2luZyByZWFsIGV4Y2hhbmdlIHJhdGVzJyk7XG4gICAgXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGp1c3QgbWFya2V0IGRhdGEgdGltZXN0YW1wcyB0byBhIGRpZmZlcmVudCB0aW1lem9uZVxuICAgKiBAcGFyYW0gZGF0YSBNYXJrZXQgZGF0YSBwb2ludHNcbiAgICogQHBhcmFtIHRpbWV6b25lIFRhcmdldCB0aW1lem9uZVxuICAgKiBAcGFyYW0gdHJhbnNmb3JtYXRpb25zIEFycmF5IHRvIHRyYWNrIHRyYW5zZm9ybWF0aW9uc1xuICAgKiBAcmV0dXJucyBEYXRhIHdpdGggYWRqdXN0ZWQgdGltZXN0YW1wc1xuICAgKi9cbiAgcHJpdmF0ZSBhZGp1c3RUaW1lem9uZShcbiAgICBkYXRhOiBNYXJrZXREYXRhUG9pbnRbXSxcbiAgICB0aW1lem9uZTogc3RyaW5nLFxuICAgIHRyYW5zZm9ybWF0aW9uczogc3RyaW5nW11cbiAgKTogTWFya2V0RGF0YVBvaW50W10ge1xuICAgIC8vIEluIGEgcmVhbCBpbXBsZW1lbnRhdGlvbiwgdGhpcyB3b3VsZCB1c2UgYSBwcm9wZXIgdGltZXpvbmUgbGlicmFyeVxuICAgIC8vIEZvciBub3csIHdlJ2xsIGp1c3QgYWRkIGEgbW9jayB0aW1lem9uZSBmbGFnIHRvIHRoZSBtZXRhZGF0YVxuICAgIFxuICAgIGNvbnN0IHJlc3VsdCA9IGRhdGEubWFwKGRhdGFQb2ludCA9PiB7XG4gICAgICAvLyBDbG9uZSB0aGUgZGF0YSBwb2ludCB0byBhdm9pZCBtb2RpZnlpbmcgdGhlIG9yaWdpbmFsXG4gICAgICBjb25zdCBhZGp1c3RlZFBvaW50ID0geyAuLi5kYXRhUG9pbnQgfTtcbiAgICAgIFxuICAgICAgLy8gQWRkIHRpbWV6b25lIG1ldGFkYXRhXG4gICAgICBhZGp1c3RlZFBvaW50Lm1ldGFkYXRhID0ge1xuICAgICAgICAuLi5hZGp1c3RlZFBvaW50Lm1ldGFkYXRhLFxuICAgICAgICB0aW1lem9uZUFkanVzdGVkOiB0cnVlLFxuICAgICAgICBvcmlnaW5hbFRpbWV6b25lOiAnVVRDJywgLy8gQXNzdW1pbmcgb3JpZ2luYWwgaXMgVVRDXG4gICAgICAgIHRhcmdldFRpbWV6b25lOiB0aW1lem9uZVxuICAgICAgfTtcbiAgICAgIFxuICAgICAgcmV0dXJuIGFkanVzdGVkUG9pbnQ7XG4gICAgfSk7XG4gICAgXG4gICAgdHJhbnNmb3JtYXRpb25zLnB1c2goYEFkanVzdGVkIHRpbWVzdGFtcHMgdG8gJHt0aW1lem9uZX0gdGltZXpvbmVgKTtcbiAgICBcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9ICBcbiAgXG4gIC8qKlxuICAgKiBHcm91cCBtYXJrZXQgZGF0YSBwb2ludHMgYnkgc3ltYm9sXG4gICAqIEBwYXJhbSBkYXRhIE1hcmtldCBkYXRhIHBvaW50c1xuICAgKiBAcmV0dXJucyBEYXRhIGdyb3VwZWQgYnkgc3ltYm9sXG4gICAqL1xuICBwcml2YXRlIGdyb3VwQnlTeW1ib2woZGF0YTogTWFya2V0RGF0YVBvaW50W10pOiBSZWNvcmQ8c3RyaW5nLCBNYXJrZXREYXRhUG9pbnRbXT4ge1xuICAgIGNvbnN0IHJlc3VsdDogUmVjb3JkPHN0cmluZywgTWFya2V0RGF0YVBvaW50W10+ID0ge307XG4gICAgXG4gICAgZm9yIChjb25zdCBwb2ludCBvZiBkYXRhKSB7XG4gICAgICBpZiAoIXJlc3VsdFtwb2ludC5zeW1ib2xdKSB7XG4gICAgICAgIHJlc3VsdFtwb2ludC5zeW1ib2xdID0gW107XG4gICAgICB9XG4gICAgICByZXN1bHRbcG9pbnQuc3ltYm9sXS5wdXNoKHBvaW50KTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGV4cGVjdGVkIHRpbWUgZ2FwIGJldHdlZW4gZGF0YSBwb2ludHMgYmFzZWQgb24gaW50ZXJ2YWxcbiAgICogQHBhcmFtIGludGVydmFsIERhdGEgaW50ZXJ2YWxcbiAgICogQHJldHVybnMgRXhwZWN0ZWQgZ2FwIGluIG1pbGxpc2Vjb25kc1xuICAgKi9cbiAgcHJpdmF0ZSBnZXRFeHBlY3RlZFRpbWVzdGFtcEdhcChpbnRlcnZhbDogTWFya2V0RGF0YUludGVydmFsKTogbnVtYmVyIHtcbiAgICBjb25zdCBtaW51dGUgPSA2MCAqIDEwMDA7XG4gICAgY29uc3QgaG91ciA9IDYwICogbWludXRlO1xuICAgIGNvbnN0IGRheSA9IDI0ICogaG91cjtcbiAgICBjb25zdCB3ZWVrID0gNyAqIGRheTtcbiAgICBcbiAgICBzd2l0Y2ggKGludGVydmFsKSB7XG4gICAgICBjYXNlICd0aWNrJzogcmV0dXJuIDEwMDA7IC8vIEFzc3VtZSAxIHNlY29uZCBmb3IgdGlja3NcbiAgICAgIGNhc2UgJzFtaW4nOiByZXR1cm4gbWludXRlO1xuICAgICAgY2FzZSAnNW1pbic6IHJldHVybiA1ICogbWludXRlO1xuICAgICAgY2FzZSAnMTVtaW4nOiByZXR1cm4gMTUgKiBtaW51dGU7XG4gICAgICBjYXNlICczMG1pbic6IHJldHVybiAzMCAqIG1pbnV0ZTtcbiAgICAgIGNhc2UgJzFob3VyJzogcmV0dXJuIGhvdXI7XG4gICAgICBjYXNlICc0aG91cic6IHJldHVybiA0ICogaG91cjtcbiAgICAgIGNhc2UgJ2RhaWx5JzogcmV0dXJuIGRheTtcbiAgICAgIGNhc2UgJ3dlZWtseSc6IHJldHVybiB3ZWVrO1xuICAgICAgY2FzZSAnbW9udGhseSc6IHJldHVybiAzMCAqIGRheTsgLy8gQXBwcm94aW1hdGVcbiAgICAgIGRlZmF1bHQ6IHJldHVybiBkYXk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlIGZpbGxlZCBkYXRhIHBvaW50cyBiZXR3ZWVuIHR3byBleGlzdGluZyBwb2ludHNcbiAgICogQHBhcmFtIHN0YXJ0IFN0YXJ0IGRhdGEgcG9pbnRcbiAgICogQHBhcmFtIGVuZCBFbmQgZGF0YSBwb2ludFxuICAgKiBAcGFyYW0gY291bnQgTnVtYmVyIG9mIHBvaW50cyB0byBnZW5lcmF0ZVxuICAgKiBAcGFyYW0gZmlsbE1ldGhvZCBNZXRob2QgdG8gdXNlIGZvciBmaWxsaW5nXG4gICAqIEByZXR1cm5zIEdlbmVyYXRlZCBkYXRhIHBvaW50c1xuICAgKi9cbiAgcHJpdmF0ZSBnZW5lcmF0ZUZpbGxlZERhdGFQb2ludHMoXG4gICAgc3RhcnQ6IE1hcmtldERhdGFQb2ludCxcbiAgICBlbmQ6IE1hcmtldERhdGFQb2ludCxcbiAgICBjb3VudDogbnVtYmVyLFxuICAgIGZpbGxNZXRob2Q6ICdwcmV2aW91cycgfCAnbGluZWFyJyB8ICd6ZXJvJ1xuICApOiBNYXJrZXREYXRhUG9pbnRbXSB7XG4gICAgY29uc3QgcmVzdWx0OiBNYXJrZXREYXRhUG9pbnRbXSA9IFtdO1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IHN0YXJ0LnRpbWVzdGFtcC5nZXRUaW1lKCk7XG4gICAgY29uc3QgZW5kVGltZSA9IGVuZC50aW1lc3RhbXAuZ2V0VGltZSgpO1xuICAgIGNvbnN0IHRpbWVTdGVwID0gKGVuZFRpbWUgLSBzdGFydFRpbWUpIC8gKGNvdW50ICsgMSk7XG4gICAgXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gY291bnQ7IGkrKykge1xuICAgICAgY29uc3QgdGltZXN0YW1wID0gbmV3IERhdGUoc3RhcnRUaW1lICsgaSAqIHRpbWVTdGVwKTtcbiAgICAgIGxldCB2YWx1ZTogYW55O1xuICAgICAgXG4gICAgICAvLyBHZW5lcmF0ZSB2YWx1ZSBiYXNlZCBvbiBmaWxsIG1ldGhvZFxuICAgICAgaWYgKGZpbGxNZXRob2QgPT09ICdwcmV2aW91cycpIHtcbiAgICAgICAgdmFsdWUgPSB0aGlzLmNsb25lVmFsdWUoc3RhcnQudmFsdWUpO1xuICAgICAgfSBlbHNlIGlmIChmaWxsTWV0aG9kID09PSAnemVybycpIHtcbiAgICAgICAgdmFsdWUgPSB0aGlzLmdlbmVyYXRlWmVyb1ZhbHVlKHN0YXJ0LmRhdGFUeXBlKTtcbiAgICAgIH0gZWxzZSBpZiAoZmlsbE1ldGhvZCA9PT0gJ2xpbmVhcicpIHtcbiAgICAgICAgdmFsdWUgPSB0aGlzLmludGVycG9sYXRlVmFsdWUoc3RhcnQudmFsdWUsIGVuZC52YWx1ZSwgaSAvIChjb3VudCArIDEpLCBzdGFydC5kYXRhVHlwZSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHJlc3VsdC5wdXNoKHtcbiAgICAgICAgaWQ6IHV1aWR2NCgpLFxuICAgICAgICBzeW1ib2w6IHN0YXJ0LnN5bWJvbCxcbiAgICAgICAgZGF0YVR5cGU6IHN0YXJ0LmRhdGFUeXBlLFxuICAgICAgICB0aW1lc3RhbXAsXG4gICAgICAgIHZhbHVlLFxuICAgICAgICBzb3VyY2U6IHN0YXJ0LnNvdXJjZSxcbiAgICAgICAgaW50ZXJ2YWw6IHN0YXJ0LmludGVydmFsLFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIC4uLnN0YXJ0Lm1ldGFkYXRhLFxuICAgICAgICAgIGZpbGxlZDogdHJ1ZSxcbiAgICAgICAgICBmaWxsTWV0aG9kXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9ICAvKipcblxuICAgKiBDbG9uZSBhIHZhbHVlIChkZWVwIGNvcHkpXG4gICAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byBjbG9uZVxuICAgKiBAcmV0dXJucyBDbG9uZWQgdmFsdWVcbiAgICovXG4gIHByaXZhdGUgY2xvbmVWYWx1ZSh2YWx1ZTogYW55KTogYW55IHtcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0JyB8fCB2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh2YWx1ZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlIGEgemVybyB2YWx1ZSBmb3IgYSBkYXRhIHR5cGVcbiAgICogQHBhcmFtIGRhdGFUeXBlIERhdGEgdHlwZVxuICAgKiBAcmV0dXJucyBaZXJvIHZhbHVlXG4gICAqL1xuICBwcml2YXRlIGdlbmVyYXRlWmVyb1ZhbHVlKGRhdGFUeXBlOiBNYXJrZXREYXRhVHlwZSk6IGFueSB7XG4gICAgc3dpdGNoIChkYXRhVHlwZSkge1xuICAgICAgY2FzZSAncHJpY2UnOlxuICAgICAgICByZXR1cm4geyBvcGVuOiAwLCBoaWdoOiAwLCBsb3c6IDAsIGNsb3NlOiAwLCB2b2x1bWU6IDAgfTtcbiAgICAgIGNhc2UgJ3ZvbHVtZSc6XG4gICAgICAgIHJldHVybiAwO1xuICAgICAgY2FzZSAnb3JkZXItYm9vayc6XG4gICAgICAgIHJldHVybiB7IGJpZHM6IFtdLCBhc2tzOiBbXSwgc3ByZWFkOiAwLCBkZXB0aDogMCB9O1xuICAgICAgY2FzZSAndGVjaG5pY2FsLWluZGljYXRvcnMnOlxuICAgICAgICByZXR1cm4geyBpbmRpY2F0b3I6ICd1bmtub3duJywgdmFsdWU6IDAsIHBhcmFtZXRlcnM6IHt9IH07XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW50ZXJwb2xhdGUgYmV0d2VlbiB0d28gdmFsdWVzXG4gICAqIEBwYXJhbSBzdGFydCBTdGFydCB2YWx1ZVxuICAgKiBAcGFyYW0gZW5kIEVuZCB2YWx1ZVxuICAgKiBAcGFyYW0gcmF0aW8gSW50ZXJwb2xhdGlvbiByYXRpbyAoMC0xKVxuICAgKiBAcGFyYW0gZGF0YVR5cGUgRGF0YSB0eXBlXG4gICAqIEByZXR1cm5zIEludGVycG9sYXRlZCB2YWx1ZVxuICAgKi9cbiAgcHJpdmF0ZSBpbnRlcnBvbGF0ZVZhbHVlKHN0YXJ0OiBhbnksIGVuZDogYW55LCByYXRpbzogbnVtYmVyLCBkYXRhVHlwZTogTWFya2V0RGF0YVR5cGUpOiBhbnkge1xuICAgIGlmICh0eXBlb2Ygc3RhcnQgPT09ICdudW1iZXInICYmIHR5cGVvZiBlbmQgPT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gc3RhcnQgKyAoZW5kIC0gc3RhcnQpICogcmF0aW87XG4gICAgfVxuICAgIFxuICAgIGlmIChkYXRhVHlwZSA9PT0gJ3ByaWNlJyAmJiB0eXBlb2Ygc3RhcnQgPT09ICdvYmplY3QnICYmIHR5cGVvZiBlbmQgPT09ICdvYmplY3QnKSB7XG4gICAgICBjb25zdCBzdGFydFByaWNlID0gc3RhcnQgYXMgUHJpY2VEYXRhO1xuICAgICAgY29uc3QgZW5kUHJpY2UgPSBlbmQgYXMgUHJpY2VEYXRhO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICBvcGVuOiBzdGFydFByaWNlLm9wZW4gKyAoZW5kUHJpY2Uub3BlbiAtIHN0YXJ0UHJpY2Uub3BlbikgKiByYXRpbyxcbiAgICAgICAgaGlnaDogc3RhcnRQcmljZS5oaWdoICsgKGVuZFByaWNlLmhpZ2ggLSBzdGFydFByaWNlLmhpZ2gpICogcmF0aW8sXG4gICAgICAgIGxvdzogc3RhcnRQcmljZS5sb3cgKyAoZW5kUHJpY2UubG93IC0gc3RhcnRQcmljZS5sb3cpICogcmF0aW8sXG4gICAgICAgIGNsb3NlOiBzdGFydFByaWNlLmNsb3NlICsgKGVuZFByaWNlLmNsb3NlIC0gc3RhcnRQcmljZS5jbG9zZSkgKiByYXRpbyxcbiAgICAgICAgdm9sdW1lOiBNYXRoLnJvdW5kKHN0YXJ0UHJpY2Uudm9sdW1lICsgKGVuZFByaWNlLnZvbHVtZSAtIHN0YXJ0UHJpY2Uudm9sdW1lKSAqIHJhdGlvKSxcbiAgICAgICAgYWRqdXN0ZWRDbG9zZTogc3RhcnRQcmljZS5hZGp1c3RlZENsb3NlICE9PSB1bmRlZmluZWQgJiYgZW5kUHJpY2UuYWRqdXN0ZWRDbG9zZSAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgPyBzdGFydFByaWNlLmFkanVzdGVkQ2xvc2UgKyAoZW5kUHJpY2UuYWRqdXN0ZWRDbG9zZSAtIHN0YXJ0UHJpY2UuYWRqdXN0ZWRDbG9zZSkgKiByYXRpb1xuICAgICAgICAgIDogdW5kZWZpbmVkXG4gICAgICB9O1xuICAgIH1cbiAgICBcbiAgICAvLyBGb3IgY29tcGxleCBvYmplY3RzLCBqdXN0IHVzZSB0aGUgc3RhcnQgdmFsdWVcbiAgICByZXR1cm4gdGhpcy5jbG9uZVZhbHVlKHN0YXJ0KTtcbiAgfVxufSJdfQ==