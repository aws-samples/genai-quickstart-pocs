/**
 * Simple test server for the Investment AI Agent frontend
 * This server provides mock responses for testing the frontend interface
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use('/static', express.static(path.join(__dirname, 'src/frontend')));

// Mock data store
const mockRequests = new Map();

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  req.user = {
    userId: 'test-user-123',
    organizationId: 'test-org-123',
    role: 'analyst',
    permissions: ['read', 'write']
  };
  next();
};

// Frontend routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/frontend/index.html'));
});

app.get('/styles.css', (req, res) => {
  res.setHeader('Content-Type', 'text/css');
  res.sendFile(path.join(__dirname, 'src/frontend/styles.css'));
});

app.get('/app.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'src/frontend/app.js'));
});

// Mock API endpoints
app.post('/api/v1/ideas/requests', mockAuth, (req, res) => {
  const requestId = uuidv4();
  const request = {
    id: requestId,
    userId: req.user.userId,
    parameters: req.body.parameters,
    priority: req.body.priority || 'medium',
    timestamp: new Date(),
    status: 'submitted',
    estimatedProcessingTime: 120 // 2 minutes
  };

  mockRequests.set(requestId, request);

  // Simulate processing stages
  setTimeout(() => {
    const req = mockRequests.get(requestId);
    if (req) {
      req.status = 'validated';
      req.progress = { percentage: 20, currentPhase: 'validation' };
    }
  }, 2000);

  setTimeout(() => {
    const req = mockRequests.get(requestId);
    if (req) {
      req.status = 'processing';
      req.progress = { percentage: 50, currentPhase: 'research' };
    }
  }, 10000);

  setTimeout(() => {
    const req = mockRequests.get(requestId);
    if (req) {
      req.status = 'completed';
      req.progress = { percentage: 100, currentPhase: 'finalization' };
      req.results = generateMockResults(req.parameters);
    }
  }, 30000);

  res.status(202).json({
    message: 'Investment idea request submitted successfully',
    requestId,
    status: request.status,
    estimatedProcessingTime: request.estimatedProcessingTime,
    trackingUrl: `/api/v1/ideas/requests/${requestId}/status`
  });
});

app.get('/api/v1/ideas/requests/:requestId/status', mockAuth, (req, res) => {
  const { requestId } = req.params;
  const request = mockRequests.get(requestId);

  if (!request) {
    res.status(404).json({
      error: 'Request not found',
      code: 'REQUEST_NOT_FOUND'
    });
    return;
  }

  res.json({
    requestId,
    status: request.status,
    progress: request.progress || { percentage: 10, currentPhase: 'validation' },
    estimatedTimeRemaining: request.status === 'completed' ? 0 : 15,
    currentStep: request.status,
    results: request.results,
    lastUpdated: new Date()
  });
});

app.get('/api/v1/ideas/requests/:requestId/results', mockAuth, (req, res) => {
  const { requestId } = req.params;
  const request = mockRequests.get(requestId);

  if (!request) {
    res.status(404).json({
      error: 'Request results not found',
      code: 'RESULTS_NOT_FOUND'
    });
    return;
  }

  if (request.status !== 'completed') {
    res.status(202).json({
      message: 'Request still processing',
      status: request.status,
      requestId
    });
    return;
  }

  res.json({
    requestId,
    status: request.status,
    investmentIdeas: request.results.investmentIdeas,
    processingMetrics: request.results.processingMetrics,
    generatedAt: request.results.generatedAt,
    metadata: request.results.metadata
  });
});

app.delete('/api/v1/ideas/requests/:requestId', mockAuth, (req, res) => {
  const { requestId } = req.params;
  const request = mockRequests.get(requestId);

  if (!request) {
    res.status(404).json({
      error: 'Request not found or cannot be cancelled',
      code: 'CANCELLATION_FAILED'
    });
    return;
  }

  request.status = 'cancelled';
  
  res.json({
    message: 'Request cancelled successfully',
    requestId,
    status: 'cancelled'
  });
});

app.get('/api/v1/ideas/requests', mockAuth, (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userRequests = Array.from(mockRequests.values())
    .filter(request => request.userId === req.user.userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const paginatedRequests = userRequests.slice(startIndex, endIndex);

  res.json({
    requests: paginatedRequests.map(req => ({
      id: req.id,
      parameters: req.parameters,
      status: req.status,
      priority: req.priority,
      submittedAt: req.timestamp,
      completedAt: req.status === 'completed' ? new Date() : undefined,
      processingTime: req.status === 'completed' ? 30000 : undefined,
      resultCount: req.results?.investmentIdeas?.length || 0,
      qualityScore: req.results ? 85 : undefined
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: userRequests.length,
      totalPages: Math.ceil(userRequests.length / parseInt(limit))
    }
  });
});

app.post('/api/v1/ideas/requests/:requestId/feedback', mockAuth, (req, res) => {
  const { requestId } = req.params;
  const request = mockRequests.get(requestId);

  if (!request) {
    res.status(404).json({
      error: 'Request not found',
      code: 'REQUEST_NOT_FOUND'
    });
    return;
  }

  const feedbackId = uuidv4();
  
  res.json({
    message: 'Feedback submitted successfully',
    requestId,
    feedbackId
  });
});

// Helper function to generate mock results
function generateMockResults(parameters) {
  const investmentIdeas = [];
  const maxIdeas = parameters.maximumIdeas || 5;

  for (let i = 0; i < Math.min(maxIdeas, 3); i++) {
    investmentIdeas.push({
      id: uuidv4(),
      title: `Investment Opportunity ${i + 1}`,
      description: `A ${parameters.riskTolerance} investment opportunity in the ${parameters.investmentHorizon} timeframe.`,
      rationale: `Based on current market conditions and your ${parameters.riskTolerance} risk tolerance, this investment aligns with your ${parameters.investmentHorizon} investment horizon. The analysis shows strong fundamentals and positive market sentiment.`,
      confidenceScore: Math.floor(Math.random() * 30) + 70, // 70-100
      timeHorizon: parameters.investmentHorizon,
      potentialReturn: {
        best: Math.floor(Math.random() * 20) + 15,
        expected: Math.floor(Math.random() * 15) + 8,
        worst: Math.floor(Math.random() * 10) - 5
      },
      riskFactors: [
        {
          level: 'medium',
          description: 'Market volatility may impact short-term performance'
        },
        {
          level: 'low',
          description: 'Regulatory changes in the sector'
        }
      ],
      supportingData: [
        {
          source: 'Market Analysis',
          type: 'fundamental',
          value: 'Strong earnings growth',
          timestamp: new Date(),
          reliability: 0.9
        }
      ],
      complianceConsiderations: []
    });
  }

  return {
    investmentIdeas,
    processingMetrics: {
      totalProcessingTime: 30000,
      modelExecutionTime: 15000,
      dataRetrievalTime: 8000,
      validationTime: 2000
    },
    generatedAt: new Date(),
    metadata: {
      generationMethod: 'multi-agent',
      researchSources: ['Market Data', 'Financial Reports', 'News Analysis'],
      marketDataTimestamp: new Date(),
      complianceVersion: '1.0.0'
    }
  };
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Investment AI Agent Test Server' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Investment AI Agent test server running on port ${PORT}`);
  console.log(`Frontend available at: http://localhost:${PORT}`);
  console.log(`API documentation at: http://localhost:${PORT}/api-docs`);
});

module.exports = app;