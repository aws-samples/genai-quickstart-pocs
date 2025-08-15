/**
 * Data Provider Interface
 * 
 * Base interface that all data providers must implement.
 * Defines the standard methods for fetching financial data.
 * 
 * @author Advisor Assistant Team
 * @version 1.0.0
 */

class DataProviderInterface {
  /**
   * Get current stock price and trading data
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Object|null>} Stock price data or null if not found
   */
  async getStockPrice(ticker) {
    throw new Error('getStockPrice method must be implemented by provider');
  }

  /**
   * Get financial data for a stock
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Array>} Array of financial data or empty array
   */
  async getFinancialData(ticker) {
    throw new Error('getFinancialData method must be implemented by provider');
  }

  /**
   * Get company information and fundamentals
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Object|null>} Company information or null if not found
   */
  async getCompanyInfo(ticker) {
    throw new Error('getCompanyInfo method must be implemented by provider');
  }

  /**
   * Get market news for a stock or general market
   * @param {string} ticker - Stock ticker symbol (optional)
   * @returns {Promise<Array>} Array of news articles or empty array
   */
  async getMarketNews(ticker) {
    throw new Error('getMarketNews method must be implemented by provider');
  }

  /**
   * Update stock prices for tracked securities
   * @returns {Promise<Object>} Update results
   */
  async updateStockPrices() {
    throw new Error('updateStockPrices method must be implemented by provider');
  }

  /**
   * Get provider name for identification
   * @returns {string} Provider name
   */
  getProviderName() {
    return this.constructor.name;
  }

  /**
   * Get provider configuration
   * @returns {Object} Provider configuration details
   */
  getProviderConfig() {
    return {
      name: this.getProviderName(),
      version: '1.0.0',
      capabilities: ['stock_price', 'financials', 'company_info', 'news']
    };
  }
}

module.exports = DataProviderInterface;