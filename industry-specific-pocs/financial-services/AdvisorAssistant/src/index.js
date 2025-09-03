/**
 * Advisor Assistant POC - Main Application Server
 * 
 * AI-powered financial analysis system with AWS Cognito authentication
 * and real-time financial data processing using Claude 3.5 Sonnet.
 * 
 * Features:
 * - Multi-user authentication with AWS Cognito
 * - AI-powered financial analysis using AWS Bedrock
 * - Enhanced financial data from multiple providers
 * - Automated alert system with SNS notifications
 * - Secure data storage with DynamoDB and S3
 * - RESTful API with comprehensive error handling
 * 
 * @author Advisor Assistant Team
 * @version 1.0.0
 */

// Core dependencies
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
const session = require('express-session');
const DynamoDBStore = require('connect-dynamodb')(session);
require('dotenv').config();

// Application services
const AdvisorAssistant = require('./services/advisorAssistant');
const { DataProviderFactory } = require('./services/dataProviderFactory');
const EnhancedAIAnalyzer = require('./services/enhancedAiAnalyzer');
const AWSServices = require('./services/awsServices');
const CognitoAuth = require('./services/cognitoAuth');
const UserConfigService = require('./services/userConfig');

// Express application setup
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * MIDDLEWARE CONFIGURATION
 * Configure Express middleware for CORS, JSON parsing, and static files
 */
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies
app.use(express.static('public')); // Serve static files from public directory

/**
 * SESSION MANAGEMENT
 * Configure DynamoDB-backed sessions for multi-user support
 * Sessions are encrypted and stored in DynamoDB for scalability
 */
