// Export all models from this file

// User models
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

// Re-export all models from their respective files
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

// Validation utilities
export class ValidationError extends Error {
  constructor(message: string, public field?: string, public code?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export const validateInvestment = (investment: any): ValidationResult => {
  const errors: ValidationError[] = [];
  
  // Required fields
  if (!investment.id) errors.push(new ValidationError('Investment ID is required', 'id', 'REQUIRED'));
  if (!investment.name) errors.push(new ValidationError('Investment name is required', 'name', 'REQUIRED'));
  if (!investment.type) errors.push(new ValidationError('Investment type is required', 'type', 'REQUIRED'));
  if (!investment.description) errors.push(new ValidationError('Investment description is required', 'description', 'REQUIRED'));
  
  // Type validation
  if (investment.type && !['stock', 'bond', 'etf', 'mutual-fund', 'commodity', 'cryptocurrency', 'real-estate', 'other'].includes(investment.type)) {
    errors.push(new ValidationError('Invalid investment type', 'type', 'INVALID_TYPE'));
  }
  
  // Numeric validations
  if (investment.currentPrice !== undefined && (isNaN(investment.currentPrice) || investment.currentPrice < 0)) {
    errors.push(new ValidationError('Current price must be a positive number', 'currentPrice', 'INVALID_NUMBER'));
  }
  
  if (investment.marketCap !== undefined && (isNaN(investment.marketCap) || investment.marketCap < 0)) {
    errors.push(new ValidationError('Market cap must be a positive number', 'marketCap', 'INVALID_NUMBER'));
  }
  
  // Array validations
  if (!Array.isArray(investment.historicalPerformance)) {
    errors.push(new ValidationError('Historical performance must be an array', 'historicalPerformance', 'INVALID_ARRAY'));
  }
  
  if (!Array.isArray(investment.relatedInvestments)) {
    errors.push(new ValidationError('Related investments must be an array', 'relatedInvestments', 'INVALID_ARRAY'));
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateAnalysisResult = (analysis: any): ValidationResult => {
  const errors: ValidationError[] = [];
  
  // Required fields
  if (!analysis.id) errors.push(new ValidationError('Analysis ID is required', 'id', 'REQUIRED'));
  if (!analysis.investmentId) errors.push(new ValidationError('Investment ID is required', 'investmentId', 'REQUIRED'));
  if (!analysis.analysisType) errors.push(new ValidationError('Analysis type is required', 'analysisType', 'REQUIRED'));
  if (!analysis.timestamp) errors.push(new ValidationError('Timestamp is required', 'timestamp', 'REQUIRED'));
  if (!analysis.summary) errors.push(new ValidationError('Summary is required', 'summary', 'REQUIRED'));
  
  // Type validation
  if (analysis.analysisType && !['fundamental', 'technical', 'sentiment', 'risk', 'comprehensive'].includes(analysis.analysisType)) {
    errors.push(new ValidationError('Invalid analysis type', 'analysisType', 'INVALID_TYPE'));
  }
  
  // Numeric validations
  if (analysis.confidence !== undefined && (isNaN(analysis.confidence) || analysis.confidence < 0 || analysis.confidence > 1)) {
    errors.push(new ValidationError('Confidence must be a number between 0 and 1', 'confidence', 'INVALID_NUMBER'));
  }
  
  // Object validations
  if (!analysis.details || typeof analysis.details !== 'object') {
    errors.push(new ValidationError('Analysis details are required and must be an object', 'details', 'INVALID_OBJECT'));
  }
  
  // Array validations
  if (!Array.isArray(analysis.recommendations)) {
    errors.push(new ValidationError('Recommendations must be an array', 'recommendations', 'INVALID_ARRAY'));
  }
  
  if (!Array.isArray(analysis.dataPoints)) {
    errors.push(new ValidationError('Data points must be an array', 'dataPoints', 'INVALID_ARRAY'));
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateUserRequest = (request: any): ValidationResult => {
  const errors: ValidationError[] = [];
  
  // Required fields
  if (!request.id) errors.push(new ValidationError('Request ID is required', 'id', 'REQUIRED'));
  if (!request.userId) errors.push(new ValidationError('User ID is required', 'userId', 'REQUIRED'));
  if (!request.requestType) errors.push(new ValidationError('Request type is required', 'requestType', 'REQUIRED'));
  if (!request.timestamp) errors.push(new ValidationError('Timestamp is required', 'timestamp', 'REQUIRED'));
  if (!request.status) errors.push(new ValidationError('Status is required', 'status', 'REQUIRED'));
  
  // Type validation
  const validRequestTypes = [
    'investment-idea-generation',
    'investment-analysis',
    'market-research',
    'portfolio-optimization',
    'risk-assessment',
    'compliance-check'
  ];
  
  if (request.requestType && !validRequestTypes.includes(request.requestType)) {
    errors.push(new ValidationError('Invalid request type', 'requestType', 'INVALID_TYPE'));
  }
  
  const validStatusTypes = [
    'submitted',
    'queued',
    'processing',
    'completed',
    'failed',
    'cancelled'
  ];
  
  if (request.status && !validStatusTypes.includes(request.status)) {
    errors.push(new ValidationError('Invalid status', 'status', 'INVALID_TYPE'));
  }
  
  // Object validations
  if (!request.parameters || typeof request.parameters !== 'object') {
    errors.push(new ValidationError('Parameters are required and must be an object', 'parameters', 'INVALID_OBJECT'));
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};