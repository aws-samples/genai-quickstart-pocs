/**
 * Amazon Nova Pro service example
 * 
 * This example demonstrates how to use the Amazon Nova Pro service
 * for financial analysis and quantitative tasks.
 */

import { BedrockClientService } from '../services/ai/bedrock-client';
import { 
  AmazonNovaProService, 
  NovaProPromptTemplate,
  NovaProRequestOptions 
} from '../services/ai/amazon-nova-pro-service';

/**
 * Example usage of Amazon Nova Pro service
 */
async function runNovaProExample(): Promise<void> {
  try {
    console.log('🚀 Starting Amazon Nova Pro service example...\n');

    // Initialize the Bedrock client
    const bedrockClient = new BedrockClientService({
      region: 'us-east-1'
    });

    // Initialize the Amazon Nova Pro service
    const novaProService = new AmazonNovaProService(bedrockClient, {
      temperature: 0.3, // Lower temperature for more precise financial analysis
      maxTokens: 4096
    });

    // Example 1: Basic financial analysis
    console.log('📊 Example 1: Basic Financial Analysis');
    console.log('=====================================\n');

    const basicAnalysisOptions: NovaProRequestOptions = {
      prompt: 'Analyze Apple Inc. (AAPL) based on the following financial data: Revenue: $365B, Net Income: $95B, Total Assets: $352B, Total Debt: $123B, Market Cap: $2.8T. Provide key financial ratios and investment recommendation.',
      analysisType: 'mixed',
      outputFormat: 'structured'
    };

    const basicResult = await novaProService.complete(basicAnalysisOptions);
    console.log('Basic Analysis Result:');
    console.log(basicResult.completion);
    console.log(`\nTokens used: ${basicResult.usage.totalTokens}\n`);

    // Example 2: Quantitative analysis with template
    console.log('🔢 Example 2: Quantitative Analysis');
    console.log('===================================\n');

    const quantAnalysisOptions: NovaProRequestOptions = {
      prompt: 'Perform statistical analysis on this portfolio',
      template: NovaProPromptTemplate.QUANTITATIVE_ANALYSIS,
      templateVariables: {
        datasetDescription: 'Monthly returns for a diversified portfolio over 5 years',
        analysisType: 'Time series analysis and risk metrics calculation',
        statisticalMethods: 'Descriptive statistics, correlation analysis, VaR calculation',
        variables: 'Monthly returns, volatility, Sharpe ratio, maximum drawdown',
        hypothesis: 'The portfolio exhibits lower volatility than the S&P 500 benchmark'
      },
      analysisType: 'quantitative'
    };

    const quantResult = await novaProService.complete(quantAnalysisOptions);
    console.log('Quantitative Analysis Result:');
    console.log(quantResult.completion);
    console.log(`\nTokens used: ${quantResult.usage.totalTokens}\n`);

    // Example 3: Risk modeling
    console.log('⚠️ Example 3: Risk Modeling');
    console.log('===========================\n');

    const riskModelingOptions: NovaProRequestOptions = {
      prompt: 'Calculate comprehensive risk metrics for this investment portfolio',
      template: NovaProPromptTemplate.RISK_MODELING,
      templateVariables: {
        investmentDetails: 'Technology-focused equity portfolio with 20 holdings',
        riskFactors: 'Market risk, sector concentration, individual stock risk, liquidity risk',
        historicalData: '3 years of daily price and volume data',
        riskMetrics: 'VaR (95%, 99%), Expected Shortfall, Beta, Tracking Error, Information Ratio',
        timeHorizon: '1 year investment horizon'
      },
      analysisType: 'quantitative'
    };

    const riskResult = await novaProService.complete(riskModelingOptions);
    console.log('Risk Modeling Result:');
    console.log(riskResult.completion);
    console.log(`\nTokens used: ${riskResult.usage.totalTokens}\n`);

    // Example 4: Portfolio optimization
    console.log('📈 Example 4: Portfolio Optimization');
    console.log('====================================\n');

    const portfolioOptOptions: NovaProRequestOptions = {
      prompt: 'Optimize portfolio allocation using modern portfolio theory',
      template: NovaProPromptTemplate.PORTFOLIO_OPTIMIZATION,
      templateVariables: {
        availableAssets: 'AAPL, MSFT, GOOGL, AMZN, TSLA, SPY, QQQ, VTI, BND, GLD',
        expectedReturns: 'AAPL: 12%, MSFT: 10%, GOOGL: 11%, AMZN: 13%, TSLA: 15%, SPY: 8%, QQQ: 9%, VTI: 7%, BND: 3%, GLD: 5%',
        riskData: 'Correlation matrix and volatility data for all assets',
        constraints: 'Maximum 20% allocation per individual stock, minimum 10% in bonds, maximum 60% in technology sector',
        objective: 'Maximize Sharpe ratio while maintaining portfolio volatility below 15%'
      },
      analysisType: 'quantitative'
    };

    const portfolioResult = await novaProService.complete(portfolioOptOptions);
    console.log('Portfolio Optimization Result:');
    console.log(portfolioResult.completion);
    console.log(`\nTokens used: ${portfolioResult.usage.totalTokens}\n`);

    // Example 5: Response parsing with financial metrics extraction
    console.log('🔍 Example 5: Response Parsing');
    console.log('==============================\n');

    const metricsAnalysisOptions: NovaProRequestOptions = {
      prompt: 'Provide a comprehensive financial analysis of Microsoft Corporation with specific metrics in a structured format.',
      template: NovaProPromptTemplate.FINANCIAL_ANALYSIS,
      templateVariables: {
        investmentDetails: 'Microsoft Corporation (MSFT)',
        financialData: 'Revenue: $211B, Net Income: $72B, Free Cash Flow: $65B, Total Assets: $411B',
        analysisRequirements: 'Calculate key financial ratios and provide investment recommendation',
        keyMetrics: 'P/E Ratio, ROE, ROA, Debt-to-Equity, Current Ratio, Gross Margin, Operating Margin',
        timePeriod: 'Latest fiscal year with 3-year trend analysis'
      },
      outputFormat: 'structured'
    };

    const metricsResult = await novaProService.complete(metricsAnalysisOptions);
    
    // Parse the response to extract financial metrics
    const parsedMetrics = novaProService.parseResponse(metricsResult, {
      extractMetrics: true,
      formatType: 'structured'
    });

    console.log('Structured Analysis Result:');
    console.log(JSON.stringify(parsedMetrics, null, 2));
    console.log(`\nTokens used: ${metricsResult.usage.totalTokens}\n`);

    // Example 6: Streaming response
    console.log('🌊 Example 6: Streaming Response');
    console.log('=================================\n');

    const streamingOptions: NovaProRequestOptions = {
      prompt: 'Provide a detailed valuation analysis for Tesla Inc. (TSLA) including DCF model, comparable company analysis, and investment recommendation.',
      template: NovaProPromptTemplate.VALUATION_ANALYSIS,
      templateVariables: {
        investmentDetails: 'Tesla Inc. (TSLA) - Electric vehicle and clean energy company',
        financialStatements: 'Latest 10-K and 10-Q filings with 5-year historical data',
        marketData: 'Current stock price, trading multiples, analyst estimates',
        valuationMethods: 'DCF analysis, P/E multiple, EV/EBITDA, PEG ratio, Sum-of-the-parts',
        assumptions: 'Revenue growth: 25% CAGR, EBITDA margin improvement, WACC: 10%'
      },
      streaming: true,
      analysisType: 'mixed'
    };

    console.log('Streaming valuation analysis...\n');
    const streamingResult = await novaProService.complete(streamingOptions);
    console.log('Final Streaming Result:');
    console.log(streamingResult.completion);
    console.log(`\nTokens used: ${streamingResult.usage.totalTokens}\n`);

    console.log('✅ Amazon Nova Pro service example completed successfully!');

  } catch (error) {
    console.error('❌ Error running Amazon Nova Pro example:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

/**
 * Helper function to demonstrate system prompt generation
 */
function demonstrateSystemPrompts(): void {
  console.log('🎯 System Prompt Examples');
  console.log('=========================\n');

  const novaProService = new AmazonNovaProService(
    new BedrockClientService({ region: 'us-east-1' })
  );

  // Example system prompts for different analysis types
  const quantitativePrompt = novaProService.generateSystemPrompt(
    'a quantitative analyst specializing in risk modeling',
    'Focus on statistical rigor and mathematical precision',
    ['Always provide confidence intervals', 'Show all calculations', 'Use industry-standard risk metrics']
  );

  const qualitativePrompt = novaProService.generateSystemPrompt(
    'a senior equity research analyst',
    'Emphasize fundamental analysis and market insights',
    ['Consider macroeconomic factors', 'Provide actionable investment recommendations', 'Include competitive analysis']
  );

  console.log('Quantitative Analysis System Prompt:');
  console.log(quantitativePrompt);
  console.log('\n' + '='.repeat(50) + '\n');

  console.log('Qualitative Analysis System Prompt:');
  console.log(qualitativePrompt);
  console.log('\n');
}

// Run the example if this file is executed directly
if (require.main === module) {
  demonstrateSystemPrompts();
  runNovaProExample().catch(console.error);
}

export { runNovaProExample, demonstrateSystemPrompts };