app.use(session({
  store: new DynamoDBStore({
    table: `${process.env.DYNAMODB_TABLE_PREFIX || 'advisor-assistant'}-sessions`,
    AWSConfigJSON: {
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  }),
  secret: process.env.SESSION_SECRET || 'change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

/**
 * SERVICE INITIALIZATION
 * Initialize all application services with proper dependency injection
 */
const aws = new AWSServices(); // AWS SDK wrapper for all AWS services
const assistant = new AdvisorAssistant(); // Core advisor assistant functionality
const fetcher = DataProviderFactory.createProvider(); // Smart data provider
const analyzer = new EnhancedAIAnalyzer(); // AI-powered financial analysis with Claude

// AI cache is always enabled for optimal performance
console.log('💾 AI cache enabled for optimal performance');
const cognitoAuth = new CognitoAuth(); // AWS Cognito authentication service
const userConfig = new UserConfigService(); // User configuration and preferences

/**
 * APPLICATION STARTUP LOGGING
 * Log application startup to CloudWatch for monitoring
 */
aws.logEvent({ message: 'Advisor Assistant starting up', environment: process.env.NODE_ENV });

// SQS Message Processing
const processSQSMessages = async () => {
  try {
    const messages = await aws.receiveMessages(5, 10);
    
    for (const message of messages) {
      const body = JSON.parse(message.Body);
      
      if (body.action === 'analyzeFinancials') {
        try {
          await analyzer.analyzeEarningsReport(body.ticker, body.financialData);
        } catch (error) {
          console.log(`⚠️  SQS analysis failed for ${body.ticker}: ${error.message}`);
        }
      }
      
      // Delete processed message
      // In production, you'd delete the message from SQS here
    }
  } catch (error) {
    console.error('SQS processing error:', error);
    await aws.logEvent({ error: error.message, context: 'SQS processing' }, 'ERROR');
  }
};

// Start SQS polling
setInterval(processSQSMessages, 30000); // Poll every 30 seconds

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const result = await cognitoAuth.authenticateUser(username, password);
    
    if (result.success) {
      req.session.user = result.user;
      req.session.accessToken = result.tokens.AccessToken;
      req.session.idToken = result.tokens.IdToken; // Store ID token for user profile
      req.session.refreshToken = result.tokens.RefreshToken;
      
      console.log('✅ Login successful - stored tokens:', {
        hasAccessToken: !!result.tokens.AccessToken,
        hasIdToken: !!result.tokens.IdToken,
        hasRefreshToken: !!result.tokens.RefreshToken
      });
      
      res.json({
        success: true,
        user: result.user,
        message: 'Login successful'
      });
    } else {
      res.status(401).json({
        success: false,
        error: result.error || 'Authentication failed',
        challengeName: result.challengeName
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

app.get('/api/auth/me', cognitoAuth.requireAuth(), async (req, res) => {
  try {
    // Try to get email from multiple sources
    const emailFromToken = req.user.email;
    const emailFromSession = req.session?.user?.email;
    const usernameFromToken = req.user.username;
    const usernameFromSession = req.session?.user?.username;
    
    // Start with token data (which should have email from our fixes)
    let userDetails = {
      success: true,
      user: {
        username: emailFromToken || emailFromSession || usernameFromToken || usernameFromSession,
        email: emailFromToken || emailFromSession,
        sub: req.user.sub,
        groups: req.user.groups || [],
        attributes: req.user.attributes || {},
        userStatus: 'CONFIRMED',
        enabled: true,
        displayName: emailFromToken || emailFromSession || usernameFromToken || usernameFromSession
      }
    };
    
    // Try to enhance with Cognito user details if available
    if (req.user && req.user.sub && req.user.sub !== 'unknown') {
      try {
        const { ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');
        const users = await cognitoAuth.client.send(new ListUsersCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
          Filter: `sub = "${req.user.sub}"`
        }));
        
        if (users.Users && users.Users.length > 0) {
          const user = users.Users[0];
          const userAttributes = {};
          if (user.UserAttributes && Array.isArray(user.UserAttributes)) {
            user.UserAttributes.forEach(attr => {
              userAttributes[attr.Name] = attr.Value;
            });
          }
          
          // Enhance user details with Cognito data, but keep token email if Cognito email is missing
          userDetails.user = {
            ...userDetails.user,
            username: userAttributes.email || req.user.email || user.Username,
            userStatus: user.UserStatus,
            enabled: user.Enabled,
            attributes: {
              ...req.user.attributes,
              ...userAttributes
            },
            email: userAttributes.email || req.user.email,
            email_verified: userAttributes.email_verified || 'true'
          };
        }
      } catch (error) {
        // Silently continue with token data if Cognito lookup fails
      }
    }
    
    const config = await userConfig.getUserConfig(req.user?.sub || 'anonymous');
    
    res.json({
      user: userDetails.user,
      config: config.success ? config.config : null
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/urls', (req, res) => {
  const urls = cognitoAuth.getAuthUrls();
  res.json(urls);
});

app.post('/api/auth/challenge', async (req, res) => {
  try {
    const { challengeName, session, challengeResponses } = req.body;
    
    if (challengeName === 'NEW_PASSWORD_REQUIRED') {
      // Set permanent password using admin function
      const username = challengeResponses.USERNAME;
      const newPassword = challengeResponses.NEW_PASSWORD;
      
      const passwordResult = await cognitoAuth.setUserPassword(username, newPassword);
      
      if (passwordResult.success) {
        // Now try to authenticate with the new password
        const authResult = await cognitoAuth.authenticateUser(username, newPassword);
        
        if (authResult.success) {
          req.session.user = authResult.user;
          req.session.accessToken = authResult.tokens.AccessToken;
          req.session.refreshToken = authResult.tokens.RefreshToken;
          
          res.json({
            success: true,
            user: authResult.user,
            message: 'Password updated and login successful'
          });
        } else {
          res.status(401).json({
            success: false,
            error: 'Authentication failed after password reset'
          });
        }
      } else {
        res.status(400).json({
          success: false,
          error: passwordResult.error || 'Failed to set password'
        });
      }
    } else {
      // Handle other challenges normally
      const result = await cognitoAuth.respondToAuthChallenge(challengeName, session, challengeResponses);
      
      if (result.success) {
        req.session.user = result.user;
        req.session.accessToken = result.tokens.AccessToken;
        req.session.refreshToken = result.tokens.RefreshToken;
        
        res.json({
          success: true,
          user: result.user,
          message: 'Challenge completed successfully'
        });
      } else {
        res.status(401).json({
          success: false,
          error: result.error || 'Challenge response failed',
          challengeName: result.challengeName
        });
      }
    }
  } catch (error) {
    console.error('Challenge response error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin Routes
app.post('/api/admin/users', cognitoAuth.requireAuth(), cognitoAuth.requireAdmin(), async (req, res) => {
  try {
    const { username, email, temporaryPassword, userAttributes, isAdmin } = req.body;
    
    // Use email as username if username not provided
    const actualUsername = username || email;
    
    if (!actualUsername || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }
    
    // Generate temporary password if not provided
    const tempPassword = temporaryPassword || generateTemporaryPassword();
    
    // Set up user attributes (don't include groups here)
    const attrs = userAttributes || {};
    
    const result = await cognitoAuth.createUser(actualUsername, email, tempPassword, attrs);
    
    if (result.success) {
      // Initialize user configuration
      await userConfig.getUserConfig(result.user.Username);
      
      // Add to admin group if requested
      let adminGroupAdded = false;
      if (isAdmin) {
        try {
          await cognitoAuth.addUserToGroup(result.user.Username, 'admin');
          console.log(`✅ Added user ${result.user.Username} to admin group`);
          adminGroupAdded = true;
        } catch (groupError) {
          console.warn(`⚠️  Could not add user to admin group: ${groupError.message}`);
        }
      }
      
      // Return formatted response for frontend
      res.json({
        success: true,
        message: 'User created successfully',
        email: email,
        username: actualUsername,
        isAdmin: isAdmin && adminGroupAdded,
        temporaryPassword: tempPassword,
        note: `User ${email} has been created and will need to set a permanent password on first login.`,
        instructions: `Share the temporary password securely with the user. They can login at the application URL.`
      });
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to generate temporary password
function generateTemporaryPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

app.get('/api/admin/users', cognitoAuth.requireAuth(), cognitoAuth.requireAdmin(), async (req, res) => {
  try {
    const result = await cognitoAuth.listUsers(50);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Settings Routes
app.get('/api/admin/settings', cognitoAuth.requireAuth(), cognitoAuth.requireAdmin(), async (req, res) => {
  try {
    // Get current system settings from environment variables and defaults
    const settings = {
      currentModel: process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      environment: process.env.NODE_ENV || 'development',
      dataProvider: process.env.DATA_PROVIDER || 'enhanced_multi_provider',
      rateLimits: {
        auth: {
          max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 10,
          windowMs: 60000 // 1 minute in milliseconds
        },
        api: {
          max: parseInt(process.env.RATE_LIMIT_API_MAX) || 1000,
          windowMs: 60000 // 1 minute in milliseconds
        },
        ai: {
          max: parseInt(process.env.RATE_LIMIT_AI_MAX) || 50,
          windowMs: 60000 // 1 minute in milliseconds
        }
      },
      region: process.env.AWS_REGION || 'us-east-1',
      availableProviders: ['enhanced_multi_provider', 'yahoo', 'newsapi', 'fred']
    };
    
    res.json({ settings });
  } catch (error) {
    console.error('Error loading admin settings:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/settings', cognitoAuth.requireAuth(), cognitoAuth.requireAdmin(), async (req, res) => {
  try {
    const { currentModel, rateLimits, dataProvider } = req.body;
    
    // For now, we'll just validate and return success
    // In a production system, these would update environment variables or configuration store
    const updatedSettings = {
      currentModel: currentModel || process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      environment: process.env.NODE_ENV || 'development',
      dataProvider: dataProvider || process.env.DATA_PROVIDER || 'enhanced_multi_provider',
      rateLimits: {
        auth: {
          max: rateLimits?.auth?.max || parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 10,
          windowMs: rateLimits?.auth?.windowMs || 60000
        },
        api: {
          max: rateLimits?.api?.max || parseInt(process.env.RATE_LIMIT_API_MAX) || 1000,
          windowMs: rateLimits?.api?.windowMs || 60000
        },
        ai: {
          max: rateLimits?.ai?.max || parseInt(process.env.RATE_LIMIT_AI_MAX) || 50,
          windowMs: rateLimits?.ai?.windowMs || 60000
        }
      },
      timestamp: new Date().toISOString(),
      updatedBy: req.user.email || req.user.username
    };
    
    // Log the settings change for audit purposes
    console.log(`⚙️  Admin settings updated by ${req.user.email || req.user.username}:`, updatedSettings);
    await aws.logEvent({
      action: 'admin_settings_update',
      user: req.user.email || req.user.username,
      settings: updatedSettings
    });
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error saving admin settings:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/available-models', cognitoAuth.requireAuth(), cognitoAuth.requireAdmin(), async (req, res) => {
  try {
    // Available Claude models in AWS Bedrock
    const models = [
      {
        id: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        name: 'Claude 3.5 Sonnet v2',
        description: 'Most capable model for complex reasoning, analysis, and coding. Best for financial analysis and detailed reports.',
        capabilities: ['reasoning', 'analysis', 'coding', 'writing'],
        contextWindow: '200K tokens',
        recommended: true
      },
      {
        id: 'us.anthropic.claude-3-5-sonnet-20240620-v1:0',
        name: 'Claude 3.5 Sonnet v1',
        description: 'Previous version of Claude 3.5 Sonnet. Still very capable for most tasks.',
        capabilities: ['reasoning', 'analysis', 'coding', 'writing'],
        contextWindow: '200K tokens',
        recommended: false
      },
      {
        id: 'us.anthropic.claude-3-haiku-20240307-v1:0',
        name: 'Claude 3 Haiku',
        description: 'Fastest and most cost-effective model. Good for simple analysis and quick responses.',
        capabilities: ['reasoning', 'analysis', 'writing'],
        contextWindow: '200K tokens',
        recommended: false
      },
      {
        id: 'us.anthropic.claude-3-opus-20240229-v1:0',
        name: 'Claude 3 Opus',
        description: 'Most powerful model for complex tasks requiring deep reasoning. Higher cost but best quality.',
        capabilities: ['reasoning', 'analysis', 'coding', 'writing', 'research'],
        contextWindow: '200K tokens',
        recommended: false
      }
    ];
    
    res.json({ 
      models,
      currentModel: process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      region: process.env.AWS_REGION || 'us-east-1'
    });
  } catch (error) {
    console.error('Error loading available models:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/settings/model', cognitoAuth.requireAuth(), cognitoAuth.requireAdmin(), async (req, res) => {
  try {
    const { modelId } = req.body;
    
    if (!modelId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Model ID is required' 
      });
    }
    
    // Validate the model ID is in our supported list
    const supportedModels = [
      'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      'us.anthropic.claude-3-5-sonnet-20240620-v1:0',
      'us.anthropic.claude-3-haiku-20240307-v1:0',
      'us.anthropic.claude-3-opus-20240229-v1:0'
    ];
    
    if (!supportedModels.includes(modelId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Unsupported model ID' 
      });
    }
    
    // In a production system, this would update the environment variable
    // For now, we'll just log the change and clear the AI cache
    console.log(`🤖 Admin model switch requested by ${req.user.email || req.user.username}: ${modelId}`);
    
    // Clear AI analysis cache since we're switching models
    if (analyzer && analyzer.clearCache) {
      analyzer.clearCache();
      console.log('🧹 AI analysis cache cleared due to model switch');
    }
    
    // Log the model change for audit purposes
    await aws.logEvent({
      action: 'admin_model_switch',
      user: req.user.email || req.user.username,
      oldModel: process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      newModel: modelId,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: `Model switched to ${modelId}. Note: This is a simulation - in production this would update the environment configuration.`,
      currentModel: modelId,
      cacheCleared: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error switching model:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// User Configuration Routes
app.get('/api/user/config', cognitoAuth.requireAuth(), async (req, res) => {
  try {
    const result = await userConfig.getUserConfig(req.user.sub);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/user/config', cognitoAuth.requireAuth(), async (req, res) => {
  try {
    const result = await userConfig.saveUserConfig(req.user.sub, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/user/watchlist', cognitoAuth.requireAuth(), async (req, res) => {
  try {
    const { ticker, companyName } = req.body;
    const result = await userConfig.addToWatchlist(req.user.sub, ticker, companyName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/user/watchlist/:ticker', cognitoAuth.requireAuth(), async (req, res) => {
  try {
    const { ticker } = req.params;
    const result = await userConfig.removeFromWatchlist(req.user.sub, ticker);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/watchlist', cognitoAuth.requireAuth(), async (req, res) => {
  try {
    const result = await userConfig.getUserWatchlist(req.user.sub);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/alerts', cognitoAuth.requireAuth(), async (req, res) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const result = await userConfig.getUserAlerts(req.user.sub, unreadOnly);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Protected Routes (require authentication)
app.get('/api/companies', cognitoAuth.requireAuth(), async (req, res) => {
  try {
    const companies = await assistant.getTrackedCompanies();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/companies', cognitoAuth.requireAuth(), async (req, res) => {
  try {
    const { ticker, name } = req.body;
    const company = await assistant.addCompany(ticker, name);
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/companies/:ticker', cognitoAuth.requireAuth(), async (req, res) => {
  try {
    const { ticker } = req.params;
    const result = await assistant.deleteCompany(ticker);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/financials/:ticker', cognitoAuth.requireAuth(), async (req, res) => {
  try {
    const { ticker } = req.params;
    const financials = await assistant.getFinancialHistory(ticker);
    res.json(financials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analysis/:ticker', cognitoAuth.requireAuth(), async (req, res) => {
  try {
    const { ticker } = req.params;
    const analysis = await analyzer.getLatestAnalysis(ticker);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reports endpoint - returns financial reports for a ticker (used by rerun AI functionality)
app.get('/api/reports/:ticker', cognitoAuth.requireAuth(), async (req, res) => {
  try {
    const { ticker } = req.params;
    const financials = await assistant.getFinancialHistory(ticker);
    
    // Transform the data to match what the frontend expects
    const reports = financials.map(financial => ({
      quarter: financial.quarter,
      year: financial.year,
      revenue: financial.revenue,
      netIncome: financial.netIncome,
      eps: financial.eps,
      reportDate: financial.reportDate || financial.timestamp
    }));
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: error.message });
  }
});

// New endpoint to fetch and analyze financial data with enhanced timeout handling
app.post('/api/fetch-financials/:ticker', cognitoAuth.requireAuth(), async (req, res) => {
  console.log(`🚀 FETCH FINANCIALS ENDPOINT HIT - Ticker: ${req.params.ticker}`);
  console.log(`🚀 Request method: ${req.method}`);
  console.log(`🚀 Request URL: ${req.url}`);
  console.log(`🚀 User authenticated: ${!!req.user}`);
  
  try {
    const { ticker } = req.params;
    const { forceAnalysis } = req.query; // Option to force fresh analysis
    console.log(`Starting financial data fetch for ${ticker} (force analysis: ${forceAnalysis === 'true'})`);
    
    // Fetch financial data from configured provider
    console.log(`📊 Fetching financial data for ${ticker} from ${process.env.DATA_PROVIDER || 'enhanced_multi_provider'}...`);
    const financialData = await fetcher.getFinancialData(ticker);
    
    console.log(`📊 Data provider returned ${financialData.length} financial reports for ${ticker}`);
    
    if (financialData.length === 0) {
      console.log(`⚠️  No financial data found for ${ticker} - this could be:`);
      console.log(`   - Invalid ticker symbol`);
      console.log(`   - API rate limiting or quota exceeded`);
      console.log(`   - Company doesn't report quarterly financials`);
      console.log(`   - Data provider: ${process.env.DATA_PROVIDER || 'enhanced_multi_provider'}`);
      
      // Try to get company info to verify ticker is valid
      try {
        const companyInfo = await fetcher.getCompanyInfo(ticker);
        if (companyInfo && companyInfo.name) {
          return res.status(503).json({ 
            error: 'API rate limit or quota exceeded',
            ticker: ticker,
            companyName: companyInfo.name,
            dataProvider: process.env.DATA_PROVIDER || 'enhanced_multi_provider',
            suggestion: 'The ticker symbol is valid but the API is rate limited. Please try again in a few minutes.'
          });
        }
      } catch (companyError) {
        console.log(`Could not verify company info: ${companyError.message}`);
      }
      
      return res.status(404).json({ 
        error: 'No financial data found for this ticker',
        ticker: ticker,
        suggestion: 'Please verify the ticker symbol is correct (e.g., AAPL, MSFT, GOOGL) or try again later if API is rate limited'
      });
    }
    
    console.log(`Found ${financialData.length} financial reports for ${ticker}`);
    
    // Store financial reports first (fast operation)
    let newReportsCount = 0;
    const financialsToAnalyze = [];
    
    for (const financial of financialData) {
      const result = await assistant.addFinancialReport(ticker, financial);
      
      if (result.status === 'added') {
        newReportsCount++;
      }
      
      // Check if analysis exists (skip if forcing fresh analysis)
      const cacheKey = `${ticker}-${financial.quarter}-${financial.year}`;
      if (forceAnalysis === 'true') {
        console.log(`🔄 Forcing fresh analysis for ${ticker} ${financial.quarter} ${financial.year}`);
        financialsToAnalyze.push(financial);
      } else {
        try {
          const existingAnalysis = await analyzer.aws.getItem('analyses', {
            id: cacheKey
          });
          
          if (!existingAnalysis || !existingAnalysis.analysis) {
            financialsToAnalyze.push(financial);
          }
        } catch (error) {
          console.log(`Could not check existing analysis for ${ticker} ${financial.quarter} ${financial.year}, will analyze`);
          financialsToAnalyze.push(financial);
        }
      }
    }
    
    // Respond immediately with financial data
    res.json({
      message: `Fetched ${financialData.length} financial reports for ${ticker}, ${newReportsCount} new reports added`,
      totalFinancialCount: financialData.length,
      newReportsCount: newReportsCount,
      analysesToGenerate: financialsToAnalyze.length,
      status: financialsToAnalyze.length > 0 ? 'analyzing' : 'complete',
      forceAnalysis: forceAnalysis === 'true',
      estimatedTime: `${financialsToAnalyze.length * 5} minutes (up to 30 min per analysis due to throttling)`
    });
    
    // Process analysis asynchronously (don't wait for response)
    if (financialsToAnalyze.length > 0) {
      console.log(`🚀 Starting async analysis of ${financialsToAnalyze.length} financial reports for ${ticker}`);
      console.log(`⏰ Estimated completion time: ${financialsToAnalyze.length * 5} minutes (may take longer due to throttling)`);
      
      // Process analysis in background
      setImmediate(async () => {
        let analysisCount = 0;
        const startTime = Date.now();
        
        for (const financial of financialsToAnalyze) {
          try {
            const analysisStart = Date.now();
            console.log(`🔍 Analyzing ${ticker} ${financial.quarter} ${financial.year} (${analysisCount + 1}/${financialsToAnalyze.length})`);
            
            await analyzer.analyzeEarningsReport(ticker, financial);
            
            analysisCount++;
            const analysisTime = ((Date.now() - analysisStart) / 1000 / 60).toFixed(1);
            const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
            
            console.log(`✅ Completed analysis ${analysisCount}/${financialsToAnalyze.length} for ${ticker} in ${analysisTime}min (total: ${totalTime}min)`);
          } catch (error) {
            console.error(`❌ Failed to analyze ${ticker} ${financial.quarter} ${financial.year}:`, error.message);
          }
        }
        
        const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
        console.log(`🏁 Completed all ${analysisCount}/${financialsToAnalyze.length} analyses for ${ticker} in ${totalTime} minutes`);
      });
    }
    
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get company info and update database
app.post('/api/update-company/:ticker', cognitoAuth.requireAuth(), async (req, res) => {
  try {
    const { ticker } = req.params;
    
    // Fetch company info from configured provider
    const companyInfo = await fetcher.getCompanyInfo(ticker);
    
    if (!companyInfo) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Update company in database
    await assistant.addCompany(ticker, companyInfo.name);
    
    res.json(companyInfo);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enhanced endpoint to check analysis status with AI analyzer info
app.get('/api/analysis-status/:ticker', cognitoAuth.requireAuth(), async (req, res) => {
  try {
    const { ticker } = req.params;
    
    // Get all financials for this ticker
    const financials = await assistant.getFinancialHistory(ticker);
    
    // Check which ones have analysis
    const analysisStatus = [];
    
    for (const financial of financials) {
      const cacheKey = `${ticker}-${financial.quarter}-${financial.year}`;
      try {
        const existingAnalysis = await analyzer.aws.getItem('analyses', {
          id: cacheKey
        });
        
        analysisStatus.push({
          quarter: financial.quarter,
          year: financial.year,
          hasAnalysis: !!(existingAnalysis && existingAnalysis.analysis),
          reportDate: financial.reportDate,
          analysisType: existingAnalysis?.analysis?.summary?.includes('[FALLBACK ANALYSIS') ? 'fallback' : 'ai'
        });
      } catch (error) {
        analysisStatus.push({
          quarter: financial.quarter,
          year: financial.year,
          hasAnalysis: false,
          reportDate: financial.reportDate,
          analysisType: null
        });
      }
    }
    
    const totalReports = analysisStatus.length;
    const completedAnalyses = analysisStatus.filter(s => s.hasAnalysis).length;
    const aiAnalyses = analysisStatus.filter(s => s.analysisType === 'ai').length;
    const fallbackAnalyses = analysisStatus.filter(s => s.analysisType === 'fallback').length;
    
    res.json({
      ticker,
      totalReports,
      completedAnalyses,
      aiAnalyses,
      fallbackAnalyses,
      pendingAnalyses: totalReports - completedAnalyses,
      status: completedAnalyses === totalReports ? 'complete' : 'pending',
      reports: analysisStatus,
      analyzerStatus: analyzer.getAnalysisStatus()
    });
    
  } catch (error) {
    console.error('Error checking analysis status:', error);
    res.status(500).json({ error: error.message });
  }
});

// New endpoint to get AI analyzer status
app.get('/api/ai-status', cognitoAuth.requireAuth(), async (req, res) => {
  try {
    const status = analyzer.getAnalysisStatus();
    res.json({
      ...status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting AI status:', error);
    res.status(500).json({ error: error.message });
  }
});


// Debug endpoint to test current data provider
app.get('/api/test-data-provider/:ticker', cognitoAuth.requireAuth(), async (req, res) => {
  try {
    const { ticker } = req.params;
    const provider = process.env.DATA_PROVIDER || 'enhanced_multi_provider';
    console.log(`🔍 Testing ${provider} data provider for ${ticker}...`);
    
    const startTime = Date.now();
    const [earningsData, companyInfo, stockPrice, marketNews] = await Promise.allSettled([
      fetcher.getEarningsData(ticker),
      fetcher.getCompanyInfo(ticker),
      fetcher.getStockPrice(ticker),
      fetcher.getMarketNews(ticker)
    ]);
    const endTime = Date.now();
    
    const response = {
      ticker: ticker,
      provider: provider,
      responseTime: `${endTime - startTime}ms`,
      timestamp: new Date().toISOString(),
      results: {
        earnings: {
          status: earningsData.status,
          count: earningsData.status === 'fulfilled' ? earningsData.value?.length || 0 : 0,
          error: earningsData.status === 'rejected' ? earningsData.reason?.message : null,
          sample: earningsData.status === 'fulfilled' ? earningsData.value?.slice(0, 2) : null
        },
        companyInfo: {
          status: companyInfo.status,
          hasData: companyInfo.status === 'fulfilled' && !!companyInfo.value,
          error: companyInfo.status === 'rejected' ? companyInfo.reason?.message : null,
          sample: companyInfo.status === 'fulfilled' && companyInfo.value ? {
            name: companyInfo.value.name,
            sector: companyInfo.value.sector,
            marketCap: companyInfo.value.marketCap
          } : null
        },
        stockPrice: {
          status: stockPrice.status,
          hasData: stockPrice.status === 'fulfilled' && !!stockPrice.value,
          error: stockPrice.status === 'rejected' ? stockPrice.reason?.message : null,
          sample: stockPrice.status === 'fulfilled' && stockPrice.value ? {
            price: stockPrice.value.price,
            change: stockPrice.value.change,
            changePercent: stockPrice.value.changePercent
          } : null
        },
        news: {
          status: marketNews.status,
          count: marketNews.status === 'fulfilled' ? marketNews.value?.length || 0 : 0,
          error: marketNews.status === 'rejected' ? marketNews.reason?.message : null
        }
      }
    };
    
    // Add provider-specific stats if available
    if (fetcher.getProviderStats) {
      response.providerStats = fetcher.getProviderStats();
    }
    
    res.json(response);
  } catch (error) {
    console.error('Data provider test error:', error);
    res.status(500).json({ 
      error: error.message,
      ticker: req.params.ticker,
      provider: process.env.DATA_PROVIDER || 'enhanced_multi_provider'
    });
  }
});


// New endpoint to rerun AI analysis for a specific company
app.post('/api/rerun-analysis/:ticker', cognitoAuth.requireAuth(), async (req, res) => {
  try {
    const { ticker } = req.params;
    const { quarter, year } = req.body;
    
    if (!quarter || !year) {
      return res.status(400).json({ error: 'Quarter and year are required' });
    }
    
    console.log(`🔄 Rerunning AI analysis for ${ticker} ${quarter} ${year}`);
    
    // Get the financial data for this specific quarter/year
    const financials = await assistant.getFinancialHistory(ticker);
    const targetFinancial = financials.find(f => f.quarter === quarter && f.year === parseInt(year));
    
    if (!targetFinancial) {
      return res.status(404).json({ error: `No financial data found for ${ticker} ${quarter} ${year}` });
    }
    
    // Clear any existing cache for this analysis
    const cacheKey = `${ticker}-${quarter}-${year}`;
    analyzer.analysisCache.delete(cacheKey);
    
    // Delete existing analysis from database to force fresh analysis
    try {
      await analyzer.aws.deleteItem('analyses', { id: cacheKey });
      console.log(`🗑️  Deleted existing analysis for ${ticker} ${quarter} ${year}`);
    } catch (deleteError) {
      console.log(`⚠️  Could not delete existing analysis: ${deleteError.message}`);
    }
    
    // Respond immediately and start analysis in background
    res.json({
      message: `Rerunning AI analysis for ${ticker} ${quarter} ${year}`,
      status: 'started',
      estimatedTime: '5-30 minutes depending on AI service availability'
    });
    
    // Run analysis in background
    setImmediate(async () => {
      try {
        console.log(`🚀 Starting fresh AI analysis for ${ticker} ${quarter} ${year}`);
        await analyzer.analyzeEarningsReport(ticker, targetFinancial);
        console.log(`✅ Completed rerun analysis for ${ticker} ${quarter} ${year}`);
      } catch (error) {
        console.error(`❌ Failed to rerun analysis for ${ticker} ${quarter} ${year}:`, error.message);
      }
    });
    
  } catch (error) {
    console.error('Error rerunning analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear AI cache endpoint (cache remains enabled)
app.post('/api/ai-cache/clear', cognitoAuth.requireAuth(), async (req, res) => {
  try {
    analyzer.clearCache();
    res.json({ message: 'AI cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing AI cache:', error);
    res.status(500).json({ error: error.message });
  }
});

// Data provider status and configuration endpoints
app.get('/api/data-provider/status', cognitoAuth.requireAuth(), async (req, res) => {
  try {
    const { DataProviderFactory } = require('./services/dataProviderFactory');
    const currentProvider = process.env.DATA_PROVIDER || 'enhanced_multi_provider';
    const validation = DataProviderFactory.validateProvider(currentProvider);
    const availableProviders = DataProviderFactory.getAvailableProviders();
    
    const status = {
      currentProvider: currentProvider,
      validation: validation,
      availableProviders: availableProviders,
      apiKeys: {
        newsapi: !!process.env.NEWSAPI_KEY,
        fred: !!process.env.FRED_API_KEY
      },
      timestamp: new Date().toISOString()
    };
    
    // Add provider stats if available
    if (fetcher.getProviderStats) {
      status.providerStats = fetcher.getProviderStats();
    }
    
    res.json(status);
  } catch (error) {
    console.error('Error getting provider status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test what data is actually being sent to AI (no auth required)
app.get('/api/test-ai-prompt/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    console.log(`🔍 Testing AI prompt data for ${ticker}`);
    
    // Get the same data the AI analyzer uses
    const comprehensiveData = await analyzer.gatherComprehensiveData(ticker);
    const historicalFinancials = await analyzer.getHistoricalFinancialsSafe(ticker);
    const financialData = await fetcher.getFinancialData(ticker);
    
    // Get a sample financial report for prompt building
    const sampleFinancial = financialData[0];
    
    let promptPreview = '';
    if (sampleFinancial) {
      // Build the same prompt the AI gets (truncated for display)
      promptPreview = `COMPREHENSIVE WEALTH ADVISOR ANALYSIS REQUEST

COMPANY: ${ticker}
QUARTER: ${sampleEarning.quarter} ${sampleEarning.year}

=== EARNINGS PERFORMANCE ===
EPS: ${sampleEarning.eps || 'N/A'}
Revenue: ${sampleEarning.revenue ? (sampleEarning.revenue / 1000000000).toFixed(1) + 'B' : 'N/A'}
`;
      
      // Add enhanced data sections if available
      if (comprehensiveData.insiderTrading && comprehensiveData.insiderTrading.length > 0) {
        promptPreview += `\n=== INSIDER TRADING ACTIVITY ===\n`;
        comprehensiveData.insiderTrading.slice(0, 2).forEach((trade, index) => {
          promptPreview += `${index + 1}. ${trade.reportingName || 'Executive'}: ${trade.transactionType || 'Trade'} on ${trade.transactionDate}\n`;
        });
      }
      
      if (comprehensiveData.institutionalHoldings && comprehensiveData.institutionalHoldings.length > 0) {
        promptPreview += `\n=== INSTITUTIONAL HOLDINGS ===\n`;
        comprehensiveData.institutionalHoldings.slice(0, 2).forEach((holder, index) => {
          promptPreview += `${index + 1}. ${holder.holder}: ${holder.shares ? parseInt(holder.shares).toLocaleString() : 'N/A'} shares\n`;
        });
      }
    }
    
    const testResults = {
      ticker: ticker,
      timestamp: new Date().toISOString(),
      provider: process.env.DATA_PROVIDER || 'enhanced_multi_provider',
      dataQuality: {
        financialReports: financialData?.length || 0,
        companyInfo: !!comprehensiveData.companyInfo,
        insiderTrading: comprehensiveData.insiderTrading?.length || 0,
        institutionalHoldings: comprehensiveData.institutionalHoldings?.length || 0,
        analystEstimates: !!comprehensiveData.analystEstimates,
        marketNews: comprehensiveData.marketNews?.length || 0
      },
      sampleInsiderData: comprehensiveData.insiderTrading?.slice(0, 3) || [],
      sampleInstitutionalData: comprehensiveData.institutionalHoldings?.slice(0, 3) || [],
      promptPreview: promptPreview,
      issues: []
    };
    
    // Identify issues
    if (!comprehensiveData.insiderTrading || comprehensiveData.insiderTrading.length === 0) {
      testResults.issues.push('No insider trading data available');
    }
    if (!comprehensiveData.institutionalHoldings || comprehensiveData.institutionalHoldings.length === 0) {
      testResults.issues.push('No institutional holdings data available');
    }
    if (!comprehensiveData.analystEstimates) {
      testResults.issues.push('No analyst estimates available');
    }
    
    res.json(testResults);
  } catch (error) {
    console.error('AI prompt test error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Simple test endpoint to show enhanced data (no auth required for testing)
app.get('/api/test-enhanced/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    console.log(`🔍 Testing enhanced data for ${ticker}`);
    
    // Test what the current provider can fetch
    const testResults = {
      ticker: ticker,
      timestamp: new Date().toISOString(),
      provider: process.env.DATA_PROVIDER || 'enhanced_multi_provider',
      tests: {}
    };
    
    // Test basic data
    try {
      const earnings = await fetcher.getEarningsData(ticker);
      testResults.tests.earnings = {
        success: true,
        count: earnings?.length || 0,
        sample: earnings?.[0] || null
      };
    } catch (error) {
      testResults.tests.earnings = { success: false, error: error.message };
    }
    
    // Test enhanced methods
    const enhancedMethods = [
      'fetchInsiderTrading',
      'fetchInstitutionalHoldings', 
      'fetchAnalystEstimates',
      'fetchSECFilings'
    ];
    
    for (const method of enhancedMethods) {
      if (typeof fetcher[method] === 'function') {
        try {
          const result = await fetcher[method](ticker);
          testResults.tests[method] = {
            available: true,
            success: true,
            count: result?.length || (result ? 1 : 0),
            sample: Array.isArray(result) ? result[0] : result
          };
        } catch (error) {
          testResults.tests[method] = {
            available: true,
            success: false,
            error: error.message
          };
        }
      } else {
        testResults.tests[method] = {
          available: false,
          reason: 'Method not available on current provider'
        };
      }
    }
    
    res.json(testResults);
  } catch (error) {
    console.error('Enhanced test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to show what data is being analyzed
app.get('/api/debug-analysis/:ticker', cognitoAuth.requireAuth(), async (req, res) => {
  try {
    const { ticker } = req.params;
    console.log(`🔍 Debug: Checking analysis data for ${ticker}`);
    
    // Get the current analysis from database
    const existingAnalysis = await analyzer.getLatestAnalysis(ticker);
    
    // Get what data would be gathered for new analysis
    const comprehensiveData = await analyzer.gatherComprehensiveData(ticker);
    const historicalFinancials = await analyzer.getHistoricalFinancialsSafe(ticker);
    
    // Get financial data
    const financialData = await fetcher.getFinancialData(ticker);
    
    const debugInfo = {
      ticker: ticker,
      timestamp: new Date().toISOString(),
      currentProvider: process.env.DATA_PROVIDER || 'enhanced_multi_provider',
      
      // Current analysis in database
      existingAnalysis: {
        exists: !!existingAnalysis,
        hasEnhancedData: !!(existingAnalysis?.insiderAnalysis || existingAnalysis?.institutionalAnalysis),
        analysisType: existingAnalysis?.aiAnalysisStatus || 'unknown',
        timestamp: existingAnalysis?.timestamp
      },
      
      // Raw data being collected
      dataCollection: {
        financialReports: financialData?.length || 0,
        companyInfo: !!comprehensiveData.companyInfo,
        currentPrice: !!comprehensiveData.currentPrice,
        marketNews: comprehensiveData.marketNews?.length || 0,
        insiderTrading: comprehensiveData.insiderTrading?.length || 0,
        institutionalHoldings: comprehensiveData.institutionalHoldings?.length || 0,
        analystEstimates: !!comprehensiveData.analystEstimates,
        secFilings: comprehensiveData.secFilings?.length || 0,
        historicalFinancials: historicalFinancials?.length || 0
      },
      
      // Sample of enhanced data (first few items)
      sampleData: {
        insiderTradingSample: comprehensiveData.insiderTrading?.slice(0, 2) || [],
        institutionalSample: comprehensiveData.institutionalHoldings?.slice(0, 2) || [],
        newsSample: comprehensiveData.marketNews?.slice(0, 2) || [],
        financialsSample: financialData?.slice(0, 2) || []
      },
      
      // Provider info
      providerInfo: {
        hasEnhancedMethods: {
          fetchInsiderTrading: typeof fetcher.fetchInsiderTrading === 'function',
          fetchInstitutionalHoldings: typeof fetcher.fetchInstitutionalHoldings === 'function',
          fetchAnalystEstimates: typeof fetcher.fetchAnalystEstimates === 'function',
          fetchSECFilings: typeof fetcher.fetchSECFilings === 'function'
        }
      }
    };
    
    res.json(debugInfo);
  } catch (error) {
    console.error('Debug analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Show enhanced data being sent to AI
app.get('/api/enhanced-data/:ticker', cognitoAuth.requireAuth(), async (req, res) => {
  try {
    const { ticker } = req.params;
    console.log(`🔍 Gathering enhanced data for AI analysis: ${ticker}`);
    
    // Use the AI analyzer's data gathering method
    const comprehensiveData = await analyzer.gatherComprehensiveData(ticker);
    
    // Get historical financials too
    const historicalFinancials = await analyzer.getHistoricalFinancialsSafe(ticker);
    
    const response = {
      ticker: ticker,
      timestamp: new Date().toISOString(),
      dataProvider: process.env.DATA_PROVIDER || 'enhanced_multi_provider',
      enhancedDataSummary: {
        companyInfo: !!comprehensiveData.companyInfo,
        currentPrice: !!comprehensiveData.currentPrice,
        marketNews: comprehensiveData.marketNews?.length || 0,
        insiderTrading: comprehensiveData.insiderTrading?.length || 0,
        institutionalHoldings: comprehensiveData.institutionalHoldings?.length || 0,
        analystEstimates: !!comprehensiveData.analystEstimates,
        secFilings: comprehensiveData.secFilings?.length || 0,
        historicalFinancials: historicalFinancials?.length || 0
      },
      detailedData: {
        companyProfile: comprehensiveData.companyInfo ? {
          name: comprehensiveData.companyInfo.name,
          sector: comprehensiveData.companyInfo.sector,
          marketCap: comprehensiveData.companyInfo.marketCap,
          employees: comprehensiveData.companyInfo.employees,
          ceo: comprehensiveData.companyInfo.ceo
        } : null,
        
        insiderActivity: comprehensiveData.insiderTrading?.slice(0, 3).map(trade => ({
          executive: trade.reportingName,
          transactionType: trade.transactionType,
          shares: trade.securitiesTransacted,
          date: trade.transactionDate,
          estimatedValue: trade.securityPrice && trade.securitiesTransacted ? 
                         (trade.securityPrice * trade.securitiesTransacted / 1000000).toFixed(1) + 'M' : null
        })) || [],
        
        institutionalActivity: comprehensiveData.institutionalHoldings?.slice(0, 3).map(holder => ({
          institution: holder.holder,
          shares: holder.shares,
          marketValue: holder.marketValue,
          percentageHeld: holder.percentHeld,
          change: holder.change
        })) || [],
        
        analystData: comprehensiveData.analystEstimates ? {
          epsEstimate: comprehensiveData.analystEstimates[0]?.estimatedEpsAvg,
          revenueEstimate: comprehensiveData.analystEstimates[0]?.estimatedRevenueAvg,
          numberOfAnalysts: comprehensiveData.analystEstimates[0]?.numberAnalystEstimatedEps
        } : null,
        
        recentFilings: comprehensiveData.secFilings?.slice(0, 3).map(filing => ({
          type: filing.type,
          title: filing.title,
          date: filing.date
        })) || []
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error gathering enhanced data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Compare data providers side by side
app.get('/api/data-provider/compare/:ticker', cognitoAuth.requireAuth(), async (req, res) => {
  try {
    const { ticker } = req.params;
    const { DataProviderFactory } = require('./services/dataProviderFactory');
    
    console.log(`🔍 Comparing data providers for ${ticker}...`);
    
    // Create providers for comparison
    const enhancedProvider = DataProviderFactory.createProvider('enhanced_multi_provider');
    const yahooProvider = DataProviderFactory.createProvider('yahoo');
    
    const startTime = Date.now();
    
    // Test both providers in parallel
    const [yahooResults, enhancedResults] = await Promise.allSettled([
      Promise.allSettled([
        yahooProvider.getEarningsData(ticker),
        yahooProvider.getCompanyInfo(ticker),
        yahooProvider.getStockPrice(ticker)
      ]),
      Promise.allSettled([
        enhancedProvider.getEarningsData(ticker),
        enhancedProvider.getCompanyInfo(ticker),
        enhancedProvider.getStockPrice(ticker)
      ])
    ]);
    
    const endTime = Date.now();
    
    const comparison = {
      ticker: ticker,
      comparisonTime: `${endTime - startTime}ms`,
      timestamp: new Date().toISOString(),
      providers: {
        yahoo: {
          status: yahooResults.status,
          earnings: yahooResults.status === 'fulfilled' ? {
            status: yahooResults.value[0].status,
            count: yahooResults.value[0].status === 'fulfilled' ? yahooResults.value[0].value?.length || 0 : 0,
            error: yahooResults.value[0].status === 'rejected' ? yahooResults.value[0].reason?.message : null
          } : null,
          companyInfo: yahooResults.status === 'fulfilled' ? {
            status: yahooResults.value[1].status,
            hasData: yahooResults.value[1].status === 'fulfilled' && !!yahooResults.value[1].value,
            error: yahooResults.value[1].status === 'rejected' ? yahooResults.value[1].reason?.message : null
          } : null,
          stockPrice: yahooResults.status === 'fulfilled' ? {
            status: yahooResults.value[2].status,
            hasData: yahooResults.value[2].status === 'fulfilled' && !!yahooResults.value[2].value,
            error: yahooResults.value[2].status === 'rejected' ? yahooResults.value[2].reason?.message : null
          } : null
        },
        enhanced_multi_provider: {
          status: enhancedResults.status,
          earnings: enhancedResults.status === 'fulfilled' ? {
            status: enhancedResults.value[0].status,
            count: enhancedResults.value[0].status === 'fulfilled' ? enhancedResults.value[0].value?.length || 0 : 0,
            error: enhancedResults.value[0].status === 'rejected' ? enhancedResults.value[0].reason?.message : null
          } : null,
          companyInfo: enhancedResults.status === 'fulfilled' ? {
            status: enhancedResults.value[1].status,
            hasData: enhancedResults.value[1].status === 'fulfilled' && !!enhancedResults.value[1].value,
            error: enhancedResults.value[1].status === 'rejected' ? enhancedResults.value[1].reason?.message : null
          } : null,
          stockPrice: enhancedResults.status === 'fulfilled' ? {
            status: enhancedResults.value[2].status,
            hasData: enhancedResults.value[2].status === 'fulfilled' && !!enhancedResults.value[2].value,
            error: enhancedResults.value[2].status === 'rejected' ? enhancedResults.value[2].reason?.message : null
          } : null
        }
      }
    };
    
    res.json(comparison);
  } catch (error) {
    console.error('Error comparing providers:', error);
    res.status(500).json({ error: error.message });
  }
});







// Scheduled tasks
cron.schedule('0 9 * * 1-5', async () => {
  await assistant.checkForNewFinancials();
});

cron.schedule('0 */4 * * *', async () => {
  await fetcher.updateStockPrices();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Current AI model endpoint
app.get('/api/current-model', (req, res) => {
  res.json({
    model: process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    provider: 'AWS Bedrock',
    version: 'Claude 3.5 Sonnet',
    status: 'active'
  });
});



// Public Alerts endpoint (legacy - now user-specific alerts are in /api/user/alerts)
app.get('/api/alerts', async (req, res) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const alerts = await assistant.getAlerts(unreadOnly);
    

    
    res.json(alerts);
  } catch (error) {
    console.error('Alerts API error:', error);
    res.status(500).json({ error: error.message });
  }
});



// Mark alert as read
app.put('/api/alerts/:id/read', cognitoAuth.requireAuth(), async (req, res) => {
  try {
    const { id } = req.params;
    await assistant.markAlertAsRead(id);
    res.json({ status: 'marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, async () => {
  console.log(`Advisor Assistant running on port ${PORT}`);
  console.log('AWS services initialized:');
  console.log('- Bedrock (Claude 3.5 Sonnet) for AI analysis');
  console.log('- DynamoDB for data storage');
  console.log('- S3 for document storage');
  console.log('- SNS for alert notifications');
  console.log('- SQS for async processing');
  console.log('- EventBridge for event publishing');
  console.log('- CloudWatch for logging');
  
  // Display AI analyzer configuration
  const aiStatus = analyzer.getAnalysisStatus();
  console.log('\n🤖 AI Analyzer Configuration:');
  console.log(`- Cache: Enabled (for optimal performance)`);
  console.log(`- Max timeout: ${aiStatus.maxTimeout}`);
  console.log(`- Max retries: ${aiStatus.maxRetries}`);
  console.log(`- Min interval: ${aiStatus.minInterval}`);
  console.log(`- Currently processing: ${aiStatus.processingCount} analyses`);
  
  await aws.logEvent({ 
    message: 'Advisor Assistant started successfully', 
    port: PORT,
    environment: process.env.NODE_ENV,
    aiCacheEnabled: true
  });
});

// Admin endpoint to create a user (restricted)
app.post('/api/admin/create-user', cognitoAuth.requireAuth(), async (req, res) => {
  // Require admin group membership
  if (!req.user.groups || !req.user.groups.includes('admin')) {
    console.log(`[SECURITY] Admin access denied for user: ${req.user.email || req.user.username}. Groups: ${JSON.stringify(req.user.groups)}`);
    return res.status(403).json({ 
      error: 'Admin group membership required',
      message: 'You must be a member of the admin group to access this function'
    });
  }
  
  // Get user details from request body
  const { email, isAdmin = false } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  // Use email as username (common practice)
  const username = email;
  
  // Log admin action for security
  const adminUser = req.user.email || req.user.username || req.user.sub;
  console.log(`[ADMIN] User creation requested by: ${adminUser} for: ${email} at ${new Date().toISOString()}`);
  
  try {
    console.log(`🔍 [ADMIN] Debug info:`, {
      adminUser: adminUser,
      targetEmail: email,
      isAdmin: isAdmin,
      userPoolId: process.env.COGNITO_USER_POOL_ID,
      clientId: process.env.COGNITO_CLIENT_ID
    });
    
    // Log to CloudWatch for audit trail
    await aws.logEvent({
      action: 'admin_create_user',
      admin_user: adminUser,
      target_email: email,
      is_admin: isAdmin,
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress
    });
    
    // Generate secure temporary password
    const { randomBytes } = require('crypto');
    const tempPassword = randomBytes(8).toString('hex') + 'A1!';
    
    console.log(`🔑 Generated temporary password for ${email}`);
    
    const result = await cognitoAuth.createUser(
      email, // Use email as username (Cognito will generate UUID internally)
      email,
      tempPassword,
      { 
        email_verified: 'true' // Set to true for POC
      }
    );
    
    if (result.success) {
      console.log(`✅ [ADMIN] User creation successful for ${email}`);
      
      // Add to admin group if requested
      if (isAdmin) {
        try {
          console.log(`🔧 [ADMIN] Adding ${email} to admin group...`);
          const { AdminAddUserToGroupCommand } = require('@aws-sdk/client-cognito-identity-provider');
          const command = new AdminAddUserToGroupCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: result.user.Username, // Use the actual username returned by Cognito (UUID)
            GroupName: 'admin'
          });
          await cognitoAuth.client.send(command);
          console.log(`✅ [ADMIN] User ${email} (${result.user.Username}) added to admin group successfully`);
        } catch (groupError) {
          console.error('❌ Error adding user to admin group:', groupError);
        }
      }
      
      console.log(`✅ [ADMIN] User created: ${email}`);
      console.log(`🔑 [ADMIN] Temporary password: ${result.temporaryPassword}`);
      
      res.json({
        success: true,
        message: 'User created successfully',
        email: email,
        username: email,
        temporaryPassword: result.temporaryPassword,
        isAdmin: isAdmin,
        note: 'User created successfully. Please share the temporary password with the user.',
        instructions: 'Please provide the user with their temporary password shown below. They must set a permanent password on first login.'
      });
    } else {
      console.log(`❌ [ADMIN] User creation failed for ${email}: ${result.error}`);
      res.status(400).json({ 
        success: false,
        error: result.error,
        email: email
      });
    }
  } catch (error) {
    console.error('❌ [ADMIN] Unexpected error creating user:', {
      error: error.message,
      stack: error.stack,
      email: email
    });
    res.status(500).json({ 
      success: false,
      error: error.message,
      email: email
    });
  }
});

// Debug middleware to log all API requests (but not interfere)
app.use((req, res, next) => {
  if (req.url.startsWith('/api/')) {
    console.log(`🔍 API Request: ${req.method} ${req.url}`);
    console.log(`🔍 User authenticated:`, !!req.user);
  }
  next();
});

// Admin routes protection middleware
app.use('/admin*', (req, res, next) => {
  // Redirect to login if accessing admin pages directly
  res.redirect('/login.html');
});

// Serve admin.html only to authenticated users (handled by frontend auth check)
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

module.exports = app;