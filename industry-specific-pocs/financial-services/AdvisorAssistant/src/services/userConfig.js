const AWSServices = require('./awsServices');

class UserConfigService {
  constructor() {
    this.aws = new AWSServices();
    // Use 'user-config' as the table name - AWS services will handle the prefix
  }

  // Get user configuration
  async getUserConfig(userId) {
    try {
      const result = await this.aws.getItem('user-config', { userId });
      
      if (!result) {
        // Return default configuration for new users
        return this.getDefaultConfig(userId);
      }

      return {
        success: true,
        config: result
      };
    } catch (error) {
      console.error('Get user config error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Save user configuration
  async saveUserConfig(userId, config) {
    try {
      const configData = {
        userId,
        ...config,
        updatedAt: new Date().toISOString()
      };

      await this.aws.putItem('user-config', configData);
      
      return {
        success: true,
        config: configData
      };
    } catch (error) {
      console.error('Save user config error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get default configuration for new users
  getDefaultConfig(userId) {
    return {
      success: true,
      config: {
        userId,
        watchlist: [],
        alertPreferences: {
          email: true,
          push: false,
          financialAlerts: true,
          priceAlerts: true,
          analysisAlerts: true
        },
        displayPreferences: {
          theme: 'light',
          currency: 'USD',
          dateFormat: 'MM/DD/YYYY',
          timezone: 'America/New_York'
        },
        analysisSettings: {
          riskTolerance: 'moderate',
          investmentHorizon: 'medium',
          sectors: [],
          excludedSectors: []
        },
        dashboardLayout: {
          widgets: [
            { id: 'watchlist', position: { x: 0, y: 0, w: 6, h: 4 } },
            { id: 'alerts', position: { x: 6, y: 0, w: 6, h: 4 } },
            { id: 'recent-analysis', position: { x: 0, y: 4, w: 12, h: 6 } }
          ]
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }

  // Add company to user's watchlist
  async addToWatchlist(userId, ticker, companyName) {
    try {
      const configResult = await this.getUserConfig(userId);
      if (!configResult.success) {
        return configResult;
      }

      const config = configResult.config;
      
      // Check if already in watchlist
      const existingIndex = config.watchlist.findIndex(item => item.ticker === ticker);
      if (existingIndex !== -1) {
        return {
          success: false,
          error: 'Company already in watchlist'
        };
      }

      // Add to watchlist
      config.watchlist.push({
        ticker,
        companyName,
        addedAt: new Date().toISOString()
      });

      return await this.saveUserConfig(userId, config);
    } catch (error) {
      console.error('Add to watchlist error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Remove company from user's watchlist
  async removeFromWatchlist(userId, ticker) {
    try {
      const configResult = await this.getUserConfig(userId);
      if (!configResult.success) {
        return configResult;
      }

      const config = configResult.config;
      config.watchlist = config.watchlist.filter(item => item.ticker !== ticker);

      return await this.saveUserConfig(userId, config);
    } catch (error) {
      console.error('Remove from watchlist error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update alert preferences
  async updateAlertPreferences(userId, alertPreferences) {
    try {
      const configResult = await this.getUserConfig(userId);
      if (!configResult.success) {
        return configResult;
      }

      const config = configResult.config;
      config.alertPreferences = {
        ...config.alertPreferences,
        ...alertPreferences
      };

      return await this.saveUserConfig(userId, config);
    } catch (error) {
      console.error('Update alert preferences error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update display preferences
  async updateDisplayPreferences(userId, displayPreferences) {
    try {
      const configResult = await this.getUserConfig(userId);
      if (!configResult.success) {
        return configResult;
      }

      const config = configResult.config;
      config.displayPreferences = {
        ...config.displayPreferences,
        ...displayPreferences
      };

      return await this.saveUserConfig(userId, config);
    } catch (error) {
      console.error('Update display preferences error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update analysis settings
  async updateAnalysisSettings(userId, analysisSettings) {
    try {
      const configResult = await this.getUserConfig(userId);
      if (!configResult.success) {
        return configResult;
      }

      const config = configResult.config;
      config.analysisSettings = {
        ...config.analysisSettings,
        ...analysisSettings
      };

      return await this.saveUserConfig(userId, config);
    } catch (error) {
      console.error('Update analysis settings error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get user's watchlist with latest data
  async getUserWatchlist(userId) {
    try {
      const configResult = await this.getUserConfig(userId);
      if (!configResult.success) {
        return configResult;
      }

      const watchlist = configResult.config.watchlist || [];
      

      return {
        success: true,
        watchlist: watchlist
      };
    } catch (error) {
      console.error('Get user watchlist error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get user's personalized alerts
  async getUserAlerts(userId, unreadOnly = false) {
    try {
      // Get user's watchlist to filter alerts
      const configResult = await this.getUserConfig(userId);
      if (!configResult.success) {
        return configResult;
      }

      const watchlistTickers = configResult.config.watchlist.map(item => item.ticker);
      
      // Get all alerts and filter by user's watchlist
      const allAlerts = await this.aws.scanTable('alerts');
      
      const userAlerts = allAlerts.filter(alert => {
        // Include alerts for companies in user's watchlist or general alerts
        return !alert.ticker || watchlistTickers.includes(alert.ticker);
      });

      const filteredAlerts = unreadOnly 
        ? userAlerts.filter(alert => !alert.read)
        : userAlerts;

      return {
        success: true,
        alerts: filteredAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      };
    } catch (error) {
      console.error('Get user alerts error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = UserConfigService;