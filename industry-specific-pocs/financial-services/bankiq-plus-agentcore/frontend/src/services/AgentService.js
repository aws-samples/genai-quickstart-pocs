/**
 * AgentCore Service - Handles communication with AgentCore backend
 * Updated to use async jobs for reliability (no 30s timeout)
 */
class AgentService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_GATEWAY_URL || window.location.origin;
    this.websocket = null;
    this.eventSource = null;
    this.listeners = new Map();
    this.connected = false;
  }

  // HTTP connection for Strands agent
  async connectAgent() {
    try {
      const response = await fetch(`${this.baseURL}/api/agent-status`);
      const status = await response.json();
      
      if (status.status === 'connected') {
        this.connected = true;
        this.emit('connection', { status: 'connected', method: 'http' });
        console.log('AgentCore Agent connected via HTTP');
      }
    } catch (error) {
      this.connected = false;
      this.emit('connection', { status: 'disconnected' });
      console.log('AgentCore Agent connection failed');
    }
  }

  // Send message via WebSocket
  sendWebSocketMessage(type, data) {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({ type, ...data }));
      return true;
    }
    return false;
  }

  // Chat with AI using agents (async jobs for reliability)
  async chatWithAgent(question, bankName, useRAG = true) {
    // Try WebSocket first
    if (this.sendWebSocketMessage('chat_question', {
      question,
      bank_name: bankName,
      use_rag: useRAG
    })) {
      return { streaming: true, method: 'websocket' };
    }

    // Fallback to async jobs (no timeout limit)
    try {
      const jobResponse = await fetch(`${this.baseURL}/api/jobs/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputText: `Use the answer_banking_question tool to answer: "${question}" about ${bankName || 'general banking'}`,
          jobType: 'chat'
        })
      });
      
      const job = await jobResponse.json();
      
      // Poll for completion
      for (let i = 0; i < 60; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await fetch(`${this.baseURL}/api/jobs/${job.jobId}`);
        const status = await statusResponse.json();
        
        if (status.status === 'completed' || status.status === 'failed') {
          const resultResponse = await fetch(`${this.baseURL}/api/jobs/${job.jobId}/result`);
          const result = await resultResponse.json();
          
          if (result.status === 'failed') {
            throw new Error(result.error || 'Chat processing failed');
          }
          
          return { response: result.result, method: 'async-job' };
        }
      }
      
      throw new Error('Chat request timeout');
      
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  }

  // Generate report with streaming (async jobs for reliability)
  async generateReport(bankName, mode = 'rag') {
    // Try WebSocket first
    if (this.sendWebSocketMessage('generate_report', {
      bank_name: bankName,
      mode
    })) {
      return { streaming: true, method: 'websocket' };
    }

    // Fallback to async jobs
    try {
      const jobResponse = await fetch(`${this.baseURL}/api/jobs/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputText: `Use the generate_bank_report tool to create a comprehensive financial analysis report for ${bankName}. Call generate_bank_report with bank_name: "${bankName}".`,
          jobType: 'full-report'
        })
      });
      
      const job = await jobResponse.json();
      
      // Emit progress events
      this.emit('report_start', { bank_name: bankName });
      
      // Poll for completion with progress updates
      for (let i = 0; i < 120; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await fetch(`${this.baseURL}/api/jobs/${job.jobId}`);
        const status = await statusResponse.json();
        
        // Emit progress
        const progress = Math.min(10 + (i * 0.75), 95);
        this.emit('report_chunk', { 
          data: { 
            progress, 
            status: i < 30 ? 'Analyzing financial data...' : 
                   i < 60 ? 'Generating insights...' : 
                   'Finalizing report...' 
          } 
        });
        
        if (status.status === 'completed' || status.status === 'failed') {
          const resultResponse = await fetch(`${this.baseURL}/api/jobs/${job.jobId}/result`);
          const result = await resultResponse.json();
          
          if (result.status === 'failed') {
            this.emit('error', { message: result.error || 'Report generation failed' });
            throw new Error(result.error || 'Report generation failed');
          }
          
          // Emit completion
          this.emit('report_chunk', { 
            data: { 
              chunk: result.result,
              progress: 100,
              complete: true,
              status: 'Report generation completed!'
            } 
          });
          
          return { report: result.result, method: 'async-job' };
        }
      }
      
      throw new Error('Report generation timeout');
      
    } catch (error) {
      this.emit('error', { message: error.message });
      throw error;
    }
  }

  // SSE fallback for report generation
  generateReportSSE(bankName, mode) {
    return new Promise((resolve, reject) => {
      this.eventSource = new EventSource(`${this.baseURL}/api/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankName, mode })
      });

      this.eventSource.onmessage = (event) => {
        if (event.data === '[DONE]') {
          this.eventSource.close();
          resolve({ streaming: true, method: 'sse', status: 'complete' });
          return;
        }

        try {
          const data = JSON.parse(event.data);
          this.emit('report_chunk', data);
        } catch (e) {
          this.emit('report_chunk', { chunk: event.data });
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        this.eventSource.close();
        reject(error);
      };
    });
  }

  // Peer analysis using agents (async jobs for reliability)
  async analyzePeers(baseBank, peerBanks, metric) {
    // Try WebSocket first
    if (this.sendWebSocketMessage('peer_analysis', {
      base_bank: baseBank,
      peer_banks: peerBanks,
      metric
    })) {
      return { streaming: true, method: 'websocket' };
    }

    // Fallback to async jobs
    try {
      const jobResponse = await fetch(`${this.baseURL}/api/jobs/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputText: `Compare ${baseBank} vs ${peerBanks.join(', ')} using ${metric}. Provide comprehensive analysis with data.`,
          jobType: 'peer-analysis'
        })
      });
      
      const job = await jobResponse.json();
      
      // Poll for completion
      for (let i = 0; i < 60; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await fetch(`${this.baseURL}/api/jobs/${job.jobId}`);
        const status = await statusResponse.json();
        
        if (status.status === 'completed' || status.status === 'failed') {
          const resultResponse = await fetch(`${this.baseURL}/api/jobs/${job.jobId}/result`);
          const result = await resultResponse.json();
          
          if (result.status === 'failed') {
            throw new Error(result.error || 'Analysis failed');
          }
          
          return { 
            success: true, 
            result: {
              analysis: result.result,
              data: [],
              base_bank: baseBank,
              peer_banks: peerBanks
            },
            method: 'async-job'
          };
        }
      }
      
      throw new Error('Analysis request timeout');
      
    } catch (error) {
      console.error('Peer analysis error:', error);
      throw error;
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  // Cleanup connections
  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.listeners.clear();
  }
}

export default new AgentService();