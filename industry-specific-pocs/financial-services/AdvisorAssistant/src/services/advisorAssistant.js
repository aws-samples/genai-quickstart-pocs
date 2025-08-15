const AWSServices = require('./awsServices');

class AdvisorAssistant {
    constructor() {
        this.aws = new AWSServices();
        this.initializeDatabase();
    }

    async initializeDatabase() {
        // DynamoDB tables are created via AWS Console or CloudFormation
        // Table structures:
        // companies: ticker (PK), name, sector, marketCap, createdAt, updatedAt
        // financials: ticker (PK), quarter-year (SK), revenue, netIncome, eps, guidance, reportDate, transcriptUrl, filingUrl
        // alerts: id (PK), ticker, alertType, message, severity, isRead, createdAt


    }

    async addCompany(ticker, name) {
        try {
            const company = {
                ticker: ticker.toUpperCase(),
                name,
                sector: null,
                marketCap: null
            };

            await this.aws.putItem('companies', company);

            // Publish event
            await this.aws.publishEvent('CompanyAdded', { ticker, name });

            // Log the action
            await this.aws.logEvent({ action: 'addCompany', ticker, name });

            return { ticker, name, status: 'added' };
        } catch (error) {
            console.error('Error adding company:', error);
            throw error;
        }
    }

    async getTrackedCompanies() {
        try {
            const companies = await this.aws.scanTable('companies');

            // Enhance with financial report count for each company
            const enhancedCompanies = await Promise.all(
                companies.map(async (company) => {
                    const financials = await this.aws.queryItems('financials', {
                        expression: 'ticker = :ticker',
                        values: { ':ticker': company.ticker }
                    });

                    return {
                        ...company,
                        financials_count: financials.length,
                        last_financial_date: financials.length > 0
                            ? Math.max(...financials.map(f => new Date(f.reportDate || f.createdAt)))
                            : null
                    };
                })
            );

            return enhancedCompanies.sort((a, b) => a.ticker.localeCompare(b.ticker));
        } catch (error) {
            console.error('Error getting tracked companies:', error);
            return [];
        }
    }

