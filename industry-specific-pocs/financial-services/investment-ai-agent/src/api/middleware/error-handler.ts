import { Request, Response, NextFunction } from 'express';

/**
 * Error response interface
 */
export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  requestId: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  suggestedAction?: string;
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any,
    public severity: 'info' | 'warning' | 'error' | 'critical' = 'error',
    public suggestedAction?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Global error handling middleware
 */
export const errorHandlerMiddleware = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error caught by error handler:', err);

  // Default error response
  const errorResponse: ErrorResponse = {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    timestamp: new Date(),
    requestId: req.headers['x-request-id']?.toString() || 'unknown',
    severity: 'error'
  };

  // If it's our custom ApiError, use its properties
  if (err instanceof ApiError) {
    errorResponse.code = err.code;
    errorResponse.message = err.message;
    errorResponse.details = err.details;
    errorResponse.severity = err.severity;
    errorResponse.suggestedAction = err.suggestedAction;

    return res.status(err.statusCode).json(errorResponse);
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    errorResponse.code = 'VALIDATION_ERROR';
    errorResponse.message = err.message;
    errorResponse.severity = 'warning';
    errorResponse.suggestedAction = 'Check your request parameters and try again';

    return res.status(400).json(errorResponse);
  }

  if (err.name === 'UnauthorizedError') {
    errorResponse.code = 'UNAUTHORIZED';
    errorResponse.message = 'Authentication required';
    errorResponse.severity = 'warning';
    errorResponse.suggestedAction = 'Please provide valid authentication credentials';

    return res.status(401).json(errorResponse);
  }

  // For all other errors, return a generic 500 response
  return res.status(500).json(errorResponse);
};