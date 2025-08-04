"use strict";
/**
 * Amazon Nova Pro service example
 *
 * This example demonstrates how to use the Amazon Nova Pro service
 * for financial analysis and quantitative tasks.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.demonstrateSystemPrompts = exports.runNovaProExample = void 0;
const bedrock_client_1 = require("../services/ai/bedrock-client");
const amazon_nova_pro_service_1 = require("../services/ai/amazon-nova-pro-service");
/**
 * Example usage of Amazon Nova Pro service
 */
async function runNovaProExample() {
    try {
        console.log('🚀 Starting Amazon Nova Pro service example...\n');
        // Initialize the Bedrock client
        const bedrockClient = new bedrock_client_1.BedrockClientService({
            region: 'us-east-1'
        });
        // Initialize the Amazon Nova Pro service
        const novaProService = new amazon_nova_pro_service_1.AmazonNovaProService(bedrockClient, {
            temperature: 0.3,
            maxTokens: 4096
        });
        // Example 1: Basic financial analysis
        console.log('📊 Example 1: Basic Financial Analysis');
        console.log('=====================================\n');
        const basicAnalysisOptions = {
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
        const quantAnalysisOptions = {
            prompt: 'Perform statistical analysis on this portfolio',
            template: amazon_nova_pro_service_1.NovaProPromptTemplate.QUANTITATIVE_ANALYSIS,
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
        const riskModelingOptions = {
            prompt: 'Calculate comprehensive risk metrics for this investment portfolio',
            template: amazon_nova_pro_service_1.NovaProPromptTemplate.RISK_MODELING,
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
        const portfolioOptOptions = {
            prompt: 'Optimize portfolio allocation using modern portfolio theory',
            template: amazon_nova_pro_service_1.NovaProPromptTemplate.PORTFOLIO_OPTIMIZATION,
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
        const metricsAnalysisOptions = {
            prompt: 'Provide a comprehensive financial analysis of Microsoft Corporation with specific metrics in a structured format.',
            template: amazon_nova_pro_service_1.NovaProPromptTemplate.FINANCIAL_ANALYSIS,
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
        const streamingOptions = {
            prompt: 'Provide a detailed valuation analysis for Tesla Inc. (TSLA) including DCF model, comparable company analysis, and investment recommendation.',
            template: amazon_nova_pro_service_1.NovaProPromptTemplate.VALUATION_ANALYSIS,
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
    }
    catch (error) {
        console.error('❌ Error running Amazon Nova Pro example:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
    }
}
exports.runNovaProExample = runNovaProExample;
/**
 * Helper function to demonstrate system prompt generation
 */
function demonstrateSystemPrompts() {
    console.log('🎯 System Prompt Examples');
    console.log('=========================\n');
    const novaProService = new amazon_nova_pro_service_1.AmazonNovaProService(new bedrock_client_1.BedrockClientService({ region: 'us-east-1' }));
    // Example system prompts for different analysis types
    const quantitativePrompt = novaProService.generateSystemPrompt('a quantitative analyst specializing in risk modeling', 'Focus on statistical rigor and mathematical precision', ['Always provide confidence intervals', 'Show all calculations', 'Use industry-standard risk metrics']);
    const qualitativePrompt = novaProService.generateSystemPrompt('a senior equity research analyst', 'Emphasize fundamental analysis and market insights', ['Consider macroeconomic factors', 'Provide actionable investment recommendations', 'Include competitive analysis']);
    console.log('Quantitative Analysis System Prompt:');
    console.log(quantitativePrompt);
    console.log('\n' + '='.repeat(50) + '\n');
    console.log('Qualitative Analysis System Prompt:');
    console.log(qualitativePrompt);
    console.log('\n');
}
exports.demonstrateSystemPrompts = demonstrateSystemPrompts;
// Run the example if this file is executed directly
if (require.main === module) {
    demonstrateSystemPrompts();
    runNovaProExample().catch(console.error);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW1hem9uLW5vdmEtcHJvLWV4YW1wbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhhbXBsZXMvYW1hem9uLW5vdmEtcHJvLWV4YW1wbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7OztHQUtHOzs7QUFFSCxrRUFBcUU7QUFDckUsb0ZBSWdEO0FBRWhEOztHQUVHO0FBQ0gsS0FBSyxVQUFVLGlCQUFpQjtJQUM5QixJQUFJO1FBQ0YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrREFBa0QsQ0FBQyxDQUFDO1FBRWhFLGdDQUFnQztRQUNoQyxNQUFNLGFBQWEsR0FBRyxJQUFJLHFDQUFvQixDQUFDO1lBQzdDLE1BQU0sRUFBRSxXQUFXO1NBQ3BCLENBQUMsQ0FBQztRQUVILHlDQUF5QztRQUN6QyxNQUFNLGNBQWMsR0FBRyxJQUFJLDhDQUFvQixDQUFDLGFBQWEsRUFBRTtZQUM3RCxXQUFXLEVBQUUsR0FBRztZQUNoQixTQUFTLEVBQUUsSUFBSTtTQUNoQixDQUFDLENBQUM7UUFFSCxzQ0FBc0M7UUFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO1FBQ3RELE9BQU8sQ0FBQyxHQUFHLENBQUMseUNBQXlDLENBQUMsQ0FBQztRQUV2RCxNQUFNLG9CQUFvQixHQUEwQjtZQUNsRCxNQUFNLEVBQUUsMk5BQTJOO1lBQ25PLFlBQVksRUFBRSxPQUFPO1lBQ3JCLFlBQVksRUFBRSxZQUFZO1NBQzNCLENBQUM7UUFFRixNQUFNLFdBQVcsR0FBRyxNQUFNLGNBQWMsQ0FBQyxRQUFRLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUN4RSxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsV0FBVyxDQUFDLEtBQUssQ0FBQyxXQUFXLElBQUks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TUFBTSxjQUFjLEdBQUcsSUFBSSw4Q0FBb0IsQ0FDN0MsSUFBSSxxQ0FBb0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUNsRCxDQUFDO0lBRUYsc0RBQXNEO0lBQ3RELE1BQU0sa0JBQWtCLEdBQUcsY0FBYyxDQUFDLG9CQUFvQixDQUM1RCxzREFBc0QsRUFDdEQsdURBQXVELEVBQ3ZELENBQUMscUNBQXFDLEVBQUUsdUJBQXVCLEVBQUUsb0NBQW9DLENBQUMsQ0FDdkcsQ0FBQztJQUVGLE1BQU0saUJBQWlCLEdBQUcsY0FBYyxDQUFDLG9CQUFvQixDQUMzRCxrQ0FBa0MsRUFDbEMsb0RBQW9ELEVBQ3BELENBQUMsZ0NBQWdDLEVBQUUsK0NBQStDLEVBQUUsOEJBQThCLENBQUMsQ0FDcEgsQ0FBQztJQUVGLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0NBQXNDLENBQUMsQ0FBQztJQUNwRCxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDaEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUUxQyxPQUFPLENBQUMsR0FBRyxDQUFDLHFDQUFxQyxDQUFDLENBQUM7SUFDbkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0lBQy9CLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDcEIsQ0FBQztBQVEyQiw0REFBd0I7QUFOcEQsb0RBQW9EO0FBQ3BELElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUU7SUFDM0Isd0JBQXdCLEVBQUUsQ0FBQztJQUMzQixpQkFBaUIsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDMUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEFtYXpvbiBOb3ZhIFBybyBzZXJ2aWNlIGV4YW1wbGVcbiAqIFxuICogVGhpcyBleGFtcGxlIGRlbW9uc3RyYXRlcyBob3cgdG8gdXNlIHRoZSBBbWF6b24gTm92YSBQcm8gc2VydmljZVxuICogZm9yIGZpbmFuY2lhbCBhbmFseXNpcyBhbmQgcXVhbnRpdGF0aXZlIHRhc2tzLlxuICovXG5cbmltcG9ydCB7IEJlZHJvY2tDbGllbnRTZXJ2aWNlIH0gZnJvbSAnLi4vc2VydmljZXMvYWkvYmVkcm9jay1jbGllbnQnO1xuaW1wb3J0IHsgXG4gIEFtYXpvbk5vdmFQcm9TZXJ2aWNlLCBcbiAgTm92YVByb1Byb21wdFRlbXBsYXRlLFxuICBOb3ZhUHJvUmVxdWVzdE9wdGlvbnMgXG59IGZyb20gJy4uL3NlcnZpY2VzL2FpL2FtYXpvbi1ub3ZhLXByby1zZXJ2aWNlJztcblxuLyoqXG4gKiBFeGFtcGxlIHVzYWdlIG9mIEFtYXpvbiBOb3ZhIFBybyBzZXJ2aWNlXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJ1bk5vdmFQcm9FeGFtcGxlKCk6IFByb21pc2U8dm9pZD4ge1xuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKCfwn5qAIFN0YXJ0aW5nIEFtYXpvbiBOb3ZhIFBybyBzZXJ2aWNlIGV4YW1wbGUuLi5cXG4nKTtcblxuICAgIC8vIEluaXRpYWxpemUgdGhlIEJlZHJvY2sgY2xpZW50XG4gICAgY29uc3QgYmVkcm9ja0NsaWVudCA9IG5ldyBCZWRyb2NrQ2xpZW50U2VydmljZSh7XG4gICAgICByZWdpb246ICd1cy1lYXN0LTEnXG4gICAgfSk7XG5cbiAgICAvLyBJbml0aWFsaXplIHRoZSBBbWF6b24gTm92YSBQcm8gc2VydmljZVxuICAgIGNvbnN0IG5vdmFQcm9TZXJ2aWNlID0gbmV3IEFtYXpvbk5vdmFQcm9TZXJ2aWNlKGJlZHJvY2tDbGllbnQsIHtcbiAgICAgIHRlbXBlcmF0dXJlOiAwLjMsIC8vIExvd2VyIHRlbXBlcmF0dXJlIGZvciBtb3JlIHByZWNpc2UgZmluYW5jaWFsIGFuYWx5c2lzXG4gICAgICBtYXhUb2tlbnM6IDQwOTZcbiAgICB9KTtcblxuICAgIC8vIEV4YW1wbGUgMTogQmFzaWMgZmluYW5jaWFsIGFuYWx5c2lzXG4gICAgY29uc29sZS5sb2coJ/Cfk4ogRXhhbXBsZSAxOiBCYXNpYyBGaW5hbmNpYWwgQW5hbHlzaXMnKTtcbiAgICBjb25zb2xlLmxvZygnPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxcbicpO1xuXG4gICAgY29uc3QgYmFzaWNBbmFseXNpc09wdGlvbnM6IE5vdmFQcm9SZXF1ZXN0T3B0aW9ucyA9IHtcbiAgICAgIHByb21wdDogJ0FuYWx5emUgQXBwbGUgSW5jLiAoQUFQTCkgYmFzZWQgb24gdGhlIGZvbGxvd2luZyBmaW5hbmNpYWwgZGF0YTogUmV2ZW51ZTogJDM2NUIsIE5ldCBJbmNvbWU6ICQ5NUIsIFRvdGFsIEFzc2V0czogJDM1MkIsIFRvdGFsIERlYnQ6ICQxMjNCLCBNYXJrZXQgQ2FwOiAkMi44VC4gUHJvdmlkZSBrZXkgZmluYW5jaWFsIHJhdGlvcyBhbmQgaW52ZXN0bWVudCByZWNvbW1lbmRhdGlvbi4nLFxuICAgICAgYW5hbHlzaXNUeXBlOiAnbWl4ZWQnLFxuICAgICAgb3V0cHV0Rm9ybWF0OiAnc3RydWN0dXJlZCdcbiAgICB9O1xuXG4gICAgY29uc3QgYmFzaWNSZXN1bHQgPSBhd2FpdCBub3ZhUHJvU2VydmljZS5jb21wbGV0ZShiYXNpY0FuYWx5c2lzT3B0aW9ucyk7XG4gICAgY29uc29sZS5sb2coJ0Jhc2ljIEFuYWx5c2lzIFJlc3VsdDonKTtcbiAgICBjb25zb2xlLmxvZyhiYXNpY1Jlc3VsdC5jb21wbGV0aW9uKTtcbiAgICBjb25zb2xlLmxvZyhgXFxuVG9rZW5zIHVzZWQ6ICR7YmFzaWNSZXN1bHQudXNhZ2UudG90YWxUb2tlbnN9XFxuYCk7XG5cbiAgICAvLyBFeGFtcGxlIDI6IFF1YW50aXRhdGl2ZSBhbmFseXNpcyB3aXRoIHRlbXBsYXRlXG4gICAgY29uc29sZS5sb2coJ/CflKIgRXhhbXBsZSAyOiBRdWFudGl0YXRpdmUgQW5hbHlzaXMnKTtcbiAgICBjb25zb2xlLmxvZygnPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cXG4nKTtcblxuICAgIGNvbnN0IHF1YW50QW5hbHlzaXNPcHRpb25zOiBOb3ZhUHJvUmVxdWVzdE9wdGlvbnMgPSB7XG4gICAgICBwcm9tcHQ6ICdQZXJmb3JtIHN0YXRpc3RpY2FsIGFuYWx5c2lzIG9uIHRoaXMgcG9ydGZvbGlvJyxcbiAgICAgIHRlbXBsYXRlOiBOb3ZhUHJvUHJvbXB0VGVtcGxhdGUuUVVBTlRJVEFUSVZFX0FOQUxZU0lTLFxuICAgICAgdGVtcGxhdGVWYXJpYWJsZXM6IHtcbiAgICAgICAgZGF0YXNldERlc2NyaXB0aW9uOiAnTW9udGhseSByZXR1cm5zIGZvciBhIGRpdmVyc2lmaWVkIHBvcnRmb2xpbyBvdmVyIDUgeWVhcnMnLFxuICAgICAgICBhbmFseXNpc1R5cGU6ICdUaW1lIHNlcmllcyBhbmFseXNpcyBhbmQgcmlzayBtZXRyaWNzIGNhbGN1bGF0aW9uJyxcbiAgICAgICAgc3RhdGlzdGljYWxNZXRob2RzOiAnRGVzY3JpcHRpdmUgc3RhdGlzdGljcywgY29ycmVsYXRpb24gYW5hbHlzaXMsIFZhUiBjYWxjdWxhdGlvbicsXG4gICAgICAgIHZhcmlhYmxlczogJ01vbnRobHkgcmV0dXJucywgdm9sYXRpbGl0eSwgU2hhcnBlIHJhdGlvLCBtYXhpbXVtIGRyYXdkb3duJyxcbiAgICAgICAgaHlwb3RoZXNpczogJ1RoZSBwb3J0Zm9saW8gZXhoaWJpdHMgbG93ZXIgdm9sYXRpbGl0eSB0aGFuIHRoZSBTJlAgNTAwIGJlbmNobWFyaydcbiAgICAgIH0sXG4gICAgICBhbmFseXNpc1R5cGU6ICdxdWFudGl0YXRpdmUnXG4gICAgfTtcblxuICAgIGNvbnN0IHF1YW50UmVzdWx0ID0gYXdhaXQgbm92YVByb1NlcnZpY2UuY29tcGxldGUocXVhbnRBbmFseXNpc09wdGlvbnMpO1xuICAgIGNvbnNvbGUubG9nKCdRdWFudGl0YXRpdmUgQW5hbHlzaXMgUmVzdWx0OicpO1xuICAgIGNvbnNvbGUubG9nKHF1YW50UmVzdWx0LmNvbXBsZXRpb24pO1xuICAgIGNvbnNvbGUubG9nKGBcXG5Ub2tlbnMgdXNlZDogJHtxdWFudFJlc3VsdC51c2FnZS50b3RhbFRva2Vuc31cXG5gKTtcblxuICAgIC8vIEV4YW1wbGUgMzogUmlzayBtb2RlbGluZ1xuICAgIGNvbnNvbGUubG9nKCfimqDvuI8gRXhhbXBsZSAzOiBSaXNrIE1vZGVsaW5nJyk7XG4gICAgY29uc29sZS5sb2coJz09PT09PT09PT09PT09PT09PT09PT09PT09PVxcbicpO1xuXG4gICAgY29uc3Qgcmlza01vZGVsaW5nT3B0aW9uczogTm92YVByb1JlcXVlc3RPcHRpb25zID0ge1xuICAgICAgcHJvbXB0OiAnQ2FsY3VsYXRlIGNvbXByZWhlbnNpdmUgcmlzayBtZXRyaWNzIGZvciB0aGlzIGludmVzdG1lbnQgcG9ydGZvbGlvJyxcbiAgICAgIHRlbXBsYXRlOiBOb3ZhUHJvUHJvbXB0VGVtcGxhdGUuUklTS19NT0RFTElORyxcbiAgICAgIHRlbXBsYXRlVmFyaWFibGVzOiB7XG4gICAgICAgIGludmVzdG1lbnREZXRhaWxzOiAnVGVjaG5vbG9neS1mb2N1c2VkIGVxdWl0eSBwb3J0Zm9saW8gd2l0aCAyMCBob2xkaW5ncycsXG4gICAgICAgIHJpc2tGYWN0b3JzOiAnTWFya2V0IHJpc2ssIHNlY3RvciBjb25jZW50cmF0aW9uLCBpbmRpdmlkdWFsIHN0b2NrIHJpc2ssIGxpcXVpZGl0eSByaXNrJyxcbiAgICAgICAgaGlzdG9yaWNhbERhdGE6ICczIHllYXJzIG9mIGRhaWx5IHByaWNlIGFuZCB2b2x1bWUgZGF0YScsXG4gICAgICAgIHJpc2tNZXRyaWNzOiAnVmFSICg5NSUsIDk5JSksIEV4cGVjdGVkIFNob3J0ZmFsbCwgQmV0YSwgVHJhY2tpbmcgRXJyb3IsIEluZm9ybWF0aW9uIFJhdGlvJyxcbiAgICAgICAgdGltZUhvcml6b246ICcxIHllYXIgaW52ZXN0bWVudCBob3Jpem9uJ1xuICAgICAgfSxcbiAgICAgIGFuYWx5c2lzVHlwZTogJ3F1YW50aXRhdGl2ZSdcbiAgICB9O1xuXG4gICAgY29uc3Qgcmlza1Jlc3VsdCA9IGF3YWl0IG5vdmFQcm9TZXJ2aWNlLmNvbXBsZXRlKHJpc2tNb2RlbGluZ09wdGlvbnMpO1xuICAgIGNvbnNvbGUubG9nKCdSaXNrIE1vZGVsaW5nIFJlc3VsdDonKTtcbiAgICBjb25zb2xlLmxvZyhyaXNrUmVzdWx0LmNvbXBsZXRpb24pO1xuICAgIGNvbnNvbGUubG9nKGBcXG5Ub2tlbnMgdXNlZDogJHtyaXNrUmVzdWx0LnVzYWdlLnRvdGFsVG9rZW5zfVxcbmApO1xuXG4gICAgLy8gRXhhbXBsZSA0OiBQb3J0Zm9saW8gb3B0aW1pemF0aW9uXG4gICAgY29uc29sZS5sb2coJ/Cfk4ggRXhhbXBsZSA0OiBQb3J0Zm9saW8gT3B0aW1pemF0aW9uJyk7XG4gICAgY29uc29sZS5sb2coJz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxcbicpO1xuXG4gICAgY29uc3QgcG9ydGZvbGlvT3B0T3B0aW9uczogTm92YVByb1JlcXVlc3RPcHRpb25zID0ge1xuICAgICAgcHJvbXB0OiAnT3B0aW1pemUgcG9ydGZvbGlvIGFsbG9jYXRpb24gdXNpbmcgbW9kZXJuIHBvcnRmb2xpbyB0aGVvcnknLFxuICAgICAgdGVtcGxhdGU6IE5vdmFQcm9Qcm9tcHRUZW1wbGF0ZS5QT1JURk9MSU9fT1BUSU1JWkFUSU9OLFxuICAgICAgdGVtcGxhdGVWYXJpYWJsZXM6IHtcbiAgICAgICAgYXZhaWxhYmxlQXNzZXRzOiAnQUFQTCwgTVNGVCwgR09PR0wsIEFNWk4sIFRTTEEsIFNQWSwgUVFRLCBWVEksIEJORCwgR0xEJyxcbiAgICAgICAgZXhwZWN0ZWRSZXR1cm5zOiAnQUFQTDogMTIlLCBNU0ZUOiAxMCUsIEdPT0dMOiAxMSUsIEFNWk46IDEzJSwgVFNMQTogMTUlLCBTUFk6IDglLCBRUVE6IDklLCBWVEk6IDclLCBCTkQ6IDMlLCBHTEQ6IDUlJyxcbiAgICAgICAgcmlza0RhdGE6ICdDb3JyZWxhdGlvbiBtYXRyaXggYW5kIHZvbGF0aWxpdHkgZGF0YSBmb3IgYWxsIGFzc2V0cycsXG4gICAgICAgIGNvbnN0cmFpbnRzOiAnTWF4aW11bSAyMCUgYWxsb2NhdGlvbiBwZXIgaW5kaXZpZHVhbCBzdG9jaywgbWluaW11bSAxMCUgaW4gYm9uZHMsIG1heGltdW0gNjAlIGluIHRlY2hub2xvZ3kgc2VjdG9yJyxcbiAgICAgICAgb2JqZWN0aXZlOiAnTWF4aW1pemUgU2hhcnBlIHJhdGlvIHdoaWxlIG1haW50YWluaW5nIHBvcnRmb2xpbyB2b2xhdGlsaXR5IGJlbG93IDE1JSdcbiAgICAgIH0sXG4gICAgICBhbmFseXNpc1R5cGU6ICdxdWFudGl0YXRpdmUnXG4gICAgfTtcblxuICAgIGNvbnN0IHBvcnRmb2xpb1Jlc3VsdCA9IGF3YWl0IG5vdmFQcm9TZXJ2aWNlLmNvbXBsZXRlKHBvcnRmb2xpb09wdE9wdGlvbnMpO1xuICAgIGNvbnNvbGUubG9nKCdQb3J0Zm9saW8gT3B0aW1pemF0aW9uIFJlc3VsdDonKTtcbiAgICBjb25zb2xlLmxvZyhwb3J0Zm9saW9SZXN1bHQuY29tcGxldGlvbik7XG4gICAgY29uc29sZS5sb2coYFxcblRva2VucyB1c2VkOiAke3BvcnRmb2xpb1Jlc3VsdC51c2FnZS50b3RhbFRva2Vuc31cXG5gKTtcblxuICAgIC8vIEV4YW1wbGUgNTogUmVzcG9uc2UgcGFyc2luZyB3aXRoIGZpbmFuY2lhbCBtZXRyaWNzIGV4dHJhY3Rpb25cbiAgICBjb25zb2xlLmxvZygn8J+UjSBFeGFtcGxlIDU6IFJlc3BvbnNlIFBhcnNpbmcnKTtcbiAgICBjb25zb2xlLmxvZygnPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XFxuJyk7XG5cbiAgICBjb25zdCBtZXRyaWNzQW5hbHlzaXNPcHRpb25zOiBOb3ZhUHJvUmVxdWVzdE9wdGlvbnMgPSB7XG4gICAgICBwcm9tcHQ6ICdQcm92aWRlIGEgY29tcHJlaGVuc2l2ZSBmaW5hbmNpYWwgYW5hbHlzaXMgb2YgTWljcm9zb2Z0IENvcnBvcmF0aW9uIHdpdGggc3BlY2lmaWMgbWV0cmljcyBpbiBhIHN0cnVjdHVyZWQgZm9ybWF0LicsXG4gICAgICB0ZW1wbGF0ZTogTm92YVByb1Byb21wdFRlbXBsYXRlLkZJTkFOQ0lBTF9BTkFMWVNJUyxcbiAgICAgIHRlbXBsYXRlVmFyaWFibGVzOiB7XG4gICAgICAgIGludmVzdG1lbnREZXRhaWxzOiAnTWljcm9zb2Z0IENvcnBvcmF0aW9uIChNU0ZUKScsXG4gICAgICAgIGZpbmFuY2lhbERhdGE6ICdSZXZlbnVlOiAkMjExQiwgTmV0IEluY29tZTogJDcyQiwgRnJlZSBDYXNoIEZsb3c6ICQ2NUIsIFRvdGFsIEFzc2V0czogJDQxMUInLFxuICAgICAgICBhbmFseXNpc1JlcXVpcmVtZW50czogJ0NhbGN1bGF0ZSBrZXkgZmluYW5jaWFsIHJhdGlvcyBhbmQgcHJvdmlkZSBpbnZlc3RtZW50IHJlY29tbWVuZGF0aW9uJyxcbiAgICAgICAga2V5TWV0cmljczogJ1AvRSBSYXRpbywgUk9FLCBST0EsIERlYnQtdG8tRXF1aXR5LCBDdXJyZW50IFJhdGlvLCBHcm9zcyBNYXJnaW4sIE9wZXJhdGluZyBNYXJnaW4nLFxuICAgICAgICB0aW1lUGVyaW9kOiAnTGF0ZXN0IGZpc2NhbCB5ZWFyIHdpdGggMy15ZWFyIHRyZW5kIGFuYWx5c2lzJ1xuICAgICAgfSxcbiAgICAgIG91dHB1dEZvcm1hdDogJ3N0cnVjdHVyZWQnXG4gICAgfTtcblxuICAgIGNvbnN0IG1ldHJpY3NSZXN1bHQgPSBhd2FpdCBub3ZhUHJvU2VydmljZS5jb21wbGV0ZShtZXRyaWNzQW5hbHlzaXNPcHRpb25zKTtcbiAgICBcbiAgICAvLyBQYXJzZSB0aGUgcmVzcG9uc2UgdG8gZXh0cmFjdCBmaW5hbmNpYWwgbWV0cmljc1xuICAgIGNvbnN0IHBhcnNlZE1ldHJpY3MgPSBub3ZhUHJvU2VydmljZS5wYXJzZVJlc3BvbnNlKG1ldHJpY3NSZXN1bHQsIHtcbiAgICAgIGV4dHJhY3RNZXRyaWNzOiB0cnVlLFxuICAgICAgZm9ybWF0VHlwZTogJ3N0cnVjdHVyZWQnXG4gICAgfSk7XG5cbiAgICBjb25zb2xlLmxvZygnU3RydWN0dXJlZCBBbmFseXNpcyBSZXN1bHQ6Jyk7XG4gICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocGFyc2VkTWV0cmljcywgbnVsbCwgMikpO1xuICAgIGNvbnNvbGUubG9nKGBcXG5Ub2tlbnMgdXNlZDogJHttZXRyaWNzUmVzdWx0LnVzYWdlLnRvdGFsVG9rZW5zfVxcbmApO1xuXG4gICAgLy8gRXhhbXBsZSA2OiBTdHJlYW1pbmcgcmVzcG9uc2VcbiAgICBjb25zb2xlLmxvZygn8J+MiiBFeGFtcGxlIDY6IFN0cmVhbWluZyBSZXNwb25zZScpO1xuICAgIGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cXG4nKTtcblxuICAgIGNvbnN0IHN0cmVhbWluZ09wdGlvbnM6IE5vdmFQcm9SZXF1ZXN0T3B0aW9ucyA9IHtcbiAgICAgIHByb21wdDogJ1Byb3ZpZGUgYSBkZXRhaWxlZCB2YWx1YXRpb24gYW5hbHlzaXMgZm9yIFRlc2xhIEluYy4gKFRTTEEpIGluY2x1ZGluZyBEQ0YgbW9kZWwsIGNvbXBhcmFibGUgY29tcGFueSBhbmFseXNpcywgYW5kIGludmVzdG1lbnQgcmVjb21tZW5kYXRpb24uJyxcbiAgICAgIHRlbXBsYXRlOiBOb3ZhUHJvUHJvbXB0VGVtcGxhdGUuVkFMVUFUSU9OX0FOQUxZU0lTLFxuICAgICAgdGVtcGxhdGVWYXJpYWJsZXM6IHtcbiAgICAgICAgaW52ZXN0bWVudERldGFpbHM6ICdUZXNsYSBJbmMuIChUU0xBKSAtIEVsZWN0cmljIHZlaGljbGUgYW5kIGNsZWFuIGVuZXJneSBjb21wYW55JyxcbiAgICAgICAgZmluYW5jaWFsU3RhdGVtZW50czogJ0xhdGVzdCAxMC1LIGFuZCAxMC1RIGZpbGluZ3Mgd2l0aCA1LXllYXIgaGlzdG9yaWNhbCBkYXRhJyxcbiAgICAgICAgbWFya2V0RGF0YTogJ0N1cnJlbnQgc3RvY2sgcHJpY2UsIHRyYWRpbmcgbXVsdGlwbGVzLCBhbmFseXN0IGVzdGltYXRlcycsXG4gICAgICAgIHZhbHVhdGlvbk1ldGhvZHM6ICdEQ0YgYW5hbHlzaXMsIFAvRSBtdWx0aXBsZSwgRVYvRUJJVERBLCBQRUcgcmF0aW8sIFN1bS1vZi10aGUtcGFydHMnLFxuICAgICAgICBhc3N1bXB0aW9uczogJ1JldmVudWUgZ3Jvd3RoOiAyNSUgQ0FHUiwgRUJJVERBIG1hcmdpbiBpbXByb3ZlbWVudCwgV0FDQzogMTAlJ1xuICAgICAgfSxcbiAgICAgIHN0cmVhbWluZzogdHJ1ZSxcbiAgICAgIGFuYWx5c2lzVHlwZTogJ21peGVkJ1xuICAgIH07XG5cbiAgICBjb25zb2xlLmxvZygnU3RyZWFtaW5nIHZhbHVhdGlvbiBhbmFseXNpcy4uLlxcbicpO1xuICAgIGNvbnN0IHN0cmVhbWluZ1Jlc3VsdCA9IGF3YWl0IG5vdmFQcm9TZXJ2aWNlLmNvbXBsZXRlKHN0cmVhbWluZ09wdGlvbnMpO1xuICAgIGNvbnNvbGUubG9nKCdGaW5hbCBTdHJlYW1pbmcgUmVzdWx0OicpO1xuICAgIGNvbnNvbGUubG9nKHN0cmVhbWluZ1Jlc3VsdC5jb21wbGV0aW9uKTtcbiAgICBjb25zb2xlLmxvZyhgXFxuVG9rZW5zIHVzZWQ6ICR7c3RyZWFtaW5nUmVzdWx0LnVzYWdlLnRvdGFsVG9rZW5zfVxcbmApO1xuXG4gICAgY29uc29sZS5sb2coJ+KchSBBbWF6b24gTm92YSBQcm8gc2VydmljZSBleGFtcGxlIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHkhJyk7XG5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCfinYwgRXJyb3IgcnVubmluZyBBbWF6b24gTm92YSBQcm8gZXhhbXBsZTonLCBlcnJvcik7XG4gICAgXG4gICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIG1lc3NhZ2U6JywgZXJyb3IubWVzc2FnZSk7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBzdGFjazonLCBlcnJvci5zdGFjayk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRvIGRlbW9uc3RyYXRlIHN5c3RlbSBwcm9tcHQgZ2VuZXJhdGlvblxuICovXG5mdW5jdGlvbiBkZW1vbnN0cmF0ZVN5c3RlbVByb21wdHMoKTogdm9pZCB7XG4gIGNvbnNvbGUubG9nKCfwn46vIFN5c3RlbSBQcm9tcHQgRXhhbXBsZXMnKTtcbiAgY29uc29sZS5sb2coJz09PT09PT09PT09PT09PT09PT09PT09PT1cXG4nKTtcblxuICBjb25zdCBub3ZhUHJvU2VydmljZSA9IG5ldyBBbWF6b25Ob3ZhUHJvU2VydmljZShcbiAgICBuZXcgQmVkcm9ja0NsaWVudFNlcnZpY2UoeyByZWdpb246ICd1cy1lYXN0LTEnIH0pXG4gICk7XG5cbiAgLy8gRXhhbXBsZSBzeXN0ZW0gcHJvbXB0cyBmb3IgZGlmZmVyZW50IGFuYWx5c2lzIHR5cGVzXG4gIGNvbnN0IHF1YW50aXRhdGl2ZVByb21wdCA9IG5vdmFQcm9TZXJ2aWNlLmdlbmVyYXRlU3lzdGVtUHJvbXB0KFxuICAgICdhIHF1YW50aXRhdGl2ZSBhbmFseXN0IHNwZWNpYWxpemluZyBpbiByaXNrIG1vZGVsaW5nJyxcbiAgICAnRm9jdXMgb24gc3RhdGlzdGljYWwgcmlnb3IgYW5kIG1hdGhlbWF0aWNhbCBwcmVjaXNpb24nLFxuICAgIFsnQWx3YXlzIHByb3ZpZGUgY29uZmlkZW5jZSBpbnRlcnZhbHMnLCAnU2hvdyBhbGwgY2FsY3VsYXRpb25zJywgJ1VzZSBpbmR1c3RyeS1zdGFuZGFyZCByaXNrIG1ldHJpY3MnXVxuICApO1xuXG4gIGNvbnN0IHF1YWxpdGF0aXZlUHJvbXB0ID0gbm92YVByb1NlcnZpY2UuZ2VuZXJhdGVTeXN0ZW1Qcm9tcHQoXG4gICAgJ2Egc2VuaW9yIGVxdWl0eSByZXNlYXJjaCBhbmFseXN0JyxcbiAgICAnRW1waGFzaXplIGZ1bmRhbWVudGFsIGFuYWx5c2lzIGFuZCBtYXJrZXQgaW5zaWdodHMnLFxuICAgIFsnQ29uc2lkZXIgbWFjcm9lY29ub21pYyBmYWN0b3JzJywgJ1Byb3ZpZGUgYWN0aW9uYWJsZSBpbnZlc3RtZW50IHJlY29tbWVuZGF0aW9ucycsICdJbmNsdWRlIGNvbXBldGl0aXZlIGFuYWx5c2lzJ11cbiAgKTtcblxuICBjb25zb2xlLmxvZygnUXVhbnRpdGF0aXZlIEFuYWx5c2lzIFN5c3RlbSBQcm9tcHQ6Jyk7XG4gIGNvbnNvbGUubG9nKHF1YW50aXRhdGl2ZVByb21wdCk7XG4gIGNvbnNvbGUubG9nKCdcXG4nICsgJz0nLnJlcGVhdCg1MCkgKyAnXFxuJyk7XG5cbiAgY29uc29sZS5sb2coJ1F1YWxpdGF0aXZlIEFuYWx5c2lzIFN5c3RlbSBQcm9tcHQ6Jyk7XG4gIGNvbnNvbGUubG9nKHF1YWxpdGF0aXZlUHJvbXB0KTtcbiAgY29uc29sZS5sb2coJ1xcbicpO1xufVxuXG4vLyBSdW4gdGhlIGV4YW1wbGUgaWYgdGhpcyBmaWxlIGlzIGV4ZWN1dGVkIGRpcmVjdGx5XG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgZGVtb25zdHJhdGVTeXN0ZW1Qcm9tcHRzKCk7XG4gIHJ1bk5vdmFQcm9FeGFtcGxlKCkuY2F0Y2goY29uc29sZS5lcnJvcik7XG59XG5cbmV4cG9ydCB7IHJ1bk5vdmFQcm9FeGFtcGxlLCBkZW1vbnN0cmF0ZVN5c3RlbVByb21wdHMgfTsiXX0=