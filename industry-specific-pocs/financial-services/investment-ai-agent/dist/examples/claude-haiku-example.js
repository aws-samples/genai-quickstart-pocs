"use strict";
/**
 * Example usage of Claude Haiku 3.5 service
 *
 * This example demonstrates how to use the Claude Haiku service
 * for quick processing and efficient analysis tasks.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runExamples = exports.researchSynthesis = exports.quickMarketAnalysis = void 0;
const bedrock_client_1 = require("../services/ai/bedrock-client");
const claude_haiku_service_1 = require("../services/ai/claude-haiku-service");
/**
 * Example: Quick market analysis using Claude Haiku
 */
async function quickMarketAnalysis() {
    console.log('🚀 Starting Claude Haiku 3.5 Quick Market Analysis Example');
    try {
        // Initialize the Bedrock client
        const bedrockClient = new bedrock_client_1.BedrockClientService({
            region: 'us-east-1'
        });
        // Initialize the Claude Haiku service
        const haikuService = new claude_haiku_service_1.ClaudeHaikuService(bedrockClient);
        // Example 1: Quick analysis with template
        console.log('\n📊 Example 1: Quick Market Analysis');
        const analysisResponse = await haikuService.complete({
            template: claude_haiku_service_1.ClaudeHaikuPromptTemplate.QUICK_ANALYSIS,
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
            template: claude_haiku_service_1.ClaudeHaikuPromptTemplate.DATA_EXTRACTION,
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
            template: claude_haiku_service_1.ClaudeHaikuPromptTemplate.COMPLIANCE_CHECK,
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
            template: claude_haiku_service_1.ClaudeHaikuPromptTemplate.MARKET_SUMMARY,
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
    }
    catch (error) {
        console.error('❌ Error running Claude Haiku examples:', error);
    }
}
exports.quickMarketAnalysis = quickMarketAnalysis;
/**
 * Example: Research synthesis using Claude Haiku
 */
async function researchSynthesis() {
    console.log('\n🔬 Research Synthesis Example');
    try {
        const bedrockClient = new bedrock_client_1.BedrockClientService();
        const haikuService = new claude_haiku_service_1.ClaudeHaikuService(bedrockClient);
        const synthesisResponse = await haikuService.complete({
            template: claude_haiku_service_1.ClaudeHaikuPromptTemplate.RESEARCH_SYNTHESIS,
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
    }
    catch (error) {
        console.error('❌ Error in research synthesis:', error);
    }
}
exports.researchSynthesis = researchSynthesis;
/**
 * Run all examples
 */
async function runExamples() {
    await quickMarketAnalysis();
    await researchSynthesis();
}
exports.runExamples = runExamples;
// Run examples if this file is executed directly
if (require.main === module) {
    runExamples().catch(console.error);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhdWRlLWhhaWt1LWV4YW1wbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhhbXBsZXMvY2xhdWRlLWhhaWt1LWV4YW1wbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7OztHQUtHOzs7QUFFSCxrRUFBcUU7QUFDckUsOEVBQW9HO0FBRXBHOztHQUVHO0FBQ0gsS0FBSyxVQUFVLG1CQUFtQjtJQUNoQyxPQUFPLENBQUMsR0FBRyxDQUFDLDREQUE0RCxDQUFDLENBQUM7SUFFMUUsSUFBSTtRQUNGLGdDQUFnQztRQUNoQyxNQUFNLGFBQWEsR0FBRyxJQUFJLHFDQUFvQixDQUFDO1lBQzdDLE1BQU0sRUFBRSxXQUFXO1NBQ3BCLENBQUMsQ0FBQztRQUVILHNDQUFzQztRQUN0QyxNQUFNLFlBQVksR0FBRyxJQUFJLHlDQUFrQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBRTNELDBDQUEwQztRQUMxQyxPQUFPLENBQUMsR0FBRyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7UUFDckQsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLFlBQVksQ0FBQyxRQUFRLENBQUM7WUFDbkQsUUFBUSxFQUFFLGdEQUF5QixDQUFDLGNBQWM7WUFDbEQsaUJBQWlCLEVBQUU7Z0JBQ2pCLEtBQUssRUFBRSwwQ0FBMEM7Z0JBQ2pELE1BQU0sRUFBRSxtREFBbUQ7Z0JBQzNELE1BQU0sRUFBRSx1Q0FBdUM7YUFDaEQ7WUFDRCxNQUFNLEVBQUUsb0VBQW9FO1lBQzVFLFNBQVMsRUFBRSxJQUFJO1lBQ2YsV0FBVyxFQUFFLEdBQUc7U0FDakIsQ0FBQyxDQUFDO1FBRUgsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDekMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFD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TUFBTSxFQUFFO29CQUNOLHFDQUFxQztvQkFDckMsOENBQThDO29CQUM5QyxpQ0FBaUM7b0JBQ2pDLGdDQUFnQztpQkFDakMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO2dCQUNkLElBQUksRUFBRSw0Q0FBNEM7Z0JBQ2xELFlBQVksRUFBRSxnREFBZ0Q7YUFDL0Q7WUFDRCxNQUFNLEVBQUUsNERBQTREO1lBQ3BFLFNBQVMsRUFBRSxJQUFJO1lBQ2YsV0FBVyxFQUFFLEdBQUc7U0FDakIsQ0FBQyxDQUFDO1FBRUgsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQ25DLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUM7S0FFM0M7SUFBQyxPQUFPLEtBQUssRUFBRTtRQUNkLE9BQU8sQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDeEQ7QUFDSCxDQUFDO0FBYUMsOENBQWlCO0FBWG5COztHQUVHO0FBQ0gsS0FBSyxVQUFVLFdBQVc7SUFDeEIsTUFBTSxtQkFBbUIsRUFBRSxDQUFDO0lBQzVCLE1BQU0saUJBQWlCLEVBQUUsQ0FBQztBQUM1QixDQUFDO0FBTUMsa0NBQVc7QUFHYixpREFBaUQ7QUFDakQsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRTtJQUMzQixXQUFXLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0NBQ3BDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBFeGFtcGxlIHVzYWdlIG9mIENsYXVkZSBIYWlrdSAzLjUgc2VydmljZVxuICogXG4gKiBUaGlzIGV4YW1wbGUgZGVtb25zdHJhdGVzIGhvdyB0byB1c2UgdGhlIENsYXVkZSBIYWlrdSBzZXJ2aWNlXG4gKiBmb3IgcXVpY2sgcHJvY2Vzc2luZyBhbmQgZWZmaWNpZW50IGFuYWx5c2lzIHRhc2tzLlxuICovXG5cbmltcG9ydCB7IEJlZHJvY2tDbGllbnRTZXJ2aWNlIH0gZnJvbSAnLi4vc2VydmljZXMvYWkvYmVkcm9jay1jbGllbnQnO1xuaW1wb3J0IHsgQ2xhdWRlSGFpa3VTZXJ2aWNlLCBDbGF1ZGVIYWlrdVByb21wdFRlbXBsYXRlIH0gZnJvbSAnLi4vc2VydmljZXMvYWkvY2xhdWRlLWhhaWt1LXNlcnZpY2UnO1xuXG4vKipcbiAqIEV4YW1wbGU6IFF1aWNrIG1hcmtldCBhbmFseXNpcyB1c2luZyBDbGF1ZGUgSGFpa3VcbiAqL1xuYXN5bmMgZnVuY3Rpb24gcXVpY2tNYXJrZXRBbmFseXNpcygpIHtcbiAgY29uc29sZS5sb2coJ/CfmoAgU3RhcnRpbmcgQ2xhdWRlIEhhaWt1IDMuNSBRdWljayBNYXJrZXQgQW5hbHlzaXMgRXhhbXBsZScpO1xuICBcbiAgdHJ5IHtcbiAgICAvLyBJbml0aWFsaXplIHRoZSBCZWRyb2NrIGNsaWVudFxuICAgIGNvbnN0IGJlZHJvY2tDbGllbnQgPSBuZXcgQmVkcm9ja0NsaWVudFNlcnZpY2Uoe1xuICAgICAgcmVnaW9uOiAndXMtZWFzdC0xJ1xuICAgIH0pO1xuICAgIFxuICAgIC8vIEluaXRpYWxpemUgdGhlIENsYXVkZSBIYWlrdSBzZXJ2aWNlXG4gICAgY29uc3QgaGFpa3VTZXJ2aWNlID0gbmV3IENsYXVkZUhhaWt1U2VydmljZShiZWRyb2NrQ2xpZW50KTtcbiAgICBcbiAgICAvLyBFeGFtcGxlIDE6IFF1aWNrIGFuYWx5c2lzIHdpdGggdGVtcGxhdGVcbiAgICBjb25zb2xlLmxvZygnXFxu8J+TiiBFeGFtcGxlIDE6IFF1aWNrIE1hcmtldCBBbmFseXNpcycpO1xuICAgIGNvbnN0IGFuYWx5c2lzUmVzcG9uc2UgPSBhd2FpdCBoYWlrdVNlcnZpY2UuY29tcGxldGUoe1xuICAgICAgdGVtcGxhdGU6IENsYXVkZUhhaWt1UHJvbXB0VGVtcGxhdGUuUVVJQ0tfQU5BTFlTSVMsXG4gICAgICB0ZW1wbGF0ZVZhcmlhYmxlczoge1xuICAgICAgICB0b3BpYzogJ1RlY2hub2xvZ3kgc2VjdG9yIHBlcmZvcm1hbmNlIGluIFE0IDIwMjQnLFxuICAgICAgICBwb2ludHM6ICdLZXkgZ3Jvd3RoIGRyaXZlcnMsIG1ham9yIHJpc2tzLCBvdXRsb29rIGZvciAyMDI1JyxcbiAgICAgICAgZm9ybWF0OiAnQnVsbGV0IHBvaW50cyB3aXRoIGJyaWVmIGV4cGxhbmF0aW9ucydcbiAgICAgIH0sXG4gICAgICBwcm9tcHQ6ICdQcm92aWRlIGEgY29uY2lzZSBhbmFseXNpcyBmb2N1c2luZyBvbiB0aGUgbW9zdCBpbXBvcnRhbnQgZmFjdG9ycy4nLFxuICAgICAgbWF4VG9rZW5zOiAxMDAwLFxuICAgICAgdGVtcGVyYXR1cmU6IDAuM1xuICAgIH0pO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCdBbmFseXNpcyBSZXN1bHQ6Jyk7XG4gICAgY29uc29sZS5sb2coYW5hbHlzaXNSZXNwb25zZS5jb21wbGV0aW9uKTtcbiAgICBjb25zb2xlLmxvZyhgXFxuVG9rZW5zIHVzZWQ6ICR7YW5hbHlzaXNSZXNwb25zZS51c2FnZS50b3RhbFRva2Vuc31gKTtcbiAgICBcbiAgICAvLyBFeGFtcGxlIDI6IERhdGEgZXh0cmFjdGlvblxuICAgIGNvbnNvbGUubG9nKCdcXG7wn5OLIEV4YW1wbGUgMjogRGF0YSBFeHRyYWN0aW9uJyk7XG4gICAgY29uc3QgZXh0cmFjdGlvblJlc3BvbnNlID0gYXdhaXQgaGFpa3VTZXJ2aWNlLmNvbXBsZXRlKHtcbiAgICAgIHRlbXBsYXRlOiBDbGF1ZGVIYWlrdVByb21wdFRlbXBsYXRlLkRBVEFfRVhUUkFDVElPTixcbiAgICAgIHRlbXBsYXRlVmFyaWFibGVzOiB7XG4gICAgICAgIHNvdXJjZTogJ0NvbXBhbnkgZWFybmluZ3MgcmVwb3J0OiBSZXZlbnVlICQyLjVCICgrMTUlIFlvWSksIE5ldCBJbmNvbWUgJDQ1ME0gKCsyMiUgWW9ZKSwgRVBTICQzLjI1JyxcbiAgICAgICAgZXh0cmFjdDogJ1JldmVudWUsIGdyb3d0aCByYXRlLCBuZXQgaW5jb21lLCBFUFMnLFxuICAgICAgICBmb3JtYXQ6ICdKU09OIG9iamVjdCdcbiAgICAgIH0sXG4gICAgICBwcm9tcHQ6ICdFeHRyYWN0IHRoZSBmaW5hbmNpYWwgbWV0cmljcyBpbiBzdHJ1Y3R1cmVkIGZvcm1hdC4nLFxuICAgICAgbWF4VG9rZW5zOiA1MDAsXG4gICAgICB0ZW1wZXJhdHVyZTogMC4xXG4gICAgfSk7XG4gICAgXG4gICAgLy8gUGFyc2UgdGhlIEpTT04gcmVzcG9uc2VcbiAgICBjb25zdCBleHRyYWN0ZWREYXRhID0gaGFpa3VTZXJ2aWNlLnBhcnNlUmVzcG9uc2UoZXh0cmFjdGlvblJlc3BvbnNlLCB7XG4gICAgICBleHRyYWN0SnNvbjogdHJ1ZVxuICAgIH0pO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCdFeHRyYWN0ZWQgRGF0YTonKTtcbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShleHRyYWN0ZWREYXRhLCBudWxsLCAyKSk7XG4gICAgXG4gICAgLy8gRXhhbXBsZSAzOiBDb21wbGlhbmNlIGNoZWNrXG4gICAgY29uc29sZS5sb2coJ1xcbuKalu+4jyBFeGFtcGxlIDM6IFF1aWNrIENvbXBsaWFuY2UgQ2hlY2snKTtcbiAgICBjb25zdCBjb21wbGlhbmNlUmVzcG9uc2UgPSBhd2FpdCBoYWlrdVNlcnZpY2UuY29tcGxldGUoe1xuICAgICAgdGVtcGxhdGU6IENsYXVkZUhhaWt1UHJvbXB0VGVtcGxhdGUuQ09NUExJQU5DRV9DSEVDSyxcbiAgICAgIHRlbXBsYXRlVmFyaWFibGVzOiB7XG4gICAgICAgIGludmVzdG1lbnQ6ICdIaWdoLXlpZWxkIGNvcnBvcmF0ZSBib25kcyB3aXRoIDglIHlpZWxkJyxcbiAgICAgICAgcmVndWxhdGlvbnM6ICdGaWR1Y2lhcnkgZHV0eSwgcmlzayBkaXNjbG9zdXJlIHJlcXVpcmVtZW50cycsXG4gICAgICAgIGNoZWNrOiAnU3VpdGFiaWxpdHkgZm9yIGNvbnNlcnZhdGl2ZSBpbnZlc3RvcnMnXG4gICAgICB9LFxuICAgICAgcHJvbXB0OiAnQXNzZXNzIGNvbXBsaWFuY2UgY29uc2lkZXJhdGlvbnMgcXVpY2tseS4nLFxuICAgICAgbWF4VG9rZW5zOiA4MDAsXG4gICAgICB0ZW1wZXJhdHVyZTogMC4yXG4gICAgfSk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ0NvbXBsaWFuY2UgQXNzZXNzbWVudDonKTtcbiAgICBjb25zb2xlLmxvZyhjb21wbGlhbmNlUmVzcG9uc2UuY29tcGxldGlvbik7XG4gICAgXG4gICAgLy8gRXhhbXBsZSA0OiBNYXJrZXQgc3VtbWFyeVxuICAgIGNvbnNvbGUubG9nKCdcXG7wn5OIIEV4YW1wbGUgNDogTWFya2V0IFN1bW1hcnknKTtcbiAgICBjb25zdCBzdW1tYXJ5UmVzcG9uc2UgPSBhd2FpdCBoYWlrdVNlcnZpY2UuY29tcGxldGUoe1xuICAgICAgdGVtcGxhdGU6IENsYXVkZUhhaWt1UHJvbXB0VGVtcGxhdGUuTUFSS0VUX1NVTU1BUlksXG4gICAgICB0ZW1wbGF0ZVZhcmlhYmxlczoge1xuICAgICAgICBkYXRhOiAnUyZQIDUwMDogKzEuMiUsIE5BU0RBUTogKzAuOCUsIFZJWDogMTguNSwgMTBZIFRyZWFzdXJ5OiA0LjIlJyxcbiAgICAgICAgZm9jdXM6ICdLZXkgbW92ZW1lbnRzIGFuZCBpbXBsaWNhdGlvbnMnLFxuICAgICAgICB0eXBlOiAnRW5kLW9mLWRheSBzdW1tYXJ5J1xuICAgICAgfSxcbiAgICAgIHByb21wdDogJ1Byb3ZpZGUgYSBjb25jaXNlIG1hcmtldCB3cmFwLXVwLicsXG4gICAgICBtYXhUb2tlbnM6IDYwMCxcbiAgICAgIHRlbXBlcmF0dXJlOiAwLjRcbiAgICB9KTtcbiAgICBcbiAgICBjb25zb2xlLmxvZygnTWFya2V0IFN1bW1hcnk6Jyk7XG4gICAgY29uc29sZS5sb2coc3VtbWFyeVJlc3BvbnNlLmNvbXBsZXRpb24pO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCdcXG7inIUgQ2xhdWRlIEhhaWt1IDMuNSBleGFtcGxlcyBjb21wbGV0ZWQgc3VjY2Vzc2Z1bGx5IScpO1xuICAgIFxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCBFcnJvciBydW5uaW5nIENsYXVkZSBIYWlrdSBleGFtcGxlczonLCBlcnJvcik7XG4gIH1cbn1cblxuLyoqXG4gKiBFeGFtcGxlOiBSZXNlYXJjaCBzeW50aGVzaXMgdXNpbmcgQ2xhdWRlIEhhaWt1XG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJlc2VhcmNoU3ludGhlc2lzKCkge1xuICBjb25zb2xlLmxvZygnXFxu8J+UrCBSZXNlYXJjaCBTeW50aGVzaXMgRXhhbXBsZScpO1xuICBcbiAgdHJ5IHtcbiAgICBjb25zdCBiZWRyb2NrQ2xpZW50ID0gbmV3IEJlZHJvY2tDbGllbnRTZXJ2aWNlKCk7XG4gICAgY29uc3QgaGFpa3VTZXJ2aWNlID0gbmV3IENsYXVkZUhhaWt1U2VydmljZShiZWRyb2NrQ2xpZW50KTtcbiAgICBcbiAgICBjb25zdCBzeW50aGVzaXNSZXNwb25zZSA9IGF3YWl0IGhhaWt1U2VydmljZS5jb21wbGV0ZSh7XG4gICAgICB0ZW1wbGF0ZTogQ2xhdWRlSGFpa3VQcm9tcHRUZW1wbGF0ZS5SRVNFQVJDSF9TWU5USEVTSVMsXG4gICAgICB0ZW1wbGF0ZVZhcmlhYmxlczoge1xuICAgICAgICBwb2ludHM6IFtcbiAgICAgICAgICAnQUkgY2hpcCBkZW1hbmQgZ3Jvd2luZyA0MCUgYW5udWFsbHknLFxuICAgICAgICAgICdTdXBwbHkgY2hhaW4gY29uc3RyYWludHMgbGltaXRpbmcgcHJvZHVjdGlvbicsXG4gICAgICAgICAgJ05ldyBjb21wZXRpdG9ycyBlbnRlcmluZyBtYXJrZXQnLFxuICAgICAgICAgICdSZWd1bGF0b3J5IHNjcnV0aW55IGluY3JlYXNpbmcnXG4gICAgICAgIF0uam9pbignXFxuLSAnKSxcbiAgICAgICAgZ29hbDogJ0ludmVzdG1lbnQgdGhlc2lzIGZvciBzZW1pY29uZHVjdG9yIHNlY3RvcicsXG4gICAgICAgIHJlcXVpcmVtZW50czogJ0JhbGFuY2VkIHZpZXcgd2l0aCBrZXkgcmlza3MgYW5kIG9wcG9ydHVuaXRpZXMnXG4gICAgICB9LFxuICAgICAgcHJvbXB0OiAnU3ludGhlc2l6ZSB0aGVzZSByZXNlYXJjaCBwb2ludHMgaW50byBhY3Rpb25hYmxlIGluc2lnaHRzLicsXG4gICAgICBtYXhUb2tlbnM6IDEyMDAsXG4gICAgICB0ZW1wZXJhdHVyZTogMC41XG4gICAgfSk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ1Jlc2VhcmNoIFN5bnRoZXNpczonKTtcbiAgICBjb25zb2xlLmxvZyhzeW50aGVzaXNSZXNwb25zZS5jb21wbGV0aW9uKTtcbiAgICBcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCfinYwgRXJyb3IgaW4gcmVzZWFyY2ggc3ludGhlc2lzOicsIGVycm9yKTtcbiAgfVxufVxuXG4vKipcbiAqIFJ1biBhbGwgZXhhbXBsZXNcbiAqL1xuYXN5bmMgZnVuY3Rpb24gcnVuRXhhbXBsZXMoKSB7XG4gIGF3YWl0IHF1aWNrTWFya2V0QW5hbHlzaXMoKTtcbiAgYXdhaXQgcmVzZWFyY2hTeW50aGVzaXMoKTtcbn1cblxuLy8gRXhwb3J0IHRoZSBmdW5jdGlvbnMgZm9yIHVzZSBpbiBvdGhlciBtb2R1bGVzXG5leHBvcnQge1xuICBxdWlja01hcmtldEFuYWx5c2lzLFxuICByZXNlYXJjaFN5bnRoZXNpcyxcbiAgcnVuRXhhbXBsZXNcbn07XG5cbi8vIFJ1biBleGFtcGxlcyBpZiB0aGlzIGZpbGUgaXMgZXhlY3V0ZWQgZGlyZWN0bHlcbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBydW5FeGFtcGxlcygpLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xufSJdfQ==