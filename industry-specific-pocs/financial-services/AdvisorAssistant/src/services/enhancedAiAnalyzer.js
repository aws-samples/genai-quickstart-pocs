/**
 * Enhanced AI Analyzer Service
 * 
 * Advanced earnings analysis service powered by AWS Bedrock (Claude 3.5 Sonnet)
 * with intelligent caching, rate limiting, and comprehensive error handling.
 * 
 * Key Features:
 * - AI-powered earnings analysis using Claude 3.5 Sonnet
 * - Intelligent caching to prevent duplicate API calls
 * - Rate limiting with exponential backoff for AWS Bedrock
 * - AI-only analysis with no fallback content
 * - Comprehensive data gathering for AI analysis
 * - Robust error handling with clear failure states
 * - Historical data integration for trend analysis
 * - Multi-threading protection with processing locks
 * 
 * Performance Optimizations:
 * - In-memory caching for frequently accessed analyses
 * - Database-first approach to avoid redundant AI calls
 * - Batch processing for multiple earnings reports
 * - Asynchronous processing with proper error boundaries
 * 
 * @author Advisor Assistant Team
 * @version 2.0.0
 * @since 1.0.0
 */

const AWSServices = require('./awsServices');
const { DataProviderFactory } = require('./dataProviderFactory');

/**
 * Enhanced AI Analyzer Class
 * 
 * Provides intelligent earnings analysis with advanced caching,
 * rate limiting, and error handling capabilities.
 */
class EnhancedAIAnalyzer {
  /**
   * Initialize the Enhanced AI Analyzer
   * 
   * Sets up AWS services integration, caching mechanisms, and rate limiting
   * to ensure optimal performance and cost efficiency.
   */
  constructor() {
    this.aws = new AWSServices(); // AWS services integration layer
    this.dataFetcher = DataProviderFactory.createProvider(); // Smart data provider
    this.analysisCache = new Map(); // In-memory cache for recent analyses
    this.processingLocks = new Set(); // Prevent concurrent processing of same data
    this.lastClaudeCall = 0; // Timestamp of last Claude API call
    this.minClaudeInterval = 5000; // Minimum 5 seconds between Claude calls to avoid throttling
    this.maxRetries = 10; // Maximum retry attempts for failed API calls (increased for 30min timeout)
    this.maxAnalysisTimeout = 30 * 60 * 1000; // 30 minutes maximum timeout for analysis
    this.disableCache = false; // Cache always enabled for optimal performance
  }

  /**
   * Clear the analysis cache
   * Used when switching AI models to ensure fresh analysis
   */
  clearCache() {
    this.analysisCache.clear();
    this.processingLocks.clear();
    console.log('🧹 AI analysis cache cleared');
  }

