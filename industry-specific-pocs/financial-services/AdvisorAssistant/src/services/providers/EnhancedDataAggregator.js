/**
 * Enhanced Data Aggregator
 * 
 * Combines data from multiple providers to create comprehensive responses
 * that match the existing API format. Implements provider priority system
 * with graceful degradation when providers fail.
 * 
 * Provider Priority:
 * - Yahoo Finance: Primary for stock prices, earnings, company info
 * - NewsAPI: News headlines with sentiment analysis
 * - FRED: Macro economic context (optional)
 * 
 * @author Advisor Assistant Team
 * @version 1.0.0
 */

const BaseProvider = require('./BaseProvider');
const YahooFinanceProvider = require('./YahooFinanceProvider');
const NewsAPIProvider = require('./NewsAPIProvider');
const FREDProvider = require('./FREDProvider');

class EnhancedDataAggregator extends BaseProvider {
  constructor(config = {}) {
    super('enhanced_aggregator', {
      ...config,
      providers: {
        enhanced_aggregator: {
          cache: {
            aggregated_stock: 300000, // 5 minutes for aggregated stock data
            aggregated_earnings: 1800000, // 30 minutes for aggregated earnings
            aggregated_company: 3600000 // 1 hour for aggregated company data
          },
          rateLimit: {
            requestsPerMinute: 200, // Higher limit as we coordinate multiple providers
            burstLimit: 50
          },
          requestTimeout: 30000, // 30 seconds to allow for multiple provider calls
          maxRetries: 1 // Lower retries since we handle provider failures internally
        }
      }
    });

    // Initialize providers with error handling
    this.providers = {};
    this.providerStatus = {};
    
    // Initialize AI analyzer once and reuse
    this.aiAnalyzer = null;
    
    this.initializeProviders(config);
    
    console.log(`🔄 EnhancedDataAggregator initialized with providers: ${Object.keys(this.providers).join(', ')}`);
  }

  /**
   * Initialize all data providers with error handling
   * @param {Object} config - Configuration object
   */
  initializeProviders(config) {
    // Initialize Yahoo Finance (primary provider)
    try {
      this.providers.yahoo = new YahooFinanceProvider(config);
      this.providerStatus.yahoo = { enabled: true, lastError: null };
      console.log('✅ Yahoo Finance provider initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Yahoo Finance provider:', error.message);
      this.providerStatus.yahoo = { enabled: false, lastError: error.message };
    }



    // Initialize NewsAPI (news provider)
    try {
      this.providers.newsapi = new NewsAPIProvider(config);
      this.providerStatus.newsapi = { enabled: true, lastError: null };
      console.log('✅ NewsAPI provider initialized');
    } catch (error) {
      console.error('❌ Failed to initialize NewsAPI provider:', error.message);
      this.providerStatus.newsapi = { enabled: false, lastError: error.message };
    }

    // Initialize FRED (macro data provider - optional)
    try {
      this.providers.fred = new FREDProvider(config);
      this.providerStatus.fred = { 
        enabled: this.providers.fred.isProviderEnabled(), 
        lastError: null 
      };
      if (this.providerStatus.fred.enabled) {
        console.log('✅ FRED provider initialized');
      } else {
        console.log('⚠️  FRED provider disabled (no API key)');
      }
    } catch (error) {
      console.error('❌ Failed to initialize FRED provider:', error.message);
      this.providerStatus.fred = { enabled: false, lastError: error.message };
    }
  }

