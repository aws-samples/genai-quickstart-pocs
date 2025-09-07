"use strict";
/**
 * Integration test setup and utilities
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrationTestUtils = void 0;
const supertest_1 = __importDefault(require("supertest"));
const server_1 = __importDefault(require("../../api/server"));
// Integration test environment setup
beforeAll(async () => {
    // Set integration test environment variables
    process.env.NODE_ENV = 'integration-test';
    process.env.AWS_REGION = 'us-east-1';
    process.env.JWT_SECRET = 'integration-test-jwt-secret';
    process.env.BEDROCK_REGION = 'us-east-1';
    // Mock AWS services for integration tests
    // Note: AWS SDK mocks are already set up in the main setup.ts file
});
// Integration test utilities
exports.integrationTestUtils = {
    // Create test server instance
    createTestServer: () => server_1.default,
    // Create authenticated request
    createAuthenticatedRequest: (server, token) => {
        const req = (0, supertest_1.default)(server);
        if (token) {
            req.set('Authorization', `Bearer ${token}`);
        }
        return req;
    },
    // Generate test JWT token
    generateTestToken: (payload = {}) => {
        const jwt = require('jsonwebtoken');
        return jwt.sign({
            userId: 'test-user-123',
            organizationId: 'test-org-456',
            role: 'analyst',
            permissions: ['idea:read', 'idea:write', 'data:upload'],
            ...payload
        }, process.env.JWT_SECRET, { expiresIn: '1h' });
    },
    // Create test user data
    createTestUser: () => ({
        id: 'test-user-123',
        email: 'test@example.com',
        organizationId: 'test-org-456',
        role: 'analyst',
        preferences: {
            investmentHorizon: 'medium',
            riskTolerance: 'moderate',
            preferredSectors: ['technology', 'healthcare'],
            preferredAssetClasses: ['stocks', 'etfs']
        }
    }),
    // Create test investment idea request
    createTestInvestmentIdeaRequest: () => ({
        parameters: {
            investmentHorizon: 'medium',
            riskTolerance: 'moderate',
            sectors: ['technology'],
            assetClasses: ['stocks'],
            minimumConfidence: 0.7,
            maximumIdeas: 5
        },
        context: {
            userPreferences: {
                excludedInvestments: [],
                focusAreas: ['AI', 'cloud computing']
            }
        }
    }),
    // Create test proprietary data
    createTestProprietaryData: () => ({
        name: 'Test Market Analysis',
        description: 'Test proprietary market analysis data',
        type: 'financial',
        format: 'json',
        data: {
            companies: [
                {
                    symbol: 'AAPL',
                    name: 'Apple Inc.',
                    sector: 'Technology',
                    marketCap: 3000000000000,
                    revenue: 394000000000,
                    peRatio: 28.5
                }
            ],
            marketTrends: [
                {
                    trend: 'AI adoption increasing',
                    confidence: 0.9,
                    timeframe: '2024-2025'
                }
            ]
        }
    }),
    // Wait for async operations
    wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    // Validate API response structure
    validateApiResponse: (response, expectedFields) => {
        expectedFields.forEach(field => {
            expect(response).toHaveProperty(field);
        });
    },
    // Validate investment idea structure
    validateInvestmentIdea: (idea) => {
        expect(idea).toHaveProperty('id');
        expect(idea).toHaveProperty('title');
        expect(idea).toHaveProperty('description');
        expect(idea).toHaveProperty('rationale');
        expect(idea).toHaveProperty('confidenceScore');
        expect(idea).toHaveProperty('timeHorizon');
        expect(idea).toHaveProperty('potentialReturn');
        expect(idea).toHaveProperty('riskFactors');
        expect(idea).toHaveProperty('supportingData');
        expect(idea).toHaveProperty('complianceConsiderations');
        expect(typeof idea.confidenceScore).toBe('number');
        expect(idea.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(idea.confidenceScore).toBeLessThanOrEqual(1);
        expect(Array.isArray(idea.riskFactors)).toBe(true);
        expect(Array.isArray(idea.supportingData)).toBe(true);
        expect(Array.isArray(idea.complianceConsiderations)).toBe(true);
    },
    // Validate error response structure
    validateErrorResponse: (response) => {
        expect(response).toHaveProperty('error');
        expect(response).toHaveProperty('message');
        expect(typeof response.error).toBe('string');
        expect(typeof response.message).toBe('string');
    }
};
// Global integration test cleanup
afterAll(async () => {
    // Clean up any resources created during integration tests
    await exports.integrationTestUtils.wait(100);
});
exports.default = exports.integrationTestUtils;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWdyYXRpb24tc2V0dXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvX190ZXN0c19fL2ludGVncmF0aW9uL2ludGVncmF0aW9uLXNldHVwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7Ozs7O0FBSUgsMERBQWdDO0FBQ2hDLDhEQUFtQztBQUVuQyxxQ0FBcUM7QUFDckMsU0FBUyxDQUFDLEtBQUssSUFBSSxFQUFFO0lBQ25CLDZDQUE2QztJQUM3QyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsR0FBRyxrQkFBa0IsQ0FBQztJQUMxQyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsR0FBRyxXQUFXLENBQUM7SUFDckMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEdBQUcsNkJBQTZCLENBQUM7SUFDdkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEdBQUcsV0FBVyxDQUFDO0lBRXpDLDBDQUEwQztJQUMxQyxtRUFBbUU7QUFDckUsQ0FBQyxDQUFDLENBQUM7QUFFSCw2QkFBNkI7QUFDaEIsUUFBQSxvQkFBb0IsR0FBRztJQUNsQyw4QkFBOEI7SUFDOUIsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFLENBQUMsZ0JBQUc7SUFFM0IsK0JBQStCO0lBQy9CLDBCQUEwQixFQUFFLENBQUMsTUFBMkIsRUFBRSxLQUFjLEVBQUUsRUFBRTtRQUMxRSxNQUFNLEdBQUcsR0FBRyxJQUFBLG1CQUFPLEVBQUMsTUFBTSxDQUFDLENBQUM7UUFDNUIsSUFBSSxLQUFLLEVBQUU7WUFDVCxHQUFHLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRSxVQUFVLEtBQUssRUFBRSxDQUFDLENBQUM7U0FDN0M7UUFDRCxPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7SUFFRCwwQkFBMEI7SUFDMUIsaUJBQWlCLEVBQUUsQ0FBQyxVQUFlLEVBQUUsRUFBRSxFQUFFO1FBQ3ZDLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMs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SUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFFRCxvQ0FBb0M7SUFDcEMscUJBQXFCLEVBQUUsQ0FBQyxRQUFhLEVBQUUsRUFBRTtRQUN2QyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3pDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDM0MsTUFBTSxDQUFDLE9BQU8sUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM3QyxNQUFNLENBQUMsT0FBTyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2pELENBQUM7Q0FDRixDQUFDO0FBRUYsa0NBQWtDO0FBQ2xDLFFBQVEsQ0FBQyxLQUFLLElBQUksRUFBRTtJQUNsQiwwREFBMEQ7SUFDMUQsTUFBTSw0QkFBb0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDdkMsQ0FBQyxDQUFDLENBQUM7QUFFSCxrQkFBZSw0QkFBb0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogSW50ZWdyYXRpb24gdGVzdCBzZXR1cCBhbmQgdXRpbGl0aWVzXG4gKi9cblxuaW1wb3J0IHsgamVzdCB9IGZyb20gJ0BqZXN0L2dsb2JhbHMnO1xuaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgcmVxdWVzdCBmcm9tICdzdXBlcnRlc3QnO1xuaW1wb3J0IGFwcCBmcm9tICcuLi8uLi9hcGkvc2VydmVyJztcblxuLy8gSW50ZWdyYXRpb24gdGVzdCBlbnZpcm9ubWVudCBzZXR1cFxuYmVmb3JlQWxsKGFzeW5jICgpID0+IHtcbiAgLy8gU2V0IGludGVncmF0aW9uIHRlc3QgZW52aXJvbm1lbnQgdmFyaWFibGVzXG4gIHByb2Nlc3MuZW52Lk5PREVfRU5WID0gJ2ludGVncmF0aW9uLXRlc3QnO1xuICBwcm9jZXNzLmVudi5BV1NfUkVHSU9OID0gJ3VzLWVhc3QtMSc7XG4gIHByb2Nlc3MuZW52LkpXVF9TRUNSRVQgPSAnaW50ZWdyYXRpb24tdGVzdC1qd3Qtc2VjcmV0JztcbiAgcHJvY2Vzcy5lbnYuQkVEUk9DS19SRUdJT04gPSAndXMtZWFzdC0xJztcbiAgXG4gIC8vIE1vY2sgQVdTIHNlcnZpY2VzIGZvciBpbnRlZ3JhdGlvbiB0ZXN0c1xuICAvLyBOb3RlOiBBV1MgU0RLIG1vY2tzIGFyZSBhbHJlYWR5IHNldCB1cCBpbiB0aGUgbWFpbiBzZXR1cC50cyBmaWxlXG59KTtcblxuLy8gSW50ZWdyYXRpb24gdGVzdCB1dGlsaXRpZXNcbmV4cG9ydCBjb25zdCBpbnRlZ3JhdGlvblRlc3RVdGlscyA9IHtcbiAgLy8gQ3JlYXRlIHRlc3Qgc2VydmVyIGluc3RhbmNlXG4gIGNyZWF0ZVRlc3RTZXJ2ZXI6ICgpID0+IGFwcCxcbiAgXG4gIC8vIENyZWF0ZSBhdXRoZW50aWNhdGVkIHJlcXVlc3RcbiAgY3JlYXRlQXV0aGVudGljYXRlZFJlcXVlc3Q6IChzZXJ2ZXI6IGV4cHJlc3MuQXBwbGljYXRpb24sIHRva2VuPzogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgcmVxID0gcmVxdWVzdChzZXJ2ZXIpO1xuICAgIGlmICh0b2tlbikge1xuICAgICAgcmVxLnNldCgnQXV0aG9yaXphdGlvbicsIGBCZWFyZXIgJHt0b2tlbn1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcTtcbiAgfSxcbiAgXG4gIC8vIEdlbmVyYXRlIHRlc3QgSldUIHRva2VuXG4gIGdlbmVyYXRlVGVzdFRva2VuOiAocGF5bG9hZDogYW55ID0ge30pID0+IHtcbiAgICBjb25zdCBqd3QgPSByZXF1aXJlKCdqc29ud2VidG9rZW4nKTtcbiAgICByZXR1cm4gand0LnNpZ24oe1xuICAgICAgdXNlcklkOiAndGVzdC11c2VyLTEyMycsXG4gICAgICBvcmdhbml6YXRpb25JZDogJ3Rlc3Qtb3JnLTQ1NicsXG4gICAgICByb2xlOiAnYW5hbHlzdCcsXG4gICAgICBwZXJtaXNzaW9uczogWydpZGVhOnJlYWQnLCAnaWRlYTp3cml0ZScsICdkYXRhOnVwbG9hZCddLFxuICAgICAgLi4ucGF5bG9hZFxuICAgIH0sIHByb2Nlc3MuZW52LkpXVF9TRUNSRVQsIHsgZXhwaXJlc0luOiAnMWgnIH0pO1xuICB9LFxuICBcbiAgLy8gQ3JlYXRlIHRlc3QgdXNlciBkYXRhXG4gIGNyZWF0ZVRlc3RVc2VyOiAoKSA9PiAoe1xuICAgIGlkOiAndGVzdC11c2VyLTEyMycsXG4gICAgZW1haWw6ICd0ZXN0QGV4YW1wbGUuY29tJyxcbiAgICBvcmdhbml6YXRpb25JZDogJ3Rlc3Qtb3JnLTQ1NicsXG4gICAgcm9sZTogJ2FuYWx5c3QnLFxuICAgIHByZWZlcmVuY2VzOiB7XG4gICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ21lZGl1bScsXG4gICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnLFxuICAgICAgcHJlZmVycmVkU2VjdG9yczogWyd0ZWNobm9sb2d5JywgJ2hlYWx0aGNhcmUnXSxcbiAgICAgIHByZWZlcnJlZEFzc2V0Q2xhc3NlczogWydzdG9ja3MnLCAnZXRmcyddXG4gICAgfVxuICB9KSxcbiAgXG4gIC8vIENyZWF0ZSB0ZXN0IGludmVzdG1lbnQgaWRlYSByZXF1ZXN0XG4gIGNyZWF0ZVRlc3RJbnZlc3RtZW50SWRlYVJlcXVlc3Q6ICgpID0+ICh7XG4gICAgcGFyYW1ldGVyczoge1xuICAgICAgaW52ZXN0bWVudEhvcml6b246ICdtZWRpdW0nLFxuICAgICAgcmlza1RvbGVyYW5jZTogJ21vZGVyYXRlJyxcbiAgICAgIHNlY3RvcnM6IFsndGVjaG5vbG9neSddLFxuICAgICAgYXNzZXRDbGFzc2VzOiBbJ3N0b2NrcyddLFxuICAgICAgbWluaW11bUNvbmZpZGVuY2U6IDAuNyxcbiAgICAgIG1heGltdW1JZGVhczogNVxuICAgIH0sXG4gICAgY29udGV4dDoge1xuICAgICAgdXNlclByZWZlcmVuY2VzOiB7XG4gICAgICAgIGV4Y2x1ZGVkSW52ZXN0bWVudHM6IFtdLFxuICAgICAgICBmb2N1c0FyZWFzOiBbJ0FJJywgJ2Nsb3VkIGNvbXB1dGluZyddXG4gICAgICB9XG4gICAgfVxuICB9KSxcbiAgXG4gIC8vIENyZWF0ZSB0ZXN0IHByb3ByaWV0YXJ5IGRhdGFcbiAgY3JlYXRlVGVzdFByb3ByaWV0YXJ5RGF0YTogKCkgPT4gKHtcbiAgICBuYW1lOiAnVGVzdCBNYXJrZXQgQW5hbHlzaXMnLFxuICAgIGRlc2NyaXB0aW9uOiAnVGVzdCBwcm9wcmlldGFyeSBtYXJrZXQgYW5hbHlzaXMgZGF0YScsXG4gICAgdHlwZTogJ2ZpbmFuY2lhbCcsXG4gICAgZm9ybWF0OiAnanNvbicsXG4gICAgZGF0YToge1xuICAgICAgY29tcGFuaWVzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBzeW1ib2w6ICdBQVBMJyxcbiAgICAgICAgICBuYW1lOiAnQXBwbGUgSW5jLicsXG4gICAgICAgICAgc2VjdG9yOiAnVGVjaG5vbG9neScsXG4gICAgICAgICAgbWFya2V0Q2FwOiAzMDAwMDAwMDAwMDAwLFxuICAgICAgICAgIHJldmVudWU6IDM5NDAwMDAwMDAwMCxcbiAgICAgICAgICBwZVJhdGlvOiAyOC41XG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBtYXJrZXRUcmVuZHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHRyZW5kOiAnQUkgYWRvcHRpb24gaW5jcmVhc2luZycsXG4gICAgICAgICAgY29uZmlkZW5jZTogMC45LFxuICAgICAgICAgIHRpbWVmcmFtZTogJzIwMjQtMjAyNSdcbiAgICAgICAgfVxuICAgICAgXVxuICAgIH1cbiAgfSksXG4gIFxuICAvLyBXYWl0IGZvciBhc3luYyBvcGVyYXRpb25zXG4gIHdhaXQ6IChtczogbnVtYmVyKSA9PiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKSxcbiAgXG4gIC8vIFZhbGlkYXRlIEFQSSByZXNwb25zZSBzdHJ1Y3R1cmVcbiAgdmFsaWRhdGVBcGlSZXNwb25zZTogKHJlc3BvbnNlOiBhbnksIGV4cGVjdGVkRmllbGRzOiBzdHJpbmdbXSkgPT4ge1xuICAgIGV4cGVjdGVkRmllbGRzLmZvckVhY2goZmllbGQgPT4ge1xuICAgICAgZXhwZWN0KHJlc3BvbnNlKS50b0hhdmVQcm9wZXJ0eShmaWVsZCk7XG4gICAgfSk7XG4gIH0sXG4gIFxuICAvLyBWYWxpZGF0ZSBpbnZlc3RtZW50IGlkZWEgc3RydWN0dXJlXG4gIHZhbGlkYXRlSW52ZXN0bWVudElkZWE6IChpZGVhOiBhbnkpID0+IHtcbiAgICBleHBlY3QoaWRlYSkudG9IYXZlUHJvcGVydHkoJ2lkJyk7XG4gICAgZXhwZWN0KGlkZWEpLnRvSGF2ZVByb3BlcnR5KCd0aXRsZScpO1xuICAgIGV4cGVjdChpZGVhKS50b0hhdmVQcm9wZXJ0eSgnZGVzY3JpcHRpb24nKTtcbiAgICBleHBlY3QoaWRlYSkudG9IYXZlUHJvcGVydHkoJ3JhdGlvbmFsZScpO1xuICAgIGV4cGVjdChpZGVhKS50b0hhdmVQcm9wZXJ0eSgnY29uZmlkZW5jZVNjb3JlJyk7XG4gICAgZXhwZWN0KGlkZWEpLnRvSGF2ZVByb3BlcnR5KCd0aW1lSG9yaXpvbicpO1xuICAgIGV4cGVjdChpZGVhKS50b0hhdmVQcm9wZXJ0eSgncG90ZW50aWFsUmV0dXJuJyk7XG4gICAgZXhwZWN0KGlkZWEpLnRvSGF2ZVByb3BlcnR5KCdyaXNrRmFjdG9ycycpO1xuICAgIGV4cGVjdChpZGVhKS50b0hhdmVQcm9wZXJ0eSgnc3VwcG9ydGluZ0RhdGEnKTtcbiAgICBleHBlY3QoaWRlYSkudG9IYXZlUHJvcGVydHkoJ2NvbXBsaWFuY2VDb25zaWRlcmF0aW9ucycpO1xuICAgIFxuICAgIGV4cGVjdCh0eXBlb2YgaWRlYS5jb25maWRlbmNlU2NvcmUpLnRvQmUoJ251bWJlcicpO1xuICAgIGV4cGVjdChpZGVhLmNvbmZpZGVuY2VTY29yZSkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKTtcbiAgICBleHBlY3QoaWRlYS5jb25maWRlbmNlU2NvcmUpLnRvQmVMZXNzVGhhbk9yRXF1YWwoMSk7XG4gICAgXG4gICAgZXhwZWN0KEFycmF5LmlzQXJyYXkoaWRlYS5yaXNrRmFjdG9ycykpLnRvQmUodHJ1ZSk7XG4gICAgZXhwZWN0KEFycmF5LmlzQXJyYXkoaWRlYS5zdXBwb3J0aW5nRGF0YSkpLnRvQmUodHJ1ZSk7XG4gICAgZXhwZWN0KEFycmF5LmlzQXJyYXkoaWRlYS5jb21wbGlhbmNlQ29uc2lkZXJhdGlvbnMpKS50b0JlKHRydWUpO1xuICB9LFxuICBcbiAgLy8gVmFsaWRhdGUgZXJyb3IgcmVzcG9uc2Ugc3RydWN0dXJlXG4gIHZhbGlkYXRlRXJyb3JSZXNwb25zZTogKHJlc3BvbnNlOiBhbnkpID0+IHtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvSGF2ZVByb3BlcnR5KCdlcnJvcicpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9IYXZlUHJvcGVydHkoJ21lc3NhZ2UnKTtcbiAgICBleHBlY3QodHlwZW9mIHJlc3BvbnNlLmVycm9yKS50b0JlKCdzdHJpbmcnKTtcbiAgICBleHBlY3QodHlwZW9mIHJlc3BvbnNlLm1lc3NhZ2UpLnRvQmUoJ3N0cmluZycpO1xuICB9XG59O1xuXG4vLyBHbG9iYWwgaW50ZWdyYXRpb24gdGVzdCBjbGVhbnVwXG5hZnRlckFsbChhc3luYyAoKSA9PiB7XG4gIC8vIENsZWFuIHVwIGFueSByZXNvdXJjZXMgY3JlYXRlZCBkdXJpbmcgaW50ZWdyYXRpb24gdGVzdHNcbiAgYXdhaXQgaW50ZWdyYXRpb25UZXN0VXRpbHMud2FpdCgxMDApO1xufSk7XG5cbmV4cG9ydCBkZWZhdWx0IGludGVncmF0aW9uVGVzdFV0aWxzOyJdfQ==