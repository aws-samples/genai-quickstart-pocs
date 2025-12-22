#!/usr/bin/env node

/**
 * Local Demo Server
 * 
 * Runs the Investment AI Agent locally with mock data for quick demos
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'src', 'frontend')));

// Simple auth middleware for demo (accepts any token)
app.use((req, res, next) => {
    // For demo purposes, we'll accept any authorization header
    next();
});

// Mock data for demo
const mockInvestmentIdeas = [
    {
        id: 'idea-1',
        title: 'Technology Growth ETF Opportunity',
        confidenceScore: 0.85,
        potentialReturn: { expected: 12.5, min: 8.0, max: 18.0 },
        riskLevel: 'Moderate',
        explanation: 'Strong growth potential in cloud computing and AI sectors. The technology sector shows robust fundamentals with increasing enterprise digital transformation spending.',
        supportingAnalysis: 'Market analysis indicates 15% YoY growth in cloud infrastructure spending. Major tech companies report strong earnings with AI integration driving revenue growth.',
        riskFactors: [
            'Market volatility in tech sector',
            'Regulatory concerns around big tech',
            'Interest rate sensitivity'
        ],
        sectors: ['technology'],
        assetClasses: ['etfs']
    },
    {
        id: 'idea-2',
        title: 'Healthcare Innovation Stocks',
        confidenceScore: 0.78,
        potentialReturn: { expected: 10.2, min: 5.5, max: 16.8 },
        riskLevel: 'Moderate-High',
        explanation: 'Biotechnology and medical device companies with strong R&D pipelines. Aging demographics and healthcare innovation create long-term growth opportunities.',
        supportingAnalysis: 'FDA approvals increasing 20% YoY. Healthcare spending projected to grow 5.4% annually through 2028. Strong patent portfolios provide competitive moats.',
        riskFactors: [
            'Regulatory approval risks',
            'High R&D costs',
            'Patent cliff exposure'
        ],
        sectors: ['healthcare'],
        assetClasses: ['stocks']
    },
    {
        id: 'idea-3',
        title: 'Renewable Energy Infrastructure',
        confidenceScore: 0.82,
        potentialReturn: { expected: 14.1, min: 9.2, max: 20.5 },
        riskLevel: 'Moderate',
        explanation: 'Clean energy transition accelerating with government support and declining costs. Solar and wind infrastructure investments offer stable long-term returns.',
        supportingAnalysis: 'IRA tax credits provide 10-year visibility. Solar costs down 60% since 2020. Corporate renewable energy procurement up 25% annually.',
        riskFactors: [
            'Policy changes risk',
            'Commodity price volatility',
            'Grid integration challenges'
        ],
        sectors: ['renewable-energy'],
        assetClasses: ['stocks', 'etfs']
    }
];

// Mock agent workflow template
const agentWorkflowTemplate = [
    { agent: 'supervisor', status: 'pending', message: 'Request validated and workflow initiated', duration: 2000 },
    { agent: 'planning', status: 'pending', message: 'Research plan created with 4 analysis steps', duration: 3000 },
    { agent: 'research', status: 'pending', message: 'Market data and research gathered from 12 sources', duration: 4000 },
    { agent: 'analysis', status: 'pending', message: 'Financial models executed with Monte Carlo simulation', duration: 5000 },
    { agent: 'compliance', status: 'pending', message: 'Regulatory compliance verified for all recommendations', duration: 2000 },
    { agent: 'synthesis', status: 'pending', message: 'Investment narrative generated with risk assessment', duration: 3000 }
];

// Request tracking
const activeRequests = new Map();

// Function to simulate agent workflow
function simulateWorkflow(requestId, requestData) {
    const workflow = JSON.parse(JSON.stringify(agentWorkflowTemplate)); // Deep copy
    let currentStep = 0;
    let totalDuration = workflow.reduce((sum, step) => sum + step.duration, 0);
    
    const request = {
        id: requestId,
        status: 'processing',
        progress: 0,
        currentAgent: workflow[0].agent,
        workflow: workflow,
        startTime: Date.now(),
        totalDuration: totalDuration,
        requestData: requestData,
        results: null
    };
    
    activeRequests.set(requestId, request);
    
    // Process each agent step
    function processNextStep() {
        if (currentStep >= workflow.length) {
            // All steps completed
            request.status = 'completed';
            request.progress = 100;
            request.currentAgent = 'completed';
            request.results = generateResults(requestData);
            console.log(`✅ Request ${requestId} completed`);
            return;
        }
        
        const currentStepData = workflow[currentStep];
        currentStepData.status = 'active';
        request.currentAgent = currentStepData.agent;
        request.progress = Math.round(((currentStep + 0.5) / workflow.length) * 100);
        
        console.log(`🤖 ${requestId}: ${currentStepData.agent} agent working...`);
        
        setTimeout(() => {
            currentStepData.status = 'completed';
            currentStep++;
            request.progress = Math.round((currentStep / workflow.length) * 100);
            
            console.log(`✅ ${requestId}: ${currentStepData.agent} agent completed`);
            
            // Process next step
            processNextStep();
        }, currentStepData.duration);
    }
    
    // Start the workflow
    processNextStep();
}

// Function to generate results based on request
function generateResults(requestData) {
    const { sectors = [], assetClasses = [], maximumIdeas = 3 } = requestData;
    
    // Filter mock ideas based on request
    let filteredIdeas = mockInvestmentIdeas;
    
    if (sectors.length > 0) {
        filteredIdeas = filteredIdeas.filter(idea =>
            idea.sectors.some(sector => sectors.includes(sector))
        );
    }
    
    if (assetClasses.length > 0) {
        filteredIdeas = filteredIdeas.filter(idea =>
            idea.assetClasses.some(assetClass => assetClasses.includes(assetClass))
        );
    }
    
    return filteredIdeas.slice(0, maximumIdeas);
}

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        mode: 'demo'
    });
});

// Generate investment ideas (original endpoint)
app.post('/api/v1/ideas/generate', (req, res) => {
    console.log('📊 Investment idea request received:', req.body);

    const {
        investmentHorizon,
        riskTolerance,
        sectors = [],
        assetClasses = [],
        maximumIdeas = 3
    } = req.body;

    // Simulate processing delay
    setTimeout(() => {
        // Filter mock ideas based on request
        let filteredIdeas = mockInvestmentIdeas;

        if (sectors.length > 0) {
            filteredIdeas = filteredIdeas.filter(idea =>
                idea.sectors.some(sector => sectors.includes(sector))
            );
        }

        if (assetClasses.length > 0) {
            filteredIdeas = filteredIdeas.filter(idea =>
                idea.assetClasses.some(assetClass => assetClasses.includes(assetClass))
            );
        }

        // Limit to requested number
        filteredIdeas = filteredIdeas.slice(0, maximumIdeas);

        const response = {
            success: true,
            data: {
                ideas: filteredIdeas,
                metadata: {
                    requestId: `req-${Date.now()}`,
                    processingTime: 1200,
                    agentWorkflow: agentWorkflow,
                    totalSources: 12,
                    complianceChecks: 8
                }
            },
            timestamp: new Date().toISOString()
        };

        console.log(`✅ Generated ${filteredIdeas.length} investment ideas`);
        res.json(response);
    }, 1000); // 1 second delay to simulate processing
});

// Investment ideas request endpoint (what the frontend expects)
app.post('/api/v1/ideas/requests', (req, res) => {
    console.log('📊 Investment idea request received (frontend format):', req.body);
    
    const requestId = `req-${Date.now()}`;
    const totalDuration = agentWorkflowTemplate.reduce((sum, step) => sum + step.duration, 0);
    
    // Start the workflow simulation
    simulateWorkflow(requestId, req.body);
    
    // Return request ID immediately
    res.json({
        success: true,
        requestId: requestId,
        status: 'processing',
        estimatedTime: totalDuration,
        timestamp: new Date().toISOString()
    });
});

// Get request status
app.get('/api/v1/ideas/requests/:requestId/status', (req, res) => {
    const { requestId } = req.params;
    
    console.log(`📊 Status check for request: ${requestId}`);
    
    const request = activeRequests.get(requestId);
    
    if (!request) {
        console.log(`❌ Request ${requestId} not found`);
        return res.status(404).json({
            success: false,
            error: {
                code: 'REQUEST_NOT_FOUND',
                message: 'Request not found'
            }
        });
    }
    
    console.log(`📈 Request ${requestId} status: ${request.status}, progress: ${request.progress}%, agent: ${request.currentAgent}`);
    
    res.json({
        success: true,
        requestId: requestId,
        status: request.status,
        progress: {
            percentage: request.progress,
            currentPhase: request.currentAgent
        },
        processingHistory: request.workflow.map(step => ({
            step: step.agent,
            status: step.status,
            message: step.message
        })),
        estimatedTimeRemaining: request.status === 'completed' ? 0 : 
            Math.max(0, request.totalDuration - (Date.now() - request.startTime)),
        timestamp: new Date().toISOString()
    });
});

// Get request results
app.get('/api/v1/ideas/requests/:requestId/results', (req, res) => {
    const { requestId } = req.params;
    
    const request = activeRequests.get(requestId);
    
    if (!request) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'REQUEST_NOT_FOUND',
                message: 'Request not found'
            }
        });
    }
    
    if (request.status !== 'completed') {
        return res.status(400).json({
            success: false,
            error: {
                code: 'REQUEST_NOT_COMPLETED',
                message: 'Request is still processing'
            }
        });
    }
    
    const response = {
        success: true,
        data: {
            requestId: requestId,
            ideas: request.results || [],
            metadata: {
                processingTime: Date.now() - request.startTime,
                agentWorkflow: request.workflow,
                totalSources: 12,
                complianceChecks: 8
            }
        },
        timestamp: new Date().toISOString()
    };
    
    console.log(`📋 Returning results for request ${requestId}`);
    res.json(response);
});

// Cancel request
app.post('/api/v1/ideas/requests/:requestId/cancel', (req, res) => {
    const { requestId } = req.params;

    res.json({
        success: true,
        data: {
            requestId: requestId,
            status: 'cancelled'
        },
        timestamp: new Date().toISOString()
    });
});

// Request history
app.get('/api/v1/ideas/requests/history', (req, res) => {
    const mockHistory = [
        {
            requestId: 'req-1234567890',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            status: 'completed',
            parameters: {
                investmentHorizon: 'medium',
                riskTolerance: 'moderate',
                sectors: ['technology']
            },
            resultCount: 3
        },
        {
            requestId: 'req-1234567891',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            status: 'completed',
            parameters: {
                investmentHorizon: 'long',
                riskTolerance: 'conservative',
                sectors: ['healthcare', 'utilities']
            },
            resultCount: 2
        }
    ];

    res.json({
        success: true,
        data: {
            requests: mockHistory,
            total: mockHistory.length
        },
        timestamp: new Date().toISOString()
    });
});

// Feedback endpoint
app.post('/api/v1/feedback', (req, res) => {
    console.log('📝 Feedback received:', req.body);

    res.json({
        success: true,
        data: {
            id: `feedback-${Date.now()}`,
            status: 'received'
        },
        timestamp: new Date().toISOString()
    });
});

// Get specific investment idea
app.get('/api/v1/ideas/:id', (req, res) => {
    const idea = mockInvestmentIdeas.find(i => i.id === req.params.id);

    if (!idea) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'IDEA_NOT_FOUND',
                message: 'Investment idea not found'
            }
        });
    }

    res.json({
        success: true,
        data: idea,
        timestamp: new Date().toISOString()
    });
});

// Market data endpoint
app.get('/api/v1/market/signals', (req, res) => {
    const mockSignals = {
        marketSentiment: 'Bullish',
        vixLevel: 18.5,
        sectorRotation: {
            outperforming: ['Technology', 'Healthcare'],
            underperforming: ['Utilities', 'Consumer Staples']
        },
        economicIndicators: {
            gdpGrowth: 2.1,
            inflation: 3.2,
            unemployment: 3.8
        },
        timestamp: new Date().toISOString()
    };

    res.json({
        success: true,
        data: mockSignals,
        timestamp: new Date().toISOString()
    });
});

// Agent workflow status
app.get('/api/v1/workflow/status', (req, res) => {
    res.json({
        success: true,
        data: {
            agents: agentWorkflow,
            totalAgents: 6,
            activeAgents: 0,
            completedAgents: 6
        },
        timestamp: new Date().toISOString()
    });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'src', 'frontend', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Endpoint not found'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 Investment AI Agent - Local Demo Server');
    console.log('==========================================');
    console.log(`🌐 Server running at: http://localhost:${PORT}`);
    console.log(`📊 API Base URL: http://localhost:${PORT}/api/v1`);
    console.log('');
    console.log('📋 Available Endpoints:');
    console.log('   GET  /health                           - Health check');
    console.log('   POST /api/v1/ideas/requests            - Create investment request (frontend)');
    console.log('   GET  /api/v1/ideas/requests/:id/status - Get request status');
    console.log('   GET  /api/v1/ideas/requests/:id/results- Get request results');
    console.log('   POST /api/v1/ideas/generate            - Generate investment ideas (direct)');
    console.log('   GET  /api/v1/ideas/:id                 - Get specific idea');
    console.log('   GET  /api/v1/market/signals            - Market data');
    console.log('   POST /api/v1/feedback                  - Submit feedback');
    console.log('');
    console.log('🧪 Test Commands:');
    console.log(`   curl http://localhost:${PORT}/health`);
    console.log(`   curl -X POST http://localhost:${PORT}/api/v1/ideas/generate -H "Content-Type: application/json" -d '{"investmentHorizon":"medium","riskTolerance":"moderate","sectors":["technology"],"assetClasses":["stocks"],"maximumIdeas":2}'`);
    console.log('');
    console.log('🎭 Demo Features:');
    console.log('   ✅ Mock investment ideas with realistic data');
    console.log('   ✅ Simulated multi-agent workflow');
    console.log('   ✅ Web interface for interactive testing');
    console.log('   ✅ No AWS deployment required');
    console.log('   ✅ Instant responses for fast demos');
    console.log('');
    console.log('Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down demo server...');
    process.exit(0);
});