  /**
   * Execute provider method with error handling
   * @param {string} providerName - Name of the provider
   * @param {string} method - Method to call
   * @param {Array} args - Arguments to pass to the method
   * @returns {Promise<any|null>} Result or null if provider fails
   */
  async executeProviderMethod(providerName, method, args = []) {
    const provider = this.providers[providerName];
    const status = this.providerStatus[providerName];

    if (!provider || !status.enabled) {
      console.log(`⚠️  Provider ${providerName} is not available`);
      return null;
    }

    try {
      const result = await provider[method](...args);
      // Reset error status on successful call
      status.lastError = null;
      return result;
    } catch (error) {
      console.error(`❌ Error in ${providerName}.${method}:`, error.message);
      status.lastError = error.message;
      
      // Don't disable provider for temporary errors, but log for monitoring
      if (this.isPermanentError(error)) {
        status.enabled = false;
        console.error(`🚫 Disabling ${providerName} provider due to permanent error`);
      }
      
      return null;
    }
  }

  /**
   * Check if error is permanent and should disable provider
   * @param {Error} error - Error to check
   * @returns {boolean} True if error is permanent
   */
  isPermanentError(error) {
    // API key errors are permanent
    if (error.message.includes('API key') || error.message.includes('authentication')) {
      return true;
    }
    
    // 401/403 errors are permanent
    if (error.response?.status === 401 || error.response?.status === 403) {
      return true;
    }
    
    // Other errors are considered temporary
    return false;
  }

  /**
   * Get current stock price and trading data with enhancements
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Object|null>} Enhanced stock price data or null if not found
   */
  async getStockPrice(ticker) {
    if (!ticker || typeof ticker !== 'string') {
      throw new Error('Ticker symbol is required and must be a string');
    }

    const normalizedTicker = ticker.toUpperCase().trim();
    console.log(`🔄 EnhancedDataAggregator: Fetching enhanced stock data for ${normalizedTicker}`);

    return await this.executeWithCache('aggregated_stock', normalizedTicker, async () => {
      // Start with Yahoo Finance as primary data source
      const yahooData = await this.executeProviderMethod('yahoo', 'getStockPrice', [normalizedTicker]);
      
      if (!yahooData) {
        console.log(`❌ Primary provider (Yahoo) failed for ${normalizedTicker}`);
        return null;
      }

      // Add news sentiment
      const newsSentiment = await this.getNewsSentiment(normalizedTicker);
      
      // Add macro economic context
      const macroContext = await this.getMacroContext();

      // Add AI-enhanced market context analysis
      let aiMarketContext = null;
      try {
        console.log(`🤖 Getting AI market context for ${normalizedTicker}...`);
        const EnhancedAIAnalyzer = require('../enhancedAiAnalyzer');
        const aiAnalyzer = new EnhancedAIAnalyzer();
        
        // Prepare comprehensive data for AI analysis
        const contextData = {
          companyInfo: yahooData,
          currentPrice: yahooData,
          fundamentals: this.extractKeyFundamentals(yahooData),
          marketNews: [], // Will be populated if news sentiment was analyzed
          macroContext: macroContext
        };
        
        aiMarketContext = await aiAnalyzer.analyzeMarketContextWithAI(contextData, normalizedTicker);
        console.log(`✅ AI market context completed: ${aiMarketContext.valuationAssessment.level} valuation`);
      } catch (aiError) {
        console.error(`⚠️  AI market context analysis failed: ${aiError.message}`);
      }

      // Combine all data sources
      const enhancedData = {
        ...yahooData,
        // News sentiment
        sentiment: newsSentiment,
        // Macro context
        macroContext: macroContext,
        // AI-enhanced market context
        aiMarketContext: aiMarketContext,
        // Metadata
        dataSource: 'enhanced_multi_provider',
        providersUsed: this.getActiveProviders(),
        lastUpdated: new Date().toISOString()
      };

      console.log(`✅ Enhanced stock data aggregated for ${normalizedTicker} using ${enhancedData.providersUsed.join(', ')}`);
      return enhancedData;
    }, {
      cacheTtl: this.config.getCacheConfig('enhanced_aggregator', 'aggregated_stock').duration
    });
  }





