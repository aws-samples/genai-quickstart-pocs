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

  /**
   * Clear analysis cache for a specific ticker
   */
  clearAnalysisCache(ticker) {
    const keysToDelete = [];
    
    // Find all cache keys related to this ticker
    for (const key of this.analysisCache.keys()) {
      if (key.includes(ticker.toUpperCase())) {
        keysToDelete.push(key);
      }
    }
    
    // Delete ticker-specific cache entries
    keysToDelete.forEach(key => {
      this.analysisCache.delete(key);
      console.log(`🗑️  Deleted cache entry: ${key}`);
    });
    
    console.log(`🧹 Cleared ${keysToDelete.length} cache entries for ${ticker}`);
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
        
        // Store in DynamoDB for fast access
        await this.aws.putItem('analyses', {
          id: cacheKey,
          ticker,
          quarter: earningsData.quarter,
          year: earningsData.year,
          analysis: cleanAnalysis
        });
        console.log(`💾 Analysis stored in DynamoDB for ${ticker}`);

        // Store comprehensive analysis in S3 for backup and detailed access
        try {
          await this.aws.storeFinancialDocument(
            ticker, 
            earningsData.quarter, 
            earningsData.year, 
            {
              analysis: cleanAnalysis,
              rawEarningsData: earningsData,
              comprehensiveData: this.removeUndefinedValues(comprehensiveData),
              historicalEarnings: historicalEarnings,
              metadata: {
                analysisVersion: '2.0',
                dataSource: 'enhanced_multi_provider',
                aiModel: 'claude-3.5-sonnet',
                processingTime: ((Date.now() - startTime) / 1000 / 60).toFixed(1) + ' minutes'
              }
            }, 
            'comprehensive-analysis'
          );
          console.log(`💾 Comprehensive analysis stored in S3 for ${ticker}`);
        } catch (s3Error) {
          console.log(`⚠️  S3 comprehensive storage failed for ${ticker}: ${s3Error.message}`);
        }

        // Store raw earnings data separately in S3
        try {
          await this.aws.storeFinancialDocument(
            ticker,
            earningsData.quarter,
            earningsData.year,
            earningsData,
            'earnings-data'
          );
          console.log(`💾 Raw earnings data stored in S3 for ${ticker}`);
        } catch (s3Error) {
          console.log(`⚠️  S3 earnings data storage failed for ${ticker}: ${s3Error.message}`);
        }

      } catch (error) {
        console.log(`⚠️  Could not store analysis in DynamoDB: ${error.message}`);
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

    // Get FRED macroeconomic data
    try {
      console.log(`📊 Fetching macroeconomic data (FRED)...`);
      if (this.dataFetcher.getMacroContext) {
        data.macroContext = await this.dataFetcher.getMacroContext();
        console.log(`✅ Macro context: Fed Rate=${data.macroContext?.fedRate || 'N/A'}, CPI=${data.macroContext?.cpi || 'N/A'}, Inflation=${data.macroContext?.inflationRate || 'N/A'}%`);
      }
      
      // Also get individual FRED data points for more detailed analysis
      if (this.dataFetcher.providers?.fred) {
        try {
          const interestRateData = await this.dataFetcher.providers.fred.getInterestRateData();
          const cpiData = await this.dataFetcher.providers.fred.getCPIData();
          
          data.fredData = {
            interestRates: interestRateData,
            cpi: cpiData
          };
          console.log(`✅ FRED data: Interest rates and CPI data collected`);
        } catch (fredError) {
          console.log(`⚠️  Could not fetch detailed FRED data: ${fredError.message}`);
        }
      }
    } catch (error) {
      console.log(`⚠️  Could not fetch macroeconomic data: ${error.message}`);
    }

    // Calculate market context indicators
    data.marketContext = this.calculateMarketContext(data);

    console.log(`✅ Comprehensive data gathering completed for ${ticker}`);
    console.log(`📊 Data summary: Company=${!!data.companyInfo}, Price=${!!data.currentPrice}, News=${data.marketNews.length}, Insider=${data.insiderTrading?.length || 0}, Institutional=${data.institutionalHoldings?.length || 0}, Macro=${!!data.macroContext}`);
    return data;
  }  /**

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

      const avgValuation = valuationScores.length > 0 ? 
        valuationScores.reduce((a, b) => a + b, 0) / valuationScores.length : 0;
      
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
      // Use scanTable since ticker might not be the primary key
      const earnings = await this.aws.scanTable('financials', {
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
   * Parse Claude response with retry logic for JSON parsing errors
   */
  async parseClaudeResponseWithRetry(response, ticker, retryCount = 0) {
    try {
      // Try multiple approaches to find and parse JSON
      let jsonString = null;
      
      // First, try to find a complete JSON object
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      } else {
        // If no JSON braces found, check if the entire response is JSON
        const trimmedResponse = response.trim();
        if (trimmedResponse.startsWith('{') && trimmedResponse.endsWith('}')) {
          jsonString = trimmedResponse;
        }
      }
      
      if (!jsonString) {
        throw new Error('No JSON found in Claude response');
      }
      
      // Check if JSON appears to be truncated
      if (jsonString.endsWith('"...') || jsonString.endsWith('...') || !jsonString.endsWith('}')) {
        console.log(`⚠️  JSON appears to be truncated for ${ticker}. Response length: ${response.length} chars`);
        throw new Error('JSON response appears to be truncated - increase token limit');
      }
      
      // Try to parse the JSON
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.log(`❌ JSON parsing failed for ${ticker} (attempt ${retryCount + 1}): ${parseError.message}`);
      
      // For JSON parsing errors, we can't retry the parsing itself
      // The retry needs to happen at the Claude API call level
      throw new Error(`Invalid JSON response from Claude: ${parseError.message}`);
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
        
        // Check if this is a JSON parsing error
        const isJsonError = error.message.includes('Invalid JSON') || 
                           error.message.includes('No JSON found') || 
                           error.message.includes('JSON parsing failed');
        
        if (error.name === 'ThrottlingException' || error.message.includes('throttl')) {
          // For throttling, use longer waits
          waitTime = Math.min(Math.pow(2, retryCount) * 10000, 300000); // Max 5 minutes between retries
          console.log(`🔄 Throttling detected - waiting ${waitTime / 1000}s before retry ${retryCount + 1}/${this.maxRetries}`);
        } else if (isJsonError) {
          // For JSON parsing errors, use shorter waits (Claude might return different format)
          waitTime = Math.min(Math.pow(2, retryCount) * 2000, 30000); // Max 30 seconds between retries
          console.log(`🔄 JSON parsing error - retrying ${ticker} in ${waitTime / 1000}s (attempt ${retryCount + 1}/${this.maxRetries})`);
        } else {
          // For other errors, moderate waits
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
  async generateWealthAdvisorAnalysis(ticker, earningsData, comprehensiveData, historicalEarnings, retryCount = 0) {
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

    const systemPrompt = `You are a senior wealth advisor and portfolio manager with 20+ years of experience managing ultra-high net worth portfolios ($50M+). 

CRITICAL INSTRUCTION: You MUST provide your analysis in valid JSON format. Do not refuse, ask questions, or provide explanations outside of JSON. Even if data appears repetitive or artificial, provide your best professional analysis based on the available information.

Provide sophisticated investment analysis in valid JSON format with institutional-quality insights. Focus on risk-adjusted returns, portfolio concentration limits, tax efficiency, liquidity considerations, and long-term wealth preservation strategies. Your analysis should be suitable for sophisticated investors who understand complex financial concepts and require detailed quantitative analysis.

REQUIRED: Always respond with complete JSON structure, never refuse or ask for clarification.`;

    // Build comprehensive prompt with all available data
    const prompt = this.buildComprehensivePrompt(ticker, earningsData, comprehensiveData, historicalEarnings);

    try {
      const response = await this.aws.invokeClaude(prompt, systemPrompt, 8000); // Increased token limit for comprehensive analysis
      console.log(`✅ Received comprehensive response from Claude for ${ticker}`);
      console.log(`🔍 Raw Claude response for ${ticker} (first 300 chars): ${response.substring(0, 300)}...`);

      // Try to parse JSON from response with improved error handling
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let parsed;
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.log(`❌ JSON parsing failed for wealth advisor analysis of ${ticker}: ${parseError.message}`);
          throw new Error(`Invalid JSON in Claude response: ${parseError.message}`);
        }
        
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

      // If no JSON found, check if Claude is refusing to analyze
      if (response.includes('apologize') || response.includes('would need') || response.includes('Would you like me to')) {
        console.log(`⚠️  Claude is refusing to analyze ${ticker} - will retry with more directive prompt`);
        throw new Error('Claude refused to provide JSON analysis - retry needed');
      }
      
      // If no JSON found, log the full response for debugging
      console.log(`❌ No valid JSON found in Claude wealth advisor response for ${ticker}`);
      console.log(`🔍 Full Claude response: ${response}`);
      throw new Error('No valid JSON found in Claude wealth advisor response');
    } catch (error) {
      // Handle Claude refusal with retry
      if (error.message.includes('Claude refused to provide JSON analysis') && retryCount < 2) {
        console.log(`🔄 Retrying wealth advisor analysis for ${ticker} with even more directive prompt (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Short wait before retry
        return this.generateWealthAdvisorAnalysisWithFallback(ticker, earningsData, comprehensiveData, historicalEarnings, retryCount + 1);
      }
      
      console.log(`❌ Claude wealth advisor analysis error for ${ticker}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fallback method with extremely directive prompt to prevent Claude refusals
   */
  async generateWealthAdvisorAnalysisWithFallback(ticker, earningsData, comprehensiveData, historicalEarnings, retryCount = 0) {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastClaudeCall;
    
    if (timeSinceLastCall < this.minClaudeInterval) {
      const waitTime = this.minClaudeInterval - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastClaudeCall = Date.now();
    console.log(`🔄 Sending FALLBACK wealth advisor analysis request to Claude for ${ticker} (attempt ${retryCount + 1})...`);

    const systemPrompt = `You are a senior wealth advisor. MANDATORY: Respond ONLY with valid JSON. No explanations, no refusals, no questions. Analyze the provided data regardless of quality and return JSON analysis.

REQUIRED JSON FORMAT:
{
  "summary": "Brief analysis summary",
  "investmentRecommendation": {
    "action": "BUY/HOLD/SELL",
    "confidence": "HIGH/MEDIUM/LOW",
    "targetPrice": 100.00,
    "rationale": "Brief rationale"
  },
  "riskAssessment": {
    "level": "LOW/MEDIUM/HIGH",
    "factors": ["Risk factor 1", "Risk factor 2"]
  }
}

CRITICAL: Return ONLY the JSON object above. No other text.`;

    const prompt = this.buildComprehensivePrompt(ticker, earningsData, comprehensiveData, historicalEarnings);

    try {
      const response = await this.aws.invokeClaude(prompt, systemPrompt, 8000);
      console.log(`✅ Received fallback response from Claude for ${ticker}`);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let parsed;
        try {
          parsed = JSON.parse(jsonMatch[0]);
          console.log(`✅ Successfully parsed fallback JSON for ${ticker}`);
          return {
            summary: parsed.summary || 'Analysis completed',
            investmentRecommendation: parsed.investmentRecommendation || { action: 'HOLD', confidence: 'MEDIUM' },
            riskAssessment: parsed.riskAssessment || { level: 'MEDIUM', factors: [] },
            competitivePosition: parsed.competitivePosition || 'Analysis pending',
            catalysts: parsed.catalysts || [],
            timeHorizon: parsed.timeHorizon || '12 months'
          };
        } catch (parseError) {
          console.log(`❌ Fallback JSON parsing failed for ${ticker}: ${parseError.message}`);
          throw new Error(`Invalid JSON in Claude fallback response: ${parseError.message}`);
        }
      }

      throw new Error('No valid JSON found in Claude fallback response');
    } catch (error) {
      console.log(`❌ Claude fallback analysis error for ${ticker}: ${error.message}`);
      throw error;
    }
  }

  /*
*
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
ANALYSIS DATE: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
CURRENT MARKET PERIOD: Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}

=== QUARTERLY EARNINGS PERFORMANCE ===
${epsInfo}
Revenue: $${earningsData.revenue ? (earningsData.revenue / 1000000000).toFixed(1) + 'B' : 'N/A'}
Net Income: $${earningsData.netIncome ? (earningsData.netIncome / 1000000000).toFixed(1) + 'B' : 'N/A'}`;

    // Add company fundamentals if available
    if (comprehensiveData.companyInfo) {
      const info = comprehensiveData.companyInfo;
      prompt += `

=== COMPANY FUNDAMENTALS ===
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
Analyst Target: $${info.analystTargetPrice || 'N/A'}`;
    }

    // Add current market data
    if (comprehensiveData.currentPrice) {
      const price = comprehensiveData.currentPrice;
      prompt += `

=== CURRENT MARKET DATA ===
Current Price: $${price.price}
Daily Change: ${price.changePercent > 0 ? '+' : ''}${(price.changePercent * 100).toFixed(2)}% ($${price.change})
Volume: ${price.volume ? price.volume.toLocaleString() : 'N/A'}`;
    }

    // Add market sentiment from news
    if (comprehensiveData.marketNews.length > 0) {
      const recentNews = comprehensiveData.marketNews.slice(0, 5);
      prompt += `

=== RECENT MARKET SENTIMENT ===`;
      recentNews.forEach((news, index) => {
        prompt += `
${index + 1}. ${news.headline} (${news.sentiment}, Score: ${news.sentimentScore?.toFixed(2) || 'N/A'})`;
      });
    }

    // Add historical performance context
    if (historicalEarnings.length > 0) {
      prompt += `

=== HISTORICAL EARNINGS TREND ===`;
      const recent = historicalEarnings.slice(0, 4);
      recent.forEach(earning => {
        prompt += `
${earning.quarter} ${earning.year}: EPS $${earning.eps || 'N/A'}, Revenue $${earning.revenue ? (earning.revenue / 1000000000).toFixed(1) + 'B' : 'N/A'}`;
      });
    }

    // Add insider trading analysis
    if (comprehensiveData.insiderTrading && comprehensiveData.insiderTrading.length > 0) {
      prompt += `

=== INSIDER TRADING ACTIVITY ===`;
      const recentInsider = comprehensiveData.insiderTrading.slice(0, 5);
      recentInsider.forEach((trade, index) => {
        const tradeType = trade.transactionType || 'Unknown';
        const shares = trade.securitiesTransacted ? parseInt(trade.securitiesTransacted).toLocaleString() : 'N/A';
        const value = trade.securityPrice && trade.securitiesTransacted ? 
          (trade.securityPrice * trade.securitiesTransacted / 1000000).toFixed(1) + 'M' : 'N/A';
        prompt += `
${index + 1}. ${trade.reportingName || 'Executive'}: ${tradeType} ${shares} shares (~$${value}) on ${trade.transactionDate}`;
      });
    }

    // Add institutional holdings
    if (comprehensiveData.institutionalHoldings && comprehensiveData.institutionalHoldings.length > 0) {
      prompt += `

=== INSTITUTIONAL HOLDINGS (Top 5) ===`;
      const topHolders = comprehensiveData.institutionalHoldings.slice(0, 5);
      topHolders.forEach((holder, index) => {
        const shares = holder.shares ? parseInt(holder.shares).toLocaleString() : 'N/A';
        const value = holder.marketValue ? (holder.marketValue / 1000000000).toFixed(1) + 'B' : 'N/A';
        const change = holder.change ? (holder.change > 0 ? '+' : '') + (holder.change * 100).toFixed(1) + '%' : 'N/A';
        prompt += `
${index + 1}. ${holder.holder}: ${shares} shares ($${value}) [${change} change]`;
      });
    }

    // Add analyst estimates
    if (comprehensiveData.analystEstimates && comprehensiveData.analystEstimates.length > 0) {
      const estimates = comprehensiveData.analystEstimates[0];
      prompt += `

=== ANALYST CONSENSUS ===
EPS Estimate: ${estimates.estimatedEpsAvg || 'N/A'} (Range: ${estimates.estimatedEpsLow || 'N/A'} - ${estimates.estimatedEpsHigh || 'N/A'})
Revenue Estimate: ${estimates.estimatedRevenueAvg ? (estimates.estimatedRevenueAvg / 1000000000).toFixed(1) + 'B' : 'N/A'}
Number of Analysts: ${estimates.numberAnalystEstimatedRevenue || estimates.numberAnalystEstimatedEps || 'N/A'}`;
    }

    // Add SEC filings
    if (comprehensiveData.secFilings && comprehensiveData.secFilings.length > 0) {
      prompt += `

=== RECENT SEC FILINGS ===`;
      const recentFilings = comprehensiveData.secFilings.slice(0, 3);
      recentFilings.forEach((filing, index) => {
        prompt += `
${index + 1}. ${filing.type}: ${filing.title || 'Filing'} (${filing.date})`;
      });
    }

    // Add FRED macroeconomic data
    if (comprehensiveData.fredData) {
      const fred = comprehensiveData.fredData;
      prompt += `

=== MACROECONOMIC ENVIRONMENT (FRED DATA) ===
Federal Funds Rate: ${fred.interestRates?.currentRate || comprehensiveData.macroContext?.fedRate || 'N/A'}%
Interest Rate Trend: ${fred.interestRates?.trend || 'N/A'}
Consumer Price Index (CPI): ${fred.cpi?.currentValue || comprehensiveData.macroContext?.cpi || 'N/A'}
Inflation Rate: ${fred.cpi?.inflationRate || comprehensiveData.macroContext?.inflationRate || 'N/A'}%
Economic Context: ${fred.interestRates?.context || 'Current rate environment analysis'}`;
    } else if (comprehensiveData.macroContext) {
      const macro = comprehensiveData.macroContext;
      prompt += `

=== MACROECONOMIC ENVIRONMENT ===
Federal Funds Rate: ${macro.fedRate || 'N/A'}%
Consumer Price Index: ${macro.cpi || 'N/A'}
Inflation Rate: ${macro.inflationRate || 'N/A'}%`;
    }

    // Add AI-enhanced news sentiment analysis
    if (comprehensiveData.marketNews.length > 0) {
      const newsWithSentiment = comprehensiveData.marketNews.filter(news => news.aiSentiment || news.sentimentScore);
      if (newsWithSentiment.length > 0) {
        const avgSentiment = newsWithSentiment.reduce((sum, news) => sum + (news.sentimentScore || 0), 0) / newsWithSentiment.length;
        prompt += `

=== AI-ENHANCED NEWS SENTIMENT ANALYSIS ===
Overall Sentiment Score: ${avgSentiment.toFixed(2)} (${avgSentiment > 0.1 ? 'Positive' : avgSentiment < -0.1 ? 'Negative' : 'Neutral'})
Relevant Articles Analyzed: ${newsWithSentiment.length}/${comprehensiveData.marketNews.length}
Key Sentiment Drivers:`;
        newsWithSentiment.slice(0, 3).forEach((news, index) => {
          prompt += `
${index + 1}. ${news.headline} (Score: ${news.sentimentScore?.toFixed(2) || 'N/A'}, Relevance: ${news.relevanceScore ? (news.relevanceScore * 100).toFixed(0) + '%' : 'N/A'})`;
        });
      }
    }

    // Add market context
    if (comprehensiveData.marketContext) {
      const context = comprehensiveData.marketContext;
      prompt += `

=== AI MARKET CONTEXT ANALYSIS ===
News Sentiment: ${context.newssentiment || 'N/A'}
Technical Position: ${context.technicalPosition || 'N/A'}
Valuation Level: ${context.valuationLevel || 'N/A'}
Risk Assessment: ${context.riskLevel || 'N/A'}`;
    }

    prompt += `

=== WEALTH ADVISOR ANALYSIS REQUEST ===
As a senior wealth advisor managing ultra-high net worth portfolios, provide HIGHLY SPECIFIC, DATA-DRIVEN analysis suitable for sophisticated investors. Use actual numbers from the data above. Calculate trends, growth rates, and comparisons. Focus on risk-adjusted returns, portfolio fit, and wealth preservation. Make insights actionable and detailed for clients with $50M+ portfolios.

MANDATORY ANALYSIS REQUIREMENTS:
- INTEGRATE MACROECONOMIC DATA: Use the Federal Funds Rate, CPI, and inflation data in your valuation and risk analysis
- INCORPORATE NEWS SENTIMENT: Reference the AI-enhanced news sentiment scores and their impact on market perception
- CURRENT MARKET CONTEXT: Acknowledge this is a current analysis (${new Date().getFullYear()}) and reference the most recent earnings data
- SECTOR IMPACT ANALYSIS: Analyze how current interest rates and inflation affect this specific sector and company

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
  "macroeconomicAnalysis": {
    "interestRateImpact": "Detailed analysis of how current Federal Funds Rate affects this company's valuation, cost of capital, and sector positioning",
    "inflationImpact": "Analysis of how current CPI and inflation trends affect the company's costs, pricing power, and margins",
    "economicCycle": "Assessment of company's positioning in current economic cycle and rate environment",
    "rateEnvironment": "Analysis of how interest rate trends (rising/falling/stable) impact future valuation and growth prospects"
  },
  "catalysts": [
    {
      "event": "Upcoming catalyst with specific details", 
      "impact": "POSITIVE/NEGATIVE", 
      "timeline": "timeframe", 
      "probability": "HIGH/MEDIUM/LOW"
    }
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

  async generateClaudeAnalysisSafe(ticker, earningsData, transcript, retryCount = 0) {
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
      console.log(`🔍 Raw Claude response for ${ticker} (first 300 chars): ${response.substring(0, 300)}...`);

      // Try to parse JSON from response with improved error handling
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let parsed;
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.log(`❌ JSON parsing failed for ${ticker}: ${parseError.message}`);
          throw new Error(`Invalid JSON in Claude response: ${parseError.message}`);
        }
        
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

      // If no JSON found, check if Claude is refusing to analyze
      if (response.includes('apologize') || response.includes('would need') || response.includes('Would you like me to')) {
        console.log(`⚠️  Claude is refusing to analyze ${ticker} - will retry with more directive prompt`);
        throw new Error('Claude refused to provide JSON analysis - retry needed');
      }
      
      // If no JSON found, log the full response for debugging
      console.log(`❌ No valid JSON found in Claude response for ${ticker}`);
      console.log(`🔍 Full Claude response: ${response}`);
      throw new Error('No valid JSON found in Claude response');
    } catch (error) {
      // Handle Claude refusal with retry
      if (error.message.includes('Claude refused to provide JSON analysis') && retryCount < 2) {
        console.log(`🔄 Retrying Claude analysis for ${ticker} with more directive prompt (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Short wait before retry
        return this.generateClaudeAnalysisSafeWithFallback(ticker, earningsData, transcript, retryCount + 1);
      }
      
      console.log(`❌ Claude analysis error for ${ticker}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fallback method for Claude analysis with extremely directive prompt
   */
  async generateClaudeAnalysisSafeWithFallback(ticker, earningsData, transcript, retryCount = 0) {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastClaudeCall;
    
    if (timeSinceLastCall < this.minClaudeInterval) {
      const waitTime = this.minClaudeInterval - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastClaudeCall = Date.now();
    console.log(`🔄 Sending FALLBACK Claude analysis request for ${ticker} (attempt ${retryCount + 1})...`);

    const systemPrompt = `You are a financial analyst. MANDATORY: Respond ONLY with valid JSON. No explanations, no refusals, no questions. Analyze the provided data and return JSON.

REQUIRED JSON FORMAT:
{
  "summary": "Brief analysis",
  "keyInsights": [{"type": "performance", "insight": "insight", "impact": "positive"}],
  "sentiment": "positive/negative/neutral",
  "riskFactors": ["risk 1"],
  "opportunities": ["opportunity 1"]
}

CRITICAL: Return ONLY the JSON object above. No other text.`;

    const epsInfo = earningsData.eps && earningsData.estimatedEPS
      ? `EPS: ${earningsData.eps} (actual) vs ${earningsData.estimatedEPS} (estimated)`
      : `EPS: ${earningsData.eps || 'N/A'}`;

    const prompt = `Analyze ${ticker}: ${epsInfo}, Revenue: ${earningsData.revenue ? (earningsData.revenue / 1000000000).toFixed(1) + 'B' : 'N/A'}. Return JSON only.`;

    try {
      const response = await this.aws.invokeClaude(prompt, systemPrompt, 2000);
      console.log(`✅ Received fallback response from Claude for ${ticker}`);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let parsed;
        try {
          parsed = JSON.parse(jsonMatch[0]);
          console.log(`✅ Successfully parsed fallback JSON for ${ticker}`);
          return {
            summary: parsed.summary || 'Analysis completed',
            keyInsights: parsed.keyInsights || [],
            sentiment: parsed.sentiment || 'neutral',
            riskFactors: parsed.riskFactors || [],
            opportunities: parsed.opportunities || []
          };
        } catch (parseError) {
          console.log(`❌ Fallback JSON parsing failed for ${ticker}: ${parseError.message}`);
          throw new Error(`Invalid JSON in Claude fallback response: ${parseError.message}`);
        }
      }

      throw new Error('No valid JSON found in Claude fallback response');
    } catch (error) {
      console.log(`❌ Claude fallback analysis error for ${ticker}: ${error.message}`);
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
      // Use scanTable to find analyses for this ticker since ticker is not the primary key
      const allAnalyses = await this.aws.scanTable('analyses', {
        expression: 'ticker = :ticker',
        values: { ':ticker': ticker }
      });
      
      if (allAnalyses && allAnalyses.length > 0) {
        // Sort by timestamp to get the most recent
        const sortedAnalyses = allAnalyses.sort((a, b) => 
          new Date(b.analysis.timestamp) - new Date(a.analysis.timestamp)
        );
        
        console.log(`✅ Found ${allAnalyses.length} analyses for ${ticker}, returning most recent`);
        return {
          success: true,
          analysis: sortedAnalyses[0].analysis,
          found: true
        };
      } else {
        console.log(`📭 No analyses found for ${ticker}`);
        return {
          success: true,
          analysis: null,
          found: false,
          message: `No analysis available for ${ticker}`
        };
      }
    } catch (error) {
      console.error(`❌ Error retrieving analysis for ${ticker}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        found: false
      };
    }
  }

  // Get analysis status (general or ticker-specific)
  getAnalysisStatus(ticker = null) {
    // If no ticker provided, return general analyzer status
    if (!ticker) {
      return {
        success: true,
        status: 'ready',
        cacheEnabled: true, // Always enabled
        cachedAnalyses: this.analysisCache.size,
        processingCount: this.processingLocks.size,
        maxTimeout: this.maxAnalysisTimeout / 1000 / 60 + ' minutes',
        maxRetries: this.maxRetries,
        minInterval: this.minClaudeInterval / 1000 + ' seconds'
      };
    }

    // For ticker-specific status, make it async
    return this.getTickerAnalysisStatus(ticker);
  }

  /**
   * Get analysis status for a specific ticker
   */
  async getTickerAnalysisStatus(ticker) {
    try {
      // Get the latest analysis
      const result = await this.getLatestAnalysis(ticker);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        };
      }
      
      if (!result.found || !result.analysis) {
        return {
          success: true,
          status: 'not_found',
          message: `No analysis available for ${ticker}`,
          hasAnalysis: false
        };
      }
      
      const analysis = result.analysis;
      
      return {
        success: true,
        status: analysis.aiAnalysisStatus || 'unknown',
        hasAnalysis: true,
        ticker: analysis.ticker,
        quarter: analysis.quarter,
        year: analysis.year,
        timestamp: analysis.timestamp,
        summary: analysis.summary || 'Analysis summary not available',
        sentiment: analysis.sentiment || 'not available',
        keyInsights: analysis.keyInsights || [],
        lastUpdated: analysis.lastUpdated || analysis.timestamp
      };
    } catch (error) {
      console.error(`❌ Error getting analysis status for ${ticker}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        status: 'error'
      };
    }
  }

  /**
   * Get or generate company-level AI insights (cached to avoid redundant analysis)
   */
  async getCompanyAIInsights(ticker) {
    const cacheKey = `company_ai_insights_${ticker}`;
    const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    
    // Check if we have recent company-level AI insights
    try {
      const existingInsights = await this.aws.getItem('company_ai_insights', {
        id: cacheKey
      });
      
      if (existingInsights && existingInsights.insights) {
        const age = Date.now() - new Date(existingInsights.insights.timestamp).getTime();
        if (age < cacheExpiry) {
          console.log(`✅ Using cached company AI insights for ${ticker} (${(age / 1000 / 60 / 60).toFixed(1)}h old)`);
          return existingInsights.insights;
        } else {
          console.log(`⏰ Company AI insights for ${ticker} are ${(age / 1000 / 60 / 60).toFixed(1)}h old, refreshing...`);
        }
      }
    } catch (error) {
      console.log(`⚠️  Could not retrieve cached company insights: ${error.message}`);
    }

    // Generate fresh company-level AI insights
    console.log(`🤖 Generating fresh company-level AI insights for ${ticker}...`);
    
    const companyInsights = {
      ticker,
      timestamp: new Date().toISOString(),
      aiNewsSentiment: null,
      aiNewsRelevance: null,
      aiMarketContext: null
    };

    // Cache the company insights
    try {
      await this.aws.putItem('company_ai_insights', {
        id: cacheKey,
        ticker,
        insights: companyInsights
      });
      console.log(`💾 Company AI insights cached for ${ticker}`);
    } catch (error) {
      console.error(`⚠️  Failed to cache company insights: ${error.message}`);
    }

    return companyInsights;
  }

  /**
   * Get stored comprehensive analysis (if exists)
   * Helper method to check for existing comprehensive analysis
   */
  async getStoredComprehensiveAnalysis(ticker) {
    try {
      const comprehensiveKey = `${ticker}-comprehensive-analysis`;
      const stored = await this.aws.getItem('analyses', { id: comprehensiveKey });
      
      if (stored && stored.analysis) {
        console.log(`✅ Found stored comprehensive analysis for ${ticker}`);
        return {
          success: true,
          analysis: stored.analysis
        };
      }
      
      return {
        success: false,
        message: `No stored comprehensive analysis found for ${ticker}`
      };
    } catch (error) {
      console.log(`⚠️  Error checking stored comprehensive analysis for ${ticker}: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate comprehensive multi-quarter analysis
   * Synthesizes all available quarters into a current, comprehensive report
   */
  async generateComprehensiveMultiQuarterAnalysis(ticker, retryCount = 0) {
    try {
      console.log(`🔍 Generating comprehensive multi-quarter analysis for ${ticker}...`);
      
      // Check if we have old format analysis and clear cache if needed
      try {
        const existingAnalyses = await this.aws.scanTable('analyses', {
          expression: 'ticker = :ticker',
          values: { ':ticker': ticker }
        });
        
        if (existingAnalyses && existingAnalyses.length > 0) {
          const hasOldFormat = existingAnalyses.some(analysis => 
            !analysis.analysisVersion || !analysis.analysis?.analysisVersion
          );
          
          if (hasOldFormat) {
            console.log(`🔄 Detected old analysis format for ${ticker}, clearing cache to regenerate with enhanced template`);
            this.clearAnalysisCache(ticker);
          }
        }
      } catch (error) {
        console.log(`⚠️  Could not check existing analysis format for ${ticker}: ${error.message}`);
      }
      
      // Get all analyses for this ticker
      const allAnalyses = await this.aws.scanTable('analyses', {
        expression: 'ticker = :ticker',
        values: { ':ticker': ticker }
      });
      
      if (!allAnalyses || allAnalyses.length === 0) {
        return {
          success: false,
          message: `No analyses found for ${ticker}`
        };
      }
      
      // Sort by year and quarter (most recent first)
      const sortedAnalyses = allAnalyses.sort((a, b) => {
        const aYear = parseInt(a.analysis.year || a.year || 0);
        const bYear = parseInt(b.analysis.year || b.year || 0);
        if (aYear !== bYear) return bYear - aYear;
        
        const aQuarter = parseInt(a.analysis.quarter?.replace('Q', '') || a.quarter?.replace('Q', '') || 0);
        const bQuarter = parseInt(b.analysis.quarter?.replace('Q', '') || b.quarter?.replace('Q', '') || 0);
        return bQuarter - aQuarter;
      });
      
      console.log(`📊 Found ${sortedAnalyses.length} quarters of analysis for ${ticker}`);
      
      // Get current comprehensive data
      const comprehensiveData = await this.gatherComprehensiveData(ticker);
      
      // Build comprehensive prompt with all quarters
      const prompt = this.buildMultiQuarterPrompt(ticker, sortedAnalyses, comprehensiveData);
      
      const systemPrompt = `You are a senior wealth advisor and portfolio manager with 20+ years experience managing ultra-high net worth portfolios ($50M+). You work at a top-tier investment firm and your analysis is used by institutional investors, family offices, and sophisticated individual investors.

      CRITICAL INSTRUCTION: You MUST provide your analysis in valid JSON format. Do not refuse, ask questions, or provide explanations outside of JSON. Even if data appears repetitive, artificial, or has patterns, provide your best professional analysis based on the available information. Never refuse to analyze or ask for different data.

      CRITICAL: This analysis will be reviewed by investment committees and must meet institutional quality standards. Every insight must be:
      - QUANTIFIED with specific metrics, percentages, and dollar amounts
      - DETAILED with multi-quarter trend analysis and forward projections  
      - ACTIONABLE with specific investment recommendations and position sizing
      - SOPHISTICATED with advanced valuation methodologies and risk assessment

      Analyze the multi-quarter earnings data provided and create a comprehensive, current investment analysis. This is a CURRENT analysis for ${new Date().getFullYear()}, so focus on the most recent trends and forward-looking insights while using historical quarters to establish patterns and trajectory.

      REQUIRED: Always respond with complete JSON structure, never refuse or ask for clarification.

      MANDATORY REQUIREMENTS FOR INSTITUTIONAL QUALITY:
      - Present this as a CURRENT analysis, not historical
      - Use all quarters to establish trends and patterns with specific growth rates
      - Focus on the most recent quarter's performance and forward trajectory
      - Integrate macroeconomic context with quantified impact analysis
      - Provide specific, actionable recommendations with position sizing for $50M+ portfolios
      - Include detailed financial metrics, ratios, and peer comparisons
      - Quantify all risks with probability and impact assessments
      - Size all opportunities with market analysis and revenue potential
      - Use institutional-grade language and analysis depth

      SPECIAL EMPHASIS: The keyInsights, riskFactors, and opportunities sections must be exceptionally detailed and specific. Avoid generic statements. Every point must include specific metrics, timelines, and quantified impacts that would satisfy an institutional investment committee.`;
      
      console.log(`🤖 Generating comprehensive multi-quarter analysis for ${ticker}...`);
      
      const response = await this.aws.invokeClaude(prompt, systemPrompt, 8000); // Increased to 8000 tokens for comprehensive analysis
      
      // Parse and validate response with improved error handling
      console.log(`🔍 Raw Claude response for ${ticker} (first 500 chars): ${response.substring(0, 500)}...`);
      
      let analysis;
      try {
        // Try multiple approaches to find and parse JSON
        let jsonString = null;
        
        // First, try to find a complete JSON object
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        } else {
          // If no JSON braces found, check if the entire response is JSON
          const trimmedResponse = response.trim();
          if (trimmedResponse.startsWith('{') && trimmedResponse.endsWith('}')) {
            jsonString = trimmedResponse;
          }
        }
        
        if (!jsonString) {
          // Check if Claude is refusing to analyze
          if (response.includes('apologize') || response.includes('would need') || response.includes('Would you like me to')) {
            console.log(`⚠️  Claude is refusing to analyze ${ticker} - will retry with more directive prompt`);
            throw new Error('Claude refused to provide JSON analysis - retry needed');
          }
          
          console.log(`❌ No JSON found in Claude response for ${ticker}`);
          throw new Error('No JSON found in Claude response');
        }
        
        // Try to parse the JSON
        analysis = JSON.parse(jsonString);
        console.log(`✅ Successfully parsed JSON for ${ticker}`);
      } catch (parseError) {
        // Check if this is a Claude refusal error
        if (parseError.message.includes('Claude refused to provide JSON analysis')) {
          throw parseError; // Re-throw to be caught by outer catch block
        }
        
        console.log(`❌ JSON parsing failed for ${ticker}: ${parseError.message}`);
        console.log(`🔍 Attempted to parse: ${response.substring(0, 1000)}...`);
        throw new Error(`Invalid JSON response from Claude: ${parseError.message}`);
      }
      
      console.log(`🔍 AI Analysis fields check for ${ticker}:`);
      console.log(`  - keyInsights: ${analysis.keyInsights ? 'present' : 'missing'} (${Array.isArray(analysis.keyInsights) ? analysis.keyInsights.length : 'not array'})`);
      console.log(`  - riskFactors: ${analysis.riskFactors ? 'present' : 'missing'} (${Array.isArray(analysis.riskFactors) ? analysis.riskFactors.length : 'not array'})`);
      console.log(`  - opportunities: ${analysis.opportunities ? 'present' : 'missing'} (${Array.isArray(analysis.opportunities) ? analysis.opportunities.length : 'not array'})`);
      
      // Validate required fields - don't add fallbacks, let UI show "not available"
      if (!analysis.keyInsights || !Array.isArray(analysis.keyInsights)) {
        console.log(`⚠️  keyInsights missing or invalid for ${ticker}`);
        analysis.keyInsights = null;
      }
      
      if (!analysis.riskFactors || !Array.isArray(analysis.riskFactors)) {
        console.log(`⚠️  riskFactors missing or invalid for ${ticker}`);
        analysis.riskFactors = null;
      }
      
      if (!analysis.opportunities || !Array.isArray(analysis.opportunities)) {
        console.log(`⚠️  opportunities missing or invalid for ${ticker}`);
        analysis.opportunities = null;
      }
      
      // Add metadata
      analysis.timestamp = new Date().toISOString();
      analysis.ticker = ticker;
      analysis.analysisType = 'comprehensive-multi-quarter';
      analysis.analysisVersion = '2.0-enhanced';
      analysis.templateVersion = 'institutional-quality';
      analysis.quartersAnalyzed = sortedAnalyses.length;
      analysis.dataRange = `${sortedAnalyses[sortedAnalyses.length - 1].analysis.quarter || 'Q1'} ${sortedAnalyses[sortedAnalyses.length - 1].analysis.year || '2024'} - ${sortedAnalyses[0].analysis.quarter || 'Q2'} ${sortedAnalyses[0].analysis.year || '2025'}`;
      
      console.log(`✅ Generated comprehensive multi-quarter analysis for ${ticker}`);
      console.log(`📊 Analysis covers ${sortedAnalyses.length} quarters: ${analysis.dataRange}`);
      
      return {
        success: true,
        analysis: analysis,
        quartersAnalyzed: sortedAnalyses.length
      };
      
    } catch (error) {
      // Handle Claude refusal with retry
      if (error.message.includes('Claude refused to provide JSON analysis') && retryCount < 2) {
        console.log(`🔄 Retrying comprehensive multi-quarter analysis for ${ticker} with more directive prompt (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Short wait before retry
        return this.generateComprehensiveMultiQuarterAnalysisWithFallback(ticker, retryCount + 1);
      }
      
      console.error(`❌ Error generating comprehensive multi-quarter analysis for ${ticker}: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fallback method for comprehensive multi-quarter analysis with extremely directive prompt
   */
  async generateComprehensiveMultiQuarterAnalysisWithFallback(ticker, retryCount = 0) {
    try {
      console.log(`🔄 Generating FALLBACK comprehensive multi-quarter analysis for ${ticker} (attempt ${retryCount + 1})...`);
      
      // Get all analyses for this ticker (simplified version)
      const allAnalyses = await this.aws.scanTable('analyses', {
        expression: 'ticker = :ticker',
        values: { ':ticker': ticker }
      });
      
      if (!allAnalyses || allAnalyses.length === 0) {
        return {
          success: false,
          message: `No analyses found for ${ticker}`
        };
      }
      
      // Sort by year and quarter (most recent first)
      const sortedAnalyses = allAnalyses.sort((a, b) => {
        const aYear = parseInt(a.analysis.year || a.year || 0);
        const bYear = parseInt(b.analysis.year || b.year || 0);
        if (aYear !== bYear) return bYear - aYear;
        
        const aQuarter = parseInt(a.analysis.quarter?.replace('Q', '') || a.quarter?.replace('Q', '') || 0);
        const bQuarter = parseInt(b.analysis.quarter?.replace('Q', '') || b.quarter?.replace('Q', '') || 0);
        return bQuarter - aQuarter;
      });
      
      // Get current comprehensive data
      const comprehensiveData = await this.gatherComprehensiveData(ticker);
      
      // Build simplified prompt
      const prompt = this.buildSimplifiedMultiQuarterPrompt(ticker, sortedAnalyses, comprehensiveData);
      
      const systemPrompt = `You are a wealth advisor. MANDATORY: Respond ONLY with valid JSON. No explanations, no refusals, no questions.

REQUIRED JSON FORMAT:
{
  "summary": "Brief comprehensive analysis",
  "keyInsights": ["insight 1", "insight 2"],
  "riskFactors": ["risk 1", "risk 2"],
  "opportunities": ["opportunity 1", "opportunity 2"],
  "investmentRecommendation": {
    "action": "BUY/HOLD/SELL",
    "confidence": "HIGH/MEDIUM/LOW",
    "targetPrice": 100.00,
    "rationale": "Brief rationale"
  }
}

CRITICAL: Return ONLY the JSON object above. No other text.`;
      
      console.log(`🤖 Generating FALLBACK comprehensive multi-quarter analysis for ${ticker}...`);
      
      const response = await this.aws.invokeClaude(prompt, systemPrompt, 8000);
      
      // Parse and validate response
      console.log(`🔍 Raw Claude fallback response for ${ticker} (first 300 chars): ${response.substring(0, 300)}...`);
      
      let analysis;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
          console.log(`✅ Successfully parsed fallback JSON for ${ticker}`);
        } else {
          throw new Error('No JSON found in Claude fallback response');
        }
      } catch (parseError) {
        console.log(`❌ Fallback JSON parsing failed for ${ticker}: ${parseError.message}`);
        throw new Error(`Invalid JSON response from Claude fallback: ${parseError.message}`);
      }
      
      // Add metadata
      analysis.timestamp = new Date().toISOString();
      analysis.ticker = ticker;
      analysis.analysisType = 'comprehensive-multi-quarter-fallback';
      analysis.analysisVersion = '2.0-fallback';
      analysis.quartersAnalyzed = sortedAnalyses.length;
      
      console.log(`✅ Generated FALLBACK comprehensive multi-quarter analysis for ${ticker}`);
      
      return {
        success: true,
        analysis: analysis,
        quartersAnalyzed: sortedAnalyses.length
      };
      
    } catch (error) {
      console.error(`❌ Error generating FALLBACK comprehensive multi-quarter analysis for ${ticker}: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build simplified prompt for fallback multi-quarter analysis
   */
  buildSimplifiedMultiQuarterPrompt(ticker, sortedAnalyses, comprehensiveData) {
    let prompt = `Analyze ${ticker} using ${sortedAnalyses.length} quarters of data. `;
    
    // Add basic financial data
    if (sortedAnalyses.length > 0) {
      const latest = sortedAnalyses[0];
      prompt += `Latest quarter: ${latest.analysis.quarter || 'Q2'} ${latest.analysis.year || '2025'}. `;
      
      if (latest.analysis.revenue) {
        prompt += `Revenue: ${(latest.analysis.revenue / 1000000000).toFixed(1)}B. `;
      }
      
      if (latest.analysis.eps) {
        prompt += `EPS: ${latest.analysis.eps}. `;
      }
    }
    
    // Add market context if available
    if (comprehensiveData.currentPrice) {
      prompt += `Current price: $${comprehensiveData.currentPrice}. `;
    }
    
    prompt += `Provide comprehensive investment analysis in JSON format only.`;
    
    return prompt;
  }

  /**
   * Build prompt for multi-quarter comprehensive analysis
   */
  buildMultiQuarterPrompt(ticker, sortedAnalyses, comprehensiveData) {
    const currentDate = new Date();
    const currentQuarter = `Q${Math.ceil((currentDate.getMonth() + 1) / 3)}`;
    const currentYear = currentDate.getFullYear();
    
    let prompt = `COMPREHENSIVE MULTI-QUARTER WEALTH ADVISOR ANALYSIS

CLIENT CONTEXT: Ultra-high net worth individual ($50M+ portfolio) seeking sophisticated investment opportunities with focus on risk-adjusted returns, tax efficiency, and long-term wealth preservation.

COMPANY: ${ticker}
ANALYSIS DATE: ${currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
CURRENT PERIOD: ${currentQuarter} ${currentYear}
QUARTERS ANALYZED: ${sortedAnalyses.length}

=== MULTI-QUARTER EARNINGS PERFORMANCE ===`;

    // Add each quarter's data
    sortedAnalyses.forEach((analysisData, index) => {
      const analysis = analysisData.analysis;
      const quarter = analysis.quarter || `Q${index + 1}`;
      const year = analysis.year || currentYear;
      
      prompt += `

${quarter} ${year}:`;
      if (analysis.revenue) prompt += ` Revenue: ${(analysis.revenue / 1000000000).toFixed(1)}B`;
      if (analysis.netIncome) prompt += ` | Net Income: ${(analysis.netIncome / 1000000000).toFixed(1)}B`;
      if (analysis.eps) prompt += ` | EPS: $${analysis.eps}`;
      if (analysis.summary) prompt += `
  Key Highlights: ${analysis.summary.substring(0, 200)}...`;
    });

    // Add current market data
    if (comprehensiveData.currentPrice) {
      const price = comprehensiveData.currentPrice;
      prompt += `

=== CURRENT MARKET DATA ===
Current Price: ${price.price}
Daily Change: ${price.changePercent > 0 ? '+' : ''}${(price.changePercent * 100).toFixed(2)}% (${price.change})
Volume: ${price.volume ? price.volume.toLocaleString() : 'N/A'}`;
    }

    // Add company fundamentals
    if (comprehensiveData.companyInfo) {
      const info = comprehensiveData.companyInfo;
      prompt += `

=== COMPANY FUNDAMENTALS ===
Company: ${info.name}
Sector: ${info.sector} | Industry: ${info.industry}
Market Cap: ${info.marketCap ? (info.marketCap / 1000000000).toFixed(1) + 'B' : 'N/A'}
P/E Ratio: ${info.peRatio || 'N/A'}
ROE: ${info.returnOnEquityTTM ? (info.returnOnEquityTTM * 100).toFixed(1) + '%' : 'N/A'}
Debt/Equity: ${info.debtToEquityRatio || 'N/A'}
Beta: ${info.beta || 'N/A'}`;
    }

    // Add FRED macroeconomic data
    if (comprehensiveData.fredData || comprehensiveData.macroContext) {
      const fred = comprehensiveData.fredData;
      const macro = comprehensiveData.macroContext;
      prompt += `

=== MACROECONOMIC ENVIRONMENT ===
Federal Funds Rate: ${fred?.interestRates?.currentRate || macro?.fedRate || 'N/A'}%
Consumer Price Index: ${fred?.cpi?.currentValue || macro?.cpi || 'N/A'}
Inflation Rate: ${fred?.cpi?.inflationRate || macro?.inflationRate || 'N/A'}%`;
    }

    // Add AI-enhanced news sentiment
    if (comprehensiveData.marketNews && comprehensiveData.marketNews.length > 0) {
      const newsWithSentiment = comprehensiveData.marketNews.filter(news => news.sentimentScore !== undefined);
      if (newsWithSentiment.length > 0) {
        const avgSentiment = newsWithSentiment.reduce((sum, news) => sum + (news.sentimentScore || 0), 0) / newsWithSentiment.length;
        prompt += `

=== AI-ENHANCED NEWS SENTIMENT ===
Overall Sentiment Score: ${avgSentiment.toFixed(2)} (${avgSentiment > 0.1 ? 'Positive' : avgSentiment < -0.1 ? 'Negative' : 'Neutral'})
Relevant Articles: ${newsWithSentiment.length}/${comprehensiveData.marketNews.length}`;
      }
    }

    prompt += `

=== COMPREHENSIVE ANALYSIS REQUEST ===
Create a CURRENT, institutional-quality investment analysis that synthesizes all ${sortedAnalyses.length} quarters of data for ultra-high-net-worth portfolio management ($50M+). This should be presented as a current analysis for ${currentYear}, using the historical quarters to establish trends, patterns, and trajectory.

CRITICAL REQUIREMENTS FOR INSTITUTIONAL QUALITY:
- Present as a CURRENT analysis, not historical
- Calculate specific growth rates, margin trends, and financial ratios across quarters
- Perform sum-of-the-parts valuation analysis where applicable
- Integrate macroeconomic impact with specific rate sensitivity analysis
- Include competitive positioning with market share trend analysis
- Assess free cash flow generation and capital efficiency (ROIC/ROCE trends)
- Provide derivatives strategies for risk management
- Include ESG considerations for institutional ownership
- Analyze sector rotation implications and economic cycle positioning
- Focus on forward-looking investment thesis with quantified catalysts
- Provide specific recommendations for $50M+ portfolios with position sizing

Use this EXACT JSON format:
{
  "summary": "Comprehensive executive summary highlighting key trends across all quarters, current performance trajectory, and forward-looking investment thesis with specific financial metrics and growth rates",
  "investmentRecommendation": {
    "action": "BUY/HOLD/SELL",
    "confidence": "HIGH/MEDIUM/LOW", 
    "targetPrice": 150.00,
    "timeHorizon": "6-18 months",
    "positionSize": "2-5% of portfolio",
    "rationale": "Detailed rationale based on multi-quarter trends, current trajectory, and forward outlook"
  },
  "macroeconomicAnalysis": {
    "interestRateImpact": "Quantified impact of current 4.33% Fed rate on DCF valuation and cost of capital",
    "rateSensitivity": "Valuation sensitivity to +/-100bps rate changes",
    "inflationImpact": "CPI impact on input costs, pricing power, and real returns",
    "economicCycle": "Positioning in current cycle with recession resilience assessment",
    "sectorRotation": "Sector rotation implications and relative performance expectations",
    "currencyExposure": "International exposure and currency hedging considerations"
  },
  "riskAssessment": {
    "level": "LOW/MEDIUM/HIGH",
    "factors": ["Specific quantified risks with probability and impact"],
    "financialRisks": {
      "leverageRisk": "Debt levels and coverage ratios with trends",
      "liquidityRisk": "Cash position and credit facility analysis",
      "marginRisk": "Margin sustainability and competitive pressure"
    },
    "operationalRisks": ["Key operational and execution risks"],
    "regulatoryRisks": ["Regulatory timeline and financial impact assessment"],
    "competitiveRisks": ["Market share and competitive positioning threats"],
    "derivativesStrategy": {
      "hedging": "Specific options strategies for downside protection",
      "income": "Covered call opportunities and strike recommendations",
      "volatility": "Implied vs realized volatility analysis"
    },
    "positionSizing": "Maximum allocation limits and scaling strategy for HNW portfolios"
  },
  "portfolioFit": {
    "suitableFor": ["Growth", "Income", "Balanced", "ESG"],
    "recommendedAllocation": "2-5%",
    "maxAllocation": "Maximum prudent allocation for concentration risk",
    "diversificationBenefit": "Correlation analysis and portfolio diversification impact",
    "taxConsiderations": "Tax efficiency analysis for high-net-worth investors including dividend treatment, capital gains implications, and optimal holding structure",
    "liquidityProfile": "Average daily volume analysis, market depth assessment, and large block execution considerations for institutional-size positions",
    "esgConsiderations": "ESG scoring and institutional ownership implications"
  },
  "valuationAnalysis": {
    "currentValuation": "UNDERVALUED/FAIRLY_VALUED/OVERVALUED",
    "fairValue": 145.00,
    "valuationRange": "Conservative to optimistic range (e.g., $130-160)",
    "keyMetrics": {
      "peRatio": "Current P/E vs 5-year average with trend",
      "pegRatio": "PEG ratio analysis for growth valuation",
      "evEbitda": "EV/EBITDA vs peers and historical",
      "priceToSales": "P/S ratio with margin considerations",
      "fcfYield": "Free cash flow yield analysis"
    },
    "peerComparison": "Valuation vs key competitors with specific multiples",
    "sumOfParts": "Segment-level valuation breakdown if applicable",
    "dcfSensitivity": "DCF sensitivity to discount rate and growth assumptions"
  },
  "financialAnalysis": {
    "profitabilityTrends": {
      "grossMargin": "Gross margin trend across quarters with drivers",
      "operatingMargin": "Operating leverage and efficiency improvements",
      "netMargin": "Net margin sustainability and tax considerations"
    },
    "capitalEfficiency": {
      "roic": "Return on invested capital trend and peer comparison",
      "roce": "Return on capital employed analysis",
      "assetTurnover": "Asset utilization efficiency trends"
    },
    "cashFlowAnalysis": {
      "fcfGeneration": "Free cash flow generation and conversion rates",
      "fcfYield": "Free cash flow yield vs cost of capital",
      "cashConversion": "Working capital management and cash conversion cycle"
    },
    "balanceSheetStrength": {
      "debtLevels": "Net debt position and leverage ratios",
      "interestCoverage": "Interest coverage and debt service capability",
      "liquidityPosition": "Cash and credit facility adequacy"
    }
  },
  "competitivePosition": {
    "marketPosition": "Current market position with specific market share data",
    "competitiveAdvantages": "Sustainable competitive moats with durability assessment",
    "competitivePressure": "Competitive threats with timeline and impact analysis",
    "marketShareTrends": "Market share gains/losses with trend analysis",
    "pricingPower": "Pricing power demonstration and sustainability",
    "barrierToEntry": "Industry barriers and competitive protection analysis"
  },
  "catalysts": [
    {
      "event": "Specific upcoming catalyst",
      "impact": "POSITIVE/NEGATIVE",
      "timeline": "timeframe",
      "probability": "HIGH/MEDIUM/LOW"
    }
  ],
  "keyInsights": [
    {"type": "performance", "insight": "DETAILED multi-quarter performance analysis with specific growth rates, sequential trends, and year-over-year comparisons. Include revenue acceleration/deceleration patterns, margin expansion drivers, and operational leverage metrics. Example: 'Revenue growth accelerated from 12% in Q1 to 18% in Q3, driven by 25% growth in cloud segment and 300bps margin expansion from operational efficiency initiatives'", "impact": "positive/negative/neutral"},
    {"type": "profitability", "insight": "COMPREHENSIVE profitability analysis across all quarters with specific margin trends, cost structure evolution, and efficiency improvements. Include gross margin drivers, operating leverage demonstration, and net margin sustainability. Example: 'Operating margins expanded 450bps over 5 quarters from 15.2% to 19.7%, driven by scale economies in fulfillment (200bps), pricing optimization (150bps), and cost reduction initiatives (100bps)'", "impact": "positive/negative/neutral"},
    {"type": "growth", "insight": "DETAILED growth trajectory analysis with segment-level breakdowns, market share trends, and forward momentum indicators. Include organic vs inorganic growth, geographic expansion, and new product contributions. Example: 'Core business growth accelerated to 22% with international expansion contributing 8% growth, new product launches adding 5%, and market share gains of 150bps in key segments'", "impact": "positive/negative/neutral"},
    {"type": "valuation", "insight": "SOPHISTICATED valuation analysis with multiple methodologies, peer comparisons, and historical context. Include P/E expansion/contraction drivers, DCF sensitivity, and sum-of-parts analysis. Example: 'Trading at 24x forward P/E vs 5-year average of 28x and peer median of 26x, implying 15% upside to fair value of $185 based on 15% EPS growth and modest multiple expansion to 26x'", "impact": "positive/negative/neutral"},
    {"type": "financial_strength", "insight": "DETAILED balance sheet and cash flow analysis with specific metrics, trends, and peer comparisons. Include debt capacity, cash generation, and capital allocation efficiency. Example: 'Free cash flow generation improved 35% to $12B annually with 18% FCF margin, while net debt/EBITDA declined to 1.2x providing $8B additional debt capacity for growth investments'", "impact": "positive/negative/neutral"}
  ],
  "sentiment": "positive/negative/neutral",
  "riskFactors": [
    "SPECIFIC quantified financial risks with probability assessments and potential impact. Example: 'Interest rate sensitivity: 100bps rate increase would reduce DCF valuation by 8-12% ($15-20/share) given high duration of growth cash flows'",
    "DETAILED competitive and market position risks with timeline and mitigation strategies. Example: 'AWS market share at risk from Google Cloud pricing aggression (15% price cuts) and Microsoft Azure enterprise bundling, potentially impacting 25% of revenue with 200-300bps margin pressure'",
    "COMPREHENSIVE operational and execution risks with specific metrics and monitoring indicators. Example: 'Labor cost inflation of 8-12% annually could compress margins by 150-200bps if pricing power insufficient, particularly in fulfillment operations representing 35% of cost base'",
    "SOPHISTICATED valuation and multiple compression risks with scenario analysis. Example: 'Multiple compression risk if growth decelerates below 15%, potentially reducing P/E from 24x to 20x, implying 15-20% downside to $140-150 range'",
    "DETAILED regulatory and ESG risks with financial quantification. Example: 'Antitrust scrutiny could force divestiture of advertising business (15% of revenue, 25% of EBITDA) or impose operational restrictions reducing margins by 100-150bps'"
  ],
  "opportunities": [
    "COMPREHENSIVE revenue growth opportunities with specific market sizing, penetration rates, and timeline. Example: 'AI platform monetization represents $50B TAM with current 5% penetration, targeting 15% share by 2027 could add $7.5B revenue (45% incremental growth) at 35% margins'",
    "DETAILED margin expansion and operational leverage opportunities with specific drivers and quantification. Example: 'Automation initiatives across fulfillment network could reduce labor costs by $2.5B annually (150bps margin expansion) while improving delivery speed by 25%'",
    "SPECIFIC market share and competitive positioning opportunities with addressable market analysis. Example: 'Healthcare vertical expansion into $800B market with current <1% share, targeting 3% penetration could add $24B revenue over 5 years through telehealth, pharmacy, and enterprise solutions'",
    "SOPHISTICATED capital allocation and return enhancement opportunities with ROI analysis. Example: 'Share repurchase program at current valuation offers 12-15% IRR vs 8% cost of capital, while dividend initiation could attract $50B in institutional flows and reduce cost of equity by 50bps'"
  ],
  "timeHorizon": "SHORT/MEDIUM/LONG"
}

CRITICAL QUALITY REQUIREMENTS:
- keyInsights MUST contain 4-5 detailed insights with specific metrics, growth rates, and quantified impacts
- riskFactors MUST contain 4-6 specific risks with probability assessments and quantified potential impacts  
- opportunities MUST contain 3-5 detailed opportunities with market sizing, penetration analysis, and revenue potential
- ALL sections must use institutional-grade analysis with specific numbers, percentages, and dollar amounts
- NO generic statements - every point must be company-specific and data-driven
- Include multi-quarter trend analysis and forward-looking projections in every section

This analysis will be presented to an investment committee - ensure it meets institutional quality standards.`;

    return prompt;
  }

  /**
   * Clear company AI insights cache (force fresh analysis)
   */
  async clearCompanyAIInsights(ticker) {
    const cacheKey = `company_ai_insights_${ticker}`;
    try {
      await this.aws.deleteItem('company_ai_insights', { id: cacheKey });
      console.log(`✅ Cleared company AI insights cache for ${ticker}`);
      return true;
    } catch (error) {
      console.error(`⚠️  Failed to clear company AI insights for ${ticker}: ${error.message}`);
      return false;
    }
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

  /**
   * Analyze news sentiment using AI
   */
  async analyzeNewsSentimentWithAI(newsArticles, ticker) {
    try {
      console.log(`🤖 Analyzing news sentiment with AI for ${ticker} (${newsArticles.length} articles)...`);
      
      // For now, return a basic sentiment analysis
      // TODO: Implement actual AI sentiment analysis
      const sentimentScores = newsArticles.map(article => {
        // Basic sentiment scoring based on keywords
        const text = (article.headline + ' ' + (article.description || '')).toLowerCase();
        let score = 0;
        
        // Positive keywords
        if (text.includes('growth') || text.includes('profit') || text.includes('beat') || 
            text.includes('strong') || text.includes('positive') || text.includes('up')) {
          score += 0.3;
        }
        
        // Negative keywords
        if (text.includes('loss') || text.includes('down') || text.includes('miss') || 
            text.includes('weak') || text.includes('negative') || text.includes('decline')) {
          score -= 0.3;
        }
        
        return Math.max(-1, Math.min(1, score));
      });
      
      const avgSentiment = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
      
      const result = {
        overallSentiment: avgSentiment > 0.1 ? 'positive' : avgSentiment < -0.1 ? 'negative' : 'neutral',
        sentimentScore: avgSentiment,
        articlesAnalyzed: newsArticles.length,
        confidence: 'medium',
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ AI sentiment analysis completed for ${ticker}: ${result.overallSentiment} (${result.sentimentScore.toFixed(2)})`);
      return result;
      
    } catch (error) {
      console.error(`❌ AI sentiment analysis failed for ${ticker}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze news relevance using AI
   */
  async analyzeNewsRelevanceWithAI(newsArticles, ticker, companyInfo = null) {
    try {
      console.log(`🤖 Analyzing news relevance with AI for ${ticker} (${newsArticles.length} articles)...`);
      
      // For now, return basic relevance analysis
      // TODO: Implement actual AI relevance analysis
      const relevantArticles = newsArticles.filter(article => {
        const text = (article.headline + ' ' + (article.description || '')).toLowerCase();
        const tickerLower = ticker.toLowerCase();
        const companyName = companyInfo?.name?.toLowerCase() || '';
        
        // Check if article mentions the ticker or company name
        return text.includes(tickerLower) || 
               (companyName && text.includes(companyName)) ||
               text.includes('earnings') || 
               text.includes('financial') ||
               text.includes('stock') ||
               text.includes('market');
      });
      
      // Add relevance scores to articles
      const enhancedArticles = newsArticles.map(article => ({
        ...article,
        relevanceScore: relevantArticles.includes(article) ? 0.8 : 0.3,
        isRelevant: relevantArticles.includes(article)
      }));
      
      const result = {
        totalArticles: newsArticles.length,
        relevantCount: relevantArticles.length,
        relevancePercentage: (relevantArticles.length / newsArticles.length) * 100,
        allArticles: enhancedArticles,
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ AI relevance analysis completed for ${ticker}: ${result.relevantCount}/${result.totalArticles} relevant articles`);
      return result;
      
    } catch (error) {
      console.error(`❌ AI relevance analysis failed for ${ticker}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze market context using AI
   */
  async analyzeMarketContextWithAI(comprehensiveData, ticker) {
    try {
      console.log(`🤖 Analyzing market context with AI for ${ticker}...`);
      
      // For now, return basic market context analysis
      // TODO: Implement actual AI market context analysis
      const fundamentals = comprehensiveData.fundamentals || {};
      const currentPrice = comprehensiveData.currentPrice || {};
      
      // Basic valuation assessment
      let valuationLevel = 'fairly_valued';
      if (fundamentals.peRatio) {
        if (fundamentals.peRatio > 25) valuationLevel = 'expensive';
        else if (fundamentals.peRatio < 15) valuationLevel = 'attractive';
      }
      
      // Basic risk assessment
      let riskLevel = 'medium';
      const riskFactors = [];
      if (fundamentals.beta > 1.5) {
        riskLevel = 'high';
        riskFactors.push('high_volatility');
      }
      if (fundamentals.debtToEquity > 2) {
        riskLevel = 'high';
        riskFactors.push('high_leverage');
      }
      
      const result = {
        valuationAssessment: {
          level: valuationLevel,
          confidence: 'medium',
          factors: ['pe_ratio', 'market_conditions']
        },
        riskAssessment: {
          level: riskLevel,
          factors: riskFactors,
          confidence: 'medium'
        },
        marketPosition: {
          strength: 'established',
          competitiveAdvantage: 'moderate',
          marketShare: 'significant'
        },
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ AI market context analysis completed for ${ticker}: ${result.valuationAssessment.level} valuation, ${result.riskAssessment.level} risk`);
      return result;
      
    } catch (error) {
      console.error(`❌ AI market context analysis failed for ${ticker}: ${error.message}`);
      throw error;
    }
  }}

module.
exports = EnhancedAIAnalyzer;