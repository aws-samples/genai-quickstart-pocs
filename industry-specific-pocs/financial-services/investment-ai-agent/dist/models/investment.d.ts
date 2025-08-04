/**
 * Investment model representing various investment types and their properties
 */
export interface Investment {
    id: string;
    type: 'stock' | 'bond' | 'etf' | 'mutual-fund' | 'commodity' | 'cryptocurrency' | 'real-estate' | 'other';
    name: string;
    ticker?: string;
    description: string;
    sector?: string;
    industry?: string;
    marketCap?: number;
    currentPrice?: number;
    historicalPerformance: PerformanceData[];
    fundamentals?: Fundamentals;
    technicalIndicators?: TechnicalIndicators;
    sentimentAnalysis?: SentimentAnalysis;
    riskMetrics: RiskMetrics;
    relatedInvestments: string[];
}
export interface PerformanceData {
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    adjustedClose: number;
}
export interface Fundamentals {
    eps: number;
    peRatio: number;
    pbRatio: number;
    dividendYield?: number;
    revenueGrowth?: number;
    profitMargin?: number;
    debtToEquity?: number;
    freeCashFlow?: number;
    returnOnEquity?: number;
    returnOnAssets?: number;
}
export interface TechnicalIndicators {
    movingAverages: {
        ma50: number;
        ma100: number;
        ma200: number;
    };
    relativeStrengthIndex: number;
    macdLine: number;
    macdSignal: number;
    macdHistogram: number;
    bollingerBands: {
        upper: number;
        middle: number;
        lower: number;
    };
    averageVolume: number;
}
export interface SentimentAnalysis {
    overallSentiment: 'very-negative' | 'negative' | 'neutral' | 'positive' | 'very-positive';
    sentimentScore: number;
    sentimentTrend: 'improving' | 'stable' | 'deteriorating';
    newsVolume: number;
    socialMediaMentions: number;
    analystRecommendations: {
        buy: number;
        hold: number;
        sell: number;
    };
    insiderTrading: {
        buying: number;
        selling: number;
    };
}
export interface RiskMetrics {
    volatility: number;
    beta: number;
    sharpeRatio: number;
    drawdown: number;
    var: number;
    correlations: Record<string, number>;
    stressTestResults?: Record<string, number>;
}