  /**
   * Get news sentiment for a ticker using AI analysis ONLY
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Object|null>} AI-generated news sentiment data
   */
  async getNewsSentiment(ticker) {
    try {
      const newsData = await this.executeProviderMethod('newsapi', 'getMarketNews', [ticker]);
      
      if (!newsData || !Array.isArray(newsData) || newsData.length === 0) {
        return {
          score: 0,
          label: 'neutral',
          newsCount: 0,
          articles: [],
          confidence: 0,
          distribution: { positive: 0, neutral: 0, negative: 0 },
          analysisMethod: 'no_data'
        };
      }

      // ALWAYS use AI sentiment analysis - no fallback to manual methods
      console.log(`🤖 Using AI sentiment analysis for ${ticker} news (${newsData.length} articles)`);
      
      // Use AI analyzer for sentiment analysis
      const EnhancedAIAnalyzer = require('../enhancedAiAnalyzer');
      const aiAnalyzer = new EnhancedAIAnalyzer();
      
      const aiSentiment = await aiAnalyzer.analyzeNewsSentimentWithAI(newsData, ticker);
      
      return {
        score: aiSentiment.sentimentScore || 0,
        label: aiSentiment.overallSentiment || 'neutral',
        newsCount: newsData.length,
        scoredArticles: aiSentiment.articles?.length || 0,
        confidence: aiSentiment.confidence || 0,
        distribution: this.calculateDistributionFromAI(aiSentiment.articles || []),
        articles: aiSentiment.articles?.slice(0, 5) || [],
        summary: aiSentiment.summary,
        analysisMethod: 'ai_powered',
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ AI sentiment analysis failed for ${ticker}: ${error.message}`);
      // If AI fails, return error state - no fallback to manual methods
      throw new Error(`AI sentiment analysis failed for ${ticker}: ${error.message}`);
    }
  }

  /**
   * Calculate sentiment distribution from AI analysis results
   * @param {Array} aiArticles - AI-analyzed articles
   * @returns {Object} Sentiment distribution
   */
  calculateDistributionFromAI(aiArticles) {
    const distribution = { positive: 0, neutral: 0, negative: 0 };
    
    aiArticles.forEach(article => {
      if (article.sentiment === 'positive') distribution.positive++;
      else if (article.sentiment === 'negative') distribution.negative++;
      else distribution.neutral++;
    });
    
    return distribution;
  }

  /**
   * Extract key fundamental metrics for AI analysis
   * @param {Object} companyData - Company data from Yahoo Finance
   * @returns {Object} Key fundamental metrics
   */
  extractKeyFundamentals(companyData) {
    return {
      // Core valuation metrics
      marketCap: companyData.marketCap,
      peRatio: companyData.pe || companyData.trailingPE,
      pegRatio: companyData.pegRatio,
      priceToBook: companyData.priceToBookRatio,
      priceToSales: companyData.priceToSalesRatioTTM,
      
      // Profitability metrics
      profitMargin: companyData.profitMargin,
      operatingMargin: companyData.operatingMarginTTM,
      
      // Financial health metrics
      currentRatio: companyData.currentRatio,
      quickRatio: companyData.quickRatio,
      debtToEquity: companyData.debtToEquityRatio,
      
      // Growth metrics
      revenueGrowth: companyData.quarterlyRevenueGrowthYOY,
      earningsGrowth: companyData.quarterlyEarningsGrowthYOY,
      
      // Per-share metrics
      eps: companyData.eps || companyData.trailingEps,
      bookValue: companyData.bookValue,
      dividendYield: companyData.dividendYield,
      
      // Risk metrics
      beta: companyData.beta,
      
      // Technical indicators
      day50MovingAverage: companyData.day50MovingAverage,
      day200MovingAverage: companyData.day200MovingAverage,
      week52High: companyData.week52High,
      week52Low: companyData.week52Low
    };
  }

  /**
   * Calculate sentiment confidence score
   * @param {number} scoredArticles - Number of articles with sentiment scores
   * @param {number} totalArticles - Total number of articles
   * @param {Object} distribution - Sentiment distribution
   * @returns {number} Confidence score between 0 and 1
   */
  calculateSentimentConfidence(scoredArticles, totalArticles, distribution) {
    if (scoredArticles === 0 || totalArticles === 0) {
      return 0;
    }

    // Base confidence on coverage (how many articles have sentiment scores)
    const coverageScore = scoredArticles / totalArticles;
    
    // Adjust confidence based on sentiment distribution consistency
    const total = distribution.positive + distribution.neutral + distribution.negative;
    if (total === 0) return 0;
    
    // Higher confidence when sentiment is more consistent (not evenly distributed)
    const maxCategory = Math.max(distribution.positive, distribution.neutral, distribution.negative);
    const consistencyScore = maxCategory / total;
    
    // Combine coverage and consistency, with minimum sample size consideration
    const sampleSizeMultiplier = Math.min(1, scoredArticles / 5); // Full confidence at 5+ articles
    
    return parseFloat((coverageScore * consistencyScore * sampleSizeMultiplier).toFixed(2));
  }

  /**
   * Get sentiment label from score
   * @param {number} score - Sentiment score
   * @returns {string} Sentiment label
   */
  getSentimentLabel(score) {
    if (score > 0.1) return 'positive';
    if (score < -0.1) return 'negative';
    return 'neutral';
  }

  /**
   * Get macro economic context
   * @returns {Promise<Object|null>} Macro economic data
   */
  async getMacroContext() {
    try {
      const interestRateData = await this.executeProviderMethod('fred', 'getInterestRateData', []);
      const cpiData = await this.executeProviderMethod('fred', 'getCPIData', []);

      if (!interestRateData && !cpiData) {
        return null;
      }

      const macroContext = {
        fedRate: interestRateData?.currentValue || null,
        cpi: cpiData?.allItems?.currentValue || null,
        inflationRate: cpiData?.inflation?.allItems?.currentRate || null,
        coreInflationRate: cpiData?.inflation?.core?.currentRate || null,
        lastUpdated: new Date().toISOString()
      };
      
      console.log(`📊 Macro context assembled: Fed Rate=${macroContext.fedRate}%, CPI=${macroContext.cpi}, Inflation=${macroContext.inflationRate}%`);
      return macroContext;
    } catch (error) {
      console.error('⚠️  Failed to get macro context:', error.message);
      return null;
    }
  }

  /**
   * Get enhanced earnings data for a stock
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Array>} Array of enhanced earnings data or empty array
   */
  async getEarningsData(ticker) {
    if (!ticker || typeof ticker !== 'string') {
      throw new Error('Ticker symbol is required and must be a string');
    }

    const normalizedTicker = ticker.toUpperCase().trim();
    console.log(`🔄 EnhancedDataAggregator: Fetching enhanced earnings data for ${normalizedTicker}`);

    return await this.executeWithCache('aggregated_earnings', normalizedTicker, async () => {
      // Get historical earnings from Yahoo Finance
      const yahooEarnings = await this.executeProviderMethod('yahoo', 'getEarningsData', [normalizedTicker]);
      
      if (!yahooEarnings || !Array.isArray(yahooEarnings) || yahooEarnings.length === 0) {
        console.log(`❌ No historical earnings data found for ${normalizedTicker}`);
        return [];
      }


      
      // Get macro economic context
      const macroContext = await this.getMacroContext();

      // Enhance each earnings record
      const enhancedEarnings = yahooEarnings.map(earning => {
        const enhanced = {
          ...earning,

          // Add macro context for the earnings period
          macroContext: this.getEarningsPeriodMacroContext(earning, macroContext),
          // Metadata
          dataSource: 'enhanced_multi_provider',
          providersUsed: ['yahoo'],
          lastUpdated: new Date().toISOString()
        };



        // Add FRED to providers used if we have macro context
        if (macroContext) {
          enhanced.providersUsed.push('fred');
        }

        return enhanced;
      });

      console.log(`✅ Enhanced earnings data aggregated for ${normalizedTicker}: ${enhancedEarnings.length} records`);
      return enhancedEarnings;
    }, {
      cacheTtl: this.config.getCacheConfig('enhanced_aggregator', 'aggregated_earnings').duration
    });
  }



  /**
   * Calculate earnings surprise (actual - estimate)
   * @param {number} actualEPS - Actual EPS
   * @param {number} estimatedEPS - Estimated EPS
   * @returns {number|null} Earnings surprise
   */
  calculateEarningsSurprise(actualEPS, estimatedEPS) {
    if (actualEPS === null || actualEPS === undefined || 
        estimatedEPS === null || estimatedEPS === undefined) {
      return null;
    }
    
    return parseFloat((actualEPS - estimatedEPS).toFixed(4));
  }

  /**
   * Calculate earnings surprise percentage
   * @param {number} actualEPS - Actual EPS
   * @param {number} estimatedEPS - Estimated EPS
   * @returns {number|null} Earnings surprise percentage
   */
  calculateEarningsSurprisePercent(actualEPS, estimatedEPS) {
    if (actualEPS === null || actualEPS === undefined || 
        estimatedEPS === null || estimatedEPS === undefined || 
        estimatedEPS === 0) {
      return null;
    }
    
    const surprise = actualEPS - estimatedEPS;
    const surprisePercent = (surprise / Math.abs(estimatedEPS)) * 100;
    
    return parseFloat(surprisePercent.toFixed(2));
  }

  /**
   * Get macro economic context for earnings period
   * @param {Object} earning - Earnings record
   * @param {Object} macroContext - Current macro context
   * @returns {Object|null} Macro context for earnings period
   */
  getEarningsPeriodMacroContext(earning, macroContext) {
    if (!macroContext) {
      return null;
    }

    // For now, return current macro context
    // In a more sophisticated implementation, we could fetch historical macro data
    // for the specific earnings period
    return {
      ...macroContext,
      contextNote: `Macro data as of ${new Date().toISOString().split('T')[0]} (current context applied to historical earnings)`
    };
  }

  /**
   * Get financial data (alias for getEarningsData for backward compatibility)
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Array>} Array of financial data or empty array
   */
  async getFinancialData(ticker) {
    return await this.getEarningsData(ticker);
  }

  /**
   * Get company information and fundamentals (uses Yahoo as primary)
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Object|null>} Company information or null if not found
   */
  async getCompanyInfo(ticker) {
    if (!ticker || typeof ticker !== 'string') {
      throw new Error('Ticker symbol is required and must be a string');
    }

    const normalizedTicker = ticker.toUpperCase().trim();
    console.log(`🔄 EnhancedDataAggregator: Fetching company info for ${normalizedTicker}`);

    return await this.executeWithCache('aggregated_company', normalizedTicker, async () => {
      // Use Yahoo Finance as primary source for company info
      const companyData = await this.executeProviderMethod('yahoo', 'getCompanyInfo', [normalizedTicker]);
      
      if (!companyData) {
        console.log(`❌ No company data found for ${normalizedTicker}`);
        return null;
      }

      // Add metadata
      companyData.dataSource = 'enhanced_multi_provider';
      companyData.providersUsed = ['yahoo'];
      companyData.lastUpdated = new Date().toISOString();

      return companyData;
    }, {
      cacheTtl: this.config.getCacheConfig('enhanced_aggregator', 'aggregated_company').duration
    });
  }

  /**
   * Get market news for a stock with AI-enhanced relevance analysis
   * @param {string} ticker - Stock ticker symbol (optional)
   * @returns {Promise<Array>} Array of AI-enhanced news articles or empty array
   */
  async getMarketNews(ticker) {
    console.log(`🔄 EnhancedDataAggregator: Fetching enhanced market news for ${ticker || 'general market'}`);
    
    try {
      const newsData = await this.executeProviderMethod('newsapi', 'getMarketNews', [ticker]);
      
      if (!newsData || !Array.isArray(newsData) || newsData.length === 0) {
        return [];
      }

      // Check if we should enhance with AI relevance analysis
      if (ticker && newsData.length > 0) {
        console.log(`🤖 Enhancing news relevance with AI for ${ticker}...`);
        
        try {
          // Get company info for context
          const companyInfo = await this.executeProviderMethod('yahoo', 'getCompanyInfo', [ticker]);
          
          // Initialize AI analyzer once and reuse
          if (!this.aiAnalyzer) {
            const EnhancedAIAnalyzer = require('../enhancedAiAnalyzer');
            this.aiAnalyzer = new EnhancedAIAnalyzer();
            console.log('🤖 AI analyzer initialized for news enhancement');
          }
          
          const aiRelevance = await this.aiAnalyzer.analyzeNewsRelevanceWithAI(newsData, ticker, companyInfo);
          
          // Return AI-enhanced articles sorted by relevance
          const enhancedArticles = aiRelevance.allArticles.sort((a, b) => b.relevanceScore - a.relevanceScore);
          
          console.log(`✅ AI-enhanced news: ${aiRelevance.relevantCount}/${aiRelevance.totalArticles} relevant articles`);
          return enhancedArticles;
          
        } catch (aiError) {
          console.error(`❌ AI news relevance enhancement failed for ${ticker}: ${aiError.message}`);
          // Return original news data as fallback
          return newsData;
        }
      }
      
      return newsData;
      
    } catch (error) {
      console.error(`❌ Failed to fetch market news for ${ticker}: ${error.message}`);
      return [];
    }
  }

  /**
   * Update stock prices for tracked securities (placeholder)
   * @returns {Promise<Object>} Update results
   */
  async updateStockPrices() {
    console.log('🔄 EnhancedDataAggregator: updateStockPrices not implemented');
    return {
      success: false,
      message: 'updateStockPrices not implemented for EnhancedDataAggregator'
    };
  }

  /**
   * Get list of active providers
   * @returns {Array<string>} List of active provider names
   */
  getActiveProviders() {
    return Object.entries(this.providerStatus)
      .filter(([name, status]) => status.enabled)
      .map(([name]) => name);
  }

  /**
   * Get provider status information
   * @returns {Object} Provider status details
   */
  getProviderStatus() {
    return {
      aggregator: {
        name: 'EnhancedDataAggregator',
        version: '1.0.0',
        activeProviders: this.getActiveProviders(),
        providerStatus: this.providerStatus
      },
      providers: Object.entries(this.providers).reduce((acc, [name, provider]) => {
        if (provider && typeof provider.getStats === 'function') {
          acc[name] = provider.getStats();
        }
        return acc;
      }, {})
    };
  }

  /**
   * Get provider configuration
   * @returns {Object} Provider configuration details
   */
  getProviderConfig() {
    return {
      name: 'EnhancedDataAggregator',
      version: '1.0.0',
      capabilities: ['stock_price', 'earnings', 'company_info', 'news', 'macro_data'],
      dataSource: 'Multiple providers (Yahoo, NewsAPI, FRED)',
      providerPriority: {
        primary: 'Yahoo Finance',
        news: 'NewsAPI',
        macro: 'FRED'
      },
      activeProviders: this.getActiveProviders()
    };
  }

  /**
   * Cleanup resources for all providers
   */
  cleanup() {
    super.cleanup();
    
    // Cleanup individual providers
    Object.values(this.providers).forEach(provider => {
      if (provider && typeof provider.cleanup === 'function') {
        provider.cleanup();
      }
    });
  }
}

module.exports = EnhancedDataAggregator;