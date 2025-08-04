"use strict";
/**
 * Research Agent Example
 *
 * This example demonstrates how to use the Research Agent for various types of research tasks:
 * - Web search and data retrieval
 * - Information extraction and summarization
 * - Trend and pattern identification
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAllExamples = exports.agentMessageExample = exports.basicWebSearchExample = void 0;
const research_agent_1 = require("../services/ai/research-agent");
const claude_haiku_service_1 = require("../services/ai/claude-haiku-service");
const bedrock_client_1 = require("../services/ai/bedrock-client");
const web_search_service_1 = require("../services/web-search-service");
const proprietary_data_service_1 = require("../services/proprietary-data-service");
/**
 * Example: Basic Web Search Research
 */
async function basicWebSearchExample() {
    console.log('\n=== Basic Web Search Research Example ===');
    try {
        // Initialize services
        const bedrockClient = new bedrock_client_1.BedrockClientService({
            region: 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
            }
        });
        const claudeHaikuService = new claude_haiku_service_1.ClaudeHaikuService(bedrockClient);
        const webSearchService = new web_search_service_1.WebSearchService(process.env.SEARCH_API_KEY || 'demo-key');
        const proprietaryDataService = new proprietary_data_service_1.ProprietaryDataService('demo-bucket');
        const marketDataService = {}; // Mock for example
        // Create research agent
        const researchAgent = new research_agent_1.ResearchAgent(claudeHaikuService, webSearchService, proprietaryDataService, marketDataService);
        // Define research request
        const request = {
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
    }
    catch (error) {
        console.error('Error in basic web search example:', error);
    }
}
exports.basicWebSearchExample = basicWebSearchExample;
/**
 * Example: Agent Message Handling
 */
