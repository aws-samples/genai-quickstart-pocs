/**
 * Tests for Request Validation Service
 */

import { RequestValidationService } from '../request-validation-service';
import { 
  InvestmentIdeaGenerationRequest,
  InvestmentIdeaRequestParameters
} from '../../models/investment-idea-request';

describe('RequestValidationService', () => {
  let service: RequestValidationService;

  beforeEach(() => {
    service = new RequestValidationService();
  });

  describe('validateRequest', () => {
    const createValidRequest = (): InvestmentIdeaGenerationRequest => ({
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
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'id',
          code: 'INVALID_REQUEST_ID',
          severity: 'critical'
        })
      );
    });

    it('should reject request with missing user ID', async () => {
      const request = createValidRequest();
      request.userId = '';

      const result = await service.validateRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'userId',
          code: 'INVALID_USER_ID',
          severity: 'critical'
        })
      );
    });

    it('should reject request with invalid timestamp', async () => {
      const request = createValidRequest();
      (request.timestamp as any) = 'invalid-date';

      const result = await service.validateRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'timestamp',
          code: 'INVALID_TIMESTAMP',
          severity: 'error'
        })
      );
    });

    it('should reject request with missing parameters', async () => {
      const request = createValidRequest();
      delete (request as any).parameters;

      const result = await service.validateRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'parameters',
          code: 'MISSING_PARAMETERS',
          severity: 'critical'
        })
      );
    });
  });

  describe('parameter validation', () => {
    const createValidParameters = (): InvestmentIdeaRequestParameters => ({
      investmentHorizon: 'medium-term',
      riskTolerance: 'moderate'
    });

    it('should validate valid parameters', async () => {
      const request: InvestmentIdeaGenerationRequest = {
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
      const request: InvestmentIdeaGenerationRequest = {
        id: 'test-request-1',
        userId: 'user-123',
        parameters: {
          ...createValidParameters(),
          investmentHorizon: 'invalid-horizon' as any
        },
        priority: 'medium',
        timestamp: new Date(),
        status: 'submitted'
      };

      const result = await service.validateRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'investmentHorizon',
          code: 'INVALID_TIME_HORIZON',
          severity: 'error'
        })
      );
    });

    it('should reject invalid risk tolerance', async () => {
      const request: InvestmentIdeaGenerationRequest = {
        id: 'test-request-1',
        userId: 'user-123',
        parameters: {
          ...createValidParameters(),
          riskTolerance: 'invalid-risk' as any
        },
        priority: 'medium',
        timestamp: new Date(),
        status: 'submitted'
      };

      const result = await service.validateRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'riskTolerance',
          code: 'INVALID_RISK_TOLERANCE',
          severity: 'error'
        })
      );
    });

    it('should validate investment amount range', async () => {
      const request: InvestmentIdeaGenerationRequest = {
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
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'investmentAmount',
          code: 'INVALID_INVESTMENT_AMOUNT',
          severity: 'error'
        })
      );
    });

    it('should warn about low investment amount', async () => {
      const request: InvestmentIdeaGenerationRequest = {
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
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'investmentAmount',
          code: 'LOW_INVESTMENT_AMOUNT'
        })
      );
    });

    it('should validate currency codes', async () => {
      const request: InvestmentIdeaGenerationRequest = {
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
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'currency',
          code: 'INVALID_CURRENCY',
          severity: 'error'
        })
      );
    });

    it('should validate sectors array', async () => {
      const request: InvestmentIdeaGenerationRequest = {
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
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'sectors',
          code: 'TOO_MANY_SECTORS',
          severity: 'error'
        })
      );
    });

    it('should warn about single sector focus', async () => {
      const request: InvestmentIdeaGenerationRequest = {
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
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'sectors',
          code: 'SINGLE_SECTOR_FOCUS'
        })
      );
    });

    it('should validate asset classes', async () => {
      const request: InvestmentIdeaGenerationRequest = {
        id: 'test-request-1',
        userId: 'user-123',
        parameters: {
          ...createValidParameters(),
          assetClasses: ['invalid-asset-class' as any]
        },
        priority: 'medium',
        timestamp: new Date(),
        status: 'submitted'
      };

      const result = await service.validateRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'assetClasses[0]',
          code: 'INVALID_ASSET_CLASS',
          severity: 'error'
        })
      );
    });

    it('should validate geographic focus', async () => {
      const request: InvestmentIdeaGenerationRequest = {
        id: 'test-request-1',
        userId: 'user-123',
        parameters: {
          ...createValidParameters(),
          geographicFocus: ['invalid-region' as any]
        },
        priority: 'medium',
        timestamp: new Date(),
        status: 'submitted'
      };

      const result = await service.validateRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'geographicFocus[0]',
          code: 'INVALID_GEOGRAPHIC_REGION',
          severity: 'error'
        })
      );
    });

    it('should validate confidence range', async () => {
      const request: InvestmentIdeaGenerationRequest = {
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
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'minimumConfidence',
          code: 'INVALID_CONFIDENCE_RANGE',
          severity: 'error'
        })
      );
    });

    it('should validate maximum ideas range', async () => {
      const request: InvestmentIdeaGenerationRequest = {
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
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'maximumIdeas',
          code: 'INVALID_MAX_IDEAS_RANGE',
          severity: 'error'
        })
      );
    });

    it('should warn about high maximum ideas', async () => {
      const request: InvestmentIdeaGenerationRequest = {
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
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'maximumIdeas',
          code: 'HIGH_MAX_IDEAS'
        })
      );
    });

    it('should validate research depth', async () => {
      const request: InvestmentIdeaGenerationRequest = {
        id: 'test-request-1',
        userId: 'user-123',
        parameters: {
          ...createValidParameters(),
          researchDepth: 'invalid-depth' as any
        },
        priority: 'medium',
        timestamp: new Date(),
        status: 'submitted'
      };

      const result = await service.validateRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'researchDepth',
          code: 'INVALID_RESEARCH_DEPTH',
          severity: 'error'
        })
      );
    });

    it('should validate liquidity requirement', async () => {
      const request: InvestmentIdeaGenerationRequest = {
        id: 'test-request-1',
        userId: 'user-123',
        parameters: {
          ...createValidParameters(),
          liquidityRequirement: 'invalid-liquidity' as any
        },
        priority: 'medium',
        timestamp: new Date(),
        status: 'submitted'
      };

      const result = await service.validateRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'liquidityRequirement',
          code: 'INVALID_LIQUIDITY_REQUIREMENT',
          severity: 'error'
        })
      );
    });

    it('should validate output format', async () => {
      const request: InvestmentIdeaGenerationRequest = {
        id: 'test-request-1',
        userId: 'user-123',
        parameters: {
          ...createValidParameters(),
          outputFormat: 'invalid-format' as any
        },
        priority: 'medium',
        timestamp: new Date(),
        status: 'submitted'
      };

      const result = await service.validateRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'outputFormat',
          code: 'INVALID_OUTPUT_FORMAT',
          severity: 'error'
        })
      );
    });
  });

  describe('cross-validation', () => {
    it('should warn about conflicting risk tolerance and investment horizon', async () => {
      const request: InvestmentIdeaGenerationRequest = {
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
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'riskTolerance',
          code: 'CONFLICTING_RISK_HORIZON'
        })
      );
    });

    it('should warn about conflicting risk tolerance and asset classes', async () => {
      const request: InvestmentIdeaGenerationRequest = {
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
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'assetClasses',
          code: 'CONFLICTING_RISK_ASSETS'
        })
      );
    });

    it('should detect conflicting sectors and excluded sectors', async () => {
      const request: InvestmentIdeaGenerationRequest = {
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
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'sectors',
          code: 'CONFLICTING_SECTORS',
          severity: 'error'
        })
      );
    });
  });

  describe('callback validation', () => {
    it('should validate callback URL', async () => {
      const request: InvestmentIdeaGenerationRequest = {
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
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'callback.url',
          code: 'INVALID_CALLBACK_URL_FORMAT',
          severity: 'error'
        })
      );
    });

    it('should validate callback method', async () => {
      const request: InvestmentIdeaGenerationRequest = {
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
          method: 'GET' as any
        }
      };

      const result = await service.validateRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'callback.method',
          code: 'INVALID_CALLBACK_METHOD',
          severity: 'error'
        })
      );
    });
  });

  describe('priority validation', () => {
    it('should validate priority values', async () => {
      const request: InvestmentIdeaGenerationRequest = {
        id: 'test-request-1',
        userId: 'user-123',
        parameters: {
          investmentHorizon: 'medium-term',
          riskTolerance: 'moderate'
        },
        priority: 'invalid-priority' as any,
        timestamp: new Date(),
        status: 'submitted'
      };

      const result = await service.validateRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'priority',
          code: 'INVALID_PRIORITY',
          severity: 'error'
        })
      );
    });
  });
});