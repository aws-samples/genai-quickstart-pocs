/**
 * Alpha Vantage market data provider implementation
 */

import { v4 as uuidv4 } from 'uuid';
import {
  MarketDataFeedConfig,
  MarketDataPoint,
  MarketDataType,
  MarketDataInterval,
  MarketDataFeedStatus,
  MarketDataQuery,
  PriceData
} from '../../models/market-data';
import { MarketDataProvider } from '../market-data-service';

/**
 * Alpha Vantage API client implementation
 */
export class AlphaVantageProvider implements MarketDataProvider {
  private apiKey: string = '';
  private baseUrl: string = 'https://www.alphavantage.co/query';
  private connected: boolean = false;
  private activeSymbols: string[] = [];
  private activeDataTypes: MarketDataType[] = [];
  private activeInterval: MarketDataInterval = 'daily';
  private lastUpdated: Date = new Date();
  private connectionId: string = '';
  private requestsPerMinute: number = 0;
  private maxRequestsPerMinute: number = 5; // Alpha Vantage free tier limit
  private throttled: boolean = false;
  private errors: string[] = [];
  
  /**
   * Connect to Alpha Vantage API
   * @param config Market data feed configuration
   * @returns Connection status
   */
  async connect(config: MarketDataFeedConfig): Promise<MarketDataFeedStatus> {
    try {
      // Validate API key
      if (!config.apiKey) {
        throw new Error('API key is required for Alpha Vantage');
      }
      
      this.apiKey = config.apiKey;
      this.activeSymbols = config.symbols;
      this.activeDataTypes = config.dataTypes;
      this.activeInterval = config.interval;
      this.connectionId = uuidv4();
      this.connected = true;
      this.lastUpdated = new Date();
      this.errors = [];
      
      // Test connection with a simple request
      await this.testConnection();
      
      return this.getStatus();
    } catch (error) {
      this.connected = false;
      this.errors.push(error instanceof Error ? error.message : 'Unknown error during connection');
      
      return this.getStatus();
    }
  }
  
  /**
   * Disconnect from Alpha Vantage API
   */
  async disconnect(): Promise<void> {
    this.connected = false;
    this.activeSymbols = [];
    this.activeDataTypes = [];
    this.connectionId = '';
  }
  
  /**
   * Get connection status
   * @returns Connection status
   */
  getStatus(): MarketDataFeedStatus {
    return {
      provider: 'alpha-vantage',
      connected: this.connected,
      connectionId: this.connectionId,
      latency: 150, // Mock latency in ms
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
  async subscribeToData(
    symbols: string[],
    dataTypes: MarketDataType[],
    interval: MarketDataInterval
  ): Promise<void> {
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
  async unsubscribeFromData(symbols: string[], dataTypes: MarketDataType[]): Promise<void> {
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
  async getHistoricalData(query: MarketDataQuery): Promise<MarketDataPoint[]> {
    if (!this.connected) {
      throw new Error('Not connected to Alpha Vantage API');
    }
    
    try {
      const results: MarketDataPoint[] = [];
      
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
    } catch (error) {
      this.errors.push(error instanceof Error ? error.message : 'Unknown error fetching historical data');
      throw error;
    }
  }
  
  // Private helper methods
  
  /**
   * Test connection to Alpha Vantage API
   */
  private async testConnection(): Promise<void> {
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
    } catch (error) {
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
  private async fetchData(
    symbol: string,
    dataType: MarketDataType,
    interval: MarketDataInterval,
    timeRange: { start: Date; end: Date }
  ): Promise<MarketDataPoint[]> {
    // In a real implementation, this would make actual API calls to Alpha Vantage
    // For now, we'll generate mock data
    
    const results: MarketDataPoint[] = [];
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
  private generateMockDataPoint(
    symbol: string,
    dataType: MarketDataType,
    timestamp: Date,
    interval: MarketDataInterval
  ): MarketDataPoint {
    // Base price - use a hash of the symbol to get a consistent base price
    const basePrice = this.getBasePrice(symbol);
    
    // Generate value based on data type
    let value: any;
    
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
      id: uuidv4(),
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
  private getIntervalMilliseconds(interval: MarketDataInterval): number {
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
  private getBasePrice(symbol: string): number {
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
  private generatePriceData(basePrice: number, timestamp: Date): PriceData {
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
  private generateVolumeData(symbol: string, timestamp: Date): number {
    const baseVolume = this.getBasePrice(symbol) * 1000;
    const hourOfDay = timestamp.getUTCHours();
    
    // Volume is typically higher at market open and close
    let volumeFactor = 1.0;
    if (hourOfDay < 2 || hourOfDay > 14) {
      volumeFactor = 1.5;
    } else if (hourOfDay > 5 && hourOfDay < 11) {
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
  private generateTechnicalIndicatorData(basePrice: number, timestamp: Date): any {
    // Generate a random technical indicator
    const indicators = ['RSI', 'MACD', 'SMA', 'EMA', 'Bollinger Bands'];
    const indicator = indicators[Math.floor(Math.random() * indicators.length)];
    
    let value: number;
    let parameters: Record<string, any> = {};
    
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
  private generateNewsSentimentData(symbol: string, timestamp: Date): any {
    // Generate random sentiment
    const sentimentValue = -1 + Math.random() * 2; // Between -1 and 1
    
    let sentiment: 'very-negative' | 'negative' | 'neutral' | 'positive' | 'very-positive';
    
    if (sentimentValue < -0.6) {
      sentiment = 'very-negative';
    } else if (sentimentValue < -0.2) {
      sentiment = 'negative';
    } else if (sentimentValue < 0.2) {
      sentiment = 'neutral';
    } else if (sentimentValue < 0.6) {
      sentiment = 'positive';
    } else {
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
    const sources: string[] = [];
    
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
    const keywords: string[] = [];
    
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