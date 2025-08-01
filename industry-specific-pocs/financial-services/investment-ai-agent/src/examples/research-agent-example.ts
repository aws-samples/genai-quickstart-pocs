/**
 * Research Agent Example
 * 
 * This example demonstrates how to use the Research Agent for various types of research tasks:
 * - Web search and data retrieval
 * - Information extraction and summarization
 * - Trend and pattern identification
 */

import { ResearchAgent, ResearchRequest } from '../services/ai/research-agent';
import { ClaudeHaikuService } from '../services/ai/claude-haiku-service';
import { BedrockClientService } from '../services/ai/bedrock-client';
import { WebSearchService } from '../services/web-search-service';
import { ProprietaryDataService } from '../services/proprietary-data-service';
import { MarketDataService } from '../services/market-data-service';

/**
 * Example: Basic Web Search Research
 */
async function basicWebSearchExample() {
  console.log('\n=== Basic Web Search Research Example ===');
  
  try {
    // Initialize services
    const bedrockClient = new BedrockClientService({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });

    const claudeHaikuService = new ClaudeHaikuService(bedrockClient);
    const webSearchService = new WebSearchService(process.env.SEARCH_API_KEY || 'demo-key');
    const proprietaryDataService = new ProprietaryDataService('demo-bucket');
    const marketDataService = {} as MarketDataService; // Mock for example

    // Create research agent
    const researchAgent = new ResearchAgent(
      claudeHaikuService,
      webSearchService,
      proprietaryDataService,
      marketDataService
    );

    // Define research request
    const request: ResearchRequest = {
      topic: 'Tesla stock performance Q4 2024',
      researchType: 'web-search',
      parameters: {
        timeframe: 'past-month',
        depth: 'standard',
        sources: ['Bloomberg', 'Reuters', 'Financial Times'],
        maxResults: 15
      }
    };

    // Process research request
    const result = await researchAgent.processResearchRequest(request);

    // Display results
    console.log('Research Summary:');
    console.log(result.summary);
    
    console.log('\nKey Findings:');
    result.keyFindings.forEach((finding, index) => {
      console.log(`${index + 1}. ${finding}`);
    });

    console.log('\nIdentified Trends:');
    result.trends.forEach((trend, index) => {
      console.log(`${index + 1}. ${trend.trend} (${trend.direction}, ${trend.strength})`);
      console.log(`   Confidence: ${(trend.confidence * 100).toFixed(1)}%`);
      console.log(`   Implications: ${trend.implications.join(', ')}`);
    });

    console.log('\nIdentified Patterns:');
    result.patterns.forEach((pattern, index) => {
      console.log(`${index + 1}. ${pattern.pattern} (${pattern.type})`);
      console.log(`   Strength: ${pattern.strength}, Predictive Value: ${pattern.predictiveValue}`);
    });

    console.log('\nRecommendations:');
    result.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    console.log(`\nResearch completed in ${result.executionTime}ms with ${(result.confidence * 100).toFixed(1)}% confidence`);
    console.log(`Sources analyzed: ${result.sources.length}`);

  } catch (error) {
    console.error('Error in basic web search example:', error);
  }
}

/**
 * Example: Agent Message Handling
 */
async function agentMessageExample() {
  console.log('\n=== Agent Message Handling Example ===');
  
  try {
    // Initialize research agent
    const bedrockClient = new BedrockClientService({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });

    const claudeHaikuService = new ClaudeHaikuService(bedrockClient);
    const webSearchService = new WebSearchService(process.env.SEARCH_API_KEY || 'demo-key');
    const proprietaryDataService = new ProprietaryDataService('demo-bucket');
    const marketDataService = {} as MarketDataService; // Mock for example

    const researchAgent = new ResearchAgent(
      claudeHaikuService,
      webSearchService,
      proprietaryDataService,
      marketDataService
    );

    // Simulate message from supervisor agent
    const message = {
      sender: 'supervisor' as const,
      recipient: 'research' as const,
      messageType: 'request' as const,
      content: {
        type: 'research',
        request: {
          topic: 'ESG investing trends',
          researchType: 'web-search' as const,
          parameters: {
            depth: 'standard' as const,
            timeframe: 'past-month' as const,
            focusAreas: ['environmental', 'social', 'governance'],
            maxResults: 20
          }
        }
      },
      metadata: {
        priority: 'medium' as const,
        timestamp: new Date(),
        conversationId: 'conv-example-123',
        requestId: 'req-example-456'
      }
    };

    console.log('Sending message to Research Agent:');
    console.log(JSON.stringify(message, null, 2));

    // Handle the message
    const response = await researchAgent.handleMessage(message);

    console.log('\nReceived response from Research Agent:');
    console.log(`Sender: ${response.sender}`);
    console.log(`Recipient: ${response.recipient}`);
    console.log(`Message Type: ${response.messageType}`);
    console.log(`Conversation ID: ${response.metadata.conversationId}`);
    console.log(`Request ID: ${response.metadata.requestId}`);
    
    if (response.messageType === 'response') {
      console.log('\nResearch Results Summary:');
      console.log(response.content.summary);
      console.log(`\nKey Findings: ${response.content.keyFindings.length}`);
      console.log(`Trends Identified: ${response.content.trends.length}`);
      console.log(`Patterns Identified: ${response.content.patterns.length}`);
      console.log(`Confidence: ${(response.content.confidence * 100).toFixed(1)}%`);
    } else if (response.messageType === 'error') {
      console.log('\nError occurred:');
      console.log(response.content.error);
    }

  } catch (error) {
    console.error('Error in agent message example:', error);
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('Research Agent Examples');
  console.log('=======================');
  
  await basicWebSearchExample();
  await agentMessageExample();
  
  console.log('\n=== All Examples Completed ===');
}

// Export examples for use in other modules
export {
  basicWebSearchExample,
  agentMessageExample,
  runAllExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}