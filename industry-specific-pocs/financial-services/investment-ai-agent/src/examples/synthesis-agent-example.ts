/**
 * Synthesis Agent Example
 * 
 * This example demonstrates how to use the Synthesis Agent to integrate
 * analysis results from multiple agents and generate comprehensive
 * investment narratives with visualizations.
 */

import { SynthesisAgent, SynthesisRequest } from '../services/ai/synthesis-agent';
import { ClaudeSonnetService } from '../services/ai/claude-sonnet-service';
import { BedrockClientService } from '../services/ai/bedrock-client';
import { AnalysisResult } from '../models/analysis';

async function runSynthesisAgentExample() {
  console.log('🔄 Starting Synthesis Agent Example...\n');

  try {
    // Initialize services
    const bedrockClient = new BedrockClientService({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test-key',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test-secret'
      }
    });

    const claudeSonnetService = new ClaudeSonnetService(bedrockClient);
    const synthesisAgent = new SynthesisAgent(claudeSonnetService);

    // Mock analysis results from different agents
    const mockAnalysisResults: AnalysisResult[] = [
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
    const synthesisRequest: SynthesisRequest = {
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
      idea.potentialOutcomes.forEach((outcome: any) => {
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

  } catch (error) {
    console.error('❌ Error in Synthesis Agent Example:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

// Demonstrate agent message handling
async function demonstrateMessageHandling() {
  console.log('\n🔄 Demonstrating Agent Message Handling...\n');

  try {
    const bedrockClient = new BedrockClientService({
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret'
      }
    });

    const claudeSonnetService = new ClaudeSonnetService(bedrockClient);
    const synthesisAgent = new SynthesisAgent(claudeSonnetService);

    // Create a sample message from supervisor agent
    const message = {
      sender: 'supervisor' as const,
      recipient: 'synthesis' as const,
      messageType: 'request' as const,
      content: {
        type: 'synthesis',
        request: {
          analysisResults: [],
          researchFindings: [],
          complianceChecks: [],
          userPreferences: {
            investmentHorizon: 'medium' as const,
            riskTolerance: 'moderate' as const
          },
          outputFormat: 'summary' as const,
          includeVisualizations: false
        }
      },
      metadata: {
        priority: 'high' as const,
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

  } catch (error) {
    console.error('❌ Error in message handling demonstration:', error);
  }
}

// Run the example
if (require.main === module) {
  runSynthesisAgentExample()
    .then(() => demonstrateMessageHandling())
    .catch(console.error);
}

export { runSynthesisAgentExample, demonstrateMessageHandling };