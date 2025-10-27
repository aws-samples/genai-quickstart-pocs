export interface User {
    id: string;
    organizationId: string;
    role: 'analyst' | 'portfolio-manager' | 'compliance-officer' | 'administrator';
    permissions: string[];
    preferences: UserPreferences;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserPreferences {
    investmentHorizon: 'short' | 'medium' | 'long';
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    preferredSectors: string[];
    preferredAssetClasses: string[];
    excludedInvestments: string[];
    notificationSettings: NotificationSettings;
}
export interface NotificationSettings {
    email: boolean;
    push: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
    types: {
        ideaGeneration: boolean;
        marketAlerts: boolean;
        complianceIssues: boolean;
        systemUpdates: boolean;
    };
}
export * from './investment';
export * from './analysis';
export * from './investment-idea';
export * from './request';
export * from './services';
export * from './proprietary-data';
export * from './market-data';
export * from './bedrock';
export * from './agent';
export * from './feedback';
export declare class ValidationError extends Error {
    field?: string | undefined;
    code?: string | undefined;
    constructor(message: string, field?: string | undefined, code?: string | undefined);
}
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}
export declare const validateInvestment: (investment: any) => ValidationResult;
export declare const validateAnalysisResult: (analysis: any) => ValidationResult;
export declare const validateUserRequest: (request: any) => ValidationResult;
