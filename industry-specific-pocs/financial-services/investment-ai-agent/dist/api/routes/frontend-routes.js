"use strict";
/**
 * Frontend Routes
 * Serves the investment idea request interface and static assets
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
// Serve the main frontend application
router.get('/', (req, res) => {
    const indexPath = path_1.default.join(__dirname, '../../frontend/index.html');
    if (fs_1.default.existsSync(indexPath)) {
        res.sendFile(indexPath);
    }
    else {
        res.status(404).json({
            error: 'Frontend not found',
            message: 'The investment idea request interface is not available'
        });
    }
});
// Serve static assets
router.get('/styles.css', (req, res) => {
    const stylesPath = path_1.default.join(__dirname, '../../frontend/styles.css');
    if (fs_1.default.existsSync(stylesPath)) {
        res.setHeader('Content-Type', 'text/css');
        res.sendFile(stylesPath);
    }
    else {
        res.status(404).send('/* Styles not found */');
    }
});
router.get('/app.js', (req, res) => {
    const appPath = path_1.default.join(__dirname, '../../frontend/app.js');
    if (fs_1.default.existsSync(appPath)) {
        res.setHeader('Content-Type', 'application/javascript');
        res.sendFile(appPath);
    }
    else {
        res.status(404).send('// Application script not found');
    }
});
// Health check endpoint for the frontend
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Investment AI Agent Frontend',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
// API documentation endpoint
router.get('/api-docs', (req, res) => {
    const apiDocs = {
        title: 'Investment AI Agent API',
        version: '1.0.0',
        description: 'API for generating investment ideas using AI',
        baseUrl: '/api/v1',
        endpoints: {
            'POST /ideas/requests': {
                description: 'Submit a new investment idea generation request',
                authentication: 'Bearer token required',
                rateLimit: '10 requests per 15 minutes',
                parameters: {
                    investmentHorizon: 'required - Investment time horizon',
                    riskTolerance: 'required - Risk tolerance level',
                    investmentAmount: 'optional - Investment amount',
                    currency: 'optional - Base currency',
                    sectors: 'optional - Preferred sectors',
                    assetClasses: 'optional - Preferred asset classes',
                    geographicFocus: 'optional - Geographic focus',
                    excludedInvestments: 'optional - Investments to exclude',
                    minimumConfidence: 'optional - Minimum confidence score (0-100)',
                    maximumIdeas: 'optional - Maximum number of ideas (1-20)',
                    researchDepth: 'optional - Research depth level',
                    includeESGFactors: 'optional - Include ESG factors',
                    includeVisualizations: 'optional - Include charts and graphs',
                    includeRiskAnalysis: 'optional - Include risk analysis'
                }
            },
            'GET /ideas/requests/:requestId/status': {
                description: 'Get request status and progress',
                authentication: 'Bearer token required',
                parameters: {
                    requestId: 'required - UUID of the request'
                }
            },
            'GET /ideas/requests/:requestId/results': {
                description: 'Get request results',
                authentication: 'Bearer token required',
                parameters: {
                    requestId: 'required - UUID of the request'
                }
            },
            'DELETE /ideas/requests/:requestId': {
                description: 'Cancel a pending request',
                authentication: 'Bearer token required',
                parameters: {
                    requestId: 'required - UUID of the request'
                }
            },
            'GET /ideas/requests': {
                description: 'Get user request history',
                authentication: 'Bearer token required',
                parameters: {
                    page: 'optional - Page number (default: 1)',
                    limit: 'optional - Items per page (default: 10)',
                    status: 'optional - Filter by status',
                    dateFrom: 'optional - Filter from date',
                    dateTo: 'optional - Filter to date'
                }
            },
            'POST /ideas/requests/:requestId/feedback': {
                description: 'Submit feedback for a completed request',
                authentication: 'Bearer token required',
                parameters: {
                    requestId: 'required - UUID of the request',
                    rating: 'required - Overall rating (1-5)',
                    comments: 'optional - Feedback comments',
                    actionTaken: 'optional - Action taken based on results'
                }
            },
            'GET /ideas/requests/templates': {
                description: 'Get request parameter templates',
                authentication: 'Bearer token required'
            },
            'GET /ideas/requests/validation/schema': {
                description: 'Get validation schema for request parameters',
                authentication: 'Bearer token required'
            }
        },
        authentication: {
            type: 'Bearer Token',
            description: 'Include Authorization header with Bearer token',
            example: 'Authorization: Bearer your-jwt-token-here'
        },
        errorCodes: {
            400: 'Bad Request - Invalid parameters',
            401: 'Unauthorized - Authentication required',
            403: 'Forbidden - Insufficient permissions',
            404: 'Not Found - Resource not found',
            429: 'Too Many Requests - Rate limit exceeded',
            500: 'Internal Server Error - Server error'
        }
    };
    res.json(apiDocs);
});
// Request form validation endpoint
router.post('/validate-request', (req, res) => {
    const { parameters } = req.body;
    if (!parameters) {
        res.status(400).json({
            isValid: false,
            errors: ['Parameters are required'],
            warnings: []
        });
        return;
    }
    const errors = [];
    const warnings = [];
    // Required field validation
    if (!parameters.investmentHorizon) {
        errors.push('Investment horizon is required');
    }
    if (!parameters.riskTolerance) {
        errors.push('Risk tolerance is required');
    }
    // Range validation
    if (parameters.minimumConfidence !== undefined) {
        if (parameters.minimumConfidence < 0 || parameters.minimumConfidence > 100) {
            errors.push('Minimum confidence must be between 0 and 100');
        }
    }
    if (parameters.maximumIdeas !== undefined) {
        if (parameters.maximumIdeas < 1 || parameters.maximumIdeas > 20) {
            errors.push('Maximum ideas must be between 1 and 20');
        }
    }
    if (parameters.investmentAmount !== undefined) {
        if (parameters.investmentAmount < 0) {
            errors.push('Investment amount must be positive');
        }
    }
    // Business logic warnings
    if (parameters.riskTolerance === 'very-aggressive' && parameters.investmentHorizon === 'short-term') {
        warnings.push('Very aggressive risk tolerance with short-term horizon may result in high volatility');
    }
    if (parameters.riskTolerance === 'very-conservative' && parameters.investmentHorizon === 'long-term') {
        warnings.push('Very conservative approach with long-term horizon may limit growth potential');
    }
    if (!parameters.assetClasses || parameters.assetClasses.length === 0) {
        warnings.push('No asset classes selected - all asset classes will be considered');
    }
    if (parameters.excludedInvestments && parameters.excludedInvestments.length > 50) {
        warnings.push('Large number of exclusions may limit investment opportunities');
    }
    if (parameters.minimumConfidence && parameters.minimumConfidence > 90) {
        warnings.push('Very high confidence threshold may result in fewer investment ideas');
    }
    res.json({
        isValid: errors.length === 0,
        errors,
        warnings
    });
});
// Get available options for form fields
router.get('/form-options', (req, res) => {
    const options = {
        investmentHorizons: [
            { value: 'intraday', label: 'Intraday', description: 'Same-day trading opportunities' },
            { value: 'short-term', label: 'Short-term (< 1 year)', description: 'Investments held for less than one year' },
            { value: 'medium-term', label: 'Medium-term (1-5 years)', description: 'Investments held for one to five years' },
            { value: 'long-term', label: 'Long-term (> 5 years)', description: 'Investments held for more than five years' },
            { value: 'flexible', label: 'Flexible', description: 'Adaptable based on market conditions' }
        ],
        riskTolerances: [
            { value: 'very-conservative', label: 'Very Conservative', description: 'Minimal risk, capital preservation focus' },
            { value: 'conservative', label: 'Conservative', description: 'Low risk, steady returns' },
            { value: 'moderate', label: 'Moderate', description: 'Balanced risk and return' },
            { value: 'aggressive', label: 'Aggressive', description: 'Higher risk for higher returns' },
            { value: 'very-aggressive', label: 'Very Aggressive', description: 'Maximum risk for maximum returns' }
        ],
        assetClasses: [
            { value: 'equities', label: 'Equities', description: 'Stocks and equity securities' },
            { value: 'fixed-income', label: 'Fixed Income', description: 'Bonds and debt securities' },
            { value: 'commodities', label: 'Commodities', description: 'Physical goods and raw materials' },
            { value: 'currencies', label: 'Currencies', description: 'Foreign exchange and currency pairs' },
            { value: 'real-estate', label: 'Real Estate', description: 'Property and real estate investments' },
            { value: 'alternatives', label: 'Alternatives', description: 'Hedge funds, private equity, etc.' },
            { value: 'cryptocurrencies', label: 'Cryptocurrencies', description: 'Digital currencies and tokens' },
            { value: 'derivatives', label: 'Derivatives', description: 'Options, futures, and other derivatives' }
        ],
        geographicFocus: [
            { value: 'north-america', label: 'North America', description: 'US, Canada, Mexico' },
            { value: 'europe', label: 'Europe', description: 'European markets' },
            { value: 'asia-pacific', label: 'Asia Pacific', description: 'Asian and Pacific markets' },
            { value: 'emerging-markets', label: 'Emerging Markets', description: 'Developing economies' },
            { value: 'global', label: 'Global', description: 'Worldwide diversification' },
            { value: 'domestic', label: 'Domestic', description: 'Home country focus' }
        ],
        researchDepths: [
            { value: 'basic', label: 'Basic', description: 'Quick analysis with key metrics' },
            { value: 'standard', label: 'Standard', description: 'Comprehensive analysis with multiple sources' },
            { value: 'comprehensive', label: 'Comprehensive', description: 'Deep analysis with extensive research' },
            { value: 'deep-dive', label: 'Deep Dive', description: 'Exhaustive analysis with all available data' }
        ],
        liquidityRequirements: [
            { value: 'high', label: 'High', description: 'Easy to buy/sell quickly' },
            { value: 'medium', label: 'Medium', description: 'Moderate liquidity requirements' },
            { value: 'low', label: 'Low', description: 'Can accept illiquid investments' },
            { value: 'flexible', label: 'Flexible', description: 'Adaptable to opportunities' }
        ],
        outputFormats: [
            { value: 'detailed', label: 'Detailed', description: 'Comprehensive report with all analysis' },
            { value: 'summary', label: 'Summary', description: 'Concise overview of key points' },
            { value: 'executive', label: 'Executive', description: 'High-level summary for decision makers' },
            { value: 'technical', label: 'Technical', description: 'Technical analysis focus' },
            { value: 'presentation', label: 'Presentation', description: 'Formatted for presentations' }
        ],
        priorities: [
            { value: 'low', label: 'Low', description: 'Standard processing time' },
            { value: 'medium', label: 'Medium', description: 'Balanced priority' },
            { value: 'high', label: 'High', description: 'Faster processing' },
            { value: 'urgent', label: 'Urgent', description: 'Highest priority processing' }
        ],
        currencies: [
            { value: 'USD', label: 'US Dollar (USD)' },
            { value: 'EUR', label: 'Euro (EUR)' },
            { value: 'GBP', label: 'British Pound (GBP)' },
            { value: 'JPY', label: 'Japanese Yen (JPY)' },
            { value: 'CAD', label: 'Canadian Dollar (CAD)' },
            { value: 'AUD', label: 'Australian Dollar (AUD)' },
            { value: 'CHF', label: 'Swiss Franc (CHF)' },
            { value: 'CNY', label: 'Chinese Yuan (CNY)' },
            { value: 'INR', label: 'Indian Rupee (INR)' },
            { value: 'BRL', label: 'Brazilian Real (BRL)' }
        ]
    };
    res.json(options);
});
exports.default = router;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJvbnRlbmQtcm91dGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2FwaS9yb3V0ZXMvZnJvbnRlbmQtcm91dGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O0dBR0c7Ozs7O0FBRUgscUNBQW9EO0FBQ3BELGdEQUF3QjtBQUN4Qiw0Q0FBb0I7QUFFcEIsTUFBTSxNQUFNLEdBQUcsSUFBQSxnQkFBTSxHQUFFLENBQUM7QUFFeEIsc0NBQXNDO0FBQ3RDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBWSxFQUFFLEdBQWEsRUFBRSxFQUFFO0lBQzlDLE1BQU0sU0FBUyxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLDJCQUEyQixDQUFDLENBQUM7SUFFcEUsSUFBSSxZQUFFLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxFQUFFO1FBQzVCLEdBQUcsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDekI7U0FBTTtRQUNMLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ25CLEtBQUssRUFBRSxvQkFBb0I7WUFDM0IsT0FBTyxFQUFFLHdEQUF3RDtTQUNsRSxDQUFDLENBQUM7S0FDSjtBQUNILENBQUMsQ0FBQyxDQUFDO0FBRUgsc0JBQXNCO0FBQ3RCLE1BQU0sQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUMsR0FBWSxFQUFFLEdBQWEsRUFBRSxFQUFFO0lBQ3hELE1BQU0sVUFBVSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLDJCQUEyQixDQUFDLENBQUM7SUFFckUsSUFBSSxZQUFFLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQzdCLEdBQUcsQ0FBQyxTQUFTLENBQUMsY0FBYyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7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QUFFLG9CQUFvQixFQUFFO1lBQzdDLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsb0JBQW9CLEVBQUU7WUFDN0MsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxzQkFBc0IsRUFBRTtTQUNoRDtLQUNGLENBQUM7SUFFRixHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3BCLENBQUMsQ0FBQyxDQUFDO0FBRUgsa0JBQWUsTUFBTSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBGcm9udGVuZCBSb3V0ZXNcbiAqIFNlcnZlcyB0aGUgaW52ZXN0bWVudCBpZGVhIHJlcXVlc3QgaW50ZXJmYWNlIGFuZCBzdGF0aWMgYXNzZXRzXG4gKi9cblxuaW1wb3J0IHsgUm91dGVyLCBSZXF1ZXN0LCBSZXNwb25zZSB9IGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuXG5jb25zdCByb3V0ZXIgPSBSb3V0ZXIoKTtcblxuLy8gU2VydmUgdGhlIG1haW4gZnJvbnRlbmQgYXBwbGljYXRpb25cbnJvdXRlci5nZXQoJy8nLCAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSA9PiB7XG4gIGNvbnN0IGluZGV4UGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi9mcm9udGVuZC9pbmRleC5odG1sJyk7XG4gIFxuICBpZiAoZnMuZXhpc3RzU3luYyhpbmRleFBhdGgpKSB7XG4gICAgcmVzLnNlbmRGaWxlKGluZGV4UGF0aCk7XG4gIH0gZWxzZSB7XG4gICAgcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xuICAgICAgZXJyb3I6ICdGcm9udGVuZCBub3QgZm91bmQnLFxuICAgICAgbWVzc2FnZTogJ1RoZSBpbnZlc3RtZW50IGlkZWEgcmVxdWVzdCBpbnRlcmZhY2UgaXMgbm90IGF2YWlsYWJsZSdcbiAgICB9KTtcbiAgfVxufSk7XG5cbi8vIFNlcnZlIHN0YXRpYyBhc3NldHNcbnJvdXRlci5nZXQoJy9zdHlsZXMuY3NzJywgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkgPT4ge1xuICBjb25zdCBzdHlsZXNQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uL2Zyb250ZW5kL3N0eWxlcy5jc3MnKTtcbiAgXG4gIGlmIChmcy5leGlzdHNTeW5jKHN0eWxlc1BhdGgpKSB7XG4gICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ3RleHQvY3NzJyk7XG4gICAgcmVzLnNlbmRGaWxlKHN0eWxlc1BhdGgpO1xuICB9IGVsc2Uge1xuICAgIHJlcy5zdGF0dXMoNDA0KS5zZW5kKCcvKiBTdHlsZXMgbm90IGZvdW5kICovJyk7XG4gIH1cbn0pO1xuXG5yb3V0ZXIuZ2V0KCcvYXBwLmpzJywgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkgPT4ge1xuICBjb25zdCBhcHBQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uL2Zyb250ZW5kL2FwcC5qcycpO1xuICBcbiAgaWYgKGZzLmV4aXN0c1N5bmMoYXBwUGF0aCkpIHtcbiAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vamF2YXNjcmlwdCcpO1xuICAgIHJlcy5zZW5kRmlsZShhcHBQYXRoKTtcbiAgfSBlbHNlIHtcbiAgICByZXMuc3RhdHVzKDQwNCkuc2VuZCgnLy8gQXBwbGljYXRpb24gc2NyaXB0IG5vdCBmb3VuZCcpO1xuICB9XG59KTtcblxuLy8gSGVhbHRoIGNoZWNrIGVuZHBvaW50IGZvciB0aGUgZnJvbnRlbmRcbnJvdXRlci5nZXQoJy9oZWFsdGgnLCAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSA9PiB7XG4gIHJlcy5qc29uKHtcbiAgICBzdGF0dXM6ICdoZWFsdGh5JyxcbiAgICBzZXJ2aWNlOiAnSW52ZXN0bWVudCBBSSBBZ2VudCBGcm9udGVuZCcsXG4gICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgdmVyc2lvbjogJzEuMC4wJ1xuICB9KTtcbn0pO1xuXG4vLyBBUEkgZG9jdW1lbnRhdGlvbiBlbmRwb2ludFxucm91dGVyLmdldCgnL2FwaS1kb2NzJywgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkgPT4ge1xuICBjb25zdCBhcGlEb2NzID0ge1xuICAgIHRpdGxlOiAnSW52ZXN0bWVudCBBSSBBZ2VudCBBUEknLFxuICAgIHZlcnNpb246ICcxLjAuMCcsXG4gICAgZGVzY3JpcHRpb246ICdBUEkgZm9yIGdlbmVyYXRpbmcgaW52ZXN0bWVudCBpZGVhcyB1c2luZyBBSScsXG4gICAgYmFzZVVybDogJy9hcGkvdjEnLFxuICAgIGVuZHBvaW50czoge1xuICAgICAgJ1BPU1QgL2lkZWFzL3JlcXVlc3RzJzoge1xuICAgICAgICBkZXNjcmlwdGlvbjogJ1N1Ym1pdCBhIG5ldyBpbnZlc3RtZW50IGlkZWEgZ2VuZXJhdGlvbiByZXF1ZXN0JyxcbiAgICAgICAgYXV0aGVudGljYXRpb246ICdCZWFyZXIgdG9rZW4gcmVxdWlyZWQnLFxuICAgICAgICByYXRlTGltaXQ6ICcxMCByZXF1ZXN0cyBwZXIgMTUgbWludXRlcycsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ3JlcXVpcmVkIC0gSW52ZXN0bWVudCB0aW1lIGhvcml6b24nLFxuICAgICAgICAgIHJpc2tUb2xlcmFuY2U6ICdyZXF1aXJlZCAtIFJpc2sgdG9sZXJhbmNlIGxldmVsJyxcbiAgICAgICAgICBpbnZlc3RtZW50QW1vdW50OiAnb3B0aW9uYWwgLSBJbnZlc3RtZW50IGFtb3VudCcsXG4gICAgICAgICAgY3VycmVuY3k6ICdvcHRpb25hbCAtIEJhc2UgY3VycmVuY3knLFxuICAgICAgICAgIHNlY3RvcnM6ICdvcHRpb25hbCAtIFByZWZlcnJlZCBzZWN0b3JzJyxcbiAgICAgICAgICBhc3NldENsYXNzZXM6ICdvcHRpb25hbCAtIFByZWZlcnJlZCBhc3NldCBjbGFzc2VzJyxcbiAgICAgICAgICBnZW9ncmFwaGljRm9jdXM6ICdvcHRpb25hbCAtIEdlb2dyYXBoaWMgZm9jdXMnLFxuICAgICAgICAgIGV4Y2x1ZGVkSW52ZXN0bWVudHM6ICdvcHRpb25hbCAtIEludmVzdG1lbnRzIHRvIGV4Y2x1ZGUnLFxuICAgICAgICAgIG1pbmltdW1Db25maWRlbmNlOiAnb3B0aW9uYWwgLSBNaW5pbXVtIGNvbmZpZGVuY2Ugc2NvcmUgKDAtMTAwKScsXG4gICAgICAgICAgbWF4aW11bUlkZWFzOiAnb3B0aW9uYWwgLSBNYXhpbXVtIG51bWJlciBvZiBpZGVhcyAoMS0yMCknLFxuICAgICAgICAgIHJlc2VhcmNoRGVwdGg6ICdvcHRpb25hbCAtIFJlc2VhcmNoIGRlcHRoIGxldmVsJyxcbiAgICAgICAgICBpbmNsdWRlRVNHRmFjdG9yczogJ29wdGlvbmFsIC0gSW5jbHVkZSBFU0cgZmFjdG9ycycsXG4gICAgICAgICAgaW5jbHVkZVZpc3VhbGl6YXRpb25zOiAnb3B0aW9uYWwgLSBJbmNsdWRlIGNoYXJ0cyBhbmQgZ3JhcGhzJyxcbiAgICAgICAgICBpbmNsdWRlUmlza0FuYWx5c2lzOiAnb3B0aW9uYWwgLSBJbmNsdWRlIHJpc2sgYW5hbHlzaXMnXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAnR0VUIC9pZGVhcy9yZXF1ZXN0cy86cmVxdWVzdElkL3N0YXR1cyc6IHtcbiAgICAgICAgZGVzY3JpcHRpb246ICdHZXQgcmVxdWVzdCBzdGF0dXMgYW5kIHByb2dyZXNzJyxcbiAgICAgICAgYXV0aGVudGljYXRpb246ICdCZWFyZXIgdG9rZW4gcmVxdWlyZWQnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgcmVxdWVzdElkOiAncmVxdWlyZWQgLSBVVUlEIG9mIHRoZSByZXF1ZXN0J1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgJ0dFVCAvaWRlYXMvcmVxdWVzdHMvOnJlcXVlc3RJZC9yZXN1bHRzJzoge1xuICAgICAgICBkZXNjcmlwdGlvbjogJ0dldCByZXF1ZXN0IHJlc3VsdHMnLFxuICAgICAgICBhdXRoZW50aWNhdGlvbjogJ0JlYXJlciB0b2tlbiByZXF1aXJlZCcsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICByZXF1ZXN0SWQ6ICdyZXF1aXJlZCAtIFVVSUQgb2YgdGhlIHJlcXVlc3QnXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAnREVMRVRFIC9pZGVhcy9yZXF1ZXN0cy86cmVxdWVzdElkJzoge1xuICAgICAgICBkZXNjcmlwdGlvbjogJ0NhbmNlbCBhIHBlbmRpbmcgcmVxdWVzdCcsXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uOiAnQmVhcmVyIHRva2VuIHJlcXVpcmVkJyxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIHJlcXVlc3RJZDogJ3JlcXVpcmVkIC0gVVVJRCBvZiB0aGUgcmVxdWVzdCdcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgICdHRVQgL2lkZWFzL3JlcXVlc3RzJzoge1xuICAgICAgICBkZXNjcmlwdGlvbjogJ0dldCB1c2VyIHJlcXVlc3QgaGlzdG9yeScsXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uOiAnQmVhcmVyIHRva2VuIHJlcXVpcmVkJyxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIHBhZ2U6ICdvcHRpb25hbCAtIFBhZ2UgbnVtYmVyIChkZWZhdWx0OiAxKScsXG4gICAgICAgICAgbGltaXQ6ICdvcHRpb25hbCAtIEl0ZW1zIHBlciBwYWdlIChkZWZhdWx0OiAxMCknLFxuICAgICAgICAgIHN0YXR1czogJ29wdGlvbmFsIC0gRmlsdGVyIGJ5IHN0YXR1cycsXG4gICAgICAgICAgZGF0ZUZyb206ICdvcHRpb25hbCAtIEZpbHRlciBmcm9tIGRhdGUnLFxuICAgICAgICAgIGRhdGVUbzogJ29wdGlvbmFsIC0gRmlsdGVyIHRvIGRhdGUnXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAnUE9TVCAvaWRlYXMvcmVxdWVzdHMvOnJlcXVlc3RJZC9mZWVkYmFjayc6IHtcbiAgICAgICAgZGVzY3JpcHRpb246ICdTdWJtaXQgZmVlZGJhY2sgZm9yIGEgY29tcGxldGVkIHJlcXVlc3QnLFxuICAgICAgICBhdXRoZW50aWNhdGlvbjogJ0JlYXJlciB0b2tlbiByZXF1aXJlZCcsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICByZXF1ZXN0SWQ6ICdyZXF1aXJlZCAtIFVVSUQgb2YgdGhlIHJlcXVlc3QnLFxuICAgICAgICAgIHJhdGluZzogJ3JlcXVpcmVkIC0gT3ZlcmFsbCByYXRpbmcgKDEtNSknLFxuICAgICAgICAgIGNvbW1lbnRzOiAnb3B0aW9uYWwgLSBGZWVkYmFjayBjb21tZW50cycsXG4gICAgICAgICAgYWN0aW9uVGFrZW46ICdvcHRpb25hbCAtIEFjdGlvbiB0YWtlbiBiYXNlZCBvbiByZXN1bHRzJ1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgJ0dFVCAvaWRlYXMvcmVxdWVzdHMvdGVtcGxhdGVzJzoge1xuICAgICAgICBkZXNjcmlwdGlvbjogJ0dldCByZXF1ZXN0IHBhcmFtZXRlciB0ZW1wbGF0ZXMnLFxuICAgICAgICBhdXRoZW50aWNhdGlvbjogJ0JlYXJlciB0b2tlbiByZXF1aXJlZCdcbiAgICAgIH0sXG4gICAgICAnR0VUIC9pZGVhcy9yZXF1ZXN0cy92YWxpZGF0aW9uL3NjaGVtYSc6IHtcbiAgICAgICAgZGVzY3JpcHRpb246ICdHZXQgdmFsaWRhdGlvbiBzY2hlbWEgZm9yIHJlcXVlc3QgcGFyYW1ldGVycycsXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uOiAnQmVhcmVyIHRva2VuIHJlcXVpcmVkJ1xuICAgICAgfVxuICAgIH0sXG4gICAgYXV0aGVudGljYXRpb246IHtcbiAgICAgIHR5cGU6ICdCZWFyZXIgVG9rZW4nLFxuICAgICAgZGVzY3JpcHRpb246ICdJbmNsdWRlIEF1dGhvcml6YXRpb24gaGVhZGVyIHdpdGggQmVhcmVyIHRva2VuJyxcbiAgICAgIGV4YW1wbGU6ICdBdXRob3JpemF0aW9uOiBCZWFyZXIgeW91ci1qd3QtdG9rZW4taGVyZSdcbiAgICB9LFxuICAgIGVycm9yQ29kZXM6IHtcbiAgICAgIDQwMDogJ0JhZCBSZXF1ZXN0IC0gSW52YWxpZCBwYXJhbWV0ZXJzJyxcbiAgICAgIDQwMTogJ1VuYXV0aG9yaXplZCAtIEF1dGhlbnRpY2F0aW9uIHJlcXVpcmVkJyxcbiAgICAgIDQwMzogJ0ZvcmJpZGRlbiAtIEluc3VmZmljaWVudCBwZXJtaXNzaW9ucycsXG4gICAgICA0MDQ6ICdOb3QgRm91bmQgLSBSZXNvdXJjZSBub3QgZm91bmQnLFxuICAgICAgNDI5OiAnVG9vIE1hbnkgUmVxdWVzdHMgLSBSYXRlIGxpbWl0IGV4Y2VlZGVkJyxcbiAgICAgIDUwMDogJ0ludGVybmFsIFNlcnZlciBFcnJvciAtIFNlcnZlciBlcnJvcidcbiAgICB9XG4gIH07XG5cbiAgcmVzLmpzb24oYXBpRG9jcyk7XG59KTtcblxuLy8gUmVxdWVzdCBmb3JtIHZhbGlkYXRpb24gZW5kcG9pbnRcbnJvdXRlci5wb3N0KCcvdmFsaWRhdGUtcmVxdWVzdCcsIChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpID0+IHtcbiAgY29uc3QgeyBwYXJhbWV0ZXJzIH0gPSByZXEuYm9keTtcbiAgXG4gIGlmICghcGFyYW1ldGVycykge1xuICAgIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgIGlzVmFsaWQ6IGZhbHNlLFxuICAgICAgZXJyb3JzOiBbJ1BhcmFtZXRlcnMgYXJlIHJlcXVpcmVkJ10sXG4gICAgICB3YXJuaW5nczogW11cbiAgICB9KTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHdhcm5pbmdzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIC8vIFJlcXVpcmVkIGZpZWxkIHZhbGlkYXRpb25cbiAgaWYgKCFwYXJhbWV0ZXJzLmludmVzdG1lbnRIb3Jpem9uKSB7XG4gICAgZXJyb3JzLnB1c2goJ0ludmVzdG1lbnQgaG9yaXpvbiBpcyByZXF1aXJlZCcpO1xuICB9XG5cbiAgaWYgKCFwYXJhbWV0ZXJzLnJpc2tUb2xlcmFuY2UpIHtcbiAgICBlcnJvcnMucHVzaCgnUmlzayB0b2xlcmFuY2UgaXMgcmVxdWlyZWQnKTtcbiAgfVxuXG4gIC8vIFJhbmdlIHZhbGlkYXRpb25cbiAgaWYgKHBhcmFtZXRlcnMubWluaW11bUNvbmZpZGVuY2UgIT09IHVuZGVmaW5lZCkge1xuICAgIGlmIChwYXJhbWV0ZXJzLm1pbmltdW1Db25maWRlbmNlIDwgMCB8fCBwYXJhbWV0ZXJzLm1pbmltdW1Db25maWRlbmNlID4gMTAwKSB7XG4gICAgICBlcnJvcnMucHVzaCgnTWluaW11bSBjb25maWRlbmNlIG11c3QgYmUgYmV0d2VlbiAwIGFuZCAxMDAnKTtcbiAgICB9XG4gIH1cblxuICBpZiAocGFyYW1ldGVycy5tYXhpbXVtSWRlYXMgIT09IHVuZGVmaW5lZCkge1xuICAgIGlmIChwYXJhbWV0ZXJzLm1heGltdW1JZGVhcyA8IDEgfHwgcGFyYW1ldGVycy5tYXhpbXVtSWRlYXMgPiAyMCkge1xuICAgICAgZXJyb3JzLnB1c2goJ01heGltdW0gaWRlYXMgbXVzdCBiZSBiZXR3ZWVuIDEgYW5kIDIwJyk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHBhcmFtZXRlcnMuaW52ZXN0bWVudEFtb3VudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKHBhcmFtZXRlcnMuaW52ZXN0bWVudEFtb3VudCA8IDApIHtcbiAgICAgIGVycm9ycy5wdXNoKCdJbnZlc3RtZW50IGFtb3VudCBtdXN0IGJlIHBvc2l0aXZlJyk7XG4gICAgfVxuICB9XG5cbiAgLy8gQnVzaW5lc3MgbG9naWMgd2FybmluZ3NcbiAgaWYgKHBhcmFtZXRlcnMucmlza1RvbGVyYW5jZSA9PT0gJ3ZlcnktYWdncmVzc2l2ZScgJiYgcGFyYW1ldGVycy5pbnZlc3RtZW50SG9yaXpvbiA9PT0gJ3Nob3J0LXRlcm0nKSB7XG4gICAgd2FybmluZ3MucHVzaCgnVmVyeSBhZ2dyZXNzaXZlIHJpc2sgdG9sZXJhbmNlIHdpdGggc2hvcnQtdGVybSBob3Jpem9uIG1heSByZXN1bHQgaW4gaGlnaCB2b2xhdGlsaXR5Jyk7XG4gIH1cblxuICBpZiAocGFyYW1ldGVycy5yaXNrVG9sZXJhbmNlID09PSAndmVyeS1jb25zZXJ2YXRpdmUnICYmIHBhcmFtZXRlcnMuaW52ZXN0bWVudEhvcml6b24gPT09ICdsb25nLXRlcm0nKSB7XG4gICAgd2FybmluZ3MucHVzaCgnVmVyeSBjb25zZXJ2YXRpdmUgYXBwcm9hY2ggd2l0aCBsb25nLXRlcm0gaG9yaXpvbiBtYXkgbGltaXQgZ3Jvd3RoIHBvdGVudGlhbCcpO1xuICB9XG5cbiAgaWYgKCFwYXJhbWV0ZXJzLmFzc2V0Q2xhc3NlcyB8fCBwYXJhbWV0ZXJzLmFzc2V0Q2xhc3Nlcy5sZW5ndGggPT09IDApIHtcbiAgICB3YXJuaW5ncy5wdXNoKCdObyBhc3NldCBjbGFzc2VzIHNlbGVjdGVkIC0gYWxsIGFzc2V0IGNsYXNzZXMgd2lsbCBiZSBjb25zaWRlcmVkJyk7XG4gIH1cblxuICBpZiAocGFyYW1ldGVycy5leGNsdWRlZEludmVzdG1lbnRzICYmIHBhcmFtZXRlcnMuZXhjbHVkZWRJbnZlc3RtZW50cy5sZW5ndGggPiA1MCkge1xuICAgIHdhcm5pbmdzLnB1c2goJ0xhcmdlIG51bWJlciBvZiBleGNsdXNpb25zIG1heSBsaW1pdCBpbnZlc3RtZW50IG9wcG9ydHVuaXRpZXMnKTtcbiAgfVxuXG4gIGlmIChwYXJhbWV0ZXJzLm1pbmltdW1Db25maWRlbmNlICYmIHBhcmFtZXRlcnMubWluaW11bUNvbmZpZGVuY2UgPiA5MCkge1xuICAgIHdhcm5pbmdzLnB1c2goJ1ZlcnkgaGlnaCBjb25maWRlbmNlIHRocmVzaG9sZCBtYXkgcmVzdWx0IGluIGZld2VyIGludmVzdG1lbnQgaWRlYXMnKTtcbiAgfVxuXG4gIHJlcy5qc29uKHtcbiAgICBpc1ZhbGlkOiBlcnJvcnMubGVuZ3RoID09PSAwLFxuICAgIGVycm9ycyxcbiAgICB3YXJuaW5nc1xuICB9KTtcbn0pO1xuXG4vLyBHZXQgYXZhaWxhYmxlIG9wdGlvbnMgZm9yIGZvcm0gZmllbGRzXG5yb3V0ZXIuZ2V0KCcvZm9ybS1vcHRpb25zJywgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkgPT4ge1xuICBjb25zdCBvcHRpb25zID0ge1xuICAgIGludmVzdG1lbnRIb3Jpem9uczogW1xuICAgICAgeyB2YWx1ZTogJ2ludHJhZGF5JywgbGFiZWw6ICdJbnRyYWRheScsIGRlc2NyaXB0aW9uOiAnU2FtZS1kYXkgdHJhZGluZyBvcHBvcnR1bml0aWVzJyB9LFxuICAgICAgeyB2YWx1ZTogJ3Nob3J0LXRlcm0nLCBsYWJlbDogJ1Nob3J0LXRlcm0gKDwgMSB5ZWFyKScsIGRlc2NyaXB0aW9uOiAnSW52ZXN0bWVudHMgaGVsZCBmb3IgbGVzcyB0aGFuIG9uZSB5ZWFyJyB9LFxuICAgICAgeyB2YWx1ZTogJ21lZGl1bS10ZXJtJywgbGFiZWw6ICdNZWRpdW0tdGVybSAoMS01IHllYXJzKScsIGRlc2NyaXB0aW9uOiAnSW52ZXN0bWVudHMgaGVsZCBmb3Igb25lIHRvIGZpdmUgeWVhcnMnIH0sXG4gICAgICB7IHZhbHVlOiAnbG9uZy10ZXJtJywgbGFiZWw6ICdMb25nLXRlcm0gKD4gNSB5ZWFycyknLCBkZXNjcmlwdGlvbjogJ0ludmVzdG1lbnRzIGhlbGQgZm9yIG1vcmUgdGhhbiBmaXZlIHllYXJzJyB9LFxuICAgICAgeyB2YWx1ZTogJ2ZsZXhpYmxlJywgbGFiZWw6ICdGbGV4aWJsZScsIGRlc2NyaXB0aW9uOiAnQWRhcHRhYmxlIGJhc2VkIG9uIG1hcmtldCBjb25kaXRpb25zJyB9XG4gICAgXSxcbiAgICByaXNrVG9sZXJhbmNlczogW1xuICAgICAgeyB2YWx1ZTogJ3ZlcnktY29uc2VydmF0aXZlJywgbGFiZWw6ICdWZXJ5IENvbnNlcnZhdGl2ZScsIGRlc2NyaXB0aW9uOiAnTWluaW1hbCByaXNrLCBjYXBpdGFsIHByZXNlcnZhdGlvbiBmb2N1cycgfSxcbiAgICAgIHsgdmFsdWU6ICdjb25zZXJ2YXRpdmUnLCBsYWJlbDogJ0NvbnNlcnZhdGl2ZScsIGRlc2NyaXB0aW9uOiAnTG93IHJpc2ssIHN0ZWFkeSByZXR1cm5zJyB9LFxuICAgICAgeyB2YWx1ZTogJ21vZGVyYXRlJywgbGFiZWw6ICdNb2RlcmF0ZScsIGRlc2NyaXB0aW9uOiAnQmFsYW5jZWQgcmlzayBhbmQgcmV0dXJuJyB9LFxuICAgICAgeyB2YWx1ZTogJ2FnZ3Jlc3NpdmUnLCBsYWJlbDogJ0FnZ3Jlc3NpdmUnLCBkZXNjcmlwdGlvbjogJ0hpZ2hlciByaXNrIGZvciBoaWdoZXIgcmV0dXJucycgfSxcbiAgICAgIHsgdmFsdWU6ICd2ZXJ5LWFnZ3Jlc3NpdmUnLCBsYWJlbDogJ1ZlcnkgQWdncmVzc2l2ZScsIGRlc2NyaXB0aW9uOiAnTWF4aW11bSByaXNrIGZvciBtYXhpbXVtIHJldHVybnMnIH1cbiAgICBdLFxuICAgIGFzc2V0Q2xhc3NlczogW1xuICAgICAgeyB2YWx1ZTogJ2VxdWl0aWVzJywgbGFiZWw6ICdFcXVpdGllcycsIGRlc2NyaXB0aW9uOiAnU3RvY2tzIGFuZCBlcXVpdHkgc2VjdXJpdGllcycgfSxcbiAgICAgIHsgdmFsdWU6ICdmaXhlZC1pbmNvbWUnLCBsYWJlbDogJ0ZpeGVkIEluY29tZScsIGRlc2NyaXB0aW9uOiAnQm9uZHMgYW5kIGRlYnQgc2VjdXJpdGllcycgfSxcbiAgICAgIHsgdmFsdWU6ICdjb21tb2RpdGllcycsIGxhYmVsOiAnQ29tbW9kaXRpZXMnLCBkZXNjcmlwdGlvbjogJ1BoeXNpY2FsIGdvb2RzIGFuZCByYXcgbWF0ZXJpYWxzJyB9LFxuICAgICAgeyB2YWx1ZTogJ2N1cnJlbmNpZXMnLCBsYWJlbDogJ0N1cnJlbmNpZXMnLCBkZXNjcmlwdGlvbjogJ0ZvcmVpZ24gZXhjaGFuZ2UgYW5kIGN1cnJlbmN5IHBhaXJzJyB9LFxuICAgICAgeyB2YWx1ZTogJ3JlYWwtZXN0YXRlJywgbGFiZWw6ICdSZWFsIEVzdGF0ZScsIGRlc2NyaXB0aW9uOiAnUHJvcGVydHkgYW5kIHJlYWwgZXN0YXRlIGludmVzdG1lbnRzJyB9LFxuICAgICAgeyB2YWx1ZTogJ2FsdGVybmF0aXZlcycsIGxhYmVsOiAnQWx0ZXJuYXRpdmVzJywgZGVzY3JpcHRpb246ICdIZWRnZSBmdW5kcywgcHJpdmF0ZSBlcXVpdHksIGV0Yy4nIH0sXG4gICAgICB7IHZhbHVlOiAnY3J5cHRvY3VycmVuY2llcycsIGxhYmVsOiAnQ3J5cHRvY3VycmVuY2llcycsIGRlc2NyaXB0aW9uOiAnRGlnaXRhbCBjdXJyZW5jaWVzIGFuZCB0b2tlbnMnIH0sXG4gICAgICB7IHZhbHVlOiAnZGVyaXZhdGl2ZXMnLCBsYWJlbDogJ0Rlcml2YXRpdmVzJywgZGVzY3JpcHRpb246ICdPcHRpb25zLCBmdXR1cmVzLCBhbmQgb3RoZXIgZGVyaXZhdGl2ZXMnIH1cbiAgICBdLFxuICAgIGdlb2dyYXBoaWNGb2N1czogW1xuICAgICAgeyB2YWx1ZTogJ25vcnRoLWFtZXJpY2EnLCBsYWJlbDogJ05vcnRoIEFtZXJpY2EnLCBkZXNjcmlwdGlvbjogJ1VTLCBDYW5hZGEsIE1leGljbycgfSxcbiAgICAgIHsgdmFsdWU6ICdldXJvcGUnLCBsYWJlbDogJ0V1cm9wZScsIGRlc2NyaXB0aW9uOiAnRXVyb3BlYW4gbWFya2V0cycgfSxcbiAgICAgIHsgdmFsdWU6ICdhc2lhLXBhY2lmaWMnLCBsYWJlbDogJ0FzaWEgUGFjaWZpYycsIGRlc2NyaXB0aW9uOiAnQXNpYW4gYW5kIFBhY2lmaWMgbWFya2V0cycgfSxcbiAgICAgIHsgdmFsdWU6ICdlbWVyZ2luZy1tYXJrZXRzJywgbGFiZWw6ICdFbWVyZ2luZyBNYXJrZXRzJywgZGVzY3JpcHRpb246ICdEZXZlbG9waW5nIGVjb25vbWllcycgfSxcbiAgICAgIHsgdmFsdWU6ICdnbG9iYWwnLCBsYWJlbDogJ0dsb2JhbCcsIGRlc2NyaXB0aW9uOiAnV29ybGR3aWRlIGRpdmVyc2lmaWNhdGlvbicgfSxcbiAgICAgIHsgdmFsdWU6ICdkb21lc3RpYycsIGxhYmVsOiAnRG9tZXN0aWMnLCBkZXNjcmlwdGlvbjogJ0hvbWUgY291bnRyeSBmb2N1cycgfVxuICAgIF0sXG4gICAgcmVzZWFyY2hEZXB0aHM6IFtcbiAgICAgIHsgdmFsdWU6ICdiYXNpYycsIGxhYmVsOiAnQmFzaWMnLCBkZXNjcmlwdGlvbjogJ1F1aWNrIGFuYWx5c2lzIHdpdGgga2V5IG1ldHJpY3MnIH0sXG4gICAgICB7IHZhbHVlOiAnc3RhbmRhcmQnLCBsYWJlbDogJ1N0YW5kYXJkJywgZGVzY3JpcHRpb246ICdDb21wcmVoZW5zaXZlIGFuYWx5c2lzIHdpdGggbXVsdGlwbGUgc291cmNlcycgfSxcbiAgICAgIHsgdmFsdWU6ICdjb21wcmVoZW5zaXZlJywgbGFiZWw6ICdDb21wcmVoZW5zaXZlJywgZGVzY3JpcHRpb246ICdEZWVwIGFuYWx5c2lzIHdpdGggZXh0ZW5zaXZlIHJlc2VhcmNoJyB9LFxuICAgICAgeyB2YWx1ZTogJ2RlZXAtZGl2ZScsIGxhYmVsOiAnRGVlcCBEaXZlJywgZGVzY3JpcHRpb246ICdFeGhhdXN0aXZlIGFuYWx5c2lzIHdpdGggYWxsIGF2YWlsYWJsZSBkYXRhJyB9XG4gICAgXSxcbiAgICBsaXF1aWRpdHlSZXF1aXJlbWVudHM6IFtcbiAgICAgIHsgdmFsdWU6ICdoaWdoJywgbGFiZWw6ICdIaWdoJywgZGVzY3JpcHRpb246ICdFYXN5IHRvIGJ1eS9zZWxsIHF1aWNrbHknIH0sXG4gICAgICB7IHZhbHVlOiAnbWVkaXVtJywgbGFiZWw6ICdNZWRpdW0nLCBkZXNjcmlwdGlvbjogJ01vZGVyYXRlIGxpcXVpZGl0eSByZXF1aXJlbWVudHMnIH0sXG4gICAgICB7IHZhbHVlOiAnbG93JywgbGFiZWw6ICdMb3cnLCBkZXNjcmlwdGlvbjogJ0NhbiBhY2NlcHQgaWxsaXF1aWQgaW52ZXN0bWVudHMnIH0sXG4gICAgICB7IHZhbHVlOiAnZmxleGlibGUnLCBsYWJlbDogJ0ZsZXhpYmxlJywgZGVzY3JpcHRpb246ICdBZGFwdGFibGUgdG8gb3Bwb3J0dW5pdGllcycgfVxuICAgIF0sXG4gICAgb3V0cHV0Rm9ybWF0czogW1xuICAgICAgeyB2YWx1ZTogJ2RldGFpbGVkJywgbGFiZWw6ICdEZXRhaWxlZCcsIGRlc2NyaXB0aW9uOiAnQ29tcHJlaGVuc2l2ZSByZXBvcnQgd2l0aCBhbGwgYW5hbHlzaXMnIH0sXG4gICAgICB7IHZhbHVlOiAnc3VtbWFyeScsIGxhYmVsOiAnU3VtbWFyeScsIGRlc2NyaXB0aW9uOiAnQ29uY2lzZSBvdmVydmlldyBvZiBrZXkgcG9pbnRzJyB9LFxuICAgICAgeyB2YWx1ZTogJ2V4ZWN1dGl2ZScsIGxhYmVsOiAnRXhlY3V0aXZlJywgZGVzY3JpcHRpb246ICdIaWdoLWxldmVsIHN1bW1hcnkgZm9yIGRlY2lzaW9uIG1ha2VycycgfSxcbiAgICAgIHsgdmFsdWU6ICd0ZWNobmljYWwnLCBsYWJlbDogJ1RlY2huaWNhbCcsIGRlc2NyaXB0aW9uOiAnVGVjaG5pY2FsIGFuYWx5c2lzIGZvY3VzJyB9LFxuICAgICAgeyB2YWx1ZTogJ3ByZXNlbnRhdGlvbicsIGxhYmVsOiAnUHJlc2VudGF0aW9uJywgZGVzY3JpcHRpb246ICdGb3JtYXR0ZWQgZm9yIHByZXNlbnRhdGlvbnMnIH1cbiAgICBdLFxuICAgIHByaW9yaXRpZXM6IFtcbiAgICAgIHsgdmFsdWU6ICdsb3cnLCBsYWJlbDogJ0xvdycsIGRlc2NyaXB0aW9uOiAnU3RhbmRhcmQgcHJvY2Vzc2luZyB0aW1lJyB9LFxuICAgICAgeyB2YWx1ZTogJ21lZGl1bScsIGxhYmVsOiAnTWVkaXVtJywgZGVzY3JpcHRpb246ICdCYWxhbmNlZCBwcmlvcml0eScgfSxcbiAgICAgIHsgdmFsdWU6ICdoaWdoJywgbGFiZWw6ICdIaWdoJywgZGVzY3JpcHRpb246ICdGYXN0ZXIgcHJvY2Vzc2luZycgfSxcbiAgICAgIHsgdmFsdWU6ICd1cmdlbnQnLCBsYWJlbDogJ1VyZ2VudCcsIGRlc2NyaXB0aW9uOiAnSGlnaGVzdCBwcmlvcml0eSBwcm9jZXNzaW5nJyB9XG4gICAgXSxcbiAgICBjdXJyZW5jaWVzOiBbXG4gICAgICB7IHZhbHVlOiAnVVNEJywgbGFiZWw6ICdVUyBEb2xsYXIgKFVTRCknIH0sXG4gICAgICB7IHZhbHVlOiAnRVVSJywgbGFiZWw6ICdFdXJvIChFVVIpJyB9LFxuICAgICAgeyB2YWx1ZTogJ0dCUCcsIGxhYmVsOiAnQnJpdGlzaCBQb3VuZCAoR0JQKScgfSxcbiAgICAgIHsgdmFsdWU6ICdKUFknLCBsYWJlbDogJ0phcGFuZXNlIFllbiAoSlBZKScgfSxcbiAgICAgIHsgdmFsdWU6ICdDQUQnLCBsYWJlbDogJ0NhbmFkaWFuIERvbGxhciAoQ0FEKScgfSxcbiAgICAgIHsgdmFsdWU6ICdBVUQnLCBsYWJlbDogJ0F1c3RyYWxpYW4gRG9sbGFyIChBVUQpJyB9LFxuICAgICAgeyB2YWx1ZTogJ0NIRicsIGxhYmVsOiAnU3dpc3MgRnJhbmMgKENIRiknIH0sXG4gICAgICB7IHZhbHVlOiAnQ05ZJywgbGFiZWw6ICdDaGluZXNlIFl1YW4gKENOWSknIH0sXG4gICAgICB7IHZhbHVlOiAnSU5SJywgbGFiZWw6ICdJbmRpYW4gUnVwZWUgKElOUiknIH0sXG4gICAgICB7IHZhbHVlOiAnQlJMJywgbGFiZWw6ICdCcmF6aWxpYW4gUmVhbCAoQlJMKScgfVxuICAgIF1cbiAgfTtcblxuICByZXMuanNvbihvcHRpb25zKTtcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCByb3V0ZXI7Il19