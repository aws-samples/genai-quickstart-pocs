/**
 * Yahoo Finance Data Provider
 * 
 * Provides stock prices, earnings data, and company information using Yahoo Finance API
 * via yfinance Python library bridge. This provider offers comprehensive financial data
 * without requiring an API key.
 * 
 * Features:
 * - Real-time stock prices and trading data
 * - Quarterly earnings reports and historical data
 * - Company fundamentals and profile information
 * - Built-in caching with 5-minute expiration for stock prices
 * - Error handling and graceful degradation
 * 
 * @author Advisor Assistant Team
 * @version 1.0.0
 */

const { spawn } = require('child_process');
const path = require('path');
const BaseProvider = require('./BaseProvider');

class YahooFinanceProvider extends BaseProvider {
  constructor(config = {}) {
    super('yahoo', {
      ...config,
      providers: {
        yahoo: {
          cache: {
            stock_price: 300000, // 5 minutes
            earnings: 3600000, // 1 hour
            company_info: 86400000, // 24 hours
            news: 1800000 // 30 minutes
          },
          rateLimit: {
            requestsPerMinute: 120, // Conservative limit
            burstLimit: 30
          },
          requestTimeout: 15000, // 15 seconds for Python process
          maxRetries: 2,
          retryDelay: 2000
        }
      }
    });

    // Python path detection - prefer virtual environment, fallback to system Python
    const venvPath = path.join(process.cwd(), '.venv', 'bin', 'python');
    const fs = require('fs');
    
    if (fs.existsSync(venvPath)) {
      this.pythonPath = venvPath;
    } else if (process.platform === 'win32') {
      this.pythonPath = 'python';
    } else {
      // Docker/Linux environment - try python3 first, then python
      this.pythonPath = 'python3';
    }
    
    console.log(`🐍 YahooFinanceProvider initialized with Python path: ${this.pythonPath}`);
  }

