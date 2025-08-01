/**
 * Compliance Agent Example
 * 
 * This example demonstrates how to use the Compliance Agent for:
 * - Regulatory compliance checking
 * - Risk assessment for investment ideas
 * - ESG analysis
 * - Compliance documentation generation
 */

import { ComplianceAgent, ComplianceRequest } from '../services/ai/compliance-agent';
import { ClaudeHaikuService } from '../services/ai/claude-haiku-service';
import { BedrockClientService } from '../services/ai/bedrock-client';
import { Investment } from '../models/investment';
import { InvestmentIdea } from '../models/investment-idea';

async function runComplianceAgentExample() {
  console.log('🔍 Compliance Agent Example');
  console.log('============================\n');

  // Initialize services
  const bedrockClient = new BedrockClientService();
  const haikuService = new ClaudeHaikuService(bedrockClient);
  const complianceAgent = new ComplianceAgent(haikuService);

  // Sample investment for testing
  const sampleInvestment: Investment = {
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
    
    const complianceRequest: ComplianceRequest = {
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
    
    const riskRequest: ComplianceRequest = {
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
    
    const esgRequest: ComplianceRequest = {
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
    
    const docRequest: ComplianceRequest = {
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
    } catch (error) {
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
      if (!groups[rec.priority]) groups[rec.priority] = [];
      groups[rec.priority].push(rec);
      return groups;
    }, {} as Record<string, typeof allRecommendations>);

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

  } catch (error) {
    console.error('❌ Error running compliance agent example:', error);
    throw error;
  }
}

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

export { runComplianceAgentExample };