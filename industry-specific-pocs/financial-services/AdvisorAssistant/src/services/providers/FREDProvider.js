/**
 * FRED (Federal Reserve Economic Data) Provider
 * 
 * Provides macro economic data including interest rates, inflation data (CPI),
 * and other economic indicators from the Federal Reserve Economic Data API.
 * 
 * Features:
 * - Federal funds rate data
 * - Consumer Price Index (CPI) and inflation data
 * - Long-term caching (24 hours) for economic data
 * - Optional API key - system continues without macro data if unavailable
 * - Graceful error handling that doesn't break the main application
 * 
 * @author Advisor Assistant Team
 * @version 1.0.0
 */

const BaseProvider = require('./BaseProvider');

class FREDProvider extends BaseProvider {
  constructor(config = {}) {
    super('fred', {
      ...config,
      providers: {
        fred: {
          cache: {
            macro_data: 86400000, // 24 hours
            interest_rates: 86400000, // 24 hours
            cpi_data: 86400000 // 24 hours
          },
          rateLimit: {
            requestsPerMinute: 120, // No official limit, be conservative
            burstLimit: 30
          },
          requestTimeout: 10000, // 10 seconds
          maxRetries: 2,
          retryDelay: 1000
        }
      }
    });

    // FRED API configuration
    this.baseUrl = 'https://api.stlouisfed.org/fred';
    this.apiKey = this.config.getApiKey('fred');
    
    // FRED series IDs for economic indicators
    this.seriesIds = {
      federalFundsRate: 'FEDFUNDS', // Federal Funds Effective Rate
      cpiAllItems: 'CPIAUCSL', // Consumer Price Index for All Urban Consumers: All Items
      cpiCore: 'CPILFESL', // Consumer Price Index for All Urban Consumers: All Items Less Food and Energy
      gdp: 'GDP', // Gross Domestic Product
      unemployment: 'UNRATE', // Unemployment Rate
      inflation: 'T10YIE' // 10-Year Breakeven Inflation Rate
    };

    // Check if API key is available
    if (!this.apiKey) {
      console.log('⚠️  FRED API key not found - macro economic data will be unavailable');
      console.log('   Set FRED_API_KEY environment variable to enable FRED data');
      this.isEnabled = false;
    } else {
      console.log('📊 FREDProvider initialized with API key');
      this.isEnabled = true;
    }
  }

  /**
   * Check if provider is enabled (has API key)
   * @returns {boolean} True if provider is enabled
   */
  isProviderEnabled() {
    return this.isEnabled;
  }

