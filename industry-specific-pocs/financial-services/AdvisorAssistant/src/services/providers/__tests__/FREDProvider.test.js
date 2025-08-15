/**
 * FRED Provider Tests
 * 
 * Tests for the FREDProvider class including interest rate data fetching,
 * CPI data retrieval, and error handling scenarios.
 * 
 * @author Advisor Assistant Team
 * @version 1.0.0
 */

const FREDProvider = require('../FREDProvider');

// Mock axios to control HTTP responses
jest.mock('axios');
const axios = require('axios');

describe('FREDProvider', () => {
  let provider;
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env.FRED_API_KEY;
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset axios mock
    axios.mockReset();
  });

  afterEach(() => {
    // Restore original environment
    if (originalEnv) {
      process.env.FRED_API_KEY = originalEnv;
    } else {
      delete process.env.FRED_API_KEY;
    }
    
    // Cleanup provider
    if (provider) {
      provider.cleanup();
    }
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with API key', () => {
      process.env.FRED_API_KEY = 'test-api-key';
      provider = new FREDProvider();
      
      expect(provider.isProviderEnabled()).toBe(true);
      expect(provider.getProviderName()).toBe('fred');
    });

    test('should initialize without API key and disable provider', () => {
      delete process.env.FRED_API_KEY;
      provider = new FREDProvider();
      
      expect(provider.isProviderEnabled()).toBe(false);
    });

    test('should have correct provider configuration', () => {
      process.env.FRED_API_KEY = 'test-api-key';
      provider = new FREDProvider();
      
      const config = provider.getProviderConfig();
      expect(config.name).toBe('FREDProvider');
      expect(config.capabilities).toContain('interest_rates');
      expect(config.capabilities).toContain('inflation_data');
      expect(config.requiresApiKey).toBe(false);
    });
  });

  describe('Interest Rate Data Fetching', () => {
    beforeEach(() => {
      process.env.FRED_API_KEY = 'test-api-key';
      provider = new FREDProvider();
    });

    test('should fetch federal funds rate data successfully', async () => {
      const mockResponse = {
        observations: [
          { date: '2024-01-01', value: '5.33' },
          { date: '2023-12-01', value: '5.33' },
          { date: '2023-11-01', value: '5.33' },
          { date: '2023-10-01', value: '5.33' }
        ]
      };

      axios.mockResolvedValue({ data: mockResponse });

      const result = await provider.getInterestRateData();

      expect(result).toBeTruthy();
      expect(result.series).toBe('Federal Funds Rate');
      expect(result.currentValue).toBe(5.33);
      expect(result.currentDate).toBe('2024-01-01');
      expect(result.historicalData).toHaveLength(4);
      expect(result.units).toBe('Percent');
      expect(result.frequency).toBe('Monthly');
    });

    test('should handle missing or invalid data points', async () => {
      const mockResponse = {
        observations: [
          { date: '2024-01-01', value: '5.33' },
          { date: '2023-12-01', value: '.' }, // Invalid value
          { date: '2023-11-01', value: 'N/A' }, // Invalid value
          { date: '2023-10-01', value: '5.25' }
        ]
      };

      axios.mockResolvedValue({ data: mockResponse });

      const result = await provider.getInterestRateData();

      expect(result).toBeTruthy();
      expect(result.historicalData).toHaveLength(2); // Only valid data points
      expect(result.historicalData[0].value).toBe(5.33);
      expect(result.historicalData[1].value).toBe(5.25);
    });

    test('should return null when no data is available', async () => {
      const mockResponse = {
        observations: []
      };

      axios.mockResolvedValue({ data: mockResponse });

      const result = await provider.getInterestRateData();

      expect(result).toBeNull();
    });

    test('should handle API errors gracefully', async () => {
      axios.mockRejectedValue(new Error('Network error'));

      const result = await provider.getInterestRateData();

      expect(result).toBeNull();
    });

    test('should return null when provider is disabled', async () => {
      delete process.env.FRED_API_KEY;
      provider = new FREDProvider();

      const result = await provider.getInterestRateData();

      expect(result).toBeNull();
    });

    test('should use caching for repeated requests', async () => {
      const mockResponse = {
        observations: [
          { date: '2024-01-01', value: '5.33' }
        ]
      };

      axios.mockResolvedValue({ data: mockResponse });

      // First request
      const result1 = await provider.getInterestRateData();
      expect(result1).toBeTruthy();

      // Second request should use cache
      const result2 = await provider.getInterestRateData();
      expect(result2).toBeTruthy();

      // Should only have made one API call
      expect(axios).toHaveBeenCalledTimes(1);
    });

    test('should validate economic data completeness', async () => {
      const mockResponse = {
        observations: [
          { date: '2024-01-01', value: '5.33' },
          { date: '2023-12-01', value: '5.25' }
        ]
      };

      axios.mockResolvedValue({ data: mockResponse });

      const result = await provider.getInterestRateData();

      expect(result).toBeTruthy();
      expect(result.currentValue).toBeDefined();
      expect(result.currentDate).toBeDefined();
      expect(result.historicalData).toBeDefined();
      expect(Array.isArray(result.historicalData)).toBe(true);
      expect(result.historicalData.length).toBeGreaterThan(0);
    });

    test('should format interest rate historical data correctly', async () => {
      const mockResponse = {
        observations: [
          { date: '2024-01-01', value: '5.33' },
          { date: '2023-12-01', value: '5.25' }
        ]
      };

      axios.mockResolvedValue({ data: mockResponse });

      const result = await provider.getInterestRateData();

      expect(result.historicalData[0]).toEqual({
        date: '2024-01-01',
        value: 5.33,
        series: 'Federal Funds Rate'
      });

      expect(result.historicalData[1]).toEqual({
        date: '2023-12-01',
        value: 5.25,
        series: 'Federal Funds Rate'
      });
    });

    test('should handle authentication errors', async () => {
      const authError = new Error('Unauthorized');
      authError.response = { status: 401 };
      
      axios.mockRejectedValue(authError);

      const result = await provider.getInterestRateData();

      expect(result).toBeNull();
      expect(provider.isProviderEnabled()).toBe(false);
    });

    test('should build correct API URL', () => {
      const url = provider.buildApiUrl('series/observations', {
        series_id: 'FEDFUNDS',
        limit: 12
      });

      expect(url).toContain('api.stlouisfed.org/fred/series/observations');
      expect(url).toContain('api_key=test-api-key');
      expect(url).toContain('file_type=json');
      expect(url).toContain('series_id=FEDFUNDS');
      expect(url).toContain('limit=12');
    });
  });

  describe('DataProviderInterface Implementation', () => {
    beforeEach(() => {
      process.env.FRED_API_KEY = 'test-api-key';
      provider = new FREDProvider();
    });

    test('should return null for getStockPrice', async () => {
      const result = await provider.getStockPrice('AAPL');
      expect(result).toBeNull();
    });

    test('should return empty array for getEarningsData', async () => {
      const result = await provider.getEarningsData('AAPL');
      expect(result).toEqual([]);
    });

    test('should return null for getCompanyInfo', async () => {
      const result = await provider.getCompanyInfo('AAPL');
      expect(result).toBeNull();
    });

    test('should return empty array for getMarketNews', async () => {
      const result = await provider.getMarketNews('AAPL');
      expect(result).toEqual([]);
    });

    test('should return failure message for updateStockPrices', async () => {
      const result = await provider.updateStockPrices();
      expect(result.success).toBe(false);
      expect(result.message).toContain('not applicable');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      process.env.FRED_API_KEY = 'test-api-key';
      provider = new FREDProvider();
    });

    test('should handle network timeouts', async () => {
      const timeoutError = new Error('timeout');
      timeoutError.code = 'ECONNABORTED';
      
      axios.mockRejectedValue(timeoutError);

      const result = await provider.getInterestRateData();
      expect(result).toBeNull();
    });

    test('should handle invalid JSON responses', async () => {
      axios.mockResolvedValue({ data: 'invalid json' });

      const result = await provider.getInterestRateData();
      expect(result).toBeNull();
    });

    test('should handle rate limiting errors', async () => {
      const rateLimitError = new Error('Too Many Requests');
      rateLimitError.response = { status: 429 };
      
      axios.mockRejectedValue(rateLimitError);

      const result = await provider.getInterestRateData();
      expect(result).toBeNull();
    });
  });

  describe('CPI and Inflation Data Fetching', () => {
    beforeEach(() => {
      process.env.FRED_API_KEY = 'test-api-key';
      provider = new FREDProvider();
    });

    test('should fetch CPI data successfully', async () => {
      const mockAllItemsResponse = {
        observations: [
          { date: '2024-01-01', value: '310.326' },
          { date: '2023-12-01', value: '310.422' },
          { date: '2023-11-01', value: '307.671' },
          { date: '2023-10-01', value: '307.789' }
        ]
      };

      const mockCoreResponse = {
        observations: [
          { date: '2024-01-01', value: '290.326' },
          { date: '2023-12-01', value: '290.422' },
          { date: '2023-11-01', value: '287.671' },
          { date: '2023-10-01', value: '287.789' }
        ]
      };

      // Mock both API calls for all items and core CPI
      axios
        .mockResolvedValueOnce({ data: mockAllItemsResponse })
        .mockResolvedValueOnce({ data: mockCoreResponse });

      const result = await provider.getCPIData();

      expect(result).toBeTruthy();
      expect(result.allItems).toBeTruthy();
      expect(result.core).toBeTruthy();
      expect(result.allItems.currentValue).toBe(310.326);
      expect(result.core.currentValue).toBe(290.326);
      expect(result.allItems.series).toContain('All Items');
      expect(result.core.series).toContain('Core');
    });

    test('should calculate inflation rates correctly', async () => {
      // Create mock data with 24 months of CPI data for proper inflation calculation
      const mockCPIData = [];
      const baseDate = new Date('2024-01-01');
      const baseCPI = 310.0;
      
      for (let i = 0; i < 24; i++) {
        const date = new Date(baseDate);
        date.setMonth(date.getMonth() - i);
        const cpiValue = baseCPI - (i * 0.5); // Simulate gradual decrease
        
        mockCPIData.push({
          date: date.toISOString().split('T')[0],
          value: cpiValue.toFixed(3)
        });
      }

      const mockResponse = { observations: mockCPIData };

      // Mock both API calls with the same data
      axios
        .mockResolvedValueOnce({ data: mockResponse })
        .mockResolvedValueOnce({ data: mockResponse });

      const result = await provider.getCPIData();

      expect(result).toBeTruthy();
      expect(result.inflation).toBeTruthy();
      expect(result.inflation.allItems).toBeTruthy();
      expect(result.inflation.allItems.currentRate).toBeDefined();
      expect(typeof result.inflation.allItems.currentRate).toBe('number');
    });

    test('should handle missing CPI data gracefully', async () => {
      const mockResponse = {
        observations: []
      };

      axios
        .mockResolvedValueOnce({ data: mockResponse })
        .mockResolvedValueOnce({ data: mockResponse });

      const result = await provider.getCPIData();

      expect(result).toBeNull();
    });

    test('should handle invalid CPI data points', async () => {
      const mockResponse = {
        observations: [
          { date: '2024-01-01', value: '310.326' },
          { date: '2023-12-01', value: '.' }, // Invalid value
          { date: '2023-11-01', value: 'N/A' }, // Invalid value
          { date: '2023-10-01', value: '307.789' }
        ]
      };

      axios
        .mockResolvedValueOnce({ data: mockResponse })
        .mockResolvedValueOnce({ data: mockResponse });

      const result = await provider.getCPIData();

      expect(result).toBeTruthy();
      expect(result.allItems.historicalData).toHaveLength(2); // Only valid data points
      expect(result.core.historicalData).toHaveLength(2);
    });

    test('should return null when provider is disabled for CPI data', async () => {
      delete process.env.FRED_API_KEY;
      provider = new FREDProvider();

      const result = await provider.getCPIData();

      expect(result).toBeNull();
    });

    test('should handle CPI API errors gracefully', async () => {
      axios.mockRejectedValue(new Error('CPI API error'));

      const result = await provider.getCPIData();

      expect(result).toBeNull();
    });

    test('should format CPI data for AI analysis context', async () => {
      const mockResponse = {
        observations: [
          { date: '2024-01-01', value: '310.326' },
          { date: '2023-12-01', value: '310.422' }
        ]
      };

      axios
        .mockResolvedValueOnce({ data: mockResponse })
        .mockResolvedValueOnce({ data: mockResponse });

      const result = await provider.getCPIData();

      expect(result).toBeTruthy();
      expect(result.allItems.units).toBe('Index 1982-1984=100');
      expect(result.allItems.frequency).toBe('Monthly');
      expect(result.lastUpdated).toBeDefined();
      expect(result.allItems.historicalData[0]).toEqual({
        date: '2024-01-01',
        value: 310.326,
        series: 'All Items'
      });
    });

    test('should handle delayed economic data gracefully', async () => {
      // Simulate delayed data by having fewer observations
      const mockResponse = {
        observations: [
          { date: '2023-10-01', value: '307.789' } // Only one old data point
        ]
      };

      axios
        .mockResolvedValueOnce({ data: mockResponse })
        .mockResolvedValueOnce({ data: mockResponse });

      const result = await provider.getCPIData();

      expect(result).toBeTruthy();
      expect(result.allItems.currentValue).toBe(307.789);
      expect(result.inflation.allItems).toBeNull(); // Not enough data for inflation calculation
    });

    test('should use caching for CPI data requests', async () => {
      const mockResponse = {
        observations: [
          { date: '2024-01-01', value: '310.326' }
        ]
      };

      axios
        .mockResolvedValueOnce({ data: mockResponse })
        .mockResolvedValueOnce({ data: mockResponse });

      // First request
      const result1 = await provider.getCPIData();
      expect(result1).toBeTruthy();

      // Second request should use cache
      const result2 = await provider.getCPIData();
      expect(result2).toBeTruthy();

      // Should only have made two API calls (one for each CPI series)
      expect(axios).toHaveBeenCalledTimes(2);
    });
  });

  describe('Comprehensive Macro Economic Data', () => {
    beforeEach(() => {
      process.env.FRED_API_KEY = 'test-api-key';
      provider = new FREDProvider();
    });

    test('should fetch comprehensive macro economic data', async () => {
      const mockInterestResponse = {
        observations: [
          { date: '2024-01-01', value: '5.33' }
        ]
      };

      const mockCPIResponse = {
        observations: [
          { date: '2024-01-01', value: '310.326' }
        ]
      };

      // Mock all API calls
      axios
        .mockResolvedValueOnce({ data: mockInterestResponse }) // Interest rates
        .mockResolvedValueOnce({ data: mockCPIResponse }) // CPI All Items
        .mockResolvedValueOnce({ data: mockCPIResponse }); // CPI Core

      const result = await provider.getMacroEconomicData();

      expect(result).toBeTruthy();
      expect(result.interestRates).toBeTruthy();
      expect(result.inflation).toBeTruthy();
      expect(result.summary).toBeTruthy();
      expect(result.summary.federalFundsRate).toBe(5.33);
      expect(result.summary.cpiAllItems).toBe(310.326);
      expect(result.dataAvailability.interestRates).toBe(true);
      expect(result.dataAvailability.cpi).toBe(true);
    });

    test('should handle partial data availability', async () => {
      const mockInterestResponse = {
        observations: [
          { date: '2024-01-01', value: '5.33' }
        ]
      };

      // Mock successful interest rate call but failed CPI calls
      axios
        .mockResolvedValueOnce({ data: mockInterestResponse })
        .mockRejectedValueOnce(new Error('CPI API error'))
        .mockRejectedValueOnce(new Error('CPI API error'));

      const result = await provider.getMacroEconomicData();

      expect(result).toBeTruthy();
      expect(result.interestRates).toBeTruthy();
      expect(result.inflation).toBeNull();
      expect(result.dataAvailability.interestRates).toBe(true);
      expect(result.dataAvailability.cpi).toBe(false);
    });

    test('should return null when provider is disabled for macro data', async () => {
      delete process.env.FRED_API_KEY;
      provider = new FREDProvider();

      const result = await provider.getMacroEconomicData();

      expect(result).toBeNull();
    });
  });

  describe('Utility Methods', () => {
    beforeEach(() => {
      process.env.FRED_API_KEY = 'test-api-key';
      provider = new FREDProvider();
    });

    test('should calculate date months ago correctly', () => {
      const date = provider.getDateMonthsAgo(12);
      const expectedDate = new Date();
      expectedDate.setMonth(expectedDate.getMonth() - 12);
      
      expect(date).toBe(expectedDate.toISOString().split('T')[0]);
    });

    test('should generate correct cache keys', () => {
      const cacheKey = provider.generateCacheKey('interest_rates', 'FEDFUNDS');
      expect(cacheKey).toBe('fred:interest_rates:FEDFUNDS:');
    });

    test('should calculate inflation rate correctly', () => {
      const mockCPIData = [
        { date: '2023-01-01', value: 300.0 },
        { date: '2023-02-01', value: 301.0 },
        { date: '2023-03-01', value: 302.0 },
        { date: '2023-04-01', value: 303.0 },
        { date: '2023-05-01', value: 304.0 },
        { date: '2023-06-01', value: 305.0 },
        { date: '2023-07-01', value: 306.0 },
        { date: '2023-08-01', value: 307.0 },
        { date: '2023-09-01', value: 308.0 },
        { date: '2023-10-01', value: 309.0 },
        { date: '2023-11-01', value: 310.0 },
        { date: '2023-12-01', value: 311.0 },
        { date: '2024-01-01', value: 312.0 } // 13th data point for YoY calculation
      ];

      const inflationRate = provider.calculateInflationRate(mockCPIData);

      expect(inflationRate).toBeTruthy();
      expect(inflationRate.currentRate).toBe(4.0); // (312-300)/300 * 100 = 4%
      expect(inflationRate.currentPeriod).toBe('2024-01-01');
      expect(inflationRate.comparisonPeriod).toBe('2023-01-01');
    });

    test('should return null for insufficient inflation data', () => {
      const mockCPIData = [
        { date: '2024-01-01', value: 312.0 }
      ]; // Only one data point

      const inflationRate = provider.calculateInflationRate(mockCPIData);

      expect(inflationRate).toBeNull();
    });
  });
});