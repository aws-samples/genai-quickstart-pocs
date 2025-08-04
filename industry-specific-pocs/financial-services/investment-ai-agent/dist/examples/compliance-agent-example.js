"use strict";
/**
 * Compliance Agent Example
 *
 * This example demonstrates how to use the Compliance Agent for:
 * - Regulatory compliance checking
 * - Risk assessment for investment ideas
 * - ESG analysis
 * - Compliance documentation generation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runComplianceAgentExample = void 0;
const compliance_agent_1 = require("../services/ai/compliance-agent");
const claude_haiku_service_1 = require("../services/ai/claude-haiku-service");
const bedrock_client_1 = require("../services/ai/bedrock-client");
async function runComplianceAgentExample() {
    console.log('🔍 Compliance Agent Example');
    console.log('============================\n');
    // Initialize services
    const bedrockClient = new bedrock_client_1.BedrockClientService();
    const haikuService = new claude_haiku_service_1.ClaudeHaikuService(bedrockClient);
    const complianceAgent = new compliance_agent_1.ComplianceAgent(haikuService);
    // Sample investment for testing
    const sampleInvestment = {
        id: 'example-investment-1',
        type: 'stock',
        name: 'Green Energy Solutions Corp',
        ticker: 'GESC',
        description: 'A renewable energy company focused on solar and wind power solutions',
        sector: 'Energy',
        industry: 'Renewable Energy',
        marketCap: 25000000000,
        currentPrice: 85.50,
        historicalPerformance: [
            {
                date: new Date('2024-01-01'),
                open: 80.0,
                high: 88.0,
                low: 78.5,
                close: 85.50,
                volume: 2500000,
                adjustedClose: 85.50
            }
        ],
        fundamentals: {
            eps: 4.2,
            peRatio: 20.4,
            pbRatio: 2.8,
            returnOnEquity: 0.18,
            returnOnAssets: 0.12,
            debtToEquity: 0.25,
            revenueGrowth: 0.22,
            profitMargin: 0.15
        },
        riskMetrics: {
            volatility: 0.28,
            beta: 1.1,
            sharpeRatio: 1.3,
            drawdown: 0.12,
            var: -0.06,
            correlations: {}
        },
        relatedInvestments: []
    };
    try {
        // Example 1: Compliance Check
        console.log('1. 📋 Compliance Check Example');
        console.log('--------------------------------');
        const complianceRequest = {
            investments: [sampleInvestment],
            requestType: 'compliance-check',
            parameters: {
                jurisdictions: ['US', 'EU'],
                includeESG: true
            }
        };
        console.log(`Checking compliance for: ${sampleInvestment.name}`);
        console.log(`Jurisdictions: ${complianceRequest.parameters.jurisdictions?.join(', ')}`);
        const complianceResult = await complianceAgent.processComplianceRequest(complianceRequest);
        console.log('\n✅ Compliance Results:');
        complianceResult.complianceResults.forEach((result, index) => {
            console.log(`  Investment ${index + 1}:`);
            console.log(`    Compliant: ${result.compliant ? '✅ Yes' : '❌ No'}`);
            console.log(`    Issues Found: ${result.issues.length}`);
            if (result.issues.length > 0) {
                result.issues.forEach(issue => {
                    console.log(`      - ${issue.severity.toUpperCase()}: ${issue.description}`);
                });
            }
            console.log(`    Regulations Checked: ${result.regulationsChecked.length}`);
        });
        // Example 2: Risk Assessment
        console.log('\n\n2. ⚠️  Risk Assessment Example');
        console.log('--------------------------------');
        const riskRequest = {
            investments: [sampleInvestment],
            requestType: 'risk-assessment',
            parameters: {
                riskTolerance: 'moderate',
                investmentHorizon: 'long'
            }
        };
        console.log(`Assessing risk for: ${sampleInvestment.name}`);
        console.log(`Risk Tolerance: ${riskRequest.parameters.riskTolerance}`);
        console.log(`Investment Horizon: ${riskRequest.parameters.investmentHorizon}`);
        const riskResult = await complianceAgent.processComplianceRequest(riskRequest);
        console.log('\n📊 Risk Assessment Results:');
        riskResult.riskAssessments.forEach((assessment, index) => {
            console.log(`  Investment ${index + 1}:`);
            console.log(`    Overall Risk: ${assessment.overallRisk.toUpperCase()}`);
            console.log(`    Risk Factors: ${assessment.riskFactors.length}`);
            assessment.riskFactors.forEach(factor => {
                console.log(`      - ${factor.factor}: ${factor.level.toUpperCase()}`);
            });
            console.log(`    Mitigation Strategies: ${assessment.mitigationStrategies.length}`);
        });
        // Example 3: ESG Analysis
        console.log('\n\n3. 🌱 ESG Analysis Example');
        console.log('---------------------------');
        const esgRequest = {
            investments: [sampleInvestment],
            requestType: 'esg-analysis',
            parameters: {
                includeESG: true
            }
        };
        console.log(`Analyzing ESG factors for: ${sampleInvestment.name}`);
        const esgResult = await complianceAgent.processComplianceRequest(esgRequest);
        if (esgResult.esgAnalysis) {
            console.log('\n🌍 ESG Analysis Results:');
            const esg = esgResult.esgAnalysis;
            console.log(`  Environmental Score: ${esg.environmentalScore}/100`);
            console.log(`  Social Score: ${esg.socialScore}/100`);
            console.log(`  Governance Score: ${esg.governanceScore}/100`);
            console.log(`  Overall ESG Score: ${esg.overallESGScore.toFixed(1)}/100`);
            console.log(`\n  ESG Factors Analyzed: ${esg.esgFactors.length}`);
            esg.esgFactors.forEach(factor => {
                console.log(`    - ${factor.category.toUpperCase()}: ${factor.factor} (Score: ${factor.score})`);
            });
            console.log(`\n  ESG Risks Identified: ${esg.esgRisks.length}`);
            esg.esgRisks.forEach(risk => {
                console.log(`    - ${risk.risk} (Severity: ${risk.severity.toUpperCase()})`);
            });
            console.log(`\n  ESG Opportunities: ${esg.esgOpportunities.length}`);
            esg.esgOpportunities.forEach(opportunity => {
                console.log(`    - ${opportunity.opportunity} (Potential: ${opportunity.potential.toUpperCase()})`);
            });
        }
        // Example 4: Compliance Documentation
        console.log('\n\n4. 📄 Compliance Documentation Example');
        console.log('---------------------------------------');
        const docRequest = {
            investments: [sampleInvestment],
            requestType: 'documentation-generation',
            parameters: {
                documentationType: 'summary',
                jurisdictions: ['US']
            }
        };
        console.log(`Generating compliance documentation for: ${sampleInvestment.name}`);
        console.log(`Document Type: ${docRequest.parameters.documentationType}`);
        const docResult = await complianceAgent.processComplianceRequest(docRequest);
        if (docResult.documentation) {
            console.log('\n📋 Documentation Generated:');
            const doc = docResult.documentation;
            console.log(`  Title: ${doc.title}`);
            console.log(`  Document Type: ${doc.documentType}`);
            console.log(`  Sections: ${doc.sections.length}`);
            doc.sections.forEach(section => {
                console.log(`    - ${section.title}`);
            });
            console.log(`  Generated: ${doc.metadata.generatedAt.toLocaleDateString()}`);
            console.log(`  Jurisdiction: ${doc.metadata.jurisdiction}`);
            console.log(`  Regulations Covered: ${doc.metadata.regulations.length}`);
        }
        // Example 5: Regulation Lookup
        console.log('\n\n5. 📚 Regulation Details Example');
        console.log('----------------------------------');
        try {
            const regulation = await complianceAgent.getRegulationDetails('SEC-ICA-1940');
            console.log(`Regulation: ${regulation.name}`);
            console.log(`Jurisdiction: ${regulation.jurisdiction}`);
            console.log(`Description: ${regulation.description}`);
            console.log(`Effective Date: ${regulation.effectiveDate.toLocaleDateString()}`);
            console.log(`Requirements: ${regulation.requirements.length}`);
            regulation.requirements.forEach(req => {
                console.log(`  - ${req}`);
            });
        }
        catch (error) {
            console.log(`❌ Error looking up regulation: ${error}`);
        }
        // Example 6: Recommendations Summary
        console.log('\n\n6. 💡 Recommendations Summary');
        console.log('------------------------------');
        const allRecommendations = [
            ...complianceResult.recommendations,
            ...riskResult.recommendations,
            ...esgResult.recommendations
        ];
        console.log(`Total Recommendations: ${allRecommendations.length}`);
        const priorityGroups = allRecommendations.reduce((groups, rec) => {
            if (!groups[rec.priority])
                groups[rec.priority] = [];
            groups[rec.priority].push(rec);
            return groups;
        }, {});
        Object.entries(priorityGroups).forEach(([priority, recs]) => {
            console.log(`\n  ${priority.toUpperCase()} Priority (${recs.length}):`);
            recs.forEach(rec => {
                console.log(`    - ${rec.recommendation}`);
                console.log(`      Type: ${rec.type}, Timeline: ${rec.timeline}`);
            });
        });
        console.log('\n✅ Compliance Agent Example completed successfully!');
        console.log(`\nExecution Summary:`);
        console.log(`- Compliance Check: ${complianceResult.executionTime}ms`);
        console.log(`- Risk Assessment: ${riskResult.executionTime}ms`);
        console.log(`- ESG Analysis: ${esgResult.executionTime}ms`);
        console.log(`- Documentation: ${docResult.executionTime}ms`);
        console.log(`- Overall Confidence: ${((complianceResult.confidence + riskResult.confidence + esgResult.confidence + docResult.confidence) / 4 * 100).toFixed(1)}%`);
    }
    catch (error) {
        console.error('❌ Error running compliance agent example:', error);
        throw error;
    }
}
exports.runComplianceAgentExample = runComplianceAgentExample;
// Run the example if this file is executed directly
if (require.main === module) {
    runComplianceAgentExample()
        .then(() => {
        console.log('\n🎉 Example completed successfully!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('\n💥 Example failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGxpYW5jZS1hZ2VudC1leGFtcGxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4YW1wbGVzL2NvbXBsaWFuY2UtYWdlbnQtZXhhbXBsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7OztBQUVILHNFQUFxRjtBQUNyRiw4RUFBeUU7QUFDekUsa0VBQXFFO0FBSXJFLEtBQUssVUFBVSx5QkFBeUI7SUFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0lBQzNDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztJQUU5QyxzQkFBc0I7SUFDdEIsTUFBTSxhQUFhLEdBQUcsSUFBSSxxQ0FBb0IsRUFBRSxDQUFDO0lBQ2pELE1BQU0sWUFBWSxHQUFHLElBQUkseUNBQWtCLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDM0QsTUFBTSxlQUFlLEdBQUcsSUFBSSxrQ0FBZSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBRTFELGdDQUFnQztJQUNoQyxNQUFNLGdCQUFnQixHQUFlO1FBQ25DLEVBQUUsRUFBRSxzQkFBc0I7UUFDMUIsSUFBSSxFQUFFLE9BQU87UUFDYixJQUFJLEVBQUUsNkJBQTZCO1FBQ25DLE1BQU0sRUFBRSxNQUFNO1FBQ2QsV0FBVyxFQUFFLHNFQUFzRTtRQUNuRixNQUFNLEVBQUUsUUFBUTtRQUNoQixRQUFRLEVBQUUsa0JBQWtCO1FBQzVCLFNBQVMsRUFBRSxXQUFXO1FBQ3RCLFlBQVksRUFBRSxLQUFLO1FBQ25CLHFCQUFxQixFQUFFO1lBQ3JCO2dCQUNFLElBQUksRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUM7Z0JBQzVCLElBQUksRUFBRSxJQUFJO2dCQUNWLElBQUksRUFBRSxJQUFJO2dCQUNWLEdBQUcsRUFBRSxJQUFJO2dCQUNULEtBQUssRUFBRSxLQUFLO2dCQUNaLE1BQU0sRUFBRSxPQUFPO2dCQUNmLGFBQWEsRUFBRSxLQUFL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aXMgZXhhbXBsZSBkZW1vbnN0cmF0ZXMgaG93IHRvIHVzZSB0aGUgQ29tcGxpYW5jZSBBZ2VudCBmb3I6XG4gKiAtIFJlZ3VsYXRvcnkgY29tcGxpYW5jZSBjaGVja2luZ1xuICogLSBSaXNrIGFzc2Vzc21lbnQgZm9yIGludmVzdG1lbnQgaWRlYXNcbiAqIC0gRVNHIGFuYWx5c2lzXG4gKiAtIENvbXBsaWFuY2UgZG9jdW1lbnRhdGlvbiBnZW5lcmF0aW9uXG4gKi9cblxuaW1wb3J0IHsgQ29tcGxpYW5jZUFnZW50LCBDb21wbGlhbmNlUmVxdWVzdCB9IGZyb20gJy4uL3NlcnZpY2VzL2FpL2NvbXBsaWFuY2UtYWdlbnQnO1xuaW1wb3J0IHsgQ2xhdWRlSGFpa3VTZXJ2aWNlIH0gZnJvbSAnLi4vc2VydmljZXMvYWkvY2xhdWRlLWhhaWt1LXNlcnZpY2UnO1xuaW1wb3J0IHsgQmVkcm9ja0NsaWVudFNlcnZpY2UgfSBmcm9tICcuLi9zZXJ2aWNlcy9haS9iZWRyb2NrLWNsaWVudCc7XG5pbXBvcnQgeyBJbnZlc3RtZW50IH0gZnJvbSAnLi4vbW9kZWxzL2ludmVzdG1lbnQnO1xuaW1wb3J0IHsgSW52ZXN0bWVudElkZWEgfSBmcm9tICcuLi9tb2RlbHMvaW52ZXN0bWVudC1pZGVhJztcblxuYXN5bmMgZnVuY3Rpb24gcnVuQ29tcGxpYW5jZUFnZW50RXhhbXBsZSgpIHtcbiAgY29uc29sZS5sb2coJ/CflI0gQ29tcGxpYW5jZSBBZ2VudCBFeGFtcGxlJyk7XG4gIGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PT09PT09PT09XFxuJyk7XG5cbiAgLy8gSW5pdGlhbGl6ZSBzZXJ2aWNlc1xuICBjb25zdCBiZWRyb2NrQ2xpZW50ID0gbmV3IEJlZHJvY2tDbGllbnRTZXJ2aWNlKCk7XG4gIGNvbnN0IGhhaWt1U2VydmljZSA9IG5ldyBDbGF1ZGVIYWlrdVNlcnZpY2UoYmVkcm9ja0NsaWVudCk7XG4gIGNvbnN0IGNvbXBsaWFuY2VBZ2VudCA9IG5ldyBDb21wbGlhbmNlQWdlbnQoaGFpa3VTZXJ2aWNlKTtcblxuICAvLyBTYW1wbGUgaW52ZXN0bWVudCBmb3IgdGVzdGluZ1xuICBjb25zdCBzYW1wbGVJbnZlc3RtZW50OiBJbnZlc3RtZW50ID0ge1xuICAgIGlkOiAnZXhhbXBsZS1pbnZlc3RtZW50LTEnLFxuICAgIHR5cGU6ICdzdG9jaycsXG4gICAgbmFtZTogJ0dyZWVuIEVuZXJneSBTb2x1dGlvbnMgQ29ycCcsXG4gICAgdGlja2VyOiAnR0VTQycsXG4gICAgZGVzY3JpcHRpb246ICdBIHJlbmV3YWJsZSBlbmVyZ3kgY29tcGFueSBmb2N1c2VkIG9uIHNvbGFyIGFuZCB3aW5kIHBvd2VyIHNvbHV0aW9ucycsXG4gICAgc2VjdG9yOiAnRW5lcmd5JyxcbiAgICBpbmR1c3RyeTogJ1JlbmV3YWJsZSBFbmVyZ3knLFxuICAgIG1hcmtldENhcDogMjUwMDAwMDAwMDAsXG4gICAgY3VycmVudFByaWNlOiA4NS41MCxcbiAgICBoaXN0b3JpY2FsUGVyZm9ybWFuY2U6IFtcbiAgICAgIHtcbiAgICAgICAgZGF0ZTogbmV3IERhdGUoJzIwMjQtMDEtMDEnKSxcbiAgICAgICAgb3BlbjogODAuMCxcbiAgICAgICAgaGlnaDogODguMCxcbiAgICAgICAgbG93OiA3OC41LFxuICAgICAgICBjbG9zZTogODUuNTAsXG4gICAgICAgIHZvbHVtZTogMjUwMDAwMCxcbiAgICAgICAgYWRqdXN0ZWRDbG9zZTogODUuNTBcbiAgICAgIH1cbiAgICBdLFxuICAgIGZ1bmRhbWVudGFsczoge1xuICAgICAgZXBzOiA0LjIsXG4gICAgICBwZVJhdGlvOiAyMC40LFxuICAgICAgcGJSYXRpbzogMi44LFxuICAgICAgcmV0dXJuT25FcXVpdHk6IDAuMTgsXG4gICAgICByZXR1cm5PbkFzc2V0czogMC4xMixcbiAgICAgIGRlYnRUb0VxdWl0eTogMC4yNSxcbiAgICAgIHJldmVudWVHcm93dGg6IDAuMjIsXG4gICAgICBwcm9maXRNYXJnaW46IDAuMTVcbiAgICB9LFxuICAgIHJpc2tNZXRyaWNzOiB7XG4gICAgICB2b2xhdGlsaXR5OiAwLjI4LFxuICAgICAgYmV0YTogMS4xLFxuICAgICAgc2hhcnBlUmF0aW86IDEuMyxcbiAgICAgIGRyYXdkb3duOiAwLjEyLFxuICAgICAgdmFyOiAtMC4wNixcbiAgICAgIGNvcnJlbGF0aW9uczoge31cbiAgICB9LFxuICAgIHJlbGF0ZWRJbnZlc3RtZW50czogW11cbiAgfTtcblxuICB0cnkge1xuICAgIC8vIEV4YW1wbGUgMTogQ29tcGxpYW5jZSBDaGVja1xuICAgIGNvbnNvbGUubG9nKCcxLiDwn5OLIENvbXBsaWFuY2UgQ2hlY2sgRXhhbXBsZScpO1xuICAgIGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScpO1xuICAgIFxuICAgIGNvbnN0IGNvbXBsaWFuY2VSZXF1ZXN0OiBDb21wbGlhbmNlUmVxdWVzdCA9IHtcbiAgICAgIGludmVzdG1lbnRzOiBbc2FtcGxlSW52ZXN0bWVudF0sXG4gICAgICByZXF1ZXN0VHlwZTogJ2NvbXBsaWFuY2UtY2hlY2snLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICBqdXJpc2RpY3Rpb25zOiBbJ1VTJywgJ0VVJ10sXG4gICAgICAgIGluY2x1ZGVFU0c6IHRydWVcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc29sZS5sb2coYENoZWNraW5nIGNvbXBsaWFuY2UgZm9yOiAke3NhbXBsZUludmVzdG1lbnQubmFtZX1gKTtcbiAgICBjb25zb2xlLmxvZyhgSnVyaXNkaWN0aW9uczogJHtjb21wbGlhbmNlUmVxdWVzdC5wYXJhbWV0ZXJzLmp1cmlzZGljdGlvbnM/LmpvaW4oJywgJyl9YCk7XG4gICAgXG4gICAgY29uc3QgY29tcGxpYW5jZVJlc3VsdCA9IGF3YWl0IGNvbXBsaWFuY2VBZ2VudC5wcm9jZXNzQ29tcGxpYW5jZVJlcXVlc3QoY29tcGxpYW5jZVJlcXVlc3QpO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCdcXG7inIUgQ29tcGxpYW5jZSBSZXN1bHRzOicpO1xuICAgIGNvbXBsaWFuY2VSZXN1bHQuY29tcGxpYW5jZVJlc3VsdHMuZm9yRWFjaCgocmVzdWx0LCBpbmRleCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coYCAgSW52ZXN0bWVudCAke2luZGV4ICsgMX06YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgIENvbXBsaWFudDogJHtyZXN1bHQuY29tcGxpYW50ID8gJ+KchSBZZXMnIDogJ+KdjCBObyd9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgIElzc3VlcyBGb3VuZDogJHtyZXN1bHQuaXNzdWVzLmxlbmd0aH1gKTtcbiAgICAgIGlmIChyZXN1bHQuaXNzdWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmVzdWx0Lmlzc3Vlcy5mb3JFYWNoKGlzc3VlID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgICAgICAgLSAke2lzc3VlLnNldmVyaXR5LnRvVXBwZXJDYXNlKCl9OiAke2lzc3VlLmRlc2NyaXB0aW9ufWApO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKGAgICAgUmVndWxhdGlvbnMgQ2hlY2tlZDogJHtyZXN1bHQucmVndWxhdGlvbnNDaGVja2VkLmxlbmd0aH1gKTtcbiAgICB9KTtcblxuICAgIC8vIEV4YW1wbGUgMjogUmlzayBBc3Nlc3NtZW50XG4gICAgY29uc29sZS5sb2coJ1xcblxcbjIuIOKaoO+4jyAgUmlzayBBc3Nlc3NtZW50IEV4YW1wbGUnKTtcbiAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbiAgICBcbiAgICBjb25zdCByaXNrUmVxdWVzdDogQ29tcGxpYW5jZVJlcXVlc3QgPSB7XG4gICAgICBpbnZlc3RtZW50czogW3NhbXBsZUludmVzdG1lbnRdLFxuICAgICAgcmVxdWVzdFR5cGU6ICdyaXNrLWFzc2Vzc21lbnQnLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnLFxuICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ2xvbmcnXG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnNvbGUubG9nKGBBc3Nlc3NpbmcgcmlzayBmb3I6ICR7c2FtcGxlSW52ZXN0bWVudC5uYW1lfWApO1xuICAgIGNvbnNvbGUubG9nKGBSaXNrIFRvbGVyYW5jZTogJHtyaXNrUmVxdWVzdC5wYXJhbWV0ZXJzLnJpc2tUb2xlcmFuY2V9YCk7XG4gICAgY29uc29sZS5sb2coYEludmVzdG1lbnQgSG9yaXpvbjogJHtyaXNrUmVxdWVzdC5wYXJhbWV0ZXJzLmludmVzdG1lbnRIb3Jpem9ufWApO1xuICAgIFxuICAgIGNvbnN0IHJpc2tSZXN1bHQgPSBhd2FpdCBjb21wbGlhbmNlQWdlbnQucHJvY2Vzc0NvbXBsaWFuY2VSZXF1ZXN0KHJpc2tSZXF1ZXN0KTtcbiAgICBcbiAgICBjb25zb2xlLmxvZygnXFxu8J+TiiBSaXNrIEFzc2Vzc21lbnQgUmVzdWx0czonKTtcbiAgICByaXNrUmVzdWx0LnJpc2tBc3Nlc3NtZW50cy5mb3JFYWNoKChhc3Nlc3NtZW50LCBpbmRleCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coYCAgSW52ZXN0bWVudCAke2luZGV4ICsgMX06YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgIE92ZXJhbGwgUmlzazogJHthc3Nlc3NtZW50Lm92ZXJhbGxSaXNrLnRvVXBwZXJDYXNlKCl9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgIFJpc2sgRmFjdG9yczogJHthc3Nlc3NtZW50LnJpc2tGYWN0b3JzLmxlbmd0aH1gKTtcbiAgICAgIGFzc2Vzc21lbnQucmlza0ZhY3RvcnMuZm9yRWFjaChmYWN0b3IgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhgICAgICAgLSAke2ZhY3Rvci5mYWN0b3J9OiAke2ZhY3Rvci5sZXZlbC50b1VwcGVyQ2FzZSgpfWApO1xuICAgICAgfSk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgIE1pdGlnYXRpb24gU3RyYXRlZ2llczogJHthc3Nlc3NtZW50Lm1pdGlnYXRpb25TdHJhdGVnaWVzLmxlbmd0aH1gKTtcbiAgICB9KTtcblxuICAgIC8vIEV4YW1wbGUgMzogRVNHIEFuYWx5c2lzXG4gICAgY29uc29sZS5sb2coJ1xcblxcbjMuIPCfjLEgRVNHIEFuYWx5c2lzIEV4YW1wbGUnKTtcbiAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJyk7XG4gICAgXG4gICAgY29uc3QgZXNnUmVxdWVzdDogQ29tcGxpYW5jZVJlcXVlc3QgPSB7XG4gICAgICBpbnZlc3RtZW50czogW3NhbXBsZUludmVzdG1lbnRdLFxuICAgICAgcmVxdWVzdFR5cGU6ICdlc2ctYW5hbHlzaXMnLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICBpbmNsdWRlRVNHOiB0cnVlXG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnNvbGUubG9nKGBBbmFseXppbmcgRVNHIGZhY3RvcnMgZm9yOiAke3NhbXBsZUludmVzdG1lbnQubmFtZX1gKTtcbiAgICBcbiAgICBjb25zdCBlc2dSZXN1bHQgPSBhd2FpdCBjb21wbGlhbmNlQWdlbnQucHJvY2Vzc0NvbXBsaWFuY2VSZXF1ZXN0KGVzZ1JlcXVlc3QpO1xuICAgIFxuICAgIGlmIChlc2dSZXN1bHQuZXNnQW5hbHlzaXMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXG7wn4yNIEVTRyBBbmFseXNpcyBSZXN1bHRzOicpO1xuICAgICAgY29uc3QgZXNnID0gZXNnUmVzdWx0LmVzZ0FuYWx5c2lzO1xuICAgICAgY29uc29sZS5sb2coYCAgRW52aXJvbm1lbnRhbCBTY29yZTogJHtlc2cuZW52aXJvbm1lbnRhbFNjb3JlfS8xMDBgKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgIFNvY2lhbCBTY29yZTogJHtlc2cuc29jaWFsU2NvcmV9LzEwMGApO1xuICAgICAgY29uc29sZS5sb2coYCAgR292ZXJuYW5jZSBTY29yZTogJHtlc2cuZ292ZXJuYW5jZVNjb3JlfS8xMDBgKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgIE92ZXJhbGwgRVNHIFNjb3JlOiAke2VzZy5vdmVyYWxsRVNHU2NvcmUudG9GaXhlZCgxKX0vMTAwYCk7XG4gICAgICBcbiAgICAgIGNvbnNvbGUubG9nKGBcXG4gIEVTRyBGYWN0b3JzIEFuYWx5emVkOiAke2VzZy5lc2dGYWN0b3JzLmxlbmd0aH1gKTtcbiAgICAgIGVzZy5lc2dGYWN0b3JzLmZvckVhY2goZmFjdG9yID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coYCAgICAtICR7ZmFjdG9yLmNhdGVnb3J5LnRvVXBwZXJDYXNlKCl9OiAke2ZhY3Rvci5mYWN0b3J9IChTY29yZTogJHtmYWN0b3Iuc2NvcmV9KWApO1xuICAgICAgfSk7XG4gICAgICBcbiAgICAgIGNvbnNvbGUubG9nKGBcXG4gIEVTRyBSaXNrcyBJZGVudGlmaWVkOiAke2VzZy5lc2dSaXNrcy5sZW5ndGh9YCk7XG4gICAgICBlc2cuZXNnUmlza3MuZm9yRWFjaChyaXNrID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coYCAgICAtICR7cmlzay5yaXNrfSAoU2V2ZXJpdHk6ICR7cmlzay5zZXZlcml0eS50b1VwcGVyQ2FzZSgpfSlgKTtcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBjb25zb2xlLmxvZyhgXFxuICBFU0cgT3Bwb3J0dW5pdGllczogJHtlc2cuZXNnT3Bwb3J0dW5pdGllcy5sZW5ndGh9YCk7XG4gICAgICBlc2cuZXNnT3Bwb3J0dW5pdGllcy5mb3JFYWNoKG9wcG9ydHVuaXR5ID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coYCAgICAtICR7b3Bwb3J0dW5pdHkub3Bwb3J0dW5pdHl9IChQb3RlbnRpYWw6ICR7b3Bwb3J0dW5pdHkucG90ZW50aWFsLnRvVXBwZXJDYXNlKCl9KWApO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gRXhhbXBsZSA0OiBDb21wbGlhbmNlIERvY3VtZW50YXRpb25cbiAgICBjb25zb2xlLmxvZygnXFxuXFxuNC4g8J+ThCBDb21wbGlhbmNlIERvY3VtZW50YXRpb24gRXhhbXBsZScpO1xuICAgIGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbiAgICBcbiAgICBjb25zdCBkb2NSZXF1ZXN0OiBDb21wbGlhbmNlUmVxdWVzdCA9IHtcbiAgICAgIGludmVzdG1lbnRzOiBbc2FtcGxlSW52ZXN0bWVudF0sXG4gICAgICByZXF1ZXN0VHlwZTogJ2RvY3VtZW50YXRpb24tZ2VuZXJhdGlvbicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIGRvY3VtZW50YXRpb25UeXBlOiAnc3VtbWFyeScsXG4gICAgICAgIGp1cmlzZGljdGlvbnM6IFsnVVMnXVxuICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zb2xlLmxvZyhgR2VuZXJhdGluZyBjb21wbGlhbmNlIGRvY3VtZW50YXRpb24gZm9yOiAke3NhbXBsZUludmVzdG1lbnQubmFtZX1gKTtcbiAgICBjb25zb2xlLmxvZyhgRG9jdW1lbnQgVHlwZTogJHtkb2NSZXF1ZXN0LnBhcmFtZXRlcnMuZG9jdW1lbnRhdGlvblR5cGV9YCk7XG4gICAgXG4gICAgY29uc3QgZG9jUmVzdWx0ID0gYXdhaXQgY29tcGxpYW5jZUFnZW50LnByb2Nlc3NDb21wbGlhbmNlUmVxdWVzdChkb2NSZXF1ZXN0KTtcbiAgICBcbiAgICBpZiAoZG9jUmVzdWx0LmRvY3VtZW50YXRpb24pIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXG7wn5OLIERvY3VtZW50YXRpb24gR2VuZXJhdGVkOicpO1xuICAgICAgY29uc3QgZG9jID0gZG9jUmVzdWx0LmRvY3VtZW50YXRpb247XG4gICAgICBjb25zb2xlLmxvZyhgICBUaXRsZTogJHtkb2MudGl0bGV9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICBEb2N1bWVudCBUeXBlOiAke2RvYy5kb2N1bWVudFR5cGV9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICBTZWN0aW9uczogJHtkb2Muc2VjdGlvbnMubGVuZ3RofWApO1xuICAgICAgZG9jLnNlY3Rpb25zLmZvckVhY2goc2VjdGlvbiA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICAgLSAke3NlY3Rpb24udGl0bGV9YCk7XG4gICAgICB9KTtcbiAgICAgIGNvbnNvbGUubG9nKGAgIEdlbmVyYXRlZDogJHtkb2MubWV0YWRhdGEuZ2VuZXJhdGVkQXQudG9Mb2NhbGVEYXRlU3RyaW5nKCl9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICBKdXJpc2RpY3Rpb246ICR7ZG9jLm1ldGFkYXRhLmp1cmlzZGljdGlvbn1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgIFJlZ3VsYXRpb25zIENvdmVyZWQ6ICR7ZG9jLm1ldGFkYXRhLnJlZ3VsYXRpb25zLmxlbmd0aH1gKTtcbiAgICB9XG5cbiAgICAvLyBFeGFtcGxlIDU6IFJlZ3VsYXRpb24gTG9va3VwXG4gICAgY29uc29sZS5sb2coJ1xcblxcbjUuIPCfk5ogUmVndWxhdGlvbiBEZXRhaWxzIEV4YW1wbGUnKTtcbiAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScpO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZWd1bGF0aW9uID0gYXdhaXQgY29tcGxpYW5jZUFnZW50LmdldFJlZ3VsYXRpb25EZXRhaWxzKCdTRUMtSUNBLTE5NDAnKTtcbiAgICAgIGNvbnNvbGUubG9nKGBSZWd1bGF0aW9uOiAke3JlZ3VsYXRpb24ubmFtZX1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGBKdXJpc2RpY3Rpb246ICR7cmVndWxhdGlvbi5qdXJpc2RpY3Rpb259YCk7XG4gICAgICBjb25zb2xlLmxvZyhgRGVzY3JpcHRpb246ICR7cmVndWxhdGlvbi5kZXNjcmlwdGlvbn1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGBFZmZlY3RpdmUgRGF0ZTogJHtyZWd1bGF0aW9uLmVmZmVjdGl2ZURhdGUudG9Mb2NhbGVEYXRlU3RyaW5nKCl9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgUmVxdWlyZW1lbnRzOiAke3JlZ3VsYXRpb24ucmVxdWlyZW1lbnRzLmxlbmd0aH1gKTtcbiAgICAgIHJlZ3VsYXRpb24ucmVxdWlyZW1lbnRzLmZvckVhY2gocmVxID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coYCAgLSAke3JlcX1gKTtcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmxvZyhg4p2MIEVycm9yIGxvb2tpbmcgdXAgcmVndWxhdGlvbjogJHtlcnJvcn1gKTtcbiAgICB9XG5cbiAgICAvLyBFeGFtcGxlIDY6IFJlY29tbWVuZGF0aW9ucyBTdW1tYXJ5XG4gICAgY29uc29sZS5sb2coJ1xcblxcbjYuIPCfkqEgUmVjb21tZW5kYXRpb25zIFN1bW1hcnknKTtcbiAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJyk7XG4gICAgXG4gICAgY29uc3QgYWxsUmVjb21tZW5kYXRpb25zID0gW1xuICAgICAgLi4uY29tcGxpYW5jZVJlc3VsdC5yZWNvbW1lbmRhdGlvbnMsXG4gICAgICAuLi5yaXNrUmVzdWx0LnJlY29tbWVuZGF0aW9ucyxcbiAgICAgIC4uLmVzZ1Jlc3VsdC5yZWNvbW1lbmRhdGlvbnNcbiAgICBdO1xuXG4gICAgY29uc29sZS5sb2coYFRvdGFsIFJlY29tbWVuZGF0aW9uczogJHthbGxSZWNvbW1lbmRhdGlvbnMubGVuZ3RofWApO1xuICAgIFxuICAgIGNvbnN0IHByaW9yaXR5R3JvdXBzID0gYWxsUmVjb21tZW5kYXRpb25zLnJlZHVjZSgoZ3JvdXBzLCByZWMpID0+IHtcbiAgICAgIGlmICghZ3JvdXBzW3JlYy5wcmlvcml0eV0pIGdyb3Vwc1tyZWMucHJpb3JpdHldID0gW107XG4gICAgICBncm91cHNbcmVjLnByaW9yaXR5XS5wdXNoKHJlYyk7XG4gICAgICByZXR1cm4gZ3JvdXBzO1xuICAgIH0sIHt9IGFzIFJlY29yZDxzdHJpbmcsIHR5cGVvZiBhbGxSZWNvbW1lbmRhdGlvbnM+KTtcblxuICAgIE9iamVjdC5lbnRyaWVzKHByaW9yaXR5R3JvdXBzKS5mb3JFYWNoKChbcHJpb3JpdHksIHJlY3NdKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhgXFxuICAke3ByaW9yaXR5LnRvVXBwZXJDYXNlKCl9IFByaW9yaXR5ICgke3JlY3MubGVuZ3RofSk6YCk7XG4gICAgICByZWNzLmZvckVhY2gocmVjID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coYCAgICAtICR7cmVjLnJlY29tbWVuZGF0aW9ufWApO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAgICAgVHlwZTogJHtyZWMudHlwZX0sIFRpbWVsaW5lOiAke3JlYy50aW1lbGluZX1gKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgY29uc29sZS5sb2coJ1xcbuKchSBDb21wbGlhbmNlIEFnZW50IEV4YW1wbGUgY29tcGxldGVkIHN1Y2Nlc3NmdWxseSEnKTtcbiAgICBjb25zb2xlLmxvZyhgXFxuRXhlY3V0aW9uIFN1bW1hcnk6YCk7XG4gICAgY29uc29sZS5sb2coYC0gQ29tcGxpYW5jZSBDaGVjazogJHtjb21wbGlhbmNlUmVzdWx0LmV4ZWN1dGlvblRpbWV9bXNgKTtcbiAgICBjb25zb2xlLmxvZyhgLSBSaXNrIEFzc2Vzc21lbnQ6ICR7cmlza1Jlc3VsdC5leGVjdXRpb25UaW1lfW1zYCk7XG4gICAgY29uc29sZS5sb2coYC0gRVNHIEFuYWx5c2lzOiAke2VzZ1Jlc3VsdC5leGVjdXRpb25UaW1lfW1zYCk7XG4gICAgY29uc29sZS5sb2coYC0gRG9jdW1lbnRhdGlvbjogJHtkb2NSZXN1bHQuZXhlY3V0aW9uVGltZX1tc2ApO1xuICAgIGNvbnNvbGUubG9nKGAtIE92ZXJhbGwgQ29uZmlkZW5jZTogJHsoKGNvbXBsaWFuY2VSZXN1bHQuY29uZmlkZW5jZSArIHJpc2tSZXN1bHQuY29uZmlkZW5jZSArIGVzZ1Jlc3VsdC5jb25maWRlbmNlICsgZG9jUmVzdWx0LmNvbmZpZGVuY2UpIC8gNCAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCfinYwgRXJyb3IgcnVubmluZyBjb21wbGlhbmNlIGFnZW50IGV4YW1wbGU6JywgZXJyb3IpO1xuICAgIHRocm93IGVycm9yO1xuICB9XG59XG5cbi8vIFJ1biB0aGUgZXhhbXBsZSBpZiB0aGlzIGZpbGUgaXMgZXhlY3V0ZWQgZGlyZWN0bHlcbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBydW5Db21wbGlhbmNlQWdlbnRFeGFtcGxlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnXFxu8J+OiSBFeGFtcGxlIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHkhJyk7XG4gICAgICBwcm9jZXNzLmV4aXQoMCk7XG4gICAgfSlcbiAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICBjb25zb2xlLmVycm9yKCdcXG7wn5KlIEV4YW1wbGUgZmFpbGVkOicsIGVycm9yKTtcbiAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IHsgcnVuQ29tcGxpYW5jZUFnZW50RXhhbXBsZSB9OyJdfQ==