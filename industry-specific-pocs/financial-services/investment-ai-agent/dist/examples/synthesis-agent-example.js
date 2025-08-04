"use strict";
/**
 * Synthesis Agent Example
 *
 * This example demonstrates how to use the Synthesis Agent to integrate
 * analysis results from multiple agents and generate comprehensive
 * investment narratives with visualizations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.demonstrateMessageHandling = exports.runSynthesisAgentExample = void 0;
const synthesis_agent_1 = require("../services/ai/synthesis-agent");
const claude_sonnet_service_1 = require("../services/ai/claude-sonnet-service");
const bedrock_client_1 = require("../services/ai/bedrock-client");
async function runSynthesisAgentExample() {
    console.log('🔄 Starting Synthesis Agent Example...\n');
    try {
        // Initialize services
        const bedrockClient = new bedrock_client_1.BedrockClientService({
            region: 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test-key',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test-secret'
            }
        });
        const claudeSonnetService = new claude_sonnet_service_1.ClaudeSonnetService(bedrockClient);
        const synthesisAgent = new synthesis_agent_1.SynthesisAgent(claudeSonnetService);
        // Mock analysis results from different agents
        const mockAnalysisResults = [
            {
                id: 'fundamental-analysis-1',
                investmentId: 'AAPL',
                analysisType: 'fundamental',
                timestamp: new Date(),
                analyst: 'analysis-agent-nova-pro',
                summary: 'Apple Inc. shows strong fundamental metrics with consistent revenue growth, solid balance sheet, and strong market position in consumer electronics.',
                confidence: 0.88,
                details: {
                    strengths: [
                        'Strong brand loyalty and ecosystem',
                        'Consistent revenue growth of 8% annually',
                        'Robust cash flow generation',
                        'Strong balance sheet with low debt'
                    ],
                    weaknesses: [
                        'High valuation multiples',
                        'Dependence on iPhone sales',
                        'Regulatory scrutiny in multiple markets'
                    ],
                    opportunities: [
                        'Services revenue expansion',
                        'Emerging markets penetration',
                        'AR/VR technology development',
                        'Electric vehicle market entry'
                    ],
                    threats: [
                        'Intense competition in smartphone market',
                        'Supply chain disruptions',
                        'Economic downturn impact on consumer spending',
                        'Regulatory changes affecting app store'
                    ],
                    keyMetrics: {
                        'P/E Ratio': 28.5,
                        'Revenue Growth': 0.08,
                        'Profit Margin': 0.25,
                        'ROE': 0.84,
                        'Debt/Equity': 0.31,
                        'Free Cash Flow': 92000000000
                    },
                    narratives: [
                        'Apple demonstrates exceptional financial performance with strong fundamentals supporting long-term growth potential.',
                        'The company\'s ecosystem approach creates significant competitive advantages and customer retention.',
                        'While valuation appears elevated, strong execution and market position justify premium pricing.'
                    ]
                },
                recommendations: [
                    {
                        action: 'buy',
                        timeHorizon: 'long',
                        confidence: 0.85,
                        rationale: 'Strong fundamentals and market position support long-term investment thesis despite current valuation concerns'
                    }
                ],
                dataPoints: [
                    {
                        source: 'financial-statements-q3-2024',
                        type: 'fundamental',
                        value: {
                            revenue: 394328000000,
                            netIncome: 99803000000,
                            totalAssets: 364980000000,
                            totalDebt: 111109000000
                        },
                        timestamp: new Date('2024-07-31'),
                        reliability: 0.98
                    }
                ]
            },
            {
                id: 'technical-analysis-1',
                investmentId: 'AAPL',
                analysisType: 'technical',
                timestamp: new Date(),
                analyst: 'analysis-agent-nova-pro',
                summary: 'Technical analysis indicates bullish momentum with strong support levels and positive trend indicators suggesting continued upward movement.',
                confidence: 0.76,
                details: {
                    strengths: [
                        'Price above all major moving averages',
                        'Strong volume confirmation on breakouts',
                        'RSI in healthy range (45-65)',
                        'MACD showing bullish crossover'
                    ],
                    weaknesses: [
                        'Approaching resistance at $200 level',
                        'Some divergence in momentum indicators',
                        'Overbought conditions in short-term'
                    ],
                    opportunities: [
                        'Breakout above $200 could target $220',
                        'Strong support at $180 provides downside protection',
                        'Seasonal strength typically seen in Q4'
                    ],
                    threats: [
                        'Market-wide correction could impact momentum',
                        'Failure to break resistance could lead to consolidation',
                        'High correlation with tech sector volatility'
                    ],
                    keyMetrics: {
                        'Current Price': 195.50,
                        'MA50': 185.20,
                        'MA200': 175.80,
                        'RSI': 58.3,
                        'MACD': 2.15,
                        'Volume (20-day avg)': 45200000,
                        'Support Level': 180.00,
                        'Resistance Level': 200.00
                    },
                    narratives: [
                        'Technical indicators align to suggest continued bullish momentum with strong underlying support.',
                        'The stock has successfully maintained its uptrend with consistent volume confirmation.',
                        'Key resistance at $200 represents critical level for next phase of price appreciation.'
                    ]
                },
                recommendations: [
                    {
                        action: 'buy',
                        timeHorizon: 'short',
                        confidence: 0.72,
                        rationale: 'Technical momentum supports entry with defined risk management levels'
                    }
                ],
                dataPoints: [
                    {
                        source: 'market-data-real-time',
                        type: 'technical',
                        value: {
                            price: 195.50,
                            volume: 52300000,
                            high: 197.20,
                            low: 194.10,
                            rsi: 58.3,
                            macd: 2.15
                        },
                        timestamp: new Date(),
                        reliability: 0.95
                    }
                ]
            },
            {
                id: 'sentiment-analysis-1',
                investmentId: 'AAPL',
                analysisType: 'sentiment',
                timestamp: new Date(),
                analyst: 'research-agent-claude-haiku',
                summary: 'Market sentiment remains positive with strong analyst coverage and institutional support, though some concerns about valuation persist.',
                confidence: 0.71,
                details: {
                    strengths: [
                        'Strong institutional ownership at 60%',
                        'Positive analyst revisions in recent quarter',
                        'High consumer satisfaction scores',
                        'Strong brand sentiment in social media'
                    ],
                    weaknesses: [
                        'Some valuation concerns among value investors',
                        'Mixed sentiment on new product launches',
                        'Regulatory scrutiny creating uncertainty'
                    ],
                    opportunities: [
                        'Potential for sentiment improvement with new products',
                        'ESG initiatives gaining positive attention',
                        'AI integration story resonating with investors'
                    ],
                    threats: [
                        'Negative sentiment from trade tensions',
                        'Consumer spending concerns in economic uncertainty',
                        'Competitive pressure affecting perception'
                    ],
                    keyMetrics: {
                        'Analyst Rating': 4.2,
                        'Buy Recommendations': 28,
                        'Hold Recommendations': 8,
                        'Sell Recommendations': 2,
                        'Social Sentiment Score': 0.65,
                        'News Sentiment': 0.58,
                        'Institutional Ownership': 0.60
                    },
                    narratives: [
                        'Overall sentiment remains constructive with strong institutional support and positive analyst coverage.',
                        'Consumer brand strength continues to drive positive sentiment despite broader market concerns.',
                        'AI and innovation narrative providing additional sentiment support for technology investors.'
                    ]
                },
                recommendations: [
                    {
                        action: 'hold',
                        timeHorizon: 'medium',
                        confidence: 0.68,
                        rationale: 'Positive sentiment supports current position but limited upside from sentiment alone'
                    }
                ],
                dataPoints: [
                    {
                        source: 'sentiment-aggregator',
                        type: 'sentiment',
                        value: {
                            overallSentiment: 'positive',
                            sentimentScore: 0.65,
                            analystRating: 4.2,
                            socialMentions: 15420,
                            newsArticles: 342
                        },
                        timestamp: new Date(),
                        reliability: 0.78
                    }
                ]
            }
        ];
        // Mock research findings
        const mockResearchFindings = [
            {
                source: 'research-agent',
                type: 'market-research',
                findings: 'Smartphone market showing signs of stabilization with premium segment growth. Apple maintaining market share leadership in premium category.',
                confidence: 0.82,
                timestamp: new Date(),
                citations: ['IDC Market Report Q3 2024', 'Gartner Smartphone Analysis']
            },
            {
                source: 'research-agent',
                type: 'competitive-analysis',
                findings: 'Apple\'s services revenue continues to grow at 16% annually, providing recurring revenue stream and higher margins than hardware.',
                confidence: 0.89,
                timestamp: new Date(),
                citations: ['Apple Q3 2024 Earnings', 'Services Revenue Analysis']
            },
            {
                source: 'research-agent',
                type: 'industry-trends',
                findings: 'AI integration in consumer devices accelerating, with Apple well-positioned through chip design capabilities and ecosystem integration.',
                confidence: 0.75,
                timestamp: new Date(),
                citations: ['AI Market Trends 2024', 'Semiconductor Industry Report']
            }
        ];
        // Mock compliance checks
        const mockComplianceChecks = [
            {
                compliant: true,
                issues: [],
                regulationsChecked: ['SEC Regulation FD', 'FINRA Rule 2111', 'Investment Advisers Act'],
                riskAssessment: {
                    overallRisk: 'medium',
                    riskFactors: [
                        'Market volatility risk',
                        'Concentration risk in technology sector',
                        'Regulatory risk from antitrust scrutiny'
                    ],
                    mitigationStrategies: [
                        'Diversification across asset classes',
                        'Position sizing appropriate to risk tolerance',
                        'Regular monitoring of regulatory developments'
                    ]
                },
                esgConsiderations: {
                    environmentalScore: 8.2,
                    socialScore: 7.8,
                    governanceScore: 8.5,
                    overallESGRating: 'A-',
                    keyIssues: ['Supply chain sustainability', 'Data privacy practices'],
                    positiveFactors: ['Renewable energy commitment', 'Diversity initiatives']
                },
                timestamp: new Date()
            }
        ];
        // Create synthesis request
        const synthesisRequest = {
            analysisResults: mockAnalysisResults,
            researchFindings: mockResearchFindings,
            complianceChecks: mockComplianceChecks,
            userPreferences: {
                investmentHorizon: 'medium',
                riskTolerance: 'moderate',
                preferredSectors: ['Technology', 'Consumer Discretionary'],
                excludedInvestments: ['Tobacco', 'Weapons', 'Fossil Fuels']
            },
            outputFormat: 'detailed',
            includeVisualizations: true
        };
        console.log('📊 Processing synthesis request...');
        // Process the synthesis request
        const synthesisResponse = await synthesisAgent.processSynthesisRequest(synthesisRequest);
        console.log('\n✅ Synthesis completed successfully!\n');
        // Display results
        console.log('📈 INVESTMENT IDEAS GENERATED:');
        console.log(`Number of ideas: ${synthesisResponse.investmentIdeas.length}`);
        console.log(`Overall confidence: ${(synthesisResponse.confidence * 100).toFixed(1)}%`);
        console.log(`Coherence score: ${(synthesisResponse.coherenceScore * 100).toFixed(1)}%\n`);
        // Show executive summary
        console.log('📋 EXECUTIVE SUMMARY:');
        console.log(synthesisResponse.executiveSummary);
        console.log('\n');
        // Show key insights
        console.log('💡 KEY INSIGHTS:');
        synthesisResponse.keyInsights.forEach((insight, index) => {
            console.log(`${index + 1}. ${insight}`);
        });
        console.log('\n');
        // Show investment ideas
        console.log('🎯 INVESTMENT OPPORTUNITIES:');
        synthesisResponse.investmentIdeas.forEach((idea, index) => {
            console.log(`\n${index + 1}. ${idea.title}`);
            console.log(`   Description: ${idea.description.substring(0, 150)}...`);
            console.log(`   Strategy: ${idea.strategy.toUpperCase()}`);
            console.log(`   Time Horizon: ${idea.timeHorizon}`);
            console.log(`   Confidence: ${(idea.confidenceScore * 100).toFixed(1)}%`);
            console.log(`   Rationale: ${idea.rationale}`);
            console.log('   Potential Outcomes:');
            idea.potentialOutcomes.forEach((outcome) => {
                console.log(`     - ${outcome.scenario}: ${(outcome.returnEstimate * 100).toFixed(1)}% (${(outcome.probability * 100).toFixed(0)}% probability)`);
            });
        });
        // Show recommendations
        console.log('\n🎯 SYNTHESIS RECOMMENDATIONS:');
        synthesisResponse.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec.action.toUpperCase()} ${rec.investment} (${rec.priority} priority)`);
            console.log(`   Rationale: ${rec.rationale}`);
            console.log(`   Confidence: ${(rec.confidence * 100).toFixed(1)}%`);
            console.log(`   Timeframe: ${rec.timeframe}\n`);
        });
        // Show risk summary
        console.log('⚠️  RISK ASSESSMENT:');
        console.log(synthesisResponse.riskSummary);
        console.log('\n');
        // Show visualizations
        if (synthesisResponse.visualizations.length > 0) {
            console.log('📊 VISUALIZATIONS GENERATED:');
            synthesisResponse.visualizations.forEach((viz, index) => {
                console.log(`${index + 1}. ${viz.title} (${viz.type})`);
                console.log(`   Description: ${viz.description}`);
                console.log(`   Priority: ${viz.priority}`);
                if (viz.config.chartType) {
                    console.log(`   Chart Type: ${viz.config.chartType}`);
                }
                console.log(`   Dimensions: ${viz.config.dimensions.width}x${viz.config.dimensions.height}`);
                console.log('');
            });
        }
        // Demonstrate different output formats
        console.log('📄 GENERATING DIFFERENT OUTPUT FORMATS...\n');
        // Generate Markdown format
        console.log('📝 Markdown Format:');
        const markdownOutput = await synthesisAgent.formatOutput(synthesisResponse, 'markdown');
        console.log(markdownOutput.substring(0, 500) + '...\n');
        // Generate HTML format
        console.log('🌐 HTML Format:');
        const htmlOutput = await synthesisAgent.formatOutput(synthesisResponse, 'html');
        console.log('HTML output generated (length: ' + htmlOutput.length + ' characters)\n');
        // Performance metrics
        console.log('⚡ PERFORMANCE METRICS:');
        console.log(`Execution time: ${synthesisResponse.executionTime}ms`);
        console.log(`Processing speed: ${(mockAnalysisResults.length / (synthesisResponse.executionTime / 1000)).toFixed(2)} analyses/second`);
        console.log('\n✨ Synthesis Agent Example completed successfully!');
    }
    catch (error) {
        console.error('❌ Error in Synthesis Agent Example:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Stack trace:', error.stack);
        }
    }
}
exports.runSynthesisAgentExample = runSynthesisAgentExample;
// Demonstrate agent message handling
async function demonstrateMessageHandling() {
    console.log('\n🔄 Demonstrating Agent Message Handling...\n');
    try {
        const bedrockClient = new bedrock_client_1.BedrockClientService({
            region: 'us-east-1',
            credentials: {
                accessKeyId: 'test-key',
                secretAccessKey: 'test-secret'
            }
        });
        const claudeSonnetService = new claude_sonnet_service_1.ClaudeSonnetService(bedrockClient);
        const synthesisAgent = new synthesis_agent_1.SynthesisAgent(claudeSonnetService);
        // Create a sample message from supervisor agent
        const message = {
            sender: 'supervisor',
            recipient: 'synthesis',
            messageType: 'request',
            content: {
                type: 'synthesis',
                request: {
                    analysisResults: [],
                    researchFindings: [],
                    complianceChecks: [],
                    userPreferences: {
                        investmentHorizon: 'medium',
                        riskTolerance: 'moderate'
                    },
                    outputFormat: 'summary',
                    includeVisualizations: false
                }
            },
            metadata: {
                priority: 'high',
                timestamp: new Date(),
                conversationId: 'conv-example-123',
                requestId: 'req-synthesis-456'
            }
        };
        console.log('📨 Sending message to Synthesis Agent:');
        console.log(JSON.stringify(message, null, 2));
        const response = await synthesisAgent.handleMessage(message);
        console.log('\n📬 Received response from Synthesis Agent:');
        console.log('Sender:', response.sender);
        console.log('Recipient:', response.recipient);
        console.log('Message Type:', response.messageType);
        console.log('Response Content Keys:', Object.keys(response.content));
        console.log('\n✅ Message handling demonstration completed!');
    }
    catch (error) {
        console.error('❌ Error in message handling demonstration:', error);
    }
}
exports.demonstrateMessageHandling = demonstrateMessageHandling;
// Run the example
if (require.main === module) {
    runSynthesisAgentExample()
        .then(() => demonstrateMessageHandling())
        .catch(console.error);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ludGhlc2lzLWFnZW50LWV4YW1wbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhhbXBsZXMvc3ludGhlc2lzLWFnZW50LWV4YW1wbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsb0VBQWtGO0FBQ2xGLGdGQUEyRTtBQUMzRSxrRUFBcUU7QUFHckUsS0FBSyxVQUFVLHdCQUF3QjtJQUNyQyxPQUFPLENBQUMsR0FBRyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7SUFFeEQsSUFBSTtRQUNGLHNCQUFzQjtRQUN0QixNQUFNLGFBQWEsR0FBRyxJQUFJLHFDQUFvQixDQUFDO1lBQzdDLE1BQU0sRUFBRSxXQUFXO1lBQ25CLFdBQVcsRUFBRTtnQkFDWCxXQUFXLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsSUFBSSxVQUFVO2dCQUN4RCxlQUFlLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsSUFBSSxhQUFhO2FBQ3BFO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLDJDQUFtQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ25FLE1BQU0sY0FBYyxHQUFHLElBQUksZ0NBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBRS9ELDhDQUE4QztRQUM5QyxNQUFNLG1CQUFtQixHQUFxQjtZQUM1QztnQkFDRSxFQUFFLEVBQUUsd0JBQXdCO2dCQUM1QixZQUFZLEVBQUUsTUFBTTtnQkFDcEIsWUFBWSxFQUFFLGFBQWE7Z0JBQzNCLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRTtnQkFDckIsT0FBTyxFQUFFLHlCQUF5QjtnQkFDbEMsT0FBTyxFQUFFLHNKQUFzSjtnQkFDL0osVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLE9BQU8sRUFBRTtvQkFDUCxTQUFTLEVBQUU7d0JBQ1Qsb0NBQW9DO3dCQUNwQywwQ0FBMEM7d0JBQzFDLDZCQUE2Qjt3QkFDN0Isb0NB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Q0FBQyxPQUFPLENBQUMsQ0FBQztRQUU3RCxPQUFPLENBQUMsR0FBRyxDQUFDLDhDQUE4QyxDQUFDLENBQUM7UUFDNUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM5QyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDbkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBRXJFLE9BQU8sQ0FBQyxHQUFHLENBQUMsK0NBQStDLENBQUMsQ0FBQztLQUU5RDtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQyw0Q0FBNEMsRUFBRSxLQUFLLENBQUMsQ0FBQztLQUNwRTtBQUNILENBQUM7QUFTa0MsZ0VBQTBCO0FBUDdELGtCQUFrQjtBQUNsQixJQUFJLE9BQU8sQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFO0lBQzNCLHdCQUF3QixFQUFFO1NBQ3ZCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQywwQkFBMEIsRUFBRSxDQUFDO1NBQ3hDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDekIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFN5bnRoZXNpcyBBZ2VudCBFeGFtcGxlXG4gKiBcbiAqIFRoaXMgZXhhbXBsZSBkZW1vbnN0cmF0ZXMgaG93IHRvIHVzZSB0aGUgU3ludGhlc2lzIEFnZW50IHRvIGludGVncmF0ZVxuICogYW5hbHlzaXMgcmVzdWx0cyBmcm9tIG11bHRpcGxlIGFnZW50cyBhbmQgZ2VuZXJhdGUgY29tcHJlaGVuc2l2ZVxuICogaW52ZXN0bWVudCBuYXJyYXRpdmVzIHdpdGggdmlzdWFsaXphdGlvbnMuXG4gKi9cblxuaW1wb3J0IHsgU3ludGhlc2lzQWdlbnQsIFN5bnRoZXNpc1JlcXVlc3QgfSBmcm9tICcuLi9zZXJ2aWNlcy9haS9zeW50aGVzaXMtYWdlbnQnO1xuaW1wb3J0IHsgQ2xhdWRlU29ubmV0U2VydmljZSB9IGZyb20gJy4uL3NlcnZpY2VzL2FpL2NsYXVkZS1zb25uZXQtc2VydmljZSc7XG5pbXBvcnQgeyBCZWRyb2NrQ2xpZW50U2VydmljZSB9IGZyb20gJy4uL3NlcnZpY2VzL2FpL2JlZHJvY2stY2xpZW50JztcbmltcG9ydCB7IEFuYWx5c2lzUmVzdWx0IH0gZnJvbSAnLi4vbW9kZWxzL2FuYWx5c2lzJztcblxuYXN5bmMgZnVuY3Rpb24gcnVuU3ludGhlc2lzQWdlbnRFeGFtcGxlKCkge1xuICBjb25zb2xlLmxvZygn8J+UhCBTdGFydGluZyBTeW50aGVzaXMgQWdlbnQgRXhhbXBsZS4uLlxcbicpO1xuXG4gIHRyeSB7XG4gICAgLy8gSW5pdGlhbGl6ZSBzZXJ2aWNlc1xuICAgIGNvbnN0IGJlZHJvY2tDbGllbnQgPSBuZXcgQmVkcm9ja0NsaWVudFNlcnZpY2Uoe1xuICAgICAgcmVnaW9uOiAndXMtZWFzdC0xJyxcbiAgICAgIGNyZWRlbnRpYWxzOiB7XG4gICAgICAgIGFjY2Vzc0tleUlkOiBwcm9jZXNzLmVudi5BV1NfQUNDRVNTX0tFWV9JRCB8fCAndGVzdC1rZXknLFxuICAgICAgICBzZWNyZXRBY2Nlc3NLZXk6IHByb2Nlc3MuZW52LkFXU19TRUNSRVRfQUNDRVNTX0tFWSB8fCAndGVzdC1zZWNyZXQnXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBjbGF1ZGVTb25uZXRTZXJ2aWNlID0gbmV3IENsYXVkZVNvbm5ldFNlcnZpY2UoYmVkcm9ja0NsaWVudCk7XG4gICAgY29uc3Qgc3ludGhlc2lzQWdlbnQgPSBuZXcgU3ludGhlc2lzQWdlbnQoY2xhdWRlU29ubmV0U2VydmljZSk7XG5cbiAgICAvLyBNb2NrIGFuYWx5c2lzIHJlc3VsdHMgZnJvbSBkaWZmZXJlbnQgYWdlbnRzXG4gICAgY29uc3QgbW9ja0FuYWx5c2lzUmVzdWx0czogQW5hbHlzaXNSZXN1bHRbXSA9IFtcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdmdW5kYW1lbnRhbC1hbmFseXNpcy0xJyxcbiAgICAgICAgaW52ZXN0bWVudElkOiAnQUFQTCcsXG4gICAgICAgIGFuYWx5c2lzVHlwZTogJ2Z1bmRhbWVudGFsJyxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICBhbmFseXN0OiAnYW5hbHlzaXMtYWdlbnQtbm92YS1wcm8nLFxuICAgICAgICBzdW1tYXJ5OiAnQXBwbGUgSW5jLiBzaG93cyBzdHJvbmcgZnVuZGFtZW50YWwgbWV0cmljcyB3aXRoIGNvbnNpc3RlbnQgcmV2ZW51ZSBncm93dGgsIHNvbGlkIGJhbGFuY2Ugc2hlZXQsIGFuZCBzdHJvbmcgbWFya2V0IHBvc2l0aW9uIGluIGNvbnN1bWVyIGVsZWN0cm9uaWNzLicsXG4gICAgICAgIGNvbmZpZGVuY2U6IDAuODgsXG4gICAgICAgIGRldGFpbHM6IHtcbiAgICAgICAgICBzdHJlbmd0aHM6IFtcbiAgICAgICAgICAgICdTdHJvbmcgYnJhbmQgbG95YWx0eSBhbmQgZWNvc3lzdGVtJyxcbiAgICAgICAgICAgICdDb25zaXN0ZW50IHJldmVudWUgZ3Jvd3RoIG9mIDglIGFubnVhbGx5JyxcbiAgICAgICAgICAgICdSb2J1c3QgY2FzaCBmbG93IGdlbmVyYXRpb24nLFxuICAgICAgICAgICAgJ1N0cm9uZyBiYWxhbmNlIHNoZWV0IHdpdGggbG93IGRlYnQnXG4gICAgICAgICAgXSxcbiAgICAgICAgICB3ZWFrbmVzc2VzOiBbXG4gICAgICAgICAgICAnSGlnaCB2YWx1YXRpb24gbXVsdGlwbGVzJyxcbiAgICAgICAgICAgICdEZXBlbmRlbmNlIG9uIGlQaG9uZSBzYWxlcycsXG4gICAgICAgICAgICAnUmVndWxhdG9yeSBzY3J1dGlueSBpbiBtdWx0aXBsZSBtYXJrZXRzJ1xuICAgICAgICAgIF0sXG4gICAgICAgICAgb3Bwb3J0dW5pdGllczogW1xuICAgICAgICAgICAgJ1NlcnZpY2VzIHJldmVudWUgZXhwYW5zaW9uJyxcbiAgICAgICAgICAgICdFbWVyZ2luZyBtYXJrZXRzIHBlbmV0cmF0aW9uJyxcbiAgICAgICAgICAgICdBUi9WUiB0ZWNobm9sb2d5IGRldmVsb3BtZW50JyxcbiAgICAgICAgICAgICdFbGVjdHJpYyB2ZWhpY2xlIG1hcmtldCBlbnRyeSdcbiAgICAgICAgICBdLFxuICAgICAgICAgIHRocmVhdHM6IFtcbiAgICAgICAgICAgICdJbnRlbnNlIGNvbXBldGl0aW9uIGluIHNtYXJ0cGhvbmUgbWFya2V0JyxcbiAgICAgICAgICAgICdTdXBwbHkgY2hhaW4gZGlzcnVwdGlvbnMnLFxuICAgICAgICAgICAgJ0Vjb25vbWljIGRvd250dXJuIGltcGFjdCBvbiBjb25zdW1lciBzcGVuZGluZycsXG4gICAgICAgICAgICAnUmVndWxhdG9yeSBjaGFuZ2VzIGFmZmVjdGluZyBhcHAgc3RvcmUnXG4gICAgICAgICAgXSxcbiAgICAgICAgICBrZXlNZXRyaWNzOiB7XG4gICAgICAgICAgICAnUC9FIFJhdGlvJzogMjguNSxcbiAgICAgICAgICAgICdSZXZlbnVlIEdyb3d0aCc6IDAuMDgsXG4gICAgICAgICAgICAnUHJvZml0IE1hcmdpbic6IDAuMjUsXG4gICAgICAgICAgICAnUk9FJzogMC44NCxcbiAgICAgICAgICAgICdEZWJ0L0VxdWl0eSc6IDAuMzEsXG4gICAgICAgICAgICAnRnJlZSBDYXNoIEZsb3cnOiA5MjAwMDAwMDAwMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgbmFycmF0aXZlczogW1xuICAgICAgICAgICAgJ0FwcGxlIGRlbW9uc3RyYXRlcyBleGNlcHRpb25hbCBmaW5hbmNpYWwgcGVyZm9ybWFuY2Ugd2l0aCBzdHJvbmcgZnVuZGFtZW50YWxzIHN1cHBvcnRpbmcgbG9uZy10ZXJtIGdyb3d0aCBwb3RlbnRpYWwuJyxcbiAgICAgICAgICAgICdUaGUgY29tcGFueVxcJ3MgZWNvc3lzdGVtIGFwcHJvYWNoIGNyZWF0ZXMgc2lnbmlmaWNhbnQgY29tcGV0aXRpdmUgYWR2YW50YWdlcyBhbmQgY3VzdG9tZXIgcmV0ZW50aW9uLicsXG4gICAgICAgICAgICAnV2hpbGUgdmFsdWF0aW9uIGFwcGVhcnMgZWxldmF0ZWQsIHN0cm9uZyBleGVjdXRpb24gYW5kIG1hcmtldCBwb3NpdGlvbiBqdXN0aWZ5IHByZW1pdW0gcHJpY2luZy4nXG4gICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICByZWNvbW1lbmRhdGlvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBhY3Rpb246ICdidXknLFxuICAgICAgICAgICAgdGltZUhvcml6b246ICdsb25nJyxcbiAgICAgICAgICAgIGNvbmZpZGVuY2U6IDAuODUsXG4gICAgICAgICAgICByYXRpb25hbGU6ICdTdHJvbmcgZnVuZGFtZW50YWxzIGFuZCBtYXJrZXQgcG9zaXRpb24gc3VwcG9ydCBsb25nLXRlcm0gaW52ZXN0bWVudCB0aGVzaXMgZGVzcGl0ZSBjdXJyZW50IHZhbHVhdGlvbiBjb25jZXJucydcbiAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIGRhdGFQb2ludHM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzb3VyY2U6ICdmaW5hbmNpYWwtc3RhdGVtZW50cy1xMy0yMDI0JyxcbiAgICAgICAgICAgIHR5cGU6ICdmdW5kYW1lbnRhbCcsXG4gICAgICAgICAgICB2YWx1ZToge1xuICAgICAgICAgICAgICByZXZlbnVlOiAzOTQzMjgwMDAwMDAsXG4gICAgICAgICAgICAgIG5ldEluY29tZTogOTk4MDMwMDAwMDAsXG4gICAgICAgICAgICAgIHRvdGFsQXNzZXRzOiAzNjQ5ODAwMDAwMDAsXG4gICAgICAgICAgICAgIHRvdGFsRGVidDogMTExMTA5MDAwMDAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgnMjAyNC0wNy0zMScpLFxuICAgICAgICAgICAgcmVsaWFiaWxpdHk6IDAuOThcbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGlkOiAndGVjaG5pY2FsLWFuYWx5c2lzLTEnLFxuICAgICAgICBpbnZlc3RtZW50SWQ6ICdBQVBMJyxcbiAgICAgICAgYW5hbHlzaXNUeXBlOiAndGVjaG5pY2FsJyxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICBhbmFseXN0OiAnYW5hbHlzaXMtYWdlbnQtbm92YS1wcm8nLFxuICAgICAgICBzdW1tYXJ5OiAnVGVjaG5pY2FsIGFuYWx5c2lzIGluZGljYXRlcyBidWxsaXNoIG1vbWVudHVtIHdpdGggc3Ryb25nIHN1cHBvcnQgbGV2ZWxzIGFuZCBwb3NpdGl2ZSB0cmVuZCBpbmRpY2F0b3JzIHN1Z2dlc3RpbmcgY29udGludWVkIHVwd2FyZCBtb3ZlbWVudC4nLFxuICAgICAgICBjb25maWRlbmNlOiAwLjc2LFxuICAgICAgICBkZXRhaWxzOiB7XG4gICAgICAgICAgc3RyZW5ndGhzOiBbXG4gICAgICAgICAgICAnUHJpY2UgYWJvdmUgYWxsIG1ham9yIG1vdmluZyBhdmVyYWdlcycsXG4gICAgICAgICAgICAnU3Ryb25nIHZvbHVtZSBjb25maXJtYXRpb24gb24gYnJlYWtvdXRzJyxcbiAgICAgICAgICAgICdSU0kgaW4gaGVhbHRoeSByYW5nZSAoNDUtNjUpJyxcbiAgICAgICAgICAgICdNQUNEIHNob3dpbmcgYnVsbGlzaCBjcm9zc292ZXInXG4gICAgICAgICAgXSxcbiAgICAgICAgICB3ZWFrbmVzc2VzOiBbXG4gICAgICAgICAgICAnQXBwcm9hY2hpbmcgcmVzaXN0YW5jZSBhdCAkMjAwIGxldmVsJyxcbiAgICAgICAgICAgICdTb21lIGRpdmVyZ2VuY2UgaW4gbW9tZW50dW0gaW5kaWNhdG9ycycsXG4gICAgICAgICAgICAnT3ZlcmJvdWdodCBjb25kaXRpb25zIGluIHNob3J0LXRlcm0nXG4gICAgICAgICAgXSxcbiAgICAgICAgICBvcHBvcnR1bml0aWVzOiBbXG4gICAgICAgICAgICAnQnJlYWtvdXQgYWJvdmUgJDIwMCBjb3VsZCB0YXJnZXQgJDIyMCcsXG4gICAgICAgICAgICAnU3Ryb25nIHN1cHBvcnQgYXQgJDE4MCBwcm92aWRlcyBkb3duc2lkZSBwcm90ZWN0aW9uJyxcbiAgICAgICAgICAgICdTZWFzb25hbCBzdHJlbmd0aCB0eXBpY2FsbHkgc2VlbiBpbiBRNCdcbiAgICAgICAgICBdLFxuICAgICAgICAgIHRocmVhdHM6IFtcbiAgICAgICAgICAgICdNYXJrZXQtd2lkZSBjb3JyZWN0aW9uIGNvdWxkIGltcGFjdCBtb21lbnR1bScsXG4gICAgICAgICAgICAnRmFpbHVyZSB0byBicmVhayByZXNpc3RhbmNlIGNvdWxkIGxlYWQgdG8gY29uc29saWRhdGlvbicsXG4gICAgICAgICAgICAnSGlnaCBjb3JyZWxhdGlvbiB3aXRoIHRlY2ggc2VjdG9yIHZvbGF0aWxpdHknXG4gICAgICAgICAgXSxcbiAgICAgICAgICBrZXlNZXRyaWNzOiB7XG4gICAgICAgICAgICAnQ3VycmVudCBQcmljZSc6IDE5NS41MCxcbiAgICAgICAgICAgICdNQTUwJzogMTg1LjIwLFxuICAgICAgICAgICAgJ01BMjAwJzogMTc1LjgwLFxuICAgICAgICAgICAgJ1JTSSc6IDU4LjMsXG4gICAgICAgICAgICAnTUFDRCc6IDIuMTUsXG4gICAgICAgICAgICAnVm9sdW1lICgyMC1kYXkgYXZnKSc6IDQ1MjAwMDAwLFxuICAgICAgICAgICAgJ1N1cHBvcnQgTGV2ZWwnOiAxODAuMDAsXG4gICAgICAgICAgICAnUmVzaXN0YW5jZSBMZXZlbCc6IDIwMC4wMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgbmFycmF0aXZlczogW1xuICAgICAgICAgICAgJ1RlY2huaWNhbCBpbmRpY2F0b3JzIGFsaWduIHRvIHN1Z2dlc3QgY29udGludWVkIGJ1bGxpc2ggbW9tZW50dW0gd2l0aCBzdHJvbmcgdW5kZXJseWluZyBzdXBwb3J0LicsXG4gICAgICAgICAgICAnVGhlIHN0b2NrIGhhcyBzdWNjZXNzZnVsbHkgbWFpbnRhaW5lZCBpdHMgdXB0cmVuZCB3aXRoIGNvbnNpc3RlbnQgdm9sdW1lIGNvbmZpcm1hdGlvbi4nLFxuICAgICAgICAgICAgJ0tleSByZXNpc3RhbmNlIGF0ICQyMDAgcmVwcmVzZW50cyBjcml0aWNhbCBsZXZlbCBmb3IgbmV4dCBwaGFzZSBvZiBwcmljZSBhcHByZWNpYXRpb24uJ1xuICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAgcmVjb21tZW5kYXRpb25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgYWN0aW9uOiAnYnV5JyxcbiAgICAgICAgICAgIHRpbWVIb3Jpem9uOiAnc2hvcnQnLFxuICAgICAgICAgICAgY29uZmlkZW5jZTogMC43MixcbiAgICAgICAgICAgIHJhdGlvbmFsZTogJ1RlY2huaWNhbCBtb21lbnR1bSBzdXBwb3J0cyBlbnRyeSB3aXRoIGRlZmluZWQgcmlzayBtYW5hZ2VtZW50IGxldmVscydcbiAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIGRhdGFQb2ludHM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzb3VyY2U6ICdtYXJrZXQtZGF0YS1yZWFsLXRpbWUnLFxuICAgICAgICAgICAgdHlwZTogJ3RlY2huaWNhbCcsXG4gICAgICAgICAgICB2YWx1ZToge1xuICAgICAgICAgICAgICBwcmljZTogMTk1LjUwLFxuICAgICAgICAgICAgICB2b2x1bWU6IDUyMzAwMDAwLFxuICAgICAgICAgICAgICBoaWdoOiAxOTcuMjAsXG4gICAgICAgICAgICAgIGxvdzogMTk0LjEwLFxuICAgICAgICAgICAgICByc2k6IDU4LjMsXG4gICAgICAgICAgICAgIG1hY2Q6IDIuMTVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgICByZWxpYWJpbGl0eTogMC45NVxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdzZW50aW1lbnQtYW5hbHlzaXMtMScsXG4gICAgICAgIGludmVzdG1lbnRJZDogJ0FBUEwnLFxuICAgICAgICBhbmFseXNpc1R5cGU6ICdzZW50aW1lbnQnLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIGFuYWx5c3Q6ICdyZXNlYXJjaC1hZ2VudC1jbGF1ZGUtaGFpa3UnLFxuICAgICAgICBzdW1tYXJ5OiAnTWFya2V0IHNlbnRpbWVudCByZW1haW5zIHBvc2l0aXZlIHdpdGggc3Ryb25nIGFuYWx5c3QgY292ZXJhZ2UgYW5kIGluc3RpdHV0aW9uYWwgc3VwcG9ydCwgdGhvdWdoIHNvbWUgY29uY2VybnMgYWJvdXQgdmFsdWF0aW9uIHBlcnNpc3QuJyxcbiAgICAgICAgY29uZmlkZW5jZTogMC43MSxcbiAgICAgICAgZGV0YWlsczoge1xuICAgICAgICAgIHN0cmVuZ3RoczogW1xuICAgICAgICAgICAgJ1N0cm9uZyBpbnN0aXR1dGlvbmFsIG93bmVyc2hpcCBhdCA2MCUnLFxuICAgICAgICAgICAgJ1Bvc2l0aXZlIGFuYWx5c3QgcmV2aXNpb25zIGluIHJlY2VudCBxdWFydGVyJyxcbiAgICAgICAgICAgICdIaWdoIGNvbnN1bWVyIHNhdGlzZmFjdGlvbiBzY29yZXMnLFxuICAgICAgICAgICAgJ1N0cm9uZyBicmFuZCBzZW50aW1lbnQgaW4gc29jaWFsIG1lZGlhJ1xuICAgICAgICAgIF0sXG4gICAgICAgICAgd2Vha25lc3NlczogW1xuICAgICAgICAgICAgJ1NvbWUgdmFsdWF0aW9uIGNvbmNlcm5zIGFtb25nIHZhbHVlIGludmVzdG9ycycsXG4gICAgICAgICAgICAnTWl4ZWQgc2VudGltZW50IG9uIG5ldyBwcm9kdWN0IGxhdW5jaGVzJyxcbiAgICAgICAgICAgICdSZWd1bGF0b3J5IHNjcnV0aW55IGNyZWF0aW5nIHVuY2VydGFpbnR5J1xuICAgICAgICAgIF0sXG4gICAgICAgICAgb3Bwb3J0dW5pdGllczogW1xuICAgICAgICAgICAgJ1BvdGVudGlhbCBmb3Igc2VudGltZW50IGltcHJvdmVtZW50IHdpdGggbmV3IHByb2R1Y3RzJyxcbiAgICAgICAgICAgICdFU0cgaW5pdGlhdGl2ZXMgZ2FpbmluZyBwb3NpdGl2ZSBhdHRlbnRpb24nLFxuICAgICAgICAgICAgJ0FJIGludGVncmF0aW9uIHN0b3J5IHJlc29uYXRpbmcgd2l0aCBpbnZlc3RvcnMnXG4gICAgICAgICAgXSxcbiAgICAgICAgICB0aHJlYXRzOiBbXG4gICAgICAgICAgICAnTmVnYXRpdmUgc2VudGltZW50IGZyb20gdHJhZGUgdGVuc2lvbnMnLFxuICAgICAgICAgICAgJ0NvbnN1bWVyIHNwZW5kaW5nIGNvbmNlcm5zIGluIGVjb25vbWljIHVuY2VydGFpbnR5JyxcbiAgICAgICAgICAgICdDb21wZXRpdGl2ZSBwcmVzc3VyZSBhZmZlY3RpbmcgcGVyY2VwdGlvbidcbiAgICAgICAgICBdLFxuICAgICAgICAgIGtleU1ldHJpY3M6IHtcbiAgICAgICAgICAgICdBbmFseXN0IFJhdGluZyc6IDQuMixcbiAgICAgICAgICAgICdCdXkgUmVjb21tZW5kYXRpb25zJzogMjgsXG4gICAgICAgICAgICAnSG9sZCBSZWNvbW1lbmRhdGlvbnMnOiA4LFxuICAgICAgICAgICAgJ1NlbGwgUmVjb21tZW5kYXRpb25zJzogMixcbiAgICAgICAgICAgICdTb2NpYWwgU2VudGltZW50IFNjb3JlJzogMC42NSxcbiAgICAgICAgICAgICdOZXdzIFNlbnRpbWVudCc6IDAuNTgsXG4gICAgICAgICAgICAnSW5zdGl0dXRpb25hbCBPd25lcnNoaXAnOiAwLjYwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBuYXJyYXRpdmVzOiBbXG4gICAgICAgICAgICAnT3ZlcmFsbCBzZW50aW1lbnQgcmVtYWlucyBjb25zdHJ1Y3RpdmUgd2l0aCBzdHJvbmcgaW5zdGl0dXRpb25hbCBzdXBwb3J0IGFuZCBwb3NpdGl2ZSBhbmFseXN0IGNvdmVyYWdlLicsXG4gICAgICAgICAgICAnQ29uc3VtZXIgYnJhbmQgc3RyZW5ndGggY29udGludWVzIHRvIGRyaXZlIHBvc2l0aXZlIHNlbnRpbWVudCBkZXNwaXRlIGJyb2FkZXIgbWFya2V0IGNvbmNlcm5zLicsXG4gICAgICAgICAgICAnQUkgYW5kIGlubm92YXRpb24gbmFycmF0aXZlIHByb3ZpZGluZyBhZGRpdGlvbmFsIHNlbnRpbWVudCBzdXBwb3J0IGZvciB0ZWNobm9sb2d5IGludmVzdG9ycy4nXG4gICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICByZWNvbW1lbmRhdGlvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBhY3Rpb246ICdob2xkJyxcbiAgICAgICAgICAgIHRpbWVIb3Jpem9uOiAnbWVkaXVtJyxcbiAgICAgICAgICAgIGNvbmZpZGVuY2U6IDAuNjgsXG4gICAgICAgICAgICByYXRpb25hbGU6ICdQb3NpdGl2ZSBzZW50aW1lbnQgc3VwcG9ydHMgY3VycmVudCBwb3NpdGlvbiBidXQgbGltaXRlZCB1cHNpZGUgZnJvbSBzZW50aW1lbnQgYWxvbmUnXG4gICAgICAgICAgfVxuICAgICAgICBdLFxuICAgICAgICBkYXRhUG9pbnRzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgc291cmNlOiAnc2VudGltZW50LWFnZ3JlZ2F0b3InLFxuICAgICAgICAgICAgdHlwZTogJ3NlbnRpbWVudCcsXG4gICAgICAgICAgICB2YWx1ZToge1xuICAgICAgICAgICAgICBvdmVyYWxsU2VudGltZW50OiAncG9zaXRpdmUnLFxuICAgICAgICAgICAgICBzZW50aW1lbnRTY29yZTogMC42NSxcbiAgICAgICAgICAgICAgYW5hbHlzdFJhdGluZzogNC4yLFxuICAgICAgICAgICAgICBzb2NpYWxNZW50aW9uczogMTU0MjAsXG4gICAgICAgICAgICAgIG5ld3NBcnRpY2xlczogMzQyXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgcmVsaWFiaWxpdHk6IDAuNzhcbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH1cbiAgICBdO1xuXG4gICAgLy8gTW9jayByZXNlYXJjaCBmaW5kaW5nc1xuICAgIGNvbnN0IG1vY2tSZXNlYXJjaEZpbmRpbmdzID0gW1xuICAgICAge1xuICAgICAgICBzb3VyY2U6ICdyZXNlYXJjaC1hZ2VudCcsXG4gICAgICAgIHR5cGU6ICdtYXJrZXQtcmVzZWFyY2gnLFxuICAgICAgICBmaW5kaW5nczogJ1NtYXJ0cGhvbmUgbWFya2V0IHNob3dpbmcgc2lnbnMgb2Ygc3RhYmlsaXphdGlvbiB3aXRoIHByZW1pdW0gc2VnbWVudCBncm93dGguIEFwcGxlIG1haW50YWluaW5nIG1hcmtldCBzaGFyZSBsZWFkZXJzaGlwIGluIHByZW1pdW0gY2F0ZWdvcnkuJyxcbiAgICAgICAgY29uZmlkZW5jZTogMC44MixcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICBjaXRhdGlvbnM6IFsnSURDIE1hcmtldCBSZXBvcnQgUTMgMjAyNCcsICdHYXJ0bmVyIFNtYXJ0cGhvbmUgQW5hbHlzaXMnXVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc291cmNlOiAncmVzZWFyY2gtYWdlbnQnLFxuICAgICAgICB0eXBlOiAnY29tcGV0aXRpdmUtYW5hbHlzaXMnLFxuICAgICAgICBmaW5kaW5nczogJ0FwcGxlXFwncyBzZXJ2aWNlcyByZXZlbnVlIGNvbnRpbnVlcyB0byBncm93IGF0IDE2JSBhbm51YWxseSwgcHJvdmlkaW5nIHJlY3VycmluZyByZXZlbnVlIHN0cmVhbSBhbmQgaGlnaGVyIG1hcmdpbnMgdGhhbiBoYXJkd2FyZS4nLFxuICAgICAgICBjb25maWRlbmNlOiAwLjg5LFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIGNpdGF0aW9uczogWydBcHBsZSBRMyAyMDI0IEVhcm5pbmdzJywgJ1NlcnZpY2VzIFJldmVudWUgQW5hbHlzaXMnXVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc291cmNlOiAncmVzZWFyY2gtYWdlbnQnLFxuICAgICAgICB0eXBlOiAnaW5kdXN0cnktdHJlbmRzJyxcbiAgICAgICAgZmluZGluZ3M6ICdBSSBpbnRlZ3JhdGlvbiBpbiBjb25zdW1lciBkZXZpY2VzIGFjY2VsZXJhdGluZywgd2l0aCBBcHBsZSB3ZWxsLXBvc2l0aW9uZWQgdGhyb3VnaCBjaGlwIGRlc2lnbiBjYXBhYmlsaXRpZXMgYW5kIGVjb3N5c3RlbSBpbnRlZ3JhdGlvbi4nLFxuICAgICAgICBjb25maWRlbmNlOiAwLjc1LFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIGNpdGF0aW9uczogWydBSSBNYXJrZXQgVHJlbmRzIDIwMjQnLCAnU2VtaWNvbmR1Y3RvciBJbmR1c3RyeSBSZXBvcnQnXVxuICAgICAgfVxuICAgIF07XG5cbiAgICAvLyBNb2NrIGNvbXBsaWFuY2UgY2hlY2tzXG4gICAgY29uc3QgbW9ja0NvbXBsaWFuY2VDaGVja3MgPSBbXG4gICAgICB7XG4gICAgICAgIGNvbXBsaWFudDogdHJ1ZSxcbiAgICAgICAgaXNzdWVzOiBbXSxcbiAgICAgICAgcmVndWxhdGlvbnNDaGVja2VkOiBbJ1NFQyBSZWd1bGF0aW9uIEZEJywgJ0ZJTlJBIFJ1bGUgMjExMScsICdJbnZlc3RtZW50IEFkdmlzZXJzIEFjdCddLFxuICAgICAgICByaXNrQXNzZXNzbWVudDoge1xuICAgICAgICAgIG92ZXJhbGxSaXNrOiAnbWVkaXVtJyxcbiAgICAgICAgICByaXNrRmFjdG9yczogW1xuICAgICAgICAgICAgJ01hcmtldCB2b2xhdGlsaXR5IHJpc2snLFxuICAgICAgICAgICAgJ0NvbmNlbnRyYXRpb24gcmlzayBpbiB0ZWNobm9sb2d5IHNlY3RvcicsXG4gICAgICAgICAgICAnUmVndWxhdG9yeSByaXNrIGZyb20gYW50aXRydXN0IHNjcnV0aW55J1xuICAgICAgICAgIF0sXG4gICAgICAgICAgbWl0aWdhdGlvblN0cmF0ZWdpZXM6IFtcbiAgICAgICAgICAgICdEaXZlcnNpZmljYXRpb24gYWNyb3NzIGFzc2V0IGNsYXNzZXMnLFxuICAgICAgICAgICAgJ1Bvc2l0aW9uIHNpemluZyBhcHByb3ByaWF0ZSB0byByaXNrIHRvbGVyYW5jZScsXG4gICAgICAgICAgICAnUmVndWxhciBtb25pdG9yaW5nIG9mIHJlZ3VsYXRvcnkgZGV2ZWxvcG1lbnRzJ1xuICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAgZXNnQ29uc2lkZXJhdGlvbnM6IHtcbiAgICAgICAgICBlbnZpcm9ubWVudGFsU2NvcmU6IDguMixcbiAgICAgICAgICBzb2NpYWxTY29yZTogNy44LFxuICAgICAgICAgIGdvdmVybmFuY2VTY29yZTogOC41LFxuICAgICAgICAgIG92ZXJhbGxFU0dSYXRpbmc6ICdBLScsXG4gICAgICAgICAga2V5SXNzdWVzOiBbJ1N1cHBseSBjaGFpbiBzdXN0YWluYWJpbGl0eScsICdEYXRhIHByaXZhY3kgcHJhY3RpY2VzJ10sXG4gICAgICAgICAgcG9zaXRpdmVGYWN0b3JzOiBbJ1JlbmV3YWJsZSBlbmVyZ3kgY29tbWl0bWVudCcsICdEaXZlcnNpdHkgaW5pdGlhdGl2ZXMnXVxuICAgICAgICB9LFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKClcbiAgICAgIH1cbiAgICBdO1xuXG4gICAgLy8gQ3JlYXRlIHN5bnRoZXNpcyByZXF1ZXN0XG4gICAgY29uc3Qgc3ludGhlc2lzUmVxdWVzdDogU3ludGhlc2lzUmVxdWVzdCA9IHtcbiAgICAgIGFuYWx5c2lzUmVzdWx0czogbW9ja0FuYWx5c2lzUmVzdWx0cyxcbiAgICAgIHJlc2VhcmNoRmluZGluZ3M6IG1vY2tSZXNlYXJjaEZpbmRpbmdzLFxuICAgICAgY29tcGxpYW5jZUNoZWNrczogbW9ja0NvbXBsaWFuY2VDaGVja3MsXG4gICAgICB1c2VyUHJlZmVyZW5jZXM6IHtcbiAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdtZWRpdW0nLFxuICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnLFxuICAgICAgICBwcmVmZXJyZWRTZWN0b3JzOiBbJ1RlY2hub2xvZ3knLCAnQ29uc3VtZXIgRGlzY3JldGlvbmFyeSddLFxuICAgICAgICBleGNsdWRlZEludmVzdG1lbnRzOiBbJ1RvYmFjY28nLCAnV2VhcG9ucycsICdGb3NzaWwgRnVlbHMnXVxuICAgICAgfSxcbiAgICAgIG91dHB1dEZvcm1hdDogJ2RldGFpbGVkJyxcbiAgICAgIGluY2x1ZGVWaXN1YWxpemF0aW9uczogdHJ1ZVxuICAgIH07XG5cbiAgICBjb25zb2xlLmxvZygn8J+TiiBQcm9jZXNzaW5nIHN5bnRoZXNpcyByZXF1ZXN0Li4uJyk7XG4gICAgXG4gICAgLy8gUHJvY2VzcyB0aGUgc3ludGhlc2lzIHJlcXVlc3RcbiAgICBjb25zdCBzeW50aGVzaXNSZXNwb25zZSA9IGF3YWl0IHN5bnRoZXNpc0FnZW50LnByb2Nlc3NTeW50aGVzaXNSZXF1ZXN0KHN5bnRoZXNpc1JlcXVlc3QpO1xuXG4gICAgY29uc29sZS5sb2coJ1xcbuKchSBTeW50aGVzaXMgY29tcGxldGVkIHN1Y2Nlc3NmdWxseSFcXG4nKTtcblxuICAgIC8vIERpc3BsYXkgcmVzdWx0c1xuICAgIGNvbnNvbGUubG9nKCfwn5OIIElOVkVTVE1FTlQgSURFQVMgR0VORVJBVEVEOicpO1xuICAgIGNvbnNvbGUubG9nKGBOdW1iZXIgb2YgaWRlYXM6ICR7c3ludGhlc2lzUmVzcG9uc2UuaW52ZXN0bWVudElkZWFzLmxlbmd0aH1gKTtcbiAgICBjb25zb2xlLmxvZyhgT3ZlcmFsbCBjb25maWRlbmNlOiAkeyhzeW50aGVzaXNSZXNwb25zZS5jb25maWRlbmNlICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgICBjb25zb2xlLmxvZyhgQ29oZXJlbmNlIHNjb3JlOiAkeyhzeW50aGVzaXNSZXNwb25zZS5jb2hlcmVuY2VTY29yZSAqIDEwMCkudG9GaXhlZCgxKX0lXFxuYCk7XG5cbiAgICAvLyBTaG93IGV4ZWN1dGl2ZSBzdW1tYXJ5XG4gICAgY29uc29sZS5sb2coJ/Cfk4sgRVhFQ1VUSVZFIFNVTU1BUlk6Jyk7XG4gICAgY29uc29sZS5sb2coc3ludGhlc2lzUmVzcG9uc2UuZXhlY3V0aXZlU3VtbWFyeSk7XG4gICAgY29uc29sZS5sb2coJ1xcbicpO1xuXG4gICAgLy8gU2hvdyBrZXkgaW5zaWdodHNcbiAgICBjb25zb2xlLmxvZygn8J+SoSBLRVkgSU5TSUdIVFM6Jyk7XG4gICAgc3ludGhlc2lzUmVzcG9uc2Uua2V5SW5zaWdodHMuZm9yRWFjaCgoaW5zaWdodCwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGAke2luZGV4ICsgMX0uICR7aW5zaWdodH1gKTtcbiAgICB9KTtcbiAgICBjb25zb2xlLmxvZygnXFxuJyk7XG5cbiAgICAvLyBTaG93IGludmVzdG1lbnQgaWRlYXNcbiAgICBjb25zb2xlLmxvZygn8J+OryBJTlZFU1RNRU5UIE9QUE9SVFVOSVRJRVM6Jyk7XG4gICAgc3ludGhlc2lzUmVzcG9uc2UuaW52ZXN0bWVudElkZWFzLmZvckVhY2goKGlkZWEsIGluZGV4KSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhgXFxuJHtpbmRleCArIDF9LiAke2lkZWEudGl0bGV9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgRGVzY3JpcHRpb246ICR7aWRlYS5kZXNjcmlwdGlvbi5zdWJzdHJpbmcoMCwgMTUwKX0uLi5gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICBTdHJhdGVneTogJHtpZGVhLnN0cmF0ZWd5LnRvVXBwZXJDYXNlKCl9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgVGltZSBIb3Jpem9uOiAke2lkZWEudGltZUhvcml6b259YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgQ29uZmlkZW5jZTogJHsoaWRlYS5jb25maWRlbmNlU2NvcmUgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIFJhdGlvbmFsZTogJHtpZGVhLnJhdGlvbmFsZX1gKTtcbiAgICAgIFxuICAgICAgY29uc29sZS5sb2coJyAgIFBvdGVudGlhbCBPdXRjb21lczonKTtcbiAgICAgIGlkZWEucG90ZW50aWFsT3V0Y29tZXMuZm9yRWFjaCgob3V0Y29tZTogYW55KSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICAgIC0gJHtvdXRjb21lLnNjZW5hcmlvfTogJHsob3V0Y29tZS5yZXR1cm5Fc3RpbWF0ZSAqIDEwMCkudG9GaXhlZCgxKX0lICgkeyhvdXRjb21lLnByb2JhYmlsaXR5ICogMTAwKS50b0ZpeGVkKDApfSUgcHJvYmFiaWxpdHkpYCk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIFNob3cgcmVjb21tZW5kYXRpb25zXG4gICAgY29uc29sZS5sb2coJ1xcbvCfjq8gU1lOVEhFU0lTIFJFQ09NTUVOREFUSU9OUzonKTtcbiAgICBzeW50aGVzaXNSZXNwb25zZS5yZWNvbW1lbmRhdGlvbnMuZm9yRWFjaCgocmVjLCBpbmRleCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coYCR7aW5kZXggKyAxfS4gJHtyZWMuYWN0aW9uLnRvVXBwZXJDYXNlKCl9ICR7cmVjLmludmVzdG1lbnR9ICgke3JlYy5wcmlvcml0eX0gcHJpb3JpdHkpYCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgUmF0aW9uYWxlOiAke3JlYy5yYXRpb25hbGV9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgQ29uZmlkZW5jZTogJHsocmVjLmNvbmZpZGVuY2UgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIFRpbWVmcmFtZTogJHtyZWMudGltZWZyYW1lfVxcbmApO1xuICAgIH0pO1xuXG4gICAgLy8gU2hvdyByaXNrIHN1bW1hcnlcbiAgICBjb25zb2xlLmxvZygn4pqg77iPICBSSVNLIEFTU0VTU01FTlQ6Jyk7XG4gICAgY29uc29sZS5sb2coc3ludGhlc2lzUmVzcG9uc2Uucmlza1N1bW1hcnkpO1xuICAgIGNvbnNvbGUubG9nKCdcXG4nKTtcblxuICAgIC8vIFNob3cgdmlzdWFsaXphdGlvbnNcbiAgICBpZiAoc3ludGhlc2lzUmVzcG9uc2UudmlzdWFsaXphdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc29sZS5sb2coJ/Cfk4ogVklTVUFMSVpBVElPTlMgR0VORVJBVEVEOicpO1xuICAgICAgc3ludGhlc2lzUmVzcG9uc2UudmlzdWFsaXphdGlvbnMuZm9yRWFjaCgodml6LCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhgJHtpbmRleCArIDF9LiAke3Zpei50aXRsZX0gKCR7dml6LnR5cGV9KWApO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAgRGVzY3JpcHRpb246ICR7dml6LmRlc2NyaXB0aW9ufWApO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAgUHJpb3JpdHk6ICR7dml6LnByaW9yaXR5fWApO1xuICAgICAgICBpZiAodml6LmNvbmZpZy5jaGFydFR5cGUpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgICAgQ2hhcnQgVHlwZTogJHt2aXouY29uZmlnLmNoYXJ0VHlwZX1gKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhgICAgRGltZW5zaW9uczogJHt2aXouY29uZmlnLmRpbWVuc2lvbnMud2lkdGh9eCR7dml6LmNvbmZpZy5kaW1lbnNpb25zLmhlaWdodH1gKTtcbiAgICAgICAgY29uc29sZS5sb2coJycpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gRGVtb25zdHJhdGUgZGlmZmVyZW50IG91dHB1dCBmb3JtYXRzXG4gICAgY29uc29sZS5sb2coJ/Cfk4QgR0VORVJBVElORyBESUZGRVJFTlQgT1VUUFVUIEZPUk1BVFMuLi5cXG4nKTtcblxuICAgIC8vIEdlbmVyYXRlIE1hcmtkb3duIGZvcm1hdFxuICAgIGNvbnNvbGUubG9nKCfwn5OdIE1hcmtkb3duIEZvcm1hdDonKTtcbiAgICBjb25zdCBtYXJrZG93bk91dHB1dCA9IGF3YWl0IHN5bnRoZXNpc0FnZW50LmZvcm1hdE91dHB1dChzeW50aGVzaXNSZXNwb25zZSwgJ21hcmtkb3duJyk7XG4gICAgY29uc29sZS5sb2cobWFya2Rvd25PdXRwdXQuc3Vic3RyaW5nKDAsIDUwMCkgKyAnLi4uXFxuJyk7XG5cbiAgICAvLyBHZW5lcmF0ZSBIVE1MIGZvcm1hdFxuICAgIGNvbnNvbGUubG9nKCfwn4yQIEhUTUwgRm9ybWF0OicpO1xuICAgIGNvbnN0IGh0bWxPdXRwdXQgPSBhd2FpdCBzeW50aGVzaXNBZ2VudC5mb3JtYXRPdXRwdXQoc3ludGhlc2lzUmVzcG9uc2UsICdodG1sJyk7XG4gICAgY29uc29sZS5sb2coJ0hUTUwgb3V0cHV0IGdlbmVyYXRlZCAobGVuZ3RoOiAnICsgaHRtbE91dHB1dC5sZW5ndGggKyAnIGNoYXJhY3RlcnMpXFxuJyk7XG5cbiAgICAvLyBQZXJmb3JtYW5jZSBtZXRyaWNzXG4gICAgY29uc29sZS5sb2coJ+KaoSBQRVJGT1JNQU5DRSBNRVRSSUNTOicpO1xuICAgIGNvbnNvbGUubG9nKGBFeGVjdXRpb24gdGltZTogJHtzeW50aGVzaXNSZXNwb25zZS5leGVjdXRpb25UaW1lfW1zYCk7XG4gICAgY29uc29sZS5sb2coYFByb2Nlc3Npbmcgc3BlZWQ6ICR7KG1vY2tBbmFseXNpc1Jlc3VsdHMubGVuZ3RoIC8gKHN5bnRoZXNpc1Jlc3BvbnNlLmV4ZWN1dGlvblRpbWUgLyAxMDAwKSkudG9GaXhlZCgyKX0gYW5hbHlzZXMvc2Vjb25kYCk7XG5cbiAgICBjb25zb2xlLmxvZygnXFxu4pyoIFN5bnRoZXNpcyBBZ2VudCBFeGFtcGxlIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHkhJyk7XG5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCfinYwgRXJyb3IgaW4gU3ludGhlc2lzIEFnZW50IEV4YW1wbGU6JywgZXJyb3IpO1xuICAgIFxuICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBtZXNzYWdlOicsIGVycm9yLm1lc3NhZ2UpO1xuICAgICAgY29uc29sZS5lcnJvcignU3RhY2sgdHJhY2U6JywgZXJyb3Iuc3RhY2spO1xuICAgIH1cbiAgfVxufVxuXG4vLyBEZW1vbnN0cmF0ZSBhZ2VudCBtZXNzYWdlIGhhbmRsaW5nXG5hc3luYyBmdW5jdGlvbiBkZW1vbnN0cmF0ZU1lc3NhZ2VIYW5kbGluZygpIHtcbiAgY29uc29sZS5sb2coJ1xcbvCflIQgRGVtb25zdHJhdGluZyBBZ2VudCBNZXNzYWdlIEhhbmRsaW5nLi4uXFxuJyk7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBiZWRyb2NrQ2xpZW50ID0gbmV3IEJlZHJvY2tDbGllbnRTZXJ2aWNlKHtcbiAgICAgIHJlZ2lvbjogJ3VzLWVhc3QtMScsXG4gICAgICBjcmVkZW50aWFsczoge1xuICAgICAgICBhY2Nlc3NLZXlJZDogJ3Rlc3Qta2V5JyxcbiAgICAgICAgc2VjcmV0QWNjZXNzS2V5OiAndGVzdC1zZWNyZXQnXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBjbGF1ZGVTb25uZXRTZXJ2aWNlID0gbmV3IENsYXVkZVNvbm5ldFNlcnZpY2UoYmVkcm9ja0NsaWVudCk7XG4gICAgY29uc3Qgc3ludGhlc2lzQWdlbnQgPSBuZXcgU3ludGhlc2lzQWdlbnQoY2xhdWRlU29ubmV0U2VydmljZSk7XG5cbiAgICAvLyBDcmVhdGUgYSBzYW1wbGUgbWVzc2FnZSBmcm9tIHN1cGVydmlzb3IgYWdlbnRcbiAgICBjb25zdCBtZXNzYWdlID0ge1xuICAgICAgc2VuZGVyOiAnc3VwZXJ2aXNvcicgYXMgY29uc3QsXG4gICAgICByZWNpcGllbnQ6ICdzeW50aGVzaXMnIGFzIGNvbnN0LFxuICAgICAgbWVzc2FnZVR5cGU6ICdyZXF1ZXN0JyBhcyBjb25zdCxcbiAgICAgIGNvbnRlbnQ6IHtcbiAgICAgICAgdHlwZTogJ3N5bnRoZXNpcycsXG4gICAgICAgIHJlcXVlc3Q6IHtcbiAgICAgICAgICBhbmFseXNpc1Jlc3VsdHM6IFtdLFxuICAgICAgICAgIHJlc2VhcmNoRmluZGluZ3M6IFtdLFxuICAgICAgICAgIGNvbXBsaWFuY2VDaGVja3M6IFtdLFxuICAgICAgICAgIHVzZXJQcmVmZXJlbmNlczoge1xuICAgICAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdtZWRpdW0nIGFzIGNvbnN0LFxuICAgICAgICAgICAgcmlza1RvbGVyYW5jZTogJ21vZGVyYXRlJyBhcyBjb25zdFxuICAgICAgICAgIH0sXG4gICAgICAgICAgb3V0cHV0Rm9ybWF0OiAnc3VtbWFyeScgYXMgY29uc3QsXG4gICAgICAgICAgaW5jbHVkZVZpc3VhbGl6YXRpb25zOiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgcHJpb3JpdHk6ICdoaWdoJyBhcyBjb25zdCxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICBjb252ZXJzYXRpb25JZDogJ2NvbnYtZXhhbXBsZS0xMjMnLFxuICAgICAgICByZXF1ZXN0SWQ6ICdyZXEtc3ludGhlc2lzLTQ1NidcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc29sZS5sb2coJ/Cfk6ggU2VuZGluZyBtZXNzYWdlIHRvIFN5bnRoZXNpcyBBZ2VudDonKTtcbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShtZXNzYWdlLCBudWxsLCAyKSk7XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHN5bnRoZXNpc0FnZW50LmhhbmRsZU1lc3NhZ2UobWVzc2FnZSk7XG5cbiAgICBjb25zb2xlLmxvZygnXFxu8J+TrCBSZWNlaXZlZCByZXNwb25zZSBmcm9tIFN5bnRoZXNpcyBBZ2VudDonKTtcbiAgICBjb25zb2xlLmxvZygnU2VuZGVyOicsIHJlc3BvbnNlLnNlbmRlcik7XG4gICAgY29uc29sZS5sb2coJ1JlY2lwaWVudDonLCByZXNwb25zZS5yZWNpcGllbnQpO1xuICAgIGNvbnNvbGUubG9nKCdNZXNzYWdlIFR5cGU6JywgcmVzcG9uc2UubWVzc2FnZVR5cGUpO1xuICAgIGNvbnNvbGUubG9nKCdSZXNwb25zZSBDb250ZW50IEtleXM6JywgT2JqZWN0LmtleXMocmVzcG9uc2UuY29udGVudCkpO1xuXG4gICAgY29uc29sZS5sb2coJ1xcbuKchSBNZXNzYWdlIGhhbmRsaW5nIGRlbW9uc3RyYXRpb24gY29tcGxldGVkIScpO1xuXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcign4p2MIEVycm9yIGluIG1lc3NhZ2UgaGFuZGxpbmcgZGVtb25zdHJhdGlvbjonLCBlcnJvcik7XG4gIH1cbn1cblxuLy8gUnVuIHRoZSBleGFtcGxlXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgcnVuU3ludGhlc2lzQWdlbnRFeGFtcGxlKClcbiAgICAudGhlbigoKSA9PiBkZW1vbnN0cmF0ZU1lc3NhZ2VIYW5kbGluZygpKVxuICAgIC5jYXRjaChjb25zb2xlLmVycm9yKTtcbn1cblxuZXhwb3J0IHsgcnVuU3ludGhlc2lzQWdlbnRFeGFtcGxlLCBkZW1vbnN0cmF0ZU1lc3NhZ2VIYW5kbGluZyB9OyJdfQ==