  async analyzeEarningsReport(ticker, earningsData, transcript = null) {
    const cacheKey = `${ticker}-${earningsData.quarter}-${earningsData.year}`;
    const startTime = Date.now();

    // Use caching for optimal performance
    if (true) {
      // Check cache first
      if (this.analysisCache.has(cacheKey)) {
        console.log(`📋 Using cached analysis for ${ticker}`);
        return this.analysisCache.get(cacheKey);
      }

      // Check if already processing
      if (this.processingLocks.has(cacheKey)) {
        console.log(`⏳ Waiting for existing analysis of ${ticker}...`);
        const maxWaitTime = this.maxAnalysisTimeout;
        const waitStart = Date.now();

        while (this.processingLocks.has(cacheKey)) {
          if (Date.now() - waitStart > maxWaitTime) {
            console.log(`⏰ Timeout waiting for existing analysis of ${ticker}, proceeding with new analysis`);
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
        }

        if (this.analysisCache.has(cacheKey)) {
          return this.analysisCache.get(cacheKey);
        }
      }

      // Check database for existing analysis (skip if cache disabled)
      try {
        const existingAnalysis = await this.aws.getItem('analyses', {
          id: cacheKey
        });
        if (existingAnalysis && existingAnalysis.analysis) {
          console.log(`📋 Found existing analysis in database for ${ticker}`);
          this.analysisCache.set(cacheKey, existingAnalysis.analysis);
          return existingAnalysis.analysis;
        }
      } catch (dbError) {
        console.log(`⚠️  Could not check existing analysis: ${dbError.message}`);
      }
    }

    this.processingLocks.add(cacheKey);
    console.log(`🚀 Starting fresh AI analysis for ${ticker} ${earningsData.quarter} ${earningsData.year} (timeout: ${this.maxAnalysisTimeout / 1000 / 60} minutes)`);

    try {
      const analysis = {
        ticker,
        quarter: earningsData.quarter,
        year: earningsData.year,
        timestamp: new Date(),
        summary: '',
        keyInsights: [],
        performanceMetrics: {},
        sentiment: 'neutral',
        riskFactors: [],
        opportunities: [],
        aiAnalysisStatus: 'pending'
      };

      console.log(`🔍 Starting comprehensive wealth advisor analysis for ${ticker} ${earningsData.quarter} ${earningsData.year}`);

      // Gather comprehensive data for wealth advisor analysis
      const comprehensiveData = await this.gatherComprehensiveData(ticker);

      // Get historical data (with error handling)
      let historicalEarnings = [];
      try {
        historicalEarnings = await this.getHistoricalEarningsSafe(ticker);
        console.log(`📊 Found ${historicalEarnings.length} historical earnings records for ${ticker}`);
      } catch (error) {
        console.log(`⚠️  Could not fetch historical data for ${ticker}: ${error.message}`);
      }

      // Rate-limited Claude analysis with comprehensive data
      let aiAnalysis;
      try {
        console.log(`🤖 Initiating comprehensive Claude AI analysis for ${ticker} (may take up to 30 minutes due to throttling)...`);
        aiAnalysis = await this.generateComprehensiveClaudeAnalysis(ticker, earningsData, comprehensiveData, historicalEarnings, startTime);
        const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
        console.log(`✅ Comprehensive Claude analysis completed for ${ticker} in ${duration} minutes`);
      } catch (error) {
        const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
        console.log(`❌ Claude analysis failed for ${ticker} after ${duration} minutes: ${error.message}`);
        console.log(`⚠️  AI analysis incomplete - no fallback analysis`);

        // Set analysis status to failed - no fallback content
        analysis.aiAnalysisStatus = 'failed';
        analysis.aiAnalysisError = error.message;
        analysis.summary = 'AI analysis not available - please retry analysis';
        analysis.sentiment = 'not available';
        analysis.keyInsights = [];
        analysis.riskFactors = [];
        analysis.opportunities = [];

        // Store the failed analysis with comprehensive metrics only
        try {
          const cleanFailedAnalysis = this.removeUndefinedValues({
            ...analysis,
            timestamp: analysis.timestamp.toISOString()
          });
          
          await this.aws.putItem('analyses', {
            id: cacheKey,
            ticker,
            quarter: earningsData.quarter,
            year: earningsData.year,
            analysis: cleanFailedAnalysis
          });
          console.log(`💾 Failed analysis status stored in database for ${ticker}`);
        } catch (storeError) {
          console.log(`⚠️  Could not store failed analysis: ${storeError.message}`);
        }

        return analysis;
      }

      // Use ONLY AI analysis results - no fallback content
      analysis.aiAnalysisStatus = 'completed';
      analysis.summary = aiAnalysis.summary || 'AI analysis not available';
      analysis.keyInsights = aiAnalysis.keyInsights || [];
      analysis.sentiment = aiAnalysis.sentiment || 'not available';
      analysis.riskFactors = aiAnalysis.riskFactors || [];
      analysis.opportunities = aiAnalysis.opportunities || [];
      analysis.investmentRecommendation = aiAnalysis.investmentRecommendation || null;
      analysis.riskAssessment = aiAnalysis.riskAssessment || null;
      analysis.portfolioFit = aiAnalysis.portfolioFit || null;
      analysis.valuationAnalysis = aiAnalysis.valuationAnalysis || null;
      analysis.competitivePosition = aiAnalysis.competitivePosition || null;
      analysis.catalysts = aiAnalysis.catalysts || [];
      analysis.timeHorizon = aiAnalysis.timeHorizon || 'not available';

      // Only include performance metrics if AI analysis succeeded
      // No fallback financial calculations - AI only
      analysis.performanceMetrics = {};

      // No alerts generation - removed per requirements

      // Store results (with error handling and undefined value cleanup)
      try {
        // Clean undefined values from analysis before storing
        const cleanAnalysis = this.removeUndefinedValues({
          ...analysis,
          timestamp: analysis.timestamp.toISOString()
        });
        
        await this.aws.putItem('analyses', {
          id: cacheKey,
          ticker,
          quarter: earningsData.quarter,
          year: earningsData.year,
          analysis: cleanAnalysis
        });
        console.log(`💾 Analysis stored in database for ${ticker}`);
      } catch (error) {
        console.log(`⚠️  Could not store analysis in database: ${error.message}`);
      }

      // Alerts section removed per requirements

      // Cache the result for optimal performance
      this.analysisCache.set(cacheKey, analysis);

      const totalDuration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
      console.log(`✅ Complete analysis finished for ${ticker} in ${totalDuration} minutes`);
      console.log(`📊 Analysis type: AI-Generated`);

      return analysis;

    } finally {
      this.processingLocks.delete(cacheKey);
    }
  }

  /**
   * Gather comprehensive data for wealth advisor analysis
   * Pulls together all available data sources for complete picture
   */
  async gatherComprehensiveData(ticker) {
    console.log(`📊 Gathering comprehensive data for ${ticker}...`);

    const data = {
      companyInfo: null,
      currentPrice: null,
      marketNews: [],
      fundamentals: {},
      marketContext: {},
      // Enhanced provider data
      insiderTrading: [],
      institutionalHoldings: [],
      analystEstimates: null,
      secFilings: [],
      advancedRatios: null
    };

    try {
      // Get company fundamentals and overview
      console.log(`🏢 Fetching company fundamentals for ${ticker}...`);
      data.companyInfo = await this.dataFetcher.getCompanyInfo(ticker);
      if (data.companyInfo) {
        console.log(`✅ Company info: ${data.companyInfo.name} (${data.companyInfo.sector})`);
        data.fundamentals = this.extractKeyFundamentals(data.companyInfo);
      }
    } catch (error) {
      console.log(`⚠️  Could not fetch company info: ${error.message}`);
    }

    try {
      // Get current stock price and technical indicators
      console.log(`💹 Fetching current stock price for ${ticker}...`);
      data.currentPrice = await this.dataFetcher.getStockPrice(ticker);
      if (data.currentPrice) {
        console.log(`✅ Current price: $${data.currentPrice.price} (${data.currentPrice.changePercent > 0 ? '+' : ''}${(data.currentPrice.changePercent * 100).toFixed(2)}%)`);
      }
    } catch (error) {
      console.log(`⚠️  Could not fetch stock price: ${error.message}`);
    }

    try {
      // Get recent market news and sentiment
      console.log(`📰 Fetching market news for ${ticker}...`);
      data.marketNews = await this.dataFetcher.getMarketNews(ticker);
      console.log(`✅ Found ${data.marketNews.length} news articles`);
    } catch (error) {
      console.log(`⚠️  Could not fetch market news: ${error.message}`);
    }

    // Enhanced data gathering (if provider supports additional data)
    if (this.dataFetcher.fetchInsiderTrading) {
      try {
        console.log(`🔍 Fetching insider trading data for ${ticker}...`);
        data.insiderTrading = await this.dataFetcher.fetchInsiderTrading(ticker);
        console.log(`✅ Found ${data.insiderTrading?.length || 0} insider trading records`);
      } catch (error) {
        console.log(`⚠️  Could not fetch insider trading: ${error.message}`);
      }
    }

    if (this.dataFetcher.fetchInstitutionalHoldings) {
      try {
        console.log(`🏦 Fetching institutional holdings for ${ticker}...`);
        data.institutionalHoldings = await this.dataFetcher.fetchInstitutionalHoldings(ticker);
        console.log(`✅ Found ${data.institutionalHoldings?.length || 0} institutional holders`);
      } catch (error) {
        console.log(`⚠️  Could not fetch institutional holdings: ${error.message}`);
      }
    }

    if (this.dataFetcher.fetchAnalystEstimates) {
      try {
        console.log(`📈 Fetching analyst estimates for ${ticker}...`);
        data.analystEstimates = await this.dataFetcher.fetchAnalystEstimates(ticker);
        console.log(`✅ Found analyst estimates: ${data.analystEstimates ? 'Yes' : 'No'}`);
      } catch (error) {
        console.log(`⚠️  Could not fetch analyst estimates: ${error.message}`);
      }
    }

    if (this.dataFetcher.fetchSECFilings) {
      try {
        console.log(`📄 Fetching recent SEC filings for ${ticker}...`);
        data.secFilings = await this.dataFetcher.fetchSECFilings(ticker);
        console.log(`✅ Found ${data.secFilings?.length || 0} SEC filings`);
      } catch (error) {
        console.log(`⚠️  Could not fetch SEC filings: ${error.message}`);
      }
    }

    // Calculate market context indicators
    data.marketContext = this.calculateMarketContext(data);

    console.log(`✅ Comprehensive data gathering completed for ${ticker}`);
    console.log(`📊 Data summary: Company=${!!data.companyInfo}, Price=${!!data.currentPrice}, News=${data.marketNews.length}, Insider=${data.insiderTrading?.length || 0}, Institutional=${data.institutionalHoldings?.length || 0}`);
    return data;
  }

  /**
   * Extract key fundamental metrics for analysis
   */
  extractKeyFundamentals(companyInfo) {
    return {
      // Core valuation metrics
      marketCap: companyInfo.marketCap,
      peRatio: companyInfo.peRatio,
      forwardPE: companyInfo.forwardPE,
      pegRatio: companyInfo.pegRatio,
      priceToBook: companyInfo.priceToBookRatio,
      priceToSales: companyInfo.priceToSalesRatioTTM,
      evToRevenue: companyInfo.evToRevenue,
      evToEbitda: companyInfo.evToEBITDA,
      
      // Profitability metrics
      profitMargin: companyInfo.profitMargin,
      grossMargin: companyInfo.grossMargin,
      operatingMargin: companyInfo.operatingMarginTTM,
      roe: companyInfo.returnOnEquityTTM,
      roa: companyInfo.returnOnAssetsTTM,
      
      // Financial health metrics
      debtToEquity: companyInfo.debtToEquityRatio,
      currentRatio: companyInfo.currentRatio,
      quickRatio: companyInfo.quickRatio,
      interestCoverage: companyInfo.interestCoverage,
      
      // Growth metrics
      revenueGrowth: companyInfo.quarterlyRevenueGrowthYOY,
      earningsGrowth: companyInfo.quarterlyEarningsGrowthYOY,
      
      // Per-share metrics
      eps: companyInfo.eps,
      bookValue: companyInfo.bookValue,
      revenuePerShare: companyInfo.revenuePerShareTTM,
      dividendPerShare: companyInfo.dividendPerShare,
      sharesOutstanding: companyInfo.sharesOutstanding,
      
      // Risk and dividend metrics
      beta: companyInfo.beta,
      dividendYield: companyInfo.dividendYield,
      payoutRatio: companyInfo.payoutRatio,
      
      // Technical indicators
      day50MovingAverage: companyInfo.day50MovingAverage,
      day200MovingAverage: companyInfo.day200MovingAverage,
      week52High: companyInfo.week52High,
      week52Low: companyInfo.week52Low,
      
      // Revenue and profit metrics
      revenueTTM: companyInfo.revenueTTM,
      grossProfitTTM: companyInfo.grossProfitTTM,
      
      // Forward-looking metrics
      analystTarget: companyInfo.analystTargetPrice
    };
  }

  /**
   * Calculate moving average position for technical analysis
   * @param {number} currentPrice - Current stock price
   * @param {number} movingAverage - Moving average price
   * @returns {string} Position description with percentage
   */
  calculateMAPosition(currentPrice, movingAverage) {
    if (!currentPrice || !movingAverage) return 'N/A';
    
    const difference = ((currentPrice - movingAverage) / movingAverage) * 100;
    const direction = difference > 0 ? 'above' : 'below';
    return `${Math.abs(difference).toFixed(1)}% ${direction}`;
  }

  /**
   * Calculate interest coverage ratio
   * @param {Object} companyInfo - Company financial information
   * @returns {number|null} Interest coverage ratio
   */
  calculateInterestCoverage(companyInfo) {
    if (!companyInfo.grossProfitTTM || !companyInfo.interestExpense) return null;
    
    // EBIT approximation: Gross Profit - Operating Expenses (if available)
    // Simplified calculation using available data
    const operatingIncome = companyInfo.operatingIncome || (companyInfo.grossProfitTTM * (companyInfo.operatingMargin || 0.1));
    const interestExpense = companyInfo.interestExpense;
    
    if (operatingIncome && interestExpense && interestExpense > 0) {
      return operatingIncome / interestExpense;
    }
    
    return null;
  }

  /**
   * Calculate implied growth rate from PEG ratio
   * @param {Object} companyInfo - Company financial information
   * @returns {number|null} Implied growth rate percentage
   */
  calculateImpliedGrowth(companyInfo) {
    if (!companyInfo.peRatio || !companyInfo.pegRatio || companyInfo.pegRatio === 0) return null;
    
    // PEG = P/E / Growth Rate, so Growth Rate = P/E / PEG
    return companyInfo.peRatio / companyInfo.pegRatio;
  }

  /**
   * Calculate technical strength score
   * @param {Object} data - Comprehensive data object
   * @returns {Object} Technical analysis summary
   */
  calculateTechnicalAnalysis(data) {
    const technical = {
      trend: 'neutral',
      strength: 'medium',
      support: null,
      resistance: null,
      momentum: 'neutral'
    };

    if (!data.currentPrice || !data.companyInfo) return technical;

    const price = data.currentPrice.price;
    const ma50 = data.companyInfo.day50MovingAverage;
    const ma200 = data.companyInfo.day200MovingAverage;
    const high52 = data.companyInfo.week52High;
    const low52 = data.companyInfo.week52Low;

    // Trend analysis based on moving averages
    if (ma50 && ma200) {
      if (price > ma50 && price > ma200 && ma50 > ma200) {
        technical.trend = 'strong uptrend';
        technical.strength = 'high';
      } else if (price > ma50 && price > ma200) {
        technical.trend = 'uptrend';
        technical.strength = 'medium-high';
      } else if (price < ma50 && price < ma200 && ma50 < ma200) {
        technical.trend = 'strong downtrend';
        technical.strength = 'low';
      } else if (price < ma50 && price < ma200) {
        technical.trend = 'downtrend';
        technical.strength = 'medium-low';
      }
    }

    // Support and resistance levels
    if (high52 && low52) {
      const range = high52 - low52;
      technical.support = low52 + (range * 0.2); // 20% from low
      technical.resistance = high52 - (range * 0.2); // 20% from high
      
      const position = (price - low52) / range;
      if (position > 0.8) technical.momentum = 'overbought';
      else if (position < 0.2) technical.momentum = 'oversold';
      else if (position > 0.6) technical.momentum = 'bullish';
      else if (position < 0.4) technical.momentum = 'bearish';
    }

    return technical;
  }

  /**
   * Calculate market context and technical indicators
   */
  calculateMarketContext(data) {
    const context = {
      newssentiment: 'neutral',
      technicalPosition: 'neutral',
      valuationLevel: 'fair',
      riskLevel: 'medium',
      liquidityHealth: 'adequate',
      financialStrength: 'stable'
    };

    // Analyze news sentiment
    if (data.marketNews.length > 0) {
      const sentimentScores = data.marketNews.map(news => news.sentimentScore || 0);
      const avgSentiment = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;

      if (avgSentiment > 0.1) context.newssentiment = 'positive';
      else if (avgSentiment < -0.1) context.newssentiment = 'negative';
    }

    // Enhanced technical analysis
    const technicalAnalysis = this.calculateTechnicalAnalysis(data);
    context.technicalPosition = technicalAnalysis.trend;
    context.technicalStrength = technicalAnalysis.strength;
    context.momentum = technicalAnalysis.momentum;

    // Enhanced valuation analysis
    if (data.fundamentals) {
      const fund = data.fundamentals;
      
      // Multi-metric valuation assessment
      const valuationScores = [];
      if (fund.peRatio) {
        if (fund.peRatio > 25) valuationScores.push(1); // expensive
        else if (fund.peRatio < 15) valuationScores.push(-1); // cheap
        else valuationScores.push(0); // fair
      }
      
      if (fund.priceToBook) {
        if (fund.priceToBook > 3) valuationScores.push(1);
        else if (fund.priceToBook < 1.5) valuationScores.push(-1);
        else valuationScores.push(0);
      }
      
      if (fund.priceToSales) {
        if (fund.priceToSales > 5) valuationScores.push(1);
        else if (fund.priceToSales < 2) valuationScores.push(-1);
        else valuationScores.push(0);
      }
      
      const avgValuation = valuationScores.length > 0 
        ? valuationScores.reduce((a, b) => a + b, 0) / valuationScores.length 
        : 0;
      
      if (avgValuation > 0.3) context.valuationLevel = 'expensive';
      else if (avgValuation < -0.3) context.valuationLevel = 'attractive';
      else context.valuationLevel = 'fairly valued';

      // Liquidity health assessment
      if (fund.currentRatio && fund.quickRatio) {
        if (fund.currentRatio > 2 && fund.quickRatio > 1.5) context.liquidityHealth = 'excellent';
        else if (fund.currentRatio > 1.5 && fund.quickRatio > 1) context.liquidityHealth = 'strong';
        else if (fund.currentRatio > 1.2 && fund.quickRatio > 0.8) context.liquidityHealth = 'adequate';
        else context.liquidityHealth = 'concerning';
      }

      // Financial strength assessment
      const strengthFactors = [];
      if (fund.debtToEquity < 0.5) strengthFactors.push('low_debt');
      if (fund.roe > 0.15) strengthFactors.push('high_roe');
      if (fund.profitMargin > 0.1) strengthFactors.push('healthy_margins');
      if (fund.currentRatio > 1.5) strengthFactors.push('good_liquidity');
      
      if (strengthFactors.length >= 3) context.financialStrength = 'excellent';
      else if (strengthFactors.length >= 2) context.financialStrength = 'strong';
      else if (strengthFactors.length >= 1) context.financialStrength = 'stable';
      else context.financialStrength = 'weak';
    }

    // Enhanced risk assessment
    const riskFactors = [];
    if (data.fundamentals) {
      if (data.fundamentals.beta > 1.5) riskFactors.push('high_volatility');
      if (data.fundamentals.debtToEquity > 2) riskFactors.push('high_leverage');
      if (data.fundamentals.profitMargin < 0.05) riskFactors.push('low_profitability');
      if (data.fundamentals.currentRatio < 1.2) riskFactors.push('liquidity_risk');
      if (data.fundamentals.quickRatio < 0.8) riskFactors.push('short_term_risk');
    }

    if (riskFactors.length >= 3) context.riskLevel = 'high';
    else if (riskFactors.length >= 2) context.riskLevel = 'elevated';
    else if (riskFactors.length === 1) context.riskLevel = 'moderate';
    else context.riskLevel = 'low';

    context.riskFactors = riskFactors;

    return context;
  }

  async getHistoricalEarningsSafe(ticker) {
    try {
      const earnings = await this.aws.queryItems('financials', {
        expression: 'ticker = :ticker',
        values: { ':ticker': ticker }
      });

      return earnings.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        const quarterOrder = { 'Q4': 4, 'Q3': 3, 'Q2': 2, 'Q1': 1 };
        return quarterOrder[b.quarter] - quarterOrder[a.quarter];
      });
    } catch (error) {
      console.log(`Historical earnings query failed: ${error.message}`);
      return [];
    }
  }

  async generateClaudeAnalysisWithRetry(ticker, earningsData, transcript, retryCount = 0) {
    try {
      return await this.generateClaudeAnalysisSafe(ticker, earningsData, transcript);
    } catch (error) {
      if (retryCount < this.maxRetries && error.name === 'ThrottlingException') {
        const waitTime = Math.pow(2, retryCount) * 2000; // Exponential backoff
        console.log(`🔄 Retry ${retryCount + 1}/${this.maxRetries} for ${ticker} after ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.generateClaudeAnalysisWithRetry(ticker, earningsData, transcript, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Generate comprehensive Claude analysis with all available data
   */
  async generateComprehensiveClaudeAnalysis(ticker, earningsData, comprehensiveData, historicalEarnings, startTime, retryCount = 0) {
    const elapsedTime = Date.now() - startTime;

    // Check if we've exceeded the 30-minute timeout
    if (elapsedTime > this.maxAnalysisTimeout) {
      throw new Error(`Analysis timeout exceeded (30 minutes) for ${ticker}`);
    }

    try {
      return await this.generateWealthAdvisorAnalysis(ticker, earningsData, comprehensiveData, historicalEarnings);
    } catch (error) {
      const remainingTime = this.maxAnalysisTimeout - elapsedTime;
      const elapsedMinutes = (elapsedTime / 1000 / 60).toFixed(1);
      const remainingMinutes = (remainingTime / 1000 / 60).toFixed(1);

      console.log(`⚠️  Claude API error for ${ticker} (attempt ${retryCount + 1}): ${error.message}`);
      console.log(`⏱️  Elapsed: ${elapsedMinutes}min, Remaining: ${remainingMinutes}min`);

      if (retryCount < this.maxRetries && remainingTime > 0) {
        let waitTime;

        if (error.name === 'ThrottlingException' || error.message.includes('throttl')) {
          // For throttling, use longer waits
          waitTime = Math.min(Math.pow(2, retryCount) * 10000, 300000); // Max 5 minutes between retries
          console.log(`🔄 Throttling detected - waiting ${waitTime / 1000}s before retry ${retryCount + 1}/${this.maxRetries}`);
        } else {
          // For other errors, shorter waits
          waitTime = Math.min(Math.pow(2, retryCount) * 5000, 60000); // Max 1 minute between retries
          console.log(`🔄 Retrying ${ticker} in ${waitTime / 1000}s (attempt ${retryCount + 1}/${this.maxRetries})`);
        }

        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.generateComprehensiveClaudeAnalysis(ticker, earningsData, comprehensiveData, historicalEarnings, startTime, retryCount + 1);
      }

      throw error;
    }
  }

  async generateClaudeAnalysisWithExtendedRetry(ticker, earningsData, transcript, startTime, retryCount = 0) {
    const elapsedTime = Date.now() - startTime;

    // Check if we've exceeded the 30-minute timeout
    if (elapsedTime > this.maxAnalysisTimeout) {
      throw new Error(`Analysis timeout exceeded (30 minutes) for ${ticker}`);
    }

    try {
      return await this.generateClaudeAnalysisSafe(ticker, earningsData, transcript);
    } catch (error) {
      const remainingTime = this.maxAnalysisTimeout - elapsedTime;
      const elapsedMinutes = (elapsedTime / 1000 / 60).toFixed(1);
      const remainingMinutes = (remainingTime / 1000 / 60).toFixed(1);

      console.log(`⚠️  Claude API error for ${ticker} (attempt ${retryCount + 1}): ${error.message}`);
      console.log(`⏱️  Elapsed: ${elapsedMinutes}min, Remaining: ${remainingMinutes}min`);

      if (retryCount < this.maxRetries && remainingTime > 0) {
        let waitTime;

        if (error.name === 'ThrottlingException' || error.message.includes('throttl')) {
          // For throttling, use longer waits
          waitTime = Math.min(Math.pow(2, retryCount) * 10000, 300000); // Max 5 minutes between retries
          console.log(`🔄 Throttling detected - waiting ${waitTime / 1000}s before retry ${retryCount + 1}/${this.maxRetries}`);
        } else {
          // For other errors, shorter waits
          waitTime = Math.min(Math.pow(2, retryCount) * 5000, 60000); // Max 1 minute between retries
          console.log(`🔄 Retrying ${ticker} in ${waitTime / 1000}s (attempt ${retryCount + 1}/${this.maxRetries})`);
        }

        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.generateClaudeAnalysisWithExtendedRetry(ticker, earningsData, transcript, startTime, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Generate wealth advisor-grade analysis using Claude with comprehensive data
   */
  async generateWealthAdvisorAnalysis(ticker, earningsData, comprehensiveData, historicalEarnings) {
    // Enhanced rate limiting for throttling prevention
    const now = Date.now();
    const timeSinceLastCall = now - this.lastClaudeCall;
    if (timeSinceLastCall < this.minClaudeInterval) {
      const waitTime = this.minClaudeInterval - timeSinceLastCall;
      console.log(`⏳ Rate limiting: waiting ${(waitTime / 1000).toFixed(1)}s before Claude call for ${ticker}...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastClaudeCall = Date.now();
    console.log(`🗣️  Sending comprehensive wealth advisor analysis request to Claude for ${ticker}...`);

    const systemPrompt = `You are a senior wealth advisor and portfolio manager with 20+ years of experience managing ultra-high net worth portfolios ($50M+). Provide sophisticated investment analysis in valid JSON format with institutional-quality insights. Focus on risk-adjusted returns, portfolio concentration limits, tax efficiency, liquidity considerations, and long-term wealth preservation strategies. Your analysis should be suitable for sophisticated investors who understand complex financial concepts and require detailed quantitative analysis.`;

    // Build comprehensive prompt with all available data
    const prompt = this.buildComprehensivePrompt(ticker, earningsData, comprehensiveData, historicalEarnings);

    try {
      const response = await this.aws.invokeClaude(prompt, systemPrompt, 4000); // Increased token limit for comprehensive analysis
      console.log(`✅ Received comprehensive response from Claude for ${ticker}`);

      // Try to parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Validate required fields for wealth advisor analysis
        if (!parsed.summary || !parsed.sentiment || !parsed.investmentRecommendation) {
          throw new Error('Invalid wealth advisor response structure from Claude');
        }

        console.log(`📊 Wealth advisor analysis for ${ticker}: ${parsed.investmentRecommendation.action}`);
        console.log(`📊 Risk Level: ${parsed.riskAssessment?.level}, Target Allocation: ${parsed.portfolioFit?.recommendedAllocation}`);

        return {
          summary: parsed.summary,
          keyInsights: parsed.keyInsights || [],
          sentiment: parsed.sentiment,
          riskFactors: parsed.riskFactors || [],
          opportunities: parsed.opportunities || [],
          investmentRecommendation: parsed.investmentRecommendation,
          riskAssessment: parsed.riskAssessment,
          portfolioFit: parsed.portfolioFit,
          valuationAnalysis: parsed.valuationAnalysis,
          competitivePosition: parsed.competitivePosition,
          catalysts: parsed.catalysts || [],
          timeHorizon: parsed.timeHorizon
        };
      }

      throw new Error('No valid JSON found in Claude wealth advisor response');
    } catch (error) {
      console.log(`❌ Claude wealth advisor analysis error for ${ticker}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build comprehensive prompt with all available data for senior wealth advisor analysis
   */
  buildComprehensivePrompt(ticker, earningsData, comprehensiveData, historicalEarnings) {
    const epsInfo = earningsData.eps && earningsData.estimatedEPS
      ? `EPS: $${earningsData.eps} (actual) vs $${earningsData.estimatedEPS} (estimated), surprise: $${earningsData.surprise || (earningsData.eps - earningsData.estimatedEPS).toFixed(2)}`
      : `EPS: $${earningsData.eps || 'N/A'}`;

    let prompt = `SENIOR WEALTH ADVISOR ANALYSIS REQUEST - HIGH NET WORTH CLIENT PORTFOLIO

CLIENT CONTEXT: Ultra-high net worth individual ($50M+ portfolio) seeking sophisticated investment opportunities with focus on risk-adjusted returns, tax efficiency, and long-term wealth preservation. Client has existing diversified holdings and seeks alpha-generating positions with institutional-quality analysis.

INVESTMENT MANDATE: Identify opportunities that offer superior risk-adjusted returns, strong competitive moats, and alignment with long-term wealth building objectives. Consider portfolio concentration limits (typically 2-5% position sizing) and liquidity requirements.

COMPANY: ${ticker}
QUARTER: ${earningsData.quarter} ${earningsData.year}

=== QUARTERLY EARNINGS PERFORMANCE ===
${epsInfo}
Revenue: $${earningsData.revenue ? (earningsData.revenue / 1000000000).toFixed(1) + 'B' : 'N/A'}
Net Income: $${earningsData.netIncome ? (earningsData.netIncome / 1000000000).toFixed(1) + 'B' : 'N/A'}
`;

    // Add company fundamentals if available
    if (comprehensiveData.companyInfo) {
      const info = comprehensiveData.companyInfo;
      prompt += `\n=== COMPANY FUNDAMENTALS ===
Company: ${info.name}
Sector: ${info.sector} | Industry: ${info.industry}
Market Cap: $${info.marketCap ? (info.marketCap / 1000000000).toFixed(1) + 'B' : 'N/A'}
P/E Ratio: ${info.peRatio || 'N/A'}
PEG Ratio: ${info.pegRatio || 'N/A'}
Profit Margin: ${info.profitMargin ? (info.profitMargin * 100).toFixed(1) + '%' : 'N/A'}
ROE: ${info.returnOnEquityTTM ? (info.returnOnEquityTTM * 100).toFixed(1) + '%' : 'N/A'}
Debt/Equity: ${info.debtToEquityRatio || 'N/A'}
Dividend Yield: ${info.dividendYield ? (info.dividendYield * 100).toFixed(2) + '%' : 'N/A'}
Beta: ${info.beta || 'N/A'}
Revenue Growth (YoY): ${info.quarterlyRevenueGrowthYOY ? (info.quarterlyRevenueGrowthYOY * 100).toFixed(1) + '%' : 'N/A'}
52-Week Range: $${info.week52Low || 'N/A'} - $${info.week52High || 'N/A'}
Analyst Target: $${info.analystTargetPrice || 'N/A'}
`;
    }

    // Add current market data
    if (comprehensiveData.currentPrice) {
      const price = comprehensiveData.currentPrice;
      prompt += `\n=== CURRENT MARKET DATA ===
Current Price: $${price.price}
Daily Change: ${price.changePercent > 0 ? '+' : ''}${(price.changePercent * 100).toFixed(2)}% ($${price.change})
Volume: ${price.volume ? price.volume.toLocaleString() : 'N/A'}
`;
    }

    // Add market sentiment from news
    if (comprehensiveData.marketNews.length > 0) {
      const recentNews = comprehensiveData.marketNews.slice(0, 5);
      prompt += `\n=== RECENT MARKET SENTIMENT ===
`;
      recentNews.forEach((news, index) => {
        prompt += `${index + 1}. ${news.headline} (${news.sentiment}, Score: ${news.sentimentScore?.toFixed(2) || 'N/A'})\n`;
      });
    }

    // Add historical performance context
    if (historicalEarnings.length > 0) {
      prompt += `\n=== HISTORICAL EARNINGS TREND ===
`;
      const recent = historicalEarnings.slice(0, 4);
      recent.forEach(earning => {
        prompt += `${earning.quarter} ${earning.year}: EPS $${earning.eps || 'N/A'}, Revenue $${earning.revenue ? (earning.revenue / 1000000000).toFixed(1) + 'B' : 'N/A'}\n`;
      });
    }

    // Add insider trading analysis
    if (comprehensiveData.insiderTrading && comprehensiveData.insiderTrading.length > 0) {
      prompt += `\n=== INSIDER TRADING ACTIVITY ===
`;
      const recentInsider = comprehensiveData.insiderTrading.slice(0, 5);
      recentInsider.forEach((trade, index) => {
        const tradeType = trade.transactionType || 'Unknown';
        const shares = trade.securitiesTransacted ? parseInt(trade.securitiesTransacted).toLocaleString() : 'N/A';
        const value = trade.securityPrice && trade.securitiesTransacted ? 
                     (trade.securityPrice * trade.securitiesTransacted / 1000000).toFixed(1) + 'M' : 'N/A';
        prompt += `${index + 1}. ${trade.reportingName || 'Executive'}: ${tradeType} ${shares} shares (~$${value}) on ${trade.transactionDate}\n`;
      });
    }

    // Add institutional holdings
    if (comprehensiveData.institutionalHoldings && comprehensiveData.institutionalHoldings.length > 0) {
      prompt += `\n=== INSTITUTIONAL HOLDINGS (Top 5) ===
`;
      const topHolders = comprehensiveData.institutionalHoldings.slice(0, 5);
      topHolders.forEach((holder, index) => {
        const shares = holder.shares ? parseInt(holder.shares).toLocaleString() : 'N/A';
        const value = holder.marketValue ? (holder.marketValue / 1000000000).toFixed(1) + 'B' : 'N/A';
        const change = holder.change ? (holder.change > 0 ? '+' : '') + (holder.change * 100).toFixed(1) + '%' : 'N/A';
        prompt += `${index + 1}. ${holder.holder}: ${shares} shares ($${value}) [${change} change]\n`;
      });
    }

    // Add analyst estimates
    if (comprehensiveData.analystEstimates && comprehensiveData.analystEstimates.length > 0) {
      const estimates = comprehensiveData.analystEstimates[0];
      prompt += `\n=== ANALYST CONSENSUS ===
EPS Estimate: ${estimates.estimatedEpsAvg || 'N/A'} (Range: ${estimates.estimatedEpsLow || 'N/A'} - ${estimates.estimatedEpsHigh || 'N/A'})
Revenue Estimate: ${estimates.estimatedRevenueAvg ? (estimates.estimatedRevenueAvg / 1000000000).toFixed(1) + 'B' : 'N/A'}
Number of Analysts: ${estimates.numberAnalystEstimatedRevenue || estimates.numberAnalystEstimatedEps || 'N/A'}
`;
    }

    // Add SEC filings
    if (comprehensiveData.secFilings && comprehensiveData.secFilings.length > 0) {
      prompt += `\n=== RECENT SEC FILINGS ===
`;
      const recentFilings = comprehensiveData.secFilings.slice(0, 3);
      recentFilings.forEach((filing, index) => {
        prompt += `${index + 1}. ${filing.type}: ${filing.title || 'Filing'} (${filing.date})\n`;
      });
    }

    // Add market context
    if (comprehensiveData.marketContext) {
      const context = comprehensiveData.marketContext;
      prompt += `\n=== MARKET CONTEXT ===
News Sentiment: ${context.newssentiment}
Technical Position: ${context.technicalPosition}
Valuation Level: ${context.valuationLevel}
Risk Assessment: ${context.riskLevel}
`;
    }

    prompt += `\n=== WEALTH ADVISOR ANALYSIS REQUEST ===
As a senior wealth advisor managing ultra-high net worth portfolios, provide HIGHLY SPECIFIC, DATA-DRIVEN analysis suitable for sophisticated investors. Use actual numbers from the data above. Calculate trends, growth rates, and comparisons. Focus on risk-adjusted returns, portfolio fit, and wealth preservation. Make insights actionable and detailed for clients with $50M+ portfolios.

CRITICAL REQUIREMENTS:
- ABSOLUTELY NEVER use "N/A" anywhere in your response - this is strictly forbidden
- Always provide specific analysis based on available data or reasonable estimates
- If specific data is missing, provide qualitative assessment based on industry knowledge and available information  
- Be verbose and detailed in all explanations (2-3 sentences minimum per field)
- Include specific numbers, percentages, and calculations wherever possible
- Provide actionable insights for each section
- Calculate missing values when possible using available data
- For market share, provide estimated percentages or relative positioning (e.g., "Leading position with estimated 25-30% market share")
- For probabilities, always assign HIGH/MEDIUM/LOW based on likelihood assessment
- Replace any missing data with informed estimates or industry-standard assumptions

Use this EXACT JSON format with ALL fields completed:

{
  "summary": "Comprehensive 5-7 sentence executive summary with SPECIFIC numbers: actual EPS vs estimates with percentage beat/miss, exact revenue figures with YoY growth %, specific profit margins with trend analysis, quarter-over-quarter comparisons, valuation assessment relative to historical multiples, and key investment thesis points",
  "investmentRecommendation": {
    "action": "BUY/HOLD/SELL",
    "confidence": "HIGH/MEDIUM/LOW",
    "targetPrice": 150.00,
    "timeHorizon": "6-12 months",
    "positionSize": "2-5% of portfolio",
    "rationale": "Comprehensive investment rationale with specific financial metrics, growth rates, margin trends, and valuation multiples from the data. Minimum 4-5 sentences with quantified analysis including P/E ratios, margin percentages, growth rates, and competitive positioning. Explain the investment thesis with supporting data points."
  },
  "riskAssessment": {
    "level": "LOW/MEDIUM/HIGH",
    "factors": ["specific quantified risks with actual numbers and percentages"],
    "mitigation": "Detailed risk management strategies for high net worth portfolios with specific position sizing and monitoring recommendations",
    "liquidityRisk": "Assessment based on current/quick ratios, trading volume, and market depth - provide specific analysis even if ratios not available",
    "concentrationRisk": "Portfolio concentration considerations for large positions - always provide guidance on position sizing and diversification"
  },
  "portfolioFit": {
    "suitableFor": ["Growth", "Income", "Balanced", "Conservative"],
    "recommendedAllocation": "2-5%",
    "diversificationBenefit": "Detailed portfolio benefits with quantified metrics and sector exposure analysis",
    "taxConsiderations": "Tax efficiency considerations for high net worth investors including dividend treatment and capital gains implications",
    "liquidityProfile": "Detailed liquidity assessment for large position management including average daily volume and market impact analysis"
  },
  "valuationAnalysis": {
    "currentValuation": "UNDERVALUED/FAIRLY_VALUED/OVERVALUED",
    "keyMetrics": ["Exact P/E ratio with sector comparison", "Specific growth rate % with trend", "Revenue per share with YoY change"],
    "fairValue": 145.00
  },
  "competitivePosition": {
    "strength": "Market position assessment with specific competitive advantages",
    "moat": "Competitive advantages with sustainability analysis",
    "threats": "Competitive threats with quantified impact assessment",
    "marketShare": "Market position analysis - provide estimated market share percentage or relative position (e.g., 'Leading position with ~30% market share' or 'Top 3 player in segment')"
  },
  "catalysts": [
    {"event": "Upcoming catalyst with specific details", "impact": "POSITIVE/NEGATIVE", "timeline": "timeframe", "probability": "HIGH/MEDIUM/LOW"}
  ],
  "insiderAnalysis": {
    "sentiment": "BULLISH/BEARISH/NEUTRAL",
    "activity": "Recent insider trading summary",
    "significance": "HIGH/MEDIUM/LOW"
  },
  "institutionalAnalysis": {
    "sentiment": "BULLISH/BEARISH/NEUTRAL",
    "activity": "Institutional buying/selling trends",
    "confidence": "HIGH/MEDIUM/LOW"
  },
  "analystConsensus": {
    "recommendation": "BUY/HOLD/SELL",
    "priceTarget": 150.00,
    "confidence": "How well estimates align with fundamentals"
  },
  "keyInsights": [
    {"type": "performance", "insight": "Specific earnings performance with exact EPS beat/miss percentage and revenue growth rate", "impact": "positive/negative/neutral"},
    {"type": "profitability", "insight": "Detailed margin analysis with specific percentage changes and operational efficiency metrics", "impact": "positive/negative/neutral"},
    {"type": "growth", "insight": "Quarter-over-quarter and year-over-year growth trends with acceleration/deceleration analysis", "impact": "positive/negative/neutral"},
    {"type": "valuation", "insight": "Specific valuation metrics with P/E ratios, price-to-sales, and historical comparison", "impact": "positive/negative/neutral"}
  ],
  "sentiment": "positive/negative/neutral",
  "riskFactors": [
    "Quantified financial risk with specific metrics (e.g., 'Debt-to-equity ratio of X% above industry average of Y%')",
    "Market position risk with competitive analysis and market share data",
    "Operational risk with margin pressure or efficiency concerns backed by numbers",
    "Valuation risk with specific multiple comparisons and premium/discount analysis"
  ],
  "opportunities": [
    "Revenue growth opportunity with specific addressable market size and penetration rates",
    "Margin expansion opportunity with operational leverage and efficiency improvements",
    "Market share opportunity with competitive positioning and growth potential",
    "Capital allocation opportunity with cash flow generation and return potential"
  ],
  "timeHorizon": "SHORT/MEDIUM/LONG"
}`;

    return prompt;
  }

  async generateClaudeAnalysisSafe(ticker, earningsData, transcript) {
    // Enhanced rate limiting for throttling prevention
    const now = Date.now();
    const timeSinceLastCall = now - this.lastClaudeCall;
    if (timeSinceLastCall < this.minClaudeInterval) {
      const waitTime = this.minClaudeInterval - timeSinceLastCall;
      console.log(`⏳ Rate limiting: waiting ${(waitTime / 1000).toFixed(1)}s before Claude call for ${ticker}...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastClaudeCall = Date.now();
    console.log(`🗣️  Sending request to Claude for ${ticker}...`);

    const systemPrompt = `You are a senior financial analyst. Provide concise, actionable analysis in valid JSON format only. Focus on key insights that matter to investors.`;

    const epsInfo = earningsData.eps && earningsData.estimatedEPS
      ? `EPS: $${earningsData.eps} (actual) vs $${earningsData.estimatedEPS} (estimated), surprise: $${earningsData.surprise || (earningsData.eps - earningsData.estimatedEPS).toFixed(2)}`
      : `EPS: $${earningsData.eps || 'N/A'}`;

    const prompt = `Analyze ${ticker} ${earningsData.quarter} ${earningsData.year} earnings:

${epsInfo}
Revenue: $${earningsData.revenue ? (earningsData.revenue / 1000000000).toFixed(1) + 'B' : 'N/A'}
Net Income: $${earningsData.netIncome ? (earningsData.netIncome / 1000000000).toFixed(1) + 'B' : 'N/A'}

Respond with valid JSON only:
{
  "summary": "2-3 sentence executive summary",
  "keyInsights": [
    {"type": "performance", "insight": "specific insight", "impact": "positive/negative/neutral"}
  ],
  "sentiment": "positive/negative/neutral",
  "riskFactors": ["specific risk 1", "specific risk 2"],
  "opportunities": ["specific opportunity 1", "specific opportunity 2"]
}`;

    try {
      const response = await this.aws.invokeClaude(prompt, systemPrompt, 2000);
      console.log(`✅ Received response from Claude for ${ticker}`);

      // Try to parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Validate required fields
        if (!parsed.summary || !parsed.sentiment) {
          throw new Error('Invalid response structure from Claude');
        }

        console.log(`📊 Claude analysis summary for ${ticker}: ${parsed.summary.substring(0, 100)}...`);
        console.log(`📊 Sentiment: ${parsed.sentiment}, Insights: ${parsed.keyInsights?.length || 0}`);

        return {
          summary: parsed.summary,
          keyInsights: parsed.keyInsights || [],
          sentiment: parsed.sentiment,
          riskFactors: parsed.riskFactors || [],
          opportunities: parsed.opportunities || []
        };
      }

      throw new Error('No valid JSON found in Claude response');
    } catch (error) {
      console.log(`❌ Claude analysis error for ${ticker}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Comprehensive financial metrics analysis using all available data
   */
  analyzeComprehensiveFinancialMetrics(earningsData, historicalEarnings = [], comprehensiveData = {}) {
    const metrics = {
      // Earnings metrics
      revenueGrowth: null,
      profitMargin: null,
      epsGrowth: null,
      beatEstimates: {
        revenue: null,
        eps: null
      },
      // Valuation metrics
      valuation: {
        peRatio: null,
        pegRatio: null,
        priceToBook: null,
        priceToSales: null,
        evToRevenue: null,
        evToEbitda: null
      },
      // Profitability metrics
      profitability: {
        grossMargin: null,
        operatingMargin: null,
        netMargin: null,
        roe: null,
        roa: null
      },
      // Financial health metrics
      financialHealth: {
        debtToEquity: null,
        currentRatio: null,
        quickRatio: null,
        interestCoverage: null
      },
      // Market metrics
      market: {
        beta: null,
        dividendYield: null,
        payoutRatio: null,
        week52Performance: null,
        volumeAnalysis: null
      },
      // Growth metrics
      growth: {
        revenueGrowthYoY: null,
        earningsGrowthYoY: null,
        revenueGrowthQoQ: null,
        epsGrowthTrend: null
      }
    };

    // Calculate basic earnings metrics
    if (earningsData.revenue && earningsData.netIncome) {
      metrics.profitMargin = (earningsData.netIncome / earningsData.revenue) * 100;
      metrics.profitability.netMargin = metrics.profitMargin;
    }

    // EPS vs estimates
    if (earningsData.eps && earningsData.estimatedEPS) {
      const surprise = earningsData.eps - earningsData.estimatedEPS;
      const surprisePercent = (surprise / Math.abs(earningsData.estimatedEPS)) * 100;
      metrics.beatEstimates.eps = {
        actual: earningsData.eps,
        estimated: earningsData.estimatedEPS,
        surprise: surprise,
        surprisePercent: surprisePercent,
        beat: surprise > 0
      };
    }

    // Historical growth analysis
    if (earningsData.eps && historicalEarnings.length > 0) {
      const previousYearSameQuarter = historicalEarnings.find(h =>
        h.quarter === earningsData.quarter && h.year === (earningsData.year - 1)
      );

      if (previousYearSameQuarter && previousYearSameQuarter.eps) {
        const growth = ((earningsData.eps - previousYearSameQuarter.eps) / Math.abs(previousYearSameQuarter.eps)) * 100;
        metrics.epsGrowth = `${growth.toFixed(1)}% YoY`;
        metrics.growth.earningsGrowthYoY = growth;
      }

      // Calculate EPS growth trend over multiple quarters
      if (historicalEarnings.length >= 4) {
        const recentQuarters = historicalEarnings.slice(0, 4);
        const growthRates = [];

        for (let i = 0; i < recentQuarters.length - 1; i++) {
          const current = recentQuarters[i];
          const previous = recentQuarters[i + 1];
          if (current.eps && previous.eps && previous.eps !== 0) {
            const qoqGrowth = ((current.eps - previous.eps) / Math.abs(previous.eps)) * 100;
            growthRates.push(qoqGrowth);
          }
        }

        if (growthRates.length > 0) {
          const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
          metrics.growth.epsGrowthTrend = `${avgGrowth.toFixed(1)}% avg QoQ`;
        }
      }
    }

    // Add comprehensive data metrics
    if (comprehensiveData.fundamentals) {
      const fund = comprehensiveData.fundamentals;

      // Valuation metrics
      metrics.valuation = {
        peRatio: fund.peRatio,
        pegRatio: fund.pegRatio,
        priceToBook: fund.priceToBook,
        priceToSales: fund.priceToSales,
        evToRevenue: fund.evToRevenue,
        evToEbitda: fund.evToEbitda
      };

      // Profitability metrics
      metrics.profitability = {
        ...metrics.profitability,
        operatingMargin: fund.operatingMargin ? fund.operatingMargin * 100 : null,
        roe: fund.roe ? fund.roe * 100 : null,
        roa: fund.roa ? fund.roa * 100 : null
      };

      // Financial health metrics
      metrics.financialHealth = {
        debtToEquity: fund.debtToEquity,
        currentRatio: fund.currentRatio,
        quickRatio: fund.quickRatio,
        interestCoverage: fund.interestCoverage
      };

      // Market metrics
      metrics.market = {
        beta: fund.beta,
        dividendYield: fund.dividendYield ? fund.dividendYield * 100 : null,
        payoutRatio: fund.payoutRatio ? fund.payoutRatio * 100 : null
      };

      // Growth metrics from fundamentals
      metrics.growth.revenueGrowthYoY = fund.revenueGrowth ? fund.revenueGrowth * 100 : null;
    }

    // Market performance analysis
    if (comprehensiveData.currentPrice && comprehensiveData.companyInfo) {
      const price = comprehensiveData.currentPrice.price;
      const high52 = comprehensiveData.companyInfo.week52High;
      const low52 = comprehensiveData.companyInfo.week52Low;

      if (high52 && low52) {
        const performance52w = ((price - low52) / (high52 - low52)) * 100;
        metrics.market.week52Performance = `${performance52w.toFixed(1)}% of 52w range`;
      }

      if (comprehensiveData.currentPrice.volume) {
        // Simple volume analysis (would need historical volume for better analysis)
        metrics.market.volumeAnalysis = comprehensiveData.currentPrice.volume > 1000000 ? 'High' : 'Normal';
      }
    }

    return metrics;
  }

  analyzeFinancialMetrics(earningsData, historicalEarnings = []) {
    const metrics = {
      revenueGrowth: null,
      profitMargin: null,
      epsGrowth: null,
      beatEstimates: {
        revenue: null,
        eps: null
      }
    };

    // Calculate profit margin
    if (earningsData.revenue && earningsData.netIncome) {
      metrics.profitMargin = (earningsData.netIncome / earningsData.revenue) * 100;
    }

    // EPS vs estimates
    if (earningsData.eps && earningsData.estimatedEPS) {
      const surprise = earningsData.eps - earningsData.estimatedEPS;
      const surprisePercent = (surprise / Math.abs(earningsData.estimatedEPS)) * 100;
      metrics.beatEstimates.eps = {
        actual: earningsData.eps,
        estimated: earningsData.estimatedEPS,
        surprise: surprise,
        surprisePercent: surprisePercent,
        beat: surprise > 0
      };
    }

    // YoY EPS growth
    if (earningsData.eps && historicalEarnings.length > 0) {
      const previousYearSameQuarter = historicalEarnings.find(h =>
        h.quarter === earningsData.quarter && h.year === (earningsData.year - 1)
      );

      if (previousYearSameQuarter && previousYearSameQuarter.eps) {
        const growth = ((earningsData.eps - previousYearSameQuarter.eps) / Math.abs(previousYearSameQuarter.eps)) * 100;
        metrics.epsGrowth = `${growth.toFixed(1)}% YoY`;
      }
    }

    return metrics;
  }

  // Alert generation methods removed per requirements

  // Fallback analysis methods removed per requirements - AI analysis failure will show status instead

  async getLatestAnalysis(ticker) {
    try {
      // Skip cache if disabled
      if (!this.disableCache) {
        // Check cache first
        const cached = Array.from(this.analysisCache.entries())
          .filter(([key]) => key.startsWith(ticker))
          .map(([, analysis]) => analysis)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

        if (cached) {
          console.log(`📋 Retrieved cached analysis for ${ticker}`);
          return cached;
        }
      }

      // Query database
      const items = await this.aws.queryItems('analyses', {
        expression: 'ticker = :ticker',
        values: { ':ticker': ticker }
      }, 'TickerIndex');

      if (items && items.length > 0) {
        const latest = items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        console.log(`💾 Retrieved database analysis for ${ticker}`);
        return latest.analysis;
      }

      console.log(`⚠️  No analysis found for ${ticker}`);
      return null;
    } catch (error) {
      console.error(`❌ Error retrieving analysis for ${ticker}:`, error);
      return null;
    }
  }

  // Clear cache method for testing
  clearCache() {
    this.analysisCache.clear();
    this.processingLocks.clear();
    console.log('🧹 Analysis cache cleared');
  }

  // Cache is always enabled for optimal performance
  // setCacheEnabled method removed - cache cannot be disabled
  // Get analysis status
  getAnalysisStatus() {
    return {
      cacheEnabled: true, // Always enabled
      cachedAnalyses: this.analysisCache.size,
      processingCount: this.processingLocks.size,
      maxTimeout: this.maxAnalysisTimeout / 1000 / 60 + ' minutes',
      maxRetries: this.maxRetries,
      minInterval: this.minClaudeInterval / 1000 + ' seconds'
    };
  }
  
  // Helper method to remove undefined values for DynamoDB storage
  removeUndefinedValues(obj) {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefinedValues(item)).filter(item => item !== undefined);
    }
    
    if (typeof obj === 'object') {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          const cleanedValue = this.removeUndefinedValues(value);
          if (cleanedValue !== undefined) {
            cleaned[key] = cleanedValue;
          }
        }
      }
      return cleaned;
    }
    
    return obj;
  }
}

module.exports = EnhancedAIAnalyzer;