    async getFinancialHistory(ticker) {
        try {
            const financials = await this.aws.queryItems('financials', {
                expression: 'ticker = :ticker',
                values: { ':ticker': ticker.toUpperCase() }
            });

            // Sort by year and quarter (most recent first)
            return financials.sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                const quarterOrder = { 'Q4': 4, 'Q3': 3, 'Q2': 2, 'Q1': 1 };
                return quarterOrder[b.quarter] - quarterOrder[a.quarter];
            });
        } catch (error) {
            console.error('Error getting financial history:', error);
            return [];
        }
    }

    async addFinancialReport(ticker, financialData) {
        try {
            const { quarter, year, revenue, netIncome, eps, guidance, reportDate, transcriptUrl, filingUrl } = financialData;
            const upperTicker = ticker.toUpperCase();
            const quarterYear = `${quarter}-${year}`;

            // Check if this financial report already exists
            const existingReport = await this.aws.getItem('financials', {
                ticker: upperTicker,
                'quarter-year': quarterYear
            });

            if (existingReport) {
                console.log(`Financial report for ${upperTicker} ${quarter} ${year} already exists, skipping...`);
                return { status: 'exists', ticker: upperTicker, quarter, year };
            }

            const financialRecord = {
                ticker: upperTicker,
                'quarter-year': quarterYear,
                quarter,
                year,
                revenue,
                netIncome,
                eps,
                guidance,
                reportDate: reportDate ? new Date(reportDate).toISOString() : null,
                transcriptUrl,
                filingUrl
            };

            await this.aws.putItem('financials', financialRecord);

            // Store transcript in S3 if available
            if (transcriptUrl) {
                // This would fetch and store the transcript
                await this.aws.storeFinancialDocument(ticker, quarter, year, { url: transcriptUrl }, 'transcript');
            }

            // Publish event
            await this.aws.publishEvent('FinancialReportAdded', {
                ticker,
                quarter,
                year,
                eps,
                revenue
            });

            // Create alert for new financial report
            await this.createAlert(ticker, 'new_financials', `New ${quarter} ${year} financial report added for ${ticker}`, 'medium');
            
            // Send to SQS for AI analysis
            await this.aws.sendMessage({
                action: 'analyzeFinancials',
                ticker,
                financialData
            });

            return { status: 'added', ticker, quarter, year };
        } catch (error) {
            console.error('Error adding financial report:', error);
            throw error;
        }
    }

    async checkForNewFinancials() {
        const companies = await this.getTrackedCompanies();

        for (const company of companies) {
            try {
                // Check for new financial announcements
                const newFinancials = await this.fetchLatestFinancials(company.ticker);

                if (newFinancials && this.isNewFinancials(newFinancials, company.last_financial_date)) {
                    await this.addFinancialReport(company.ticker, newFinancials);
                    await this.createAlert(company.id, 'new_financials', `New financial report available for ${company.ticker}`);
                }
            } catch (error) {
                console.error(`Error checking financials for ${company.ticker}:`, error);
            }
        }
    }

    async fetchLatestFinancials(ticker) {
        // This would use the Fetch MCP server to get data from financial APIs
        // For now, return mock data structure
        return null;
    }

    isNewFinancials(financialData, lastFinancialDate) {
        if (!lastFinancialDate) return true;
        return new Date(financialData.reportDate) > new Date(lastFinancialDate);
    }

    async createAlert(ticker, type, message, severity = 'medium') {
        try {
            const alert = {
                id: `${ticker}-${Date.now()}`,
                ticker: ticker.toUpperCase(),
                alertType: type,
                message,
                severity,
                isRead: false
            };

            await this.aws.putItem('alerts', alert);

            // Publish SNS notification for high severity alerts
            if (severity === 'high') {
                await this.aws.publishAlert({
                    ticker,
                    type,
                    message,
                    severity,
                    timestamp: new Date().toISOString()
                }, `High Priority Alert: ${ticker}`);
            }

            // Publish event
            await this.aws.publishEvent('AlertCreated', {
                ticker,
                type,
                message,
                severity
            });

            return { status: 'created', type, message };
        } catch (error) {
            console.error('Error creating alert:', error);
            throw error;
        }
    }

    async getAlerts(unreadOnly = false) {
        try {
            let alerts = await this.aws.scanTable('alerts');

            if (unreadOnly) {
                alerts = alerts.filter(alert => !alert.isRead);
            }

            // Sort by creation date (most recent first)
            const sortedAlerts = alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return sortedAlerts;
        } catch (error) {
            console.error('Error getting alerts:', error);
            return [];
        }
    }

    async markAlertAsRead(alertId) {
        try {
            await this.aws.updateItem('alerts', 
                { id: alertId }, 
                { 
                    isRead: true,
                    readAt: new Date().toISOString()
                }
            );
            return { status: 'success' };
        } catch (error) {
            console.error('Error marking alert as read:', error);
            throw error;
        }
    }

  async deleteCompany(ticker) {
    try {
      const upperTicker = ticker.toUpperCase();
      
      // Delete company from companies table
      await this.aws.deleteItem('companies', { ticker: upperTicker });
      
      // Delete all financials for this company
      const financials = await this.aws.queryItems('financials', {
        expression: 'ticker = :ticker',
        values: { ':ticker': upperTicker }
      });
      
      for (const financial of financials) {
        await this.aws.deleteItem('financials', {
          ticker: upperTicker,
          'quarter-year': financial['quarter-year']
        });
      }
      
      // Delete all alerts for this company
      const alerts = await this.aws.queryItems('alerts', {
        expression: 'ticker = :ticker',
        values: { ':ticker': upperTicker }
      }, 'TickerIndex');
      
      for (const alert of alerts) {
        await this.aws.deleteItem('alerts', { id: alert.id });
      }
      
      // Delete all analyses for this company
      const analyses = await this.aws.queryItems('analyses', {
        expression: 'ticker = :ticker',
        values: { ':ticker': upperTicker }
      }, 'TickerIndex');
      
      for (const analysis of analyses) {
        await this.aws.deleteItem('analyses', { id: analysis.id });
      }
      
      // Publish event
      await this.aws.publishEvent('CompanyDeleted', {
        ticker: upperTicker,
        deletedAt: new Date().toISOString()
      });
      
      // Log the action
      await this.aws.logEvent({ action: 'deleteCompany', ticker: upperTicker });
      
      return { 
        status: 'deleted', 
        ticker: upperTicker,
        message: `Company ${upperTicker} and all related data deleted successfully`
      };
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }
}

module.exports = AdvisorAssistant;