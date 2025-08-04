/**
 * Authentication routes
 */

import { Router, Request, Response } from 'express';
import { authService } from '../../services/auth-service';
import { authenticateUser, checkPermissions } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { PERMISSIONS } from '../../models/user';

const router = Router();

/**
 * Register a new user
 * POST /api/auth/register
 */
router.post('/register', validateRequest, async (req: Request, res: Response) => {
  try {
    const result = await authService.registerUser(req.body);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      error: 'Registration failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', validateRequest, async (req: Request, res: Response) => {
  try {
    const result = await authService.loginUser(req.body);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: 'Login failed',
      message: error instanceof Error ? error.message : 'Invalid credentials'
    });
  }
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
router.post('/refresh', validateRequest, async (req: Request, res: Response) => {
  try {
    const result = await authService.refreshToken(req.body);
    
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Token refresh failed',
      message: error instanceof Error ? error.message : 'Invalid refresh token'
    });
  }
});

/**
 * Logout user
 * POST /api/auth/logout
 */
router.post('/logout', authenticateUser, async (req: Request, res: Response) => {
  try {
    const refreshToken = req.body.refreshToken;
    await authService.logoutUser(req.user!.userId, refreshToken);
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
router.get('/me', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = await authService.getUserById(req.user!.userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User profile not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user profile',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Update user profile and preferences
 * PUT /api/auth/profile
 */
router.put('/profile', authenticateUser, validateRequest, async (req: Request, res: Response) => {
  try {
    const user = await authService.updateUser(req.user!.userId, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({
      success: false,
      error: 'Profile update failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Change password
 * POST /api/auth/change-password
 */
router.post('/change-password', authenticateUser, validateRequest, async (req: Request, res: Response) => {
  try {
    await authService.changePassword(req.user!.userId, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({
      success: false,
      error: 'Password change failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', validateRequest, async (req: Request, res: Response) => {
  try {
    await authService.requestPasswordReset(req.body);
    
    // Always return success to prevent email enumeration
    res.status(200).json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(200).json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });
  }
});

/**
 * Confirm password reset
 * POST /api/auth/reset-password
 */
router.post('/reset-password', validateRequest, async (req: Request, res: Response) => {
  try {
    await authService.confirmPasswordReset(req.body);
    
    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(400).json({
      success: false,
      error: 'Password reset failed',
      message: error instanceof Error ? error.message : 'Invalid or expired reset token'
    });
  }
});

/**
 * Get user by ID (admin only)
 * GET /api/auth/users/:id
 */
router.get('/users/:id', 
  authenticateUser, 
  checkPermissions([PERMISSIONS.USER_READ]), 
  async (req: Request, res: Response) => {
    try {
      const user = await authService.getUserById(req.params.id);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'User with specified ID not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }
);

export default router;