/**
 * NewsAPI Provider
 * 
 * Provides news data and sentiment analysis using NewsAPI.org
 * Features:
 * - Daily quota management (1000 requests per day)
 * - Request queuing system
 * - Keyword filtering by ticker and company name
 * - Basic sentiment analysis
 * - 30-minute caching for news data
 * 
 * @author Advisor Assistant Team
 * @version 1.0.0
 */

const BaseProvider = require('./BaseProvider');

class NewsAPIProvider extends BaseProvider {
  constructor(config = {}) {
    // Set up NewsAPI-specific configuration
    const newsApiConfig = {
      ...config,
      providers: {
        newsapi: {
          cache: {
            news: 1800000 // 30 minutes
          },
          rateLimit: {
            requestsPerMinute: 60, // Conservative for daily quota management
            burstLimit: 15
          },
          requestTimeout: 15000, // 15 seconds for news requests
          maxRetries: 2 // Fewer retries to preserve quota
        }
      }
    };

    super('newsapi', newsApiConfig);
    
    // Validate API key
    this.apiKey = this.config.getApiKey('newsapi');
    if (!this.apiKey) {
      throw new Error('NewsAPI API key is required. Set NEWSAPI_KEY environment variable.');
    }

    // Daily quota management
    this.dailyQuota = {
      limit: 1000, // NewsAPI free tier daily limit
      used: 0,
      resetTime: this.getNextResetTime(),
      requestQueue: [],
      processing: false
    };

    // Load quota usage from storage if available
    this.loadQuotaUsage();

    // Set up daily quota reset
    this.setupQuotaReset();

    // NewsAPI base URL
    this.baseUrl = 'https://newsapi.org/v2';

    // Initialize sentiment analysis
    this.initializeSentimentAnalysis();

    console.log(`✅ NewsAPIProvider initialized with API key: ${this.apiKey.substring(0, 8)}...`);
  }

  /**
   * Initialize sentiment analysis with keyword lists
   */
  initializeSentimentAnalysis() {
    // Positive sentiment keywords
    this.positiveKeywords = [
      // Strong positive
      'surge', 'soar', 'rally', 'boom', 'breakthrough', 'record', 'all-time high',
      'outperform', 'beat', 'exceed', 'strong', 'robust', 'solid', 'impressive',
      'growth', 'gain', 'rise', 'increase', 'up', 'higher', 'bullish', 'optimistic',
      
      // Moderate positive
      'positive', 'good', 'better', 'improve', 'recovery', 'rebound', 'upgrade',
      'buy', 'recommend', 'favorable', 'confident', 'promising', 'potential',
      'success', 'profit', 'revenue growth', 'earnings beat', 'dividend increase'
    ];

    // Negative sentiment keywords
    this.negativeKeywords = [
      // Strong negative
      'crash', 'plunge', 'collapse', 'tumble', 'plummet', 'dive', 'tank',
      'worst', 'terrible', 'disaster', 'crisis', 'panic', 'fear', 'concern',
      'decline', 'fall', 'drop', 'down', 'lower', 'bearish', 'pessimistic',
      
      // Moderate negative
      'negative', 'bad', 'worse', 'weak', 'poor', 'disappointing', 'miss',
      'downgrade', 'sell', 'avoid', 'risk', 'uncertainty', 'volatile',
      'loss', 'deficit', 'cut', 'reduce', 'layoff', 'bankruptcy', 'debt'
    ];

    // Neutral/context keywords that modify sentiment
    this.neutralKeywords = [
      'stable', 'unchanged', 'flat', 'sideways', 'mixed', 'neutral',
      'hold', 'maintain', 'steady', 'consistent', 'expected', 'forecast'
    ];

    // Financial context keywords that amplify sentiment
    this.financialAmplifiers = [
      'earnings', 'revenue', 'profit', 'sales', 'guidance', 'outlook',
      'dividend', 'buyback', 'merger', 'acquisition', 'ipo', 'split'
    ];
  }