  /**
   * Build FRED API URL with parameters
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {string} Complete API URL
   */
  buildApiUrl(endpoint, params = {}) {
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    
    // Add API key if available
    if (this.apiKey) {
      url.searchParams.append('api_key', this.apiKey);
    }
    
    // Add file type parameter (JSON)
    url.searchParams.append('file_type', 'json');
    
    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    });
    
    return url.toString();
  }

  /**
   * Make request to FRED API with enhanced error handling
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise<any>} API response data
   */
  async makeFredRequest(endpoint, params = {}) {
    if (!this.isEnabled) {
      const disabledError = new Error('FRED provider is not enabled - missing API key');
      disabledError.category = 'auth';
      disabledError.severity = 'medium'; // Medium because FRED is optional
      disabledError.isRetryable = false;
      throw disabledError;
    }

    const url = this.buildApiUrl(endpoint, params);
    
    try {
      const response = await this.makeRequest(url);
      
      // Check for FRED API error responses
      if (response && response.error_message) {
        throw this.createFredError(response);
      }
      
      // FRED API returns data in a specific format
      if (response && response.observations) {
        return response.observations;
      } else if (response && response.series) {
        return response.series;
      } else if (response) {
        return response;
      }
      
      const formatError = new Error('Invalid response format from FRED API');
      formatError.category = 'data';
      formatError.severity = 'medium';
      formatError.isRetryable = false;
      throw formatError;
      
    } catch (error) {
      // Enhance error with FRED-specific categorization
      const enhancedError = this.enhanceFredError(error, endpoint);
      
      // For authentication errors, disable the provider
      if (enhancedError.category === 'auth') {
        this.isEnabled = false;
        console.error('❌ FRED API authentication failed - provider disabled');
      }
      
      throw enhancedError;
    }
  }

  /**
   * Create FRED error from API response
   * @param {Object} response - FRED error response
   * @returns {Error} Enhanced error
   */
  createFredError(response) {
    const errorMessage = response.error_message || 'Unknown FRED API error';
    const errorCode = response.error_code;
    
    let enhancedError = new Error(`FRED API Error: ${errorMessage}`);
    
    // Categorize based on FRED error codes and messages
    if (errorMessage.includes('api_key') || errorMessage.includes('API key')) {
      enhancedError.category = 'auth';
      enhancedError.severity = 'medium'; // Medium because FRED is optional
      enhancedError.isRetryable = false;
    } else if (errorMessage.includes('series does not exist') || errorMessage.includes('not found')) {
      enhancedError.category = 'data';
      enhancedError.severity = 'medium';
      enhancedError.isRetryable = false;
    } else if (errorMessage.includes('bad request') || errorMessage.includes('invalid')) {
      enhancedError.category = 'validation';
      enhancedError.severity = 'medium';
      enhancedError.isRetryable = false;
    } else if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
      enhancedError.category = 'rate_limit';
      enhancedError.severity = 'medium';
      enhancedError.isRetryable = true;
    } else {
      enhancedError.category = 'provider';
      enhancedError.severity = 'medium';
      enhancedError.isRetryable = true;
    }
    
    enhancedError.fredErrorCode = errorCode;
    return enhancedError;
  }

  /**
   * Enhance error with FRED-specific categorization
   * @param {Error} error - Original error
   * @param {string} endpoint - API endpoint that failed
   * @returns {Error} Enhanced error
   */
  enhanceFredError(error, endpoint) {
    // If already enhanced by createFredError, return as-is
    if (error.fredErrorCode !== undefined) {
      return error;
    }
    
    const statusCode = error.response?.status;
    let enhancedError = error;
    
    if (statusCode === 400) {
      enhancedError = new Error(`FRED API bad request for ${endpoint} - check parameters`);
      enhancedError.category = 'validation';
      enhancedError.severity = 'medium';
      enhancedError.isRetryable = false;
    } else if (statusCode === 401 || statusCode === 403) {
      enhancedError = new Error('FRED API authentication failed - check API key or permissions');
      enhancedError.category = 'auth';
      enhancedError.severity = 'medium'; // Medium because FRED is optional
      enhancedError.isRetryable = false;
    } else if (statusCode === 404) {
      enhancedError = new Error(`FRED API endpoint not found: ${endpoint}`);
      enhancedError.category = 'data';
      enhancedError.severity = 'medium';
      enhancedError.isRetryable = false;
    } else if (statusCode === 429) {
      enhancedError = new Error('FRED API rate limit exceeded');
      enhancedError.category = 'rate_limit';
      enhancedError.severity = 'medium';
      enhancedError.isRetryable = true;
    } else if (statusCode >= 500) {
      enhancedError = new Error(`FRED API server error (${statusCode}) - service temporarily unavailable`);
      enhancedError.category = 'provider';
      enhancedError.severity = 'medium';
      enhancedError.isRetryable = true;
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      enhancedError = new Error('Cannot connect to FRED API - check network connectivity');
      enhancedError.category = 'network';
      enhancedError.severity = 'medium';
      enhancedError.isRetryable = true;
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      enhancedError = new Error('FRED API request timeout - service may be slow');
      enhancedError.category = 'timeout';
      enhancedError.severity = 'medium';
      enhancedError.isRetryable = true;
    } else if (error.category) {
      // Already categorized, just ensure severity is appropriate for FRED
      enhancedError.severity = 'medium'; // FRED is optional, so errors are medium severity
    }
    
    // Preserve original error information
    enhancedError.originalError = error;
    enhancedError.statusCode = statusCode;
    enhancedError.endpoint = endpoint;
    
    return enhancedError;
  }

  /**
   * Get federal funds rate data
   * @param {Object} options - Options for data retrieval
   * @returns {Promise<Object|null>} Interest rate data or null if unavailable
   */
  async getInterestRateData(options = {}) {
    if (!this.isEnabled) {
      console.log('⚠️  FRED provider disabled - returning null for interest rate data');
      return null;
    }

    console.log('📊 FREDProvider: Fetching federal funds rate data');

    return await this.executeWithCache('interest_rates', 'FEDFUNDS', async () => {
      try {
        const params = {
          series_id: this.seriesIds.federalFundsRate,
          limit: options.limit || 12, // Last 12 observations (months)
          sort_order: 'desc', // Most recent first
          observation_start: options.startDate || this.getDateMonthsAgo(12)
        };

        const observations = await this.makeFredRequest('series/observations', params);
        
        if (!observations || observations.length === 0) {
          console.log('⚠️  No federal funds rate data available');
          return null;
        }

        // Process and format the data
        const processedData = observations
          .filter(obs => obs.value !== '.' && !isNaN(parseFloat(obs.value)))
          .map(obs => ({
            date: obs.date,
            value: parseFloat(obs.value),
            series: 'Federal Funds Rate'
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date)); // Most recent first

        const result = {
          series: 'Federal Funds Rate',
          seriesId: this.seriesIds.federalFundsRate,
          currentValue: processedData.length > 0 ? processedData[0].value : null,
          currentDate: processedData.length > 0 ? processedData[0].date : null,
          historicalData: processedData,
          units: 'Percent',
          frequency: 'Monthly',
          lastUpdated: new Date().toISOString()
        };

        console.log(`✅ Successfully fetched federal funds rate: ${result.currentValue}% (${result.currentDate})`);
        return result;

      } catch (error) {
        console.error(`❌ Error fetching interest rate data: ${error.message}`);
        return null; // Return null to allow system to continue
      }
    }, {
      cacheTtl: this.config.getCacheConfig('fred', 'interest_rates').duration
    });
  }

  /**
   * Get Consumer Price Index (CPI) and inflation data
   * @param {Object} options - Options for data retrieval
   * @returns {Promise<Object|null>} CPI data or null if unavailable
   */
  async getCPIData(options = {}) {
    if (!this.isEnabled) {
      console.log('⚠️  FRED provider disabled - returning null for CPI data');
      return null;
    }

    console.log('📊 FREDProvider: Fetching CPI and inflation data');

    return await this.executeWithCache('cpi_data', 'CPI', async () => {
      try {
        // Fetch both all-items CPI and core CPI
        const [allItemsData, coreData] = await Promise.all([
          this.fetchCPISeries(this.seriesIds.cpiAllItems, 'All Items', options),
          this.fetchCPISeries(this.seriesIds.cpiCore, 'Core (Less Food & Energy)', options)
        ]);

        if (!allItemsData && !coreData) {
          console.log('⚠️  No CPI data available');
          return null;
        }

        // Calculate year-over-year inflation rates
        const allItemsInflation = this.calculateInflationRate(allItemsData?.historicalData || []);
        const coreInflation = this.calculateInflationRate(coreData?.historicalData || []);

        const result = {
          allItems: allItemsData,
          core: coreData,
          inflation: {
            allItems: allItemsInflation,
            core: coreInflation
          },
          lastUpdated: new Date().toISOString()
        };

        console.log(`✅ Successfully fetched CPI data - All Items: ${allItemsData?.currentValue || 'N/A'}, Core: ${coreData?.currentValue || 'N/A'}`);
        return result;

      } catch (error) {
        console.error(`❌ Error fetching CPI data: ${error.message}`);
        return null; // Return null to allow system to continue
      }
    }, {
      cacheTtl: this.config.getCacheConfig('fred', 'cpi_data').duration
    });
  }

  /**
   * Fetch a specific CPI series
   * @param {string} seriesId - FRED series ID
   * @param {string} seriesName - Human-readable series name
   * @param {Object} options - Options for data retrieval
   * @returns {Promise<Object|null>} CPI series data
   */
  async fetchCPISeries(seriesId, seriesName, options = {}) {
    try {
      const params = {
        series_id: seriesId,
        limit: options.limit || 24, // Last 24 observations (months)
        sort_order: 'desc', // Most recent first
        observation_start: options.startDate || this.getDateMonthsAgo(24)
      };

      const observations = await this.makeFredRequest('series/observations', params);
      
      if (!observations || observations.length === 0) {
        return null;
      }

      // Process and format the data
      const processedData = observations
        .filter(obs => obs.value !== '.' && !isNaN(parseFloat(obs.value)))
        .map(obs => ({
          date: obs.date,
          value: parseFloat(obs.value),
          series: seriesName
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // Most recent first

      return {
        series: `Consumer Price Index - ${seriesName}`,
        seriesId: seriesId,
        currentValue: processedData.length > 0 ? processedData[0].value : null,
        currentDate: processedData.length > 0 ? processedData[0].date : null,
        historicalData: processedData,
        units: 'Index 1982-1984=100',
        frequency: 'Monthly'
      };

    } catch (error) {
      console.error(`❌ Error fetching CPI series ${seriesId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Calculate year-over-year inflation rate from CPI data
   * @param {Array} cpiData - Array of CPI observations
   * @returns {Object|null} Inflation rate data
   */
  calculateInflationRate(cpiData) {
    if (!cpiData || cpiData.length < 12) {
      return null;
    }

    try {
      // Sort by date to ensure proper order
      const sortedData = cpiData.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      const currentCPI = sortedData[sortedData.length - 1];
      const yearAgoCPI = sortedData[sortedData.length - 13]; // 12 months ago
      
      if (!currentCPI || !yearAgoCPI) {
        return null;
      }

      const inflationRate = ((currentCPI.value - yearAgoCPI.value) / yearAgoCPI.value) * 100;

      return {
        currentRate: parseFloat(inflationRate.toFixed(2)),
        currentPeriod: currentCPI.date,
        comparisonPeriod: yearAgoCPI.date,
        currentCPI: currentCPI.value,
        comparisonCPI: yearAgoCPI.value
      };

    } catch (error) {
      console.error(`❌ Error calculating inflation rate: ${error.message}`);
      return null;
    }
  }

  /**
   * Get comprehensive macro economic data
   * @param {Object} options - Options for data retrieval
   * @returns {Promise<Object|null>} Comprehensive macro data or null if unavailable
   */
  async getMacroEconomicData(options = {}) {
    if (!this.isEnabled) {
      console.log('⚠️  FRED provider disabled - returning null for macro economic data');
      return null;
    }

    console.log('📊 FREDProvider: Fetching comprehensive macro economic data');

    return await this.executeWithCache('macro_data', 'COMPREHENSIVE', async () => {
      try {
        // Fetch interest rates and CPI data in parallel
        const [interestRateData, cpiData] = await Promise.all([
          this.getInterestRateData(options).catch(err => {
            console.error(`Error fetching interest rate data: ${err.message}`);
            return null;
          }),
          this.getCPIData(options).catch(err => {
            console.error(`Error fetching CPI data: ${err.message}`);
            return null;
          })
        ]);

        // Return data even if some components are missing
        const result = {
          interestRates: interestRateData,
          inflation: cpiData,
          summary: {
            federalFundsRate: interestRateData?.currentValue || null,
            federalFundsRateDate: interestRateData?.currentDate || null,
            cpiAllItems: cpiData?.allItems?.currentValue || null,
            cpiCore: cpiData?.core?.currentValue || null,
            inflationRateAllItems: cpiData?.inflation?.allItems?.currentRate || null,
            inflationRateCore: cpiData?.inflation?.core?.currentRate || null
          },
          lastUpdated: new Date().toISOString(),
          dataAvailability: {
            interestRates: !!interestRateData,
            cpi: !!cpiData
          }
        };

        console.log(`✅ Successfully compiled macro economic data`);
        return result;

      } catch (error) {
        console.error(`❌ Error fetching macro economic data: ${error.message}`);
        return null; // Return null to allow system to continue
      }
    }, {
      cacheTtl: this.config.getCacheConfig('fred', 'macro_data').duration
    });
  }

  /**
   * Get date string for N months ago
   * @param {number} months - Number of months ago
   * @returns {string} Date string in YYYY-MM-DD format
   */
  getDateMonthsAgo(months) {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date.toISOString().split('T')[0];
  }

  // DataProviderInterface implementation methods
  // These methods are required by the interface but not used for macro data

  /**
   * Get stock price (not applicable for FRED provider)
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<null>} Always returns null
   */
  async getStockPrice(ticker) {
    console.log('📊 FREDProvider: getStockPrice not applicable for macro economic data');
    return null;
  }

  /**
   * Get earnings data (not applicable for FRED provider)
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Array>} Always returns empty array
   */
  async getEarningsData(ticker) {
    console.log('📊 FREDProvider: getEarningsData not applicable for macro economic data');
    return [];
  }

  /**
   * Get company info (not applicable for FRED provider)
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<null>} Always returns null
   */
  async getCompanyInfo(ticker) {
    console.log('📊 FREDProvider: getCompanyInfo not applicable for macro economic data');
    return null;
  }

  /**
   * Get market news (not applicable for FRED provider)
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Array>} Always returns empty array
   */
  async getMarketNews(ticker) {
    console.log('📊 FREDProvider: getMarketNews not applicable for macro economic data');
    return [];
  }

  /**
   * Update stock prices (not applicable for FRED provider)
   * @returns {Promise<Object>} Update results
   */
  async updateStockPrices() {
    console.log('📊 FREDProvider: updateStockPrices not applicable for macro economic data');
    return {
      success: false,
      message: 'updateStockPrices not applicable for FRED macro economic data provider'
    };
  }

  /**
   * Get provider configuration
   * @returns {Object} Provider configuration details
   */
  getProviderConfig() {
    return {
      name: 'FREDProvider',
      version: '1.0.0',
      capabilities: ['macro_economic_data', 'interest_rates', 'inflation_data'],
      dataSource: 'Federal Reserve Economic Data (FRED)',
      requiresApiKey: false, // Optional - system continues without it
      isEnabled: this.isEnabled,
      rateLimits: {
        requestsPerMinute: 120,
        burstLimit: 30
      },
      cacheDurations: {
        macro_data: '24 hours',
        interest_rates: '24 hours',
        cpi_data: '24 hours'
      },
      seriesIds: this.seriesIds
    };
  }
}

module.exports = FREDProvider;