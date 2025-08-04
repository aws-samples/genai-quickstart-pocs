"use strict";
/**
 * Alpha Vantage market data provider implementation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlphaVantageProvider = void 0;
const uuid_1 = require("uuid");
/**
 * Alpha Vantage API client implementation
 */
class AlphaVantageProvider {
    constructor() {
        this.apiKey = '';
        this.baseUrl = 'https://www.alphavantage.co/query';
        this.connected = false;
        this.activeSymbols = [];
        this.activeDataTypes = [];
        this.activeInterval = 'daily';
        this.lastUpdated = new Date();
        this.connectionId = '';
        this.requestsPerMinute = 0;
        this.maxRequestsPerMinute = 5; // Alpha Vantage free tier limit
        this.throttled = false;
        this.errors = [];
    }
    /**
     * Connect to Alpha Vantage API
     * @param config Market data feed configuration
     * @returns Connection status
     */
    async connect(config) {
        try {
            // Validate API key
            if (!config.apiKey) {
                throw new Error('API key is required for Alpha Vantage');
            }
            this.apiKey = config.apiKey;
            this.activeSymbols = config.symbols;
            this.activeDataTypes = config.dataTypes;
            this.activeInterval = config.interval;
            this.connectionId = (0, uuid_1.v4)();
            this.connected = true;
            this.lastUpdated = new Date();
            this.errors = [];
            // Test connection with a simple request
            await this.testConnection();
            return this.getStatus();
        }
        catch (error) {
            this.connected = false;
            this.errors.push(error instanceof Error ? error.message : 'Unknown error during connection');
            return this.getStatus();
        }
    }
    /**
     * Disconnect from Alpha Vantage API
     */
    async disconnect() {
        this.connected = false;
        this.activeSymbols = [];
        this.activeDataTypes = [];
        this.connectionId = '';
    }
    /**
     * Get connection status
     * @returns Connection status
     */
    getStatus() {
        return {
            provider: 'alpha-vantage',
            connected: this.connected,
            connectionId: this.connectionId,
            latency: 150,
            lastUpdated: this.lastUpdated,
            activeSymbols: this.activeSymbols.length,
            activeDataTypes: this.activeDataTypes,
            errors: this.errors.length > 0 ? this.errors : undefined,
            throttleStatus: {
                requestsPerMinute: this.requestsPerMinute,
                maxRequestsPerMinute: this.maxRequestsPerMinute,
                throttled: this.throttled
            }
        };
    }
    /**
     * Subscribe to market data
     * @param symbols Symbols to subscribe to
     * @param dataTypes Data types to subscribe to
     * @param interval Data interval
     */
    async subscribeToData(symbols, dataTypes, interval) {
        if (!this.connected) {
            throw new Error('Not connected to Alpha Vantage API');
        }
        // Update active subscriptions
        this.activeSymbols = [...new Set([...this.activeSymbols, ...symbols])];
        this.activeDataTypes = [...new Set([...this.activeDataTypes, ...dataTypes])];
        this.activeInterval = interval;
        this.lastUpdated = new Date();
    }
    /**
     * Unsubscribe from market data
     * @param symbols Symbols to unsubscribe from
     * @param dataTypes Data types to unsubscribe from
     */
    async unsubscribeFromData(symbols, dataTypes) {
        if (!this.connected) {
            throw new Error('Not connected to Alpha Vantage API');
        }
        // Update active subscriptions
        this.activeSymbols = this.activeSymbols.filter(s => !symbols.includes(s));
        this.activeDataTypes = this.activeDataTypes.filter(t => !dataTypes.includes(t));
        this.lastUpdated = new Date();
    }
    /**
     * Get historical market data
     * @param query Market data query
     * @returns Market data points
     */
    async getHistoricalData(query) {
        if (!this.connected) {
            throw new Error('Not connected to Alpha Vantage API');
        }
        try {
            const results = [];
            // Check if we're being throttled
            if (this.throttled) {
                throw new Error('API rate limit exceeded. Please try again later.');
            }
            // Increment request counter
            this.requestsPerMinute++;
            if (this.requestsPerMinute >= this.maxRequestsPerMinute) {
                this.throttled = true;
                setTimeout(() => {
                    this.throttled = false;
                    this.requestsPerMinute = 0;
                }, 60000); // Reset after 1 minute
            }
            // Process each symbol
            for (const symbol of query.symbols) {
                // Process each data type
                for (const dataType of query.dataTypes) {
                    // Get data based on type
                    const dataPoints = await this.fetchData(symbol, dataType, query.interval || this.activeInterval, query.timeRange);
                    results.push(...dataPoints);
                }
            }
            return results;
        }
        catch (error) {
            this.errors.push(error instanceof Error ? error.message : 'Unknown error fetching historical data');
            throw error;
        }
    }
    // Private helper methods
    /**
     * Test connection to Alpha Vantage API
     */
    async testConnection() {
        try {
            // Make a simple request to test the connection
            const url = `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=IBM&apikey=${this.apiKey}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            const data = await response.json();
            if (data['Error Message']) {
                throw new Error(data['Error Message']);
            }
            if (data['Note'] && data['Note'].includes('API call frequency')) {
                this.throttled = true;
                this.errors.push('API rate limit exceeded');
            }
        }
        catch (error) {
            throw new Error(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Fetch data from Alpha Vantage API
     * @param symbol Symbol to fetch data for
     * @param dataType Data type to fetch
     * @param interval Data interval
     * @param timeRange Time range to fetch data for
     * @returns Market data points
     */
    async fetchData(symbol, dataType, interval, timeRange) {
        // In a real implementation, this would make actual API calls to Alpha Vantage
        // For now, we'll generate mock data
        const results = [];
        const startTime = timeRange.start.getTime();
        const endTime = timeRange.end.getTime();
        const intervalMs = this.getIntervalMilliseconds(interval);
        // Generate data points at the specified interval
        for (let timestamp = startTime; timestamp <= endTime; timestamp += intervalMs) {
            const dataPoint = this.generateMockDataPoint(symbol, dataType, new Date(timestamp), interval);
            results.push(dataPoint);
        }
        return results;
    }
    /**
     * Generate a mock data point
     * @param symbol Symbol
     * @param dataType Data type
     * @param timestamp Timestamp
     * @param interval Interval
     * @returns Mock data point
     */
    generateMockDataPoint(symbol, dataType, timestamp, interval) {
        // Base price - use a hash of the symbol to get a consistent base price
        const basePrice = this.getBasePrice(symbol);
        // Generate value based on data type
        let value;
        switch (dataType) {
            case 'price':
                value = this.generatePriceData(basePrice, timestamp);
                break;
            case 'volume':
                value = this.generateVolumeData(symbol, timestamp);
                break;
            case 'technical-indicators':
                value = this.generateTechnicalIndicatorData(basePrice, timestamp);
                break;
            case 'news-sentiment':
                value = this.generateNewsSentimentData(symbol, timestamp);
                break;
            default:
                value = basePrice;
        }
        return {
            id: (0, uuid_1.v4)(),
            symbol,
            dataType,
            timestamp,
            value,
            source: 'alpha-vantage',
            interval,
            metadata: {
                generated: 'mock',
                apiVersion: '1.0'
            }
        };
    }
    /**
     * Get interval in milliseconds
     * @param interval Interval
     * @returns Interval in milliseconds
     */
    getIntervalMilliseconds(interval) {
        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;
        switch (interval) {
            case 'tick': return 1000;
            case '1min': return minute;
            case '5min': return 5 * minute;
            case '15min': return 15 * minute;
            case '30min': return 30 * minute;
            case '1hour': return hour;
            case '4hour': return 4 * hour;
            case 'daily': return day;
            case 'weekly': return 7 * day;
            case 'monthly': return 30 * day;
            default: return day;
        }
    }
    /**
     * Get base price for a symbol
     * @param symbol Symbol
     * @returns Base price
     */
    getBasePrice(symbol) {
        // Simple hash function to get a consistent base price for a symbol
        let hash = 0;
        for (let i = 0; i < symbol.length; i++) {
            hash = ((hash << 5) - hash) + symbol.charCodeAt(i);
            hash |= 0; // Convert to 32bit integer
        }
        // Generate a price between $10 and $500
        return Math.abs(hash % 490) + 10;
    }
    /**
     * Generate mock price data
     * @param basePrice Base price
     * @param timestamp Timestamp
     * @returns Mock price data
     */
    generatePriceData(basePrice, timestamp) {
        // Add some randomness based on the timestamp
        const dayFactor = Math.sin(timestamp.getTime() / (24 * 60 * 60 * 1000)) * 0.05;
        const hourFactor = Math.sin(timestamp.getTime() / (60 * 60 * 1000)) * 0.02;
        const minuteFactor = Math.sin(timestamp.getTime() / (60 * 1000)) * 0.01;
        const priceFactor = 1 + dayFactor + hourFactor + minuteFactor;
        const price = basePrice * priceFactor;
        // Generate OHLC data
        const open = price;
        const volatility = basePrice * 0.02; // 2% volatility
        const high = open + (Math.random() * volatility);
        const low = Math.max(0.1, open - (Math.random() * volatility));
        const close = low + (Math.random() * (high - low));
        // Generate volume
        const volume = Math.floor(basePrice * 1000 * (0.5 + Math.random()));
        return {
            open,
            high,
            low,
            close,
            volume,
            adjustedClose: close
        };
    }
    /**
     * Generate mock volume data
     * @param symbol Symbol
     * @param timestamp Timestamp
     * @returns Mock volume data
     */
    generateVolumeData(symbol, timestamp) {
        const baseVolume = this.getBasePrice(symbol) * 1000;
        const hourOfDay = timestamp.getUTCHours();
        // Volume is typically higher at market open and close
        let volumeFactor = 1.0;
        if (hourOfDay < 2 || hourOfDay > 14) {
            volumeFactor = 1.5;
        }
        else if (hourOfDay > 5 && hourOfDay < 11) {
            volumeFactor = 0.7;
        }
        return Math.floor(baseVolume * volumeFactor * (0.5 + Math.random()));
    }
    /**
     * Generate mock technical indicator data
     * @param basePrice Base price
     * @param timestamp Timestamp
     * @returns Mock technical indicator data
     */
    generateTechnicalIndicatorData(basePrice, timestamp) {
        // Generate a random technical indicator
        const indicators = ['RSI', 'MACD', 'SMA', 'EMA', 'Bollinger Bands'];
        const indicator = indicators[Math.floor(Math.random() * indicators.length)];
        let value;
        let parameters = {};
        switch (indicator) {
            case 'RSI':
                value = 30 + Math.random() * 40; // RSI between 30 and 70
                parameters = { period: 14 };
                break;
            case 'MACD':
                value = -5 + Math.random() * 10; // MACD between -5 and 5
                parameters = { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 };
                break;
            case 'SMA':
                value = basePrice * (0.9 + Math.random() * 0.2); // SMA around base price
                parameters = { period: 20 };
                break;
            case 'EMA':
                value = basePrice * (0.9 + Math.random() * 0.2); // EMA around base price
                parameters = { period: 20 };
                break;
            case 'Bollinger Bands':
                value = basePrice;
                parameters = {
                    period: 20,
                    stdDev: 2,
                    upper: basePrice * 1.1,
                    middle: basePrice,
                    lower: basePrice * 0.9
                };
                break;
            default:
                value = basePrice;
                parameters = {};
        }
        return {
            indicator,
            value,
            parameters
        };
    }
    /**
     * Generate mock news sentiment data
     * @param symbol Symbol
     * @param timestamp Timestamp
     * @returns Mock news sentiment data
     */
    generateNewsSentimentData(symbol, timestamp) {
        // Generate random sentiment
        const sentimentValue = -1 + Math.random() * 2; // Between -1 and 1
        let sentiment;
        if (sentimentValue < -0.6) {
            sentiment = 'very-negative';
        }
        else if (sentimentValue < -0.2) {
            sentiment = 'negative';
        }
        else if (sentimentValue < 0.2) {
            sentiment = 'neutral';
        }
        else if (sentimentValue < 0.6) {
            sentiment = 'positive';
        }
        else {
            sentiment = 'very-positive';
        }
        // Generate random article count
        const articleCount = Math.floor(Math.random() * 50) + 1;
        // Generate random sources
        const possibleSources = [
            'Bloomberg', 'Reuters', 'CNBC', 'Wall Street Journal', 'Financial Times',
            'MarketWatch', 'Seeking Alpha', 'Barron\'s', 'The Economist', 'Forbes'
        ];
        const sourceCount = Math.floor(Math.random() * 5) + 1;
        const sources = [];
        for (let i = 0; i < sourceCount; i++) {
            const sourceIndex = Math.floor(Math.random() * possibleSources.length);
            sources.push(possibleSources[sourceIndex]);
        }
        // Generate random keywords
        const possibleKeywords = [
            'earnings', 'revenue', 'growth', 'profit', 'loss',
            'merger', 'acquisition', 'dividend', 'CEO', 'strategy',
            'product', 'launch', 'market', 'competition', 'regulation'
        ];
        const keywordCount = Math.floor(Math.random() * 5) + 1;
        const keywords = [];
        for (let i = 0; i < keywordCount; i++) {
            const keywordIndex = Math.floor(Math.random() * possibleKeywords.length);
            keywords.push(possibleKeywords[keywordIndex]);
        }
        return {
            sentiment,
            score: sentimentValue,
            articleCount,
            sources,
            keywords
        };
    }
}
exports.AlphaVantageProvider = AlphaVantageProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxwaGEtdmFudGFnZS1wcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9wcm92aWRlcnMvYWxwaGEtdmFudGFnZS1wcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7OztBQUVILCtCQUFvQztBQVlwQzs7R0FFRztBQUNILE1BQWEsb0JBQW9CO0lBQWpDO1FBQ1UsV0FBTSxHQUFXLEVBQUUsQ0FBQztRQUNwQixZQUFPLEdBQVcsbUNBQW1DLENBQUM7UUFDdEQsY0FBUyxHQUFZLEtBQUssQ0FBQztRQUMzQixrQkFBYSxHQUFhLEVBQUUsQ0FBQztRQUM3QixvQkFBZSxHQUFxQixFQUFFLENBQUM7UUFDdkMsbUJBQWMsR0FBdUIsT0FBTyxDQUFDO1FBQzdDLGdCQUFXLEdBQVMsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUMvQixpQkFBWSxHQUFXLEVBQUUsQ0FBQztRQUMxQixzQkFBaUIsR0FBVyxDQUFDLENBQUM7UUFDOUIseUJBQW9CLEdBQVcsQ0FBQyxDQUFDLENBQUMsZ0NBQWdDO1FBQ2xFLGNBQVMsR0FBWSxLQUFLLENBQUM7UUFDM0IsV0FBTSxHQUFhLEVBQUUsQ0FBQztJQThkaEMsQ0FBQztJQTVkQzs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUE0QjtRQUN4QyxJQUFJO1lBQ0YsbUJBQW1CO1lBQ25CLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO2dCQUNsQixNQUFNLElBQUksS0FBSyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7YUFDMUQ7WUFFRCxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDNUIsSUFBSSxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxlQUFlLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztZQUN4QyxJQUFJLENBQUMsY0FBYyxHQUFHLE1BQU0s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LEVBQUUsRUFBRTtZQUNyQyxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN6RSxRQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7U0FDL0M7UUFFRCxPQUFPO1lBQ0wsU0FBUztZQUNULEtBQUssRUFBRSxjQUFjO1lBQ3JCLFlBQVk7WUFDWixPQUFPO1lBQ1AsUUFBUTtTQUNULENBQUM7SUFDSixDQUFDO0NBQ0Y7QUExZUQsb0RBMGVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBBbHBoYSBWYW50YWdlIG1hcmtldCBkYXRhIHByb3ZpZGVyIGltcGxlbWVudGF0aW9uXG4gKi9cblxuaW1wb3J0IHsgdjQgYXMgdXVpZHY0IH0gZnJvbSAndXVpZCc7XG5pbXBvcnQge1xuICBNYXJrZXREYXRhRmVlZENvbmZpZyxcbiAgTWFya2V0RGF0YVBvaW50LFxuICBNYXJrZXREYXRhVHlwZSxcbiAgTWFya2V0RGF0YUludGVydmFsLFxuICBNYXJrZXREYXRhRmVlZFN0YXR1cyxcbiAgTWFya2V0RGF0YVF1ZXJ5LFxuICBQcmljZURhdGFcbn0gZnJvbSAnLi4vLi4vbW9kZWxzL21hcmtldC1kYXRhJztcbmltcG9ydCB7IE1hcmtldERhdGFQcm92aWRlciB9IGZyb20gJy4uL21hcmtldC1kYXRhLXNlcnZpY2UnO1xuXG4vKipcbiAqIEFscGhhIFZhbnRhZ2UgQVBJIGNsaWVudCBpbXBsZW1lbnRhdGlvblxuICovXG5leHBvcnQgY2xhc3MgQWxwaGFWYW50YWdlUHJvdmlkZXIgaW1wbGVtZW50cyBNYXJrZXREYXRhUHJvdmlkZXIge1xuICBwcml2YXRlIGFwaUtleTogc3RyaW5nID0gJyc7XG4gIHByaXZhdGUgYmFzZVVybDogc3RyaW5nID0gJ2h0dHBzOi8vd3d3LmFscGhhdmFudGFnZS5jby9xdWVyeSc7XG4gIHByaXZhdGUgY29ubmVjdGVkOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgYWN0aXZlU3ltYm9sczogc3RyaW5nW10gPSBbXTtcbiAgcHJpdmF0ZSBhY3RpdmVEYXRhVHlwZXM6IE1hcmtldERhdGFUeXBlW10gPSBbXTtcbiAgcHJpdmF0ZSBhY3RpdmVJbnRlcnZhbDogTWFya2V0RGF0YUludGVydmFsID0gJ2RhaWx5JztcbiAgcHJpdmF0ZSBsYXN0VXBkYXRlZDogRGF0ZSA9IG5ldyBEYXRlKCk7XG4gIHByaXZhdGUgY29ubmVjdGlvbklkOiBzdHJpbmcgPSAnJztcbiAgcHJpdmF0ZSByZXF1ZXN0c1Blck1pbnV0ZTogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBtYXhSZXF1ZXN0c1Blck1pbnV0ZTogbnVtYmVyID0gNTsgLy8gQWxwaGEgVmFudGFnZSBmcmVlIHRpZXIgbGltaXRcbiAgcHJpdmF0ZSB0aHJvdHRsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBlcnJvcnM6IHN0cmluZ1tdID0gW107XG4gIFxuICAvKipcbiAgICogQ29ubmVjdCB0byBBbHBoYSBWYW50YWdlIEFQSVxuICAgKiBAcGFyYW0gY29uZmlnIE1hcmtldCBkYXRhIGZlZWQgY29uZmlndXJhdGlvblxuICAgKiBAcmV0dXJucyBDb25uZWN0aW9uIHN0YXR1c1xuICAgKi9cbiAgYXN5bmMgY29ubmVjdChjb25maWc6IE1hcmtldERhdGFGZWVkQ29uZmlnKTogUHJvbWlzZTxNYXJrZXREYXRhRmVlZFN0YXR1cz4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBWYWxpZGF0ZSBBUEkga2V5XG4gICAgICBpZiAoIWNvbmZpZy5hcGlLZXkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBUEkga2V5IGlzIHJlcXVpcmVkIGZvciBBbHBoYSBWYW50YWdlJyk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHRoaXMuYXBpS2V5ID0gY29uZmlnLmFwaUtleTtcbiAgICAgIHRoaXMuYWN0aXZlU3ltYm9scyA9IGNvbmZpZy5zeW1ib2xzO1xuICAgICAgdGhpcy5hY3RpdmVEYXRhVHlwZXMgPSBjb25maWcuZGF0YVR5cGVzO1xuICAgICAgdGhpcy5hY3RpdmVJbnRlcnZhbCA9IGNvbmZpZy5pbnRlcnZhbDtcbiAgICAgIHRoaXMuY29ubmVjdGlvbklkID0gdXVpZHY0KCk7XG4gICAgICB0aGlzLmNvbm5lY3RlZCA9IHRydWU7XG4gICAgICB0aGlzLmxhc3RVcGRhdGVkID0gbmV3IERhdGUoKTtcbiAgICAgIHRoaXMuZXJyb3JzID0gW107XG4gICAgICBcbiAgICAgIC8vIFRlc3QgY29ubmVjdGlvbiB3aXRoIGEgc2ltcGxlIHJlcXVlc3RcbiAgICAgIGF3YWl0IHRoaXMudGVzdENvbm5lY3Rpb24oKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHRoaXMuZ2V0U3RhdHVzKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHRoaXMuY29ubmVjdGVkID0gZmFsc2U7XG4gICAgICB0aGlzLmVycm9ycy5wdXNoKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3IgZHVyaW5nIGNvbm5lY3Rpb24nKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHRoaXMuZ2V0U3RhdHVzKCk7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogRGlzY29ubmVjdCBmcm9tIEFscGhhIFZhbnRhZ2UgQVBJXG4gICAqL1xuICBhc3luYyBkaXNjb25uZWN0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuY29ubmVjdGVkID0gZmFsc2U7XG4gICAgdGhpcy5hY3RpdmVTeW1ib2xzID0gW107XG4gICAgdGhpcy5hY3RpdmVEYXRhVHlwZXMgPSBbXTtcbiAgICB0aGlzLmNvbm5lY3Rpb25JZCA9ICcnO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGNvbm5lY3Rpb24gc3RhdHVzXG4gICAqIEByZXR1cm5zIENvbm5lY3Rpb24gc3RhdHVzXG4gICAqL1xuICBnZXRTdGF0dXMoKTogTWFya2V0RGF0YUZlZWRTdGF0dXMge1xuICAgIHJldHVybiB7XG4gICAgICBwcm92aWRlcjogJ2FscGhhLXZhbnRhZ2UnLFxuICAgICAgY29ubmVjdGVkOiB0aGlzLmNvbm5lY3RlZCxcbiAgICAgIGNvbm5lY3Rpb25JZDogdGhpcy5jb25uZWN0aW9uSWQsXG4gICAgICBsYXRlbmN5OiAxNTAsIC8vIE1vY2sgbGF0ZW5jeSBpbiBtc1xuICAgICAgbGFzdFVwZGF0ZWQ6IHRoaXMubGFzdFVwZGF0ZWQsXG4gICAgICBhY3RpdmVTeW1ib2xzOiB0aGlzLmFjdGl2ZVN5bWJvbHMubGVuZ3RoLFxuICAgICAgYWN0aXZlRGF0YVR5cGVzOiB0aGlzLmFjdGl2ZURhdGFUeXBlcyxcbiAgICAgIGVycm9yczogdGhpcy5lcnJvcnMubGVuZ3RoID4gMCA/IHRoaXMuZXJyb3JzIDogdW5kZWZpbmVkLFxuICAgICAgdGhyb3R0bGVTdGF0dXM6IHtcbiAgICAgICAgcmVxdWVzdHNQZXJNaW51dGU6IHRoaXMucmVxdWVzdHNQZXJNaW51dGUsXG4gICAgICAgIG1heFJlcXVlc3RzUGVyTWludXRlOiB0aGlzLm1heFJlcXVlc3RzUGVyTWludXRlLFxuICAgICAgICB0aHJvdHRsZWQ6IHRoaXMudGhyb3R0bGVkXG4gICAgICB9XG4gICAgfTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN1YnNjcmliZSB0byBtYXJrZXQgZGF0YVxuICAgKiBAcGFyYW0gc3ltYm9scyBTeW1ib2xzIHRvIHN1YnNjcmliZSB0b1xuICAgKiBAcGFyYW0gZGF0YVR5cGVzIERhdGEgdHlwZXMgdG8gc3Vic2NyaWJlIHRvXG4gICAqIEBwYXJhbSBpbnRlcnZhbCBEYXRhIGludGVydmFsXG4gICAqL1xuICBhc3luYyBzdWJzY3JpYmVUb0RhdGEoXG4gICAgc3ltYm9sczogc3RyaW5nW10sXG4gICAgZGF0YVR5cGVzOiBNYXJrZXREYXRhVHlwZVtdLFxuICAgIGludGVydmFsOiBNYXJrZXREYXRhSW50ZXJ2YWxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLmNvbm5lY3RlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgY29ubmVjdGVkIHRvIEFscGhhIFZhbnRhZ2UgQVBJJyk7XG4gICAgfVxuICAgIFxuICAgIC8vIFVwZGF0ZSBhY3RpdmUgc3Vic2NyaXB0aW9uc1xuICAgIHRoaXMuYWN0aXZlU3ltYm9scyA9IFsuLi5uZXcgU2V0KFsuLi50aGlzLmFjdGl2ZVN5bWJvbHMsIC4uLnN5bWJvbHNdKV07XG4gICAgdGhpcy5hY3RpdmVEYXRhVHlwZXMgPSBbLi4ubmV3IFNldChbLi4udGhpcy5hY3RpdmVEYXRhVHlwZXMsIC4uLmRhdGFUeXBlc10pXTtcbiAgICB0aGlzLmFjdGl2ZUludGVydmFsID0gaW50ZXJ2YWw7XG4gICAgdGhpcy5sYXN0VXBkYXRlZCA9IG5ldyBEYXRlKCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBVbnN1YnNjcmliZSBmcm9tIG1hcmtldCBkYXRhXG4gICAqIEBwYXJhbSBzeW1ib2xzIFN5bWJvbHMgdG8gdW5zdWJzY3JpYmUgZnJvbVxuICAgKiBAcGFyYW0gZGF0YVR5cGVzIERhdGEgdHlwZXMgdG8gdW5zdWJzY3JpYmUgZnJvbVxuICAgKi9cbiAgYXN5bmMgdW5zdWJzY3JpYmVGcm9tRGF0YShzeW1ib2xzOiBzdHJpbmdbXSwgZGF0YVR5cGVzOiBNYXJrZXREYXRhVHlwZVtdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLmNvbm5lY3RlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgY29ubmVjdGVkIHRvIEFscGhhIFZhbnRhZ2UgQVBJJyk7XG4gICAgfVxuICAgIFxuICAgIC8vIFVwZGF0ZSBhY3RpdmUgc3Vic2NyaXB0aW9uc1xuICAgIHRoaXMuYWN0aXZlU3ltYm9scyA9IHRoaXMuYWN0aXZlU3ltYm9scy5maWx0ZXIocyA9PiAhc3ltYm9scy5pbmNsdWRlcyhzKSk7XG4gICAgdGhpcy5hY3RpdmVEYXRhVHlwZXMgPSB0aGlzLmFjdGl2ZURhdGFUeXBlcy5maWx0ZXIodCA9PiAhZGF0YVR5cGVzLmluY2x1ZGVzKHQpKTtcbiAgICB0aGlzLmxhc3RVcGRhdGVkID0gbmV3IERhdGUoKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBoaXN0b3JpY2FsIG1hcmtldCBkYXRhXG4gICAqIEBwYXJhbSBxdWVyeSBNYXJrZXQgZGF0YSBxdWVyeVxuICAgKiBAcmV0dXJucyBNYXJrZXQgZGF0YSBwb2ludHNcbiAgICovXG4gIGFzeW5jIGdldEhpc3RvcmljYWxEYXRhKHF1ZXJ5OiBNYXJrZXREYXRhUXVlcnkpOiBQcm9taXNlPE1hcmtldERhdGFQb2ludFtdPiB7XG4gICAgaWYgKCF0aGlzLmNvbm5lY3RlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgY29ubmVjdGVkIHRvIEFscGhhIFZhbnRhZ2UgQVBJJyk7XG4gICAgfVxuICAgIFxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHRzOiBNYXJrZXREYXRhUG9pbnRbXSA9IFtdO1xuICAgICAgXG4gICAgICAvLyBDaGVjayBpZiB3ZSdyZSBiZWluZyB0aHJvdHRsZWRcbiAgICAgIGlmICh0aGlzLnRocm90dGxlZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FQSSByYXRlIGxpbWl0IGV4Y2VlZGVkLiBQbGVhc2UgdHJ5IGFnYWluIGxhdGVyLicpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBJbmNyZW1lbnQgcmVxdWVzdCBjb3VudGVyXG4gICAgICB0aGlzLnJlcXVlc3RzUGVyTWludXRlKys7XG4gICAgICBpZiAodGhpcy5yZXF1ZXN0c1Blck1pbnV0ZSA+PSB0aGlzLm1heFJlcXVlc3RzUGVyTWludXRlKSB7XG4gICAgICAgIHRoaXMudGhyb3R0bGVkID0gdHJ1ZTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgdGhpcy50aHJvdHRsZWQgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnJlcXVlc3RzUGVyTWludXRlID0gMDtcbiAgICAgICAgfSwgNjAwMDApOyAvLyBSZXNldCBhZnRlciAxIG1pbnV0ZVxuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBQcm9jZXNzIGVhY2ggc3ltYm9sXG4gICAgICBmb3IgKGNvbnN0IHN5bWJvbCBvZiBxdWVyeS5zeW1ib2xzKSB7XG4gICAgICAgIC8vIFByb2Nlc3MgZWFjaCBkYXRhIHR5cGVcbiAgICAgICAgZm9yIChjb25zdCBkYXRhVHlwZSBvZiBxdWVyeS5kYXRhVHlwZXMpIHtcbiAgICAgICAgICAvLyBHZXQgZGF0YSBiYXNlZCBvbiB0eXBlXG4gICAgICAgICAgY29uc3QgZGF0YVBvaW50cyA9IGF3YWl0IHRoaXMuZmV0Y2hEYXRhKHN5bWJvbCwgZGF0YVR5cGUsIHF1ZXJ5LmludGVydmFsIHx8IHRoaXMuYWN0aXZlSW50ZXJ2YWwsIHF1ZXJ5LnRpbWVSYW5nZSk7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKC4uLmRhdGFQb2ludHMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aGlzLmVycm9ycy5wdXNoKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3IgZmV0Y2hpbmcgaGlzdG9yaWNhbCBkYXRhJyk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIFByaXZhdGUgaGVscGVyIG1ldGhvZHNcbiAgXG4gIC8qKlxuICAgKiBUZXN0IGNvbm5lY3Rpb24gdG8gQWxwaGEgVmFudGFnZSBBUElcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgdGVzdENvbm5lY3Rpb24oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIE1ha2UgYSBzaW1wbGUgcmVxdWVzdCB0byB0ZXN0IHRoZSBjb25uZWN0aW9uXG4gICAgICBjb25zdCB1cmwgPSBgJHt0aGlzLmJhc2VVcmx9P2Z1bmN0aW9uPUdMT0JBTF9RVU9URSZzeW1ib2w9SUJNJmFwaWtleT0ke3RoaXMuYXBpS2V5fWA7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCk7XG4gICAgICBcbiAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBUEkgcmVxdWVzdCBmYWlsZWQgd2l0aCBzdGF0dXMgJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICBcbiAgICAgIGlmIChkYXRhWydFcnJvciBNZXNzYWdlJ10pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGRhdGFbJ0Vycm9yIE1lc3NhZ2UnXSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGlmIChkYXRhWydOb3RlJ10gJiYgZGF0YVsnTm90ZSddLmluY2x1ZGVzKCdBUEkgY2FsbCBmcmVxdWVuY3knKSkge1xuICAgICAgICB0aGlzLnRocm90dGxlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuZXJyb3JzLnB1c2goJ0FQSSByYXRlIGxpbWl0IGV4Y2VlZGVkJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ29ubmVjdGlvbiB0ZXN0IGZhaWxlZDogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ31gKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBGZXRjaCBkYXRhIGZyb20gQWxwaGEgVmFudGFnZSBBUElcbiAgICogQHBhcmFtIHN5bWJvbCBTeW1ib2wgdG8gZmV0Y2ggZGF0YSBmb3JcbiAgICogQHBhcmFtIGRhdGFUeXBlIERhdGEgdHlwZSB0byBmZXRjaFxuICAgKiBAcGFyYW0gaW50ZXJ2YWwgRGF0YSBpbnRlcnZhbFxuICAgKiBAcGFyYW0gdGltZVJhbmdlIFRpbWUgcmFuZ2UgdG8gZmV0Y2ggZGF0YSBmb3JcbiAgICogQHJldHVybnMgTWFya2V0IGRhdGEgcG9pbnRzXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGZldGNoRGF0YShcbiAgICBzeW1ib2w6IHN0cmluZyxcbiAgICBkYXRhVHlwZTogTWFya2V0RGF0YVR5cGUsXG4gICAgaW50ZXJ2YWw6IE1hcmtldERhdGFJbnRlcnZhbCxcbiAgICB0aW1lUmFuZ2U6IHsgc3RhcnQ6IERhdGU7IGVuZDogRGF0ZSB9XG4gICk6IFByb21pc2U8TWFya2V0RGF0YVBvaW50W10+IHtcbiAgICAvLyBJbiBhIHJlYWwgaW1wbGVtZW50YXRpb24sIHRoaXMgd291bGQgbWFrZSBhY3R1YWwgQVBJIGNhbGxzIHRvIEFscGhhIFZhbnRhZ2VcbiAgICAvLyBGb3Igbm93LCB3ZSdsbCBnZW5lcmF0ZSBtb2NrIGRhdGFcbiAgICBcbiAgICBjb25zdCByZXN1bHRzOiBNYXJrZXREYXRhUG9pbnRbXSA9IFtdO1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IHRpbWVSYW5nZS5zdGFydC5nZXRUaW1lKCk7XG4gICAgY29uc3QgZW5kVGltZSA9IHRpbWVSYW5nZS5lbmQuZ2V0VGltZSgpO1xuICAgIGNvbnN0IGludGVydmFsTXMgPSB0aGlzLmdldEludGVydmFsTWlsbGlzZWNvbmRzKGludGVydmFsKTtcbiAgICBcbiAgICAvLyBHZW5lcmF0ZSBkYXRhIHBvaW50cyBhdCB0aGUgc3BlY2lmaWVkIGludGVydmFsXG4gICAgZm9yIChsZXQgdGltZXN0YW1wID0gc3RhcnRUaW1lOyB0aW1lc3RhbXAgPD0gZW5kVGltZTsgdGltZXN0YW1wICs9IGludGVydmFsTXMpIHtcbiAgICAgIGNvbnN0IGRhdGFQb2ludCA9IHRoaXMuZ2VuZXJhdGVNb2NrRGF0YVBvaW50KHN5bWJvbCwgZGF0YVR5cGUsIG5ldyBEYXRlKHRpbWVzdGFtcCksIGludGVydmFsKTtcbiAgICAgIHJlc3VsdHMucHVzaChkYXRhUG9pbnQpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdlbmVyYXRlIGEgbW9jayBkYXRhIHBvaW50XG4gICAqIEBwYXJhbSBzeW1ib2wgU3ltYm9sXG4gICAqIEBwYXJhbSBkYXRhVHlwZSBEYXRhIHR5cGVcbiAgICogQHBhcmFtIHRpbWVzdGFtcCBUaW1lc3RhbXBcbiAgICogQHBhcmFtIGludGVydmFsIEludGVydmFsXG4gICAqIEByZXR1cm5zIE1vY2sgZGF0YSBwb2ludFxuICAgKi9cbiAgcHJpdmF0ZSBnZW5lcmF0ZU1vY2tEYXRhUG9pbnQoXG4gICAgc3ltYm9sOiBzdHJpbmcsXG4gICAgZGF0YVR5cGU6IE1hcmtldERhdGFUeXBlLFxuICAgIHRpbWVzdGFtcDogRGF0ZSxcbiAgICBpbnRlcnZhbDogTWFya2V0RGF0YUludGVydmFsXG4gICk6IE1hcmtldERhdGFQb2ludCB7XG4gICAgLy8gQmFzZSBwcmljZSAtIHVzZSBhIGhhc2ggb2YgdGhlIHN5bWJvbCB0byBnZXQgYSBjb25zaXN0ZW50IGJhc2UgcHJpY2VcbiAgICBjb25zdCBiYXNlUHJpY2UgPSB0aGlzLmdldEJhc2VQcmljZShzeW1ib2wpO1xuICAgIFxuICAgIC8vIEdlbmVyYXRlIHZhbHVlIGJhc2VkIG9uIGRhdGEgdHlwZVxuICAgIGxldCB2YWx1ZTogYW55O1xuICAgIFxuICAgIHN3aXRjaCAoZGF0YVR5cGUpIHtcbiAgICAgIGNhc2UgJ3ByaWNlJzpcbiAgICAgICAgdmFsdWUgPSB0aGlzLmdlbmVyYXRlUHJpY2VEYXRhKGJhc2VQcmljZSwgdGltZXN0YW1wKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd2b2x1bWUnOlxuICAgICAgICB2YWx1ZSA9IHRoaXMuZ2VuZXJhdGVWb2x1bWVEYXRhKHN5bWJvbCwgdGltZXN0YW1wKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd0ZWNobmljYWwtaW5kaWNhdG9ycyc6XG4gICAgICAgIHZhbHVlID0gdGhpcy5nZW5lcmF0ZVRlY2huaWNhbEluZGljYXRvckRhdGEoYmFzZVByaWNlLCB0aW1lc3RhbXApO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ25ld3Mtc2VudGltZW50JzpcbiAgICAgICAgdmFsdWUgPSB0aGlzLmdlbmVyYXRlTmV3c1NlbnRpbWVudERhdGEoc3ltYm9sLCB0aW1lc3RhbXApO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHZhbHVlID0gYmFzZVByaWNlO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IHV1aWR2NCgpLFxuICAgICAgc3ltYm9sLFxuICAgICAgZGF0YVR5cGUsXG4gICAgICB0aW1lc3RhbXAsXG4gICAgICB2YWx1ZSxcbiAgICAgIHNvdXJjZTogJ2FscGhhLXZhbnRhZ2UnLFxuICAgICAgaW50ZXJ2YWwsXG4gICAgICBtZXRhZGF0YToge1xuICAgICAgICBnZW5lcmF0ZWQ6ICdtb2NrJyxcbiAgICAgICAgYXBpVmVyc2lvbjogJzEuMCdcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGludGVydmFsIGluIG1pbGxpc2Vjb25kc1xuICAgKiBAcGFyYW0gaW50ZXJ2YWwgSW50ZXJ2YWxcbiAgICogQHJldHVybnMgSW50ZXJ2YWwgaW4gbWlsbGlzZWNvbmRzXG4gICAqL1xuICBwcml2YXRlIGdldEludGVydmFsTWlsbGlzZWNvbmRzKGludGVydmFsOiBNYXJrZXREYXRhSW50ZXJ2YWwpOiBudW1iZXIge1xuICAgIGNvbnN0IG1pbnV0ZSA9IDYwICogMTAwMDtcbiAgICBjb25zdCBob3VyID0gNjAgKiBtaW51dGU7XG4gICAgY29uc3QgZGF5ID0gMjQgKiBob3VyO1xuICAgIFxuICAgIHN3aXRjaCAoaW50ZXJ2YWwpIHtcbiAgICAgIGNhc2UgJ3RpY2snOiByZXR1cm4gMTAwMDtcbiAgICAgIGNhc2UgJzFtaW4nOiByZXR1cm4gbWludXRlO1xuICAgICAgY2FzZSAnNW1pbic6IHJldHVybiA1ICogbWludXRlO1xuICAgICAgY2FzZSAnMTVtaW4nOiByZXR1cm4gMTUgKiBtaW51dGU7XG4gICAgICBjYXNlICczMG1pbic6IHJldHVybiAzMCAqIG1pbnV0ZTtcbiAgICAgIGNhc2UgJzFob3VyJzogcmV0dXJuIGhvdXI7XG4gICAgICBjYXNlICc0aG91cic6IHJldHVybiA0ICogaG91cjtcbiAgICAgIGNhc2UgJ2RhaWx5JzogcmV0dXJuIGRheTtcbiAgICAgIGNhc2UgJ3dlZWtseSc6IHJldHVybiA3ICogZGF5O1xuICAgICAgY2FzZSAnbW9udGhseSc6IHJldHVybiAzMCAqIGRheTtcbiAgICAgIGRlZmF1bHQ6IHJldHVybiBkYXk7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGJhc2UgcHJpY2UgZm9yIGEgc3ltYm9sXG4gICAqIEBwYXJhbSBzeW1ib2wgU3ltYm9sXG4gICAqIEByZXR1cm5zIEJhc2UgcHJpY2VcbiAgICovXG4gIHByaXZhdGUgZ2V0QmFzZVByaWNlKHN5bWJvbDogc3RyaW5nKTogbnVtYmVyIHtcbiAgICAvLyBTaW1wbGUgaGFzaCBmdW5jdGlvbiB0byBnZXQgYSBjb25zaXN0ZW50IGJhc2UgcHJpY2UgZm9yIGEgc3ltYm9sXG4gICAgbGV0IGhhc2ggPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3ltYm9sLmxlbmd0aDsgaSsrKSB7XG4gICAgICBoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgKyBzeW1ib2wuY2hhckNvZGVBdChpKTtcbiAgICAgIGhhc2ggfD0gMDsgLy8gQ29udmVydCB0byAzMmJpdCBpbnRlZ2VyXG4gICAgfVxuICAgIFxuICAgIC8vIEdlbmVyYXRlIGEgcHJpY2UgYmV0d2VlbiAkMTAgYW5kICQ1MDBcbiAgICByZXR1cm4gTWF0aC5hYnMoaGFzaCAlIDQ5MCkgKyAxMDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdlbmVyYXRlIG1vY2sgcHJpY2UgZGF0YVxuICAgKiBAcGFyYW0gYmFzZVByaWNlIEJhc2UgcHJpY2VcbiAgICogQHBhcmFtIHRpbWVzdGFtcCBUaW1lc3RhbXBcbiAgICogQHJldHVybnMgTW9jayBwcmljZSBkYXRhXG4gICAqL1xuICBwcml2YXRlIGdlbmVyYXRlUHJpY2VEYXRhKGJhc2VQcmljZTogbnVtYmVyLCB0aW1lc3RhbXA6IERhdGUpOiBQcmljZURhdGEge1xuICAgIC8vIEFkZCBzb21lIHJhbmRvbW5lc3MgYmFzZWQgb24gdGhlIHRpbWVzdGFtcFxuICAgIGNvbnN0IGRheUZhY3RvciA9IE1hdGguc2luKHRpbWVzdGFtcC5nZXRUaW1lKCkgLyAoMjQgKiA2MCAqIDYwICogMTAwMCkpICogMC4wNTtcbiAgICBjb25zdCBob3VyRmFjdG9yID0gTWF0aC5zaW4odGltZXN0YW1wLmdldFRpbWUoKSAvICg2MCAqIDYwICogMTAwMCkpICogMC4wMjtcbiAgICBjb25zdCBtaW51dGVGYWN0b3IgPSBNYXRoLnNpbih0aW1lc3RhbXAuZ2V0VGltZSgpIC8gKDYwICogMTAwMCkpICogMC4wMTtcbiAgICBcbiAgICBjb25zdCBwcmljZUZhY3RvciA9IDEgKyBkYXlGYWN0b3IgKyBob3VyRmFjdG9yICsgbWludXRlRmFjdG9yO1xuICAgIGNvbnN0IHByaWNlID0gYmFzZVByaWNlICogcHJpY2VGYWN0b3I7XG4gICAgXG4gICAgLy8gR2VuZXJhdGUgT0hMQyBkYXRhXG4gICAgY29uc3Qgb3BlbiA9IHByaWNlO1xuICAgIGNvbnN0IHZvbGF0aWxpdHkgPSBiYXNlUHJpY2UgKiAwLjAyOyAvLyAyJSB2b2xhdGlsaXR5XG4gICAgY29uc3QgaGlnaCA9IG9wZW4gKyAoTWF0aC5yYW5kb20oKSAqIHZvbGF0aWxpdHkpO1xuICAgIGNvbnN0IGxvdyA9IE1hdGgubWF4KDAuMSwgb3BlbiAtIChNYXRoLnJhbmRvbSgpICogdm9sYXRpbGl0eSkpO1xuICAgIGNvbnN0IGNsb3NlID0gbG93ICsgKE1hdGgucmFuZG9tKCkgKiAoaGlnaCAtIGxvdykpO1xuICAgIFxuICAgIC8vIEdlbmVyYXRlIHZvbHVtZVxuICAgIGNvbnN0IHZvbHVtZSA9IE1hdGguZmxvb3IoYmFzZVByaWNlICogMTAwMCAqICgwLjUgKyBNYXRoLnJhbmRvbSgpKSk7XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIG9wZW4sXG4gICAgICBoaWdoLFxuICAgICAgbG93LFxuICAgICAgY2xvc2UsXG4gICAgICB2b2x1bWUsXG4gICAgICBhZGp1c3RlZENsb3NlOiBjbG9zZVxuICAgIH07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBtb2NrIHZvbHVtZSBkYXRhXG4gICAqIEBwYXJhbSBzeW1ib2wgU3ltYm9sXG4gICAqIEBwYXJhbSB0aW1lc3RhbXAgVGltZXN0YW1wXG4gICAqIEByZXR1cm5zIE1vY2sgdm9sdW1lIGRhdGFcbiAgICovXG4gIHByaXZhdGUgZ2VuZXJhdGVWb2x1bWVEYXRhKHN5bWJvbDogc3RyaW5nLCB0aW1lc3RhbXA6IERhdGUpOiBudW1iZXIge1xuICAgIGNvbnN0IGJhc2VWb2x1bWUgPSB0aGlzLmdldEJhc2VQcmljZShzeW1ib2wpICogMTAwMDtcbiAgICBjb25zdCBob3VyT2ZEYXkgPSB0aW1lc3RhbXAuZ2V0VVRDSG91cnMoKTtcbiAgICBcbiAgICAvLyBWb2x1bWUgaXMgdHlwaWNhbGx5IGhpZ2hlciBhdCBtYXJrZXQgb3BlbiBhbmQgY2xvc2VcbiAgICBsZXQgdm9sdW1lRmFjdG9yID0gMS4wO1xuICAgIGlmIChob3VyT2ZEYXkgPCAyIHx8IGhvdXJPZkRheSA+IDE0KSB7XG4gICAgICB2b2x1bWVGYWN0b3IgPSAxLjU7XG4gICAgfSBlbHNlIGlmIChob3VyT2ZEYXkgPiA1ICYmIGhvdXJPZkRheSA8IDExKSB7XG4gICAgICB2b2x1bWVGYWN0b3IgPSAwLjc7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBNYXRoLmZsb29yKGJhc2VWb2x1bWUgKiB2b2x1bWVGYWN0b3IgKiAoMC41ICsgTWF0aC5yYW5kb20oKSkpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2VuZXJhdGUgbW9jayB0ZWNobmljYWwgaW5kaWNhdG9yIGRhdGFcbiAgICogQHBhcmFtIGJhc2VQcmljZSBCYXNlIHByaWNlXG4gICAqIEBwYXJhbSB0aW1lc3RhbXAgVGltZXN0YW1wXG4gICAqIEByZXR1cm5zIE1vY2sgdGVjaG5pY2FsIGluZGljYXRvciBkYXRhXG4gICAqL1xuICBwcml2YXRlIGdlbmVyYXRlVGVjaG5pY2FsSW5kaWNhdG9yRGF0YShiYXNlUHJpY2U6IG51bWJlciwgdGltZXN0YW1wOiBEYXRlKTogYW55IHtcbiAgICAvLyBHZW5lcmF0ZSBhIHJhbmRvbSB0ZWNobmljYWwgaW5kaWNhdG9yXG4gICAgY29uc3QgaW5kaWNhdG9ycyA9IFsnUlNJJywgJ01BQ0QnLCAnU01BJywgJ0VNQScsICdCb2xsaW5nZXIgQmFuZHMnXTtcbiAgICBjb25zdCBpbmRpY2F0b3IgPSBpbmRpY2F0b3JzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGluZGljYXRvcnMubGVuZ3RoKV07XG4gICAgXG4gICAgbGV0IHZhbHVlOiBudW1iZXI7XG4gICAgbGV0IHBhcmFtZXRlcnM6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcbiAgICBcbiAgICBzd2l0Y2ggKGluZGljYXRvcikge1xuICAgICAgY2FzZSAnUlNJJzpcbiAgICAgICAgdmFsdWUgPSAzMCArIE1hdGgucmFuZG9tKCkgKiA0MDsgLy8gUlNJIGJldHdlZW4gMzAgYW5kIDcwXG4gICAgICAgIHBhcmFtZXRlcnMgPSB7IHBlcmlvZDogMTQgfTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdNQUNEJzpcbiAgICAgICAgdmFsdWUgPSAtNSArIE1hdGgucmFuZG9tKCkgKiAxMDsgLy8gTUFDRCBiZXR3ZWVuIC01IGFuZCA1XG4gICAgICAgIHBhcmFtZXRlcnMgPSB7IGZhc3RQZXJpb2Q6IDEyLCBzbG93UGVyaW9kOiAyNiwgc2lnbmFsUGVyaW9kOiA5IH07XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnU01BJzpcbiAgICAgICAgdmFsdWUgPSBiYXNlUHJpY2UgKiAoMC45ICsgTWF0aC5yYW5kb20oKSAqIDAuMik7IC8vIFNNQSBhcm91bmQgYmFzZSBwcmljZVxuICAgICAgICBwYXJhbWV0ZXJzID0geyBwZXJpb2Q6IDIwIH07XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnRU1BJzpcbiAgICAgICAgdmFsdWUgPSBiYXNlUHJpY2UgKiAoMC45ICsgTWF0aC5yYW5kb20oKSAqIDAuMik7IC8vIEVNQSBhcm91bmQgYmFzZSBwcmljZVxuICAgICAgICBwYXJhbWV0ZXJzID0geyBwZXJpb2Q6IDIwIH07XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnQm9sbGluZ2VyIEJhbmRzJzpcbiAgICAgICAgdmFsdWUgPSBiYXNlUHJpY2U7XG4gICAgICAgIHBhcmFtZXRlcnMgPSB7XG4gICAgICAgICAgcGVyaW9kOiAyMCxcbiAgICAgICAgICBzdGREZXY6IDIsXG4gICAgICAgICAgdXBwZXI6IGJhc2VQcmljZSAqIDEuMSxcbiAgICAgICAgICBtaWRkbGU6IGJhc2VQcmljZSxcbiAgICAgICAgICBsb3dlcjogYmFzZVByaWNlICogMC45XG4gICAgICAgIH07XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdmFsdWUgPSBiYXNlUHJpY2U7XG4gICAgICAgIHBhcmFtZXRlcnMgPSB7fTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIGluZGljYXRvcixcbiAgICAgIHZhbHVlLFxuICAgICAgcGFyYW1ldGVyc1xuICAgIH07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBtb2NrIG5ld3Mgc2VudGltZW50IGRhdGFcbiAgICogQHBhcmFtIHN5bWJvbCBTeW1ib2xcbiAgICogQHBhcmFtIHRpbWVzdGFtcCBUaW1lc3RhbXBcbiAgICogQHJldHVybnMgTW9jayBuZXdzIHNlbnRpbWVudCBkYXRhXG4gICAqL1xuICBwcml2YXRlIGdlbmVyYXRlTmV3c1NlbnRpbWVudERhdGEoc3ltYm9sOiBzdHJpbmcsIHRpbWVzdGFtcDogRGF0ZSk6IGFueSB7XG4gICAgLy8gR2VuZXJhdGUgcmFuZG9tIHNlbnRpbWVudFxuICAgIGNvbnN0IHNlbnRpbWVudFZhbHVlID0gLTEgKyBNYXRoLnJhbmRvbSgpICogMjsgLy8gQmV0d2VlbiAtMSBhbmQgMVxuICAgIFxuICAgIGxldCBzZW50aW1lbnQ6ICd2ZXJ5LW5lZ2F0aXZlJyB8ICduZWdhdGl2ZScgfCAnbmV1dHJhbCcgfCAncG9zaXRpdmUnIHwgJ3ZlcnktcG9zaXRpdmUnO1xuICAgIFxuICAgIGlmIChzZW50aW1lbnRWYWx1ZSA8IC0wLjYpIHtcbiAgICAgIHNlbnRpbWVudCA9ICd2ZXJ5LW5lZ2F0aXZlJztcbiAgICB9IGVsc2UgaWYgKHNlbnRpbWVudFZhbHVlIDwgLTAuMikge1xuICAgICAgc2VudGltZW50ID0gJ25lZ2F0aXZlJztcbiAgICB9IGVsc2UgaWYgKHNlbnRpbWVudFZhbHVlIDwgMC4yKSB7XG4gICAgICBzZW50aW1lbnQgPSAnbmV1dHJhbCc7XG4gICAgfSBlbHNlIGlmIChzZW50aW1lbnRWYWx1ZSA8IDAuNikge1xuICAgICAgc2VudGltZW50ID0gJ3Bvc2l0aXZlJztcbiAgICB9IGVsc2Uge1xuICAgICAgc2VudGltZW50ID0gJ3ZlcnktcG9zaXRpdmUnO1xuICAgIH1cbiAgICBcbiAgICAvLyBHZW5lcmF0ZSByYW5kb20gYXJ0aWNsZSBjb3VudFxuICAgIGNvbnN0IGFydGljbGVDb3VudCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDUwKSArIDE7XG4gICAgXG4gICAgLy8gR2VuZXJhdGUgcmFuZG9tIHNvdXJjZXNcbiAgICBjb25zdCBwb3NzaWJsZVNvdXJjZXMgPSBbXG4gICAgICAnQmxvb21iZXJnJywgJ1JldXRlcnMnLCAnQ05CQycsICdXYWxsIFN0cmVldCBKb3VybmFsJywgJ0ZpbmFuY2lhbCBUaW1lcycsXG4gICAgICAnTWFya2V0V2F0Y2gnLCAnU2Vla2luZyBBbHBoYScsICdCYXJyb25cXCdzJywgJ1RoZSBFY29ub21pc3QnLCAnRm9yYmVzJ1xuICAgIF07XG4gICAgXG4gICAgY29uc3Qgc291cmNlQ291bnQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA1KSArIDE7XG4gICAgY29uc3Qgc291cmNlczogc3RyaW5nW10gPSBbXTtcbiAgICBcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNvdXJjZUNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IHNvdXJjZUluZGV4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcG9zc2libGVTb3VyY2VzLmxlbmd0aCk7XG4gICAgICBzb3VyY2VzLnB1c2gocG9zc2libGVTb3VyY2VzW3NvdXJjZUluZGV4XSk7XG4gICAgfVxuICAgIFxuICAgIC8vIEdlbmVyYXRlIHJhbmRvbSBrZXl3b3Jkc1xuICAgIGNvbnN0IHBvc3NpYmxlS2V5d29yZHMgPSBbXG4gICAgICAnZWFybmluZ3MnLCAncmV2ZW51ZScsICdncm93dGgnLCAncHJvZml0JywgJ2xvc3MnLFxuICAgICAgJ21lcmdlcicsICdhY3F1aXNpdGlvbicsICdkaXZpZGVuZCcsICdDRU8nLCAnc3RyYXRlZ3knLFxuICAgICAgJ3Byb2R1Y3QnLCAnbGF1bmNoJywgJ21hcmtldCcsICdjb21wZXRpdGlvbicsICdyZWd1bGF0aW9uJ1xuICAgIF07XG4gICAgXG4gICAgY29uc3Qga2V5d29yZENvdW50ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogNSkgKyAxO1xuICAgIGNvbnN0IGtleXdvcmRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5d29yZENvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IGtleXdvcmRJbmRleCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHBvc3NpYmxlS2V5d29yZHMubGVuZ3RoKTtcbiAgICAgIGtleXdvcmRzLnB1c2gocG9zc2libGVLZXl3b3Jkc1trZXl3b3JkSW5kZXhdKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIHNlbnRpbWVudCxcbiAgICAgIHNjb3JlOiBzZW50aW1lbnRWYWx1ZSxcbiAgICAgIGFydGljbGVDb3VudCxcbiAgICAgIHNvdXJjZXMsXG4gICAgICBrZXl3b3Jkc1xuICAgIH07XG4gIH1cbn0iXX0=