  /**
   * Get next quota reset time (midnight UTC)
   * @returns {Date} Next reset time
   */
  getNextResetTime() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Load quota usage from persistent storage
   */
  loadQuotaUsage() {
    try {
      // In a real implementation, this would load from a database or file
      // For now, we'll start fresh each time the provider is initialized
      const today = new Date().toISOString().split('T')[0];
      const storedData = global.newsApiQuotaStorage?.[today];
      
      if (storedData) {
        this.dailyQuota.used = storedData.used || 0;
        console.log(`📊 Loaded quota usage: ${this.dailyQuota.used}/${this.dailyQuota.limit}`);
      }
    } catch (error) {
      console.warn(`⚠️  Could not load quota usage: ${error.message}`);
    }
  }

  /**
   * Save quota usage to persistent storage
   */
  saveQuotaUsage() {
    try {
      // In a real implementation, this would save to a database or file
      const today = new Date().toISOString().split('T')[0];
      
      if (!global.newsApiQuotaStorage) {
        global.newsApiQuotaStorage = {};
      }
      
      global.newsApiQuotaStorage[today] = {
        used: this.dailyQuota.used,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.warn(`⚠️  Could not save quota usage: ${error.message}`);
    }
  }

  /**
   * Set up daily quota reset timer
   */
  setupQuotaReset() {
    const now = new Date();
    const msUntilReset = this.dailyQuota.resetTime.getTime() - now.getTime();
    
    this.quotaResetTimeout = setTimeout(() => {
      this.resetDailyQuota();
      // Set up recurring daily reset
      this.quotaResetInterval = setInterval(() => {
        this.resetDailyQuota();
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, msUntilReset);

    console.log(`⏰ Daily quota will reset at ${this.dailyQuota.resetTime.toISOString()}`);
  }

  /**
   * Reset daily quota usage
   */
  resetDailyQuota() {
    this.dailyQuota.used = 0;
    this.dailyQuota.resetTime = this.getNextResetTime();
    this.saveQuotaUsage();
    
    console.log(`🔄 Daily quota reset. Next reset: ${this.dailyQuota.resetTime.toISOString()}`);
    
    // Process any queued requests
    this.processRequestQueue();
  }

  /**
   * Check if request can be made within daily quota
   * @returns {boolean} True if request can be made
   */
  canMakeRequest() {
    return this.dailyQuota.used < this.dailyQuota.limit;
  }

  /**
   * Get remaining daily quota
   * @returns {number} Remaining requests for today
   */
  getRemainingQuota() {
    return Math.max(0, this.dailyQuota.limit - this.dailyQuota.used);
  }

  /**
   * Add request to queue if quota is exceeded
   * @param {Function} requestFunction - Function to execute when quota is available
   * @returns {Promise} Promise that resolves when request is processed
   */
  async queueRequest(requestFunction) {
    return new Promise((resolve, reject) => {
      this.dailyQuota.requestQueue.push({
        execute: requestFunction,
        resolve,
        reject,
        timestamp: Date.now()
      });

      // Try to process queue immediately
      this.processRequestQueue();
    });
  }

  /**
   * Process queued requests
   */
  async processRequestQueue() {
    if (this.dailyQuota.processing || this.dailyQuota.requestQueue.length === 0) {
      return;
    }

    this.dailyQuota.processing = true;

    try {
      while (this.dailyQuota.requestQueue.length > 0 && this.canMakeRequest()) {
        const queuedRequest = this.dailyQuota.requestQueue.shift();
        
        try {
          const result = await queuedRequest.execute();
          queuedRequest.resolve(result);
        } catch (error) {
          queuedRequest.reject(error);
        }
      }
    } finally {
      this.dailyQuota.processing = false;
    }

    // Log queue status
    if (this.dailyQuota.requestQueue.length > 0) {
      console.log(`📋 ${this.dailyQuota.requestQueue.length} requests queued, quota: ${this.dailyQuota.used}/${this.dailyQuota.limit}`);
    }
  }

  /**
   * Make API request with quota management
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Request parameters
   * @returns {Promise<any>} API response data
   */
  async makeApiRequest(endpoint, params = {}) {
    // Check if we can make the request immediately
    if (this.canMakeRequest()) {
      return await this.executeApiRequest(endpoint, params);
    }

    // Queue the request if quota is exceeded
    console.log(`⏳ Daily quota exceeded (${this.dailyQuota.used}/${this.dailyQuota.limit}), queueing request`);
    return await this.queueRequest(() => this.executeApiRequest(endpoint, params));
  }

  /**
   * Execute API request with enhanced error handling
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Request parameters
   * @returns {Promise<any>} API response data
   */
  async executeApiRequest(endpoint, params = {}) {
    const url = `${this.baseUrl}/${endpoint}`;
    const queryParams = new URLSearchParams({
      apiKey: this.apiKey,
      ...params
    });

    try {
      const response = await this.makeRequest(`${url}?${queryParams}`);
      
      // Check for NewsAPI-specific error responses
      if (response.status === 'error') {
        throw this.createNewsAPIError(response);
      }
      
      // Increment quota usage on successful request
      this.dailyQuota.used++;
      this.saveQuotaUsage();
      
      // Record API usage for monitoring
      this.monitor.recordApiUsage(this.providerName, endpoint, {
        quotaUsed: this.dailyQuota.used,
        quotaLimit: this.dailyQuota.limit
      });
      
      console.log(`📊 NewsAPI request completed. Quota: ${this.dailyQuota.used}/${this.dailyQuota.limit}`);
      
      return response;
    } catch (error) {
      // Enhance error with NewsAPI-specific categorization
      const enhancedError = this.enhanceNewsAPIError(error);
      throw enhancedError;
    }
  }

  /**
   * Create NewsAPI error from API response
   * @param {Object} response - NewsAPI error response
   * @returns {Error} Enhanced error
   */
  createNewsAPIError(response) {
    const errorCode = response.code;
    const errorMessage = response.message || 'Unknown NewsAPI error';
    
    let enhancedError = new Error(`NewsAPI Error: ${errorMessage}`);
    
    switch (errorCode) {
      case 'apiKeyDisabled':
        enhancedError.category = 'auth';
        enhancedError.severity = 'critical';
        enhancedError.isRetryable = false;
        break;
      case 'apiKeyExhausted':
        enhancedError.category = 'quota';
        enhancedError.severity = 'high';
        enhancedError.isRetryable = true;
        break;
      case 'apiKeyInvalid':
        enhancedError.category = 'auth';
        enhancedError.severity = 'critical';
        enhancedError.isRetryable = false;
        break;
      case 'apiKeyMissing':
        enhancedError.category = 'auth';
        enhancedError.severity = 'critical';
        enhancedError.isRetryable = false;
        break;
      case 'parameterInvalid':
        enhancedError.category = 'validation';
        enhancedError.severity = 'medium';
        enhancedError.isRetryable = false;
        break;
      case 'parametersMissing':
        enhancedError.category = 'validation';
        enhancedError.severity = 'medium';
        enhancedError.isRetryable = false;
        break;
      case 'rateLimited':
        enhancedError.category = 'rate_limit';
        enhancedError.severity = 'high';
        enhancedError.isRetryable = true;
        break;
      case 'sourcesTooMany':
        enhancedError.category = 'validation';
        enhancedError.severity = 'medium';
        enhancedError.isRetryable = false;
        break;
      case 'sourceDoesNotExist':
        enhancedError.category = 'data';
        enhancedError.severity = 'medium';
        enhancedError.isRetryable = false;
        break;
      case 'unexpectedError':
        enhancedError.category = 'provider';
        enhancedError.severity = 'high';
        enhancedError.isRetryable = true;
        break;
      default:
        enhancedError.category = 'unknown';
        enhancedError.severity = 'medium';
        enhancedError.isRetryable = true;
    }
    
    enhancedError.newsApiCode = errorCode;
    return enhancedError;
  }

  /**
   * Enhance error with NewsAPI-specific categorization
   * @param {Error} error - Original error
   * @returns {Error} Enhanced error
   */
  enhanceNewsAPIError(error) {
    // If already enhanced by createNewsAPIError, return as-is
    if (error.newsApiCode) {
      return error;
    }
    
    const statusCode = error.response?.status;
    let enhancedError = error;
    
    if (statusCode === 429) {
      enhancedError = new Error('NewsAPI rate limit exceeded - too many requests per minute');
      enhancedError.category = 'rate_limit';
      enhancedError.severity = 'high';
      enhancedError.isRetryable = true;
    } else if (statusCode === 401) {
      enhancedError = new Error('NewsAPI authentication failed - invalid API key');
      enhancedError.category = 'auth';
      enhancedError.severity = 'critical';
      enhancedError.isRetryable = false;
    } else if (statusCode === 400) {
      enhancedError = new Error('NewsAPI bad request - check query parameters');
      enhancedError.category = 'validation';
      enhancedError.severity = 'medium';
      enhancedError.isRetryable = false;
    } else if (statusCode === 426) {
      enhancedError = new Error('NewsAPI upgrade required - feature not available in current plan');
      enhancedError.category = 'auth';
      enhancedError.severity = 'high';
      enhancedError.isRetryable = false;
    } else if (statusCode >= 500) {
      enhancedError = new Error(`NewsAPI server error (${statusCode}) - service temporarily unavailable`);
      enhancedError.category = 'provider';
      enhancedError.severity = 'high';
      enhancedError.isRetryable = true;
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      enhancedError = new Error('Cannot connect to NewsAPI - check network connectivity');
      enhancedError.category = 'network';
      enhancedError.severity = 'medium';
      enhancedError.isRetryable = true;
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      enhancedError = new Error('NewsAPI request timeout - service may be slow');
      enhancedError.category = 'timeout';
      enhancedError.severity = 'medium';
      enhancedError.isRetryable = true;
    }
    
    // Handle daily quota exceeded specifically
    if (this.dailyQuota.used >= this.dailyQuota.limit) {
      enhancedError = new Error(`NewsAPI daily quota exceeded (${this.dailyQuota.used}/${this.dailyQuota.limit})`);
      enhancedError.category = 'quota';
      enhancedError.severity = 'high';
      enhancedError.isRetryable = true;
      enhancedError.retryAfter = this.dailyQuota.resetTime;
    }
    
    // Preserve original error information
    enhancedError.originalError = error;
    enhancedError.statusCode = statusCode;
    
    return enhancedError;
  }

  /**
   * Get market news (implementation of DataProviderInterface method)
   * @param {string} ticker - Stock ticker symbol (optional)
   * @returns {Promise<Array>} Array of news articles
   */
  async getMarketNews(ticker) {
    const cacheKey = this.generateCacheKey('getMarketNews', ticker || 'general');
    
    return await this.executeWithCache('getMarketNews', ticker || 'general', async () => {
      try {
        let articles = [];
        
        if (ticker) {
          // Get ticker-specific news
          articles = await this.fetchTickerNews(ticker);
        } else {
          // Get general market news
          articles = await this.fetchGeneralMarketNews();
        }
        
        // Filter and format articles
        const filteredArticles = this.filterRelevantArticles(articles, ticker);
        const formattedArticles = filteredArticles.map(article => {
          const formatted = this.formatNewsArticle(article, ticker);
          // Add sentiment analysis
          const sentiment = this.analyzeSentiment(article, ticker);
          formatted.sentiment = sentiment.label;
          formatted.sentimentScore = sentiment.score;
          return formatted;
        });
        
        console.log(`📰 Retrieved ${formattedArticles.length} news articles for ${ticker || 'general market'}`);
        return formattedArticles;
        
      } catch (error) {
        console.error(`❌ Error fetching news for ${ticker || 'general market'}: ${error.message}`);
        throw error;
      }
    }, { cacheTtl: 1800000 }); // 30 minutes cache
  }

  /**
   * Fetch news articles for a specific ticker
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Array>} Array of raw news articles
   */
  async fetchTickerNews(ticker) {
    // Get company name for better search results
    const companyName = this.getCompanyNameFromTicker(ticker);
    
    // Build search query with ticker and company name
    const searchQueries = [
      ticker,
      `"${ticker}"`,
      companyName ? `"${companyName}"` : null,
      companyName ? `${ticker} ${companyName}` : null
    ].filter(Boolean);
    
    const allArticles = [];
    
    // Search with different query combinations to get comprehensive results
    for (const query of searchQueries.slice(0, 2)) { // Limit to 2 queries to preserve quota
      try {
        const response = await this.makeApiRequest('everything', {
          q: query,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 20,
          domains: 'reuters.com,bloomberg.com,cnbc.com,marketwatch.com,yahoo.com,wsj.com,ft.com'
        });
        
        if (response.articles) {
          allArticles.push(...response.articles);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to fetch news for query "${query}": ${error.message}`);
      }
    }
    
    // Remove duplicates based on URL
    const uniqueArticles = this.removeDuplicateArticles(allArticles);
    return uniqueArticles;
  }

  /**
   * Fetch general market news
   * @returns {Promise<Array>} Array of raw news articles
   */
  async fetchGeneralMarketNews() {
    try {
      const response = await this.makeApiRequest('top-headlines', {
        category: 'business',
        language: 'en',
        country: 'us',
        pageSize: 50
      });
      
      return response.articles || [];
    } catch (error) {
      console.warn(`⚠️  Failed to fetch general market news: ${error.message}`);
      return [];
    }
  }

  /**
   * Get company name from ticker symbol (basic mapping)
   * @param {string} ticker - Stock ticker symbol
   * @returns {string|null} Company name or null
   */
  getCompanyNameFromTicker(ticker) {
    // Basic mapping for common tickers
    const tickerToCompany = {
      'AAPL': 'Apple',
      'MSFT': 'Microsoft',
      'GOOGL': 'Google',
      'GOOG': 'Alphabet',
      'AMZN': 'Amazon',
      'TSLA': 'Tesla',
      'META': 'Meta',
      'NVDA': 'NVIDIA',
      'NFLX': 'Netflix',
      'AMD': 'Advanced Micro Devices',
      'INTC': 'Intel',
      'CRM': 'Salesforce',
      'ORCL': 'Oracle',
      'IBM': 'IBM',
      'UBER': 'Uber',
      'LYFT': 'Lyft',
      'SPOT': 'Spotify',
      'TWTR': 'Twitter',
      'SNAP': 'Snapchat',
      'SQ': 'Square',
      'PYPL': 'PayPal',
      'V': 'Visa',
      'MA': 'Mastercard',
      'JPM': 'JPMorgan',
      'BAC': 'Bank of America',
      'WFC': 'Wells Fargo',
      'GS': 'Goldman Sachs',
      'MS': 'Morgan Stanley'
    };
    
    return tickerToCompany[ticker.toUpperCase()] || null;
  }

  /**
   * Remove duplicate articles based on URL
   * @param {Array} articles - Array of articles
   * @returns {Array} Array of unique articles
   */
  removeDuplicateArticles(articles) {
    const seen = new Set();
    return articles.filter(article => {
      if (!article.url || seen.has(article.url)) {
        return false;
      }
      seen.add(article.url);
      return true;
    });
  }

  /**
   * Filter articles for relevance to ticker/market
   * @param {Array} articles - Array of raw articles
   * @param {string} ticker - Stock ticker symbol (optional)
   * @returns {Array} Array of filtered articles
   */
  filterRelevantArticles(articles, ticker) {
    if (!ticker) {
      // For general market news, filter for financial relevance
      return articles.filter(article => {
        const text = `${article.title} ${article.description || ''}`.toLowerCase();
        const marketKeywords = [
          'stock', 'market', 'trading', 'investor', 'earnings', 'revenue',
          'profit', 'loss', 'shares', 'dividend', 'ipo', 'merger', 'acquisition',
          'financial', 'economy', 'economic', 'fed', 'interest rate', 'inflation',
          'nasdaq', 'dow', 's&p', 'wall street', 'nyse'
        ];
        
        return marketKeywords.some(keyword => text.includes(keyword));
      });
    }
    
    // For ticker-specific news, filter for ticker relevance
    const companyName = this.getCompanyNameFromTicker(ticker);
    const tickerLower = ticker.toLowerCase();
    const companyLower = companyName ? companyName.toLowerCase() : '';
    
    return articles.filter(article => {
      const text = `${article.title} ${article.description || ''}`.toLowerCase();
      
      // Check for ticker symbol
      if (text.includes(tickerLower) || text.includes(`$${tickerLower}`)) {
        return true;
      }
      
      // Check for company name
      if (companyName && text.includes(companyLower)) {
        return true;
      }
      
      // Check for ticker in parentheses (common format)
      if (text.includes(`(${tickerLower})`)) {
        return true;
      }
      
      return false;
    });
  }

  /**
   * Format news article to internal structure
   * @param {Object} article - Raw NewsAPI article
   * @param {string} ticker - Stock ticker symbol (optional)
   * @returns {Object} Formatted article
   */
  formatNewsArticle(article, ticker) {
    return {
      headline: article.title || 'No title',
      summary: article.description || article.content?.substring(0, 200) || 'No summary available',
      url: article.url,
      source: article.source?.name || 'Unknown',
      publishedAt: article.publishedAt,
      author: article.author || null,
      urlToImage: article.urlToImage || null,
      relevanceScore: this.calculateRelevanceScore(article, ticker),
      ticker: ticker || null
      // sentiment and sentimentScore will be added by getMarketNews method
    };
  }

  /**
   * Calculate relevance score for an article
   * @param {Object} article - Raw NewsAPI article
   * @param {string} ticker - Stock ticker symbol (optional)
   * @returns {number} Relevance score (0-1)
   */
  calculateRelevanceScore(article, ticker) {
    let score = 0.5; // Base score
    
    const text = `${article.title} ${article.description || ''}`.toLowerCase();
    
    if (ticker) {
      const tickerLower = ticker.toLowerCase();
      const companyName = this.getCompanyNameFromTicker(ticker);
      const companyLower = companyName ? companyName.toLowerCase() : '';
      
      // Higher score for ticker mentions
      if (text.includes(`$${tickerLower}`)) score += 0.3;
      if (text.includes(`(${tickerLower})`)) score += 0.2;
      if (text.includes(tickerLower)) score += 0.1;
      
      // Higher score for company name mentions
      if (companyName && text.includes(companyLower)) {
        score += 0.2;
      }
    }
    
    // Higher score for financial keywords
    const financialKeywords = ['earnings', 'revenue', 'profit', 'stock', 'shares', 'dividend'];
    const keywordMatches = financialKeywords.filter(keyword => text.includes(keyword)).length;
    score += keywordMatches * 0.05;
    
    // Higher score for recent articles
    if (article.publishedAt) {
      const publishedTime = new Date(article.publishedAt).getTime();
      const now = Date.now();
      const hoursAgo = (now - publishedTime) / (1000 * 60 * 60);
      
      if (hoursAgo < 24) score += 0.1;
      if (hoursAgo < 6) score += 0.1;
    }
    
    // Higher score for reputable sources
    const reputableSources = ['reuters', 'bloomberg', 'cnbc', 'wall street journal', 'financial times'];
    const sourceName = article.source?.name?.toLowerCase() || '';
    if (reputableSources.some(source => sourceName.includes(source))) {
      score += 0.1;
    }
    
    return Math.min(1.0, score);
  }

  /**
   * Analyze sentiment of a news article
   * @param {Object} article - Raw NewsAPI article
   * @param {string} ticker - Stock ticker symbol (optional)
   * @returns {Object} Sentiment analysis result
   */
  analyzeSentiment(article, ticker) {
    const text = `${article.title} ${article.description || ''}`.toLowerCase();
    
    // Count positive and negative keywords
    const positiveCount = this.countKeywords(text, this.positiveKeywords);
    const negativeCount = this.countKeywords(text, this.negativeKeywords);
    const neutralCount = this.countKeywords(text, this.neutralKeywords);
    
    // Check for financial context amplifiers
    const hasFinancialContext = this.financialAmplifiers.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
    
    // Calculate base sentiment score (-1 to 1)
    let score = 0;
    const totalKeywords = positiveCount + negativeCount + neutralCount;
    
    if (totalKeywords > 0) {
      score = (positiveCount - negativeCount) / totalKeywords;
    }
    
    // Apply financial context amplification
    if (hasFinancialContext && Math.abs(score) > 0.1) {
      score *= 1.2; // Amplify sentiment for financial news
    }
    
    // Apply ticker-specific adjustments
    if (ticker) {
      score = this.adjustSentimentForTicker(score, text, ticker);
    }
    
    // Normalize score to -1 to 1 range
    score = Math.max(-1, Math.min(1, score));
    
    // Determine sentiment label
    const label = this.getSentimentLabel(score);
    
    return {
      score: Math.round(score * 100) / 100, // Round to 2 decimal places
      label,
      confidence: this.calculateSentimentConfidence(positiveCount, negativeCount, neutralCount),
      keywordCounts: {
        positive: positiveCount,
        negative: negativeCount,
        neutral: neutralCount
      }
    };
  }

  /**
   * Count occurrences of keywords in text
   * @param {string} text - Text to analyze
   * @param {Array} keywords - Array of keywords to count
   * @returns {number} Total keyword count
   */
  countKeywords(text, keywords) {
    return keywords.reduce((count, keyword) => {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
      const matches = text.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  /**
   * Adjust sentiment score for ticker-specific context
   * @param {number} score - Base sentiment score
   * @param {string} text - Article text
   * @param {string} ticker - Stock ticker symbol
   * @returns {number} Adjusted sentiment score
   */
  adjustSentimentForTicker(score, text, ticker) {
    const tickerLower = ticker.toLowerCase();
    const companyName = this.getCompanyNameFromTicker(ticker);
    const companyLower = companyName ? companyName.toLowerCase() : '';
    
    // Check for direct ticker mentions with sentiment context
    const tickerMentions = [
      `${tickerLower} surges`,
      `${tickerLower} plunges`,
      `${tickerLower} beats`,
      `${tickerLower} misses`,
      `${tickerLower} up`,
      `${tickerLower} down`
    ];
    
    for (const mention of tickerMentions) {
      if (text.includes(mention)) {
        // Amplify sentiment for direct ticker mentions
        if (mention.includes('surges') || mention.includes('beats') || mention.includes('up')) {
          score = Math.max(score, 0.3);
        } else if (mention.includes('plunges') || mention.includes('misses') || mention.includes('down')) {
          score = Math.min(score, -0.3);
        }
      }
    }
    
    // Check for company-specific sentiment patterns
    if (companyName) {
      const companyPatterns = [
        `${companyLower} reports strong`,
        `${companyLower} disappoints`,
        `${companyLower} exceeds`,
        `${companyLower} falls short`
      ];
      
      for (const pattern of companyPatterns) {
        if (text.includes(pattern)) {
          if (pattern.includes('strong') || pattern.includes('exceeds')) {
            score = Math.max(score, 0.4);
          } else if (pattern.includes('disappoints') || pattern.includes('falls short')) {
            score = Math.min(score, -0.4);
          }
        }
      }
    }
    
    return score;
  }

  /**
   * Get sentiment label from score
   * @param {number} score - Sentiment score (-1 to 1)
   * @returns {string} Sentiment label
   */
  getSentimentLabel(score) {
    if (score >= 0.3) return 'positive';
    if (score <= -0.3) return 'negative';
    if (score >= 0.1) return 'slightly positive';
    if (score <= -0.1) return 'slightly negative';
    return 'neutral';
  }

  /**
   * Calculate confidence level for sentiment analysis
   * @param {number} positiveCount - Number of positive keywords
   * @param {number} negativeCount - Number of negative keywords
   * @param {number} neutralCount - Number of neutral keywords
   * @returns {number} Confidence score (0-1)
   */
  calculateSentimentConfidence(positiveCount, negativeCount, neutralCount) {
    const totalKeywords = positiveCount + negativeCount + neutralCount;
    
    if (totalKeywords === 0) return 0.1; // Low confidence with no keywords
    
    // Higher confidence with more keywords and clear sentiment direction
    const sentimentClarity = Math.abs(positiveCount - negativeCount) / totalKeywords;
    const keywordDensity = Math.min(totalKeywords / 10, 1); // Normalize to 0-1
    
    return Math.min(0.9, 0.3 + (sentimentClarity * 0.4) + (keywordDensity * 0.3));
  }

  /**
   * Get sentiment statistics for a collection of articles
   * @param {Array} articles - Array of articles with sentiment
   * @returns {Object} Sentiment statistics
   */
  getSentimentStatistics(articles) {
    if (!articles || articles.length === 0) {
      return {
        averageScore: 0,
        distribution: { positive: 0, negative: 0, neutral: 0 },
        totalArticles: 0,
        sentimentTrend: 'unknown'
      };
    }
    
    const scores = articles.map(article => article.sentimentScore || 0);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    const distribution = articles.reduce((dist, article) => {
      const sentiment = article.sentiment || 'neutral';
      if (sentiment.includes('positive')) {
        dist.positive++;
      } else if (sentiment.includes('negative')) {
        dist.negative++;
      } else {
        dist.neutral++;
      }
      return dist;
    }, { positive: 0, negative: 0, neutral: 0 });
    
    const sentimentTrend = articles.length > 0 ? 
      this.determineSentimentTrend(averageScore, distribution) : 'unknown';

    return {
      averageScore: Math.round(averageScore * 100) / 100,
      distribution,
      totalArticles: articles.length,
      sentimentTrend
    };
  }

  /**
   * Determine overall sentiment trend
   * @param {number} averageScore - Average sentiment score
   * @param {Object} distribution - Sentiment distribution
   * @returns {string} Sentiment trend
   */
  determineSentimentTrend(averageScore, distribution) {
    const total = distribution.positive + distribution.negative + distribution.neutral;
    
    if (total === 0) return 'unknown';
    
    const positiveRatio = distribution.positive / total;
    const negativeRatio = distribution.negative / total;
    
    if (averageScore > 0.2 && positiveRatio > 0.6) return 'strongly positive';
    if (averageScore < -0.2 && negativeRatio > 0.6) return 'strongly negative';
    if (averageScore > 0.1) return 'positive';
    if (averageScore < -0.1) return 'negative';
    
    return 'mixed';
  }

  /**
   * Get stock price (not supported by NewsAPI)
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<null>} Always returns null
   */
  async getStockPrice(ticker) {
    console.warn('⚠️  NewsAPIProvider does not support stock price data');
    return null;
  }

  /**
   * Get earnings data (not supported by NewsAPI)
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Array>} Always returns empty array
   */
  async getEarningsData(ticker) {
    console.warn('⚠️  NewsAPIProvider does not support earnings data');
    return [];
  }

  /**
   * Get company info (not supported by NewsAPI)
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<null>} Always returns null
   */
  async getCompanyInfo(ticker) {
    console.warn('⚠️  NewsAPIProvider does not support company info data');
    return null;
  }

  /**
   * Update stock prices (not supported by NewsAPI)
   * @returns {Promise<Object>} Empty update result
   */
  async updateStockPrices() {
    console.warn('⚠️  NewsAPIProvider does not support stock price updates');
    return { updated: 0, errors: [] };
  }

  /**
   * Get provider statistics including quota usage
   * @returns {Object} Provider statistics
   */
  getStats() {
    const baseStats = super.getStats();
    
    return {
      ...baseStats,
      quota: {
        used: this.dailyQuota.used,
        limit: this.dailyQuota.limit,
        remaining: this.getRemainingQuota(),
        resetTime: this.dailyQuota.resetTime.toISOString(),
        queueLength: this.dailyQuota.requestQueue.length
      }
    };
  }

  /**
   * Get provider configuration
   * @returns {Object} Provider configuration details
   */
  getProviderConfig() {
    return {
      name: this.getProviderName(),
      version: '1.0.0',
      capabilities: ['news', 'sentiment'],
      quotaLimit: this.dailyQuota.limit,
      quotaUsed: this.dailyQuota.used,
      quotaRemaining: this.getRemainingQuota()
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    super.cleanup();
    
    // Clear timers
    if (this.quotaResetTimeout) {
      clearTimeout(this.quotaResetTimeout);
    }
    if (this.quotaResetInterval) {
      clearInterval(this.quotaResetInterval);
    }
    
    // Clear request queue
    this.dailyQuota.requestQueue.forEach(request => {
      request.reject(new Error('Provider is being cleaned up'));
    });
    this.dailyQuota.requestQueue = [];
    
    // Save final quota usage
    this.saveQuotaUsage();
  }
}

module.exports = NewsAPIProvider;