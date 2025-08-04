"use strict";
/**
 * Tests for Request Validation Service
 */
Object.defineProperty(exports, "__esModule", { value: true });
const request_validation_service_1 = require("../request-validation-service");
describe('RequestValidationService', () => {
    let service;
    beforeEach(() => {
        service = new request_validation_service_1.RequestValidationService();
    });
    describe('validateRequest', () => {
        const createValidRequest = () => ({
            id: 'test-request-1',
            userId: 'user-123',
            parameters: {
                investmentHorizon: 'medium-term',
                riskTolerance: 'moderate'
            },
            priority: 'medium',
            timestamp: new Date(),
            status: 'submitted'
        });
        it('should validate a valid request successfully', async () => {
            const request = createValidRequest();
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        it('should reject request with missing ID', async () => {
            const request = createValidRequest();
            request.id = '';
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'id',
                code: 'INVALID_REQUEST_ID',
                severity: 'critical'
            }));
        });
        it('should reject request with missing user ID', async () => {
            const request = createValidRequest();
            request.userId = '';
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'userId',
                code: 'INVALID_USER_ID',
                severity: 'critical'
            }));
        });
        it('should reject request with invalid timestamp', async () => {
            const request = createValidRequest();
            request.timestamp = 'invalid-date';
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'timestamp',
                code: 'INVALID_TIMESTAMP',
                severity: 'error'
            }));
        });
        it('should reject request with missing parameters', async () => {
            const request = createValidRequest();
            delete request.parameters;
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'parameters',
                code: 'MISSING_PARAMETERS',
                severity: 'critical'
            }));
        });
    });
    describe('parameter validation', () => {
        const createValidParameters = () => ({
            investmentHorizon: 'medium-term',
            riskTolerance: 'moderate'
        });
        it('should validate valid parameters', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: createValidParameters(),
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted'
            };
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        it('should reject invalid investment horizon', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    ...createValidParameters(),
                    investmentHorizon: 'invalid-horizon'
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted'
            };
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'investmentHorizon',
                code: 'INVALID_TIME_HORIZON',
                severity: 'error'
            }));
        });
        it('should reject invalid risk tolerance', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    ...createValidParameters(),
                    riskTolerance: 'invalid-risk'
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted'
            };
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'riskTolerance',
                code: 'INVALID_RISK_TOLERANCE',
                severity: 'error'
            }));
        });
        it('should validate investment amount range', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    ...createValidParameters(),
                    investmentAmount: -100
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted'
            };
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'investmentAmount',
                code: 'INVALID_INVESTMENT_AMOUNT',
                severity: 'error'
            }));
        });
        it('should warn about low investment amount', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    ...createValidParameters(),
                    investmentAmount: 50
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted'
            };
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContainEqual(expect.objectContaining({
                field: 'investmentAmount',
                code: 'LOW_INVESTMENT_AMOUNT'
            }));
        });
        it('should validate currency codes', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    ...createValidParameters(),
                    currency: 'INVALID'
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted'
            };
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'currency',
                code: 'INVALID_CURRENCY',
                severity: 'error'
            }));
        });
        it('should validate sectors array', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    ...createValidParameters(),
                    sectors: new Array(25).fill('technology') // Too many sectors
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted'
            };
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'sectors',
                code: 'TOO_MANY_SECTORS',
                severity: 'error'
            }));
        });
        it('should warn about single sector focus', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    ...createValidParameters(),
                    sectors: ['technology']
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted'
            };
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContainEqual(expect.objectContaining({
                field: 'sectors',
                code: 'SINGLE_SECTOR_FOCUS'
            }));
        });
        it('should validate asset classes', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    ...createValidParameters(),
                    assetClasses: ['invalid-asset-class']
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted'
            };
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'assetClasses[0]',
                code: 'INVALID_ASSET_CLASS',
                severity: 'error'
            }));
        });
        it('should validate geographic focus', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    ...createValidParameters(),
                    geographicFocus: ['invalid-region']
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted'
            };
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'geographicFocus[0]',
                code: 'INVALID_GEOGRAPHIC_REGION',
                severity: 'error'
            }));
        });
        it('should validate confidence range', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    ...createValidParameters(),
                    minimumConfidence: 150
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted'
            };
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'minimumConfidence',
                code: 'INVALID_CONFIDENCE_RANGE',
                severity: 'error'
            }));
        });
        it('should validate maximum ideas range', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    ...createValidParameters(),
                    maximumIdeas: 25
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted'
            };
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'maximumIdeas',
                code: 'INVALID_MAX_IDEAS_RANGE',
                severity: 'error'
            }));
        });
        it('should warn about high maximum ideas', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    ...createValidParameters(),
                    maximumIdeas: 15
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted'
            };
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContainEqual(expect.objectContaining({
                field: 'maximumIdeas',
                code: 'HIGH_MAX_IDEAS'
            }));
        });
        it('should validate research depth', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    ...createValidParameters(),
                    researchDepth: 'invalid-depth'
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted'
            };
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'researchDepth',
                code: 'INVALID_RESEARCH_DEPTH',
                severity: 'error'
            }));
        });
        it('should validate liquidity requirement', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    ...createValidParameters(),
                    liquidityRequirement: 'invalid-liquidity'
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted'
            };
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'liquidityRequirement',
                code: 'INVALID_LIQUIDITY_REQUIREMENT',
                severity: 'error'
            }));
        });
        it('should validate output format', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    ...createValidParameters(),
                    outputFormat: 'invalid-format'
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted'
            };
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'outputFormat',
                code: 'INVALID_OUTPUT_FORMAT',
                severity: 'error'
            }));
        });
    });
    describe('cross-validation', () => {
        it('should warn about conflicting risk tolerance and investment horizon', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    investmentHorizon: 'intraday',
                    riskTolerance: 'very-conservative'
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted'
            };
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContainEqual(expect.objectContaining({
                field: 'riskTolerance',
                code: 'CONFLICTING_RISK_HORIZON'
            }));
        });
        it('should warn about conflicting risk tolerance and asset classes', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    investmentHorizon: 'long-term',
                    riskTolerance: 'very-conservative',
                    assetClasses: ['cryptocurrencies']
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted'
            };
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContainEqual(expect.objectContaining({
                field: 'assetClasses',
                code: 'CONFLICTING_RISK_ASSETS'
            }));
        });
        it('should detect conflicting sectors and excluded sectors', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    investmentHorizon: 'medium-term',
                    riskTolerance: 'moderate',
                    sectors: ['technology', 'healthcare'],
                    excludedSectors: ['technology', 'finance']
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted'
            };
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'sectors',
                code: 'CONFLICTING_SECTORS',
                severity: 'error'
            }));
        });
    });
    describe('callback validation', () => {
        it('should validate callback URL', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    investmentHorizon: 'medium-term',
                    riskTolerance: 'moderate'
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted',
                callback: {
                    url: 'invalid-url'
                }
            };
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'callback.url',
                code: 'INVALID_CALLBACK_URL_FORMAT',
                severity: 'error'
            }));
        });
        it('should validate callback method', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    investmentHorizon: 'medium-term',
                    riskTolerance: 'moderate'
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted',
                callback: {
                    url: 'https://example.com/callback',
                    method: 'GET'
                }
            };
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'callback.method',
                code: 'INVALID_CALLBACK_METHOD',
                severity: 'error'
            }));
        });
    });
    describe('priority validation', () => {
        it('should validate priority values', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    investmentHorizon: 'medium-term',
                    riskTolerance: 'moderate'
                },
                priority: 'invalid-priority',
                timestamp: new Date(),
                status: 'submitted'
            };
            const result = await service.validateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.objectContaining({
                field: 'priority',
                code: 'INVALID_PRIORITY',
                severity: 'error'
            }));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdC12YWxpZGF0aW9uLXNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9fX3Rlc3RzX18vcmVxdWVzdC12YWxpZGF0aW9uLXNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsOEVBQXlFO0FBTXpFLFFBQVEsQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUU7SUFDeEMsSUFBSSxPQUFpQyxDQUFDO0lBRXRDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDZCxPQUFPLEdBQUcsSUFBSSxxREFBd0IsRUFBRSxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtRQUMvQixNQUFNLGtCQUFrQixHQUFHLEdBQW9DLEVBQUUsQ0FBQyxDQUFDO1lBQ2pFLEVBQUUsRUFBRSxnQkFBZ0I7WUFDcEIsTUFBTSxFQUFFLFVBQVU7WUFDbEIsVUFBVSxFQUFFO2dCQUNWLGlCQUFpQixFQUFFLGFBQWE7Z0JBQ2hDLGFBQWEsRUFBRSxVQUFVO2FBQzFCO1lBQ0QsUUFBUSxFQUFFLFFBQVE7WUFDbEIsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFO1lBQ3JCLE1BQU0sRUFBRSxXQUFXO1NBQ3BCLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw4Q0FBOEMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM1RCxNQUFNLE9BQU8sR0FBRyxrQkFBa0IsRUFBRSxDQUFDO1lBQ3JDLE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTyxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUV0RCxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztR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QUMxQjtnQkFDRCxRQUFRLEVBQUUsa0JBQXlCO2dCQUNuQyxTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUU7Z0JBQ3JCLE1BQU0sRUFBRSxXQUFXO2FBQ3BCLENBQUM7WUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU8sQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFdEQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxjQUFjLENBQ2xDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztnQkFDdEIsS0FBSyxFQUFFLFVBQVU7Z0JBQ2pCLElBQUksRUFBRSxrQkFBa0I7Z0JBQ3hCLFFBQVEsRUFBRSxPQUFPO2FBQ2xCLENBQUMsQ0FDSCxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBUZXN0cyBmb3IgUmVxdWVzdCBWYWxpZGF0aW9uIFNlcnZpY2VcbiAqL1xuXG5pbXBvcnQgeyBSZXF1ZXN0VmFsaWRhdGlvblNlcnZpY2UgfSBmcm9tICcuLi9yZXF1ZXN0LXZhbGlkYXRpb24tc2VydmljZSc7XG5pbXBvcnQgeyBcbiAgSW52ZXN0bWVudElkZWFHZW5lcmF0aW9uUmVxdWVzdCxcbiAgSW52ZXN0bWVudElkZWFSZXF1ZXN0UGFyYW1ldGVyc1xufSBmcm9tICcuLi8uLi9tb2RlbHMvaW52ZXN0bWVudC1pZGVhLXJlcXVlc3QnO1xuXG5kZXNjcmliZSgnUmVxdWVzdFZhbGlkYXRpb25TZXJ2aWNlJywgKCkgPT4ge1xuICBsZXQgc2VydmljZTogUmVxdWVzdFZhbGlkYXRpb25TZXJ2aWNlO1xuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIHNlcnZpY2UgPSBuZXcgUmVxdWVzdFZhbGlkYXRpb25TZXJ2aWNlKCk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCd2YWxpZGF0ZVJlcXVlc3QnLCAoKSA9PiB7XG4gICAgY29uc3QgY3JlYXRlVmFsaWRSZXF1ZXN0ID0gKCk6IEludmVzdG1lbnRJZGVhR2VuZXJhdGlvblJlcXVlc3QgPT4gKHtcbiAgICAgIGlkOiAndGVzdC1yZXF1ZXN0LTEnLFxuICAgICAgdXNlcklkOiAndXNlci0xMjMnLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ21lZGl1bS10ZXJtJyxcbiAgICAgICAgcmlza1RvbGVyYW5jZTogJ21vZGVyYXRlJ1xuICAgICAgfSxcbiAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgIHN0YXR1czogJ3N1Ym1pdHRlZCdcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgYSB2YWxpZCByZXF1ZXN0IHN1Y2Nlc3NmdWxseScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3QgPSBjcmVhdGVWYWxpZFJlcXVlc3QoKTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UudmFsaWRhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QocmVzdWx0LmVycm9ycykudG9IYXZlTGVuZ3RoKDApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZWplY3QgcmVxdWVzdCB3aXRoIG1pc3NpbmcgSUQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0ID0gY3JlYXRlVmFsaWRSZXF1ZXN0KCk7XG4gICAgICByZXF1ZXN0LmlkID0gJyc7XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UudmFsaWRhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZmllbGQ6ICdpZCcsXG4gICAgICAgICAgY29kZTogJ0lOVkFMSURfUkVRVUVTVF9JRCcsXG4gICAgICAgICAgc2V2ZXJpdHk6ICdjcml0aWNhbCdcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJlamVjdCByZXF1ZXN0IHdpdGggbWlzc2luZyB1c2VyIElEJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdCA9IGNyZWF0ZVZhbGlkUmVxdWVzdCgpO1xuICAgICAgcmVxdWVzdC51c2VySWQgPSAnJztcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VydmljZS52YWxpZGF0ZVJlcXVlc3QocmVxdWVzdCk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuaXNWYWxpZCkudG9CZShmYWxzZSk7XG4gICAgICBleHBlY3QocmVzdWx0LmVycm9ycykudG9Db250YWluRXF1YWwoXG4gICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICBmaWVsZDogJ3VzZXJJZCcsXG4gICAgICAgICAgY29kZTogJ0lOVkFMSURfVVNFUl9JRCcsXG4gICAgICAgICAgc2V2ZXJpdHk6ICdjcml0aWNhbCdcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJlamVjdCByZXF1ZXN0IHdpdGggaW52YWxpZCB0aW1lc3RhbXAnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0ID0gY3JlYXRlVmFsaWRSZXF1ZXN0KCk7XG4gICAgICAocmVxdWVzdC50aW1lc3RhbXAgYXMgYW55KSA9ICdpbnZhbGlkLWRhdGUnO1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzZXJ2aWNlLnZhbGlkYXRlUmVxdWVzdChyZXF1ZXN0KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5pc1ZhbGlkKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3JzKS50b0NvbnRhaW5FcXVhbChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIGZpZWxkOiAndGltZXN0YW1wJyxcbiAgICAgICAgICBjb2RlOiAnSU5WQUxJRF9USU1FU1RBTVAnLFxuICAgICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZWplY3QgcmVxdWVzdCB3aXRoIG1pc3NpbmcgcGFyYW1ldGVycycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3QgPSBjcmVhdGVWYWxpZFJlcXVlc3QoKTtcbiAgICAgIGRlbGV0ZSAocmVxdWVzdCBhcyBhbnkpLnBhcmFtZXRlcnM7XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UudmFsaWRhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZmllbGQ6ICdwYXJhbWV0ZXJzJyxcbiAgICAgICAgICBjb2RlOiAnTUlTU0lOR19QQVJBTUVURVJTJyxcbiAgICAgICAgICBzZXZlcml0eTogJ2NyaXRpY2FsJ1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3BhcmFtZXRlciB2YWxpZGF0aW9uJywgKCkgPT4ge1xuICAgIGNvbnN0IGNyZWF0ZVZhbGlkUGFyYW1ldGVycyA9ICgpOiBJbnZlc3RtZW50SWRlYVJlcXVlc3RQYXJhbWV0ZXJzID0+ICh7XG4gICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ21lZGl1bS10ZXJtJyxcbiAgICAgIHJpc2tUb2xlcmFuY2U6ICdtb2RlcmF0ZSdcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgdmFsaWQgcGFyYW1ldGVycycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3Q6IEludmVzdG1lbnRJZGVhR2VuZXJhdGlvblJlcXVlc3QgPSB7XG4gICAgICAgIGlkOiAndGVzdC1yZXF1ZXN0LTEnLFxuICAgICAgICB1c2VySWQ6ICd1c2VyLTEyMycsXG4gICAgICAgIHBhcmFtZXRlcnM6IGNyZWF0ZVZhbGlkUGFyYW1ldGVycygpLFxuICAgICAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgc3RhdHVzOiAnc3VibWl0dGVkJ1xuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VydmljZS52YWxpZGF0ZVJlcXVlc3QocmVxdWVzdCk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuaXNWYWxpZCkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3JzKS50b0hhdmVMZW5ndGgoMCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJlamVjdCBpbnZhbGlkIGludmVzdG1lbnQgaG9yaXpvbicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3Q6IEludmVzdG1lbnRJZGVhR2VuZXJhdGlvblJlcXVlc3QgPSB7XG4gICAgICAgIGlkOiAndGVzdC1yZXF1ZXN0LTEnLFxuICAgICAgICB1c2VySWQ6ICd1c2VyLTEyMycsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAuLi5jcmVhdGVWYWxpZFBhcmFtZXRlcnMoKSxcbiAgICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ2ludmFsaWQtaG9yaXpvbicgYXMgYW55XG4gICAgICAgIH0sXG4gICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICBzdGF0dXM6ICdzdWJtaXR0ZWQnXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzZXJ2aWNlLnZhbGlkYXRlUmVxdWVzdChyZXF1ZXN0KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5pc1ZhbGlkKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3JzKS50b0NvbnRhaW5FcXVhbChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIGZpZWxkOiAnaW52ZXN0bWVudEhvcml6b24nLFxuICAgICAgICAgIGNvZGU6ICdJTlZBTElEX1RJTUVfSE9SSVpPTicsXG4gICAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJlamVjdCBpbnZhbGlkIHJpc2sgdG9sZXJhbmNlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdDogSW52ZXN0bWVudElkZWFHZW5lcmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgaWQ6ICd0ZXN0LXJlcXVlc3QtMScsXG4gICAgICAgIHVzZXJJZDogJ3VzZXItMTIzJyxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIC4uLmNyZWF0ZVZhbGlkUGFyYW1ldGVycygpLFxuICAgICAgICAgIHJpc2tUb2xlcmFuY2U6ICdpbnZhbGlkLXJpc2snIGFzIGFueVxuICAgICAgICB9LFxuICAgICAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgc3RhdHVzOiAnc3VibWl0dGVkJ1xuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VydmljZS52YWxpZGF0ZVJlcXVlc3QocmVxdWVzdCk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuaXNWYWxpZCkudG9CZShmYWxzZSk7XG4gICAgICBleHBlY3QocmVzdWx0LmVycm9ycykudG9Db250YWluRXF1YWwoXG4gICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICBmaWVsZDogJ3Jpc2tUb2xlcmFuY2UnLFxuICAgICAgICAgIGNvZGU6ICdJTlZBTElEX1JJU0tfVE9MRVJBTkNFJyxcbiAgICAgICAgICBzZXZlcml0eTogJ2Vycm9yJ1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgaW52ZXN0bWVudCBhbW91bnQgcmFuZ2UnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0OiBJbnZlc3RtZW50SWRlYUdlbmVyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICBpZDogJ3Rlc3QtcmVxdWVzdC0xJyxcbiAgICAgICAgdXNlcklkOiAndXNlci0xMjMnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgLi4uY3JlYXRlVmFsaWRQYXJhbWV0ZXJzKCksXG4gICAgICAgICAgaW52ZXN0bWVudEFtb3VudDogLTEwMFxuICAgICAgICB9LFxuICAgICAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgc3RhdHVzOiAnc3VibWl0dGVkJ1xuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VydmljZS52YWxpZGF0ZVJlcXVlc3QocmVxdWVzdCk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuaXNWYWxpZCkudG9CZShmYWxzZSk7XG4gICAgICBleHBlY3QocmVzdWx0LmVycm9ycykudG9Db250YWluRXF1YWwoXG4gICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICBmaWVsZDogJ2ludmVzdG1lbnRBbW91bnQnLFxuICAgICAgICAgIGNvZGU6ICdJTlZBTElEX0lOVkVTVE1FTlRfQU1PVU5UJyxcbiAgICAgICAgICBzZXZlcml0eTogJ2Vycm9yJ1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgd2FybiBhYm91dCBsb3cgaW52ZXN0bWVudCBhbW91bnQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0OiBJbnZlc3RtZW50SWRlYUdlbmVyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICBpZDogJ3Rlc3QtcmVxdWVzdC0xJyxcbiAgICAgICAgdXNlcklkOiAndXNlci0xMjMnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgLi4uY3JlYXRlVmFsaWRQYXJhbWV0ZXJzKCksXG4gICAgICAgICAgaW52ZXN0bWVudEFtb3VudDogNTBcbiAgICAgICAgfSxcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIHN0YXR1czogJ3N1Ym1pdHRlZCdcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UudmFsaWRhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QocmVzdWx0Lndhcm5pbmdzKS50b0NvbnRhaW5FcXVhbChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIGZpZWxkOiAnaW52ZXN0bWVudEFtb3VudCcsXG4gICAgICAgICAgY29kZTogJ0xPV19JTlZFU1RNRU5UX0FNT1VOVCdcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHZhbGlkYXRlIGN1cnJlbmN5IGNvZGVzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdDogSW52ZXN0bWVudElkZWFHZW5lcmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgaWQ6ICd0ZXN0LXJlcXVlc3QtMScsXG4gICAgICAgIHVzZXJJZDogJ3VzZXItMTIzJyxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIC4uLmNyZWF0ZVZhbGlkUGFyYW1ldGVycygpLFxuICAgICAgICAgIGN1cnJlbmN5OiAnSU5WQUxJRCdcbiAgICAgICAgfSxcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIHN0YXR1czogJ3N1Ym1pdHRlZCdcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UudmFsaWRhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZmllbGQ6ICdjdXJyZW5jeScsXG4gICAgICAgICAgY29kZTogJ0lOVkFMSURfQ1VSUkVOQ1knLFxuICAgICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSBzZWN0b3JzIGFycmF5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdDogSW52ZXN0bWVudElkZWFHZW5lcmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgaWQ6ICd0ZXN0LXJlcXVlc3QtMScsXG4gICAgICAgIHVzZXJJZDogJ3VzZXItMTIzJyxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIC4uLmNyZWF0ZVZhbGlkUGFyYW1ldGVycygpLFxuICAgICAgICAgIHNlY3RvcnM6IG5ldyBBcnJheSgyNSkuZmlsbCgndGVjaG5vbG9neScpIC8vIFRvbyBtYW55IHNlY3RvcnNcbiAgICAgICAgfSxcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIHN0YXR1czogJ3N1Ym1pdHRlZCdcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UudmFsaWRhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZmllbGQ6ICdzZWN0b3JzJyxcbiAgICAgICAgICBjb2RlOiAnVE9PX01BTllfU0VDVE9SUycsXG4gICAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHdhcm4gYWJvdXQgc2luZ2xlIHNlY3RvciBmb2N1cycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3Q6IEludmVzdG1lbnRJZGVhR2VuZXJhdGlvblJlcXVlc3QgPSB7XG4gICAgICAgIGlkOiAndGVzdC1yZXF1ZXN0LTEnLFxuICAgICAgICB1c2VySWQ6ICd1c2VyLTEyMycsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAuLi5jcmVhdGVWYWxpZFBhcmFtZXRlcnMoKSxcbiAgICAgICAgICBzZWN0b3JzOiBbJ3RlY2hub2xvZ3knXVxuICAgICAgICB9LFxuICAgICAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgc3RhdHVzOiAnc3VibWl0dGVkJ1xuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VydmljZS52YWxpZGF0ZVJlcXVlc3QocmVxdWVzdCk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuaXNWYWxpZCkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQud2FybmluZ3MpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZmllbGQ6ICdzZWN0b3JzJyxcbiAgICAgICAgICBjb2RlOiAnU0lOR0xFX1NFQ1RPUl9GT0NVUydcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHZhbGlkYXRlIGFzc2V0IGNsYXNzZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0OiBJbnZlc3RtZW50SWRlYUdlbmVyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICBpZDogJ3Rlc3QtcmVxdWVzdC0xJyxcbiAgICAgICAgdXNlcklkOiAndXNlci0xMjMnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgLi4uY3JlYXRlVmFsaWRQYXJhbWV0ZXJzKCksXG4gICAgICAgICAgYXNzZXRDbGFzc2VzOiBbJ2ludmFsaWQtYXNzZXQtY2xhc3MnIGFzIGFueV1cbiAgICAgICAgfSxcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIHN0YXR1czogJ3N1Ym1pdHRlZCdcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UudmFsaWRhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZmllbGQ6ICdhc3NldENsYXNzZXNbMF0nLFxuICAgICAgICAgIGNvZGU6ICdJTlZBTElEX0FTU0VUX0NMQVNTJyxcbiAgICAgICAgICBzZXZlcml0eTogJ2Vycm9yJ1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgZ2VvZ3JhcGhpYyBmb2N1cycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3Q6IEludmVzdG1lbnRJZGVhR2VuZXJhdGlvblJlcXVlc3QgPSB7XG4gICAgICAgIGlkOiAndGVzdC1yZXF1ZXN0LTEnLFxuICAgICAgICB1c2VySWQ6ICd1c2VyLTEyMycsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAuLi5jcmVhdGVWYWxpZFBhcmFtZXRlcnMoKSxcbiAgICAgICAgICBnZW9ncmFwaGljRm9jdXM6IFsnaW52YWxpZC1yZWdpb24nIGFzIGFueV1cbiAgICAgICAgfSxcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIHN0YXR1czogJ3N1Ym1pdHRlZCdcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UudmFsaWRhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZmllbGQ6ICdnZW9ncmFwaGljRm9jdXNbMF0nLFxuICAgICAgICAgIGNvZGU6ICdJTlZBTElEX0dFT0dSQVBISUNfUkVHSU9OJyxcbiAgICAgICAgICBzZXZlcml0eTogJ2Vycm9yJ1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgY29uZmlkZW5jZSByYW5nZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3Q6IEludmVzdG1lbnRJZGVhR2VuZXJhdGlvblJlcXVlc3QgPSB7XG4gICAgICAgIGlkOiAndGVzdC1yZXF1ZXN0LTEnLFxuICAgICAgICB1c2VySWQ6ICd1c2VyLTEyMycsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAuLi5jcmVhdGVWYWxpZFBhcmFtZXRlcnMoKSxcbiAgICAgICAgICBtaW5pbXVtQ29uZmlkZW5jZTogMTUwXG4gICAgICAgIH0sXG4gICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICBzdGF0dXM6ICdzdWJtaXR0ZWQnXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzZXJ2aWNlLnZhbGlkYXRlUmVxdWVzdChyZXF1ZXN0KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5pc1ZhbGlkKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3JzKS50b0NvbnRhaW5FcXVhbChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIGZpZWxkOiAnbWluaW11bUNvbmZpZGVuY2UnLFxuICAgICAgICAgIGNvZGU6ICdJTlZBTElEX0NPTkZJREVOQ0VfUkFOR0UnLFxuICAgICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSBtYXhpbXVtIGlkZWFzIHJhbmdlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdDogSW52ZXN0bWVudElkZWFHZW5lcmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgaWQ6ICd0ZXN0LXJlcXVlc3QtMScsXG4gICAgICAgIHVzZXJJZDogJ3VzZXItMTIzJyxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIC4uLmNyZWF0ZVZhbGlkUGFyYW1ldGVycygpLFxuICAgICAgICAgIG1heGltdW1JZGVhczogMjVcbiAgICAgICAgfSxcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIHN0YXR1czogJ3N1Ym1pdHRlZCdcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UudmFsaWRhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZmllbGQ6ICdtYXhpbXVtSWRlYXMnLFxuICAgICAgICAgIGNvZGU6ICdJTlZBTElEX01BWF9JREVBU19SQU5HRScsXG4gICAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHdhcm4gYWJvdXQgaGlnaCBtYXhpbXVtIGlkZWFzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdDogSW52ZXN0bWVudElkZWFHZW5lcmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgaWQ6ICd0ZXN0LXJlcXVlc3QtMScsXG4gICAgICAgIHVzZXJJZDogJ3VzZXItMTIzJyxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIC4uLmNyZWF0ZVZhbGlkUGFyYW1ldGVycygpLFxuICAgICAgICAgIG1heGltdW1JZGVhczogMTVcbiAgICAgICAgfSxcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIHN0YXR1czogJ3N1Ym1pdHRlZCdcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UudmFsaWRhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QocmVzdWx0Lndhcm5pbmdzKS50b0NvbnRhaW5FcXVhbChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIGZpZWxkOiAnbWF4aW11bUlkZWFzJyxcbiAgICAgICAgICBjb2RlOiAnSElHSF9NQVhfSURFQVMnXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSByZXNlYXJjaCBkZXB0aCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3Q6IEludmVzdG1lbnRJZGVhR2VuZXJhdGlvblJlcXVlc3QgPSB7XG4gICAgICAgIGlkOiAndGVzdC1yZXF1ZXN0LTEnLFxuICAgICAgICB1c2VySWQ6ICd1c2VyLTEyMycsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAuLi5jcmVhdGVWYWxpZFBhcmFtZXRlcnMoKSxcbiAgICAgICAgICByZXNlYXJjaERlcHRoOiAnaW52YWxpZC1kZXB0aCcgYXMgYW55XG4gICAgICAgIH0sXG4gICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICBzdGF0dXM6ICdzdWJtaXR0ZWQnXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzZXJ2aWNlLnZhbGlkYXRlUmVxdWVzdChyZXF1ZXN0KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5pc1ZhbGlkKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3JzKS50b0NvbnRhaW5FcXVhbChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIGZpZWxkOiAncmVzZWFyY2hEZXB0aCcsXG4gICAgICAgICAgY29kZTogJ0lOVkFMSURfUkVTRUFSQ0hfREVQVEgnLFxuICAgICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSBsaXF1aWRpdHkgcmVxdWlyZW1lbnQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0OiBJbnZlc3RtZW50SWRlYUdlbmVyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICBpZDogJ3Rlc3QtcmVxdWVzdC0xJyxcbiAgICAgICAgdXNlcklkOiAndXNlci0xMjMnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgLi4uY3JlYXRlVmFsaWRQYXJhbWV0ZXJzKCksXG4gICAgICAgICAgbGlxdWlkaXR5UmVxdWlyZW1lbnQ6ICdpbnZhbGlkLWxpcXVpZGl0eScgYXMgYW55XG4gICAgICAgIH0sXG4gICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICBzdGF0dXM6ICdzdWJtaXR0ZWQnXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzZXJ2aWNlLnZhbGlkYXRlUmVxdWVzdChyZXF1ZXN0KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5pc1ZhbGlkKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3JzKS50b0NvbnRhaW5FcXVhbChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIGZpZWxkOiAnbGlxdWlkaXR5UmVxdWlyZW1lbnQnLFxuICAgICAgICAgIGNvZGU6ICdJTlZBTElEX0xJUVVJRElUWV9SRVFVSVJFTUVOVCcsXG4gICAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHZhbGlkYXRlIG91dHB1dCBmb3JtYXQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0OiBJbnZlc3RtZW50SWRlYUdlbmVyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICBpZDogJ3Rlc3QtcmVxdWVzdC0xJyxcbiAgICAgICAgdXNlcklkOiAndXNlci0xMjMnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgLi4uY3JlYXRlVmFsaWRQYXJhbWV0ZXJzKCksXG4gICAgICAgICAgb3V0cHV0Rm9ybWF0OiAnaW52YWxpZC1mb3JtYXQnIGFzIGFueVxuICAgICAgICB9LFxuICAgICAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgc3RhdHVzOiAnc3VibWl0dGVkJ1xuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VydmljZS52YWxpZGF0ZVJlcXVlc3QocmVxdWVzdCk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuaXNWYWxpZCkudG9CZShmYWxzZSk7XG4gICAgICBleHBlY3QocmVzdWx0LmVycm9ycykudG9Db250YWluRXF1YWwoXG4gICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICBmaWVsZDogJ291dHB1dEZvcm1hdCcsXG4gICAgICAgICAgY29kZTogJ0lOVkFMSURfT1VUUFVUX0ZPUk1BVCcsXG4gICAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdjcm9zcy12YWxpZGF0aW9uJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgd2FybiBhYm91dCBjb25mbGljdGluZyByaXNrIHRvbGVyYW5jZSBhbmQgaW52ZXN0bWVudCBob3Jpem9uJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdDogSW52ZXN0bWVudElkZWFHZW5lcmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgaWQ6ICd0ZXN0LXJlcXVlc3QtMScsXG4gICAgICAgIHVzZXJJZDogJ3VzZXItMTIzJyxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiAnaW50cmFkYXknLFxuICAgICAgICAgIHJpc2tUb2xlcmFuY2U6ICd2ZXJ5LWNvbnNlcnZhdGl2ZSdcbiAgICAgICAgfSxcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIHN0YXR1czogJ3N1Ym1pdHRlZCdcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UudmFsaWRhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QocmVzdWx0Lndhcm5pbmdzKS50b0NvbnRhaW5FcXVhbChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIGZpZWxkOiAncmlza1RvbGVyYW5jZScsXG4gICAgICAgICAgY29kZTogJ0NPTkZMSUNUSU5HX1JJU0tfSE9SSVpPTidcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHdhcm4gYWJvdXQgY29uZmxpY3RpbmcgcmlzayB0b2xlcmFuY2UgYW5kIGFzc2V0IGNsYXNzZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0OiBJbnZlc3RtZW50SWRlYUdlbmVyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICBpZDogJ3Rlc3QtcmVxdWVzdC0xJyxcbiAgICAgICAgdXNlcklkOiAndXNlci0xMjMnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdsb25nLXRlcm0nLFxuICAgICAgICAgIHJpc2tUb2xlcmFuY2U6ICd2ZXJ5LWNvbnNlcnZhdGl2ZScsXG4gICAgICAgICAgYXNzZXRDbGFzc2VzOiBbJ2NyeXB0b2N1cnJlbmNpZXMnXVxuICAgICAgICB9LFxuICAgICAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgc3RhdHVzOiAnc3VibWl0dGVkJ1xuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VydmljZS52YWxpZGF0ZVJlcXVlc3QocmVxdWVzdCk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuaXNWYWxpZCkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQud2FybmluZ3MpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZmllbGQ6ICdhc3NldENsYXNzZXMnLFxuICAgICAgICAgIGNvZGU6ICdDT05GTElDVElOR19SSVNLX0FTU0VUUydcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGRldGVjdCBjb25mbGljdGluZyBzZWN0b3JzIGFuZCBleGNsdWRlZCBzZWN0b3JzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdDogSW52ZXN0bWVudElkZWFHZW5lcmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgaWQ6ICd0ZXN0LXJlcXVlc3QtMScsXG4gICAgICAgIHVzZXJJZDogJ3VzZXItMTIzJyxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiAnbWVkaXVtLXRlcm0nLFxuICAgICAgICAgIHJpc2tUb2xlcmFuY2U6ICdtb2RlcmF0ZScsXG4gICAgICAgICAgc2VjdG9yczogWyd0ZWNobm9sb2d5JywgJ2hlYWx0aGNhcmUnXSxcbiAgICAgICAgICBleGNsdWRlZFNlY3RvcnM6IFsndGVjaG5vbG9neScsICdmaW5hbmNlJ11cbiAgICAgICAgfSxcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIHN0YXR1czogJ3N1Ym1pdHRlZCdcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UudmFsaWRhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZmllbGQ6ICdzZWN0b3JzJyxcbiAgICAgICAgICBjb2RlOiAnQ09ORkxJQ1RJTkdfU0VDVE9SUycsXG4gICAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcidcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdjYWxsYmFjayB2YWxpZGF0aW9uJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgY2FsbGJhY2sgVVJMJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdDogSW52ZXN0bWVudElkZWFHZW5lcmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgaWQ6ICd0ZXN0LXJlcXVlc3QtMScsXG4gICAgICAgIHVzZXJJZDogJ3VzZXItMTIzJyxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiAnbWVkaXVtLXRlcm0nLFxuICAgICAgICAgIHJpc2tUb2xlcmFuY2U6ICdtb2RlcmF0ZSdcbiAgICAgICAgfSxcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIHN0YXR1czogJ3N1Ym1pdHRlZCcsXG4gICAgICAgIGNhbGxiYWNrOiB7XG4gICAgICAgICAgdXJsOiAnaW52YWxpZC11cmwnXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UudmFsaWRhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZmllbGQ6ICdjYWxsYmFjay51cmwnLFxuICAgICAgICAgIGNvZGU6ICdJTlZBTElEX0NBTExCQUNLX1VSTF9GT1JNQVQnLFxuICAgICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSBjYWxsYmFjayBtZXRob2QnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0OiBJbnZlc3RtZW50SWRlYUdlbmVyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICBpZDogJ3Rlc3QtcmVxdWVzdC0xJyxcbiAgICAgICAgdXNlcklkOiAndXNlci0xMjMnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdtZWRpdW0tdGVybScsXG4gICAgICAgICAgcmlza1RvbGVyYW5jZTogJ21vZGVyYXRlJ1xuICAgICAgICB9LFxuICAgICAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgc3RhdHVzOiAnc3VibWl0dGVkJyxcbiAgICAgICAgY2FsbGJhY2s6IHtcbiAgICAgICAgICB1cmw6ICdodHRwczovL2V4YW1wbGUuY29tL2NhbGxiYWNrJyxcbiAgICAgICAgICBtZXRob2Q6ICdHRVQnIGFzIGFueVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzZXJ2aWNlLnZhbGlkYXRlUmVxdWVzdChyZXF1ZXN0KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5pc1ZhbGlkKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3JzKS50b0NvbnRhaW5FcXVhbChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIGZpZWxkOiAnY2FsbGJhY2subWV0aG9kJyxcbiAgICAgICAgICBjb2RlOiAnSU5WQUxJRF9DQUxMQkFDS19NRVRIT0QnLFxuICAgICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgncHJpb3JpdHkgdmFsaWRhdGlvbicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHZhbGlkYXRlIHByaW9yaXR5IHZhbHVlcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3Q6IEludmVzdG1lbnRJZGVhR2VuZXJhdGlvblJlcXVlc3QgPSB7XG4gICAgICAgIGlkOiAndGVzdC1yZXF1ZXN0LTEnLFxuICAgICAgICB1c2VySWQ6ICd1c2VyLTEyMycsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ21lZGl1bS10ZXJtJyxcbiAgICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnXG4gICAgICAgIH0sXG4gICAgICAgIHByaW9yaXR5OiAnaW52YWxpZC1wcmlvcml0eScgYXMgYW55LFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIHN0YXR1czogJ3N1Ym1pdHRlZCdcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UudmFsaWRhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmlzVmFsaWQpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgZmllbGQ6ICdwcmlvcml0eScsXG4gICAgICAgICAgY29kZTogJ0lOVkFMSURfUFJJT1JJVFknLFxuICAgICAgICAgIHNldmVyaXR5OiAnZXJyb3InXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuICB9KTtcbn0pOyJdfQ==