/**
 * User profile management routes
 */

import { Router, Request, Response } from 'express';
import { authService } from '../../services/auth-service';
import { authenticateUser, checkPermissions } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { PERMISSIONS } from '../../models/user';

const router = Router();

/**
 * Get user profile
 * GET /api/profile
 */
router.get('/', authenticateUser, async (req: Request, res: Response) => {
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
      data: {
        profile: user.profile,
        preferences: user.preferences,
        role: user.role,
        permissions: user.permissions,
        organizationId: user.organizationId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Update user profile
 * PUT /api/profile
 */
router.put('/', authenticateUser, validateRequest, async (req: Request, res: Response) => {
  try {
    const user = await authService.updateUser(req.user!.userId, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile: user.profile,
        preferences: user.preferences,
        updatedAt: user.updatedAt
      }
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
 * Update user preferences
 * PUT /api/profile/preferences
 */
router.put('/preferences', authenticateUser, validateRequest, async (req: Request, res: Response) => {
  try {
    const user = await authService.updateUser(req.user!.userId, {
      preferences: req.body
    });
    
    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferences: user.preferences,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(400).json({
      success: false,
      error: 'Preferences update failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Get user preferences
 * GET /api/profile/preferences
 */
router.get('/preferences', authenticateUser, async (req: Request, res: Response) => {
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
      message: 'User preferences retrieved successfully',
      data: user.preferences
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve preferences',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Update notification settings
 * PUT /api/profile/notifications
 */
router.put('/notifications', authenticateUser, validateRequest, async (req: Request, res: Response) => {
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

    const updatedUser = await authService.updateUser(req.user!.userId, {
      preferences: {
        ...user.preferences,
        notificationSettings: {
          ...user.preferences.notificationSettings,
          ...req.body
        }
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully',
      data: {
        notificationSettings: updatedUser.preferences.notificationSettings,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(400).json({
      success: false,
      error: 'Notification settings update failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Get user activity summary (admin only)
 * GET /api/profile/activity/:userId
 */
router.get('/activity/:userId', 
  authenticateUser, 
  checkPermissions([PERMISSIONS.USER_READ]), 
  async (req: Request, res: Response) => {
    try {
      const user = await authService.getUserById(req.params.userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'User with specified ID not found'
        });
        return;
      }
      
      // Return basic activity information
      res.status(200).json({
        success: true,
        message: 'User activity retrieved successfully',
        data: {
          userId: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLoginAt: user.lastLoginAt
        }
      });
    } catch (error) {
      console.error('Get user activity error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user activity',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }
);

export default router;