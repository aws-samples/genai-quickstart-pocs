/**
 * Integration test setup and utilities
 */
import express from 'express';
import request from 'supertest';
export declare const integrationTestUtils: {
    createTestServer: () => import("express-serve-static-core").Express;
    createAuthenticatedRequest: (server: express.Application, token?: string) => import("supertest/lib/agent")<request.SuperTestStatic.Test>;
    generateTestToken: (payload?: any) => any;
    createTestUser: () => {
        id: string;
        email: string;
        organizationId: string;
        role: string;
        preferences: {
            investmentHorizon: string;
            riskTolerance: string;
            preferredSectors: string[];
            preferredAssetClasses: string[];
        };
    };
    createTestInvestmentIdeaRequest: () => {
        parameters: {
            investmentHorizon: string;
            riskTolerance: string;
            sectors: string[];
            assetClasses: string[];
            minimumConfidence: number;
            maximumIdeas: number;
        };
        context: {
            userPreferences: {
                excludedInvestments: never[];
                focusAreas: string[];
            };
        };
    };
    createTestProprietaryData: () => {
        name: string;
        description: string;
        type: string;
        format: string;
        data: {
            companies: {
                symbol: string;
                name: string;
                sector: string;
                marketCap: number;
                revenue: number;
                peRatio: number;
            }[];
            marketTrends: {
                trend: string;
                confidence: number;
                timeframe: string;
            }[];
        };
    };
    wait: (ms: number) => Promise<unknown>;
    validateApiResponse: (response: any, expectedFields: string[]) => void;
    validateInvestmentIdea: (idea: any) => void;
    validateErrorResponse: (response: any) => void;
};
export default integrationTestUtils;
