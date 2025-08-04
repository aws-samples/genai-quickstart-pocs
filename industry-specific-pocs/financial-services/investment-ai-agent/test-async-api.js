#!/usr/bin/env node

/**
 * Test script for the async production API
 */

const https = require('https');

async function testAsyncAPI() {
  console.log('🚀 Testing Async Production API...\n');

  // Test 1: Submit async job
  console.log('📤 Step 1: Submitting async investment analysis job');
  
  const requestData = {
    riskTolerance: 'moderate',
    investmentHorizon: 'medium-term',
    sectors: ['technology', 'renewable-energy', 'biotechnology'],
    maxIdeas: 3,
    includeAnalysis: true,
    customRequirements: 'Focus on ESG-compliant investments with strong growth potential and low correlation to traditional markets'
  };
  
  console.log('Request:', JSON.stringify(requestData, null, 2));
  
  try {
    const submitResult = await makeRequest('POST', '/api/v1/ideas/async', JSON.stringify(requestData), {
      'Content-Type': 'application/json'
    });
    
    console.log('✅ Job Submission Status:', submitResult.statusCode);
    
    if (submitResult.statusCode === 202) {
      const jobData = JSON.parse(submitResult.body);
      console.log('🆔 Job ID:', jobData.jobId);
      console.log('📊 Status URL:', jobData.statusUrl);
      console.log('📋 Results URL:', jobData.resultsUrl);
      console.log('⏰ Estimated Completion:', jobData.estimatedCompletion);
      
      const jobId = jobData.jobId;
      
      console.log('\n' + '='.repeat(60) + '\n');
      
      // Test 2: Poll job status
      console.log('🔄 Step 2: Polling job status...');
      
      const pollInterval = 10000; // 10 seconds
      const maxPolls = 8; // 80 seconds max
      
      for (let i = 0; i < maxPolls; i++) {
        console.log(`\n📊 Poll ${i + 1}/${maxPolls} - Checking status...`);
        
        const statusResult = await makeRequest('GET', `/api/v1/jobs/${jobId}/status`);
        
        if (statusResult.statusCode === 200) {
          const status = JSON.parse(statusResult.body);
          
          console.log('   Status:', status.status);
          console.log('   Progress:', `${status.progress.percentComplete}%`);
          console.log('   Current Step:', status.progress.currentStep);
          console.log('   Processing Time:', `${Math.round(status.processingTime / 1000)}s`);
          console.log('   Time Remaining:', `${Math.round(status.estimatedTimeRemaining / 1000)}s`);
          
          console.log('   Agent Progress:');
          Object.entries(status.agentProgress).forEach(([agent, agentStatus]) => {
            const icon = agentStatus === 'completed' ? '✅' : agentStatus === 'in_progress' ? '🔄' : '⏳';
            console.log(`     ${icon} ${agent}: ${agentStatus}`);
          });
          
          if (status.status === 'completed') {
            console.log('\n✅ Job completed. Fetching results...');
            break;
          } else if (status.status === 'failed') {
            console.log('\n❌ Job failed!');
            return;
          }
        } else {
          console.log('❌ Status check failed:', statusResult.body);
        }
        
        if (i < maxPolls - 1) {
          console.log(`   ⏳ Waiting ${pollInterval / 1000}s before next poll...`);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      }
      
      console.log('\n' + '='.repeat(60) + '\n');
      
      // Test 3: Get results
      console.log('📋 Step 3: Fetching final results...');
      
      const resultsResult = await makeRequest('GET', `/api/v1/jobs/${jobId}/results`);
      
      console.log('✅ Results Status:', resultsResult.statusCode);
      
      if (resultsResult.statusCode === 200) {
        const results = JSON.parse(resultsResult.body);
        
        console.log('🎯 Job Status:', results.status);
        console.log('⏱️  Total Processing Time:', `${Math.round(results.totalProcessingTime / 1000)}s`);
        console.log('📈 Ideas Generated:', results.results.ideas.length);
        console.log('🤖 Multi-Agent Workflow:', results.results.metadata.multiAgentWorkflow ? 'YES' : 'NO');
        console.log('🔧 Agents Used:', results.results.metadata.agentsUsed.join(', '));
        
        if (results.results.ideas.length > 0) {
          console.log('\n📋 Sample Investment Idea:');
          const idea = results.results.ideas[0];
          console.log('   Title:', idea.title);
          console.log('   Description:', idea.description);
          console.log('   Risk Level:', idea.riskLevel);
          console.log('   Expected Return:', idea.expectedReturn);
          console.log('   Confidence:', idea.confidence);
          console.log('   Sectors:', idea.sectors.join(', '));
          console.log('   Multi-Agent:', idea.multiAgent ? 'YES' : 'NO');
          console.log('   Agents Used:', idea.agentsUsed.join(', '));
          console.log('   Compliance Notes:', idea.complianceNotes);
        }
        
      } else if (resultsResult.statusCode === 202) {
        const processing = JSON.parse(resultsResult.body);
        console.log('⏳ Job still processing:', processing.message);
      } else {
        console.log('❌ Results fetch failed:', resultsResult.body);
      }
      
    } else {
      console.log('❌ Job submission failed:', submitResult.body);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎯 Async API Validation Complete');
  console.log('\n💡 Async API Features:');
  console.log('   • Immediate response (no timeouts)');
  console.log('   • Real-time progress tracking');
  console.log('   • Full multi-agent orchestration');
  console.log('   • Enterprise-grade scalability');
  console.log('   • Background processing');
}

function makeRequest(method, path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'fflo4lgd6d.execute-api.us-west-2.amazonaws.com',
      port: 443,
      path: '/v1' + path,
      method: method,
      headers: {
        'User-Agent': 'Async-API-Test/1.0',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

// Run the test
testAsyncAPI().catch(console.error);