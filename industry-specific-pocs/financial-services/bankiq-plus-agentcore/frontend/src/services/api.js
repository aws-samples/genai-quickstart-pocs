import { API_URL } from '../config';
import { fetchAuthSession } from '@aws-amplify/auth';

// Use CloudFront URL for production
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || API_URL;

async function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn('[API] Failed to get auth token:', err.message);
  }
  
  return headers;
}

// Removed callBackend function - all endpoints now use async jobs for reliability

export const api = {
  async getSECReports(bankName, year, useRag, cik) {
    // Use direct backend endpoint for faster, more reliable SEC filings
    if (cik && cik !== '0000000000') {
      try {
        const response = await fetch(`${BACKEND_URL}/api/get-sec-filings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bankName, cik })
        });
        
        const data = await response.json();
        
        if (data.success) {
          return {
            response: data.response,
            '10-K': data['10-K'] || [],
            '10-Q': data['10-Q'] || []
          };
        }
      } catch (e) {
        console.error('Direct SEC fetch failed:', e);
      }
    }
    
    // Fallback to agent using async jobs
    let prompt = `Get all SEC filings for ${bankName} for years 2023, 2024, and 2025. I need both 10-K annual reports and 10-Q quarterly reports.`;
    const job = await this.submitJob(prompt);
    const result = await this.pollJobUntilComplete(job.jobId);
    const response = result.result;
    
    // Try to parse DATA: format first
    try {
      const dataMatch = response.match(/DATA:\s*(\{[\s\S]*?\})\s*\n/);
      if (dataMatch) {
        const parsed = JSON.parse(dataMatch[1]);
        if (parsed['10-K'] || parsed['10-Q']) {
          return { 
            response, 
            '10-K': (parsed['10-K'] || []).map(f => ({
              form: f.form_type,
              filing_date: f.filing_date,
              accession: f.accession_number,
              url: f.url
            })),
            '10-Q': (parsed['10-Q'] || []).map(f => ({
              form: f.form_type,
              filing_date: f.filing_date,
              accession: f.accession_number,
              url: f.url
            }))
          };
        }
      }
      
      // Fallback: Look for filings array
      const jsonMatch = response.match(/\{[\s\S]*?"filings"[\s\S]*?\[[\s\S]*?\][\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.filings && Array.isArray(parsed.filings)) {
          const tenK = parsed.filings.filter(f => f.form_type === '10-K');
          const tenQ = parsed.filings.filter(f => f.form_type === '10-Q');
          return { 
            response, 
            '10-K': tenK.map(f => ({
              form: f.form_type,
              filing_date: f.filing_date,
              accession: f.accession_number,
              url: f.url
            })),
            '10-Q': tenQ.map(f => ({
              form: f.form_type,
              filing_date: f.filing_date,
              accession: f.accession_number,
              url: f.url
            }))
          };
        }
      }
    } catch (e) {
      console.log('Could not parse SEC filings:', e);
    }
    
    return { response, '10-K': [], '10-Q': [] };
  },

  async analyzePeers(baseBank, peerBanks, metric) {
    const prompt = `Use the compare_banks tool with these exact parameters:
- base_bank: "${baseBank}"
- peer_banks: ["${peerBanks.join('", "')}"]
- metric: "${metric}"

CRITICAL INSTRUCTIONS:
1. Call the compare_banks tool
2. Return the tool's JSON output EXACTLY as-is on the first line
3. Then provide your expanded analysis below it

Format:
{"data": [...], "base_bank": "...", "peer_banks": [...], "analysis": "...", "source": "..."}

Your detailed analysis here...`;
    
    // Use async job pattern for better reliability
    const job = await this.submitJob(prompt);
    const result = await this.pollJobUntilComplete(job.jobId);
    const response = result.result;
    
    console.log('Agent response for peer analysis:', response);
    
    // Extract chart data from agent response
    let chartData = [];
    let extractedAnalysis = '';
    
    // Pattern 1: Look for complete JSON object from tool (most common)
    try {
      // Find JSON that has data, base_bank, peer_banks, analysis, source
      const jsonPattern = /\{[^]*?"data"\s*:\s*\[[^]*?\][^]*?"base_bank"[^]*?"peer_banks"[^]*?"analysis"[^]*?"source"[^]*?\}/;
      const match = response.match(jsonPattern);
      
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.data && Array.isArray(parsed.data)) {
          chartData = parsed.data;
          // Everything after the JSON is the expanded analysis
          const jsonEndIndex = response.indexOf(match[0]) + match[0].length;
          extractedAnalysis = response.substring(jsonEndIndex).trim();
          
          // If no expanded analysis, use the tool's analysis
          if (!extractedAnalysis || extractedAnalysis.length < 50) {
            extractedAnalysis = parsed.analysis || '';
          }
          
          console.log('✓ Extracted chart data:', chartData.length, 'records');
          console.log('✓ Analysis length:', extractedAnalysis.length, 'chars');
        }
      }
    } catch (e) {
      console.log('Could not parse tool JSON:', e.message);
    }
    
    // Pattern 2: Fallback - try to find any JSON with data array
    if (chartData.length === 0) {
      try {
        const lines = response.split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('{') && line.includes('"data"')) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
                chartData = parsed.data;
                // Remove this line from analysis
                extractedAnalysis = response.replace(line, '').trim();
                console.log('✓ Extracted chart data from line:', chartData.length, 'records');
                break;
              }
            } catch (e) {
              continue;
            }
          }
        }
      } catch (e) {
        console.log('Could not parse line-by-line:', e.message);
      }
    }
    
    // Pattern 3: Clean up any remaining JSON fragments in analysis
    if (extractedAnalysis && extractedAnalysis.includes('"Bank"')) {
      // Remove individual data point objects
      extractedAnalysis = extractedAnalysis.replace(/\{[^}]*"Bank"\s*:\s*"[^"]*"[^}]*\}[,\s]*/g, '');
      // Remove array brackets
      extractedAnalysis = extractedAnalysis.replace(/^\s*\[|\]\s*$/g, '');
      // Clean up whitespace
      extractedAnalysis = extractedAnalysis.trim();
    }
    
    // If still no data, log warning
    if (chartData.length === 0) {
      console.warn('⚠️ No chart data extracted. Response preview:', response.substring(0, 200));
    }
    
    // If no analysis extracted, use the whole response
    if (!extractedAnalysis) {
      extractedAnalysis = response;
    }
    
    return { 
      success: true, 
      result: {
        data: chartData,
        analysis: extractedAnalysis,
        base_bank: baseBank,
        peer_banks: peerBanks
      }
    };
  },

  async getFDICData() {
    const job = await this.submitJob('Use the get_fdic_data tool to get current FDIC banking data. Call get_fdic_data() to fetch real-time financial metrics from FDIC API.');
    const result = await this.pollJobUntilComplete(job.jobId);
    
    // Parse the agent response which should contain JSON from the tool
    let fdicData = [];
    try {
      const response = result.result;
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[^]*?"success"\s*:\s*true[^]*?"data"\s*:\s*\[[^]*?\][^]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.success && parsed.data) {
          fdicData = parsed.data;
          console.log('✓ Extracted FDIC data:', fdicData.length, 'records');
        }
      }
    } catch (e) {
      console.warn('Could not parse FDIC data from agent response:', e.message);
    }
    
    return { 
      success: true, 
      result: { 
        data: fdicData, 
        data_source: 'FDIC Call Reports (Real-time API)' 
      } 
    };
  },

  async chatWithAI(question, bankName, reports, useRag, cik) {
    // Build context-aware prompt
    let prompt = question;
    
    if (bankName) {
      prompt = `${question} about ${bankName}`;
      
      // Add available reports context if provided
      if (reports && (reports['10-K']?.length > 0 || reports['10-Q']?.length > 0)) {
        const reportsList = [
          ...(reports['10-K'] || []).map(r => `${r.form} filed ${r.filing_date}`),
          ...(reports['10-Q'] || []).map(r => `${r.form} filed ${r.filing_date}`)
        ].slice(0, 5).join(', ');
        
        prompt += `. Available SEC filings: ${reportsList}`;
      }
    }
    
    const job = await this.submitJob(`Use the answer_banking_question tool to answer this question: "${prompt}". Call answer_banking_question with question: "${prompt}" and context: "${bankName || 'General banking question'}".`);
    const result = await this.pollJobUntilComplete(job.jobId);
    
    // Clean response - remove DATA: lines from chat responses
    let cleanResponse = result.result;
    if (cleanResponse && cleanResponse.includes('DATA:')) {
      cleanResponse = cleanResponse.replace(/DATA:\s*\{[\s\S]*?\}\s*\n+/g, '').trim();
    }
    
    return { response: cleanResponse, sources: [] };
  },

  async generateFullReport(bankName) {
    const job = await this.submitJob(`Use the generate_bank_report tool to create a comprehensive financial analysis report for ${bankName}. Call generate_bank_report with bank_name: "${bankName}".`);
    const result = await this.pollJobUntilComplete(job.jobId);
    
    // Clean response - remove DATA: lines from reports
    let cleanReport = result.result;
    if (cleanReport && cleanReport.includes('DATA:')) {
      cleanReport = cleanReport.replace(/DATA:\s*\{[\s\S]*?\}\s*\n+/g, '').trim();
    }
    
    return cleanReport;
  },

  // Async job methods
  async submitJob(inputText, jobType = 'agent-invocation') {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${BACKEND_URL}/api/jobs/submit`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ inputText, jobType })
    });
    
    if (!response.ok) {
      throw new Error(`Job submission failed: ${response.status}`);
    }
    
    return response.json();
  },

  async checkJobStatus(jobId) {
    const response = await fetch(`${BACKEND_URL}/api/jobs/${jobId}`);
    
    if (!response.ok) {
      throw new Error(`Job status check failed: ${response.status}`);
    }
    
    return response.json();
  },

  async getJobResult(jobId) {
    const response = await fetch(`${BACKEND_URL}/api/jobs/${jobId}/result`);
    
    const data = await response.json();
    
    // If job failed, throw error with the actual error message
    if (!response.ok || data.status === 'failed') {
      throw new Error(data.error || `Job failed with status ${response.status}`);
    }
    
    return data;
  },

  // Poll for job completion
  async pollJobUntilComplete(jobId, maxAttempts = 120, intervalMs = 2000) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.checkJobStatus(jobId);
      
      if (status.status === 'completed' || status.status === 'failed') {
        return this.getJobResult(jobId);
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    throw new Error('Job polling timeout');
  },

  async searchBanks(query) {
    // Use direct backend endpoint for faster, more reliable search
    try {
      const response = await fetch(`${BACKEND_URL}/api/search-banks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      const data = await response.json();
      
      if (data.success && data.results) {
        console.log('Search results:', data.results);
        return data.results;
      }
      
      return [];
    } catch (e) {
      console.error('Search failed:', e);
      return [];
    }
  },

  async chatWithLocalFiles(message, analyzedDocs) {
    let prompt = message;
    if (analyzedDocs && analyzedDocs.length > 0) {
      const doc = analyzedDocs[0];
      if (doc.s3_key) {
        // Use the chat_with_documents tool for Q&A (not analyze_uploaded_pdf which is for full reports)
        prompt = `Use the chat_with_documents tool to answer this question about the uploaded document.

Question: "${message}"

Document details:
- s3_key: "${doc.s3_key}"
- bank_name: "${doc.bank_name}"
- form_type: "${doc.form_type}"
- year: ${doc.year}

Call chat_with_documents with these parameters to get the answer from the document.`;
      } else {
        prompt = `Answer this question about ${doc.bank_name} ${doc.form_type} ${doc.year}: ${message}`;
      }
    }
    const job = await this.submitJob(prompt);
    const result = await this.pollJobUntilComplete(job.jobId);
    return { response: result.result, sources: [] };
  },

  async uploadPDFs(files, bankName = '') {
    // Try agent-powered upload first (uses Claude for intelligent analysis)
    try {
      console.log('Attempting agent-powered PDF upload...');
      const response = await fetch(`${BACKEND_URL}/api/upload-pdf-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, bankName })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✓ Agent-powered upload successful');
        return result;
      }
      
      // If agent method fails, fall back to direct upload
      console.log('Agent upload failed, falling back to direct upload...');
    } catch (agentError) {
      console.log('Agent upload error:', agentError.message);
    }
    
    // Fallback: Direct upload (legacy method)
    console.log('Using direct upload method...');
    const response = await fetch(`${BACKEND_URL}/api/upload-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files, bankName })
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    const result = await response.json();
    return { ...result, method: 'direct' };
  },

  // Streaming method
  async callAgentStream(inputText, onChunk, onComplete, onError) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/invoke-agent-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.chunk) {
              onChunk(data.chunk);
            } else if (data.done) {
              onComplete();
            } else if (data.error) {
              onError(data.error);
            }
          }
        }
      }
    } catch (error) {
      onError(error.message);
    }
  }
};