async function agentMessageExample() {
    console.log('\n=== Agent Message Handling Example ===');
    try {
        // Initialize research agent
        const bedrockClient = new bedrock_client_1.BedrockClientService({
            region: 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
            }
        });
        const claudeHaikuService = new claude_haiku_service_1.ClaudeHaikuService(bedrockClient);
        const webSearchService = new web_search_service_1.WebSearchService(process.env.SEARCH_API_KEY || 'demo-key');
        const proprietaryDataService = new proprietary_data_service_1.ProprietaryDataService('demo-bucket');
        const marketDataService = {}; // Mock for example
        const researchAgent = new research_agent_1.ResearchAgent(claudeHaikuService, webSearchService, proprietaryDataService, marketDataService);
        // Simulate message from supervisor agent
        const message = {
            sender: 'supervisor',
            recipient: 'research',
            messageType: 'request',
            content: {
                type: 'research',
                request: {
                    topic: 'ESG investing trends',
                    researchType: 'web-search',
                    parameters: {
                        depth: 'standard',
                        timeframe: 'past-month',
                        focusAreas: ['environmental', 'social', 'governance'],
                        maxResults: 20
                    }
                }
            },
            metadata: {
                priority: 'medium',
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
        }
        else if (response.messageType === 'error') {
            console.log('\nError occurred:');
            console.log(response.content.error);
        }
    }
    catch (error) {
        console.error('Error in agent message example:', error);
    }
}
exports.agentMessageExample = agentMessageExample;
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
exports.runAllExamples = runAllExamples;
// Run examples if this file is executed directly
if (require.main === module) {
    runAllExamples().catch(console.error);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzZWFyY2gtYWdlbnQtZXhhbXBsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGFtcGxlcy9yZXNlYXJjaC1hZ2VudC1leGFtcGxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7OztHQU9HOzs7QUFFSCxrRUFBK0U7QUFDL0UsOEVBQXlFO0FBQ3pFLGtFQUFxRTtBQUNyRSx1RUFBa0U7QUFDbEUsbUZBQThFO0FBRzlFOztHQUVHO0FBQ0gsS0FBSyxVQUFVLHFCQUFxQjtJQUNsQyxPQUFPLENBQUMsR0FBRyxDQUFDLDZDQUE2QyxDQUFDLENBQUM7SUFFM0QsSUFBSTtRQUNGLHNCQUFzQjtRQUN0QixNQUFNLGFBQWEsR0FBRyxJQUFJLHFDQUFvQixDQUFDO1lBQzdDLE1BQU0sRUFBRSxXQUFXO1lBQ25CLFdBQVcsRUFBRTtnQkFDWCxXQUFXLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsSUFBSSxFQUFFO2dCQUNoRCxlQUFlLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsSUFBSSxFQUFFO2FBQ3pEO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLHlDQUFrQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxxQ0FBZ0IsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsSUFBSSxVQUFVLENBQUMsQ0FBQztRQUN4RixNQUFNLHNCQUFzQixHQUFHLElBQUksaURBQXNCLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDekUsTUFBTSxpQkFBaUIsR0FBRyxFQUF1QixDQUFDLENBQUMsbUJBQW1CO1FBRXRFLHdCQUF3QjtRQUN4QixNQUFNLGFBQWEsR0FBRyxJQUFJLDhCQUFhLENBQ3JDLGtCQUFrQixFQUNsQixnQkFBZ0IsRUFDaEIsc0JBQXNCLEVBQ3RCLGlCQUFpQixDQUNsQixDQUFDO1FBRUYsMEJBQTBCO1FBQzFCLE1B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QUM7SUFFNUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO0FBQ2xELENBQUM7QUFNQyx3Q0FBYztBQUdoQixpREFBaUQ7QUFDakQsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRTtJQUMzQixjQUFjLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0NBQ3ZDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBSZXNlYXJjaCBBZ2VudCBFeGFtcGxlXG4gKiBcbiAqIFRoaXMgZXhhbXBsZSBkZW1vbnN0cmF0ZXMgaG93IHRvIHVzZSB0aGUgUmVzZWFyY2ggQWdlbnQgZm9yIHZhcmlvdXMgdHlwZXMgb2YgcmVzZWFyY2ggdGFza3M6XG4gKiAtIFdlYiBzZWFyY2ggYW5kIGRhdGEgcmV0cmlldmFsXG4gKiAtIEluZm9ybWF0aW9uIGV4dHJhY3Rpb24gYW5kIHN1bW1hcml6YXRpb25cbiAqIC0gVHJlbmQgYW5kIHBhdHRlcm4gaWRlbnRpZmljYXRpb25cbiAqL1xuXG5pbXBvcnQgeyBSZXNlYXJjaEFnZW50LCBSZXNlYXJjaFJlcXVlc3QgfSBmcm9tICcuLi9zZXJ2aWNlcy9haS9yZXNlYXJjaC1hZ2VudCc7XG5pbXBvcnQgeyBDbGF1ZGVIYWlrdVNlcnZpY2UgfSBmcm9tICcuLi9zZXJ2aWNlcy9haS9jbGF1ZGUtaGFpa3Utc2VydmljZSc7XG5pbXBvcnQgeyBCZWRyb2NrQ2xpZW50U2VydmljZSB9IGZyb20gJy4uL3NlcnZpY2VzL2FpL2JlZHJvY2stY2xpZW50JztcbmltcG9ydCB7IFdlYlNlYXJjaFNlcnZpY2UgfSBmcm9tICcuLi9zZXJ2aWNlcy93ZWItc2VhcmNoLXNlcnZpY2UnO1xuaW1wb3J0IHsgUHJvcHJpZXRhcnlEYXRhU2VydmljZSB9IGZyb20gJy4uL3NlcnZpY2VzL3Byb3ByaWV0YXJ5LWRhdGEtc2VydmljZSc7XG5pbXBvcnQgeyBNYXJrZXREYXRhU2VydmljZSB9IGZyb20gJy4uL3NlcnZpY2VzL21hcmtldC1kYXRhLXNlcnZpY2UnO1xuXG4vKipcbiAqIEV4YW1wbGU6IEJhc2ljIFdlYiBTZWFyY2ggUmVzZWFyY2hcbiAqL1xuYXN5bmMgZnVuY3Rpb24gYmFzaWNXZWJTZWFyY2hFeGFtcGxlKCkge1xuICBjb25zb2xlLmxvZygnXFxuPT09IEJhc2ljIFdlYiBTZWFyY2ggUmVzZWFyY2ggRXhhbXBsZSA9PT0nKTtcbiAgXG4gIHRyeSB7XG4gICAgLy8gSW5pdGlhbGl6ZSBzZXJ2aWNlc1xuICAgIGNvbnN0IGJlZHJvY2tDbGllbnQgPSBuZXcgQmVkcm9ja0NsaWVudFNlcnZpY2Uoe1xuICAgICAgcmVnaW9uOiAndXMtZWFzdC0xJyxcbiAgICAgIGNyZWRlbnRpYWxzOiB7XG4gICAgICAgIGFjY2Vzc0tleUlkOiBwcm9jZXNzLmVudi5BV1NfQUNDRVNTX0tFWV9JRCB8fCAnJyxcbiAgICAgICAgc2VjcmV0QWNjZXNzS2V5OiBwcm9jZXNzLmVudi5BV1NfU0VDUkVUX0FDQ0VTU19LRVkgfHwgJydcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IGNsYXVkZUhhaWt1U2VydmljZSA9IG5ldyBDbGF1ZGVIYWlrdVNlcnZpY2UoYmVkcm9ja0NsaWVudCk7XG4gICAgY29uc3Qgd2ViU2VhcmNoU2VydmljZSA9IG5ldyBXZWJTZWFyY2hTZXJ2aWNlKHByb2Nlc3MuZW52LlNFQVJDSF9BUElfS0VZIHx8ICdkZW1vLWtleScpO1xuICAgIGNvbnN0IHByb3ByaWV0YXJ5RGF0YVNlcnZpY2UgPSBuZXcgUHJvcHJpZXRhcnlEYXRhU2VydmljZSgnZGVtby1idWNrZXQnKTtcbiAgICBjb25zdCBtYXJrZXREYXRhU2VydmljZSA9IHt9IGFzIE1hcmtldERhdGFTZXJ2aWNlOyAvLyBNb2NrIGZvciBleGFtcGxlXG5cbiAgICAvLyBDcmVhdGUgcmVzZWFyY2ggYWdlbnRcbiAgICBjb25zdCByZXNlYXJjaEFnZW50ID0gbmV3IFJlc2VhcmNoQWdlbnQoXG4gICAgICBjbGF1ZGVIYWlrdVNlcnZpY2UsXG4gICAgICB3ZWJTZWFyY2hTZXJ2aWNlLFxuICAgICAgcHJvcHJpZXRhcnlEYXRhU2VydmljZSxcbiAgICAgIG1hcmtldERhdGFTZXJ2aWNlXG4gICAgKTtcblxuICAgIC8vIERlZmluZSByZXNlYXJjaCByZXF1ZXN0XG4gICAgY29uc3QgcmVxdWVzdDogUmVzZWFyY2hSZXF1ZXN0ID0ge1xuICAgICAgdG9waWM6ICdUZXNsYSBzdG9jayBwZXJmb3JtYW5jZSBRNCAyMDI0JyxcbiAgICAgIHJlc2VhcmNoVHlwZTogJ3dlYi1zZWFyY2gnLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0aW1lZnJhbWU6ICdwYXN0LW1vbnRoJyxcbiAgICAgICAgZGVwdGg6ICdzdGFuZGFyZCcsXG4gICAgICAgIHNvdXJjZXM6IFsnQmxvb21iZXJnJywgJ1JldXRlcnMnLCAnRmluYW5jaWFsIFRpbWVzJ10sXG4gICAgICAgIG1heFJlc3VsdHM6IDE1XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIFByb2Nlc3MgcmVzZWFyY2ggcmVxdWVzdFxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlc2VhcmNoQWdlbnQucHJvY2Vzc1Jlc2VhcmNoUmVxdWVzdChyZXF1ZXN0KTtcblxuICAgIC8vIERpc3BsYXkgcmVzdWx0c1xuICAgIGNvbnNvbGUubG9nKCdSZXNlYXJjaCBTdW1tYXJ5OicpO1xuICAgIGNvbnNvbGUubG9nKHJlc3VsdC5zdW1tYXJ5KTtcbiAgICBcbiAgICBjb25zb2xlLmxvZygnXFxuS2V5IEZpbmRpbmdzOicpO1xuICAgIHJlc3VsdC5rZXlGaW5kaW5ncy5mb3JFYWNoKChmaW5kaW5nLCBpbmRleCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coYCR7aW5kZXggKyAxfS4gJHtmaW5kaW5nfWApO1xuICAgIH0pO1xuXG4gICAgY29uc29sZS5sb2coJ1xcbklkZW50aWZpZWQgVHJlbmRzOicpO1xuICAgIHJlc3VsdC50cmVuZHMuZm9yRWFjaCgodHJlbmQsIGluZGV4KSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhgJHtpbmRleCArIDF9LiAke3RyZW5kLnRyZW5kfSAoJHt0cmVuZC5kaXJlY3Rpb259LCAke3RyZW5kLnN0cmVuZ3RofSlgKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICBDb25maWRlbmNlOiAkeyh0cmVuZC5jb25maWRlbmNlICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICBJbXBsaWNhdGlvbnM6ICR7dHJlbmQuaW1wbGljYXRpb25zLmpvaW4oJywgJyl9YCk7XG4gICAgfSk7XG5cbiAgICBjb25zb2xlLmxvZygnXFxuSWRlbnRpZmllZCBQYXR0ZXJuczonKTtcbiAgICByZXN1bHQucGF0dGVybnMuZm9yRWFjaCgocGF0dGVybiwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGAke2luZGV4ICsgMX0uICR7cGF0dGVybi5wYXR0ZXJufSAoJHtwYXR0ZXJuLnR5cGV9KWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIFN0cmVuZ3RoOiAke3BhdHRlcm4uc3RyZW5ndGh9LCBQcmVkaWN0aXZlIFZhbHVlOiAke3BhdHRlcm4ucHJlZGljdGl2ZVZhbHVlfWApO1xuICAgIH0pO1xuXG4gICAgY29uc29sZS5sb2coJ1xcblJlY29tbWVuZGF0aW9uczonKTtcbiAgICByZXN1bHQucmVjb21tZW5kYXRpb25zLmZvckVhY2goKHJlYywgaW5kZXgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGAke2luZGV4ICsgMX0uICR7cmVjfWApO1xuICAgIH0pO1xuXG4gICAgY29uc29sZS5sb2coYFxcblJlc2VhcmNoIGNvbXBsZXRlZCBpbiAke3Jlc3VsdC5leGVjdXRpb25UaW1lfW1zIHdpdGggJHsocmVzdWx0LmNvbmZpZGVuY2UgKiAxMDApLnRvRml4ZWQoMSl9JSBjb25maWRlbmNlYCk7XG4gICAgY29uc29sZS5sb2coYFNvdXJjZXMgYW5hbHl6ZWQ6ICR7cmVzdWx0LnNvdXJjZXMubGVuZ3RofWApO1xuXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gYmFzaWMgd2ViIHNlYXJjaCBleGFtcGxlOicsIGVycm9yKTtcbiAgfVxufVxuXG4vKipcbiAqIEV4YW1wbGU6IEFnZW50IE1lc3NhZ2UgSGFuZGxpbmdcbiAqL1xuYXN5bmMgZnVuY3Rpb24gYWdlbnRNZXNzYWdlRXhhbXBsZSgpIHtcbiAgY29uc29sZS5sb2coJ1xcbj09PSBBZ2VudCBNZXNzYWdlIEhhbmRsaW5nIEV4YW1wbGUgPT09Jyk7XG4gIFxuICB0cnkge1xuICAgIC8vIEluaXRpYWxpemUgcmVzZWFyY2ggYWdlbnRcbiAgICBjb25zdCBiZWRyb2NrQ2xpZW50ID0gbmV3IEJlZHJvY2tDbGllbnRTZXJ2aWNlKHtcbiAgICAgIHJlZ2lvbjogJ3VzLWVhc3QtMScsXG4gICAgICBjcmVkZW50aWFsczoge1xuICAgICAgICBhY2Nlc3NLZXlJZDogcHJvY2Vzcy5lbnYuQVdTX0FDQ0VTU19LRVlfSUQgfHwgJycsXG4gICAgICAgIHNlY3JldEFjY2Vzc0tleTogcHJvY2Vzcy5lbnYuQVdTX1NFQ1JFVF9BQ0NFU1NfS0VZIHx8ICcnXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBjbGF1ZGVIYWlrdVNlcnZpY2UgPSBuZXcgQ2xhdWRlSGFpa3VTZXJ2aWNlKGJlZHJvY2tDbGllbnQpO1xuICAgIGNvbnN0IHdlYlNlYXJjaFNlcnZpY2UgPSBuZXcgV2ViU2VhcmNoU2VydmljZShwcm9jZXNzLmVudi5TRUFSQ0hfQVBJX0tFWSB8fCAnZGVtby1rZXknKTtcbiAgICBjb25zdCBwcm9wcmlldGFyeURhdGFTZXJ2aWNlID0gbmV3IFByb3ByaWV0YXJ5RGF0YVNlcnZpY2UoJ2RlbW8tYnVja2V0Jyk7XG4gICAgY29uc3QgbWFya2V0RGF0YVNlcnZpY2UgPSB7fSBhcyBNYXJrZXREYXRhU2VydmljZTsgLy8gTW9jayBmb3IgZXhhbXBsZVxuXG4gICAgY29uc3QgcmVzZWFyY2hBZ2VudCA9IG5ldyBSZXNlYXJjaEFnZW50KFxuICAgICAgY2xhdWRlSGFpa3VTZXJ2aWNlLFxuICAgICAgd2ViU2VhcmNoU2VydmljZSxcbiAgICAgIHByb3ByaWV0YXJ5RGF0YVNlcnZpY2UsXG4gICAgICBtYXJrZXREYXRhU2VydmljZVxuICAgICk7XG5cbiAgICAvLyBTaW11bGF0ZSBtZXNzYWdlIGZyb20gc3VwZXJ2aXNvciBhZ2VudFxuICAgIGNvbnN0IG1lc3NhZ2UgPSB7XG4gICAgICBzZW5kZXI6ICdzdXBlcnZpc29yJyBhcyBjb25zdCxcbiAgICAgIHJlY2lwaWVudDogJ3Jlc2VhcmNoJyBhcyBjb25zdCxcbiAgICAgIG1lc3NhZ2VUeXBlOiAncmVxdWVzdCcgYXMgY29uc3QsXG4gICAgICBjb250ZW50OiB7XG4gICAgICAgIHR5cGU6ICdyZXNlYXJjaCcsXG4gICAgICAgIHJlcXVlc3Q6IHtcbiAgICAgICAgICB0b3BpYzogJ0VTRyBpbnZlc3RpbmcgdHJlbmRzJyxcbiAgICAgICAgICByZXNlYXJjaFR5cGU6ICd3ZWItc2VhcmNoJyBhcyBjb25zdCxcbiAgICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgICBkZXB0aDogJ3N0YW5kYXJkJyBhcyBjb25zdCxcbiAgICAgICAgICAgIHRpbWVmcmFtZTogJ3Bhc3QtbW9udGgnIGFzIGNvbnN0LFxuICAgICAgICAgICAgZm9jdXNBcmVhczogWydlbnZpcm9ubWVudGFsJywgJ3NvY2lhbCcsICdnb3Zlcm5hbmNlJ10sXG4gICAgICAgICAgICBtYXhSZXN1bHRzOiAyMFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyBhcyBjb25zdCxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICBjb252ZXJzYXRpb25JZDogJ2NvbnYtZXhhbXBsZS0xMjMnLFxuICAgICAgICByZXF1ZXN0SWQ6ICdyZXEtZXhhbXBsZS00NTYnXG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnNvbGUubG9nKCdTZW5kaW5nIG1lc3NhZ2UgdG8gUmVzZWFyY2ggQWdlbnQ6Jyk7XG4gICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkobWVzc2FnZSwgbnVsbCwgMikpO1xuXG4gICAgLy8gSGFuZGxlIHRoZSBtZXNzYWdlXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXNlYXJjaEFnZW50LmhhbmRsZU1lc3NhZ2UobWVzc2FnZSk7XG5cbiAgICBjb25zb2xlLmxvZygnXFxuUmVjZWl2ZWQgcmVzcG9uc2UgZnJvbSBSZXNlYXJjaCBBZ2VudDonKTtcbiAgICBjb25zb2xlLmxvZyhgU2VuZGVyOiAke3Jlc3BvbnNlLnNlbmRlcn1gKTtcbiAgICBjb25zb2xlLmxvZyhgUmVjaXBpZW50OiAke3Jlc3BvbnNlLnJlY2lwaWVudH1gKTtcbiAgICBjb25zb2xlLmxvZyhgTWVzc2FnZSBUeXBlOiAke3Jlc3BvbnNlLm1lc3NhZ2VUeXBlfWApO1xuICAgIGNvbnNvbGUubG9nKGBDb252ZXJzYXRpb24gSUQ6ICR7cmVzcG9uc2UubWV0YWRhdGEuY29udmVyc2F0aW9uSWR9YCk7XG4gICAgY29uc29sZS5sb2coYFJlcXVlc3QgSUQ6ICR7cmVzcG9uc2UubWV0YWRhdGEucmVxdWVzdElkfWApO1xuICAgIFxuICAgIGlmIChyZXNwb25zZS5tZXNzYWdlVHlwZSA9PT0gJ3Jlc3BvbnNlJykge1xuICAgICAgY29uc29sZS5sb2coJ1xcblJlc2VhcmNoIFJlc3VsdHMgU3VtbWFyeTonKTtcbiAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlLmNvbnRlbnQuc3VtbWFyeSk7XG4gICAgICBjb25zb2xlLmxvZyhgXFxuS2V5IEZpbmRpbmdzOiAke3Jlc3BvbnNlLmNvbnRlbnQua2V5RmluZGluZ3MubGVuZ3RofWApO1xuICAgICAgY29uc29sZS5sb2coYFRyZW5kcyBJZGVudGlmaWVkOiAke3Jlc3BvbnNlLmNvbnRlbnQudHJlbmRzLmxlbmd0aH1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGBQYXR0ZXJucyBJZGVudGlmaWVkOiAke3Jlc3BvbnNlLmNvbnRlbnQucGF0dGVybnMubGVuZ3RofWApO1xuICAgICAgY29uc29sZS5sb2coYENvbmZpZGVuY2U6ICR7KHJlc3BvbnNlLmNvbnRlbnQuY29uZmlkZW5jZSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgfSBlbHNlIGlmIChyZXNwb25zZS5tZXNzYWdlVHlwZSA9PT0gJ2Vycm9yJykge1xuICAgICAgY29uc29sZS5sb2coJ1xcbkVycm9yIG9jY3VycmVkOicpO1xuICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UuY29udGVudC5lcnJvcik7XG4gICAgfVxuXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gYWdlbnQgbWVzc2FnZSBleGFtcGxlOicsIGVycm9yKTtcbiAgfVxufVxuXG4vKipcbiAqIFJ1biBhbGwgZXhhbXBsZXNcbiAqL1xuYXN5bmMgZnVuY3Rpb24gcnVuQWxsRXhhbXBsZXMoKSB7XG4gIGNvbnNvbGUubG9nKCdSZXNlYXJjaCBBZ2VudCBFeGFtcGxlcycpO1xuICBjb25zb2xlLmxvZygnPT09PT09PT09PT09PT09PT09PT09PT0nKTtcbiAgXG4gIGF3YWl0IGJhc2ljV2ViU2VhcmNoRXhhbXBsZSgpO1xuICBhd2FpdCBhZ2VudE1lc3NhZ2VFeGFtcGxlKCk7XG4gIFxuICBjb25zb2xlLmxvZygnXFxuPT09IEFsbCBFeGFtcGxlcyBDb21wbGV0ZWQgPT09Jyk7XG59XG5cbi8vIEV4cG9ydCBleGFtcGxlcyBmb3IgdXNlIGluIG90aGVyIG1vZHVsZXNcbmV4cG9ydCB7XG4gIGJhc2ljV2ViU2VhcmNoRXhhbXBsZSxcbiAgYWdlbnRNZXNzYWdlRXhhbXBsZSxcbiAgcnVuQWxsRXhhbXBsZXNcbn07XG5cbi8vIFJ1biBleGFtcGxlcyBpZiB0aGlzIGZpbGUgaXMgZXhlY3V0ZWQgZGlyZWN0bHlcbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBydW5BbGxFeGFtcGxlcygpLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xufSJdfQ==