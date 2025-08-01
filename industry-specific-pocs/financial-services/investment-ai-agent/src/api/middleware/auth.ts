/**
 * Authentication middleware
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from '../../services/auth-service';

/**
 * Extend Express Request type to include user
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        organizationId: string;
        role: string;
        permissions: string[];
      };
    }
  }
}

/**
 * Middleware to authenticate users
 * @param req The request object
 * @param res The response object
 * @param next The next function
 */
export const authenticateUser = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'No token provided' 
      });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token using auth service
    const decoded = authService.verifyToken(token);
    
    // Add user to request
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ 
      error: 'Authentication failed',
      message: 'Invalid or expired token' 
    });
  }
};

/**
 * Middleware to check if user has required permissions
 * @param permissions The permissions required
 * @returns Middleware function
 */
export const checkPermissions = (permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if user exists
      if (!req.user) {
        res.status(401).json({ 
          error: 'Authentication required',
          message: 'User not authenticated' 
        });
        return;
      }
      
      // Check if user has required permissions
      const hasPermission = permissions.every(permission => 
        req.user!.permissions.includes(permission)
      );
      
      if (!hasPermission) {
        res.status(403).json({ 
          error: 'Insufficient permissions',
          message: `Required permissions: ${permissions.join(', ')}`,
          userPermissions: req.user.permissions
        });
        return;
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ 
        error: 'Authorization error',
        message: 'Error checking permissions' 
      });
    }
  };
};

/**
 * Middleware to check if user has required role
 * @param roles The roles required
 * @returns Middleware function
 */
export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if user exists
      if (!req.user) {
        res.status(401).json({ 
          error: 'Authentication required',
          message: 'User not authenticated' 
        });
        return;
      }
      
      // Check if user has required role
      if (!roles.includes(req.user.role)) {
        res.status(403).json({ 
          error: 'Insufficient role',
          message: `Required roles: ${roles.join(', ')}`,
          userRole: req.user.role
        });
        return;
      }
      
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ 
        error: 'Authorization error',
        message: 'Error checking role' 
      });
    }
  };
};