  /**
   * Validate Python installation and required packages
   * @returns {Promise<boolean>} True if Python and packages are available
   */
  async validatePythonEnvironment() {
    try {
      const testScript = `
import sys
import yfinance as yf
import pandas as pd
import numpy as np
print("Python environment validated successfully")
      `;
      
      await this.executePythonScript(testScript, 5000);
      return true;
    } catch (error) {
      console.error(`❌ Python environment validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Execute Python script with yfinance and enhanced error handling
   * @param {string} script - Python script to execute
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<any>} Parsed JSON result
   */
  async executePythonScript(script, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(this.pythonPath, ['-c', script], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: timeout
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            // Parse JSON output from Python script
            const result = JSON.parse(stdout.trim());
            resolve(result);
          } catch (error) {
            const parseError = new Error(`Yahoo Finance data parsing failed: ${error.message}`);
            parseError.category = 'data';
            parseError.severity = 'medium';
            parseError.context = { stdout, stderr };
            reject(parseError);
          }
        } else {
          // Categorize Python process errors
          let errorCategory = 'provider';
          let errorSeverity = 'high';
          let errorMessage = `Python process failed with code ${code}`;

          if (stderr.includes('ModuleNotFoundError') || stderr.includes('yfinance')) {
            errorCategory = 'provider';
            errorSeverity = 'critical';
            errorMessage = 'yfinance module not available or corrupted';
          } else if (stderr.includes('Permission denied') || code === 126) {
            errorCategory = 'provider';
            errorSeverity = 'critical';
            errorMessage = 'Python execution permission denied';
          } else if (stderr.includes('No such file') || code === 127) {
            errorCategory = 'provider';
            errorSeverity = 'critical';
            errorMessage = 'Python interpreter not found - check Python installation';
          } else if (stderr.includes('timeout') || stderr.includes('TimeoutError')) {
            errorCategory = 'timeout';
            errorSeverity = 'medium';
            errorMessage = 'Python script execution timeout';
          } else if (stderr.includes('network') || stderr.includes('connection')) {
            errorCategory = 'network';
            errorSeverity = 'medium';
            errorMessage = 'Network error in Python script';
          }

          const processError = new Error(errorMessage);
          processError.category = errorCategory;
          processError.severity = errorSeverity;
          processError.code = code;
          processError.context = { stderr, stdout };
          reject(processError);
        }
      });

      pythonProcess.on('error', (error) => {
        // Handle process spawn errors
        let enhancedError;
        
        if (error.code === 'ENOENT') {
          enhancedError = new Error('Python interpreter not found - check Python installation');
          enhancedError.category = 'provider';
          enhancedError.severity = 'critical';
        } else if (error.code === 'EACCES') {
          enhancedError = new Error('Python execution permission denied');
          enhancedError.category = 'provider';
          enhancedError.severity = 'critical';
        } else {
          enhancedError = new Error(`Python process spawn error: ${error.message}`);
          enhancedError.category = 'provider';
          enhancedError.severity = 'high';
        }
        
        enhancedError.originalError = error;
        reject(enhancedError);
      });

      // Set timeout with proper error categorization
      const timeoutId = setTimeout(() => {
        pythonProcess.kill('SIGTERM');
        const timeoutError = new Error(`Python script execution timeout after ${timeout}ms`);
        timeoutError.category = 'timeout';
        timeoutError.severity = 'medium';
        reject(timeoutError);
      }, timeout);

      // Clear timeout if process completes normally
      pythonProcess.on('close', () => {
        clearTimeout(timeoutId);
      });
    });
  }

  /**
   * Get current stock price and trading data
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Object|null>} Stock price data or null if not found
   */
  async getStockPrice(ticker) {
    if (!ticker || typeof ticker !== 'string') {
      throw new Error('Ticker symbol is required and must be a string');
    }

    const normalizedTicker = ticker.toUpperCase().trim();
    console.log(`📊 YahooFinanceProvider: Fetching stock price for ${normalizedTicker}`);

    return await this.executeWithCache('stock_price', normalizedTicker, async () => {
      const pythonScript = `
import yfinance as yf
import json
import sys
from datetime import datetime

try:
    ticker = yf.Ticker("${normalizedTicker}")
    info = ticker.info
    hist = ticker.history(period="1d")
    
    if hist.empty or not info:
        print(json.dumps(None))
        sys.exit(0)
    
    # Get the most recent trading data
    latest = hist.iloc[-1]
    
    result = {
        "ticker": "${normalizedTicker}",
        "price": float(info.get("currentPrice", latest["Close"])),
        "change": float(info.get("regularMarketChange", 0)),
        "changePercent": float(info.get("regularMarketChangePercent", 0)) / 100,
        "volume": int(info.get("volume", latest.get("Volume", 0))),
        "previousClose": float(info.get("previousClose", latest["Close"])),
        "open": float(info.get("open", latest["Open"])),
        "high": float(info.get("dayHigh", latest["High"])),
        "low": float(info.get("dayLow", latest["Low"])),
        "marketCap": info.get("marketCap"),
        "pe": info.get("trailingPE"),
        "eps": info.get("trailingEps"),
        "beta": info.get("beta"),
        "week52High": info.get("fiftyTwoWeekHigh"),
        "week52Low": info.get("fiftyTwoWeekLow"),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    print(json.dumps(result))
    
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

      const result = await this.executePythonScript(pythonScript);
      
      if (result && result.error) {
        console.error(`❌ Yahoo Finance error for ${normalizedTicker}: ${result.error}`);
        return null;
      }
      
      if (result && result.ticker) {
        console.log(`✅ Successfully fetched stock price for ${normalizedTicker}: $${result.price}`);
        return result;
      }
      
      console.log(`⚠️  No stock data found for ${normalizedTicker}`);
      return null;
    }, {
      cacheTtl: this.config.getCacheConfig('yahoo', 'stock_price').duration
    });
  }

  /**
   * Get earnings data for a stock
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Array>} Array of earnings data or empty array
   */
  async getEarningsData(ticker) {
    if (!ticker || typeof ticker !== 'string') {
      throw new Error('Ticker symbol is required and must be a string');
    }

    const normalizedTicker = ticker.toUpperCase().trim();
    console.log(`📊 YahooFinanceProvider: Fetching earnings data for ${normalizedTicker}`);

    return await this.executeWithCache('earnings', normalizedTicker, async () => {
      const pythonScript = `
import yfinance as yf
import json
import sys
from datetime import datetime
import pandas as pd

try:
    ticker = yf.Ticker("${normalizedTicker}")
    earnings_data = []
    
    # Get both quarterly earnings and financials
    quarterly_earnings = None
    quarterly_financials = None
    
    try:
        quarterly_earnings = ticker.quarterly_earnings
    except:
        pass
        
    try:
        quarterly_financials = ticker.quarterly_financials
    except:
        pass
    
    # Approach 1: Use quarterly_earnings if available
    if quarterly_earnings is not None and not quarterly_earnings.empty:
        for i, (date, row) in enumerate(quarterly_earnings.head(8).iterrows()):
            quarter_data = {
                "ticker": "${normalizedTicker}",
                "quarter": f"Q{((date.month - 1) // 3) + 1}",
                "year": date.year,
                "eps": float(row.get("Earnings", 0)) if pd.notna(row.get("Earnings")) else None,
                "reportDate": date.strftime("%Y-%m-%d"),
                "fiscalEndDate": date.strftime("%Y-%m-%d"),
                "revenue": None,
                "netIncome": None
            }
            
            # Try to match with revenue data from financials
            if quarterly_financials is not None and not quarterly_financials.empty:
                revenue_keys = ["Total Revenue", "Revenue", "Net Sales", "Sales"]
                income_keys = ["Net Income", "Net Income Common Stockholders", "Net Income Applicable To Common Shares"]
                
                for key in revenue_keys:
                    if key in quarterly_financials.index:
                        revenue_series = quarterly_financials.loc[key]
                        # Find closest date within 90 days
                        for fin_date, revenue in revenue_series.items():
                            if abs((fin_date - date).days) <= 90 and pd.notna(revenue):
                                quarter_data["revenue"] = float(revenue)
                                break
                        break
                
                for key in income_keys:
                    if key in quarterly_financials.index:
                        income_series = quarterly_financials.loc[key]
                        # Find closest date within 90 days
                        for fin_date, income in income_series.items():
                            if abs((fin_date - date).days) <= 90 and pd.notna(income):
                                quarter_data["netIncome"] = float(income)
                                break
                        break
            
            earnings_data.append(quarter_data)
    
    # Approach 2: Use financials only if no quarterly_earnings
    elif quarterly_financials is not None and not quarterly_financials.empty:
        revenue_keys = ["Total Revenue", "Revenue", "Net Sales", "Sales"]
        for key in revenue_keys:
            if key in quarterly_financials.index:
                revenue_series = quarterly_financials.loc[key]
                for i, (date, revenue) in enumerate(revenue_series.head(8).items()):
                    if pd.notna(revenue):
                        quarter_data = {
                            "ticker": "${normalizedTicker}",
                            "quarter": f"Q{((date.month - 1) // 3) + 1}",
                            "year": date.year,
                            "revenue": float(revenue),
                            "eps": None,
                            "netIncome": None,
                            "reportDate": date.strftime("%Y-%m-%d"),
                            "fiscalEndDate": date.strftime("%Y-%m-%d")
                        }
                        
                        # Try to get net income for the same period
                        income_keys = ["Net Income", "Net Income Common Stockholders", "Net Income Applicable To Common Shares"]
                        for income_key in income_keys:
                            if income_key in quarterly_financials.index:
                                income_series = quarterly_financials.loc[income_key]
                                if date in income_series.index and pd.notna(income_series[date]):
                                    quarter_data["netIncome"] = float(income_series[date])
                                    break
                        
                        earnings_data.append(quarter_data)
                break
    
    # Sort by date (most recent first)
    earnings_data.sort(key=lambda x: x["reportDate"], reverse=True)
    
    print(json.dumps(earnings_data))
    
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

      const result = await this.executePythonScript(pythonScript);
      
      if (result && result.error) {
        console.error(`❌ Yahoo Finance earnings error for ${normalizedTicker}: ${result.error}`);
        return [];
      }
      
      if (Array.isArray(result)) {
        console.log(`✅ Successfully fetched ${result.length} earnings records for ${normalizedTicker}`);
        return result;
      }
      
      console.log(`⚠️  No earnings data found for ${normalizedTicker}`);
      return [];
    }, {
      cacheTtl: this.config.getCacheConfig('yahoo', 'earnings').duration
    });
  }

  /**
   * Get company information and fundamentals
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Object|null>} Company information or null if not found
   */
  async getCompanyInfo(ticker) {
    if (!ticker || typeof ticker !== 'string') {
      throw new Error('Ticker symbol is required and must be a string');
    }

    const normalizedTicker = ticker.toUpperCase().trim();
    console.log(`📊 YahooFinanceProvider: Fetching company info for ${normalizedTicker}`);

    return await this.executeWithCache('company_info', normalizedTicker, async () => {
      const pythonScript = `
import yfinance as yf
import json
import sys
from datetime import datetime

try:
    ticker = yf.Ticker("${normalizedTicker}")
    info = ticker.info
    
    # Validate that we have basic company information
    if not info or not info.get("longName") and not info.get("shortName"):
        print(json.dumps(None))
        sys.exit(0)
    
    # Map Yahoo Finance data to our internal structure
    result = {
        "ticker": "${normalizedTicker}",
        "name": info.get("longName") or info.get("shortName"),
        "sector": info.get("sector"),
        "industry": info.get("industry"),
        "description": info.get("longBusinessSummary"),
        "marketCap": info.get("marketCap"),
        "peRatio": info.get("trailingPE"),
        "pegRatio": info.get("pegRatio"),
        "bookValue": info.get("bookValue"),
        "dividendPerShare": info.get("dividendRate"),
        "dividendYield": info.get("dividendYield"),
        "eps": info.get("trailingEps"),
        "revenuePerShareTTM": info.get("revenuePerShare"),
        "profitMargin": info.get("profitMargins"),
        "operatingMarginTTM": info.get("operatingMargins"),
        "returnOnAssetsTTM": info.get("returnOnAssets"),
        "returnOnEquityTTM": info.get("returnOnEquity"),
        "revenueTTM": info.get("totalRevenue"),
        "grossProfitTTM": info.get("grossProfits"),
        "dilutedEPSTTM": info.get("trailingEps"),
        "quarterlyEarningsGrowthYOY": info.get("earningsQuarterlyGrowth"),
        "quarterlyRevenueGrowthYOY": info.get("revenueQuarterlyGrowth"),
        "analystTargetPrice": info.get("targetMeanPrice"),
        "trailingPE": info.get("trailingPE"),
        "forwardPE": info.get("forwardPE"),
        "priceToSalesRatioTTM": info.get("priceToSalesTrailing12Months"),
        "priceToBookRatio": info.get("priceToBook"),
        "evToRevenue": info.get("enterpriseToRevenue"),
        "evToEBITDA": info.get("enterpriseToEbitda"),
        "beta": info.get("beta"),
        "week52High": info.get("fiftyTwoWeekHigh"),
        "week52Low": info.get("fiftyTwoWeekLow"),
        "day50MovingAverage": info.get("fiftyDayAverage"),
        "day200MovingAverage": info.get("twoHundredDayAverage"),
        "sharesOutstanding": info.get("sharesOutstanding"),
        "currentRatio": info.get("currentRatio"),
        "quickRatio": info.get("quickRatio"),
        "debtToEquityRatio": info.get("debtToEquity"),
        "interestCoverage": info.get("interestCoverage"),
        "grossMargin": info.get("grossMargins"),
        "payoutRatio": info.get("payoutRatio"),
        "country": info.get("country"),
        "exchange": info.get("exchange"),
        "currency": info.get("currency"),
        "address": info.get("address1"),
        "fiscalYearEnd": info.get("lastFiscalYearEnd"),
        "latestQuarter": info.get("mostRecentQuarter")
    }
    
    # Validate required fields - at minimum we need name
    if not result["name"]:
        print(json.dumps(None))
        sys.exit(0)
    
    print(json.dumps(result))
    
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

      const result = await this.executePythonScript(pythonScript);
      
      if (result && result.error) {
        console.error(`❌ Yahoo Finance company info error for ${normalizedTicker}: ${result.error}`);
        return null;
      }
      
      if (result && result.ticker) {
        // Validate required company data fields
        const validationResult = this.validateCompanyData(result);
        if (validationResult.isValid) {
          console.log(`✅ Successfully fetched company info for ${normalizedTicker}: ${result.name}`);
          return result;
        } else {
          console.log(`⚠️  Company data validation failed for ${normalizedTicker}: ${validationResult.issues.join(', ')}`);
          return result; // Return data even if some fields are missing, but log the issues
        }
      }
      
      console.log(`⚠️  No company info found for ${normalizedTicker}`);
      return null;
    }, {
      cacheTtl: this.config.getCacheConfig('yahoo', 'company_info').duration
    });
  }

  /**
   * Get market news for a stock (placeholder - Yahoo Finance doesn't provide news via yfinance)
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Array>} Empty array (news not supported by yfinance)
   */
  async getMarketNews(ticker) {
    console.log(`📊 YahooFinanceProvider: News not supported via yfinance for ${ticker}`);
    return [];
  }

  /**
   * Update stock prices for tracked securities (placeholder)
   * @returns {Promise<Object>} Update results
   */
  async updateStockPrices() {
    console.log('📊 YahooFinanceProvider: updateStockPrices not implemented');
    return {
      success: false,
      message: 'updateStockPrices not implemented for Yahoo Finance provider'
    };
  }

  /**
   * Validate company data for required fields
   * @param {Object} companyData - Company data to validate
   * @returns {Object} Validation result with isValid flag and issues array
   */
  validateCompanyData(companyData) {
    const validation = {
      isValid: true,
      issues: [],
      warnings: []
    };

    // Required fields
    const requiredFields = ['ticker', 'name'];
    for (const field of requiredFields) {
      if (!companyData[field]) {
        validation.isValid = false;
        validation.issues.push(`Missing required field: ${field}`);
      }
    }

    // Important fields that should be present for most companies
    const importantFields = ['sector', 'industry', 'marketCap'];
    for (const field of importantFields) {
      if (!companyData[field]) {
        validation.warnings.push(`Missing important field: ${field}`);
      }
    }

    // Validate data types for numeric fields
    const numericFields = ['marketCap', 'peRatio', 'eps', 'beta'];
    for (const field of numericFields) {
      if (companyData[field] !== null && companyData[field] !== undefined) {
        if (typeof companyData[field] !== 'number' || isNaN(companyData[field])) {
          validation.warnings.push(`Invalid numeric value for field: ${field}`);
        }
      }
    }

    return validation;
  }

  /**
   * Get provider configuration
   * @returns {Object} Provider configuration details
   */
  getProviderConfig() {
    return {
      name: 'YahooFinanceProvider',
      version: '1.0.0',
      capabilities: ['stock_price', 'earnings', 'company_info'],
      dataSource: 'Yahoo Finance via yfinance',
      requiresApiKey: false,
      rateLimits: {
        requestsPerMinute: 120,
        burstLimit: 30
      },
      cacheDurations: {
        stock_price: '5 minutes',
        earnings: '1 hour',
        company_info: '24 hours'
      }
    };
  }
}

module.exports = YahooFinanceProvider;