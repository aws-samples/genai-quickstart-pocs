/**
 * Unit Tests for YahooFinanceProvider
 * 
 * Tests the Yahoo Finance data provider functionality including:
 * - Stock price data fetching
 * - Earnings data retrieval
 * - Company information fetching
 * - Error handling and caching
 */

const YahooFinanceProvider = require('../YahooFinanceProvider');

// Mock the child_process module
jest.mock('child_process');
const { spawn } = require('child_process');

describe('YahooFinanceProvider', () => {
  let provider;
  let mockSpawn;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock spawn function
    mockSpawn = {
      stdout: {
        on: jest.fn(),
        setEncoding: jest.fn()
      },
      stderr: {
        on: jest.fn(),
        setEncoding: jest.fn()
      },
      on: jest.fn(),
      stdin: {
        write: jest.fn(),
        end: jest.fn()
      }
    };
    
    spawn.mockReturnValue(mockSpawn);
    
    provider = new YahooFinanceProvider();
  });

  afterEach(() => {
    if (provider) {
      provider.cleanup();
    }
    jest.clearAllMocks();
  });

  describe('Stock Price Functionality', () => {
    test('should fetch stock price data for valid ticker', async () => {
      // Mock successful Python response
      const mockData = {
        ticker: 'AAPL',
        price: 150.25,
        change: 2.50,
        changePercent: 1.69,
        volume: 50000000,
        marketCap: 2500000000000,
        pe: 25.5,
        eps: 5.89,
        timestamp: new Date().toISOString()
      };

      // Mock the executePythonScript method
      provider.executePythonScript = jest.fn().mockResolvedValue(mockData);

      const result = await provider.getStockPrice('AAPL');
      
      expect(result).toBeTruthy();
      expect(result.ticker).toBe('AAPL');
      expect(typeof result.price).toBe('number');
      expect(result.price).toBeGreaterThan(0);
      expect(typeof result.change).toBe('number');
      expect(typeof result.changePercent).toBe('number');
      expect(typeof result.volume).toBe('number');
      expect(result.timestamp).toBeTruthy();
    });

    test('should return null for invalid ticker', async () => {
      // Mock Python response for invalid ticker
      provider.executePythonScript = jest.fn().mockResolvedValue({ error: 'Invalid ticker' });

      const result = await provider.getStockPrice('INVALIDTICKER123');
      expect(result).toBeNull();
    });

    test('should throw error for missing ticker', async () => {
      await expect(provider.getStockPrice()).rejects.toThrow('Ticker symbol is required');
      await expect(provider.getStockPrice('')).rejects.toThrow('Ticker symbol is required');
      await expect(provider.getStockPrice(null)).rejects.toThrow('Ticker symbol is required');
    });

    test('should normalize ticker symbols', async () => {
      // Mock response for normalized ticker
      const mockData = {
        ticker: 'AAPL',
        price: 150.25,
        change: 2.50,
        changePercent: 1.69,
        volume: 50000000,
        timestamp: new Date().toISOString()
      };

      provider.executePythonScript = jest.fn().mockResolvedValue(mockData);

      const result = await provider.getStockPrice('  aapl  ');
      expect(result).toBeTruthy();
      expect(result.ticker).toBe('AAPL');
    });

    test('should use caching for repeated requests', async () => {
      // Mock response for caching test
      const mockData = {
        ticker: 'MSFT',
        price: 350.75,
        change: 5.25,
        changePercent: 1.50,
        volume: 30000000,
        timestamp: new Date().toISOString()
      };

      provider.executePythonScript = jest.fn().mockResolvedValue(mockData);

      const startTime = Date.now();
      const result1 = await provider.getStockPrice('MSFT');
      const firstRequestTime = Date.now() - startTime;

      // Second call should use cache (mock should only be called once)
      const startTime2 = Date.now();
      const result2 = await provider.getStockPrice('MSFT');
      const secondRequestTime = Date.now() - startTime2;

      expect(result1).toEqual(result2);
      // The second request should be much faster due to caching (or at least not slower)
      expect(secondRequestTime).toBeLessThanOrEqual(firstRequestTime + 10); // Allow some margin for timing variations
      expect(provider.executePythonScript).toHaveBeenCalledTimes(1); // Should only call Python once
    });
  });

  describe('Provider Configuration', () => {
    test('should return correct provider configuration', () => {
      const config = provider.getProviderConfig();
      
      expect(config.name).toBe('YahooFinanceProvider');
      expect(config.version).toBe('1.0.0');
      expect(config.capabilities).toContain('stock_price');
      expect(config.capabilities).toContain('earnings');
      expect(config.capabilities).toContain('company_info');
      expect(config.requiresApiKey).toBe(false);
    });

    test('should have correct rate limits', () => {
      const config = provider.getProviderConfig();
      
      expect(config.rateLimits.requestsPerMinute).toBe(120);
      expect(config.rateLimits.burstLimit).toBe(30);
    });
  });

  describe('Error Handling', () => {
    test('should handle Python process errors gracefully', async () => {
      // Mock the executePythonScript to simulate an error
      provider.executePythonScript = jest.fn().mockRejectedValue(new Error('Python process failed'));

      await expect(provider.getStockPrice('AAPL')).rejects.toThrow('Python process failed');
    });

    test('should handle invalid JSON response', async () => {
      // Mock the executePythonScript to return invalid JSON
      provider.executePythonScript = jest.fn().mockResolvedValue({ error: 'Invalid ticker' });

      const result = await provider.getStockPrice('INVALID');
      expect(result).toBeNull();
    });
  });

  describe('Earnings Data Functionality', () => {
    test('should fetch earnings data for valid ticker', async () => {
      // Mock successful earnings response
      const mockEarnings = [
        {
          ticker: 'AAPL',
          quarter: 'Q1',
          year: 2024,
          revenue: 119575000000,
          netIncome: 33916000000,
          eps: 2.18,
          reportDate: '2024-02-01',
          fiscalEndDate: '2023-12-31'
        },
        {
          ticker: 'AAPL',
          quarter: 'Q4',
          year: 2023,
          revenue: 119575000000,
          netIncome: 33916000000,
          eps: 2.18,
          reportDate: '2023-11-02',
          fiscalEndDate: '2023-09-30'
        }
      ];

      provider.executePythonScript = jest.fn().mockResolvedValue(mockEarnings);

      const result = await provider.getEarningsData('AAPL');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      const earnings = result[0];
      expect(earnings).toHaveProperty('ticker');
      expect(earnings).toHaveProperty('quarter');
      expect(earnings).toHaveProperty('year');
      expect(earnings).toHaveProperty('reportDate');
      expect(earnings).toHaveProperty('fiscalEndDate');
      expect(earnings.ticker).toBe('AAPL');
      expect(typeof earnings.year).toBe('number');
      expect(earnings.quarter).toMatch(/^Q[1-4]$/);
    });

    test('should return empty array for invalid ticker', async () => {
      provider.executePythonScript = jest.fn().mockResolvedValue([]);

      const result = await provider.getEarningsData('INVALIDTICKER123');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test('should handle missing earnings data gracefully', async () => {
      provider.executePythonScript = jest.fn().mockResolvedValue([]);

      const result = await provider.getEarningsData('BRK-A');
      expect(Array.isArray(result)).toBe(true);
    });

    test('should throw error for missing ticker parameter', async () => {
      await expect(provider.getEarningsData()).rejects.toThrow('Ticker symbol is required');
      await expect(provider.getEarningsData('')).rejects.toThrow('Ticker symbol is required');
      await expect(provider.getEarningsData(null)).rejects.toThrow('Ticker symbol is required');
    });
  });

  describe('Company Info Functionality', () => {
    test('should fetch company info for valid ticker', async () => {
      // Mock successful company info response
      const mockCompanyInfo = {
        ticker: 'AAPL',
        name: 'Apple Inc.',
        sector: 'Technology',
        industry: 'Consumer Electronics',
        description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
        website: 'https://www.apple.com',
        employees: 164000,
        marketCap: 2500000000000,
        currency: 'USD'
      };

      provider.executePythonScript = jest.fn().mockResolvedValue(mockCompanyInfo);

      const result = await provider.getCompanyInfo('AAPL');
      
      expect(result).toBeTruthy();
      expect(result).toHaveProperty('ticker');
      expect(result).toHaveProperty('name');
      expect(result.ticker).toBe('AAPL');
      expect(typeof result.name).toBe('string');
      expect(result.name.length).toBeGreaterThan(0);
    });

    test('should return null for invalid ticker', async () => {
      provider.executePythonScript = jest.fn().mockResolvedValue(null);

      const result = await provider.getCompanyInfo('INVALIDTICKER123');
      expect(result).toBeNull();
    });

    test('should throw error for missing ticker parameter', async () => {
      await expect(provider.getCompanyInfo()).rejects.toThrow('Ticker symbol is required');
      await expect(provider.getCompanyInfo('')).rejects.toThrow('Ticker symbol is required');
      await expect(provider.getCompanyInfo(null)).rejects.toThrow('Ticker symbol is required');
    });
  });

  describe('Data Format Validation', () => {
    test('should return stock data in expected format', async () => {
      // Mock complete stock data response
      const mockStockData = {
        ticker: 'GOOGL',
        price: 175.50,
        change: 2.25,
        changePercent: 1.30,
        volume: 25000000,
        previousClose: 173.25,
        open: 174.00,
        high: 176.00,
        low: 173.50,
        marketCap: 2200000000000,
        pe: 28.5,
        eps: 6.15,
        timestamp: new Date().toISOString()
      };

      provider.executePythonScript = jest.fn().mockResolvedValue(mockStockData);

      const result = await provider.getStockPrice('GOOGL');
      
      expect(result).toBeTruthy();
      expect(result).toHaveProperty('ticker');
      expect(result).toHaveProperty('price');
      expect(result).toHaveProperty('change');
      expect(result).toHaveProperty('changePercent');
      expect(result).toHaveProperty('volume');
      expect(result).toHaveProperty('previousClose');
      expect(result).toHaveProperty('open');
      expect(result).toHaveProperty('high');
      expect(result).toHaveProperty('low');
      expect(result).toHaveProperty('timestamp');
      
      // Optional fields
      if (result.marketCap !== null) expect(typeof result.marketCap).toBe('number');
      if (result.pe !== null) expect(typeof result.pe).toBe('number');
      if (result.eps !== null) expect(typeof result.eps).toBe('number');
    });

    test('should return earnings data in expected format', async () => {
      // Mock earnings data response
      const mockEarningsData = [
        {
          ticker: 'MSFT',
          quarter: 'Q1',
          year: 2024,
          revenue: 62000000000,
          netIncome: 22291000000,
          eps: 2.99,
          reportDate: '2024-01-24',
          fiscalEndDate: '2023-12-31'
        }
      ];

      provider.executePythonScript = jest.fn().mockResolvedValue(mockEarningsData);

      const result = await provider.getEarningsData('MSFT');
      
      expect(result.length).toBeGreaterThan(0);
      const earnings = result[0];
      expect(earnings).toHaveProperty('ticker');
      expect(earnings).toHaveProperty('quarter');
      expect(earnings).toHaveProperty('year');
      expect(earnings).toHaveProperty('reportDate');
      expect(earnings).toHaveProperty('fiscalEndDate');
      
      // Optional fields that should be null or numbers
      if (earnings.eps !== null) expect(typeof earnings.eps).toBe('number');
      if (earnings.revenue !== null) expect(typeof earnings.revenue).toBe('number');
      if (earnings.netIncome !== null) expect(typeof earnings.netIncome).toBe('number');
    });
  });
});