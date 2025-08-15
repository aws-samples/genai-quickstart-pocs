/**
 * Example usage of Claude Haiku 3.5 service
 * 
 * This example demonstrates how to use the Claude Haiku service
 * for quick processing and efficient analysis tasks.
 */

import { BedrockClientService } from '../services/ai/bedrock-client';
import { ClaudeHaikuService, ClaudeHaikuPromptTemplate } from '../services/ai/claude-haiku-service';

/**
 * Example: Quick market analysis using Claude Haiku
 */
async function quickMarketAnalysis() {
  console.log('🚀 Starting Claude Haiku 3.5 Quick Market Analysis Example');
  
  try {
    // Initialize the Bedrock client
    const bedrockClient = new BedrockClientService({
      region: 'us-east-1'
    });
    
    // Initialize the Claude Haiku service
    const haikuService = new ClaudeHaikuService(bedrockClient);
    
    // Example 1: Quick analysis with template
    console.log('\n📊 Example 1: Quick Market Analysis');
    const analysisResponse = await haikuService.complete({
      template: ClaudeHaikuPromptTemplate.QUICK_ANALYSIS,
      templateVariables: {
        topic: 'Technology sector performance in Q4 2024',
        points: 'Key growth drivers, major risks, outlook for 2025',
        format: 'Bullet points with brief explanations'
      },
      prompt: 'Provide a concise analysis focusing on the most important factors.',
      maxTokens: 1000,
      temperature: 0.3
    });
    
    console.log('Analysis Result:');
    console.log(analysisResponse.completion);
    console.log(`\nTokens used: ${analysisResponse.usage.totalTokens}`);
    
    // Example 2: Data extraction
    console.log('\n📋 Example 2: Data Extraction');
    const extractionResponse = await haikuService.complete({
      template: ClaudeHaikuPromptTemplate.DATA_EXTRACTION,
      templateVariables: {
        source: 'Company earnings report: Revenue $2.5B (+15% YoY), Net Income $450M (+22% YoY), EPS $3.25',
        extract: 'Revenue, growth rate, net income, EPS',
        format: 'JSON object'
      },
      prompt: 'Extract the financial metrics in structured format.',
      maxTokens: 500,
      temperature: 0.1
    });
    
    // Parse the JSON response
    const extractedData = haikuService.parseResponse(extractionResponse, {
      extractJson: true
    });
    
    console.log('Extracted Data:');
    console.log(JSON.stringify(extractedData, null, 2));
    
    // Example 3: Compliance check
    console.log('\n⚖️ Example 3: Quick Compliance Check');
    const complianceResponse = await haikuService.complete({
      template: ClaudeHaikuPromptTemplate.COMPLIANCE_CHECK,
      templateVariables: {
        investment: 'High-yield corporate bonds with 8% yield',
        regulations: 'Fiduciary duty, risk disclosure requirements',
        check: 'Suitability for conservative investors'
      },
      prompt: 'Assess compliance considerations quickly.',
      maxTokens: 800,
      temperature: 0.2
    });
    
    console.log('Compliance Assessment:');
    console.log(complianceResponse.completion);
    
    // Example 4: Market summary
    console.log('\n📈 Example 4: Market Summary');
    const summaryResponse = await haikuService.complete({
      template: ClaudeHaikuPromptTemplate.MARKET_SUMMARY,
      templateVariables: {
        data: 'S&P 500: +1.2%, NASDAQ: +0.8%, VIX: 18.5, 10Y Treasury: 4.2%',
        focus: 'Key movements and implications',
        type: 'End-of-day summary'
      },
      prompt: 'Provide a concise market wrap-up.',
      maxTokens: 600,
      temperature: 0.4
    });
    
    console.log('Market Summary:');
    console.log(summaryResponse.completion);
    
    console.log('\n✅ Claude Haiku 3.5 examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running Claude Haiku examples:', error);
  }
}

/**
 * Example: Research synthesis using Claude Haiku
 */
async function researchSynthesis() {
  console.log('\n🔬 Research Synthesis Example');
  
  try {
    const bedrockClient = new BedrockClientService();
    const haikuService = new ClaudeHaikuService(bedrockClient);
    
    const synthesisResponse = await haikuService.complete({
      template: ClaudeHaikuPromptTemplate.RESEARCH_SYNTHESIS,
      templateVariables: {
        points: [
          'AI chip demand growing 40% annually',
          'Supply chain constraints limiting production',
          'New competitors entering market',
          'Regulatory scrutiny increasing'
        ].join('\n- '),
        goal: 'Investment thesis for semiconductor sector',
        requirements: 'Balanced view with key risks and opportunities'
      },
      prompt: 'Synthesize these research points into actionable insights.',
      maxTokens: 1200,
      temperature: 0.5
    });
    
    console.log('Research Synthesis:');
    console.log(synthesisResponse.completion);
    
  } catch (error) {
    console.error('❌ Error in research synthesis:', error);
  }
}

/**
 * Run all examples
 */
async function runExamples() {
  await quickMarketAnalysis();
  await researchSynthesis();
}

// Export the functions for use in other modules
export {
  quickMarketAnalysis,
  researchSynthesis,
  runExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}