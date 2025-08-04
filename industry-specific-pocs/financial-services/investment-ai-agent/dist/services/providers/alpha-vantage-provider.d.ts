/**
 * Alpha Vantage market data provider implementation
 */
import { MarketDataFeedConfig, MarketDataPoint, MarketDataType, MarketDataInterval, MarketDataFeedStatus, MarketDataQuery } from '../../models/market-data';
import { MarketDataProvider } from '../market-data-service';
/**
 * Alpha Vantage API client implementation
 */
export declare class AlphaVantageProvider implements MarketDataProvider {
    private apiKey;
    private baseUrl;
    private connected;
    private activeSymbols;
    private activeDataTypes;
    private activeInterval;
    private lastUpdated;
    private connectionId;
    private requestsPerMinute;
    private maxRequestsPerMinute;
    private throttled;
    private errors;
    /**
     * Connect to Alpha Vantage API
     * @param config Market data feed configuration
     * @returns Connection status
     */
    connect(config: MarketDataFeedConfig): Promise<MarketDataFeedStatus>;
    /**
     * Disconnect from Alpha Vantage API
     */
    disconnect(): Promise<void>;
    /**
     * Get connection status
     * @returns Connection status
     */
    getStatus(): MarketDataFeedStatus;
    /**
     * Subscribe to market data
     * @param symbols Symbols to subscribe to
     * @param dataTypes Data types to subscribe to
     * @param interval Data interval
     */
    subscribeToData(symbols: string[], dataTypes: MarketDataType[], interval: MarketDataInterval): Promise<void>;
    /**
     * Unsubscribe from market data
     * @param symbols Symbols to unsubscribe from
     * @param dataTypes Data types to unsubscribe from
     */
    unsubscribeFromData(symbols: string[], dataTypes: MarketDataType[]): Promise<void>;
    /**
     * Get historical market data
     * @param query Market data query
     * @returns Market data points
     */
    getHistoricalData(query: MarketDataQuery): Promise<MarketDataPoint[]>;
    /**
     * Test connection to Alpha Vantage API
     */
    private testConnection;
    /**
     * Fetch data from Alpha Vantage API
     * @param symbol Symbol to fetch data for
     * @param dataType Data type to fetch
     * @param interval Data interval
     * @param timeRange Time range to fetch data for
     * @returns Market data points
     */
    private fetchData;
    /**
     * Generate a mock data point
     * @param symbol Symbol
     * @param dataType Data type
     * @param timestamp Timestamp
     * @param interval Interval
     * @returns Mock data point
     */
    private generateMockDataPoint;
    /**
     * Get interval in milliseconds
     * @param interval Interval
     * @returns Interval in milliseconds
     */
    private getIntervalMilliseconds;
    /**
     * Get base price for a symbol
     * @param symbol Symbol
     * @returns Base price
     */
    private getBasePrice;
    /**
     * Generate mock price data
     * @param basePrice Base price
     * @param timestamp Timestamp
     * @returns Mock price data
     */
    private generatePriceData;
    /**
     * Generate mock volume data
     * @param symbol Symbol
     * @param timestamp Timestamp
     * @returns Mock volume data
     */
    private generateVolumeData;
    /**
     * Generate mock technical indicator data
     * @param basePrice Base price
     * @param timestamp Timestamp
     * @returns Mock technical indicator data
     */
    private generateTechnicalIndicatorData;
    /**
     * Generate mock news sentiment data
     * @param symbol Symbol
     * @param timestamp Timestamp
     * @returns Mock news sentiment data
     */
    private generateNewsSentimentData;
}
