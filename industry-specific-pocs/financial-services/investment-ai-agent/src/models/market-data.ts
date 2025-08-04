/**
 * Market data models for real-time market data integration
 */

/**
 * Market data feed configuration
 */
export interface MarketDataFeedConfig {
  provider: string;
  apiKey?: string;
  dataTypes: MarketDataType[];
  symbols: string[];
  interval: MarketDataInterval;
  maxHistoricalDays?: number;
  refreshInterval?: number; // in milliseconds
}

/**
 * Market data types
 */
export type MarketDataType = 
  | 'price'
  | 'volume'
  | 'order-book'
  | 'technical-indicators'
  | 'news-sentiment'
  | 'economic-indicators'
  | 'volatility-metrics'
  | 'options-data'
  | 'futures-data'
  | 'forex-data';

/**
 * Market data intervals
 */
export type MarketDataInterval = 
  | 'tick'
  | '1min'
  | '5min'
  | '15min'
  | '30min'
  | '1hour'
  | '4hour'
  | 'daily'
  | 'weekly'
  | 'monthly';

/**
 * Market data point
 */
export interface MarketDataPoint {
  id: string;
  symbol: string;
  dataType: MarketDataType;
  timestamp: Date;
  value: any;
  source: string;
  interval: MarketDataInterval;
  metadata?: Record<string, any>;
}

/**
 * Price data
 */
export interface PriceData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose?: number;
}

/**
 * Order book data
 */
export interface OrderBookData {
  bids: Array<[number, number]>; // price, quantity
  asks: Array<[number, number]>; // price, quantity
  spread: number;
  depth: number;
}

/**
 * Technical indicator data
 */
export interface TechnicalIndicatorData {
  indicator: string;
  value: number;
  parameters: Record<string, any>;
}

/**
 * News sentiment data
 */
export interface NewsSentimentData {
  sentiment: 'very-negative' | 'negative' | 'neutral' | 'positive' | 'very-positive';
  score: number; // -1.0 to 1.0
  articleCount: number;
  sources: string[];
  keywords: string[];
}

/**
 * Economic indicator data
 */
export interface EconomicIndicatorData {
  indicator: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  forecast?: number;
  period: string;
  country?: string;
}

/**
 * Volatility metrics data
 */
export interface VolatilityData {
  historicalVolatility: number;
  impliedVolatility?: number;
  vix?: number;
  bollingerBandWidth?: number;
  averageTrueRange?: number;
}

/**
 * Market alert configuration
 */
export interface MarketAlertConfig {
  id: string;
  name: string;
  description?: string;
  symbol: string;
  dataType: MarketDataType;
  condition: AlertCondition;
  threshold: number;
  comparisonValue?: 'previous' | 'moving-average' | 'fixed';
  movingAveragePeriod?: number;
  enabled: boolean;
  cooldownPeriod?: number; // in milliseconds
  lastTriggered?: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  notificationChannels: NotificationChannel[];
}

/**
 * Alert condition
 */
export type AlertCondition = 
  | 'greater-than'
  | 'less-than'
  | 'equal-to'
  | 'percent-change-up'
  | 'percent-change-down'
  | 'crosses-above'
  | 'crosses-below'
  | 'volume-spike'
  | 'volatility-increase'
  | 'custom';

/**
 * Notification channel
 */
export interface NotificationChannel {
  type: 'email' | 'sms' | 'push' | 'webhook';
  destination: string;
  enabled: boolean;
}

/**
 * Market alert
 */
export interface MarketAlert {
  id: string;
  alertConfigId: string;
  symbol: string;
  dataType: MarketDataType;
  condition: AlertCondition;
  threshold: number;
  triggeredValue: number;
  comparisonValue?: number;
  timestamp: Date;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  metadata?: Record<string, any>;
}

/**
 * Market data storage configuration
 */
export interface MarketDataStorageConfig {
  storageType: 'timestream' | 'dynamodb' | 'memory';
  retentionPeriod: {
    highResolution: number; // in days
    lowResolution: number; // in days
  };
  aggregationIntervals: MarketDataInterval[];
  compressionEnabled: boolean;
}

/**
 * Market data query
 */
export interface MarketDataQuery {
  symbols: string[];
  dataTypes: MarketDataType[];
  timeRange: {
    start: Date;
    end: Date;
  };
  interval?: MarketDataInterval;
  aggregation?: 'none' | 'ohlc' | 'avg' | 'min' | 'max' | 'sum';
  limit?: number;
}

/**
 * Market data query result
 */
export interface MarketDataQueryResult {
  data: MarketDataPoint[];
  metadata: {
    query: MarketDataQuery;
    count: number;
    executionTime: number;
    nextToken?: string;
  };
}

/**
 * Market data feed status
 */
export interface MarketDataFeedStatus {
  provider: string;
  connected: boolean;
  connectionId?: string;
  latency?: number; // in milliseconds
  lastUpdated: Date;
  activeSymbols: number;
  activeDataTypes: MarketDataType[];
  errors?: string[];
  throttleStatus?: {
    requestsPerMinute: number;
    maxRequestsPerMinute: number;
    throttled: boolean;
  };
}

/**
 * Market data normalization options
 */
export interface MarketDataNormalizationOptions {
  adjustForSplits: boolean;
  adjustForDividends: boolean;
  fillGaps: boolean;
  fillMethod?: 'previous' | 'linear' | 'zero';
  timezone: string;
  currency?: string;
  convertCurrency?: boolean;
}

/**
 * Market data normalization result
 */
export interface MarketDataNormalizationResult {
  originalData: MarketDataPoint[];
  normalizedData: MarketDataPoint[];
  transformations: string[];
  warnings: string[];
}